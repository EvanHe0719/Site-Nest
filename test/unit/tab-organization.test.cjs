const assert = require("node:assert/strict");
const test = require("node:test");

const {
  SiteFamilyRegistry,
  assignTabsToGroup,
  createTabGroup,
  detectDuplicateTabs,
  mergeTabGroups,
  normalizeComparableTabUrl,
  normalizeTabGroups,
  reorderGroups,
  undoTabGroupMerge,
  updateTabGroup,
} = require("../../electron/browser/tab-organization.cjs");
const {
  CURRENT_SCHEMA_VERSION,
  createInitialState,
  migrateState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-31T08:00:00.000Z";

function group(id, name, overrides = {}) {
  return {
    id,
    workspaceId: "work",
    name,
    colorKey: "pine",
    iconKey: "folder",
    collapsed: false,
    sortOrder: 0,
    lastActiveSessionId: null,
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function tab(tabId, url, overrides = {}) {
  return {
    tabId,
    sessionId: tabId,
    workspaceId: "work",
    browserProfileId: "default",
    partition: "persist:qiye-sites",
    url,
    lastActiveAt: NOW,
    tabGroupId: null,
    groupSortOrder: 0,
    ...overrides,
  };
}

test("schema v13 adds no default tab groups and preserves legacy tab order with null group metadata", () => {
  assert.equal(CURRENT_SCHEMA_VERSION, 13);
  const initial = createInitialState({ now: NOW });
  assert.deepEqual(initial.tabGroups, []);

  const raw = {
    ...initial,
    version: 11,
    workspaceBrowserStates: {
      ...initial.workspaceBrowserStates,
      work: {
        activeTabId: "second",
        tabs: [
          { tabId: "first", url: "https://one.example.test/", updatedAt: NOW },
          { tabId: "second", url: "https://two.example.test/", updatedAt: NOW },
        ],
      },
    },
  };
  const migrated = migrateState(raw, { now: NOW });
  assert.equal(migrated.toVersion, 13);
  assert.deepEqual(migrated.state.workspaceBrowserStates.work.tabs.map((item) => item.tabId), ["first", "second"]);
  assert.deepEqual(migrated.state.workspaceBrowserStates.work.tabs.map((item) => item.tabGroupId), [null, null]);
  assert.deepEqual(migrated.state.workspaceBrowserStates.work.tabs.map((item) => item.groupSortOrder), [0, 1]);
  assert.deepEqual(migrateState(migrated.state, { now: "2030-01-01T00:00:00.000Z" }).state, migrated.state);
});

test("restart normalization restores group order, collapse and membership but never recreates a deleted group", () => {
  const initial = createInitialState({ now: NOW });
  const raw = {
    ...initial,
    tabGroups: [group("sap", "SAP", {
      workspaceId: "personal",
      collapsed: true,
      sortOrder: 3,
      lastActiveSessionId: "sap-tab",
    })],
    workspaceBrowserStates: {
      ...initial.workspaceBrowserStates,
      personal: {
        activeTabId: "sap-tab",
        tabs: [{
          tabId: "sap-tab",
          url: "https://support.sap.com/en/index.html",
          tabGroupId: "sap",
          groupSortOrder: 7,
          updatedAt: NOW,
        }],
      },
    },
  };
  const restarted = migrateState(raw, { now: NOW }).state;
  assert.equal(restarted.tabGroups[0].collapsed, true);
  assert.equal(restarted.tabGroups[0].sortOrder, 3);
  assert.equal(restarted.tabGroups[0].lastActiveSessionId, "sap-tab");
  assert.equal(restarted.workspaceBrowserStates.personal.tabs[0].tabGroupId, "sap");
  assert.equal(restarted.workspaceBrowserStates.personal.tabs[0].groupSortOrder, 7);
  assert.deepEqual(migrateState(restarted, { now: "2030-01-01T00:00:00.000Z" }).state, restarted);

  const deleted = structuredClone(restarted);
  deleted.tabGroups[0].deletedAt = NOW;
  const withoutDeletedGroup = migrateState(deleted, { now: NOW }).state;
  assert.equal(withoutDeletedGroup.workspaceBrowserStates.personal.tabs[0].tabGroupId, null);
  assert.equal(withoutDeletedGroup.tabGroups[0].deletedAt, NOW);
});

test("recently closed tabs restore group metadata only while the original group still exists", () => {
  const initial = createInitialState({ now: NOW });
  const raw = {
    ...initial,
    tabGroups: [group("sap", "SAP", { workspaceId: "personal" })],
    recentlyClosedTabs: [{
      id: "closed-sap",
      workspaceId: "personal",
      tabId: "sap-tab",
      browserProfileId: "sap-support",
      title: "SAP Support",
      url: "https://support.sap.com/en/index.html",
      homeURL: "https://support.sap.com/",
      tabGroupId: "sap",
      groupSortOrder: 4,
      closedIndex: 2,
      closedAt: NOW,
    }],
  };
  const normalized = migrateState(raw, { now: NOW }).state;
  assert.equal(normalized.recentlyClosedTabs.length, 1);
  assert.equal(normalized.recentlyClosedTabs[0].tabGroupId, "sap");
  assert.equal(normalized.recentlyClosedTabs[0].browserProfileId, "sap-support");
  assert.equal(normalized.recentlyClosedTabs[0].groupSortOrder, 4);
  assert.deepEqual(migrateState(normalized, { now: "2030-01-01T00:00:00.000Z" }).state, normalized);

  const deleted = structuredClone(normalized);
  deleted.tabGroups[0].deletedAt = NOW;
  const withoutGroup = migrateState(deleted, { now: NOW }).state;
  assert.equal(withoutGroup.recentlyClosedTabs[0].tabGroupId, null);
});

test("groups can be created, renamed, recolored, collapsed and reordered without touching tabs", () => {
  const first = createTabGroup([], { workspaceId: "work", name: "SAP" }, {
    now: NOW,
    idFactory: () => "sap-group",
  });
  const second = createTabGroup([first], { workspaceId: "work", name: "AI", colorKey: "violet" }, {
    now: NOW,
    idFactory: () => "ai-group",
  });
  let groups = updateTabGroup([first, second], "sap-group", {
    name: "SAP Support",
    colorKey: "blue",
    collapsed: true,
  }, { now: "2026-08-31T09:00:00.000Z" });
  assert.equal(groups[0].name, "SAP Support");
  assert.equal(groups[0].colorKey, "blue");
  assert.equal(groups[0].collapsed, true);
  groups = reorderGroups(groups, "work", ["ai-group", "sap-group"], { now: NOW });
  assert.deepEqual(groups.slice().sort((a, b) => a.sortOrder - b.sortOrder).map((item) => item.id), ["ai-group", "sap-group"]);
  assert.equal(normalizeTabGroups(groups, new Set(["work"]), { now: NOW }).length, 2);
});

test("assign, merge and one-step undo preserve session, profile and partition identities", () => {
  const groups = [group("sap-support", "SAP Support"), group("sap-login", "SAP 登录", { sortOrder: 1 })];
  const originalTabs = [
    tab("support-tab", "https://support.sap.com/", { tabGroupId: "sap-support" }),
    tab("login-tab", "https://accounts.sap.com/", {
      tabGroupId: "sap-login",
      browserProfileId: "sap-support",
      partition: "persist:qiye-sap-support",
    }),
  ];
  const assigned = assignTabsToGroup(originalTabs, ["support-tab"], "sap-support");
  const result = mergeTabGroups(groups, assigned, "sap-login", "sap-support", { now: NOW });
  assert.equal(result.groups.find((item) => item.id === "sap-login").deletedAt, NOW);
  assert.deepEqual(result.tabs.map((item) => item.tabId), ["support-tab", "login-tab"]);
  assert.equal(result.tabs[1].tabGroupId, "sap-support");
  assert.equal(result.tabs[1].browserProfileId, "sap-support");
  assert.equal(result.tabs[1].partition, "persist:qiye-sap-support");

  const undone = undoTabGroupMerge(result.groups, result.tabs, result.undo, { now: NOW });
  assert.equal(undone.groups.find((item) => item.id === "sap-login").deletedAt, null);
  assert.equal(undone.tabs.find((item) => item.tabId === "login-tab").tabGroupId, "sap-login");
  assert.deepEqual(undone.tabs.map((item) => item.sessionId), originalTabs.map((item) => item.sessionId));
});

test("site family suggestions use explicit SAP and Zoho rules and never move tabs", () => {
  const tabs = [
    tab("sap-support", "https://support.sap.com/en/index.html"),
    tab("sap-account", "https://accounts.sap.com/saml2/idp/sso"),
    tab("zoho-cn", "https://desk.zoho.com.cn/agent/tickets/1"),
    tab("zoho-eu", "https://accounts.zoho.eu/oauth/v2/auth"),
    tab("unrelated", "https://not-sap.example.test/"),
  ];
  const snapshot = structuredClone(tabs);
  const suggestions = new SiteFamilyRegistry().suggestions(tabs);
  assert.deepEqual(suggestions.find((item) => item.id === "sap").tabIds, ["sap-support", "sap-account"]);
  assert.deepEqual(suggestions.find((item) => item.id === "zoho").tabIds, ["zoho-cn", "zoho-eu"]);
  assert.deepEqual(tabs, snapshot, "suggestions must not mutate or move tabs without confirmation");
});

test("duplicate normalization removes tracking only and preserves business query and hash", () => {
  const left = normalizeComparableTabUrl("HTTPS://Example.COM:443/path/?b=2&utm_source=mail&a=1#ticket");
  const right = normalizeComparableTabUrl("https://example.com/path?a=1&b=2#ticket");
  assert.equal(left, right);
  assert.notEqual(
    normalizeComparableTabUrl("https://example.com/path?ticket=1#ticket"),
    normalizeComparableTabUrl("https://example.com/path?ticket=2#ticket"),
  );
  assert.notEqual(
    normalizeComparableTabUrl("https://example.com/path?ticket=1#ticket"),
    normalizeComparableTabUrl("https://example.com/path?ticket=1#reply"),
  );
});

test("detector separates exact duplicates from same-site similarity and recommends active then latest", () => {
  const tabs = [
    tab("older", "https://example.com/ticket/1?utm_campaign=x", { lastActiveAt: "2026-08-30T00:00:00.000Z" }),
    tab("active", "https://EXAMPLE.com:443/ticket/1", { lastActiveAt: "2026-08-29T00:00:00.000Z" }),
    tab("other", "https://example.com/ticket/2", { lastActiveAt: "2026-08-31T00:00:00.000Z" }),
  ];
  const detected = detectDuplicateTabs(tabs, { activeTabId: "active" });
  assert.equal(detected.exact.length, 1);
  assert.equal(detected.exact[0].recommendedKeeperId, "active");
  assert.deepEqual(detected.exact[0].tabs.map((item) => item.tabId), ["older", "active"]);
  assert.equal(detected.similar.length, 1);
  assert.deepEqual(detected.similar[0].tabs.map((item) => item.tabId), ["older", "active", "other"]);
});
