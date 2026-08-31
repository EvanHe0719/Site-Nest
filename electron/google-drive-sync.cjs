const { createHash, randomBytes, randomUUID, timingSafeEqual } = require("node:crypto");
const fsp = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const DRIVE_FILE_NAME = "qiye-sync-v1.json";
const DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.appdata";
const EMAIL_SCOPE = "email";
const PROFILE_SCOPE = "profile";
const OPENID_SCOPE = "openid";
const GOOGLE_SCOPES = Object.freeze([OPENID_SCOPE, EMAIL_SCOPE, PROFILE_SCOPE, DRIVE_SCOPE]);
const DRIVE_FILES_URL = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_URL = "https://www.googleapis.com/upload/drive/v3/files";
const DRIVE_CHANGES_URL = "https://www.googleapis.com/drive/v3/changes";
const USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const TOKEN_FILE_VERSION = 1;

class GoogleDriveSyncError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "GoogleDriveSyncError";
    this.code = code;
    if (Number.isInteger(options.status)) this.status = options.status;
    if (options.reason) this.reason = String(options.reason).slice(0, 120);
    if (options.googleCode) this.googleCode = String(options.googleCode).slice(0, 120);
  }
}

function serviceError(code, message, options) {
  return new GoogleDriveSyncError(code, message, options);
}

function isServiceError(error) {
  return error instanceof GoogleDriveSyncError;
}

function base64Url(value) {
  const buffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function createPkcePair() {
  const verifier = base64Url(randomBytes(48));
  const challenge = base64Url(createHash("sha256").update(verifier, "ascii").digest());
  return { verifier, challenge };
}

function constantTimeTextEqual(left, right) {
  const leftBuffer = Buffer.from(String(left || ""), "utf8");
  const rightBuffer = Buffer.from(String(right || ""), "utf8");
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function requireHttpsUrl(value, fieldName) {
  let parsed;
  try {
    parsed = new URL(String(value || ""));
  } catch {
    throw serviceError(
      "GOOGLE_CONFIG_INVALID",
      `Google OAuth 配置中的 ${fieldName} 不是有效网址`,
    );
  }
  if (parsed.protocol !== "https:") {
    throw serviceError(
      "GOOGLE_CONFIG_INVALID",
      `Google OAuth 配置中的 ${fieldName} 必须使用 HTTPS`,
    );
  }
  return parsed.toString();
}

function validateInstalledClientConfig(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw serviceError(
      "GOOGLE_CONFIG_INVALID",
      "Google OAuth 客户端配置不是有效对象",
    );
  }
  if (!value.installed || typeof value.installed !== "object") {
    if (value.web) {
      throw serviceError(
        "GOOGLE_CONFIG_CLIENT_TYPE",
        "Google OAuth 配置必须使用“桌面应用”客户端，不能使用 Web 应用客户端",
      );
    }
    throw serviceError(
      "GOOGLE_CONFIG_CLIENT_TYPE",
      "Google OAuth 配置缺少“桌面应用”客户端信息",
    );
  }
  const installed = value.installed;
  const clientId = String(installed.client_id || "").trim();
  if (!clientId) {
    throw serviceError(
      "GOOGLE_CONFIG_INVALID",
      "Google OAuth 桌面应用配置缺少 client_id",
    );
  }
  const authUri = requireHttpsUrl(
    installed.auth_uri || "https://accounts.google.com/o/oauth2/v2/auth",
    "auth_uri",
  );
  const tokenUri = requireHttpsUrl(
    installed.token_uri || "https://oauth2.googleapis.com/token",
    "token_uri",
  );
  const clientSecret = String(installed.client_secret || "").trim();
  return {
    clientId,
    clientSecret: clientSecret || null,
    authUri,
    tokenUri,
    projectId: String(installed.project_id || "").trim() || null,
  };
}

function normalizeScopes(value) {
  const source = Array.isArray(value) ? value : String(value || "").split(/\s+/);
  return Array.from(new Set(source.map((scope) => String(scope || "").trim()).filter(Boolean)));
}

function hasDriveScope(value) {
  return normalizeScopes(value).includes(DRIVE_SCOPE);
}

function safeStatusError(error) {
  return {
    code: String(error?.code || "GOOGLE_SYNC_ERROR"),
    message: isServiceError(error)
      ? error.message
      : "Google 同步状态暂时无法读取",
  };
}

function googleErrorDetails(value) {
  const root = value?.error && typeof value.error === "object" ? value.error : value;
  const reason = root?.errors?.[0]?.reason || root?.status || value?.error || "";
  const message = root?.message || value?.error_description || "";
  return {
    reason: String(reason || "").slice(0, 120),
    message: String(message || "").slice(0, 500),
  };
}

function mapGoogleResponseError(response, value, fallbackCode, fallbackMessage) {
  const details = googleErrorDetails(value);
  const combined = `${details.reason} ${details.message}`.toLowerCase();
  let code = fallbackCode;
  let message = fallbackMessage;
  if (response.status === 401 || /invalid[_ ]grant|invalid credentials/.test(combined)) {
    code = "GOOGLE_AUTH_EXPIRED";
    message = "Google Drive 授权已失效，请重新授权";
  } else if (/access[_ ]not[_ ]configured|api.*(?:disabled|not.*enabled)|service disabled/.test(combined)) {
    code = "DRIVE_API_DISABLED";
    message = "Google Drive API 未启用";
  } else if (/test user|testing.*access|access blocked|developer-approved testers/.test(combined)) {
    code = "GOOGLE_TEST_USER_REQUIRED";
    message = "当前账号不在 OAuth 测试用户中";
  } else if (response.status === 429 || /rate.?limit|quota.*exceeded/.test(combined)) {
    code = "GOOGLE_RATE_LIMITED";
    message = "Google Drive 请求过于频繁，请稍后重试";
  } else if (response.status === 403) {
    code = "GOOGLE_PERMISSION_DENIED";
    message = "Google Drive 权限不足，请重新授权";
  }
  return serviceError(code, message, {
    status: response.status,
    reason: details.reason,
    googleCode: value?.error?.code || value?.error || "",
  });
}

function responseHtml(title, detail) {
  const safeTitle = String(title || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const safeDetail = String(detail || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return `<!doctype html><meta charset="utf-8"><title>${safeTitle}</title><style>body{font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;background:#f6f7f5;color:#26352f}main{max-width:520px;padding:36px;border:1px solid #dce3df;border-radius:18px;background:white;text-align:center}h1{font-size:22px}p{color:#65736e;line-height:1.7}</style><main><h1>${safeTitle}</h1><p>${safeDetail}</p></main>`;
}

function mergeHeaders(input, patch) {
  const output = {};
  if (input && typeof input.forEach === "function") {
    input.forEach((value, key) => {
      output[key] = value;
    });
  } else if (Array.isArray(input)) {
    for (const [key, value] of input) output[key] = value;
  } else if (input && typeof input === "object") {
    Object.assign(output, input);
  }
  Object.assign(output, patch);
  return output;
}

async function parseResponseJson(response, code, message) {
  let text = "";
  try {
    text = await response.text();
  } catch {
    text = "";
  }
  let value = {};
  if (text) {
    try {
      value = JSON.parse(text);
    } catch {
      if (response.ok) {
        throw serviceError("GOOGLE_INVALID_RESPONSE", `${message}：服务返回了无法识别的数据`, {
          status: response.status,
        });
      }
    }
  }
  if (!response.ok) throw mapGoogleResponseError(response, value, code, message);
  return value;
}

async function atomicWriteText(filePath, contents) {
  const resolved = path.resolve(filePath);
  const directory = path.dirname(resolved);
  const temporary = path.join(
    directory,
    `.${path.basename(resolved)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await fsp.mkdir(directory, { recursive: true });
  let handle;
  try {
    handle = await fsp.open(temporary, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fsp.rename(temporary, resolved);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await fsp.unlink(temporary).catch(() => undefined);
    throw error;
  }
}

class GoogleDriveSyncService {
  constructor(options = {}) {
    this.configPath = options.configPath ? path.resolve(options.configPath) : "";
    this.tokenPath = options.tokenPath ? path.resolve(options.tokenPath) : "";
    this.configSecretPath = options.configSecretPath
      ? path.resolve(options.configSecretPath)
      : this.configPath ? `${this.configPath}.secure.json` : "";
    this.redactConfigAfterImport = options.redactConfigAfterImport === true;
    this.openExternal = options.openExternal;
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.safeStorage = options.safeStorage;
    this.logger = options.logger || null;
    this.authTimeoutMs = Math.max(
      1_000,
      Number(options.authTimeoutMs) || 5 * 60 * 1_000,
    );
    this.requestTimeoutMs = Math.max(1_000, Number(options.requestTimeoutMs) || 20_000);
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.cachedConfig = null;
    this.cachedToken = undefined;
  }

  async status() {
    let config;
    try {
      config = await this._loadConfig();
    } catch (error) {
      return {
        configured: false,
        identity: { status: "signedOut", accountId: null, email: null, displayName: null, avatarUrl: null, signedInAt: null, lastErrorCode: error?.code || "GOOGLE_CLIENT_CONFIG_MISSING" },
        drive: { status: "notConfigured", grantedScopes: [], requiredScopes: [...GOOGLE_SCOPES], lastErrorCode: error?.code || "GOOGLE_CLIENT_CONFIG_MISSING", sanitizedErrorMessage: error?.message || "未找到 Google 桌面 OAuth 配置" },
        signedIn: false,
        email: null,
        fileName: DRIVE_FILE_NAME,
        error: safeStatusError(error),
      };
    }
    try {
      this._requireSafeStorage();
    } catch (error) {
      return {
        configured: true,
        identity: { status: "error", accountId: null, email: null, displayName: null, avatarUrl: null, signedInAt: null, lastErrorCode: error?.code || "GOOGLE_SECURE_STORAGE_UNAVAILABLE" },
        drive: { status: "error", grantedScopes: [], requiredScopes: [...GOOGLE_SCOPES], lastErrorCode: error?.code || "GOOGLE_SECURE_STORAGE_UNAVAILABLE", sanitizedErrorMessage: error?.message || "安全存储不可用" },
        signedIn: false,
        email: null,
        fileName: DRIVE_FILE_NAME,
        clientId: config.clientId,
        error: safeStatusError(error),
      };
    }
    let token;
    try {
      token = await this._loadToken();
    } catch (error) {
      return {
        configured: true,
        identity: { status: "error", accountId: null, email: null, displayName: null, avatarUrl: null, signedInAt: null, lastErrorCode: error?.code || "GOOGLE_TOKEN_READ_FAILED" },
        drive: { status: "error", grantedScopes: [], requiredScopes: [...GOOGLE_SCOPES], lastErrorCode: error?.code || "GOOGLE_TOKEN_READ_FAILED", sanitizedErrorMessage: error?.message || "无法读取 Google 凭据" },
        signedIn: false,
        email: null,
        fileName: DRIVE_FILE_NAME,
        clientId: config.clientId,
        error: safeStatusError(error),
      };
    }
    const signedIn = Boolean(
      token &&
        (token.refreshToken ||
          (token.accessToken && Number(token.expiresAt || 0) > this.now())),
    );
    const grantedScopes = normalizeScopes(token?.scope);
    const scopeReady = hasDriveScope(grantedScopes);
    return {
      configured: true,
      identity: {
        status: signedIn ? "signedIn" : "signedOut",
        accountId: token?.accountId || null,
        email: token?.email || null,
        displayName: token?.displayName || null,
        avatarUrl: token?.avatarUrl || null,
        signedInAt: token?.signedInAt || null,
        lastErrorCode: null,
      },
      drive: {
        status: !signedIn ? "authorizationRequired" : scopeReady ? "ready" : "authorizationRequired",
        grantedScopes,
        requiredScopes: [...GOOGLE_SCOPES],
        lastErrorCode: signedIn && !scopeReady ? "DRIVE_SCOPE_MISSING" : null,
        sanitizedErrorMessage: signedIn && !scopeReady
          ? "当前 Google 登录仅包含基础账号权限，需要使用同一个账号重新授权云同步。"
          : "",
      },
      signedIn,
      email: token?.email || null,
      fileName: DRIVE_FILE_NAME,
      clientId: config.clientId,
      error: null,
    };
  }

  async signIn(options = {}) {
    const config = await this._loadConfig();
    this._requireFetch();
    this._requireSafeStorage();
    if (!this.tokenPath) {
      throw serviceError(
        "GOOGLE_TOKEN_PATH_MISSING",
        "尚未配置 Google 登录凭据保存位置",
      );
    }
    if (typeof this.openExternal !== "function") {
      throw serviceError(
        "GOOGLE_OAUTH_OPEN_UNAVAILABLE",
        "当前环境无法打开系统浏览器完成 Google 登录",
      );
    }
    const { verifier, challenge } = createPkcePair();
    const state = base64Url(randomBytes(32));
    const authorization = await this._receiveAuthorizationCode({
      config,
      verifier,
      challenge,
      state,
      expectedEmail: options.expectedEmail,
    });
    const tokenValue = await this._exchangeAuthorizationCode({
      config,
      code: authorization.code,
      redirectUri: authorization.redirectUri,
      verifier,
    });
    const profile = await this._fetchUserProfile(tokenValue.accessToken);
    const token = {
      ...tokenValue,
      accountId: profile.accountId,
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      signedInAt: new Date(this.now()).toISOString(),
    };
    if (!hasDriveScope(token.scope)) {
      throw serviceError(
        "DRIVE_SCOPE_MISSING",
        "Google 未授予 Drive appDataFolder 权限，请重新授权",
      );
    }
    const expectedEmail = String(options.expectedEmail || "").trim().toLowerCase();
    if (expectedEmail && profile.email.toLowerCase() !== expectedEmail) {
      const accepted = typeof options.confirmAccountSwitch === "function"
        ? await options.confirmAccountSwitch({ expectedEmail, authorizedEmail: profile.email })
        : false;
      if (!accepted) {
        throw serviceError(
          "GOOGLE_ACCOUNT_MISMATCH",
          "当前授权账号与已登录账号不同，已取消切换同步账号",
        );
      }
    }
    await this._saveToken(token);
    return this.status();
  }

  async healthCheck(options = {}) {
    await this._loadConfig();
    this._requireFetch();
    this._requireSafeStorage();
    const token = await this._loadToken();
    if (!token) throw serviceError("GOOGLE_NOT_SIGNED_IN", "尚未登录 Google 账号");
    if (!token.refreshToken) {
      throw serviceError("GOOGLE_AUTH_EXPIRED", "Google Drive 授权已失效，请重新授权");
    }
    if (!hasDriveScope(token.scope)) {
      throw serviceError(
        "DRIVE_SCOPE_MISSING",
        "当前 Google 登录仅包含基础账号权限，需要使用同一个账号重新授权云同步。",
      );
    }
    await this._accessToken(Number(token.expiresAt || 0) <= this.now() + 60_000);
    const file = await this._findRemoteFile();
    if (options.writeTest === true) await this._writeHealthProbe();
    return {
      ok: true,
      empty: !file,
      file: file ? { id: file.id, name: file.name, modifiedTime: file.modifiedTime || null } : null,
      grantedScopes: normalizeScopes(token.scope),
    };
  }

  async signOut() {
    this.cachedToken = null;
    if (!this.tokenPath) {
      throw serviceError(
        "GOOGLE_TOKEN_PATH_MISSING",
        "尚未配置 Google 登录凭据保存位置",
      );
    }
    try {
      await fsp.unlink(this.tokenPath);
    } catch (error) {
      if (error?.code !== "ENOENT") {
        throw serviceError(
          "GOOGLE_TOKEN_DELETE_FAILED",
          "无法清除本机保存的 Google 登录凭据",
          { cause: error },
        );
      }
    }
    return this.status();
  }

  async readRemote() {
    const file = await this._findRemoteFile();
    if (!file) {
      return {
        found: false,
        fileId: null,
        name: DRIVE_FILE_NAME,
        modifiedTime: null,
        data: null,
      };
    }
    const response = await this._authorizedFetch(
      `${DRIVE_FILES_URL}/${encodeURIComponent(file.id)}?alt=media`,
      { method: "GET" },
    );
    const data = await parseResponseJson(
      response,
      "GOOGLE_DRIVE_READ_FAILED",
      "无法读取 Google Drive 中的栖页同步数据",
    );
    return {
      found: true,
      fileId: file.id,
      name: file.name || DRIVE_FILE_NAME,
      modifiedTime: file.modifiedTime || null,
      size: file.size === undefined ? null : String(file.size),
      data,
    };
  }

  async writeRemote(data) {
    let serialized;
    try {
      serialized = JSON.stringify(data);
    } catch (error) {
      throw serviceError(
        "GOOGLE_DRIVE_DATA_INVALID",
        "要同步到 Google Drive 的数据无法转换为 JSON",
        { cause: error },
      );
    }
    if (serialized === undefined) {
      throw serviceError(
        "GOOGLE_DRIVE_DATA_INVALID",
        "要同步到 Google Drive 的数据不能为空",
      );
    }

    const existing = await this._findRemoteFile();
    if (existing) {
      const query = new URLSearchParams({
        uploadType: "media",
        fields: "id,name,modifiedTime,size",
      });
      const response = await this._authorizedFetch(
        `${DRIVE_UPLOAD_URL}/${encodeURIComponent(existing.id)}?${query}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json; charset=utf-8" },
          body: serialized,
        },
      );
      const file = await parseResponseJson(
        response,
        "GOOGLE_DRIVE_WRITE_FAILED",
        "无法更新 Google Drive 中的栖页同步数据",
      );
      return {
        created: false,
        fileId: file.id || existing.id,
        name: file.name || DRIVE_FILE_NAME,
        modifiedTime: file.modifiedTime || null,
        size: file.size === undefined ? null : String(file.size),
      };
    }

    const boundary = `qiye_${base64Url(randomBytes(18))}`;
    const metadata = JSON.stringify({
      name: DRIVE_FILE_NAME,
      parents: ["appDataFolder"],
      mimeType: "application/json",
    });
    const multipartBody = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      metadata,
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      serialized,
      `--${boundary}--`,
      "",
    ].join("\r\n");
    const query = new URLSearchParams({
      uploadType: "multipart",
      fields: "id,name,modifiedTime,size",
    });
    const response = await this._authorizedFetch(`${DRIVE_UPLOAD_URL}?${query}`, {
      method: "POST",
      headers: {
        "content-type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    });
    const file = await parseResponseJson(
      response,
      "GOOGLE_DRIVE_WRITE_FAILED",
      "无法在 Google Drive 中创建栖页同步数据",
    );
    if (!file.id) {
      throw serviceError(
        "GOOGLE_DRIVE_WRITE_FAILED",
        "Google Drive 已响应，但没有返回同步文件编号",
      );
    }
    return {
      created: true,
      fileId: file.id,
      name: file.name || DRIVE_FILE_NAME,
      modifiedTime: file.modifiedTime || null,
      size: file.size === undefined ? null : String(file.size),
    };
  }

  async listAppDataFiles() {
    const files = [];
    let pageToken = "";
    do {
      const query = new URLSearchParams({
        spaces: "appDataFolder",
        q: "trashed=false and name contains 'qiye-'",
        fields: "nextPageToken,files(id,name,modifiedTime,size,appProperties)",
        pageSize: "1000",
      });
      if (pageToken) query.set("pageToken", pageToken);
      const response = await this._authorizedFetch(`${DRIVE_FILES_URL}?${query}`, { method: "GET" });
      const value = await parseResponseJson(response, "GOOGLE_DRIVE_LIST_FAILED", "无法读取栖页增量同步文件列表");
      files.push(...(Array.isArray(value.files) ? value.files : []).filter((file) => file?.id && file?.name));
      pageToken = String(value.nextPageToken || "");
    } while (pageToken);
    return files;
  }

  async readAppDataJson(fileId) {
    const id = String(fileId || "").trim();
    if (!id) throw serviceError("GOOGLE_DRIVE_FILE_INVALID", "缺少 Google Drive 同步文件编号");
    const response = await this._authorizedFetch(`${DRIVE_FILES_URL}/${encodeURIComponent(id)}?alt=media`, { method: "GET" });
    return parseResponseJson(response, "GOOGLE_DRIVE_READ_FAILED", "无法读取 Google Drive 增量同步数据");
  }

  async writeAppDataJson(name, data, options = {}) {
    const fileName = String(name || "").trim();
    if (!/^qiye-[a-z0-9][a-z0-9._-]{1,180}\.json$/i.test(fileName)) {
      throw serviceError("GOOGLE_DRIVE_FILE_INVALID", "增量同步文件名不符合栖页协议");
    }
    const serialized = JSON.stringify(data);
    if (serialized === undefined) throw serviceError("GOOGLE_DRIVE_DATA_INVALID", "增量同步数据不能为空");
    const existing = await this._findAppDataFile(fileName);
    if (existing && options.upsert !== true) {
      return { created: false, existing: true, fileId: existing.id, name: existing.name, modifiedTime: existing.modifiedTime || null };
    }
    if (existing) {
      const query = new URLSearchParams({ uploadType: "media", fields: "id,name,modifiedTime,size,appProperties" });
      const response = await this._authorizedFetch(`${DRIVE_UPLOAD_URL}/${encodeURIComponent(existing.id)}?${query}`, {
        method: "PATCH",
        headers: { "content-type": "application/json; charset=utf-8" },
        body: serialized,
      });
      const file = await parseResponseJson(response, "GOOGLE_DRIVE_WRITE_FAILED", "无法更新栖页增量同步文件");
      return { created: false, fileId: file.id || existing.id, name: file.name || fileName, modifiedTime: file.modifiedTime || null };
    }
    const appProperties = {};
    for (const [key, value] of Object.entries(options.appProperties || {})) {
      if (/^[A-Za-z][A-Za-z0-9_-]{0,60}$/.test(key)) appProperties[key] = String(value).slice(0, 120);
    }
    const boundary = `qiye_${base64Url(randomBytes(18))}`;
    const metadata = JSON.stringify({
      name: fileName,
      parents: ["appDataFolder"],
      mimeType: "application/json",
      appProperties,
    });
    const body = [
      `--${boundary}`, "Content-Type: application/json; charset=UTF-8", "", metadata,
      `--${boundary}`, "Content-Type: application/json; charset=UTF-8", "", serialized,
      `--${boundary}--`, "",
    ].join("\r\n");
    const query = new URLSearchParams({ uploadType: "multipart", fields: "id,name,modifiedTime,size,appProperties" });
    const response = await this._authorizedFetch(`${DRIVE_UPLOAD_URL}?${query}`, {
      method: "POST",
      headers: { "content-type": `multipart/related; boundary=${boundary}` },
      body,
    });
    const file = await parseResponseJson(response, "GOOGLE_DRIVE_WRITE_FAILED", "无法创建栖页增量同步文件");
    if (!file.id) throw serviceError("GOOGLE_INVALID_RESPONSE", "Google Drive 未返回增量同步文件编号");
    return { created: true, fileId: file.id, name: file.name || fileName, modifiedTime: file.modifiedTime || null };
  }

  async getStartPageToken() {
    const query = new URLSearchParams({ spaces: "appDataFolder", fields: "startPageToken" });
    const response = await this._authorizedFetch(`${DRIVE_CHANGES_URL}/startPageToken?${query}`, { method: "GET" });
    const value = await parseResponseJson(response, "GOOGLE_DRIVE_CHANGES_FAILED", "无法获取 Google Drive 变更游标");
    if (!value.startPageToken) throw serviceError("GOOGLE_INVALID_RESPONSE", "Google Drive 未返回变更游标");
    return String(value.startPageToken);
  }

  async listChanges(pageToken) {
    let token = String(pageToken || "").trim();
    if (!token) throw serviceError("GOOGLE_DRIVE_CHANGES_TOKEN_MISSING", "缺少 Google Drive 变更游标");
    const changes = [];
    let newStartPageToken = "";
    do {
      const query = new URLSearchParams({
        pageToken: token,
        spaces: "appDataFolder",
        includeRemoved: "true",
        pageSize: "1000",
        fields: "nextPageToken,newStartPageToken,changes(fileId,removed,file(id,name,modifiedTime,size,trashed,appProperties))",
      });
      const response = await this._authorizedFetch(`${DRIVE_CHANGES_URL}?${query}`, { method: "GET" });
      const value = await parseResponseJson(response, "GOOGLE_DRIVE_CHANGES_FAILED", "无法读取 Google Drive 增量变更");
      changes.push(...(Array.isArray(value.changes) ? value.changes : []));
      token = String(value.nextPageToken || "");
      if (value.newStartPageToken) newStartPageToken = String(value.newStartPageToken);
    } while (token);
    return { changes, newStartPageToken: newStartPageToken || String(pageToken) };
  }

  async _loadConfig() {
    if (this.cachedConfig) return this.cachedConfig;
    if (!this.configPath) {
      throw serviceError(
        "GOOGLE_CLIENT_CONFIG_MISSING",
        "尚未配置 Google OAuth 桌面应用客户端文件",
      );
    }
    let raw;
    try {
      raw = await fsp.readFile(this.configPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        throw serviceError(
          "GOOGLE_CLIENT_CONFIG_MISSING",
          "未找到 Google OAuth 桌面应用客户端配置文件",
          { cause: error },
        );
      }
      throw serviceError(
        "GOOGLE_CONFIG_READ_FAILED",
        "无法读取 Google OAuth 桌面应用客户端配置文件",
        { cause: error },
      );
    }
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw serviceError(
        "GOOGLE_CONFIG_INVALID_JSON",
        "Google OAuth 客户端配置文件不是有效 JSON",
        { cause: error },
      );
    }
    this.cachedConfig = validateInstalledClientConfig(parsed);
    if (this.cachedConfig.clientSecret && this.redactConfigAfterImport) {
      const storage = this._requireSafeStorage();
      const encrypted = storage.encryptString(JSON.stringify({
        clientSecret: this.cachedConfig.clientSecret,
      }));
      await atomicWriteText(this.configSecretPath, `${JSON.stringify({
        version: 1,
        format: "electron-safe-storage",
        ciphertext: Buffer.from(encrypted).toString("base64"),
      }, null, 2)}\n`);
      const redacted = JSON.parse(raw);
      delete redacted.installed.client_secret;
      redacted.installed.client_secret_reference = path.basename(this.configSecretPath);
      await atomicWriteText(this.configPath, `${JSON.stringify(redacted, null, 2)}\n`);
    } else if (!this.cachedConfig.clientSecret && parsed?.installed?.client_secret_reference) {
      try {
        const wrapper = JSON.parse(await fsp.readFile(this.configSecretPath, "utf8"));
        const plaintext = this._requireSafeStorage().decryptString(Buffer.from(wrapper.ciphertext, "base64"));
        const secret = JSON.parse(plaintext)?.clientSecret;
        if (secret) this.cachedConfig.clientSecret = String(secret);
      } catch (error) {
        throw serviceError(
          "GOOGLE_CLIENT_SECRET_UNAVAILABLE",
          "无法读取安全保存的 Google OAuth 客户端凭据",
          { cause: error },
        );
      }
    }
    return this.cachedConfig;
  }

  _requireFetch() {
    if (typeof this.fetchFn !== "function") {
      throw serviceError(
        "GOOGLE_NETWORK_UNAVAILABLE",
        "当前环境无法连接 Google 服务",
      );
    }
  }

  async _fetchWithTimeout(url, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);
    try {
      return await this.fetchFn(url, { ...options, signal: controller.signal });
    } catch (error) {
      if (controller.signal.aborted) {
        throw serviceError("GOOGLE_REQUEST_TIMEOUT", "Google Drive 请求超时，请重试", { cause: error });
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  _requireSafeStorage() {
    const storage = this.safeStorage;
    if (
      !storage ||
      typeof storage.encryptString !== "function" ||
      typeof storage.decryptString !== "function" ||
      (typeof storage.isEncryptionAvailable === "function" &&
        !storage.isEncryptionAvailable())
    ) {
      throw serviceError(
        "GOOGLE_SECURE_STORAGE_UNAVAILABLE",
        "系统安全存储当前不可用，不能保存 Google 登录凭据",
      );
    }
    return storage;
  }

  async _loadToken() {
    if (this.cachedToken !== undefined) return this.cachedToken;
    if (!this.tokenPath) {
      throw serviceError(
        "GOOGLE_TOKEN_PATH_MISSING",
        "尚未配置 Google 登录凭据保存位置",
      );
    }
    let raw;
    try {
      raw = await fsp.readFile(this.tokenPath, "utf8");
    } catch (error) {
      if (error?.code === "ENOENT") {
        this.cachedToken = null;
        return null;
      }
      throw serviceError(
        "GOOGLE_TOKEN_READ_FAILED",
        "无法读取本机保存的 Google 登录凭据",
        { cause: error },
      );
    }
    let wrapper;
    try {
      wrapper = JSON.parse(raw);
    } catch (error) {
      throw serviceError(
        "GOOGLE_TOKEN_DECRYPT_FAILED",
        "本机保存的 Google 登录凭据已损坏，请重新登录",
        { cause: error },
      );
    }
    if (
      wrapper?.version !== TOKEN_FILE_VERSION ||
      wrapper?.format !== "electron-safe-storage" ||
      typeof wrapper?.ciphertext !== "string"
    ) {
      throw serviceError(
        "GOOGLE_TOKEN_DECRYPT_FAILED",
        "本机保存的 Google 登录凭据格式无效，请重新登录",
      );
    }
    const storage = this._requireSafeStorage();
    let token;
    try {
      const plaintext = storage.decryptString(
        Buffer.from(wrapper.ciphertext, "base64"),
      );
      token = JSON.parse(plaintext);
    } catch (error) {
      throw serviceError(
        "GOOGLE_TOKEN_DECRYPT_FAILED",
        "无法解密本机保存的 Google 登录凭据，请重新登录",
        { cause: error },
      );
    }
    if (!token || typeof token !== "object") {
      throw serviceError(
        "GOOGLE_TOKEN_DECRYPT_FAILED",
        "本机保存的 Google 登录凭据内容无效，请重新登录",
      );
    }
    this.cachedToken = token;
    return token;
  }

  async _saveToken(token) {
    if (!this.tokenPath) {
      throw serviceError(
        "GOOGLE_TOKEN_PATH_MISSING",
        "尚未配置 Google 登录凭据保存位置",
      );
    }
    const storage = this._requireSafeStorage();
    let encrypted;
    try {
      encrypted = storage.encryptString(JSON.stringify(token));
    } catch (error) {
      throw serviceError(
        "GOOGLE_TOKEN_ENCRYPT_FAILED",
        "无法使用系统安全存储加密 Google 登录凭据",
        { cause: error },
      );
    }
    const wrapper = {
      version: TOKEN_FILE_VERSION,
      format: "electron-safe-storage",
      ciphertext: Buffer.from(encrypted).toString("base64"),
    };
    try {
      await atomicWriteText(this.tokenPath, `${JSON.stringify(wrapper, null, 2)}\n`);
    } catch (error) {
      throw serviceError(
        "GOOGLE_TOKEN_WRITE_FAILED",
        "无法安全保存 Google 登录凭据",
        { cause: error },
      );
    }
    this.cachedToken = { ...token };
  }

  async _receiveAuthorizationCode({ config, challenge, state, expectedEmail }) {
    let callbackResolve;
    let callbackReject;
    let settled = false;
    const callbackPromise = new Promise((resolve, reject) => {
      callbackResolve = resolve;
      callbackReject = reject;
    });
    // The browser opener may wait for the loopback response before it resolves.
    // Attach a rejection observer immediately so an invalid callback cannot be
    // reported as unhandled during that short interval; awaiting the original
    // promise below still preserves the rejection for the caller.
    void callbackPromise.catch(() => undefined);
    const settle = (handler, value) => {
      if (settled) return;
      settled = true;
      handler(value);
    };
    const server = http.createServer((request, response) => {
      let requestUrl;
      try {
        requestUrl = new URL(request.url || "/", "http://127.0.0.1");
      } catch {
        response.writeHead(400, { "content-type": "text/plain; charset=utf-8" });
        response.end("无效请求");
        return;
      }
      if (request.method !== "GET" || requestUrl.pathname !== "/oauth2/callback") {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end("未找到页面");
        return;
      }
      const returnedState = requestUrl.searchParams.get("state") || "";
      if (!constantTimeTextEqual(returnedState, state)) {
        response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        response.end(responseHtml("Google 登录未完成", "安全校验失败，请返回栖页重试。"));
        settle(
          callbackReject,
          serviceError(
            "GOOGLE_OAUTH_STATE_MISMATCH",
            "Google 登录回调的安全状态不匹配，请重新登录",
          ),
        );
        return;
      }
      const oauthError = requestUrl.searchParams.get("error");
      if (oauthError) {
        const description = requestUrl.searchParams.get("error_description") || "";
        const testUserRequired = /test user|testing.*access|access blocked|developer-approved testers/i.test(description);
        response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        response.end(responseHtml("Google 登录已取消", "可以关闭此页面并返回栖页。"));
        settle(
          callbackReject,
          serviceError(
            testUserRequired ? "GOOGLE_TEST_USER_REQUIRED" : "GOOGLE_PERMISSION_DENIED",
            testUserRequired
              ? "当前账号不在 OAuth 测试用户中"
              : "Google 登录未获授权或已被取消",
            { reason: oauthError },
          ),
        );
        return;
      }
      const code = requestUrl.searchParams.get("code");
      if (!code) {
        response.writeHead(400, { "content-type": "text/html; charset=utf-8" });
        response.end(responseHtml("Google 登录未完成", "授权回调缺少必要信息。"));
        settle(
          callbackReject,
          serviceError(
            "GOOGLE_OAUTH_CALLBACK_INVALID",
            "Google 登录回调缺少授权码",
          ),
        );
        return;
      }
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      response.end(responseHtml("Google 登录成功", "现在可以关闭此页面并返回栖页。"));
      settle(callbackResolve, { code });
    });

    try {
      await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", () => {
          server.removeListener("error", reject);
          resolve();
        });
      });
    } catch (error) {
      throw serviceError(
        "GOOGLE_OAUTH_LOOPBACK_FAILED",
        "无法启动本机 Google 登录回调，请检查安全软件设置",
        { cause: error },
      );
    }

    const address = server.address();
    const redirectUri = `http://127.0.0.1:${address.port}/oauth2/callback`;
    const authUrl = new URL(config.authUri);
    authUrl.search = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: GOOGLE_SCOPES.join(" "),
      state,
      code_challenge: challenge,
      code_challenge_method: "S256",
      access_type: "offline",
      prompt: "consent",
      include_granted_scopes: "true",
    }).toString();
    if (String(expectedEmail || "").trim()) {
      authUrl.searchParams.set("login_hint", String(expectedEmail).trim());
    }

    let timeout;
    try {
      timeout = setTimeout(() => {
        settle(
          callbackReject,
          serviceError(
            "GOOGLE_OAUTH_TIMEOUT",
            "等待 Google 登录超时，请重新尝试",
          ),
        );
      }, this.authTimeoutMs);
      try {
        await this.openExternal(authUrl.toString());
      } catch (error) {
        throw serviceError(
          "GOOGLE_OAUTH_OPEN_FAILED",
          "无法在系统浏览器中打开 Google 登录页面",
          { cause: error },
        );
      }
      const callback = await callbackPromise;
      return { ...callback, redirectUri };
    } finally {
      clearTimeout(timeout);
      await new Promise((resolve) => server.close(() => resolve())).catch(
        () => undefined,
      );
    }
  }

  async _exchangeAuthorizationCode({ config, code, redirectUri, verifier }) {
    const body = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: config.clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    });
    if (config.clientSecret) body.set("client_secret", config.clientSecret);
    let response;
    try {
      response = await this._fetchWithTimeout(config.tokenUri, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch (error) {
      if (isServiceError(error)) throw error;
      throw serviceError(
        "GOOGLE_TOKEN_EXCHANGE_FAILED",
        "无法连接 Google 完成登录凭据交换",
        { cause: error },
      );
    }
    const value = await parseResponseJson(
      response,
      "GOOGLE_TOKEN_EXCHANGE_FAILED",
      "Google 登录凭据交换失败",
    );
    if (!value.access_token) {
      throw serviceError(
        "GOOGLE_TOKEN_EXCHANGE_FAILED",
        "Google 没有返回可用的访问凭据",
      );
    }
    const expiresIn = Math.max(0, Number(value.expires_in) || 0);
    return {
      accessToken: String(value.access_token),
      refreshToken: value.refresh_token ? String(value.refresh_token) : null,
      tokenType: String(value.token_type || "Bearer"),
      scope: normalizeScopes(value.scope).join(" "),
      expiresAt: expiresIn ? this.now() + expiresIn * 1_000 : this.now(),
    };
  }

  async _fetchUserProfile(accessToken) {
    let response;
    try {
      response = await this._fetchWithTimeout(USERINFO_URL, {
        method: "GET",
        headers: { authorization: `Bearer ${accessToken}` },
      });
    } catch (error) {
      if (isServiceError(error)) throw error;
      throw serviceError(
        "GOOGLE_PROFILE_FAILED",
        "无法读取 Google 账号信息",
        { cause: error },
      );
    }
    const value = await parseResponseJson(
      response,
      "GOOGLE_PROFILE_FAILED",
      "无法读取 Google 账号信息",
    );
    const email = String(value.email || "").trim();
    if (!email) {
      throw serviceError(
        "GOOGLE_PROFILE_FAILED",
        "Google 账号没有返回可识别的邮箱地址",
      );
    }
    return {
      accountId: String(value.sub || "").trim() || null,
      email,
      displayName: String(value.name || "").trim().slice(0, 160) || null,
      avatarUrl: /^https:\/\//i.test(String(value.picture || ""))
        ? String(value.picture).slice(0, 1000)
        : null,
    };
  }

  async _refreshToken(token) {
    if (!token?.refreshToken) {
      throw serviceError(
        "GOOGLE_NOT_SIGNED_IN",
        "Google 登录已失效，请重新登录",
      );
    }
    const config = await this._loadConfig();
    const body = new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: token.refreshToken,
      client_id: config.clientId,
    });
    if (config.clientSecret) body.set("client_secret", config.clientSecret);
    let response;
    try {
      response = await this._fetchWithTimeout(config.tokenUri, {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: body.toString(),
      });
    } catch (error) {
      if (isServiceError(error)) throw error;
      throw serviceError(
        "GOOGLE_NETWORK_ERROR",
        "暂时无法连接 Google Drive",
        { cause: error },
      );
    }
    const value = await parseResponseJson(
      response,
      "GOOGLE_TOKEN_REFRESH_FAILED",
      "Google 登录状态刷新失败，请重新登录",
    );
    if (!value.access_token) {
      throw serviceError(
        "GOOGLE_TOKEN_REFRESH_FAILED",
        "Google 没有返回新的访问凭据，请重新登录",
      );
    }
    const expiresIn = Math.max(0, Number(value.expires_in) || 0);
    const refreshed = {
      ...token,
      accessToken: String(value.access_token),
      refreshToken: value.refresh_token
        ? String(value.refresh_token)
        : token.refreshToken,
      tokenType: String(value.token_type || token.tokenType || "Bearer"),
      scope: normalizeScopes(value.scope || token.scope).join(" "),
      expiresAt: expiresIn ? this.now() + expiresIn * 1_000 : this.now(),
    };
    await this._saveToken(refreshed);
    return refreshed;
  }

  async _accessToken(forceRefresh = false) {
    this._requireFetch();
    const token = await this._loadToken();
    if (!token) {
      throw serviceError(
        "GOOGLE_NOT_SIGNED_IN",
        "尚未登录 Google 账号",
      );
    }
    if (!hasDriveScope(token.scope)) {
      throw serviceError(
        "DRIVE_SCOPE_MISSING",
        "当前 Google 登录仅包含基础账号权限，需要使用同一个账号重新授权云同步。",
      );
    }
    const remains = Number(token.expiresAt || 0) - this.now();
    if (!forceRefresh && token.accessToken && remains > 60_000) {
      return token.accessToken;
    }
    const refreshed = await this._refreshToken(token);
    return refreshed.accessToken;
  }

  async _authorizedFetch(url, options = {}, allowRetry = true) {
    const accessToken = await this._accessToken(false);
    let response;
    try {
      response = await this._fetchWithTimeout(url, {
        ...options,
        headers: mergeHeaders(options.headers, {
          authorization: `Bearer ${accessToken}`,
        }),
      });
    } catch (error) {
      if (isServiceError(error)) throw error;
      throw serviceError(
        "GOOGLE_NETWORK_ERROR",
        "无法连接 Google Drive，请检查网络后重试",
        { cause: error },
      );
    }
    if (response.status === 401 && allowRetry) {
      const refreshed = await this._accessToken(true);
      try {
        return await this._fetchWithTimeout(url, {
          ...options,
          headers: mergeHeaders(options.headers, {
            authorization: `Bearer ${refreshed}`,
          }),
        });
      } catch (error) {
        if (isServiceError(error)) throw error;
          throw serviceError(
          "GOOGLE_NETWORK_ERROR",
          "无法连接 Google Drive，请检查网络后重试",
          { cause: error },
        );
      }
    }
    return response;
  }

  async _findRemoteFile() {
    return this._findAppDataFile(DRIVE_FILE_NAME);
  }

  async _findAppDataFile(fileName) {
    const query = new URLSearchParams({
      spaces: "appDataFolder",
      q: `name='${String(fileName).replace(/'/g, "\\'")}' and trashed=false`,
      fields: "files(id,name,modifiedTime,size)",
      pageSize: "10",
    });
    const response = await this._authorizedFetch(`${DRIVE_FILES_URL}?${query}`, {
      method: "GET",
    });
    const value = await parseResponseJson(
      response,
      "GOOGLE_DRIVE_LIST_FAILED",
      "无法查找 Google Drive 中的栖页同步文件",
    );
    const files = Array.isArray(value.files) ? value.files : [];
    return files.find((file) => file?.id && file?.name === fileName) || null;
  }

  async _writeHealthProbe() {
    const name = `qiye-health-${randomUUID()}.json`;
    const boundary = `qiye_${base64Url(randomBytes(18))}`;
    const body = [
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify({ name, parents: ["appDataFolder"], mimeType: "application/json" }),
      `--${boundary}`,
      "Content-Type: application/json; charset=UTF-8",
      "",
      JSON.stringify({ probe: true, createdAt: new Date(this.now()).toISOString() }),
      `--${boundary}--`,
      "",
    ].join("\r\n");
    const createResponse = await this._authorizedFetch(
      `${DRIVE_UPLOAD_URL}?${new URLSearchParams({ uploadType: "multipart", fields: "id,name" })}`,
      { method: "POST", headers: { "content-type": `multipart/related; boundary=${boundary}` }, body },
    );
    const created = await parseResponseJson(
      createResponse,
      "DRIVE_APPDATA_WRITE_FAILED",
      "无法写入 Google Drive appDataFolder 测试文件",
    );
    if (!created?.id) {
      throw serviceError("GOOGLE_INVALID_RESPONSE", "Google Drive 未返回测试文件编号");
    }
    const deleteResponse = await this._authorizedFetch(
      `${DRIVE_FILES_URL}/${encodeURIComponent(created.id)}`,
      { method: "DELETE" },
    );
    if (!deleteResponse.ok) {
      let value = {};
      try { value = await deleteResponse.json(); } catch { value = {}; }
      throw mapGoogleResponseError(
        deleteResponse,
        value,
        "DRIVE_APPDATA_WRITE_FAILED",
        "无法删除 Google Drive appDataFolder 测试文件",
      );
    }
  }
}

module.exports = {
  DRIVE_FILE_NAME,
  DRIVE_SCOPE,
  EMAIL_SCOPE,
  GOOGLE_SCOPES,
  GoogleDriveSyncError,
  GoogleDriveSyncService,
  OPENID_SCOPE,
  PROFILE_SCOPE,
  createPkcePair,
  hasDriveScope,
  normalizeScopes,
  validateInstalledClientConfig,
};
