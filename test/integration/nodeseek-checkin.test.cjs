const test = require("node:test");
const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");

test("NodeSeek check-in DOM adapter confirms personal success and stops on login, challenge, hidden or foreign controls", { timeout: 30_000 }, async (t) => {
  const userData = await fs.mkdtemp(path.join(os.tmpdir(), "qiye-ns-checkin-"));
  t.after(() => fs.rm(userData, { recursive: true, force: true }));
  const output = await new Promise((resolve, reject) => {
    const child = spawn(require("electron"), [path.resolve(__dirname, "../fixtures/nodeseek-checkin-probe.cjs")], { windowsHide: true, env: { ...process.env, QIYE_TEST_USER_DATA: userData }, stdio: ["ignore", "pipe", "pipe"] });
    let output = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(output || "probe timeout")); }, 25_000);
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.stderr.on("data", (chunk) => { output += chunk; });
    child.once("error", (error) => { clearTimeout(timer); reject(error); });
    child.once("exit", (code) => { clearTimeout(timer); if (code === 0) resolve(output); else reject(new Error(output)); });
  });
  assert.match(output, /NODESEEK_CHECKIN_DOM_OK/);
});
