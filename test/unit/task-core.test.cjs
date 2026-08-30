const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const test = require("node:test");

const { createInitialState, normalizeStateV7 } = require("../../electron/state-model.cjs");
const {
  TaskReminderScheduler,
  AppBackgroundService,
  DesktopNotificationService,
  TrayService,
  addTaskToState,
  buildTaskReminders,
  isWithinDoNotDisturb,
  nextDoNotDisturbEnd,
  normalizeTaskSettings,
  updateReminderInState,
  updateTaskInState,
} = require("../../electron/tasks/index.cjs");

const NOW = "2026-08-30T01:00:00.000Z";
const DUE = "2026-08-30T04:00:00.000Z";

function initialState() {
  return createInitialState({ now: NOW, defaultSites: [] });
}

test("local tasks store UTC timestamps, device timezone and stable reminder ids", () => {
  const result = addTaskToState(initialState(), {
    title: "回复 Zoho 工单",
    workspaceId: "work",
    dueAt: "2026-08-30T12:00:00+08:00",
    reminderOffsets: [0, 5, 10, 10, 30],
  }, { now: NOW });

  assert.equal(result.task.dueAt, DUE);
  assert.ok(result.task.timeZone);
  assert.deepEqual(result.task.reminderOffsets, [30, 10, 5, 0]);
  assert.deepEqual(
    result.state.taskReminders.map((item) => item.id),
    [30, 10, 5, 0].map((offset) => `task-reminder:${result.task.id}:${offset}`),
  );
});

test("an unchanged reminder keeps its fired state across normalization and restart", () => {
  const task = {
    id: "task-a",
    title: "已有任务",
    workspaceId: "personal",
    status: "todo",
    dueAt: DUE,
    reminderOffsets: [10],
  };
  const reminder = buildTaskReminders(task)[0];
  reminder.state = "fired";
  reminder.firedAt = NOW;
  const restored = normalizeStateV7({
    ...initialState(),
    localTasks: [task],
    taskReminders: [reminder],
  }, { now: NOW, defaultSites: [] });

  assert.equal(restored.taskReminders.length, 1);
  assert.equal(restored.taskReminders[0].state, "fired");
  assert.equal(restored.taskReminders[0].firedAt, NOW);
});

test("changing due time resets reminder while completing a task removes pending reminders", () => {
  const added = addTaskToState(initialState(), {
    title: "改期任务",
    dueAt: DUE,
    reminderOffsets: [15],
  }, { now: NOW });
  const reminderId = added.state.taskReminders[0].id;
  const fired = updateReminderInState(added.state, reminderId, {
    state: "fired",
    firedAt: NOW,
  }).state;
  const moved = updateTaskInState(fired, {
    id: added.task.id,
    dueAt: "2026-08-30T06:00:00.000Z",
  }, { now: "2026-08-30T01:10:00.000Z" });
  assert.equal(moved.state.taskReminders[0].state, "pending");
  assert.equal(moved.state.taskReminders[0].firedAt, null);

  const completed = updateTaskInState(moved.state, {
    id: added.task.id,
    status: "done",
  }, { now: "2026-08-30T01:20:00.000Z" });
  assert.equal(completed.task.completedAt, "2026-08-30T01:20:00.000Z");
  assert.equal(completed.state.taskReminders.length, 0);
});

test("task settings keep behavioral changes opt-in", () => {
  assert.deepEqual(normalizeTaskSettings(), {
    remindersEnabled: false,
    trayOnClose: false,
    autoLaunch: false,
    startMinimized: false,
    notificationSound: true,
    pausedUntil: null,
    doNotDisturb: { enabled: false, start: "22:00", end: "08:00" },
  });
});

test("do-not-disturb handles overnight ranges and calculates the next local end", () => {
  const settings = normalizeTaskSettings({
    doNotDisturb: { enabled: true, start: "22:00", end: "08:00" },
  });
  const late = new Date(2026, 7, 30, 23, 30, 0);
  const morning = new Date(2026, 7, 31, 7, 30, 0);
  const noon = new Date(2026, 7, 31, 12, 0, 0);
  assert.equal(isWithinDoNotDisturb(settings, late), true);
  assert.equal(isWithinDoNotDisturb(settings, morning), true);
  assert.equal(isWithinDoNotDisturb(settings, noon), false);
  const end = new Date(nextDoNotDisturbEnd(settings, late));
  assert.equal(end.getDate(), 31);
  assert.equal(end.getHours(), 8);
  assert.equal(end.getMinutes(), 0);
});

test("scheduler owns one timer, selects the nearest reminder and reschedules after firing", async () => {
  const reminders = [
    { id: "later", remindAt: "2026-08-30T01:20:00.000Z", state: "pending" },
    { id: "soon", remindAt: "2026-08-30T01:05:00.000Z", state: "pending" },
  ];
  const timers = [];
  const cleared = [];
  const fired = [];
  const scheduler = new TaskReminderScheduler({
    listPending: async () => reminders.filter((item) => item.state === "pending"),
    fireReminder: async (id) => {
      fired.push(id);
      const reminder = reminders.find((item) => item.id === id);
      reminder.state = "fired";
    },
    now: () => Date.parse(NOW),
    setTimer: (callback, delay) => {
      const timer = { callback, delay, unref() {} };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => cleared.push(timer),
  });

  const first = await scheduler.start();
  assert.equal(first.id, "soon");
  assert.equal(timers.at(-1).delay, 5 * 60_000);
  await scheduler.trigger("soon");
  assert.deepEqual(fired, ["soon"]);
  assert.equal(timers.at(-1).delay, 20 * 60_000);

  await scheduler.reschedule();
  assert.ok(cleared.length >= 1);
  assert.equal(timers.at(-1).delay, 20 * 60_000);
  scheduler.stop();
  assert.equal(scheduler.timer, null);
});

test("overdue reminders are scheduled immediately after startup or resume", async () => {
  let delay = null;
  const scheduler = new TaskReminderScheduler({
    listPending: async () => [{ id: "missed", remindAt: "2026-08-29T23:00:00.000Z" }],
    fireReminder: async () => undefined,
    now: () => Date.parse(NOW),
    setTimer: (_callback, value) => ({ delay: (delay = value), unref() {} }),
    clearTimer: () => undefined,
  });
  await scheduler.start();
  assert.equal(delay, 0);
  scheduler.stop();
});

test("background and tray behavior remains explicit and tray menu exposes required actions", () => {
  const loginCalls = [];
  const development = new AppBackgroundService({
    app: { isPackaged: false, setLoginItemSettings: (value) => loginCalls.push(value) },
  });
  development.applyLoginSettings({ autoLaunch: true, startMinimized: true });
  assert.equal(loginCalls.length, 0);
  assert.equal(development.shouldHideOnClose({ trayOnClose: false }, false), false);
  assert.equal(development.shouldHideOnClose({ trayOnClose: true }, false), true);
  assert.equal(development.shouldHideOnClose({ trayOnClose: true }, true), false);

  const calls = [];
  class FakeTray extends EventEmitter {
    setToolTip(value) { calls.push(["tooltip", value]); }
    setContextMenu(value) { this.menu = value; }
    destroy() { calls.push(["destroy"]); }
  }
  const tray = new TrayService({
    Tray: FakeTray,
    Menu: { buildFromTemplate: (template) => template },
    icon: "icon.png",
    onOpen: () => calls.push(["open"]),
    onToday: () => calls.push(["today"]),
    onAdd: () => calls.push(["add"]),
    onPause: (value) => calls.push(["pause", value]),
    onQuit: () => calls.push(["quit"]),
  });
  const instance = tray.ensure();
  assert.deepEqual(instance.menu.filter((item) => item.label).map((item) => item.label), [
    "打开栖页", "今天的任务", "添加任务", "暂停提醒 1 小时", "退出",
  ]);
  instance.menu.find((item) => item.label === "今天的任务").click();
  instance.menu.find((item) => item.label === "暂停提醒 1 小时").click();
  assert.deepEqual(calls.slice(-2), [["today"], ["pause", true]]);
  tray.destroy();
  assert.equal(tray.tray, null);
});

test("desktop notification maps click, complete and 5/10/30 minute snooze actions", () => {
  class FakeNotification extends EventEmitter {
    static isSupported() { return true; }
    constructor(options) { super(); this.options = options; }
    show() { this.shown = true; }
    close() { this.emit("close"); }
  }
  const calls = [];
  const service = new DesktopNotificationService({
    Notification: FakeNotification,
    icon: "icon.png",
    onOpenTask: (id) => calls.push(["open", id]),
    onComplete: (id) => calls.push(["complete", id]),
    onSnooze: (id, minutes) => calls.push(["snooze", id, minutes]),
  });
  const task = { id: "task-a", title: "提醒测试", priority: "high", dueAt: DUE };
  const reminder = { id: "r-a", notificationKey: "n-a" };
  assert.deepEqual(service.show(task, reminder), { supported: true });
  const notification = service.active.get("n-a");
  assert.equal(notification.options.actions.length, 4);
  notification.emit("click");
  notification.emit("action", {}, 0);
  notification.emit("action", {}, 1);
  notification.emit("action", {}, 2);
  notification.emit("action", {}, 3);
  assert.deepEqual(calls, [
    ["open", "task-a"],
    ["complete", "task-a"],
    ["snooze", "r-a", 5],
    ["snooze", "r-a", 10],
    ["snooze", "r-a", 30],
  ]);
  service.closeAll();
  assert.equal(service.active.size, 0);
});
