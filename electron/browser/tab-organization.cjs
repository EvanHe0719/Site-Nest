const { randomUUID } = require("node:crypto");

const TAB_GROUP_COLOR_KEYS = new Set([
  "pine",
  "blue",
  "violet",
  "amber",
  "rose",
  "slate",
]);
const DEFAULT_TAB_GROUP_COLOR = "pine";
const DEFAULT_TAB_GROUP_ICON = "folder";
const TRACKING_PARAM_NAMES = new Set([
  "fbclid",
  "gclid",
  "dclid",
  "msclkid",
  "mc_cid",
  "mc_eid",
  "yclid",
  "_ga",
  "_gl",
]);

function cleanText(value, maxLength = 120) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function isoOr(value, fallback) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : fallback;
}

function normalizeTabGroups(value, workspaceIds, options = {}) {
  const now = options.now || new Date().toISOString();
  const allowedWorkspaces = workspaceIds instanceof Set
    ? workspaceIds
    : new Set(Array.isArray(workspaceIds) ? workspaceIds.map(String) : []);
  const seen = new Set();
  const groups = [];
  for (const [index, raw] of (Array.isArray(value) ? value : []).entries()) {
    if (!raw || typeof raw !== "object") continue;
    const id = cleanText(raw.id, 120);
    const workspaceId = cleanText(raw.workspaceId, 120);
    const name = cleanText(raw.name, 80);
    if (!id || seen.has(id) || !name || !allowedWorkspaces.has(workspaceId)) continue;
    seen.add(id);
    const colorKey = cleanText(raw.colorKey, 30);
    groups.push({
      id,
      workspaceId,
      name,
      colorKey: TAB_GROUP_COLOR_KEYS.has(colorKey) ? colorKey : DEFAULT_TAB_GROUP_COLOR,
      iconKey: cleanText(raw.iconKey, 40) || DEFAULT_TAB_GROUP_ICON,
      collapsed: raw.collapsed === true,
      sortOrder: Number.isFinite(Number(raw.sortOrder)) ? Number(raw.sortOrder) : index,
      lastActiveSessionId: cleanText(raw.lastActiveSessionId, 120) || null,
      createdAt: isoOr(raw.createdAt, now),
      updatedAt: isoOr(raw.updatedAt, now),
      deletedAt: raw.deletedAt ? isoOr(raw.deletedAt, now) : null,
    });
  }
  return groups.sort((left, right) =>
    left.workspaceId.localeCompare(right.workspaceId) ||
      left.sortOrder - right.sortOrder ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id),
  );
}

function activeGroupsForWorkspace(groups, workspaceId) {
  return (Array.isArray(groups) ? groups : [])
    .filter((group) => group.workspaceId === workspaceId && !group.deletedAt)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.createdAt.localeCompare(right.createdAt));
}

function createTabGroup(groups, input, options = {}) {
  const now = options.now || new Date().toISOString();
  const workspaceId = cleanText(input?.workspaceId, 120);
  const name = cleanText(input?.name, 80);
  if (!workspaceId || !name) throw new Error("页签组需要空间和名称");
  const existing = activeGroupsForWorkspace(groups, workspaceId);
  const idFactory = options.idFactory || randomUUID;
  const colorKey = cleanText(input?.colorKey, 30);
  const group = {
    id: cleanText(input?.id, 120) || idFactory(),
    workspaceId,
    name,
    colorKey: TAB_GROUP_COLOR_KEYS.has(colorKey) ? colorKey : DEFAULT_TAB_GROUP_COLOR,
    iconKey: cleanText(input?.iconKey, 40) || DEFAULT_TAB_GROUP_ICON,
    collapsed: input?.collapsed === true,
    sortOrder: Number.isFinite(Number(input?.sortOrder))
      ? Number(input.sortOrder)
      : (existing.at(-1)?.sortOrder ?? -1) + 1,
    lastActiveSessionId: cleanText(input?.lastActiveSessionId, 120) || null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
  if ((groups || []).some((candidate) => candidate.id === group.id && !candidate.deletedAt)) {
    throw new Error("页签组编号已存在");
  }
  return group;
}

function updateTabGroup(groups, groupId, patch, options = {}) {
  const now = options.now || new Date().toISOString();
  let found = false;
  const next = (groups || []).map((group) => {
    if (group.id !== groupId || group.deletedAt) return { ...group };
    found = true;
    const colorKey = Object.prototype.hasOwnProperty.call(patch || {}, "colorKey")
      ? cleanText(patch.colorKey, 30)
      : group.colorKey;
    return {
      ...group,
      ...(Object.prototype.hasOwnProperty.call(patch || {}, "name")
        ? { name: cleanText(patch.name, 80) || group.name }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch || {}, "colorKey")
        ? { colorKey: TAB_GROUP_COLOR_KEYS.has(colorKey) ? colorKey : group.colorKey }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch || {}, "iconKey")
        ? { iconKey: cleanText(patch.iconKey, 40) || DEFAULT_TAB_GROUP_ICON }
        : {}),
      ...(Object.prototype.hasOwnProperty.call(patch || {}, "collapsed")
        ? { collapsed: patch.collapsed === true }
        : {}),
      ...(Number.isFinite(Number(patch?.sortOrder)) ? { sortOrder: Number(patch.sortOrder) } : {}),
      ...(Object.prototype.hasOwnProperty.call(patch || {}, "lastActiveSessionId")
        ? { lastActiveSessionId: cleanText(patch.lastActiveSessionId, 120) || null }
        : {}),
      updatedAt: now,
    };
  });
  if (!found) throw new Error("找不到页签组");
  return next;
}

function assignTabsToGroup(tabs, tabIds, groupId, options = {}) {
  const ids = new Set((Array.isArray(tabIds) ? tabIds : [tabIds]).map(String));
  const existingOrders = (tabs || [])
    .filter((tab) => tab.tabGroupId === groupId && !ids.has(tab.tabId))
    .map((tab) => Number(tab.groupSortOrder))
    .filter(Number.isFinite);
  let nextOrder = existingOrders.length ? Math.max(...existingOrders) + 1 : 0;
  return (tabs || []).map((tab) => ids.has(String(tab.tabId))
    ? {
        ...tab,
        tabGroupId: groupId || null,
        groupSortOrder: groupId ? nextOrder++ : Number(tab.groupSortOrder) || 0,
      }
    : { ...tab });
}

function reorderTabs(tabs, orderedTabIds) {
  const rank = new Map((orderedTabIds || []).map((id, index) => [String(id), index]));
  return (tabs || [])
    .map((tab, index) => ({ ...tab, __index: index }))
    .sort((left, right) => {
      const leftRank = rank.has(left.tabId) ? rank.get(left.tabId) : Number.MAX_SAFE_INTEGER;
      const rightRank = rank.has(right.tabId) ? rank.get(right.tabId) : Number.MAX_SAFE_INTEGER;
      return leftRank - rightRank || left.__index - right.__index;
    })
    .map(({ __index, ...tab }, index) => ({ ...tab, groupSortOrder: index }));
}

function reorderGroups(groups, workspaceId, orderedGroupIds, options = {}) {
  const now = options.now || new Date().toISOString();
  const rank = new Map((orderedGroupIds || []).map((id, index) => [String(id), index]));
  let fallback = rank.size;
  return (groups || []).map((group) => {
    if (group.workspaceId !== workspaceId || group.deletedAt) return { ...group };
    return {
      ...group,
      sortOrder: rank.has(group.id) ? rank.get(group.id) : fallback++,
      updatedAt: now,
    };
  });
}

function mergeTabGroups(groups, tabs, sourceGroupId, targetGroupId, options = {}) {
  const now = options.now || new Date().toISOString();
  const source = (groups || []).find((group) => group.id === sourceGroupId && !group.deletedAt);
  const target = (groups || []).find((group) => group.id === targetGroupId && !group.deletedAt);
  if (!source || !target) throw new Error("找不到要合并的页签组");
  if (source.id === target.id) throw new Error("不能将分组合并到自身");
  if (source.workspaceId !== target.workspaceId) throw new Error("不同工作空间的分组不能直接合并");
  const targetTabs = (tabs || []).filter((tab) => tab.tabGroupId === target.id);
  let nextOrder = targetTabs.reduce((max, tab) => Math.max(max, Number(tab.groupSortOrder) || 0), -1) + 1;
  const nextTabs = (tabs || []).map((tab) => tab.tabGroupId === source.id
    ? { ...tab, tabGroupId: target.id, groupSortOrder: nextOrder++ }
    : { ...tab });
  const nextGroups = (groups || []).map((group) => {
    if (group.id === source.id) return { ...group, deletedAt: now, updatedAt: now };
    if (group.id === target.id) {
      return {
        ...group,
        lastActiveSessionId: source.lastActiveSessionId || group.lastActiveSessionId,
        updatedAt: now,
      };
    }
    return { ...group };
  });
  return {
    groups: nextGroups,
    tabs: nextTabs,
    undo: {
      workspaceId: source.workspaceId,
      sourceGroup: { ...source },
      targetGroup: { ...target },
      sourceTabs: (tabs || [])
        .filter((tab) => tab.tabGroupId === source.id)
        .map((tab) => ({ tabId: tab.tabId, groupSortOrder: tab.groupSortOrder })),
    },
  };
}

function undoTabGroupMerge(groups, tabs, undo, options = {}) {
  if (!undo?.sourceGroup || !undo?.targetGroup) throw new Error("没有可撤销的分组合并");
  const now = options.now || new Date().toISOString();
  const sourceOrders = new Map((undo.sourceTabs || []).map((tab) => [String(tab.tabId), tab.groupSortOrder]));
  const nextGroups = (groups || []).map((group) => {
    if (group.id === undo.sourceGroup.id) return { ...undo.sourceGroup, deletedAt: null, updatedAt: now };
    if (group.id === undo.targetGroup.id) return { ...undo.targetGroup, updatedAt: now };
    return { ...group };
  });
  const nextTabs = (tabs || []).map((tab) => sourceOrders.has(String(tab.tabId))
    ? { ...tab, tabGroupId: undo.sourceGroup.id, groupSortOrder: sourceOrders.get(String(tab.tabId)) }
    : { ...tab });
  return { groups: nextGroups, tabs: nextTabs };
}

function normalizeComparableTabUrl(rawUrl) {
  let url;
  try {
    url = new URL(String(rawUrl || ""));
  } catch {
    return "";
  }
  if (!/^https?:$/.test(url.protocol)) return "";
  url.protocol = url.protocol.toLowerCase();
  url.hostname = url.hostname.toLowerCase();
  if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) {
    url.port = "";
  }
  if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  const retained = [];
  for (const [name, value] of url.searchParams.entries()) {
    const lower = name.toLowerCase();
    if (lower.startsWith("utm_") || TRACKING_PARAM_NAMES.has(lower)) continue;
    retained.push([name, value]);
  }
  retained.sort(([leftName, leftValue], [rightName, rightValue]) =>
    leftName.localeCompare(rightName) || leftValue.localeCompare(rightValue));
  url.search = "";
  retained.forEach(([name, value]) => url.searchParams.append(name, value));
  return url.toString();
}

function hostnameFromUrl(rawUrl) {
  try {
    return new URL(String(rawUrl || "")).hostname.toLowerCase();
  } catch {
    return "";
  }
}

class SiteFamilyRegistry {
  constructor() {
    this.rules = [
      {
        id: "sap",
        name: "SAP",
        matches: (hostname) => new Set([
          "support.sap.com",
          "me.sap.com",
          "accounts.sap.com",
          "universalid.sap.com",
        ]).has(hostname),
      },
      {
        id: "zoho",
        name: "Zoho",
        matches: (hostname) => /^(?:desk|accounts)\.zoho(?:cloud)?\..+$/i.test(hostname),
      },
    ];
  }

  register(rule) {
    if (!rule?.id || !rule?.name || typeof rule.matches !== "function") {
      throw new Error("站点家族规则无效");
    }
    this.rules = this.rules.filter((candidate) => candidate.id !== rule.id).concat(rule);
  }

  match(rawUrl) {
    const hostname = hostnameFromUrl(rawUrl);
    if (!hostname) return null;
    const family = this.rules.find((rule) => rule.matches(hostname));
    return family ? { id: family.id, name: family.name, hostname } : { id: `host:${hostname}`, name: hostname, hostname };
  }

  suggestions(tabs) {
    const buckets = new Map();
    for (const tab of tabs || []) {
      const match = this.match(tab.url);
      if (!match) continue;
      const bucket = buckets.get(match.id) || { ...match, tabIds: [], hostnames: new Set() };
      bucket.tabIds.push(tab.tabId);
      bucket.hostnames.add(match.hostname);
      buckets.set(match.id, bucket);
    }
    return Array.from(buckets.values())
      .filter((candidate) => candidate.tabIds.length >= 2)
      .map((candidate) => ({
        id: candidate.id,
        suggestedName: candidate.name,
        tabIds: candidate.tabIds,
        hostnames: Array.from(candidate.hostnames).sort(),
      }));
  }
}

function chooseDuplicateKeeper(tabs, activeTabId) {
  return tabs.find((tab) => tab.tabId === activeTabId)?.tabId ||
    [...tabs].sort((left, right) =>
      Date.parse(right.lastActiveAt || 0) - Date.parse(left.lastActiveAt || 0),
    )[0]?.tabId || null;
}

function detectDuplicateTabs(tabs, options = {}) {
  const exactBuckets = new Map();
  const hostBuckets = new Map();
  for (const tab of tabs || []) {
    const exactKey = normalizeComparableTabUrl(tab.url);
    const hostname = hostnameFromUrl(tab.url);
    if (exactKey) {
      const bucket = exactBuckets.get(exactKey) || [];
      bucket.push({ ...tab });
      exactBuckets.set(exactKey, bucket);
    }
    if (hostname) {
      const bucket = hostBuckets.get(hostname) || [];
      bucket.push({ ...tab });
      hostBuckets.set(hostname, bucket);
    }
  }
  const exact = Array.from(exactBuckets.entries())
    .filter(([, items]) => items.length > 1)
    .map(([normalizedUrl, items]) => ({
      normalizedUrl,
      tabs: items,
      recommendedKeeperId: chooseDuplicateKeeper(items, options.activeTabId),
    }));
  const exactPairs = new Set(exact.flatMap((group) => group.tabs.map((tab) => tab.tabId)));
  const similar = Array.from(hostBuckets.entries())
    .filter(([, items]) => items.length > 1)
    .map(([hostname, items]) => ({
      hostname,
      tabs: items,
      exactDuplicateTabIds: items.filter((tab) => exactPairs.has(tab.tabId)).map((tab) => tab.tabId),
    }));
  return { exact, similar };
}

module.exports = {
  DEFAULT_TAB_GROUP_COLOR,
  SiteFamilyRegistry,
  TAB_GROUP_COLOR_KEYS,
  activeGroupsForWorkspace,
  assignTabsToGroup,
  createTabGroup,
  detectDuplicateTabs,
  hostnameFromUrl,
  mergeTabGroups,
  normalizeComparableTabUrl,
  normalizeTabGroups,
  reorderGroups,
  reorderTabs,
  undoTabGroupMerge,
  updateTabGroup,
};
