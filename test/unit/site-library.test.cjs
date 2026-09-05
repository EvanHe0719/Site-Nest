const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeSiteLibrary, changeSiteLibrary } = require("../../electron/site-library.cjs");
const { createInitialState, updateUiSettingsInState, migrateState } = require("../../electron/state-model.cjs");
const { buildSyncEntities, applyEntityOperationToState } = require("../../electron/sync/entity-adapters.cjs");
const { createSafeSnapshot } = require("../../electron/google-drive-sync-data.cjs");

test("site groups create, rename, move and delete without touching sites or browser identities", () => {
  const state = { sites: [{ id: "one", url: "https://example.com", browserProfileId: "nodeseek" }], uiSettings: {} };
  const before = JSON.stringify(state.sites);
  const mutate = (input) => { state.uiSettings.siteLibrary = changeSiteLibrary(state, input, () => "community"); };
  mutate({ action: "create", name: "社区" });
  mutate({ action: "assign", siteId: "one", groupId: "community" });
  mutate({ action: "rename", groupId: "community", name: "论坛社区" });
  assert.equal(state.uiSettings.siteLibrary.assignments.one, "community");
  mutate({ action: "collapse", groupId: "community" });
  mutate({ action: "view", view: "list" });
  assert.deepEqual(state.uiSettings.siteLibrary.collapsed, ["community"]);
  mutate({ action: "delete", groupId: "community" });
  assert.deepEqual(state.uiSettings.siteLibrary.assignments, {});
  assert.deepEqual(state.uiSettings.siteLibrary.groups, []);
  assert.deepEqual(state.uiSettings.siteLibrary.collapsed, []);
  assert.equal(JSON.stringify(state.sites), before);
});

test("invalid and duplicate groups fail atomically; orphan assignments normalize safely", () => {
  const state = { sites: [{ id: "one" }], uiSettings: { siteLibrary: { groups: [{ id: "g", name: "Work" }] } } };
  const before = JSON.stringify(state);
  for (const input of [{ action: "create", name: " work " }, { action: "create", name: " " }, { action: "create", name: "x".repeat(41) }, { action: "assign", siteId: "missing", groupId: "g" }, { action: "assign", siteId: "one", groupId: "unknown" }, { action: "view", view: "unsafe" }, { action: "delete", groupId: "all" }]) assert.throws(() => changeSiteLibrary(state, input));
  assert.equal(JSON.stringify(state), before);
  assert.deepEqual(normalizeSiteLibrary({ assignments: { one: "unknown" }, collapsed: ["unknown"], view: "evil" }), { groups: [], assignments: {}, collapsed: [], view: "grid" });
});

test("group settings survive migration, full snapshots and incremental settings sync", () => {
  let state = createInitialState();
  const library = { groups: [{ id: "g", name: "学习" }], assignments: { example: "g" }, collapsed: ["g"], view: "list" };
  state = updateUiSettingsInState(state, { siteLibrary: library }).state;
  assert.deepEqual(migrateState(state).state.uiSettings.siteLibrary, library);
  assert.deepEqual(createSafeSnapshot(state).settings.siteLibrary, library);
  const entity = buildSyncEntities(state).get("applicationSetting:shared");
  assert.deepEqual(entity.payload.siteLibrary, library);
  const restored = applyEntityOperationToState(createInitialState(), { ...entity, operation: "upsert" });
  assert.deepEqual(restored.uiSettings.siteLibrary, library);
  state.uiSettings.googleSync.settings = false;
  assert.equal(buildSyncEntities(state).has("applicationSetting:shared"), false);
});
