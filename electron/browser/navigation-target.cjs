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

function defaultProtocolForHost(value) {
  const authority = String(value || "")
    .split(/[/?#]/, 1)[0];
  const bracketEnd = authority.startsWith("[") ? authority.indexOf("]") : -1;
  const host = (bracketEnd > 0
    ? authority.slice(1, bracketEnd)
    : authority.replace(/:\d+$/, ""))
    .toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return "http:";
  if (host === "::1" || /^f[cd][0-9a-f:]+$/i.test(host)) return "http:";
  const octets = host.split(".").map((part) => Number(part));
  if (
    octets.length === 4 &&
    octets.every((part) => Number.isInteger(part) && part >= 0 && part <= 255)
  ) {
    if (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168)
    ) {
      return "http:";
    }
  }
  return "https:";
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

  const bareHostWithPort = /^(?:localhost|\[[0-9a-f:]+\]|\d{1,3}(?:\.\d{1,3}){3}|[^\s/:]+(?:\.[^\s/:]+)+):\d+(?:[/?#]|$)/i.test(value);
  const schemeMatch = bareHostWithPort
    ? null
    : value.match(/^([a-z][a-z\d+.-]*:)/i);
  const scheme = schemeMatch?.[1]?.toLowerCase() || "";
  if (BLOCKED_SCHEMES.has(scheme)) {
    throw new Error("不允许从地址栏执行脚本或本地协议");
  }
  if (scheme && !['http:', 'https:'].includes(scheme)) {
    return {
      kind: "external",
      url: value,
      input: value,
      protocol: scheme,
    };
  }

  if (looksLikeHostOrUrl(value)) {
    const parsed = new URL(scheme ? value : `${defaultProtocolForHost(value)}//${value}`);
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
  defaultProtocolForHost,
  resolveNavigationTarget,
  securityStateForUrl,
};
