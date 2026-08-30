const ALLOWED_PERMISSIONS = Object.freeze([
  "read:url",
  "read:title",
  "read:selection",
  "read:pageContext",
  "action:copy",
  "action:openExternal",
  "action:saveSite",
]);

const definitions = {
  "page.copy-url": {
    requiredPermissions: ["read:url", "action:copy"],
    successMessage: "已复制页面地址",
  },
  "page.open-external": {
    requiredPermissions: ["read:url", "action:openExternal"],
    successMessage: "已在系统浏览器中打开",
  },
  "site.save-current": {
    requiredPermissions: ["read:url", "read:title", "action:saveSite"],
    successMessage: "已保存到当前空间",
  },
  "site.pin-current": {
    requiredPermissions: ["read:url", "read:title", "action:saveSite"],
    successMessage: "已固定到当前空间",
  },
  "site.save-work": {
    requiredPermissions: ["read:url", "read:title", "action:saveSite"],
    successMessage: "已保存到工作空间",
  },
  "site.pin-work": {
    requiredPermissions: ["read:url", "read:title", "action:saveSite"],
    successMessage: "已固定到工作空间",
  },
  "zoho.copy-ticket-id": {
    requiredPermissions: ["read:url", "action:copy"],
    requiredContextFields: ["ticketId"],
    successMessage: "已复制工单编号",
  },
  "connector.send-b1": {
    availability: "not-configured",
    requiredPermissions: [],
    unavailableMessage: "未配置 B1 运维台连接器",
  },
  "connector.create-gitee-task": {
    availability: "not-configured",
    requiredPermissions: [],
    unavailableMessage: "未配置 Gitee 连接器",
  },
  "connector.open-customer-ops": {
    availability: "not-configured",
    requiredPermissions: [],
    unavailableMessage: "未配置 Customer Ops 连接器",
  },
  "connector.draft-customer-reply": {
    availability: "not-configured",
    requiredPermissions: [],
    unavailableMessage: "未配置客户回复草稿连接器",
  },
};

for (const definition of Object.values(definitions)) {
  Object.freeze(definition.requiredPermissions);
  if (definition.requiredContextFields) Object.freeze(definition.requiredContextFields);
  Object.freeze(definition);
}

const ACTION_DEFINITIONS = Object.freeze(definitions);

function getActionDefinition(type) {
  return ACTION_DEFINITIONS[String(type || "")] || null;
}

module.exports = {
  ACTION_DEFINITIONS,
  ALLOWED_PERMISSIONS,
  getActionDefinition,
};
