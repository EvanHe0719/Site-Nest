const { OpenMeteoWeatherProvider, WeatherProviderError } = require("./open-meteo-provider.cjs");

class WeatherCache {
  constructor(ttlMs = 30 * 60_000) { this.ttlMs = ttlMs; this.value = null; }
  set(value, at = Date.now()) { this.value = { snapshot: structuredClone(value), expiresAt: at + this.ttlMs }; return this.get(at); }
  get(at = Date.now()) { return this.value ? { ...structuredClone(this.value.snapshot), stale: at >= this.value.expiresAt } : null; }
  clear() { this.value = null; }
}

class WeatherEventDeduplicator {
  constructor(ttlMs = 6 * 60 * 60_000) { this.ttlMs = ttlMs; this.seen = new Map(); }
  accept(event, at = Date.now()) {
    const key = `${event.type}:${event.city}:${event.level || "info"}`;
    const previous = this.seen.get(key);
    if (previous !== undefined && at - previous < this.ttlMs) return false;
    this.seen.set(key, at);
    for (const [candidate, timestamp] of this.seen) if (at - timestamp > this.ttlMs * 2) this.seen.delete(candidate);
    return true;
  }
}

class WeatherAlertEngine {
  compare(previous, current) {
    if (!current) return [];
    const events = [];
    const base = { city: current.city, createdAt: current.fetchedAt };
    const rain = Math.max(...(current.nextHours || []).map((item) => Number(item.precipitationProbability) || 0), 0);
    if (rain >= 50) events.push({ ...base, type: "rain-soon", level: rain >= 80 ? "warning" : "info", message: `未来两小时降雨概率最高 ${rain}%` });
    if (current.windSpeed >= 40) events.push({ ...base, type: "strong-wind", level: "warning", message: `当前风速约 ${Math.round(current.windSpeed)} km/h` });
    if (current.todayHigh >= 35) events.push({ ...base, type: "high-temperature", level: "warning", message: `今日最高温预计 ${Math.round(current.todayHigh)}℃` });
    if (current.todayLow <= 2) events.push({ ...base, type: "low-temperature", level: "warning", message: `今日最低温预计 ${Math.round(current.todayLow)}℃` });
    if (previous && Number.isFinite(previous.temperature) && Math.abs(current.temperature - previous.temperature) >= 5) {
      events.push({ ...base, type: "temperature-change", level: "info", message: `气温较上次变化 ${Math.round(current.temperature - previous.temperature)}℃` });
    }
    return events;
  }
}

class WeatherService {
  constructor(options = {}) {
    this.provider = options.provider || new OpenMeteoWeatherProvider({ fetchFn: options.fetchFn });
    this.settings = { enabled: false, city: "", pollMinutes: 30, ...(options.settings || {}) };
    this.cache = options.cache || new WeatherCache(Math.max(10, Number(this.settings.pollMinutes) || 30) * 60_000);
    this.alerts = options.alerts || new WeatherAlertEngine();
    this.deduplicator = options.deduplicator || new WeatherEventDeduplicator();
    this.onUpdate = typeof options.onUpdate === "function" ? options.onUpdate : null;
    this.onAlert = typeof options.onAlert === "function" ? options.onAlert : null;
    this.location = null;
    this.inflight = null;
    this.timer = null;
    this.sleeping = false;
  }

  updateSettings(value = {}) {
    const previousCity = this.settings.city;
    this.settings = { ...this.settings, ...value };
    if (String(previousCity).trim().toLowerCase() !== String(this.settings.city).trim().toLowerCase()) {
      this.location = null;
      this.cache.clear();
    }
    this.schedule();
  }

  status() {
    if (this.settings.enabled !== true || !String(this.settings.city || "").trim()) return { configured: false, status: "not-configured", snapshot: null, error: null };
    const snapshot = this.cache.get();
    return { configured: true, status: this.inflight ? "refreshing" : snapshot ? snapshot.stale ? "stale" : "ready" : "idle", snapshot, error: null };
  }

  async refresh(options = {}) {
    if (this.settings.enabled !== true || !String(this.settings.city || "").trim()) throw new WeatherProviderError("NOT_CONFIGURED", "请先在设置中开启天气并填写城市");
    if (!options.force) {
      const cached = this.cache.get();
      if (cached && !cached.stale) return { snapshot: cached, alerts: [], cached: true };
    }
    if (this.inflight) return this.inflight.promise;
    const controller = new AbortController();
    const promise = this._refresh(controller.signal).finally(() => { if (this.inflight?.controller === controller) this.inflight = null; });
    this.inflight = { controller, promise };
    return promise;
  }

  async _refresh(signal) {
    let attempt = 0;
    while (true) {
      try {
        if (!this.location) this.location = await this.provider.resolveCity(this.settings.city, signal);
        const previous = this.cache.get();
        const snapshot = await this.provider.getForecast(this.location, signal);
        this.cache.set(snapshot);
        const events = this.alerts.compare(previous, snapshot).filter((event) => this.deduplicator.accept(event));
        this.onUpdate?.(this.status());
        for (const event of events) this.onAlert?.(event);
        return { snapshot, alerts: events, cached: false };
      } catch (error) {
        if (signal.aborted || attempt >= 2 || !["NETWORK_ERROR", "API_ERROR", "RATE_LIMITED"].includes(error?.code)) throw error;
        await new Promise((resolve) => setTimeout(resolve, [500, 1_500][attempt++]));
      }
    }
  }

  cancel() { this.inflight?.controller.abort(); }
  setSleeping(value) { this.sleeping = value === true; if (this.sleeping) this.cancel(); else void this.refresh().catch(() => undefined); this.schedule(); }
  schedule() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (this.settings.enabled !== true || this.sleeping) return;
    const interval = Math.max(10, Number(this.settings.pollMinutes) || 30) * 60_000;
    this.timer = setInterval(() => void this.refresh({ force: true }).catch(() => undefined), interval);
    this.timer.unref?.();
  }
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cancel(); }
}

module.exports = { WeatherAlertEngine, WeatherCache, WeatherEventDeduplicator, WeatherService };
