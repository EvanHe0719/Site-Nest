const assert = require("node:assert/strict");
const test = require("node:test");

const {
  countContentTagReferences,
  mergeContentTags,
  normalizeContentTag,
  normalizeContentTagAlias,
  normalizeContentTagGroup,
  normalizeContentTagMergeRecord,
  normalizeContentTagName,
  normalizeContentTags,
  previewContentTagMerge,
  undoLastContentTagMerge,
} = require("../../electron/content-tags/model.cjs");
const {
  contentTagSnapshot,
  deleteContentTagGroupInState,
  deleteContentTagInState,
  saveContentTagAliasInState,
  saveContentTagGroupInState,
  saveContentTagInState,
  setContentObjectTagsInState,
} = require("../../electron/content-tags/management.cjs");

const NOW = "2026-08-31T08:00:00.000Z";
const LATER = "2026-08-31T08:05:00.000Z";

function tag(id, canonicalName, overrides = {}) {
  return {
    id,
    canonicalName,
    normalizedName: normalizeContentTagName(canonicalName),
    groupId: "work-tags",
    iconKey: "tag",
    accentKey: "blue",
    description: "",
    createdAt: NOW,
    updatedAt: NOW,
    deletedAt: null,
    ...overrides,
  };
}

function baseState() {
  return {
    updatedAt: NOW,
    contentTagGroups: [{
      id: "work-tags",
      name: "工作",
      iconKey: "folder",
      sortOrder: 0,
      createdAt: NOW,
      updatedAt: NOW,
      deletedAt: null,
    }],
    contentTags: [
      tag("source-sap", "SAP 支持"),
      tag("source-customer", "客户"),
      tag("target-enterprise", "企业服务", { accentKey: "pine" }),
      tag("unrelated", "跟进"),
    ],
    contentTagAliases: [{
      id: "alias-source-sap",
      tagId: "source-sap",
      alias: "SAP Service",
      normalizedAlias: "sap service",
      createdAt: NOW,
    }, {
      id: "alias-unrelated",
      tagId: "unrelated",
      alias: "Follow up",
      normalizedAlias: "follow up",
      createdAt: NOW,
    }],
    contentTagMergeRecords: [],
    localTasks: [{
      id: "task-1",
      title: "处理客户问题",
      tagIds: ["source-sap", "target-enterprise", "unrelated"],
      status: "todo",
    }],
    habits: [{
      id: "habit-1",
      name: "每天复盘",
      tagIds: ["source-customer"],
      enabled: true,
    }],
    timelineEvents: [{
      id: "timeline-1",
      title: "支持项目上线",
      tagIds: ["source-sap", "source-customer"],
      deletedAt: null,
    }],
    sites: [{
      id: "site-1",
      name: "客户门户",
      tagIds: ["target-enterprise", "source-customer"],
      url: "https://example.test/",
    }],
    userScripts: [{
      id: "script-1",
      name: "工单增强",
      tagIds: ["source-sap"],
      code: "// unchanged",
    }],
  };
}

function deterministicIdFactory() {
  let next = 0;
  return (kind) => `${kind}-${++next}`;
}

test("entities normalize only edge/repeated whitespace and case without synonym inference", () => {
  const group = normalizeContentTagGroup({
    id: "group-a",
    name: "  客户   工作  ",
    parentGroupId: "must-not-survive",
    sortOrder: "2",
  }, { now: NOW });
  assert.equal(group.name, "客户 工作");
  assert.equal(group.sortOrder, 2);
  assert.equal(Object.hasOwn(group, "parentGroupId"), false, "content tag groups are one level only");

  const normalized = normalizeContentTag({
    id: "tag-a",
    canonicalName: "  SAP   Support  ",
    normalizedName: "caller-must-not-control-this",
    groupId: "group-a",
    description: "keep punctuation: A/B",
  }, { now: NOW, groupIds: new Set(["group-a"]) });
  assert.equal(normalized.canonicalName, "SAP Support");
  assert.equal(normalized.normalizedName, "sap support");
  assert.equal(normalized.description, "keep punctuation: A/B");
  assert.equal(normalizeContentTagName("客户"), "客户");
  assert.equal(normalizeContentTagName("顾客"), "顾客");
  assert.notEqual(normalizeContentTagName("客户"), normalizeContentTagName("顾客"));

  const alias = normalizeContentTagAlias({
    id: "alias-a",
    tagId: "tag-a",
    alias: "  Key   Account  ",
    normalizedAlias: "ignored",
  }, { now: NOW, tagIds: new Set(["tag-a"]) });
  assert.equal(alias.alias, "Key Account");
  assert.equal(alias.normalizedAlias, "key account");

  const duplicateCandidates = normalizeContentTags([
    { id: "case-a", canonicalName: "SAP", createdAt: NOW, updatedAt: NOW },
    { id: "case-b", canonicalName: " sap ", createdAt: NOW, updatedAt: NOW },
  ], { now: NOW });
  assert.equal(duplicateCandidates.length, 2, "normalization must not silently merge duplicate candidates");
  assert.equal(duplicateCandidates[0].normalizedName, duplicateCandidates[1].normalizedName);
});

test("merge records normalize required fields and retain a validated reverse snapshot", () => {
  const before = tag("source-sap", "SAP 支持");
  const after = { ...before, updatedAt: LATER, deletedAt: LATER };
  const record = normalizeContentTagMergeRecord({
    id: "merge-1",
    sourceTagIds: ["source-sap", "source-sap", "target-enterprise"],
    targetTagId: "target-enterprise",
    affectedReferenceCount: 3.8,
    affectedObjectCount: 2,
    affectedByType: { task: 1, timeline: 1 },
    createdAt: NOW,
    reverseSnapshot: {
      tagChanges: [{ id: "source-sap", before, after }],
      aliasChanges: [],
      referenceChanges: [{
        objectType: "task",
        collectionKey: "localTasks",
        objectId: "task-1",
        beforeTagIds: ["source-sap"],
        afterTagIds: ["target-enterprise"],
      }],
    },
  }, {
    now: NOW,
    groupIds: new Set(["work-tags"]),
    tagIds: new Set(["source-sap", "target-enterprise"]),
  });
  assert.deepEqual(record.sourceTagIds, ["source-sap"]);
  assert.equal(record.affectedReferenceCount, 3);
  assert.equal(record.affectedByType.task, 1);
  assert.equal(record.affectedByType.site, 0);
  assert.equal(record.reverseSnapshot.referenceChanges.length, 1);
});

test("reference counts cover task, habit, timeline, site and userScript separately", () => {
  const state = baseState();
  const usage = countContentTagReferences(state, ["source-sap", "source-customer"]);
  assert.equal(usage.referenceCount, 6);
  assert.equal(usage.objectCount, 5);
  assert.deepEqual(usage.referenceCountsByType, {
    task: 1,
    habit: 1,
    timeline: 2,
    site: 1,
    userScript: 1,
  });
  assert.deepEqual(usage.objectCountsByType, {
    task: 1,
    habit: 1,
    timeline: 1,
    site: 1,
    userScript: 1,
  });
  assert.equal(usage.byTagId["source-sap"].referenceCount, 3);
  assert.equal(usage.byTagId["source-customer"].referenceCount, 3);
});

test("merge preview reports source, target and affected counts without changing state", () => {
  const state = baseState();
  const snapshot = structuredClone(state);
  const preview = previewContentTagMerge(state, {
    sourceTagIds: ["source-sap", "source-customer"],
    targetTagId: "target-enterprise",
  }, { now: LATER });
  assert.equal(preview.sourceUsage.referenceCount, 6);
  assert.equal(preview.targetUsage.referenceCount, 2);
  assert.equal(preview.affectedReferenceCount, 6);
  assert.equal(preview.affectedObjectCount, 5);
  assert.equal(preview.affectedByType.timeline, 1);
  assert.equal(preview.affectedReferencesByType.timeline, 2);
  assert.deepEqual(state, snapshot);
});

test("merge atomically migrates all five reference types, soft-deletes sources and preserves objects", () => {
  const state = baseState();
  const snapshot = structuredClone(state);
  const result = mergeContentTags(state, {
    sourceTagIds: ["source-sap", "source-customer"],
    targetTagId: "target-enterprise",
  }, {
    now: LATER,
    recordId: "merge-1",
    idFactory: deterministicIdFactory(),
  });

  assert.deepEqual(state, snapshot, "pure domain merge must not mutate its input");
  assert.equal(result.state.localTasks.length, state.localTasks.length);
  assert.equal(result.state.habits.length, state.habits.length);
  assert.equal(result.state.timelineEvents.length, state.timelineEvents.length);
  assert.equal(result.state.sites.length, state.sites.length);
  assert.equal(result.state.userScripts.length, state.userScripts.length);
  assert.equal(result.state.localTasks[0].title, state.localTasks[0].title);
  assert.equal(result.state.userScripts[0].code, state.userScripts[0].code);

  assert.deepEqual(result.state.localTasks[0].tagIds, ["target-enterprise", "unrelated"]);
  assert.deepEqual(result.state.habits[0].tagIds, ["target-enterprise"]);
  assert.deepEqual(result.state.timelineEvents[0].tagIds, ["target-enterprise"]);
  assert.deepEqual(result.state.sites[0].tagIds, ["target-enterprise"]);
  assert.deepEqual(result.state.userScripts[0].tagIds, ["target-enterprise"]);

  assert.equal(result.state.contentTags.find((item) => item.id === "source-sap").deletedAt, LATER);
  assert.equal(result.state.contentTags.find((item) => item.id === "source-customer").deletedAt, LATER);
  assert.equal(result.state.contentTags.find((item) => item.id === "target-enterprise").deletedAt, null);
  assert.equal(result.state.contentTagAliases.find((item) => item.id === "alias-source-sap").tagId, "target-enterprise");
  assert.ok(result.state.contentTagAliases.some((item) =>
    item.tagId === "target-enterprise" && item.alias === "SAP 支持"));
  assert.ok(result.state.contentTagAliases.some((item) =>
    item.tagId === "target-enterprise" && item.alias === "客户"));
  assert.deepEqual(result.state.contentTagAliases.find((item) => item.id === "alias-unrelated"), state.contentTagAliases[1]);

  assert.equal(result.record.affectedReferenceCount, 6);
  assert.equal(result.record.affectedObjectCount, 5);
  assert.equal(result.record.reverseSnapshot.referenceChanges.length, 5);
  assert.equal(result.record.reverseSnapshot.tagChanges.length, 3);
  assert.ok(result.record.reverseSnapshot.aliasChanges.some((change) => change.before === null));
});

test("undo restores exact reference order, tags and aliases and marks only the latest record undone", () => {
  const original = baseState();
  const merged = mergeContentTags(original, ["source-sap", "source-customer"], "target-enterprise", {
    now: LATER,
    recordId: "merge-1",
    idFactory: deterministicIdFactory(),
  });
  const undone = undoLastContentTagMerge(merged.state, { now: "2026-08-31T08:06:00.000Z" });

  assert.deepEqual(undone.state.localTasks, original.localTasks);
  assert.deepEqual(undone.state.habits, original.habits);
  assert.deepEqual(undone.state.timelineEvents, original.timelineEvents);
  assert.deepEqual(undone.state.sites, original.sites);
  assert.deepEqual(undone.state.userScripts, original.userScripts);
  assert.deepEqual(undone.state.contentTags, original.contentTags);
  assert.deepEqual(undone.state.contentTagAliases, original.contentTagAliases);
  assert.equal(undone.record.id, "merge-1");
  assert.equal(undone.record.undoneAt, "2026-08-31T08:06:00.000Z");
});

test("invalid merge and mid-transaction id failure leave the original state byte-for-byte unchanged", () => {
  const state = baseState();
  const snapshot = structuredClone(state);
  assert.throws(() => mergeContentTags(state, ["missing-source"], "target-enterprise", {
    now: LATER,
  }), /来源内容标签/);
  assert.deepEqual(state, snapshot);

  state.contentTagAliases.push({
    id: "collision",
    tagId: "unrelated",
    alias: "Collision",
    normalizedAlias: "collision",
    createdAt: NOW,
  });
  const withCollision = structuredClone(state);
  assert.throws(() => mergeContentTags(state, ["source-sap"], "target-enterprise", {
    now: LATER,
    idFactory: () => "collision",
  }), /唯一的标签别名编号/);
  assert.deepEqual(state, withCollision);
});

test("undo refuses to overwrite a reference changed after merge", () => {
  const merged = mergeContentTags(baseState(), ["source-sap"], "target-enterprise", {
    now: LATER,
    recordId: "merge-1",
    idFactory: deterministicIdFactory(),
  }).state;
  merged.localTasks[0].tagIds.push("later-tag");
  const snapshot = structuredClone(merged);
  assert.throws(() => undoLastContentTagMerge(merged, {
    now: "2026-08-31T08:06:00.000Z",
  }), /关联在合并后已变化/);
  assert.deepEqual(merged, snapshot);
});

test("management creates one-level groups, tags and aliases without inferring synonyms", () => {
  const empty = {
    updatedAt: NOW,
    contentTagGroups: [],
    contentTags: [],
    contentTagAliases: [],
    contentTagMergeRecords: [],
    localTasks: [],
  };
  const grouped = saveContentTagGroupInState(empty, { name: " 客户   工作 " }, {
    now: NOW,
    idFactory: () => "group-work",
  });
  const tagged = saveContentTagInState(grouped.state, {
    canonicalName: " SAP   Support ",
    groupId: grouped.group.id,
    accentKey: "pine",
  }, {
    now: NOW,
    idFactory: () => "tag-sap",
  });
  const aliased = saveContentTagAliasInState(tagged.state, {
    tagId: tagged.tag.id,
    alias: " SAP   服务 ",
  }, {
    now: NOW,
    idFactory: () => "alias-sap",
  });
  assert.equal(grouped.group.name, "客户 工作");
  assert.equal(tagged.tag.canonicalName, "SAP Support");
  assert.equal(tagged.tag.normalizedName, "sap support");
  assert.equal(aliased.alias.alias, "SAP 服务");
  assert.notEqual(normalizeContentTagName("SAP 服务"), normalizeContentTagName("SAP Support"));
});

test("management only deletes unused tags and deleting a group keeps its tags ungrouped", () => {
  const state = baseState();
  assert.throws(() => deleteContentTagInState(state, "source-sap", { now: LATER }), /仍有 3 个引用/);
  const deletedGroup = deleteContentTagGroupInState(state, "work-tags", { now: LATER });
  assert.equal(deletedGroup.group.deletedAt, LATER);
  assert.ok(deletedGroup.state.contentTags.filter((item) => !item.deletedAt).every((item) => item.groupId === null));
  state.contentTags.push(tag("unused", "未使用"));
  const deleted = deleteContentTagInState(state, "unused", { now: LATER });
  assert.equal(deleted.tag.deletedAt, LATER);
  assert.equal(state.contentTags.find((item) => item.id === "unused").deletedAt, null);
});

test("unified object assignment validates tag ids and counts all five object types", () => {
  const state = baseState();
  const updated = setContentObjectTagsInState(state, {
    objectType: "task",
    objectId: "task-1",
    tagIds: ["target-enterprise", "target-enterprise", "unrelated"],
  }, { now: LATER });
  assert.deepEqual(updated.state.localTasks[0].tagIds, ["target-enterprise", "unrelated"]);
  assert.throws(() => setContentObjectTagsInState(state, {
    objectType: "userScript",
    objectId: "script-1",
    tagIds: ["missing"],
  }, { now: LATER }), /不存在或已删除/);
  const snapshot = contentTagSnapshot(updated.state);
  assert.equal(snapshot.byTagId["target-enterprise"].referenceCount, 2);
  assert.equal(snapshot.contentTagMergeRecords.length, 0);
  assert.equal(Object.hasOwn(snapshot, "reverseSnapshot"), false);
});
