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
  assert.match(renderer, /completed\.length \/ enabled\.length/);
  assert.match(renderer, /renderAutomationMetrics\(\);\s*\n\s*dom\.executionLogList\.replaceChildren/);
  assert.match(renderer, /\["checkins", "logs"\]\.includes\(currentAutomationTab\)/);
});

test("execution logs expose local date filtering and pagination", () => {
  for (const id of [
    "executionLogStartDate",
    "executionLogEndDate",
    "clearExecutionLogDateFilter",
    "executionLogPreviousPage",
    "executionLogNextPage",
    "executionLogPageInfo",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(renderer, /const EXECUTION_LOG_PAGE_SIZE = 10/);
  assert.match(renderer, /localDateKey\(timestamp\)/);
  assert.match(renderer, /executionLogStartDate/);
  assert.match(renderer, /executionLogEndDate/);
  assert.match(renderer, /filteredLogs\.slice\(/);
  assert.match(renderer, /executionLogPreviousPage\.disabled/);
});

test("automation cards keep metadata icons bounded and expose direct site open actions", () => {
  assert.match(styles, /\.automation-meta-icon\s*\{[\s\S]*?width:\s*13px;[\s\S]*?height:\s*13px;/);
  assert.match(html, /data-open-url="https:\/\/www\.nodeseek\.com\/board"/);
  assert.match(html, /data-open-url="https:\/\/www\.nodeseek\.com\/progress"/);
  assert.match(html, /NodeSeek · 每日签到/);
  assert.match(html, /data-checkin-id="nodeseek"/);
  assert.match(html, /aria-label="NodeSeek 自动签到时间" data-checkin-setting="time"/);
  assert.match(renderer, /updateCheckin\(id,/);
  assert.match(renderer, /runCheckin\(id\)/);
  assert.doesNotMatch(html, /NodeSeek[\s\S]{0,400}未发现通用入口/);
  assert.match(html, /data-open-url="https:\/\/linux\.do\/"/);
  assert.match(renderer, /createIconElement\("clock", "automation-meta-icon"\)/);
});

test("automation center exposes local Chrome extension management and toolbar actions", () => {
  assert.match(html, /data-automation-tab="extensions"/);
  assert.match(html, /data-automation-panel="extensions"/);
  for (const id of [
    "browserExtensionProfile",
    "browserExtensionList",
    "importBrowserExtension",
    "openBrowserExtensionsFolder",
    "browserExtensionActions",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /加载成功[^<]*不代表|“已加载”仅表示/);
  assert.match(renderer, /function loadBrowserExtensions\(/);
  assert.match(renderer, /function refreshBrowserExtensionActions\(/);
  assert.match(renderer, /activateBrowserExtensionAction\(partition/);
  assert.match(styles, /\.browser-extension-action\s*\{/);
});
