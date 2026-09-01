const STANDARD_ZOHO_DESK_HOST = /^(?:desk\.zoho\.(?:com|eu|in|com\.au|jp|com\.cn|sa|uk)|desk\.zohocloud\.ca)$/i;
const STANDARD_ZOHO_ACCOUNTS_HOST = /^(?:accounts\.zoho\.(?:com|eu|in|com\.au|jp|com\.cn|sa|uk)|accounts\.zohocloud\.ca)$/i;

function parseWebUrl(rawUrl, { httpsOnly = false, rejectCredentials = false } = {}) {
  try {
    const parsed = new URL(String(rawUrl || "").trim());
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    if (httpsOnly && parsed.protocol !== "https:") return null;
    if (rejectCredentials && (parsed.username || parsed.password)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function decodeReturnTarget(rawValue) {
  let candidate = String(rawValue || "").trim();
  if (!candidate || candidate.length > 8192) return null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parsed = parseWebUrl(candidate, { httpsOnly: true, rejectCredentials: true });
    if (parsed) return parsed;
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) return null;
      candidate = decoded;
    } catch {
      return null;
    }
  }
  return null;
}

function isZohoDeskUrl(rawUrl) {
  const parsed = parseWebUrl(rawUrl, { httpsOnly: true, rejectCredentials: true });
  return Boolean(parsed && STANDARD_ZOHO_DESK_HOST.test(parsed.hostname));
}

function zohoDeskAuthReturnUrl(rawUrl) {
  const authenticationUrl = parseWebUrl(rawUrl, {
    httpsOnly: true,
    rejectCredentials: true,
  });
  if (
    !authenticationUrl ||
    !STANDARD_ZOHO_ACCOUNTS_HOST.test(authenticationUrl.hostname)
  ) {
    return null;
  }
  const target = decodeReturnTarget(authenticationUrl.searchParams.get("serviceurl"));
  if (!target || !STANDARD_ZOHO_DESK_HOST.test(target.hostname)) return null;
  return target.toString();
}

function durableBrowserUrl(rawUrl) {
  return zohoDeskAuthReturnUrl(rawUrl) || (parseWebUrl(rawUrl)?.toString() || null);
}

module.exports = {
  STANDARD_ZOHO_ACCOUNTS_HOST,
  STANDARD_ZOHO_DESK_HOST,
  durableBrowserUrl,
  isZohoDeskUrl,
  zohoDeskAuthReturnUrl,
};
