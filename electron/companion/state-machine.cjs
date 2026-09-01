const COMPANION_STATES = Object.freeze([
  "idle",
  "focusedDocked",
  "resting",
  "bubbleTip",
  "expanded",
  "silentHidden",
]);

const STATE_SET = new Set(COMPANION_STATES);

class CompanionStateError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "CompanionStateError";
    this.code = code;
  }
}

function normalizeCompanionRuntime(value = {}) {
  const state = STATE_SET.has(value.state) ? value.state : "silentHidden";
  return {
    state,
    previousState: STATE_SET.has(value.previousState) ? value.previousState : null,
    enabled: value.enabled === true,
    panel: value.panel === "weather" || value.panel === "assistant" ? value.panel : "home",
    reason: String(value.reason || "startup").slice(0, 120),
    changedAt: typeof value.changedAt === "string" ? value.changedAt : null,
  };
}

function stateForEvent(current, event, context = {}) {
  const runtime = normalizeCompanionRuntime(current);
  const name = String(event || "");
  if (name === "disable" || context.enabled === false || context.shouldHide === true) return "silentHidden";
  if (name === "enable" && runtime.state === "silentHidden") return "idle";
  if (!runtime.enabled && name !== "enable") return "silentHidden";
  if (name === "expand") return "expanded";
  if (name === "collapse") return context.focused === true ? "focusedDocked" : "idle";
  if (name === "tip") return context.quiet === true ? runtime.state : "bubbleTip";
  if (name === "rest") return "resting";
  if (name === "focus") return "focusedDocked";
  if (name === "wake" || name === "idle") return "idle";
  throw new CompanionStateError("COMPANION_EVENT_UNKNOWN", `未知的小序状态事件：${name || "(empty)"}`);
}

class CompanionStateMachine {
  constructor(value = {}, options = {}) {
    this.now = typeof options.now === "function" ? options.now : () => new Date();
    this.runtime = normalizeCompanionRuntime(value);
  }

  transition(event, context = {}) {
    const nextState = stateForEvent(this.runtime, event, context);
    const previousState = this.runtime.state;
    this.runtime = {
      ...this.runtime,
      enabled: event === "enable" ? true : event === "disable" ? false : this.runtime.enabled,
      previousState,
      state: nextState,
      panel: context.panel === "weather" || context.panel === "assistant" ? context.panel : this.runtime.panel,
      reason: String(context.reason || event || "transition").slice(0, 120),
      changedAt: this.now().toISOString(),
    };
    return this.snapshot();
  }

  snapshot() {
    return { ...this.runtime };
  }
}

module.exports = {
  COMPANION_STATES,
  CompanionStateError,
  CompanionStateMachine,
  normalizeCompanionRuntime,
  stateForEvent,
};
