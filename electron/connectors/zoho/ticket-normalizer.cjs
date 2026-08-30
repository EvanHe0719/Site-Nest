function text(value, maximum = 500) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\r\n]+/g, " ").trim().slice(0, maximum);
}

function optionalIso(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed.toISOString();
}

function displayName(value) {
  if (!value || typeof value !== "object") return "";
  return text(
    value.name || value.displayName ||
      [value.firstName, value.lastName].filter(Boolean).join(" "),
    200,
  );
}

function isClosedTicket(raw) {
  const statusType = text(raw?.statusType).toLowerCase();
  const status = text(raw?.status).toLowerCase();
  return statusType === "closed" || status === "closed" || status === "已关闭";
}

function normalizeThread(raw) {
  const visibility = text(raw?.visibility || "public").toLowerCase();
  const direction = text(raw?.direction).toLowerCase();
  const authorType = text(raw?.author?.type || raw?.authorType).toUpperCase();
  const deliveryStatus = text(raw?.status).toUpperCase();
  const publicThread = visibility !== "private" && raw?.isPrivate !== true;
  // `source.type === SYSTEM` is also present on ordinary incoming customer
  // emails in Zoho's official response examples, so it is not evidence that a
  // message was automated. Prefer explicit flags and system-only author types.
  const automated = raw?.isAutoResponse === true || raw?.isSystemGenerated === true ||
    ["SYSTEM", "TEAM", "TICKET", "ACTIVITY"].includes(authorType);
  const delivered = !deliveryStatus || deliveryStatus === "SUCCESS";
  let publicDirection = null;
  if (publicThread && !automated && delivered) {
    if (authorType === "END_USER" || authorType === "CONTACT" || direction === "in") {
      publicDirection = "customer";
    } else if (authorType === "AGENT" || direction === "out") {
      publicDirection = "support";
    }
  }
  return {
    id: text(raw?.id, 160),
    createdAt: optionalIso(raw?.createdTime || raw?.sendDateTime || raw?.modifiedTime),
    visibility: publicThread ? "public" : "private",
    direction: publicDirection,
    automated,
    deliveryStatus: deliveryStatus || null,
  };
}

function latestPublicThread(threads) {
  return (Array.isArray(threads) ? threads : [])
    .map(normalizeThread)
    .filter((thread) => thread.visibility === "public" && thread.direction && thread.createdAt)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))[0] || null;
}

function normalizeTicket(raw, options = {}) {
  const latestThread = options.threads
    ? latestPublicThread(options.threads)
    : raw?.lastThread
      ? latestPublicThread([raw.lastThread])
      : null;
  const contact = raw?.contact || raw?.contactInfo || {};
  const account = raw?.account || {};
  const assignee = raw?.assignee || {};
  const responseDueAt = optionalIso(raw?.responseDueDate);
  const dueAt = optionalIso(raw?.dueDate);
  return {
    id: text(raw?.id, 160),
    ticketNumber: text(raw?.ticketNumber || raw?.ticketNo || raw?.id, 80),
    title: text(raw?.subject || "无标题工单", 300),
    status: text(raw?.status || "未知", 120),
    statusType: text(raw?.statusType, 80),
    closed: isClosedTicket(raw),
    priority: text(raw?.priority || "未设置", 80),
    assigneeId: text(raw?.assigneeId || assignee?.id, 160),
    assigneeName: displayName(assignee),
    contactId: text(raw?.contactId || contact?.id, 160),
    contactName: displayName(contact),
    accountId: text(raw?.accountId || account?.id, 160),
    accountName: displayName(account),
    customerName: displayName(account) || displayName(contact),
    createdAt: optionalIso(raw?.createdTime),
    updatedAt: optionalIso(raw?.modifiedTime || raw?.customerResponseTime || raw?.createdTime),
    latestPublicDirection: latestThread?.direction || null,
    latestPublicAt: latestThread?.createdAt || null,
    threadEvidence: Boolean(options.threads),
    responseDueAt,
    dueAt,
    officialSlaAt: responseDueAt || dueAt || null,
    officialSlaSource: responseDueAt ? "responseDueDate" : dueAt ? "dueDate" : null,
    officialResponseOverdue: raw?.isResponseOverdue === true,
    officialTicketOverdue: raw?.isOverDue === true,
    webUrl: text(raw?.webUrl || raw?.ticketUrl, 1000),
  };
}

module.exports = {
  isClosedTicket,
  latestPublicThread,
  normalizeThread,
  normalizeTicket,
  optionalIso,
};
