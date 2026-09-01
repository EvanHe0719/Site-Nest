class CompanionAIService {
  constructor(options = {}) {
    if (!options.translationService) throw new TypeError("translationService is required");
    this.translationService = options.translationService;
    this.pending = new Map();
  }

  async status() {
    const status = await this.translationService.status();
    return { configured: status.configured, providerName: status.providerName };
  }

  async run(requestId, task, input = {}) {
    const id = String(requestId || "default").slice(0, 120);
    this.cancel(id);
    const controller = new AbortController();
    this.pending.set(id, controller);
    try {
      if (task === "ask") {
        const question = String(input.question || "").trim().slice(0, 4_000);
        if (!question) throw Object.assign(new Error("请输入想问小序的问题"), { code: "INVALID_INPUT" });
        return await this.translationService.queryCompanion("ask", { question }, { signal: controller.signal });
      }
      if (task === "summarize") {
        const page = input.page || {};
        const text = String(page.text || "").slice(0, 20_000);
        if (!text) throw Object.assign(new Error("当前页面没有可用于总结的可见文字"), { code: "DATA_UNAVAILABLE" });
        return await this.translationService.queryCompanion("summarize", { page: { title: String(page.title || "").slice(0, 500), url: String(page.url || "").slice(0, 2_000), headings: (page.headings || []).slice(0, 30), text, truncated: page.truncated === true } }, { signal: controller.signal });
      }
      if (task === "reminder") {
        return await this.translationService.queryCompanion("reminder", { fact: String(input.fact || "").slice(0, 500) }, { signal: controller.signal });
      }
      throw Object.assign(new Error("不支持的小序 AI 任务"), { code: "INVALID_INPUT" });
    } finally {
      if (this.pending.get(id) === controller) this.pending.delete(id);
    }
  }

  cancel(requestId) {
    const id = String(requestId || "default").slice(0, 120);
    const controller = this.pending.get(id);
    if (!controller) return false;
    controller.abort();
    this.pending.delete(id);
    return true;
  }

  cancelAll() { for (const id of this.pending.keys()) this.cancel(id); }
}

module.exports = { CompanionAIService };
