const assert = require("node:assert/strict");
const fsp = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  ConnectorRegistry,
  ConnectorSecretStore,
  ZohoConnectorService,
  redactConnectorText,
} = require("../../electron/connectors/index.cjs");
const { parseZohoOAuthConfig } = require("../../electron/connectors/zoho/oauth.cjs");
const { normalizePublicConfig } = require("../../electron/connectors/zoho/service.cjs");
const { normalizeTicket } = require("../../electron/connectors/zoho/ticket-normalizer.cjs");
const {
  calculateTicketMetrics,
  formatDuration,
} = require("../../electron/connectors/zoho/ticket-metrics.cjs");
const { prioritizeTickets } = require("../../electron/connectors/zoho/ticket-priority.cjs");
const {
  createInitialState,
  migrateState,
  updateUiSettingsInState,
  upsertConnectorConnectionInState,
  appendConnectorExecutionInState,
} = require("../../electron/state-model.cjs");

const NOW = "2026-08-30T04:00:00.000Z";

function rawTicket(overrides = {}) {
  return {
    id: "100000000000000001",
    ticketNumber: "12831",
    subject: "采购退货单位",
    status: "Open",
    statusType: "Open",
    priority: "High",
    assigneeId: "agent-1",
    contact: { id: "contact-1", name: "客户联系人" },
    account: { id: "account-1", name: "示例客户" },
    createdTime: "2026-08-30T01:00:00.000Z",
    modifiedTime: "2026-08-30T03:00:00.000Z",
    responseDueDate: "2026-08-30T06:00:00.000Z",
    webUrl: "https://desk.zoho.com/agent/acme/tickets/details/100000000000000001",
    ...overrides,
  };
}

function thread(overrides = {}) {
  return {
    id: "thread-1",
    visibility: "public",
    direction: "in",
    author: { type: "END_USER" },
    createdTime: "2026-08-29T02:00:00.000Z",
    ...overrides,
  };
}

test("connector registry exposes five read-only definitions and only Zoho is implemented", () => {
  const definitions = new ConnectorRegistry().list();
  assert.deepEqual(
    definitions.map((item) => item.id),
    ["zoho-desk", "emma", "customer-ops", "gitee", "b1-support-hub"],
  );
  assert.deepEqual(
    definitions.filter((item) => item.implemented).map((item) => item.id),
    ["zoho-desk"],
  );
  assert.ok(definitions.every((item) => item.readOnly));
});

test("connector secret store persists ciphertext only and deletes credentials", async (t) => {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-secret-store-"));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  const filePath = path.join(directory, "connector-secrets.json");
  const safeStorage = {
    isEncryptionAvailable: () => true,
    encryptString: (value) => Buffer.from(Array.from(value).reverse().join(""), "utf8"),
    decryptString: (buffer) => Array.from(buffer.toString("utf8")).reverse().join(""),
  };
  const store = new ConnectorSecretStore({ filePath, safeStorage });
  await store.set("connector:zoho", {
    accessToken: "plain-access-token",
    refreshToken: "plain-refresh-token",
  });
  const disk = await fsp.readFile(filePath, "utf8");
  assert.doesNotMatch(disk, /plain-access-token|plain-refresh-token/);
  assert.equal((await store.get("connector:zoho")).accessToken, "plain-access-token");
  await store.delete("connector:zoho");
  assert.equal(await store.get("connector:zoho"), null);
});

test("connector logs redact auth headers and secrets", () => {
  const value = redactConnectorText(
    "Authorization: Zoho-oauthtoken abc123 client_secret=secret123 Cookie: sid=private",
  );
  assert.doesNotMatch(value, /abc123|secret123|sid=private/);
  assert.match(value, /REDACTED/);
});

test("Zoho Desktop OAuth config requires an exact loopback callback", () => {
  const parsed = parseZohoOAuthConfig({
    installed: {
      client_id: "client-id",
      client_secret: "client-secret",
      redirect_uris: ["http://127.0.0.1:53682/oauth/zoho/callback"],
      accounts_base: "https://accounts.zoho.com.cn",
    },
  });
  assert.equal(parsed.accountsBase, "https://accounts.zoho.com.cn");
  assert.throws(() => parseZohoOAuthConfig({
    installed: {
      client_id: "client-id",
      client_secret: "client-secret",
      redirect_uris: ["https://example.com/callback"],
    },
  }), /本机 HTTP/);
  assert.throws(() => parseZohoOAuthConfig({
    installed: {
      client_id: "client-id",
      client_secret: "client-secret",
      redirect_uris: ["http://127.0.0.1:53682/oauth/zoho/callback"],
      accounts_base: "https://accounts.example.com",
    },
  }), /受支持的数据中心/);
});

test("Zoho client secret is imported into the secret store and scrubbed from JSON", async (t) => {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-zoho-import-"));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  const configPath = path.join(directory, "zoho-oauth-client.json");
  await fsp.writeFile(configPath, JSON.stringify({
    installed: {
      client_id: "client-id",
      client_secret: "client-secret-plain",
      redirect_uris: ["http://127.0.0.1:53682/oauth/zoho/callback"],
      accounts_base: "https://accounts.zoho.com",
    },
  }), "utf8");
  let encryptedValue = null;
  const secretStore = {
    get: async () => encryptedValue,
    set: async (_reference, value) => { encryptedValue = structuredClone(value); },
  };
  const service = new ZohoConnectorService({
    getState: async () => ({ connectorConnections: [] }),
    saveConnection: async () => {},
    secretStore,
    cache: { get: async () => null },
    oauthConfigPath: configPath,
    fetchFn: async () => { throw new Error("not called"); },
  });
  const client = await service.getOAuthClient();
  assert.equal(client.clientSecret, "client-secret-plain");
  assert.equal(encryptedValue.client.clientSecret, "client-secret-plain");
  const sanitized = await fsp.readFile(configPath, "utf8");
  assert.doesNotMatch(sanitized, /client-secret-plain|client_secret\s*"\s*:/);
  assert.match(sanitized, /client_secret_reference/);
});

test("Zoho lookback is normalized to the API-supported 15, 30 or 90 day values", () => {
  const base = {
    orgId: "123456",
    apiBase: "https://desk.zoho.com/api/v1",
    webBaseUrl: "https://desk.zoho.com",
  };
  assert.equal(normalizePublicConfig({ ...base, lookbackDays: 7 }).lookbackDays, 15);
  assert.equal(normalizePublicConfig({ ...base, lookbackDays: 30 }).lookbackDays, 30);
  assert.equal(normalizePublicConfig({ ...base, lookbackDays: 60 }).lookbackDays, 90);
});

test("latest public customer thread counts as needs reply while a private note does not change it", () => {
  const ticket = normalizeTicket(rawTicket(), {
    threads: [
      thread({ id: "note", visibility: "private", direction: "out", author: { type: "AGENT" }, createdTime: "2026-08-30T03:00:00Z" }),
      thread({ id: "customer", createdTime: "2026-08-29T02:00:00Z" }),
    ],
  });
  const result = calculateTicketMetrics([ticket], { currentAgentId: "agent-1", now: NOW });
  assert.equal(result.counts.needsReply, 1);
  assert.equal(result.tickets[0].latestPublicDirection, "customer");
});

test("public agent reply removes a ticket from needs reply", () => {
  const ticket = normalizeTicket(rawTicket(), {
    threads: [
      thread({ id: "agent", direction: "out", author: { type: "AGENT" }, createdTime: "2026-08-30T03:00:00Z" }),
      thread({ id: "customer", createdTime: "2026-08-29T02:00:00Z" }),
    ],
  });
  assert.equal(calculateTicketMetrics([ticket], { currentAgentId: "agent-1", now: NOW }).counts.needsReply, 0);
});

test("automated system messages are not mistaken for a human reply", () => {
  const ticket = normalizeTicket(rawTicket(), {
    threads: [
      thread({ id: "auto", direction: "out", author: { type: "SYSTEM" }, isAutoResponse: true, createdTime: "2026-08-30T03:00:00Z" }),
      thread({ id: "customer", createdTime: "2026-08-29T02:00:00Z" }),
    ],
  });
  assert.equal(calculateTicketMetrics([ticket], { currentAgentId: "agent-1", now: NOW }).counts.needsReply, 1);
});

test("Zoho SYSTEM channel source does not hide a real END_USER message", () => {
  const ticket = normalizeTicket(rawTicket(), {
    threads: [thread({
      author: { type: "END_USER" },
      direction: "in",
      source: { type: "SYSTEM" },
      status: "SUCCESS",
    })],
  });
  assert.equal(calculateTicketMetrics([ticket], {
    currentAgentId: "agent-1",
    now: NOW,
  }).counts.needsReply, 1);
});

test("draft or failed agent messages do not count as a public support reply", () => {
  for (const status of ["DRAFT", "FAILED", "PENDING"]) {
    const ticket = normalizeTicket(rawTicket(), {
      threads: [
        thread({ id: `agent-${status}`, author: { type: "AGENT" }, direction: "out", status, createdTime: "2026-08-30T03:00:00Z" }),
        thread({ id: "customer", author: { type: "END_USER" }, direction: "in", status: "SUCCESS" }),
      ],
    });
    assert.equal(calculateTicketMetrics([ticket], {
      currentAgentId: "agent-1",
      now: NOW,
    }).counts.needsReply, 1);
  }
});

test("customer waiting over 24 hours is calculated separately from SLA", () => {
  const ticket = normalizeTicket(rawTicket({ responseDueDate: null, dueDate: null }), {
    threads: [thread({ createdTime: "2026-08-29T02:00:00.000Z" })],
  });
  const result = calculateTicketMetrics([ticket], { currentAgentId: "agent-1", now: NOW });
  assert.equal(result.counts.waitingOver24h, 1);
  assert.equal(result.slaAvailable, false);
  assert.match(result.tickets[0].customerWaitingLabel, /1 天 2 小时/);
});

test("today metric uses the device local calendar date", () => {
  const localNow = new Date(2026, 7, 30, 9, 0, 0);
  const localCreated = new Date(2026, 7, 30, 0, 5, 0).toISOString();
  const ticket = normalizeTicket(rawTicket({ createdTime: localCreated }), { threads: [] });
  assert.equal(calculateTicketMetrics([ticket], {
    currentAgentId: "agent-1",
    now: localNow,
  }).counts.addedToday, 1);
});

test("official SLA due soon and overdue are recognized without synthesizing missing SLA", () => {
  const dueSoon = normalizeTicket(rawTicket({ responseDueDate: "2026-08-30T06:00:00.000Z" }), { threads: [] });
  const overdue = normalizeTicket(rawTicket({ id: "2", responseDueDate: "2026-08-30T03:00:00.000Z" }), { threads: [] });
  const unavailable = normalizeTicket(rawTicket({ id: "3", responseDueDate: null, dueDate: null }), { threads: [] });
  const result = calculateTicketMetrics([dueSoon, overdue, unavailable], {
    currentAgentId: "agent-1",
    now: NOW,
    slaWarningHours: 4,
  });
  assert.equal(result.counts.slaDueSoon, 1);
  assert.equal(result.counts.slaOverdue, 1);
  assert.equal(result.tickets[2].sla.state, "unavailable");
  assert.equal(result.tickets[2].sla.dueAt, null);
});

test("an official overdue flag remains authoritative when no SLA date is returned", () => {
  const flagged = normalizeTicket(rawTicket({
    responseDueDate: null,
    dueDate: null,
    isResponseOverdue: true,
  }), { threads: [] });
  const result = calculateTicketMetrics([flagged], {
    currentAgentId: "agent-1",
    now: NOW,
  });
  assert.equal(result.counts.slaOverdue, 1);
  assert.equal(result.tickets[0].sla.source, "isResponseOverdue");
  assert.equal(result.tickets[0].sla.dueAt, null);
});

test("priority ordering is explainable: overdue before due soon before waiting", () => {
  const tickets = [
    { id: "waiting", waitingOver24h: true, customerWaitingLabel: "客户等待 30 小时", sla: { state: "on-track" }, updatedAt: NOW },
    { id: "soon", waitingOver24h: false, sla: { state: "due-soon" }, updatedAt: NOW },
    { id: "overdue", waitingOver24h: false, sla: { state: "overdue" }, updatedAt: NOW },
  ];
  assert.deepEqual(prioritizeTickets(tickets).map((item) => item.id), ["overdue", "soon", "waiting"]);
  assert.deepEqual(prioritizeTickets(tickets)[0].reasons.map((item) => item.code), ["sla-overdue"]);
});

test("v7 migration keeps sites separate from sessions and is idempotent", () => {
  const initial = createInitialState({ now: NOW, defaultSites: [
    { id: "site-a", name: "站点 A", url: "https://a.example/", workspaceId: "work" },
  ] });
  assert.equal(initial.version, 7);
  assert.equal(initial.sites.length, 1);
  assert.equal(initial.workspaceBrowserStates.work.tabs.length, 0);
  assert.deepEqual(initial.uiSettings, {
    sessionVisibility: "all",
    contextAssistantCollapsed: false,
    sitePopupPolicies: [],
    translation: {
      providerId: "openai-compatible",
      publicConfig: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
      sourceLanguage: "auto",
      targetLanguage: "zh-CN",
      defaultMode: "bilingual",
      selectionButtonEnabled: true,
      siteRules: [],
    },
  });
  const migrated = migrateState(initial, { now: "2030-01-01T00:00:00Z" });
  assert.equal(migrated.changed, false);
});

test("session visibility and context-assistant preferences survive state normalization", () => {
  const initial = createInitialState({ now: NOW });
  const updated = updateUiSettingsInState(initial, {
    sessionVisibility: "workspace",
    contextAssistantCollapsed: true,
  }, { now: NOW }).state;
  const restarted = migrateState(JSON.parse(JSON.stringify(updated)), { now: NOW }).state;
  assert.deepEqual(restarted.uiSettings, {
    sessionVisibility: "workspace",
    contextAssistantCollapsed: true,
    sitePopupPolicies: [],
    translation: {
      providerId: "openai-compatible",
      publicConfig: { baseUrl: "https://api.openai.com/v1", model: "gpt-4o-mini" },
      sourceLanguage: "auto",
      targetLanguage: "zh-CN",
      defaultMode: "bilingual",
      selectionButtonEnabled: true,
      siteRules: [],
    },
  });
});

test("site popup policies survive v6 migration and reject duplicate or unsafe host patterns", () => {
  const initial = createInitialState({ now: NOW });
  const updated = updateUiSettingsInState(initial, {
    sitePopupPolicies: [
      {
        hostnamePattern: "*.hana.ondemand.com",
        mode: "popup",
        preserveOpener: true,
        allowPost: true,
        allowedRedirectOrigins: ["https://accounts.sap.com/login"],
      },
      { hostnamePattern: "*.hana.ondemand.com", mode: "block" },
      { hostnamePattern: "javascript:bad", mode: "popup" },
    ],
  }, { now: NOW }).state;
  const restarted = migrateState(JSON.parse(JSON.stringify(updated)), { now: NOW }).state;
  assert.deepEqual(restarted.uiSettings.sitePopupPolicies, [
    {
      hostnamePattern: "*.hana.ondemand.com",
      mode: "popup",
      preserveOpener: true,
      allowPost: true,
      allowedRedirectOrigins: ["https://accounts.sap.com"],
    },
  ]);
});

test("connector public config strips token-shaped keys before normal state persistence", () => {
  const state = createInitialState({ now: NOW });
  const result = upsertConnectorConnectionInState(state, {
    id: "zoho-desk-default",
    connectorType: "zoho-desk",
    displayName: "Zoho Desk",
    status: "connected",
    publicConfig: { orgId: "123456", apiBase: "https://desk.zoho.com/api/v1", accessToken: "must-not-persist" },
    secretReference: "connector:zoho-desk:default",
  }, { now: NOW });
  assert.equal(result.connection.publicConfig.orgId, "123456");
  assert.equal(Object.hasOwn(result.connection.publicConfig, "accessToken"), false);
  assert.doesNotMatch(JSON.stringify(result.state), /must-not-persist/);
});

test("connector execution updates one record instead of duplicating running and final entries", () => {
  const state = createInitialState({ now: NOW });
  const running = appendConnectorExecutionInState(state, {
    id: "execution-1",
    connectionId: "zoho-desk-default",
    operation: "refreshDashboard",
    startedAt: NOW,
    status: "running",
    summary: "正在执行",
  }, { now: NOW }).state;
  const finished = appendConnectorExecutionInState(running, {
    id: "execution-1",
    connectionId: "zoho-desk-default",
    operation: "refreshDashboard",
    startedAt: NOW,
    finishedAt: "2026-08-30T04:00:01.000Z",
    status: "success",
    summary: "查询完成",
  }, { now: NOW }).state;
  assert.equal(finished.connectorExecutions.length, 1);
  assert.equal(finished.connectorExecutions[0].status, "success");
});

test("duration labels stay human-readable", () => {
  assert.equal(formatDuration(27 * 3600000), "1 天 3 小时");
  assert.equal(formatDuration(52 * 3600000), "2 天 4 小时");
});
