const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function runProbe() {
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [path.join(projectRoot, "test", "fixtures", "browser-media-electron-probe.cjs")], {
      cwd: projectRoot,
      windowsHide: true,
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`browser media probe timeout\n${stdout}\n${stderr}`));
    }, 30_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`browser media probe exited ${code}\n${stdout}\n${stderr}`));
      resolve(stdout);
    });
  });
}

test("real Electron WebContentsView supports media presentation and closes without a late audio-state crash", { timeout: 40_000 }, async () => {
  const stdout = await runProbe();
  const line = stdout.split(/\r?\n/).find((value) => value.includes("browserMediaElectronProbe"));
  assert.ok(line, stdout);
  const probe = JSON.parse(line).browserMediaElectronProbe;
  assert.equal(probe.capability.pictureInPictureEnabled, true);
  assert.equal(probe.capability.hasPictureInPictureMethod, true);
  assert.equal(probe.capability.hasFullscreenMethod, true);
  assert.ok(probe.capability.readyState >= 2);
  assert.deepEqual(probe.pictureInPicture, { ok: true, active: true });
  assert.equal(probe.pictureInPictureActive, true);
  assert.deepEqual(probe.fullscreen, { ok: true, active: true });
  assert.equal(probe.fullscreenActive, true);
  assert.equal(probe.enteredFullscreen, 1);
  assert.equal(probe.leftFullscreen, 1);
  assert.ok(probe.audioStateEvents >= 1);
  assert.equal(probe.mediaCloseSurvived, true);
  assert.ok(probe.permissionLog.some((item) => item.permission === "fullscreen" && item.allowed === true));
});
