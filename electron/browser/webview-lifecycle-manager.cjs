const MEMORY_MODES = Object.freeze({
  saver: Object.freeze({ id: "saver", maxWarm: 0, inactiveMinutes: 0 }),
  standard: Object.freeze({ id: "standard", maxWarm: 1, inactiveMinutes: 15 }),
  performance: Object.freeze({ id: "performance", maxWarm: 3, inactiveMinutes: 15 }),
});

const RUNTIME_STATES = new Set(["active", "warm", "suspended", "restoring", "crashed"]);

/** @param {any} value */
function normalizeBrowserMemorySettings(value = {}) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const mode = MEMORY_MODES[input.mode] ? input.mode : "standard";
  const fallback = MEMORY_MODES[mode].inactiveMinutes;
  return {
    mode,
    inactiveMinutes: Math.max(0, Math.min(120, Number.isFinite(Number(input.inactiveMinutes)) ? Number(input.inactiveMinutes) : fallback)),
  };
}

class SessionRuntimeState {
  constructor(state = "suspended", now = () => Date.now()) {
    this.now = now;
    this.state = RUNTIME_STATES.has(state) ? state : "suspended";
    this.reason = "";
    this.updatedAt = new Date(this.now()).toISOString();
  }

  transition(state, reason = "") {
    if (!RUNTIME_STATES.has(state)) throw new Error(`Unknown session runtime state: ${state}`);
    this.state = state;
    this.reason = String(reason || "").slice(0, 160);
    this.updatedAt = new Date(this.now()).toISOString();
    return this.snapshot();
  }

  snapshot() {
    return { state: this.state, reason: this.reason, updatedAt: this.updatedAt };
  }
}

class WebViewPool {
  constructor(settings = {}) {
    this.settings = normalizeBrowserMemorySettings(settings);
  }

  update(settings) {
    this.settings = normalizeBrowserMemorySettings(settings);
  }

  plan(tabs, activeTabIds = new Set(), now = Date.now()) {
    const config = MEMORY_MODES[this.settings.mode];
    const inactiveMs = this.settings.inactiveMinutes * 60_000;
    const inactive = (Array.isArray(tabs) ? tabs : [])
      .filter((tab) => tab?.view && !activeTabIds.has(tab.tabId) && !tab.detached)
      .sort((left, right) => Date.parse(right.lastActiveAt || 0) - Date.parse(left.lastActiveAt || 0));
    const warm = [];
    const suspend = [];
    for (const tab of inactive) {
      const lastActive = Date.parse(tab.lastActiveAt || 0);
      const stale = inactiveMs === 0 || !Number.isFinite(lastActive) || now - lastActive >= inactiveMs;
      if (!stale && warm.length < config.maxWarm) warm.push(tab);
      else suspend.push(tab);
    }
    return { warm, suspend };
  }
}

class WebViewLifecycleManager {
  /**
   * @param {{getTabs?: Function, getActiveTabIds?: Function, isProtected?: Function, suspend?: Function, onState?: Function, settings?: any, now?: () => number, intervalMs?: number}} [options]
   */
  constructor({ getTabs, getActiveTabIds, isProtected, suspend, onState = (_value) => undefined, settings, now = () => Date.now(), intervalMs = 60_000 } = {}) {
    this.getTabs = getTabs;
    this.getActiveTabIds = getActiveTabIds;
    this.isProtected = isProtected;
    this.suspend = suspend;
    this.onState = onState;
    this.now = now;
    this.pool = new WebViewPool(settings);
    this.intervalMs = Math.max(1_000, Number(intervalMs) || 60_000);
    this.timer = null;
    this.enforcing = null;
  }

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => void this.enforce("idle-timeout"), this.intervalMs);
    this.timer.unref?.();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  updateSettings(settings) {
    this.pool.update(settings);
    return this.enforce("settings-change");
  }

  enforce(reason = "pool-limit") {
    if (this.enforcing) return this.enforcing;
    this.enforcing = this._enforce(reason).finally(() => { this.enforcing = null; });
    return this.enforcing;
  }

  async _enforce(reason) {
    const tabs = this.getTabs?.() || [];
    const activeIds = new Set(this.getActiveTabIds?.() || []);
    for (const tab of tabs) {
      if (!tab.runtimeState) tab.runtimeState = new SessionRuntimeState(tab.view ? "warm" : "suspended", this.now);
      if (activeIds.has(tab.tabId) || tab.detached) {
        tab.runtimeState.transition("active", tab.detached ? "detached-window" : "selected");
      } else if (!tab.view) {
        tab.runtimeState.transition("suspended", tab.suspensionReason || "no-web-contents");
      }
    }
    const plan = this.pool.plan(tabs, activeIds, this.now());
    for (const tab of plan.warm) tab.runtimeState.transition("warm", "recent-background");
    const suspended = [];
    const protectedTabs = [];
    for (const tab of plan.suspend) {
      const protection = await this.isProtected?.(tab);
      if (protection?.protected) {
        tab.runtimeState.transition("warm", protection.reason || "protected");
        protectedTabs.push({ tabId: tab.tabId, reason: protection.reason || "protected" });
        continue;
      }
      await this.suspend?.(tab, reason);
      tab.runtimeState.transition("suspended", reason);
      suspended.push(tab.tabId);
    }
    const snapshot = this.snapshot(tabs, protectedTabs);
    this.onState(snapshot);
    return { ...snapshot, suspended };
  }

  snapshot(tabs = this.getTabs?.() || [], protectedTabs = []) {
    const sessions = tabs.map((tab) => ({
      tabId: tab.tabId,
      workspaceId: tab.workspaceId,
      state: tab.runtimeState?.state || (tab.view ? "warm" : "suspended"),
      reason: tab.runtimeState?.reason || tab.suspensionReason || "",
      keepRunning: tab.keepRunning === true,
      hasWebContents: Boolean(tab.view && !tab.view.webContents?.isDestroyed?.()),
    }));
    return {
      settings: this.pool.settings,
      sessions,
      counts: sessions.reduce((result, session) => {
        result[session.state] = (result[session.state] || 0) + 1;
        return result;
      }, { active: 0, warm: 0, suspended: 0, restoring: 0, crashed: 0 }),
      protectedTabs,
    };
  }
}

module.exports = {
  MEMORY_MODES,
  RUNTIME_STATES,
  SessionRuntimeState,
  WebViewLifecycleManager,
  WebViewPool,
  normalizeBrowserMemorySettings,
};
