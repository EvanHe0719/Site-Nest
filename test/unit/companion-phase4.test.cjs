const assert = require("node:assert/strict");
const test = require("node:test");
const { CompanionAIService, classifyPageForAI, summaryExtractionScript } = require("../../electron/companion/index.cjs");
const { TranslationProviderRegistry, TranslationService } = require("../../electron/translation/index.cjs");

test("page AI guard blocks auth pages and requires confirmation classification for sensitive systems", () => {
  assert.deepEqual(classifyPageForAI("https://accounts.zoho.com/signin?token=secret").allowed, false);
  const zoho = classifyPageForAI("https://desk.zoho.com.cn/agent/tickets/details/123?token=secret#reply");
  assert.equal(zoho.allowed, true);
  assert.equal(zoho.sensitive, true);
  assert.equal(zoho.safeUrl, "https://desk.zoho.com.cn/agent/tickets/details/123");
  assert.equal(classifyPageForAI("https://example.com/article").sensitive, false);
});

test("explicit page extraction excludes forms, editable, hidden and remote companion UI with a hard text cap", () => {
  const script = summaryExtractionScript(15_000);
  assert.match(script, /input,textarea,select,option,button,\[contenteditable\]/);
  assert.match(script, /\[aria-hidden="true"\],\[hidden\]/);
  assert.match(script, /data-qiye-translation-ui/);
  assert.match(script, /length<15000/);
  assert.doesNotMatch(script, /localStorage|sessionStorage|document\.cookie/);
});

test("companion AI reuses TranslationService provider and the same safe secret reference", async () => {
  const calls = [];
  const provider = {
    id: "openai-compatible",
    name: "DeepSeek",
    maxBatchCharacters: 12_000,
    translateSegments: async () => [],
    completeCompanion: async (task, input, options) => { calls.push({ task, input, options }); return { answer: "简短回答" }; },
  };
  const registry = new TranslationProviderRegistry();
  registry.register(provider);
  const secretStore = { get: async (key) => { calls.push({ secretKey: key }); return { apiKey: "kept-in-main" }; } };
  const translation = new TranslationService({ registry, secretStore, getSettings: async () => ({ providerId: "openai-compatible", publicConfig: { baseUrl: "https://api.deepseek.com", model: "deepseek-chat" } }), saveSettings: async () => undefined });
  const service = new CompanionAIService({ translationService: translation });
  const result = await service.run("ask-1", "ask", { question: "你好", memoryEnabled: true, history: [
    { id: "1", role: "user", content: "记住我喜欢简短回答", createdAt: "2026-09-04T01:00:00.000Z" },
    { id: "2", role: "assistant", content: "好的", createdAt: "2026-09-04T01:00:01.000Z" },
  ] });
  assert.equal(result.answer, "简短回答");
  assert.ok(calls.some((item) => item.secretKey === "translation:openai-compatible:default"));
  const askCall = calls.find((item) => item.task === "ask");
  assert.equal(askCall.options.apiKey, "kept-in-main");
  assert.deepEqual(askCall.input.history.map((item) => item.content), ["记住我喜欢简短回答", "好的"]);
  assert.equal(askCall.input.memoryEnabled, true);
});

test("closing companion can cancel an in-flight AI request", async () => {
  let signal;
  const translationService = {
    status: async () => ({ configured: true, providerName: "DeepSeek" }),
    queryCompanion: async (_task, _input, options) => {
      signal = options.signal;
      return new Promise((_resolve, reject) => options.signal.addEventListener("abort", () => reject(Object.assign(new Error("cancelled"), { code: "CANCELLED" })), { once: true }));
    },
  };
  const service = new CompanionAIService({ translationService });
  const pending = service.run("request-1", "ask", { question: "请回答" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(service.cancel("request-1"), true);
  assert.equal(signal.aborted, true);
  await assert.rejects(pending, (error) => error.code === "CANCELLED");
});
