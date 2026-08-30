const { resolveNavigationTarget } = require("./navigation-target.cjs");

function compactSeparators(items) {
  const result = [];
  for (const item of items) {
    if (!item) continue;
    if (item.type === "separator") {
      if (!result.length || result.at(-1)?.type === "separator") continue;
    }
    result.push(item);
  }
  while (result.at(-1)?.type === "separator") result.pop();
  return result;
}

function safeWebUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.toString() : "";
  } catch {
    return "";
  }
}

class WebContextMenuService {
  constructor({ Menu, clipboard, searchUrlTemplate, actions = {} }) {
    this.Menu = Menu;
    this.clipboard = clipboard;
    this.searchUrlTemplate = searchUrlTemplate;
    this.actions = /** @type {Record<string, (...args: any[]) => any>} */ (actions);
  }

  buildTemplate(webContents, params = {}, context = {}) {
    const pageUrl = safeWebUrl(context.url || webContents.getURL());
    const linkUrl = safeWebUrl(params.linkURL);
    const resourceUrl = safeWebUrl(params.srcURL);
    const mediaType = String(params.mediaType || "none");
    const isMedia = Boolean(resourceUrl && ["image", "audio", "video"].includes(mediaType));
    const isPassword = String(params.inputFieldType || "").toLowerCase() === "password";
    const hasSelection = Boolean(String(params.selectionText || "").trim()) && !isPassword;

    if (params.isEditable) {
      return compactSeparators([
        { label: "撤销", role: "undo", enabled: params.editFlags?.canUndo !== false },
        { label: "重做", role: "redo", enabled: params.editFlags?.canRedo !== false },
        { type: "separator" },
        { label: "剪切", role: "cut", enabled: params.editFlags?.canCut !== false },
        { label: "复制", role: "copy", enabled: params.editFlags?.canCopy !== false },
        { label: "粘贴", role: "paste", enabled: params.editFlags?.canPaste !== false },
        { label: "粘贴为纯文本", role: "pasteAndMatchStyle", enabled: params.editFlags?.canPaste !== false },
        { type: "separator" },
        { label: "全选", role: "selectAll", enabled: params.editFlags?.canSelectAll !== false },
      ]);
    }

    if (hasSelection) {
      return compactSeparators([
        { label: "复制", role: "copy" },
        {
          label: "翻译选中文字",
          click: () => this.actions.translateSelection?.({
            text: String(params.selectionText),
            pageUrl,
            context,
          }),
        },
        {
          label: "搜索选中文字",
          click: () => {
            const target = resolveNavigationTarget(String(params.selectionText), {
              searchUrlTemplate: this.searchUrlTemplate,
            });
            return this.actions.openTab?.(target.url, { source: "selection-search", context });
          },
        },
        { type: "separator" },
        {
          label: "复制页面链接",
          enabled: Boolean(pageUrl),
          click: () => this.clipboard.writeText(pageUrl),
        },
        {
          label: "在外部浏览器打开",
          enabled: Boolean(pageUrl),
          click: () => this.actions.openExternal?.(pageUrl),
        },
      ]);
    }

    if (linkUrl) {
      return compactSeparators([
        { label: "在当前页打开", click: () => this.actions.navigateCurrent?.(linkUrl, context) },
        { label: "在新页签打开", click: () => this.actions.openTab?.(linkUrl, { source: "link", context }) },
        { label: "在外部浏览器打开", click: () => this.actions.openExternal?.(linkUrl) },
        { type: "separator" },
        { label: "复制链接", click: () => this.clipboard.writeText(linkUrl) },
        {
          label: "复制链接文字",
          enabled: Boolean(String(params.linkText || "").trim()),
          click: () => this.clipboard.writeText(String(params.linkText || "")),
        },
      ]);
    }

    if (isMedia) {
      return compactSeparators([
        { label: "复制资源地址", click: () => this.clipboard.writeText(resourceUrl) },
        { label: "在新页签打开", click: () => this.actions.openTab?.(resourceUrl, { source: "media", context }) },
        { label: "在外部浏览器打开", click: () => this.actions.openExternal?.(resourceUrl) },
        { type: "separator" },
        { label: "检测可下载资源", click: () => this.actions.inspectResource?.({ url: resourceUrl, mediaType, context }) },
      ]);
    }

    const navigation = webContents.navigationHistory;
    const isLoading = webContents.isLoading();
    return compactSeparators([
      { label: "后退", enabled: Boolean(navigation?.canGoBack()), click: () => this.actions.browserAction?.("back", context) },
      { label: "前进", enabled: Boolean(navigation?.canGoForward()), click: () => this.actions.browserAction?.("forward", context) },
      isLoading
        ? { label: "停止加载", click: () => this.actions.browserAction?.("stop", context) }
        : { label: "重新加载", click: () => this.actions.browserAction?.("reload", context) },
      { type: "separator" },
      {
        label: "复制页面地址",
        enabled: Boolean(pageUrl),
        click: () => this.clipboard.writeText(pageUrl),
      },
      { label: "翻译本页", enabled: Boolean(pageUrl), click: () => this.actions.translatePage?.({ pageUrl, context }) },
      { label: "添加到我的站点", enabled: Boolean(pageUrl), click: () => this.actions.addCurrentPage?.({ pageUrl, context }) },
      { label: "当前页面动作", enabled: Boolean(pageUrl), click: () => this.actions.openPageActions?.({ pageUrl, context }) },
    ]);
  }

  popup(webContents, params, context = {}, ownerWindow) {
    const menu = this.Menu.buildFromTemplate(this.buildTemplate(webContents, params, context));
    menu.popup({ window: ownerWindow || undefined });
  }
}

module.exports = {
  WebContextMenuService,
  compactSeparators,
  safeWebUrl,
};
