const assert = require("node:assert/strict");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  BrowserExtensionManager,
  inspectExtensionDirectory,
  manifestPermissions,
  validateManifest,
} = require("../../electron/browser/extension-manager.cjs");

async function createFixture(root, manifest = {}) {
  await fsp.mkdir(root, { recursive: true });
  await fsp.writeFile(path.join(root, "manifest.json"), JSON.stringify({
    manifest_version: 3,
    name: "Fixture extension",
    version: "1.2.3",
    permissions: ["storage", "tabs"],
    host_permissions: ["https://example.com/*"],
    action: { default_popup: "popup.html" },
    ...manifest,
  }), "utf8");
  await fsp.writeFile(path.join(root, "popup.html"), "<!doctype html><title>fixture</title>", "utf8");
}

test("extension manifest review accepts MV2/MV3 and deduplicates declared page permissions", async (t) => {
  const root = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-extension-review-"));
  t.after(() => fsp.rm(root, { recursive: true, force: true }));
  await createFixture(root, {
    content_scripts: [{ matches: ["https://example.com/*", "https://other.test/*"], js: ["content.js"] }],
  });
  const review = await inspectExtensionDirectory(root);
  assert.equal(review.name, "Fixture extension");
  assert.equal(review.manifestVersion, 3);
  assert.match(review.storageKey, /^[a-f0-9]{24}$/);
  assert.deepEqual(review.permissions, [
    "https://example.com/*",
    "https://other.test/*",
    "storage",
    "tabs",
  ]);
  assert.throws(() => validateManifest({ manifest_version: 4, name: "x", version: "1" }), /Manifest V2 或 Manifest V3/);
  assert.deepEqual(manifestPermissions({ permissions: ["storage", "storage"] }), ["storage"]);
});

test("manager copies locally, restores by profile, toggles and removes without touching the source", async (t) => {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-extension-manager-"));
  const source = path.join(temp, "source");
  const managed = path.join(temp, "managed");
  t.after(() => fsp.rm(temp, { recursive: true, force: true }));
  await createFixture(source);
  const loaded = new Map();
  const fakeSession = {
    extensions: {
      async loadExtension(installedPath) {
        const extension = { id: "abcdefghijklmnopabcdefghijklmnop", name: "Fixture extension" };
        loaded.set(extension.id, { ...extension, path: installedPath });
        return extension;
      },
      removeExtension(id) { loaded.delete(id); },
      getExtension(id) { return loaded.get(id); },
    },
  };
  const calls = [];
  const layer = {
    addTab: (...args) => calls.push(["add", ...args]),
    removeTab: (...args) => calls.push(["remove", ...args]),
    selectTab: (...args) => calls.push(["select", ...args]),
  };
  const manager = new BrowserExtensionManager({ rootDirectory: managed, allowedProfileIds: ["default"] });
  await manager.attachSession("default", fakeSession, layer);
  let snapshot = await manager.importDirectory("default", source);
  assert.equal(snapshot.extensions[0].status, "loaded");
  assert.equal(snapshot.extensions[0].enabled, true);
  assert.equal(await fsp.readFile(path.join(source, "popup.html"), "utf8"), "<!doctype html><title>fixture</title>");

  snapshot = await manager.setEnabled("default", snapshot.extensions[0].id, false);
  assert.equal(snapshot.extensions[0].status, "disabled");
  snapshot = await manager.setEnabled("default", snapshot.extensions[0].id, true);
  assert.equal(snapshot.extensions[0].status, "loaded");
  const tab = { isDestroyed: () => false };
  manager.addTab("default", tab, {});
  manager.selectTab("default", tab);
  manager.removeTab("default", tab);
  assert.deepEqual(calls.map((call) => call[0]), ["add", "select", "remove"]);
  snapshot = await manager.remove("default", snapshot.extensions[0].id);
  assert.equal(snapshot.extensions.length, 0);
  await fsp.access(path.join(source, "manifest.json"));
});

test("manager rejects unsupported profiles and extension trees containing links", async (t) => {
  const temp = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-extension-links-"));
  t.after(() => fsp.rm(temp, { recursive: true, force: true }));
  const source = path.join(temp, "source");
  await createFixture(source);
  const target = path.join(temp, "target.txt");
  await fsp.writeFile(target, "outside", "utf8");
  let linkCreated = true;
  try {
    await fsp.symlink(target, path.join(source, "linked.txt"));
  } catch {
    linkCreated = false;
  }
  const manager = new BrowserExtensionManager({ rootDirectory: path.join(temp, "managed"), allowedProfileIds: ["default"] });
  assert.throws(() => manager.assertProfile("sap"), /不支持扩展/);
  if (linkCreated) {
    const fakeSession = {
      extensions: { loadExtension: async () => ({ id: "abcdefghijklmnopabcdefghijklmnop" }), getExtension: () => null },
    };
    await manager.attachSession("default", fakeSession, { addTab() {}, removeTab() {}, selectTab() {} });
    await assert.rejects(() => manager.importDirectory("default", source), /符号链接/);
  }
});
