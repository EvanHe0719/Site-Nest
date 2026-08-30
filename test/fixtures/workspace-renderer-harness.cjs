const path = require("node:path");
const fsp = require("node:fs/promises");
const { app, BrowserWindow, ipcMain } = require("electron");

const scenario = process.env.QIYE_WORKSPACE_HARNESS_SCENARIO || "isolation";
const width = Number(process.env.QIYE_WORKSPACE_HARNESS_WIDTH) || 1480;
const height = Number(process.env.QIYE_WORKSPACE_HARNESS_HEIGHT) || 920;
const capturePath = String(process.env.QIYE_WORKSPACE_HARNESS_CAPTURE_PATH || "");
const userDataPath = String(process.env.QIYE_WORKSPACE_HARNESS_USER_DATA || "");
if (userDataPath) app.setPath("userData", path.resolve(userDataPath));
const rendererPath = path.resolve(__dirname, "..", "..", "renderer", "index.html");
const preloadPath = path.resolve(__dirname, "workspace-renderer-preload.cjs");

const clone = (value) => JSON.parse(JSON.stringify(value));
const emptyPersistedBrowserState = () => ({
  activeTabId: null,
  tabs: [],
  activeSiteId: null,
  currentURL: null,
  homeURL: null,
  updatedAt: null,
});

const workspaces = [
  { id: "personal", name: "个人", type: "personal", icon: "home", sortOrder: 0, isSystem: true },
  { id: "work", name: "工作", type: "work", icon: "grid", sortOrder: 1, isSystem: true },
  { id: "research", name: "研究", type: "research", icon: "search", sortOrder: 2, isSystem: true },
];

const sites = [
  {
    id: "personal-site",
    name: "个人站点",
    shortName: "个",
    url: "https://personal.example.test/inside",
    color: "#5b7cfa",
    workspaceId: "personal",
    browserProfileId: "default",
    siteKind: "normal",
    openMode: "internal",
    pinned: true,
    order: 0,
  },
  {
    id: "work-site",
    name: "工作站点",
    shortName: "工",
    url: "https://work.example.test/ticket",
    color: "#16a085",
    workspaceId: "work",
    browserProfileId: "default",
    siteKind: "workApp",
    openMode: "internal",
    pinned: true,
    order: 0,
  },
  {
    id: "personal-site-two",
    name: "个人站点二",
    shortName: "二",
    url: "https://second.example.test/article",
    color: "#9b6bdc",
    workspaceId: "personal",
    browserProfileId: "default",
    siteKind: "normal",
    openMode: "internal",
    pinned: true,
    order: 1,
  },
  {
    id: "work-shared-site",
    name: "工作同址入口",
    shortName: "同",
    url: "https://personal.example.test/inside",
    color: "#d39b32",
    workspaceId: "work",
    browserProfileId: "default",
    siteKind: "workApp",
    openMode: "internal",
    pinned: true,
    order: 1,
  },
];

const state = {
  version: 4,
  workspaces,
  activeWorkspaceId: "personal",
  sites,
  bookmarks: [
    { id: "bookmark-one", name: "示例书签", url: "https://bookmark.example.test/one", folder: "测试", sourceProfile: "Evan" },
    { id: "bookmark-two", name: "工作书签", url: "https://bookmark.example.test/two", folder: "工作", sourceProfile: "Evan" },
  ],
  importMeta: {
    profileId: "Default",
    profileName: "Evan",
    scanned: 2,
    added: 2,
    total: 2,
    importedAt: "2026-08-29T12:30:00.000Z",
  },
  browserProfiles: [
    {
      id: "default",
      name: "默认身份",
      type: "persistentPartition",
      partition: "persist:qiye-sites",
      isSystem: true,
      isReal: true,
    },
  ],
  workspaceBrowserStates: {
    personal: emptyPersistedBrowserState(),
    work: emptyPersistedBrowserState(),
    research: emptyPersistedBrowserState(),
  },
  uiSettings: { sessionVisibility: "all", contextAssistantCollapsed: false },
  connectorConnections: [],
  connectorExecutions: [],
  externalObjectLinks: [],
  assistantSettings: {},
  assistantExecutionLogs: [],
  automations: {
    naixi: {
      enabled: false,
      time: "08:30",
      status: "disabled",
      message: "测试夹具未启用自动化",
      lastRunAt: null,
      lastSuccessAt: null,
      lastSuccessDate: null,
    },
  },
};

const googleSyncScenario =
  scenario === "google-sync-ui" || scenario === "google-sync-visual";
const googleSyncState = {
  configured: googleSyncScenario,
  signedIn: false,
  email: "",
  lastSyncAt: null,
  status: googleSyncScenario ? "idle" : "unavailable",
  error: "",
};

const trace = {
  showBrowser: [],
  hideBrowser: 0,
  browserBounds: [],
  workspaceRequests: [],
  tabActions: [],
  focusedDetachedTabs: [],
  googleActions: [],
  copiedTabUrls: [],
  externalTabUrls: [],
  nativeTabContextMenus: [],
  chromeActions: [],
  mounted: {
    attached: false,
    workspaceId: null,
    tabId: null,
    siteId: null,
    url: null,
    webContentsId: null,
  },
};

const detachedTabIds = new Set();
const webContentsIds = new Map();
let tabSequence = 0;
let webContentsSequence = 7000;
let nextTabContextMenuAction = null;

function siteForWorkspace(workspaceId, siteId) {
  return state.sites.find(
    (site) => site.id === siteId && site.workspaceId === workspaceId,
  );
}

function updatePersistedAliases(workspaceId) {
  const persisted = state.workspaceBrowserStates[workspaceId] ||
    emptyPersistedBrowserState();
  const active = persisted.tabs.find((tab) => tab.tabId === persisted.activeTabId) ||
    persisted.tabs[0] ||
    null;
  persisted.activeTabId = active?.tabId || null;
  persisted.activeSiteId = active?.siteId || null;
  persisted.currentURL = active?.url || null;
  persisted.homeURL = active?.homeURL || active?.url || null;
  persisted.updatedAt = active?.updatedAt || null;
  state.workspaceBrowserStates[workspaceId] = persisted;
  return persisted;
}

function webContentsIdForTab(tabId) {
  if (!webContentsIds.has(tabId)) {
    webContentsSequence += 1;
    webContentsIds.set(tabId, webContentsSequence);
  }
  return webContentsIds.get(tabId);
}

function createPersistedTab(workspaceId, site, url, options = {}) {
  tabSequence += 1;
  const tabId = `tab-${workspaceId}-${tabSequence}`;
  webContentsIdForTab(tabId);
  const tab = {
    tabId,
    sessionId: tabId,
    workspaceId,
    siteId: site?.id || null,
    browserProfileId: options.browserProfileId || site?.browserProfileId || "default",
    title: site?.name || new URL(url).hostname,
    url,
    normalizedUrl: url,
    favicon: null,
    homeURL: site?.url || url,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
    loadingState: "idle",
    errorState: null,
    updatedAt: new Date().toISOString(),
  };
  if (options.allowDuplicate) tab.allowDuplicate = true;
  return tab;
}

function compactBrowserState(workspaceId) {
  const persisted = updatePersistedAliases(workspaceId);
  const activeTab = persisted.tabs.find((tab) => tab.tabId === persisted.activeTabId) || null;
  const activeDetached = Boolean(activeTab && detachedTabIds.has(activeTab.tabId));
  const site = activeTab
    ? siteForWorkspace(workspaceId, activeTab.siteId)
    : null;
  const hasOpenPage = Boolean(activeTab?.url && !activeDetached);
  const tabs = persisted.tabs.map((tab) => ({
    tabId: tab.tabId,
    sessionId: tab.sessionId || tab.tabId,
    workspaceId,
    siteId: tab.siteId || null,
    browserProfileId: tab.browserProfileId || "default",
    title: tab.title || "",
    url: tab.url,
    normalizedUrl: tab.normalizedUrl || tab.url,
    favicon: tab.favicon || null,
    createdAt: tab.createdAt || tab.updatedAt || null,
    lastActiveAt: tab.lastActiveAt || tab.updatedAt || null,
    loadingState: tab.loadingState || "idle",
    errorState: tab.errorState || null,
    loading: false,
    detached: detachedTabIds.has(tab.tabId),
    active: tab.tabId === persisted.activeTabId,
    allowDuplicate: tab.allowDuplicate === true,
    webContentsId: webContentsIdForTab(tab.tabId),
  }));
  return {
    workspaceId,
    activeTabId: persisted.activeTabId,
    tabs,
    siteId: hasOpenPage ? activeTab.siteId || null : null,
    activeSiteId: hasOpenPage ? activeTab.siteId || null : null,
    hasOpenPage,
    title: hasOpenPage ? activeTab.title || site?.name || "" : "",
    url: hasOpenPage ? activeTab.url : "",
    currentURL: hasOpenPage ? activeTab.url : null,
    homeURL: hasOpenPage ? activeTab.homeURL || site?.url || activeTab.url : null,
    loading: false,
    canGoBack: false,
    canGoForward: false,
    zoomFactor: 1,
    error: "",
    siteIssue: "",
  };
}

function setMountedFromWorkspace(workspaceId) {
  const browserState = compactBrowserState(workspaceId);
  trace.mounted = browserState.hasOpenPage
    ? {
        attached: true,
        workspaceId,
        tabId: browserState.activeTabId,
        siteId: browserState.siteId,
        url: browserState.url,
        webContentsId: webContentsIdForTab(browserState.activeTabId),
      }
    : {
        attached: false,
        workspaceId: null,
        tabId: null,
        siteId: null,
        url: null,
        webContentsId: null,
      };
  return browserState;
}

function workspaceResponseSnapshot(workspaceId) {
  const snapshot = clone(state);
  snapshot.activeWorkspaceId = workspaceId;
  return snapshot;
}

function delayForWorkspace(workspaceId) {
  if (scenario !== "rapid-switch" && scenario !== "navigation-race") return 0;
  if (workspaceId === "work") return 100;
  if (workspaceId === "research") return 8;
  return 0;
}

function registerHarnessIpc() {
  ipcMain.handle("workspace-harness:get-state", () => clone(state));
  ipcMain.handle("workspace-harness:chrome-profiles", () => [{
    id: "Default",
    name: "Evan",
    bookmarkCount: 2,
    localBookmarkCount: 2,
    accountBookmarkCount: 0,
  }]);
  ipcMain.handle("workspace-harness:chrome-import", (_event, payload = {}) => {
    trace.chromeActions.push(`import:${payload.profileId}`);
    state.importMeta = {
      ...state.importMeta,
      profileId: payload.profileId,
      profileName: "Evan",
      scanned: state.bookmarks.length,
      added: 0,
      total: state.bookmarks.length,
      importedAt: "2026-08-30T01:02:03.000Z",
    };
    return { state: clone(state), stats: clone(state.importMeta) };
  });
  ipcMain.handle("workspace-harness:chrome-clear", () => {
    trace.chromeActions.push("clear");
    state.bookmarks = [];
    state.importMeta = null;
    return { state: clone(state) };
  });
  ipcMain.handle("workspace-harness:set-tab-context-menu-action", (_event, payload = {}) => {
    nextTabContextMenuAction = payload.action || null;
    return true;
  });
  ipcMain.handle("workspace-harness:show-tab-context-menu", (_event, payload = {}) => {
    const action = nextTabContextMenuAction;
    nextTabContextMenuAction = null;
    trace.nativeTabContextMenus.push({ tabId: payload.tabId, action });
    return { tabId: payload.tabId, action };
  });
  ipcMain.handle("workspace-harness:update-ui-settings", (_event, patch = {}) => {
    if (patch.sessionVisibility === "all" || patch.sessionVisibility === "workspace") {
      state.uiSettings.sessionVisibility = patch.sessionVisibility;
    }
    if (typeof patch.contextAssistantCollapsed === "boolean") {
      state.uiSettings.contextAssistantCollapsed = patch.contextAssistantCollapsed;
    }
    return { state: clone(state), uiSettings: clone(state.uiSettings) };
  });
  ipcMain.handle("workspace-harness:google-sync-status", () => clone(googleSyncState));
  ipcMain.handle("workspace-harness:google-sign-in", async () => {
    trace.googleActions.push("sign-in");
    await new Promise((resolve) => setTimeout(resolve, 20));
    Object.assign(googleSyncState, {
      configured: true,
      signedIn: true,
      email: "evan@example.com",
      status: "idle",
      error: "",
    });
    return clone(googleSyncState);
  });
  ipcMain.handle("workspace-harness:google-sync-now", async () => {
    trace.googleActions.push("sync");
    await new Promise((resolve) => setTimeout(resolve, 20));
    Object.assign(googleSyncState, {
      lastSyncAt: "2026-08-29T12:34:56.000Z",
      status: "idle",
      error: "",
    });
    return { ...clone(googleSyncState), state: clone(state) };
  });
  ipcMain.handle("workspace-harness:google-restore-from-cloud", async () => {
    trace.googleActions.push("restore");
    await new Promise((resolve) => setTimeout(resolve, 20));
    if (!state.sites.some((site) => site.id === "cloud-restored-site")) {
      state.sites.push({
        id: "cloud-restored-site",
        name: "云端恢复站点",
        shortName: "云",
        url: "https://cloud-restored.example.test/",
        color: "#4285f4",
        workspaceId: "personal",
        browserProfileId: "default",
        siteKind: "normal",
        openMode: "internal",
        pinned: true,
        order: 10,
      });
    }
    Object.assign(googleSyncState, { status: "idle", error: "" });
    return { ...clone(googleSyncState), state: clone(state) };
  });
  ipcMain.handle("workspace-harness:google-sign-out", async () => {
    trace.googleActions.push("sign-out");
    await new Promise((resolve) => setTimeout(resolve, 20));
    Object.assign(googleSyncState, {
      signedIn: false,
      email: "",
      status: "idle",
      error: "",
    });
    return clone(googleSyncState);
  });
  ipcMain.handle("workspace-harness:set-active", async (_event, rawWorkspaceId) => {
    const workspaceId = String(rawWorkspaceId || "");
    const workspace = workspaces.find((item) => item.id === workspaceId);
    if (!workspace) throw new Error("WORKSPACE_NOT_FOUND");
    trace.workspaceRequests.push(workspaceId);

    // The backend records the newest request immediately. Each response keeps its
    // own snapshot so the renderer must ignore a stale, late response.
    state.activeWorkspaceId = workspaceId;
    const responseState = workspaceResponseSnapshot(workspaceId);
    const browserState = setMountedFromWorkspace(workspaceId);
    const wait = delayForWorkspace(workspaceId);
    if (wait) await new Promise((resolve) => setTimeout(resolve, wait));
    return {
      state: responseState,
      workspace: clone(workspace),
      browserState: clone(browserState),
    };
  });
  ipcMain.handle("workspace-harness:show-browser", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const site = siteForWorkspace(workspaceId, String(payload.siteId || ""));
    if (!site) throw new Error("WORKSPACE_BROWSER_SITE_MISMATCH");
    const url = String(payload.url || site.url);
    const persisted = state.workspaceBrowserStates[workspaceId] ||
      emptyPersistedBrowserState();
    let activeTab = persisted.tabs.find((tab) => tab.siteId === site.id) || null;
    const reused = Boolean(activeTab);
    if (!activeTab) {
      activeTab = createPersistedTab(workspaceId, site, url);
      persisted.tabs.push(activeTab);
    } else {
      activeTab.url = url;
      activeTab.homeURL = site.url;
      activeTab.title = site.name;
      activeTab.updatedAt = new Date().toISOString();
    }
    persisted.activeTabId = activeTab.tabId;
    state.workspaceBrowserStates[workspaceId] = persisted;
    updatePersistedAliases(workspaceId);
    trace.showBrowser.push({
      workspaceId,
      tabId: activeTab.tabId,
      siteId: site.id,
      url,
      reused,
      webContentsId: webContentsIdForTab(activeTab.tabId),
      bounds: clone(payload.bounds || null),
    });
    return clone(setMountedFromWorkspace(workspaceId));
  });
  ipcMain.handle("workspace-harness:select-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const target = persisted.tabs.find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!target) throw new Error("BROWSER_TAB_NOT_FOUND");
    persisted.activeTabId = target.tabId;
    updatePersistedAliases(workspaceId);
    trace.tabActions.push({ action: "select", tabId: target.tabId, workspaceId });
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:close-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const index = persisted.tabs.findIndex((tab) => tab.tabId === String(payload.tabId || ""));
    if (index < 0) throw new Error("BROWSER_TAB_NOT_FOUND");
    const [closed] = persisted.tabs.splice(index, 1);
    detachedTabIds.delete(closed.tabId);
    if (persisted.activeTabId === closed.tabId) {
      persisted.activeTabId = persisted.tabs[index]?.tabId ||
        persisted.tabs[index - 1]?.tabId ||
        null;
    }
    updatePersistedAliases(workspaceId);
    trace.tabActions.push({ action: "close", tabId: closed.tabId, workspaceId });
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:detach-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const target = persisted.tabs.find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!target) throw new Error("BROWSER_TAB_NOT_FOUND");
    persisted.activeTabId = target.tabId;
    detachedTabIds.add(target.tabId);
    updatePersistedAliases(workspaceId);
    trace.tabActions.push({
      action: "detach",
      tabId: target.tabId,
      workspaceId,
      webContentsId: webContentsIdForTab(target.tabId),
      bounds: clone(payload.bounds || null),
    });
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:reattach-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const target = persisted.tabs.find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!target) throw new Error("BROWSER_TAB_NOT_FOUND");
    persisted.activeTabId = target.tabId;
    detachedTabIds.delete(target.tabId);
    updatePersistedAliases(workspaceId);
    trace.tabActions.push({
      action: "reattach",
      tabId: target.tabId,
      workspaceId,
      webContentsId: webContentsIdForTab(target.tabId),
      bounds: clone(payload.bounds || null),
    });
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:focus-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const target = persisted.tabs.find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!target || !detachedTabIds.has(target.tabId)) {
      throw new Error("DETACHED_BROWSER_TAB_NOT_FOUND");
    }
    persisted.activeTabId = target.tabId;
    updatePersistedAliases(workspaceId);
    trace.focusedDetachedTabs.push(target.tabId);
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:duplicate-tab", (_event, payload = {}) => {
    const workspaceId = state.activeWorkspaceId;
    const persisted = updatePersistedAliases(workspaceId);
    const source = persisted.tabs.find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!source) throw new Error("BROWSER_TAB_NOT_FOUND");
    const site = source.siteId ? siteForWorkspace(workspaceId, source.siteId) : null;
    const copy = createPersistedTab(workspaceId, site, source.url, {
      allowDuplicate: true,
      browserProfileId: source.browserProfileId,
    });
    copy.title = source.title;
    copy.homeURL = source.homeURL;
    const sourceIndex = persisted.tabs.findIndex((tab) => tab.tabId === source.tabId);
    persisted.tabs.splice(sourceIndex + 1, 0, copy);
    persisted.activeTabId = copy.tabId;
    updatePersistedAliases(workspaceId);
    trace.tabActions.push({ action: "duplicate", sourceTabId: source.tabId, tabId: copy.tabId, workspaceId });
    const browserState = setMountedFromWorkspace(workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:duplicate-site", (_event, payload = {}) => {
    const site = state.sites.find((item) => item.id === String(payload.siteId || ""));
    if (!site) throw new Error("SITE_NOT_FOUND");
    state.activeWorkspaceId = site.workspaceId;
    const persisted = updatePersistedAliases(site.workspaceId);
    const copy = createPersistedTab(site.workspaceId, site, site.url, { allowDuplicate: true });
    persisted.tabs.push(copy);
    persisted.activeTabId = copy.tabId;
    updatePersistedAliases(site.workspaceId);
    trace.tabActions.push({ action: "duplicate-site", siteId: site.id, tabId: copy.tabId, workspaceId: site.workspaceId });
    const browserState = setMountedFromWorkspace(site.workspaceId);
    return { state: clone(state), browserState: clone(browserState) };
  });
  ipcMain.handle("workspace-harness:copy-tab-url", (_event, payload = {}) => {
    const source = Object.values(state.workspaceBrowserStates)
      .flatMap((entry) => entry.tabs || [])
      .find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!source) throw new Error("BROWSER_TAB_NOT_FOUND");
    trace.copiedTabUrls.push({ tabId: source.tabId, url: source.url });
    return { ok: true, url: source.url };
  });
  ipcMain.handle("workspace-harness:open-tab-external", (_event, payload = {}) => {
    const source = Object.values(state.workspaceBrowserStates)
      .flatMap((entry) => entry.tabs || [])
      .find((tab) => tab.tabId === String(payload.tabId || ""));
    if (!source) throw new Error("BROWSER_TAB_NOT_FOUND");
    trace.externalTabUrls.push({ tabId: source.tabId, url: source.url });
    return { ok: true, url: source.url };
  });
  ipcMain.on("workspace-harness:hide-browser", () => {
    trace.hideBrowser += 1;
    trace.mounted = {
      attached: false,
      workspaceId: null,
      tabId: null,
      siteId: null,
      url: null,
      webContentsId: null,
    };
  });
  ipcMain.on("workspace-harness:set-browser-bounds", (_event, bounds) => {
    trace.browserBounds.push(clone(bounds));
  });
}

async function waitForRenderer(window) {
  await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (typeof appState === 'object' && appState.version === 4) return resolve(true);
      if (Date.now() - startedAt > 5000) return reject(new Error('renderer initialize timeout'));
      setTimeout(check, 20);
    };
    check();
  })`);
}

async function waitForRendererCondition(window, expression, label) {
  await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const startedAt = Date.now();
    const check = () => {
      if (${expression}) return resolve(true);
      if (Date.now() - startedAt > 5000) {
        return reject(new Error(${JSON.stringify(label)}));
      }
      setTimeout(check, 20);
    };
    check();
  })`);
}

function browserUiSnapshotScript(label) {
  return `(() => {
    const visibleLocalPage = Array.from(document.querySelectorAll('.local-page.is-visible'))
      .map((page) => page.id || page.dataset.page || '')[0] || null;
    const browserEmptyPage = document.querySelector('#workspaceBrowserEmptyPage, [data-page="browser-empty"]');
    return {
      label: ${JSON.stringify(label)},
      activeWorkspaceId: activeWorkspaceId(),
      activeWorkspaceLabel: dom.activeWorkspaceName.textContent,
      activeWorkspaceButtons: Array.from(
        dom.workspaceSwitcher.querySelectorAll('[data-workspace-id].is-active'),
      ).map((button) => button.dataset.workspaceId),
      currentRoute,
      currentSite: currentSite ? {
        id: currentSite.id,
        workspaceId: currentSite.workspaceId,
        url: currentSite.url,
      } : null,
      browserVisible: dom.browserPage.classList.contains('is-visible'),
      visibleLocalPage,
      browserEmptyVisible: Boolean(browserEmptyPage?.classList.contains('is-visible')),
      browserEmptyText: browserEmptyPage?.textContent || '',
      addressValue: dom.addressInput.value,
      browserSnapshot: {
        workspaceId: browserSnapshot.workspaceId || null,
        activeTabId: browserSnapshot.activeTabId || null,
        tabs: Array.isArray(browserSnapshot.tabs)
          ? browserSnapshot.tabs.map((tab) => ({
              tabId: tab.tabId,
              siteId: tab.siteId || null,
              browserProfileId: tab.browserProfileId || 'default',
              title: tab.title || '',
              url: tab.url || '',
              loading: Boolean(tab.loading),
              detached: Boolean(tab.detached),
              active: Boolean(tab.active),
              allowDuplicate: tab.allowDuplicate === true,
            }))
          : [],
        siteId: browserSnapshot.siteId || browserSnapshot.activeSiteId || null,
        hasOpenPage: Boolean(browserSnapshot.hasOpenPage),
        url: browserSnapshot.url || '',
      },
      tabDom: Array.from(dom.browserTabList?.querySelectorAll('[data-browser-tab-id]') || [])
        .map((tab) => ({
          tabId: tab.dataset.browserTabId,
          active: tab.classList.contains('is-active'),
          detached: tab.classList.contains('is-detached'),
          mainAction: tab.querySelector('.browser-tab-main')?.dataset.tabAction || '',
          windowAction: tab.querySelector('.browser-tab-actions [data-tab-action]')?.dataset.tabAction || '',
          text: tab.textContent,
        })),
      noAttachedTab: dom.browserPage.classList.contains('has-no-attached-tab'),
      placeholderTitle: dom.webviewPlaceholderTitle?.textContent || '',
      toasts: Array.from(dom.toastStack.children).map((toast) => toast.textContent),
    };
  })()`;
}

function googleSyncUiSnapshotScript(label) {
  return `(() => ({
    label: ${JSON.stringify(label)},
    configured: Boolean(googleSyncState.configured),
    signedIn: Boolean(googleSyncState.signedIn),
    cardTitle: dom.googleSyncCardTitle.textContent.trim(),
    cardSubtitle: dom.googleSyncCardSubtitle.textContent.trim(),
    cardExpanded: dom.googleSyncCard.getAttribute('aria-expanded'),
    popoverHidden: dom.googleSyncPopover.hidden,
    popoverStyle: (() => {
      const style = getComputedStyle(dom.googleSyncPopover);
      return {
        opacity: style.opacity,
        backgroundColor: style.backgroundColor,
        zIndex: style.zIndex,
        position: style.position,
        animationName: style.animationName,
        animationPlayState: style.animationPlayState,
      };
    })(),
    account: dom.googleSyncAccount.textContent.trim(),
    lastSync: dom.googleSyncLastSync.textContent.trim(),
    notice: document.querySelector('.google-sync-notice')?.textContent.trim() || '',
    error: dom.googleSyncError.textContent.trim(),
    buttons: {
      signInVisible: !dom.googleSignInButton.classList.contains('is-hidden'),
      syncVisible: !dom.googleSyncNowButton.classList.contains('is-hidden'),
      restoreVisible: !dom.googleRestoreButton.classList.contains('is-hidden'),
      signOutVisible: !dom.googleSignOutButton.classList.contains('is-hidden'),
      signInDisabled: dom.googleSignInButton.disabled,
      syncDisabled: dom.googleSyncNowButton.disabled,
    },
    siteIds: appState.sites.map((site) => site.id),
    sidebarText: dom.appSidebar.textContent,
    toasts: Array.from(dom.toastStack.children).map((toast) => toast.textContent),
  }))()`;
}

async function runIsolationScenario(window) {
  const snapshots = [];
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  window.webContents.send("workspace-harness:browser-state", {
    workspaceId: "personal",
    siteId: "personal-site",
    activeSiteId: "personal-site",
    hasOpenPage: true,
    title: "个人站点的迟到事件",
    url: "https://personal.example.test/stale-event",
    currentURL: "https://personal.example.test/stale-event",
    homeURL: "https://personal.example.test/inside",
    loading: false,
    canGoBack: true,
    canGoForward: false,
    zoomFactor: 1,
    error: "",
    siteIssue: "",
  });
  await new Promise((resolve) => setTimeout(resolve, 30));
  snapshots.push(
    await window.webContents.executeJavaScript(browserUiSnapshotScript("work-empty")),
  );

  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'work-site'))",
  );
  await window.webContents.executeJavaScript("switchWorkspace('personal')");
  await new Promise((resolve) => setTimeout(resolve, 50));
  snapshots.push(
    await window.webContents.executeJavaScript(browserUiSnapshotScript("personal-restored")),
  );
  const mountedAfterPersonal = clone(trace.mounted);

  await window.webContents.executeJavaScript("switchWorkspace('research')");
  snapshots.push(
    await window.webContents.executeJavaScript(browserUiSnapshotScript("research-empty")),
  );
  return {
    snapshots,
    mountedAfterPersonal,
    trace: clone(trace),
    persisted: clone(state.workspaceBrowserStates),
  };
}

async function runEmptyLayoutScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  return window.webContents.executeJavaScript(
    browserUiSnapshotScript("work-empty-layout"),
  );
}

async function runRapidSwitchScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(`Promise.all([
    switchWorkspace('work'),
    new Promise((resolve) => setTimeout(resolve, 1)).then(() => switchWorkspace('research')),
  ])`);
  const immediate = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("rapid-immediate"),
  );
  await new Promise((resolve) => setTimeout(resolve, 2300));
  const afterToastLifetime = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("rapid-after-toast-lifetime"),
  );
  return {
    immediate,
    afterToastLifetime,
    trace: clone(trace),
    backendActiveWorkspaceId: state.activeWorkspaceId,
  };
}

async function runLayoutScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  const metrics = await window.webContents.executeJavaScript(`(() => {
    const compactRect = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      workspace: compactRect(document.querySelector('.workspace')),
      workspaceStyle: {
        height: getComputedStyle(document.querySelector('.workspace')).height,
        minHeight: getComputedStyle(document.querySelector('.workspace')).minHeight,
      },
      sidebar: compactRect(document.querySelector('.sidebar')),
      browserPage: compactRect(dom.browserPage),
      tabbar: compactRect(dom.browserTabBar),
      toolbar: compactRect(document.querySelector('.browser-toolbar')),
      frame: compactRect(dom.webviewFrame),
    };
  })()`);
  return { metrics, trace: clone(trace) };
}

async function runSidebarCollapseScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript("dom.sidebarToggle.click()");
  await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const deadline = performance.now() + 1500;
    const settled = () => {
      const width = document.querySelector('.sidebar').getBoundingClientRect().width;
      if (Math.abs(width - 72) <= 1) {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
        return;
      }
      if (performance.now() >= deadline) {
        reject(new Error('sidebar collapse transition did not settle: ' + width));
        return;
      }
      requestAnimationFrame(settled);
    };
    settled();
  })`);
  const collapsed = await window.webContents.executeJavaScript(`(() => {
    const compactRect = (element) => {
      const rect = element.getBoundingClientRect();
      return { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
    };
    return {
      collapsed: dom.appShell.classList.contains('is-sidebar-collapsed'),
      stored: localStorage.getItem('site-nest.sidebar-collapsed'),
      ariaExpanded: dom.sidebarToggle.getAttribute('aria-expanded'),
      title: dom.sidebarToggle.title,
      sidebar: compactRect(document.querySelector('.sidebar')),
      frame: compactRect(dom.webviewFrame),
    };
  })()`);
  const collapsedBounds = clone(trace.browserBounds.at(-1));

  await window.webContents.executeJavaScript("navigateTo('home')");
  const reloaded = new Promise((resolve) =>
    window.webContents.once("did-finish-load", resolve),
  );
  window.webContents.reload();
  await reloaded;
  await waitForRenderer(window);
  await window.webContents.executeJavaScript(`new Promise((resolve, reject) => {
    const deadline = performance.now() + 1500;
    const settled = () => {
      const width = document.querySelector('.sidebar').getBoundingClientRect().width;
      if (Math.abs(width - 72) <= 1) {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
        return;
      }
      if (performance.now() >= deadline) {
        reject(new Error('persisted sidebar collapse did not settle: ' + width));
        return;
      }
      requestAnimationFrame(settled);
    };
    settled();
  })`);
  const afterReload = await window.webContents.executeJavaScript(`(() => ({
    collapsed: dom.appShell.classList.contains('is-sidebar-collapsed'),
    stored: localStorage.getItem('site-nest.sidebar-collapsed'),
    ariaExpanded: dom.sidebarToggle.getAttribute('aria-expanded'),
    title: dom.sidebarToggle.title,
    sidebarWidth: document.querySelector('.sidebar').getBoundingClientRect().width,
  }))()`);
  return { collapsed, collapsedBounds, afterReload, trace: clone(trace) };
}

async function runLocalRouteSwitchScenario(window) {
  await window.webContents.executeJavaScript("navigateTo('bookmarks')");
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  return {
    snapshot: await window.webContents.executeJavaScript(
      browserUiSnapshotScript("local-route-switch"),
    ),
    trace: clone(trace),
  };
}

async function runNavigationRaceScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(`(async () => {
    const pendingSwitch = switchWorkspace('work');
    await new Promise((resolve) => setTimeout(resolve, 10));
    navigateTo('settings');
    await pendingSwitch;
  })()`);
  return {
    snapshot: await window.webContents.executeJavaScript(
      browserUiSnapshotScript("navigation-race"),
    ),
    trace: clone(trace),
  };
}

async function runTabsLifecycleScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  const afterDuplicate = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-duplicate"),
  );

  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site-two'))",
  );
  const afterSecondSite = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-second-site"),
  );
  const firstTabId = afterSecondSite.browserSnapshot.tabs.find(
    (tab) => tab.siteId === "personal-site",
  )?.tabId;
  const secondTabId = afterSecondSite.browserSnapshot.tabs.find(
    (tab) => tab.siteId === "personal-site-two",
  )?.tabId;
  await window.webContents.executeJavaScript(
    `activateBrowserTab(${JSON.stringify(firstTabId)})`,
  );
  await window.webContents.executeJavaScript(
    `closeBrowserTab(${JSON.stringify(firstTabId)})`,
  );
  const afterCloseActive = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-close-active"),
  );
  await window.webContents.executeJavaScript(
    `closeBrowserTab(${JSON.stringify(secondTabId)})`,
  );
  const afterCloseLast = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-close-last"),
  );
  return {
    afterDuplicate,
    afterSecondSite,
    afterCloseActive,
    afterCloseLast,
    trace: clone(trace),
    persisted: clone(state.workspaceBrowserStates),
  };
}

async function runTabsWorkspaceIsolationScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  const personalBeforeSwitch = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("personal-tabs-before-switch"),
  );
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'work-shared-site'))",
  );
  const workTabs = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("work-tabs"),
  );
  await window.webContents.executeJavaScript("switchWorkspace('personal')");
  const personalRestored = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("personal-tabs-restored"),
  );
  return {
    personalBeforeSwitch,
    workTabs,
    personalRestored,
    trace: clone(trace),
    persisted: clone(state.workspaceBrowserStates),
  };
}

async function runTabsDetachScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  const before = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tab-before-detach"),
  );
  const tabId = before.browserSnapshot.activeTabId;
  await window.webContents.executeJavaScript(
    `detachBrowserTabToWindow(${JSON.stringify(tabId)}, { screenX: 500, screenY: 320 })`,
  );
  const detached = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tab-detached"),
  );
  await window.webContents.executeJavaScript(`(() => {
    const button = dom.browserTabList.querySelector(
      '[data-browser-tab-id=${JSON.stringify(tabId)}] [data-tab-action="focus"]'
    );
    button?.click();
  })()`);
  await new Promise((resolve) => setTimeout(resolve, 30));
  await window.webContents.executeJavaScript(
    `reattachBrowserTab(${JSON.stringify(tabId)})`,
  );
  const reattached = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tab-reattached"),
  );
  return { before, detached, reattached, trace: clone(trace) };
}

async function runTabsCopyUiScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site-two'))",
  );
  const menu = await window.webContents.executeJavaScript(`(async () => {
    const source = browserSnapshot.tabs.find((tab) => tab.siteId === 'personal-site');
    const activeBefore = browserSnapshot.activeTabId;
    const item = dom.browserTabList.querySelector('[data-browser-tab-id="' + source.tabId + '"]');
    await window.siteNest.setHarnessTabContextMenuAction(null);
    item.dispatchEvent(new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
      clientX: 520,
      clientY: 70,
      screenX: 720,
      screenY: 170,
    }));
    await new Promise((resolve) => setTimeout(resolve, 30));
    const htmlMenuStayedHidden = dom.appContextMenu.hidden;
    const targetStayedInactive = browserSnapshot.activeTabId === activeBefore;
    await window.siteNest.setHarnessTabContextMenuAction('duplicate');
    item.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 520, clientY: 70 }));
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (browserSnapshot.tabs.length === 3) return resolve();
        if (performance.now() >= deadline) return reject(new Error('context-menu copy did not settle'));
        setTimeout(check, 20);
      };
      check();
    });
    return { sourceTabId: source.tabId, activeBefore, targetStayedInactive, htmlMenuStayedHidden };
  })()`);
  const afterTopCopy = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-top-copy"),
  );
  const topCopyTabId = afterTopCopy.browserSnapshot.activeTabId;

  await window.webContents.executeJavaScript(`(async () => {
    const openMenu = () => dom.browserTabList.querySelector('[data-browser-tab-id="${menu.sourceTabId}"]')
      .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 520, clientY: 70 }));
    await window.siteNest.setHarnessTabContextMenuAction('copy-url');
    openMenu();
    await new Promise((resolve) => setTimeout(resolve, 30));
    await window.siteNest.setHarnessTabContextMenuAction('open-external');
    openMenu();
    await new Promise((resolve) => setTimeout(resolve, 30));
  })()`);

  const leftMenu = await window.webContents.executeJavaScript(`(async () => {
    const session = dom.currentSessionList.querySelector('[data-session-id="${menu.sourceTabId}"]');
    session.querySelector('[title="更多操作"]').click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const labels = Array.from(dom.appContextMenu.querySelectorAll('.app-context-menu-button'))
      .map((button) => button.textContent.trim());
    Array.from(dom.appContextMenu.querySelectorAll('.app-context-menu-button'))
      .find((button) => button.textContent.trim() === '复制页签').click();
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (browserSnapshot.tabs.length === 4) return resolve();
        if (performance.now() >= deadline) return reject(new Error('sidebar copy did not settle'));
        setTimeout(check, 20);
      };
      check();
    });
    return { labels };
  })()`);
  const afterLeftCopy = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-left-copy"),
  );

  await window.webContents.executeJavaScript(`(async () => {
    const item = dom.browserTabList.querySelector('[data-browser-tab-id="${topCopyTabId}"]');
    await window.siteNest.setHarnessTabContextMenuAction('close');
    item.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 540, clientY: 70 }));
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (browserSnapshot.tabs.length === 3) return resolve();
        if (performance.now() >= deadline) return reject(new Error('context-menu close did not settle'));
        setTimeout(check, 20);
      };
      check();
    });
  })()`);
  const afterCloseCopy = await window.webContents.executeJavaScript(
    browserUiSnapshotScript("tabs-after-close-copy"),
  );
  const chrome = await window.webContents.executeJavaScript(`(() => ({
    version: document.querySelector('.brand-version')?.textContent.trim(),
    hasSidebarChromeNav: Boolean(document.querySelector('.primary-nav [data-route="bookmarks"]')),
    hasSidebarChromeCard: Boolean(document.querySelector('#openImportButton')),
    hasFixedSitesRegion: Boolean(document.querySelector('#pinnedSitesHeading, #siteList, #showAllSitesButton')),
    pageActionsHidden: dom.pageActionsButton.hidden,
    pageActionsDisplay: getComputedStyle(dom.pageActionsButton).display,
    pageActionPanelDisplay: getComputedStyle(dom.pageActionPanel).display,
    hasConnectionStrip: Boolean(document.querySelector('.browser-context-bar')),
    duplicateButtonVisible: !dom.duplicateCurrentTab.hidden,
    detachLabel: dom.detachCurrentTabLabel.textContent,
  }))()`);
  const pageActions = await window.webContents.executeJavaScript(`(async () => {
    dom.pageActionsButton.click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const opened = {
      hidden: dom.pageActionPanel.hidden,
      display: getComputedStyle(dom.pageActionPanel).display,
      ariaHidden: dom.pageActionPanel.getAttribute('aria-hidden'),
      expanded: dom.pageActionsButton.getAttribute('aria-expanded'),
      title: dom.pageActionPanel.querySelector('h2')?.textContent.trim(),
    };
    dom.closePageActions.click();
    await new Promise((resolve) => requestAnimationFrame(resolve));
    return {
      opened,
      closed: {
        hidden: dom.pageActionPanel.hidden,
        display: getComputedStyle(dom.pageActionPanel).display,
        ariaHidden: dom.pageActionPanel.getAttribute('aria-hidden'),
        expanded: dom.pageActionsButton.getAttribute('aria-expanded'),
      },
    };
  })()`);
  return { menu, afterTopCopy, leftMenu, afterLeftCopy, afterCloseCopy, chrome, pageActions, trace: clone(trace) };
}

async function runTabsDragFallbackScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(`(async () => {
    const tab = dom.browserTabList.querySelector('.browser-tab');
    tab.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true,
      clientX: 360,
      clientY: 66,
      screenX: 660,
      screenY: 166,
    }));
    const transfer = { effectAllowed: 'none', setData() {} };
    const start = new MouseEvent('dragstart', {
      bubbles: true,
      cancelable: true,
      clientX: 360,
      clientY: 66,
      screenX: 660,
      screenY: 166,
    });
    Object.defineProperty(start, 'dataTransfer', { value: transfer });
    tab.dispatchEvent(start);
    tab.dispatchEvent(new MouseEvent('drag', {
      bubbles: true,
      clientX: 370,
      clientY: 146,
      screenX: 670,
      screenY: 246,
    }));
    tab.dispatchEvent(new MouseEvent('dragend', {
      bubbles: true,
      clientX: 0,
      clientY: 0,
      screenX: 0,
      screenY: 0,
    }));
    await new Promise((resolve) => setTimeout(resolve, 80));
  })()`);
  return {
    snapshot: await window.webContents.executeJavaScript(
      browserUiSnapshotScript("tab-after-zero-coordinate-drag"),
    ),
    trace: clone(trace),
  };
}

async function runTabsVisualScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site-two'))",
  );
  await window.webContents.executeJavaScript(
    `(async () => {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const inactive = browserSnapshot.tabs.find((tab) => tab.tabId !== browserSnapshot.activeTabId);
      dom.browserTabList.querySelector('[data-browser-tab-id="' + inactive.tabId + '"]')
        .dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 520, clientY: 70 }));
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    })()`,
  );
  return {
    snapshot: await window.webContents.executeJavaScript(
      browserUiSnapshotScript("tabs-visual"),
    ),
    trace: clone(trace),
  };
}

async function runPageActionsVisualScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await waitForRendererCondition(
    window,
    "browserSnapshot.hasOpenPage === true && !dom.browserPage.hidden",
    "page actions visual browser did not settle",
  );
  await window.webContents.executeJavaScript("dom.pageActionsButton.click()");
  await waitForRendererCondition(
    window,
    "pageActionPanelOpen === true && dom.pageActionPanel.hidden === false",
    "page actions visual panel did not open",
  );
  return window.webContents.executeJavaScript(`(() => ({
    title: dom.pageActionPanel.querySelector('.page-action-panel-header h2')?.textContent.trim(),
    hidden: dom.pageActionPanel.hidden,
    expanded: dom.pageActionsButton.getAttribute('aria-expanded'),
  }))()`);
}

async function runGoogleSyncUiScenario(window) {
  await waitForRendererCondition(
    window,
    "googleSyncState.configured === true && !googleSyncBusyAction",
    "Google sync status did not initialize",
  );
  const initial = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-initial"),
  );

  await window.webContents.executeJavaScript("dom.googleSyncCard.click()");
  await waitForRendererCondition(
    window,
    "googleSyncPopoverOpen === true && !dom.googleSyncPopover.hidden",
    "Google sync popover did not open",
  );
  const open = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-open"),
  );

  await window.webContents.executeJavaScript("dom.googleSignInButton.click()");
  await waitForRendererCondition(
    window,
    "googleSyncState.signedIn === true && !googleSyncBusyAction",
    "Google sign-in did not settle",
  );
  const connected = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-connected"),
  );

  await window.webContents.executeJavaScript("dom.googleSyncNowButton.click()");
  await waitForRendererCondition(
    window,
    "Boolean(googleSyncState.lastSyncAt) && !googleSyncBusyAction",
    "Google sync did not settle",
  );
  const synced = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-complete"),
  );

  await window.webContents.executeJavaScript(`(() => {
    window.confirm = () => true;
    dom.googleRestoreButton.click();
  })()`);
  await waitForRendererCondition(
    window,
    "appState.sites.some((site) => site.id === 'cloud-restored-site') && !googleSyncBusyAction",
    "Google cloud restore did not settle",
  );
  const restored = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-restored"),
  );

  await window.webContents.executeJavaScript("dom.googleSignOutButton.click()");
  await waitForRendererCondition(
    window,
    "googleSyncState.signedIn === false && !googleSyncBusyAction",
    "Google sign-out did not settle",
  );
  const signedOut = await window.webContents.executeJavaScript(
    googleSyncUiSnapshotScript("google-sync-signed-out"),
  );

  return {
    initial,
    open,
    connected,
    synced,
    restored,
    signedOut,
    trace: clone(trace),
    state: clone(state),
  };
}

async function runGoogleSyncVisualScenario(window) {
  await waitForRendererCondition(
    window,
    "googleSyncState.configured === true && !googleSyncBusyAction",
    "Google sync status did not initialize",
  );
  await window.webContents.executeJavaScript("dom.googleSyncCard.click()");
  await waitForRendererCondition(
    window,
    "googleSyncPopoverOpen === true && !dom.googleSyncPopover.hidden",
    "Google sync popover did not open",
  );
  await window.webContents.executeJavaScript("dom.googleSignInButton.click()");
  await waitForRendererCondition(
    window,
    "googleSyncState.signedIn === true && !googleSyncBusyAction",
    "Google sign-in did not settle",
  );
  await window.webContents.executeJavaScript(
    "dom.googleSyncPopover.getAnimations().forEach((animation) => animation.finish())",
  );
  return {
    snapshot: await window.webContents.executeJavaScript(
      googleSyncUiSnapshotScript("google-sync-visual"),
    ),
    trace: clone(trace),
  };
}

function sessionSidebarSnapshotScript(label) {
  return `(() => ({
    label: ${JSON.stringify(label)},
    activeWorkspaceId: appState.activeWorkspaceId,
    visibility: appState.uiSettings?.sessionVisibility,
    count: dom.currentSessionCount.textContent.trim(),
    scope: dom.sessionScopeToggle.textContent.trim(),
    hasFixedSitesRegion: Boolean(document.querySelector('#pinnedSitesHeading, #siteList, #showAllSitesButton')),
    layout: (() => {
      const section = document.querySelector('.session-section');
      const list = dom.currentSessionList;
      const footer = document.querySelector('.sidebar-footer');
      const sidebar = dom.appSidebar.getBoundingClientRect();
      const footerRect = footer.getBoundingClientRect();
      return {
        sectionFlexGrow: getComputedStyle(section).flexGrow,
        listOverflowY: getComputedStyle(list).overflowY,
        footerVisible: footerRect.bottom <= sidebar.bottom + 1 && footerRect.top >= sidebar.top,
      };
    })(),
    sessions: Array.from(dom.currentSessionList.querySelectorAll('.current-session-item')).map((item) => ({
      id: item.dataset.sessionId,
      title: item.querySelector('strong')?.textContent.trim(),
      workspace: item.querySelector('.session-workspace-badge')?.textContent.trim(),
      active: item.classList.contains('is-active'),
      closeLabel: item.querySelector('[title="关闭会话"]')?.getAttribute('aria-label'),
    })),
    siteIds: appState.sites.map((site) => site.id),
    persistedTabCounts: Object.fromEntries(Object.entries(appState.workspaceBrowserStates).map(([id, value]) => [id, value.tabs?.length || 0])),
  }))()`;
}

async function runSessionSidebarScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'work-site'))",
  );
  await waitForRendererCondition(
    window,
    "dom.currentSessionList.querySelectorAll('.current-session-item').length === 2",
    "cross-workspace current sessions did not render",
  );
  const allInWork = await window.webContents.executeJavaScript(
    sessionSidebarSnapshotScript("all-in-work"),
  );

  await window.webContents.executeJavaScript("dom.sessionScopeToggle.click()");
  await waitForRendererCondition(
    window,
    "appState.uiSettings?.sessionVisibility === 'workspace' && dom.currentSessionList.querySelectorAll('.current-session-item').length === 1",
    "workspace-only session setting did not apply",
  );
  const workOnly = await window.webContents.executeJavaScript(
    sessionSidebarSnapshotScript("work-only"),
  );

  await window.webContents.executeJavaScript("switchWorkspace('personal')");
  await waitForRendererCondition(
    window,
    "appState.activeWorkspaceId === 'personal' && dom.currentSessionList.querySelectorAll('.current-session-item').length === 1",
    "personal session did not restore after workspace switch",
  );
  const personalOnly = await window.webContents.executeJavaScript(
    sessionSidebarSnapshotScript("personal-only"),
  );

  await window.webContents.executeJavaScript(
    "dom.currentSessionList.querySelector('[title=\"关闭会话\"]')?.click()",
  );
  await waitForRendererCondition(
    window,
    "(appState.workspaceBrowserStates.personal?.tabs?.length || 0) === 0",
    "closing a sidebar session did not settle",
  );
  const afterClose = await window.webContents.executeJavaScript(
    sessionSidebarSnapshotScript("after-close"),
  );

  await window.webContents.executeJavaScript("dom.sessionScopeToggle.click()");
  await waitForRendererCondition(
    window,
    "appState.uiSettings?.sessionVisibility === 'all' && dom.currentSessionList.querySelectorAll('.current-session-item').length === 1",
    "all-session setting did not restore",
  );
  const allAfterClose = await window.webContents.executeJavaScript(
    sessionSidebarSnapshotScript("all-after-close"),
  );
  return { allInWork, workOnly, personalOnly, afterClose, allAfterClose, state: clone(state) };
}

async function runWorkDashboardVisualScenario(window) {
  const transition = await window.webContents.executeJavaScript(`(async () => {
    try {
      await switchWorkspace('work');
      navigateTo('home');
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error?.stack || error?.message || String(error) };
    }
  })()`);
  if (!transition.ok) throw new Error(transition.error);
  await window.webContents.executeJavaScript(
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  return window.webContents.executeJavaScript(`(() => ({
    activeWorkspaceId: appState.activeWorkspaceId,
    route: currentRoute,
    heading: document.querySelector('#workHomePage h1')?.textContent.trim(),
    connectorStatus: dom.zohoStatusTitle.textContent.trim(),
    metricValues: Array.from(document.querySelectorAll('#ticketMetricsGrid .metric-value')).map((item) => item.textContent.trim()),
  }))()`);
}

async function runSettingsVisualScenario(window) {
  await window.webContents.executeJavaScript("navigateTo('chromeBookmarks')");
  await window.webContents.executeJavaScript(
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  return window.webContents.executeJavaScript(`(() => ({
    route: currentRoute,
    heading: document.querySelector('#settingsPage h1')?.textContent.trim(),
    connectorNames: Array.from(document.querySelectorAll('.connector-settings-item strong, .connector-placeholder-grid strong')).map((item) => item.textContent.trim()),
  }))()`);
}

async function runChromeBookmarksSettingsScenario(window) {
  const initial = await window.webContents.executeJavaScript(`(() => ({
    bookmarkCount: appState.bookmarks.length,
    importProfile: appState.importMeta?.profileName,
    hasSidebarChromeNav: Boolean(document.querySelector('.primary-nav [data-route="bookmarks"]')),
    hasSidebarChromeCard: Boolean(document.querySelector('#openImportButton')),
    hasFixedSitesRegion: Boolean(document.querySelector('#pinnedSitesHeading, #siteList, #showAllSitesButton')),
    hasSettingsModule: Boolean(dom.chromeBookmarksSettingsSection),
    footerItems: Array.from(document.querySelectorAll('.sidebar-footer > *')).map((item) => item.textContent.trim()),
  }))()`);
  await window.webContents.executeJavaScript("navigateTo('bookmarks')");
  await window.webContents.executeJavaScript(
    "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))",
  );
  const legacyRoute = await window.webContents.executeJavaScript(`(() => ({
    route: currentRoute,
    visiblePage: document.querySelector('.local-page.is-visible')?.id,
    focusedSection: document.activeElement === dom.chromeBookmarksSettingsSection,
    profile: dom.chromeBookmarkProfile.textContent.trim(),
    count: dom.chromeBookmarkCount.textContent.trim(),
    status: dom.chromeBookmarkStatus.textContent.trim(),
    listCount: dom.bookmarkList.querySelectorAll('.bookmark-row').length,
  }))()`);
  await window.webContents.executeJavaScript(`(async () => {
    navigateTo('home');
    document.querySelector('[data-route="chromeBookmarks"]').click();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  })()`);
  const homeEntry = await window.webContents.executeJavaScript(`(() => ({
    route: currentRoute,
    visiblePage: document.querySelector('.local-page.is-visible')?.id,
    focusedSection: document.activeElement === dom.chromeBookmarksSettingsSection,
  }))()`);
  await window.webContents.executeJavaScript(`(async () => {
    dom.settingsImportButton = document.getElementById('settingsImportButton');
    dom.settingsImportButton.click();
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (selectedChromeProfile === 'Default' && !dom.confirmImportButton.disabled) return resolve();
        if (performance.now() >= deadline) return reject(new Error('Chrome profiles did not load'));
        setTimeout(check, 20);
      };
      check();
    });
    dom.confirmImportButton.click();
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (!dom.importModal.classList.contains('is-open')) return resolve();
        if (performance.now() >= deadline) return reject(new Error('Chrome import did not settle'));
        setTimeout(check, 20);
      };
      check();
    });
  })()`);
  const afterImport = await window.webContents.executeJavaScript(`(() => ({
    bookmarkCount: appState.bookmarks.length,
    importedAt: appState.importMeta?.importedAt,
    profile: dom.chromeBookmarkProfile.textContent.trim(),
    status: dom.chromeBookmarkStatus.textContent.trim(),
  }))()`);
  await window.webContents.executeJavaScript(`(async () => {
    window.confirm = () => true;
    dom.clearImportedBookmarks.click();
    await new Promise((resolve, reject) => {
      const deadline = performance.now() + 3000;
      const check = () => {
        if (appState.bookmarks.length === 0 && appState.importMeta === null) return resolve();
        if (performance.now() >= deadline) return reject(new Error('Chrome clear did not settle'));
        setTimeout(check, 20);
      };
      check();
    });
  })()`);
  return {
    initial,
    legacyRoute,
    homeEntry,
    afterImport,
    afterClear: clone({ bookmarkCount: state.bookmarks.length, importMeta: state.importMeta }),
    trace: clone(trace),
  };
}

async function runSessionsVisualScenario(window) {
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'personal-site'))",
  );
  await window.webContents.executeJavaScript("switchWorkspace('work')");
  await window.webContents.executeJavaScript(
    "showSite(appState.sites.find((site) => site.id === 'work-site'))",
  );
  await waitForRendererCondition(
    window,
    "dom.currentSessionList.querySelectorAll('.current-session-item').length === 2",
    "sessions visual did not settle",
  );
  return window.webContents.executeJavaScript(sessionSidebarSnapshotScript("sessions-visual"));
}

async function runScenario(window) {
  if (scenario === "isolation") return runIsolationScenario(window);
  if (scenario === "empty-layout") return runEmptyLayoutScenario(window);
  if (scenario === "rapid-switch") return runRapidSwitchScenario(window);
  if (scenario === "layout") return runLayoutScenario(window);
  if (scenario === "sidebar-collapse") return runSidebarCollapseScenario(window);
  if (scenario === "local-route-switch") return runLocalRouteSwitchScenario(window);
  if (scenario === "navigation-race") return runNavigationRaceScenario(window);
  if (scenario === "tabs-lifecycle") return runTabsLifecycleScenario(window);
  if (scenario === "tabs-workspace-isolation") return runTabsWorkspaceIsolationScenario(window);
  if (scenario === "tabs-detach") return runTabsDetachScenario(window);
  if (scenario === "tabs-copy-ui") return runTabsCopyUiScenario(window);
  if (scenario === "tabs-drag-fallback") return runTabsDragFallbackScenario(window);
  if (scenario === "tabs-visual") return runTabsVisualScenario(window);
  if (scenario === "page-actions-visual") return runPageActionsVisualScenario(window);
  if (scenario === "google-sync-ui") return runGoogleSyncUiScenario(window);
  if (scenario === "google-sync-visual") return runGoogleSyncVisualScenario(window);
  if (scenario === "sessions-sidebar") return runSessionSidebarScenario(window);
  if (scenario === "work-dashboard-visual") return runWorkDashboardVisualScenario(window);
  if (scenario === "settings-visual") return runSettingsVisualScenario(window);
  if (scenario === "chrome-bookmarks-settings") return runChromeBookmarksSettingsScenario(window);
  if (scenario === "sessions-visual") return runSessionsVisualScenario(window);
  throw new Error(`unknown scenario: ${scenario}`);
}

async function main() {
  registerHarnessIpc();
  await app.whenReady();
  const window = new BrowserWindow({
    show: false,
    width,
    height,
    useContentSize: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });
  await window.loadFile(rendererPath);
  await waitForRenderer(window);
  const result = await runScenario(window);
  if (capturePath) {
    await new Promise((resolve) => setTimeout(resolve, 260));
    const resolvedCapturePath = path.resolve(capturePath);
    await fsp.mkdir(path.dirname(resolvedCapturePath), { recursive: true });
    const image = await window.webContents.capturePage();
    await fsp.writeFile(resolvedCapturePath, image.toPNG());
  }
  process.stdout.write(`QIYE_WORKSPACE_HARNESS_RESULT:${JSON.stringify(result)}\n`);
  window.destroy();
  app.quit();
}

main().catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  app.exit(1);
});
