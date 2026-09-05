// Runs only in the isolated NodeSeek browser session. Never guesses private endpoints.
function nodeSeekPageAction(click = false) {
  const text = document.body?.innerText || "";
  const visible = (element) => Boolean(element.getClientRects().length) && getComputedStyle(element).visibility !== "hidden";
  if (/^\s*403\s*$/.test(text) || /just a moment|verify you are human|验证您是人类|安全验证|验证码/i.test(text) || document.querySelector('iframe[src*="challenges.cloudflare.com"]')) {
    return { status: "needs-action", blocked: true, message: "NodeSeek 要求安全验证或返回 403，请打开页面处理后再试" };
  }
  // Personal reward banner, not leaderboard entries or other members' check-in text.
  if (/今日签到获得鸡腿\s*\d+(?:\.\d+)?\s*个/.test(text)) {
    return { status: "success", message: "NodeSeek 页面已确认今日签到完成" };
  }
  const controls = Array.from(document.querySelectorAll("button, a, [role=button], input[type=submit]"));
  if (/请先登录|登录后.*签到/.test(text) || controls.some((element) => visible(element) && /^(登录|登入|Sign in|Log in)$/i.test((element.textContent || element.value || "").trim()))) {
    return { status: "needs-login", message: "请先在 NodeSeek 专用会话中登录" };
  }
  const button = controls.find((element) => {
    if (!visible(element) || element.disabled || element.getAttribute("aria-disabled") === "true") return false;
    const label = (element.textContent || element.value || element.getAttribute("title") || element.getAttribute("aria-label") || "").trim();
    if (!/^(签到|立即签到|每日签到|点击签到|签到领取鸡腿)$/.test(label)) return false;
    if (element.href) {
      const url = new URL(element.href, location.href);
      if (url.origin !== location.origin || !/^https?:$/.test(url.protocol)) return false;
    }
    return true;
  });
  if (button && click) button.click();
  return { status: "needs-action", clicked: Boolean(button && click), hasButton: Boolean(button), message: button ? "已发现页面签到按钮，等待站点确认" : "未找到可确认的页面签到按钮，请打开页面检查" };
}

async function runNodeSeekCheckin({ BrowserWindow, siteSession, onWindow = () => {} }) {
  const win = new BrowserWindow({ width: 1100, height: 760, show: false, skipTaskbar: true, webPreferences: { session: siteSession, nodeIntegration: false, contextIsolation: true, sandbox: true } });
  onWindow(win);
  const contents = win.webContents;
  let timer;
  const allowed = (value) => {
    try { return new URL(value).origin === "https://www.nodeseek.com"; } catch { return false; }
  };
  contents.setWindowOpenHandler(() => ({ action: "deny" }));
  for (const eventName of ["will-navigate", "will-redirect"]) contents.on(eventName, (event, url) => { if (!allowed(url)) event.preventDefault(); });
  const inspect = (click = false) => {
    if (!allowed(contents.getURL())) throw new Error("NodeSeek 页面离开预期站点，已停止签到");
    return contents.executeJavaScript(`(${nodeSeekPageAction.toString()})(${click})`);
  };
  try {
    return await Promise.race([
      (async () => {
        await win.loadURL("https://www.nodeseek.com/board");
        await new Promise((resolve) => setTimeout(resolve, 1200));
        let result = await inspect();
        if (result.status === "success" || result.status === "needs-login" || !result.hasButton) return result;
        result = await inspect(true);
        for (let attempt = 0; attempt < 10 && result.clicked; attempt += 1) {
          await new Promise((resolve) => setTimeout(resolve, 700));
          const current = await inspect();
          if (current.status === "success" || current.status === "needs-login" || current.blocked) return current;
        }
        return { status: "needs-action", message: "已点击页面签到按钮，但未确认成功，请打开页面检查" };
      })(),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("NodeSeek 签到检查超时")), 30_000); }),
    ]);
  } finally {
    clearTimeout(timer);
    if (!win.isDestroyed()) win.destroy();
    onWindow(null);
  }
}

module.exports = { nodeSeekPageAction, runNodeSeekCheckin };
