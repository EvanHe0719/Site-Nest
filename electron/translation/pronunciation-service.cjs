const { pinyin, polyphonic } = require("pinyin-pro");

const DEFAULT_SHORT_SELECTION_MAX_CHARACTERS = 8;
const MAX_SHORT_SELECTION_CHARACTERS = 16;
const HAN_CHARACTER = /\p{Script=Han}/u;
const ALLOWED_SHORT_TERM = /^[\p{Script=Han}\p{P}\p{Z}\s]+$/u;

function normalizeShortSelectionMaxCharacters(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_SHORT_SELECTION_MAX_CHARACTERS;
  return Math.max(1, Math.min(MAX_SHORT_SELECTION_CHARACTERS, Math.round(numeric)));
}

function chineseCharacters(value) {
  return Array.from(String(value || "").normalize("NFKC")).filter((character) => HAN_CHARACTER.test(character));
}

function isShortChineseTerm(value, maxCharacters = DEFAULT_SHORT_SELECTION_MAX_CHARACTERS) {
  const text = String(value || "").normalize("NFKC").trim();
  if (!text || !ALLOWED_SHORT_TERM.test(text)) return false;
  const characters = chineseCharacters(text);
  return characters.length > 0 && characters.length <= normalizeShortSelectionMaxCharacters(maxCharacters);
}

function pronunciationForSelection(value, options = {}) {
  const text = String(value || "").normalize("NFKC").trim();
  const maxCharacters = normalizeShortSelectionMaxCharacters(options.maxCharacters);
  if (!isShortChineseTerm(text, maxCharacters)) return null;
  const characters = chineseCharacters(text);
  const phrase = characters.join("");
  const readings = pinyin(phrase, { type: "array", toneType: "symbol" });
  const allReadings = polyphonic(phrase, { type: "array", toneType: "symbol" });
  const items = characters.map((character, index) => ({
    character,
    pinyin: String(readings[index] || "").trim(),
  })).filter((item) => item.pinyin);
  const seenAlternatives = new Set();
  const alternatives = characters.flatMap((character, index) => {
    const values = Array.isArray(allReadings[index])
      ? Array.from(new Set(allReadings[index].map((item) => String(item || "").trim()).filter(Boolean)))
      : [];
    if (values.length <= 1) return [];
    const key = `${character}\n${values.join("/")}`;
    if (seenAlternatives.has(key)) return [];
    seenAlternatives.add(key);
    return [{ character, selected: items[index]?.pinyin || values[0], readings: values.slice(0, 8) }];
  });
  return {
    kind: "short-chinese-term",
    display: items.map((item) => item.pinyin).join(" "),
    items,
    alternatives,
    characterCount: characters.length,
    source: "local-dictionary",
  };
}

module.exports = {
  DEFAULT_SHORT_SELECTION_MAX_CHARACTERS,
  MAX_SHORT_SELECTION_CHARACTERS,
  chineseCharacters,
  isShortChineseTerm,
  normalizeShortSelectionMaxCharacters,
  pronunciationForSelection,
};
