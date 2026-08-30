const assert = require("node:assert/strict");
const test = require("node:test");

const { createInitialState, normalizeStateV8 } = require("../../electron/state-model.cjs");
const {
  connectPatternMatches,
  isSensitiveUserScriptUrl,
  lineDiffSummary,
  parseUserScript,
  sourceHash,
  UserScriptSourceService,
  userScriptMatches,
  upsertUserScript,
  updateBuiltInSiteApproval,
  updateSensitiveSiteApproval,
} = require("../../electron/userscripts/index.cjs");

const NOW = "2026-08-30T06:00:00.000Z";
const SOURCE = `// ==UserScript==
// @name         Test Helper
// @namespace    test.qiye
// @version      1.2.3
// @description  fixture
// @author       Evan
// @match        https://*.example.com/*
// @exclude      https://private.example.com/*
// @run-at       document-idle
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_xmlhttpRequest
// @connect      api.example.net
// ==/UserScript==
globalThis.fixtureRan = true;`;

test("metadata parser produces a stable hash and supported runtime declaration", () => {
  const script = parseUserScript(SOURCE, { id: "script-a", sourceType: "pasted", now: NOW });
  assert.equal(script.name, "Test Helper");
  assert.equal(script.version, "1.2.3");
  assert.equal(script.runAt, "document-idle");
  assert.deepEqual(script.grants, ["GM_getValue", "GM_setValue", "GM_xmlhttpRequest"]);
  assert.deepEqual(script.connects, ["api.example.net"]);
  assert.equal(script.sourceHash, sourceHash(SOURCE));
  assert.equal(script.compatibility.compatible, true);
});

test("unsupported dependencies, grants and wildcard connect return an honest compatibility report", () => {
  const source = `// ==UserScript==
// @name bad
// @match https://example.com/*
// @grant unsafeWindow
// @connect *
// @require https://cdn.example.com/a.js
// ==/UserScript==\nvoid 0;`;
  const script = parseUserScript(source, { now: NOW });
  assert.equal(script.compatibility.compatible, false);
  assert.match(script.compatibility.unsupported.join(" "), /unsafeWindow/);
  assert.match(script.compatibility.unsupported.join(" "), /@connect \*/);
  assert.match(script.compatibility.unsupported.join(" "), /@require/);
});

test("match and exclude rules are workspace-aware and sensitive third-party pages are blocked", () => {
  const script = parseUserScript(SOURCE, { id: "script-a", enabled: true, workspaceIds: ["work"], now: NOW });
  assert.equal(userScriptMatches(script, "https://docs.example.com/page", { workspaceId: "work" }).matched, true);
  assert.equal(userScriptMatches(script, "https://docs.example.com/page", { workspaceId: "personal" }).matched, false);
  assert.equal(userScriptMatches(script, "https://private.example.com/page", { workspaceId: "work" }).matched, false);
  const login = userScriptMatches(script, "https://accounts.example.com/signin", { workspaceId: "work" });
  assert.equal(login.matched, false);
  assert.equal(login.sensitive, true);
  const approvedLogin = userScriptMatches(script, "https://accounts.example.com/signin", { workspaceId: "work", sensitiveSiteApproved: true });
  assert.equal(approvedLogin.matched, true);
  assert.equal(approvedLogin.sensitiveType, "login");
  assert.deepEqual(isSensitiveUserScriptUrl("file:///C:/secret.txt"), { blocked: true, reason: "系统内部或本地协议" });
  const local = parseUserScript(SOURCE.replace("https://*.example.com/*", "http://127.0.0.1:8787/*"), { now: NOW });
  assert.equal(userScriptMatches(local, "http://127.0.0.1:8787/page", {}).matched, true);
});

test("connect rules never treat a global wildcard as approved", () => {
  assert.equal(connectPatternMatches("*", "api.example.net"), false);
  assert.equal(connectPatternMatches("api.example.net", "api.example.net"), true);
  assert.equal(connectPatternMatches("*.example.net", "v2.api.example.net"), true);
  assert.equal(connectPatternMatches("*.example.net", "example.org"), false);
});

test("schema v10 creates one disabled built-in and keeps script values isolated by id", () => {
  const initial = createInitialState({ now: NOW, defaultSites: [] });
  assert.equal(initial.version, 10);
  assert.equal(initial.userScripts.length, 1);
  assert.equal(initial.userScripts[0].id, "builtin-restore-copy");
  assert.equal(initial.userScripts[0].enabled, false);

  const parsed = parseUserScript(SOURCE, { id: "script-a", sourceType: "pasted", enabled: true, now: NOW });
  const installed = upsertUserScript(initial, parsed, { now: NOW }).state;
  installed.userScriptValues = {
    "script-a": { key: "script-a-value" },
    "builtin-restore-copy": { key: "builtin-value" },
  };
  const restored = normalizeStateV8(installed, { now: NOW, defaultSites: [] });
  assert.equal(restored.userScripts.length, 2);
  assert.equal(restored.userScriptValues["script-a"].key, "script-a-value");
  assert.equal(restored.userScriptValues["builtin-restore-copy"].key, "builtin-value");
  assert.equal(restored.userScriptPermissions.filter((item) => item.scriptId === "script-a").length, 4);

  const approved = updateBuiltInSiteApproval(restored, "builtin-restore-copy", "docs.example.com", true, { now: NOW });
  assert.equal(approved.script.enabled, true);
  assert.equal(approved.state.userScriptPermissions.some((item) => item.permission === "site" && item.value === "docs.example.com"), true);
  const revoked = updateBuiltInSiteApproval(approved.state, "builtin-restore-copy", "docs.example.com", false, { now: NOW });
  assert.equal(revoked.script.enabled, false);
  const sensitive = updateSensitiveSiteApproval(restored, "script-a", "accounts.example.com", true, { now: NOW });
  assert.equal(sensitive.state.userScriptPermissions.some((item) => item.permission === "sensitive-site" && item.value === "accounts.example.com"), true);
  const sensitiveRevoked = updateSensitiveSiteApproval(sensitive.state, "script-a", "accounts.example.com", false, { now: NOW });
  assert.equal(sensitiveRevoked.state.userScriptPermissions.some((item) => item.permission === "sensitive-site"), false);
});

test("remote source hash changes are detectable without replacing the installed script", () => {
  const first = parseUserScript(SOURCE, { id: "remote-a", sourceType: "remoteUrl", sourceUrl: "https://scripts.example/a.user.js", now: NOW });
  const changedSource = SOURCE.replace("1.2.3", "1.2.4");
  const second = parseUserScript(changedSource, { id: "remote-a", sourceType: "remoteUrl", sourceUrl: first.sourceUrl, now: NOW });
  assert.notEqual(first.sourceHash, second.sourceHash);
  assert.equal(first.sourceCode, SOURCE);
  assert.equal(first.autoUpdate, false);
  assert.deepEqual(lineDiffSummary("a\nb\nc", "a\nB\nc"), {
    addedLines: 1,
    removedLines: 1,
    truncated: false,
    preview: "- b\n+ B",
  });
});

test("remote sources require HTTPS, produce a review diff, and cannot reuse confirmation tokens", async () => {
  const nextSource = SOURCE.replace("1.2.3", "1.2.4");
  const service = new UserScriptSourceService({
    now: () => Date.parse(NOW),
    fetchFn: async () => ({
      ok: true,
      status: 200,
      headers: { get: () => String(Buffer.byteLength(nextSource)) },
      text: async () => nextSource,
    }),
  });
  await assert.rejects(
    service.review({ sourceType: "remoteUrl", sourceUrl: "http://scripts.example/a.user.js" }),
    /HTTPS/,
  );
  const review = await service.review({
    sourceType: "remoteUrl",
    sourceUrl: "https://scripts.example/a.user.js",
  }, {
    updateOf: "remote-a",
    previousHash: sourceHash(SOURCE),
    previousSourceCode: SOURCE,
  });
  assert.equal(review.changed, true);
  assert.equal(review.diff.addedLines, 1);
  assert.equal(review.diff.removedLines, 1);
  assert.equal(service.consume(review.reviewToken).script.sourceCode, nextSource);
  assert.throws(() => service.consume(review.reviewToken), /过期/);
});
