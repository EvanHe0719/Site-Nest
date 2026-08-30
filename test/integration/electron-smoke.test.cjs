const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const http = require("node:http");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function runElectron({ userData, route, width = 1060, height = 700, baseUrl = "" }) {
  const capturePath = path.join(userData, `capture-${route}.png`);
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
        QIYE_CAPTURE_WIDTH: String(width),
        QIYE_CAPTURE_HEIGHT: String(height),
        ...(baseUrl ? { QIYE_TAB_PROBE_BASE_URL: baseUrl } : {}),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Electron 回归超时：${route}`));
    }, 45000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(
          new Error(
            `Electron 回归失败：${route}，退出码 ${code}\n${stdout}\n${stderr}`,
          ),
        );
        return;
      }
      resolve({ stdout, stderr, capturePath });
    });
  });
}

test(
  "v2 临时数据可迁移，空间可跨重启恢复，旧入口与通用助手可运行",
  { timeout: 180000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-v3-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });

    const dataFile = path.join(userData, "site-nest-data.json");
    const v2Fixture = {
      version: 2,
      sites: [
        {
          id: "legacy-site",
          name: "旧站点",
          shortName: "旧",
          url: "https://example.org/legacy",
          color: "#5b7cfa",
          source: "custom",
          description: "迁移回归",
          pinned: true,
          order: 0,
          lastOpenedAt: null,
          createdAt: "2026-01-01T00:00:00.000Z",
        },
      ],
      bookmarks: [
        {
          id: "legacy-bookmark",
          name: "旧书签",
          url: "https://example.org/bookmark",
          folder: "回归",
          sourceProfile: "Chrome",
        },
      ],
      importMeta: { source: "Chrome", scanned: 1 },
      automations: {
        naixi: {
          enabled: false,
          time: "09:15",
          status: "disabled",
          message: "自动签到已关闭",
          lastRunAt: null,
          lastSuccessAt: null,
          lastSuccessDate: null,
        },
      },
      createdAt: "2026-01-01T00:00:00.000Z",
    };
    await fsp.writeFile(dataFile, JSON.stringify(v2Fixture, null, 2), "utf8");

    const first = await runElectron({ userData, route: "state-probe" });
    assert.match(first.stdout, /"version":12/);
    const migrated = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(migrated.version, 12);
    assert.equal(migrated.activeWorkspaceId, "personal");
    assert.deepEqual(
      migrated.workspaces.map((workspace) => workspace.id),
      ["personal", "work", "research"],
    );
    assert.equal(migrated.sites[0].workspaceId, "personal");
    assert.equal(migrated.bookmarks[0].id, "legacy-bookmark");
    assert.equal(migrated.automations.naixi.time, "09:15");
    await fsp.access(path.join(userData, "site-nest-data.v2.backup.json"));

    await runElectron({ userData, route: "workspace-persist" });
    const second = await runElectron({ userData, route: "state-probe" });
    assert.match(second.stdout, /"activeWorkspaceId":"work"/);
    const restarted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(restarted.activeWorkspaceId, "work");

    const automation = await runElectron({
      userData,
      route: "legacy-automation-route",
    });
    assert.match(automation.stdout, /"route":"automations","tab":"checkins"/);
    assert.ok((await fsp.stat(automation.capturePath)).size > 1000);

    const assistant = await runElectron({ userData, route: "assistant-generic" });
    assert.match(assistant.stdout, /"genericMatched":true/);
    assert.match(assistant.stdout, /"actionStatus":"success"/);
    const afterAction = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.ok(afterAction.assistantExecutionLogs.length >= 1);
    assert.equal(afterAction.assistantExecutionLogs[0].status, "success");
  },
);

test(
  "本地任务通过安全 IPC 完成增删改、提醒延后并跨重启持久化",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-task-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });

    const probe = await runElectron({ userData, route: "task-probe" });
    assert.match(probe.stdout, /"taskCount":1/);
    assert.match(probe.stdout, /"title":"IPC 本地任务已更新"/);
    assert.match(probe.stdout, /"status":"doing"/);
    assert.match(probe.stdout, /"reminderState":"snoozed"/);
    assert.match(probe.stdout, /"route":"plan"/);
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);

    const dataFile = path.join(userData, "site-nest-data.json");
    const persisted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(persisted.version, 12);
    assert.equal(persisted.localTasks.length, 1);
    assert.equal(persisted.localTasks[0].title, "IPC 本地任务已更新");
    assert.equal(persisted.taskReminders.length, 1);
    assert.equal(persisted.taskReminders[0].state, "snoozed");
    assert.deepEqual(persisted.taskSettings.doNotDisturb, {
      enabled: true,
      start: "22:30",
      end: "07:30",
    });

    await runElectron({ userData, route: "state-probe" });
    const restarted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(restarted.localTasks.length, 1);
    assert.equal(restarted.taskReminders[0].state, "snoozed");
  },
);

test(
  "双线时间轴按年惰性读取、切换视图、生成任务草稿并持久化",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-timeline-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });

    const server = http.createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end('<!doctype html><title>时间轴网页来源</title><p id="timeline-selection">仅保存用户选中的这一段</p>');
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;
    const probe = await runElectron({ userData, route: "timeline-probe", width: 1400, height: 900, baseUrl });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"timelineProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).timelineProbe;
    assert.deepEqual(result.beforeTracks, ["work", "personal"]);
    assert.equal(result.eventCount, 3);
    assert.equal(result.timelineCardCount, 3);
    assert.equal(result.listRowCount, 3);
    assert.equal(result.draft.title, "转为时间轴草稿");
    assert.equal(result.draft.summary, "任务备注");
    assert.equal(result.draft.relatedTaskIds.length, 1);
    assert.ok(result.draft.relatedTaskIds[0]);
    assert.equal(result.countBeforeDraft, result.countAfterDraft, "opening a task draft must not auto-save");
    assert.equal(result.searchId, result.addedId);
    assert.equal(result.emptyYearCount, 1, "ongoing responsibility remains visible in later years");
    assert.equal(result.reviewTotal, 3);
    assert.equal(result.pageDraft.title, "时间轴网页来源");
    assert.equal(result.pageDraft.summary, "仅保存用户选中的这一段");
    assert.equal(result.pageDraft.sourceHostname, "127.0.0.1");
    const sourceUrl = new URL(result.pageDraft.sourceUrl);
    assert.equal(sourceUrl.searchParams.get("id"), "42");
    assert.equal(sourceUrl.searchParams.has("token"), false);
    assert.equal(sourceUrl.searchParams.has("code"), false);
    assert.equal(sourceUrl.hash, "");
    assert.equal(result.route, "plan");
    assert.equal(result.view, "timeline");
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);

    const persisted = JSON.parse(await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"));
    assert.equal(persisted.version, 12);
    assert.deepEqual(persisted.timelineTracks.map((track) => track.id), ["work", "personal"]);
    assert.equal(persisted.timelineEvents.filter((event) => !event.deletedAt).length, 3);
    assert.equal(persisted.timelineUiSettings.viewMode, "timeline");
    assert.equal(persisted.localTasks.length, 1);
  },
);
