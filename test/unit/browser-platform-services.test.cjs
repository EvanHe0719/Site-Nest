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
  isAuthenticationUrl,
  normalizeSitePopupPolicies,
} = require("../../electron/browser/window-open-policy-service.cjs");
const {
  durableBrowserUrl,
  isZohoDeskUrl,
  zohoDeskAuthReturnUrl,
} = require("../../electron/browser/zoho-auth-return.cjs");
const {
  WebContextMenuService,
} = require("../../electron/browser/web-context-menu-service.cjs");
const {
  sanitizeDownloadFilename,
} = require("../../electron/browser/download-manager.cjs");
const {
  ManagedPopupService,
  sanitizeNavigationUrl,
} = require("../../electron/browser/managed-popup-service.cjs");
const {
  standardChromiumUserAgent,
} = require("../../electron/browser/browser-user-agent.cjs");

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

test("embedded pages receive a standard ASCII Chromium user agent without the packaged product token", () => {
  const packaged = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    + "AppleWebKit/537.36 (KHTML, like Gecko) 栖页/0.5.4 "
    + "Chrome/152.0.7977.54 Safari/537.36 Electron/44.0.2";
  const normalized = standardChromiumUserAgent(packaged);

  assert.equal(
    normalized,
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
      + "AppleWebKit/537.36 (KHTML, like Gecko) "
      + "Chrome/152.0.7977.54 Safari/537.36",
  );
  assert.doesNotMatch(normalized, /栖页|Electron|site-nest-desktop/);
  assert.match(normalized, /^[\x20-\x7e]+$/);
});

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

test("authentication URLs are identified for lifecycle protection without fuzzy page content", () => {
  assert.equal(isAuthenticationUrl("https://accounts.sap.com/saml2/idp/sso"), true);
  assert.equal(isAuthenticationUrl("https://example.com/oauth/authorize"), true);
  assert.equal(isAuthenticationUrl("https://example.com/articles/login-performance"), false);
});

test("Zoho relogin refresh returns to the trusted Desk service URL", () => {
  const ticketUrl = "https://desk.zoho.com.cn/agent/customerportal/techsonic-1/tickets/details/17352000003150132";
  const relogin = `https://accounts.zoho.com.cn/account/v1/relogin?serviceurl=${encodeURIComponent(ticketUrl)}&servicename=ZohoSupport`;
  assert.equal(zohoDeskAuthReturnUrl(relogin), ticketUrl);
  assert.equal(durableBrowserUrl(relogin), ticketUrl);
  assert.equal(durableBrowserUrl("http://localhost:3000/work"), "http://localhost:3000/work");
  assert.equal(isZohoDeskUrl(ticketUrl), true);
});

test("Zoho relogin return targets reject non-Desk, insecure and lookalike hosts", () => {
  const wrap = (target, host = "accounts.zoho.com.cn") =>
    `https://${host}/account/v1/relogin?serviceurl=${encodeURIComponent(target)}`;
  assert.equal(zohoDeskAuthReturnUrl(wrap("https://evil.example/collect")), null);
  assert.equal(zohoDeskAuthReturnUrl(wrap("http://desk.zoho.com.cn/agent/tickets")), null);
  assert.equal(zohoDeskAuthReturnUrl(wrap("https://desk.zoho.com.cn.evil.example/agent/tickets")), null);
  assert.equal(zohoDeskAuthReturnUrl(wrap("https://desk.zoho.com.cn/agent/tickets", "accounts.zoho.com.cn.evil.example")), null);
  assert.equal(isZohoDeskUrl("https://desk.zoho.com.cn.evil.example/agent/tickets"), false);
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

test("managed popup navigation audit removes every query and fragment value", () => {
  assert.equal(
    sanitizeNavigationUrl("https://accounts.example.com/oauth/callback?code=secret&session=private#token"),
    "https://accounts.example.com/oauth/callback",
  );
  assert.equal(sanitizeNavigationUrl("javascript:alert(1)"), "");
});

test("managed popup cleanup closes only windows owned by one browser profile", () => {
  const service = new ManagedPopupService({
    BrowserWindow: {},
    Menu: {},
    policyService: {},
    externalProtocolService: {},
    browserPartitionForProfile: () => "persist:test",
    openTab: () => undefined,
    openExternal: () => undefined,
    askToOpen: () => undefined,
    onBlocked: () => undefined,
    handleInternalAction: () => undefined,
  });
  const fakeWindow = () => {
    let destroyed = false;
    return {
      destroy() {
        destroyed = true;
      },
      isDestroyed() {
        return destroyed;
      },
    };
  };
  const sapWindowA = fakeWindow();
  const sapWindowB = fakeWindow();
  const defaultWindow = fakeWindow();
  service.windows.set(1, {
    window: sapWindowA,
    context: { browserProfileId: "sap-support" },
  });
  service.windows.set(2, {
    window: defaultWindow,
    context: { browserProfileId: "default" },
  });
  service.windows.set(3, {
    window: sapWindowB,
    context: { browserProfileId: "sap-support" },
  });

  const closedCount = service.closeForBrowserProfile("sap-support");

  assert.equal(closedCount, 2);
  assert.equal(sapWindowA.isDestroyed(), true);
  assert.equal(sapWindowB.isDestroyed(), true);
  assert.equal(defaultWindow.isDestroyed(), false);
  assert.equal(service.windows.has(2), true);
});
