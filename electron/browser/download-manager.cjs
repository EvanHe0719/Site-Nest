const path = require("node:path");

function sanitizeDownloadFilename(value) {
  const cleaned = String(value || "download")
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_")
    .replace(/[. ]+$/g, "")
    .slice(0, 180);
  return cleaned || "download";
}

class DownloadManager {
  constructor({ app, dialog, getOwnerWindow, onStatus }) {
    this.app = app;
    this.dialog = dialog;
    this.getOwnerWindow = getOwnerWindow;
    this.onStatus = onStatus;
    this.attachedSessions = new WeakSet();
  }

  attach(targetSession) {
    if (!targetSession || this.attachedSessions.has(targetSession)) return;
    this.attachedSessions.add(targetSession);
    targetSession.on("will-download", (_event, item) => {
      const filename = sanitizeDownloadFilename(item.getFilename());
      const defaultPath = path.join(this.app.getPath("downloads"), filename);
      if (item.canResume()) item.pause();
      void this.chooseDestination(item, filename, defaultPath);
    });
  }

  async chooseDestination(item, filename, defaultPath) {
    const owner = this.getOwnerWindow?.();
    const options = {
      title: "保存下载文件",
      defaultPath,
      buttonLabel: "保存",
      properties: ["showOverwriteConfirmation", "createDirectory"],
    };
    const result = owner
      ? await this.dialog.showSaveDialog(owner, options)
      : await this.dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) {
      item.cancel();
      this.onStatus?.({ status: "cancelled", filename });
      return;
    }
    item.setSavePath(result.filePath);
    item.once("done", (_event, state) => {
      this.onStatus?.({
        status: state === "completed" ? "completed" : "failed",
        filename,
      });
    });
    if (item.isPaused()) item.resume();
  }
}

module.exports = { DownloadManager, sanitizeDownloadFilename };
