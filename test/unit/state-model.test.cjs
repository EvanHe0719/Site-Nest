const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CURRENT_SCHEMA_VERSION,
  DEFAULT_BROWSER_PROFILE,
  SAP_BROWSER_PROFILE,
  StateModelError,
  addSiteToState,
  clearWorkspaceBrowserStateInState,
  createInitialState,
  deleteSiteFromState,
  migrateState,
  moveSiteInState,
  getWorkspaceBrowserState,
  setActiveWorkspaceInState,
  setSitePinnedInState,
  setWorkspaceBrowserStateInState,
  sitesForWorkspace,
  updateSiteInState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-29T12:00:00.000Z";

function oldSite(overrides = {}) {
  return {
    id: "old-site",
    name: "旧站点",
    shortName: "旧",
    url: "https://example.com/",
    color: "#5b7cfa",
    source: "custom",
    description: "迁移测试",
    pinned: false,
    order: 4,
    lastOpenedAt: "2026-08-28T10:00:00.000Z",
    createdAt: "2026-08-20T10:00:00.000Z",
    ...overrides,
  };
}

function v2State(overrides = {}) {
  return {
    version: 2,
    sites: [oldSite()],
    bookmarks: [
      {
        id: "bookmark-1",
        name: "文档",
        url: "https://docs.example.com/",
        folder: "工作",
        addedAt: "2026-08-01T00:00:00.000Z",
        sourceProfile: "Evan",
      },
    ],
    importMeta: { profileId: "Default", total: 1 },
    automations: {
      naixi: {
        enabled: false,
        time: "09:10",
        status: "success",
        message: "今日已完成",
        lastRunAt: "2026-08-29T01:10:00.000Z",
        lastSuccessAt: "2026-08-29T01:10:00.000Z",
        lastSuccessDate: "2026-08-29",
        futureField: "preserved",
      },
    },
    createdAt: "2026-08-01T00:00:00.000Z",
    ...overrides,
  };
}

test("v2 migration creates each system workspace once and preserves old data", () => {
  const raw = v2State({
    workspaces: [
      { id: "personal", name: "重复个人", sortOrder: 90 },
      { id: "personal", name: "另一个重复个人", sortOrder: 91 },
    ],
  });
  const migration = migrateState(raw, { now: NOW });

  assert.equal(migration.fromVersion, 2);
  assert.equal(migration.toVersion, CURRENT_SCHEMA_VERSION);
  assert.equal(migration.migrated, true);
  assert.deepEqual(
    migration.state.workspaces.map((workspace) => workspace.id),
    ["personal", "work", "research"],
  );
  assert.equal(
    migration.state.workspaces.filter((workspace) => workspace.id === "personal").length,
    1,
  );
  assert.equal(migration.state.activeWorkspaceId, "personal");

  const [site] = migration.state.sites;
  assert.equal(site.id, raw.sites[0].id);
  assert.equal(site.workspaceId, "personal");
  assert.equal(site.siteKind, "normal");
  assert.equal(site.openMode, "internal");
  assert.equal(site.browserProfileId, "default");
  assert.deepEqual(site.assistantIds, []);
  assert.equal(site.pinned, false);
  assert.equal(site.order, 0);
  assert.equal(site.lastOpenedAt, raw.sites[0].lastOpenedAt);

  assert.deepEqual(migration.state.bookmarks, raw.bookmarks);
  assert.deepEqual(migration.state.importMeta, raw.importMeta);
  assert.equal(migration.state.automations.naixi.enabled, false);
  assert.equal(migration.state.automations.naixi.time, "09:10");
  assert.equal(
    migration.state.automations.naixi.futureField,
    "preserved",
  );
  assert.deepEqual(
    migration.state.browserProfiles.find((profile) => profile.id === "default"),
    { ...DEFAULT_BROWSER_PROFILE, createdAt: NOW, updatedAt: NOW },
  );
  assert.deepEqual(
    migration.state.browserProfiles.find((profile) => profile.id === "sap-support"),
    { ...SAP_BROWSER_PROFILE, createdAt: NOW, updatedAt: NOW },
  );
  assert.equal(
    migration.state.assistantSettings["zoho-desk-ticket"].enabled,
    true,
  );
  assert.deepEqual(migration.state.assistantExecutionLogs, []);
  assert.equal(migration.state.updatedAt, raw.createdAt);
});

test("migration is idempotent", () => {
  const once = migrateState(v2State(), { now: NOW }).state;
  const twice = migrateState(once, { now: "2030-01-01T00:00:00.000Z" });
  assert.equal(twice.migrated, false);
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.state, once);
});

test("assistant settings and newest execution logs are preserved with sensitive text redacted", () => {
  const logs = Array.from({ length: 205 }, (_, index) => ({
    id: `log-${index}`,
    timestamp: NOW,
    assistantId: "zoho-desk-ticket",
    assistantName: "Zoho Desk 工单助手",
    actionId: "copy-link",
    actionName: "复制工单链接",
    site: { siteId: "zoho", hostname: "desk.zoho.com" },
    status: "success",
    summary: index === 0 ? "token=private-value 已复制" : "已复制",
    errorCode: "",
    errorMessage: "",
  }));
  const state = migrateState(
    v2State({
      assistantSettings: {
        "zoho-desk-ticket": {
          enabled: false,
          updatedAt: NOW,
          lastExecutedAt: NOW,
        },
      },
      assistantExecutionLogs: logs,
    }),
    { now: NOW },
  ).state;

  assert.equal(state.assistantSettings["zoho-desk-ticket"].enabled, false);
  assert.equal(
    state.assistantSettings["zoho-desk-ticket"].lastExecutedAt,
    NOW,
  );
  assert.equal(state.assistantExecutionLogs.length, 200);
  assert.equal(state.assistantExecutionLogs[0].id, "log-0");
  assert.equal(state.assistantExecutionLogs[199].id, "log-199");
  assert.match(state.assistantExecutionLogs[0].summary, /\[REDACTED\]/);
  assert.doesNotMatch(state.assistantExecutionLogs[0].summary, /private-value/);
});

test("one damaged site or bookmark is quarantined without losing valid entries", () => {
  const raw = v2State({
    sites: [
      oldSite(),
      oldSite({ id: "bad-site", url: "javascript:alert(1)" }),
      oldSite({ id: "valid-two", url: "https://valid.example.net/" }),
    ],
    bookmarks: [
      v2State().bookmarks[0],
      { id: "bad-bookmark", name: "坏书签", url: "file:///C:/secret" },
    ],
  });
  const state = migrateState(raw, { now: NOW }).state;

  assert.deepEqual(
    state.sites.map((site) => site.id),
    ["old-site", "valid-two"],
  );
  assert.equal(state.bookmarks.length, 1);
  assert.equal(state.bookmarks[0].id, "bookmark-1");
  assert.equal(state.migrationQuarantine.sites.length, 1);
  assert.equal(state.migrationQuarantine.bookmarks.length, 1);

  const again = migrateState(state, { now: "2030-01-01T00:00:00.000Z" });
  assert.equal(again.changed, false);
  assert.deepEqual(again.state, state);
});

test("each workspace persists an independent browser snapshot and blank means no page", () => {
  let state = createInitialState({ now: NOW });
  assert.deepEqual(state.workspaceBrowserStates, {
    personal: {
      activeTabId: null,
      tabs: [],
      activeSiteId: null,
      currentURL: null,
      homeURL: null,
      updatedAt: null,
    },
    work: {
      activeTabId: null,
      tabs: [],
      activeSiteId: null,
      currentURL: null,
      homeURL: null,
      updatedAt: null,
    },
    research: {
      activeTabId: null,
      tabs: [],
      activeSiteId: null,
      currentURL: null,
      homeURL: null,
      updatedAt: null,
    },
  });
  state = addSiteToState(
    state,
    {
      name: "个人现场",
      url: "https://personal.example.com/",
      workspaceId: "personal",
    },
    { now: NOW, idFactory: () => "personal-browser-site" },
  ).state;
  state = setWorkspaceBrowserStateInState(
    state,
    "personal",
    {
      activeSiteId: "personal-browser-site",
      currentURL: "https://personal.example.com/topic/8",
      homeURL: "https://personal.example.com/",
    },
    { now: "2026-08-29T12:10:00.000Z" },
  ).state;
  state = setWorkspaceBrowserStateInState(
    state,
    "research",
    {
      activeSiteId: null,
      currentURL: "https://papers.example.net/read/2",
      homeURL: "https://papers.example.net/",
    },
    { now: "2026-08-29T12:11:00.000Z" },
  ).state;

  assert.deepEqual(getWorkspaceBrowserState(state, "personal"), {
    activeTabId: "legacy-personal",
    tabs: [
      {
        tabId: "legacy-personal",
        sessionId: "legacy-personal",
        siteId: "personal-browser-site",
        browserProfileId: "default",
        title: "个人现场",
        url: "https://personal.example.com/topic/8",
        normalizedUrl: "https://personal.example.com/topic/8",
        homeURL: "https://personal.example.com/",
        favicon: null,
        createdAt: "2026-08-29T12:10:00.000Z",
        lastActiveAt: "2026-08-29T12:10:00.000Z",
        loadingState: "idle",
        errorState: null,
        reliableContext: null,
        keepRunning: false,
        tabGroupId: null,
        groupSortOrder: 0,
        updatedAt: "2026-08-29T12:10:00.000Z",
      },
    ],
    activeSiteId: "personal-browser-site",
    currentURL: "https://personal.example.com/topic/8",
    homeURL: "https://personal.example.com/",
    updatedAt: "2026-08-29T12:10:00.000Z",
  });
  assert.equal(getWorkspaceBrowserState(state, "work").currentURL, null);
  assert.deepEqual(getWorkspaceBrowserState(state, "research"), {
    activeTabId: "legacy-research",
    tabs: [
      {
        tabId: "legacy-research",
        sessionId: "legacy-research",
        siteId: null,
        browserProfileId: "default",
        title: "",
        url: "https://papers.example.net/read/2",
        normalizedUrl: "https://papers.example.net/read/2",
        homeURL: "https://papers.example.net/",
        favicon: null,
        createdAt: "2026-08-29T12:11:00.000Z",
        lastActiveAt: "2026-08-29T12:11:00.000Z",
        loadingState: "idle",
        errorState: null,
        reliableContext: null,
        keepRunning: false,
        tabGroupId: null,
        groupSortOrder: 0,
        updatedAt: "2026-08-29T12:11:00.000Z",
      },
    ],
    activeSiteId: null,
    currentURL: "https://papers.example.net/read/2",
    homeURL: "https://papers.example.net/",
    updatedAt: "2026-08-29T12:11:00.000Z",
  });

  state = clearWorkspaceBrowserStateInState(state, "research", {
    now: "2026-08-29T12:12:00.000Z",
  }).state;
  assert.equal(getWorkspaceBrowserState(state, "research").currentURL, null);
  assert.equal(getWorkspaceBrowserState(state, "personal").activeSiteId, "personal-browser-site");
  const repairedBlank = migrateState({
    ...state,
    workspaceBrowserStates: {
      ...state.workspaceBrowserStates,
      work: {
        activeSiteId: "personal-browser-site",
        currentURL: null,
        homeURL: "https://stale.example.com/",
        updatedAt: NOW,
      },
    },
  }).state;
  assert.deepEqual(getWorkspaceBrowserState(repairedBlank, "work"), {
    activeTabId: null,
    tabs: [],
    activeSiteId: null,
    currentURL: null,
    homeURL: null,
    updatedAt: null,
  });
  assert.throws(
    () =>
      setWorkspaceBrowserStateInState(state, "work", {
        activeSiteId: "personal-browser-site",
        currentURL: "https://personal.example.com/",
      }),
    (error) =>
      error instanceof StateModelError &&
      error.code === "WORKSPACE_BROWSER_SITE_MISMATCH",
  );
});

test("deleting or moving the active site clears only its original workspace snapshot", () => {
  let state = createInitialState({ now: NOW });
  state = addSiteToState(
    state,
    { name: "个人站点", url: "https://one.example.com/", workspaceId: "personal" },
    { now: NOW, idFactory: () => "one" },
  ).state;
  state = addSiteToState(
    state,
    { name: "工作站点", url: "https://work.example.com/", workspaceId: "work" },
    { now: NOW, idFactory: () => "work" },
  ).state;
  state = setWorkspaceBrowserStateInState(
    state,
    "personal",
    { activeSiteId: "one", currentURL: "https://one.example.com/a" },
    { now: NOW },
  ).state;
  state = setWorkspaceBrowserStateInState(
    state,
    "work",
    { activeSiteId: "work", currentURL: "https://work.example.com/b" },
    { now: NOW },
  ).state;

  state = updateSiteInState(
    state,
    { id: "one", workspaceId: "research" },
    { now: "2026-08-29T12:20:00.000Z" },
  ).state;
  assert.equal(getWorkspaceBrowserState(state, "personal").currentURL, null);
  assert.equal(getWorkspaceBrowserState(state, "work").activeSiteId, "work");

  state = deleteSiteFromState(state, "work", {
    now: "2026-08-29T12:21:00.000Z",
  }).state;
  assert.equal(getWorkspaceBrowserState(state, "work").currentURL, null);
  assert.equal(getWorkspaceBrowserState(state, "research").currentURL, null);
});

test("active workspace is validated and persisted in returned state", () => {
  const initial = createInitialState({ now: NOW });
  const result = setActiveWorkspaceInState(initial, "work", {
    now: "2026-08-29T12:01:00.000Z",
  });
  assert.equal(initial.activeWorkspaceId, "personal");
  assert.equal(result.state.activeWorkspaceId, "work");
  assert.equal(result.state.updatedAt, "2026-08-29T12:01:00.000Z");
  assert.throws(
    () => setActiveWorkspaceInState(initial, "missing"),
    (error) => error instanceof StateModelError && error.code === "WORKSPACE_NOT_FOUND",
  );
});

test("site URL de-duplication, pinning, ordering and deletion are isolated by workspace", () => {
  let state = createInitialState({ now: NOW });
  assert.throws(
    () =>
      addSiteToState(state, {
        name: "虚假身份站点",
        url: "https://profile.example.com",
        workspaceId: "work",
        browserProfileId: "work",
      }),
    (error) =>
      error instanceof StateModelError &&
      error.code === "BROWSER_PROFILE_NOT_FOUND",
  );
  const workOne = addSiteToState(
    state,
    { name: "工作一", url: "https://work.example.com", workspaceId: "work" },
    { now: NOW, idFactory: () => "work-one" },
  );
  state = workOne.state;
  assert.equal(workOne.site.siteKind, "workApp");
  assert.equal(workOne.site.openMode, "internal");
  assert.equal(workOne.site.pinned, true);

  const workDuplicate = addSiteToState(
    state,
    { name: "重复", url: "https://work.example.com/", workspaceId: "work" },
    { idFactory: () => "must-not-be-used" },
  );
  assert.equal(workDuplicate.existed, true);
  assert.equal(workDuplicate.site.id, "work-one");

  const researchSameUrl = addSiteToState(
    state,
    {
      name: "研究中的相同网址",
      url: "https://work.example.com/",
      workspaceId: "research",
      pinned: false,
    },
    { now: NOW, idFactory: () => "research-one" },
  );
  state = researchSameUrl.state;
  assert.equal(researchSameUrl.existed, false);
  assert.equal(researchSameUrl.site.siteKind, "normal");

  const workTwo = addSiteToState(
    state,
    { name: "工作二", url: "https://two.example.com/", workspaceId: "work" },
    { now: NOW, idFactory: () => "work-two" },
  );
  state = workTwo.state;
  state = moveSiteInState(
    state,
    { id: "work-two", direction: -1 },
    { now: "2026-08-29T12:02:00.000Z" },
  ).state;
  assert.deepEqual(
    sitesForWorkspace(state, "work").map((site) => site.id),
    ["work-two", "work-one"],
  );
  assert.deepEqual(
    sitesForWorkspace(state, "research").map((site) => site.id),
    ["research-one"],
  );

  const pinned = setSitePinnedInState(state, "work-one", false, {
    now: "2026-08-29T12:03:00.000Z",
  });
  state = pinned.state;
  assert.equal(pinned.site.pinned, false);
  assert.equal(sitesForWorkspace(state, "work", { pinnedOnly: true }).length, 1);
  assert.equal(sitesForWorkspace(state, "research")[0].pinned, false);

  state = deleteSiteFromState(state, "work-two", {
    now: "2026-08-29T12:04:00.000Z",
  }).state;
  assert.deepEqual(
    sitesForWorkspace(state, "work").map((site) => [site.id, site.order]),
    [["work-one", 0]],
  );
  assert.deepEqual(
    sitesForWorkspace(state, "research").map((site) => [site.id, site.order]),
    [["research-one", 0]],
  );
});

test("editing can move a site and rejects a duplicate only in the target workspace", () => {
  let state = createInitialState({ now: NOW });
  state = addSiteToState(
    state,
    { name: "个人站点", url: "https://same.example.com", workspaceId: "personal" },
    { now: NOW, idFactory: () => "personal-site" },
  ).state;
  state = addSiteToState(
    state,
    { name: "工作站点", url: "https://work-only.example.com", workspaceId: "work" },
    { now: NOW, idFactory: () => "work-site" },
  ).state;

  const moved = updateSiteInState(
    state,
    {
      id: "personal-site",
      workspaceId: "research",
      siteKind: "normal",
      openMode: "external",
      assistantIds: ["zoho-desk-ticket", "zoho-desk-ticket"],
    },
    { now: "2026-08-29T12:05:00.000Z" },
  );
  state = moved.state;
  assert.equal(moved.previousWorkspaceId, "personal");
  assert.equal(moved.site.workspaceId, "research");
  assert.equal(moved.site.openMode, "external");
  assert.deepEqual(moved.site.assistantIds, ["zoho-desk-ticket"]);
  assert.equal(sitesForWorkspace(state, "personal").length, 0);

  assert.throws(
    () =>
      updateSiteInState(state, {
        id: "work-site",
        workspaceId: "research",
        url: "https://same.example.com/",
      }),
    (error) => error instanceof StateModelError && error.code === "DUPLICATE_SITE_URL",
  );
});
