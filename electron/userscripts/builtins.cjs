const RESTORE_COPY_SOURCE = `// ==UserScript==
// @name         恢复复制与选择
// @namespace    local.qiye.builtins
// @version      1.0.0
// @description  恢复当前网站的文字选择、复制和右键；不读取输入框，不访问网络。
// @author       栖页
// @match        *://*/*
// @run-at       document-end
// @grant        GM_addStyle
// ==/UserScript==

(() => {
  const editable = (target) => target instanceof Element && Boolean(target.closest('input, textarea, [contenteditable="true"]'));
  GM_addStyle('*:not(input):not(textarea):not([contenteditable="true"]) { -webkit-user-select: text !important; user-select: text !important; }');
  for (const node of document.querySelectorAll('*:not(input):not(textarea):not([contenteditable="true"])')) {
    node.removeAttribute('oncopy');
    node.removeAttribute('oncontextmenu');
    node.removeAttribute('onselectstart');
  }
  document.oncopy = null;
  document.oncontextmenu = null;
  document.onselectstart = null;
  for (const type of ['copy', 'contextmenu', 'selectstart']) {
    window.addEventListener(type, (event) => {
      if (!editable(event.target)) event.stopImmediatePropagation();
    }, true);
  }
})();`;

const BUILTIN_USER_SCRIPTS = Object.freeze([
  Object.freeze({
    id: "builtin-restore-copy",
    sourceType: "builtIn",
    sourceCode: RESTORE_COPY_SOURCE,
    enabled: false,
  }),
]);

module.exports = { BUILTIN_USER_SCRIPTS, RESTORE_COPY_SOURCE };
