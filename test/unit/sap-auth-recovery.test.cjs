const assert = require("node:assert/strict");
const test = require("node:test");

const {
  clearSapAuthenticationState,
  hasSapLoginRejection,
  isSapCookieDomain,
  isSapSearchTarget,
  isSapSessionHost,
  sapRetryUrl,
  sapStorageOrigins,
} = require("../../electron/browser/sap-auth-recovery.cjs");

test("SAP session hosts and parent cookie domains are distinguished", () => {
  assert.equal(isSapSessionHost("sapit-forme-prod.authentication.eu11.hana.ondemand.com"), true);
  assert.equal(isSapSessionHost("accounts.sap.com"), true);
  assert.equal(isSapSessionHost("unrelated.hana.ondemand.com"), false);
  assert.equal(isSapCookieDomain(".sap.com"), true);
  assert.equal(isSapCookieDomain(".support.sap.com"), true);
  assert.equal(isSapCookieDomain(".hana.ondemand.com"), true);
  assert.equal(isSapCookieDomain("example.com"), false);
});

test("SAP retry preserves the exact search URL and rejects unrelated candidates", () => {
  const target = "https://me.sap.com/servicessupport/search/?q=ICP%20test&scope=a%2Fb";
  assert.equal(isSapSearchTarget(target), true);
  assert.equal(isSapSearchTarget("https://example.com/servicessupport/search/?q=ICP"), false);
  assert.equal(sapRetryUrl("https://attacker.test/", target), target);
  assert.equal(sapRetryUrl("https://accounts.sap.com/saml2/idp/sso"), "https://me.sap.com/home");
  assert.equal(hasSapLoginRejection("The request was rejected because it contained a potentially malicious character."), true);
});

test("SAP storage origins include only the known login chain", () => {
  assert.deepEqual(sapStorageOrigins({
    currentUrl: "https://sapit-forme-prod.authentication.eu11.hana.ondemand.com/oauth/authorize?code=secret",
    visitedOrigins: [
      "https://accounts.sap.com/saml2/idp/sso",
      "https://unrelated.hana.ondemand.com/app",
      "https://example.com/",
    ],
  }), [
    "https://support.sap.com",
    "https://me.sap.com",
    "https://accounts.sap.com",
    "https://sapit-forme-prod.authentication.eu11.hana.ondemand.com",
  ]);
});

test("SAP reset removes parent-domain cookies without touching other sites", async () => {
  const removed = [];
  const clearedOrigins = [];
  const calls = [];
  let cookieJar = [
    { domain: ".sap.com", path: "/", secure: true, name: "sap-parent" },
    { domain: ".support.sap.com", path: "/portal", secure: true, name: "sap-support" },
    { domain: ".hana.ondemand.com", path: "/", secure: true, name: "sap-auth" },
    { domain: ".example.com", path: "/", secure: true, name: "unrelated" },
  ];
  const targetSession = {
    cookies: {
      get: async () => {
        calls.push("cookies:get");
        return cookieJar;
      },
      remove: async (url, name) => {
        calls.push(`cookie:remove:${name}`);
        removed.push([url, name]);
        cookieJar = cookieJar.filter((cookie) => cookie.name !== name);
      },
    },
    clearStorageData: async ({ origin }) => {
      calls.push(`storage:${origin}`);
      clearedOrigins.push(origin);
    },
    clearCache: async () => calls.push("cache"),
    clearAuthCache: async () => calls.push("auth"),
    closeAllConnections: async () => calls.push("connections"),
    clearHostResolverCache: async () => calls.push("dns"),
  };

  const result = await clearSapAuthenticationState(targetSession, {
    currentUrl: "https://sapit-forme-prod.authentication.eu11.hana.ondemand.com/oauth/authorize",
  });

  assert.deepEqual(removed, [
    ["https://sap.com/", "sap-parent"],
    ["https://support.sap.com/portal", "sap-support"],
    ["https://hana.ondemand.com/", "sap-auth"],
  ]);
  assert.equal(result.removedCookieCount, 3);
  assert.equal(result.remainingCookieCount, 0);
  assert.deepEqual(cookieJar.map((cookie) => cookie.name), ["unrelated"]);
  assert.ok(clearedOrigins.includes("https://accounts.sap.com"));
  assert.ok(clearedOrigins.includes("https://sapit-forme-prod.authentication.eu11.hana.ondemand.com"));
  assert.equal(calls[0], "connections");
  assert.ok(calls.indexOf("cookies:get") > calls.indexOf("connections"));
  assert.ok(calls.findIndex((call) => call.startsWith("storage:")) > calls.indexOf("connections"));
  assert.ok(calls.includes("auth"));
  assert.ok(calls.includes("cache"));
  assert.ok(calls.includes("dns"));
});

test("SAP entire-partition reset removes every cookie and clears storage without an origin scope", async () => {
  const calls = [];
  const removed = [];
  const storageOptions = [];
  let cookieJar = [
    { domain: ".sap.com", path: "/", secure: true, name: "sap-cookie" },
    { domain: ".example.com", path: "/account", secure: true, name: "other-cookie" },
  ];
  const targetSession = {
    cookies: {
      get: async () => {
        calls.push("cookies:get");
        return cookieJar;
      },
      remove: async (url, name) => {
        calls.push(`cookie:remove:${name}`);
        removed.push([url, name]);
        cookieJar = cookieJar.filter((cookie) => cookie.name !== name);
      },
    },
    clearStorageData: async (options) => {
      calls.push("storage:global");
      storageOptions.push(options);
    },
    clearCache: async () => calls.push("cache"),
    clearAuthCache: async () => calls.push("auth"),
    closeAllConnections: async () => calls.push("connections"),
    clearHostResolverCache: async () => calls.push("dns"),
  };

  const result = await clearSapAuthenticationState(targetSession, {
    clearEntirePartition: true,
    currentUrl: "https://accounts.sap.com/saml2/idp/sso",
  });

  assert.equal(calls[0], "connections");
  assert.deepEqual(removed, [
    ["https://sap.com/", "sap-cookie"],
    ["https://example.com/account", "other-cookie"],
  ]);
  assert.equal(result.removedCookieCount, 2);
  assert.equal(result.remainingCookieCount, 0);
  assert.deepEqual(cookieJar, []);
  assert.equal(storageOptions.length, 1);
  assert.equal(storageOptions[0]?.origin, undefined);
});
