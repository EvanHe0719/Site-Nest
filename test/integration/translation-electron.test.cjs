const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function runProbe() {
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [path.join(projectRoot, "test", "fixtures", "translation-electron-probe.cjs")], {
      cwd: projectRoot,
      windowsHide: true,
      env: { ...process.env, ELECTRON_DISABLE_SECURITY_WARNINGS: "true" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill(); reject(new Error(`translation probe timeout\n${stdout}\n${stderr}`)); }, 30_000);
    child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
    child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
    child.once("error", reject);
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`translation probe exited ${code}\n${stdout}\n${stderr}`));
      resolve(stdout);
    });
  });
}

test("real Electron extracts visible text, renders both modes, detects dynamic text and restores DOM", { timeout: 40_000 }, async () => {
  const stdout = await runProbe();
  const line = stdout.split(/\r?\n/).find((value) => value.trim().startsWith('{') && value.includes('translationElectronProbe'));
  assert.ok(line, stdout);
  const probe = JSON.parse(line).translationElectronProbe;
  assert.equal(probe.selectionAnchor.captured, true);
  assert.equal(probe.insightShown.shown, true);
  assert.equal(probe.insight.count, 1);
  assert.match(probe.insight.text, /DeepSeek 查询/);
  assert.match(probe.insight.text, /本地拼音 · DeepSeek 释义/);
  assert.match(probe.insight.text, /古代文人让酒杯随曲水漂流/);
  assert.match(probe.insight.pronunciation, /qū/);
  assert.match(probe.insight.pronunciation, /shāng/);
  assert.match(probe.insight.position.left, /px$/);
  assert.match(probe.insight.position.top, /px$/);
  assert.match(probe.insight.pageUrl, /^data:text\/html/);
  const sourceTexts = probe.initial.segments.map((item) => item.text);
  assert.ok(sourceTexts.includes("Visible heading"));
  assert.ok(sourceTexts.includes("First paragraph"));
  assert.equal(sourceTexts.includes("12345"), false);
  assert.equal(sourceTexts.includes("Do not translate"), false);
  assert.equal(sourceTexts.includes("Private input"), false);
  assert.equal(sourceTexts.includes("Hidden paragraph"), false);
  assert.equal(probe.applied.applied, 2);
  assert.equal(probe.bilingual.original, "First paragraph");
  assert.ok(probe.bilingual.translations.includes("译:First paragraph"));
  assert.ok(probe.bilingual.observerCount > 0);
  assert.equal(probe.translatedOnly, "");
  assert.ok(probe.dynamic.segments.some((item) => item.text === "Dynamic paragraph"));
  assert.deepEqual(probe.restored, { original: "First paragraph", translations: 0, stateExists: false });
});
