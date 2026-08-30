const { createHash, randomBytes } = require("node:crypto");
const http = require("node:http");
const fsp = require("node:fs/promises");
const { ConnectorError } = require("../errors.cjs");

const DEFAULT_SCOPES = Object.freeze(["Desk.tickets.READ", "Desk.basic.READ"]);
const ZOHO_ACCOUNTS_HOSTS = new Set([
  "accounts.zoho.com",
  "accounts.zoho.eu",
  "accounts.zoho.in",
  "accounts.zoho.com.au",
  "accounts.zoho.jp",
  "accounts.zohocloud.ca",
  "accounts.zoho.sa",
  "accounts.zoho.uk",
  "accounts.zoho.com.cn",
]);

function base64url(buffer) {
  return Buffer.from(buffer).toString("base64url");
}

function parseZohoOAuthConfig(input) {
  const root = input?.installed || input?.desktop || input?.web || input;
  if (!root || typeof root !== "object") {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "Zoho OAuth 客户端配置无效");
  }
  const clientId = String(root.client_id || root.clientId || "").trim();
  const clientSecret = String(root.client_secret || root.clientSecret || "").trim();
  const redirectUris = Array.isArray(root.redirect_uris)
    ? root.redirect_uris
    : root.redirectUri
      ? [root.redirectUri]
      : [];
  const redirectUri = String(redirectUris[0] || root.redirect_uri || "").trim();
  const accountsBase = String(
    root.accounts_base || root.accountsBase || "https://accounts.zoho.com",
  ).replace(/\/$/, "");
  if (!clientId || !clientSecret || !redirectUri) {
    throw new ConnectorError(
      "CONNECTOR_NOT_CONFIGURED",
      "Zoho OAuth 配置需要 client_id、client_secret 和 redirect_uri",
    );
  }
  let parsedRedirect;
  try {
    parsedRedirect = new URL(redirectUri);
  } catch {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "Zoho OAuth 回调地址无效");
  }
  if (
    parsedRedirect.protocol !== "http:" ||
    !["127.0.0.1", "localhost", "[::1]"].includes(parsedRedirect.hostname)
  ) {
    throw new ConnectorError(
      "CONNECTOR_NOT_CONFIGURED",
      "桌面端 Zoho OAuth 回调必须使用本机 HTTP 地址",
    );
  }
  let parsedAccounts;
  try {
    parsedAccounts = new URL(accountsBase);
  } catch {
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "Zoho OAuth 账号地址无效");
  }
  if (parsedAccounts.protocol !== "https:" || !ZOHO_ACCOUNTS_HOSTS.has(parsedAccounts.hostname)) {
    throw new ConnectorError(
      "CONNECTOR_NOT_CONFIGURED",
      "Zoho OAuth 账号地址必须使用受支持的数据中心",
    );
  }
  return { clientId, clientSecret, redirectUri, accountsBase };
}

async function readZohoOAuthConfig(filePath) {
  try {
    return parseZohoOAuthConfig(JSON.parse(await fsp.readFile(filePath, "utf8")));
  } catch (error) {
    if (error?.code === "ENOENT") {
      throw new ConnectorError(
        "CONNECTOR_NOT_CONFIGURED",
        "尚未配置 Zoho 桌面 OAuth 客户端",
      );
    }
    if (error instanceof ConnectorError) throw error;
    throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "无法读取 Zoho OAuth 客户端配置", {
      cause: error,
    });
  }
}

function waitForLoopbackCallback(redirectUri, expectedState, timeoutMs = 150000) {
  const target = new URL(redirectUri);
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (error, value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      server.close(() => error ? reject(error) : resolve(value));
    };
    const server = http.createServer((request, response) => {
      const incoming = new URL(request.url || "/", redirectUri);
      if (incoming.pathname !== target.pathname) {
        response.writeHead(404).end();
        return;
      }
      const state = incoming.searchParams.get("state") || "";
      const errorCode = incoming.searchParams.get("error") || "";
      const code = incoming.searchParams.get("code") || "";
      response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      response.end(
        "<!doctype html><meta charset=utf-8><title>栖页 Zoho 授权</title>" +
        "<style>body{font-family:system-ui;padding:48px;color:#173b32}main{max-width:520px;margin:auto}</style>" +
        `<main><h1>${code ? "授权已返回栖页" : "授权未完成"}</h1><p>现在可以关闭此页面并返回栖页。</p></main>`,
      );
      if (state !== expectedState) {
        finish(new ConnectorError("AUTH_REQUIRED", "Zoho OAuth 状态校验失败"));
      } else if (errorCode) {
        finish(new ConnectorError("AUTH_REQUIRED", `Zoho 授权未完成：${errorCode}`));
      } else if (!code) {
        finish(new ConnectorError("AUTH_REQUIRED", "Zoho 未返回授权码"));
      } else {
        finish(null, code);
      }
    });
    server.on("error", (error) =>
      finish(new ConnectorError("NETWORK_ERROR", "无法启动 Zoho 本机授权回调", { cause: error })),
    );
    const timer = setTimeout(
      () => finish(new ConnectorError("REQUEST_TIMEOUT", "Zoho 授权等待超时")),
      timeoutMs,
    );
    server.listen(Number(target.port), target.hostname);
  });
}

async function parseTokenResponse(response) {
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ConnectorError("INVALID_RESPONSE", "Zoho OAuth 返回了无效响应", { cause: error });
  }
  if (!response.ok || payload?.error) {
    const code = String(payload?.error || "oauth_error");
    throw new ConnectorError(
      code === "invalid_code" || code === "invalid_client" ? "AUTH_REQUIRED" : "API_ERROR",
      `Zoho OAuth 失败：${code}`,
      { status: response.status },
    );
  }
  if (!payload?.access_token) {
    throw new ConnectorError("INVALID_RESPONSE", "Zoho OAuth 未返回访问令牌");
  }
  const expiresIn = Number(payload.expires_in || 3600);
  return {
    accessToken: String(payload.access_token),
    refreshToken: payload.refresh_token ? String(payload.refresh_token) : null,
    apiDomain: payload.api_domain ? String(payload.api_domain).replace(/\/$/, "") : null,
    tokenType: String(payload.token_type || "Bearer"),
    scope: String(payload.scope || ""),
    expiresAt: new Date(Date.now() + Math.max(60, expiresIn) * 1000).toISOString(),
    obtainedAt: new Date().toISOString(),
  };
}

class ZohoOAuthService {
  constructor(options = {}) {
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.openExternal = options.openExternal;
    this.scopes = options.scopes || DEFAULT_SCOPES;
  }

  async authorize(client, options = {}) {
    if (typeof this.openExternal !== "function") {
      throw new ConnectorError("DATA_UNAVAILABLE", "无法打开 Zoho 授权页面");
    }
    const verifier = base64url(randomBytes(48));
    const challenge = base64url(createHash("sha256").update(verifier).digest());
    const state = base64url(randomBytes(24));
    const authUrl = new URL("/oauth/v2/auth", client.accountsBase);
    authUrl.searchParams.set("scope", this.scopes.join(","));
    authUrl.searchParams.set("client_id", client.clientId);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("redirect_uri", client.redirectUri);
    authUrl.searchParams.set("state", state);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    const callback = waitForLoopbackCallback(
      client.redirectUri,
      state,
      options.timeoutMs,
    );
    await this.openExternal(authUrl.toString());
    const code = await callback;
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: client.clientId,
      client_secret: client.clientSecret,
      redirect_uri: client.redirectUri,
      code,
      code_verifier: verifier,
    });
    const response = await this.fetchFn(new URL("/oauth/v2/token", client.accountsBase), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    return parseTokenResponse(response);
  }

  async refresh(client, token) {
    if (!token?.refreshToken) {
      throw new ConnectorError("AUTH_EXPIRED", "Zoho 登录已过期，请重新连接");
    }
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      client_id: client.clientId,
      client_secret: client.clientSecret,
      refresh_token: token.refreshToken,
    });
    const response = await this.fetchFn(new URL("/oauth/v2/token", client.accountsBase), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    const refreshed = await parseTokenResponse(response);
    return { ...refreshed, refreshToken: token.refreshToken };
  }
}

module.exports = {
  DEFAULT_SCOPES,
  ZohoOAuthService,
  parseZohoOAuthConfig,
  readZohoOAuthConfig,
  waitForLoopbackCallback,
};
