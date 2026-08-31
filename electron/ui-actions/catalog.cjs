const { UIActionExecutionError } = require("./execution-service.cjs");
const { UIActionRegistry } = require("./registry.cjs");

const UI_ACTION_CATALOG = Object.freeze([
  ["browser.back", "后退", "browsing"],
  ["browser.forward", "前进", "browsing"],
  ["browser.reload", "刷新网页", "browsing"],
  ["browser.navigate", "打开地址", "browsing"],
  ["tab.reattach", "合回空间", "sessions"],
  ["site.save", "保存站点", "sites"],
  ["site.open", "打开站点", "sites"],
  ["site.delete", "删除站点", "sites"],
  ["session.activate", "激活当前会话", "sessions"],
  ["session.close", "关闭当前会话", "sessions"],
  ["tab.duplicate", "复制页签", "tabs"],
  ["tab.detach", "拆分页签", "tabs"],
  ["tab-group.create", "新建页签组", "tab-groups"],
  ["tab-group.merge", "合并页签组", "tab-groups"],
  ["search.open", "打开全局搜索", "search"],
  ["search.submit", "执行全局搜索", "search"],
  ["automation.naixi.run", "执行奶昔签到", "automation"],
  ["userscript.import-file", "导入本地网页脚本", "userscripts"],
  ["userscript.review-remote", "检查远程网页脚本", "userscripts"],
  ["userscript.review-pasted", "检查粘贴网页脚本", "userscripts"],
  ["userscript.install", "安装网页脚本", "userscripts"],
  ["zoho.config.save", "保存 Zoho 配置", "zoho"],
  ["zoho.connect", "连接 Zoho Desk", "zoho"],
  ["zoho.disconnect", "断开 Zoho Desk", "zoho"],
  ["zoho.dashboard.refresh", "刷新 Zoho 工单分诊台", "zoho"],
  ["settings.notifications.save", "保存通知设置", "settings"],
  ["settings.browser-memory.save", "保存网页内存设置", "settings"],
  ["translation.test", "测试翻译连接", "translation"],
  ["translation.secret.clear", "清除翻译密钥", "translation"],
  ["translation.config.save", "保存翻译设置", "translation"],
  ["translation.page", "翻译当前页面", "translation"],
  ["chrome-bookmarks.refresh", "重新读取 Chrome 书签", "bookmarks"],
  ["chrome-bookmarks.choose-profile", "选择 Chrome Profile", "bookmarks"],
  ["chrome-bookmarks.clear", "清理 Chrome 导入记录", "bookmarks"],
  ["chrome-bookmarks.import-confirm", "确认导入 Chrome 书签", "bookmarks"],
  ["resources.scan", "扫描页面资源", "downloads"],
  ["resources.detect-network", "检测网络资源", "downloads"],
  ["download.resource", "下载页面资源", "downloads"],
  ["print.current", "打印当前页面", "print"],
  ["notification.snooze", "延后桌面通知", "notifications"],
  ["page-action.execute", "执行当前页面动作", "automation"],
  ["google.sign-in", "授权 Google 云同步", "google"],
  ["google.sync", "立即同步 Google 数据", "google"],
  ["task.delete", "删除任务", "tasks"],
  ["task.save", "保存任务", "tasks"],
  ["timeline.delete", "删除时间线记录", "timeline"],
  ["timeline.save", "保存时间线记录", "timeline"],
  ["timeline.export", "导出时间线", "timeline"],
  ["habit.delete", "删除长期目标", "habits"],
  ["habit.save", "保存长期目标", "habits"],
  ["habit.check-in", "保存习惯打卡", "habits"],
  ["habit-checkin.delete", "撤销习惯打卡", "habits"],
  ["content-tag.save", "保存内容标签", "content-tags"],
  ["content-tag.merge", "合并内容标签", "content-tags"],
  ["settings.search.save", "保存搜索设置", "settings"],
  ["diagnostics.audit.refresh", "刷新界面动作审计", "diagnostics"],
].map(([id, label, domain]) => Object.freeze({ id, label, domain })));

const UI_ACTION_IDS = Object.freeze(UI_ACTION_CATALOG.map((action) => action.id));

async function dispatchRegisteredAction({ actionId, input, context }) {
  if (typeof context?.dispatch !== "function") {
    throw new UIActionExecutionError(
      `动作 ${actionId} 只能由已绑定的栖页界面控件执行`,
      "UI_ACTION_RENDERER_DISPATCH_REQUIRED",
    );
  }
  const result = await context.dispatch(actionId, input);
  if (!result || typeof result !== "object" || result.ok !== true) {
    throw new UIActionExecutionError(
      result?.message || `动作 ${actionId} 未返回真实成功结果`,
      result?.errorCode || "UI_ACTION_INVALID_RESULT",
    );
  }
  return result;
}

function createUIActionRegistry() {
  return new UIActionRegistry(UI_ACTION_CATALOG.map((action) => ({
    ...action,
    execute: dispatchRegisteredAction,
    successResult: (result) => result,
    errorMapping: {
      UI_ACTION_RENDERER_DISPATCH_REQUIRED: {
        errorCode: "UI_ACTION_RENDERER_DISPATCH_REQUIRED",
        message: "该动作必须从已绑定的栖页界面执行",
        retryable: false,
        actionStatus: "unavailable",
      },
    },
  })));
}

module.exports = {
  UI_ACTION_CATALOG,
  UI_ACTION_IDS,
  createUIActionRegistry,
  dispatchRegisteredAction,
};
