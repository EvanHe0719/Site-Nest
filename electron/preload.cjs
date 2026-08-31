const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("siteNest", {
  getState: () => ipcRenderer.invoke("state:get"),
  getUIActions: () => ipcRenderer.invoke("ui-actions:list"),
  auditUIActions: () => ipcRenderer.invoke("ui-actions:audit"),
  setActiveWorkspace: (workspaceId) =>
    ipcRenderer.invoke("workspace:set-active", workspaceId),
  updateUiSettings: (patch) => ipcRenderer.invoke("settings:update-ui", patch),
  getSearchState: () => ipcRenderer.invoke("search:get-state"),
  resolveSearchInput: (input, engineId) =>
    ipcRenderer.invoke("search:resolve-input", { input, engineId }),
  updateSearchSettings: (patch) => ipcRenderer.invoke("search:update-settings", patch),
  removeSearchHistory: (historyId) => ipcRenderer.invoke("search:remove-history", historyId),
  clearSearchHistory: () => ipcRenderer.invoke("search:clear-history"),
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
  googleTestConnection: () => ipcRenderer.invoke("google:test-connection"),
  googleResolveConflict: (strategy) =>
    ipcRenderer.invoke("google:resolve-conflict", strategy),
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
  openSearchInput: (payload) => ipcRenderer.invoke("browser:open-input", payload),
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
  showBrowserTabGroupContextMenu: (groupId) =>
    ipcRenderer.invoke("browser:show-tab-group-context-menu", { groupId }),
  createTabGroup: (input) => ipcRenderer.invoke("tab-groups:create", input),
  updateTabGroup: (groupId, patch) => ipcRenderer.invoke("tab-groups:update", { groupId, patch }),
  assignTabsToGroup: (workspaceId, tabIds, groupId) =>
    ipcRenderer.invoke("tab-groups:assign-tabs", { workspaceId, tabIds, groupId }),
  reorderBrowserTabs: (workspaceId, tabIds) =>
    ipcRenderer.invoke("tab-groups:reorder-tabs", { workspaceId, tabIds }),
  reorderTabGroups: (workspaceId, groupIds) =>
    ipcRenderer.invoke("tab-groups:reorder-groups", { workspaceId, groupIds }),
  mergeTabGroups: (sourceGroupId, targetGroupId) =>
    ipcRenderer.invoke("tab-groups:merge", { sourceGroupId, targetGroupId }),
  undoTabGroupMerge: () => ipcRenderer.invoke("tab-groups:undo-merge"),
  ungroupTabGroup: (groupId) => ipcRenderer.invoke("tab-groups:ungroup", { groupId }),
  deleteEmptyTabGroup: (groupId) => ipcRenderer.invoke("tab-groups:delete-empty", { groupId }),
  closeTabGroup: (groupId) => ipcRenderer.invoke("tab-groups:close", { groupId }),
  suggestSiteTabGroups: (workspaceId) =>
    ipcRenderer.invoke("tab-groups:suggest-sites", { workspaceId }),
  detectDuplicateTabs: (workspaceId) =>
    ipcRenderer.invoke("tab-groups:detect-duplicates", { workspaceId }),
  resolveDuplicateTabs: (keeperTabId, closeTabIds) =>
    ipcRenderer.invoke("tab-groups:resolve-duplicates", { keeperTabId, closeTabIds }),
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
  getHabits: (year) => ipcRenderer.invoke("habits:get", { year }),
  addHabit: (habit) => ipcRenderer.invoke("habits:add", habit),
  updateHabit: (habit) => ipcRenderer.invoke("habits:update", habit),
  deleteHabit: (habitId) => ipcRenderer.invoke("habits:delete", habitId),
  getHabitCheckIn: (habitId, localDate) =>
    ipcRenderer.invoke("habits:get-check-in", { habitId, localDate }),
  upsertHabitCheckIn: (checkIn) => ipcRenderer.invoke("habits:upsert-check-in", checkIn),
  deleteHabitCheckIn: (checkInId) => ipcRenderer.invoke("habits:delete-check-in", checkInId),
  updateUsageSettings: (patch) => ipcRenderer.invoke("usage:update-settings", patch),
  clearUsageStats: () => ipcRenderer.invoke("usage:clear"),
  recordMeaningfulUsageAction: () => ipcRenderer.send("usage:meaningful-action"),
  getContentTags: () => ipcRenderer.invoke("content-tags:get"),
  saveContentTagGroup: (input) => ipcRenderer.invoke("content-tags:save-group", input),
  deleteContentTagGroup: (groupId) => ipcRenderer.invoke("content-tags:delete-group", groupId),
  saveContentTag: (input) => ipcRenderer.invoke("content-tags:save-tag", input),
  deleteContentTag: (tagId) => ipcRenderer.invoke("content-tags:delete-tag", tagId),
  saveContentTagAlias: (input) => ipcRenderer.invoke("content-tags:save-alias", input),
  deleteContentTagAlias: (aliasId) => ipcRenderer.invoke("content-tags:delete-alias", aliasId),
  previewContentTagMerge: (input) => ipcRenderer.invoke("content-tags:preview-merge", input),
  mergeContentTags: (input) => ipcRenderer.invoke("content-tags:merge", input),
  undoLastContentTagMerge: () => ipcRenderer.invoke("content-tags:undo-merge"),
  setContentObjectTags: (input) => ipcRenderer.invoke("content-tags:set-object-tags", input),
  getTimeline: (options) => ipcRenderer.invoke("timeline:get", typeof options === "object" ? options : { year: options }),
  addTimelineEvent: (event) => ipcRenderer.invoke("timeline:add", event),
  updateTimelineEvent: (event) => ipcRenderer.invoke("timeline:update", event),
  deleteTimelineEvent: (eventId) => ipcRenderer.invoke("timeline:delete", eventId),
  updateTimelineSettings: (patch) => ipcRenderer.invoke("timeline:update-settings", patch),
  searchTimeline: (query, limit = 20) => ipcRenderer.invoke("timeline:search", { query, limit }),
  getTimelinePageDraft: () => ipcRenderer.invoke("timeline:page-draft"),
  exportTimeline: (options, format) => ipcRenderer.invoke("timeline:export", typeof options === "object" ? options : { year: options, format }),
  getUserScripts: () => ipcRenderer.invoke("userscripts:list"),
  reviewPastedUserScript: (sourceCode, options = {}) => ipcRenderer.invoke("userscripts:review-pasted", { sourceCode, ...options }),
  reviewCreatedUserScript: (sourceCode, options = {}) => ipcRenderer.invoke("userscripts:review-created", { sourceCode, ...options }),
  reviewRemoteUserScript: (sourceUrl, options = {}) => ipcRenderer.invoke("userscripts:review-remote", { sourceUrl, ...options }),
  reviewLocalUserScriptFile: () => ipcRenderer.invoke("userscripts:review-local-file"),
  confirmUserScriptInstall: (reviewToken) => ipcRenderer.invoke("userscripts:confirm-install", reviewToken),
  setUserScriptEnabled: (scriptId, enabled) => ipcRenderer.invoke("userscripts:set-enabled", { scriptId, enabled }),
  setUserScriptSiteApproved: (scriptId, approved) => ipcRenderer.invoke("userscripts:set-site-approved", { scriptId, approved }),
  setUserScriptSensitiveSiteApproved: (scriptId, approved) => ipcRenderer.invoke("userscripts:set-sensitive-site-approved", { scriptId, approved }),
  removeUserScript: (scriptId) => ipcRenderer.invoke("userscripts:remove", scriptId),
  restoreUserScript: (scriptId) => ipcRenderer.invoke("userscripts:restore", scriptId),
  rollbackUserScriptVersion: (scriptId, sourceHash) => ipcRenderer.invoke("userscripts:rollback", { scriptId, sourceHash }),
  setUserScriptLocalhostApproved: (scriptId, hostname, approved) => ipcRenderer.invoke("userscripts:set-localhost-approved", { scriptId, hostname, approved }),
  checkUserScriptUpdate: (scriptId) => ipcRenderer.invoke("userscripts:check-update", scriptId),
  getUserScriptCommands: () => ipcRenderer.invoke("userscripts:commands"),
  executeUserScriptCommand: (scriptId, commandId) => ipcRenderer.invoke("userscripts:execute-command", { scriptId, commandId }),
  runRestoreCopyScript: () => ipcRenderer.invoke("userscripts:run-restore-copy"),
  duplicateSiteTab: (siteId, bounds) =>
    ipcRenderer.invoke("sites:duplicate-tab", { siteId, bounds }),
  closeBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:close-tab", { tabId, bounds }),
  restoreRecentlyClosedBrowserTab: (closedId, bounds) =>
    ipcRenderer.invoke("browser:restore-closed-tab", { closedId, bounds }),
  detachBrowserTab: (tabId, windowBounds) =>
    ipcRenderer.invoke("browser:detach-tab", { tabId, windowBounds }),
  reattachBrowserTab: (tabId, bounds) =>
    ipcRenderer.invoke("browser:reattach-tab", { tabId, bounds }),
  focusDetachedBrowserTab: (tabId) =>
    ipcRenderer.invoke("browser:focus-detached-tab", { tabId }),
  getBrowserLifecycle: () => ipcRenderer.invoke("browser:get-lifecycle"),
  getNavigationPerformance: () => ipcRenderer.invoke("browser:get-navigation-performance"),
  setBrowserTabKeepRunning: (tabId, keepRunning) =>
    ipcRenderer.invoke("browser:set-keep-running", { tabId, keepRunning }),
  suspendBrowserTab: (tabId) => ipcRenderer.invoke("browser:suspend-tab", { tabId }),
  getPageResources: () => ipcRenderer.invoke("resources:list"),
  scanPageResources: () => ipcRenderer.invoke("resources:scan"),
  startPageResourceNetworkDetection: () => ipcRenderer.invoke("resources:start-network"),
  stopPageResourceNetworkDetection: () => ipcRenderer.invoke("resources:stop-network"),
  downloadPageResource: (resourceId) => ipcRenderer.invoke("resources:download", resourceId),
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
  onBrowserLifecycle: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("browser:lifecycle", listener);
    return () => ipcRenderer.removeListener("browser:lifecycle", listener);
  },
  onPageResourcesChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("resources:changed", listener);
    return () => ipcRenderer.removeListener("resources:changed", listener);
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
  onHabitsChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("habits:changed", listener);
    return () => ipcRenderer.removeListener("habits:changed", listener);
  },
  onContentTagsChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("content-tags:changed", listener);
    return () => ipcRenderer.removeListener("content-tags:changed", listener);
  },
  onOpenHabit: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("habits:open", listener);
    return () => ipcRenderer.removeListener("habits:open", listener);
  },
  onTimelineChanged: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("timeline:changed", listener);
    return () => ipcRenderer.removeListener("timeline:changed", listener);
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
  onUserScriptAutoDisabled: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("userscripts:auto-disabled", listener);
    return () => ipcRenderer.removeListener("userscripts:auto-disabled", listener);
  },
  onUserScriptNotification: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("userscripts:notification", listener);
    return () => ipcRenderer.removeListener("userscripts:notification", listener);
  },
  onUserScriptReviewReady: (callback) => {
    const listener = (_event, value) => callback(value);
    ipcRenderer.on("userscripts:review-ready", listener);
    return () => ipcRenderer.removeListener("userscripts:review-ready", listener);
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
