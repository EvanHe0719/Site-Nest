const CONNECTOR_ERROR_CODES = Object.freeze([
  "CONNECTOR_NOT_CONFIGURED",
  "AUTH_REQUIRED",
  "AUTH_EXPIRED",
  "PERMISSION_DENIED",
  "NETWORK_ERROR",
  "REQUEST_TIMEOUT",
  "RATE_LIMITED",
  "API_ERROR",
  "INVALID_RESPONSE",
  "DATA_UNAVAILABLE",
  "CONNECTOR_DISABLED",
]);

const ALLOWED_ERROR_CODES = new Set(CONNECTOR_ERROR_CODES);

function redactConnectorText(value, maxLength = 500) {
  return String(value || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\b(Bearer|Basic|Zoho-oauthtoken)\s+[^\s,;]+/gi, "$1 [REDACTED]")
    .replace(
      /\b(authorization|cookie|access[-_]?token|refresh[-_]?token|client[-_]?secret|api[-_]?key|password|passwd|secret)\b\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .slice(0, maxLength);
}

class ConnectorError extends Error {
  constructor(code, message, options = {}) {
    super(redactConnectorText(message || "连接器操作失败"), options.cause ? { cause: options.cause } : undefined);
    this.name = "ConnectorError";
    this.code = ALLOWED_ERROR_CODES.has(code) ? code : "API_ERROR";
    this.retryable = options.retryable === true;
    this.status = Number.isFinite(Number(options.status)) ? Number(options.status) : null;
    this.retryAfterMs = Number.isFinite(Number(options.retryAfterMs))
      ? Math.max(0, Number(options.retryAfterMs))
      : null;
  }
}

function normalizeConnectorError(error) {
  if (error instanceof ConnectorError) return error;
  if (error?.name === "AbortError" || error?.code === "ABORT_ERR") {
    return new ConnectorError("REQUEST_TIMEOUT", "请求已取消或超时", {
      cause: error,
      retryable: true,
    });
  }
  const message = redactConnectorText(error?.message || error || "连接器操作失败");
  if (/timeout|timed out|ETIMEDOUT/i.test(message)) {
    return new ConnectorError("REQUEST_TIMEOUT", "连接器请求超时，请稍后重试", {
      cause: error,
      retryable: true,
    });
  }
  if (/fetch failed|network|ECONN|ENOTFOUND|socket/i.test(message)) {
    return new ConnectorError("NETWORK_ERROR", "无法连接外部服务，请检查网络", {
      cause: error,
      retryable: true,
    });
  }
  return new ConnectorError("API_ERROR", message, { cause: error });
}

function publicConnectorError(error) {
  const normalized = normalizeConnectorError(error);
  return {
    code: normalized.code,
    message: normalized.message,
    retryable: normalized.retryable,
    retryAfterMs: normalized.retryAfterMs,
  };
}

module.exports = {
  CONNECTOR_ERROR_CODES,
  ConnectorError,
  normalizeConnectorError,
  publicConnectorError,
  redactConnectorText,
};
