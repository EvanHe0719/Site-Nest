const { CompanionStateMachine } = require("./state-machine.cjs");
const { quietReason } = require("./quiet-policy.cjs");
const { WellnessEngine } = require("./wellness-engine.cjs");

class CompanionRuntimeService {
  constructor(options = {}) {
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.getIdleSeconds = typeof options.getIdleSeconds === "function" ? options.getIdleSeconds : () => 0;
    this.getContext = typeof options.getContext === "function" ? options.getContext : () => ({});
    this.onSnapshot = typeof options.onSnapshot === "function" ? options.onSnapshot : null;
    this.settings = { enabled: false, focusDockSeconds: 30, idleThresholdSeconds: 120, ...(options.settings || {}) };
    this.machine = new CompanionStateMachine({ enabled: this.settings.enabled, state: this.settings.enabled ? "idle" : "silentHidden" }, { now: () => new Date(this.now()) });
    this.runtime = options.runtime && typeof options.runtime === "object" ? { ...options.runtime } : {};
    this.settings.pausedUntil = this.runtime.pausedUntil || this.settings.pausedUntil;
    this.settings.dismissedUntil = this.runtime.dismissedUntil || this.settings.dismissedUntil;
    this.wellness = new WellnessEngine(this.settings.wellness, { now: this.now, runtime: this.runtime });
    this.activeSince = null;
    this.lastMeaningfulAt = null;
    this.currentReminder = null;
    this.bubbleExpiresAt = null;
    this.temporarilyHidden = false;
    this.timer = null;
    this.tickIntervalMs = Math.max(5_000, Number(options.tickIntervalMs) || 15_000);
  }

  start() {
    if (this.timer) return this.snapshot();
    this.tick();
    this.timer = setInterval(() => this.tick(), this.tickIntervalMs);
    this.timer.unref?.();
    return this.snapshot();
  }

  stop() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  updateSettings(value = {}) {
    const wasEnabled = this.settings.enabled === true;
    this.settings = { ...this.settings, ...value, wellness: { ...(this.settings.wellness || {}), ...(value.wellness || {}) } };
    this.wellness.updateSettings(this.settings.wellness);
    if (!wasEnabled && this.settings.enabled === true) this.machine.transition("enable");
    if (wasEnabled && this.settings.enabled !== true) this.machine.transition("disable");
    return this.tick();
  }

  recordMeaningfulAction(at = this.now()) {
    this.lastMeaningfulAt = at;
    return this.tick(at);
  }

  action(name, input = {}) {
    const now = this.now();
    if (name === "pause") this.settings.pausedUntil = new Date(now + Math.max(1, Number(input.minutes) || 60) * 60_000).toISOString();
    else if (name === "resume") {
      this.settings.pausedUntil = null;
      this.settings.dismissedUntil = null;
      this.temporarilyHidden = false;
    }
    else if (name === "dismiss-today") {
      const tomorrow = new Date(now);
      tomorrow.setHours(24, 0, 0, 0);
      this.settings.dismissedUntil = tomorrow.toISOString();
    } else if (name === "snooze" && this.currentReminder) {
      this.wellness.snooze(this.currentReminder.kind, input.minutes, now);
      this.currentReminder = null;
      this.bubbleExpiresAt = null;
    } else if (name === "ack-water") {
      this.wellness.acknowledge("water", now);
      if (this.currentReminder?.kind === "water") this.currentReminder = null;
      this.bubbleExpiresAt = null;
    } else if (name === "acknowledge" && this.currentReminder) {
      this.wellness.acknowledge(this.currentReminder.kind, now);
      this.currentReminder = null;
      this.bubbleExpiresAt = null;
    } else if (name === "hide") {
      this.temporarilyHidden = true;
      this.machine.transition("disable", { reason: "user-hidden" });
    } else if (name === "wake") {
      this.temporarilyHidden = false;
      if (this.settings.enabled && this.machine.snapshot().enabled !== true) this.machine.transition("enable", { reason: "user-wake" });
      this.machine.transition("wake", { focused: this.activeSince !== null });
    } else if (["expand", "collapse"].includes(name)) {
      this.machine.transition(name, { panel: input.panel, focused: this.activeSince !== null });
    }
    return this.tick(now);
  }

  tick(at = this.now()) {
    const now = Number(at);
    const context = this.getContext() || {};
    const idleSeconds = Math.max(0, Number(this.getIdleSeconds()) || 0);
    const eligible = this.settings.enabled === true && context.foreground === true && context.minimized !== true && context.locked !== true && context.sleeping !== true && context.backgroundAutomation !== true && idleSeconds < this.settings.idleThresholdSeconds;
    if (eligible && this.activeSince === null) this.activeSince = now;
    if (!eligible) this.activeSince = null;
    const quiet = quietReason(this.settings, context, new Date(now));
    if (this.currentReminder && this.bubbleExpiresAt && now >= this.bubbleExpiresAt && this.machine.snapshot().state === "bubbleTip") {
      this.machine.transition(eligible ? "focus" : "rest", { reason: "tip-expired" });
      this.bubbleExpiresAt = null;
    }
    if (this.settings.enabled !== true || this.temporarilyHidden || quiet && ["fullscreen", "screen-sharing", "system-away"].includes(quiet)) {
      if (this.machine.snapshot().state !== "silentHidden") this.machine.transition("disable", { reason: quiet || "disabled" });
    } else if (this.machine.snapshot().enabled !== true) {
      this.machine.transition("enable", { reason: "eligible" });
    }
    if (this.machine.snapshot().enabled && this.machine.snapshot().state !== "expanded") {
      if (!eligible) this.machine.transition("rest", { reason: quiet || "inactive" });
      else if (now - this.activeSince >= Math.max(20, Number(this.settings.focusDockSeconds) || 30) * 1_000) this.machine.transition("focus", { reason: "continuous-active" });
      else this.machine.transition("idle", { reason: "active" });
    }
    if (eligible && !quiet && !this.currentReminder) {
      const reminder = this.wellness.due(this.activeSince, now);
      if (reminder) {
        this.currentReminder = reminder;
        this.bubbleExpiresAt = now + 12_000;
        this.wellness.markShown(reminder.kind, now);
        if (this.machine.snapshot().state !== "expanded") this.machine.transition("tip", { reason: reminder.kind });
      }
    }
    const snapshot = this.snapshot(context, idleSeconds, quiet);
    this.onSnapshot?.(snapshot);
    return snapshot;
  }

  snapshot(context = this.getContext() || {}, idleSeconds = this.getIdleSeconds(), quiet = quietReason(this.settings, context, new Date(this.now()))) {
    return {
      ...this.machine.snapshot(),
      activeSince: this.activeSince ? new Date(this.activeSince).toISOString() : null,
      lastMeaningfulAt: this.lastMeaningfulAt ? new Date(this.lastMeaningfulAt).toISOString() : null,
      idleSeconds: Math.max(0, Math.round(Number(idleSeconds) || 0)),
      quietReason: quiet,
      reminder: this.currentReminder ? { ...this.currentReminder } : null,
      temporarilyHidden: this.temporarilyHidden,
    };
  }

  runtimeState() {
    return {
      pausedUntil: this.settings.pausedUntil || null,
      dismissedUntil: this.settings.dismissedUntil || null,
      ...this.wellness.runtimeState(),
      aiAllowedHosts: Array.isArray(this.runtime.aiAllowedHosts) ? [...this.runtime.aiAllowedHosts] : [],
    };
  }
}

module.exports = { CompanionRuntimeService };
