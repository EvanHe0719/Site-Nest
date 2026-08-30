const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  addSiteToState,
  createInitialState,
  getWorkspaceBrowserState,
  setWorkspaceBrowserStateInState,
} = require("../../electron/state-model.cjs");

const projectRoot = path.resolve(__dirname, "..", "..");

test("workspace snapshots stay independent while SAP alone receives a persistent isolated identity", () => {
  let state = createInitialState({ now: "2026-08-29T01:00:00.000Z" });
  const personalSite = addSiteToState(
    state,
    {
      name: "个人站点",
      url: "https://personal.example.test/inside",
      workspaceId: "personal",
    },
    { now: "2026-08-29T01:01:00.000Z", idFactory: () => "personal-site" },
  );
  state = personalSite.state;
  const workSite = addSiteToState(
    state,
    {
      name: "工作站点",
      url: "https://work.example.test/ticket",
      workspaceId: "work",
    },
    { now: "2026-08-29T01:02:00.000Z", idFactory: () => "work-site" },
  );
  state = workSite.state;
  const sapSite = addSiteToState(
    state,
    {
      name: "SAP Support",
      url: "https://support.sap.com/en/index.html?isu_page=1",
      workspaceId: "work",
    },
    { now: "2026-08-29T01:02:30.000Z", idFactory: () => "sap-site" },
  );
  state = sapSite.state;

  state = setWorkspaceBrowserStateInState(
    state,
    "personal",
    {
      activeSiteId: "personal-site",
      currentURL: "https://personal.example.test/inside?page=2",
      homeURL: "https://personal.example.test/inside",
    },
    { now: "2026-08-29T01:03:00.000Z" },
  ).state;

  assert.deepEqual(getWorkspaceBrowserState(state, "work"), {
    activeTabId: null,
    tabs: [],
    activeSiteId: null,
    currentURL: null,
    homeURL: null,
    updatedAt: null,
  });
  assert.deepEqual(getWorkspaceBrowserState(state, "research"), {
    activeTabId: null,
    tabs: [],
    activeSiteId: null,
    currentURL: null,
    homeURL: null,
    updatedAt: null,
  });
  assert.equal(
    getWorkspaceBrowserState(state, "personal").currentURL,
    "https://personal.example.test/inside?page=2",
  );

  assert.equal(state.browserProfiles.length, 2);
  assert.deepEqual(
    new Set(state.sites.map((site) => site.browserProfileId)),
    new Set(["default", "sap-support"]),
  );
  assert.equal(state.browserProfiles[0].partition, "persist:qiye-sites");
  assert.equal(state.browserProfiles[0].isReal, true);
  assert.equal(state.browserProfiles[1].partition, "persist:qiye-sap-support");
  assert.equal(sapSite.site.browserProfileId, "sap-support");
});

test("Electron browser views use persistent profile partitions rather than workspace-specific sessions", () => {
  const source = fs.readFileSync(path.join(projectRoot, "electron", "main.cjs"), "utf8");
  assert.match(source, /const SITE_PARTITION = ["']persist:qiye-sites["']/);
  assert.match(source, /const SAP_SITE_PARTITION = ["']persist:qiye-sap-support["']/);
  assert.match(
    source,
    /partition:\s*browserPartitionForProfile\(context\.browserProfileId\)/,
  );
  assert.doesNotMatch(source, /persist:qiye-(?:personal|work|research)/);
  assert.doesNotMatch(source, /partition:\s*[^\n]*(?:workspaceId|activeWorkspaceId)/);
});

test("workspace IPC activates the requested runtime, detaches competing views, and returns an explicit empty browser state", () => {
  const source = fs.readFileSync(path.join(projectRoot, "electron", "main.cjs"), "utf8");
  const handlerStart = source.indexOf('ipcMain.handle("workspace:set-active"');
  const handlerEnd = source.indexOf('ipcMain.handle("sites:add"', handlerStart);
  const activateStart = source.indexOf("async function activateWorkspaceBrowserContext");
  const activateEnd = source.indexOf("function clearWorkspaceBrowserRuntime", activateStart);
  const attachStart = source.indexOf("function attachSiteView");
  const attachEnd = source.indexOf("function detachSiteView", attachStart);

  assert.ok(handlerStart >= 0 && handlerEnd > handlerStart);
  assert.ok(activateStart >= 0 && activateEnd > activateStart);
  assert.ok(attachStart >= 0 && attachEnd > attachStart);

  const handler = source.slice(handlerStart, handlerEnd);
  const activate = source.slice(activateStart, activateEnd);
  const attach = source.slice(attachStart, attachEnd);

  assert.match(handler, /await activateWorkspaceBrowserContext\(/);
  assert.match(handler, /return \{ state: cachedState, workspace: result\.workspace, browserState \}/);
  assert.doesNotMatch(handler, /clearStorageData|cookies\.remove|clearAuthCache/);

  assert.match(activate, /const context = activeBrowserContext\(workspace\)/);
  assert.match(activate, /if \(!context\)/);
  assert.match(activate, /workspace\.browserState = emptyBrowserState\(id\)/);
  assert.match(attach, /for \(const workspace of workspaceBrowserContexts\.values\(\)\)/);
  assert.match(attach, /for \(const other of workspace\.tabs\.values\(\)\)/);
  assert.match(attach, /other !== context && other\.viewOwner === "main"/);
  assert.match(attach, /detachSiteView\(other\)/);
});
