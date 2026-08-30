function extractionScript({ onlyUntranslated = false } = {}) {
  return `(() => {
    const root = window;
    const state = root.__qiyeTranslationState || (root.__qiyeTranslationState = {
      counter: 0,
      mapping: new Map(),
      nodeIds: new WeakMap(),
      translated: new Set(),
      translationNodes: new Map(),
      observers: [],
      mode: 'bilingual'
    });
    const excluded = 'script,style,noscript,code,pre,textarea,input,select,option,canvas,svg,[contenteditable=""],[contenteditable="true"],[aria-hidden="true"],[data-qiye-translation-ui],[data-qiye-translation-output]';
    const meaningless = /^(?:[\\d\\s.,:;!?%+\\-–—_()[\\]{}<>|/\\\\]+|https?:\\/\\/\\S+|www\\.\\S+|\\S+\\.(?:png|jpe?g|gif|webp|svg|pdf|zip|rar|exe|dmg|mp[34]|avi|mov))$/i;
    const documents = [];
    let blockedFrames = 0;
    const collectDocuments = (doc) => {
      if (!doc || documents.includes(doc)) return;
      documents.push(doc);
      for (const frame of Array.from(doc.querySelectorAll('iframe'))) {
        try {
          if (frame.contentDocument?.documentElement) collectDocuments(frame.contentDocument);
          else blockedFrames += 1;
        } catch { blockedFrames += 1; }
      }
    };
    collectDocuments(document);
    state.documents = documents;
    const segments = [];
    const seenText = new Set();
    for (const doc of documents) {
      const body = doc.body;
      if (!body) continue;
      const walker = doc.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent || parent.closest(excluded)) continue;
        const text = String(node.nodeValue || '').trim();
        if (text.length < 2 || meaningless.test(text)) continue;
        const style = doc.defaultView?.getComputedStyle(parent);
        if (!style || style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
        if (!parent.getClientRects().length) continue;
        let id = state.nodeIds.get(node);
        if (!id) {
          id = 'qys-' + (++state.counter);
          state.nodeIds.set(node, id);
          state.mapping.set(id, { node, original: node.nodeValue });
        }
        if (${onlyUntranslated ? "true" : "false"} && state.translated.has(id)) continue;
        const dedupeKey = text + '\\n' + id;
        if (seenText.has(dedupeKey)) continue;
        seenText.add(dedupeKey);
        segments.push({ segmentId: id, text });
        if (segments.length >= 1200) break;
      }
      if (segments.length >= 1200) break;
    }
    return { segments, blockedFrames };
  })()`;
}

class PageTextExtractor {
  async extract(webContents, options = {}) {
    if (!webContents || webContents.isDestroyed()) return { segments: [], blockedFrames: 0 };
    return webContents.executeJavaScript(extractionScript(options), true);
  }
}

module.exports = { PageTextExtractor, extractionScript };
