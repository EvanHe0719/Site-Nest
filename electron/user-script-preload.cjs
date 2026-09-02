const { contextBridge, ipcRenderer } = require("electron");

const USER_SCRIPT_WORLD_ID = 1001;
const COMPANION_WIDGET_WORLD_ID = 1002;

contextBridge.exposeInIsolatedWorld(USER_SCRIPT_WORLD_ID, "qiyeUserScriptHost", {
  invoke: (token, operation, payload) => ipcRenderer.invoke("userscripts:runtime", {
    token,
    operation,
    payload,
  }),
});

contextBridge.exposeInIsolatedWorld(COMPANION_WIDGET_WORLD_ID, "qiyeCompanionHost", {
  invoke: (action, payload = {}) => ipcRenderer.invoke("companion:page-widget-action", {
    action,
    payload,
  }),
});
