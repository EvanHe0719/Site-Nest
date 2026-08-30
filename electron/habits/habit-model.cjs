const { randomUUID } = require("node:crypto");
const {
  localDateFromInstant,
  normalizeLocalDate,
} = require("./date-utils.cjs");
const {
  isHabitRewardEligible,
  isHabitScheduledOnDate,
} = require("./habit-schedule.cjs");

const HABIT_STATUSES = new Set(["active", "paused", "completed", "archived"]);
const HABIT_FREQUENCY_TYPES = new Set(["daily", "weekdays", "customWeekdays", "weeklyTarget"]);
const HABIT_TARGET_TYPES = new Set(["none", "totalCheckIns", "endDate"]);
const HABIT_CHECK_IN_STATES = new Set(["completed", "partial", "skipped"]);
const HABIT_REWARD_TYPE = "habitCompletionStar";
const HABIT_REWARD_SOURCE_TYPE = "habitCheckIn";

function cloneValue(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function isoNow(value) {
  return isoOrNull(value) || new Date().toISOString();
}

function safeString(value, limit = 5000, trim = false) {
  const text = String(value ?? "");
  return (trim ? text.trim() : text).slice(0, limit);
}

function safeIdentifier(value, limit = 120) {
  return safeString(value, limit, true).replace(/[^a-zA-Z0-9:._-]/g, "-");
}

function normalizeReminderOffsets(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map(Number)
    .filter((item) => Number.isFinite(item) && item >= 0 && item <= 525_600)
    .map(Math.round)))
    .sort((left, right) => right - left)
    .slice(0, 20);
}

function normalizeReminderTime(value) {
  const text = safeString(value, 5, true);
  const match = text.match(/^(\d{2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59 ? text : null;
}

function normalizeWeekdays(value) {
  return Array.from(new Set((Array.isArray(value) ? value : [])
    .map(Number)
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7)))
    .sort((left, right) => left - right);
}

function normalizeHabitDefinition(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = safeIdentifier(input.id || options.id || randomUUID());
  const name = safeString(input.name, 300, true);
  if (!id || !name) return null;
  const frequencyType = HABIT_FREQUENCY_TYPES.has(input.frequencyType)
    ? input.frequencyType
    : "daily";
  const requestedWeekdays = normalizeWeekdays(input.weekdays);
  const weekdays = frequencyType === "weekdays"
    ? [1, 2, 3, 4, 5]
    : frequencyType === "customWeekdays"
      ? (requestedWeekdays.length ? requestedWeekdays : [1, 2, 3, 4, 5])
      : [];
  const rawWeeklyTarget = Number(input.weeklyTarget);
  const weeklyTarget = frequencyType === "weeklyTarget"
    ? Math.max(1, Math.min(7, Number.isFinite(rawWeeklyTarget) ? Math.round(rawWeeklyTarget) : 1))
    : null;
  const startDate = normalizeLocalDate(input.startDate)
    || normalizeLocalDate(options.localDate)
    || localDateFromInstant(options.now || new Date());
  let endDate = normalizeLocalDate(input.endDate);
  if (endDate && startDate && endDate.localeCompare(startDate) < 0) endDate = null;
  const targetType = HABIT_TARGET_TYPES.has(input.targetType) ? input.targetType : "none";
  const rawTargetValue = Number(input.targetValue);
  const targetValue = targetType === "totalCheckIns" && Number.isFinite(rawTargetValue) && rawTargetValue > 0
    ? Math.round(rawTargetValue)
    : null;
  return {
    id,
    name,
    description: safeString(input.description, 5000),
    iconKey: safeIdentifier(input.iconKey || "check", 40) || "check",
    accentKey: safeIdentifier(input.accentKey || "habit", 40) || "habit",
    workspaceId: safeIdentifier(input.workspaceId || options.defaultWorkspaceId || "personal"),
    status: HABIT_STATUSES.has(input.status) ? input.status : "active",
    frequencyType,
    weekdays,
    weeklyTarget,
    startDate,
    endDate,
    targetType,
    targetValue,
    reminderTime: normalizeReminderTime(input.reminderTime),
    reminderOffsets: normalizeReminderOffsets(input.reminderOffsets),
    partialRewardEnabled: input.partialRewardEnabled === true,
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    tagIds: Array.from(new Set((Array.isArray(input.tagIds) ? input.tagIds : [])
      .map((item) => safeIdentifier(item))
      .filter(Boolean))).slice(0, 100),
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    deletedAt: isoOrNull(input.deletedAt),
  };
}

function newerRecord(left, right) {
  const leftTime = Date.parse(left?.updatedAt || left?.createdAt || 0) || 0;
  const rightTime = Date.parse(right?.updatedAt || right?.createdAt || 0) || 0;
  if (leftTime !== rightTime) return leftTime > rightTime ? left : right;
  return String(left?.id || "").localeCompare(String(right?.id || "")) >= 0 ? left : right;
}

function normalizeHabitDefinitions(value, options = {}) {
  const byId = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const habit = normalizeHabitDefinition(candidate, options);
    if (!habit) continue;
    const previous = byId.get(habit.id);
    byId.set(habit.id, previous ? newerRecord(previous, habit) : habit);
  }
  return Array.from(byId.values())
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .slice(0, 10_000);
}

function normalizeHabitCheckIn(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = safeIdentifier(input.id || options.id || randomUUID());
  const habitId = safeIdentifier(input.habitId);
  const localDate = normalizeLocalDate(input.localDate);
  if (!id || !habitId || !localDate) return null;
  const numericValue = input.value === null || input.value === undefined || input.value === ""
    ? null
    : Number(input.value);
  return {
    id,
    habitId,
    localDate,
    value: Number.isFinite(numericValue) && numericValue >= 0 ? Math.min(numericValue, 1_000_000_000) : null,
    state: HABIT_CHECK_IN_STATES.has(input.state) ? input.state : "completed",
    note: safeString(input.note, 5000),
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    deletedAt: isoOrNull(input.deletedAt),
  };
}

function normalizeHabitCheckIns(value, options = {}) {
  const allowedHabitIds = options.habitIds ? new Set(options.habitIds) : null;
  const byId = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const checkIn = normalizeHabitCheckIn(candidate, options);
    if (!checkIn || (allowedHabitIds && !allowedHabitIds.has(checkIn.habitId))) continue;
    const previous = byId.get(checkIn.id);
    byId.set(checkIn.id, previous ? newerRecord(previous, checkIn) : checkIn);
  }
  const normalized = Array.from(byId.values());
  const activeByKey = new Map();
  for (const checkIn of normalized) {
    if (checkIn.deletedAt) continue;
    const key = habitDateKey(checkIn.habitId, checkIn.localDate);
    const previous = activeByKey.get(key);
    if (!previous) {
      activeByKey.set(key, checkIn);
      continue;
    }
    const winner = newerRecord(previous, checkIn);
    const loser = winner === previous ? checkIn : previous;
    loser.deletedAt = winner.updatedAt;
    activeByKey.set(key, winner);
  }
  return normalized
    .sort((left, right) => left.localDate.localeCompare(right.localDate) || left.createdAt.localeCompare(right.createdAt))
    .slice(0, 100_000);
}

function normalizeRewardEntry(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = safeIdentifier(input.id || options.id || randomUUID());
  const habitId = safeIdentifier(input.habitId);
  const checkInId = safeIdentifier(input.checkInId);
  const localDate = normalizeLocalDate(input.localDate);
  if (!id || !habitId || !localDate) return null;
  return {
    id,
    rewardType: HABIT_REWARD_TYPE,
    sourceType: HABIT_REWARD_SOURCE_TYPE,
    sourceId: safeIdentifier(input.sourceId || checkInId) || null,
    habitId,
    checkInId: checkInId || null,
    localDate,
    amount: 1,
    reason: safeString(input.reason || "habit completed", 300, true),
    createdAt: isoOrNull(input.createdAt) || now,
    reversedAt: isoOrNull(input.reversedAt),
  };
}

function normalizeRewardLedger(value, options = {}) {
  const allowedHabitIds = options.habitIds ? new Set(options.habitIds) : null;
  const byId = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const entry = normalizeRewardEntry(candidate, options);
    if (!entry || (allowedHabitIds && !allowedHabitIds.has(entry.habitId))) continue;
    const previous = byId.get(entry.id);
    byId.set(entry.id, previous ? newerRecord(previous, entry) : entry);
  }
  const normalized = Array.from(byId.values());
  const activeByKey = new Map();
  for (const entry of normalized) {
    if (entry.reversedAt) continue;
    const key = rewardKey(entry.habitId, entry.localDate, entry.rewardType);
    const previous = activeByKey.get(key);
    if (!previous) {
      activeByKey.set(key, entry);
      continue;
    }
    const winner = newerRecord(previous, entry);
    const loser = winner === previous ? entry : previous;
    loser.reversedAt = winner.createdAt;
    activeByKey.set(key, winner);
  }
  return normalized
    .sort((left, right) => left.localDate.localeCompare(right.localDate) || left.createdAt.localeCompare(right.createdAt))
    .slice(0, 200_000);
}

function habitDateKey(habitId, localDate) {
  return `${safeIdentifier(habitId)}:${normalizeLocalDate(localDate) || ""}`;
}

function rewardKey(habitId, localDate, rewardType = HABIT_REWARD_TYPE) {
  return `${habitDateKey(habitId, localDate)}:${rewardType}`;
}

function stateForHabitMutation(state, options = {}) {
  const next = cloneValue(state && typeof state === "object" ? state : {});
  next.habits = normalizeHabitDefinitions(next.habits, options);
  const habitIds = next.habits.map((habit) => habit.id);
  next.habitCheckIns = normalizeHabitCheckIns(next.habitCheckIns, { ...options, habitIds });
  next.rewardLedger = normalizeRewardLedger(next.rewardLedger, { ...options, habitIds });
  return next;
}

function habitForMutation(state, habitId, options = {}) {
  const habit = state.habits.find((item) => item.id === safeIdentifier(habitId));
  if (!habit || (habit.deletedAt && options.allowDeleted !== true)) throw new Error("找不到指定长期目标");
  return habit;
}

function addHabitDefinitionToState(state, input, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const habit = normalizeHabitDefinition({
    ...(input || {}),
    id: input?.id || randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }, { ...options, now });
  if (!habit) throw new Error("长期目标缺少有效名称或开始日期");
  if (next.habits.some((item) => item.id === habit.id)) throw new Error("长期目标 ID 已存在");
  next.habits.push(habit);
  next.habits.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name));
  next.updatedAt = now;
  return { state: next, habit };
}

function updateHabitDefinitionInState(state, input, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const id = safeIdentifier(input?.id);
  const index = next.habits.findIndex((habit) => habit.id === id && !habit.deletedAt);
  if (index < 0) throw new Error("找不到指定长期目标");
  const habit = normalizeHabitDefinition({
    ...next.habits[index],
    ...(input || {}),
    id,
    createdAt: next.habits[index].createdAt,
    updatedAt: now,
    deletedAt: null,
  }, { ...options, now });
  if (!habit) throw new Error("长期目标内容无效");
  next.habits[index] = habit;
  reconcileHabitRewardEntries(next, habit.id, now);
  next.updatedAt = now;
  return { state: next, habit, starCount: habitStarCount(next.rewardLedger, habit.id) };
}

function deleteHabitDefinitionFromState(state, habitId, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const habit = habitForMutation(next, habitId);
  habit.updatedAt = now;
  habit.deletedAt = now;
  // Check-ins and rewards remain intact for undo and long-term history.
  next.updatedAt = now;
  return { state: next, habit, starCount: habitStarCount(next.rewardLedger, habit.id) };
}

function restoreHabitDefinitionInState(state, habitId, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const habit = habitForMutation(next, habitId, { allowDeleted: true });
  if (!habit.deletedAt) return { state: next, habit, starCount: habitStarCount(next.rewardLedger, habit.id) };
  habit.updatedAt = now;
  habit.deletedAt = null;
  next.updatedAt = now;
  return { state: next, habit, starCount: habitStarCount(next.rewardLedger, habit.id) };
}

function activeCheckInForDate(state, habitId, localDate, excludeId = null) {
  const key = habitDateKey(habitId, localDate);
  return state.habitCheckIns.find((item) => (
    !item.deletedAt && item.id !== excludeId && habitDateKey(item.habitId, item.localDate) === key
  )) || null;
}

function activeRewardForDate(state, habitId, localDate) {
  const key = rewardKey(habitId, localDate);
  return state.rewardLedger.find((entry) => !entry.reversedAt && rewardKey(entry.habitId, entry.localDate, entry.rewardType) === key) || null;
}

function reconcileRewardDate(state, habitId, localDate, now) {
  const habit = state.habits.find((item) => item.id === habitId);
  const checkIn = activeCheckInForDate(state, habitId, localDate);
  const key = rewardKey(habitId, localDate);
  const entries = state.rewardLedger.filter((entry) => rewardKey(entry.habitId, entry.localDate, entry.rewardType) === key);
  const eligible = Boolean(habit && checkIn && isHabitRewardEligible(habit, checkIn));
  if (!eligible) {
    for (const entry of entries) {
      if (!entry.reversedAt) entry.reversedAt = now;
    }
    return null;
  }
  let canonical = entries.find((entry) => entry.checkInId === checkIn.id)
    || entries.find((entry) => !entry.reversedAt)
    || entries[0];
  if (!canonical) {
    canonical = normalizeRewardEntry({
      id: randomUUID(),
      habitId,
      checkInId: checkIn.id,
      sourceId: checkIn.id,
      localDate,
      amount: 1,
      reason: checkIn.state === "partial" ? "partial check-in reward enabled" : "habit completed",
      createdAt: now,
      reversedAt: null,
    }, { now });
    state.rewardLedger.push(canonical);
  } else {
    canonical.checkInId = checkIn.id;
    canonical.sourceId = checkIn.id;
    canonical.amount = 1;
    canonical.reason = checkIn.state === "partial" ? "partial check-in reward enabled" : "habit completed";
    canonical.reversedAt = null;
  }
  for (const entry of entries) {
    if (entry !== canonical && !entry.reversedAt) entry.reversedAt = now;
  }
  return canonical;
}

function reconcileHabitRewardEntries(state, habitId, now) {
  const dates = new Set([
    ...state.habitCheckIns.filter((item) => item.habitId === habitId).map((item) => item.localDate),
    ...state.rewardLedger.filter((item) => item.habitId === habitId).map((item) => item.localDate),
  ]);
  for (const localDate of dates) reconcileRewardDate(state, habitId, localDate, now);
}

function upsertHabitCheckInInState(state, input, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const requestedId = safeIdentifier(input?.id);
  let existing = requestedId
    ? next.habitCheckIns.find((item) => item.id === requestedId)
    : activeCheckInForDate(next, input?.habitId, input?.localDate);
  if (existing?.deletedAt && options.restoreDeleted !== true) existing = null;
  const habitId = safeIdentifier(input?.habitId || existing?.habitId);
  const habit = habitForMutation(next, habitId);
  const localDate = normalizeLocalDate(input?.localDate || existing?.localDate);
  if (!localDate) throw new Error("打卡日期无效");
  if (habit.status !== "active" && options.allowInactive !== true) throw new Error("当前长期目标不可打卡");
  if (!isHabitScheduledOnDate(habit, localDate, { respectStatus: options.allowInactive !== true })) {
    throw new Error("该日期不是这个长期目标的计划日");
  }
  const conflict = activeCheckInForDate(next, habit.id, localDate, existing?.id || null);
  if (conflict) {
    if (requestedId && conflict.id !== requestedId) throw new Error("同一长期目标同一天只能有一条有效打卡");
    existing = conflict;
  }
  const oldHabitId = existing?.habitId || null;
  const oldLocalDate = existing?.localDate || null;
  const checkIn = normalizeHabitCheckIn({
    ...(existing || {}),
    ...(input || {}),
    id: existing?.id || requestedId || randomUUID(),
    habitId: habit.id,
    localDate,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    deletedAt: null,
  }, { now });
  if (!checkIn) throw new Error("打卡内容无效");
  if (existing) {
    const index = next.habitCheckIns.findIndex((item) => item.id === existing.id);
    next.habitCheckIns[index] = checkIn;
  } else {
    next.habitCheckIns.push(checkIn);
  }
  if (oldHabitId && oldLocalDate && (oldHabitId !== checkIn.habitId || oldLocalDate !== checkIn.localDate)) {
    reconcileRewardDate(next, oldHabitId, oldLocalDate, now);
  }
  const reward = reconcileRewardDate(next, checkIn.habitId, checkIn.localDate, now);
  next.updatedAt = now;
  return {
    state: next,
    checkIn,
    reward,
    starCount: habitStarCount(next.rewardLedger, checkIn.habitId),
  };
}

function deleteHabitCheckInFromState(state, checkInId, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const id = safeIdentifier(checkInId);
  const checkIn = next.habitCheckIns.find((item) => item.id === id && !item.deletedAt);
  if (!checkIn) throw new Error("找不到指定打卡记录");
  checkIn.updatedAt = now;
  checkIn.deletedAt = now;
  reconcileRewardDate(next, checkIn.habitId, checkIn.localDate, now);
  next.updatedAt = now;
  return { state: next, checkIn, starCount: habitStarCount(next.rewardLedger, checkIn.habitId) };
}

function restoreHabitCheckInInState(state, checkInId, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  const id = safeIdentifier(checkInId);
  const checkIn = next.habitCheckIns.find((item) => item.id === id && item.deletedAt);
  if (!checkIn) throw new Error("找不到可恢复的打卡记录");
  habitForMutation(next, checkIn.habitId, { allowDeleted: true });
  if (activeCheckInForDate(next, checkIn.habitId, checkIn.localDate, checkIn.id)) {
    throw new Error("同一长期目标同一天已经有有效打卡");
  }
  checkIn.updatedAt = now;
  checkIn.deletedAt = null;
  reconcileRewardDate(next, checkIn.habitId, checkIn.localDate, now);
  next.updatedAt = now;
  return {
    state: next,
    checkIn,
    reward: activeRewardForDate(next, checkIn.habitId, checkIn.localDate),
    starCount: habitStarCount(next.rewardLedger, checkIn.habitId),
  };
}

function rebuildRewardLedgerInState(state, options = {}) {
  const next = stateForHabitMutation(state, options);
  const now = isoNow(options.now);
  for (const habit of next.habits) reconcileHabitRewardEntries(next, habit.id, now);
  next.updatedAt = now;
  return {
    state: next,
    rewardLedger: next.rewardLedger,
    totals: habitStarCounts(next.rewardLedger),
  };
}

function habitStarCount(ledger, habitId) {
  const id = safeIdentifier(habitId);
  return (Array.isArray(ledger) ? ledger : [])
    .filter((entry) => entry.habitId === id && entry.rewardType === HABIT_REWARD_TYPE && !entry.reversedAt)
    .reduce((total, entry) => total + (Number(entry.amount) || 0), 0);
}

function habitStarCounts(ledger) {
  const totals = {};
  for (const entry of Array.isArray(ledger) ? ledger : []) {
    if (entry.rewardType !== HABIT_REWARD_TYPE || entry.reversedAt) continue;
    totals[entry.habitId] = (totals[entry.habitId] || 0) + (Number(entry.amount) || 0);
  }
  return totals;
}

function totalHabitStarCount(ledger) {
  return Object.values(habitStarCounts(ledger)).reduce((total, value) => total + value, 0);
}

function formatHabitStarCount(value) {
  const total = Math.max(0, Math.floor(Number(value) || 0));
  return total > 999 ? "999+" : String(total);
}

module.exports = {
  HABIT_CHECK_IN_STATES,
  HABIT_FREQUENCY_TYPES,
  HABIT_REWARD_SOURCE_TYPE,
  HABIT_REWARD_TYPE,
  HABIT_STATUSES,
  HABIT_TARGET_TYPES,
  activeCheckInForDate,
  addHabitDefinitionToState,
  deleteHabitCheckInFromState,
  deleteHabitDefinitionFromState,
  formatHabitStarCount,
  habitDateKey,
  habitStarCount,
  habitStarCounts,
  normalizeHabitCheckIn,
  normalizeHabitCheckIns,
  normalizeHabitDefinition,
  normalizeHabitDefinitions,
  normalizeHabitState: stateForHabitMutation,
  normalizeReminderOffsets,
  normalizeReminderTime,
  normalizeRewardEntry,
  normalizeRewardLedger,
  normalizeWeekdays,
  rebuildRewardLedgerInState,
  restoreHabitCheckInInState,
  restoreHabitDefinitionInState,
  rewardKey,
  stateForHabitMutation,
  totalHabitStarCount,
  updateHabitDefinitionInState,
  upsertHabitCheckInInState,
};
