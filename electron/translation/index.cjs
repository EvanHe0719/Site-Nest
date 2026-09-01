const { OpenAICompatibleTranslationProvider, TranslationProviderError } = require("./openai-compatible-provider.cjs");
const { TranslationProviderRegistry } = require("./provider-registry.cjs");
const { TranslationService } = require("./translation-service.cjs");
const { PageTextExtractor } = require("./page-text-extractor.cjs");
const { PageTranslationRenderer } = require("./page-translation-renderer.cjs");
const { PageTranslationController } = require("./page-translation-controller.cjs");
const { SelectionActionService, insightPopoverScript } = require("./selection-action-service.cjs");
const {
  DEFAULT_SHORT_SELECTION_MAX_CHARACTERS,
  isShortChineseTerm,
  pronunciationForSelection,
} = require("./pronunciation-service.cjs");
const {
  DEFAULT_TRANSLATION_BASE_URL,
  DEFAULT_TRANSLATION_MODEL,
  normalizeTranslationSettings,
  isSensitiveTranslationUrl,
  siteRuleForUrl,
} = require("./settings.cjs");

module.exports = {
  OpenAICompatibleTranslationProvider,
  PageTextExtractor,
  PageTranslationController,
  PageTranslationRenderer,
  SelectionActionService,
  TranslationProviderError,
  TranslationProviderRegistry,
  TranslationService,
  DEFAULT_TRANSLATION_BASE_URL,
  DEFAULT_TRANSLATION_MODEL,
  DEFAULT_SHORT_SELECTION_MAX_CHARACTERS,
  insightPopoverScript,
  isSensitiveTranslationUrl,
  isShortChineseTerm,
  normalizeTranslationSettings,
  pronunciationForSelection,
  siteRuleForUrl,
};
