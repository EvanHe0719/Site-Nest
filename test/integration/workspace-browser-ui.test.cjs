const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const test = require("node:test");

const electronPath = require("electron");
const harnessPath = path.resolve(
  __dirname,
  "..",
  "fixtures",
  "workspace-renderer-harness.cjs",
);
const RESULT_PREFIX = "QIYE_WORKSPACE_HARNESS_RESULT:";

function runHarness(scenario, dimensions = {}) {
  return new Promise((resolve, reject) => {
    const userDataPath = fs.mkdtempSync(
      path.join(os.tmpdir(), "qiye-workspace-renderer-"),
    );
    const cleanup = () => {
      fs.rmSync(userDataPath, { recursive: true, force: true });
    };
    const child = spawn(electronPath, [harnessPath], {
      cwd: path.resolve(__dirname, "..", ".."),
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_WORKSPACE_HARNESS_SCENARIO: scenario,
        QIYE_WORKSPACE_HARNESS_WIDTH: String(dimensions.width || 1480),
        QIYE_WORKSPACE_HARNESS_HEIGHT: String(dimensions.height || 920),
        QIYE_WORKSPACE_HARNESS_USER_DATA: userDataPath,
      },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    const timeout = setTimeout(() => {
      child.kill();
      cleanup();
      reject(new Error(`renderer harness timed out (${scenario})`));
    }, 20_000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", (error) => {
      clearTimeout(timeout);
      cleanup();
      reject(error);
    });
    child.on("exit", (code) => {
      clearTimeout(timeout);
      cleanup();
      if (code !== 0) {
        reject(new Error(`renderer harness exited ${code}\n${stderr}\n${stdout}`));
        return;
      }
      const resultLine = stdout
        .split(/\r?\n/)
        .find((line) => line.startsWith(RESULT_PREFIX));
      if (!resultLine) {
        reject(new Error(`renderer harness produced no result\n${stderr}\n${stdout}`));
        return;
      }
      try {
        resolve(JSON.parse(resultLine.slice(RESULT_PREFIX.length)));
      } catch (error) {
        reject(new Error(`invalid renderer harness result: ${error.message}`));
      }
    });
  });
}

function assertEmptyWorkspace(snapshot, workspaceId) {
  assert.equal(snapshot.activeWorkspaceId, workspaceId);
  assert.equal(snapshot.currentRoute, "browser-empty");
  assert.equal(snapshot.currentSite, null);
  assert.equal(snapshot.browserVisible, false);
  assert.equal(snapshot.browserEmptyVisible, true);
  assert.match(snapshot.browserEmptyText, /搜索或输入网址/);
  assert.match(snapshot.browserEmptyText, new RegExp(`${workspaceId === "work" ? "工作" : "研究"}空间打开任意网页`));
}

test("workspace browser state is isolated; unopened workspace is truly empty and a prior workspace restores only its own page", async () => {
  const result = await runHarness("isolation");
  const [workEmpty, personalRestored, researchEmpty] = result.snapshots;

  assertEmptyWorkspace(workEmpty, "work");
  assert.notEqual(workEmpty.addressValue, "https://personal.example.test/stale-event");
  assert.notEqual(workEmpty.browserSnapshot.url, "https://personal.example.test/stale-event");
  assertEmptyWorkspace(researchEmpty, "research");

  assert.equal(personalRestored.activeWorkspaceId, "personal");
  assert.equal(personalRestored.currentRoute, "site:personal-site");
  assert.deepEqual(personalRestored.currentSite, {
    id: "personal-site",
    workspaceId: "personal",
    url: "https://personal.example.test/inside",
  });
  assert.equal(personalRestored.browserVisible, true);
  assert.equal(personalRestored.visibleLocalPage, null);

  assert.equal(result.mountedAfterPersonal.attached, true);
  assert.equal(result.mountedAfterPersonal.workspaceId, "personal");
  assert.equal(result.mountedAfterPersonal.siteId, "personal-site");
  assert.equal(result.mountedAfterPersonal.url, "https://personal.example.test/inside");
  assert.notEqual(result.mountedAfterPersonal.url, "https://work.example.test/ticket");
  assert.equal(result.trace.mounted.attached, false);
  assert.equal(result.trace.mounted.workspaceId, null);
  assert.equal(result.trace.mounted.url, null);

  assert.equal(result.persisted.personal.activeSiteId, "personal-site");
  assert.equal(result.persisted.work.activeSiteId, "work-site");
  assert.equal(result.persisted.research.activeSiteId, null);
});

test("rapid workspace switching is last-intent-wins and stale response/toast cannot restore the earlier workspace", async () => {
  const result = await runHarness("rapid-switch");

  assert.deepEqual(result.trace.workspaceRequests, ["work", "research"]);
  assert.equal(result.backendActiveWorkspaceId, "research");
  assertEmptyWorkspace(result.immediate, "research");
  assert.equal(result.trace.mounted.attached, false);
  assert.equal(result.trace.mounted.url, null);
  assert.ok(result.immediate.toasts.length <= 1, "workspace switch toast must be singular");
  assert.doesNotMatch(result.immediate.toasts.join(" "), /工作/);

  assert.equal(
    result.afterToastLifetime.toasts.length,
    0,
    "workspace switch toast must complete its lifecycle promptly",
  );
  assert.equal(result.afterToastLifetime.activeWorkspaceId, "research");
});

test("legacy Chrome bookmarks navigation resolves to Settings and stays local across workspace switches", async () => {
  const result = await runHarness("local-route-switch");
  const { snapshot } = result;

  assert.equal(snapshot.activeWorkspaceId, "work");
  assert.equal(snapshot.currentRoute, "settings");
  assert.equal(snapshot.currentSite, null);
  assert.equal(snapshot.browserVisible, false);
  assert.equal(snapshot.browserEmptyVisible, false);
  assert.equal(snapshot.visibleLocalPage, "settingsPage");
  assert.equal(result.trace.mounted.attached, false);
});

test("a newer local navigation wins over an in-flight workspace browser restoration", async () => {
  const result = await runHarness("navigation-race");
  const { snapshot } = result;

  assert.deepEqual(result.trace.workspaceRequests, ["work"]);
  assert.equal(snapshot.activeWorkspaceId, "work");
  assert.equal(snapshot.currentRoute, "settings");
  assert.equal(snapshot.currentSite, null);
  assert.equal(snapshot.browserVisible, false);
  assert.equal(snapshot.browserEmptyVisible, false);
  assert.equal(snapshot.visibleLocalPage, "settingsPage");
  assert.equal(result.trace.mounted.attached, false);
});

test("same-site opens deduplicate within a workspace and closing the active/last tab selects a neighbor then shows empty state", async () => {
  const result = await runHarness("tabs-lifecycle");

  assert.equal(result.afterDuplicate.browserSnapshot.tabs.length, 1);
  assert.equal(result.afterDuplicate.tabDom.length, 1);
  assert.equal(result.trace.showBrowser[0].tabId, result.trace.showBrowser[1].tabId);
  assert.equal(result.trace.showBrowser[0].reused, false);
  assert.equal(result.trace.showBrowser[1].reused, true);

  assert.equal(result.afterSecondSite.browserSnapshot.tabs.length, 2);
  assert.equal(result.afterSecondSite.tabDom.length, 2);
  assert.equal(
    new Set(result.afterSecondSite.browserSnapshot.tabs.map((tab) => tab.siteId)).size,
    2,
  );

  assert.equal(result.afterCloseActive.browserSnapshot.tabs.length, 1);
  assert.equal(result.afterCloseActive.browserSnapshot.tabs[0].siteId, "personal-site-two");
  assert.equal(result.afterCloseActive.browserSnapshot.tabs[0].active, true);
  assert.equal(result.afterCloseActive.currentRoute, "site:personal-site-two");
  assert.equal(result.afterCloseActive.currentSite.id, "personal-site-two");
  assert.equal(result.afterCloseActive.browserVisible, true);

  assert.equal(result.afterCloseLast.browserSnapshot.tabs.length, 0);
  assert.equal(result.afterCloseLast.currentRoute, "browser-empty");
  assert.equal(result.afterCloseLast.currentSite, null);
  assert.equal(result.afterCloseLast.browserVisible, false);
  assert.equal(result.afterCloseLast.browserEmptyVisible, true);
  assert.equal(result.trace.mounted.attached, false);
  assert.equal(result.persisted.personal.tabs.length, 0);
});

test("tab groups are isolated by workspace even when two workspace sites use the same URL", async () => {
  const result = await runHarness("tabs-workspace-isolation");
  const personalTab = result.personalBeforeSwitch.browserSnapshot.tabs[0];
  const workTab = result.workTabs.browserSnapshot.tabs[0];

  assert.equal(personalTab.siteId, "personal-site");
  assert.equal(workTab.siteId, "work-shared-site");
  assert.equal(personalTab.url, workTab.url);
  assert.notEqual(personalTab.tabId, workTab.tabId);
  assert.equal(result.personalBeforeSwitch.browserSnapshot.tabs.length, 1);
  assert.equal(result.workTabs.browserSnapshot.tabs.length, 1);

  assert.equal(result.personalRestored.activeWorkspaceId, "personal");
  assert.equal(result.personalRestored.browserSnapshot.tabs.length, 1);
  assert.equal(result.personalRestored.browserSnapshot.tabs[0].tabId, personalTab.tabId);
  assert.equal(result.personalRestored.currentSite.id, "personal-site");
  assert.equal(result.persisted.personal.tabs.length, 1);
  assert.equal(result.persisted.work.tabs.length, 1);
});

test("detaching, focusing and reattaching a tab preserves its identity and renders the detached placeholder", async () => {
  const result = await runHarness("tabs-detach");
  const tabId = result.before.browserSnapshot.activeTabId;
  const opened = result.trace.showBrowser[0];
  const detachAction = result.trace.tabActions.find((item) => item.action === "detach");
  const reattachAction = result.trace.tabActions.find((item) => item.action === "reattach");

  assert.ok(tabId);
  assert.equal(result.detached.browserSnapshot.activeTabId, tabId);
  assert.equal(result.detached.browserSnapshot.tabs.length, 1);
  assert.equal(result.detached.browserSnapshot.tabs[0].detached, true);
  assert.equal(result.detached.browserSnapshot.hasOpenPage, false);
  assert.equal(result.detached.currentRoute, "browser-tabs");
  assert.equal(result.detached.currentSite, null);
  assert.equal(result.detached.browserVisible, true);
  assert.equal(result.detached.noAttachedTab, true);
  assert.match(result.detached.placeholderTitle, /独立窗口/);
  assert.equal(result.detached.tabDom[0].mainAction, "focus");
  assert.equal(result.detached.tabDom[0].windowAction, "close");
  assert.deepEqual(result.trace.focusedDetachedTabs, [tabId]);

  assert.equal(result.reattached.browserSnapshot.activeTabId, tabId);
  assert.equal(result.reattached.browserSnapshot.tabs[0].detached, false);
  assert.equal(result.reattached.browserSnapshot.hasOpenPage, true);
  assert.equal(result.reattached.currentRoute, "site:personal-site");
  assert.equal(result.reattached.currentSite.id, "personal-site");
  assert.equal(result.reattached.noAttachedTab, false);
  assert.equal(opened.webContentsId, detachAction.webContentsId);
  assert.equal(detachAction.webContentsId, reattachAction.webContentsId);
});

test("top and sidebar session menus share duplicate behavior and target inactive tabs without activating them", async () => {
  const result = await runHarness("tabs-copy-ui");
  const topCopies = result.afterTopCopy.browserSnapshot.tabs;
  const sourceIndex = topCopies.findIndex((tab) => tab.tabId === result.menu.sourceTabId);
  const copiedIndex = topCopies.findIndex((tab) => tab.tabId === result.afterTopCopy.browserSnapshot.activeTabId);

  assert.equal(result.menu.targetStayedInactive, true);
  assert.equal(result.menu.htmlMenuStayedHidden, true, "top tabs must use a native menu above WebContentsView");
  assert.deepEqual(
    result.trace.nativeTabContextMenus.map((item) => item.action),
    [null, "duplicate", "copy-url", "open-external", "close"],
  );
  assert.equal(topCopies.length, 3);
  assert.equal(new Set(topCopies.map((tab) => tab.tabId)).size, 3);
  assert.equal(copiedIndex, sourceIndex + 1, "copy must be inserted directly after its source");
  assert.equal(topCopies[sourceIndex].url, topCopies[copiedIndex].url);
  assert.equal(topCopies[sourceIndex].siteId, topCopies[copiedIndex].siteId);
  assert.equal(topCopies[sourceIndex].browserProfileId, topCopies[copiedIndex].browserProfileId);
  assert.equal(topCopies[copiedIndex].active, true);
  assert.deepEqual(result.leftMenu.labels, [
    "复制页签",
    "复制页面链接",
    "在外部浏览器打开",
    "保持运行",
    "立即休眠",
    "添加到新分组",
    "将相同站点页签分组",
    "整理重复页签",
    "恢复最近关闭的页签",
    "关闭页签",
  ]);
  assert.equal(result.afterLeftCopy.browserSnapshot.tabs.length, 4);
  assert.equal(result.trace.tabActions.filter((item) => item.action === "duplicate").length, 2);
  assert.deepEqual(result.trace.copiedTabUrls, [{ tabId: result.menu.sourceTabId, url: topCopies[sourceIndex].url }]);
  assert.deepEqual(result.trace.externalTabUrls, [{ tabId: result.menu.sourceTabId, url: topCopies[sourceIndex].url }]);
  assert.equal(result.afterCloseCopy.browserSnapshot.tabs.length, 3);
  assert.ok(result.afterCloseCopy.browserSnapshot.tabs.some((tab) => tab.tabId === result.menu.sourceTabId));
  assert.ok(!result.afterCloseCopy.browserSnapshot.tabs.some((tab) => tab.tabId === result.afterTopCopy.browserSnapshot.activeTabId));

  assert.equal(result.chrome.version, "0.5.6 DEV");
  assert.equal(result.chrome.hasSidebarChromeNav, false);
  assert.equal(result.chrome.hasSidebarChromeCard, false);
  assert.equal(result.chrome.hasFixedSitesRegion, false);
  assert.equal(result.chrome.pageActionsHidden, false);
  assert.notEqual(result.chrome.pageActionsDisplay, "none");
  assert.equal(result.chrome.pageActionPanelDisplay, "none");
  assert.equal(result.chrome.hasConnectionStrip, false);
  assert.equal(result.chrome.duplicateButtonVisible, false);
  assert.equal(result.chrome.detachLabel, "");
  assert.equal(result.chrome.hasMoreMenu, true);
  assert.equal(result.pageActions.opened.hidden, false);
  assert.notEqual(result.pageActions.opened.display, "none");
  assert.equal(result.pageActions.opened.ariaHidden, "false");
  assert.equal(result.pageActions.opened.expanded, "true");
  assert.equal(result.pageActions.opened.title, "当前页面动作");
  assert.equal(result.pageActions.closed.hidden, true);
  assert.equal(result.pageActions.closed.display, "none");
  assert.equal(result.pageActions.closed.ariaHidden, "true");
  assert.equal(result.pageActions.closed.expanded, "false");
});

test("tab groups stay consistent across top and sidebar UI while drag, collapse, merge and undo preserve live tab identity", async () => {
  const result = await runHarness("tab-groups-ui");
  const { firstTabId, secondTabId, sapGroupId, aiGroupId } = result.created;
  const initialIdentity = new Map(result.initial.browserSnapshot.tabs.map((tab) => [tab.tabId, {
    sessionId: tab.sessionId,
    browserProfileId: tab.browserProfileId,
    webContentsId: tab.webContentsId,
  }]));

  assert.equal(result.grouped.browserSnapshot.tabGroups.length, 2);
  assert.deepEqual(
    result.grouped.tabGroupDom.map((group) => group.groupId).sort(),
    result.grouped.sessionGroupDom.map((group) => group.groupId).sort(),
  );
  assert.equal(
    result.afterDragIntoGroup.browserSnapshot.tabs.find((tab) => tab.tabId === secondTabId).tabGroupId,
    sapGroupId,
  );
  assert.equal(
    result.afterDragOut.browserSnapshot.tabs.find((tab) => tab.tabId === secondTabId).tabGroupId,
    null,
  );

  const collapsedTop = result.collapsed.tabGroupDom.find((group) => group.groupId === sapGroupId);
  const collapsedSide = result.collapsed.sessionGroupDom.find((group) => group.groupId === sapGroupId);
  assert.equal(collapsedTop.collapsed, true);
  assert.deepEqual(collapsedTop.tabIds, []);
  assert.deepEqual(collapsedSide.tabIds, []);
  assert.equal(result.collapsed.browserSnapshot.tabs.length, 2, "collapsed groups keep their sessions alive");

  assert.equal(result.merged.browserSnapshot.tabGroups.length, 1);
  assert.equal(result.merged.browserSnapshot.tabGroups[0].id, sapGroupId);
  assert.deepEqual(
    result.merged.browserSnapshot.tabs.map((tab) => tab.tabGroupId),
    [sapGroupId, sapGroupId],
  );
  const mergedTop = result.merged.tabGroupDom.find((group) => group.groupId === sapGroupId);
  const mergedSide = result.merged.sessionGroupDom.find((group) => group.groupId === sapGroupId);
  assert.deepEqual(mergedTop.tabIds.sort(), [firstTabId, secondTabId].sort());
  assert.deepEqual(mergedSide.tabIds.sort(), [firstTabId, secondTabId].sort());
  for (const tab of result.merged.browserSnapshot.tabs) {
    assert.deepEqual({
      sessionId: tab.sessionId,
      browserProfileId: tab.browserProfileId,
      webContentsId: tab.webContentsId,
    }, initialIdentity.get(tab.tabId));
  }
  assert.equal(result.trace.showBrowser.length, 2, "organizing tabs must not navigate or reload them");
  assert.equal(result.persisted.browserProfiles[0].partition, "persist:qiye-sites");
  assert.deepEqual(result.search, [{
    group: "页签分组",
    title: "SAP",
    detail: "个人 · 2 个页签",
    id: `tab-group:${sapGroupId}`,
  }]);

  assert.equal(result.undone.browserSnapshot.tabGroups.length, 2);
  assert.equal(
    result.undone.browserSnapshot.tabs.find((tab) => tab.tabId === firstTabId).tabGroupId,
    sapGroupId,
  );
  assert.equal(
    result.undone.browserSnapshot.tabs.find((tab) => tab.tabId === secondTabId).tabGroupId,
    aiGroupId,
  );
});

test("current sessions stay cross-workspace, own the released sidebar height and keep the footer visible", async () => {
  const result = await runHarness("sessions-sidebar");

  assert.equal(result.allInWork.activeWorkspaceId, "work");
  assert.equal(result.allInWork.visibility, "all");
  assert.equal(result.allInWork.count, "2");
  assert.equal(result.allInWork.scope, "全部");
  assert.deepEqual(result.allInWork.sessions.map((item) => item.workspace).sort(), ["个人", "工作"]);
  assert.equal(result.allInWork.sessions.filter((item) => item.active).length, 1);
  assert.equal(result.allInWork.hasFixedSitesRegion, false);
  assert.equal(result.allInWork.layout.sectionFlexGrow, "1");
  assert.equal(result.allInWork.layout.listOverflowY, "auto");
  assert.equal(result.allInWork.layout.footerVisible, true);

  assert.equal(result.workOnly.visibility, "workspace");
  assert.equal(result.workOnly.scope, "本空间");
  assert.deepEqual(result.workOnly.sessions.map((item) => item.workspace), ["工作"]);

  assert.equal(result.personalOnly.activeWorkspaceId, "personal");
  assert.deepEqual(result.personalOnly.sessions.map((item) => item.workspace), ["个人"]);
  assert.equal(result.personalOnly.hasFixedSitesRegion, false);

  assert.equal(result.afterClose.persistedTabCounts.personal, 0);
  assert.equal(result.afterClose.persistedTabCounts.work, 1);
  assert.ok(result.afterClose.siteIds.includes("personal-site"), "closing a session must not delete its fixed site");
  assert.equal(result.allAfterClose.visibility, "all");
  assert.deepEqual(result.allAfterClose.sessions.map((item) => item.workspace), ["工作"]);
  assert.equal(result.state.uiSettings.sessionVisibility, "all");
});

test("0.5.5 universal search opens temporary pages without saving sites and keeps one shared navigation path", async () => {
  const result = await runHarness("search-055");

  assert.equal(result.afterEmptySearch.siteCount, result.initialSiteCount);
  assert.equal(result.afterEmptySearch.tabCount, 1, "an empty workspace should receive one tab, not a redundant second tab");
  assert.equal(result.afterEmptySearch.activeTab.siteId, null);
  assert.equal(result.afterEmptySearch.activeTab.workspaceId, "personal");
  assert.equal(result.afterEmptySearch.activeTab.browserProfileId, "default");
  assert.equal(result.afterEmptySearch.activeTab.url, "https://temporary.example.test/path?q=1");
  assert.equal(result.afterEmptySearch.emptyVisible, false);

  assert.ok(result.localGroups.includes("当前会话"));
  assert.ok(result.localGroups.includes("互联网搜索"));
  assert.ok(result.sourceGroups.includes("我的站点"));
  assert.ok(result.sourceGroups.includes("Chrome 书签"));
  assert.ok(result.sourceGroups.includes("计划任务"));
  assert.ok(result.sourceGroups.includes("互联网搜索"));
  assert.deepEqual(result.noLocal.map((item) => item.group), ["互联网搜索"]);
  assert.ok(result.directGroups.includes("直接打开网址"));
  assert.ok(result.directGroups.includes("互联网搜索"));

  assert.equal(result.afterGlobalSearch.paletteHidden, true);
  assert.equal(result.afterGlobalSearch.tabCount, 2, "global search over a normal page should open a new tab");
  assert.equal(result.afterGlobalSearch.activeTab.workspaceId, "personal");
  assert.equal(result.afterGlobalSearch.activeTab.browserProfileId, "default");
  assert.equal(result.afterGlobalSearch.activeTab.url, "https://www.bing.com/search?q=quarterly%20forecast");
  assert.equal(result.afterGlobalSearch.defaultEngineId, "google", "temporary engine selection must not replace the default");
  assert.equal(result.afterGlobalSearch.siteCount, result.initialSiteCount);
  assert.equal(result.afterGlobalSearch.history[0].text, "quarterly forecast");
  assert.equal(result.afterGlobalSearch.history[0].engineId, "bing");
  assert.equal(result.escapeClosed, true);
  assert.equal(result.historyMaintenance.afterRemove, 1);
  assert.equal(result.historyMaintenance.afterClear, 0);
  assert.equal(result.historyMaintenance.afterDisabledSearch, 0);
  assert.equal(result.historyMaintenance.siteCount, result.initialSiteCount);
  assert.equal(result.historyMaintenance.bookmarkCount, 2);
  assert.equal(result.trace.searchActions.length, 3, "only the three confirmed submissions may navigate; typing must stay local");
  assert.equal(result.trace.searchActions[0].disposition, "current");
  assert.equal(result.trace.searchActions[1].disposition, "new");
  assert.equal(result.trace.mounted.attached, true, "closing the palette must restore the transient tab view");
  assert.equal(result.persisted.sites.length, result.initialSiteCount);
});

test("0.5.5 settings mounts one category, lazy-loads Zoho, searches the registry and honors dirty forms", async () => {
  const result = await runHarness("settings-055");

  assert.equal(result.initial.route, "settings");
  assert.equal(result.initial.section, "general");
  assert.deepEqual(result.initial.mountedSections, ["general"]);
  assert.deepEqual(result.initial.navigation, [
    "常规", "搜索与新标签页", "快捷键", "浏览与性能", "翻译", "计划与通知", "连接与集成", "账号与同步", "数据与备份", "开发与诊断", "关于",
  ]);
  assert.equal(result.initial.zohoMounted, false);
  assert.equal(result.initial.contentOverflowY, "auto");

  assert.deepEqual(result.connectionsCollapsed.mountedSections, ["connections"]);
  assert.equal(result.connectionsCollapsed.zohoMounted, false, "the heavy connector form must not mount by default");
  assert.match(result.connectionsCollapsed.summary, /配置已保存/);
  assert.equal(result.zohoExpanded.mounted, true);
  assert.equal(result.zohoExpanded.hidden, false);
  assert.equal(result.zohoExpanded.expanded, "true");
  assert.equal(result.zohoExpanded.orgId, "123456789");
  assert.equal(result.zohoExpanded.displayName, "Zoho Desk 测试配置");
  assert.equal(result.blockedDirtySwitch, "connections");
  assert.equal(result.persistedSection, "search");
  assert.equal(result.settingsSearch.hidden, false);
  assert.match(result.settingsSearch.labels.join(" "), /Zoho Desk/);
  assert.equal(result.searchLocated.section, "connections");
  assert.equal(result.searchLocated.zohoMounted, true);
  assert.equal(result.searchLocated.expanded, "true");
  assert.equal(result.searchLocated.orgId, "unsaved-org", "detaching a settings category must not discard an unsaved form");
  assert.equal(result.emptySearchText, "没有匹配的已实现设置");
  assert.equal(result.legacyRoute.route, "settings");
  assert.equal(result.legacyRoute.section, "connections");
  assert.equal(result.legacyRoute.zohoMounted, true);
  assert.equal(result.historyBackSection, "search");
  assert.equal(result.shortcutInitial.section, "shortcuts");
  assert.ok(result.shortcutInitial.bindingCount > 20);
  assert.ok(result.shortcutInitial.categoryCount >= 6);
  assert.equal(result.shortcutInitial.searchAccelerator, "Ctrl+K");
  assert.ok(result.shortcutInitial.visibleGroups >= 6);
  assert.equal(result.shortcutModified.globalSearchOpen, true);
  assert.equal(result.shortcutModified.accelerator, "Ctrl+Shift+J");
  assert.equal(result.shortcutModified.stateLabel, "已修改");
  assert.ok(result.shortcutModified.persistedBindings >= 1);
  assert.equal(result.shortcutReset.accelerator, "Ctrl+K");
  assert.equal(result.shortcutReset.isDefault, true);
  assert.equal(result.shortcutReset.renderedAccelerator, "Ctrl+K");
  assert.equal(result.shortcutReset.renderedState, "默认");

  const narrow = await runHarness("settings-055", { width: 900, height: 760 });
  assert.notEqual(narrow.initial.mobileSelectDisplay, "none");
});

test("dragend with zero Windows coordinates falls back to the last real drag point and detaches", async () => {
  const result = await runHarness("tabs-drag-fallback");
  const detach = result.trace.tabActions.find((item) => item.action === "detach");

  assert.ok(detach, "the drag gesture must invoke detach even when dragend reports 0,0");
  assert.equal(result.snapshot.browserSnapshot.tabs.length, 1);
  assert.equal(result.snapshot.browserSnapshot.tabs[0].detached, true);
  assert.equal(result.snapshot.noAttachedTab, true);
});

test("Google sync card exposes the full account flow and rerenders cloud-restored state", async () => {
  const result = await runHarness("google-sync-ui");

  assert.equal(result.initial.configured, true);
  assert.equal(result.initial.signedIn, true);
  assert.equal(result.initial.cardTitle, "evanhe0719@gmail.com · Beta");
  assert.match(result.initial.cardSubtitle, /Drive 未授权/);
  assert.equal(result.initial.popoverHidden, true);

  assert.equal(result.open.popoverHidden, false);
  assert.equal(result.open.cardExpanded, "true");
  assert.equal(result.open.buttons.signInVisible, true);
  assert.equal(result.open.buttons.signInDisabled, false);
  assert.equal(result.open.buttons.syncVisible, false);
  assert.equal(result.open.identityStatus, "已登录");
  assert.equal(result.open.driveStatus, "未授权");
  assert.match(result.open.notice, /不会接管 Chrome 官方同步/);

  assert.equal(result.connected.signedIn, true);
  assert.equal(result.connected.cardTitle, "evan@example.com · Beta");
  assert.equal(result.connected.account, "evan@example.com");
  assert.equal(result.connected.identityStatus, "已登录");
  assert.equal(result.connected.driveStatus, "已就绪");
  assert.equal(result.connected.buttons.signInVisible, false);
  assert.equal(result.connected.buttons.syncVisible, true);
  assert.equal(result.connected.buttons.restoreVisible, true);
  assert.equal(result.connected.buttons.signOutVisible, true);
  assert.equal(result.connected.buttons.testVisible, true);

  assert.match(result.synced.cardSubtitle, /上次同步/);
  assert.match(result.synced.lastSync, /上次同步/);
  assert.match(result.synced.toasts.join(" "), /Google 同步完成/);

  assert.ok(result.restored.siteIds.includes("cloud-restored-site"));
  assert.match(result.restored.toasts.join(" "), /已从云端恢复/);
  assert.ok(result.state.sites.some((site) => site.id === "cloud-restored-site"));

  assert.equal(result.signedOut.signedIn, false);
  assert.equal(result.signedOut.cardTitle, "连接 Google · Beta");
  assert.equal(result.signedOut.popoverHidden, true);
  assert.equal(result.signedOut.cardExpanded, "false");
  assert.match(result.signedOut.toasts.join(" "), /已退出 Google/);
  assert.deepEqual(result.trace.googleActions, ["sign-in", "sync", "restore", "sign-out"]);
});

test("Google sync renders record conflicts without offering unsafe whole-dataset overwrite", async () => {
  const result = await runHarness("google-sync-conflict-ui");
  assert.equal(result.conflict.driveStatus, "存在同步冲突");
  assert.match(result.conflict.toasts.join(" "), /发现记录冲突/);
  assert.equal(result.details.status, "conflict");
  assert.match(result.details.text, /task-work-report/);
  assert.match(result.details.text, /title/);
  assert.equal(result.details.hasUnsafeOverwriteButtons, false);
  assert.deepEqual(result.trace.googleActions, ["sign-in", "sync", "conflict:details"]);
});

test("Chrome bookmarks live in Settings, legacy and home entries focus the module, and explicit maintenance preserves then clears data", async () => {
  const result = await runHarness("chrome-bookmarks-settings");

  assert.equal(result.initial.bookmarkCount, 2);
  assert.equal(result.initial.importProfile, "Evan");
  assert.equal(result.initial.hasSidebarChromeNav, false);
  assert.equal(result.initial.hasSidebarChromeCard, false);
  assert.equal(result.initial.hasFixedSitesRegion, false);
  assert.equal(result.initial.hasSettingsModule, true);
  assert.equal(result.initial.footerItems.length, 3, "footer should contain heading, Google and Settings only");

  assert.equal(result.legacyRoute.route, "settings");
  assert.equal(result.legacyRoute.visiblePage, "settingsPage");
  assert.equal(result.legacyRoute.focusedSection, true);
  assert.equal(result.legacyRoute.profile, "Evan");
  assert.equal(result.legacyRoute.count, "2 个书签");
  assert.equal(result.legacyRoute.status, "已读取");
  assert.equal(result.legacyRoute.listCount, 2);

  assert.equal(result.homeEntry.route, "settings");
  assert.equal(result.homeEntry.visiblePage, "settingsPage");
  assert.equal(result.homeEntry.focusedSection, true);
  assert.equal(result.afterImport.bookmarkCount, 2);
  assert.equal(result.afterImport.profile, "Evan");
  assert.equal(result.afterImport.status, "已读取");
  assert.deepEqual(result.trace.chromeActions, ["import:Default", "clear"]);
  assert.equal(result.afterClear.bookmarkCount, 0);
  assert.equal(result.afterClear.importMeta, null);
});

for (const dimensions of [
  { width: 1480, height: 920 },
  { width: 1060, height: 700 },
]) {
  test(`browser bounds stay inside the measured sidebar and compact top chrome at ${dimensions.width}x${dimensions.height}`, async () => {
    const result = await runHarness("layout", dimensions);
    const { metrics } = result;
    const shown = result.trace.showBrowser.at(-1);

    assert.equal(metrics.viewport.width, dimensions.width);
    assert.equal(metrics.viewport.height, dimensions.height);
    assert.ok(metrics.sidebar.width > 0);
    assert.ok(metrics.frame.width > 0);
    assert.ok(metrics.frame.height > 0);
    assert.ok(
      metrics.frame.x >= metrics.sidebar.right - 1,
      `frame x ${metrics.frame.x} overlaps sidebar right ${metrics.sidebar.right}`,
    );
    assert.ok(metrics.frame.right <= metrics.viewport.width + 1);
    assert.ok(metrics.frame.bottom <= metrics.viewport.height + 1);
    assert.ok(metrics.tabbar.height <= 40);
    assert.ok(metrics.toolbar.height <= 52);
    assert.ok(
      Math.abs(metrics.frame.y - metrics.toolbar.bottom) <= 1,
      "webview frame must start immediately below the toolbar without a connection strip",
    );

    assert.ok(shown, "showBrowser must receive measured renderer bounds");
    assert.equal(shown.bounds.x, Math.round(metrics.frame.x));
    assert.equal(shown.bounds.y, Math.round(metrics.frame.y));
    assert.equal(shown.bounds.width, Math.round(metrics.frame.width));
    assert.equal(shown.bounds.height, Math.round(metrics.frame.height));
  });
}

test("collapsed sidebar rail persists and sends the remeasured WebContentsView bounds", async () => {
  const result = await runHarness("sidebar-collapse", { width: 1060, height: 700 });
  const { collapsed, collapsedBounds, afterReload } = result;

  assert.equal(collapsed.collapsed, true);
  assert.equal(collapsed.stored, "true");
  assert.equal(collapsed.ariaExpanded, "false");
  assert.equal(collapsed.title, "展开侧栏");
  assert.ok(
    Math.abs(collapsed.sidebar.width - 72) <= 1,
    `collapsed sidebar is ${collapsed.sidebar.width}px instead of the 72px rail`,
  );
  assert.ok(collapsed.frame.x >= collapsed.sidebar.right - 1);
  assert.ok(collapsedBounds, "sidebar transition must emit fresh browser bounds");
  assert.equal(collapsedBounds.x, Math.round(collapsed.frame.x));
  assert.equal(collapsedBounds.y, Math.round(collapsed.frame.y));
  assert.equal(collapsedBounds.width, Math.round(collapsed.frame.width));
  assert.equal(collapsedBounds.height, Math.round(collapsed.frame.height));

  assert.equal(afterReload.collapsed, true);
  assert.equal(afterReload.stored, "true");
  assert.equal(afterReload.ariaExpanded, "false");
  assert.equal(afterReload.title, "展开侧栏");
  assert.ok(Math.abs(afterReload.sidebarWidth - 72) <= 1);
});
