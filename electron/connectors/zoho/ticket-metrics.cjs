const { ticketSlaStatus } = require("./ticket-sla.cjs");

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function waitingMs(ticket, now = Date.now()) {
  if (ticket?.closed || ticket?.latestPublicDirection !== "customer" || !ticket?.latestPublicAt) return null;
  const startedAt = Date.parse(ticket.latestPublicAt);
  return Number.isFinite(startedAt) ? Math.max(0, new Date(now).valueOf() - startedAt) : null;
}

function formatDuration(durationMs) {
  if (!Number.isFinite(durationMs)) return "—";
  const hours = Math.floor(durationMs / 3600000);
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (days) return `${days} 天${remainingHours ? ` ${remainingHours} 小时` : ""}`;
  return `${Math.max(0, hours)} 小时`;
}

function analyzeTicket(ticket, options = {}) {
  const now = options.now || Date.now();
  const currentAgentId = String(options.currentAgentId || "");
  const assignedToCurrent = !currentAgentId || ticket.assigneeId === currentAgentId;
  const waiting = waitingMs(ticket, now);
  const sla = ticketSlaStatus(ticket, {
    now,
    warningHours: options.slaWarningHours,
  });
  const needsReply = assignedToCurrent && !ticket.closed && ticket.threadEvidence === true &&
    ticket.latestPublicDirection === "customer";
  const today = localDateKey(ticket.createdAt) === localDateKey(now);
  return {
    ...ticket,
    assignedToCurrent,
    needsReply,
    addedToday: assignedToCurrent && today,
    customerWaitingMs: waiting,
    customerWaitingLabel: waiting === null ? null : `客户等待 ${formatDuration(waiting)}`,
    waitingOver24h: waiting !== null && waiting >= 24 * 60 * 60 * 1000,
    sla,
  };
}

function calculateTicketMetrics(tickets, options = {}) {
  const analyzed = (Array.isArray(tickets) ? tickets : []).map((ticket) =>
    analyzeTicket(ticket, options),
  );
  return {
    tickets: analyzed,
    counts: {
      needsReply: analyzed.filter((ticket) => ticket.needsReply).length,
      addedToday: analyzed.filter((ticket) => ticket.addedToday).length,
      waitingOver24h: analyzed.filter((ticket) => ticket.waitingOver24h).length,
      slaDueSoon: analyzed.filter((ticket) => ticket.sla.state === "due-soon").length,
      slaOverdue: analyzed.filter((ticket) => ticket.sla.state === "overdue").length,
    },
    slaAvailable: analyzed.some((ticket) => ticket.sla.available),
  };
}

module.exports = {
  analyzeTicket,
  calculateTicketMetrics,
  formatDuration,
  localDateKey,
  waitingMs,
};
