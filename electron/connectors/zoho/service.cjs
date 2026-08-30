const { ConnectorError, publicConnectorError } = require("../errors.cjs");
const { atomicWriteJson } = require("../../state-store.cjs");
const { ZohoDeskClient } = require("./client.cjs");
const { ZohoDashboardService } = require("./dashboard-service.cjs");
const { ZohoOAuthService, readZohoOAuthConfig } = require("./oauth.cjs");

const CONNECTION_ID = "zoho-desk-default";
const SECRET_REFERENCE = "connector:zoho-desk:default";

function safeZohoUrl(value, label, options = {}) {
  let parsed;
  try {
    parsed = new URL(String(value || ""));
  } catch {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", `${label}格式无效`);
  }
  const host = parsed.hostname.toLowerCase();
  const allowed = host === "zoho.com" || host.endsWith(".zoho.com") ||
    host.endsWith(".zoho.eu") || host.endsWith(".zoho.in") ||
    host.endsWith(".zoho.com.au") || host.endsWith(".zoho.jp") ||
    host.endsWith(".zoho.com.cn") || host.endsWith(".zoho.sa") ||
    host.endsWith(".zoho.uk") || host.endsWith(".zohocloud.ca") ||
    (options.allowCustomWeb && /^https?:$/.test(parsed.protocol));
  if (parsed.protocol !== "https:" || !allowed) {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", `${label}必须是受支持的 Zoho HTTPS 地址`);
  }
  parsed.username = "";
  parsed.password = "";
  return parsed.toString().replace(/\/$/, "");
}

function normalizePublicConfig(input = {}, existing = {}) {
  const merged = { ...existing, ...input };
  const orgId = String(merged.orgId || "").trim();
  if (!/^\d{4,30}$/.test(orgId)) {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "请输入有效的 Zoho Desk 组织 ID");
  }
  const apiBase = safeZohoUrl(
    merged.apiBase || "https://desk.zoho.com/api/v1",
    "Zoho API Base URL",
  );
  const webBaseUrl = safeZohoUrl(
    merged.webBaseUrl || apiBase.replace(/\/api\/v1$/i, ""),
    "Zoho Desk 网页入口",
    { allowCustomWeb: true },
  );
  const requestedLookback = Number(merged.lookbackDays) || 30;
  const lookbackDays = requestedLookback <= 15 ? 15 : requestedLookback <= 30 ? 30 : 90;
  return {
    orgId,
    apiBase: apiBase.endsWith("/api/v1") ? apiBase : `${apiBase}/api/v1`,
    webBaseUrl,
    // Desk's receivedInDays filter officially accepts only 15, 30 or 90.
    lookbackDays,
    slaWarningHours: Math.min(48, Math.max(1, Number(merged.slaWarningHours) || 4)),
  };
}

class ZohoConnectorService {
  constructor(options = {}) {
    this.getState = options.getState;
    this.saveConnection = options.saveConnection;
    this.appendExecution = options.appendExecution;
    this.secretStore = options.secretStore;
    this.cache = options.cache;
    this.oauthConfigPath = options.oauthConfigPath;
    this.oauth = new ZohoOAuthService({
      fetchFn: options.fetchFn,
      openExternal: options.openExternal,
    });
    this.fetchFn = options.fetchFn;
    this.executionService = options.executionService;
    this.client = new ZohoDeskClient({
      fetchFn: this.fetchFn,
      getAccess: () => this.getAccess(),
      refreshAccess: () => this.refreshAccess(),
    });
    this.dashboardService = new ZohoDashboardService({
      client: this.client,
      cache: this.cache,
      maxTickets: 50,
      threadConcurrency: 4,
    });
  }

  async connection() {
    const state = await this.getState();
    return state.connectorConnections?.find((item) => item.id === CONNECTION_ID) || null;
  }

  async clientConfigAvailable() {
    try {
      await this.getOAuthClient();
      return true;
    } catch {
      return false;
    }
  }

  async getOAuthClient() {
    const stored = await this.secretStore.get(SECRET_REFERENCE);
    if (stored?.client?.clientId && stored?.client?.clientSecret && stored?.client?.redirectUri) {
      return stored.client;
    }
    const client = await readZohoOAuthConfig(this.oauthConfigPath);
    await this.secretStore.set(SECRET_REFERENCE, {
      ...stored,
      client,
      token: stored?.token || null,
    });
    // The JSON is only an import envelope. Once safeStorage succeeds, remove the
    // plaintext secret atomically while retaining public client metadata.
    await atomicWriteJson(this.oauthConfigPath, {
      version: 1,
      imported: true,
      client_id: client.clientId,
      redirect_uris: [client.redirectUri],
      accounts_base: client.accountsBase,
      client_secret_reference: SECRET_REFERENCE,
    });
    return client;
  }

  async getStatus() {
    const connection = await this.connection();
    const clientConfigAvailable = await this.clientConfigAvailable();
    let credentialAvailable = false;
    try {
      credentialAvailable = Boolean(await this.secretStore.get(SECRET_REFERENCE));
    } catch {
      credentialAvailable = false;
    }
    return {
      connectorType: "zoho-desk",
      connectionId: CONNECTION_ID,
      status: connection?.status || "not-configured",
      configured: Boolean(connection?.publicConfig?.orgId && clientConfigAvailable),
      connected: connection?.status === "connected" && credentialAvailable,
      clientConfigAvailable,
      oauthConfigPath: this.oauthConfigPath,
      displayName: connection?.displayName || "Zoho Desk",
      publicConfig: connection?.publicConfig || null,
      lastConnectedAt: connection?.lastConnectedAt || null,
      lastSyncAt: connection?.lastSyncAt || null,
      lastErrorCode: connection?.lastErrorCode || null,
      lastErrorMessage: connection?.lastErrorMessage || null,
      currentUser: connection?.publicConfig?.currentUser || null,
      permissions: ["Desk.tickets.READ", "Desk.basic.READ"],
      readOnly: true,
    };
  }

  async writeConnection(patch) {
    const existing = await this.connection();
    const now = new Date().toISOString();
    const connection = {
      id: CONNECTION_ID,
      connectorType: "zoho-desk",
      displayName: patch.displayName || existing?.displayName || "Zoho Desk",
      status: patch.status || existing?.status || "not-configured",
      publicConfig: patch.publicConfig || existing?.publicConfig || {},
      secretReference: SECRET_REFERENCE,
      lastConnectedAt: patch.lastConnectedAt === undefined
        ? existing?.lastConnectedAt || null
        : patch.lastConnectedAt,
      lastSyncAt: patch.lastSyncAt === undefined ? existing?.lastSyncAt || null : patch.lastSyncAt,
      lastErrorCode: patch.lastErrorCode === undefined ? existing?.lastErrorCode || null : patch.lastErrorCode,
      lastErrorMessage: patch.lastErrorMessage === undefined ? existing?.lastErrorMessage || null : patch.lastErrorMessage,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    await this.saveConnection(connection);
    return connection;
  }

  async configure(input = {}) {
    const existing = await this.connection();
    const publicConfig = normalizePublicConfig(input, existing?.publicConfig);
    await this.writeConnection({
      displayName: String(input.displayName || existing?.displayName || "Zoho Desk").trim().slice(0, 120),
      publicConfig,
      status: existing?.status === "connected" ? "connected" : "not-configured",
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    return this.getStatus();
  }

  async connect() {
    const connection = await this.connection();
    if (!connection?.publicConfig?.orgId) {
      throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "请先保存 Zoho Desk 组织与地址配置");
    }
    const client = await this.getOAuthClient();
    await this.writeConnection({ status: "connecting", lastErrorCode: null, lastErrorMessage: null });
    try {
      const token = await this.oauth.authorize(client);
      await this.secretStore.set(SECRET_REFERENCE, { client, token });
      const agentPayload = await this.client.getMyInfo();
      const agent = agentPayload?.data && !Array.isArray(agentPayload.data)
        ? agentPayload.data
        : agentPayload;
      const currentUser = {
        id: String(agent?.id || agent?.agentId || ""),
        name: String(agent?.name || agent?.displayName || `${agent?.firstName || ""} ${agent?.lastName || ""}`).trim(),
        email: String(agent?.emailId || agent?.email || ""),
      };
      const now = new Date().toISOString();
      await this.writeConnection({
        status: "connected",
        publicConfig: { ...connection.publicConfig, currentUser: currentUser.name || currentUser.email },
        lastConnectedAt: now,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      return this.getStatus();
    } catch (error) {
      const publicError = publicConnectorError(error);
      await this.writeConnection({
        status: "error",
        lastErrorCode: publicError.code,
        lastErrorMessage: publicError.message,
      });
      throw error;
    }
  }

  async getAccess() {
    const connection = await this.connection();
    if (!connection?.publicConfig?.orgId) {
      throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "Zoho Desk 尚未配置");
    }
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    if (!secret?.client || !secret?.token?.accessToken) {
      throw new ConnectorError("AUTH_REQUIRED", "请先连接 Zoho Desk");
    }
    const expiresAt = Date.parse(secret.token.expiresAt || 0);
    const token = Number.isFinite(expiresAt) && expiresAt - Date.now() > 60000
      ? secret.token
      : await this.refreshAccess();
    return {
      accessToken: token.accessToken,
      orgId: connection.publicConfig.orgId,
      // OAuth's api_domain is a generic Zoho service domain and is not always
      // the Desk REST root. The service-specific, regional Desk base is explicit
      // public configuration and is validated before it reaches this client.
      apiBase: connection.publicConfig.apiBase,
    };
  }

  async refreshAccess() {
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    if (!secret?.client || !secret?.token) {
      throw new ConnectorError("AUTH_REQUIRED", "请先连接 Zoho Desk");
    }
    try {
      const token = await this.oauth.refresh(secret.client, secret.token);
      await this.secretStore.set(SECRET_REFERENCE, { ...secret, token });
      return token;
    } catch (error) {
      const publicError = publicConnectorError(error);
      await this.writeConnection({
        status: "error",
        lastErrorCode: publicError.code,
        lastErrorMessage: publicError.message,
      });
      throw error;
    }
  }

  async refreshAuthentication() {
    await this.refreshAccess();
    await this.writeConnection({ status: "connected", lastErrorCode: null, lastErrorMessage: null });
    return this.getStatus();
  }

  async disconnect() {
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    if (secret?.client) {
      await this.secretStore.set(SECRET_REFERENCE, { client: secret.client, token: null });
    } else {
      await this.secretStore.delete(SECRET_REFERENCE);
    }
    await this.cache.delete("zoho-desk:dashboard");
    await this.writeConnection({
      status: "not-configured",
      lastConnectedAt: null,
      lastSyncAt: null,
      lastErrorCode: null,
      lastErrorMessage: null,
    });
    return this.getStatus();
  }

  async getDashboard(options = {}) {
    const status = await this.getStatus();
    const cached = await this.dashboardService.getCached();
    if (!status.connected) {
      return {
        status: status.status,
        configured: status.configured,
        connected: false,
        counts: null,
        tickets: [],
        cached: cached?.data || null,
        stale: true,
        message: "连接 Zoho Desk 后，可以查看待回复工单、今日新增和 SLA 状态。",
      };
    }
    if (!options.refresh && cached && !cached.stale) {
      return { ...cached.data, connected: true, stale: false, fromCache: true };
    }
    if (!options.refresh && cached?.data) {
      return { ...cached.data, connected: true, stale: true, fromCache: true };
    }
    return this.refreshDashboard(options);
  }

  async refreshDashboard(options = {}) {
    const connection = await this.connection();
    if (!connection) throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "Zoho Desk 尚未配置");
    await this.writeConnection({ status: "syncing", lastErrorCode: null, lastErrorMessage: null });
    const operation = async () => this.dashboardService.refresh({
      publicConfig: connection.publicConfig,
      signal: options.signal,
    });
    try {
      const dashboard = this.executionService
        ? await this.executionService.execute(
            { connectionId: CONNECTION_ID, operation: "refreshDashboard", signal: options.signal, successSummary: "Zoho 工单分诊数据已更新" },
            operation,
          )
        : await operation();
      await this.writeConnection({
        status: "connected",
        lastSyncAt: dashboard.syncedAt,
        lastErrorCode: null,
        lastErrorMessage: null,
      });
      return { ...dashboard, connected: true };
    } catch (error) {
      const publicError = publicConnectorError(error);
      await this.writeConnection({
        status: "error",
        lastErrorCode: publicError.code,
        lastErrorMessage: publicError.message,
      });
      throw error;
    }
  }

  async getTicketContext(ticketId, options = {}) {
    if (!/^\d{6,30}$/.test(String(ticketId || ""))) {
      throw new ConnectorError("DATA_UNAVAILABLE", "无法可靠识别 Zoho 工单编号");
    }
    const connection = await this.connection();
    const dashboard = await this.dashboardService.getCached();
    return this.dashboardService.getTicketContext(ticketId, {
      ...options,
      publicConfig: connection?.publicConfig || {},
      currentAgentId: dashboard?.data?.agent?.id || "",
    });
  }
}

module.exports = {
  CONNECTION_ID,
  SECRET_REFERENCE,
  ZohoConnectorService,
  normalizePublicConfig,
  safeZohoUrl,
};
