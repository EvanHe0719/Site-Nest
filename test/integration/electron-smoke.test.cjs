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
        QIYE_ALLOW_TEST_CONCURRENT_INSTANCE: "true",
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
    assert.match(first.stdout, /"version":18/);
    const migrated = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(migrated.version, 18);
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
  "本地日程通过安全 IPC 完成增删改、提醒延后、动态日期预览并跨重启持久化",
  { timeout: 120000 },
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
    assert.equal(persisted.version, 18);
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

    const scheduleUi = await runElectron({ userData, route: "task-modal", width: 1440, height: 900 });
    const scheduleLine = scheduleUi.stdout.split(/\r?\n/).find((item) => item.includes('"scheduleCapture"'));
    assert.ok(scheduleLine, scheduleUi.stdout);
    const scheduleResult = JSON.parse(scheduleLine).scheduleCapture;
    assert.equal(scheduleResult.modalOpen, true);
    assert.equal(scheduleResult.previewHours, 24);
    assert.match(scheduleResult.previewDateChange.beforeTitle, /月/);
    assert.equal(scheduleResult.previewDateChange.afterTitle, "9月10日");
    assert.equal(scheduleResult.previewDateChange.draftVisible, true);
    assert.equal(scheduleResult.previewBehavior.scrollable, true);
    assert.equal(scheduleResult.previewBehavior.overflowY, "auto");
    assert.ok(scheduleResult.previewBehavior.autoScrollTop > scheduleResult.previewBehavior.initialScrollTop);
    assert.equal(scheduleResult.previewBehavior.manualScrollApplied, true);
    assert.equal(scheduleResult.previewBehavior.draftVisibleInViewport, true);
    assert.equal(scheduleResult.previewBehavior.draftGhost, true);
    assert.equal(scheduleResult.previewBehavior.currentLineVisible, true);
    assert.equal(scheduleResult.previewBehavior.currentLineInViewport, true);
    assert.match(scheduleResult.previewBehavior.currentLineLabel, /^当前时间 \d{2}:\d{2}$/);
    assert.equal(scheduleResult.previewBehavior.oldTagBlockExists, false);
    assert.equal(scheduleResult.selectedDaySidebarExists, false);
    assert.ok((await fsp.stat(scheduleUi.capturePath)).size > 1000);

    const detailUi = await runElectron({ userData, route: "task-detail", width: 1440, height: 900 });
    const detailLine = detailUi.stdout.split(/\r?\n/).find((item) => item.includes('"scheduleCapture"'));
    assert.ok(detailLine, detailUi.stdout);
    const detailResult = JSON.parse(detailLine).scheduleCapture;
    assert.equal(detailResult.detailOpen, true);
    assert.equal(detailResult.detailPopover.anchored, true);
    assert.equal(detailResult.detailPopover.insideViewport, true);
    assert.equal(detailResult.detailPopover.toolbarAboveTitle, true);
    assert.equal(detailResult.detailPopover.actionsVisible, true);
    assert.ok(detailResult.detailPopover.width <= 400);
    assert.ok(detailResult.detailPopover.height < detailResult.detailPopover.viewportHeight - 100);
    assert.ok((await fsp.stat(detailUi.capturePath)).size > 1000);
  },
);

test(
  "小序设置通过窄 IPC 保存，默认本地城市与运行态可跨重启保留",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-companion-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });

    const probe = await runElectron({ userData, route: "settings-companion", width: 1400, height: 900 });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"companionSettingsProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).companionSettingsProbe;
    assert.equal(result.enabled, true);
    assert.equal(result.city, "上海");
    assert.equal(result.focusDockSeconds, 35);
    assert.equal(result.stateLabel, "已启用");
    assert.ok(["paused", "background"].includes(result.pauseReason));
    assert.equal(result.settingsVisible, true);
    assert.equal(result.saveToastCount, 1);
    assert.equal(result.saveToastDetail, "第二次保存");
    assert.equal(result.shortcutErrorCount, 0);
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);

    const dataFile = path.join(userData, "site-nest-data.json");
    const persisted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(persisted.version, 18);
    assert.equal(persisted.uiSettings.companion.weather.city, "上海");
    assert.ok(Date.parse(persisted.companionRuntimeState.pausedUntil) > Date.now());

    await runElectron({ userData, route: "state-probe" });
    const restarted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(restarted.uiSettings.companion.enabled, true);
    assert.equal(restarted.uiSettings.companion.weather.city, "上海");
    assert.ok(restarted.companionRuntimeState.pausedUntil);
  },
);

test(
  "小序 100 次展开收起和状态转换保持单实例、单调度器与稳定监听器",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-companion-performance-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });
    const probe = await runElectron({ userData, route: "companion-performance" });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"companionPerformanceProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).companionPerformanceProbe;
    assert.equal(result.sameInstance, true);
    assert.equal(result.before.schedulerCount, 1);
    assert.equal(result.after.schedulerCount, 1);
    assert.equal(result.after.powerListeners, result.before.powerListeners);
    assert.deepEqual(result.after.webContents, result.before.webContents);
    assert.ok(result.heapDeltaMiB < 16, `heap delta was ${result.heapDeltaMiB} MiB`);
    assert.equal(result.finalState, "focusedDocked");
  },
);

test(
  "0.5.9 小序悬浮卡片保护命中区域并隔离网页的鼠标与键盘事件",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-companion-discoverability-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });
    const server = http.createServer((_request, response) => {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(`<!doctype html>
        <title>小序验证页</title>
        <style>
          #firstResult { position:fixed; right:18px; bottom:18px; width:286px; height:360px; border:0; background:#eef3ff; }
          #pageSearch { position:fixed; left:40px; top:40px; width:360px; }
        </style>
        <input id="pageSearch" aria-label="网页搜索框">
        <button id="firstResult" type="button">网页第一条结果</button>
        <script>
          globalThis.__qiyeLeakProbe = { documentClicks: 0, documentKeys: 0, documentInputs: 0, firstResultActivations: 0 };
          document.addEventListener('click', () => { globalThis.__qiyeLeakProbe.documentClicks += 1; });
          document.addEventListener('keydown', (event) => {
            globalThis.__qiyeLeakProbe.documentKeys += 1;
            if (event.key?.length === 1) document.getElementById('pageSearch').value += event.key;
          }, true);
          document.addEventListener('input', () => { globalThis.__qiyeLeakProbe.documentInputs += 1; });
          document.getElementById('firstResult').addEventListener('click', () => { globalThis.__qiyeLeakProbe.firstResultActivations += 1; });
        </script>`);
    });
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const address = server.address();
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const probe = await runElectron({ userData, route: "companion-discoverability", width: 1400, height: 900, baseUrl });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"companionDiscoverabilityProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).companionDiscoverabilityProbe;
    assert.equal(result.shell.enabled, false);
    assert.equal(result.shell.shellRailExists, false, JSON.stringify(result));
    assert.equal(result.shell.shellDockExists, false);
    assert.equal(result.shell.shellPanelExists, false);
    assert.equal(result.shell.titlebarDisabled, "true");
    assert.ok(Math.abs(result.shell.browserWidth - result.shell.frameWidth) < 1);
    assert.equal(result.before.hostConnected, true);
    assert.equal(result.before.hostPosition, "fixed");
    assert.equal(result.before.panelOpen, false);
    assert.equal(Math.round(result.before.viewport.width - result.before.orbRect.x - result.before.orbRect.width), 18);
    assert.equal(Math.round(result.before.viewport.height - result.before.orbRect.y - result.before.orbRect.height), 18);
    assert.equal(result.opened.panelOpen, true);
    assert.equal(result.opened.panelLayoutWidth, 360);
    assert.equal(result.opened.tabCount, 0);
    assert.equal(result.opened.inputBoundary, "iframe");
    assert.equal(result.opened.messageAvatarCount, 0);
    assert.equal(result.opened.featureLineCount, 0);
    assert.equal(result.opened.footerCount, 0);
    assert.equal(result.opened.welcomeInConversation, true);
    assert.doesNotMatch(result.opened.welcomeText, /天气、健康和提问都(?:在同一处|可以直接在这里)完成/);
    assert.equal(result.opened.panelOverflowY, "hidden");
    assert.equal(result.opened.conversationOverflowY, "auto");
    assert.equal(result.opened.nestedMessageScrollerCount, 0);
    assert.equal(result.opened.orbEyeCount, 2);
    assert.equal(result.opened.miniEyeCount, 2);
    assert.equal(result.opened.rippling, true);
    assert.equal(result.idle.visualState, "idle");
    assert.equal(result.idle.miniVisualState, "idle");
    assert.equal(result.breathing.visualState, "breathing");
    assert.equal(result.breathing.miniVisualState, "breathing");
    assert.equal(result.focused.visualState, "idle");
    assert.equal(result.focused.panelOpen, true);
    assert.equal(result.fullscreen.visualState, "nap");
    assert.equal(result.fullscreen.miniVisualState, "nap");
    assert.equal(result.fullscreen.panelOpen, false);
    assert.equal(result.happy.visualState, "happy");
    assert.equal(result.happy.miniVisualState, "happy");
    assert.equal(result.finalOpen.panelOpen, true);
    assert.equal(result.conversationPreview.messageAvatarCount, 0);
    assert.ok(result.conversationPreview.conversationMessageCount >= 4);
    assert.equal(result.conversationPreview.latestUserAlignSelf, "flex-end");
    assert.equal(result.conversationPreview.latestAssistantAlignSelf, "flex-start");
    assert.equal(result.conversationPreview.nestedMessageScrollerCount, 0);
    assert.ok(result.conversationPreview.conversationScrollHeight > result.conversationPreview.conversationClientHeight);
    assert.equal(result.conversationPreview.miniVisualState, "happy");
    assert.equal(result.askPane.askFocused, true);
    assert.match(result.typed.askValue, /x/i, JSON.stringify({
      askPane: result.askPane,
      typed: result.typed,
      conversationPreview: result.conversationPreview,
    }));
    assert.match(result.typed.askValue, /9/);
    assert.equal(result.typed.askFocused, true);
    assert.equal(result.pageEvents.documentClicks, 0);
    assert.equal(result.pageEvents.documentKeys, 0);
    assert.equal(result.pageEvents.documentInputs, 0);
    assert.equal(result.pageEvents.firstResultActivations, 0);
    assert.equal(result.pageEvents.pageSearchValue, "");
    assert.notEqual(result.pageEvents.activeElementId, "pageSearch");
    assert.equal(result.hitTargets.orb, "qiye-xiaoxu-widget-host");
    assert.equal(result.hitTargets.ask, "qiye-xiaoxu-widget-host");
  },
);

test(
  "工作和个人波形时间轴独立读取、切换视图、生成任务草稿并持久化",
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
    assert.equal(result.workEventCount, 2);
    assert.equal(result.workNodeCount, 2);
    assert.equal(result.personalNodeCount, 1);
    assert.equal(result.workOnly, true);
    assert.equal(result.personalOnly, true);
    assert.match(result.workPath, /^M/);
    assert.equal(result.listRowCount, 2);
    assert.equal(result.draft.title, "转为时间轴草稿");
    assert.equal(result.draft.summary, "任务备注");
    assert.equal(result.draft.relatedTaskIds.length, 1);
    assert.ok(result.draft.relatedTaskIds[0]);
    assert.equal(result.countBeforeDraft, result.countAfterDraft, "opening a task draft must not auto-save");
    assert.equal(result.searchId, result.addedId);
    assert.equal(result.emptyYearCount, 1, "ongoing responsibility remains visible in later years");
    assert.equal(result.reviewTotal, 2);
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
    assert.equal(persisted.version, 18);
    assert.deepEqual(persisted.timelineTracks.map((track) => track.id), ["work", "personal"]);
    assert.equal(persisted.timelineEvents.filter((event) => !event.deletedAt).length, 3);
    assert.equal(persisted.timelineUiSettings.viewMode, "timeline");
    assert.equal(persisted.localTasks.length, 1);
  },
);

test(
  "习惯打卡通过窄 IPC 原子写入打卡与坚持星并渲染独立热力图",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-habit-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });
    const probe = await runElectron({ userData, route: "habits", width: 1400, height: 900 });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"habitProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).habitProbe;
    assert.equal(result.view, "habits");
    assert.equal(result.stars, 1);
    assert.ok(result.habitId);
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);

    const dataFile = path.join(userData, "site-nest-data.json");
    const persisted = JSON.parse(await fsp.readFile(dataFile, "utf8"));
    assert.equal(persisted.version, 18);
    assert.equal(persisted.habits.length, 1);
    assert.equal(persisted.habitCheckIns.filter((item) => !item.deletedAt).length, 1);
    assert.equal(persisted.rewardLedger.filter((item) => !item.reversedAt).length, 1);
    assert.equal(persisted.rewardLedger[0].habitId, persisted.habits[0].id);
    assert.equal(persisted.habits[0].reminderTime, "20:30");
  },
);

test(
  "内容标签通过窄 IPC 预览合并、迁移引用并无损撤销",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-content-tags-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });
    const probe = await runElectron({ userData, route: "content-tags", width: 1400, height: 900 });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"contentTagProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).contentTagProbe;
    assert.equal(result.affectedTasks, 1);
    assert.equal(result.affectedReferences, 1);
    assert.equal(result.aliasCreated, true);
    assert.equal(result.mergedSourceHidden, true);
    assert.equal(result.undoRecordMarked, true);
    assert.equal(result.sourceRestored, true);
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);

    const persisted = JSON.parse(await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"));
    assert.equal(persisted.version, 18);
    assert.equal(persisted.contentTagGroups.length, 1);
    assert.equal(persisted.contentTags.filter((item) => !item.deletedAt).length, 2);
    assert.equal(persisted.contentTagMergeRecords.length, 1);
    assert.ok(persisted.contentTagMergeRecords[0].undoneAt);
    assert.deepEqual(persisted.localTasks[0].tagIds, [result.sourceTagId]);
  },
);

test(
  "界面动作诊断通过窄 IPC 审计自身 UI 且不扫描外部网页",
  { timeout: 90000 },
  async (t) => {
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-ui-action-integration-"));
    t.after(async () => {
      await fsp.rm(userData, { recursive: true, force: true });
    });
    const probe = await runElectron({ userData, route: "settings-diagnostics", width: 1400, height: 900 });
    const line = probe.stdout.split(/\r?\n/).find((item) => item.includes('"uiActionAuditProbe"'));
    assert.ok(line, probe.stdout);
    const result = JSON.parse(line).uiActionAuditProbe;
    assert.equal(result.totalActions, 89);
    assert.equal(result.registeredActions, 89);
    assert.equal(result.missingHandlers, 0);
    assert.equal(result.invalidIpcChannels, 0);
    assert.equal(result.missingTests, 0);
    assert.equal(result.keyboardInaccessible, 0);
    assert.equal(result.errorCount, 0);
    assert.equal(result.externalWebContentsScanned, false);
    assert.ok((await fsp.stat(probe.capturePath)).size > 1000);
  },
);
