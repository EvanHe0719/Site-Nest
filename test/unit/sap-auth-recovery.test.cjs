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
  const targetSession = {
    cookies: {
      get: async () => [
        { domain: ".sap.com", path: "/", secure: true, name: "sap-parent" },
        { domain: ".support.sap.com", path: "/portal", secure: true, name: "sap-support" },
        { domain: ".hana.ondemand.com", path: "/", secure: true, name: "sap-auth" },
        { domain: ".example.com", path: "/", secure: true, name: "unrelated" },
      ],
      remove: async (url, name) => removed.push([url, name]),
    },
    clearStorageData: async ({ origin }) => clearedOrigins.push(origin),
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
  assert.ok(clearedOrigins.includes("https://accounts.sap.com"));
  assert.ok(clearedOrigins.includes("https://sapit-forme-prod.authentication.eu11.hana.ondemand.com"));
  assert.deepEqual(calls.sort(), ["auth", "cache", "connections", "dns"]);
});
