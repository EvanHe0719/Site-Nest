const { randomUUID } = require("node:crypto");

const PLATFORM_NAMES = Object.freeze({ win32: "windows", darwin: "macos", linux: "linux" });
const SCOPES = new Set(["app", "browser", "workspace", "modal"]);
const MODIFIER_ORDER = ["Mod", "Ctrl", "Alt", "Shift", "Meta"];

const DEFAULT_SHORTCUTS = Object.freeze([
  ["search.open", "全局与搜索", "app", "Mod+K", "在任何应用页面打开全局搜索"],
  ["browser.focus-address", "全局与搜索", "browser", "Mod+L", "聚焦并选中地址栏"],
  ["settings.open", "全局与搜索", "app", "Mod+,", "打开设置与数据"],
  ["sidebar.toggle", "全局与搜索", "app", "Mod+Shift+B", "收起或展开左侧栏"],
  ["google.sync", "全局与搜索", "app", "Mod+Alt+S", "立即执行记录级同步"],
  ["browser.back", "网页导航", "browser", "Alt+ArrowLeft", "返回上一页"],
  ["browser.forward", "网页导航", "browser", "Alt+ArrowRight", "前往下一页"],
  ["browser.reload", "网页导航", "browser", "Mod+R", "刷新当前网页"],
  ["page-actions.open", "网页导航", "browser", "Mod+.", "打开当前页面动作面板"],
  ["translation.page", "翻译与网页能力", "browser", "Mod+Shift+L", "打开当前页翻译菜单"],
  ["tab.new", "页签与页签组", "app", "Mod+T", "新建临时页签"],
  ["session.close", "页签与页签组", "browser", "Mod+W", "关闭当前页签"],
  ["tab.restore-closed", "页签与页签组", "app", "Mod+Shift+T", "恢复最近关闭的页签"],
  ["tab.next", "页签与页签组", "browser", "Mod+Tab", "切换到下一个页签"],
  ["tab.previous", "页签与页签组", "browser", "Mod+Shift+Tab", "切换到上一个页签"],
  ["tab.duplicate", "页签与页签组", "browser", "Mod+Shift+D", "复制当前页签"],
  ["workspace.personal", "工作空间", "workspace", "Mod+1", "切换到个人空间"],
  ["workspace.work", "工作空间", "workspace", "Mod+2", "切换到工作空间"],
  ["workspace.research", "工作空间", "workspace", "Mod+3", "切换到研究空间"],
  ["home.open", "工作空间", "workspace", "Mod+Shift+H", "打开当前空间聚合主页"],
  ["task.quick-create", "日程与记录", "app", "Mod+Shift+Enter", "打开创建日程窗口"],
  ["plan.open", "日程与记录", "workspace", "Mod+Shift+P", "打开日程页面"],
  ["timeline.quick-create", "日程与记录", "workspace", "Mod+Alt+T", "新增时间轴记录"],
  ["automation.open", "自动化与脚本", "workspace", "Mod+Shift+A", "打开自动化中心"],
  ["companion.expand", "AI 与关怀", "browser", "", "展开小序面板"],
  ["companion.ai.summarize", "AI 与关怀", "browser", "", "显式总结当前网页"],
].map(([actionId, category, scope, accelerator, description]) => Object.freeze({
  actionId, category, scope, accelerator, description,
})));

function platformName(value = process.platform) {
  if (["windows", "macos", "linux"].includes(value)) return value;
  return PLATFORM_NAMES[value] || (PLATFORM_NAMES[process.platform] || "linux");
}

function normalizeAccelerator(value) {
  const parts = String(value || "").split("+").map((part) => part.trim()).filter(Boolean);
  if (!parts.length) return "";
  const modifiers = new Set();
  let key = "";
  for (const raw of parts) {
    const lower = raw.toLowerCase();
    const modifier = { commandorcontrol: "Mod", cmdorctrl: "Mod", mod: "Mod", control: "Ctrl", ctrl: "Ctrl", option: "Alt", alt: "Alt", shift: "Shift", command: "Meta", cmd: "Meta", meta: "Meta", super: "Meta" }[lower];
    if (modifier) modifiers.add(modifier);
    else if (!key) key = /^f(?:[1-9]|1[0-9]|2[0-4])$/i.test(raw) ? raw.toUpperCase()
      : /^arrow(left|right|up|down)$/i.test(raw) ? `Arrow${raw.slice(5, 6).toUpperCase()}${raw.slice(6).toLowerCase()}`
        : raw.length === 1 ? raw.toUpperCase() : raw;
    else throw Object.assign(new Error("快捷键只能包含一个主按键"), { code: "SHORTCUT_INVALID" });
  }
  if (!key) throw Object.assign(new Error("快捷键缺少主按键"), { code: "SHORTCUT_KEY_REQUIRED" });
  return [...MODIFIER_ORDER.filter((item) => modifiers.has(item)), key].join("+");
}

function validateAccelerator(value, scope = "app") {
  const accelerator = normalizeAccelerator(value);
  if (!accelerator) return accelerator;
  const parts = accelerator.split("+");
  const key = parts.at(-1);
  const hasModifier = parts.length > 1;
  if (!hasModifier && !/^F(?:[1-9]|1[0-9]|2[0-4])$/.test(key)) {
    throw Object.assign(new Error("应用快捷键不能使用无修饰键的普通按键"), { code: "SHORTCUT_MODIFIER_REQUIRED" });
  }
  const forbidden = new Set(["Ctrl+Alt+Delete", "Meta+L", "Alt+F4"]);
  if (forbidden.has(accelerator)) throw Object.assign(new Error("该组合由操作系统保留，不能绑定"), { code: "SHORTCUT_SYSTEM_RESERVED" });
  if (SCOPES.has(scope) && /^Mod\+(?:C|V|X|A|Z)$/.test(accelerator)) {
    throw Object.assign(new Error("基础编辑快捷键已锁定，不能覆盖复制、粘贴、撤销或全选"), { code: "SHORTCUT_EDITING_RESERVED" });
  }
  return accelerator;
}

function displayAccelerator(value, platform) {
  const resolved = platformName(platform);
  return String(value || "").replace(/^Mod(?=\+|$)/, resolved === "macos" ? "Cmd" : "Ctrl");
}

function electronInputAccelerator(input = {}, platform = process.platform) {
  if (input.type && input.type !== "keyDown") return "";
  const resolved = platformName(platform);
  const keyValue = String(input.key || "");
  if (!keyValue || ["Control", "Shift", "Alt", "Meta"].includes(keyValue)) return "";
  const modifiers = [];
  const modPressed = resolved === "macos" ? input.meta : input.control;
  if (modPressed) modifiers.push("Mod");
  if (input.control && resolved === "macos") modifiers.push("Ctrl");
  if (input.alt) modifiers.push("Alt");
  if (input.shift) modifiers.push("Shift");
  if (input.meta && resolved !== "macos") modifiers.push("Meta");
  const aliases = { " ": "Space", Left: "ArrowLeft", Right: "ArrowRight", Up: "ArrowUp", Down: "ArrowDown" };
  const key = aliases[keyValue] || (keyValue.length === 1 ? keyValue.toUpperCase() : keyValue);
  try {
    return normalizeAccelerator([...modifiers, key].join("+"));
  } catch {
    return "";
  }
}

function scopesOverlap(left, right) {
  if (left === right) return true;
  if (left === "app" || right === "app") return true;
  if (left === "modal" || right === "modal") return false;
  return true;
}

class ShortcutConflictService {
  find(binding, bindings) {
    if (!binding.enabled || !binding.accelerator) return [];
    return bindings.filter((candidate) =>
      candidate.id !== binding.id && candidate.enabled && candidate.accelerator === binding.accelerator &&
      scopesOverlap(candidate.scope, binding.scope));
  }
}

class ShortcutRegistry {
  constructor(uiActionRegistry, options = {}) {
    this.uiActionRegistry = uiActionRegistry;
    this.platform = platformName(options.platform);
    this.conflicts = new ShortcutConflictService();
    this.defaults = DEFAULT_SHORTCUTS.filter((item) => uiActionRegistry.has(item.actionId));
  }

  profile(state, requestedPlatform = this.platform) {
    const platform = platformName(requestedPlatform);
    const existing = (state.shortcutProfiles || []).find((item) => item.platform === platform);
    return existing || { id: `shortcut-profile-${platform}`, platform, name: `${platform} 默认配置`, updatedAt: null };
  }

  bindings(state, requestedPlatform = this.platform) {
    const platform = platformName(requestedPlatform);
    const profile = this.profile(state, platform);
    const overrides = new Map((state.shortcutBindings || []).filter((item) => item.platform === platform).map((item) => [item.actionId, item]));
    return this.defaults.map((definition) => {
      const override = overrides.get(definition.actionId) || {};
      const accelerator = override.accelerator === null ? "" : normalizeAccelerator(override.accelerator || definition.accelerator);
      const action = this.uiActionRegistry.get(definition.actionId);
      return {
        id: `${platform}:${definition.actionId}`,
        profileId: profile.id,
        actionId: definition.actionId,
        label: action.label,
        description: definition.description,
        category: definition.category,
        platform,
        scope: definition.scope,
        accelerator,
        displayAccelerator: displayAccelerator(accelerator, platform),
        enabled: override.enabled !== false,
        isDefault: !overrides.has(definition.actionId) || (accelerator === definition.accelerator && override.enabled !== false),
        updatedAt: override.updatedAt || null,
      };
    });
  }

  snapshot(state, requestedPlatform = this.platform) {
    const bindings = this.bindings(state, requestedPlatform);
    const conflicts = bindings.flatMap((binding) => this.conflicts.find(binding, bindings)
      .filter((other) => binding.id.localeCompare(other.id) < 0)
      .map((other) => ({ bindingId: binding.id, otherBindingId: other.id, actionId: binding.actionId, otherActionId: other.actionId, accelerator: binding.accelerator })));
    return { platform: platformName(requestedPlatform), profile: this.profile(state, requestedPlatform), bindings, categories: Array.from(new Set(bindings.map((item) => item.category))), conflicts };
  }

  updateState(state, input = {}) {
    const platform = platformName(input.platform || this.platform);
    const current = this.bindings(state, platform);
    const existing = current.find((item) => item.actionId === String(input.actionId || ""));
    if (!existing) throw Object.assign(new Error("该动作未在快捷键注册表中启用"), { code: "SHORTCUT_ACTION_UNKNOWN" });
    const accelerator = input.accelerator === null || input.accelerator === "" ? "" : validateAccelerator(input.accelerator, existing.scope);
    const candidate = { ...existing, accelerator, enabled: input.enabled !== false };
    const conflicts = this.conflicts.find(candidate, current);
    if (conflicts.length && input.replaceConflict !== true) return { state, requiresResolution: true, binding: candidate, conflicts };
    const now = new Date().toISOString();
    const next = structuredClone(state);
    next.shortcutProfiles = Array.isArray(next.shortcutProfiles) ? next.shortcutProfiles : [];
    if (!next.shortcutProfiles.some((item) => item.platform === platform)) next.shortcutProfiles.push({ ...this.profile(state, platform), updatedAt: now });
    next.shortcutBindings = (Array.isArray(next.shortcutBindings) ? next.shortcutBindings : []).filter((item) => !(item.platform === platform && (item.actionId === existing.actionId || (input.replaceConflict === true && conflicts.some((conflict) => conflict.actionId === item.actionId)))));
    if (input.replaceConflict === true) {
      for (const conflict of conflicts) next.shortcutBindings.push({ ...conflict, accelerator: conflict.accelerator || null, enabled: false, isDefault: false, updatedAt: now });
    }
    next.shortcutBindings.push({ id: randomUUID(), profileId: this.profile(next, platform).id, actionId: existing.actionId, platform, scope: existing.scope, accelerator: accelerator || null, enabled: input.enabled !== false, isDefault: accelerator === this.defaults.find((item) => item.actionId === existing.actionId)?.accelerator && input.enabled !== false, updatedAt: now });
    return { state: next, requiresResolution: false };
  }

  resetState(state, options = {}) {
    const platform = platformName(options.platform || this.platform);
    const actionIds = new Set(this.defaults.filter((item) =>
      (!options.category || item.category === options.category) &&
      (!options.actionId || item.actionId === options.actionId)).map((item) => item.actionId));
    return { ...structuredClone(state), shortcutBindings: (state.shortcutBindings || []).filter((item) => item.platform !== platform || !actionIds.has(item.actionId)) };
  }
}

class ShortcutDispatcher {
  constructor(shortcutRegistry, uiActionRegistry) {
    this.shortcutRegistry = shortcutRegistry;
    this.uiActionRegistry = uiActionRegistry;
  }

  async authorize(state, request = {}) {
    const binding = this.shortcutRegistry.bindings(state, request.platform).find((item) => item.actionId === request.actionId);
    if (!binding || !binding.enabled || !binding.accelerator) return { ok: false, errorCode: "SHORTCUT_DISABLED", message: "该快捷键已禁用" };
    if (request.accelerator && normalizeAccelerator(request.accelerator) !== binding.accelerator) {
      return { ok: false, errorCode: "SHORTCUT_BINDING_MISMATCH", message: "快捷键配置已经变化，请重试" };
    }
    const action = await this.uiActionRegistry.resolve(binding.actionId, request.context || {});
    if (!action?.canExecute) return { ok: false, errorCode: "UI_ACTION_UNAVAILABLE", message: action?.unavailableReason || "当前无法执行该动作" };
    return { ok: true, actionId: binding.actionId, scope: binding.scope };
  }
}

module.exports = { DEFAULT_SHORTCUTS, ShortcutConflictService, ShortcutDispatcher, ShortcutRegistry, displayAccelerator, electronInputAccelerator, normalizeAccelerator, platformName, scopesOverlap, validateAccelerator };
