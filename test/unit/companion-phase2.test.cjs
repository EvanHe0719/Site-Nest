const assert = require("node:assert/strict");
const test = require("node:test");
const { CompanionRuntimeService, quietReason, WellnessEngine } = require("../../electron/companion/index.cjs");

test("quiet policy covers hours, fullscreen, sharing, background and site silence", () => {
  const date = new Date("2026-09-02T23:15:00");
  assert.equal(quietReason({ quietHours: { enabled: true, start: "22:00", end: "07:00" } }, { foreground: true }, date), "quiet-hours");
  assert.equal(quietReason({}, { foreground: true, fullscreen: true }, date), "fullscreen");
  assert.equal(quietReason({}, { foreground: true, screenSharing: true }, date), "screen-sharing");
  assert.equal(quietReason({ silentSites: ["desk.zoho.com.cn"] }, { foreground: true, hostname: "desk.zoho.com.cn" }, date), "silent-site");
});

test("wellness acknowledgements are runtime cooldowns and never create habits or stars", () => {
  let now = 0;
  const engine = new WellnessEngine({ intervalsMinutes: { water: 5 }, kinds: { "eye-rest": false, movement: false } }, { now: () => now });
  now = 5 * 60_000;
  assert.equal(engine.due(0, now).kind, "water");
  assert.equal(engine.acknowledge("water", now), true);
  assert.equal(engine.due(0, now + 1_000), null);
  assert.equal("rewardLedger" in engine, false);
});

test("single runtime scheduler focuses, reminds, rests and hides without collecting input content", () => {
  let now = Date.parse("2026-09-02T08:00:00.000Z");
  let idle = 0;
  const context = { foreground: true, minimized: false, locked: false, sleeping: false };
  const service = new CompanionRuntimeService({
    now: () => now,
    getIdleSeconds: () => idle,
    getContext: () => context,
    settings: { enabled: true, focusDockSeconds: 20, wellness: { intervalsMinutes: { "eye-rest": 5, water: 45, movement: 60 } } },
  });
  service.tick();
  now += 21_000;
  assert.equal(service.tick().state, "focusedDocked");
  now += 5 * 60_000;
  const reminder = service.tick();
  assert.equal(reminder.state, "bubbleTip");
  assert.equal(reminder.reminder.kind, "eye-rest");
  idle = 121;
  assert.equal(service.tick().state, "resting");
  context.fullscreen = true;
  assert.equal(service.tick().state, "silentHidden");
  assert.equal("keyContent" in service.snapshot(), false);
});
