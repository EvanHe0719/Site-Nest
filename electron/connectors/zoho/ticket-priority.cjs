function priorityReasons(ticket) {
  const reasons = [];
  if (ticket?.sla?.state === "overdue") reasons.push({ code: "sla-overdue", label: "SLA 已超时", rank: 600 });
  if (ticket?.sla?.state === "due-soon") reasons.push({ code: "sla-due-soon", label: "SLA 即将到期", rank: 500 });
  if (ticket?.waitingOver24h) reasons.push({ code: "waiting-24h", label: ticket.customerWaitingLabel, rank: 400 });
  if (/high|urgent|高|紧急/i.test(ticket?.priority || "")) reasons.push({ code: "high-priority", label: "高优先级", rank: 300 });
  if (ticket?.needsReply) reasons.push({ code: "needs-reply", label: "待我回复", rank: 200 });
  if (ticket?.addedToday) reasons.push({ code: "new-today", label: "今日新增", rank: 100 });
  return reasons;
}

function prioritizeTickets(tickets, limit = 12) {
  return (Array.isArray(tickets) ? tickets : [])
    .map((ticket) => ({ ...ticket, reasons: priorityReasons(ticket) }))
    .filter((ticket) => ticket.reasons.length)
    .sort((left, right) => {
      const rank = Math.max(...right.reasons.map((item) => item.rank)) -
        Math.max(...left.reasons.map((item) => item.rank));
      return rank || Date.parse(right.updatedAt || 0) - Date.parse(left.updatedAt || 0);
    })
    .slice(0, limit);
}

module.exports = { prioritizeTickets, priorityReasons };
