const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
// 指向 win-unpacked 内的程序；便携启动器不会转发 probe 标准输出，需用截图单独验收。
const electronPath = process.env.QIYE_TEST_PACKAGED_EXE || require("electron");
const extensionPath = path.join(projectRoot, "test", "fixtures", "browser-extension");

async function startFixtureServer() {
  const server = http.createServer((_request, response) => {
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end("<!doctype html><html><head><title>Extension target</title></head><body>target</body></html>");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    url: `http://127.0.0.1:${server.address().port}/`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function runElectron({ userData, url }) {
  const capturePath = path.join(userData, "browser-extension.png");
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, process.env.QIYE_TEST_PACKAGED_EXE ? [] : [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_ALLOW_TEST_CONCURRENT_INSTANCE: "true",
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: "browser-extension-probe",
        QIYE_TAB_PROBE_BASE_URL: url,
        QIYE_EXTENSION_PROBE_PATH: extensionPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Chrome 扩展 Electron 回归超时\n${stdout}\n${stderr}`));
    }, 60_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Chrome 扩展 Electron 回归失败：${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr, capturePath });
    });
  });
}

test("real Electron loads a local Chrome extension, runs its content script and opens its toolbar popup", { timeout: 90_000 }, async (t) => {
  const fixture = await startFixtureServer();
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-browser-extension-"));
  t.after(async () => {
    await fixture.close();
    await fsp.rm(userData, { recursive: true, force: true });
  });
  const result = await runElectron({ userData, url: fixture.url });
  const line = result.stdout.split(/\r?\n/).find((value) => value.includes('"browserExtensionProbe"'));
  assert.ok(line, `缺少扩展 probe 输出：${result.stdout}\n${result.stderr}`);
  const probe = JSON.parse(line).browserExtensionProbe;
  assert.equal(probe.imported, 1);
  assert.equal(probe.status, "loaded");
  assert.equal(probe.pageMarker, "content-script-ran");
  assert.equal(probe.actionCount, 1);
  assert.equal(probe.toolbarHidden, false);
  assert.equal(probe.popupCreated, true);
  assert.ok((await fsp.stat(result.capturePath)).size > 1_000);

  const store = JSON.parse(await fsp.readFile(path.join(userData, "browser-extensions", "extensions.json"), "utf8"));
  assert.equal(store.profiles.default.length, 1);
  assert.equal(store.profiles.default[0].status, "loaded");
});
