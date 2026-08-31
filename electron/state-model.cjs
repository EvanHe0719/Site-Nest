const { createHash, randomUUID } = require("node:crypto");
const { normalizeSitePopupPolicies } = require("./browser/window-open-policy-service.cjs");
const { normalizeBrowserMemorySettings } = require("./browser/webview-lifecycle-manager.cjs");
const { isSapSessionUrl } = require("./browser/sap-auth-recovery.cjs");
const { normalizeTranslationSettings } = require("./translation/settings.cjs");
const {
  normalizeSearchHistory,
  normalizeSearchSettings,
} = require("./browser/search-service.cjs");
const {
  deviceTimeZone,
  buildTaskReminders,
  normalizeLocalTasks,
  normalizeTaskReminders,
  normalizeTaskSettings,
} = require("./tasks/task-model.cjs");
const {
  normalizeTimelineEvents,
  normalizeTimelineTracks,
  normalizeTimelineUiSettings,
} = require("./timeline/timeline-model.cjs");
const {
  normalizeHabitCheckIns,
  normalizeHabitDefinitions,
  normalizeHabitReminders,
  normalizeRewardLedger,
} = require("./habits/index.cjs");
const { normalizeUsageDayAggregates } = require("./usage/index.cjs");
const {
  normalizeContentTagState,
  normalizeTagIdList,
} = require("./content-tags/index.cjs");
const {
  normalizeExecutions: normalizeUserScriptExecutions,
  normalizePermissions: normalizeUserScriptPermissions,
  normalizeUserScripts,
  normalizeUserScriptVersions,
  normalizeValues: normalizeUserScriptValues,
} = require("./userscripts/model.cjs");
const {
  normalizeTabGroups,
} = require("./browser/tab-organization.cjs");

const CURRENT_SCHEMA_VERSION = 16;
const MAX_RECENTLY_CLOSED_TABS = 50;
const DEFAULT_WORKSPACE_ID = "personal";
const DEFAULT_BROWSER_PROFILE_ID = "default";
const SAP_BROWSER_PROFILE_ID = "sap-support";
const VALID_SITE_KINDS = new Set(["normal", "workApp"]);
const VALID_OPEN_MODES = new Set(["internal", "external"]);
const VALID_SESSION_VISIBILITY = new Set(["all", "workspace"]);
const VALID_CONNECTOR_STATUSES = new Set([
  "not-configured",
  "connecting",
  "connected",
  "syncing",
  "error",
  "disabled",
]);
const VALID_CONNECTOR_TYPES = new Set([
  "zoho-desk",
  "emma",
  "customer-ops",
  "gitee",
  "b1-support-hub",
]);

const SYSTEM_WORKSPACES = Object.freeze([
  Object.freeze({
    id: "personal",
    name: "个人",
    type: "personal",
    icon: "home",
    sortOrder: 0,
    isSystem: true,
  }),
  Object.freeze({
    id: "work",
    name: "工作",
    type: "work",
    icon: "grid",
    sortOrder: 1,
    isSystem: true,
  }),
  Object.freeze({
    id: "research",
    name: "研究",
    type: "research",
    icon: "search",
    sortOrder: 2,
    isSystem: true,
  }),
]);

const DEFAULT_BROWSER_PROFILE = Object.freeze({
  id: DEFAULT_BROWSER_PROFILE_ID,
  name: "默认身份",
  type: "persistentPartition",
  partition: "persist:qiye-sites",
  isSystem: true,
  isReal: true,
});

const SAP_BROWSER_PROFILE = Object.freeze({
  id: SAP_BROWSER_PROFILE_ID,
  name: "SAP Support 独立身份",
  type: "persistentPartition",
  partition: "persist:qiye-sap-support",
  isSystem: true,
  isReal: true,
});

const DEFAULT_ASSISTANT_SETTINGS = Object.freeze({
  "generic-page-actions": Object.freeze({
    enabled: true,
    updatedAt: null,
    lastExecutedAt: null,
  }),
  "zoho-desk-ticket": Object.freeze({
    enabled: true,
    updatedAt: null,
    lastExecutedAt: null,
  }),
});

const DEFAULT_NAIXI_AUTOMATION = Object.freeze({
  enabled: true,
  time: "08:30",
  status: "idle",
  message: "等待首次自动检查",
  lastRunAt: null,
  lastSuccessAt: null,
  lastSuccessDate: null,
});

class StateModelError extends Error {
  constructor(code, message, details = undefined) {
    super(message);
    this.name = "StateModelError";
    this.code = code;
    if (details !== undefined) this.details = details;
  }
}

function cloneValue(value) {
  if (value === undefined) return undefined;
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function isoNow(value) {
  if (typeof value === "function") return isoNow(value());
  if (value instanceof Date) {
    if (!Number.isNaN(value.valueOf())) return value.toISOString();
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) return parsed.toISOString();
  }
  return new Date().toISOString();
}

function normalizeHttpUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) {
    throw new StateModelError("INVALID_SITE_URL", "站点网址不能为空");
  }
  const withProtocol = /^[a-z][a-z\d+.-]*:/i.test(value)
    ? value
    : `https://${value}`;
  let parsed;
  try {
    parsed = new URL(withProtocol);
  } catch {
    throw new StateModelError("INVALID_SITE_URL", "站点网址格式无效");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new StateModelError("INVALID_SITE_URL", "仅支持 HTTP 或 HTTPS 站点");
  }
  return parsed.toString();
}

function shortNameForSite(name) {
  const clean = String(name || "").trim();
  if (!clean) return "页";
  const asciiParts = clean.match(/[A-Za-z0-9]+/g);
  if (asciiParts?.length) {
    return asciiParts
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return Array.from(clean).slice(0, 1).join("");
}

function stableMissingSiteId(site, index, normalizedUrl) {
  const seed = `${site?.workspaceId || DEFAULT_WORKSPACE_ID}\n${normalizedUrl}\n${index}`;
  return `site-${createHash("sha1").update(seed).digest("hex").slice(0, 20)}`;
}

function normalizeAssistantIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(
      value
        .map((item) => String(item || "").trim())
        .filter(Boolean),
    ),
  ).slice(0, 100);
}

function bookmarkId(url) {
  return createHash("sha1").update(url).digest("hex").slice(0, 20);
}

function normalizeStoredBookmark(bookmark) {
  if (!bookmark || typeof bookmark !== "object") {
    throw new StateModelError("INVALID_STORED_BOOKMARK", "书签不是有效对象");
  }
  const url = normalizeHttpUrl(bookmark.url);
  const hostname = new URL(url).hostname;
  return {
    ...cloneValue(bookmark),
    id: String(bookmark.id || bookmarkId(url)),
    name: String(bookmark.name || hostname).slice(0, 300),
    url,
    folder: String(bookmark.folder || "未分类").slice(0, 500),
    addedAt: typeof bookmark.addedAt === "string" ? bookmark.addedAt : null,
    sourceProfile: String(bookmark.sourceProfile || "Chrome").slice(0, 200),
  };
}

function normalizeAssistantSettings(value) {
  const settings = {};
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  for (const [rawId, rawSetting] of Object.entries(input)) {
    const id = String(rawId || "").trim();
    if (!id) continue;
    if (typeof rawSetting === "boolean") {
      settings[id] = {
        enabled: rawSetting,
        updatedAt: null,
        lastExecutedAt: null,
      };
      continue;
    }
    if (!rawSetting || typeof rawSetting !== "object" || Array.isArray(rawSetting)) {
      continue;
    }
    settings[id] = {
      ...cloneValue(rawSetting),
      enabled: rawSetting.enabled !== false,
      updatedAt:
        typeof rawSetting.updatedAt === "string" ? rawSetting.updatedAt : null,
      lastExecutedAt:
        typeof rawSetting.lastExecutedAt === "string"
          ? rawSetting.lastExecutedAt
          : null,
    };
  }
  for (const [id, defaults] of Object.entries(DEFAULT_ASSISTANT_SETTINGS)) {
    settings[id] = { ...defaults, ...(settings[id] || {}) };
  }
  return settings;
}

function sanitizeLogText(value, maxLength = 500) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(
      /\b(cookie|authorization|password|passwd|token|secret)\b\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .slice(0, maxLength);
}

function normalizeAssistantExecutionLogs(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry) => entry && typeof entry === "object" && !Array.isArray(entry))
    .slice(0, 200)
    .map((entry) => {
      const site = entry.site && typeof entry.site === "object"
        ? entry.site
        : {};
      const allowedStatuses = new Set([
        "success",
        "failure",
        "denied",
        "not-configured",
      ]);
      return {
        id: sanitizeLogText(entry.id, 120),
        timestamp: sanitizeLogText(entry.timestamp, 80),
        assistantId: sanitizeLogText(entry.assistantId, 120),
        assistantName: sanitizeLogText(entry.assistantName, 160),
        actionId: sanitizeLogText(entry.actionId, 120),
        actionName: sanitizeLogText(entry.actionName, 160),
        site: {
          siteId: sanitizeLogText(site.siteId, 120),
          hostname: sanitizeLogText(site.hostname, 253),
        },
        status: allowedStatuses.has(entry.status) ? entry.status : "failure",
        summary: sanitizeLogText(entry.summary),
        errorCode: sanitizeLogText(entry.errorCode, 120),
        errorMessage: sanitizeLogText(entry.errorMessage),
      };
    });
}

function normalizeUiSettings(value) {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  return {
    ...cloneValue(input),
    sessionVisibility: VALID_SESSION_VISIBILITY.has(input.sessionVisibility)
      ? input.sessionVisibility
      : "all",
    contextAssistantCollapsed: input.contextAssistantCollapsed === true,
    usageTrackingEnabled: input.usageTrackingEnabled !== false,
    sitePopupPolicies: normalizeSitePopupPolicies(input.sitePopupPolicies),
    translation: normalizeTranslationSettings(input.translation),
    browserMemory: normalizeBrowserMemorySettings(input.browserMemory),
    search: normalizeSearchSettings(input.search),
    googleSync: {
      sites: input.googleSync?.sites !== false,
      plans: input.googleSync?.plans !== false,
      settings: input.googleSync?.settings !== false,
      searchHistory: input.googleSync?.searchHistory !== false,
      browsingHistory: input.googleSync?.browsingHistory !== false,
      userScriptMetadata: input.googleSync?.userScriptMetadata !== false,
      notifications: input.googleSync?.notifications === true,
    },
  };
}

function normalizeBrowsingHistory(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") return [];
    const id = String(candidate.id || "").trim().slice(0, 180);
    const url = safeOptionalHttpUrl(candidate.url);
    if (!id || !url || seen.has(id)) return [];
    seen.add(id);
    return [{
      id,
      type: "page",
      url,
      title: sanitizeLogText(candidate.title, 500),
      workspaceId: sanitizeLogText(candidate.workspaceId, 120),
      lastVisitedAt: typeof candidate.lastVisitedAt === "string" ? candidate.lastVisitedAt : null,
      updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : candidate.lastVisitedAt || null,
      useCount: Math.max(1, Number(candidate.useCount) || 1),
    }];
  }).sort((left, right) => String(right.lastVisitedAt || "").localeCompare(String(left.lastVisitedAt || ""))).slice(0, 2000);
}

function sanitizePublicConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const blocked = /(?:secret|token|password|cookie|authorization|apiKey|api_key)/i;
  const result = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    const key = String(rawKey || "").slice(0, 100);
    if (!key || blocked.test(key)) continue;
    if (["string", "number", "boolean"].includes(typeof rawValue)) {
      result[key] = typeof rawValue === "string"
        ? sanitizeLogText(rawValue, 500)
        : rawValue;
    }
  }
  return result;
}

function normalizeConnectorConnections(value, now) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) continue;
    const id = sanitizeLogText(candidate.id, 120);
    const connectorType = sanitizeLogText(candidate.connectorType, 80);
    if (!id || seen.has(id) || !VALID_CONNECTOR_TYPES.has(connectorType)) continue;
    seen.add(id);
    result.push({
      id,
      connectorType,
      displayName: sanitizeLogText(candidate.displayName || connectorType, 120),
      status: VALID_CONNECTOR_STATUSES.has(candidate.status)
        ? candidate.status
        : "not-configured",
      publicConfig: sanitizePublicConfig(candidate.publicConfig),
      secretReference: candidate.secretReference
        ? sanitizeLogText(candidate.secretReference, 160)
        : null,
      lastConnectedAt: typeof candidate.lastConnectedAt === "string"
        ? candidate.lastConnectedAt
        : null,
      lastSyncAt: typeof candidate.lastSyncAt === "string" ? candidate.lastSyncAt : null,
      lastErrorCode: candidate.lastErrorCode
        ? sanitizeLogText(candidate.lastErrorCode, 100)
        : null,
      lastErrorMessage: candidate.lastErrorMessage
        ? sanitizeLogText(candidate.lastErrorMessage, 500)
        : null,
      createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : now,
      updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
    });
  }
  return result;
}

function normalizeConnectorExecutions(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .slice(-200)
    .map((item) => ({
      id: sanitizeLogText(item.id, 120),
      connectionId: sanitizeLogText(item.connectionId, 120),
      operation: sanitizeLogText(item.operation, 120),
      startedAt: sanitizeLogText(item.startedAt, 80),
      finishedAt: item.finishedAt ? sanitizeLogText(item.finishedAt, 80) : null,
      status: ["running", "success", "failure", "cancelled"].includes(item.status)
        ? item.status
        : "failure",
      summary: sanitizeLogText(item.summary, 500),
      errorCode: item.errorCode ? sanitizeLogText(item.errorCode, 100) : null,
      sanitizedErrorMessage: item.sanitizedErrorMessage
        ? sanitizeLogText(item.sanitizedErrorMessage, 500)
        : null,
    }));
}

function normalizeExternalObjectLinks(value, now) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value
    .filter((item) => item && typeof item === "object" && !Array.isArray(item))
    .map((item) => {
      const id = sanitizeLogText(item.id, 120);
      if (!id || seen.has(id)) return null;
      seen.add(id);
      return {
        id,
        sourceSystem: sanitizeLogText(item.sourceSystem, 80),
        sourceObjectType: sanitizeLogText(item.sourceObjectType, 80),
        sourceObjectId: sanitizeLogText(item.sourceObjectId, 160),
        targetSystem: sanitizeLogText(item.targetSystem, 80),
        targetObjectType: sanitizeLogText(item.targetObjectType, 80),
        targetObjectId: sanitizeLogText(item.targetObjectId, 160),
        targetUrl: safeOptionalHttpUrl(item.targetUrl),
        metadata: sanitizePublicConfig(item.metadata),
        createdAt: typeof item.createdAt === "string" ? item.createdAt : now,
        updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : now,
      };
    })
    .filter(Boolean)
    .slice(-2000);
}

function ensureDefaultBrowserProfile(value, now) {
  const profiles = [];
  const seen = new Set();
  for (const rawProfile of Array.isArray(value) ? value : []) {
    if (!rawProfile || typeof rawProfile !== "object") continue;
    const id = String(rawProfile.id || "").trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    profiles.push({
      ...cloneValue(rawProfile),
      id,
      name: String(rawProfile.name || id).trim().slice(0, 80) || id,
      type: String(rawProfile.type || "adapter").trim().slice(0, 60) || "adapter",
      isSystem: Boolean(rawProfile.isSystem),
      isReal: Boolean(rawProfile.isReal),
      createdAt:
        typeof rawProfile.createdAt === "string" ? rawProfile.createdAt : now,
      updatedAt:
        typeof rawProfile.updatedAt === "string" ? rawProfile.updatedAt : now,
    });
  }
  for (const definition of [DEFAULT_BROWSER_PROFILE, SAP_BROWSER_PROFILE]) {
    const existingIndex = profiles.findIndex((profile) => profile.id === definition.id);
    const existing = existingIndex >= 0 ? profiles[existingIndex] : null;
    const createdAt = existing?.createdAt || now;
    const systemProfile = {
      ...(existing || {}),
      ...definition,
      createdAt,
      updatedAt: existing?.updatedAt || createdAt,
    };
    if (existingIndex >= 0) profiles[existingIndex] = systemProfile;
    else profiles.push(systemProfile);
  }
  profiles.sort((left, right) => {
    if (left.id === DEFAULT_BROWSER_PROFILE_ID) return -1;
    if (right.id === DEFAULT_BROWSER_PROFILE_ID) return 1;
    if (left.id === SAP_BROWSER_PROFILE_ID) return -1;
    if (right.id === SAP_BROWSER_PROFILE_ID) return 1;
    return 0;
  });
  return profiles;
}

function safeOptionalHttpUrl(value) {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  try {
    return normalizeHttpUrl(value);
  } catch {
    return null;
  }
}

function emptyWorkspaceBrowserState() {
  return {
    activeTabId: null,
    tabs: [],
    activeSiteId: null,
    currentURL: null,
    homeURL: null,
    updatedAt: null,
  };
}

function legacyWorkspaceTabId(workspaceId) {
  return `legacy-${String(workspaceId || "workspace")}`;
}

function browserSnapshotFromTabs(tabs, requestedActiveTabId = null) {
  const normalizedTabs = Array.isArray(tabs) ? tabs.map((tab) => cloneValue(tab)) : [];
  const requestedId = String(requestedActiveTabId || "").trim();
  const activeTab =
    normalizedTabs.find((tab) => tab.tabId === requestedId) ||
    normalizedTabs[0] ||
    null;
  return {
    activeTabId: activeTab?.tabId || null,
    tabs: normalizedTabs,
    activeSiteId: activeTab?.siteId || null,
    currentURL: activeTab?.url || null,
    homeURL: activeTab?.homeURL || activeTab?.url || null,
    updatedAt: activeTab?.updatedAt || null,
  };
}

function normalizeRecentlyClosedTabs(
  value,
  workspaces,
  sites,
  browserProfileIds = new Set([DEFAULT_BROWSER_PROFILE_ID]),
  tabGroups = [],
  options = {},
) {
  const now = isoNow(options.now);
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const activeGroups = new Map(
    tabGroups
      .filter((group) => !group.deletedAt)
      .map((group) => [group.id, group]),
  );
  const seenIds = new Set();
  const records = [];
  for (const [index, candidate] of (Array.isArray(value) ? value : []).entries()) {
    if (!candidate || typeof candidate !== "object") continue;
    const workspaceId = String(candidate.workspaceId || "").trim().slice(0, 120);
    const url = safeOptionalHttpUrl(candidate.url ?? candidate.currentURL);
    const tabId = String(candidate.tabId || candidate.sessionId || "")
      .trim()
      .slice(0, 120);
    if (!workspaceIds.has(workspaceId) || !url || !tabId) continue;
    const closedAt = typeof candidate.closedAt === "string" && !Number.isNaN(Date.parse(candidate.closedAt))
      ? candidate.closedAt
      : now;
    const fallbackId = `closed-${createHash("sha256")
      .update(`${workspaceId}\n${tabId}\n${closedAt}\n${index}`)
      .digest("hex")
      .slice(0, 32)}`;
    const id = String(candidate.id || fallbackId).trim().slice(0, 120) || fallbackId;
    if (seenIds.has(id)) continue;
    seenIds.add(id);
    const requestedSiteId = String(candidate.siteId || "").trim();
    const site = requestedSiteId
      ? sites.find((item) => item.id === requestedSiteId && item.workspaceId === workspaceId)
      : null;
    const homeURL = safeOptionalHttpUrl(candidate.homeURL ?? candidate.homeUrl) || site?.url || url;
    const requestedBrowserProfileId = String(candidate.browserProfileId || "").trim();
    const browserProfileId = isSapSessionUrl(url) || isSapSessionUrl(homeURL)
      ? SAP_BROWSER_PROFILE_ID
      : browserProfileIds.has(requestedBrowserProfileId)
        ? requestedBrowserProfileId
        : site?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID;
    const requestedGroupId = String(candidate.tabGroupId || "").trim();
    const group = activeGroups.get(requestedGroupId);
    records.push({
      id,
      workspaceId,
      tabId,
      siteId: site?.id || null,
      browserProfileId,
      title: String(candidate.title || site?.name || "").trim().slice(0, 200),
      url,
      normalizedUrl: url,
      homeURL,
      favicon: safeOptionalHttpUrl(candidate.favicon),
      createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : closedAt,
      lastActiveAt: typeof candidate.lastActiveAt === "string" ? candidate.lastActiveAt : closedAt,
      reliableContext:
        candidate.reliableContext && typeof candidate.reliableContext === "object"
          ? sanitizePublicConfig(candidate.reliableContext)
          : null,
      keepRunning: candidate.keepRunning === true,
      tabGroupId: group?.workspaceId === workspaceId ? requestedGroupId : null,
      groupSortOrder: Number.isFinite(Number(candidate.groupSortOrder))
        ? Number(candidate.groupSortOrder)
        : 0,
      closedIndex: Number.isInteger(Number(candidate.closedIndex))
        ? Math.max(0, Number(candidate.closedIndex))
        : 0,
      allowDuplicate: candidate.allowDuplicate === true,
      closedAt,
    });
  }
  return records
    .sort((left, right) => Date.parse(right.closedAt) - Date.parse(left.closedAt))
    .slice(0, MAX_RECENTLY_CLOSED_TABS);
}

function normalizeWorkspaceBrowserStates(
  value,
  workspaces,
  sites,
  browserProfileIds = new Set([DEFAULT_BROWSER_PROFILE_ID]),
  tabGroups = [],
) {
  const input = value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
  const result = {};
  for (const workspace of workspaces) {
    const validGroupIds = new Set(
      tabGroups
        .filter((group) => group.workspaceId === workspace.id && !group.deletedAt)
        .map((group) => group.id),
    );
    const raw = input[workspace.id] && typeof input[workspace.id] === "object"
      ? input[workspace.id]
      : {};
    const hasExplicitTabs = Array.isArray(raw.tabs);
    const sourceTabs = hasExplicitTabs
      ? raw.tabs
      : safeOptionalHttpUrl(raw.currentURL ?? raw.currentUrl ?? raw.url)
        ? [
            {
              tabId: legacyWorkspaceTabId(workspace.id),
              siteId: raw.activeSiteId || raw.siteId || null,
              title: raw.title || "",
              url: raw.currentURL ?? raw.currentUrl ?? raw.url,
              homeURL: raw.homeURL ?? raw.homeUrl,
              updatedAt: raw.updatedAt,
            },
          ]
        : [];
    const seenTabIds = new Set();
    const seenSiteIds = new Set();
    const seenAnonymousUrls = new Set();
    const tabs = [];
    sourceTabs.forEach((candidate, index) => {
      if (!candidate || typeof candidate !== "object") return;
      const url = safeOptionalHttpUrl(
        candidate.url ?? candidate.currentURL ?? candidate.currentUrl,
      );
      if (!url) return;
      let tabId = String(
        candidate.tabId || candidate.id || `tab-${workspace.id}-${index + 1}`,
      )
        .trim()
        .slice(0, 120);
      if (!tabId) tabId = `tab-${workspace.id}-${index + 1}`;
      const baseTabId = tabId;
      let suffix = 2;
      while (seenTabIds.has(tabId)) {
        tabId = `${baseTabId.slice(0, 110)}-${suffix}`;
        suffix += 1;
      }
      seenTabIds.add(tabId);
      const requestedSiteId = String(
        candidate.siteId || candidate.activeSiteId || "",
      ).trim();
      const site = requestedSiteId
        ? sites.find(
            (item) =>
              item.id === requestedSiteId && item.workspaceId === workspace.id,
          )
        : null;
      const homeURL =
        safeOptionalHttpUrl(candidate.homeURL ?? candidate.homeUrl) ||
        site?.url ||
        url;
      const requestedBrowserProfileId = String(candidate.browserProfileId || "").trim();
      const browserProfileId = isSapSessionUrl(url) || isSapSessionUrl(homeURL)
        ? SAP_BROWSER_PROFILE_ID
        : browserProfileIds.has(requestedBrowserProfileId)
          ? requestedBrowserProfileId
          : site?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID;
      const convergedDuplicate = site
        ? seenSiteIds.has(site.id)
        : seenAnonymousUrls.has(url);
      const allowDuplicate = candidate.allowDuplicate === true || convergedDuplicate;
      if (!allowDuplicate && site) seenSiteIds.add(site.id);
      if (!allowDuplicate && !site) seenAnonymousUrls.add(url);
      const requestedTabGroupId = String(candidate.tabGroupId || "").trim();
      tabs.push({
        tabId,
        sessionId: tabId,
        siteId: site?.id || null,
        browserProfileId,
        title: String(candidate.title || site?.name || "").trim().slice(0, 200),
        url,
        normalizedUrl: url,
        homeURL,
        favicon: safeOptionalHttpUrl(candidate.favicon),
        createdAt:
          typeof candidate.createdAt === "string"
            ? candidate.createdAt
            : typeof candidate.updatedAt === "string"
              ? candidate.updatedAt
              : null,
        lastActiveAt:
          typeof candidate.lastActiveAt === "string"
            ? candidate.lastActiveAt
            : typeof candidate.updatedAt === "string"
              ? candidate.updatedAt
              : null,
        loadingState: ["idle", "loading"].includes(candidate.loadingState)
          ? candidate.loadingState
          : "idle",
        errorState: candidate.errorState
          ? sanitizeLogText(candidate.errorState, 500)
          : null,
        reliableContext:
          candidate.reliableContext && typeof candidate.reliableContext === "object"
            ? sanitizePublicConfig(candidate.reliableContext)
            : null,
        keepRunning: candidate.keepRunning === true,
        tabGroupId: validGroupIds.has(requestedTabGroupId) ? requestedTabGroupId : null,
        groupSortOrder: Number.isFinite(Number(candidate.groupSortOrder))
          ? Number(candidate.groupSortOrder)
          : index,
        ...(allowDuplicate ? { allowDuplicate: true } : {}),
        updatedAt:
          typeof candidate.updatedAt === "string" ? candidate.updatedAt : null,
      });
    });
    const requestedActiveTabId = String(raw.activeTabId || "").trim();
    const legacyActiveSiteId = String(raw.activeSiteId || raw.siteId || "").trim();
    const legacyActiveTab = legacyActiveSiteId
      ? tabs.find((tab) => tab.siteId === legacyActiveSiteId)
      : null;
    result[workspace.id] = browserSnapshotFromTabs(
      tabs,
      requestedActiveTabId || legacyActiveTab?.tabId || tabs[0]?.tabId || null,
    );
  }
  return result;
}

function appendQuarantine(existing, key, rejected) {
  const quarantine =
    existing && typeof existing === "object" && !Array.isArray(existing)
      ? cloneValue(existing)
      : {};
  const previous = Array.isArray(quarantine[key]) ? quarantine[key] : [];
  if (rejected.length) quarantine[key] = [...previous, ...cloneValue(rejected)];
  else if (previous.length) quarantine[key] = previous;
  return quarantine;
}

function normalizeWorkspace(workspace, index, now) {
  if (!workspace || typeof workspace !== "object") return null;
  const id = String(workspace.id || "").trim();
  if (!id) return null;
  const createdAt = typeof workspace.createdAt === "string"
    ? workspace.createdAt
    : now;
  return {
    ...cloneValue(workspace),
    id,
    name: String(workspace.name || id).trim().slice(0, 80) || id,
    type: String(workspace.type || "custom").trim().slice(0, 40) || "custom",
    icon: String(workspace.icon || "folder").trim().slice(0, 80) || "folder",
    sortOrder: Number.isFinite(Number(workspace.sortOrder))
      ? Number(workspace.sortOrder)
      : SYSTEM_WORKSPACES.length + index,
    isSystem: Boolean(workspace.isSystem),
    createdAt,
    updatedAt: typeof workspace.updatedAt === "string"
      ? workspace.updatedAt
      : createdAt,
  };
}

function ensureSystemWorkspaces(value, now) {
  const byId = new Map();
  const input = Array.isArray(value) ? value : [];
  input.forEach((workspace, index) => {
    const normalized = normalizeWorkspace(workspace, index, now);
    if (normalized && !byId.has(normalized.id)) byId.set(normalized.id, normalized);
  });

  for (const definition of SYSTEM_WORKSPACES) {
    const existing = byId.get(definition.id);
    const createdAt = existing?.createdAt || now;
    byId.set(definition.id, {
      ...(existing || {}),
      ...definition,
      createdAt,
      updatedAt: existing?.updatedAt || createdAt,
    });
  }

  return Array.from(byId.values()).sort((left, right) => {
    const order = Number(left.sortOrder) - Number(right.sortOrder);
    return order || left.name.localeCompare(right.name, "zh-CN");
  });
}

function normalizeStoredSite(site, index, workspaceIds, browserProfileIds, now) {
  if (!site || typeof site !== "object") {
    throw new StateModelError(
      "INVALID_STORED_SITE",
      `第 ${index + 1} 个站点不是有效对象`,
    );
  }
  const url = normalizeHttpUrl(site.url);
  const workspaceId = workspaceIds.has(String(site.workspaceId || ""))
    ? String(site.workspaceId)
    : DEFAULT_WORKSPACE_ID;
  const hostname = new URL(url).hostname;
  const name = String(site.name || hostname).trim().slice(0, 80) || hostname;
  const createdAt = typeof site.createdAt === "string" ? site.createdAt : null;
  const siteKind = VALID_SITE_KINDS.has(site.siteKind)
    ? site.siteKind
    : "normal";
  const openMode = VALID_OPEN_MODES.has(site.openMode)
    ? site.openMode
    : "internal";
  return {
    ...cloneValue(site),
    id: String(site.id || stableMissingSiteId(site, index, url)),
    name,
    shortName: String(site.shortName || shortNameForSite(name)).slice(0, 3),
    url,
    workspaceId,
    siteKind,
    openMode,
    browserProfileId: isSapSessionUrl(url)
      ? SAP_BROWSER_PROFILE_ID
      : browserProfileIds.has(String(site.browserProfileId || ""))
        ? String(site.browserProfileId)
        : DEFAULT_BROWSER_PROFILE_ID,
    tagIds: normalizeTagIdList(site.tagIds, { limit: 100 }),
    assistantIds: normalizeAssistantIds(site.assistantIds),
    pinned: site.pinned !== false,
    order: Number.isFinite(Number(site.order)) ? Number(site.order) : index,
    lastOpenedAt:
      typeof site.lastOpenedAt === "string" ? site.lastOpenedAt : null,
    createdAt,
    updatedAt:
      typeof site.updatedAt === "string" ? site.updatedAt : createdAt || now,
  };
}

function normalizeSiteOrders(sites, workspaceIds = undefined) {
  const next = sites.map((site) => ({ ...site }));
  const requested = workspaceIds
    ? new Set(Array.isArray(workspaceIds) ? workspaceIds : [workspaceIds])
    : null;
  const groups = new Map();

  next.forEach((site, index) => {
    if (requested && !requested.has(site.workspaceId)) return;
    const group = groups.get(site.workspaceId) || [];
    group.push({ index, order: Number(site.order), originalIndex: index });
    groups.set(site.workspaceId, group);
  });

  for (const group of groups.values()) {
    group
      .sort((left, right) => {
        const leftOrder = Number.isFinite(left.order) ? left.order : left.originalIndex;
        const rightOrder = Number.isFinite(right.order) ? right.order : right.originalIndex;
        return leftOrder - rightOrder || left.originalIndex - right.originalIndex;
      })
      .forEach((entry, order) => {
        next[entry.index].order = order;
      });
  }
  return next;
}

function defaultAutomations(value) {
  const input = value && typeof value === "object" ? cloneValue(value) : {};
  const naixi = input.naixi && typeof input.naixi === "object"
    ? input.naixi
    : {};
  return {
    ...input,
    naixi: {
      ...DEFAULT_NAIXI_AUTOMATION,
      ...naixi,
    },
  };
}

function createInitialState(options = {}) {
  const now = isoNow(options.now);
  const workspaces = ensureSystemWorkspaces([], now);
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const browserProfiles = ensureDefaultBrowserProfile([], now);
  const browserProfileIds = new Set(
    browserProfiles.map((profile) => profile.id),
  );
  const defaultSites = Array.isArray(options.defaultSites) ? options.defaultSites : [];
  const sites = normalizeSiteOrders(
    defaultSites.map((site, index) =>
      normalizeStoredSite(site, index, workspaceIds, browserProfileIds, now),
    ),
  );
  const tabGroups = normalizeTabGroups([], workspaceIds, { now });
  const workspaceBrowserStates = normalizeWorkspaceBrowserStates(
    {},
    workspaces,
    sites,
    browserProfileIds,
    tabGroups,
  );
  const timelineTracks = normalizeTimelineTracks([], { now });
  return {
    version: CURRENT_SCHEMA_VERSION,
    workspaces,
    activeWorkspaceId: DEFAULT_WORKSPACE_ID,
    browserProfiles,
    tabGroups,
    recentlyClosedTabs: [],
    workspaceBrowserStates,
    sites,
    bookmarks: [],
    importMeta: null,
    automations: defaultAutomations(),
    assistantSettings: normalizeAssistantSettings(),
    assistantExecutionLogs: [],
    uiSettings: normalizeUiSettings(),
    searchHistory: [],
    browsingHistory: [],
    connectorConnections: [],
    connectorExecutions: [],
    externalObjectLinks: [],
    localTasks: [],
    taskReminders: [],
    taskSettings: normalizeTaskSettings(),
    timelineTracks,
    timelineEvents: [],
    timelineUiSettings: normalizeTimelineUiSettings({}, {
      currentYear: new Date(now).getUTCFullYear(),
    }),
    habits: [],
    habitCheckIns: [],
    habitReminders: [],
    rewardLedger: [],
    usageDayAggregates: [],
    contentTagGroups: [],
    contentTags: [],
    contentTagAliases: [],
    contentTagMergeRecords: [],
    timeZone: deviceTimeZone(),
    userScripts: normalizeUserScripts([], { now }),
    userScriptPermissions: [],
    userScriptExecutions: [],
    userScriptVersions: [],
    userScriptValues: {},
    createdAt: now,
    updatedAt: now,
  };
}

function normalizeStateV4(value, options = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StateModelError("INVALID_STATE", "应用数据根节点必须是对象");
  }
  const now = isoNow(options.now);
  const input = cloneValue(value);
  const contentTagState = normalizeContentTagState(input, { now });
  // Older builds already carried optional tagIds on some objects. Keep unknown
  // references during migration rather than silently dropping user data; all
  // new writes are validated against the active content-tag catalog.
  const normalizeReferenceTagIds = (tagIds) => normalizeTagIdList(tagIds, { limit: 100 });
  const workspaces = ensureSystemWorkspaces(input.workspaces, now);
  const workspaceIds = new Set(workspaces.map((workspace) => workspace.id));
  const browserProfiles = ensureDefaultBrowserProfile(input.browserProfiles, now);
  const browserProfileIds = new Set(
    browserProfiles.map((profile) => profile.id),
  );
  const inputSites = Array.isArray(input.sites)
    ? input.sites
    : Array.isArray(options.defaultSites)
      ? options.defaultSites
      : [];
  const rejectedSites = [];
  const validSites = [];
  inputSites.forEach((site, index) => {
    try {
      validSites.push(
        normalizeStoredSite(
          site,
          index,
          workspaceIds,
          browserProfileIds,
          now,
        ),
      );
    } catch (error) {
      rejectedSites.push({
        index,
        reason: String(error?.code || "INVALID_STORED_SITE"),
        value: cloneValue(site),
      });
    }
  });
  const sites = normalizeSiteOrders(validSites).map((site) => ({
    ...site,
    tagIds: normalizeReferenceTagIds(site.tagIds),
  }));
  const rejectedBookmarks = [];
  const bookmarks = [];
  const inputBookmarks = Array.isArray(input.bookmarks) ? input.bookmarks : [];
  inputBookmarks.forEach((bookmark, index) => {
    try {
      bookmarks.push(normalizeStoredBookmark(bookmark));
    } catch (error) {
      rejectedBookmarks.push({
        index,
        reason: String(error?.code || "INVALID_STORED_BOOKMARK"),
        value: cloneValue(bookmark),
      });
    }
  });
  const activeWorkspaceId = workspaceIds.has(String(input.activeWorkspaceId || ""))
    ? String(input.activeWorkspaceId)
    : DEFAULT_WORKSPACE_ID;
  const tabGroups = normalizeTabGroups(input.tabGroups, workspaceIds, { now });
  const recentlyClosedTabs = normalizeRecentlyClosedTabs(
    input.recentlyClosedTabs,
    workspaces,
    sites,
    browserProfileIds,
    tabGroups,
    { now },
  );
  const workspaceBrowserStates = normalizeWorkspaceBrowserStates(
    input.workspaceBrowserStates,
    workspaces,
    sites,
    browserProfileIds,
    tabGroups,
  );
  let migrationQuarantine = appendQuarantine(
    input.migrationQuarantine,
    "sites",
    rejectedSites,
  );
  migrationQuarantine = appendQuarantine(
    migrationQuarantine,
    "bookmarks",
    rejectedBookmarks,
  );
  const localTasks = normalizeLocalTasks(input.localTasks, {
    now,
    workspaceIds: Array.from(workspaceIds),
    defaultWorkspaceId: activeWorkspaceId,
    timeZone: String(input.timeZone || deviceTimeZone()),
  }).map((task) => ({ ...task, tagIds: normalizeReferenceTagIds(task.tagIds) }));
  const normalizedTaskReminders = normalizeTaskReminders(
    input.taskReminders,
    localTasks.map((task) => task.id),
  );
  const taskReminders = localTasks.flatMap((task) =>
    buildTaskReminders(
      task,
      normalizedTaskReminders.filter((reminder) => reminder.taskId === task.id),
    ),
  );
  const timelineTracks = normalizeTimelineTracks(input.timelineTracks, { now });
  const timelineEvents = normalizeTimelineEvents(input.timelineEvents, {
    now,
    trackIds: timelineTracks.map((track) => track.id),
    workspaceIds: Array.from(workspaceIds),
    defaultWorkspaceId: activeWorkspaceId,
  }).map((event) => ({ ...event, tagIds: normalizeReferenceTagIds(event.tagIds) }));
  const habits = normalizeHabitDefinitions(input.habits, {
    now,
    defaultWorkspaceId: activeWorkspaceId,
  }).map((habit) => ({ ...habit, tagIds: normalizeReferenceTagIds(habit.tagIds) }));
  const habitIds = habits.map((habit) => habit.id);
  const habitCheckIns = normalizeHabitCheckIns(input.habitCheckIns, { now, habitIds });
  const habitReminders = normalizeHabitReminders(input.habitReminders, habitIds);
  const rewardLedger = normalizeRewardLedger(input.rewardLedger, { now, habitIds });
  const inputUserScriptsById = new Map((Array.isArray(input.userScripts) ? input.userScripts : [])
    .map((script) => [String(script?.id || ""), script]));
  const userScripts = normalizeUserScripts(input.userScripts, { now }).map((script) => ({
    ...script,
    tagIds: normalizeReferenceTagIds(inputUserScriptsById.get(script.id)?.tagIds),
  }));
  const userScriptIds = userScripts.map((script) => script.id);

  const uiSettings = normalizeUiSettings(input.uiSettings);
  const normalized = {
    ...input,
    version: CURRENT_SCHEMA_VERSION,
    workspaces,
    activeWorkspaceId,
    browserProfiles,
    tabGroups,
    recentlyClosedTabs,
    workspaceBrowserStates,
    sites,
    bookmarks,
    importMeta:
      input.importMeta && typeof input.importMeta === "object"
        ? cloneValue(input.importMeta)
        : null,
    automations: defaultAutomations(input.automations),
    assistantSettings: normalizeAssistantSettings(input.assistantSettings),
    assistantExecutionLogs: normalizeAssistantExecutionLogs(
      input.assistantExecutionLogs,
    ),
    uiSettings,
    searchHistory: normalizeSearchHistory(input.searchHistory, uiSettings.search),
    browsingHistory: normalizeBrowsingHistory(input.browsingHistory),
    connectorConnections: normalizeConnectorConnections(
      input.connectorConnections,
      now,
    ),
    connectorExecutions: normalizeConnectorExecutions(input.connectorExecutions),
    externalObjectLinks: normalizeExternalObjectLinks(input.externalObjectLinks, now),
    localTasks,
    taskReminders,
    taskSettings: normalizeTaskSettings(input.taskSettings),
    timelineTracks,
    timelineEvents,
    timelineUiSettings: normalizeTimelineUiSettings(input.timelineUiSettings, {
      currentYear: new Date(now).getUTCFullYear(),
    }),
    habits,
    habitCheckIns,
    habitReminders,
    rewardLedger,
    usageDayAggregates: normalizeUsageDayAggregates(input.usageDayAggregates),
    ...contentTagState,
    timeZone: String(input.timeZone || deviceTimeZone()).slice(0, 100),
    userScripts,
    userScriptPermissions: normalizeUserScriptPermissions(input.userScriptPermissions, userScriptIds),
    userScriptExecutions: normalizeUserScriptExecutions(input.userScriptExecutions, userScriptIds),
    userScriptVersions: normalizeUserScriptVersions(input.userScriptVersions, userScriptIds),
    userScriptValues: normalizeUserScriptValues(input.userScriptValues, userScriptIds),
    createdAt: typeof input.createdAt === "string" ? input.createdAt : now,
    updatedAt:
      typeof input.updatedAt === "string"
        ? input.updatedAt
        : typeof input.createdAt === "string"
          ? input.createdAt
          : now,
  };
  if (Object.keys(migrationQuarantine).length) {
    normalized.migrationQuarantine = migrationQuarantine;
  } else {
    delete normalized.migrationQuarantine;
  }
  return normalized;
}

function migrateState(value, options = {}) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new StateModelError("INVALID_STATE", "应用数据根节点必须是对象");
  }
  const parsedVersion = Number(value.version);
  const fromVersion = Number.isInteger(parsedVersion) && parsedVersion > 0
    ? parsedVersion
    : 1;
  if (fromVersion > CURRENT_SCHEMA_VERSION) {
    throw new StateModelError(
      "UNSUPPORTED_SCHEMA_VERSION",
      `数据版本 ${fromVersion} 高于当前支持的版本 ${CURRENT_SCHEMA_VERSION}`,
    );
  }
  const state = normalizeStateV4(value, options);
  const changed = JSON.stringify(value) !== JSON.stringify(state);
  return {
    state,
    fromVersion,
    toVersion: CURRENT_SCHEMA_VERSION,
    migrated: fromVersion < CURRENT_SCHEMA_VERSION,
    changed,
  };
}

function workspaceById(state, workspaceId) {
  return state.workspaces.find((workspace) => workspace.id === workspaceId) || null;
}

function requireWorkspace(state, workspaceId) {
  const id = String(workspaceId || "").trim();
  const workspace = workspaceById(state, id);
  if (!workspace) {
    throw new StateModelError("WORKSPACE_NOT_FOUND", "找不到指定空间", {
      workspaceId: id,
    });
  }
  return workspace;
}

function requireBrowserProfile(state, browserProfileId) {
  const id = String(browserProfileId || "").trim();
  const profile = state.browserProfiles.find((item) => item.id === id);
  if (!profile) {
    throw new StateModelError("BROWSER_PROFILE_NOT_FOUND", "找不到指定浏览身份", {
      browserProfileId: id,
    });
  }
  return profile;
}

function stateForMutation(state, options = {}) {
  return normalizeStateV4(state, options);
}

function touchState(state, now) {
  state.updatedAt = now;
  return state;
}

function sitesForWorkspace(state, workspaceId, options = {}) {
  const normalized = stateForMutation(state, options);
  requireWorkspace(normalized, workspaceId);
  return normalized.sites
    .filter(
      (site) =>
        site.workspaceId === workspaceId &&
        (!options.pinnedOnly || site.pinned),
    )
    .sort((left, right) => left.order - right.order)
    .map((site) => cloneValue(site));
}

function getWorkspaceBrowserState(state, workspaceId, options = {}) {
  const normalized = stateForMutation(state, options);
  requireWorkspace(normalized, workspaceId);
  return cloneValue(
    normalized.workspaceBrowserStates[workspaceId] ||
      emptyWorkspaceBrowserState(),
  );
}

function normalizeBrowserTabsForMutation(state, workspaceId, tabs, now) {
  if (!Array.isArray(tabs)) {
    throw new StateModelError("INVALID_BROWSER_TABS", "网页标签必须是数组");
  }
  const seen = new Set();
  const seenSiteIds = new Set();
  const seenAnonymousUrls = new Set();
  return tabs.map((candidate, index) => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new StateModelError("INVALID_BROWSER_TAB", "网页标签数据无效");
    }
    const tabId = String(candidate.tabId || candidate.id || "").trim().slice(0, 120);
    if (!tabId) {
      throw new StateModelError("INVALID_BROWSER_TAB_ID", `第 ${index + 1} 个标签缺少编号`);
    }
    if (seen.has(tabId)) {
      throw new StateModelError("DUPLICATE_BROWSER_TAB_ID", "同一空间内的标签编号不能重复");
    }
    seen.add(tabId);
    const url = normalizeHttpUrl(
      candidate.url ?? candidate.currentURL ?? candidate.currentUrl,
    );
    const requestedSiteId = String(candidate.siteId || "").trim();
    const allowDuplicate = candidate.allowDuplicate === true;
    let site = null;
    if (requestedSiteId) {
      site = state.sites.find(
        (item) => item.id === requestedSiteId && item.workspaceId === workspaceId,
      );
      if (!site) {
        throw new StateModelError(
          "WORKSPACE_BROWSER_SITE_MISMATCH",
          "网页标签对应的站点不属于指定空间",
        );
      }
      if (!allowDuplicate && seenSiteIds.has(site.id)) {
        throw new StateModelError(
          "DUPLICATE_BROWSER_SITE_TAB",
          "同一空间内的同一站点只能打开一个标签",
        );
      }
      if (!allowDuplicate) seenSiteIds.add(site.id);
    }
    const homeURL =
      safeOptionalHttpUrl(candidate.homeURL ?? candidate.homeUrl) ||
      site?.url ||
      url;
    const requestedBrowserProfileId = String(candidate.browserProfileId || "").trim();
    const browserProfileId = isSapSessionUrl(url) || isSapSessionUrl(homeURL)
      ? SAP_BROWSER_PROFILE_ID
      : state.browserProfiles.some(
          (profile) => profile.id === requestedBrowserProfileId,
        )
        ? requestedBrowserProfileId
        : site?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID;
    requireBrowserProfile(state, browserProfileId);
    if (
      !allowDuplicate &&
      !site &&
      seenAnonymousUrls.has(url)
    ) {
      throw new StateModelError(
        "DUPLICATE_BROWSER_TAB_URL",
        "同一空间内的临时网页地址不能重复打开",
      );
    }
    if (!allowDuplicate && !site) seenAnonymousUrls.add(url);
    const requestedTabGroupId = String(candidate.tabGroupId || "").trim();
    const tabGroupId = state.tabGroups.some(
      (group) =>
        group.id === requestedTabGroupId &&
        group.workspaceId === workspaceId &&
        !group.deletedAt,
    )
      ? requestedTabGroupId
      : null;
    return {
      tabId,
      sessionId: tabId,
      siteId: site?.id || null,
      browserProfileId,
      title: String(candidate.title || site?.name || "").trim().slice(0, 200),
      url,
      normalizedUrl: url,
      homeURL,
      favicon: safeOptionalHttpUrl(candidate.favicon),
      createdAt:
        typeof candidate.createdAt === "string" ? candidate.createdAt : now,
      lastActiveAt:
        typeof candidate.lastActiveAt === "string"
          ? candidate.lastActiveAt
          : typeof candidate.updatedAt === "string"
            ? candidate.updatedAt
            : now,
      loadingState: ["idle", "loading"].includes(candidate.loadingState)
        ? candidate.loadingState
        : "idle",
      errorState: candidate.errorState
        ? sanitizeLogText(candidate.errorState, 500)
        : null,
      reliableContext:
        candidate.reliableContext && typeof candidate.reliableContext === "object"
          ? sanitizePublicConfig(candidate.reliableContext)
          : null,
      keepRunning: candidate.keepRunning === true,
      tabGroupId,
      groupSortOrder: Number.isFinite(Number(candidate.groupSortOrder))
        ? Number(candidate.groupSortOrder)
        : index,
      ...(allowDuplicate ? { allowDuplicate: true } : {}),
      updatedAt:
        typeof candidate.updatedAt === "string" ? candidate.updatedAt : now,
    };
  });
}

function setWorkspaceBrowserTabsInState(
  state,
  workspaceId,
  patch,
  options = {},
) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(workspaceId || "");
  requireWorkspace(next, id);
  const current = next.workspaceBrowserStates[id] || emptyWorkspaceBrowserState();
  const tabs = normalizeBrowserTabsForMutation(
    next,
    id,
    Object.prototype.hasOwnProperty.call(patch || {}, "tabs")
      ? patch.tabs
      : current.tabs,
    now,
  );
  const requestedActiveTabId = Object.prototype.hasOwnProperty.call(
    patch || {},
    "activeTabId",
  )
    ? String(patch?.activeTabId || "").trim()
    : current.activeTabId;
  if (
    requestedActiveTabId &&
    !tabs.some((tab) => tab.tabId === requestedActiveTabId)
  ) {
    throw new StateModelError(
      "BROWSER_TAB_NOT_FOUND",
      "找不到要激活的网页标签",
    );
  }
  const browserState = browserSnapshotFromTabs(tabs, requestedActiveTabId);
  next.workspaceBrowserStates = {
    ...next.workspaceBrowserStates,
    [id]: browserState,
  };
  touchState(next, now);
  return { state: next, browserState: cloneValue(browserState) };
}

function setWorkspaceBrowserStateInState(
  state,
  workspaceId,
  patch,
  options = {},
) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(workspaceId || "");
  requireWorkspace(next, id);
  const current = next.workspaceBrowserStates[id] || emptyWorkspaceBrowserState();
  if (
    Object.prototype.hasOwnProperty.call(patch || {}, "tabs") ||
    Object.prototype.hasOwnProperty.call(patch || {}, "activeTabId")
  ) {
    return setWorkspaceBrowserTabsInState(next, id, patch, {
      ...options,
      now,
    });
  }

  let tabs = current.tabs.map((tab) => ({ ...tab }));
  let activeTabId = current.activeTabId;
  let activeIndex = tabs.findIndex((tab) => tab.tabId === activeTabId);
  let currentURL = activeIndex >= 0 ? tabs[activeIndex].url : null;
  if (Object.prototype.hasOwnProperty.call(patch || {}, "currentURL")) {
    if (patch.currentURL === null || String(patch.currentURL || "").trim() === "") {
      tabs = [];
      activeTabId = null;
      activeIndex = -1;
      currentURL = null;
    } else {
      currentURL = normalizeHttpUrl(patch.currentURL);
      if (activeIndex < 0) {
        let tabId = String(patch?.tabId || legacyWorkspaceTabId(id)).trim().slice(0, 120);
        if (!tabId) tabId = legacyWorkspaceTabId(id);
        let suffix = 2;
        const base = tabId.slice(0, 110);
        while (tabs.some((tab) => tab.tabId === tabId)) {
          tabId = `${base}-${suffix}`;
          suffix += 1;
        }
        tabs.push({
          tabId,
          siteId: null,
          title: "",
          url: currentURL,
          homeURL: currentURL,
          updatedAt: now,
        });
        activeTabId = tabId;
        activeIndex = tabs.length - 1;
      } else {
        tabs[activeIndex].url = currentURL;
        tabs[activeIndex].updatedAt = now;
      }
    }
  }

  let activeSiteId = activeIndex >= 0 ? tabs[activeIndex].siteId : null;
  if (Object.prototype.hasOwnProperty.call(patch || {}, "activeSiteId")) {
    const requested = String(patch?.activeSiteId || "").trim();
    if (!requested) {
      activeSiteId = null;
    } else {
      const site = next.sites.find(
        (item) => item.id === requested && item.workspaceId === id,
      );
      if (!site) {
        throw new StateModelError(
          "WORKSPACE_BROWSER_SITE_MISMATCH",
          "当前页面站点不属于指定空间",
        );
      }
      activeSiteId = site.id;
    }
    if (activeIndex >= 0) tabs[activeIndex].siteId = activeSiteId;
  }
  let homeURL = activeIndex >= 0 ? tabs[activeIndex].homeURL : null;
  if (Object.prototype.hasOwnProperty.call(patch || {}, "homeURL")) {
    if (patch.homeURL === null || String(patch.homeURL || "").trim() === "") {
      homeURL = null;
    } else {
      homeURL = normalizeHttpUrl(patch.homeURL);
    }
  }
  if (currentURL && !homeURL) {
    homeURL =
      next.sites.find((site) => site.id === activeSiteId)?.url || currentURL;
  }
  if (activeIndex >= 0) {
    tabs[activeIndex] = {
      ...tabs[activeIndex],
      siteId: activeSiteId,
      homeURL,
      title:
        Object.prototype.hasOwnProperty.call(patch || {}, "title")
          ? String(patch.title || "").trim().slice(0, 200)
          : tabs[activeIndex].title,
      updatedAt: now,
    };
  }
  return setWorkspaceBrowserTabsInState(
    next,
    id,
    { tabs, activeTabId },
    { ...options, now },
  );
}

function clearWorkspaceBrowserStateInState(state, workspaceId, options = {}) {
  return setWorkspaceBrowserTabsInState(
    state,
    workspaceId,
    { tabs: [], activeTabId: null },
    options,
  );
}

function findSiteByWorkspaceUrl(state, workspaceId, rawUrl, excludeSiteId = "") {
  const normalizedUrl = normalizeHttpUrl(rawUrl);
  return (
    state.sites.find(
      (site) =>
        site.workspaceId === workspaceId &&
        site.url === normalizedUrl &&
        site.id !== excludeSiteId,
    ) || null
  );
}

function validateSiteKind(value, fallback) {
  const next = value === undefined ? fallback : value;
  if (!VALID_SITE_KINDS.has(next)) {
    throw new StateModelError("INVALID_SITE_KIND", "站点类型无效");
  }
  return next;
}

function validateOpenMode(value, fallback) {
  const next = value === undefined ? fallback : value;
  if (!VALID_OPEN_MODES.has(next)) {
    throw new StateModelError("INVALID_OPEN_MODE", "站点打开方式无效");
  }
  return next;
}

function addSiteToState(state, input, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const workspaceId = String(
    input?.workspaceId || next.activeWorkspaceId || DEFAULT_WORKSPACE_ID,
  );
  requireWorkspace(next, workspaceId);
  const url = normalizeHttpUrl(input?.url);
  const existing = findSiteByWorkspaceUrl(next, workspaceId, url);
  if (existing) {
    return { state: next, site: cloneValue(existing), existed: true };
  }

  const hostname = new URL(url).hostname;
  const name = String(input?.name || hostname).trim().slice(0, 80);
  if (!name) throw new StateModelError("INVALID_SITE_NAME", "请输入站点名称");
  const siteKind = validateSiteKind(
    input?.siteKind,
    workspaceId === "work" ? "workApp" : "normal",
  );
  const openMode = validateOpenMode(input?.openMode, "internal");
  const browserProfileId = isSapSessionUrl(url)
    ? SAP_BROWSER_PROFILE_ID
    : String(input?.browserProfileId || DEFAULT_BROWSER_PROFILE_ID).trim() ||
      DEFAULT_BROWSER_PROFILE_ID;
  requireBrowserProfile(next, browserProfileId);
  const idFactory = typeof options.idFactory === "function"
    ? options.idFactory
    : randomUUID;
  const id = String(idFactory()).trim();
  if (!id || next.sites.some((site) => site.id === id)) {
    throw new StateModelError("DUPLICATE_SITE_ID", "无法生成唯一站点编号");
  }
  const order = next.sites.filter((site) => site.workspaceId === workspaceId).length;
  const site = {
    id,
    name,
    shortName: String(input?.shortName || shortNameForSite(name)).slice(0, 3),
    url,
    color: /^#[0-9a-f]{6}$/i.test(input?.color || "")
      ? input.color
      : "#5b7cfa",
    source:
      options.allowBuiltInSource && input?.source === "built-in"
        ? "built-in"
        : "custom",
    description: String(input?.description || hostname).trim().slice(0, 180),
    icon: input?.icon ? String(input.icon).slice(0, 500) : null,
    workspaceId,
    siteKind,
    openMode,
    browserProfileId,
    assistantIds: normalizeAssistantIds(input?.assistantIds),
    pinned: input?.pinned !== false,
    order,
    lastOpenedAt: null,
    createdAt: now,
    updatedAt: now,
  };
  next.sites.push(site);
  touchState(next, now);
  return { state: next, site: cloneValue(site), existed: false };
}

function updateSiteInState(state, input, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(input?.id || "");
  const index = next.sites.findIndex((site) => site.id === id);
  if (index < 0) throw new StateModelError("SITE_NOT_FOUND", "找不到要编辑的站点");
  const current = next.sites[index];
  const previousWorkspaceId = current.workspaceId;
  const workspaceId = input?.workspaceId === undefined
    ? current.workspaceId
    : String(input.workspaceId);
  requireWorkspace(next, workspaceId);
  const url = input?.url === undefined ? current.url : normalizeHttpUrl(input.url);
  const duplicate = findSiteByWorkspaceUrl(next, workspaceId, url, current.id);
  if (duplicate) {
    throw new StateModelError(
      "DUPLICATE_SITE_URL",
      "这个网址已经存在于目标空间中",
    );
  }
  const name = input?.name === undefined
    ? current.name
    : String(input.name).trim().slice(0, 80);
  if (!name) throw new StateModelError("INVALID_SITE_NAME", "请输入站点名称");
  const movedWorkspace = workspaceId !== previousWorkspaceId;
  const browserProfileId = isSapSessionUrl(url)
    ? SAP_BROWSER_PROFILE_ID
    : input?.browserProfileId === undefined
      ? current.browserProfileId
      : String(input.browserProfileId || DEFAULT_BROWSER_PROFILE_ID).trim() ||
        DEFAULT_BROWSER_PROFILE_ID;
  requireBrowserProfile(next, browserProfileId);
  const targetOrder = movedWorkspace
    ? next.sites.filter(
        (site) => site.workspaceId === workspaceId && site.id !== current.id,
      ).length
    : current.order;

  const updated = {
    ...current,
    name,
    shortName:
      input?.name === undefined && input?.shortName === undefined
        ? current.shortName
        : String(input?.shortName || shortNameForSite(name)).slice(0, 3),
    url,
    workspaceId,
    siteKind: validateSiteKind(input?.siteKind, current.siteKind),
    openMode: validateOpenMode(input?.openMode, current.openMode),
    browserProfileId,
    assistantIds:
      input?.assistantIds === undefined
        ? current.assistantIds
        : normalizeAssistantIds(input.assistantIds),
    pinned: input?.pinned === undefined ? current.pinned : Boolean(input.pinned),
    order: targetOrder,
    updatedAt: now,
  };
  if (input?.color !== undefined) {
    if (!/^#[0-9a-f]{6}$/i.test(input.color || "")) {
      throw new StateModelError("INVALID_SITE_COLOR", "站点标识颜色无效");
    }
    updated.color = input.color;
  }
  if (input?.description !== undefined) {
    updated.description = String(input.description).trim().slice(0, 180);
  }
  if (input?.icon !== undefined) {
    updated.icon = input.icon ? String(input.icon).slice(0, 500) : null;
  }
  next.sites[index] = updated;
  next.sites = normalizeSiteOrders(
    next.sites,
    movedWorkspace ? [previousWorkspaceId, workspaceId] : workspaceId,
  );
  const previousBrowserState = next.workspaceBrowserStates[previousWorkspaceId];
  if (previousBrowserState?.tabs?.some((tab) => tab.siteId === id)) {
    if (movedWorkspace) {
      next.workspaceBrowserStates[previousWorkspaceId] = browserSnapshotFromTabs(
        previousBrowserState.tabs.filter((tab) => tab.siteId !== id),
        previousBrowserState.activeTabId,
      );
    } else {
      next.workspaceBrowserStates[previousWorkspaceId] = browserSnapshotFromTabs(
        previousBrowserState.tabs.map((tab) =>
          tab.siteId === id
            ? { ...tab, homeURL: url, updatedAt: now }
            : tab,
        ),
        previousBrowserState.activeTabId,
      );
    }
  }
  touchState(next, now);
  return {
    state: next,
    site: cloneValue(next.sites.find((site) => site.id === id)),
    previousWorkspaceId,
  };
}

function setSitePinnedInState(state, siteId, pinned = undefined, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const site = next.sites.find((item) => item.id === String(siteId || ""));
  if (!site) throw new StateModelError("SITE_NOT_FOUND", "找不到要置顶的站点");
  site.pinned = pinned === undefined ? !site.pinned : Boolean(pinned);
  site.updatedAt = now;
  touchState(next, now);
  return { state: next, site: cloneValue(site) };
}

function moveSiteInState(state, input, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(input?.id || "");
  const site = next.sites.find((item) => item.id === id);
  if (!site) throw new StateModelError("SITE_NOT_FOUND", "找不到要排序的站点");
  const group = next.sites
    .filter((item) => item.workspaceId === site.workspaceId)
    .sort((left, right) => left.order - right.order);
  const currentIndex = group.findIndex((item) => item.id === id);
  const direction = Number(input?.direction) < 0 ? -1 : 1;
  const targetIndex = currentIndex + direction;
  if (targetIndex < 0 || targetIndex >= group.length) {
    return { state: next, site: cloneValue(site), moved: false };
  }
  const target = group[targetIndex];
  const currentOrder = site.order;
  site.order = target.order;
  target.order = currentOrder;
  site.updatedAt = now;
  next.sites = normalizeSiteOrders(next.sites, site.workspaceId);
  touchState(next, now);
  return {
    state: next,
    site: cloneValue(next.sites.find((item) => item.id === id)),
    moved: true,
  };
}

function deleteSiteFromState(state, siteId, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(siteId || "");
  const index = next.sites.findIndex((site) => site.id === id);
  if (index < 0) throw new StateModelError("SITE_NOT_FOUND", "找不到要删除的站点");
  const [deletedSite] = next.sites.splice(index, 1);
  next.sites = normalizeSiteOrders(next.sites, deletedSite.workspaceId);
  const browserState = next.workspaceBrowserStates[deletedSite.workspaceId];
  if (browserState?.tabs?.some((tab) => tab.siteId === deletedSite.id)) {
    next.workspaceBrowserStates[deletedSite.workspaceId] = browserSnapshotFromTabs(
      browserState.tabs.filter((tab) => tab.siteId !== deletedSite.id),
      browserState.activeTabId,
    );
  }
  touchState(next, now);
  return { state: next, site: cloneValue(deletedSite) };
}

function setActiveWorkspaceInState(state, workspaceId, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const id = String(workspaceId || "");
  requireWorkspace(next, id);
  next.activeWorkspaceId = id;
  touchState(next, now);
  return { state: next, workspace: cloneValue(workspaceById(next, id)) };
}

function updateUiSettingsInState(state, patch, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  next.uiSettings = normalizeUiSettings({
    ...next.uiSettings,
    ...(patch && typeof patch === "object" ? patch : {}),
  });
  touchState(next, now);
  return { state: next, uiSettings: cloneValue(next.uiSettings) };
}

function upsertConnectorConnectionInState(state, connection, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const normalized = normalizeConnectorConnections([connection], now)[0];
  if (!normalized) {
    throw new StateModelError("INVALID_CONNECTOR_CONNECTION", "连接器配置无效");
  }
  const index = next.connectorConnections.findIndex((item) => item.id === normalized.id);
  if (index >= 0) {
    normalized.createdAt = next.connectorConnections[index].createdAt;
    next.connectorConnections[index] = normalized;
  } else {
    next.connectorConnections.push(normalized);
  }
  touchState(next, now);
  return { state: next, connection: cloneValue(normalized) };
}

function appendConnectorExecutionInState(state, execution, options = {}) {
  const now = isoNow(options.now);
  const next = stateForMutation(state, { ...options, now });
  const normalized = normalizeConnectorExecutions([execution])[0];
  if (!normalized?.id) {
    throw new StateModelError("INVALID_CONNECTOR_EXECUTION", "连接器执行记录无效");
  }
  const existingIndex = next.connectorExecutions.findIndex(
    (item) => item.id === normalized.id,
  );
  if (existingIndex >= 0) {
    next.connectorExecutions[existingIndex] = {
      ...next.connectorExecutions[existingIndex],
      ...normalized,
    };
  } else {
    next.connectorExecutions.push(normalized);
    next.connectorExecutions = next.connectorExecutions.slice(-200);
  }
  touchState(next, now);
  const stored = existingIndex >= 0
    ? next.connectorExecutions[existingIndex]
    : next.connectorExecutions.at(-1);
  return { state: next, execution: cloneValue(stored) };
}

const normalizeStateV3 = normalizeStateV4;
const normalizeStateV5 = normalizeStateV4;
const normalizeStateV6 = normalizeStateV4;
const normalizeStateV7 = normalizeStateV4;
const normalizeStateV8 = normalizeStateV4;
const normalizeStateV9 = normalizeStateV4;
const normalizeStateV10 = normalizeStateV4;
const normalizeStateV11 = normalizeStateV4;
const normalizeStateV12 = normalizeStateV4;
const normalizeStateV13 = normalizeStateV4;

module.exports = {
  CURRENT_SCHEMA_VERSION,
  MAX_RECENTLY_CLOSED_TABS,
  DEFAULT_ASSISTANT_SETTINGS,
  DEFAULT_BROWSER_PROFILE,
  DEFAULT_BROWSER_PROFILE_ID,
  SAP_BROWSER_PROFILE,
  SAP_BROWSER_PROFILE_ID,
  DEFAULT_NAIXI_AUTOMATION,
  DEFAULT_WORKSPACE_ID,
  SYSTEM_WORKSPACES,
  StateModelError,
  addSiteToState,
  createInitialState,
  clearWorkspaceBrowserStateInState,
  deleteSiteFromState,
  ensureSystemWorkspaces,
  findSiteByWorkspaceUrl,
  getWorkspaceBrowserState,
  migrateState,
  moveSiteInState,
  normalizeHttpUrl,
  normalizeAssistantExecutionLogs,
  normalizeAssistantSettings,
  normalizeSiteOrders,
  normalizeRecentlyClosedTabs,
  normalizeStateV3,
  normalizeStateV4,
  normalizeStateV5,
  normalizeStateV6,
  normalizeStateV7,
  normalizeStateV8,
  normalizeStateV9,
  normalizeStateV10,
  normalizeStateV11,
  normalizeStateV12,
  normalizeStateV13,
  updateUiSettingsInState,
  upsertConnectorConnectionInState,
  appendConnectorExecutionInState,
  setActiveWorkspaceInState,
  setSitePinnedInState,
  setWorkspaceBrowserStateInState,
  setWorkspaceBrowserTabsInState,
  sitesForWorkspace,
  updateSiteInState,
  workspaceById,
};
