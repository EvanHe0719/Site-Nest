const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("siteNest", {
  getState: () => ipcRenderer.invoke("workspace-harness:get-state"),
  setActiveWorkspace: (workspaceId) =>
    ipcRenderer.invoke("workspace-harness:set-active", workspaceId),
  updateUiSettings: (patch) =>
    ipcRenderer.invoke("workspace-harness:update-ui-settings", patch),
  getSystemInfo: () => Promise.resolve({ dataFile: "<workspace-renderer-harness>" }),
  getChromeProfiles: () => ipcRenderer.invoke("workspace-harness:chrome-profiles"),
  importChromeBookmarks: (profileId) =>
    ipcRenderer.invoke("workspace-harness:chrome-import", { profileId }),
  clearChromeBookmarks: () => ipcRenderer.invoke("workspace-harness:chrome-clear"),
  getAssistants: () => Promise.resolve({ assistants: [] }),
  getExecutionLogs: () => Promise.resolve({ logs: [] }),
  googleSyncStatus: () => ipcRenderer.invoke("workspace-harness:google-sync-status"),
  googleSignIn: () => ipcRenderer.invoke("workspace-harness:google-sign-in"),
  googleSignOut: () => ipcRenderer.invoke("workspace-harness:google-sign-out"),
  googleSyncNow: () => ipcRenderer.invoke("workspace-harness:google-sync-now"),
  googleRestoreFromCloud: () =>
    ipcRenderer.invoke("workspace-harness:google-restore-from-cloud"),
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
  setHarnessTabContextMenuAction: (action) =>
    ipcRenderer.invoke("workspace-harness:set-tab-context-menu-action", { action }),
  duplicateSiteTab: (siteId, bounds) =>
    ipcRenderer.invoke("workspace-harness:duplicate-site", { siteId, bounds }),
  onBrowserState: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("workspace-harness:browser-state", listener);
    return () => ipcRenderer.removeListener("workspace-harness:browser-state", listener);
  },
  onAutomationStatus: () => () => undefined,
});
