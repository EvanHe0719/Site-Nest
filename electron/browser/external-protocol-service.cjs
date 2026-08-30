const BLOCKED_PROTOCOLS = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "about:",
  "chrome:",
  "devtools:",
]);
const TRUSTED_PROTOCOLS = new Set(["mailto:", "tel:"]);

class ExternalProtocolService {
  constructor({ shell, dialog }) {
    this.shell = shell;
    this.dialog = dialog;
  }

  classify(rawUrl) {
    let parsed;
    try {
      parsed = new URL(String(rawUrl || ""));
    } catch {
      return { kind: "invalid", allowed: false, protocol: "" };
    }
    const protocol = parsed.protocol.toLowerCase();
    if (['http:', 'https:'].includes(protocol)) {
      return { kind: "web", allowed: false, protocol };
    }
    if (BLOCKED_PROTOCOLS.has(protocol)) {
      return { kind: "blocked", allowed: false, protocol };
    }
    if (TRUSTED_PROTOCOLS.has(protocol)) {
      return { kind: "trusted", allowed: true, protocol };
    }
    return { kind: "ask", allowed: false, protocol };
  }

  async open(rawUrl, ownerWindow) {
    const classification = this.classify(rawUrl);
    if (classification.kind === "trusted") {
      await this.shell.openExternal(String(rawUrl));
      return { opened: true, prompted: false, protocol: classification.protocol };
    }
    if (classification.kind !== "ask") {
      return { opened: false, prompted: false, protocol: classification.protocol };
    }
    const result = await this.dialog.showMessageBox(ownerWindow || undefined, {
      type: "question",
      title: "打开外部应用",
      message: `网页请求打开 ${classification.protocol} 外部应用`,
      detail: "只有确认信任当前网页和目标应用时才继续。",
      buttons: ["取消", "允许打开"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (result.response !== 1) {
      return { opened: false, prompted: true, protocol: classification.protocol };
    }
    await this.shell.openExternal(String(rawUrl));
    return { opened: true, prompted: true, protocol: classification.protocol };
  }
}

module.exports = {
  BLOCKED_PROTOCOLS,
  ExternalProtocolService,
  TRUSTED_PROTOCOLS,
};
