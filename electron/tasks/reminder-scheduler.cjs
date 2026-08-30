const MAX_TIMEOUT_MS = 2_147_000_000;

class TaskReminderScheduler {
  constructor({ listPending, fireReminder, now = () => Date.now(), setTimer = setTimeout, clearTimer = clearTimeout }) {
    this.listPending = listPending;
    this.fireReminder = fireReminder;
    this.now = now;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.timer = null;
    this.running = false;
    this.sequence = 0;
  }

  async reschedule() {
    const sequence = ++this.sequence;
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
    if (!this.running) return null;
    const reminders = await this.listPending();
    if (sequence !== this.sequence || !this.running) return null;
    const next = reminders
      .map((item) => ({ ...item, effectiveAt: Date.parse(item.snoozedUntil || item.remindAt) }))
      .filter((item) => Number.isFinite(item.effectiveAt))
      .sort((left, right) => left.effectiveAt - right.effectiveAt)[0];
    if (!next) return null;
    const delay = Math.max(0, Math.min(MAX_TIMEOUT_MS, next.effectiveAt - this.now()));
    this.timer = this.setTimer(() => void this.trigger(next.id), delay);
    this.timer?.unref?.();
    return next;
  }

  async trigger(reminderId) {
    if (!this.running) return;
    this.timer = null;
    try {
      await this.fireReminder(reminderId);
    } finally {
      await this.reschedule();
    }
  }

  async start() {
    this.running = true;
    return this.reschedule();
  }

  stop() {
    this.running = false;
    this.sequence += 1;
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
  }
}

module.exports = { MAX_TIMEOUT_MS, TaskReminderScheduler };
