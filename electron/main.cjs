const {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  Menu,
  Notification,
  Tray,
  WebContentsView,
  ipcMain,
  net,
  safeStorage,
  session,
  shell,
  powerMonitor,
  webContents,
} = require("electron");
const { createHash, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const {
  DEFAULT_BROWSER_PROFILE_ID,
  CURRENT_SCHEMA_VERSION,
  MAX_RECENTLY_CLOSED_TABS,
  SAP_BROWSER_PROFILE_ID,
  addSiteToState,
  clearWorkspaceBrowserStateInState,
  deleteSiteFromState,
  getWorkspaceBrowserState,
  moveSiteInState,
  setActiveWorkspaceInState,
  setSitePinnedInState,
  setWorkspaceBrowserStateInState,
  setWorkspaceBrowserTabsInState,
  updateUiSettingsInState,
  upsertConnectorConnectionInState,
  appendConnectorExecutionInState,
  updateSiteInState,
  migrateState,
} = require("./state-model.cjs");
const { atomicWriteJson, createStateStore } = require("./state-store.cjs");
const { GoogleDriveSyncService } = require("./google-drive-sync.cjs");
const {
  IncrementalSyncEngine,
  RecordSyncStore,
  deriveDataHealthStatus,
} = require("./sync/index.cjs");
const {
  AssistantExecutionService,
  AssistantMatcher,
  AssistantPermissionGuard,
  PageContextAdapter,
  createBuiltinAssistantRegistry,
} = require("./assistants/index.cjs");
const {
  ConnectorCache,
  ConnectorConnectionService,
  ConnectorExecutionService,
  ConnectorRegistry,
  ConnectorSecretStore,
  ZohoConnectorService,
  publicConnectorError,
} = require("./connectors/index.cjs");
const { extractZohoDeskTicketId } = require("./assistants/builtins/zoho-desk.cjs");
const {
  DownloadManager,
  ExternalProtocolService,
  ManagedPopupService,
  NavigationPerformanceTracer,
  PageCapabilityOrchestrator,
  PageResourceService,
  SessionRuntimeState,
  WebViewLifecycleManager,
  WebContextMenuService,
  BrowserMediaCapabilityService,
  WindowOpenPolicyService,
  bilibiliMediaBridgeScript,
  isSafeEmbeddedMediaPermission,
  isOfficialBilibiliHost,
  readWebContentsAudioState,
  standardChromiumUserAgent,
  securityStateForUrl,
  normalizeBrowserMemorySettings,
  clearSapAuthenticationState,
  hasSapLoginRejection,
  isSapSearchTarget,
  isSapSessionUrl,
  isAuthenticationUrl,
  durableBrowserUrl,
  isZohoDeskUrl,
  isZohoDeskTicketListUrl,
  refreshZohoDeskTicketList,
  zohoDeskAuthReturnUrl,
  sapRetryUrl,
  tabCloseDecision,
} = require("./browser/index.cjs");
const {
  GlobalSearchService,
  normalizeSearchHistory,
  normalizeSearchSettings,
  recordSearchHistory,
} = require("./browser/search-service.cjs");
const {
  SiteFamilyRegistry,
  activeGroupsForWorkspace,
  assignTabsToGroup,
  createTabGroup,
  detectDuplicateTabs,
  mergeTabGroups,
  normalizeComparableTabUrl,
  reorderGroups,
  reorderTabs,
  undoTabGroupMerge,
  updateTabGroup,
} = require("./browser/tab-organization.cjs");
const {
  OpenAICompatibleTranslationProvider,
  PageTextExtractor,
  PageTranslationController,
  PageTranslationRenderer,
  SelectionActionService,
  TranslationProviderRegistry,
  TranslationService,
  isSensitiveTranslationUrl,
  normalizeTranslationSettings,
  siteRuleForUrl,
} = require("./translation/index.cjs");
const {
  AppBackgroundService,
  DesktopNotificationService,
  TaskReminderScheduler,
  TrayService,
  addTaskToState,
  deleteTaskFromState,
  nextDoNotDisturbEnd,
  updateReminderInState,
  updateTaskInState,
  updateTaskSettingsInState,
} = require("./tasks/index.cjs");
const {
  TimelineSearchIndex,
  addTimelineEventToState,
  buildAnnualReview,
  buildTimelineJsonExport,
  buildTimelineMarkdown,
  buildTimelineSvgExport,
  deleteTimelineEventFromState,
  sanitizeTimelineSourceUrl,
  timelineEventsForYear,
  updateTimelineEventInState,
  updateTimelineUiSettingsInState,
} = require("./timeline/index.cjs");
const {
  addHabitDefinitionToState,
  buildHabitReminders,
  buildHabitHeatmap,
  computeHabitStats,
  deleteHabitCheckInFromState,
  deleteHabitDefinitionFromState,
  habitStarCount,
  isHabitScheduledOnDate,
  localDateFromInstant,
  totalHabitStarCount,
  updateHabitDefinitionInState,
  updateHabitReminderInState,
  upsertHabitCheckInInState,
} = require("./habits/index.cjs");
const { UsageTracker } = require("./usage/index.cjs");
const {
  contentTagSnapshot,
  deleteContentTagAliasInState,
  deleteContentTagGroupInState,
  deleteContentTagInState,
  mergeContentTags,
  previewContentTagMerge,
  saveContentTagAliasInState,
  saveContentTagGroupInState,
  saveContentTagInState,
  setContentObjectTagsInState,
  undoLastContentTagMerge,
} = require("./content-tags/index.cjs");
const {
  UserScriptEngine,
  UserScriptSourceService,
  USER_SCRIPT_WORLD_ID,
  appendUserScriptExecution,
  isSensitiveUserScriptUrl,
  removeUserScript,
  resolveUserScriptUpdateUrl,
  restoreUserScript,
  rollbackUserScriptVersion,
  updateBuiltInSiteApproval,
  updateLocalhostConnectApproval,
  updateSensitiveSiteApproval,
  updateUserScriptEnabled,
  upsertUserScript,
} = require("./userscripts/index.cjs");
const {
  UIActionAuditService,
  UI_ACTION_IDS,
  createUIActionRegistry,
} = require("./ui-actions/index.cjs");
const { ShortcutDispatcher, ShortcutRegistry, electronInputAccelerator } = require("./shortcuts/index.cjs");
const {
  CompanionAIService,
  CompanionPageSummaryExtractor,
  CompanionRuntimeService,
  COMPANION_WIDGET_WORLD_ID,
  WeatherService,
  classifyPageForAI,
  companionWidgetInstallScript,
  companionWidgetUpdateScript,
  normalizeCompanionRuntimeState,
  normalizeCompanionSettings,
  normalizeCompanionWidgetSnapshot,
} = require("./companion/index.cjs");

const APP_ID = "local.qiye.sitehub";
const SITE_PARTITION = "persist:qiye-sites";
const SAP_SITE_PARTITION = "persist:qiye-sap-support";
const DETACHED_HEADER_HEIGHT = 56;
const MAIN_TITLE_TAB_ROW_HEIGHT = 38;
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CAPTURE_PATH = process.env.QIYE_CAPTURE_PATH;
const CAPTURE_ROUTE = process.env.QIYE_CAPTURE_ROUTE || "home";
const TAB_PROBE_BASE_URL = process.env.QIYE_TAB_PROBE_BASE_URL || "";
const uiActionRegistry = createUIActionRegistry();
const shortcutRegistry = new ShortcutRegistry(uiActionRegistry, { platform: process.platform });
const shortcutDispatcher = new ShortcutDispatcher(shortcutRegistry, uiActionRegistry);

async function createUIActionAuditReport() {
  const audit = new UIActionAuditService({
    registry: uiActionRegistry,
    testedActionIds: UI_ACTION_IDS,
    criticalControlScope: {
      includeMarked: true,
      ids: [],
      ignoreNativeCloseControls: true,
      ignoreNativeFormControls: true,
    },
  });
  return audit.auditProject({
    projectRoot: PROJECT_ROOT,
    htmlFiles: ["renderer/index.html", "renderer/detached.html"],
    jsFiles: ["renderer/app.js", "renderer/detached.js"],
    preloadFiles: [
      "electron/preload.cjs",
      "electron/detached-preload.cjs",
      "electron/user-script-preload.cjs",
    ],
    mainFiles: ["electron/main.cjs"],
    testedActionIds: UI_ACTION_IDS,
    boundActionIds: UI_ACTION_IDS,
  });
}
const TEST_USER_DATA = process.env.QIYE_TEST_USER_DATA;
const CAPTURE_WIDTH = Math.max(
  1060,
  Number.parseInt(process.env.QIYE_CAPTURE_WIDTH || "1480", 10) || 1480,
);
const CAPTURE_HEIGHT = Math.max(
  700,
  Number.parseInt(process.env.QIYE_CAPTURE_HEIGHT || "920", 10) || 920,
);
const CHROME_BOOKMARK_STORES = [
  { fileName: "Bookmarks", key: "local", label: "本机书签" },
  { fileName: "AccountBookmarks", key: "account", label: "Google 账号书签" },
];

if (TEST_USER_DATA) {
  app.setPath("userData", path.resolve(TEST_USER_DATA));
}

app.enableSandbox();

const DEFAULT_SITES = [
  {
    id: "nodeseek-info",
    name: "NodeSeek 情报",
    shortName: "NS",
    url: "https://www.nodeseek.com/categories/info",
    color: "#5b7cfa",
    source: "built-in",
    description: "情报版块",
  },
  {
    id: "linux-do",
    name: "LINUX DO",
    shortName: "LD",
    url: "https://linux.do/?tl=en",
    color: "#16a085",
    source: "built-in",
    description: "最新话题",
  },
  {
    id: "naixi-forum",
    name: "奶昔论坛",
    shortName: "奶",
    url: "https://forum.naixi.net/",
    color: "#ec7a5c",
    source: "built-in",
    description: "导读与最新回复",
  },
];

let mainWindow;
let siteView;
let persistentSiteSession;
const browserSessions = new Map();
let siteViewAttached = false;
let siteViewBounds = { x: 288, y: 112, width: 1000, height: 700 };
let currentHomeUrl = "";
let currentSiteId = null;
let browserState;
let activeBrowserWorkspaceId = null;
let workspaceBrowserActivationSequence = 0;
const workspaceBrowserContexts = new Map();
let cachedState;
let lastTabGroupMergeUndo = null;
let stateLoadPromise;
let stateStore;
let recordSyncStore;
let writeQueue = Promise.resolve();
let assistantRegistry;
let assistantExecutionService;
let automationTimer;
let automationRunPromise;
let automationWindow;
let googleDriveSyncService;
let googleSyncMeta;
let googleSyncQueue = Promise.resolve();
let incrementalSyncEngine;
let incrementalSyncTimer;
let incrementalSyncDebounceTimer;
let connectorRegistry;
let connectorConnectionService;
let zohoConnectorService;
let zohoDashboardAbortController;
let zohoDashboardRefreshPromise;
let externalProtocolService;
let downloadManager;
let managedPopupService;
let webContextMenuService;
let browserMediaCapabilityService;
let windowOpenPolicyService;
let connectorSecretStore;
let translationProviderRegistry;
let translationService;
let companionRuntimeService;
let weatherService;
let companionAIService;
let companionPageSummaryExtractor;
const companionSensitiveSiteApprovals = new Set();
let companionSystemLocked = false;
let companionSystemSleeping = false;
let lastCompanionNotificationKey = "";
let companionWidgetAlertTimer;
let companionWidgetAlertMessage = "";
let selectionActionService;
let pageTranslationController;
const translationSessionAllowedHosts = new Set();
let taskReminderScheduler;
let desktopNotificationService;
let trayService;
let appBackgroundService;
let isQuitting = false;
let quitSyncAttempted = false;
let userScriptEngine;
let userScriptSourceService;
let userScriptMetricsFlushTimer;
let userScriptMetricsDirty = false;
let pageResourceService;
let webViewLifecycleManager;
const globalSearchService = new GlobalSearchService();
const timelineSearchIndex = new TimelineSearchIndex();
let timelineSearchIndexReady = false;
let usageTracker;
let usageTrackerTimer;
let habitMutationQueue = Promise.resolve();
let contentTagMutationQueue = Promise.resolve();
const navigationPerformanceTracer = new NavigationPerformanceTracer();
const pageCapabilityOrchestrator = new PageCapabilityOrchestrator({
  idleDelayMs: 350,
  onError: ({ capabilityId, error }) => {
    console.warn(`Deferred page capability failed (${capabilityId}):`, error?.message || error);
  },
});

const IMMEDIATE_CAPABILITY_IDS = Object.freeze([
  "navigation-state",
  "popup-policy",
  "permission-bridge",
  "context-menu",
  "error-recovery",
]);

function dataFilePath() {
  return path.join(app.getPath("userData"), "site-nest-data.json");
}

function syncDatabasePath() {
  return path.join(app.getPath("userData"), "site-nest.db");
}

function googleOAuthConfigPath() {
  return process.env.QIYE_GOOGLE_OAUTH_CONFIG
    ? path.resolve(process.env.QIYE_GOOGLE_OAUTH_CONFIG)
    : path.join(app.getPath("userData"), "google-oauth-client.json");
}

function googleTokenPath() {
  return path.join(app.getPath("userData"), "google-oauth-token.json");
}

function googleClientSecretPath() {
  return path.join(app.getPath("userData"), "google-oauth-client.secure.json");
}

function googleSyncMetaPath() {
  return path.join(app.getPath("userData"), "google-sync-meta.json");
}

function googleSyncBackupPath() {
  return path.join(app.getPath("userData"), "site-nest-data.before-google-sync.json");
}

function connectorSecretPath() {
  return path.join(app.getPath("userData"), "connector-secrets.json");
}

function connectorCachePath() {
  return path.join(app.getPath("userData"), "connector-cache.json");
}

function getConnectorSecretStore() {
  if (!connectorSecretStore) {
    connectorSecretStore = new ConnectorSecretStore({
      filePath: connectorSecretPath(),
      safeStorage,
    });
  }
  return connectorSecretStore;
}

function zohoOAuthConfigPath() {
  return process.env.QIYE_ZOHO_OAUTH_CONFIG
    ? path.resolve(process.env.QIYE_ZOHO_OAUTH_CONFIG)
    : path.join(app.getPath("userData"), "zoho-oauth-client.json");
}

function browserPartitionForProfile(profileId = DEFAULT_BROWSER_PROFILE_ID) {
  if (profileId === DEFAULT_BROWSER_PROFILE_ID) return SITE_PARTITION;
  if (profileId === SAP_BROWSER_PROFILE_ID) return SAP_SITE_PARTITION;
  throw new Error("当前版本尚未启用这个浏览身份");
}

function browserProfileIdForUrl(rawUrl, fallback = DEFAULT_BROWSER_PROFILE_ID) {
  return isSapSessionUrl(rawUrl) ? SAP_BROWSER_PROFILE_ID : fallback;
}

function tabGroupsForWorkspace(workspaceId, options = {}) {
  const groups = Array.isArray(cachedState?.tabGroups) ? cachedState.tabGroups : [];
  return groups
    .filter((group) =>
      group.workspaceId === String(workspaceId || "") &&
      (options.includeDeleted === true || !group.deletedAt),
    )
    .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

function emptyBrowserState(workspaceId, snapshot = {}) {
  const persistedTabs = Array.isArray(snapshot.tabs)
    ? snapshot.tabs
        .filter((tab) => isSafeWebUrl(tab?.url || tab?.currentURL))
        .map((tab) => ({
          tabId: String(tab.tabId || ""),
          siteId: tab.siteId ? String(tab.siteId) : null,
          browserProfileId: String(tab.browserProfileId || DEFAULT_BROWSER_PROFILE_ID),
          title: String(tab.title || ""),
          url: String(tab.url || tab.currentURL),
          loading: false,
          detached: false,
          active: false,
          tabGroupId: tab.tabGroupId ? String(tab.tabGroupId) : null,
          groupSortOrder: Number.isFinite(Number(tab.groupSortOrder)) ? Number(tab.groupSortOrder) : 0,
        }))
    : isSafeWebUrl(snapshot.currentURL)
      ? [
          {
            tabId: String(snapshot.activeTabId || `legacy-${workspaceId}`),
            siteId: snapshot.activeSiteId ? String(snapshot.activeSiteId) : null,
            title: String(snapshot.title || ""),
            url: snapshot.currentURL,
            loading: false,
            detached: false,
            active: true,
          },
        ]
      : [];
  const activeTabId =
    persistedTabs.find((tab) => tab.tabId === String(snapshot.activeTabId || ""))
      ?.tabId ||
    persistedTabs[0]?.tabId ||
    null;
  persistedTabs.forEach((tab) => {
    tab.active = tab.tabId === activeTabId;
  });
  const activeTab = persistedTabs.find((tab) => tab.active) || null;
  const currentURL = activeTab?.url || null;
  const activeSiteId = activeTab?.siteId || null;
  const homeURL = isSafeWebUrl(snapshot.homeURL) ? snapshot.homeURL : currentURL;
  return {
    workspaceId,
    activeTabId,
    tabs: persistedTabs,
    tabGroups: tabGroupsForWorkspace(workspaceId),
    siteId: activeSiteId,
    activeSiteId,
    hasOpenPage: Boolean(currentURL),
    title: "",
    url: currentURL || "",
    currentURL,
    homeURL,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zoomFactor: 1,
    securityState: securityStateForUrl(currentURL),
    error: "",
    siteIssue: "",
  };
}

browserState = emptyBrowserState(null);

function createRuntimeTab(workspaceId, persisted = {}) {
  const requestedUrl = persisted.url || persisted.currentURL;
  const restoredUrl = durableBrowserUrl(requestedUrl);
  const url = isSafeWebUrl(restoredUrl)
    ? String(restoredUrl)
    : "";
  const homeURL =
    (isSafeWebUrl(persisted.homeURL) && String(persisted.homeURL)) || url;
  const tabId = String(persisted.tabId || randomUUID());
  const siteId = persisted.siteId ? String(persisted.siteId) : null;
  const browserProfileId = browserProfileIdForUrl(
    url || homeURL,
    String(persisted.browserProfileId || DEFAULT_BROWSER_PROFILE_ID),
  );
  browserPartitionForProfile(browserProfileId);
  const sapUrls = [homeURL, url].filter((candidate) => isSapSessionUrl(candidate));
  const lastSapNavigationUrl =
    sapUrls.find((candidate) => isSapSearchTarget(candidate)) || "";
  const sapSessionOrigins = new Set();
  for (const candidate of sapUrls) {
    try {
      sapSessionOrigins.add(new URL(candidate).origin);
    } catch {
      // Invalid URLs are already excluded above.
    }
  }
  return {
    workspaceId,
    tabId,
    view: null,
    attached: false,
    viewOwner: "none",
    attachRequested: false,
    detached: false,
    detachedWindow: null,
    detachedCloseMode: "",
    allowDuplicate: persisted.allowDuplicate === true,
    tabGroupId: persisted.tabGroupId ? String(persisted.tabGroupId) : null,
    groupSortOrder: Number.isFinite(Number(persisted.groupSortOrder))
      ? Number(persisted.groupSortOrder)
      : 0,
    keepRunning: persisted.keepRunning === true,
    runtimeState: new SessionRuntimeState("suspended"),
    suspensionReason: "",
    lastSuspendedAt: null,
    favicon: isSafeWebUrl(persisted.favicon) ? String(persisted.favicon) : null,
    createdAt: typeof persisted.createdAt === "string"
      ? persisted.createdAt
      : new Date().toISOString(),
    lastActiveAt: typeof persisted.lastActiveAt === "string"
      ? persisted.lastActiveAt
      : new Date().toISOString(),
    reliableContext:
      persisted.reliableContext && typeof persisted.reliableContext === "object"
        ? { ...persisted.reliableContext }
        : null,
    currentHomeUrl: homeURL,
    currentSiteId: siteId,
    browserProfileId,
    browserState: {
      tabId,
      workspaceId,
      siteId,
      activeSiteId: siteId,
      hasOpenPage: Boolean(url),
      title: String(persisted.title || ""),
      url,
      currentURL: url || null,
      homeURL:
        homeURL || null,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      zoomFactor: 1,
      securityState: securityStateForUrl(url),
      error: "",
      siteIssue: "",
    },
    nodeSeekAutoRetryUsed: false,
    lastSapNavigationUrl,
    sapSessionOrigins,
    navigationTraceId: null,
    navigationDidStopTraceId: null,
    lastNavigationTrace: null,
  };
}

function ensureWorkspaceBrowserContext(workspaceId, snapshot = {}) {
  const id = String(workspaceId || "");
  let workspace = workspaceBrowserContexts.get(id);
  if (!workspace) {
    workspace = {
      workspaceId: id,
      tabs: new Map(),
      activeTabId: null,
      browserState: emptyBrowserState(id, snapshot),
    };
    workspaceBrowserContexts.set(id, workspace);
  }
  if (workspace.tabs.size === 0) {
    const sourceTabs = Array.isArray(snapshot.tabs)
      ? snapshot.tabs
      : isSafeWebUrl(snapshot.currentURL)
        ? [
            {
              tabId: snapshot.activeTabId || `legacy-${id}`,
              siteId: snapshot.activeSiteId || null,
              title: snapshot.title || "",
              url: snapshot.currentURL,
              homeURL: snapshot.homeURL,
            },
          ]
        : [];
    for (const persisted of sourceTabs) {
      const tab = createRuntimeTab(id, persisted);
      if (!tab.browserState.currentURL || workspace.tabs.has(tab.tabId)) continue;
      workspace.tabs.set(tab.tabId, tab);
    }
    const requested = String(snapshot.activeTabId || "");
    workspace.activeTabId = workspace.tabs.has(requested)
      ? requested
      : workspace.tabs.keys().next().value || null;
  }
  workspace.browserState = browserStateForWorkspace(workspace);
  return workspace;
}

function activeWorkspaceBrowserContext() {
  return activeBrowserWorkspaceId
    ? workspaceBrowserContexts.get(activeBrowserWorkspaceId) || null
    : null;
}

function activeBrowserContext(workspace = activeWorkspaceBrowserContext()) {
  return workspace?.activeTabId
    ? workspace.tabs.get(workspace.activeTabId) || null
    : null;
}

function findRuntimeTab(tabId) {
  const id = String(tabId || "");
  for (const workspace of workspaceBrowserContexts.values()) {
    const tab = workspace.tabs.get(id);
    if (tab) return { workspace, tab };
  }
  return null;
}

function tabSummary(tab, activeTabId) {
  const audioState = readWebContentsAudioState(tab.view?.webContents);
  const liveURL =
    tab.view && !tab.view.webContents.isDestroyed()
      ? tab.view.webContents.getURL()
      : "";
  return {
    tabId: tab.tabId,
    sessionId: tab.tabId,
    workspaceId: tab.workspaceId,
    siteId: tab.currentSiteId || null,
    browserProfileId: tab.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    title:
      (tab.view && !tab.view.webContents.isDestroyed()
        ? tab.view.webContents.getTitle()
        : "") || tab.browserState.title || "",
    url: (isSafeWebUrl(liveURL) && liveURL) || tab.browserState.currentURL || "",
    normalizedUrl: (isSafeWebUrl(liveURL) && normalizeUrl(liveURL)) ||
      (isSafeWebUrl(tab.browserState.currentURL) && normalizeUrl(tab.browserState.currentURL)) || "",
    favicon: tab.favicon || null,
    createdAt: tab.createdAt,
    lastActiveAt: tab.lastActiveAt,
    loadingState: Boolean(
      tab.view && !tab.view.webContents.isDestroyed()
        ? tab.view.webContents.isLoading()
        : tab.browserState.loading,
    ) ? "loading" : "idle",
    errorState: tab.browserState.error || null,
    reliableContext: tab.reliableContext || null,
    loading: Boolean(
      tab.view && !tab.view.webContents.isDestroyed()
        ? tab.view.webContents.isLoading()
        : tab.browserState.loading,
    ),
    detached: Boolean(tab.detached),
    allowDuplicate: Boolean(tab.allowDuplicate),
    tabGroupId: tab.tabGroupId || null,
    groupSortOrder: Number(tab.groupSortOrder) || 0,
    keepRunning: Boolean(tab.keepRunning),
    lifecycleState: tab.runtimeState?.state || (tab.view ? "warm" : "suspended"),
    audible: audioState.audible,
    muted: audioState.muted,
    active: tab.tabId === activeTabId,
  };
}

function browserStateForWorkspace(workspace) {
  if (!workspace) return emptyBrowserState(activeBrowserWorkspaceId);
  const tabs = Array.from(workspace.tabs.values()).map((tab) =>
    tabSummary(tab, workspace.activeTabId),
  );
  const activeTab = activeBrowserContext(workspace);
  const embeddedState = activeTab && !activeTab.detached
    ? activeTab.browserState
    : null;
  return {
    ...(embeddedState || emptyBrowserState(workspace.workspaceId)),
    workspaceId: workspace.workspaceId,
    activeTabId: workspace.activeTabId,
    tabs,
    tabGroups: tabGroupsForWorkspace(workspace.workspaceId),
    siteId: embeddedState?.siteId || null,
    activeSiteId: embeddedState?.activeSiteId || null,
    hasOpenPage: Boolean(embeddedState?.currentURL),
    title: embeddedState?.title || "",
    url: embeddedState?.currentURL || "",
    currentURL: embeddedState?.currentURL || null,
    homeURL: embeddedState?.homeURL || null,
  };
}

function syncActiveBrowserAliases(context = activeBrowserContext()) {
  const workspace = activeWorkspaceBrowserContext();
  const requestedContextIsActive = Boolean(
    context?.tabId &&
      workspace &&
      context.workspaceId === workspace.workspaceId &&
      workspace.activeTabId === context.tabId &&
      workspace.tabs.get(context.tabId) === context,
  );
  const activeTab = requestedContextIsActive
    ? context
    : activeBrowserContext(workspace);
  siteView = activeTab?.view || null;
  siteViewAttached = Boolean(activeTab?.attached);
  currentHomeUrl = activeTab?.currentHomeUrl || "";
  currentSiteId = activeTab?.currentSiteId || null;
  if (workspace) workspace.browserState = browserStateForWorkspace(workspace);
  browserState = workspace?.browserState || emptyBrowserState(activeBrowserWorkspaceId);
}

function normalizeUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(value)
    ? value
    : `https://${value}`;
  const parsed = new URL(withProtocol);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("仅支持 HTTP 或 HTTPS 网站");
  }
  return parsed.toString();
}

function isSafeWebUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function hasExpectedHost(rawUrl, expectedHost) {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return host === expectedHost || host.endsWith(`.${expectedHost}`);
  } catch {
    return false;
  }
}

function rememberSapNavigation(context, rawUrl) {
  if (!context || !isSapSessionUrl(rawUrl)) return;
  if (isSapSearchTarget(rawUrl)) context.lastSapNavigationUrl = String(rawUrl || "").trim();
  try {
    context.sapSessionOrigins ||= new Set();
    const origin = new URL(rawUrl).origin;
    if (!context.sapSessionOrigins.has(origin) && context.sapSessionOrigins.size >= 20) {
      context.sapSessionOrigins.delete(context.sapSessionOrigins.values().next().value);
    }
    context.sapSessionOrigins.add(origin);
  } catch {
    // Invalid URLs never enter the SAP recovery set.
  }
}

function getStateStore() {
  if (!stateStore) {
    stateStore = createStateStore(dataFilePath(), {
      defaultSites: DEFAULT_SITES,
      persistMissing: true,
    });
  }
  return stateStore;
}

function getRecordSyncStore() {
  if (!recordSyncStore) {
    recordSyncStore = new RecordSyncStore(syncDatabasePath(), {
      deviceName: os.hostname(),
      platform: process.platform,
      appVersion: app.getVersion(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }
  return recordSyncStore;
}

async function mirrorCompatibilityState(state) {
  try {
    return await getStateStore().save(state);
  } catch (error) {
    console.error("Unable to update JSON compatibility mirror:", error?.message || error);
    return state;
  }
}

async function commitPrimaryState(state, options = {}) {
  const normalized = migrateState(state, { defaultSites: DEFAULT_SITES }).state;
  getRecordSyncStore().commitState(normalized, {
    emitOutbox: options.emitOutbox !== false,
  });
  await mirrorCompatibilityState(normalized);
  if (options.scheduleSync !== false) scheduleIncrementalGoogleSync();
  return normalized;
}

async function getState() {
  if (cachedState) return cachedState;
  if (!stateLoadPromise) {
    stateLoadPromise = getStateStore()
      .load()
      .then(async (loaded) => {
        const primary = getRecordSyncStore().initialize(loaded.state);
        const migration = migrateState(primary.state, { defaultSites: DEFAULT_SITES });
        cachedState = migration.state;
        if (migration.changed) {
          getRecordSyncStore().commitState(cachedState, { emitOutbox: false });
        }
        if (!primary.migrated || migration.changed) {
          await mirrorCompatibilityState(cachedState);
        }
        if (loaded.migrated) {
          console.info(
            `State migrated safely from v${loaded.fromVersion} to v${loaded.toVersion}`,
          );
        }
        return cachedState;
      })
      .finally(() => {
        stateLoadPromise = undefined;
      });
  }
  return stateLoadPromise;
}

function persistState() {
  cachedState.updatedAt = new Date().toISOString();
  const snapshot = JSON.stringify(cachedState, null, 2);
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      await commitPrimaryState(JSON.parse(snapshot));
    });
  return writeQueue;
}

function scheduleUserScriptMetricsPersist() {
  userScriptMetricsDirty = true;
  if (userScriptMetricsFlushTimer) return;
  userScriptMetricsFlushTimer = setTimeout(() => {
    userScriptMetricsFlushTimer = undefined;
    if (!userScriptMetricsDirty) return;
    userScriptMetricsDirty = false;
    void persistState().catch((error) => {
      userScriptMetricsDirty = true;
      console.error("Unable to persist batched user-script metrics:", error?.message || error);
    });
  }, 2_000);
  userScriptMetricsFlushTimer.unref?.();
}

async function commitStateCandidate(candidate) {
  const snapshot = JSON.parse(JSON.stringify({
    ...(candidate && typeof candidate === "object" ? candidate : {}),
    updatedAt: new Date().toISOString(),
  }));
  let saved;
  writeQueue = writeQueue
    .catch(() => undefined)
    .then(async () => {
      saved = await commitPrimaryState(snapshot);
      return saved;
    });
  await writeQueue;
  cachedState = saved;
  return saved;
}

function browserOwnerWindow(context) {
  if (context?.detachedWindow && !context.detachedWindow.isDestroyed()) {
    return context.detachedWindow;
  }
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
}

function emitBrowserNotice(message, tone = "info") {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("browser:notice", {
    message: String(message || "").slice(0, 240),
    tone: tone === "error" ? "error" : "info",
  });
}

async function addCurrentPageToSites(context) {
  if (!context?.view || context.view.webContents.isDestroyed()) return null;
  const url = context.view.webContents.getURL();
  if (!isSafeWebUrl(url)) throw new Error("当前页面不是可保存的网站");
  const state = await getState();
  const title = String(context.view.webContents.getTitle() || new URL(url).hostname)
    .trim()
    .slice(0, 80);
  const result = addSiteToState(state, {
    name: title || new URL(url).hostname,
    url,
    workspaceId: context.workspaceId,
    browserProfileId: context.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    pinned: false,
  }, { defaultSites: DEFAULT_SITES });
  cachedState = result.state;
  if (!result.existed) await persistState();
  emitBrowserNotice(result.existed ? "当前页面已在我的站点中" : "已添加到我的站点");
  return result;
}

async function currentTranslationSettings() {
  const state = await getState();
  return normalizeTranslationSettings(state.uiSettings?.translation);
}

async function saveTranslationSettings(settings) {
  const state = await getState();
  const result = updateUiSettingsInState(state, {
    translation: normalizeTranslationSettings(settings),
  }, { defaultSites: DEFAULT_SITES });
  cachedState = result.state;
  await persistState();
  const enabled = result.uiSettings.translation.selectionButtonEnabled !== false;
  if (selectionActionService) {
    for (const workspace of workspaceBrowserContexts.values()) {
      for (const context of workspace.tabs.values()) {
        if (context.view && !context.view.webContents.isDestroyed()) {
          void selectionActionService.installTrigger(context.view.webContents, enabled);
        }
      }
    }
  }
  return result.uiSettings.translation;
}

async function setTranslationSiteRule(rawUrl, patch = {}) {
  const settings = await currentTranslationSettings();
  const parsed = new URL(String(rawUrl || ""));
  const hostnamePattern = parsed.hostname.toLowerCase();
  const current = settings.siteRules.find((rule) => rule.hostnamePattern === hostnamePattern) || {
    hostnamePattern,
    mode: "manual",
    privacyAllowed: false,
  };
  settings.siteRules = [
    ...settings.siteRules.filter((rule) => rule.hostnamePattern !== hostnamePattern),
    { ...current, ...patch, hostnamePattern },
  ];
  await saveTranslationSettings(settings);
  return settings.siteRules.find((rule) => rule.hostnamePattern === hostnamePattern);
}

async function confirmSensitiveTranslation(rawUrl) {
  if (!isSensitiveTranslationUrl(rawUrl)) return true;
  let hostname = "";
  try {
    hostname = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return false;
  }
  const settings = await currentTranslationSettings();
  const rule = siteRuleForUrl(settings, rawUrl);
  if (rule?.privacyAllowed || translationSessionAllowedHosts.has(hostname)) return true;
  const result = await dialog.showMessageBox(browserOwnerWindow(activeBrowserContext()), {
    type: "warning",
    title: "确认发送页面文字",
    message: "本次操作会将页面中的可见文字发送到当前 DeepSeek 或兼容 AI 服务。",
    detail: `${hostname}\n整页翻译不读取密码、Cookie、输入框值、隐藏表单和授权信息；划词翻译与查询只使用你主动选择的文字。`,
    buttons: ["取消", "仅本次允许", "始终允许此网站"],
    defaultId: 0,
    cancelId: 0,
    noLink: true,
  });
  if (result.response === 1) {
    translationSessionAllowedHosts.add(hostname);
    return true;
  }
  if (result.response === 2) {
    await setTranslationSiteRule(rawUrl, { privacyAllowed: true });
    return true;
  }
  return false;
}

function getTranslationServices() {
  if (translationService && selectionActionService && pageTranslationController) {
    return { registry: translationProviderRegistry, service: translationService, selection: selectionActionService, page: pageTranslationController };
  }
  translationProviderRegistry = new TranslationProviderRegistry();
  translationProviderRegistry.register(new OpenAICompatibleTranslationProvider({
    fetchFn: (...args) => net.fetch(...args),
  }));
  translationService = new TranslationService({
    registry: translationProviderRegistry,
    secretStore: getConnectorSecretStore(),
    getSettings: currentTranslationSettings,
    saveSettings: saveTranslationSettings,
  });
  selectionActionService = new SelectionActionService({
    translationService,
    onNotice: emitBrowserNotice,
    openExternal: (url) => shell.openExternal(url),
    confirmSensitive: confirmSensitiveTranslation,
  });
  pageTranslationController = new PageTranslationController({
    translationService,
    extractor: new PageTextExtractor(),
    renderer: new PageTranslationRenderer(),
    getSettings: currentTranslationSettings,
    confirmSensitive: confirmSensitiveTranslation,
    onNotice: emitBrowserNotice,
  });
  return { registry: translationProviderRegistry, service: translationService, selection: selectionActionService, page: pageTranslationController };
}

async function handleTranslationInternalAction(details, context, contents) {
  let action = "";
  try {
    action = new URL(details.url).hostname;
  } catch {
    return false;
  }
  const translation = getTranslationServices();
  if (action === "translation-selection-button") return translation.selection.translateCurrentSelection(contents, context);
  if (action === "translation-retry") return translation.selection.retry(contents, context);
  if (action === "selection-insight-retry") return translation.selection.retryInsight(contents, context);
  if (action === "translation-open-external") return translation.selection.openInTranslationWebsite(contents);
  if (action === "translation-close") return translation.selection.clear(contents);
  if (action === "translation-dynamic") return translation.page.translateDynamic(context);
  return false;
}

async function updateTranslationLanguage(key, value) {
  const settings = await currentTranslationSettings();
  settings[key] = value;
  await saveTranslationSettings(settings);
}

async function showTranslationPageMenu(context = activeBrowserContext()) {
  const contents = context?.view?.webContents;
  if (!contents || contents.isDestroyed()) return false;
  const translation = getTranslationServices();
  const [status, settings] = await Promise.all([
    translation.service.status(),
    currentTranslationSettings(),
  ]);
  const pageState = translation.page.state(context);
  const currentRule = siteRuleForUrl(settings, contents.getURL());
  const languages = [
    ["auto", "自动检测"], ["zh-CN", "简体中文"], ["en", "英语"],
    ["ja", "日语"], ["ko", "韩语"], ["de", "德语"], ["fr", "法语"], ["es", "西班牙语"],
  ];
  const template = [
    {
      label: status.configured ? "翻译本页" : "翻译本页（Provider 未配置）",
      enabled: status.configured,
      click: () => void translation.page.translate(context, { mode: settings.defaultMode, explicit: true }),
    },
    { type: "separator" },
    {
      label: "双语对照",
      type: "radio",
      checked: pageState.mode === "bilingual" || (!pageState.active && settings.defaultMode === "bilingual"),
      enabled: status.configured,
      click: () => void translation.page.setMode(context, "bilingual"),
    },
    {
      label: "仅显示译文",
      type: "radio",
      checked: pageState.mode === "translated" || (!pageState.active && settings.defaultMode === "translated"),
      enabled: status.configured,
      click: () => void translation.page.setMode(context, "translated"),
    },
    { label: "恢复原文", enabled: pageState.active, click: () => void translation.page.restore(context) },
    { type: "separator" },
    {
      label: `源语言：${languages.find(([id]) => id === settings.sourceLanguage)?.[1] || settings.sourceLanguage}`,
      submenu: languages.map(([id, label]) => ({
        label,
        type: "radio",
        checked: settings.sourceLanguage === id,
        click: () => void updateTranslationLanguage("sourceLanguage", id),
      })),
    },
    {
      label: `目标语言：${languages.find(([id]) => id === settings.targetLanguage)?.[1] || settings.targetLanguage}`,
      submenu: languages.filter(([id]) => id !== "auto").map(([id, label]) => ({
        label,
        type: "radio",
        checked: settings.targetLanguage === id,
        click: () => void updateTranslationLanguage("targetLanguage", id),
      })),
    },
    {
      label: `翻译 Provider：${status.configured ? status.providerName : "未配置"}`,
      click: () => mainWindow?.webContents.send("translation:open-settings"),
    },
    { type: "separator" },
    {
      label: "总是翻译此网站",
      type: "checkbox",
      checked: currentRule?.mode === "always",
      enabled: status.configured,
      click: (item) => void setTranslationSiteRule(contents.getURL(), { mode: item.checked ? "always" : "manual" }),
    },
    {
      label: "不翻译此网站",
      type: "checkbox",
      checked: currentRule?.mode === "never",
      click: (item) => void setTranslationSiteRule(contents.getURL(), { mode: item.checked ? "never" : "manual" }),
    },
  ];
  Menu.buildFromTemplate(template).popup({ window: browserOwnerWindow(context) });
  return true;
}

async function maybeAutoTranslate(context) {
  if (!context?.view || context.view.webContents.isDestroyed()) return;
  const settings = await currentTranslationSettings();
  const url = context.view.webContents.getURL();
  const rule = siteRuleForUrl(settings, url);
  if (rule?.mode !== "always") return;
  if (isSensitiveTranslationUrl(url) && !rule.privacyAllowed) return;
  const status = await getTranslationServices().service.status();
  if (!status.configured) return;
  await getTranslationServices().page.translate(context, { mode: settings.defaultMode, explicit: false });
}

function runtimeTabForWebContentsId(webContentsId) {
  for (const tab of allRuntimeTabs()) {
    if (tab.view?.webContents.id === Number(webContentsId)) return tab;
  }
  return null;
}

function getPageResourceService() {
  if (pageResourceService) return pageResourceService;
  pageResourceService = new PageResourceService({
    onChanged: (snapshot) => {
      const tab = runtimeTabForWebContentsId(snapshot.webContentsId);
      if (tab && tab === activeBrowserContext()) {
        mainWindow?.webContents.send("resources:changed", snapshot);
      }
    },
  });
  return pageResourceService;
}

async function inspectCurrentPageResources(seed = []) {
  const context = activeBrowserContext();
  if (!context?.view || context.view.webContents.isDestroyed()) throw new Error("当前没有可扫描的网页");
  const result = await getPageResourceService().inspect(context.view.webContents, seed);
  mainWindow?.webContents.send("assistants:open-panel");
  return result;
}

function getBrowserServices() {
  if (managedPopupService && webContextMenuService && browserMediaCapabilityService && downloadManager) {
    return {
      downloads: downloadManager,
      externalProtocol: externalProtocolService,
      managedPopups: managedPopupService,
      contextMenus: webContextMenuService,
      media: browserMediaCapabilityService,
      windowPolicy: windowOpenPolicyService,
    };
  }
  externalProtocolService = new ExternalProtocolService({ shell, dialog });
  downloadManager = new DownloadManager({
    app,
    dialog,
    getOwnerWindow: () => browserOwnerWindow(activeBrowserContext()),
    onStatus: ({ status, filename }) => {
      if (status === "completed") emitBrowserNotice(`下载完成：${filename}`);
      if (status === "failed") emitBrowserNotice(`下载失败：${filename}`, "error");
    },
  });
  windowOpenPolicyService = new WindowOpenPolicyService({
    getPolicies: () => cachedState?.uiSettings?.sitePopupPolicies || [],
  });
  managedPopupService = new ManagedPopupService({
    BrowserWindow,
    Menu,
    policyService: windowOpenPolicyService,
    externalProtocolService,
    browserPartitionForProfile,
    openTab: (url, options = {}) => {
      const context = options.context || activeBrowserContext();
      if (!context) throw new Error("当前没有可接收新页签的空间");
      return openTransientBrowserTab(context.workspaceId, url, {
        background: options.background === true,
        browserProfileId: context.browserProfileId,
      });
    },
    openExternal: async (url) => {
      if (isSafeWebUrl(url)) await shell.openExternal(url);
    },
    askToOpen: async (details, context, ownerWindow) => {
      const result = await dialog.showMessageBox(ownerWindow || browserOwnerWindow(context), {
        type: "question",
        title: "网页请求打开新窗口",
        message: "是否在栖页新页签中打开？",
        detail: new URL(details.url).hostname,
        buttons: ["阻止", "在新页签打开"],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      });
      if (result.response === 1) {
        await openTransientBrowserTab(context.workspaceId, details.url);
      }
    },
    onBlocked: (decision) => {
      emitBrowserNotice(
        decision.reason === "suspected-ad-popup"
          ? "已阻止疑似广告弹窗"
          : "已按浏览安全策略阻止新窗口",
        "error",
      );
    },
    handleInternalAction: handleTranslationInternalAction,
  });
  webContextMenuService = new WebContextMenuService({
    Menu,
    clipboard,
    actions: {
      openTab: (url, options = {}) => {
        const context = options.context || activeBrowserContext();
        return context
          ? openTransientBrowserTab(context.workspaceId, url, {
              background: options.background === true,
            })
          : null;
      },
      navigateCurrent: (url, context) => browserActionForContext(context, "navigate", url),
      openExternal: (url) => isSafeWebUrl(url) ? shell.openExternal(url) : null,
      browserAction: (action, context) => browserActionForContext(context, action),
      translateSelection: (input) => getTranslationServices().selection.translate(input),
      querySelection: (input) => getTranslationServices().selection.query(input),
      togglePictureInPicture: ({ webContents, x, y }) =>
        browserMediaCapabilityService.togglePictureInPicture(webContents, { x, y }),
      toggleVideoFullscreen: ({ webContents, x, y }) =>
        browserMediaCapabilityService.toggleVideoFullscreen(webContents, { x, y }),
      translatePage: ({ context }) => showTranslationPageMenu(context),
      addCurrentPage: ({ context }) => void addCurrentPageToSites(context),
      openPageActions: () => mainWindow?.webContents.send("assistants:open-panel"),
      inspectResource: (resource) => void inspectCurrentPageResources([{
        url: resource?.url,
        sourceElement: resource?.mediaType || "a",
        declaredDownload: true,
      }]).catch((error) => emitBrowserNotice(error?.message || "资源扫描失败", "error")),
    },
  });
  browserMediaCapabilityService = new BrowserMediaCapabilityService({
    onNotice: emitBrowserNotice,
  });
  return {
    downloads: downloadManager,
    externalProtocol: externalProtocolService,
    managedPopups: managedPopupService,
    contextMenus: webContextMenuService,
    media: browserMediaCapabilityService,
    windowPolicy: windowOpenPolicyService,
  };
}

function getConnectorServices() {
  if (connectorConnectionService && zohoConnectorService) {
    return {
      registry: connectorRegistry,
      connections: connectorConnectionService,
      zoho: zohoConnectorService,
    };
  }
  connectorRegistry = new ConnectorRegistry();
  const secretStore = getConnectorSecretStore();
  const cache = new ConnectorCache({
    filePath: connectorCachePath(),
    defaultTtlMs: 5 * 60 * 1000,
  });
  const executionService = new ConnectorExecutionService({
    maxRetries: 1,
    onExecution: async (execution) => {
      const state = await getState();
      const result = appendConnectorExecutionInState(state, execution, {
        defaultSites: DEFAULT_SITES,
      });
      cachedState = result.state;
      await persistState();
    },
  });
  zohoConnectorService = new ZohoConnectorService({
    getState,
    saveConnection: async (connection) => {
      const state = await getState();
      const result = upsertConnectorConnectionInState(state, connection, {
        defaultSites: DEFAULT_SITES,
      });
      cachedState = result.state;
      await persistState();
      return result.connection;
    },
    secretStore,
    cache,
    executionService,
    oauthConfigPath: zohoOAuthConfigPath(),
    openExternal: (url) => shell.openExternal(url),
    fetchFn: (...args) => net.fetch(...args),
  });
  connectorConnectionService = new ConnectorConnectionService({
    registry: connectorRegistry,
  });
  connectorConnectionService.register("zoho-desk", zohoConnectorService);
  return {
    registry: connectorRegistry,
    connections: connectorConnectionService,
    zoho: zohoConnectorService,
  };
}

function getGoogleDriveSyncService() {
  if (!googleDriveSyncService) {
    googleDriveSyncService = new GoogleDriveSyncService({
      configPath: googleOAuthConfigPath(),
      tokenPath: googleTokenPath(),
      configSecretPath: googleClientSecretPath(),
      redactConfigAfterImport: true,
      openExternal: (url) => shell.openExternal(url),
      // Use Chromium's network stack so OAuth and Drive follow the same
      // Windows proxy configuration as the user's browser.
      fetchFn: (...args) => net.fetch(...args),
      safeStorage,
      logger: {
        warn: (message) => console.warn("Google sync:", String(message || "")),
      },
    });
  }
  return googleDriveSyncService;
}

function getIncrementalSyncEngine() {
  if (!incrementalSyncEngine) {
    incrementalSyncEngine = new IncrementalSyncEngine({
      store: getRecordSyncStore(),
      appVersion: app.getVersion(),
      schemaVersion: CURRENT_SCHEMA_VERSION,
    });
  }
  return incrementalSyncEngine;
}

function incrementalSyncRuntime() {
  try {
    return getRecordSyncStore().runtimeSummary();
  } catch (error) {
    return {
      databaseHealthy: false,
      status: "failed",
      pendingUploadCount: 0,
      pendingApplyCount: 0,
      conflictCount: 0,
      lastErrorCode: String(error?.code || "LOCAL_DATABASE_ERROR"),
    };
  }
}

async function loadGoogleSyncMeta() {
  if (googleSyncMeta) return googleSyncMeta;
  try {
    const parsed = JSON.parse(await fsp.readFile(googleSyncMetaPath(), "utf8"));
    googleSyncMeta = {
      lastSyncAt:
        typeof parsed?.lastSyncAt === "string" ? parsed.lastSyncAt : null,
      lastDirection:
        typeof parsed?.lastDirection === "string" ? parsed.lastDirection : null,
      lastMessage:
        typeof parsed?.lastMessage === "string"
          ? parsed.lastMessage.slice(0, 300)
          : null,
      lastRestoreAt: typeof parsed?.lastRestoreAt === "string" ? parsed.lastRestoreAt : null,
      lastSyncRevision: typeof parsed?.lastSyncRevision === "string" ? parsed.lastSyncRevision : null,
      remoteRevision: typeof parsed?.remoteRevision === "string" ? parsed.remoteRevision : null,
      localRevision: typeof parsed?.localRevision === "string" ? parsed.localRevision : null,
      deviceId: typeof parsed?.deviceId === "string" ? parsed.deviceId : randomUUID(),
      deviceName: typeof parsed?.deviceName === "string" ? parsed.deviceName : os.hostname(),
      tombstones: Array.isArray(parsed?.tombstones) ? parsed.tombstones.slice(0, 5000) : [],
      conflict: parsed?.conflict && typeof parsed.conflict === "object" ? parsed.conflict : null,
      lastErrorCode: typeof parsed?.lastErrorCode === "string" ? parsed.lastErrorCode : null,
      lastErrorMessage: typeof parsed?.lastErrorMessage === "string" ? parsed.lastErrorMessage.slice(0, 500) : null,
      errorStatus: typeof parsed?.errorStatus === "string" ? parsed.errorStatus : null,
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Google sync metadata could not be read");
    }
    googleSyncMeta = {
      lastSyncAt: null,
      lastDirection: null,
      lastMessage: null,
      lastRestoreAt: null,
      lastSyncRevision: null,
      remoteRevision: null,
      localRevision: null,
      deviceId: randomUUID(),
      deviceName: os.hostname(),
      tombstones: [],
      conflict: null,
      lastErrorCode: null,
      lastErrorMessage: null,
      errorStatus: null,
    };
  }
  return googleSyncMeta;
}

async function saveGoogleSyncMeta(patch) {
  const current = await loadGoogleSyncMeta();
  googleSyncMeta = { ...current, ...patch };
  await atomicWriteJson(googleSyncMetaPath(), googleSyncMeta);
  return googleSyncMeta;
}

function googleSyncUiStatus(serviceStatus, meta = {}) {
  const incremental = incrementalSyncRuntime();
  const statusError = serviceStatus?.error;
  const configured = Boolean(serviceStatus?.configured);
  const identity = serviceStatus?.identity || {
    status: serviceStatus?.signedIn ? "signedIn" : "signedOut",
    email: serviceStatus?.email || null,
  };
  const drive = serviceStatus?.drive || {
    status: !configured ? "notConfigured" : serviceStatus?.signedIn ? "ready" : "authorizationRequired",
    grantedScopes: [],
    requiredScopes: [],
  };
  const driveStatus = meta.conflict || incremental.conflictCount > 0
    ? "conflict"
    : incremental.status === "syncing"
      ? "syncing"
      : meta.errorStatus || (statusError ? "error" : drive.status);
  const sanitizedError = meta.lastErrorMessage || statusError?.message || drive.sanitizedErrorMessage || "";
  const grantedScopeList = Array.isArray(drive.grantedScopes) ? drive.grantedScopes : [];
  const publicGrantedScopes = {
    identity: ["openid", "email", "profile"].every((scope) => grantedScopeList.includes(scope)),
    driveAppData: grantedScopeList.includes("https://www.googleapis.com/auth/drive.appdata"),
  };
  const health = deriveDataHealthStatus({
    configured,
    signedIn: identity.status === "signedIn",
    driveStatus,
    errorCode: meta.lastErrorCode || statusError?.code || drive.lastErrorCode || null,
    online: net.isOnline(),
    incremental,
  });
  return {
    configured,
    identity: { ...identity, status: identity.status || "signedOut" },
    drive: {
      status: driveStatus,
      grantedScopes: publicGrantedScopes,
      requiredScopesSatisfied: publicGrantedScopes.identity && publicGrantedScopes.driveAppData,
      lastSyncAt: meta.lastSyncAt || null,
      lastRestoreAt: meta.lastRestoreAt || null,
      remoteRevision: meta.remoteRevision || null,
      localRevision: meta.localRevision || null,
      lastErrorCode: meta.lastErrorCode || statusError?.code || drive.lastErrorCode || null,
      sanitizedErrorMessage: sanitizedError,
      pendingUploadCount: incremental.pendingUploadCount,
      pendingApplyCount: incremental.pendingApplyCount,
      conflictCount: incremental.conflictCount,
      databaseHealthy: incremental.databaseHealthy,
      deviceId: incremental.deviceId || null,
    },
    signedIn: identity.status === "signedIn",
    email: identity.email || null,
    lastSyncAt: meta.lastSyncAt || null,
    lastRestoreAt: meta.lastRestoreAt || null,
    remoteRevision: meta.remoteRevision || null,
    localRevision: meta.localRevision || null,
    deviceName: meta.deviceName || os.hostname(),
    oauthConfigPath: googleOAuthConfigPath(),
    conflict: meta.conflict || null,
    lastDirection: meta.lastDirection || null,
    status: driveStatus,
    error: sanitizedError,
    errorCode: meta.lastErrorCode || statusError?.code || drive.lastErrorCode || null,
    incremental,
    ...health,
  };
}

function driveStatusForError(code) {
  return {
    GOOGLE_CLIENT_CONFIG_MISSING: "notConfigured",
    GOOGLE_CONFIG_NOT_FOUND: "notConfigured",
    DRIVE_SCOPE_MISSING: "authorizationRequired",
    GOOGLE_NOT_SIGNED_IN: "authorizationRequired",
    GOOGLE_AUTH_EXPIRED: "tokenExpired",
    GOOGLE_TOKEN_REFRESH_FAILED: "tokenExpired",
    GOOGLE_PERMISSION_DENIED: "permissionDenied",
    DRIVE_API_DISABLED: "apiDisabled",
    GOOGLE_TEST_USER_REQUIRED: "testUserRequired",
    GOOGLE_NETWORK_ERROR: "networkError",
    GOOGLE_REQUEST_TIMEOUT: "networkError",
    GOOGLE_NETWORK_FAILED: "networkError",
    GOOGLE_RATE_LIMITED: "error",
    GOOGLE_SYNC_CONFLICT: "conflict",
  }[String(code || "")] || "error";
}

async function rememberGoogleFailure(error) {
  const friendly = friendlyGoogleSyncError(error);
  const meta = await saveGoogleSyncMeta({
    lastErrorCode: friendly.code,
    lastErrorMessage: friendly.message,
    errorStatus: driveStatusForError(friendly.code),
  });
  return googleSyncUiStatus(await getGoogleDriveSyncService().status(), meta);
}

async function clearGoogleFailure(patch = {}) {
  return saveGoogleSyncMeta({
    lastErrorCode: null,
    lastErrorMessage: null,
    errorStatus: null,
    ...patch,
  });
}

async function appendGoogleTombstones(moduleName, ids) {
  const meta = await loadGoogleSyncMeta();
  const now = new Date().toISOString();
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const additions = (Array.isArray(ids) ? ids : [ids])
    .map((id) => String(id || "").trim())
    .filter(Boolean)
    .map((id) => ({ id, module: String(moduleName || "unknown").slice(0, 80), deletedAt: now }));
  const keyed = new Map();
  for (const item of [...(meta.tombstones || []), ...additions]) {
    if (Date.parse(item.deletedAt || "") < cutoff) continue;
    keyed.set(`${item.module}:${item.id}`, item);
  }
  await saveGoogleSyncMeta({ tombstones: Array.from(keyed.values()).slice(-5000) });
}

function friendlyGoogleSyncError(error) {
  const wrapped = new Error(String(error?.message || "Google 同步失败"));
  wrapped.code = String(error?.code || "GOOGLE_SYNC_FAILED");
  return wrapped;
}

async function googleSyncStatus() {
  const [serviceStatus, meta] = await Promise.all([
    getGoogleDriveSyncService().status(),
    loadGoogleSyncMeta(),
  ]);
  return googleSyncUiStatus(serviceStatus, meta);
}

function compactStatusTime(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "尚无记录";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

async function showDataStatusMenu() {
  const status = await googleSyncStatus();
  const runtime = status.incremental || {};
  const syncLabels = {
    notConfigured: "Google Drive 未配置",
    idle: "同步正常",
    syncing: "正在同步",
    offline: "离线，等待同步",
    authRequired: "需要重新授权",
    conflict: "存在记录冲突",
    failed: "同步失败",
  };
  const title = status.topTone === "error" ? "数据需要处理" : status.topTone === "neutral" ? "本地数据正常" : "数据正常";
  const template = [
    { label: title, enabled: false },
    { type: "separator" },
    { label: `本地数据库：${status.dataHealth === "healthy" ? "正常" : "失败"}`, enabled: false },
    { label: `最后本地保存：${compactStatusTime(runtime.lastLocalSaveAt)}`, enabled: false },
    { type: "separator" },
    { label: `Google Drive：${syncLabels[status.syncRuntime] || "状态未知"}`, enabled: false },
    { label: `账号：${status.email || "未连接"}`, enabled: false },
    { label: `最后成功：${compactStatusTime(runtime.lastSuccessfulSyncAt || status.lastSyncAt)}`, enabled: false },
    { label: `待上传 ${runtime.pendingUploadCount || 0} · 待应用 ${runtime.pendingApplyCount || 0} · 冲突 ${runtime.conflictCount || 0}`, enabled: false },
    { type: "separator" },
    {
      label: "立即同步",
      enabled: status.signedIn && ["idle", "offline", "failed"].includes(status.syncRuntime),
      click: () => {
        void syncGoogleNow().then((result) => {
          mainWindow?.webContents.send("data-status:updated", result);
        });
      },
    },
    {
      label: "查看同步冲突",
      enabled: (runtime.conflictCount || 0) > 0,
      click: () => mainWindow?.webContents.send("data-status:action", "conflicts"),
    },
    {
      label: "打开同步设置",
      click: () => mainWindow?.webContents.send("data-status:action", "settings"),
    },
  ];
  if (status.error) {
    template.push({
      label: "查看错误详情",
      click: () => void dialog.showMessageBox(mainWindow, {
        type: "error",
        title: "数据与同步状态",
        message: status.errorCode || "同步失败",
        detail: String(status.error).slice(0, 800),
      }),
    });
  }
  Menu.buildFromTemplate(template).popup({ window: mainWindow });
  return status;
}

function runGoogleSyncOperation(task) {
  const operation = googleSyncQueue.catch(() => undefined).then(task);
  googleSyncQueue = operation.catch(() => undefined);
  return operation;
}

async function backupStateBeforeGoogleRestore(state) {
  await atomicWriteJson(googleSyncBackupPath(), state);
}

async function signInGoogle() {
  return runGoogleSyncOperation(async () => {
    try {
      const service = getGoogleDriveSyncService();
      const before = await service.status();
      const serviceStatus = await service.signIn({
        expectedEmail: before.identity?.email || before.email || "",
        confirmAccountSwitch: async ({ expectedEmail, authorizedEmail }) => {
          const result = await dialog.showMessageBox(mainWindow, {
            type: "question",
            buttons: ["切换同步账号", "取消"],
            defaultId: 1,
            cancelId: 1,
            title: "确认 Google 同步账号",
            message: "当前授权账号与已登录账号不同，是否切换同步账号？",
            detail: `当前账号：${expectedEmail}\n授权账号：${authorizedEmail}`,
          });
          return result.response === 0;
        },
      });
      await service.healthCheck();
      const meta = await clearGoogleFailure({ conflict: null });
      getRecordSyncStore().setRuntimeState({ status: "idle" });
      scheduleIncrementalGoogleSync(1_500);
      return googleSyncUiStatus(serviceStatus, meta);
    } catch (error) {
      return rememberGoogleFailure(error);
    }
  });
}

async function importGoogleOAuthClient() {
  const selected = await dialog.showOpenDialog(mainWindow, {
    title: "选择 Google Desktop OAuth 客户端 JSON",
    buttonLabel: "安全导入",
    properties: ["openFile"],
    filters: [
      { name: "Google OAuth JSON", extensions: ["json"] },
    ],
  });
  if (selected.canceled || !selected.filePaths?.[0]) {
    return { ...(await googleSyncStatus()), cancelled: true };
  }

  return runGoogleSyncOperation(async () => {
    try {
      const sourcePath = selected.filePaths[0];
      const stats = await fsp.stat(sourcePath);
      if (!stats.isFile() || stats.size > 1024 * 1024) {
        throw Object.assign(new Error("OAuth 配置必须是小于 1 MB 的 JSON 文件"), {
          code: "GOOGLE_CONFIG_TOO_LARGE",
        });
      }
      let value;
      try {
        value = JSON.parse(await fsp.readFile(sourcePath, "utf8"));
      } catch (error) {
        throw Object.assign(new Error("所选 Google OAuth 配置不是有效 JSON"), {
          code: "GOOGLE_CONFIG_INVALID_JSON",
          cause: error,
        });
      }
      const serviceStatus = await getGoogleDriveSyncService().importClientConfig(value);
      const meta = await clearGoogleFailure({ conflict: null });
      getRecordSyncStore().setRuntimeState({ status: "notConfigured", accountId: null });
      return { ...googleSyncUiStatus(serviceStatus, meta), cancelled: false };
    } catch (error) {
      return { ...(await rememberGoogleFailure(error)), cancelled: false };
    }
  });
}

async function signOutGoogle() {
  return runGoogleSyncOperation(async () => {
    try {
      const serviceStatus = await getGoogleDriveSyncService().signOut();
      const meta = await clearGoogleFailure({ conflict: null });
      getRecordSyncStore().setRuntimeState({ status: "notConfigured", accountId: null });
      return googleSyncUiStatus(serviceStatus, meta);
    } catch (error) {
      return rememberGoogleFailure(error);
    }
  });
}

async function testGoogleDriveConnection() {
  return runGoogleSyncOperation(async () => {
    try {
      const service = getGoogleDriveSyncService();
      const health = await service.healthCheck({ writeTest: true });
      const meta = await clearGoogleFailure({ conflict: null });
      return { ...googleSyncUiStatus(await service.status(), meta), health };
    } catch (error) {
      return rememberGoogleFailure(error);
    }
  });
}

async function applyIncrementalSyncResult(result, options = {}) {
  if (!result?.state) return cachedState || getState();
  if (options.backup !== false && cachedState) {
    await backupStateBeforeGoogleRestore(cachedState);
  }
  const migration = migrateState(result.state, { defaultSites: DEFAULT_SITES });
  cachedState = migration.state;
  if (migration.changed) {
    getRecordSyncStore().commitState(cachedState, { emitOutbox: false });
  }
  await mirrorCompatibilityState(cachedState);
  await activateWorkspaceBrowserContext(cachedState.activeWorkspaceId);
  mainWindow?.webContents.send("state:changed", cachedState);
  return cachedState;
}

async function syncGoogleNow(options = {}) {
  return runGoogleSyncOperation(async () => {
    try {
      const service = getGoogleDriveSyncService();
      const currentStatus = await service.status();
      if (!currentStatus.signedIn) {
        throw Object.assign(new Error("请先连接 Google 账号"), {
          code: "GOOGLE_NOT_SIGNED_IN",
        });
      }
      if (currentStatus.drive?.status !== "ready") {
        throw Object.assign(new Error("需要重新授权 Drive 数据同步"), {
          code: currentStatus.drive?.lastErrorCode || "DRIVE_SCOPE_MISSING",
        });
      }
      await getState();
      const result = await getIncrementalSyncEngine().sync(service, {
        fullScan: options.fullScan === true,
      });
      const state = await applyIncrementalSyncResult(result);
      const now = new Date().toISOString();
      const runtime = getRecordSyncStore().runtimeSummary();
      const message = result.conflictCount
        ? `同步完成，发现 ${result.conflictCount} 条需要处理的记录冲突`
        : result.uploadedCount || result.appliedCount
          ? `增量同步完成：上传 ${result.uploadedCount} 条，应用 ${result.appliedCount} 条`
          : "本机与 Google Drive 数据已经一致";
      const meta = await clearGoogleFailure({
        lastSyncAt: now,
        lastDirection: result.uploadedCount && result.appliedCount
          ? "bidirectional"
          : result.uploadedCount ? "upload" : result.appliedCount ? "download" : "noop",
        lastMessage: message,
        lastSyncRevision: String(runtime.localRevision),
        localRevision: String(runtime.localRevision),
        remoteRevision: String(runtime.lastDownloadedRevision),
        conflict: result.conflictCount ? {
          detectedAt: now,
          count: result.conflictCount,
          message: "部分记录在不同设备被同时修改，需要逐条处理。",
        } : null,
      });
      return {
        ...googleSyncUiStatus(await service.status(), meta),
        state,
        syncResult: {
          action: options.automatic ? "background-sync" : "incremental-sync",
          direction: meta.lastDirection,
          reason: options.fullScan ? "manual-full-scan" : "changes-feed",
          message,
          uploadedCount: result.uploadedCount,
          appliedCount: result.appliedCount,
          conflictCount: result.conflictCount,
        },
      };
    } catch (error) {
      return rememberGoogleFailure(error);
    }
  });
}

async function restoreGoogleCloudData() {
  const result = await syncGoogleNow({ fullScan: true });
  if (result?.syncResult && !result.error) {
    const now = new Date().toISOString();
    const meta = await clearGoogleFailure({
      lastRestoreAt: now,
      lastMessage: "已扫描全部栖页增量记录并完成安全恢复",
    });
    return {
      ...result,
      ...googleSyncUiStatus(await getGoogleDriveSyncService().status(), meta),
      syncResult: {
        ...result.syncResult,
        action: "incremental-restore",
        reason: "manual-full-scan",
        message: "已扫描全部栖页增量记录并完成安全恢复",
      },
    };
  }
  return result;
}

async function resolveGoogleSyncConflict(strategy) {
  const requested = String(strategy || "details");
  const service = getGoogleDriveSyncService();
  const meta = await loadGoogleSyncMeta();
  const conflicts = getRecordSyncStore().listConflicts();
  if (["details", "cancel"].includes(requested)) {
    return {
      ...googleSyncUiStatus(await service.status(), meta),
      conflicts,
      diff: { records: conflicts },
    };
  }
  return {
    ...googleSyncUiStatus(await service.status(), meta),
    conflicts,
    errorCode: "RECORD_CONFLICT_REVIEW_REQUIRED",
    error: "增量同步不会用整库覆盖解决冲突，请在冲突中心逐条确认。",
  };
}

async function runAutomaticIncrementalSync() {
  if (isQuitting || !net.isOnline()) return;
  try {
    const status = await getGoogleDriveSyncService().status();
    if (!status.signedIn || status.drive?.status !== "ready") return;
    const result = await syncGoogleNow({ automatic: true });
    mainWindow?.webContents.send("data-status:updated", result);
  } catch (error) {
    console.warn("Background Google incremental sync skipped:", error?.message || error);
  }
}

function scheduleIncrementalGoogleSync(delayMs = 20_000) {
  if (isQuitting || !app.isReady()) return;
  if (incrementalSyncDebounceTimer) clearTimeout(incrementalSyncDebounceTimer);
  incrementalSyncDebounceTimer = setTimeout(() => {
    incrementalSyncDebounceTimer = undefined;
    void runAutomaticIncrementalSync();
  }, Math.max(1_000, Number(delayMs) || 20_000));
  incrementalSyncDebounceTimer.unref?.();
}

function startIncrementalGoogleSyncSchedule() {
  if (incrementalSyncTimer) return;
  scheduleIncrementalGoogleSync(12_000);
  incrementalSyncTimer = setInterval(() => {
    void runAutomaticIncrementalSync();
  }, 4 * 60 * 1000);
  incrementalSyncTimer.unref?.();
  powerMonitor.on("resume", () => scheduleIncrementalGoogleSync(3_000));
}

function bookmarkId(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 20);
}

function chromeUserDataPath() {
  const localAppData = process.env.LOCALAPPDATA;
  return localAppData
    ? path.join(localAppData, "Google", "Chrome", "User Data")
    : "";
}

async function readChromeProfileNames(userDataPath) {
  try {
    const localState = JSON.parse(
      await fsp.readFile(path.join(userDataPath, "Local State"), "utf8"),
    );
    return localState?.profile?.info_cache || {};
  } catch {
    return {};
  }
}

function collectBookmarkUrls(node, output) {
  if (!node || typeof node !== "object") return;
  if (typeof node.url === "string" && isSafeWebUrl(node.url)) {
    output.add(normalizeUrl(node.url));
    return;
  }
  if (!Array.isArray(node.children)) return;
  for (const child of node.children) collectBookmarkUrls(child, output);
}

async function readChromeBookmarkStores(root, profileId) {
  const stores = [];
  for (const store of CHROME_BOOKMARK_STORES) {
    const filePath = path.join(root, profileId, store.fileName);
    try {
      const parsed = JSON.parse(await fsp.readFile(filePath, "utf8"));
      if (!parsed?.roots || typeof parsed.roots !== "object") continue;
      stores.push({ ...store, parsed });
    } catch {
      // A Chrome profile may use only one of the local/account bookmark stores.
    }
  }
  return stores;
}

async function listChromeProfiles() {
  const root = chromeUserDataPath();
  if (!root || !fs.existsSync(root)) return [];
  const [entries, names] = await Promise.all([
    fsp.readdir(root, { withFileTypes: true }),
    readChromeProfileNames(root),
  ]);
  const profiles = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (entry.name !== "Default" && !/^Profile \d+$/.test(entry.name)) continue;
    const stores = await readChromeBookmarkStores(root, entry.name);
    const hasEncryptedAccountStore = fs.existsSync(
      path.join(root, entry.name, "EncryptedAccountBookmarks"),
    );
    if (!stores.length && !hasEncryptedAccountStore) continue;
    const allUrls = new Set();
    const counts = {};
    for (const store of stores) {
      const storeUrls = new Set();
      for (const node of Object.values(store.parsed.roots || {})) {
        collectBookmarkUrls(node, storeUrls);
        collectBookmarkUrls(node, allUrls);
      }
      counts[store.key] = storeUrls.size;
    }
    profiles.push({
      id: entry.name,
      name: names[entry.name]?.name || (entry.name === "Default" ? "默认配置" : entry.name),
      bookmarkCount: allUrls.size,
      localBookmarkCount: counts.local || 0,
      accountBookmarkCount: counts.account || 0,
      sources: stores.map((store) => store.key),
      encryptedOnly:
        hasEncryptedAccountStore && !(counts.account || 0) && !allUrls.size,
    });
  }
  return profiles.sort((a, b) => a.id.localeCompare(b.id, "zh-CN"));
}

function chromeTimeToIso(value) {
  const micros = Number(value);
  if (!Number.isFinite(micros) || micros <= 0) return null;
  const unixMilliseconds = micros / 1000 - 11644473600000;
  const date = new Date(unixMilliseconds);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function flattenChromeBookmarks(node, folders, output, profileName) {
  if (!node || typeof node !== "object") return;
  if (typeof node.url === "string" && isSafeWebUrl(node.url)) {
    const normalized = normalizeUrl(node.url);
    output.push({
      id: bookmarkId(normalized),
      name: String(node.name || new URL(normalized).hostname),
      url: normalized,
      folder: folders.filter(Boolean).join(" / ") || "未分类",
      addedAt: chromeTimeToIso(node.date_added),
      sourceProfile: profileName,
    });
    return;
  }
  if (!Array.isArray(node.children)) return;
  const nextFolders = node.name ? [...folders, String(node.name)] : folders;
  for (const child of node.children) {
    flattenChromeBookmarks(child, nextFolders, output, profileName);
  }
}

async function importChromeBookmarks(profileId) {
  const profiles = await listChromeProfiles();
  const profile = profiles.find((item) => item.id === profileId);
  if (!profile) throw new Error("找不到这个 Chrome 配置，可能已被移动或删除");
  if (!profile.bookmarkCount) {
    throw new Error("这个 Chrome 配置当前没有可导入的本机或 Google 账号书签");
  }
  const stores = await readChromeBookmarkStores(chromeUserDataPath(), profile.id);
  const rootLabels = {
    bookmark_bar: "书签栏",
    other: "其他书签",
    synced: "移动设备书签",
  };
  const importedByUrl = new Map();
  for (const store of stores) {
    const storeItems = [];
    for (const [rootName, rootNode] of Object.entries(store.parsed.roots || {})) {
      flattenChromeBookmarks(
        rootNode,
        [store.label, rootLabels[rootName] || rootNode?.name || "Chrome"],
        storeItems,
        profile.name,
      );
    }
    for (const item of storeItems) importedByUrl.set(item.url, item);
  }
  const imported = Array.from(importedByUrl.values());
  const state = await getState();
  const merged = new Map(state.bookmarks.map((item) => [item.url, item]));
  let added = 0;
  for (const item of imported) {
    if (!merged.has(item.url)) added += 1;
    merged.set(item.url, { ...merged.get(item.url), ...item });
  }
  state.bookmarks = Array.from(merged.values()).sort((a, b) => {
    const folderOrder = a.folder.localeCompare(b.folder, "zh-CN");
    return folderOrder || a.name.localeCompare(b.name, "zh-CN");
  });
  state.importMeta = {
    profileId: profile.id,
    profileName: profile.name,
    scanned: imported.length,
    added,
    total: state.bookmarks.length,
    localScanned: profile.localBookmarkCount,
    accountScanned: profile.accountBookmarkCount,
    importedAt: new Date().toISOString(),
  };
  await persistState();
  return { state, stats: state.importMeta };
}

async function clearImportedChromeBookmarks() {
  const state = await getState();
  state.bookmarks = [];
  state.importMeta = null;
  await persistState();
  return { state };
}

function compactBrowserState(patch = {}, context = activeBrowserContext()) {
  if (!context) {
    browserState = emptyBrowserState(activeBrowserWorkspaceId);
    mainWindow?.webContents.send("browser:state", browserState);
    return browserState;
  }
  const view = context.view;
  const navigation = view?.webContents.navigationHistory;
  const currentURL = isSafeWebUrl(patch.url)
    ? patch.url
    : isSafeWebUrl(view?.webContents.getURL())
      ? view.webContents.getURL()
      : context.browserState.currentURL;
  const activeSiteId = context.currentSiteId || null;
  context.browserState = {
    ...context.browserState,
    ...patch,
    tabId: context.tabId,
    workspaceId: context.workspaceId,
    siteId: activeSiteId,
    activeSiteId,
    hasOpenPage: Boolean(currentURL),
    url: currentURL || "",
    currentURL: currentURL || null,
    homeURL: context.currentHomeUrl || currentURL || null,
    canGoBack: Boolean(navigation?.canGoBack()),
    canGoForward: Boolean(navigation?.canGoForward()),
    zoomFactor:
      view?.webContents.getZoomFactor() || context.browserState.zoomFactor || 1,
    securityState: securityStateForUrl(currentURL),
  };
  const workspace = workspaceBrowserContexts.get(context.workspaceId);
  if (workspace) workspace.browserState = browserStateForWorkspace(workspace);
  if (context.workspaceId === activeBrowserWorkspaceId) {
    syncActiveBrowserAliases(activeBrowserContext(workspace));
    mainWindow?.webContents.send("browser:state", workspace.browserState);
  }
  sendDetachedTabState(context);
  return context.browserState;
}

function runtimeTabURL(tab) {
  const liveURL =
    tab.view && !tab.view.webContents.isDestroyed()
      ? tab.view.webContents.getURL()
      : "";
  return (isSafeWebUrl(liveURL) && liveURL) || tab.browserState.currentURL || "";
}

function reconcileRuntimeDuplicateTabs(workspace) {
  if (!workspace || workspace.tabs.size < 2) return [];
  const activeTab = activeBrowserContext(workspace);
  const ordered = [
    ...(activeTab ? [activeTab] : []),
    ...Array.from(workspace.tabs.values()).filter((tab) => tab !== activeTab),
  ];
  const seen = new Set();
  const marked = [];
  for (const tab of ordered) {
    if (tab.allowDuplicate) continue;
    const url = runtimeTabURL(tab);
    if (!isSafeWebUrl(url)) continue;
    const key = tab.currentSiteId ? `site:${tab.currentSiteId}` : `url:${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    tab.allowDuplicate = true;
    marked.push(tab.tabId);
  }
  return marked;
}

function persistWorkspaceBrowserContext(context, patch = {}) {
  if (!context || !cachedState) return;
  const observedURL = isSafeWebUrl(patch.currentURL)
    ? patch.currentURL
    : isSafeWebUrl(context.view?.webContents.getURL())
      ? context.view.webContents.getURL()
      : context.browserState.currentURL;
  if (observedURL) {
    context.browserState.currentURL = observedURL;
    context.browserState.url = observedURL;
  }
  const workspace = workspaceBrowserContexts.get(context.workspaceId);
  if (!workspace) return;
  const markedDuplicateTabs = reconcileRuntimeDuplicateTabs(workspace);
  const now = new Date().toISOString();
  const tabs = Array.from(workspace.tabs.values())
    .map((tab) => {
      const liveURL =
        tab.view && !tab.view.webContents.isDestroyed()
          ? tab.view.webContents.getURL()
          : "";
      const observedTabUrl =
        (isSafeWebUrl(liveURL) && liveURL) || tab.browserState.currentURL;
      const url = durableBrowserUrl(observedTabUrl);
      if (!isSafeWebUrl(url)) return null;
      const storedSite = cachedState.sites.find(
        (site) =>
          site.id === tab.currentSiteId && site.workspaceId === tab.workspaceId,
      );
      return {
        tabId: tab.tabId,
        siteId: storedSite?.id || null,
        browserProfileId: tab.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
        title:
          (tab.view && !tab.view.webContents.isDestroyed()
            ? tab.view.webContents.getTitle()
            : "") || tab.browserState.title || storedSite?.name || "",
        url,
        normalizedUrl: normalizeUrl(url),
        homeURL:
          (isSafeWebUrl(tab.currentHomeUrl) && tab.currentHomeUrl) ||
          storedSite?.url ||
          url,
        favicon: tab.favicon || null,
        createdAt: tab.createdAt || now,
        lastActiveAt: tab.lastActiveAt || now,
        loadingState: tab.browserState.loading ? "loading" : "idle",
        errorState: tab.browserState.error || null,
        reliableContext: tab.reliableContext || null,
        keepRunning: tab.keepRunning === true,
        tabGroupId: tab.tabGroupId || null,
        groupSortOrder: Number(tab.groupSortOrder) || 0,
        ...(tab.allowDuplicate ? { allowDuplicate: true } : {}),
        updatedAt: now,
      };
    })
    .filter(Boolean);
  let result;
  try {
    result = setWorkspaceBrowserTabsInState(
      cachedState,
      context.workspaceId,
      {
        activeTabId: workspace.activeTabId,
        tabs,
      },
      { defaultSites: DEFAULT_SITES },
    );
  } catch (error) {
    console.error("Unable to normalize workspace tabs:", error?.message || error);
    return;
  }
  cachedState = result.state;
  if (markedDuplicateTabs.length) emitWorkspaceBrowserState(workspace);
  void persistState().catch((error) => {
    console.error("Unable to persist workspace browser state:", error?.message || error);
  });
}

function sanitizeBounds(value) {
  const contentBounds = mainWindow?.getContentBounds() || {
    width: 1200,
    height: 800,
  };
  const x = Math.max(0, Math.round(Number(value?.x) || 0));
  const y = Math.max(0, Math.round(Number(value?.y) || 0));
  const width = Math.max(
    120,
    Math.min(Math.round(Number(value?.width) || 120), contentBounds.width - x),
  );
  const height = Math.max(
    120,
    Math.min(Math.round(Number(value?.height) || 120), contentBounds.height - y),
  );
  return { x, y, width, height };
}

function applySiteViewBounds(value, context = activeBrowserContext()) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  siteViewBounds = sanitizeBounds(value || siteViewBounds);
  if (
    !context?.view ||
    context.detached ||
    context.viewOwner === "detached"
  ) return;
  if (context.htmlFullscreenActive) {
    const ownerBounds = mainWindow.getContentBounds();
    context.view.setBounds({
      x: 0,
      y: 0,
      width: Math.max(120, ownerBounds.width),
      height: Math.max(120, ownerBounds.height),
    });
    return;
  }
  context.view.setBounds(siteViewBounds);
}

function enterHtmlFullscreen(context) {
  if (!context?.view || context.view.webContents.isDestroyed()) return;
  const owner = browserOwnerWindow(context);
  if (!owner || owner.isDestroyed()) return;
  context.htmlFullscreenActive = true;
  context.htmlFullscreenOwner = owner;
  context.htmlFullscreenForcedOwner = !owner.isFullScreen();
  companionRuntimeService?.tick();
  if (context.htmlFullscreenForcedOwner) owner.setFullScreen(true);
  if (context.viewOwner === "detached") applyDetachedViewBounds(context);
  else applySiteViewBounds(siteViewBounds, context);
  const timer = setTimeout(() => {
    if (!context.htmlFullscreenActive || context.htmlFullscreenOwner !== owner) return;
    if (context.viewOwner === "detached") applyDetachedViewBounds(context);
    else applySiteViewBounds(siteViewBounds, context);
  }, 80);
  timer.unref?.();
}

function leaveHtmlFullscreen(context) {
  if (!context?.htmlFullscreenActive && !context?.htmlFullscreenOwner) return;
  const owner = context.htmlFullscreenOwner;
  const forcedOwner = context.htmlFullscreenForcedOwner === true;
  context.htmlFullscreenActive = false;
  context.htmlFullscreenForcedOwner = false;
  context.htmlFullscreenOwner = null;
  companionRuntimeService?.tick();
  if (forcedOwner && owner && !owner.isDestroyed() && owner.isFullScreen()) {
    owner.setFullScreen(false);
  }
  if (!context.view || context.view.webContents.isDestroyed()) return;
  if (context.viewOwner === "detached") applyDetachedViewBounds(context);
  else if (context.viewOwner === "main") applySiteViewBounds(siteViewBounds, context);
}

function attachSiteView(context = activeBrowserContext()) {
  if (context) context.attachRequested = true;
  if (
    !context?.view ||
    context.detached ||
    !mainWindow ||
    mainWindow.isDestroyed() ||
    context.viewOwner === "main"
  ) return;
  if (context.viewOwner !== "none") detachSiteViewFromOwner(context);
  for (const workspace of workspaceBrowserContexts.values()) {
    for (const other of workspace.tabs.values()) {
      if (other !== context && other.viewOwner === "main") detachSiteView(other);
    }
  }
  mainWindow.contentView.addChildView(context.view);
  context.attached = true;
  context.viewOwner = "main";
  context.runtimeState?.transition("active", "selected");
  if (context.navigationTraceId) {
    navigationPerformanceTracer.update(context.navigationTraceId, {
      workspaceId: context.workspaceId,
      tabId: context.tabId,
      webContentsId: context.view.webContents.id,
      partition: browserPartitionForProfile(context.browserProfileId),
      activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
    });
    navigationPerformanceTracer.mark(context.navigationTraceId, "viewAttachedAt");
    navigationPerformanceTracer.mark(context.navigationTraceId, "overlayHiddenAt");
    if (context.navigationDidStopTraceId === context.navigationTraceId) {
      completeNavigationPerformanceTrace(context);
    }
  }
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
  applySiteViewBounds(siteViewBounds, context);
  void installCompanionPageWidget(context);
}

function completeNavigationPerformanceTrace(context) {
  const traceId = context?.navigationTraceId;
  if (!traceId) return null;
  const result = navigationPerformanceTracer.finish(traceId, null);
  context.lastNavigationTrace = result;
  context.navigationTraceId = null;
  context.navigationDidStopTraceId = null;
  return result;
}

function detachSiteView(context = activeBrowserContext()) {
  if (!context) return;
  context.attachRequested = false;
  if (!context.view || context.viewOwner !== "main") return;
  leaveHtmlFullscreen(context);
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.contentView.removeChildView(context.view);
  }
  context.attached = false;
  context.viewOwner = "none";
  if (context.view && !context.detached) context.runtimeState?.transition("warm", "background");
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
}

function detachSiteViewFromOwner(context) {
  if (!context?.view || context.viewOwner === "none") return;
  leaveHtmlFullscreen(context);
  if (
    context.viewOwner === "main" &&
    mainWindow &&
    !mainWindow.isDestroyed()
  ) {
    mainWindow.contentView.removeChildView(context.view);
  } else if (
    context.viewOwner === "detached" &&
    context.detachedWindow &&
    !context.detachedWindow.isDestroyed()
  ) {
    context.detachedWindow.contentView.removeChildView(context.view);
  }
  context.attached = false;
  context.viewOwner = "none";
}

function destroySiteView(context = activeBrowserContext(), options = {}) {
  if (!context?.view) return;
  const contents = context.view.webContents;
  userScriptEngine?.cleanup(contents);
  if (pageTranslationController) pageTranslationController.clear(context);
  if (selectionActionService) selectionActionService.clear(contents);
  pageResourceService?.clear(contents);
  if (options.preserveAttachRequested !== true) context.attachRequested = false;
  detachSiteViewFromOwner(context);
  context.view = null;
  if (!contents.isDestroyed()) contents.close();
  context.runtimeState?.transition(options.runtimeState || "suspended", options.reason || "web-contents-destroyed");
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
}

function allRuntimeTabs() {
  return Array.from(workspaceBrowserContexts.values()).flatMap((workspace) => Array.from(workspace.tabs.values()));
}

function visibleRuntimeTabIds() {
  const ids = new Set();
  const active = activeBrowserContext();
  if (active?.viewOwner === "main") ids.add(active.tabId);
  for (const tab of allRuntimeTabs()) if (tab.detached) ids.add(tab.tabId);
  return ids;
}

async function runtimeTabProtection(tab) {
  if (!tab?.view || tab.view.webContents.isDestroyed()) return { protected: false };
  const contents = tab.view.webContents;
  if (tab.keepRunning) return { protected: true, reason: "用户标记保持运行" };
  if (tab.detached || tab.viewOwner === "detached") return { protected: true, reason: "独立窗口正在显示" };
  if (contents.isLoading()) return { protected: true, reason: "页面正在加载" };
  if (isAuthenticationUrl(contents.getURL())) return { protected: true, reason: "登录流程正在进行" };
  if (contents.isCurrentlyAudible?.()) return { protected: true, reason: "页面正在播放媒体" };
  if (downloadManager?.hasActiveDownload(contents.id)) return { protected: true, reason: "页面正在下载" };
  try {
    const activity = await contents.executeJavaScript(`(() => {
      // Chromium exposes BeforeUnloadEvent but does not allow page code to
      // construct it. A cancelable Event still exercises both onbeforeunload
      // and addEventListener handlers without navigating the page.
      const beforeUnloadEvent = new Event('beforeunload', { cancelable: true });
      const initialReturnValue = beforeUnloadEvent.returnValue;
      const dispatched = window.dispatchEvent(beforeUnloadEvent);
      return {
        hasSelectedUpload: Array.from(document.querySelectorAll('input[type="file"]')).some((input) => input.files?.length),
        hasBeforeUnload: typeof window.onbeforeunload === 'function' || !dispatched || beforeUnloadEvent.defaultPrevented || beforeUnloadEvent.returnValue !== initialReturnValue,
        hasZohoDraft: /(^|\\.)desk\\.zoho|(^|\\.)desk\\.zohocloud/i.test(location.hostname) &&
          Array.from(document.querySelectorAll('textarea, [contenteditable="true"]')).some((field) => {
            const value = 'value' in field ? field.value : field.textContent;
            return field.offsetParent !== null && String(value || '').trim().length > 0;
          })
      };
    })()`, true);
    if (activity?.hasSelectedUpload) return { protected: true, reason: "页面存在待上传文件" };
    if (activity?.hasBeforeUnload) return { protected: true, reason: "页面注册了离开确认" };
    if (activity?.hasZohoDraft) return { protected: true, reason: "Zoho 回复草稿尚未发送" };
  } catch {
    return { protected: true, reason: "无法可靠确认页面可休眠" };
  }
  return { protected: false };
}

async function suspendRuntimeTab(tab, reason = "pool-limit") {
  if (!tab?.view || tab.view.webContents.isDestroyed()) return false;
  const url = tab.view.webContents.getURL();
  if (isSafeWebUrl(url)) compactBrowserState({ url, loading: false }, tab);
  persistWorkspaceBrowserContext(tab, { currentURL: url });
  tab.suspensionReason = reason;
  tab.lastSuspendedAt = new Date().toISOString();
  destroySiteView(tab, { runtimeState: "suspended", reason });
  const workspace = workspaceBrowserContexts.get(tab.workspaceId);
  if (workspace) emitWorkspaceBrowserState(workspace);
  return true;
}

function lifecycleSnapshot() {
  return getWebViewLifecycleManager().snapshot();
}

function getWebViewLifecycleManager() {
  if (webViewLifecycleManager) return webViewLifecycleManager;
  webViewLifecycleManager = new WebViewLifecycleManager({
    getTabs: allRuntimeTabs,
    getActiveTabIds: () => Array.from(visibleRuntimeTabIds()),
    isProtected: runtimeTabProtection,
    suspend: suspendRuntimeTab,
    settings: normalizeBrowserMemorySettings(cachedState?.uiSettings?.browserMemory),
    onState: (snapshot) => mainWindow?.webContents.send("browser:lifecycle", snapshot),
  });
  webViewLifecycleManager.start();
  return webViewLifecycleManager;
}

function scheduleLifecycleEnforcement(reason = "pool-limit") {
  const timer = setTimeout(() => void getWebViewLifecycleManager().enforce(reason), 50);
  timer.unref?.();
}

function safeMediaPermissionUrl(...values) {
  return values.find((value) => isSafeWebUrl(value)) || "";
}

function getBrowserSession(profileId = DEFAULT_BROWSER_PROFILE_ID) {
  if (browserSessions.has(profileId)) return browserSessions.get(profileId);
  const targetSession = session.fromPartition(
    browserPartitionForProfile(profileId),
    { cache: true },
  );
  targetSession.setPermissionRequestHandler(
    (contents, permission, callback, details = {}) => callback(
      isSafeEmbeddedMediaPermission(
        permission,
        safeMediaPermissionUrl(
          details.requestingUrl,
          details.embeddingOrigin,
          contents?.getURL?.(),
        ),
      ),
    ),
  );
  targetSession.setPermissionCheckHandler((contents, permission, requestingOrigin, details = {}) =>
    isSafeEmbeddedMediaPermission(
      permission,
      safeMediaPermissionUrl(
        requestingOrigin,
        details.requestingUrl,
        details.embeddingOrigin,
        contents?.getURL?.(),
      ),
    ));
  targetSession.setUserAgent(standardChromiumUserAgent(targetSession.getUserAgent()));
  getBrowserServices().downloads.attach(targetSession);
  targetSession.readyPromise = targetSession
    .setProxy({ mode: "system" })
    .catch((error) => console.warn("Unable to apply system proxy:", error.message));
  browserSessions.set(profileId, targetSession);
  if (profileId === DEFAULT_BROWSER_PROFILE_ID) persistentSiteSession = targetSession;
  return targetSession;
}

function getPersistentSiteSession() {
  return getBrowserSession(DEFAULT_BROWSER_PROFILE_ID);
}

async function waitForBrowserSession(profileId = DEFAULT_BROWSER_PROFILE_ID) {
  const siteSession = getBrowserSession(profileId);
  await siteSession.readyPromise;
  return siteSession;
}

async function waitForPersistentSiteSession() {
  return waitForBrowserSession(DEFAULT_BROWSER_PROFILE_ID);
}

async function inspectKnownSiteIssue(context = activeBrowserContext()) {
  if (!context?.view || context.view.webContents.isDestroyed()) return;
  const contents = context.view.webContents;
  const currentUrl = contents.getURL();
  const isNodeSeek = hasExpectedHost(currentUrl, "nodeseek.com");
  const isSapSession = isSapSessionUrl(currentUrl);
  if (!isNodeSeek && !isSapSession) {
    compactBrowserState({ siteIssue: "" }, context);
    return;
  }
  const title = contents.getTitle();
  const body = await contents
    .executeJavaScript("document.body?.innerText?.slice(0, 1400) || ''")
    .catch(() => "");
  if (isSapSession) {
    const hasRejectedAuthState = hasSapLoginRejection(title, body);
    compactBrowserState({
      siteIssue: hasRejectedAuthState ? "sap-auth-state" : "",
      error: hasRejectedAuthState
        ? "SAP 登录会话状态异常；请点击“修复 SAP 登录”后重新进入原搜索结果"
        : "",
    }, context);
    return;
  }
  const hasNetworkPage =
    /Network Error/i.test(title) || /Oops!\s*Network Error/i.test(body);
  if (!hasNetworkPage) {
    context.nodeSeekAutoRetryUsed = false;
    compactBrowserState({ siteIssue: "" }, context);
    return;
  }
  compactBrowserState({
    siteIssue: "nodeseek-network",
    error: "NodeSeek 返回 Network Error；可能与站点防护状态或代理出口有关",
  }, context);
  if (!context.nodeSeekAutoRetryUsed) {
    context.nodeSeekAutoRetryUsed = true;
    setTimeout(() => {
      if (context.view && !context.view.webContents.isDestroyed()) {
        context.view.webContents.reloadIgnoringCache();
      }
    }, 900);
  }
}

async function repairCurrentSiteNetwork(context = activeBrowserContext()) {
  if (!context?.view || context.view.webContents.isDestroyed()) {
    return context?.browserState || null;
  }
  const contents = context.view.webContents;
  const currentUrl = contents.getURL();
  if (!hasExpectedHost(currentUrl, "nodeseek.com")) {
    throw new Error("当前页面不是 NodeSeek，未执行网络修复");
  }
  const siteSession = await waitForBrowserSession(context.browserProfileId);
  let origin;
  try {
    origin = new URL(currentUrl).origin;
  } catch {
    origin = undefined;
  }
  compactBrowserState({
    loading: true,
    error: "",
    siteIssue: "",
  }, context);
  context.nodeSeekAutoRetryUsed = false;
  await siteSession.setProxy({ mode: "system" });
  await siteSession.closeAllConnections();
  await Promise.all([
    siteSession.clearHostResolverCache(),
    origin
      ? siteSession.clearStorageData({
          origin,
          storages: ["serviceworkers", "cachestorage"],
        })
      : Promise.resolve(),
  ]);
  contents.reloadIgnoringCache();
  return context.browserState;
}

async function loadUrlAllowingRedirectAbort(contents, url) {
  try {
    await contents.loadURL(url);
  } catch (error) {
    const aborted =
      error?.code === "ERR_ABORTED" ||
      error?.errno === -3 ||
      /\(-3\)\s+loading/.test(String(error?.message || ""));
    if (!aborted) throw error;
  }
}

async function resetNodeSeekSession(context = activeBrowserContext()) {
  if (!context?.view || context.view.webContents.isDestroyed()) {
    return context?.browserState || null;
  }
  const contents = context.view.webContents;
  const currentUrl = contents.getURL();
  if (!hasExpectedHost(currentUrl, "nodeseek.com")) {
    throw new Error("当前页面不是 NodeSeek，未重置登录环境");
  }
  const siteSession = await waitForBrowserSession(context.browserProfileId);
  const origin = new URL(currentUrl).origin;
  compactBrowserState({ loading: true, error: "", siteIssue: "" }, context);
  context.nodeSeekAutoRetryUsed = false;
  const cookies = await siteSession.cookies.get({ url: `${origin}/` });
  const cloudflareCookies = cookies.filter((cookie) =>
    /^(?:cf_clearance|__cf_bm|cf_|__cf)/i.test(cookie.name),
  );
  await Promise.all(
    cloudflareCookies.map((cookie) => {
      const cookieHost = String(cookie.domain || new URL(origin).hostname).replace(/^\./, "");
      const cookiePath = cookie.path || "/";
      const protocol = cookie.secure ? "https" : "http";
      return siteSession.cookies.remove(
        `${protocol}://${cookieHost}${cookiePath}`,
        cookie.name,
      );
    }),
  );
  await siteSession.setProxy({ mode: "system" });
  await siteSession.closeAllConnections();
  await Promise.all([
    siteSession.clearHostResolverCache(),
    siteSession.clearStorageData({
      origin,
      storages: [
        "serviceworkers",
        "cachestorage",
      ],
    }),
  ]);
  context.currentHomeUrl = "https://www.nodeseek.com/signIn.html";
  syncActiveBrowserAliases(context);
  persistWorkspaceBrowserContext(context, {
    currentURL: context.currentHomeUrl,
  });
  await loadUrlAllowingRedirectAbort(contents, context.currentHomeUrl);
  return context.browserState;
}

async function repairSapSession(context = activeBrowserContext()) {
  if (!context?.view || context.view.webContents.isDestroyed()) {
    return context?.browserState || null;
  }
  const currentUrl = context.view.webContents.getURL();
  if (
    !isSapSessionUrl(currentUrl) &&
    !isSapSessionUrl(context.lastSapNavigationUrl)
  ) {
    throw new Error("当前页面不是 SAP，未清理会话");
  }
  context.browserProfileId = SAP_BROWSER_PROFILE_ID;
  const siteSession = await waitForBrowserSession(context.browserProfileId);
  const retryUrl = sapRetryUrl(
    context.lastSapNavigationUrl,
    context.currentHomeUrl,
  );
  const sapTabs = allRuntimeTabs().filter(
    (tab) => tab.browserProfileId === SAP_BROWSER_PROFILE_ID,
  );
  const visitedOrigins = new Set();
  for (const tab of sapTabs) {
    for (const candidate of [
      tab.currentHomeUrl,
      tab.browserState?.currentURL,
      tab.browserState?.homeURL,
      tab.view && !tab.view.webContents.isDestroyed()
        ? tab.view.webContents.getURL()
        : "",
      ...Array.from(tab.sapSessionOrigins || []),
    ]) {
      try {
        const parsed = new URL(String(candidate || ""));
        if (parsed.protocol === "https:" && isSapSessionUrl(parsed.toString())) {
          visitedOrigins.add(parsed.origin);
        }
      } catch {
        // Invalid and non-SAP URLs are intentionally excluded from this reset.
      }
    }
  }

  compactBrowserState({ loading: true, error: "", siteIssue: "" }, context);
  managedPopupService?.closeForBrowserProfile(SAP_BROWSER_PROFILE_ID);
  for (const tab of sapTabs) {
    if (tab.detachedWindow) closeDetachedWindow(tab, "sap-session-reset");
    destroySiteView(tab, {
      runtimeState: "suspended",
      reason: "sap-session-reset",
    });
    tab.sapSessionOrigins?.clear();
    tab.browserState.loading = false;
    tab.browserState.error = "";
    tab.browserState.siteIssue = "";
  }
  const cleared = await clearSapAuthenticationState(siteSession, {
    currentUrl,
    visitedOrigins: Array.from(visitedOrigins),
    clearEntirePartition: true,
  });
  if (cleared.remainingCookieCount !== 0) {
    throw new Error("SAP 专用登录身份未能完全清理，请关闭 SAP 页面后重试");
  }
  ensureSiteView(context);
  if (context.detached && context.detachedWindow) {
    attachSiteViewToDetached(context);
  } else {
    attachSiteView(context);
    applySiteViewBounds(siteViewBounds, context);
  }
  context.currentHomeUrl = retryUrl;
  syncActiveBrowserAliases(context);
  persistWorkspaceBrowserContext(context, { currentURL: retryUrl });
  await loadUrlAllowingRedirectAbort(context.view.webContents, retryUrl);
  return context.browserState;
}

function ensureSiteView(context = activeBrowserContext()) {
  if (!context) throw new Error("当前空间尚未初始化浏览现场");
  if (context.view) return context.view;
  getBrowserSession(context.browserProfileId);
  context.runtimeState ||= new SessionRuntimeState("suspended");
  context.runtimeState.transition("restoring", "create-web-contents");

  const view = new WebContentsView({
    webPreferences: {
      preload: path.join(__dirname, "user-script-preload.cjs"),
      partition: browserPartitionForProfile(context.browserProfileId),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      spellcheck: false,
      safeDialogs: true,
    },
  });
  context.view = view;
  view.setBackgroundColor("#ffffff");
  if (context.navigationTraceId) {
    navigationPerformanceTracer.update(context.navigationTraceId, {
      workspaceId: context.workspaceId,
      tabId: context.tabId,
      webContentsId: view.webContents.id,
      partition: browserPartitionForProfile(context.browserProfileId),
      activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
    });
    navigationPerformanceTracer.mark(context.navigationTraceId, "viewCreatedAt");
  }
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);

  const browserServices = getBrowserServices();
  browserServices.managedPopups.attachToWebContents(
    view.webContents,
    context,
    browserOwnerWindow(context),
  );
  view.webContents.on("context-menu", (_event, params) => {
    browserServices.contextMenus.popup(
      view.webContents,
      params,
      {
        workspaceId: context.workspaceId,
        tabId: context.tabId,
        url: view.webContents.getURL(),
      },
      browserOwnerWindow(context),
    );
  });
  view.webContents.on("before-input-event", (event, input) => {
    const accelerator = electronInputAccelerator(input, process.platform);
    if (!accelerator) return;
    const binding = shortcutRegistry.bindings(cachedState || {}, process.platform)
      .find((item) => item.enabled && item.accelerator === accelerator && item.scope !== "modal");
    if (!binding) return;
    event.preventDefault();
    if (input.isAutoRepeat || !mainWindow || mainWindow.isDestroyed()) return;
    mainWindow.webContents.send("shortcuts:trigger", {
      actionId: binding.actionId,
      accelerator,
      tabId: context.tabId,
      workspaceId: context.workspaceId,
    });
  });
  view.webContents.on("will-navigate", (event, url) => {
    rememberSapNavigation(context, url);
    if (isSafeWebUrl(url)) {
      void maybeOfferUserScriptInstall(context, url);
      return;
    }
    event.preventDefault();
    void browserServices.externalProtocol.open(url, browserOwnerWindow(context));
  });
  view.webContents.on("did-start-loading", () => {
    pageCapabilityOrchestrator.cancel(context.tabId);
    userScriptEngine?.cleanup(view.webContents);
    pageResourceService?.clear(view.webContents);
    if (pageTranslationController) pageTranslationController.clear(context);
    if (selectionActionService) selectionActionService.clear(view.webContents);
    compactBrowserState(
      { loading: true, error: "", siteIssue: "" },
      context,
    );
  });
  const contents = view.webContents;
  const emitAudioState = () => compactBrowserState(
    readWebContentsAudioState(contents),
    context,
  );
  contents.on("media-started-playing", emitAudioState);
  contents.on("media-paused", emitAudioState);
  contents.on("audio-state-changed", emitAudioState);
  contents.on("enter-html-full-screen", () => enterHtmlFullscreen(context));
  contents.on("leave-html-full-screen", () => leaveHtmlFullscreen(context));
  contents.on("dom-ready", () => {
    try {
      const hostname = new URL(contents.getURL()).hostname;
      if (isOfficialBilibiliHost(hostname)) {
        void contents.executeJavaScript(bilibiliMediaBridgeScript()).catch(() => undefined);
      }
    } catch {
      // A navigation may be replaced while dom-ready is being delivered.
    }
    void installCompanionPageWidget(context);
    if (context.navigationTraceId) {
      navigationPerformanceTracer.mark(context.navigationTraceId, "domReadyAt");
      navigationPerformanceTracer.update(context.navigationTraceId, {
        activeCapabilityIds: [
          ...IMMEDIATE_CAPABILITY_IDS,
          "site-identification",
          "selection-translation-trigger",
          "document-start-userscripts",
        ],
      });
    }
    pageCapabilityOrchestrator.run(context.tabId, "dom-ready", [
      {
        id: "selection-translation-trigger",
        run: async () => {
          const settings = await currentTranslationSettings();
          return getTranslationServices().selection.installTrigger(
            view.webContents,
            settings.selectionButtonEnabled !== false,
          );
        },
      },
      {
        id: "document-start-userscripts",
        run: () => runUserScriptsForContext(context, "document-start"),
      },
    ]);
  });
  view.webContents.on("did-stop-loading", () => {
    if (context.navigationTraceId) {
      navigationPerformanceTracer.mark(context.navigationTraceId, "didStopLoadingAt");
      context.navigationDidStopTraceId = context.navigationTraceId;
      if (context.viewOwner !== "none") completeNavigationPerformanceTrace(context);
    }
    compactBrowserState({
      loading: false,
      title: view.webContents.getTitle(),
      url: view.webContents.getURL(),
      securityState: securityStateForUrl(view.webContents.getURL()),
    }, context);
    persistWorkspaceBrowserContext(context, {
      currentURL: view.webContents.getURL(),
    });
    void rememberBrowsingVisit(
      context,
      view.webContents.getURL(),
      view.webContents.getTitle(),
    );
    setTimeout(() => void inspectKnownSiteIssue(context), 350);
  });
  view.webContents.on("did-finish-load", () => {
    if (context.navigationTraceId) {
      navigationPerformanceTracer.mark(context.navigationTraceId, "didFinishLoadAt");
    }
    context.runtimeState?.transition(context.viewOwner === "none" ? "warm" : "active", "page-loaded");
    pageCapabilityOrchestrator.run(context.tabId, "dom-ready", [
      {
        id: "document-end-userscripts",
        run: () => runUserScriptsForContext(context, "document-end"),
      },
    ]);
    pageCapabilityOrchestrator.run(context.tabId, "idle", [
      {
        id: "configured-auto-translation",
        run: () => maybeAutoTranslate(context),
      },
      {
        id: "document-idle-userscripts",
        run: () => {
          if (context.view === view && !view.webContents.isDestroyed()) {
            return runUserScriptsForContext(context, "document-idle");
          }
          return null;
        },
      },
    ]);
  });
  view.webContents.on("did-navigate", (_event, url) => {
    rememberSapNavigation(context, url);
    compactBrowserState({ url, securityState: securityStateForUrl(url), error: "" }, context);
    persistWorkspaceBrowserContext(context, { currentURL: url });
    void maybeOfferUserScriptInstall(context, url);
  });
  view.webContents.on("did-start-navigation", (_event, _url, _isInPlace, isMainFrame) => {
    if (isMainFrame && context.navigationTraceId) {
      navigationPerformanceTracer.mark(context.navigationTraceId, "didStartNavigationAt");
    }
  });
  view.webContents.on("did-redirect-navigation", (_event, url, isInPlace, isMainFrame) => {
    if (isMainFrame && !isInPlace) {
      rememberSapNavigation(context, url);
      if (context.navigationTraceId) navigationPerformanceTracer.redirect(context.navigationTraceId);
    }
  });
  view.webContents.on(
    "did-navigate-in-page",
    (_event, url, isMainFrame) => {
      if (isMainFrame) {
        rememberSapNavigation(context, url);
        if (pageTranslationController) void pageTranslationController.restore(context);
        if (selectionActionService) selectionActionService.clear(view.webContents);
        compactBrowserState({ url, securityState: securityStateForUrl(url), error: "" }, context);
        persistWorkspaceBrowserContext(context, { currentURL: url });
        pageCapabilityOrchestrator.run(context.tabId, "idle", [{
          id: "configured-auto-translation",
          run: () => maybeAutoTranslate(context),
        }]);
      }
    },
  );
  view.webContents.on("page-title-updated", (_event, title) =>
    compactBrowserState({ title }, context),
  );
  view.webContents.on("page-favicon-updated", (_event, favicons) => {
    const favicon = Array.isArray(favicons)
      ? favicons.find((value) => isSafeWebUrl(value))
      : null;
    context.favicon = favicon || context.favicon || null;
    const workspace = workspaceBrowserContexts.get(context.workspaceId);
    if (workspace) emitWorkspaceBrowserState(workspace);
  });
  view.webContents.on(
    "did-fail-load",
    (_event, errorCode, errorDescription, validatedURL, isMainFrame) => {
      if (!isMainFrame || errorCode === -3) return;
      compactBrowserState({
        loading: false,
        url: validatedURL,
        error: `${errorDescription} (${errorCode})`,
      }, context);
      if (context.navigationTraceId) completeNavigationPerformanceTrace(context);
    },
  );
  view.webContents.on("render-process-gone", () => {
    userScriptEngine?.cleanup(view.webContents);
    if (pageTranslationController) pageTranslationController.clear(context);
    if (selectionActionService) selectionActionService.clear(view.webContents);
    compactBrowserState({
      loading: false,
      error: "页面进程已停止，请点击刷新重试",
    }, context);
    context.runtimeState?.transition("crashed", "render-process-gone");
  });
  view.webContents.once("destroyed", () => {
    pageCapabilityOrchestrator.cancel(context.tabId);
    userScriptEngine?.cleanup(view.webContents);
    pageResourceService?.clear(view.webContents);
  });
  return view;
}

async function activateWorkspaceBrowserContext(workspaceId, options = {}) {
  const activationSequence = ++workspaceBrowserActivationSequence;
  const state = await getState();
  const id = String(workspaceId || state.activeWorkspaceId || "");
  const snapshot = getWorkspaceBrowserState(state, id, {
    defaultSites: DEFAULT_SITES,
  });
  if (activationSequence !== workspaceBrowserActivationSequence) {
    return ensureWorkspaceBrowserContext(id, snapshot).browserState;
  }
  const previous = activeBrowserContext();

  if (previous && previous.workspaceId !== id) {
    persistWorkspaceBrowserContext(previous);
    detachSiteView(previous);
  }

  activeBrowserWorkspaceId = id;
  scheduleLifecycleEnforcement("workspace-switched");
  const workspace = ensureWorkspaceBrowserContext(id, snapshot);
  const context = activeBrowserContext(workspace);
  if (!context) {
    workspace.browserState = emptyBrowserState(id);
    syncActiveBrowserAliases(null);
    mainWindow?.webContents.send("browser:state", workspace.browserState);
    return workspace.browserState;
  }
  context.attachRequested = options.attach !== false;
  syncActiveBrowserAliases(context);

  if (context.detached) {
    emitWorkspaceBrowserState(workspace);
    return workspace.browserState;
  }

  if (options.restore === false && !context.view) {
    emitWorkspaceBrowserState(workspace);
    return workspace.browserState;
  }

  if (!context.view) {
    context.navigationTraceId = navigationPerformanceTracer.start({
      workspaceId: context.workspaceId,
      tabId: context.tabId,
      restoredFromSuspended: true,
      partition: browserPartitionForProfile(context.browserProfileId),
      activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
    });
    navigationPerformanceTracer.mark(context.navigationTraceId, "sessionResolvedAt");
    ensureSiteView(context);
    compactBrowserState(
      {
        loading: true,
        error: "",
        siteIssue: "",
        url: context.browserState.currentURL,
      },
      context,
    );
  }

  if (options.attach !== false && context.attachRequested) {
    if (
      activationSequence !== workspaceBrowserActivationSequence ||
      activeBrowserWorkspaceId !== id
    ) {
      return workspace.browserState;
    }
    attachSiteView(context);
    applySiteViewBounds(options.bounds || siteViewBounds, context);
  }

  const liveURL = context.view.webContents.getURL();
  if (!liveURL && options.restore !== false) {
    ensureRuntimeTabView(context, { url: context.browserState.currentURL });
  } else {
    compactBrowserState(
      {
        title: context.view.webContents.getTitle(),
        url: liveURL || context.browserState.currentURL,
        loading: context.view.webContents.isLoading(),
      },
      context,
    );
    if (context.navigationTraceId && !context.view.webContents.isLoading()) {
      completeNavigationPerformanceTrace(context);
    }
  }
  emitWorkspaceBrowserState(workspace);
  return workspace.browserState;
}

function clearWorkspaceBrowserRuntime(workspaceId) {
  const id = String(workspaceId || "");
  const workspace = workspaceBrowserContexts.get(id);
  if (!workspace) {
    if (id === activeBrowserWorkspaceId) {
      browserState = emptyBrowserState(id);
      mainWindow?.webContents.send("browser:state", browserState);
    }
    return emptyBrowserState(id);
  }
  for (const tab of workspace.tabs.values()) {
    closeDetachedWindow(tab, "close");
    destroySiteView(tab);
  }
  workspace.tabs.clear();
  workspace.activeTabId = null;
  workspace.browserState = emptyBrowserState(id);
  if (id === activeBrowserWorkspaceId) {
    syncActiveBrowserAliases(null);
    mainWindow?.webContents.send("browser:state", workspace.browserState);
  }
  return workspace.browserState;
}

function destroyAllWorkspaceBrowserViews() {
  for (const workspace of workspaceBrowserContexts.values()) {
    persistWorkspaceBrowserWorkspace(workspace);
    for (const tab of workspace.tabs.values()) {
      closeDetachedWindow(tab, "close");
      destroySiteView(tab);
    }
  }
  workspaceBrowserContexts.clear();
  workspaceBrowserActivationSequence += 1;
  activeBrowserWorkspaceId = null;
  syncActiveBrowserAliases(null);
}

function ensureRuntimeTabView(tab, options = {}) {
  const view = ensureSiteView(tab);
  const targetURL = normalizeUrl(options.url || tab.browserState.currentURL);
  const liveURL = view.webContents.getURL();
  if (!liveURL || options.forceURL) {
    compactBrowserState(
      { loading: true, error: "", siteIssue: "", url: targetURL },
      tab,
    );
    const navigationView = view;
    const navigationPromise = waitForBrowserSession(tab.browserProfileId)
      .then(() => {
        if (tab.view !== navigationView || navigationView.webContents.isDestroyed()) return null;
        if (tab.navigationTraceId) {
          navigationPerformanceTracer.mark(tab.navigationTraceId, "loadUrlCalledAt");
        }
        return loadUrlAllowingRedirectAbort(navigationView.webContents, targetURL);
      })
      .catch((error) => {
        if (tab.view !== navigationView || navigationView.webContents.isDestroyed()) return;
        compactBrowserState(
          {
            loading: false,
            error: error?.message || "页面加载失败",
            url: targetURL,
          },
          tab,
        );
        if (tab.navigationTraceId) completeNavigationPerformanceTrace(tab);
      })
      .finally(() => {
        if (tab.pendingNavigation === navigationPromise) tab.pendingNavigation = null;
      });
    tab.pendingNavigation = navigationPromise;
  } else {
    compactBrowserState(
      {
        title: tab.view.webContents.getTitle(),
        url: liveURL,
        loading: tab.view.webContents.isLoading(),
      },
      tab,
    );
  }
  return tab;
}

async function waitForRuntimeTabNavigation(tab, timeoutMs = 10_000) {
  if (!tab?.view || tab.view.webContents.isDestroyed()) return;
  const pending = tab.pendingNavigation;
  if (!pending) return;
  let timer;
  await Promise.race([
    pending,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error("等待测试页加载超时")), Math.max(100, timeoutMs));
    }),
  ]).finally(() => clearTimeout(timer));
}

async function switchStoredActiveWorkspace(workspaceId, options = {}) {
  const state = await getState();
  if (state.activeWorkspaceId === workspaceId) return state;
  const switched = setActiveWorkspaceInState(state, workspaceId, {
    defaultSites: DEFAULT_SITES,
  });
  cachedState = switched.state;
  if (options.deferPersist === true) {
    void persistState().catch((error) => console.error("Unable to persist active workspace:", error?.message || error));
  } else {
    await persistState();
  }
  return cachedState;
}

async function selectBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要选择的网页标签");
  const { workspace, tab } = found;
  const hadView = Boolean(tab.view && !tab.view.webContents.isDestroyed());
  const traceId = payload?.performanceTraceId || navigationPerformanceTracer.start({
    workspaceId: workspace.workspaceId,
    tabId: tab.tabId,
    viewReused: hadView,
    restoredFromSuspended: !hadView && tab.runtimeState?.state === "suspended",
    partition: browserPartitionForProfile(tab.browserProfileId),
    activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
  });
  tab.navigationTraceId = traceId;
  tab.navigationDidStopTraceId = null;
  navigationPerformanceTracer.update(traceId, {
    workspaceId: workspace.workspaceId,
    tabId: tab.tabId,
    viewReused: hadView,
    restoredFromSuspended: !hadView && tab.runtimeState?.state === "suspended",
    partition: browserPartitionForProfile(tab.browserProfileId),
  });
  navigationPerformanceTracer.mark(traceId, "sessionResolvedAt");
  await switchStoredActiveWorkspace(workspace.workspaceId, { deferPersist: true });
  if (activeBrowserWorkspaceId !== workspace.workspaceId) {
    await activateWorkspaceBrowserContext(workspace.workspaceId, {
      attach: false,
      restore: false,
    });
  }
  const previous = activeBrowserContext(workspace);
  if (previous && previous !== tab) detachSiteView(previous);
  workspace.activeTabId = tab.tabId;
  tab.lastActiveAt = new Date().toISOString();
  if (tab.tabGroupId) {
    try {
      cachedState.tabGroups = updateTabGroup(cachedState.tabGroups, tab.tabGroupId, {
        lastActiveSessionId: tab.tabId,
      });
    } catch {
      tab.tabGroupId = null;
    }
  }
  if (tab.detached) {
    tab.detachedWindow?.show();
    tab.detachedWindow?.focus();
    persistWorkspaceBrowserWorkspace(workspace);
    return emitWorkspaceBrowserState(workspace);
  }
  tab.attachRequested = true;
  ensureSiteView(tab);
  if (
    activeBrowserWorkspaceId === workspace.workspaceId &&
    workspace.activeTabId === tab.tabId &&
    tab.attachRequested
  ) {
    attachSiteView(tab);
    if (payload?.bounds) applySiteViewBounds(payload.bounds, tab);
  }
  ensureRuntimeTabView(tab);
  if (hadView && !tab.view.webContents.isLoading()) completeNavigationPerformanceTrace(tab);
  persistWorkspaceBrowserWorkspace(workspace);
  scheduleLifecycleEnforcement("tab-selected");
  return emitWorkspaceBrowserState(workspace);
}

function findDuplicateRuntimeTab(workspace, siteId, url) {
  if (siteId) {
    return (
      Array.from(workspace.tabs.values()).find(
        (tab) => tab.currentSiteId === siteId,
      ) || null
    );
  }
  const normalizedURL = normalizeUrl(url);
  return (
    Array.from(workspace.tabs.values()).find(
      (tab) =>
        !tab.currentSiteId &&
        (tab.browserState.currentURL === normalizedURL ||
          tab.currentHomeUrl === normalizedURL),
    ) || null
  );
}

function findRuntimeTabByReliableContext(workspace, reliableContext) {
  const system = String(reliableContext?.system || "");
  const objectType = String(reliableContext?.objectType || "");
  const objectId = String(reliableContext?.objectId || "");
  if (!system || !objectType || !objectId) return null;
  return Array.from(workspace.tabs.values()).find((tab) =>
    tab.reliableContext?.system === system &&
    tab.reliableContext?.objectType === objectType &&
    String(tab.reliableContext?.objectId || "") === objectId
  ) || null;
}

async function createRuntimeBrowserTab(workspace, input = {}) {
  const url = normalizeUrl(input.url);
  const tab = createRuntimeTab(workspace.workspaceId, {
    tabId: input.tabId || randomUUID(),
    siteId: input.siteId || null,
    browserProfileId: input.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    title: input.title || "",
    url,
    homeURL: input.homeURL || url,
    allowDuplicate: input.allowDuplicate === true,
    tabGroupId: input.tabGroupId || null,
    groupSortOrder: input.groupSortOrder,
    reliableContext: input.reliableContext || null,
    createdAt: input.createdAt,
    lastActiveAt: input.lastActiveAt,
    favicon: input.favicon,
  });
  rememberSapNavigation(tab, url);
  if (input.insertAfterTabId && workspace.tabs.has(String(input.insertAfterTabId))) {
    const reordered = new Map();
    for (const [tabId, existing] of workspace.tabs) {
      reordered.set(tabId, existing);
      if (tabId === String(input.insertAfterTabId)) reordered.set(tab.tabId, tab);
    }
    workspace.tabs = reordered;
  } else {
    workspace.tabs.set(tab.tabId, tab);
  }
  if (input.activate !== false || !workspace.activeTabId) {
    workspace.activeTabId = tab.tabId;
  }
  persistWorkspaceBrowserWorkspace(workspace);
  return tab;
}

async function openTransientBrowserTab(workspaceId, rawUrl, options = {}) {
  const state = await getState();
  const snapshot = getWorkspaceBrowserState(state, workspaceId, {
    defaultSites: DEFAULT_SITES,
  });
  const workspace = ensureWorkspaceBrowserContext(workspaceId, snapshot);
  const url = normalizeUrl(rawUrl);
  const existing = options.allowDuplicate === true
    ? null
    : findRuntimeTabByReliableContext(workspace, options.reliableContext) ||
      findDuplicateRuntimeTab(workspace, null, url);
  if (existing) {
    if (options.background === true) return emitWorkspaceBrowserState(workspace);
    if (workspaceId === activeBrowserWorkspaceId) {
      return selectBrowserTab({ tabId: existing.tabId, bounds: options.bounds });
    }
    workspace.activeTabId = existing.tabId;
    if (existing.detached) {
      existing.detachedWindow?.show();
      existing.detachedWindow?.focus();
    }
    persistWorkspaceBrowserWorkspace(workspace);
    return emitWorkspaceBrowserState(workspace);
  }
  const tab = await createRuntimeBrowserTab(workspace, {
    url,
    homeURL: url,
    title: options.title || "",
    reliableContext: options.reliableContext || null,
    browserProfileId: options.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    allowDuplicate: options.allowDuplicate === true,
    activate: options.background !== true,
  });
  if (options.background === true) {
    await ensureRuntimeTabView(tab, { url, forceURL: true });
    persistWorkspaceBrowserWorkspace(workspace);
    scheduleLifecycleEnforcement("background-tab-opened");
    return emitWorkspaceBrowserState(workspace);
  }
  if (workspaceId === activeBrowserWorkspaceId) {
    return selectBrowserTab({ tabId: tab.tabId, bounds: options.bounds });
  }
  await ensureRuntimeTabView(tab, { url, forceURL: true });
  persistWorkspaceBrowserWorkspace(workspace);
  scheduleLifecycleEnforcement("background-tab-opened");
  return emitWorkspaceBrowserState(workspace);
}

function currentSearchSettings(state = cachedState) {
  return normalizeSearchSettings(state?.uiSettings?.search, globalSearchService.registry);
}

function resolveSearchInput(rawInput, engineId, state = cachedState) {
  const settings = currentSearchSettings(state);
  return globalSearchService.resolve(rawInput, {
    engineId: engineId || settings.defaultSearchEngineId,
  });
}

async function rememberSearchTarget(target) {
  const state = await getState();
  const settings = currentSearchSettings(state);
  state.searchHistory = recordSearchHistory(state.searchHistory, target, settings);
  state.updatedAt = new Date().toISOString();
  cachedState = state;
  void persistState().catch((error) => console.error("Unable to persist search history:", error?.message || error));
  return state.searchHistory;
}

function sanitizeBrowsingHistoryUrl(rawUrl) {
  let parsed;
  try { parsed = new URL(String(rawUrl || "")); } catch { return null; }
  if (!["http:", "https:"].includes(parsed.protocol) || parsed.username || parsed.password) return null;
  const sensitive = /^(?:access_token|refresh_token|id_token|token|oauth_token|authorization|auth|code|client_secret|state|session|session_id|sid|password|passwd|api_key|apikey)$/i;
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (sensitive.test(key)) parsed.searchParams.delete(key);
  }
  if (/(?:^|[?&#])(?:access_token|refresh_token|token|code|state|session|password)=/i.test(parsed.hash.slice(1))) parsed.hash = "";
  return parsed.toString();
}

async function rememberBrowsingVisit(context, rawUrl, title) {
  const url = sanitizeBrowsingHistoryUrl(rawUrl);
  if (!url) return;
  const state = await getState();
  const id = `visit-${createHash("sha256").update(url).digest("hex").slice(0, 32)}`;
  const now = new Date().toISOString();
  const history = Array.isArray(state.browsingHistory) ? state.browsingHistory : [];
  const existing = history.find((item) => item.id === id);
  const next = {
    id,
    type: "page",
    url,
    title: String(title || "").slice(0, 500),
    workspaceId: context?.workspaceId || state.activeWorkspaceId,
    lastVisitedAt: now,
    updatedAt: now,
    useCount: Math.max(1, Number(existing?.useCount || 0) + 1),
  };
  state.browsingHistory = [next, ...history.filter((item) => item.id !== id)].slice(0, 2000);
  cachedState = state;
  await persistState();
}

async function navigateBrowserContextToTarget(context, target) {
  context.currentSiteId = null;
  context.currentHomeUrl = target.url;
  syncActiveBrowserAliases(context);
  persistWorkspaceBrowserContext(context, { currentURL: context.currentHomeUrl });
  compactBrowserState(
    { loading: true, error: "", siteIssue: "", url: context.currentHomeUrl },
    context,
  );
  context.navigationTraceId = navigationPerformanceTracer.start({
    workspaceId: context.workspaceId,
    tabId: context.tabId,
    webContentsId: context.view.webContents.id,
    partition: browserPartitionForProfile(context.browserProfileId),
    viewReused: true,
    activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
  });
  context.navigationDidStopTraceId = null;
  navigationPerformanceTracer.mark(context.navigationTraceId, "sessionResolvedAt");
  navigationPerformanceTracer.mark(context.navigationTraceId, "viewAttachedAt");
  navigationPerformanceTracer.mark(context.navigationTraceId, "overlayHiddenAt");
  ensureRuntimeTabView(context, { url: context.currentHomeUrl, forceURL: true });
  void rememberSearchTarget(target);
  return context.browserState;
}

async function openSearchInput(payload = {}) {
  const state = await getState();
  const workspaceId = String(payload.workspaceId || state.activeWorkspaceId);
  const target = payload.forceSearch === true
    ? globalSearchService.search(payload.input, {
        engineId: payload.engineId || currentSearchSettings(state).defaultSearchEngineId,
      })
    : resolveSearchInput(payload.input, payload.engineId, state);
  if (target.kind === "external") {
    const externalResult = await getBrowserServices().externalProtocol.open(
      target.url,
      mainWindow,
    );
    return {
      state,
      browserState: null,
      target,
      externalResult,
    };
  }
  const activeWorkspace = workspaceBrowserContexts.get(workspaceId) || null;
  const activeTab = activeBrowserContext(activeWorkspace);
  const disposition = payload.disposition === "current" ? "current" : "new";
  let nextBrowserState;
  if (
    disposition === "current" &&
    !activeTab?.detached &&
    activeTab?.view &&
    !activeTab.view.webContents.isDestroyed()
  ) {
    nextBrowserState = await navigateBrowserContextToTarget(activeTab, target);
    nextBrowserState = emitWorkspaceBrowserState(activeWorkspace);
  } else {
    nextBrowserState = await openTransientBrowserTab(workspaceId, target.url, {
      title: target.kind === "search" ? `${target.engineName} 搜索` : "",
      browserProfileId: payload.browserProfileId || activeTab?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
      allowDuplicate: disposition === "new",
      bounds: payload.bounds,
    });
    void rememberSearchTarget(target);
  }
  return { state: cachedState, browserState: nextBrowserState, target };
}

function safeZohoTicketNavigationUrl(rawUrl, configuredWebBase, ticketId) {
  const fallback = `${String(configuredWebBase || "").replace(/\/$/, "")}/agent/tickets/details/${encodeURIComponent(ticketId)}`;
  if (!rawUrl) return fallback;
  try {
    const candidate = new URL(String(rawUrl));
    const configured = new URL(String(configuredWebBase));
    const standardZohoHost = candidate.hostname === "desk.zohocloud.ca" ||
      /(^|\.)desk\.zoho\.(com|eu|in|com\.au|jp|com\.cn|sa|uk)$/i.test(candidate.hostname);
    const configuredHost = candidate.hostname.toLowerCase() === configured.hostname.toLowerCase();
    if (candidate.protocol === "https:" && (standardZohoHost || configuredHost)) {
      candidate.username = "";
      candidate.password = "";
      return candidate.toString();
    }
  } catch {
    // Fall back to the validated configured Desk entry below.
  }
  return fallback;
}

async function refreshZohoDashboard() {
  if (zohoDashboardRefreshPromise) return zohoDashboardRefreshPromise;
  const controller = new AbortController();
  zohoDashboardAbortController = controller;
  const promise = getConnectorServices().zoho.refreshDashboard({ signal: controller.signal });
  zohoDashboardRefreshPromise = promise;
  try {
    return await promise;
  } finally {
    if (zohoDashboardRefreshPromise === promise) {
      zohoDashboardRefreshPromise = undefined;
      zohoDashboardAbortController = undefined;
    }
  }
}

async function showBrowser(payload) {
  const performanceTraceId = navigationPerformanceTracer.start({
    clickAt: performance.now(),
    activeCapabilityIds: IMMEDIATE_CAPABILITY_IDS,
  });
  const state = await getState();
  const requestedSiteId = String(payload?.siteId || "");
  const storedSite = state.sites.find((site) => site.id === requestedSiteId) || null;
  const workspaceId = String(
    storedSite?.workspaceId || payload?.workspaceId || state.activeWorkspaceId,
  );
  navigationPerformanceTracer.update(performanceTraceId, { workspaceId });
  const url = normalizeUrl(
    payload?.url || storedSite?.url || activeBrowserContext()?.currentHomeUrl,
  );

  if (state.activeWorkspaceId !== workspaceId) {
    const switched = setActiveWorkspaceInState(state, workspaceId, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = switched.state;
    void persistState().catch((error) => console.error("Unable to persist workspace switch:", error?.message || error));
  }
  if (activeBrowserWorkspaceId !== workspaceId) {
    await activateWorkspaceBrowserContext(workspaceId, {
      attach: false,
      restore: false,
    });
  }
  const snapshot = getWorkspaceBrowserState(cachedState, workspaceId, {
    defaultSites: DEFAULT_SITES,
  });
  const workspace = ensureWorkspaceBrowserContext(workspaceId, snapshot);
  const siteId = storedSite?.workspaceId === workspaceId ? storedSite.id : null;
  let tab = findDuplicateRuntimeTab(workspace, siteId, url);
  if (!tab) {
    tab = await createRuntimeBrowserTab(workspace, {
      siteId,
      browserProfileId: storedSite?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
      title: storedSite?.name || "",
      url,
      homeURL: url,
    });
  }
  if (tab.detached) {
    return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds, performanceTraceId });
  }
  return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds, performanceTraceId });
}

async function workspaceForExplicitDuplicate(workspaceId) {
  const id = String(workspaceId || "");
  await switchStoredActiveWorkspace(id);
  if (activeBrowserWorkspaceId !== id) {
    await activateWorkspaceBrowserContext(id, {
      attach: false,
      restore: false,
    });
  }
  const snapshot = getWorkspaceBrowserState(cachedState, id, {
    defaultSites: DEFAULT_SITES,
  });
  return ensureWorkspaceBrowserContext(id, snapshot);
}

async function duplicateBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要复制的网页标签");
  const source = found.tab;
  const url = normalizeUrl(runtimeTabURL(source));
  const workspace = await workspaceForExplicitDuplicate(source.workspaceId);
  const liveTitle =
    source.view && !source.view.webContents.isDestroyed()
      ? source.view.webContents.getTitle()
      : "";
  const tab = await createRuntimeBrowserTab(workspace, {
    siteId: source.currentSiteId,
    browserProfileId: source.browserProfileId,
    title: liveTitle || source.browserState.title || "",
    url,
    homeURL: source.currentHomeUrl || url,
    allowDuplicate: true,
    tabGroupId: source.tabGroupId || null,
    groupSortOrder: (Number(source.groupSortOrder) || 0) + 0.5,
    insertAfterTabId: source.tabId,
  });
  return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds });
}

function sessionUrlForTab(tabId) {
  const found = findRuntimeTab(tabId);
  if (!found) throw new Error("找不到网页标签");
  return normalizeUrl(runtimeTabURL(found.tab));
}

function copyBrowserTabUrl(payload) {
  const url = sessionUrlForTab(payload?.tabId || payload);
  clipboard.writeText(url);
  return { ok: true, url };
}

async function openBrowserTabExternal(payload) {
  const url = sessionUrlForTab(payload?.tabId || payload);
  await shell.openExternal(url);
  return { ok: true, url };
}

async function runtimeWorkspaceForOrganization(workspaceId) {
  const state = await getState();
  const id = String(workspaceId || state.activeWorkspaceId || "");
  if (!state.workspaces.some((workspace) => workspace.id === id)) {
    throw new Error("找不到工作空间");
  }
  return ensureWorkspaceBrowserContext(
    id,
    getWorkspaceBrowserState(state, id, { defaultSites: DEFAULT_SITES }),
  );
}

function organizationTabRecords(workspace) {
  return Array.from(workspace.tabs.values()).map((tab) => ({
    ...tabSummary(tab, workspace.activeTabId),
    groupSortOrder: Number(tab.groupSortOrder) || 0,
  }));
}

function applyOrganizationTabRecords(workspace, records) {
  const byId = new Map((records || []).map((record) => [String(record.tabId), record]));
  const ordered = new Map();
  for (const record of records || []) {
    const runtime = workspace.tabs.get(String(record.tabId));
    if (!runtime) continue;
    runtime.tabGroupId = record.tabGroupId || null;
    runtime.groupSortOrder = Number(record.groupSortOrder) || 0;
    ordered.set(runtime.tabId, runtime);
  }
  for (const [tabId, runtime] of workspace.tabs) {
    if (!byId.has(tabId)) ordered.set(tabId, runtime);
  }
  workspace.tabs = ordered;
}

async function persistTabOrganization(workspace) {
  if (workspace.tabs.size) persistWorkspaceBrowserWorkspace(workspace);
  else await persistState();
  return emitWorkspaceBrowserState(workspace);
}

async function createTabGroupOperation(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId);
  const tabIds = (Array.isArray(payload?.tabIds) ? payload.tabIds : [])
    .map(String)
    .filter((tabId) => workspace.tabs.has(tabId));
  const group = createTabGroup(cachedState.tabGroups, {
    workspaceId: workspace.workspaceId,
    name: payload?.name,
    colorKey: payload?.colorKey,
    iconKey: payload?.iconKey,
    lastActiveSessionId: tabIds.includes(workspace.activeTabId)
      ? workspace.activeTabId
      : tabIds[0] || null,
  });
  cachedState.tabGroups = [...cachedState.tabGroups, group];
  if (tabIds.length) {
    applyOrganizationTabRecords(
      workspace,
      assignTabsToGroup(organizationTabRecords(workspace), tabIds, group.id),
    );
  }
  const browserState = await persistTabOrganization(workspace);
  return { group, browserState };
}

async function updateTabGroupOperation(payload) {
  await getState();
  const groupId = String(payload?.groupId || "");
  const group = cachedState?.tabGroups?.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new Error("找不到页签组");
  const workspace = await runtimeWorkspaceForOrganization(group.workspaceId);
  cachedState.tabGroups = updateTabGroup(cachedState.tabGroups, groupId, payload?.patch || {});
  const browserState = await persistTabOrganization(workspace);
  return {
    group: cachedState.tabGroups.find((candidate) => candidate.id === groupId),
    browserState,
  };
}

async function assignTabsToGroupOperation(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId);
  const tabIds = (Array.isArray(payload?.tabIds) ? payload.tabIds : [payload?.tabId])
    .filter(Boolean)
    .map(String);
  if (!tabIds.length || tabIds.some((tabId) => !workspace.tabs.has(tabId))) {
    throw new Error("找不到要分组的页签");
  }
  const groupId = payload?.groupId ? String(payload.groupId) : null;
  if (groupId && !tabGroupsForWorkspace(workspace.workspaceId).some((group) => group.id === groupId)) {
    throw new Error("目标分组不属于当前空间");
  }
  applyOrganizationTabRecords(
    workspace,
    assignTabsToGroup(organizationTabRecords(workspace), tabIds, groupId),
  );
  if (groupId) {
    cachedState.tabGroups = updateTabGroup(cachedState.tabGroups, groupId, {
      lastActiveSessionId: tabIds.includes(workspace.activeTabId)
        ? workspace.activeTabId
        : tabIds[0],
    });
  }
  return persistTabOrganization(workspace);
}

async function reorderBrowserTabsOperation(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId);
  const requestedIds = Array.isArray(payload?.tabIds) ? payload.tabIds.map(String) : [];
  if (requestedIds.length !== workspace.tabs.size || requestedIds.some((id) => !workspace.tabs.has(id))) {
    throw new Error("页签排序数据不完整");
  }
  applyOrganizationTabRecords(
    workspace,
    reorderTabs(organizationTabRecords(workspace), requestedIds),
  );
  return persistTabOrganization(workspace);
}

async function reorderTabGroupsOperation(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId);
  const currentIds = tabGroupsForWorkspace(workspace.workspaceId).map((group) => group.id);
  const requestedIds = Array.isArray(payload?.groupIds) ? payload.groupIds.map(String) : [];
  if (requestedIds.length !== currentIds.length || currentIds.some((id) => !requestedIds.includes(id))) {
    throw new Error("分组排序数据不完整");
  }
  cachedState.tabGroups = reorderGroups(
    cachedState.tabGroups,
    workspace.workspaceId,
    requestedIds,
  );
  return persistTabOrganization(workspace);
}

async function mergeTabGroupsOperation(payload) {
  await getState();
  const sourceGroupId = String(payload?.sourceGroupId || "");
  const targetGroupId = String(payload?.targetGroupId || "");
  const source = cachedState?.tabGroups?.find((group) => group.id === sourceGroupId && !group.deletedAt);
  const target = cachedState?.tabGroups?.find((group) => group.id === targetGroupId && !group.deletedAt);
  if (!source || !target) throw new Error("找不到要合并的分组");
  if (source.workspaceId !== target.workspaceId) {
    throw new Error("不同工作空间的分组不能直接合并；请先明确移动页签的目标空间");
  }
  const workspace = await runtimeWorkspaceForOrganization(source.workspaceId);
  const result = mergeTabGroups(
    cachedState.tabGroups,
    organizationTabRecords(workspace),
    sourceGroupId,
    targetGroupId,
  );
  cachedState.tabGroups = result.groups;
  applyOrganizationTabRecords(workspace, result.tabs);
  lastTabGroupMergeUndo = result.undo;
  return { browserState: await persistTabOrganization(workspace), canUndo: true };
}

async function undoTabGroupMergeOperation() {
  await getState();
  if (!lastTabGroupMergeUndo) throw new Error("没有可撤销的分组合并");
  const workspace = await runtimeWorkspaceForOrganization(lastTabGroupMergeUndo.workspaceId);
  const result = undoTabGroupMerge(
    cachedState.tabGroups,
    organizationTabRecords(workspace),
    lastTabGroupMergeUndo,
  );
  cachedState.tabGroups = result.groups;
  applyOrganizationTabRecords(workspace, result.tabs);
  lastTabGroupMergeUndo = null;
  return persistTabOrganization(workspace);
}

async function deleteEmptyTabGroupOperation(payload) {
  await getState();
  const groupId = String(payload?.groupId || payload || "");
  const group = cachedState?.tabGroups?.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new Error("找不到页签组");
  const workspace = await runtimeWorkspaceForOrganization(group.workspaceId);
  if (Array.from(workspace.tabs.values()).some((tab) => tab.tabGroupId === groupId)) {
    throw new Error("只能删除空分组；请先移出或关闭其中页签");
  }
  const now = new Date().toISOString();
  cachedState.tabGroups = cachedState.tabGroups.map((candidate) => candidate.id === groupId
    ? { ...candidate, deletedAt: now, updatedAt: now }
    : candidate);
  return persistTabOrganization(workspace);
}

async function ungroupTabGroupOperation(payload) {
  await getState();
  const groupId = String(payload?.groupId || payload || "");
  const group = cachedState?.tabGroups?.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new Error("找不到页签组");
  const workspace = await runtimeWorkspaceForOrganization(group.workspaceId);
  const tabIds = Array.from(workspace.tabs.values())
    .filter((tab) => tab.tabGroupId === groupId)
    .map((tab) => tab.tabId);
  applyOrganizationTabRecords(
    workspace,
    assignTabsToGroup(organizationTabRecords(workspace), tabIds, null),
  );
  return persistTabOrganization(workspace);
}

async function closeTabGroupOperation(payload) {
  await getState();
  const groupId = String(payload?.groupId || payload || "");
  const group = cachedState?.tabGroups?.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new Error("找不到页签组");
  const workspace = await runtimeWorkspaceForOrganization(group.workspaceId);
  const candidates = Array.from(workspace.tabs.values()).filter((tab) => tab.tabGroupId === groupId);
  const closedTabIds = [];
  for (const tab of candidates) {
    const protection = await runtimeTabProtection(tab);
    if (protection.protected) {
      return {
        ok: false,
        closedTabIds,
        blocked: { tabId: tab.tabId, reason: protection.reason },
        browserState: emitWorkspaceBrowserState(workspace),
      };
    }
    await closeBrowserTab({ tabId: tab.tabId, force: true });
    closedTabIds.push(tab.tabId);
  }
  const now = new Date().toISOString();
  cachedState.tabGroups = cachedState.tabGroups.map((candidate) => candidate.id === groupId
    ? { ...candidate, deletedAt: now, updatedAt: now }
    : candidate);
  await persistState();
  return { ok: true, closedTabIds, browserState: emitWorkspaceBrowserState(workspace) };
}

async function suggestSiteTabGroupsOperation(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId || payload);
  return {
    workspaceId: workspace.workspaceId,
    suggestions: new SiteFamilyRegistry().suggestions(organizationTabRecords(workspace)),
  };
}

async function duplicateTabReport(payload) {
  const workspace = await runtimeWorkspaceForOrganization(payload?.workspaceId || payload);
  const groupsById = new Map(tabGroupsForWorkspace(workspace.workspaceId).map((group) => [group.id, group]));
  const detected = detectDuplicateTabs(organizationTabRecords(workspace), {
    activeTabId: workspace.activeTabId,
  });
  for (const exact of detected.exact) {
    exact.tabs = await Promise.all(exact.tabs.map(async (item) => {
      const runtime = workspace.tabs.get(item.tabId);
      const protection = await runtimeTabProtection(runtime);
      return {
        ...item,
        groupName: groupsById.get(item.tabGroupId)?.name || "未分组",
        audible: Boolean(runtime?.view?.webContents?.isCurrentlyAudible?.()),
        downloading: Boolean(runtime?.view && downloadManager?.hasActiveDownload(runtime.view.webContents.id)),
        unsavedRisk: Boolean(protection.protected),
        protectionReason: protection.reason || "",
      };
    }));
  }
  return { workspaceId: workspace.workspaceId, ...detected };
}

async function resolveDuplicateTabsOperation(payload) {
  const keeper = findRuntimeTab(payload?.keeperTabId);
  if (!keeper) throw new Error("找不到要保留的页签");
  const keeperUrl = normalizeComparableTabUrl(runtimeTabURL(keeper.tab));
  const closeTabIds = (Array.isArray(payload?.closeTabIds) ? payload.closeTabIds : []).map(String);
  const closedTabIds = [];
  for (const tabId of closeTabIds) {
    const found = findRuntimeTab(tabId);
    if (!found || found.workspace !== keeper.workspace) throw new Error("重复页签必须属于同一工作空间");
    if (!keeperUrl || normalizeComparableTabUrl(runtimeTabURL(found.tab)) !== keeperUrl) {
      throw new Error("所选页签不是完全重复 URL");
    }
    const protection = await runtimeTabProtection(found.tab);
    if (protection.protected) {
      return {
        ok: false,
        closedTabIds,
        blocked: { tabId, reason: protection.reason },
        browserState: emitWorkspaceBrowserState(keeper.workspace),
      };
    }
    await closeBrowserTab({ tabId, force: true });
    closedTabIds.push(tabId);
  }
  return {
    ok: true,
    closedTabIds,
    browserState: emitWorkspaceBrowserState(keeper.workspace),
  };
}

function showBrowserTabContextMenu(event, payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到网页标签");
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (!owner || owner.isDestroyed()) return Promise.resolve({ action: null });

  const source = found.tab;
  const liveTitle = source.view && !source.view.webContents.isDestroyed()
    ? source.view.webContents.getTitle()
    : "";
  const title = String(liveTitle || source.browserState.title || "当前页签")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 72);
  const groups = tabGroupsForWorkspace(source.workspaceId);
  const currentGroup = groups.find((group) => group.id === source.tabGroupId) || null;

  return new Promise((resolve) => {
    let selectedAction = null;
    const select = (action) => {
      selectedAction = action;
    };
    const menu = Menu.buildFromTemplate([
      { label: title || "当前页签", enabled: false },
      { type: "separator" },
      { label: "复制页签", click: () => select("duplicate") },
      { label: "复制页面链接", click: () => select("copy-url") },
      { label: "在外部浏览器打开", click: () => select("open-external") },
      {
        label: source.detached ? "合回空间" : "在独立窗口打开",
        click: () => select(source.detached ? "reattach" : "detach"),
      },
      {
        label: source.view?.webContents?.isAudioMuted?.() ? "取消静音" : "静音页签",
        enabled: Boolean(source.view && !source.view.webContents.isDestroyed()),
        click: () => select("toggle-mute"),
      },
      { type: "separator" },
      {
        label: "开启或退出画中画",
        enabled: Boolean(source.view && !source.view.webContents.isDestroyed()),
        click: () => {
          select("toggle-picture-in-picture");
          void browserMediaCapabilityService.togglePictureInPicture(
            source.view.webContents,
            { x: 0, y: 0 },
          );
        },
      },
      {
        label: "视频全屏",
        enabled: Boolean(source.view && !source.view.webContents.isDestroyed()),
        click: () => {
          select("toggle-video-fullscreen");
          void browserMediaCapabilityService.toggleVideoFullscreen(
            source.view.webContents,
            { x: 0, y: 0 },
          );
        },
      },
      { type: "separator" },
      {
        label: "添加到分组",
        submenu: [
          { label: "新建分组…", click: () => select("new-group") },
          ...(groups.length ? [{ type: "separator" }] : []),
          ...groups.map((group) => ({
            label: `${group.name}${group.id === currentGroup?.id ? " ✓" : ""}`,
            enabled: group.id !== currentGroup?.id,
            click: () => select(`assign-group:${group.id}`),
          })),
        ],
      },
      { label: "从分组移除", enabled: Boolean(currentGroup), click: () => select("remove-group") },
      { label: "将相同站点页签分组…", click: () => select("suggest-site-group") },
      { label: "整理重复页签…", click: () => select("organize-duplicates") },
      { type: "separator" },
      { label: source.keepRunning ? "取消保持运行" : "保持运行", click: () => select(source.keepRunning ? "allow-sleep" : "keep-running") },
      { label: "立即休眠", enabled: source !== activeBrowserContext() && !source.detached && Boolean(source.view), click: () => select("suspend") },
      { type: "separator" },
      {
        label: "恢复最近关闭的页签",
        accelerator: "CommandOrControl+Shift+T",
        enabled: Boolean(cachedState?.recentlyClosedTabs?.length),
        click: () => select("restore-recently-closed"),
      },
      { label: "关闭页签", click: () => select("close") },
    ]);
    menu.popup({
      window: owner,
      callback: () => resolve({ action: selectedAction, tabId: source.tabId }),
    });
  });
}

function showBrowserTabGroupContextMenu(event, payload) {
  const groupId = String(payload?.groupId || payload || "");
  const group = cachedState?.tabGroups?.find((candidate) => candidate.id === groupId && !candidate.deletedAt);
  if (!group) throw new Error("找不到页签组");
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (!owner || owner.isDestroyed()) return Promise.resolve({ action: null });
  const groups = tabGroupsForWorkspace(group.workspaceId);
  const workspace = workspaceBrowserContexts.get(group.workspaceId);
  const tabCount = workspace
    ? Array.from(workspace.tabs.values()).filter((tab) => tab.tabGroupId === group.id).length
    : 0;
  return new Promise((resolve) => {
    let selectedAction = null;
    const select = (action) => {
      selectedAction = action;
    };
    const menu = Menu.buildFromTemplate([
      { label: `${group.name} · ${tabCount} 个页签`, enabled: false },
      { type: "separator" },
      { label: "重命名与修改标识…", click: () => select("edit") },
      { label: group.collapsed ? "展开分组" : "折叠分组", click: () => select("toggle") },
      { label: "将全部页签移出分组", enabled: tabCount > 0, click: () => select("ungroup") },
      {
        label: "合并到其他分组",
        enabled: groups.length > 1,
        submenu: groups
          .filter((candidate) => candidate.id !== group.id)
          .map((candidate) => ({
            label: candidate.name,
            click: () => select(`merge-group:${candidate.id}`),
          })),
      },
      { label: "撤销上次分组合并", click: () => select("undo-merge") },
      { type: "separator" },
      { label: "关闭分组中的页签", enabled: tabCount > 0, click: () => select("close-group") },
      { label: "删除空分组", enabled: tabCount === 0, click: () => select("delete-empty") },
    ]);
    menu.popup({
      window: owner,
      callback: () => resolve({ action: selectedAction, groupId: group.id }),
    });
  });
}

function showAddressContextMenu(event) {
  const owner = BrowserWindow.fromWebContents(event.sender);
  if (!owner || owner.isDestroyed()) return Promise.resolve({ action: null });
  const context = activeBrowserContext();
  return new Promise((resolve) => {
    let selectedAction = null;
    const menu = Menu.buildFromTemplate([
      { label: "撤销", role: "undo" },
      { type: "separator" },
      { label: "剪切", role: "cut" },
      { label: "复制", role: "copy" },
      { label: "粘贴", role: "paste" },
      {
        label: "粘贴并转到",
        enabled: Boolean(context && clipboard.readText().trim()),
        click: () => {
          selectedAction = "paste-and-go";
          const pasted = clipboard.readText();
          void browserActionForContext(context, "navigate", pasted).catch((error) => {
            emitBrowserNotice(error?.message || "无法打开剪贴板内容", "error");
          });
        },
      },
      { type: "separator" },
      { label: "全选", role: "selectAll" },
    ]);
    menu.popup({
      window: owner,
      callback: () => resolve({ action: selectedAction }),
    });
  });
}

async function duplicateSiteTab(payload) {
  const state = await getState();
  const site = state.sites.find(
    (candidate) => candidate.id === String(payload?.siteId || payload || ""),
  );
  if (!site) throw new Error("找不到要复制的站点");
  const workspace = await workspaceForExplicitDuplicate(site.workspaceId);
  const tab = await createRuntimeBrowserTab(workspace, {
    siteId: site.id,
    browserProfileId: site.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    title: site.name,
    url: site.url,
    homeURL: site.url,
    allowDuplicate: true,
  });
  await markSiteOpened(site.id);
  return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds });
}

async function openSiteById(siteId, bounds) {
  let state = await getState();
  let site = state.sites.find((item) => item.id === String(siteId || ""));
  if (!site) throw new Error("找不到要打开的站点");
  if (state.activeWorkspaceId !== site.workspaceId) {
    const switched = setActiveWorkspaceInState(state, site.workspaceId, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = switched.state;
    void persistState().catch((error) => console.error("Unable to persist workspace switch:", error?.message || error));
    if (site.openMode === "external") {
      await activateWorkspaceBrowserContext(site.workspaceId, { bounds });
    }
    state = cachedState;
    site = state.sites.find((item) => item.id === String(siteId || ""));
  }
  site.lastOpenedAt = new Date().toISOString();
  void persistState().catch((error) => console.error("Unable to persist site activity:", error?.message || error));
  if (site.openMode === "external") {
    await shell.openExternal(site.url);
    return {
      state: cachedState,
      site,
      mode: "external",
      browserState:
        activeWorkspaceBrowserContext()?.browserState ||
        emptyBrowserState(site.workspaceId),
    };
  }
  const nextBrowserState = await showBrowser({
    siteId: site.id,
    url: site.url,
    bounds,
  });
  return {
    state: cachedState,
    site,
    mode: "internal",
    browserState: nextBrowserState,
  };
}

async function browserActionForContext(context, action, value) {
  if (!context?.view || context.view.webContents.isDestroyed()) {
    return context?.browserState || null;
  }
  const contents = context.view.webContents;
  const navigation = contents.navigationHistory;
  switch (action) {
    case "back":
      if (navigation.canGoBack()) navigation.goBack();
      break;
    case "forward":
      if (navigation.canGoForward()) navigation.goForward();
      break;
    case "reload":
      {
        const currentUrl = contents.getURL();
        const returnUrl = zohoDeskAuthReturnUrl(currentUrl);
        if (isZohoDeskTicketListUrl(currentUrl)) {
          const handled = await refreshZohoDeskTicketList(contents);
          if (!handled) {
            compactBrowserState({
              loading: false,
              error: "未找到 Zoho 页面内刷新按钮，请稍后重试",
            }, context);
          }
        } else if (returnUrl || isZohoDeskUrl(currentUrl)) {
          compactBrowserState({ loading: true, error: "" }, context);
          await loadUrlAllowingRedirectAbort(contents, returnUrl || currentUrl);
        } else {
          contents.reload();
        }
      }
      break;
    case "stop":
      contents.stop();
      break;
    case "home":
      if (isSafeWebUrl(context.currentHomeUrl)) {
        compactBrowserState({ loading: true, error: "" }, context);
        await loadUrlAllowingRedirectAbort(contents, context.currentHomeUrl);
      }
      break;
    case "navigate":
      {
      const target = resolveSearchInput(value);
      if (target.kind === "external") {
        await getBrowserServices().externalProtocol.open(
          target.url,
          browserOwnerWindow(context),
        );
        break;
      }
      await navigateBrowserContextToTarget(context, target);
      break;
      }
    case "zoom-in":
      contents.setZoomFactor(Math.min(1.5, contents.getZoomFactor() + 0.1));
      break;
    case "zoom-out":
      contents.setZoomFactor(Math.max(0.7, contents.getZoomFactor() - 0.1));
      break;
    case "zoom-reset":
      contents.setZoomFactor(1);
      break;
    case "external":
      if (isSafeWebUrl(contents.getURL())) await shell.openExternal(contents.getURL());
      break;
    case "toggle-mute":
      contents.setAudioMuted(!contents.isAudioMuted());
      compactBrowserState({
        muted: contents.isAudioMuted(),
        audible: contents.isCurrentlyAudible?.() || false,
      }, context);
      break;
    case "site-login": {
      const host = new URL(contents.getURL()).hostname;
      if (host === "nodeseek.com" || host.endsWith(".nodeseek.com")) {
        await loadUrlAllowingRedirectAbort(
          contents,
          "https://www.nodeseek.com/signIn.html",
        );
      } else if (host === "forum.naixi.net") {
        await loadUrlAllowingRedirectAbort(
          contents,
          "https://forum.naixi.net/member.php?mod=logging&action=login",
        );
      }
      break;
    }
    case "repair-network":
      return repairCurrentSiteNetwork(context);
    case "reset-site-session":
      return resetNodeSeekSession(context);
    case "repair-sap-session":
      return repairSapSession(context);
    default:
      break;
  }
  compactBrowserState({}, context);
  return context.browserState;
}

async function browserAction(action, value) {
  const workspace = activeWorkspaceBrowserContext();
  const context = activeBrowserContext(workspace);
  await browserActionForContext(context, action, value);
  return workspace ? emitWorkspaceBrowserState(workspace) : emptyBrowserState(activeBrowserWorkspaceId);
}

function toggleBrowserTabMute(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  const contents = found?.tab?.view?.webContents;
  if (!contents || contents.isDestroyed()) throw new Error("当前页签尚未载入，无法切换静音");
  contents.setAudioMuted(!contents.isAudioMuted());
  compactBrowserState({
    muted: contents.isAudioMuted(),
    audible: contents.isCurrentlyAudible?.() || false,
  }, found.tab);
  return {
    tabId: found.tab.tabId,
    muted: contents.isAudioMuted(),
    browserState: emitWorkspaceBrowserState(found.workspace),
  };
}

function applyDetachedViewBounds(tab) {
  const win = tab?.detachedWindow;
  if (!tab?.view || !win || win.isDestroyed()) return;
  const bounds = win.getContentBounds();
  if (tab.htmlFullscreenActive) {
    tab.view.setBounds({
      x: 0,
      y: 0,
      width: Math.max(120, bounds.width),
      height: Math.max(120, bounds.height),
    });
    return;
  }
  tab.view.setBounds({
    x: 0,
    y: DETACHED_HEADER_HEIGHT,
    width: Math.max(120, bounds.width),
    height: Math.max(120, bounds.height - DETACHED_HEADER_HEIGHT),
  });
}

function attachSiteViewToDetached(tab) {
  const win = tab?.detachedWindow;
  if (!tab?.view || !win || win.isDestroyed()) return;
  if (tab.viewOwner !== "none") detachSiteViewFromOwner(tab);
  win.contentView.addChildView(tab.view);
  tab.viewOwner = "detached";
  tab.attached = true;
  tab.detached = true;
  tab.runtimeState?.transition("active", "detached-window");
  applyDetachedViewBounds(tab);
  void installCompanionPageWidget(tab);
}

function closeDetachedWindow(tab, mode = "close") {
  const win = tab?.detachedWindow;
  if (!win) {
    if (tab) tab.detached = false;
    return;
  }
  tab.detachedCloseMode = mode;
  detachSiteViewFromOwner(tab);
  tab.detachedWindow = null;
  tab.detached = false;
  if (!win.isDestroyed()) win.destroy();
  tab.detachedCloseMode = "";
}

function detachedWindowOptions(value = {}) {
  const width = Math.max(720, Math.round(Number(value.width) || 1120));
  const height = Math.max(520, Math.round(Number(value.height) || 760));
  const options = { width, height };
  if (Number.isFinite(Number(value.x))) options.x = Math.round(Number(value.x));
  if (Number.isFinite(Number(value.y))) options.y = Math.round(Number(value.y));
  return options;
}

async function detachBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要拆出的网页标签");
  const { workspace, tab } = found;
  if (tab.detached && tab.detachedWindow && !tab.detachedWindow.isDestroyed()) {
    tab.detachedWindow.show();
    tab.detachedWindow.focus();
    return {
      ...emitWorkspaceBrowserState(workspace),
      tabId: tab.tabId,
      webContentsId: tab.view?.webContents.id || null,
      detachedWindowId: tab.detachedWindow.id,
    };
  }
  await ensureRuntimeTabView(tab);
  const previous = activeBrowserContext(workspace);
  if (previous && previous !== tab) detachSiteView(previous);
  workspace.activeTabId = tab.tabId;
  detachSiteViewFromOwner(tab);
  tab.attachRequested = false;
  tab.detached = true;

  const win = new BrowserWindow({
    ...detachedWindowOptions(payload?.windowBounds),
    minWidth: 720,
    minHeight: 520,
    show: false,
    autoHideMenuBar: true,
    title: `${tab.browserState.title || "独立页面"} · 栖页`,
    backgroundColor: "#f8f7f4",
    webPreferences: {
      preload: path.join(__dirname, "detached-preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  tab.detachedWindow = win;
  tab.detachedCloseMode = "";
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  win.webContents.on("will-navigate", (event, url) => {
    if (url !== win.webContents.getURL()) event.preventDefault();
  });
  win.on("resize", () => applyDetachedViewBounds(tab));
  win.on("close", (event) => {
    if (tab.detachedCloseMode) return;
    event.preventDefault();
    void closeBrowserTab({ tabId: tab.tabId });
  });
  win.on("closed", () => {
    if (tab.detachedWindow === win) tab.detachedWindow = null;
  });

  await win.loadFile(path.join(PROJECT_ROOT, "renderer", "detached.html"));
  if (tab.detachedWindow !== win || win.isDestroyed() || !tab.detached) {
    return emitWorkspaceBrowserState(workspace);
  }
  attachSiteViewToDetached(tab);
  win.show();
  win.focus();
  persistWorkspaceBrowserWorkspace(workspace);
  const nextState = emitWorkspaceBrowserState(workspace);
  sendDetachedTabState(tab);
  return {
    ...nextState,
    tabId: tab.tabId,
    webContentsId: tab.view.webContents.id,
    detachedWindowId: win.id,
  };
}

async function reattachBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要合回的网页标签");
  const { workspace, tab } = found;
  const webContentsId = tab.view?.webContents.id || null;
  if (tab.detached) closeDetachedWindow(tab, "reattach");
  await switchStoredActiveWorkspace(workspace.workspaceId);
  if (activeBrowserWorkspaceId !== workspace.workspaceId) {
    await activateWorkspaceBrowserContext(workspace.workspaceId, {
      attach: false,
      restore: false,
    });
  }
  const previous = activeBrowserContext(workspace);
  if (previous && previous !== tab) detachSiteView(previous);
  workspace.activeTabId = tab.tabId;
  tab.detached = false;
  tab.attachRequested = true;
  await ensureRuntimeTabView(tab);
  if (activeBrowserWorkspaceId === workspace.workspaceId) {
    attachSiteView(tab);
    if (payload?.bounds) applySiteViewBounds(payload.bounds, tab);
  }
  persistWorkspaceBrowserWorkspace(workspace);
  return {
    ...emitWorkspaceBrowserState(workspace),
    tabId: tab.tabId,
    webContentsId,
    detachedWindowId: null,
  };
}

function focusDetachedBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到已拆出的网页标签");
  const { workspace, tab } = found;
  if (!tab.detached || !tab.detachedWindow || tab.detachedWindow.isDestroyed()) {
    throw new Error("这个标签当前没有独立窗口");
  }
  if (workspace.workspaceId === activeBrowserWorkspaceId) {
    const previous = activeBrowserContext(workspace);
    if (previous && previous !== tab) detachSiteView(previous);
  }
  workspace.activeTabId = tab.tabId;
  tab.detachedWindow.show();
  tab.detachedWindow.focus();
  persistWorkspaceBrowserWorkspace(workspace);
  return emitWorkspaceBrowserState(workspace);
}

async function closeBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要关闭的网页标签");
  const { workspace, tab } = found;
  if (payload?.force !== true) {
    const protection = await runtimeTabProtection(tab);
    let decision = tabCloseDecision({
      protection,
      userInitiated: payload?.userInitiated === true,
    });
    if (decision.action === "block") {
      throw new Error(`页面暂不能关闭：${decision.reason}`);
    }
    if (decision.action === "confirm") {
      const owner = mainWindow && !mainWindow.isDestroyed() ? mainWindow : null;
      const options = {
        type: "warning",
        title: "关闭页签",
        message: "这个页签可能有尚未完成的操作",
        detail: `原因：${decision.reason}。关闭后可能中断下载或丢失未保存内容。`,
        buttons: ["仍要关闭", "取消"],
        defaultId: 1,
        cancelId: 1,
        noLink: true,
      };
      const confirmation = owner
        ? await dialog.showMessageBox(owner, options)
        : await dialog.showMessageBox(options);
      decision = tabCloseDecision({
        protection,
        userInitiated: true,
        confirmed: confirmation.response === 0,
      });
      if (decision.action !== "close") {
        return {
          ...emitWorkspaceBrowserState(workspace),
          closeCancelled: true,
          closeBlockedReason: decision.reason,
        };
      }
    }
  }
  const orderedTabs = Array.from(workspace.tabs.values());
  const closedIndex = orderedTabs.findIndex((item) => item === tab);
  const recentlyClosed = rememberRecentlyClosedBrowserTab(workspace, tab, closedIndex);
  closeDetachedWindow(tab, "close");
  destroySiteView(tab);
  workspace.tabs.delete(tab.tabId);
  if (workspace.activeTabId === tab.tabId) {
    const remaining = Array.from(workspace.tabs.values());
    workspace.activeTabId =
      remaining[Math.min(closedIndex, remaining.length - 1)]?.tabId || null;
  }
  persistWorkspaceBrowserWorkspace(workspace);
  scheduleLifecycleEnforcement("tab-closed");
  const fallback = activeBrowserContext(workspace);
  if (
    workspace.workspaceId === activeBrowserWorkspaceId &&
    fallback &&
    !fallback.detached
  ) {
    fallback.attachRequested = true;
    await ensureRuntimeTabView(fallback);
    attachSiteView(fallback);
    if (payload?.bounds) applySiteViewBounds(payload.bounds, fallback);
  }
  return {
    ...emitWorkspaceBrowserState(workspace),
    recentlyClosedId: recentlyClosed?.id || null,
  };
}

function rememberRecentlyClosedBrowserTab(workspace, tab, closedIndex) {
  if (!cachedState || !workspace || !tab) return null;
  const url = runtimeTabURL(tab);
  if (!isSafeWebUrl(url)) return null;
  const now = new Date().toISOString();
  const storedSite = cachedState.sites.find(
    (site) => site.id === tab.currentSiteId && site.workspaceId === workspace.workspaceId,
  );
  const liveTitle = tab.view && !tab.view.webContents.isDestroyed()
    ? tab.view.webContents.getTitle()
    : "";
  const activeGroup = cachedState.tabGroups?.find(
    (group) =>
      group.id === tab.tabGroupId &&
      group.workspaceId === workspace.workspaceId &&
      !group.deletedAt,
  );
  const record = {
    id: `closed-${randomUUID()}`,
    workspaceId: workspace.workspaceId,
    tabId: tab.tabId,
    siteId: storedSite?.id || null,
    browserProfileId: tab.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    title: liveTitle || tab.browserState.title || storedSite?.name || "",
    url,
    normalizedUrl: normalizeUrl(url),
    homeURL:
      (isSafeWebUrl(tab.currentHomeUrl) && tab.currentHomeUrl) ||
      storedSite?.url ||
      url,
    favicon: tab.favicon || null,
    createdAt: tab.createdAt || now,
    lastActiveAt: tab.lastActiveAt || now,
    reliableContext: tab.reliableContext || null,
    keepRunning: tab.keepRunning === true,
    tabGroupId: activeGroup?.id || null,
    groupSortOrder: Number(tab.groupSortOrder) || 0,
    closedIndex: Math.max(0, Number(closedIndex) || 0),
    allowDuplicate: tab.allowDuplicate === true,
    closedAt: now,
  };
  cachedState.recentlyClosedTabs = [
    record,
    ...(Array.isArray(cachedState.recentlyClosedTabs) ? cachedState.recentlyClosedTabs : []),
  ].slice(0, MAX_RECENTLY_CLOSED_TABS);
  return record;
}

async function restoreRecentlyClosedBrowserTab(payload = {}) {
  const state = await getState();
  const records = Array.isArray(state.recentlyClosedTabs) ? state.recentlyClosedTabs : [];
  const requestedId = String(payload?.closedId || "").trim();
  const record = requestedId
    ? records.find((candidate) => candidate.id === requestedId)
    : records[0];
  if (!record) throw new Error("没有可恢复的最近关闭页签");
  const workspace = await workspaceForExplicitDuplicate(record.workspaceId);
  const site = cachedState.sites.find(
    (candidate) => candidate.id === record.siteId && candidate.workspaceId === record.workspaceId,
  );
  const group = cachedState.tabGroups?.find(
    (candidate) =>
      candidate.id === record.tabGroupId &&
      candidate.workspaceId === record.workspaceId &&
      !candidate.deletedAt,
  );
  const restoredTabId = findRuntimeTab(record.tabId) ? randomUUID() : record.tabId;
  const tab = await createRuntimeBrowserTab(workspace, {
    tabId: restoredTabId,
    siteId: site?.id || null,
    browserProfileId: record.browserProfileId || site?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
    title: record.title,
    url: record.url,
    homeURL: record.homeURL || record.url,
    allowDuplicate: true,
    tabGroupId: group?.id || null,
    groupSortOrder: Number(record.groupSortOrder) || 0,
    reliableContext: record.reliableContext || null,
    createdAt: record.createdAt,
    lastActiveAt: record.lastActiveAt,
    favicon: record.favicon,
  });
  tab.keepRunning = record.keepRunning === true;
  cachedState.recentlyClosedTabs = records.filter((candidate) => candidate.id !== record.id);
  persistWorkspaceBrowserWorkspace(workspace);
  const restored = await selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds });
  return {
    ...restored,
    restoredClosedId: record.id,
    restoredToOriginalGroup: Boolean(group),
  };
}

function detachedTabForSender(sender) {
  if (!sender) return null;
  for (const workspace of workspaceBrowserContexts.values()) {
    for (const tab of workspace.tabs.values()) {
      if (tab.detachedWindow?.webContents === sender) return { workspace, tab };
    }
  }
  return null;
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function sendAutomationStatus(naixi) {
  mainWindow?.webContents.send("automation:status", { naixi });
}

async function updateNaixiStatus(patch) {
  const state = await getState();
  state.automations.naixi = {
    ...state.automations.naixi,
    ...patch,
  };
  await persistState();
  sendAutomationStatus(state.automations.naixi);
  return state.automations.naixi;
}

async function inspectNaixiPage(contents) {
  return contents.executeJavaScript(`(() => {
    const text = document.body?.innerText || "";
    const button = document.querySelector("#JD_sign") ||
      Array.from(document.querySelectorAll("a, button")).find((element) =>
        /^签到(?:$|\\s)/.test((element.textContent || "").trim())
      );
    const loginLink = Array.from(document.querySelectorAll("a")).some((link) => {
      const label = (link.textContent || "").trim();
      return label === "登录" && /logging|login|signin/i.test(link.href || "");
    });
    const signed = Boolean(document.querySelector(".btnvisted, .signvisted")) ||
      /您今天已经签到|您今日已经签到|您今日已经签过到|今日已签到|签到成功/.test(text);
    const unsigned = /您今天还没有签到|今日尚未签到|还没有签到/.test(text);
    const captcha = /验证码|请输入.*验证|seccode/i.test(text);
    let buttonUrl;
    try {
      buttonUrl = button?.href ? new URL(button.href, location.href) : undefined;
    } catch {
      buttonUrl = undefined;
    }
    const safeButtonUrl = Boolean(
      buttonUrl &&
      buttonUrl.origin === location.origin &&
      buttonUrl.pathname === "/plugin.php" &&
      buttonUrl.searchParams.get("id") === "k_misign:sign" &&
      buttonUrl.searchParams.get("operation") === "qiandao"
    );
    const formhash = document.querySelector('input[name="formhash"]')?.value ||
      (safeButtonUrl ? buttonUrl.searchParams.get("formhash") : "") || "";
    const needsLogin = /请先登录|登录后才能签到|您需要先登录/.test(text) ||
      (loginLink && !signed && (!button || !formhash));
    return {
      signed,
      unsigned,
      captcha,
      needsLogin,
      hasButton: Boolean(button),
      hasSafeButtonUrl: safeButtonUrl,
      formhash
    };
  })()`);
}

async function performNaixiCheckin({ manual = false, source = "manual" } = {}) {
  const state = await getState();
  const config = state.automations.naixi;
  const today = localDateKey();
  if (!manual && !config.enabled) return config;
  if (!manual && config.lastSuccessDate === today) {
    return updateNaixiStatus({
      status: "success",
      message: "今天已经签到，无需重复操作",
    });
  }

  const startedAt = new Date().toISOString();
  await updateNaixiStatus({
    status: "running",
    message: source === "startup" ? "启动后正在检查今日签到" : "正在检查签到状态",
    lastRunAt: startedAt,
  });

  const siteSession = await waitForPersistentSiteSession();
  automationWindow = new BrowserWindow({
    width: 1100,
    height: 760,
    show: false,
    skipTaskbar: true,
    webPreferences: {
      partition: browserPartitionForProfile(DEFAULT_BROWSER_PROFILE_ID),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  automationWindow.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  automationWindow.webContents.on("will-navigate", (event, url) => {
    if (!hasExpectedHost(url, "forum.naixi.net")) event.preventDefault();
  });

  try {
    await Promise.race([
      automationWindow.loadURL("https://forum.naixi.net/k_misign-sign.html"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("签到页面加载超时")), 30000),
      ),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    if (!hasExpectedHost(automationWindow.webContents.getURL(), "forum.naixi.net")) {
      throw new Error("签到页面跳转到了非奶昔论坛地址，已停止操作");
    }
    let pageState = await inspectNaixiPage(automationWindow.webContents);

    if (pageState.signed) {
      return updateNaixiStatus({
        status: "success",
        message: "今天已经签到，无需重复操作",
        lastSuccessAt: new Date().toISOString(),
        lastSuccessDate: today,
      });
    }
    if (pageState.needsLogin) {
      return updateNaixiStatus({
        status: "needs-login",
        message: "登录状态已失效，请先在奶昔论坛重新登录",
      });
    }
    if (pageState.captcha) {
      return updateNaixiStatus({
        status: "needs-action",
        message: "签到出现验证码，已暂停自动操作",
      });
    }
    if (
      !pageState.hasButton ||
      !pageState.hasSafeButtonUrl ||
      !/^[A-Za-z0-9_-]{4,64}$/.test(pageState.formhash)
    ) {
      return updateNaixiStatus({
        status: "error",
        message: "签到页面结构已变化，未找到安全的签到入口",
      });
    }

    const endpoint = new URL("https://forum.naixi.net/plugin.php");
    endpoint.searchParams.set("id", "k_misign:sign");
    endpoint.searchParams.set("operation", "qiandao");
    endpoint.searchParams.set("formhash", pageState.formhash);
    endpoint.searchParams.set("format", "empty");
    endpoint.searchParams.set("inajax", "1");
    endpoint.searchParams.set("ajaxtarget", "JD_sign");
    const response = await siteSession.fetch(endpoint.toString(), {
      method: "GET",
      credentials: "include",
      headers: {
        accept: "*/*",
        referer: "https://forum.naixi.net/k_misign-sign.html",
        "x-requested-with": "XMLHttpRequest",
      },
    });
    const responseText = (await response.text()).slice(0, 1200);
    if (/验证码|seccode/i.test(responseText)) {
      return updateNaixiStatus({
        status: "needs-action",
        message: "签到接口要求验证码，已暂停自动操作",
      });
    }
    if (/请先登录|登录后/i.test(responseText)) {
      return updateNaixiStatus({
        status: "needs-login",
        message: "登录状态已失效，请先在奶昔论坛重新登录",
      });
    }
    if (!response.ok) {
      throw new Error(`签到接口返回 HTTP ${response.status}`);
    }

    await automationWindow.loadURL("https://forum.naixi.net/k_misign-sign.html");
    await new Promise((resolve) => setTimeout(resolve, 1500));
    pageState = await inspectNaixiPage(automationWindow.webContents);
    const responseConfirmed = /签到成功|已经签到|今日已签/.test(responseText);
    if (pageState.signed || responseConfirmed) {
      return updateNaixiStatus({
        status: "success",
        message: "自动签到成功",
        lastSuccessAt: new Date().toISOString(),
        lastSuccessDate: today,
      });
    }
    return updateNaixiStatus({
      status: "error",
      message: "签到请求已发送，但页面没有返回可确认的成功状态",
    });
  } catch (error) {
    return updateNaixiStatus({
      status: "error",
      message: String(error?.message || "自动签到失败").slice(0, 300),
    });
  } finally {
    if (automationWindow && !automationWindow.isDestroyed()) {
      automationWindow.destroy();
    }
    automationWindow = undefined;
  }
}

function runNaixiCheckin(options) {
  if (automationRunPromise) return automationRunPromise;
  usageTracker?.setBackgroundAutomation(true);
  automationRunPromise = performNaixiCheckin(options).finally(() => {
    usageTracker?.setBackgroundAutomation(false);
    automationRunPromise = undefined;
  });
  return automationRunPromise;
}

async function scheduleNaixiAutomation(forceTomorrow = false) {
  if (automationTimer) clearTimeout(automationTimer);
  automationTimer = undefined;
  const state = await getState();
  const config = state.automations.naixi;
  if (!config.enabled) return;

  const now = new Date();
  const [hour, minute] = config.time.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hour, minute, 0, 0);
  const successfulToday = config.lastSuccessDate === localDateKey(now);
  let runSource = "scheduled";
  if (forceTomorrow || successfulToday) {
    target.setDate(target.getDate() + 1);
  } else if (target <= now) {
    target.setTime(now.getTime() + 8000);
    runSource = "startup";
  }

  const delay = Math.max(1000, target.getTime() - now.getTime());
  automationTimer = setTimeout(async () => {
    try {
      await runNaixiCheckin({ manual: false, source: runSource });
    } finally {
      void scheduleNaixiAutomation(true);
    }
  }, delay);
}

async function updateNaixiAutomationSettings(input) {
  const state = await getState();
  const next = { ...state.automations.naixi };
  if (typeof input?.enabled === "boolean") next.enabled = input.enabled;
  if (typeof input?.time === "string") {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(input.time)) {
      throw new Error("签到时间格式无效");
    }
    next.time = input.time;
  }
  next.status = next.enabled ? (next.status === "disabled" ? "idle" : next.status) : "disabled";
  next.message = next.enabled ? "自动签到已开启" : "自动签到已关闭";
  state.automations.naixi = next;
  await persistState();
  sendAutomationStatus(next);
  await scheduleNaixiAutomation();
  return next;
}

async function markSiteOpened(siteId) {
  const state = await getState();
  const site = state.sites.find((item) => item.id === String(siteId || ""));
  if (!site) return;
  site.lastOpenedAt = new Date().toISOString();
  void persistState().catch((error) => console.error("Unable to persist site activity:", error?.message || error));
}

function currentStoredSite(state) {
  if (!currentSiteId) return null;
  const site = state.sites.find((item) => item.id === currentSiteId);
  if (!site || !siteView || siteView.webContents.isDestroyed()) return null;
  try {
    const currentHost = new URL(siteView.webContents.getURL()).hostname.toLowerCase();
    const storedHost = new URL(site.url).hostname.toLowerCase();
    return currentHost === storedHost ? site : null;
  } catch {
    return null;
  }
}

async function savePageAsSite(input) {
  const state = await getState();
  let result = addSiteToState(state, input, { defaultSites: DEFAULT_SITES });
  if (result.existed) {
    const assistantIds = Array.from(
      new Set([...(result.site.assistantIds || []), ...(input.assistantIds || [])]),
    );
    result = updateSiteInState(
      result.state,
      {
        id: result.site.id,
        pinned: input.pinned ? true : result.site.pinned,
        assistantIds,
      },
      { defaultSites: DEFAULT_SITES },
    );
  }
  cachedState = result.state;
  await persistState();
  return result.site;
}

async function appendAssistantExecutionLog(record) {
  const state = await getState();
  const existing = Array.isArray(state.assistantExecutionLogs)
    ? state.assistantExecutionLogs
    : [];
  state.assistantExecutionLogs = [record, ...existing].slice(0, 200);
  await persistState();
}

async function updateAssistantRuntimeState(assistantId, patch) {
  const state = await getState();
  const current = state.assistantSettings?.[assistantId] || {};
  state.assistantSettings = {
    ...(state.assistantSettings || {}),
    [assistantId]: { ...current, ...patch },
  };
  await persistState();
}

async function ensureAssistantRuntime() {
  const state = await getState();
  if (!assistantRegistry) {
    assistantRegistry = createBuiltinAssistantRegistry(state.assistantSettings || {});
  }
  if (!assistantExecutionService) {
    const pageContextAdapter = new PageContextAdapter({
      getWebContents: () =>
        siteView && !siteView.webContents.isDestroyed()
          ? siteView.webContents
          : null,
    });
    assistantExecutionService = new AssistantExecutionService({
      registry: assistantRegistry,
      matcher: new AssistantMatcher(assistantRegistry),
      permissionGuard: new AssistantPermissionGuard(),
      pageContextAdapter,
      getCurrentSite: async () => currentStoredSite(await getState()),
      getCurrentWorkspaceId: async () => (await getState()).activeWorkspaceId,
      clipboard: (text) => clipboard.writeText(text),
      openExternal: (url) => shell.openExternal(url),
      saveSite: savePageAsSite,
      appendExecutionLog: appendAssistantExecutionLog,
      updateAssistantRuntime: updateAssistantRuntimeState,
    });
  }
  return { registry: assistantRegistry, service: assistantExecutionService };
}

async function listAssistants() {
  const { registry } = await ensureAssistantRuntime();
  return {
    assistants: registry.list().map((assistant) => ({
      ...assistant,
      enabled: assistant.runtimeEnabled,
      canDisable: assistant.id !== "generic-page-actions",
    })),
  };
}

async function setAssistantEnabled(assistantId, enabled) {
  const { registry } = await ensureAssistantRuntime();
  const id = String(assistantId || "");
  if (typeof enabled !== "boolean") throw new Error("助手启用状态无效");
  if (id === "generic-page-actions" && enabled === false) {
    throw new Error("通用页面动作是内置浏览器的基础能力，不能停用");
  }
  registry.setEnabled(id, enabled);
  const state = await getState();
  state.assistantSettings = registry.getEnabledState();
  await persistState();
  return listAssistants();
}

function taskSnapshot(state = cachedState) {
  return {
    tasks: Array.isArray(state?.localTasks) ? state.localTasks : [],
    reminders: Array.isArray(state?.taskReminders) ? state.taskReminders : [],
    settings: state?.taskSettings || {},
    timeZone: state?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
  };
}

function usageSummary(days, year, today = localDateFromInstant(new Date())) {
  const activeDates = new Set((Array.isArray(days) ? days : [])
    .filter((day) => Number(day.foregroundActiveSeconds) > 0 || Number(day.meaningfulActionCount) > 0)
    .map((day) => day.localDate));
  let currentStreakDays = 0;
  const cursor = new Date(`${today}T12:00:00`);
  while (!Number.isNaN(cursor.valueOf())) {
    const key = localDateFromInstant(cursor);
    if (!activeDates.has(key)) break;
    currentStreakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  const yearPrefix = `${year}-`;
  const monthPrefix = String(today).slice(0, 7);
  return {
    yearActiveDays: Array.from(activeDates).filter((date) => date.startsWith(yearPrefix)).length,
    monthActiveDays: Array.from(activeDates).filter((date) => date.startsWith(monthPrefix)).length,
    currentStreakDays,
    foregroundActiveSeconds: (Array.isArray(days) ? days : [])
      .reduce((sum, day) => sum + Math.max(0, Number(day.foregroundActiveSeconds) || 0), 0),
  };
}

function habitSnapshot(state = cachedState, requestedYear = null) {
  const parsedYear = Number(requestedYear);
  const year = Number.isInteger(parsedYear) && parsedYear >= 1 && parsedYear <= 9999
    ? parsedYear
    : new Date().getFullYear();
  const today = localDateFromInstant(new Date());
  usageTracker?.tick();
  const usageDays = (usageTracker?.snapshot() || state?.usageDayAggregates || [])
    .filter((day) => String(day.localDate || "").startsWith(`${year}-`));
  const checkIns = Array.isArray(state?.habitCheckIns) ? state.habitCheckIns : [];
  const ledger = Array.isArray(state?.rewardLedger) ? state.rewardLedger : [];
  const habits = (Array.isArray(state?.habits) ? state.habits : [])
    .filter((habit) => !habit.deletedAt)
    .map((habit) => {
      const heatmap = buildHabitHeatmap(habit, checkIns, year, {
        dailyTargetValue: habit.targetType === "totalCheckIns" ? habit.targetValue : null,
      });
      const todayCheckIn = checkIns.find((item) => (
        item.habitId === habit.id && item.localDate === today && !item.deletedAt
      )) || null;
      return {
        ...habit,
        stats: computeHabitStats(habit, checkIns, { asOfLocalDate: today }),
        heatmap,
        todayCheckIn: todayCheckIn
          ? { id: todayCheckIn.id, state: todayCheckIn.state, value: todayCheckIn.value }
          : null,
        starCount: habitStarCount(ledger, habit.id),
      };
    });
  const todayPendingCount = habits.filter((habit) => (
    habit.status === "active" &&
    isHabitScheduledOnDate(habit, today) &&
    !habit.todayCheckIn
  )).length;
  return {
    year,
    today,
    habits,
    todayPendingCount,
    totalStars: totalHabitStarCount(ledger),
    usage: {
      year,
      enabled: state?.uiSettings?.usageTrackingEnabled !== false,
      days: usageDays,
      summary: usageSummary(usageDays, year, today),
    },
  };
}

function emitHabitsChanged(focusHabitId = null) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("habits:changed", {
    ...habitSnapshot(cachedState),
    focusHabitId,
  });
}

function mutateHabitState(mutator, requestedYear = null) {
  const operation = habitMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const state = await getState();
      const result = mutator(state);
      await commitStateCandidate(result.state);
      emitHabitsChanged(result.habit?.id || result.checkIn?.habitId || null);
      if (taskReminderScheduler) await taskReminderScheduler.reschedule();
      return { ...result, ...habitSnapshot(cachedState, requestedYear) };
    });
  habitMutationQueue = operation.catch(() => undefined);
  return operation;
}

async function persistUsageAggregates(aggregates) {
  const operation = habitMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const state = await getState();
      const candidate = {
        ...state,
        usageDayAggregates: Array.isArray(aggregates) ? aggregates : [],
      };
      await commitStateCandidate(candidate);
      emitHabitsChanged();
      return cachedState;
    });
  habitMutationQueue = operation.catch(() => undefined);
  return operation;
}

function updateUsageEligibility() {
  if (!usageTracker) return;
  const foreground = Boolean(
    mainWindow &&
    !mainWindow.isDestroyed() &&
    mainWindow.isVisible() &&
    !mainWindow.isMinimized() &&
    mainWindow.isFocused(),
  );
  usageTracker.setIdle(powerMonitor.getSystemIdleTime() >= 120);
  usageTracker.setForeground(foreground);
}

async function initializeUsageRuntime() {
  if (usageTracker) return usageTracker;
  const state = await getState();
  usageTracker = new UsageTracker({
    aggregates: state.usageDayAggregates,
    enabled: state.uiSettings?.usageTrackingEnabled !== false,
    foreground: false,
    flushIntervalMs: 60_000,
    maxAccrualGapMs: 60_000,
    onFlush: persistUsageAggregates,
  });
  updateUsageEligibility();
  usageTrackerTimer = setInterval(() => {
    updateUsageEligibility();
    void usageTracker?.flushIfDue().catch((error) => {
      console.error("Unable to persist local usage aggregate:", error?.message || error);
    });
  }, 15_000);
  usageTrackerTimer.unref?.();
  return usageTracker;
}

async function setUsageTrackingEnabled(enabled) {
  const state = await getState();
  const result = updateUiSettingsInState(state, {
    usageTrackingEnabled: enabled === true,
  }, { defaultSites: DEFAULT_SITES });
  await commitStateCandidate(result.state);
  const tracker = await initializeUsageRuntime();
  tracker.setEnabled(enabled === true);
  if (!enabled) await tracker.flush();
  emitHabitsChanged();
  return habitSnapshot(cachedState);
}

function companionRuntimeContext() {
  const context = activeBrowserContext();
  let hostname = "";
  try { hostname = new URL(context?.view?.webContents?.getURL?.() || "").hostname; } catch {}
  return {
    foreground: Boolean(mainWindow && !mainWindow.isDestroyed() && mainWindow.isVisible() && mainWindow.isFocused()),
    minimized: Boolean(mainWindow?.isMinimized?.()),
    locked: companionSystemLocked,
    sleeping: companionSystemSleeping,
    fullscreen: Boolean(mainWindow?.isFullScreen?.() || context?.htmlFullscreenActive),
    screenSharing: Boolean(context?.screenSharingActive),
    backgroundAutomation: Boolean(automationRunPromise || googleSyncMeta?.status === "syncing"),
    hostname,
  };
}

function companionPageWidgetSnapshot(runtime = companionRuntimeService?.snapshot(), options = {}) {
  return normalizeCompanionWidgetSnapshot({
    runtime: runtime || {},
    settings: cachedState?.uiSettings?.companion || {},
    weather: options.weather || weatherService?.status?.() || {},
    ai: options.ai || {},
    alertMessage: options.alertMessage || companionWidgetAlertMessage,
  });
}

async function installCompanionPageWidget(context, options = {}) {
  const contents = context?.view?.webContents;
  if (!contents || contents.isDestroyed() || !isSafeWebUrl(contents.getURL())) return false;
  try {
    return await contents.executeJavaScriptInIsolatedWorld(
      COMPANION_WIDGET_WORLD_ID,
      [{ code: companionWidgetInstallScript(companionPageWidgetSnapshot(options.runtime, options)), url: "qiye-companion://page-widget" }],
      true,
    );
  } catch {
    return false;
  }
}

async function updateCompanionPageWidget(context, runtime, options = {}) {
  const contents = context?.view?.webContents;
  if (!contents || contents.isDestroyed() || !isSafeWebUrl(contents.getURL())) return false;
  const snapshot = companionPageWidgetSnapshot(runtime, options);
  try {
    const updated = await contents.executeJavaScriptInIsolatedWorld(
      COMPANION_WIDGET_WORLD_ID,
      [{ code: companionWidgetUpdateScript(snapshot), url: "qiye-companion://page-widget-update" }],
      true,
    );
    return updated || installCompanionPageWidget(context, { ...options, runtime });
  } catch {
    return false;
  }
}

function broadcastCompanionPageWidget(runtime = companionRuntimeService?.snapshot(), options = {}) {
  for (const tab of allRuntimeTabs()) {
    if (tab.viewOwner === "none") continue;
    void updateCompanionPageWidget(tab, runtime, options);
  }
}

function emitCompanionRuntime(snapshot = companionRuntimeService?.snapshot()) {
  if (!snapshot || !mainWindow || mainWindow.isDestroyed()) return snapshot;
  mainWindow.webContents.send("companion:runtime", snapshot);
  broadcastCompanionPageWidget(snapshot);
  const reminderKey = snapshot.reminder ? `${snapshot.reminder.kind}:${snapshot.reminder.dueAt}` : "";
  if (reminderKey && reminderKey !== lastCompanionNotificationKey && desktopNotificationService) {
    lastCompanionNotificationKey = reminderKey;
    desktopNotificationService.showCompanion(snapshot.reminder, { sound: cachedState?.taskSettings?.notificationSound !== false });
  }
  return snapshot;
}

async function initializeCompanionRuntime() {
  if (companionRuntimeService) return companionRuntimeService;
  const state = await getState();
  companionRuntimeService = new CompanionRuntimeService({
    settings: state.uiSettings?.companion,
    runtime: state.companionRuntimeState,
    getIdleSeconds: () => powerMonitor.getSystemIdleTime(),
    getContext: companionRuntimeContext,
    onSnapshot: (snapshot) => emitCompanionRuntime(snapshot),
  });
  for (const hostname of state.companionRuntimeState?.aiAllowedHosts || []) companionSensitiveSiteApprovals.add(hostname);
  companionRuntimeService.start();
  powerMonitor.on("lock-screen", () => {
    companionSystemLocked = true;
    companionRuntimeService?.tick();
  });
  powerMonitor.on("unlock-screen", () => {
    companionSystemLocked = false;
    companionRuntimeService?.tick();
  });
  powerMonitor.on("suspend", () => {
    companionSystemSleeping = true;
    companionRuntimeService?.tick();
    weatherService?.setSleeping(true);
  });
  powerMonitor.on("resume", () => {
    companionSystemSleeping = false;
    companionRuntimeService?.tick();
    weatherService?.setSleeping(false);
  });
  return companionRuntimeService;
}

async function persistCompanionRuntimeState() {
  if (!companionRuntimeService) return;
  const state = await getState();
  await commitStateCandidate({ ...state, companionRuntimeState: normalizeCompanionRuntimeState({ ...companionRuntimeService.runtimeState(), aiAllowedHosts: Array.from(companionSensitiveSiteApprovals) }) });
}

async function performCompanionRuntimeAction(action, input = {}) {
  if (action === "toggle") {
    const state = await getState();
    const companion = normalizeCompanionSettings({
      ...(state.uiSettings?.companion || {}),
      enabled: state.uiSettings?.companion?.enabled !== true,
    });
    const result = updateUiSettingsInState(state, { companion }, { defaultSites: DEFAULT_SITES });
    await commitStateCandidate(result.state);
    const service = await initializeCompanionRuntime();
    const snapshot = service.updateSettings(companion);
    return emitCompanionRuntime(snapshot);
  }
  const service = await initializeCompanionRuntime();
  const snapshot = service.action(action, input);
  if (["pause", "resume", "dismiss-today", "snooze", "ack-water", "acknowledge"].includes(action)) {
    await persistCompanionRuntimeState();
  }
  return emitCompanionRuntime(snapshot);
}

function emitWeatherStatus(status = weatherService?.status()) {
  if (status && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("companion:weather", status);
  if (status) broadcastCompanionPageWidget(companionRuntimeService?.snapshot(), { weather: status });
  return status;
}

async function initializeWeatherService() {
  if (weatherService) return weatherService;
  const state = await getState();
  weatherService = new WeatherService({
    fetchFn: (...args) => net.fetch(...args),
    settings: state.uiSettings?.companion?.weather,
    onUpdate: emitWeatherStatus,
    onAlert: (event) => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.webContents.send("companion:weather-alert", event);
      clearTimeout(companionWidgetAlertTimer);
      companionWidgetAlertMessage = event?.message || "天气发生变化";
      broadcastCompanionPageWidget(companionRuntimeService?.snapshot(), { alertMessage: companionWidgetAlertMessage });
      companionWidgetAlertTimer = setTimeout(() => {
        companionWidgetAlertTimer = null;
        companionWidgetAlertMessage = "";
        broadcastCompanionPageWidget(companionRuntimeService?.snapshot());
      }, 12_000);
      companionWidgetAlertTimer.unref?.();
    },
  });
  weatherService.schedule();
  return weatherService;
}

function getCompanionAIServices() {
  if (!companionAIService) companionAIService = new CompanionAIService({ translationService: getTranslationServices().service });
  if (!companionPageSummaryExtractor) companionPageSummaryExtractor = new CompanionPageSummaryExtractor();
  return { ai: companionAIService, extractor: companionPageSummaryExtractor };
}

async function confirmCompanionSensitivePage(classification) {
  if (!classification.sensitive || companionSensitiveSiteApprovals.has(classification.hostname)) return true;
  const result = await dialog.showMessageBox(mainWindow, {
    type: "warning",
    title: "确认发送当前页可见文字",
    message: `当前页面属于敏感站点：${classification.hostname}`,
    detail: "只有你主动点击总结后，栖页才会提取当前页有限的可见文字并发送到已配置的 DeepSeek。输入框、密码、隐藏内容、Cookie 和 Token 不会读取。",
    buttons: ["仅本次允许", "始终允许此站点", "取消"],
    defaultId: 2,
    cancelId: 2,
    noLink: true,
  });
  if (result.response === 1) {
    companionSensitiveSiteApprovals.add(classification.hostname);
    void persistCompanionRuntimeState().catch(() => undefined);
  }
  return result.response === 0 || result.response === 1;
}

function publicCompanionAIError(error) {
  const code = {
    NOT_CONFIGURED: "AI_NOT_CONFIGURED",
    AUTH_REQUIRED: "AI_AUTH_FAILED",
    NETWORK_ERROR: "AI_NETWORK_ERROR",
    REQUEST_TIMEOUT: "AI_TIMEOUT",
    RATE_LIMITED: "AI_RATE_LIMITED",
    INVALID_RESPONSE: "AI_INVALID_RESPONSE",
    CANCELLED: "CANCELLED",
  }[error?.code] || "AI_INVALID_RESPONSE";
  return { code, message: String(error?.message || "小序请求失败").replace(/(?:Bearer|Basic)\s+\S+/gi, "$1 [REDACTED]").slice(0, 300) };
}

async function clearUsageTracking() {
  const tracker = await initializeUsageRuntime();
  tracker.clear();
  await tracker.flush();
  return habitSnapshot(cachedState);
}

function emitContentTagsChanged() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("content-tags:changed", contentTagSnapshot(cachedState));
}

function mutateContentTagState(mutator) {
  const operation = contentTagMutationQueue
    .catch(() => undefined)
    .then(async () => {
      const state = await getState();
      const result = mutator(state);
      await commitStateCandidate(result.state);
      emitContentTagsChanged();
      const { state: _privateState, record, ...details } = result;
      const publicRecord = record ? {
        id: record.id,
        sourceTagIds: record.sourceTagIds,
        targetTagId: record.targetTagId,
        affectedReferenceCount: record.affectedReferenceCount,
        affectedObjectCount: record.affectedObjectCount,
        affectedByType: record.affectedByType,
        createdAt: record.createdAt,
        undoneAt: record.undoneAt,
      } : null;
      return {
        ...details,
        ...(publicRecord ? { record: publicRecord } : {}),
        ...contentTagSnapshot(cachedState),
      };
    });
  contentTagMutationQueue = operation.catch(() => undefined);
  return operation;
}

function mergeContentTagsOperation(payload) {
  return mutateContentTagState((state) => mergeContentTags(state, payload));
}

function undoLastContentTagMergeOperation() {
  return mutateContentTagState((state) => undoLastContentTagMerge(state));
}

function emitTasksChanged(focusTaskId = null) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.webContents.send("tasks:changed", {
    ...taskSnapshot(),
    focusTaskId,
  });
}

async function mutateTaskState(mutator) {
  const state = await getState();
  const result = mutator(state);
  cachedState = result.state;
  await persistState();
  emitTasksChanged(result.task?.id || null);
  if (taskReminderScheduler) await taskReminderScheduler.reschedule();
  return { ...result, ...taskSnapshot(cachedState) };
}

async function markTaskCompleted(taskId) {
  const state = await getState();
  const task = state.localTasks.find((item) => item.id === String(taskId || ""));
  if (!task) return null;
  return mutateTaskState((current) => updateTaskInState(current, { id: task.id, status: "done" }));
}

function timelineReviewSnapshot(review) {
  return {
    year: review.year,
    stats: review.stats,
    text: review.text,
    months: review.months.map((month) => ({
      month: month.month,
      count: month.events.length,
      titles: month.events.map((event) => event.title),
    })),
  };
}

function timelineSnapshot(state = cachedState, requestedYear = null, requestedTrackId = null) {
  const settings = state?.timelineUiSettings || {};
  const trackId = ["work", "personal"].includes(requestedTrackId)
    ? requestedTrackId
    : ["work", "personal"].includes(settings.selectedTrackId)
      ? settings.selectedTrackId
      : settings.lastTrackId === "work" ? "work" : "personal";
  const trackView = settings.trackViews?.[trackId] || {};
  const parsedYear = Number(requestedYear);
  const year = Number.isInteger(parsedYear) && parsedYear >= 1 && parsedYear <= 9999
    ? parsedYear
    : Number(trackView.selectedYear || settings.selectedYear) || new Date().getFullYear();
  const tracks = Array.isArray(state?.timelineTracks) ? state.timelineTracks : [];
  const events = timelineEventsForYear(state?.timelineEvents, year, { trackIds: [trackId] });
  return {
    year,
    trackId,
    tracks,
    events,
    settings,
    review: timelineReviewSnapshot(buildAnnualReview(year, tracks, events)),
  };
}

function emitTimelineChanged(focusEventId = null) {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const event = cachedState?.timelineEvents?.find((item) => item.id === focusEventId);
  const year = event ? Number(String(event.startDate).slice(0, 4)) : null;
  mainWindow.webContents.send("timeline:changed", {
    ...timelineSnapshot(cachedState, year, event?.trackId),
    focusEventId,
  });
}

async function mutateTimelineState(mutator) {
  const state = await getState();
  const result = mutator(state);
  cachedState = result.state;
  await persistState();
  if (result.event) timelineSearchIndex.upsert(result.event);
  emitTimelineChanged(result.event?.deletedAt ? null : result.event?.id || null);
  const year = result.event ? Number(String(result.event.startDate).slice(0, 4)) : null;
  return { event: result.event, ...timelineSnapshot(cachedState, year, result.event?.trackId) };
}

async function ensureTimelineSearchIndex() {
  if (!timelineSearchIndexReady) {
    const state = await getState();
    timelineSearchIndex.replace(state.timelineEvents);
    timelineSearchIndexReady = true;
  }
  return timelineSearchIndex;
}

function localDateValue(date = new Date()) {
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function extractSapNoteId(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    const hostname = parsed.hostname.toLowerCase();
    if (![
      "support.sap.com",
      "me.sap.com",
      "launchpad.support.sap.com",
    ].includes(hostname)) return null;
    const candidates = [
      parsed.searchParams.get("note"),
      parsed.searchParams.get("noteId"),
      parsed.pathname.match(/(?:^|\/)notes?\/(\d{6,10})(?=\/|$)/i)?.[1],
      parsed.hash.match(/(?:^|[#/])notes?\/(\d{6,10})(?=\/|$)/i)?.[1],
    ];
    return candidates.map((value) => String(value || "").trim()).find((value) => /^\d{6,10}$/.test(value)) || null;
  } catch {
    return null;
  }
}

async function currentPageTimelineDraft() {
  const context = activeBrowserContext();
  if (!context?.view || context.view.webContents.isDestroyed()) {
    throw new Error("当前没有可记录的网页");
  }
  const adapter = new PageContextAdapter({
    getWebContents: () => context.view?.webContents,
  });
  const page = await adapter.getCurrentContext({ includeSelection: true });
  const state = await getState();
  const workspaceId = context.workspaceId || state.activeWorkspaceId;
  const trackId = workspaceId === "work"
    ? "work"
    : workspaceId === "personal"
      ? "personal"
      : state.timelineUiSettings?.lastTrackId || "personal";
  const reliable = context.reliableContext && typeof context.reliableContext === "object"
    ? context.reliableContext
    : null;
  const zohoTicketId = reliable?.system === "zoho-desk" && reliable?.objectType === "ticket"
    ? String(reliable.objectId || "")
    : extractZohoDeskTicketId(page.url);
  const sapNoteId = extractSapNoteId(page.url);
  const sourceId = /^\d{6,30}$/.test(zohoTicketId || "")
    ? `zoho-ticket:${zohoTicketId}`
    : sapNoteId
      ? `sap-note:${sapNoteId}`
      : null;
  return {
    trackId,
    workspaceId,
    type: "other",
    title: page.title || page.hostname || "网页记录",
    summary: String(page.selectedText || "").slice(0, 1000),
    evidence: sourceId ? `可靠页面标识：${sourceId}` : "",
    startDate: localDateValue(),
    endDate: null,
    datePrecision: "day",
    ongoing: false,
    importance: "normal",
    tags: [],
    relatedTaskIds: [],
    sourceType: "webpage",
    sourceId,
    sourceTitle: page.title || null,
    sourceUrl: sanitizeTimelineSourceUrl(page.url),
    sourceHostname: page.hostname,
    iconKey: "globe",
    accentKey: trackId,
  };
}

async function exportTimelineYear(payload = {}) {
  const state = await getState();
  const trackId = payload.trackId === "work" ? "work" : "personal";
  const trackView = state.timelineUiSettings.trackViews?.[trackId] || {};
  const year = Number(payload.year) || trackView.selectedYear || state.timelineUiSettings.selectedYear || new Date().getFullYear();
  const format = ["json", "markdown", "svg"].includes(payload.format) ? payload.format : "markdown";
  const tracks = state.timelineTracks;
  const events = timelineEventsForYear(state.timelineEvents, year, { trackIds: [trackId] });
  const exportedAt = new Date().toISOString();
  const options = {
    tracks,
    events,
    year,
    trackId,
    month: Number(payload.month) || null,
    scope: payload.scope === "month" ? "month" : "year",
    exportedAt,
    appVersion: app.getVersion(),
    schemaVersion: state.version,
  };
  const content = format === "json"
    ? `${JSON.stringify(buildTimelineJsonExport({
      ...options,
    }), null, 2)}\n`
    : format === "svg"
      ? buildTimelineSvgExport(options)
      : buildTimelineMarkdown(options);
  const extension = format === "json" ? "json" : format === "svg" ? "svg" : "md";
  const trackName = trackId === "work" ? "工作" : "个人";
  const result = await dialog.showSaveDialog(mainWindow, {
    title: `导出 ${year} 年${trackName}时间轴`,
    defaultPath: path.join(app.getPath("documents"), `栖页-${year}-${trackName}时间轴.${extension}`),
    filters: format === "json"
      ? [{ name: "JSON", extensions: ["json"] }]
      : format === "svg"
        ? [{ name: "SVG", extensions: ["svg"] }]
        : [{ name: "Markdown", extensions: ["md"] }],
  });
  if (result.canceled || !result.filePath) return { canceled: true, format, year };
  await fsp.writeFile(result.filePath, content, "utf8");
  return { canceled: false, format, year, filePath: result.filePath };
}

async function snoozeTaskReminder(reminderId, minutes) {
  const duration = Math.max(5, Math.min(1440, Number(minutes) || 10));
  const result = await mutateTaskState((state) => updateReminderInState(state, reminderId, {
    state: "snoozed",
    snoozedUntil: new Date(Date.now() + duration * 60_000).toISOString(),
    firedAt: null,
  }));
  return result.reminder;
}

async function openMainWindowForTask(taskId = null, view = "week") {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("tasks:open", { taskId, view });
}

async function openMainWindowForHabit(habitId, localDate = localDateFromInstant(new Date())) {
  if (!mainWindow || mainWindow.isDestroyed()) createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  mainWindow.webContents.send("habits:open", { habitId, localDate });
}

async function snoozeHabitReminder(reminderId, minutes = 10) {
  const duration = Math.max(5, Math.min(1440, Number(minutes) || 10));
  const operation = habitMutationQueue.catch(() => undefined).then(async () => {
    const state = await getState();
    const result = updateHabitReminderInState(state, reminderId, {
      state: "snoozed",
      snoozedUntil: new Date(Date.now() + duration * 60_000).toISOString(),
      firedAt: null,
    });
    await commitStateCandidate(result.state);
    return result.reminder;
  });
  habitMutationQueue = operation.catch(() => undefined);
  return operation;
}

function checkInHabitFromNotification(habitId, localDate, state) {
  return mutateHabitState((current) => upsertHabitCheckInInState(current, {
    habitId,
    localDate,
    state,
    note: state === "skipped" ? "通过本地提醒标记今日跳过" : "通过本地提醒完成",
  }));
}

async function fireHabitReminder(reminderId) {
  const state = await getState();
  const prepared = buildHabitReminders(
    state.habits,
    state.habitCheckIns,
    state.habitReminders,
  );
  let reminder = prepared.find((item) => item.id === String(reminderId || ""));
  if (!reminder || !["pending", "snoozed"].includes(reminder.state)) return false;
  const habit = state.habits.find((item) => item.id === reminder.habitId && !item.deletedAt);
  if (!habit || habit.status !== "active" || !state.taskSettings.remindersEnabled) return false;
  const now = new Date();
  const pausedUntil = Date.parse(state.taskSettings.pausedUntil || 0);
  const dndUntil = nextDoNotDisturbEnd(state.taskSettings, now);
  const deferUntil = Number.isFinite(pausedUntil) && pausedUntil > now.valueOf()
    ? new Date(pausedUntil).toISOString()
    : dndUntil;
  const candidate = { ...state, habitReminders: prepared };
  const changed = updateHabitReminderInState(candidate, reminder.id, deferUntil
    ? { state: "snoozed", snoozedUntil: deferUntil }
    : { state: "fired", firedAt: now.toISOString(), snoozedUntil: null });
  await commitStateCandidate(changed.state);
  reminder = changed.reminder;
  if (deferUntil) return false;
  const result = desktopNotificationService?.showHabit(habit, reminder, {
    sound: state.taskSettings.notificationSound,
  });
  if (!result?.supported) emitHabitsChanged(habit.id);
  return true;
}

async function pendingReminders() {
  const state = await getState();
  if (!state.taskSettings.remindersEnabled) return [];
  const openTaskIds = new Set(state.localTasks
    .filter((task) => !["done", "cancelled"].includes(task.status))
    .map((task) => task.id));
  const taskReminders = state.taskReminders.filter((reminder) => (
    ["pending", "snoozed"].includes(reminder.state) && openTaskIds.has(reminder.taskId)
  ));
  const habitReminders = buildHabitReminders(
    state.habits,
    state.habitCheckIns,
    state.habitReminders,
  );
  if (JSON.stringify(habitReminders) !== JSON.stringify(state.habitReminders || [])) {
    await commitStateCandidate({ ...state, habitReminders });
  }
  return [
    ...taskReminders.map((reminder) => ({ ...reminder, kind: "task" })),
    ...habitReminders.filter((reminder) => ["pending", "snoozed"].includes(reminder.state)),
  ];
}

function fireScheduledReminder(reminderId) {
  return String(reminderId || "").startsWith("habit-reminder:")
    ? fireHabitReminder(reminderId)
    : fireTaskReminder(reminderId);
}

async function fireTaskReminder(reminderId) {
  const state = await getState();
  const reminder = state.taskReminders.find((item) => item.id === String(reminderId || ""));
  if (!reminder || !["pending", "snoozed"].includes(reminder.state)) return false;
  const task = state.localTasks.find((item) => item.id === reminder.taskId);
  if (!task || ["done", "cancelled"].includes(task.status)) return false;
  const settings = state.taskSettings;
  if (!settings.remindersEnabled) return false;
  const now = new Date();
  const pausedUntil = Date.parse(settings.pausedUntil || 0);
  const dndUntil = nextDoNotDisturbEnd(settings, now);
  const deferUntil = Number.isFinite(pausedUntil) && pausedUntil > now.valueOf()
    ? new Date(pausedUntil).toISOString()
    : dndUntil;
  if (deferUntil) {
    cachedState = updateReminderInState(state, reminder.id, {
      state: "snoozed",
      snoozedUntil: deferUntil,
    }).state;
    await persistState();
    return false;
  }
  cachedState = updateReminderInState(state, reminder.id, {
    state: "fired",
    firedAt: now.toISOString(),
    snoozedUntil: null,
  }).state;
  await persistState();
  const latestReminder = cachedState.taskReminders.find((item) => item.id === reminder.id);
  const result = desktopNotificationService?.show(task, latestReminder, {
    sound: settings.notificationSound,
  });
  if (!result?.supported) emitTasksChanged(task.id);
  return true;
}

function taskRuntime() {
  if (taskReminderScheduler) return { scheduler: taskReminderScheduler, notifications: desktopNotificationService, tray: trayService };
  appBackgroundService = new AppBackgroundService({ app });
  desktopNotificationService = new DesktopNotificationService({
    Notification,
    icon: path.join(PROJECT_ROOT, "assets", "app-icon.png"),
    onOpenTask: (taskId) => void openMainWindowForTask(taskId),
    onComplete: (taskId) => void markTaskCompleted(taskId),
    onSnooze: (reminderId, minutes) => void snoozeTaskReminder(reminderId, minutes),
    onOpenHabit: (habitId, localDate) => void openMainWindowForHabit(habitId, localDate),
    onCompleteHabit: (habitId, localDate) => void checkInHabitFromNotification(habitId, localDate, "completed"),
    onSnoozeHabit: (reminderId, minutes) => void snoozeHabitReminder(reminderId, minutes),
    onSkipHabit: (habitId, localDate) => void checkInHabitFromNotification(habitId, localDate, "skipped"),
    onCompanionOpen: () => {
      void openMainWindowForTask();
      mainWindow?.webContents.send("app:command", { action: "companion.open" });
    },
    onCompanionAcknowledge: (kind) => void performCompanionRuntimeAction(kind === "water" ? "ack-water" : "acknowledge"),
    onCompanionSnooze: (_kind, minutes) => void performCompanionRuntimeAction("snooze", { minutes }),
    onCompanionDismissToday: () => void performCompanionRuntimeAction("dismiss-today"),
  });
  trayService = new TrayService({
    Tray,
    Menu,
    icon: path.join(PROJECT_ROOT, "assets", "app-icon.png"),
    onOpen: () => void openMainWindowForTask(),
    onToday: () => void openMainWindowForTask(null, "week"),
    onAdd: () => void openMainWindowForTask("new", "week"),
    onPause: async (pause) => {
      const state = await getState();
      const result = updateTaskSettingsInState(state, {
        pausedUntil: pause ? new Date(Date.now() + 60 * 60_000).toISOString() : null,
      });
      cachedState = result.state;
      await persistState();
      await refreshTaskRuntimeSettings();
      emitTasksChanged();
    },
    onQuit: () => {
      isQuitting = true;
      app.quit();
    },
  });
  taskReminderScheduler = new TaskReminderScheduler({
    listPending: pendingReminders,
    fireReminder: fireScheduledReminder,
  });
  return { scheduler: taskReminderScheduler, notifications: desktopNotificationService, tray: trayService };
}

async function refreshTaskRuntimeSettings() {
  const state = await getState();
  const settings = state.taskSettings;
  const runtime = taskRuntime();
  appBackgroundService.applyLoginSettings(settings);
  if (settings.trayOnClose || settings.startMinimized) {
    const paused = Date.parse(settings.pausedUntil || 0) > Date.now();
    runtime.tray.ensure({ paused });
  } else {
    runtime.tray.destroy();
  }
  if (settings.remindersEnabled) await runtime.scheduler.start();
  else runtime.scheduler.stop();
  return taskSnapshot(state);
}

async function initializeTaskRuntime() {
  taskRuntime();
  await refreshTaskRuntimeSettings();
  powerMonitor.on("resume", () => void taskReminderScheduler?.reschedule());
}

function publicUserScript(script, state = cachedState) {
  return {
    id: script.id,
    name: script.name,
    namespace: script.namespace,
    version: script.version,
    description: script.description,
    author: script.author,
    sourceType: script.sourceType,
    sourceUrl: script.sourceUrl,
    updateUrl: script.updateUrl,
    downloadUrl: script.downloadUrl,
    sourceHash: script.sourceHash,
    sourceBytes: Buffer.byteLength(script.sourceCode || "", "utf8"),
    enabled: script.enabled,
    autoUpdate: false,
    matches: script.matches,
    includes: script.includes,
    excludes: script.excludes,
    runAt: script.runAt,
    grants: script.grants,
    connects: script.connects,
    workspaceIds: script.workspaceIds,
    browserProfileIds: script.browserProfileIds,
    tagIds: Array.isArray(script.tagIds) ? script.tagIds : [],
    createdAt: script.createdAt,
    updatedAt: script.updatedAt,
    lastCheckedAt: script.lastCheckedAt,
    lastRunAt: script.lastRunAt,
    errorCount: script.errorCount,
    disabledReason: script.disabledReason,
    deletedAt: script.deletedAt,
    runtimeStats: script.runtimeStats,
    compatibility: script.compatibility,
    approvedSites: (state?.userScriptPermissions || [])
      .filter((item) => item.scriptId === script.id && item.permission === "site")
      .map((item) => item.value),
    sensitiveApprovedSites: (state?.userScriptPermissions || [])
      .filter((item) => item.scriptId === script.id && item.permission === "sensitive-site")
      .map((item) => item.value),
    localhostApprovedHosts: (state?.userScriptPermissions || [])
      .filter((item) => item.scriptId === script.id && item.permission === "localhost-connect")
      .map((item) => item.value),
  };
}

function userScriptSnapshot(state = cachedState) {
  const scripts = Array.isArray(state?.userScripts) ? state.userScripts : [];
  return {
    scripts: scripts.map((script) => publicUserScript(script, state)),
    executions: (state?.userScriptExecutions || []).slice(-100).reverse(),
    versions: (state?.userScriptVersions || []).map((item) => ({
      scriptId: item.scriptId,
      version: item.version,
      sourceHash: item.sourceHash,
      createdAt: item.createdAt,
    })),
  };
}

async function commitUserScriptState(mutator) {
  const state = await getState();
  const next = await mutator(state);
  cachedState = next;
  await persistState();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
  }
  return { ok: true };
}

function getUserScriptServices() {
  if (userScriptEngine && userScriptSourceService) {
    return { engine: userScriptEngine, sources: userScriptSourceService };
  }
  userScriptSourceService = new UserScriptSourceService({ fetchFn: (...args) => net.fetch(...args) });
  userScriptEngine = new UserScriptEngine({
    getState,
    updateState: commitUserScriptState,
    recordExecution: async (execution) => {
      const state = await getState();
      const result = appendUserScriptExecution(state, execution);
      cachedState = result.state;
      scheduleUserScriptMetricsPersist();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("userscripts:execution", execution);
        mainWindow.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
        if (result.autoDisabled) {
          mainWindow.webContents.send("userscripts:auto-disabled", {
            scriptId: result.script.id,
            name: result.script.name,
            message: result.script.disabledReason,
          });
        }
      }
      if (result.autoDisabled && Notification.isSupported()) {
        const notification = new Notification({
          title: "网页脚本已自动暂停",
          body: `${result.script.name}：${result.script.disabledReason}`.slice(0, 500),
          icon: path.join(PROJECT_ROOT, "assets", "app-icon.png"),
        });
        notification.on("click", () => void openMainWindowForTask());
        notification.show();
      }
    },
    openTab: async (runtime, payload) => {
      if (!isSafeWebUrl(payload?.url)) throw new Error("脚本请求打开的网址无效");
      await openTransientBrowserTab(runtime.workspaceId, payload.url, {
        background: payload.active === false,
        browserProfileId: runtime.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
      });
      return {
        opened: true,
        workspaceId: runtime.workspaceId,
        browserProfileId: runtime.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
        partition: browserPartitionForProfile(runtime.browserProfileId || DEFAULT_BROWSER_PROFILE_ID),
      };
    },
    showNotification: async (runtime, payload) => {
      const title = String(payload?.title || runtime.scriptName || "网页脚本").slice(0, 120);
      const body = String(payload?.text || "").slice(0, 500);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("userscripts:notification", {
          scriptId: runtime.scriptId,
          title,
          body,
        });
      }
      if (!Notification.isSupported()) return { supported: false, deliveredInApp: true };
      const notification = new Notification({
        title,
        body,
        icon: path.join(PROJECT_ROOT, "assets", "app-icon.png"),
      });
      notification.on("click", () => void openMainWindowForTask());
      notification.show();
      return { supported: true, deliveredInApp: true };
    },
    setClipboard: async (_runtime, payload) => {
      const text = String(payload?.text || "").slice(0, 1_048_576);
      const type = String(payload?.type || "text/plain").toLowerCase();
      if (type === "html" || type === "text/html") clipboard.write({ html: text, text });
      else clipboard.writeText(text);
      return { ok: true, type };
    },
    fetchFn: (...args) => net.fetch(...args),
    onCommandsChanged: () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("userscripts:commands-changed");
      }
    },
  });
  return { engine: userScriptEngine, sources: userScriptSourceService };
}

function activeUserScriptContext() {
  const context = activeBrowserContext();
  if (!context?.view || context.view.webContents.isDestroyed()) return null;
  return context;
}

async function runUserScriptsForContext(context, runAt) {
  if (!context?.view || context.view.webContents.isDestroyed()) return [];
  return getUserScriptServices().engine.runAt(context.view.webContents, {
    tabId: context.tabId,
    workspaceId: context.workspaceId,
    browserProfileId: context.browserProfileId,
    persistentPartition: browserPartitionForProfile(context.browserProfileId),
  }, runAt);
}

async function maybeOfferUserScriptInstall(context, rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return; }
  if (url.protocol !== "https:" || !/\.user\.js$/i.test(url.pathname)) return;
  if (context.lastOfferedUserScriptUrl === url.toString()) return;
  context.lastOfferedUserScriptUrl = url.toString();
  try {
    const state = await getState();
    const existing = state.userScripts.find((script) =>
      !script.deletedAt && [script.sourceUrl, script.updateUrl, script.downloadUrl].includes(url.toString()));
    const review = await getUserScriptServices().sources.review({
      sourceType: "remoteUrl",
      sourceUrl: url.toString(),
      workspaceIds: [context.workspaceId],
      browserProfileIds: [context.browserProfileId],
    }, {
      updateOf: existing?.id || null,
      previousHash: existing?.sourceHash || null,
      previousSourceCode: existing?.sourceCode,
      previousScript: existing,
    });
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("userscripts:review-ready", review);
    }
  } catch (error) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("browser:notice", {
        title: "无法检查用户脚本",
        message: String(error?.message || "远程脚本读取失败").slice(0, 300),
        tone: "error",
      });
    }
  }
}

function registerIpc() {
  ipcMain.handle("ui-actions:list", async () => uiActionRegistry.snapshot({}));
  ipcMain.handle("ui-actions:audit", async () => createUIActionAuditReport());
  ipcMain.handle("shortcuts:get", async (_event, platform) =>
    shortcutRegistry.snapshot(await getState(), platform));
  ipcMain.handle("shortcuts:update", async (_event, input) => {
    const result = shortcutRegistry.updateState(await getState(), input);
    if (result.requiresResolution) {
      return {
        ...shortcutRegistry.snapshot(result.state, input?.platform),
        requiresResolution: true,
        pendingBinding: result.binding,
        conflictBindings: result.conflicts,
      };
    }
    await commitStateCandidate(result.state);
    return shortcutRegistry.snapshot(cachedState, input?.platform);
  });
  ipcMain.handle("shortcuts:reset", async (_event, options) => {
    const state = shortcutRegistry.resetState(await getState(), options);
    await commitStateCandidate(state);
    return shortcutRegistry.snapshot(cachedState, options?.platform);
  });
  ipcMain.handle("shortcuts:dispatch", async (_event, request) =>
    shortcutDispatcher.authorize(await getState(), request));
  ipcMain.handle("companion:get-runtime", async () => (await initializeCompanionRuntime()).snapshot());
  ipcMain.handle("companion:action", async (_event, payload) => {
    return performCompanionRuntimeAction(String(payload?.action || ""), payload || {});
  });
  ipcMain.on("companion:meaningful-action", () => companionRuntimeService?.recordMeaningfulAction());
  ipcMain.handle("companion:get-weather", async () => (await initializeWeatherService()).status());
  ipcMain.handle("companion:refresh-weather", async () => {
    const service = await initializeWeatherService();
    try {
      const result = await service.refresh({ force: true });
      return { ok: true, ...result, status: service.status() };
    } catch (error) {
      return { ok: false, error: { code: String(error?.code || "WEATHER_ERROR"), message: String(error?.message || "无法刷新天气").slice(0, 300) }, status: service.status() };
    }
  });
  ipcMain.handle("companion:cancel-weather", async () => { weatherService?.cancel(); return { ok: true }; });
  ipcMain.handle("companion:ai-status", async () => getCompanionAIServices().ai.status());
  ipcMain.handle("companion:page-widget-action", async (event, request) => {
    const context = runtimeTabForWebContentsId(event.sender.id);
    if (
      !context
      || context.view?.webContents !== event.sender
      || !isSafeWebUrl(event.sender.getURL())
      || (event.senderFrame && event.senderFrame !== event.sender.mainFrame)
    ) {
      return { ok: false, error: { code: "WIDGET_CONTEXT_INVALID", message: "小序悬浮组件上下文无效" } };
    }
    const action = String(request?.action || "");
    try {
      const runtime = (await initializeCompanionRuntime()).snapshot();
      if (action === "status") {
        const ai = await getCompanionAIServices().ai.status();
        return { ok: true, value: companionPageWidgetSnapshot(runtime, { ai }) };
      }
      if (action === "weather.refresh") {
        const service = await initializeWeatherService();
        await service.refresh({ force: true });
        const ai = await getCompanionAIServices().ai.status();
        return { ok: true, value: companionPageWidgetSnapshot(runtime, { weather: service.status(), ai }) };
      }
      if (action === "ask") {
        const question = String(request?.payload?.question || "").trim().slice(0, 4_000);
        if (!question) return { ok: false, error: { code: "INVALID_INPUT", message: "请输入想问小序的问题" } };
        const requestId = `page-widget-${event.sender.id}-${Date.now()}`;
        const value = await getCompanionAIServices().ai.run(requestId, "ask", { question });
        return { ok: true, value };
      }
      return { ok: false, error: { code: "WIDGET_ACTION_UNSUPPORTED", message: "当前小序操作尚未开放" } };
    } catch (error) {
      if (action === "weather.refresh") {
        return { ok: false, error: { code: String(error?.code || "WEATHER_ERROR"), message: String(error?.message || "天气刷新失败").slice(0, 300) } };
      }
      return { ok: false, error: publicCompanionAIError(error) };
    }
  });
  ipcMain.handle("companion:ask", async (_event, payload) => {
    try {
      return { ok: true, value: await getCompanionAIServices().ai.run(payload?.requestId, "ask", { question: payload?.question }) };
    } catch (error) { return { ok: false, error: publicCompanionAIError(error) }; }
  });
  ipcMain.handle("companion:summarize-page", async (_event, payload) => {
    const context = activeBrowserContext();
    const contents = context?.view?.webContents;
    if (!contents || contents.isDestroyed()) return { ok: false, error: { code: "PAGE_CONTEXT_UNAVAILABLE", message: "当前没有可总结的网页" } };
    const classification = classifyPageForAI(contents.getURL());
    if (!classification.allowed) return { ok: false, error: { code: "PAGE_SUMMARY_NOT_ALLOWED", message: "登录、授权、支付或密码页面不能发送给 DeepSeek" } };
    if (!await confirmCompanionSensitivePage(classification)) return { ok: false, error: { code: "USER_CANCELLED", message: "已取消网页总结" } };
    try {
      const extracted = await getCompanionAIServices().extractor.extract(contents, { maxCharacters: 15_000 });
      const value = await getCompanionAIServices().ai.run(payload?.requestId, "summarize", { page: { ...extracted, url: classification.safeUrl } });
      return { ok: true, value, meta: { characterCount: extracted.characterCount, truncated: extracted.truncated, sensitive: classification.sensitive } };
    } catch (error) { return { ok: false, error: publicCompanionAIError(error) }; }
  });
  ipcMain.handle("companion:explain-selection", async () => {
    const context = activeBrowserContext();
    if (!context?.view || context.view.webContents.isDestroyed()) return { ok: false, error: { code: "DATA_UNAVAILABLE", message: "当前没有可解释的网页选区" } };
    const shown = await getTranslationServices().selection.queryCurrentSelection(context.view.webContents, context);
    return shown ? { ok: true } : { ok: false, error: { code: "SELECTION_UNAVAILABLE", message: "请先在网页中选择文字" } };
  });
  ipcMain.handle("companion:cancel-ai", async (_event, requestId) => ({ ok: true, cancelled: getCompanionAIServices().ai.cancel(requestId) }));
  ipcMain.handle("state:get", async () => {
    const state = await getState();
    return {
      ...state,
      timelineEvents: [],
      habits: [],
      habitCheckIns: [],
      habitReminders: [],
      rewardLedger: [],
      usageDayAggregates: [],
      contentTagMergeRecords: [],
    };
  });
  ipcMain.handle("settings:update-ui", async (_event, patch) => {
    const state = await getState();
    const result = updateUiSettingsInState(state, patch, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    await persistState();
    if (Object.hasOwn(patch || {}, "browserMemory")) {
      await getWebViewLifecycleManager().updateSettings(result.uiSettings.browserMemory);
    }
    if (Object.hasOwn(patch || {}, "companion")) {
      const settings = normalizeCompanionSettings(result.uiSettings.companion);
      companionRuntimeService?.updateSettings(settings);
      weatherService?.updateSettings(settings.weather);
      broadcastCompanionPageWidget(companionRuntimeService?.snapshot());
    }
    return { state: cachedState, uiSettings: result.uiSettings };
  });
  ipcMain.handle("search:get-state", async () => {
    const state = await getState();
    return globalSearchService.snapshot(state.uiSettings?.search, state.searchHistory);
  });
  ipcMain.handle("search:resolve-input", async (_event, payload) => {
    const state = await getState();
    return resolveSearchInput(payload?.input, payload?.engineId, state);
  });
  ipcMain.handle("search:update-settings", async (_event, patch) => {
    const state = await getState();
    const search = normalizeSearchSettings({
      ...state.uiSettings?.search,
      ...(patch && typeof patch === "object" ? patch : {}),
    }, globalSearchService.registry);
    const result = updateUiSettingsInState(state, { search }, {
      defaultSites: DEFAULT_SITES,
    });
    result.state.searchHistory = normalizeSearchHistory(result.state.searchHistory, search);
    cachedState = result.state;
    await persistState();
    return globalSearchService.snapshot(search, cachedState.searchHistory);
  });
  ipcMain.handle("search:remove-history", async (_event, historyId) => {
    const state = await getState();
    const settings = currentSearchSettings(state);
    state.searchHistory = normalizeSearchHistory(state.searchHistory, settings)
      .filter((item) => item.id !== String(historyId || ""));
    state.updatedAt = new Date().toISOString();
    cachedState = state;
    await persistState();
    await appendGoogleTombstones("searchHistory", historyId);
    return globalSearchService.snapshot(settings, state.searchHistory);
  });
  ipcMain.handle("search:clear-history", async () => {
    const state = await getState();
    const removedIds = state.searchHistory.map((item) => item.id);
    state.searchHistory = [];
    state.updatedAt = new Date().toISOString();
    cachedState = state;
    await persistState();
    await appendGoogleTombstones("searchHistory", removedIds);
    return globalSearchService.snapshot(currentSearchSettings(state), []);
  });
  ipcMain.handle("workspace:set-active", async (_event, workspaceId) => {
    const state = await getState();
    const result = setActiveWorkspaceInState(state, String(workspaceId || ""), {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    await persistState();
    const browserState = await activateWorkspaceBrowserContext(
      result.workspace.id,
    );
    return { state: cachedState, workspace: result.workspace, browserState };
  });
  ipcMain.handle("sites:add", async (_event, input) => {
    const state = await getState();
    const result = addSiteToState(state, input, { defaultSites: DEFAULT_SITES });
    cachedState = result.state;
    if (result.existed) {
      return { state: cachedState, site: result.site, existed: true };
    }
    await persistState();
    return { state: cachedState, site: result.site, existed: false };
  });
  ipcMain.handle("sites:update", async (_event, input) => {
    const state = await getState();
    const previous = state.sites.find(
      (site) => site.id === String(input?.id || ""),
    );
    const result = updateSiteInState(state, input, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    const previousContext = previous
      ? workspaceBrowserContexts.get(previous.workspaceId)
      : null;
    const affectedTabs = previousContext
      ? Array.from(previousContext.tabs.values()).filter(
          (tab) => tab.currentSiteId === result.site.id,
        )
      : [];
    if (previous.workspaceId !== result.site.workspaceId) {
      for (const tab of affectedTabs) {
        await closeBrowserTab({ tabId: tab.tabId });
      }
    } else if (previous.url !== result.site.url) {
      for (const tab of affectedTabs) {
        tab.currentHomeUrl = result.site.url;
        compactBrowserState({ homeURL: result.site.url }, tab);
      }
      if (previousContext) persistWorkspaceBrowserWorkspace(previousContext);
    }
    await persistState();
    return { state: cachedState, site: result.site };
  });
  ipcMain.handle("sites:delete", async (_event, siteId) => {
    const state = await getState();
    const site = state.sites.find((item) => item.id === String(siteId || ""));
    if (!site) throw new Error("找不到要删除的站点");
    if (site.source === "built-in") {
      throw new Error("内置站点不能删除，可以取消置顶");
    }
    const result = deleteSiteFromState(state, siteId, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    const context = workspaceBrowserContexts.get(site.workspaceId);
    const affectedTabs = context
      ? Array.from(context.tabs.values()).filter(
          (tab) => tab.currentSiteId === site.id,
        )
      : [];
    for (const tab of affectedTabs) {
      await closeBrowserTab({ tabId: tab.tabId });
    }
    await persistState();
    await appendGoogleTombstones("sites", site.id);
    return { state: cachedState };
  });
  ipcMain.handle("sites:reorder", async (_event, input) => {
    const state = await getState();
    const result = moveSiteInState(state, input, { defaultSites: DEFAULT_SITES });
    cachedState = result.state;
    if (result.moved) await persistState();
    return { state: cachedState, site: result.site, moved: result.moved };
  });
  ipcMain.handle("sites:toggle-pin", async (_event, siteId) => {
    const state = await getState();
    const result = setSitePinnedInState(state, siteId, undefined, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    await persistState();
    return { state: cachedState, site: result.site };
  });
  ipcMain.handle("sites:open", (_event, payload) =>
    openSiteById(payload?.siteId || payload, payload?.bounds),
  );
  ipcMain.handle("chrome:profiles", () => listChromeProfiles());
  ipcMain.handle("chrome:import", (_event, profileId) =>
    importChromeBookmarks(String(profileId || "")),
  );
  ipcMain.handle("chrome:clear-import", () => clearImportedChromeBookmarks());
  ipcMain.handle("google:sync-status", () => googleSyncStatus());
  ipcMain.handle("data-status:show-menu", () => showDataStatusMenu());
  ipcMain.handle("google:import-oauth-client", () => importGoogleOAuthClient());
  ipcMain.handle("google:sign-in", () => signInGoogle());
  ipcMain.handle("google:sign-out", () => signOutGoogle());
  ipcMain.handle("google:sync-now", () => syncGoogleNow());
  ipcMain.handle("google:restore", () => restoreGoogleCloudData());
  ipcMain.handle("google:test-connection", () => testGoogleDriveConnection());
  ipcMain.handle("google:resolve-conflict", (_event, strategy) =>
    resolveGoogleSyncConflict(strategy));
  ipcMain.handle("connectors:list", async () => {
    const services = getConnectorServices();
    const definitions = services.registry.list();
    const statuses = await Promise.all(
      definitions.map(async (definition) => {
        try {
          return await services.connections.getStatus(definition.id);
        } catch (error) {
          return {
            connectorType: definition.id,
            status: "error",
            configured: false,
            error: publicConnectorError(error),
          };
        }
      }),
    );
    return definitions.map((definition) => ({
      ...definition,
      status: statuses.find((item) => item.connectorType === definition.id) || null,
    }));
  });
  ipcMain.handle("connectors:get-status", async (_event, connectorType) => {
    try {
      return { ok: true, value: await getConnectorServices().connections.getStatus(connectorType) };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:configure", async (_event, payload) => {
    try {
      const value = await getConnectorServices().connections.configure(
        payload?.connectorType,
        payload?.publicConfig,
      );
      return { ok: true, value, state: await getState() };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:connect", async (_event, connectorType) => {
    try {
      return { ok: true, value: await getConnectorServices().connections.connect(connectorType) };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:disconnect", async (_event, connectorType) => {
    try {
      return { ok: true, value: await getConnectorServices().connections.disconnect(connectorType) };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:get-dashboard", async () => {
    try {
      return { ok: true, value: await getConnectorServices().zoho.getDashboard() };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:refresh-dashboard", async () => {
    try {
      return { ok: true, value: await refreshZohoDashboard() };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("connectors:cancel-dashboard", async () => {
    const active = Boolean(zohoDashboardAbortController && !zohoDashboardAbortController.signal.aborted);
    if (active) zohoDashboardAbortController.abort();
    return { ok: true, value: { cancelled: active } };
  });
  ipcMain.handle("connectors:get-ticket-context", async (_event, ticketId) => {
    try {
      return {
        ok: true,
        value: await getConnectorServices().zoho.getTicketContext(ticketId),
      };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("browser:open-zoho-ticket", async (_event, payload) => {
    try {
      const ticketId = String(payload?.ticketId || "");
      if (!/^\d{6,30}$/.test(ticketId)) throw new Error("无法可靠识别 Zoho 工单编号");
      const status = await getConnectorServices().zoho.getStatus();
      const base = String(status.publicConfig?.webBaseUrl || "").replace(/\/$/, "");
      if (!base) throw new Error("Zoho Desk 网页入口尚未配置");
      const url = safeZohoTicketNavigationUrl(payload?.webUrl, base, ticketId);
      await switchStoredActiveWorkspace("work");
      if (activeBrowserWorkspaceId !== "work") {
        await activateWorkspaceBrowserContext("work", { attach: false, restore: false });
      }
      const browser = await openTransientBrowserTab("work", url, {
        title: payload?.title || `Zoho #${ticketId}`,
        bounds: payload?.bounds,
        reliableContext: {
          system: "zoho-desk",
          objectType: "ticket",
          objectId: ticketId,
        },
      });
      return { ok: true, value: browser, state: await getState() };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  });
  ipcMain.handle("system:info", async () => ({
    dataDirectory: app.getPath("userData"),
    dataFile: dataFilePath(),
    chromeDetected: Boolean(chromeUserDataPath() && fs.existsSync(chromeUserDataPath())),
    platform: process.platform,
    version: app.getVersion(),
    development: !app.isPackaged,
    prodLocal: process.argv.includes("--prod-local"),
  }));
  ipcMain.handle("system:open-data-folder", async () => {
    await fsp.mkdir(app.getPath("userData"), { recursive: true });
    const result = await shell.openPath(app.getPath("userData"));
    return { ok: !result, error: result || "" };
  });
  ipcMain.handle("system:open-external", async (_event, rawUrl) => {
    const url = normalizeUrl(rawUrl);
    await shell.openExternal(url);
    return true;
  });
  ipcMain.handle("browser:show", async (_event, payload) => {
    if (payload?.siteId) await markSiteOpened(payload.siteId);
    return showBrowser(payload);
  });
  ipcMain.handle("browser:open-input", (_event, payload) => openSearchInput(payload));
  ipcMain.on("browser:hide", () => {
    detachSiteView(activeBrowserContext());
    scheduleLifecycleEnforcement("browser-hidden");
  });
  ipcMain.on("browser:bounds", (_event, bounds) => applySiteViewBounds(bounds));
  ipcMain.handle("browser:action", (_event, payload) =>
    browserAction(payload?.action, payload?.value),
  );
  ipcMain.handle("browser:select-tab", (_event, payload) =>
    selectBrowserTab(payload),
  );
  ipcMain.handle("browser:duplicate-tab", (_event, payload) =>
    duplicateBrowserTab(payload),
  );
  ipcMain.handle("browser:copy-tab-url", (_event, payload) =>
    copyBrowserTabUrl(payload),
  );
  ipcMain.handle("browser:open-tab-external", (_event, payload) =>
    openBrowserTabExternal(payload),
  );
  ipcMain.handle("browser:toggle-tab-mute", (_event, payload) =>
    toggleBrowserTabMute(payload),
  );
  ipcMain.handle("browser:show-tab-context-menu", (event, payload) =>
    showBrowserTabContextMenu(event, payload),
  );
  ipcMain.handle("browser:show-tab-group-context-menu", (event, payload) =>
    showBrowserTabGroupContextMenu(event, payload),
  );
  ipcMain.handle("tab-groups:create", (_event, payload) =>
    createTabGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:update", (_event, payload) =>
    updateTabGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:assign-tabs", (_event, payload) =>
    assignTabsToGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:reorder-tabs", (_event, payload) =>
    reorderBrowserTabsOperation(payload),
  );
  ipcMain.handle("tab-groups:reorder-groups", (_event, payload) =>
    reorderTabGroupsOperation(payload),
  );
  ipcMain.handle("tab-groups:merge", (_event, payload) =>
    mergeTabGroupsOperation(payload),
  );
  ipcMain.handle("tab-groups:undo-merge", () => undoTabGroupMergeOperation());
  ipcMain.handle("tab-groups:ungroup", (_event, payload) =>
    ungroupTabGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:delete-empty", (_event, payload) =>
    deleteEmptyTabGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:close", (_event, payload) =>
    closeTabGroupOperation(payload),
  );
  ipcMain.handle("tab-groups:suggest-sites", (_event, payload) =>
    suggestSiteTabGroupsOperation(payload),
  );
  ipcMain.handle("tab-groups:detect-duplicates", (_event, payload) =>
    duplicateTabReport(payload),
  );
  ipcMain.handle("tab-groups:resolve-duplicates", (_event, payload) =>
    resolveDuplicateTabsOperation(payload),
  );
  ipcMain.handle("browser:show-address-context-menu", (event) =>
    showAddressContextMenu(event),
  );
  ipcMain.handle("sites:duplicate-tab", (_event, payload) =>
    duplicateSiteTab(payload),
  );
  ipcMain.handle("browser:close-tab", (_event, payload) =>
    closeBrowserTab(payload),
  );
  ipcMain.handle("browser:restore-closed-tab", (_event, payload) =>
    restoreRecentlyClosedBrowserTab(payload),
  );
  ipcMain.handle("browser:detach-tab", (_event, payload) =>
    detachBrowserTab(payload),
  );
  ipcMain.handle("browser:reattach-tab", (_event, payload) =>
    reattachBrowserTab(payload),
  );
  ipcMain.handle("browser:focus-detached-tab", (_event, payload) =>
    focusDetachedBrowserTab(payload),
  );
  ipcMain.handle("browser:get-lifecycle", () => lifecycleSnapshot());
  ipcMain.handle("browser:get-navigation-performance", () => navigationPerformanceTracer.snapshot());
  ipcMain.handle("browser:set-keep-running", async (_event, payload) => {
    const found = findRuntimeTab(payload?.tabId);
    if (!found) throw new Error("找不到网页标签");
    found.tab.keepRunning = payload?.keepRunning === true;
    persistWorkspaceBrowserWorkspace(found.workspace);
    await getWebViewLifecycleManager().enforce("keep-running-changed");
    emitWorkspaceBrowserState(found.workspace);
    return lifecycleSnapshot();
  });
  ipcMain.handle("browser:suspend-tab", async (_event, payload) => {
    const found = findRuntimeTab(payload?.tabId);
    if (!found) throw new Error("找不到网页标签");
    if (visibleRuntimeTabIds().has(found.tab.tabId)) throw new Error("当前显示的页面不能休眠");
    const protection = await runtimeTabProtection(found.tab);
    if (protection.protected) throw new Error(`页面暂不能休眠：${protection.reason}`);
    await suspendRuntimeTab(found.tab, "manual");
    emitWorkspaceBrowserState(found.workspace);
    return lifecycleSnapshot();
  });
  ipcMain.handle("resources:list", () => {
    const context = activeBrowserContext();
    return context?.view ? getPageResourceService().list(context.view.webContents) : { items: [], detecting: false };
  });
  ipcMain.handle("resources:scan", () => inspectCurrentPageResources());
  ipcMain.handle("resources:start-network", () => {
    const context = activeBrowserContext();
    if (!context?.view || context.view.webContents.isDestroyed()) throw new Error("当前没有可检测的网页");
    return getPageResourceService().startNetworkDetection(
      session.fromPartition(browserPartitionForProfile(context.browserProfileId), { cache: true }),
      context.view.webContents,
    );
  });
  ipcMain.handle("resources:stop-network", () => getPageResourceService().stopNetworkDetection("user"));
  ipcMain.handle("resources:download", (_event, resourceId) => {
    const context = activeBrowserContext();
    if (!context?.view) throw new Error("当前网页已经关闭");
    return getPageResourceService().download(context.view.webContents, resourceId);
  });
  ipcMain.handle("detached:get-state", (event) => {
    const found = detachedTabForSender(event.sender);
    if (!found) throw new Error("独立页面已经失效");
    return detachedStateForTab(found.tab);
  });
  ipcMain.handle("detached:action", async (event, payload) => {
    const found = detachedTabForSender(event.sender);
    if (!found) throw new Error("独立页面已经失效");
    await browserActionForContext(found.tab, payload?.action, payload?.value);
    return detachedStateForTab(found.tab);
  });
  ipcMain.handle("detached:reattach", (event) => {
    const found = detachedTabForSender(event.sender);
    if (!found) throw new Error("独立页面已经失效");
    return reattachBrowserTab({ tabId: found.tab.tabId });
  });
  ipcMain.handle("detached:close-tab", (event) => {
    const found = detachedTabForSender(event.sender);
    if (!found) throw new Error("独立页面已经失效");
    return closeBrowserTab({ tabId: found.tab.tabId });
  });
  ipcMain.handle("translation:status", () => getTranslationServices().service.status());
  ipcMain.handle("translation:configure", async (_event, payload) => {
    return getTranslationServices().service.configure({
      publicConfig: {
        baseUrl: payload?.baseUrl,
        model: payload?.model,
      },
      apiKey: payload?.apiKey,
      clearApiKey: payload?.clearApiKey === true,
      sourceLanguage: payload?.sourceLanguage,
      targetLanguage: payload?.targetLanguage,
      defaultMode: payload?.defaultMode,
      selectionButtonEnabled: payload?.selectionButtonEnabled,
      shortSelectionPronunciationMode: payload?.shortSelectionPronunciationMode,
      shortSelectionMaxCharacters: payload?.shortSelectionMaxCharacters,
    });
  });
  ipcMain.handle("translation:test", (_event, payload) =>
    getTranslationServices().service.testConnection({
      publicConfig: {
        baseUrl: payload?.baseUrl,
        model: payload?.model,
      },
      apiKey: payload?.apiKey,
    }),
  );
  ipcMain.handle("translation:show-page-menu", () => showTranslationPageMenu());
  ipcMain.handle("tasks:get", async () => taskSnapshot(await getState()));
  ipcMain.handle("tasks:add", (_event, payload) =>
    mutateTaskState((state) => addTaskToState(state, payload)),
  );
  ipcMain.handle("tasks:update", (_event, payload) =>
    mutateTaskState((state) => updateTaskInState(state, payload)),
  );
  ipcMain.handle("tasks:delete", async (_event, taskId) => {
    const result = await mutateTaskState((state) => deleteTaskFromState(state, taskId));
    await appendGoogleTombstones("plans", taskId);
    return result;
  });
  ipcMain.handle("tasks:set-status", (_event, payload) =>
    mutateTaskState((state) => updateTaskInState(state, {
      id: payload?.taskId,
      status: payload?.status,
    })),
  );
  ipcMain.handle("tasks:snooze", (_event, payload) =>
    snoozeTaskReminder(payload?.reminderId, payload?.minutes),
  );
  ipcMain.handle("tasks:dismiss-reminder", (_event, reminderId) =>
    mutateTaskState((state) => updateReminderInState(state, reminderId, {
      state: "dismissed",
      snoozedUntil: null,
    })),
  );
  ipcMain.handle("tasks:update-settings", async (_event, patch) => {
    const state = await getState();
    const result = updateTaskSettingsInState(state, patch);
    cachedState = result.state;
    await persistState();
    await refreshTaskRuntimeSettings();
    emitTasksChanged();
    return taskSnapshot(cachedState);
  });
  ipcMain.handle("habits:get", async (_event, payload) =>
    habitSnapshot(await getState(), payload?.year),
  );
  ipcMain.handle("habits:add", (_event, payload) =>
    mutateHabitState((state) => addHabitDefinitionToState(state, payload)),
  );
  ipcMain.handle("habits:update", (_event, payload) =>
    mutateHabitState((state) => updateHabitDefinitionInState(state, payload)),
  );
  ipcMain.handle("habits:delete", (_event, habitId) =>
    mutateHabitState((state) => deleteHabitDefinitionFromState(state, habitId)),
  );
  ipcMain.handle("habits:get-check-in", async (_event, payload) => {
    const state = await getState();
    return state.habitCheckIns.find((item) => (
      item.habitId === String(payload?.habitId || "") &&
      item.localDate === String(payload?.localDate || "") &&
      !item.deletedAt
    )) || null;
  });
  ipcMain.handle("habits:upsert-check-in", (_event, payload) =>
    mutateHabitState((state) => upsertHabitCheckInInState(state, payload)),
  );
  ipcMain.handle("habits:delete-check-in", (_event, checkInId) =>
    mutateHabitState((state) => deleteHabitCheckInFromState(state, checkInId)),
  );
  ipcMain.handle("usage:update-settings", (_event, patch) =>
    setUsageTrackingEnabled(patch?.enabled === true),
  );
  ipcMain.handle("usage:clear", () => clearUsageTracking());
  ipcMain.on("usage:meaningful-action", () => {
    if (!usageTracker) return;
    updateUsageEligibility();
    usageTracker.recordMeaningfulAction();
  });
  ipcMain.handle("content-tags:get", async () => contentTagSnapshot(await getState()));
  ipcMain.handle("content-tags:save-group", (_event, payload) =>
    mutateContentTagState((state) => saveContentTagGroupInState(state, payload)));
  ipcMain.handle("content-tags:delete-group", (_event, groupId) =>
    mutateContentTagState((state) => deleteContentTagGroupInState(state, groupId)));
  ipcMain.handle("content-tags:save-tag", (_event, payload) =>
    mutateContentTagState((state) => saveContentTagInState(state, payload)));
  ipcMain.handle("content-tags:delete-tag", (_event, tagId) =>
    mutateContentTagState((state) => deleteContentTagInState(state, tagId)));
  ipcMain.handle("content-tags:save-alias", (_event, payload) =>
    mutateContentTagState((state) => saveContentTagAliasInState(state, payload)));
  ipcMain.handle("content-tags:delete-alias", (_event, aliasId) =>
    mutateContentTagState((state) => deleteContentTagAliasInState(state, aliasId)));
  ipcMain.handle("content-tags:preview-merge", async (_event, payload) =>
    previewContentTagMerge(await getState(), payload));
  ipcMain.handle("content-tags:merge", (_event, payload) => mergeContentTagsOperation(payload));
  ipcMain.handle("content-tags:undo-merge", () => undoLastContentTagMergeOperation());
  ipcMain.handle("content-tags:set-object-tags", (_event, payload) =>
    mutateContentTagState((state) => setContentObjectTagsInState(state, payload)));
  ipcMain.handle("timeline:get", async (_event, payload) =>
    timelineSnapshot(await getState(), payload?.year, payload?.trackId),
  );
  ipcMain.handle("timeline:add", (_event, payload) =>
    mutateTimelineState((state) => addTimelineEventToState(state, payload)),
  );
  ipcMain.handle("timeline:update", (_event, payload) =>
    mutateTimelineState((state) => updateTimelineEventInState(state, payload)),
  );
  ipcMain.handle("timeline:delete", (_event, eventId) =>
    mutateTimelineState((state) => deleteTimelineEventFromState(state, eventId)),
  );
  ipcMain.handle("timeline:update-settings", async (_event, patch) => {
    const state = await getState();
    const result = updateTimelineUiSettingsInState(state, patch);
    cachedState = result.state;
    await persistState();
    emitTimelineChanged();
    return timelineSnapshot(cachedState, result.timelineUiSettings.selectedYear);
  });
  ipcMain.handle("timeline:search", async (_event, payload) => {
    const index = await ensureTimelineSearchIndex();
    return { events: index.search(payload?.query, payload?.limit) };
  });
  ipcMain.handle("timeline:page-draft", () => currentPageTimelineDraft());
  ipcMain.handle("timeline:export", (_event, payload) => exportTimelineYear(payload));
  ipcMain.handle("userscripts:list", async () => userScriptSnapshot(await getState()));
  ipcMain.handle("userscripts:review-pasted", (_event, payload) =>
    getUserScriptServices().sources.review({
      sourceType: "pasted",
      sourceCode: payload?.sourceCode,
      workspaceIds: payload?.workspaceIds,
      browserProfileIds: payload?.browserProfileIds,
    }),
  );
  ipcMain.handle("userscripts:review-created", (_event, payload) =>
    getUserScriptServices().sources.review({
      sourceType: "createdInApp",
      sourceCode: payload?.sourceCode,
      name: payload?.name,
      workspaceIds: payload?.workspaceIds,
      browserProfileIds: payload?.browserProfileIds,
    }),
  );
  ipcMain.handle("userscripts:review-remote", (_event, payload) =>
    getUserScriptServices().sources.review({
      sourceType: "remoteUrl",
      sourceUrl: payload?.sourceUrl,
      workspaceIds: payload?.workspaceIds,
      browserProfileIds: payload?.browserProfileIds,
    }),
  );
  ipcMain.handle("userscripts:review-local-file", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "选择本地 UserScript",
      properties: ["openFile"],
      filters: [
        { name: "UserScript", extensions: ["user.js", "js"] },
        { name: "JavaScript", extensions: ["js"] },
      ],
    });
    if (result.canceled || !result.filePaths[0]) return null;
    const filePath = result.filePaths[0];
    if (!/\.user\.js$|\.js$/i.test(filePath)) throw new Error("请选择 .user.js 或 .js 文件");
    const stat = await fsp.stat(filePath);
    if (stat.size > 1_048_576) throw new Error("本地用户脚本不能超过 1 MB");
    return getUserScriptServices().sources.review({
      sourceType: "localFile",
      sourceUrl: filePath,
      sourceCode: await fsp.readFile(filePath, "utf8"),
    });
  });
  ipcMain.handle("userscripts:confirm-install", async (_event, reviewToken) => {
    const review = getUserScriptServices().sources.consume(reviewToken);
    if (!review.script.compatibility?.compatible) throw new Error("脚本存在不兼容能力，不能安装");
    const state = await getState();
    const existing = review.updateOf
      ? state.userScripts.find((script) => script.id === review.updateOf)
      : null;
    const result = upsertUserScript(state, {
      ...review.script,
      id: review.updateOf || review.script.id,
      sourceType: existing?.sourceType || review.script.sourceType,
      sourceUrl: existing?.sourceUrl || review.script.sourceUrl,
      enabled: existing?.enabled === true,
      createdAt: existing?.createdAt || review.script.createdAt,
      deletedAt: null,
    });
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return { ...userScriptSnapshot(cachedState), installed: publicUserScript(result.script, cachedState) };
  });
  ipcMain.handle("userscripts:set-enabled", async (_event, payload) => {
    const state = await getState();
    const result = updateUserScriptEnabled(state, payload?.scriptId, payload?.enabled);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return { ...userScriptSnapshot(cachedState), script: publicUserScript(result.script, cachedState) };
  });
  ipcMain.handle("userscripts:set-site-approved", async (_event, payload) => {
    const context = activeUserScriptContext();
    if (!context) throw new Error("当前没有可授权的网站页面");
    const sensitive = isSensitiveUserScriptUrl(context.view.webContents.getURL());
    if (sensitive.blocked) throw new Error(`敏感页面不允许启用脚本：${sensitive.reason}`);
    const hostname = new URL(context.view.webContents.getURL()).hostname;
    const state = await getState();
    const result = updateBuiltInSiteApproval(state, payload?.scriptId, hostname, payload?.approved);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return { ...userScriptSnapshot(cachedState), script: publicUserScript(result.script, cachedState), hostname };
  });
  ipcMain.handle("userscripts:set-sensitive-site-approved", async (_event, payload) => {
    const context = activeUserScriptContext();
    if (!context) throw new Error("当前没有可授权的网站页面");
    const url = context.view.webContents.getURL();
    const sensitive = isSensitiveUserScriptUrl(url);
    if (sensitive.sensitiveType !== "login") throw new Error("当前页面不是可高级授权的普通登录页");
    const hostname = new URL(url).hostname.toLowerCase();
    const state = await getState();
    const script = state.userScripts.find((item) => item.id === String(payload?.scriptId || ""));
    if (!script || script.sourceType === "builtIn") throw new Error("仅第三方用户脚本支持登录页高级授权");
    if (payload?.approved === true) {
      const confirmation = await dialog.showMessageBox(browserOwnerWindow(context), {
        type: "warning",
        title: "登录页用户脚本高级授权",
        message: `允许“${script.name}”在 ${hostname} 的普通登录页运行？`,
        detail: "第三方脚本可能读取登录页上除密码框以外的页面内容。栖页仍会隔离 Cookie、密码、Node、Electron 和未批准的跨域请求；OAuth/SAML 回调、支付和密码管理页面始终禁止。",
        buttons: ["取消", "授予当前域名"],
        defaultId: 0,
        cancelId: 0,
        checkboxLabel: "我理解第三方脚本可能读取此登录页面内容",
        checkboxChecked: false,
      });
      if (confirmation.response !== 1 || confirmation.checkboxChecked !== true) throw new Error("未完成登录页高级授权确认");
    }
    const result = updateSensitiveSiteApproval(state, script.id, hostname, payload?.approved);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return { ...userScriptSnapshot(cachedState), script: publicUserScript(result.script, cachedState), hostname };
  });
  ipcMain.handle("userscripts:remove", async (_event, scriptId) => {
    const state = await getState();
    const result = removeUserScript(state, scriptId);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return userScriptSnapshot(cachedState);
  });
  ipcMain.handle("userscripts:restore", async (_event, scriptId) => {
    const state = await getState();
    const result = restoreUserScript(state, scriptId);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return userScriptSnapshot(cachedState);
  });
  ipcMain.handle("userscripts:rollback", async (_event, payload) => {
    const state = await getState();
    const script = state.userScripts.find((item) => item.id === String(payload?.scriptId || ""));
    const version = (state.userScriptVersions || []).find((item) =>
      item.scriptId === script?.id && item.sourceHash === String(payload?.sourceHash || ""));
    if (!script || !version) throw new Error("找不到可回滚的脚本版本");
    const confirmation = await dialog.showMessageBox(mainWindow, {
      type: "warning",
      title: "回滚网页脚本",
      message: `将“${script.name}”回滚到 v${version.version}？`,
      detail: "当前源码会保留在版本历史中；回滚后脚本保持当前启用状态。",
      buttons: ["取消", "确认回滚"],
      defaultId: 0,
      cancelId: 0,
    });
    if (confirmation.response !== 1) throw new Error("已取消脚本回滚");
    const result = rollbackUserScriptVersion(state, script.id, version.sourceHash);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return userScriptSnapshot(cachedState);
  });
  ipcMain.handle("userscripts:set-localhost-approved", async (_event, payload) => {
    const state = await getState();
    const script = state.userScripts.find((item) => item.id === String(payload?.scriptId || ""));
    const hostname = String(payload?.hostname || "").toLowerCase().replace(/^\[|\]$/g, "");
    if (!script) throw new Error("找不到用户脚本");
    if (!script.connects.some((value) => value === hostname || value === `[${hostname}]`)) {
      throw new Error("脚本未声明这个本机 @connect 范围");
    }
    if (payload?.approved === true) {
      const confirmation = await dialog.showMessageBox(mainWindow, {
        type: "warning",
        title: "允许访问本机服务",
        message: `允许“${script.name}”访问 ${hostname}？`,
        detail: "本机服务可能包含开发接口或管理面板。只有脚本明确声明的地址会被放行，跳转后的每个目标仍会重新检查。",
        buttons: ["取消", "授予本机访问"],
        defaultId: 0,
        cancelId: 0,
        checkboxLabel: "我理解该脚本将能够访问本机服务",
        checkboxChecked: false,
      });
      if (confirmation.response !== 1 || confirmation.checkboxChecked !== true) throw new Error("未完成本机访问高级授权确认");
    }
    const result = updateLocalhostConnectApproval(state, script.id, hostname, payload?.approved);
    cachedState = result.state;
    await persistState();
    mainWindow?.webContents.send("userscripts:changed", userScriptSnapshot(cachedState));
    return userScriptSnapshot(cachedState);
  });
  ipcMain.handle("userscripts:check-update", async (_event, scriptId) => {
    const state = await getState();
    const script = state.userScripts.find((item) => item.id === String(scriptId || ""));
    const updateUrl = resolveUserScriptUpdateUrl(script);
    if (!script || !updateUrl) throw new Error("这个脚本没有可检查的 HTTPS 更新地址");
    return getUserScriptServices().sources.review({
      sourceType: "remoteUrl",
      sourceUrl: updateUrl,
      workspaceIds: script.workspaceIds,
      browserProfileIds: script.browserProfileIds,
    }, {
      updateOf: script.id,
      previousHash: script.sourceHash,
      previousSourceCode: script.sourceCode,
      previousScript: script,
    });
  });
  ipcMain.handle("userscripts:commands", () => {
    const context = activeUserScriptContext();
    return context ? getUserScriptServices().engine.commandsFor(context.view.webContents.id) : [];
  });
  ipcMain.handle("userscripts:execute-command", (_event, payload) => {
    const context = activeUserScriptContext();
    if (!context) throw new Error("当前没有可执行脚本命令的页面");
    return getUserScriptServices().engine.executeCommand(
      context.view.webContents,
      payload?.scriptId,
      payload?.commandId,
    );
  });
  ipcMain.handle("userscripts:run-restore-copy", async () => {
    const state = await getState();
    const script = state.userScripts.find((item) => item.id === "builtin-restore-copy");
    const context = activeUserScriptContext();
    if (!script || !context) throw new Error("当前页面无法运行恢复复制脚本");
    return getUserScriptServices().engine.runTemporary(context.view.webContents, {
      tabId: context.tabId,
      workspaceId: context.workspaceId,
      browserProfileId: context.browserProfileId,
    }, script);
  });
  ipcMain.handle("userscripts:runtime", (event, request) =>
    getUserScriptServices().engine.handleRuntimeRequest(event.sender, request),
  );
  ipcMain.handle("assistants:list", () => listAssistants());
  ipcMain.handle("assistants:set-enabled", (_event, payload) =>
    setAssistantEnabled(payload?.assistantId, payload?.enabled),
  );
  ipcMain.handle("assistants:page-actions", async () => {
    const { service } = await ensureAssistantRuntime();
    return service.getPanelContext();
  });
  ipcMain.handle("assistants:execute", async (_event, payload) => {
    const { service } = await ensureAssistantRuntime();
    const result = await service.execute({
      assistantId: payload?.assistantId,
      actionId: payload?.actionId,
    });
    return { ...result, state: await getState() };
  });
  ipcMain.handle("assistants:logs", async () => {
    const state = await getState();
    const scripts = new Map((state.userScripts || []).map((script) => [script.id, script.name]));
    const userScriptLogs = (state.userScriptExecutions || []).map((execution) => ({
      id: execution.id,
      timestamp: execution.finishedAt || execution.startedAt,
      assistantName: "网页脚本",
      actionName: scripts.get(execution.scriptId) || "已卸载脚本",
      hostname: execution.hostname,
      status: execution.status,
      message: execution.sanitizedMessage,
      durationMs: execution.durationMs,
      source: "userscript",
    }));
    const assistantLogs = Array.isArray(state.assistantExecutionLogs)
      ? state.assistantExecutionLogs
      : [];
    return {
      logs: [...assistantLogs, ...userScriptLogs]
        .sort((left, right) => Date.parse(right.timestamp || right.createdAt || 0) - Date.parse(left.timestamp || left.createdAt || 0))
        .slice(0, 500),
    };
  });
  ipcMain.handle("automation:get", async () => {
    const state = await getState();
    return { naixi: state.automations.naixi };
  });
  ipcMain.handle("automation:run-naixi", () =>
    runNaixiCheckin({ manual: true, source: "manual" }),
  );
  ipcMain.handle("automation:update-naixi", (_event, settings) =>
    updateNaixiAutomationSettings(settings),
  );
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: CAPTURE_WIDTH,
    height: CAPTURE_HEIGHT,
    minWidth: 1060,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: "栖页",
    backgroundColor: "#f2f0eb",
    titleBarStyle: "hidden",
    titleBarOverlay: {
      color: "#f8f7f4",
      symbolColor: "#56605d",
      height: MAIN_TITLE_TAB_ROW_HEIGHT,
    },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (isSafeWebUrl(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
    if (url !== mainWindow.webContents.getURL()) event.preventDefault();
  });
  mainWindow.on("resize", () => applySiteViewBounds(siteViewBounds));
  mainWindow.on("focus", () => { updateUsageEligibility(); companionRuntimeService?.tick(); });
  mainWindow.on("blur", () => {
    updateUsageEligibility();
    companionRuntimeService?.tick();
    void usageTracker?.flush().catch(() => undefined);
  });
  mainWindow.on("minimize", () => { updateUsageEligibility(); companionRuntimeService?.tick(); });
  mainWindow.on("restore", () => { updateUsageEligibility(); companionRuntimeService?.tick(); });
  mainWindow.on("show", () => { updateUsageEligibility(); companionRuntimeService?.tick(); });
  mainWindow.on("hide", () => {
    updateUsageEligibility();
    void usageTracker?.flush().catch(() => undefined);
    scheduleIncrementalGoogleSync(1_500);
  });
  mainWindow.on("close", (event) => {
    if (appBackgroundService?.shouldHideOnClose(cachedState?.taskSettings, isQuitting)) {
      event.preventDefault();
      managedPopupService?.closeAll();
      destroyAllWorkspaceBrowserViews();
      mainWindow.hide();
      const paused = Date.parse(cachedState?.taskSettings?.pausedUntil || 0) > Date.now();
      trayService?.ensure({ paused });
      return;
    }
    managedPopupService?.closeAll();
    destroyAllWorkspaceBrowserViews();
  });
  mainWindow.on("closed", () => {
    destroyAllWorkspaceBrowserViews();
    mainWindow = undefined;
  });
  mainWindow.once("ready-to-show", async () => {
    const state = await getState();
    const hiddenLaunch = process.argv.includes("--hidden") || state.taskSettings.startMinimized;
    if (CAPTURE_PATH || !hiddenLaunch) mainWindow?.show();
    else trayService?.ensure({ paused: Date.parse(state.taskSettings.pausedUntil || 0) > Date.now() });
    if (!CAPTURE_PATH) return;
    setTimeout(async () => {
      try {
        if (CAPTURE_ROUTE === "site") {
          await mainWindow.webContents.executeJavaScript(
            "showSite(appState.sites[0])",
          );
          await new Promise((resolve) => setTimeout(resolve, 4500));
        } else if (
          CAPTURE_ROUTE === "nodeseek-login" ||
          CAPTURE_ROUTE === "nodeseek-reset"
        ) {
          await mainWindow.webContents.executeJavaScript("showSite(appState.sites[0])");
          await new Promise((resolve) => setTimeout(resolve, 3500));
          await browserAction("site-login");
          await new Promise((resolve) => setTimeout(resolve, 3500));
          if (CAPTURE_ROUTE === "nodeseek-reset") {
            await browserAction("reset-site-session");
            await new Promise((resolve) => setTimeout(resolve, 3500));
          }
        } else if (CAPTURE_ROUTE === "bookmarks") {
          await mainWindow.webContents.executeJavaScript(
            "navigateTo('bookmarks')",
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "bookmarks-import") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const profiles = await window.siteNest.getChromeProfiles();
            const profile = profiles.find((item) => item.bookmarkCount > 0);
            if (!profile) return { profiles: profiles.length, imported: 0 };
            const imported = await window.siteNest.importChromeBookmarks(profile.id);
            appState = imported.state;
            renderAll();
            navigateTo('bookmarks');
            return {
              profiles: profiles.length,
              selectedProfile: profile.id,
              profileCount: profile.bookmarkCount,
              localCount: profile.localBookmarkCount,
              accountCount: profile.accountBookmarkCount,
              imported: imported.stats.scanned
            };
          })()`);
          console.log(JSON.stringify({ chromeImport: result }));
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (CAPTURE_ROUTE === "import-modal") {
          await mainWindow.webContents.executeJavaScript("openImportModal()");
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (
          CAPTURE_ROUTE === "google-live-status" ||
          CAPTURE_ROUTE === "google-live-sign-in" ||
          CAPTURE_ROUTE === "google-live-sync"
        ) {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            setGoogleSyncPopoverOpen(true);
            let status = await window.siteNest.googleSyncStatus();
            if (${JSON.stringify(CAPTURE_ROUTE)} !== 'google-live-status' && !status.signedIn) status = await window.siteNest.googleSignIn();
            mergeGoogleSyncState(status);
            renderGoogleSync();
            if (${JSON.stringify(CAPTURE_ROUTE)} === 'google-live-sync') {
              const synced = await window.siteNest.googleSyncNow();
              mergeGoogleSyncState(synced);
              if (synced.state) {
                applyReturnedState(synced);
                renderAll();
              }
              return {
                configured: Boolean(synced.configured),
                signedIn: Boolean(synced.signedIn),
                action: synced.syncResult?.action || null,
                direction: synced.syncResult?.direction || null,
              };
            }
            return {
              configured: Boolean(status.configured),
              signedIn: Boolean(status.signedIn),
              identityStatus: status.identity?.status || null,
              driveStatus: status.drive?.status || null,
              driveScopeGranted: Boolean(status.drive?.grantedScopes?.driveAppData),
              errorCode: status.errorCode || null,
            };
          })()`);
          console.log(JSON.stringify({ googleLiveProbe: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "companion-performance") {
          const service = await initializeCompanionRuntime();
          service.updateSettings({ ...(cachedState.uiSettings?.companion || {}), enabled: true });
          const handleSnapshot = () => ({
            heapUsedMiB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
            webContents: webContents.getAllWebContents().map((item) => item.getType()).sort(),
            powerListeners: ["lock-screen", "unlock-screen", "suspend", "resume"].reduce((total, eventName) => total + powerMonitor.listenerCount(eventName), 0),
            schedulerCount: service.timer ? 1 : 0,
          });
          const before = handleSnapshot();
          const cpuBefore = process.cpuUsage();
          for (let index = 0; index < 100; index += 1) {
            service.action("expand", { panel: index % 2 ? "weather" : "assistant" });
            service.action("collapse");
          }
          for (let index = 0; index < 100; index += 1) {
            service.machine.transition(index % 2 ? "focus" : "rest", { reason: "performance-probe" });
          }
          const after = handleSnapshot();
          const cpu = process.cpuUsage(cpuBefore);
          const sameInstance = service === await initializeCompanionRuntime();
          console.log(JSON.stringify({ companionPerformanceProbe: {
            before,
            after,
            sameInstance,
            finalState: service.snapshot().state,
            heapDeltaMiB: Math.round((after.heapUsedMiB - before.heapUsedMiB) * 100) / 100,
            cpuUserMs: Math.round(cpu.user / 1000 * 100) / 100,
            cpuSystemMs: Math.round(cpu.system / 1000 * 100) / 100,
          }}));
        } else if (["settings", "settings-popup", "settings-translation", "settings-tasks", "settings-memory", "settings-diagnostics", "settings-companion"].includes(CAPTURE_ROUTE)) {
          await mainWindow.webContents.executeJavaScript("navigateTo('settings')");
          await new Promise((resolve) => setTimeout(resolve, 700));
          if (CAPTURE_ROUTE === "settings-popup") {
            await mainWindow.webContents.executeJavaScript(
              "document.getElementById('popupPolicySettings')?.scrollIntoView({ block: 'center' })",
            );
            await new Promise((resolve) => setTimeout(resolve, 350));
          } else if (CAPTURE_ROUTE === "settings-translation") {
            await mainWindow.webContents.executeJavaScript(
              "document.getElementById('translationSettings')?.scrollIntoView({ block: 'center' })",
            );
            await new Promise((resolve) => setTimeout(resolve, 350));
          } else if (CAPTURE_ROUTE === "settings-tasks") {
            await mainWindow.webContents.executeJavaScript(
              "document.getElementById('taskNotificationSettings')?.scrollIntoView({ block: 'center' })",
            );
            await new Promise((resolve) => setTimeout(resolve, 350));
          } else if (CAPTURE_ROUTE === "settings-memory") {
            await mainWindow.webContents.executeJavaScript(
              "document.getElementById('browserMemorySettings')?.scrollIntoView({ block: 'center' })",
            );
            await new Promise((resolve) => setTimeout(resolve, 350));
          } else if (CAPTURE_ROUTE === "settings-diagnostics") {
            const auditResult = await mainWindow.webContents.executeJavaScript(`(async () => {
              showSettingsSection('diagnostics', 'ui-actions');
              const report = await window.siteNest.auditUIActions();
              await loadUIActionAudit();
              return {
                totalActions: report.summary.totalActions,
                registeredActions: report.summary.registeredActions,
                missingHandlers: report.summary.missingHandlers,
                invalidIpcChannels: report.summary.invalidIpcChannels,
                missingTests: report.summary.missingTests,
                keyboardInaccessible: report.summary.keyboardInaccessible,
                errorCount: report.summary.errorCount,
                externalWebContentsScanned: report.scope.externalWebContentsScanned,
              };
            })()`);
            console.log(JSON.stringify({ uiActionAuditProbe: auditResult }));
            await new Promise((resolve) => setTimeout(resolve, 350));
          } else if (CAPTURE_ROUTE === "settings-companion") {
            const companionResult = await mainWindow.webContents.executeJavaScript(`(async () => {
              const current = (await window.siteNest.getState()).uiSettings.companion || {};
              const updated = await window.siteNest.updateUiSettings({ companion: {
                ...current,
                enabled: true,
                onboardingSeen: true,
                focusDockSeconds: 35,
                weather: { ...(current.weather || {}), enabled: false, city: '上海', locationMode: 'manual', pollMinutes: 45 },
                quietHours: { enabled: true, start: '22:30', end: '07:15' }
              }});
              appState = updated.state;
              renderAll();
              showSettingsSection('notifications', 'companion');
              const paused = await window.siteNest.companionAction('pause', { minutes: 5 });
              return {
                enabled: appState.uiSettings.companion.enabled,
                city: appState.uiSettings.companion.weather.city,
                focusDockSeconds: appState.uiSettings.companion.focusDockSeconds,
                stateLabel: document.getElementById('companionSettingsStatus')?.textContent,
                pauseReason: paused.quietReason,
                settingsVisible: !document.getElementById('companionSettingsCard')?.hidden
              };
            })()`);
            console.log(JSON.stringify({ companionSettingsProbe: companionResult }));
            await new Promise((resolve) => setTimeout(resolve, 350));
          }
        } else if (CAPTURE_ROUTE === "habits") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const today = localDateKey(new Date());
            const added = await window.siteNest.addHabit({
              name: '阅读',
              description: 'Electron 集成测试目标',
              workspaceId: 'personal',
              frequencyType: 'daily',
              startDate: today,
              reminderTime: '20:30',
              targetType: 'totalCheckIns',
              targetValue: 100
            });
            await window.siteNest.upsertHabitCheckIn({
              habitId: added.habit.id,
              localDate: today,
              state: 'completed',
              note: '测试打卡'
            });
            await loadHabits();
            currentTaskView = 'habits';
            navigateTo('plan');
            renderPlan();
            return { habitId: added.habit.id, stars: habitState.totalStars, view: currentTaskView };
          })()`);
          console.log(JSON.stringify({ habitProbe: result }));
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (CAPTURE_ROUTE === "content-tags") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const groupResult = await window.siteNest.saveContentTagGroup({ name: '客户工作' });
            const sourceResult = await window.siteNest.saveContentTag({
              canonicalName: ' SAP   Support ',
              groupId: groupResult.group.id,
              accentKey: 'blue'
            });
            const targetResult = await window.siteNest.saveContentTag({
              canonicalName: '企业服务',
              groupId: groupResult.group.id,
              accentKey: 'pine'
            });
            const taskResult = await window.siteNest.addTask({
              title: '内容标签 IPC 回归',
              workspaceId: 'work'
            });
            await window.siteNest.setContentObjectTags({
              objectType: 'task',
              objectId: taskResult.task.id,
              tagIds: [sourceResult.tag.id]
            });
            const preview = await window.siteNest.previewContentTagMerge({
              sourceTagIds: [sourceResult.tag.id],
              targetTagId: targetResult.tag.id
            });
            const merged = await window.siteNest.mergeContentTags({
              sourceTagIds: [sourceResult.tag.id],
              targetTagId: targetResult.tag.id
            });
            const mergedAlias = merged.contentTagAliases.find((item) => (
              item.tagId === targetResult.tag.id && item.alias === 'SAP Support'
            ));
            const undone = await window.siteNest.undoLastContentTagMerge();
            navigateTo('settings');
            if (typeof openContentTagSettings === 'function') await openContentTagSettings();
            return {
              groupId: groupResult.group.id,
              sourceTagId: sourceResult.tag.id,
              targetTagId: targetResult.tag.id,
              affectedTasks: preview.affectedByType.task,
              affectedReferences: preview.affectedReferenceCount,
              aliasCreated: Boolean(mergedAlias),
              mergedSourceHidden: !merged.contentTags.some((item) => item.id === sourceResult.tag.id),
              undoRecordMarked: Boolean(undone.record?.undoneAt),
              sourceRestored: undone.contentTags.some((item) => item.id === sourceResult.tag.id)
            };
          })()`);
          console.log(JSON.stringify({ contentTagProbe: result }));
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (["plan-week", "plan-month", "task-modal"].includes(CAPTURE_ROUTE)) {
          await mainWindow.webContents.executeJavaScript(`(async () => {
            const now = new Date();
            const at = (days, hour) => {
              const value = new Date(now);
              value.setDate(value.getDate() + days);
              value.setHours(hour, 0, 0, 0);
              return value.toISOString();
            };
            const fixtures = [
              { title: '回复采购退货单位工单', workspaceId: 'work', priority: 'urgent', dueAt: at(0, 11), reminderOffsets: [10] },
              { title: '整理 Emma 知识检索结果', workspaceId: 'research', priority: 'high', status: 'doing', dueAt: at(1, 16), reminderOffsets: [30] },
              { title: '复核本周客户跟进清单', workspaceId: 'work', priority: 'normal', dueAt: at(3, 17), reminderOffsets: [] },
              { title: '阅读 Linux DO 收藏文章', workspaceId: 'personal', priority: 'low', dueAt: at(5, 20), reminderOffsets: [] },
            ];
            for (const fixture of fixtures) await window.siteNest.addTask(fixture);
            await loadTasks();
            currentTaskView = ${JSON.stringify(CAPTURE_ROUTE === "plan-month" ? "month" : "week")};
            navigateTo('plan');
            if (${JSON.stringify(CAPTURE_ROUTE)} === 'task-modal') openTaskModal(taskState.tasks[0]);
            return { taskCount: taskState.tasks.length, view: currentTaskView };
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (CAPTURE_ROUTE === "sites") {
          await mainWindow.webContents.executeJavaScript("navigateTo('sites')");
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (CAPTURE_ROUTE === "companion-discoverability") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for companion-discoverability");
          }
          const companionURL = new URL("/companion", TAB_PROBE_BASE_URL).toString();
          await mainWindow.webContents.executeJavaScript(`(async () => {
            const added = await window.siteNest.addSite({
              name: '小序可发现性验证',
              url: ${JSON.stringify(companionURL)},
              workspaceId: 'personal'
            });
            appState = added.state;
            await showSite(added.site);
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 900));
          await mainWindow.webContents.executeJavaScript(`showSite(appState.sites.find((site) => site.name === '小序可发现性验证'))`);
          await new Promise((resolve) => setTimeout(resolve, 500));
          const context = activeBrowserContext();
          await installCompanionPageWidget(context);
          const inspectWidget = () => context.view.webContents.executeJavaScriptInIsolatedWorld(
            COMPANION_WIDGET_WORLD_ID,
            [{ code: "globalThis.__qiyeXiaoxuWidget?.inspect?.() || null", url: "qiye-companion://probe" }],
            true,
          );
          const shell = await mainWindow.webContents.executeJavaScript(`(() => {
            const browserContent = document.getElementById('browserContent');
            return {
              enabled: appState.uiSettings.companion.enabled,
              shellRailExists: Boolean(document.getElementById('companionEdgeRail')),
              shellDockExists: Boolean(document.getElementById('companionDock')),
              shellPanelExists: Boolean(document.getElementById('companionPanel')),
              titlebarDisabled: document.getElementById('globalCompanionTrigger')?.getAttribute('aria-disabled'),
              browserColumns: getComputedStyle(browserContent).gridTemplateColumns,
              browserWidth: browserContent.getBoundingClientRect().width,
              frameWidth: document.getElementById('webviewFrame').getBoundingClientRect().width,
            };
          })()`);
          const before = await inspectWidget();
          const clickPoint = {
            x: Math.round(before.orbRect.x + before.orbRect.width / 2),
            y: Math.round(before.orbRect.y + before.orbRect.height / 2),
          };
          const clickWidget = async (point) => {
            context.view.webContents.sendInputEvent({ type: "mouseMove", ...point });
            context.view.webContents.sendInputEvent({ type: "mouseDown", button: "left", clickCount: 1, ...point });
            context.view.webContents.sendInputEvent({ type: "mouseUp", button: "left", clickCount: 1, ...point });
            await new Promise((resolve) => setTimeout(resolve, 250));
          };
          await clickWidget(clickPoint);
          const opened = await inspectWidget();
          const settings = { enabled: true, wellness: { enabled: true, kinds: { "eye-rest": true, water: true, movement: true } } };
          const readState = async (runtime, options = {}) => {
            await context.view.webContents.executeJavaScriptInIsolatedWorld(
              COMPANION_WIDGET_WORLD_ID,
              [{ code: companionWidgetUpdateScript({ runtime, settings, ...options }), url: "qiye-companion://probe-update" }],
              true,
            );
            return inspectWidget();
          };
          const idle = await readState({ state: "idle" });
          const breathing = await readState({ state: "resting" });
          const focused = await readState({ state: "focusedDocked" });
          const fullscreen = await readState({ state: "silentHidden", quietReason: "fullscreen" });
          const happy = await readState({ state: "bubbleTip", reminder: { kind: "water", message: "休息一下，记得喝水" } });
          await clickWidget({
            x: Math.round(happy.orbRect.x + happy.orbRect.width / 2),
            y: Math.round(happy.orbRect.y + happy.orbRect.height / 2),
          });
          const finalOpen = await readState({ state: "bubbleTip", reminder: { kind: "water", message: "休息一下，记得喝水" } });
          const companionResult = { shell, before, opened, idle, breathing, focused, fullscreen, happy, finalOpen };
          console.log(JSON.stringify({ companionDiscoverabilityProbe: companionResult }));
          await new Promise((resolve) => setTimeout(resolve, 350));
        } else if (CAPTURE_ROUTE === "browser-toolbar") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for browser-toolbar");
          }
          await new Promise((resolve) => setTimeout(resolve, 900));
          const toolbarURL = new URL("/toolbar", TAB_PROBE_BASE_URL).toString();
          await mainWindow.webContents.executeJavaScript(`openSite({
            id: 'nodeseek-info',
            name: '栖页工具栏测试',
            shortName: '测',
            url: ${JSON.stringify(toolbarURL)},
            color: '#25846e',
            openMode: 'internal',
            workspaceId: 'personal'
          })`);
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (CAPTURE_ROUTE === "navigation-performance-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for navigation-performance-probe");
          }
          await activateWorkspaceBrowserContext("personal", { attach: false, restore: false });
          const workspace = activeWorkspaceBrowserContext();
          const samples = [];
          for (let index = 0; index < 5; index += 1) {
            const url = new URL(`/navigation-performance?run=${index}`, TAB_PROBE_BASE_URL).toString();
            const tab = await createRuntimeBrowserTab(workspace, {
              url,
              homeURL: url,
              title: `导航性能 ${index + 1}`,
              activate: true,
              allowDuplicate: true,
            });
            const startedAt = performance.now();
            await selectBrowserTab({ tabId: tab.tabId, bounds: siteViewBounds });
            const returnedAt = performance.now();
            const traceDeadline = Date.now() + 5_000;
            while (!tab.lastNavigationTrace && Date.now() < traceDeadline) {
              await new Promise((resolve) => setTimeout(resolve, 20));
            }
            samples.push({
              selectReturnMs: Math.max(0, returnedAt - startedAt),
              trace: tab.lastNavigationTrace,
            });
            await closeBrowserTab({ tabId: tab.tabId, bounds: siteViewBounds });
          }
          console.log(`QIYE_NAVIGATION_PERFORMANCE=${JSON.stringify({ samples, summary: navigationPerformanceTracer.summary() })}`);
        } else if (CAPTURE_ROUTE === "resource-lifecycle-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for resource-lifecycle-probe");
          }
          const resourceUrl = new URL("/resources", TAB_PROBE_BASE_URL).toString();
          await mainWindow.webContents.executeJavaScript(`(async () => {
            const added = await window.siteNest.addSite({ name: '资源与内存回归页', url: ${JSON.stringify(resourceUrl)}, workspaceId: 'personal' });
            appState = added.state;
            await showSite(added.site);
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 600));
          const original = activeBrowserContext();
          const originalContents = original.view.webContents;
          const resources = await inspectCurrentPageResources();
          const builtIn = (await getState()).userScripts.find((script) => script.id === "builtin-restore-copy");
          await getUserScriptServices().engine.runTemporary(originalContents, {
            tabId: original.tabId,
            workspaceId: original.workspaceId,
            browserProfileId: original.browserProfileId,
          }, builtIn);
          const runtimeBeforeSuspend = getUserScriptServices().engine.runtimes.has(originalContents.id);
          const workspace = activeWorkspaceBrowserContext();
          const extraTabs = [];
          for (let index = 0; index < 5; index += 1) {
            const url = new URL(`/background-${index}`, TAB_PROBE_BASE_URL).toString();
            const tab = await createRuntimeBrowserTab(workspace, { url, homeURL: url, title: `后台 ${index}`, activate: false });
            await ensureRuntimeTabView(tab, { url, forceURL: true });
            extraTabs.push(tab);
          }
          await Promise.all(extraTabs.map((tab) => waitForRuntimeTabNavigation(tab)));
          const liveBefore = allRuntimeTabs().filter((tab) => tab.view && !tab.view.webContents.isDestroyed()).length;
          const memoryBefore = app.getAppMetrics().reduce((sum, metric) => sum + Number(metric.memory?.privateBytes || 0), 0);
          await selectBrowserTab({ tabId: extraTabs.at(-1).tabId, bounds: siteViewBounds });
          let lifecycle = await getWebViewLifecycleManager().updateSettings({ mode: "saver", inactiveMinutes: 0 });
          let liveAfter = allRuntimeTabs().filter((tab) => tab.view && !tab.view.webContents.isDestroyed()).length;
          for (let attempt = 0; liveAfter > 1 && attempt < 5; attempt += 1) {
            // A page that is still reporting loading is intentionally protected.
            // Re-run the policy after it settles instead of making the probe race
            // concurrent Electron integration files.
            await new Promise((resolve) => setTimeout(resolve, 250));
            lifecycle = await getWebViewLifecycleManager().enforce("probe-settled");
            liveAfter = allRuntimeTabs().filter((tab) => tab.view && !tab.view.webContents.isDestroyed()).length;
          }
          const memoryAfter = app.getAppMetrics().reduce((sum, metric) => sum + Number(metric.memory?.privateBytes || 0), 0);
          const runtimeAfterSuspend = getUserScriptServices().engine.runtimes.has(originalContents.id);
          const resourceCacheAfterSuspend = getPageResourceService().resources.has(originalContents.id);
          const cookieBeforeRestore = await getPersistentSiteSession().cookies.get({ url: new URL(TAB_PROBE_BASE_URL).origin });
          await selectBrowserTab({ tabId: original.tabId, bounds: siteViewBounds });
          await new Promise((resolve) => setTimeout(resolve, 500));
          const restored = activeBrowserContext();
          const restoredUrl = restored.view.webContents.getURL();
          const cookieAfterRestore = await getPersistentSiteSession().cookies.get({ url: new URL(TAB_PROBE_BASE_URL).origin });
          const networkService = getPageResourceService();
          networkService.startNetworkDetection(getPersistentSiteSession(), restored.view.webContents, 1_000);
          await restored.view.webContents.executeJavaScript(`fetch(${JSON.stringify(new URL("/network-file.pdf", TAB_PROBE_BASE_URL).toString())}).then((response) => response.arrayBuffer())`);
          await new Promise((resolve) => setTimeout(resolve, 200));
          const networkItems = networkService.list(restored.view.webContents).items.filter((item) => item.detectedBy === "network");
          networkService.stopNetworkDetection("probe-complete");
          const finalResources = await inspectCurrentPageResources();
          console.log(JSON.stringify({ resourceLifecycleProbe: {
            domResourceCount: resources.items.length,
            domResourceTypes: resources.items.map((item) => item.type).sort(),
            blockedPlaylist: resources.items.some((item) => item.url.includes('.m3u8')),
            networkResourceCount: networkItems.length,
            networkHasBodyOrHeaders: networkItems.some((item) => Object.hasOwn(item, 'headers') || Object.hasOwn(item, 'body')),
            liveBefore,
            liveAfter,
            memoryBefore,
            memoryAfter,
            lifecycleCounts: lifecycle.counts,
            originalDestroyed: originalContents.isDestroyed(),
            runtimeBeforeSuspend,
            runtimeAfterSuspend,
            resourceCacheAfterSuspend,
            cookieBeforeRestore: cookieBeforeRestore.length,
            cookieAfterRestore: cookieAfterRestore.length,
            restoredUrl,
            partition: browserPartitionForProfile(restored.browserProfileId),
            finalResourceCount: finalResources.items.length,
          } }));
          const restoredSession = tabSummary(restored, restored.tabId);
          await mainWindow.webContents.executeJavaScript(`(async () => {
            await showSession(${JSON.stringify(restoredSession)});
            setPageActionPanelOpen(true);
            await loadPageResources();
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 350));
        } else if (CAPTURE_ROUTE === "userscript-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for userscript-probe");
          }
          const origin = new URL(TAB_PROBE_BASE_URL).origin;
          const scriptSource = `// ==UserScript==
// @name Electron userscript fixture
// @namespace test.qiye
// @version 1.0.0
// @match ${origin}/*
// @run-at document-end
// @grant GM_addStyle
// @grant GM_getValue
// @grant GM_setValue
// @grant GM_registerMenuCommand
// ==/UserScript==
const runs = (await GM_getValue('runs', 0)) + 1;
await GM_setValue('runs', runs);
GM_addStyle('#userscript-target { color: rgb(12, 120, 88) !important; }');
document.documentElement.dataset.qiyeUserscript = String(runs);
document.body.dataset.cookieSeen = document.cookie || 'blocked';
document.body.dataset.passwordSeen = document.querySelector('input[type="password"]')?.value || 'blocked';
GM_registerMenuCommand('标记页面', () => { document.body.dataset.menuCommand = 'done'; });`;
          const installed = await mainWindow.webContents.executeJavaScript(`(async () => {
            const review = await window.siteNest.reviewPastedUserScript(${JSON.stringify(scriptSource)});
            const confirmed = await window.siteNest.confirmUserScriptInstall(review.reviewToken);
            const script = confirmed.installed;
            await window.siteNest.setUserScriptEnabled(script.id, true);
            const added = await window.siteNest.addSite({ name: '用户脚本回归页', url: ${JSON.stringify(new URL("/article", TAB_PROBE_BASE_URL).toString())}, workspaceId: 'personal' });
            appState = added.state;
            await showSite(added.site);
            return { scriptId: script.id, hash: script.sourceHash };
          })()`);
          await waitForRuntimeTabNavigation(activeBrowserContext(), 15_000);
          for (let attempt = 0; attempt < 120; attempt += 1) {
            const scriptReady = await siteView.webContents.executeJavaScript(
              "Boolean(document.documentElement.dataset.qiyeUserscript)",
            ).catch(() => false);
            if (scriptReady) break;
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          const pageResult = await siteView.webContents.executeJavaScript(`(() => ({
            ran: document.documentElement.dataset.qiyeUserscript,
            cookieSeen: document.body.dataset.cookieSeen,
            passwordSeen: document.body.dataset.passwordSeen,
            passwordPreserved: document.querySelector('input[type="password"]')?.value === 'fixture-password',
            color: getComputedStyle(document.getElementById('userscript-target')).color,
            pageHostType: typeof globalThis.qiyeUserScriptHost,
            nodeRequireType: typeof globalThis.require
          }))()`);
          const publicScripts = await mainWindow.webContents.executeJavaScript("window.siteNest.getUserScripts()");
          const browserCookies = await getPersistentSiteSession().cookies.get({ url: origin });
          const commands = await mainWindow.webContents.executeJavaScript("window.siteNest.getUserScriptCommands()");
          if (commands[0]) {
            await mainWindow.webContents.executeJavaScript(`window.siteNest.executeUserScriptCommand(${JSON.stringify(installed.scriptId)}, ${JSON.stringify(commands[0]?.commandId)})`);
          }
          const commandResult = await siteView.webContents.executeJavaScript("document.body.dataset.menuCommand || ''");
          const storedState = await getState();
          await loadUrlAllowingRedirectAbort(siteView.webContents, new URL("/login", TAB_PROBE_BASE_URL).toString());
          await new Promise((resolve) => setTimeout(resolve, 700));
          const sensitiveRan = await siteView.webContents.executeJavaScript("document.documentElement.dataset.qiyeUserscript || ''");
          await mainWindow.webContents.executeJavaScript(`window.siteNest.setUserScriptEnabled(${JSON.stringify(installed.scriptId)}, false)`);
          await loadUrlAllowingRedirectAbort(siteView.webContents, new URL("/disabled", TAB_PROBE_BASE_URL).toString());
          await new Promise((resolve) => setTimeout(resolve, 700));
          const disabledRan = await siteView.webContents.executeJavaScript("document.documentElement.dataset.qiyeUserscript || ''");
          console.log(JSON.stringify({ userscriptProbe: {
            ...pageResult,
            commandCount: commands.length,
            commandResult,
            storedRuns: storedState.userScriptValues?.[installed.scriptId]?.runs,
            browserCookieCount: browserCookies.length,
            sensitiveRan,
            disabledRan,
            runtimeCount: userScriptEngine?.commandsFor(siteView.webContents.id).length || 0,
            sourceExposed: publicScripts.scripts.some((script) => Object.hasOwn(script, 'sourceCode')),
            recentExecutions: storedState.userScriptExecutions?.filter((execution) => execution.scriptId === installed.scriptId).slice(-5),
          } }));
        } else if (CAPTURE_ROUTE === "workspace-tabs-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for workspace-tabs-probe");
          }
          const originURL = new URL("/origin", TAB_PROBE_BASE_URL).toString();
          const childURL = new URL("/child", TAB_PROBE_BASE_URL).toString();
          await showBrowser({
            url: originURL,
            workspaceId: "personal",
            bounds: siteViewBounds,
          });
          const workspace = activeWorkspaceBrowserContext();
          const originalTab = activeBrowserContext(workspace);
          await waitForRuntimeTabNavigation(originalTab);
          // This capture route drives the browser below the renderer, so there is no visible
          // tab id for the pool to protect while the detach/reattach identity is inspected.
          originalTab.keepRunning = true;
          const original = {
            tabId: originalTab.tabId,
            url: originalTab.view.webContents.getURL(),
            webContentsId: originalTab.view.webContents.id,
            owner: originalTab.viewOwner,
          };
          await originalTab.view.webContents.executeJavaScript(
            `window.open(${JSON.stringify(childURL)}, '_blank')`,
          );
          for (let attempt = 0; attempt < 80 && workspace.tabs.size < 2; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (workspace.tabs.size < 2) throw new Error("window.open did not create a tab");
          const popupTab = activeBrowserContext(workspace);
          for (
            let attempt = 0;
            attempt < 80 && popupTab.view.webContents.getURL() !== childURL;
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (popupTab.view.webContents.getURL() !== childURL) {
            throw new Error("window.open tab did not finish navigating to the child URL");
          }
          const popup = {
            tabId: popupTab.tabId,
            url: popupTab.view.webContents.getURL(),
            webContentsId: popupTab.view.webContents.id,
            owner: popupTab.viewOwner,
            workspaceId: popupTab.workspaceId,
          };
          const detachedState = await detachBrowserTab({
            tabId: popupTab.tabId,
            windowBounds: { width: 900, height: 640 },
          });
          const detached = {
            tabId: popupTab.tabId,
            webContentsId: popupTab.view.webContents.id,
            owner: popupTab.viewOwner,
            windowId: popupTab.detachedWindow?.id || null,
            stateWebContentsId: detachedState.webContentsId,
          };
          const reattachedState = await reattachBrowserTab({
            tabId: popupTab.tabId,
            bounds: siteViewBounds,
          });
          const reattached = {
            tabId: popupTab.tabId,
            webContentsId: popupTab.view.webContents.id,
            owner: popupTab.viewOwner,
            stateWebContentsId: reattachedState.webContentsId,
          };
          if (!originalTab.view || originalTab.view.webContents.isDestroyed()) {
            throw new Error(`opener tab was suspended unexpectedly: ${JSON.stringify(lifecycleSnapshot())}; lastActiveAt=${originalTab.lastActiveAt}`);
          }
          console.log(
            JSON.stringify({
              workspaceTabsProbe: {
                original,
                popup,
                detached,
                reattached,
                originalAfter: {
                  url: originalTab.view.webContents.getURL(),
                  webContentsId: originalTab.view.webContents.id,
                  owner: originalTab.viewOwner,
                },
                activeTabId: workspace.activeTabId,
                tabCount: workspace.tabs.size,
              },
            }),
          );
        } else if (CAPTURE_ROUTE === "browser-popup-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for browser-popup-probe");
          }
          const originURL = new URL("/popup-origin", TAB_PROBE_BASE_URL).toString();
          await showBrowser({
            url: originURL,
            workspaceId: "work",
            bounds: siteViewBounds,
          });
          const workspace = activeWorkspaceBrowserContext();
          const openerTab = activeBrowserContext(workspace);
          await waitForRuntimeTabNavigation(openerTab);
          const contents = openerTab.view.webContents;
          await contents.executeJavaScript(`(() => {
            document.cookie = 'shared_session=qiye; path=/; SameSite=Lax';
            window.__qiyePopupMessages = [];
            window.addEventListener('message', (event) => {
              if (event.origin === location.origin && event.data?.kind) {
                window.__qiyePopupMessages.push(event.data);
              }
            });
          })()`);
          const waitForPopupMessages = async (count) => {
            for (let attempt = 0; attempt < 160; attempt += 1) {
              const messages = await contents.executeJavaScript(
                "window.__qiyePopupMessages || []",
              );
              if (messages.length >= count) return messages;
              await new Promise((resolve) => setTimeout(resolve, 25));
            }
            throw new Error(`managed popup did not return ${count} opener messages`);
          };
          await contents.executeJavaScript(
            `(() => { window.open(${JSON.stringify(new URL("/popup-login", TAB_PROBE_BASE_URL).toString())}, 'loginPopup', 'popup,width=620,height=680'); return true; })()`,
          );
          await waitForPopupMessages(1);
          await contents.executeJavaScript(`(() => {
            const form = document.createElement('form');
            form.method = 'POST';
            form.action = ${JSON.stringify(new URL("/popup-post", TAB_PROBE_BASE_URL).toString())};
            form.target = 'postLoginPopup';
            const input = document.createElement('input');
            input.name = 'assertion';
            input.value = 'fixture-value';
            form.appendChild(input);
            document.body.appendChild(form);
            form.submit();
            form.remove();
          })()`);
          await waitForPopupMessages(2);
          await contents.executeJavaScript(
            `(() => { window.open(${JSON.stringify(new URL("/popup-oauth?code=fixture-secret&state=fixture-state", TAB_PROBE_BASE_URL).toString())}, 'oauthPopup', 'popup,width=620,height=680'); return true; })()`,
          );
          const messages = await waitForPopupMessages(3);
          for (let attempt = 0; attempt < 80 && managedPopupService?.windows.size; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          let popupDownloadTriggered = false;
          const preventFixtureDownload = (event) => {
            popupDownloadTriggered = true;
            event.preventDefault();
          };
          persistentSiteSession.prependOnceListener("will-download", preventFixtureDownload);
          await contents.executeJavaScript(
            `(() => { window.open(${JSON.stringify(new URL("/popup-download-page", TAB_PROBE_BASE_URL).toString())}, 'downloadPopup', 'popup,width=620,height=680'); return true; })()`,
          );
          let downloadPopup = null;
          for (let attempt = 0; attempt < 80; attempt += 1) {
            downloadPopup = Array.from(managedPopupService?.windows.values() || []).at(-1)?.window || null;
            let popupPath = "";
            try { popupPath = new URL(downloadPopup?.webContents.getURL() || "").pathname; } catch {}
            if (downloadPopup && !downloadPopup.isDestroyed() && popupPath === "/popup-download-page") break;
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (!downloadPopup || downloadPopup.isDestroyed()) throw new Error("download popup did not open");
          await downloadPopup.webContents.executeJavaScript("document.getElementById('popup-download-link').click()");
          for (let attempt = 0; attempt < 80 && !popupDownloadTriggered; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          persistentSiteSession.removeListener("will-download", preventFixtureDownload);
          if (!popupDownloadTriggered) throw new Error("managed popup did not trigger its download");
          downloadPopup.close();
          for (let attempt = 0; attempt < 80 && managedPopupService?.windows.size; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          const cookies = await persistentSiteSession.cookies.get({
            url: originURL,
            name: "shared_session",
          });
          console.log(JSON.stringify({
            browserPopupProbe: {
              messages,
              sharedCookie: cookies[0]?.value || null,
              partition: browserPartitionForProfile(openerTab.browserProfileId),
              popupDownloadTriggered,
              navigationAudits: managedPopupService?.recentNavigationAudits() || [],
              remainingManagedWindows: managedPopupService?.windows.size || 0,
              openerUrl: contents.getURL(),
              tabCount: workspace.tabs.size,
            },
          }));
        } else if (CAPTURE_ROUTE === "workspace-tabs-duplicate-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error(
              "QIYE_TAB_PROBE_BASE_URL is required for workspace-tabs-duplicate-probe",
            );
          }
          const originURL = new URL("/duplicate-origin", TAB_PROBE_BASE_URL).toString();
          const siteURL = new URL("/duplicate-site", TAB_PROBE_BASE_URL).toString();
          await showBrowser({
            url: originURL,
            workspaceId: "personal",
            bounds: siteViewBounds,
          });
          const workspace = activeWorkspaceBrowserContext();
          const originalTab = activeBrowserContext(workspace);
          await waitForRuntimeTabNavigation(originalTab);
          originalTab.keepRunning = true;
          const original = {
            tabId: originalTab.tabId,
            webContentsId: originalTab.view.webContents.id,
            url: originalTab.view.webContents.getURL(),
          };
          await mainWindow.webContents.executeJavaScript(
            `window.siteNest.duplicateBrowserTab(${JSON.stringify(originalTab.tabId)}, ${JSON.stringify(siteViewBounds)})`,
          );
          const browserCopy = activeBrowserContext(workspace);
          browserCopy.keepRunning = true;
          for (
            let attempt = 0;
            attempt < 80 && browserCopy.view.webContents.getURL() !== originURL;
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          const browserCopyResult = {
            tabId: browserCopy.tabId,
            webContentsId: browserCopy.view.webContents.id,
            url: browserCopy.view.webContents.getURL(),
            allowDuplicate: browserCopy.allowDuplicate,
            sameSession:
              browserCopy.view.webContents.session === originalTab.view.webContents.session,
          };
          const countAfterBrowserCopy = workspace.tabs.size;
          await showBrowser({
            url: originURL,
            workspaceId: "personal",
            bounds: siteViewBounds,
          });
          const browserOrdinaryOpen = {
            tabCount: workspace.tabs.size,
            activeTabId: workspace.activeTabId,
          };

          const added = addSiteToState(
            await getState(),
            {
              name: "Duplicate probe site",
              url: siteURL,
              workspaceId: "personal",
            },
            {
              defaultSites: DEFAULT_SITES,
              idFactory: () => "workspace-tabs-duplicate-probe-site",
            },
          );
          cachedState = added.state;
          await persistState();
          await showBrowser({
            siteId: added.site.id,
            url: added.site.url,
            bounds: siteViewBounds,
          });
          const siteOriginalTab = activeBrowserContext(workspace);
          siteOriginalTab.keepRunning = true;
          await mainWindow.webContents.executeJavaScript(
            `window.siteNest.duplicateSiteTab(${JSON.stringify(added.site.id)}, ${JSON.stringify(siteViewBounds)})`,
          );
          const siteCopy = activeBrowserContext(workspace);
          siteCopy.keepRunning = true;
          for (
            let attempt = 0;
            attempt < 80 && siteCopy.view.webContents.getURL() !== siteURL;
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          const siteCopyResult = {
            originalTabId: siteOriginalTab.tabId,
            originalWebContentsId: siteOriginalTab.view.webContents.id,
            tabId: siteCopy.tabId,
            webContentsId: siteCopy.view.webContents.id,
            url: siteCopy.view.webContents.getURL(),
            siteId: siteCopy.currentSiteId,
            allowDuplicate: siteCopy.allowDuplicate,
            sameSession:
              siteCopy.view.webContents.session === siteOriginalTab.view.webContents.session,
          };
          const countAfterSiteCopy = workspace.tabs.size;
          await showBrowser({
            siteId: added.site.id,
            url: added.site.url,
            bounds: siteViewBounds,
          });
          console.log(
            JSON.stringify({
              workspaceTabsDuplicateProbe: {
                original,
                browserCopy: browserCopyResult,
                countAfterBrowserCopy,
                browserOrdinaryOpen,
                siteCopy: siteCopyResult,
                countAfterSiteCopy,
                siteOrdinaryOpen: {
                  tabCount: workspace.tabs.size,
                  activeTabId: workspace.activeTabId,
                },
              },
            }),
          );
        } else if (CAPTURE_ROUTE === "tab-organization-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error("QIYE_TAB_PROBE_BASE_URL is required for tab-organization-probe");
          }
          const originURL = new URL("/grouped", TAB_PROBE_BASE_URL).toString();
          await showBrowser({
            url: originURL,
            workspaceId: "personal",
            bounds: siteViewBounds,
          });
          const workspace = activeWorkspaceBrowserContext();
          const original = activeBrowserContext(workspace);
          original.keepRunning = true;
          await waitForRuntimeTabNavigation(original);
          const duplicateResult = await duplicateBrowserTab({ tabId: original.tabId, bounds: siteViewBounds });
          let duplicate = findRuntimeTab(duplicateResult.activeTabId).tab;
          duplicate.keepRunning = true;
          await waitForRuntimeTabNavigation(duplicate);
          const before = [original, duplicate].map((tab) => ({
            tabId: tab.tabId,
            webContentsId: tab.view.webContents.id,
            browserProfileId: tab.browserProfileId,
            partition: browserPartitionForProfile(tab.browserProfileId),
            url: tab.view.webContents.getURL(),
          }));
          const firstGroup = await createTabGroupOperation({
            workspaceId: "personal",
            name: "SAP Support",
            tabIds: [original.tabId],
          });
          const secondGroup = await createTabGroupOperation({
            workspaceId: "personal",
            name: "SAP 登录",
            colorKey: "blue",
            tabIds: [duplicate.tabId],
          });
          await updateTabGroupOperation({
            groupId: firstGroup.group.id,
            patch: { collapsed: true },
          });
          const collapsedIdentity = {
            original: original.view.webContents.id,
            duplicate: duplicate.view.webContents.id,
          };
          await mergeTabGroupsOperation({
            sourceGroupId: secondGroup.group.id,
            targetGroupId: firstGroup.group.id,
          });
          const mergedIdentity = {
            original: original.view.webContents.id,
            duplicate: duplicate.view.webContents.id,
          };
          const closedIdentity = {
            tabId: duplicate.tabId,
            browserProfileId: duplicate.browserProfileId,
            partition: browserPartitionForProfile(duplicate.browserProfileId),
            tabGroupId: duplicate.tabGroupId,
          };
          const closeResult = await closeBrowserTab({ tabId: duplicate.tabId, force: true });
          const closedRecord = cachedState.recentlyClosedTabs.find(
            (candidate) => candidate.id === closeResult.recentlyClosedId,
          );
          const restoredState = await restoreRecentlyClosedBrowserTab({
            closedId: closeResult.recentlyClosedId,
            bounds: siteViewBounds,
          });
          duplicate = findRuntimeTab(restoredState.activeTabId).tab;
          await waitForRuntimeTabNavigation(duplicate);
          const restoredIdentity = {
            tabId: duplicate.tabId,
            browserProfileId: duplicate.browserProfileId,
            partition: browserPartitionForProfile(duplicate.browserProfileId),
            tabGroupId: duplicate.tabGroupId,
            restoredToOriginalGroup: restoredState.restoredToOriginalGroup,
            historyConsumed: !cachedState.recentlyClosedTabs.some(
              (candidate) => candidate.id === closeResult.recentlyClosedId,
            ),
          };
          original.keepRunning = false;
          duplicate.keepRunning = false;
          await original.view.webContents.executeJavaScript(`window.addEventListener('beforeunload', (event) => { event.preventDefault(); event.returnValue = ''; }); true`);
          const duplicateReport = await duplicateTabReport({ workspaceId: "personal" });
          const guardedResolution = await resolveDuplicateTabsOperation({
            keeperTabId: duplicate.tabId,
            closeTabIds: [original.tabId],
          });
          await writeQueue;
          console.log(JSON.stringify({ tabOrganizationProbe: {
            before,
            collapsedIdentity,
            mergedIdentity,
            closedIdentity,
            closedRecord,
            restoredIdentity,
            tabCount: workspace.tabs.size,
            tabIds: Array.from(workspace.tabs.keys()),
            targetGroupId: firstGroup.group.id,
            sourceGroupId: secondGroup.group.id,
            targetGroup: cachedState.tabGroups.find((group) => group.id === firstGroup.group.id),
            sourceGroup: cachedState.tabGroups.find((group) => group.id === secondGroup.group.id),
            mergedTabGroups: organizationTabRecords(workspace).map((tab) => ({ tabId: tab.tabId, tabGroupId: tab.tabGroupId })),
            exactDuplicateGroups: duplicateReport.exact.length,
            guardedResolution,
          } }));
        } else if (CAPTURE_ROUTE === "workspace-tabs-convergence-probe") {
          if (!isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            throw new Error(
              "QIYE_TAB_PROBE_BASE_URL is required for workspace-tabs-convergence-probe",
            );
          }
          const originURL = new URL("/origin", TAB_PROBE_BASE_URL).toString();
          const childURL = new URL("/child", TAB_PROBE_BASE_URL).toString();
          await showBrowser({
            url: originURL,
            workspaceId: "personal",
            bounds: siteViewBounds,
          });
          const workspace = activeWorkspaceBrowserContext();
          const originalTab = activeBrowserContext(workspace);
          await originalTab.view.webContents.executeJavaScript(
            `window.open(${JSON.stringify(childURL)}, '_blank')`,
          );
          for (let attempt = 0; attempt < 80 && workspace.tabs.size < 2; attempt += 1) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (workspace.tabs.size < 2) throw new Error("window.open did not create a tab");
          const popupTab = activeBrowserContext(workspace);
          for (
            let attempt = 0;
            attempt < 80 && popupTab.view.webContents.getURL() !== childURL;
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (popupTab.view.webContents.getURL() !== childURL) {
            throw new Error("window.open tab did not finish navigating to the child URL");
          }
          const before = {
            tabCount: workspace.tabs.size,
            originalTabId: originalTab.tabId,
            popupTabId: popupTab.tabId,
          };
          await loadUrlAllowingRedirectAbort(popupTab.view.webContents, originURL);
          for (
            let attempt = 0;
            attempt < 80 &&
            popupTab.view.webContents.getURL() !== originURL;
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (workspace.tabs.size !== 2 || popupTab.view.webContents.getURL() !== originURL) {
            throw new Error("converged anonymous tabs were closed or failed to navigate");
          }
          await writeQueue;
          const candidates = detectDuplicateTabs(organizationTabRecords(workspace), {
            activeTabId: workspace.activeTabId,
          });
          console.log(
            JSON.stringify({
              workspaceTabsConvergenceProbe: {
                before,
                converged: {
                  tabCount: workspace.tabs.size,
                  activeTabId: workspace.activeTabId,
                  activeWebContentsId: popupTab.view.webContents.id,
                  url: popupTab.view.webContents.getURL(),
                  exactDuplicateGroups: candidates.exact.length,
                  exactDuplicateTabIds: candidates.exact[0]?.tabs.map((tab) => tab.tabId) || [],
                },
              },
            }),
          );
        } else if (CAPTURE_ROUTE === "timeline-probe") {
          let pageDraft = null;
          if (isSafeWebUrl(TAB_PROBE_BASE_URL)) {
            const pageUrl = new URL("/timeline-source?id=42&token=secret&code=oauth#auth=bad", TAB_PROBE_BASE_URL).toString();
            await activateWorkspaceBrowserContext("personal", { restore: false });
            await openTransientBrowserTab("personal", pageUrl, { background: false });
            const context = activeBrowserContext();
            for (let attempt = 0; attempt < 30; attempt += 1) {
              try {
                const ready = await context.view.webContents.executeJavaScript("document.readyState !== 'loading'");
                if (ready) break;
              } catch {
                // The WebContents may still be committing its first document.
              }
              await new Promise((resolve) => setTimeout(resolve, 50));
            }
            await context.view.webContents.executeJavaScript(`(() => {
              const node = document.getElementById('timeline-selection');
              const range = document.createRange();
              range.selectNodeContents(node);
              const selection = window.getSelection();
              selection.removeAllRanges();
              selection.addRange(range);
            })()`);
            pageDraft = await currentPageTimelineDraft();
          }
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const before = await window.siteNest.getTimeline({ year: 2026, trackId: 'work' });
            const day = await window.siteNest.addTimelineEvent({
              trackId: 'work', workspaceId: 'work', type: 'achievement', title: 'IPC 工作成就',
              startDate: '2026-08-30', datePrecision: 'day', importance: 'major', impactDirection: 'positive', impactLevel: 5, tags: ['SAP']
            });
            await window.siteNest.addTimelineEvent({
              trackId: 'personal', workspaceId: 'personal', type: 'growth', title: 'IPC 个人成长',
              startDate: '2026-08', datePrecision: 'month', importance: 'important', impactDirection: 'negative', impactLevel: 3
            });
            await window.siteNest.addTimelineEvent({
              trackId: 'work', workspaceId: 'work', type: 'responsibility', title: 'IPC 持续职责',
              startDate: '2026', datePrecision: 'year', ongoing: true, impactDirection: 'negative', impactLevel: 2
            });
            const configured = await window.siteNest.updateTimelineSettings({ selectedYear: 2026, selectedTrackId: 'work', lastTrackId: 'work', viewMode: 'timeline' });
            applyTimelineSnapshot(configured);
            currentTaskView = 'timeline';
            navigateTo('plan');
            await loadTimelineYear(2026, { force: true });
            const workNodeCount = document.querySelectorAll('.timeline-waveform-node[data-timeline-event-id]').length;
            const workOnly = timelineState.events.every((item) => item.trackId === 'work');
            const workPath = document.querySelector('.timeline-waveform-path')?.getAttribute('d') || '';
            const listSnapshot = await window.siteNest.updateTimelineSettings({ viewMode: 'list' });
            applyTimelineSnapshot(listSnapshot);
            renderTimeline();
            const listRowCount = document.querySelectorAll('.timeline-list-row').length;
            const personalSnapshot = await window.siteNest.updateTimelineSettings({ selectedTrackId: 'personal', lastTrackId: 'personal', viewMode: 'timeline' });
            applyTimelineSnapshot(personalSnapshot);
            renderTimeline();
            const personalNodeCount = document.querySelectorAll('.timeline-waveform-node[data-timeline-event-id]').length;
            const personalOnly = timelineState.events.every((item) => item.trackId === 'personal');
            const restored = await window.siteNest.updateTimelineSettings({ selectedTrackId: 'work', lastTrackId: 'work', viewMode: 'timeline' });
            applyTimelineSnapshot(restored);
            const taskResult = await window.siteNest.addTask({ title: '转为时间轴草稿', workspaceId: 'work', status: 'done', notes: '任务备注' });
            applyTaskSnapshot(taskResult);
            const completedTask = taskState.tasks.find((item) => item.title === '转为时间轴草稿');
            const countBeforeDraft = timelineState.events.length;
            openTaskAsTimelineDraft(completedTask);
            const draft = {
              title: document.getElementById('timelineEventTitle').value,
              summary: document.getElementById('timelineSummary').value,
              relatedTaskIds: JSON.parse(document.getElementById('timelineRelatedTaskIds').value || '[]')
            };
            closeModal(document.getElementById('timelineEventModal'));
            const countAfterDraft = (await window.siteNest.getTimeline({ year: 2026, trackId: 'work' })).events.length;
            const search = await window.siteNest.searchTimeline('工作成就', 5);
            const emptyYear = await window.siteNest.getTimeline({ year: 2027, trackId: 'work' });
            return {
              beforeTracks: before.tracks.map((item) => item.id),
              workEventCount: timelineState.events.length,
              workNodeCount,
              personalNodeCount,
              workOnly,
              personalOnly,
              workPath,
              listRowCount,
              draft,
              countBeforeDraft,
              countAfterDraft,
              searchId: search.events[0]?.id || null,
              addedId: day.event.id,
              emptyYearCount: emptyYear.events.length,
              reviewTotal: timelineState.review.stats.total,
              route: currentRoute,
              view: currentTaskView
            };
          })()`);
          console.log(JSON.stringify({ timelineProbe: { ...result, pageDraft } }));
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (CAPTURE_ROUTE === "state-probe") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const state = await window.siteNest.getState();
            return {
              version: state.version,
              activeWorkspaceId: state.activeWorkspaceId,
              workspaces: state.workspaces.map((item) => item.id),
              sites: state.sites.length,
              bookmarks: state.bookmarks.length
            };
          })()`);
          console.log(JSON.stringify({ stateProbe: result }));
        } else if (CAPTURE_ROUTE === "task-probe") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const added = await window.siteNest.addTask({
              title: 'IPC 本地任务',
              workspaceId: 'work',
              priority: 'high',
              dueAt: '2030-08-30T04:00:00.000Z',
              reminderOffsets: [10]
            });
            const first = added.tasks.find((item) => item.title === 'IPC 本地任务');
            const disposable = await window.siteNest.addTask({ title: '待删除任务', workspaceId: 'personal' });
            const deletedId = disposable.tasks.find((item) => item.title === '待删除任务').id;
            await window.siteNest.deleteTask(deletedId);
            const updated = await window.siteNest.updateTask({ id: first.id, title: 'IPC 本地任务已更新', status: 'doing' });
            const reminder = updated.reminders.find((item) => item.taskId === first.id);
            const snoozed = await window.siteNest.snoozeTaskReminder(reminder.id, 5);
            const settings = await window.siteNest.updateTaskSettings({
              remindersEnabled: true,
              doNotDisturb: { enabled: true, start: '22:30', end: '07:30' }
            });
            await loadTasks();
            navigateTo('plan');
            return {
              taskCount: settings.tasks.length,
              title: settings.tasks[0].title,
              status: settings.tasks[0].status,
              reminderState: snoozed.state,
              dnd: settings.settings.doNotDisturb,
              route: currentRoute
            };
          })()`);
          console.log(JSON.stringify({ taskProbe: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "workspace-persist") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const changed = await window.siteNest.setActiveWorkspace('work');
            appState = changed.state;
            renderAll();
            navigateTo('home');
            return {
              activeWorkspaceId: appState.activeWorkspaceId,
              workspaces: appState.workspaces.map((item) => item.id)
            };
          })()`);
          console.log(JSON.stringify({ workspacePersist: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "workspace-research") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const changed = await window.siteNest.setActiveWorkspace('research');
            appState = changed.state;
            renderAll();
            navigateTo('home');
            return { activeWorkspaceId: appState.activeWorkspaceId };
          })()`);
          console.log(JSON.stringify({ workspaceResearch: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "sites-crud") {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const before = appState.sites.length;
            const added = await window.siteNest.addSite({
              name: '测试站点',
              url: 'https://example.com/',
              description: '仅用于自动化回归测试',
              color: '#9b6bdc'
            });
            const updated = await window.siteNest.updateSite({
              id: added.site.id,
              name: '测试站点已更新',
              url: 'https://example.com/docs',
              description: '更新成功',
              color: '#3e7e91'
            });
            const pinned = await window.siteNest.toggleSitePin(updated.site.id);
            await window.siteNest.reorderSite({ id: updated.site.id, direction: -1 });
            const deleted = await window.siteNest.deleteSite(updated.site.id);
            appState = deleted.state;
            renderAll();
            navigateTo('sites');
            return {
              before,
              added: added.state.sites.length,
              updatedName: updated.site.name,
              pinnedAfterToggle: pinned.site.pinned,
              afterDelete: deleted.state.sites.length
            };
          })()`);
          console.log(JSON.stringify({ sitesCrud: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "assistant-generic") {
          const added = await mainWindow.webContents.executeJavaScript(`(async () => {
            const result = await window.siteNest.addSite({
              name: '助手回归页',
              url: 'https://example.com/',
              workspaceId: 'personal',
              siteKind: 'normal',
              openMode: 'internal',
              pinned: false
            });
            appState = result.state;
            await showSite(result.site);
            return result.site.id;
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 1800));
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            const panel = await window.siteNest.getPageActions();
            const generic = panel.assistants.find((item) => item.id === 'generic-page-actions');
            const execution = await window.siteNest.executePageAction(
              'generic-page-actions',
              'save-current-page'
            );
            return {
              siteId: ${JSON.stringify(added)},
              genericMatched: Boolean(generic),
              actionStatus: execution.status,
              logPersisted: execution.logPersisted
            };
          })()`);
          console.log(JSON.stringify({ assistantGeneric: result }));
          await mainWindow.webContents.executeJavaScript(
            "setPageActionPanelOpen(true)",
          );
          await new Promise((resolve) => setTimeout(resolve, 400));
        } else if (CAPTURE_ROUTE === "automations") {
          await mainWindow.webContents.executeJavaScript(
            "navigateTo('automations')",
          );
          await new Promise((resolve) => setTimeout(resolve, 700));
        } else if (CAPTURE_ROUTE === "userscript-review-ui") {
          const reviewSource = `// ==UserScript==
// @name 安装审查示例
// @namespace local.qiye.visual
// @version 1.2.0
// @description 仅用于验证安装前的域名、权限与代码摘要界面。
// @author 栖页测试
// @match https://docs.example.com/*
// @run-at document-end
// @grant GM_addStyle
// @grant GM_getValue
// ==/UserScript==
GM_addStyle('article { line-height: 1.7; }');`;
          await mainWindow.webContents.executeJavaScript(`(async () => {
            navigateTo('automations:scripts');
            const review = await window.siteNest.reviewPastedUserScript(${JSON.stringify(reviewSource)});
            renderUserScriptReview(review);
          })()`);
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else if (CAPTURE_ROUTE.startsWith("automations-")) {
          const tab = CAPTURE_ROUTE.slice("automations-".length);
          if (!["scripts", "assistants", "schedules", "workflows", "logs", "extension"].includes(tab)) {
            throw new Error(`Unknown automation capture tab: ${tab}`);
          }
          await mainWindow.webContents.executeJavaScript(
            `navigateTo(${JSON.stringify(`automations:${tab}`)})`,
          );
          await new Promise((resolve) => setTimeout(resolve, 900));
        } else if (CAPTURE_ROUTE === "legacy-automation-route") {
          const result = await mainWindow.webContents.executeJavaScript(`(() => {
            navigateTo('signin');
            return { route: currentRoute, tab: currentAutomationTab };
          })()`);
          console.log(JSON.stringify({ legacyAutomationRoute: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (CAPTURE_ROUTE === "automation-run") {
          await mainWindow.webContents.executeJavaScript(
            "navigateTo('automations')",
          );
          const result = await mainWindow.webContents.executeJavaScript(
            "window.siteNest.runNaixiCheckin()",
          );
          console.log(
            JSON.stringify({
              automationStatus: result?.status,
              automationMessage: result?.message,
            }),
          );
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
        const image = await mainWindow.webContents.capturePage();
        await fsp.mkdir(path.dirname(path.resolve(CAPTURE_PATH)), { recursive: true });
        await fsp.writeFile(path.resolve(CAPTURE_PATH), image.toPNG());
        if (
          ["site", "nodeseek-login", "nodeseek-reset", "companion-discoverability"].includes(
            CAPTURE_ROUTE,
          ) &&
          siteView
        ) {
          const siteCapture = await siteView.webContents.capturePage();
          const parsed = path.parse(path.resolve(CAPTURE_PATH));
          await fsp.writeFile(
            path.join(parsed.dir, `${parsed.name}-site${parsed.ext || ".png"}`),
            siteCapture.toPNG(),
          );
          console.log(
            JSON.stringify({
              title: siteView.webContents.getTitle(),
              url: siteView.webContents.getURL(),
              loading: siteView.webContents.isLoading(),
            }),
          );
        }
      } catch (error) {
        console.error(`Capture route failed (${CAPTURE_ROUTE || "default"}):`, error?.stack || error?.message || error);
        process.exitCode = 1;
      } finally {
        app.exit(process.exitCode || 0);
      }
    }, 1800);
  });
  mainWindow.loadFile(path.join(PROJECT_ROOT, "renderer", "index.html"));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID);
    registerIpc();
    createMainWindow();
    void getState().then((state) => {
      startIncrementalGoogleSyncSchedule();
      const lifecycle = getWebViewLifecycleManager();
      return lifecycle.updateSettings(state.uiSettings?.browserMemory);
    }).catch((error) => {
      console.error("Unable to initialize web view lifecycle:", error?.message || error);
    });
    void initializeTaskRuntime().catch((error) => {
      console.error("Unable to initialize local task reminders:", error?.message || error);
    });
    void initializeUsageRuntime().catch((error) => {
      console.error("Unable to initialize local usage tracking:", error?.message || error);
    });
    void initializeCompanionRuntime().catch((error) => {
      console.error("Unable to initialize companion runtime:", error?.message || error);
    });
    void initializeWeatherService().catch((error) => {
      console.error("Unable to initialize weather service:", error?.message || error);
    });
    void scheduleNaixiAutomation().catch((error) => {
      console.error("Unable to schedule automation:", error?.message || error);
    });
  });
}

function detachedStateForTab(tab) {
  return {
    ...tab.browserState,
    tabId: tab.tabId,
    workspaceId: tab.workspaceId,
    detached: Boolean(tab.detached),
    webContentsId:
      tab.view && !tab.view.webContents.isDestroyed()
        ? tab.view.webContents.id
        : null,
  };
}

function sendDetachedTabState(tab) {
  const shellContents = tab?.detachedWindow?.webContents;
  if (!shellContents || shellContents.isDestroyed()) return;
  shellContents.send("detached:state", detachedStateForTab(tab));
}

function emitWorkspaceBrowserState(workspace) {
  if (!workspace) return emptyBrowserState(activeBrowserWorkspaceId);
  workspace.browserState = browserStateForWorkspace(workspace);
  if (workspace.workspaceId === activeBrowserWorkspaceId) {
    syncActiveBrowserAliases(activeBrowserContext(workspace));
    mainWindow?.webContents.send("browser:state", workspace.browserState);
  }
  return workspace.browserState;
}

function persistWorkspaceBrowserWorkspace(workspace) {
  if (!workspace || !cachedState) return;
  const firstTab = workspace.tabs.values().next().value;
  if (firstTab) {
    persistWorkspaceBrowserContext(firstTab);
    return;
  }
  const result = setWorkspaceBrowserTabsInState(
    cachedState,
    workspace.workspaceId,
    { tabs: [], activeTabId: null },
    { defaultSites: DEFAULT_SITES },
  );
  cachedState = result.state;
  void persistState().catch((error) => {
    console.error("Unable to persist empty workspace tabs:", error?.message || error);
  });
}

app.on("activate", () => {
  if (!mainWindow) createMainWindow();
  else {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", (event) => {
  const pendingUploadCount = recordSyncStore?.runtimeSummary().pendingUploadCount || 0;
  if (!quitSyncAttempted && pendingUploadCount > 0 && net.isOnline()) {
    event.preventDefault();
    quitSyncAttempted = true;
    Promise.race([
      runAutomaticIncrementalSync(),
      new Promise((resolve) => setTimeout(resolve, 1_500)),
    ]).finally(() => app.quit());
    return;
  }
  isQuitting = true;
  if (incrementalSyncDebounceTimer) clearTimeout(incrementalSyncDebounceTimer);
  incrementalSyncDebounceTimer = undefined;
  if (incrementalSyncTimer) clearInterval(incrementalSyncTimer);
  incrementalSyncTimer = undefined;
  zohoDashboardAbortController?.abort();
  taskReminderScheduler?.stop();
  if (usageTrackerTimer) clearInterval(usageTrackerTimer);
  usageTrackerTimer = undefined;
  usageTracker?.setForeground(false);
  void usageTracker?.flush().catch(() => undefined);
  if (userScriptMetricsFlushTimer) clearTimeout(userScriptMetricsFlushTimer);
  userScriptMetricsFlushTimer = undefined;
  if (userScriptMetricsDirty) {
    userScriptMetricsDirty = false;
    void persistState().catch(() => undefined);
  }
  desktopNotificationService?.closeAll();
  companionRuntimeService?.stop();
  weatherService?.stop();
  companionAIService?.cancelAll();
  if (companionWidgetAlertTimer) clearTimeout(companionWidgetAlertTimer);
  companionWidgetAlertTimer = undefined;
  companionWidgetAlertMessage = "";
  trayService?.destroy();
  webViewLifecycleManager?.stop();
  pageResourceService?.stopNetworkDetection("app-quit");
  if (automationTimer) clearTimeout(automationTimer);
  if (automationWindow && !automationWindow.isDestroyed()) {
    automationWindow.destroy();
  }
});
