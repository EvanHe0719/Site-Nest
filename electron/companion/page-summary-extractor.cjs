function summaryExtractionScript(maxCharacters = 15_000) {
  const limit = Math.max(1_000, Math.min(20_000, Number(maxCharacters) || 15_000));
  return `(() => {
    const excluded='script,style,noscript,code,pre,input,textarea,select,option,button,[contenteditable],[aria-hidden="true"],[hidden],[data-qiye-translation-ui],[data-qiye-selection-insight-popover]';
    const visible=(node)=>{const element=node.parentElement;if(!element||element.closest(excluded))return false;const style=getComputedStyle(element);return style.display!=='none'&&style.visibility!=='hidden'&&Number(style.opacity)!==0&&element.getClientRects().length>0};
    const headings=Array.from(document.querySelectorAll('h1,h2,h3')).filter((element)=>!element.closest(excluded)&&element.getClientRects().length>0).map((element)=>String(element.textContent||'').trim()).filter(Boolean).slice(0,30);
    const parts=[];let length=0;const walker=document.createTreeWalker(document.body||document.documentElement,NodeFilter.SHOW_TEXT);
    let node;while((node=walker.nextNode())&&length<${limit}){if(!visible(node))continue;const text=String(node.nodeValue||'').replace(/\s+/g,' ').trim();if(text.length<2||/^(?:https?:\/\/|[\d\s.,:;!?%+\-–—_()[\]{}<>|/\\]+$)/i.test(text))continue;const remaining=${limit}-length;parts.push(text.slice(0,remaining));length+=Math.min(text.length,remaining)}
    return {title:String(document.title||'').slice(0,500),headings,text:parts.join('\n'),characterCount:length,truncated:length>=${limit}};
  })()`;
}

class CompanionPageSummaryExtractor {
  async extract(webContents, options = {}) {
    if (!webContents || webContents.isDestroyed()) return { title: "", headings: [], text: "", characterCount: 0, truncated: false };
    return webContents.executeJavaScript(summaryExtractionScript(options.maxCharacters), true);
  }
}

module.exports = { CompanionPageSummaryExtractor, summaryExtractionScript };
