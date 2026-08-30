const { randomUUID } = require("node:crypto");
const {
  countContentTagReferences,
  normalizeContentTag,
  normalizeContentTagAlias,
  normalizeContentTagGroup,
  normalizeContentTagName,
  normalizeContentTagState,
  normalizeTagIdList,
} = require("./model.cjs");

const REFERENCE_COLLECTIONS = Object.freeze({
  task: ["localTasks"],
  habit: ["habits", "habitDefinitions"],
  timeline: ["timelineEvents"],
  site: ["sites"],
  userScript: ["userScripts"],
});

class ContentTagError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "ContentTagError";
    this.code = code;
  }
}

function cloneValue(value) {
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isoNow(value) {
  const parsed = value ? new Date(value) : new Date();
  return Number.isNaN(parsed.valueOf()) ? new Date().toISOString() : parsed.toISOString();
}

function cleanId(value) {
  return String(value || "").trim().slice(0, 120);
}

function normalizedState(state, now) {
  const next = cloneValue(state && typeof state === "object" ? state : {});
  Object.assign(next, normalizeContentTagState(next, { now }));
  return next;
}

function touch(next, now) {
  next.updatedAt = now;
  return next;
}

function activeTags(state) {
  return (state.contentTags || []).filter((tag) => !tag.deletedAt);
}

function activeGroups(state) {
  return (state.contentTagGroups || []).filter((group) => !group.deletedAt);
}

function saveContentTagGroupInState(state, input = {}, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const requestedId = cleanId(input.id);
  const index = requestedId
    ? next.contentTagGroups.findIndex((group) => group.id === requestedId)
    : -1;
  if (requestedId && index < 0) {
    throw new ContentTagError("CONTENT_TAG_GROUP_NOT_FOUND", "找不到指定的内容标签组");
  }
  const existing = index >= 0 ? next.contentTagGroups[index] : null;
  const id = existing?.id || cleanId(options.idFactory?.("group") || randomUUID());
  const maximumSortOrder = activeGroups(next).reduce(
    (maximum, group) => Math.max(maximum, Number(group.sortOrder) || 0),
    -1,
  );
  const group = normalizeContentTagGroup({
    ...existing,
    ...input,
    id,
    sortOrder: input.sortOrder ?? existing?.sortOrder ?? maximumSortOrder + 1,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    deletedAt: null,
  }, { now });
  if (!group) throw new ContentTagError("INVALID_CONTENT_TAG_GROUP", "内容标签组名称不能为空");
  const duplicate = activeGroups(next).find((candidate) => (
    candidate.id !== group.id && normalizeContentTagName(candidate.name) === normalizeContentTagName(group.name)
  ));
  if (duplicate) throw new ContentTagError("CONTENT_TAG_GROUP_DUPLICATE", "已存在同名的内容标签组");
  if (index >= 0) next.contentTagGroups[index] = group;
  else next.contentTagGroups.push(group);
  next.contentTagGroups.sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "zh-CN"));
  return { state: touch(next, now), group: cloneValue(group) };
}

function deleteContentTagGroupInState(state, groupId, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const id = cleanId(groupId);
  const index = next.contentTagGroups.findIndex((group) => group.id === id && !group.deletedAt);
  if (index < 0) throw new ContentTagError("CONTENT_TAG_GROUP_NOT_FOUND", "找不到指定的内容标签组");
  next.contentTags = next.contentTags.map((tag) => (
    tag.groupId === id && !tag.deletedAt
      ? { ...tag, groupId: null, updatedAt: now }
      : tag
  ));
  const group = { ...next.contentTagGroups[index], updatedAt: now, deletedAt: now };
  next.contentTagGroups[index] = group;
  return { state: touch(next, now), group: cloneValue(group) };
}

function saveContentTagInState(state, input = {}, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const requestedId = cleanId(input.id);
  const index = requestedId
    ? next.contentTags.findIndex((tag) => tag.id === requestedId)
    : -1;
  if (requestedId && index < 0) {
    throw new ContentTagError("CONTENT_TAG_NOT_FOUND", "找不到指定的内容标签");
  }
  const existing = index >= 0 ? next.contentTags[index] : null;
  const groupIds = new Set(activeGroups(next).map((group) => group.id));
  const requestedGroupId = Object.hasOwn(input, "groupId")
    ? cleanId(input.groupId)
    : cleanId(existing?.groupId);
  if (requestedGroupId && !groupIds.has(requestedGroupId)) {
    throw new ContentTagError("CONTENT_TAG_GROUP_NOT_FOUND", "找不到指定的内容标签组");
  }
  const tag = normalizeContentTag({
    ...existing,
    ...input,
    id: existing?.id || cleanId(options.idFactory?.("tag") || randomUUID()),
    groupId: requestedGroupId || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    deletedAt: null,
  }, { now, groupIds });
  if (!tag) throw new ContentTagError("INVALID_CONTENT_TAG", "内容标签名称不能为空");
  if (index >= 0) next.contentTags[index] = tag;
  else next.contentTags.push(tag);
  return { state: touch(next, now), tag: cloneValue(tag) };
}

function deleteContentTagInState(state, tagId, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const id = cleanId(tagId);
  const index = next.contentTags.findIndex((tag) => tag.id === id && !tag.deletedAt);
  if (index < 0) throw new ContentTagError("CONTENT_TAG_NOT_FOUND", "找不到指定的内容标签");
  const usage = countContentTagReferences(next, [id]);
  if (usage.referenceCount > 0) {
    throw new ContentTagError("CONTENT_TAG_IN_USE", `该内容标签仍有 ${usage.referenceCount} 个引用，不能删除`);
  }
  const tag = { ...next.contentTags[index], updatedAt: now, deletedAt: now };
  next.contentTags[index] = tag;
  return { state: touch(next, now), tag: cloneValue(tag) };
}

function saveContentTagAliasInState(state, input = {}, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const requestedId = cleanId(input.id);
  const index = requestedId
    ? next.contentTagAliases.findIndex((alias) => alias.id === requestedId)
    : -1;
  if (requestedId && index < 0) {
    throw new ContentTagError("CONTENT_TAG_ALIAS_NOT_FOUND", "找不到指定的内容标签别名");
  }
  const tagId = cleanId(input.tagId || next.contentTagAliases[index]?.tagId);
  const tagIds = new Set(activeTags(next).map((tag) => tag.id));
  if (!tagIds.has(tagId)) throw new ContentTagError("CONTENT_TAG_NOT_FOUND", "找不到别名对应的内容标签");
  const alias = normalizeContentTagAlias({
    ...(index >= 0 ? next.contentTagAliases[index] : {}),
    ...input,
    id: index >= 0 ? next.contentTagAliases[index].id : cleanId(options.idFactory?.("alias") || randomUUID()),
    tagId,
    createdAt: index >= 0 ? next.contentTagAliases[index].createdAt : now,
  }, { now, tagIds });
  if (!alias) throw new ContentTagError("INVALID_CONTENT_TAG_ALIAS", "内容标签别名不能为空");
  const canonicalConflict = activeTags(next).find((tag) => (
    tag.id !== tagId && tag.normalizedName === alias.normalizedAlias
  ));
  const aliasConflict = next.contentTagAliases.find((candidate) => (
    candidate.id !== alias.id && candidate.tagId !== tagId && candidate.normalizedAlias === alias.normalizedAlias
  ));
  if (canonicalConflict || aliasConflict) {
    throw new ContentTagError("CONTENT_TAG_ALIAS_CONFLICT", "该别名已指向其他内容标签");
  }
  if (index >= 0) next.contentTagAliases[index] = alias;
  else next.contentTagAliases.push(alias);
  return { state: touch(next, now), alias: cloneValue(alias) };
}

function deleteContentTagAliasInState(state, aliasId, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const id = cleanId(aliasId);
  const index = next.contentTagAliases.findIndex((alias) => alias.id === id);
  if (index < 0) throw new ContentTagError("CONTENT_TAG_ALIAS_NOT_FOUND", "找不到指定的内容标签别名");
  const [alias] = next.contentTagAliases.splice(index, 1);
  return { state: touch(next, now), alias: cloneValue(alias) };
}

function resolveReferenceCollection(state, objectType, objectId) {
  const type = String(objectType || "");
  const id = cleanId(objectId);
  const keys = REFERENCE_COLLECTIONS[type];
  if (!keys || !id) throw new ContentTagError("INVALID_CONTENT_TAG_TARGET", "内容标签关联对象无效");
  for (const collectionKey of keys) {
    if (!Array.isArray(state[collectionKey])) continue;
    const index = state[collectionKey].findIndex((item) => cleanId(item?.id) === id);
    if (index >= 0) return { collectionKey, index, object: state[collectionKey][index] };
  }
  throw new ContentTagError("CONTENT_TAG_TARGET_NOT_FOUND", "找不到要关联内容标签的对象");
}

function setContentObjectTagsInState(state, input = {}, options = {}) {
  const now = isoNow(options.now);
  const next = normalizedState(state, now);
  const tagIds = normalizeTagIdList(input.tagIds, { limit: 100 });
  const allowed = new Set(activeTags(next).map((tag) => tag.id));
  const invalid = tagIds.filter((tagId) => !allowed.has(tagId));
  if (invalid.length) throw new ContentTagError("CONTENT_TAG_NOT_FOUND", "关联中包含不存在或已删除的内容标签");
  const target = resolveReferenceCollection(next, input.objectType, input.objectId);
  const updated = {
    ...target.object,
    tagIds,
    ...(Object.hasOwn(target.object, "updatedAt") ? { updatedAt: now } : {}),
  };
  next[target.collectionKey][target.index] = updated;
  return {
    state: touch(next, now),
    objectType: String(input.objectType || ""),
    objectId: cleanId(input.objectId),
    tagIds: cloneValue(tagIds),
  };
}

function duplicateContentTagCandidates(state) {
  const groups = new Map();
  for (const tag of activeTags(state)) {
    const list = groups.get(tag.normalizedName) || [];
    list.push({ id: tag.id, canonicalName: tag.canonicalName, groupId: tag.groupId });
    groups.set(tag.normalizedName, list);
  }
  return Array.from(groups.entries())
    .filter(([, tags]) => tags.length > 1)
    .map(([normalizedName, tags]) => ({ normalizedName, tags }))
    .sort((left, right) => left.normalizedName.localeCompare(right.normalizedName, "zh-CN"));
}

function contentTagSnapshot(state) {
  const normalized = normalizedState(state, isoNow(state?.updatedAt));
  const groups = activeGroups(normalized);
  const tags = activeTags(normalized);
  const activeTagIds = new Set(tags.map((tag) => tag.id));
  const aliases = normalized.contentTagAliases.filter((alias) => activeTagIds.has(alias.tagId));
  const referenceCounts = countContentTagReferences(normalized, tags.map((tag) => tag.id));
  const mergeRecords = normalized.contentTagMergeRecords.map((record) => ({
    id: record.id,
    sourceTagIds: record.sourceTagIds,
    targetTagId: record.targetTagId,
    affectedReferenceCount: record.affectedReferenceCount,
    affectedObjectCount: record.affectedObjectCount,
    affectedByType: record.affectedByType,
    createdAt: record.createdAt,
    undoneAt: record.undoneAt,
  }));
  const latestMerge = mergeRecords.at(-1) || null;
  return {
    contentTagGroups: cloneValue(groups),
    contentTags: cloneValue(tags),
    contentTagAliases: cloneValue(aliases),
    contentTagMergeRecords: cloneValue(mergeRecords),
    groups: cloneValue(groups),
    tags: cloneValue(tags),
    aliases: cloneValue(aliases),
    mergeRecords: cloneValue(mergeRecords),
    referenceCounts,
    byTagId: cloneValue(referenceCounts.byTagId),
    duplicateCandidates: duplicateContentTagCandidates(normalized),
    canUndoLastMerge: Boolean(latestMerge && !latestMerge.undoneAt),
  };
}

module.exports = {
  ContentTagError,
  contentTagSnapshot,
  deleteContentTagAliasInState,
  deleteContentTagGroupInState,
  deleteContentTagInState,
  duplicateContentTagCandidates,
  saveContentTagAliasInState,
  saveContentTagGroupInState,
  saveContentTagInState,
  setContentObjectTagsInState,
};
