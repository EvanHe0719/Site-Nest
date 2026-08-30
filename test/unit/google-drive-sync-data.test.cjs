const assert = require("node:assert/strict");
const test = require("node:test");

const {
  GoogleDriveSyncDataError,
  SYNC_ENVELOPE_KIND,
  SYNC_ENVELOPE_VERSION,
  compareUpdatedAt,
  createSafeSnapshot,
  createSyncEnvelope,
  decideSyncAction,
  normalizeRemoteEnvelope,
  snapshotFingerprint,
  validateRemoteEnvelope,
} = require("../../electron/google-drive-sync-data.cjs");
const { createInitialState } = require("../../electron/state-model.cjs");

const NOW = "2026-08-29T08:00:00.000Z";

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sampleState() {
  const state = createInitialState({ now: NOW });
  state.updatedAt = "2026-08-29T08:05:00.000Z";
  state.workspaceBrowserStates.personal = {
    activeTabId: "secret-tab",
    tabs: [
      {
        tabId: "secret-tab",
        siteId: "safe-site",
        url: "https://session.example.test/private?access_token=session-secret",
      },
    ],
    currentURL: "https://session.example.test/private?token=current-secret",
  };
  state.sites.push({
    id: "safe-site",
    name: "Safe Bearer site-secret",
    shortName: "SS",
    url: "https://safe.example.test/path?page=1&access_token=url-secret#access_token=fragment-secret",
    color: "#12ABEF",
    source: "custom",
    description: "Authorization: Bearer description-secret",
    icon: "https://icons.example.test/icon?token=icon-secret",
    workspaceId: "personal",
    siteKind: "normal",
    openMode: "internal",
    browserProfileId: "default",
    assistantIds: ["generic-page-actions"],
    pinned: true,
    order: 0,
    lastOpenedAt: "2026-08-29T08:04:00.000Z",
    createdAt: NOW,
    updatedAt: NOW,
    accessToken: "nested-site-token",
    oauth: { refresh_token: "nested-site-refresh" },
    cookie: "nested-site-cookie",
  });
  state.bookmarks.push({
    id: "safe-bookmark",
    name: "Bookmark token=bookmark-name-secret",
    url: "https://bookmark-user:bookmark-pass@bookmark.example.test/read?q=ok&oauth_token=bookmark-url-secret",
    folder: "Work",
    addedAt: NOW,
    sourceProfile: "Chrome",
    refreshToken: "bookmark-refresh-secret",
  });
  state.browserProfiles[0].partition = "persist:local-cookie-jar";
  state.browserProfiles[0].access_token = "profile-token-secret";
  state.assistantSettings["generic-page-actions"] = {
    enabled: false,
    updatedAt: NOW,
    lastExecutedAt: NOW,
    clientSecret: "assistant-client-secret",
    oauth: { accessToken: "assistant-oauth-secret" },
  };
  state.automations.naixi = {
    enabled: true,
    time: "09:15",
    status: "success",
    message: "cookie=automation-cookie-secret",
    lastRunAt: NOW,
    lastSuccessAt: NOW,
    lastSuccessDate: "2026-08-29",
    refresh_token: "automation-refresh-secret",
  };
  state.cookies = [{ name: "session", value: "root-cookie-secret" }];
  state.tokens = { accessToken: "root-token-secret" };
  state.oauth = { refreshToken: "root-oauth-secret" };
  state.logs = [{ authorization: "Bearer root-log-secret" }];
  state.assistantExecutionLogs = [
    { id: "log-1", summary: "token=assistant-log-secret" },
  ];
  state.localTasks = [{ id: "local-task", title: "仅本机客户任务", notes: "不得上传" }];
  state.taskReminders = [{ id: "local-reminder", taskId: "local-task" }];
  state.taskSettings = { remindersEnabled: true, trayOnClose: true };
  state.timelineEvents = [{ id: "local-timeline", title: "仅本机时间轴", sourceUrl: "https://example.test/?token=secret" }];
  state.timelineUiSettings = { selectedYear: 2026, viewMode: "timeline" };
  state.tabGroups = [{ id: "local-tab-group", workspaceId: "personal", name: "仅本机分组" }];
  return state;
}

test("safe snapshot is an allowlist and excludes sessions, OAuth material, cookies and execution logs", () => {
  const snapshot = createSafeSnapshot(sampleState());

  assert.deepEqual(Object.keys(snapshot).sort(), [
    "activeWorkspaceId",
    "assistantSettings",
    "automationSettings",
    "bookmarks",
    "browserProfiles",
    "browsingHistory",
    "plans",
    "searchHistory",
    "settings",
    "sites",
    "syncOptions",
    "tombstones",
    "userScriptMetadata",
    "version",
    "workspaces",
  ]);
  assert.equal(Object.hasOwn(snapshot, "workspaceBrowserStates"), false);
  assert.equal(Object.hasOwn(snapshot, "assistantExecutionLogs"), false);
  assert.equal(Object.hasOwn(snapshot, "cookies"), false);
  assert.equal(Object.hasOwn(snapshot, "tokens"), false);
  assert.equal(Object.hasOwn(snapshot, "oauth"), false);
  assert.equal(Object.hasOwn(snapshot, "logs"), false);
  assert.equal(Object.hasOwn(snapshot, "localTasks"), false);
  assert.equal(Object.hasOwn(snapshot, "taskReminders"), false);
  assert.equal(Object.hasOwn(snapshot, "taskSettings"), false);
  assert.equal(Object.hasOwn(snapshot, "timelineTracks"), false);
  assert.equal(Object.hasOwn(snapshot, "timelineEvents"), false);
  assert.equal(Object.hasOwn(snapshot, "timelineUiSettings"), false);
  assert.equal(Object.hasOwn(snapshot, "tabGroups"), false);

  const site = snapshot.sites[0];
  assert.equal(site.url, "https://safe.example.test/path?page=1");
  assert.equal(site.color, "#12abef");
  assert.equal(Object.hasOwn(site, "icon"), false);
  assert.equal(Object.hasOwn(site, "lastOpenedAt"), false);
  assert.equal(Object.hasOwn(site, "accessToken"), false);
  assert.equal(Object.hasOwn(site, "oauth"), false);
  assert.equal(Object.hasOwn(site, "cookie"), false);
  assert.match(site.description, /\[REDACTED\]/);

  const bookmark = snapshot.bookmarks[0];
  assert.equal(bookmark.url, "https://bookmark.example.test/read?q=ok");
  assert.equal(Object.hasOwn(bookmark, "refreshToken"), false);
  assert.match(bookmark.name, /token=\[REDACTED\]/i);

  const profile = snapshot.browserProfiles[0];
  assert.equal(Object.hasOwn(profile, "partition"), false);
  assert.equal(Object.hasOwn(profile, "access_token"), false);
  const assistant = snapshot.assistantSettings["generic-page-actions"];
  assert.deepEqual(assistant, { enabled: false, updatedAt: NOW });
  assert.deepEqual(snapshot.automationSettings.naixi, {
    enabled: true,
    time: "09:15",
  });

  const serialized = JSON.stringify(snapshot);
  for (const secret of [
    "session-secret",
    "current-secret",
    "url-secret",
    "fragment-secret",
    "description-secret",
    "icon-secret",
    "nested-site-token",
    "nested-site-refresh",
    "nested-site-cookie",
    "bookmark-name-secret",
    "bookmark-url-secret",
    "bookmark-refresh-secret",
    "profile-token-secret",
    "assistant-client-secret",
    "assistant-oauth-secret",
    "automation-cookie-secret",
    "automation-refresh-secret",
    "root-cookie-secret",
    "root-token-secret",
    "root-oauth-secret",
    "root-log-secret",
    "assistant-log-secret",
    "bookmark-user",
    "bookmark-pass",
  ]) {
    assert.equal(serialized.includes(secret), false, `snapshot leaked ${secret}`);
  }
});

test("remote envelope normalization accepts JSON, removes unknown sensitive fields and returns a fresh safe object", () => {
  const envelope = createSyncEnvelope(sampleState());
  const remote = clone(envelope);
  remote.oauth = { access_token: "top-level-remote-secret" };
  remote.cookies = ["remote-cookie-secret"];
  remote.snapshot.workspaceBrowserStates = {
    personal: {
      tabs: [{ url: "https://private.example.test/?token=remote-tab-secret" }],
    },
  };
  remote.snapshot.assistantExecutionLogs = [
    { summary: "Bearer remote-assistant-log-secret" },
  ];
  remote.snapshot.sites[0].client_secret = "remote-site-secret";
  remote.snapshot.browserProfiles[0].refresh_token = "remote-profile-secret";
  remote.snapshot.automationSettings.naixi.access_token = "remote-automation-secret";

  const normalized = normalizeRemoteEnvelope(JSON.stringify(remote));
  assert.equal(normalized.kind, SYNC_ENVELOPE_KIND);
  assert.equal(normalized.envelopeVersion, SYNC_ENVELOPE_VERSION);
  assert.equal(normalized.updatedAt, "2026-08-29T08:05:00.000Z");
  assert.equal(Object.hasOwn(normalized, "oauth"), false);
  assert.equal(Object.hasOwn(normalized, "cookies"), false);
  assert.equal(Object.hasOwn(normalized.snapshot, "workspaceBrowserStates"), false);
  assert.equal(Object.hasOwn(normalized.snapshot, "assistantExecutionLogs"), false);

  const serialized = JSON.stringify(normalized);
  for (const secret of [
    "top-level-remote-secret",
    "remote-cookie-secret",
    "remote-tab-secret",
    "remote-assistant-log-secret",
    "remote-site-secret",
    "remote-profile-secret",
    "remote-automation-secret",
  ]) {
    assert.equal(serialized.includes(secret), false, `normalized envelope leaked ${secret}`);
  }
  assert.equal(validateRemoteEnvelope(remote).ok, true);
});

test("search and browsing history are stable-id modules and sensitive OAuth URLs never enter cloud data", () => {
  const state = sampleState();
  state.searchHistory = [
    { id: "search-safe", type: "webSearch", text: "SAP B1", engineId: "google", lastUsedAt: NOW, createdAt: NOW, useCount: 1 },
    { id: "search-secret", type: "directUrl", text: "https://example.test/callback?code=oauth-private", engineId: "google", lastUsedAt: NOW, createdAt: NOW, useCount: 1 },
  ];
  state.browsingHistory = [
    { id: "visit-safe", type: "page", url: "https://example.test/docs?page=1", title: "Docs", workspaceId: "work", lastVisitedAt: NOW, updatedAt: NOW, useCount: 2 },
    { id: "visit-secret", type: "page", url: "https://example.test/callback?access_token=drive-private", title: "Callback", workspaceId: "work", lastVisitedAt: NOW, updatedAt: NOW, useCount: 1 },
  ];
  const envelope = createSyncEnvelope(state, { deviceId: "device-1", deviceName: "Test PC", appVersion: "0.5.5" });
  assert.deepEqual(envelope.snapshot.searchHistory.map((item) => item.id), ["search-safe"]);
  assert.deepEqual(envelope.snapshot.browsingHistory.map((item) => item.id), ["visit-safe"]);
  assert.equal(envelope.manifest.deviceId, "device-1");
  assert.equal(envelope.manifest.checksums.snapshot, envelope.manifest.revision);
  assert.doesNotMatch(JSON.stringify(envelope), /oauth-private|drive-private/);
});

test("damaged and malicious remote envelopes are rejected without producing a download candidate", () => {
  const valid = createSyncEnvelope(sampleState());
  const cases = [
    "{not-json",
    undefined,
    null,
    [],
    { ...valid, kind: "attacker-file" },
    { ...valid, envelopeVersion: 999 },
    { ...valid, updatedAt: "not-a-date" },
    {
      ...valid,
      snapshot: { ...valid.snapshot, version: 999 },
    },
    {
      ...valid,
      snapshot: {
        ...valid.snapshot,
        workspaces: [valid.snapshot.workspaces[0], valid.snapshot.workspaces[0]],
      },
    },
    {
      ...valid,
      snapshot: {
        ...valid.snapshot,
        activeWorkspaceId: "missing-workspace",
      },
    },
    {
      ...valid,
      snapshot: {
        ...valid.snapshot,
        sites: [{ ...valid.snapshot.sites[0], url: "file:///etc/passwd" }],
      },
    },
    {
      ...valid,
      snapshot: {
        ...valid.snapshot,
        assistantSettings: JSON.parse('{"__proto__":{"enabled":true}}'),
      },
    },
  ];

  for (const candidate of cases) {
    const result = validateRemoteEnvelope(candidate);
    assert.equal(result.ok, false);
    assert.equal(result.envelope, null);
    assert.ok(result.error.code);
    assert.throws(
      () => normalizeRemoteEnvelope(candidate),
      (error) => error instanceof GoogleDriveSyncDataError,
    );
  }
});

test("newer snapshot wins while first upload, first download, same and noop are explicit", () => {
  const local = createSyncEnvelope(sampleState(), {
    updatedAt: "2026-08-29T10:00:00.000Z",
  });
  const remoteState = sampleState();
  remoteState.sites[0].name = "Older remote name";
  const remoteOlder = createSyncEnvelope(remoteState, {
    updatedAt: "2026-08-29T09:00:00.000Z",
  });
  const remoteNewer = createSyncEnvelope(remoteState, {
    updatedAt: "2026-08-29T11:00:00.000Z",
  });
  const equalTimestampConflict = createSyncEnvelope(remoteState, {
    updatedAt: local.updatedAt,
  });
  const sameSnapshotNewerTimestamp = createSyncEnvelope(sampleState(), {
    updatedAt: "2026-08-29T12:00:00.000Z",
  });

  assert.deepEqual(decideSyncAction({}), {
    action: "noop",
    direction: "noop",
    reason: "no-snapshots",
  });
  assert.deepEqual(decideSyncAction({ localEnvelope: local }), {
    action: "first-upload",
    direction: "upload",
    reason: "remote-missing",
  });
  assert.deepEqual(decideSyncAction({ remoteEnvelope: remoteOlder }), {
    action: "first-download",
    direction: "download",
    reason: "local-missing",
  });
  assert.deepEqual(
    decideSyncAction({
      localEnvelope: local,
      remoteEnvelope: sameSnapshotNewerTimestamp,
    }),
    { action: "same", direction: "noop", reason: "same-snapshot" },
  );
  assert.deepEqual(
    decideSyncAction({ localEnvelope: local, remoteEnvelope: remoteOlder }),
    { action: "upload", direction: "upload", reason: "local-newer" },
  );
  assert.deepEqual(
    decideSyncAction({ localEnvelope: local, remoteEnvelope: remoteNewer }),
    { action: "download", direction: "download", reason: "remote-newer" },
  );
  assert.deepEqual(
    decideSyncAction({
      localEnvelope: local,
      remoteEnvelope: equalTimestampConflict,
    }),
    {
      action: "noop",
      direction: "noop",
      reason: "equal-timestamp-conflict",
    },
  );
  assert.equal(compareUpdatedAt(local, remoteOlder), 1);
  assert.equal(compareUpdatedAt(remoteOlder, local), -1);
  assert.equal(compareUpdatedAt(local, equalTimestampConflict), 0);
  assert.equal(snapshotFingerprint(local.snapshot).length, 64);
  assert.throws(
    () =>
      decideSyncAction({
        localEnvelope: local,
        remoteEnvelope: { ...remoteNewer, kind: "malicious" },
      }),
    (error) => error instanceof GoogleDriveSyncDataError,
  );
});
