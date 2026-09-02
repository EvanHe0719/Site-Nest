const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(root, "renderer", "index.html"), "utf8");
const renderer = fs.readFileSync(path.join(root, "renderer", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(root, "renderer", "styles.css"), "utf8");

test("automation overview uses measurable cards and removes the sandbox-status card", () => {
  for (const id of [
    "managedAutomationCount",
    "automationTodayRate",
    "automationTodayRateText",
    "automationTodayRunCount",
    "automationTodayRunSummary",
  ]) assert.match(html, new RegExp(`id="${id}"`));

  assert.match(html, /已纳管签到入口/);
  assert.match(html, /今日自动执行/);
  assert.match(html, /今日执行记录/);
  assert.doesNotMatch(`${html}\n${styles}`, /沙箱状态|安全沙箱状态|隔离保护已生效/);
  assert.doesNotMatch(styles, /\.automation-summary\s*\{/);
  assert.match(styles, /\.automation-stat-grid\s*\{/);
  assert.match(styles, /grid-template-columns:\s*repeat\(3,/);
});

test("automation metrics refresh from actual status and execution records", () => {
  assert.match(renderer, /function renderAutomationMetrics\(/);
  assert.match(renderer, /querySelectorAll\('\[data-managed-automation="true"\]'\)\.length/);
  assert.match(renderer, /localDateKey\(automationExecutionTimestamp\(log\)\) === today/);
  assert.match(renderer, /successStatuses = new Set\(\["success", "completed"\]\)/);
  assert.match(renderer, /issueStatuses = new Set\(/);
  assert.match(renderer, /renderAutomationMetrics\(naixi\)/);
  assert.match(renderer, /renderAutomationMetrics\(\);\s*\n\s*dom\.executionLogList\.replaceChildren/);
  assert.match(renderer, /\["checkins", "logs"\]\.includes\(currentAutomationTab\)/);
});

test("automation cards keep metadata icons bounded and expose direct site open actions", () => {
  assert.match(styles, /\.automation-meta-icon\s*\{[\s\S]*?width:\s*13px;[\s\S]*?height:\s*13px;/);
  assert.match(html, /data-open-url="https:\/\/www\.nodeseek\.com\/categories\/info"/);
  assert.match(html, /data-open-url="https:\/\/linux\.do\/"/);
  assert.match(renderer, /createIconElement\("clock", "automation-meta-icon"\)/);
});
