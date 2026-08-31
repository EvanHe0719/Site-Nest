const DIRECT_USER_CLOSE_REASONS = new Set([
  "用户标记保持运行",
  "独立窗口正在显示",
  "页面正在加载",
  "登录流程正在进行",
  "页面正在播放媒体",
]);

function tabCloseDecision(input = {}) {
  const protection = input.protection || {};
  const reason = String(protection.reason || "页面可能存在未保存内容");
  if (protection.protected !== true) return { action: "close", reason: "" };
  if (input.userInitiated !== true) return { action: "block", reason };
  if (input.confirmed === true || DIRECT_USER_CLOSE_REASONS.has(reason)) {
    return { action: "close", reason };
  }
  return { action: "confirm", reason };
}

module.exports = {
  DIRECT_USER_CLOSE_REASONS,
  tabCloseDecision,
};
