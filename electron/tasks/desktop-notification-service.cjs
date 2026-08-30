class DesktopNotificationService {
  constructor({ Notification, icon, onOpenTask, onComplete, onSnooze }) {
    this.Notification = Notification;
    this.icon = icon;
    this.onOpenTask = onOpenTask;
    this.onComplete = onComplete;
    this.onSnooze = onSnooze;
    this.active = new Map();
  }

  show(task, reminder, options = {}) {
    if (!this.Notification?.isSupported?.()) return { supported: false };
    const notification = new this.Notification({
      title: task.title,
      body: task.dueAt ? `任务提醒 · ${new Date(task.dueAt).toLocaleString()}` : "栖页本地任务提醒",
      icon: this.icon,
      silent: options.sound === false,
      urgency: ["urgent", "high"].includes(task.priority) ? "critical" : "normal",
      actions: [
        { type: "button", text: "标记完成" },
        { type: "button", text: "延后 5 分钟" },
        { type: "button", text: "延后 10 分钟" },
        { type: "button", text: "延后 30 分钟" },
      ],
      timeoutType: "default",
    });
    notification.on("click", () => this.onOpenTask?.(task.id));
    notification.on("action", (_event, index) => {
      if (index === 0) this.onComplete?.(task.id);
      if (index === 1) this.onSnooze?.(reminder.id, 5);
      if (index === 2) this.onSnooze?.(reminder.id, 10);
      if (index === 3) this.onSnooze?.(reminder.id, 30);
    });
    notification.once("close", () => this.active.delete(reminder.notificationKey));
    this.active.get(reminder.notificationKey)?.close?.();
    this.active.set(reminder.notificationKey, notification);
    notification.show();
    return { supported: true };
  }

  closeAll() {
    for (const notification of this.active.values()) notification.close?.();
    this.active.clear();
  }
}

module.exports = { DesktopNotificationService };
