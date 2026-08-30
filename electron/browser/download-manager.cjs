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
    this.activeByWebContents = new Map();
  }

  attach(targetSession) {
    if (!targetSession || this.attachedSessions.has(targetSession)) return;
    this.attachedSessions.add(targetSession);
    targetSession.on("will-download", (event, item, webContents) => {
      if (event.defaultPrevented) return;
      const filename = sanitizeDownloadFilename(item.getFilename());
      const defaultPath = path.join(this.app.getPath("downloads"), filename);
      const webContentsId = Number(webContents?.id) || 0;
      if (webContentsId) this.activeByWebContents.set(webContentsId, (this.activeByWebContents.get(webContentsId) || 0) + 1);
      if (item.canResume()) item.pause();
      void this.chooseDestination(item, filename, defaultPath, webContentsId).catch(() => {
        this.onStatus?.({ status: "failed", filename });
      });
    });
  }

  hasActiveDownload(webContentsId) {
    return (this.activeByWebContents.get(Number(webContentsId)) || 0) > 0;
  }

  releaseDownload(webContentsId) {
    if (!webContentsId) return;
    const remaining = (this.activeByWebContents.get(webContentsId) || 1) - 1;
    if (remaining > 0) this.activeByWebContents.set(webContentsId, remaining);
    else this.activeByWebContents.delete(webContentsId);
  }

  async chooseDestination(item, filename, defaultPath, webContentsId = 0) {
    const owner = this.getOwnerWindow?.();
    const options = {
      title: "保存下载文件",
      defaultPath,
      buttonLabel: "保存",
      properties: ["showOverwriteConfirmation", "createDirectory"],
    };
    let result;
    try {
      result = owner
        ? await this.dialog.showSaveDialog(owner, options)
        : await this.dialog.showSaveDialog(options);
    } catch (error) {
      this.releaseDownload(webContentsId);
      item.cancel();
      throw error;
    }
    if (result.canceled || !result.filePath) {
      item.cancel();
      this.releaseDownload(webContentsId);
      this.onStatus?.({ status: "cancelled", filename });
      return;
    }
    item.setSavePath(result.filePath);
    item.once("done", (_event, state) => {
      this.releaseDownload(webContentsId);
      this.onStatus?.({
        status: state === "completed" ? "completed" : "failed",
        filename,
      });
    });
    if (item.isPaused()) item.resume();
  }
}

module.exports = { DownloadManager, sanitizeDownloadFilename };
