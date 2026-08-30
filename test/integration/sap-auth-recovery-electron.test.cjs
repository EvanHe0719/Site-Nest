const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function runElectron(userData) {
  return new Promise((resolve, reject) => {
    const fixture = path.join(projectRoot, "test", "fixtures", "sap-auth-recovery-electron-probe.cjs");
    const child = spawn(electronPath, [fixture, `--user-data-dir=${userData}`], {
      cwd: projectRoot,
      windowsHide: true,
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`SAP auth recovery Electron 回归超时\n${stdout}\n${stderr}`));
    }, 30000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`SAP auth recovery Electron 回归失败：${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

test("real Electron supports scoped cleanup and an isolated full SAP identity reset", { timeout: 45000 }, async (t) => {
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-sap-auth-recovery-"));
  t.after(() => fsp.rm(userData, { recursive: true, force: true }));
  const result = await runElectron(userData);
  const line = result.stdout.split(/\r?\n/).find((value) => value.includes('"sapAuthRecoveryProbe"'));
  assert.ok(line, `缺少 SAP auth recovery probe：${result.stdout}\n${result.stderr}`);
  const probe = JSON.parse(line).sapAuthRecoveryProbe;
  assert.deepEqual(probe.scoped.beforeDomains, [".example.com", ".sap.com", ".support.sap.com"]);
  assert.deepEqual(probe.scoped.afterDomains, [".example.com"]);
  assert.equal(probe.scoped.removedCookieCount, 2);
  assert.ok(probe.scoped.clearedOrigins.includes("https://accounts.sap.com"));
  assert.ok(probe.scoped.clearedOrigins.includes("https://sapit-forme-prod.authentication.eu11.hana.ondemand.com"));
  assert.deepEqual(probe.dedicated.beforeDomains, [".example.com", ".sap.com"]);
  assert.deepEqual(probe.dedicated.afterDomains, []);
  assert.equal(probe.dedicated.removedCookieCount, 2);
  assert.equal(probe.dedicated.remainingCookieCount, 0);
  assert.deepEqual(probe.defaultIdentity.beforeDomains, [".example.com"]);
  assert.deepEqual(probe.defaultIdentity.afterDomains, [".example.com"]);
});
