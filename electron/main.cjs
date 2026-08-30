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
} = require("electron");
const { createHash, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const {
  DEFAULT_BROWSER_PROFILE_ID,
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
} = require("./state-model.cjs");
const { atomicWriteJson, createStateStore } = require("./state-store.cjs");
const { GoogleDriveSyncService } = require("./google-drive-sync.cjs");
const {
  createSyncEnvelope,
  decideSyncAction,
  normalizeRemoteEnvelope,
} = require("./google-drive-sync-data.cjs");
const { applyRemoteEnvelopeToState } = require("./google-sync-state.cjs");
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
  WebContextMenuService,
  WindowOpenPolicyService,
  resolveNavigationTarget,
  securityStateForUrl,
} = require("./browser/index.cjs");
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

const APP_ID = "local.qiye.sitehub";
const SITE_PARTITION = "persist:qiye-sites";
const DETACHED_HEADER_HEIGHT = 56;
const PROJECT_ROOT = path.resolve(__dirname, "..");
const CAPTURE_PATH = process.env.QIYE_CAPTURE_PATH;
const CAPTURE_ROUTE = process.env.QIYE_CAPTURE_ROUTE || "home";
const TAB_PROBE_BASE_URL = process.env.QIYE_TAB_PROBE_BASE_URL || "";
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
let siteViewAttached = false;
let siteViewBounds = { x: 288, y: 112, width: 1000, height: 700 };
let currentHomeUrl = "";
let currentSiteId = null;
let browserState;
let activeBrowserWorkspaceId = null;
let workspaceBrowserActivationSequence = 0;
const workspaceBrowserContexts = new Map();
let cachedState;
let stateLoadPromise;
let stateStore;
let writeQueue = Promise.resolve();
let assistantRegistry;
let assistantExecutionService;
let automationTimer;
let automationRunPromise;
let automationWindow;
let googleDriveSyncService;
let googleSyncMeta;
let googleSyncQueue = Promise.resolve();
let connectorRegistry;
let connectorConnectionService;
let zohoConnectorService;
let zohoDashboardAbortController;
let zohoDashboardRefreshPromise;
let externalProtocolService;
let downloadManager;
let managedPopupService;
let webContextMenuService;
let windowOpenPolicyService;
let connectorSecretStore;
let translationProviderRegistry;
let translationService;
let selectionActionService;
let pageTranslationController;
const translationSessionAllowedHosts = new Set();
let taskReminderScheduler;
let desktopNotificationService;
let trayService;
let appBackgroundService;
let isQuitting = false;

function dataFilePath() {
  return path.join(app.getPath("userData"), "site-nest-data.json");
}

function googleOAuthConfigPath() {
  return process.env.QIYE_GOOGLE_OAUTH_CONFIG
    ? path.resolve(process.env.QIYE_GOOGLE_OAUTH_CONFIG)
    : path.join(app.getPath("userData"), "google-oauth-client.json");
}

function googleTokenPath() {
  return path.join(app.getPath("userData"), "google-oauth-token.json");
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
  if (profileId !== DEFAULT_BROWSER_PROFILE_ID) {
    throw new Error("当前版本尚未启用独立浏览身份");
  }
  return SITE_PARTITION;
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
  const url = isSafeWebUrl(persisted.url || persisted.currentURL)
    ? String(persisted.url || persisted.currentURL)
    : "";
  const tabId = String(persisted.tabId || randomUUID());
  const siteId = persisted.siteId ? String(persisted.siteId) : null;
  const browserProfileId = String(
    persisted.browserProfileId || DEFAULT_BROWSER_PROFILE_ID,
  );
  browserPartitionForProfile(browserProfileId);
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
    currentHomeUrl:
      (isSafeWebUrl(persisted.homeURL) && persisted.homeURL) || url,
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
        (isSafeWebUrl(persisted.homeURL) && persisted.homeURL) || url || null,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      zoomFactor: 1,
      securityState: securityStateForUrl(url),
      error: "",
      siteIssue: "",
    },
    nodeSeekAutoRetryUsed: false,
    lastSapNavigationUrl: "",
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

function isSapSessionHost(rawHost) {
  const host = String(rawHost || "")
    .trim()
    .replace(/^\./, "")
    .toLowerCase();
  return (
    host === "support.sap.com" ||
    host === "me.sap.com" ||
    host === "accounts.sap.com" ||
    (/(^|\.)authentication\.eu\d+\.hana\.ondemand\.com$/.test(host) &&
      host.endsWith(".hana.ondemand.com"))
  );
}

function isSapSessionUrl(rawUrl) {
  try {
    return isSapSessionHost(new URL(rawUrl).hostname);
  } catch {
    return false;
  }
}

function isSapSearchTarget(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "me.sap.com" &&
      (parsed.pathname.startsWith("/notes/") ||
        parsed.pathname.startsWith("/servicessupport/search/"))
    );
  } catch {
    return false;
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

async function getState() {
  if (cachedState) return cachedState;
  if (!stateLoadPromise) {
    stateLoadPromise = getStateStore()
      .load()
      .then((loaded) => {
        cachedState = loaded.state;
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
      await getStateStore().save(JSON.parse(snapshot));
    });
  return writeQueue;
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
    message: "本次操作会将页面中的可见文字发送到当前翻译服务。",
    detail: `${hostname}\n整页翻译不读取密码、Cookie、输入框值、隐藏表单和授权信息；划词翻译只使用你主动选择的文字。`,
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

function getBrowserServices() {
  if (managedPopupService && webContextMenuService && downloadManager) {
    return {
      downloads: downloadManager,
      externalProtocol: externalProtocolService,
      managedPopups: managedPopupService,
      contextMenus: webContextMenuService,
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
      translatePage: ({ context }) => showTranslationPageMenu(context),
      addCurrentPage: ({ context }) => void addCurrentPageToSites(context),
      openPageActions: () => mainWindow?.webContents.send("assistants:open-panel"),
      inspectResource: () => emitBrowserNotice("资源检测将在资源治理阶段启用"),
    },
  });
  return {
    downloads: downloadManager,
    externalProtocol: externalProtocolService,
    managedPopups: managedPopupService,
    contextMenus: webContextMenuService,
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
    };
  } catch (error) {
    if (error?.code !== "ENOENT") {
      console.warn("Google sync metadata could not be read");
    }
    googleSyncMeta = {
      lastSyncAt: null,
      lastDirection: null,
      lastMessage: null,
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
  const statusError = serviceStatus?.error;
  const configured = Boolean(serviceStatus?.configured);
  return {
    configured,
    signedIn: Boolean(serviceStatus?.signedIn),
    email: serviceStatus?.email || null,
    lastSyncAt: meta.lastSyncAt || null,
    lastDirection: meta.lastDirection || null,
    status: !configured
      ? "not-configured"
      : statusError
        ? "error"
        : serviceStatus?.signedIn
          ? "connected"
          : "ready",
    error: statusError?.message || "",
    errorCode: statusError?.code || null,
  };
}

function friendlyGoogleSyncError(error) {
  if (error?.status === 403 && String(error?.code || "").startsWith("GOOGLE_DRIVE_")) {
    const wrapped = new Error(
      "Google Drive API 尚未启用、权限尚未生效，或当前账号不在 OAuth 测试用户中",
    );
    wrapped.code = error.code;
    return wrapped;
  }
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

function runGoogleSyncOperation(task) {
  const operation = googleSyncQueue.catch(() => undefined).then(task);
  googleSyncQueue = operation.catch(() => undefined);
  return operation;
}

async function backupStateBeforeGoogleRestore(state) {
  await atomicWriteJson(googleSyncBackupPath(), state);
}

async function applyGoogleRemoteEnvelope(remoteEnvelope) {
  await writeQueue.catch(() => undefined);
  const localState = await getState();
  await backupStateBeforeGoogleRestore(localState);
  const applied = applyRemoteEnvelopeToState(localState, remoteEnvelope, {
    defaultSites: DEFAULT_SITES,
  });
  cachedState = await getStateStore().save(applied.state);
  await activateWorkspaceBrowserContext(cachedState.activeWorkspaceId);
  return cachedState;
}

async function signInGoogle() {
  return runGoogleSyncOperation(async () => {
    try {
      const serviceStatus = await getGoogleDriveSyncService().signIn();
      return googleSyncUiStatus(serviceStatus, await loadGoogleSyncMeta());
    } catch (error) {
      throw friendlyGoogleSyncError(error);
    }
  });
}

async function signOutGoogle() {
  return runGoogleSyncOperation(async () => {
    try {
      const serviceStatus = await getGoogleDriveSyncService().signOut();
      return googleSyncUiStatus(serviceStatus, await loadGoogleSyncMeta());
    } catch (error) {
      throw friendlyGoogleSyncError(error);
    }
  });
}

async function syncGoogleNow() {
  return runGoogleSyncOperation(async () => {
    try {
      const service = getGoogleDriveSyncService();
      const currentStatus = await service.status();
      if (!currentStatus.signedIn) {
        throw Object.assign(new Error("请先连接 Google 账号"), {
          code: "GOOGLE_NOT_SIGNED_IN",
        });
      }
      const remoteFile = await service.readRemote();
      const localEnvelope = createSyncEnvelope(await getState());
      const remoteEnvelope = remoteFile.found
        ? normalizeRemoteEnvelope(remoteFile.data)
        : null;
      const decision = decideSyncAction({
        localEnvelope,
        remoteEnvelope,
      });
      let message;
      let state = await getState();
      if (decision.direction === "upload") {
        await service.writeRemote(localEnvelope);
        message = decision.action === "first-upload"
          ? "已创建栖页云端同步数据"
          : "已将较新的本机数据同步到 Google Drive";
      } else if (decision.direction === "download") {
        state = await applyGoogleRemoteEnvelope(remoteEnvelope);
        message = decision.action === "first-download"
          ? "已从 Google Drive 恢复栖页数据"
          : "已使用较新的云端数据更新本机";
      } else if (decision.reason === "equal-timestamp-conflict") {
        throw Object.assign(
          new Error("本机与云端数据时间相同但内容不同，请选择“从云端恢复”或先修改本机数据后再同步"),
          { code: "GOOGLE_SYNC_CONFLICT" },
        );
      } else {
        message = "本机与 Google Drive 数据已经一致";
      }
      const now = new Date().toISOString();
      const meta = await saveGoogleSyncMeta({
        lastSyncAt: now,
        lastDirection: decision.direction,
        lastMessage: message,
      });
      return {
        ...googleSyncUiStatus(await service.status(), meta),
        state,
        syncResult: { ...decision, message },
      };
    } catch (error) {
      throw friendlyGoogleSyncError(error);
    }
  });
}

async function restoreGoogleCloudData() {
  return runGoogleSyncOperation(async () => {
    try {
      const service = getGoogleDriveSyncService();
      const currentStatus = await service.status();
      if (!currentStatus.signedIn) {
        throw Object.assign(new Error("请先连接 Google 账号"), {
          code: "GOOGLE_NOT_SIGNED_IN",
        });
      }
      const remoteFile = await service.readRemote();
      if (!remoteFile.found) {
        throw Object.assign(new Error("Google Drive 中还没有栖页同步数据"), {
          code: "GOOGLE_SYNC_REMOTE_MISSING",
        });
      }
      const remoteEnvelope = normalizeRemoteEnvelope(remoteFile.data);
      const state = await applyGoogleRemoteEnvelope(remoteEnvelope);
      const now = new Date().toISOString();
      const message = "已从 Google Drive 恢复栖页数据；恢复前的本机数据已备份";
      const meta = await saveGoogleSyncMeta({
        lastSyncAt: now,
        lastDirection: "download",
        lastMessage: message,
      });
      return {
        ...googleSyncUiStatus(await service.status(), meta),
        state,
        syncResult: {
          action: "restore",
          direction: "download",
          reason: "manual-restore",
          message,
        },
      };
    } catch (error) {
      throw friendlyGoogleSyncError(error);
    }
  });
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
  const removed = [];
  for (const tab of ordered) {
    if (tab.allowDuplicate) continue;
    const url = runtimeTabURL(tab);
    if (!isSafeWebUrl(url)) continue;
    const key = tab.currentSiteId ? `site:${tab.currentSiteId}` : `url:${url}`;
    if (!seen.has(key)) {
      seen.add(key);
      continue;
    }
    workspace.tabs.delete(tab.tabId);
    closeDetachedWindow(tab, "close");
    destroySiteView(tab);
    removed.push(tab.tabId);
  }
  if (workspace.activeTabId && !workspace.tabs.has(workspace.activeTabId)) {
    workspace.activeTabId = workspace.tabs.keys().next().value || null;
  }
  return removed;
}

function persistWorkspaceBrowserContext(context, patch = {}) {
  if (!context || !cachedState) return;
  const currentURL = isSafeWebUrl(patch.currentURL)
    ? patch.currentURL
    : isSafeWebUrl(context.view?.webContents.getURL())
      ? context.view.webContents.getURL()
      : context.browserState.currentURL;
  if (currentURL) {
    context.browserState.currentURL = currentURL;
    context.browserState.url = currentURL;
  }
  const workspace = workspaceBrowserContexts.get(context.workspaceId);
  if (!workspace) return;
  const removedDuplicateTabs = reconcileRuntimeDuplicateTabs(workspace);
  const now = new Date().toISOString();
  const tabs = Array.from(workspace.tabs.values())
    .map((tab) => {
      const liveURL =
        tab.view && !tab.view.webContents.isDestroyed()
          ? tab.view.webContents.getURL()
          : "";
      const url =
        (isSafeWebUrl(liveURL) && liveURL) || tab.browserState.currentURL;
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
  if (removedDuplicateTabs.length) emitWorkspaceBrowserState(workspace);
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
  context.view.setBounds(siteViewBounds);
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
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
  applySiteViewBounds(siteViewBounds, context);
}

function detachSiteView(context = activeBrowserContext()) {
  if (!context) return;
  context.attachRequested = false;
  if (!context.view || context.viewOwner !== "main") return;
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.contentView.removeChildView(context.view);
  }
  context.attached = false;
  context.viewOwner = "none";
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
}

function detachSiteViewFromOwner(context) {
  if (!context?.view || context.viewOwner === "none") return;
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

function destroySiteView(context = activeBrowserContext()) {
  if (!context?.view) return;
  const contents = context.view.webContents;
  if (pageTranslationController) pageTranslationController.clear(context);
  if (selectionActionService) selectionActionService.clear(contents);
  context.attachRequested = false;
  detachSiteViewFromOwner(context);
  context.view = null;
  if (!contents.isDestroyed()) contents.close();
  if (context.workspaceId === activeBrowserWorkspaceId) syncActiveBrowserAliases(context);
}

function getPersistentSiteSession() {
  if (persistentSiteSession) return persistentSiteSession;
  persistentSiteSession = session.fromPartition(
    browserPartitionForProfile(DEFAULT_BROWSER_PROFILE_ID),
    { cache: true },
  );
  persistentSiteSession.setPermissionRequestHandler(
    (_contents, _permission, callback) => callback(false),
  );
  persistentSiteSession.setPermissionCheckHandler(() => false);
  persistentSiteSession.setUserAgent(
    persistentSiteSession
      .getUserAgent()
      .replace(/\sElectron\/[^\s]+/g, "")
      .replace(/\ssite-nest-desktop\/[^\s]+/g, ""),
  );
  getBrowserServices().downloads.attach(persistentSiteSession);
  persistentSiteSession.readyPromise = persistentSiteSession
    .setProxy({ mode: "system" })
    .catch((error) => console.warn("Unable to apply system proxy:", error.message));
  return persistentSiteSession;
}

async function waitForPersistentSiteSession() {
  const siteSession = getPersistentSiteSession();
  await siteSession.readyPromise;
  return siteSession;
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
    const hasRejectedAuthState = /potentially malicious character/i.test(
      `${title}\n${body}`,
    );
    compactBrowserState({
      siteIssue: hasRejectedAuthState ? "sap-auth-state" : "",
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
  const siteSession = await waitForPersistentSiteSession();
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
  const siteSession = await waitForPersistentSiteSession();
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
  const siteSession = await waitForPersistentSiteSession();
  const retryUrl = isSapSearchTarget(context.lastSapNavigationUrl)
    ? context.lastSapNavigationUrl
    : "https://me.sap.com/home";
  const cookies = await siteSession.cookies.get({});
  const sapCookies = cookies.filter((cookie) => isSapSessionHost(cookie.domain));
  const storageOrigins = new Set([
    "https://support.sap.com",
    "https://me.sap.com",
    "https://accounts.sap.com",
  ]);
  try {
    storageOrigins.add(new URL(currentUrl).origin);
  } catch {
    // Keep the known SAP origins above.
  }

  compactBrowserState({ loading: true, error: "", siteIssue: "" }, context);
  await Promise.all(
    sapCookies.map((cookie) => {
      const cookieHost = String(cookie.domain || "").replace(/^\./, "");
      const cookiePath = cookie.path || "/";
      const protocol = cookie.secure ? "https" : "http";
      return siteSession.cookies.remove(
        `${protocol}://${cookieHost}${cookiePath}`,
        cookie.name,
      );
    }),
  );
  await Promise.all(
    Array.from(storageOrigins).map((origin) =>
      siteSession.clearStorageData({
        origin,
        storages: [
          "localstorage",
          "indexdb",
          "serviceworkers",
          "cachestorage",
        ],
      }),
    ),
  );
  await Promise.all([
    siteSession.clearCache(),
    siteSession.clearAuthCache(),
  ]);
  await siteSession.closeAllConnections();
  await siteSession.clearHostResolverCache();
  destroySiteView(context);
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
  getPersistentSiteSession();

  const view = new WebContentsView({
    webPreferences: {
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
  view.webContents.on("will-navigate", (event, url) => {
    if (isSafeWebUrl(url)) return;
    event.preventDefault();
    void browserServices.externalProtocol.open(url, browserOwnerWindow(context));
  });
  view.webContents.on("did-start-loading", () => {
    if (pageTranslationController) pageTranslationController.clear(context);
    if (selectionActionService) selectionActionService.clear(view.webContents);
    compactBrowserState(
      { loading: true, error: "", siteIssue: "" },
      context,
    );
  });
  view.webContents.on("did-stop-loading", () => {
    compactBrowserState({
      loading: false,
      title: view.webContents.getTitle(),
      url: view.webContents.getURL(),
      securityState: securityStateForUrl(view.webContents.getURL()),
    }, context);
    persistWorkspaceBrowserContext(context, {
      currentURL: view.webContents.getURL(),
    });
    setTimeout(() => void inspectKnownSiteIssue(context), 350);
  });
  view.webContents.on("did-finish-load", () => {
    void currentTranslationSettings().then((settings) =>
      getTranslationServices().selection.installTrigger(
        view.webContents,
        settings.selectionButtonEnabled !== false,
      ),
    );
    setTimeout(() => void maybeAutoTranslate(context), 150);
  });
  view.webContents.on("did-navigate", (_event, url) => {
    compactBrowserState({ url, securityState: securityStateForUrl(url), error: "" }, context);
    persistWorkspaceBrowserContext(context, { currentURL: url });
  });
  view.webContents.on(
    "did-navigate-in-page",
    (_event, url, isMainFrame) => {
      if (isMainFrame) {
        if (pageTranslationController) void pageTranslationController.restore(context);
        if (selectionActionService) selectionActionService.clear(view.webContents);
        compactBrowserState({ url, securityState: securityStateForUrl(url), error: "" }, context);
        persistWorkspaceBrowserContext(context, { currentURL: url });
        setTimeout(() => void maybeAutoTranslate(context), 150);
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
    },
  );
  view.webContents.on("render-process-gone", () => {
    if (pageTranslationController) pageTranslationController.clear(context);
    if (selectionActionService) selectionActionService.clear(view.webContents);
    compactBrowserState({
      loading: false,
      error: "页面进程已停止，请点击刷新重试",
    }, context);
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
    await waitForPersistentSiteSession();
    if (
      activationSequence !== workspaceBrowserActivationSequence ||
      activeBrowserWorkspaceId !== id
    ) {
      return workspace.browserState;
    }
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
    void loadUrlAllowingRedirectAbort(
      context.view.webContents,
      context.browserState.currentURL,
    ).catch((error) => {
      compactBrowserState(
        {
          loading: false,
          error: error?.message || "页面加载失败",
          url: context.browserState.currentURL,
        },
        context,
      );
    });
  } else {
    compactBrowserState(
      {
        title: context.view.webContents.getTitle(),
        url: liveURL || context.browserState.currentURL,
        loading: context.view.webContents.isLoading(),
      },
      context,
    );
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

async function ensureRuntimeTabView(tab, options = {}) {
  await waitForPersistentSiteSession();
  ensureSiteView(tab);
  const targetURL = normalizeUrl(options.url || tab.browserState.currentURL);
  const liveURL = tab.view.webContents.getURL();
  if (!liveURL || options.forceURL) {
    compactBrowserState(
      { loading: true, error: "", siteIssue: "", url: targetURL },
      tab,
    );
    try {
      await loadUrlAllowingRedirectAbort(tab.view.webContents, targetURL);
    } catch (error) {
      compactBrowserState(
        {
          loading: false,
          error: error?.message || "页面加载失败",
          url: targetURL,
        },
        tab,
      );
    }
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

async function switchStoredActiveWorkspace(workspaceId) {
  const state = await getState();
  if (state.activeWorkspaceId === workspaceId) return state;
  const switched = setActiveWorkspaceInState(state, workspaceId, {
    defaultSites: DEFAULT_SITES,
  });
  cachedState = switched.state;
  await persistState();
  return cachedState;
}

async function selectBrowserTab(payload) {
  const found = findRuntimeTab(payload?.tabId || payload);
  if (!found) throw new Error("找不到要选择的网页标签");
  const { workspace, tab } = found;
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
  tab.lastActiveAt = new Date().toISOString();
  if (tab.detached) {
    tab.detachedWindow?.show();
    tab.detachedWindow?.focus();
    persistWorkspaceBrowserWorkspace(workspace);
    return emitWorkspaceBrowserState(workspace);
  }
  tab.attachRequested = true;
  await ensureRuntimeTabView(tab);
  if (
    activeBrowserWorkspaceId === workspace.workspaceId &&
    workspace.activeTabId === tab.tabId &&
    tab.attachRequested
  ) {
    attachSiteView(tab);
    if (payload?.bounds) applySiteViewBounds(payload.bounds, tab);
  }
  persistWorkspaceBrowserWorkspace(workspace);
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
    reliableContext: input.reliableContext || null,
    createdAt: input.createdAt,
    lastActiveAt: input.lastActiveAt,
    favicon: input.favicon,
  });
  if (isSapSearchTarget(url)) tab.lastSapNavigationUrl = url;
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
  const existing = findRuntimeTabByReliableContext(workspace, options.reliableContext) ||
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
    activate: options.background !== true,
  });
  if (options.background === true) {
    await ensureRuntimeTabView(tab, { url, forceURL: true });
    persistWorkspaceBrowserWorkspace(workspace);
    return emitWorkspaceBrowserState(workspace);
  }
  if (workspaceId === activeBrowserWorkspaceId) {
    return selectBrowserTab({ tabId: tab.tabId, bounds: options.bounds });
  }
  await ensureRuntimeTabView(tab, { url, forceURL: true });
  persistWorkspaceBrowserWorkspace(workspace);
  return emitWorkspaceBrowserState(workspace);
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
  const state = await getState();
  const requestedSiteId = String(payload?.siteId || "");
  const storedSite = state.sites.find((site) => site.id === requestedSiteId) || null;
  const workspaceId = String(
    storedSite?.workspaceId || payload?.workspaceId || state.activeWorkspaceId,
  );
  const url = normalizeUrl(
    payload?.url || storedSite?.url || activeBrowserContext()?.currentHomeUrl,
  );

  if (state.activeWorkspaceId !== workspaceId) {
    const switched = setActiveWorkspaceInState(state, workspaceId, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = switched.state;
    await persistState();
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
    return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds });
  }
  return selectBrowserTab({ tabId: tab.tabId, bounds: payload?.bounds });
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
      { type: "separator" },
      { label: "关闭页签", click: () => select("close") },
    ]);
    menu.popup({
      window: owner,
      callback: () => resolve({ action: selectedAction, tabId: source.tabId }),
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
          let target;
          try {
            target = resolveNavigationTarget(pasted);
          } catch (error) {
            emitBrowserNotice(error?.message || "无法识别剪贴板内容", "error");
            return;
          }
          void browserActionForContext(context, "navigate", target.url).catch((error) => {
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
    await persistState();
    if (site.openMode === "external") {
      await activateWorkspaceBrowserContext(site.workspaceId, { bounds });
    }
    state = cachedState;
    site = state.sites.find((item) => item.id === String(siteId || ""));
  }
  site.lastOpenedAt = new Date().toISOString();
  await persistState();
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
      contents.reload();
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
      const target = resolveNavigationTarget(value);
      context.currentSiteId = null;
      context.currentHomeUrl = target.url;
      syncActiveBrowserAliases(context);
      persistWorkspaceBrowserContext(context, {
        currentURL: context.currentHomeUrl,
      });
      compactBrowserState(
        { loading: true, error: "", siteIssue: "", url: context.currentHomeUrl },
        context,
      );
      await loadUrlAllowingRedirectAbort(contents, context.currentHomeUrl);
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

function applyDetachedViewBounds(tab) {
  const win = tab?.detachedWindow;
  if (!tab?.view || !win || win.isDestroyed()) return;
  const bounds = win.getContentBounds();
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
  applyDetachedViewBounds(tab);
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
  const orderedTabs = Array.from(workspace.tabs.values());
  const closedIndex = orderedTabs.findIndex((item) => item === tab);
  closeDetachedWindow(tab, "close");
  destroySiteView(tab);
  workspace.tabs.delete(tab.tabId);
  if (workspace.activeTabId === tab.tabId) {
    const remaining = Array.from(workspace.tabs.values());
    workspace.activeTabId =
      remaining[Math.min(closedIndex, remaining.length - 1)]?.tabId || null;
  }
  persistWorkspaceBrowserWorkspace(workspace);
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
  return emitWorkspaceBrowserState(workspace);
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
  automationRunPromise = performNaixiCheckin(options).finally(() => {
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
  await persistState();
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
    listPending: async () => {
      const state = await getState();
      if (!state.taskSettings.remindersEnabled) return [];
      const openTaskIds = new Set(state.localTasks.filter((task) => !["done", "cancelled"].includes(task.status)).map((task) => task.id));
      return state.taskReminders.filter((reminder) =>
        ["pending", "snoozed"].includes(reminder.state) && openTaskIds.has(reminder.taskId),
      );
    },
    fireReminder: fireTaskReminder,
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

function registerIpc() {
  ipcMain.handle("state:get", () => getState());
  ipcMain.handle("settings:update-ui", async (_event, patch) => {
    const state = await getState();
    const result = updateUiSettingsInState(state, patch, {
      defaultSites: DEFAULT_SITES,
    });
    cachedState = result.state;
    await persistState();
    return { state: cachedState, uiSettings: result.uiSettings };
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
  ipcMain.handle("google:sign-in", () => signInGoogle());
  ipcMain.handle("google:sign-out", () => signOutGoogle());
  ipcMain.handle("google:sync-now", () => syncGoogleNow());
  ipcMain.handle("google:restore", () => restoreGoogleCloudData());
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
  ipcMain.on("browser:hide", () => detachSiteView(activeBrowserContext()));
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
  ipcMain.handle("browser:show-tab-context-menu", (event, payload) =>
    showBrowserTabContextMenu(event, payload),
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
  ipcMain.handle("browser:detach-tab", (_event, payload) =>
    detachBrowserTab(payload),
  );
  ipcMain.handle("browser:reattach-tab", (_event, payload) =>
    reattachBrowserTab(payload),
  );
  ipcMain.handle("browser:focus-detached-tab", (_event, payload) =>
    focusDetachedBrowserTab(payload),
  );
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
  ipcMain.handle("tasks:delete", (_event, taskId) =>
    mutateTaskState((state) => deleteTaskFromState(state, taskId)),
  );
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
    return {
      logs: Array.isArray(state.assistantExecutionLogs)
        ? state.assistantExecutionLogs
        : [],
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
      height: 48,
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
          CAPTURE_ROUTE === "google-live-sign-in" ||
          CAPTURE_ROUTE === "google-live-sync"
        ) {
          const result = await mainWindow.webContents.executeJavaScript(`(async () => {
            setGoogleSyncPopoverOpen(true);
            let status = await window.siteNest.googleSyncStatus();
            if (!status.signedIn) status = await window.siteNest.googleSignIn();
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
            };
          })()`);
          console.log(JSON.stringify({ googleLiveProbe: result }));
          await new Promise((resolve) => setTimeout(resolve, 500));
        } else if (["settings", "settings-popup", "settings-translation", "settings-tasks"].includes(CAPTURE_ROUTE)) {
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
          }
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
            `(() => { window.open(${JSON.stringify(new URL("/popup-oauth", TAB_PROBE_BASE_URL).toString())}, 'oauthPopup', 'popup,width=620,height=680'); return true; })()`,
          );
          const messages = await waitForPopupMessages(3);
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
          const original = {
            tabId: originalTab.tabId,
            webContentsId: originalTab.view.webContents.id,
            url: originalTab.view.webContents.getURL(),
          };
          await mainWindow.webContents.executeJavaScript(
            `window.siteNest.duplicateBrowserTab(${JSON.stringify(originalTab.tabId)}, ${JSON.stringify(siteViewBounds)})`,
          );
          const browserCopy = activeBrowserContext(workspace);
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
          await mainWindow.webContents.executeJavaScript(
            `window.siteNest.duplicateSiteTab(${JSON.stringify(added.site.id)}, ${JSON.stringify(siteViewBounds)})`,
          );
          const siteCopy = activeBrowserContext(workspace);
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
            (workspace.tabs.size !== 1 ||
              popupTab.view.webContents.getURL() !== originURL);
            attempt += 1
          ) {
            await new Promise((resolve) => setTimeout(resolve, 25));
          }
          if (
            workspace.tabs.size !== 1 ||
            popupTab.view.webContents.getURL() !== originURL
          ) {
            throw new Error("converged anonymous tabs were not reconciled");
          }
          await writeQueue;
          console.log(
            JSON.stringify({
              workspaceTabsConvergenceProbe: {
                before,
                converged: {
                  tabCount: workspace.tabs.size,
                  activeTabId: workspace.activeTabId,
                  keptTabId: popupTab.tabId,
                  keptWebContentsId: popupTab.view.webContents.id,
                  url: popupTab.view.webContents.getURL(),
                },
              },
            }),
          );
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
        } else if (CAPTURE_ROUTE.startsWith("automations-")) {
          const tab = CAPTURE_ROUTE.slice("automations-".length);
          if (!["assistants", "workflows", "logs", "extension"].includes(tab)) {
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
          ["site", "nodeseek-login", "nodeseek-reset", "assistant-generic"].includes(
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
      } finally {
        app.exit(0);
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
    void initializeTaskRuntime().catch((error) => {
      console.error("Unable to initialize local task reminders:", error?.message || error);
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

app.on("before-quit", () => {
  isQuitting = true;
  zohoDashboardAbortController?.abort();
  taskReminderScheduler?.stop();
  desktopNotificationService?.closeAll();
  trayService?.destroy();
  if (automationTimer) clearTimeout(automationTimer);
  if (automationWindow && !automationWindow.isDestroyed()) {
    automationWindow.destroy();
  }
});
