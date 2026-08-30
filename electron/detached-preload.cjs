const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("detachedTab", {
  getState: () => ipcRenderer.invoke("detached:get-state"),
  action: (action, value) =>
    ipcRenderer.invoke("detached:action", { action, value }),
  reattach: () => ipcRenderer.invoke("detached:reattach"),
  closeTab: () => ipcRenderer.invoke("detached:close-tab"),
  onState: (callback) => {
    if (typeof callback !== "function") return () => undefined;
    const listener = (_event, state) => callback(state);
    ipcRenderer.on("detached:state", listener);
    return () => ipcRenderer.removeListener("detached:state", listener);
  },
});
