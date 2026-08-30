const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

async function startServer() {
  const server = http.createServer((request, response) => {
    response.setHeader("set-cookie", "resource-session=preserved; Path=/; HttpOnly");
    if (request.url === "/resources") {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(`<!doctype html><html><head><title>Resource fixture</title></head><body>
        <h1 id="resource-title">Resource fixture</h1>
        <a href="/manual.pdf" download="manual.pdf" type="application/pdf">Manual</a>
        <a href="/archive.zip">Archive</a>
        <a href="/article">Ordinary article</a>
        <a href="/encrypted.m3u8">Encrypted playlist</a>
        <img src="/photo.png" alt="fixture">
        <video src="/clip.mp4"></video>
        <audio><source src="/sound.mp3" type="audio/mpeg"></audio>
      </body></html>`);
      return;
    }
    const types = {
      "/manual.pdf": "application/pdf",
      "/network-file.pdf": "application/pdf",
      "/archive.zip": "application/zip",
      "/photo.png": "image/png",
      "/clip.mp4": "video/mp4",
      "/sound.mp3": "audio/mpeg",
      "/encrypted.m3u8": "application/vnd.apple.mpegurl",
    };
    const contentType = types[request.url];
    if (contentType) {
      const body = Buffer.from(`fixture-${request.url}`);
      response.setHeader("content-type", contentType);
      response.setHeader("content-length", String(body.length));
      response.end(body);
      return;
    }
    response.setHeader("content-type", "text/html; charset=utf-8");
    response.end(`<!doctype html><title>${request.url}</title><p>${request.url}</p>`);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function runElectron(userData, baseUrl) {
  const capturePath = path.join(userData, "resource-lifecycle.png");
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: "resource-lifecycle-probe",
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
      reject(new Error(`Resource lifecycle Electron 回归超时\n${stdout}\n${stderr}`));
    }, 90000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Resource lifecycle Electron 回归失败：${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr, capturePath });
    });
  });
}

test("real Electron scans only direct resources and suspends overflow views without clearing browser identity", { timeout: 120000 }, async (t) => {
  const fixture = await startServer();
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-resource-lifecycle-"));
  t.after(async () => {
    await fixture.close();
    await fsp.rm(userData, { recursive: true, force: true });
  });

  const result = await runElectron(userData, fixture.baseUrl);
  const line = result.stdout.split(/\r?\n/).find((value) => value.includes('"resourceLifecycleProbe"'));
  assert.ok(line, `缺少 resource lifecycle probe：${result.stdout}\n${result.stderr}`);
  const probe = JSON.parse(line).resourceLifecycleProbe;
  assert.ok(probe.domResourceCount >= 5);
  assert.deepEqual(probe.domResourceTypes, ["audio", "file", "file", "image", "video"]);
  assert.equal(probe.blockedPlaylist, false);
  assert.ok(probe.networkResourceCount >= 1);
  assert.equal(probe.networkHasBodyOrHeaders, false);
  assert.equal(probe.liveBefore, 6);
  assert.equal(probe.liveAfter, 1);
  assert.equal(probe.lifecycleCounts.active, 1);
  assert.equal(probe.originalDestroyed, true);
  assert.equal(probe.runtimeBeforeSuspend, true);
  assert.equal(probe.runtimeAfterSuspend, false);
  assert.equal(probe.resourceCacheAfterSuspend, false);
  assert.ok(probe.cookieBeforeRestore >= 1);
  assert.equal(probe.cookieAfterRestore, probe.cookieBeforeRestore);
  assert.equal(new URL(probe.restoredUrl).pathname, "/resources");
  assert.equal(probe.partition, "persist:qiye-sites");
  assert.ok(probe.finalResourceCount >= 5);
  assert.ok(Number.isFinite(probe.memoryBefore));
  assert.ok(Number.isFinite(probe.memoryAfter));
  assert.ok((await fsp.stat(result.capturePath)).size > 1000);
});
