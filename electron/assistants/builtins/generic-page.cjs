const GENERIC_PAGE_ASSISTANT = Object.freeze({
  id: "generic-page-actions",
  name: "通用页面动作",
  description: "为普通网页提供复制、收藏、固定和外部打开动作。",
  version: "1.0.0",
  icon: "globe",
  source: "built-in",
  enabled: true,
  isGeneric: true,
  allowExplicitBinding: false,
  matchPatterns: [
    {
      protocols: ["http:", "https:"],
      hostname: { any: true },
      pathname: { any: true },
    },
  ],
  permissions: [
    "read:url",
    "read:title",
    "action:copy",
    "action:openExternal",
    "action:saveSite",
  ],
  actions: [
    {
      id: "copy-page-url",
      type: "page.copy-url",
      name: "复制页面地址",
      description: "复制当前页面的完整地址。",
    },
    {
      id: "save-current-page",
      type: "site.save-current",
      name: "添加到栖页",
      description: "将当前页面保存到当前空间。",
    },
    {
      id: "pin-current-page",
      type: "site.pin-current",
      name: "固定到当前空间",
      description: "保存当前页面并固定到当前空间。",
    },
    {
      id: "open-page-external",
      type: "page.open-external",
      name: "在系统浏览器中打开",
      description: "使用系统默认浏览器打开当前页面。",
    },
  ],
});

module.exports = { GENERIC_PAGE_ASSISTANT };
