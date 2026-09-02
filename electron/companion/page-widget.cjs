const COMPANION_WIDGET_WORLD_ID = 1002;
const COMPANION_WIDGET_HOST_ID = "qiye-xiaoxu-widget-host";
const LONG_FOCUS_MS = 25 * 60 * 1_000;

function text(value, limit = 240) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, limit);
}

function visualState(runtime = {}) {
  if (runtime.alertMessage) return "happy";
  if (runtime.reminder && runtime.state === "bubbleTip") return "happy";
  if (runtime.quietReason === "fullscreen" || runtime.longFocus === true) return "nap";
  if (runtime.state === "resting") return "breathing";
  return "idle";
}

function normalizeCompanionWidgetSnapshot(input = {}) {
  const runtime = input.runtime && typeof input.runtime === "object" ? input.runtime : {};
  const settings = input.settings && typeof input.settings === "object" ? input.settings : {};
  const weather = input.weather && typeof input.weather === "object" ? input.weather : {};
  const forecast = weather.snapshot && typeof weather.snapshot === "object" ? weather.snapshot : null;
  const reminder = runtime.reminder && typeof runtime.reminder === "object" ? runtime.reminder : null;
  const hardHidden = runtime.temporarilyHidden === true || ["screen-sharing", "system-away"].includes(runtime.quietReason);
  const activeSince = Date.parse(runtime.activeSince || "");
  const now = Number.isFinite(Number(input.now)) ? Number(input.now) : Date.now();
  const longFocus = runtime.longFocus === true
    || (runtime.state === "focusedDocked" && Number.isFinite(activeSince) && now - activeSince >= LONG_FOCUS_MS);
  return {
    visible: !hardHidden,
    enabled: settings.enabled === true,
    state: text(runtime.state || "silentHidden", 40),
    visualState: visualState({ ...runtime, longFocus, alertMessage: input.alertMessage }),
    muted: runtime.quietReason === "fullscreen" || longFocus,
    longFocus,
    quietReason: text(runtime.quietReason, 80),
    reminder: reminder ? { kind: text(reminder.kind, 40), message: text(reminder.message, 240) } : null,
    alertMessage: text(input.alertMessage, 240),
    weather: {
      configured: weather.configured === true,
      status: text(weather.status || "not-configured", 40),
      city: text(forecast?.city, 80),
      condition: text(forecast?.condition, 80),
      temperature: Number.isFinite(Number(forecast?.temperature)) ? Math.round(Number(forecast.temperature)) : null,
      apparentTemperature: Number.isFinite(Number(forecast?.apparentTemperature)) ? Math.round(Number(forecast.apparentTemperature)) : null,
      stale: forecast?.stale === true,
    },
    wellness: {
      enabled: settings.wellness?.enabled !== false,
      eyeRest: settings.wellness?.kinds?.["eye-rest"] !== false,
      water: settings.wellness?.kinds?.water !== false,
      movement: settings.wellness?.kinds?.movement !== false,
    },
    ai: {
      configured: input.ai?.configured === true,
      providerName: text(input.ai?.providerName, 80),
    },
  };
}

function companionWidgetInstallScript(initialSnapshot = {}) {
  const initial = JSON.stringify(normalizeCompanionWidgetSnapshot(initialSnapshot));
  return `(() => {
    const initial = ${initial};
    if (globalThis.__qiyeXiaoxuWidget) {
      globalThis.__qiyeXiaoxuWidget.update(initial);
      return true;
    }
    document.getElementById(${JSON.stringify(COMPANION_WIDGET_HOST_ID)})?.remove();
    const host = document.createElement('div');
    host.id = ${JSON.stringify(COMPANION_WIDGET_HOST_ID)};
    host.dataset.qiyeCompanionHost = 'true';
    Object.assign(host.style, {
      display: 'block', position: 'fixed', right: '18px', bottom: '18px', width: '52px', height: '52px',
      zIndex: '2147483647', overflow: 'visible', pointerEvents: 'auto', contain: 'layout style',
      colorScheme: 'light', fontFamily: 'Inter, "Microsoft YaHei UI", "Microsoft YaHei", sans-serif'
    });
    for (const property of ['display','position','right','bottom','width','height','z-index','overflow','pointer-events','contain','color-scheme','font-family']) {
      host.style.setProperty(property, host.style.getPropertyValue(property), 'important');
    }
    const shadow = host.attachShadow({ mode: 'closed' });
    const css = \`
      :host { all: initial; }
      *, *::before, *::after { box-sizing: border-box; }
      button, input { font: inherit; }
      button { -webkit-tap-highlight-color: transparent; }
      .orb { position:absolute; right:0; bottom:0; display:grid; width:48px; height:48px; padding:0; place-items:center; border:0; border-radius:50%; background:transparent; cursor:pointer; pointer-events:auto; isolation:isolate; transition:opacity .45s ease, transform .45s cubic-bezier(.16,1,.3,1); }
      .core { position:relative; z-index:3; display:flex; width:40px; height:40px; align-items:center; justify-content:center; gap:7px; border-radius:50%; background:linear-gradient(135deg,#b7f7dc 0%,#3b9d80 42%,#176451 72%,#0d433d 100%); box-shadow:0 5px 18px rgba(21,103,81,.34),0 0 18px rgba(110,231,183,.25),inset 0 1px 1px rgba(255,255,255,.48); animation:float 3s ease-in-out infinite; }
      .eye { width:4px; height:5px; border-radius:2px; background:#0f3d32; animation:blink 4.5s infinite; }
      .halo { position:absolute; inset:4px; z-index:1; border:1.5px solid rgba(52,211,153,.52); border-radius:50%; opacity:0; pointer-events:none; filter:drop-shadow(0 0 7px rgba(52,211,153,.46)); }
      .halo.h2 { border-color:rgba(110,231,183,.43); }
      .halo.h3 { border-color:rgba(167,243,208,.34); }
      .halo.h4 { border-color:rgba(20,184,166,.25); }
      .zzz { position:absolute; top:-8px; right:-5px; display:none; color:rgba(38,125,103,.82); font-size:10px; font-weight:800; animation:zzz 1.8s ease-in-out infinite; }
      .orb[data-visual-state="idle"] .halo { animation:water-wave 4.8s infinite cubic-bezier(.16,.68,.3,1); }
      .orb[data-visual-state="breathing"] .halo { animation:water-wave 3.25s infinite cubic-bezier(.16,.68,.3,1); }
      .orb .halo.h2 { animation-delay:-1.05s; }
      .orb .halo.h3 { animation-delay:-2.1s; }
      .orb .halo.h4 { animation-delay:-3.15s; }
      .orb.is-rippling .halo { animation:active-ripple 1.65s both cubic-bezier(.1,.72,.24,1); }
      .orb.is-rippling .halo.h2 { animation-delay:.12s; }
      .orb.is-rippling .halo.h3 { animation-delay:.24s; }
      .orb.is-rippling .halo.h4 { animation-delay:.36s; }
      .orb[data-visual-state="nap"] { opacity:.26; transform:translateY(10px) scale(.88); }
      .orb[data-visual-state="nap"] .core { animation:none; }
      .orb[data-visual-state="nap"] .eye { width:7px; height:4px; border:0; border-top:2px solid #0a2b22; border-radius:50% 50% 0 0; background:transparent; animation:none; }
      .orb[data-visual-state="nap"] .zzz { display:block; }
      .orb[data-visual-state="happy"] .eye { width:7px; height:7px; border:0; border-top:2px solid #0a2b22; border-left:2px solid #0a2b22; border-radius:1px; background:transparent; animation:happy .8s ease-in-out infinite alternate; }
      .orb.is-disabled .core { filter:saturate(.35); opacity:.72; }
      .panel { position:absolute; right:0; bottom:60px; width:286px; max-height:calc(100vh - 96px); overflow:hidden auto; pointer-events:auto; border:1px solid rgba(38,125,103,.2); border-radius:18px; background:rgba(255,255,255,.97); box-shadow:0 18px 46px rgba(24,55,45,.2); color:#18211f; backdrop-filter:blur(16px); animation:open .2s cubic-bezier(.16,1,.3,1); }
      .panel[hidden] { display:none; }
      .head { display:flex; align-items:center; justify-content:space-between; gap:8px; padding:12px 13px 8px; }
      .identity { display:flex; align-items:center; gap:8px; min-width:0; }
      .mini { width:24px; height:24px; flex:0 0 24px; border-radius:50%; background:linear-gradient(135deg,#a7f3d0,#267d67 58%,#134e4a); box-shadow:0 3px 10px rgba(38,125,103,.25); }
      .identity strong { display:block; font-size:14px; }
      .identity small { display:block; max-width:180px; overflow:hidden; color:#77857f; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
      .close { width:28px; height:28px; border:0; border-radius:9px; background:#f3f6f4; color:#60716b; cursor:pointer; }
      .notice { margin:0 12px 8px; padding:8px 10px; border:1px solid rgba(38,125,103,.18); border-radius:11px; background:#edf6f2; color:#31594d; font-size:11px; line-height:1.45; }
      .notice[hidden] { display:none; }
      .tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:6px; padding:0 12px 9px; }
      .tab { min-height:34px; border:1px solid #dbe5e0; border-radius:10px; background:#fff; color:#48675d; cursor:pointer; font-size:11px; }
      .tab[aria-selected="true"] { border-color:#6aa58f; background:#e8f3ef; color:#1c6654; font-weight:700; }
      .body { padding:0 12px 12px; }
      .pane { display:grid; min-height:84px; gap:8px; padding:11px; border-radius:12px; background:#f6f8f6; color:#52635d; font-size:11px; line-height:1.55; }
      .pane[hidden] { display:none; }
      .pane strong { color:#294c41; font-size:12px; }
      .row { display:flex; gap:7px; }
      .ask { display:flex; gap:6px; }
      .ask input { min-width:0; height:34px; flex:1; padding:0 9px; border:1px solid #d5e1db; border-radius:9px; outline:0; color:#203c34; background:#fff; }
      .ask input:focus { border-color:#6aa58f; box-shadow:0 0 0 3px rgba(38,125,103,.1); }
      .action { min-height:32px; padding:0 10px; border:0; border-radius:9px; background:#267d67; color:#fff; cursor:pointer; font-size:11px; }
      .action.secondary { border:1px solid #d5e1db; background:#fff; color:#31594d; }
      .action:disabled { opacity:.5; cursor:not-allowed; }
      .result { max-height:132px; overflow:auto; white-space:pre-wrap; overflow-wrap:anywhere; }
      @keyframes open { from { transform:translateY(6px) scale(.97); opacity:0; } to { transform:none; opacity:1; } }
      @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
      @keyframes blink { 0%,96%,100% { transform:scaleY(1); } 98% { transform:scaleY(.1); } }
      @keyframes water-wave { 0% { transform:scale(.72); opacity:0; } 14% { opacity:.54; } 62%,100% { transform:scale(2.15); opacity:0; } }
      @keyframes active-ripple { 0% { transform:scale(.7); opacity:.84; border-width:2px; } 75%,100% { transform:scale(2.35); opacity:0; border-width:.5px; } }
      @keyframes zzz { 0%,100% { transform:translate(0,2px); opacity:.38; } 50% { transform:translate(2px,-3px); opacity:.9; } }
      @keyframes happy { from { transform:translateY(1px) rotate(45deg) scale(.92); } to { transform:rotate(45deg); } }
      @media (prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none!important; transition:none!important; } }
    \`;
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      shadow.adoptedStyleSheets = [sheet];
    } catch {
      const style = document.createElement('style'); style.textContent = css; shadow.append(style);
    }
    const wrap = document.createElement('div');
    wrap.innerHTML = \`
      <section class="panel" aria-label="小序悬浮助手" hidden>
        <div class="head"><div class="identity"><span class="mini"></span><span><strong>小序</strong><small class="state">正在读取状态</small></span></div><button class="close" type="button" aria-label="关闭">×</button></div>
        <div class="notice" hidden></div>
        <div class="tabs" role="tablist"><button class="tab" type="button" data-pane="weather" aria-selected="true">天气</button><button class="tab" type="button" data-pane="health" aria-selected="false">健康</button><button class="tab" type="button" data-pane="ask" aria-selected="false">问小序</button></div>
        <div class="body">
          <div class="pane" data-content="weather"><strong>天气状态</strong><span class="weather">尚未配置天气</span><div><button class="action secondary refresh" type="button">刷新天气</button></div></div>
          <div class="pane" data-content="health" hidden><strong>健康提醒</strong><span class="health">正在读取设置</span></div>
          <div class="pane" data-content="ask" hidden><strong>问小序</strong><form class="ask"><input maxlength="4000" placeholder="输入问题，不会自动读取网页" aria-label="向小序提问"><button class="action send" type="submit">发送</button></form><span class="result">仅发送你手动输入的文字。</span></div>
        </div>
      </section>
      <button class="orb" type="button" aria-label="打开小序" aria-expanded="false"><span class="halo h1"></span><span class="halo h2"></span><span class="halo h3"></span><span class="halo h4"></span><span class="core"><i class="eye"></i><i class="eye"></i><span class="zzz">zZ</span></span></button>
    \`;
    shadow.append(wrap);
    const panel = shadow.querySelector('.panel');
    const orb = shadow.querySelector('.orb');
    const notice = shadow.querySelector('.notice');
    const stateText = shadow.querySelector('.state');
    const weatherText = shadow.querySelector('.weather');
    const healthText = shadow.querySelector('.health');
    const result = shadow.querySelector('.result');
    const askInput = shadow.querySelector('.ask input');
    const askSend = shadow.querySelector('.send');
    let snapshot = initial;
    let rippleTimer = null;
    const stateLabels = { idle:'待机', breathing:'休息中', nap:'专注免打扰', happy:'有新提醒' };
    const syncHostBox = () => {
      const panelOpen = !panel.hidden;
      const panelHeight = panelOpen ? Math.ceil(Math.min(panel.scrollHeight, Math.max(120, innerHeight - 96))) : 0;
      host.style.setProperty('width', panelOpen ? '286px' : '52px', 'important');
      host.style.setProperty('height', panelOpen ? \`\${panelHeight + 60}px\` : '52px', 'important');
    };
    const setPanelOpen = (open) => {
      panel.hidden = !open;
      orb.setAttribute('aria-expanded', String(open));
      syncHostBox();
    };
    const triggerRipple = () => {
      if (rippleTimer) clearTimeout(rippleTimer);
      orb.classList.remove('is-rippling');
      void orb.offsetWidth;
      orb.classList.add('is-rippling');
      rippleTimer = setTimeout(() => { orb.classList.remove('is-rippling'); rippleTimer = null; }, 1850);
    };
    const mount = () => {
      const fullscreen = document.fullscreenElement;
      const target = fullscreen && !/^(?:VIDEO|IFRAME)$/.test(fullscreen.tagName) ? fullscreen : document.documentElement;
      if (host.parentElement !== target) target.append(host);
    };
    const render = (next) => {
      const wasMuted = snapshot?.muted === true;
      snapshot = next || snapshot;
      host.hidden = snapshot.visible === false;
      if (snapshot.visible === false || (snapshot.muted === true && !wasMuted)) setPanelOpen(false);
      orb.dataset.visualState = snapshot.visualState || 'idle';
      orb.classList.toggle('is-disabled', snapshot.enabled !== true);
      stateText.textContent = snapshot.enabled
        ? (snapshot.state === 'focusedDocked' && !snapshot.longFocus ? '安静陪伴' : (stateLabels[snapshot.visualState] || '待机'))
        : '尚未启用';
      const message = snapshot.alertMessage || snapshot.reminder?.message || '';
      notice.hidden = !message; notice.textContent = message;
      const weather = snapshot.weather || {};
      weatherText.textContent = weather.configured
        ? weather.temperature === null ? '已配置，尚无天气数据' : \`\${weather.city || '当前城市'} · \${weather.condition || '天气'} · \${weather.temperature}℃\${weather.stale ? '（缓存）' : ''}\`
        : '尚未配置天气，请在栖页设置中开启并填写城市。';
      const wellness = snapshot.wellness || {};
      const enabledKinds = [wellness.eyeRest && '护眼', wellness.water && '喝水', wellness.movement && '活动'].filter(Boolean);
      healthText.textContent = wellness.enabled && enabledKinds.length ? \`已启用：\${enabledKinds.join('、')}。\` : '健康提醒尚未启用。';
      syncHostBox();
    };
    const selectPane = (name) => {
      shadow.querySelectorAll('.tab').forEach((button) => button.setAttribute('aria-selected', String(button.dataset.pane === name)));
      shadow.querySelectorAll('.pane').forEach((pane) => { pane.hidden = pane.dataset.content !== name; });
      if (name === 'ask') askInput.focus();
    };
    const refreshStatus = async () => {
      const response = await globalThis.qiyeCompanionHost?.invoke('status', {});
      if (response?.ok && response.value) render(response.value);
    };
    orb.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      triggerRipple();
      setPanelOpen(panel.hidden);
      if (!panel.hidden) void refreshStatus();
    });
    shadow.querySelector('.close').addEventListener('click', (event) => { if (event.isTrusted) setPanelOpen(false); });
    shadow.querySelectorAll('.tab').forEach((button) => button.addEventListener('click', (event) => { if (event.isTrusted) { triggerRipple(); selectPane(button.dataset.pane); } }));
    shadow.querySelector('.refresh').addEventListener('click', async (event) => {
      if (!event.isTrusted) return;
      triggerRipple();
      event.currentTarget.disabled = true; weatherText.textContent = '正在刷新天气…';
      const response = await globalThis.qiyeCompanionHost?.invoke('weather.refresh', {});
      event.currentTarget.disabled = false;
      if (response?.ok && response.value) render(response.value); else weatherText.textContent = response?.error?.message || '天气刷新失败';
    });
    shadow.querySelector('.ask').addEventListener('submit', async (event) => {
      event.preventDefault(); if (!event.isTrusted) return;
      const question = String(askInput.value || '').trim(); if (!question) return;
      triggerRipple();
      askSend.disabled = true; result.textContent = '小序正在思考…';
      const response = await globalThis.qiyeCompanionHost?.invoke('ask', { question });
      askSend.disabled = false;
      result.textContent = response?.ok ? (response.value?.answer || '已完成') : (response?.error?.message || '请求未完成');
      triggerRipple();
    });
    for (const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keypress','keyup','beforeinput','input','change','submit','wheel','focusin','focusout']) {
      shadow.addEventListener(type, (event) => event.stopPropagation());
    }
    const resizeObserver = new ResizeObserver(syncHostBox);
    resizeObserver.observe(panel);
    document.addEventListener('fullscreenchange', mount, true);
    setPanelOpen(false); mount(); render(initial);
    globalThis.__qiyeXiaoxuWidget = {
      update: render,
      probe: (action, payload = {}) => {
        if (action === 'open') { triggerRipple(); setPanelOpen(true); return true; }
        if (action === 'select-ask') { triggerRipple(); selectPane('ask'); return true; }
        if (action === 'type') {
          askInput.focus();
          askInput.value = String(payload.value || '');
          askInput.dispatchEvent(new KeyboardEvent('keydown', { key:'x', code:'KeyX', bubbles:true, composed:true }));
          askInput.dispatchEvent(new InputEvent('input', { data:askInput.value, inputType:'insertText', bubbles:true, composed:true }));
          return true;
        }
        if (action === 'click-isolation') {
          shadow.querySelector('[data-pane="ask"]').dispatchEvent(new MouseEvent('click', { bubbles:true, composed:true }));
          return true;
        }
        return false;
      },
      inspect: () => {
        const rect = orb.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const hostStyle = getComputedStyle(host);
        return {
          hostConnected: host.isConnected,
          hostParentTag: host.parentElement?.tagName || '',
          hostPosition: hostStyle.position,
          hostRight: hostStyle.right,
          hostBottom: hostStyle.bottom,
          panelOpen: !panel.hidden,
          panelLayoutWidth: panel.offsetWidth,
          visualState: orb.dataset.visualState || '',
          rippling: orb.classList.contains('is-rippling'),
          orbRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          panelRect: { x: panelRect.x, y: panelRect.y, width: panelRect.width, height: panelRect.height },
          askTabRect: (() => { const value = shadow.querySelector('[data-pane="ask"]').getBoundingClientRect(); return { x:value.x, y:value.y, width:value.width, height:value.height }; })(),
          askInputRect: (() => { const value = askInput.getBoundingClientRect(); return { x:value.x, y:value.y, width:value.width, height:value.height }; })(),
          askValue: askInput.value,
          askFocused: shadow.activeElement === askInput,
          viewport: { width: innerWidth, height: innerHeight },
        };
      },
    };
    return true;
  })()`;
}

function companionWidgetUpdateScript(snapshot = {}) {
  const value = JSON.stringify(normalizeCompanionWidgetSnapshot(snapshot));
  return `Boolean(globalThis.__qiyeXiaoxuWidget && (globalThis.__qiyeXiaoxuWidget.update(${value}), true))`;
}

module.exports = {
  COMPANION_WIDGET_HOST_ID,
  COMPANION_WIDGET_WORLD_ID,
  companionWidgetInstallScript,
  companionWidgetUpdateScript,
  normalizeCompanionWidgetSnapshot,
  visualState,
};
