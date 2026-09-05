const assert = require("node:assert/strict");
const test = require("node:test");
const { DailyCheckinScheduler, CHECKIN_DEFINITIONS, normalizeCheckin, isDue } = require("../../electron/automations/checkins.cjs");

function harness(overrides = {}) {
  let now = new Date(2026, 8, 5, 8, 30);
  const state = { automations: Object.fromEntries(CHECKIN_DEFINITIONS.map((definition) => [definition.id, normalizeCheckin({}, definition)])) };
  state.automations.nodeseek.enabled = true;
  const calls = [];
  let saved;
  const scheduler = new DailyCheckinScheduler({
    getState: async () => state,
    save: async () => { saved = JSON.parse(JSON.stringify(state)); },
    publish: () => {}, now: () => now,
    runners: Object.fromEntries(CHECKIN_DEFINITIONS.map(({ id }) => [id, async () => { calls.push(id); return { status: "success", message: "confirmed" }; }])),
    ...overrides,
  });
  return { scheduler, state, calls, saved: () => saved, setNow: (value) => { now = value; } };
}

test("each registered check-in has independent daily time, with NodeSeek opt-in and legacy migration", async () => {
  const h = harness();
  assert.equal(normalizeCheckin({}, CHECKIN_DEFINITIONS[1]).enabled, false);
  assert.equal(normalizeCheckin({ time: "25:00", status: "running" }, CHECKIN_DEFINITIONS[0]).time, "08:30");
  await h.scheduler.update("nodeseek", { time: "10:15" });
  assert.equal(h.saved().automations.nodeseek.time, "10:15");
  assert.equal(h.state.automations.naixi.time, "08:30");
  await h.scheduler.tick();
  assert.deepEqual(h.calls, ["naixi"]);
  h.setNow(new Date(2026, 8, 5, 10, 15));
  await h.scheduler.tick();
  assert.deepEqual(h.calls, ["naixi", "nodeseek"]);
  assert.equal(h.state.automations.nodeseek.runs.length, 1);
});

test("after start/resume only today's due jobs run once; restart and repeated ticks cannot duplicate success", async () => {
  const h = harness();
  h.setNow(new Date(2026, 8, 7, 23, 59));
  await Promise.all([h.scheduler.tick(), h.scheduler.tick()]);
  await h.scheduler.tick();
  assert.deepEqual(h.calls, ["naixi", "nodeseek"]);
  assert.equal(h.state.automations.naixi.lastSuccessDate, "2026-09-07");
  assert.equal(isDue(h.saved().automations.naixi, new Date(2026, 8, 7, 23, 59)), false);
  h.setNow(new Date(2026, 8, 8, 8, 29));
  await h.scheduler.tick();
  assert.equal(h.calls.length, 2);
  h.setNow(new Date(2026, 8, 8, 8, 30));
  await h.scheduler.tick();
  assert.equal(h.calls.length, 4);
});

test("failed login is logged once automatically but permits explicit manual retry", async () => {
  let attempts = 0;
  const h = harness({ runners: { naixi: async () => { attempts += 1; return { status: "needs-login", message: "login" }; }, nodeseek: async () => ({ status: "needs-action" }) } });
  await h.scheduler.tick();
  await h.scheduler.tick();
  assert.equal(attempts, 1);
  assert.equal(h.state.automations.naixi.lastSuccessDate, undefined);
  assert.equal(isDue(h.saved().automations.naixi, new Date(2026, 8, 5, 12)), false);
  await h.scheduler.run("naixi", { manual: true });
  assert.equal(attempts, 2);
  assert.equal(h.state.automations.naixi.runs.length, 2);
});

test("disabled schedules do not run; invalid ids and settings fail before mutation", async () => {
  const h = harness();
  await h.scheduler.update("nodeseek", { enabled: false });
  await h.scheduler.tick();
  assert.deepEqual(h.calls, ["naixi"]);
  for (const time of ["", "9:30", "24:00", "09:60", 830]) await assert.rejects(h.scheduler.update("naixi", { time }));
  await assert.rejects(h.scheduler.update("naixi", { enabled: "true" }));
  assert.throws(() => h.scheduler.run("__proto__"));
  await assert.rejects(h.scheduler.update("unknown", { time: "09:00" }));
  assert.equal(h.state.automations.naixi.time, "08:30");
});

test("concurrent manual clicks share one operation and settings changed mid-run survive", async () => {
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  const h = harness({ runners: { naixi: () => pending, nodeseek: () => pending } });
  const first = h.scheduler.run("nodeseek", { manual: true });
  assert.equal(h.scheduler.run("nodeseek", { manual: true }), first);
  await h.scheduler.update("nodeseek", { enabled: false, time: "11:00" });
  release({ status: "success", enabled: true, time: "01:00" });
  await first;
  assert.equal(h.state.automations.nodeseek.enabled, false);
  assert.equal(h.state.automations.nodeseek.time, "11:00");
  assert.equal(h.state.automations.nodeseek.runs.length, 1);
  await h.scheduler.run("nodeseek", { manual: true });
  assert.equal(h.state.automations.nodeseek.runs.length, 1);
});

test("a future registered adapter reuses settings, scheduler and logs without site-specific code", async () => {
  const definition = { id: "future", enabled: true };
  const state = { automations: { future: normalizeCheckin({}, definition) } };
  const h = harness({ definitions: [definition], getState: async () => state, runners: { future: async () => ({ status: "success" }) } });
  await h.scheduler.update("future", { time: "08:00" });
  await h.scheduler.tick();
  assert.equal(state.automations.future.lastSuccessDate, "2026-09-05");
  assert.equal(state.automations.future.runs.length, 1);
  h.scheduler.stop();
  await assert.rejects(h.scheduler.run("future", { manual: true }));
});
