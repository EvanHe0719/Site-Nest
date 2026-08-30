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

test("remote sync replaces only the cloud whitelist and preserves local-only runtime data", () => {
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
  assert.equal(result.localTasks[0].id, "local-task");
  assert.equal(result.taskReminders[0].id, "task-reminder:local-task:10");
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
