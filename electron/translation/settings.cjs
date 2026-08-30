const VALID_MODES = new Set(["bilingual", "translated"]);
const VALID_RULE_MODES = new Set(["manual", "always", "never"]);
const SENSITIVE_HOST_PATTERNS = [
  /(^|\.)desk\.zoho\./i,
  /(^|\.)support\.sap\.com$/i,
  /(^|\.)accounts\.sap\.com$/i,
  /(^|\.)mail\./i,
  /(^|\.)outlook\./i,
  /(^|\.)bank/i,
];

function normalizeHostnamePattern(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")
    .slice(0, 253);
}

function sanitizePublicBaseUrl(value) {
  try {
    const parsed = new URL(String(value || "https://api.openai.com/v1"));
    parsed.username = "";
    parsed.password = "";
    parsed.search = "";
    parsed.hash = "";
    return parsed.toString().replace(/\/$/, "").slice(0, 500);
  } catch {
    return "https://api.openai.com/v1";
  }
}

function normalizeTranslationSettings(value = {}) {
  const input = /** @type {any} */ (value && typeof value === "object" && !Array.isArray(value) ? value : {});
  const publicConfig = input.publicConfig && typeof input.publicConfig === "object"
    ? input.publicConfig
    : {};
  const seen = new Set();
  const siteRules = (Array.isArray(input.siteRules) ? input.siteRules : [])
    .map((rule) => {
      const hostnamePattern = normalizeHostnamePattern(rule?.hostnamePattern);
      if (!hostnamePattern || seen.has(hostnamePattern)) return null;
      seen.add(hostnamePattern);
      return {
        hostnamePattern,
        mode: VALID_RULE_MODES.has(rule?.mode) ? rule.mode : "manual",
        privacyAllowed: rule?.privacyAllowed === true,
      };
    })
    .filter(Boolean)
    .slice(0, 200);
  return {
    providerId: "openai-compatible",
    publicConfig: {
      baseUrl: sanitizePublicBaseUrl(publicConfig.baseUrl),
      model: String(publicConfig.model || "gpt-4o-mini").trim().slice(0, 200),
    },
    sourceLanguage: String(input.sourceLanguage || "auto").trim().slice(0, 30) || "auto",
    targetLanguage: String(input.targetLanguage || "zh-CN").trim().slice(0, 30) || "zh-CN",
    defaultMode: VALID_MODES.has(input.defaultMode) ? input.defaultMode : "bilingual",
    selectionButtonEnabled: input.selectionButtonEnabled !== false,
    siteRules,
  };
}

function hostnameMatches(pattern, hostname) {
  const rule = normalizeHostnamePattern(pattern);
  const host = String(hostname || "").toLowerCase();
  if (!rule || !host) return false;
  if (rule.startsWith("*.")) {
    const suffix = rule.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }
  return host === rule;
}

function siteRuleForUrl(settings, rawUrl) {
  let hostname = "";
  try {
    hostname = new URL(String(rawUrl || "")).hostname;
  } catch {
    return null;
  }
  return normalizeTranslationSettings(settings).siteRules.find((rule) =>
    hostnameMatches(rule.hostnamePattern, hostname),
  ) || null;
}

function isSensitiveTranslationUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    const host = parsed.hostname;
    const path = parsed.pathname.toLowerCase();
    if (SENSITIVE_HOST_PATTERNS.some((pattern) => pattern.test(host))) return true;
    return /(?:^|\/)(?:login|signin|sign-in|sso|oauth|auth)(?:\/|$)/i.test(path) ||
      /(?:customer|b1|internal|intranet|erp)/i.test(host);
  } catch {
    return false;
  }
}

module.exports = {
  VALID_MODES,
  hostnameMatches,
  isSensitiveTranslationUrl,
  normalizeTranslationSettings,
  sanitizePublicBaseUrl,
  siteRuleForUrl,
};
