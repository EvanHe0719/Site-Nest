const { randomUUID } = require("node:crypto");
const { getActionDefinition } = require("./action-catalog.cjs");
const { AssistantMatcher } = require("./matcher.cjs");
const {
  AssistantPermissionError,
  AssistantPermissionGuard,
} = require("./permission-guard.cjs");
const {
  enrichZohoDeskContext,
  ZOHO_DESK_ASSISTANT_ID,
} = require("./builtins/zoho-desk.cjs");
const {
  sanitizeExecutionRecord,
  sanitizeLogText,
} = require("./log-redaction.cjs");

const DEFAULT_CONTEXT_ENRICHERS = Object.freeze({
  "zoho-desk-url": enrichZohoDeskContext,
});

class AssistantExecutionError extends Error {
  constructor(message, code = "ASSISTANT_EXECUTION_INVALID") {
    super(message);
    this.name = "AssistantExecutionError";
    this.code = code;
  }
}

function actionConditionMet(action, context) {
  if (!action?.when) return true;
  if (action.when.present === true) {
    const value = context?.[action.when.field];
    return value !== null && value !== undefined && value !== "";
  }
  return false;
}

function safeWorkspaceId(value, fallback = "personal") {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9_-]{1,80}$/.test(normalized) ? normalized : fallback;
}

function safeSiteTitle(context) {
  const title = String(context?.title || "").trim();
  return (title || context?.hostname || "未命名网页").slice(0, 80);
}

function safeErrorCode(value, fallback) {
  const normalized = String(value || "").trim();
  return /^[A-Za-z0-9_.:-]{1,100}$/.test(normalized) ? normalized : fallback;
}

class AssistantExecutionService {
  constructor({
    registry,
    matcher = null,
    permissionGuard = null,
    pageContextAdapter,
    getCurrentSite = async () => null,
    getCurrentWorkspaceId = async () => "personal",
    clipboard = null,
    openExternal = null,
    saveSite = null,
    appendExecutionLog,
    updateAssistantRuntime = async () => undefined,
    contextEnrichers = DEFAULT_CONTEXT_ENRICHERS,
    now = () => new Date(),
    createId = () => randomUUID(),
  } = {}) {
    if (!registry?.get || !registry?.list || !registry?.isEnabled) {
      throw new TypeError("AssistantExecutionService 需要 AssistantRegistry");
    }
    if (!pageContextAdapter?.getCurrentContext) {
      throw new TypeError("AssistantExecutionService 需要 PageContextAdapter");
    }
    if (typeof appendExecutionLog !== "function") {
      throw new TypeError("AssistantExecutionService 需要执行日志写入函数");
    }
    this.registry = registry;
    this.matcher = matcher || new AssistantMatcher(registry);
    this.permissionGuard = permissionGuard || new AssistantPermissionGuard();
    this.pageContextAdapter = pageContextAdapter;
    this.getCurrentSite = getCurrentSite;
    this.getCurrentWorkspaceId = getCurrentWorkspaceId;
    this.clipboard = clipboard;
    this.openExternal = openExternal;
    this.saveSite = saveSite;
    this.appendExecutionLog = appendExecutionLog;
    this.updateAssistantRuntime = updateAssistantRuntime;
    this.contextEnrichers = contextEnrichers;
    this.now = now;
    this.createId = createId;
  }

  async getPanelContext() {
    const pageContext = await this.pageContextAdapter.getCurrentContext();
    const site = await this.getCurrentSite();
    const assistantIds = Array.isArray(site?.assistantIds) ? site.assistantIds : [];
    const matches = this.matcher.matchAll(pageContext, { assistantIds });
    return {
      page: { ...pageContext },
      assistants: matches.map(({ manifest, reason }) => {
        const context = this._enrichContext(manifest, pageContext);
        return {
          id: manifest.id,
          name: manifest.name,
          description: manifest.description,
          version: manifest.version,
          icon: manifest.icon,
          source: manifest.source,
          enabled: this.registry.isEnabled(manifest.id),
          matchReason: reason,
          permissions: this.permissionGuard.summarize(manifest),
          lastExecutedAt:
            this.registry.getRuntimeMetadata?.(manifest.id)?.lastExecutedAt || null,
          context: {
            ticketId: context.ticketId || null,
          },
          actions: manifest.actions
            .filter((action) => actionConditionMet(action, context))
            .map((action) => {
              const definition = getActionDefinition(action.type);
              const configured = definition?.availability !== "not-configured";
              return {
                id: action.id,
                name: action.name,
                description: action.description || "",
                availability: configured ? "available" : "not-configured",
                disabled: !configured,
                disabledReason: configured ? "" : definition.unavailableMessage,
              };
            }),
        };
      }),
    };
  }

  async execute(request) {
    this._validateRequest(request);
    const manifest = this.registry.get(request.assistantId);
    if (!manifest) {
      throw new AssistantExecutionError("找不到这个站点助手", "ASSISTANT_NOT_FOUND");
    }
    const action = manifest.actions.find((item) => item.id === request.actionId);
    if (!action) {
      throw new AssistantExecutionError("找不到这个站点助手动作", "ASSISTANT_ACTION_NOT_FOUND");
    }

    let pageContext = { hostname: "unknown", timestamp: this.now().toISOString() };
    let site = null;
    try {
      pageContext = await this.pageContextAdapter.getCurrentContext();
      site = await this.getCurrentSite();
      const assistantIds = Array.isArray(site?.assistantIds) ? site.assistantIds : [];
      const match = this.matcher.matches(manifest, pageContext, { assistantIds });
      if (!match.matched) {
        throw new AssistantPermissionError("当前页面不适用这个站点助手");
      }
      const context = this._enrichContext(manifest, pageContext);
      if (!actionConditionMet(action, context)) {
        throw new AssistantPermissionError("当前页面缺少执行此动作所需的明确上下文");
      }

      const definition = getActionDefinition(action.type);
      if (definition?.availability === "not-configured") {
        const message = definition.unavailableMessage || "未配置连接器";
        const logPersisted = await this._writeRecord({
          manifest,
          action,
          context,
          site,
          status: "not-configured",
          summary: message,
        });
        return { ok: false, status: "not-configured", message, logPersisted };
      }

      this.permissionGuard.assertCanExecute(manifest, action);
      await this._executeAction(manifest, action, context);
      const message = definition.successMessage;
      const logPersisted = await this._writeRecord({
        manifest,
        action,
        context,
        site,
        status: "success",
        summary: message,
      });
      return { ok: true, status: "success", message, logPersisted };
    } catch (error) {
      const denied = error instanceof AssistantPermissionError;
      const status = denied ? "denied" : "failure";
      const message = denied
        ? "当前页面不能执行这个动作"
        : "站点助手动作执行失败";
      const safeErrorMessage = sanitizeLogText(error?.message || message, 200);
      const errorCode = safeErrorCode(
        error?.code,
        denied ? "ASSISTANT_PERMISSION_DENIED" : "ASSISTANT_ACTION_FAILED",
      );
      const logPersisted = await this._writeRecord({
        manifest,
        action,
        context: pageContext,
        site,
        status,
        summary: message,
        errorCode,
        errorMessage: safeErrorMessage,
      });
      return {
        ok: false,
        status,
        message,
        errorCode,
        errorMessage: safeErrorMessage,
        logPersisted,
      };
    }
  }

  _validateRequest(request) {
    if (!request || typeof request !== "object" || Array.isArray(request)) {
      throw new AssistantExecutionError("助手动作请求格式无效");
    }
    const keys = Object.keys(request);
    if (
      keys.length !== 2 ||
      !keys.includes("assistantId") ||
      !keys.includes("actionId")
    ) {
      throw new AssistantExecutionError(
        "助手动作请求只能包含 assistantId 和 actionId",
      );
    }
    if (
      !/^[a-z0-9][a-z0-9-]{1,63}$/.test(String(request.assistantId || "")) ||
      !/^[a-z0-9][a-z0-9-]{1,63}$/.test(String(request.actionId || ""))
    ) {
      throw new AssistantExecutionError("助手或动作 id 格式无效");
    }
  }

  _enrichContext(manifest, pageContext) {
    const extractor = manifest.contextExtractor;
    if (!extractor) return pageContext;
    const enrich = this.contextEnrichers?.[extractor];
    if (typeof enrich !== "function") {
      throw new AssistantExecutionError(
        "页面上下文提取器不可用",
        "ASSISTANT_CONTEXT_EXTRACTOR_UNAVAILABLE",
      );
    }
    return enrich(pageContext);
  }

  async _executeAction(manifest, action, context) {
    switch (action.type) {
      case "page.copy-url":
        await this._writeClipboard(context.url);
        return;
      case "zoho.copy-ticket-id":
        if (!context.ticketId) {
          throw new AssistantExecutionError(
            "未识别到工单编号",
            "ZOHO_TICKET_ID_NOT_FOUND",
          );
        }
        await this._writeClipboard(context.ticketId);
        return;
      case "page.open-external":
        await this._openExternal(context.url);
        return;
      case "site.save-current":
      case "site.pin-current": {
        const workspaceId = safeWorkspaceId(await this.getCurrentWorkspaceId());
        await this._saveCurrentPage(manifest, context, {
          workspaceId,
          pinned: action.type === "site.pin-current",
        });
        return;
      }
      case "site.save-work":
      case "site.pin-work":
        await this._saveCurrentPage(manifest, context, {
          workspaceId: "work",
          pinned: action.type === "site.pin-work",
        });
        return;
      default:
        throw new AssistantExecutionError(
          "这个站点助手动作没有本地执行器",
          "ASSISTANT_ACTION_HANDLER_MISSING",
        );
    }
  }

  async _writeClipboard(text) {
    const writeText =
      typeof this.clipboard === "function"
        ? this.clipboard
        : this.clipboard?.writeText?.bind(this.clipboard);
    if (!writeText) {
      throw new AssistantExecutionError(
        "剪贴板能力不可用",
        "ASSISTANT_CLIPBOARD_UNAVAILABLE",
      );
    }
    await writeText(String(text || ""));
  }

  async _openExternal(url) {
    const open =
      typeof this.openExternal === "function"
        ? this.openExternal
        : this.openExternal?.openExternal?.bind(this.openExternal);
    if (!open) {
      throw new AssistantExecutionError(
        "系统浏览器能力不可用",
        "ASSISTANT_EXTERNAL_OPEN_UNAVAILABLE",
      );
    }
    await open(url);
  }

  async _saveCurrentPage(manifest, context, { workspaceId, pinned }) {
    if (typeof this.saveSite !== "function") {
      throw new AssistantExecutionError(
        "站点保存能力不可用",
        "ASSISTANT_SAVE_SITE_UNAVAILABLE",
      );
    }
    await this.saveSite({
      name: safeSiteTitle(context),
      url: context.url,
      workspaceId,
      siteKind: workspaceId === "work" ? "workApp" : "normal",
      openMode: "internal",
      pinned: Boolean(pinned),
      source: "custom",
      assistantIds: manifest.id === ZOHO_DESK_ASSISTANT_ID ? [manifest.id] : [],
    });
  }

  async _writeRecord({
    manifest,
    action,
    context,
    site,
    status,
    summary,
    errorCode = "",
    errorMessage = "",
  }) {
    const timestamp = this.now().toISOString();
    const record = sanitizeExecutionRecord({
      id: this.createId(),
      timestamp,
      assistantId: manifest.id,
      assistantName: manifest.name,
      actionId: action.id,
      actionName: action.name,
      site: {
        siteId: site?.id || "",
        hostname: context?.hostname || "unknown",
      },
      status,
      summary,
      errorCode,
      errorMessage,
    });
    this.registry.setLastExecutedAt?.(manifest.id, timestamp);
    try {
      await this.appendExecutionLog(record);
      await this.updateAssistantRuntime(manifest.id, { lastExecutedAt: timestamp });
      return true;
    } catch {
      return false;
    }
  }
}

module.exports = {
  AssistantExecutionError,
  AssistantExecutionService,
  DEFAULT_CONTEXT_ENRICHERS,
  actionConditionMet,
  safeErrorCode,
  safeWorkspaceId,
};
