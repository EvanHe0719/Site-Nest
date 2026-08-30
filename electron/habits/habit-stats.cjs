const {
  addLocalDays,
  earlierLocalDate,
  laterLocalDate,
  localDateFromInstant,
  localDateRange,
  normalizeLocalDate,
  startOfLocalWeek,
} = require("./date-utils.cjs");
const { normalizeHabitCheckIns } = require("./habit-model.cjs");
const {
  isHabitCheckInComplete,
  isHabitScheduledOnDate,
} = require("./habit-schedule.cjs");

function activeCheckInsForHabit(habit, checkIns) {
  if (!habit?.id) return [];
  return normalizeHabitCheckIns(checkIns, { habitIds: [habit.id] })
    .filter((checkIn) => checkIn.habitId === habit.id && !checkIn.deletedAt);
}

function statisticsHorizon(habit, options = {}) {
  const asOfLocalDate = normalizeLocalDate(options.asOfLocalDate)
    || localDateFromInstant(options.now || new Date());
  const startDate = normalizeLocalDate(habit?.startDate);
  if (!startDate || !asOfLocalDate) return { startDate: null, endDate: null, asOfLocalDate };
  const endDate = earlierLocalDate(asOfLocalDate, habit?.endDate);
  return {
    startDate,
    endDate: endDate && endDate.localeCompare(startDate) >= 0 ? endDate : null,
    asOfLocalDate,
  };
}

function completedDateSet(habit, checkIns) {
  return new Set(activeCheckInsForHabit(habit, checkIns)
    .filter((checkIn) => (
      isHabitCheckInComplete(checkIn) &&
      isHabitScheduledOnDate(habit, checkIn.localDate, { respectStatus: false, respectDeleted: false })
    ))
    .map((checkIn) => checkIn.localDate));
}

function commonCompletionCounts(habit, checkIns, asOfLocalDate) {
  const completedDates = completedDateSet(habit, checkIns);
  const yearPrefix = String(asOfLocalDate || "").slice(0, 4);
  const monthPrefix = String(asOfLocalDate || "").slice(0, 7);
  let yearCompletedCount = 0;
  let monthCompletedCount = 0;
  for (const localDate of completedDates) {
    if (localDate.startsWith(yearPrefix)) yearCompletedCount += 1;
    if (localDate.startsWith(monthPrefix)) monthCompletedCount += 1;
  }
  return {
    completedDates,
    monthCompletedCount,
    totalCompletedCount: completedDates.size,
    yearCompletedCount,
  };
}

function monthlyCompletionRate(habit, completedDates, asOfLocalDate) {
  const month = String(asOfLocalDate || "").slice(0, 7);
  if (!/^\d{4}-\d{2}$/.test(month)) return 0;
  const monthStart = `${month}-01`;
  const nextMonthProbe = new Date(`${monthStart}T12:00:00`);
  nextMonthProbe.setMonth(nextMonthProbe.getMonth() + 1, 0);
  const monthEnd = localDateFromInstant(nextMonthProbe);
  const start = laterLocalDate(monthStart, habit.startDate);
  const end = earlierLocalDate(monthEnd, earlierLocalDate(asOfLocalDate, habit.endDate));
  if (!start || !end || end.localeCompare(start) < 0) return 0;
  const scheduledDates = localDateRange(start, end)
    .filter((date) => isHabitScheduledOnDate(habit, date, { respectStatus: false, respectDeleted: false }));
  if (!scheduledDates.length) return 0;
  const completed = scheduledDates.filter((date) => completedDates.has(date)).length;
  return completed / scheduledDates.length;
}

function computeDailyHabitStats(habit, checkIns, options = {}) {
  const horizon = statisticsHorizon(habit, options);
  const counts = commonCompletionCounts(habit, checkIns, horizon.asOfLocalDate);
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  let scheduledDayCount = 0;
  if (horizon.startDate && horizon.endDate) {
    for (const localDate of localDateRange(horizon.startDate, horizon.endDate)) {
      if (!isHabitScheduledOnDate(habit, localDate, { respectStatus: false, respectDeleted: false })) continue;
      scheduledDayCount += 1;
      if (counts.completedDates.has(localDate)) {
        run += 1;
        longestStreak = Math.max(longestStreak, run);
      } else {
        run = 0;
      }
    }
    currentStreak = run;
  }
  return {
    habitId: habit.id,
    streakUnit: "day",
    currentStreak,
    longestStreak,
    currentStreakDays: currentStreak,
    longestStreakDays: longestStreak,
    currentStreakWeeks: null,
    longestStreakWeeks: null,
    currentWeekCompleted: null,
    weeklyTarget: null,
    scheduledDayCount,
    monthCompletedCount: counts.monthCompletedCount,
    yearCompletedCount: counts.yearCompletedCount,
    totalCompletedCount: counts.totalCompletedCount,
    monthCompletionRate: monthlyCompletionRate(habit, counts.completedDates, horizon.asOfLocalDate),
    asOfLocalDate: horizon.asOfLocalDate,
  };
}

function weekRecords(habit, completedDates, startDate, endDate) {
  if (!startDate || !endDate) return [];
  const firstWeek = startOfLocalWeek(startDate);
  const lastWeek = startOfLocalWeek(endDate);
  const records = [];
  for (let weekStart = firstWeek; weekStart && weekStart.localeCompare(lastWeek) <= 0; weekStart = addLocalDays(weekStart, 7)) {
    const weekEnd = addLocalDays(weekStart, 6);
    const rangeStart = laterLocalDate(weekStart, habit.startDate);
    const rangeEnd = earlierLocalDate(weekEnd, earlierLocalDate(endDate, habit.endDate));
    const count = rangeStart && rangeEnd && rangeEnd.localeCompare(rangeStart) >= 0
      ? localDateRange(rangeStart, rangeEnd).filter((date) => completedDates.has(date)).length
      : 0;
    records.push({
      weekStart,
      weekEnd,
      completedCount: count,
      achieved: count >= habit.weeklyTarget,
    });
  }
  return records;
}

function computeWeeklyTargetStats(habit, checkIns, options = {}) {
  const horizon = statisticsHorizon(habit, options);
  const counts = commonCompletionCounts(habit, checkIns, horizon.asOfLocalDate);
  const weeks = weekRecords(habit, counts.completedDates, horizon.startDate, horizon.endDate);
  const currentWeekStart = startOfLocalWeek(horizon.asOfLocalDate);
  let longestStreak = 0;
  let run = 0;
  for (const week of weeks) {
    const incompleteCurrentWeek = week.weekStart === currentWeekStart && !week.achieved;
    if (incompleteCurrentWeek) continue;
    if (week.achieved) {
      run += 1;
      longestStreak = Math.max(longestStreak, run);
    } else {
      run = 0;
    }
  }
  let index = weeks.length - 1;
  if (index >= 0 && weeks[index].weekStart === currentWeekStart && !weeks[index].achieved) index -= 1;
  let currentStreak = 0;
  while (index >= 0 && weeks[index].achieved) {
    currentStreak += 1;
    index -= 1;
  }
  const currentWeek = weeks.find((week) => week.weekStart === currentWeekStart);
  return {
    habitId: habit.id,
    streakUnit: "week",
    currentStreak,
    longestStreak,
    currentStreakDays: null,
    longestStreakDays: null,
    currentStreakWeeks: currentStreak,
    longestStreakWeeks: longestStreak,
    currentWeekCompleted: currentWeek?.completedCount || 0,
    weeklyTarget: habit.weeklyTarget,
    achievedWeekCount: weeks.filter((week) => week.achieved).length,
    scheduledDayCount: null,
    monthCompletedCount: counts.monthCompletedCount,
    yearCompletedCount: counts.yearCompletedCount,
    totalCompletedCount: counts.totalCompletedCount,
    monthCompletionRate: monthlyCompletionRate(habit, counts.completedDates, horizon.asOfLocalDate),
    asOfLocalDate: horizon.asOfLocalDate,
    weeks,
  };
}

function computeHabitStats(habit, checkIns, options = {}) {
  if (!habit?.id) throw new Error("缺少长期目标");
  return habit.frequencyType === "weeklyTarget"
    ? computeWeeklyTargetStats(habit, checkIns, options)
    : computeDailyHabitStats(habit, checkIns, options);
}

function heatmapIntensity(checkIn, options = {}) {
  if (!checkIn) return 0;
  if (checkIn.state === "skipped") return 0;
  const targetValue = Number(options.dailyTargetValue);
  const value = Number(checkIn.value);
  if (Number.isFinite(targetValue) && targetValue > 0 && Number.isFinite(value)) {
    const ratio = Math.max(0, Math.min(1, value / targetValue));
    return checkIn.state === "completed" ? Math.max(0.75, ratio) : Math.min(0.7, ratio);
  }
  return checkIn.state === "completed" ? 1 : 0.35;
}

function buildHabitHeatmap(habit, checkIns, year, options = {}) {
  if (!habit?.id) throw new Error("缺少长期目标");
  const selectedYear = Number(year);
  if (!Number.isInteger(selectedYear) || selectedYear < 1 || selectedYear > 9999) throw new Error("热力图年份无效");
  const start = `${String(selectedYear).padStart(4, "0")}-01-01`;
  const end = `${String(selectedYear).padStart(4, "0")}-12-31`;
  const byDate = new Map(activeCheckInsForHabit(habit, checkIns)
    .filter((checkIn) => checkIn.localDate.startsWith(`${String(selectedYear).padStart(4, "0")}-`))
    .map((checkIn) => [checkIn.localDate, checkIn]));
  const days = localDateRange(start, end, 366).map((localDate) => {
    const checkIn = byDate.get(localDate) || null;
    return {
      localDate,
      weekday: ((new Date(`${localDate}T12:00:00`).getDay() || 7)),
      scheduled: isHabitScheduledOnDate(habit, localDate, { respectStatus: false, respectDeleted: false }),
      state: checkIn?.state || "none",
      value: checkIn?.value ?? null,
      intensity: heatmapIntensity(checkIn, options),
      marker: checkIn?.state === "skipped" ? "skipped" : null,
      checkInId: checkIn?.id || null,
    };
  });
  const completed = days.filter((day) => day.state === "completed").length;
  const partial = days.filter((day) => day.state === "partial").length;
  const skipped = days.filter((day) => day.state === "skipped").length;
  return {
    habitId: habit.id,
    year: selectedYear,
    days,
    summary: {
      completed,
      partial,
      skipped,
      scheduled: days.filter((day) => day.scheduled).length,
    },
  };
}

module.exports = {
  activeCheckInsForHabit,
  buildHabitHeatmap,
  computeDailyHabitStats,
  computeHabitStats,
  computeWeeklyTargetStats,
  statisticsHorizon,
};
