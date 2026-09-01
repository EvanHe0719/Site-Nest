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
const managedPopupSource = fs.readFileSync(
  path.join(projectRoot, "electron", "browser", "managed-popup-service.cjs"),
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
    ["showBrowserTabGroupContextMenu", "browser:show-tab-group-context-menu"],
    ["duplicateSiteTab", "sites:duplicate-tab"],
    ["closeBrowserTab", "browser:close-tab"],
    ["restoreRecentlyClosedBrowserTab", "browser:restore-closed-tab"],
    ["detachBrowserTab", "browser:detach-tab"],
    ["reattachBrowserTab", "browser:reattach-tab"],
    ["focusDetachedBrowserTab", "browser:focus-detached-tab"],
    ["createTabGroup", "tab-groups:create"],
    ["updateTabGroup", "tab-groups:update"],
    ["assignTabsToGroup", "tab-groups:assign-tabs"],
    ["reorderBrowserTabs", "tab-groups:reorder-tabs"],
    ["reorderTabGroups", "tab-groups:reorder-groups"],
    ["mergeTabGroups", "tab-groups:merge"],
    ["undoTabGroupMerge", "tab-groups:undo-merge"],
    ["ungroupTabGroup", "tab-groups:ungroup"],
    ["deleteEmptyTabGroup", "tab-groups:delete-empty"],
    ["closeTabGroup", "tab-groups:close"],
    ["suggestSiteTabGroups", "tab-groups:suggest-sites"],
    ["detectDuplicateTabs", "tab-groups:detect-duplicates"],
    ["resolveDuplicateTabs", "tab-groups:resolve-duplicates"],
  ];

  for (const [method, channel] of contracts) {
    assert.match(preloadSource, new RegExp(`${method}\\s*:`));
    assert.match(preloadSource, new RegExp(`ipcRenderer\\.invoke\\(["']${channel}["']`));
    assert.match(mainSource, new RegExp(`ipcMain\\.handle\\(["']${channel}["']`));
  }

  assert.match(
    preloadSource,
    /browser:close-tab["'],\s*\{\s*tabId,\s*bounds,\s*userInitiated:\s*true\s*\}/,
  );
  assert.doesNotMatch(preloadSource, /WebContentsView|BrowserWindow|require\([^)]*main/);
});

test("Zoho verification URLs preserve their trusted Desk target and list refresh stays inside the page", () => {
  assert.match(mainSource, /const returnUrl = zohoDeskAuthReturnUrl\(currentUrl\)/);
  assert.match(mainSource, /if \(isZohoDeskTicketListUrl\(currentUrl\)\)/);
  assert.match(mainSource, /await refreshZohoDeskTicketList\(contents\)/);
  assert.match(mainSource, /await loadUrlAllowingRedirectAbort\(contents, returnUrl \|\| currentUrl\)/);
  assert.match(mainSource, /const url = durableBrowserUrl\(observedTabUrl\)/);
  assert.match(mainSource, /const restoredUrl = durableBrowserUrl\(requestedUrl\)/);
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
  assert.match(nativeMenu, /label:\s*["']开启或退出画中画["']/);
  assert.match(nativeMenu, /label:\s*["']视频全屏["']/);
  assert.match(nativeMenu, /browserMediaCapabilityService\.togglePictureInPicture/);
  assert.match(nativeMenu, /browserMediaCapabilityService\.toggleVideoFullscreen/);
  assert.match(nativeMenu, /label:\s*["']关闭页签["']/);
  assert.match(nativeMenu, /label:\s*["']添加到分组["']/);
  assert.match(nativeMenu, /label:\s*["']将相同站点页签分组…?["']/);
  assert.match(nativeMenu, /label:\s*["']整理重复页签…?["']/);
  assert.match(nativeMenu, /label:\s*["']恢复最近关闭的页签["']/);
  assert.match(nativeMenu, /BrowserWindow\.fromWebContents\(event\.sender\)/);
  assert.match(nativeMenu, /menu\.popup\(/);
  assert.match(nativeMenu, /function showBrowserTabGroupContextMenu/);
  assert.match(nativeMenu, /label:\s*["']重命名与修改标识…?["']/);
  assert.match(nativeMenu, /label:\s*["']合并到其他分组["']/);
  assert.match(nativeMenu, /label:\s*["']关闭分组中的页签["']/);
});

test("recently closed tabs are persisted and restored into an existing original group", () => {
  const close = sourceBetween(
    "async function closeBrowserTab",
    "function rememberRecentlyClosedBrowserTab",
  );
  const restore = sourceBetween(
    "async function restoreRecentlyClosedBrowserTab",
    "function detachedTabForSender",
  );
  assert.match(close, /rememberRecentlyClosedBrowserTab\(workspace, tab, closedIndex\)/);
  assert.match(restore, /candidate\.id === record\.tabGroupId/);
  assert.match(restore, /!candidate\.deletedAt/);
  assert.match(restore, /tabGroupId:\s*group\?\.id \|\| null/);
  assert.match(restore, /browserProfileId:\s*record\.browserProfileId/);
  assert.match(restore, /allowDuplicate:\s*true/);
  assert.match(restore, /cachedState\.recentlyClosedTabs = records\.filter/);
});

test("group merge mutates metadata only and duplicate cleanup is explicit and protection-aware", () => {
  const merge = sourceBetween(
    "async function mergeTabGroupsOperation",
    "async function undoTabGroupMergeOperation",
  );
  const protection = sourceBetween(
    "async function runtimeTabProtection",
    "async function suspendRuntimeTab",
  );
  const resolveDuplicates = sourceBetween(
    "async function resolveDuplicateTabsOperation",
    "function showBrowserTabContextMenu",
  );

  assert.match(merge, /mergeTabGroups\(/);
  assert.match(merge, /applyOrganizationTabRecords\(workspace, result\.tabs\)/);
  assert.match(merge, /lastTabGroupMergeUndo = result\.undo/);
  assert.doesNotMatch(merge, /new WebContentsView|loadURL|destroySiteView|createRuntimeBrowserTab/);

  assert.match(protection, /isCurrentlyAudible/);
  assert.match(protection, /hasActiveDownload/);
  assert.match(protection, /input\[type=["']file["']\]/);
  assert.match(protection, /beforeunload/);
  assert.match(protection, /hasZohoDraft/);
  assert.match(resolveDuplicates, /normalizeComparableTabUrl/);
  assert.match(resolveDuplicates, /await runtimeTabProtection\(found\.tab\)/);
  assert.match(resolveDuplicates, /await closeBrowserTab\(\{ tabId, force: true \}\)/);
  assert.doesNotMatch(resolveDuplicates, /setInterval|setTimeout|auto/i);
});

test("search IPC stays narrow and reuses the current workspace tab model and browser profile", () => {
  const contracts = [
    ["getSearchState", "search:get-state"],
    ["resolveSearchInput", "search:resolve-input"],
    ["updateSearchSettings", "search:update-settings"],
    ["removeSearchHistory", "search:remove-history"],
    ["clearSearchHistory", "search:clear-history"],
    ["openSearchInput", "browser:open-input"],
  ];
  for (const [method, channel] of contracts) {
    assert.match(preloadSource, new RegExp(`${method}\\s*:`));
    assert.match(preloadSource, new RegExp(`ipcRenderer\\.invoke\\(["']${channel}["']`));
    assert.match(mainSource, new RegExp(`ipcMain\\.handle\\(["']${channel}["']`));
  }

  const searchOpen = sourceBetween(
    "async function openSearchInput",
    "function safeZohoTicketNavigationUrl",
  );
  assert.match(searchOpen, /openTransientBrowserTab\(workspaceId, target\.url/);
  assert.match(searchOpen, /activeTab\?\.browserProfileId/);
  assert.match(searchOpen, /allowDuplicate:\s*disposition === ["']new["']/);
  assert.match(searchOpen, /navigateBrowserContextToTarget\(activeTab, target\)/);
  assert.doesNotMatch(searchOpen, /addSiteToState|sites:add|browserPartitionForProfile\([^)]*workspaceId/);
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
  assert.match(ensureSiteView, /managedPopups\.attachToWebContents/);
  assert.match(managedPopupSource, /decision\.kind === ["']tab["']/);
  assert.match(managedPopupSource, /decision\.kind === ["']background-tab["']/);
  assert.match(managedPopupSource, /this\.openTab\(details\.url/);
  assert.match(managedPopupSource, /return \{ action: ["']deny["'] \}/);

  // A GET popup must not replace the URL in the WebContentsView that opened it.
  assert.doesNotMatch(managedPopupSource, /(?:loadURL|loadUrlAllowingRedirectAbort)\s*\(\s*(?:view|context\.view)\.webContents/);

  // POST-backed login/SAML popups remain usable, but inherit the hardened shared session.
  assert.match(managedPopupSource, /decision\.kind === ["']popup["']/);
  assert.match(managedPopupSource, /action: ["']allow["']/);
  assert.match(
    managedPopupSource,
    /partition:\s*this\.browserPartitionForProfile\(context\.browserProfileId\)/,
  );
  assert.match(managedPopupSource, /nodeIntegration:\s*false/);
  assert.match(managedPopupSource, /contextIsolation:\s*true/);
  assert.match(managedPopupSource, /sandbox:\s*true/);
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

test("tabs that later navigate to one URL are marked as duplicate candidates without background closing", () => {
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
  assert.match(reconcile, /tab\.allowDuplicate = true/);
  assert.doesNotMatch(reconcile, /workspace\.tabs\.delete\(tab\.tabId\)/);
  assert.doesNotMatch(reconcile, /destroySiteView\(tab\)/);

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

test("tab WebContentsViews use the selected persistent profile without workspace partitions", () => {
  assert.match(mainSource, /const SITE_PARTITION = ["']persist:qiye-sites["']/);
  assert.match(
    mainSource,
    /const SAP_SITE_PARTITION = ["']persist:qiye-sap-support["']/,
  );
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

test("selected WebContentsView attaches before loadURL and navigation remains non-blocking", () => {
  const select = sourceBetween(
    "async function selectBrowserTab",
    "function findDuplicateRuntimeTab",
  );
  const ensureRuntime = sourceBetween(
    "function ensureRuntimeTabView",
    "async function waitForRuntimeTabNavigation",
  );
  const createAt = select.indexOf("ensureSiteView(tab)");
  const attachAt = select.indexOf("attachSiteView(tab)");
  const navigateAt = select.indexOf("ensureRuntimeTabView(tab)");

  assert.ok(createAt >= 0 && attachAt > createAt && navigateAt > attachAt);
  assert.match(ensureRuntime, /return loadUrlAllowingRedirectAbort/);
  assert.doesNotMatch(ensureRuntime, /await loadUrlAllowingRedirectAbort/);
  assert.match(ensureRuntime, /tab\.pendingNavigation = navigationPromise/);
});

test("SAP repair suspends every SAP-profile runtime before resetting the partition and restores only the current tab", () => {
  const repair = sourceBetween(
    "async function repairSapSession",
    "function ensureSiteView",
  );
  const enumerateTabsAt = repair.indexOf("allRuntimeTabs()");
  const destroyViewAt = repair.indexOf("destroySiteView(");
  const closePopupsAt = repair.indexOf("closeForBrowserProfile(");
  const clearAuthenticationAt = repair.indexOf("clearSapAuthenticationState(");
  const restoreCurrentAt = repair.indexOf("ensureSiteView(context)");

  assert.ok(enumerateTabsAt >= 0, "SAP repair must inspect all runtime tabs");
  assert.match(
    repair,
    /browserProfileId\s*===\s*SAP_BROWSER_PROFILE_ID/,
    "only the sap-support profile should be suspended",
  );
  assert.ok(
    destroyViewAt > enumerateTabsAt && destroyViewAt < clearAuthenticationAt,
    "every SAP WebContentsView must stop before partition data is cleared",
  );
  assert.ok(
    closePopupsAt >= 0 && closePopupsAt < clearAuthenticationAt,
    "managed SAP popup windows must stop before partition data is cleared",
  );
  assert.match(repair, /clearEntirePartition:\s*true/);
  assert.doesNotMatch(
    repair,
    /(?:workspace\.)?tabs\.(?:delete|clear)\s*\(|closeBrowserTab\s*\(/,
    "repair must keep persisted/runtime tab entries",
  );
  assert.ok(
    restoreCurrentAt > clearAuthenticationAt,
    "the selected tab should be recreated only after the reset finishes",
  );
  assert.equal(
    repair.match(/ensureSiteView\s*\(/g)?.length || 0,
    1,
    "background SAP tabs must remain suspended after repair",
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

test("Google Drive renderer bridge exposes stateful operations but never tokens or arbitrary API calls", () => {
  const contracts = [
    ["googleSyncStatus", "google:sync-status"],
    ["googleSignIn", "google:sign-in"],
    ["googleSyncNow", "google:sync-now"],
    ["googleRestoreFromCloud", "google:restore"],
    ["googleTestConnection", "google:test-connection"],
    ["googleResolveConflict", "google:resolve-conflict"],
  ];
  for (const [method, channel] of contracts) {
    assert.match(preloadSource, new RegExp(`${method}\\s*:`));
    assert.match(preloadSource, new RegExp(`ipcRenderer\\.invoke\\(["']${channel}["']`));
    assert.match(mainSource, new RegExp(`ipcMain\\.handle\\(["']${channel}["']`));
  }
  assert.doesNotMatch(preloadSource, /google(?:Get)?(?:Access|Refresh)?Token|driveRequest|authorizationHeader/i);
  assert.match(mainSource, /grantedScopes:\s*publicGrantedScopes/);
});
