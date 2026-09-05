const { createHash } = require("node:crypto");

const DEFAULT_MEMORY_TURNS = 100;
const MIN_MEMORY_TURNS = 20;
const MAX_MEMORY_TURNS = 200;
const MAX_MEMORY_FACTS = 200;

function clampTurns(value, fallback = DEFAULT_MEMORY_TURNS) {
  const number = Number(value);
  return Number.isFinite(number)
    ? Math.max(MIN_MEMORY_TURNS, Math.min(MAX_MEMORY_TURNS, Math.round(number)))
    : fallback;
}

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function stableId(prefix, parts) {
  return `${prefix}-${createHash("sha256").update(parts.join("\n")).digest("hex").slice(0, 24)}`;
}

function normalizeConversationMemory(value, options = {}) {
  const maxTurns = clampTurns(options.maxTurns);
  const entries = Array.isArray(value) ? value : [];
  return entries.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const role = candidate.role === "assistant" ? "assistant" : candidate.role === "user" ? "user" : "";
    const content = String(candidate.content || "").trim().slice(0, 3_000);
    if (!role || !content) return [];
    const createdAt = isoOrNull(candidate.createdAt);
    const updatedAt = isoOrNull(candidate.updatedAt) || createdAt;
    const id = String(candidate.id || "").trim().slice(0, 120)
      || stableId("conversation", [role, content, createdAt || "", String(index)]);
    return [{
      id,
      workspaceId: "personal",
      role,
      content,
      createdAt,
      updatedAt,
    }];
  }).slice(-(maxTurns * 2));
}

function normalizeMemoryFacts(value) {
  const entries = Array.isArray(value) ? value : [];
  const normalized = entries.flatMap((candidate, index) => {
    if (!candidate || typeof candidate !== "object") return [];
    const content = String(candidate.content || "").trim().slice(0, 1_000);
    if (!content) return [];
    const source = candidate.source === "automatic" ? "automatic" : "explicit";
    const createdAt = isoOrNull(candidate.createdAt);
    const updatedAt = isoOrNull(candidate.updatedAt) || createdAt;
    const id = String(candidate.id || "").trim().slice(0, 120)
      || stableId("memory", [content, source, createdAt || "", String(index)]);
    return [{
      id,
      workspaceId: "personal",
      content,
      source,
      sensitive: candidate.sensitive === true,
      createdAt,
      updatedAt,
    }];
  });
  const byContent = new Map();
  for (const fact of normalized) {
    const key = fact.content.replace(/\s+/g, " ").trim().toLocaleLowerCase("zh-CN");
    const previous = byContent.get(key);
    if (!previous || Date.parse(fact.updatedAt || fact.createdAt || 0) >= Date.parse(previous.updatedAt || previous.createdAt || 0)) {
      byContent.set(key, fact);
    }
  }
  return Array.from(byContent.values())
    .sort((left, right) => Date.parse(left.updatedAt || left.createdAt || 0) - Date.parse(right.updatedAt || right.createdAt || 0))
    .slice(-MAX_MEMORY_FACTS);
}

function extractExplicitMemory(value) {
  const text = String(value || "").trim().slice(0, 4_000);
  if (!text) return "";
  const match = text.match(/^(?:小序[，,:：\s]*)?(?:(?:请|麻烦|帮)(?:你|我)?\s*)?(?:记住|记得|记忆|记一下|记下来|记牢)(?:这件事|这个|一下)?[，,:：\s]*(.+)$/su);
  return String(match?.[1] || "").trim().slice(0, 1_000);
}

function isSensitiveMemoryText(value) {
  const text = String(value || "");
  return /(?:密码|口令|密钥|秘钥|验证码|动态码|支付码|银行卡|信用卡|身份证|token|api[\s_-]*key|secret|private[\s_-]*key|password|passcode|otp|cvv|bearer\s+[a-z0-9._~+/=-]+)/iu.test(text);
}

function isPotentialAutoMemory(value) {
  const text = String(value || "").trim();
  if (!text || isSensitiveMemoryText(text)) return false;
  return /(?:我(?:叫|是|喜欢|偏好|习惯|不喜欢|讨厌|通常|一直|正在|打算|计划|希望|需要)|我的(?:目标|习惯|偏好|工作|项目|生日|纪念日)|以后(?:都|请|不要)|长期|固定(?:在|用|要)|对我来说很重要)/u.test(text);
}

function boundedConversationContext(value, options = {}) {
  const maxTurns = clampTurns(options.maxTurns);
  const maxCharacters = Math.max(4_000, Math.min(60_000, Number(options.maxCharacters) || 30_000));
  const normalized = normalizeConversationMemory(value, { maxTurns });
  const selected = [];
  let used = 0;
  for (let index = normalized.length - 1; index >= 0; index -= 1) {
    const entry = normalized[index];
    if (selected.length && used + entry.content.length > maxCharacters) break;
    selected.unshift(entry);
    used += entry.content.length;
  }
  return selected;
}

function memorySearchTokens(value) {
  const text = String(value || "").toLocaleLowerCase("zh-CN");
  const latin = text.match(/[a-z0-9][a-z0-9._-]{1,}/gi) || [];
  const chineseRuns = text.match(/[\p{Script=Han}]{2,}/gu) || [];
  const chinese = chineseRuns.flatMap((run) => {
    const parts = [run];
    for (let index = 0; index < run.length - 1; index += 1) parts.push(run.slice(index, index + 2));
    return parts;
  });
  return Array.from(new Set([...latin, ...chinese])).filter((token) => !["我的", "什么", "多少", "记得", "记忆", "一下"].includes(token));
}

function selectMemoryFactsForQuestion(value, question, options = {}) {
  const facts = normalizeMemoryFacts(value);
  const tokens = memorySearchTokens(question);
  const maximum = Math.max(1, Math.min(50, Number(options.maximum) || 30));
  const maxCharacters = Math.max(2_000, Math.min(30_000, Number(options.maxCharacters) || 20_000));
  const ranked = facts.map((fact, index) => {
    const content = fact.content.toLocaleLowerCase("zh-CN");
    const score = tokens.reduce((total, token) => total + (content.includes(token) ? Math.max(2, token.length) : 0), 0);
    return { fact, score, index };
  }).sort((left, right) => right.score - left.score || right.index - left.index);
  const selected = [];
  let used = 0;
  for (const item of ranked) {
    if (selected.length >= maximum) break;
    if (item.fact.sensitive && item.score <= 0) continue;
    if (selected.length && used + item.fact.content.length > maxCharacters) continue;
    selected.push(item.fact);
    used += item.fact.content.length;
  }
  return selected;
}

module.exports = {
  DEFAULT_MEMORY_TURNS,
  MAX_MEMORY_FACTS,
  MAX_MEMORY_TURNS,
  MIN_MEMORY_TURNS,
  boundedConversationContext,
  clampTurns,
  extractExplicitMemory,
  isPotentialAutoMemory,
  isSensitiveMemoryText,
  normalizeConversationMemory,
  normalizeMemoryFacts,
  selectMemoryFactsForQuestion,
};
