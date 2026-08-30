const { app, BrowserWindow, session } = require("electron");
const path = require("node:path");

app.setName("栖页");
app.setPath("userData", path.join(process.env.APPDATA, "栖页"));

app.whenReady().then(async () => {
  const partition = "persist:qiye-sites";
  const siteSession = session.fromPartition(partition, { cache: true });
  await siteSession.setProxy({ mode: "system" });
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: "deny" }));

  try {
    await win.loadURL("https://forum.naixi.net/k_misign-sign.html");
    await new Promise((resolve) => setTimeout(resolve, 1800));
    const result = await win.webContents.executeJavaScript(`(() => {
      const text = document.body?.innerText || "";
      const sanitize = (value) => String(value || "")
        .replace(/formhash=[^&'"\\s)]+/gi, "formhash=[redacted]")
        .replace(/[a-f0-9]{8,}/gi, "[token]")
        .slice(0, 240);
      const candidates = Array.from(document.querySelectorAll(
        'a, button, input[type="button"], input[type="submit"], [onclick]'
      )).filter((element) => {
        const haystack = [
          element.id,
          element.className,
          element.textContent,
          element.value,
          element.getAttribute("onclick"),
          element.getAttribute("href")
        ].join(" ");
        return /签到|qiandao|misign|JD_sign|sign/i.test(haystack);
      }).slice(0, 30).map((element) => {
        let href = "";
        try {
          if (element.href) {
            const parsed = new URL(element.href, location.href);
            href = parsed.pathname + "?" + Array.from(parsed.searchParams.keys()).join("&");
          }
        } catch {}
        return {
          tag: element.tagName,
          id: sanitize(element.id),
          className: sanitize(element.className),
          text: sanitize(element.textContent || element.value),
          href,
          onclick: sanitize(element.getAttribute("onclick"))
        };
      });
      return {
        url: location.origin + location.pathname,
        title: document.title,
        signed: /您今天已经签到|您今日已经签到|今日已签到|签到成功/.test(text),
        unsigned: /您今天还没有签到|今日尚未签到|还没有签到/.test(text),
        hasLoginLink: Array.from(document.querySelectorAll("a")).some((link) =>
          (link.textContent || "").trim() === "登录"
        ),
        hasFormhash: Boolean(document.querySelector('input[name="formhash"]')),
        candidates
      };
    })()`);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error?.stack || error);
    process.exitCode = 1;
  } finally {
    win.destroy();
    app.quit();
  }
});
