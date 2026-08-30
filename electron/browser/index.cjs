const { ExternalProtocolService } = require("./external-protocol-service.cjs");
const { DownloadManager } = require("./download-manager.cjs");
const { ManagedPopupService } = require("./managed-popup-service.cjs");
const { resolveNavigationTarget, securityStateForUrl } = require("./navigation-target.cjs");
const { WebContextMenuService } = require("./web-context-menu-service.cjs");
const { WindowOpenPolicyService, normalizeSitePopupPolicies } = require("./window-open-policy-service.cjs");

module.exports = {
  ExternalProtocolService,
  DownloadManager,
  ManagedPopupService,
  WebContextMenuService,
  WindowOpenPolicyService,
  normalizeSitePopupPolicies,
  resolveNavigationTarget,
  securityStateForUrl,
};
