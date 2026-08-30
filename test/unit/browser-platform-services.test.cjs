const assert = require("node:assert/strict");
const test = require("node:test");

const {
  DEFAULT_SEARCH_URL,
  resolveNavigationTarget,
  securityStateForUrl,
} = require("../../electron/browser/navigation-target.cjs");
const {
  ExternalProtocolService,
} = require("../../electron/browser/external-protocol-service.cjs");
const {
  WindowOpenPolicyService,
  hostnameMatches,
  normalizeSitePopupPolicies,
} = require("../../electron/browser/window-open-policy-service.cjs");
const {
  WebContextMenuService,
} = require("../../electron/browser/web-context-menu-service.cjs");
const {
  sanitizeDownloadFilename,
} = require("../../electron/browser/download-manager.cjs");

function fakeWebContents(overrides = {}) {
  return {
    getURL: () => "https://example.com/page",
    isLoading: () => false,
    navigationHistory: {
      canGoBack: () => true,
      canGoForward: () => false,
    },
    ...overrides,
  };
}

function menuLabels(template) {
  return template.filter((item) => item.type !== "separator").map((item) => item.label);
}

test("address navigation opens URLs directly, searches text, and rejects javascript URLs", () => {
  assert.deepEqual(resolveNavigationTarget("example.com/docs").kind, "url");
  assert.equal(resolveNavigationTarget("https://example.com/docs").url, "https://example.com/docs");
  const search = resolveNavigationTarget("采购退货 单位");
  assert.equal(search.kind, "search");
  assert.equal(new URL(search.url).searchParams.get("q"), "采购退货 单位");
  assert.match(DEFAULT_SEARCH_URL, /\{query\}/);
  assert.throws(() => resolveNavigationTarget("javascript:alert(1)"), /不允许/);
  assert.throws(() => resolveNavigationTarget("file:///C:/Windows/win.ini"), /不允许/);
});

test("browser security state distinguishes HTTPS, HTTP and malformed pages", () => {
  assert.equal(securityStateForUrl("https://example.com"), "secure");
  assert.equal(securityStateForUrl("http://example.com"), "insecure");
  assert.equal(securityStateForUrl("not a url"), "unknown");
});

test("popup policy recognizes login, POST, background tabs, ad popups and explicit overrides", () => {
  const policies = normalizeSitePopupPolicies([
    {
      hostnamePattern: "*.hana.ondemand.com",
      mode: "popup",
      preserveOpener: true,
      allowPost: true,
      allowedRedirectOrigins: ["https://accounts.sap.com/path", "javascript:bad"],
    },
  ]);
  assert.equal(hostnameMatches("login.eu10.hana.ondemand.com", "*.hana.ondemand.com"), true);
  assert.deepEqual(policies[0].allowedRedirectOrigins, ["https://accounts.sap.com"]);
  const service = new WindowOpenPolicyService({ getPolicies: () => policies });
  assert.equal(service.classify({ url: "https://accounts.google.com/o/oauth2/auth" }).kind, "popup");
  assert.equal(service.classify({ url: "https://example.com/post", postBody: {} }).kind, "popup");
  assert.equal(service.classify({ url: "https://example.com/item", disposition: "background-tab" }).kind, "background-tab");
  assert.equal(service.classify({ url: "https://adservice.google.com/page" }).kind, "block");
  assert.equal(service.classify({ url: "mailto:test@example.com" }).kind, "external-protocol");
});

test("a policy that disallows POST blocks the form window instead of dropping its body", () => {
  const service = new WindowOpenPolicyService({
    getPolicies: () => [{
      hostnamePattern: "login.example.com",
      mode: "tab",
      preserveOpener: false,
      allowPost: false,
      allowedRedirectOrigins: [],
    }],
  });
  const decision = service.classify({
    url: "https://login.example.com/sso",
    postBody: { data: [{ bytes: Buffer.from("assertion=secret") }] },
  });
  assert.equal(decision.kind, "block");
  assert.equal(decision.reason, "post-not-allowed-by-policy");
});

test("web context menu is contextual and never offers translation or search for password fields", () => {
  const clipboardWrites = [];
  const service = new WebContextMenuService({
    Menu: { buildFromTemplate: (template) => ({ template }) },
    clipboard: { writeText: (value) => clipboardWrites.push(value) },
    actions: {},
  });
  const webContents = fakeWebContents();
  const selection = menuLabels(service.buildTemplate(webContents, {
    selectionText: "selected text",
    isEditable: false,
    inputFieldType: "none",
  }));
  assert.deepEqual(selection.slice(0, 3), ["复制", "翻译选中文字", "搜索选中文字"]);

  const password = menuLabels(service.buildTemplate(webContents, {
    selectionText: "never expose this",
    isEditable: true,
    inputFieldType: "password",
    editFlags: {},
  }));
  assert.ok(password.includes("复制"));
  assert.ok(!password.includes("翻译选中文字"));
  assert.ok(!password.includes("搜索选中文字"));
  assert.ok(!JSON.stringify(password).includes("never expose this"));
});

test("link, media and ordinary page menus expose only fixed allowlisted commands", () => {
  const service = new WebContextMenuService({
    Menu: { buildFromTemplate: (template) => ({ template }) },
    clipboard: { writeText: () => undefined },
    actions: {},
  });
  const webContents = fakeWebContents();
  assert.deepEqual(menuLabels(service.buildTemplate(webContents, {
    linkURL: "https://example.com/link",
    linkText: "Example",
  })), ["在当前页打开", "在新页签打开", "在外部浏览器打开", "复制链接", "复制链接文字"]);
  assert.deepEqual(menuLabels(service.buildTemplate(webContents, {
    srcURL: "https://example.com/video.mp4",
    mediaType: "video",
  })), ["复制资源地址", "在新页签打开", "在外部浏览器打开", "检测可下载资源"]);
  assert.deepEqual(menuLabels(service.buildTemplate(webContents, {})), [
    "后退",
    "前进",
    "重新加载",
    "复制页面地址",
    "翻译本页",
    "添加到我的站点",
    "当前页面动作",
  ]);
});

test("external protocols auto-open only mail and phone while unknown schemes require confirmation", async () => {
  const opened = [];
  const prompts = [];
  const service = new ExternalProtocolService({
    shell: { openExternal: async (url) => opened.push(url) },
    dialog: {
      showMessageBox: async (...args) => {
        prompts.push(args);
        return { response: 1 };
      },
    },
  });
  assert.equal((await service.open("mailto:test@example.com")).opened, true);
  assert.equal((await service.open("custom-app://open/item")).prompted, true);
  assert.equal((await service.open("javascript:alert(1)")).opened, false);
  assert.deepEqual(opened, ["mailto:test@example.com", "custom-app://open/item"]);
  assert.equal(prompts.length, 1);
});

test("download filenames are sanitized before a save dialog is shown", () => {
  assert.equal(sanitizeDownloadFilename('report<final>:2026?.pdf'), "report_final__2026_.pdf");
  assert.equal(sanitizeDownloadFilename("..."), "download");
});
