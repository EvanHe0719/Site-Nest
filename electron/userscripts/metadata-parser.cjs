const { createHash, randomUUID } = require("node:crypto");

const SUPPORTED_RUN_AT = new Set(["document-start", "document-end", "document-idle"]);
const SUPPORTED_GRANTS = new Set([
  "none",
  "GM_addStyle",
  "GM_getValue",
  "GM_setValue",
  "GM_deleteValue",
  "GM_listValues",
  "GM_registerMenuCommand",
  "GM_openInTab",
  "GM_notification",
  "GM_xmlhttpRequest",
]);
const MULTI_VALUE_KEYS = new Set([
  "match", "include", "exclude", "grant", "connect", "require", "resource",
]);

class UserScriptParseError extends Error {
  constructor(message, code = "USERSCRIPT_INVALID") {
    super(message);
    this.name = "UserScriptParseError";
    this.code = code;
  }
}

function sourceHash(sourceCode) {
  return createHash("sha256").update(String(sourceCode || ""), "utf8").digest("hex");
}

function metadataBlock(sourceCode) {
  const source = String(sourceCode || "");
  if (!source || Buffer.byteLength(source, "utf8") > 1_048_576) {
    throw new UserScriptParseError("用户脚本不能为空且不能超过 1 MB");
  }
  const match = /\/\/\s*==UserScript==([\s\S]*?)\/\/\s*==\/UserScript==/i.exec(source);
  if (!match) throw new UserScriptParseError("缺少 UserScript metadata 区块", "USERSCRIPT_METADATA_MISSING");
  return match[1];
}

function parseMetadata(sourceCode) {
  const block = metadataBlock(sourceCode);
  const metadata = {};
  for (const line of block.split(/\r?\n/)) {
    const match = /^\s*\/\/\s*@([\w-]+)\s*(.*?)\s*$/.exec(line);
    if (!match) continue;
    const key = match[1].toLowerCase();
    const value = match[2].trim();
    if (!value) continue;
    if (MULTI_VALUE_KEYS.has(key)) {
      if (!Array.isArray(metadata[key])) metadata[key] = [];
      metadata[key].push(value);
    } else if (metadata[key] === undefined) {
      metadata[key] = value;
    }
  }
  return metadata;
}

function normalizeStringList(value, limit = 100) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim())
    .filter(Boolean))).slice(0, limit);
}

function compatibilityReport(metadata) {
  const unsupported = [];
  const warnings = [];
  const grants = normalizeStringList(metadata.grant);
  grants.filter((grant) => !SUPPORTED_GRANTS.has(grant)).forEach((grant) => unsupported.push(`不支持 @grant ${grant}`));
  if (normalizeStringList(metadata.require).length) unsupported.push("第一阶段不支持 @require 远程依赖");
  if (normalizeStringList(metadata.resource).length) unsupported.push("第一阶段不支持 @resource");
  const connects = normalizeStringList(metadata.connect);
  if (connects.includes("*")) unsupported.push("@connect * 不允许默认放行");
  if (grants.includes("unsafeWindow")) unsupported.push("不支持 unsafeWindow");
  const runAt = metadata["run-at"] || "document-end";
  if (!SUPPORTED_RUN_AT.has(runAt)) unsupported.push(`不支持 @run-at ${runAt}`);
  if (!normalizeStringList(metadata.match).length && !normalizeStringList(metadata.include).length) {
    warnings.push("没有 @match 或 @include，脚本不会自动运行");
  }
  return { compatible: unsupported.length === 0, unsupported, warnings };
}

function parseUserScript(sourceCode, options = {}) {
  const metadata = parseMetadata(sourceCode);
  const report = compatibilityReport(metadata);
  const now = options.now || new Date().toISOString();
  const name = String(metadata.name || options.fallbackName || "未命名用户脚本").trim().slice(0, 160);
  return {
    id: String(options.id || randomUUID()),
    name,
    namespace: String(metadata.namespace || "local.qiye.userscripts").slice(0, 300),
    version: String(metadata.version || "0.0.0").slice(0, 80),
    description: String(metadata.description || "").slice(0, 1000),
    author: String(metadata.author || "").slice(0, 160),
    sourceType: options.sourceType || "pasted",
    sourceUrl: options.sourceUrl || null,
    sourceCode: String(sourceCode),
    sourceHash: sourceHash(sourceCode),
    enabled: options.enabled === true,
    autoUpdate: false,
    matches: normalizeStringList(metadata.match),
    includes: normalizeStringList(metadata.include),
    excludes: normalizeStringList(metadata.exclude),
    runAt: SUPPORTED_RUN_AT.has(metadata["run-at"]) ? metadata["run-at"] : "document-end",
    grants: normalizeStringList(metadata.grant).filter((grant) => grant !== "none"),
    connects: normalizeStringList(metadata.connect),
    workspaceIds: normalizeStringList(options.workspaceIds),
    browserProfileIds: normalizeStringList(options.browserProfileIds),
    createdAt: options.createdAt || now,
    updatedAt: now,
    lastCheckedAt: options.lastCheckedAt || null,
    compatibility: report,
  };
}

module.exports = {
  SUPPORTED_GRANTS,
  SUPPORTED_RUN_AT,
  UserScriptParseError,
  compatibilityReport,
  parseMetadata,
  parseUserScript,
  sourceHash,
};
