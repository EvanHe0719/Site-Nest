const { siteRuleForUrl } = require("./settings.cjs");

class PageTranslationController {
  constructor({ translationService, extractor, renderer, getSettings, confirmSensitive, onNotice }) {
    this.translationService = translationService;
    this.extractor = extractor;
    this.renderer = renderer;
    this.getSettings = getSettings;
    this.confirmSensitive = confirmSensitive;
    this.onNotice = onNotice;
    this.active = new Map();
  }

  key(context) {
    return String(context?.tabId || context?.view?.webContents?.id || "");
  }

  async translate(context, options = {}) {
    const contents = context?.view?.webContents;
    if (!contents || contents.isDestroyed()) return { applied: 0 };
    const settings = await this.getSettings();
    const pageUrl = contents.getURL();
    const rule = siteRuleForUrl(settings, pageUrl);
    if (rule?.mode === "never" && options.explicit !== true) return { applied: 0, skipped: "site-rule" };
    if (!options.dynamic && await this.confirmSensitive?.(pageUrl) === false) return { applied: 0, cancelled: true };
    const key = this.key(context);
    this.active.get(key)?.controller?.abort();
    const controller = new AbortController();
    const mode = options.mode || settings.defaultMode || "bilingual";
    this.active.set(key, { controller, mode, context, pageUrl });
    try {
      const extracted = await this.extractor.extract(contents, { onlyUntranslated: options.dynamic === true });
      if (!extracted.segments.length) {
        if (!options.dynamic) this.onNotice?.("当前页面没有可翻译的可见文字");
        return { applied: 0, blockedFrames: extracted.blockedFrames };
      }
      const results = await this.translationService.translateSegments(extracted.segments, { signal: controller.signal });
      const rendered = await this.renderer.apply(contents, results, { mode, observe: true });
      if (!options.dynamic) {
        const suffix = extracted.blockedFrames ? "；部分跨域框架未翻译" : "";
        this.onNotice?.(`已翻译 ${rendered.applied} 个文本块${suffix}`);
      }
      return { ...rendered, blockedFrames: extracted.blockedFrames };
    } catch (error) {
      const failure = /** @type {any} */ (error);
      if (failure?.code !== "CANCELLED") this.onNotice?.(failure?.message || "整页翻译失败", "error");
      return { applied: 0, error: failure?.code || "TRANSLATION_FAILED" };
    }
  }

  async translateDynamic(context) {
    const entry = this.active.get(this.key(context));
    if (!entry) return { applied: 0, skipped: "inactive" };
    return this.translate(context, { mode: entry.mode, dynamic: true, explicit: true });
  }

  async setMode(context, mode) {
    const contents = context?.view?.webContents;
    if (!contents || contents.isDestroyed()) return false;
    const entry = this.active.get(this.key(context));
    if (!entry) return this.translate(context, { mode, explicit: true });
    entry.mode = mode;
    await this.renderer.setMode(contents, mode);
    return true;
  }

  async restore(context) {
    const key = this.key(context);
    const entry = this.active.get(key);
    entry?.controller?.abort();
    this.active.delete(key);
    return this.renderer.restore(context?.view?.webContents);
  }

  clear(context) {
    const key = this.key(context);
    this.active.get(key)?.controller?.abort();
    this.active.delete(key);
  }

  state(context) {
    const entry = this.active.get(this.key(context));
    return entry ? { active: true, mode: entry.mode } : { active: false, mode: null };
  }
}

module.exports = { PageTranslationController };
