function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, Math.round(number))) : fallback;
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function finiteNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}
const { clampTurns, normalizeConversationMemory } = require("./memory-model.cjs");

function normalizeWeatherCache(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const snapshot = input.snapshot && typeof input.snapshot === "object" && !Array.isArray(input.snapshot)
    ? input.snapshot
    : null;
  const expiresAt = isoOrNull(input.expiresAt);
  const city = String(snapshot?.city || "").trim().slice(0, 120);
  const fetchedAt = isoOrNull(snapshot?.fetchedAt);
  if (!snapshot || !expiresAt || !city || !fetchedAt) return null;
  const nextHours = (Array.isArray(snapshot.nextHours) ? snapshot.nextHours : []).flatMap((candidate) => {
    const time = isoOrNull(candidate?.time);
    if (!time) return [];
    return [{
      time,
      temperature: finiteNumberOrNull(candidate.temperature),
      precipitationProbability: finiteNumberOrNull(candidate.precipitationProbability),
    }];
  }).slice(0, 6);
  return {
    expiresAt,
    snapshot: {
      city,
      country: String(snapshot.country || "").trim().slice(0, 120),
      timezone: String(snapshot.timezone || "").trim().slice(0, 120),
      condition: String(snapshot.condition || "").trim().slice(0, 120),
      weatherCode: finiteNumberOrNull(snapshot.weatherCode),
      temperature: finiteNumberOrNull(snapshot.temperature),
      apparentTemperature: finiteNumberOrNull(snapshot.apparentTemperature),
      windSpeed: finiteNumberOrNull(snapshot.windSpeed),
      todayHigh: finiteNumberOrNull(snapshot.todayHigh),
      todayLow: finiteNumberOrNull(snapshot.todayLow),
      todayDate: String(snapshot.todayDate || "").slice(0, 10),
      todayCondition: String(snapshot.todayCondition || "").trim().slice(0, 120),
      todayRainProbability: finiteNumberOrNull(snapshot.todayRainProbability),
      tomorrowDate: String(snapshot.tomorrowDate || "").slice(0, 10),
      tomorrowHigh: finiteNumberOrNull(snapshot.tomorrowHigh),
      tomorrowLow: finiteNumberOrNull(snapshot.tomorrowLow),
      tomorrowCondition: String(snapshot.tomorrowCondition || "").trim().slice(0, 120),
      tomorrowRainProbability: finiteNumberOrNull(snapshot.tomorrowRainProbability),
      nextHours,
      fetchedAt,
    },
  };
}

function normalizeCompanionSettings(value = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const wellness = input.wellness && typeof input.wellness === "object" ? input.wellness : {};
  const weather = input.weather && typeof input.weather === "object" ? input.weather : {};
  const memory = input.memory && typeof input.memory === "object" ? input.memory : {};
  return {
    enabled: input.enabled === true,
    onboardingSeen: input.onboardingSeen === true,
    focusDockSeconds: clamp(input.focusDockSeconds, 20, 60, 30),
    idleThresholdSeconds: clamp(input.idleThresholdSeconds, 60, 600, 120),
    quietHours: {
      enabled: input.quietHours?.enabled === true,
      start: /^([01]\d|2[0-3]):[0-5]\d$/.test(input.quietHours?.start) ? input.quietHours.start : "22:00",
      end: /^([01]\d|2[0-3]):[0-5]\d$/.test(input.quietHours?.end) ? input.quietHours.end : "07:00",
    },
    silentSites: Array.from(new Set((Array.isArray(input.silentSites) ? input.silentSites : []).map((item) => String(item || "").trim().toLowerCase()).filter(Boolean))).slice(0, 200),
    wellness: {
      enabled: wellness.enabled !== false,
      kinds: {
        "eye-rest": wellness.kinds?.["eye-rest"] !== false,
        water: wellness.kinds?.water !== false,
        movement: wellness.kinds?.movement !== false,
      },
      intervalsMinutes: {
        "eye-rest": clamp(wellness.intervalsMinutes?.["eye-rest"], 5, 240, 20),
        water: clamp(wellness.intervalsMinutes?.water, 5, 240, 45),
        movement: clamp(wellness.intervalsMinutes?.movement, 5, 240, 60),
      },
      cooldownMinutes: clamp(wellness.cooldownMinutes, 5, 240, 30),
    },
    weather: {
      enabled: weather.enabled === true,
      city: String(weather.city || "").trim().slice(0, 120),
      locationMode: weather.locationMode === "auto" ? "auto" : "manual",
      pollMinutes: clamp(weather.pollMinutes, 10, 180, 30),
    },
    memory: {
      enabled: memory.enabled !== false,
      syncEnabled: memory.syncEnabled !== false,
      maxTurns: clampTurns(memory.maxTurns),
      autoCapture: memory.autoCapture !== false,
    },
  };
}

function normalizeCompanionRuntimeState(value = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const timestamps = (candidate) => Object.fromEntries(Object.entries(candidate && typeof candidate === "object" ? candidate : {}).flatMap(([key, timestamp]) => {
    const normalized = isoOrNull(timestamp);
    return normalized && ["eye-rest", "water", "movement"].includes(key) ? [[key, normalized]] : [];
  }));
  return {
    pausedUntil: isoOrNull(input.pausedUntil),
    dismissedUntil: isoOrNull(input.dismissedUntil),
    snoozedUntil: timestamps(input.snoozedUntil),
    lastShownAt: timestamps(input.lastShownAt),
    acknowledgedAt: timestamps(input.acknowledgedAt),
    aiAllowedHosts: Array.from(new Set((Array.isArray(input.aiAllowedHosts) ? input.aiAllowedHosts : []).map((item) => String(item || "").trim().toLowerCase()).filter(Boolean))).slice(0, 200),
    weatherCache: normalizeWeatherCache(input.weatherCache),
  };
}

function syncableCompanionSettings(value = {}) {
  const settings = normalizeCompanionSettings(value);
  return {
    enabled: settings.enabled,
    focusDockSeconds: settings.focusDockSeconds,
    idleThresholdSeconds: settings.idleThresholdSeconds,
    quietHours: settings.quietHours,
    wellness: settings.wellness,
    weather: { enabled: settings.weather.enabled, pollMinutes: settings.weather.pollMinutes },
    memory: settings.memory,
  };
}

module.exports = {
  normalizeCompanionRuntimeState,
  normalizeCompanionSettings,
  normalizeConversationMemory,
  normalizeWeatherCache,
  syncableCompanionSettings,
};
