const { createHash, randomUUID } = require("node:crypto");
const path = require("node:path");

const RESOURCE_TTL_MS = 5 * 60_000;
const NETWORK_DETECTION_LIMIT_MS = 60_000;
const DIRECT_FILE_EXTENSIONS = new Set([
  ".7z", ".apk", ".avi", ".csv", ".doc", ".docx", ".epub", ".gif", ".gz", ".jpeg", ".jpg",
  ".json", ".m4a", ".mkv", ".mov", ".mp3", ".mp4", ".mpeg", ".pdf", ".png", ".ppt", ".pptx",
  ".rar", ".svg", ".tar", ".txt", ".wav", ".webm", ".webp", ".xls", ".xlsx", ".xml", ".zip",
]);
const BLOCKED_MEDIA_EXTENSIONS = new Set([".key", ".m3u8", ".mpd"]);

function safeResourceUrl(rawUrl) {
  let url;
  try { url = new URL(String(rawUrl || "")); } catch { return ""; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return "";
  const extension = path.posix.extname(url.pathname).toLowerCase();
  if (BLOCKED_MEDIA_EXTENSIONS.has(extension)) return "";
  return url.toString();
}

function filenameForResource(rawUrl, suggested = "") {
  const declared = String(suggested || "").trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 180);
  if (declared) return declared;
  try {
    const segment = decodeURIComponent(new URL(rawUrl).pathname.split("/").filter(Boolean).at(-1) || "resource");
    return segment.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 180) || "resource";
  } catch { return "resource"; }
}

function resourceType(candidate = {}) {
  const source = String(candidate.sourceElement || "").toLowerCase();
  const mime = String(candidate.mime || "").toLowerCase();
  if (source === "img" || mime.startsWith("image/")) return "image";
  if (["video", "source:video"].includes(source) || mime.startsWith("video/")) return "video";
  if (["audio", "source:audio"].includes(source) || mime.startsWith("audio/")) return "audio";
  return "file";
}

function normalizePageResourceCandidate(candidate = {}) {
  const url = safeResourceUrl(candidate.url);
  if (!url) return null;
  const parsed = new URL(url);
  const extension = path.posix.extname(parsed.pathname).toLowerCase();
  const sourceElement = String(candidate.sourceElement || "link").slice(0, 40);
  const declaredDownload = candidate.declaredDownload === true;
  const mediaElement = /^(?:img|video|audio|source(?::(?:video|audio))?)$/.test(sourceElement);
  if (!declaredDownload && !mediaElement && !DIRECT_FILE_EXTENSIONS.has(extension)) return null;
  const mime = String(candidate.mime || "").trim().slice(0, 160) || null;
  const size = Number.isFinite(Number(candidate.size)) && Number(candidate.size) >= 0
    ? Math.min(Number(candidate.size), Number.MAX_SAFE_INTEGER)
    : null;
  return {
    id: createHash("sha256").update(`${url}\n${sourceElement}`).digest("hex").slice(0, 24),
    type: resourceType({ sourceElement, mime }),
    filename: filenameForResource(url, candidate.filename),
    url,
    mime,
    size,
    sourceElement,
    detectedBy: String(candidate.detectedBy || "dom") === "network" ? "network" : "dom",
  };
}

function pageResourceExtractionScript() {
  return `(() => {
    const output = [];
    const push = (element, rawUrl, sourceElement, extra = {}) => {
      if (!rawUrl) return;
      let url;
      try { url = new URL(rawUrl, document.baseURI).toString(); } catch { return; }
      output.push({ url, sourceElement, ...extra });
    };
    for (const anchor of document.querySelectorAll('a[href]')) {
      push(anchor, anchor.href, 'a', {
        declaredDownload: anchor.hasAttribute('download'),
        filename: anchor.getAttribute('download') || '',
        mime: anchor.getAttribute('type') || ''
      });
    }
    for (const image of document.querySelectorAll('img[src]')) push(image, image.currentSrc || image.src, 'img');
    for (const video of document.querySelectorAll('video[src]')) push(video, video.currentSrc || video.src, 'video', { mime: video.getAttribute('type') || '' });
    for (const audio of document.querySelectorAll('audio[src]')) push(audio, audio.currentSrc || audio.src, 'audio', { mime: audio.getAttribute('type') || '' });
    for (const source of document.querySelectorAll('source[src]')) {
      const parent = String(source.parentElement?.tagName || '').toLowerCase();
      push(source, source.src, parent === 'audio' ? 'source:audio' : 'source:video', { mime: source.type || '' });
    }
    return output.slice(0, 500);
  })()`;
}

class PageResourceService {
  constructor({ onChanged = (_value) => undefined, now = () => Date.now() } = {}) {
    this.onChanged = onChanged;
    this.now = now;
    this.resources = new Map();
    this.network = null;
  }

  async inspect(contents, seed = []) {
    if (!contents || contents.isDestroyed()) throw new Error("当前网页已经关闭");
    const candidates = await contents.executeJavaScript(pageResourceExtractionScript(), true);
    const items = this._merge(contents.id, [...seed, ...(Array.isArray(candidates) ? candidates : [])]);
    this.onChanged({ webContentsId: contents.id, items, detecting: this.network?.webContentsId === contents.id });
    return { items, detecting: this.network?.webContentsId === contents.id };
  }

  list(contents) {
    if (!contents || contents.isDestroyed()) return { items: [], detecting: false };
    this._prune();
    return {
      items: this.resources.get(contents.id)?.items || [],
      detecting: this.network?.webContentsId === contents.id,
      detectionEndsAt: this.network?.webContentsId === contents.id ? this.network.endsAt : null,
    };
  }

  download(contents, resourceId) {
    if (!contents || contents.isDestroyed()) throw new Error("当前网页已经关闭");
    const item = this.resources.get(contents.id)?.items.find((resource) => resource.id === String(resourceId || ""));
    if (!item || !safeResourceUrl(item.url)) throw new Error("资源已失效，请重新扫描当前页面");
    contents.downloadURL(item.url);
    return { started: true, filename: item.filename };
  }

  startNetworkDetection(targetSession, contents, durationMs = NETWORK_DETECTION_LIMIT_MS) {
    if (!targetSession?.webRequest || !contents || contents.isDestroyed()) throw new Error("当前会话不支持网络检测");
    this.stopNetworkDetection();
    const webContentsId = contents.id;
    const duration = Math.max(1_000, Math.min(NETWORK_DETECTION_LIMIT_MS, Number(durationMs) || NETWORK_DETECTION_LIMIT_MS));
    const listener = (details) => {
      if (details.webContentsId !== webContentsId) return;
      const headers = details.responseHeaders || {};
      const headerValue = (name) => {
        const entry = Object.entries(headers).find(([key]) => key.toLowerCase() === name);
        return Array.isArray(entry?.[1]) ? entry[1][0] : entry?.[1] || "";
      };
      const candidate = normalizePageResourceCandidate({
        url: details.url,
        sourceElement: /image/i.test(details.resourceType) ? "img" : /media/i.test(details.resourceType) ? "video" : "a",
        declaredDownload: ["media", "object", "other"].includes(details.resourceType),
        mime: headerValue("content-type").split(";")[0],
        size: Number(headerValue("content-length")) || null,
        detectedBy: "network",
      });
      if (!candidate) return;
      const items = this._merge(webContentsId, [candidate]);
      this.onChanged({ webContentsId, items, detecting: true, detectionEndsAt: this.network?.endsAt || null });
    };
    targetSession.webRequest.onResponseStarted({ urls: ["http://*/*", "https://*/*"] }, listener);
    const endsAt = new Date(this.now() + duration).toISOString();
    const timer = setTimeout(() => this.stopNetworkDetection("timeout"), duration);
    timer.unref?.();
    this.network = { targetSession, webContentsId, listener, timer, endsAt };
    const snapshot = this.list(contents);
    this.onChanged({ webContentsId, ...snapshot, detecting: true, detectionEndsAt: endsAt });
    return { ...snapshot, detecting: true, detectionEndsAt: endsAt };
  }

  stopNetworkDetection(reason = "user") {
    const active = this.network;
    if (!active) return { stopped: false };
    clearTimeout(active.timer);
    active.targetSession.webRequest.onResponseStarted(null);
    this.network = null;
    const items = this.resources.get(active.webContentsId)?.items || [];
    this.onChanged({ webContentsId: active.webContentsId, items, detecting: false, stoppedReason: reason });
    return { stopped: true, items };
  }

  clear(contents) {
    const id = typeof contents === "number" ? contents : contents?.id;
    if (!id) return;
    if (this.network?.webContentsId === id) this.stopNetworkDetection("page-closed");
    this.resources.delete(id);
  }

  _merge(webContentsId, candidates) {
    this._prune();
    const existing = this.resources.get(webContentsId)?.items || [];
    const byId = new Map(existing.map((item) => [item.id, item]));
    for (const candidate of candidates) {
      const normalized = normalizePageResourceCandidate({
        ...candidate,
        declaredDownload: candidate?.declaredDownload === true || candidate?.detectedBy === "network",
      });
      if (normalized) byId.set(normalized.id, { ...byId.get(normalized.id), ...normalized });
    }
    const items = Array.from(byId.values()).slice(0, 1000);
    this.resources.set(webContentsId, { items, updatedAt: this.now() });
    return items;
  }

  _prune() {
    for (const [id, entry] of this.resources) {
      if (this.now() - entry.updatedAt > RESOURCE_TTL_MS) this.resources.delete(id);
    }
  }
}

module.exports = {
  BLOCKED_MEDIA_EXTENSIONS,
  DIRECT_FILE_EXTENSIONS,
  NETWORK_DETECTION_LIMIT_MS,
  PageResourceService,
  filenameForResource,
  normalizePageResourceCandidate,
  pageResourceExtractionScript,
  safeResourceUrl,
};
