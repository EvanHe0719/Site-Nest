const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

async function startServer(delayMs = 650) {
  const server = http.createServer((request, response) => {
    if (!String(request.url || "").startsWith("/navigation-performance")) {
      response.writeHead(404).end();
      return;
    }
    setTimeout(() => {
      response.setHeader("content-type", "text/html; charset=utf-8");
      response.end(`<!doctype html><html><head><title>Navigation fixture</title></head><body><h1>Progressive page</h1><p>${request.url}</p></body></html>`);
    }, delayMs);
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return {
    baseUrl: `http://127.0.0.1:${server.address().port}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function runElectron(userData, baseUrl) {
  const capturePath = path.join(userData, "navigation-performance.png");
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: "navigation-performance-probe",
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
      reject(new Error(`Navigation performance Electron probe timed out\n${stdout}\n${stderr}`));
    }, 90_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) reject(new Error(`Navigation performance Electron probe failed: ${code}\n${stdout}\n${stderr}`));
      else resolve({ stdout, stderr, capturePath });
    });
  });
}

function performancePayload(stdout) {
  const prefix = "QIYE_NAVIGATION_PERFORMANCE=";
  const line = String(stdout || "").split(/\r?\n/).find((value) => value.startsWith(prefix));
  if (!line) throw new Error(`Navigation performance result missing\n${stdout}`);
  return JSON.parse(line.slice(prefix.length));
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

test("WebContentsView navigation exposes measurable first-paint timing without waiting for full load", { timeout: 120_000 }, async (t) => {
  const fixture = await startServer();
  const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-navigation-performance-"));
  t.after(async () => {
    await fixture.close();
    await fsp.rm(userData, { recursive: true, force: true });
  });
  const result = await runElectron(userData, fixture.baseUrl);
  const payload = performancePayload(result.stdout);
  assert.equal(payload.samples.length, 5);
  assert.ok(payload.samples.every((sample) => sample.trace?.webContentsId));
  assert.ok(payload.samples.every((sample) => sample.trace.partition === "persist:qiye-sites"));
  assert.ok(payload.samples.every((sample) => sample.trace.viewAttachedAt <= sample.trace.loadUrlCalledAt));
  assert.ok(payload.samples.every((sample) => sample.trace.overlayHiddenAt <= sample.trace.domReadyAt));
  assert.ok(median(payload.samples.map((sample) => sample.selectReturnMs)) < 100);
  assert.equal(payload.summary.overlayDelayMs, 0);
  console.log(`navigation-performance ${JSON.stringify(payload)}`);
});
