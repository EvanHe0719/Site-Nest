const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const { deriveDataHealthStatus } = require("../../electron/sync/runtime-state.cjs");

test("top data status uses only neutral, green, and red stable tones", () => {
  assert.deepEqual(
    deriveDataHealthStatus({ configured: false, incremental: { databaseHealthy: true } }),
    { dataHealth: "healthy", syncRuntime: "notConfigured", topTone: "neutral", animated: false },
  );
  assert.equal(deriveDataHealthStatus({
    configured: true,
    signedIn: true,
    driveStatus: "ready",
    online: true,
    incremental: { databaseHealthy: true, status: "idle", conflictCount: 0 },
  }).topTone, "healthy");
  const offline = deriveDataHealthStatus({
    configured: true,
    signedIn: true,
    driveStatus: "ready",
    online: false,
    incremental: { databaseHealthy: true, status: "idle", conflictCount: 0 },
  });
  assert.equal(offline.syncRuntime, "offline");
  assert.equal(offline.topTone, "healthy");
});

test("database failure, expired auth, sync failure, and record conflict are red", () => {
  assert.equal(deriveDataHealthStatus({
    configured: false,
    incremental: { databaseHealthy: false },
  }).topTone, "error");
  assert.equal(deriveDataHealthStatus({
    configured: true,
    signedIn: true,
    errorCode: "GOOGLE_AUTH_EXPIRED",
    incremental: { databaseHealthy: true },
  }).syncRuntime, "authRequired");
  assert.equal(deriveDataHealthStatus({
    configured: true,
    signedIn: true,
    incremental: { databaseHealthy: true, status: "failed" },
  }).topTone, "error");
  assert.equal(deriveDataHealthStatus({
    configured: true,
    signedIn: true,
    incremental: { databaseHealthy: true, conflictCount: 2 },
  }).syncRuntime, "conflict");
});

test("compact status button opens a native menu so WebContentsView cannot cover it", () => {
  const root = path.resolve(__dirname, "../..");
  const html = fs.readFileSync(path.join(root, "renderer/index.html"), "utf8");
  const renderer = fs.readFileSync(path.join(root, "renderer/app.js"), "utf8");
  const main = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");
  const preload = fs.readFileSync(path.join(root, "electron/preload.cjs"), "utf8");
  assert.match(html, /id="dataStatusButton"/);
  assert.match(renderer, /showDataStatusMenu/);
  assert.match(preload, /data-status:show-menu/);
  assert.match(main, /Menu\.buildFromTemplate\(template\)\.popup/);
  assert.match(main, /待上传.*待应用.*冲突/);
});
