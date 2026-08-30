const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AssistantMatcher,
  AssistantPermissionGuard,
  AssistantRegistry,
  PageContextAdapter,
  PageContextUnavailableError,
  ZOHO_DESK_ASSISTANT_ID,
  createBuiltinAssistantRegistry,
  extractZohoDeskTicketId,
} = require("../../electron/assistants/index.cjs");

const TICKET_ID = "123456789012345678";

function page(url) {
  const parsed = new URL(url);
  return {
    url,
    title: "测试页面",
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    selectedText: null,
    timestamp: "2026-08-29T12:00:00.000Z",
  };
}

test("内置 Registry 固定注册通用助手和 Zoho 助手，并从状态读取运行元数据", () => {
  const registry = createBuiltinAssistantRegistry({
    [ZOHO_DESK_ASSISTANT_ID]: {
      enabled: false,
      updatedAt: "2026-08-29T10:00:00.000Z",
      lastExecutedAt: "2026-08-29T11:00:00.000Z",
    },
  });
  assert.deepEqual(
    registry.list().map((item) => item.id),
    ["generic-page-actions", ZOHO_DESK_ASSISTANT_ID],
  );
  const zoho = registry.list().find((item) => item.id === ZOHO_DESK_ASSISTANT_ID);
  assert.equal(zoho.runtimeEnabled, false);
  assert.equal(zoho.settingsUpdatedAt, "2026-08-29T10:00:00.000Z");
  assert.equal(zoho.lastExecutedAt, "2026-08-29T11:00:00.000Z");
  assert.equal(Object.hasOwn(registry.get(ZOHO_DESK_ASSISTANT_ID), "lastExecutedAt"), false);
  assert.equal(Object.isFrozen(registry.get(ZOHO_DESK_ASSISTANT_ID)), true);
});

test("Registry 拒绝远程脚本、未知权限和重复助手 ID", () => {
  const valid = JSON.parse(
    JSON.stringify(createBuiltinAssistantRegistry().get("generic-page-actions")),
  );
  assert.throws(
    () => new AssistantRegistry({ manifests: [{ ...valid, scriptUrl: "https://evil.test/a.js" }] }),
    /不允许/,
  );
  assert.throws(
    () =>
      new AssistantRegistry({
        manifests: [{ ...valid, permissions: [...valid.permissions, "read:cookie"] }],
      }),
    /未知助手权限/,
  );
  assert.throws(
    () => new AssistantRegistry({ manifests: [valid, valid] }),
    /重复/,
  );
});

test("Zoho Desk 严格匹配官方主机、区域主机与帮助中心后缀", () => {
  const registry = createBuiltinAssistantRegistry();
  const matcher = new AssistantMatcher(registry);
  const zoho = registry.get(ZOHO_DESK_ASSISTANT_ID);
  const positives = [
    `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}`,
    `https://desk.zoho.eu/agent/acme/support/tickets/details/${TICKET_ID}`,
    `https://desk.zoho.com.cn/agent/acme/support/tickets/details/${TICKET_ID}`,
    "https://acme.zohodesk.com/portal/en/home",
    "https://acme.zohodesk.com.cn/support/acme/ShowHomePage.do",
  ];
  for (const url of positives) {
    assert.equal(matcher.matches(zoho, page(url)).matched, true, url);
  }
});

test("Zoho Desk 不会误匹配包含 zoho 字样或伪造后缀的网站", () => {
  const registry = createBuiltinAssistantRegistry();
  const matcher = new AssistantMatcher(registry);
  const zoho = registry.get(ZOHO_DESK_ASSISTANT_ID);
  const negatives = [
    "https://help.zoho.com/portal/en/kb/desk",
    "https://accounts.zoho.com/signin",
    "https://crm.zoho.com/agent/acme/support/tickets/details/123456789012345678",
    "https://desk.zoho.com.evil.example/agent/acme/support/tickets/details/123456789012345678",
    "https://evilzoho.com/agent/acme/support/tickets/details/123456789012345678",
    "https://desk.zoho.com/api/v1/tickets/123456789012345678",
  ];
  for (const url of negatives) {
    assert.equal(matcher.matches(zoho, page(url)).matched, false, url);
  }
});

test("自定义 Zoho 映射域只有显式 assistantIds 绑定后才匹配", () => {
  const registry = createBuiltinAssistantRegistry();
  const matcher = new AssistantMatcher(registry);
  const zoho = registry.get(ZOHO_DESK_ASSISTANT_ID);
  const context = page(
    `https://support.example.com/agent/acme/support/tickets/details/${TICKET_ID}`,
  );
  assert.equal(matcher.matches(zoho, context).matched, false);
  assert.deepEqual(
    matcher.matches(zoho, context, { assistantIds: [ZOHO_DESK_ASSISTANT_ID] }),
    { matched: true, reason: "explicit-binding" },
  );
  assert.equal(
    matcher.matches(
      zoho,
      page(`http://support.example.com/agent/acme/support/tickets/details/${TICKET_ID}`),
      { assistantIds: [ZOHO_DESK_ASSISTANT_ID] },
    ).matched,
    false,
  );
});

test("停用 Zoho 助手后 Matcher 不再返回专用助手", () => {
  const registry = createBuiltinAssistantRegistry({
    [ZOHO_DESK_ASSISTANT_ID]: { enabled: false },
  });
  const matcher = new AssistantMatcher(registry);
  const matches = matcher.matchAll(
    page(`https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}`),
  );
  assert.deepEqual(matches.map((item) => item.manifest.id), ["generic-page-actions"]);
});

test("工单编号只从明确的 tickets/details 路径或严格旧式数字 hash 提取", () => {
  const positives = [
    `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}`,
    `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}/threads`,
    `https://desk.zoho.eu/support/acme/ShowHomePage.do#Cases/dv/${TICKET_ID}`,
  ];
  for (const url of positives) assert.equal(extractZohoDeskTicketId(url), TICKET_ID, url);

  const negatives = [
    `https://desk.zoho.com/agent/acme/support/tickets/details/12345`,
    `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}9`,
    `https://desk.zoho.com/agent/acme/support/contacts/details/${TICKET_ID}`,
    `https://desk.zoho.com/api/v1/tickets/${TICKET_ID}`,
    `https://desk.zoho.com/agent/acme/tickets?ticketId=${TICKET_ID}`,
    "https://desk.zoho.com/support/acme/ShowHomePage.do#Cases/dv/c29ebf16fdf488af46583ee14320f40a0b498ee34174141d",
    `https://desk.zoho.com/support/acme/ShowHomePage.do#Cases/dv/${TICKET_ID}9`,
    `https://desk.zoho.com/support/acme/ShowHomePage.do#Cases/dv/${TICKET_ID}?from=email`,
  ];
  for (const url of negatives) assert.equal(extractZohoDeskTicketId(url), null, url);
});

test("PermissionGuard 根据本地 action catalog 拒绝 manifest 未授予的权限", () => {
  const guard = new AssistantPermissionGuard();
  const action = { id: "copy-page-url", type: "page.copy-url" };
  const manifest = { permissions: ["read:url"], actions: [action] };
  const result = guard.check(manifest, action);
  assert.equal(result.allowed, false);
  assert.deepEqual(result.missing, ["action:copy"]);
  assert.throws(() => guard.assertCanExecute(manifest, action), /缺少权限/);
});

test("PageContextAdapter 默认只读取宿主 URL 和标题，不执行 DOM 脚本", async () => {
  let scriptCalls = 0;
  const contents = {
    isDestroyed: () => false,
    getURL: () => `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}`,
    getTitle: () => "工单详情",
    executeJavaScript: async () => {
      scriptCalls += 1;
      return "不应读取";
    },
  };
  const adapter = new PageContextAdapter({
    getWebContents: () => contents,
    now: () => new Date("2026-08-29T12:00:00.000Z"),
  });
  const context = await adapter.getCurrentContext();
  assert.equal(context.title, "工单详情");
  assert.equal(context.hostname, "desk.zoho.com");
  assert.equal(context.selectedText, null);
  assert.equal(scriptCalls, 0);
});

test("PageContextAdapter 对销毁页面和非 HTTP 页面安全失败", async () => {
  const destroyed = new PageContextAdapter({
    getWebContents: () => ({ isDestroyed: () => true }),
  });
  await assert.rejects(() => destroyed.getCurrentContext(), PageContextUnavailableError);

  const filePage = new PageContextAdapter({
    getWebContents: () => ({
      isDestroyed: () => false,
      getURL: () => "file:///tmp/example.html",
      getTitle: () => "本地页",
    }),
  });
  await assert.rejects(() => filePage.getCurrentContext(), PageContextUnavailableError);
});
