const DEFAULT_SEARCH_URL = "https://www.google.com/search?q={query}";

const BLOCKED_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "about:",
  "chrome:",
  "devtools:",
]);

function containsUnsafeControlCharacters(value) {
  return /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(value);
}

function looksLikeHostOrUrl(value) {
  if (/^https?:\/\//i.test(value)) return true;
  if (/^(localhost|\[[0-9a-f:]+\]|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:[/?#]|$)/i.test(value)) {
    return true;
  }
  return /^[^\s./]+(?:\.[^\s./]+)+(?::\d+)?(?:[/?#]|$)/u.test(value);
}

function buildSearchUrl(query, template = DEFAULT_SEARCH_URL) {
  const normalizedTemplate = String(template || DEFAULT_SEARCH_URL);
  const encoded = encodeURIComponent(query);
  const candidate = normalizedTemplate.includes("{query}")
    ? normalizedTemplate.replaceAll("{query}", encoded)
    : `${normalizedTemplate}${normalizedTemplate.includes("?") ? "&" : "?"}q=${encoded}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error("默认搜索引擎必须使用 HTTP 或 HTTPS");
  }
  return parsed.toString();
}

function resolveNavigationTarget(rawValue, options = {}) {
  const value = String(rawValue || "").trim();
  if (!value) throw new Error("请输入网址或搜索内容");
  if (containsUnsafeControlCharacters(value)) {
    throw new Error("输入包含不安全控制字符");
  }

  const schemeMatch = value.match(/^([a-z][a-z\d+.-]*:)/i);
  const scheme = schemeMatch?.[1]?.toLowerCase() || "";
  if (BLOCKED_SCHEMES.has(scheme)) {
    throw new Error("不允许从地址栏执行脚本或本地协议");
  }
  if (scheme && !['http:', 'https:'].includes(scheme)) {
    throw new Error("地址栏仅支持 HTTP、HTTPS 或普通搜索文字");
  }

  if (looksLikeHostOrUrl(value)) {
    const parsed = new URL(scheme ? value : `https://${value}`);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error("仅支持 HTTP 或 HTTPS 网站");
    }
    return { kind: "url", url: parsed.toString(), input: value };
  }

  return {
    kind: "search",
    url: buildSearchUrl(value, options.searchUrlTemplate),
    input: value,
  };
}

function securityStateForUrl(rawUrl) {
  try {
    const protocol = new URL(String(rawUrl || "")).protocol;
    if (protocol === "https:") return "secure";
    if (protocol === "http:") return "insecure";
  } catch {
    // Unknown is the safe fallback for malformed or empty URLs.
  }
  return "unknown";
}

module.exports = {
  BLOCKED_SCHEMES,
  DEFAULT_SEARCH_URL,
  buildSearchUrl,
  resolveNavigationTarget,
  securityStateForUrl,
};
