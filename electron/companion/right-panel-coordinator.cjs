const PANEL_IDS = Object.freeze(["page-actions", "companion"]);

class RightPanelCoordinator {
  constructor() {
    this.activePanel = null;
  }

  open(panelId) {
    const id = String(panelId || "");
    if (!PANEL_IDS.includes(id)) throw new Error(`未知右侧面板：${id || "(empty)"}`);
    const closedPanel = this.activePanel && this.activePanel !== id ? this.activePanel : null;
    this.activePanel = id;
    return { activePanel: id, closedPanel };
  }

  close(panelId) {
    if (!panelId || this.activePanel === panelId) this.activePanel = null;
    return { activePanel: this.activePanel, closedPanel: panelId || null };
  }

  snapshot() {
    return { activePanel: this.activePanel };
  }
}

module.exports = { PANEL_IDS, RightPanelCoordinator };
