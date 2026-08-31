const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "..", "..");
const html = fs.readFileSync(path.join(root, "renderer", "index.html"), "utf8");
const app = fs.readFileSync(path.join(root, "renderer", "app.js"), "utf8");

test("site library defaults to all workspaces and the navigation badge uses the global site count", () => {
  const workspaceFilter = html.match(/<select id="siteWorkspaceFilter"[\s\S]*?<\/select>/)?.[0] || "";
  assert.ok(workspaceFilter.indexOf('value="all"') < workspaceFilter.indexOf('value="current"'));
  assert.match(app, /const siteCount = appState\.sites\.length;/);
  assert.match(app, /`\$\{scopeLabel\} · \$\{scope\.length\} 个站点`/);
});

test("usage and habit heatmaps have explicit visible entry copy", () => {
  assert.match(html, /当前年度使用热力图/);
  assert.match(html, /查看完整使用热力图/);
  assert.match(html, /id="openUsageTrackButton"[^>]*>栖页使用热力图<\/button>/);
  assert.match(app, /每个目标都会显示独立的年度热力图、连续记录和坚持星/);
  assert.match(app, /setAttribute\("aria-expanded", String\(usageDetailsVisible\)\)/);
});

test("habit target form only shows the field used by the selected target type", () => {
  assert.match(html, /id="habitEndDateField"/);
  assert.match(html, /id="habitTargetValueField"/);
  assert.match(app, /habitTargetValueField\.hidden = !usesCountTarget/);
  assert.match(app, /habitEndDateField\.hidden = !usesEndDate/);
  assert.match(app, /endDate: targetType === "endDate"/);
  assert.match(app, /targetValue: targetType === "totalCheckIns"/);
  assert.match(app, /habitTargetType\?\.addEventListener\("change", syncHabitTargetFields\)/);
});
