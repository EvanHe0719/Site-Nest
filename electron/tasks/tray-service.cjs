class TrayService {
  constructor({ Tray, Menu, icon, onOpen, onToday, onAdd, onPause, onQuit }) {
    this.Tray = Tray;
    this.Menu = Menu;
    this.icon = icon;
    this.onOpen = onOpen;
    this.onToday = onToday;
    this.onAdd = onAdd;
    this.onPause = onPause;
    this.onQuit = onQuit;
    this.tray = null;
  }

  ensure({ paused = false } = {}) {
    if (!this.tray) {
      this.tray = new this.Tray(this.icon);
      this.tray.setToolTip("栖页 · 本地网页工作台");
      this.tray.on("double-click", () => this.onOpen?.());
    }
    this.tray.setContextMenu(this.Menu.buildFromTemplate([
      { label: "打开栖页", click: () => this.onOpen?.() },
      { label: "今天的任务", click: () => this.onToday?.() },
      { label: "添加任务", click: () => this.onAdd?.() },
      { type: "separator" },
      { label: paused ? "恢复提醒" : "暂停提醒 1 小时", click: () => this.onPause?.(!paused) },
      { type: "separator" },
      { label: "退出", click: () => this.onQuit?.() },
    ]));
    return this.tray;
  }

  destroy() {
    this.tray?.destroy?.();
    this.tray = null;
  }
}

module.exports = { TrayService };
