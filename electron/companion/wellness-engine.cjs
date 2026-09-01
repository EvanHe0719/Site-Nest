const WELLNESS_KINDS = Object.freeze(["eye-rest", "water", "movement"]);
const DEFAULT_INTERVALS = Object.freeze({
  "eye-rest": 20 * 60_000,
  water: 45 * 60_000,
  movement: 60 * 60_000,
});

const DEFAULT_MESSAGES = Object.freeze({
  "eye-rest": "看远处一会儿，让眼睛换个焦点。",
  water: "如果方便，可以喝几口水。",
  movement: "坐得有点久了，要不要起身活动一下？",
});

function normalizeWellnessSettings(value = {}) {
  const intervals = {};
  for (const kind of WELLNESS_KINDS) {
    const minutes = Number(value.intervalsMinutes?.[kind]);
    intervals[kind] = Number.isFinite(minutes) && minutes >= 5
      ? Math.round(minutes * 60_000)
      : DEFAULT_INTERVALS[kind];
  }
  return {
    enabled: value.enabled !== false,
    kinds: Object.fromEntries(WELLNESS_KINDS.map((kind) => [kind, value.kinds?.[kind] !== false])),
    intervals,
    cooldownMs: Math.max(5 * 60_000, Number(value.cooldownMinutes || 30) * 60_000),
  };
}

class WellnessEngine {
  constructor(value = {}, options = {}) {
    this.settings = normalizeWellnessSettings(value);
    this.lastShownAt = new Map();
    this.snoozedUntil = new Map();
    this.acknowledgedAt = new Map();
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
  }

  updateSettings(value) {
    this.settings = normalizeWellnessSettings(value);
  }

  due(activeSince, now = this.now()) {
    if (!this.settings.enabled || !Number.isFinite(activeSince)) return null;
    for (const kind of WELLNESS_KINDS) {
      if (!this.settings.kinds[kind]) continue;
      if (now - activeSince < this.settings.intervals[kind]) continue;
      if ((this.snoozedUntil.get(kind) || 0) > now) continue;
      if (this.lastShownAt.has(kind) && now - this.lastShownAt.get(kind) < this.settings.cooldownMs) continue;
      return { kind, message: DEFAULT_MESSAGES[kind], dueAt: new Date(now).toISOString() };
    }
    return null;
  }

  markShown(kind, at = this.now()) {
    if (WELLNESS_KINDS.includes(kind)) this.lastShownAt.set(kind, at);
  }

  snooze(kind, minutes = 10, at = this.now()) {
    if (!WELLNESS_KINDS.includes(kind)) return false;
    this.snoozedUntil.set(kind, at + Math.max(1, Number(minutes) || 10) * 60_000);
    return true;
  }

  acknowledge(kind, at = this.now()) {
    if (!WELLNESS_KINDS.includes(kind)) return false;
    this.acknowledgedAt.set(kind, at);
    this.markShown(kind, at);
    return true;
  }
}

module.exports = { DEFAULT_INTERVALS, DEFAULT_MESSAGES, WELLNESS_KINDS, WellnessEngine, normalizeWellnessSettings };
