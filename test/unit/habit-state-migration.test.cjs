const test = require("node:test");
const assert = require("node:assert/strict");

const {
  CURRENT_SCHEMA_VERSION,
  createInitialState,
  migrateState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-31T00:00:00.000Z";

test("schema 15 retains empty habit and usage collections without creating fake goals", () => {
  const state = createInitialState({ now: NOW, defaultSites: [] });
  assert.equal(CURRENT_SCHEMA_VERSION, 15);
  assert.deepEqual(state.habits, []);
  assert.deepEqual(state.habitCheckIns, []);
  assert.deepEqual(state.habitReminders, []);
  assert.deepEqual(state.rewardLedger, []);
  assert.deepEqual(state.usageDayAggregates, []);
  assert.equal(state.uiSettings.usageTrackingEnabled, true);
});

test("v10 migrates directly to schema 15 and stays idempotent with local-date habit history", () => {
  const raw = {
    version: 10,
    createdAt: NOW,
    habits: [{
      id: "reading",
      name: "阅读",
      workspaceId: "personal",
      status: "active",
      frequencyType: "daily",
      startDate: "2026-08-01",
      reminderTime: "20:30",
    }],
    habitCheckIns: [{
      id: "reading-aug-30",
      habitId: "reading",
      localDate: "2026-08-30",
      state: "completed",
      note: "本地日期不得漂移",
      createdAt: NOW,
      updatedAt: NOW,
    }],
    rewardLedger: [{
      id: "reward-reading-aug-30",
      rewardType: "habitCompletionStar",
      sourceType: "habitCheckIn",
      sourceId: "reading-aug-30",
      checkInId: "reading-aug-30",
      habitId: "reading",
      localDate: "2026-08-30",
      amount: 1,
      createdAt: NOW,
    }],
    usageDayAggregates: [{
      localDate: "2026-08-30",
      foregroundActiveSeconds: 90,
      meaningfulActionCount: 3,
      activeSessionCount: 1,
      updatedAt: NOW,
      typedText: "must be dropped",
    }],
  };
  const once = migrateState(raw, { now: NOW });
  assert.equal(once.state.version, 15);
  assert.equal(once.state.habits[0].reminderTime, "20:30");
  assert.equal(once.state.habitCheckIns[0].localDate, "2026-08-30");
  assert.equal(once.state.rewardLedger[0].amount, 1);
  assert.equal(Object.hasOwn(once.state.usageDayAggregates[0], "typedText"), false);
  const twice = migrateState(once.state, { now: "2030-01-01T00:00:00.000Z" });
  assert.equal(twice.changed, false);
  assert.deepEqual(twice.state, once.state);
});
