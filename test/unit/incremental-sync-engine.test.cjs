const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  IncrementalSyncEngine,
  RecordSyncStore,
} = require("../../electron/sync/index.cjs");

class MemoryAppDataDrive {
  constructor() {
    this.files = new Map();
    this.sequence = 0;
    this.writes = [];
  }

  async status() {
    return { signedIn: true, email: "test@example.com", identity: { accountId: "account-1" }, drive: { status: "ready" } };
  }
  async healthCheck() { return { ok: true }; }
  async listAppDataFiles() { return Array.from(this.files.values()).map(({ data, ...file }) => ({ ...file })); }
  async readAppDataJson(id) { return structuredClone(Array.from(this.files.values()).find((file) => file.id === id).data); }
  async writeAppDataJson(name, data, options = {}) {
    const existing = Array.from(this.files.values()).find((file) => file.name === name);
    if (existing && options.upsert !== true) return { created: false, existing: true, fileId: existing.id, name };
    const file = existing || { id: `file-${++this.sequence}`, name };
    file.data = structuredClone(data);
    file.modifiedTime = new Date(1_700_000_000_000 + this.sequence).toISOString();
    this.files.set(file.id, file);
    this.writes.push(name);
    return { created: !existing, fileId: file.id, name };
  }
  async getStartPageToken() { return String(this.sequence); }
  async listChanges() { return { changes: [], newStartPageToken: String(this.sequence) }; }
}

function localState(siteName) {
  return {
    version: 17,
    createdAt: "2026-09-01T00:00:00.000Z",
    updatedAt: "2026-09-01T00:00:00.000Z",
    workspaces: [{ id: "work", name: "工作", updatedAt: "2026-09-01T00:00:00.000Z" }],
    sites: siteName ? [{ id: "site-1", workspaceId: "work", name: siteName, url: "https://example.com/", updatedAt: "2026-09-01T00:00:00.000Z" }] : [],
    uiSettings: { googleSync: { sites: true, settings: true } },
  };
}

function openStore(label, state) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), `qiye-engine-${label}-`));
  const store = new RecordSyncStore(path.join(directory, "site-nest.db"), { deviceName: label, appVersion: "0.5.5", schemaVersion: 17 });
  store.initialize(state);
  return { directory, store };
}

test("two devices exchange immutable record batches and snapshots without a full-database blob", async () => {
  const drive = new MemoryAppDataDrive();
  const a = openStore("A", localState("原始入口"));
  const b = openStore("B", localState(null));
  try {
    const stateA = localState("A 修改");
    stateA.sites[0].updatedAt = "2026-09-01T01:00:00.000Z";
    a.store.commitState(stateA);
    const engineA = new IncrementalSyncEngine({ store: a.store, appVersion: "0.5.5", schemaVersion: 17 });
    const first = await engineA.sync(drive, { fullScan: true });
    assert.equal(first.uploadedCount, 1);
    assert.equal(drive.writes.some((name) => /^qiye-operations-/.test(name)), true);
    assert.equal(drive.writes.some((name) => /^qiye-snapshot-/.test(name)), true);
    assert.equal(drive.writes.includes("qiye-sync-manifest-v1.json"), true);
    assert.equal(drive.writes.includes("qiye-sync-v1.json"), false);
    assert.equal(drive.writes.includes("site-nest.db"), false);

    const engineB = new IncrementalSyncEngine({ store: b.store, appVersion: "0.5.5", schemaVersion: 17 });
    const downloaded = await engineB.sync(drive, { fullScan: true });
    assert.equal(downloaded.state.sites[0].name, "A 修改");

    const stateB = structuredClone(downloaded.state);
    stateB.sites[0].name = "B 修改";
    stateB.sites[0].updatedAt = "2026-09-01T02:00:00.000Z";
    b.store.commitState(stateB);
    await engineB.sync(drive, { fullScan: true });
    const roundTrip = await engineA.sync(drive, { fullScan: true });
    assert.equal(roundTrip.state.sites[0].name, "B 修改");

    const repeated = await engineA.sync(drive, { fullScan: true });
    assert.equal(repeated.appliedCount, 0, "already applied operation ids must be ignored");
  } finally {
    a.store.close();
    b.store.close();
    fs.rmSync(a.directory, { recursive: true, force: true });
    fs.rmSync(b.directory, { recursive: true, force: true });
  }
});
