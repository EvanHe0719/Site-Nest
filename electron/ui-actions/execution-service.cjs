const { randomUUID } = require("node:crypto");
const { assertActionId } = require("./registry.cjs");

const SENSITIVE_KEYS = new Set([
  "authorization",
  "cookie",
  "set_cookie",
  "credential",
  "credentials",
  "api_key",
  "private_key",
  "encryption_key",
  "password",
  "passphrase",
  "secret",
  "token",
]);

function normalizeFieldName(value) {
  return String(value || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function isSensitiveKey(value) {
  const normalized = normalizeFieldName(value);
  return (
    SENSITIVE_KEYS.has(normalized) ||
    normalized.endsWith("_token") ||
    normalized.endsWith("_secret") ||
    normalized.endsWith("_password") ||
    normalized.endsWith("_cookie")
  );
}

class UIActionExecutionError extends Error {
  constructor(message, code = "UI_ACTION_EXECUTION_FAILED", options = {}) {
    super(message);
    this.name = "UIActionExecutionError";
    this.code = code;
    this.retryable = options.retryable === true;
    this.details = options.details;
  }
}

function safeText(value, fallback = "", maxLength = 500) {
  return String(value || fallback)
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "")
    .replace(/\b(Bearer|Basic)\s+[A-Za-z0-9._~+\-/=]+/gi, "$1 [REDACTED]")
    .replace(
      /([?&](?:access_token|refresh_token|id_token|api_key|key|secret|password)=)[^&#\s]+/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b(token|secret|password|authorization|cookie|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .trim()
    .slice(0, maxLength);
}

function safeErrorCode(value, fallback = "UI_ACTION_EXECUTION_FAILED") {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9_.:-]{1,120}$/.test(normalized)
    ? normalized
    : fallback;
}

function cloneTransportValue(value, depth = 0, seen = new WeakSet()) {
  if (value === null || value === undefined) return value;
  if (typeof value === "string") return safeText(value, "", 10_000);
  if (typeof value === "number" || typeof value === "boolean") return value;
  if (typeof value === "bigint") return String(value);
  if (typeof value !== "object" || depth >= 8) return undefined;
  if (seen.has(value)) return "[Circular]";
  seen.add(value);
  if (Array.isArray(value)) {
    return value.slice(0, 500).map((item) => cloneTransportValue(item, depth + 1, seen));
  }
  const output = {};
  for (const [key, child] of Object.entries(value).slice(0, 500)) {
    if (["stack", "cause"].includes(key)) continue;
    if (isSensitiveKey(key)) {
      output[key] = "[REDACTED]";
      continue;
    }
    const cloned = cloneTransportValue(child, depth + 1, seen);
    if (cloned !== undefined) output[key] = cloned;
  }
  return output;
}

function dateParts(now) {
  const value = now();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("UIActionExecutionService now() must return a valid date");
  }
  return { iso: date.toISOString(), epoch: date.getTime() };
}

function normalizeRequest(request, context) {
  if (typeof request === "string") {
    return { actionId: assertActionId(request), input: undefined, context: context || {} };
  }
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new UIActionExecutionError(
      "UI action request must be an action id or request object",
      "UI_ACTION_REQUEST_INVALID",
    );
  }
  return {
    actionId: assertActionId(request.actionId),
    input: request.input === undefined ? request.payload : request.input,
    // Context is a main-process trust boundary. A renderer request must not replace it.
    context: context || {},
  };
}

function normalizeErrorActionStatus(value, fallback = "ready") {
  return ["ready", "requiresConfiguration", "unavailable", "preview"].includes(value)
    ? value
    : fallback;
}

function defaultUnavailableMessage(status, reason) {
  if (reason) return reason;
  if (status === "requiresConfiguration") return "This action requires configuration";
  if (status === "preview") return "This action is a preview";
  if (status === "loading") return "This action is already running";
  return "This action is currently unavailable";
}

class UIActionExecutionService {
  constructor({
    registry,
    now = () => new Date(),
    createId = () => randomUUID(),
    onTransition = null,
    onResult = null,
  } = {}) {
    if (!registry?.get || !registry?.resolve || !registry?.snapshot) {
      throw new TypeError("UIActionExecutionService requires a UIActionRegistry");
    }
    if (typeof now !== "function" || typeof createId !== "function") {
      throw new TypeError("UIActionExecutionService now/createId must be functions");
    }
    if (onTransition !== null && typeof onTransition !== "function") {
      throw new TypeError("UIActionExecutionService onTransition must be a function");
    }
    if (onResult !== null && typeof onResult !== "function") {
      throw new TypeError("UIActionExecutionService onResult must be a function");
    }
    this.registry = registry;
    this.now = now;
    this.createId = createId;
    this.onTransition = onTransition;
    this.onResult = onResult;
    this.inFlight = new Map();
  }

  isExecuting(actionId, context = {}, input = undefined) {
    const definition = this.registry.get(actionId);
    if (!definition) return false;
    try {
      const concurrencyKey = this._concurrencyKey(definition, {
        actionId: definition.id,
        input,
        context,
      });
      return this.inFlight.has(concurrencyKey);
    } catch {
      return false;
    }
  }

  get pendingCount() {
    return this.inFlight.size;
  }

  async getActionState(actionId, context = {}, input = undefined) {
    const resolved = await this.registry.resolve(actionId, context);
    if (!resolved) return null;
    const definition = this.registry.get(resolved.id);
    let active = null;
    try {
      const concurrencyKey = this._concurrencyKey(definition, {
        actionId: resolved.id,
        input,
        context,
      });
      active = this.inFlight.get(concurrencyKey) || null;
    } catch {
      active = null;
    }
    if (!active) return resolved;
    return {
      ...resolved,
      status: "loading",
      canExecute: false,
      unavailableReason: "",
      requiresConfiguration: false,
      activeRequestId: active.requestId,
      startedAt: active.startedAt,
    };
  }

  async snapshot(context = {}, options = {}) {
    const inputsByActionId = options.inputsByActionId || {};
    const states = await this.registry.snapshot(context);
    return states.map((state) => {
      const definition = this.registry.get(state.id);
      let active = null;
      try {
        const concurrencyKey = this._concurrencyKey(definition, {
          actionId: state.id,
          input: inputsByActionId[state.id],
          context,
        });
        active = this.inFlight.get(concurrencyKey) || null;
      } catch {
        active = null;
      }
      return active
        ? {
            ...state,
            status: "loading",
            canExecute: false,
            unavailableReason: "",
            requiresConfiguration: false,
            activeRequestId: active.requestId,
            startedAt: active.startedAt,
          }
        : state;
    });
  }

  async execute(request, context = {}) {
    let normalized;
    try {
      normalized = normalizeRequest(request, context);
    } catch (error) {
      return this._standaloneFailure(error);
    }
    const { actionId } = normalized;
    const definition = this.registry.get(actionId);
    if (!definition) {
      return this._standaloneFailure(
        new UIActionExecutionError(
          `UI action is not registered: ${actionId}`,
          "UI_ACTION_NOT_FOUND",
        ),
        actionId,
      );
    }

    let concurrencyKey;
    try {
      concurrencyKey = this._concurrencyKey(definition, normalized);
    } catch (error) {
      return this._standaloneFailure(error, actionId);
    }
    const active = this.inFlight.get(concurrencyKey);
    if (active) {
      const timestamp = dateParts(this.now).iso;
      return {
        ok: false,
        status: "loading",
        actionStatus: "loading",
        actionId,
        requestId: null,
        activeRequestId: active.requestId,
        startedAt: active.startedAt,
        finishedAt: timestamp,
        durationMs: 0,
        errorCode: "UI_ACTION_ALREADY_RUNNING",
        message: "This action is already running",
        retryable: true,
      };
    }

    const requestId = safeText(this.createId(), "", 200);
    if (!requestId) {
      return this._standaloneFailure(
        new UIActionExecutionError(
          "UI action request id could not be created",
          "UI_ACTION_REQUEST_ID_INVALID",
        ),
        actionId,
      );
    }
    const started = dateParts(this.now);
    this.inFlight.set(concurrencyKey, {
      actionId,
      requestId,
      startedAt: started.iso,
    });
    await this._emitTransition({
      actionId,
      requestId,
      status: "loading",
      startedAt: started.iso,
    });

    let result;
    let handlerStarted = false;
    try {
      const availability = await this.registry.resolve(actionId, normalized.context, {
        throwOnError: true,
      });
      if (!availability || availability.status !== "ready") {
        const status = availability?.status || "unavailable";
        result = this._completeResult({
          ok: false,
          status,
          actionStatus: status,
          actionId,
          requestId,
          started,
          errorCode:
            status === "requiresConfiguration"
              ? "UI_ACTION_REQUIRES_CONFIGURATION"
              : status === "preview"
                ? "UI_ACTION_PREVIEW_ONLY"
                : "UI_ACTION_UNAVAILABLE",
          message: defaultUnavailableMessage(
            status,
            availability?.unavailableReason,
          ),
          retryable: status === "loading",
        });
      } else {
        handlerStarted = true;
        const rawResult = await definition.execute({
          actionId,
          requestId,
          input: normalized.input,
          context: normalized.context,
        });
        result = await this._resultFromHandler({
          rawResult,
          definition,
          normalized,
          requestId,
          started,
        });
      }
    } catch (error) {
      result = this._completeResult({
        ok: false,
        status: "failure",
        actionStatus: "ready",
        actionId,
        requestId,
        started,
        ...(await this._mapError(
          definition,
          error,
          normalized,
          null,
          handlerStarted ? "ready" : "unavailable",
        )),
      });
    } finally {
      this.inFlight.delete(concurrencyKey);
    }

    await this._emitTransition({
      actionId,
      requestId,
      status: result.actionStatus,
      result,
    });
    await this._emitResult(result);
    return result;
  }

  _concurrencyKey(definition, normalized) {
    if (!definition) {
      throw new UIActionExecutionError(
        "Cannot resolve concurrency for an unknown action",
        "UI_ACTION_NOT_FOUND",
      );
    }
    let scope;
    if (typeof definition.concurrencyKey === "function") {
      scope = definition.concurrencyKey({
        actionId: definition.id,
        input: normalized.input,
        context: normalized.context,
      });
      if (scope && typeof scope.then === "function") {
        throw new UIActionExecutionError(
          "UI action concurrencyKey must be synchronous",
          "UI_ACTION_CONCURRENCY_KEY_INVALID",
        );
      }
    } else if (typeof definition.concurrencyKey === "string") {
      scope = definition.concurrencyKey;
    } else {
      const context = normalized.context;
      scope =
        context?.concurrencyScopeId ??
        context?.workspaceId ??
        context?.windowId ??
        context?.sessionId ??
        context?.targetId ??
        "global";
    }
    const normalizedScope = String(scope || "").trim();
    if (!normalizedScope || normalizedScope.length > 300) {
      throw new UIActionExecutionError(
        "UI action concurrency scope is invalid",
        "UI_ACTION_CONCURRENCY_KEY_INVALID",
      );
    }
    return `${definition.id}::${normalizedScope}`;
  }

  async _resultFromHandler({ rawResult, definition, normalized, requestId, started }) {
    if (!rawResult || typeof rawResult !== "object" || Array.isArray(rawResult)) {
      throw new UIActionExecutionError(
        "The action handler did not return an explicit execution result",
        "UI_ACTION_INVALID_RESULT",
      );
    }
    if (rawResult.ok !== true) {
      const failure = new UIActionExecutionError(
        safeText(rawResult.message, "The action reported a failure"),
        safeErrorCode(rawResult.errorCode ?? rawResult.code),
        {
          retryable: rawResult.retryable === true,
          details: rawResult.details,
        },
      );
      const mapped = await this._mapError(
        definition,
        failure,
        normalized,
        rawResult,
        "ready",
      );
      return this._completeResult({
        ok: false,
        status: "failure",
        actionStatus: "ready",
        actionId: definition.id,
        requestId,
        started,
        ...mapped,
      });
    }

    let verificationResult = null;
    if (typeof definition.verifySuccess === "function") {
      verificationResult = await definition.verifySuccess(rawResult, {
        actionId: definition.id,
        input: normalized.input,
        context: normalized.context,
        requestId,
      });
      if (
        !verificationResult ||
        typeof verificationResult !== "object" ||
        Array.isArray(verificationResult) ||
        verificationResult.ok !== true
      ) {
        throw new UIActionExecutionError(
          safeText(
            verificationResult?.message,
            "The action result could not be verified by reading it back",
          ),
          safeErrorCode(
            verificationResult?.errorCode ?? verificationResult?.code,
            "UI_ACTION_VERIFICATION_FAILED",
          ),
          {
            retryable: verificationResult?.retryable === true,
            details: verificationResult?.details,
          },
        );
      }
    }

    let successPayload = rawResult;
    if (typeof definition.successResult === "function") {
      successPayload = await definition.successResult(rawResult, {
        actionId: definition.id,
        input: normalized.input,
        context: normalized.context,
        requestId,
        verificationResult,
      });
    } else if (definition.successResult) {
      successPayload = { ...rawResult, ...definition.successResult };
    }
    if (!successPayload || typeof successPayload !== "object" || Array.isArray(successPayload)) {
      throw new UIActionExecutionError(
        "successResult must produce an object",
        "UI_ACTION_SUCCESS_RESULT_INVALID",
      );
    }
    const resultPayload = definition.resultFields
      ? Object.fromEntries(
          definition.resultFields
            .filter((field) => Object.prototype.hasOwnProperty.call(successPayload, field))
            .map((field) => [field, successPayload[field]]),
        )
      : successPayload;
    const transportResult = cloneTransportValue(resultPayload);
    delete transportResult.ok;
    delete transportResult.status;
    const message = safeText(
      successPayload.message,
      `${definition.label} completed successfully`,
    );
    delete transportResult.message;
    return this._completeResult({
      ok: true,
      status: "success",
      actionStatus: "ready",
      actionId: definition.id,
      requestId,
      started,
      message,
      verified: Boolean(verificationResult),
      result: transportResult,
    });
  }

  async _mapError(
    definition,
    error,
    normalized,
    reportedResult = null,
    fallbackActionStatus = "ready",
  ) {
    const fallback = {
      errorCode: safeErrorCode(error?.code),
      message: safeText(error?.message, "The UI action failed"),
      retryable: error?.retryable === true,
      details: cloneTransportValue(error?.details ?? reportedResult?.details),
      actionStatus: normalizeErrorActionStatus(
        error?.actionStatus,
        fallbackActionStatus,
      ),
    };
    const mapping = definition?.errorMapping;
    if (!mapping) return fallback;
    let mapped;
    try {
      if (typeof mapping === "function") {
        mapped = await mapping(error, {
          actionId: definition.id,
          input: normalized.input,
          context: normalized.context,
          reportedResult,
        });
      } else {
        mapped =
          mapping[error?.code] ??
          mapping[error?.name] ??
          mapping.default ??
          mapping["*"];
      }
    } catch {
      return fallback;
    }
    if (typeof mapped === "string") return { ...fallback, message: safeText(mapped) };
    if (!mapped || typeof mapped !== "object" || Array.isArray(mapped)) return fallback;
    return {
      errorCode: safeErrorCode(mapped.errorCode ?? mapped.code, fallback.errorCode),
      message: safeText(mapped.message, fallback.message),
      retryable:
        mapped.retryable === undefined ? fallback.retryable : mapped.retryable === true,
      details: cloneTransportValue(mapped.details ?? fallback.details),
      actionStatus: normalizeErrorActionStatus(
        mapped.actionStatus,
        fallback.actionStatus,
      ),
    };
  }

  _completeResult({ started, ...fields }) {
    const finished = dateParts(this.now);
    const result = {
      ...fields,
      startedAt: started.iso,
      finishedAt: finished.iso,
      durationMs: Math.max(0, finished.epoch - started.epoch),
    };
    if (result.details === undefined) delete result.details;
    return result;
  }

  _standaloneFailure(error, actionId = null) {
    const timestamp = dateParts(this.now).iso;
    return {
      ok: false,
      status: "failure",
      actionStatus: "unavailable",
      actionId,
      requestId: null,
      startedAt: timestamp,
      finishedAt: timestamp,
      durationMs: 0,
      errorCode: safeErrorCode(error?.code, "UI_ACTION_REQUEST_INVALID"),
      message: safeText(error?.message, "Invalid UI action request"),
      retryable: false,
    };
  }

  async _emitTransition(event) {
    if (!this.onTransition) return;
    try {
      await this.onTransition(cloneTransportValue(event));
    } catch {
      // Observability hooks must never change the action outcome.
    }
  }

  async _emitResult(result) {
    if (!this.onResult) return;
    try {
      await this.onResult(cloneTransportValue(result));
    } catch {
      // Result observers are deliberately isolated from the real execution.
    }
  }
}

module.exports = {
  UIActionExecutionError,
  UIActionExecutionService,
  cloneTransportValue,
  normalizeRequest,
  safeErrorCode,
};
