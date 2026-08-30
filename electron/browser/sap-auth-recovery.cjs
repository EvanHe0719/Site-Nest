const SAP_LOGIN_REJECTION = /potentially malicious character/i;
const DEFAULT_SAP_RETRY_URL = "https://me.sap.com/home";

function normalizeDomain(rawDomain) {
  return String(rawDomain || "").trim().replace(/^\./, "").toLowerCase();
}

function isSapSessionHost(rawHost) {
  const host = normalizeDomain(rawHost);
  return (
    host === "support.sap.com" ||
    host === "me.sap.com" ||
    host === "accounts.sap.com" ||
    (host.endsWith(".hana.ondemand.com") &&
      /(?:^|\.)authentication\.[a-z]{2}\d+\.hana\.ondemand\.com$/.test(host))
  );
}

function isSapCookieDomain(rawDomain) {
  const host = normalizeDomain(rawDomain);
  return (
    host === "sap.com" ||
    host.endsWith(".sap.com") ||
    host === "hana.ondemand.com" ||
    host.endsWith(".hana.ondemand.com")
  );
}

function isSapSessionUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    return parsed.protocol === "https:" && isSapSessionHost(parsed.hostname);
  } catch {
    return false;
  }
}

function isSapSearchTarget(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    return (
      parsed.protocol === "https:" &&
      parsed.hostname === "me.sap.com" &&
      (parsed.pathname.startsWith("/notes/") ||
        parsed.pathname.startsWith("/servicessupport/search/"))
    );
  } catch {
    return false;
  }
}

function sapRetryUrl(...candidates) {
  for (const candidate of candidates) {
    const rawUrl = String(candidate || "").trim();
    if (isSapSearchTarget(rawUrl)) return rawUrl;
  }
  return DEFAULT_SAP_RETRY_URL;
}

function hasSapLoginRejection(...content) {
  return SAP_LOGIN_REJECTION.test(content.map((value) => String(value || "")).join("\n"));
}

function sapStorageOrigins({ currentUrl = "", visitedOrigins = [] } = {}) {
  const origins = new Set([
    "https://support.sap.com",
    "https://me.sap.com",
    "https://accounts.sap.com",
  ]);
  for (const candidate of [currentUrl, ...visitedOrigins]) {
    try {
      const parsed = new URL(String(candidate || ""));
      if (parsed.protocol === "https:" && isSapSessionHost(parsed.hostname)) {
        origins.add(parsed.origin);
      }
    } catch {
      // Invalid and non-SAP origins are intentionally ignored.
    }
  }
  return Array.from(origins);
}

async function clearSapAuthenticationState(targetSession, options = {}) {
  if (!targetSession?.cookies?.get || !targetSession?.cookies?.remove) {
    throw new Error("SAP 登录会话不可用");
  }
  const clearEntirePartition = options.clearEntirePartition === true;
  await targetSession.closeAllConnections();
  const cookies = await targetSession.cookies.get({});
  const sapCookies = clearEntirePartition
    ? cookies
    : cookies.filter((cookie) => isSapCookieDomain(cookie.domain));
  await Promise.all(
    sapCookies.map((cookie) => {
      const cookieHost = normalizeDomain(cookie.domain);
      const cookiePath = cookie.path || "/";
      const protocol = cookie.secure ? "https" : "http";
      return targetSession.cookies.remove(
        `${protocol}://${cookieHost}${cookiePath}`,
        cookie.name,
      );
    }),
  );

  const origins = sapStorageOrigins(options);
  if (clearEntirePartition) {
    await targetSession.clearStorageData({
      storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
    });
  } else {
    await Promise.all(
      origins.map((origin) =>
        targetSession.clearStorageData({
          origin,
          storages: ["localstorage", "indexdb", "serviceworkers", "cachestorage"],
        }),
      ),
    );
  }
  await Promise.all([
    targetSession.clearCache(),
    targetSession.clearAuthCache(),
  ]);
  await targetSession.closeAllConnections();
  await targetSession.clearHostResolverCache();
  const remainingCookies = await targetSession.cookies.get({});
  return {
    removedCookieCount: sapCookies.length,
    clearedOrigins: clearEntirePartition ? ["*"] : origins,
    remainingCookieCount: clearEntirePartition
      ? remainingCookies.length
      : remainingCookies.filter((cookie) => isSapCookieDomain(cookie.domain)).length,
  };
}

module.exports = {
  DEFAULT_SAP_RETRY_URL,
  clearSapAuthenticationState,
  hasSapLoginRejection,
  isSapCookieDomain,
  isSapSearchTarget,
  isSapSessionHost,
  isSapSessionUrl,
  sapRetryUrl,
  sapStorageOrigins,
};
