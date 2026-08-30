const { getActionDefinition } = require("./action-catalog.cjs");

class AssistantPermissionError extends Error {
  constructor(message, code = "ASSISTANT_PERMISSION_DENIED") {
    super(message);
    this.name = "AssistantPermissionError";
    this.code = code;
  }
}

class AssistantPermissionGuard {
  getRequiredPermissions(action) {
    const definition = getActionDefinition(action?.type);
    if (!definition) {
      throw new AssistantPermissionError(
        "这个站点助手动作未注册",
        "ASSISTANT_ACTION_UNKNOWN",
      );
    }
    return [...definition.requiredPermissions];
  }

  check(manifest, action) {
    if (!manifest || !action) {
      return { allowed: false, missing: [], reason: "助手或动作不存在" };
    }
    const registeredAction = manifest.actions.find((item) => item.id === action.id);
    if (!registeredAction || registeredAction.type !== action.type) {
      return { allowed: false, missing: [], reason: "动作不属于当前助手" };
    }
    const required = this.getRequiredPermissions(registeredAction);
    const granted = new Set(manifest.permissions || []);
    const missing = required.filter((permission) => !granted.has(permission));
    return {
      allowed: missing.length === 0,
      missing,
      reason: missing.length ? `缺少权限：${missing.join("、")}` : "",
    };
  }

  assertCanExecute(manifest, action) {
    const result = this.check(manifest, action);
    if (!result.allowed) throw new AssistantPermissionError(result.reason);
    return true;
  }

  summarize(manifest) {
    return Array.from(new Set(manifest?.permissions || []));
  }
}

module.exports = {
  AssistantPermissionError,
  AssistantPermissionGuard,
};
