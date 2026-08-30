const ZOHO_DESK_ASSISTANT_ID = "zoho-desk-ticket";

const ZOHO_DESK_HOSTS = Object.freeze([
  "desk.zoho.com",
  "desk.zoho.eu",
  "desk.zoho.in",
  "desk.zoho.com.au",
  "desk.zoho.jp",
  "desk.zoho.com.cn",
  "desk.zoho.sa",
  "desk.zoho.uk",
  "desk.zohocloud.ca",
]);

const ZOHO_DESK_HELP_CENTER_SUFFIXES = Object.freeze([
  "zohodesk.com",
  "zohodesk.eu",
  "zohodesk.in",
  "zohodesk.com.au",
  "zohodesk.jp",
  "zohodesk.com.cn",
  "zohodesk.sa",
  "zohodesk.uk",
  "zohodesk.ca",
]);

const ZOHO_DESK_ASSISTANT = Object.freeze({
  id: ZOHO_DESK_ASSISTANT_ID,
  name: "Zoho Desk 工单助手",
  description: "识别 Zoho Desk 页面和明确的工单编号，提供本地快捷动作。",
  version: "1.0.0",
  icon: "ticket",
  source: "built-in",
  enabled: true,
  isGeneric: false,
  allowExplicitBinding: true,
  contextExtractor: "zoho-desk-url",
  matchPatterns: [
    {
      protocols: ["https:"],
      hostname: { exact: ZOHO_DESK_HOSTS },
      pathname: {
        exact: ["/"],
        prefixes: ["/agent/", "/support/", "/portal/"],
      },
    },
    {
      protocols: ["https:"],
      hostname: { suffix: ZOHO_DESK_HELP_CENTER_SUFFIXES },
      pathname: {
        exact: ["/"],
        prefixes: ["/agent/", "/support/", "/portal/"],
      },
    },
  ],
  permissions: [
    "read:url",
    "read:title",
    "action:copy",
    "action:openExternal",
    "action:saveSite",
  ],
  actions: [
    {
      id: "copy-ticket-link",
      type: "page.copy-url",
      name: "复制工单链接",
      description: "复制当前 Zoho Desk 页面地址。",
    },
    {
      id: "copy-ticket-id",
      type: "zoho.copy-ticket-id",
      name: "复制工单编号",
      description: "仅在 URL 中明确识别到 18 位工单编号时可用。",
      when: { field: "ticketId", present: true },
    },
    {
      id: "open-ticket-external",
      type: "page.open-external",
      name: "在系统浏览器中打开",
      description: "使用系统默认浏览器打开当前工单页面。",
    },
    {
      id: "save-ticket-to-work",
      type: "site.save-work",
      name: "保存到工作空间",
      description: "将当前页面保存为工作应用。",
    },
    {
      id: "pin-ticket-to-work",
      type: "site.pin-work",
      name: "固定到工作空间",
      description: "保存当前页面并固定到工作空间。",
    },
    {
      id: "open-customer-profile",
      type: "connector.open-customer-ops",
      name: "打开 Customer Ops 客户档案",
      description: "需要后续配置 Customer Ops 连接器。",
    },
    {
      id: "draft-customer-reply",
      type: "connector.draft-customer-reply",
      name: "生成客户回复草稿",
      description: "需要后续配置客户回复草稿连接器。",
    },
  ],
});

function extractZohoDeskTicketId(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    if (parsed.protocol !== "https:") return null;
    const pathMatch = parsed.pathname.match(
      /(?:^|\/)tickets\/details\/([0-9]{18})(?=\/|$)/i,
    );
    if (pathMatch) return pathMatch[1];
    const legacyHashMatch = parsed.hash.match(/^#Cases\/dv\/([0-9]{18})\/?$/i);
    return legacyHashMatch ? legacyHashMatch[1] : null;
  } catch {
    return null;
  }
}

function enrichZohoDeskContext(context) {
  return Object.freeze({
    ...context,
    ticketId: extractZohoDeskTicketId(context?.url),
  });
}

module.exports = {
  ZOHO_DESK_ASSISTANT,
  ZOHO_DESK_ASSISTANT_ID,
  ZOHO_DESK_HELP_CENTER_SUFFIXES,
  ZOHO_DESK_HOSTS,
  enrichZohoDeskContext,
  extractZohoDeskTicketId,
};
