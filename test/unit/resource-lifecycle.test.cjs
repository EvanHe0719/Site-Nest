const assert = require("node:assert/strict");
const test = require("node:test");

const {
  PageResourceService,
  SessionRuntimeState,
  WebViewLifecycleManager,
  WebViewPool,
  normalizeBrowserMemorySettings,
  normalizePageResourceCandidate,
  pageResourceExtractionScript,
} = require("../../electron/browser/index.cjs");

test("resource normalization keeps direct user-accessible files and rejects credentials or encrypted playlists", () => {
  const download = normalizePageResourceCandidate({
    url: "https://cdn.example.com/report.pdf?download=1",
    sourceElement: "a",
    declaredDownload: true,
    filename: "report.pdf",
  });
  assert.equal(download.type, "file");
  assert.equal(download.filename, "report.pdf");
  assert.equal(normalizePageResourceCandidate({ url: "https://example.com/article", sourceElement: "a" }), null);
  assert.equal(normalizePageResourceCandidate({ url: "https://example.com/live.m3u8", sourceElement: "video" }), null);
  assert.equal(normalizePageResourceCandidate({ url: "https://user:secret@example.com/file.zip", sourceElement: "a", declaredDownload: true }), null);
  const image = normalizePageResourceCandidate({ url: "https://cdn.example.com/photo", sourceElement: "img", mime: "image/webp" });
  assert.equal(image.type, "image");
  assert.match(pageResourceExtractionScript(), /a\[href\].*img\[src\].*video\[src\].*audio\[src\]/s);
  assert.doesNotMatch(pageResourceExtractionScript(), /cookie|responseHeaders|Authorization/i);
});

test("page resource service scans a fixed DOM result and downloads only a current scanned id", async () => {
  const downloaded = [];
  const contents = {
    id: 91,
    isDestroyed: () => false,
    executeJavaScript: async () => [
      { url: "https://cdn.example.com/manual.pdf", sourceElement: "a", declaredDownload: true, filename: "manual.pdf" },
      { url: "blob:https://example.com/secret", sourceElement: "video" },
    ],
    downloadURL: (url) => downloaded.push(url),
  };
  const service = new PageResourceService();
  const result = await service.inspect(contents);
  assert.equal(result.items.length, 1);
  assert.throws(() => service.download(contents, "forged"), /重新扫描/);
  assert.equal(service.download(contents, result.items[0].id).started, true);
  assert.deepEqual(downloaded, ["https://cdn.example.com/manual.pdf"]);
  service.clear(contents);
  assert.equal(service.list(contents).items.length, 0);
});

test("advanced network detection is explicit, metadata-only and unregisters its listener", () => {
  let listener = null;
  const calls = [];
  const targetSession = {
    webRequest: {
      onResponseStarted(filter, value) {
        calls.push({ filter, value });
        listener = value || null;
      },
    },
  };
  const contents = { id: 27, isDestroyed: () => false };
  const service = new PageResourceService();
  const started = service.startNetworkDetection(targetSession, contents, 1_000);
  assert.equal(started.detecting, true);
  listener({
    webContentsId: 27,
    url: "https://cdn.example.com/video.mp4",
    resourceType: "media",
    responseHeaders: { "Content-Type": ["video/mp4"], "Content-Length": ["2048"], "Set-Cookie": ["secret=1"] },
  });
  const [item] = service.list(contents).items;
  assert.equal(item.mime, "video/mp4");
  assert.equal(item.size, 2048);
  assert.equal(Object.hasOwn(item, "headers"), false);
  assert.equal(Object.hasOwn(item, "cookie"), false);
  assert.equal(service.stopNetworkDetection().stopped, true);
  assert.equal(listener, null);
  assert.equal(calls.at(-1).filter, null);
});

test("web view pool implements saver, standard and performance warm limits with idle expiry", () => {
  const now = Date.parse("2026-08-30T08:00:00.000Z");
  const tabs = Array.from({ length: 5 }, (_, index) => ({
    tabId: `tab-${index}`,
    view: {},
    detached: false,
    lastActiveAt: new Date(now - index * 60_000).toISOString(),
  }));
  const standard = new WebViewPool({ mode: "standard", inactiveMinutes: 15 });
  assert.equal(standard.plan(tabs, new Set(["tab-0"]), now).warm.length, 1);
  standard.update({ mode: "saver" });
  assert.equal(standard.plan(tabs, new Set(["tab-0"]), now).warm.length, 0);
  standard.update({ mode: "performance", inactiveMinutes: 15 });
  assert.equal(standard.plan(tabs, new Set(["tab-0"]), now).warm.length, 3);
  assert.deepEqual(normalizeBrowserMemorySettings({ mode: "invalid", inactiveMinutes: 999 }), { mode: "standard", inactiveMinutes: 120 });
});

test("lifecycle manager destroys overflow views, preserves protected tabs and reports runtime states", async () => {
  const now = Date.parse("2026-08-30T08:00:00.000Z");
  const tabs = [
    { tabId: "active", workspaceId: "work", view: {}, detached: false, lastActiveAt: new Date(now).toISOString(), runtimeState: new SessionRuntimeState("active", () => now) },
    { tabId: "warm", workspaceId: "work", view: {}, detached: false, lastActiveAt: new Date(now - 60_000).toISOString() },
    { tabId: "protected", workspaceId: "work", view: {}, detached: false, lastActiveAt: new Date(now - 120_000).toISOString() },
    { tabId: "sleep", workspaceId: "work", view: {}, detached: false, lastActiveAt: new Date(now - 180_000).toISOString() },
  ];
  const suspended = [];
  const manager = new WebViewLifecycleManager({
    getTabs: () => tabs,
    getActiveTabIds: () => ["active"],
    isProtected: async (tab) => tab.tabId === "protected" ? { protected: true, reason: "download" } : { protected: false },
    suspend: async (tab) => { suspended.push(tab.tabId); tab.view = null; },
    settings: { mode: "standard", inactiveMinutes: 15 },
    now: () => now,
  });
  const result = await manager.enforce();
  assert.deepEqual(suspended, ["sleep"]);
  assert.equal(result.counts.active, 1);
  assert.equal(result.counts.warm, 2);
  assert.equal(result.counts.suspended, 1);
  assert.deepEqual(result.protectedTabs, [{ tabId: "protected", reason: "download" }]);
  manager.stop();
});
