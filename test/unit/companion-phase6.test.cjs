const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  COMPANION_STATES,
  COMPANION_WIDGET_HOST_ID,
  COMPANION_WIDGET_WORLD_ID,
  CompanionRuntimeService,
  OpenMeteoWeatherProvider,
  WeatherProviderError,
  classifyPageForAI,
  companionWidgetInstallScript,
  normalizeCompanionWidgetSnapshot,
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

test("in-page widget is isolated, interactive, reduced-motion aware and excludes private page data", () => {
  const html = fs.readFileSync(path.join(ROOT, "renderer", "index.html"), "utf8");
  const styles = fs.readFileSync(path.join(ROOT, "renderer", "styles.css"), "utf8");
  const renderer = fs.readFileSync(path.join(ROOT, "renderer", "app.js"), "utf8");
  const preload = fs.readFileSync(path.join(ROOT, "electron", "user-script-preload.cjs"), "utf8");
  const main = fs.readFileSync(path.join(ROOT, "electron", "main.cjs"), "utf8");
  const widget = companionWidgetInstallScript({
    settings: { enabled: true, apiKey: "must-not-leak" },
    runtime: { state: "idle", secret: "runtime-secret" },
  });
  const normalized = normalizeCompanionWidgetSnapshot({
    settings: { enabled: true, apiKey: "must-not-leak" },
    runtime: { state: "idle", secret: "runtime-secret" },
    weather: { snapshot: { city: "上海", temperature: 26, token: "weather-secret" } },
  });
  const recentlyFocused = normalizeCompanionWidgetSnapshot({
    settings: { enabled: true },
    runtime: { state: "focusedDocked", activeSince: "2026-09-02T08:00:00.000Z" },
    now: Date.parse("2026-09-02T08:00:30.000Z"),
  });
  const longFocused = normalizeCompanionWidgetSnapshot({
    settings: { enabled: true },
    runtime: { state: "focusedDocked", activeSince: "2026-09-02T08:00:00.000Z" },
    now: Date.parse("2026-09-02T08:26:00.000Z"),
  });
  assert.equal(COMPANION_WIDGET_WORLD_ID, 1002);
  assert.equal(COMPANION_WIDGET_HOST_ID, "qiye-xiaoxu-widget-host");
  assert.equal((html.match(/id="companionDock"/g) || []).length, 0);
  assert.equal((html.match(/id="companionPanel"/g) || []).length, 0);
  assert.equal((html.match(/id="companionEdgeRail"/g) || []).length, 0);
  assert.doesNotMatch(html, /id="companionQuickAskForm"/);
  assert.doesNotMatch(html, /id="companionWeatherPill"/);
  assert.doesNotMatch(styles, /is-companion-enabled|companion-edge-rail|\.companion-dock/);
  assert.doesNotMatch(renderer, /dom\.companionDock\.focus/);
  assert.match(renderer, /liveToastsByKey/);
  assert.match(renderer, /options\.key \|\| `\$\{type\}:\$\{title\}`/);
  assert.match(widget, /attachShadow\(\{ mode: 'closed' \}\)/);
  assert.match(widget, /data-visual-state="nap"/);
  assert.match(widget, /data-visual-state="happy"/);
  assert.match(widget, /data-visual-state="breathing"/);
  assert.match(widget, /prefers-reduced-motion:reduce/);
  assert.match(widget, /event\.isTrusted/);
  assert.match(widget, /water-wave/);
  assert.match(widget, /active-ripple/);
  assert.equal((widget.match(/class="halo h[1-4]"/g) || []).length, 4);
  assert.match(widget, /event\.stopPropagation\(\)/);
  assert.match(widget, /ResizeObserver\(syncHostBox\)/);
  assert.match(widget, /panelOpen \? '286px' : '52px'/);
  assert.match(widget, /输入问题，不会自动读取网页/);
  assert.doesNotMatch(widget, /document\.cookie|localStorage|sessionStorage|innerText/);
  assert.doesNotMatch(widget, /must-not-leak|runtime-secret|weather-secret/);
  assert.doesNotMatch(JSON.stringify(normalized), /must-not-leak|runtime-secret|weather-secret/);
  assert.equal(recentlyFocused.visualState, "idle");
  assert.equal(recentlyFocused.muted, false);
  assert.equal(longFocused.visualState, "nap");
  assert.equal(longFocused.muted, true);
  assert.match(summaryExtractionScript(15_000), /\[data-qiye-companion-host\]/);
  assert.match(preload, /exposeInIsolatedWorld\(COMPANION_WIDGET_WORLD_ID, "qiyeCompanionHost"/);
  assert.match(main, /runtimeTabForWebContentsId\(event\.sender\.id\)/);
  assert.match(main, /companion:page-widget-action/);
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
