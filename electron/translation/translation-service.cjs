const { createHash } = require("node:crypto");
const { normalizeTranslationSettings } = require("./settings.cjs");
const { pronunciationForSelection } = require("./pronunciation-service.cjs");

const SECRET_REFERENCE = "translation:openai-compatible:default";

class TranslationService {
  constructor({ registry, secretStore, getSettings, saveSettings }) {
    this.registry = registry;
    this.secretStore = secretStore;
    this.getSettings = getSettings;
    this.saveSettings = saveSettings;
    this.cache = new Map();
    this.insightCache = new Map();
  }

  async status() {
    const settings = normalizeTranslationSettings(await this.getSettings());
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    const configured = Boolean(secret?.apiKey && settings.publicConfig.baseUrl && settings.publicConfig.model);
    let providerName = this.registry.get(settings.providerId)?.name || settings.providerId;
    try {
      if (/(?:^|\.)deepseek\.com$/i.test(new URL(settings.publicConfig.baseUrl).hostname)) providerName = "DeepSeek";
    } catch {}
    return {
      configured,
      providerId: settings.providerId,
      providerName,
      hasApiKey: Boolean(secret?.apiKey),
      settings,
      providers: this.registry.list(),
    };
  }

  async configure(input = {}) {
    const current = normalizeTranslationSettings(await this.getSettings());
    const defined = Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    );
    const definedPublicConfig = Object.fromEntries(
      Object.entries(input.publicConfig || {}).filter(([, value]) => value !== undefined),
    );
    const next = normalizeTranslationSettings({
      ...current,
      ...defined,
      publicConfig: { ...current.publicConfig, ...definedPublicConfig },
    });
    const apiKey = String(input.apiKey || "").trim();
    if (apiKey) await this.secretStore.set(SECRET_REFERENCE, { apiKey });
    if (input.clearApiKey === true) await this.secretStore.delete(SECRET_REFERENCE);
    await this.saveSettings(next);
    return this.status();
  }

  async providerOptions(signal) {
    const status = await this.status();
    if (!status.configured) {
      const error = Object.assign(new Error("翻译 Provider 尚未配置"), { code: "NOT_CONFIGURED" });
      throw error;
    }
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    return {
      ...status.settings.publicConfig,
      apiKey: secret.apiKey,
      sourceLanguage: status.settings.sourceLanguage,
      targetLanguage: status.settings.targetLanguage,
      signal,
    };
  }

  async translateSegments(segments, options = {}) {
    const status = await this.status();
    const provider = this.registry.get(status.providerId);
    if (!provider) {
      const error = Object.assign(new Error("翻译 Provider 不可用"), { code: "NOT_CONFIGURED" });
      throw error;
    }
    const clean = (Array.isArray(segments) ? segments : [])
      .map((item) => ({ segmentId: String(item.segmentId || ""), text: String(item.text || "") }))
      .filter((item) => item.segmentId && item.text.trim());
    const providerOptions = {
      ...(await this.providerOptions(options.signal)),
      sourceLanguage: options.sourceLanguage || status.settings.sourceLanguage,
      targetLanguage: options.targetLanguage || status.settings.targetLanguage,
    };
    const output = [];
    let batch = [];
    let batchCharacters = 0;
    const flush = async () => {
      if (!batch.length) return;
      const missing = [];
      const pendingByKey = new Map();
      for (const segment of batch) {
        const key = createHash("sha256").update(`${provider.id}\n${providerOptions.targetLanguage}\n${segment.text}`).digest("hex");
        const cached = this.cache.get(key);
        if (cached) output.push({ ...cached, segmentId: segment.segmentId });
        else if (pendingByKey.has(key)) pendingByKey.get(key).aliases.push(segment.segmentId);
        else {
          const pending = { ...segment, cacheKey: key, aliases: [] };
          pendingByKey.set(key, pending);
          missing.push(pending);
        }
      }
      if (missing.length) {
        let results;
        try {
          let attempt = 0;
          while (true) {
            try {
              results = await provider.translateSegments(missing, providerOptions);
              break;
            } catch (error) {
              const failure = /** @type {any} */ (error);
              const transient = ["NETWORK_ERROR", "REQUEST_TIMEOUT", "RATE_LIMITED", "API_ERROR"].includes(failure?.code);
              if (!transient || attempt >= 1 || providerOptions.signal?.aborted) throw error;
              attempt += 1;
              await new Promise((resolve) => setTimeout(resolve, 120));
            }
          }
        } catch (error) {
          const failure = /** @type {any} */ (error);
          if (missing.length <= 1 || failure?.code !== "INVALID_RESPONSE") throw error;
          results = [];
          for (const item of missing) {
            results.push(...await provider.translateSegments([item], providerOptions));
          }
        }
        for (const result of results) {
          const source = missing.find((item) => item.segmentId === result.segmentId);
          if (!source) continue;
          const cached = { translatedText: result.translatedText, detectedLanguage: result.detectedLanguage };
          this.cache.set(source.cacheKey, cached);
          output.push({ ...cached, segmentId: result.segmentId });
          for (const alias of source.aliases) output.push({ ...cached, segmentId: alias });
        }
        while (this.cache.size > 1000) this.cache.delete(this.cache.keys().next().value);
      }
      batch = [];
      batchCharacters = 0;
    };
    for (const segment of clean) {
      if (batch.length && batchCharacters + segment.text.length > provider.maxBatchCharacters) await flush();
      batch.push(segment);
      batchCharacters += segment.text.length;
    }
    await flush();
    const byId = new Map(output.map((item) => [item.segmentId, item]));
    return clean.map((item) => byId.get(item.segmentId)).filter(Boolean);
  }

  async testConnection(input = {}) {
    const current = normalizeTranslationSettings(await this.getSettings());
    const secret = await this.secretStore.get(SECRET_REFERENCE);
    const apiKey = String(input.apiKey || secret?.apiKey || "").trim();
    const settings = normalizeTranslationSettings({
      ...current,
      publicConfig: { ...current.publicConfig, ...(input.publicConfig || {}) },
    });
    const provider = this.registry.get(settings.providerId);
    if (!provider || !apiKey) {
      const error = Object.assign(new Error("请先填写 API Key"), { code: "NOT_CONFIGURED" });
      throw error;
    }
    return provider.testConnection({
      ...settings.publicConfig,
      apiKey,
      sourceLanguage: "auto",
      targetLanguage: settings.targetLanguage,
    });
  }

  async previewSelection(text) {
    const selectedText = String(text || "").trim();
    const status = await this.status();
    const pronunciation = status.settings.shortSelectionPronunciationMode !== "off"
      ? pronunciationForSelection(selectedText, {
          maxCharacters: status.settings.shortSelectionMaxCharacters,
        })
      : null;
    return {
      configured: status.configured,
      providerName: status.providerName,
      pronunciation,
      pronunciationOnly: Boolean(pronunciation && status.settings.shortSelectionPronunciationMode === "pronunciation-only"),
      queryKind: pronunciation ? "pronunciation" : "explanation",
    };
  }

  async querySelection(text, options = {}) {
    const selectedText = String(text || "").trim();
    const status = await this.status();
    const preview = await this.previewSelection(selectedText);
    const provider = this.registry.get(status.providerId);
    if (!provider || typeof provider.querySelection !== "function") {
      const error = Object.assign(new Error("当前 Provider 不支持划词查询"), { code: "NOT_CONFIGURED" });
      throw error;
    }
    const providerOptions = {
      ...(await this.providerOptions(options.signal)),
      pronunciation: preview.pronunciation,
    };
    const cacheKey = createHash("sha256")
      .update(`selection-insight\n${provider.id}\n${providerOptions.model}\n${preview.queryKind}\n${preview.pronunciation?.display || ""}\n${selectedText}`)
      .digest("hex");
    const cached = this.insightCache.get(cacheKey);
    if (cached) return { ...cached, providerName: status.providerName };
    let attempt = 0;
    let result;
    while (true) {
      try {
        result = await provider.querySelection(selectedText, providerOptions);
        break;
      } catch (error) {
        const failure = /** @type {any} */ (error);
        const transient = ["NETWORK_ERROR", "REQUEST_TIMEOUT", "RATE_LIMITED", "API_ERROR"].includes(failure?.code);
        if (!transient || attempt >= 1 || providerOptions.signal?.aborted) throw error;
        attempt += 1;
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
    }
    const normalized = {
      answer: String(result?.answer || "").trim(),
      pronunciation: result?.pronunciation || preview.pronunciation,
      queryKind: result?.queryKind || preview.queryKind,
      realtimeSearch: result?.realtimeSearch === true,
    };
    if (!normalized.answer) {
      const error = Object.assign(new Error("DeepSeek 没有返回可显示的查询结果"), { code: "INVALID_RESPONSE" });
      throw error;
    }
    this.insightCache.set(cacheKey, normalized);
    while (this.insightCache.size > 300) this.insightCache.delete(this.insightCache.keys().next().value);
    return { ...normalized, providerName: status.providerName };
  }

  async queryCompanion(task, input = {}, options = {}) {
    const status = await this.status();
    const provider = this.registry.get(status.providerId);
    if (!provider || typeof provider.completeCompanion !== "function") {
      const error = Object.assign(new Error("当前 DeepSeek Provider 不支持小序问答"), { code: "NOT_CONFIGURED" });
      throw error;
    }
    const payload = JSON.parse(JSON.stringify(input || {}));
    const result = await provider.completeCompanion(task, payload, {
      ...(await this.providerOptions(options.signal)),
      signal: options.signal,
    });
    return { answer: String(result?.answer || "").trim(), providerName: status.providerName };
  }

  clearMemoryCache() {
    this.cache.clear();
    this.insightCache.clear();
  }
}

module.exports = { SECRET_REFERENCE, TranslationService };
