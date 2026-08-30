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

function applyRemoteEnvelopeToState(localState, remoteValue, options = {}) {
  if (!localState || typeof localState !== "object" || Array.isArray(localState)) {
    throw new TypeError("Local state is required");
  }
  const envelope = normalizeRemoteEnvelope(remoteValue);
  const snapshot = envelope.snapshot;
  const candidate = {
    ...cloneValue(localState),
    version: CURRENT_SCHEMA_VERSION,
    workspaces: cloneValue(snapshot.workspaces),
    activeWorkspaceId: snapshot.activeWorkspaceId,
    browserProfiles: cloneValue(snapshot.browserProfiles),
    sites: cloneValue(snapshot.sites),
    bookmarks: cloneValue(snapshot.bookmarks),
    assistantSettings: mergeAssistantSettings(
      localState.assistantSettings,
      snapshot.assistantSettings,
    ),
    automations: mergeAutomationSettings(
      localState.automations,
      snapshot.automationSettings,
    ),
    updatedAt: envelope.updatedAt,
  };
  delete candidate.automationSettings;
  const migration = migrateState(candidate, {
    ...options,
    now: envelope.updatedAt,
  });
  return { state: migration.state, envelope };
}

module.exports = {
  applyRemoteEnvelopeToState,
  mergeAssistantSettings,
  mergeAutomationSettings,
};
