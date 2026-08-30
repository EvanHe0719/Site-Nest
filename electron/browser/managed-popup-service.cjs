function sanitizeNavigationUrl(rawUrl) {
  try {
    const url = new URL(String(rawUrl || ""));
    if (!["http:", "https:"].includes(url.protocol)) return "";
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch {
    return "";
  }
}

class ManagedPopupService {
  constructor({
    BrowserWindow,
    Menu,
    policyService,
    externalProtocolService,
    browserPartitionForProfile,
    openTab,
    openExternal,
    askToOpen,
    onBlocked,
    handleInternalAction,
  }) {
    this.BrowserWindow = BrowserWindow;
    this.Menu = Menu;
    this.policyService = policyService;
    this.externalProtocolService = externalProtocolService;
    this.browserPartitionForProfile = browserPartitionForProfile;
    this.openTab = openTab;
    this.openExternal = openExternal;
    this.askToOpen = askToOpen;
    this.onBlocked = onBlocked;
    this.handleInternalAction = handleInternalAction;
    this.windows = new Map();
    this.navigationAudits = [];
  }

  secureWindowOptions(context) {
    return {
      width: 960,
      height: 760,
      minWidth: 520,
      minHeight: 520,
      autoHideMenuBar: true,
      backgroundColor: "#f8f7f4",
      webPreferences: {
        partition: this.browserPartitionForProfile(context.browserProfileId),
        nodeIntegration: false,
        contextIsolation: true,
        sandbox: true,
        spellcheck: false,
        safeDialogs: true,
      },
    };
  }

  attachToWebContents(webContents, context, ownerWindow) {
    if (!webContents || webContents.isDestroyed()) return;

    webContents.setWindowOpenHandler((details) => {
      if (/^qiye-action:\/\//i.test(String(details.url || ""))) {
        setImmediate(() => void this.handleInternalAction?.(details, context, webContents));
        return { action: "deny" };
      }
      const decision = this.policyService.classify(details, webContents.getURL());
      if (decision.kind === "tab" || decision.kind === "background-tab") {
        setImmediate(() => void this.openTab(details.url, {
          background: decision.kind === "background-tab",
          context,
        }));
        return { action: "deny" };
      }
      if (decision.kind === "external") {
        setImmediate(() => void this.openExternal(details.url));
        return { action: "deny" };
      }
      if (decision.kind === "external-protocol") {
        setImmediate(() => void this.externalProtocolService.open(details.url, ownerWindow));
        return { action: "deny" };
      }
      if (decision.kind === "ask") {
        setImmediate(() => void this.askToOpen(details, context, ownerWindow));
        return { action: "deny" };
      }
      if (decision.kind === "block") {
        setImmediate(() => this.onBlocked?.(decision, context));
        return { action: "deny" };
      }
      if (decision.kind === "popup" && decision.preserveOpener === false && !details.postBody) {
        setImmediate(() => void this.openTab(details.url, { context, source: "popup-policy" }));
        return { action: "deny" };
      }
      return {
        action: "allow",
        overrideBrowserWindowOptions: this.secureWindowOptions(context),
      };
    });

    webContents.on("did-create-window", (childWindow, details) => {
      this.manageWindow(childWindow, context, details);
    });
  }

  manageWindow(childWindow, context, details = {}) {
    if (!childWindow || childWindow.isDestroyed()) return;
    const id = childWindow.webContents.id;
    const decision = this.policyService.classify(details, details.referrer?.url || "");
    const navigationChain = [];
    const recordNavigation = (rawUrl) => {
      const sanitized = sanitizeNavigationUrl(rawUrl);
      if (sanitized && navigationChain.at(-1) !== sanitized && navigationChain.length < 20) navigationChain.push(sanitized);
    };
    recordNavigation(details.url);
    this.windows.set(id, { window: childWindow, context, details, decision, navigationChain });
    const moveToTab = async () => {
      const url = childWindow.webContents.getURL();
      if (!/^https?:\/\//i.test(url)) return;
      await this.openTab(url, { context, source: "managed-popup" });
      if (!childWindow.isDestroyed()) childWindow.close();
    };
    const popupMenu = this.Menu.buildFromTemplate([
      { label: "转为栖页页签", click: () => void moveToTab() },
      { label: "在外部浏览器打开", click: () => void this.openExternal(childWindow.webContents.getURL()) },
      { type: "separator" },
      { label: "重新加载", role: "reload" },
      { label: "关闭", role: "close" },
    ]);
    childWindow.setMenu(popupMenu);
    childWindow.webContents.on("context-menu", (_event, params) => {
      const items = [];
      if (params.isEditable) {
        items.push(
          { label: "剪切", role: "cut" },
          { label: "复制", role: "copy" },
          { label: "粘贴", role: "paste" },
          { type: "separator" },
        );
      }
      items.push({ label: "转为栖页页签", click: () => void moveToTab() });
      this.Menu.buildFromTemplate(items).popup({ window: childWindow });
    });
    childWindow.webContents.on("will-navigate", (event, url) => {
      let protocol = "";
      try {
        protocol = new URL(url).protocol;
      } catch {
        event.preventDefault();
        return;
      }
      if (['http:', 'https:'].includes(protocol)) {
        const allowedRedirectOrigins = decision.policy?.allowedRedirectOrigins || [];
        if (!allowedRedirectOrigins.length) return;
        let initialOrigin = "";
        let nextOrigin = "";
        try {
          initialOrigin = new URL(details.url).origin;
          nextOrigin = new URL(url).origin;
        } catch {
          event.preventDefault();
          return;
        }
        if (nextOrigin === initialOrigin || allowedRedirectOrigins.includes(nextOrigin)) return;
        event.preventDefault();
        this.onBlocked?.({ reason: "redirect-origin-not-allowed" }, context);
        return;
      }
      event.preventDefault();
      void this.externalProtocolService.open(url, childWindow);
    });
    childWindow.webContents.on("did-navigate", (_event, url) => recordNavigation(url));
    childWindow.webContents.on("did-redirect-navigation", (_event, url) => recordNavigation(url));
    this.attachToWebContents(childWindow.webContents, context, childWindow);
    childWindow.once("closed", () => {
      this.navigationAudits.push({
        webContentsId: id,
        workspaceId: context.workspaceId,
        browserProfileId: context.browserProfileId,
        navigationChain: [...navigationChain],
        finishedAt: new Date().toISOString(),
      });
      this.navigationAudits = this.navigationAudits.slice(-50);
      this.windows.delete(id);
    });
  }

  recentNavigationAudits() {
    return this.navigationAudits.map((audit) => ({ ...audit, navigationChain: [...audit.navigationChain] }));
  }

  closeAll() {
    for (const entry of this.windows.values()) {
      if (!entry.window.isDestroyed()) entry.window.destroy();
    }
    this.windows.clear();
  }
}

module.exports = { ManagedPopupService, sanitizeNavigationUrl };
