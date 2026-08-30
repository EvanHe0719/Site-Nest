const test = require("node:test");
const assert = require("node:assert/strict");

const {
  UsageTracker,
  normalizeUsageDayAggregates,
} = require("../../electron/usage/index.cjs");

function localTime(day, hour = 12, minute = 0, second = 0) {
  return new Date(2026, 7, day, hour, minute, second).valueOf();
}

test("usage accrues only while enabled, foreground, non-idle and non-automation", () => {
  let now = localTime(3);
  const tracker = new UsageTracker({ now: () => now, maxAccrualGapMs: 60_000 });
  tracker.setForeground(true, now);
  now += 10_000;
  tracker.tick(now);
  assert.equal(tracker.recordMeaningfulAction(now), true);

  tracker.setIdle(true, now);
  now += 10_000;
  tracker.tick(now);
  assert.equal(tracker.recordMeaningfulAction(now), false);

  tracker.setIdle(false, now);
  now += 5_000;
  tracker.tick(now);
  tracker.setBackgroundAutomation(true, now);
  now += 10_000;
  tracker.tick(now);
  assert.equal(tracker.recordMeaningfulAction(now), false);

  tracker.setBackgroundAutomation(false, now);
  tracker.setEnabled(false, now);
  now += 10_000;
  tracker.tick(now);
  assert.equal(tracker.recordMeaningfulAction(now), false);

  const [day] = tracker.snapshot();
  assert.equal(day.foregroundActiveSeconds, 15);
  assert.equal(day.meaningfulActionCount, 1);
  assert.equal(day.activeSessionCount, 2);
  assert.ok(day.firstActiveAt);
  assert.ok(day.lastActiveAt);
});

test("long gaps are capped so suspend or missed idle signals cannot inflate usage", () => {
  let now = localTime(3);
  const tracker = new UsageTracker({ now: () => now, maxAccrualGapMs: 30_000 });
  tracker.setForeground(true, now);
  now += 10 * 60_000;
  tracker.tick(now);
  assert.equal(tracker.snapshot()[0].foregroundActiveSeconds, 30);
});

test("flushIfDue batches writes and clear persists an empty replacement", async () => {
  let now = localTime(3);
  const writes = [];
  const tracker = new UsageTracker({
    now: () => now,
    foreground: true,
    flushIntervalMs: 60_000,
    maxAccrualGapMs: 60_000,
    onFlush: async (aggregates, metadata) => writes.push({ aggregates, metadata }),
  });
  tracker.recordMeaningfulAction(now);
  now += 30_000;
  assert.equal((await tracker.flushIfDue(now)).flushed, false);
  now += 30_000;
  assert.equal((await tracker.flushIfDue(now)).flushed, true);
  assert.equal(writes.length, 1);
  assert.equal(writes[0].aggregates[0].foregroundActiveSeconds, 60);
  assert.equal(writes[0].metadata.replace, true);

  tracker.clear(now);
  const cleared = await tracker.flush(now);
  assert.equal(cleared.flushed, true);
  assert.equal(cleared.cleared, true);
  assert.deepEqual(writes[1].aggregates, []);
  assert.equal(writes[1].metadata.cleared, true);
});

test("normalization keeps one aggregate per local date without collecting content", () => {
  const normalized = normalizeUsageDayAggregates([
    {
      localDate: "2026-08-03",
      foregroundActiveSeconds: 10,
      meaningfulActionCount: 2,
      activeSessionCount: 1,
      firstActiveAt: "2026-08-03T01:00:00Z",
      lastActiveAt: "2026-08-03T01:00:10Z",
      updatedAt: "2026-08-03T01:00:10Z",
      typedText: "must not survive",
    },
    {
      localDate: "2026-08-03",
      foregroundActiveSeconds: 20,
      meaningfulActionCount: 3,
      activeSessionCount: 2,
      firstActiveAt: "2026-08-03T02:00:00Z",
      lastActiveAt: "2026-08-03T02:00:20Z",
      updatedAt: "2026-08-03T02:00:20Z",
    },
    { localDate: "invalid" },
  ]);
  assert.equal(normalized.length, 1);
  assert.equal(normalized[0].foregroundActiveSeconds, 20);
  assert.deepEqual(Object.keys(normalized[0]), [
    "localDate",
    "foregroundActiveSeconds",
    "meaningfulActionCount",
    "activeSessionCount",
    "firstActiveAt",
    "lastActiveAt",
    "updatedAt",
  ]);
});
