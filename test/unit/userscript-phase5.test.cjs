const assert = require("node:assert/strict");
const test = require("node:test");

const { CURRENT_SCHEMA_VERSION, createInitialState, migrateState } = require("../../electron/state-model.cjs");

const {
  UserScriptEngine,
  UserScriptSourceService,
  appendUserScriptExecution,
  classifyConnectTarget,
  normalizeUserScript,
  parseUserScript,
  removeUserScript,
  restoreUserScript,
  resolveUserScriptUpdateUrl,
  rollbackUserScriptVersion,
  sourceHash,
  updateLocalhostConnectApproval,
  upsertUserScript,
} = require("../../electron/userscripts/index.cjs");

const NOW = "2026-08-31T06:00:00.000Z";

function source(version = "1.0.0", metadata = "", body = "globalThis.phaseFive = true;") {
  return `// ==UserScript==
// @name Phase five fixture
// @namespace test.qiye
// @version ${version}
// @match https://docs.example.com/*
// @run-at document-end
${metadata}
// ==/UserScript==
${body}`;
}

function emptyState() {
  return {
    userScripts: [],
    userScriptPermissions: [],
    userScriptExecutions: [],
    userScriptValues: {},
    userScriptVersions: [],
    updatedAt: NOW,
  };
}

test("schema 16 adds empty script version history idempotently without inventing scripts", () => {
  const legacy = createInitialState({ now: NOW, defaultSites: [] });
  legacy.version = 15;
  delete legacy.userScriptVersions;
  const once = migrateState(legacy, { now: NOW, defaultSites: [] });
  const twice = migrateState(once.state, { now: NOW, defaultSites: [] });
  assert.equal(CURRENT_SCHEMA_VERSION, 18);
  assert.equal(once.fromVersion, 15);
  assert.equal(once.toVersion, 18);
  assert.deepEqual(once.state.userScriptVersions, []);
  assert.equal(once.state.userScripts.filter((item) => item.sourceType !== "builtIn").length, 0);
  assert.deepEqual(twice.state, once.state);
});

test("phase5 metadata reports unknown directives and exposes update URLs plus clipboard grant", () => {
  const script = parseUserScript(source("1.0.0", `// @grant GM_setClipboard
// @updateURL https://scripts.example/update.user.js
// @downloadURL https://scripts.example/download.user.js
// @noframes true`), { id: "phase5", sourceType: "createdInApp", now: NOW });
  assert.equal(script.sourceType, "createdInApp");
  assert.equal(script.updateUrl, "https://scripts.example/update.user.js");
  assert.equal(script.downloadUrl, "https://scripts.example/download.user.js");
  assert.deepEqual(script.grants, ["GM_setClipboard"]);
  assert.match(script.compatibility.warnings.join(" "), /@noframes/);
  assert.equal(resolveUserScriptUpdateUrl(script), "https://scripts.example/download.user.js");

  const restored = normalizeUserScript({
    ...script,
    lastRunAt: NOW,
    errorCount: 2,
    disabledReason: "test",
    deletedAt: NOW,
    runtimeStats: { runCount: 4, timerCount: 2 },
  }, { now: NOW });
  assert.equal(restored.errorCount, 2);
  assert.equal(restored.deletedAt, NOW);
  assert.equal(restored.runtimeStats.runCount, 4);
  assert.equal(restored.runtimeStats.timerCount, 2);
});

test("install review exposes unsupported remote dependencies instead of silently claiming compatibility", async () => {
  const service = new UserScriptSourceService({ now: () => Date.parse(NOW) });
  const review = await service.review({
    sourceType: "pasted",
    sourceCode: source("1.0.0", "// @require https://cdn.example/helper.js"),
  });
  assert.deepEqual(review.requires, ["https://cdn.example/helper.js"]);
  assert.equal(review.compatibility.compatible, false);
  assert.match(review.compatibility.unsupported.join(" "), /@require/);
});

test("createdInApp can create a reviewable blank editor template without auto-installing", async () => {
  const service = new UserScriptSourceService({ now: () => Date.parse(NOW) });
  const review = await service.review({ sourceType: "createdInApp", name: "My blank script" });
  assert.equal(review.sourceType, "createdInApp");
  assert.match(review.sourcePreview, /@name\s+My blank script/);
  assert.match(review.sourcePreview, /@grant\s+none/);
  assert.equal(service.consume(review.reviewToken).script.enabled, false);
});

test("updates keep current and previous source versions, soft delete is restorable, and rollback is explicit", () => {
  const first = parseUserScript(source("1.0.0"), { id: "versioned", sourceType: "pasted", enabled: true, now: NOW });
  let result = upsertUserScript(emptyState(), first, { now: NOW });
  const secondTime = "2026-08-31T07:00:00.000Z";
  const second = parseUserScript(source("1.1.0", "", "globalThis.phaseFive = 'new';"), {
    id: "versioned", sourceType: "pasted", enabled: true, now: secondTime,
  });
  result = upsertUserScript(result.state, second, { now: secondTime });
  assert.deepEqual(result.state.userScriptVersions.map((item) => item.version), ["1.0.0", "1.1.0"]);
  result.state.userScriptValues.versioned = { theme: "dark" };

  const removed = removeUserScript(result.state, "versioned", { now: "2026-08-31T08:00:00.000Z" });
  assert.equal(removed.state.userScripts.length, 1);
  assert.equal(removed.script.enabled, false);
  assert.equal(removed.script.deletedAt, "2026-08-31T08:00:00.000Z");
  assert.deepEqual(removed.state.userScriptValues.versioned, { theme: "dark" });

  const restored = restoreUserScript(removed.state, "versioned", { now: "2026-08-31T08:01:00.000Z" });
  assert.equal(restored.script.deletedAt, null);
  assert.equal(restored.script.enabled, false);

  const rolledBack = rollbackUserScriptVersion(restored.state, "versioned", sourceHash(first.sourceCode), {
    now: "2026-08-31T08:02:00.000Z",
  });
  assert.equal(rolledBack.script.version, "1.0.0");
  assert.equal(rolledBack.script.sourceHash, first.sourceHash);
  assert.equal(rolledBack.state.userScriptVersions.some((item) => item.sourceHash === second.sourceHash), true);
});

test("execution statistics track real fields and three consecutive severe errors auto-pause third-party scripts", () => {
  const script = parseUserScript(source(), { id: "unstable", sourceType: "pasted", enabled: true, now: NOW });
  let state = upsertUserScript(emptyState(), script, { now: NOW }).state;
  for (let index = 0; index < 3; index += 1) {
    const result = appendUserScriptExecution(state, {
      id: `failure-${index}`,
      scriptId: "unstable",
      status: index === 1 ? "timeout" : "failure",
      startedAt: NOW,
      finishedAt: NOW,
      matchDurationMs: 2,
      injectionDurationMs: 8,
      firstExecutionDurationMs: 6,
      sanitizedMessage: "Bearer secret",
    }, { now: NOW });
    state = result.state;
    if (index === 2) assert.equal(result.autoDisabled, true);
  }
  const paused = state.userScripts.find((item) => item.id === "unstable");
  assert.equal(paused.enabled, false);
  assert.equal(paused.errorCount, 3);
  assert.match(paused.disabledReason, /自动暂停/);
  assert.equal(paused.runtimeStats.runCount, 3);
  assert.equal(paused.runtimeStats.totalInjectionDurationMs, 24);
  assert.doesNotMatch(state.userScriptExecutions[0].sanitizedMessage, /secret/);
});

test("GM host protocol keeps browser identity for opened tabs and supports clipboard through a narrow callback", async () => {
  const script = parseUserScript(source("1.0.0", `// @grant GM_openInTab
// @grant GM_setClipboard
// @grant GM_notification`), { id: "host-api", sourceType: "pasted", enabled: true, now: NOW });
  let state = upsertUserScript(emptyState(), script, { now: NOW }).state;
  const calls = [];
  const contents = {
    id: 55,
    isDestroyed: () => false,
    getURL: () => "https://docs.example.com/page",
    executeJavaScriptInIsolatedWorld: async () => ({ ok: true, metrics: { firstExecutionDurationMs: 4 } }),
  };
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); },
    recordExecution: async () => undefined,
    openTab: async (runtime, payload) => { calls.push({ kind: "tab", runtime, payload }); return { opened: true }; },
    setClipboard: async (_runtime, payload) => { calls.push({ kind: "clipboard", payload }); return { written: true }; },
    showNotification: async (_runtime, payload) => { calls.push({ kind: "notification", payload }); return { deliveredInApp: true }; },
  });
  await engine.runAt(contents, {
    tabId: "tab-a",
    workspaceId: "work",
    browserProfileId: "customer-a",
    persistentPartition: "persist:qiye-sites-profile-customer-a",
  }, "document-end");
  const [token] = engine.runtimes.get(contents.id).keys();
  await engine.handleRuntimeRequest(contents, { token, operation: "tab:open", payload: { url: "https://example.com", active: false, browserProfileId: "forged" } });
  await engine.handleRuntimeRequest(contents, { token, operation: "clipboard:set", payload: { text: "safe", type: "text/plain" } });
  await engine.handleRuntimeRequest(contents, { token, operation: "notification:show", payload: { title: "Done", text: "Finished" } });
  assert.equal(calls[0].payload.workspaceId, "work");
  assert.equal(calls[0].payload.browserProfileId, "customer-a");
  assert.equal(calls[0].payload.persistentPartition, "persist:qiye-sites-profile-customer-a");
  assert.deepEqual(calls[1], { kind: "clipboard", payload: { text: "safe", type: "text/plain" } });
  assert.deepEqual(calls[2], { kind: "notification", payload: { title: "Done", text: "Finished" } });
});

test("GM network rechecks every redirect against @connect and refuses localhost without advanced approval", async () => {
  const script = parseUserScript(source("1.0.0", `// @grant GM_xmlhttpRequest
// @connect api.example.net
// @connect localhost`), { id: "network", sourceType: "pasted", enabled: true, now: NOW });
  let state = upsertUserScript(emptyState(), script, { now: NOW }).state;
  let fetchCount = 0;
  const contents = {
    id: 56,
    isDestroyed: () => false,
    getURL: () => "https://docs.example.com/page",
    executeJavaScriptInIsolatedWorld: async () => ({ ok: true }),
  };
  const engine = new UserScriptEngine({
    getState: async () => state,
    updateState: async (mutator) => { state = mutator(state); },
    recordExecution: async () => undefined,
    fetchFn: async () => {
      fetchCount += 1;
      return { status: 302, headers: { get: (name) => name === "location" ? "https://evil.example.org/steal" : null } };
    },
  });
  await engine.runAt(contents, { tabId: "tab-a", workspaceId: "work", browserProfileId: "default" }, "document-end");
  const [token] = engine.runtimes.get(contents.id).keys();
  await assert.rejects(engine.handleRuntimeRequest(contents, {
    token, operation: "network:request", payload: { url: "https://api.example.net/start" },
  }), /@connect/);
  assert.equal(fetchCount, 1);
  await assert.rejects(engine.handleRuntimeRequest(contents, {
    token, operation: "network:request", payload: { url: "http://localhost:8787/data" },
  }), /高级授权/);
  assert.deepEqual(classifyConnectTarget("file:///secret"), {
    allowedProtocol: false,
    local: false,
    hostname: "",
    protocol: "file:",
    reason: "跨域请求只允许 HTTPS 或已批准的本机地址",
  });

  state = updateLocalhostConnectApproval(state, "network", "localhost", true, { now: NOW }).state;
  engine.cleanup(contents);
  engine.fetchFn = async (url) => ({
    status: 200,
    statusText: "OK",
    url,
    headers: { get: () => "1048577" },
    text: async () => "not read",
  });
  await engine.runAt(contents, { tabId: "tab-b", workspaceId: "work", browserProfileId: "default" }, "document-end");
  const [approvedToken] = engine.runtimes.get(contents.id).keys();
  await assert.rejects(engine.handleRuntimeRequest(contents, {
    token: approvedToken, operation: "network:request", payload: { url: "http://localhost:8787/data" },
  }), /1 MB/);
});
