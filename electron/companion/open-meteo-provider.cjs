const WEATHER_LABELS = Object.freeze({
  0: "晴朗", 1: "大致晴朗", 2: "局部多云", 3: "阴天", 45: "有雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "较强毛毛雨", 56: "轻微冻雨", 57: "冻雨",
  61: "小雨", 63: "中雨", 65: "大雨", 66: "轻微冻雨", 67: "强冻雨",
  71: "小雪", 73: "中雪", 75: "大雪", 77: "霰", 80: "小阵雨", 81: "阵雨", 82: "强阵雨",
  85: "小阵雪", 86: "强阵雪", 95: "雷雨", 96: "雷雨伴小冰雹", 99: "雷雨伴冰雹",
});

class WeatherProviderError extends Error {
  constructor(code, message, options = {}) {
    super(message, options);
    this.name = "WeatherProviderError";
    this.code = code;
  }
}

function finite(value, fallback = null) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function weatherLabel(code) {
  return WEATHER_LABELS[Number(code)] || "天气状况未知";
}

function hourlyWindow(hourly = {}, currentTime, count = 2) {
  const times = Array.isArray(hourly.time) ? hourly.time : [];
  const start = Math.max(0, times.findIndex((time) => String(time) >= String(currentTime || "")));
  return times.slice(start, start + count).map((time, offset) => ({
    time,
    precipitationProbability: finite(hourly.precipitation_probability?.[start + offset], 0),
    temperature: finite(hourly.temperature_2m?.[start + offset]),
  }));
}

function normalizeForecast(payload, location, now = new Date()) {
  if (!payload || typeof payload !== "object" || !payload.current || !payload.daily) {
    throw new WeatherProviderError("WEATHER_INVALID_RESPONSE", "天气服务返回的数据不完整");
  }
  const current = payload.current;
  const daily = payload.daily;
  return {
    providerId: "open-meteo",
    city: String(location.name || "").slice(0, 120),
    country: String(location.country || "").slice(0, 120),
    timezone: String(payload.timezone || location.timezone || "auto").slice(0, 100),
    observedAt: String(current.time || now.toISOString()),
    fetchedAt: now.toISOString(),
    temperature: finite(current.temperature_2m),
    apparentTemperature: finite(current.apparent_temperature),
    weatherCode: finite(current.weather_code),
    condition: weatherLabel(current.weather_code),
    windSpeed: finite(current.wind_speed_10m, 0),
    todayHigh: finite(daily.temperature_2m_max?.[0]),
    todayLow: finite(daily.temperature_2m_min?.[0]),
    nextHours: hourlyWindow(payload.hourly, current.time, 2),
    stale: false,
  };
}

class OpenMeteoWeatherProvider {
  constructor(options = {}) {
    if (typeof options.fetchFn !== "function") throw new TypeError("fetchFn is required");
    this.id = "open-meteo";
    this.fetchFn = options.fetchFn;
    this.geocodingBaseUrl = options.geocodingBaseUrl || "https://geocoding-api.open-meteo.com/v1/search";
    this.forecastBaseUrl = options.forecastBaseUrl || "https://api.open-meteo.com/v1/forecast";
  }

  async requestJson(url, signal) {
    const controller = new AbortController();
    let timedOut = false;
    const forwardAbort = () => controller.abort();
    if (signal?.aborted) controller.abort();
    else signal?.addEventListener("abort", forwardAbort, { once: true });
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 15_000);
    timeout.unref?.();
    try {
      const response = await this.fetchFn(url, { signal: controller.signal, headers: { accept: "application/json" } });
      if (!response.ok) throw new WeatherProviderError(response.status === 429 ? "WEATHER_RATE_LIMITED" : response.status >= 500 ? "WEATHER_NETWORK_ERROR" : "WEATHER_INVALID_RESPONSE", `天气服务请求失败（HTTP ${response.status}）`);
      try { return await response.json(); }
      catch (error) { throw new WeatherProviderError("WEATHER_INVALID_RESPONSE", "天气服务返回了无法解析的数据", { cause: error }); }
    } catch (error) {
      if (error instanceof WeatherProviderError) throw error;
      if (timedOut) throw new WeatherProviderError("WEATHER_TIMEOUT", "天气服务响应超时，请稍后重试");
      if (signal?.aborted) throw new WeatherProviderError("CANCELLED", "天气请求已取消");
      throw new WeatherProviderError("WEATHER_NETWORK_ERROR", "无法连接天气服务", { cause: error });
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener?.("abort", forwardAbort);
    }
  }

  async resolveCity(city, signal) {
    const name = String(city || "").trim();
    if (name.length < 2) throw new WeatherProviderError("WEATHER_NOT_CONFIGURED", "请先设置至少两个字的城市名称");
    const url = new URL(this.geocodingBaseUrl);
    url.searchParams.set("name", name);
    url.searchParams.set("count", "1");
    url.searchParams.set("language", "zh");
    url.searchParams.set("format", "json");
    const payload = await this.requestJson(url, signal);
    const result = payload?.results?.[0];
    if (!result || finite(result.latitude) === null || finite(result.longitude) === null) {
      throw new WeatherProviderError("WEATHER_LOCATION_NOT_FOUND", "没有找到这个城市，请补充省份或国家后重试");
    }
    return { name: result.name, country: result.country, timezone: result.timezone, latitude: finite(result.latitude), longitude: finite(result.longitude) };
  }

  async getForecast(location, signal) {
    const url = new URL(this.forecastBaseUrl);
    url.searchParams.set("latitude", String(location.latitude));
    url.searchParams.set("longitude", String(location.longitude));
    url.searchParams.set("current", "temperature_2m,apparent_temperature,weather_code,wind_speed_10m");
    url.searchParams.set("hourly", "temperature_2m,precipitation_probability");
    url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min");
    url.searchParams.set("forecast_days", "2");
    url.searchParams.set("timezone", "auto");
    return normalizeForecast(await this.requestJson(url, signal), location);
  }
}

module.exports = { OpenMeteoWeatherProvider, WEATHER_LABELS, WeatherProviderError, normalizeForecast, weatherLabel };
