const assert = require("node:assert/strict");
const test = require("node:test");
const { OpenMeteoWeatherProvider, WeatherAlertEngine, WeatherCache, WeatherEventDeduplicator, WeatherService, normalizeForecast } = require("../../electron/companion/index.cjs");

function forecastPayload() {
  return { timezone: "Asia/Shanghai", current: { time: "2026-09-02T10:00", temperature_2m: 31, apparent_temperature: 35, weather_code: 2, wind_speed_10m: 12 }, hourly: { time: ["2026-09-02T10:00", "2026-09-02T11:00"], temperature_2m: [31, 32], precipitation_probability: [20, 70] }, daily: { temperature_2m_max: [36], temperature_2m_min: [25] } };
}

test("Open-Meteo normalization exposes only the compact weather panel fields", () => {
  const value = normalizeForecast(forecastPayload(), { name: "上海", country: "中国", timezone: "Asia/Shanghai" }, new Date("2026-09-02T02:00:00Z"));
  assert.equal(value.city, "上海");
  assert.equal(value.condition, "局部多云");
  assert.equal(value.nextHours[1].precipitationProbability, 70);
  assert.equal("latitude" in value, false);
});

test("weather cache marks stale and alert engine uses deterministic facts with dedupe", () => {
  const cache = new WeatherCache(1_000);
  cache.set({ city: "上海", temperature: 20 }, 0);
  assert.equal(cache.get(999).stale, false);
  assert.equal(cache.get(1_000).stale, true);
  const current = normalizeForecast(forecastPayload(), { name: "上海" }, new Date("2026-09-02T02:00:00Z"));
  const events = new WeatherAlertEngine().compare({ temperature: 24 }, current);
  assert.ok(events.some((item) => item.type === "rain-soon"));
  assert.ok(events.some((item) => item.type === "high-temperature"));
  assert.ok(events.some((item) => item.type === "temperature-change"));
  const dedupe = new WeatherEventDeduplicator(1_000);
  assert.equal(dedupe.accept(events[0], 0), true);
  assert.equal(dedupe.accept(events[0], 999), false);
});

test("weather service keeps one in-flight request and returns real not-configured state without fixtures", async () => {
  let resolveForecast;
  let forecastCalls = 0;
  const provider = {
    resolveCity: async () => ({ name: "上海", latitude: 31.2, longitude: 121.4 }),
    getForecast: async () => { forecastCalls += 1; return new Promise((resolve) => { resolveForecast = resolve; }); },
  };
  const service = new WeatherService({ provider, settings: { enabled: true, city: "上海" } });
  const first = service.refresh({ force: true });
  const second = service.refresh({ force: true });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(forecastCalls, 1);
  resolveForecast(normalizeForecast(forecastPayload(), { name: "上海" }));
  assert.equal((await first).snapshot.city, "上海");
  assert.equal((await second).snapshot.city, "上海");
  const empty = new WeatherService({ provider, settings: { enabled: false, city: "" } });
  assert.deepEqual(empty.status(), { configured: false, status: "not-configured", snapshot: null, error: null });
});

test("provider uses official geocoding and forecast query boundaries", async () => {
  const urls = [];
  const provider = new OpenMeteoWeatherProvider({ fetchFn: async (url) => {
    urls.push(String(url));
    return { ok: true, json: async () => urls.length === 1 ? { results: [{ name: "上海", country: "中国", latitude: 31.2, longitude: 121.4, timezone: "Asia/Shanghai" }] } : forecastPayload() };
  } });
  const location = await provider.resolveCity("上海");
  await provider.getForecast(location);
  assert.match(urls[0], /geocoding-api\.open-meteo\.com\/v1\/search\?name=/);
  assert.match(urls[1], /current=temperature_2m%2Capparent_temperature%2Cweather_code%2Cwind_speed_10m/);
  assert.match(urls[1], /timezone=auto/);
});
