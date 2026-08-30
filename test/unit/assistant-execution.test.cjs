const test = require("node:test");
const assert = require("node:assert/strict");

const {
  AssistantExecutionService,
  ZOHO_DESK_ASSISTANT_ID,
  appendLimitedExecutionLog,
  createBuiltinAssistantRegistry,
  redactSensitiveValue,
  sanitizeExecutionRecord,
  sanitizeLogText,
} = require("../../electron/assistants/index.cjs");

const TICKET_ID = "123456789012345678";

function contextFor(url) {
  const parsed = new URL(url);
  return {
    url,
    title: "客户工单",
    hostname: parsed.hostname,
    pathname: parsed.pathname,
    selectedText: null,
    timestamp: "2026-08-29T12:00:00.000Z",
  };
}

function createHarness(overrides = {}) {
  const registry = overrides.registry || createBuiltinAssistantRegistry();
  const logs = [];
  const clipboardWrites = [];
  const savedSites = [];
  const externalUrls = [];
  let adapterCalls = 0;
  const url =
    overrides.url ||
    `https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}?token=top-secret#thread`;
  const adapter = overrides.pageContextAdapter || {
    getCurrentContext: async () => {
      adapterCalls += 1;
      return contextFor(url);
    },
  };
  const service = new AssistantExecutionService({
    registry,
    pageContextAdapter: adapter,
    getCurrentSite: overrides.getCurrentSite || (async () => ({ id: "zoho-site" })),
    getCurrentWorkspaceId: overrides.getCurrentWorkspaceId || (async () => "research"),
    clipboard: overrides.clipboard || {
      writeText: async (text) => clipboardWrites.push(text),
    },
    openExternal:
      overrides.openExternal || (async (externalUrl) => externalUrls.push(externalUrl)),
    saveSite: overrides.saveSite || (async (site) => savedSites.push(site)),
    appendExecutionLog: overrides.appendExecutionLog || (async (record) => logs.push(record)),
    updateAssistantRuntime: overrides.updateAssistantRuntime || (async () => undefined),
    now: () => new Date("2026-08-29T12:34:56.000Z"),
    createId: () => `log-${logs.length + 1}`,
  });
  return {
    service,
    registry,
    logs,
    clipboardWrites,
    savedSites,
    externalUrls,
    getAdapterCalls: () => adapterCalls,
  };
}

test("页面动作面板返回通用和 Zoho 助手、明确工单号且不暴露 Gitee 创建入口", async () => {
  const harness = createHarness();
  const panel = await harness.service.getPanelContext();
  assert.deepEqual(
    panel.assistants.map((assistant) => assistant.id),
    ["generic-page-actions", ZOHO_DESK_ASSISTANT_ID],
  );
  const zoho = panel.assistants.find((assistant) => assistant.id === ZOHO_DESK_ASSISTANT_ID);
  assert.equal(zoho.context.ticketId, TICKET_ID);
  assert.ok(zoho.actions.some((action) => action.id === "copy-ticket-id"));
  assert.equal(zoho.actions.some((action) => action.id === "create-gitee-task"), false);
  assert.equal(zoho.actions.some((action) => action.id === "send-to-b1"), false);
});

test("复制工单编号使用服务端实时上下文，并生成不含编号、URL 或 token 的日志", async () => {
  const harness = createHarness();
  const result = await harness.service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "copy-ticket-id",
  });
  assert.equal(result.status, "success");
  assert.deepEqual(harness.clipboardWrites, [TICKET_ID]);
  assert.equal(harness.getAdapterCalls(), 1);
  assert.equal(harness.logs.length, 1);
  const serialized = JSON.stringify(harness.logs[0]);
  assert.equal(serialized.includes(TICKET_ID), false);
  assert.equal(serialized.includes("top-secret"), false);
  assert.equal(serialized.includes("https://"), false);
  assert.equal(harness.registry.getRuntimeMetadata(ZOHO_DESK_ASSISTANT_ID).lastExecutedAt, "2026-08-29T12:34:56.000Z");
});

test("执行请求只能包含 assistantId 和 actionId，不能注入 renderer 上下文", async () => {
  const harness = createHarness();
  await assert.rejects(
    () =>
      harness.service.execute({
        assistantId: ZOHO_DESK_ASSISTANT_ID,
        actionId: "copy-ticket-id",
        url: `https://evil.example/tickets/details/${TICKET_ID}`,
      }),
    /只能包含/,
  );
  assert.equal(harness.getAdapterCalls(), 0);
  assert.equal(harness.logs.length, 0);
});

test("执行时重新读取页面；面板打开后导航到非 Zoho 页面会被拒绝", async () => {
  const registry = createBuiltinAssistantRegistry();
  const contexts = [
    contextFor(`https://desk.zoho.com/agent/acme/support/tickets/details/${TICKET_ID}`),
    contextFor("https://example.com/"),
  ];
  let index = 0;
  const writes = [];
  const logs = [];
  const service = new AssistantExecutionService({
    registry,
    pageContextAdapter: {
      getCurrentContext: async () => contexts[Math.min(index++, contexts.length - 1)],
    },
    getCurrentSite: async () => null,
    clipboard: { writeText: async (text) => writes.push(text) },
    appendExecutionLog: async (record) => logs.push(record),
  });
  await service.getPanelContext();
  const result = await service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "copy-ticket-id",
  });
  assert.equal(result.status, "denied");
  assert.deepEqual(writes, []);
  assert.equal(logs[0].status, "denied");
});

test("Zoho 保存和固定动作只写入工作空间，并绑定本地助手 ID", async () => {
  const harness = createHarness();
  await harness.service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "save-ticket-to-work",
  });
  await harness.service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "pin-ticket-to-work",
  });
  assert.equal(harness.savedSites.length, 2);
  assert.deepEqual(
    harness.savedSites.map((site) => ({
      workspaceId: site.workspaceId,
      siteKind: site.siteKind,
      pinned: site.pinned,
      assistantIds: site.assistantIds,
    })),
    [
      {
        workspaceId: "work",
        siteKind: "workApp",
        pinned: false,
        assistantIds: [ZOHO_DESK_ASSISTANT_ID],
      },
      {
        workspaceId: "work",
        siteKind: "workApp",
        pinned: true,
        assistantIds: [ZOHO_DESK_ASSISTANT_ID],
      },
    ],
  );
});

test("未配置草稿连接器不会调用任何外部依赖，也不会报告成功", async () => {
  const harness = createHarness();
  const result = await harness.service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "draft-customer-reply",
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "not-configured");
  assert.match(result.message, /未配置/);
  assert.deepEqual(harness.clipboardWrites, []);
  assert.deepEqual(harness.savedSites, []);
  assert.deepEqual(harness.externalUrls, []);
  assert.equal(harness.logs[0].status, "not-configured");
});

test("真实动作失败会记录 failure，错误中的授权头、URL 和令牌被脱敏", async () => {
  const harness = createHarness({
    openExternal: async () => {
      const error = new Error(
        "Authorization: Bearer abc.def.ghi https://desk.zoho.com/path?token=secret-value#private",
      );
      error.code = "EXTERNAL_OPEN_FAILED";
      throw error;
    },
  });
  const result = await harness.service.execute({
    assistantId: ZOHO_DESK_ASSISTANT_ID,
    actionId: "open-ticket-external",
  });
  assert.equal(result.ok, false);
  assert.equal(result.status, "failure");
  const serialized = JSON.stringify({ result, log: harness.logs[0] });
  for (const secret of ["abc.def.ghi", "secret-value", "?token=", "#private"]) {
    assert.equal(serialized.includes(secret), false, secret);
  }
  assert.equal(harness.logs[0].status, "failure");
});

test("递归日志脱敏屏蔽敏感键和认证字符串，并限制日志长度", () => {
  const redacted = redactSensitiveValue({
    Cookie: "sid=secret",
    nested: {
      access_token: "token-value",
      statusCode: 401,
      message: "Bearer bearer-secret",
    },
  });
  assert.equal(redacted.Cookie, "[REDACTED]");
  assert.equal(redacted.nested.access_token, "[REDACTED]");
  assert.equal(redacted.nested.statusCode, 401);
  assert.equal(redacted.nested.message.includes("bearer-secret"), false);

  const cleanText = sanitizeLogText(
    "访问 https://desk.zoho.com/a/b?token=secret#body Authorization: Basic abc123",
  );
  assert.equal(cleanText.includes("secret"), false);
  assert.equal(cleanText.includes("abc123"), false);
  assert.equal(cleanText.includes("/a/b"), false);

  let logs = [];
  for (let index = 0; index < 5; index += 1) {
    logs = appendLimitedExecutionLog(
      logs,
      sanitizeExecutionRecord({
        id: `log-${index}`,
        timestamp: `2026-08-29T12:00:0${index}.000Z`,
        assistantId: "generic-page-actions",
        assistantName: "通用页面动作",
        actionId: "copy-page-url",
        actionName: "复制页面地址",
        site: { hostname: "example.com" },
        status: "success",
        summary: "已复制",
      }),
      3,
    );
  }
  assert.deepEqual(logs.map((log) => log.id), ["log-4", "log-3", "log-2"]);
});
