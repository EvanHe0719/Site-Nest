const { randomUUID } = require("node:crypto");
const { BUILTIN_USER_SCRIPTS } = require("./builtins.cjs");
const { parseUserScript, sourceHash } = require("./metadata-parser.cjs");

const SOURCE_TYPES = new Set(["builtIn", "localFile", "pasted", "remoteUrl"]);
const EXECUTION_STATES = new Set(["running", "success", "failure", "denied", "timeout", "disabled"]);

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function normalizeUserScript(value, options = {}) {
  const input = value && typeof value === "object" ? value : {};
  try {
    return parseUserScript(input.sourceCode, {
      id: String(input.id || randomUUID()).slice(0, 120),
      sourceType: SOURCE_TYPES.has(input.sourceType) ? input.sourceType : "pasted",
      sourceUrl: input.sourceUrl || null,
      enabled: input.enabled === true,
      workspaceIds: input.workspaceIds,
      browserProfileIds: input.browserProfileIds,
      createdAt: isoOrNull(input.createdAt) || options.now,
      lastCheckedAt: isoOrNull(input.lastCheckedAt),
      now: isoOrNull(input.updatedAt) || options.now,
    });
  } catch {
    return null;
  }
}

function normalizeUserScripts(value, options = {}) {
  const now = options.now || new Date().toISOString();
  const scripts = (Array.isArray(value) ? value : []).map((item) => normalizeUserScript(item, { now })).filter(Boolean);
  const byId = new Map(scripts.map((script) => [script.id, script]));
  for (const builtin of BUILTIN_USER_SCRIPTS) {
    const parsed = parseUserScript(builtin.sourceCode, { ...builtin, now });
    const existing = byId.get(builtin.id);
    byId.set(builtin.id, existing
      ? { ...parsed, enabled: existing.enabled, createdAt: existing.createdAt, updatedAt: existing.updatedAt }
      : parsed);
  }
  return Array.from(byId.values()).slice(0, 500);
}

function normalizePermissions(value, scriptIds = []) {
  const allowed = new Set(scriptIds);
  const seen = new Set();
  return (Array.isArray(value) ? value : []).map((item) => {
    const scriptId = String(item?.scriptId || "").slice(0, 120);
    const permission = String(item?.permission || "").slice(0, 80);
    const permissionValue = String(item?.value || "").slice(0, 300);
    const key = `${scriptId}:${permission}:${permissionValue}`;
    if (!allowed.has(scriptId) || !permission || seen.has(key)) return null;
    seen.add(key);
    return { scriptId, permission, value: permissionValue, approvedAt: isoOrNull(item.approvedAt) || new Date().toISOString() };
  }).filter(Boolean).slice(0, 10_000);
}

function normalizeExecutions(value, scriptIds = []) {
  const allowed = new Set(scriptIds);
  return (Array.isArray(value) ? value : []).map((item) => {
    const scriptId = String(item?.scriptId || "").slice(0, 120);
    if (!allowed.has(scriptId)) return null;
    return {
      id: String(item?.id || randomUUID()).slice(0, 120),
      scriptId,
      sessionId: String(item?.sessionId || "").slice(0, 120),
      hostname: String(item?.hostname || "unknown").slice(0, 255),
      startedAt: isoOrNull(item?.startedAt) || new Date().toISOString(),
      finishedAt: isoOrNull(item?.finishedAt),
      status: EXECUTION_STATES.has(item?.status) ? item.status : "failure",
      sanitizedMessage: String(item?.sanitizedMessage || "").replace(/(?:Bearer\s+|token[=:]\s*)\S+/gi, "[REDACTED]").slice(0, 300),
      durationMs: Math.max(0, Math.min(300_000, Number(item?.durationMs) || 0)),
    };
  }).filter(Boolean).slice(-1000);
}

function normalizeValues(value, scriptIds = []) {
  const allowed = new Set(scriptIds);
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const output = {};
  for (const [scriptId, entries] of Object.entries(input)) {
    if (!allowed.has(scriptId) || !entries || typeof entries !== "object" || Array.isArray(entries)) continue;
    output[scriptId] = Object.fromEntries(Object.entries(entries).slice(0, 100).map(([key, entry]) => [String(key).slice(0, 120), entry]));
  }
  return output;
}

function permissionsForScript(script, approvedAt = new Date().toISOString()) {
  return [
    ...(script.grants || []).map((value) => ({ scriptId: script.id, permission: "grant", value, approvedAt })),
    ...(script.connects || []).map((value) => ({ scriptId: script.id, permission: "connect", value, approvedAt })),
  ];
}

function upsertUserScript(state, script, options = {}) {
  const next = structuredClone(state);
  const now = options.now || new Date().toISOString();
  const existing = next.userScripts.find((item) => item.id === script.id);
  const normalized = normalizeUserScript({ ...script, createdAt: existing?.createdAt || script.createdAt || now, updatedAt: now }, { now });
  if (!normalized) throw new Error("用户脚本数据无效");
  next.userScripts = [...next.userScripts.filter((item) => item.id !== normalized.id), normalized];
  next.userScriptPermissions = [
    ...next.userScriptPermissions.filter((item) => item.scriptId !== normalized.id),
    ...permissionsForScript(normalized, now),
  ];
  next.updatedAt = now;
  return { state: next, script: normalized };
}

function removeUserScript(state, scriptId, options = {}) {
  const next = structuredClone(state);
  const id = String(scriptId || "");
  const script = next.userScripts.find((item) => item.id === id);
  if (!script || script.sourceType === "builtIn") throw new Error("内置脚本不能删除，可以停用");
  next.userScripts = next.userScripts.filter((item) => item.id !== id);
  next.userScriptPermissions = next.userScriptPermissions.filter((item) => item.scriptId !== id);
  next.userScriptExecutions = next.userScriptExecutions.filter((item) => item.scriptId !== id);
  delete next.userScriptValues[id];
  next.updatedAt = options.now || new Date().toISOString();
  return { state: next, script };
}

function updateUserScriptEnabled(state, scriptId, enabled, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script) throw new Error("找不到用户脚本");
  script.enabled = enabled === true;
  script.updatedAt = options.now || new Date().toISOString();
  if (script.enabled) {
    const approved = new Set(next.userScriptPermissions
      .filter((item) => item.scriptId === script.id)
      .map((item) => `${item.permission}:${item.value}`));
    next.userScriptPermissions.push(...permissionsForScript(script, script.updatedAt)
      .filter((item) => !approved.has(`${item.permission}:${item.value}`)));
  }
  next.updatedAt = script.updatedAt;
  return { state: next, script };
}

function updateBuiltInSiteApproval(state, scriptId, hostname, approved, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script || script.sourceType !== "builtIn") throw new Error("仅内置脚本支持按网站启用");
  const host = String(hostname || "").trim().toLowerCase().slice(0, 255);
  if (!host || !/^(?:localhost|[a-z0-9.-]+|\[[a-f0-9:]+\])$/i.test(host)) throw new Error("当前网站域名无效");
  next.userScriptPermissions = next.userScriptPermissions.filter((item) =>
    !(item.scriptId === script.id && item.permission === "site" && item.value === host));
  const now = options.now || new Date().toISOString();
  if (approved === true) {
    next.userScriptPermissions.push({ scriptId: script.id, permission: "site", value: host, approvedAt: now });
    const existing = new Set(next.userScriptPermissions
      .filter((item) => item.scriptId === script.id)
      .map((item) => `${item.permission}:${item.value}`));
    next.userScriptPermissions.push(...permissionsForScript(script, now)
      .filter((item) => !existing.has(`${item.permission}:${item.value}`)));
  }
  script.enabled = next.userScriptPermissions.some((item) => item.scriptId === script.id && item.permission === "site");
  script.updatedAt = now;
  next.updatedAt = now;
  return { state: next, script, hostname: host, approved: approved === true };
}

function updateSensitiveSiteApproval(state, scriptId, hostname, approved, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script || script.sourceType === "builtIn") throw new Error("仅第三方用户脚本支持登录页高级授权");
  const host = String(hostname || "").trim().toLowerCase().slice(0, 255);
  if (!host || !/^(?:localhost|[a-z0-9.-]+|\[[a-f0-9:]+\])$/i.test(host)) throw new Error("当前网站域名无效");
  next.userScriptPermissions = next.userScriptPermissions.filter((item) =>
    !(item.scriptId === script.id && item.permission === "sensitive-site" && item.value === host));
  const now = options.now || new Date().toISOString();
  if (approved === true) {
    next.userScriptPermissions.push({ scriptId: script.id, permission: "sensitive-site", value: host, approvedAt: now });
  }
  script.updatedAt = now;
  next.updatedAt = now;
  return { state: next, script, hostname: host, approved: approved === true };
}

function appendUserScriptExecution(state, execution, options = {}) {
  const next = structuredClone(state);
  const scriptIds = next.userScripts.map((script) => script.id);
  const normalized = normalizeExecutions([execution], scriptIds)[0];
  if (!normalized) throw new Error("用户脚本执行记录无效");
  next.userScriptExecutions = [...next.userScriptExecutions, normalized].slice(-1000);
  next.updatedAt = options.now || new Date().toISOString();
  return { state: next, execution: normalized };
}

module.exports = {
  appendUserScriptExecution,
  normalizeExecutions,
  normalizePermissions,
  normalizeUserScript,
  normalizeUserScripts,
  normalizeValues,
  permissionsForScript,
  removeUserScript,
  sourceHash,
  updateBuiltInSiteApproval,
  updateSensitiveSiteApproval,
  updateUserScriptEnabled,
  upsertUserScript,
};
