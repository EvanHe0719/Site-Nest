const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_CRITICAL_CONTROL_SCOPE = Object.freeze({
  includeAll: false,
  includeMarked: true,
  ids: Object.freeze([]),
  idPatterns: Object.freeze([]),
  actionIds: Object.freeze([]),
  excludeIds: Object.freeze([]),
  excludeIdPatterns: Object.freeze([]),
  allowRepeatedActionIds: Object.freeze([]),
  ignoreNativeCloseControls: true,
  ignoreNativeFormControls: true,
});

const SEVERITY_ORDER = Object.freeze({ error: 0, warning: 1, info: 2 });

function lineNumberAt(source, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (source.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function normalizeSources(value, fallbackPrefix) {
  if (!value) return [];
  if (typeof value === "string") {
    return [{ file: `${fallbackPrefix}-1`, source: value }];
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => {
      if (typeof item === "string") {
        return { file: `${fallbackPrefix}-${index + 1}`, source: item };
      }
      if (!item || typeof item !== "object") {
        throw new TypeError(`${fallbackPrefix} sources must contain strings or objects`);
      }
      return {
        file: String(item.file || item.path || `${fallbackPrefix}-${index + 1}`),
        source: String(item.source ?? item.content ?? ""),
      };
    });
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([file, source]) => ({
      file,
      source: String(source ?? ""),
    }));
  }
  throw new TypeError(`${fallbackPrefix} sources must be a string, array, or object map`);
}

function parseAttributes(rawAttributes) {
  const attributes = Object.create(null);
  const present = new Set();
  const pattern = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match;
  while ((match = pattern.exec(rawAttributes))) {
    const name = match[1].toLowerCase();
    present.add(name);
    attributes[name] = match[2] ?? match[3] ?? match[4] ?? "";
  }
  return { attributes, present };
}

function parseControls(htmlSources) {
  const controls = [];
  for (const item of htmlSources) {
    const formStack = [];
    const tagPattern = /<\/?([A-Za-z][\w:-]*)(\s[^<>]*?)?\s*\/?>/g;
    let match;
    while ((match = tagPattern.exec(item.source))) {
      const tag = match[1].toLowerCase();
      const closing = /^<\s*\//.test(match[0]);
      if (closing) {
        if (tag === "form") formStack.pop();
        continue;
      }
      const parsed = parseAttributes(match[2] || "");
      if (tag === "form") {
        formStack.push(String(parsed.attributes.id || "").trim());
      }
      const role = String(parsed.attributes.role || "").toLowerCase();
      const isNativeControl = ["button", "a", "input", "select", "textarea", "form"].includes(tag);
      const isMarkedControl =
        parsed.present.has("data-action-id") ||
        parsed.present.has("data-ui-action-required") ||
        role === "button" ||
        parsed.present.has("onclick");
      if (!isNativeControl && !isMarkedControl) continue;
      controls.push({
        file: item.file,
        line: lineNumberAt(item.source, match.index),
        sourceIndex: match.index,
        raw: match[0],
        tag,
        attributes: parsed.attributes,
        present: parsed.present,
        id: String(parsed.attributes.id || "").trim(),
        actionId: String(
          parsed.attributes["data-action-id"] || parsed.attributes["action-id"] || "",
        ).trim(),
        parentFormId: formStack.at(-1) || "",
      });
    }
  }
  return controls;
}

function toPatterns(values) {
  return (Array.isArray(values) ? values : []).map((value) => {
    if (value instanceof RegExp) return value;
    const text = String(value || "");
    if (!text) return /$a/;
    if (text.includes("*")) {
      const escaped = text.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
      return new RegExp(`^${escaped}$`);
    }
    return new RegExp(text);
  });
}

function matchesAny(value, patterns) {
  if (!value) return false;
  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(value);
  });
}

function normalizeScope(scope = {}) {
  const merged = { ...DEFAULT_CRITICAL_CONTROL_SCOPE, ...(scope || {}) };
  return {
    includeAll: merged.includeAll === true,
    includeMarked: merged.includeMarked !== false,
    ids: new Set([...(merged.ids || []), ...(merged.controlIds || [])].map(String)),
    idPatterns: toPatterns([
      ...(merged.idPatterns || []),
      ...(merged.controlIdPatterns || []),
    ]),
    actionIds: new Set((merged.actionIds || []).map(String)),
    excludeIds: new Set((merged.excludeIds || []).map(String)),
    excludeIdPatterns: toPatterns(merged.excludeIdPatterns || []),
    allowRepeatedActionIds: new Set((merged.allowRepeatedActionIds || []).map(String)),
    ignoreNativeCloseControls: merged.ignoreNativeCloseControls !== false,
    ignoreNativeFormControls: merged.ignoreNativeFormControls !== false,
    predicate: typeof merged.predicate === "function" ? merged.predicate : null,
  };
}

function isNativeCloseControl(control) {
  const attrs = control.attributes;
  if (
    control.present.has("data-close") ||
    control.present.has("data-close-modal") ||
    control.present.has("data-dismiss")
  ) {
    return true;
  }
  const identity = `${control.id} ${attrs.class || ""} ${attrs.name || ""}`;
  const label = `${attrs["aria-label"] || ""} ${attrs.title || ""}`;
  return /(?:^|[\s_-])close(?:$|[\s_-])|(?:^|[\s_-])dismiss(?:$|[\s_-])/i.test(identity) ||
    /^(?:close|dismiss|关闭|取消)$/i.test(label.trim());
}

function isNativeFormControl(control) {
  const type = String(control.attributes.type || "").toLowerCase();
  return (
    control.tag === "form" ||
    (control.tag === "button" || control.tag === "input") &&
    (type === "submit" || type === "reset")
  );
}

function isCriticalControl(control, scope) {
  const explicit =
    scope.ids.has(control.id) ||
    matchesAny(control.id, scope.idPatterns) ||
    scope.actionIds.has(control.actionId) ||
    Boolean(scope.predicate?.(control));
  const marked =
    Boolean(control.actionId) ||
    String(control.attributes["data-ui-action-required"] || "").toLowerCase() === "true";
  const excluded =
    scope.excludeIds.has(control.id) || matchesAny(control.id, scope.excludeIdPatterns);
  if (excluded && !explicit) return false;
  if (!explicit && !marked) {
    if (scope.ignoreNativeCloseControls && isNativeCloseControl(control)) return false;
    if (scope.ignoreNativeFormControls && isNativeFormControl(control)) return false;
  }
  return scope.includeAll || explicit || (scope.includeMarked && marked);
}

function makeFinding(ruleId, message, details = {}) {
  return {
    severity: details.severity || "error",
    ruleId,
    file: details.file || null,
    line: Number.isInteger(details.line) ? details.line : null,
    controlId: details.controlId || null,
    actionId: details.actionId || null,
    message,
  };
}

function extractBalancedBlock(source, openIndex) {
  if (source[openIndex] !== "{") return null;
  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  for (let index = openIndex; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];
    if (lineComment) {
      if (character === "\n") lineComment = false;
      continue;
    }
    if (blockComment) {
      if (character === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }
    if (quote) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === quote) quote = null;
      continue;
    }
    if (character === "\"" || character === "'" || character === "`") {
      quote = character;
      continue;
    }
    if (character === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }
    if (character === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }
    if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return { body: source.slice(openIndex + 1, index), endIndex: index + 1 };
      }
    }
  }
  return null;
}

function extractNamedHandlerBody(source, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`\\b(?:async\\s+)?function\\s+${escaped}\\s*\\([^)]*\\)\\s*\\{`, "g"),
    new RegExp(`\\b(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[A-Za-z_$][\\w$]*)\\s*=>\\s*\\{`, "g"),
  ];
  for (const pattern of patterns) {
    const match = pattern.exec(source);
    if (!match) continue;
    const openIndex = source.indexOf("{", match.index + match[0].length - 1);
    const block = extractBalancedBlock(source, openIndex);
    if (block) return block.body;
  }
  return null;
}

function parseHandlerAt(source, offset) {
  let cursor = offset;
  while (/\s/.test(source[cursor] || "")) cursor += 1;
  const tail = source.slice(cursor);
  if (/^(?:async\s+)?function\b/.test(tail)) {
    const openIndex = source.indexOf("{", cursor);
    const block = extractBalancedBlock(source, openIndex);
    return block ? { body: block.body, raw: source.slice(cursor, block.endIndex) } : null;
  }
  const arrowMatch = /^(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>\s*/.exec(tail);
  if (arrowMatch) {
    const bodyStart = cursor + arrowMatch[0].length;
    if (source[bodyStart] === "{") {
      const block = extractBalancedBlock(source, bodyStart);
      return block ? { body: block.body, raw: source.slice(cursor, block.endIndex) } : null;
    }
    const lineEnd = source.indexOf("\n", bodyStart);
    const end = lineEnd < 0 ? source.length : lineEnd;
    return { body: source.slice(bodyStart, end).replace(/\)\s*;?\s*$/, ""), raw: source.slice(cursor, end) };
  }
  const named = /^([A-Za-z_$][\w$]*)/.exec(tail);
  if (named) {
    return {
      body: extractNamedHandlerBody(source, named[1]),
      raw: named[1],
      named: named[1],
    };
  }
  return null;
}

function parseJavaScriptBindings(jsSources) {
  const clickBindings = [];
  const submitBindings = [];
  const keyboardTargets = new Set();
  let delegatedActionHandler = false;
  for (const item of jsSources) {
    const idAliases = new Map();
    const propertyAliases = new Map();
    const variablePattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.getElementById\(\s*(["'])([^"']+)\2\s*\)/g;
    let match;
    while ((match = variablePattern.exec(item.source))) idAliases.set(match[1], match[3]);
    const propertyPattern = /\b([A-Za-z_$][\w$]*)\s*:\s*document\.getElementById\(\s*(["'])([^"']+)\2\s*\)/g;
    while ((match = propertyPattern.exec(item.source))) propertyAliases.set(match[1], match[3]);
    const propertyAssignmentPattern = /\b[A-Za-z_$][\w$]*\.([A-Za-z_$][\w$]*)\s*=\s*document\.getElementById\(\s*(["'])([^"']+)\2\s*\)/g;
    while ((match = propertyAssignmentPattern.exec(item.source))) {
      propertyAliases.set(match[1], match[3]);
    }
    const actionAliasPattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*document\.querySelector\(\s*(["'])\[data-action-id=(?:\\?["'])?([^\]"']+)(?:\\?["'])?\]\2\s*\)/g;
    const actionAliases = new Map();
    while ((match = actionAliasPattern.exec(item.source))) actionAliases.set(match[1], match[3]);

    const resolveTarget = (target, directId = "", selector = "") => {
      let controlId = directId;
      let actionId = "";
      if (!controlId && selector) {
        const idMatch = /^#([A-Za-z0-9_-]+)$/.exec(selector);
        const actionMatch = /\[data-action-id=["']?([^\]"']+)/.exec(selector);
        controlId = idMatch?.[1] || "";
        actionId = actionMatch?.[1] || "";
      }
      if (!controlId && !actionId) {
        const parts = target.replace(/\?\./g, ".").split(".");
        if (parts.length === 1) {
          controlId = idAliases.get(parts[0]) || "";
          actionId = actionAliases.get(parts[0]) || "";
        } else {
          controlId = propertyAliases.get(parts.at(-1)) || "";
        }
      }
      return { controlId, actionId };
    };

    const listenerPattern = /(document\.getElementById\(\s*(["'])([^"']+)\2\s*\)|document\.querySelector\(\s*(["'])([^"']+)\4\s*\)|[A-Za-z_$][\w$]*(?:(?:\?\.|\.)[A-Za-z_$][\w$]*)*)(?:\?\.|\.)addEventListener\(\s*(["'])(click|keydown|keyup|submit)\6\s*,/g;
    while ((match = listenerPattern.exec(item.source))) {
      const target = match[1];
      const eventName = match[7];
      const { controlId, actionId } = resolveTarget(target, match[3], match[5]);
      if (eventName === "keydown" || eventName === "keyup") {
        if (controlId) keyboardTargets.add(`id:${controlId}`);
        if (actionId) keyboardTargets.add(`action:${actionId}`);
        continue;
      }
      const parsed = parseHandlerAt(item.source, listenerPattern.lastIndex);
      const unresolvedBody = /^\s*(?:null|undefined)\b/.test(
        item.source.slice(listenerPattern.lastIndex),
      )
        ? ""
        : null;
      const binding = {
        file: item.file,
        line: lineNumberAt(item.source, match.index),
        controlId,
        actionId,
        body: parsed?.body ?? unresolvedBody,
        handlerName: parsed?.named || null,
      };
      if (
        eventName === "click" &&
        binding.body &&
        /\.closest\(\s*["'][^"']*\[data-action-id\][^"']*["']\s*\)/.test(
          binding.body,
        ) &&
        /(?:\.execute|executeAction|dispatchAction)\s*\([^)]*(?:actionId|action-id|dataset)/i.test(
          binding.body,
        )
      ) {
        delegatedActionHandler = true;
      }
      if (eventName === "submit") submitBindings.push(binding);
      else clickBindings.push(binding);
    }

    const onclickAssignmentPattern = /(document\.getElementById\(\s*(["'])([^"']+)\2\s*\)|document\.querySelector\(\s*(["'])([^"']+)\4\s*\)|[A-Za-z_$][\w$]*(?:(?:\?\.|\.)[A-Za-z_$][\w$]*)*)(?:\?\.|\.)onclick\s*=/g;
    while ((match = onclickAssignmentPattern.exec(item.source))) {
      const { controlId, actionId } = resolveTarget(match[1], match[3], match[5]);
      const parsed = parseHandlerAt(item.source, onclickAssignmentPattern.lastIndex);
      clickBindings.push({
        file: item.file,
        line: lineNumberAt(item.source, match.index),
        controlId,
        actionId,
        body:
          parsed?.body ??
          (/^\s*(?:null|undefined)\b/.test(
            item.source.slice(onclickAssignmentPattern.lastIndex),
          )
            ? ""
            : null),
        handlerName: parsed?.named || null,
      });
    }

    const arrayListenerPattern = /\[([^\]]+)\]\.forEach\(\s*\(?([A-Za-z_$][\w$]*)\)?\s*=>\s*\2\.addEventListener\(\s*(["'])click\3\s*,/g;
    while ((match = arrayListenerPattern.exec(item.source))) {
      const parsed = parseHandlerAt(item.source, arrayListenerPattern.lastIndex);
      const targets = match[1].split(",").map((target) => target.trim()).filter(Boolean);
      for (const target of targets) {
        const { controlId, actionId } = resolveTarget(target);
        clickBindings.push({
          file: item.file,
          line: lineNumberAt(item.source, match.index),
          controlId,
          actionId,
          body: parsed?.body ?? null,
          handlerName: parsed?.named || null,
        });
      }
    }
  }
  return { clickBindings, submitBindings, keyboardTargets, delegatedActionHandler };
}

function stripComments(value) {
  return String(value || "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1");
}

function classifyHandler(body) {
  if (body === null || body === undefined) return null;
  const raw = String(body);
  const clean = stripComments(raw).trim();
  if (!clean || /^[;{}\s]*$/.test(clean)) return "empty-handler";
  const withoutConsole = clean
    .replace(/\bconsole\.(?:log|info|warn|debug|error)\s*\([^;]*?\)\s*;?/gs, "")
    .replace(/[;{}\s]/g, "");
  if (!withoutConsole) return "console-only-handler";
  const fixedCall = /^(?:(?:window\.)?alert|showToast|toast|notify)\s*\(\s*(["'])([\s\S]*?)\1(?:\s*,[^)]*)?\)\s*;?$/i.exec(clean);
  if (fixedCall) {
    if (/(?:开发中|尚未开放|coming\s+soon|not\s+implemented)/i.test(fixedCall[2])) {
      return "development-alert-handler";
    }
    if (/(?:成功|success|completed?)/i.test(fixedCall[2])) {
      return "fixed-success-handler";
    }
  }
  if (/\b(?:TODO|FIXME)\b/i.test(raw)) return "placeholder-comment-handler";
  return null;
}

function callableBody(callable) {
  const source = Function.prototype.toString.call(callable);
  const arrowIndex = source.indexOf("=>");
  if (arrowIndex >= 0) {
    const tail = source.slice(arrowIndex + 2).trim();
    if (tail.startsWith("{")) return extractBalancedBlock(tail, 0)?.body ?? tail;
    return tail;
  }
  const openIndex = source.indexOf("{");
  if (openIndex >= 0) return extractBalancedBlock(source, openIndex)?.body ?? source;
  return source;
}

function handlerFinding(classification, details) {
  const messages = {
    "empty-handler": "Critical control has an empty click handler",
    "console-only-handler": "Critical control handler only writes to the console",
    "development-alert-handler": "Critical control only shows a fixed development placeholder",
    "fixed-success-handler": "Critical control only shows a fixed success message",
    "placeholder-comment-handler": "Critical control handler still contains TODO/FIXME placeholder code",
  };
  const severity = classification === "placeholder-comment-handler" ? "warning" : "error";
  return makeFinding(classification, messages[classification], { ...details, severity });
}

function collectIpcUses(sources) {
  const uses = [];
  const pattern = /\bipcRenderer\.(invoke|sendSync|send)\s*\(\s*(["'])([^"']+)\2/g;
  for (const item of sources) {
    let match;
    while ((match = pattern.exec(item.source))) {
      uses.push({
        mode: match[1],
        channel: match[3],
        file: item.file,
        line: lineNumberAt(item.source, match.index),
      });
    }
  }
  return uses;
}

function collectIpcHandlers(sources) {
  const handlers = { handle: new Set(), on: new Set() };
  const pattern = /\bipcMain\.(handle|on)\s*\(\s*(["'])([^"']+)\2/g;
  for (const item of sources) {
    let match;
    while ((match = pattern.exec(item.source))) handlers[match[1]].add(match[3]);
  }
  return handlers;
}

function hasDisabledReason(control) {
  const attrs = control.attributes;
  return Boolean(
    String(attrs["data-disabled-reason"] || "").trim() ||
      String(attrs["aria-description"] || "").trim() ||
      String(attrs.title || "").trim(),
  );
}

function hasPreviewMarker(control) {
  const attrs = control.attributes;
  return (
    ["true", "preview"].includes(String(attrs["data-preview"] || "").toLowerCase()) ||
    String(attrs["data-action-status"] || "").toLowerCase() === "preview" ||
    String(attrs["data-status"] || "").toLowerCase() === "preview"
  );
}

function isDisabled(control) {
  return control.present.has("disabled") ||
    String(control.attributes["aria-disabled"] || "").toLowerCase() === "true";
}

function isKeyboardAccessible(control, keyboardTargets) {
  if (control.tag === "form") return true;
  if (["button", "select", "textarea"].includes(control.tag)) return true;
  if (control.tag === "input" && String(control.attributes.type || "").toLowerCase() !== "hidden") {
    return true;
  }
  if (control.tag === "a" && String(control.attributes.href || "").trim()) return true;
  const tabIndex = Number.parseInt(control.attributes.tabindex, 10);
  const focusable = Number.isInteger(tabIndex) && tabIndex >= 0;
  const hasKeyboardHandler =
    control.present.has("onkeydown") ||
    control.present.has("onkeyup") ||
    keyboardTargets.has(`id:${control.id}`) ||
    keyboardTargets.has(`action:${control.actionId}`);
  return focusable && hasKeyboardHandler;
}

function sortFindings(findings) {
  return findings.sort((left, right) =>
    (SEVERITY_ORDER[left.severity] ?? 9) - (SEVERITY_ORDER[right.severity] ?? 9) ||
    String(left.file || "").localeCompare(String(right.file || "")) ||
    (left.line || 0) - (right.line || 0) ||
    left.ruleId.localeCompare(right.ruleId),
  );
}

class UIActionAuditService {
  constructor({
    registry = null,
    executionService = null,
    criticalControlScope = DEFAULT_CRITICAL_CONTROL_SCOPE,
    testedActionIds = [],
  } = {}) {
    if (registry && (!registry.get || !registry.snapshot || !registry.list)) {
      throw new TypeError("UIActionAuditService registry must be a UIActionRegistry");
    }
    if (executionService && (!executionService.snapshot || !executionService.isExecuting)) {
      throw new TypeError(
        "UIActionAuditService executionService must be a UIActionExecutionService",
      );
    }
    this.registry = registry;
    this.executionService = executionService;
    this.criticalControlScope = criticalControlScope;
    this.testedActionIds = new Set((testedActionIds || []).map(String));
  }

  static auditSources(options = {}) {
    return new UIActionAuditService(options).auditSources(options);
  }

  static auditProject(options = {}) {
    return new UIActionAuditService(options).auditProject(options);
  }

  async auditSources(options = {}) {
    const htmlSources = normalizeSources(
      options.htmlSources ?? options.rendererHtml,
      "renderer.html",
    );
    const jsSources = normalizeSources(
      options.jsSources ?? options.rendererJavaScript,
      "renderer.js",
    );
    const preloadSources = normalizeSources(options.preloadSources, "preload.cjs");
    const mainSources = normalizeSources(options.mainSources, "main.cjs");
    const scope = normalizeScope(
      options.criticalControlScope || this.criticalControlScope,
    );
    const testedActionIds = new Set([
      ...this.testedActionIds,
      ...((options.testedActionIds || []).map(String)),
    ]);
    const boundActionIds = new Set((options.boundActionIds || []).map(String));
    const findings = [];
    const allControls = parseControls(htmlSources);
    const controls = allControls.filter((control) => isCriticalControl(control, scope));
    const bindings = parseJavaScriptBindings(jsSources);
    const actionStates = this.executionService
      ? await this.executionService.snapshot(options.context || {})
      : this.registry
        ? await this.registry.snapshot(options.context || {})
        : [];
    const stateById = new Map(actionStates.map((state) => [state.id, state]));

    const actionDefinitions = Array.isArray(options.actionDefinitions)
      ? options.actionDefinitions
      : [];
    const definitionCounts = new Map();
    for (const definition of actionDefinitions) {
      const id = String(definition?.id || "").trim();
      if (id) definitionCounts.set(id, (definitionCounts.get(id) || 0) + 1);
    }
    for (const [actionId, count] of definitionCounts) {
      if (count > 1) {
        findings.push(
          makeFinding(
            "duplicate-action-id",
            `Action id ${actionId} is declared ${count} times`,
            { actionId },
          ),
        );
      }
    }

    const controlActionGroups = new Map();
    for (const control of controls) {
      const details = {
        file: control.file,
        line: control.line,
        controlId: control.id,
        actionId: control.actionId,
      };
      if (!control.actionId) {
        findings.push(
          makeFinding(
            "missing-action-id",
            "Critical renderer control is missing data-action-id",
            details,
          ),
        );
      } else {
        const group = controlActionGroups.get(control.actionId) || [];
        group.push(control);
        controlActionGroups.set(control.actionId, group);
        if (this.registry && !this.registry.has(control.actionId)) {
          findings.push(
            makeFinding(
              "unregistered-action-id",
              `Control references unregistered action id ${control.actionId}`,
              details,
            ),
          );
        }
      }

      const href = String(control.attributes.href || "").trim();
      if (href === "#") {
        findings.push(
          makeFinding("href-placeholder", 'Critical link uses href="#"', details),
        );
      } else if (/^javascript\s*:/i.test(href)) {
        findings.push(
          makeFinding(
            "javascript-url",
            "Critical link uses a javascript: URL",
            details,
          ),
        );
      }

      if (control.present.has("onclick")) {
        const classification = classifyHandler(control.attributes.onclick);
        if (classification) findings.push(handlerFinding(classification, details));
      }
      if (isDisabled(control) && !hasDisabledReason(control)) {
        findings.push(
          makeFinding(
            "disabled-without-reason",
            "Disabled critical control does not explain why it is disabled",
            { ...details, severity: "warning" },
          ),
        );
      }
      const state = stateById.get(control.actionId);
      if (state?.status === "preview" && !hasPreviewMarker(control)) {
        findings.push(
          makeFinding(
            "preview-marker-missing",
            "Preview action is not marked as preview in the renderer",
            { ...details, severity: "warning" },
          ),
        );
      }
      if (
        state &&
        ["requiresConfiguration", "unavailable"].includes(state.status) &&
        !isDisabled(control)
      ) {
        findings.push(
          makeFinding(
            "unavailable-action-presented-ready",
            `Action status is ${state.status}, but its control is not disabled`,
            { ...details, severity: "warning" },
          ),
        );
      }
      if (!isKeyboardAccessible(control, bindings.keyboardTargets)) {
        findings.push(
          makeFinding(
            "keyboard-inaccessible",
            "Critical control cannot be operated with Enter/Space semantics",
            { ...details, severity: "warning" },
          ),
        );
      }

      const matchingBindings = bindings.clickBindings.filter(
        (binding) =>
          (control.id && binding.controlId === control.id) ||
          (control.actionId && binding.actionId === control.actionId),
      );
      const submitTargetId =
        control.tag === "form"
          ? control.id
          : String(control.attributes.type || "").toLowerCase() === "submit"
            ? control.parentFormId
            : "";
      const matchingSubmitBindings = submitTargetId
        ? bindings.submitBindings.filter(
            (binding) => binding.controlId === submitTargetId,
          )
        : [];
      const hasInlineHandler = control.present.has("onclick");
      const isBound =
        hasInlineHandler ||
        matchingBindings.length > 0 ||
        matchingSubmitBindings.length > 0 ||
        boundActionIds.has(control.actionId) ||
        (control.actionId && bindings.delegatedActionHandler);
      if (!isBound) {
        findings.push(
          makeFinding(
            "missing-handler",
            "Critical renderer control has no click handler or action dispatcher binding",
            details,
          ),
        );
      }
      for (const binding of [...matchingBindings, ...matchingSubmitBindings]) {
        const classification = classifyHandler(binding.body);
        if (classification) {
          findings.push(
            handlerFinding(classification, {
              ...details,
              file: binding.file,
              line: binding.line,
            }),
          );
        }
      }
    }

    for (const [actionId, groupedControls] of controlActionGroups) {
      if (groupedControls.length < 2 || scope.allowRepeatedActionIds.has(actionId)) continue;
      const first = groupedControls[1];
      findings.push(
        makeFinding(
          "duplicate-action-id",
          `Action id ${actionId} is attached to ${groupedControls.length} critical controls`,
          {
            file: first.file,
            line: first.line,
            controlId: first.id,
            actionId,
          },
        ),
      );
    }

    for (const binding of bindings.clickBindings) {
      if (
        controls.some(
          (control) =>
            (binding.controlId && binding.controlId === control.id) ||
            (binding.actionId && binding.actionId === control.actionId),
        )
      ) {
        continue;
      }
      const classification = classifyHandler(binding.body);
      if (classification && boundActionIds.has(binding.actionId)) {
        findings.push(
          handlerFinding(classification, {
            file: binding.file,
            line: binding.line,
            actionId: binding.actionId,
          }),
        );
      }
    }

    for (const state of actionStates) {
      const definition = this.registry?.get(state.id);
      if (state.availabilityErrorCode) {
        findings.push(
          makeFinding(
            "availability-check-failed",
            `Availability check failed for action ${state.id}`,
            { actionId: state.id },
          ),
        );
      }
      if (state.status === "ready" && !state.hasHandler) {
        findings.push(
          makeFinding(
            "missing-handler",
            `Registered ready action ${state.id} has no execute handler`,
            { actionId: state.id },
          ),
        );
      }
      if (!testedActionIds.has(state.id)) {
        findings.push(
          makeFinding(
            "missing-test",
            `Registered action ${state.id} has no declared automated test`,
            { actionId: state.id, severity: "warning" },
          ),
        );
      }
      if (definition?.execute) {
        const classification = classifyHandler(callableBody(definition.execute));
        if (classification) {
          findings.push(
            handlerFinding(classification, { actionId: state.id, file: "<registry>" }),
          );
        }
      }
    }

    const ipcUses = collectIpcUses([...jsSources, ...preloadSources]);
    for (const state of actionStates) {
      if (state.ipcChannel) {
        ipcUses.push({
          mode: state.ipcMode || "invoke",
          channel: state.ipcChannel,
          file: `<registry:${state.id}>`,
          line: null,
          actionId: state.id,
        });
      }
    }
    const ipcHandlers = collectIpcHandlers(mainSources);
    const invalidIpcKeys = new Set();
    for (const use of ipcUses) {
      const handlerType = use.mode === "invoke" ? "handle" : "on";
      if (ipcHandlers[handlerType].has(use.channel)) continue;
      const key = `${use.file}:${use.line}:${use.mode}:${use.channel}`;
      if (invalidIpcKeys.has(key)) continue;
      invalidIpcKeys.add(key);
      findings.push(
        makeFinding(
          "invalid-ipc-channel",
          `ipcRenderer.${use.mode}("${use.channel}") has no matching ipcMain.${handlerType} handler`,
          {
            file: use.file,
            line: use.line,
            actionId: use.actionId,
          },
        ),
      );
    }

    sortFindings(findings);
    const referencedActionIds = new Set(
      controls.map((control) => control.actionId).filter(Boolean),
    );
    const totalActionIds = new Set([
      ...actionStates.map((state) => state.id),
      ...referencedActionIds,
      ...definitionCounts.keys(),
    ]);
    const countStatus = (status) => actionStates.filter((state) => state.status === status).length;
    const countRule = (ruleId) => findings.filter((finding) => finding.ruleId === ruleId).length;
    const summary = {
      totalActions:
        totalActionIds.size + controls.filter((control) => !control.actionId).length,
      registeredActions: actionStates.length || definitionCounts.size,
      executableActions: countStatus("ready"),
      loadingActions: countStatus("loading"),
      requiresConfiguration: countStatus("requiresConfiguration"),
      unavailableActions: countStatus("unavailable"),
      previewActions: countStatus("preview"),
      missingHandlers: countRule("missing-handler"),
      invalidIpcChannels: countRule("invalid-ipc-channel"),
      missingTests: countRule("missing-test"),
      keyboardInaccessible: countRule("keyboard-inaccessible"),
      controlsScanned: allControls.length,
      criticalControlsAudited: controls.length,
      errorCount: findings.filter((finding) => finding.severity === "error").length,
      warningCount: findings.filter((finding) => finding.severity === "warning").length,
    };
    return {
      scope: {
        rendererOwnedUiOnly: true,
        externalWebContentsScanned: false,
        registryProvided: Boolean(this.registry),
        note: "Static source audit only; external WebContentsView pages are never scanned or clicked.",
        scannedFiles: [...htmlSources, ...jsSources, ...preloadSources, ...mainSources].map(
          (item) => item.file,
        ),
      },
      summary,
      actions: actionStates,
      findings,
    };
  }

  async auditProject(options = {}) {
    const projectRoot = path.resolve(options.projectRoot || process.cwd());
    const readSources = (paths, prefix) =>
      (paths || []).map((file, index) => {
        const absolute = path.resolve(projectRoot, file);
        return {
          file: path.relative(projectRoot, absolute) || `${prefix}-${index + 1}`,
          source: fs.readFileSync(absolute, "utf8"),
        };
      });
    const rendererFiles = options.rendererFiles || [];
    const htmlFiles = [
      ...(options.htmlFiles || []),
      ...rendererFiles.filter((file) => /\.html?$/i.test(file)),
    ];
    const jsFiles = [
      ...(options.jsFiles || options.rendererJavaScriptFiles || []),
      ...rendererFiles.filter((file) => /\.(?:cjs|mjs|js)$/i.test(file)),
    ];
    return this.auditSources({
      ...options,
      htmlSources: readSources(htmlFiles, "renderer.html"),
      jsSources: readSources(jsFiles, "renderer.js"),
      preloadSources: readSources(options.preloadFiles || [], "preload.cjs"),
      mainSources: readSources(options.mainFiles || [], "main.cjs"),
    });
  }
}

module.exports = {
  DEFAULT_CRITICAL_CONTROL_SCOPE,
  UIActionAuditService,
  classifyHandler,
  collectIpcHandlers,
  collectIpcUses,
  isCriticalControl,
  normalizeScope,
  parseAttributes,
  parseControls,
  parseJavaScriptBindings,
};
