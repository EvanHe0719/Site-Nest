const CHECKIN_DEFINITIONS = Object.freeze([
  { id: "naixi", name: "奶昔论坛 · 每日签到", url: "https://forum.naixi.net/k_misign-sign.html", color: "#ec7a5c", logo: "奶", enabled: true },
  { id: "nodeseek", name: "NodeSeek · 每日签到", url: "https://www.nodeseek.com/board", color: "#5b7cfa", logo: "NS", enabled: false },
]);
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function normalizeCheckin(value, definition) {
  const input = value && typeof value === "object" ? value : {};
  return {
    ...input,
    enabled: typeof input.enabled === "boolean" ? input.enabled : definition.enabled,
    time: TIME_PATTERN.test(input.time) ? input.time : "08:30",
    status: input.status === "running" ? "idle" : (input.status || "idle"),
    runs: Array.isArray(input.runs) ? input.runs.slice(-30) : [],
  };
}

function isDue(config, now) {
  if (!config?.enabled || !TIME_PATTERN.test(config.time)) return false;
  const today = dateKey(now);
  if (config.lastSuccessDate === today || config.lastAttemptDate === today) return false;
  return now.getHours() * 60 + now.getMinutes() >= Number(config.time.slice(0, 2)) * 60 + Number(config.time.slice(3));
}

// All approved check-in adapters share persistence, scheduling, deduplication and logs.
class DailyCheckinScheduler {
  constructor({ definitions = CHECKIN_DEFINITIONS, runners, getState, save, publish, now = () => new Date(), onActive = () => {} }) {
    Object.assign(this, { definitions, runners, getState, save, publish, now, onActive });
    this.active = new Map();
    this.stopped = false;
  }

  definition(id) {
    const definition = this.definitions.find((item) => item.id === id);
    if (!definition || typeof this.runners[id] !== "function") throw new Error("未知或未适配的签到脚本");
    return definition;
  }

  async patch(id, patch) {
    this.definition(id);
    const state = await this.getState();
    state.automations[id] = { ...state.automations[id], ...patch };
    await this.save();
    this.publish(id, state.automations[id]);
    return state.automations[id];
  }

  async update(id, input) {
    this.definition(id);
    if (!input || typeof input !== "object") throw new Error("签到设置无效");
    const patch = {};
    if (Object.hasOwn(input, "time")) {
      if (typeof input.time !== "string" || !TIME_PATTERN.test(input.time)) throw new Error("签到时间格式无效");
      patch.time = input.time;
    }
    if (Object.hasOwn(input, "enabled")) {
      if (typeof input.enabled !== "boolean") throw new Error("自动执行开关无效");
      patch.enabled = input.enabled;
    }
    return this.patch(id, patch);
  }

  run(id, { manual = false } = {}) {
    this.definition(id);
    if (this.active.has(id)) return this.active.get(id);
    if (this.stopped) return Promise.reject(new Error("签到调度已停止"));
    const promise = this.perform(id, manual).finally(() => {
      this.active.delete(id);
      this.onActive(this.active.size > 0);
    });
    this.active.set(id, promise);
    this.onActive(true);
    return promise;
  }

  async perform(id, manual) {
    const state = await this.getState();
    const config = state.automations[id];
    const now = this.now();
    const today = dateKey(now);
    if (config.lastSuccessDate === today) return config;
    if (!manual && !isDue(config, now)) return config;
    const startedAt = now.toISOString();
    await this.patch(id, { status: "running", message: "正在检查今日签到", lastRunAt: startedAt, lastAttemptDate: today });
    let result;
    try {
      result = await this.runners[id]({ manual: true, source: manual ? "manual" : "scheduled" });
      if (!["success", "needs-login", "needs-action", "error"].includes(result?.status)) {
        result = { status: "error", message: "脚本没有返回可确认的签到结果" };
      }
    } catch (error) {
      result = { status: "error", message: String(error?.message || "签到失败").slice(0, 300) };
    }
    const finished = this.now();
    const latest = (await this.getState()).automations[id];
    const patch = {
      status: result.status,
      lastRunAt: startedAt,
      message: String(result.message || "").slice(0, 300),
      runs: [...(latest.runs || []), { automationId: id, assistantName: this.definition(id).name || id, actionName: manual ? "手动签到" : "定时签到", source: "checkin", timestamp: startedAt, status: result.status, message: String(result.message || "").slice(0, 300) }].slice(-30),
    };
    if (result.status === "success") {
      patch.lastSuccessAt = finished.toISOString();
      patch.lastSuccessDate = dateKey(finished);
    }
    return this.patch(id, patch);
  }

  async tick() {
    if (this.stopped) return;
    const state = await this.getState();
    for (const { id } of this.definitions) {
      if (this.stopped) break;
      if (isDue(state.automations[id], this.now())) await this.run(id);
    }
  }

  start() {
    if (this.timer) return;
    this.stopped = false;
    const tick = () => this.tick().catch((error) => console.error("Check-in scheduling failed:", error.message));
    this.startup = setTimeout(tick, 8000);
    this.timer = setInterval(tick, 30_000);
    this.startup.unref?.();
    this.timer.unref?.();
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.startup);
    clearInterval(this.timer);
    this.timer = undefined;
  }
}

module.exports = { CHECKIN_DEFINITIONS, DailyCheckinScheduler, normalizeCheckin, isDue, dateKey };
