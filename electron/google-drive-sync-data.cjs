const { createHash } = require("node:crypto");
const { CURRENT_SCHEMA_VERSION } = require("./state-model.cjs");

const SYNC_ENVELOPE_KIND = "site-nest-google-drive-sync";
const SYNC_ENVELOPE_VERSION = 1;
const MAX_ENVELOPE_BYTES = 5 * 1024 * 1024;
const MAX_WORKSPACES = 100;
const MAX_SITES = 10000;
const MAX_BOOKMARKS = 50000;
const MAX_BROWSER_PROFILES = 500;
const MAX_SETTING_ENTRIES = 500;

const DANGEROUS_OBJECT_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const SENSITIVE_URL_PARAMETER = /^(?:access_token|refresh_token|id_token|token|oauth_token|oauth_verifier|authorization|auth|code|client_id|client_secret|redirect_uri|response_type|scope|state|session|session_id|sid|password|passwd|api_key|apikey)$/i;
const SENSITIVE_FRAGMENT = /(?:^|[?&#])(?:access_token|refresh_token|id_token|token|oauth_token|oauth_verifier|authorization|auth|code|client_id|client_secret|redirect_uri|response_type|scope|state|session|session_id|sid|password|passwd|api_key|apikey)=|\b(?:Bearer|Basic|Zoho-oauthtoken)\s+[A-Za-z0-9._~+/=-]+/i;

class GoogleDriveSyncDataError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "GoogleDriveSyncDataError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function assertRecord(value, code, message) {
  if (!isRecord(value)) throw new GoogleDriveSyncDataError(code, message);
  return value;
}

function assertArray(value, label, maximum) {
  if (!Array.isArray(value)) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_SNAPSHOT",
      `${label} 必须是数组`,
    );
  }
  if (value.length > maximum) {
    throw new GoogleDriveSyncDataError(
      "SYNC_SNAPSHOT_TOO_LARGE",
      `${label} 数量超过安全上限`,
      { maximum, received: value.length },
    );
  }
  return value;
}

function boundedString(value, label, maximum, options = {}) {
  if (typeof value !== "string") {
    if (!options.required && (value === null || value === undefined)) return null;
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_SNAPSHOT",
      `${label} 必须是文本`,
    );
  }
  const normalized = options.trim === false ? value : value.trim();
  if (options.required && !normalized) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_SNAPSHOT",
      `${label} 不能为空`,
    );
  }
  return scrubSensitiveText(normalized).slice(0, maximum);
}

function safeIdentifier(value, label, maximum = 120) {
  const id = boundedString(value, label, maximum, { required: true });
  if (DANGEROUS_OBJECT_KEYS.has(id)) {
    throw new GoogleDriveSyncDataError(
      "UNSAFE_SYNC_IDENTIFIER",
      `${label} 使用了不安全的编号`,
    );
  }
  return id;
}

function optionalIso(value, label) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value !== "string") {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_TIMESTAMP",
      `${label} 不是有效时间`,
    );
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_TIMESTAMP",
      `${label} 不是有效时间`,
    );
  }
  return parsed.toISOString();
}

function requiredIso(value, label) {
  const normalized = optionalIso(value, label);
  if (!normalized) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_TIMESTAMP",
      `${label} 不能为空`,
    );
  }
  return normalized;
}

function scrubSensitiveText(value) {
  return String(value || "")
    .replace(
      /\b(Bearer|Basic|Zoho-oauthtoken)\s+[A-Za-z0-9._~+/=-]+/gi,
      "$1 [REDACTED]",
    )
    .replace(
      /\b(access[-_]?token|refresh[-_]?token|id[-_]?token|oauth[-_]?token|token|authorization|cookie|password|passwd|client[-_]?secret|api[-_]?key|secret|session[-_]?id)\b\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    );
}

function sanitizeHttpUrl(value, label) {
  if (typeof value !== "string" || !value.trim()) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_URL",
      `${label} 不是有效网址`,
    );
  }
  let parsed;
  try {
    parsed = new URL(value.trim());
  } catch {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_URL",
      `${label} 不是有效网址`,
    );
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_URL",
      `${label} 仅支持 HTTP 或 HTTPS`,
    );
  }
  parsed.username = "";
  parsed.password = "";
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (SENSITIVE_URL_PARAMETER.test(key)) parsed.searchParams.delete(key);
  }
  if (SENSITIVE_FRAGMENT.test(parsed.hash.slice(1))) parsed.hash = "";
  return parsed.toString();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function normalizeWorkspaces(value) {
  const source = assertArray(value, "workspaces", MAX_WORKSPACES);
  if (!source.length) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_SNAPSHOT",
      "同步快照至少需要一个空间",
    );
  }
  const seen = new Set();
  return source.map((candidate, index) => {
    assertRecord(candidate, "INVALID_SYNC_SNAPSHOT", `第 ${index + 1} 个空间无效`);
    const id = safeIdentifier(candidate.id, `workspaces[${index}].id`);
    if (seen.has(id)) {
      throw new GoogleDriveSyncDataError(
        "DUPLICATE_SYNC_ID",
        `空间编号重复：${id}`,
      );
    }
    seen.add(id);
    return {
      id,
      name: boundedString(candidate.name || id, `workspaces[${index}].name`, 80, {
        required: true,
      }),
      type: boundedString(candidate.type || "custom", `workspaces[${index}].type`, 40, {
        required: true,
      }),
      icon: boundedString(candidate.icon || "folder", `workspaces[${index}].icon`, 80, {
        required: true,
      }),
      sortOrder: finiteNumber(candidate.sortOrder, index),
      isSystem: Boolean(candidate.isSystem),
      createdAt: optionalIso(candidate.createdAt, `workspaces[${index}].createdAt`),
      updatedAt: optionalIso(candidate.updatedAt, `workspaces[${index}].updatedAt`),
    };
  });
}

function normalizeBrowserProfiles(value) {
  const source = assertArray(value, "browserProfiles", MAX_BROWSER_PROFILES);
  const seen = new Set();
  return source.map((candidate, index) => {
    assertRecord(
      candidate,
      "INVALID_SYNC_SNAPSHOT",
      `第 ${index + 1} 个浏览器身份无效`,
    );
    const id = safeIdentifier(candidate.id, `browserProfiles[${index}].id`);
    if (seen.has(id)) {
      throw new GoogleDriveSyncDataError(
        "DUPLICATE_SYNC_ID",
        `浏览器身份编号重复：${id}`,
      );
    }
    seen.add(id);
    return {
      id,
      name: boundedString(candidate.name || id, `browserProfiles[${index}].name`, 80, {
        required: true,
      }),
      type: boundedString(candidate.type || "adapter", `browserProfiles[${index}].type`, 60, {
        required: true,
      }),
      isSystem: Boolean(candidate.isSystem),
      isReal: Boolean(candidate.isReal),
      createdAt: optionalIso(candidate.createdAt, `browserProfiles[${index}].createdAt`),
      updatedAt: optionalIso(candidate.updatedAt, `browserProfiles[${index}].updatedAt`),
    };
  });
}

function normalizeSites(value, workspaceIds, browserProfileIds) {
  const source = assertArray(value, "sites", MAX_SITES);
  const seen = new Set();
  return source.map((candidate, index) => {
    assertRecord(candidate, "INVALID_SYNC_SNAPSHOT", `第 ${index + 1} 个站点无效`);
    const id = safeIdentifier(candidate.id, `sites[${index}].id`);
    if (seen.has(id)) {
      throw new GoogleDriveSyncDataError(
        "DUPLICATE_SYNC_ID",
        `站点编号重复：${id}`,
      );
    }
    seen.add(id);
    const workspaceId = safeIdentifier(
      candidate.workspaceId,
      `sites[${index}].workspaceId`,
    );
    if (!workspaceIds.has(workspaceId)) {
      throw new GoogleDriveSyncDataError(
        "SYNC_REFERENCE_MISMATCH",
        `站点 ${id} 对应的空间不存在`,
      );
    }
    const browserProfileId = safeIdentifier(
      candidate.browserProfileId || "default",
      `sites[${index}].browserProfileId`,
    );
    if (browserProfileIds.size && !browserProfileIds.has(browserProfileId)) {
      throw new GoogleDriveSyncDataError(
        "SYNC_REFERENCE_MISMATCH",
        `站点 ${id} 对应的浏览器身份不存在`,
      );
    }
    const assistantIds = Array.isArray(candidate.assistantIds)
      ? Array.from(
          new Set(
            candidate.assistantIds
              .slice(0, 100)
              .map((assistantId, assistantIndex) =>
                safeIdentifier(
                  assistantId,
                  `sites[${index}].assistantIds[${assistantIndex}]`,
                ),
              ),
          ),
        )
      : [];
    const color = /^#[0-9a-f]{6}$/i.test(candidate.color || "")
      ? String(candidate.color).toLowerCase()
      : "#5b7cfa";
    return {
      id,
      name: boundedString(candidate.name, `sites[${index}].name`, 80, {
        required: true,
      }),
      shortName: boundedString(candidate.shortName || "页", `sites[${index}].shortName`, 3, {
        required: true,
      }),
      url: sanitizeHttpUrl(candidate.url, `sites[${index}].url`),
      color,
      source: boundedString(candidate.source || "custom", `sites[${index}].source`, 40, {
        required: true,
      }),
      description: boundedString(
        candidate.description || "",
        `sites[${index}].description`,
        180,
        { trim: false },
      ) || "",
      workspaceId,
      siteKind: candidate.siteKind === "workApp" ? "workApp" : "normal",
      openMode: candidate.openMode === "external" ? "external" : "internal",
      browserProfileId,
      assistantIds,
      pinned: candidate.pinned !== false,
      order: finiteNumber(candidate.order, index),
      createdAt: optionalIso(candidate.createdAt, `sites[${index}].createdAt`),
      updatedAt: optionalIso(candidate.updatedAt, `sites[${index}].updatedAt`),
    };
  });
}

function normalizeBookmarks(value) {
  const source = assertArray(value, "bookmarks", MAX_BOOKMARKS);
  const seen = new Set();
  return source.map((candidate, index) => {
    assertRecord(candidate, "INVALID_SYNC_SNAPSHOT", `第 ${index + 1} 个书签无效`);
    const id = safeIdentifier(candidate.id, `bookmarks[${index}].id`, 160);
    if (seen.has(id)) {
      throw new GoogleDriveSyncDataError(
        "DUPLICATE_SYNC_ID",
        `书签编号重复：${id}`,
      );
    }
    seen.add(id);
    return {
      id,
      name: boundedString(candidate.name, `bookmarks[${index}].name`, 300, {
        required: true,
      }),
      url: sanitizeHttpUrl(candidate.url, `bookmarks[${index}].url`),
      folder: boundedString(candidate.folder || "未分类", `bookmarks[${index}].folder`, 500, {
        required: true,
      }),
      addedAt: optionalIso(candidate.addedAt, `bookmarks[${index}].addedAt`),
      sourceProfile: boundedString(
        candidate.sourceProfile || "Chrome",
        `bookmarks[${index}].sourceProfile`,
        200,
        { required: true },
      ),
    };
  });
}

function normalizeAssistantSettings(value) {
  const input = assertRecord(
    value,
    "INVALID_SYNC_SNAPSHOT",
    "assistantSettings 必须是对象",
  );
  const entries = Object.entries(input);
  if (entries.length > MAX_SETTING_ENTRIES) {
    throw new GoogleDriveSyncDataError(
      "SYNC_SNAPSHOT_TOO_LARGE",
      "assistantSettings 数量超过安全上限",
    );
  }
  const result = {};
  for (const [rawId, candidate] of entries) {
    const id = safeIdentifier(rawId, "assistantSettings.id");
    if (typeof candidate !== "boolean" && !isRecord(candidate)) {
      throw new GoogleDriveSyncDataError(
        "INVALID_SYNC_SNAPSHOT",
        `助手 ${id} 的设置无效`,
      );
    }
    const setting = typeof candidate === "boolean" ? { enabled: candidate } : candidate;
    result[id] = {
      enabled: setting.enabled !== false,
      updatedAt: optionalIso(setting.updatedAt, `assistantSettings.${id}.updatedAt`),
    };
  }
  return result;
}

function normalizeAutomationSettings(value) {
  const input = assertRecord(
    value,
    "INVALID_SYNC_SNAPSHOT",
    "automationSettings 必须是对象",
  );
  const entries = Object.entries(input);
  if (entries.length > MAX_SETTING_ENTRIES) {
    throw new GoogleDriveSyncDataError(
      "SYNC_SNAPSHOT_TOO_LARGE",
      "automationSettings 数量超过安全上限",
    );
  }
  const result = {};
  for (const [rawId, candidate] of entries) {
    const id = safeIdentifier(rawId, "automationSettings.id");
    assertRecord(
      candidate,
      "INVALID_SYNC_SNAPSHOT",
      `自动化 ${id} 的设置无效`,
    );
    const setting = { enabled: candidate.enabled === true };
    if (candidate.time !== undefined && candidate.time !== null) {
      if (typeof candidate.time !== "string" || !/^([01]\d|2[0-3]):[0-5]\d$/.test(candidate.time)) {
        throw new GoogleDriveSyncDataError(
          "INVALID_SYNC_SNAPSHOT",
          `自动化 ${id} 的时间无效`,
        );
      }
      setting.time = candidate.time;
    }
    result[id] = setting;
  }
  return result;
}

function normalizeSnapshot(value) {
  const input = assertRecord(
    value,
    "INVALID_SYNC_SNAPSHOT",
    "同步快照必须是对象",
  );
  const version = Number(input.version);
  if (!Number.isInteger(version) || version < 1) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_STATE_VERSION",
      "同步快照的数据版本无效",
    );
  }
  if (version > CURRENT_SCHEMA_VERSION) {
    throw new GoogleDriveSyncDataError(
      "UNSUPPORTED_SYNC_STATE_VERSION",
      `云端数据版本 ${version} 高于当前支持的版本 ${CURRENT_SCHEMA_VERSION}`,
    );
  }
  const workspaces = normalizeWorkspaces(input.workspaces);
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const browserProfiles = normalizeBrowserProfiles(input.browserProfiles);
  const browserProfileIds = new Set(browserProfiles.map((profile) => profile.id));
  const activeWorkspaceId = safeIdentifier(
    input.activeWorkspaceId,
    "activeWorkspaceId",
  );
  if (!workspaceIds.has(activeWorkspaceId)) {
    throw new GoogleDriveSyncDataError(
      "SYNC_REFERENCE_MISMATCH",
      "当前空间不在同步空间列表中",
    );
  }
  return {
    version,
    workspaces,
    sites: normalizeSites(input.sites, workspaceIds, browserProfileIds),
    bookmarks: normalizeBookmarks(input.bookmarks),
    browserProfiles,
    assistantSettings: normalizeAssistantSettings(input.assistantSettings),
    automationSettings: normalizeAutomationSettings(input.automationSettings),
    activeWorkspaceId,
  };
}

function envelopeByteLength(value) {
  let serialized;
  try {
    serialized = typeof value === "string" ? value : JSON.stringify(value);
  } catch {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_ENVELOPE",
      "云端同步数据无法序列化",
    );
  }
  if (typeof serialized !== "string") {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_ENVELOPE",
      "云端同步数据无法序列化",
    );
  }
  if (Buffer.byteLength(serialized, "utf8") > MAX_ENVELOPE_BYTES) {
    throw new GoogleDriveSyncDataError(
      "SYNC_ENVELOPE_TOO_LARGE",
      "云端同步数据超过安全大小限制",
    );
  }
  return serialized;
}

function normalizeRemoteEnvelope(value) {
  const serialized = envelopeByteLength(value);
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(serialized);
    } catch {
      throw new GoogleDriveSyncDataError(
        "INVALID_SYNC_ENVELOPE",
        "云端同步数据不是有效 JSON",
      );
    }
  }
  const input = assertRecord(
    parsed,
    "INVALID_SYNC_ENVELOPE",
    "云端同步数据必须是对象",
  );
  if (input.kind !== SYNC_ENVELOPE_KIND) {
    throw new GoogleDriveSyncDataError(
      "INVALID_SYNC_ENVELOPE_KIND",
      "云端文件不是栖页同步数据",
    );
  }
  if (input.envelopeVersion !== SYNC_ENVELOPE_VERSION) {
    throw new GoogleDriveSyncDataError(
      "UNSUPPORTED_SYNC_ENVELOPE_VERSION",
      "云端同步封装版本不受支持",
    );
  }
  return {
    kind: SYNC_ENVELOPE_KIND,
    envelopeVersion: SYNC_ENVELOPE_VERSION,
    updatedAt: requiredIso(input.updatedAt, "updatedAt"),
    snapshot: normalizeSnapshot(input.snapshot),
  };
}

function validateRemoteEnvelope(value) {
  try {
    return { ok: true, envelope: normalizeRemoteEnvelope(value), error: null };
  } catch (error) {
    return {
      ok: false,
      envelope: null,
      error: {
        code: error?.code || "INVALID_SYNC_ENVELOPE",
        message: error?.message || "云端同步数据无效",
      },
    };
  }
}

function createSafeSnapshot(state) {
  const input = assertRecord(
    state,
    "INVALID_LOCAL_STATE",
    "本地数据必须是对象",
  );
  return normalizeSnapshot({
    version: input.version,
    workspaces: input.workspaces,
    sites: input.sites,
    bookmarks: input.bookmarks,
    browserProfiles: input.browserProfiles,
    assistantSettings: input.assistantSettings,
    automationSettings: input.automationSettings || input.automations,
    activeWorkspaceId: input.activeWorkspaceId,
  });
}

function createSyncEnvelope(state, options = {}) {
  const snapshot = createSafeSnapshot(state);
  let updatedAt = null;
  for (const candidate of [options.updatedAt, state.updatedAt, state.createdAt, options.now]) {
    try {
      updatedAt = optionalIso(candidate, "updatedAt");
    } catch {
      updatedAt = null;
    }
    if (updatedAt) break;
  }
  if (!updatedAt) updatedAt = new Date().toISOString();
  return {
    kind: SYNC_ENVELOPE_KIND,
    envelopeVersion: SYNC_ENVELOPE_VERSION,
    updatedAt,
    snapshot,
  };
}

function compareUpdatedAt(left, right) {
  const leftValue = typeof left === "string" ? left : left?.updatedAt;
  const rightValue = typeof right === "string" ? right : right?.updatedAt;
  const leftTime = Date.parse(requiredIso(leftValue, "left.updatedAt"));
  const rightTime = Date.parse(requiredIso(rightValue, "right.updatedAt"));
  return leftTime === rightTime ? 0 : leftTime > rightTime ? 1 : -1;
}

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(",")}]`;
  }
  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`)
    .join(",")}}`;
}

function snapshotFingerprint(snapshot) {
  const normalized = normalizeSnapshot(snapshot);
  return createHash("sha256").update(stableSerialize(normalized)).digest("hex");
}

function decideSyncAction(input = {}) {
  const local = input.localEnvelope == null
    ? null
    : normalizeRemoteEnvelope(input.localEnvelope);
  const remote = input.remoteEnvelope == null
    ? null
    : normalizeRemoteEnvelope(input.remoteEnvelope);
  if (!local && !remote) {
    return { action: "noop", direction: "noop", reason: "no-snapshots" };
  }
  if (local && !remote) {
    return { action: "first-upload", direction: "upload", reason: "remote-missing" };
  }
  if (!local && remote) {
    return { action: "first-download", direction: "download", reason: "local-missing" };
  }
  const localFingerprint = snapshotFingerprint(local.snapshot);
  const remoteFingerprint = snapshotFingerprint(remote.snapshot);
  if (localFingerprint === remoteFingerprint) {
    return { action: "same", direction: "noop", reason: "same-snapshot" };
  }
  const comparison = compareUpdatedAt(local, remote);
  if (comparison > 0) {
    return { action: "upload", direction: "upload", reason: "local-newer" };
  }
  if (comparison < 0) {
    return { action: "download", direction: "download", reason: "remote-newer" };
  }
  return {
    action: "noop",
    direction: "noop",
    reason: "equal-timestamp-conflict",
  };
}

module.exports = {
  GoogleDriveSyncDataError,
  MAX_ENVELOPE_BYTES,
  SYNC_ENVELOPE_KIND,
  SYNC_ENVELOPE_VERSION,
  compareUpdatedAt,
  createSafeSnapshot,
  createSyncEnvelope,
  decideSyncAction,
  normalizeRemoteEnvelope,
  snapshotFingerprint,
  validateRemoteEnvelope,
};
