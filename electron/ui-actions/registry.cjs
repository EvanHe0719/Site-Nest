const ACTION_STATUSES = Object.freeze([
  "ready",
  "loading",
  "requiresConfiguration",
  "unavailable",
  "preview",
]);

const ACTION_STATUS_SET = new Set(ACTION_STATUSES);
const ACTION_ID_PATTERN = /^[a-z0-9]+(?:[._:-][a-z0-9]+)*$/;

class UIActionDefinitionError extends TypeError {
  constructor(message, code = "UI_ACTION_DEFINITION_INVALID") {
    super(message);
    this.name = "UIActionDefinitionError";
    this.code = code;
  }
}

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeReason(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 500);
}

function defaultStatusReason(status) {
  if (status === "requiresConfiguration") return "This action requires configuration";
  if (status === "preview") return "This action is a preview";
  if (status === "unavailable") return "This action is currently unavailable";
  return "";
}

function assertActionId(value) {
  const id = String(value || "").trim();
  if (id.length > 128 || !ACTION_ID_PATTERN.test(id)) {
    throw new UIActionDefinitionError(
      "UI action id must use lowercase alphanumeric segments separated by ., _, :, or -",
      "UI_ACTION_ID_INVALID",
    );
  }
  return id;
}

function assertStatus(value, label = "status") {
  if (!ACTION_STATUS_SET.has(value)) {
    throw new UIActionDefinitionError(
      `${label} must be one of: ${ACTION_STATUSES.join(", ")}`,
      "UI_ACTION_STATUS_INVALID",
    );
  }
  return value;
}

function normalizeDefinition(definition) {
  if (!isPlainObject(definition)) {
    throw new UIActionDefinitionError("UI action definition must be an object");
  }
  const id = assertActionId(definition.id);
  const label = String(definition.label || "").trim();
  if (!label) {
    throw new UIActionDefinitionError(
      `UI action ${id} must have a label`,
      "UI_ACTION_LABEL_REQUIRED",
    );
  }
  if (
    definition.canExecute !== undefined &&
    typeof definition.canExecute !== "boolean" &&
    typeof definition.canExecute !== "function"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} canExecute must be a boolean or function`,
      "UI_ACTION_CAN_EXECUTE_INVALID",
    );
  }
  if (
    definition.getStatus !== undefined &&
    typeof definition.getStatus !== "function"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} getStatus must be a function`,
      "UI_ACTION_GET_STATUS_INVALID",
    );
  }
  if (definition.execute !== undefined && typeof definition.execute !== "function") {
    throw new UIActionDefinitionError(
      `UI action ${id} execute must be a function`,
      "UI_ACTION_EXECUTE_INVALID",
    );
  }
  if (
    definition.verifySuccess !== undefined &&
    typeof definition.verifySuccess !== "function"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} verifySuccess must be a function`,
      "UI_ACTION_VERIFY_SUCCESS_INVALID",
    );
  }
  if (
    definition.verificationRequired !== undefined &&
    typeof definition.verificationRequired !== "boolean"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} verificationRequired must be a boolean`,
      "UI_ACTION_VERIFICATION_POLICY_INVALID",
    );
  }
  if (
    definition.verificationRequired === true &&
    typeof definition.verifySuccess !== "function"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} requires a verifySuccess read-back handler`,
      "UI_ACTION_VERIFY_SUCCESS_REQUIRED",
    );
  }
  let resultFields = null;
  if (definition.resultFields !== undefined) {
    if (
      !Array.isArray(definition.resultFields) ||
      definition.resultFields.some(
        (field) =>
          typeof field !== "string" ||
          !/^[A-Za-z_$][A-Za-z0-9_$-]{0,99}$/.test(field),
      ) ||
      new Set(definition.resultFields).size !== definition.resultFields.length
    ) {
      throw new UIActionDefinitionError(
        `UI action ${id} resultFields must be unique safe field names`,
        "UI_ACTION_RESULT_FIELDS_INVALID",
      );
    }
    resultFields = Object.freeze([...definition.resultFields]);
  }
  if (
    definition.concurrencyKey !== undefined &&
    typeof definition.concurrencyKey !== "string" &&
    typeof definition.concurrencyKey !== "function"
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} concurrencyKey must be a string or function`,
      "UI_ACTION_CONCURRENCY_KEY_INVALID",
    );
  }
  if (
    definition.successResult !== undefined &&
    typeof definition.successResult !== "function" &&
    !isPlainObject(definition.successResult)
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} successResult must be an object or function`,
      "UI_ACTION_SUCCESS_RESULT_INVALID",
    );
  }
  if (
    definition.errorMapping !== undefined &&
    typeof definition.errorMapping !== "function" &&
    !isPlainObject(definition.errorMapping)
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} errorMapping must be an object or function`,
      "UI_ACTION_ERROR_MAPPING_INVALID",
    );
  }

  let status = definition.status;
  if (status === undefined) {
    status = definition.requiresConfiguration === true
      ? "requiresConfiguration"
      : "ready";
  }
  status = assertStatus(status);
  if (definition.requiresConfiguration === true && status === "ready") {
    status = "requiresConfiguration";
  }
  if (
    (status === "ready" || typeof definition.getStatus === "function") &&
    typeof definition.execute !== "function"
  ) {
    throw new UIActionDefinitionError(
      `Ready or dynamically resolved UI action ${id} must have a real execute handler`,
      "UI_ACTION_HANDLER_REQUIRED",
    );
  }

  const unavailableReason = normalizeReason(
    definition.unavailableReason,
    status === "requiresConfiguration"
      ? "This action requires configuration"
      : status === "preview"
        ? "This action is a preview"
        : status === "unavailable"
          ? "This action is currently unavailable"
          : "",
  );
  if (
    (status === "requiresConfiguration" ||
      status === "unavailable" ||
      status === "preview") &&
    !unavailableReason
  ) {
    throw new UIActionDefinitionError(
      `UI action ${id} must explain why it is not ready`,
      "UI_ACTION_UNAVAILABLE_REASON_REQUIRED",
    );
  }

  const ipcChannel = definition.ipcChannel === undefined
    ? null
    : String(definition.ipcChannel || "").trim();
  if (ipcChannel !== null && !ipcChannel) {
    throw new UIActionDefinitionError(
      `UI action ${id} ipcChannel cannot be empty`,
      "UI_ACTION_IPC_CHANNEL_INVALID",
    );
  }
  const ipcMode = definition.ipcMode === undefined
    ? "invoke"
    : String(definition.ipcMode || "").trim();
  if (ipcChannel && !["invoke", "send", "sendSync"].includes(ipcMode)) {
    throw new UIActionDefinitionError(
      `UI action ${id} ipcMode must be invoke, send, or sendSync`,
      "UI_ACTION_IPC_MODE_INVALID",
    );
  }

  return Object.freeze({
    ...definition,
    id,
    label,
    description: String(definition.description || "").trim(),
    status,
    unavailableReason,
    requiresConfiguration: status === "requiresConfiguration",
    ipcChannel,
    ipcMode,
    verificationRequired: definition.verificationRequired === true,
    resultFields,
  });
}

function availabilityFromValue(value, fallback) {
  if (value === undefined || value === null || value === true) return fallback;
  if (value === false) {
    return {
      status: "unavailable",
      unavailableReason:
        fallback.unavailableReason || "This action cannot run in the current context",
    };
  }
  if (typeof value === "string") {
    return {
      status: assertStatus(value, "resolved status"),
      unavailableReason: fallback.unavailableReason,
    };
  }
  if (!isPlainObject(value)) {
    throw new UIActionDefinitionError(
      "canExecute/getStatus returned an invalid availability value",
      "UI_ACTION_AVAILABILITY_INVALID",
    );
  }
  const allowed = value.canExecute ?? value.allowed;
  let status = value.status;
  if (status === undefined && value.requiresConfiguration === true) {
    status = "requiresConfiguration";
  }
  if (status === undefined && allowed === false) status = "unavailable";
  if (status === undefined) status = fallback.status;
  assertStatus(status, "resolved status");
  if (allowed === false && status === "ready") status = "unavailable";
  return {
    status,
    unavailableReason: normalizeReason(
      value.unavailableReason ?? value.reason,
      fallback.unavailableReason,
    ),
  };
}

function publicDescriptor(definition, availability = null) {
  const resolved = availability || {
    status: definition.status,
    unavailableReason: definition.unavailableReason,
  };
  return {
    id: definition.id,
    label: definition.label,
    description: definition.description,
    status: resolved.status,
    canExecute: resolved.status === "ready",
    unavailableReason:
      resolved.status === "ready" || resolved.status === "loading"
        ? ""
        : normalizeReason(
            resolved.unavailableReason,
            definition.unavailableReason || defaultStatusReason(resolved.status),
          ),
    requiresConfiguration: resolved.status === "requiresConfiguration",
    hasHandler: typeof definition.execute === "function",
    successVerification:
      typeof definition.verifySuccess === "function" ? "readBack" : "handlerResult",
    verificationRequired: definition.verificationRequired === true,
    resultFields: definition.resultFields ? [...definition.resultFields] : null,
    ipcChannel: definition.ipcChannel,
    ipcMode: definition.ipcMode,
  };
}

class UIActionRegistry {
  constructor(options = {}) {
    const actions = Array.isArray(options) ? options : options.actions || [];
    if (!Array.isArray(actions)) {
      throw new UIActionDefinitionError("UIActionRegistry actions must be an array");
    }
    this.actions = new Map();
    this.registerMany(actions);
  }

  register(definition) {
    const normalized = normalizeDefinition(definition);
    if (this.actions.has(normalized.id)) {
      throw new UIActionDefinitionError(
        `Duplicate UI action id: ${normalized.id}`,
        "UI_ACTION_ID_DUPLICATE",
      );
    }
    this.actions.set(normalized.id, normalized);
    return normalized;
  }

  registerMany(definitions) {
    if (!Array.isArray(definitions)) {
      throw new UIActionDefinitionError("UI action definitions must be an array");
    }
    for (const definition of definitions) this.register(definition);
    return this;
  }

  has(id) {
    return this.actions.has(String(id || ""));
  }

  get(id) {
    return this.actions.get(String(id || "")) || null;
  }

  list() {
    return Array.from(this.actions.values()).map((definition) =>
      publicDescriptor(definition),
    );
  }

  get size() {
    return this.actions.size;
  }

  async resolve(id, context = {}, options = {}) {
    const definition = this.get(id);
    if (!definition) return null;
    let availability = {
      status: definition.status,
      unavailableReason: definition.unavailableReason,
    };
    try {
      if (typeof definition.getStatus === "function") {
        const resolved = await definition.getStatus(context);
        availability = availabilityFromValue(resolved, availability);
      }
      if (availability.status === "ready" && definition.canExecute !== undefined) {
        const result = typeof definition.canExecute === "function"
          ? await definition.canExecute(context)
          : definition.canExecute;
        availability = availabilityFromValue(result, availability);
      }
    } catch (error) {
      if (options.throwOnError === true) throw error;
      return {
        ...publicDescriptor(definition, {
          status: "unavailable",
          unavailableReason: "The action availability check failed",
        }),
        availabilityErrorCode: "UI_ACTION_AVAILABILITY_CHECK_FAILED",
      };
    }
    if (availability.status === "ready" && typeof definition.execute !== "function") {
      return {
        ...publicDescriptor(definition, {
          status: "unavailable",
          unavailableReason: "The action handler is unavailable",
        }),
        availabilityErrorCode: "UI_ACTION_HANDLER_MISSING",
      };
    }
    return publicDescriptor(definition, availability);
  }

  async snapshot(context = {}) {
    return Promise.all(
      Array.from(this.actions.keys()).map((id) => this.resolve(id, context)),
    );
  }
}

module.exports = {
  ACTION_ID_PATTERN,
  ACTION_STATUSES,
  UIActionDefinitionError,
  UIActionRegistry,
  assertActionId,
  normalizeDefinition,
  publicDescriptor,
};
