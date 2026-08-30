const { addLocalDays, localDateFromInstant, normalizeLocalDate } = require("./date-utils.cjs");
const { isHabitScheduledOnDate } = require("./habit-schedule.cjs");

const HABIT_REMINDER_STATES = new Set(["pending", "snoozed", "fired", "dismissed"]);

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function normalizeHabitReminder(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const id = String(input.id || "").trim().slice(0, 240);
  const habitId = String(input.habitId || "").trim().slice(0, 120);
  const localDate = normalizeLocalDate(input.localDate);
  const remindAt = isoOrNull(input.remindAt);
  if (!id || !habitId || !localDate || !remindAt) return null;
  return {
    id,
    kind: "habit",
    habitId,
    localDate,
    remindAt,
    state: HABIT_REMINDER_STATES.has(input.state) ? input.state : "pending",
    firedAt: isoOrNull(input.firedAt),
    snoozedUntil: isoOrNull(input.snoozedUntil),
    notificationKey: String(input.notificationKey || id).slice(0, 240),
  };
}

function normalizeHabitReminders(value, habitIds = null) {
  const allowed = habitIds ? new Set(habitIds) : null;
  const byId = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const reminder = normalizeHabitReminder(candidate);
    if (!reminder || (allowed && !allowed.has(reminder.habitId))) continue;
    byId.set(reminder.id, reminder);
  }
  return Array.from(byId.values())
    .sort((left, right) => left.remindAt.localeCompare(right.remindAt))
    .slice(-10_000);
}

function habitReminderId(habitId, localDate, reminderTime) {
  return `habit-reminder:${habitId}:${localDate}:${reminderTime}`;
}

function localReminderInstant(localDate, reminderTime) {
  if (!normalizeLocalDate(localDate) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(String(reminderTime || ""))) return null;
  const date = new Date(`${localDate}T${reminderTime}:00`);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function buildHabitReminders(habits, checkIns, existing, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date(options.now || Date.now());
  const today = localDateFromInstant(now);
  const daysAhead = Math.max(1, Math.min(31, Number(options.daysAhead) || 8));
  const existingById = new Map(normalizeHabitReminders(existing).map((item) => [item.id, item]));
  const activeCheckInKeys = new Set((Array.isArray(checkIns) ? checkIns : [])
    .filter((item) => !item.deletedAt)
    .map((item) => `${item.habitId}:${item.localDate}`));
  const result = [];
  for (const habit of Array.isArray(habits) ? habits : []) {
    if (!habit || habit.deletedAt || habit.status !== "active" || !habit.reminderTime) continue;
    for (let offset = 0; offset < daysAhead; offset += 1) {
      const localDate = addLocalDays(today, offset);
      if (!isHabitScheduledOnDate(habit, localDate)) continue;
      if (activeCheckInKeys.has(`${habit.id}:${localDate}`)) continue;
      const remindAt = localReminderInstant(localDate, habit.reminderTime);
      if (!remindAt) continue;
      const id = habitReminderId(habit.id, localDate, habit.reminderTime);
      const previous = existingById.get(id);
      result.push({
        id,
        kind: "habit",
        habitId: habit.id,
        localDate,
        remindAt,
        state: previous?.state || "pending",
        firedAt: previous?.firedAt || null,
        snoozedUntil: previous?.snoozedUntil || null,
        notificationKey: id,
      });
    }
  }
  return normalizeHabitReminders(result);
}

function updateHabitReminderInState(state, reminderId, patch) {
  const next = typeof structuredClone === "function" ? structuredClone(state) : JSON.parse(JSON.stringify(state));
  const habitIds = (Array.isArray(next.habits) ? next.habits : []).map((habit) => habit.id);
  next.habitReminders = normalizeHabitReminders(next.habitReminders, habitIds);
  const index = next.habitReminders.findIndex((item) => item.id === String(reminderId || ""));
  if (index < 0) throw new Error("找不到指定习惯提醒");
  const reminder = normalizeHabitReminder({ ...next.habitReminders[index], ...(patch || {}) });
  if (!reminder) throw new Error("习惯提醒数据无效");
  next.habitReminders[index] = reminder;
  next.updatedAt = new Date().toISOString();
  return { state: next, reminder };
}

module.exports = {
  HABIT_REMINDER_STATES,
  buildHabitReminders,
  habitReminderId,
  localReminderInstant,
  normalizeHabitReminder,
  normalizeHabitReminders,
  updateHabitReminderInState,
};
