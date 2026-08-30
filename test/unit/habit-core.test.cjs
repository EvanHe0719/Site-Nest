const test = require("node:test");
const assert = require("node:assert/strict");

const {
  addHabitDefinitionToState,
  buildHabitReminders,
  buildHabitHeatmap,
  computeHabitStats,
  deleteHabitCheckInFromState,
  deleteHabitDefinitionFromState,
  formatHabitStarCount,
  habitStarCount,
  isHabitScheduledOnDate,
  localWeekday,
  normalizeHabitDefinition,
  rebuildRewardLedgerInState,
  restoreHabitCheckInInState,
  totalHabitStarCount,
  updateHabitDefinitionInState,
  updateHabitReminderInState,
  upsertHabitCheckInInState,
} = require("../../electron/habits/index.cjs");

const NOW = "2026-08-03T08:00:00.000Z";

function emptyState() {
  return {
    habits: [],
    habitCheckIns: [],
    rewardLedger: [],
    updatedAt: NOW,
  };
}

function addHabit(state, overrides = {}) {
  return addHabitDefinitionToState(state, {
    name: "英语学习",
    workspaceId: "personal",
    frequencyType: "daily",
    startDate: "2026-08-01",
    ...overrides,
  }, { now: NOW, localDate: "2026-08-03" });
}

function checkIn(state, habitId, localDate, overrides = {}) {
  return upsertHabitCheckInInState(state, {
    habitId,
    localDate,
    state: "completed",
    ...overrides,
  }, { now: NOW });
}

test("habit definitions normalize weekday rules with Monday as 1", () => {
  const weekdays = normalizeHabitDefinition({
    id: "weekday-habit",
    name: "工作日阅读",
    frequencyType: "weekdays",
    weekdays: [7],
    startDate: "2026-08-01",
    reminderTime: "08:30",
  }, { now: NOW });
  const custom = normalizeHabitDefinition({
    id: "custom-habit",
    name: "每周一三五健身",
    frequencyType: "customWeekdays",
    weekdays: [5, 1, 3, 3, 0, 8],
    startDate: "2026-08-01",
  }, { now: NOW });
  assert.deepEqual(weekdays.weekdays, [1, 2, 3, 4, 5]);
  assert.equal(weekdays.reminderTime, "08:30");
  assert.deepEqual(custom.weekdays, [1, 3, 5]);
  assert.equal(normalizeHabitDefinition({ id: "bad-time", name: "无效提醒", startDate: "2026-08-01", reminderTime: "24:00" }, { now: NOW }).reminderTime, null);
  assert.equal(localWeekday("2026-08-03"), 1);
  assert.equal(isHabitScheduledOnDate(custom, "2026-08-03"), true);
  assert.equal(isHabitScheduledOnDate(custom, "2026-08-04"), false);
});

test("same habit and local date upserts one effective check-in and one star", () => {
  const original = emptyState();
  const added = addHabit(original);
  const first = checkIn(added.state, added.habit.id, "2026-08-03", { note: "第一版" });
  const second = checkIn(first.state, added.habit.id, "2026-08-03", { note: "修正备注" });
  assert.equal(original.habits.length, 0, "pure mutators must not modify the caller state");
  assert.equal(second.state.habitCheckIns.filter((item) => !item.deletedAt).length, 1);
  assert.equal(second.checkIn.id, first.checkIn.id);
  assert.equal(second.checkIn.note, "修正备注");
  assert.equal(second.state.rewardLedger.length, 1);
  assert.equal(second.state.rewardLedger[0].reversedAt, null);
  assert.equal(second.starCount, 1);
  assert.throws(() => upsertHabitCheckInInState(second.state, {
    id: "conflicting-id",
    habitId: added.habit.id,
    localDate: "2026-08-03",
    state: "completed",
  }, { now: NOW }), /同一天只能有一条有效打卡/);
});

test("partial does not count toward streak and earns a star only when explicitly enabled", () => {
  const added = addHabit(emptyState(), { partialRewardEnabled: false });
  const partial = checkIn(added.state, added.habit.id, "2026-08-01", { state: "partial", value: 0.5 });
  assert.equal(partial.starCount, 0);
  assert.equal(computeHabitStats(added.habit, partial.state.habitCheckIns, { asOfLocalDate: "2026-08-01" }).currentStreak, 0);

  const enabled = updateHabitDefinitionInState(partial.state, {
    id: added.habit.id,
    partialRewardEnabled: true,
  }, { now: "2026-08-03T09:00:00.000Z" });
  assert.equal(enabled.starCount, 1);
  assert.equal(computeHabitStats(enabled.habit, enabled.state.habitCheckIns, { asOfLocalDate: "2026-08-01" }).currentStreak, 0);
});

test("deleting and restoring a check-in reverses and restores the same ledger reward", () => {
  const added = addHabit(emptyState());
  const completed = checkIn(added.state, added.habit.id, "2026-08-03");
  const rewardId = completed.reward.id;
  const removed = deleteHabitCheckInFromState(completed.state, completed.checkIn.id, {
    now: "2026-08-04T08:00:00.000Z",
  });
  assert.equal(removed.starCount, 0);
  assert.ok(removed.state.rewardLedger[0].reversedAt);

  const restored = restoreHabitCheckInInState(removed.state, completed.checkIn.id, {
    now: "2026-08-05T08:00:00.000Z",
  });
  assert.equal(restored.starCount, 1);
  assert.equal(restored.state.rewardLedger.length, 1);
  assert.equal(restored.state.rewardLedger[0].id, rewardId);
  assert.equal(restored.state.rewardLedger[0].reversedAt, null);
});

test("moving a completed check-in date reverses the old reward and creates one valid new reward", () => {
  const added = addHabit(emptyState());
  const completed = checkIn(added.state, added.habit.id, "2026-08-03");
  const moved = upsertHabitCheckInInState(completed.state, {
    id: completed.checkIn.id,
    habitId: added.habit.id,
    localDate: "2026-08-04",
    state: "completed",
  }, { now: "2026-08-04T09:00:00.000Z" });
  assert.equal(moved.checkIn.localDate, "2026-08-04");
  assert.equal(moved.starCount, 1);
  assert.equal(moved.state.rewardLedger.length, 2);
  assert.ok(moved.state.rewardLedger.find((entry) => entry.localDate === "2026-08-03").reversedAt);
  assert.equal(moved.state.rewardLedger.find((entry) => entry.localDate === "2026-08-04").reversedAt, null);
});

test("custom weekdays ignore unscheduled dates when calculating streaks", () => {
  let result = addHabit(emptyState(), {
    frequencyType: "customWeekdays",
    weekdays: [1, 3, 5],
    startDate: "2026-08-03",
  });
  for (const localDate of ["2026-08-03", "2026-08-05", "2026-08-07", "2026-08-10"]) {
    result = checkIn(result.state, result.habit?.id || result.state.habits[0].id, localDate);
  }
  const habit = result.state.habits[0];
  const throughMonday = computeHabitStats(habit, result.state.habitCheckIns, { asOfLocalDate: "2026-08-10" });
  assert.equal(throughMonday.currentStreak, 4);
  assert.equal(throughMonday.longestStreak, 4);
  const missedWednesday = computeHabitStats(habit, result.state.habitCheckIns, { asOfLocalDate: "2026-08-12" });
  assert.equal(missedWednesday.currentStreak, 0);
  assert.equal(missedWednesday.longestStreak, 4);
});

test("weeklyTarget reports Monday-based achieved-week streaks without breaking on an open week", () => {
  let result = addHabit(emptyState(), {
    name: "每周健身三次",
    frequencyType: "weeklyTarget",
    weeklyTarget: 3,
    startDate: "2026-08-03",
  });
  const habitId = result.habit.id;
  for (const localDate of ["2026-08-03", "2026-08-05", "2026-08-07", "2026-08-10", "2026-08-11"]) {
    result = checkIn(result.state, habitId, localDate);
  }
  let stats = computeHabitStats(result.state.habits[0], result.state.habitCheckIns, { asOfLocalDate: "2026-08-12" });
  assert.equal(stats.currentWeekCompleted, 2);
  assert.equal(stats.currentStreakWeeks, 1);
  assert.equal(stats.longestStreakWeeks, 1);

  result = checkIn(result.state, habitId, "2026-08-12");
  stats = computeHabitStats(result.state.habits[0], result.state.habitCheckIns, { asOfLocalDate: "2026-08-12" });
  assert.equal(stats.currentWeekCompleted, 3);
  assert.equal(stats.currentStreakWeeks, 2);
  assert.equal(stats.longestStreakWeeks, 2);
});

test("annual heatmap preserves local dates and distinguishes partial and skipped", () => {
  let result = addHabit(emptyState(), { startDate: "2024-01-01" });
  const habitId = result.habit.id;
  result = checkIn(result.state, habitId, "2024-02-29", { state: "completed" });
  result = checkIn(result.state, habitId, "2024-03-01", { state: "partial" });
  result = checkIn(result.state, habitId, "2024-03-02", { state: "skipped" });
  const heatmap = buildHabitHeatmap(result.state.habits[0], result.state.habitCheckIns, 2024);
  assert.equal(heatmap.days.length, 366);
  assert.equal(heatmap.days.find((day) => day.localDate === "2024-02-29").intensity, 1);
  assert.equal(heatmap.days.find((day) => day.localDate === "2024-03-01").state, "partial");
  assert.equal(heatmap.days.find((day) => day.localDate === "2024-03-02").marker, "skipped");
  assert.deepEqual(heatmap.summary, { completed: 1, partial: 1, skipped: 1, scheduled: 366 });
});

test("reward ledger can be rebuilt and stars survive completed, archived and soft-deleted habits", () => {
  let result = addHabit(emptyState());
  const habitId = result.habit.id;
  result = checkIn(result.state, habitId, "2026-08-01");
  result = checkIn(result.state, habitId, "2026-08-02");
  const withoutLedger = { ...result.state, rewardLedger: [] };
  const rebuilt = rebuildRewardLedgerInState(withoutLedger, { now: NOW });
  assert.equal(habitStarCount(rebuilt.state.rewardLedger, habitId), 2);
  assert.equal(totalHabitStarCount(rebuilt.state.rewardLedger), 2);

  const archived = updateHabitDefinitionInState(rebuilt.state, { id: habitId, status: "archived" }, { now: NOW });
  assert.equal(archived.starCount, 2);
  const deleted = deleteHabitDefinitionFromState(archived.state, habitId, { now: NOW });
  assert.equal(deleted.starCount, 2);
  assert.equal(rebuildRewardLedgerInState(deleted.state, { now: NOW }).totals[habitId], 2);
  assert.equal(formatHabitStarCount(999), "999");
  assert.equal(formatHabitStarCount(1000), "999+");
});

test("habit reminders reuse stable ids, preserve snooze and disappear after check-in", () => {
  const added = addHabit(emptyState(), { reminderTime: "08:30" });
  const first = buildHabitReminders(added.state.habits, [], [], {
    now: new Date(2026, 7, 3, 8, 0, 0),
    daysAhead: 2,
  });
  assert.equal(first.length, 2);
  assert.match(first[0].id, /^habit-reminder:/);
  const withReminders = { ...added.state, habitReminders: first };
  const snoozed = updateHabitReminderInState(withReminders, first[0].id, {
    state: "snoozed",
    snoozedUntil: "2026-08-03T01:00:00.000Z",
  });
  const rebuilt = buildHabitReminders(added.state.habits, [], snoozed.state.habitReminders, {
    now: new Date(2026, 7, 3, 8, 0, 0),
    daysAhead: 2,
  });
  assert.equal(rebuilt[0].state, "snoozed");
  const completed = checkIn(added.state, added.habit.id, "2026-08-03");
  const afterCheckIn = buildHabitReminders(completed.state.habits, completed.state.habitCheckIns, rebuilt, {
    now: new Date(2026, 7, 3, 8, 0, 0),
    daysAhead: 2,
  });
  assert.equal(afterCheckIn.some((item) => item.localDate === "2026-08-03"), false);
});
