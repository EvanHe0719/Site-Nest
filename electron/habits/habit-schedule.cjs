const {
  localWeekday,
  normalizeLocalDate,
} = require("./date-utils.cjs");

function isHabitWithinDateBounds(habit, localDate, options = {}) {
  const date = normalizeLocalDate(localDate);
  const startDate = normalizeLocalDate(habit?.startDate);
  const endDate = normalizeLocalDate(habit?.endDate);
  if (habit?.deletedAt && options.respectDeleted !== false) return false;
  if (!date || !startDate || date.localeCompare(startDate) < 0) return false;
  return !endDate || date.localeCompare(endDate) <= 0;
}

function isHabitScheduledOnDate(habit, localDate, options = {}) {
  if (!habit || !isHabitWithinDateBounds(habit, localDate, options)) return false;
  if (options.respectStatus !== false && habit.status !== "active") return false;
  const weekday = localWeekday(localDate);
  if (weekday === null) return false;
  if (habit.frequencyType === "daily") return true;
  if (habit.frequencyType === "weekdays") return weekday >= 1 && weekday <= 5;
  if (habit.frequencyType === "customWeekdays") {
    return Array.isArray(habit.weekdays) && habit.weekdays.includes(weekday);
  }
  // A weekly target is flexible: every in-range day may hold one check-in,
  // while achievement and streaks are evaluated once per Monday-based week.
  return habit.frequencyType === "weeklyTarget";
}

function isHabitCheckInComplete(checkIn) {
  return Boolean(checkIn && !checkIn.deletedAt && checkIn.state === "completed");
}

function isHabitRewardEligible(habit, checkIn) {
  if (!habit || !checkIn || checkIn.deletedAt) return false;
  if (!isHabitScheduledOnDate(habit, checkIn.localDate, { respectStatus: false, respectDeleted: false })) return false;
  if (checkIn.state === "completed") return true;
  return checkIn.state === "partial" && habit.partialRewardEnabled === true;
}

module.exports = {
  isHabitCheckInComplete,
  isHabitRewardEligible,
  isHabitScheduledOnDate,
  isHabitWithinDateBounds,
};
