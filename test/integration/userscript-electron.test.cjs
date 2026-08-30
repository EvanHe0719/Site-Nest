const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

async function startFixtureServer() {
  const server = http.createServer((request, response) => {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.setHeader("set-cookie", "userscript-session=preserved; Path=/; HttpOnly");
    response.end(`<!doctype html><html><head><title>UserScript fixture</title></head><body>
      <h1 id="userscript-target">${request.url}</h1>
      <input type="password" value="fixture-password">
    </body></html>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function runElectron({ userData, baseUrl, route = "userscript-probe" }) {
  const capturePath = path.join(userData, `${route}.png`);
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: route,
        QIYE_CAPTURE_WIDTH: "1180",
        QIYE_CAPTURE_HEIGHT: "760",
        QIYE_TAB_PROBE_BASE_URL: baseUrl,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`UserScript Electron 回归超时\n${stdout}\n${stderr}`));
    }, 60000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`UserScript Electron 回归失败：${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr, capturePath });
    });
  });
}

test("real Electron installs only after review and runs the script in an isolated world", { timeout: 90000 }, async (t) => {
  const fixture = await startFixtureServer();
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-userscript-integration-"));
  t.after(async () => {
    await fixture.close();
    await fsp.rm(userData, { recursive: true, force: true });
  });

  const result = await runElectron({ userData, baseUrl: fixture.baseUrl });
  const line = result.stdout.split(/\r?\n/).find((value) => value.includes('"userscriptProbe"'));
  assert.ok(line, `缺少 UserScript probe 输出：${result.stdout}\n${result.stderr}`);
  const probe = JSON.parse(line).userscriptProbe;
  assert.equal(probe.ran, "1", JSON.stringify(probe, null, 2));
  assert.equal(probe.cookieSeen, "blocked");
  assert.equal(probe.passwordSeen, "blocked");
  assert.equal(probe.passwordPreserved, true);
  assert.equal(probe.color, "rgb(12, 120, 88)");
  assert.equal(probe.pageHostType, "undefined");
  assert.equal(probe.nodeRequireType, "undefined");
  assert.equal(probe.sourceExposed, false);
  assert.equal(probe.commandCount, 1);
  assert.equal(probe.commandResult, "done");
  assert.equal(probe.storedRuns, 1);
  assert.ok(probe.browserCookieCount >= 1);
  assert.equal(probe.sensitiveRan, "");
  assert.equal(probe.disabledRan, "");
  assert.equal(probe.runtimeCount, 0);
  assert.ok((await fsp.stat(result.capturePath)).size > 1000);

  const state = JSON.parse(await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"));
  const installed = state.userScripts.find((script) => script.name === "Electron userscript fixture");
  assert.ok(installed);
  assert.equal(installed.enabled, false);
  assert.match(installed.sourceHash, /^[a-f0-9]{64}$/);
  assert.equal(state.userScriptExecutions.some((execution) => execution.status === "success"), true);

  const reviewUi = await runElectron({ userData, baseUrl: fixture.baseUrl, route: "userscript-review-ui" });
  assert.ok((await fsp.stat(reviewUi.capturePath)).size > 1000);
});
