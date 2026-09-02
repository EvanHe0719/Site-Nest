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
    onCompanionOpen,
    onCompanionAcknowledge,
    onCompanionSnooze,
    onCompanionDismissToday,
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
    this.onCompanionOpen = onCompanionOpen;
    this.onCompanionAcknowledge = onCompanionAcknowledge;
    this.onCompanionSnooze = onCompanionSnooze;
    this.onCompanionDismissToday = onCompanionDismissToday;
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
      body: task.startAt || task.dueAt ? `日程提醒 · ${new Date(task.startAt || task.dueAt).toLocaleString()}` : "栖页本地日程提醒",
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

  showCompanion(reminder, options = {}) {
    if (!this.Notification?.isSupported?.()) return { supported: false };
    const notificationKey = `companion:${reminder.kind}:${reminder.dueAt}`;
    const actions = reminder.kind === "water"
      ? [{ type: "button", text: "已喝水" }, { type: "button", text: "延后 10 分钟" }, { type: "button", text: "今天不再提醒" }]
      : [{ type: "button", text: "知道了" }, { type: "button", text: "延后 10 分钟" }, { type: "button", text: "今天不再提醒" }];
    const notification = new this.Notification({ title: "小序", body: String(reminder.message || "休息一下吧").slice(0, 300), icon: this.icon, silent: options.sound === false, actions, timeoutType: "default" });
    notification.on("click", () => this.onCompanionOpen?.());
    notification.on("action", (_event, index) => {
      if (index === 0) this.onCompanionAcknowledge?.(reminder.kind);
      if (index === 1) this.onCompanionSnooze?.(reminder.kind, 10);
      if (index === 2) this.onCompanionDismissToday?.();
    });
    notification.once("close", () => this.active.delete(notificationKey));
    this.active.get(notificationKey)?.close?.();
    this.active.set(notificationKey, notification);
    notification.show();
    return { supported: true };
  }

  closeAll() {
    for (const notification of this.active.values()) notification.close?.();
    this.active.clear();
  }
}

module.exports = { DesktopNotificationService };
