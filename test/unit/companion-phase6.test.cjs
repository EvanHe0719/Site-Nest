const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  COMPANION_STATES,
  CompanionRuntimeService,
  OpenMeteoWeatherProvider,
  WeatherProviderError,
  classifyPageForAI,
  summaryExtractionScript,
} = require("../../electron/companion/index.cjs");

const ROOT = path.join(__dirname, "..", "..");

test("100 state transitions and 100 expand/collapse cycles keep one scheduler and no listener surface", () => {
  let now = Date.parse("2026-09-02T04:00:00.000Z");
  const service = new CompanionRuntimeService({
    now: () => now,
    settings: { enabled: true, focusDockSeconds: 20, idleThresholdSeconds: 120, wellness: { enabled: false } },
    getIdleSeconds: () => 0,
    getContext: () => ({ foreground: true }),
    tickIntervalMs: 5_000,
  });
  service.start();
  const timer = service.timer;
  for (let index = 0; index < 100; index += 1) {
    service.action("expand", { panel: index % 2 ? "weather" : "assistant" });
    service.action("collapse");
  }
  for (let index = 0; index < 100; index += 1) {
    now += 1_000;
    service.machine.transition(index % 2 ? "focus" : "rest", { reason: "stress-test" });
  }
  assert.equal(service.timer, timer);
  assert.equal(service.start().state, service.snapshot().state);
  assert.equal(service.listenerCount, undefined);
  assert.ok(COMPANION_STATES.includes(service.snapshot().state));
  service.stop();
  assert.equal(service.timer, null);
});

test("bubble tip expires back to a low-interruption state without creating another reminder", () => {
  let now = Date.parse("2026-09-02T04:00:00.000Z");
  const service = new CompanionRuntimeService({
    now: () => now,
    settings: { enabled: true, focusDockSeconds: 20, idleThresholdSeconds: 120, wellness: { intervalsMinutes: { "eye-rest": 5, water: 240, movement: 240 } } },
    getIdleSeconds: () => 0,
    getContext: () => ({ foreground: true }),
  });
  service.tick();
  now += 5 * 60_000;
  assert.equal(service.tick().state, "bubbleTip");
  const dueAt = service.snapshot().reminder.dueAt;
  now += 13_000;
  assert.equal(service.tick().state, "focusedDocked");
  assert.equal(service.snapshot().reminder.dueAt, dueAt);
});

test("privacy guard never reads credentials or unsubmitted form state and auth routes stay blocked", () => {
  const script = summaryExtractionScript(15_000);
  assert.doesNotMatch(script, /document\.cookie|localStorage|sessionStorage/);
  assert.match(script, /input,textarea,select,option,button,\[contenteditable\]/);
  assert.equal(classifyPageForAI("https://accounts.zoho.com/oauth/authorize?code=secret").allowed, false);
  assert.equal(classifyPageForAI("https://example.test/login").allowed, false);
});

test("weather provider uses bounded timeout and public WEATHER error codes", async () => {
  const rateLimited = new OpenMeteoWeatherProvider({ fetchFn: async () => ({ ok: false, status: 429 }) });
  await assert.rejects(rateLimited.resolveCity("上海"), (error) => error instanceof WeatherProviderError && error.code === "WEATHER_RATE_LIMITED");
  const invalid = new OpenMeteoWeatherProvider({ fetchFn: async () => ({ ok: true, json: async () => { throw new Error("bad json"); } }) });
  await assert.rejects(invalid.resolveCity("上海"), (error) => error.code === "WEATHER_INVALID_RESPONSE");
});

test("shell rail is single-instance, keyboard accessible, reduced-motion aware and never injected into remote pages", () => {
  const html = fs.readFileSync(path.join(ROOT, "renderer", "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(ROOT, "renderer", "styles.css"), "utf8");
  const renderer = fs.readFileSync(path.join(ROOT, "renderer", "app.js"), "utf8");
  assert.equal((html.match(/id="companionDock"/g) || []).length, 1);
  assert.equal((html.match(/id="companionPanel"/g) || []).length, 1);
  assert.match(html, /aria-controls="companionPanel"/);
  assert.match(html, /aria-expanded="false"/);
  assert.match(styles, /prefers-reduced-motion:\s*reduce/);
  assert.match(renderer, /if \(companionPanelOpen\)/);
  assert.match(renderer, /dom\.companionDock\.focus/);
  assert.doesNotMatch(summaryExtractionScript(15_000), /companion-dock|companion-panel/);
});

test("production lifecycle stops companion, weather and AI in the 0.5.7 release", () => {
  const main = fs.readFileSync(path.join(ROOT, "electron", "main.cjs"), "utf8");
  const packageJson = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
  assert.match(main, /companionRuntimeService\?\.stop\(\)/);
  assert.match(main, /weatherService\?\.stop\(\)/);
  assert.match(main, /companionAIService\?\.cancelAll\(\)/);
  assert.equal(packageJson.version, "0.5.7");
  assert.equal(packageJson.build.appId, "local.qiye.sitehub");
  assert.doesNotMatch(main, /new BrowserWindow\([^)]*companion/is);
});
