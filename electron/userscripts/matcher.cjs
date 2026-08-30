function escapeRegex(value) {
  return String(value).replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
}

function wildcardRegex(pattern) {
  return new RegExp(`^${escapeRegex(pattern).replace(/\*/g, ".*")}$`, "i");
}

function matchPattern(pattern, url) {
  const value = String(pattern || "").trim();
  if (!value) return false;
  if (value === "<all_urls>") return ["http:", "https:"].includes(url.protocol);
  const match = /^(\*|https?|file):\/\/([^/]+)(\/.*)$/.exec(value);
  if (!match) return false;
  const schemeMatches = match[1] === "*"
    ? ["http:", "https:"].includes(url.protocol)
    : url.protocol === `${match[1]}:`;
  if (!schemeMatches) return false;
  const hostPattern = match[2];
  const actualHost = hostPattern.includes(":") ? url.host : url.hostname;
  const hostMatches = hostPattern === "*" ||
    (hostPattern.startsWith("*.")
      ? url.hostname === hostPattern.slice(2) || url.hostname.endsWith(`.${hostPattern.slice(2)}`)
      : actualHost === hostPattern);
  return hostMatches && wildcardRegex(match[3]).test(`${url.pathname}${url.search}${url.hash}`);
}

function includePattern(pattern, rawUrl) {
  try {
    if (String(pattern).startsWith("/") && String(pattern).lastIndexOf("/") > 0) {
      const last = String(pattern).lastIndexOf("/");
      return new RegExp(String(pattern).slice(1, last), String(pattern).slice(last + 1)).test(rawUrl);
    }
    return wildcardRegex(pattern).test(rawUrl);
  } catch {
    return false;
  }
}

function isSensitiveUserScriptUrl(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return { blocked: true, reason: "网址无效" }; }
  if (!["http:", "https:"].includes(url.protocol)) return { blocked: true, reason: "系统内部或本地协议" };
  const value = `${url.hostname}${url.pathname}${url.search}`.toLowerCase();
  const callback = /(?:oauth|saml|auth)[\w/-]*(?:callback|redirect)|\/oauth2?\/|\/saml2?\//.test(value);
  const payment = /(?:pay|payment|checkout|billing|wallet|bank)/.test(value);
  const password = /(?:password|passwd|credential|vault)/.test(value);
  const login = /(?:login|logon|sign[-_]?in|signin|authorize|authorization|accounts\.)/.test(value);
  if (callback) return { blocked: true, reason: "授权回调页面", sensitiveType: "oauth" };
  if (payment) return { blocked: true, reason: "支付或结算页面", sensitiveType: "payment" };
  if (password) return { blocked: true, reason: "密码或凭据页面", sensitiveType: "password" };
  if (login) return { blocked: true, reason: "登录页面", sensitiveType: "login" };
  return { blocked: false, reason: "" };
}

function userScriptMatches(script, rawUrl, context = {}) {
  let url;
  try { url = new URL(rawUrl); } catch { return { matched: false, reason: "网址无效" }; }
  const sensitive = isSensitiveUserScriptUrl(rawUrl);
  const loginApproved = sensitive.sensitiveType === "login" && context.sensitiveSiteApproved === true;
  if (sensitive.blocked && !loginApproved) return { matched: false, reason: sensitive.reason, sensitive: true, sensitiveType: sensitive.sensitiveType };
  if (script.workspaceIds?.length && !script.workspaceIds.includes(context.workspaceId)) return { matched: false, reason: "工作空间不匹配" };
  if (script.browserProfileIds?.length && !script.browserProfileIds.includes(context.browserProfileId)) return { matched: false, reason: "浏览身份不匹配" };
  const excluded = (script.excludes || []).some((pattern) =>
    pattern.includes("://") ? matchPattern(pattern, url) : includePattern(pattern, rawUrl));
  if (excluded) return { matched: false, reason: "命中 @exclude" };
  const matchRules = script.matches || [];
  const includeRules = script.includes || [];
  const matched = matchRules.some((pattern) => matchPattern(pattern, url)) ||
    includeRules.some((pattern) => includePattern(pattern, rawUrl));
  return { matched, reason: matched ? "规则匹配" : "未命中 @match/@include", sensitive: sensitive.blocked, sensitiveType: sensitive.sensitiveType };
}

function connectPatternMatches(pattern, hostname) {
  const value = String(pattern || "").trim().toLowerCase();
  const host = String(hostname || "").toLowerCase();
  if (!value || value === "*") return false;
  if (value.startsWith("*.")) return host === value.slice(2) || host.endsWith(`.${value.slice(2)}`);
  return host === value;
}

module.exports = {
  connectPatternMatches,
  includePattern,
  isSensitiveUserScriptUrl,
  matchPattern,
  userScriptMatches,
  wildcardRegex,
};
