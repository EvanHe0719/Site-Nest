const assert = require("node:assert/strict");
const test = require("node:test");

const { tabCloseDecision } = require("../../electron/browser/tab-close-policy.cjs");

test("unprotected tabs close normally", () => {
  assert.deepEqual(tabCloseDecision({ protection: { protected: false } }), {
    action: "close",
    reason: "",
  });
});

test("automatic cleanup stays blocked for every protected tab", () => {
  assert.equal(tabCloseDecision({
    protection: { protected: true, reason: "登录流程正在进行" },
  }).action, "block");
});

test("an explicit close immediately closes login, loading and media tabs", () => {
  for (const reason of ["登录流程正在进行", "页面正在加载", "页面正在播放媒体"]) {
    assert.equal(tabCloseDecision({
      protection: { protected: true, reason },
      userInitiated: true,
    }).action, "close");
  }
});

test("an explicit close confirms real data-loss risks and closes only after approval", () => {
  for (const reason of ["Zoho 回复草稿尚未发送", "页面存在待上传文件", "页面正在下载"]) {
    const protection = { protected: true, reason };
    assert.equal(tabCloseDecision({ protection, userInitiated: true }).action, "confirm");
    assert.equal(tabCloseDecision({ protection, userInitiated: true, confirmed: true }).action, "close");
  }
});
