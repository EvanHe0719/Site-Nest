const assert = require("node:assert/strict");
const test = require("node:test");

const {
  CompanionAIService,
  extractExplicitMemory,
  isPotentialAutoMemory,
  isSensitiveMemoryText,
  normalizeCompanionSettings,
  selectMemoryFactsForQuestion,
} = require("../../electron/companion/index.cjs");
const { createSafeSnapshot, createSyncEnvelope } = require("../../electron/google-drive-sync-data.cjs");
const { applyRemoteEnvelopeToState } = require("../../electron/google-sync-state.cjs");
const { createInitialState, migrateState } = require("../../electron/state-model.cjs");

const NOW = "2026-09-04T08:00:00.000Z";

function memoryState() {
  const state = createInitialState({ now: NOW, defaultSites: [] });
  state.uiSettings.companion = normalizeCompanionSettings({
    enabled: true,
    memory: { enabled: true, syncEnabled: true, maxTurns: 100, autoCapture: true },
  });
  return state;
}

test("v18 local conversation memory migrates once into the v19 personal collection", () => {
  const legacy = memoryState();
  legacy.version = 18;
  legacy.companionRuntimeState.conversationMemory = [
    { id: "legacy-user", role: "user", content: "旧问题", createdAt: NOW },
    { id: "legacy-answer", role: "assistant", content: "旧回答", createdAt: NOW },
  ];
  delete legacy.companionConversationEntries;
  delete legacy.companionMemoryFacts;

  const migrated = migrateState(legacy, { now: NOW }).state;
  assert.equal(migrated.version, 19);
  assert.deepEqual(migrated.companionConversationEntries.map((item) => item.id), ["legacy-user", "legacy-answer"]);
  assert.equal(migrated.companionConversationEntries.every((item) => item.workspaceId === "personal"), true);
  assert.equal(Object.hasOwn(migrated.companionRuntimeState, "conversationMemory"), false);
  assert.deepEqual(migrateState(migrated, { now: NOW }).state, migrated);
});

test("explicit memory accepts passwords while automatic capture rejects sensitive candidates", () => {
  const content = extractExplicitMemory("小序，请记住：测试站密码是 alpha-123");
  assert.equal(content, "测试站密码是 alpha-123");
  assert.equal(isSensitiveMemoryText(content), true);
  assert.equal(isPotentialAutoMemory("我的测试站密码是 alpha-123"), false);
  assert.equal(isPotentialAutoMemory("我长期偏好简洁的中文回答"), true);
});

test("automatic memory extraction uses the AI classifier and accepts only its bounded JSON fact", async () => {
  const calls = [];
  const service = new CompanionAIService({
    translationService: {
      queryCompanion: async (task, input) => {
        calls.push({ task, input });
        return { answer: '{"memory":"用户长期偏好简洁中文回答"}' };
      },
    },
  });
  const result = await service.run("memory-test", "memory", { question: "我长期偏好简洁中文回答", answer: "知道了" });
  assert.equal(result.memory, "用户长期偏好简洁中文回答");
  assert.equal(calls[0].task, "memory");
});

test("sensitive personal memory is selected only for a related question", () => {
  const facts = [
    { id: "secret", content: "测试站密码是 alpha-123", source: "explicit", sensitive: true, createdAt: NOW, updatedAt: NOW },
    { id: "preference", content: "用户偏好简洁中文回答", source: "automatic", createdAt: NOW, updatedAt: NOW },
  ];
  assert.equal(selectMemoryFactsForQuestion(facts, "今天天气如何").some((item) => item.id === "secret"), false);
  assert.equal(selectMemoryFactsForQuestion(facts, "我的测试站密码是什么").some((item) => item.id === "secret"), true);
});

test("Google snapshot syncs opted-in conversation and durable memory without redacting explicit password content", () => {
  const state = memoryState();
  state.companionConversationEntries = [
    { id: "q1", workspaceId: "personal", role: "user", content: "记住测试站密码", createdAt: NOW, updatedAt: NOW },
  ];
  state.companionMemoryFacts = [
    { id: "f1", workspaceId: "personal", content: "测试站密码是 alpha-123", source: "explicit", sensitive: true, createdAt: NOW, updatedAt: NOW },
  ];

  const snapshot = createSafeSnapshot(state);
  assert.equal(snapshot.syncOptions.companionMemory, true);
  assert.equal(snapshot.companionConversationEntries[0].workspaceId, "personal");
  assert.equal(snapshot.companionMemoryFacts[0].content, "测试站密码是 alpha-123");

  state.uiSettings.companion.memory.syncEnabled = false;
  const localOnly = createSafeSnapshot(state);
  assert.equal(localOnly.syncOptions.companionMemory, false);
  assert.deepEqual(localOnly.companionConversationEntries, []);
  assert.deepEqual(localOnly.companionMemoryFacts, []);
});

test("remote memory replaces or merges only when the snapshot explicitly enables the memory module", () => {
  const local = memoryState();
  local.companionMemoryFacts = [
    { id: "local", workspaceId: "personal", content: "本机事实", source: "explicit", createdAt: NOW, updatedAt: NOW },
  ];
  const remote = memoryState();
  remote.updatedAt = "2026-09-04T09:00:00.000Z";
  remote.companionMemoryFacts = [
    { id: "remote", workspaceId: "personal", content: "云端事实", source: "explicit", createdAt: remote.updatedAt, updatedAt: remote.updatedAt },
  ];

  const replaced = applyRemoteEnvelopeToState(local, createSyncEnvelope(remote)).state;
  assert.deepEqual(replaced.companionMemoryFacts.map((item) => item.id), ["remote"]);

  const merged = applyRemoteEnvelopeToState(local, createSyncEnvelope(remote), { mode: "merge" }).state;
  assert.deepEqual(merged.companionMemoryFacts.map((item) => item.id).sort(), ["local", "remote"]);

  remote.uiSettings.companion.memory.syncEnabled = false;
  const ignored = applyRemoteEnvelopeToState(local, createSyncEnvelope(remote)).state;
  assert.deepEqual(ignored.companionMemoryFacts.map((item) => item.id), ["local"]);
});
