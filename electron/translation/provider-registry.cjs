class TranslationProviderRegistry {
  constructor() {
    this.providers = new Map();
  }

  register(provider) {
    if (!provider?.id || typeof provider.translateSegments !== "function") {
      throw new TypeError("Translation provider is invalid");
    }
    this.providers.set(String(provider.id), provider);
    return provider;
  }

  get(id) {
    return this.providers.get(String(id || "")) || null;
  }

  list() {
    return Array.from(this.providers.values()).map((provider) => ({
      id: provider.id,
      name: provider.name,
      supportsLanguageDetection: provider.supportsLanguageDetection === true,
      maxBatchCharacters: provider.maxBatchCharacters,
    }));
  }
}

module.exports = { TranslationProviderRegistry };
