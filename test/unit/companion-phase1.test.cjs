const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const {
  COMPANION_STATES,
  COMPANION_WIDGET_WORLD_ID,
  CompanionStateMachine,
  RightPanelCoordinator,
  companionWidgetInstallScript,
} = require("../../electron/companion/index.cjs");

test("companion state machine exposes exactly the six approved states and central guards", () => {
  assert.deepEqual(COMPANION_STATES, ["idle", "focusedDocked", "resting", "bubbleTip", "expanded", "silentHidden"]);
  const machine = new CompanionStateMachine({ enabled: false, state: "idle" }, { now: () => new Date("2026-09-02T08:00:00.000Z") });
  assert.equal(machine.transition("focus").state, "silentHidden");
  assert.equal(machine.transition("enable").state, "idle");
  assert.equal(machine.transition("focus").state, "focusedDocked");
  assert.equal(machine.transition("tip", { quiet: true }).state, "focusedDocked");
  assert.equal(machine.transition("expand", { panel: "assistant" }).panel, "assistant");
  assert.equal(machine.transition("disable").state, "silentHidden");
});

test("right panel coordinator never leaves page actions and companion open together", () => {
  const coordinator = new RightPanelCoordinator();
  assert.deepEqual(coordinator.open("page-actions"), { activePanel: "page-actions", closedPanel: null });
  assert.deepEqual(coordinator.open("companion"), { activePanel: "companion", closedPanel: "page-actions" });
  assert.deepEqual(coordinator.close("companion"), { activePanel: null, closedPanel: "companion" });
});

test("companion orb floats inside the isolated webpage without taking Shell layout width", () => {
  const root = path.resolve(__dirname, "..", "..");
  const html = fs.readFileSync(path.join(root, "renderer", "index.html"), "utf8");
  const css = fs.readFileSync(path.join(root, "renderer", "styles.css"), "utf8");
  const main = fs.readFileSync(path.join(root, "electron", "main.cjs"), "utf8");
  const widget = companionWidgetInstallScript({ settings: { enabled: true } });
  assert.equal(COMPANION_WIDGET_WORLD_ID, 1002);
  assert.doesNotMatch(html, /id="companionEdgeRail"|id="companionDock"/);
  assert.doesNotMatch(css, /grid-template-columns:\s*minmax\(0, 1fr\) 60px/);
  assert.match(widget, /position: 'fixed'/);
  assert.match(widget, /right: '18px'/);
  assert.match(widget, /bottom: '18px'/);
  assert.match(widget, /attachShadow\(\{ mode: 'closed' \}\)/);
  assert.match(main, /executeJavaScriptInIsolatedWorld\(\s*COMPANION_WIDGET_WORLD_ID/);
});
