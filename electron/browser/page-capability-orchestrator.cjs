const VALID_PHASES = new Set(["immediate", "dom-ready", "idle", "manual"]);

function normalizedTask(candidate) {
  if (!candidate || typeof candidate !== "object" || typeof candidate.run !== "function") {
    throw new TypeError("Page capability task requires a run function");
  }
  const id = String(candidate.id || "").trim();
  if (!id) throw new TypeError("Page capability task requires an id");
  return { id, run: candidate.run };
}

class PageCapabilityOrchestrator {
  constructor({ idleDelayMs = 350, onError = (_event) => undefined } = {}) {
    this.idleDelayMs = Math.max(0, Number(idleDelayMs) || 0);
    this.onError = onError;
    this.pendingIdle = new Map();
    this.active = new Map();
  }

  run(ownerId, phase, tasks = []) {
    const owner = String(ownerId || "");
    if (!owner) throw new TypeError("Page capability owner is required");
    if (!VALID_PHASES.has(phase)) throw new Error(`Unknown page capability phase: ${phase}`);
    const list = (Array.isArray(tasks) ? tasks : []).map(normalizedTask);
    if (phase === "manual") {
      return {
        ids: list.map((task) => task.id),
        execute: () => this.execute(owner, phase, list),
      };
    }
    if (phase === "idle") {
      this.cancel(owner);
      const timer = setTimeout(() => {
        this.pendingIdle.delete(owner);
        void this.execute(owner, phase, list);
      }, this.idleDelayMs);
      timer.unref?.();
      this.pendingIdle.set(owner, timer);
      return { ids: list.map((task) => task.id), scheduled: true };
    }
    void this.execute(owner, phase, list);
    return { ids: list.map((task) => task.id), scheduled: true };
  }

  async execute(owner, phase, tasks) {
    const key = `${owner}:${phase}`;
    const execution = Promise.allSettled(tasks.map(async (task) => {
      try {
        return await task.run();
      } catch (error) {
        this.onError({ ownerId: owner, phase, capabilityId: task.id, error });
        throw error;
      }
    })).finally(() => {
      if (this.active.get(key) === execution) this.active.delete(key);
    });
    this.active.set(key, execution);
    return execution;
  }

  cancel(ownerId) {
    const owner = String(ownerId || "");
    const timer = this.pendingIdle.get(owner);
    if (timer) clearTimeout(timer);
    this.pendingIdle.delete(owner);
  }

  snapshot() {
    return {
      pendingIdleOwners: Array.from(this.pendingIdle.keys()),
      activeExecutions: Array.from(this.active.keys()),
    };
  }
}

module.exports = {
  PageCapabilityOrchestrator,
  VALID_PHASES,
};
