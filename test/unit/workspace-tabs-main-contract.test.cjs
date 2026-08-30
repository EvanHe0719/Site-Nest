const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const mainSource = fs.readFileSync(
  path.join(projectRoot, "electron", "main.cjs"),
  "utf8",
);
const preloadSource = fs.readFileSync(
  path.join(projectRoot, "electron", "preload.cjs"),
  "utf8",
);

function sourceBetween(startMarker, endMarker) {
  const start = mainSource.indexOf(startMarker);
  const end = mainSource.indexOf(endMarker, start + startMarker.length);
  assert.ok(start >= 0, `missing source marker: ${startMarker}`);
  assert.ok(end > start, `missing source marker: ${endMarker}`);
  return mainSource.slice(start, end);
}

test("tab controls are exposed through narrow preload methods and registered IPC handlers", () => {
  const contracts = [
    ["selectBrowserTab", "browser:select-tab"],
    ["duplicateBrowserTab", "browser:duplicate-tab"],
    ["copyBrowserTabUrl", "browser:copy-tab-url"],
    ["openBrowserTabExternal", "browser:open-tab-external"],
    ["showBrowserTabContextMenu", "browser:show-tab-context-menu"],
    ["duplicateSiteTab", "sites:duplicate-tab"],
    ["closeBrowserTab", "browser:close-tab"],
    ["detachBrowserTab", "browser:detach-tab"],
    ["reattachBrowserTab", "browser:reattach-tab"],
    ["focusDetachedBrowserTab", "browser:focus-detached-tab"],
  ];

  for (const [method, channel] of contracts) {
    assert.match(preloadSource, new RegExp(`${method}\\s*:`));
    assert.match(preloadSource, new RegExp(`ipcRenderer\\.invoke\\(["']${channel}["']`));
    assert.match(mainSource, new RegExp(`ipcMain\\.handle\\(["']${channel}["']`));
  }

  assert.doesNotMatch(preloadSource, /WebContentsView|BrowserWindow|require\([^)]*main/);
});

test("top tab context menu is native so WebContentsView cannot cover it", () => {
  const nativeMenu = sourceBetween(
    "function showBrowserTabContextMenu",
    "async function duplicateSiteTab",
  );
  assert.match(mainSource, /\bMenu\b/);
  assert.match(nativeMenu, /Menu\.buildFromTemplate/);
  assert.match(nativeMenu, /label:\s*["']复制页签["']/);
  assert.match(nativeMenu, /label:\s*["']复制页面链接["']/);
  assert.match(nativeMenu, /label:\s*["']在外部浏览器打开["']/);
  assert.match(nativeMenu, /label:\s*["']关闭页签["']/);
  assert.match(nativeMenu, /BrowserWindow\.fromWebContents\(event\.sender\)/);
  assert.match(nativeMenu, /menu\.popup\(/);
});

test("connector IPC stays narrow, cancellable and never exposes token getters", () => {
  const contracts = [
    ["getConnectorStatus", "connectors:get-status"],
    ["refreshZohoDashboard", "connectors:refresh-dashboard"],
    ["cancelZohoDashboardRefresh", "connectors:cancel-dashboard"],
    ["getZohoTicketContext", "connectors:get-ticket-context"],
  ];
  for (const [method, channel] of contracts) {
    assert.match(preloadSource, new RegExp(`${method}\\s*:`));
    assert.match(preloadSource, new RegExp(`ipcRenderer\\.invoke\\(["']${channel}["']`));
    assert.match(mainSource, new RegExp(`ipcMain\\.handle\\(["']${channel}["']`));
  }
  assert.doesNotMatch(preloadSource, /get(?:Access|Refresh)?Token|clientSecret|secretReference/i);
  assert.match(mainSource, /safeStorage/);
});

test("reliable external object context is reused before URL-only tab matching", () => {
  const transientOpen = sourceBetween(
    "async function openTransientBrowserTab",
    "function safeZohoTicketNavigationUrl",
  );
  assert.match(transientOpen, /findRuntimeTabByReliableContext\(workspace, options\.reliableContext\)/);
  assert.match(transientOpen, /findDuplicateRuntimeTab\(workspace, null, url\)/);
});

test("safe foreground GET popups become transient tabs without navigating the opener", () => {
  const ensureSiteView = sourceBetween(
    "function ensureSiteView",
    "async function activateWorkspaceBrowserContext",
  );
  const openHandlerStart = ensureSiteView.indexOf("setWindowOpenHandler");
  const openHandlerEnd = ensureSiteView.indexOf("view.webContents.on(\"will-navigate\"", openHandlerStart);
  assert.ok(openHandlerStart >= 0 && openHandlerEnd > openHandlerStart);
  const openHandler = ensureSiteView.slice(openHandlerStart, openHandlerEnd);

  assert.match(openHandler, /const \{ url, disposition, postBody \} = details/);
  assert.match(openHandler, /!postBody/);
  assert.match(openHandler, /disposition === ["']default["']/);
  assert.match(openHandler, /disposition === ["']foreground-tab["']/);
  assert.match(openHandler, /openTransientBrowserTab\(context\.workspaceId, url\)/);
  assert.match(openHandler, /return \{ action: ["']deny["'] \}/);

  // A GET popup must not replace the URL in the WebContentsView that opened it.
  assert.doesNotMatch(openHandler, /(?:loadURL|loadUrlAllowingRedirectAbort)\s*\(\s*(?:view|context\.view)\.webContents/);

  // POST-backed login/SAML popups remain usable, but inherit the hardened shared session.
  assert.match(openHandler, /isSafeWebUrl\(url\) && postBody/);
  assert.match(openHandler, /action: ["']allow["']/);
  assert.match(
    openHandler,
    /partition:\s*browserPartitionForProfile\(context\.browserProfileId\)/,
  );
  assert.match(openHandler, /nodeIntegration:\s*false/);
  assert.match(openHandler, /contextIsolation:\s*true/);
  assert.match(openHandler, /sandbox:\s*true/);
});

test("transient popup dedupe is scoped to one workspace and uses an exact normalized URL", () => {
  const duplicateFinder = sourceBetween(
    "function findDuplicateRuntimeTab",
    "async function createRuntimeBrowserTab",
  );
  const transientOpen = sourceBetween(
    "async function openTransientBrowserTab",
    "async function showBrowser",
  );

  assert.match(duplicateFinder, /const normalizedURL = normalizeUrl\(url\)/);
  assert.match(duplicateFinder, /!tab\.currentSiteId/);
  assert.match(duplicateFinder, /tab\.browserState\.currentURL === normalizedURL/);
  assert.match(duplicateFinder, /tab\.currentHomeUrl === normalizedURL/);
  assert.doesNotMatch(duplicateFinder, /startsWith|includes|origin|hostname|searchParams/);

  assert.match(transientOpen, /ensureWorkspaceBrowserContext\(workspaceId, snapshot\)/);
  assert.match(transientOpen, /findDuplicateRuntimeTab\(workspace, null, url\)/);
  assert.match(transientOpen, /createRuntimeBrowserTab\(workspace/);
  assert.doesNotMatch(transientOpen, /for \(const .*workspaceBrowserContexts/);
});

test("tabs that later navigate to one URL are reconciled before persistence without throwing from navigation events", () => {
  const reconcile = sourceBetween(
    "function reconcileRuntimeDuplicateTabs",
    "function persistWorkspaceBrowserContext",
  );
  const persist = sourceBetween(
    "function persistWorkspaceBrowserContext",
    "function sanitizeBounds",
  );

  assert.match(reconcile, /const activeTab = activeBrowserContext\(workspace\)/);
  assert.match(reconcile, /\.\.\.\(activeTab \? \[activeTab\] : \[\]\)/);
  assert.match(reconcile, /if \(tab\.allowDuplicate\) continue/);
  assert.match(reconcile, /tab\.currentSiteId \? `site:\$\{tab\.currentSiteId\}` : `url:\$\{url\}`/);
  assert.match(reconcile, /workspace\.tabs\.delete\(tab\.tabId\)/);
  assert.match(reconcile, /destroySiteView\(tab\)/);

  const reconcileAt = persist.indexOf("reconcileRuntimeDuplicateTabs(workspace)");
  const mutationAt = persist.indexOf("setWorkspaceBrowserTabsInState(");
  assert.ok(reconcileAt >= 0 && mutationAt > reconcileAt);
  assert.match(persist, /try\s*\{[\s\S]*setWorkspaceBrowserTabsInState\(/);
  assert.match(persist, /catch \(error\)\s*\{[\s\S]*return;/);
});

test("explicit tab and site copies bypass open-time dedupe while ordinary opens keep it", () => {
  const ordinaryOpen = sourceBetween(
    "async function showBrowser",
    "async function workspaceForExplicitDuplicate",
  );
  const duplicateBrowser = sourceBetween(
    "async function duplicateBrowserTab",
    "async function duplicateSiteTab",
  );
  const duplicateSite = sourceBetween(
    "async function duplicateSiteTab",
    "async function openSiteById",
  );
  const createTab = sourceBetween(
    "async function createRuntimeBrowserTab",
    "async function openTransientBrowserTab",
  );
  const restoreTab = sourceBetween(
    "function createRuntimeTab",
    "function ensureWorkspaceBrowserContext",
  );
  const persist = sourceBetween(
    "function persistWorkspaceBrowserContext",
    "function sanitizeBounds",
  );

  assert.match(ordinaryOpen, /findDuplicateRuntimeTab\(workspace, siteId, url\)/);
  assert.doesNotMatch(ordinaryOpen, /allowDuplicate:\s*true/);
  assert.match(duplicateBrowser, /runtimeTabURL\(source\)/);
  assert.match(duplicateBrowser, /allowDuplicate:\s*true/);
  assert.match(duplicateBrowser, /browserProfileId:\s*source\.browserProfileId/);
  assert.match(duplicateBrowser, /insertAfterTabId:\s*source\.tabId/);
  assert.match(duplicateBrowser, /createRuntimeBrowserTab\(workspace/);
  assert.doesNotMatch(duplicateBrowser, /findDuplicateRuntimeTab/);
  assert.match(duplicateSite, /candidate\.id === String\(payload\?\.siteId/);
  assert.match(duplicateSite, /allowDuplicate:\s*true/);
  assert.doesNotMatch(duplicateSite, /findDuplicateRuntimeTab/);
  assert.match(createTab, /allowDuplicate:\s*input\.allowDuplicate === true/);
  assert.match(createTab, /workspace\.tabs = reordered/);
  assert.match(restoreTab, /allowDuplicate:\s*persisted\.allowDuplicate === true/);
  assert.match(persist, /tab\.allowDuplicate \? \{ allowDuplicate: true \} : \{\}/);
});

test("detach and reattach move the same tab view and report one webContents identity", () => {
  const detach = sourceBetween(
    "async function detachBrowserTab",
    "async function reattachBrowserTab",
  );
  const reattach = sourceBetween(
    "async function reattachBrowserTab",
    "function focusDetachedBrowserTab",
  );

  assert.match(detach, /detachSiteViewFromOwner\(tab\)/);
  assert.match(detach, /attachSiteViewToDetached\(tab\)/);
  assert.match(detach, /webContentsId:\s*tab\.view\.webContents\.id/);
  assert.doesNotMatch(detach, /new WebContentsView/);

  assert.match(reattach, /const webContentsId = tab\.view\?\.webContents\.id \|\| null/);
  assert.match(reattach, /closeDetachedWindow\(tab, ["']reattach["']\)/);
  assert.match(reattach, /attachSiteView\(tab\)/);
  assert.match(reattach, /webContentsId/);
  assert.doesNotMatch(reattach, /new WebContentsView|new BrowserWindow/);
});

test("closing the active tab chooses its right neighbor, then left, then an empty group", () => {
  const close = sourceBetween(
    "async function closeBrowserTab",
    "function detachedTabForSender",
  );

  assert.match(close, /const closedIndex = orderedTabs\.findIndex/);
  assert.match(close, /workspace\.tabs\.delete\(tab\.tabId\)/);
  assert.match(
    close,
    /remaining\[Math\.min\(closedIndex, remaining\.length - 1\)\]\?\.tabId \|\| null/,
  );
  assert.match(close, /persistWorkspaceBrowserWorkspace\(workspace\)/);
});

test("all tab WebContentsViews keep the single real persistent browser identity", () => {
  assert.match(mainSource, /const SITE_PARTITION = ["']persist:qiye-sites["']/);
  const ensureSiteView = sourceBetween(
    "function ensureSiteView",
    "async function activateWorkspaceBrowserContext",
  );
  assert.match(
    ensureSiteView,
    /partition:\s*browserPartitionForProfile\(context\.browserProfileId\)/,
  );
  assert.doesNotMatch(mainSource, /persist:qiye-(?:personal|work|research)/);
  assert.doesNotMatch(
    ensureSiteView,
    /partition:\s*[^\n]*(?:workspaceId|activeBrowserWorkspaceId)/,
  );
});

test("Google OAuth and Drive requests use Electron networking so Windows proxy settings apply", () => {
  assert.match(mainSource, /\bnet,\s*\n\s*safeStorage/);
  assert.match(
    mainSource,
    /fetchFn:\s*\(\.\.\.args\)\s*=>\s*net\.fetch\(\.\.\.args\)/,
  );
  assert.doesNotMatch(
    mainSource,
    /fetchFn:\s*\(\.\.\.args\)\s*=>\s*fetch\(\.\.\.args\)/,
  );
});
