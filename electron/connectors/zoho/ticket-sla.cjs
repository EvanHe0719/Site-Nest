function ticketSlaStatus(ticket, options = {}) {
  const nowMs = new Date(options.now || Date.now()).valueOf();
  const thresholdMs = Math.max(0, Number(options.warningHours ?? 4)) * 60 * 60 * 1000;
  const slaAt = ticket?.officialSlaAt ? Date.parse(ticket.officialSlaAt) : NaN;
  const overdueFlag = ticket?.officialResponseOverdue || ticket?.officialTicketOverdue;
  if (!Number.isFinite(slaAt)) {
    if (overdueFlag && !ticket?.closed) {
      return {
        available: true,
        state: "overdue",
        remainingMs: null,
        dueAt: null,
        source: ticket?.officialResponseOverdue ? "isResponseOverdue" : "isOverDue",
        label: "SLA 已超时",
      };
    }
    return {
      available: false,
      state: "unavailable",
      remainingMs: null,
      dueAt: null,
      source: null,
      label: "当前连接未返回 SLA 数据",
    };
  }
  const remainingMs = slaAt - nowMs;
  const overdue = !ticket.closed && (overdueFlag || remainingMs < 0);
  const dueSoon = !ticket.closed && !overdue && remainingMs <= thresholdMs;
  return {
    available: true,
    state: overdue ? "overdue" : dueSoon ? "due-soon" : ticket.closed ? "satisfied" : "on-track",
    remainingMs,
    dueAt: new Date(slaAt).toISOString(),
    source: ticket.officialSlaSource,
    label: overdue ? "SLA 已超时" : dueSoon ? "SLA 即将到期" : ticket.closed ? "SLA 已结束" : "SLA 正常",
  };
}

module.exports = { ticketSlaStatus };
