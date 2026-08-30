const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("siteNest", {
  getState: () => ipcRenderer.invoke("state:get"),
  setActiveWorkspace: (workspaceId) =>
    ipcRenderer.invoke("workspace:set-active", workspaceId),
  updateUiSettings: (patch) => ipcRenderer.invoke("settings:update-ui", patch),
  addSite: (site) => ipcRenderer.invoke("sites:add", site),
  updateSite: (site) => ipcRenderer.invoke("sites:update", site),
  deleteSite: (siteId) => ipcRenderer.invoke("sites:delete", siteId),
  reorderSite: (input) => ipcRenderer.invoke("sites:reorder", input),
  toggleSitePin: (siteId) => ipcRenderer.invoke("sites:toggle-pin", siteId),
  openSite: (siteId, bounds) =>
    ipcRenderer.invoke("sites:open", { siteId, bounds }),
  getChromeProfiles: () => ipcRenderer.invoke("chrome:profiles"),
  importChromeBookmarks: (profileId) =>
    ipcRenderer.invoke("chrome:import", profileId),
  clearChromeBookmarks: () => ipcRenderer.invoke("chrome:clear-import"),
  googleSyncStatus: () => ipcRenderer.invoke("google:sync-status"),
  googleSignIn: () => ipcRenderer.invoke("google:sign-in"),
  googleSignOut: () => ipcRenderer.invoke("google:sign-out"),
  googleSyncNow: () => ipcRenderer.invoke("google:sync-now"),
  googleRestoreFromCloud: () => ipcRenderer.invoke("google:restore"),
  listConnectors: () => ipcRenderer.invoke("connectors:list"),
  getConnectorStatus: (connectorType) =>
    ipcRenderer.invoke("connectors:get-status", connectorType),
  configureConnector: (connectorType, publicConfig) =>
    ipcRenderer.invoke("connectors:configure", { connectorType, publicConfig }),
  connectConnector: (connectorType) =>
    ipcRenderer.invoke("connectors:connect", connectorType),
  disconnectConnector: (connectorType) =>
    ipcRenderer.invoke("connectors:disconnect", connectorType),
  getZohoDashboard: () => ipcRenderer.invoke("connectors:get-dashboard"),
  refreshZohoDashboard: () => ipcRenderer.invoke("connectors:refresh-dashboard"),
  cancelZohoDashboardRefresh: () => ipcRenderer.invoke("connectors:cancel-dashboard"),
  getZohoTicketContext: (ticketId) =>
    ipcRenderer.invoke("connectors:get-ticket-context", ticketId),
  openZohoTicket: (ticketId, title, webUrl, bounds) =>
    ipcRenderer.invoke("browser:open-zoho-ticket", { ticketId, title, webUrl, bounds }),
  getSystemInfo: () => ipcRenderer.invoke("system:info"),
  openDataFolder: () => ipcRenderer.invoke("system:open-data-folder"),
  openExternal: (url) => ipcRenderer.invoke("system:open-external", url),
  showBrowser: (payload) => ipcRenderer.invoke("browser:show", payload),
  hideBrowser: () => ipcRenderer.send("browser:hide"),
  setBrowserBounds: (bounds) => ipcRenderer.send("browser:bounds", bounds),
  browserAction: (action, value) =>
    ipcRenderer.invoke("browser:action", { action, value }),
  selectBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:select-tab", { tabId, bounds }),
  duplicateBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:duplicate-tab", { tabId, bounds }),
  copyBrowserTabUrl: (tabId) =>
    ipcRenderer.invoke("browser:copy-tab-url", { tabId }),
  openBrowserTabExternal: (tabId) =>
    ipcRenderer.invoke("browser:open-tab-external", { tabId }),
  showBrowserTabContextMenu: (tabId) =>
    ipcRenderer.invoke("browser:show-tab-context-menu", { tabId }),
  showAddressContextMenu: () =>
    ipcRenderer.invoke("browser:show-address-context-menu"),
  getTranslationStatus: () => ipcRenderer.invoke("translation:status"),
  configureTranslation: (payload) => ipcRenderer.invoke("translation:configure", payload),
  testTranslation: (payload) => ipcRenderer.invoke("translation:test", payload),
  showTranslationPageMenu: () => ipcRenderer.invoke("translation:show-page-menu"),
  getTasks: () => ipcRenderer.invoke("tasks:get"),
  addTask: (task) => ipcRenderer.invoke("tasks:add", task),
  updateTask: (task) => ipcRenderer.invoke("tasks:update", task),
  deleteTask: (taskId) => ipcRenderer.invoke("tasks:delete", taskId),
  setTaskStatus: (taskId, status) => ipcRenderer.invoke("tasks:set-status", { taskId, status }),
  snoozeTaskReminder: (reminderId, minutes) => ipcRenderer.invoke("tasks:snooze", { reminderId, minutes }),
  dismissTaskReminder: (reminderId) => ipcRenderer.invoke("tasks:dismiss-reminder", reminderId),
  updateTaskSettings: (patch) => ipcRenderer.invoke("tasks:update-settings", patch),
  getUserScripts: () => ipcRenderer.invoke("userscripts:list"),
  reviewPastedUserScript: (sourceCode, options = {}) => ipcRenderer.invoke("userscripts:review-pasted", { sourceCode, ...options }),
  reviewRemoteUserScript: (sourceUrl, options = {}) => ipcRenderer.invoke("userscripts:review-remote", { sourceUrl, ...options }),
  reviewLocalUserScriptFile: () => ipcRenderer.invoke("userscripts:review-local-file"),
  confirmUserScriptInstall: (reviewToken) => ipcRenderer.invoke("userscripts:confirm-install", reviewToken),
  setUserScriptEnabled: (scriptId, enabled) => ipcRenderer.invoke("userscripts:set-enabled", { scriptId, enabled }),
  setUserScriptSiteApproved: (scriptId, approved) => ipcRenderer.invoke("userscripts:set-site-approved", { scriptId, approved }),
  removeUserScript: (scriptId) => ipcRenderer.invoke("userscripts:remove", scriptId),
  checkUserScriptUpdate: (scriptId) => ipcRenderer.invoke("userscripts:check-update", scriptId),
  getUserScriptCommands: () => ipcRenderer.invoke("userscripts:commands"),
  executeUserScriptCommand: (scriptId, commandId) => ipcRenderer.invoke("userscripts:execute-command", { scriptId, commandId }),
  runRestoreCopyScript: () => ipcRenderer.invoke("userscripts:run-restore-copy"),
  duplicateSiteTab: (siteId, bounds) =>
    ipcRenderer.invoke("sites:duplicate-tab", { siteId, bounds }),
  closeBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:close-tab", { tabId, bounds }),
  detachBrowserTab: (tabId, windowBounds) =>
    ipcRenderer.invoke("browser:detach-tab", { tabId, windowBounds }),
  reattachBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:reattach-tab", { tabId, bounds }),
  focusDetachedBrowserTab: (tabId) =>
    ipcRenderer.invoke("browser:focus-detached-tab", { tabId }),
  getAssistants: () => ipcRenderer.invoke("assistants:list"),
  setAssistantEnabled: (assistantId, enabled) =>
    ipcRenderer.invoke("assistants:set-enabled", { assistantId, enabled }),
  getPageActions: () => ipcRenderer.invoke("assistants:page-actions"),
  executePageAction: (assistantId, actionId) =>
    ipcRenderer.invoke("assistants:execute", { assistantId, actionId }),
  getExecutionLogs: () => ipcRenderer.invoke("assistants:logs"),
  getAutomationStatus: () => ipcRenderer.invoke("automation:get"),
  runNaixiCheckin: () => ipcRenderer.invoke("automation:run-naixi"),
  updateNaixiAutomation: (settings) =>
    ipcRenderer.invoke("automation:update-naixi", settings),
  onBrowserState: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("browser:state", listener);
    return () => ipcRenderer.removeListener("browser:state", listener);
  },
  onBrowserNotice: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("browser:notice", listener);
    return () => ipcRenderer.removeListener("browser:notice", listener);
  },
  onOpenPageActions: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("assistants:open-panel", listener);
    return () => ipcRenderer.removeListener("assistants:open-panel", listener);
  },
  onOpenTranslationSettings: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("translation:open-settings", listener);
    return () => ipcRenderer.removeListener("translation:open-settings", listener);
  },
  onTasksChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("tasks:changed", listener);
    return () => ipcRenderer.removeListener("tasks:changed", listener);
  },
  onOpenTask: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("tasks:open", listener);
    return () => ipcRenderer.removeListener("tasks:open", listener);
  },
  onUserScriptsChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("userscripts:changed", listener);
    return () => ipcRenderer.removeListener("userscripts:changed", listener);
  },
  onUserScriptExecution: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("userscripts:execution", listener);
    return () => ipcRenderer.removeListener("userscripts:execution", listener);
  },
  onUserScriptCommandsChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("userscripts:commands-changed", listener);
    return () => ipcRenderer.removeListener("userscripts:commands-changed", listener);
  },
  onAppCommand: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("app:command", listener);
    return () => ipcRenderer.removeListener("app:command", listener);
  },
  onAutomationStatus: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("automation:status", listener);
    return () => ipcRenderer.removeListener("automation:status", listener);
  },
});
