const { ConnectorError } = require("../errors.cjs");
const { normalizeTicket } = require("./ticket-normalizer.cjs");
const { calculateTicketMetrics } = require("./ticket-metrics.cjs");
const { prioritizeTickets } = require("./ticket-priority.cjs");

function unwrapAgent(payload) {
  const value = payload?.data && !Array.isArray(payload.data) ? payload.data : payload;
  if (!value || typeof value !== "object") {
    throw new ConnectorError("INVALID_RESPONSE", "Zoho Desk 当前用户信息格式无效");
  }
  const id = String(value.id || value.agentId || "").trim();
  if (!id) throw new ConnectorError("INVALID_RESPONSE", "Zoho Desk 未返回当前 Agent 编号");
  return {
    id,
    name: String(value.name || value.displayName || `${value.firstName || ""} ${value.lastName || ""}`).trim(),
    email: String(value.emailId || value.email || "").trim(),
  };
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const output = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      output[index] = await mapper(items[index], index);
    }
  }
  await Promise.all(
    Array.from({ length: Math.max(1, Math.min(concurrency, items.length || 1)) }, worker),
  );
  return output;
}

function ticketWebUrl(ticket, publicConfig) {
  if (ticket.webUrl) return ticket.webUrl;
  const base = String(publicConfig?.webBaseUrl || "").replace(/\/$/, "");
  return base && ticket.id ? `${base}/agent/tickets/details/${encodeURIComponent(ticket.id)}` : "";
}

class ZohoDashboardService {
  constructor(options = {}) {
    this.client = options.client;
    this.cache = options.cache;
    this.cacheKey = options.cacheKey || "zoho-desk:dashboard";
    this.maxTickets = Math.min(100, Math.max(10, Number(options.maxTickets) || 50));
    this.threadConcurrency = Math.min(6, Math.max(1, Number(options.threadConcurrency) || 4));
  }

  async getCached() {
    return this.cache?.get(this.cacheKey) || null;
  }

  async refresh(input = {}) {
    const agent = unwrapAgent(await this.client.getMyInfo({ signal: input.signal }));
    const requestedLookback = Number(input.publicConfig?.lookbackDays) || 30;
    const lookbackDays = requestedLookback <= 15 ? 15 : requestedLookback <= 30 ? 30 : 90;
    const rawTickets = [];
    for (let from = 0; from < this.maxTickets; from += 50) {
      const page = await this.client.getTickets({
        from,
        limit: Math.min(50, this.maxTickets - from),
        assignee: agent.id,
        receivedInDays: lookbackDays,
        sortBy: "recentThread",
        signal: input.signal,
      });
      rawTickets.push(...page);
      if (page.length < 50 || rawTickets.length >= this.maxTickets) break;
    }
    const candidates = rawTickets.filter((ticket) => {
      const statusType = String(ticket?.statusType || "").toLowerCase();
      const status = String(ticket?.status || "").toLowerCase();
      return statusType !== "closed" && status !== "closed" && status !== "已关闭";
    });
    const threadsByTicketId = new Map();
    await mapWithConcurrency(candidates, this.threadConcurrency, async (rawTicket) => {
      if (input.signal?.aborted) throw new DOMException("Aborted", "AbortError");
      const ticketId = String(rawTicket?.id || "");
      if (!ticketId) return;
      const threads = await this.client.getThreads(ticketId, {
        limit: 10,
        signal: input.signal,
      });
      threadsByTicketId.set(ticketId, threads);
    });
    const normalized = rawTickets.map((rawTicket) => {
      const ticket = normalizeTicket(rawTicket, {
        threads: threadsByTicketId.get(String(rawTicket?.id || "")),
      });
      ticket.webUrl = ticketWebUrl(ticket, input.publicConfig);
      return ticket;
    });
    const metrics = calculateTicketMetrics(normalized, {
      currentAgentId: agent.id,
      now: input.now,
      slaWarningHours: Number(input.publicConfig?.slaWarningHours) || 4,
    });
    const dashboard = {
      status: "connected",
      agent,
      counts: metrics.counts,
      slaAvailable: metrics.slaAvailable,
      priorityTickets: prioritizeTickets(metrics.tickets, 12),
      recentTickets: [...metrics.tickets]
        .sort((left, right) => Date.parse(right.updatedAt || 0) - Date.parse(left.updatedAt || 0))
        .slice(0, 12),
      dueSoonTickets: metrics.tickets
        .filter((ticket) => ["due-soon", "overdue"].includes(ticket.sla.state))
        .sort((left, right) => (left.sla.remainingMs || 0) - (right.sla.remainingMs || 0))
        .slice(0, 10),
      syncedAt: new Date(input.now || Date.now()).toISOString(),
      lookbackDays,
    };
    if (this.cache) await this.cache.set(this.cacheKey, dashboard);
    return { ...dashboard, stale: false, updating: false };
  }

  async getTicketContext(ticketId, input = {}) {
    const cache = await this.getCached();
    const cachedTicket = [
      ...(cache?.data?.priorityTickets || []),
      ...(cache?.data?.recentTickets || []),
      ...(cache?.data?.dueSoonTickets || []),
    ].find((ticket) => String(ticket.id) === String(ticketId));
    if (cachedTicket && !input.force) return cachedTicket;
    const [raw, threads] = await Promise.all([
      this.client.getTicket(ticketId, { signal: input.signal }),
      this.client.getThreads(ticketId, { limit: 10, signal: input.signal }),
    ]);
    const normalized = normalizeTicket(raw, { threads });
    normalized.webUrl = ticketWebUrl(normalized, input.publicConfig);
    return calculateTicketMetrics([normalized], {
      currentAgentId: input.currentAgentId,
      now: input.now,
      slaWarningHours: Number(input.publicConfig?.slaWarningHours) || 4,
    }).tickets[0];
  }
}

module.exports = { ZohoDashboardService, mapWithConcurrency, unwrapAgent };
