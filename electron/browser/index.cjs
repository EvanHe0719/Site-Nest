const { ExternalProtocolService } = require("./external-protocol-service.cjs");
const { DownloadManager } = require("./download-manager.cjs");
const {
  PageResourceService,
  normalizePageResourceCandidate,
  pageResourceExtractionScript,
} = require("./page-resource-service.cjs");
const {
  SessionRuntimeState,
  WebViewLifecycleManager,
  WebViewPool,
  normalizeBrowserMemorySettings,
} = require("./webview-lifecycle-manager.cjs");
const { ManagedPopupService } = require("./managed-popup-service.cjs");
const { resolveNavigationTarget, securityStateForUrl } = require("./navigation-target.cjs");
const { WebContextMenuService } = require("./web-context-menu-service.cjs");
const { WindowOpenPolicyService, normalizeSitePopupPolicies } = require("./window-open-policy-service.cjs");

module.exports = {
  ExternalProtocolService,
  DownloadManager,
  PageResourceService,
  normalizePageResourceCandidate,
  pageResourceExtractionScript,
  SessionRuntimeState,
  WebViewLifecycleManager,
  WebViewPool,
  normalizeBrowserMemorySettings,
  ManagedPopupService,
  WebContextMenuService,
  WindowOpenPolicyService,
  normalizeSitePopupPolicies,
  resolveNavigationTarget,
  securityStateForUrl,
};
