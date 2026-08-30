const controls = {
  back: document.getElementById("backButton"),
  forward: document.getElementById("forwardButton"),
  reload: document.getElementById("reloadButton"),
  reattach: document.getElementById("reattachButton"),
  addressForm: document.getElementById("addressForm"),
  address: document.getElementById("addressInput"),
};

let detachedState = null;
let reattaching = false;

function applyState(nextState) {
  detachedState = nextState || detachedState || {};
  const url = detachedState.currentURL || detachedState.url || "";
  const title = detachedState.title || "独立页面";
  const loading = Boolean(detachedState.loading);

  document.title = `${title} · 栖页`;
  document.body.classList.toggle("is-loading", loading);
  document.body.classList.toggle("is-attached", Boolean(detachedState.tabId));
  controls.back.disabled = !detachedState.canGoBack;
  controls.forward.disabled = !detachedState.canGoForward;
  controls.reload.title = loading ? "停止加载" : "刷新";
  controls.reload.setAttribute("aria-label", loading ? "停止加载" : "刷新");
  if (document.activeElement !== controls.address) controls.address.value = url;
}

async function runAction(action, value) {
  try {
    const nextState = await window.detachedTab?.action(action, value);
    if (nextState) applyState(nextState);
  } catch (error) {
    console.error(`独立页面操作失败：${action}`, error);
  }
}

controls.back.addEventListener("click", () => void runAction("back"));
controls.forward.addEventListener("click", () => void runAction("forward"));
controls.reload.addEventListener("click", () =>
  void runAction(detachedState?.loading ? "stop" : "reload"),
);
controls.addressForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = controls.address.value.trim();
  if (value) void runAction("navigate", value);
});

controls.reattach.addEventListener("click", async () => {
  if (reattaching) return;
  reattaching = true;
  controls.reattach.disabled = true;
  controls.reattach.querySelector("span").textContent = "正在合回";
  try {
    await window.detachedTab?.reattach();
  } catch (error) {
    console.error("页面合回失败", error);
    reattaching = false;
    controls.reattach.disabled = false;
    controls.reattach.querySelector("span").textContent = "合回空间";
  }
});

window.detachedTab?.onState((state) => applyState(state));
void window.detachedTab?.getState().then((state) => applyState(state));
