function payloadScript(value) {
  return JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

function applyScript(results, mode, observe) {
  return `(() => {
    const state = window.__qiyeTranslationState;
    if (!state) return { applied: 0 };
    const results = ${payloadScript(results)};
    const mode = ${payloadScript(mode)};
    const ensureStyle = (doc) => {
      if (doc.getElementById('qiye-translation-style')) return;
      const style = doc.createElement('style');
      style.id = 'qiye-translation-style';
      style.dataset.qiyePageTranslationUi = 'true';
      style.textContent = '.qiye-page-translation{color:#176b57;background:rgba(232,245,239,.72);border-radius:4px;padding:1px 3px;margin-inline-start:4px;box-decoration-break:clone;-webkit-box-decoration-break:clone}.qiye-page-translation--block{display:block;margin:4px 0 7px;border-left:2px solid #27856e;padding:3px 7px}.qiye-page-translation[data-qiye-mode="translated"]{color:inherit;background:transparent;margin:0;padding:0;border:0}';
      (doc.head || doc.documentElement).appendChild(style);
    };
    let applied = 0;
    state.mode = mode;
    for (const result of results) {
      const entry = state.mapping.get(String(result.segmentId));
      if (!entry?.node?.isConnected) continue;
      const doc = entry.node.ownerDocument;
      ensureStyle(doc);
      let output = state.translationNodes.get(String(result.segmentId));
      if (!output || !output.isConnected) {
        output = doc.createElement('span');
        output.className = 'qiye-page-translation';
        output.dataset.qiyeTranslationOutput = String(result.segmentId);
        entry.node.parentNode?.insertBefore(output, entry.node.nextSibling);
        state.translationNodes.set(String(result.segmentId), output);
      }
      output.textContent = String(result.translatedText || '');
      const parentTag = entry.node.parentElement?.tagName?.toLowerCase();
      output.classList.toggle('qiye-page-translation--block', ['p','li','h1','h2','h3','h4','h5','h6','td','th','section','article'].includes(parentTag));
      output.dataset.qiyeMode = mode;
      entry.node.nodeValue = mode === 'translated' ? '' : entry.original;
      state.translated.add(String(result.segmentId));
      applied += 1;
    }
    const switchMode = (nextMode) => {
      state.mode = nextMode;
      for (const [id, entry] of state.mapping.entries()) {
        const output = state.translationNodes.get(id);
        if (!output?.isConnected || !state.translated.has(id)) continue;
        entry.node.nodeValue = nextMode === 'translated' ? '' : entry.original;
        output.dataset.qiyeMode = nextMode;
      }
    };
    state.switchMode = switchMode;
    if (${observe ? "true" : "false"} && !state.observers.length) {
      let timer = 0;
      const notify = (mutations) => {
        const relevant = mutations.some((mutation) => Array.from(mutation.addedNodes || []).some((node) => {
          const element = node.nodeType === 1 ? node : node.parentElement;
          return element && !element.closest?.('[data-qiye-translation-ui],[data-qiye-translation-output]');
        }));
        if (!relevant) return;
        clearTimeout(timer);
        timer = setTimeout(() => window.open('qiye-action://translation-dynamic', '_blank'), 450);
      };
      for (const doc of state.documents || [document]) {
        if (!doc.body) continue;
        const observer = new MutationObserver(notify);
        observer.observe(doc.body, { childList: true, subtree: true });
        state.observers.push(observer);
      }
      if (!state.visibilityHandler) {
        state.visibilityHandler = () => {
          if (document.hidden) {
            for (const observer of state.observers || []) observer.disconnect();
            state.observers = [];
          } else {
            window.open('qiye-action://translation-dynamic', '_blank');
          }
        };
        document.addEventListener('visibilitychange', state.visibilityHandler, true);
      }
    }
    return { applied };
  })()`;
}

const RESTORE_SCRIPT = `(() => {
  const state = window.__qiyeTranslationState;
  if (!state) return { restored: 0 };
  for (const observer of state.observers || []) observer.disconnect();
  if (state.visibilityHandler) document.removeEventListener('visibilitychange', state.visibilityHandler, true);
  let restored = 0;
  for (const [id, entry] of state.mapping.entries()) {
    if (entry?.node?.isConnected) entry.node.nodeValue = entry.original;
    const output = state.translationNodes.get(id);
    if (output?.isConnected) output.remove();
    restored += 1;
  }
  for (const doc of state.documents || [document]) {
    try { doc.querySelectorAll('[data-qiye-page-translation-ui]').forEach((node) => node.remove()); } catch {}
  }
  delete window.__qiyeTranslationState;
  return { restored };
})()`;

class PageTranslationRenderer {
  async apply(webContents, results, options = {}) {
    if (!webContents || webContents.isDestroyed()) return { applied: 0 };
    return webContents.executeJavaScript(applyScript(results, options.mode || "bilingual", options.observe !== false), true);
  }

  async setMode(webContents, mode) {
    if (!webContents || webContents.isDestroyed()) return false;
    return webContents.executeJavaScript(`window.__qiyeTranslationState?.switchMode?.(${payloadScript(mode)}) ?? false`, true);
  }

  async restore(webContents) {
    if (!webContents || webContents.isDestroyed()) return { restored: 0 };
    return webContents.executeJavaScript(RESTORE_SCRIPT, true).catch(() => ({ restored: 0 }));
  }
}

module.exports = { PageTranslationRenderer, RESTORE_SCRIPT, applyScript };
