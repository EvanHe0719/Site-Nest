const { contextBridge, ipcRenderer } = require("electron");

const USER_SCRIPT_WORLD_ID = 1001;

contextBridge.exposeInIsolatedWorld(USER_SCRIPT_WORLD_ID, "qiyeUserScriptHost", {
  invoke: (token, operation, payload) => ipcRenderer.invoke("userscripts:runtime", {
    token,
    operation,
    payload,
  }),
});
