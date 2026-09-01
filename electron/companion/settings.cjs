function clamp(value, minimum, maximum, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(minimum, Math.min(maximum, Math.round(number))) : fallback;
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function normalizeCompanionSettings(value = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const wellness = input.wellness && typeof input.wellness === "object" ? input.wellness : {};
  const weather = input.weather && typeof input.weather === "object" ? input.weather : {};
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
  };
}

module.exports = { normalizeCompanionRuntimeState, normalizeCompanionSettings, syncableCompanionSettings };
