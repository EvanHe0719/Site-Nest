const { createHash } = require("node:crypto");

const AUTH_QUERY_KEYS = new Set([
  "access_token", "auth", "authorization", "code", "id_token", "oauth_token",
  "password", "refresh_token", "samlresponse", "session", "state", "ticket", "token",
]);

const ARRAY_SPECS = Object.freeze({
  workspace: { stateKey: "workspaces", id: (item) => item.id },
  site: { stateKey: "sites", id: (item) => item.id },
  bookmark: { stateKey: "bookmarks", id: (item) => item.id || item.url },
  searchHistoryEntry: { stateKey: "searchHistory", id: (item) => item.id },
  browsingHistoryEntry: { stateKey: "browsingHistory", id: (item) => item.id },
  usageDayAggregate: { stateKey: "usageDayAggregates", id: (item) => item.localDate || item.date },
  task: { stateKey: "localTasks", id: (item) => item.id },
  timelineEvent: { stateKey: "timelineEvents", id: (item) => item.id },
  timelineTrack: { stateKey: "timelineTracks", id: (item) => item.id },
  habit: { stateKey: "habits", id: (item) => item.id },
  habitCheckIn: {
    stateKey: "habitCheckIns",
    id: (item) => `${item.habitId || "unknown"}:${item.localDate || item.id || "unknown"}`,
  },
  rewardLedger: {
    stateKey: "rewardLedger",
    id: (item) => item.operationId || item.id || `${item.sourceId || "unknown"}:${item.localDate || "unknown"}`,
  },
  contentTagGroup: { stateKey: "contentTagGroups", id: (item) => item.id },
  contentTag: { stateKey: "contentTags", id: (item) => item.id },
  contentTagAlias: { stateKey: "contentTagAliases", id: (item) => item.id },
  externalObjectLink: { stateKey: "externalObjectLinks", id: (item) => item.id },
  userScriptMetadata: { stateKey: "userScripts", id: (item) => item.id },
});

const MAP_SPECS = Object.freeze({
  automationDefinition: { stateKey: "automations" },
  assistantSetting: { stateKey: "assistantSettings" },
});

const SINGLETON_SPECS = Object.freeze({
  timelineUiSettings: { stateKey: "timelineUiSettings", entityId: "default" },
  syncPreference: { stateKey: "uiSettings", entityId: "google-sync", pick: (value) => value?.googleSync || {} },
  applicationSetting: {
    stateKey: "uiSettings",
    entityId: "shared",
    pick: (value) => ({
      search: value?.search || {},
      sitePopupPolicies: value?.sitePopupPolicies || {},
      translation: value?.translation || {},
    }),
  },
  taskSetting: { stateKey: "taskSettings", entityId: "default" },
  shortcutProfile: { stateKey: "shortcutProfiles", entityId: "profiles" },
  shortcutBinding: { stateKey: "shortcutBindings", entityId: "bindings" },
});

const EXCLUDED_USER_SCRIPT_KEYS = new Set([
  "code", "content", "rawSource", "source", "sourceCode", "sourceText",
]);

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
}

function stableSerialize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableSerialize).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableSerialize(value[key])}`).join(",")}}`;
}

function payloadHash(value) {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

function sanitizeUrl(value) {
  if (typeof value !== "string") return value;
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return value.slice(0, 4096);
  }
  if (!["http:", "https:"].includes(parsed.protocol)) return "";
  parsed.username = "";
  parsed.password = "";
  parsed.hash = "";
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (AUTH_QUERY_KEYS.has(key.toLowerCase())) parsed.searchParams.delete(key);
  }
  return parsed.toString().slice(0, 4096);
}

function sanitizeValue(value, key = "", options = {}) {
  if (value == null || ["string", "number", "boolean"].includes(typeof value)) {
    return /(?:url|link)$/i.test(key) ? sanitizeUrl(value) : value;
  }
  if (Array.isArray(value)) return value.map((item) => sanitizeValue(item, key, options));
  if (typeof value !== "object") return undefined;
  const output = {};
  for (const [childKey, childValue] of Object.entries(value)) {
    if (/token|secret|password|authorization|cookie/i.test(childKey)) continue;
    if (options.userScriptMetadata && EXCLUDED_USER_SCRIPT_KEYS.has(childKey)) continue;
    const sanitized = sanitizeValue(childValue, childKey, options);
    if (sanitized !== undefined) output[childKey] = sanitized;
  }
  return output;
}

function entityUpdatedAt(payload, fallback) {
  for (const value of [payload?.updatedAt, payload?.completedAt, payload?.createdAt, fallback]) {
    const timestamp = Date.parse(value || "");
    if (Number.isFinite(timestamp)) return new Date(timestamp).toISOString();
  }
  return new Date(0).toISOString();
}

function syncOptionEnabled(state, entityType) {
  const options = state?.uiSettings?.googleSync || {};
  if (["site", "workspace", "bookmark"].includes(entityType)) return options.sites !== false;
  if (["task"].includes(entityType)) return options.plans !== false;
  if (["userScriptMetadata"].includes(entityType)) return options.userScriptMetadata !== false;
  if (entityType === "searchHistoryEntry") return options.searchHistory === true;
  if (entityType === "browsingHistoryEntry") return options.browsingHistory === true;
  if (entityType === "usageDayAggregate") return options.usageHistory === true;
  if (["shortcutProfile", "shortcutBinding"].includes(entityType)) return options.settings !== false;
  return options.settings !== false;
}

function buildSyncEntities(state = {}) {
  const entities = new Map();
  const add = (entityType, entityId, rawPayload, options = {}) => {
    if (!syncOptionEnabled(state, entityType)) return;
    const id = String(entityId || "").trim();
    if (!id || rawPayload == null) return;
    const payload = sanitizeValue(rawPayload, "", options);
    const key = `${entityType}:${id}`;
    entities.set(key, {
      entityType,
      entityId: id,
      payload,
      payloadHash: payloadHash(payload),
      updatedAt: entityUpdatedAt(payload, state.updatedAt || state.createdAt),
    });
  };

  for (const [entityType, spec] of Object.entries(ARRAY_SPECS)) {
    for (const item of Array.isArray(state[spec.stateKey]) ? state[spec.stateKey] : []) {
      add(entityType, spec.id(item), item, { userScriptMetadata: entityType === "userScriptMetadata" });
    }
  }
  for (const [entityType, spec] of Object.entries(MAP_SPECS)) {
    const value = state[spec.stateKey];
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    for (const [entityId, payload] of Object.entries(value)) add(entityType, entityId, payload);
  }
  for (const [entityType, spec] of Object.entries(SINGLETON_SPECS)) {
    const source = state[spec.stateKey];
    const payload = spec.pick ? spec.pick(source) : source;
    if (payload && typeof payload === "object") add(entityType, spec.entityId, payload);
  }
  return entities;
}

function arrayRecordId(spec, item) {
  return String(spec.id(item) || "");
}

function applyEntityOperationToState(state, operation) {
  const next = clone(state) || {};
  const entityType = String(operation.entityType || "");
  const entityId = String(operation.entityId || "");
  const deleting = operation.operation === "delete";
  const arraySpec = ARRAY_SPECS[entityType];
  if (arraySpec) {
    const values = Array.isArray(next[arraySpec.stateKey]) ? [...next[arraySpec.stateKey]] : [];
    const index = values.findIndex((item) => arrayRecordId(arraySpec, item) === entityId);
    if (deleting) {
      if (index >= 0) values.splice(index, 1);
    } else if (entityType === "userScriptMetadata" && index >= 0) {
      values[index] = { ...values[index], ...clone(operation.payload) };
    } else if (index >= 0) {
      values[index] = clone(operation.payload);
    } else {
      values.push(clone(operation.payload));
    }
    next[arraySpec.stateKey] = values;
    return next;
  }
  const mapSpec = MAP_SPECS[entityType];
  if (mapSpec) {
    const values = { ...(next[mapSpec.stateKey] || {}) };
    if (deleting) delete values[entityId];
    else values[entityId] = clone(operation.payload);
    next[mapSpec.stateKey] = values;
    return next;
  }
  const singletonSpec = SINGLETON_SPECS[entityType];
  if (singletonSpec) {
    if (entityType === "syncPreference") {
      next.uiSettings = { ...(next.uiSettings || {}), googleSync: deleting ? {} : clone(operation.payload) };
    } else if (entityType === "applicationSetting") {
      next.uiSettings = deleting
        ? { ...(next.uiSettings || {}), search: {}, sitePopupPolicies: {}, translation: {} }
        : { ...(next.uiSettings || {}), ...clone(operation.payload) };
    } else {
      next[singletonSpec.stateKey] = deleting ? (Array.isArray(next[singletonSpec.stateKey]) ? [] : {}) : clone(operation.payload);
    }
  }
  return next;
}

function conflictPolicyFor(entityType) {
  if (["timelineEvent", "task", "userScriptMetadata"].includes(entityType)) return "manual";
  if (["habitCheckIn", "rewardLedger"].includes(entityType)) return "unique-record";
  return "newer-updated-at";
}

module.exports = {
  ARRAY_SPECS,
  applyEntityOperationToState,
  buildSyncEntities,
  conflictPolicyFor,
  payloadHash,
  sanitizeUrl,
  stableSerialize,
};
