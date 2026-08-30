const { randomUUID } = require("node:crypto");
const { sanitizeDirectUrlForHistory } = require("../browser/search-service.cjs");

const TIMELINE_EVENT_TYPES = new Set([
  "achievement",
  "turningPoint",
  "responsibility",
  "projectMilestone",
  "decision",
  "growth",
  "personalEvent",
  "challenge",
  "other",
]);
const TIMELINE_DATE_PRECISIONS = new Set(["day", "month", "year"]);
const TIMELINE_IMPORTANCE = new Set(["normal", "important", "major"]);
const TIMELINE_IMPACT_DIRECTIONS = new Set(["positive", "neutral", "negative"]);
const TIMELINE_VIEW_MODES = new Set(["timeline", "list"]);
const DEFAULT_TIMELINE_TRACKS = Object.freeze([
  Object.freeze({
    id: "work",
    name: "工作线",
    type: "work",
    iconKey: "grid",
    sortOrder: 0,
    isSystem: true,
  }),
  Object.freeze({
    id: "personal",
    name: "个人线",
    type: "personal",
    iconKey: "home",
    sortOrder: 1,
    isSystem: true,
  }),
]);

function cloneValue(value) {
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

function safeString(value, limit = 5000, trim = false) {
  const text = String(value || "");
  return (trim ? text.trim() : text).slice(0, limit);
}

function safeIdentifier(value, limit = 120) {
  return safeString(value, limit, true).replace(/[^a-zA-Z0-9:._-]/g, "-");
}

function normalizeTimelineDate(value, precision = "day") {
  const text = safeString(value, 10, true);
  if (!text) return null;
  if (precision === "year") {
    const match = text.match(/^(\d{4})/);
    const year = Number(match?.[1]);
    return year >= 1 && year <= 9999 ? String(year).padStart(4, "0") : null;
  }
  if (precision === "month") {
    const match = text.match(/^(\d{4})-(\d{1,2})/);
    const year = Number(match?.[1]);
    const month = Number(match?.[2]);
    if (year < 1 || year > 9999 || month < 1 || month > 12) return null;
    return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}`;
  }
  const match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const probe = new Date(Date.UTC(year, month - 1, day));
  if (
    year < 1 || year > 9999 ||
    probe.getUTCFullYear() !== year ||
    probe.getUTCMonth() !== month - 1 ||
    probe.getUTCDate() !== day
  ) return null;
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function timelineYear(value) {
  const match = safeString(value, 10, true).match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function timelineMonth(value) {
  const match = safeString(value, 10, true).match(/^\d{4}-(\d{2})/);
  return match ? Number(match[1]) : 1;
}

function normalizeTimelineTrack(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = safeIdentifier(input.id, 80);
  const name = safeString(input.name, 80, true);
  if (!id || !name) return null;
  return {
    id,
    name,
    type: safeIdentifier(input.type || id, 40) || "custom",
    iconKey: safeIdentifier(input.iconKey || "route", 40) || "route",
    sortOrder: Number.isFinite(Number(input.sortOrder)) ? Number(input.sortOrder) : 0,
    isSystem: input.isSystem === true,
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
  };
}

function normalizeTimelineTracks(value, options = {}) {
  const now = isoNow(options.now);
  const byId = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const track = normalizeTimelineTrack(candidate, { now });
    if (track && !byId.has(track.id)) byId.set(track.id, track);
  }
  for (const definition of DEFAULT_TIMELINE_TRACKS) {
    const previous = byId.get(definition.id);
    byId.set(definition.id, normalizeTimelineTrack({
      ...(previous || {}),
      ...definition,
      createdAt: previous?.createdAt || now,
      updatedAt: previous?.updatedAt || now,
    }, { now }));
  }
  return Array.from(byId.values())
    .filter(Boolean)
    .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
    .slice(0, 100);
}

function sanitizeTimelineSourceUrl(value) {
  if (!value) return null;
  return sanitizeDirectUrlForHistory(value);
}

function normalizeTimelineEvent(value, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const now = isoNow(options.now);
  const id = safeIdentifier(input.id || randomUUID(), 120);
  const trackIds = new Set(options.trackIds || ["work", "personal"]);
  const workspaceIds = new Set(options.workspaceIds || ["personal", "work", "research"]);
  const trackId = trackIds.has(String(input.trackId || ""))
    ? String(input.trackId)
    : trackIds.has(options.defaultTrackId) ? options.defaultTrackId : "personal";
  const workspaceId = workspaceIds.has(String(input.workspaceId || ""))
    ? String(input.workspaceId)
    : workspaceIds.has(options.defaultWorkspaceId) ? options.defaultWorkspaceId : "personal";
  const title = safeString(input.title, 300, true);
  if (!id || !title || !trackIds.has(trackId) || !workspaceIds.has(workspaceId)) return null;
  const datePrecision = TIMELINE_DATE_PRECISIONS.has(input.datePrecision)
    ? input.datePrecision
    : "day";
  const startDate = normalizeTimelineDate(input.startDate, datePrecision);
  if (!startDate) return null;
  const ongoing = input.ongoing === true;
  let endDate = ongoing ? null : normalizeTimelineDate(input.endDate, datePrecision);
  if (endDate && endDate.localeCompare(startDate) < 0) endDate = null;
  const sourceUrl = sanitizeTimelineSourceUrl(input.sourceUrl);
  let sourceHostname = safeString(input.sourceHostname, 255, true).toLowerCase();
  if (sourceUrl) {
    try { sourceHostname = new URL(sourceUrl).hostname.toLowerCase(); } catch { sourceHostname = ""; }
  }
  return {
    id,
    trackId,
    workspaceId,
    type: TIMELINE_EVENT_TYPES.has(input.type) ? input.type : "other",
    title,
    summary: safeString(input.summary, 5000),
    background: safeString(input.background, 5000),
    action: safeString(input.action, 5000),
    result: safeString(input.result, 5000),
    impact: safeString(input.impact, 5000),
    evidence: safeString(input.evidence, 5000),
    startDate,
    endDate,
    datePrecision,
    ongoing,
    impactDirection: TIMELINE_IMPACT_DIRECTIONS.has(input.impactDirection)
      ? input.impactDirection
      : "neutral",
    impactLevel: Math.max(1, Math.min(5, Math.trunc(Number(input.impactLevel) || 1))),
    importance: TIMELINE_IMPORTANCE.has(input.importance) ? input.importance : "normal",
    tagIds: Array.from(new Set((Array.isArray(input.tagIds) ? input.tagIds : [])
      .map((item) => safeIdentifier(item, 120))
      .filter(Boolean))).slice(0, 100),
    tags: Array.from(new Set((Array.isArray(input.tags) ? input.tags : [])
      .map((item) => safeString(item, 60, true))
      .filter(Boolean))).slice(0, 30),
    relatedTaskIds: Array.from(new Set((Array.isArray(input.relatedTaskIds) ? input.relatedTaskIds : [])
      .map((item) => safeIdentifier(item, 120))
      .filter(Boolean))).slice(0, 100),
    sourceType: safeIdentifier(input.sourceType || "manual", 40) || "manual",
    sourceId: safeString(input.sourceId, 200, true) || null,
    sourceTitle: safeString(input.sourceTitle, 300, true) || null,
    sourceUrl,
    sourceHostname: sourceHostname || null,
    iconKey: safeIdentifier(input.iconKey || "route", 40) || "route",
    accentKey: safeIdentifier(input.accentKey || "neutral", 40) || "neutral",
    createdAt: isoOrNull(input.createdAt) || now,
    updatedAt: isoOrNull(input.updatedAt) || now,
    deletedAt: isoOrNull(input.deletedAt),
  };
}

function normalizeTimelineEvents(value, options = {}) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.map((candidate) => normalizeTimelineEvent(candidate, options))
    .filter((event) => {
      if (!event || seen.has(event.id)) return false;
      seen.add(event.id);
      return true;
    })
    .slice(0, 50_000);
}

function normalizeTimelineUiSettings(value = {}, options = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const currentYear = Number(options.currentYear) || new Date().getFullYear();
  const year = Number(input.selectedYear);
  const typeFilter = input.typeFilter === "all" || TIMELINE_EVENT_TYPES.has(input.typeFilter)
    ? input.typeFilter
    : "all";
  const legacyYear = Number.isInteger(year) && year >= 1 && year <= 9999 ? year : currentYear;
  const selectedTrackId = ["work", "personal"].includes(input.selectedTrackId)
    ? input.selectedTrackId
    : ["work", "personal"].includes(input.lastTrackId) ? input.lastTrackId : "personal";
  const normalizeTrackView = (trackId) => {
    const candidate = input.trackViews?.[trackId] && typeof input.trackViews[trackId] === "object"
      ? input.trackViews[trackId]
      : {};
    const candidateYear = Number(candidate.selectedYear);
    const candidateMonth = Number(candidate.selectedMonth);
    return {
      selectedYear: Number.isInteger(candidateYear) && candidateYear >= 1 && candidateYear <= 9999
        ? candidateYear
        : legacyYear,
      selectedMonth: Number.isInteger(candidateMonth) && candidateMonth >= 1 && candidateMonth <= 12
        ? candidateMonth
        : null,
      scope: candidate.scope === "month" ? "month" : "year",
      zoom: Math.max(0.75, Math.min(2.5, Number(candidate.zoom) || 1)),
    };
  };
  const trackViews = {
    work: normalizeTrackView("work"),
    personal: normalizeTrackView("personal"),
  };
  return {
    viewMode: TIMELINE_VIEW_MODES.has(input.viewMode) ? input.viewMode : "timeline",
    selectedYear: trackViews[selectedTrackId].selectedYear,
    selectedTrackId,
    trackViews,
    typeFilter,
    search: safeString(input.search, 200, true),
    lastTrackId: selectedTrackId,
  };
}

function timelineEventsForYear(events, year, options = {}) {
  const selectedYear = Number(year);
  const query = safeString(options.search, 200, true).toLocaleLowerCase("zh-CN");
  const trackIds = options.trackIds ? new Set(options.trackIds) : null;
  const type = options.type && options.type !== "all" ? options.type : null;
  return (Array.isArray(events) ? events : [])
    .filter((event) => {
      if (event.deletedAt) return false;
      const startYear = timelineYear(event.startDate);
      const endYear = timelineYear(event.endDate);
      return startYear === selectedYear || (
        startYear < selectedYear && (event.ongoing || (endYear && endYear >= selectedYear))
      );
    })
    .filter((event) => !trackIds || trackIds.has(event.trackId))
    .filter((event) => !type || event.type === type)
    .filter((event) => !query || [
      event.title,
      event.summary,
      event.background,
      event.action,
      event.result,
      event.impact,
      event.evidence,
      event.sourceTitle,
      event.sourceHostname,
      ...(event.tags || []),
    ].join(" ").toLocaleLowerCase("zh-CN").includes(query))
    .sort((left, right) => right.startDate.localeCompare(left.startDate) || Date.parse(right.updatedAt) - Date.parse(left.updatedAt));
}

function stateForTimelineMutation(state, options = {}) {
  const next = cloneValue(state);
  next.timelineTracks = normalizeTimelineTracks(next.timelineTracks, options);
  next.timelineEvents = normalizeTimelineEvents(next.timelineEvents, {
    ...options,
    trackIds: next.timelineTracks.map((track) => track.id),
    workspaceIds: next.workspaces.map((workspace) => workspace.id),
    defaultWorkspaceId: next.activeWorkspaceId,
  });
  next.timelineUiSettings = normalizeTimelineUiSettings(next.timelineUiSettings, options);
  return next;
}

function addTimelineEventToState(state, input, options = {}) {
  const next = stateForTimelineMutation(state, options);
  const now = isoNow(options.now);
  const event = normalizeTimelineEvent({
    ...(input || {}),
    id: input?.id || randomUUID(),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }, {
    now,
    trackIds: next.timelineTracks.map((track) => track.id),
    workspaceIds: next.workspaces.map((workspace) => workspace.id),
    defaultWorkspaceId: next.activeWorkspaceId,
    defaultTrackId: input?.trackId || next.timelineUiSettings.lastTrackId,
  });
  if (!event) throw new Error("时间轴记录缺少有效的标题、日期、轨道或空间");
  if (next.timelineEvents.some((item) => item.id === event.id)) throw new Error("时间轴记录 ID 已存在");
  next.timelineEvents.push(event);
  next.timelineUiSettings.lastTrackId = event.trackId;
  next.timelineUiSettings.selectedTrackId = event.trackId;
  next.timelineUiSettings.trackViews[event.trackId].selectedYear = timelineYear(event.startDate);
  next.timelineUiSettings.selectedYear = timelineYear(event.startDate);
  next.updatedAt = now;
  return { state: next, event };
}

function updateTimelineEventInState(state, input, options = {}) {
  const next = stateForTimelineMutation(state, options);
  const now = isoNow(options.now);
  const id = safeIdentifier(input?.id, 120);
  const index = next.timelineEvents.findIndex((event) => event.id === id && !event.deletedAt);
  if (index < 0) throw new Error("找不到指定时间轴记录");
  const event = normalizeTimelineEvent({
    ...next.timelineEvents[index],
    ...(input || {}),
    id,
    createdAt: next.timelineEvents[index].createdAt,
    updatedAt: now,
    deletedAt: null,
  }, {
    now,
    trackIds: next.timelineTracks.map((track) => track.id),
    workspaceIds: next.workspaces.map((workspace) => workspace.id),
    defaultWorkspaceId: next.activeWorkspaceId,
  });
  if (!event) throw new Error("时间轴记录内容无效");
  next.timelineEvents[index] = event;
  next.timelineUiSettings.lastTrackId = event.trackId;
  next.timelineUiSettings.selectedTrackId = event.trackId;
  next.timelineUiSettings.trackViews[event.trackId].selectedYear = timelineYear(event.startDate);
  next.timelineUiSettings.selectedYear = timelineYear(event.startDate);
  next.updatedAt = now;
  return { state: next, event };
}

function deleteTimelineEventFromState(state, eventId, options = {}) {
  const next = stateForTimelineMutation(state, options);
  const now = isoNow(options.now);
  const id = safeIdentifier(eventId, 120);
  const index = next.timelineEvents.findIndex((event) => event.id === id && !event.deletedAt);
  if (index < 0) throw new Error("找不到指定时间轴记录");
  next.timelineEvents[index] = { ...next.timelineEvents[index], updatedAt: now, deletedAt: now };
  next.updatedAt = now;
  return { state: next, event: next.timelineEvents[index] };
}

function updateTimelineUiSettingsInState(state, patch, options = {}) {
  const next = stateForTimelineMutation(state, options);
  const now = isoNow(options.now);
  const selectedTrackId = ["work", "personal"].includes(patch?.selectedTrackId)
    ? patch.selectedTrackId
    : next.timelineUiSettings.selectedTrackId;
  const trackViews = {
    ...(next.timelineUiSettings.trackViews || {}),
    ...(patch?.trackViews || {}),
  };
  if (patch?.selectedYear !== undefined && !patch?.trackViews?.[selectedTrackId]) {
    trackViews[selectedTrackId] = {
      ...(trackViews[selectedTrackId] || {}),
      selectedYear: patch.selectedYear,
    };
  }
  next.timelineUiSettings = normalizeTimelineUiSettings({
    ...next.timelineUiSettings,
    ...(patch || {}),
    trackViews,
  }, options);
  next.updatedAt = now;
  return { state: next, timelineUiSettings: next.timelineUiSettings };
}

class TimelineSearchIndex {
  constructor() {
    this.documents = new Map();
  }

  upsert(event) {
    if (!event?.id) return;
    if (event.deletedAt) {
      this.documents.delete(event.id);
      return;
    }
    this.documents.set(event.id, {
      event: cloneValue(event),
      text: [
        event.title,
        event.summary,
        event.background,
        event.action,
        event.result,
        event.impact,
        event.evidence,
        event.sourceTitle,
        event.sourceHostname,
        ...(event.tags || []),
      ].join(" ").toLocaleLowerCase("zh-CN"),
    });
  }

  replace(events) {
    this.documents.clear();
    for (const event of Array.isArray(events) ? events : []) this.upsert(event);
    return this;
  }

  search(query, limit = 20) {
    const normalized = safeString(query, 200, true).toLocaleLowerCase("zh-CN");
    if (!normalized) return [];
    return Array.from(this.documents.values())
      .filter((document) => document.text.includes(normalized))
      .sort((left, right) => Date.parse(right.event.updatedAt) - Date.parse(left.event.updatedAt))
      .slice(0, Math.max(1, Math.min(100, Number(limit) || 20)))
      .map((document) => cloneValue(document.event));
  }
}

module.exports = {
  DEFAULT_TIMELINE_TRACKS,
  TIMELINE_DATE_PRECISIONS,
  TIMELINE_EVENT_TYPES,
  TIMELINE_IMPORTANCE,
  TIMELINE_IMPACT_DIRECTIONS,
  TimelineSearchIndex,
  addTimelineEventToState,
  deleteTimelineEventFromState,
  normalizeTimelineDate,
  normalizeTimelineEvent,
  normalizeTimelineEvents,
  normalizeTimelineTrack,
  normalizeTimelineTracks,
  normalizeTimelineUiSettings,
  sanitizeTimelineSourceUrl,
  timelineEventsForYear,
  timelineMonth,
  timelineYear,
  updateTimelineEventInState,
  updateTimelineUiSettingsInState,
};
