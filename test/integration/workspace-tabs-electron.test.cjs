const assert = require("node:assert/strict");
const { spawn } = require("node:child_process");
const fsp = require("node:fs/promises");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const projectRoot = path.resolve(__dirname, "..", "..");
const electronPath = require("electron");

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server.address());
    });
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

function runElectronProbe({ userData, baseURL, route = "workspace-tabs-probe" }) {
  const capturePath = path.join(userData, `${route}.png`);
  return new Promise((resolve, reject) => {
    const child = spawn(electronPath, [projectRoot], {
      cwd: projectRoot,
      windowsHide: true,
      env: {
        ...process.env,
        ELECTRON_DISABLE_SECURITY_WARNINGS: "true",
        QIYE_TEST_USER_DATA: userData,
        QIYE_CAPTURE_PATH: capturePath,
        QIYE_CAPTURE_ROUTE: route,
        QIYE_TAB_PROBE_BASE_URL: baseURL,
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Electron tab probe timed out\n${stdout}\n${stderr}`));
    }, 45000);
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.once("exit", (code) => {
      clearTimeout(timer);
      if (code !== 0) {
        reject(new Error(`Electron tab probe exited with ${code}\n${stdout}\n${stderr}`));
        return;
      }
      resolve({ stdout, stderr, capturePath });
    });
  });
}

function parseProbe(stdout, marker = "workspaceTabsProbe") {
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.trim().startsWith("{")) continue;
    try {
      const parsed = JSON.parse(line);
      if (parsed[marker]) return parsed[marker];
    } catch {
      // Chromium may write unrelated non-JSON diagnostics to stdout.
    }
  }
  throw new Error(`${marker} marker missing:\n${stdout}`);
}

test(
  "managed login windows preserve opener, POST, redirects, shared Cookie and the persistent partition",
  { timeout: 60000 },
  async (t) => {
    const requests = [];
    const server = http.createServer((request, response) => {
      requests.push({ method: request.method, url: request.url });
      if (request.url === "/popup-oauth") {
        response.writeHead(302, { location: "/popup-oauth-redirect" });
        response.end();
        return;
      }
      if (request.url === "/popup-oauth-redirect") {
        response.writeHead(302, { location: "/popup-oauth-callback" });
        response.end();
        return;
      }
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      if (request.url === "/popup-origin") {
        response.end("<!doctype html><title>Popup origin</title><main>opener</main>");
        return;
      }
      const kind = request.url === "/popup-post"
        ? "post"
        : request.url === "/popup-oauth-callback"
          ? "oauth"
          : "login";
      response.end(`<!doctype html><title>${kind}</title><script>
        window.opener.postMessage({
          kind: ${JSON.stringify(kind)},
          method: ${JSON.stringify(request.method)},
          cookie: document.cookie,
          path: location.pathname
        }, location.origin);
        setTimeout(() => window.close(), 20);
      </script>`);
    });
    const address = await listen(server);
    t.after(() => closeServer(server));
    const baseURL = `http://127.0.0.1:${address.port}/`;
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-popup-electron-"));
    t.after(() => fsp.rm(userData, { recursive: true, force: true }));

    const result = await runElectronProbe({
      userData,
      baseURL,
      route: "browser-popup-probe",
    });
    assert.match(result.stdout, /browserPopupProbe/, result.stderr || result.stdout);
    const probe = parseProbe(result.stdout, "browserPopupProbe");
    const byKind = Object.fromEntries(probe.messages.map((item) => [item.kind, item]));

    assert.equal(byKind.login.cookie.includes("shared_session=qiye"), true);
    assert.equal(byKind.post.method, "POST");
    assert.equal(byKind.oauth.path, "/popup-oauth-callback");
    assert.equal(probe.sharedCookie, "qiye");
    assert.equal(probe.partition, "persist:qiye-sites");
    assert.equal(probe.remainingManagedWindows, 0);
    assert.equal(probe.openerUrl, new URL("/popup-origin", baseURL).toString());
    assert.equal(probe.tabCount, 1);
    assert.ok(requests.some((item) => item.method === "POST" && item.url === "/popup-post"));
    assert.ok(requests.some((item) => item.url === "/popup-oauth-redirect"));
    assert.ok(requests.some((item) => item.url === "/popup-oauth-callback"));
    assert.ok((await fsp.stat(result.capturePath)).size > 1000);
  },
);

test(
  "real Electron keeps the opener tab and one WebContentsView identity through detach and reattach",
  { timeout: 60000 },
  async (t) => {
    const requests = [];
    const server = http.createServer((request, response) => {
      requests.push(request.url);
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(`<!doctype html><title>${request.url}</title><p>${request.url}</p>`);
    });
    const address = await listen(server);
    t.after(() => closeServer(server));
    const baseURL = `http://127.0.0.1:${address.port}/`;
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-tabs-electron-"));
    t.after(() => fsp.rm(userData, { recursive: true, force: true }));

    const result = await runElectronProbe({ userData, baseURL });
    const probe = parseProbe(result.stdout);
    const originURL = new URL("/origin", baseURL).toString();
    const childURL = new URL("/child", baseURL).toString();

    assert.equal(probe.tabCount, 2);
    assert.equal(probe.original.url, originURL);
    assert.equal(probe.originalAfter.url, originURL);
    assert.equal(probe.originalAfter.webContentsId, probe.original.webContentsId);
    assert.notEqual(probe.popup.tabId, probe.original.tabId);
    assert.notEqual(probe.popup.webContentsId, probe.original.webContentsId);
    assert.equal(probe.popup.url, childURL);
    assert.equal(probe.popup.workspaceId, "personal");
    assert.equal(probe.activeTabId, probe.popup.tabId);

    assert.equal(probe.detached.tabId, probe.popup.tabId);
    assert.equal(probe.detached.owner, "detached");
    assert.ok(Number.isInteger(probe.detached.windowId));
    assert.equal(probe.detached.webContentsId, probe.popup.webContentsId);
    assert.equal(probe.detached.stateWebContentsId, probe.popup.webContentsId);
    assert.equal(probe.reattached.tabId, probe.popup.tabId);
    assert.equal(probe.reattached.owner, "main");
    assert.equal(probe.reattached.webContentsId, probe.popup.webContentsId);
    assert.equal(probe.reattached.stateWebContentsId, probe.popup.webContentsId);

    assert.ok(requests.includes("/origin"));
    assert.ok(requests.includes("/child"));
    assert.ok((await fsp.stat(result.capturePath)).size > 1000);

    const persisted = JSON.parse(
      await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"),
    );
    const tabs = persisted.workspaceBrowserStates.personal.tabs;
    assert.equal(tabs.length, 2);
    assert.ok(tabs.some((tab) => tab.url === originURL));
    assert.ok(tabs.some((tab) => tab.url === childURL));
    for (const tab of tabs) {
      assert.equal(Object.hasOwn(tab, "detached"), false);
      assert.equal(Object.hasOwn(tab, "loading"), false);
      assert.equal(Object.hasOwn(tab, "active"), false);
    }
  },
);

test(
  "real Electron reconciles anonymous tabs that later converge on one URL and keeps the active tab",
  { timeout: 60000 },
  async (t) => {
    const server = http.createServer((request, response) => {
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      });
      response.end(`<!doctype html><title>${request.url}</title><p>${request.url}</p>`);
    });
    const address = await listen(server);
    t.after(() => closeServer(server));
    const baseURL = `http://127.0.0.1:${address.port}/`;
    const originURL = new URL("/origin", baseURL).toString();
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-tabs-converge-"));
    t.after(() => fsp.rm(userData, { recursive: true, force: true }));

    const result = await runElectronProbe({
      userData,
      baseURL,
      route: "workspace-tabs-convergence-probe",
    });
    const probe = parseProbe(result.stdout, "workspaceTabsConvergenceProbe");

    assert.equal(probe.before.tabCount, 2);
    assert.notEqual(probe.before.originalTabId, probe.before.popupTabId);
    assert.equal(probe.converged.tabCount, 1);
    assert.equal(probe.converged.activeTabId, probe.before.popupTabId);
    assert.equal(probe.converged.keptTabId, probe.before.popupTabId);
    assert.ok(Number.isInteger(probe.converged.keptWebContentsId));
    assert.equal(probe.converged.url, originURL);
    assert.ok((await fsp.stat(result.capturePath)).size > 1000);

    const persisted = JSON.parse(
      await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"),
    );
    const snapshot = persisted.workspaceBrowserStates.personal;
    assert.equal(snapshot.tabs.length, 1);
    assert.equal(snapshot.activeTabId, probe.before.popupTabId);
    assert.equal(snapshot.tabs[0].tabId, probe.before.popupTabId);
    assert.equal(snapshot.tabs[0].url, originURL);
  },
);

test(
  "real Electron explicitly duplicates tabs and sites while ordinary opens still deduplicate",
  { timeout: 60000 },
  async (t) => {
    const requests = [];
    const server = http.createServer((request, response) => {
      requests.push(request.url);
      response.writeHead(200, {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
        "set-cookie": "qiye-duplicate-probe=shared; Path=/; SameSite=Lax",
      });
      response.end(`<!doctype html><title>${request.url}</title><p>${request.url}</p>`);
    });
    const address = await listen(server);
    t.after(() => closeServer(server));
    const baseURL = `http://127.0.0.1:${address.port}/`;
    const originURL = new URL("/duplicate-origin", baseURL).toString();
    const siteURL = new URL("/duplicate-site", baseURL).toString();
    const userData = await fsp.mkdtemp(path.join(os.tmpdir(), "qiye-tabs-duplicate-"));
    t.after(() => fsp.rm(userData, { recursive: true, force: true }));

    const result = await runElectronProbe({
      userData,
      baseURL,
      route: "workspace-tabs-duplicate-probe",
    });
    const probe = parseProbe(result.stdout, "workspaceTabsDuplicateProbe");

    assert.equal(probe.original.url, originURL);
    assert.equal(probe.browserCopy.url, originURL);
    assert.notEqual(probe.browserCopy.tabId, probe.original.tabId);
    assert.notEqual(probe.browserCopy.webContentsId, probe.original.webContentsId);
    assert.equal(probe.browserCopy.allowDuplicate, true);
    assert.equal(probe.browserCopy.sameSession, true);
    assert.equal(probe.countAfterBrowserCopy, 2);
    assert.equal(probe.browserOrdinaryOpen.tabCount, 2);
    assert.equal(probe.browserOrdinaryOpen.activeTabId, probe.original.tabId);

    assert.equal(probe.siteCopy.url, siteURL);
    assert.equal(probe.siteCopy.siteId, "workspace-tabs-duplicate-probe-site");
    assert.notEqual(probe.siteCopy.tabId, probe.siteCopy.originalTabId);
    assert.notEqual(
      probe.siteCopy.webContentsId,
      probe.siteCopy.originalWebContentsId,
    );
    assert.equal(probe.siteCopy.allowDuplicate, true);
    assert.equal(probe.siteCopy.sameSession, true);
    assert.equal(probe.countAfterSiteCopy, 4);
    assert.equal(probe.siteOrdinaryOpen.tabCount, 4);
    assert.equal(probe.siteOrdinaryOpen.activeTabId, probe.siteCopy.originalTabId);
    assert.ok(requests.filter((url) => url === "/duplicate-origin").length >= 2);
    assert.ok(requests.filter((url) => url === "/duplicate-site").length >= 2);
    assert.ok((await fsp.stat(result.capturePath)).size > 1000);

    const persisted = JSON.parse(
      await fsp.readFile(path.join(userData, "site-nest-data.json"), "utf8"),
    );
    const tabs = persisted.workspaceBrowserStates.personal.tabs;
    assert.equal(tabs.length, 4);
    assert.equal(tabs.filter((tab) => tab.allowDuplicate === true).length, 2);
    assert.equal(
      tabs.filter((tab) => tab.siteId === "workspace-tabs-duplicate-probe-site").length,
      2,
    );
  },
);
