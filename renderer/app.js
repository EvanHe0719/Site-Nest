const ICONS = {
  home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.7 12 3.8l8.5 6.9v8.1a1.7 1.7 0 0 1-1.7 1.7H5.2a1.7 1.7 0 0 1-1.7-1.7z"/><path d="M9 20.5v-6h6v6"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.5 4.4c0-1 .8-1.8 1.8-1.8h7.4c1 0 1.8.8 1.8 1.8v16.2L12 17l-5.5 3.6z"/></svg>',
  spark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 2 1.5 5.2L18 10l-4.5 2.8L12 18l-1.5-5.2L6 10l4.5-2.8z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7z"/></svg>',
  plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
  minus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg>',
  chrome: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="3.2"/><path d="M4.2 8h10.6M9.5 20.4l5.3-9.2M19.8 8l-5.1 8.8"/></svg>',
  'chevron-right': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg>',
  'chevron-down': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 9 7 7 7-7"/></svg>',
  settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>',
  compass: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9z"/></svg>',
  shield: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 19 6v5.1c0 4.6-2.9 8.6-7 10.1-4.1-1.5-7-5.5-7-10.1V6z"/><path d="m8.8 12 2 2 4.4-4.5"/></svg>',
  'arrow-right': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>',
  'arrow-left': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M10 7l-5 5 5 5"/></svg>',
  download: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M7 10l5 5 5-5M4 20h16"/></svg>',
  search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.7" cy="10.7" r="6.7"/><path d="m16 16 4.2 4.2"/></svg>',
  folder: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6.5h7l2 2h9v9.2c0 1-.8 1.8-1.8 1.8H4.8c-1 0-1.8-.8-1.8-1.8z"/></svg>',
  clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.5 2"/></svg>',
  info: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 10.5v6M12 7.5h.01"/></svg>',
  database: '<svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="5.5" rx="8" ry="3"/><path d="M4 5.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6M4 11.5v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></svg>',
  cookie: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 12.3A4.6 4.6 0 0 1 15 6.4a4.3 4.3 0 0 1-3.8-3.6A9.2 9.2 0 1 0 21 12z"/><circle cx="8.5" cy="10" r="1"/><circle cx="11.5" cy="16" r="1"/><circle cx="6.8" cy="15.2" r=".7"/></svg>',
  route: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="6" r="2.2"/><path d="M8.2 18h2.2a3 3 0 0 0 3-3v-6a3 3 0 0 1 3-3h-.6"/></svg>',
  workflow: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="6" height="5" rx="1.2"/><rect x="15" y="15" width="6" height="5" rx="1.2"/><path d="M9 6.5h3a3 3 0 0 1 3 3V15M12 12l3 3 3-3"/></svg>',
  external: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 5h6v6M19 5l-8 8"/><path d="M11 7H5.5A1.5 1.5 0 0 0 4 8.5v10A1.5 1.5 0 0 0 5.5 20h10a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>',
  reload: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6.1 8.3A7.5 7.5 0 0 1 19 12M5 12a7.5 7.5 0 0 0 12.9 3.7"/></svg>',
  lock: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10"/></svg>',
  close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.2 4.2L19 7"/></svg>',
  alert: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.3 4.2 2.6 18a2 2 0 0 0 1.8 3h15.2a2 2 0 0 0 1.8-3L13.7 4.2a2 2 0 0 0-3.4 0Z"/><path d="M12 9v4M12 17h.01"/></svg>',
  globe: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>',
  grid: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 4 6 0 .8 5 2.7 2.7v1.8H5.5v-1.8L8.2 9zM12 13.5V21"/></svg>',
  edit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 20 4.2-1 10.6-10.6a2 2 0 0 0-2.8-2.8L5.4 16.2z"/><path d="m14.8 6.8 2.8 2.8"/></svg>',
  trash: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>',
  'arrow-up': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 14 6-6 6 6"/></svg>',
  'arrow-down': '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 10 6 6 6-6"/></svg>',
  copy: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>',
  link: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9.4 14.6 5.2-5.2"/><path d="M7.8 17.8 5.5 20a3.5 3.5 0 0 1-5-5l3.3-3.3a3.5 3.5 0 0 1 4.9 0"/><path d="m16.2 6.2 2.3-2.2a3.5 3.5 0 1 1 5 5l-3.3 3.3a3.5 3.5 0 0 1-4.9 0"/></svg>',
  cloud: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 18.5h10.4a4.1 4.1 0 0 0 .5-8.2A6.4 6.4 0 0 0 5.8 9a4.8 4.8 0 0 0 1.4 9.5Z"/></svg>',
  language: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/><path d="m15.5 16.5 2 2 3.5-4"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2.8v4.4M17 2.8v4.4M3 9h18M7 13h.01M12 13h.01M17 13h.01M7 17h.01M12 17h.01"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16"/></svg>',
};

const FALLBACK_WORKSPACES = [
  { id: "personal", name: "个人", type: "personal", icon: "home", sortOrder: 0, isSystem: true },
  { id: "work", name: "工作", type: "work", icon: "grid", sortOrder: 1, isSystem: true },
  { id: "research", name: "研究", type: "research", icon: "search", sortOrder: 2, isSystem: true },
];

function iconMarkup(name) {
  const raw = ICONS[name] || ICONS.globe;
  return raw.replace(
    "<svg ",
    '<svg fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" ',
  );
}

function mountIcons(root = document) {
  root.querySelectorAll("[data-icon]").forEach((element) => {
    const name = element.dataset.icon;
    if (name && !element.dataset.iconMounted) {
      element.innerHTML = iconMarkup(name);
      element.dataset.iconMounted = "true";
    }
  });
}

const dom = {
  appShell: document.querySelector(".app-shell"),
  appWorkspace: document.getElementById("appWorkspace"),
  appSidebar: document.getElementById("appSidebar"),
  sidebarToggle: document.getElementById("sidebarToggle"),
  sidebarToggleLabel: document.getElementById("sidebarToggleLabel"),
  homePage: document.getElementById("homePage"),
  workHomePage: document.getElementById("workHomePage"),
  researchHomePage: document.getElementById("researchHomePage"),
  workspaceBrowserEmptyPage: document.getElementById("workspaceBrowserEmptyPage"),
  browserEmptyWorkspaceName: document.getElementById("browserEmptyWorkspaceName"),
  browserEmptyOpenSites: document.getElementById("browserEmptyOpenSites"),
  browserEmptyAddSite: document.getElementById("browserEmptyAddSite"),
  workspaceSwitcher: document.getElementById("workspaceSwitcher"),
  activeWorkspaceName: document.getElementById("activeWorkspaceName"),
  currentSessionList: document.getElementById("currentSessionList"),
  currentSessionCount: document.getElementById("currentSessionCount"),
  sessionScopeToggle: document.getElementById("sessionScopeToggle"),
  quickSiteGrid: document.getElementById("quickSiteGrid"),
  sidebarSiteCount: document.getElementById("sidebarSiteCount"),
  siteSearch: document.getElementById("siteSearch"),
  siteFilter: document.getElementById("siteFilter"),
  siteWorkspaceFilter: document.getElementById("siteWorkspaceFilter"),
  siteLibraryTotal: document.getElementById("siteLibraryTotal"),
  siteLibraryGrid: document.getElementById("siteLibraryGrid"),
  workHomeGreeting: document.getElementById("workHomeGreeting"),
  workGlobalSearch: document.getElementById("workGlobalSearch"),
  workSearchResults: document.getElementById("workSearchResults"),
  workAppTotal: document.getElementById("workAppTotal"),
  workAppGrid: document.getElementById("workAppGrid"),
  workRecentList: document.getElementById("workRecentList"),
  workRefreshTickets: document.getElementById("workRefreshTickets"),
  workConnectorSettings: document.getElementById("workConnectorSettings"),
  zohoStatusBar: document.getElementById("zohoStatusBar"),
  zohoStatusTitle: document.getElementById("zohoStatusTitle"),
  zohoStatusDetail: document.getElementById("zohoStatusDetail"),
  zohoLastSync: document.getElementById("zohoLastSync"),
  metricNeedsReply: document.getElementById("metricNeedsReply"),
  metricAddedToday: document.getElementById("metricAddedToday"),
  metricWaiting24h: document.getElementById("metricWaiting24h"),
  metricSlaDueSoon: document.getElementById("metricSlaDueSoon"),
  metricSlaOverdue: document.getElementById("metricSlaOverdue"),
  metricSlaHint: document.getElementById("metricSlaHint"),
  priorityTicketList: document.getElementById("priorityTicketList"),
  recentTicketList: document.getElementById("recentTicketList"),
  dueSoonTicketList: document.getElementById("dueSoonTicketList"),
  researchSiteGrid: document.getElementById("researchSiteGrid"),
  googleSyncArea: document.getElementById("googleSyncArea"),
  googleSyncCard: document.getElementById("googleSyncCard"),
  googleSyncCardTitle: document.getElementById("googleSyncCardTitle"),
  googleSyncCardSubtitle: document.getElementById("googleSyncCardSubtitle"),
  googleSyncStateDot: document.getElementById("googleSyncStateDot"),
  googleSyncPopover: document.getElementById("googleSyncPopover"),
  closeGoogleSyncPopover: document.getElementById("closeGoogleSyncPopover"),
  googleSyncAccount: document.getElementById("googleSyncAccount"),
  googleSyncLastSync: document.getElementById("googleSyncLastSync"),
  googleSyncError: document.getElementById("googleSyncError"),
  googleSignInButton: document.getElementById("googleSignInButton"),
  googleSignInButtonLabel: document.getElementById("googleSignInButtonLabel"),
  googleSyncNowButton: document.getElementById("googleSyncNowButton"),
  googleRestoreButton: document.getElementById("googleRestoreButton"),
  googleSignOutButton: document.getElementById("googleSignOutButton"),
  bookmarkFeatureCopy: document.getElementById("bookmarkFeatureCopy"),
  bookmarkSearch: document.getElementById("bookmarkSearch"),
  bookmarkFolder: document.getElementById("bookmarkFolder"),
  bookmarkTotal: document.getElementById("bookmarkTotal"),
  bookmarkList: document.getElementById("bookmarkList"),
  loadMoreBookmarks: document.getElementById("loadMoreBookmarks"),
  chromeBookmarksSettingsSection: document.getElementById("chromeBookmarksSettingsSection"),
  chromeBookmarkStatus: document.getElementById("chromeBookmarkStatus"),
  chromeBookmarkProfile: document.getElementById("chromeBookmarkProfile"),
  chromeBookmarkCount: document.getElementById("chromeBookmarkCount"),
  chromeBookmarkUpdatedAt: document.getElementById("chromeBookmarkUpdatedAt"),
  chromeBookmarkError: document.getElementById("chromeBookmarkError"),
  clearImportedBookmarks: document.getElementById("clearImportedBookmarks"),
  browserPage: document.getElementById("browserPage"),
  browserTabBar: document.getElementById("browserTabBar"),
  browserTabList: document.getElementById("browserTabList"),
  browserTabHint: document.getElementById("browserTabHint"),
  webviewFrame: document.getElementById("webviewFrame"),
  webviewPlaceholder: document.getElementById("webviewPlaceholder"),
  webviewPlaceholderSpinner: document.getElementById("webviewPlaceholderSpinner"),
  webviewPlaceholderIcon: document.getElementById("webviewPlaceholderIcon"),
  webviewPlaceholderTitle: document.getElementById("webviewPlaceholderTitle"),
  webviewPlaceholderDetail: document.getElementById("webviewPlaceholderDetail"),
  browserSiteLogo: document.getElementById("browserSiteLogo"),
  browserSiteName: document.getElementById("browserSiteName"),
  browserSiteStatus: document.getElementById("browserSiteStatus"),
  siteLoginButton: document.getElementById("siteLoginButton"),
  repairNetworkButton: document.getElementById("repairNetworkButton"),
  resetNodeSeekSession: document.getElementById("resetNodeSeekSession"),
  repairSapSession: document.getElementById("repairSapSession"),
  browserBack: document.getElementById("browserBack"),
  browserForward: document.getElementById("browserForward"),
  browserReload: document.getElementById("browserReload"),
  browserSecurityNote: document.getElementById("browserSecurityNote"),
  browserSecurityLabel: document.getElementById("browserSecurityLabel"),
  translatePageButton: document.getElementById("translatePageButton"),
  addressField: document.getElementById("addressField"),
  addressInput: document.getElementById("addressInput"),
  zoomLabel: document.getElementById("zoomReset"),
  addSiteModal: document.getElementById("addSiteModal"),
  importModal: document.getElementById("importModal"),
  addSiteForm: document.getElementById("addSiteForm"),
  siteModalKicker: document.getElementById("siteModalKicker"),
  addSiteTitle: document.getElementById("addSiteTitle"),
  siteFormSubmitButton: document.getElementById("siteFormSubmitButton"),
  siteFormSubmitText: document.getElementById("siteFormSubmitText"),
  siteDescriptionInput: document.getElementById("siteDescriptionInput"),
  siteWorkspaceInput: document.getElementById("siteWorkspaceInput"),
  siteKindInput: document.getElementById("siteKindInput"),
  siteOpenModeInput: document.getElementById("siteOpenModeInput"),
  sitePinnedInput: document.getElementById("sitePinnedInput"),
  siteAssistantOptions: document.getElementById("siteAssistantOptions"),
  chromeProfileList: document.getElementById("chromeProfileList"),
  confirmImportButton: document.getElementById("confirmImportButton"),
  importProfileHint: document.getElementById("importProfileHint"),
  dataPathDisplay: document.getElementById("dataPathDisplay"),
  sessionVisibilitySetting: document.getElementById("sessionVisibilitySetting"),
  popupPolicyCount: document.getElementById("popupPolicyCount"),
  popupPolicyForm: document.getElementById("popupPolicyForm"),
  popupPolicyHost: document.getElementById("popupPolicyHost"),
  popupPolicyMode: document.getElementById("popupPolicyMode"),
  popupPolicyPreserveOpener: document.getElementById("popupPolicyPreserveOpener"),
  popupPolicyAllowPost: document.getElementById("popupPolicyAllowPost"),
  popupPolicyList: document.getElementById("popupPolicyList"),
  sidebarTaskCount: document.getElementById("sidebarTaskCount"),
  planAddTaskButton: document.getElementById("planAddTaskButton"),
  planViewTabs: document.getElementById("planViewTabs"),
  taskWeekTitle: document.getElementById("taskWeekTitle"),
  taskWeekRange: document.getElementById("taskWeekRange"),
  taskWeekGrid: document.getElementById("taskWeekGrid"),
  taskMonthTitle: document.getElementById("taskMonthTitle"),
  taskMonthCalendar: document.getElementById("taskMonthCalendar"),
  taskSelectedDayTitle: document.getElementById("taskSelectedDayTitle"),
  taskSelectedDayList: document.getElementById("taskSelectedDayList"),
  taskAllList: document.getElementById("taskAllList"),
  taskCompletedList: document.getElementById("taskCompletedList"),
  taskModal: document.getElementById("taskModal"),
  taskForm: document.getElementById("taskForm"),
  taskModalTitle: document.getElementById("taskModalTitle"),
  taskId: document.getElementById("taskId"),
  taskTitle: document.getElementById("taskTitle"),
  taskNotes: document.getElementById("taskNotes"),
  taskWorkspace: document.getElementById("taskWorkspace"),
  taskPriority: document.getElementById("taskPriority"),
  taskStatus: document.getElementById("taskStatus"),
  taskStartAt: document.getElementById("taskStartAt"),
  taskDueAt: document.getElementById("taskDueAt"),
  taskAllDay: document.getElementById("taskAllDay"),
  taskCustomReminder: document.getElementById("taskCustomReminder"),
  taskTags: document.getElementById("taskTags"),
  deleteTaskButton: document.getElementById("deleteTaskButton"),
  taskReminderSettingsStatus: document.getElementById("taskReminderSettingsStatus"),
  taskRemindersEnabled: document.getElementById("taskRemindersEnabled"),
  taskTrayOnClose: document.getElementById("taskTrayOnClose"),
  taskAutoLaunch: document.getElementById("taskAutoLaunch"),
  taskStartMinimized: document.getElementById("taskStartMinimized"),
  taskNotificationSound: document.getElementById("taskNotificationSound"),
  taskDndEnabled: document.getElementById("taskDndEnabled"),
  taskDndStart: document.getElementById("taskDndStart"),
  taskDndEnd: document.getElementById("taskDndEnd"),
  taskPausedUntil: document.getElementById("taskPausedUntil"),
  saveTaskSettingsButton: document.getElementById("saveTaskSettingsButton"),
  browserMemoryStatus: document.getElementById("browserMemoryStatus"),
  browserMemoryMode: document.getElementById("browserMemoryMode"),
  browserMemoryInactiveMinutes: document.getElementById("browserMemoryInactiveMinutes"),
  browserMemoryRuntime: document.getElementById("browserMemoryRuntime"),
  saveBrowserMemorySettings: document.getElementById("saveBrowserMemorySettings"),
  translationSettings: document.getElementById("translationSettings"),
  translationSettingsStatus: document.getElementById("translationSettingsStatus"),
  translationConfigForm: document.getElementById("translationConfigForm"),
  translationApiBase: document.getElementById("translationApiBase"),
  translationModel: document.getElementById("translationModel"),
  translationApiKey: document.getElementById("translationApiKey"),
  translationSourceLanguage: document.getElementById("translationSourceLanguage"),
  translationTargetLanguage: document.getElementById("translationTargetLanguage"),
  translationDefaultMode: document.getElementById("translationDefaultMode"),
  translationSelectionButton: document.getElementById("translationSelectionButton"),
  testTranslationButton: document.getElementById("testTranslationButton"),
  clearTranslationKeyButton: document.getElementById("clearTranslationKeyButton"),
  zohoConfigForm: document.getElementById("zohoConfigForm"),
  zohoDisplayName: document.getElementById("zohoDisplayName"),
  zohoOrgId: document.getElementById("zohoOrgId"),
  zohoApiBase: document.getElementById("zohoApiBase"),
  zohoWebBase: document.getElementById("zohoWebBase"),
  zohoLookbackDays: document.getElementById("zohoLookbackDays"),
  zohoSlaWarningHours: document.getElementById("zohoSlaWarningHours"),
  zohoOAuthConfigState: document.getElementById("zohoOAuthConfigState"),
  zohoOAuthConfigPath: document.getElementById("zohoOAuthConfigPath"),
  zohoSettingsStatus: document.getElementById("zohoSettingsStatus"),
  connectZohoButton: document.getElementById("connectZohoButton"),
  disconnectZohoButton: document.getElementById("disconnectZohoButton"),
  automationHeaderStatus: document.getElementById("automationHeaderStatus"),
  activeAutomationCount: document.getElementById("activeAutomationCount"),
  automationSummaryText: document.getElementById("automationSummaryText"),
  naixiAutomationBadge: document.getElementById("naixiAutomationBadge"),
  naixiAutomationMessage: document.getElementById("naixiAutomationMessage"),
  naixiScheduleTime: document.getElementById("naixiScheduleTime"),
  naixiAutoEnabled: document.getElementById("naixiAutoEnabled"),
  naixiLastRun: document.getElementById("naixiLastRun"),
  runNaixiAutomation: document.getElementById("runNaixiAutomation"),
  automationTabs: document.getElementById("automationTabs"),
  userScriptList: document.getElementById("userScriptList"),
  userScriptExecutionList: document.getElementById("userScriptExecutionList"),
  importUserScriptFile: document.getElementById("importUserScriptFile"),
  openRemoteUserScript: document.getElementById("openRemoteUserScript"),
  openPastedUserScript: document.getElementById("openPastedUserScript"),
  userScriptInstallModal: document.getElementById("userScriptInstallModal"),
  userScriptInstallForm: document.getElementById("userScriptInstallForm"),
  userScriptInstallTitle: document.getElementById("userScriptInstallTitle"),
  userScriptInstallType: document.getElementById("userScriptInstallType"),
  userScriptRemoteField: document.getElementById("userScriptRemoteField"),
  userScriptRemoteUrl: document.getElementById("userScriptRemoteUrl"),
  userScriptSourceField: document.getElementById("userScriptSourceField"),
  userScriptSourceCode: document.getElementById("userScriptSourceCode"),
  userScriptReviewModal: document.getElementById("userScriptReviewModal"),
  userScriptReviewTitle: document.getElementById("userScriptReviewTitle"),
  userScriptReviewSummary: document.getElementById("userScriptReviewSummary"),
  userScriptReviewMatches: document.getElementById("userScriptReviewMatches"),
  userScriptReviewPermissions: document.getElementById("userScriptReviewPermissions"),
  userScriptCompatibility: document.getElementById("userScriptCompatibility"),
  userScriptSourcePreview: document.getElementById("userScriptSourcePreview"),
  confirmUserScriptPermissions: document.getElementById("confirmUserScriptPermissions"),
  confirmUserScriptInstall: document.getElementById("confirmUserScriptInstall"),
  assistantCountBadge: document.getElementById("assistantCountBadge"),
  assistantList: document.getElementById("assistantList"),
  executionLogList: document.getElementById("executionLogList"),
  refreshExecutionLogs: document.getElementById("refreshExecutionLogs"),
  browserContent: document.getElementById("browserContent"),
  pageActionsButton: document.getElementById("pageActionsButton"),
  duplicateCurrentTab: document.getElementById("duplicateCurrentTab"),
  detachCurrentTab: document.getElementById("detachCurrentTab"),
  detachCurrentTabLabel: document.getElementById("detachCurrentTabLabel"),
  closePageActions: document.getElementById("closePageActions"),
  pageActionPanel: document.getElementById("pageActionPanel"),
  pageActionTitle: document.getElementById("pageActionTitle"),
  pageActionHost: document.getElementById("pageActionHost"),
  pageAssistantStatus: document.getElementById("pageAssistantStatus"),
  pageAssistantSummary: document.getElementById("pageAssistantSummary"),
  pageActionList: document.getElementById("pageActionList"),
  pageUserScriptStatus: document.getElementById("pageUserScriptStatus"),
  pageUserScriptCommands: document.getElementById("pageUserScriptCommands"),
  runRestoreCopyScript: document.getElementById("runRestoreCopyScript"),
  pageResourceStatus: document.getElementById("pageResourceStatus"),
  scanPageResources: document.getElementById("scanPageResources"),
  detectNetworkResources: document.getElementById("detectNetworkResources"),
  pageResourceList: document.getElementById("pageResourceList"),
  pageActionPermissions: document.getElementById("pageActionPermissions"),
  pageActionLastResult: document.getElementById("pageActionLastResult"),
  zohoContextAssistant: document.getElementById("zohoContextAssistant"),
  zohoContextStatus: document.getElementById("zohoContextStatus"),
  zohoTicketContext: document.getElementById("zohoTicketContext"),
  copyZohoTicketNumber: document.getElementById("copyZohoTicketNumber"),
  copyZohoTicketLink: document.getElementById("copyZohoTicketLink"),
  openZohoTicketExternal: document.getElementById("openZohoTicketExternal"),
  giteeAssociationState: document.getElementById("giteeAssociationState"),
  appContextMenu: document.getElementById("appContextMenu"),
  toastStack: document.getElementById("toastStack"),
};

let appState = {
  workspaces: FALLBACK_WORKSPACES,
  activeWorkspaceId: "personal",
  sites: [],
  bookmarks: [],
  importMeta: null,
  automations: null,
  uiSettings: {
    sessionVisibility: "all",
    contextAssistantCollapsed: false,
    sitePopupPolicies: [],
    translation: {
      providerId: "openai-compatible",
      publicConfig: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
      sourceLanguage: "auto",
      targetLanguage: "zh-CN",
      defaultMode: "bilingual",
      selectionButtonEnabled: true,
      siteRules: [],
    },
    browserMemory: { mode: "standard", inactiveMinutes: 15 },
  },
  connectorConnections: [],
  externalObjectLinks: [],
  localTasks: [],
  taskReminders: [],
  taskSettings: {},
  userScripts: [],
  userScriptPermissions: [],
  userScriptExecutions: [],
  userScriptValues: {},
};
let currentRoute = "home";
let currentSite = null;
let currentAutomationTab = "checkins";
let assistantCache = [];
let executionLogCache = [];
let pageActionSnapshot = null;
let pageActionPanelOpen = false;
let pageActionRequestId = 0;
let pageActionRefreshTimer = 0;
let translationStatusCache = null;
let taskState = { tasks: [], reminders: [], settings: {}, timeZone: "UTC" };
let userScriptState = { scripts: [], executions: [] };
let pageResourceState = { items: [], detecting: false, detectionEndsAt: null };
let browserLifecycleState = { settings: { mode: "standard", inactiveMinutes: 15 }, counts: { active: 0, warm: 0, suspended: 0 } };
let pendingUserScriptReview = null;
let currentTaskView = "week";
let taskWeekAnchor = new Date();
let taskMonthAnchor = new Date();
let selectedTaskDay = new Date();
let selectedChromeProfile = "";
let selectedChromeProfileBookmarkCount = 0;
let editingSiteId = null;
let bookmarkRenderLimit = 100;
let browserSnapshot = {
  workspaceId: "personal",
  siteId: null,
  activeTabId: null,
  tabs: [],
  hasOpenPage: false,
  title: "",
  url: "",
  currentURL: null,
  loading: false,
  canGoBack: false,
  canGoForward: false,
  zoomFactor: 1,
  securityState: "unknown",
  error: "",
};
let workspaceSwitchSequence = 0;
let workspacePresentationSequence = 0;
let workspaceSwitchChain = Promise.resolve();
let workspaceSwitchInProgress = false;
let workspaceSwitchBrowserIntent = false;
let desiredWorkspaceId = "personal";
let browserTabDrag = null;
let siteContextMenuTarget = null;
let chromeBookmarkReadState = "idle";
let chromeBookmarkReadError = "";
let googleSyncState = {
  configured: false,
  signedIn: false,
  email: "",
  lastSyncAt: null,
  status: "unavailable",
  error: "",
};
let googleSyncBusyAction = "";
let googleSyncPopoverOpen = false;
let zohoDashboard = null;
let zohoConnectorStatus = null;
let zohoDashboardLoading = false;
let zohoDashboardCancelRequested = false;
let zohoTicketContext = null;
let activeTicketFilter = "";

const SIDEBAR_COLLAPSED_STORAGE_KEY = "site-nest.sidebar-collapsed";
const TAB_DETACH_DRAG_THRESHOLD = 44;

function hostFromUrl(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url || "未知网站";
  }
}

function colorFromString(value) {
  const colors = ["#5b7cfa", "#16a085", "#ec7a5c", "#9b6bdc", "#d39b32", "#3e7e91"];
  let hash = 0;
  for (const character of String(value || "")) {
    hash = (hash * 31 + character.charCodeAt(0)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}

function shortName(value) {
  const clean = String(value || "").trim();
  const ascii = clean.match(/[A-Za-z0-9]+/g);
  if (ascii?.length) {
    return ascii
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return Array.from(clean || "页")[0];
}

function workspaces() {
  const stored = Array.isArray(appState.workspaces) ? appState.workspaces : [];
  const byId = new Map(stored.filter((item) => item?.id).map((item) => [String(item.id), item]));
  for (const fallback of FALLBACK_WORKSPACES) {
    if (!byId.has(fallback.id)) byId.set(fallback.id, fallback);
  }
  return Array.from(byId.values()).sort(
    (left, right) => (Number(left.sortOrder) || 0) - (Number(right.sortOrder) || 0),
  );
}

function activeWorkspaceId() {
  const candidate = String(appState.activeWorkspaceId || "personal");
  return workspaces().some((workspace) => workspace.id === candidate) ? candidate : "personal";
}

function workspaceById(workspaceId) {
  return workspaces().find((workspace) => workspace.id === String(workspaceId || "")) ||
    FALLBACK_WORKSPACES[0];
}

function workspaceName(workspaceId) {
  return workspaceById(workspaceId).name || "个人";
}

function siteWorkspaceId(site) {
  return String(site?.workspaceId || "personal");
}

function sitesForWorkspace(workspaceId = activeWorkspaceId()) {
  return appState.sites.filter((site) => siteWorkspaceId(site) === workspaceId);
}

function defaultSiteKind(workspaceId = activeWorkspaceId()) {
  return workspaceId === "work" ? "workApp" : "normal";
}

function emptyBrowserSnapshot(workspaceId = activeWorkspaceId()) {
  return {
    workspaceId,
    siteId: null,
    activeTabId: null,
    tabs: [],
    hasOpenPage: false,
    title: "",
    url: "",
    currentURL: null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zoomFactor: 1,
    securityState: "unknown",
    error: "",
    siteIssue: "",
  };
}

function normalizeWorkspaceBrowserState(value, workspaceId = activeWorkspaceId()) {
  const persisted = appState.workspaceBrowserStates?.[workspaceId] || {};
  const incoming = value && typeof value === "object" ? value : {};
  const rawTabs = Array.isArray(incoming.tabs)
    ? incoming.tabs
    : Array.isArray(persisted.tabs)
      ? persisted.tabs
      : [];
  const tabs = rawTabs
    .filter((tab) => tab && (tab.tabId || tab.id))
    .map((tab) => ({
      tabId: String(tab.tabId || tab.id),
      sessionId: String(tab.sessionId || tab.tabId || tab.id),
      workspaceId: String(tab.workspaceId || workspaceId),
      siteId: tab.siteId ? String(tab.siteId) : null,
      browserProfileId: String(tab.browserProfileId || "default"),
      title: String(tab.title || ""),
      url: String(tab.url || tab.currentURL || ""),
      normalizedUrl: String(tab.normalizedUrl || tab.url || tab.currentURL || ""),
      favicon: tab.favicon || null,
      createdAt: tab.createdAt || tab.updatedAt || null,
      lastActiveAt: tab.lastActiveAt || tab.updatedAt || null,
      loadingState: tab.loadingState || (tab.loading ? "loading" : "idle"),
      errorState: tab.errorState || null,
      reliableContext: tab.reliableContext || null,
      loading: Boolean(tab.loading),
      detached: Boolean(tab.detached),
      active: Boolean(tab.active),
      allowDuplicate: tab.allowDuplicate === true,
      keepRunning: tab.keepRunning === true,
      lifecycleState: String(tab.lifecycleState || ""),
    }));
  const requestedActiveTabId = Object.prototype.hasOwnProperty.call(incoming, "activeTabId")
    ? incoming.activeTabId
    : persisted.activeTabId;
  const activeTabId = tabs.some((tab) => tab.tabId === String(requestedActiveTabId || ""))
    ? String(requestedActiveTabId)
    : tabs.find((tab) => tab.active)?.tabId || tabs[0]?.tabId || null;
  const activeTab = tabs.find((tab) => tab.tabId === activeTabId) || null;
  const currentURL = incoming.currentURL ?? incoming.url ??
    (!activeTab?.detached ? activeTab?.url : null) ?? persisted.currentURL ?? null;
  const siteId = Object.prototype.hasOwnProperty.call(incoming, "siteId")
    ? incoming.siteId
    : (!activeTab?.detached ? activeTab?.siteId : null) ?? persisted.activeSiteId ?? null;
  const hasOpenPage = incoming.hasOpenPage === undefined
    ? Boolean(currentURL && !activeTab?.detached)
    : Boolean(incoming.hasOpenPage);
  return {
    ...emptyBrowserSnapshot(workspaceId),
    ...incoming,
    workspaceId: String(incoming.workspaceId || workspaceId),
    activeTabId,
    tabs,
    siteId: hasOpenPage && siteId ? String(siteId) : null,
    hasOpenPage,
    currentURL: hasOpenPage ? currentURL : null,
    url: hasOpenPage ? String(incoming.url || currentURL || "") : "",
  };
}

function siteForWorkspaceBrowserState(value) {
  const snapshot = normalizeWorkspaceBrowserState(value, value?.workspaceId || activeWorkspaceId());
  if (!snapshot.hasOpenPage) return null;
  const stored = snapshot.siteId
    ? appState.sites.find(
      (site) => site.id === snapshot.siteId && siteWorkspaceId(site) === snapshot.workspaceId,
    )
    : null;
  if (stored) return stored;
  const url = snapshot.currentURL || snapshot.url;
  if (!url) return null;
  return {
    id: snapshot.siteId || `workspace-browser:${snapshot.workspaceId}`,
    workspaceId: snapshot.workspaceId,
    name: snapshot.title || hostFromUrl(url) || `${workspaceName(snapshot.workspaceId)}空间网页`,
    shortName: shortName(snapshot.title || hostFromUrl(url)),
    url,
    color: colorFromString(url),
    siteKind: "normal",
    openMode: "internal",
    transient: true,
  };
}

function activeBrowserTab(value = browserSnapshot) {
  const tabs = Array.isArray(value?.tabs) ? value.tabs : [];
  return tabs.find((tab) => tab.tabId === value?.activeTabId) || tabs.find((tab) => tab.active) || tabs[0] || null;
}

function browserStateFromResult(result) {
  if (result?.browserState && typeof result.browserState === "object") return result.browserState;
  return result && typeof result === "object" ? result : null;
}

function detachedTabWindowBounds(anchor = {}) {
  const screenLeft = Number(window.screen?.availLeft) || 0;
  const screenTop = Number(window.screen?.availTop) || 0;
  const screenWidth = Number(window.screen?.availWidth) || window.outerWidth || 1200;
  const screenHeight = Number(window.screen?.availHeight) || window.outerHeight || 800;
  const width = Math.max(720, Math.min(1120, (window.outerWidth || 1200) - 120));
  const height = Math.max(520, Math.min(820, (window.outerHeight || 800) - 100));
  const proposedX = Number(anchor.screenX) || (window.screenX || screenLeft) + 76;
  const proposedY = Number(anchor.screenY) || (window.screenY || screenTop) + 64;
  return {
    x: Math.round(Math.max(screenLeft, Math.min(screenLeft + screenWidth - width, proposedX - 150))),
    y: Math.round(Math.max(screenTop, Math.min(screenTop + screenHeight - height, proposedY - 24))),
    width: Math.round(width),
    height: Math.round(height),
  };
}

function updateBrowserTabContentState(value = browserSnapshot) {
  const snapshot = normalizeWorkspaceBrowserState(value, value?.workspaceId || activeWorkspaceId());
  const activeTab = activeBrowserTab(snapshot);
  const noAttachedTab = !snapshot.hasOpenPage;
  dom.browserPage.classList.toggle("has-no-attached-tab", noAttachedTab && snapshot.tabs.length > 0);
  dom.webviewPlaceholderSpinner.classList.toggle("is-hidden", noAttachedTab);
  dom.webviewPlaceholderIcon.classList.toggle("is-hidden", !noAttachedTab);
  dom.webviewPlaceholderTitle.textContent = noAttachedTab && snapshot.tabs.length
    ? "当前标签已在独立窗口打开"
    : "正在准备阅读视图";
  dom.webviewPlaceholderDetail.textContent = noAttachedTab && snapshot.tabs.length
    ? "点击独立标签可聚焦窗口，也可以使用“合回”按钮返回栖页主窗口。"
    : "页面加载完成后会显示在这里";
  dom.pageActionsButton.disabled = noAttachedTab;
  dom.duplicateCurrentTab.disabled = !activeTab;
  dom.duplicateCurrentTab.dataset.tabId = activeTab?.tabId || "";
  dom.detachCurrentTab.disabled = !activeTab;
  dom.detachCurrentTab.dataset.tabId = activeTab?.tabId || "";
  dom.detachCurrentTab.dataset.tabAction = activeTab?.detached ? "reattach" : "detach";
  dom.detachCurrentTabLabel.textContent = activeTab?.detached ? "合回空间" : "独立窗口";
  const detachIcon = dom.detachCurrentTab.querySelector("[data-icon]");
  if (detachIcon) {
    detachIcon.dataset.icon = activeTab?.detached ? "route" : "external";
    detachIcon.dataset.iconMounted = "true";
    detachIcon.innerHTML = iconMarkup(detachIcon.dataset.icon);
  }
  dom.detachCurrentTab.title = activeTab?.detached
    ? "将当前独立标签合回主窗口"
    : "将当前标签拆到独立窗口";
  if (noAttachedTab && activeTab) {
    dom.browserBack.disabled = true;
    dom.browserForward.disabled = true;
    dom.addressField.classList.remove("is-loading");
    dom.addressInput.value = activeTab.url || "";
    dom.browserSiteLogo.textContent = shortName(activeTab.title || hostFromUrl(activeTab.url));
    dom.browserSiteLogo.style.setProperty("--site-color", colorFromString(activeTab.url));
    dom.browserSiteName.textContent = activeTab.title || hostFromUrl(activeTab.url) || "独立窗口标签";
    dom.browserSiteName.title = activeTab.title || activeTab.url || "";
    dom.browserSiteStatus.textContent = "独立窗口";
  }
}

function renderBrowserTabs(value = browserSnapshot) {
  const snapshot = normalizeWorkspaceBrowserState(value, value?.workspaceId || activeWorkspaceId());
  dom.browserTabHint.textContent = `${workspaceName(snapshot.workspaceId)}空间 · 按住标签向下拖可拆出`;
  dom.browserTabList.replaceChildren();
  for (const tab of snapshot.tabs) {
    const item = document.createElement("div");
    item.className = "browser-tab";
    item.dataset.browserTabId = tab.tabId;
    item.draggable = true;
    item.classList.toggle("is-active", tab.tabId === snapshot.activeTabId || tab.active);
    item.classList.toggle("is-loading", tab.loading);
    item.classList.toggle("is-detached", tab.detached);

    const main = document.createElement("button");
    main.type = "button";
    main.className = "browser-tab-main";
    main.draggable = !tab.detached;
    main.dataset.tabAction = tab.detached ? "focus" : "select";
    main.setAttribute("role", "tab");
    main.setAttribute("aria-selected", String(tab.tabId === snapshot.activeTabId || tab.active));
    main.title = tab.detached
      ? `聚焦独立窗口：${tab.title || hostFromUrl(tab.url)}`
      : tab.title || tab.url || "网页标签";
    const state = document.createElement("span");
    state.className = "browser-tab-state";
    const title = document.createElement("span");
    title.className = "browser-tab-title";
    title.textContent = tab.title || hostFromUrl(tab.url) || "新标签";
    main.append(state, title);
    if (tab.detached) {
      const detached = document.createElement("span");
      detached.className = "browser-tab-detached-label";
      detached.textContent = "独立";
      main.appendChild(detached);
    }
    main.addEventListener("click", () => {
      if (tab.detached) void focusDetachedBrowserTab(tab.tabId);
      else void activateBrowserTab(tab.tabId);
    });

    const actions = document.createElement("span");
    actions.className = "browser-tab-actions";
    const windowAction = document.createElement("button");
    windowAction.type = "button";
    windowAction.className = "browser-tab-action";
    windowAction.dataset.tabAction = tab.detached ? "reattach" : "detach";
    windowAction.title = tab.detached ? "合回主窗口" : "拆到独立窗口";
    windowAction.setAttribute("aria-label", windowAction.title);
    windowAction.appendChild(createIconElement(tab.detached ? "route" : "external"));
    windowAction.addEventListener("click", (event) => {
      event.stopPropagation();
      if (tab.detached) void reattachBrowserTab(tab.tabId);
      else void detachBrowserTabToWindow(tab.tabId);
    });
    const close = document.createElement("button");
    close.type = "button";
    close.className = "browser-tab-action";
    close.dataset.tabAction = "close";
    close.title = "关闭标签";
    close.setAttribute("aria-label", "关闭标签");
    close.appendChild(createIconElement("close"));
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      void closeBrowserTab(tab.tabId);
    });
    actions.append(windowAction, close);
    item.append(main, actions);

    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openTopTabContextMenu(
        { ...tab, workspaceId: tab.workspaceId || snapshot.workspaceId },
      );
    });

    item.addEventListener("pointerdown", (event) => {
      if (event.target.closest("button") && !event.target.closest(".browser-tab-main")) return;
      browserTabDrag = {
        tabId: tab.tabId,
        detached: tab.detached,
        startScreenX: event.screenX,
        startScreenY: event.screenY,
        lastScreenX: event.screenX,
        lastScreenY: event.screenY,
        lastClientX: event.clientX,
        lastClientY: event.clientY,
      };
    });
    item.addEventListener("dragstart", (event) => {
      if (tab.detached || event.target.closest(".browser-tab-action")) {
        event.preventDefault();
        return;
      }
      browserTabDrag = browserTabDrag?.tabId === tab.tabId
        ? browserTabDrag
        : {
            tabId: tab.tabId,
            detached: false,
            startScreenX: event.screenX,
            startScreenY: event.screenY,
            lastScreenX: event.screenX,
            lastScreenY: event.screenY,
            lastClientX: event.clientX,
            lastClientY: event.clientY,
          };
      item.classList.add("is-dragging");
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("text/plain", tab.tabId);
    });
    item.addEventListener("drag", (event) => {
      if (!browserTabDrag || browserTabDrag.tabId !== tab.tabId) return;
      if (Number(event.screenX) !== 0 || Number(event.screenY) !== 0) {
        browserTabDrag.lastScreenX = Number(event.screenX);
        browserTabDrag.lastScreenY = Number(event.screenY);
      }
      if (Number(event.clientX) !== 0 || Number(event.clientY) !== 0) {
        browserTabDrag.lastClientX = Number(event.clientX);
        browserTabDrag.lastClientY = Number(event.clientY);
      }
    });
    item.addEventListener("dragend", (event) => {
      item.classList.remove("is-dragging");
      const drag = browserTabDrag;
      browserTabDrag = null;
      if (!drag || drag.tabId !== tab.tabId || drag.detached) return;
      const endScreenX = Number(event.screenX) !== 0
        ? Number(event.screenX)
        : Number(drag.lastScreenX ?? drag.startScreenX);
      const endScreenY = Number(event.screenY) !== 0
        ? Number(event.screenY)
        : Number(drag.lastScreenY ?? drag.startScreenY);
      const distance = Math.hypot(
        endScreenX - Number(drag.startScreenX || 0),
        endScreenY - Number(drag.startScreenY || 0),
      );
      const barRect = dom.browserTabBar.getBoundingClientRect();
      const barScreenLeft = window.screenX + barRect.left;
      const barScreenTop = window.screenY + barRect.top;
      const outsideBar = endScreenX < barScreenLeft - 24 ||
        endScreenX > barScreenLeft + barRect.width + 24 ||
        endScreenY < barScreenTop - 24 ||
        endScreenY > barScreenTop + barRect.height + 32;
      const outsideWindow = endScreenX < window.screenX ||
        endScreenX > window.screenX + window.outerWidth ||
        endScreenY < window.screenY ||
        endScreenY > window.screenY + window.outerHeight;
      const pulledDown = endScreenY - Number(drag.startScreenY || 0) >= TAB_DETACH_DRAG_THRESHOLD;
      if (distance >= TAB_DETACH_DRAG_THRESHOLD && (outsideBar || outsideWindow || pulledDown)) {
        void detachBrowserTabToWindow(tab.tabId, { screenX: endScreenX, screenY: endScreenY });
      }
    });
    dom.browserTabList.appendChild(item);
  }
  updateBrowserTabContentState(snapshot);
  requestAnimationFrame(() => {
    dom.browserTabList.querySelector(".browser-tab.is-active")?.scrollIntoView({ block: "nearest", inline: "nearest" });
  });
}

function commitBrowserTabResult(result) {
  applyReturnedState(result);
  const next = browserStateFromResult(result);
  if (!next) return null;
  handleBrowserState(next);
  return next;
}

async function activateBrowserTab(tabId) {
  if (typeof window.siteNest?.selectBrowserTab !== "function") {
    showToast("标签切换尚未配置", "桌面端未提供标签切换接口", "error");
    return;
  }
  try {
    const result = await window.siteNest.selectBrowserTab(tabId, browserBounds());
    commitBrowserTabResult(result);
  } catch (error) {
    showToast("无法切换标签", error?.message || "请稍后重试", "error");
  }
}

async function closeBrowserTab(tabId) {
  if (typeof window.siteNest?.closeBrowserTab !== "function") {
    showToast("标签关闭尚未配置", "桌面端未提供标签关闭接口", "error");
    return;
  }
  try {
    setPageActionPanelOpen(false);
    const result = await window.siteNest.closeBrowserTab(tabId, browserBounds());
    commitBrowserTabResult(result);
  } catch (error) {
    showToast("无法关闭标签", error?.message || "请稍后重试", "error");
  }
}

async function detachBrowserTabToWindow(tabId, anchor = {}) {
  if (typeof window.siteNest?.detachBrowserTab !== "function") {
    showToast("独立窗口尚未配置", "桌面端未提供标签拆出接口", "error");
    return;
  }
  try {
    setPageActionPanelOpen(false);
    const result = await window.siteNest.detachBrowserTab(tabId, detachedTabWindowBounds(anchor));
    commitBrowserTabResult(result);
    showToast("标签已拆到独立窗口", "主窗口仍会保留这个标签入口");
  } catch (error) {
    showToast("无法拆出标签", error?.message || "请稍后重试", "error");
  }
}

async function reattachBrowserTab(tabId) {
  if (typeof window.siteNest?.reattachBrowserTab !== "function") {
    showToast("合回标签尚未配置", "桌面端未提供标签合回接口", "error");
    return;
  }
  try {
    const result = await window.siteNest.reattachBrowserTab(tabId, browserBounds());
    commitBrowserTabResult(result);
    showToast("标签已合回主窗口");
  } catch (error) {
    showToast("无法合回标签", error?.message || "请稍后重试", "error");
  }
}

async function focusDetachedBrowserTab(tabId) {
  if (typeof window.siteNest?.focusDetachedBrowserTab !== "function") {
    showToast("无法聚焦独立窗口", "桌面端未提供独立窗口聚焦接口", "error");
    return;
  }
  try {
    const result = await window.siteNest.focusDetachedBrowserTab(tabId);
    commitBrowserTabResult(result);
  } catch (error) {
    showToast("无法聚焦独立窗口", error?.message || "窗口可能已关闭", "error");
  }
}

function clearWorkspaceBrowserPresentation(workspaceId, options = {}) {
  setPageActionPanelOpen(false);
  currentSite = null;
  browserSnapshot = emptyBrowserSnapshot(workspaceId);
  renderBrowserTabs(browserSnapshot);
  if (options.hideNative !== false) window.siteNest?.hideBrowser();
  dom.browserPage.classList.remove("is-visible");
  dom.addressInput.value = "";
  dom.addressField.classList.remove("is-loading");
  dom.browserBack.disabled = true;
  dom.browserForward.disabled = true;
  dom.browserSiteLogo.textContent = shortName(workspaceName(workspaceId));
  dom.browserSiteName.textContent = `${workspaceName(workspaceId)}空间`;
  dom.browserSiteStatus.textContent = "尚未打开网页";
  if (options.showEmpty) {
    currentRoute = "browser-empty";
    dom.browserEmptyWorkspaceName.textContent = workspaceName(workspaceId);
    setVisibleLocalPage("browser-empty");
  } else if (options.showHome) {
    currentRoute = "home";
    setVisibleLocalPage("home");
  }
  updateActiveNavigation();
}

function restoreWorkspaceBrowserPresentation(value) {
  const snapshot = normalizeWorkspaceBrowserState(value, activeWorkspaceId());
  if (
    (!snapshot.hasOpenPage && !snapshot.tabs.length) ||
    snapshot.workspaceId !== activeWorkspaceId()
  ) {
    return false;
  }
  const site = snapshot.hasOpenPage ? siteForWorkspaceBrowserState(snapshot) : null;
  if (snapshot.hasOpenPage && (!site || siteWorkspaceId(site) !== activeWorkspaceId())) return false;
  currentSite = site;
  currentRoute = site ? `site:${site.id}` : "browser-tabs";
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  dom.browserPage.classList.add("is-visible");
  if (site) {
    dom.browserSiteLogo.textContent = site.shortName || shortName(site.name);
    dom.browserSiteLogo.style.setProperty("--site-color", site.color || colorFromString(site.url));
    dom.browserSiteName.textContent = site.name || hostFromUrl(site.url);
    dom.addressInput.value = snapshot.currentURL || snapshot.url || site.url;
  }
  renderBrowserTabs(snapshot);
  handleBrowserState(snapshot);
  updateActiveNavigation();
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
  return true;
}

function applyReturnedState(result) {
  const nextState = result?.state || (result?.sites && !Array.isArray(result) ? result : null);
  if (nextState) appState = nextState;
  return nextState;
}

function normalizeAssistantList(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.assistants)) return value.assistants;
  if (Array.isArray(value?.matchedAssistants)) return value.matchedAssistants;
  if (Array.isArray(value?.items)) return value.items;
  return [];
}

function normalizeExecutionLogs(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.logs)) return value.logs;
  if (Array.isArray(value?.items)) return value.items;
  if (Array.isArray(value?.records)) return value.records;
  return [];
}

function siteOpenModeLabel(site) {
  return site?.openMode === "external" ? "系统浏览器" : "栖页内打开";
}

function siteKindLabel(site) {
  return site?.siteKind === "workApp" ? "工作应用" : "普通站点";
}

function formatFullDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date);
}

function createIconElement(name, className = "") {
  const span = document.createElement("span");
  span.className = className;
  span.dataset.icon = name;
  span.dataset.iconMounted = "true";
  span.innerHTML = iconMarkup(name);
  return span;
}

function showToast(title, detail = "", type = "success", options = {}) {
  const toastKey = String(options.key || "");
  if (toastKey) {
    dom.toastStack.querySelectorAll(`[data-toast-key="${toastKey}"]`).forEach((item) => item.remove());
  }
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " is-error" : ""}`;
  if (toastKey) toast.dataset.toastKey = toastKey;
  const icon = createIconElement(type === "error" ? "alert" : "check", "toast-icon");
  const copy = document.createElement("div");
  const strong = document.createElement("strong");
  strong.textContent = title;
  copy.appendChild(strong);
  if (detail) {
    const small = document.createElement("small");
    small.textContent = detail;
    copy.appendChild(small);
  }
  toast.append(icon, copy);
  dom.toastStack.appendChild(toast);
  const duration = Number.isFinite(Number(options.durationMs))
    ? Math.max(500, Number(options.durationMs))
    : 4200;
  window.setTimeout(() => toast.remove(), duration);
}

function showWorkspaceToast(title, detail = "", type = "success") {
  showToast(title, detail, type, {
    key: "workspace",
    durationMs: type === "error" ? 3200 : 1400,
  });
}

function formatGoogleSyncTime(value) {
  if (!value) return "尚未同步";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "尚未同步";
  return `上次同步 ${new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)}`;
}

function mergeGoogleSyncState(value) {
  const source = value && typeof value === "object" ? value : {};
  const sourceHasStatus = Object.prototype.hasOwnProperty.call(source, "status");
  const next = { ...googleSyncState };
  for (const key of ["configured", "signedIn", "email", "lastSyncAt", "status", "error"]) {
    if (Object.prototype.hasOwnProperty.call(source, key)) next[key] = source[key];
  }
  next.configured = Boolean(next.configured);
  next.signedIn = Boolean(next.signedIn);
  next.email = String(next.email || "");
  next.lastSyncAt = next.lastSyncAt || null;
  next.status = String(next.status || "idle");
  next.error = typeof next.error === "string"
    ? next.error
    : String(next.error?.message || "");
  if (!sourceHasStatus && Object.prototype.hasOwnProperty.call(source, "error") && !next.error) {
    next.status = "idle";
  }
  googleSyncState = next;
  return next;
}

function googleSyncErrorMessage(error, fallback = "Google 同步操作失败") {
  const raw = String(error?.message || fallback).trim();
  return raw
    .replace(/^Error invoking remote method ['"][^'"]+['"]:\s*/i, "")
    .replace(/^Error:\s*/i, "")
    .trim() || fallback;
}

function googleSyncBusyCopy() {
  return {
    "sign-in": "正在连接 Google…",
    sync: "正在同步栖页数据…",
    restore: "正在从云端恢复…",
    "sign-out": "正在退出 Google…",
  }[googleSyncBusyAction] || "";
}

function renderGoogleSync() {
  const configured = Boolean(googleSyncState.configured);
  const signedIn = Boolean(googleSyncState.signedIn);
  const busyCopy = googleSyncBusyCopy();
  // A missing desktop OAuth client is an ordinary unconfigured state. Keep the
  // indicator neutral; red is reserved for a configured connection/sync error.
  const hasError = configured &&
    (Boolean(googleSyncState.error) || googleSyncState.status === "error");
  const lastSyncCopy = formatGoogleSyncTime(googleSyncState.lastSyncAt);

  if (!configured) {
    dom.googleSyncCardTitle.textContent = "Google 同步 · Beta";
    dom.googleSyncCardSubtitle.textContent = "点击查看说明";
  } else if (signedIn) {
    dom.googleSyncCardTitle.textContent = `${googleSyncState.email || "Google 已连接"} · Beta`;
    dom.googleSyncCardSubtitle.textContent = busyCopy || (hasError ? "同步异常 · 点击查看" : lastSyncCopy);
  } else {
    dom.googleSyncCardTitle.textContent = "连接 Google · Beta";
    dom.googleSyncCardSubtitle.textContent = busyCopy || "同步栖页数据";
  }

  dom.googleSyncStateDot.className = "google-sync-state-dot";
  dom.googleSyncStateDot.classList.toggle("is-connected", configured && signedIn && !hasError && !busyCopy);
  dom.googleSyncStateDot.classList.toggle("is-error", hasError && !busyCopy);
  dom.googleSyncStateDot.classList.toggle("is-busy", Boolean(busyCopy));

  if (!configured) {
    dom.googleSyncAccount.textContent = "尚未配置 Google 同步";
    dom.googleSyncLastSync.textContent = "完成桌面 OAuth 配置后即可连接";
  } else if (signedIn) {
    dom.googleSyncAccount.textContent = googleSyncState.email || "Google 账号已连接";
    dom.googleSyncLastSync.textContent = busyCopy || lastSyncCopy;
  } else {
    dom.googleSyncAccount.textContent = "尚未连接 Google";
    dom.googleSyncLastSync.textContent = busyCopy || "连接后可同步空间、站点和收藏书签";
  }

  dom.googleSyncError.textContent = googleSyncState.error;
  dom.googleSyncError.classList.toggle("is-hidden", !googleSyncState.error);
  dom.googleSignInButton.classList.toggle("is-hidden", signedIn);
  dom.googleSyncNowButton.classList.toggle("is-hidden", !signedIn);
  dom.googleRestoreButton.classList.toggle("is-hidden", !signedIn);
  dom.googleSignOutButton.classList.toggle("is-hidden", !signedIn);
  dom.googleSignInButtonLabel.textContent = configured ? "连接 Google" : "当前未配置";

  const busy = Boolean(googleSyncBusyAction);
  dom.googleSignInButton.disabled = busy || !configured;
  dom.googleSyncNowButton.disabled = busy || !signedIn;
  dom.googleRestoreButton.disabled = busy || !signedIn;
  dom.googleSignOutButton.disabled = busy || !signedIn;
  dom.googleSyncPopover.setAttribute("aria-busy", String(busy));
}

function setGoogleSyncPopoverOpen(open, options = {}) {
  const next = Boolean(open);
  if (next && dom.appShell.classList.contains("is-sidebar-collapsed")) {
    applySidebarCollapsed(false);
    window.setTimeout(() => setGoogleSyncPopoverOpen(true, options), 190);
    return;
  }
  googleSyncPopoverOpen = next;
  dom.googleSyncPopover.hidden = !next;
  dom.googleSyncPopover.setAttribute("aria-hidden", String(!next));
  dom.googleSyncCard.setAttribute("aria-expanded", String(next));
  if (next) renderGoogleSync();
  if (!next && options.focusCard) dom.googleSyncCard.focus();
}

async function loadGoogleSyncStatus() {
  if (typeof window.siteNest?.googleSyncStatus !== "function") {
    mergeGoogleSyncState({
      configured: false,
      signedIn: false,
      status: "unavailable",
      error: "当前桌面端尚未提供 Google 同步接口",
    });
    renderGoogleSync();
    return googleSyncState;
  }
  try {
    const result = await window.siteNest.googleSyncStatus();
    mergeGoogleSyncState(result);
  } catch (error) {
    mergeGoogleSyncState({
      configured: false,
      signedIn: false,
      status: "error",
      error: googleSyncErrorMessage(error, "无法读取 Google 同步状态"),
    });
  }
  renderGoogleSync();
  return googleSyncState;
}

async function runGoogleSyncAction(action) {
  if (googleSyncBusyAction) return;
  if (action === "restore") {
    const confirmed = window.confirm(
      "确定从 Google 云端恢复栖页数据吗？\n\n云端的空间、站点和收藏书签会更新到本机；本机 Chrome 原始书签不会被修改。",
    );
    if (!confirmed) return;
  }
  const actionConfig = {
    "sign-in": {
      method: "googleSignIn",
      successTitle: "Google 已连接",
      successDetail: () => googleSyncState.email || "现在可以同步栖页数据",
    },
    sync: {
      method: "googleSyncNow",
      successTitle: "Google 同步完成",
      successDetail: (result) => result?.syncResult?.message || formatGoogleSyncTime(googleSyncState.lastSyncAt),
    },
    restore: {
      method: "googleRestoreFromCloud",
      successTitle: "已从云端恢复",
      successDetail: (result) => result?.syncResult?.message || "空间、站点和收藏书签已按云端数据更新",
    },
    "sign-out": {
      method: "googleSignOut",
      successTitle: "已退出 Google",
      successDetail: () => "本机栖页数据仍会保留",
    },
  }[action];
  const actionMethod = actionConfig && window.siteNest?.[actionConfig.method];
  if (typeof actionMethod !== "function") {
    showToast("Google 同步不可用", "当前桌面端尚未提供这个操作", "error");
    return;
  }

  googleSyncBusyAction = action;
  mergeGoogleSyncState({ error: "" });
  renderGoogleSync();
  try {
    const result = await actionMethod();
    mergeGoogleSyncState(result);
    if (result?.state) {
      applyReturnedState(result);
      desiredWorkspaceId = activeWorkspaceId();
      renderAll();
    } else {
      renderGoogleSync();
    }
    if (googleSyncState.status === "error" && googleSyncState.error) {
      throw new Error(googleSyncState.error);
    }
    showToast(actionConfig.successTitle, actionConfig.successDetail(result), "success", {
      key: "google-sync",
      durationMs: 2400,
    });
    if (action === "sign-out") setGoogleSyncPopoverOpen(false);
  } catch (error) {
    mergeGoogleSyncState({
      status: "error",
      error: googleSyncErrorMessage(error),
    });
    showToast("Google 同步失败", googleSyncState.error, "error", {
      key: "google-sync",
      durationMs: 3600,
    });
  } finally {
    googleSyncBusyAction = "";
    renderGoogleSync();
  }
}

function readSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

function applySidebarCollapsed(collapsed, options = {}) {
  const next = Boolean(collapsed);
  dom.appShell.classList.toggle("is-sidebar-collapsed", next);
  dom.sidebarToggle.setAttribute("aria-expanded", String(!next));
  dom.sidebarToggle.title = next ? "展开侧栏" : "收起侧栏";
  dom.sidebarToggleLabel.textContent = next ? "展开侧栏" : "收起侧栏";
  const icon = dom.sidebarToggle.querySelector("[data-icon]");
  if (icon) {
    icon.dataset.icon = next ? "arrow-right" : "arrow-left";
    icon.dataset.iconMounted = "true";
    icon.innerHTML = iconMarkup(icon.dataset.icon);
  }
  if (options.persist !== false) {
    try {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(next));
    } catch {
      // The rail still works when local storage is unavailable.
    }
  }
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
  window.setTimeout(syncBrowserBounds, 280);
}

function browserBounds() {
  const rect = dom.webviewFrame.getBoundingClientRect();
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

function syncBrowserBounds() {
  if (!currentSite || !dom.browserPage.classList.contains("is-visible")) return;
  window.siteNest?.setBrowserBounds(browserBounds());
}

function formatAutomationTime(value) {
  if (!value) return "尚未运行";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "尚未运行";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function renderNaixiAutomation(naixi) {
  if (!naixi) return;
  appState.automations = { ...(appState.automations || {}), naixi };
  dom.naixiAutoEnabled.checked = Boolean(naixi.enabled);
  dom.naixiScheduleTime.value = naixi.time || "08:30";
  dom.activeAutomationCount.textContent = naixi.enabled ? "1" : "0";
  dom.activeAutomationCount.classList.toggle("summary-number--muted", !naixi.enabled);
  dom.automationSummaryText.textContent = naixi.enabled
    ? `栖页运行时，每天 ${naixi.time || "08:30"} 自动检查`
    : "奶昔自动签到当前已关闭";

  const headerDot = document.createElement("span");
  headerDot.className = "pulse-dot";
  dom.automationHeaderStatus.replaceChildren(
    headerDot,
    document.createTextNode(naixi.enabled ? "自动签到已开启" : "自动签到已关闭"),
  );

  const statusLabels = {
    idle: "等待检查",
    running: "正在签到",
    success: "今日已完成",
    "needs-login": "需要登录",
    "needs-action": "需要人工处理",
    error: "执行失败",
    disabled: "已关闭",
  };
  dom.naixiAutomationBadge.textContent = statusLabels[naixi.status] || "等待检查";
  dom.naixiAutomationBadge.className = "status-pill";
  if (naixi.status === "success") {
    dom.naixiAutomationBadge.classList.add("status-pill--ready");
  } else if (naixi.status === "running") {
    dom.naixiAutomationBadge.classList.add("status-pill--safe");
  } else if (["needs-login", "needs-action"].includes(naixi.status)) {
    dom.naixiAutomationBadge.classList.add("status-pill--preview");
  } else if (naixi.status === "error") {
    dom.naixiAutomationBadge.classList.add("status-pill--error");
  }
  dom.naixiAutomationMessage.textContent =
    naixi.message || "使用栖页中已保存的登录会话自动完成每日签到。";
  dom.naixiLastRun.replaceChildren(
    createIconElement("shield"),
    document.createTextNode(`上次运行：${formatAutomationTime(naixi.lastRunAt)}`),
  );
  dom.runNaixiAutomation.disabled = naixi.status === "running";
  dom.runNaixiAutomation.replaceChildren(
    createIconElement(naixi.status === "running" ? "reload" : "spark"),
    document.createTextNode(naixi.status === "running" ? "正在签到" : "立即签到"),
  );
}

function renderWorkspaceSwitcher() {
  const workspaceId = activeWorkspaceId();
  const workspace = workspaceById(workspaceId);
  dom.activeWorkspaceName.textContent = workspace.name;
  dom.workspaceSwitcher.querySelectorAll("[data-workspace-id]").forEach((button) => {
    const active = button.dataset.workspaceId === workspaceId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function setVisibleLocalPage(route) {
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  if (route === "home") {
    const workspaceId = activeWorkspaceId();
    if (workspaceId === "work") dom.workHomePage.classList.add("is-visible");
    else if (workspaceId === "research") dom.researchHomePage.classList.add("is-visible");
    else dom.homePage.classList.add("is-visible");
    return;
  }
  document.querySelector(`.local-page[data-page="${route}"]`)?.classList.add("is-visible");
}

function switchWorkspace(workspaceId) {
  const nextId = String(workspaceId || "");
  if (!workspaces().some((workspace) => workspace.id === nextId)) return Promise.resolve();
  const currentIntent = workspaceSwitchInProgress ? desiredWorkspaceId : activeWorkspaceId();
  if (nextId === currentIntent) return workspaceSwitchChain;

  if (!workspaceSwitchInProgress) {
    workspaceSwitchBrowserIntent =
      dom.browserPage.classList.contains("is-visible") ||
      dom.workspaceBrowserEmptyPage.classList.contains("is-visible");
  }
  workspaceSwitchInProgress = true;
  desiredWorkspaceId = nextId;
  const requestId = ++workspaceSwitchSequence;
  const presentationRequestId = ++workspacePresentationSequence;
  dom.toastStack.querySelectorAll('[data-toast-key="workspace"]').forEach((item) => item.remove());

  appState = { ...appState, activeWorkspaceId: nextId };
  clearWorkspaceBrowserPresentation(nextId, {
    showEmpty: workspaceSwitchBrowserIntent,
    hideNative: false,
  });
  renderAll();

  const runSwitch = async () => {
    if (requestId !== workspaceSwitchSequence) return;
    try {
      let result;
      let persistenceUnavailable = false;
      if (typeof window.siteNest?.setActiveWorkspace === "function") {
        result = await window.siteNest.setActiveWorkspace(nextId);
      } else {
        persistenceUnavailable = true;
        result = {
          state: appState,
          browserState: normalizeWorkspaceBrowserState(null, nextId),
        };
      }
      if (requestId !== workspaceSwitchSequence) return;

      applyReturnedState(result);
      if (!result?.state && !result?.sites) appState.activeWorkspaceId = nextId;
      desiredWorkspaceId = activeWorkspaceId();
      renderAll();
      if (nextId === "work" && !zohoDashboard) void loadZohoDashboard();

      const nextBrowserState = normalizeWorkspaceBrowserState(result?.browserState, nextId);
      const presentationStillCurrent = presentationRequestId === workspacePresentationSequence;
      const shouldPresentBrowser = workspaceSwitchBrowserIntent && presentationStillCurrent;
      const restored = shouldPresentBrowser &&
        (nextBrowserState.hasOpenPage || nextBrowserState.tabs.length > 0)
        ? restoreWorkspaceBrowserPresentation(nextBrowserState)
        : false;
      if (presentationStillCurrent && !restored) {
        clearWorkspaceBrowserPresentation(nextId, { showEmpty: shouldPresentBrowser });
        if (currentRoute === "home") setVisibleLocalPage("home");
      } else if (!presentationStillCurrent && !dom.browserPage.classList.contains("is-visible")) {
        window.siteNest?.hideBrowser();
      }

      if (persistenceUnavailable) {
        showWorkspaceToast(
          "空间选择仅在当前窗口生效",
          "桌面端尚未提供空间持久化接口",
          "error",
        );
      } else {
        const detail = shouldPresentBrowser
          ? restored
            ? "已恢复这个空间上次打开的网页"
            : "该空间尚未打开网页，已显示空白页"
          : workspaceName(nextId);
        showWorkspaceToast("已切换空间", detail);
      }
    } catch (error) {
      if (requestId !== workspaceSwitchSequence) return;
      try {
        if (typeof window.siteNest?.getState === "function") {
          appState = await window.siteNest.getState();
        }
      } catch {
        appState.activeWorkspaceId = nextId;
      }
      desiredWorkspaceId = activeWorkspaceId();
      const presentationStillCurrent = presentationRequestId === workspacePresentationSequence;
      const shouldPresentBrowser = workspaceSwitchBrowserIntent && presentationStillCurrent;
      if (presentationStillCurrent) {
        clearWorkspaceBrowserPresentation(activeWorkspaceId(), { showEmpty: shouldPresentBrowser });
      } else if (!dom.browserPage.classList.contains("is-visible")) {
        window.siteNest?.hideBrowser();
      }
      renderAll();
      showWorkspaceToast("无法切换空间", error?.message || "请稍后重试", "error");
    } finally {
      if (requestId === workspaceSwitchSequence) {
        workspaceSwitchInProgress = false;
        workspaceSwitchBrowserIntent = false;
      }
    }
  };

  workspaceSwitchChain = workspaceSwitchChain.catch(() => undefined).then(runSwitch);
  return workspaceSwitchChain;
}

function updateActiveNavigation() {
  document.querySelectorAll("[data-route]").forEach((button) => {
    const route = ["bookmarks", "chromeBookmarks", "chrome-bookmarks"].includes(button.dataset.route)
      ? "settings"
      : button.dataset.route;
    button.classList.toggle("is-active", route === currentRoute);
  });
}

function navigateTo(route) {
  workspacePresentationSequence += 1;
  const requestedRoute = String(route || "home");
  const chromeBookmarksTarget = ["bookmarks", "chromeBookmarks", "chrome-bookmarks", "settings/chrome-bookmarks"].includes(requestedRoute);
  if (chromeBookmarksTarget) route = "settings";
  if (["checkins", "signin", "signins"].includes(route)) {
    currentAutomationTab = "checkins";
    route = "automations";
  } else if (String(route).startsWith("automations:")) {
    currentAutomationTab = String(route).split(":")[1] || "checkins";
    route = "automations";
  }
  currentRoute = route;
  currentSite = null;
  setPageActionPanelOpen(false);
  window.siteNest?.hideBrowser();
  dom.browserPage.classList.remove("is-visible");
  setVisibleLocalPage(route);
  if (route === "home") {
    renderWorkHome();
    renderResearchHome();
    if (activeWorkspaceId() === "work" && !zohoDashboard) void loadZohoDashboard();
  }
  if (route === "sites") renderSiteLibrary();
  if (route === "plan") renderPlan();
  if (route === "settings") {
    void loadSystemInfo();
    void loadZohoConnectorStatus();
    renderBookmarks();
    if (chromeBookmarksTarget) {
      requestAnimationFrame(() => requestAnimationFrame(() => {
        dom.chromeBookmarksSettingsSection.scrollIntoView({ block: "start" });
        dom.chromeBookmarksSettingsSection.focus({ preventScroll: true });
      }));
    }
  }
  if (route === "automations") {
    selectAutomationTab(currentAutomationTab, { load: false });
    void window.siteNest?.getAutomationStatus().then((status) =>
      renderNaixiAutomation(status?.naixi),
    );
    if (currentAutomationTab === "assistants") void loadAssistants();
    if (currentAutomationTab === "scripts") void loadUserScripts();
    if (currentAutomationTab === "logs") void loadExecutionLogs();
  }
  updateActiveNavigation();
}

async function showSite(site, options = {}) {
  if (!site?.url) return;
  workspacePresentationSequence += 1;
  const browserSite = {
    ...site,
    workspaceId: site.workspaceId || activeWorkspaceId(),
  };
  setPageActionPanelOpen(false);
  closeAllModals(false);
  currentRoute = `site:${browserSite.id}`;
  currentSite = browserSite;
  browserSnapshot = {
    ...emptyBrowserSnapshot(activeWorkspaceId()),
    siteId: browserSite.id || null,
    hasOpenPage: true,
    url: browserSite.url,
    currentURL: browserSite.url,
    loading: true,
  };
  document.querySelectorAll(".local-page").forEach((page) =>
    page.classList.remove("is-visible"),
  );
  dom.browserPage.classList.add("is-visible");
  dom.browserSiteLogo.textContent = browserSite.shortName || shortName(browserSite.name);
  dom.browserSiteLogo.style.setProperty("--site-color", browserSite.color || colorFromString(browserSite.url));
  dom.browserSiteName.textContent = browserSite.name || hostFromUrl(browserSite.url);
  dom.browserSiteStatus.textContent = "正在连接";
  dom.addressInput.value = browserSite.url;
  const host = hostFromUrl(browserSite.url);
  dom.siteLoginButton.classList.toggle("is-hidden", host !== "nodeseek.com");
  dom.repairNetworkButton.classList.add("is-hidden");
  dom.resetNodeSeekSession.classList.add("is-hidden");
  updateActiveNavigation();
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    const result = options.duplicate
      ? await window.siteNest?.duplicateSiteTab?.(browserSite.id, browserBounds())
      : await window.siteNest?.showBrowser({
          url: browserSite.url,
          siteId: browserSite.id,
          bounds: browserBounds(),
        });
    if (options.duplicate && !result) {
      throw new Error("桌面端尚未提供复制页签接口");
    }
    applyReturnedState(result);
    const nextBrowserState = browserStateFromResult(result);
    if (nextBrowserState) handleBrowserState(nextBrowserState);
    const storedSite = appState.sites.find((item) => item.id === browserSite.id);
    if (storedSite) {
      storedSite.lastOpenedAt = new Date().toISOString();
      renderQuickSites();
    }
    return nextBrowserState;
  } catch (error) {
    showToast(
      options.duplicate ? "无法复制页签" : "网站无法打开",
      error?.message || "请检查网络连接",
      "error",
    );
    return null;
  }
}

async function duplicateSiteAsTab(site, options = {}) {
  if (!site?.id || !site?.url) return null;
  const targetWorkspaceId = siteWorkspaceId(site);
  if (targetWorkspaceId !== activeWorkspaceId()) {
    await switchWorkspace(targetWorkspaceId);
  }
  const next = await showSite(site, { duplicate: true });
  if (!next?.activeTabId) return null;
  if (options.detach) {
    await detachBrowserTabToWindow(next.activeTabId, options.anchor || {});
  } else {
    showToast("已复制页签", site.name || hostFromUrl(site.url));
  }
  return next;
}

async function duplicateExistingBrowserTab(tabId, options = {}) {
  if (!tabId || typeof window.siteNest?.duplicateBrowserTab !== "function") {
    showToast("无法复制页签", "桌面端尚未提供复制页签接口", "error");
    return null;
  }
  try {
    const result = await window.siteNest.duplicateBrowserTab(tabId, browserBounds());
    const next = commitBrowserTabResult(result);
    if (!next?.activeTabId) throw new Error("没有收到新标签状态");
    if (options.detach) {
      await detachBrowserTabToWindow(next.activeTabId, options.anchor || {});
    } else {
      showToast("已复制页签", next.title || hostFromUrl(next.url));
    }
    return next;
  } catch (error) {
    showToast("无法复制页签", error?.message || "请稍后重试", "error");
    return null;
  }
}

async function openSite(site) {
  if (!site?.url) return;
  const targetWorkspaceId = site.workspaceId ? siteWorkspaceId(site) : activeWorkspaceId();
  if (targetWorkspaceId !== activeWorkspaceId()) {
    await switchWorkspace(targetWorkspaceId);
  }
  if (site.openMode !== "external") {
    await showSite(site);
    return;
  }
  try {
    let result;
    if (site.id && typeof window.siteNest?.openSite === "function") {
      result = await window.siteNest.openSite(site.id);
      applyReturnedState(result);
    } else {
      result = await window.siteNest?.openExternal(site.url);
    }
    const storedSite = appState.sites.find((item) => item.id === site.id);
    if (storedSite) storedSite.lastOpenedAt = new Date().toISOString();
    renderAll();
    showToast("已在系统浏览器打开", site.name || hostFromUrl(site.url));
    return result;
  } catch (error) {
    showToast("网站无法打开", error?.message || "请检查系统默认浏览器", "error");
  }
}

async function resumeBrowserAfterModal() {
  if (!currentSite || !dom.browserPage.classList.contains("is-visible")) return;
  const resumeUrl = browserSnapshot.url || currentSite.url;
  try {
    await window.siteNest?.showBrowser({
      url: resumeUrl,
      siteId: currentSite.id,
      bounds: browserBounds(),
    });
  } catch {
    // The regular browser status event will expose a navigation error.
  }
}

function isSitePinned(site) {
  return site?.pinned !== false;
}

function recentSites(workspaceId = activeWorkspaceId()) {
  return sitesForWorkspace(workspaceId)
    .map((site, index) => ({ site, index }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.site.lastOpenedAt || "") || 0;
      const rightTime = Date.parse(right.site.lastOpenedAt || "") || 0;
      if (leftTime !== rightTime) return rightTime - leftTime;
      return left.index - right.index;
    })
    .map(({ site }) => site);
}

function closeSiteContextMenu() {
  siteContextMenuTarget = null;
  dom.appContextMenu.hidden = true;
  dom.appContextMenu.replaceChildren();
}

function contextMenuButton(label, icon, handler, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `app-context-menu-button${options.danger ? " is-danger" : ""}`;
  button.setAttribute("role", "menuitem");
  button.append(createIconElement(icon), document.createTextNode(label));
  button.addEventListener("click", () => {
    closeSiteContextMenu();
    void handler();
  });
  return button;
}

function positionAppContextMenu(anchor = {}) {
  const sidebarRect = dom.appSidebar.getBoundingClientRect();
  const fromSidebar = anchor.element?.closest?.("#appSidebar");
  const requestedX = Number(anchor.clientX) || anchor.element?.getBoundingClientRect?.().right || 12;
  const requestedY = Number(anchor.clientY) || anchor.element?.getBoundingClientRect?.().bottom || 12;
  requestAnimationFrame(() => {
    if (!siteContextMenuTarget) return;
    const menuRect = dom.appContextMenu.getBoundingClientRect();
    const maxX = fromSidebar
      ? Math.max(8, sidebarRect.right - menuRect.width - 8)
      : Math.max(8, window.innerWidth - menuRect.width - 8);
    const x = Math.max(8, Math.min(maxX, requestedX));
    const y = Math.max(8, Math.min(window.innerHeight - menuRect.height - 8, requestedY));
    dom.appContextMenu.style.left = `${Math.round(x)}px`;
    dom.appContextMenu.style.top = `${Math.round(y)}px`;
    dom.appContextMenu.querySelector(".app-context-menu-button")?.focus();
  });
}

function openSiteContextMenu(site, anchor = {}) {
  if (!site?.id || !site?.url) return;
  siteContextMenuTarget = site;
  const title = document.createElement("strong");
  title.className = "app-context-menu-title";
  title.textContent = `${workspaceName(siteWorkspaceId(site))} · ${site.name}`;
  const divider = document.createElement("div");
  divider.className = "app-context-menu-divider";
  dom.appContextMenu.replaceChildren(
    title,
    contextMenuButton("打开", "compass", () => openSite(site)),
    contextMenuButton("复制页签", "copy", () => duplicateSiteAsTab(site)),
    divider,
    contextMenuButton("在独立窗口打开", "external", () =>
      duplicateSiteAsTab(site, { detach: true, anchor }),
    ),
  );
  dom.appContextMenu.hidden = false;
  positionAppContextMenu(anchor);
}

async function copySessionUrl(tabId) {
  try {
    const result = await window.siteNest.copyBrowserTabUrl(tabId);
    showToast("页面链接已复制", hostFromUrl(result?.url || ""));
  } catch (error) {
    showToast("无法复制页面链接", error?.message || "请稍后重试", "error");
  }
}

async function openSessionExternally(tabId) {
  try {
    const result = await window.siteNest.openBrowserTabExternal(tabId);
    showToast("已在外部浏览器打开", hostFromUrl(result?.url || ""));
  } catch (error) {
    showToast("无法外部打开", error?.message || "请稍后重试", "error");
  }
}

async function executeSessionContextAction(session, action) {
  if (!session?.tabId || !action) return;
  if (action === "duplicate") {
    await duplicateExistingBrowserTab(session.tabId);
  } else if (action === "copy-url") {
    await copySessionUrl(session.tabId);
  } else if (action === "open-external") {
    await openSessionExternally(session.tabId);
  } else if (action === "keep-running" || action === "allow-sleep") {
    browserLifecycleState = await window.siteNest.setBrowserTabKeepRunning(session.tabId, action === "keep-running");
    renderBrowserMemorySettings();
    showToast(action === "keep-running" ? "页签将保持运行" : "页签可以自动休眠", sessionTitle(session));
  } else if (action === "suspend") {
    browserLifecycleState = await window.siteNest.suspendBrowserTab(session.tabId);
    renderBrowserMemorySettings();
    showToast("页签已休眠", "再次选择时会恢复原地址和登录身份");
  } else if (action === "close") {
    await closeSessionFromSidebar(session);
  }
}

async function openTopTabContextMenu(session) {
  if (!session?.tabId) return;
  if (typeof window.siteNest?.showBrowserTabContextMenu !== "function") {
    openSessionContextMenu(session);
    return;
  }
  try {
    const result = await window.siteNest.showBrowserTabContextMenu(session.tabId);
    await executeSessionContextAction(session, result?.action);
  } catch (error) {
    showToast("无法打开页签菜单", error?.message || "请稍后重试", "error");
  }
}

function openSessionContextMenu(session, anchor = {}) {
  if (!session?.tabId) return;
  siteContextMenuTarget = { type: "session", tabId: session.tabId };
  const title = document.createElement("strong");
  title.className = "app-context-menu-title";
  title.textContent = `${workspaceName(session.workspaceId)} · ${sessionTitle(session)}`;
  const divider = document.createElement("div");
  divider.className = "app-context-menu-divider";
  dom.appContextMenu.replaceChildren(
    title,
    contextMenuButton("复制页签", "copy", () => executeSessionContextAction(session, "duplicate")),
    contextMenuButton("复制页面链接", "link", () => executeSessionContextAction(session, "copy-url")),
    contextMenuButton("在外部浏览器打开", "external", () => executeSessionContextAction(session, "open-external")),
    contextMenuButton(session.keepRunning ? "取消保持运行" : "保持运行", "window", () => executeSessionContextAction(session, session.keepRunning ? "allow-sleep" : "keep-running")),
    contextMenuButton("立即休眠", "clock", () => executeSessionContextAction(session, "suspend")),
    divider,
    contextMenuButton("关闭页签", "close", () => executeSessionContextAction(session, "close"), { danger: true }),
  );
  dom.appContextMenu.hidden = false;
  positionAppContextMenu(anchor);
}

function bindSiteContextMenu(element, site) {
  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openSiteContextMenu(site, {
      clientX: event.clientX,
      clientY: event.clientY,
      screenX: event.screenX,
      screenY: event.screenY,
      element,
    });
  });
}

function allCurrentSessions() {
  const result = [];
  for (const workspace of workspaces()) {
    const snapshot = appState.workspaceBrowserStates?.[workspace.id] || {};
    const tabs = Array.isArray(snapshot.tabs) ? snapshot.tabs : [];
    tabs.forEach((tab) => result.push({
      ...tab,
      sessionId: tab.sessionId || tab.tabId,
      workspaceId: workspace.id,
      active: workspace.id === activeWorkspaceId() && snapshot.activeTabId === tab.tabId,
    }));
  }
  return result.sort((left, right) =>
    Date.parse(right.lastActiveAt || right.updatedAt || 0) -
      Date.parse(left.lastActiveAt || left.updatedAt || 0),
  );
}

function sessionTitle(session) {
  const site = appState.sites.find((item) => item.id === session.siteId);
  return session.title || site?.name || hostFromUrl(session.url) || "未命名页面";
}

async function showSession(session) {
  if (!session?.tabId) return;
  if (session.workspaceId !== activeWorkspaceId()) {
    await switchWorkspace(session.workspaceId);
  }
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  dom.browserPage.classList.add("is-visible");
  currentRoute = `session:${session.tabId}`;
  currentSite = appState.sites.find((site) => site.id === session.siteId) || {
    id: `session:${session.tabId}`,
    name: sessionTitle(session),
    shortName: shortName(sessionTitle(session)),
    url: session.url,
    workspaceId: session.workspaceId,
    color: colorFromString(session.url),
  };
  try {
    const result = await window.siteNest.selectBrowserTab(session.tabId, browserBounds());
    commitBrowserTabResult(result);
    updateActiveNavigation();
    renderCurrentSessions();
    requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
  } catch (error) {
    showToast("无法打开当前会话", error?.message || "请稍后重试", "error");
  }
}

async function closeSessionFromSidebar(session) {
  try {
    setPageActionPanelOpen(false);
    const result = await window.siteNest.closeBrowserTab(session.tabId, browserBounds());
    const next = browserStateFromResult(result);
    if (next?.workspaceId === activeWorkspaceId()) handleBrowserState(next);
    appState = await window.siteNest.getState();
    renderAll();
  } catch (error) {
    showToast("无法关闭当前会话", error?.message || "请稍后重试", "error");
  }
}

function renderCurrentSessions() {
  const visibility = appState.uiSettings?.sessionVisibility === "workspace"
    ? "workspace"
    : "all";
  const sessions = allCurrentSessions().filter((session) =>
    visibility === "all" || session.workspaceId === activeWorkspaceId(),
  );
  const total = allCurrentSessions().length;
  dom.currentSessionCount.textContent = String(visibility === "all" ? total : sessions.length);
  dom.sessionScopeToggle.textContent = visibility === "all" ? "全部" : "本空间";
  dom.sessionScopeToggle.title = visibility === "all"
    ? "当前显示全部空间会话；点击后仅显示当前空间"
    : "当前仅显示当前空间会话；点击后显示全部空间";
  dom.sessionVisibilitySetting.checked = visibility === "workspace";
  dom.currentSessionList.replaceChildren();
  if (!sessions.length) {
    const empty = document.createElement("div");
    empty.className = "current-session-empty";
    empty.textContent = visibility === "all" ? "暂无打开的页面" : "当前空间暂无打开的页面";
    dom.currentSessionList.appendChild(empty);
    return;
  }
  for (const session of sessions) {
    const item = document.createElement("div");
    item.className = `current-session-item${session.active ? " is-active" : ""}`;
    item.dataset.sessionId = session.tabId;
    const main = document.createElement("button");
    main.type = "button";
    main.className = "current-session-main";
    main.title = sessionTitle(session);
    const favicon = document.createElement("span");
    favicon.className = "session-favicon";
    if (session.favicon) {
      const image = document.createElement("img");
      image.src = session.favicon;
      image.alt = "";
      image.referrerPolicy = "no-referrer";
      image.addEventListener("error", () => {
        favicon.replaceChildren(document.createTextNode(shortName(sessionTitle(session))));
      }, { once: true });
      favicon.appendChild(image);
    } else {
      favicon.textContent = shortName(sessionTitle(session));
    }
    const copy = document.createElement("span");
    copy.className = "current-session-copy";
    const title = document.createElement("strong");
    title.textContent = sessionTitle(session);
    const meta = document.createElement("small");
    const badge = document.createElement("span");
    badge.className = "session-workspace-badge";
    badge.textContent = workspaceName(session.workspaceId);
    const lifecycleLabel = session.lifecycleState === "suspended"
      ? " · 已休眠"
      : session.keepRunning ? " · 保持运行" : "";
    meta.append(badge, document.createTextNode(`${hostFromUrl(session.url)}${lifecycleLabel}`));
    copy.append(title, meta);
    main.append(favicon, copy);
    main.addEventListener("click", () => void showSession(session));

    const actions = document.createElement("span");
    actions.className = "current-session-actions";
    const close = document.createElement("button");
    close.type = "button";
    close.title = "关闭会话";
    close.setAttribute("aria-label", `关闭 ${sessionTitle(session)}`);
    close.appendChild(createIconElement("close"));
    close.addEventListener("click", (event) => {
      event.stopPropagation();
      void closeSessionFromSidebar(session);
    });
    const more = document.createElement("button");
    more.type = "button";
    more.title = "更多操作";
    more.setAttribute("aria-label", `${sessionTitle(session)} 的更多操作`);
    more.appendChild(createIconElement("copy"));
    more.addEventListener("click", (event) => {
      event.stopPropagation();
      openSessionContextMenu(session, { element: more });
    });
    actions.append(close, more);
    item.append(main, actions);
    item.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      openSessionContextMenu(session, {
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        element: item,
      });
    });
    dom.currentSessionList.appendChild(item);
  }
}

const POPUP_MODE_LABELS = {
  popup: "受控弹窗",
  tab: "栖页页签",
  external: "外部浏览器",
  ask: "每次询问",
  block: "阻止",
};

function popupPolicies() {
  return Array.isArray(appState.uiSettings?.sitePopupPolicies)
    ? appState.uiSettings.sitePopupPolicies
    : [];
}

function normalizePopupHostnameInput(rawValue) {
  const value = String(rawValue || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  if (!/^(?:\*\.)?[a-z0-9.-]+$/i.test(value) || !value.includes(".")) {
    throw new Error("请输入有效域名，例如 accounts.sap.com 或 *.example.com");
  }
  return value.slice(0, 253);
}

function renderPopupPolicies() {
  if (!dom.popupPolicyList) return;
  const policies = popupPolicies();
  dom.popupPolicyCount.textContent = policies.length ? `${policies.length} 条规则` : "自动判断";
  dom.popupPolicyList.replaceChildren();
  if (!policies.length) {
    const empty = document.createElement("div");
    empty.className = "popup-policy-empty";
    empty.textContent = "暂无自定义规则；OAuth、SSO、POST 登录窗口将由栖页自动识别。";
    dom.popupPolicyList.appendChild(empty);
    return;
  }
  policies.forEach((policy) => {
    const row = document.createElement("div");
    row.className = "popup-policy-row";
    const copy = document.createElement("div");
    const host = document.createElement("strong");
    host.textContent = policy.hostnamePattern;
    const details = document.createElement("small");
    details.textContent = [
      POPUP_MODE_LABELS[policy.mode] || "每次询问",
      policy.preserveOpener !== false ? "保留 opener" : "隔离 opener",
      policy.allowPost ? "允许 POST" : "阻止 POST",
    ].join(" · ");
    copy.append(host, details);
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "text-button text-button--quiet";
    remove.textContent = "删除";
    remove.addEventListener("click", async () => {
      const next = policies.filter((item) => item.hostnamePattern !== policy.hostnamePattern);
      try {
        const result = await window.siteNest.updateUiSettings({ sitePopupPolicies: next });
        appState = result.state || { ...appState, uiSettings: result.uiSettings };
        renderPopupPolicies();
        showToast("弹窗规则已删除", policy.hostnamePattern);
      } catch (error) {
        showToast("无法删除弹窗规则", error?.message || "请稍后重试", "error");
      }
    });
    row.append(copy, remove);
    dom.popupPolicyList.appendChild(row);
  });
}

const BROWSER_MEMORY_LABELS = { saver: "节省内存", standard: "标准", performance: "性能优先" };

function renderBrowserMemorySettings(snapshot = browserLifecycleState) {
  if (!dom.browserMemoryMode) return;
  const settings = snapshot?.settings || appState.uiSettings?.browserMemory || { mode: "standard", inactiveMinutes: 15 };
  if (document.activeElement !== dom.browserMemoryMode) dom.browserMemoryMode.value = settings.mode || "standard";
  if (document.activeElement !== dom.browserMemoryInactiveMinutes) dom.browserMemoryInactiveMinutes.value = String(settings.inactiveMinutes ?? 15);
  dom.browserMemoryStatus.textContent = BROWSER_MEMORY_LABELS[settings.mode] || "标准";
  const counts = snapshot?.counts || {};
  dom.browserMemoryRuntime.textContent = `活动 ${counts.active || 0} · 预热 ${counts.warm || 0} · 已休眠 ${counts.suspended || 0}${counts.crashed ? ` · 异常 ${counts.crashed}` : ""}`;
}

async function loadBrowserLifecycle() {
  if (typeof window.siteNest?.getBrowserLifecycle !== "function") return browserLifecycleState;
  try {
    browserLifecycleState = await window.siteNest.getBrowserLifecycle();
    renderBrowserMemorySettings();
  } catch (error) {
    showToast("无法读取网页内存状态", error?.message || "请稍后重试", "error");
  }
  return browserLifecycleState;
}

function renderTranslationSettings() {
  if (!dom.translationConfigForm) return;
  const settings = translationStatusCache?.settings || appState.uiSettings?.translation || {};
  const publicConfig = settings.publicConfig || {};
  if (document.activeElement !== dom.translationApiBase) {
    dom.translationApiBase.value = publicConfig.baseUrl || "https://api.openai.com/v1";
  }
  if (document.activeElement !== dom.translationModel) {
    dom.translationModel.value = publicConfig.model || "gpt-4o-mini";
  }
  dom.translationSourceLanguage.value = settings.sourceLanguage || "auto";
  dom.translationTargetLanguage.value = settings.targetLanguage || "zh-CN";
  dom.translationDefaultMode.value = settings.defaultMode || "bilingual";
  dom.translationSelectionButton.checked = settings.selectionButtonEnabled !== false;
  const configured = translationStatusCache?.configured === true;
  dom.translationSettingsStatus.textContent = configured ? "已配置" : "未配置";
  dom.translationSettingsStatus.classList.toggle("status-pill--success", configured);
  dom.translatePageButton.classList.toggle("is-configured", configured);
  dom.translatePageButton.title = configured ? "翻译本页" : "翻译本页（Provider 未配置）";
  dom.translationApiKey.placeholder = translationStatusCache?.hasApiKey
    ? "密钥已安全保存；留空保持不变"
    : "输入 API Key";
}

async function loadTranslationStatus() {
  if (typeof window.siteNest?.getTranslationStatus !== "function") return null;
  try {
    translationStatusCache = await window.siteNest.getTranslationStatus();
    if (translationStatusCache?.settings) {
      appState.uiSettings = {
        ...(appState.uiSettings || {}),
        translation: translationStatusCache.settings,
      };
    }
    renderTranslationSettings();
    return translationStatusCache;
  } catch (error) {
    translationStatusCache = { configured: false, hasApiKey: false };
    renderTranslationSettings();
    showToast("无法读取翻译配置", error?.message || "系统安全存储不可用", "error");
    return null;
  }
}

function translationFormPayload() {
  return {
    baseUrl: dom.translationApiBase.value.trim(),
    model: dom.translationModel.value.trim(),
    apiKey: dom.translationApiKey.value.trim(),
    sourceLanguage: dom.translationSourceLanguage.value,
    targetLanguage: dom.translationTargetLanguage.value,
    defaultMode: dom.translationDefaultMode.value,
    selectionButtonEnabled: dom.translationSelectionButton.checked,
  };
}

const TASK_PRIORITY_LABELS = { low: "低", normal: "普通", high: "高", urgent: "紧急" };
const TASK_STATUS_LABELS = { todo: "待办", doing: "进行中", done: "已完成", cancelled: "已取消" };

function localDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.valueOf())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function startOfLocalWeek(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function isoWeekNumber(value) {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

function taskDate(task) {
  return task.dueAt || task.startAt || task.createdAt;
}

function taskDueLabel(task) {
  if (!task.dueAt) return "未设置截止时间";
  const date = new Date(task.dueAt);
  return task.allDay
    ? date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })
    : date.toLocaleString("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function taskSort(left, right) {
  const priority = { urgent: 0, high: 1, normal: 2, low: 3 };
  const leftTime = Date.parse(left.dueAt || left.startAt || "9999-12-31");
  const rightTime = Date.parse(right.dueAt || right.startAt || "9999-12-31");
  return leftTime - rightTime || priority[left.priority] - priority[right.priority] || String(left.orderKey).localeCompare(String(right.orderKey));
}

async function setTaskCompleted(task, completed) {
  try {
    const result = await window.siteNest.setTaskStatus(task.id, completed ? "done" : "todo");
    applyTaskSnapshot(result);
  } catch (error) {
    showToast("无法更新任务", error?.message || "请稍后重试", "error");
  }
}

function createTaskCard(task, options = {}) {
  const card = document.createElement("article");
  card.className = `local-task-card${options.compact ? " local-task-card--compact" : ""}`;
  card.dataset.taskId = task.id;
  card.dataset.priority = task.priority;
  card.dataset.status = task.status;
  const checkbox = document.createElement("button");
  checkbox.type = "button";
  checkbox.className = "task-complete-button";
  checkbox.setAttribute("aria-label", task.status === "done" ? "标记为未完成" : "标记完成");
  checkbox.appendChild(createIconElement(task.status === "done" ? "check" : "clock"));
  checkbox.addEventListener("click", (event) => {
    event.stopPropagation();
    void setTaskCompleted(task, task.status !== "done");
  });
  const copy = document.createElement("div");
  copy.className = "local-task-copy";
  const title = document.createElement("strong");
  title.textContent = task.title;
  const meta = document.createElement("div");
  meta.className = "local-task-meta";
  const due = document.createElement("span");
  due.textContent = taskDueLabel(task);
  const workspace = document.createElement("span");
  workspace.textContent = workspaceName(task.workspaceId);
  const priority = document.createElement("span");
  priority.className = `task-priority task-priority--${task.priority}`;
  priority.textContent = TASK_PRIORITY_LABELS[task.priority] || "普通";
  meta.append(due, workspace, priority);
  if (task.reminderOffsets?.length && task.dueAt) {
    const reminder = document.createElement("span");
    reminder.className = "task-reminder-indicator";
    reminder.title = `${task.reminderOffsets.length} 个本地提醒`;
    reminder.appendChild(createIconElement("clock"));
    meta.appendChild(reminder);
  }
  copy.append(title, meta);
  card.append(checkbox, copy);
  card.addEventListener("click", () => openTaskModal(task));
  return card;
}

function taskForId(taskId) {
  return taskState.tasks.find((task) => task.id === String(taskId || "")) || null;
}

function toLocalDateTimeInput(iso) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) return "";
  const local = new Date(date.valueOf() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function fromLocalDateTimeInput(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function openTaskModal(task = null, day = null) {
  dom.taskForm.reset();
  dom.taskId.value = task?.id || "";
  dom.taskModalTitle.textContent = task ? "编辑任务" : "添加任务";
  dom.taskTitle.value = task?.title || "";
  dom.taskNotes.value = task?.notes || "";
  dom.taskWorkspace.value = task?.workspaceId || activeWorkspaceId();
  dom.taskPriority.value = task?.priority || "normal";
  dom.taskStatus.value = task?.status || "todo";
  dom.taskStartAt.value = toLocalDateTimeInput(task?.startAt);
  dom.taskDueAt.value = toLocalDateTimeInput(task?.dueAt);
  if (!task && day) {
    const due = new Date(day);
    due.setHours(17, 0, 0, 0);
    dom.taskDueAt.value = toLocalDateTimeInput(due.toISOString());
  }
  dom.taskAllDay.checked = task?.allDay === true;
  const standard = new Set([0, 5, 10, 15, 30, 60, 1440]);
  dom.taskForm.querySelectorAll('input[name="taskReminder"]').forEach((input) => {
    input.checked = task?.reminderOffsets?.includes(Number(input.value)) || false;
  });
  const custom = task?.reminderOffsets?.find((offset) => !standard.has(offset));
  dom.taskCustomReminder.value = Number.isFinite(custom) ? String(custom) : "";
  dom.taskTags.value = (task?.tags || []).join(", ");
  dom.deleteTaskButton.classList.toggle("is-hidden", !task);
  openModal(dom.taskModal);
}

function taskFormPayload() {
  const reminderOffsets = Array.from(dom.taskForm.querySelectorAll('input[name="taskReminder"]:checked'))
    .map((input) => Number(input.value));
  const custom = Number(dom.taskCustomReminder.value);
  if (dom.taskCustomReminder.value !== "" && Number.isFinite(custom) && custom >= 0) reminderOffsets.push(custom);
  return {
    id: dom.taskId.value || undefined,
    title: dom.taskTitle.value.trim(),
    notes: dom.taskNotes.value,
    workspaceId: dom.taskWorkspace.value,
    priority: dom.taskPriority.value,
    status: dom.taskStatus.value,
    startAt: fromLocalDateTimeInput(dom.taskStartAt.value),
    dueAt: fromLocalDateTimeInput(dom.taskDueAt.value),
    allDay: dom.taskAllDay.checked,
    reminderOffsets,
    tags: dom.taskTags.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
  };
}

function renderTaskList(container, tasks, emptyText = "暂无任务") {
  container.replaceChildren();
  if (!tasks.length) {
    const empty = document.createElement("div");
    empty.className = "task-empty-state";
    empty.textContent = emptyText;
    container.appendChild(empty);
    return;
  }
  tasks.forEach((task) => container.appendChild(createTaskCard(task)));
}

function renderTaskWeek() {
  if (!dom.taskWeekGrid) return;
  const start = startOfLocalWeek(taskWeekAnchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  dom.taskWeekTitle.textContent = `本周 W${String(isoWeekNumber(start)).padStart(2, "0")}`;
  dom.taskWeekRange.textContent = `${start.toLocaleDateString("zh-CN")} — ${end.toLocaleDateString("zh-CN")}`;
  dom.taskWeekGrid.replaceChildren();
  const todayKey = localDateKey(new Date());
  for (let index = 0; index < 7; index += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + index);
    const key = localDateKey(day);
    const column = document.createElement("section");
    column.className = `task-day-column${key === todayKey ? " is-today" : ""}`;
    const header = document.createElement("header");
    header.innerHTML = `<span>${["一", "二", "三", "四", "五", "六", "日"][index]}</span><strong>${day.getMonth() + 1}/${day.getDate()}</strong>`;
    const list = document.createElement("div");
    list.className = "task-day-list";
    const tasks = taskState.tasks.filter((task) => localDateKey(taskDate(task)) === key && task.status !== "cancelled").sort(taskSort);
    tasks.forEach((task) => list.appendChild(createTaskCard(task, { compact: true })));
    if (!tasks.length) {
      const empty = document.createElement("small");
      empty.className = "task-day-empty";
      empty.textContent = "暂无任务";
      list.appendChild(empty);
    }
    const add = document.createElement("button");
    add.type = "button";
    add.className = "task-day-add";
    add.textContent = "+ 添加任务";
    add.addEventListener("click", () => openTaskModal(null, day));
    column.append(header, list, add);
    dom.taskWeekGrid.appendChild(column);
  }
  const todayColumn = dom.taskWeekGrid.querySelector(".task-day-column.is-today");
  if (todayColumn) {
    requestAnimationFrame(() => {
      const scroller = dom.taskWeekGrid.parentElement;
      const target = todayColumn.offsetLeft - (scroller.clientWidth - todayColumn.offsetWidth) / 2;
      scroller.scrollLeft = Math.max(0, target);
    });
  }
}

function renderTaskMonth() {
  if (!dom.taskMonthCalendar) return;
  const year = taskMonthAnchor.getFullYear();
  const month = taskMonthAnchor.getMonth();
  dom.taskMonthTitle.textContent = `${year} 年 ${month + 1} 月`;
  dom.taskMonthCalendar.replaceChildren();
  for (const label of ["一", "二", "三", "四", "五", "六", "日"]) {
    const head = document.createElement("span");
    head.className = "task-month-weekday";
    head.textContent = label;
    dom.taskMonthCalendar.appendChild(head);
  }
  const first = new Date(year, month, 1);
  const offset = (first.getDay() || 7) - 1;
  for (let blank = 0; blank < offset; blank += 1) dom.taskMonthCalendar.appendChild(document.createElement("span"));
  const days = new Date(year, month + 1, 0).getDate();
  const todayKey = localDateKey(new Date());
  for (let number = 1; number <= days; number += 1) {
    const day = new Date(year, month, number);
    const key = localDateKey(day);
    const tasks = taskState.tasks.filter((task) => localDateKey(taskDate(task)) === key && task.status !== "cancelled");
    const unfinished = tasks.filter((task) => task.status !== "done");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "task-month-day";
    if (key === todayKey) button.classList.add("is-today");
    if (key === localDateKey(selectedTaskDay)) button.classList.add("is-selected");
    if (tasks.some((task) => ["high", "urgent"].includes(task.priority) && task.status !== "done")) button.classList.add("has-priority");
    const count = tasks.length ? `<small>${unfinished.length}/${tasks.length}</small>` : "";
    button.innerHTML = `<strong>${number}</strong>${count}`;
    button.addEventListener("click", () => { selectedTaskDay = day; renderTaskMonth(); });
    dom.taskMonthCalendar.appendChild(button);
  }
  const selectedKey = localDateKey(selectedTaskDay);
  dom.taskSelectedDayTitle.textContent = `${selectedTaskDay.toLocaleDateString("zh-CN")} · 当天任务`;
  renderTaskList(
    dom.taskSelectedDayList,
    taskState.tasks.filter((task) => localDateKey(taskDate(task)) === selectedKey).sort(taskSort),
    "当天暂无任务",
  );
}

function renderPlan() {
  if (!dom.planViewTabs) return;
  dom.planViewTabs.querySelectorAll("[data-task-view]").forEach((button) => {
    const active = button.dataset.taskView === currentTaskView;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-task-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.taskPanel !== currentTaskView;
  });
  renderTaskWeek();
  renderTaskMonth();
  renderTaskList(dom.taskAllList, taskState.tasks.filter((task) => task.status !== "done").sort(taskSort), "暂无未完成任务");
  renderTaskList(dom.taskCompletedList, taskState.tasks.filter((task) => task.status === "done").sort((a, b) => Date.parse(b.completedAt) - Date.parse(a.completedAt)), "暂无已完成任务");
}

function renderWorkspaceTaskWidgets() {
  const today = new Date();
  const todayKey = localDateKey(today);
  const soon = new Date(today.valueOf() + 7 * 86400000);
  document.querySelectorAll("[data-workspace-task-widget]").forEach((container) => {
    const workspaceId = container.dataset.workspaceTaskWidget;
    const candidates = taskState.tasks.filter((task) => {
      if (task.workspaceId !== workspaceId || ["done", "cancelled"].includes(task.status)) return false;
      const due = task.dueAt ? new Date(task.dueAt) : null;
      return localDateKey(taskDate(task)) === todayKey || (due && due <= soon) || ["high", "urgent"].includes(task.priority);
    }).sort(taskSort).slice(0, 5);
    container.replaceChildren();
    const header = document.createElement("header");
    const copy = document.createElement("div");
    copy.innerHTML = '<span class="section-kicker">WEEKLY PLAN</span><h2>本周计划</h2>';
    const actions = document.createElement("div");
    const add = document.createElement("button"); add.type = "button"; add.className = "text-button"; add.textContent = "添加任务"; add.addEventListener("click", () => openTaskModal());
    const view = document.createElement("button"); view.type = "button"; view.className = "text-button"; view.textContent = "查看本周"; view.addEventListener("click", () => { currentTaskView = "week"; navigateTo("plan"); });
    actions.append(add, view); header.append(copy, actions);
    const list = document.createElement("div"); list.className = "workspace-task-list";
    if (!candidates.length) {
      const empty = document.createElement("p"); empty.className = "task-widget-empty"; empty.textContent = "本周还没有需要优先处理的任务。"; list.appendChild(empty);
    } else candidates.forEach((task) => list.appendChild(createTaskCard(task, { compact: true })));
    container.append(header, list);
  });
}

function renderTaskSettings() {
  if (!dom.taskRemindersEnabled) return;
  const settings = taskState.settings || {};
  dom.taskRemindersEnabled.checked = settings.remindersEnabled === true;
  dom.taskTrayOnClose.checked = settings.trayOnClose === true;
  dom.taskAutoLaunch.checked = settings.autoLaunch === true;
  dom.taskStartMinimized.checked = settings.startMinimized === true;
  dom.taskNotificationSound.checked = settings.notificationSound !== false;
  dom.taskDndEnabled.checked = settings.doNotDisturb?.enabled === true;
  dom.taskDndStart.value = settings.doNotDisturb?.start || "22:00";
  dom.taskDndEnd.value = settings.doNotDisturb?.end || "08:00";
  dom.taskReminderSettingsStatus.textContent = settings.remindersEnabled ? "提醒已启用" : "提醒已关闭";
  dom.taskReminderSettingsStatus.classList.toggle("status-pill--success", settings.remindersEnabled === true);
  const pausedUntil = Date.parse(settings.pausedUntil || 0);
  dom.taskPausedUntil.textContent = Number.isFinite(pausedUntil) && pausedUntil > Date.now()
    ? `提醒暂停至 ${new Date(pausedUntil).toLocaleString("zh-CN")}`
    : "完全退出后提醒停止";
}

function applyTaskSnapshot(snapshot = {}) {
  taskState = {
    tasks: Array.isArray(snapshot.tasks) ? snapshot.tasks : taskState.tasks,
    reminders: Array.isArray(snapshot.reminders) ? snapshot.reminders : taskState.reminders,
    settings: snapshot.settings || taskState.settings,
    timeZone: snapshot.timeZone || taskState.timeZone,
  };
  appState.localTasks = taskState.tasks;
  appState.taskReminders = taskState.reminders;
  appState.taskSettings = taskState.settings;
  const unfinished = taskState.tasks.filter((task) => !["done", "cancelled"].includes(task.status)).length;
  if (dom.sidebarTaskCount) dom.sidebarTaskCount.textContent = unfinished > 99 ? "99+" : String(unfinished);
  renderPlan();
  renderWorkspaceTaskWidgets();
  renderTaskSettings();
}

async function loadTasks() {
  if (typeof window.siteNest?.getTasks !== "function") return;
  try {
    applyTaskSnapshot(await window.siteNest.getTasks());
  } catch (error) {
    showToast("无法读取本地计划", error?.message || "请稍后重试", "error");
  }
}

function renderQuickSites() {
  dom.quickSiteGrid.replaceChildren();
  const quickSites = recentSites().slice(0, 3);
  if (!quickSites.length) {
    const empty = document.createElement("button");
    empty.type = "button";
    empty.className = "quick-card quick-card--empty";
    empty.append(
      createIconElement("plus", "quick-empty-icon"),
      document.createTextNode("添加第一个常用网站"),
    );
    empty.addEventListener("click", openAddSiteModal);
    dom.quickSiteGrid.appendChild(empty);
    return;
  }
  for (const site of quickSites) {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "quick-card";
    card.style.setProperty("--site-color", site.color);

    const logo = document.createElement("span");
    logo.className = "quick-site-logo";
    logo.style.setProperty("--site-color", site.color);
    logo.textContent = site.shortName || shortName(site.name);

    const copy = document.createElement("span");
    copy.className = "quick-site-copy";
    const name = document.createElement("strong");
    name.textContent = site.name;
    const detail = document.createElement("small");
    detail.textContent = `${site.description || hostFromUrl(site.url)} · 点击打开`;
    copy.append(name, detail);

    card.append(logo, copy, createIconElement("arrow-right", "quick-card-arrow"));
    card.addEventListener("click", () => void openSite(site));
    bindSiteContextMenu(card, site);
    dom.quickSiteGrid.appendChild(card);
  }
}

function formatSiteLastOpened(value) {
  if (!value) return "尚未打开";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return "尚未打开";
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return new Intl.DateTimeFormat("zh-CN", sameDay
    ? { hour: "2-digit", minute: "2-digit" }
    : { month: "numeric", day: "numeric" }).format(date);
}

function createWorkspaceSiteCard(site, className = "work-app-card") {
  const card = document.createElement("article");
  card.className = className;
  card.style.setProperty("--site-color", site.color || colorFromString(site.url));

  const header = document.createElement("div");
  header.className = "workspace-site-card-header";
  const logo = document.createElement("span");
  logo.className = "workspace-site-card-logo";
  logo.style.setProperty("--site-color", site.color || colorFromString(site.url));
  logo.textContent = site.shortName || shortName(site.name);
  const copy = document.createElement("div");
  const name = document.createElement("strong");
  name.textContent = site.name;
  const host = document.createElement("small");
  host.textContent = hostFromUrl(site.url);
  copy.append(name, host);
  const kind = document.createElement("span");
  kind.className = "site-source-badge";
  kind.textContent = siteKindLabel(site);
  header.append(logo, copy, kind);

  const description = document.createElement("p");
  description.textContent = site.description || "暂无简介";

  const footer = document.createElement("footer");
  const meta = document.createElement("div");
  meta.className = "workspace-site-card-meta";
  const lastOpened = document.createElement("span");
  lastOpened.append(createIconElement("clock"), document.createTextNode(formatSiteLastOpened(site.lastOpenedAt)));
  const mode = document.createElement("span");
  mode.append(
    createIconElement(site.openMode === "external" ? "external" : "compass"),
    document.createTextNode(siteOpenModeLabel(site)),
  );
  meta.append(lastOpened, mode);
  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "workspace-site-open-button";
  openButton.append(document.createTextNode("快速打开"), createIconElement("arrow-right"));
  openButton.addEventListener("click", () => void openSite(site));
  footer.append(meta, openButton);
  card.append(header, description, footer);
  bindSiteContextMenu(card, site);
  return card;
}

function createWorkspaceEmptyState(title, detail, buttonText, handler) {
  const empty = document.createElement("div");
  empty.className = "workspace-home-empty";
  empty.appendChild(createIconElement("grid", "empty-state-icon"));
  const strong = document.createElement("strong");
  strong.textContent = title;
  const small = document.createElement("small");
  small.textContent = detail;
  const action = document.createElement("button");
  action.type = "button";
  action.className = "primary-button compact-button";
  action.append(createIconElement("plus"), document.createTextNode(buttonText));
  action.addEventListener("click", handler);
  empty.append(strong, small, action);
  return empty;
}

function renderWorkSearchResults() {
  const query = dom.workGlobalSearch.value.trim().toLocaleLowerCase("zh-CN");
  dom.workSearchResults.replaceChildren();
  dom.workSearchResults.classList.toggle("is-hidden", !query);
  if (!query) return;

  const siteMatches = appState.sites.filter((site) =>
    `${site.name} ${site.url} ${site.description || ""}`.toLocaleLowerCase("zh-CN").includes(query),
  );
  const bookmarkMatches = appState.bookmarks.filter((bookmark) =>
    `${bookmark.name} ${bookmark.url} ${bookmark.folder || ""}`.toLocaleLowerCase("zh-CN").includes(query),
  );
  const matches = [
    ...siteMatches.map((site) => ({ type: "site", value: site })),
    ...bookmarkMatches.map((bookmark) => ({ type: "bookmark", value: bookmark })),
  ].slice(0, 8);

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "work-search-empty";
    empty.textContent = "没有匹配的本地站点或 Chrome 书签";
    dom.workSearchResults.appendChild(empty);
    return;
  }

  for (const match of matches) {
    const item = match.value;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "work-search-result";
    const logo = document.createElement("span");
    logo.style.setProperty("--site-color", item.color || colorFromString(item.url));
    logo.textContent = item.shortName || shortName(item.name || hostFromUrl(item.url));
    const copy = document.createElement("span");
    const strong = document.createElement("strong");
    strong.textContent = item.name || hostFromUrl(item.url);
    const small = document.createElement("small");
    small.textContent = match.type === "site"
      ? `${workspaceName(siteWorkspaceId(item))}空间 · ${hostFromUrl(item.url)}`
      : `Chrome 书签 · ${item.folder || "未分类"}`;
    copy.append(strong, small);
    button.append(logo, copy, createIconElement("arrow-right"));
    button.addEventListener("click", () => {
      dom.workGlobalSearch.value = "";
      renderWorkSearchResults();
      if (match.type === "site") {
        void openSite(item);
      } else {
        void showSite({
          id: `bookmark:${item.id}`,
          name: item.name || hostFromUrl(item.url),
          shortName: shortName(item.name || hostFromUrl(item.url)),
          url: item.url,
          color: colorFromString(item.url),
          openMode: "internal",
        });
      }
    });
    if (match.type === "site") bindSiteContextMenu(button, item);
    dom.workSearchResults.appendChild(button);
  }
}

function renderWorkHomeLegacy() {
  const sites = sitesForWorkspace("work");
  dom.workHomeGreeting.textContent = `${formatFullDate()} · 把每天要用的工作系统集中在这里。`;
  dom.workAppTotal.textContent = `${sites.length} 个站点`;
  dom.workAppGrid.replaceChildren();
  if (!sites.length) {
    dom.workAppGrid.appendChild(createWorkspaceEmptyState(
      "把 Zoho Desk、Gitee、SAP Support 等工作系统加入这里。",
      "工作空间只展示你真实添加并保存在本机的站点。",
      "添加工作站点",
      () => openAddSiteModal({ workspaceId: "work", siteKind: "workApp" }),
    ));
  } else {
    sites.forEach((site) => dom.workAppGrid.appendChild(createWorkspaceSiteCard(site)));
  }

  dom.workRecentList.replaceChildren();
  const recent = recentSites("work").filter((site) => site.lastOpenedAt).slice(0, 5);
  if (!recent.length) {
    const empty = document.createElement("div");
    empty.className = "work-panel-empty";
    empty.textContent = "还没有工作站点访问记录";
    dom.workRecentList.appendChild(empty);
  } else {
    for (const site of recent) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "work-recent-item";
      const logo = document.createElement("span");
      logo.style.setProperty("--site-color", site.color || colorFromString(site.url));
      logo.textContent = site.shortName || shortName(site.name);
      const copy = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = site.name;
      const time = document.createElement("small");
      time.textContent = formatSiteLastOpened(site.lastOpenedAt);
      copy.append(name, time);
      button.append(logo, copy, createIconElement("chevron-right"));
      button.addEventListener("click", () => void openSite(site));
      bindSiteContextMenu(button, site);
      dom.workRecentList.appendChild(button);
    }
  }
  renderWorkSearchResults();
}

function formatConnectorTime(value) {
  if (!value) return "尚未同步";
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? "尚未同步" : `最后同步 ${date.toLocaleString("zh-CN", { hour12: false })}`;
}

function connectorStatusCopy(status) {
  const values = {
    "not-configured": ["Zoho Desk 未配置", "连接后显示待回复、今日新增和 SLA 状态，不使用演示数据。"],
    connecting: ["正在连接 Zoho Desk", "请在系统浏览器完成只读 OAuth 授权。"],
    connected: ["Zoho Desk 已连接", "只读连接；实际阅读和回复仍在 Zoho Desk 中完成。"],
    syncing: ["正在更新 Zoho 工单", "保留上一次缓存，更新完成后自动刷新。"],
    error: ["Zoho Desk 连接异常", zohoConnectorStatus?.lastErrorMessage || "请检查授权、权限或网络后重试。"],
    disabled: ["Zoho Desk 已停用", "可以在连接设置中重新启用。"],
  };
  return values[status] || values["not-configured"];
}

function ticketListForFilter(tickets, filter) {
  if (!filter) return tickets;
  if (filter === "sla") return tickets.filter((ticket) => ["due-soon", "overdue"].includes(ticket.sla?.state));
  return tickets.filter((ticket) => Boolean(ticket[filter]));
}

function ticketReasonElement(reason) {
  const tag = document.createElement("span");
  tag.className = "ticket-reason";
  tag.dataset.code = reason.code || "reason";
  tag.textContent = reason.label || "需处理";
  return tag;
}

async function openZohoTicket(ticket) {
  if (!ticket?.id) return;
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  dom.browserPage.classList.add("is-visible");
  currentRoute = `zoho-ticket:${ticket.id}`;
  currentSite = {
    id: `zoho-ticket:${ticket.id}`,
    name: `Zoho #${ticket.ticketNumber || ticket.id}`,
    shortName: "ZD",
    url: ticket.webUrl || zohoConnectorStatus?.publicConfig?.webBaseUrl || "",
    workspaceId: "work",
    color: "#287d65",
  };
  try {
    const result = await window.siteNest.openZohoTicket(
      ticket.id,
      ticket.title,
      ticket.webUrl || "",
      browserBounds(),
    );
    if (!result?.ok) throw new Error(result?.error?.message || "无法打开 Zoho 工单");
    applyReturnedState(result);
    const next = browserStateFromResult(result.value || result);
    if (next) handleBrowserState(next);
    updateActiveNavigation();
    renderCurrentSessions();
    requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
  } catch (error) {
    showToast("无法打开 Zoho 工单", error?.message || "请稍后重试", "error");
  }
}

function renderTicketList(container, tickets, options = {}) {
  container.replaceChildren();
  const values = Array.isArray(tickets) ? tickets : [];
  if (!values.length) {
    const empty = document.createElement("div");
    empty.className = "ticket-empty-state";
    const connected = zohoConnectorStatus?.connected || zohoDashboard?.connected;
    empty.textContent = connected
      ? options.emptyText || "当前筛选没有工单"
      : "连接 Zoho Desk 后，可以查看真实工单；这里不会显示模拟数据。";
    container.appendChild(empty);
    return;
  }
  for (const ticket of values) {
    const row = document.createElement("article");
    row.className = "ticket-row";
    const main = document.createElement("div");
    main.className = "ticket-row-main";
    const title = document.createElement("div");
    title.className = "ticket-row-title";
    const number = document.createElement("b");
    number.textContent = `#${ticket.ticketNumber || ticket.id}`;
    const subject = document.createElement("strong");
    subject.textContent = ticket.title || "无标题工单";
    subject.title = subject.textContent;
    title.append(number, subject);
    const meta = document.createElement("div");
    meta.className = "ticket-row-meta";
    [
      ticket.customerName || ticket.contactName || "客户未返回",
      ticket.status || "状态未知",
      ticket.priority || "未设置优先级",
      ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("zh-CN", { hour12: false }) : "无活动时间",
      ticket.customerWaitingLabel,
      ticket.sla?.available ? ticket.sla.label : "未返回 SLA",
    ].filter(Boolean).forEach((value) => {
      const span = document.createElement("span");
      span.textContent = value;
      meta.appendChild(span);
    });
    main.append(title, meta);
    const reasons = document.createElement("div");
    reasons.className = "ticket-reasons";
    (ticket.reasons || []).forEach((reason) => reasons.appendChild(ticketReasonElement(reason)));
    if (reasons.childElementCount) main.appendChild(reasons);
    const open = document.createElement("button");
    open.type = "button";
    open.className = "ticket-open-button";
    open.textContent = "打开工单";
    open.addEventListener("click", () => void openZohoTicket(ticket));
    row.append(main, open);
    container.appendChild(row);
  }
}

function renderZohoDashboard() {
  const status = zohoDashboardLoading
    ? "syncing"
    : zohoConnectorStatus?.status || zohoDashboard?.status || "not-configured";
  const [title, detail] = connectorStatusCopy(status);
  dom.zohoStatusBar.dataset.status = status;
  dom.zohoStatusTitle.textContent = title;
  dom.zohoStatusDetail.textContent = detail;
  dom.zohoLastSync.textContent = formatConnectorTime(
    zohoDashboard?.syncedAt || zohoConnectorStatus?.lastSyncAt,
  );
  dom.workRefreshTickets.disabled = !zohoDashboardLoading && !zohoConnectorStatus?.connected;
  dom.workRefreshTickets.textContent = zohoDashboardLoading ? "取消刷新" : "手动刷新";
  const counts = zohoDashboard?.counts || null;
  dom.metricNeedsReply.textContent = counts ? String(counts.needsReply) : "—";
  dom.metricAddedToday.textContent = counts ? String(counts.addedToday) : "—";
  dom.metricWaiting24h.textContent = counts ? String(counts.waitingOver24h) : "—";
  dom.metricSlaDueSoon.textContent = counts ? String(counts.slaDueSoon) : "—";
  dom.metricSlaOverdue.textContent = counts ? String(counts.slaOverdue) : "—";
  dom.metricSlaHint.textContent = zohoDashboard && !zohoDashboard.slaAvailable
    ? "当前连接未返回 SLA 数据"
    : "仅使用 Zoho 官方 SLA 字段";
  const priority = ticketListForFilter(zohoDashboard?.priorityTickets || [], activeTicketFilter);
  renderTicketList(dom.priorityTicketList, priority, {
    emptyText: activeTicketFilter ? "当前指标没有需要处理的工单" : "当前没有优先处理工单",
  });
  renderTicketList(dom.recentTicketList, zohoDashboard?.recentTickets || [], {
    emptyText: "最近范围内没有工单",
  });
  renderTicketList(dom.dueSoonTicketList, zohoDashboard?.dueSoonTickets || [], {
    emptyText: zohoDashboard && !zohoDashboard.slaAvailable
      ? "当前连接未返回 SLA 数据"
      : "当前没有即将超时工单",
  });
}

function renderWorkHome() {
  renderWorkHomeLegacy();
  dom.workHomeGreeting.textContent = `${formatFullDate()} · 读取真实工单，回复操作仍在 Zoho Desk 中完成。`;
  renderZohoDashboard();
}

async function loadZohoConnectorStatus(options = {}) {
  if (typeof window.siteNest?.getConnectorStatus !== "function") return;
  try {
    const result = await window.siteNest.getConnectorStatus("zoho-desk");
    if (!result?.ok) throw new Error(result?.error?.message || "无法读取 Zoho 连接状态");
    zohoConnectorStatus = result.value;
    const config = result.value.publicConfig || {};
    if (!options.preserveForm) {
      dom.zohoDisplayName.value = result.value.displayName || "Zoho Desk";
      dom.zohoOrgId.value = config.orgId || "";
      dom.zohoApiBase.value = config.apiBase || "https://desk.zoho.com/api/v1";
      dom.zohoWebBase.value = config.webBaseUrl || "https://desk.zoho.com";
      dom.zohoLookbackDays.value = String(config.lookbackDays || 30);
      dom.zohoSlaWarningHours.value = String(config.slaWarningHours || 4);
    }
    dom.zohoOAuthConfigPath.textContent = result.value.oauthConfigPath || "";
    dom.zohoOAuthConfigState.textContent = result.value.clientConfigAvailable
      ? "桌面 OAuth 配置已就绪"
      : "尚未找到 Zoho 桌面 OAuth 配置";
    dom.zohoSettingsStatus.textContent = result.value.connected
      ? "Zoho 已连接"
      : result.value.status === "error"
        ? "Zoho 连接失败"
        : "Zoho 未连接";
    dom.zohoSettingsStatus.className = `status-pill${result.value.connected ? " status-pill--ready" : result.value.status === "error" ? " status-pill--error" : ""}`;
    dom.connectZohoButton.disabled = !result.value.clientConfigAvailable || !config.orgId;
    dom.connectZohoButton.textContent = result.value.connected ? "重新授权" : "连接 Zoho Desk";
    dom.disconnectZohoButton.disabled = !result.value.connected;
    renderZohoDashboard();
  } catch (error) {
    zohoConnectorStatus = { status: "error", connected: false, lastErrorMessage: error.message };
    renderZohoDashboard();
  }
}

async function loadZohoDashboard(options = {}) {
  const method = options.refresh ? "refreshZohoDashboard" : "getZohoDashboard";
  if (typeof window.siteNest?.[method] !== "function") return;
  let refreshStaleInBackground = false;
  if (options.refresh) zohoDashboardCancelRequested = false;
  zohoDashboardLoading = true;
  renderZohoDashboard();
  try {
    const result = await window.siteNest[method]();
    if (!result?.ok) throw new Error(result?.error?.message || "无法读取 Zoho 工单");
    zohoDashboard = result.value;
    refreshStaleInBackground = !options.refresh && result.value?.connected === true && result.value?.stale === true;
    await loadZohoConnectorStatus({ preserveForm: true });
  } catch (error) {
    if (!zohoDashboardCancelRequested) {
      showToast("Zoho 工单未更新", error?.message || "请稍后重试", "error");
    }
  } finally {
    zohoDashboardLoading = false;
    zohoDashboardCancelRequested = false;
    renderZohoDashboard();
  }
  if (refreshStaleInBackground) {
    window.setTimeout(() => void loadZohoDashboard({ refresh: true }), 0);
  }
}

async function cancelZohoDashboardRefresh() {
  if (!zohoDashboardLoading || typeof window.siteNest?.cancelZohoDashboardRefresh !== "function") return;
  zohoDashboardCancelRequested = true;
  try {
    const result = await window.siteNest.cancelZohoDashboardRefresh();
    if (result?.value?.cancelled) {
      showToast("已取消 Zoho 刷新", "保留上一次缓存数据");
    }
  } catch (error) {
    zohoDashboardCancelRequested = false;
    showToast("无法取消刷新", error?.message || "请稍后重试", "error");
  }
}

function renderResearchHome() {
  const sites = sitesForWorkspace("research");
  dom.researchSiteGrid.replaceChildren();
  if (!sites.length) {
    dom.researchSiteGrid.appendChild(createWorkspaceEmptyState(
      "研究空间还是空的",
      "把论文、技术文档、资料库或长期阅读资源加入这里。",
      "添加研究站点",
      () => openAddSiteModal({ workspaceId: "research", siteKind: "normal" }),
    ));
    return;
  }
  sites.forEach((site) =>
    dom.researchSiteGrid.appendChild(createWorkspaceSiteCard(site, "work-app-card research-site-card")),
  );
}

function isZohoDeskSite(site) {
  if (
    Array.isArray(site?.assistantIds) &&
    site.assistantIds.some((id) => id === "zoho-desk-ticket" || id === "zoho-desk")
  ) {
    return true;
  }
  try {
    const host = new URL(site.url).hostname.toLowerCase();
    const exactHosts = new Set([
      "desk.zoho.com",
      "desk.zoho.eu",
      "desk.zoho.in",
      "desk.zoho.com.au",
      "desk.zoho.jp",
      "desk.zoho.com.cn",
      "desk.zoho.sa",
      "desk.zoho.uk",
      "desk.zohocloud.ca",
    ]);
    const deskDomains = [
      "zohodesk.com",
      "zohodesk.eu",
      "zohodesk.in",
      "zohodesk.com.au",
      "zohodesk.jp",
      "zohodesk.com.cn",
      "zohodesk.sa",
      "zohodesk.uk",
      "zohodesk.ca",
    ];
    return exactHosts.has(host) || deskDomains.some((domain) => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}

function filteredSites() {
  const query = dom.siteSearch.value.trim().toLocaleLowerCase("zh-CN");
  const filter = dom.siteFilter.value;
  const workspaceFilter = dom.siteWorkspaceFilter.value;
  const scope = workspaceFilter === "all" ? appState.sites : sitesForWorkspace();
  return scope.filter((site) => {
    if (filter === "pinned" && !isSitePinned(site)) return false;
    if (filter === "custom" && site.source === "built-in") return false;
    if (!query) return true;
    const haystack = `${site.name} ${site.url} ${site.description || ""}`.toLocaleLowerCase("zh-CN");
    return haystack.includes(query);
  });
}

function createSiteAction(icon, title, handler, options = {}) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `site-card-action${options.danger ? " site-card-action--danger" : ""}`;
  button.title = title;
  button.setAttribute("aria-label", title);
  button.disabled = Boolean(options.disabled);
  button.appendChild(createIconElement(icon));
  button.addEventListener("click", async (event) => {
    event.stopPropagation();
    if (button.disabled) return;
    button.disabled = true;
    try {
      await handler();
    } catch (error) {
      showToast("无法更新站点", error?.message || "请稍后重试", "error");
    } finally {
      if (button.isConnected) button.disabled = Boolean(options.disabled);
    }
  });
  return button;
}

function renderSiteLibrary() {
  const matches = filteredSites();
  const scope = dom.siteWorkspaceFilter.value === "all" ? appState.sites : sitesForWorkspace();
  const queryActive = Boolean(dom.siteSearch.value.trim() || dom.siteFilter.value !== "all");
  dom.siteLibraryTotal.textContent = queryActive
    ? `${matches.length} / ${scope.length} 个站点`
    : `${scope.length} 个站点`;
  dom.siteLibraryGrid.replaceChildren();

  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "site-library-empty";
    empty.appendChild(createIconElement(scope.length ? "search" : "globe", "empty-state-icon"));
    const title = document.createElement("strong");
    title.textContent = scope.length ? "没有匹配的站点" : "当前范围还没有站点";
    const detail = document.createElement("small");
    detail.textContent = scope.length
      ? "换个关键词或清除筛选后再试。"
      : `把网站添加到${workspaceName(activeWorkspaceId())}空间，之后可以从这里集中管理。`;
    const action = document.createElement("button");
    action.type = "button";
    action.className = "secondary-button";
    if (scope.length) {
      action.append(createIconElement("reload"), document.createTextNode("清除筛选"));
      action.addEventListener("click", () => {
        dom.siteSearch.value = "";
        dom.siteFilter.value = "all";
        renderSiteLibrary();
      });
    } else {
      action.append(createIconElement("plus"), document.createTextNode("添加网站"));
      action.addEventListener("click", openAddSiteModal);
    }
    empty.append(title, detail, action);
    dom.siteLibraryGrid.appendChild(empty);
    return;
  }

  for (const site of matches) {
    const orderedWorkspaceSites = sitesForWorkspace(siteWorkspaceId(site));
    const siteIndex = orderedWorkspaceSites.findIndex((item) => item.id === site.id);
    const card = document.createElement("article");
    card.className = "site-library-card";
    card.style.setProperty("--site-color", site.color || colorFromString(site.url));

    const openButton = document.createElement("button");
    openButton.type = "button";
    openButton.className = "site-card-open";
    openButton.title = site.openMode === "external"
      ? `在系统浏览器中打开 ${site.name}`
      : `在栖页中打开 ${site.name}`;

    const logo = document.createElement("span");
    logo.className = "site-library-logo";
    logo.style.setProperty("--site-color", site.color || colorFromString(site.url));
    logo.textContent = site.shortName || shortName(site.name);

    const copy = document.createElement("span");
    copy.className = "site-library-copy";
    const nameRow = document.createElement("span");
    nameRow.className = "site-library-name-row";
    const name = document.createElement("strong");
    name.textContent = site.name;
    const source = document.createElement("span");
    source.className = "site-source-badge";
    source.textContent = workspaceName(siteWorkspaceId(site));
    source.title = site.source === "built-in" ? "内置站点" : "自定义站点";
    const openMode = document.createElement("span");
    openMode.className = "site-open-mode-badge";
    openMode.textContent = site.openMode === "external" ? "外部" : "内置";
    nameRow.append(name, source, openMode);
    const host = document.createElement("small");
    host.className = "site-library-host";
    host.textContent = hostFromUrl(site.url);
    const description = document.createElement("small");
    description.className = "site-library-description";
    description.textContent = site.description || "暂无简介";
    copy.append(nameRow, host, description);
    openButton.append(logo, copy, createIconElement("arrow-right", "site-library-open-icon"));
    openButton.addEventListener("click", () => void openSite(site));
    bindSiteContextMenu(card, site);

    const footer = document.createElement("footer");
    footer.className = "site-card-footer";
    const lastOpened = document.createElement("span");
    lastOpened.className = "site-last-opened";
    lastOpened.append(
      createIconElement("clock"),
      document.createTextNode(formatSiteLastOpened(site.lastOpenedAt)),
    );
    const actions = document.createElement("div");
    actions.className = "site-card-actions";

    const pinButton = createSiteAction(
      "pin",
      isSitePinned(site) ? "取消置顶" : "置顶到侧栏",
      async () => {
        const result = await window.siteNest.toggleSitePin(site.id);
        appState = result.state;
        renderAll();
        showToast(isSitePinned(result.site) ? "已置顶到侧栏" : "已取消置顶", site.name);
      },
    );
    pinButton.classList.toggle("is-active", isSitePinned(site));
    actions.appendChild(pinButton);

    actions.appendChild(createSiteAction("arrow-up", "上移", async () => {
      const result = await window.siteNest.reorderSite({ id: site.id, direction: -1 });
      appState = result.state;
      renderAll();
    }, { disabled: siteIndex <= 0 }));
    actions.appendChild(createSiteAction("arrow-down", "下移", async () => {
      const result = await window.siteNest.reorderSite({ id: site.id, direction: 1 });
      appState = result.state;
      renderAll();
    }, { disabled: siteIndex < 0 || siteIndex >= orderedWorkspaceSites.length - 1 }));

    actions.appendChild(createSiteAction("edit", "编辑站点", async () => {
      openEditSiteModal(site);
    }));
    if (site.source !== "built-in") {
      actions.appendChild(createSiteAction("trash", "删除站点", async () => {
        if (!window.confirm(`确定要从栖页删除“${site.name}”吗？\n网站账号与网页数据不会被删除。`)) return;
        try {
          const result = await window.siteNest.deleteSite(site.id);
          appState = result.state;
          renderAll();
          showToast("站点已删除", site.name);
        } catch (error) {
          showToast("无法删除站点", error?.message || "请稍后重试", "error");
        }
      }, { danger: true }));
    }

    footer.append(lastOpened, actions);
    card.append(openButton, footer);
    dom.siteLibraryGrid.appendChild(card);
  }
}

function updateBookmarkSummary() {
  const count = appState.bookmarks.length;
  const importedAt = appState.importMeta?.importedAt;
  const importedDate = importedAt ? new Date(importedAt) : null;
  const hasImport = Boolean(appState.importMeta);
  const status = chromeBookmarkReadState === "reading"
    ? "正在更新"
    : chromeBookmarkReadState === "error"
      ? "更新失败"
      : hasImport
        ? "已读取"
        : "未配置";
  dom.chromeBookmarkStatus.textContent = status;
  dom.chromeBookmarkStatus.className = "status-pill";
  if (status === "已读取") dom.chromeBookmarkStatus.classList.add("status-pill--safe");
  if (status === "正在更新") dom.chromeBookmarkStatus.classList.add("status-pill--preview");
  if (status === "更新失败") dom.chromeBookmarkStatus.classList.add("status-pill--error");
  dom.chromeBookmarkProfile.textContent = appState.importMeta?.profileName || "尚未选择";
  dom.chromeBookmarkCount.textContent = `${count} 个书签`;
  dom.chromeBookmarkUpdatedAt.textContent = importedDate && !Number.isNaN(importedDate.valueOf())
    ? importedDate.toLocaleString("zh-CN", { hour12: false })
    : "尚未读取";
  dom.chromeBookmarkError.textContent = chromeBookmarkReadError;
  dom.chromeBookmarkError.classList.toggle("is-hidden", !chromeBookmarkReadError);
  dom.clearImportedBookmarks.disabled = !count && !hasImport;
  if (appState.importMeta) {
    dom.bookmarkFeatureCopy.textContent = `已从 ${appState.importMeta.profileName} 导入 ${count} 个书签；可随时重新读取更新。`;
  } else {
    dom.bookmarkFeatureCopy.textContent =
      "从本机 Chrome 配置读取书签，不触碰密码、历史记录或 Cookie。";
  }
}

function updateFolderOptions() {
  const previous = dom.bookmarkFolder.value;
  const folders = Array.from(
    new Set(appState.bookmarks.map((bookmark) => bookmark.folder).filter(Boolean)),
  ).sort((a, b) => a.localeCompare(b, "zh-CN"));
  dom.bookmarkFolder.replaceChildren();
  const all = document.createElement("option");
  all.value = "";
  all.textContent = "全部文件夹";
  dom.bookmarkFolder.appendChild(all);
  for (const folder of folders) {
    const option = document.createElement("option");
    option.value = folder;
    option.textContent = folder;
    dom.bookmarkFolder.appendChild(option);
  }
  if (folders.includes(previous)) dom.bookmarkFolder.value = previous;
}

function matchingBookmarks() {
  const query = dom.bookmarkSearch.value.trim().toLocaleLowerCase("zh-CN");
  const folder = dom.bookmarkFolder.value;
  return appState.bookmarks.filter((bookmark) => {
    if (folder && bookmark.folder !== folder) return false;
    if (!query) return true;
    const haystack = `${bookmark.name} ${bookmark.url} ${bookmark.folder}`.toLocaleLowerCase(
      "zh-CN",
    );
    return haystack.includes(query);
  });
}

function createBookmarkEmptyState(hasAnyBookmarks) {
  const wrapper = document.createElement("div");
  wrapper.className = "empty-state";
  wrapper.appendChild(createIconElement(hasAnyBookmarks ? "search" : "bookmark", "empty-state-icon"));
  const title = document.createElement("h3");
  title.textContent = hasAnyBookmarks ? "没有匹配的书签" : "还没有导入 Chrome 书签";
  const copy = document.createElement("p");
  copy.textContent = hasAnyBookmarks
    ? "换一个关键词或文件夹试试。"
    : "选择一个本机 Chrome 配置，栖页会以只读方式复制书签到本地。";
  wrapper.append(title, copy);
  if (!hasAnyBookmarks) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button";
    button.append(createIconElement("download"), document.createTextNode("导入 Chrome 书签"));
    button.addEventListener("click", () => void openImportModal());
    wrapper.appendChild(button);
  }
  return wrapper;
}

function renderBookmarks() {
  const matches = matchingBookmarks();
  dom.bookmarkTotal.textContent = `${matches.length} 个书签`;
  dom.bookmarkList.replaceChildren();
  if (!matches.length) {
    dom.bookmarkList.appendChild(createBookmarkEmptyState(appState.bookmarks.length > 0));
    dom.loadMoreBookmarks.classList.add("is-hidden");
    return;
  }

  for (const bookmark of matches.slice(0, bookmarkRenderLimit)) {
    const row = document.createElement("article");
    row.className = "bookmark-row";
    row.tabIndex = 0;
    row.title = `在栖页中打开 ${bookmark.url}`;

    const host = hostFromUrl(bookmark.url);
    const color = colorFromString(host);
    const logo = document.createElement("span");
    logo.className = "bookmark-logo";
    logo.style.setProperty("--site-color", color);
    logo.textContent = shortName(host);

    const main = document.createElement("div");
    main.className = "bookmark-main";
    const name = document.createElement("strong");
    name.textContent = bookmark.name || host;
    const url = document.createElement("small");
    url.textContent = bookmark.url;
    main.append(name, url);

    const folder = document.createElement("div");
    folder.className = "bookmark-folder";
    folder.textContent = bookmark.folder;

    const actions = document.createElement("div");
    actions.className = "bookmark-actions";
    const pinButton = document.createElement("button");
    pinButton.type = "button";
    pinButton.className = "bookmark-action";
    pinButton.title = `添加到${workspaceName(activeWorkspaceId())}空间`;
    pinButton.appendChild(createIconElement("plus"));
    pinButton.addEventListener("click", async (event) => {
      event.stopPropagation();
      try {
        const result = await window.siteNest.addSite({
          name: bookmark.name || host,
          url: bookmark.url,
          color,
          workspaceId: activeWorkspaceId(),
          siteKind: defaultSiteKind(),
          openMode: "internal",
          pinned: true,
          assistantIds: [],
        });
        appState = result.state;
        renderAll();
        showToast(
          result.existed ? `已在${workspaceName(activeWorkspaceId())}空间中` : `已添加到${workspaceName(activeWorkspaceId())}空间`,
          bookmark.name || host,
        );
      } catch (error) {
        showToast("无法固定网站", error?.message || "请稍后重试", "error");
      }
    });

    const externalButton = document.createElement("button");
    externalButton.type = "button";
    externalButton.className = "bookmark-action";
    externalButton.title = "在默认浏览器打开";
    externalButton.appendChild(createIconElement("external"));
    externalButton.addEventListener("click", (event) => {
      event.stopPropagation();
      void window.siteNest.openExternal(bookmark.url);
    });

    actions.append(pinButton, externalButton);
    const openBookmark = () =>
      void showSite({
        id: `bookmark:${bookmark.id}`,
        name: bookmark.name || host,
        shortName: shortName(host),
        url: bookmark.url,
        color,
      });
    row.addEventListener("click", openBookmark);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openBookmark();
      }
    });
    row.append(logo, main, folder, actions);
    dom.bookmarkList.appendChild(row);
  }

  dom.loadMoreBookmarks.classList.toggle(
    "is-hidden",
    bookmarkRenderLimit >= matches.length,
  );
}

function renderAll() {
  renderWorkspaceSwitcher();
  renderCurrentSessions();
  renderPopupPolicies();
  renderBrowserMemorySettings();
  renderTranslationSettings();
  renderPlan();
  renderWorkspaceTaskWidgets();
  renderTaskSettings();
  const workspaceSiteCount = sitesForWorkspace().length;
  dom.sidebarSiteCount.textContent = workspaceSiteCount > 99 ? "99+" : String(workspaceSiteCount);
  renderQuickSites();
  renderWorkHome();
  renderResearchHome();
  renderSiteLibrary();
  updateBookmarkSummary();
  updateFolderOptions();
  renderNaixiAutomation(appState.automations?.naixi);
  renderAssistants(assistantCache);
  renderExecutionLogs(executionLogCache);
  renderGoogleSync();
  if (currentRoute === "home") setVisibleLocalPage("home");
  if (currentRoute === "settings") renderBookmarks();
}

function openModal(modal) {
  window.siteNest?.hideBrowser();
  modal.classList.add("is-open");
  const firstInput = modal.querySelector("input:not([type=radio]):not([type=hidden]), button:not([disabled])");
  window.setTimeout(() => firstInput?.focus(), 50);
}

function closeModal(modal, resume = true) {
  modal.classList.remove("is-open");
  if (resume) void resumeBrowserAfterModal();
}

function closeAllModals(resume = true) {
  document.querySelectorAll(".modal-backdrop.is-open").forEach((modal) =>
    modal.classList.remove("is-open"),
  );
  if (resume) void resumeBrowserAfterModal();
}

function updateSiteWorkspaceOptions(selectedWorkspaceId) {
  dom.siteWorkspaceInput.replaceChildren();
  for (const workspace of workspaces()) {
    const option = document.createElement("option");
    option.value = workspace.id;
    option.textContent = workspace.name;
    dom.siteWorkspaceInput.appendChild(option);
  }
  dom.siteWorkspaceInput.value = workspaces().some((workspace) => workspace.id === selectedWorkspaceId)
    ? selectedWorkspaceId
    : "personal";
}

function renderSiteAssistantOptions(selectedIds = []) {
  const selected = new Set(Array.isArray(selectedIds) ? selectedIds.map(String) : []);
  dom.siteAssistantOptions.replaceChildren();
  if (!assistantCache.length) {
    const empty = document.createElement("span");
    empty.className = "site-assistant-empty";
    empty.textContent = typeof window.siteNest?.getAssistants === "function"
      ? "当前没有可绑定的站点助手"
      : "站点助手接口尚未配置";
    dom.siteAssistantOptions.appendChild(empty);
    return;
  }
  for (const assistant of assistantCache) {
    const id = String(assistant.id || "");
    if (!id) continue;
    const label = document.createElement("label");
    label.className = "site-assistant-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = "assistantIds";
    input.value = id;
    input.checked = selected.has(id);
    const check = document.createElement("span");
    check.appendChild(createIconElement("check"));
    const copy = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = assistant.name || id;
    const source = document.createElement("small");
    source.textContent = assistant.source === "built-in" ? "内置助手" : assistant.source || "本地助手";
    copy.append(name, source);
    label.append(input, check, copy);
    dom.siteAssistantOptions.appendChild(label);
  }
}

function openAddSiteModal(options = {}) {
  const preset = options && !options.currentTarget ? options : {};
  editingSiteId = null;
  dom.addSiteForm.reset();
  document.querySelector('input[name="color"][value="#5b7cfa"]').checked = true;
  const workspaceId = String(preset.workspaceId || activeWorkspaceId());
  updateSiteWorkspaceOptions(workspaceId);
  dom.siteKindInput.value = preset.siteKind || defaultSiteKind(workspaceId);
  dom.siteOpenModeInput.value = preset.openMode === "external" ? "external" : "internal";
  dom.sitePinnedInput.checked = preset.pinned !== false;
  document.getElementById("siteNameInput").value = preset.name || "";
  document.getElementById("siteUrlInput").value = preset.url || "";
  dom.siteDescriptionInput.value = preset.description || "";
  renderSiteAssistantOptions(preset.assistantIds || []);
  dom.siteModalKicker.textContent = "NEW WEBSITE";
  dom.addSiteTitle.textContent = workspaceId === "work" ? "添加工作站点" : "添加一个常用网站";
  dom.siteFormSubmitText.textContent = "添加并打开";
  dom.siteFormSubmitButton.replaceChildren(
    createIconElement("plus"),
    dom.siteFormSubmitText,
  );
  openModal(dom.addSiteModal);
}

function openEditSiteModal(site) {
  if (!site) return;
  editingSiteId = site.id;
  dom.addSiteForm.reset();
  updateSiteWorkspaceOptions(siteWorkspaceId(site));
  document.getElementById("siteNameInput").value = site.name || "";
  document.getElementById("siteUrlInput").value = site.url || "";
  dom.siteDescriptionInput.value = site.description || "";
  dom.siteKindInput.value = site.siteKind === "workApp" ? "workApp" : "normal";
  dom.siteOpenModeInput.value = site.openMode === "external" ? "external" : "internal";
  dom.sitePinnedInput.checked = isSitePinned(site);
  renderSiteAssistantOptions(site.assistantIds || []);
  const colorInput = document.querySelector(`input[name="color"][value="${site.color}"]`);
  (colorInput || document.querySelector('input[name="color"][value="#5b7cfa"]')).checked = true;
  dom.siteModalKicker.textContent = "EDIT WEBSITE";
  dom.addSiteTitle.textContent = "编辑站点";
  dom.siteFormSubmitText.textContent = "保存更改";
  dom.siteFormSubmitButton.replaceChildren(
    createIconElement("check"),
    dom.siteFormSubmitText,
  );
  openModal(dom.addSiteModal);
}

function renderChromeProfiles(profiles) {
  dom.chromeProfileList.replaceChildren();
  selectedChromeProfile = "";
  selectedChromeProfileBookmarkCount = 0;
  dom.confirmImportButton.disabled = true;
  if (!profiles.length) {
    const empty = document.createElement("div");
    empty.className = "profile-empty";
    empty.textContent = "未找到可读取的 Chrome 书签配置。请先确认本机已安装并使用过 Chrome。";
    dom.chromeProfileList.appendChild(empty);
    return;
  }

  let preferredOption = null;
  for (const profile of profiles) {
    const localCount = Math.max(0, Number(profile.localBookmarkCount) || 0);
    const accountCount = Math.max(0, Number(profile.accountBookmarkCount) || 0);
    const bookmarkCount = Math.max(
      0,
      Number(profile.bookmarkCount) || localCount + accountCount,
    );
    const encryptedOnly = Boolean(profile.encryptedOnly);
    const label = document.createElement("label");
    label.className = "profile-option";
    label.classList.toggle("is-empty", bookmarkCount === 0 || encryptedOnly);
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "chromeProfile";
    input.value = profile.id;

    const avatar = document.createElement("span");
    avatar.className = "profile-avatar";
    avatar.textContent = shortName(profile.name);

    const copy = document.createElement("span");
    copy.className = "profile-copy";
    const name = document.createElement("strong");
    name.textContent = profile.name;
    const folder = document.createElement("small");
    const hasSourceBreakdown = "localBookmarkCount" in profile || "accountBookmarkCount" in profile;
    folder.textContent = hasSourceBreakdown
      ? `Chrome 配置：${profile.id} · 本机 ${localCount} · Google 账号 ${accountCount}`
      : `Chrome 配置：${profile.id}`;
    copy.append(name, folder);

    const count = document.createElement("span");
    count.className = "profile-count";
    count.textContent = encryptedOnly
      ? "账号书签已加密"
      : bookmarkCount
        ? `${bookmarkCount} 个书签`
        : "无可导入书签";
    const radio = document.createElement("span");
    radio.className = "profile-radio";
    label.append(input, avatar, copy, count, radio);
    label.addEventListener("click", () => {
      dom.chromeProfileList.querySelectorAll(".profile-option").forEach((option) =>
        option.classList.remove("is-selected"),
      );
      label.classList.add("is-selected");
      input.checked = true;
      selectedChromeProfile = profile.id;
      selectedChromeProfileBookmarkCount = encryptedOnly ? 0 : bookmarkCount;
      dom.confirmImportButton.disabled = selectedChromeProfileBookmarkCount === 0;
      if (encryptedOnly) {
        dom.importProfileHint.innerHTML = "<strong>此配置的账号书签已加密。</strong>栖页无法直接读取，建议在 Chrome 书签管理器中导出 HTML。";
      } else if (bookmarkCount === 0) {
        dom.importProfileHint.innerHTML = "<strong>此配置没有可导入书签。</strong>请确认选中了正确配置，并让 Chrome 先把 Google 账号书签同步到本机。";
      } else {
        const detail = hasSourceBreakdown
          ? `其中本机书签 ${localCount} 个，Google 账号书签 ${accountCount} 个。`
          : "";
        dom.importProfileHint.innerHTML = `<strong>准备导入 ${bookmarkCount} 个书签。</strong>${detail}原始数据不会被修改。`;
      }
    });
    dom.chromeProfileList.appendChild(label);
    if (!preferredOption && bookmarkCount > 0 && !encryptedOnly) {
      preferredOption = label;
    }
  }

  (preferredOption || (profiles.length === 1 ? dom.chromeProfileList.firstElementChild : null))?.click();
}

async function openImportModal() {
  openModal(dom.importModal);
  dom.chromeProfileList.innerHTML =
    '<div class="profile-loading"><div class="placeholder-spinner"></div>正在查找本机 Chrome 配置…</div>';
  dom.confirmImportButton.disabled = true;
  selectedChromeProfile = "";
  selectedChromeProfileBookmarkCount = 0;
  dom.importProfileHint.innerHTML = "<strong>导入方向：</strong>本机 Chrome → 栖页。原始书签与 Google 云端书签都不会被修改。";
  try {
    renderChromeProfiles(await window.siteNest.getChromeProfiles());
  } catch (error) {
    renderChromeProfiles([]);
    chromeBookmarkReadState = "error";
    chromeBookmarkReadError = error?.message || "无法读取本机 Chrome 配置";
    updateBookmarkSummary();
    showToast("无法读取 Chrome 配置", error?.message || "请确认 Chrome 数据目录可访问", "error");
  }
}

async function loadSystemInfo() {
  try {
    const info = await window.siteNest?.getSystemInfo();
    if (info?.dataFile) {
      dom.dataPathDisplay.textContent = info.dataFile;
      dom.dataPathDisplay.title = info.dataFile;
    }
  } catch {
    dom.dataPathDisplay.textContent = "无法读取数据目录";
  }
}

function userScriptSourceLabel(sourceType) {
  return { builtIn: "内置", localFile: "本地文件", pasted: "粘贴", remoteUrl: "远程 URL" }[sourceType] || "本地";
}

function userScriptRunAtLabel(runAt) {
  return { "document-start": "文档开始", "document-end": "文档完成", "document-idle": "页面空闲" }[runAt] || runAt;
}

function renderUserScriptExecutions() {
  if (!dom.userScriptExecutionList) return;
  dom.userScriptExecutionList.replaceChildren();
  const values = (userScriptState.executions || []).slice(0, 12);
  if (!values.length) {
    const empty = document.createElement("div");
    empty.className = "automation-empty-state";
    empty.innerHTML = '<strong>暂无脚本执行记录</strong><small>只记录脚本、域名、状态、耗时和脱敏摘要。</small>';
    dom.userScriptExecutionList.appendChild(empty);
    return;
  }
  for (const execution of values) {
    const script = userScriptState.scripts.find((item) => item.id === execution.scriptId);
    const row = document.createElement("article");
    row.className = "userscript-execution-row";
    row.dataset.status = execution.status;
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = script?.name || execution.scriptId;
    const detail = document.createElement("small");
    detail.textContent = `${execution.hostname || "unknown"} · ${execution.durationMs || 0} ms · ${execution.sanitizedMessage || execution.status}`;
    copy.append(title, detail);
    const status = document.createElement("span");
    status.className = `status-pill${execution.status === "success" ? " status-pill--ready" : execution.status === "failure" || execution.status === "timeout" ? " status-pill--error" : ""}`;
    status.textContent = execution.status;
    row.append(copy, status);
    dom.userScriptExecutionList.appendChild(row);
  }
}

function renderUserScripts() {
  if (!dom.userScriptList) return;
  dom.userScriptList.replaceChildren();
  if (!userScriptState.scripts.length) {
    const empty = document.createElement("div");
    empty.className = "automation-empty-state";
    empty.textContent = "尚未安装用户脚本";
    dom.userScriptList.appendChild(empty);
    return;
  }
  for (const script of userScriptState.scripts) {
    const card = document.createElement("article");
    card.className = "userscript-card";
    card.dataset.enabled = String(script.enabled);
    const top = document.createElement("div");
    top.className = "userscript-card-main";
    const icon = createIconElement("code", "userscript-icon");
    const copy = document.createElement("div");
    const heading = document.createElement("div");
    heading.className = "userscript-card-title";
    const name = document.createElement("h3");
    name.textContent = script.name;
    const version = document.createElement("span");
    version.className = "status-pill";
    version.textContent = `v${script.version}`;
    const source = document.createElement("span");
    source.className = "status-pill";
    source.textContent = userScriptSourceLabel(script.sourceType);
    heading.append(name, version, source);
    const description = document.createElement("p");
    description.textContent = script.description || "没有脚本说明";
    const meta = document.createElement("div");
    meta.className = "userscript-meta";
    const domains = [...(script.matches || []), ...(script.includes || [])];
    [
      userScriptRunAtLabel(script.runAt),
      domains.length ? domains.slice(0, 2).join("、") : "无匹配网址",
      script.grants?.length ? `${script.grants.length} 项权限` : "无宿主权限",
      script.connects?.length ? `${script.connects.length} 个跨域范围` : "不访问跨域网络",
    ].forEach((value) => { const span = document.createElement("span"); span.textContent = value; meta.appendChild(span); });
    copy.append(heading, description, meta);
    const toggle = document.createElement("label");
    toggle.className = "toggle-control userscript-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    const currentHost = hostFromUrl(browserSnapshot.url || "").toLowerCase();
    const isBuiltIn = script.sourceType === "builtIn";
    input.checked = isBuiltIn
      ? Boolean(currentHost && script.approvedSites?.includes(currentHost))
      : script.enabled === true;
    const track = document.createElement("span");
    track.className = "toggle-track";
    track.appendChild(document.createElement("span"));
    toggle.append(input, track, document.createTextNode(isBuiltIn ? "当前网站" : script.enabled ? "已启用" : "已停用"));
    input.addEventListener("change", async () => {
      const nextEnabled = input.checked;
      if (nextEnabled) {
        const permissionSummary = [...(script.grants || []), ...(script.connects || []).map((item) => `connect:${item}`)];
        const approved = window.confirm(isBuiltIn
          ? `在当前网站 ${currentHost || "（未打开网页）"} 启用“${script.name}”？\n\n仅保存当前域名授权；登录、支付、密码和 OAuth 回调页面仍会被阻止。`
          : `启用“${script.name}”？\n\n网址：${domains.join("、") || "无自动匹配"}\n权限：${permissionSummary.join("、") || "无"}\n\n登录、支付、密码和 OAuth 回调页面仍会被阻止。`);
        if (!approved) { input.checked = false; return; }
      }
      input.disabled = true;
      try {
        const snapshot = isBuiltIn
          ? await window.siteNest.setUserScriptSiteApproved(script.id, nextEnabled)
          : await window.siteNest.setUserScriptEnabled(script.id, nextEnabled);
        applyUserScriptSnapshot(snapshot);
        showToast(
          nextEnabled ? "脚本已启用" : "脚本已停用",
          isBuiltIn ? `${snapshot.hostname || currentHost} · 刷新页面后生效` : nextEnabled ? "刷新匹配页面后运行" : "后续页面不会再注入",
        );
      } catch (error) {
        input.checked = !nextEnabled;
        showToast("无法更新脚本", error?.message || "请稍后重试", "error");
      } finally { input.disabled = false; }
    });
    top.append(icon, copy, toggle);
    const actions = document.createElement("div");
    actions.className = "userscript-card-actions";
    if (script.sourceType === "builtIn") {
      const temporary = document.createElement("button");
      temporary.type = "button";
      temporary.className = "secondary-button compact-button";
      temporary.textContent = "当前页面临时运行";
      temporary.addEventListener("click", () => void runRestoreCopyScript());
      actions.appendChild(temporary);
      if (script.approvedSites?.length) {
        const sites = document.createElement("span");
        sites.className = "userscript-site-approvals";
        sites.textContent = `已允许：${script.approvedSites.join("、")}`;
        actions.appendChild(sites);
      }
    }
    const currentUrl = browserSnapshot.url || "";
    const currentLoginPage = /^https?:\/\//i.test(currentUrl) && /(?:login|logon|sign[-_]?in|signin|authorize|authorization|accounts\.)/i.test(currentUrl);
    if (script.sourceType !== "builtIn" && currentHost && currentLoginPage) {
      const sensitiveApproved = script.sensitiveApprovedSites?.includes(currentHost) === true;
      const sensitiveButton = document.createElement("button");
      sensitiveButton.type = "button";
      sensitiveButton.className = "secondary-button compact-button";
      sensitiveButton.textContent = sensitiveApproved ? "撤销登录页授权" : "登录页高级授权";
      sensitiveButton.addEventListener("click", async () => {
        sensitiveButton.disabled = true;
        try {
          const snapshot = await window.siteNest.setUserScriptSensitiveSiteApproved(script.id, !sensitiveApproved);
          applyUserScriptSnapshot(snapshot);
          showToast(sensitiveApproved ? "已撤销登录页授权" : "已授予登录页权限", `${currentHost} · OAuth/SAML 回调、支付和密码页面仍禁止`);
        } catch (error) {
          showToast("登录页授权未更改", error?.message || "请重新确认", "error");
        } finally {
          sensitiveButton.disabled = false;
        }
      });
      actions.appendChild(sensitiveButton);
    }
    if (script.sourceType === "remoteUrl") {
      const update = document.createElement("button");
      update.type = "button";
      update.className = "secondary-button compact-button";
      update.textContent = "检查更新";
      update.addEventListener("click", () => void reviewUserScriptUpdate(script, update));
      actions.appendChild(update);
    }
    if (script.sourceType !== "builtIn") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button text-button--danger";
      remove.textContent = "卸载";
      remove.addEventListener("click", () => void removeInstalledUserScript(script));
      actions.appendChild(remove);
    }
    const hash = document.createElement("code");
    hash.className = "userscript-hash";
    hash.textContent = `SHA-256 ${script.sourceHash.slice(0, 12)}… · 自动更新关闭`;
    actions.prepend(hash);
    card.append(top, actions);
    dom.userScriptList.appendChild(card);
  }
  renderUserScriptExecutions();
}

function applyUserScriptSnapshot(snapshot = {}) {
  userScriptState = {
    scripts: Array.isArray(snapshot.scripts) ? snapshot.scripts : userScriptState.scripts,
    executions: Array.isArray(snapshot.executions) ? snapshot.executions : userScriptState.executions,
  };
  renderUserScripts();
}

async function loadUserScripts() {
  if (typeof window.siteNest?.getUserScripts !== "function") return;
  try { applyUserScriptSnapshot(await window.siteNest.getUserScripts()); }
  catch (error) { showToast("无法读取网页脚本", error?.message || "请稍后重试", "error"); }
}

function openUserScriptInstall(type) {
  dom.userScriptInstallForm.reset();
  dom.userScriptInstallType.value = type;
  dom.userScriptInstallTitle.textContent = type === "remoteUrl" ? "检查远程脚本" : "检查粘贴脚本";
  dom.userScriptRemoteField.hidden = type !== "remoteUrl";
  dom.userScriptSourceField.hidden = type === "remoteUrl";
  openModal(dom.userScriptInstallModal);
}

function renderUserScriptReview(review) {
  pendingUserScriptReview = review;
  dom.userScriptReviewSummary.replaceChildren();
  const title = document.createElement("h3");
  title.textContent = `${review.name} · v${review.version}`;
  const description = document.createElement("p");
  description.textContent = review.description || "没有脚本说明";
  const author = document.createElement("small");
  author.textContent = `作者：${review.author || "未声明"} · ${review.sourceBytes} 字节 · ${userScriptSourceLabel(review.sourceType)}`;
  dom.userScriptReviewSummary.append(title, description, author);
  dom.userScriptReviewMatches.textContent = [...(review.matches || []), ...(review.includes || [])].join("\n") || "未声明（不会自动运行）";
  dom.userScriptReviewPermissions.textContent = [
    ...(review.grants || []).map((item) => `@grant ${item}`),
    ...(review.connects || []).map((item) => `@connect ${item}`),
  ].join("\n") || "无宿主权限；不允许跨域请求";
  const issues = review.compatibility?.unsupported || [];
  const warnings = review.compatibility?.warnings || [];
  dom.userScriptCompatibility.className = `userscript-compatibility${issues.length ? " is-error" : " is-ready"}`;
  dom.userScriptCompatibility.textContent = issues.length
    ? `不兼容：${issues.join("；")}`
    : warnings.length ? `可以安装；注意：${warnings.join("；")}` : "兼容性检查通过";
  const diff = review.updateOf && review.diff
    ? `\n\n代码差异：新增 ${review.diff.addedLines} 行，删除 ${review.diff.removedLines} 行${review.diff.truncated ? "（摘要已截断）" : ""}\n${review.diff.preview}`
    : "";
  dom.userScriptSourcePreview.textContent = `SHA-256 ${review.sourceHash}${diff}\n\n新源码摘要：\n${review.sourcePreview}`;
  dom.confirmUserScriptPermissions.checked = false;
  dom.confirmUserScriptInstall.disabled = true;
  dom.confirmUserScriptInstall.textContent = review.updateOf ? "确认更新" : "确认安装";
  if (review.updateOf && review.changed === false) {
    dom.userScriptCompatibility.textContent = "当前本地副本已是最新 Hash，不需要替换。";
  }
  openModal(dom.userScriptReviewModal);
}

async function reviewUserScriptUpdate(script, button) {
  button.disabled = true;
  try { renderUserScriptReview(await window.siteNest.checkUserScriptUpdate(script.id)); }
  catch (error) { showToast("无法检查脚本更新", error?.message || "请稍后重试", "error"); }
  finally { button.disabled = false; }
}

async function removeInstalledUserScript(script) {
  if (!window.confirm(`卸载“${script.name}”？脚本专属本地存储和执行记录也会删除。`)) return;
  try { applyUserScriptSnapshot(await window.siteNest.removeUserScript(script.id)); showToast("脚本已卸载", script.name); }
  catch (error) { showToast("无法卸载脚本", error?.message || "请稍后重试", "error"); }
}

async function runRestoreCopyScript() {
  if (typeof window.siteNest?.runRestoreCopyScript !== "function" || !browserSnapshot.hasOpenPage) {
    showToast("当前没有可处理的网页", "请先打开目标页面", "error");
    return;
  }
  try {
    const result = await window.siteNest.runRestoreCopyScript();
    if (!result?.ok) throw new Error(result?.message || "脚本未完成");
    showToast("已临时恢复复制与选择", "仅对当前页面生效，刷新后需要重新运行");
    if (dom.pageActionLastResult) dom.pageActionLastResult.textContent = "恢复复制与选择脚本执行完成";
  } catch (error) { showToast("无法恢复复制限制", error?.message || "当前页面不允许执行", "error"); }
}

async function refreshPageUserScriptCommands() {
  if (!dom.pageUserScriptCommands || typeof window.siteNest?.getUserScriptCommands !== "function") return;
  dom.pageUserScriptCommands.replaceChildren();
  try {
    const commands = await window.siteNest.getUserScriptCommands();
    dom.pageUserScriptStatus.textContent = commands.length ? `${commands.length} 个命令` : "隔离运行";
    for (const command of commands) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-action-item";
      button.append(createIconElement("code"));
      const copy = document.createElement("span");
      const title = document.createElement("strong"); title.textContent = command.name;
      const detail = document.createElement("small"); detail.textContent = command.scriptName;
      copy.append(title, detail);
      button.append(copy, createIconElement("chevron-right"));
      button.addEventListener("click", async () => {
        button.disabled = true;
        try { await window.siteNest.executeUserScriptCommand(command.scriptId, command.commandId); showToast("脚本命令已执行", command.name); }
        catch (error) { showToast("脚本命令执行失败", error?.message || "页面已变化", "error"); }
        finally { button.disabled = false; }
      });
      dom.pageUserScriptCommands.appendChild(button);
    }
  } catch { dom.pageUserScriptStatus.textContent = "不可用"; }
}

function formatResourceSize(value) {
  const size = Number(value);
  if (!Number.isFinite(size) || size < 0) return "大小未知";
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(2)} GB`;
}

function renderPageResources(snapshot = pageResourceState) {
  if (!dom.pageResourceList) return;
  pageResourceState = {
    items: Array.isArray(snapshot?.items) ? snapshot.items : [],
    detecting: snapshot?.detecting === true,
    detectionEndsAt: snapshot?.detectionEndsAt || null,
  };
  dom.pageResourceStatus.textContent = pageResourceState.detecting
    ? "检测中 · 最多 60 秒"
    : pageResourceState.items.length ? `${pageResourceState.items.length} 项` : "尚未扫描";
  dom.detectNetworkResources.textContent = pageResourceState.detecting ? "停止网络检测" : "开始网络检测";
  dom.pageResourceList.replaceChildren();
  if (!pageResourceState.items.length) {
    const empty = document.createElement("div");
    empty.className = "page-resource-empty";
    empty.textContent = "扫描结果仅保存在当前页面内存中，导航或关闭页面后清理。";
    dom.pageResourceList.appendChild(empty);
    return;
  }
  for (const resource of pageResourceState.items.slice(0, 100)) {
    const row = document.createElement("article");
    row.className = "page-resource-row";
    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = resource.filename || "未命名资源";
    const details = document.createElement("small");
    details.textContent = `${resource.type || "file"} · ${resource.mime || "MIME 未知"} · ${formatResourceSize(resource.size)} · ${resource.sourceElement || "页面"}`;
    const url = document.createElement("code");
    url.textContent = resource.url;
    url.title = resource.url;
    copy.append(title, details, url);
    const actions = document.createElement("div");
    actions.className = "page-resource-row-actions";
    const copyUrl = document.createElement("button");
    copyUrl.type = "button";
    copyUrl.className = "icon-button";
    copyUrl.title = "复制资源地址";
    copyUrl.appendChild(createIconElement("copy"));
    copyUrl.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(resource.url); showToast("资源地址已复制", resource.filename); }
      catch { showToast("无法复制资源地址", "系统剪贴板不可用", "error"); }
    });
    const download = document.createElement("button");
    download.type = "button";
    download.className = "secondary-button compact-button";
    download.textContent = "保存";
    download.addEventListener("click", async () => {
      download.disabled = true;
      try { await window.siteNest.downloadPageResource(resource.id); showToast("已打开保存对话框", resource.filename); }
      catch (error) { showToast("无法保存资源", error?.message || "资源可能已失效", "error"); }
      finally { download.disabled = false; }
    });
    actions.append(copyUrl, download);
    row.append(copy, actions);
    dom.pageResourceList.appendChild(row);
  }
}

async function loadPageResources() {
  if (typeof window.siteNest?.getPageResources !== "function" || !browserSnapshot.hasOpenPage) {
    renderPageResources({ items: [], detecting: false });
    return pageResourceState;
  }
  try { renderPageResources(await window.siteNest.getPageResources()); }
  catch { renderPageResources({ items: [], detecting: false }); }
  return pageResourceState;
}

function selectAutomationTab(tab, options = {}) {
  const aliases = { workflows: "schedules", extension: "scripts" };
  const requested = aliases[tab] || tab;
  const allowed = new Set(["checkins", "scripts", "assistants", "schedules", "logs"]);
  currentAutomationTab = allowed.has(requested) ? requested : "checkins";
  dom.automationTabs.querySelectorAll("[data-automation-tab]").forEach((button) => {
    const active = button.dataset.automationTab === currentAutomationTab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  document.querySelectorAll("[data-automation-panel]").forEach((panel) => {
    const active = panel.dataset.automationPanel === currentAutomationTab;
    panel.classList.toggle("is-active", active);
    panel.hidden = !active;
  });
  if (options.load === false) return;
  if (currentAutomationTab === "scripts") void loadUserScripts();
  if (currentAutomationTab === "assistants") void loadAssistants();
  if (currentAutomationTab === "logs") void loadExecutionLogs();
}

function formatAssistantMatchPattern(pattern) {
  if (typeof pattern === "string") return pattern;
  if (!pattern || typeof pattern !== "object") return "";
  const explicit = pattern.pattern || pattern.urlPattern || "";
  if (explicit) return String(explicit);
  const formatRule = (rule, kind) => {
    if (typeof rule === "string") return rule;
    if (Array.isArray(rule)) return rule.map(String).slice(0, 3).join("、");
    if (!rule || typeof rule !== "object") return "";
    const values = [];
    const pushValues = (value, prefix = "") => {
      const list = Array.isArray(value) ? value : value ? [value] : [];
      list.slice(0, 3).forEach((item) => values.push(`${prefix}${String(item)}`));
    };
    pushValues(rule.exact);
    pushValues(rule.suffix, kind === "hostname" ? "*." : "*");
    pushValues(rule.prefix, kind === "pathname" ? "" : "前缀 ");
    pushValues(rule.prefixes, kind === "pathname" ? "" : "前缀 ");
    if (rule.any === true) values.push("任意");
    return values.join("、");
  };
  const hostname = formatRule(pattern.hostname || pattern.host || pattern.domain, "hostname");
  const pathname = formatRule(pattern.pathname || pattern.path, "pathname");
  if (hostname && pathname && pathname !== "任意") return `${hostname} · 路径 ${pathname}`;
  if (hostname) return hostname;
  if (pathname) return `路径 ${pathname}`;
  return "已声明网址规则";
}

function renderAssistants(assistants = assistantCache) {
  assistantCache = Array.isArray(assistants) ? assistants : [];
  dom.assistantCountBadge.textContent = `${assistantCache.length} 个助手`;
  dom.assistantList.replaceChildren();
  if (!assistantCache.length) {
    const empty = document.createElement("div");
    empty.className = "automation-empty-state";
    empty.appendChild(createIconElement("spark"));
    const title = document.createElement("strong");
    title.textContent = typeof window.siteNest?.getAssistants === "function"
      ? "暂无可用站点助手"
      : "站点助手尚未配置";
    const detail = document.createElement("small");
    detail.textContent = typeof window.siteNest?.getAssistants === "function"
      ? "安装或注册本地助手后会显示在这里。"
      : "当前桌面端尚未提供助手注册接口；这里不会展示模拟数据。";
    empty.append(title, detail);
    dom.assistantList.appendChild(empty);
    return;
  }

  for (const assistant of assistantCache) {
    const id = String(assistant.id || "");
    const card = document.createElement("article");
    card.className = "assistant-card";
    const logo = document.createElement("span");
    logo.className = "assistant-card-logo";
    logo.textContent = assistant.shortName || shortName(assistant.name || id);
    const copy = document.createElement("div");
    copy.className = "assistant-card-copy";
    const titleRow = document.createElement("div");
    titleRow.className = "assistant-card-title-row";
    const title = document.createElement("h3");
    title.textContent = assistant.name || id || "未命名助手";
    const version = document.createElement("span");
    version.className = "status-pill";
    version.textContent = assistant.version ? `v${assistant.version}` : "版本未标注";
    titleRow.append(title, version);
    const description = document.createElement("p");
    description.textContent = assistant.description || "暂无助手说明";
    const meta = document.createElement("div");
    meta.className = "assistant-card-meta";
    const patterns = Array.isArray(assistant.matchPatterns)
      ? assistant.matchPatterns.slice(0, 3).map(formatAssistantMatchPattern).filter(Boolean).join("、") || "未声明适用站点"
      : assistant.sites || assistant.applicableSites || "未声明适用站点";
    const permissions = Array.isArray(assistant.permissions)
      ? assistant.permissions.join("、")
      : "未声明额外权限";
    const source = assistant.source === "built-in" ? "内置" : assistant.source || "本地";
    const lastRun = assistant.lastExecutedAt || assistant.lastRunAt;
    [
      `适用：${patterns}`,
      `来源：${source}`,
      `权限：${permissions}`,
      `上次执行：${formatAutomationTime(lastRun)}`,
    ].forEach((value) => {
      const span = document.createElement("span");
      span.textContent = value;
      meta.appendChild(span);
    });
    copy.append(titleRow, description, meta);

    const toggle = document.createElement("label");
    toggle.className = "assistant-toggle toggle-control";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = assistant.enabled !== false;
    input.disabled = assistant.canDisable === false || !id || typeof window.siteNest?.setAssistantEnabled !== "function";
    const track = document.createElement("span");
    track.className = "toggle-track";
    track.appendChild(document.createElement("span"));
    const label = document.createElement("span");
    label.textContent = assistant.canDisable === false ? "始终启用" : input.checked ? "已启用" : "已停用";
    toggle.append(input, track, label);
    input.addEventListener("change", async () => {
      const desired = input.checked;
      input.disabled = true;
      try {
        await window.siteNest.setAssistantEnabled(id, desired);
        label.textContent = desired ? "已启用" : "已停用";
        showToast(desired ? "站点助手已启用" : "站点助手已停用", assistant.name || id);
        await loadAssistants({ preserveModalSelection: true });
      } catch (error) {
        input.checked = !desired;
        label.textContent = input.checked ? "已启用" : "已停用";
        input.disabled = false;
        showToast("无法更新站点助手", error?.message || "请稍后重试", "error");
      }
    });
    card.append(logo, copy, toggle);
    dom.assistantList.appendChild(card);
  }
}

async function loadAssistants(options = {}) {
  const selectedIds = options.preserveModalSelection
    ? Array.from(dom.siteAssistantOptions.querySelectorAll('input[name="assistantIds"]:checked')).map((input) => input.value)
    : null;
  if (typeof window.siteNest?.getAssistants !== "function") {
    assistantCache = [];
    renderAssistants();
    renderSiteAssistantOptions(selectedIds || []);
    return assistantCache;
  }
  try {
    const result = await window.siteNest.getAssistants();
    applyReturnedState(result);
    assistantCache = normalizeAssistantList(result);
    renderAssistants();
    renderSiteAssistantOptions(selectedIds || []);
  } catch (error) {
    assistantCache = [];
    renderAssistants();
    showToast("无法读取站点助手", error?.message || "请稍后重试", "error");
  }
  return assistantCache;
}

function executionStatusLabel(status) {
  const labels = {
    success: "成功",
    completed: "成功",
    error: "失败",
    failed: "失败",
    failure: "失败",
    denied: "已拒绝",
    "not-configured": "未配置",
    blocked: "已阻止",
    running: "执行中",
  };
  return labels[String(status || "").toLowerCase()] || status || "已记录";
}

function renderExecutionLogs(logs = executionLogCache) {
  executionLogCache = Array.isArray(logs) ? logs : [];
  dom.executionLogList.replaceChildren();
  if (!executionLogCache.length) {
    const empty = document.createElement("div");
    empty.className = "automation-empty-state";
    empty.appendChild(createIconElement("clock"));
    const title = document.createElement("strong");
    title.textContent = typeof window.siteNest?.getExecutionLogs === "function"
      ? "暂无执行记录"
      : "执行记录接口尚未配置";
    const detail = document.createElement("small");
    detail.textContent = typeof window.siteNest?.getExecutionLogs === "function"
      ? "执行真实页面动作后，结果会显示在这里。"
      : "当前版本不会使用模拟记录填充此页面。";
    empty.append(title, detail);
    dom.executionLogList.appendChild(empty);
    return;
  }

  for (const log of executionLogCache.slice(0, 200)) {
    const row = document.createElement("article");
    row.className = "execution-log-row";
    const time = document.createElement("time");
    const timestamp = log.timestamp || log.createdAt || log.executedAt || log.time;
    time.dateTime = timestamp || "";
    time.textContent = formatAutomationTime(timestamp);
    const main = document.createElement("div");
    main.className = "execution-log-copy";
    const title = document.createElement("strong");
    title.textContent = `${log.assistantName || log.assistant || "通用页面动作"} · ${log.actionName || log.action || "未命名动作"}`;
    const site = document.createElement("small");
    const siteValue = log.site;
    site.textContent = log.siteName ||
      (typeof siteValue === "string" ? siteValue : siteValue?.name || siteValue?.hostname || siteValue?.siteId) ||
      log.hostname ||
      log.siteId ||
      "当前页面";
    const result = document.createElement("p");
    result.textContent = log.error || log.errorMessage || log.summary || log.result || log.message || "动作已执行";
    main.append(title, site, result);
    const status = document.createElement("span");
    const statusValue = String(log.status || (log.error ? "error" : "success")).toLowerCase();
    status.className = `status-pill${["error", "failed", "failure", "denied", "not-configured", "blocked"].includes(statusValue) ? " status-pill--error" : " status-pill--ready"}`;
    status.textContent = executionStatusLabel(statusValue);
    row.append(time, main, status);
    dom.executionLogList.appendChild(row);
  }
}

async function loadExecutionLogs() {
  if (typeof window.siteNest?.getExecutionLogs !== "function") {
    executionLogCache = [];
    renderExecutionLogs();
    return executionLogCache;
  }
  dom.refreshExecutionLogs.disabled = true;
  try {
    const result = await window.siteNest.getExecutionLogs();
    executionLogCache = normalizeExecutionLogs(result);
    renderExecutionLogs();
  } catch (error) {
    executionLogCache = [];
    renderExecutionLogs();
    showToast("无法读取执行记录", error?.message || "请稍后重试", "error");
  } finally {
    dom.refreshExecutionLogs.disabled = false;
  }
  return executionLogCache;
}

function actionIconName(action) {
  if (ICONS[action?.icon]) return action.icon;
  const id = String(action?.id || action?.actionId || "").toLowerCase();
  if (id.includes("copy")) return "copy";
  if (id.includes("external") || id.includes("browser")) return "external";
  if (id.includes("pin")) return "pin";
  if (id.includes("save") || id.includes("add")) return "plus";
  return "spark";
}

function normalizePageActionPayload(payload) {
  const context = payload?.context || payload?.pageContext || payload?.page || {};
  const assistants = normalizeAssistantList(payload);
  const primaryAssistant = payload?.assistant ||
    payload?.matchedAssistant ||
    assistants.find((assistant) => assistant?.id !== "generic-page-actions") ||
    assistants[0] ||
    null;
  let actions = Array.isArray(payload?.actions) ? payload.actions : [];
  if (!actions.length && assistants.length) {
    actions = assistants.flatMap((assistant) =>
      (Array.isArray(assistant.actions) ? assistant.actions : []).map((action) => ({
        ...action,
        assistantId: action.assistantId || assistant.id,
      })),
    );
  } else if (!actions.length && primaryAssistant && Array.isArray(primaryAssistant.actions)) {
    actions = primaryAssistant.actions.map((action) => ({
      ...action,
      assistantId: action.assistantId || primaryAssistant.id,
    }));
  }
  const permissions = Array.isArray(payload?.permissions)
    ? payload.permissions
    : Array.isArray(primaryAssistant?.permissions)
      ? primaryAssistant.permissions
      : [];
  return { context, assistants, primaryAssistant, actions, permissions, lastResult: payload?.lastResult };
}

function renderPageActions(payload, serviceError = "") {
  pageActionSnapshot = payload || null;
  const normalized = normalizePageActionPayload(payload || {});
  const contextUrl = normalized.context.url || browserSnapshot.url || currentSite?.url || "";
  const contextTitle = normalized.context.title || browserSnapshot.title || currentSite?.name || "当前页面";
  dom.pageActionTitle.textContent = contextTitle;
  dom.pageActionHost.textContent = normalized.context.hostname || hostFromUrl(contextUrl);

  const assistants = normalized.assistants.length
    ? normalized.assistants
    : normalized.primaryAssistant
      ? [normalized.primaryAssistant]
      : [];
  if (assistants.length) {
    dom.pageAssistantStatus.textContent = `${assistants.length} 个匹配`;
    dom.pageAssistantStatus.className = "status-pill status-pill--ready";
    dom.pageAssistantSummary.replaceChildren();
    assistants.forEach((assistant) => {
      const item = document.createElement("div");
      const strong = document.createElement("strong");
      strong.textContent = assistant.name || assistant.id || "站点助手";
      const small = document.createElement("small");
      small.textContent = assistant.description || "已匹配当前网址";
      item.append(strong, small);
      if (assistant.id === "zoho-desk-ticket") {
        const context = document.createElement("small");
        const ticketId = assistant.context?.ticketId;
        context.textContent = ticketId ? `工单编号：${ticketId}` : "当前页面尚未识别到工单编号";
        item.appendChild(context);
      }
      dom.pageAssistantSummary.appendChild(item);
    });
  } else {
    dom.pageAssistantStatus.textContent = serviceError ? "未配置" : "通用页面";
    dom.pageAssistantStatus.className = `status-pill${serviceError ? " status-pill--preview" : ""}`;
    dom.pageAssistantSummary.textContent = serviceError
      ? serviceError
      : "当前页面没有专用助手；可使用服务返回的通用页面动作。";
  }

  dom.pageActionPermissions.textContent = normalized.permissions.length
    ? `本次可能使用：${normalized.permissions.join("、")}`
    : "当前未声明额外页面权限；动作执行前仍会由桌面端检查。";
  dom.pageActionList.replaceChildren();
  if (!normalized.actions.length) {
    const empty = document.createElement("div");
    empty.className = "page-action-empty";
    empty.textContent = serviceError || "当前页面没有可执行动作";
    dom.pageActionList.appendChild(empty);
  } else {
    normalized.actions.forEach((action) => {
      const actionId = String(action.id || action.actionId || "");
      const assistantId = String(
        action.assistantId || normalized.primaryAssistant?.id || action.source || "generic",
      );
      const button = document.createElement("button");
      button.type = "button";
      button.className = "page-action-item";
      button.disabled = !actionId || action.disabled === true || action.enabled === false || Boolean(action.disabledReason);
      const icon = createIconElement(actionIconName(action));
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = action.name || action.label || action.title || actionId || "未命名动作";
      const detail = document.createElement("small");
      detail.textContent = action.disabledReason || action.unavailableReason || action.description || action.permissionSummary || "由栖页在本机执行";
      copy.append(title, detail);
      button.append(icon, copy, createIconElement("chevron-right"));
      button.addEventListener("click", () => void executePageAction(assistantId, actionId, button, title.textContent));
      dom.pageActionList.appendChild(button);
    });
  }
  const lastResult = normalized.lastResult;
  if (lastResult) {
    dom.pageActionLastResult.textContent = lastResult.message || lastResult.result || "最近一次动作已执行";
    dom.pageActionLastResult.classList.toggle("is-error", lastResult.ok === false || lastResult.status === "error");
  } else {
    dom.pageActionLastResult.textContent = "尚未执行页面动作";
    dom.pageActionLastResult.classList.remove("is-error");
  }
}

function currentZohoTicketId() {
  const tab = activeBrowserTab(browserSnapshot);
  const reliable = tab?.reliableContext;
  if (
    reliable?.system === "zoho-desk" &&
    reliable?.objectType === "ticket" &&
    /^\d{6,30}$/.test(String(reliable.objectId || ""))
  ) return String(reliable.objectId);
  try {
    const parsed = new URL(browserSnapshot.url || browserSnapshot.currentURL || "");
    const allowed = /(^|\.)desk\.zoho\.(com|eu|in|com\.au|jp|com\.cn|sa|uk)$/.test(parsed.hostname) ||
      parsed.hostname === "desk.zohocloud.ca";
    if (!allowed || parsed.protocol !== "https:") return null;
    const match = parsed.pathname.match(/(?:^|\/)tickets\/details\/(\d{6,30})(?=\/|$)/i) ||
      parsed.hash.match(/^#Cases\/dv\/(\d{6,30})\/?$/i);
    return match?.[1] || null;
  } catch {
    return null;
  }
}

function addZohoContextField(label, value) {
  const row = document.createElement("div");
  row.className = "zoho-context-field";
  const key = document.createElement("span");
  key.textContent = label;
  const text = document.createElement("strong");
  text.textContent = value || "—";
  row.append(key, text);
  dom.zohoTicketContext.appendChild(row);
}

function renderZohoTicketContext(ticketId, ticket, errorMessage = "") {
  const show = Boolean(ticketId);
  dom.zohoContextAssistant.classList.toggle("is-hidden", !show);
  if (!show) {
    zohoTicketContext = null;
    return;
  }
  dom.pageActionPanel.querySelector(".page-action-panel-header h2").textContent = "工单上下文助手";
  dom.zohoTicketContext.replaceChildren();
  if (!ticket) {
    dom.zohoContextStatus.textContent = errorMessage ? "不可用" : "正在读取";
    addZohoContextField("工单 ID", ticketId);
    if (errorMessage) addZohoContextField("连接状态", errorMessage);
  } else {
    zohoTicketContext = ticket;
    dom.zohoContextStatus.textContent = "已识别";
    dom.zohoContextStatus.className = "status-pill status-pill--ready";
    addZohoContextField("工单号", `#${ticket.ticketNumber || ticket.id}`);
    addZohoContextField("标题", ticket.title);
    addZohoContextField("状态", ticket.status);
    addZohoContextField("优先级", ticket.priority);
    addZohoContextField("客户", ticket.customerName || ticket.accountName);
    addZohoContextField("联系人", ticket.contactName);
    addZohoContextField("最后活动", ticket.updatedAt ? new Date(ticket.updatedAt).toLocaleString("zh-CN", { hour12: false }) : "—");
    addZohoContextField("客户等待", ticket.customerWaitingLabel || "当前无需等待判断");
    addZohoContextField("SLA", ticket.sla?.label || "当前连接未返回 SLA 数据");
  }
  const link = appState.externalObjectLinks?.find((item) =>
    item.sourceSystem === "zoho-desk" &&
    item.sourceObjectType === "ticket" &&
    String(item.sourceObjectId) === String(ticketId) &&
    item.targetSystem === "gitee",
  );
  dom.giteeAssociationState.textContent = link
    ? `${link.targetObjectId || "已关联"}${link.metadata?.status ? ` · ${link.metadata.status}` : ""}`
    : "尚未获取到 Gitee 关联信息";
}

async function refreshZohoTicketContext() {
  const ticketId = currentZohoTicketId();
  if (!ticketId) {
    dom.pageActionPanel.querySelector(".page-action-panel-header h2").textContent = "当前页面动作";
    renderZohoTicketContext(null, null);
    return;
  }
  renderZohoTicketContext(ticketId, null);
  if (typeof window.siteNest?.getZohoTicketContext !== "function") {
    renderZohoTicketContext(ticketId, null, "Zoho 连接器不可用");
    return;
  }
  try {
    const result = await window.siteNest.getZohoTicketContext(ticketId);
    if (!result?.ok) throw new Error(result?.error?.message || "无法读取工单上下文");
    renderZohoTicketContext(ticketId, result.value);
  } catch (error) {
    renderZohoTicketContext(ticketId, null, error?.message || "无法读取工单上下文");
  }
}

async function executePageAction(assistantId, actionId, button, label) {
  if (typeof window.siteNest?.executePageAction !== "function") {
    showToast("页面动作尚未配置", "桌面端未提供动作执行接口", "error");
    return;
  }
  button.disabled = true;
  dom.pageActionLastResult.classList.remove("is-error");
  dom.pageActionLastResult.textContent = `正在执行：${label}`;
  try {
    const result = await window.siteNest.executePageAction(assistantId, actionId);
    applyReturnedState(result);
    const failed = result?.ok === false ||
      ["error", "failed", "failure", "denied", "not-configured", "blocked"].includes(
        String(result?.status || "").toLowerCase(),
      );
    const message = result?.message || result?.result || (failed ? "动作未完成" : "动作已完成");
    dom.pageActionLastResult.textContent = message;
    dom.pageActionLastResult.classList.toggle("is-error", failed);
    showToast(failed ? "页面动作未完成" : "页面动作已完成", message, failed ? "error" : "success");
    renderAll();
    void loadExecutionLogs();
    void refreshPageActions();
  } catch (error) {
    dom.pageActionLastResult.textContent = error?.message || "页面动作执行失败";
    dom.pageActionLastResult.classList.add("is-error");
    showToast("页面动作执行失败", error?.message || "请稍后重试", "error");
  } finally {
    if (button.isConnected) button.disabled = false;
  }
}

async function refreshPageActions() {
  const requestId = ++pageActionRequestId;
  dom.pageActionTitle.textContent = browserSnapshot.title || currentSite?.name || "正在读取当前页面";
  dom.pageActionHost.textContent = hostFromUrl(browserSnapshot.url || currentSite?.url);
  dom.pageAssistantStatus.textContent = "正在识别";
  if (typeof window.siteNest?.getPageActions !== "function") {
    renderPageActions(null, "当前桌面端尚未提供页面动作接口");
    return;
  }
  try {
    const result = await window.siteNest.getPageActions();
    if (requestId !== pageActionRequestId) return;
    renderPageActions(result);
    void refreshZohoTicketContext();
    void refreshPageUserScriptCommands();
    void loadPageResources();
  } catch (error) {
    if (requestId !== pageActionRequestId) return;
    renderPageActions(null, error?.message || "无法读取当前页面动作");
    void refreshZohoTicketContext();
    void refreshPageUserScriptCommands();
    void loadPageResources();
  }
}

function setPageActionPanelOpen(open) {
  pageActionPanelOpen = Boolean(open && browserSnapshot.hasOpenPage && dom.browserPage.classList.contains("is-visible"));
  dom.pageActionPanel.hidden = !pageActionPanelOpen;
  dom.browserContent.classList.toggle("is-action-panel-open", pageActionPanelOpen);
  dom.pageActionPanel.setAttribute("aria-hidden", String(!pageActionPanelOpen));
  dom.pageActionsButton.setAttribute("aria-expanded", String(pageActionPanelOpen));
  dom.pageActionsButton.classList.toggle("is-active", pageActionPanelOpen);
  if (pageActionPanelOpen) void refreshPageActions();
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
}

async function rememberContextAssistantCollapsed(collapsed) {
  appState.uiSettings = {
    ...(appState.uiSettings || {}),
    contextAssistantCollapsed: Boolean(collapsed),
  };
  if (typeof window.siteNest?.updateUiSettings !== "function") return;
  try {
    const result = await window.siteNest.updateUiSettings({
      contextAssistantCollapsed: Boolean(collapsed),
    });
    if (result?.state) appState = result.state;
  } catch (error) {
    showToast("无法保存助手状态", error?.message || "请稍后重试", "error");
  }
}

function handleBrowserState(next = {}) {
  const nextWorkspaceId = String(next.workspaceId || activeWorkspaceId());
  if (nextWorkspaceId !== activeWorkspaceId()) return;
  const normalized = normalizeWorkspaceBrowserState(next, nextWorkspaceId);
  const previousUrl = browserSnapshot.url;
  browserSnapshot = { ...browserSnapshot, ...normalized };
  if (previousUrl && normalized.url && previousUrl !== normalized.url) {
    renderPageResources({ items: [], detecting: false });
  }
  appState.workspaceBrowserStates = {
    ...(appState.workspaceBrowserStates || {}),
    [nextWorkspaceId]: {
      ...(appState.workspaceBrowserStates?.[nextWorkspaceId] || {}),
      activeSiteId: normalized.siteId,
      activeTabId: normalized.activeTabId,
      tabs: normalized.tabs,
      currentURL: normalized.currentURL,
      updatedAt: new Date().toISOString(),
    },
  };
  renderBrowserTabs(normalized);
  renderCurrentSessions();

  if (!normalized.hasOpenPage) {
    if (normalized.tabs.length && dom.browserPage.classList.contains("is-visible")) {
      setPageActionPanelOpen(false);
      currentSite = null;
      currentRoute = "browser-tabs";
      window.siteNest?.hideBrowser();
      dom.siteLoginButton.classList.add("is-hidden");
      dom.repairNetworkButton.classList.add("is-hidden");
      dom.resetNodeSeekSession.classList.add("is-hidden");
      dom.repairSapSession.classList.add("is-hidden");
      updateActiveNavigation();
    } else if (!normalized.tabs.length && dom.browserPage.classList.contains("is-visible")) {
      clearWorkspaceBrowserPresentation(nextWorkspaceId, { showEmpty: true });
      renderAll();
    }
    return;
  }

  if (dom.browserPage.classList.contains("is-visible")) {
    const matchingSite = siteForWorkspaceBrowserState(normalized);
    if (matchingSite && siteWorkspaceId(matchingSite) === nextWorkspaceId) {
      currentSite = matchingSite;
      currentRoute = `site:${matchingSite.id}`;
      dom.browserSiteLogo.textContent = matchingSite.shortName || shortName(matchingSite.name);
      dom.browserSiteLogo.style.setProperty(
        "--site-color",
        matchingSite.color || colorFromString(matchingSite.url),
      );
      dom.browserSiteName.textContent = matchingSite.name || hostFromUrl(matchingSite.url);
    }
    if (
      currentZohoTicketId() &&
      appState.uiSettings?.contextAssistantCollapsed !== true &&
      !pageActionPanelOpen
    ) {
      setPageActionPanelOpen(true);
    }
  }
  const currentHost = hostFromUrl(browserSnapshot.url);
  dom.browserBack.disabled = !browserSnapshot.canGoBack;
  dom.browserForward.disabled = !browserSnapshot.canGoForward;
  dom.addressField.classList.toggle("is-loading", Boolean(browserSnapshot.loading));
  if (document.activeElement !== dom.addressInput && browserSnapshot.url) {
    dom.addressInput.value = browserSnapshot.url;
  }
  dom.zoomLabel.textContent = `${Math.round((browserSnapshot.zoomFactor || 1) * 100)}%`;
  const securityState = browserSnapshot.securityState || "unknown";
  const securityLabel = securityState === "secure"
    ? "HTTPS"
    : securityState === "insecure"
      ? "不安全"
      : "安全状态";
  dom.browserSecurityLabel.textContent = securityLabel;
  dom.browserSecurityNote.title = securityState === "secure"
    ? "当前页面使用 HTTPS；登录 Cookie 仍只保存在栖页浏览身份中"
    : securityState === "insecure"
      ? "当前页面未使用 HTTPS，请勿输入敏感信息"
      : "暂时无法判断当前页面的连接安全状态";
  dom.browserSecurityNote.classList.toggle("is-insecure", securityState === "insecure");
  const securityIcon = dom.browserSecurityNote.querySelector("[data-icon]");
  if (securityIcon) {
    securityIcon.dataset.icon = securityState === "insecure" ? "alert" : "lock";
    securityIcon.dataset.iconMounted = "true";
    securityIcon.innerHTML = iconMarkup(securityIcon.dataset.icon);
  }
  dom.browserSiteName.title = browserSnapshot.title || currentSite?.name || "";
  dom.browserSiteStatus.textContent = browserSnapshot.error
    ? "加载失败"
    : browserSnapshot.loading
      ? "正在加载页面"
      : "已连接";
  dom.browserSiteStatus.title = browserSnapshot.error || dom.browserSiteStatus.textContent;
  dom.browserReload.title = browserSnapshot.loading ? "停止加载" : "刷新";
  dom.browserReload.replaceChildren(
    createIconElement(browserSnapshot.loading ? "close" : "reload"),
  );
  dom.siteLoginButton.classList.toggle("is-hidden", currentHost !== "nodeseek.com");
  dom.repairNetworkButton.classList.toggle(
    "is-hidden",
    browserSnapshot.siteIssue !== "nodeseek-network",
  );
  dom.resetNodeSeekSession.classList.toggle(
    "is-hidden",
    browserSnapshot.siteIssue !== "nodeseek-network",
  );
  dom.repairSapSession.classList.toggle(
    "is-hidden",
    browserSnapshot.siteIssue !== "sap-auth-state",
  );
  if (pageActionPanelOpen) {
    window.clearTimeout(pageActionRefreshTimer);
    pageActionRefreshTimer = window.setTimeout(() => void refreshPageActions(), 180);
  }
}

function bindEvents() {
  dom.appWorkspace.addEventListener("transitionend", (event) => {
    if (event.target === dom.appWorkspace && event.propertyName === "grid-template-columns") {
      syncBrowserBounds();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest("#appContextMenu")) closeSiteContextMenu();
    if (googleSyncPopoverOpen && !event.target.closest("#googleSyncArea")) {
      setGoogleSyncPopoverOpen(false);
    }

    const workspaceButton = event.target.closest("[data-workspace-id]");
    if (workspaceButton) void switchWorkspace(workspaceButton.dataset.workspaceId);

    const routeButton = event.target.closest("[data-route]");
    if (routeButton) navigateTo(routeButton.dataset.route);

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      const modal = document.getElementById(closeButton.dataset.closeModal);
      if (modal) closeModal(modal);
    }

    const openUrlButton = event.target.closest("[data-open-url]");
    if (openUrlButton) {
      void openSite({
        id: `shortcut:${openUrlButton.dataset.openUrl}`,
        name: openUrlButton.dataset.openName || hostFromUrl(openUrlButton.dataset.openUrl),
        shortName: shortName(openUrlButton.dataset.openName),
        url: openUrlButton.dataset.openUrl,
        color: openUrlButton.dataset.openColor || colorFromString(openUrlButton.dataset.openUrl),
        openMode: "internal",
      });
    }
  });

  dom.sidebarToggle.addEventListener("click", () => {
    applySidebarCollapsed(!dom.appShell.classList.contains("is-sidebar-collapsed"));
  });
  dom.sessionScopeToggle.addEventListener("click", async () => {
    const next = appState.uiSettings?.sessionVisibility === "workspace" ? "all" : "workspace";
    try {
      const result = await window.siteNest.updateUiSettings({ sessionVisibility: next });
      appState = result.state || { ...appState, uiSettings: result.uiSettings };
      renderAll();
    } catch (error) {
      showToast("无法保存会话显示设置", error?.message || "请稍后重试", "error");
    }
  });
  dom.sessionVisibilitySetting.addEventListener("change", async () => {
    const sessionVisibility = dom.sessionVisibilitySetting.checked ? "workspace" : "all";
    try {
      const result = await window.siteNest.updateUiSettings({ sessionVisibility });
      appState = result.state || { ...appState, uiSettings: result.uiSettings };
      renderAll();
    } catch (error) {
      dom.sessionVisibilitySetting.checked = !dom.sessionVisibilitySetting.checked;
      showToast("无法保存会话显示设置", error?.message || "请稍后重试", "error");
    }
  });
  dom.popupPolicyForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    let hostnamePattern;
    try {
      hostnamePattern = normalizePopupHostnameInput(dom.popupPolicyHost.value);
    } catch (error) {
      showToast("域名规则无效", error?.message || "请检查域名", "error");
      return;
    }
    const policy = {
      hostnamePattern,
      mode: dom.popupPolicyMode.value,
      preserveOpener: dom.popupPolicyPreserveOpener.checked,
      allowPost: dom.popupPolicyAllowPost.checked,
      allowedRedirectOrigins: [],
    };
    const next = [
      ...popupPolicies().filter((item) => item.hostnamePattern !== hostnamePattern),
      policy,
    ];
    try {
      const result = await window.siteNest.updateUiSettings({ sitePopupPolicies: next });
      appState = result.state || { ...appState, uiSettings: result.uiSettings };
      dom.popupPolicyForm.reset();
      dom.popupPolicyMode.value = "popup";
      dom.popupPolicyPreserveOpener.checked = true;
      renderPopupPolicies();
      showToast("弹窗规则已保存", hostnamePattern);
    } catch (error) {
      showToast("无法保存弹窗规则", error?.message || "请稍后重试", "error");
    }
  });
  dom.saveBrowserMemorySettings.addEventListener("click", async () => {
    dom.saveBrowserMemorySettings.disabled = true;
    const browserMemory = {
      mode: dom.browserMemoryMode.value,
      inactiveMinutes: Number(dom.browserMemoryInactiveMinutes.value),
    };
    try {
      const result = await window.siteNest.updateUiSettings({ browserMemory });
      appState = result.state || { ...appState, uiSettings: result.uiSettings };
      await loadBrowserLifecycle();
      showToast("网页内存设置已保存", BROWSER_MEMORY_LABELS[browserMemory.mode] || "标准");
    } catch (error) {
      showToast("无法保存网页内存设置", error?.message || "请稍后重试", "error");
    } finally { dom.saveBrowserMemorySettings.disabled = false; }
  });
  dom.planAddTaskButton.addEventListener("click", () => openTaskModal());
  dom.planViewTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-view]");
    if (!button) return;
    currentTaskView = button.dataset.taskView;
    renderPlan();
  });
  document.addEventListener("click", (event) => {
    const weekMove = event.target.closest("[data-week-move]");
    if (weekMove) {
      const movement = Number(weekMove.dataset.weekMove);
      taskWeekAnchor = movement === 0 ? new Date() : new Date(taskWeekAnchor.valueOf() + movement * 7 * 86400000);
      renderTaskWeek();
    }
    const monthMove = event.target.closest("[data-month-move]");
    if (monthMove) {
      const movement = Number(monthMove.dataset.monthMove);
      taskMonthAnchor = movement === 0 ? new Date() : new Date(taskMonthAnchor.getFullYear(), taskMonthAnchor.getMonth() + movement, 1);
      selectedTaskDay = new Date(taskMonthAnchor.getFullYear(), taskMonthAnchor.getMonth(), 1);
      renderTaskMonth();
    }
  });
  dom.taskForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = taskFormPayload();
    if (!payload.title) return;
    const submit = dom.taskForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const result = payload.id
        ? await window.siteNest.updateTask(payload)
        : await window.siteNest.addTask(payload);
      applyTaskSnapshot(result);
      closeModal(dom.taskModal);
      showToast(payload.id ? "任务已更新" : "任务已添加", payload.title);
    } catch (error) {
      showToast("无法保存任务", error?.message || "请检查任务内容", "error");
    } finally {
      submit.disabled = false;
    }
  });
  dom.deleteTaskButton.addEventListener("click", async () => {
    const task = taskForId(dom.taskId.value);
    if (!task || !window.confirm(`删除任务“${task.title}”？此操作同时删除其本地提醒。`)) return;
    try {
      const result = await window.siteNest.deleteTask(task.id);
      applyTaskSnapshot(result);
      closeModal(dom.taskModal);
      showToast("任务已删除", task.title);
    } catch (error) {
      showToast("无法删除任务", error?.message || "请稍后重试", "error");
    }
  });
  dom.saveTaskSettingsButton.addEventListener("click", async () => {
    dom.saveTaskSettingsButton.disabled = true;
    try {
      const result = await window.siteNest.updateTaskSettings({
        remindersEnabled: dom.taskRemindersEnabled.checked,
        trayOnClose: dom.taskTrayOnClose.checked,
        autoLaunch: dom.taskAutoLaunch.checked,
        startMinimized: dom.taskStartMinimized.checked,
        notificationSound: dom.taskNotificationSound.checked,
        doNotDisturb: {
          enabled: dom.taskDndEnabled.checked,
          start: dom.taskDndStart.value,
          end: dom.taskDndEnd.value,
        },
      });
      applyTaskSnapshot(result);
      showToast("通知设置已保存", result.settings.trayOnClose ? "关闭窗口后将驻留托盘" : "关闭窗口将完全退出");
    } catch (error) {
      showToast("无法保存通知设置", error?.message || "请稍后重试", "error");
    } finally {
      dom.saveTaskSettingsButton.disabled = false;
    }
  });
  dom.translationConfigForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.translationConfigForm.querySelector('button[type="submit"]');
    if (submit) submit.disabled = true;
    try {
      translationStatusCache = await window.siteNest.configureTranslation(translationFormPayload());
      if (translationStatusCache?.settings) {
        appState.uiSettings.translation = translationStatusCache.settings;
      }
      dom.translationApiKey.value = "";
      renderTranslationSettings();
      showToast("翻译配置已安全保存", translationStatusCache.configured ? "Provider 已可用" : "仍需填写 API Key");
    } catch (error) {
      showToast("无法保存翻译配置", error?.message || "请检查配置", "error");
    } finally {
      if (submit) submit.disabled = false;
    }
  });
  dom.testTranslationButton.addEventListener("click", async () => {
    dom.testTranslationButton.disabled = true;
    dom.testTranslationButton.textContent = "正在测试…";
    try {
      await window.siteNest.testTranslation(translationFormPayload());
      showToast("翻译服务连接成功", "固定测试文本已得到有效响应");
    } catch (error) {
      showToast("翻译服务连接失败", error?.message || "请检查地址、模型与密钥", "error");
    } finally {
      dom.testTranslationButton.disabled = false;
      dom.testTranslationButton.textContent = "测试连接";
    }
  });
  dom.clearTranslationKeyButton.addEventListener("click", async () => {
    try {
      translationStatusCache = await window.siteNest.configureTranslation({
        ...translationFormPayload(),
        apiKey: "",
        clearApiKey: true,
      });
      dom.translationApiKey.value = "";
      renderTranslationSettings();
      showToast("翻译密钥已清除", "安全存储中的 API Key 已删除");
    } catch (error) {
      showToast("无法清除翻译密钥", error?.message || "请稍后重试", "error");
    }
  });
  dom.googleSyncCard.addEventListener("click", () => {
    setGoogleSyncPopoverOpen(!googleSyncPopoverOpen);
  });
  dom.closeGoogleSyncPopover.addEventListener("click", () => {
    setGoogleSyncPopoverOpen(false, { focusCard: true });
  });
  dom.googleSignInButton.addEventListener("click", () => void runGoogleSyncAction("sign-in"));
  dom.googleSyncNowButton.addEventListener("click", () => void runGoogleSyncAction("sync"));
  dom.googleRestoreButton.addEventListener("click", () => void runGoogleSyncAction("restore"));
  dom.googleSignOutButton.addEventListener("click", () => void runGoogleSyncAction("sign-out"));
  dom.workConnectorSettings.addEventListener("click", () => navigateTo("settings"));
  dom.workRefreshTickets.addEventListener("click", () => {
    if (zohoDashboardLoading) void cancelZohoDashboardRefresh();
    else void loadZohoDashboard({ refresh: true });
  });
  document.getElementById("ticketMetricsGrid").addEventListener("click", (event) => {
    const card = event.target.closest("[data-ticket-filter]");
    if (!card) return;
    const requested = card.dataset.ticketFilter;
    activeTicketFilter = activeTicketFilter === requested ? "" : requested;
    renderZohoDashboard();
  });
  dom.zohoConfigForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = document.getElementById("saveZohoConfig");
    submit.disabled = true;
    try {
      const result = await window.siteNest.configureConnector("zoho-desk", {
        displayName: dom.zohoDisplayName.value,
        orgId: dom.zohoOrgId.value,
        apiBase: dom.zohoApiBase.value,
        webBaseUrl: dom.zohoWebBase.value,
        lookbackDays: Number(dom.zohoLookbackDays.value),
        slaWarningHours: Number(dom.zohoSlaWarningHours.value),
      });
      if (!result?.ok) throw new Error(result?.error?.message || "无法保存 Zoho 配置");
      if (result.state) appState = result.state;
      await loadZohoConnectorStatus();
      renderAll();
      showToast("Zoho 配置已保存", "OAuth Client Secret 仍只保存在桌面端安全存储中");
    } catch (error) {
      showToast("无法保存 Zoho 配置", error?.message || "请检查组织 ID 与地址", "error");
    } finally {
      submit.disabled = false;
    }
  });
  dom.connectZohoButton.addEventListener("click", async () => {
    dom.connectZohoButton.disabled = true;
    dom.connectZohoButton.textContent = "等待授权…";
    try {
      const result = await window.siteNest.connectConnector("zoho-desk");
      if (!result?.ok) throw new Error(result?.error?.message || "Zoho 授权未完成");
      await loadZohoConnectorStatus();
      await loadZohoDashboard({ refresh: true });
      showToast("Zoho Desk 已连接", "只读工单数据已开始同步");
    } catch (error) {
      showToast("Zoho Desk 连接失败", error?.message || "请检查 OAuth 配置", "error");
      await loadZohoConnectorStatus({ preserveForm: true });
    } finally {
      dom.connectZohoButton.disabled = false;
      dom.connectZohoButton.textContent = zohoConnectorStatus?.connected ? "重新授权" : "连接 Zoho Desk";
    }
  });
  dom.disconnectZohoButton.addEventListener("click", async () => {
    if (!window.confirm("确定断开 Zoho Desk 吗？\n\n本地安全凭据和工单缓存会被清理，现有网页登录会话不会被清空。")) return;
    try {
      const result = await window.siteNest.disconnectConnector("zoho-desk");
      if (!result?.ok) throw new Error(result?.error?.message || "无法断开 Zoho Desk");
      zohoDashboard = null;
      await loadZohoConnectorStatus();
      renderAll();
      showToast("Zoho Desk 已断开", "网页 Cookie 与已打开会话未被清理");
    } catch (error) {
      showToast("无法断开 Zoho Desk", error?.message || "请稍后重试", "error");
    }
  });
  dom.browserEmptyOpenSites.addEventListener("click", () => navigateTo("sites"));
  dom.browserEmptyAddSite.addEventListener("click", () => openAddSiteModal({
    workspaceId: activeWorkspaceId(),
    siteKind: defaultSiteKind(),
  }));

  document.querySelectorAll(".modal-backdrop").forEach((modal) => {
    modal.addEventListener("mousedown", (event) => {
      if (event.target === modal) closeModal(modal);
    });
  });

  ["heroAddSiteButton", "pageAddSiteButton"].forEach((id) =>
    document.getElementById(id).addEventListener("click", openAddSiteModal),
  );
  ["workAddSiteButton", "workQuickAddSite"].forEach((id) =>
    document.getElementById(id).addEventListener("click", () =>
      openAddSiteModal({ workspaceId: "work", siteKind: "workApp" }),
    ),
  );
  document.getElementById("researchAddSiteButton").addEventListener("click", () =>
    openAddSiteModal({ workspaceId: "research", siteKind: "normal" }),
  );
  document.getElementById("workOpenZoho").addEventListener("click", () => {
    const zohoSite = sitesForWorkspace("work").find(isZohoDeskSite);
    if (zohoSite) {
      void openSite(zohoSite);
      return;
    }
    openAddSiteModal({
      workspaceId: "work",
      siteKind: "workApp",
      name: "Zoho Desk",
      description: "客户支持与工单工作台",
      assistantIds: assistantCache
        .filter((assistant) => String(assistant.id || "").toLowerCase().includes("zoho-desk"))
        .map((assistant) => assistant.id),
    });
    showToast("请添加你的 Zoho Desk 地址", "栖页不会写死组织专属网址");
  });
  document.getElementById("workManageAssistants").addEventListener("click", () => {
    currentAutomationTab = "assistants";
    navigateTo("automations");
  });
  document.getElementById("workViewExecutionLogs").addEventListener("click", () => {
    currentAutomationTab = "logs";
    navigateTo("automations");
  });
  dom.workGlobalSearch.addEventListener("input", renderWorkSearchResults);
  dom.automationTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-automation-tab]");
    if (button) selectAutomationTab(button.dataset.automationTab);
  });
  dom.openPastedUserScript.addEventListener("click", () => openUserScriptInstall("pasted"));
  dom.openRemoteUserScript.addEventListener("click", () => openUserScriptInstall("remoteUrl"));
  dom.importUserScriptFile.addEventListener("click", async () => {
    dom.importUserScriptFile.disabled = true;
    try {
      const review = await window.siteNest.reviewLocalUserScriptFile();
      if (review) renderUserScriptReview(review);
    } catch (error) { showToast("无法读取本地脚本", error?.message || "请检查文件", "error"); }
    finally { dom.importUserScriptFile.disabled = false; }
  });
  dom.userScriptInstallForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.userScriptInstallForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const type = dom.userScriptInstallType.value;
      const review = type === "remoteUrl"
        ? await window.siteNest.reviewRemoteUserScript(dom.userScriptRemoteUrl.value.trim())
        : await window.siteNest.reviewPastedUserScript(dom.userScriptSourceCode.value);
      closeModal(dom.userScriptInstallModal);
      renderUserScriptReview(review);
    } catch (error) { showToast("脚本检查失败", error?.message || "请检查 metadata 和来源", "error"); }
    finally { submit.disabled = false; }
  });
  dom.confirmUserScriptPermissions.addEventListener("change", () => {
    const compatible = pendingUserScriptReview?.compatibility?.compatible === true;
    const needsChange = !pendingUserScriptReview?.updateOf || pendingUserScriptReview?.changed !== false;
    dom.confirmUserScriptInstall.disabled = !dom.confirmUserScriptPermissions.checked || !compatible || !needsChange;
  });
  dom.confirmUserScriptInstall.addEventListener("click", async () => {
    if (!pendingUserScriptReview?.reviewToken || !dom.confirmUserScriptPermissions.checked) return;
    dom.confirmUserScriptInstall.disabled = true;
    try {
      const result = await window.siteNest.confirmUserScriptInstall(pendingUserScriptReview.reviewToken);
      applyUserScriptSnapshot(result);
      closeModal(dom.userScriptReviewModal);
      showToast(pendingUserScriptReview.updateOf ? "脚本已更新" : "脚本已安装并保持停用", result.installed?.name || "用户脚本");
      pendingUserScriptReview = null;
    } catch (error) { showToast("无法安装脚本", error?.message || "请重新检查", "error"); }
    finally { dom.confirmUserScriptInstall.disabled = false; }
  });
  dom.runRestoreCopyScript.addEventListener("click", () => void runRestoreCopyScript());
  dom.scanPageResources.addEventListener("click", async () => {
    dom.scanPageResources.disabled = true;
    try { renderPageResources(await window.siteNest.scanPageResources()); }
    catch (error) { showToast("页面资源扫描失败", error?.message || "请稍后重试", "error"); }
    finally { dom.scanPageResources.disabled = false; }
  });
  dom.detectNetworkResources.addEventListener("click", async () => {
    dom.detectNetworkResources.disabled = true;
    try {
      const result = pageResourceState.detecting
        ? await window.siteNest.stopPageResourceNetworkDetection()
        : await window.siteNest.startPageResourceNetworkDetection();
      renderPageResources(result);
      showToast(pageResourceState.detecting ? "网络资源检测已开始" : "网络资源检测已停止", pageResourceState.detecting ? "最多运行 60 秒，仅记录 URL、MIME 和大小" : "监听器已经注销");
    } catch (error) { showToast("网络资源检测失败", error?.message || "请稍后重试", "error"); }
    finally { dom.detectNetworkResources.disabled = false; }
  });
  dom.refreshExecutionLogs.addEventListener("click", () => void loadExecutionLogs());
  [
    "pageImportButton",
    "settingsImportButton",
  ].forEach((id) =>
    document.getElementById(id).addEventListener("click", () => void openImportModal()),
  );
  dom.clearImportedBookmarks.addEventListener("click", async () => {
    if (!window.confirm("确定清理栖页中的 Chrome 书签导入记录吗？\n\n不会修改 Chrome 或 Google 云端书签。")) return;
    try {
      const result = await window.siteNest.clearChromeBookmarks();
      appState = result.state;
      chromeBookmarkReadState = "idle";
      chromeBookmarkReadError = "";
      renderAll();
      showToast("Chrome 书签导入记录已清理", "Chrome 和 Google 云端书签未被修改");
    } catch (error) {
      showToast("无法清理导入记录", error?.message || "请稍后重试", "error");
    }
  });

  document.getElementById("openFirstSiteButton").addEventListener("click", () => {
    const [firstSite] = recentSites();
    if (firstSite) void openSite(firstSite);
    else openAddSiteModal();
  });

  dom.addSiteForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = dom.addSiteForm.querySelector('button[type="submit"]');
    const formData = new FormData(dom.addSiteForm);
    const editing = editingSiteId;
    submit.disabled = true;
    try {
      const input = {
        name: formData.get("name"),
        url: formData.get("url"),
        color: formData.get("color"),
        description: formData.get("description"),
        workspaceId: formData.get("workspaceId") || activeWorkspaceId(),
        siteKind: formData.get("siteKind") || defaultSiteKind(formData.get("workspaceId")),
        openMode: formData.get("openMode") === "external" ? "external" : "internal",
        pinned: dom.sitePinnedInput.checked,
        assistantIds: formData.getAll("assistantIds").map(String),
      };
      const result = editing
        ? await window.siteNest.updateSite({ id: editing, ...input })
        : await window.siteNest.addSite(input);
      appState = result.state;
      renderAll();
      closeModal(dom.addSiteModal, false);
      editingSiteId = null;
      if (editing) {
        showToast("站点已更新", result.site.name);
      } else {
        showToast(
          result.existed ? "这个网站已经在列表中" : "网站已添加",
          result.site.name,
        );
        await openSite(result.site);
      }
    } catch (error) {
      showToast(editing ? "无法保存站点" : "无法添加网站", error?.message || "请检查网址格式", "error");
    } finally {
      submit.disabled = false;
    }
  });

  dom.siteWorkspaceInput.addEventListener("change", () => {
    if (!editingSiteId) dom.siteKindInput.value = defaultSiteKind(dom.siteWorkspaceInput.value);
  });

  document.getElementById("siteUrlInput").addEventListener("blur", () => {
    const nameInput = document.getElementById("siteNameInput");
    const urlInput = document.getElementById("siteUrlInput");
    if (nameInput.value.trim() || !urlInput.value.trim()) return;
    try {
      const value = /^[a-z][a-z\d+.-]*:/i.test(urlInput.value)
        ? urlInput.value
        : `https://${urlInput.value}`;
      nameInput.value = hostFromUrl(value);
    } catch {
      // Let the main process return the precise validation message on submit.
    }
  });

  dom.confirmImportButton.addEventListener("click", async () => {
    if (!selectedChromeProfile) return;
    dom.confirmImportButton.disabled = true;
    dom.confirmImportButton.textContent = "正在导入…";
    chromeBookmarkReadState = "reading";
    chromeBookmarkReadError = "";
    updateBookmarkSummary();
    try {
      const result = await window.siteNest.importChromeBookmarks(selectedChromeProfile);
      appState = result.state;
      chromeBookmarkReadState = "idle";
      renderAll();
      closeModal(dom.importModal);
      showToast(
        "Chrome 书签已更新",
        `扫描 ${result.stats.scanned} 个，新增 ${result.stats.added} 个，本地共 ${result.stats.total} 个`,
      );
    } catch (error) {
      chromeBookmarkReadState = "error";
      chromeBookmarkReadError = error?.message || "Chrome 书签文件暂时不可读";
      updateBookmarkSummary();
      showToast("导入失败", error?.message || "Chrome 书签文件暂时不可读", "error");
    } finally {
      dom.confirmImportButton.disabled =
        !selectedChromeProfile || selectedChromeProfileBookmarkCount === 0;
      dom.confirmImportButton.replaceChildren(
        createIconElement("download"),
        document.createTextNode("开始导入"),
      );
    }
  });

  dom.bookmarkSearch.addEventListener("input", () => {
    bookmarkRenderLimit = 100;
    renderBookmarks();
  });
  dom.bookmarkFolder.addEventListener("change", () => {
    bookmarkRenderLimit = 100;
    renderBookmarks();
  });
  dom.loadMoreBookmarks.addEventListener("click", () => {
    bookmarkRenderLimit += 100;
    renderBookmarks();
  });
  dom.siteSearch.addEventListener("input", renderSiteLibrary);
  dom.siteFilter.addEventListener("change", renderSiteLibrary);
  dom.siteWorkspaceFilter.addEventListener("change", renderSiteLibrary);

  dom.browserBack.addEventListener("click", () => void window.siteNest.browserAction("back"));
  dom.browserForward.addEventListener("click", () =>
    void window.siteNest.browserAction("forward"),
  );
  dom.browserReload.addEventListener("click", () =>
    void window.siteNest.browserAction(browserSnapshot.loading ? "stop" : "reload"),
  );
  dom.translatePageButton.addEventListener("click", async () => {
    if (typeof window.siteNest?.showTranslationPageMenu !== "function") return;
    try {
      await window.siteNest.showTranslationPageMenu();
    } catch (error) {
      showToast("无法打开翻译菜单", error?.message || "请稍后重试", "error");
    }
  });
  document.getElementById("zoomOut").addEventListener("click", () =>
    void window.siteNest.browserAction("zoom-out"),
  );
  document.getElementById("zoomIn").addEventListener("click", () =>
    void window.siteNest.browserAction("zoom-in"),
  );
  dom.zoomLabel.addEventListener("click", () =>
    void window.siteNest.browserAction("zoom-reset"),
  );
  document.getElementById("openExternal").addEventListener("click", () =>
    void window.siteNest.browserAction("external"),
  );
  dom.duplicateCurrentTab.addEventListener("click", () => {
    const tabId = dom.duplicateCurrentTab.dataset.tabId;
    if (tabId) void duplicateExistingBrowserTab(tabId);
  });
  dom.detachCurrentTab.addEventListener("click", () => {
    const tabId = dom.detachCurrentTab.dataset.tabId;
    if (!tabId) return;
    if (dom.detachCurrentTab.dataset.tabAction === "reattach") {
      void reattachBrowserTab(tabId);
    } else {
      void detachBrowserTabToWindow(tabId);
    }
  });
  dom.pageActionsButton.addEventListener("click", () => {
    const next = !pageActionPanelOpen;
    setPageActionPanelOpen(next);
    if (currentZohoTicketId()) void rememberContextAssistantCollapsed(!next);
  });
  dom.closePageActions.addEventListener("click", () => {
    setPageActionPanelOpen(false);
    if (currentZohoTicketId()) void rememberContextAssistantCollapsed(true);
    dom.pageActionsButton.focus();
  });
  dom.copyZohoTicketNumber.addEventListener("click", async () => {
    const value = zohoTicketContext?.ticketNumber || currentZohoTicketId();
    if (!value) return;
    await navigator.clipboard.writeText(String(value));
    showToast("工单号已复制", `#${value}`);
  });
  dom.copyZohoTicketLink.addEventListener("click", async () => {
    const value = zohoTicketContext?.webUrl || browserSnapshot.url;
    if (!value) return;
    await navigator.clipboard.writeText(value);
    showToast("工单链接已复制", hostFromUrl(value));
  });
  dom.openZohoTicketExternal.addEventListener("click", () => {
    const value = zohoTicketContext?.webUrl || browserSnapshot.url;
    if (value) void window.siteNest.openExternal(value);
  });
  dom.siteLoginButton.addEventListener("click", async () => {
    try {
      await window.siteNest.browserAction("site-login");
    } catch (error) {
      showToast("无法打开登录页", error?.message || "请稍后重试", "error");
    }
  });
  dom.repairNetworkButton.addEventListener("click", async () => {
    dom.repairNetworkButton.disabled = true;
    try {
      await window.siteNest.browserAction("repair-network");
      showToast("正在修复 NodeSeek 网络", "已重置缓存、DNS 和连接，并重新加载页面");
    } catch (error) {
      showToast("网络修复失败", error?.message || "请稍后重试", "error");
    } finally {
      dom.repairNetworkButton.disabled = false;
    }
  });
  dom.resetNodeSeekSession.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "确定重置 NodeSeek 防护状态吗？\n\n这只会清理栖页内 NodeSeek 的 Cloudflare 防护状态与站点缓存，会保留 NodeSeek 账号登录，不影响 Chrome 或其他网站。",
    );
    if (!confirmed) return;
    dom.resetNodeSeekSession.disabled = true;
    try {
      await window.siteNest.browserAction("reset-site-session");
      showToast("NodeSeek 防护状态已重置", "账号登录已保留，正在重新加载页面");
    } catch (error) {
      showToast("无法重置防护状态", error?.message || "请稍后重试", "error");
    } finally {
      dom.resetNodeSeekSession.disabled = false;
    }
  });
  dom.repairSapSession.addEventListener("click", async () => {
    const confirmed = window.confirm(
      "确定修复栖页内的 SAP 登录会话吗？\n\n这会清除栖页内 SAP 相关网站的 Cookie 与站点缓存，并退出栖页内的 SAP 账号；不会影响 Chrome、NodeSeek、奶昔或其他网站。",
    );
    if (!confirmed) return;
    dom.repairSapSession.disabled = true;
    try {
      await window.siteNest.browserAction("repair-sap-session");
      showToast("SAP 会话已修复", "正在重新打开刚才的搜索结果");
    } catch (error) {
      showToast("无法修复 SAP 会话", error?.message || "请稍后重试", "error");
    } finally {
      dom.repairSapSession.disabled = false;
    }
  });
  dom.addressInput.addEventListener("keydown", async (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    try {
      await window.siteNest.browserAction("navigate", dom.addressInput.value);
      dom.addressInput.blur();
    } catch (error) {
      showToast("网址无法打开", error?.message || "请检查网址格式", "error");
    }
  });
  dom.addressInput.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    void window.siteNest.showAddressContextMenu();
  });

  dom.runNaixiAutomation.addEventListener("click", async () => {
    dom.runNaixiAutomation.disabled = true;
    try {
      const result = await window.siteNest.runNaixiCheckin();
      renderNaixiAutomation(result);
      if (result.status === "success") {
        showToast("奶昔签到已完成", result.message);
      } else {
        showToast("奶昔签到未完成", result.message, "error");
      }
    } catch (error) {
      showToast("自动签到失败", error?.message || "请打开签到页检查登录状态", "error");
    } finally {
      const status = appState.automations?.naixi;
      dom.runNaixiAutomation.disabled = status?.status === "running";
    }
  });
  dom.naixiAutoEnabled.addEventListener("change", async () => {
    try {
      const result = await window.siteNest.updateNaixiAutomation({
        enabled: dom.naixiAutoEnabled.checked,
      });
      renderNaixiAutomation(result);
      showToast(result.enabled ? "自动签到已开启" : "自动签到已关闭");
    } catch (error) {
      showToast("无法更新自动签到", error?.message || "请稍后重试", "error");
    }
  });
  dom.naixiScheduleTime.addEventListener("change", async () => {
    try {
      const result = await window.siteNest.updateNaixiAutomation({
        time: dom.naixiScheduleTime.value,
      });
      renderNaixiAutomation(result);
      showToast("签到时间已更新", `每天 ${result.time}（栖页运行时）`);
    } catch (error) {
      showToast("无法更新时间", error?.message || "请输入有效时间", "error");
    }
  });

  document.getElementById("openDataFolderButton").addEventListener("click", async () => {
    try {
      const result = await window.siteNest.openDataFolder();
      if (!result.ok) throw new Error(result.error);
    } catch (error) {
      showToast("无法打开数据目录", error?.message || "请稍后重试", "error");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!dom.appContextMenu.hidden) {
        closeSiteContextMenu();
        return;
      }
      if (googleSyncPopoverOpen) {
        setGoogleSyncPopoverOpen(false, { focusCard: true });
        return;
      }
      const modal = document.querySelector(".modal-backdrop.is-open");
      if (modal) {
        closeModal(modal);
        return;
      } else if (pageActionPanelOpen) {
        setPageActionPanelOpen(false);
        if (currentZohoTicketId()) void rememberContextAssistantCollapsed(true);
        dom.pageActionsButton.focus();
        return;
      }
      if (currentSite) {
        event.preventDefault();
        void window.siteNest.browserAction("stop");
      }
      return;
    }
    if (!currentSite) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "l") {
      event.preventDefault();
      dom.addressInput.focus();
      dom.addressInput.select();
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "r") {
      event.preventDefault();
      void window.siteNest.browserAction("reload");
    } else if (event.key === "F5") {
      event.preventDefault();
      void window.siteNest.browserAction("reload");
    } else if (event.altKey && event.key === "ArrowLeft") {
      event.preventDefault();
      void window.siteNest.browserAction("back");
    } else if (event.altKey && event.key === "ArrowRight") {
      event.preventDefault();
      void window.siteNest.browserAction("forward");
    }
  });

  document.addEventListener("contextmenu", (event) => {
    if (!event.target.closest("[data-site-id], .site-library-card, .quick-card, .work-app-card, .research-site-card")) {
      closeSiteContextMenu();
    }
  });
  window.addEventListener("blur", closeSiteContextMenu);
  window.addEventListener("resize", closeSiteContextMenu);
  document.addEventListener("scroll", closeSiteContextMenu, true);

  new ResizeObserver(syncBrowserBounds).observe(dom.webviewFrame);
  window.siteNest?.onBrowserState(handleBrowserState);
  window.siteNest?.onBrowserNotice?.((notice) => {
    showToast(
      notice?.tone === "error" ? "浏览安全提示" : "浏览提示",
      notice?.message || "页面操作已处理",
      notice?.tone === "error" ? "error" : "info",
    );
  });
  window.siteNest?.onBrowserLifecycle?.((snapshot) => {
    browserLifecycleState = snapshot;
    renderBrowserMemorySettings();
  });
  window.siteNest?.onPageResourcesChanged?.((snapshot) => renderPageResources(snapshot));
  window.siteNest?.onOpenPageActions?.(() => {
    setPageActionPanelOpen(true);
  });
  window.siteNest?.onOpenTranslationSettings?.(() => {
    navigateTo("settings");
    window.setTimeout(() => {
      dom.translationSettings?.scrollIntoView({ block: "center", behavior: "smooth" });
      dom.translationSettings?.focus({ preventScroll: true });
    }, 80);
  });
  window.siteNest?.onTasksChanged?.((snapshot) => applyTaskSnapshot(snapshot));
  window.siteNest?.onOpenTask?.(({ taskId, view }) => {
    currentTaskView = view || "week";
    navigateTo("plan");
    if (taskId === "new") openTaskModal();
    else if (taskId) {
      const task = taskForId(taskId);
      if (task) openTaskModal(task);
    }
  });
  window.siteNest?.onUserScriptCommandsChanged?.(() => {
    if (pageActionPanelOpen) void refreshPageUserScriptCommands();
  });
  window.siteNest?.onUserScriptsChanged?.((snapshot) => applyUserScriptSnapshot(snapshot));
  window.siteNest?.onUserScriptExecution?.(() => {
    if (currentAutomationTab === "scripts") void loadUserScripts();
  });
  window.siteNest?.onAutomationStatus(({ naixi }) => renderNaixiAutomation(naixi));
}

async function initialize() {
  mountIcons();
  renderBrowserTabs(browserSnapshot);
  renderGoogleSync();
  applySidebarCollapsed(readSidebarCollapsedPreference(), { persist: false });
  bindEvents();
  try {
    appState = await window.siteNest.getState();
    desiredWorkspaceId = activeWorkspaceId();
    renderAll();
    await loadGoogleSyncStatus();
    await loadTranslationStatus();
    await loadTasks();
    await loadUserScripts();
    await loadBrowserLifecycle();
    await loadZohoConnectorStatus();
    if (activeWorkspaceId() === "work") void loadZohoDashboard();
    const persistedBrowser = appState.workspaceBrowserStates?.[activeWorkspaceId()];
    if (
      (persistedBrowser?.currentURL || persistedBrowser?.tabs?.length) &&
      typeof window.siteNest?.setActiveWorkspace === "function"
    ) {
      const restored = await window.siteNest.setActiveWorkspace(activeWorkspaceId());
      applyReturnedState(restored);
      desiredWorkspaceId = activeWorkspaceId();
      renderAll();
      if (!restoreWorkspaceBrowserPresentation(restored?.browserState)) {
        clearWorkspaceBrowserPresentation(activeWorkspaceId(), { showHome: true });
      }
    }
    await loadSystemInfo();
    await loadAssistants();
    if (currentAutomationTab === "logs") await loadExecutionLogs();
  } catch (error) {
    showToast("应用数据初始化失败", error?.message || "请重新启动栖页", "error");
  }
}

void initialize();
