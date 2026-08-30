const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
  DRIVE_FILE_NAME,
  DRIVE_SCOPE,
  EMAIL_SCOPE,
  GOOGLE_SCOPES,
  GoogleDriveSyncError,
  GoogleDriveSyncService,
  OPENID_SCOPE,
  PROFILE_SCOPE,
  validateInstalledClientConfig,
} = require("../../electron/google-drive-sync.cjs");

const NOW = Date.parse("2026-08-29T12:00:00.000Z");
const TOKEN_URI = "https://oauth2.googleapis.test/token";

async function temporaryDirectory(t) {
  const directory = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-google-sync-"));
  t.after(() => fsp.rm(directory, { recursive: true, force: true }));
  return directory;
}

function desktopClient(overrides = {}) {
  return {
    installed: {
      client_id: "desktop-client.apps.googleusercontent.com",
      project_id: "qiye-local-test",
      auth_uri: "https://accounts.google.test/o/oauth2/v2/auth",
      token_uri: TOKEN_URI,
      client_secret: "desktop-client-secret",
      redirect_uris: ["http://localhost"],
      ...overrides,
    },
  };
}

async function writeConfig(directory, value = desktopClient()) {
  const configPath = path.join(directory, "google-oauth-client.json");
  await fsp.writeFile(configPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  return configPath;
}

function safeStorageFixture() {
  const encryptedPlaintexts = [];
  return {
    encryptedPlaintexts,
    isEncryptionAvailable: () => true,
    encryptString(plaintext) {
      encryptedPlaintexts.push(plaintext);
      return Buffer.from(
        `fixture-secure:${Buffer.from(plaintext, "utf8").toString("base64")}`,
        "utf8",
      );
    },
    decryptString(ciphertext) {
      const encoded = Buffer.from(ciphertext)
        .toString("utf8")
        .replace(/^fixture-secure:/, "");
      return Buffer.from(encoded, "base64").toString("utf8");
    },
  };
}

async function seedEncryptedToken(tokenPath, safeStorage, token) {
  const ciphertext = safeStorage.encryptString(JSON.stringify(token));
  await fsp.writeFile(
    tokenPath,
    `${JSON.stringify({
      version: 1,
      format: "electron-safe-storage",
      ciphertext: Buffer.from(ciphertext).toString("base64"),
    })}\n`,
    "utf8",
  );
}

function jsonResponse(value, status = 200) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function requestLoopback(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, (response) => {
      response.resume();
      response.once("end", () => resolve(response.statusCode));
    });
    request.once("error", reject);
  });
}

test("only a Desktop installed OAuth client is accepted", async (t) => {
  assert.throws(
    () =>
      validateInstalledClientConfig({
        web: {
          client_id: "web-client.apps.googleusercontent.com",
          auth_uri: "https://accounts.google.test/auth",
          token_uri: TOKEN_URI,
        },
      }),
    (error) =>
      error instanceof GoogleDriveSyncError &&
      error.code === "GOOGLE_CONFIG_CLIENT_TYPE" &&
      /桌面应用/.test(error.message),
  );

  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory, {
    web: {
      client_id: "web-client.apps.googleusercontent.com",
      auth_uri: "https://accounts.google.test/auth",
      token_uri: TOKEN_URI,
    },
  });
  const service = new GoogleDriveSyncService({
    configPath,
    tokenPath: path.join(directory, "token.json"),
    openExternal: async () => undefined,
    fetchFn: async () => jsonResponse({}),
    safeStorage: safeStorageFixture(),
  });
  const status = await service.status();
  assert.equal(status.configured, false);
  assert.equal(status.signedIn, false);
  assert.equal(status.error.code, "GOOGLE_CONFIG_CLIENT_TYPE");
  await assert.rejects(
    service.signIn(),
    (error) => error.code === "GOOGLE_CONFIG_CLIENT_TYPE" && /桌面应用/.test(error.message),
  );
});

test("OAuth loopback uses PKCE S256 and rejects a mismatched state before token exchange", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  let openedUrl;
  let fetchCount = 0;
  const service = new GoogleDriveSyncService({
    configPath,
    tokenPath: path.join(directory, "token.json"),
    safeStorage: safeStorageFixture(),
    authTimeoutMs: 5_000,
    fetchFn: async () => {
      fetchCount += 1;
      return jsonResponse({});
    },
    openExternal: async (rawUrl) => {
      openedUrl = new URL(rawUrl);
      const callback = new URL(openedUrl.searchParams.get("redirect_uri"));
      assert.equal(callback.hostname, "127.0.0.1");
      assert.ok(Number(callback.port) > 0);
      callback.searchParams.set("code", "authorization-code-must-not-be-used");
      callback.searchParams.set("state", "wrong-state");
      assert.equal(await requestLoopback(callback), 400);
    },
  });

  await assert.rejects(
    service.signIn(),
    (error) =>
      error.code === "GOOGLE_OAUTH_STATE_MISMATCH" &&
      /安全状态/.test(error.message),
  );
  assert.equal(fetchCount, 0);
  assert.equal(openedUrl.searchParams.get("code_challenge_method"), "S256");
  assert.ok(openedUrl.searchParams.get("code_challenge").length >= 43);
  assert.ok(openedUrl.searchParams.get("state").length >= 32);
  const scopes = openedUrl.searchParams.get("scope").split(" ");
  assert.deepEqual(new Set(scopes), new Set([DRIVE_SCOPE, EMAIL_SCOPE, PROFILE_SCOPE, OPENID_SCOPE]));
});

test("successful sign-in proves PKCE, obtains email, and persists only safeStorage ciphertext", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const tokenPath = path.join(directory, "google-token.enc.json");
  const configSecretPath = path.join(directory, "google-client.secure.json");
  const safeStorage = safeStorageFixture();
  const requests = [];
  let authorizationUrl;
  const service = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    configSecretPath,
    redactConfigAfterImport: true,
    safeStorage,
    now: () => NOW,
    authTimeoutMs: 5_000,
    openExternal: async (rawUrl) => {
      authorizationUrl = new URL(rawUrl);
      const callback = new URL(authorizationUrl.searchParams.get("redirect_uri"));
      callback.searchParams.set("code", "one-time-code");
      callback.searchParams.set("state", authorizationUrl.searchParams.get("state"));
      assert.equal(await requestLoopback(callback), 200);
    },
    fetchFn: async (rawUrl, options = {}) => {
      const url = String(rawUrl);
      requests.push({ url, options });
      if (url === TOKEN_URI) {
        const body = new URLSearchParams(options.body);
        assert.equal(body.get("grant_type"), "authorization_code");
        assert.equal(body.get("code"), "one-time-code");
        assert.equal(body.get("redirect_uri"), authorizationUrl.searchParams.get("redirect_uri"));
        const verifier = body.get("code_verifier");
        const expectedChallenge = createHash("sha256")
          .update(verifier, "ascii")
          .digest("base64url");
        assert.equal(
          authorizationUrl.searchParams.get("code_challenge"),
          expectedChallenge,
        );
        return jsonResponse({
          access_token: "access-token-private",
          refresh_token: "refresh-token-private",
          expires_in: 3600,
          token_type: "Bearer",
          scope: `${DRIVE_SCOPE} ${EMAIL_SCOPE} ${PROFILE_SCOPE} ${OPENID_SCOPE}`,
        });
      }
      assert.equal(url, "https://openidconnect.googleapis.com/v1/userinfo");
      assert.equal(options.headers.authorization, "Bearer access-token-private");
      return jsonResponse({ email: "reader@example.test", email_verified: true });
    },
  });

  const status = await service.signIn();
  assert.equal(status.configured, true);
  assert.equal(status.signedIn, true);
  assert.equal(status.email, "reader@example.test");
  assert.equal(requests.length, 2);

  const disk = await fsp.readFile(tokenPath, "utf8");
  assert.doesNotMatch(disk, /access-token-private/);
  assert.doesNotMatch(disk, /refresh-token-private/);
  assert.doesNotMatch(disk, /reader@example\.test/);
  const wrapper = JSON.parse(disk);
  assert.equal(wrapper.version, 1);
  assert.equal(wrapper.format, "electron-safe-storage");
  assert.ok(wrapper.ciphertext.length > 40);
  assert.match(safeStorage.encryptedPlaintexts.at(-1), /access-token-private/);
  const redactedConfig = await fsp.readFile(configPath, "utf8");
  assert.doesNotMatch(redactedConfig, /desktop-client-secret/);
  assert.match(redactedConfig, /client_secret_reference/);
  const encryptedClient = await fsp.readFile(configSecretPath, "utf8");
  assert.doesNotMatch(encryptedClient, /desktop-client-secret/);
  assert.match(encryptedClient, /electron-safe-storage/);

  const signedOut = await service.signOut();
  assert.equal(signedOut.configured, true);
  assert.equal(signedOut.signedIn, false);
  await assert.rejects(fsp.access(tokenPath), (error) => error.code === "ENOENT");
});

test("readRemote searches only appDataFolder and reads the fixed sync file as JSON", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const tokenPath = path.join(directory, "token.enc.json");
  const safeStorage = safeStorageFixture();
  await seedEncryptedToken(tokenPath, safeStorage, {
    accessToken: "drive-access-private",
    refreshToken: "drive-refresh-private",
    expiresAt: NOW + 3_600_000,
    email: "drive@example.test",
    scope: `${DRIVE_SCOPE} ${EMAIL_SCOPE} ${PROFILE_SCOPE} ${OPENID_SCOPE}`,
  });
  const calls = [];
  const service = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async (rawUrl, options = {}) => {
      const url = new URL(String(rawUrl));
      calls.push({ url, options });
      assert.equal(options.headers.authorization, "Bearer drive-access-private");
      if (url.pathname === "/drive/v3/files") {
        assert.equal(url.searchParams.get("spaces"), "appDataFolder");
        assert.equal(
          url.searchParams.get("q"),
          `name='${DRIVE_FILE_NAME}' and trashed=false`,
        );
        assert.match(url.searchParams.get("fields"), /files\(id,name,modifiedTime,size\)/);
        return jsonResponse({
          files: [
            {
              id: "drive-file-id",
              name: DRIVE_FILE_NAME,
              modifiedTime: "2026-08-29T11:58:00.000Z",
              size: "321",
            },
          ],
        });
      }
      assert.equal(url.pathname, "/drive/v3/files/drive-file-id");
      assert.equal(url.searchParams.get("alt"), "media");
      return jsonResponse({ version: 1, sites: [{ id: "site-a" }] });
    },
  });

  const remote = await service.readRemote();
  assert.equal(remote.found, true);
  assert.equal(remote.fileId, "drive-file-id");
  assert.equal(remote.name, DRIVE_FILE_NAME);
  assert.equal(remote.size, "321");
  assert.deepEqual(remote.data, { version: 1, sites: [{ id: "site-a" }] });
  assert.equal(calls.length, 2);
});

test("writeRemote updates the fixed file when found and creates it in appDataFolder otherwise", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const safeStorage = safeStorageFixture();
  const token = {
    accessToken: "drive-write-access",
    refreshToken: "drive-write-refresh",
    expiresAt: NOW + 3_600_000,
    email: "writer@example.test",
    scope: `${DRIVE_SCOPE} ${EMAIL_SCOPE} ${PROFILE_SCOPE} ${OPENID_SCOPE}`,
  };

  const updateTokenPath = path.join(directory, "update-token.enc.json");
  await seedEncryptedToken(updateTokenPath, safeStorage, token);
  const updateCalls = [];
  const updateService = new GoogleDriveSyncService({
    configPath,
    tokenPath: updateTokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async (rawUrl, options = {}) => {
      const url = new URL(String(rawUrl));
      updateCalls.push({ url, options });
      if (url.pathname === "/drive/v3/files") {
        return jsonResponse({ files: [{ id: "existing-file", name: DRIVE_FILE_NAME }] });
      }
      assert.equal(url.pathname, "/upload/drive/v3/files/existing-file");
      assert.equal(options.method, "PATCH");
      assert.equal(url.searchParams.get("uploadType"), "media");
      assert.equal(options.headers["content-type"], "application/json; charset=utf-8");
      assert.equal(options.headers.authorization, "Bearer drive-write-access");
      assert.deepEqual(JSON.parse(options.body), { version: 1, updated: true });
      return jsonResponse({
        id: "existing-file",
        name: DRIVE_FILE_NAME,
        modifiedTime: "2026-08-29T12:01:00.000Z",
        size: "45",
      });
    },
  });
  const updated = await updateService.writeRemote({ version: 1, updated: true });
  assert.deepEqual(updated, {
    created: false,
    fileId: "existing-file",
    name: DRIVE_FILE_NAME,
    modifiedTime: "2026-08-29T12:01:00.000Z",
    size: "45",
  });
  assert.equal(updateCalls.length, 2);

  const createTokenPath = path.join(directory, "create-token.enc.json");
  await seedEncryptedToken(createTokenPath, safeStorage, token);
  const createCalls = [];
  const createService = new GoogleDriveSyncService({
    configPath,
    tokenPath: createTokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async (rawUrl, options = {}) => {
      const url = new URL(String(rawUrl));
      createCalls.push({ url, options });
      if (url.pathname === "/drive/v3/files") return jsonResponse({ files: [] });
      assert.equal(url.pathname, "/upload/drive/v3/files");
      assert.equal(options.method, "POST");
      assert.equal(url.searchParams.get("uploadType"), "multipart");
      assert.match(options.headers["content-type"], /^multipart\/related; boundary=/);
      assert.equal(options.headers.authorization, "Bearer drive-write-access");
      assert.match(options.body, new RegExp(`"name":"${DRIVE_FILE_NAME}"`));
      assert.match(options.body, /"parents":\["appDataFolder"\]/);
      assert.match(options.body, /"created":true/);
      return jsonResponse({
        id: "created-file",
        name: DRIVE_FILE_NAME,
        modifiedTime: "2026-08-29T12:02:00.000Z",
      });
    },
  });
  const created = await createService.writeRemote({ version: 1, created: true });
  assert.equal(created.created, true);
  assert.equal(created.fileId, "created-file");
  assert.equal(created.name, DRIVE_FILE_NAME);
  assert.equal(createCalls.length, 2);
});

test("identity remains signed in while an old token without drive.appdata requires reauthorization", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const tokenPath = path.join(directory, "token.enc.json");
  const safeStorage = safeStorageFixture();
  await seedEncryptedToken(tokenPath, safeStorage, {
    accessToken: "identity-only-access",
    refreshToken: "identity-only-refresh",
    expiresAt: NOW + 3_600_000,
    email: "same-account@example.test",
    scope: `${OPENID_SCOPE} ${EMAIL_SCOPE} ${PROFILE_SCOPE}`,
  });
  const service = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async () => {
      throw new Error("Drive must not be called without scope");
    },
  });
  const status = await service.status();
  assert.equal(status.identity.status, "signedIn");
  assert.equal(status.identity.email, "same-account@example.test");
  assert.equal(status.drive.status, "authorizationRequired");
  assert.equal(status.drive.lastErrorCode, "DRIVE_SCOPE_MISSING");
  await assert.rejects(service.readRemote(), (error) => error.code === "DRIVE_SCOPE_MISSING");
});

test("health check treats an empty appDataFolder as normal and maps a disabled API precisely", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const tokenPath = path.join(directory, "token.enc.json");
  const safeStorage = safeStorageFixture();
  await seedEncryptedToken(tokenPath, safeStorage, {
    accessToken: "health-access",
    refreshToken: "health-refresh",
    expiresAt: NOW + 3_600_000,
    email: "health@example.test",
    scope: GOOGLE_SCOPES.join(" "),
  });
  const emptyService = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async (rawUrl) => {
      const url = new URL(String(rawUrl));
      assert.equal(url.searchParams.get("spaces"), "appDataFolder");
      return jsonResponse({ files: [] });
    },
  });
  assert.deepEqual(await emptyService.healthCheck(), {
    ok: true,
    empty: true,
    file: null,
    grantedScopes: GOOGLE_SCOPES,
  });

  const disabledService = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async () => jsonResponse({
      error: {
        code: 403,
        message: "Google Drive API has not been used or is disabled",
        errors: [{ reason: "accessNotConfigured" }],
      },
    }, 403),
  });
  await assert.rejects(
    disabledService.healthCheck(),
    (error) => error.code === "DRIVE_API_DISABLED" && error.status === 403,
  );
});

test("health check separates expired authorization from network failure", async (t) => {
  const directory = await temporaryDirectory(t);
  const configPath = await writeConfig(directory);
  const tokenPath = path.join(directory, "token.enc.json");
  const safeStorage = safeStorageFixture();
  await seedEncryptedToken(tokenPath, safeStorage, {
    accessToken: "expired-access",
    refreshToken: "expired-refresh",
    expiresAt: NOW - 1,
    email: "expired@example.test",
    scope: GOOGLE_SCOPES.join(" "),
  });
  const expiredService = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async () => jsonResponse({ error: "invalid_grant", error_description: "Token has been expired or revoked" }, 400),
  });
  await assert.rejects(expiredService.healthCheck(), (error) => error.code === "GOOGLE_AUTH_EXPIRED");

  const networkService = new GoogleDriveSyncService({
    configPath,
    tokenPath,
    safeStorage,
    now: () => NOW,
    fetchFn: async () => { throw new Error("offline"); },
  });
  await assert.rejects(networkService.healthCheck(), (error) => error.code === "GOOGLE_NETWORK_ERROR");
});
