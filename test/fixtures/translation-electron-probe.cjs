const { app, BrowserWindow } = require("electron");
const fsp = require("node:fs/promises");
const { PageTextExtractor } = require("../../electron/translation/page-text-extractor.cjs");
const { PageTranslationRenderer } = require("../../electron/translation/page-translation-renderer.cjs");
const {
  CAPTURE_SELECTION_SCRIPT,
  insightPopoverScript,
} = require("../../electron/translation/selection-action-service.cjs");

app.enableSandbox();

app.whenReady().then(async () => {
  const window = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  const html = `<!doctype html><html><head><style>.hidden{display:none}</style></head><body>
    <main><h1>Visible heading</h1><p id="first">First paragraph</p><p>12345</p><pre>Do not translate</pre><input value="Private input" /><p class="hidden">Hidden paragraph</p></main>
  </body></html>`;
  await window.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
  await window.webContents.executeJavaScript(`(() => {
    const range=document.createRange();
    range.selectNodeContents(document.getElementById('first'));
    const selection=window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
  })()`);
  const selectionAnchor = await window.webContents.executeJavaScript(CAPTURE_SELECTION_SCRIPT, true);
  const insightShown = await window.webContents.executeJavaScript(insightPopoverScript({
    original: "First paragraph",
    answer: "这是页内 DeepSeek 解读。",
    providerName: "DeepSeek",
    realtimeSearch: false,
    x: selectionAnchor.left,
    y: selectionAnchor.bottom + 8,
    anchorTop: selectionAnchor.top,
  }), true);
  const insight = await window.webContents.executeJavaScript(`(() => {
    const panel=document.querySelector('[data-qiye-selection-insight-popover]');
    return {
      count: document.querySelectorAll('[data-qiye-selection-insight-popover]').length,
      text: panel?.textContent || '',
      position: panel ? { left: panel.style.left, top: panel.style.top } : null,
      pageUrl: location.href,
    };
  })()`);
  const extractor = new PageTextExtractor();
  const renderer = new PageTranslationRenderer();
  const initial = await extractor.extract(window.webContents);
  const results = initial.segments.map((segment) => ({
    segmentId: segment.segmentId,
    translatedText: `译:${segment.text}`,
    detectedLanguage: "en",
  }));
  const applied = await renderer.apply(window.webContents, results, { mode: "bilingual", observe: true });
  const bilingual = await window.webContents.executeJavaScript(`(() => ({
    original: document.getElementById('first').childNodes[0].nodeValue,
    translations: Array.from(document.querySelectorAll('[data-qiye-translation-output]')).map((node) => node.textContent),
    observerCount: window.__qiyeTranslationState?.observers?.length || 0
  }))()`);
  if (process.env.QIYE_TRANSLATION_CAPTURE_PATH) {
    window.show();
    await new Promise((resolve) => setTimeout(resolve, 120));
    const image = await window.webContents.capturePage();
    await fsp.writeFile(process.env.QIYE_TRANSLATION_CAPTURE_PATH, image.toPNG());
  }
  await renderer.setMode(window.webContents, "translated");
  const translatedOnly = await window.webContents.executeJavaScript(`document.getElementById('first').childNodes[0].nodeValue`);
  await window.webContents.executeJavaScript(`(() => { const p=document.createElement('p'); p.id='dynamic'; p.textContent='Dynamic paragraph'; document.querySelector('main').appendChild(p); })()`);
  const dynamic = await extractor.extract(window.webContents, { onlyUntranslated: true });
  await renderer.restore(window.webContents);
  const restored = await window.webContents.executeJavaScript(`(() => ({
    original: document.getElementById('first').textContent,
    translations: document.querySelectorAll('[data-qiye-translation-output]').length,
    stateExists: Boolean(window.__qiyeTranslationState)
  }))()`);
  console.log(JSON.stringify({ translationElectronProbe: { selectionAnchor, insightShown, insight, initial, applied, bilingual, translatedOnly, dynamic, restored } }));
  window.destroy();
  app.quit();
}).catch((error) => {
  console.error(error?.stack || error);
  app.exit(1);
});
