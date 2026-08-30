const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function localDateParts(value) {
  const match = String(value || "").match(LOCAL_DATE_PATTERN);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) return null;
  const probe = new Date(0);
  probe.setUTCHours(0, 0, 0, 0);
  probe.setUTCFullYear(year, month - 1, day);
  if (
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) return null;
  return { year, month, day };
}

function normalizeLocalDate(value) {
  const parts = localDateParts(value);
  if (!parts) return null;
  return `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`;
}

function localDateFromInstant(value = new Date()) {
  const existing = normalizeLocalDate(value);
  if (existing) return existing;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function localDateDayNumber(value) {
  const parts = localDateParts(value);
  if (!parts) return null;
  const probe = new Date(0);
  probe.setUTCHours(0, 0, 0, 0);
  probe.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return Math.floor(probe.valueOf() / 86_400_000);
}

function localDateFromDayNumber(value) {
  const dayNumber = Number(value);
  if (!Number.isInteger(dayNumber)) return null;
  const date = new Date(dayNumber * 86_400_000);
  return [
    String(date.getUTCFullYear()).padStart(4, "0"),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function addLocalDays(value, amount) {
  const dayNumber = localDateDayNumber(value);
  const delta = Number(amount);
  if (dayNumber === null || !Number.isInteger(delta)) return null;
  return localDateFromDayNumber(dayNumber + delta);
}

function compareLocalDates(left, right) {
  const normalizedLeft = normalizeLocalDate(left);
  const normalizedRight = normalizeLocalDate(right);
  if (!normalizedLeft || !normalizedRight) return null;
  return normalizedLeft.localeCompare(normalizedRight);
}

// ISO weekday: Monday = 1, Sunday = 7.
function localWeekday(value) {
  const dayNumber = localDateDayNumber(value);
  if (dayNumber === null) return null;
  const utcDay = new Date(dayNumber * 86_400_000).getUTCDay();
  return utcDay === 0 ? 7 : utcDay;
}

function startOfLocalWeek(value) {
  const weekday = localWeekday(value);
  if (weekday === null) return null;
  return addLocalDays(value, 1 - weekday);
}

function endOfLocalWeek(value) {
  const start = startOfLocalWeek(value);
  return start ? addLocalDays(start, 6) : null;
}

function localDateRange(start, end, limit = 100_000) {
  const first = localDateDayNumber(start);
  const last = localDateDayNumber(end);
  if (first === null || last === null || last < first) return [];
  const count = Math.min(Math.max(0, Number(limit) || 0), last - first + 1);
  return Array.from({ length: count }, (_unused, index) => localDateFromDayNumber(first + index));
}

function earlierLocalDate(left, right) {
  const a = normalizeLocalDate(left);
  const b = normalizeLocalDate(right);
  if (!a) return b;
  if (!b) return a;
  return a.localeCompare(b) <= 0 ? a : b;
}

function laterLocalDate(left, right) {
  const a = normalizeLocalDate(left);
  const b = normalizeLocalDate(right);
  if (!a) return b;
  if (!b) return a;
  return a.localeCompare(b) >= 0 ? a : b;
}

module.exports = {
  LOCAL_DATE_PATTERN,
  addLocalDays,
  compareLocalDates,
  earlierLocalDate,
  endOfLocalWeek,
  laterLocalDate,
  localDateDayNumber,
  localDateFromDayNumber,
  localDateFromInstant,
  localDateParts,
  localDateRange,
  localWeekday,
  normalizeLocalDate,
  startOfLocalWeek,
};
