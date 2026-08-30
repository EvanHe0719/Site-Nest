const { ConnectorError, normalizeConnectorError } = require("../errors.cjs");

function combineSignals(signal, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error("request timeout")), timeoutMs);
  const abort = () => controller.abort(signal?.reason || new Error("request cancelled"));
  if (signal) {
    if (signal.aborted) abort();
    else signal.addEventListener("abort", abort, { once: true });
  }
  return {
    signal: controller.signal,
    dispose() {
      clearTimeout(timer);
      signal?.removeEventListener?.("abort", abort);
    },
  };
}

async function parseApiResponse(response) {
  if (response.status === 204) return null;
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    if (response.ok) {
      throw new ConnectorError("INVALID_RESPONSE", "Zoho Desk 返回了无法识别的数据", {
        cause: error,
        status: response.status,
      });
    }
    payload = {};
  }
  if (response.ok) return payload;
  const rawCode = String(payload?.errorCode || payload?.code || "").toUpperCase();
  const message = String(payload?.message || payload?.error || "Zoho Desk 请求失败");
  if (response.status === 401) {
    throw new ConnectorError("AUTH_EXPIRED", "Zoho Desk 登录已失效，请重新连接", {
      status: response.status,
    });
  }
  if (response.status === 403) {
    throw new ConnectorError("PERMISSION_DENIED", "当前 Zoho 账号没有所需的只读权限", {
      status: response.status,
    });
  }
  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after"));
    throw new ConnectorError("RATE_LIMITED", "Zoho Desk API 已限流，请稍后刷新", {
      status: response.status,
      retryable: true,
      retryAfterMs: Number.isFinite(retryAfter) ? retryAfter * 1000 : null,
    });
  }
  if (rawCode.includes("INVALID") && rawCode.includes("ORG")) {
    throw new ConnectorError("PERMISSION_DENIED", "Zoho Desk 组织 ID 无效或无权访问", {
      status: response.status,
    });
  }
  throw new ConnectorError("API_ERROR", message, {
    status: response.status,
    retryable: response.status >= 500,
  });
}

class ZohoDeskClient {
  constructor(options = {}) {
    this.fetchFn = options.fetchFn || globalThis.fetch;
    this.getAccess = options.getAccess;
    this.refreshAccess = options.refreshAccess;
    this.timeoutMs = Number(options.timeoutMs) || 20000;
  }

  async request(pathname, options = {}, retryAuth = true) {
    const method = String(options.method || "GET").toUpperCase();
    if (method !== "GET") {
      throw new ConnectorError(
        "PERMISSION_DENIED",
        "Zoho Desk 连接器处于只读模式，只允许查询请求",
      );
    }
    const access = await this.getAccess();
    if (!access?.accessToken || !access?.orgId || !access?.apiBase) {
      throw new ConnectorError("AUTH_REQUIRED", "Zoho Desk 尚未完成连接");
    }
    const url = new URL(pathname.replace(/^\//, ""), `${access.apiBase.replace(/\/$/, "")}/`);
    for (const [key, value] of Object.entries(options.query || {})) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    const combined = combineSignals(options.signal, options.timeoutMs || this.timeoutMs);
    try {
      const response = await this.fetchFn(url, {
        method,
        headers: {
          Authorization: `Zoho-oauthtoken ${access.accessToken}`,
          orgId: String(access.orgId),
          Accept: "application/json",
        },
        signal: combined.signal,
      });
      return await parseApiResponse(response);
    } catch (error) {
      if (error instanceof ConnectorError && error.code === "AUTH_EXPIRED" && retryAuth) {
        await this.refreshAccess();
        return this.request(pathname, options, false);
      }
      throw normalizeConnectorError(error);
    } finally {
      combined.dispose();
    }
  }

  getMyInfo(options = {}) {
    return this.request("myinfo", options);
  }

  async getTickets(options = {}) {
    const payload = await this.request("tickets", {
      signal: options.signal,
      query: {
        from: options.from ?? 0,
        limit: Math.min(50, Math.max(1, Number(options.limit) || 50)),
        // The public Desk schema only accepts dueDate, createdTime or recentThread
        // for the ticket list. Use recentThread and sort the normalized data locally.
        sortBy: options.sortBy || "recentThread",
        assignee: options.assignee,
        include: options.include || "contacts,departments,assignee,team",
        receivedInDays: options.receivedInDays,
      },
    });
    if (!Array.isArray(payload?.data)) {
      throw new ConnectorError("INVALID_RESPONSE", "Zoho Desk 工单列表格式无效");
    }
    return payload.data;
  }

  getTicket(ticketId, options = {}) {
    return this.request(`tickets/${encodeURIComponent(ticketId)}`, {
      signal: options.signal,
      query: { include: "contacts,departments,assignee,team" },
    });
  }

  async getThreads(ticketId, options = {}) {
    const payload = await this.request(`tickets/${encodeURIComponent(ticketId)}/threads`, {
      signal: options.signal,
      query: {
        from: options.from ?? 0,
        limit: Math.min(20, Math.max(1, Number(options.limit) || 10)),
        // Zoho already returns threads by sendDateTime descending when omitted.
        // Avoid the invalid legacy value "-createdTime".
        sortBy: options.sortBy,
      },
    });
    if (!Array.isArray(payload?.data)) {
      throw new ConnectorError("INVALID_RESPONSE", "Zoho Desk 工单线程格式无效");
    }
    return payload.data;
  }
}

module.exports = { ZohoDeskClient, parseApiResponse };
