const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.join(__dirname, "..", "..");
const html = fs.readFileSync(path.join(ROOT, "renderer", "index.html"), "utf8");
const renderer = fs.readFileSync(path.join(ROOT, "renderer", "app.js"), "utf8");
const styles = fs.readFileSync(path.join(ROOT, "renderer", "styles.css"), "utf8");
const main = fs.readFileSync(path.join(ROOT, "electron", "main.cjs"), "utf8");

test("schedule module uses the new wording and contains the split Feishu-style editor", () => {
  assert.match(html, /<h1>日程<\/h1>/);
  assert.match(html, />创建日程<\/button>/);
  assert.match(html, /id="taskTitle"[^>]+placeholder="添加主题"/);
  for (const id of [
    "taskStartDate",
    "taskStartTime",
    "taskEndTime",
    "taskEndDate",
    "taskAllDay",
    "taskRecurrence",
    "taskRecurrenceUntil",
    "taskRecurrenceCustom",
    "taskWorkspace",
    "taskPriority",
    "taskStatus",
    "taskColor",
    "taskPreviewGrid",
    "taskDetailLayer",
  ]) assert.match(html, new RegExp(`id="${id}"`));
  assert.match(html, /每个工作日（周一至周五）/);
  assert.match(html, /value="custom">自定义/);
  assert.match(styles, /\.schedule-modal-body\s*\{/);
  assert.match(styles, /\.schedule-day-preview\s*\{/);
  assert.match(styles, /backdrop-filter:\s*blur/);
});

test("week and month render compact occurrences without the removed selected-day sidebar", () => {
  assert.match(renderer, /TASK_CALENDAR\.occurrencesForWeek/);
  assert.match(renderer, /TASK_CALENDAR\.monthSegments/);
  assert.match(renderer, /className = "task-agenda-item"/);
  assert.match(renderer, /className = "task-month-event"/);
  assert.match(renderer, /openTaskDetail\(segment\.occurrence\.task\)/);
  assert.doesNotMatch(`${html}\n${renderer}\n${styles}`, /task-selected-day/);
});

test("calendar helper loads before renderer and capture probe verifies live date preview", () => {
  assert.ok(html.indexOf('<script src="./task-calendar.js"></script>') < html.indexOf('<script src="./app.js"></script>'));
  assert.match(main, /taskStartDate\.dispatchEvent\(new Event\('change'/);
  assert.match(main, /previewDateChange/);
  assert.match(main, /previewHours/);
});
