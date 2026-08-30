const assert = require("node:assert/strict");
const test = require("node:test");

const {
  StateModelError,
  addSiteToState,
  createInitialState,
  deleteSiteFromState,
  getWorkspaceBrowserState,
  migrateState,
  setWorkspaceBrowserTabsInState,
  updateSiteInState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-29T06:00:00.000Z";

function addSite(state, input, id) {
  return addSiteToState(state, input, {
    now: NOW,
    idFactory: () => id,
  }).state;
}

function tab(tabId, siteId, url, overrides = {}) {
  return {
    tabId,
    siteId,
    title: tabId,
    url,
    homeURL: url,
    updatedAt: NOW,
    ...overrides,
  };
}

test("legacy single-page workspace snapshot migrates to one stable tab and remains idempotent", () => {
  let state = createInitialState({ now: NOW });
  state = addSite(
    state,
    {
      name: "旧现场",
      url: "https://legacy.example.test/",
      workspaceId: "personal",
    },
    "legacy-site",
  );
  const legacyUpdatedAt = "2026-08-29T06:01:00.000Z";
  const raw = {
    ...state,
    workspaceBrowserStates: {
      ...state.workspaceBrowserStates,
      personal: {
        activeSiteId: "legacy-site",
        currentURL: "https://legacy.example.test/topic/8",
        homeURL: "https://legacy.example.test/",
        updatedAt: legacyUpdatedAt,
      },
    },
  };

  const migrated = migrateState(raw, { now: "2026-08-29T06:02:00.000Z" });
  const snapshot = migrated.state.workspaceBrowserStates.personal;
  assert.equal(snapshot.tabs.length, 1);
  assert.equal(snapshot.activeTabId, "legacy-personal");
  assert.deepEqual(snapshot.tabs[0], {
    tabId: "legacy-personal",
    sessionId: "legacy-personal",
    siteId: "legacy-site",
    browserProfileId: "default",
    title: "旧现场",
    url: "https://legacy.example.test/topic/8",
    normalizedUrl: "https://legacy.example.test/topic/8",
    homeURL: "https://legacy.example.test/",
    favicon: null,
    createdAt: legacyUpdatedAt,
    lastActiveAt: legacyUpdatedAt,
    loadingState: "idle",
    errorState: null,
    reliableContext: null,
    keepRunning: false,
    tabGroupId: null,
    groupSortOrder: 0,
    updatedAt: legacyUpdatedAt,
  });
  assert.equal(snapshot.activeSiteId, "legacy-site");
  assert.equal(snapshot.currentURL, "https://legacy.example.test/topic/8");

  const again = migrateState(migrated.state, {
    now: "2030-01-01T00:00:00.000Z",
  });
  assert.equal(again.changed, false);
  assert.deepEqual(again.state, migrated.state);
});

test("restart normalization drops runtime flags but preserves duplicate same-site tabs for user review", () => {
  let state = createInitialState({ now: NOW });
  state = addSite(
    state,
    {
      name: "去重站点",
      url: "https://dedupe.example.test/",
      workspaceId: "personal",
    },
    "dedupe-site",
  );
  const raw = {
    ...state,
    workspaceBrowserStates: {
      ...state.workspaceBrowserStates,
      personal: {
        activeTabId: "duplicate-tab",
        tabs: [
          tab("kept-tab", "dedupe-site", "https://dedupe.example.test/one", {
            detached: true,
            loading: true,
            active: false,
          }),
          tab("duplicate-tab", "dedupe-site", "https://dedupe.example.test/two", {
            detached: true,
            loading: true,
            active: true,
          }),
        ],
      },
    },
  };

  const snapshot = migrateState(raw, { now: NOW }).state.workspaceBrowserStates.personal;
  assert.equal(snapshot.tabs.length, 2);
  assert.equal(snapshot.tabs[0].tabId, "kept-tab");
  assert.equal(snapshot.tabs[1].tabId, "duplicate-tab");
  assert.equal(snapshot.tabs[1].allowDuplicate, true);
  assert.equal(snapshot.activeTabId, "duplicate-tab");
  assert.notEqual(snapshot.tabs[0].detached, true);
  assert.notEqual(snapshot.tabs[0].loading, true);
  assert.equal(Object.hasOwn(snapshot.tabs[0], "active"), false);
});

test("anonymous duplicate URLs survive restart for explicit user review", () => {
  const state = createInitialState({ now: NOW });
  const raw = {
    ...state,
    workspaceBrowserStates: {
      ...state.workspaceBrowserStates,
      research: {
        activeTabId: "duplicate-url",
        tabs: [
          tab("base-url", null, "https://anon.example.test/path"),
          tab("duplicate-url", null, "https://ANON.example.test:443/path"),
          tab("query-url", null, "https://anon.example.test/path?q=1"),
          tab("hash-url", null, "https://anon.example.test/path#section"),
        ],
      },
    },
  };

  const snapshot = migrateState(raw, { now: NOW }).state.workspaceBrowserStates.research;
  assert.deepEqual(
    snapshot.tabs.map((item) => item.tabId),
    ["base-url", "duplicate-url", "query-url", "hash-url"],
  );
  assert.equal(snapshot.activeTabId, "duplicate-url");
  assert.equal(snapshot.tabs[1].allowDuplicate, true);

  assert.throws(
    () =>
      setWorkspaceBrowserTabsInState(
        state,
        "research",
        {
          tabs: [
            tab("anonymous-a", null, "https://anon.example.test/path"),
            tab("anonymous-b", null, "https://ANON.example.test:443/path"),
          ],
          activeTabId: "anonymous-a",
        },
        { now: NOW },
      ),
    (error) =>
      error instanceof StateModelError &&
      error.code === "DUPLICATE_BROWSER_TAB_URL",
  );
});

test("same workspace rejects duplicate site tabs while separate workspaces keep independent tab groups", () => {
  let state = createInitialState({ now: NOW });
  state = addSite(
    state,
    {
      name: "个人共享入口",
      url: "https://shared.example.test/",
      workspaceId: "personal",
    },
    "personal-shared-site",
  );
  state = addSite(
    state,
    {
      name: "工作共享入口",
      url: "https://shared.example.test/",
      workspaceId: "work",
    },
    "work-shared-site",
  );

  assert.throws(
    () =>
      setWorkspaceBrowserTabsInState(
        state,
        "personal",
        {
          tabs: [
            tab("personal-a", "personal-shared-site", "https://shared.example.test/a"),
            tab("personal-b", "personal-shared-site", "https://shared.example.test/b"),
          ],
          activeTabId: "personal-b",
        },
        { now: NOW },
      ),
    (error) =>
      error instanceof StateModelError &&
      error.code === "DUPLICATE_BROWSER_SITE_TAB",
  );

  state = setWorkspaceBrowserTabsInState(
    state,
    "personal",
    {
      tabs: [
        tab(
          "personal-tab",
          "personal-shared-site",
          "https://shared.example.test/personal",
        ),
      ],
      activeTabId: "personal-tab",
    },
    { now: NOW },
  ).state;
  state = setWorkspaceBrowserTabsInState(
    state,
    "work",
    {
      tabs: [
        tab(
          "work-tab",
          "work-shared-site",
          "https://shared.example.test/work",
        ),
      ],
      activeTabId: "work-tab",
    },
    { now: NOW },
  ).state;

  assert.equal(getWorkspaceBrowserState(state, "personal").tabs.length, 1);
  assert.equal(getWorkspaceBrowserState(state, "work").tabs.length, 1);
  assert.equal(
    getWorkspaceBrowserState(state, "personal").tabs[0].tabId,
    "personal-tab",
  );
  assert.equal(
    getWorkspaceBrowserState(state, "work").tabs[0].tabId,
    "work-tab",
  );
});

test("explicit copies bypass site and exact-URL dedupe and survive restart normalization", () => {
  let state = createInitialState({ now: NOW });
  state = addSite(
    state,
    {
      name: "可复制站点",
      url: "https://copy.example.test/",
      workspaceId: "personal",
    },
    "copy-site",
  );

  state = setWorkspaceBrowserTabsInState(
    state,
    "personal",
    {
      tabs: [
        tab("site-copy", "copy-site", "https://copy.example.test/topic", {
          allowDuplicate: true,
        }),
        tab("site-original", "copy-site", "https://copy.example.test/"),
      ],
      activeTabId: "site-copy",
    },
    { now: NOW },
  ).state;
  state = setWorkspaceBrowserTabsInState(
    state,
    "research",
    {
      tabs: [
        tab("anonymous-original", null, "https://anonymous.example.test/read"),
        tab("anonymous-copy", null, "https://ANONYMOUS.example.test:443/read", {
          allowDuplicate: true,
        }),
      ],
      activeTabId: "anonymous-copy",
    },
    { now: NOW },
  ).state;

  const restarted = migrateState(state, { now: "2026-08-29T06:05:00.000Z" }).state;
  const personal = getWorkspaceBrowserState(restarted, "personal");
  const research = getWorkspaceBrowserState(restarted, "research");

  assert.deepEqual(
    personal.tabs.map((item) => item.tabId),
    ["site-copy", "site-original"],
  );
  assert.equal(personal.activeTabId, "site-copy");
  assert.equal(personal.tabs[0].allowDuplicate, true);
  assert.equal(Object.hasOwn(personal.tabs[1], "allowDuplicate"), false);
  assert.deepEqual(
    research.tabs.map((item) => item.tabId),
    ["anonymous-original", "anonymous-copy"],
  );
  assert.equal(research.activeTabId, "anonymous-copy");
  assert.equal(research.tabs[1].allowDuplicate, true);
});

test("tab state rejects an activeTabId that is not present", () => {
  const state = createInitialState({ now: NOW });
  assert.throws(
    () =>
      setWorkspaceBrowserTabsInState(
        state,
        "research",
        {
          tabs: [tab("research-tab", null, "https://papers.example.test/read")],
          activeTabId: "missing-tab",
        },
        { now: NOW },
      ),
    (error) =>
      error instanceof StateModelError && error.code === "BROWSER_TAB_NOT_FOUND",
  );
});

test("deleting or moving a site removes only that site's tab and preserves neighboring workspace tabs", () => {
  let state = createInitialState({ now: NOW });
  state = addSite(
    state,
    { name: "个人 A", url: "https://a.example.test/", workspaceId: "personal" },
    "personal-a",
  );
  state = addSite(
    state,
    { name: "个人 B", url: "https://b.example.test/", workspaceId: "personal" },
    "personal-b",
  );
  state = addSite(
    state,
    { name: "工作 W", url: "https://w.example.test/", workspaceId: "work" },
    "work-w",
  );
  state = setWorkspaceBrowserTabsInState(
    state,
    "personal",
    {
      tabs: [
        tab("tab-a", "personal-a", "https://a.example.test/one"),
        tab("tab-b", "personal-b", "https://b.example.test/two"),
      ],
      activeTabId: "tab-b",
    },
    { now: NOW },
  ).state;
  state = setWorkspaceBrowserTabsInState(
    state,
    "work",
    {
      tabs: [tab("tab-w", "work-w", "https://w.example.test/ticket")],
      activeTabId: "tab-w",
    },
    { now: NOW },
  ).state;

  state = deleteSiteFromState(state, "personal-a", { now: NOW }).state;
  assert.deepEqual(
    getWorkspaceBrowserState(state, "personal").tabs.map((item) => item.tabId),
    ["tab-b"],
  );
  assert.equal(getWorkspaceBrowserState(state, "personal").activeTabId, "tab-b");
  assert.deepEqual(
    getWorkspaceBrowserState(state, "work").tabs.map((item) => item.tabId),
    ["tab-w"],
  );

  state = updateSiteInState(
    state,
    { id: "personal-b", workspaceId: "work" },
    { now: "2026-08-29T06:03:00.000Z" },
  ).state;
  assert.deepEqual(getWorkspaceBrowserState(state, "personal").tabs, []);
  assert.equal(getWorkspaceBrowserState(state, "personal").activeTabId, null);
  assert.deepEqual(
    getWorkspaceBrowserState(state, "work").tabs.map((item) => item.tabId),
    ["tab-w"],
  );
});
