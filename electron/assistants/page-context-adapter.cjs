const { parsePageUrl } = require("./matcher.cjs");

const SELECTION_SCRIPT = `(() => {
  const selection = globalThis.getSelection?.();
  return selection ? String(selection).slice(0, 1000) : "";
})()`;

class PageContextUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = "PageContextUnavailableError";
    this.code = "PAGE_CONTEXT_UNAVAILABLE";
  }
}

class PageContextAdapter {
  constructor({ getWebContents, now = () => new Date() } = {}) {
    if (typeof getWebContents !== "function") {
      throw new TypeError("PageContextAdapter 需要 getWebContents");
    }
    this.getWebContents = getWebContents;
    this.now = now;
  }

  async getCurrentContext({ includeSelection = false } = {}) {
    const contents = await this.getWebContents();
    if (!contents || contents.isDestroyed?.()) {
      throw new PageContextUnavailableError("当前没有可读取的网页");
    }
    const url = String(contents.getURL?.() || "");
    const page = parsePageUrl(url);
    if (!page) throw new PageContextUnavailableError("当前页面不是可用的 HTTP 网页");

    let selectedText = null;
    if (includeSelection) {
      if (typeof contents.executeJavaScript !== "function") {
        selectedText = null;
      } else {
        selectedText = await contents
          .executeJavaScript(SELECTION_SCRIPT, true)
          .then((value) => String(value || "").slice(0, 1000))
          .catch(() => null);
      }
    }

    return Object.freeze({
      url,
      title: String(contents.getTitle?.() || "").trim().slice(0, 300),
      hostname: page.hostname,
      pathname: page.pathname,
      selectedText,
      timestamp: this.now().toISOString(),
    });
  }
}

module.exports = {
  PageContextAdapter,
  PageContextUnavailableError,
  SELECTION_SCRIPT,
};
