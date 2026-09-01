const NEVER_SEND_PATTERN = /(?:^|\.)(?:accounts\.|login\.|auth\.|oauth\.|sso\.)|\/(?:login|signin|oauth|authorize|saml|payment|checkout|password)(?:\/|$)/i;
const SENSITIVE_HOST_PATTERN = /(?:^|\.)(?:desk\.zoho\.|support\.sap\.|me\.sap\.|mail\.|outlook\.|customer-ops\.|b1\.|internal\.|intranet\.)/i;

function sanitizedPageUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ""));
    if (!/^https?:$/.test(url.protocol)) return "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch { return ""; }
}

function classifyPageForAI(rawUrl) {
  const safeUrl = sanitizedPageUrl(rawUrl);
  if (!safeUrl) return { allowed: false, sensitive: false, reason: "unsupported-url", hostname: "", safeUrl: "" };
  const parsed = new URL(safeUrl);
  const source = `${parsed.hostname}${parsed.pathname}`;
  if (NEVER_SEND_PATTERN.test(source)) return { allowed: false, sensitive: true, reason: "authentication-page", hostname: parsed.hostname, safeUrl };
  return { allowed: true, sensitive: SENSITIVE_HOST_PATTERN.test(parsed.hostname), reason: null, hostname: parsed.hostname, safeUrl };
}

module.exports = { NEVER_SEND_PATTERN, SENSITIVE_HOST_PATTERN, classifyPageForAI, sanitizedPageUrl };
