const test = require("node:test");
const assert = require("node:assert/strict");

const {
  GlobalSearchService,
  SearchEngineRegistry,
  SearchService,
  normalizeSearchHistory,
  normalizeSearchSettings,
  recordSearchHistory,
} = require("../../electron/browser/search-service.cjs");
const {
  resolveNavigationTarget,
} = require("../../electron/browser/navigation-target.cjs");
const {
  createInitialState,
  migrateState,
} = require("../../electron/state-model.cjs");

const NOW = new Date("2026-08-30T12:00:00.000Z");

test("navigation resolver opens complete URLs and preserves paths and queries", () => {
  assert.deepEqual(resolveNavigationTarget("https://example.com/path?q=1"), {
    kind: "url",
    url: "https://example.com/path?q=1",
    input: "https://example.com/path?q=1",
  });
  assert.equal(resolveNavigationTarget("support.sap.com/en/index.html?isu_page=1").url,
    "https://support.sap.com/en/index.html?isu_page=1");
});

test("navigation resolver selects safe defaults for domains and local hosts", () => {
  assert.equal(resolveNavigationTarget("example.com/docs").url, "https://example.com/docs");
  assert.equal(resolveNavigationTarget("localhost:3000/app").url, "http://localhost:3000/app");
  assert.equal(resolveNavigationTarget("192.168.1.100:8080/status").url,
    "http://192.168.1.100:8080/status");
  assert.equal(resolveNavigationTarget("10.0.0.8").url, "http://10.0.0.8/");
});

test("keywords use the selected engine and are encoded only when submitted", () => {
  const service = new SearchService();
  const target = service.resolve("SAP Business One 采购退货单位", { engineId: "bing" });
  assert.equal(target.kind, "search");
  assert.equal(target.engineId, "bing");
  assert.equal(target.url,
    "https://www.bing.com/search?q=SAP%20Business%20One%20%E9%87%87%E8%B4%AD%E9%80%80%E8%B4%A7%E5%8D%95%E4%BD%8D");
});

test("dangerous protocols are blocked and unknown protocols require external confirmation", () => {
  for (const value of ["javascript:alert(1)", "vbscript:msgbox(1)", "data:text/html,test", "file:///C:/secret.txt"]) {
    assert.throws(() => resolveNavigationTarget(value), /不允许/);
  }
  assert.deepEqual(resolveNavigationTarget("myapp://open/item/1"), {
    kind: "external",
    url: "myapp://open/item/1",
    input: "myapp://open/item/1",
    protocol: "myapp:",
  });
});

test("built-in engines are stable, default changes normalize, and unsafe templates fail", () => {
  const registry = new SearchEngineRegistry();
  assert.deepEqual(registry.list().map((engine) => engine.id), [
    "google", "bing", "baidu", "duckduckgo",
  ]);
  assert.equal(normalizeSearchSettings({ defaultSearchEngineId: "baidu" }, registry).defaultSearchEngineId,
    "baidu");
  assert.equal(normalizeSearchSettings({ defaultSearchEngineId: "missing" }, registry).defaultSearchEngineId,
    "google");
  assert.throws(() => new SearchEngineRegistry([{
    id: "unsafe", name: "Unsafe", searchUrlTemplate: "javascript:{query}",
  }]), /HTTPS/);
  assert.throws(() => new SearchEngineRegistry([{
    id: "missing-query", name: "Missing", searchUrlTemplate: "https://example.com/search",
  }]), /\{query\}/);
});

test("history deduplicates, enforces the limit, and stops recording when disabled", () => {
  const settings = normalizeSearchSettings({ searchHistoryLimit: 2 });
  let history = recordSearchHistory([], { kind: "search", input: "Zoho OAuth", engineId: "google" }, settings, NOW);
  history = recordSearchHistory(history, { kind: "search", input: "Zoho OAuth", engineId: "google" }, settings,
    new Date("2026-08-30T12:01:00.000Z"));
  assert.equal(history.length, 1);
  assert.equal(history[0].useCount, 2);
  history = recordSearchHistory(history, { kind: "search", input: "SAP Notes", engineId: "google" }, settings,
    new Date("2026-08-30T12:02:00.000Z"));
  history = recordSearchHistory(history, { kind: "search", input: "B1 SDK", engineId: "bing" }, settings,
    new Date("2026-08-30T12:03:00.000Z"));
  assert.deepEqual(history.map((item) => item.text), ["B1 SDK", "SAP Notes"]);
  const disabled = recordSearchHistory(history, { kind: "search", input: "must not save" }, {
    ...settings,
    saveSearchHistory: false,
  }, NOW);
  assert.deepEqual(disabled, normalizeSearchHistory(history, { ...settings, saveSearchHistory: false }));
});

test("history strips sensitive URL parameters and rejects credentials or token assignments", () => {
  const settings = normalizeSearchSettings();
  const history = normalizeSearchHistory([
    { type: "directUrl", text: "https://example.com/callback?code=secret&safe=1&token=hidden#done" },
    { type: "directUrl", text: "https://user:password@example.com/private" },
    { type: "webSearch", text: "access_token=do-not-store", engineId: "google" },
  ], settings);
  assert.equal(history.length, 1);
  assert.equal(history[0].text, "https://example.com/callback?safe=1#done");
  assert.doesNotMatch(JSON.stringify(history), /secret|hidden|password|do-not-store/);
});

test("v9 state migrates to the current schema without altering sites, bookmarks, sessions, or connector config", () => {
  const initial = createInitialState({ now: NOW.toISOString(), defaultSites: [{
    id: "site-a",
    name: "Site A",
    url: "https://example.com/",
    workspaceId: "work",
  }] });
  initial.version = 9;
  initial.bookmarks = [{
    id: "bookmark-a",
    name: "Bookmark A",
    url: "https://docs.example.com/",
    folder: "Docs",
    sourceProfile: "Default",
  }];
  initial.connectorConnections = [{
    id: "zoho-desk-default",
    connectorType: "zoho-desk",
    displayName: "Zoho Desk",
    status: "not-configured",
    publicConfig: { orgId: "123456" },
    secretReference: "connector:zoho-desk:default",
    createdAt: NOW.toISOString(),
    updatedAt: NOW.toISOString(),
  }];
  const result = migrateState(initial, { now: NOW.toISOString() });
  assert.equal(result.state.version, 16);
  assert.equal(result.state.sites[0].id, "site-a");
  assert.equal(result.state.bookmarks[0].id, "bookmark-a");
  assert.equal(result.state.connectorConnections[0].publicConfig.orgId, "123456");
  assert.deepEqual(result.state.searchHistory, []);
  assert.deepEqual(result.state.uiSettings.search, {
    defaultSearchEngineId: "google",
    saveSearchHistory: true,
    searchHistoryLimit: 100,
    settingsLastSection: "general",
  });
  const repeated = migrateState(result.state, { now: "2030-01-01T00:00:00.000Z" });
  assert.equal(repeated.changed, false);
});

test("global search snapshots never mutate persisted input arrays", () => {
  const service = new GlobalSearchService();
  const history = [{ type: "webSearch", text: "one", engineId: "google" }];
  const snapshot = service.snapshot({ defaultSearchEngineId: "duckduckgo" }, history);
  snapshot.history[0].text = "changed";
  assert.equal(history[0].text, "one");
  assert.equal(snapshot.settings.defaultSearchEngineId, "duckduckgo");
});
