const { randomUUID } = require("node:crypto");

const TASK_STATUSES = new Set(["todo", "doing", "done", "cancelled"]);
const TASK_PRIORITIES = new Set(["low", "normal", "high", "urgent"]);
const REMINDER_STATES = new Set(["pending", "fired", "snoozed", "dismissed"]);

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function deviceTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function normalizeReminderOffsets(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item >= 0 && item <= 525_600)
    .map((item) => Math.round(item))))
    .sort((left, right) => right - left)
    .slice(0, 20);
}

function normalizeLocalTask(value, options = {}) {
  const input = /** @type {any} */ (value && typeof value === "object" ? value : {});
  const now = isoOrNull(options.now) || new Date().toISOString();
  const id = String(input.id || randomUUID()).trim().slice(0, 120);
  const title = String(input.title || "").trim().slice(0, 300);
  if (!title) throw new Error("任务标题不能为空");
  const status = TASK_STATUSES.has(input.status) ? input.status : "todo";
  const completedAt = status === "done"
    ? (isoOrNull(input.completedAt) || now)
    : null;
  return {
    id,
    title,
    notes: String(input.notes || "").slice(0, 5000),
    workspaceId: String(input.workspaceId || options.defaultWorkspaceId || "personal").slice(0, 120),
    status,
    priority: TASK_PRIORITIES.has(input.priority) ? input.priority : "normal",
    startAt: isoOrNull(input.startAt),
    dueAt: isoOrNull(input.dueAt),
    allDay: input.allDay === true,
    reminderOffsets: normalizeReminderOffsets(input.reminderOffsets),
    tags: Array.from(new Set((Array.isArray(input.tags) ? input.tags : [])
      .map((item) => String(item || "").trim().slice(0, 60))
      .filter(Boolean))).slice(0, 30),
    orderKey: String(input.orderKey || `${Date.parse(now)}:${id}`).slice(0, 200),
    timeZone: String(input.timeZone || options.timeZone || deviceTimeZone()).slice(0, 100),
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    completedAt,
  };
}

function normalizeLocalTasks(value, options = {}) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const workspaceIds = new Set(options.workspaceIds || ["personal", "work", "research"]);
  return value.map((task) => {
    try {
      const normalized = normalizeLocalTask(task, options);
      if (seen.has(normalized.id) || !workspaceIds.has(normalized.workspaceId)) return null;
      seen.add(normalized.id);
      return normalized;
    } catch {
      return null;
    }
  }).filter(Boolean).slice(0, 20_000);
}

function normalizeTaskReminder(value) {
  const input = /** @type {any} */ (value && typeof value === "object" ? value : {});
  const id = String(input.id || "").trim().slice(0, 180);
  const taskId = String(input.taskId || "").trim().slice(0, 120);
  const remindAt = isoOrNull(input.remindAt);
  if (!id || !taskId || !remindAt) return null;
  return {
    id,
    taskId,
    remindAt,
    state: REMINDER_STATES.has(input.state) ? input.state : "pending",
    firedAt: isoOrNull(input.firedAt),
    snoozedUntil: isoOrNull(input.snoozedUntil),
    notificationKey: String(input.notificationKey || id).slice(0, 200),
  };
}

function normalizeTaskReminders(value, taskIds = null) {
  if (!Array.isArray(value)) return [];
  const allowed = taskIds ? new Set(taskIds) : null;
  const seen = new Set();
  return value.map(normalizeTaskReminder).filter((reminder) => {
    if (!reminder || seen.has(reminder.id) || (allowed && !allowed.has(reminder.taskId))) return false;
    seen.add(reminder.id);
    return true;
  }).slice(0, 100_000);
}

function normalizeTaskSettings(value = {}) {
  const input = /** @type {any} */ (value && typeof value === "object" ? value : {});
  const dnd = input.doNotDisturb && typeof input.doNotDisturb === "object" ? input.doNotDisturb : {};
  const validTime = (candidate, fallback) => /^\d{2}:\d{2}$/.test(String(candidate || "")) ? String(candidate) : fallback;
  return {
    remindersEnabled: input.remindersEnabled === true,
    trayOnClose: input.trayOnClose === true,
    autoLaunch: input.autoLaunch === true,
    startMinimized: input.startMinimized === true,
    notificationSound: input.notificationSound !== false,
    pausedUntil: isoOrNull(input.pausedUntil),
    doNotDisturb: {
      enabled: dnd.enabled === true,
      start: validTime(dnd.start, "22:00"),
      end: validTime(dnd.end, "08:00"),
    },
  };
}

function buildTaskReminders(task, existing = []) {
  if (!task?.dueAt || !Array.isArray(task.reminderOffsets) || ["done", "cancelled"].includes(task.status)) return [];
  const due = Date.parse(task.dueAt);
  if (!Number.isFinite(due)) return [];
  const byId = new Map(existing.map((item) => [item.id, item]));
  return task.reminderOffsets.map((offset) => {
    const id = `task-reminder:${task.id}:${offset}`;
    const remindAt = new Date(due - offset * 60_000).toISOString();
    const previous = byId.get(id);
    const unchanged = previous?.remindAt === remindAt;
    return {
      id,
      taskId: task.id,
      remindAt,
      state: unchanged && REMINDER_STATES.has(previous.state) ? previous.state : "pending",
      firedAt: unchanged ? previous.firedAt || null : null,
      snoozedUntil: unchanged ? previous.snoozedUntil || null : null,
      notificationKey: id,
    };
  });
}

function cloneState(state) {
  return typeof structuredClone === "function" ? structuredClone(state) : JSON.parse(JSON.stringify(state));
}

function refreshTaskReminders(state, taskId) {
  const task = state.localTasks.find((item) => item.id === taskId);
  const existing = state.taskReminders.filter((item) => item.taskId === taskId);
  state.taskReminders = [
    ...state.taskReminders.filter((item) => item.taskId !== taskId),
    ...(task ? buildTaskReminders(task, existing) : []),
  ];
}

function addTaskToState(state, input, options = {}) {
  const next = cloneState(state);
  const now = isoOrNull(options.now) || new Date().toISOString();
  const workspaceIds = new Set(next.workspaces.map((item) => item.id));
  const task = normalizeLocalTask({ ...input, id: input?.id || randomUUID(), createdAt: now, updatedAt: now }, {
    now,
    defaultWorkspaceId: next.activeWorkspaceId,
    timeZone: next.timeZone || deviceTimeZone(),
  });
  if (!workspaceIds.has(task.workspaceId)) throw new Error("任务所属空间不存在");
  next.localTasks.push(task);
  refreshTaskReminders(next, task.id);
  next.updatedAt = now;
  return { state: next, task };
}

function updateTaskInState(state, input, options = {}) {
  const next = cloneState(state);
  const now = isoOrNull(options.now) || new Date().toISOString();
  const id = String(input?.id || "");
  const index = next.localTasks.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("找不到指定任务");
  const task = normalizeLocalTask({ ...next.localTasks[index], ...input, id, updatedAt: now }, { now, timeZone: next.timeZone });
  if (!next.workspaces.some((item) => item.id === task.workspaceId)) throw new Error("任务所属空间不存在");
  next.localTasks[index] = task;
  refreshTaskReminders(next, id);
  next.updatedAt = now;
  return { state: next, task };
}

function deleteTaskFromState(state, taskId, options = {}) {
  const next = cloneState(state);
  const id = String(taskId || "");
  const index = next.localTasks.findIndex((item) => item.id === id);
  if (index < 0) throw new Error("找不到指定任务");
  const [task] = next.localTasks.splice(index, 1);
  next.taskReminders = next.taskReminders.filter((item) => item.taskId !== id);
  next.updatedAt = isoOrNull(options.now) || new Date().toISOString();
  return { state: next, task };
}

function updateTaskSettingsInState(state, patch, options = {}) {
  const next = cloneState(state);
  next.taskSettings = normalizeTaskSettings({
    ...next.taskSettings,
    ...(patch || {}),
    doNotDisturb: { ...next.taskSettings?.doNotDisturb, ...(patch?.doNotDisturb || {}) },
  });
  next.updatedAt = isoOrNull(options.now) || new Date().toISOString();
  return { state: next, taskSettings: next.taskSettings };
}

function updateReminderInState(state, reminderId, patch, options = {}) {
  const next = cloneState(state);
  const index = next.taskReminders.findIndex((item) => item.id === String(reminderId || ""));
  if (index < 0) throw new Error("找不到指定提醒");
  const reminder = normalizeTaskReminder({ ...next.taskReminders[index], ...patch });
  if (!reminder) throw new Error("提醒数据无效");
  next.taskReminders[index] = reminder;
  next.updatedAt = isoOrNull(options.now) || new Date().toISOString();
  return { state: next, reminder };
}

module.exports = {
  TASK_PRIORITIES,
  TASK_STATUSES,
  addTaskToState,
  buildTaskReminders,
  deleteTaskFromState,
  deviceTimeZone,
  normalizeLocalTask,
  normalizeLocalTasks,
  normalizeReminderOffsets,
  normalizeTaskReminders,
  normalizeTaskSettings,
  updateReminderInState,
  updateTaskInState,
  updateTaskSettingsInState,
};
