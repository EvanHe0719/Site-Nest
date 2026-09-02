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
  volume: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a8 8 0 0 1 0 11"/></svg>',
  muted: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="m17 10 5 5M22 10l-5 5"/></svg>',
  more: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2.8v4.4M17 2.8v4.4M3 9h18M7 13h.01M12 13h.01M17 13h.01M7 17h.01M12 17h.01"/></svg>',
  code: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5M14 4l-4 16"/></svg>',
  tag: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 5.5v5.2L13 20.2a1.8 1.8 0 0 0 2.5 0l4.7-4.7a1.8 1.8 0 0 0 0-2.5L10.7 3.5H5.5a2 2 0 0 0-2 2Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
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
  brandVersion: document.getElementById("brandVersion"),
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
  browserEmptySearchForm: document.getElementById("browserEmptySearchForm"),
  browserEmptySearchInput: document.getElementById("browserEmptySearchInput"),
  browserEmptyEngineIcon: document.getElementById("browserEmptyEngineIcon"),
  browserEmptyRecent: document.getElementById("browserEmptyRecent"),
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
  globalSearchTrigger: document.getElementById("globalSearchTrigger"),
  globalCompanionTrigger: document.getElementById("globalCompanionTrigger"),
  globalSearchPalette: document.getElementById("globalSearchPalette"),
  globalSearchInput: document.getElementById("globalSearchInput"),
  globalSearchEngine: document.getElementById("globalSearchEngine"),
  globalSearchResults: document.getElementById("globalSearchResults"),
  closeGlobalSearch: document.getElementById("closeGlobalSearch"),
  googleSyncArea: document.getElementById("googleSyncArea"),
  googleSyncCard: document.getElementById("googleSyncCard"),
  googleSyncCardTitle: document.getElementById("googleSyncCardTitle"),
  googleSyncCardSubtitle: document.getElementById("googleSyncCardSubtitle"),
  googleSyncStateDot: document.getElementById("googleSyncStateDot"),
  googleSyncPopover: document.getElementById("googleSyncPopover"),
  closeGoogleSyncPopover: document.getElementById("closeGoogleSyncPopover"),
  googleSyncAccount: document.getElementById("googleSyncAccount"),
  googleIdentityStatus: document.getElementById("googleIdentityStatus"),
  googleDriveStatus: document.getElementById("googleDriveStatus"),
  googleSyncLastSync: document.getElementById("googleSyncLastSync"),
  googleSyncErrorTitle: document.getElementById("googleSyncErrorTitle"),
  googleSyncError: document.getElementById("googleSyncError"),
  googleSignInButton: document.getElementById("googleSignInButton"),
  googleSignInButtonLabel: document.getElementById("googleSignInButtonLabel"),
  googleSyncNowButton: document.getElementById("googleSyncNowButton"),
  googleRestoreButton: document.getElementById("googleRestoreButton"),
  googleTestConnectionButton: document.getElementById("googleTestConnectionButton"),
  googleSignOutButton: document.getElementById("googleSignOutButton"),
  googleSyncConflict: document.getElementById("googleSyncConflict"),
  googleSyncModuleSettings: document.getElementById("googleSyncModuleSettings"),
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
  newBrowserTabButton: document.getElementById("newBrowserTabButton"),
  dataStatusButton: document.getElementById("dataStatusButton"),
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
  siteTagIds: document.getElementById("siteTagIds"),
  siteAssistantOptions: document.getElementById("siteAssistantOptions"),
  chromeProfileList: document.getElementById("chromeProfileList"),
  confirmImportButton: document.getElementById("confirmImportButton"),
  importProfileHint: document.getElementById("importProfileHint"),
  pageImportButton: document.getElementById("pageImportButton"),
  settingsImportButton: document.getElementById("settingsImportButton"),
  dataPathDisplay: document.getElementById("dataPathDisplay"),
  openDataFolderButton: document.getElementById("openDataFolderButton"),
  settingsNavigation: document.getElementById("settingsNavigation"),
  settingsSectionSelect: document.getElementById("settingsSectionSelect"),
  settingsPanelHost: document.getElementById("settingsPanelHost"),
  settingsSectionKicker: document.getElementById("settingsSectionKicker"),
  settingsSectionTitle: document.getElementById("settingsSectionTitle"),
  settingsSectionDescription: document.getElementById("settingsSectionDescription"),
  settingsSearchInput: document.getElementById("settingsSearchInput"),
  settingsSearchResults: document.getElementById("settingsSearchResults"),
  shortcutSearchInput: document.getElementById("shortcutSearchInput"),
  shortcutCategoryFilter: document.getElementById("shortcutCategoryFilter"),
  shortcutModifiedOnly: document.getElementById("shortcutModifiedOnly"),
  shortcutPlatformStatus: document.getElementById("shortcutPlatformStatus"),
  shortcutSummary: document.getElementById("shortcutSummary"),
  shortcutGroupList: document.getElementById("shortcutGroupList"),
  checkShortcutConflicts: document.getElementById("checkShortcutConflicts"),
  resetShortcutCategory: document.getElementById("resetShortcutCategory"),
  resetAllShortcuts: document.getElementById("resetAllShortcuts"),
  contentTagsSettingsCard: document.getElementById("contentTagsSettingsCard"),
  contentTagTotal: document.getElementById("contentTagTotal"),
  contentTagsStatus: document.getElementById("contentTagsStatus"),
  contentTagGroupList: document.getElementById("contentTagGroupList"),
  uiActionAuditStatus: document.getElementById("uiActionAuditStatus"),
  uiActionAuditMetrics: document.getElementById("uiActionAuditMetrics"),
  uiActionAuditScope: document.getElementById("uiActionAuditScope"),
  uiActionAuditFindings: document.getElementById("uiActionAuditFindings"),
  refreshUIActionAudit: document.getElementById("refreshUIActionAudit"),
  addContentTagButton: document.getElementById("addContentTagButton"),
  addContentTagGroupButton: document.getElementById("addContentTagGroupButton"),
  mergeContentTagsButton: document.getElementById("mergeContentTagsButton"),
  undoContentTagMergeButton: document.getElementById("undoContentTagMergeButton"),
  defaultSearchEngineSelect: document.getElementById("defaultSearchEngineSelect"),
  defaultSearchEngineStatus: document.getElementById("defaultSearchEngineStatus"),
  saveSearchHistorySetting: document.getElementById("saveSearchHistorySetting"),
  clearSearchHistoryButton: document.getElementById("clearSearchHistoryButton"),
  searchHistoryList: document.getElementById("searchHistoryList"),
  googleSettingsStatus: document.getElementById("googleSettingsStatus"),
  openGoogleSyncSettings: document.getElementById("openGoogleSyncSettings"),
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
  usageHomeCard: document.getElementById("usageHomeCard"),
  usageHomeStats: document.getElementById("usageHomeStats"),
  usageHomeHeatmap: document.getElementById("usageHomeHeatmap"),
  openUsageDetails: document.getElementById("openUsageDetails"),
  habitPanel: document.getElementById("habitPanel"),
  habitTodaySummary: document.getElementById("habitTodaySummary"),
  habitAddButton: document.getElementById("habitAddButton"),
  openUsageTrackButton: document.getElementById("openUsageTrackButton"),
  usageDetailCard: document.getElementById("usageDetailCard"),
  usageTrackingToggle: document.getElementById("usageTrackingToggle"),
  clearUsageStats: document.getElementById("clearUsageStats"),
  usageDetailStats: document.getElementById("usageDetailStats"),
  usageDetailHeatmap: document.getElementById("usageDetailHeatmap"),
  habitGrid: document.getElementById("habitGrid"),
  timelinePanel: document.getElementById("timelinePanel"),
  timelineYearInput: document.getElementById("timelineYearInput"),
  timelineTrackSwitch: document.getElementById("timelineTrackSwitch"),
  timelineTypeFilter: document.getElementById("timelineTypeFilter"),
  timelineSearchInput: document.getElementById("timelineSearchInput"),
  timelineViewSwitch: document.getElementById("timelineViewSwitch"),
  timelineReviewButton: document.getElementById("timelineReviewButton"),
  timelineExportMarkdown: document.getElementById("timelineExportMarkdown"),
  timelineExportJson: document.getElementById("timelineExportJson"),
  timelineExportSvg: document.getElementById("timelineExportSvg"),
  timelineBackToYear: document.getElementById("timelineBackToYear"),
  timelineAddButton: document.getElementById("timelineAddButton"),
  timelineMonthNav: document.getElementById("timelineMonthNav"),
  timelineResultSummary: document.getElementById("timelineResultSummary"),
  timelineCanvas: document.getElementById("timelineCanvas"),
  timelineList: document.getElementById("timelineList"),
  timelineEventModal: document.getElementById("timelineEventModal"),
  timelineEventForm: document.getElementById("timelineEventForm"),
  timelineEventModalTitle: document.getElementById("timelineEventModalTitle"),
  timelineEventId: document.getElementById("timelineEventId"),
  timelineEventTitle: document.getElementById("timelineEventTitle"),
  timelineEventTrack: document.getElementById("timelineEventTrack"),
  timelineEventWorkspace: document.getElementById("timelineEventWorkspace"),
  timelineEventType: document.getElementById("timelineEventType"),
  timelineDatePrecision: document.getElementById("timelineDatePrecision"),
  timelineStartDate: document.getElementById("timelineStartDate"),
  timelineEndDate: document.getElementById("timelineEndDate"),
  timelineImportance: document.getElementById("timelineImportance"),
  timelineImpactDirection: document.getElementById("timelineImpactDirection"),
  timelineImpactLevel: document.getElementById("timelineImpactLevel"),
  timelineOngoing: document.getElementById("timelineOngoing"),
  timelineSummary: document.getElementById("timelineSummary"),
  timelineBackground: document.getElementById("timelineBackground"),
  timelineAction: document.getElementById("timelineAction"),
  timelineResult: document.getElementById("timelineResult"),
  timelineImpact: document.getElementById("timelineImpact"),
  timelineEvidence: document.getElementById("timelineEvidence"),
  timelineTags: document.getElementById("timelineTags"),
  timelineTagIds: document.getElementById("timelineTagIds"),
  timelineSourceType: document.getElementById("timelineSourceType"),
  timelineSourceId: document.getElementById("timelineSourceId"),
  timelineSourceTitle: document.getElementById("timelineSourceTitle"),
  timelineSourceUrl: document.getElementById("timelineSourceUrl"),
  timelineSourceHostname: document.getElementById("timelineSourceHostname"),
  timelineRelatedTaskIds: document.getElementById("timelineRelatedTaskIds"),
  timelineSourcePreview: document.getElementById("timelineSourcePreview"),
  deleteTimelineEventButton: document.getElementById("deleteTimelineEventButton"),
  timelineReviewModal: document.getElementById("timelineReviewModal"),
  timelineReviewTitle: document.getElementById("timelineReviewTitle"),
  timelineReviewStats: document.getElementById("timelineReviewStats"),
  timelineReviewText: document.getElementById("timelineReviewText"),
  timelineCopyReview: document.getElementById("timelineCopyReview"),
  timelineReviewExportMarkdown: document.getElementById("timelineReviewExportMarkdown"),
  timelineReviewExportJson: document.getElementById("timelineReviewExportJson"),
  taskModal: document.getElementById("taskModal"),
  tabGroupModal: document.getElementById("tabGroupModal"),
  tabGroupModalTitle: document.getElementById("tabGroupModalTitle"),
  tabGroupForm: document.getElementById("tabGroupForm"),
  tabGroupId: document.getElementById("tabGroupId"),
  tabGroupWorkspaceId: document.getElementById("tabGroupWorkspaceId"),
  tabGroupTabIds: document.getElementById("tabGroupTabIds"),
  tabGroupName: document.getElementById("tabGroupName"),
  tabGroupColor: document.getElementById("tabGroupColor"),
  tabGroupIcon: document.getElementById("tabGroupIcon"),
  duplicateTabsModal: document.getElementById("duplicateTabsModal"),
  duplicateTabsForm: document.getElementById("duplicateTabsForm"),
  duplicateTabsGroups: document.getElementById("duplicateTabsGroups"),
  duplicateTabsSimilar: document.getElementById("duplicateTabsSimilar"),
  resolveDuplicateTabsButton: document.getElementById("resolveDuplicateTabsButton"),
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
  taskTagIds: document.getElementById("taskTagIds"),
  deleteTaskButton: document.getElementById("deleteTaskButton"),
  habitModal: document.getElementById("habitModal"),
  habitModalTitle: document.getElementById("habitModalTitle"),
  habitForm: document.getElementById("habitForm"),
  habitId: document.getElementById("habitId"),
  habitName: document.getElementById("habitName"),
  habitDescription: document.getElementById("habitDescription"),
  habitWorkspace: document.getElementById("habitWorkspace"),
  habitStatus: document.getElementById("habitStatus"),
  habitFrequency: document.getElementById("habitFrequency"),
  habitWeeklyTargetField: document.getElementById("habitWeeklyTargetField"),
  habitWeeklyTarget: document.getElementById("habitWeeklyTarget"),
  habitWeekdays: document.getElementById("habitWeekdays"),
  habitStartDate: document.getElementById("habitStartDate"),
  habitEndDateField: document.getElementById("habitEndDateField"),
  habitEndDate: document.getElementById("habitEndDate"),
  habitReminderTime: document.getElementById("habitReminderTime"),
  habitTargetType: document.getElementById("habitTargetType"),
  habitTargetValueField: document.getElementById("habitTargetValueField"),
  habitTargetValue: document.getElementById("habitTargetValue"),
  habitPartialReward: document.getElementById("habitPartialReward"),
  habitTagIds: document.getElementById("habitTagIds"),
  deleteHabitButton: document.getElementById("deleteHabitButton"),
  habitCheckInModal: document.getElementById("habitCheckInModal"),
  habitCheckInTitle: document.getElementById("habitCheckInTitle"),
  habitCheckInForm: document.getElementById("habitCheckInForm"),
  habitCheckInHabitId: document.getElementById("habitCheckInHabitId"),
  habitCheckInDate: document.getElementById("habitCheckInDate"),
  habitCheckInState: document.getElementById("habitCheckInState"),
  habitCheckInNote: document.getElementById("habitCheckInNote"),
  deleteHabitCheckInButton: document.getElementById("deleteHabitCheckInButton"),
  companionSettingsStatus: document.getElementById("companionSettingsStatus"),
  companionEnabledSetting: document.getElementById("companionEnabledSetting"),
  companionFocusSeconds: document.getElementById("companionFocusSeconds"),
  companionWeatherEnabled: document.getElementById("companionWeatherEnabled"),
  companionWeatherCity: document.getElementById("companionWeatherCity"),
  companionWeatherPollMinutes: document.getElementById("companionWeatherPollMinutes"),
  companionEyeRestEnabled: document.getElementById("companionEyeRestEnabled"),
  companionEyeRestMinutes: document.getElementById("companionEyeRestMinutes"),
  companionWaterEnabled: document.getElementById("companionWaterEnabled"),
  companionWaterMinutes: document.getElementById("companionWaterMinutes"),
  companionMovementEnabled: document.getElementById("companionMovementEnabled"),
  companionMovementMinutes: document.getElementById("companionMovementMinutes"),
  companionQuietEnabled: document.getElementById("companionQuietEnabled"),
  companionQuietStart: document.getElementById("companionQuietStart"),
  companionQuietEnd: document.getElementById("companionQuietEnd"),
  saveCompanionSettings: document.getElementById("saveCompanionSettings"),
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
  translationShortPronunciation: document.getElementById("translationShortPronunciation"),
  translationShortPronunciationMax: document.getElementById("translationShortPronunciationMax"),
  testTranslationButton: document.getElementById("testTranslationButton"),
  clearTranslationKeyButton: document.getElementById("clearTranslationKeyButton"),
  zohoConfigForm: null,
  zohoDisplayName: null,
  zohoOrgId: null,
  zohoApiBase: null,
  zohoWebBase: null,
  zohoLookbackDays: null,
  zohoSlaWarningHours: null,
  zohoOAuthConfigState: null,
  zohoOAuthConfigPath: null,
  zohoSettingsStatus: document.getElementById("zohoSettingsStatus"),
  connectZohoButton: null,
  disconnectZohoButton: null,
  zohoConnectorCard: document.getElementById("zohoConnectorCard"),
  zohoConnectorSummary: document.getElementById("zohoConnectorSummary"),
  zohoConfigMount: document.getElementById("zohoConfigMount"),
  zohoConfigTemplate: document.getElementById("zohoConfigTemplate"),
  toggleZohoConfig: document.getElementById("toggleZohoConfig"),
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
  openCreatedUserScript: document.getElementById("openCreatedUserScript"),
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
  userScriptReviewChangesSection: document.getElementById("userScriptReviewChangesSection"),
  userScriptReviewChanges: document.getElementById("userScriptReviewChanges"),
  userScriptCompatibility: document.getElementById("userScriptCompatibility"),
  userScriptSourcePreview: document.getElementById("userScriptSourcePreview"),
  confirmUserScriptPermissions: document.getElementById("confirmUserScriptPermissions"),
  confirmUserScriptInstall: document.getElementById("confirmUserScriptInstall"),
  contentTagGroupModal: document.getElementById("contentTagGroupModal"),
  contentTagGroupModalTitle: document.getElementById("contentTagGroupModalTitle"),
  contentTagGroupForm: document.getElementById("contentTagGroupForm"),
  contentTagGroupId: document.getElementById("contentTagGroupId"),
  contentTagGroupName: document.getElementById("contentTagGroupName"),
  contentTagGroupIcon: document.getElementById("contentTagGroupIcon"),
  contentTagGroupSortOrder: document.getElementById("contentTagGroupSortOrder"),
  deleteContentTagGroupButton: document.getElementById("deleteContentTagGroupButton"),
  contentTagModal: document.getElementById("contentTagModal"),
  contentTagModalTitle: document.getElementById("contentTagModalTitle"),
  contentTagForm: document.getElementById("contentTagForm"),
  contentTagId: document.getElementById("contentTagId"),
  contentTagName: document.getElementById("contentTagName"),
  contentTagGroup: document.getElementById("contentTagGroup"),
  contentTagAccent: document.getElementById("contentTagAccent"),
  contentTagDescription: document.getElementById("contentTagDescription"),
  deleteContentTagButton: document.getElementById("deleteContentTagButton"),
  contentTagAliasModal: document.getElementById("contentTagAliasModal"),
  contentTagAliasModalTitle: document.getElementById("contentTagAliasModalTitle"),
  contentTagAliasForm: document.getElementById("contentTagAliasForm"),
  contentTagAliasId: document.getElementById("contentTagAliasId"),
  contentTagAliasTag: document.getElementById("contentTagAliasTag"),
  contentTagAliasName: document.getElementById("contentTagAliasName"),
  deleteContentTagAliasButton: document.getElementById("deleteContentTagAliasButton"),
  contentTagMergeModal: document.getElementById("contentTagMergeModal"),
  contentTagMergeForm: document.getElementById("contentTagMergeForm"),
  contentTagMergeTarget: document.getElementById("contentTagMergeTarget"),
  contentTagMergeSources: document.getElementById("contentTagMergeSources"),
  previewContentTagMergeButton: document.getElementById("previewContentTagMergeButton"),
  contentTagMergePreview: document.getElementById("contentTagMergePreview"),
  confirmContentTagMergeRow: document.getElementById("confirmContentTagMergeRow"),
  confirmContentTagMerge: document.getElementById("confirmContentTagMerge"),
  executeContentTagMergeButton: document.getElementById("executeContentTagMergeButton"),
  contentObjectTagsModal: document.getElementById("contentObjectTagsModal"),
  contentObjectTagsModalTitle: document.getElementById("contentObjectTagsModalTitle"),
  contentObjectTagsForm: document.getElementById("contentObjectTagsForm"),
  contentObjectTagType: document.getElementById("contentObjectTagType"),
  contentObjectTagId: document.getElementById("contentObjectTagId"),
  contentObjectTagIds: document.getElementById("contentObjectTagIds"),
  assistantCountBadge: document.getElementById("assistantCountBadge"),
  assistantList: document.getElementById("assistantList"),
  executionLogList: document.getElementById("executionLogList"),
  refreshExecutionLogs: document.getElementById("refreshExecutionLogs"),
  browserContent: document.getElementById("browserContent"),
  pageActionsButton: document.getElementById("pageActionsButton"),
  browserAudioButton: document.getElementById("browserAudioButton"),
  browserMoreMenu: document.getElementById("browserMoreMenu"),
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
  companionPanel: document.getElementById("companionPanel"),
  companionEdgeRail: document.getElementById("companionEdgeRail"),
  companionDock: document.getElementById("companionDock"),
  companionBubble: document.getElementById("companionBubble"),
  companionGreeting: document.getElementById("companionGreeting"),
  companionStateLabel: document.getElementById("companionStateLabel"),
  companionContent: document.getElementById("companionContent"),
  closeCompanionPanel: document.getElementById("closeCompanionPanel"),
  companionWeatherButton: document.getElementById("companionWeatherButton"),
  companionAssistantButton: document.getElementById("companionAssistantButton"),
  companionPauseButton: document.getElementById("companionPauseButton"),
  companionWeatherPill: document.getElementById("companionWeatherPill"),
  companionWeatherText: document.getElementById("companionWeatherText"),
  companionQuickAskForm: document.getElementById("companionQuickAskForm"),
  companionQuickAskInput: document.getElementById("companionQuickAskInput"),
  companionQuickAskSend: document.getElementById("companionQuickAskSend"),
  appContextMenu: document.getElementById("appContextMenu"),
  toastStack: document.getElementById("toastStack"),
};

const DEFAULT_DEEPSEEK_API_BASE = "https://api.deepseek.com";
const DEFAULT_DEEPSEEK_MODEL = "deepseek-v4-flash";
const DEFAULT_SHORT_PRONUNCIATION_MAX = 8;

let appState = {
  workspaces: FALLBACK_WORKSPACES,
  activeWorkspaceId: "personal",
  sites: [],
  bookmarks: [],
  tabGroups: [],
  importMeta: null,
  automations: null,
  uiSettings: {
    sessionVisibility: "all",
    contextAssistantCollapsed: false,
    sitePopupPolicies: [],
    translation: {
      providerId: "openai-compatible",
      publicConfig: { baseUrl: DEFAULT_DEEPSEEK_API_BASE, model: DEFAULT_DEEPSEEK_MODEL },
      sourceLanguage: "auto",
      targetLanguage: "zh-CN",
      defaultMode: "bilingual",
      selectionButtonEnabled: true,
      shortSelectionPronunciationMode: "pronunciation-with-explanation",
      shortSelectionMaxCharacters: DEFAULT_SHORT_PRONUNCIATION_MAX,
      siteRules: [],
    },
    browserMemory: { mode: "standard", inactiveMinutes: 15 },
    search: {
      defaultSearchEngineId: "google",
      saveSearchHistory: true,
      searchHistoryLimit: 100,
      settingsLastSection: "general",
    },
  },
  searchHistory: [],
  connectorConnections: [],
  externalObjectLinks: [],
  localTasks: [],
  taskReminders: [],
  taskSettings: {},
  timelineTracks: [],
  timelineEvents: [],
  timelineUiSettings: {},
  userScripts: [],
  userScriptPermissions: [],
  userScriptExecutions: [],
  userScriptValues: {},
  contentTagGroups: [],
  contentTags: [],
  contentTagAliases: [],
  contentTagMergeRecords: [],
};
let currentRoute = "home";
let currentSite = null;
let currentAutomationTab = "checkins";
let assistantCache = [];
let executionLogCache = [];
let pageActionSnapshot = null;
let pageActionPanelOpen = false;
let companionPanelOpen = false;
let activeRightPanel = null;
let companionRuntime = { state: "silentHidden", reminder: null, quietReason: null };
let companionWeather = { configured: false, status: "not-configured", snapshot: null, error: null };
let companionAIRequestId = null;
let companionAIResult = "";
let pageActionRequestId = 0;
let pageActionRefreshTimer = 0;
let translationStatusCache = null;
let taskState = { tasks: [], reminders: [], settings: {}, timeZone: "UTC" };
let habitState = {
  year: new Date().getFullYear(),
  today: localDateKey(new Date()),
  habits: [],
  todayPendingCount: 0,
  totalStars: 0,
  usage: { enabled: true, days: [], summary: {} },
};
let usageDetailsVisible = false;
let lastMeaningfulUsageAt = 0;
let timelineState = {
  loadedYear: null,
  tracks: [],
  events: [],
  settings: {
    viewMode: "timeline",
    selectedYear: new Date().getFullYear(),
    selectedTrackId: "personal",
    trackViews: {
      work: { selectedYear: new Date().getFullYear(), selectedMonth: null, scope: "year", zoom: 1 },
      personal: { selectedYear: new Date().getFullYear(), selectedMonth: null, scope: "year", zoom: 1 },
    },
    typeFilter: "all",
    search: "",
    lastTrackId: "personal",
  },
  review: null,
  loading: false,
};
let timelineFocusEventId = null;
let timelineMonthNavDrag = null;
let timelineSearchTimer = 0;
let userScriptState = { scripts: [], executions: [], versions: [] };
let contentTagState = {
  groups: [],
  tags: [],
  aliases: [],
  mergeRecords: [],
  referenceCounts: { byTagId: {} },
  loading: false,
  error: "",
};
let pendingContentTagMergePreview = null;
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
  tabGroups: [],
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
let duplicateTabsCurrentReport = null;
let siteContextMenuTarget = null;
let chromeBookmarkReadState = "idle";
let chromeBookmarkReadError = "";
let googleSyncState = {
  configured: false,
  signedIn: false,
  email: "",
  identity: { status: "signedOut", email: "" },
  drive: { status: "notConfigured", grantedScopes: [], requiredScopes: [] },
  lastSyncAt: null,
  status: "unavailable",
  error: "",
};
let googleSyncBusyAction = "";
let googleSyncPopoverOpen = false;
let shortcutSnapshot = { platform: "windows", bindings: [], categories: [], conflicts: [] };
let shortcutCaptureActionId = "";
let zohoDashboard = null;
let zohoConnectorStatus = null;
let zohoDashboardLoading = false;
let zohoDashboardCancelRequested = false;
let zohoTicketContext = null;
let activeTicketFilter = "";
let searchState = {
  engines: [],
  settings: {
    defaultSearchEngineId: "google",
    saveSearchHistory: true,
    searchHistoryLimit: 100,
    settingsLastSection: "general",
  },
  history: [],
};
let globalSearchOpen = false;
let globalSearchItems = [];
let globalSearchSelectedIndex = 0;
let globalSearchDebounceTimer = 0;
let globalSearchPreviousFocus = null;
let settingsCardRegistry = new Map();
let activeSettingsSection = "general";
let expandedSettingsPanel = null;
let zohoFormEventsBound = false;
let browserBoundsFrame = 0;
let lastBrowserBoundsKey = "";
const dirtySettingsPanels = new Set();

const SIDEBAR_COLLAPSED_STORAGE_KEY = "site-nest.sidebar-collapsed";
const TAB_DETACH_DRAG_THRESHOLD = 44;
const SETTINGS_SECTIONS = Object.freeze([
  { id: "general", title: "常规", kicker: "GENERAL", icon: "settings", description: "空间、会话和界面行为。" },
  { id: "search", title: "搜索与新标签页", kicker: "SEARCH", icon: "search", description: "默认搜索引擎、搜索历史和全局搜索入口。" },
  { id: "shortcuts", title: "快捷键", kicker: "SHORTCUTS", icon: "settings", description: "按功能分组管理当前平台的应用快捷键。" },
  { id: "browsing", title: "浏览与性能", kicker: "BROWSING", icon: "window", description: "网页内存、新窗口、登录弹窗与浏览身份。" },
  { id: "translation", title: "翻译与 DeepSeek", kicker: "TRANSLATION", icon: "language", description: "划词翻译、DeepSeek 查询、整页翻译与隐私边界。" },
  { id: "notifications", title: "计划与通知", kicker: "NOTIFICATIONS", icon: "calendar", description: "桌面提醒、托盘和随系统启动。" },
  { id: "connections", title: "连接与集成", kicker: "CONNECTIONS", icon: "workflow", description: "Zoho Desk 与预留的只读连接器。" },
  { id: "accounts", title: "账号与同步", kicker: "ACCOUNTS", icon: "cloud", description: "Google 数据同步和 Chrome 本地书签。" },
  { id: "data", title: "数据与备份", kicker: "LOCAL DATA", icon: "database", description: "本地数据目录和浏览会话边界。" },
  { id: "diagnostics", title: "开发与诊断", kicker: "DIAGNOSTICS", icon: "shield", description: "审计栖页自身界面动作、处理器和 IPC 绑定。" },
  { id: "about", title: "关于", kicker: "ABOUT", icon: "info", description: "当前版本、数据说明和后续方向。" },
]);

const SETTINGS_SEARCH_INDEX = Object.freeze([
  { section: "general", panel: "sessions", title: "当前会话", description: "切换空间和会话显示方式" },
  { section: "search", panel: "search-engine", title: "默认搜索引擎", description: "Google、Bing、百度、DuckDuckGo 与搜索历史" },
  { section: "shortcuts", panel: "shortcuts", title: "快捷键", description: "搜索、导航、页签、工作空间和计划快捷键" },
  { section: "browsing", panel: "memory", title: "网页视图内存", description: "内存模式、后台自动休眠和保持运行" },
  { section: "browsing", panel: "popup-policy", title: "新窗口与登录弹窗", description: "OAuth、SSO、POST 和站点弹窗策略" },
  { section: "translation", panel: "translation", title: "DeepSeek 翻译与划词查询", description: "DeepSeek API、目标语言与敏感网站确认" },
  { section: "notifications", panel: "companion", title: "小序伴随助手", description: "天气、专注贴边、护眼、喝水、活动和安静时间" },
  { section: "notifications", panel: "notifications", title: "通知与后台", description: "桌面提醒、托盘、系统启动和勿扰时间" },
  { section: "connections", panel: "zoho", title: "Zoho Desk", description: "只读工单、组织 ID、SLA 与 OAuth" },
  { section: "connections", panel: "connections", title: "Emma、Customer Ops、Gitee、B1 运维台", description: "连接器状态和接口说明" },
  { section: "accounts", panel: "google", title: "Google 数据同步", description: "连接 Google、同步和云端恢复" },
  { section: "accounts", panel: "chrome-bookmarks", title: "Chrome 书签", description: "读取本机 Chrome Profile 和导入书签" },
  { section: "data", panel: "content-tags", title: "内容标签管理", description: "标签分组、明确别名、引用计数、合并预览和撤销" },
  { section: "data", panel: "local-data", title: "本地数据", description: "数据目录、JSON 和本地存储" },
  { section: "data", panel: "browser-identity", title: "站点登录会话", description: "Cookie、BrowserProfile 和持久分区" },
  { section: "diagnostics", panel: "ui-actions", title: "界面动作审计", description: "注册动作、处理器、IPC、键盘访问和测试覆盖" },
  { section: "about", panel: "about", title: "关于栖页", description: "版本和更新信息" },
]);

function searchEngineById(engineId = searchState.settings.defaultSearchEngineId) {
  return searchState.engines.find((engine) => engine.id === engineId) || searchState.engines[0] || {
    id: "google",
    name: "Google",
    icon: "G",
  };
}

function applySearchSnapshot(snapshot = {}) {
  searchState = {
    engines: Array.isArray(snapshot.engines) ? snapshot.engines : searchState.engines,
    settings: { ...searchState.settings, ...(snapshot.settings || {}) },
    history: Array.isArray(snapshot.history) ? snapshot.history : searchState.history,
  };
  appState.uiSettings = appState.uiSettings || {};
  appState.uiSettings.search = { ...searchState.settings };
  appState.searchHistory = [...searchState.history];
  renderSearchEngineControls();
  renderSearchHistory();
  renderBrowserEmptyRecent();
}

async function loadSearchState() {
  if (typeof window.siteNest?.getSearchState !== "function") return;
  applySearchSnapshot(await window.siteNest.getSearchState());
}

function presentTransientBrowserResult(result) {
  applyReturnedState(result);
  const snapshot = browserStateFromResult(result);
  if (!snapshot) return null;
  currentSite = siteForWorkspaceBrowserState(snapshot);
  currentRoute = "browser-tabs";
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  dom.browserPage.classList.add("is-visible");
  handleBrowserState(snapshot);
  updateActiveNavigation();
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
  return snapshot;
}

async function openGeneralInput(input, options = {}) {
  const value = String(input || "").trim();
  if (!value || typeof window.siteNest?.openSearchInput !== "function") return null;
  const previousRoute = currentRoute;
  const previousSite = currentSite;
  const previousBrowserVisible = dom.browserPage.classList.contains("is-visible");
  if (globalSearchOpen) closeGlobalSearchPalette({ resume: false });
  document.querySelectorAll(".local-page").forEach((page) => page.classList.remove("is-visible"));
  dom.browserPage.classList.add("is-visible");
  currentRoute = "browser-tabs";
  currentSite = {
    id: "transient-search",
    workspaceId: activeWorkspaceId(),
    name: "正在打开",
    shortName: "搜",
    url: "",
    color: "#267d67",
    transient: true,
  };
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  try {
    const result = await window.siteNest.openSearchInput({
      input: value,
      engineId: options.engineId || searchState.settings.defaultSearchEngineId,
      forceSearch: options.forceSearch === true,
      disposition: options.disposition || (previousRoute === "browser-empty" ? "current" : "new"),
      workspaceId: activeWorkspaceId(),
      browserProfileId: activeBrowserTab(browserSnapshot)?.browserProfileId,
      bounds: browserBounds(),
    });
    applySearchSnapshot({
      engines: searchState.engines,
      settings: result?.state?.uiSettings?.search || searchState.settings,
      history: result?.state?.searchHistory || searchState.history,
    });
    if (result?.target?.kind === "external") {
      currentRoute = previousRoute;
      currentSite = previousSite;
      dom.browserPage.classList.toggle("is-visible", previousBrowserVisible);
      if (previousBrowserVisible) {
        void resumeBrowserAfterModal();
      } else {
        setVisibleLocalPage(previousRoute === "browser-empty" ? "browser-empty" : previousRoute);
      }
      showToast(
        result.externalResult?.opened ? "已打开外部应用" : "已取消外部打开",
        result.externalResult?.opened
          ? `${result.target.protocol} 已交给系统处理`
          : "标签和当前页面未发生变化",
      );
      return null;
    }
    return presentTransientBrowserResult(result);
  } catch (error) {
    currentRoute = previousRoute;
    currentSite = previousSite;
    dom.browserPage.classList.toggle("is-visible", previousBrowserVisible);
    if (previousBrowserVisible) {
      void resumeBrowserAfterModal();
    } else {
      setVisibleLocalPage(previousRoute === "browser-empty" ? "browser-empty" : previousRoute);
    }
    showToast("无法打开", error?.message || "请检查网址或搜索内容", "error");
    return null;
  }
}

function renderSearchEngineControls() {
  const engine = searchEngineById();
  dom.browserEmptyEngineIcon.textContent = engine.icon || engine.name[0];
  for (const select of [dom.globalSearchEngine, dom.defaultSearchEngineSelect]) {
    if (!select) continue;
    const current = select === dom.globalSearchEngine
      ? select.value || engine.id
      : searchState.settings.defaultSearchEngineId;
    select.replaceChildren();
    searchState.engines.forEach((item) => {
      const option = document.createElement("option");
      option.value = item.id;
      option.textContent = item.name;
      select.appendChild(option);
    });
    select.value = searchEngineById(current).id;
  }
  if (dom.defaultSearchEngineStatus) dom.defaultSearchEngineStatus.textContent = engine.name;
  if (dom.saveSearchHistorySetting) dom.saveSearchHistorySetting.checked = searchState.settings.saveSearchHistory !== false;
}

function renderSearchHistory() {
  if (!dom.searchHistoryList) return;
  dom.searchHistoryList.replaceChildren();
  const history = searchState.history.slice(0, 12);
  if (!history.length) {
    const empty = document.createElement("p");
    empty.className = "settings-inline-note";
    empty.textContent = "尚无本机搜索历史";
    dom.searchHistoryList.appendChild(empty);
  }
  history.forEach((item) => {
    const row = document.createElement("div");
    row.className = "search-history-row";
    const text = document.createElement("span");
    text.textContent = item.text;
    text.title = item.text;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "删除";
    remove.addEventListener("click", async () => {
      applySearchSnapshot(await window.siteNest.removeSearchHistory(item.id));
    });
    row.append(text, remove);
    dom.searchHistoryList.appendChild(row);
  });
}

function renderBrowserEmptyRecent() {
  if (!dom.browserEmptyRecent) return;
  dom.browserEmptyRecent.replaceChildren();
  const history = searchState.history.slice(0, 5);
  dom.browserEmptyRecent.hidden = history.length === 0;
  history.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.text;
    button.title = item.text;
    button.addEventListener("click", () => void openGeneralInput(item.text, {
      engineId: item.engineId,
      forceSearch: item.type === "webSearch",
      disposition: "current",
    }));
    dom.browserEmptyRecent.appendChild(button);
  });
}

function globalResult(group, id, title, detail, source, execute) {
  return { group, id, title, detail, source, execute };
}

function localSearchMatches(query) {
  const normalized = query.toLocaleLowerCase("zh-CN");
  const matches = [];
  allCurrentSessions()
    .filter((session) => `${sessionTitle(session)} ${session.url || ""} ${tabGroupById(session.tabGroupId)?.name || ""}`.toLocaleLowerCase("zh-CN").includes(normalized))
    .slice(0, 5)
    .forEach((session) => matches.push(globalResult("当前会话", `session:${session.tabId}`, sessionTitle(session), `${workspaceName(session.workspaceId)} · ${tabGroupById(session.tabGroupId)?.name || "未分组"} · ${hostFromUrl(session.url)}`, "会话", () => showSession(session))));
  (appState.tabGroups || [])
    .filter((group) => !group.deletedAt && group.name.toLocaleLowerCase("zh-CN").includes(normalized))
    .slice(0, 5)
    .forEach((group) => matches.push(globalResult(
      "页签分组",
      `tab-group:${group.id}`,
      group.name,
      `${workspaceName(group.workspaceId)} · ${tabCountForGroup(group.id, group.workspaceId)} 个页签`,
      "分组",
      () => showTabGroup(group),
    )));
  appState.sites
    .filter((site) => `${site.name} ${site.url} ${site.description || ""}`.toLocaleLowerCase("zh-CN").includes(normalized))
    .slice(0, 5)
    .forEach((site) => matches.push(globalResult("我的站点", `site:${site.id}`, site.name, `${workspaceName(siteWorkspaceId(site))} · ${hostFromUrl(site.url)}`, "站点", () => openSite(site))));
  appState.bookmarks
    .filter((bookmark) => `${bookmark.name} ${bookmark.url} ${bookmark.folder || ""}`.toLocaleLowerCase("zh-CN").includes(normalized))
    .slice(0, 5)
    .forEach((bookmark) => matches.push(globalResult("Chrome 书签", `bookmark:${bookmark.id}`, bookmark.name, `${bookmark.folder || "未分类"} · ${hostFromUrl(bookmark.url)}`, "书签", () => openGeneralInput(bookmark.url))));
  taskState.tasks
    .filter((task) => `${task.title} ${task.notes || ""} ${(task.tags || []).join(" ")}`.toLocaleLowerCase("zh-CN").includes(normalized))
    .slice(0, 5)
    .forEach((task) => matches.push(globalResult("计划任务", `task:${task.id}`, task.title, `${workspaceName(task.workspaceId)} · ${taskDueLabel(task)}`, "任务", () => {
      currentTaskView = "all";
      navigateTo("plan");
      openTaskModal(task);
    })));
  return matches;
}

async function buildGlobalSearchItems() {
  const query = dom.globalSearchInput.value.trim();
  if (!query) {
    return searchState.history.slice(0, 8).map((item) => globalResult(
      "最近搜索",
      `history:${item.id}`,
      item.text,
      item.type === "webSearch" ? `${searchEngineById(item.engineId).name} 搜索` : "直接打开网址",
      "本机",
      () => openGeneralInput(item.text, { engineId: item.engineId, forceSearch: item.type === "webSearch" }),
    ));
  }
  const items = localSearchMatches(query);
  if (typeof window.siteNest?.searchTimeline === "function") {
    try {
      const timeline = await window.siteNest.searchTimeline(query, 5);
      (timeline?.events || []).forEach((event) => items.push(globalResult(
        "时间轴",
        `timeline:${event.id}`,
        event.title,
        `${String(event.startDate || "")} · ${event.trackId === "work" ? "工作线" : "个人线"}`,
        "时间轴",
        async () => {
          const year = Number(String(event.startDate || "").slice(0, 4)) || new Date().getFullYear();
          timelineFocusEventId = event.id;
          currentTaskView = "timeline";
          navigateTo("plan");
          if (timelineState.settings.selectedTrackId !== event.trackId) {
            await setTimelineSettings({ selectedTrackId: event.trackId, lastTrackId: event.trackId });
          }
          await setTimelineTrackView({ selectedYear: year, selectedMonth: null, scope: "year" });
          await setTimelineYear(year, { focusEventId: event.id });
        },
      )));
    } catch {
      // Local timeline search failures must not block normal web search.
    }
  }
  let target = null;
  try {
    target = await window.siteNest.resolveSearchInput(query, dom.globalSearchEngine.value);
  } catch {
    // The open action will surface the validated error when the user confirms it.
  }
  if (target?.kind === "url") {
    items.push(globalResult("直接打开网址", "direct-url", `打开 ${target.url}`, "临时网页，不会自动收藏", "网址", () => openGeneralInput(query, { disposition: "new" })));
  } else if (target?.kind === "external") {
    items.push(globalResult(
      "外部应用",
      "external-protocol",
      `请求打开 ${target.protocol} 外部应用`,
      "执行前将显示系统确认，不会创建页签",
      "确认",
      () => openGeneralInput(query, { disposition: "new" }),
    ));
  }
  const engine = searchEngineById(dom.globalSearchEngine.value);
  items.push(globalResult("互联网搜索", "internet-search", `使用 ${engine.name} 搜索：${query}`, "仅在点击或按 Enter 后联网", engine.name, () => openGeneralInput(query, { engineId: engine.id, forceSearch: true, disposition: "new" })));
  return items;
}

function renderGlobalSearchItems(items) {
  globalSearchItems = items;
  globalSearchSelectedIndex = Math.min(globalSearchSelectedIndex, Math.max(0, items.length - 1));
  dom.globalSearchResults.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "global-search-empty";
    empty.textContent = "输入关键词或网址开始搜索";
    dom.globalSearchResults.appendChild(empty);
    return;
  }
  let group = "";
  items.forEach((item, index) => {
    if (item.group !== group) {
      group = item.group;
      const heading = document.createElement("div");
      heading.className = "global-search-group-title";
      heading.textContent = group;
      dom.globalSearchResults.appendChild(heading);
    }
    const button = document.createElement("button");
    button.type = "button";
    button.className = `global-search-result${index === globalSearchSelectedIndex ? " is-selected" : ""}`;
    button.dataset.searchResultIndex = String(index);
    button.setAttribute("role", "option");
    button.setAttribute("aria-selected", String(index === globalSearchSelectedIndex));
    const icon = document.createElement("span");
    icon.className = "global-search-result-icon";
    icon.textContent = item.source.slice(0, 2);
    const copy = document.createElement("span");
    copy.className = "global-search-result-copy";
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("small");
    detail.textContent = item.detail;
    copy.append(title, detail);
    const source = document.createElement("span");
    source.className = "global-search-result-source";
    source.textContent = item.source;
    button.append(icon, copy, source);
    button.addEventListener("mousemove", () => {
      if (globalSearchSelectedIndex !== index) {
        globalSearchSelectedIndex = index;
        renderGlobalSearchItems(globalSearchItems);
      }
    });
    button.addEventListener("click", () => void executeGlobalSearchItem(index));
    dom.globalSearchResults.appendChild(button);
  });
}

async function refreshGlobalSearch() {
  const items = await buildGlobalSearchItems();
  if (globalSearchOpen) renderGlobalSearchItems(items);
}

async function executeGlobalSearchItem(index = globalSearchSelectedIndex) {
  const item = globalSearchItems[index];
  if (!item) return;
  closeGlobalSearchPalette({ resume: false, restoreFocus: false });
  await item.execute();
}

function openGlobalSearchPalette(prefill = "") {
  if (globalSearchOpen) return;
  globalSearchOpen = true;
  globalSearchPreviousFocus = document.activeElement;
  window.siteNest?.hideBrowser();
  dom.companionBubble.hidden = true;
  dom.globalSearchPalette.hidden = false;
  dom.globalSearchInput.value = String(prefill || "");
  dom.globalSearchEngine.value = searchState.settings.defaultSearchEngineId;
  globalSearchSelectedIndex = 0;
  void refreshGlobalSearch();
  window.setTimeout(() => {
    dom.globalSearchInput.focus();
    dom.globalSearchInput.select();
  }, 20);
}

function closeGlobalSearchPalette(options = {}) {
  if (!globalSearchOpen) return;
  globalSearchOpen = false;
  window.clearTimeout(globalSearchDebounceTimer);
  dom.globalSearchPalette.hidden = true;
  globalSearchItems = [];
  dom.globalSearchResults.replaceChildren();
  if (options.resume !== false) void resumeBrowserAfterModal();
  if (options.restoreFocus !== false) globalSearchPreviousFocus?.focus?.();
  globalSearchPreviousFocus = null;
}

function settingsSectionDefinition(sectionId) {
  return SETTINGS_SECTIONS.find((section) => section.id === sectionId) || SETTINGS_SECTIONS[0];
}

function settingsPanelCard(panelId) {
  for (const cards of settingsCardRegistry.values()) {
    const card = cards.find((item) => item.dataset.settingsPanel === panelId);
    if (card) return card;
  }
  return null;
}

function setSettingsCardExpanded(card, expanded) {
  if (!card) return;
  card.classList.toggle("is-collapsed", !expanded);
  const toggle = card.querySelector(":scope > .settings-card-copy .settings-card-toggle");
  if (toggle) {
    toggle.setAttribute("aria-expanded", String(expanded));
    toggle.title = expanded ? "收起设置" : "展开设置";
  }
}

function expandSettingsPanel(panelId) {
  let card = settingsPanelCard(panelId);
  if (panelId === "zoho") card = settingsPanelCard("connections");
  if (!card) return;
  settingsCardRegistry.get(activeSettingsSection)?.forEach((item) => setSettingsCardExpanded(item, item === card));
  expandedSettingsPanel = panelId;
  if (panelId === "zoho") mountZohoConfigForm();
  requestAnimationFrame(() => card.scrollIntoView({ block: "nearest", behavior: "smooth" }));
}

function dirtyPanelsForSection(sectionId) {
  return SETTINGS_SEARCH_INDEX
    .filter((item) => item.section === sectionId && dirtySettingsPanels.has(item.panel))
    .map((item) => item.title);
}

function canLeaveSettingsSection(nextSection) {
  if (nextSection === activeSettingsSection) return true;
  const dirty = dirtyPanelsForSection(activeSettingsSection);
  if (!dirty.length) return true;
  return window.confirm(`${dirty.join("、")}存在尚未保存的修改，确定离开当前分类吗？`);
}

async function persistSettingsSection(sectionId) {
  if (searchState.settings.settingsLastSection === sectionId) return;
  try {
    applySearchSnapshot(await window.siteNest.updateSearchSettings({ settingsLastSection: sectionId }));
  } catch {
    // The visible section remains usable even if persistence temporarily fails.
  }
}

function settingsLocationHash(sectionId, panelId = "") {
  const params = new URLSearchParams({ section: sectionId });
  if (panelId) params.set("panel", panelId);
  return `#settings?${params.toString()}`;
}

function showSettingsSection(sectionId, panelId = "", options = {}) {
  const definition = settingsSectionDefinition(sectionId);
  if (!settingsCardRegistry.has(definition.id)) return;
  if (!options.force && !canLeaveSettingsSection(definition.id)) return;
  activeSettingsSection = definition.id;
  dom.settingsSectionKicker.textContent = definition.kicker;
  dom.settingsSectionTitle.textContent = definition.title;
  dom.settingsSectionDescription.textContent = definition.description;
  dom.settingsPanelHost.replaceChildren(...settingsCardRegistry.get(definition.id));
  dom.settingsNavigation.querySelectorAll("button[data-settings-section]").forEach((button) => {
    const active = button.dataset.settingsSection === definition.id;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-current", active ? "page" : "false");
  });
  dom.settingsSectionSelect.value = definition.id;
  const requestedPanel = panelId || settingsCardRegistry.get(definition.id)[0]?.dataset.settingsPanel || "";
  settingsCardRegistry.get(definition.id).forEach((card) => setSettingsCardExpanded(card, false));
  if (requestedPanel) expandSettingsPanel(requestedPanel);
  if (options.persist !== false) void persistSettingsSection(definition.id);
  if (options.pushHistory !== false && window.location.hash !== settingsLocationHash(definition.id, panelId)) {
    window.history.pushState({ route: "settings", section: definition.id, panel: panelId }, "", settingsLocationHash(definition.id, panelId));
  }
  if (definition.id === "connections") void loadZohoConnectorStatus({ preserveForm: true });
  if (definition.id === "accounts") renderGoogleSettingsStatus();
  if (definition.id === "shortcuts") void loadShortcuts();
  if (definition.id === "data") void loadContentTags();
  if (definition.id === "diagnostics") void loadUIActionAudit();
}

const UI_ACTION_AUDIT_LABELS = Object.freeze([
  ["totalActions", "总动作数"],
  ["registeredActions", "已注册"],
  ["executableActions", "可执行"],
  ["requiresConfiguration", "需要配置"],
  ["unavailableActions", "不可用"],
  ["previewActions", "预览"],
  ["missingHandlers", "缺少处理器"],
  ["invalidIpcChannels", "无效 IPC"],
  ["missingTests", "缺少测试"],
  ["keyboardInaccessible", "键盘不可达"],
]);

function renderUIActionAudit(report) {
  if (!dom.uiActionAuditMetrics) return;
  const summary = report?.summary || {};
  dom.uiActionAuditMetrics.replaceChildren(...UI_ACTION_AUDIT_LABELS.map(([key, label]) => {
    const item = document.createElement("span");
    const value = document.createElement("strong");
    value.textContent = String(summary[key] ?? 0);
    const copy = document.createElement("small");
    copy.textContent = label;
    item.append(value, copy);
    return item;
  }));
  const errors = Number(summary.errorCount) || 0;
  const warnings = Number(summary.warningCount) || 0;
  dom.uiActionAuditStatus.textContent = errors ? `${errors} 个错误` : warnings ? `${warnings} 个提醒` : "审计通过";
  dom.uiActionAuditStatus.className = `status-pill${errors ? " status-pill--error" : " status-pill--ready"}`;
  dom.uiActionAuditScope.textContent = report?.scope?.externalWebContentsScanned
    ? "外部网页扫描：异常开启"
    : `外部网页扫描：否 · ${report?.scope?.scannedFiles?.length || 0} 个栖页源文件`;
  dom.uiActionAuditFindings.replaceChildren();
  const findings = Array.isArray(report?.findings) ? report.findings : [];
  if (!findings.length) {
    const empty = document.createElement("p");
    empty.className = "ui-action-audit-empty";
    empty.textContent = "没有发现假按钮、无效 IPC、缺失处理器或键盘访问问题。";
    dom.uiActionAuditFindings.appendChild(empty);
    return;
  }
  findings.slice(0, 80).forEach((finding) => {
    const row = document.createElement("div");
    row.className = `ui-action-audit-finding ui-action-audit-finding--${finding.severity || "warning"}`;
    const title = document.createElement("strong");
    title.textContent = `${finding.ruleId || "finding"} · ${finding.actionId || finding.controlId || "未命名控件"}`;
    const detail = document.createElement("small");
    detail.textContent = `${finding.file || "<registry>"}${finding.line ? `:${finding.line}` : ""} · ${finding.message || ""}`;
    row.append(title, detail);
    dom.uiActionAuditFindings.appendChild(row);
  });
}

async function loadUIActionAudit() {
  if (!dom.refreshUIActionAudit || typeof window.siteNest?.auditUIActions !== "function") return;
  dom.refreshUIActionAudit.disabled = true;
  dom.refreshUIActionAudit.setAttribute("aria-busy", "true");
  dom.uiActionAuditStatus.textContent = "审计中";
  dom.uiActionAuditStatus.className = "status-pill";
  try {
    renderUIActionAudit(await window.siteNest.auditUIActions());
  } catch (error) {
    dom.uiActionAuditStatus.textContent = "审计失败";
    dom.uiActionAuditStatus.className = "status-pill status-pill--error";
    dom.uiActionAuditFindings.textContent = error?.message || "无法读取界面动作审计结果";
  } finally {
    dom.refreshUIActionAudit.disabled = false;
    dom.refreshUIActionAudit.removeAttribute("aria-busy");
  }
}

function initializeSettingsArchitecture() {
  const cards = Array.from(dom.settingsPanelHost.children).filter((element) => element.matches(".settings-card[data-settings-section]"));
  settingsCardRegistry = new Map();
  cards.forEach((card) => {
    const sectionId = card.dataset.settingsSection;
    if (!settingsCardRegistry.has(sectionId)) settingsCardRegistry.set(sectionId, []);
    settingsCardRegistry.get(sectionId).push(card);
    const titleRow = card.querySelector(":scope > .settings-card-copy > .settings-title-row");
    if (titleRow && !titleRow.querySelector(".settings-card-toggle")) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "settings-card-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.title = "展开设置";
      toggle.appendChild(createIconElement("chevron-down"));
      toggle.addEventListener("click", () => {
        const collapsed = card.classList.contains("is-collapsed");
        settingsCardRegistry.get(activeSettingsSection)?.forEach((item) => setSettingsCardExpanded(item, item === card && collapsed));
        expandedSettingsPanel = collapsed ? card.dataset.settingsPanel : null;
      });
      titleRow.appendChild(toggle);
    }
    setSettingsCardExpanded(card, false);
  });
  dom.settingsPanelHost.replaceChildren();
  SETTINGS_SECTIONS.filter((section) => settingsCardRegistry.has(section.id)).forEach((section) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.settingsSection = section.id;
    button.append(createIconElement(section.icon), document.createTextNode(section.title));
    button.addEventListener("click", () => showSettingsSection(section.id));
    dom.settingsNavigation.appendChild(button);
    const option = document.createElement("option");
    option.value = section.id;
    option.textContent = section.title;
    dom.settingsSectionSelect.appendChild(option);
  });
  showSettingsSection("general", "", { persist: false, pushHistory: false, force: true });
}

function renderSettingsSearchResults() {
  const query = dom.settingsSearchInput.value.trim().toLocaleLowerCase("zh-CN");
  dom.settingsSearchResults.replaceChildren();
  if (!query) {
    dom.settingsSearchResults.hidden = true;
    return;
  }
  const matches = SETTINGS_SEARCH_INDEX.filter((item) =>
    `${item.title} ${item.description}`.toLocaleLowerCase("zh-CN").includes(query) &&
    settingsCardRegistry.has(item.section));
  dom.settingsSearchResults.hidden = false;
  if (!matches.length) {
    const empty = document.createElement("div");
    empty.className = "global-search-empty";
    empty.textContent = "没有匹配的已实现设置";
    dom.settingsSearchResults.appendChild(empty);
    return;
  }
  matches.slice(0, 10).forEach((item) => {
    const section = settingsSectionDefinition(item.section);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "settings-search-result";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = item.title;
    const detail = document.createElement("small");
    detail.textContent = item.description;
    copy.append(title, detail);
    const path = document.createElement("span");
    path.textContent = `${section.title} →`;
    button.append(copy, path);
    button.addEventListener("click", () => {
      dom.settingsSearchInput.value = "";
      dom.settingsSearchResults.hidden = true;
      showSettingsSection(item.section, item.panel);
    });
    dom.settingsSearchResults.appendChild(button);
  });
}

function renderGoogleSettingsStatus() {
  if (!dom.googleSettingsStatus) return;
  const driveStatus = googleSyncState.drive?.status || googleSyncState.status;
  const ready = ["ready", "synced"].includes(driveStatus);
  const failed = ["permissionDenied", "apiDisabled", "testUserRequired", "networkError", "error"].includes(driveStatus);
  dom.googleSettingsStatus.textContent = ready ? "同步就绪" : googleSyncState.signedIn ? "仅账号已登录" : failed ? "同步失败" : "未连接";
  dom.googleSettingsStatus.className = `status-pill${ready ? " status-pill--ready" : failed ? " status-pill--error" : ""}`;
  dom.googleSyncModuleSettings?.querySelectorAll("[data-google-sync-module]").forEach((input) => {
    input.checked = appState.uiSettings?.googleSync?.[input.dataset.googleSyncModule] === true ||
      (input.dataset.googleSyncModule !== "notifications" && appState.uiSettings?.googleSync?.[input.dataset.googleSyncModule] !== false);
  });
}

function eventAccelerator(event) {
  if (["Control", "Shift", "Alt", "Meta"].includes(event.key)) return "";
  const modifiers = [];
  const modPressed = shortcutSnapshot.platform === "macos" ? event.metaKey : event.ctrlKey;
  if (modPressed) modifiers.push("Mod");
  if (event.ctrlKey && shortcutSnapshot.platform === "macos") modifiers.push("Ctrl");
  if (event.altKey) modifiers.push("Alt");
  if (event.shiftKey) modifiers.push("Shift");
  if (event.metaKey && shortcutSnapshot.platform !== "macos") modifiers.push("Meta");
  const key = event.key === " " ? "Space"
    : event.key.length === 1 ? event.key.toUpperCase()
      : event.key;
  return [...modifiers, key].join("+");
}

async function loadShortcuts() {
  if (typeof window.siteNest?.getShortcuts !== "function") return shortcutSnapshot;
  shortcutSnapshot = await window.siteNest.getShortcuts();
  renderShortcuts();
  return shortcutSnapshot;
}

function shortcutBindingsVisible() {
  const query = String(dom.shortcutSearchInput?.value || "").trim().toLocaleLowerCase("zh-CN");
  const category = dom.shortcutCategoryFilter?.value || "";
  return (shortcutSnapshot.bindings || []).filter((binding) =>
    (!category || binding.category === category) &&
    (!dom.shortcutModifiedOnly?.checked || !binding.isDefault) &&
    (!query || `${binding.label} ${binding.description} ${binding.displayAccelerator} ${binding.category}`.toLocaleLowerCase("zh-CN").includes(query)));
}

function shortcutButton(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", action);
  return button;
}

async function updateShortcutBinding(actionId, patch) {
  try {
    let result = await window.siteNest.updateShortcut({ actionId, platform: shortcutSnapshot.platform, ...patch });
    if (result?.requiresResolution) {
      const conflict = result.conflictBindings?.[0];
      const replace = window.confirm(`该快捷键已用于：${conflict?.label || conflict?.actionId || "其他动作"}\n\n确定替换原快捷键吗？选择取消会保留原配置。`);
      if (!replace) return;
      result = await window.siteNest.updateShortcut({ actionId, platform: shortcutSnapshot.platform, ...patch, replaceConflict: true });
    }
    shortcutSnapshot = result;
    dirtySettingsPanels.delete("shortcuts");
    shortcutCaptureActionId = "";
    renderShortcuts();
  } catch (error) {
    showToast("无法保存快捷键", googleSyncErrorMessage(error, "快捷键无效或被系统保留"), "error");
  }
}

function beginShortcutCapture(actionId) {
  shortcutCaptureActionId = actionId;
  dirtySettingsPanels.add("shortcuts");
  renderShortcuts();
}

function renderShortcuts() {
  if (!dom.shortcutGroupList) return;
  dom.shortcutPlatformStatus.textContent = { windows: "Windows", macos: "macOS", linux: "Linux" }[shortcutSnapshot.platform] || shortcutSnapshot.platform;
  const selectedCategory = dom.shortcutCategoryFilter.value;
  dom.shortcutCategoryFilter.replaceChildren(new Option("全部分类", ""), ...(shortcutSnapshot.categories || []).map((category) => new Option(category, category)));
  dom.shortcutCategoryFilter.value = (shortcutSnapshot.categories || []).includes(selectedCategory) ? selectedCategory : "";
  const visible = shortcutBindingsVisible();
  const modified = (shortcutSnapshot.bindings || []).filter((item) => !item.isDefault).length;
  dom.shortcutSummary.textContent = `${shortcutSnapshot.bindings?.length || 0} 个真实动作 · 已修改 ${modified} 个 · 冲突 ${shortcutSnapshot.conflicts?.length || 0} 个`;
  dom.shortcutGroupList.replaceChildren();
  for (const category of shortcutSnapshot.categories || []) {
    const bindings = visible.filter((item) => item.category === category);
    if (!bindings.length) continue;
    const group = document.createElement("details");
    group.className = "shortcut-group";
    group.open = true;
    const summary = document.createElement("summary");
    summary.textContent = `${category} · ${bindings.length}`;
    group.append(summary);
    const list = document.createElement("div");
    list.className = "shortcut-list";
    for (const binding of bindings) {
      const row = document.createElement("div");
      row.className = "shortcut-row";
      row.dataset.shortcutActionId = binding.actionId;
      if (!binding.isDefault) row.classList.add("is-modified");
      const copy = document.createElement("div");
      copy.className = "shortcut-row-copy";
      const titleRow = document.createElement("div");
      titleRow.className = "shortcut-row-title";
      const title = document.createElement("strong");
      title.textContent = binding.label;
      const modified = document.createElement("span");
      modified.className = `shortcut-modified-state${binding.isDefault ? "" : " is-modified"}`;
      modified.textContent = binding.isDefault ? "默认" : "已修改";
      const detail = document.createElement("small");
      detail.textContent = `${binding.description} · ${binding.scope}${shortcutCaptureActionId === binding.actionId ? " · Esc 取消 · Backspace 清除" : ""}`;
      titleRow.append(title, modified);
      copy.append(titleRow, detail);
      const capture = shortcutButton(
        shortcutCaptureActionId === binding.actionId ? "请按下新的快捷键" : (binding.displayAccelerator || "未设置"),
        "shortcut-capture-button",
        () => beginShortcutCapture(binding.actionId),
      );
      capture.setAttribute("aria-label", `编辑 ${binding.label} 快捷键`);
      const enabled = document.createElement("label");
      enabled.className = "shortcut-enabled";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = binding.enabled;
      checkbox.addEventListener("change", () => void updateShortcutBinding(binding.actionId, { accelerator: binding.accelerator, enabled: checkbox.checked }));
      enabled.append(checkbox, document.createTextNode("启用"));
      const actions = document.createElement("div");
      actions.className = "shortcut-row-actions";
      actions.append(
        shortcutButton("清除", "text-button text-button--quiet", () => void updateShortcutBinding(binding.actionId, { accelerator: "", enabled: true })),
        shortcutButton("恢复默认", "text-button text-button--quiet", () => void window.siteNest.resetShortcuts({ platform: shortcutSnapshot.platform, actionId: binding.actionId }).then((snapshot) => { shortcutSnapshot = snapshot; renderShortcuts(); })),
      );
      row.append(copy, capture, enabled, actions);
      list.append(row);
    }
    group.append(list);
    dom.shortcutGroupList.append(group);
  }
  if (!visible.length) {
    const empty = document.createElement("p");
    empty.className = "shortcut-empty";
    empty.textContent = "没有符合当前筛选条件的快捷键。";
    dom.shortcutGroupList.append(empty);
  }
}

function captureShortcutKey(event) {
  if (!shortcutCaptureActionId) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (event.key === "Escape") {
    shortcutCaptureActionId = "";
    dirtySettingsPanels.delete("shortcuts");
    renderShortcuts();
    return true;
  }
  if (event.key === "Backspace") {
    void updateShortcutBinding(shortcutCaptureActionId, { accelerator: "", enabled: true });
    return true;
  }
  const accelerator = eventAccelerator(event);
  if (accelerator) void updateShortcutBinding(shortcutCaptureActionId, { accelerator, enabled: true });
  return true;
}

async function executeShortcutAction(actionId) {
  const activeTab = activeBrowserTab(browserSnapshot);
  if (actionId === "search.open" || actionId === "tab.new") openGlobalSearchPalette();
  else if (actionId === "browser.focus-address") { dom.addressInput.focus(); dom.addressInput.select(); }
  else if (actionId === "settings.open") navigateTo("settings");
  else if (actionId === "sidebar.toggle") applySidebarCollapsed(!dom.appShell.classList.contains("is-sidebar-collapsed"));
  else if (["browser.back", "browser.forward", "browser.reload"].includes(actionId)) await window.siteNest.browserAction(actionId.split(".")[1]);
  else if (actionId === "session.close" && activeTab) await closeBrowserTab(activeTab.tabId);
  else if (actionId === "tab.restore-closed") await restoreRecentlyClosedBrowserTab();
  else if (actionId === "tab.duplicate" && activeTab) await duplicateExistingBrowserTab(activeTab.tabId);
  else if (["tab.next", "tab.previous"].includes(actionId) && browserSnapshot.tabs?.length > 1) {
    const index = browserSnapshot.tabs.findIndex((item) => item.tabId === browserSnapshot.activeTabId);
    const offset = actionId === "tab.next" ? 1 : -1;
    const target = browserSnapshot.tabs[(index + offset + browserSnapshot.tabs.length) % browserSnapshot.tabs.length];
    await activateBrowserTab(target.tabId);
  } else if (actionId.startsWith("workspace.")) await switchWorkspace(actionId.slice("workspace.".length));
  else if (actionId === "home.open") navigateTo("home");
  else if (actionId === "task.quick-create") { navigateTo("plan"); openTaskModal(); }
  else if (actionId === "plan.open") navigateTo("plan");
  else if (actionId === "timeline.quick-create") { currentTaskView = "timeline"; navigateTo("plan"); openTimelineEventModal(); }
  else if (actionId === "automation.open") navigateTo("automations");
  else if (actionId === "page-actions.open") setPageActionPanelOpen(true);
  else if (actionId === "translation.page") await window.siteNest.showTranslationPageMenu();
  else if (actionId === "companion.expand") setCompanionPanelOpen(true);
  else if (actionId === "companion.ai.summarize") await summarizeCurrentPageWithCompanion();
  else if (actionId === "google.sync") await runGoogleSyncAction("sync");
  else throw new Error("当前界面没有这个动作的可执行入口");
}

function invokeConfiguredShortcut(actionId, accelerator) {
  void window.siteNest.dispatchShortcut({ actionId, accelerator, platform: shortcutSnapshot.platform, context: { route: currentRoute, hasBrowser: Boolean(currentSite) } }).then(async (result) => {
    if (!result?.ok) throw new Error(result?.message || "快捷键当前不可用");
    await executeShortcutAction(result.actionId);
  }).catch((error) => showToast("快捷键执行失败", googleSyncErrorMessage(error, "当前无法执行该动作"), "error"));
}

function dispatchConfiguredShortcut(event) {
  if (shortcutCaptureActionId || event.defaultPrevented) return false;
  const accelerator = eventAccelerator(event);
  const binding = (shortcutSnapshot.bindings || []).find((item) => item.enabled && item.accelerator === accelerator);
  if (!binding) return false;
  const editable = event.target.closest?.("input, textarea, select, [contenteditable='true']");
  if (editable && !["search.open", "browser.focus-address"].includes(binding.actionId)) return false;
  if (document.querySelector(".modal-backdrop.is-open") && binding.scope !== "modal") return false;
  event.preventDefault();
  invokeConfiguredShortcut(binding.actionId, accelerator);
  return true;
}

const CONTENT_TAG_OBJECT_LABELS = Object.freeze({
  task: "任务",
  habit: "习惯",
  timeline: "时间线",
  site: "站点",
  userScript: "用户脚本",
});

const CONTENT_TAG_API_METHODS = Object.freeze({
  get: ["getContentTags", "get"],
  saveGroup: ["saveContentTagGroup", "saveGroup"],
  deleteGroup: ["deleteContentTagGroup", "deleteGroup"],
  saveTag: ["saveContentTag", "saveTag"],
  deleteTag: ["deleteContentTag", "deleteTag"],
  saveAlias: ["saveContentTagAlias", "saveAlias"],
  deleteAlias: ["deleteContentTagAlias", "deleteAlias"],
  previewMerge: ["previewContentTagMerge", "previewMerge"],
  merge: ["mergeContentTags", "merge"],
  undoMerge: ["undoLastContentTagMerge", "undoMerge"],
  setObjectTags: ["setContentObjectTags", "setObjectTags"],
});

function resolveContentTagApiMethod(operation) {
  const names = CONTENT_TAG_API_METHODS[operation] || [];
  const providers = [window.siteNest, window.qiye?.contentTags].filter(Boolean);
  for (const provider of providers) {
    for (const name of names) {
      if (typeof provider[name] === "function") return provider[name].bind(provider);
    }
  }
  return null;
}

async function callContentTagApi(operation, ...args) {
  const method = resolveContentTagApiMethod(operation);
  if (!method) throw new Error("当前版本尚未提供内容标签数据接口");
  return method(...args);
}

function normalizeContentTagSnapshot(value = {}) {
  const source = value?.snapshot || value?.state || value || {};
  const groups = source.groups || source.contentTagGroups || value.groups || value.contentTagGroups || [];
  const tags = source.tags || source.contentTags || value.tags || value.contentTags || [];
  const aliases = source.aliases || source.contentTagAliases || value.aliases || value.contentTagAliases || [];
  const mergeRecords = source.mergeRecords || source.contentTagMergeRecords || value.mergeRecords || value.contentTagMergeRecords || [];
  const referenceCounts = value.referenceCounts || value.usage || source.referenceCounts || source.usage || { byTagId: {} };
  return {
    groups: Array.isArray(groups) ? groups : [],
    tags: Array.isArray(tags) ? tags : [],
    aliases: Array.isArray(aliases) ? aliases : [],
    mergeRecords: Array.isArray(mergeRecords) ? mergeRecords : [],
    referenceCounts: referenceCounts && typeof referenceCounts === "object" ? referenceCounts : { byTagId: {} },
  };
}

function activeContentTagGroups() {
  return contentTagState.groups.filter((group) => !group.deletedAt);
}

function activeContentTags() {
  return contentTagState.tags.filter((tag) => !tag.deletedAt);
}

function contentTagAliases(tagId) {
  return contentTagState.aliases.filter((alias) => alias.tagId === tagId);
}

function contentTagReferenceSummary(tagId) {
  const record = contentTagState.referenceCounts?.byTagId?.[tagId] || {};
  return {
    objectCount: Number(record.objectCount) || 0,
    referenceCount: Number(record.referenceCount) || 0,
    byType: record.byType && typeof record.byType === "object" ? record.byType : {},
  };
}

function parseTagIdsValue(value) {
  if (Array.isArray(value)) return Array.from(new Set(value.map(String).filter(Boolean)));
  try {
    const parsed = JSON.parse(String(value || "[]"));
    return Array.isArray(parsed) ? Array.from(new Set(parsed.map(String).filter(Boolean))) : [];
  } catch {
    return String(value || "").split(",").map((item) => item.trim()).filter(Boolean);
  }
}

function pickerForKey(key) {
  return document.querySelector(`[data-content-tag-picker="${CSS.escape(String(key || ""))}"]`);
}

function tagIdsForPicker(key) {
  const picker = pickerForKey(key);
  if (!picker) return [];
  const checked = Array.from(picker.querySelectorAll('input[type="checkbox"][data-content-tag-id]:checked'))
    .map((input) => input.dataset.contentTagId)
    .filter(Boolean);
  if (checked.length) return Array.from(new Set(checked));
  return parseTagIdsValue(picker.querySelector('input[type="hidden"]')?.value);
}

function renderContentTagPicker(key, selectedTagIds) {
  const picker = pickerForKey(key);
  if (!picker) return;
  const hidden = picker.querySelector('input[type="hidden"]');
  const host = picker.querySelector(".content-tag-picker-options");
  const empty = picker.querySelector(".content-tag-picker-empty");
  const selected = new Set(parseTagIdsValue(selectedTagIds ?? hidden?.value));
  if (hidden) hidden.value = JSON.stringify(Array.from(selected));
  host?.replaceChildren();
  const tags = activeContentTags();
  if (empty) empty.hidden = tags.length > 0;
  if (!host || !tags.length) return;
  const groups = new Map(activeContentTagGroups().map((group) => [group.id, group]));
  tags
    .slice()
    .sort((left, right) => {
      const leftGroup = groups.get(left.groupId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightGroup = groups.get(right.groupId)?.sortOrder ?? Number.MAX_SAFE_INTEGER;
      return leftGroup - rightGroup || String(left.canonicalName).localeCompare(String(right.canonicalName), "zh-CN");
    })
    .forEach((tag) => {
      const label = document.createElement("label");
      label.className = "content-tag-choice";
      label.dataset.accent = tag.accentKey || "neutral";
      label.title = groups.get(tag.groupId)?.name ? `${groups.get(tag.groupId).name} · ${tag.canonicalName}` : tag.canonicalName;
      const input = document.createElement("input");
      input.type = "checkbox";
      input.dataset.contentTagId = tag.id;
      input.checked = selected.has(tag.id);
      input.addEventListener("change", () => {
        if (hidden) hidden.value = JSON.stringify(Array.from(host.querySelectorAll('input[data-content-tag-id]:checked')).map((item) => item.dataset.contentTagId));
      });
      const dot = document.createElement("span");
      dot.className = "content-tag-dot";
      const name = document.createElement("span");
      name.textContent = tag.canonicalName;
      label.append(input, dot, name);
      host.appendChild(label);
    });
}

function renderAllContentTagPickers() {
  document.querySelectorAll("[data-content-tag-picker]").forEach((picker) => {
    renderContentTagPicker(picker.dataset.contentTagPicker, picker.querySelector('input[type="hidden"]')?.value || "[]");
  });
}

function populateContentTagSelect(select, selectedValue = "", includeEmpty = false) {
  if (!select) return;
  select.replaceChildren();
  if (includeEmpty) {
    const empty = document.createElement("option");
    empty.value = "";
    empty.textContent = "未分组";
    select.appendChild(empty);
  }
  const groups = activeContentTagGroups();
  if (select === dom.contentTagGroup) {
    groups.forEach((group) => {
      const option = document.createElement("option");
      option.value = group.id;
      option.textContent = group.name;
      select.appendChild(option);
    });
  } else {
    const groupMap = new Map(groups.map((group) => [group.id, group.name]));
    activeContentTags().forEach((tag) => {
      const option = document.createElement("option");
      option.value = tag.id;
      option.textContent = `${groupMap.get(tag.groupId) ? `${groupMap.get(tag.groupId)} · ` : ""}${tag.canonicalName}`;
      select.appendChild(option);
    });
  }
  select.value = selectedValue || (includeEmpty ? "" : select.options[0]?.value || "");
}

function openContentTagGroupModal(group = null) {
  dom.contentTagGroupForm.reset();
  dom.contentTagGroupModalTitle.textContent = group ? "编辑标签分组" : "新增标签分组";
  dom.contentTagGroupId.value = group?.id || "";
  dom.contentTagGroupName.value = group?.name || "";
  dom.contentTagGroupIcon.value = group?.iconKey || "folder";
  dom.contentTagGroupSortOrder.value = String(group?.sortOrder || 0);
  dom.deleteContentTagGroupButton.classList.toggle("is-hidden", !group);
  openModal(dom.contentTagGroupModal);
}

function openContentTagModal(tag = null, groupId = "") {
  dom.contentTagForm.reset();
  dom.contentTagModalTitle.textContent = tag ? "编辑内容标签" : "新增内容标签";
  dom.contentTagId.value = tag?.id || "";
  dom.contentTagName.value = tag?.canonicalName || "";
  populateContentTagSelect(dom.contentTagGroup, tag?.groupId || groupId, true);
  dom.contentTagAccent.value = tag?.accentKey || "neutral";
  dom.contentTagDescription.value = tag?.description || "";
  dom.deleteContentTagButton.classList.toggle("is-hidden", !tag);
  openModal(dom.contentTagModal);
}

function openContentTagAliasModal(tag, alias = null) {
  if (!tag) return;
  dom.contentTagAliasForm.reset();
  dom.contentTagAliasModalTitle.textContent = alias ? "编辑明确别名" : "添加明确别名";
  dom.contentTagAliasId.value = alias?.id || "";
  populateContentTagSelect(dom.contentTagAliasTag, tag.id);
  dom.contentTagAliasTag.disabled = Boolean(alias);
  dom.contentTagAliasName.value = alias?.alias || "";
  dom.deleteContentTagAliasButton.classList.toggle("is-hidden", !alias);
  openModal(dom.contentTagAliasModal);
}

function createContentTagRow(tag) {
  const row = document.createElement("article");
  row.className = "content-tag-row";
  row.dataset.accent = tag.accentKey || "neutral";
  const marker = document.createElement("span");
  marker.className = "content-tag-color";
  const copy = document.createElement("div");
  copy.className = "content-tag-row-copy";
  const title = document.createElement("strong");
  title.textContent = tag.canonicalName;
  const description = document.createElement("small");
  description.textContent = tag.description || "没有说明";
  const aliases = document.createElement("div");
  aliases.className = "content-tag-alias-list";
  contentTagAliases(tag.id).forEach((alias) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "content-tag-alias-chip";
    button.textContent = alias.alias;
    button.title = "编辑明确别名";
    button.addEventListener("click", () => openContentTagAliasModal(tag, alias));
    aliases.appendChild(button);
  });
  const addAlias = document.createElement("button");
  addAlias.type = "button";
  addAlias.className = "content-tag-alias-chip content-tag-alias-chip--add";
  addAlias.textContent = "+ 别名";
  addAlias.addEventListener("click", () => openContentTagAliasModal(tag));
  aliases.appendChild(addAlias);
  copy.append(title, description, aliases);
  const references = contentTagReferenceSummary(tag.id);
  const usage = document.createElement("div");
  usage.className = "content-tag-reference-count";
  const total = document.createElement("strong");
  total.textContent = `${references.objectCount} 个对象`;
  const typeSummary = Object.entries(references.byType)
    .filter(([, count]) => Number(count) > 0)
    .map(([type, count]) => `${CONTENT_TAG_OBJECT_LABELS[type] || type} ${count}`)
    .join(" · ");
  const detail = document.createElement("small");
  detail.textContent = typeSummary || "暂无引用";
  usage.append(total, detail);
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "icon-button content-tag-edit";
  edit.title = "编辑标签";
  edit.setAttribute("aria-label", `编辑标签 ${tag.canonicalName}`);
  edit.appendChild(createIconElement("edit"));
  edit.addEventListener("click", () => openContentTagModal(tag));
  row.append(marker, copy, usage, edit);
  return row;
}

function renderContentTags() {
  if (!dom.contentTagGroupList) return;
  const groups = activeContentTagGroups();
  const tags = activeContentTags();
  dom.contentTagTotal.textContent = `${tags.length} 个标签`;
  dom.contentTagsStatus.textContent = contentTagState.loading
    ? "正在读取本地内容标签…"
    : contentTagState.error
      ? contentTagState.error
      : `${groups.length} 个分组 · ${contentTagState.aliases.length} 个明确别名`;
  dom.contentTagsStatus.classList.toggle("is-error", Boolean(contentTagState.error));
  dom.mergeContentTagsButton.disabled = tags.length < 2;
  const latestMerge = contentTagState.mergeRecords
    .filter((record) => !record.undoneAt)
    .sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)))[0];
  dom.undoContentTagMergeButton.disabled = !latestMerge;
  dom.undoContentTagMergeButton.title = latestMerge ? `撤销 ${new Date(latestMerge.createdAt).toLocaleString("zh-CN")} 的合并` : "没有可撤销的合并";
  dom.contentTagGroupList.replaceChildren();
  if (!groups.length && !tags.length) {
    const empty = document.createElement("div");
    empty.className = "content-tags-empty";
    empty.innerHTML = "<strong>还没有内容标签</strong><small>先创建分组或直接新增标签；正式界面不会自动生成标签或同义词。</small>";
    dom.contentTagGroupList.appendChild(empty);
    renderAllContentTagPickers();
    return;
  }
  const groupBuckets = [
    ...groups.map((group) => ({ group, tags: tags.filter((tag) => tag.groupId === group.id) })),
    { group: null, tags: tags.filter((tag) => !groups.some((group) => group.id === tag.groupId)) },
  ].filter((bucket) => bucket.group || bucket.tags.length);
  groupBuckets.forEach(({ group, tags: groupTags }) => {
    const section = document.createElement("section");
    section.className = "content-tag-group";
    const header = document.createElement("header");
    const heading = document.createElement("div");
    heading.append(createIconElement(group?.iconKey || "tag"));
    const title = document.createElement("strong");
    title.textContent = group?.name || "未分组";
    const count = document.createElement("small");
    count.textContent = `${groupTags.length} 个标签`;
    heading.append(title, count);
    const actions = document.createElement("div");
    const add = document.createElement("button");
    add.type = "button";
    add.className = "text-button text-button--quiet";
    add.textContent = "新增标签";
    add.addEventListener("click", () => openContentTagModal(null, group?.id || ""));
    actions.appendChild(add);
    if (group) {
      const edit = document.createElement("button");
      edit.type = "button";
      edit.className = "icon-button";
      edit.title = "编辑分组";
      edit.setAttribute("aria-label", `编辑分组 ${group.name}`);
      edit.appendChild(createIconElement("edit"));
      edit.addEventListener("click", () => openContentTagGroupModal(group));
      actions.appendChild(edit);
    }
    header.append(heading, actions);
    const list = document.createElement("div");
    list.className = "content-tag-list";
    if (groupTags.length) groupTags.forEach((tag) => list.appendChild(createContentTagRow(tag)));
    else {
      const empty = document.createElement("small");
      empty.className = "content-tag-group-empty";
      empty.textContent = "这个分组还没有标签";
      list.appendChild(empty);
    }
    section.append(header, list);
    dom.contentTagGroupList.appendChild(section);
  });
  renderAllContentTagPickers();
}

function applyContentTagSnapshot(snapshot = {}) {
  contentTagState = { ...contentTagState, ...normalizeContentTagSnapshot(snapshot), loading: false, error: "" };
  renderContentTags();
}

async function loadContentTags(options = {}) {
  if (contentTagState.loading) return;
  const method = resolveContentTagApiMethod("get");
  if (!method) {
    contentTagState = { ...contentTagState, loading: false, error: "内容标签数据接口尚未配置" };
    renderContentTags();
    return;
  }
  contentTagState = { ...contentTagState, loading: true, error: "" };
  if (!options.silent) renderContentTags();
  try {
    applyContentTagSnapshot(await method());
  } catch (error) {
    contentTagState = { ...contentTagState, loading: false, error: error?.message || "无法读取内容标签" };
    renderContentTags();
  }
}

async function openContentTagSettings() {
  navigateTo("settings?section=data&panel=content-tags");
  await loadContentTags({ silent: true });
  dom.contentTagsSettingsCard?.scrollIntoView({ block: "start", behavior: "smooth" });
}

async function applyContentTagMutation(operation, payload, successTitle) {
  const result = await callContentTagApi(operation, payload);
  const normalized = normalizeContentTagSnapshot(result);
  if (normalized.groups.length || normalized.tags.length || operation === "deleteTag" || operation === "deleteGroup") {
    applyContentTagSnapshot(result);
  } else {
    await loadContentTags({ silent: true });
  }
  if (successTitle) showToast(successTitle, "内容标签已保存在本机");
  return result;
}

function resetContentTagMergePreview() {
  pendingContentTagMergePreview = null;
  dom.contentTagMergePreview.hidden = true;
  dom.contentTagMergePreview.replaceChildren();
  dom.confirmContentTagMergeRow.hidden = true;
  dom.confirmContentTagMerge.checked = false;
  dom.executeContentTagMergeButton.disabled = true;
}

function selectedContentTagMergeInput() {
  return {
    targetTagId: dom.contentTagMergeTarget.value,
    sourceTagIds: Array.from(dom.contentTagMergeSources.querySelectorAll('input[type="checkbox"]:checked')).map((input) => input.value),
  };
}

function syncContentTagMergeSources() {
  const targetId = dom.contentTagMergeTarget.value;
  dom.contentTagMergeSources.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    input.disabled = input.value === targetId;
    if (input.disabled) input.checked = false;
  });
  resetContentTagMergePreview();
}

function openContentTagMergeModal() {
  const tags = activeContentTags();
  if (tags.length < 2) return;
  populateContentTagSelect(dom.contentTagMergeTarget, tags[0]?.id || "");
  dom.contentTagMergeSources.replaceChildren();
  tags.forEach((tag) => {
    const label = document.createElement("label");
    label.className = "content-tag-merge-source";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = tag.id;
    input.addEventListener("change", resetContentTagMergePreview);
    const name = document.createElement("span");
    name.textContent = tag.canonicalName;
    label.append(input, name);
    dom.contentTagMergeSources.appendChild(label);
  });
  syncContentTagMergeSources();
  openModal(dom.contentTagMergeModal);
}

function renderContentTagMergePreview(preview) {
  const sourceNames = (preview.sourceTags || []).map((tag) => tag.canonicalName).join("、");
  const targetName = preview.targetTag?.canonicalName || activeContentTags().find((tag) => tag.id === preview.targetTagId)?.canonicalName || "目标标签";
  const heading = document.createElement("strong");
  heading.textContent = `${sourceNames} → ${targetName}`;
  const summary = document.createElement("p");
  summary.textContent = `将改写 ${Number(preview.affectedObjectCount) || 0} 个对象中的 ${Number(preview.affectedReferenceCount) || 0} 处引用；来源标签会保留为明确别名并软删除。`;
  const usage = document.createElement("p");
  usage.textContent = `来源标签当前 ${Number(preview.sourceUsage?.referenceCount) || 0} 处引用；目标标签当前 ${Number(preview.targetUsage?.referenceCount) || 0} 处引用。`;
  const types = document.createElement("div");
  types.className = "content-tag-merge-type-counts";
  Object.entries(preview.affectedByType || {}).forEach(([type, count]) => {
    const item = document.createElement("span");
    item.textContent = `${CONTENT_TAG_OBJECT_LABELS[type] || type} ${Number(count) || 0}`;
    types.appendChild(item);
  });
  const note = document.createElement("small");
  note.textContent = "合并不根据名称推断；这里只处理你明确选择的标签。合并后可撤销最近一次操作。";
  dom.contentTagMergePreview.replaceChildren(heading, summary, usage, types, note);
  dom.contentTagMergePreview.hidden = false;
  dom.confirmContentTagMergeRow.hidden = false;
}

function openContentObjectTagsModal(objectType, object, label = "") {
  if (!object?.id) return;
  dom.contentObjectTagType.value = objectType;
  dom.contentObjectTagId.value = object.id;
  dom.contentObjectTagsModalTitle.textContent = `${label || CONTENT_TAG_OBJECT_LABELS[objectType] || "对象"}内容标签`;
  renderContentTagPicker("object", object.tagIds || []);
  openModal(dom.contentObjectTagsModal);
}

function bindZohoConfigEvents() {
  if (!dom.zohoConfigForm || zohoFormEventsBound) return;
  zohoFormEventsBound = true;
  dom.zohoConfigForm.addEventListener("input", () => dirtySettingsPanels.add("zoho"));
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
      dirtySettingsPanels.delete("zoho");
      await loadZohoConnectorStatus();
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
      dirtySettingsPanels.delete("zoho");
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
      dirtySettingsPanels.delete("zoho");
      await loadZohoConnectorStatus();
      renderAll();
      showToast("Zoho Desk 已断开", "网页 Cookie 与已打开会话未被清理");
    } catch (error) {
      showToast("无法断开 Zoho Desk", error?.message || "请稍后重试", "error");
    }
  });
}

function mountZohoConfigForm() {
  let created = false;
  if (!dom.zohoConfigForm) {
    created = true;
    dom.zohoConfigMount.appendChild(dom.zohoConfigTemplate.content.cloneNode(true));
    dom.zohoConfigForm = document.getElementById("zohoConfigForm");
    dom.zohoDisplayName = document.getElementById("zohoDisplayName");
    dom.zohoOrgId = document.getElementById("zohoOrgId");
    dom.zohoApiBase = document.getElementById("zohoApiBase");
    dom.zohoWebBase = document.getElementById("zohoWebBase");
    dom.zohoLookbackDays = document.getElementById("zohoLookbackDays");
    dom.zohoSlaWarningHours = document.getElementById("zohoSlaWarningHours");
    dom.zohoOAuthConfigState = document.getElementById("zohoOAuthConfigState");
    dom.zohoOAuthConfigPath = document.getElementById("zohoOAuthConfigPath");
    dom.connectZohoButton = document.getElementById("connectZohoButton");
    dom.disconnectZohoButton = document.getElementById("disconnectZohoButton");
    bindZohoConfigEvents();
    mountIcons(dom.zohoConfigMount);
  }
  dom.zohoConfigMount.hidden = false;
  dom.toggleZohoConfig.setAttribute("aria-expanded", "true");
  dom.toggleZohoConfig.textContent = "收起";
  void loadZohoConnectorStatus({ preserveForm: !created || dirtySettingsPanels.has("zoho") });
}

function toggleZohoConfigForm(forceOpen = null) {
  const shouldOpen = forceOpen === null ? dom.zohoConfigMount.hidden : Boolean(forceOpen);
  if (shouldOpen) {
    mountZohoConfigForm();
  } else {
    dom.zohoConfigMount.hidden = true;
    dom.toggleZohoConfig.setAttribute("aria-expanded", "false");
    dom.toggleZohoConfig.textContent = "配置";
  }
}

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

function tabGroupsForWorkspaceState(workspaceId, source = appState.tabGroups) {
  return (Array.isArray(source) ? source : [])
    .filter((group) => group.workspaceId === workspaceId && !group.deletedAt)
    .sort((left, right) => Number(left.sortOrder) - Number(right.sortOrder) || String(left.createdAt).localeCompare(String(right.createdAt)));
}

function tabGroupById(groupId) {
  return (appState.tabGroups || []).find((group) => group.id === groupId && !group.deletedAt) || null;
}

function emptyBrowserSnapshot(workspaceId = activeWorkspaceId()) {
  return {
    workspaceId,
    siteId: null,
    activeTabId: null,
    tabs: [],
    tabGroups: tabGroupsForWorkspaceState(workspaceId),
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
      webContentsId: Number.isFinite(Number(tab.webContentsId)) ? Number(tab.webContentsId) : null,
      tabGroupId: tab.tabGroupId ? String(tab.tabGroupId) : null,
      groupSortOrder: Number.isFinite(Number(tab.groupSortOrder)) ? Number(tab.groupSortOrder) : 0,
      lifecycleState: String(tab.lifecycleState || ""),
      audible: tab.audible === true,
      muted: tab.muted === true,
    }));
  const rawGroups = Array.isArray(incoming.tabGroups)
    ? incoming.tabGroups
    : tabGroupsForWorkspaceState(workspaceId);
  const tabGroups = rawGroups
    .filter((group) => group && group.id && !group.deletedAt && String(group.workspaceId || workspaceId) === String(workspaceId))
    .map((group, index) => ({
      id: String(group.id),
      workspaceId: String(group.workspaceId || workspaceId),
      name: String(group.name || "未命名分组"),
      colorKey: String(group.colorKey || "pine"),
      iconKey: String(group.iconKey || "folder"),
      collapsed: group.collapsed === true,
      sortOrder: Number.isFinite(Number(group.sortOrder)) ? Number(group.sortOrder) : index,
      lastActiveSessionId: group.lastActiveSessionId ? String(group.lastActiveSessionId) : null,
      createdAt: group.createdAt || null,
      updatedAt: group.updatedAt || null,
      deletedAt: null,
    }))
    .sort((left, right) => left.sortOrder - right.sortOrder);
  const validGroupIds = new Set(tabGroups.map((group) => group.id));
  tabs.forEach((tab) => {
    if (!validGroupIds.has(tab.tabGroupId)) tab.tabGroupId = null;
  });
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
    tabGroups,
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
    : "正在连接网页";
  dom.webviewPlaceholderDetail.textContent = noAttachedTab && snapshot.tabs.length
    ? "点击独立标签可聚焦窗口，也可以使用“合回”按钮返回栖页主窗口。"
    : "浏览视图会立即显示，网页内容将渐进载入";
  dom.pageActionsButton.disabled = noAttachedTab;
  dom.browserMoreMenu.disabled = !activeTab;
  dom.browserMoreMenu.dataset.tabId = activeTab?.tabId || "";
  const audioVisible = Boolean(activeTab && (activeTab.audible || activeTab.muted));
  dom.browserAudioButton.classList.toggle("is-hidden", !audioVisible);
  dom.browserAudioButton.disabled = !activeTab;
  dom.browserAudioButton.dataset.tabId = activeTab?.tabId || "";
  dom.browserAudioButton.title = activeTab?.muted ? "取消静音当前页" : "静音当前页";
  dom.browserAudioButton.setAttribute("aria-label", dom.browserAudioButton.title);
  const audioIcon = dom.browserAudioButton.querySelector("[data-icon]");
  if (audioIcon) {
    audioIcon.dataset.icon = activeTab?.muted ? "muted" : "volume";
    audioIcon.dataset.iconMounted = "true";
    audioIcon.innerHTML = iconMarkup(audioIcon.dataset.icon);
  }
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

function commitTabOrganizationResult(result) {
  const next = browserStateFromResult(result?.browserState || result);
  if (next) handleBrowserState(next);
  return next;
}

function openTabGroupModal(options = {}) {
  const group = options.group || null;
  dom.tabGroupModalTitle.textContent = group ? "编辑页签组" : "新建页签组";
  dom.tabGroupId.value = group?.id || "";
  dom.tabGroupWorkspaceId.value = group?.workspaceId || options.workspaceId || activeWorkspaceId();
  dom.tabGroupTabIds.value = JSON.stringify(options.tabIds || []);
  dom.tabGroupName.value = group?.name || options.name || "";
  dom.tabGroupColor.value = group?.colorKey || options.colorKey || "pine";
  dom.tabGroupIcon.value = group?.iconKey || options.iconKey || "folder";
  openModal(dom.tabGroupModal);
}

async function toggleTabGroup(group) {
  try {
    const result = await window.siteNest.updateTabGroup(group.id, { collapsed: !group.collapsed });
    commitTabOrganizationResult(result);
  } catch (error) {
    showToast("无法切换分组", error?.message || "请稍后重试", "error");
  }
}

function tabCountForGroup(groupId, workspaceId = null) {
  return allCurrentSessions().filter((session) =>
    session.tabGroupId === groupId && (!workspaceId || session.workspaceId === workspaceId),
  ).length;
}

async function mergeTabGroupWith(source, target) {
  if (!source || !target || source.id === target.id) return;
  const sourceCount = tabCountForGroup(source.id, source.workspaceId);
  const targetCount = tabCountForGroup(target.id, target.workspaceId);
  const confirmed = window.confirm(
    `将“${source.name}”（${sourceCount} 个页签）合并到“${target.name}”（${targetCount} 个页签）？\n\n页签会移动到目标组末尾，网页不会重新加载。`,
  );
  if (!confirmed) return;
  try {
    const result = await window.siteNest.mergeTabGroups(source.id, target.id);
    commitTabOrganizationResult(result);
    showToast("分组已合并", "网页、会话编号和浏览身份均保持不变；可在组菜单撤销一次");
  } catch (error) {
    showToast("无法合并分组", error?.message || "请稍后重试", "error");
  }
}

async function undoLastTabGroupMerge() {
  try {
    commitTabOrganizationResult(await window.siteNest.undoTabGroupMerge());
    showToast("已撤销上次分组合并");
  } catch (error) {
    showToast("无法撤销分组合并", error?.message || "没有可撤销的操作", "error");
  }
}

async function executeTabGroupContextAction(group, action) {
  if (!group?.id || !action) return;
  if (action === "edit") {
    openTabGroupModal({ group });
    return;
  }
  if (action === "toggle") {
    await toggleTabGroup(group);
    return;
  }
  if (action === "ungroup") {
    commitTabOrganizationResult(await window.siteNest.ungroupTabGroup(group.id));
    return;
  }
  if (action.startsWith("merge-group:")) {
    const target = tabGroupById(action.slice("merge-group:".length));
    await mergeTabGroupWith(group, target);
    return;
  }
  if (action === "undo-merge") {
    await undoLastTabGroupMerge();
    return;
  }
  if (action === "close-group") {
    const result = await window.siteNest.closeTabGroup(group.id);
    commitTabOrganizationResult(result);
    if (!result.ok) showToast("批量关闭已停止", result.blocked?.reason || "页签受到保护", "error");
    return;
  }
  if (action === "delete-empty") {
    commitTabOrganizationResult(await window.siteNest.deleteEmptyTabGroup(group.id));
  }
}

async function openTopTabGroupContextMenu(group) {
  if (typeof window.siteNest?.showBrowserTabGroupContextMenu !== "function") {
    openTabGroupContextMenu(group);
    return;
  }
  try {
    const result = await window.siteNest.showBrowserTabGroupContextMenu(group.id);
    await executeTabGroupContextAction(group, result?.action);
  } catch (error) {
    showToast("无法打开分组菜单", error?.message || "请稍后重试", "error");
  }
}

function openTabGroupContextMenu(group, anchor = {}) {
  if (!group?.id) return;
  siteContextMenuTarget = { type: "tab-group", groupId: group.id };
  const title = document.createElement("strong");
  title.className = "app-context-menu-title";
  title.textContent = `${group.name} · ${tabCountForGroup(group.id, group.workspaceId)} 个页签`;
  const divider = document.createElement("div");
  divider.className = "app-context-menu-divider";
  const mergeTargets = tabGroupsForWorkspaceState(group.workspaceId)
    .filter((candidate) => candidate.id !== group.id);
  const buttons = [
    title,
    contextMenuButton("重命名与修改标识", "edit", () => openTabGroupModal({ group })),
    contextMenuButton(group.collapsed ? "展开分组" : "折叠分组", group.collapsed ? "chevron-right" : "chevron-down", () => toggleTabGroup(group)),
    contextMenuButton("将全部页签移出分组", "route", async () => {
      try {
        commitTabOrganizationResult(await window.siteNest.ungroupTabGroup(group.id));
      } catch (error) {
        showToast("无法移出页签", error?.message || "请稍后重试", "error");
      }
    }),
  ];
  mergeTargets.forEach((target) => buttons.push(
    contextMenuButton(`合并到“${target.name}”`, "folder", () => mergeTabGroupWith(group, target)),
  ));
  buttons.push(
    contextMenuButton("撤销上次分组合并", "arrow-left", () => undoLastTabGroupMerge()),
    divider,
    contextMenuButton("关闭分组中的页签", "close", async () => {
      try {
        const result = await window.siteNest.closeTabGroup(group.id);
        commitTabOrganizationResult(result);
        if (!result.ok) showToast("批量关闭已停止", result.blocked?.reason || "页签受到保护", "error");
      } catch (error) {
        showToast("无法关闭分组", error?.message || "请稍后重试", "error");
      }
    }, { danger: true }),
  );
  if (tabCountForGroup(group.id, group.workspaceId) === 0) {
    buttons.push(contextMenuButton("删除空分组", "trash", async () => {
      try {
        commitTabOrganizationResult(await window.siteNest.deleteEmptyTabGroup(group.id));
      } catch (error) {
        showToast("无法删除分组", error?.message || "请稍后重试", "error");
      }
    }, { danger: true }));
  }
  dom.appContextMenu.replaceChildren(...buttons);
  dom.appContextMenu.hidden = false;
  positionAppContextMenu(anchor);
}

async function openSiteGroupSuggestion(session) {
  try {
    const result = await window.siteNest.suggestSiteTabGroups(session.workspaceId);
    const suggestion = (result?.suggestions || []).find((candidate) => candidate.tabIds.includes(session.tabId));
    if (!suggestion) {
      showToast("没有可分组的同站点页签", "至少需要两个明确属于同一 hostname 或已配置站点家族的页签");
      return;
    }
    openTabGroupModal({
      workspaceId: session.workspaceId,
      tabIds: suggestion.tabIds,
      name: suggestion.suggestedName,
    });
  } catch (error) {
    showToast("无法分析站点分组", error?.message || "请稍后重试", "error");
  }
}

function duplicateTabStatusLabels(tab) {
  const labels = [];
  if (tab.audible) labels.push("正在播放声音");
  if (tab.downloading) labels.push("正在下载");
  if (tab.unsavedRisk) labels.push(tab.protectionReason || "可能有未保存内容");
  return labels;
}

function formatSessionLastActive(value) {
  const timestamp = Date.parse(value || "");
  if (!Number.isFinite(timestamp)) return "未知";
  const minutes = Math.max(0, Math.round((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(timestamp));
}

function renderDuplicateTabsReport(report) {
  dom.duplicateTabsGroups.replaceChildren();
  dom.duplicateTabsSimilar.replaceChildren();
  const exactGroups = report?.exact || [];
  if (!exactGroups.length) {
    const empty = document.createElement("div");
    empty.className = "duplicate-tabs-empty";
    empty.textContent = "没有发现完全重复的页签。";
    dom.duplicateTabsGroups.appendChild(empty);
  }
  exactGroups.forEach((group, groupIndex) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "duplicate-tabs-group";
    const legend = document.createElement("legend");
    legend.textContent = `完全重复 · ${group.tabs.length} 个`;
    fieldset.appendChild(legend);
    group.tabs.forEach((tab) => {
      const label = document.createElement("label");
      label.className = `duplicate-tab-choice${tab.unsavedRisk ? " has-risk" : ""}`;
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = `duplicate-keeper-${groupIndex}`;
      radio.value = tab.tabId;
      radio.checked = tab.tabId === group.recommendedKeeperId;
      const copy = document.createElement("span");
      const title = document.createElement("strong");
      title.textContent = tab.title || hostFromUrl(tab.url) || "未命名页签";
      const url = document.createElement("small");
      url.textContent = tab.url;
      const meta = document.createElement("small");
      const status = duplicateTabStatusLabels(tab);
      meta.textContent = `${tab.groupName} · 最后使用 ${formatSessionLastActive(tab.lastActiveAt)}${status.length ? ` · ${status.join(" · ")}` : ""}`;
      copy.append(title, url, meta);
      label.append(radio, copy);
      fieldset.appendChild(label);
    });
    dom.duplicateTabsGroups.appendChild(fieldset);
  });
  const similar = (report?.similar || []).filter((group) => group.tabs.length > 1);
  if (similar.length) {
    const heading = document.createElement("strong");
    heading.textContent = "同站点提示（不会关闭）";
    dom.duplicateTabsSimilar.appendChild(heading);
    similar.forEach((group) => {
      const row = document.createElement("div");
      row.textContent = `${group.hostname} · ${group.tabs.length} 个不同页面`;
      dom.duplicateTabsSimilar.appendChild(row);
    });
  }
  dom.resolveDuplicateTabsButton.disabled = exactGroups.length === 0;
}

async function openDuplicateTabsDialog(workspaceId = activeWorkspaceId()) {
  try {
    duplicateTabsCurrentReport = await window.siteNest.detectDuplicateTabs(workspaceId);
    renderDuplicateTabsReport(duplicateTabsCurrentReport);
    openModal(dom.duplicateTabsModal);
  } catch (error) {
    showToast("无法检测重复页签", error?.message || "请稍后重试", "error");
  }
}

function renderBrowserTabs(value = browserSnapshot) {
  const snapshot = normalizeWorkspaceBrowserState(value, value?.workspaceId || activeWorkspaceId());
  dom.browserTabList.replaceChildren();
  const appendBrowserTab = (tab, target) => {
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
    actions.append(close);
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
      event.dataTransfer.setData("application/x-site-nest-tab", tab.tabId);
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
      if (drag.droppedInside) return;
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
    item.addEventListener("dragover", (event) => {
      const draggedTabId = event.dataTransfer.getData("application/x-site-nest-tab") || browserTabDrag?.tabId;
      if (!draggedTabId || draggedTabId === tab.tabId) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    });
    item.addEventListener("drop", async (event) => {
      const draggedTabId = event.dataTransfer.getData("application/x-site-nest-tab") || browserTabDrag?.tabId;
      if (!draggedTabId || draggedTabId === tab.tabId) return;
      event.preventDefault();
      event.stopPropagation();
      if (browserTabDrag) browserTabDrag.droppedInside = true;
      const dragged = snapshot.tabs.find((candidate) => candidate.tabId === draggedTabId);
      if (!dragged) return;
      try {
        if ((dragged.tabGroupId || null) !== (tab.tabGroupId || null)) {
          commitTabOrganizationResult(await window.siteNest.assignTabsToGroup(
            snapshot.workspaceId,
            [draggedTabId],
            tab.tabGroupId || null,
          ));
        }
        const orderedIds = snapshot.tabs.map((candidate) => candidate.tabId).filter((id) => id !== draggedTabId);
        const targetIndex = orderedIds.indexOf(tab.tabId);
        const rect = item.getBoundingClientRect();
        const insertAfter = event.clientX > rect.left + rect.width / 2;
        orderedIds.splice(targetIndex + (insertAfter ? 1 : 0), 0, draggedTabId);
        commitTabOrganizationResult(await window.siteNest.reorderBrowserTabs(snapshot.workspaceId, orderedIds));
      } catch (error) {
        showToast("无法移动页签", error?.message || "请稍后重试", "error");
      }
    });
    target.appendChild(item);
  };

  const groupedTabIds = new Set();
  const groups = snapshot.tabGroups || [];
  for (const group of groups) {
    const tabs = snapshot.tabs
      .filter((tab) => tab.tabGroupId === group.id)
      .sort((left, right) => left.groupSortOrder - right.groupSortOrder);
    tabs.forEach((tab) => groupedTabIds.add(tab.tabId));
    const wrapper = document.createElement("div");
    wrapper.className = `browser-tab-group color-${group.colorKey}${group.collapsed ? " is-collapsed" : ""}`;
    wrapper.dataset.tabGroupId = group.id;
    const label = document.createElement("button");
    label.type = "button";
    label.className = "browser-tab-group-label";
    label.draggable = true;
    const activeTab = tabs.find((tab) => tab.tabId === snapshot.activeTabId || tab.active);
    label.classList.toggle("is-active", Boolean(activeTab));
    label.title = activeTab
      ? `${group.name} · 当前：${activeTab.title || hostFromUrl(activeTab.url)}`
      : `${group.name} · ${tabs.length} 个页签`;
    label.append(
      createIconElement(group.iconKey || "folder"),
      document.createTextNode(group.name),
    );
    const count = document.createElement("span");
    count.textContent = String(tabs.length);
    label.append(count, createIconElement(group.collapsed ? "chevron-right" : "chevron-down"));
    label.addEventListener("click", () => void toggleTabGroup(group));
    label.addEventListener("contextmenu", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void openTopTabGroupContextMenu(group);
    });
    label.addEventListener("dragstart", (event) => {
      event.dataTransfer.effectAllowed = "move";
      event.dataTransfer.setData("application/x-site-nest-tab-group", group.id);
    });
    label.addEventListener("dragover", (event) => {
      const tabId = event.dataTransfer.getData("application/x-site-nest-tab") || browserTabDrag?.tabId;
      const groupId = event.dataTransfer.getData("application/x-site-nest-tab-group");
      if (tabId || (groupId && groupId !== group.id)) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
      }
    });
    label.addEventListener("drop", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      const tabId = event.dataTransfer.getData("application/x-site-nest-tab") || browserTabDrag?.tabId;
      if (tabId) {
        if (browserTabDrag) browserTabDrag.droppedInside = true;
        try {
          commitTabOrganizationResult(await window.siteNest.assignTabsToGroup(snapshot.workspaceId, [tabId], group.id));
        } catch (error) {
          showToast("无法加入分组", error?.message || "请稍后重试", "error");
        }
        return;
      }
      const sourceGroupId = event.dataTransfer.getData("application/x-site-nest-tab-group");
      const sourceGroup = groups.find((candidate) => candidate.id === sourceGroupId);
      if (!sourceGroup || sourceGroup.id === group.id) return;
      const rect = label.getBoundingClientRect();
      const ratio = (event.clientX - rect.left) / Math.max(1, rect.width);
      if (ratio > 0.25 && ratio < 0.75) {
        await mergeTabGroupWith(sourceGroup, group);
        return;
      }
      const orderedGroupIds = groups.map((candidate) => candidate.id).filter((id) => id !== sourceGroup.id);
      const targetIndex = orderedGroupIds.indexOf(group.id);
      orderedGroupIds.splice(targetIndex + (ratio >= 0.75 ? 1 : 0), 0, sourceGroup.id);
      try {
        commitTabOrganizationResult(await window.siteNest.reorderTabGroups(snapshot.workspaceId, orderedGroupIds));
      } catch (error) {
        showToast("无法调整分组顺序", error?.message || "请稍后重试", "error");
      }
    });
    const tabContainer = document.createElement("div");
    tabContainer.className = "browser-tab-group-tabs";
    if (!group.collapsed) tabs.forEach((tab) => appendBrowserTab(tab, tabContainer));
    wrapper.append(label, tabContainer);
    dom.browserTabList.appendChild(wrapper);
  }
  snapshot.tabs
    .filter((tab) => !groupedTabIds.has(tab.tabId))
    .forEach((tab) => appendBrowserTab(tab, dom.browserTabList));

  dom.browserTabList.ondragover = (event) => {
    if (!event.target.closest(".browser-tab, .browser-tab-group-label") && (browserTabDrag?.tabId || event.dataTransfer.getData("application/x-site-nest-tab"))) {
      event.preventDefault();
    }
  };
  dom.browserTabList.ondrop = async (event) => {
    if (event.target.closest(".browser-tab, .browser-tab-group-label")) return;
    const tabId = event.dataTransfer.getData("application/x-site-nest-tab") || browserTabDrag?.tabId;
    if (!tabId) return;
    event.preventDefault();
    if (browserTabDrag) browserTabDrag.droppedInside = true;
    try {
      commitTabOrganizationResult(await window.siteNest.assignTabsToGroup(snapshot.workspaceId, [tabId], null));
    } catch (error) {
      showToast("无法移出分组", error?.message || "请稍后重试", "error");
    }
  };
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

async function restoreRecentlyClosedBrowserTab(closedId = null) {
  if (typeof window.siteNest?.restoreRecentlyClosedBrowserTab !== "function") {
    showToast("页签恢复尚未配置", "桌面端未提供最近关闭页签恢复接口", "error");
    return;
  }
  try {
    const result = await window.siteNest.restoreRecentlyClosedBrowserTab(closedId, browserBounds());
    commitBrowserTabResult(result);
    showToast(
      "已恢复最近关闭的页签",
      result?.restoredToOriginalGroup ? "已放回原页签组" : "原页签组不存在，已恢复为未分组",
    );
  } catch (error) {
    showToast("无法恢复页签", error?.message || "没有可恢复的最近关闭页签", "error");
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
  if (typeof options.actionCallback === "function" && options.actionLabel) {
    toast.classList.add("has-action");
    const action = document.createElement("button");
    action.type = "button";
    action.className = "toast-action";
    action.textContent = String(options.actionLabel).slice(0, 30);
    action.addEventListener("click", async () => {
      action.disabled = true;
      try { await options.actionCallback(); }
      finally { toast.remove(); }
    });
    toast.appendChild(action);
  }
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
  for (const key of ["configured", "signedIn", "email", "lastSyncAt", "lastRestoreAt", "remoteRevision", "localRevision", "deviceName", "oauthConfigPath", "status", "error", "errorCode", "conflict", "dataHealth", "syncRuntime", "topTone", "animated"]) {
    if (Object.prototype.hasOwnProperty.call(source, key)) next[key] = source[key];
  }
  if (source.identity && typeof source.identity === "object") next.identity = { ...(next.identity || {}), ...source.identity };
  if (source.drive && typeof source.drive === "object") next.drive = { ...(next.drive || {}), ...source.drive };
  if (source.incremental && typeof source.incremental === "object") next.incremental = { ...(next.incremental || {}), ...source.incremental };
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

function renderDataStatus() {
  if (!dom.dataStatusButton) return;
  const tone = googleSyncState.topTone || "neutral";
  const runtime = googleSyncState.syncRuntime || "notConfigured";
  const lastSync = formatGoogleSyncTime(googleSyncState.incremental?.lastSuccessfulSyncAt || googleSyncState.lastSyncAt)
    .replace("上次同步 ", "已同步 · ");
  const title = tone === "error"
    ? runtime === "conflict" ? "存在同步冲突\n点击查看详情" : runtime === "authRequired" ? "Google 授权已失效\n点击查看详情" : "数据或同步失败\n点击查看详情"
    : runtime === "offline" ? "数据正常\n离线，等待同步" : runtime === "notConfigured" ? "本地数据正常\nGoogle Drive 未配置" : `数据正常\n${lastSync}`;
  dom.dataStatusButton.classList.toggle("is-healthy", tone === "healthy");
  dom.dataStatusButton.classList.toggle("is-error", tone === "error");
  dom.dataStatusButton.classList.toggle("is-neutral", tone === "neutral");
  dom.dataStatusButton.classList.toggle("is-syncing", googleSyncState.animated === true);
  dom.dataStatusButton.dataset.health = tone;
  dom.dataStatusButton.title = title;
  dom.dataStatusButton.setAttribute("aria-label", title.replace("\n", "，"));
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
    import: "正在安全导入 OAuth 配置…",
    "sign-in": "正在连接 Google…",
    sync: "正在同步栖页数据…",
    restore: "正在从云端恢复…",
    test: "正在测试 Drive 连接…",
    conflict: "正在处理同步冲突…",
    "sign-out": "正在退出 Google…",
  }[googleSyncBusyAction] || "";
}

function renderGoogleSync() {
  const configured = Boolean(googleSyncState.configured);
  const signedIn = googleSyncState.identity?.status === "signedIn" || Boolean(googleSyncState.signedIn);
  const driveStatus = googleSyncState.drive?.status || googleSyncState.status;
  const driveReady = ["ready", "synced"].includes(driveStatus);
  const busyCopy = googleSyncBusyCopy();
  // A missing desktop OAuth client is an ordinary unconfigured state. Keep the
  // indicator neutral; red is reserved for a configured connection/sync error.
  const hasError = configured && ["permissionDenied", "apiDisabled", "testUserRequired", "networkError", "error"].includes(driveStatus);
  const lastSyncCopy = formatGoogleSyncTime(googleSyncState.lastSyncAt);

  if (!configured) {
    dom.googleSyncCardTitle.textContent = "Google 同步 · Beta";
    dom.googleSyncCardSubtitle.textContent = "点击查看说明";
  } else if (signedIn) {
    dom.googleSyncCardTitle.textContent = `${googleSyncState.email || "Google 已连接"} · Beta`;
    dom.googleSyncCardSubtitle.textContent = busyCopy || (driveReady ? lastSyncCopy : driveStatus === "authorizationRequired" ? "Drive 未授权" : hasError ? "同步异常 · 点击查看" : "需要处理 Drive 授权");
  } else {
    dom.googleSyncCardTitle.textContent = "连接 Google · Beta";
    dom.googleSyncCardSubtitle.textContent = busyCopy || "同步栖页数据";
  }

  dom.googleSyncStateDot.className = "google-sync-state-dot";
  dom.googleSyncStateDot.classList.toggle("is-connected", configured && driveReady && !busyCopy);
  dom.googleSyncStateDot.classList.toggle("is-error", hasError && !busyCopy);
  dom.googleSyncStateDot.classList.toggle("is-busy", Boolean(busyCopy) || ["authorizing", "syncing", "restoring", "tokenExpired"].includes(driveStatus));

  if (!configured) {
    dom.googleSyncAccount.textContent = "尚未配置 Google 同步";
    dom.googleSyncLastSync.textContent = "完成桌面 OAuth 配置后即可连接";
  } else if (signedIn) {
    dom.googleSyncAccount.textContent = googleSyncState.email || "Google 账号已连接";
    dom.googleIdentityStatus.textContent = "已登录";
  } else {
    dom.googleSyncAccount.textContent = "尚未连接 Google";
    dom.googleIdentityStatus.textContent = "未登录";
  }

  const driveLabels = {
    notConfigured: "未配置", authorizationRequired: "未授权", authorizing: "正在授权",
    ready: "已就绪", syncing: "正在同步", synced: "已同步", restoring: "正在恢复",
    tokenExpired: "授权已过期", permissionDenied: "权限不足", apiDisabled: "API 未启用",
    testUserRequired: "需要测试用户", conflict: "存在同步冲突", networkError: "网络错误", error: "同步失败",
  };
  dom.googleDriveStatus.textContent = driveLabels[driveStatus] || "未授权";
  dom.googleSyncLastSync.textContent = busyCopy || (googleSyncState.deviceName && googleSyncState.lastSyncAt
    ? `${lastSyncCopy} · ${googleSyncState.deviceName}` : lastSyncCopy);

  const errorTitles = {
    DRIVE_API_DISABLED: "Google Drive API 未启用",
    DRIVE_SCOPE_MISSING: "尚未授权 Drive 数据同步",
    GOOGLE_TEST_USER_REQUIRED: "当前账号不在 OAuth 测试用户中",
    GOOGLE_AUTH_EXPIRED: "Google Drive 授权已失效",
    GOOGLE_TOKEN_REFRESH_FAILED: "Google Drive 授权已失效",
    GOOGLE_CONFIG_NOT_FOUND: "未找到 Google 桌面 OAuth 配置",
    GOOGLE_CLIENT_CONFIG_MISSING: "未找到 Google 桌面 OAuth 配置",
    GOOGLE_CLIENT_SECRET_UNAVAILABLE: "本机无法读取 OAuth 客户端凭据",
    GOOGLE_CONFIG_SECRET_MISSING: "请选择原始 Google 桌面 OAuth 配置",
    GOOGLE_CONFIG_INVALID_JSON: "Google OAuth 配置不是有效 JSON",
    GOOGLE_CONFIG_CLIENT_TYPE: "OAuth 客户端类型不正确",
    GOOGLE_CONFIG_TOO_LARGE: "Google OAuth 配置文件过大",
    GOOGLE_NETWORK_FAILED: "暂时无法连接 Google Drive",
    GOOGLE_NETWORK_ERROR: "暂时无法连接 Google Drive",
    GOOGLE_REQUEST_TIMEOUT: "Google Drive 请求超时",
  };
  dom.googleSyncErrorTitle.textContent = errorTitles[googleSyncState.errorCode] || (googleSyncState.error ? "Drive 数据同步需要处理" : "");
  dom.googleSyncErrorTitle.classList.toggle("is-hidden", !dom.googleSyncErrorTitle.textContent);

  const configMissing = ["GOOGLE_CONFIG_NOT_FOUND", "GOOGLE_CLIENT_CONFIG_MISSING"].includes(googleSyncState.errorCode);
  dom.googleSyncError.textContent = configMissing && googleSyncState.oauthConfigPath
    ? `${googleSyncState.error}\n预期位置：${googleSyncState.oauthConfigPath}`
    : googleSyncState.error;
  dom.googleSyncError.classList.toggle("is-hidden", !googleSyncState.error);
  const needsAuthorization = !signedIn || ["authorizationRequired", "tokenExpired", "permissionDenied", "testUserRequired"].includes(driveStatus);
  dom.googleSignInButton.classList.toggle("is-hidden", !needsAuthorization);
  dom.googleSyncNowButton.classList.toggle("is-hidden", !driveReady);
  dom.googleRestoreButton.classList.toggle("is-hidden", !driveReady);
  dom.googleTestConnectionButton.classList.toggle("is-hidden", !driveReady);
  dom.googleSignOutButton.classList.toggle("is-hidden", !signedIn);
  dom.googleSignInButtonLabel.textContent = !configured ? "选择 OAuth 配置并登录" : signedIn ? "重新授权 Drive" : "授权云同步";
  dom.googleSyncConflict.classList.toggle("is-hidden", driveStatus !== "conflict");

  const busy = Boolean(googleSyncBusyAction);
  dom.googleSignInButton.disabled = busy;
  dom.googleSyncNowButton.disabled = busy || !driveReady;
  dom.googleRestoreButton.disabled = busy || !driveReady;
  dom.googleTestConnectionButton.disabled = busy || !driveReady;
  dom.googleSignOutButton.disabled = busy || !signedIn;
  dom.googleSyncPopover.setAttribute("aria-busy", String(busy));
  renderDataStatus();
  renderGoogleSettingsStatus();
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

async function importGoogleOAuthAndSignIn() {
  if (googleSyncBusyAction) return;
  if (typeof window.siteNest?.googleImportOAuthClient !== "function") {
    showToast("无法导入 OAuth 配置", "当前桌面端尚未提供配置导入功能", "error");
    return;
  }
  googleSyncBusyAction = "import";
  mergeGoogleSyncState({ error: "" });
  renderGoogleSync();
  let imported = false;
  try {
    const result = await window.siteNest.googleImportOAuthClient();
    mergeGoogleSyncState(result);
    renderGoogleSync();
    if (result?.cancelled) return;
    if (googleSyncState.errorCode && googleSyncState.error) {
      throw new Error(googleSyncState.error);
    }
    imported = Boolean(googleSyncState.configured);
    if (!imported) throw new Error("OAuth 配置导入后仍不可用");
    showToast("OAuth 配置已安全保存", "正在打开系统浏览器完成 Google 授权", "success", {
      key: "google-sync",
      durationMs: 2400,
    });
  } catch (error) {
    showToast("无法导入 OAuth 配置", googleSyncErrorMessage(error), "error", {
      key: "google-sync",
      durationMs: 3600,
    });
  } finally {
    googleSyncBusyAction = "";
    renderGoogleSync();
  }
  if (imported) await runGoogleSyncAction("sign-in");
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
    test: {
      method: "googleTestConnection",
      successTitle: "Google Drive 连接正常",
      successDetail: (result) => result?.health?.empty ? "appDataFolder 可访问，云端暂无栖页同步数据" : "appDataFolder 读写测试通过",
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
    if (googleSyncState.status === "conflict") {
      showToast("发现记录冲突", "栖页不会整库覆盖；请查看冲突记录并逐条确认", "info", { key: "google-sync", durationMs: 3600 });
      return;
    }
    if (googleSyncState.errorCode && googleSyncState.error) {
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

async function resolveGoogleConflict(strategy) {
  if (googleSyncBusyAction || typeof window.siteNest?.googleResolveConflict !== "function") return;
  if (strategy === "cancel") {
    setGoogleSyncPopoverOpen(false, { focusCard: true });
    return;
  }
  googleSyncBusyAction = "conflict";
  renderGoogleSync();
  try {
    const result = await window.siteNest.googleResolveConflict(strategy);
    mergeGoogleSyncState(result);
    if (result?.state) {
      applyReturnedState(result);
      renderAll();
    }
    if (strategy === "details") {
      const records = Array.isArray(result?.conflicts) ? result.conflicts : (result?.diff?.records || []);
      const lines = records.slice(0, 20).map((record, index) => {
        const local = record.localVersion || {};
        const remote = record.remoteVersion || {};
        const title = local.title || local.name || remote.title || remote.name || record.entityId;
        const changedKeys = Array.from(new Set([...Object.keys(local), ...Object.keys(remote)]))
          .filter((key) => JSON.stringify(local[key]) !== JSON.stringify(remote[key]) && !/token|secret|password|cookie|authorization/i.test(key));
        return `${index + 1}. ${record.entityType} · ${title}\n   对象：${record.entityId}\n   差异字段：${changedKeys.slice(0, 8).join("、") || "需要人工核对"}`;
      });
      window.alert(`未解决记录冲突：${records.length} 条\n\n${lines.join("\n\n") || "当前没有可显示的冲突记录。"}${records.length > 20 ? "\n\n仅显示前 20 条。" : ""}`);
    }
  } catch (error) {
    showToast("无法处理同步冲突", googleSyncErrorMessage(error), "error");
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
  if (browserBoundsFrame) return;
  browserBoundsFrame = window.requestAnimationFrame(() => {
    browserBoundsFrame = 0;
    if (!currentSite || !dom.browserPage.classList.contains("is-visible")) return;
    const bounds = browserBounds();
    const key = `${bounds.x}:${bounds.y}:${bounds.width}:${bounds.height}`;
    if (key === lastBrowserBoundsKey) return;
    lastBrowserBoundsKey = key;
    window.siteNest?.setBrowserBounds(bounds);
  });
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
  dom.appShell.classList.toggle(
    "is-browser-active",
    dom.browserPage.classList.contains("is-visible"),
  );
  document.querySelectorAll("[data-route]").forEach((button) => {
    const route = ["bookmarks", "chromeBookmarks", "chrome-bookmarks"].includes(button.dataset.route)
      ? "settings"
      : button.dataset.route;
    button.classList.toggle("is-active", route === currentRoute);
  });
}

function parseSettingsRoute(rawRoute) {
  const raw = String(rawRoute || "").replace(/^#/, "");
  const legacy = {
    bookmarks: { section: "accounts", panel: "chrome-bookmarks" },
    chromeBookmarks: { section: "accounts", panel: "chrome-bookmarks" },
    "chrome-bookmarks": { section: "accounts", panel: "chrome-bookmarks" },
    "settings/chrome-bookmarks": { section: "accounts", panel: "chrome-bookmarks" },
    "settings#zoho": { section: "connections", panel: "zoho" },
    "settings-translation": { section: "translation", panel: "translation" },
    "settings-tasks": { section: "notifications", panel: "notifications" },
    "settings-memory": { section: "browsing", panel: "memory" },
    "settings-popup": { section: "browsing", panel: "popup-policy" },
  };
  if (legacy[raw]) return legacy[raw];
  if (raw === "settings") return { section: "", panel: "" };
  if (!raw.startsWith("settings?")) return null;
  const params = new URLSearchParams(raw.slice(raw.indexOf("?") + 1));
  return {
    section: params.get("section") || "",
    panel: params.get("panel") || "",
  };
}

function navigateTo(route, options = {}) {
  workspacePresentationSequence += 1;
  const requestedRoute = String(route || "home");
  const settingsTarget = parseSettingsRoute(requestedRoute);
  const chromeBookmarksTarget = settingsTarget?.panel === "chrome-bookmarks";
  if (settingsTarget) route = "settings";
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
    const section = options.section || settingsTarget?.section || searchState.settings.settingsLastSection || "general";
    const panel = options.panel || settingsTarget?.panel || "";
    showSettingsSection(section, panel, {
      pushHistory: options.pushHistory !== false,
      force: options.force === true,
    });
    if (chromeBookmarksTarget) requestAnimationFrame(() => dom.chromeBookmarksSettingsSection.focus({ preventScroll: true }));
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
  const activeTab = activeBrowserTab(browserSnapshot);
  const resumeUrl = browserSnapshot.url || currentSite.url;
  try {
    if (currentSite.transient && activeTab?.tabId && typeof window.siteNest?.selectBrowserTab === "function") {
      const result = await window.siteNest.selectBrowserTab(activeTab.tabId, browserBounds());
      const snapshot = browserStateFromResult(result);
      if (snapshot) handleBrowserState(snapshot);
      return;
    }
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
  } else if (action === "detach") {
    await detachBrowserTabToWindow(session.tabId);
  } else if (action === "reattach") {
    await reattachBrowserTab(session.tabId);
  } else if (action === "toggle-mute") {
    commitBrowserTabResult(await window.siteNest.toggleBrowserTabMute(session.tabId));
  } else if (action === "keep-running" || action === "allow-sleep") {
    browserLifecycleState = await window.siteNest.setBrowserTabKeepRunning(session.tabId, action === "keep-running");
    renderBrowserMemorySettings();
    showToast(action === "keep-running" ? "页签将保持运行" : "页签可以自动休眠", sessionTitle(session));
  } else if (action === "suspend") {
    browserLifecycleState = await window.siteNest.suspendBrowserTab(session.tabId);
    renderBrowserMemorySettings();
    showToast("页签已休眠", "再次选择时会恢复原地址和登录身份");
  } else if (action === "new-group") {
    openTabGroupModal({ workspaceId: session.workspaceId, tabIds: [session.tabId] });
  } else if (action.startsWith("assign-group:")) {
    const groupId = action.slice("assign-group:".length);
    commitTabOrganizationResult(await window.siteNest.assignTabsToGroup(session.workspaceId, [session.tabId], groupId));
  } else if (action === "remove-group") {
    commitTabOrganizationResult(await window.siteNest.assignTabsToGroup(session.workspaceId, [session.tabId], null));
  } else if (action === "suggest-site-group") {
    await openSiteGroupSuggestion(session);
  } else if (action === "organize-duplicates") {
    await openDuplicateTabsDialog(session.workspaceId);
  } else if (action === "restore-recently-closed") {
    await restoreRecentlyClosedBrowserTab();
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
    divider.cloneNode(),
    contextMenuButton("添加到新分组", "folder", () => executeSessionContextAction(session, "new-group")),
    ...tabGroupsForWorkspaceState(session.workspaceId)
      .filter((group) => group.id !== session.tabGroupId)
      .map((group) => contextMenuButton(`添加到“${group.name}”`, "folder", () => executeSessionContextAction(session, `assign-group:${group.id}`))),
    ...(session.tabGroupId
      ? [contextMenuButton("从分组移除", "route", () => executeSessionContextAction(session, "remove-group"))]
      : []),
    contextMenuButton("将相同站点页签分组", "grid", () => executeSessionContextAction(session, "suggest-site-group")),
    contextMenuButton("整理重复页签", "copy", () => executeSessionContextAction(session, "organize-duplicates")),
    divider,
    contextMenuButton("恢复最近关闭的页签", "arrow-left", () => executeSessionContextAction(session, "restore-recently-closed")),
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

async function showTabGroup(group) {
  const sessions = allCurrentSessions()
    .filter((session) => session.workspaceId === group.workspaceId && session.tabGroupId === group.id)
    .sort((left, right) => Date.parse(right.lastActiveAt || 0) - Date.parse(left.lastActiveAt || 0));
  if (!sessions.length) {
    if (group.collapsed) await toggleTabGroup(group);
    showToast("这个分组目前没有页签", group.name);
    return;
  }
  if (group.collapsed) {
    try {
      commitTabOrganizationResult(await window.siteNest.updateTabGroup(group.id, { collapsed: false }));
    } catch (error) {
      showToast("无法展开分组", error?.message || "请稍后重试", "error");
      return;
    }
  }
  const preferred = sessions.find((session) => session.tabId === group.lastActiveSessionId) || sessions[0];
  await showSession(preferred);
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
  const appendSessionItem = (session, target) => {
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
    target.appendChild(item);
  };

  const groupedSessionIds = new Set();
  for (const workspace of workspaces()) {
    const workspaceSessions = sessions.filter((session) => session.workspaceId === workspace.id);
    for (const group of tabGroupsForWorkspaceState(workspace.id)) {
      const groupSessions = workspaceSessions.filter((session) => session.tabGroupId === group.id);
      if (!groupSessions.length) continue;
      groupSessions.forEach((session) => groupedSessionIds.add(session.tabId));
      const section = document.createElement("section");
      section.className = "current-session-group";
      section.dataset.tabGroupId = group.id;
      const label = document.createElement("button");
      label.type = "button";
      label.className = "current-session-group-label";
      label.classList.toggle("is-active", groupSessions.some((session) => session.active));
      label.title = `${workspace.name} · ${group.name}`;
      label.append(
        createIconElement(group.collapsed ? "chevron-right" : "chevron-down"),
        createIconElement(group.iconKey || "folder"),
        document.createTextNode(group.name),
      );
      const meta = document.createElement("small");
      meta.textContent = `${workspace.name} · ${groupSessions.length}`;
      label.appendChild(meta);
      label.addEventListener("click", () => void toggleTabGroup(group));
      label.addEventListener("contextmenu", (event) => {
        event.preventDefault();
        event.stopPropagation();
        openTabGroupContextMenu(group, { clientX: event.clientX, clientY: event.clientY, element: label });
      });
      section.appendChild(label);
      if (!group.collapsed) groupSessions.forEach((session) => appendSessionItem(session, section));
      dom.currentSessionList.appendChild(section);
    }
  }
  sessions
    .filter((session) => !groupedSessionIds.has(session.tabId))
    .forEach((session) => appendSessionItem(session, dom.currentSessionList));
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
  const configured = translationStatusCache?.configured === true;
  const legacyUnconfiguredDefault = !configured &&
    publicConfig.baseUrl === "https://api.openai.com/v1" &&
    publicConfig.model === "gpt-4o-mini";
  if (document.activeElement !== dom.translationApiBase) {
    dom.translationApiBase.value = legacyUnconfiguredDefault
      ? DEFAULT_DEEPSEEK_API_BASE
      : publicConfig.baseUrl || DEFAULT_DEEPSEEK_API_BASE;
  }
  if (document.activeElement !== dom.translationModel) {
    dom.translationModel.value = legacyUnconfiguredDefault
      ? DEFAULT_DEEPSEEK_MODEL
      : publicConfig.model || DEFAULT_DEEPSEEK_MODEL;
  }
  dom.translationSourceLanguage.value = settings.sourceLanguage || "auto";
  dom.translationTargetLanguage.value = settings.targetLanguage || "zh-CN";
  dom.translationDefaultMode.value = settings.defaultMode || "bilingual";
  dom.translationSelectionButton.checked = settings.selectionButtonEnabled !== false;
  dom.translationShortPronunciation.value = settings.shortSelectionPronunciationMode || "pronunciation-with-explanation";
  dom.translationShortPronunciationMax.value = String(settings.shortSelectionMaxCharacters || DEFAULT_SHORT_PRONUNCIATION_MAX);
  dom.translationShortPronunciationMax.disabled = dom.translationShortPronunciation.value === "off";
  dom.translationSettingsStatus.textContent = configured ? "DeepSeek 已配置" : "DeepSeek 未配置";
  dom.translationSettingsStatus.classList.toggle("status-pill--success", configured);
  dom.translatePageButton.classList.toggle("is-configured", configured);
  dom.translatePageButton.title = configured ? "使用 DeepSeek 翻译本页" : "翻译本页（DeepSeek 未配置）";
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
    shortSelectionPronunciationMode: dom.translationShortPronunciation.value,
    shortSelectionMaxCharacters: Number(dom.translationShortPronunciationMax.value || DEFAULT_SHORT_PRONUNCIATION_MAX),
  };
}

const TASK_PRIORITY_LABELS = { low: "低", normal: "普通", high: "高", urgent: "紧急" };
const TASK_STATUS_LABELS = { todo: "待办", doing: "进行中", done: "已完成", cancelled: "已取消" };
const TIMELINE_TYPE_LABELS = {
  achievement: "成就",
  turningPoint: "重大转折",
  responsibility: "职责变化",
  projectMilestone: "项目里程碑",
  decision: "重要决定",
  growth: "成长经历",
  personalEvent: "个人事件",
  challenge: "挑战",
  other: "其他",
};
const TIMELINE_IMPORTANCE_LABELS = { normal: "普通", important: "重要", major: "重大" };
const TIMELINE_DIRECTION_LABELS = { positive: "正向", neutral: "平稳", negative: "负向" };

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

function timelineEventForId(eventId) {
  return timelineState.events.find((event) => event.id === String(eventId || "")) || null;
}

function timelineTrackName(trackId) {
  return timelineState.tracks.find((track) => track.id === trackId)?.name || (trackId === "work" ? "工作线" : "个人线");
}

function timelineDateLabel(event) {
  const [year, month, day] = String(event.startDate || "").split("-");
  const start = event.datePrecision === "year"
    ? `${year} 年`
    : event.datePrecision === "month"
      ? `${year} 年 ${Number(month)} 月`
      : `${year} 年 ${Number(month)} 月 ${Number(day)} 日`;
  if (event.ongoing) return `${start}至今`;
  if (!event.endDate) return start;
  const [endYear, endMonth, endDay] = String(event.endDate).split("-");
  const end = event.datePrecision === "year"
    ? `${endYear} 年`
    : event.datePrecision === "month"
      ? `${endYear} 年 ${Number(endMonth)} 月`
      : `${endYear} 年 ${Number(endMonth)} 月 ${Number(endDay)} 日`;
  return `${start}—${end}`;
}

function timelineDateValueForPrecision(value, precision) {
  const text = String(value || "");
  if (precision === "year") return text.slice(0, 4);
  if (precision === "month") {
    if (/^\d{4}$/.test(text)) return `${text}-01`;
    return text.slice(0, 7);
  }
  if (/^\d{4}$/.test(text)) return `${text}-01-01`;
  if (/^\d{4}-\d{2}$/.test(text)) return `${text}-01`;
  return text.slice(0, 10);
}

function configureTimelineDateInput(input, precision, value = input.value) {
  input.type = precision === "year" ? "number" : precision;
  if (precision === "year") {
    input.min = "1";
    input.max = "9999";
    input.step = "1";
  } else {
    input.removeAttribute("min");
    input.removeAttribute("max");
    input.removeAttribute("step");
  }
  input.value = timelineDateValueForPrecision(value, precision);
}

function timelineDefaultTrack(workspaceId) {
  if (workspaceId === "work") return "work";
  if (workspaceId === "personal") return "personal";
  return timelineState.settings.lastTrackId || "personal";
}

function openTimelineEventModal(event = null, draft = {}) {
  const value = event || draft || {};
  const workspaceId = value.workspaceId || activeWorkspaceId();
  const precision = value.datePrecision || "day";
  dom.timelineEventForm.reset();
  dom.timelineEventId.value = event?.id || "";
  dom.timelineEventModalTitle.textContent = event ? "编辑时间轴记录" : "添加时间轴记录";
  dom.timelineEventTitle.value = value.title || "";
  dom.timelineEventTrack.value = value.trackId || timelineDefaultTrack(workspaceId);
  dom.timelineEventWorkspace.value = workspaceId;
  dom.timelineEventType.value = value.type || "other";
  dom.timelineDatePrecision.value = precision;
  configureTimelineDateInput(dom.timelineStartDate, precision, value.startDate || localDateKey(new Date()));
  configureTimelineDateInput(dom.timelineEndDate, precision, value.endDate || "");
  dom.timelineImportance.value = value.importance || "normal";
  dom.timelineImpactDirection.value = value.impactDirection || "neutral";
  dom.timelineImpactLevel.value = String(value.impactLevel || 1);
  dom.timelineOngoing.checked = value.ongoing === true;
  dom.timelineEndDate.disabled = dom.timelineOngoing.checked;
  dom.timelineSummary.value = value.summary || "";
  dom.timelineBackground.value = value.background || "";
  dom.timelineAction.value = value.action || "";
  dom.timelineResult.value = value.result || "";
  dom.timelineImpact.value = value.impact || "";
  dom.timelineEvidence.value = value.evidence || "";
  dom.timelineTags.value = (value.tags || []).join(", ");
  renderContentTagPicker("timeline", value.tagIds || []);
  dom.timelineSourceType.value = value.sourceType || "manual";
  dom.timelineSourceId.value = value.sourceId || "";
  dom.timelineSourceTitle.value = value.sourceTitle || "";
  dom.timelineSourceUrl.value = value.sourceUrl || "";
  dom.timelineSourceHostname.value = value.sourceHostname || "";
  dom.timelineRelatedTaskIds.value = JSON.stringify(value.relatedTaskIds || []);
  const sourceLabel = value.sourceUrl
    ? `来源网页：${value.sourceTitle || value.sourceHostname || value.sourceUrl}\n${value.sourceUrl}`
    : value.relatedTaskIds?.length
      ? `关联任务：${value.relatedTaskIds.join("、")}`
      : "";
  dom.timelineSourcePreview.hidden = !sourceLabel;
  dom.timelineSourcePreview.textContent = sourceLabel;
  dom.deleteTimelineEventButton.classList.toggle("is-hidden", !event);
  openModal(dom.timelineEventModal);
}

function timelineEventFormPayload() {
  let relatedTaskIds = [];
  try { relatedTaskIds = JSON.parse(dom.timelineRelatedTaskIds.value || "[]"); } catch { relatedTaskIds = []; }
  const trackId = dom.timelineEventTrack.value;
  return {
    id: dom.timelineEventId.value || undefined,
    trackId,
    workspaceId: dom.timelineEventWorkspace.value,
    type: dom.timelineEventType.value,
    title: dom.timelineEventTitle.value.trim(),
    summary: dom.timelineSummary.value,
    background: dom.timelineBackground.value,
    action: dom.timelineAction.value,
    result: dom.timelineResult.value,
    impact: dom.timelineImpact.value,
    evidence: dom.timelineEvidence.value,
    startDate: dom.timelineStartDate.value,
    endDate: dom.timelineOngoing.checked ? null : dom.timelineEndDate.value || null,
    datePrecision: dom.timelineDatePrecision.value,
    ongoing: dom.timelineOngoing.checked,
    impactDirection: dom.timelineImpactDirection.value,
    impactLevel: Number(dom.timelineImpactLevel.value) || 1,
    importance: dom.timelineImportance.value,
    tags: dom.timelineTags.value.split(/[,，]/).map((item) => item.trim()).filter(Boolean),
    tagIds: tagIdsForPicker("timeline"),
    relatedTaskIds,
    sourceType: dom.timelineSourceType.value || "manual",
    sourceId: dom.timelineSourceId.value || null,
    sourceTitle: dom.timelineSourceTitle.value || null,
    sourceUrl: dom.timelineSourceUrl.value || null,
    sourceHostname: dom.timelineSourceHostname.value || null,
    iconKey: trackId === "work" ? "grid" : "home",
    accentKey: trackId,
  };
}

function openTaskAsTimelineDraft(task) {
  if (!task || task.status !== "done") return;
  openTimelineEventModal(null, {
    trackId: timelineDefaultTrack(task.workspaceId),
    workspaceId: task.workspaceId,
    type: "achievement",
    title: task.title,
    summary: task.notes || "",
    startDate: localDateKey(task.completedAt || new Date()),
    datePrecision: "day",
    importance: ["urgent", "high"].includes(task.priority) ? "important" : "normal",
    tags: task.tags || [],
    tagIds: task.tagIds || [],
    relatedTaskIds: [task.id],
    sourceType: "task",
    sourceId: task.id,
    sourceTitle: task.title,
    iconKey: "check",
    accentKey: timelineDefaultTrack(task.workspaceId),
  });
}

async function openCurrentPageAsTimelineDraft() {
  try {
    const draft = await window.siteNest.getTimelinePageDraft();
    openTimelineEventModal(null, draft);
  } catch (error) {
    showToast("无法读取当前页面", error?.message || "请确认网页仍然打开", "error");
  }
}

function filteredTimelineEvents() {
  const settings = timelineState.settings;
  const selectedTrackId = settings.selectedTrackId === "work" ? "work" : "personal";
  const query = String(settings.search || "").trim().toLocaleLowerCase("zh-CN");
  return timelineState.events.filter((event) => {
    if (event.trackId !== selectedTrackId) return false;
    const view = timelineTrackView();
    if (view.scope === "month") {
      const start = timelineDateParts(event.startDate);
      const end = timelineDateParts(event.endDate);
      const year = Number(view.selectedYear || timelineState.loadedYear);
      const month = Number(view.selectedMonth);
      const startsBeforeEnd = start && (start.year < year || (start.year === year && start.month <= month));
      const endsAfterStart = event.ongoing || (end && (end.year > year || (end.year === year && end.month >= month)));
      if (!startsBeforeEnd || !((start.year === year && start.month === month) || endsAfterStart)) return false;
    }
    if (settings.typeFilter !== "all" && event.type !== settings.typeFilter) return false;
    if (!query) return true;
    return [
      event.title,
      event.summary,
      event.background,
      event.action,
      event.result,
      event.impact,
      event.evidence,
      event.sourceTitle,
      event.sourceHostname,
      ...(event.tags || []),
    ].join(" ").toLocaleLowerCase("zh-CN").includes(query);
  });
}

function timelineTrackView() {
  const trackId = timelineState.settings.selectedTrackId === "work" ? "work" : "personal";
  return timelineState.settings.trackViews?.[trackId] || {
    selectedYear: Number(timelineState.loadedYear || timelineState.settings.selectedYear) || new Date().getFullYear(),
    selectedMonth: null,
    scope: "year",
    zoom: 1,
  };
}

function timelineDateParts(value) {
  const match = String(value || "").match(/^(\d{4})(?:-(\d{2}))?(?:-(\d{2}))?/);
  return match ? { year: Number(match[1]), month: Number(match[2] || 1), day: Number(match[3] || 1) } : null;
}

function timelineDaysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function timelineImpactValue(event) {
  const level = Math.max(1, Math.min(5, Number(event.impactLevel) || 1));
  return event.impactDirection === "positive" ? level : event.impactDirection === "negative" ? -level : 0;
}

function timelinePosition(event, year, scope, month) {
  const parts = timelineDateParts(event.startDate);
  if (!parts) return 0;
  if (scope === "month") {
    const days = timelineDaysInMonth(year, month);
    if (parts.year < year || (parts.year === year && parts.month < month)) return 0;
    if (parts.year > year || (parts.year === year && parts.month > month)) return 1;
    return Math.max(0, Math.min(1, (parts.day - 1) / Math.max(1, days - 1)));
  }
  if (parts.year < year) return 0;
  if (parts.year > year) return 1;
  return Math.max(0, Math.min(1, ((parts.month - 1) + (parts.day - 1) / timelineDaysInMonth(year, parts.month)) / 12));
}

function timelineEndPosition(event, year, scope, month) {
  if (event.ongoing) return 1;
  const parts = timelineDateParts(event.endDate);
  if (!parts) return null;
  if (scope === "month") {
    const days = timelineDaysInMonth(year, month);
    if (parts.year < year || (parts.year === year && parts.month < month)) return 0;
    if (parts.year > year || (parts.year === year && parts.month > month)) return 1;
    return Math.max(0, Math.min(1, (parts.day - 1) / Math.max(1, days - 1)));
  }
  if (parts.year < year) return 0;
  if (parts.year > year) return 1;
  return Math.max(0, Math.min(1, ((parts.month - 1) + (parts.day - 1) / timelineDaysInMonth(year, parts.month)) / 12));
}

function buildTimelineWaveform(events, year, scope, month) {
  const sampleCount = scope === "month" ? timelineDaysInMonth(year, month) * 4 : 144;
  const values = Array.from({ length: sampleCount + 1 }, () => 0);
  const clusters = new Map();
  const relevantEvents = events.filter((event) => {
    const start = timelineDateParts(event.startDate);
    const end = timelineDateParts(event.endDate);
    if (!start) return false;
    if (scope === "year") return start.year === year || (start.year < year && (event.ongoing || (end && end.year >= year)));
    const startsBeforeEndOfMonth = start.year < year || (start.year === year && start.month <= month);
    const endsAfterStartOfMonth = event.ongoing || (end && (end.year > year || (end.year === year && end.month >= month)));
    return startsBeforeEndOfMonth && ((start.year === year && start.month === month) || endsAfterStartOfMonth);
  });
  relevantEvents.forEach((event) => {
    const position = timelinePosition(event, year, scope, month);
    const magnitude = timelineImpactValue(event);
    const startIndex = Math.round(position * sampleCount);
    const endPosition = timelineEndPosition(event, year, scope, month);
    if ((event.ongoing || event.endDate) && endPosition !== null && endPosition > position) {
      const endIndex = Math.max(startIndex, Math.round(endPosition * sampleCount));
      const ramp = Math.max(2, Math.round(sampleCount * 0.02));
      for (let index = Math.max(0, startIndex - ramp); index <= Math.min(sampleCount, endIndex + ramp); index += 1) {
        const enter = Math.max(0, Math.min(1, (index - (startIndex - ramp)) / ramp));
        const leave = Math.max(0, Math.min(1, ((endIndex + ramp) - index) / ramp));
        values[index] += magnitude * Math.min(enter, leave);
      }
    } else {
      const radius = Math.max(3, Math.round(sampleCount * (scope === "month" ? 0.04 : 0.02)));
      for (let offset = -radius; offset <= radius; offset += 1) {
        const index = startIndex + offset;
        if (index < 0 || index > sampleCount) continue;
        values[index] += magnitude * (1 - Math.abs(offset) / radius);
      }
    }
    const parts = timelineDateParts(event.startDate);
    const key = scope === "month"
      ? `${parts?.year}-${parts?.month}-${parts?.day}`
      : `${parts?.year}-${parts?.month}`;
    if (!clusters.has(key)) clusters.set(key, []);
    clusters.get(key).push(event);
  });
  return {
    events: relevantEvents,
    samples: values.map((value, index) => ({ position: index / sampleCount, value: Math.max(-5, Math.min(5, value)) })),
    clusters: Array.from(clusters.values()).map((items) => ({
      events: items,
      position: timelinePosition(items[0], year, scope, month),
      value: timelineImpactValue(items.slice().sort((left, right) => Number(right.impactLevel) - Number(left.impactLevel))[0]),
    })),
  };
}

function createTimelineEventCard(event) {
  const card = document.createElement("article");
  card.className = "timeline-event-card";
  card.dataset.timelineEventId = event.id;
  card.dataset.track = event.trackId;
  card.dataset.trackLabel = timelineTrackName(event.trackId);
  card.dataset.importance = event.importance;
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  if (event.id === timelineFocusEventId) card.classList.add("is-focused");
  const top = document.createElement("div");
  top.className = "timeline-event-topline";
  const date = document.createElement("span");
  date.textContent = timelineDateLabel(event);
  const badge = document.createElement("span");
  badge.className = `timeline-event-badge${event.importance === "major" ? " timeline-event-badge--major" : ""}`;
  badge.textContent = `${TIMELINE_TYPE_LABELS[event.type] || "其他"} · ${TIMELINE_IMPORTANCE_LABELS[event.importance] || "普通"}`;
  top.append(date, badge);
  const title = document.createElement("h3");
  title.textContent = event.title;
  card.append(top, title);
  if (event.summary) {
    const summary = document.createElement("p");
    summary.textContent = event.summary;
    card.appendChild(summary);
  }
  if (event.tags?.length) {
    const tags = document.createElement("div");
    tags.className = "timeline-event-tags";
    event.tags.slice(0, 5).forEach((tag) => {
      const item = document.createElement("span");
      item.textContent = tag;
      tags.appendChild(item);
    });
    card.appendChild(tags);
  }
  if (event.sourceHostname || event.relatedTaskIds?.length) {
    const source = document.createElement("span");
    source.className = "timeline-event-source";
    source.textContent = event.sourceHostname
      ? `来源：${event.sourceHostname}`
      : `关联 ${event.relatedTaskIds.length} 个任务`;
    card.appendChild(source);
  }
  card.addEventListener("click", () => openTimelineEventModal(event));
  card.addEventListener("keydown", (keyEvent) => {
    if (["Enter", " "].includes(keyEvent.key)) {
      keyEvent.preventDefault();
      openTimelineEventModal(event);
    }
  });
  return card;
}

function renderTimelineCluster(events, anchor) {
  dom.timelineCanvas.querySelector(".timeline-cluster-list")?.remove();
  const panel = document.createElement("section");
  panel.className = "timeline-cluster-list";
  const heading = document.createElement("strong");
  heading.textContent = `${events[0]?.startDate || ""} · ${events.length} 条记录`;
  const close = document.createElement("button");
  close.type = "button";
  close.className = "icon-button";
  close.setAttribute("aria-label", "关闭事件簇");
  close.appendChild(createIconElement("close"));
  close.addEventListener("click", () => panel.remove());
  panel.append(heading, close);
  events.forEach((event) => panel.appendChild(createTimelineEventCard(event)));
  dom.timelineCanvas.appendChild(panel);
  anchor?.setAttribute("aria-expanded", "true");
}

function renderTimelineCanvas(events) {
  dom.timelineCanvas.replaceChildren();
  const settings = timelineState.settings;
  const view = timelineTrackView();
  const year = Number(timelineState.loadedYear || view.selectedYear || settings.selectedYear);
  const month = Number(view.selectedMonth) || 1;
  const scope = view.scope === "month" ? "month" : "year";
  const waveform = buildTimelineWaveform(events, year, scope, month);
  const svgNs = "http://www.w3.org/2000/svg";
  const width = Math.round((scope === "month" ? 1320 : 1180) * (Number(view.zoom) || 1));
  const height = 430;
  const left = 58;
  const right = 34;
  const baseline = 214;
  const amplitude = 31;
  const x = (position) => left + position * (width - left - right);
  const y = (value) => baseline - value * amplitude;
  const svg = document.createElementNS(svgNs, "svg");
  svg.classList.add("timeline-waveform-svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", String(width));
  svg.setAttribute("height", String(height));
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${year} 年${settings.selectedTrackId === "work" ? "工作" : "个人"}${scope === "month" ? `${month} 月` : "年度"}波形时间轴`);
  const baselineLine = document.createElementNS(svgNs, "line");
  baselineLine.setAttribute("x1", String(left));
  baselineLine.setAttribute("x2", String(width - right));
  baselineLine.setAttribute("y1", String(baseline));
  baselineLine.setAttribute("y2", String(baseline));
  baselineLine.classList.add("timeline-waveform-baseline");
  svg.appendChild(baselineLine);
  const path = document.createElementNS(svgNs, "path");
  path.setAttribute("d", waveform.samples.map((sample, index) => `${index ? "L" : "M"}${x(sample.position).toFixed(2)},${y(sample.value).toFixed(2)}`).join(" "));
  path.classList.add("timeline-waveform-path", `timeline-waveform-path--${settings.selectedTrackId}`);
  svg.appendChild(path);
  const labelCount = scope === "month" ? timelineDaysInMonth(year, month) : 12;
  Array.from({ length: labelCount }, (_item, index) => {
    if (scope === "month" && index % 2 !== 0 && index !== labelCount - 1) return;
    const position = scope === "month" ? index / Math.max(1, labelCount - 1) : (index + 0.5) / 12;
    const label = document.createElementNS(svgNs, "text");
    label.textContent = scope === "month" ? String(index + 1) : `${index + 1} 月`;
    label.setAttribute("x", x(position).toFixed(2));
    label.setAttribute("y", "397");
    label.setAttribute("text-anchor", "middle");
    label.classList.add("timeline-waveform-label");
    if (scope === "year") {
      label.setAttribute("tabindex", "0");
      label.setAttribute("role", "button");
      label.setAttribute("aria-label", `查看 ${index + 1} 月`);
      const enterMonth = () => void setTimelineTrackView({ selectedMonth: index + 1, scope: "month" });
      label.addEventListener("click", enterMonth);
      label.addEventListener("keydown", (event) => {
        if (["Enter", " "].includes(event.key)) { event.preventDefault(); enterMonth(); }
      });
    }
    svg.appendChild(label);
  });
  waveform.clusters.forEach((cluster) => {
    const group = document.createElementNS(svgNs, "g");
    group.classList.add("timeline-waveform-node");
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "button");
    group.setAttribute("aria-expanded", "false");
    group.dataset.timelineEventId = cluster.events[0].id;
    group.setAttribute("aria-label", cluster.events.length > 1
      ? `${cluster.events[0].startDate}，${cluster.events.length} 条记录`
      : `${cluster.events[0].startDate}，${cluster.events[0].title}`);
    const title = document.createElementNS(svgNs, "title");
    title.textContent = cluster.events.map((event) => `${event.title} · ${TIMELINE_DIRECTION_LABELS[event.impactDirection] || "平稳"} ${event.impactLevel || 1}`).join("；");
    const circle = document.createElementNS(svgNs, "circle");
    circle.setAttribute("cx", x(cluster.position).toFixed(2));
    circle.setAttribute("cy", y(cluster.value).toFixed(2));
    circle.setAttribute("r", cluster.events.some((event) => event.importance === "major") ? "11" : "8");
    circle.dataset.direction = cluster.value > 0 ? "positive" : cluster.value < 0 ? "negative" : "neutral";
    group.append(title, circle);
    if (cluster.events.length > 1) {
      const count = document.createElementNS(svgNs, "text");
      count.textContent = `+${cluster.events.length - 1}`;
      count.setAttribute("x", x(cluster.position).toFixed(2));
      count.setAttribute("y", (y(cluster.value) + 3.5).toFixed(2));
      count.setAttribute("text-anchor", "middle");
      count.classList.add("timeline-waveform-count");
      group.appendChild(count);
    }
    const activate = () => cluster.events.length === 1
      ? openTimelineEventModal(cluster.events[0])
      : renderTimelineCluster(cluster.events, group);
    group.addEventListener("click", activate);
    group.addEventListener("keydown", (event) => {
      if (["Enter", " "].includes(event.key)) { event.preventDefault(); activate(); }
    });
    svg.appendChild(group);
  });
  const scroller = document.createElement("div");
  scroller.className = "timeline-waveform-scroll";
  scroller.appendChild(svg);
  dom.timelineCanvas.appendChild(scroller);
  if (!waveform.events.length) {
    const empty = document.createElement("p");
    empty.className = "timeline-waveform-empty";
    empty.textContent = `当前${settings.selectedTrackId === "work" ? "工作" : "个人"}时间轴没有记录。`;
    dom.timelineCanvas.appendChild(empty);
  }
}

function renderTimelineList(events) {
  dom.timelineList.replaceChildren();
  const header = document.createElement("div");
  header.className = "timeline-list-header";
  ["日期", "轨道", "类型", "标题", "方向", "影响", "重要", "内容标签", "操作"].forEach((label) => {
    const cell = document.createElement("span");
    cell.textContent = label;
    header.appendChild(cell);
  });
  dom.timelineList.appendChild(header);
  if (!events.length) {
    const empty = document.createElement("div");
    empty.className = "timeline-empty";
    empty.textContent = "当前筛选条件下没有时间轴记录。";
    dom.timelineList.appendChild(empty);
    return;
  }
  events.forEach((event) => {
    const row = document.createElement("article");
    row.className = "timeline-list-row";
    row.dataset.timelineEventId = event.id;
    if (event.id === timelineFocusEventId) row.classList.add("is-focused");
    const values = [
      timelineDateLabel(event),
      timelineTrackName(event.trackId),
      TIMELINE_TYPE_LABELS[event.type] || "其他",
      event.title,
      TIMELINE_DIRECTION_LABELS[event.impactDirection] || "平稳",
      String(event.impactLevel || 1),
      TIMELINE_IMPORTANCE_LABELS[event.importance] || "普通",
      (event.tags || []).join("、") || "—",
    ];
    values.forEach((value, index) => {
      const cell = document.createElement(index === 3 ? "strong" : "span");
      cell.textContent = value;
      row.appendChild(cell);
    });
    const edit = document.createElement("button");
    edit.type = "button";
    edit.textContent = "编辑";
    edit.addEventListener("click", () => openTimelineEventModal(event));
    row.appendChild(edit);
    dom.timelineList.appendChild(row);
  });
}

function renderTimeline() {
  if (!dom.timelinePanel || currentTaskView !== "timeline") return;
  const settings = timelineState.settings;
  const trackView = timelineTrackView();
  if (document.activeElement !== dom.timelineYearInput) dom.timelineYearInput.value = String(timelineState.loadedYear || trackView.selectedYear || settings.selectedYear);
  dom.timelineTrackSwitch.querySelectorAll("[data-timeline-track]").forEach((button) => {
    const active = button.dataset.timelineTrack === settings.selectedTrackId;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  dom.timelineTypeFilter.value = settings.typeFilter || "all";
  if (document.activeElement !== dom.timelineSearchInput) dom.timelineSearchInput.value = settings.search || "";
  dom.timelineViewSwitch.querySelectorAll("[data-timeline-view]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.timelineView === settings.viewMode);
  });
  const events = filteredTimelineEvents();
  const scopeLabel = trackView.scope === "month" ? `${trackView.selectedMonth} 月` : "年度";
  dom.timelineResultSummary.textContent = timelineState.loading
    ? "正在读取本机时间轴…"
    : `${timelineState.loadedYear || trackView.selectedYear || settings.selectedYear} 年 · ${settings.selectedTrackId === "work" ? "工作" : "个人"} · ${scopeLabel} · ${events.length} 条记录`;
  dom.timelineBackToYear.classList.toggle("is-hidden", trackView.scope !== "month");
  dom.timelineMonthNav.classList.toggle("is-hidden", trackView.scope === "month");
  dom.timelineCanvas.hidden = settings.viewMode === "list";
  dom.timelineList.hidden = settings.viewMode !== "list";
  if (settings.viewMode === "list") renderTimelineList(events);
  else renderTimelineCanvas(events);
  dom.timelineMonthNav.querySelectorAll("[data-timeline-month]").forEach((button) => {
    button.classList.toggle("is-active", Number(button.dataset.timelineMonth) === Number(trackView.selectedMonth));
  });
  if (timelineFocusEventId) {
    requestAnimationFrame(() => {
      const target = document.querySelector(`[data-timeline-event-id="${CSS.escape(timelineFocusEventId)}"]`);
      target?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  }
}

function applyTimelineSnapshot(snapshot = {}) {
  timelineState = {
    ...timelineState,
    loadedYear: Number(snapshot.year) || timelineState.loadedYear,
    tracks: Array.isArray(snapshot.tracks) ? snapshot.tracks : timelineState.tracks,
    events: Array.isArray(snapshot.events) ? snapshot.events : timelineState.events,
    settings: snapshot.settings || timelineState.settings,
    review: snapshot.review || timelineState.review,
    loading: false,
  };
  appState.timelineTracks = timelineState.tracks;
  appState.timelineEvents = timelineState.events;
  appState.timelineUiSettings = timelineState.settings;
  renderTimeline();
}

async function loadTimelineYear(year, options = {}) {
  const targetYear = Number(year) || new Date().getFullYear();
  if (!options.force && timelineState.loadedYear === targetYear && !timelineState.loading) {
    renderTimeline();
    return timelineState;
  }
  const requestId = (timelineState.requestId || 0) + 1;
  timelineState = { ...timelineState, loading: true, requestId };
  renderTimeline();
  try {
    const snapshot = await window.siteNest.getTimeline({ year: targetYear, trackId: timelineState.settings.selectedTrackId });
    if (timelineState.requestId !== requestId) return timelineState;
    applyTimelineSnapshot(snapshot);
  } catch (error) {
    timelineState.loading = false;
    renderTimeline();
    showToast("无法读取时间轴", error?.message || "请稍后重试", "error");
  }
  return timelineState;
}

async function setTimelineSettings(patch) {
  try {
    const snapshot = await window.siteNest.updateTimelineSettings(patch);
    applyTimelineSnapshot(snapshot);
    return snapshot;
  } catch (error) {
    showToast("无法保存时间轴视图", error?.message || "请稍后重试", "error");
    return null;
  }
}

async function setTimelineYear(year, options = {}) {
  const target = Math.max(1, Math.min(9999, Number(year) || new Date().getFullYear()));
  if (options.focusEventId) timelineFocusEventId = options.focusEventId;
  const trackId = timelineState.settings.selectedTrackId === "work" ? "work" : "personal";
  const snapshot = await setTimelineSettings({
    selectedYear: target,
    trackViews: { [trackId]: { ...timelineTrackView(), selectedYear: target } },
  });
  if (!snapshot || Number(snapshot.year) !== target) await loadTimelineYear(target, { force: true });
  return timelineState;
}

async function setTimelineTrackView(patch = {}) {
  const trackId = timelineState.settings.selectedTrackId === "work" ? "work" : "personal";
  const nextView = { ...timelineTrackView(), ...patch };
  return setTimelineSettings({
    selectedYear: nextView.selectedYear,
    trackViews: { [trackId]: nextView },
  });
}

function showTimelineReview() {
  const review = timelineState.review;
  if (!review) return;
  dom.timelineReviewTitle.textContent = `${review.year} 年度回顾`;
  dom.timelineReviewStats.replaceChildren();
  [
    ["年度事件", review.stats.total],
    ["工作线", review.stats.work],
    ["个人线", review.stats.personal],
    ["成就", review.stats.achievements],
    ["重大转折", review.stats.turningPoints],
    ["重大事件", review.stats.major],
  ].forEach(([label, value]) => {
    const item = document.createElement("article");
    const small = document.createElement("small");
    small.textContent = label;
    const strong = document.createElement("strong");
    strong.textContent = String(value || 0);
    item.append(small, strong);
    dom.timelineReviewStats.appendChild(item);
  });
  dom.timelineReviewText.textContent = review.text || "本年度暂无记录。";
  openModal(dom.timelineReviewModal);
}

async function exportTimeline(format) {
  try {
    const view = timelineTrackView();
    const result = await window.siteNest.exportTimeline({
      year: timelineState.loadedYear || view.selectedYear || timelineState.settings.selectedYear,
      format,
      trackId: timelineState.settings.selectedTrackId,
      scope: view.scope,
      month: view.selectedMonth,
    });
    if (!result.canceled) showToast("时间轴已导出", result.filePath);
  } catch (error) {
    showToast("无法导出时间轴", error?.message || "请稍后重试", "error");
  }
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
  if (task.status === "done") {
    const timeline = document.createElement("button");
    timeline.type = "button";
    timeline.className = "task-timeline-button";
    timeline.title = "记录为时间轴事件（确认后才创建）";
    timeline.append(createIconElement("route"), document.createTextNode("记录时间轴"));
    timeline.addEventListener("click", (event) => {
      event.stopPropagation();
      openTaskAsTimelineDraft(task);
    });
    card.appendChild(timeline);
  }
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
  renderContentTagPicker("task", task?.tagIds || []);
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
    tagIds: tagIdsForPicker("task"),
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
  const addLabel = currentTaskView === "timeline"
    ? "添加记录"
    : currentTaskView === "habits"
      ? "创建长期目标"
      : "添加任务";
  dom.planAddTaskButton.replaceChildren(
    createIconElement("plus"),
    document.createTextNode(addLabel),
  );
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
  if (currentTaskView === "timeline") {
    renderTimeline();
    const year = Number(timelineState.settings.selectedYear) || new Date().getFullYear();
    if (!timelineState.loading && timelineState.loadedYear !== year) void loadTimelineYear(year);
  }
  if (currentTaskView === "habits") renderHabits();
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

function renderCompanionSettings() {
  if (!dom.companionEnabledSetting) return;
  const settings = appState.uiSettings?.companion || {};
  const wellness = settings.wellness || {};
  dom.companionEnabledSetting.checked = settings.enabled === true;
  dom.companionFocusSeconds.value = String(settings.focusDockSeconds || 30);
  dom.companionWeatherEnabled.checked = settings.weather?.enabled === true;
  dom.companionWeatherCity.value = settings.weather?.city || "";
  dom.companionWeatherPollMinutes.value = String(settings.weather?.pollMinutes || 30);
  dom.companionEyeRestEnabled.checked = wellness.kinds?.["eye-rest"] !== false;
  dom.companionEyeRestMinutes.value = String(wellness.intervalsMinutes?.["eye-rest"] || 20);
  dom.companionWaterEnabled.checked = wellness.kinds?.water !== false;
  dom.companionWaterMinutes.value = String(wellness.intervalsMinutes?.water || 45);
  dom.companionMovementEnabled.checked = wellness.kinds?.movement !== false;
  dom.companionMovementMinutes.value = String(wellness.intervalsMinutes?.movement || 60);
  dom.companionQuietEnabled.checked = settings.quietHours?.enabled === true;
  dom.companionQuietStart.value = settings.quietHours?.start || "22:00";
  dom.companionQuietEnd.value = settings.quietHours?.end || "07:00";
  dom.companionSettingsStatus.textContent = settings.enabled ? "已启用" : "默认关闭";
  dom.companionSettingsStatus.classList.toggle("status-pill--success", settings.enabled === true);
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

const HABIT_STATUS_LABELS = Object.freeze({
  active: "进行中",
  paused: "已暂停",
  completed: "已完成",
  archived: "已归档",
});

const HABIT_FREQUENCY_LABELS = Object.freeze({
  daily: "每天",
  weekdays: "工作日",
  customWeekdays: "指定星期",
  weeklyTarget: "每周次数",
});

function habitForId(habitId) {
  return habitState.habits.find((habit) => habit.id === String(habitId || "")) || null;
}

function usageLevel(day) {
  const seconds = Number(day?.foregroundActiveSeconds) || 0;
  const actions = Number(day?.meaningfulActionCount) || 0;
  if (seconds >= 3600 || actions >= 60) return 4;
  if (seconds >= 1800 || actions >= 30) return 3;
  if (seconds >= 600 || actions >= 10) return 2;
  if (seconds > 0 || actions > 0) return 1;
  return 0;
}

function buildYearDayKeys(year) {
  const days = [];
  const cursor = new Date(Number(year), 0, 1, 12, 0, 0, 0);
  while (cursor.getFullYear() === Number(year)) {
    days.push(localDateKey(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
}

function renderHeatmap(container, year, records, options = {}) {
  if (!container) return;
  const byDate = new Map((Array.isArray(records) ? records : [])
    .map((record) => [record.localDate, record]));
  const grid = document.createElement("div");
  grid.className = "heatmap-grid";
  grid.setAttribute("role", options.clickable ? "grid" : "img");
  grid.setAttribute("aria-label", options.ariaLabel || `${year} 年热力图`);
  const firstDate = new Date(Number(year), 0, 1, 12, 0, 0, 0);
  const firstWeekday = firstDate.getDay() || 7;
  buildYearDayKeys(year).forEach((localDate, index) => {
    const record = byDate.get(localDate) || { localDate };
    const cell = document.createElement(options.clickable ? "button" : "span");
    if (options.clickable) cell.type = "button";
    cell.className = "heatmap-cell";
    cell.style.gridColumn = String(Math.floor((index + firstWeekday - 1) / 7) + 1);
    cell.style.gridRow = String(((index + firstWeekday - 1) % 7) + 1);
    const level = options.mode === "habit"
      ? Math.max(0, Math.min(4, Math.ceil((Number(record.intensity) || 0) * 4)))
      : usageLevel(record);
    cell.dataset.level = String(level);
    if (record.state && record.state !== "none") cell.dataset.state = record.state;
    const detail = options.mode === "habit"
      ? `${localDate} · ${record.state === "completed" ? "已完成" : record.state === "partial" ? "部分完成" : record.state === "skipped" ? "已跳过" : record.scheduled ? "计划日，未打卡" : "非计划日"}`
      : `${localDate} · 前台 ${Math.round((Number(record.foregroundActiveSeconds) || 0) / 60)} 分钟 · ${Number(record.meaningfulActionCount) || 0} 次有效操作`;
    cell.title = detail;
    cell.setAttribute("aria-label", detail);
    if (options.clickable) cell.addEventListener("click", () => options.onDate?.(localDate, record));
    grid.appendChild(cell);
  });
  container.replaceChildren(grid);
}

function usageSummaryFromDays(days, year, today = localDateKey(new Date())) {
  const active = new Set((Array.isArray(days) ? days : [])
    .filter((day) => usageLevel(day) > 0)
    .map((day) => day.localDate));
  const yearPrefix = `${year}-`;
  const monthPrefix = String(today).slice(0, 7);
  let streak = 0;
  const cursor = new Date(`${today}T12:00:00`);
  while (!Number.isNaN(cursor.valueOf()) && active.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    yearActiveDays: Array.from(active).filter((date) => date.startsWith(yearPrefix)).length,
    monthActiveDays: Array.from(active).filter((date) => date.startsWith(monthPrefix)).length,
    currentStreakDays: streak,
    foregroundActiveSeconds: (Array.isArray(days) ? days : []).reduce((sum, day) => sum + (Number(day.foregroundActiveSeconds) || 0), 0),
  };
}

function appendMetric(container, label, value) {
  const item = document.createElement("div");
  item.className = container?.classList.contains("habit-metrics") ? "habit-metric" : "usage-stat";
  const strong = document.createElement("strong");
  strong.textContent = String(value);
  const small = document.createElement("small");
  small.textContent = label;
  item.append(strong, small);
  container.appendChild(item);
}

function renderUsage() {
  const usage = habitState.usage || { enabled: true, days: [], summary: {} };
  const days = Array.isArray(usage.days) ? usage.days : [];
  const year = Number(usage.year || habitState.year) || new Date().getFullYear();
  const summary = { ...usageSummaryFromDays(days, year, habitState.today), ...(usage.summary || {}) };
  if (dom.usageTrackingToggle) dom.usageTrackingToggle.checked = usage.enabled !== false;
  if (dom.usageHomeStats) {
    dom.usageHomeStats.replaceChildren();
    appendMetric(dom.usageHomeStats, "今年活跃天数", summary.yearActiveDays || 0);
    appendMetric(dom.usageHomeStats, "本月活跃天数", summary.monthActiveDays || 0);
    appendMetric(dom.usageHomeStats, "最近连续使用", `${summary.currentStreakDays || 0} 天`);
  }
  renderHeatmap(dom.usageHomeHeatmap, year, days, {
    mode: "usage",
    ariaLabel: `${year} 年栖页使用热力图`,
  });
  if (dom.usageDetailStats) {
    dom.usageDetailStats.replaceChildren();
    appendMetric(dom.usageDetailStats, "今年活跃天数", summary.yearActiveDays || 0);
    appendMetric(dom.usageDetailStats, "本月活跃天数", summary.monthActiveDays || 0);
    appendMetric(dom.usageDetailStats, "最近连续使用", `${summary.currentStreakDays || 0} 天`);
    appendMetric(dom.usageDetailStats, "累计前台使用", `${Math.round((summary.foregroundActiveSeconds || 0) / 60)} 分钟`);
  }
  renderHeatmap(dom.usageDetailHeatmap, year, days, {
    mode: "usage",
    ariaLabel: `${year} 年栖页使用详情热力图`,
  });
  if (dom.openUsageTrackButton) {
    dom.openUsageTrackButton.textContent = usageDetailsVisible
      ? "收起使用热力图"
      : "栖页使用热力图";
    dom.openUsageTrackButton.setAttribute("aria-expanded", String(usageDetailsVisible));
  }
  dom.usageDetailCard?.classList.toggle("is-hidden", !usageDetailsVisible);
}

function createHabitStarBadge(stars, accent = "#8d6d18") {
  const badge = document.createElement("div");
  const display = Number(stars) > 999 ? "999+" : String(Math.max(0, Number(stars) || 0));
  badge.className = "habit-star-badge";
  badge.dataset.digits = String(display.length);
  badge.style.setProperty("--habit-accent", accent);
  badge.title = `累计 ${Number(stars) || 0} 颗坚持星`;
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 48 48");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M24 3.5 30.2 16l13.8 2-10 9.7 2.4 13.7L24 35l-12.4 6.4L14 27.7 4 18l13.8-2z");
  svg.appendChild(path);
  const count = document.createElement("span");
  count.textContent = display;
  badge.append(svg, count);
  return badge;
}

function habitProgress(habit) {
  const stats = habit.stats || {};
  if (habit.targetType === "totalCheckIns" && Number(habit.targetValue) > 0) {
    return {
      label: `${stats.totalCompletedCount || 0}/${habit.targetValue} 次`,
      percent: Math.min(100, Math.round(((stats.totalCompletedCount || 0) / habit.targetValue) * 100)),
    };
  }
  if (habit.targetType === "endDate" && habit.endDate) {
    const start = Date.parse(`${habit.startDate}T12:00:00`);
    const end = Date.parse(`${habit.endDate}T12:00:00`);
    const now = Date.parse(`${habitState.today}T12:00:00`);
    const ratio = end > start ? (now - start) / (end - start) : 1;
    return { label: `坚持至 ${habit.endDate}`, percent: Math.max(0, Math.min(100, Math.round(ratio * 100))) };
  }
  return { label: "长期坚持", percent: Math.min(100, Math.round(Number(stats.monthCompletionRate || 0) * 100)) };
}

function createHabitCard(habit) {
  const card = document.createElement("article");
  card.className = `habit-card is-${habit.status || "active"}`;
  card.dataset.habitId = habit.id;
  card.style.setProperty("--habit-accent", habit.accentColor || "#287f69");
  card.appendChild(createHabitStarBadge(habit.starCount, habit.accentColor));

  const header = document.createElement("div");
  header.className = "habit-card-header";
  const title = document.createElement("div");
  title.className = "habit-card-title";
  const strong = document.createElement("strong");
  strong.textContent = habit.name;
  const frequency = document.createElement("small");
  frequency.textContent = habit.frequencyType === "weeklyTarget"
    ? `每周 ${habit.weeklyTarget || 1} 次`
    : HABIT_FREQUENCY_LABELS[habit.frequencyType] || "长期目标";
  title.append(strong, frequency);
  const status = document.createElement("span");
  status.className = "habit-status-pill";
  status.textContent = HABIT_STATUS_LABELS[habit.status] || "进行中";
  header.append(title, status);

  const metrics = document.createElement("div");
  metrics.className = "habit-metrics";
  const stats = habit.stats || {};
  appendMetric(metrics, stats.streakUnit === "week" ? "连续达标周" : "当前连续天数", `${stats.currentStreak || 0}${stats.streakUnit === "week" ? " 周" : " 天"}`);
  appendMetric(metrics, stats.streakUnit === "week" ? "最长达标周" : "最长连续天数", `${stats.longestStreak || 0}${stats.streakUnit === "week" ? " 周" : " 天"}`);
  appendMetric(metrics, "本月完成", `${stats.monthCompletedCount || 0} 次`);

  const progress = habitProgress(habit);
  const progressBox = document.createElement("div");
  progressBox.className = "habit-progress";
  progressBox.innerHTML = `<div class="habit-progress-copy"><span>${progress.label}</span><span>${progress.percent}%</span></div><div class="habit-progress-track"><span></span></div>`;
  progressBox.style.setProperty("--habit-progress", `${progress.percent}%`);

  const heatmap = document.createElement("div");
  heatmap.className = "habit-heatmap";
  renderHeatmap(heatmap, Number(habit.heatmap?.year || habitState.year), habit.heatmap?.days || [], {
    mode: "habit",
    clickable: habit.status === "active",
    ariaLabel: `${habit.name} ${habitState.year} 年打卡热力图`,
    onDate: (localDate) => void openHabitCheckInModal(habit, localDate),
  });

  const footer = document.createElement("div");
  footer.className = "habit-card-footer";
  const total = document.createElement("small");
  total.textContent = `今年 ${stats.yearCompletedCount || 0} 次 · 累计 ${stats.totalCompletedCount || 0} 次`;
  const actions = document.createElement("div");
  actions.className = "habit-card-actions";
  if (habit.status === "active") {
    const checkIn = document.createElement("button");
    checkIn.type = "button";
    checkIn.className = "primary-button compact-button";
    checkIn.textContent = habit.todayCheckIn ? "修改今日" : "今日打卡";
    checkIn.addEventListener("click", () => void openHabitCheckInModal(habit, habitState.today));
    actions.appendChild(checkIn);
  }
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "secondary-button compact-button";
  edit.textContent = "编辑";
  edit.addEventListener("click", () => openHabitModal(habit));
  actions.appendChild(edit);
  footer.append(total, actions);
  card.append(header, metrics, progressBox, heatmap, footer);
  return card;
}

function renderHabits() {
  if (!dom.habitGrid) return;
  const habits = habitState.habits.filter((habit) => !habit.deletedAt);
  dom.habitTodaySummary.textContent = habits.length
    ? `今日待完成 ${habitState.todayPendingCount || 0} 项 · 全部目标累计 ${habitState.totalStars || 0} 颗坚持星`
    : "创建一个长期目标，例如健身、阅读或英语学习。";
  dom.habitGrid.replaceChildren();
  if (!habits.length) {
    const empty = document.createElement("div");
    empty.className = "habit-empty-state";
    const copy = document.createElement("div");
    copy.innerHTML = "<strong>还没有长期目标</strong><small>创建后，每个目标都会显示独立的年度热力图、连续记录和坚持星。</small>";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "primary-button compact-button";
    button.textContent = "创建长期目标";
    button.addEventListener("click", () => openHabitModal());
    empty.append(copy, button);
    dom.habitGrid.appendChild(empty);
  } else {
    habits.forEach((habit) => dom.habitGrid.appendChild(createHabitCard(habit)));
  }
  renderUsage();
}

function applyHabitSnapshot(snapshot = {}) {
  habitState = {
    year: Number(snapshot.year || habitState.year) || new Date().getFullYear(),
    today: snapshot.today || habitState.today || localDateKey(new Date()),
    habits: Array.isArray(snapshot.habits) ? snapshot.habits : habitState.habits,
    todayPendingCount: Number(snapshot.todayPendingCount) || 0,
    totalStars: Number(snapshot.totalStars) || 0,
    usage: snapshot.usage || habitState.usage,
  };
  renderHabits();
}

async function loadHabits(year = new Date().getFullYear()) {
  if (typeof window.siteNest?.getHabits !== "function") return;
  try {
    applyHabitSnapshot(await window.siteNest.getHabits(year));
  } catch (error) {
    showToast("无法读取习惯打卡", error?.message || "请稍后重试", "error");
  }
}

function syncHabitFrequencyFields() {
  const frequency = dom.habitFrequency.value;
  dom.habitWeeklyTargetField.hidden = frequency !== "weeklyTarget";
  dom.habitWeekdays.hidden = frequency !== "customWeekdays";
}

function syncHabitTargetFields() {
  const targetType = dom.habitTargetType.value;
  const usesCountTarget = targetType === "totalCheckIns";
  const usesEndDate = targetType === "endDate";
  dom.habitTargetValueField.hidden = !usesCountTarget;
  dom.habitTargetValue.disabled = !usesCountTarget;
  dom.habitTargetValue.required = usesCountTarget;
  dom.habitEndDateField.hidden = !usesEndDate;
  dom.habitEndDate.disabled = !usesEndDate;
  dom.habitEndDate.required = usesEndDate;
}

function openHabitModal(habit = null) {
  dom.habitForm.reset();
  dom.habitModalTitle.textContent = habit ? "编辑长期目标" : "创建长期目标";
  dom.habitId.value = habit?.id || "";
  dom.habitName.value = habit?.name || "";
  dom.habitDescription.value = habit?.description || "";
  dom.habitWorkspace.value = habit?.workspaceId || activeWorkspaceId();
  dom.habitStatus.value = habit?.status || "active";
  dom.habitFrequency.value = habit?.frequencyType || "daily";
  dom.habitWeeklyTarget.value = String(habit?.weeklyTarget || 3);
  const weekdays = new Set(habit?.weekdays?.length ? habit.weekdays.map(Number) : [1, 2, 3, 4, 5]);
  dom.habitWeekdays.querySelectorAll('input[type="checkbox"]').forEach((input) => { input.checked = weekdays.has(Number(input.value)); });
  dom.habitStartDate.value = habit?.startDate || localDateKey(new Date());
  dom.habitEndDate.value = habit?.endDate || "";
  dom.habitReminderTime.value = habit?.reminderTime || "";
  dom.habitTargetType.value = habit?.targetType || "none";
  dom.habitTargetValue.value = habit?.targetValue || "";
  dom.habitPartialReward.checked = habit?.partialRewardEnabled === true;
  renderContentTagPicker("habit", habit?.tagIds || []);
  dom.deleteHabitButton.classList.toggle("is-hidden", !habit);
  syncHabitFrequencyFields();
  syncHabitTargetFields();
  openModal(dom.habitModal);
}

function habitFormPayload() {
  const targetType = dom.habitTargetType.value;
  return {
    id: dom.habitId.value || undefined,
    name: dom.habitName.value.trim(),
    description: dom.habitDescription.value,
    workspaceId: dom.habitWorkspace.value,
    status: dom.habitStatus.value,
    frequencyType: dom.habitFrequency.value,
    weekdays: Array.from(dom.habitWeekdays.querySelectorAll('input[type="checkbox"]:checked')).map((input) => Number(input.value)),
    weeklyTarget: Number(dom.habitWeeklyTarget.value) || 1,
    startDate: dom.habitStartDate.value,
    endDate: targetType === "endDate" ? dom.habitEndDate.value || null : null,
    reminderTime: dom.habitReminderTime.value || null,
    reminderOffsets: dom.habitReminderTime.value ? [0] : [],
    targetType,
    targetValue: targetType === "totalCheckIns" ? Number(dom.habitTargetValue.value) || null : null,
    partialRewardEnabled: dom.habitPartialReward.checked,
    tagIds: tagIdsForPicker("habit"),
  };
}

async function openHabitCheckInModal(habit, localDate) {
  let checkIn = null;
  try {
    checkIn = await window.siteNest.getHabitCheckIn?.(habit.id, localDate);
  } catch (error) {
    showToast("无法读取打卡", error?.message || "请稍后重试", "error");
  }
  dom.habitCheckInTitle.textContent = `${habit.name} · ${localDate}`;
  dom.habitCheckInHabitId.value = habit.id;
  dom.habitCheckInDate.value = localDate;
  dom.habitCheckInDate.dataset.checkInId = checkIn?.id || "";
  dom.habitCheckInState.value = checkIn?.state || "completed";
  dom.habitCheckInNote.value = checkIn?.note || "";
  dom.deleteHabitCheckInButton.classList.toggle("is-hidden", !checkIn);
  openModal(dom.habitCheckInModal);
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
    empty.textContent = "没有匹配的本地结果，仍可搜索互联网";
    dom.workSearchResults.appendChild(empty);
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
  const internet = document.createElement("button");
  internet.type = "button";
  internet.className = "work-search-result";
  const engine = searchEngineById();
  const logo = document.createElement("span");
  logo.textContent = engine.icon || "搜";
  logo.style.setProperty("--site-color", "#267d67");
  const copy = document.createElement("span");
  const strong = document.createElement("strong");
  strong.textContent = `使用 ${engine.name} 搜索：${dom.workGlobalSearch.value.trim()}`;
  const small = document.createElement("small");
  small.textContent = "确认后才会联网搜索";
  copy.append(strong, small);
  internet.append(logo, copy, createIconElement("arrow-right"));
  internet.addEventListener("click", () => openGlobalSearchPalette(dom.workGlobalSearch.value.trim()));
  dom.workSearchResults.appendChild(internet);
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
    if (dom.zohoConfigForm && !options.preserveForm) {
      dom.zohoDisplayName.value = result.value.displayName || "Zoho Desk";
      dom.zohoOrgId.value = config.orgId || "";
      dom.zohoApiBase.value = config.apiBase || "https://desk.zoho.com/api/v1";
      dom.zohoWebBase.value = config.webBaseUrl || "https://desk.zoho.com";
      dom.zohoLookbackDays.value = String(config.lookbackDays || 30);
      dom.zohoSlaWarningHours.value = String(config.slaWarningHours || 4);
    }
    if (dom.zohoOAuthConfigPath) dom.zohoOAuthConfigPath.textContent = result.value.oauthConfigPath || "";
    if (dom.zohoOAuthConfigState) {
      dom.zohoOAuthConfigState.textContent = result.value.clientConfigAvailable
        ? "桌面 OAuth 配置已就绪"
        : "尚未找到 Zoho 桌面 OAuth 配置";
    }
    dom.zohoSettingsStatus.textContent = result.value.connected
      ? "Zoho 已连接"
      : result.value.status === "error"
        ? "Zoho 连接失败"
        : "Zoho 未连接";
    dom.zohoSettingsStatus.className = `status-pill${result.value.connected ? " status-pill--ready" : result.value.status === "error" ? " status-pill--error" : ""}`;
    dom.zohoConnectorSummary.textContent = result.value.connected
      ? `${result.value.currentUser?.name || result.value.currentUser?.email || "已连接"} · ${formatConnectorTime(result.value.lastSyncAt)}`
      : result.value.status === "error"
        ? `连接失败 · ${result.value.lastErrorMessage || "请检查配置"}`
        : config.orgId ? "配置已保存 · 尚未授权" : "只读工单分诊 · 尚未配置";
    if (dom.connectZohoButton) {
      dom.connectZohoButton.disabled = !result.value.clientConfigAvailable || !config.orgId;
      dom.connectZohoButton.textContent = result.value.connected ? "重新授权" : "连接 Zoho Desk";
      dom.disconnectZohoButton.disabled = !result.value.connected;
    }
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
  const allWorkspaces = dom.siteWorkspaceFilter.value === "all";
  const scope = allWorkspaces ? appState.sites : sitesForWorkspace();
  const queryActive = Boolean(dom.siteSearch.value.trim() || dom.siteFilter.value !== "all");
  const scopeLabel = allWorkspaces ? "全部空间" : workspaceName(activeWorkspaceId());
  dom.siteLibraryTotal.textContent = queryActive
    ? `${scopeLabel} · ${matches.length} / ${scope.length} 个站点`
    : `${scopeLabel} · ${scope.length} 个站点`;
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
  renderCompanionSettings();
  const siteCount = appState.sites.length;
  dom.sidebarSiteCount.textContent = siteCount > 99 ? "99+" : String(siteCount);
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
  renderGoogleSettingsStatus();
  renderSearchEngineControls();
  renderSearchHistory();
  renderBrowserEmptyRecent();
  renderCompanionShell();
  if (currentRoute === "home") setVisibleLocalPage("home");
  if (currentRoute === "settings") renderBookmarks();
}

function openModal(modal) {
  window.siteNest?.hideBrowser();
  dom.companionBubble.hidden = true;
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
  renderContentTagPicker("site", preset.tagIds || []);
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
  renderContentTagPicker("site", site.tagIds || []);
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
    if (dom.brandVersion && info?.version) {
      dom.brandVersion.textContent = `${info.version}${info.development ? " DEV" : ""}`;
      dom.brandVersion.title = info.prodLocal ? "本地生产配置" : info.development ? "开发运行" : "正式构建";
    }
    if (info?.dataFile) {
      dom.dataPathDisplay.textContent = info.dataFile;
      dom.dataPathDisplay.title = info.dataFile;
    }
  } catch {
    dom.dataPathDisplay.textContent = "无法读取数据目录";
  }
}

function userScriptSourceLabel(sourceType) {
  return { builtIn: "内置", localFile: "本地文件", pasted: "粘贴", remoteUrl: "远程 URL", createdInApp: "栖页创建" }[sourceType] || "本地";
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
    card.dataset.deleted = String(Boolean(script.deletedAt));
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
      script.lastRunAt ? `最近运行 ${formatAutomationTime(script.lastRunAt)}` : "尚未运行",
      script.runtimeStats?.runCount ? `${script.runtimeStats.runCount} 次运行 · ${script.runtimeStats.failureCount || 0} 次失败` : "无运行指标",
    ].forEach((value) => { const span = document.createElement("span"); span.textContent = value; meta.appendChild(span); });
    if (script.disabledReason) {
      const disabledReason = document.createElement("p");
      disabledReason.className = "userscript-disabled-reason";
      disabledReason.textContent = script.disabledReason;
      copy.append(heading, description, meta, disabledReason);
    } else {
      copy.append(heading, description, meta);
    }
    const toggle = document.createElement("label");
    toggle.className = "toggle-control userscript-toggle";
    const input = document.createElement("input");
    input.type = "checkbox";
    const currentHost = hostFromUrl(browserSnapshot.url || "").toLowerCase();
    const isBuiltIn = script.sourceType === "builtIn";
    input.checked = isBuiltIn
      ? Boolean(currentHost && script.approvedSites?.includes(currentHost))
      : script.enabled === true;
    input.disabled = Boolean(script.deletedAt);
    const track = document.createElement("span");
    track.className = "toggle-track";
    track.appendChild(document.createElement("span"));
    toggle.append(input, track, document.createTextNode(script.deletedAt ? "回收站" : isBuiltIn ? "当前网站" : script.enabled ? "已启用" : "已停用"));
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
    if (script.deletedAt) {
      const restore = document.createElement("button");
      restore.type = "button";
      restore.className = "secondary-button compact-button";
      restore.textContent = "恢复脚本";
      restore.addEventListener("click", () => void restoreInstalledUserScript(script));
      actions.appendChild(restore);
    }
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
    if (!script.deletedAt && script.sourceType !== "builtIn" && currentHost && currentLoginPage) {
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
    if (!script.deletedAt && (script.updateUrl || script.downloadUrl || (script.sourceType === "remoteUrl" && script.sourceUrl))) {
      const update = document.createElement("button");
      update.type = "button";
      update.className = "secondary-button compact-button";
      update.textContent = "检查更新";
      update.addEventListener("click", () => void reviewUserScriptUpdate(script, update));
      actions.appendChild(update);
    }
    const localhostHosts = (script.connects || [])
      .map((value) => String(value).toLowerCase().replace(/^\[|\]$/g, ""))
      .filter((value) => ["localhost", "127.0.0.1", "::1"].includes(value));
    for (const hostname of localhostHosts) {
      const approved = script.localhostApprovedHosts?.includes(hostname) === true;
      const localButton = document.createElement("button");
      localButton.type = "button";
      localButton.className = "secondary-button compact-button";
      localButton.textContent = approved ? `撤销 ${hostname}` : `允许 ${hostname}`;
      localButton.disabled = Boolean(script.deletedAt);
      localButton.addEventListener("click", () => void setUserScriptLocalhostApproval(script, hostname, !approved));
      actions.appendChild(localButton);
    }
    const previousVersions = (userScriptState.versions || [])
      .filter((item) => item.scriptId === script.id && item.sourceHash !== script.sourceHash)
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    if (!script.deletedAt && previousVersions[0]) {
      const rollback = document.createElement("button");
      rollback.type = "button";
      rollback.className = "secondary-button compact-button";
      rollback.textContent = `回滚到 v${previousVersions[0].version}`;
      rollback.addEventListener("click", () => void rollbackInstalledUserScript(script, previousVersions[0]));
      actions.appendChild(rollback);
    }
    const tagButton = document.createElement("button");
    tagButton.type = "button";
    tagButton.className = "secondary-button compact-button";
    tagButton.append(createIconElement("tag"), document.createTextNode("内容标签"));
    tagButton.addEventListener("click", () => openContentObjectTagsModal("userScript", script, `${script.name} · `));
    actions.appendChild(tagButton);
    if (!script.deletedAt && script.sourceType !== "builtIn") {
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "text-button text-button--danger";
      remove.textContent = "移到回收站";
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
    versions: Array.isArray(snapshot.versions) ? snapshot.versions : userScriptState.versions,
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
  dom.userScriptInstallTitle.textContent = type === "remoteUrl" ? "检查远程脚本" : type === "createdInApp" ? "新建网页脚本" : "检查粘贴脚本";
  dom.userScriptRemoteField.hidden = type !== "remoteUrl";
  dom.userScriptSourceField.hidden = type === "remoteUrl";
  if (type === "createdInApp") {
    dom.userScriptSourceCode.value = `// ==UserScript==
// @name         新建网页脚本
// @namespace    local.qiye.userscripts
// @version      0.1.0
// @description  在栖页中创建
// @match        https://example.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // 在这里编写脚本。
})();
`;
  }
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
  dom.userScriptReviewMatches.textContent = [
    `@run-at ${review.runAt || "document-end"}`,
    ...(review.matches || []).map((item) => `@match ${item}`),
    ...(review.includes || []).map((item) => `@include ${item}`),
    ...(review.excludes || []).map((item) => `@exclude ${item}`),
  ].join("\n") || "未声明（不会自动运行）";
  dom.userScriptReviewPermissions.textContent = [
    ...(review.grants || []).map((item) => `@grant ${item}`),
    ...(review.connects || []).map((item) => `@connect ${item}`),
    ...(review.requires || []).map((item) => `@require ${item}（当前不支持）`),
    ...(review.resources || []).map((item) => `@resource ${item}（当前不支持）`),
    review.updateUrl ? `@updateURL ${review.updateUrl}` : "",
    review.downloadUrl ? `@downloadURL ${review.downloadUrl}` : "",
  ].filter(Boolean).join("\n") || "无宿主权限；不允许跨域请求";
  const changes = [];
  if (review.versionChange) changes.push(`版本：${review.versionChange.from || "未声明"} → ${review.versionChange.to || "未声明"}`);
  for (const [label, difference] of [
    ["权限", review.permissionChanges],
    ["匹配网址", review.domainChanges?.matches],
    ["包含网址", review.domainChanges?.includes],
    ["排除网址", review.domainChanges?.excludes],
    ["跨域范围", review.domainChanges?.connects],
  ]) {
    if (!difference) continue;
    if (difference.added?.length) changes.push(`${label}新增：${difference.added.join("、")}`);
    if (difference.removed?.length) changes.push(`${label}移除：${difference.removed.join("、")}`);
  }
  dom.userScriptReviewChangesSection.hidden = !review.updateOf;
  dom.userScriptReviewChanges.textContent = changes.join("\n") || "Metadata 权限和网址范围没有变化";
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
  if (!window.confirm(`将“${script.name}”移到回收站？脚本会立即停用，但版本、存储和执行记录会保留。`)) return;
  try {
    applyUserScriptSnapshot(await window.siteNest.removeUserScript(script.id));
    showToast("脚本已移到回收站", `${script.name} · 版本、存储和记录均已保留`, "success", {
      actionLabel: "撤销",
      actionCallback: () => restoreInstalledUserScript(script),
      durationMs: 15_000,
    });
  }
  catch (error) { showToast("无法移除脚本", error?.message || "请稍后重试", "error"); }
}

async function restoreInstalledUserScript(script) {
  try {
    applyUserScriptSnapshot(await window.siteNest.restoreUserScript(script.id));
    showToast("脚本已恢复", `${script.name} · 仍保持停用，请核对后手动启用`);
  } catch (error) { showToast("无法恢复脚本", error?.message || "请稍后重试", "error"); }
}

async function rollbackInstalledUserScript(script, version) {
  try {
    applyUserScriptSnapshot(await window.siteNest.rollbackUserScriptVersion(script.id, version.sourceHash));
    showToast("脚本已回滚", `${script.name} · v${version.version}`);
  } catch (error) { showToast("脚本未回滚", error?.message || "请稍后重试", "error"); }
}

async function setUserScriptLocalhostApproval(script, hostname, approved) {
  try {
    applyUserScriptSnapshot(await window.siteNest.setUserScriptLocalhostApproved(script.id, hostname, approved));
    showToast(approved ? "已允许访问本机服务" : "已撤销本机访问", `${script.name} · ${hostname}`);
  } catch (error) { showToast("本机访问授权未更改", error?.message || "请重新确认", "error"); }
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
  const canRecordTimeline = /^https?:\/\//i.test(contextUrl);
  if (canRecordTimeline) {
    const timeline = document.createElement("button");
    timeline.type = "button";
    timeline.className = "page-action-item";
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = "记录到时间轴";
    const detail = document.createElement("small");
    detail.textContent = "读取标题、脱敏网址与最多 1000 字选中文本；确认后才保存";
    copy.append(title, detail);
    timeline.append(createIconElement("route"), copy, createIconElement("chevron-right"));
    timeline.addEventListener("click", () => void openCurrentPageAsTimelineDraft());
    dom.pageActionList.appendChild(timeline);
  }
  if (!normalized.actions.length && !canRecordTimeline) {
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
  if (pageActionPanelOpen && companionPanelOpen) setCompanionPanelOpen(false);
  activeRightPanel = pageActionPanelOpen ? "page-actions" : activeRightPanel === "page-actions" ? null : activeRightPanel;
  dom.pageActionPanel.hidden = !pageActionPanelOpen;
  dom.browserContent.classList.toggle("is-action-panel-open", pageActionPanelOpen);
  dom.pageActionPanel.setAttribute("aria-hidden", String(!pageActionPanelOpen));
  dom.pageActionsButton.setAttribute("aria-expanded", String(pageActionPanelOpen));
  dom.pageActionsButton.classList.toggle("is-active", pageActionPanelOpen);
  if (pageActionPanelOpen) void refreshPageActions();
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
}

function companionEnabled() {
  return appState.uiSettings?.companion?.enabled === true;
}

function companionHardHidden() {
  return companionRuntime.temporarilyHidden === true
    || ["fullscreen", "screen-sharing", "system-away"].includes(companionRuntime.quietReason);
}

function renderCompanionShell() {
  const enabled = companionEnabled();
  const browserVisible = dom.browserPage.classList.contains("is-visible");
  const visible = browserVisible
    && !companionHardHidden()
    && (!enabled || companionRuntime.state !== "silentHidden");
  dom.companionEdgeRail.hidden = !visible;
  dom.companionEdgeRail.classList.toggle("is-companion-disabled", !enabled);
  dom.browserContent.classList.toggle("is-companion-enabled", visible);
  if (!visible && companionPanelOpen) setCompanionPanelOpen(false);
  dom.companionDock.setAttribute("aria-expanded", String(companionPanelOpen));
  dom.companionDock.title = enabled ? "小序" : "打开小序（尚未启用）";
  dom.companionWeatherButton.disabled = !enabled;
  dom.companionAssistantButton.disabled = !enabled;
  dom.companionPauseButton.disabled = !enabled;
  dom.companionQuickAskInput.disabled = !enabled;
  dom.companionQuickAskSend.disabled = !enabled;
  requestAnimationFrame(() => requestAnimationFrame(syncBrowserBounds));
}

function renderCompanionRuntime(snapshot = companionRuntime) {
  companionRuntime = { ...companionRuntime, ...(snapshot || {}) };
  const labels = { idle: "待机", focusedDocked: "专注中", resting: "休息中", bubbleTip: "轻提示", expanded: "已展开", silentHidden: "已隐藏" };
  dom.companionStateLabel.textContent = companionEnabled() ? (labels[companionRuntime.state] || "待机") : "未启用";
  dom.companionDock.dataset.state = companionRuntime.state;
  const reminder = companionRuntime.reminder;
  dom.companionBubble.hidden = !(reminder && companionRuntime.state === "bubbleTip" && companionEnabled());
  dom.companionBubble.textContent = reminder?.message || "";
  if (reminder) dom.companionGreeting.textContent = reminder.message;
  else if (companionRuntime.quietReason) dom.companionGreeting.textContent = "当前处于安静状态，我不会主动打扰。";
  else dom.companionGreeting.textContent = "我会安静地陪在这里。";
  renderCompanionShell();
}

function renderCompanionHome() {
  dom.companionContent.replaceChildren();
  const empty = document.createElement("div");
  empty.className = "companion-empty";
  const title = document.createElement("strong");
  const detail = document.createElement("small");
  const actions = document.createElement("div");
  actions.className = "companion-ai-actions";
  if (companionEnabled()) {
    title.textContent = "小序已在当前窗口待命";
    detail.textContent = "天气和健康提醒仍分别遵循设置；不会因为打开面板而自动联网或读取网页正文。";
  } else {
    title.textContent = "小序尚未启用";
    detail.textContent = "入口会一直保留。你可以只启用基础伴随功能，天气、健康提醒和网页 AI 都不会随之自动开启。";
    const enable = document.createElement("button");
    enable.type = "button";
    enable.className = "primary-button compact-button";
    enable.dataset.actionId = "companion.toggle";
    enable.textContent = "启用基础小序";
    enable.addEventListener("click", async () => {
      enable.disabled = true;
      const current = appState.uiSettings?.companion || {};
      try {
        const result = await window.siteNest.updateUiSettings({
          companion: {
            ...current,
            enabled: true,
            onboardingSeen: true,
            weather: { ...(current.weather || {}), enabled: false },
            wellness: {
              ...(current.wellness || {}),
              enabled: true,
              kinds: { "eye-rest": false, water: false, movement: false },
            },
          },
        });
        appState = result.state || { ...appState, uiSettings: result.uiSettings };
        renderCompanionSettings();
        renderCompanionRuntime(await window.siteNest.getCompanionRuntime());
        renderCompanionHome();
        showToast("小序已启用", "天气、健康提醒和网页 AI 仍保持关闭或按需使用");
      } catch (error) {
        enable.disabled = false;
        showToast("无法启用小序", error?.message || "请稍后重试", "error");
      }
    });
    actions.appendChild(enable);
  }
  const settings = document.createElement("button");
  settings.type = "button";
  settings.className = "secondary-button compact-button";
  settings.dataset.actionId = "companion.settings.open";
  settings.textContent = "打开小序设置";
  settings.addEventListener("click", () => {
    setCompanionPanelOpen(false);
    navigateTo("settings");
    showSettingsSection("notifications", "companion");
  });
  actions.appendChild(settings);
  empty.append(title, detail, actions);
  dom.companionContent.appendChild(empty);
}

function weatherValue(value, suffix = "") {
  return Number.isFinite(Number(value)) ? `${Math.round(Number(value))}${suffix}` : "—";
}

function renderCompanionWeather(status = companionWeather) {
  companionWeather = { ...companionWeather, ...(status || {}) };
  const pillSnapshot = companionWeather.snapshot;
  dom.companionWeatherText.textContent = pillSnapshot
    ? `${weatherValue(pillSnapshot.temperature, "℃")} ${pillSnapshot.condition || "天气"}`
    : companionWeather.configured ? "天气待更新" : "天气未配置";
  if (dom.companionContent.dataset.panel !== "weather") return;
  dom.companionContent.replaceChildren();
  if (!companionWeather.configured) {
    const empty = document.createElement("div");
    empty.className = "companion-empty";
    const title = document.createElement("strong");
    title.textContent = "天气尚未配置";
    const detail = document.createElement("small");
    detail.textContent = "在“设置与数据 → 计划与通知”中开启天气并填写城市。";
    empty.append(title, detail);
    dom.companionContent.appendChild(empty);
    return;
  }
  const snapshot = companionWeather.snapshot;
  if (!snapshot) {
    const empty = document.createElement("div");
    empty.className = "companion-empty";
    const title = document.createElement("strong");
    title.textContent = companionWeather.status === "refreshing" ? "正在获取天气" : "尚无天气数据";
    const refresh = document.createElement("button");
    refresh.type = "button";
    refresh.className = "secondary-button compact-button";
    refresh.textContent = "手动刷新";
    refresh.addEventListener("click", () => void refreshCompanionWeather());
    empty.append(title, refresh);
    dom.companionContent.appendChild(empty);
    return;
  }
  const card = document.createElement("div");
  card.className = "companion-weather-card";
  const heading = document.createElement("div");
  const city = document.createElement("strong");
  city.textContent = snapshot.city || "当前城市";
  const condition = document.createElement("small");
  condition.textContent = `${snapshot.condition || "天气未知"}${snapshot.stale ? " · 数据可能已过期" : ""}`;
  heading.append(city, condition);
  const temperature = document.createElement("span");
  temperature.className = "companion-weather-temperature";
  temperature.textContent = weatherValue(snapshot.temperature, "℃");
  card.append(heading, temperature);
  const metrics = document.createElement("div");
  metrics.className = "companion-weather-metrics";
  const rain = Math.max(...(snapshot.nextHours || []).map((item) => Number(item.precipitationProbability) || 0), 0);
  [["体感", weatherValue(snapshot.apparentTemperature, "℃")], ["高 / 低", `${weatherValue(snapshot.todayHigh, "°")} / ${weatherValue(snapshot.todayLow, "°")}`], ["两小时降雨", `${Math.round(rain)}%`], ["风速", weatherValue(snapshot.windSpeed, " km/h")]].forEach(([label, value]) => {
    const row = document.createElement("div");
    const key = document.createElement("small");
    key.textContent = label;
    const text = document.createElement("strong");
    text.textContent = value;
    row.append(key, text);
    metrics.appendChild(row);
  });
  const footer = document.createElement("div");
  footer.className = "companion-weather-footer";
  const updated = document.createElement("small");
  updated.textContent = `更新：${snapshot.fetchedAt ? new Date(snapshot.fetchedAt).toLocaleString("zh-CN", { hour12: false }) : "未知"} · Open-Meteo`;
  const refresh = document.createElement("button");
  refresh.type = "button";
  refresh.className = "text-button";
  refresh.textContent = companionWeather.status === "refreshing" ? "刷新中…" : "刷新";
  refresh.disabled = companionWeather.status === "refreshing";
  refresh.addEventListener("click", () => void refreshCompanionWeather());
  footer.append(updated, refresh);
  dom.companionContent.append(card, metrics, footer);
}

async function loadCompanionWeather() {
  const status = await window.siteNest?.getCompanionWeather?.();
  renderCompanionWeather(status);
}

async function refreshCompanionWeather() {
  companionWeather.status = "refreshing";
  renderCompanionWeather(companionWeather);
  const result = await window.siteNest?.refreshCompanionWeather?.();
  renderCompanionWeather(result?.status || companionWeather);
  if (result?.ok === false) showToast("天气刷新失败", result.error?.message || "请稍后重试", "error");
}

function companionAIRequestIdForNow() {
  return `companion-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderCompanionAssistant(status = {}, options = {}) {
  dom.companionContent.replaceChildren();
  const form = document.createElement("form");
  form.className = "companion-ai-form";
  const input = document.createElement("textarea");
  input.rows = 3;
  input.maxLength = 4_000;
  input.placeholder = status.configured === false ? "请先在翻译设置中配置 DeepSeek" : "问一个简短的问题…";
  input.disabled = status.configured === false;
  input.setAttribute("aria-label", "询问小序");
  input.value = String(options.prompt || "").slice(0, 4_000);
  const actions = document.createElement("div");
  actions.className = "companion-ai-actions";
  const ask = document.createElement("button");
  ask.type = "submit";
  ask.dataset.actionId = "companion.ai.ask";
  ask.className = "primary-button compact-button";
  ask.textContent = "询问";
  ask.disabled = status.configured === false;
  const summary = document.createElement("button");
  summary.type = "button";
  summary.dataset.actionId = "companion.ai.summarize";
  summary.className = "secondary-button compact-button";
  summary.textContent = "总结本页";
  summary.disabled = status.configured === false;
  const explain = document.createElement("button");
  explain.type = "button";
  explain.dataset.actionId = "companion.ai.explain-selection";
  explain.className = "secondary-button compact-button";
  explain.textContent = "解释选中文字";
  explain.disabled = status.configured === false;
  actions.append(ask, summary, explain);
  const result = document.createElement("div");
  result.className = "companion-ai-result";
  result.textContent = companionAIResult || (status.configured === false ? "DeepSeek 未配置；天气、专注和本地健康提醒仍可正常使用。" : "问答内容只保留在当前面板内，关闭或清除后不写入本地数据。 ");
  const resultActions = document.createElement("div");
  resultActions.className = "companion-ai-result-actions";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.className = "text-button";
  copy.textContent = "复制";
  copy.disabled = !companionAIResult;
  copy.addEventListener("click", () => void navigator.clipboard.writeText(companionAIResult));
  const clear = document.createElement("button");
  clear.type = "button";
  clear.className = "text-button";
  clear.textContent = "清除";
  clear.addEventListener("click", () => { companionAIResult = ""; result.textContent = "内容已清除，未写入本地数据。"; copy.disabled = true; });
  const cancel = document.createElement("button");
  cancel.type = "button";
  cancel.className = "text-button";
  cancel.textContent = "取消请求";
  cancel.hidden = true;
  cancel.addEventListener("click", () => { if (companionAIRequestId) void window.siteNest?.cancelCompanionAI?.(companionAIRequestId); });
  const createTask = document.createElement("button");
  createTask.type = "button";
  createTask.className = "text-button";
  createTask.textContent = "创建任务";
  createTask.dataset.actionId = "task.quick-create";
  createTask.disabled = !companionAIResult;
  createTask.addEventListener("click", () => {
    openTaskModal();
    dom.taskTitle.value = companionAIResult.split(/\r?\n/).find((line) => line.trim())?.replace(/^#+\s*/, "").slice(0, 120) || "小序建议";
    dom.taskNotes.value = companionAIResult.slice(0, 5_000);
  });
  const createTimeline = document.createElement("button");
  createTimeline.type = "button";
  createTimeline.className = "text-button";
  createTimeline.textContent = "记录时间轴";
  createTimeline.dataset.actionId = "timeline.quick-create";
  createTimeline.disabled = !companionAIResult;
  createTimeline.addEventListener("click", () => openTimelineEventModal(null, {
    title: companionAIResult.split(/\r?\n/).find((line) => line.trim())?.replace(/^#+\s*/, "").slice(0, 160) || "小序记录",
    summary: companionAIResult.slice(0, 5_000),
    workspaceId: activeWorkspaceId(),
    sourceType: "manual",
  }));
  resultActions.append(createTask, createTimeline, copy, clear, cancel);
  const run = async (operation) => {
    companionAIRequestId = companionAIRequestIdForNow();
    ask.disabled = true;
    summary.disabled = true;
    explain.disabled = true;
    cancel.hidden = false;
    result.textContent = "小序正在处理…";
    let response;
    if (operation === "ask") response = await window.siteNest?.askCompanion?.(companionAIRequestId, input.value);
    if (operation === "summary") response = await window.siteNest?.summarizeCompanionPage?.(companionAIRequestId);
    if (operation === "explain") response = await window.siteNest?.explainCompanionSelection?.();
    companionAIRequestId = null;
    cancel.hidden = true;
    ask.disabled = status.configured === false;
    summary.disabled = status.configured === false;
    explain.disabled = status.configured === false;
    if (response?.ok) {
      companionAIResult = response.value?.answer || (operation === "explain" ? "解释已显示在网页选区旁。" : "已完成");
      result.textContent = companionAIResult;
      copy.disabled = !companionAIResult;
    } else {
      result.textContent = response?.error?.message || "请求未完成";
      showToast("小序请求未完成", response?.error?.message || "请稍后重试", "error");
    }
  };
  form.addEventListener("submit", (event) => { event.preventDefault(); void run("ask"); });
  summary.addEventListener("click", () => void run("summary"));
  explain.addEventListener("click", () => void run("explain"));
  form.append(input, actions);
  dom.companionContent.append(form, result, resultActions);
  if (options.autoSubmit && input.value.trim() && status.configured !== false) form.requestSubmit();
}

async function loadCompanionAssistant() {
  const status = await window.siteNest?.getCompanionAIStatus?.();
  renderCompanionAssistant(status || { configured: false });
}

async function askCompanionFromQuickBox() {
  const prompt = dom.companionQuickAskInput.value.trim();
  if (!prompt || !companionEnabled()) return;
  setCompanionPanelOpen(true, "assistant");
  const status = await window.siteNest?.getCompanionAIStatus?.() || { configured: false };
  renderCompanionAssistant(status, { prompt, autoSubmit: status.configured !== false });
  if (status.configured === false) {
    showToast("DeepSeek 尚未配置", "公开设置可以同步，但 API Key 需要在本机安全配置", "error");
    return;
  }
  dom.companionQuickAskInput.value = "";
}

async function summarizeCurrentPageWithCompanion() {
  setCompanionPanelOpen(true, "assistant");
  const status = await window.siteNest?.getCompanionAIStatus?.() || { configured: false };
  renderCompanionAssistant(status);
  if (status.configured === false) {
    showToast("DeepSeek 尚未配置", "请先在设置与数据 → 翻译中完成安全配置", "error");
    return;
  }
  companionAIRequestId = companionAIRequestIdForNow();
  companionAIResult = "小序正在处理…";
  renderCompanionAssistant(status);
  const response = await window.siteNest?.summarizeCompanionPage?.(companionAIRequestId);
  companionAIRequestId = null;
  companionAIResult = response?.ok ? (response.value?.answer || "已完成") : (response?.error?.message || "请求未完成");
  renderCompanionAssistant(status);
  if (!response?.ok) showToast("小序请求未完成", companionAIResult, "error");
}

function setCompanionPanelOpen(open, panel = "home") {
  const canOpen = Boolean(open && dom.browserPage.classList.contains("is-visible") && !companionHardHidden());
  if (canOpen && pageActionPanelOpen) setPageActionPanelOpen(false);
  companionPanelOpen = canOpen;
  activeRightPanel = canOpen ? "companion" : activeRightPanel === "companion" ? null : activeRightPanel;
  dom.companionPanel.hidden = !canOpen;
  dom.companionPanel.setAttribute("aria-hidden", String(!canOpen));
  dom.companionDock.setAttribute("aria-expanded", String(canOpen));
  dom.browserContent.classList.toggle("is-companion-panel-open", canOpen);
  dom.companionContent.dataset.panel = panel;
  if (canOpen && panel === "home") renderCompanionHome();
  if (!canOpen && companionAIRequestId) {
    void window.siteNest?.cancelCompanionAI?.(companionAIRequestId);
    companionAIRequestId = null;
  }
  if (canOpen) dom.closeCompanionPanel.focus({ preventScroll: true });
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
  appState.tabGroups = [
    ...(appState.tabGroups || []).filter((group) => group.workspaceId !== nextWorkspaceId),
    ...normalized.tabGroups,
  ];
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
    renderCompanionShell();
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
  renderCompanionShell();
}

function bindEvents() {
  dom.globalCompanionTrigger.addEventListener("click", () => {
    if (dom.browserPage.classList.contains("is-visible")) {
      setCompanionPanelOpen(true);
      return;
    }
    navigateTo("settings");
    showSettingsSection("notifications", "companion");
  });
  dom.companionDock.addEventListener("click", () => setCompanionPanelOpen(!companionPanelOpen));
  dom.closeCompanionPanel.addEventListener("click", () => {
    setCompanionPanelOpen(false);
    dom.companionDock.focus({ preventScroll: true });
  });
  dom.companionWeatherButton.addEventListener("click", () => {
    setCompanionPanelOpen(true, "weather");
    void loadCompanionWeather();
  });
  dom.companionWeatherPill.addEventListener("click", () => {
    setCompanionPanelOpen(true, "weather");
    void loadCompanionWeather();
  });
  dom.companionQuickAskForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void askCompanionFromQuickBox();
  });
  dom.companionAssistantButton.addEventListener("click", () => {
    setCompanionPanelOpen(true, "assistant");
    void loadCompanionAssistant();
  });
  dom.companionPauseButton.addEventListener("click", async () => {
    const snapshot = await window.siteNest?.companionAction?.("pause", { minutes: 60 });
    renderCompanionRuntime(snapshot);
  });
  dom.globalSearchTrigger.addEventListener("click", () => openGlobalSearchPalette());
  dom.closeGlobalSearch.addEventListener("click", () => closeGlobalSearchPalette());
  dom.globalSearchPalette.addEventListener("mousedown", (event) => {
    if (event.target === dom.globalSearchPalette) closeGlobalSearchPalette();
  });
  dom.globalSearchInput.addEventListener("input", () => {
    window.clearTimeout(globalSearchDebounceTimer);
    globalSearchSelectedIndex = 0;
    globalSearchDebounceTimer = window.setTimeout(() => void refreshGlobalSearch(), 120);
  });
  dom.globalSearchInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!globalSearchItems.length) return;
      const delta = event.key === "ArrowDown" ? 1 : -1;
      globalSearchSelectedIndex = (globalSearchSelectedIndex + delta + globalSearchItems.length) % globalSearchItems.length;
      renderGlobalSearchItems(globalSearchItems);
      dom.globalSearchResults.querySelector(`[data-search-result-index="${globalSearchSelectedIndex}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (event.key === "Enter") {
      event.preventDefault();
      void executeGlobalSearchItem();
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeGlobalSearchPalette();
    }
  });
  dom.globalSearchEngine.addEventListener("change", () => {
    globalSearchSelectedIndex = 0;
    void refreshGlobalSearch();
  });
  document.querySelectorAll(".workspace-search-form").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const input = form.querySelector("input");
      if (input?.value.trim()) openGlobalSearchPalette(input.value.trim());
    });
  });
  dom.browserEmptySearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    void openGeneralInput(dom.browserEmptySearchInput.value, { disposition: "current" });
  });
  dom.settingsSectionSelect.addEventListener("change", () => showSettingsSection(dom.settingsSectionSelect.value));
  dom.settingsSearchInput.addEventListener("input", renderSettingsSearchResults);
  dom.refreshUIActionAudit?.addEventListener("click", () => void loadUIActionAudit());
  document.querySelectorAll("[data-open-content-tags]").forEach((button) => {
    button.addEventListener("click", () => void openContentTagSettings());
  });
  dom.addContentTagButton.addEventListener("click", () => openContentTagModal());
  dom.addContentTagGroupButton.addEventListener("click", () => openContentTagGroupModal());
  dom.mergeContentTagsButton.addEventListener("click", openContentTagMergeModal);
  dom.undoContentTagMergeButton.addEventListener("click", async () => {
    if (!window.confirm("撤销最近一次内容标签合并？\n\n标签、明确别名和对象引用将恢复到合并前；合并后另行修改过的关联不会被强制覆盖。")) return;
    dom.undoContentTagMergeButton.disabled = true;
    try {
      applyContentTagSnapshot(await callContentTagApi("undoMerge"));
      showToast("已撤销最近合并", "标签与引用已恢复");
    } catch (error) {
      showToast("无法撤销标签合并", error?.message || "关联可能已在合并后发生变化", "error");
      renderContentTags();
    }
  });
  dom.contentTagGroupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.contentTagGroupForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await applyContentTagMutation("saveGroup", {
        id: dom.contentTagGroupId.value || undefined,
        name: dom.contentTagGroupName.value.trim(),
        iconKey: dom.contentTagGroupIcon.value,
        sortOrder: Number(dom.contentTagGroupSortOrder.value) || 0,
      }, dom.contentTagGroupId.value ? "标签分组已更新" : "标签分组已创建");
      closeModal(dom.contentTagGroupModal);
    } catch (error) {
      showToast("无法保存标签分组", error?.message || "请检查分组名称", "error");
    } finally { submit.disabled = false; }
  });
  dom.deleteContentTagGroupButton.addEventListener("click", async () => {
    const group = activeContentTagGroups().find((item) => item.id === dom.contentTagGroupId.value);
    if (!group || !window.confirm(`删除分组“${group.name}”？\n\n组内标签会变为未分组，不会删除标签或对象引用。`)) return;
    dom.deleteContentTagGroupButton.disabled = true;
    try {
      await applyContentTagMutation("deleteGroup", group.id, "标签分组已删除");
      closeModal(dom.contentTagGroupModal);
    } catch (error) {
      showToast("无法删除标签分组", error?.message || "请稍后重试", "error");
    } finally { dom.deleteContentTagGroupButton.disabled = false; }
  });
  dom.contentTagForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.contentTagForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await applyContentTagMutation("saveTag", {
        id: dom.contentTagId.value || undefined,
        canonicalName: dom.contentTagName.value.trim(),
        groupId: dom.contentTagGroup.value || null,
        iconKey: "tag",
        accentKey: dom.contentTagAccent.value,
        description: dom.contentTagDescription.value,
      }, dom.contentTagId.value ? "内容标签已更新" : "内容标签已创建");
      closeModal(dom.contentTagModal);
    } catch (error) {
      showToast("无法保存内容标签", error?.message || "标签名称可能已存在", "error");
    } finally { submit.disabled = false; }
  });
  dom.deleteContentTagButton.addEventListener("click", async () => {
    const tag = activeContentTags().find((item) => item.id === dom.contentTagId.value);
    if (!tag) return;
    const references = contentTagReferenceSummary(tag.id);
    const detail = references.objectCount ? `\n\n当前有 ${references.objectCount} 个对象引用；若接口拒绝删除，请先合并或移除引用。` : "";
    if (!window.confirm(`删除内容标签“${tag.canonicalName}”？${detail}`)) return;
    dom.deleteContentTagButton.disabled = true;
    try {
      await applyContentTagMutation("deleteTag", tag.id, "内容标签已删除");
      closeModal(dom.contentTagModal);
    } catch (error) {
      showToast("无法删除内容标签", error?.message || "请先处理引用对象", "error");
    } finally { dom.deleteContentTagButton.disabled = false; }
  });
  dom.contentTagAliasForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.contentTagAliasForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      await applyContentTagMutation("saveAlias", {
        id: dom.contentTagAliasId.value || undefined,
        tagId: dom.contentTagAliasTag.value,
        alias: dom.contentTagAliasName.value.trim(),
      }, dom.contentTagAliasId.value ? "明确别名已更新" : "明确别名已添加");
      closeModal(dom.contentTagAliasModal);
    } catch (error) {
      showToast("无法保存明确别名", error?.message || "别名可能已存在", "error");
    } finally { submit.disabled = false; }
  });
  dom.deleteContentTagAliasButton.addEventListener("click", async () => {
    const alias = contentTagState.aliases.find((item) => item.id === dom.contentTagAliasId.value);
    if (!alias || !window.confirm(`删除明确别名“${alias.alias}”？`)) return;
    dom.deleteContentTagAliasButton.disabled = true;
    try {
      await applyContentTagMutation("deleteAlias", alias.id, "明确别名已删除");
      closeModal(dom.contentTagAliasModal);
    } catch (error) {
      showToast("无法删除明确别名", error?.message || "请稍后重试", "error");
    } finally { dom.deleteContentTagAliasButton.disabled = false; }
  });
  dom.contentTagMergeTarget.addEventListener("change", syncContentTagMergeSources);
  dom.previewContentTagMergeButton.addEventListener("click", async () => {
    const input = selectedContentTagMergeInput();
    if (!input.sourceTagIds.length) {
      showToast("请选择来源标签", "至少选择一个要合并的标签", "error");
      return;
    }
    dom.previewContentTagMergeButton.disabled = true;
    try {
      pendingContentTagMergePreview = await callContentTagApi("previewMerge", input);
      renderContentTagMergePreview(pendingContentTagMergePreview);
    } catch (error) {
      resetContentTagMergePreview();
      showToast("无法预览标签合并", error?.message || "请检查标签选择", "error");
    } finally { dom.previewContentTagMergeButton.disabled = false; }
  });
  dom.confirmContentTagMerge.addEventListener("change", () => {
    dom.executeContentTagMergeButton.disabled = !dom.confirmContentTagMerge.checked || !pendingContentTagMergePreview;
  });
  dom.contentTagMergeForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = selectedContentTagMergeInput();
    if (!pendingContentTagMergePreview || !dom.confirmContentTagMerge.checked) return;
    const expectedSources = JSON.stringify([...(pendingContentTagMergePreview.sourceTagIds || [])].sort());
    if (pendingContentTagMergePreview.targetTagId !== input.targetTagId || expectedSources !== JSON.stringify([...input.sourceTagIds].sort())) {
      resetContentTagMergePreview();
      showToast("标签选择已改变", "请重新预览影响范围", "error");
      return;
    }
    const targetName = pendingContentTagMergePreview.targetTag?.canonicalName || "目标标签";
    if (!window.confirm(`最后确认：将所选标签合并到“${targetName}”？\n\n将改写 ${pendingContentTagMergePreview.affectedObjectCount || 0} 个对象，可在标签管理页撤销最近一次合并。`)) return;
    dom.executeContentTagMergeButton.disabled = true;
    try {
      applyContentTagSnapshot(await callContentTagApi("merge", input));
      closeModal(dom.contentTagMergeModal);
      showToast("内容标签已合并", `目标标签：${targetName}`);
    } catch (error) {
      showToast("无法合并内容标签", error?.message || "引用可能已发生变化，请重新预览", "error");
    } finally { dom.executeContentTagMergeButton.disabled = false; }
  });
  dom.contentObjectTagsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submit = event.submitter || dom.contentObjectTagsForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    const input = {
      objectType: dom.contentObjectTagType.value,
      objectId: dom.contentObjectTagId.value,
      tagIds: tagIdsForPicker("object"),
    };
    try {
      const result = await callContentTagApi("setObjectTags", input);
      const object = result?.object || result?.item;
      if (input.objectType === "userScript") {
        userScriptState.scripts = userScriptState.scripts.map((script) => script.id === input.objectId
          ? { ...script, tagIds: object?.tagIds || input.tagIds }
          : script);
        renderUserScripts();
      }
      if (result?.contentTags || result?.tags || result?.snapshot || result?.state?.contentTags) applyContentTagSnapshot(result);
      else await loadContentTags({ silent: true });
      closeModal(dom.contentObjectTagsModal);
      showToast("对象标签已保存", `${input.tagIds.length} 个内容标签`);
    } catch (error) {
      showToast("无法保存对象标签", error?.message || "请稍后重试", "error");
    } finally { submit.disabled = false; }
  });
  dom.defaultSearchEngineSelect.addEventListener("change", async () => {
    try {
      applySearchSnapshot(await window.siteNest.updateSearchSettings({ defaultSearchEngineId: dom.defaultSearchEngineSelect.value }));
      showToast("默认搜索引擎已更新", searchEngineById().name);
    } catch (error) {
      renderSearchEngineControls();
      showToast("无法保存搜索引擎", error?.message || "请稍后重试", "error");
    }
  });
  dom.saveSearchHistorySetting.addEventListener("change", async () => {
    try {
      applySearchSnapshot(await window.siteNest.updateSearchSettings({ saveSearchHistory: dom.saveSearchHistorySetting.checked }));
    } catch (error) {
      renderSearchEngineControls();
      showToast("无法保存历史设置", error?.message || "请稍后重试", "error");
    }
  });
  dom.clearSearchHistoryButton.addEventListener("click", async () => {
    if (!searchState.history.length || !window.confirm("清除全部本机搜索历史？\n\n不会删除浏览会话、站点或 Chrome 书签。")) return;
    applySearchSnapshot(await window.siteNest.clearSearchHistory());
    showToast("搜索历史已清除", "站点、书签与浏览会话未受影响");
  });
  dom.openGoogleSyncSettings.addEventListener("click", () => {
    setGoogleSyncPopoverOpen(true);
  });
  dom.toggleZohoConfig.addEventListener("click", () => toggleZohoConfigForm());
  dom.translationConfigForm.addEventListener("input", () => dirtySettingsPanels.add("translation"));
  dom.translationShortPronunciation.addEventListener("change", () => {
    dom.translationShortPronunciationMax.disabled = dom.translationShortPronunciation.value === "off";
  });
  window.addEventListener("popstate", () => {
    const parsed = parseSettingsRoute(window.location.hash.slice(1));
    if (parsed) {
      navigateTo("settings", { pushHistory: false, section: parsed.section, panel: parsed.panel });
    }
  });

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
  dom.planAddTaskButton.addEventListener("click", () => {
    if (currentTaskView === "timeline") openTimelineEventModal();
    else if (currentTaskView === "habits") openHabitModal();
    else openTaskModal();
  });
  dom.planViewTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-task-view]");
    if (!button) return;
    currentTaskView = button.dataset.taskView;
    if (currentTaskView === "timeline" && ["work", "personal"].includes(appState.activeWorkspaceId)) {
      const trackId = appState.activeWorkspaceId;
      if (timelineState.settings.selectedTrackId !== trackId) {
        void setTimelineSettings({ selectedTrackId: trackId, lastTrackId: trackId });
      }
    }
    renderPlan();
  });
  dom.habitAddButton?.addEventListener("click", () => openHabitModal());
  dom.openUsageDetails?.addEventListener("click", () => {
    usageDetailsVisible = true;
    currentTaskView = "habits";
    navigateTo("plan");
    renderPlan();
    dom.usageDetailCard?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
  dom.openUsageTrackButton?.addEventListener("click", () => {
    usageDetailsVisible = !usageDetailsVisible;
    renderUsage();
  });
  dom.usageTrackingToggle?.addEventListener("change", async () => {
    try {
      applyHabitSnapshot(await window.siteNest.updateUsageSettings({ enabled: dom.usageTrackingToggle.checked }));
      showToast(dom.usageTrackingToggle.checked ? "使用统计已开启" : "使用统计已关闭", "只记录前台有效使用，不记录输入内容");
    } catch (error) {
      dom.usageTrackingToggle.checked = !dom.usageTrackingToggle.checked;
      showToast("无法更新使用统计", error?.message || "请稍后重试", "error");
    }
  });
  dom.clearUsageStats?.addEventListener("click", async () => {
    if (!window.confirm("清除全部栖页使用统计？此操作不会删除任务、习惯或坚持星。")) return;
    try {
      applyHabitSnapshot(await window.siteNest.clearUsageStats());
      showToast("使用统计已清除", "习惯打卡与坚持星未受影响");
    } catch (error) {
      showToast("无法清除使用统计", error?.message || "请稍后重试", "error");
    }
  });
  dom.habitFrequency?.addEventListener("change", syncHabitFrequencyFields);
  dom.habitTargetType?.addEventListener("change", syncHabitTargetFields);
  dom.habitForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = habitFormPayload();
    if (!payload.name || !payload.startDate) return;
    const submit = dom.habitForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const snapshot = payload.id
        ? await window.siteNest.updateHabit(payload)
        : await window.siteNest.addHabit(payload);
      applyHabitSnapshot(snapshot);
      closeModal(dom.habitModal);
      showToast(payload.id ? "长期目标已更新" : "长期目标已创建", payload.name);
    } catch (error) {
      showToast("无法保存长期目标", error?.message || "请检查目标内容", "error");
    } finally {
      submit.disabled = false;
    }
  });
  dom.deleteHabitButton?.addEventListener("click", async () => {
    const habit = habitForId(dom.habitId.value);
    if (!habit || !window.confirm(`删除长期目标“${habit.name}”？历史打卡与坚持星会保留，可通过数据恢复。`)) return;
    try {
      applyHabitSnapshot(await window.siteNest.deleteHabit(habit.id));
      closeModal(dom.habitModal);
      showToast("长期目标已删除", habit.name);
    } catch (error) {
      showToast("无法删除长期目标", error?.message || "请稍后重试", "error");
    }
  });
  dom.habitCheckInForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const habit = habitForId(dom.habitCheckInHabitId.value);
    if (!habit) return;
    const payload = {
      id: dom.habitCheckInDate.dataset.checkInId || undefined,
      habitId: habit.id,
      localDate: dom.habitCheckInDate.value,
      state: dom.habitCheckInState.value,
      note: dom.habitCheckInNote.value,
    };
    const submit = dom.habitCheckInForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      applyHabitSnapshot(await window.siteNest.upsertHabitCheckIn(payload));
      closeModal(dom.habitCheckInModal);
      showToast("打卡已保存", `${habit.name} · ${payload.localDate}`);
    } catch (error) {
      showToast("无法保存打卡", error?.message || "该日期可能不是计划日", "error");
    } finally {
      submit.disabled = false;
    }
  });
  dom.deleteHabitCheckInButton?.addEventListener("click", async () => {
    const checkInId = dom.habitCheckInDate.dataset.checkInId;
    const habit = habitForId(dom.habitCheckInHabitId.value);
    if (!checkInId || !habit || !window.confirm(`撤销 ${dom.habitCheckInDate.value} 的打卡？对应坚持星也会撤销。`)) return;
    try {
      applyHabitSnapshot(await window.siteNest.deleteHabitCheckIn(checkInId));
      closeModal(dom.habitCheckInModal);
      showToast("打卡已撤销", habit.name);
    } catch (error) {
      showToast("无法撤销打卡", error?.message || "请稍后重试", "error");
    }
  });
  dom.timelineAddButton.addEventListener("click", () => openTimelineEventModal());
  dom.timelineYearInput.addEventListener("change", () => void setTimelineYear(dom.timelineYearInput.value));
  const persistTimelineFilters = () => void setTimelineSettings({
    typeFilter: dom.timelineTypeFilter.value,
    search: dom.timelineSearchInput.value.trim(),
  });
  dom.timelineTrackSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-track]");
    if (!button || button.dataset.timelineTrack === timelineState.settings.selectedTrackId) return;
    const trackId = button.dataset.timelineTrack === "work" ? "work" : "personal";
    const nextView = timelineState.settings.trackViews?.[trackId] || { selectedYear: new Date().getFullYear(), selectedMonth: null, scope: "year", zoom: 1 };
    void setTimelineSettings({ selectedTrackId: trackId, lastTrackId: trackId, selectedYear: nextView.selectedYear });
  });
  dom.timelineTypeFilter.addEventListener("change", persistTimelineFilters);
  dom.timelineSearchInput.addEventListener("input", () => {
    timelineState.settings = { ...timelineState.settings, search: dom.timelineSearchInput.value.trim() };
    renderTimeline();
    window.clearTimeout(timelineSearchTimer);
    timelineSearchTimer = window.setTimeout(persistTimelineFilters, 280);
  });
  dom.timelineViewSwitch.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-view]");
    if (!button) return;
    void setTimelineSettings({ viewMode: button.dataset.timelineView });
  });
  dom.timelineMonthNav.addEventListener("click", (event) => {
    const button = event.target.closest("[data-timeline-month]");
    if (!button) return;
    void setTimelineTrackView({ selectedMonth: Number(button.dataset.timelineMonth), scope: "month" });
  });
  dom.timelineBackToYear.addEventListener("click", () => void setTimelineTrackView({ selectedMonth: null, scope: "year" }));
  dom.timelineMonthNav.addEventListener("pointerdown", (event) => {
    timelineMonthNavDrag = { pointerId: event.pointerId, x: event.clientX, scrollLeft: dom.timelineMonthNav.scrollLeft };
    dom.timelineMonthNav.classList.add("is-dragging");
    dom.timelineMonthNav.setPointerCapture?.(event.pointerId);
  });
  dom.timelineMonthNav.addEventListener("pointermove", (event) => {
    if (!timelineMonthNavDrag || timelineMonthNavDrag.pointerId !== event.pointerId) return;
    dom.timelineMonthNav.scrollLeft = timelineMonthNavDrag.scrollLeft - (event.clientX - timelineMonthNavDrag.x);
  });
  const endTimelineMonthDrag = () => {
    timelineMonthNavDrag = null;
    dom.timelineMonthNav.classList.remove("is-dragging");
  };
  dom.timelineMonthNav.addEventListener("pointerup", endTimelineMonthDrag);
  dom.timelineMonthNav.addEventListener("pointercancel", endTimelineMonthDrag);
  dom.timelineDatePrecision.addEventListener("change", () => {
    const precision = dom.timelineDatePrecision.value;
    configureTimelineDateInput(dom.timelineStartDate, precision);
    configureTimelineDateInput(dom.timelineEndDate, precision);
  });
  dom.timelineOngoing.addEventListener("change", () => {
    dom.timelineEndDate.disabled = dom.timelineOngoing.checked;
    if (dom.timelineOngoing.checked) dom.timelineEndDate.value = "";
  });
  dom.timelineEventForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = timelineEventFormPayload();
    if (!payload.title || !payload.startDate) return;
    const submit = dom.timelineEventForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    try {
      const snapshot = payload.id
        ? await window.siteNest.updateTimelineEvent(payload)
        : await window.siteNest.addTimelineEvent(payload);
      timelineFocusEventId = snapshot.event?.id || payload.id || null;
      applyTimelineSnapshot(snapshot);
      closeModal(dom.timelineEventModal);
      showToast(payload.id ? "时间轴记录已更新" : "时间轴记录已添加", payload.title);
    } catch (error) {
      showToast("无法保存时间轴记录", error?.message || "请检查标题和日期", "error");
    } finally {
      submit.disabled = false;
    }
  });
  dom.deleteTimelineEventButton.addEventListener("click", async () => {
    const current = timelineEventForId(dom.timelineEventId.value);
    if (!current || !window.confirm(`删除时间轴记录“${current.title}”？`)) return;
    try {
      const snapshot = await window.siteNest.deleteTimelineEvent(current.id);
      timelineFocusEventId = null;
      applyTimelineSnapshot(snapshot);
      closeModal(dom.timelineEventModal);
      showToast("时间轴记录已删除", current.title);
    } catch (error) {
      showToast("无法删除时间轴记录", error?.message || "请稍后重试", "error");
    }
  });
  dom.timelineReviewButton.addEventListener("click", showTimelineReview);
  dom.timelineCopyReview.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(timelineState.review?.text || "");
      showToast("年度回顾已复制", `${timelineState.loadedYear} 年`);
    } catch (error) {
      showToast("无法复制年度回顾", error?.message || "请检查剪贴板权限", "error");
    }
  });
  dom.timelineExportMarkdown.addEventListener("click", () => void exportTimeline("markdown"));
  dom.timelineExportJson.addEventListener("click", () => void exportTimeline("json"));
  dom.timelineExportSvg.addEventListener("click", () => void exportTimeline("svg"));
  dom.timelineReviewExportMarkdown.addEventListener("click", () => void exportTimeline("markdown"));
  dom.timelineReviewExportJson.addEventListener("click", () => void exportTimeline("json"));
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
    const timelineYearMove = event.target.closest("[data-timeline-year-move]");
    if (timelineYearMove) {
      const movement = Number(timelineYearMove.dataset.timelineYearMove);
      const current = Number(timelineState.loadedYear || timelineState.settings.selectedYear) || new Date().getFullYear();
      void setTimelineYear(movement === 0 ? new Date().getFullYear() : current + movement);
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
  dom.saveCompanionSettings.addEventListener("click", async () => {
    dom.saveCompanionSettings.disabled = true;
    const current = appState.uiSettings?.companion || {};
    const companion = {
      ...current,
      enabled: dom.companionEnabledSetting.checked,
      onboardingSeen: true,
      focusDockSeconds: Number(dom.companionFocusSeconds.value),
      weather: { ...(current.weather || {}), enabled: dom.companionWeatherEnabled.checked, city: dom.companionWeatherCity.value.trim(), locationMode: "manual", pollMinutes: Number(dom.companionWeatherPollMinutes.value) },
      wellness: {
        ...(current.wellness || {}),
        enabled: true,
        kinds: { "eye-rest": dom.companionEyeRestEnabled.checked, water: dom.companionWaterEnabled.checked, movement: dom.companionMovementEnabled.checked },
        intervalsMinutes: { "eye-rest": Number(dom.companionEyeRestMinutes.value), water: Number(dom.companionWaterMinutes.value), movement: Number(dom.companionMovementMinutes.value) },
      },
      quietHours: { enabled: dom.companionQuietEnabled.checked, start: dom.companionQuietStart.value, end: dom.companionQuietEnd.value },
    };
    try {
      const result = await window.siteNest.updateUiSettings({ companion });
      appState = result.state || { ...appState, uiSettings: result.uiSettings };
      renderCompanionSettings();
      renderCompanionShell();
      renderCompanionRuntime(await window.siteNest.getCompanionRuntime());
      companionWeather = await window.siteNest.getCompanionWeather();
      renderCompanionWeather(companionWeather);
      showToast("小序设置已保存", companion.enabled ? "小序已启用" : "小序已停用");
    } catch (error) {
      showToast("无法保存小序设置", error?.message || "请稍后重试", "error");
    } finally { dom.saveCompanionSettings.disabled = false; }
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
      dirtySettingsPanels.delete("translation");
      renderTranslationSettings();
      showToast("DeepSeek 配置已安全保存", translationStatusCache.configured ? "翻译与划词查询已可用" : "仍需填写 API Key");
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
      showToast("DeepSeek 连接成功", "固定测试文本已得到有效响应");
    } catch (error) {
      showToast("DeepSeek 连接失败", error?.message || "请检查地址、模型与密钥", "error");
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
      dirtySettingsPanels.delete("translation");
      renderTranslationSettings();
      showToast("翻译密钥已清除", "安全存储中的 API Key 已删除");
    } catch (error) {
      showToast("无法清除翻译密钥", error?.message || "请稍后重试", "error");
    }
  });
  dom.googleSyncCard.addEventListener("click", () => {
    setGoogleSyncPopoverOpen(!googleSyncPopoverOpen);
  });
  dom.dataStatusButton?.addEventListener("click", async () => {
    if (typeof window.siteNest?.showDataStatusMenu !== "function") return;
    const result = await window.siteNest.showDataStatusMenu();
    mergeGoogleSyncState(result);
    renderGoogleSync();
  });
  dom.closeGoogleSyncPopover.addEventListener("click", () => {
    setGoogleSyncPopoverOpen(false, { focusCard: true });
  });
  dom.googleSignInButton.addEventListener("click", () => {
    if (googleSyncState.configured) void runGoogleSyncAction("sign-in");
    else void importGoogleOAuthAndSignIn();
  });
  dom.googleSyncNowButton.addEventListener("click", () => void runGoogleSyncAction("sync"));
  dom.googleRestoreButton.addEventListener("click", () => void runGoogleSyncAction("restore"));
  dom.googleTestConnectionButton.addEventListener("click", () => void runGoogleSyncAction("test"));
  dom.googleSignOutButton.addEventListener("click", () => void runGoogleSyncAction("sign-out"));
  dom.googleSyncConflict.addEventListener("click", (event) => {
    const button = event.target.closest("[data-google-conflict]");
    if (button) void resolveGoogleConflict(button.dataset.googleConflict);
  });
  dom.googleSyncModuleSettings?.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-google-sync-module]");
    if (!input) return;
    const googleSync = {
      ...(appState.uiSettings?.googleSync || {}),
      [input.dataset.googleSyncModule]: input.checked,
    };
    try {
      const result = await window.siteNest.updateUiSettings({ googleSync });
      if (result?.state) applyReturnedState(result);
      renderGoogleSettingsStatus();
    } catch (error) {
      input.checked = !input.checked;
      showToast("无法保存同步设置", error?.message || "请稍后重试", "error");
    }
  });
  document.addEventListener("keydown", captureShortcutKey, true);
  window.siteNest.onShortcutTrigger?.((payload) => {
    if (!payload?.actionId || !payload?.accelerator) return;
    invokeConfiguredShortcut(payload.actionId, payload.accelerator);
  });
  window.siteNest.onAppCommand?.((payload) => {
    if (payload?.action === "companion.open") setCompanionPanelOpen(true);
  });
  dom.shortcutSearchInput?.addEventListener("input", renderShortcuts);
  dom.shortcutCategoryFilter?.addEventListener("change", renderShortcuts);
  dom.shortcutModifiedOnly?.addEventListener("change", renderShortcuts);
  dom.checkShortcutConflicts?.addEventListener("click", () => {
    const count = shortcutSnapshot.conflicts?.length || 0;
    showToast(count ? "发现快捷键冲突" : "快捷键检查完成", count ? `${count} 组快捷键上下文重叠，请逐项修改。` : "当前平台没有重复或上下文重叠的组合。", count ? "error" : "success");
  });
  dom.resetShortcutCategory?.addEventListener("click", async () => {
    const category = dom.shortcutCategoryFilter.value;
    if (!category) {
      showToast("请先选择分类", "选择一个快捷键分类后再恢复该分类默认值");
      return;
    }
    shortcutSnapshot = await window.siteNest.resetShortcuts({ platform: shortcutSnapshot.platform, category });
    renderShortcuts();
  });
  dom.resetAllShortcuts?.addEventListener("click", async () => {
    if (!window.confirm("恢复当前平台的全部默认快捷键？\n\n所有自定义组合和禁用状态都会被清除。")) return;
    shortcutSnapshot = await window.siteNest.resetShortcuts({ platform: shortcutSnapshot.platform });
    renderShortcuts();
  });
  dom.workConnectorSettings.addEventListener("click", () => navigateTo("settings?section=connections&panel=zoho"));
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
  dom.browserEmptyOpenSites.addEventListener("click", () => navigateTo("sites"));
  dom.browserEmptyAddSite.addEventListener("click", () => openAddSiteModal({
    workspaceId: activeWorkspaceId(),
    siteKind: defaultSiteKind(),
  }));
  dom.newBrowserTabButton.addEventListener("click", () => openGlobalSearchPalette());
  dom.tabGroupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const groupId = dom.tabGroupId.value;
    const name = dom.tabGroupName.value.trim();
    if (!name) return;
    try {
      if (groupId) {
        commitTabOrganizationResult(await window.siteNest.updateTabGroup(groupId, {
          name,
          colorKey: dom.tabGroupColor.value,
          iconKey: dom.tabGroupIcon.value,
        }));
      } else {
        let tabIds = [];
        try {
          tabIds = JSON.parse(dom.tabGroupTabIds.value || "[]");
        } catch {
          tabIds = [];
        }
        commitTabOrganizationResult(await window.siteNest.createTabGroup({
          workspaceId: dom.tabGroupWorkspaceId.value || activeWorkspaceId(),
          name,
          colorKey: dom.tabGroupColor.value,
          iconKey: dom.tabGroupIcon.value,
          tabIds,
        }));
      }
      closeModal(dom.tabGroupModal);
      showToast(groupId ? "页签组已更新" : "页签组已创建", "网页不会重新加载");
    } catch (error) {
      showToast("无法保存页签组", error?.message || "请稍后重试", "error");
    }
  });
  dom.duplicateTabsForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const report = duplicateTabsCurrentReport;
    if (!report?.exact?.length) return;
    let totalClosed = 0;
    for (const [index, group] of report.exact.entries()) {
      const keeper = dom.duplicateTabsForm.querySelector(`input[name="duplicate-keeper-${index}"]:checked`)?.value;
      if (!keeper) continue;
      const closeTabIds = group.tabs.map((tab) => tab.tabId).filter((tabId) => tabId !== keeper);
      try {
        const result = await window.siteNest.resolveDuplicateTabs(keeper, closeTabIds);
        commitTabOrganizationResult(result);
        totalClosed += result.closedTabIds?.length || 0;
        if (!result.ok) {
          showToast("重复页签整理已停止", result.blocked?.reason || "页签可能有未保存内容", "error");
          duplicateTabsCurrentReport = await window.siteNest.detectDuplicateTabs(report.workspaceId);
          renderDuplicateTabsReport(duplicateTabsCurrentReport);
          return;
        }
      } catch (error) {
        showToast("无法关闭重复页签", error?.message || "请稍后重试", "error");
        return;
      }
    }
    closeModal(dom.duplicateTabsModal);
    showToast("重复页签已整理", `已关闭 ${totalClosed} 个经确认的完全重复页签`);
  });

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
  dom.workGlobalSearch.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" || !dom.workGlobalSearch.value.trim()) return;
    event.preventDefault();
    openGlobalSearchPalette(dom.workGlobalSearch.value.trim());
  });
  dom.automationTabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-automation-tab]");
    if (button) selectAutomationTab(button.dataset.automationTab);
  });
  dom.openCreatedUserScript.addEventListener("click", () => openUserScriptInstall("createdInApp"));
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
        : type === "createdInApp"
          ? await window.siteNest.reviewCreatedUserScript(dom.userScriptSourceCode.value)
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
  [dom.pageImportButton, dom.settingsImportButton].forEach((button) =>
    button.addEventListener("click", () => void openImportModal()),
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
        tagIds: tagIdsForPicker("site"),
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
  dom.browserAudioButton.addEventListener("click", async () => {
    const tabId = dom.browserAudioButton.dataset.tabId;
    if (!tabId) return;
    try {
      commitBrowserTabResult(await window.siteNest.toggleBrowserTabMute(tabId));
    } catch (error) {
      showToast("无法切换静音", error?.message || "请稍后重试", "error");
    }
  });
  dom.browserMoreMenu.addEventListener("click", () => {
    const activeTab = activeBrowserTab(browserSnapshot);
    if (activeTab) void openTopTabContextMenu(activeTab);
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
      "确定修复栖页内的 SAP 登录会话吗？\n\n这会清除栖页内 SAP 及 SAP 身份认证父域的 Cookie 与站点缓存，并退出栖页内的 SAP 账号；修复后会重新打开刚才的搜索结果。不会影响 Chrome、NodeSeek、奶昔或非 SAP 网站。",
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

  dom.openDataFolderButton.addEventListener("click", async () => {
    try {
      const result = await window.siteNest.openDataFolder();
      if (!result.ok) throw new Error(result.error);
    } catch (error) {
      showToast("无法打开数据目录", error?.message || "请稍后重试", "error");
    }
  });

  window.addEventListener("keydown", (event) => {
    if (dispatchConfiguredShortcut(event)) return;
    if (event.key === "Escape") {
      if (globalSearchOpen) {
        event.preventDefault();
        closeGlobalSearchPalette();
        return;
      }
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
      if (companionPanelOpen) {
        setCompanionPanelOpen(false);
        dom.companionDock.focus({ preventScroll: true });
        return;
      }
      if (currentSite) {
        event.preventDefault();
        void window.siteNest.browserAction("stop");
      }
      return;
    }
    if (!currentSite) return;
    if (event.key === "F5") {
      event.preventDefault();
      void window.siteNest.browserAction("reload");
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

  const recordMeaningfulUsage = () => {
    const now = Date.now();
    if (now - lastMeaningfulUsageAt < 5_000) return;
    lastMeaningfulUsageAt = now;
    window.siteNest?.recordMeaningfulUsageAction?.();
    window.siteNest?.recordCompanionMeaningfulAction?.();
  };
  document.addEventListener("pointerdown", recordMeaningfulUsage, { passive: true });
  document.addEventListener("wheel", recordMeaningfulUsage, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Shift" || event.key === "Control" || event.key === "Alt" || event.key === "Meta") return;
    recordMeaningfulUsage();
  });

  new ResizeObserver(syncBrowserBounds).observe(dom.webviewFrame);
  window.siteNest?.onBrowserState(handleBrowserState);
  window.siteNest?.onCompanionRuntime?.(renderCompanionRuntime);
  window.siteNest?.onCompanionWeather?.(renderCompanionWeather);
  window.siteNest?.onCompanionWeatherAlert?.((event) => {
    dom.companionBubble.textContent = event?.message || "天气发生变化";
    dom.companionBubble.hidden = !companionEnabled();
    showToast("天气提醒", event?.message || "天气发生变化");
  });
  window.siteNest?.onDataStatusUpdated?.((snapshot) => {
    mergeGoogleSyncState(snapshot);
    renderGoogleSync();
  });
  window.siteNest?.onDataStatusAction?.((action) => {
    if (action === "conflicts") {
      navigateTo("settings?section=accounts&panel=google");
      setGoogleSyncPopoverOpen(true);
    } else if (action === "settings") {
      navigateTo("settings?section=accounts&panel=google");
    }
  });
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
    navigateTo("settings?section=translation&panel=translation");
  });
  window.siteNest?.onTasksChanged?.((snapshot) => applyTaskSnapshot(snapshot));
  window.siteNest?.onHabitsChanged?.((snapshot) => applyHabitSnapshot(snapshot));
  window.siteNest?.onTimelineChanged?.((snapshot) => applyTimelineSnapshot(snapshot));
  window.siteNest?.onOpenTask?.(({ taskId, view }) => {
    currentTaskView = view || "week";
    navigateTo("plan");
    if (taskId === "new") openTaskModal();
    else if (taskId) {
      const task = taskForId(taskId);
      if (task) openTaskModal(task);
    }
  });
  window.siteNest?.onOpenHabit?.(({ habitId, localDate }) => {
    currentTaskView = "habits";
    navigateTo("plan");
    const habit = habitForId(habitId);
    if (habit) void openHabitCheckInModal(habit, localDate || habitState.today);
  });
  window.siteNest?.onUserScriptCommandsChanged?.(() => {
    if (pageActionPanelOpen) void refreshPageUserScriptCommands();
  });
  window.siteNest?.onUserScriptsChanged?.((snapshot) => applyUserScriptSnapshot(snapshot));
  window.siteNest?.onUserScriptAutoDisabled?.((notice) => {
    showToast("网页脚本已自动暂停", `${notice?.name || "脚本"}：${notice?.message || "连续执行失败"}`, "error");
  });
  window.siteNest?.onUserScriptNotification?.((notice) => {
    showToast(notice?.title || "网页脚本通知", notice?.body || "");
  });
  window.siteNest?.onUserScriptReviewReady?.((review) => {
    renderUserScriptReview(review);
    showToast("检测到用户脚本", "请核对权限和来源后再确认安装");
  });
  window.siteNest?.onContentTagsChanged?.((snapshot) => applyContentTagSnapshot(snapshot));
  window.siteNest?.onUserScriptExecution?.(() => {
    if (currentAutomationTab === "scripts") void loadUserScripts();
  });
  window.siteNest?.onAutomationStatus(({ naixi }) => renderNaixiAutomation(naixi));
}

async function initialize() {
  mountIcons();
  initializeSettingsArchitecture();
  renderBrowserTabs(browserSnapshot);
  renderGoogleSync();
  applySidebarCollapsed(readSidebarCollapsedPreference(), { persist: false });
  bindEvents();
  try {
    appState = await window.siteNest.getState();
    renderCompanionRuntime(await window.siteNest?.getCompanionRuntime?.());
    companionWeather = await window.siteNest?.getCompanionWeather?.() || companionWeather;
    renderCompanionWeather(companionWeather);
    await loadShortcuts();
    timelineState = {
      ...timelineState,
      tracks: Array.isArray(appState.timelineTracks) ? appState.timelineTracks : [],
      settings: appState.timelineUiSettings || timelineState.settings,
      events: [],
      loadedYear: null,
    };
    await loadSearchState();
    activeSettingsSection = searchState.settings.settingsLastSection || "general";
    showSettingsSection(activeSettingsSection, "", { persist: false, pushHistory: false, force: true });
    desiredWorkspaceId = activeWorkspaceId();
    renderAll();
    await loadGoogleSyncStatus();
    await loadTranslationStatus();
    await loadTasks();
    await loadHabits();
    await loadContentTags({ silent: true });
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
    const startupSettingsTarget = parseSettingsRoute(window.location.hash.slice(1));
    if (startupSettingsTarget) {
      navigateTo("settings", {
        section: startupSettingsTarget.section || activeSettingsSection,
        panel: startupSettingsTarget.panel,
        pushHistory: false,
        force: true,
      });
    }
  } catch (error) {
    showToast("应用数据初始化失败", error?.message || "请重新启动栖页", "error");
  }
}

void initialize();
