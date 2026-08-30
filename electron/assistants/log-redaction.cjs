const DEFAULT_LOG_LIMIT = 200;
const MAX_LOG_TEXT_LENGTH = 300;

const SENSITIVE_KEY_PATTERN = /^(?:cookie|set[-_]?cookie|authorization|proxy[-_]?authorization|access[-_]?token|refresh[-_]?token|token|password|passwd|secret|client[-_]?secret|api[-_]?key|credential|credentials|session|session[-_]?id)$/i;

function redactUrls(text) {
  return text.replace(/https?:\/\/[^\s<>"']+/gi, (candidate) => {
    const trailingMatch = candidate.match(/[),.;!?]+$/);
    const trailing = trailingMatch ? trailingMatch[0] : "";
    const rawUrl = trailing ? candidate.slice(0, -trailing.length) : candidate;
    try {
      const parsed = new URL(rawUrl);
      return `[URL ${parsed.hostname.toLowerCase()}]${trailing}`;
    } catch {
      return `[URL 已隐藏]${trailing}`;
    }
  });
}

function sanitizeLogText(value, maxLength = MAX_LOG_TEXT_LENGTH) {
  let text = String(value ?? "");
  text = text
    .replace(
      /\b(Authorization|Proxy-Authorization|Cookie|Set-Cookie)\s*:\s*[^\r\n]+/gi,
      "$1: [REDACTED]",
    )
    .replace(/\b(Bearer|Basic|Zoho-oauthtoken)\s+[A-Za-z0-9._~+/=-]+/gi, "$1 [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g, "[REDACTED JWT]")
    .replace(
      /([?&](?:access_token|refresh_token|token|password|passwd|secret|client_secret|api_key|apikey|session)=)[^&#\s]*/gi,
      "$1[REDACTED]",
    );
  text = redactUrls(text).replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  return text.slice(0, Math.max(0, Number(maxLength) || MAX_LOG_TEXT_LENGTH));
}

function redactSensitiveValue(value, { depth = 0, maxDepth = 5 } = {}) {
  if (depth > maxDepth) return "[TRUNCATED]";
  if (typeof value === "string") return sanitizeLogText(value);
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) =>
      redactSensitiveValue(item, { depth: depth + 1, maxDepth }),
    );
  }
  if (!value || typeof value !== "object") return sanitizeLogText(value);
  const result = {};
  for (const [key, child] of Object.entries(value).slice(0, 50)) {
    result[key] = SENSITIVE_KEY_PATTERN.test(key)
      ? "[REDACTED]"
      : redactSensitiveValue(child, { depth: depth + 1, maxDepth });
  }
  return result;
}

function safeIdentifier(value, fallback = "") {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9_.:-]{1,100}$/.test(normalized) ? normalized : fallback;
}

function safeHostname(value) {
  const normalized = String(value || "").trim().toLowerCase().replace(/\.$/, "");
  return /^[a-z0-9.-]{1,253}$/.test(normalized) ? normalized : "unknown";
}

function sanitizeExecutionRecord(record) {
  const allowedStatuses = new Set(["success", "failure", "denied", "not-configured"]);
  return Object.freeze({
    id: safeIdentifier(record?.id, "log"),
    timestamp: String(record?.timestamp || new Date(0).toISOString()),
    assistantId: safeIdentifier(record?.assistantId, "unknown-assistant"),
    assistantName: sanitizeLogText(record?.assistantName || "未知助手", 100),
    actionId: safeIdentifier(record?.actionId, "unknown-action"),
    actionName: sanitizeLogText(record?.actionName || "未知动作", 100),
    site: Object.freeze({
      siteId: safeIdentifier(record?.site?.siteId, ""),
      hostname: safeHostname(record?.site?.hostname),
    }),
    status: allowedStatuses.has(record?.status) ? record.status : "failure",
    summary: sanitizeLogText(record?.summary || "", 200),
    errorCode: safeIdentifier(record?.errorCode, ""),
    errorMessage: sanitizeLogText(record?.errorMessage || "", 200),
  });
}

function appendLimitedExecutionLog(logs, record, limit = DEFAULT_LOG_LIMIT) {
  const safeLimit = Math.max(1, Math.min(1000, Number(limit) || DEFAULT_LOG_LIMIT));
  const current = Array.isArray(logs) ? logs : [];
  return [sanitizeExecutionRecord(record), ...current].slice(0, safeLimit);
}

module.exports = {
  DEFAULT_LOG_LIMIT,
  MAX_LOG_TEXT_LENGTH,
  SENSITIVE_KEY_PATTERN,
  appendLimitedExecutionLog,
  redactSensitiveValue,
  sanitizeExecutionRecord,
  sanitizeLogText,
};
