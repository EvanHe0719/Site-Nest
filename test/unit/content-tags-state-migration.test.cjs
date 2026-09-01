const assert = require("node:assert/strict");
const test = require("node:test");

const {
  CURRENT_SCHEMA_VERSION,
  createInitialState,
  migrateState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-31T10:00:00.000Z";

test("current schema retains an empty content-tag catalog without inventing formal UI data", () => {
  const initial = createInitialState({ now: NOW, defaultSites: [] });
  assert.equal(CURRENT_SCHEMA_VERSION, 18);
  assert.deepEqual(initial.contentTagGroups, []);
  assert.deepEqual(initial.contentTags, []);
  assert.deepEqual(initial.contentTagAliases, []);
  assert.deepEqual(initial.contentTagMergeRecords, []);
});

test("v14 migrates content tags idempotently and preserves legacy text and unknown tag ids", () => {
  const fixture = createInitialState({ now: NOW, defaultSites: [] });
  fixture.version = 14;
  fixture.contentTagGroups = [{
    id: "group-work",
    name: "工作",
    sortOrder: 0,
    createdAt: NOW,
    updatedAt: NOW,
  }];
  fixture.contentTags = [{
    id: "tag-sap",
    canonicalName: " SAP   Support ",
    groupId: "group-work",
    createdAt: NOW,
    updatedAt: NOW,
  }];
  fixture.localTasks = [{
    id: "task-1",
    title: "保留旧任务标签",
    workspaceId: "personal",
    tags: ["旧文本标签"],
    tagIds: ["tag-sap", "legacy-orphan"],
    createdAt: NOW,
    updatedAt: NOW,
  }];

  const once = migrateState(fixture, { now: NOW, defaultSites: [] });
  const twice = migrateState(once.state, { now: NOW, defaultSites: [] });
  assert.equal(once.state.version, 18);
  assert.equal(once.state.contentTags[0].canonicalName, "SAP Support");
  assert.equal(once.state.contentTags[0].normalizedName, "sap support");
  assert.deepEqual(once.state.localTasks[0].tags, ["旧文本标签"]);
  assert.deepEqual(once.state.localTasks[0].tagIds, ["tag-sap", "legacy-orphan"]);
  assert.deepEqual(twice.state, once.state);
});
