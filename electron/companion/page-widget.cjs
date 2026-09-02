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
  const enabled = settings.enabled === true;
  const wellnessEnabled = settings.wellness?.enabled !== false;
  return {
    visible: !hardHidden,
    enabled,
    available: enabled || wellnessEnabled || weather.configured === true || input.ai?.configured === true,
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
      enabled: wellnessEnabled,
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
      .core { position:relative; z-index:3; display:flex; width:42px; height:42px; align-items:center; justify-content:center; gap:7px; border:1px solid rgba(255,255,255,.74); border-radius:50%; background:linear-gradient(145deg,#bcffe2 0%,#68ddb2 32%,#22a781 62%,#08705c 100%); box-shadow:0 8px 22px rgba(8,112,92,.3),0 0 24px rgba(74,222,171,.36),inset 0 2px 3px rgba(255,255,255,.64); animation:float 3s ease-in-out infinite; filter:saturate(1.12) brightness(1.1); }
      .face-eye { width:5px; height:8px; flex:0 0 auto; border-radius:999px; background:radial-gradient(circle at 38% 24%,#f7fffb 0 14%,#b8f5dc 15% 23%,#0b4638 28% 100%); box-shadow:0 1px 2px rgba(4,57,44,.28); transform-origin:center; animation:blink 4.5s infinite; }
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
      .orb[data-visual-state="nap"] .face-eye { width:7px; height:4px; border:0; border-top:2px solid #0a2b22; border-radius:50% 50% 0 0; background:transparent; box-shadow:none; animation:none; }
      .orb[data-visual-state="nap"] .zzz { display:block; }
      .orb[data-visual-state="happy"] .face-eye { width:7px; height:5px; border:0; border-bottom:2px solid #0a2b22; border-radius:0 0 50% 50%; background:transparent; box-shadow:none; animation:happy .8s ease-in-out infinite alternate; }
      .orb.is-disabled .core { opacity:1; filter:saturate(1.12) brightness(1.1); }
      .panel { position:absolute; right:0; bottom:60px; display:flex; width:360px; max-height:calc(100vh - 96px); flex-direction:column; overflow:hidden; pointer-events:auto; border:1px solid rgba(255,255,255,.78); border-radius:24px; background:linear-gradient(145deg,rgba(255,255,255,.84),rgba(242,249,246,.7)); box-shadow:0 24px 64px rgba(36,62,55,.23),inset 0 1px 0 rgba(255,255,255,.96); color:#18211f; backdrop-filter:blur(28px) saturate(150%); -webkit-backdrop-filter:blur(28px) saturate(150%); animation:open .24s cubic-bezier(.16,1,.3,1); }
      .panel[hidden] { display:none; }
      .head { display:flex; min-height:58px; align-items:center; gap:9px; padding:12px 13px 9px; border-bottom:1px solid rgba(86,110,101,.11); }
      .identity { display:flex; align-items:center; gap:8px; min-width:0; }
      .mini { position:relative; display:flex; width:28px; height:28px; flex:0 0 28px; align-items:center; justify-content:center; gap:4px; border:1px solid rgba(255,255,255,.82); border-radius:50%; background:linear-gradient(145deg,#adf7d8,#43c397 55%,#08705c); box-shadow:0 4px 12px rgba(8,112,92,.24),inset 0 1px 2px rgba(255,255,255,.55); }
      .mini .face-eye { width:3px; height:6px; }
      .mini-zzz { position:absolute; top:-7px; right:-6px; display:none; color:rgba(38,125,103,.82); font-size:8px; font-weight:800; animation:zzz 1.8s ease-in-out infinite; }
      .mini[data-visual-state="nap"] { opacity:.58; filter:saturate(.72); }
      .mini[data-visual-state="nap"] .face-eye { width:5px; height:3px; border-top:1.5px solid #0a2b22; border-radius:50% 50% 0 0; background:transparent; box-shadow:none; animation:none; }
      .mini[data-visual-state="nap"] .mini-zzz { display:block; }
      .mini[data-visual-state="happy"] .face-eye { width:5px; height:4px; border-bottom:1.5px solid #0a2b22; border-radius:0 0 50% 50%; background:transparent; box-shadow:none; animation:happy .8s ease-in-out infinite alternate; }
      .identity strong { display:inline; font-size:13px; }
      .identity small { display:inline; margin-left:7px; padding:3px 7px; border-radius:6px; background:rgba(46,164,127,.1); color:#447267; font-size:10px; white-space:nowrap; }
      .weather-pill { display:flex; min-width:0; height:28px; margin-left:auto; padding:0 9px; align-items:center; overflow:hidden; border:1px solid rgba(91,127,114,.16); border-radius:999px; background:rgba(255,255,255,.58); color:#2d4f45; box-shadow:0 2px 8px rgba(60,85,76,.08); cursor:pointer; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
      .weather-pill.is-empty { color:#78857f; }
      .close { width:28px; height:28px; flex:0 0 28px; border:0; border-radius:50%; background:rgba(255,255,255,.62); color:#60716b; cursor:pointer; font-size:17px; }
      .body { display:flex; min-height:0; flex:1; flex-direction:column; gap:9px; overflow:hidden; padding:11px 13px 9px; }
      .conversation { display:flex; min-height:0; max-height:clamp(112px,calc(100vh - 238px),620px); flex:0 1 auto; flex-direction:column; gap:9px; overflow-x:hidden; overflow-y:auto; overscroll-behavior:contain; padding:1px 3px 4px 1px; scrollbar-color:rgba(79,118,104,.38) transparent; scrollbar-width:thin; }
      .conversation::-webkit-scrollbar { width:5px; }
      .conversation::-webkit-scrollbar-thumb { border-radius:999px; background:rgba(79,118,104,.34); }
      .conversation::-webkit-scrollbar-track { background:transparent; }
      .message { width:fit-content; min-width:0; max-width:92%; flex:none; align-self:flex-start; padding:10px 12px; border:1px solid rgba(95,120,111,.14); border-radius:14px 14px 14px 5px; background:rgba(255,255,255,.68); box-shadow:0 5px 14px rgba(54,76,69,.08); color:#344740; font-size:12px; line-height:1.58; white-space:pre-wrap; overflow-wrap:anywhere; }
      .message.user { max-width:84%; align-self:flex-end; border-color:rgba(41,141,111,.18); border-radius:14px 14px 5px 14px; background:rgba(218,244,234,.82); color:#174d3d; }
      .message.notice { border-color:rgba(38,125,103,.18); background:rgba(235,250,244,.76); color:#31594d; }
      .message[hidden] { display:none; }
      .composer-frame { display:block; width:100%; height:42px; border:0; border-radius:15px; background:transparent; }
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
        <div class="head"><div class="identity"><span class="mini" data-visual-state="idle" aria-hidden="true"><i class="face-eye"></i><i class="face-eye"></i><span class="mini-zzz">zZ</span></span><span><strong>小序</strong><small class="state">陪伴中</small></span></div><button class="weather-pill is-empty" type="button" aria-label="刷新天气">☁ 天气待更新</button><button class="close" type="button" aria-label="关闭">×</button></div>
        <div class="body">
          <div class="conversation" role="log" aria-label="小序对话" aria-live="polite">
            <div class="message assistant welcome-message"><span class="welcome">我在这里，可以直接问我问题。</span></div>
            <div class="message assistant notice" hidden></div>
          </div>
          <iframe class="composer-frame" title="小序输入框" aria-label="小序输入框"></iframe>
        </div>
      </section>
      <button class="orb" type="button" aria-label="打开小序" aria-expanded="false"><span class="halo h1"></span><span class="halo h2"></span><span class="halo h3"></span><span class="halo h4"></span><span class="core"><i class="face-eye"></i><i class="face-eye"></i><span class="zzz">zZ</span></span></button>
    \`;
    shadow.append(wrap);
    const panel = shadow.querySelector('.panel');
    const orb = shadow.querySelector('.orb');
    const mini = shadow.querySelector('.mini');
    const notice = shadow.querySelector('.notice');
    const conversation = shadow.querySelector('.conversation');
    const stateText = shadow.querySelector('.state');
    const weatherPill = shadow.querySelector('.weather-pill');
    const welcome = shadow.querySelector('.welcome');
    const composerFrame = shadow.querySelector('.composer-frame');
    let composerDoc = null;
    let askInput = null;
    let askSend = null;
    const composerCss = \`
      :root { color-scheme:light; font-family:Inter,"Microsoft YaHei UI","Microsoft YaHei",sans-serif; }
      * { box-sizing:border-box; }
      .ask { display:flex; width:100%; height:40px; margin:0; padding:4px 4px 4px 11px; align-items:center; gap:7px; border:1px solid rgba(104,132,121,.2); border-radius:15px; background:rgba(255,255,255,.72); box-shadow:inset 0 1px 0 rgba(255,255,255,.86); }
      .ask:focus-within { border-color:rgba(35,139,108,.48); box-shadow:0 0 0 3px rgba(48,174,134,.11),inset 0 1px 0 rgba(255,255,255,.9); }
      input { min-width:0; height:100%; flex:1; padding:0; border:0; outline:0; background:transparent; color:#203c34; font:12px Inter,"Microsoft YaHei UI","Microsoft YaHei",sans-serif; }
      input::placeholder { color:#91a09b; }
      .send { display:grid; width:32px; height:32px; flex:0 0 32px; padding:0; place-items:center; border:0; border-radius:11px; background:linear-gradient(145deg,#2aa27f,#08715c); box-shadow:0 5px 12px rgba(8,113,92,.22); color:#fff; cursor:pointer; font:21px/1 Inter,"Microsoft YaHei UI","Microsoft YaHei",sans-serif; }
      .send:disabled { opacity:.48; cursor:wait; }
    \`;
    let snapshot = initial;
    let rippleTimer = null;
    let expressionTimer = null;
    const greeting = () => {
      const hour = new Date().getHours();
      if (hour < 6) return '夜深了';
      if (hour < 12) return '上午好';
      if (hour < 18) return '下午好';
      return '晚上好';
    };
    const syncHostBox = () => {
      const panelOpen = !panel.hidden;
      const panelHeight = panelOpen ? Math.ceil(Math.min(panel.scrollHeight, Math.max(120, innerHeight - 96))) : 0;
      const panelWidth = Math.max(292, Math.min(360, innerWidth - 24));
      panel.style.width = panelWidth + 'px';
      host.style.setProperty('width', panelOpen ? panelWidth + 'px' : '52px', 'important');
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
    const applyVisualState = (value) => {
      const nextState = value || 'idle';
      orb.dataset.visualState = nextState;
      mini.dataset.visualState = nextState;
    };
    const showTemporaryExpression = (value, duration = 2200) => {
      if (expressionTimer) clearTimeout(expressionTimer);
      applyVisualState(value);
      expressionTimer = setTimeout(() => {
        expressionTimer = null;
        applyVisualState(snapshot.visualState || 'idle');
      }, duration);
    };
    const scrollConversationToEnd = () => requestAnimationFrame(() => {
      conversation.scrollTop = conversation.scrollHeight;
      syncHostBox();
    });
    const appendMessage = (role, content) => {
      const bubble = document.createElement('div');
      bubble.className = \`message \${role === 'user' ? 'user' : 'assistant'}\`;
      bubble.setAttribute('aria-label', role === 'user' ? '你' : '小序');
      bubble.textContent = String(content || '');
      conversation.append(bubble);
      const history = [...conversation.querySelectorAll('.message:not(.welcome-message):not(.notice)')];
      while (history.length > 24) history.shift()?.remove();
      scrollConversationToEnd();
      return bubble;
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
      if (expressionTimer) { clearTimeout(expressionTimer); expressionTimer = null; }
      applyVisualState(snapshot.visualState || 'idle');
      orb.classList.toggle('is-disabled', snapshot.enabled !== true);
      stateText.textContent = snapshot.enabled ? '陪伴中' : snapshot.available ? '已就绪' : '待机';
      const message = snapshot.alertMessage || snapshot.reminder?.message || '';
      notice.hidden = !message; notice.textContent = message;
      const weather = snapshot.weather || {};
      weatherPill.classList.toggle('is-empty', !weather.configured);
      weatherPill.textContent = weather.configured
        ? weather.temperature === null ? '☁ 天气已开启' : \`☁ \${weather.temperature}℃ \${weather.condition || weather.city || '天气'}\`
        : '☁ 天气待设置';
      const wellness = snapshot.wellness || {};
      const enabledKinds = [wellness.eyeRest && '护眼', wellness.water && '喝水', wellness.movement && '活动'].filter(Boolean);
      const weatherSentence = weather.configured
        ? weather.temperature === null
          ? '天气功能已经开启，正在等待最新数据。'
          : \`\${weather.city || '当前城市'}现在\${weather.condition || '天气平稳'}，约 \${weather.temperature}℃。\`
        : '';
      const healthSentence = wellness.enabled && enabledKinds.length ? \`我会留意\${enabledKinds.join('、')}提醒。\` : '';
      welcome.textContent = [\`\${greeting()}！我在这里。\`, weatherSentence, healthSentence].filter(Boolean).join(' ');
      syncHostBox();
    };
    const refreshStatus = async () => {
      const response = await globalThis.qiyeCompanionHost?.invoke('status', {});
      if (response?.ok && response.value) render(response.value);
    };
    async function submitQuestion(event) {
      event.preventDefault(); if (!event.isTrusted || !askInput || !askSend) return;
      const question = String(askInput.value || '').trim(); if (!question) return;
      triggerRipple();
      appendMessage('user', question);
      const reply = appendMessage('assistant', '小序正在思考…');
      askInput.value = '';
      askSend.disabled = true;
      applyVisualState('breathing');
      let response;
      try {
        response = await globalThis.qiyeCompanionHost?.invoke('ask', { question });
      } catch {
        response = { ok:false, error:{ message:'请求未完成' } };
      }
      askSend.disabled = false;
      reply.textContent = response?.ok ? (response.value?.answer || '已完成') : (response?.error?.message || '请求未完成');
      if (response?.ok) showTemporaryExpression('happy'); else applyVisualState(snapshot.visualState || 'idle');
      focusComposer();
      triggerRipple(); scrollConversationToEnd();
    }
    function initializeComposer() {
      const nextDoc = composerFrame.contentDocument;
      if (!nextDoc?.documentElement || !nextDoc.body) return false;
      composerDoc = nextDoc;
      if (composerDoc.documentElement.dataset.qiyeComposerReady === 'true') {
        askInput = composerDoc.querySelector('.ask input');
        askSend = composerDoc.querySelector('.send');
        return Boolean(askInput && askSend);
      }
      composerDoc.documentElement.dataset.qiyeComposerReady = 'true';
      composerDoc.documentElement.lang = 'zh-CN';
      composerDoc.documentElement.style.background = 'transparent';
      composerDoc.body.style.margin = '0';
      composerDoc.body.style.background = 'transparent';
      composerDoc.body.innerHTML = '<form class="ask"><input maxlength="4000" autocomplete="off" spellcheck="false" placeholder="问小序天气、健康或其他问题…" aria-label="向小序提问"><button class="send" type="submit" aria-label="发送">→</button></form>';
      try {
        const ComposerSheet = composerFrame.contentWindow.CSSStyleSheet;
        const sheet = new ComposerSheet(); sheet.replaceSync(composerCss); composerDoc.adoptedStyleSheets = [sheet];
      } catch {
        const style = composerDoc.createElement('style'); style.textContent = composerCss; composerDoc.head.append(style);
      }
      askInput = composerDoc.querySelector('.ask input');
      askSend = composerDoc.querySelector('.send');
      composerDoc.querySelector('.ask')?.addEventListener('submit', submitQuestion);
      return Boolean(askInput && askSend);
    }
    function focusComposer() {
      if (!askInput && !initializeComposer()) return false;
      composerFrame.contentWindow?.focus();
      askInput.focus({ preventScroll:true });
      return composerDoc?.activeElement === askInput;
    }
    orb.addEventListener('click', (event) => {
      if (!event.isTrusted) return;
      triggerRipple();
      setPanelOpen(panel.hidden);
      if (!panel.hidden) void refreshStatus();
    });
    shadow.querySelector('.close').addEventListener('click', (event) => { if (event.isTrusted) setPanelOpen(false); });
    weatherPill.addEventListener('click', async (event) => {
      if (!event.isTrusted) return;
      triggerRipple();
      event.currentTarget.disabled = true; weatherPill.textContent = '☁ 正在更新…';
      const response = await globalThis.qiyeCompanionHost?.invoke('weather.refresh', {});
      event.currentTarget.disabled = false;
      if (response?.ok && response.value) render(response.value);
      else appendMessage('assistant', response?.error?.message || '天气刷新失败');
    });
    for (const type of ['pointerdown','pointerup','mousedown','mouseup','click','dblclick','contextmenu','keydown','keypress','keyup','beforeinput','input','change','submit','wheel','focusin','focusout']) {
      shadow.addEventListener(type, (event) => event.stopPropagation());
    }
    const resizeObserver = new ResizeObserver(syncHostBox);
    resizeObserver.observe(panel);
    document.addEventListener('fullscreenchange', mount, true);
    composerFrame.addEventListener('load', initializeComposer);
    composerFrame.src = 'about:blank';
    setTimeout(initializeComposer, 0);
    setPanelOpen(false); mount(); render(initial); setTimeout(() => void refreshStatus(), 0);
    globalThis.__qiyeXiaoxuWidget = {
      update: render,
      probe: (action, payload = {}) => {
        if (action === 'open') { triggerRipple(); setPanelOpen(true); return true; }
        if (action === 'close') { setPanelOpen(false); return true; }
        if (action === 'select-ask' || action === 'focus-ask') return focusComposer();
        if (action === 'preview-reply') {
          appendMessage('user', payload.question || '测试问题');
          appendMessage('assistant', payload.answer || '测试回答');
          showTemporaryExpression('happy', 4000);
          return true;
        }
        if (action === 'type') {
          if (!askInput && !initializeComposer()) return false;
          focusComposer();
          askInput.value = String(payload.value || '');
          askInput.dispatchEvent(new InputEvent('input', { data:askInput.value, inputType:'insertText', bubbles:true, composed:true }));
          return true;
        }
        if (action === 'click-isolation') {
          if (!composerDoc && !initializeComposer()) return false;
          composerDoc.body.dispatchEvent(new MouseEvent('click', { bubbles:true, composed:true }));
          return true;
        }
        return false;
      },
      inspect: () => {
        const rect = orb.getBoundingClientRect();
        const panelRect = panel.getBoundingClientRect();
        const composerRect = composerFrame.getBoundingClientRect();
        const inputRect = askInput?.getBoundingClientRect?.() || { x:0, y:0, width:0, height:0 };
        const hostStyle = getComputedStyle(host);
        const panelStyle = getComputedStyle(panel);
        const conversationStyle = getComputedStyle(conversation);
        const messageScrollers = [...conversation.querySelectorAll('.message')]
          .filter((bubble) => ['auto', 'scroll'].includes(getComputedStyle(bubble).overflowY));
        const latestUserMessage = [...conversation.querySelectorAll('.message.user')].at(-1) || null;
        const latestAssistantMessage = [...conversation.querySelectorAll('.message.assistant:not(.welcome-message):not(.notice)')].at(-1) || null;
        return {
          hostConnected: host.isConnected,
          hostParentTag: host.parentElement?.tagName || '',
          hostPosition: hostStyle.position,
          hostRight: hostStyle.right,
          hostBottom: hostStyle.bottom,
          inputBoundary: 'iframe',
          tabCount: shadow.querySelectorAll('[role="tab"],.tab').length,
          messageAvatarCount: shadow.querySelectorAll('.message-avatar').length,
          featureLineCount: shadow.querySelectorAll('.feature-line').length,
          footerCount: shadow.querySelectorAll('.foot').length,
          conversationMessageCount: conversation.querySelectorAll('.message').length,
          welcomeInConversation: conversation.contains(welcome),
          welcomeText: welcome.textContent || '',
          panelOverflowY: panelStyle.overflowY,
          conversationOverflowY: conversationStyle.overflowY,
          conversationClientHeight: conversation.clientHeight,
          conversationScrollHeight: conversation.scrollHeight,
          nestedMessageScrollerCount: messageScrollers.length,
          latestUserAlignSelf: latestUserMessage ? getComputedStyle(latestUserMessage).alignSelf : '',
          latestAssistantAlignSelf: latestAssistantMessage ? getComputedStyle(latestAssistantMessage).alignSelf : '',
          orbEyeCount: orb.querySelectorAll('.face-eye').length,
          miniEyeCount: mini.querySelectorAll('.face-eye').length,
          panelOpen: !panel.hidden,
          panelLayoutWidth: panel.offsetWidth,
          visualState: orb.dataset.visualState || '',
          miniVisualState: mini.dataset.visualState || '',
          rippling: orb.classList.contains('is-rippling'),
          orbRect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          panelRect: { x: panelRect.x, y: panelRect.y, width: panelRect.width, height: panelRect.height },
          statusText: stateText.textContent || '',
          orbBrightness: getComputedStyle(shadow.querySelector('.core')).filter,
          askInputRect: { x: composerRect.x + inputRect.x, y: composerRect.y + inputRect.y, width: inputRect.width, height: inputRect.height },
          askValue: askInput?.value || '',
          askFocused: Boolean(askInput && composerDoc?.activeElement === askInput),
          shadowActiveElement: shadow.activeElement?.className || shadow.activeElement?.tagName || '',
          composerDocumentFocused: composerDoc?.hasFocus?.() === true,
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
