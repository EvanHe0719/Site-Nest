const assert = require("node:assert/strict");
const test = require("node:test");

const {
  monthSegments,
  normalizeColor,
  normalizeRecurrence,
  occurrencesForWeek,
} = require("../../renderer/task-calendar.js");

function localIso(year, month, day, hour = 0, minute = 0) {
  return new Date(year, month - 1, day, hour, minute).toISOString();
}

test("a multi-day schedule is rendered once on every overlapping week day", () => {
  const task = {
    id: "range",
    title: "跨日安排",
    startAt: localIso(2026, 9, 1, 9),
    dueAt: localIso(2026, 9, 10, 18),
    recurrence: { frequency: "none" },
  };
  const week = occurrencesForWeek([task], new Date(2026, 8, 3));
  const counts = [...week.entriesByDay.values()].map((items) => items.length);
  assert.deepEqual(counts, [0, 1, 1, 1, 1, 1, 1]);
});

test("a September 1-10 schedule becomes continuous month bars split only by week rows", () => {
  const task = {
    id: "range",
    title: "九月项目",
    startAt: localIso(2026, 9, 1),
    dueAt: localIso(2026, 9, 10, 23, 59),
  };
  const layout = monthSegments([task], new Date(2026, 8, 1));
  assert.equal(layout.segments.length, 2);
  assert.deepEqual(layout.segments.map(({ row, startColumn, span }) => ({ row, startColumn, span })), [
    { row: 0, startColumn: 1, span: 6 },
    { row: 1, startColumn: 0, span: 4 },
  ]);
});

test("weekly recurrence follows selected weekdays and an optional end date", () => {
  const task = {
    id: "friday",
    title: "周五复盘",
    startAt: localIso(2026, 9, 4, 16),
    dueAt: localIso(2026, 9, 4, 17),
    recurrence: { frequency: "weekly", weekdays: [5], until: localIso(2026, 9, 18, 23, 59) },
  };
  const layout = monthSegments([task], new Date(2026, 8, 1));
  assert.deepEqual(layout.segments.map((item) => item.occurrence.start.getDate()), [4, 11, 18]);
});

test("calendar input normalization accepts only safe colors and bounded recurrence fields", () => {
  assert.equal(normalizeColor("#6DD3B0"), "#6dd3b0");
  assert.equal(normalizeColor("url(javascript:1)"), "#23a783");
  assert.deepEqual(normalizeRecurrence({ frequency: "custom", interval: 0, weekdays: [5, 5, 8], customUnit: "week" }).weekdays, [5]);
  assert.equal(normalizeRecurrence({ frequency: "custom", interval: 0 }).interval, 1);
});
