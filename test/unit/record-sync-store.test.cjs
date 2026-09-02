const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  RecordSyncStore,
  buildSyncEntities,
} = require("../../electron/sync/index.cjs");

function tempDatabase(name) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `qiye-${name}-`));
  return { directory, filePath: path.join(directory, "site-nest.db") };
}

function stateFixture() {
  return {
    version: 17,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    workspaces: [{ id: "work", name: "工作", updatedAt: "2026-09-01T00:00:00.000Z" }],
    sites: [{
      id: "site-1",
      workspaceId: "work",
      name: "Zoho",
      url: "https://example.com/tickets/1?access_token=never-sync&view=open",
      updatedAt: "2026-09-01T00:00:00.000Z",
    }],
    localTasks: [{
      id: "task-1",
      title: "回复客户",
      updatedAt: "2026-09-01T00:00:00.000Z",
    }],
    browserProfiles: [{ id: "default", partition: "persist:qiye-sites", cookie: "secret" }],
    uiSettings: { googleSync: { sites: true, plans: true, settings: true } },
  };
}

test("SQLite primary state and record outbox commit atomically with sanitized payloads", () => {
  const temp = tempDatabase("record-store");
  const store = new RecordSyncStore(temp.filePath, { deviceName: "A", schemaVersion: 17 });
  try {
    const initial = stateFixture();
    store.initialize(initial);
    assert.equal(store.pendingOperations().length, 0, "migration seed must not invent changes");

    const changed = structuredClone(initial);
    changed.sites[0].name = "Zoho Desk";
    changed.sites[0].updatedAt = "2026-09-01T01:00:00.000Z";
    const committed = store.commitState(changed);
    const pending = store.pendingOperations();

    assert.equal(committed.changeCount, 1);
    assert.equal(pending.length, 1);
    assert.equal(pending[0].operation, "update");
    assert.equal(pending[0].payload.name, "Zoho Desk");
    assert.equal(pending[0].payload.url, "https://example.com/tickets/1?view=open");
    assert.equal(JSON.stringify(pending).includes("never-sync"), false);

    const row = store.db.prepare("SELECT state_json FROM app_state WHERE id='primary'").get();
    assert.equal(JSON.parse(row.state_json).sites[0].name, "Zoho Desk");
  } finally {
    store.close();
    fs.rmSync(temp.directory, { recursive: true, force: true });
  }
});

test("remote operations are idempotent, deletions create tombstones, and concurrent tasks become record conflicts", () => {
  const leftTemp = tempDatabase("left");
  const rightTemp = tempDatabase("right");
  const left = new RecordSyncStore(leftTemp.filePath, { deviceName: "A", schemaVersion: 17 });
  const right = new RecordSyncStore(rightTemp.filePath, { deviceName: "B", schemaVersion: 17 });
  try {
    const base = stateFixture();
    left.initialize(base);
    right.initialize(base);

    const leftChanged = structuredClone(base);
    leftChanged.sites[0].name = "支持入口";
    leftChanged.sites[0].updatedAt = "2026-09-01T02:00:00.000Z";
    left.commitState(leftChanged);
    const siteOperation = left.pendingOperations().find((item) => item.entityType === "site");
    const first = right.applyRemoteOperations([siteOperation], { batchId: "batch-a" });
    const second = right.applyRemoteOperations([siteOperation], { batchId: "batch-a" });
    assert.equal(first.appliedCount, 1);
    assert.equal(second.appliedCount, 0);
    assert.equal(first.state.sites[0].name, "支持入口");

    const rightChanged = structuredClone(first.state);
    rightChanged.localTasks[0].title = "B 设备编辑";
    rightChanged.localTasks[0].updatedAt = "2026-09-01T03:00:00.000Z";
    right.commitState(rightChanged);
    const leftTaskChanged = structuredClone(leftChanged);
    leftTaskChanged.localTasks[0].title = "A 设备编辑";
    leftTaskChanged.localTasks[0].updatedAt = "2026-09-01T04:00:00.000Z";
    left.commitState(leftTaskChanged);
    const taskOperation = left.pendingOperations().filter((item) => item.entityType === "task").at(-1);
    const conflict = right.applyRemoteOperations([taskOperation], { batchId: "batch-task" });
    assert.equal(conflict.conflictCount, 1);
    assert.equal(right.listConflicts()[0].entityId, "task-1");

    const deleted = structuredClone(leftTaskChanged);
    deleted.sites = [];
    left.commitState(deleted);
    assert.equal(
      left.db.prepare("SELECT COUNT(*) count FROM sync_tombstones WHERE entity_type='site' AND entity_id='site-1'").get().count,
      1,
    );
  } finally {
    left.close();
    right.close();
    fs.rmSync(leftTemp.directory, { recursive: true, force: true });
    fs.rmSync(rightTemp.directory, { recursive: true, force: true });
  }
});

test("sync entity allowlist excludes browser identity, cookies, tokens, and user-script source", () => {
  const state = stateFixture();
  state.userScripts = [{
    id: "script-1",
    name: "metadata only",
    code: "fetch('https://secret.invalid')",
    source: "authorization=Bearer secret",
    updatedAt: "2026-09-01T00:00:00.000Z",
  }];
  const entities = buildSyncEntities(state);
  const serialized = JSON.stringify(Array.from(entities.values()));
  assert.equal(serialized.includes("persist:qiye-sites"), false);
  assert.equal(serialized.includes("cookie"), false);
  assert.equal(serialized.includes("Bearer secret"), false);
  assert.equal(serialized.includes("secret.invalid"), false);
  assert.equal(entities.has("userScriptMetadata:script-1"), true);
});

test("settings sync carries DeepSeek public preferences but never its API key", () => {
  const state = stateFixture();
  state.uiSettings.translation = {
    providerId: "openai-compatible",
    publicConfig: {
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-chat",
      apiKey: "must-not-sync",
    },
    sourceLanguage: "auto",
    targetLanguage: "zh-CN",
    defaultMode: "bilingual",
    selectionButtonEnabled: true,
    shortSelectionPronunciationMode: "pronunciation-with-explanation",
    shortSelectionMaxCharacters: 8,
    siteRules: [],
    apiKey: "must-not-sync-either",
  };
  const entity = buildSyncEntities(state).get("applicationSetting:shared");
  assert.equal(entity.payload.translation.publicConfig.baseUrl, "https://api.deepseek.com/");
  assert.equal(entity.payload.translation.publicConfig.model, "deepseek-chat");
  const serialized = JSON.stringify(entity.payload.translation);
  assert.equal(serialized.includes("must-not-sync"), false);
  assert.equal(/apiKey|api_key/i.test(serialized), false);
});

test("shortcut profiles and bindings persist in SQLite and sync as individual platform records", () => {
  const temp = tempDatabase("shortcut-store");
  const store = new RecordSyncStore(temp.filePath, { deviceName: "A", schemaVersion: 17 });
  try {
    const state = stateFixture();
    store.initialize(state);
    const changed = structuredClone(state);
    changed.shortcutProfiles = [{
      id: "shortcut-profile-windows",
      platform: "windows",
      name: "Windows",
      updatedAt: "2026-09-01T05:00:00.000Z",
    }];
    changed.shortcutBindings = [{
      id: "binding-search",
      profileId: "shortcut-profile-windows",
      actionId: "search.open",
      platform: "windows",
      scope: "app",
      accelerator: "Mod+Shift+K",
      enabled: true,
      isDefault: false,
      updatedAt: "2026-09-01T05:00:00.000Z",
    }];
    store.commitState(changed);

    assert.equal(store.db.prepare("SELECT COUNT(*) count FROM shortcut_profiles").get().count, 1);
    assert.equal(store.db.prepare("SELECT accelerator FROM shortcut_bindings WHERE id='binding-search'").get().accelerator, "Mod+Shift+K");
    const shortcutOperations = store.pendingOperations().filter((item) => item.entityType.startsWith("shortcut"));
    assert.deepEqual(shortcutOperations.map((item) => `${item.entityType}:${item.entityId}`).sort(), [
      "shortcutBinding:binding-search",
      "shortcutProfile:shortcut-profile-windows",
    ]);
  } finally {
    store.close();
    fs.rmSync(temp.directory, { recursive: true, force: true });
  }
});
