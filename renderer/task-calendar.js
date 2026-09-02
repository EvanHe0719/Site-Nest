(function initTaskCalendar(globalScope, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (globalScope) globalScope.QiyeTaskCalendar = api;
}(typeof globalThis !== "undefined" ? globalThis : this, () => {
  const DAY_MS = 86_400_000;
  const DEFAULT_COLOR = "#23a783";
  const VALID_FREQUENCIES = new Set([
    "none",
    "daily",
    "weekly",
    "weekdays",
    "monthly-date",
    "monthly-weekday",
    "yearly",
    "custom",
  ]);

  function asDate(value) {
    const date = value instanceof Date ? new Date(value.valueOf()) : new Date(value);
    return Number.isNaN(date.valueOf()) ? null : date;
  }

  function startOfDay(value) {
    const date = asDate(value) || new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function endOfDay(value) {
    const date = startOfDay(value);
    date.setHours(23, 59, 59, 999);
    return date;
  }

  function addDays(value, amount) {
    const date = asDate(value) || new Date();
    date.setDate(date.getDate() + Number(amount || 0));
    return date;
  }

  function localDateKey(value) {
    const date = asDate(value);
    if (!date) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function dayNumber(value) {
    const date = startOfDay(value);
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS);
  }

  function daysBetween(left, right) {
    return dayNumber(right) - dayNumber(left);
  }

  function mondayIndex(value) {
    const day = (asDate(value) || new Date()).getDay();
    return day === 0 ? 7 : day;
  }

  function startOfWeek(value) {
    return addDays(startOfDay(value), 1 - mondayIndex(value));
  }

  function normalizeColor(value, fallback = DEFAULT_COLOR) {
    const candidate = String(value || "").trim().toLowerCase();
    return /^#[0-9a-f]{6}$/.test(candidate) ? candidate : fallback;
  }

  function normalizeWeekdays(value) {
    return Array.from(new Set((Array.isArray(value) ? value : [])
      .map(Number)
      .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7)))
      .sort((left, right) => left - right)
      .slice(0, 7);
  }

  function normalizeRecurrence(value = {}) {
    const input = value && typeof value === "object" ? value : {};
    const frequency = VALID_FREQUENCIES.has(input.frequency) ? input.frequency : "none";
    const interval = Math.min(365, Math.max(1, Math.round(Number(input.interval) || 1)));
    const customUnit = ["day", "week", "month"].includes(input.customUnit) ? input.customUnit : "week";
    const until = input.until ? asDate(input.until)?.toISOString() || null : null;
    return {
      frequency,
      interval,
      weekdays: normalizeWeekdays(input.weekdays),
      customUnit,
      until,
    };
  }

  function taskInterval(task = {}) {
    const start = asDate(task.startAt || task.dueAt || task.createdAt);
    if (!start) return null;
    const endCandidate = asDate(task.dueAt || task.startAt || task.createdAt) || start;
    const end = endCandidate < start ? new Date(start) : endCandidate;
    return { start, end };
  }

  function monthDifference(left, right) {
    return (right.getFullYear() - left.getFullYear()) * 12 + right.getMonth() - left.getMonth();
  }

  function sameMonthlyWeekday(base, candidate) {
    if (mondayIndex(base) !== mondayIndex(candidate)) return false;
    const baseOrdinal = Math.floor((base.getDate() - 1) / 7);
    const candidateOrdinal = Math.floor((candidate.getDate() - 1) / 7);
    return baseOrdinal === candidateOrdinal;
  }

  function recurrenceMatchesDay(baseStart, candidate, recurrence) {
    const diff = daysBetween(baseStart, candidate);
    if (diff < 0) return false;
    const weekDiff = Math.floor(daysBetween(startOfWeek(baseStart), startOfWeek(candidate)) / 7);
    const monthDiff = monthDifference(baseStart, candidate);
    const weekdays = recurrence.weekdays.length ? recurrence.weekdays : [mondayIndex(baseStart)];
    if (recurrence.frequency === "daily") return diff % recurrence.interval === 0;
    if (recurrence.frequency === "weekdays") return mondayIndex(candidate) <= 5 && weekDiff % recurrence.interval === 0;
    if (recurrence.frequency === "weekly") return weekdays.includes(mondayIndex(candidate)) && weekDiff % recurrence.interval === 0;
    if (recurrence.frequency === "monthly-date") return candidate.getDate() === baseStart.getDate() && monthDiff % recurrence.interval === 0;
    if (recurrence.frequency === "monthly-weekday") return sameMonthlyWeekday(baseStart, candidate) && monthDiff % recurrence.interval === 0;
    if (recurrence.frequency === "yearly") {
      return candidate.getMonth() === baseStart.getMonth()
        && candidate.getDate() === baseStart.getDate()
        && (candidate.getFullYear() - baseStart.getFullYear()) % recurrence.interval === 0;
    }
    if (recurrence.frequency === "custom") {
      if (recurrence.customUnit === "day") return diff % recurrence.interval === 0;
      if (recurrence.customUnit === "month") return candidate.getDate() === baseStart.getDate() && monthDiff % recurrence.interval === 0;
      return weekdays.includes(mondayIndex(candidate)) && weekDiff % recurrence.interval === 0;
    }
    return diff === 0;
  }

  function occurrenceAt(task, baseInterval, startDay, index) {
    const start = new Date(startDay);
    start.setHours(
      baseInterval.start.getHours(),
      baseInterval.start.getMinutes(),
      baseInterval.start.getSeconds(),
      baseInterval.start.getMilliseconds(),
    );
    const duration = Math.max(0, baseInterval.end.valueOf() - baseInterval.start.valueOf());
    const end = new Date(start.valueOf() + duration);
    return {
      task,
      start,
      end,
      startKey: localDateKey(start),
      endKey: localDateKey(end),
      occurrenceKey: `${task.id || "schedule"}:${localDateKey(start)}:${index}`,
    };
  }

  function expandOccurrences(tasks, rangeStart, rangeEnd, options = {}) {
    const windowStart = startOfDay(rangeStart);
    const windowEnd = endOfDay(rangeEnd);
    const maximum = Math.max(1, Number(options.limit) || 20_000);
    const result = [];
    for (const task of Array.isArray(tasks) ? tasks : []) {
      if (!task || task.status === "cancelled") continue;
      const interval = taskInterval(task);
      if (!interval) continue;
      const recurrence = normalizeRecurrence(task.recurrence);
      if (recurrence.frequency === "none") {
        if (interval.end >= windowStart && interval.start <= windowEnd) result.push(occurrenceAt(task, interval, interval.start, 0));
        continue;
      }
      const durationDays = Math.max(0, daysBetween(interval.start, interval.end));
      const scanStart = new Date(Math.max(startOfDay(interval.start).valueOf(), addDays(windowStart, -durationDays - 7).valueOf()));
      const untilEnd = recurrence.until ? endOfDay(recurrence.until) : null;
      let index = 0;
      for (let cursor = scanStart; cursor <= windowEnd && result.length < maximum; cursor = addDays(cursor, 1)) {
        if (untilEnd && cursor > untilEnd) break;
        if (!recurrenceMatchesDay(interval.start, cursor, recurrence)) continue;
        const occurrence = occurrenceAt(task, interval, cursor, index++);
        if (occurrence.end >= windowStart && occurrence.start <= windowEnd) result.push(occurrence);
      }
      if (result.length >= maximum) break;
    }
    return result.sort((left, right) => left.start - right.start || left.end - right.end || String(left.task.title).localeCompare(String(right.task.title), "zh-CN"));
  }

  function occurrencesForWeek(tasks, weekAnchor) {
    const weekStart = startOfWeek(weekAnchor);
    const weekEnd = endOfDay(addDays(weekStart, 6));
    const entriesByDay = new Map(Array.from({ length: 7 }, (_, index) => [localDateKey(addDays(weekStart, index)), []]));
    for (const occurrence of expandOccurrences(tasks, weekStart, weekEnd)) {
      const first = startOfDay(occurrence.start < weekStart ? weekStart : occurrence.start);
      const last = startOfDay(occurrence.end > weekEnd ? weekEnd : occurrence.end);
      for (let cursor = first; cursor <= last; cursor = addDays(cursor, 1)) {
        const key = localDateKey(cursor);
        entriesByDay.get(key)?.push({ ...occurrence, dayKey: key });
      }
    }
    return { weekStart, weekEnd, entriesByDay };
  }

  function monthGrid(value) {
    const anchor = asDate(value) || new Date();
    const monthStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const monthEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    const gridStart = startOfWeek(monthStart);
    const gridEnd = addDays(startOfWeek(monthEnd), 6);
    const totalDays = daysBetween(gridStart, gridEnd) + 1;
    const days = Array.from({ length: totalDays }, (_, index) => {
      const date = addDays(gridStart, index);
      return { date, key: localDateKey(date), inMonth: date.getMonth() === anchor.getMonth(), row: Math.floor(index / 7), column: index % 7 };
    });
    return { monthStart, monthEnd, gridStart, gridEnd, days, rowCount: Math.ceil(totalDays / 7) };
  }

  function assignSegmentLanes(segments) {
    const laneEnds = new Map();
    return segments
      .sort((left, right) => left.row - right.row || left.startColumn - right.startColumn || right.span - left.span || left.occurrence.start - right.occurrence.start)
      .map((segment) => {
        let lane = 0;
        while ((laneEnds.get(`${segment.row}:${lane}`) ?? -1) >= segment.startColumn) lane += 1;
        laneEnds.set(`${segment.row}:${lane}`, segment.endColumn);
        return { ...segment, lane };
      });
  }

  function monthSegments(tasks, monthAnchor) {
    const grid = monthGrid(monthAnchor);
    const rawSegments = [];
    for (const occurrence of expandOccurrences(tasks, grid.gridStart, grid.gridEnd)) {
      const clippedStart = startOfDay(occurrence.start < grid.gridStart ? grid.gridStart : occurrence.start);
      const clippedEnd = startOfDay(occurrence.end > grid.gridEnd ? grid.gridEnd : occurrence.end);
      let startIndex = daysBetween(grid.gridStart, clippedStart);
      const endIndex = daysBetween(grid.gridStart, clippedEnd);
      while (startIndex <= endIndex) {
        const row = Math.floor(startIndex / 7);
        const rowEndIndex = Math.min(endIndex, row * 7 + 6);
        rawSegments.push({
          occurrence,
          row,
          startColumn: startIndex % 7,
          endColumn: rowEndIndex % 7,
          span: rowEndIndex - startIndex + 1,
          continuesBefore: startIndex > daysBetween(grid.gridStart, startOfDay(occurrence.start)),
          continuesAfter: rowEndIndex < daysBetween(grid.gridStart, startOfDay(occurrence.end)),
        });
        startIndex = rowEndIndex + 1;
      }
    }
    const segments = assignSegmentLanes(rawSegments);
    const rowLanes = Array.from({ length: grid.rowCount }, (_, row) => Math.max(0, ...segments.filter((segment) => segment.row === row).map((segment) => segment.lane + 1)));
    return { ...grid, segments, rowLanes };
  }

  return {
    DEFAULT_COLOR,
    VALID_FREQUENCIES,
    addDays,
    expandOccurrences,
    localDateKey,
    monthGrid,
    monthSegments,
    normalizeColor,
    normalizeRecurrence,
    occurrencesForWeek,
    startOfDay,
    startOfWeek,
    taskInterval,
  };
}));
