const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "renderer/index.html"), "utf8");
const css = fs.readFileSync(path.join(root, "renderer/styles.css"), "utf8");
const renderer = fs.readFileSync(path.join(root, "renderer/app.js"), "utf8");
const main = fs.readFileSync(path.join(root, "electron/main.cjs"), "utf8");

test("browser chrome is two fixed rows with the tab strip in the title row", () => {
  const header = html.match(/<header class="titlebar"[\s\S]*?<\/header>/)?.[0] || "";
  const browserPage = html.match(/<section class="browser-page"[\s\S]*?<\/section>/)?.[0] || "";
  assert.match(header, /id="browserTabBar"/);
  assert.match(header, /class="browser-window-drag-region"/);
  assert.match(header, /id="globalSearchTrigger"/);
  assert.match(header, /id="dataStatusButton"/);
  assert.doesNotMatch(browserPage, /id="browserTabBar"/);
  assert.match(css, /--title-tab-row-height:\s*38px/);
  assert.match(css, /--navigation-row-height:\s*42px/);
  assert.match(css, /\.browser-page\s*\{[\s\S]*grid-template-rows:\s*var\(--navigation-row-height\) minmax\(0, 1fr\)/);
  assert.match(main, /MAIN_TITLE_TAB_ROW_HEIGHT\s*=\s*38/);
  assert.match(main, /titleBarOverlay:[\s\S]*height:\s*MAIN_TITLE_TAB_ROW_HEIGHT/);
});

test("browser title row keeps a native window drag handle outside interactive tabs", () => {
  assert.match(css, /\.browser-window-drag-region\s*\{[\s\S]*?-webkit-app-region:\s*drag/);
  assert.match(css, /\.browser-window-drag-region\s*\{[\s\S]*?flex:\s*1 1 72px/);
  assert.match(css, /\.browser-tab-list\s*\{[\s\S]*?flex:\s*0 1 auto[\s\S]*?-webkit-app-region:\s*no-drag/);
  assert.match(css, /\.browser-tabbar-tool\s*\{[\s\S]*?-webkit-app-region:\s*no-drag/);
  const tabbarRule = css.match(/\.browser-tabbar\s*\{([\s\S]*?)\}/)?.[1] || "";
  assert.doesNotMatch(tabbarRule, /-webkit-app-region:\s*no-drag/);
});

test("embedded media permissions and HTML fullscreen are handled by the browser owner", () => {
  assert.match(main, /setPermissionRequestHandler\([\s\S]*?isSafeEmbeddedMediaPermission/);
  assert.match(main, /setPermissionCheckHandler\([\s\S]*?isSafeEmbeddedMediaPermission/);
  assert.match(main, /on\("enter-html-full-screen",\s*\(\) => enterHtmlFullscreen\(context\)\)/);
  assert.match(main, /on\("leave-html-full-screen",\s*\(\) => leaveHtmlFullscreen\(context\)\)/);
  assert.match(main, /function enterHtmlFullscreen[\s\S]*?owner\.setFullScreen\(true\)/);
  assert.match(main, /function applyDetachedViewBounds[\s\S]*?tab\.htmlFullscreenActive/);
});

test("low frequency tab operations live in the native more menu", () => {
  assert.doesNotMatch(html, /id="duplicateCurrentTab"/);
  assert.doesNotMatch(html, /id="detachCurrentTab"/);
  assert.match(html, /id="browserMoreMenu"/);
  assert.match(main, /label:\s*"复制页签"/);
  assert.match(main, /source\.detached \? "合回空间" : "在独立窗口打开"/);
  assert.match(main, /select\("toggle-mute"\)/);
  assert.doesNotMatch(renderer, /actions\.append\(windowAction, close\)/);
});

test("web view bounds updates are frame-coalesced and skip identical rectangles", () => {
  assert.match(renderer, /let browserBoundsFrame = 0/);
  assert.match(renderer, /window\.requestAnimationFrame\(\(\) =>/);
  assert.match(renderer, /if \(key === lastBrowserBoundsKey\) return/);
  assert.equal((renderer.match(/new ResizeObserver\(syncBrowserBounds\)/g) || []).length, 1);
});

test("narrow chrome keeps tabs and collapses only the search trigger", () => {
  assert.match(css, /@media \(max-width: 760px\)[\s\S]*\.titlebar-search-trigger\s*\{[^}]*width:\s*30px/);
  assert.match(css, /\.browser-tab-list\s*\{[\s\S]*overflow:\s*auto hidden/);
  assert.match(css, /\.titlebar\s*\{[\s\S]*grid-template-columns:[^;]*minmax\(0, 1fr\)/);
});
