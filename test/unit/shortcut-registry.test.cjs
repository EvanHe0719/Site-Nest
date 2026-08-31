const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { createUIActionRegistry } = require("../../electron/ui-actions/index.cjs");
const {
  ShortcutDispatcher,
  ShortcutRegistry,
  displayAccelerator,
  electronInputAccelerator,
  normalizeAccelerator,
  validateAccelerator,
} = require("../../electron/shortcuts/index.cjs");

function emptyState() {
  return { shortcutProfiles: [], shortcutBindings: [] };
}

test("shortcut settings are generated only from real UIActionRegistry actions and grouped", () => {
  const actions = createUIActionRegistry();
  const registry = new ShortcutRegistry(actions, { platform: "win32" });
  const snapshot = registry.snapshot(emptyState());
  assert.equal(snapshot.platform, "windows");
  assert.ok(snapshot.bindings.length >= 20);
  assert.ok(snapshot.categories.includes("全局与搜索"));
  assert.ok(snapshot.categories.includes("页签与页签组"));
  assert.equal(snapshot.bindings.every((binding) => actions.has(binding.actionId)), true);
  assert.equal(snapshot.bindings.some((binding) => binding.actionId === "download.center.fake"), false);
});

test("accelerators normalize Mod per platform and reject unsafe or editing combinations", () => {
  assert.equal(normalizeAccelerator("shift+ctrl+k"), "Ctrl+Shift+K");
  assert.equal(normalizeAccelerator("mod+shift+k"), "Mod+Shift+K");
  assert.equal(displayAccelerator("Mod+K", "windows"), "Ctrl+K");
  assert.equal(displayAccelerator("Mod+K", "macos"), "Cmd+K");
  assert.throws(() => validateAccelerator("A"), { code: "SHORTCUT_MODIFIER_REQUIRED" });
  assert.throws(() => validateAccelerator("Alt+F4"), { code: "SHORTCUT_SYSTEM_RESERVED" });
  assert.throws(() => validateAccelerator("Mod+C"), { code: "SHORTCUT_EDITING_RESERVED" });
  assert.equal(validateAccelerator("F6"), "F6");
  assert.equal(electronInputAccelerator({ type: "keyDown", key: "k", control: true, shift: true }, "windows"), "Mod+Shift+K");
  assert.equal(electronInputAccelerator({ type: "keyDown", key: "k", meta: true }, "macos"), "Mod+K");
  assert.equal(electronInputAccelerator({ type: "keyUp", key: "k", control: true }, "windows"), "");
});

test("conflicts require an explicit replacement and profiles stay platform-specific", () => {
  const actions = createUIActionRegistry();
  const registry = new ShortcutRegistry(actions, { platform: "windows" });
  const conflict = registry.updateState(emptyState(), {
    actionId: "settings.open",
    accelerator: "Mod+K",
    platform: "windows",
  });
  assert.equal(conflict.requiresResolution, true);
  assert.equal(conflict.conflicts[0].actionId, "search.open");

  const replaced = registry.updateState(emptyState(), {
    actionId: "settings.open",
    accelerator: "Mod+K",
    platform: "windows",
    replaceConflict: true,
  });
  const windows = registry.snapshot(replaced.state, "windows");
  const macos = registry.snapshot(replaced.state, "macos");
  assert.equal(windows.bindings.find((item) => item.actionId === "search.open").enabled, false);
  assert.equal(windows.bindings.find((item) => item.actionId === "settings.open").accelerator, "Mod+K");
  assert.equal(macos.bindings.find((item) => item.actionId === "search.open").enabled, true);
  assert.equal(macos.bindings.find((item) => item.actionId === "settings.open").accelerator, "Mod+,");
});

test("ShortcutDispatcher authorizes through UIActionRegistry instead of reimplementing action availability", async () => {
  const actions = createUIActionRegistry();
  const registry = new ShortcutRegistry(actions, { platform: "windows" });
  const dispatcher = new ShortcutDispatcher(registry, actions);
  assert.deepEqual(await dispatcher.authorize(emptyState(), { actionId: "search.open", platform: "windows" }), {
    ok: true,
    actionId: "search.open",
    scope: "app",
  });
  assert.equal((await dispatcher.authorize(emptyState(), {
    actionId: "search.open",
    accelerator: "Mod+L",
    platform: "windows",
  })).errorCode, "SHORTCUT_BINDING_MISMATCH");
  assert.equal((await dispatcher.authorize(emptyState(), { actionId: "unknown", platform: "windows" })).ok, false);
});

test("settings UI supports grouped search, recording, conflict check, reset, and narrow IPC", () => {
  const root = path.resolve(__dirname, "../..");
  const html = fs.readFileSync(path.join(root, "renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(root, "renderer/app.js"), "utf8");
  const preload = fs.readFileSync(path.join(root, "electron/preload.cjs"), "utf8");
  assert.match(html, /data-settings-section="shortcuts"/);
  assert.match(html, /id="shortcutSearchInput"/);
  assert.match(html, /id="shortcutCategoryFilter"/);
  assert.match(html, /id="shortcutModifiedOnly"/);
  assert.match(html, /id="resetAllShortcuts"/);
  assert.match(renderer, /captureShortcutKey/);
  assert.match(renderer, /dispatchShortcut/);
  assert.match(preload, /shortcuts:update/);
  assert.match(preload, /shortcuts:trigger/);
  assert.doesNotMatch(preload, /globalShortcut/);
});
