const { randomUUID } = require("node:crypto");
const { BUILTIN_USER_SCRIPTS } = require("./builtins.cjs");
const { parseUserScript, sourceHash } = require("./metadata-parser.cjs");

const SOURCE_TYPES = new Set(["builtIn", "localFile", "pasted", "remoteUrl", "createdInApp"]);
const EXECUTION_STATES = new Set(["running", "success", "failure", "denied", "timeout", "disabled"]);
const SEVERE_EXECUTION_STATES = new Set(["failure", "timeout"]);
const DEFAULT_AUTO_DISABLE_THRESHOLD = 3;

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function finiteMetric(value, maximum = 300_000) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(maximum, number)) : null;
}

function normalizeRuntimeStats(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    runCount: Math.max(0, Math.min(10_000_000, Number(input.runCount) || 0)),
    successCount: Math.max(0, Math.min(10_000_000, Number(input.successCount) || 0)),
    failureCount: Math.max(0, Math.min(10_000_000, Number(input.failureCount) || 0)),
    timeoutCount: Math.max(0, Math.min(10_000_000, Number(input.timeoutCount) || 0)),
    totalMatchDurationMs: finiteMetric(input.totalMatchDurationMs, 3_600_000_000) || 0,
    totalInjectionDurationMs: finiteMetric(input.totalInjectionDurationMs, 3_600_000_000) || 0,
    totalFirstExecutionDurationMs: finiteMetric(input.totalFirstExecutionDurationMs, 3_600_000_000) || 0,
    longTaskCount: Math.max(0, Math.min(10_000_000, Number(input.longTaskCount) || 0)),
    observerCount: finiteMetric(input.observerCount, 1_000_000),
    timerCount: finiteMetric(input.timerCount, 1_000_000),
  };
}

function normalizeContentTagIds(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim().slice(0, 120))
    .filter(Boolean))).slice(0, 100);
}

function normalizeUserScript(value, options = {}) {
  const input = value && typeof value === "object" ? value : {};
  try {
    return {
      ...parseUserScript(input.sourceCode, {
        id: String(input.id || randomUUID()).slice(0, 120),
        sourceType: SOURCE_TYPES.has(input.sourceType) ? input.sourceType : "pasted",
        sourceUrl: input.sourceUrl || null,
        enabled: input.enabled === true,
        workspaceIds: input.workspaceIds,
        browserProfileIds: input.browserProfileIds,
        updateUrl: input.updateUrl,
        downloadUrl: input.downloadUrl,
        createdAt: isoOrNull(input.createdAt) || options.now,
        lastCheckedAt: isoOrNull(input.lastCheckedAt),
        lastRunAt: isoOrNull(input.lastRunAt),
        errorCount: input.errorCount,
        disabledReason: input.disabledReason,
        deletedAt: isoOrNull(input.deletedAt),
        runtimeStats: normalizeRuntimeStats(input.runtimeStats),
        now: isoOrNull(input.updatedAt) || options.now,
      }),
      tagIds: normalizeContentTagIds(input.tagIds),
    };
  } catch {
    return null;
  }
}

function normalizeUserScripts(value, options = {}) {
  const now = options.now || new Date().toISOString();
  const scripts = (Array.isArray(value) ? value : []).map((item) => normalizeUserScript(item, { now })).filter(Boolean);
  const byId = new Map(scripts.map((script) => [script.id, script]));
  for (const builtin of BUILTIN_USER_SCRIPTS) {
    const parsed = parseUserScript(builtin.sourceCode, {
      ...builtin,
      runtimeStats: normalizeRuntimeStats(builtin.runtimeStats),
      now,
    });
    const existing = byId.get(builtin.id);
    byId.set(builtin.id, existing
      ? {
        ...parsed,
        enabled: existing.enabled,
        createdAt: existing.createdAt,
        updatedAt: existing.updatedAt,
        lastRunAt: existing.lastRunAt,
        errorCount: existing.errorCount,
        disabledReason: existing.disabledReason,
        runtimeStats: normalizeRuntimeStats(existing.runtimeStats),
        tagIds: normalizeContentTagIds(existing.tagIds),
      }
      : { ...parsed, tagIds: [] });
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
      sanitizedMessage: String(item?.sanitizedMessage || "")
        .replace(/(?:Authorization:\s*|Bearer\s+|token[=:]\s*|cookie[=:]\s*)\S+/gi, "[REDACTED]")
        .replace(/https?:\/\/[^\s]+/gi, "[URL]")
        .slice(0, 300),
      durationMs: Math.max(0, Math.min(300_000, Number(item?.durationMs) || 0)),
      matchDurationMs: finiteMetric(item?.matchDurationMs),
      injectionDurationMs: finiteMetric(item?.injectionDurationMs),
      firstExecutionDurationMs: finiteMetric(item?.firstExecutionDurationMs),
      longTaskCount: finiteMetric(item?.longTaskCount, 100_000),
      observerCount: finiteMetric(item?.observerCount, 1_000_000),
      timerCount: finiteMetric(item?.timerCount, 1_000_000),
    };
  }).filter(Boolean).slice(-1000);
}

function versionFromScript(script, createdAt = new Date().toISOString()) {
  return {
    scriptId: String(script?.id || "").slice(0, 120),
    version: String(script?.version || "0.0.0").slice(0, 80),
    sourceHash: String(script?.sourceHash || sourceHash(script?.sourceCode)).slice(0, 128),
    sourceCode: String(script?.sourceCode || ""),
    createdAt: isoOrNull(createdAt) || new Date().toISOString(),
  };
}

function normalizeUserScriptVersions(value, scriptIds = []) {
  const allowed = new Set(scriptIds);
  const seen = new Set();
  return (Array.isArray(value) ? value : []).map((item) => {
    const scriptId = String(item?.scriptId || "").slice(0, 120);
    const sourceCode = String(item?.sourceCode || "");
    const hash = String(item?.sourceHash || sourceHash(sourceCode)).slice(0, 128);
    const key = `${scriptId}:${hash}`;
    if (!allowed.has(scriptId) || !sourceCode || seen.has(key)) return null;
    seen.add(key);
    return {
      scriptId,
      version: String(item?.version || "0.0.0").slice(0, 80),
      sourceHash: hash,
      sourceCode,
      createdAt: isoOrNull(item?.createdAt) || new Date().toISOString(),
    };
  }).filter(Boolean).slice(-10_000);
}

function appendVersionHistory(versions, script, createdAt) {
  if (!script?.id || !script?.sourceCode) return Array.isArray(versions) ? versions : [];
  const next = [...(Array.isArray(versions) ? versions : [])];
  const version = versionFromScript(script, createdAt);
  const index = next.findIndex((item) => item.scriptId === version.scriptId && item.sourceHash === version.sourceHash);
  if (index >= 0) next[index] = version;
  else next.push(version);
  const others = next.filter((item) => item.scriptId !== version.scriptId);
  const own = next.filter((item) => item.scriptId === version.scriptId)
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
    .slice(-20);
  return [...others, ...own].slice(-10_000);
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
  next.userScriptVersions = Array.isArray(next.userScriptVersions) ? next.userScriptVersions : [];
  if (existing) next.userScriptVersions = appendVersionHistory(next.userScriptVersions, existing, existing.updatedAt || now);
  next.userScriptVersions = appendVersionHistory(next.userScriptVersions, normalized, now);
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
  const now = options.now || new Date().toISOString();
  script.enabled = false;
  script.deletedAt = now;
  script.disabledReason = "脚本已删除，可从回收站恢复";
  script.updatedAt = now;
  next.updatedAt = now;
  return { state: next, script };
}

function restoreUserScript(state, scriptId, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script || !script.deletedAt) throw new Error("找不到已删除的用户脚本");
  const now = options.now || new Date().toISOString();
  script.deletedAt = null;
  script.disabledReason = null;
  script.updatedAt = now;
  next.updatedAt = now;
  return { state: next, script };
}

function rollbackUserScriptVersion(state, scriptId, versionHash, options = {}) {
  const id = String(scriptId || "");
  const existing = state.userScripts.find((item) => item.id === id);
  if (!existing) throw new Error("找不到用户脚本");
  const target = (state.userScriptVersions || []).find((item) => item.scriptId === id && item.sourceHash === String(versionHash || ""));
  if (!target) throw new Error("找不到可回滚的脚本版本");
  const now = options.now || new Date().toISOString();
  const result = upsertUserScript(state, {
    ...existing,
    sourceCode: target.sourceCode,
    version: target.version,
    sourceHash: target.sourceHash,
    deletedAt: null,
    disabledReason: null,
  }, { now });
  return { ...result, rolledBackTo: target };
}

function updateUserScriptEnabled(state, scriptId, enabled, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script) throw new Error("找不到用户脚本");
  script.enabled = enabled === true;
  script.updatedAt = options.now || new Date().toISOString();
  if (script.enabled) {
    script.errorCount = 0;
    script.deletedAt = null;
    script.disabledReason = null;
    const approved = new Set(next.userScriptPermissions
      .filter((item) => item.scriptId === script.id)
      .map((item) => `${item.permission}:${item.value}`));
    next.userScriptPermissions.push(...permissionsForScript(script, script.updatedAt)
      .filter((item) => !approved.has(`${item.permission}:${item.value}`)));
  }
  next.updatedAt = script.updatedAt;
  return { state: next, script };
}

function updateLocalhostConnectApproval(state, scriptId, hostname, approved, options = {}) {
  const next = structuredClone(state);
  const script = next.userScripts.find((item) => item.id === String(scriptId || ""));
  if (!script) throw new Error("找不到用户脚本");
  const host = String(hostname || "").trim().toLowerCase().replace(/^\[|\]$/g, "");
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) throw new Error("仅本机地址需要高级授权");
  next.userScriptPermissions = next.userScriptPermissions.filter((item) =>
    !(item.scriptId === script.id && item.permission === "localhost-connect" && item.value === host));
  const now = options.now || new Date().toISOString();
  if (approved === true) next.userScriptPermissions.push({ scriptId: script.id, permission: "localhost-connect", value: host, approvedAt: now });
  script.updatedAt = now;
  next.updatedAt = now;
  return { state: next, script, hostname: host, approved: approved === true };
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
  const now = options.now || new Date().toISOString();
  const script = next.userScripts.find((item) => item.id === normalized.scriptId);
  let autoDisabled = false;
  if (script) {
    script.lastRunAt = normalized.finishedAt || normalized.startedAt || now;
    const stats = normalizeRuntimeStats(script.runtimeStats);
    stats.runCount += 1;
    if (normalized.status === "success") stats.successCount += 1;
    if (normalized.status === "failure") stats.failureCount += 1;
    if (normalized.status === "timeout") stats.timeoutCount += 1;
    stats.totalMatchDurationMs += normalized.matchDurationMs || 0;
    stats.totalInjectionDurationMs += normalized.injectionDurationMs || 0;
    stats.totalFirstExecutionDurationMs += normalized.firstExecutionDurationMs || 0;
    stats.longTaskCount += normalized.longTaskCount || 0;
    if (normalized.observerCount !== null) stats.observerCount = normalized.observerCount;
    if (normalized.timerCount !== null) stats.timerCount = normalized.timerCount;
    script.runtimeStats = stats;
    if (normalized.status === "success") {
      script.errorCount = 0;
      if (script.disabledReason?.startsWith("连续严重错误")) script.disabledReason = null;
    } else if (SEVERE_EXECUTION_STATES.has(normalized.status)) {
      script.errorCount = Math.max(0, Number(script.errorCount) || 0) + 1;
      const threshold = Math.max(1, Math.min(20, Number(options.autoDisableThreshold) || DEFAULT_AUTO_DISABLE_THRESHOLD));
      if (script.errorCount >= threshold && script.sourceType !== "builtIn") {
        script.enabled = false;
        script.disabledReason = `连续严重错误 ${script.errorCount} 次，已自动暂停`;
        autoDisabled = true;
      }
    }
    script.updatedAt = now;
  }
  next.updatedAt = now;
  return { state: next, execution: normalized, script, autoDisabled };
}

module.exports = {
  appendUserScriptExecution,
  appendVersionHistory,
  DEFAULT_AUTO_DISABLE_THRESHOLD,
  normalizeExecutions,
  normalizePermissions,
  normalizeUserScript,
  normalizeUserScripts,
  normalizeUserScriptVersions,
  normalizeRuntimeStats,
  normalizeValues,
  permissionsForScript,
  removeUserScript,
  restoreUserScript,
  rollbackUserScriptVersion,
  sourceHash,
  updateBuiltInSiteApproval,
  updateSensitiveSiteApproval,
  updateLocalhostConnectApproval,
  updateUserScriptEnabled,
  upsertUserScript,
  versionFromScript,
};
