const assert = require("node:assert/strict");
const test = require("node:test");

const {
  OpenAICompatibleTranslationProvider,
  PageTranslationController,
  SelectionActionService,
  TranslationProviderRegistry,
  TranslationService,
  isSensitiveTranslationUrl,
  normalizeTranslationSettings,
  siteRuleForUrl,
} = require("../../electron/translation/index.cjs");
const {
  endpointForBaseUrl,
  normalizeProviderResults,
} = require("../../electron/translation/openai-compatible-provider.cjs");

test("translation settings normalize public fields and identify sensitive sites", () => {
  const settings = normalizeTranslationSettings({
    publicConfig: { baseUrl: "https://user:pass@translator.example/v1?api_key=must-drop#secret", model: "m1", apiKey: "must-drop" },
    targetLanguage: "en",
    selectionButtonEnabled: false,
    siteRules: [
      { hostnamePattern: "desk.zoho.com", mode: "always", privacyAllowed: true },
      { hostnamePattern: "desk.zoho.com", mode: "never" },
    ],
  });
  assert.deepEqual(settings.publicConfig, { baseUrl: "https://translator.example/v1", model: "m1" });
  assert.equal(JSON.stringify(settings).includes("must-drop"), false);
  assert.equal(settings.selectionButtonEnabled, false);
  assert.equal(settings.siteRules.length, 1);
  assert.equal(siteRuleForUrl(settings, "https://desk.zoho.com/agent/tickets/1").privacyAllowed, true);
  assert.equal(isSensitiveTranslationUrl("https://accounts.sap.com/saml2/idp/sso"), true);
  assert.equal(isSensitiveTranslationUrl("https://example.com/article"), false);
});

test("OpenAI-compatible endpoint requires HTTPS except for a local provider", () => {
  assert.equal(endpointForBaseUrl("https://api.example/v1"), "https://api.example/v1/chat/completions");
  assert.equal(endpointForBaseUrl("http://127.0.0.1:8080/v1"), "http://127.0.0.1:8080/v1/chat/completions");
  assert.throws(() => endpointForBaseUrl("http://remote.example/v1"), /HTTPS/);
});

test("OpenAI-compatible provider returns segment-aligned JSON and rejects missing items", async () => {
  let request;
  const provider = new OpenAICompatibleTranslationProvider({
    fetchFn: async (url, options) => {
      request = { url, options };
      return {
        ok: true,
        json: async () => ({
          choices: [{ message: { content: JSON.stringify({ items: [
            { segmentId: "s1", translatedText: "你好", detectedLanguage: "en" },
          ] }) } }],
        }),
      };
    },
  });
  const results = await provider.translateSegments([{ segmentId: "s1", text: "Hello" }], {
    baseUrl: "https://api.example/v1",
    model: "translator",
    apiKey: "test-key",
    targetLanguage: "zh-CN",
  });
  assert.deepEqual(results, [{ segmentId: "s1", translatedText: "你好", detectedLanguage: "en" }]);
  assert.equal(request.url, "https://api.example/v1/chat/completions");
  assert.equal(request.options.headers.authorization, "Bearer test-key");
  assert.throws(
    () => normalizeProviderResults({ items: [] }, [{ segmentId: "missing", text: "x" }]),
    /一一对应/,
  );
});

test("TranslationService stores only the API key in the encrypted secret store", async () => {
  let settings = normalizeTranslationSettings();
  const secrets = new Map();
  const registry = new TranslationProviderRegistry();
  let calls = 0;
  registry.register({
    id: "openai-compatible",
    name: "Fixture Provider",
    supportsLanguageDetection: true,
    maxBatchCharacters: 100,
    translateSegments: async (segments) => {
      calls += 1;
      return segments.map((segment) => ({
        segmentId: segment.segmentId,
        translatedText: `T:${segment.text}`,
        detectedLanguage: "en",
      }));
    },
    testConnection: async () => ({ ok: true }),
  });
  const service = new TranslationService({
    registry,
    secretStore: {
      get: async (key) => secrets.get(key) || null,
      set: async (key, value) => secrets.set(key, structuredClone(value)),
      delete: async (key) => secrets.delete(key),
    },
    getSettings: async () => settings,
    saveSettings: async (next) => { settings = structuredClone(next); },
  });
  await service.configure({
    publicConfig: { baseUrl: "https://api.example/v1", model: "translator" },
    apiKey: "private-key",
    targetLanguage: "zh-CN",
  });
  assert.equal(JSON.stringify(settings).includes("private-key"), false);
  assert.equal(Array.from(secrets.values())[0].apiKey, "private-key");
  const first = await service.translateSegments([{ segmentId: "a", text: "Hello" }]);
  const second = await service.translateSegments([{ segmentId: "b", text: "Hello" }]);
  assert.equal(first[0].translatedText, "T:Hello");
  assert.equal(second[0].translatedText, "T:Hello");
  assert.equal(calls, 1, "in-memory translation cache should prevent a duplicate request");
});

test("selection translation reads only the explicitly supplied text and clears memory", async () => {
  const scripts = [];
  const contents = {
    id: 9,
    isDestroyed: () => false,
    getURL: () => "https://example.com/article",
    executeJavaScript: async (script) => { scripts.push(script); return true; },
  };
  const service = new SelectionActionService({
    translationService: {
      status: async () => ({ configured: true, providerName: "Fixture", settings: { targetLanguage: "zh-CN" } }),
      translateSegments: async (segments) => [{ segmentId: "selection", translatedText: `译:${segments[0].text}`, detectedLanguage: "en" }],
    },
    confirmSensitive: async () => true,
  });
  await service.translate({ webContents: contents, text: "Chosen text", x: 40, y: 50 });
  assert.equal(service.memory.get(9).text, "Chosen text");
  assert.equal(scripts.length, 2);
  assert.match(scripts[1], /译:Chosen text/);
  service.clear(contents);
  assert.equal(service.memory.has(9), false);
});

test("page controller batches extracted text, applies a reversible mode and disconnects on restore", async () => {
  const calls = [];
  const contents = { id: 7, isDestroyed: () => false, getURL: () => "https://example.com/article" };
  const context = { tabId: "tab-1", view: { webContents: contents } };
  const controller = new PageTranslationController({
    translationService: {
      translateSegments: async (segments) => segments.map((item) => ({ segmentId: item.segmentId, translatedText: `T:${item.text}` })),
    },
    extractor: { extract: async () => ({ segments: [{ segmentId: "p1", text: "Paragraph" }], blockedFrames: 1 }) },
    renderer: {
      apply: async (_contents, results, options) => { calls.push(["apply", results, options]); return { applied: results.length }; },
      setMode: async (_contents, mode) => calls.push(["mode", mode]),
      restore: async () => { calls.push(["restore"]); return { restored: 1 }; },
    },
    getSettings: async () => normalizeTranslationSettings(),
    confirmSensitive: async () => true,
  });
  const result = await controller.translate(context, { mode: "bilingual", explicit: true });
  assert.equal(result.applied, 1);
  assert.equal(result.blockedFrames, 1);
  await controller.setMode(context, "translated");
  await controller.restore(context);
  assert.deepEqual(calls.map((item) => item[0]), ["apply", "mode", "restore"]);
  assert.deepEqual(controller.state(context), { active: false, mode: null });
});
