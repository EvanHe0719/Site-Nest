const assert = require("node:assert/strict");
const { EventEmitter } = require("node:events");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  CompanionRuntimeService,
  companionWidgetInstallScript,
  normalizeConversationMemory,
  normalizeCompanionRuntimeState,
  normalizeCompanionSettings,
  syncableCompanionSettings,
  visualState,
} = require("../../electron/companion/index.cjs");
const { createSafeSnapshot } = require("../../electron/google-drive-sync-data.cjs");
const { DEFAULT_SHORTCUTS } = require("../../electron/shortcuts/shortcut-registry.cjs");
const { CURRENT_SCHEMA_VERSION, createInitialState, migrateState } = require("../../electron/state-model.cjs");
const { applyEntityOperationToState, buildSyncEntities } = require("../../electron/sync/entity-adapters.cjs");
const { DesktopNotificationService } = require("../../electron/tasks/desktop-notification-service.cjs");
const { UI_ACTION_IDS } = require("../../electron/ui-actions/catalog.cjs");

const NOW = "2026-09-02T04:00:00.000Z";

test("schema v19 preserves companion settings and safely adds synced personal memory collections", () => {
  const old = createInitialState({ now: NOW });
  old.version = 17;
  old.sites.push({
    id: "kept-site", name: "保留站点", shortName: "保", url: "https://example.test/", color: "#267d67",
    source: "custom", description: "", pinned: true, order: 0, workspaceId: "personal", siteKind: "normal",
    openMode: "internal", browserProfileId: "default", assistantIds: [], createdAt: NOW, updatedAt: NOW,
  });
  delete old.uiSettings.companion;
  delete old.companionRuntimeState;

  const migration = migrateState(old, { now: NOW });
  assert.equal(CURRENT_SCHEMA_VERSION, 19);
  assert.equal(migration.state.version, 19);
  assert.equal(migration.state.uiSettings.companion.enabled, false);
  assert.equal(migration.state.sites.some((site) => site.id === "kept-site"), true);
  assert.deepEqual(migration.state.companionRuntimeState.aiAllowedHosts, []);
  assert.deepEqual(migration.state.companionConversationEntries, []);
  assert.deepEqual(migration.state.companionMemoryFacts, []);
  assert.deepEqual(migrateState(migration.state, { now: NOW }).state, migration.state);
});

test("companion settings and persisted runtime enforce bounded, sanitized values", () => {
  const settings = normalizeCompanionSettings({
    enabled: true,
    focusDockSeconds: 500,
    idleThresholdSeconds: 1,
    silentSites: [" EXAMPLE.COM ", "example.com", ""],
    weather: { enabled: true, city: " 上海 ", pollMinutes: 2 },
    memory: { enabled: true, maxTurns: 100, syncEnabled: true, autoCapture: true },
    wellness: { intervalsMinutes: { water: 999 } },
  });
  assert.equal(settings.focusDockSeconds, 60);
  assert.equal(settings.idleThresholdSeconds, 60);
  assert.deepEqual(settings.silentSites, ["example.com"]);
  assert.equal(settings.weather.city, "上海");
  assert.equal(settings.weather.pollMinutes, 10);
  assert.equal(settings.memory.enabled, true);
  assert.equal(settings.memory.maxTurns, 100);
  assert.equal(settings.memory.syncEnabled, true);
  assert.equal(settings.memory.autoCapture, true);
  assert.equal(settings.wellness.intervalsMinutes.water, 240);

  const runtime = normalizeCompanionRuntimeState({
    pausedUntil: "2026-09-02T05:00:00Z",
    snoozedUntil: { water: "2026-09-02T05:10:00Z", unknown: "2026-09-02T05:10:00Z" },
    aiAllowedHosts: [" Desk.Zoho.com.cn ", "desk.zoho.com.cn"],
    weatherCache: {
      expiresAt: "2026-09-02T05:30:00Z",
      snapshot: { city: "上海", fetchedAt: "2026-09-02T05:00:00Z", temperature: 28, latitude: 31.2 },
    },
  });
  assert.equal(runtime.pausedUntil, "2026-09-02T05:00:00.000Z");
  assert.deepEqual(Object.keys(runtime.snoozedUntil), ["water"]);
  assert.deepEqual(runtime.aiAllowedHosts, ["desk.zoho.com.cn"]);
  assert.equal(runtime.weatherCache.snapshot.temperature, 28);
  assert.equal(Object.hasOwn(runtime.weatherCache.snapshot, "latitude"), false);
  assert.equal(Object.hasOwn(runtime, "conversationMemory"), false);
  const conversation = normalizeConversationMemory(Array.from({ length: 230 }, (_, index) => ({
    id: `message-${index}`,
    role: index % 2 ? "assistant" : "user",
    content: `内容 ${index}`,
    createdAt: "2026-09-02T05:00:00Z",
  })), { maxTurns: 100 });
  assert.equal(conversation.length, 200);
  assert.equal(conversation[0].id, "message-30");
  assert.equal(conversation.every((item) => item.workspaceId === "personal"), true);
});

test("companion conversation memory is enabled by default for cross-site continuity", () => {
  const settings = normalizeCompanionSettings();
  assert.equal(settings.memory.enabled, true);
  assert.equal(settings.memory.syncEnabled, true);
  assert.equal(normalizeCompanionSettings({ memory: { enabled: false } }).memory.enabled, false);
});

test("Google sync carries enabled personal AI memory separately, while city and runtime state stay local", () => {
  const state = createInitialState({ now: NOW });
  state.uiSettings.companion = normalizeCompanionSettings({ enabled: true, memory: { enabled: true }, weather: { enabled: true, city: "上海", pollMinutes: 45 } });
  state.companionRuntimeState = normalizeCompanionRuntimeState({
    pausedUntil: "2026-09-02T05:00:00Z",
    aiAllowedHosts: ["desk.zoho.com.cn"],
    weatherCache: { expiresAt: "2026-09-02T05:30:00Z", snapshot: { city: "上海", fetchedAt: NOW, temperature: 28 } },
  });
  state.companionConversationEntries = [{ id: "question", workspaceId: "personal", role: "user", content: "跨电脑继续这句话", createdAt: NOW, updatedAt: NOW }];
  state.companionMemoryFacts = [{ id: "secret", workspaceId: "personal", content: "测试站密码是 alpha-123", source: "explicit", sensitive: true, createdAt: NOW, updatedAt: NOW }];

  const expected = syncableCompanionSettings(state.uiSettings.companion);
  assert.equal(Object.hasOwn(expected.weather, "city"), false);
  assert.equal(expected.memory.maxTurns, 100);
  const snapshot = createSafeSnapshot(state);
  assert.deepEqual(snapshot.settings.companion, expected);
  assert.equal(Object.hasOwn(snapshot, "companionRuntimeState"), false);
  assert.equal(snapshot.syncOptions.companionMemory, true);
  assert.equal(snapshot.companionConversationEntries[0].content, "跨电脑继续这句话");
  assert.equal(snapshot.companionMemoryFacts[0].content, "测试站密码是 alpha-123");

  const entity = buildSyncEntities(state).get("applicationSetting:shared");
  assert.deepEqual(entity.payload.companion, expected);
  assert.equal(JSON.stringify(entity.payload).includes("上海"), false);
  assert.equal(JSON.stringify(entity.payload).includes("desk.zoho.com.cn"), false);
  assert.equal(buildSyncEntities(state).get("companionConversationEntry:question").payload.workspaceId, "personal");
  assert.equal(buildSyncEntities(state).get("companionMemoryFact:secret").payload.content, "测试站密码是 alpha-123");

  const local = structuredClone(state);
  const applied = applyEntityOperationToState(local, {
    entityType: "applicationSetting",
    entityId: "shared",
    operation: "upsert",
    payload: { companion: { enabled: false, weather: { enabled: false, pollMinutes: 60 } } },
  });
  assert.equal(applied.uiSettings.companion.weather.city, "上海");
  assert.equal(applied.uiSettings.companion.weather.pollMinutes, 60);
});

test("companion actions support hide/wake and persisted reminder cooldown without extra timers", () => {
  let now = Date.parse(NOW);
  const service = new CompanionRuntimeService({
    now: () => now,
    settings: { enabled: true, focusDockSeconds: 20, idleThresholdSeconds: 120, wellness: { intervalsMinutes: { water: 5 } } },
    getIdleSeconds: () => 0,
    getContext: () => ({ foreground: true }),
  });
  assert.equal(service.action("hide").state, "silentHidden");
  assert.equal(service.snapshot().temporarilyHidden, true);
  assert.notEqual(service.action("wake").state, "silentHidden");
  assert.equal(service.snapshot().temporarilyHidden, false);
  service.action("pause", { minutes: 15 });
  assert.equal(Date.parse(service.runtimeState().pausedUntil), now + 15 * 60_000);
  service.stop();
  assert.equal(service.timer, null);
});

test("companion background actions and settings remain registered while the panel action is not mounted", () => {
  for (const actionId of [
    "companion.toggle", "companion.expand", "companion.collapse", "companion.hide", "companion.wake",
    "companion.pause", "companion.resume", "companion.snooze", "companion.ack-water",
    "companion.weather.open", "companion.weather.refresh", "companion.ai.ask",
    "companion.ai.summarize", "companion.ai.explain-selection", "companion.settings.open", "companion.settings.save",
  ]) assert.equal(UI_ACTION_IDS.includes(actionId), true, actionId);
  const shortcuts = DEFAULT_SHORTCUTS.filter((item) => item.category === "AI 与关怀");
  assert.deepEqual(shortcuts.map((item) => item.actionId), ["companion.expand", "companion.ai.summarize"]);
  assert.ok(shortcuts.every((item) => item.accelerator === ""));

  const html = fs.readFileSync(path.join(__dirname, "..", "..", "renderer", "index.html"), "utf8");
  const preload = fs.readFileSync(path.join(__dirname, "..", "..", "electron", "preload.cjs"), "utf8");
  const main = fs.readFileSync(path.join(__dirname, "..", "..", "electron", "main.cjs"), "utf8");
  assert.match(html, /id="companionSettingsCard"/);
  assert.match(html, /id="companionMemoryEnabled"/);
  assert.match(html, /id="clearCompanionMemory"/);
  assert.match(html, /data-action-id="companion\.settings\.save"/);
  assert.doesNotMatch(html, /data-action-id="companion\.expand"/);
  assert.match(preload, /clearCompanionMemory: \(\) => ipcRenderer\.invoke\("companion:clear-memory"\)/);
  assert.match(main, /ipcMain\.handle\("companion:clear-memory"/);
});

test("0.5.9 keeps the titlebar icon inert while the in-page orb is interactive", () => {
  const html = fs.readFileSync(path.join(__dirname, "..", "..", "renderer", "index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(__dirname, "..", "..", "renderer", "app.js"), "utf8");
  const widget = companionWidgetInstallScript({ settings: { enabled: true } });
  assert.match(html, /id="globalCompanionTrigger"[^>]*aria-disabled="true"/);
  assert.doesNotMatch(html, /id="companionDock"|id="companionPanel"|id="companionEdgeRail"/);
  assert.doesNotMatch(renderer, /globalCompanionTrigger\.addEventListener\("click"/);
  assert.doesNotMatch(renderer, /dom\.companionDock|dom\.companionEdgeRail/);
  assert.match(widget, /orb\.addEventListener\('click'/);
  assert.match(widget, /if \(!event\.isTrusted\) return/);
  assert.match(widget, /qiyeCompanionHost\?\.invoke\('status'/);
  assert.equal(visualState({ state: "idle" }), "idle");
  assert.equal(visualState({ state: "resting" }), "breathing");
  assert.equal(visualState({ state: "focusedDocked" }), "idle");
  assert.equal(visualState({ state: "focusedDocked", longFocus: true }), "nap");
  assert.equal(visualState({ quietReason: "fullscreen" }), "nap");
  assert.equal(visualState({ state: "bubbleTip", reminder: { message: "喝水" } }), "happy");
});

test("desktop companion notification exposes open, acknowledge, snooze and dismiss actions", () => {
  class FakeNotification extends EventEmitter {
    static isSupported() { return true; }
    constructor(options) { super(); this.options = options; }
    show() { this.shown = true; }
    close() { this.emit("close"); }
  }
  const calls = [];
  const service = new DesktopNotificationService({
    Notification: FakeNotification,
    icon: "icon.png",
    onCompanionOpen: () => calls.push(["open"]),
    onCompanionAcknowledge: (kind) => calls.push(["ack", kind]),
    onCompanionSnooze: (kind, minutes) => calls.push(["snooze", kind, minutes]),
    onCompanionDismissToday: () => calls.push(["dismiss"]),
  });
  assert.deepEqual(service.showCompanion({ kind: "water", dueAt: NOW, message: "喝水" }), { supported: true });
  const notification = service.active.get(`companion:water:${NOW}`);
  assert.deepEqual(notification.options.actions.map((item) => item.text), ["已喝水", "延后 10 分钟", "今天不再提醒"]);
  notification.emit("click");
  notification.emit("action", {}, 0);
  notification.emit("action", {}, 1);
  notification.emit("action", {}, 2);
  assert.deepEqual(calls, [["open"], ["ack", "water"], ["snooze", "water", 10], ["dismiss"]]);
});
