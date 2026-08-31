const { randomUUID } = require("node:crypto");
const { parseUserScript } = require("./metadata-parser.cjs");

const REVIEW_TTL_MS = 15 * 60_000;
const MAX_SOURCE_BYTES = 1_048_576;
const MAX_REDIRECTS = 5;

function createBlankUserScriptSource(input = {}) {
  const name = String(input.name || "新建网页脚本").replace(/[\r\n]/g, " ").trim().slice(0, 120) || "新建网页脚本";
  const namespace = String(input.namespace || "local.qiye.userscripts").replace(/[\r\n]/g, " ").trim().slice(0, 200) || "local.qiye.userscripts";
  return `// ==UserScript==
// @name         ${name}
// @namespace    ${namespace}
// @version      0.1.0
// @description  在栖页中创建
// @match        https://example.com/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(() => {
  'use strict';
  // 在这里编写脚本。
})();
`;
}

function resolveUserScriptUpdateUrl(script) {
  const candidate = script?.downloadUrl || script?.updateUrl || script?.sourceUrl || null;
  if (!candidate) return null;
  let url;
  try { url = new URL(candidate); } catch { return null; }
  return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null;
}

async function readResponseWithLimit(response, maximumBytes = MAX_SOURCE_BYTES) {
  const declaredLength = Number(response.headers?.get?.("content-length") || 0);
  if (Number.isFinite(declaredLength) && declaredLength > maximumBytes) throw new Error("远程用户脚本不能超过 1 MB");
  const reader = response.body?.getReader?.();
  if (!reader) {
    const source = await response.text();
    if (Buffer.byteLength(source, "utf8") > maximumBytes) throw new Error("远程用户脚本不能超过 1 MB");
    return source;
  }
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = Buffer.from(value);
      size += chunk.length;
      if (size > maximumBytes) {
        await reader.cancel?.();
        throw new Error("远程用户脚本不能超过 1 MB");
      }
      chunks.push(chunk);
    }
  } finally {
    reader.releaseLock?.();
  }
  return Buffer.concat(chunks, size).toString("utf8");
}

function lineDiffSummary(previousSource, nextSource, limit = 80) {
  if (typeof previousSource !== "string") return null;
  const before = previousSource.split(/\r?\n/);
  const after = String(nextSource || "").split(/\r?\n/);
  let prefix = 0;
  while (prefix < before.length && prefix < after.length && before[prefix] === after[prefix]) prefix += 1;
  let suffix = 0;
  while (
    suffix < before.length - prefix &&
    suffix < after.length - prefix &&
    before[before.length - 1 - suffix] === after[after.length - 1 - suffix]
  ) suffix += 1;
  const removed = before.slice(prefix, before.length - suffix);
  const added = after.slice(prefix, after.length - suffix);
  const lines = [
    ...removed.map((line) => `- ${line}`),
    ...added.map((line) => `+ ${line}`),
  ];
  return {
    addedLines: added.length,
    removedLines: removed.length,
    truncated: lines.length > limit,
    preview: lines.slice(0, limit).join("\n") || "没有文本变化",
  };
}

function publicReview(script, reviewToken, options = {}) {
  const previous = options.previousScript && typeof options.previousScript === "object" ? options.previousScript : null;
  const difference = (before = [], after = []) => ({
    added: after.filter((item) => !before.includes(item)),
    removed: before.filter((item) => !after.includes(item)),
  });
  return {
    reviewToken,
    updateOf: options.updateOf || null,
    name: script.name,
    namespace: script.namespace,
    version: script.version,
    description: script.description,
    author: script.author,
    sourceType: script.sourceType,
    sourceUrl: script.sourceUrl,
    updateUrl: script.updateUrl,
    downloadUrl: script.downloadUrl,
    sourceHash: script.sourceHash,
    sourceBytes: Buffer.byteLength(script.sourceCode, "utf8"),
    sourcePreview: script.sourceCode.slice(0, 2000),
    matches: script.matches,
    includes: script.includes,
    excludes: script.excludes,
    runAt: script.runAt,
    grants: script.grants,
    connects: script.connects,
    requires: script.requires,
    resources: script.resources,
    compatibility: script.compatibility,
    changed: options.previousHash ? options.previousHash !== script.sourceHash : true,
    previousHash: options.previousHash || null,
    versionChange: previous ? { from: previous.version || null, to: script.version } : null,
    permissionChanges: previous ? difference(previous.grants || [], script.grants || []) : null,
    domainChanges: previous ? {
      matches: difference(previous.matches || [], script.matches || []),
      includes: difference(previous.includes || [], script.includes || []),
      excludes: difference(previous.excludes || [], script.excludes || []),
      connects: difference(previous.connects || [], script.connects || []),
    } : null,
    diff: lineDiffSummary(options.previousSourceCode, script.sourceCode),
  };
}

class UserScriptSourceService {
  constructor({ fetchFn, now = () => Date.now() } = {}) {
    this.fetchFn = fetchFn;
    this.now = now;
    this.reviews = new Map();
  }

  async review(input = {}, options = {}) {
    const sourceType = input.sourceType || "pasted";
    let sourceCode = String(input.sourceCode || "");
    let sourceUrl = input.sourceUrl ? String(input.sourceUrl) : null;
    if (sourceType === "remoteUrl") {
      sourceCode = await this._download(sourceUrl);
    } else if (sourceType === "createdInApp" && !sourceCode.trim()) {
      sourceCode = createBlankUserScriptSource(input);
    }
    const script = parseUserScript(sourceCode, {
      id: options.updateOf || input.id,
      sourceType,
      sourceUrl,
      workspaceIds: input.workspaceIds,
      browserProfileIds: input.browserProfileIds,
      enabled: input.enabled === true,
      lastCheckedAt: sourceType === "remoteUrl" ? new Date(this.now()).toISOString() : null,
      now: new Date(this.now()).toISOString(),
    });
    const reviewToken = randomUUID();
    this.reviews.set(reviewToken, {
      script,
      createdAt: this.now(),
      updateOf: options.updateOf || null,
    });
    this._prune();
    return publicReview(script, reviewToken, {
      updateOf: options.updateOf,
      previousHash: options.previousHash,
      previousSourceCode: options.previousSourceCode,
      previousScript: options.previousScript,
    });
  }

  consume(reviewToken) {
    const review = this.reviews.get(String(reviewToken || ""));
    this.reviews.delete(String(reviewToken || ""));
    if (!review || this.now() - review.createdAt > REVIEW_TTL_MS) throw new Error("脚本安装确认已过期，请重新检查");
    return review;
  }

  _prune() {
    for (const [token, value] of this.reviews) {
      if (this.now() - value.createdAt > REVIEW_TTL_MS) this.reviews.delete(token);
    }
  }

  async _download(rawUrl) {
    let url;
    try { url = new URL(rawUrl); } catch { throw new Error("远程脚本 URL 无效"); }
    if (url.protocol !== "https:") throw new Error("远程用户脚本只允许 HTTPS 来源");
    if (url.username || url.password) throw new Error("远程脚本 URL 不允许携带凭据");
    if (typeof this.fetchFn !== "function") throw new Error("远程脚本下载服务不可用");
    let currentUrl = url;
    for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount += 1) {
      const response = await this.fetchFn(currentUrl.toString(), {
        method: "GET",
        credentials: "omit",
        redirect: "manual",
        headers: { accept: "text/javascript, application/javascript, text/plain;q=0.8" },
      });
      if ([301, 302, 303, 307, 308].includes(response.status)) {
        if (redirectCount >= MAX_REDIRECTS) throw new Error("远程脚本重定向次数过多");
        const location = response.headers?.get?.("location");
        if (!location) throw new Error("远程脚本重定向缺少地址");
        await response.body?.cancel?.().catch?.(() => undefined);
        currentUrl = new URL(location, currentUrl);
        if (currentUrl.protocol !== "https:") throw new Error("远程脚本重定向只允许 HTTPS");
        if (currentUrl.username || currentUrl.password) throw new Error("远程脚本重定向不允许携带凭据");
        continue;
      }
      if (!response.ok) throw new Error(`远程脚本下载失败（HTTP ${response.status}）`);
      return readResponseWithLimit(response, MAX_SOURCE_BYTES);
    }
    throw new Error("远程脚本重定向次数过多");
  }
}

module.exports = {
  MAX_REDIRECTS,
  MAX_SOURCE_BYTES,
  REVIEW_TTL_MS,
  UserScriptSourceService,
  createBlankUserScriptSource,
  lineDiffSummary,
  publicReview,
  readResponseWithLimit,
  resolveUserScriptUpdateUrl,
};
