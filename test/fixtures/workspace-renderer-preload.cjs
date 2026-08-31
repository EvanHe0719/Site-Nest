const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("siteNest", {
  getState: () => ipcRenderer.invoke("workspace-harness:get-state"),
  getShortcuts: () => ipcRenderer.invoke("workspace-harness:get-shortcuts"),
  updateShortcut: (input) => ipcRenderer.invoke("workspace-harness:update-shortcut", input),
  resetShortcuts: (options) => ipcRenderer.invoke("workspace-harness:reset-shortcuts", options),
  dispatchShortcut: (request) => ipcRenderer.invoke("workspace-harness:dispatch-shortcut", request),
  getSearchState: () => ipcRenderer.invoke("workspace-harness:get-search-state"),
  resolveSearchInput: (input, engineId) =>
    ipcRenderer.invoke("workspace-harness:resolve-search-input", { input, engineId }),
  updateSearchSettings: (patch) =>
    ipcRenderer.invoke("workspace-harness:update-search-settings", patch),
  removeSearchHistory: (historyId) =>
    ipcRenderer.invoke("workspace-harness:remove-search-history", { historyId }),
  clearSearchHistory: () => ipcRenderer.invoke("workspace-harness:clear-search-history"),
  openSearchInput: (payload) =>
    ipcRenderer.invoke("workspace-harness:open-search-input", payload),
  setActiveWorkspace: (workspaceId) =>
    ipcRenderer.invoke("workspace-harness:set-active", workspaceId),
  updateUiSettings: (patch) =>
    ipcRenderer.invoke("workspace-harness:update-ui-settings", patch),
  getSystemInfo: () => Promise.resolve({ dataFile: "<workspace-renderer-harness>" }),
  getChromeProfiles: () => ipcRenderer.invoke("workspace-harness:chrome-profiles"),
  importChromeBookmarks: (profileId) =>
    ipcRenderer.invoke("workspace-harness:chrome-import", { profileId }),
  clearChromeBookmarks: () => ipcRenderer.invoke("workspace-harness:chrome-clear"),
  getTasks: () => ipcRenderer.invoke("workspace-harness:get-tasks"),
  getConnectorStatus: (connectorType) =>
    ipcRenderer.invoke("workspace-harness:get-connector-status", { connectorType }),
  configureConnector: (connectorType, config) =>
    ipcRenderer.invoke("workspace-harness:configure-connector", { connectorType, config }),
  getAssistants: () => Promise.resolve({ assistants: [] }),
  getExecutionLogs: () => Promise.resolve({ logs: [] }),
  googleSyncStatus: () => ipcRenderer.invoke("workspace-harness:google-sync-status"),
  googleSignIn: () => ipcRenderer.invoke("workspace-harness:google-sign-in"),
  googleSignOut: () => ipcRenderer.invoke("workspace-harness:google-sign-out"),
  googleSyncNow: () => ipcRenderer.invoke("workspace-harness:google-sync-now"),
  googleRestoreFromCloud: () =>
    ipcRenderer.invoke("workspace-harness:google-restore-from-cloud"),
  googleTestConnection: () => ipcRenderer.invoke("workspace-harness:google-test-connection"),
  googleResolveConflict: (strategy) =>
    ipcRenderer.invoke("workspace-harness:google-resolve-conflict", { strategy }),
  getAutomationStatus: () =>
    Promise.resolve({
      naixi: {
        enabled: false,
        time: "08:30",
        status: "disabled",
        message: "测试夹具未启用自动化",
        lastRunAt: null,
      },
    }),
  showBrowser: (payload) =>
    ipcRenderer.invoke("workspace-harness:show-browser", payload),
  hideBrowser: () => ipcRenderer.send("workspace-harness:hide-browser"),
  setBrowserBounds: (bounds) =>
    ipcRenderer.send("workspace-harness:set-browser-bounds", bounds),
  browserAction: () => Promise.resolve({ ok: true }),
  selectBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("workspace-harness:select-tab", { tabId, bounds }),
  closeBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("workspace-harness:close-tab", { tabId, bounds }),
  detachBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("workspace-harness:detach-tab", { tabId, bounds }),
  reattachBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("workspace-harness:reattach-tab", { tabId, bounds }),
  focusDetachedBrowserTab: (tabId) =>
    ipcRenderer.invoke("workspace-harness:focus-tab", { tabId }),
  duplicateBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("workspace-harness:duplicate-tab", { tabId, bounds }),
  copyBrowserTabUrl: (tabId) =>
    ipcRenderer.invoke("workspace-harness:copy-tab-url", { tabId }),
  openBrowserTabExternal: (tabId) =>
    ipcRenderer.invoke("workspace-harness:open-tab-external", { tabId }),
  showBrowserTabContextMenu: (tabId) =>
    ipcRenderer.invoke("workspace-harness:show-tab-context-menu", { tabId }),
  createTabGroup: (input) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-create", input),
  updateTabGroup: (groupId, patch) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-update", { groupId, patch }),
  assignTabsToGroup: (workspaceId, tabIds, groupId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-assign", { workspaceId, tabIds, groupId }),
  reorderBrowserTabs: (workspaceId, tabIds) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-reorder-tabs", { workspaceId, tabIds }),
  reorderTabGroups: (workspaceId, groupIds) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-reorder-groups", { workspaceId, groupIds }),
  mergeTabGroups: (sourceGroupId, targetGroupId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-merge", { sourceGroupId, targetGroupId }),
  undoTabGroupMerge: () => ipcRenderer.invoke("workspace-harness:tab-groups-undo"),
  ungroupTabGroup: (groupId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-ungroup", { groupId }),
  deleteEmptyTabGroup: (groupId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-delete-empty", { groupId }),
  closeTabGroup: (groupId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-close", { groupId }),
  suggestSiteTabGroups: (workspaceId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-suggest-sites", { workspaceId }),
  detectDuplicateTabs: (workspaceId) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-detect-duplicates", { workspaceId }),
  resolveDuplicateTabs: (keeperTabId, closeTabIds) =>
    ipcRenderer.invoke("workspace-harness:tab-groups-resolve-duplicates", { keeperTabId, closeTabIds }),
  setHarnessTabContextMenuAction: (action) =>
    ipcRenderer.invoke("workspace-harness:set-tab-context-menu-action", { action }),
  duplicateSiteTab: (siteId, bounds) =>
    ipcRenderer.invoke("workspace-harness:duplicate-site", { siteId, bounds }),
  onBrowserState: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("workspace-harness:browser-state", listener);
    return () => ipcRenderer.removeListener("workspace-harness:browser-state", listener);
  },
  onShortcutTrigger: () => () => undefined,
  onAutomationStatus: () => () => undefined,
});
