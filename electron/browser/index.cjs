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
const { WindowOpenPolicyService, isAuthenticationUrl, normalizeSitePopupPolicies } = require("./window-open-policy-service.cjs");
const { standardChromiumUserAgent } = require("./browser-user-agent.cjs");
const { NavigationPerformanceTracer } = require("./navigation-performance-tracer.cjs");
const { PageCapabilityOrchestrator } = require("./page-capability-orchestrator.cjs");
const { tabCloseDecision } = require("./tab-close-policy.cjs");
const {
  durableBrowserUrl,
  isZohoDeskUrl,
  zohoDeskAuthReturnUrl,
} = require("./zoho-auth-return.cjs");
const {
  clearSapAuthenticationState,
  hasSapLoginRejection,
  isSapSearchTarget,
  isSapSessionHost,
  isSapSessionUrl,
  sapRetryUrl,
} = require("./sap-auth-recovery.cjs");

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
  isAuthenticationUrl,
  normalizeSitePopupPolicies,
  standardChromiumUserAgent,
  NavigationPerformanceTracer,
  PageCapabilityOrchestrator,
  tabCloseDecision,
  durableBrowserUrl,
  isZohoDeskUrl,
  zohoDeskAuthReturnUrl,
  resolveNavigationTarget,
  securityStateForUrl,
  clearSapAuthenticationState,
  hasSapLoginRejection,
  isSapSearchTarget,
  isSapSessionHost,
  isSapSessionUrl,
  sapRetryUrl,
};
