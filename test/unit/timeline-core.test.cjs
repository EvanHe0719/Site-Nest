const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CURRENT_SCHEMA_VERSION,
  createInitialState,
  migrateState,
} = require("../../electron/state-model.cjs");
const {
  TimelineSearchIndex,
  addTimelineEventToState,
  buildAnnualReview,
  buildTimelineJsonExport,
  buildTimelineMarkdown,
  buildTimelineSvgExport,
  buildTimelineWaveform,
  deleteTimelineEventFromState,
  normalizeTimelineDate,
  sanitizeTimelineSourceUrl,
  timelineEventsForYear,
  updateTimelineEventInState,
  updateTimelineUiSettingsInState,
} = require("../../electron/timeline/index.cjs");

const NOW = "2026-08-31T01:00:00.000Z";

function state() {
  return createInitialState({ now: NOW, defaultSites: [] });
}

function event(overrides = {}) {
  return {
    trackId: "work",
    workspaceId: "work",
    type: "achievement",
    title: "完成跨系统售后分诊台",
    startDate: "2026-08-30",
    datePrecision: "day",
    importance: "important",
    ...overrides,
  };
}

test("current schema preserves work and personal timeline tracks exactly once", () => {
  const initial = state();
  assert.equal(CURRENT_SCHEMA_VERSION, 16);
  assert.deepEqual(initial.timelineTracks.map((track) => track.id), ["work", "personal"]);
  assert.deepEqual(initial.timelineEvents, []);
  assert.equal(initial.timelineUiSettings.selectedYear, 2026);

  const duplicated = {
    ...initial,
    timelineTracks: [...initial.timelineTracks, ...initial.timelineTracks],
  };
  const once = migrateState(duplicated, { now: NOW }).state;
  const twice = migrateState(once, { now: "2030-01-01T00:00:00.000Z" }).state;
  assert.deepEqual(once.timelineTracks.map((track) => track.id), ["work", "personal"]);
  assert.deepEqual(twice.timelineTracks.map((track) => track.id), ["work", "personal"]);
});

test("day, month and year precision plus ongoing ranges are normalized", () => {
  assert.equal(normalizeTimelineDate("2026-08-31", "day"), "2026-08-31");
  assert.equal(normalizeTimelineDate("2026-08", "month"), "2026-08");
  assert.equal(normalizeTimelineDate("2026", "year"), "2026");
  assert.equal(normalizeTimelineDate("2026-02-31", "day"), null);

  let current = state();
  const day = addTimelineEventToState(current, event(), { now: NOW });
  current = day.state;
  const month = addTimelineEventToState(current, event({
    title: "负责售后部门管理",
    type: "responsibility",
    startDate: "2026-03",
    datePrecision: "month",
    ongoing: true,
  }), { now: NOW });
  current = month.state;
  const year = addTimelineEventToState(current, event({
    trackId: "personal",
    workspaceId: "personal",
    title: "年度成长主题",
    type: "growth",
    startDate: "2026",
    datePrecision: "year",
  }), { now: NOW });
  assert.equal(day.event.startDate, "2026-08-30");
  assert.equal(month.event.startDate, "2026-03");
  assert.equal(month.event.ongoing, true);
  assert.equal(month.event.endDate, null);
  assert.equal(year.event.startDate, "2026");
  assert.equal(year.event.trackId, "personal");
});

test("year selection, view mode, track filter and text search are deterministic", () => {
  let current = state();
  current = addTimelineEventToState(current, event({ title: "工作成就", tags: ["SAP"] }), { now: NOW }).state;
  current = addTimelineEventToState(current, event({
    title: "个人成长",
    trackId: "personal",
    workspaceId: "personal",
    type: "growth",
    tags: ["阅读"],
  }), { now: NOW }).state;
  current = updateTimelineUiSettingsInState(current, {
    selectedYear: 2025,
    viewMode: "list",
    selectedTrackId: "personal",
    trackViews: { personal: { selectedYear: 2025, selectedMonth: 8, scope: "month", zoom: 1.5 } },
    typeFilter: "growth",
    search: "阅读",
  }, { currentYear: 2026 }).state;
  assert.equal(current.timelineUiSettings.selectedYear, 2025);
  assert.equal(current.timelineUiSettings.viewMode, "list");
  assert.equal(current.timelineUiSettings.selectedTrackId, "personal");
  assert.equal(current.timelineUiSettings.trackViews.personal.scope, "month");
  assert.equal(current.timelineUiSettings.trackViews.work.selectedYear, 2026);
  const matched = timelineEventsForYear(current.timelineEvents, 2026, {
    trackIds: ["personal"],
    type: "growth",
    search: "阅读",
  });
  assert.deepEqual(matched.map((item) => item.title), ["个人成长"]);
});

test("ongoing events remain visible in later years and deleted events do not", () => {
  let current = state();
  const added = addTimelineEventToState(current, event({
    startDate: "2024-03",
    datePrecision: "month",
    ongoing: true,
  }), { now: NOW });
  current = added.state;
  assert.equal(timelineEventsForYear(current.timelineEvents, 2026).length, 1);
  const removed = deleteTimelineEventFromState(current, added.event.id, { now: "2026-09-01T00:00:00Z" });
  assert.ok(removed.event.deletedAt);
  assert.equal(timelineEventsForYear(removed.state.timelineEvents, 2026).length, 0);
});

test("completed tasks can be linked manually without affecting task counts", () => {
  const initial = state();
  initial.localTasks = [{
    id: "task-done",
    title: "完成客户升级",
    notes: "结果已确认",
    workspaceId: "work",
    status: "done",
    priority: "high",
    startAt: null,
    dueAt: null,
    allDay: false,
    reminderOffsets: [],
    tags: [],
    orderKey: "1",
    timeZone: "Asia/Shanghai",
    createdAt: NOW,
    updatedAt: NOW,
    completedAt: NOW,
  }];
  const beforePending = initial.localTasks.filter((item) => !["done", "cancelled"].includes(item.status)).length;
  const added = addTimelineEventToState(initial, event({
    title: initial.localTasks[0].title,
    summary: initial.localTasks[0].notes,
    relatedTaskIds: ["task-done"],
    sourceType: "task",
    sourceId: "task-done",
  }), { now: NOW });
  const afterPending = added.state.localTasks.filter((item) => !["done", "cancelled"].includes(item.status)).length;
  assert.deepEqual(added.event.relatedTaskIds, ["task-done"]);
  assert.equal(beforePending, 0);
  assert.equal(afterPending, 0);
});

test("web page sources remove authentication data and keep business parameters", () => {
  const sanitized = sanitizeTimelineSourceUrl(
    "https://support.example.com/ticket?id=12831&token=secret&CODE=oauth&session=s1#auth=bad",
  );
  const parsed = new URL(sanitized);
  assert.equal(parsed.searchParams.get("id"), "12831");
  assert.equal(parsed.searchParams.has("token"), false);
  assert.equal(parsed.searchParams.has("CODE"), false);
  assert.equal(parsed.searchParams.has("session"), false);
  assert.equal(parsed.hash, "");
});

test("annual review and Markdown export use only stored facts", () => {
  let current = state();
  current = addTimelineEventToState(current, event({
    title: "重大里程碑",
    summary: "按期完成",
    importance: "major",
  }), { now: NOW }).state;
  const events = timelineEventsForYear(current.timelineEvents, 2026);
  const review = buildAnnualReview(2026, current.timelineTracks, events);
  assert.equal(review.stats.total, 1);
  assert.equal(review.stats.work, 1);
  assert.equal(review.stats.major, 1);
  assert.match(review.text, /重大里程碑/);
  const markdown = buildTimelineMarkdown({ year: 2026, tracks: current.timelineTracks, events, exportedAt: NOW });
  assert.match(markdown, /^# 2026 年时间轴/);
  assert.match(markdown, /按期完成/);
});

test("timeline-export-v1 is stable and strips executable presentation content", () => {
  let current = state();
  current = addTimelineEventToState(current, event({
    title: "<script>alert(1)</script>安全复盘",
    summary: "<b>纯文本</b>",
    iconKey: "route",
    accentKey: "work",
  }), { now: NOW }).state;
  const exported = buildTimelineJsonExport({
    year: 2026,
    tracks: current.timelineTracks,
    events: timelineEventsForYear(current.timelineEvents, 2026),
    exportedAt: NOW,
    appVersion: "0.5.5",
    schemaVersion: CURRENT_SCHEMA_VERSION,
  });
  assert.equal(exported.exportVersion, "timeline-export-v1");
  assert.equal(exported.appVersion, "0.5.5");
  assert.equal(exported.schemaVersion, 16);
  assert.equal(exported.events[0].eventType, "achievement");
  assert.equal(exported.events[0].impactDirection, "neutral");
  assert.equal(exported.events[0].impactLevel, 1);
  assert.equal(exported.events[0].title, "alert(1)安全复盘");
  assert.equal(exported.events[0].summary, "纯文本");
  assert.deepEqual(Object.keys(exported.events[0].presentation), ["iconKey", "accentKey", "emphasis"]);
  assert.equal(Object.hasOwn(exported.events[0], "html"), false);
  assert.equal(Object.hasOwn(exported.events[0], "javascript"), false);
});

test("work and personal waveforms are independent and use deterministic direction and level", () => {
  let current = state();
  current = addTimelineEventToState(current, event({
    id: "work-up",
    startDate: "2026-03-15",
    impactDirection: "positive",
    impactLevel: 5,
  }), { now: NOW }).state;
  current = addTimelineEventToState(current, event({
    id: "work-down",
    startDate: "2026-09-15",
    impactDirection: "negative",
    impactLevel: 4,
  }), { now: NOW }).state;
  current = addTimelineEventToState(current, event({
    id: "personal-flat",
    trackId: "personal",
    workspaceId: "personal",
    startDate: "2026-03-15",
    impactDirection: "neutral",
    impactLevel: 5,
  }), { now: NOW }).state;
  const work = buildTimelineWaveform(current.timelineEvents, { trackId: "work", year: 2026 });
  const personal = buildTimelineWaveform(current.timelineEvents, { trackId: "personal", year: 2026 });
  assert.deepEqual(work.clusters.flatMap((cluster) => cluster.events.map((item) => item.id)).sort(), ["work-down", "work-up"]);
  assert.deepEqual(personal.clusters.flatMap((cluster) => cluster.events.map((item) => item.id)), ["personal-flat"]);
  assert.ok(Math.max(...work.samples.map((sample) => sample.value)) >= 4.9);
  assert.ok(Math.min(...work.samples.map((sample) => sample.value)) <= -3.9);
  assert.equal(Math.max(...personal.samples.map((sample) => Math.abs(sample.value))), 0);
});

test("single events return to baseline while ongoing events form a platform", () => {
  let current = state();
  current = addTimelineEventToState(current, event({
    id: "single",
    startDate: "2026-02-10",
    impactDirection: "positive",
    impactLevel: 3,
  }), { now: NOW }).state;
  current = addTimelineEventToState(current, event({
    id: "ongoing",
    startDate: "2026-06-01",
    ongoing: true,
    impactDirection: "negative",
    impactLevel: 2,
  }), { now: NOW }).state;
  const waveform = buildTimelineWaveform(current.timelineEvents, { trackId: "work", year: 2026 });
  assert.equal(waveform.samples[0].value, 0);
  assert.equal(waveform.samples.at(-1).value, -2);
  assert.ok(waveform.samples.some((sample) => sample.value === 3));
});

test("monthly waveform uses real day positions and SVG export is inert", () => {
  let current = state();
  current = addTimelineEventToState(current, event({
    startDate: "2026-08-31",
    impactDirection: "positive",
    impactLevel: 2,
  }), { now: NOW }).state;
  const month = buildTimelineWaveform(current.timelineEvents, { trackId: "work", year: 2026, month: 8, scope: "month" });
  assert.equal(month.scope, "month");
  assert.ok(month.clusters[0].position > 0.99);
  const svg = buildTimelineSvgExport({ year: 2026, month: 8, scope: "month", trackId: "work", tracks: current.timelineTracks, events: current.timelineEvents });
  assert.match(svg, /^<\?xml/);
  assert.match(svg, /<path d="M/);
  assert.doesNotMatch(svg, /<script|javascript:/i);
});

test("timeline search index updates incrementally after edits and deletions", () => {
  let current = state();
  const added = addTimelineEventToState(current, event({ title: "SAP 项目上线" }), { now: NOW });
  current = added.state;
  const index = new TimelineSearchIndex().replace(current.timelineEvents);
  assert.equal(index.search("SAP")[0].id, added.event.id);
  const updated = updateTimelineEventInState(current, { id: added.event.id, title: "Zoho 分诊上线" }, { now: "2026-09-01T00:00:00Z" });
  index.upsert(updated.event);
  assert.equal(index.search("SAP").length, 0);
  assert.equal(index.search("Zoho")[0].id, added.event.id);
  const removed = deleteTimelineEventFromState(updated.state, added.event.id, { now: "2026-09-02T00:00:00Z" });
  index.upsert(removed.event);
  assert.equal(index.search("Zoho").length, 0);
});
