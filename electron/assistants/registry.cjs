const { ALLOWED_PERMISSIONS, getActionDefinition } = require("./action-catalog.cjs");
const { GENERIC_PAGE_ASSISTANT } = require("./builtins/generic-page.cjs");
const { ZOHO_DESK_ASSISTANT } = require("./builtins/zoho-desk.cjs");

const BUILTIN_ASSISTANT_MANIFESTS = Object.freeze([
  GENERIC_PAGE_ASSISTANT,
  ZOHO_DESK_ASSISTANT,
]);

const FORBIDDEN_MANIFEST_KEYS = new Set([
  "code",
  "javascript",
  "remoteUrl",
  "downloadUrl",
  "script",
  "scriptUrl",
]);

const KNOWN_CONTEXT_EXTRACTORS = new Set(["zoho-desk-url"]);

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertDeclarativeValue(value, path = "manifest") {
  if (typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") {
    throw new Error(`${path} 只能包含声明式 JSON 数据`);
  }
  if (value === null || typeof value !== "object") return;
  if (value instanceof RegExp || value instanceof Date || !isPlainObject(value) && !Array.isArray(value)) {
    throw new Error(`${path} 包含不支持的运行时对象`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertDeclarativeValue(item, `${path}[${index}]`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_MANIFEST_KEYS.has(key)) {
      throw new Error(`${path}.${key} 不允许出现在声明式助手中`);
    }
    assertDeclarativeValue(child, `${path}.${key}`);
  }
}

function assertStringArray(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    throw new Error(`${label} 必须是${allowEmpty ? "" : "非空"}字符串数组`);
  }
  const normalized = value.map((item) => String(item || "").trim());
  if (normalized.some((item) => !item) || new Set(normalized).size !== normalized.length) {
    throw new Error(`${label} 包含空值或重复项`);
  }
  return normalized;
}

function validateHostnameRule(rule, label) {
  if (!isPlainObject(rule)) throw new Error(`${label} 必须是对象`);
  if (rule.any === true) return;
  const exact = Array.isArray(rule.exact) ? assertStringArray(rule.exact, `${label}.exact`) : [];
  const suffix = Array.isArray(rule.suffix) ? assertStringArray(rule.suffix, `${label}.suffix`) : [];
  if (!exact.length && !suffix.length) throw new Error(`${label} 缺少主机规则`);
  for (const host of [...exact, ...suffix]) {
    if (
      host !== host.toLowerCase() ||
      host.startsWith(".") ||
      !/^[a-z0-9.-]+$/.test(host) ||
      host.includes("..")
    ) {
      throw new Error(`${label} 包含无效主机名`);
    }
  }
}

function validatePathnameRule(rule, label) {
  if (!isPlainObject(rule)) throw new Error(`${label} 必须是对象`);
  if (rule.any === true) return;
  const exact = Array.isArray(rule.exact)
    ? assertStringArray(rule.exact, `${label}.exact`, { allowEmpty: true })
    : [];
  const prefixes = Array.isArray(rule.prefixes)
    ? assertStringArray(rule.prefixes, `${label}.prefixes`, { allowEmpty: true })
    : [];
  if (!exact.length && !prefixes.length) throw new Error(`${label} 缺少路径规则`);
  if ([...exact, ...prefixes].some((item) => !item.startsWith("/"))) {
    throw new Error(`${label} 路径必须从 / 开始`);
  }
}

function validateMatchPattern(pattern, index) {
  const label = `matchPatterns[${index}]`;
  if (!isPlainObject(pattern)) throw new Error(`${label} 必须是对象`);
  const protocols = assertStringArray(pattern.protocols, `${label}.protocols`);
  if (protocols.some((protocol) => protocol !== "http:" && protocol !== "https:")) {
    throw new Error(`${label} 仅支持 HTTP 或 HTTPS`);
  }
  validateHostnameRule(pattern.hostname, `${label}.hostname`);
  validatePathnameRule(pattern.pathname, `${label}.pathname`);
}

function validateManifest(manifest) {
  assertDeclarativeValue(manifest);
  if (!isPlainObject(manifest)) throw new Error("助手 manifest 必须是对象");
  if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(String(manifest.id || ""))) {
    throw new Error("助手 id 格式无效");
  }
  if (!String(manifest.name || "").trim()) throw new Error("助手名称不能为空");
  if (!/^\d+\.\d+\.\d+$/.test(String(manifest.version || ""))) {
    throw new Error("助手版本必须是三段式数字版本");
  }
  if (manifest.source !== "built-in") {
    throw new Error("本轮只允许注册随应用打包的内置助手");
  }
  if (typeof manifest.enabled !== "boolean") throw new Error("助手 enabled 必须是布尔值");
  if (!Array.isArray(manifest.matchPatterns) || !manifest.matchPatterns.length) {
    throw new Error("助手必须声明 matchPatterns");
  }
  manifest.matchPatterns.forEach(validateMatchPattern);

  const permissions = assertStringArray(manifest.permissions, "permissions", {
    allowEmpty: true,
  });
  for (const permission of permissions) {
    if (!ALLOWED_PERMISSIONS.includes(permission)) {
      throw new Error(`未知助手权限：${permission}`);
    }
  }
  if (
    manifest.contextExtractor &&
    !KNOWN_CONTEXT_EXTRACTORS.has(manifest.contextExtractor)
  ) {
    throw new Error(`未知页面上下文提取器：${manifest.contextExtractor}`);
  }
  if (!Array.isArray(manifest.actions) || !manifest.actions.length) {
    throw new Error("助手至少需要一个动作");
  }
  const actionIds = new Set();
  for (const action of manifest.actions) {
    if (!isPlainObject(action)) throw new Error("助手动作必须是对象");
    if (!/^[a-z0-9][a-z0-9-]{1,63}$/.test(String(action.id || ""))) {
      throw new Error("助手动作 id 格式无效");
    }
    if (actionIds.has(action.id)) throw new Error(`助手动作 id 重复：${action.id}`);
    actionIds.add(action.id);
    if (!String(action.name || "").trim()) throw new Error("助手动作名称不能为空");
    const definition = getActionDefinition(action.type);
    if (!definition) throw new Error(`未知助手动作类型：${action.type}`);
    const missing = definition.requiredPermissions.filter(
      (permission) => !permissions.includes(permission),
    );
    if (missing.length) {
      throw new Error(`动作 ${action.id} 缺少权限：${missing.join(", ")}`);
    }
    if (action.when !== undefined) {
      if (
        !isPlainObject(action.when) ||
        !/^[A-Za-z][A-Za-z0-9]*$/.test(String(action.when.field || "")) ||
        action.when.present !== true
      ) {
        throw new Error(`动作 ${action.id} 的 when 条件无效`);
      }
    }
  }
  return true;
}

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function cloneManifest(manifest) {
  return deepFreeze(JSON.parse(JSON.stringify(manifest)));
}

function readRuntimeMetadata(enabledState, assistantId, fallback) {
  const value = enabledState?.[assistantId];
  if (typeof value === "boolean") {
    return { enabled: value, updatedAt: null, lastExecutedAt: null };
  }
  return {
    enabled: value && typeof value.enabled === "boolean" ? value.enabled : fallback,
    updatedAt: typeof value?.updatedAt === "string" ? value.updatedAt : null,
    lastExecutedAt:
      typeof value?.lastExecutedAt === "string" ? value.lastExecutedAt : null,
  };
}

class AssistantRegistry {
  constructor({ manifests = BUILTIN_ASSISTANT_MANIFESTS, enabledState = {} } = {}) {
    this.manifests = new Map();
    this.runtimeMetadata = new Map();
    for (const rawManifest of manifests) {
      validateManifest(rawManifest);
      if (this.manifests.has(rawManifest.id)) {
        throw new Error(`助手 id 重复：${rawManifest.id}`);
      }
      const manifest = cloneManifest(rawManifest);
      this.manifests.set(manifest.id, manifest);
      this.runtimeMetadata.set(
        manifest.id,
        readRuntimeMetadata(enabledState, manifest.id, manifest.enabled),
      );
    }
  }

  get(id) {
    return this.manifests.get(String(id || "")) || null;
  }

  isEnabled(id) {
    return this.runtimeMetadata.get(String(id || ""))?.enabled === true;
  }

  setEnabled(id, enabled, { updatedAt = new Date().toISOString() } = {}) {
    const key = String(id || "");
    if (!this.manifests.has(key)) throw new Error("找不到要更新的站点助手");
    const current = this.runtimeMetadata.get(key) || {};
    this.runtimeMetadata.set(key, {
      ...current,
      enabled: Boolean(enabled),
      updatedAt,
    });
    return this.isEnabled(key);
  }

  setLastExecutedAt(id, lastExecutedAt) {
    const key = String(id || "");
    if (!this.manifests.has(key)) throw new Error("找不到要更新的站点助手");
    const current = this.runtimeMetadata.get(key) || {};
    this.runtimeMetadata.set(key, {
      ...current,
      lastExecutedAt: typeof lastExecutedAt === "string" ? lastExecutedAt : null,
    });
  }

  getRuntimeMetadata(id) {
    const value = this.runtimeMetadata.get(String(id || ""));
    return value ? { ...value } : null;
  }

  list({ includeDisabled = true } = {}) {
    return Array.from(this.manifests.values())
      .filter((manifest) => includeDisabled || this.isEnabled(manifest.id))
      .map((manifest) => ({
        ...manifest,
        runtimeEnabled: this.isEnabled(manifest.id),
        settingsUpdatedAt: this.getRuntimeMetadata(manifest.id)?.updatedAt || null,
        lastExecutedAt: this.getRuntimeMetadata(manifest.id)?.lastExecutedAt || null,
      }));
  }

  getEnabledState() {
    return Object.fromEntries(
      Array.from(this.runtimeMetadata.entries()).map(([id, metadata]) => [
        id,
        { ...metadata },
      ]),
    );
  }
}

function createBuiltinAssistantRegistry(enabledState = {}) {
  return new AssistantRegistry({ enabledState });
}

module.exports = {
  AssistantRegistry,
  BUILTIN_ASSISTANT_MANIFESTS,
  createBuiltinAssistantRegistry,
  validateManifest,
};
