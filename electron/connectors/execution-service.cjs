const { randomUUID } = require("node:crypto");
const { normalizeConnectorError, publicConnectorError, redactConnectorText } = require("./errors.cjs");

function waitForRetry(delayMs, signal) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise((resolve) => {
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", onAbort);
      resolve(value);
    };
    const onAbort = () => finish(false);
    const timer = setTimeout(() => finish(true), Math.max(0, delayMs));
    signal?.addEventListener?.("abort", onAbort, { once: true });
  });
}

class ConnectorExecutionService {
  constructor(options = {}) {
    this.onExecution = typeof options.onExecution === "function" ? options.onExecution : async () => {};
    this.maxRetries = Number.isFinite(Number(options.maxRetries)) ? Number(options.maxRetries) : 1;
    this.baseRetryDelayMs = Math.max(0, Number(options.baseRetryDelayMs) || 500);
    this.maxRetryDelayMs = Math.max(
      this.baseRetryDelayMs,
      Number(options.maxRetryDelayMs) || 30000,
    );
    this.waitForRetry = options.waitForRetry || waitForRetry;
  }

  async execute(input, operation) {
    const execution = {
      id: randomUUID(),
      connectionId: String(input?.connectionId || ""),
      operation: String(input?.operation || "query"),
      startedAt: new Date().toISOString(),
      finishedAt: null,
      status: "running",
      summary: "正在执行",
      errorCode: null,
      sanitizedErrorMessage: null,
    };
    await this.onExecution({ ...execution });
    let attempt = 0;
    while (true) {
      try {
        const result = await operation({ attempt, signal: input?.signal });
        execution.finishedAt = new Date().toISOString();
        execution.status = "success";
        execution.summary = redactConnectorText(input?.successSummary || "查询完成");
        await this.onExecution({ ...execution });
        return result;
      } catch (rawError) {
        let error = normalizeConnectorError(rawError);
        if (error.retryable && attempt < this.maxRetries && !input?.signal?.aborted) {
          const retryDelayMs = Math.min(
            this.maxRetryDelayMs,
            error.retryAfterMs ?? this.baseRetryDelayMs * (2 ** attempt),
          );
          const shouldContinue = await this.waitForRetry(retryDelayMs, input?.signal);
          if (!shouldContinue) {
            error = normalizeConnectorError({ name: "AbortError" });
          } else {
            attempt += 1;
            continue;
          }
        }
        execution.finishedAt = new Date().toISOString();
        execution.status = input?.signal?.aborted ? "cancelled" : "failure";
        execution.summary = "连接器操作未完成";
        execution.errorCode = error.code;
        execution.sanitizedErrorMessage = error.message;
        await this.onExecution({ ...execution });
        const publicError = publicConnectorError(error);
        error.public = publicError;
        throw error;
      }
    }
  }
}

module.exports = { ConnectorExecutionService };
