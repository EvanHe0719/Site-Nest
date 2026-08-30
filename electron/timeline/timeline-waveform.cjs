const DAY_MS = 86_400_000;

function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function eventMagnitude(event) {
  const level = clamp(Math.trunc(Number(event?.impactLevel) || 1), 1, 5);
  if (event?.impactDirection === "positive") return level;
  if (event?.impactDirection === "negative") return -level;
  return 0;
}

function dateParts(value) {
  const match = String(value || "").match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2] || 1),
    day: Number(match[3] || 1),
  };
}

function annualPosition(event, year) {
  const parts = dateParts(event?.startDate);
  if (!parts) return 0;
  if (parts.year < year) return 0;
  if (parts.year > year) return 1;
  const total = daysInMonth(year, parts.month);
  return clamp(((parts.month - 1) + (parts.day - 1) / total) / 12, 0, 1);
}

function monthlyPosition(event, year, month) {
  const parts = dateParts(event?.startDate);
  if (!parts) return 0;
  const total = daysInMonth(year, month);
  if (parts.year < year || (parts.year === year && parts.month < month)) return 0;
  if (parts.year > year || (parts.year === year && parts.month > month)) return 1;
  return clamp((parts.day - 1) / Math.max(1, total - 1), 0, 1);
}

function eventEndPosition(event, year, month = null) {
  if (event?.ongoing) return 1;
  const end = dateParts(event?.endDate);
  if (!end) return null;
  if (month) {
    const total = daysInMonth(year, month);
    if (end.year < year || (end.year === year && end.month < month)) return 0;
    if (end.year > year || (end.year === year && end.month > month)) return 1;
    return clamp((end.day - 1) / Math.max(1, total - 1), 0, 1);
  }
  if (end.year < year) return 0;
  if (end.year > year) return 1;
  const total = daysInMonth(year, end.month);
  return clamp(((end.month - 1) + (end.day - 1) / total) / 12, 0, 1);
}

function clusterKey(event, scope) {
  const parts = dateParts(event?.startDate);
  if (!parts) return "unknown";
  return scope === "month"
    ? `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`
    : `${parts.year}-${String(parts.month).padStart(2, "0")}`;
}

function buildTimelineWaveform(events, options = {}) {
  const year = Number(options.year) || new Date().getFullYear();
  const month = Number(options.month);
  const scope = options.scope === "month" && month >= 1 && month <= 12 ? "month" : "year";
  const trackId = options.trackId === "work" ? "work" : "personal";
  const filtered = (Array.isArray(events) ? events : [])
    .filter((event) => !event.deletedAt && event.trackId === trackId)
    .filter((event) => {
      const start = dateParts(event.startDate);
      const end = dateParts(event.endDate);
      if (!start) return false;
      if (scope === "year") {
        return start.year === year || (start.year < year && (event.ongoing || (end && end.year >= year)));
      }
      const beforeOrDuring = start.year < year || (start.year === year && start.month <= month);
      const endsAfter = event.ongoing || !end || end.year > year || (end.year === year && end.month >= month);
      return beforeOrDuring && (start.year === year && start.month === month || (event.endDate || event.ongoing) && endsAfter);
    });
  const sampleCount = scope === "month" ? Math.max(28, daysInMonth(year, month)) * 4 : 12 * 12;
  const values = Array.from({ length: sampleCount + 1 }, () => 0);
  const clusters = new Map();
  for (const event of filtered) {
    const position = scope === "month"
      ? monthlyPosition(event, year, month)
      : annualPosition(event, year);
    const endPosition = eventEndPosition(event, year, scope === "month" ? month : null);
    const magnitude = eventMagnitude(event);
    const startIndex = Math.round(position * sampleCount);
    if ((event.ongoing || event.endDate) && endPosition !== null && endPosition > position) {
      const endIndex = Math.max(startIndex, Math.round(endPosition * sampleCount));
      const ramp = Math.max(1, Math.round(sampleCount * (scope === "month" ? 0.025 : 0.012)));
      for (let index = Math.max(0, startIndex - ramp); index <= Math.min(sampleCount, endIndex + ramp); index += 1) {
        const enter = clamp((index - (startIndex - ramp)) / ramp, 0, 1);
        const leave = clamp(((endIndex + ramp) - index) / ramp, 0, 1);
        values[index] += magnitude * Math.min(enter, leave);
      }
    } else {
      const radius = Math.max(2, Math.round(sampleCount * (scope === "month" ? 0.035 : 0.018)));
      for (let offset = -radius; offset <= radius; offset += 1) {
        const index = startIndex + offset;
        if (index < 0 || index > sampleCount) continue;
        const weight = 1 - Math.abs(offset) / radius;
        values[index] += magnitude * weight;
      }
    }
    const key = clusterKey(event, scope);
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(event);
  }
  const samples = values.map((value, index) => ({
    position: index / sampleCount,
    value: clamp(value, -5, 5),
  }));
  return {
    scope,
    year,
    month: scope === "month" ? month : null,
    trackId,
    samples,
    clusters: Array.from(clusters.entries()).map(([key, items]) => ({
      key,
      position: scope === "month"
        ? monthlyPosition(items[0], year, month)
        : annualPosition(items[0], year),
      value: eventMagnitude(items.slice().sort((left, right) => Number(right.impactLevel) - Number(left.impactLevel))[0]),
      events: items.slice().sort((left, right) => left.startDate.localeCompare(right.startDate)),
    })),
  };
}

module.exports = {
  annualPosition,
  buildTimelineWaveform,
  clusterKey,
  daysInMonth,
  eventMagnitude,
  monthlyPosition,
};
