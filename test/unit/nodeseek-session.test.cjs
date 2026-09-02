const assert = require("node:assert/strict");
const test = require("node:test");

const {
  NODESEEK_BROWSER_PROFILE_ID,
  NODESEEK_SITE_PARTITION,
  isNodeSeekUrl,
} = require("../../electron/browser/nodeseek-session.cjs");

test("NodeSeek uses a dedicated persistent identity and exact host matching", () => {
  assert.equal(NODESEEK_BROWSER_PROFILE_ID, "nodeseek");
  assert.equal(NODESEEK_SITE_PARTITION, "persist:qiye-nodeseek");
  assert.equal(isNodeSeekUrl("https://www.nodeseek.com/categories/info"), true);
  assert.equal(isNodeSeekUrl("https://nodeseek.com/post-1-1"), true);
  assert.equal(isNodeSeekUrl("https://account.nodeseek.com/signIn.html"), true);
  assert.equal(isNodeSeekUrl("https://nodeseek.com.evil.test/"), false);
  assert.equal(isNodeSeekUrl("not a url"), false);
});
