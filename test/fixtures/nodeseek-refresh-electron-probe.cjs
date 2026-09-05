const { app, BrowserWindow, WebContentsView, session } = require("electron");
const http = require("node:http");
const { standardChromiumUserAgent } = require("../../electron/browser/browser-user-agent.cjs");
const { NODESEEK_SITE_PARTITION, NODESEEK_ACCEPT_LANGUAGES } = require("../../electron/browser/nodeseek-session.cjs");

app.enableSandbox();
app.userAgentFallback = standardChromiumUserAgent(app.userAgentFallback);

app.whenReady().then(async () => {
  const requests = [];
  const server = http.createServer((request, response) => {
    if (request.url === "/sw.js") {
      response.writeHead(200, { "Content-Type": "application/javascript", "Cache-Control": "no-store" });
      response.end(`
        self.addEventListener("install", () => self.skipWaiting());
        self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
        self.addEventListener("fetch", (event) => {
          if (event.request.mode === "navigate") {
            event.respondWith(fetch(event.request.url, {
              cache: "no-store", credentials: "include", headers: { "x-fixture-worker": "yes" }
            }));
          }
        });
      `);
      return;
    }
    if (request.url !== "/") { response.writeHead(404); response.end(); return; }
    const userAgent = request.headers["user-agent"] || "";
    const statusCode = /Electron\/|site-nest-desktop|\?\?\//i.test(userAgent) ? 403 : 200;
    requests.push({
      userAgent, statusCode,
      acceptLanguage: request.headers["accept-language"],
      worker: request.headers["x-fixture-worker"] === "yes",
      hasLoginCookie: String(request.headers.cookie || "").includes("fixture-login=preserve-me"),
    });
    response.writeHead(statusCode, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    response.end(statusCode === 200 ? "<!doctype html><title>NodeSeek fixture</title><p>Ready</p>" : "403");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const url = `http://127.0.0.1:${server.address().port}/`;
  const siteSession = session.fromPartition(NODESEEK_SITE_PARTITION, { cache: true });
  siteSession.setUserAgent(standardChromiumUserAgent(siteSession.getUserAgent()), NODESEEK_ACCEPT_LANGUAGES);
  await siteSession.setProxy({ mode: "direct" });
  await siteSession.cookies.set({ url, name: "fixture-login", value: "preserve-me" });
  const owner = new BrowserWindow({ show: false, webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true } });
  const view = new WebContentsView({ webPreferences: {
    partition: NODESEEK_SITE_PARTITION, nodeIntegration: false, contextIsolation: true, sandbox: true,
  } });
  owner.contentView.addChildView(view);
  const navigationCodes = [];
  view.webContents.on("did-navigate", (_event, _url, statusCode) => navigationCodes.push(statusCode));
  try {
    await view.webContents.loadURL(url);
    const workerReady = await view.webContents.executeJavaScript(`(async () => {
      await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      if (!navigator.serviceWorker.controller) {
        await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
      }
      return Boolean(navigator.serviceWorker.controller);
    })()`);
    const viewId = view.webContents.id;
    for (let index = 0; index < 2; index += 1) {
      await new Promise((resolve, reject) => {
        const finished = () => { clearTimeout(timer); resolve(); };
        const timer = setTimeout(() => {
          view.webContents.removeListener("did-finish-load", finished);
          reject(new Error("Service Worker reload timed out"));
        }, 10000);
        view.webContents.once("did-finish-load", finished);
        view.webContents.reload();
      });
    }
    const cookies = await siteSession.cookies.get({ url, name: "fixture-login" });
    console.log(JSON.stringify({ nodeSeekBrowserIdentityProbe: {
      requests, navigationCodes, workerReady,
      sameView: view.webContents.id === viewId,
      loginPreserved: cookies.length === 1 && cookies[0].value === "preserve-me",
    } }));
  } finally {
    view.webContents.close();
    owner.destroy();
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
  app.exit(0);
}).catch((error) => { console.error(error); app.exit(1); });
