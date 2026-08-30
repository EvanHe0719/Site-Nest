const VALID_POLICY_MODES = new Set(["tab", "popup", "external", "block", "ask"]);
const AUTH_HOST_HINT = /(?:^|\.)(?:accounts?|auth|login|signin|sso|oauth|identity|idp)(?:\.|$)/i;
const AUTH_PATH_HINT = /\/(?:oauth|authorize|signin|sign-in|login|saml|sso|idp)(?:\/|$|[?#])/i;
const AD_HOST_HINT = /(?:^|\.)(?:doubleclick|googlesyndication|adservice|popads|adnxs)\./i;

function hostnameMatches(hostname, pattern) {
  const host = String(hostname || "").toLowerCase();
  const candidate = String(pattern || "").trim().toLowerCase();
  if (!host || !candidate) return false;
  if (candidate.startsWith("*.")) {
    const suffix = candidate.slice(2);
    return host === suffix || host.endsWith(`.${suffix}`);
  }
  return host === candidate;
}

function normalizeSitePopupPolicies(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const candidate of value.slice(0, 100)) {
    if (!candidate || typeof candidate !== "object") continue;
    const hostnamePattern = String(candidate.hostnamePattern || "")
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .slice(0, 253);
    const mode = VALID_POLICY_MODES.has(candidate.mode) ? candidate.mode : "ask";
    if (!hostnamePattern || seen.has(hostnamePattern)) continue;
    if (!/^(?:\*\.)?[a-z0-9.-]+$/i.test(hostnamePattern)) continue;
    seen.add(hostnamePattern);
    result.push({
      hostnamePattern,
      mode,
      preserveOpener: candidate.preserveOpener !== false,
      allowPost: candidate.allowPost === true,
      allowedRedirectOrigins: Array.isArray(candidate.allowedRedirectOrigins)
        ? candidate.allowedRedirectOrigins
            .map((item) => {
              try {
                const url = new URL(String(item || ""));
                return ['http:', 'https:'].includes(url.protocol) ? url.origin : null;
              } catch {
                return null;
              }
            })
            .filter(Boolean)
            .slice(0, 20)
        : [],
    });
  }
  return result;
}

class WindowOpenPolicyService {
  constructor({ getPolicies = () => [] } = {}) {
    this.getPolicies = getPolicies;
  }

  matchingPolicy(rawUrl) {
    try {
      const hostname = new URL(String(rawUrl || "")).hostname;
      return normalizeSitePopupPolicies(this.getPolicies()).find((policy) =>
        hostnameMatches(hostname, policy.hostnamePattern),
      ) || null;
    } catch {
      return null;
    }
  }

  classify(details = {}, openerUrl = "") {
    let parsed;
    try {
      parsed = new URL(String(details.url || ""));
    } catch {
      return { kind: "block", reason: "invalid-url", mode: "block" };
    }
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { kind: "external-protocol", reason: "external-protocol", mode: "ask" };
    }

    const policy = this.matchingPolicy(parsed.toString());
    const hasPostBody = Boolean(details.postBody);
    if (policy) {
      if (hasPostBody && !policy.allowPost) {
        return { kind: "block", reason: "post-not-allowed-by-policy", mode: "block", policy };
      }
      if (hasPostBody) {
        return {
          kind: "popup",
          reason: "site-policy-post",
          mode: "popup",
          policy,
          preserveOpener: true,
        };
      }
      return {
        kind: policy.mode === "popup" ? "popup" : policy.mode,
        reason: "site-policy",
        mode: policy.mode,
        policy,
        preserveOpener: policy.preserveOpener,
      };
    }

    if (AD_HOST_HINT.test(parsed.hostname)) {
      return { kind: "block", reason: "suspected-ad-popup", mode: "block" };
    }
    const features = String(details.features || "");
    const isPopupDisposition = details.disposition === "new-window";
    const hasPopupFeatures = /(?:^|,)(?:width|height|left|top)=/i.test(features);
    const authLike = AUTH_HOST_HINT.test(parsed.hostname) || AUTH_PATH_HINT.test(`${parsed.pathname}${parsed.search}`);
    if (hasPostBody) {
      return { kind: "popup", reason: "post-window", mode: "popup", preserveOpener: true };
    }
    if (authLike || (isPopupDisposition && hasPopupFeatures)) {
      return { kind: "popup", reason: authLike ? "authentication" : "popup-features", mode: "popup", preserveOpener: true };
    }
    if (details.disposition === "background-tab") {
      return { kind: "background-tab", reason: "background-disposition", mode: "tab" };
    }
    if (details.disposition === "foreground-tab" || details.disposition === "default") {
      return { kind: "tab", reason: "web-link", mode: "tab" };
    }

    let sameOrigin = false;
    try {
      sameOrigin = new URL(openerUrl).origin === parsed.origin;
    } catch {
      sameOrigin = false;
    }
    return sameOrigin
      ? { kind: "tab", reason: "same-origin", mode: "tab" }
      : { kind: "ask", reason: "unknown-cross-origin-window", mode: "ask" };
  }
}

module.exports = {
  AUTH_HOST_HINT,
  WindowOpenPolicyService,
  hostnameMatches,
  normalizeSitePopupPolicies,
};
