const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "../..");
const electronPath = require("electron");

function runElectron(entry, userData, environment = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [entry, `--user-data-dir=${userData}`], {
      cwd: projectRoot, windowsHide: true,
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true", ...environment },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(`NodeSeek refresh probe timeout\n${stdout}\n${stderr}`)); }, 30000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`NodeSeek refresh probe exited ${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr });
    });
  });
}

test("real Electron worker-controlled reloads retain browser identity, valid languages and login cookies", { timeout: 40000 }, async (t) => {
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-nodeseek-refresh-"));
  t.after(() => fsp.rm(userData, { recursive: true, force: true }));
  const result = await runElectron(path.join(projectRoot, "test/fixtures/nodeseek-refresh-electron-probe.cjs"), userData);
  const line = result.stdout.split(/\r?\n/).find((item) => item.includes('"nodeSeekBrowserIdentityProbe"'));
  assert.ok(line, result.stdout + result.stderr);
  const probe = JSON.parse(line).nodeSeekBrowserIdentityProbe;
  assert.equal(probe.workerReady, true);
  assert.equal(probe.sameView, true);
  assert.equal(probe.loginPreserved, true);
  assert.deepEqual(probe.navigationCodes, [200, 200, 200]);
  assert.equal(probe.requests.length, 3);
  assert.deepEqual(probe.requests.map((item) => item.worker), [false, true, true]);
  assert.equal(new Set(probe.requests.map((item) => item.userAgent)).size, 1);
  for (const request of probe.requests) {
    assert.equal(request.statusCode, 200);
    assert.equal(request.hasLoginCookie, true);
    assert.equal(request.acceptLanguage, "zh-CN,zh;q=0.9,en;q=0.8");
    assert.doesNotMatch(request.userAgent, /Electron\/|site-nest-desktop|\?\?\//i);
  }
});

test("the real toolbar reports a bare HTTP 403 without covering the page and clears it after success", { timeout: 40000 }, async (t) => {
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-nodeseek-forbidden-"));
  t.after(() => fsp.rm(userData, { recursive: true, force: true }));
  const result = await runElectron(projectRoot, userData, {
    QIYE_TEST_USER_DATA: userData,
    QIYE_ALLOW_TEST_CONCURRENT_INSTANCE: "true",
    QIYE_CAPTURE_PATH: path.join(userData, "forbidden.png"),
    QIYE_CAPTURE_ROUTE: "nodeseek-forbidden-probe",
    QIYE_CAPTURE_WIDTH: "1180",
    QIYE_CAPTURE_HEIGHT: "760",
  });
  const line = result.stdout.split(/\r?\n/).find((item) => item.includes('"nodeSeekRefreshProbe"'));
  assert.ok(line, result.stdout + result.stderr);
  const probe = JSON.parse(line).nodeSeekRefreshProbe;
  assert.deepEqual(probe.navigations.map((item) => item.statusCode), [403, 403, 200]);
  assert.equal(new Set(probe.phases.map((item) => item.webContentsId)).size, 1);
  for (const blocked of probe.phases.slice(0, 2)) {
    assert.equal(blocked.siteIssue, "nodeseek-forbidden");
    assert.equal(blocked.notice.hidden, false);
    assert.equal(blocked.notice.display, "grid");
    assert.ok(blocked.notice.bottom > 0);
    assert.match(blocked.notice.text, /HTTP 403/);
    assert.doesNotMatch(blocked.notice.text, /Cloudflare/);
    assert.ok(blocked.notice.bottom <= blocked.nativeTop + 1, JSON.stringify(blocked));
    assert.ok(blocked.notice.bottom <= blocked.notice.frameTop + 1, JSON.stringify(blocked));
  }
  const recovered = probe.phases.at(-1);
  assert.equal(recovered.siteIssue, "");
  assert.equal(recovered.error, "");
  assert.equal(recovered.notice.hidden, true);
  assert.equal(recovered.notice.text, "");
  assert.equal(recovered.page.navigationType, "reload");
});
