function json(value) {
  return JSON.stringify(value).replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
}

const CAPTURE_SELECTION_SCRIPT = `(() => {
  const active = document.activeElement;
  if (active && /^(?:INPUT|TEXTAREA)$/.test(active.tagName) && String(active.type || '').toLowerCase() !== 'password') {
    const start = Number(active.selectionStart);
    const end = Number(active.selectionEnd);
    window.__qiyeSelectionCapture = Number.isFinite(start) && Number.isFinite(end) && end > start
      ? { kind: 'input', element: active, start, end }
      : null;
    if (!window.__qiyeSelectionCapture) return { captured: false };
    const rect = active.getBoundingClientRect();
    return { captured: true, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
  }
  const selection = window.getSelection();
  if (!selection || selection.rangeCount < 1 || selection.isCollapsed) {
    window.__qiyeSelectionCapture = null;
    return { captured: false };
  }
  const range = selection.getRangeAt(0).cloneRange();
  const editable = Boolean(range.commonAncestorContainer.parentElement?.closest?.('[contenteditable="true"],[contenteditable=""]'));
  window.__qiyeSelectionCapture = { kind: 'range', range, editable };
  const rect = range.getBoundingClientRect();
  return { captured: true, left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
})()`;

function popoverScript(payload) {
  return `(() => {
    document.querySelectorAll('[data-qiye-translation-popover]').forEach((node) => node.remove());
    const data = ${json(payload)};
    const capture = window.__qiyeSelectionCapture;
    const panel = document.createElement('section');
    panel.dataset.qiyeTranslationPopover = 'true';
    panel.dataset.qiyeTranslationUi = 'true';
    panel.setAttribute('role', 'dialog');
    panel.style.cssText = 'position:fixed;z-index:2147483647;width:min(420px,calc(100vw - 24px));max-height:min(520px,calc(100vh - 24px));overflow:auto;background:#fffdf9;color:#17231f;border:1px solid #cad8d1;border-radius:14px;box-shadow:0 18px 60px rgba(27,49,41,.24);padding:14px;font:13px/1.55 system-ui,sans-serif;left:' + Math.max(12, Math.min(Number(data.x || 24), innerWidth - 440)) + 'px;top:' + Math.max(12, Math.min(Number(data.y || 24), innerHeight - 360)) + 'px';
    const makeButton = (label, action) => { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.style.cssText='border:1px solid #cbd8d2;background:#fff;border-radius:8px;padding:6px 9px;color:#245c4d;cursor:pointer'; b.addEventListener('click', action); return b; };
    const header=document.createElement('div'); header.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px';
    const title=document.createElement('strong'); title.textContent='翻译 · ' + data.detectedLanguage + ' → ' + data.targetLanguage;
    const close=makeButton('关闭',()=>{ panel.remove(); window.open('qiye-action://translation-close','_blank'); });
    header.append(title,close);
    const original=document.createElement('div'); original.style.cssText='color:#637069;background:#f5f5f1;border-radius:9px;padding:8px 10px;white-space:pre-wrap;overflow-wrap:anywhere'; original.textContent=data.original;
    const translated=document.createElement('div'); translated.style.cssText='font-size:15px;background:#edf7f2;border-left:3px solid #27856e;border-radius:9px;padding:10px;margin-top:9px;white-space:pre-wrap;overflow-wrap:anywhere'; translated.textContent=data.translated;
    const provider=document.createElement('small'); provider.style.cssText='display:block;color:#77847d;margin:7px 0'; provider.textContent='服务：' + data.providerName;
    const actions=document.createElement('div'); actions.style.cssText='display:flex;flex-wrap:wrap;gap:7px';
    actions.append(makeButton('复制译文',async()=>{ try{await navigator.clipboard.writeText(data.translated)}catch{const t=document.createElement('textarea');t.value=data.translated;document.body.append(t);t.select();document.execCommand('copy');t.remove()}}));
    actions.append(makeButton('重新翻译',()=>window.open('qiye-action://translation-retry','_blank')));
    actions.append(makeButton('在翻译网站中打开',()=>window.open('qiye-action://translation-open-external','_blank')));
    const applyEditable = (replace) => {
      if (!capture) return;
      if (capture.kind === 'input' && capture.element?.isConnected) {
        const start = replace ? capture.start : capture.end;
        capture.element.setRangeText(data.translated, start, capture.end, 'end');
        capture.element.dispatchEvent(new InputEvent('input', { bubbles:true, inputType:'insertText', data:data.translated }));
      } else if (capture.kind === 'range' && capture.editable) {
        const range = capture.range.cloneRange();
        if (replace) range.deleteContents(); else range.collapse(false);
        range.insertNode(document.createTextNode(data.translated));
        range.commonAncestorContainer.parentElement?.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:data.translated}));
      }
    };
    if (capture?.kind === 'input' || capture?.editable) {
      actions.append(makeButton('插入译文',()=>applyEditable(false)), makeButton('替换选中文字',()=>applyEditable(true)));
    }
    panel.append(header,original,translated,provider,actions);
    document.body.appendChild(panel);
    return true;
  })()`;
}

function insightPopoverScript(payload) {
  return `(() => {
    document.querySelectorAll('[data-qiye-selection-insight-popover]').forEach((node) => node.remove());
    const data = ${json(payload)};
    const panel = document.createElement('section');
    panel.dataset.qiyeSelectionInsightPopover = 'true';
    panel.dataset.qiyeTranslationUi = 'true';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'DeepSeek 选中文字查询结果');
    panel.style.cssText = 'all:initial;box-sizing:border-box;position:fixed;z-index:2147483647;width:min(420px,calc(100vw - 24px));max-height:min(520px,calc(100vh - 24px));overflow:auto;background:#fffdf9;color:#17231f;border:1px solid #cad8d1;border-radius:14px;box-shadow:0 18px 60px rgba(27,49,41,.24);padding:14px;font:13px/1.55 system-ui,sans-serif;visibility:hidden';
    const makeButton = (label, action) => { const b=document.createElement('button'); b.type='button'; b.textContent=label; b.style.cssText='all:initial;box-sizing:border-box;border:1px solid #cbd8d2;background:#fff;border-radius:8px;padding:6px 9px;color:#245c4d;cursor:pointer;font:600 12px/1.2 system-ui,sans-serif'; b.addEventListener('click', action); return b; };
    const header=document.createElement('div'); header.style.cssText='display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px';
    const heading=document.createElement('div'); heading.style.cssText='display:grid;gap:2px';
    const title=document.createElement('strong'); title.style.cssText='font:700 14px/1.3 system-ui,sans-serif;color:#173f36'; title.textContent='DeepSeek 查询';
    const badge=document.createElement('small'); badge.style.cssText='font:11px/1.3 system-ui,sans-serif;color:#77847d'; badge.textContent=data.realtimeSearch ? '已连接实时搜索' : 'AI 解读 · 非实时网页搜索';
    heading.append(title,badge);
    const close=makeButton('关闭',()=>{ panel.remove(); window.open('qiye-action://translation-close','_blank'); });
    header.append(heading,close);
    const query=document.createElement('div'); query.style.cssText='color:#637069;background:#f5f5f1;border-radius:9px;padding:8px 10px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 system-ui,sans-serif'; query.textContent=data.original;
    const answer=document.createElement('div'); answer.style.cssText='font:14px/1.65 system-ui,sans-serif;background:#edf7f2;border-left:3px solid #27856e;border-radius:9px;padding:10px;margin-top:9px;white-space:pre-wrap;overflow-wrap:anywhere;color:#17231f';
    answer.textContent=data.loading ? '正在查询 DeepSeek…' : (data.error || data.answer || '没有返回结果');
    if(data.error) answer.style.cssText += ';background:#fff1ee;border-left-color:#c5685c;color:#8b4038';
    const provider=document.createElement('small'); provider.style.cssText='display:block;color:#77847d;margin:7px 0;font:11px/1.4 system-ui,sans-serif'; provider.textContent='服务：' + (data.providerName || 'DeepSeek');
    const actions=document.createElement('div'); actions.style.cssText='display:flex;flex-wrap:wrap;gap:7px';
    if(!data.loading && !data.error && data.answer) actions.append(makeButton('复制结果',async()=>{ try{await navigator.clipboard.writeText(data.answer)}catch{const t=document.createElement('textarea');t.value=data.answer;document.body.append(t);t.select();document.execCommand('copy');t.remove()}}));
    if(!data.loading) actions.append(makeButton('重新查询',()=>window.open('qiye-action://selection-insight-retry','_blank')));
    panel.append(header,query,answer,provider,actions);
    (document.body||document.documentElement).appendChild(panel);
    const width=panel.getBoundingClientRect().width || 420;
    const height=panel.getBoundingClientRect().height || 260;
    const left=Math.max(12,Math.min(Number(data.x||24),innerWidth-width-12));
    const preferredTop=Math.max(12,Number(data.y||24));
    const top=preferredTop+height<=innerHeight-12 ? preferredTop : Math.max(12,Number(data.anchorTop||preferredTop)-height-8);
    panel.style.left=left+'px'; panel.style.top=top+'px'; panel.style.visibility='visible';
    return { shown:true, left, top, belowSelection:top===preferredTop };
  })()`;
}

const CURRENT_SELECTION_SCRIPT = `(() => {
  const active=document.activeElement;
  if(active && /^(?:INPUT|TEXTAREA)$/.test(active.tagName) && String(active.type||'').toLowerCase()!=='password'){
    const start=Number(active.selectionStart),end=Number(active.selectionEnd);
    return end>start ? String(active.value||'').slice(start,end) : '';
  }
  return String(window.getSelection?.()?.toString?.() || '');
})()`;

function triggerScript(enabled) {
  return `(() => {
    document.querySelectorAll('[data-qiye-selection-trigger]').forEach((node)=>node.remove());
    if (window.__qiyeSelectionTriggerCleanup) window.__qiyeSelectionTriggerCleanup();
    if (!${enabled ? "true" : "false"}) return false;
    const button=document.createElement('button'); button.type='button'; button.textContent='译'; button.title='翻译选中文字'; button.dataset.qiyeSelectionTrigger='true'; button.dataset.qiyeTranslationUi='true';
    button.style.cssText='position:fixed;display:none;z-index:2147483646;width:30px;height:30px;border:1px solid #bfd2c8;border-radius:9px;background:#fffdf9;color:#176b57;box-shadow:0 6px 20px rgba(20,50,40,.22);font:600 13px system-ui;cursor:pointer';
    const hide=()=>{button.style.display='none';document.querySelectorAll('[data-qiye-translation-popover]').forEach((node)=>node.remove())};
    const position=()=>{
      const active=document.activeElement;
      if(active && /^(?:INPUT|TEXTAREA)$/.test(active.tagName)){
        if(String(active.type||'').toLowerCase()==='password' || !(Number(active.selectionEnd)>Number(active.selectionStart))) return hide();
        const rect=active.getBoundingClientRect(); button.style.left=Math.min(innerWidth-38,rect.right-30)+'px'; button.style.top=Math.min(innerHeight-38,rect.bottom+4)+'px'; button.style.display='block'; return;
      }
      const selection=window.getSelection(); if(!selection || selection.isCollapsed || selection.rangeCount<1) return hide();
      const rect=selection.getRangeAt(0).getBoundingClientRect(); if(!rect.width&&!rect.height) return hide();
      button.style.left=Math.min(innerWidth-38,Math.max(8,rect.right+5))+'px'; button.style.top=Math.min(innerHeight-38,Math.max(8,rect.bottom+5))+'px'; button.style.display='block';
    };
    const onSelectionChange=()=>{ if(document.querySelector('[data-qiye-translation-popover]')){document.querySelectorAll('[data-qiye-translation-popover]').forEach((node)=>node.remove());window.open('qiye-action://translation-close','_blank')} };
    const onMouseUp=()=>setTimeout(position,0); const onKeyUp=()=>setTimeout(position,0); const onScroll=()=>hide();
    button.addEventListener('mousedown',(event)=>event.preventDefault());
    button.addEventListener('click',()=>{window.open('qiye-action://translation-selection-button','_blank');button.style.display='none'});
    document.addEventListener('mouseup',onMouseUp,true); document.addEventListener('keyup',onKeyUp,true); document.addEventListener('selectionchange',onSelectionChange,true); window.addEventListener('scroll',onScroll,true);
    (document.body||document.documentElement).appendChild(button);
    window.__qiyeSelectionTriggerCleanup=()=>{document.removeEventListener('mouseup',onMouseUp,true);document.removeEventListener('keyup',onKeyUp,true);document.removeEventListener('selectionchange',onSelectionChange,true);window.removeEventListener('scroll',onScroll,true);button.remove()};
    return true;
  })()`;
}

class SelectionActionService {
  constructor({ translationService, onNotice, openExternal, confirmSensitive }) {
    this.translationService = translationService;
    this.onNotice = onNotice;
    this.openExternal = openExternal;
    this.confirmSensitive = confirmSensitive;
    this.memory = new Map();
    this.pending = new Map();
  }

  async installTrigger(webContents, enabled) {
    if (!webContents || webContents.isDestroyed()) return false;
    return webContents.executeJavaScript(triggerScript(enabled), true).catch(() => false);
  }

  async translate(input = {}) {
    const contents = input.webContents;
    const text = String(input.text || "").trim();
    if (!contents || contents.isDestroyed() || !text) return false;
    if (text.length > 5000) {
      this.onNotice?.("选中文字超过 5000 字符，请缩短后重试", "error");
      return false;
    }
    if (await this.confirmSensitive?.(input.pageUrl) === false) return false;
    await contents.executeJavaScript(CAPTURE_SELECTION_SCRIPT, true).catch(() => false);
    this.pending.get(contents.id)?.abort();
    const controller = new AbortController();
    this.pending.set(contents.id, controller);
    const originalUrl = String(input.pageUrl || contents.getURL());
    try {
      const status = await this.translationService.status();
      if (!status.configured) {
        this.onNotice?.("翻译 Provider 尚未配置，请前往设置与数据", "error");
        return false;
      }
      const [result] = await this.translationService.translateSegments(
        [{ segmentId: "selection", text }],
        { signal: controller.signal },
      );
      if (controller.signal.aborted || contents.isDestroyed() || contents.getURL() !== originalUrl) return false;
      if (!result) throw new Error("翻译服务未返回结果");
      const memory = {
        text,
        translated: result.translatedText,
        pageUrl: originalUrl,
        targetLanguage: status.settings.targetLanguage,
        providerName: status.providerName,
        detectedLanguage: result.detectedLanguage || "自动检测",
        x: Number(input.x || 24),
        y: Number(input.y || 24),
      };
      this.memory.set(contents.id, memory);
      await contents.executeJavaScript(popoverScript({ ...memory, original: memory.text }), true);
      return true;
    } catch (error) {
      const failure = /** @type {any} */ (error);
      if (!controller.signal.aborted && failure?.code !== "CANCELLED") {
        this.onNotice?.(failure?.message || "翻译失败", "error");
      }
      return false;
    } finally {
      if (this.pending.get(contents.id) === controller) this.pending.delete(contents.id);
    }
  }

  async query(input = {}) {
    const contents = input.webContents;
    const text = String(input.text || "").trim();
    if (!contents || contents.isDestroyed() || !text) return false;
    if (text.length > 2000) {
      this.onNotice?.("选中文字超过 2000 字符，请缩短后重试", "error");
      return false;
    }
    if (await this.confirmSensitive?.(input.pageUrl) === false) return false;
    const capture = await contents.executeJavaScript(CAPTURE_SELECTION_SCRIPT, true).catch(() => null);
    const anchor = {
      x: Number(capture?.captured ? capture.left : input.x || 24),
      y: Number(capture?.captured ? capture.bottom + 8 : input.y || 64),
      anchorTop: Number(capture?.captured ? capture.top : input.anchorTop || input.y || 64),
    };
    this.pending.get(contents.id)?.abort();
    const controller = new AbortController();
    this.pending.set(contents.id, controller);
    const originalUrl = String(input.pageUrl || contents.getURL());
    const memory = { kind: "insight", text, pageUrl: originalUrl, ...anchor };
    this.memory.set(contents.id, memory);
    try {
      const status = await this.translationService.status();
      if (!status.configured) {
        await contents.executeJavaScript(insightPopoverScript({
          ...memory,
          original: text,
          error: "请先在“设置与数据 → 翻译”中配置 DeepSeek API Key",
          providerName: "DeepSeek",
          realtimeSearch: false,
        }), true);
        this.onNotice?.("DeepSeek 尚未配置，请前往设置与数据", "error");
        return false;
      }
      await contents.executeJavaScript(insightPopoverScript({
        ...memory,
        original: text,
        loading: true,
        providerName: status.providerName,
        realtimeSearch: false,
      }), true);
      const result = await this.translationService.querySelection(text, { signal: controller.signal });
      if (controller.signal.aborted || contents.isDestroyed() || contents.getURL() !== originalUrl) return false;
      const completed = {
        ...memory,
        answer: result.answer,
        providerName: result.providerName || status.providerName,
        realtimeSearch: result.realtimeSearch === true,
      };
      this.memory.set(contents.id, completed);
      await contents.executeJavaScript(insightPopoverScript({ ...completed, original: text }), true);
      return true;
    } catch (error) {
      const failure = /** @type {any} */ (error);
      if (!controller.signal.aborted && failure?.code !== "CANCELLED") {
        if (!contents.isDestroyed() && contents.getURL() === originalUrl) {
          await contents.executeJavaScript(insightPopoverScript({
            ...memory,
            original: text,
            error: failure?.message || "DeepSeek 查询失败",
            providerName: "DeepSeek",
            realtimeSearch: false,
          }), true).catch(() => false);
        }
        this.onNotice?.(failure?.message || "DeepSeek 查询失败", "error");
      }
      return false;
    } finally {
      if (this.pending.get(contents.id) === controller) this.pending.delete(contents.id);
    }
  }

  async translateCurrentSelection(contents, context) {
    if (!contents || contents.isDestroyed()) return false;
    const text = await contents.executeJavaScript(CURRENT_SELECTION_SCRIPT, true).catch(() => "");
    return this.translate({ webContents: contents, text, pageUrl: contents.getURL(), context, x: 24, y: 64 });
  }

  async retry(contents, context) {
    const memory = this.memory.get(contents?.id);
    if (!memory) return false;
    return this.translate({ ...memory, webContents: contents, context });
  }

  async retryInsight(contents, context) {
    const memory = this.memory.get(contents?.id);
    if (!memory || memory.kind !== "insight") return false;
    return this.query({ ...memory, webContents: contents, context });
  }

  openInTranslationWebsite(contents) {
    const memory = this.memory.get(contents?.id);
    if (!memory) return false;
    const url = new URL("https://translate.google.com/");
    url.searchParams.set("sl", "auto");
    url.searchParams.set("tl", memory.targetLanguage);
    url.searchParams.set("text", memory.text);
    this.openExternal?.(url.toString());
    return true;
  }

  clear(contents) {
    if (contents?.id) {
      this.pending.get(contents.id)?.abort();
      this.pending.delete(contents.id);
      this.memory.delete(contents.id);
    }
  }
}

module.exports = {
  CAPTURE_SELECTION_SCRIPT,
  CURRENT_SELECTION_SCRIPT,
  SelectionActionService,
  insightPopoverScript,
  popoverScript,
  triggerScript,
};
