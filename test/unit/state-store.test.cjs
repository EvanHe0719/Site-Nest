const test = require("node:test");
const assert = require("node:assert/strict");
const os = require("node:os");
const path = require("node:path");
const fsp = require("node:fs/promises");

const {
  StateStoreError,
  backupPathForVersion,
  errorLogPathFor,
  loadStateFile,
  saveStateFile,
} = require("../../electron/state-store.cjs");

const NOW = "2026-08-29T12:00:00.000Z";

async function temporaryDirectory(t) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-state-store-"));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  return directory;
}

function v2Fixture() {
  return {
    version: 2,
    sites: [
      {
        id: "site-one",
        name: "站点一",
        shortName: "一",
        url: "https://example.com/",
        color: "#5b7cfa",
        source: "custom",
        description: "fixture",
        pinned: true,
        order: 0,
        lastOpenedAt: null,
        createdAt: "2026-08-01T00:00:00.000Z",
      },
    ],
    bookmarks: [
      {
        id: "bookmark-one",
        name: "书签",
        url: "https://docs.example.com/",
        folder: "测试",
        addedAt: null,
        sourceProfile: "Default",
      },
    ],
    importMeta: { profileId: "Default", total: 1 },
    automations: {
      naixi: {
        enabled: true,
        time: "08:30",
        status: "success",
        message: "完成",
        lastRunAt: "2026-08-29T00:30:00.000Z",
        lastSuccessAt: "2026-08-29T00:30:00.000Z",
        lastSuccessDate: "2026-08-29",
      },
    },
    createdAt: "2026-08-01T00:00:00.000Z",
  };
}

test("missing file is distinguished from corruption", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "site-nest-data.json");
  const result = await loadStateFile(filePath, { now: NOW });

  assert.equal(result.source, "missing");
  assert.equal(result.state.version, 14);
  assert.equal(result.persisted, false);
  await assert.rejects(fsp.access(filePath), (error) => error.code === "ENOENT");
});

test("v2 load creates an exact one-time backup and atomically persists v14", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "site-nest-data.json");
  const raw = `${JSON.stringify(v2Fixture(), null, 2)}\n`;
  await fsp.writeFile(filePath, raw, "utf8");

  const first = await loadStateFile(filePath, { now: NOW });
  const backupPath = backupPathForVersion(filePath, 2);
  assert.equal(first.migrated, true);
  assert.equal(first.persisted, true);
  assert.equal(first.backupCreated, true);
  assert.equal(first.backupPath, backupPath);
  assert.equal(await fsp.readFile(backupPath, "utf8"), raw);

  const persisted = JSON.parse(await fsp.readFile(filePath, "utf8"));
  assert.equal(persisted.version, 14);
  assert.equal(persisted.sites[0].workspaceId, "personal");
  assert.equal(persisted.bookmarks.length, 1);
  assert.equal(persisted.automations.naixi.status, "success");

  const backupStat = await fsp.stat(backupPath);
  const second = await loadStateFile(filePath, {
    now: "2030-01-01T00:00:00.000Z",
  });
  assert.equal(second.migrated, false);
  assert.equal(second.changed, false);
  assert.equal(second.persisted, false);
  assert.equal(second.backupPath, null);
  assert.deepEqual(second.state, first.state);
  assert.equal((await fsp.stat(backupPath)).mtimeMs, backupStat.mtimeMs);
});

test("corrupt JSON is never replaced by defaults and creates a sanitized error record", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "site-nest-data.json");
  const corrupt = '{"version":2,"sites":[';
  await fsp.writeFile(filePath, corrupt, "utf8");

  await assert.rejects(
    loadStateFile(filePath, { now: NOW }),
    (error) => error instanceof StateStoreError && error.code === "STATE_CORRUPT",
  );
  assert.equal(await fsp.readFile(filePath, "utf8"), corrupt);
  const errorLog = await fsp.readFile(errorLogPathFor(filePath), "utf8");
  assert.match(errorLog, /"phase":"parse"/);
  assert.doesNotMatch(errorLog, /"sites":\[/);
});

test("unsupported future schema records migration failure without overwriting source", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "site-nest-data.json");
  const future = `${JSON.stringify({ version: 99, privateValue: "keep-me" })}\n`;
  await fsp.writeFile(filePath, future, "utf8");

  await assert.rejects(
    loadStateFile(filePath, { now: NOW }),
    (error) =>
      error instanceof StateStoreError &&
      error.code === "STATE_MIGRATION_FAILED",
  );
  assert.equal(await fsp.readFile(filePath, "utf8"), future);
  const errorLog = await fsp.readFile(errorLogPathFor(filePath), "utf8");
  assert.match(errorLog, /UNSUPPORTED_SCHEMA_VERSION/);
});

test("save validates and persists a normalized v14 state", async (t) => {
  const directory = await temporaryDirectory(t);
  const filePath = path.join(directory, "site-nest-data.json");
  const saved = await saveStateFile(filePath, v2Fixture(), { now: NOW });

  assert.equal(saved.version, 14);
  assert.equal(saved.workspaces.length, 3);
  const disk = JSON.parse(await fsp.readFile(filePath, "utf8"));
  assert.deepEqual(disk, saved);
  const temporaryFiles = (await fsp.readdir(directory)).filter((name) =>
    name.endsWith(".tmp"),
  );
  assert.deepEqual(temporaryFiles, []);
});
