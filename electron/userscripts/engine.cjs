const { randomUUID } = require("node:crypto");
const { connectPatternMatches, isSensitiveUserScriptUrl, userScriptMatches } = require("./matcher.cjs");

const USER_SCRIPT_WORLD_ID = 1001;
const EXECUTION_TIMEOUT_MS = 3000;
const NETWORK_MAX_RESPONSE_BYTES = 1_048_576;
const NETWORK_MAX_REDIRECTS = 5;

function isLocalConnectHostname(hostname) {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(String(hostname || "").toLowerCase());
}

function classifyConnectTarget(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return { allowedProtocol: false, local: false, reason: "跨域请求 URL 无效" }; }
  const local = isLocalConnectHostname(url.hostname);
  const allowedProtocol = url.protocol === "https:" || (url.protocol === "http:" && local);
  return {
    allowedProtocol,
    local,
    hostname: url.hostname.toLowerCase().replace(/^\[|\]$/g, ""),
    protocol: url.protocol,
    reason: allowedProtocol ? (local ? "本机地址需要单独高级授权" : "") : "跨域请求只允许 HTTPS 或已批准的本机地址",
  };
}

async function readNetworkResponseWithLimit(response, maximumBytes = NETWORK_MAX_RESPONSE_BYTES) {
  const declaredLength = Number(response.headers?.get?.("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) throw new Error("跨域响应超过 1 MB 限制");
  const reader = response.body?.getReader?.();
  if (!reader) {
    const text = await response.text();
    if (Buffer.byteLength(text, "utf8") > maximumBytes) throw new Error("跨域响应超过 1 MB 限制");
    return text;
  }
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      size += chunk.length;
      if (size > maximumBytes) {
        await reader.cancel?.();
        throw new Error("跨域响应超过 1 MB 限制");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock?.();
  }
  return Buffer.concat(chunks, size).toString("utf8");
}

function safeMessage(value, fallback = "用户脚本执行失败") {
  return String(value || fallback)
    .replace(/(?:Authorization:\s*|Bearer\s+|token[=:]\s*|cookie[=:]\s*)\S+/gi, "[REDACTED]")
    .replace(/https?:\/\/[^\s]+/gi, "[URL]")
    .slice(0, 300);
}

function safeJsonValue(value) {
  const serialized = JSON.stringify(value);
  if (serialized === undefined || serialized.length > 65_536) throw new Error("脚本存储值无效或过大");
  return JSON.parse(serialized);
}

function timeoutPromise(milliseconds) {
  return new Promise((_, reject) => {
    const timer = setTimeout(() => reject(Object.assign(new Error("用户脚本执行超时"), { code: "USERSCRIPT_TIMEOUT" })), milliseconds);
    timer.unref?.();
  });
}

function runtimeWrapper(script, token) {
  const grants = JSON.stringify(script.grants || []);
  const info = JSON.stringify({ script: { name: script.name, namespace: script.namespace, version: script.version, description: script.description } });
  return `(() => {
    'use strict';
    const runtimeToken = ${JSON.stringify(token)};
    const grants = new Set(${grants});
    const host = globalThis.qiyeUserScriptHost;
    const requireGrant = (name) => { if (!grants.has(name)) throw new Error('未批准权限：' + name); };
    const call = (operation, payload = {}) => host.invoke(runtimeToken, operation, payload);
    try {
      const cookieDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');
      if (cookieDescriptor?.configurable) Object.defineProperty(Document.prototype, 'cookie', { configurable: true, get: () => '', set: () => { throw new Error('用户脚本不能访问 Cookie'); } });
      const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
      if (valueDescriptor?.get && valueDescriptor?.set && valueDescriptor.configurable) Object.defineProperty(HTMLInputElement.prototype, 'value', {
        configurable: true,
        get() { return String(this.type || '').toLowerCase() === 'password' ? '' : valueDescriptor.get.call(this); },
        set(value) { if (String(this.type || '').toLowerCase() === 'password') throw new Error('用户脚本不能读写密码'); return valueDescriptor.set.call(this, value); }
      });
    } catch {}
    if (!globalThis.__qiyeUserScriptCommands) {
      const callbacks = new Map();
      Object.defineProperty(globalThis, '__qiyeUserScriptCommands', { value: {
        set: (key, callback) => callbacks.set(key, callback),
        invoke: async (key) => { const callback = callbacks.get(key); if (callback) return callback(); },
        clearToken: (prefix) => { for (const key of callbacks.keys()) if (key.startsWith(prefix + ':')) callbacks.delete(key); }
      }, configurable: false, enumerable: false, writable: false });
    }
    const GM_info = Object.freeze(${info});
    const GM_addStyle = (css) => { requireGrant('GM_addStyle'); const style = document.createElement('style'); style.textContent = String(css || '').slice(0, 100000); (document.head || document.documentElement).appendChild(style); return style; };
    const GM_getValue = async (key, fallback) => { requireGrant('GM_getValue'); const result = await call('storage:get', { key: String(key) }); return result.exists ? result.value : fallback; };
    const GM_setValue = async (key, value) => { requireGrant('GM_setValue'); return call('storage:set', { key: String(key), value }); };
    const GM_deleteValue = async (key) => { requireGrant('GM_deleteValue'); return call('storage:delete', { key: String(key) }); };
    const GM_listValues = async () => { requireGrant('GM_listValues'); return call('storage:list'); };
    const GM_registerMenuCommand = (name, callback) => { requireGrant('GM_registerMenuCommand'); if (typeof callback !== 'function') throw new Error('菜单命令需要回调'); const commandId = crypto.randomUUID(); globalThis.__qiyeUserScriptCommands.set(runtimeToken + ':' + commandId, callback); void call('menu:register', { commandId, name: String(name).slice(0, 100) }); return commandId; };
    const GM_openInTab = async (url, options = {}) => { requireGrant('GM_openInTab'); return call('tab:open', { url: String(url), active: options?.active !== false }); };
    const GM_notification = async (details, title) => { requireGrant('GM_notification'); const input = typeof details === 'string' ? { text: details, title } : details || {}; return call('notification:show', { title: String(input.title || GM_info.script.name).slice(0, 120), text: String(input.text || '').slice(0, 500) }); };
    const GM_setClipboard = async (text, type = 'text/plain') => { requireGrant('GM_setClipboard'); return call('clipboard:set', { text: String(text).slice(0, 1048576), type: String(type || 'text/plain').slice(0, 80) }); };
    const GM_xmlhttpRequest = async (details = {}) => { requireGrant('GM_xmlhttpRequest'); try { const response = await call('network:request', { method: details.method, url: details.url, headers: details.headers, data: details.data, timeout: details.timeout }); details.onload?.(response); return response; } catch (error) { details.onerror?.({ error: error?.message || 'request failed' }); throw error; } };
    let timerCount = 0;
    let observerCount = 0;
    const nativeSetTimeout = globalThis.setTimeout.bind(globalThis);
    const nativeSetInterval = globalThis.setInterval.bind(globalThis);
    const NativeMutationObserver = globalThis.MutationObserver;
    const setTimeout = (...args) => { timerCount += 1; return nativeSetTimeout(...args); };
    const setInterval = (...args) => { timerCount += 1; return nativeSetInterval(...args); };
    const MutationObserver = NativeMutationObserver ? class extends NativeMutationObserver {
      constructor(callback) { observerCount += 1; super(callback); }
    } : undefined;
    const firstExecutionStartedAt = performance.now();
    const executionMetrics = () => {
      const firstExecutionDurationMs = performance.now() - firstExecutionStartedAt;
      return { firstExecutionDurationMs, longTaskCount: firstExecutionDurationMs >= 50 ? 1 : 0, observerCount, timerCount };
    };
    return Promise.resolve().then(async () => {
      return (async function() {
${script.sourceCode}
      }).call(globalThis);
    }).then(() => ({ ok: true, metrics: executionMetrics() })).catch((error) => ({ ok: false, message: String(error?.message || error || '脚本失败').slice(0, 300), metrics: executionMetrics() }));
  })()`;
}

class UserScriptEngine {
  constructor({ getState, updateState, recordExecution, openTab, showNotification, setClipboard, fetchFn, onCommandsChanged = () => undefined, executionTimeoutMs = EXECUTION_TIMEOUT_MS } = {}) {
    this.getState = getState;
    this.updateState = updateState;
    this.recordExecution = recordExecution;
    this.openTab = openTab;
    this.showNotification = showNotification;
    this.setClipboard = setClipboard;
    this.fetchFn = fetchFn;
    this.onCommandsChanged = onCommandsChanged;
    this.executionTimeoutMs = Math.max(10, Number(executionTimeoutMs) || EXECUTION_TIMEOUT_MS);
    this.runtimes = new Map();
  }

  cleanup(contents) {
    if (!contents) return;
    this.runtimes.delete(contents.id);
    this.onCommandsChanged(contents.id);
  }

  commandsFor(contentsId) {
    const runtimes = this.runtimes.get(Number(contentsId)) || new Map();
    return Array.from(runtimes.values()).flatMap((runtime) =>
      Array.from(runtime.commands.values()).map((command) => ({
        scriptId: runtime.scriptId,
        scriptName: runtime.scriptName,
        commandId: command.commandId,
        name: command.name,
      })));
  }

  async executeCommand(contents, scriptId, commandId) {
    const runtimes = this.runtimes.get(contents.id) || new Map();
    const runtime = Array.from(runtimes.values()).find((item) => item.scriptId === scriptId && item.commands.has(commandId));
    if (!runtime) throw new Error("页面脚本命令已经失效");
    const key = `${runtime.token}:${commandId}`;
    return contents.executeJavaScriptInIsolatedWorld(USER_SCRIPT_WORLD_ID, [{ code: `globalThis.__qiyeUserScriptCommands?.invoke(${JSON.stringify(key)})` }], true);
  }

  async runAt(contents, context, runAt) {
    if (!contents || contents.isDestroyed()) return [];
    const state = await this.getState();
    const rawUrl = contents.getURL();
    let hostname = "";
    try { hostname = new URL(rawUrl).hostname.toLowerCase(); } catch {}
    const scripts = [];
    for (const script of state.userScripts) {
      const matchStarted = Date.now();
      const sensitiveSiteApproved = state.userScriptPermissions.some((item) =>
        item.scriptId === script.id && item.permission === "sensitive-site" && item.value === hostname);
      const matched = script.enabled && !script.deletedAt && script.runAt === runAt && script.compatibility?.compatible &&
        userScriptMatches(script, rawUrl, { ...context, sensitiveSiteApproved }).matched &&
        this._permissionsApproved(state, script, rawUrl);
      if (matched) scripts.push({ script, matchDurationMs: Date.now() - matchStarted });
    }
    const results = [];
    for (const candidate of scripts) results.push(await this._execute(contents, { ...context, matchDurationMs: candidate.matchDurationMs }, candidate.script, state));
    return results;
  }

  async runTemporary(contents, context, script) {
    if (!script || script.sourceType !== "builtIn") throw new Error("只允许临时运行内置脚本");
    const sensitive = isSensitiveUserScriptUrl(contents.getURL());
    if (sensitive.blocked) throw new Error(`敏感页面已阻止脚本：${sensitive.reason}`);
    return this._execute(contents, context, { ...script, enabled: true });
  }

  async _execute(contents, context, script, knownState = null) {
    const existingRuntime = Array.from(this.runtimes.get(contents.id)?.values?.() || []).find((item) => item.scriptId === script.id);
    if (existingRuntime) return { ok: true, scriptId: script.id, skipped: true, reason: "同一页面已注入" };
    const token = randomUUID();
    const started = Date.now();
    const runtime = {
      token,
      scriptId: script.id,
      scriptName: script.name,
      sessionId: context.tabId || "",
      workspaceId: context.workspaceId,
      browserProfileId: context.browserProfileId,
      persistentPartition: context.persistentPartition || context.partition || null,
      hostname: new URL(contents.getURL()).hostname,
      grants: new Set(script.grants || []),
      connects: new Set(script.connects || []),
      localhostConnects: new Set((knownState?.userScriptPermissions || [])
        .filter((item) => item.scriptId === script.id && item.permission === "localhost-connect")
        .map((item) => item.value)),
      commands: new Map(),
    };
    if (!this.runtimes.has(contents.id)) this.runtimes.set(contents.id, new Map());
    this.runtimes.get(contents.id).set(token, runtime);
    let status = "success";
    let message = "脚本执行完成";
    let resultMetrics = {};
    let injectionDurationMs = 0;
    try {
      const injectionStarted = Date.now();
      const result = await Promise.race([
        contents.executeJavaScriptInIsolatedWorld(USER_SCRIPT_WORLD_ID, [{ code: runtimeWrapper(script, token), url: `qiye-userscript://${script.id}` }], false),
        timeoutPromise(this.executionTimeoutMs),
      ]);
      injectionDurationMs = Date.now() - injectionStarted;
      resultMetrics = result?.metrics || {};
      if (!result?.ok) throw new Error(result?.message || "脚本执行失败");
      return { ok: true, scriptId: script.id };
    } catch (error) {
      status = error?.code === "USERSCRIPT_TIMEOUT" ? "timeout" : "failure";
      message = safeMessage(error?.message);
      this.runtimes.get(contents.id)?.delete(token);
      return { ok: false, scriptId: script.id, status, message };
    } finally {
      await this.recordExecution?.({
        id: randomUUID(),
        scriptId: script.id,
        sessionId: context.tabId || "",
        hostname: runtime.hostname,
        startedAt: new Date(started).toISOString(),
        finishedAt: new Date().toISOString(),
        status,
        sanitizedMessage: message,
        durationMs: Date.now() - started,
        matchDurationMs: context.matchDurationMs ?? null,
        injectionDurationMs,
        firstExecutionDurationMs: resultMetrics.firstExecutionDurationMs ?? null,
        longTaskCount: resultMetrics.longTaskCount ?? null,
        observerCount: resultMetrics.observerCount ?? null,
        timerCount: resultMetrics.timerCount ?? null,
      });
    }
  }

  _permissionsApproved(state, script, rawUrl = "") {
    const approved = new Set(state.userScriptPermissions.filter((item) => item.scriptId === script.id).map((item) => `${item.permission}:${item.value}`));
    let siteApproved = true;
    if (script.sourceType === "builtIn") {
      try { siteApproved = approved.has(`site:${new URL(rawUrl).hostname.toLowerCase()}`); }
      catch { siteApproved = false; }
    }
    return siteApproved && (script.grants || []).every((grant) => approved.has(`grant:${grant}`)) &&
      (script.connects || []).every((connect) => approved.has(`connect:${connect}`));
  }

  async handleRuntimeRequest(sender, request = {}) {
    const runtime = this.runtimes.get(sender.id)?.get(String(request.token || ""));
    if (!runtime) throw new Error("用户脚本运行凭证无效或页面已经关闭");
    const operation = String(request.operation || "");
    const payload = request.payload && typeof request.payload === "object" ? request.payload : {};
    if (operation.startsWith("storage:")) return this._storage(runtime, operation, payload);
    if (operation === "menu:register") {
      if (!runtime.grants.has("GM_registerMenuCommand")) throw new Error("脚本未批准菜单权限");
      const commandId = String(payload.commandId || "").slice(0, 120);
      const name = String(payload.name || "").trim().slice(0, 100);
      if (!commandId || !name || runtime.commands.size >= 30) throw new Error("脚本菜单命令无效");
      runtime.commands.set(commandId, { commandId, name });
      this.onCommandsChanged(sender.id);
      return { ok: true };
    }
    if (operation === "tab:open") {
      if (!runtime.grants.has("GM_openInTab")) throw new Error("脚本未批准打开页签权限");
      if (typeof this.openTab !== "function") throw new Error("打开页签服务不可用");
      return this.openTab(runtime, {
        url: payload.url,
        active: payload.active !== false,
        workspaceId: runtime.workspaceId,
        browserProfileId: runtime.browserProfileId,
        persistentPartition: runtime.persistentPartition,
      });
    }
    if (operation === "notification:show") {
      if (!runtime.grants.has("GM_notification")) throw new Error("脚本未批准通知权限");
      return this.showNotification(runtime, payload);
    }
    if (operation === "clipboard:set") {
      if (!runtime.grants.has("GM_setClipboard")) throw new Error("脚本未批准剪贴板权限");
      if (typeof this.setClipboard !== "function") throw new Error("剪贴板服务不可用");
      const type = String(payload.type || "text/plain").toLowerCase();
      if (!["text/plain", "text", "html", "text/html"].includes(type)) throw new Error("剪贴板类型不受支持");
      return this.setClipboard(runtime, { text: String(payload.text || "").slice(0, 1_048_576), type });
    }
    if (operation === "network:request") return this._network(runtime, payload);
    throw new Error("不支持的用户脚本宿主操作");
  }

  async _storage(runtime, operation, payload) {
    const grants = {
      "storage:get": "GM_getValue",
      "storage:set": "GM_setValue",
      "storage:delete": "GM_deleteValue",
      "storage:list": "GM_listValues",
    };
    if (!runtime.grants.has(grants[operation])) throw new Error("脚本未批准存储权限");
    const key = String(payload.key || "").trim().slice(0, 120);
    if (operation !== "storage:list" && (!key || ["__proto__", "constructor", "prototype"].includes(key))) throw new Error("脚本存储键无效");
    const state = await this.getState();
    const values = state.userScriptValues[runtime.scriptId] || {};
    if (operation === "storage:get") return { exists: Object.hasOwn(values, key), value: values[key] };
    if (operation === "storage:list") return Object.keys(values);
    return this.updateState((current) => {
      const next = structuredClone(current);
      const scriptValues = { ...(next.userScriptValues[runtime.scriptId] || {}) };
      if (operation === "storage:set") scriptValues[key] = safeJsonValue(payload.value);
      else delete scriptValues[key];
      if (Object.keys(scriptValues).length > 100 || JSON.stringify(scriptValues).length > 262_144) throw new Error("脚本存储空间超过限制");
      next.userScriptValues[runtime.scriptId] = scriptValues;
      next.updatedAt = new Date().toISOString();
      return next;
    });
  }

  async _network(runtime, payload) {
    if (!runtime.grants.has("GM_xmlhttpRequest")) throw new Error("脚本未批准跨域请求权限");
    let url;
    try { url = new URL(payload.url); } catch { throw new Error("跨域请求 URL 无效"); }
    this._assertNetworkTarget(runtime, url);
    const method = String(payload.method || "GET").toUpperCase();
    if (!["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD"].includes(method)) throw new Error("跨域请求方法不受支持");
    const headers = {};
    for (const [key, value] of Object.entries(payload.headers || {})) {
      if (/^(?:authorization|cookie|proxy-authorization|origin|referer|sec-)/i.test(key)) continue;
      headers[String(key).slice(0, 80)] = String(value).slice(0, 2000);
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.max(1000, Math.min(30_000, Number(payload.timeout) || 15_000)));
    timeout.unref?.();
    try {
      if (typeof this.fetchFn !== "function") throw new Error("跨域请求服务不可用");
      let currentUrl = url;
      let currentMethod = method;
      let currentBody = ["GET", "HEAD"].includes(method) ? undefined : String(payload.data || "").slice(0, 1_048_576);
      for (let redirectCount = 0; redirectCount <= NETWORK_MAX_REDIRECTS; redirectCount += 1) {
        this._assertNetworkTarget(runtime, currentUrl);
        const response = await this.fetchFn(currentUrl.toString(), {
          method: currentMethod,
          headers,
          body: currentBody,
          credentials: "omit",
          redirect: "manual",
          signal: controller.signal,
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
          if (redirectCount >= NETWORK_MAX_REDIRECTS) throw new Error("跨域请求重定向次数过多");
          const location = response.headers?.get?.("location");
          if (!location) throw new Error("跨域请求重定向缺少地址");
          await response.body?.cancel?.().catch?.(() => undefined);
          currentUrl = new URL(location, currentUrl);
          this._assertNetworkTarget(runtime, currentUrl);
          if (response.status === 303 || ((response.status === 301 || response.status === 302) && currentMethod === "POST")) {
            currentMethod = "GET";
            currentBody = undefined;
          }
          continue;
        }
        const text = await readNetworkResponseWithLimit(response, NETWORK_MAX_RESPONSE_BYTES);
        return { status: response.status, statusText: response.statusText, responseText: text, finalUrl: currentUrl.toString() };
      }
      throw new Error("跨域请求重定向次数过多");
    } finally {
      clearTimeout(timeout);
    }
  }

  _assertNetworkTarget(runtime, url) {
    const classification = classifyConnectTarget(url.toString());
    if (!classification.allowedProtocol) throw new Error(classification.reason);
    if (url.username || url.password) throw new Error("跨域请求不允许在 URL 中携带凭据");
    if (![...runtime.connects].some((pattern) => connectPatternMatches(pattern, url.hostname))) {
      throw new Error("请求域名不在已批准的 @connect 范围");
    }
    if (classification.local && !runtime.localhostConnects.has(classification.hostname)) {
      throw new Error("本机 @connect 需要单独高级授权");
    }
  }
}

module.exports = {
  EXECUTION_TIMEOUT_MS,
  NETWORK_MAX_REDIRECTS,
  NETWORK_MAX_RESPONSE_BYTES,
  USER_SCRIPT_WORLD_ID,
  UserScriptEngine,
  classifyConnectTarget,
  isLocalConnectHostname,
  readNetworkResponseWithLimit,
  runtimeWrapper,
  safeJsonValue,
  safeMessage,
};
