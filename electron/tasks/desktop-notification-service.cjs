class DesktopNotificationService {
  constructor({
    Notification,
    icon,
    onOpenTask,
    onComplete,
    onSnooze,
    onOpenHabit,
    onCompleteHabit,
    onSnoozeHabit,
    onSkipHabit,
  }) {
    this.Notification = Notification;
    this.icon = icon;
    this.onOpenTask = onOpenTask;
    this.onComplete = onComplete;
    this.onSnooze = onSnooze;
    this.onOpenHabit = onOpenHabit;
    this.onCompleteHabit = onCompleteHabit;
    this.onSnoozeHabit = onSnoozeHabit;
    this.onSkipHabit = onSkipHabit;
    this.active = new Map();
  }

  showHabit(habit, reminder, options = {}) {
    if (!this.Notification?.isSupported?.()) return { supported: false };
    const notification = new this.Notification({
      title: habit.name,
      body: `长期目标提醒 · ${reminder.localDate}`,
      icon: this.icon,
      silent: options.sound === false,
      actions: [
        { type: "button", text: "今日完成" },
        { type: "button", text: "延后 10 分钟" },
        { type: "button", text: "今日跳过" },
      ],
      timeoutType: "default",
    });
    notification.on("click", () => this.onOpenHabit?.(habit.id, reminder.localDate));
    notification.on("action", (_event, index) => {
      if (index === 0) this.onCompleteHabit?.(habit.id, reminder.localDate);
      if (index === 1) this.onSnoozeHabit?.(reminder.id, 10);
      if (index === 2) this.onSkipHabit?.(habit.id, reminder.localDate);
    });
    notification.once("close", () => this.active.delete(reminder.notificationKey));
    this.active.get(reminder.notificationKey)?.close?.();
    this.active.set(reminder.notificationKey, notification);
    notification.show();
    return { supported: true };
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
