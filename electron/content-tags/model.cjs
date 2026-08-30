const { randomUUID } = require("node:crypto");

const CONTENT_TAG_REFERENCE_TYPES = Object.freeze([
  Object.freeze({ type: "task", collectionKeys: Object.freeze(["localTasks"]) }),
  Object.freeze({ type: "habit", collectionKeys: Object.freeze(["habits", "habitDefinitions"]) }),
  Object.freeze({ type: "timeline", collectionKeys: Object.freeze(["timelineEvents"]) }),
  Object.freeze({ type: "site", collectionKeys: Object.freeze(["sites"]) }),
  Object.freeze({ type: "userScript", collectionKeys: Object.freeze(["userScripts"]) }),
]);

const CONTENT_TAG_REFERENCE_TYPE_NAMES = Object.freeze(
  CONTENT_TAG_REFERENCE_TYPES.map((descriptor) => descriptor.type),
);
const CONTENT_TAG_REFERENCE_COLLECTIONS = new Set(
  CONTENT_TAG_REFERENCE_TYPES.flatMap((descriptor) => descriptor.collectionKeys),
);

function cloneValue(value) {
  if (value === undefined || value === null) return value;
  return typeof structuredClone === "function"
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value));
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function isoNow(value) {
  return isoOrNull(value) || new Date().toISOString();
}

function cleanIdentifier(value, limit = 120) {
  return String(value ?? "").trim().slice(0, limit);
}

function cleanText(value, limit = 5000) {
  return String(value ?? "").slice(0, limit);
}

function collapseWhitespace(value, limit = 120) {
  return String(value ?? "")
    .trim()
    .replace(/\s+/gu, " ")
    .slice(0, limit)
    .trim();
}

/**
 * This is intentionally conservative. It does not remove punctuation, apply
 * Unicode transliteration, or infer synonyms. It only trims/collapses
 * whitespace and folds case.
 */
function normalizeContentTagName(value) {
  return collapseWhitespace(value, 120).toLowerCase();
}

function normalizeTagIdList(value, options = {}) {
  const deduplicate = options.deduplicate !== false;
  const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : 1_000;
  const result = [];
  const seen = new Set();
  for (const candidate of Array.isArray(value) ? value : []) {
    const id = cleanIdentifier(candidate);
    if (!id || (deduplicate && seen.has(id))) continue;
    seen.add(id);
    result.push(id);
    if (result.length >= limit) break;
  }
  return result;
}

function normalizeContentTagGroup(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = cleanIdentifier(input.id || (typeof options.idFactory === "function" ? options.idFactory("group") : ""));
  const name = collapseWhitespace(input.name, 80);
  if (!id || !name) return null;
  return {
    id,
    name,
    iconKey: cleanIdentifier(input.iconKey, 40) || "folder",
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    deletedAt: isoOrNull(input.deletedAt),
  };
}

function normalizeContentTagGroups(value, options = {}) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((candidate) => normalizeContentTagGroup(candidate, options))
    .filter((group) => {
      if (!group || seen.has(group.id)) return false;
      seen.add(group.id);
      return true;
    })
    .slice(0, 10_000)
    .sort((left, right) =>
      left.sortOrder - right.sortOrder ||
      left.createdAt.localeCompare(right.createdAt) ||
      left.id.localeCompare(right.id));
}

function normalizeContentTag(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = cleanIdentifier(input.id || (typeof options.idFactory === "function" ? options.idFactory("tag") : ""));
  const canonicalName = collapseWhitespace(input.canonicalName, 120);
  if (!id || !canonicalName) return null;
  const requestedGroupId = cleanIdentifier(input.groupId) || null;
  const allowedGroupIds = options.groupIds instanceof Set ? options.groupIds : null;
  return {
    id,
    canonicalName,
    normalizedName: normalizeContentTagName(canonicalName),
    groupId: requestedGroupId && (!allowedGroupIds || allowedGroupIds.has(requestedGroupId))
      ? requestedGroupId
      : null,
    iconKey: cleanIdentifier(input.iconKey, 40) || "tag",
    accentKey: cleanIdentifier(input.accentKey, 40) || "neutral",
    description: cleanText(input.description, 2_000),
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    deletedAt: isoOrNull(input.deletedAt),
  };
}

function normalizeContentTags(value, options = {}) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((candidate) => normalizeContentTag(candidate, options))
    .filter((tag) => {
      if (!tag || seen.has(tag.id)) return false;
      seen.add(tag.id);
      return true;
    })
    .slice(0, 100_000);
}

function normalizeContentTagAlias(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = cleanIdentifier(input.id || (typeof options.idFactory === "function" ? options.idFactory("alias") : ""));
  const tagId = cleanIdentifier(input.tagId);
  const alias = collapseWhitespace(input.alias, 120);
  const allowedTagIds = options.tagIds instanceof Set ? options.tagIds : null;
  if (!id || !tagId || !alias || (allowedTagIds && !allowedTagIds.has(tagId))) return null;
  return {
    id,
    tagId,
    alias,
    normalizedAlias: normalizeContentTagName(alias),
    createdAt: isoOrNull(input.createdAt) || now,
  };
}

function normalizeContentTagAliases(value, options = {}) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((candidate) => normalizeContentTagAlias(candidate, options))
    .filter((alias) => {
      if (!alias || seen.has(alias.id)) return false;
      seen.add(alias.id);
      return true;
    })
    .slice(0, 200_000);
}

function emptyTypeCounts() {
  return Object.fromEntries(CONTENT_TAG_REFERENCE_TYPE_NAMES.map((type) => [type, 0]));
}

function normalizeTypeCounts(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const result = emptyTypeCounts();
  for (const type of CONTENT_TAG_REFERENCE_TYPE_NAMES) {
    const count = Number(input[type]);
    result[type] = Number.isFinite(count) && count > 0 ? Math.trunc(count) : 0;
  }
  return result;
}

function normalizeReverseTagChange(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const id = cleanIdentifier(input.id);
  const before = normalizeContentTag(input.before, options);
  const after = normalizeContentTag(input.after, options);
  if (!id || !before || !after || before.id !== id || after.id !== id) return null;
  return { id, before, after };
}

function normalizeReverseAliasChange(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const id = cleanIdentifier(input.id);
  const before = input.before == null ? null : normalizeContentTagAlias(input.before, options);
  const after = input.after == null ? null : normalizeContentTagAlias(input.after, options);
  if (!id || (!before && !after)) return null;
  if ((before && before.id !== id) || (after && after.id !== id)) return null;
  return { id, before, after };
}

function normalizeReverseReferenceChange(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const objectType = cleanIdentifier(input.objectType, 40);
  const collectionKey = cleanIdentifier(input.collectionKey, 80);
  const objectId = cleanIdentifier(input.objectId);
  if (
    !CONTENT_TAG_REFERENCE_TYPE_NAMES.includes(objectType) ||
    !CONTENT_TAG_REFERENCE_COLLECTIONS.has(collectionKey) ||
    !objectId
  ) return null;
  const descriptor = CONTENT_TAG_REFERENCE_TYPES.find((item) => item.type === objectType);
  if (!descriptor.collectionKeys.includes(collectionKey)) return null;
  return {
    objectType,
    collectionKey,
    objectId,
    beforeTagIds: normalizeTagIdList(input.beforeTagIds, { deduplicate: false }),
    afterTagIds: normalizeTagIdList(input.afterTagIds, { deduplicate: false }),
  };
}

function normalizeContentTagMergeReverseSnapshot(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const tagChanges = (Array.isArray(input.tagChanges) ? input.tagChanges : [])
    .map((candidate) => normalizeReverseTagChange(candidate, options))
    .filter(Boolean)
    .slice(0, 1_000);
  const aliasChanges = (Array.isArray(input.aliasChanges) ? input.aliasChanges : [])
    .map((candidate) => normalizeReverseAliasChange(candidate, options))
    .filter(Boolean)
    .slice(0, 10_000);
  const referenceChanges = (Array.isArray(input.referenceChanges) ? input.referenceChanges : [])
    .map(normalizeReverseReferenceChange)
    .filter(Boolean)
    .slice(0, 500_000);
  if (!tagChanges.length) return null;
  return { tagChanges, aliasChanges, referenceChanges };
}

function normalizeContentTagMergeRecord(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = cleanIdentifier(input.id || (typeof options.idFactory === "function" ? options.idFactory("merge-record") : ""));
  const targetTagId = cleanIdentifier(input.targetTagId);
  const sourceTagIds = normalizeTagIdList(input.sourceTagIds).filter((tagId) => tagId !== targetTagId);
  if (!id || !targetTagId || !sourceTagIds.length) return null;
  const affectedReferenceCount = Number(input.affectedReferenceCount);
  const affectedObjectCount = Number(input.affectedObjectCount);
  return {
    id,
    sourceTagIds,
    targetTagId,
    affectedReferenceCount: Number.isFinite(affectedReferenceCount) && affectedReferenceCount > 0
      ? Math.trunc(affectedReferenceCount)
      : 0,
    affectedObjectCount: Number.isFinite(affectedObjectCount) && affectedObjectCount > 0
      ? Math.trunc(affectedObjectCount)
      : 0,
    affectedByType: normalizeTypeCounts(input.affectedByType),
    affectedReferencesByType: normalizeTypeCounts(input.affectedReferencesByType),
    createdAt: isoOrNull(input.createdAt) || now,
    undoneAt: isoOrNull(input.undoneAt),
    reverseSnapshot: normalizeContentTagMergeReverseSnapshot(input.reverseSnapshot, options),
  };
}

function normalizeContentTagMergeRecords(value, options = {}) {
  const seen = new Set();
  return (Array.isArray(value) ? value : [])
    .map((candidate) => normalizeContentTagMergeRecord(candidate, options))
    .filter((record) => {
      if (!record || seen.has(record.id)) return false;
      seen.add(record.id);
      return true;
    })
    .slice(-10_000);
}

function normalizeContentTagState(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const contentTagGroups = normalizeContentTagGroups(input.contentTagGroups, { now });
  const groupIds = new Set(contentTagGroups.map((group) => group.id));
  const contentTags = normalizeContentTags(input.contentTags, { now, groupIds });
  const tagIds = new Set(contentTags.map((tag) => tag.id));
  return {
    contentTagGroups,
    contentTags,
    contentTagAliases: normalizeContentTagAliases(input.contentTagAliases, { now, tagIds }),
    contentTagMergeRecords: normalizeContentTagMergeRecords(input.contentTagMergeRecords, {
      now,
      groupIds,
      tagIds,
    }),
  };
}

function referenceCollections(state) {
  const collections = [];
  for (const descriptor of CONTENT_TAG_REFERENCE_TYPES) {
    for (const collectionKey of descriptor.collectionKeys) {
      if (Array.isArray(state?.[collectionKey])) {
        collections.push({
          type: descriptor.type,
          collectionKey,
          items: state[collectionKey],
        });
      }
    }
  }
  return collections;
}

function collectContentTagReferences(state, tagIds) {
  const requested = new Set(normalizeTagIdList(tagIds));
  const references = [];
  if (!requested.size) return references;
  for (const collection of referenceCollections(state)) {
    collection.items.forEach((item, index) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return;
      const currentTagIds = normalizeTagIdList(item.tagIds, { deduplicate: false });
      const matchedTagIds = Array.from(new Set(currentTagIds.filter((tagId) => requested.has(tagId))));
      if (!matchedTagIds.length) return;
      references.push({
        objectType: collection.type,
        collectionKey: collection.collectionKey,
        objectId: cleanIdentifier(item.id),
        objectIndex: index,
        tagIds: currentTagIds,
        matchedTagIds,
      });
    });
  }
  return references;
}

function countContentTagReferences(state, tagIds) {
  const requestedTagIds = normalizeTagIdList(Array.isArray(tagIds) ? tagIds : [tagIds]);
  const requested = new Set(requestedTagIds);
  const byType = Object.fromEntries(CONTENT_TAG_REFERENCE_TYPE_NAMES.map((type) => [type, {
    referenceCount: 0,
    objectCount: 0,
  }]));
  const byTagId = Object.fromEntries(requestedTagIds.map((tagId) => [tagId, {
    referenceCount: 0,
    objectCount: 0,
    byType: emptyTypeCounts(),
  }]));
  let referenceCount = 0;
  let objectCount = 0;
  for (const reference of collectContentTagReferences(state, requestedTagIds)) {
    objectCount += 1;
    referenceCount += reference.matchedTagIds.length;
    byType[reference.objectType].objectCount += 1;
    byType[reference.objectType].referenceCount += reference.matchedTagIds.length;
    for (const tagId of reference.matchedTagIds) {
      if (!requested.has(tagId)) continue;
      byTagId[tagId].referenceCount += 1;
      byTagId[tagId].objectCount += 1;
      byTagId[tagId].byType[reference.objectType] += 1;
    }
  }
  return {
    tagIds: requestedTagIds,
    referenceCount,
    objectCount,
    referenceCountsByType: Object.fromEntries(
      CONTENT_TAG_REFERENCE_TYPE_NAMES.map((type) => [type, byType[type].referenceCount]),
    ),
    objectCountsByType: Object.fromEntries(
      CONTENT_TAG_REFERENCE_TYPE_NAMES.map((type) => [type, byType[type].objectCount]),
    ),
    byType,
    byTagId,
  };
}

function parseMergeArguments(sourceOrInput, targetOrOptions, maybeOptions) {
  if (sourceOrInput && typeof sourceOrInput === "object" && !Array.isArray(sourceOrInput)) {
    return {
      sourceTagIds: sourceOrInput.sourceTagIds,
      targetTagId: sourceOrInput.targetTagId,
      options: targetOrOptions && typeof targetOrOptions === "object" ? targetOrOptions : {},
    };
  }
  return {
    sourceTagIds: sourceOrInput,
    targetTagId: targetOrOptions,
    options: maybeOptions && typeof maybeOptions === "object" ? maybeOptions : {},
  };
}

function resolveMergeSelection(state, sourceTagIds, targetTagId, options = {}) {
  const now = isoNow(options.now);
  const groupIds = new Set(normalizeContentTagGroups(state?.contentTagGroups, { now }).map((group) => group.id));
  const tags = normalizeContentTags(state?.contentTags, { now, groupIds });
  const targetId = cleanIdentifier(targetTagId);
  const sourceIds = normalizeTagIdList(sourceTagIds);
  if (!targetId) throw new Error("内容标签合并需要目标标签");
  if (!sourceIds.length) throw new Error("内容标签合并至少需要一个来源标签");
  if (sourceIds.includes(targetId)) throw new Error("不能将内容标签合并到自身");
  const targetTag = tags.find((tag) => tag.id === targetId && !tag.deletedAt);
  if (!targetTag) throw new Error("找不到可用的目标内容标签");
  const sourceTags = sourceIds.map((sourceId) => tags.find((tag) => tag.id === sourceId && !tag.deletedAt));
  if (sourceTags.some((tag) => !tag)) throw new Error("找不到可用的来源内容标签");
  return { sourceTagIds: sourceIds, targetTagId: targetId, sourceTags, targetTag };
}

function previewContentTagMerge(state, sourceOrInput, targetOrOptions, maybeOptions) {
  const parsed = parseMergeArguments(sourceOrInput, targetOrOptions, maybeOptions);
  const selection = resolveMergeSelection(state, parsed.sourceTagIds, parsed.targetTagId, parsed.options);
  const sourceUsage = countContentTagReferences(state, selection.sourceTagIds);
  const targetUsage = countContentTagReferences(state, [selection.targetTagId]);
  return {
    sourceTagIds: selection.sourceTagIds,
    targetTagId: selection.targetTagId,
    sourceTags: cloneValue(selection.sourceTags),
    targetTag: cloneValue(selection.targetTag),
    sourceUsage,
    targetUsage,
    affectedReferenceCount: sourceUsage.referenceCount,
    affectedObjectCount: sourceUsage.objectCount,
    affectedByType: cloneValue(sourceUsage.objectCountsByType),
    affectedReferencesByType: cloneValue(sourceUsage.referenceCountsByType),
  };
}

function replaceMergedTagIds(value, sourceTagIds, targetTagId) {
  const sources = new Set(sourceTagIds);
  const current = normalizeTagIdList(value, { deduplicate: false });
  const targetAlreadyPresent = current.includes(targetTagId);
  let insertedTarget = targetAlreadyPresent;
  const result = [];
  const seen = new Set();
  for (const tagId of current) {
    let nextTagId = tagId;
    if (sources.has(tagId)) {
      if (insertedTarget) continue;
      nextTagId = targetTagId;
      insertedTarget = true;
    }
    if (seen.has(nextTagId)) continue;
    seen.add(nextTagId);
    result.push(nextTagId);
  }
  return result;
}

function createUniqueId(usedIds, idFactory, kind, details = {}) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const candidate = cleanIdentifier(idFactory(kind, { ...details, attempt }));
    if (!candidate || usedIds.has(candidate)) continue;
    usedIds.add(candidate);
    return candidate;
  }
  throw new Error(`无法生成唯一的${kind === "merge-record" ? "合并记录" : "标签别名"}编号`);
}

function sameValue(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function mergeContentTags(state, sourceOrInput, targetOrOptions, maybeOptions) {
  const parsed = parseMergeArguments(sourceOrInput, targetOrOptions, maybeOptions);
  const options = parsed.options;
  const now = isoNow(options.now);
  const preview = previewContentTagMerge(state, parsed.sourceTagIds, parsed.targetTagId, options);
  const next = cloneValue(state && typeof state === "object" ? state : {});
  const normalized = normalizeContentTagState(next, { now });
  Object.assign(next, normalized);

  const sourceIds = new Set(preview.sourceTagIds);
  const sourceTags = next.contentTags.filter((tag) => sourceIds.has(tag.id));
  const targetTag = next.contentTags.find((tag) => tag.id === preview.targetTagId);
  const references = collectContentTagReferences(next, preview.sourceTagIds);
  if (references.some((reference) => !reference.objectId)) {
    throw new Error("存在缺少对象编号的内容标签引用，无法安全合并");
  }

  const referenceChanges = references.map((reference) => ({
    objectType: reference.objectType,
    collectionKey: reference.collectionKey,
    objectId: reference.objectId,
    beforeTagIds: cloneValue(reference.tagIds),
    afterTagIds: replaceMergedTagIds(reference.tagIds, preview.sourceTagIds, preview.targetTagId),
  }));

  const tagChanges = [];
  next.contentTags = next.contentTags.map((tag) => {
    if (!sourceIds.has(tag.id) && tag.id !== preview.targetTagId) return tag;
    const before = cloneValue(tag);
    const after = sourceIds.has(tag.id)
      ? { ...tag, updatedAt: now, deletedAt: now }
      : { ...tag, updatedAt: now };
    tagChanges.push({ id: tag.id, before, after: cloneValue(after) });
    return after;
  });

  const aliasChanges = [];
  next.contentTagAliases = next.contentTagAliases.map((alias) => {
    if (!sourceIds.has(alias.tagId)) return alias;
    const after = { ...alias, tagId: preview.targetTagId };
    aliasChanges.push({ id: alias.id, before: cloneValue(alias), after: cloneValue(after) });
    return after;
  });

  const usedAliasIds = new Set(next.contentTagAliases.map((alias) => alias.id));
  const usedRecordIds = new Set(next.contentTagMergeRecords.map((record) => record.id));
  const idFactory = typeof options.idFactory === "function" ? options.idFactory : () => randomUUID();
  const targetAliasKeys = new Set(next.contentTagAliases
    .filter((alias) => alias.tagId === preview.targetTagId)
    .map((alias) => `${alias.normalizedAlias}\u0000${alias.alias}`));
  for (const sourceTag of sourceTags) {
    const aliasKey = `${sourceTag.normalizedName}\u0000${sourceTag.canonicalName}`;
    if (targetAliasKeys.has(aliasKey)) continue;
    const alias = normalizeContentTagAlias({
      id: createUniqueId(usedAliasIds, idFactory, "alias", {
        sourceTagId: sourceTag.id,
        targetTagId: targetTag.id,
      }),
      tagId: targetTag.id,
      alias: sourceTag.canonicalName,
      createdAt: now,
    }, { now, tagIds: new Set(next.contentTags.map((tag) => tag.id)) });
    next.contentTagAliases.push(alias);
    aliasChanges.push({ id: alias.id, before: null, after: cloneValue(alias) });
    targetAliasKeys.add(aliasKey);
  }

  for (const change of referenceChanges) {
    const collection = next[change.collectionKey];
    const objectIndex = collection.findIndex((item) => cleanIdentifier(item?.id) === change.objectId);
    if (objectIndex < 0) throw new Error("内容标签引用在合并期间发生变化");
    collection[objectIndex] = { ...collection[objectIndex], tagIds: cloneValue(change.afterTagIds) };
  }

  const requestedRecordId = cleanIdentifier(options.recordId);
  if (requestedRecordId && usedRecordIds.has(requestedRecordId)) throw new Error("内容标签合并记录编号已存在");
  const recordId = requestedRecordId || createUniqueId(usedRecordIds, idFactory, "merge-record", {
    sourceTagIds: preview.sourceTagIds,
    targetTagId: preview.targetTagId,
  });
  const record = normalizeContentTagMergeRecord({
    id: recordId,
    sourceTagIds: preview.sourceTagIds,
    targetTagId: preview.targetTagId,
    affectedReferenceCount: preview.affectedReferenceCount,
    affectedObjectCount: preview.affectedObjectCount,
    affectedByType: preview.affectedByType,
    affectedReferencesByType: preview.affectedReferencesByType,
    createdAt: now,
    undoneAt: null,
    reverseSnapshot: { tagChanges, aliasChanges, referenceChanges },
  }, {
    now,
    groupIds: new Set(next.contentTagGroups.map((group) => group.id)),
    tagIds: new Set(next.contentTags.map((tag) => tag.id)),
  });
  if (!record?.reverseSnapshot) throw new Error("无法创建完整的内容标签合并撤销快照");
  next.contentTagMergeRecords.push(record);
  next.updatedAt = now;
  return { state: next, record: cloneValue(record), preview };
}

function findLatestActiveMergeRecord(records) {
  let latest = null;
  let latestIndex = -1;
  (records || []).forEach((record, index) => {
    if (record.undoneAt) return;
    if (!latest || record.createdAt > latest.createdAt || (record.createdAt === latest.createdAt && index > latestIndex)) {
      latest = record;
      latestIndex = index;
    }
  });
  return { record: latest, index: latestIndex };
}

function undoLastContentTagMerge(state, options = {}) {
  const now = isoNow(options.now);
  const next = cloneValue(state && typeof state === "object" ? state : {});
  const normalized = normalizeContentTagState(next, { now });
  Object.assign(next, normalized);
  const latest = findLatestActiveMergeRecord(next.contentTagMergeRecords);
  if (!latest.record) throw new Error("没有可撤销的内容标签合并");
  const snapshot = latest.record.reverseSnapshot;
  if (!snapshot) throw new Error("最近的内容标签合并缺少撤销快照");

  const force = options.force === true;
  for (const change of snapshot.tagChanges) {
    const current = next.contentTags.find((tag) => tag.id === change.id);
    if (!current) throw new Error("内容标签已不存在，无法无损撤销合并");
    if (!force && !sameValue(current, change.after)) throw new Error("内容标签在合并后已变化，无法无损撤销");
  }
  for (const change of snapshot.aliasChanges) {
    const current = next.contentTagAliases.find((alias) => alias.id === change.id) || null;
    if (!force && !sameValue(current, change.after)) throw new Error("内容标签别名在合并后已变化，无法无损撤销");
  }
  for (const change of snapshot.referenceChanges) {
    const collection = next[change.collectionKey];
    if (!Array.isArray(collection)) throw new Error("内容标签关联对象集合已不存在，无法无损撤销");
    const current = collection.find((item) => cleanIdentifier(item?.id) === change.objectId);
    if (!current) throw new Error("内容标签关联对象已不存在，无法无损撤销");
    const currentTagIds = normalizeTagIdList(current.tagIds, { deduplicate: false });
    if (!force && !sameValue(currentTagIds, change.afterTagIds)) {
      throw new Error("内容标签关联在合并后已变化，无法无损撤销");
    }
  }

  for (const change of snapshot.tagChanges) {
    const index = next.contentTags.findIndex((tag) => tag.id === change.id);
    next.contentTags[index] = cloneValue(change.before);
  }
  for (const change of snapshot.aliasChanges) {
    const index = next.contentTagAliases.findIndex((alias) => alias.id === change.id);
    if (change.before == null) {
      if (index >= 0) next.contentTagAliases.splice(index, 1);
    } else if (index >= 0) {
      next.contentTagAliases[index] = cloneValue(change.before);
    } else {
      next.contentTagAliases.push(cloneValue(change.before));
    }
  }
  for (const change of snapshot.referenceChanges) {
    const collection = next[change.collectionKey];
    const index = collection.findIndex((item) => cleanIdentifier(item?.id) === change.objectId);
    collection[index] = { ...collection[index], tagIds: cloneValue(change.beforeTagIds) };
  }
  next.contentTagMergeRecords[latest.index] = {
    ...next.contentTagMergeRecords[latest.index],
    undoneAt: now,
  };
  next.updatedAt = now;
  return {
    state: next,
    record: cloneValue(next.contentTagMergeRecords[latest.index]),
  };
}

module.exports = {
  CONTENT_TAG_REFERENCE_TYPES,
  countContentTagReferences,
  mergeContentTags,
  mergeContentTagsInState: mergeContentTags,
  normalizeContentTag,
  normalizeContentTagAlias,
  normalizeContentTagAliases,
  normalizeContentTagGroup,
  normalizeContentTagGroups,
  normalizeContentTagMergeRecord,
  normalizeContentTagMergeRecords,
  normalizeContentTagMergeReverseSnapshot,
  normalizeContentTagName,
  normalizeTagIdList,
  normalizeContentTags,
  normalizeContentTagState,
  previewContentTagMerge,
  undoContentTagMerge: undoLastContentTagMerge,
  undoLastContentTagMerge,
  undoLastContentTagMergeInState: undoLastContentTagMerge,
};
