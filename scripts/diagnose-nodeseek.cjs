const { app, BrowserWindow, session } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");
const artifactDirectory = path.join(projectRoot, "test-artifacts", "nodeseek-diagnostic");
const targetUrl = process.env.NODESEEK_TARGET || "https://www.nodeseek.com/categories/info";
app.setPath(
  "userData",
  process.env.NODESEEK_TEST_USER_DATA || path.join(artifactDirectory, "user-data"),
);

function safeUrl(rawUrl) {
  try {
    const value = new URL(rawUrl);
    return `${value.origin}${value.pathname}`;
  } catch {
    return String(rawUrl || "").slice(0, 200);
  }
}

app.whenReady().then(async () => {
  await fs.mkdir(artifactDirectory, { recursive: true });
  const diagnosticSession = session.fromPartition("persist:nodeseek-diagnostic", {
    cache: false,
  });
  diagnosticSession.setUserAgent(
    diagnosticSession
      .getUserAgent()
      .replace(/\sElectron\/[^\s]+/g, "")
      .replace(/\ssite-nest-desktop\/[^\s]+/g, ""),
  );
  await diagnosticSession.setProxy({ mode: "system" });

  const failures = [];
  diagnosticSession.webRequest.onErrorOccurred((details) => {
    failures.push({
      kind: "network",
      url: safeUrl(details.url),
      error: details.error,
      resourceType: details.resourceType,
    });
  });
  diagnosticSession.webRequest.onCompleted((details) => {
    if (details.statusCode < 400) return;
    failures.push({
      kind: "http",
      url: safeUrl(details.url),
      statusCode: details.statusCode,
      resourceType: details.resourceType,
    });
  });

  const window = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      partition: "persist:nodeseek-diagnostic",
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  const consoleErrors = [];
  window.webContents.on("console-message", (_event, details) => {
    if (details.level !== "error") return;
    consoleErrors.push(String(details.message || "").slice(0, 500));
  });

  let loadError = null;
  try {
    await window.loadURL(targetUrl);
  } catch (error) {
    loadError = error?.message || String(error);
  }
  await new Promise((resolve) => setTimeout(resolve, 15000));

  const page = await window.webContents
    .executeJavaScript(`({
      title: document.title,
      body: document.body?.innerText?.slice(0, 800) || "",
      url: location.href,
      accountLinks: Array.from(document.querySelectorAll("a"))
        .filter((link) => /登录|注册|sign|log.?in/i.test(link.textContent || ""))
        .slice(0, 10)
        .map((link) => ({ text: link.textContent.trim(), href: link.href }))
    })`)
    .catch((error) => ({ error: error?.message || String(error) }));
  const proxy = await diagnosticSession.resolveProxy(
    targetUrl,
  );
  const image = await window.webContents.capturePage();
  await fs.writeFile(path.join(artifactDirectory, "page.png"), image.toPNG());
  const report = {
    proxy,
    loadError,
    page,
    failures,
    consoleErrors,
  };
  await fs.writeFile(
    path.join(artifactDirectory, "report.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );
  console.log(JSON.stringify(report, null, 2));
  app.exit(0);
});
