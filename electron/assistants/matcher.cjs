function parsePageUrl(rawUrl) {
  try {
    const parsed = new URL(String(rawUrl || ""));
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.username || parsed.password) return null;
    return {
      parsed,
      protocol: parsed.protocol,
      hostname: parsed.hostname.toLowerCase().replace(/\.$/, ""),
      pathname: parsed.pathname || "/",
    };
  } catch {
    return null;
  }
}

function matchesHostname(hostname, rule, { ignoreHostname = false } = {}) {
  if (ignoreHostname) return true;
  if (rule?.any === true) return true;
  const exact = Array.isArray(rule?.exact) ? rule.exact : [];
  if (exact.includes(hostname)) return true;
  const suffixes = Array.isArray(rule?.suffix) ? rule.suffix : [];
  return suffixes.some(
    (suffix) => hostname === suffix || hostname.endsWith(`.${suffix}`),
  );
}

function matchesPathname(pathname, rule) {
  if (rule?.any === true) return true;
  const exact = Array.isArray(rule?.exact) ? rule.exact : [];
  if (exact.includes(pathname)) return true;
  const prefixes = Array.isArray(rule?.prefixes) ? rule.prefixes : [];
  return prefixes.some((prefix) => {
    const withoutTrailingSlash = prefix.endsWith("/") ? prefix.slice(0, -1) : prefix;
    return pathname === withoutTrailingSlash || pathname.startsWith(prefix);
  });
}

function matchesUrlPattern(rawUrl, pattern, options = {}) {
  const page = parsePageUrl(rawUrl);
  if (!page) return false;
  if (!pattern.protocols.includes(page.protocol)) return false;
  if (!matchesHostname(page.hostname, pattern.hostname, options)) return false;
  return matchesPathname(page.pathname, pattern.pathname);
}

function normalizeAssistantIds(value) {
  if (!Array.isArray(value)) return [];
  return Array.from(
    new Set(value.map((item) => String(item || "").trim()).filter(Boolean)),
  );
}

class AssistantMatcher {
  constructor(registry) {
    if (!registry?.get || !registry?.list || !registry?.isEnabled) {
      throw new TypeError("AssistantMatcher 需要 AssistantRegistry");
    }
    this.registry = registry;
  }

  matches(manifest, pageContext, { assistantIds = [] } = {}) {
    if (!manifest || !this.registry.isEnabled(manifest.id)) {
      return { matched: false, reason: "disabled" };
    }
    const parsedPage = parsePageUrl(pageContext?.url);
    if (!parsedPage) return { matched: false, reason: "invalid-url" };

    const explicitlyBound =
      manifest.allowExplicitBinding === true &&
      normalizeAssistantIds(assistantIds).includes(manifest.id);
    if (explicitlyBound) {
      const protocolAndPathMatch = manifest.matchPatterns.some((pattern) =>
        matchesUrlPattern(pageContext.url, pattern, { ignoreHostname: true }),
      );
      if (protocolAndPathMatch) {
        return { matched: true, reason: "explicit-binding" };
      }
    }

    const patternMatch = manifest.matchPatterns.some((pattern) =>
      matchesUrlPattern(pageContext.url, pattern),
    );
    return {
      matched: patternMatch,
      reason: patternMatch ? "url-pattern" : "no-match",
    };
  }

  matchAll(pageContext, { assistantIds = [] } = {}) {
    return this.registry
      .list({ includeDisabled: false })
      .map((runtimeManifest) => {
        const manifest = this.registry.get(runtimeManifest.id);
        const match = this.matches(manifest, pageContext, { assistantIds });
        return match.matched ? { manifest, ...match } : null;
      })
      .filter(Boolean);
  }
}

module.exports = {
  AssistantMatcher,
  matchesPathname,
  matchesUrlPattern,
  normalizeAssistantIds,
  parsePageUrl,
};
