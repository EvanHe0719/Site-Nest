const { normalizeRemoteEnvelope } = require("./google-drive-sync-data.cjs");
const { CURRENT_SCHEMA_VERSION, migrateState } = require("./state-model.cjs");

function cloneValue(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function mergeAssistantSettings(localSettings, remoteSettings) {
  const local = localSettings && typeof localSettings === "object"
    ? localSettings
    : {};
  const remote = remoteSettings && typeof remoteSettings === "object"
    ? remoteSettings
    : {};
  const merged = cloneValue(local);
  for (const [id, setting] of Object.entries(remote)) {
    merged[id] = {
      ...(local[id] && typeof local[id] === "object" ? local[id] : {}),
      enabled: setting.enabled !== false,
      updatedAt: setting.updatedAt || null,
    };
  }
  return merged;
}

function mergeAutomationSettings(localAutomations, remoteSettings) {
  const local = localAutomations && typeof localAutomations === "object"
    ? localAutomations
    : {};
  const remote = remoteSettings && typeof remoteSettings === "object"
    ? remoteSettings
    : {};
  const merged = cloneValue(local);
  for (const [id, setting] of Object.entries(remote)) {
    merged[id] = {
      ...(local[id] && typeof local[id] === "object" ? local[id] : {}),
      enabled: setting.enabled === true,
    };
    if (typeof setting.time === "string") merged[id].time = setting.time;
  }
  return merged;
}

function timestamp(value) {
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function mergeRecordsById(localValue, remoteValue, tombstones = [], moduleName = "") {
  const deleted = new Map(
    tombstones
      .filter((item) => item.module === moduleName)
      .map((item) => [item.id, timestamp(item.deletedAt)]),
  );
  const byId = new Map();
  for (const item of [...(Array.isArray(localValue) ? localValue : []), ...(Array.isArray(remoteValue) ? remoteValue : [])]) {
    if (!item?.id) continue;
    const existing = byId.get(item.id);
    const itemTime = timestamp(item.updatedAt || item.lastVisitedAt || item.lastUsedAt || item.createdAt);
    if (!existing || itemTime >= existing.time) byId.set(item.id, { item: cloneValue(item), time: itemTime });
  }
  return Array.from(byId.entries())
    .filter(([id, value]) => (deleted.get(id) || 0) < value.time)
    .map(([, value]) => value.item);
}

function mergeSettings(localValue, remoteValue) {
  const local = localValue && typeof localValue === "object" ? localValue : {};
  const remote = remoteValue && typeof remoteValue === "object" ? remoteValue : {};
  const result = cloneValue(local);
  for (const [key, value] of Object.entries(remote)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      result[key] = mergeSettings(local[key], value);
    } else if (!Object.hasOwn(local, key)) {
      result[key] = cloneValue(value);
    }
  }
  return result;
}

function mergeUserScriptMetadata(localScripts, remoteMetadata) {
  const conflicts = [];
  const next = cloneValue(Array.isArray(localScripts) ? localScripts : []);
  for (const metadata of Array.isArray(remoteMetadata) ? remoteMetadata : []) {
    const local = next.find((script) => script.id === metadata.id);
    if (!local) continue;
    const { createHash } = require("node:crypto");
    const localHash = createHash("sha256").update(String(local.code || "")).digest("hex");
    if (metadata.codeHash && metadata.codeHash !== localHash) {
      conflicts.push({ id: metadata.id, name: metadata.name || local.name, localCodeHash: localHash, remoteCodeHash: metadata.codeHash });
      continue;
    }
    if (timestamp(metadata.updatedAt) >= timestamp(local.updatedAt)) {
      local.name = metadata.name || local.name;
      local.enabled = metadata.enabled !== false;
      local.matches = Array.isArray(metadata.matches) ? cloneValue(metadata.matches) : local.matches;
      local.runAt = metadata.runAt || local.runAt;
      local.updatedAt = metadata.updatedAt || local.updatedAt;
    }
  }
  return { scripts: next, conflicts };
}

function applyRemoteEnvelopeToState(localState, remoteValue, options = {}) {
  if (!localState || typeof localState !== "object" || Array.isArray(localState)) {
    throw new TypeError("Local state is required");
  }
  const envelope = normalizeRemoteEnvelope(remoteValue);
  const snapshot = envelope.snapshot;
  const merge = options.mode === "merge";
  const syncOptions = snapshot.syncOptions || {};
  const syncSites = syncOptions.sites !== false;
  const syncPlans = syncOptions.plans !== false;
  const syncSettings = syncOptions.settings !== false;
  const syncSearchHistory = syncOptions.searchHistory !== false;
  const syncBrowsingHistory = syncOptions.browsingHistory !== false;
  const syncUserScriptMetadata = syncOptions.userScriptMetadata !== false;
  const tombstones = snapshot.tombstones || [];
  const scripts = syncUserScriptMetadata
    ? mergeUserScriptMetadata(localState.userScripts, snapshot.userScriptMetadata)
    : { scripts: cloneValue(localState.userScripts || []), conflicts: [] };
  const candidate = {
    ...cloneValue(localState),
    version: CURRENT_SCHEMA_VERSION,
    workspaces: syncSites
      ? (merge ? mergeRecordsById(localState.workspaces, snapshot.workspaces, tombstones, "workspaces") : cloneValue(snapshot.workspaces))
      : cloneValue(localState.workspaces),
    activeWorkspaceId: syncSites ? snapshot.activeWorkspaceId : localState.activeWorkspaceId,
    browserProfiles: syncSites ? cloneValue(snapshot.browserProfiles) : cloneValue(localState.browserProfiles),
    sites: syncSites
      ? (merge ? mergeRecordsById(localState.sites, snapshot.sites, tombstones, "sites") : cloneValue(snapshot.sites))
      : cloneValue(localState.sites),
    bookmarks: syncSites
      ? (merge ? mergeRecordsById(localState.bookmarks, snapshot.bookmarks, tombstones, "bookmarks") : cloneValue(snapshot.bookmarks))
      : cloneValue(localState.bookmarks),
    assistantSettings: syncSettings
      ? mergeAssistantSettings(localState.assistantSettings, snapshot.assistantSettings)
      : cloneValue(localState.assistantSettings),
    automations: syncSettings
      ? mergeAutomationSettings(localState.automations, snapshot.automationSettings)
      : cloneValue(localState.automations),
    localTasks: syncPlans
      ? (merge ? mergeRecordsById(localState.localTasks, snapshot.plans, tombstones, "plans") : cloneValue(snapshot.plans))
      : cloneValue(localState.localTasks),
    uiSettings: syncSettings
      ? (merge ? mergeSettings(localState.uiSettings, snapshot.settings) : { ...cloneValue(localState.uiSettings), ...cloneValue(snapshot.settings) })
      : cloneValue(localState.uiSettings),
    searchHistory: syncSearchHistory
      ? (merge ? mergeRecordsById(localState.searchHistory, snapshot.searchHistory, tombstones, "searchHistory") : cloneValue(snapshot.searchHistory))
      : cloneValue(localState.searchHistory),
    browsingHistory: syncBrowsingHistory
      ? (merge ? mergeRecordsById(localState.browsingHistory, snapshot.browsingHistory, tombstones, "browsingHistory") : cloneValue(snapshot.browsingHistory))
      : cloneValue(localState.browsingHistory),
    userScripts: scripts.scripts,
    updatedAt: envelope.updatedAt,
  };
  delete candidate.automationSettings;
  const migration = migrateState(candidate, {
    ...options,
    now: envelope.updatedAt,
  });
  return { state: migration.state, envelope, conflicts: { userScripts: scripts.conflicts } };
}

module.exports = {
  applyRemoteEnvelopeToState,
  mergeAssistantSettings,
  mergeAutomationSettings,
  mergeRecordsById,
  mergeSettings,
  mergeUserScriptMetadata,
};
