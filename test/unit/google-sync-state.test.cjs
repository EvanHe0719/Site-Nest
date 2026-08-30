const assert = require("node:assert/strict");
const test = require("node:test");

const {
  applyRemoteEnvelopeToState,
} = require("../../electron/google-sync-state.cjs");
const {
  createInitialState,
} = require("../../electron/state-model.cjs");
const {
  createSyncEnvelope,
} = require("../../electron/google-drive-sync-data.cjs");

function baseState(now) {
  return createInitialState({ now, defaultSites: [] });
}

test("remote sync replaces cloud modules while preserving sessions, logs and local task preferences", () => {
  const local = baseState("2026-08-29T10:00:00.000Z");
  local.workspaceBrowserStates.personal = {
    activeTabId: "tab-local",
    tabs: [{
      tabId: "tab-local",
      siteId: null,
      url: "https://session-only.example/",
      title: "Local session",
      active: true,
      detached: false,
      updatedAt: "2026-08-29T10:00:00.000Z",
    }],
  };
  local.assistantExecutionLogs = [{
    id: "log-local",
    timestamp: "2026-08-29T10:00:00.000Z",
    assistantId: "generic-page-actions",
    assistantName: "通用页面动作",
    actionId: "copy",
    actionName: "复制",
    site: { siteId: "", hostname: "local.example" },
    status: "success",
    summary: "local only",
    errorCode: "",
    errorMessage: "",
  }];
  local.automations.naixi.lastSuccessDate = "2026-08-29";
  local.assistantSettings["generic-page-actions"].lastExecutedAt =
    "2026-08-29T09:00:00.000Z";
  local.localTasks = [{
    id: "local-task",
    title: "本机计划",
    notes: "",
    workspaceId: "work",
    status: "todo",
    priority: "high",
    startAt: null,
    dueAt: "2026-08-30T04:00:00.000Z",
    allDay: false,
    reminderOffsets: [10],
    tags: [],
    orderKey: "1:local-task",
    timeZone: local.timeZone,
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    completedAt: null,
  }];
  local.taskReminders = [{
    id: "task-reminder:local-task:10",
    taskId: "local-task",
    remindAt: "2026-08-30T03:50:00.000Z",
    state: "pending",
    firedAt: null,
    snoozedUntil: null,
    notificationKey: "task-reminder:local-task:10",
  }];
  local.taskSettings.remindersEnabled = true;

  const remoteState = baseState("2026-08-29T11:00:00.000Z");
  remoteState.bookmarks = [{
    id: "remote-bookmark",
    name: "Remote",
    url: "https://remote.example/",
    folder: "云端",
    addedAt: null,
    sourceProfile: "Chrome",
  }];
  remoteState.assistantSettings["generic-page-actions"].enabled = false;
  remoteState.automations.naixi.enabled = false;
  remoteState.automations.naixi.time = "07:15";
  const envelope = createSyncEnvelope(remoteState);

  const result = applyRemoteEnvelopeToState(local, envelope).state;

  assert.equal(result.bookmarks.length, 1);
  assert.equal(result.bookmarks[0].id, "remote-bookmark");
  assert.equal(result.workspaceBrowserStates.personal.tabs[0].tabId, "tab-local");
  assert.equal(result.assistantExecutionLogs[0].id, "log-local");
  assert.equal(
    result.assistantSettings["generic-page-actions"].lastExecutedAt,
    "2026-08-29T09:00:00.000Z",
  );
  assert.equal(result.assistantSettings["generic-page-actions"].enabled, false);
  assert.equal(result.automations.naixi.enabled, false);
  assert.equal(result.automations.naixi.time, "07:15");
  assert.equal(result.automations.naixi.lastSuccessDate, "2026-08-29");
  assert.equal(result.localTasks.length, 0);
  assert.equal(result.taskReminders.length, 0);
  assert.equal(result.taskSettings.remindersEnabled, true);
});

test("invalid remote envelopes never mutate local state", () => {
  const local = baseState("2026-08-29T10:00:00.000Z");
  const before = JSON.stringify(local);
  assert.throws(
    () => applyRemoteEnvelopeToState(local, { kind: "not-qiye" }),
    /栖页同步数据/,
  );
  assert.equal(JSON.stringify(local), before);
});

test("disabled sync modules never turn an empty cloud module into a local deletion", () => {
  const local = baseState("2026-08-29T10:00:00.000Z");
  local.activeWorkspaceId = "work";
  local.bookmarks = [{
    id: "bookmark-local",
    name: "Local bookmark",
    url: "https://local.example/",
    folder: "本地",
    addedAt: null,
    sourceProfile: "Chrome",
  }];
  local.localTasks = [{
    id: "task-local",
    title: "本地任务",
    notes: "",
    workspaceId: "work",
    status: "todo",
    priority: "medium",
    startAt: null,
    dueAt: null,
    allDay: false,
    reminderOffsets: [],
    tags: [],
    orderKey: "1:task-local",
    timeZone: local.timeZone,
    createdAt: "2026-08-29T10:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    completedAt: null,
  }];
  local.searchHistory = [{
    id: "search-local",
    type: "webSearch",
    text: "local only",
    engineId: "google",
    createdAt: "2026-08-29T10:00:00.000Z",
    lastUsedAt: "2026-08-29T10:00:00.000Z",
    useCount: 1,
  }];

  const remote = baseState("2026-08-29T11:00:00.000Z");
  remote.uiSettings.googleSync = {
    sites: false,
    plans: false,
    settings: false,
    searchHistory: false,
    browsingHistory: false,
    userScriptMetadata: false,
    notifications: false,
  };
  const envelope = createSyncEnvelope(remote);
  const result = applyRemoteEnvelopeToState(local, envelope).state;

  assert.equal(result.activeWorkspaceId, "work");
  assert.equal(result.bookmarks[0].id, "bookmark-local");
  assert.equal(result.localTasks[0].id, "task-local");
  assert.equal(result.searchHistory[0].id, "search-local");
});

test("smart merge uses stable ids, applies tombstones, and never overwrites conflicting script code", () => {
  const local = baseState("2026-08-29T10:00:00.000Z");
  local.localTasks = [{
    id: "task-local",
    title: "本地任务",
    notes: "",
    workspaceId: "work",
    status: "todo",
    priority: "medium",
    startAt: null,
    dueAt: null,
    allDay: false,
    reminderOffsets: [],
    tags: [],
    orderKey: "1:task-local",
    timeZone: local.timeZone,
    createdAt: "2026-08-29T09:00:00.000Z",
    updatedAt: "2026-08-29T10:00:00.000Z",
    completedAt: null,
  }];
  local.searchHistory = [{
    id: "search-deleted",
    type: "webSearch",
    text: "should disappear",
    engineId: "google",
    createdAt: "2026-08-29T08:00:00.000Z",
    lastUsedAt: "2026-08-29T08:00:00.000Z",
    useCount: 1,
  }];
  const localScript = local.userScripts[0];
  const localCode = localScript.code;

  const remote = baseState("2026-08-29T11:00:00.000Z");
  remote.localTasks = [{ ...local.localTasks[0], id: "task-remote", title: "云端任务", updatedAt: "2026-08-29T11:00:00.000Z" }];
  remote.userScripts[0] = { ...remote.userScripts[0], id: localScript.id, code: "// different remote code", updatedAt: "2026-08-29T11:00:00.000Z" };
  const envelope = createSyncEnvelope(remote, {
    tombstones: [{ id: "search-deleted", module: "searchHistory", deletedAt: "2026-08-29T12:00:00.000Z" }],
  });
  const result = applyRemoteEnvelopeToState(local, envelope, { mode: "merge" });

  assert.deepEqual(result.state.localTasks.map((task) => task.id).sort(), ["task-local", "task-remote"]);
  assert.equal(result.state.searchHistory.some((item) => item.id === "search-deleted"), false);
  assert.equal(result.state.userScripts.find((script) => script.id === localScript.id).code, localCode);
  assert.equal(result.conflicts.userScripts.length, 1);
  assert.equal(result.conflicts.userScripts[0].id, localScript.id);
});
