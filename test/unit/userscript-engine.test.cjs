const assert = require("node:assert/strict");
const test = require("node:test");

const { createInitialState } = require("../../electron/state-model.cjs");
const {
  UserScriptEngine,
  parseUserScript,
  runtimeWrapper,
  updateBuiltInSiteApproval,
  updateSensitiveSiteApproval,
  upsertUserScript,
} = require("../../electron/userscripts/index.cjs");

const NOW = "2026-08-30T06:00:00.000Z";

function scriptSource(name = "Engine test", extra = "") {
  return `// ==UserScript==
// @name ${name}
// @match https://docs.example.com/*
// @run-at document-end
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_listValues
// @grant GM_xmlhttpRequest
// @connect api.example.net
// ==/UserScript==
${extra || "globalThis.engineTest = true;"}`;
}

function installedState() {
  const initial = createInitialState({ now: NOW, defaultSites: [] });
  const script = parseUserScript(scriptSource(), {
    id: "engine-script",
    sourceType: "pasted",
    enabled: true,
    now: NOW,
  });
  return upsertUserScript(initial, script, { now: NOW }).state;
}

function fakeContents(executor = async () => ({ ok: true })) {
  return {
    id: 42,
    isDestroyed: () => false,
    getURL: () => "https://docs.example.com/article",
    executeJavaScriptInIsolatedWorld: executor,
  };
}

test("engine schedules only enabled, approved and matching run-at scripts", async () => {
  let state = installedState();
  const executions = [];
  const injected = [];
  const contents = fakeContents(async (worldId, scripts) => {
    injected.push({ worldId, scripts });
    return { ok: true };
  });
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); return { ok: true }; },
    recordExecution: async (value) => executions.push(value),
  });

  assert.deepEqual(await engine.runAt(contents, { tabId: "tab-a", workspaceId: "personal", browserProfileId: "default" }, "document-start"), []);
  const result = await engine.runAt(contents, { tabId: "tab-a", workspaceId: "personal", browserProfileId: "default" }, "document-end");
  assert.equal(result[0].ok, true);
  assert.equal(injected[0].worldId, 1001);
  assert.match(injected[0].scripts[0].code, /用户脚本不能访问 Cookie/);
  assert.match(injected[0].scripts[0].code, /用户脚本不能读写密码/);
  assert.equal(executions[0].status, "success");
  assert.equal(executions[0].hostname, "docs.example.com");
});

test("ordinary login pages require an explicit per-script advanced site approval", async () => {
  const initial = createInitialState({ now: NOW, defaultSites: [] });
  const script = parseUserScript(scriptSource("Login helper").replace("https://docs.example.com/*", "https://accounts.example.com/*"), {
    id: "login-helper",
    sourceType: "pasted",
    enabled: true,
    now: NOW,
  });
  let state = upsertUserScript(initial, script, { now: NOW }).state;
  const injected = [];
  const contents = {
    ...fakeContents(async (_worldId, scripts) => { injected.push(scripts[0].code); return { ok: true }; }),
    getURL: () => "https://accounts.example.com/signin",
  };
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); return { ok: true }; },
    recordExecution: async () => undefined,
  });
  assert.deepEqual(await engine.runAt(contents, { tabId: "tab-login", workspaceId: "personal", browserProfileId: "default" }, "document-end"), []);
  state = updateSensitiveSiteApproval(state, script.id, "accounts.example.com", true, { now: NOW }).state;
  const approved = await engine.runAt(contents, { tabId: "tab-login", workspaceId: "personal", browserProfileId: "default" }, "document-end");
  assert.equal(approved[0].ok, true);
  assert.equal(injected.length, 1);
});

test("runtime storage is isolated by script and host requests require the per-page token", async () => {
  let state = installedState();
  const contents = fakeContents();
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); return { ok: true }; },
    recordExecution: async () => undefined,
  });
  await engine.runAt(contents, { tabId: "tab-a", workspaceId: "personal", browserProfileId: "default" }, "document-end");
  const [token] = engine.runtimes.get(contents.id).keys();
  await engine.handleRuntimeRequest(contents, { token, operation: "storage:set", payload: { key: "theme", value: { dark: true } } });
  assert.deepEqual(state.userScriptValues["engine-script"].theme, { dark: true });
  assert.deepEqual(await engine.handleRuntimeRequest(contents, { token, operation: "storage:list" }), ["theme"]);
  assert.deepEqual(await engine.handleRuntimeRequest(contents, { token, operation: "storage:get", payload: { key: "theme" } }), { exists: true, value: { dark: true } });
  await assert.rejects(engine.handleRuntimeRequest(contents, { token: "forged", operation: "storage:list" }), /凭证无效/);
  engine.cleanup(contents);
  assert.equal(engine.runtimes.has(contents.id), false);
});

test("GM network proxy enforces approved connect, strips credential headers and omits cookies", async () => {
  let state = installedState();
  let request = null;
  const contents = fakeContents();
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); return { ok: true }; },
    recordExecution: async () => undefined,
    fetchFn: async (url, options) => {
      request = { url, options };
      return { status: 200, statusText: "OK", url, text: async () => "response" };
    },
  });
  await engine.runAt(contents, { tabId: "tab-a", workspaceId: "personal", browserProfileId: "default" }, "document-end");
  const [token] = engine.runtimes.get(contents.id).keys();
  const response = await engine.handleRuntimeRequest(contents, {
    token,
    operation: "network:request",
    payload: {
      url: "https://api.example.net/data",
      headers: { Authorization: "Bearer secret", Cookie: "session=x", "X-Test": "safe" },
    },
  });
  assert.equal(response.responseText, "response");
  assert.equal(request.options.credentials, "omit");
  assert.equal(request.options.headers.Authorization, undefined);
  assert.equal(request.options.headers.Cookie, undefined);
  assert.equal(request.options.headers["X-Test"], "safe");
  await assert.rejects(engine.handleRuntimeRequest(contents, {
    token,
    operation: "network:request",
    payload: { url: "https://unapproved.example.org/data" },
  }), /@connect/);
});

test("one failing script is isolated and an unresolved execution is reported as timeout", async () => {
  const state = installedState();
  const failures = [];
  const failing = new UserScriptEngine({
    getState: async () => state,
    updateState: async () => ({ ok: true }),
    recordExecution: async (value) => failures.push(value),
    executionTimeoutMs: 15,
  });
  const result = await failing.runAt(fakeContents(async () => new Promise(() => {})), {
    tabId: "tab-a", workspaceId: "personal", browserProfileId: "default",
  }, "document-end");
  assert.equal(result[0].status, "timeout");
  assert.equal(failures[0].status, "timeout");
  assert.equal(failing.runtimes.get(42).size, 0);
});

test("runtime wrapper exposes fixed GM APIs without Node or Electron bridge names", () => {
  const script = parseUserScript(scriptSource("Static"), { id: "static", enabled: true, now: NOW });
  const wrapper = runtimeWrapper(script, "runtime-token");
  assert.match(wrapper, /GM_getValue/);
  assert.match(wrapper, /qiyeUserScriptHost/);
  assert.doesNotMatch(wrapper, /ipcRenderer|require\(['"]electron|nodeIntegration/);
});

test("built-in restore-copy requires per-site approval and temporary runs reject sensitive pages", async () => {
  let state = createInitialState({ now: NOW, defaultSites: [] });
  state = updateBuiltInSiteApproval(state, "builtin-restore-copy", "docs.example.com", true, { now: NOW }).state;
  const injected = [];
  const contents = fakeContents(async (_worldId, scripts) => { injected.push(scripts[0].code); return { ok: true }; });
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); return { ok: true }; },
    recordExecution: async () => undefined,
  });
  const result = await engine.runAt(contents, { tabId: "tab-a", workspaceId: "personal", browserProfileId: "default" }, "document-end");
  assert.equal(result.some((item) => item.scriptId === "builtin-restore-copy"), true);
  assert.equal(injected.length, 1);
  const sensitiveContents = { ...contents, id: 43, getURL: () => "https://accounts.example.com/login" };
  await assert.rejects(
    engine.runTemporary(sensitiveContents, { tabId: "tab-b", workspaceId: "personal", browserProfileId: "default" }, state.userScripts.find((item) => item.id === "builtin-restore-copy")),
    /敏感页面/,
  );
});
