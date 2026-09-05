const assert = require("node:assert/strict");
const test = require("node:test");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const {
  NODESEEK_BROWSER_PROFILE_ID,
  NODESEEK_SITE_PARTITION,
  NODESEEK_ACCEPT_LANGUAGES,
  isNodeSeekUrl,
  nodeSeekPageIssue,
} = require("../../electron/browser/nodeseek-session.cjs");

test("NodeSeek uses a dedicated persistent identity and exact host matching", () => {
  assert.equal(NODESEEK_BROWSER_PROFILE_ID, "nodeseek");
  assert.equal(NODESEEK_SITE_PARTITION, "persist:qiye-nodeseek");
  assert.equal(isNodeSeekUrl("https://www.nodeseek.com/categories/info"), true);
  assert.equal(isNodeSeekUrl("https://nodeseek.com/post-1-1"), true);
  assert.equal(isNodeSeekUrl("https://account.nodeseek.com/signIn.html"), true);
  assert.equal(isNodeSeekUrl("https://nodeseek.com.evil.test/"), false);
  assert.equal(isNodeSeekUrl("not a url"), false);
  assert.equal(isNodeSeekUrl("ftp://nodeseek.com/"), false);
});

test("browser startup gives worker requests the same UA fallback and valid language preferences", () => {
  assert.equal(NODESEEK_ACCEPT_LANGUAGES, "zh-CN,zh,en");
  assert.doesNotMatch(NODESEEK_ACCEPT_LANGUAGES, /;|q=/);
  const main = fs.readFileSync(path.join(__dirname, "../../electron/main.cjs"), "utf8");
  const fallback = "app.userAgentFallback = standardChromiumUserAgent(app.userAgentFallback)";
  assert.ok(main.includes(fallback));
  assert.ok(main.indexOf(fallback) < main.indexOf("app.whenReady()"));
  assert.match(main, /setUserAgent\(browserUserAgent, NODESEEK_ACCEPT_LANGUAGES\)/);
  assert.doesNotMatch(main, /zh-CN,zh;q=0\.9,en;q=0\.8/);
});

test("plain 403 and real HTTP status are recognized without claiming a Cloudflare challenge", () => {
  for (const page of [
    { body: "403" },
    { body: "\n 403 Forbidden \n" },
    { title: "403 Forbidden" },
    { statusCode: 403, title: "", body: "" },
    { statusCode: 403, body: "Access denied by the upstream server" },
  ]) {
    const issue = nodeSeekPageIssue({ url: "https://www.nodeseek.com/", ...page });
    assert.equal(issue.siteIssue, "nodeseek-forbidden");
    assert.match(issue.error, /HTTP 403/);
    assert.doesNotMatch(issue.error, /Cloudflare|重置/);
  }
});

test("challenge, network error and ordinary forum content remain distinct", () => {
  const url = "https://www.nodeseek.com/";
  assert.equal(nodeSeekPageIssue({ url, title: "Just a moment..." }).siteIssue, "nodeseek-challenge");
  assert.equal(nodeSeekPageIssue({ url, title: "Attention Required! | Cloudflare" }).siteIssue, "nodeseek-challenge");
  assert.equal(nodeSeekPageIssue({ url, statusCode: 403, body: "Cloudflare Ray ID: test" }).siteIssue, "nodeseek-challenge");
  assert.equal(nodeSeekPageIssue({ url, body: "Oops! Network Error" }).siteIssue, "nodeseek-network");
  assert.equal(nodeSeekPageIssue({ url, statusCode: 200, title: "Cloudflare 403 排查 - NodeSeek", body: "正文讨论 Cloudflare Ray ID" }), null);
  assert.equal(nodeSeekPageIssue({ url, statusCode: 200, title: "NodeSeek", body: "正常帖子" }), null);
  assert.equal(nodeSeekPageIssue({ url: "https://example.com/", statusCode: 403 }), null);
});

test("a late page inspection cannot attach an old 403 to a newly navigated document", async () => {
  const main = fs.readFileSync(path.join(__dirname, "../../electron/main.cjs"), "utf8");
  const inspectSource = main.slice(main.indexOf("async function inspectKnownSiteIssue("), main.indexOf("async function repairCurrentSiteNetwork("));
  let completeRead;
  const contents = {
    isDestroyed: () => false,
    getURL: () => "https://www.nodeseek.com/",
    getTitle: () => "",
    executeJavaScript: () => new Promise((resolve) => { completeRead = resolve; }),
  };
  const context = { view: { webContents: contents }, navigationDocumentId: 1, browserState: {} };
  const updates = [];
  const sandbox = {
    hasExpectedHost: isNodeSeekUrl,
    isSapSessionUrl: () => false,
    nodeSeekPageIssue,
    compactBrowserState: (state) => updates.push(state),
    setTimeout: () => { throw new Error("A stale document must not schedule another reload"); },
  };
  vm.runInNewContext(`${inspectSource}\nthis.inspect = inspectKnownSiteIssue;`, sandbox);
  const inspecting = sandbox.inspect(context);
  context.navigationDocumentId += 1;
  completeRead("403");
  await inspecting;
  assert.deepEqual(updates, []);
});
