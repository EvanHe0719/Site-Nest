const { randomUUID } = require("node:crypto");
const { parseUserScript } = require("./metadata-parser.cjs");

const REVIEW_TTL_MS = 15 * 60_000;

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
    sourceHash: script.sourceHash,
    sourceBytes: Buffer.byteLength(script.sourceCode, "utf8"),
    sourcePreview: script.sourceCode.slice(0, 2000),
    matches: script.matches,
    includes: script.includes,
    excludes: script.excludes,
    runAt: script.runAt,
    grants: script.grants,
    connects: script.connects,
    compatibility: script.compatibility,
    changed: options.previousHash ? options.previousHash !== script.sourceHash : true,
    previousHash: options.previousHash || null,
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
    }
    const script = parseUserScript(sourceCode, {
      id: options.updateOf || input.id,
      sourceType,
      sourceUrl,
      workspaceIds: input.workspaceIds,
      browserProfileIds: input.browserProfileIds,
      enabled: input.enabled === true,
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
    if (typeof this.fetchFn !== "function") throw new Error("远程脚本下载服务不可用");
    const response = await this.fetchFn(url.toString(), {
      method: "GET",
      credentials: "omit",
      redirect: "follow",
      headers: { accept: "text/javascript, application/javascript, text/plain;q=0.8" },
    });
    if (!response.ok) throw new Error(`远程脚本下载失败（HTTP ${response.status}）`);
    const contentLength = Number(response.headers?.get?.("content-length") || 0);
    if (contentLength > 1_048_576) throw new Error("远程用户脚本不能超过 1 MB");
    const source = await response.text();
    if (Buffer.byteLength(source, "utf8") > 1_048_576) throw new Error("远程用户脚本不能超过 1 MB");
    return source;
  }
}

module.exports = { REVIEW_TTL_MS, UserScriptSourceService, lineDiffSummary, publicReview };
