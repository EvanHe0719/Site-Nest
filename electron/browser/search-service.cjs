const { randomUUID } = require("node:crypto");
const { buildSearchUrl, resolveNavigationTarget } = require("./navigation-target.cjs");

const BUILTIN_SEARCH_ENGINES = Object.freeze([
  Object.freeze({ id: "google", name: "Google", icon: "G", searchUrlTemplate: "https://www.google.com/search?q={query}", builtIn: true, enabled: true, sortOrder: 0 }),
  Object.freeze({ id: "bing", name: "Bing", icon: "B", searchUrlTemplate: "https://www.bing.com/search?q={query}", builtIn: true, enabled: true, sortOrder: 1 }),
  Object.freeze({ id: "baidu", name: "百度", icon: "百", searchUrlTemplate: "https://www.baidu.com/s?wd={query}", builtIn: true, enabled: true, sortOrder: 2 }),
  Object.freeze({ id: "duckduckgo", name: "DuckDuckGo", icon: "D", searchUrlTemplate: "https://duckduckgo.com/?q={query}", builtIn: true, enabled: true, sortOrder: 3 }),
]);

const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "access_token",
  "refresh_token",
  "code",
  "session",
  "sessionid",
  "auth",
  "password",
]);

class SearchEngineRegistry {
  constructor(definitions = BUILTIN_SEARCH_ENGINES) {
    this.engines = new Map();
    for (const definition of definitions) {
      const normalized = this.validate(definition);
      if (!this.engines.has(normalized.id)) this.engines.set(normalized.id, normalized);
    }
  }

  validate(definition) {
    const id = String(definition?.id || "").trim().toLowerCase();
    const name = String(definition?.name || "").trim();
    const searchUrlTemplate = String(definition?.searchUrlTemplate || "").trim();
    if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id) || !name) {
      throw new Error("搜索引擎标识或名称无效");
    }
    if (!searchUrlTemplate.includes("{query}")) {
      throw new Error("搜索引擎地址必须包含 {query}");
    }
    const probe = new URL(searchUrlTemplate.replaceAll("{query}", "test"));
    if (probe.protocol !== "https:" && !(probe.protocol === "http:" && probe.hostname === "localhost")) {
      throw new Error("搜索引擎地址必须使用 HTTPS");
    }
    return Object.freeze({
      id,
      name: name.slice(0, 80),
      icon: String(definition.icon || name[0] || "搜").slice(0, 4),
      searchUrlTemplate,
      builtIn: definition.builtIn !== false,
      enabled: definition.enabled !== false,
      sortOrder: Number.isFinite(Number(definition.sortOrder)) ? Number(definition.sortOrder) : 0,
    });
  }

  list() {
    return Array.from(this.engines.values())
      .filter((engine) => engine.enabled)
      .sort((left, right) => left.sortOrder - right.sortOrder || left.name.localeCompare(right.name))
      .map((engine) => ({ ...engine }));
  }

  get(engineId) {
    return this.engines.get(String(engineId || "").toLowerCase()) || null;
  }
}

function normalizeSearchSettings(value, registry = new SearchEngineRegistry()) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const requestedEngine = registry.get(input.defaultSearchEngineId);
  const historyLimit = Number(input.searchHistoryLimit);
  return {
    defaultSearchEngineId: requestedEngine?.id || "google",
    saveSearchHistory: input.saveSearchHistory !== false,
    searchHistoryLimit: Number.isInteger(historyLimit)
      ? Math.min(500, Math.max(1, historyLimit))
      : 100,
    settingsLastSection: String(input.settingsLastSection || "general").slice(0, 60),
  };
}

function containsSensitiveAssignment(value) {
  return /(?:^|[?&#;\s])(?:token|access_token|refresh_token|code|session|sessionid|auth|password)\s*=/i.test(String(value || ""));
}

function sanitizeDirectUrlForHistory(value) {
  let parsed;
  try {
    parsed = new URL(String(value || ""));
  } catch {
    return null;
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) return null;
  for (const key of Array.from(parsed.searchParams.keys())) {
    if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase())) parsed.searchParams.delete(key);
  }
  if (containsSensitiveAssignment(parsed.hash)) parsed.hash = "";
  return parsed.toString();
}

function normalizeSearchHistory(value, settings = normalizeSearchSettings()) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const candidate of value) {
    if (!candidate || typeof candidate !== "object") continue;
    const type = candidate.type === "directUrl" ? "directUrl" : candidate.type === "webSearch" ? "webSearch" : "";
    if (!type) continue;
    const rawText = String(candidate.text || "").trim();
    const text = type === "directUrl"
      ? sanitizeDirectUrlForHistory(rawText)
      : containsSensitiveAssignment(rawText) ? null : rawText.slice(0, 500);
    if (!text) continue;
    const engineId = type === "webSearch" ? String(candidate.engineId || settings.defaultSearchEngineId) : null;
    const dedupeKey = `${type}\n${engineId || ""}\n${text.toLocaleLowerCase("zh-CN")}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    result.push({
      id: String(candidate.id || randomUUID()).slice(0, 120),
      type,
      text,
      engineId,
      createdAt: typeof candidate.createdAt === "string" ? candidate.createdAt : new Date().toISOString(),
      lastUsedAt: typeof candidate.lastUsedAt === "string" ? candidate.lastUsedAt : new Date().toISOString(),
      useCount: Math.max(1, Number(candidate.useCount) || 1),
    });
  }
  return result
    .sort((left, right) => Date.parse(right.lastUsedAt) - Date.parse(left.lastUsedAt))
    .slice(0, settings.searchHistoryLimit);
}

function recordSearchHistory(value, entry, settings = normalizeSearchSettings(), now = new Date()) {
  if (!settings.saveSearchHistory) return normalizeSearchHistory(value, settings);
  const type = entry?.kind === "url" || entry?.type === "directUrl" ? "directUrl" : "webSearch";
  const candidate = normalizeSearchHistory([{
    type,
    text: type === "directUrl" ? entry.url || entry.text : entry.input || entry.text,
    engineId: type === "webSearch" ? entry.engineId || settings.defaultSearchEngineId : null,
    createdAt: now.toISOString(),
    lastUsedAt: now.toISOString(),
    useCount: 1,
  }], settings)[0];
  const history = normalizeSearchHistory(value, settings);
  if (!candidate) return history;
  const index = history.findIndex((item) =>
    item.type === candidate.type &&
    item.engineId === candidate.engineId &&
    item.text.toLocaleLowerCase("zh-CN") === candidate.text.toLocaleLowerCase("zh-CN"));
  if (index >= 0) {
    candidate.id = history[index].id;
    candidate.createdAt = history[index].createdAt;
    candidate.useCount = history[index].useCount + 1;
    history.splice(index, 1);
  }
  history.unshift(candidate);
  return history.slice(0, settings.searchHistoryLimit);
}

class NavigationResolver {
  constructor(registry = new SearchEngineRegistry()) {
    this.registry = registry;
  }

  resolve(rawInput, options = {}) {
    const engine = this.registry.get(options.engineId) || this.registry.get("google");
    const target = resolveNavigationTarget(rawInput, {
      searchUrlTemplate: engine.searchUrlTemplate,
    });
    return { ...target, engineId: target.kind === "search" ? engine.id : null, engineName: target.kind === "search" ? engine.name : null };
  }
}

class SearchService {
  constructor(options = {}) {
    this.registry = options.registry || new SearchEngineRegistry();
    this.navigation = options.navigation || new NavigationResolver(this.registry);
  }

  resolve(rawInput, options = {}) {
    return this.navigation.resolve(rawInput, options);
  }

  search(rawInput, options = {}) {
    const input = String(rawInput || "").trim();
    if (!input) throw new Error("请输入搜索内容");
    const engine = this.registry.get(options.engineId) || this.registry.get("google");
    return {
      kind: "search",
      input,
      url: buildSearchUrl(input, engine.searchUrlTemplate),
      engineId: engine.id,
      engineName: engine.name,
    };
  }
}

class GlobalSearchService extends SearchService {
  snapshot(settings, history) {
    const normalizedSettings = normalizeSearchSettings(settings, this.registry);
    return {
      engines: this.registry.list(),
      settings: normalizedSettings,
      history: normalizeSearchHistory(history, normalizedSettings),
    };
  }
}

module.exports = {
  BUILTIN_SEARCH_ENGINES,
  GlobalSearchService,
  NavigationResolver,
  SearchEngineRegistry,
  SearchService,
  SENSITIVE_QUERY_KEYS,
  containsSensitiveAssignment,
  normalizeSearchHistory,
  normalizeSearchSettings,
  recordSearchHistory,
  sanitizeDirectUrlForHistory,
};
