const BILIBILI_PICTURE_IN_PICTURE_SELECTOR = [
  ".bpx-player-ctrl-pip",
  ".bilibili-player-video-btn-pip",
  "button[data-text='画中画']",
  "button[aria-label='画中画']",
].join(",");

function isOfficialBilibiliHost(hostname) {
  const normalized = String(hostname || "").toLowerCase().replace(/\.$/, "");
  return normalized === "bilibili.com" || normalized.endsWith(".bilibili.com");
}

function bilibiliPictureInPictureControl(target) {
  return target?.closest?.(BILIBILI_PICTURE_IN_PICTURE_SELECTOR) || null;
}

function largestVisibleVideo(documentObject, windowObject) {
  return Array.from(documentObject.querySelectorAll("video"))
    .map((video) => {
      const rect = video.getBoundingClientRect();
      const width = Math.max(0, Math.min(windowObject.innerWidth, rect.right) - Math.max(0, rect.left));
      const height = Math.max(0, Math.min(windowObject.innerHeight, rect.bottom) - Math.max(0, rect.top));
      return { video, area: width * height };
    })
    .sort((left, right) => right.area - left.area)[0]?.video || null;
}

function bilibiliMediaBridgeScript() {
  return `(() => {
    const selector = ${JSON.stringify(BILIBILI_PICTURE_IN_PICTURE_SELECTOR)};
    const hostname = String(location.hostname || "").toLowerCase().replace(/\\.$/, "");
    if (hostname !== "bilibili.com" && !hostname.endsWith(".bilibili.com")) {
      return { installed: false, reason: "HOST_NOT_ALLOWED" };
    }
    if (window.__qiyeBilibiliMediaBridgeInstalled === true) {
      return { installed: true, reused: true };
    }
    Object.defineProperty(window, "__qiyeBilibiliMediaBridgeInstalled", {
      value: true,
      configurable: true,
    });
    window.addEventListener("click", (event) => {
      if (!event.isTrusted || !event.target?.closest?.(selector)) return;
      const visibleArea = (video) => {
        const rect = video?.getBoundingClientRect?.();
        if (!rect || rect.width < 2 || rect.height < 2) return 0;
        const width = Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left));
        const height = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
        return width * height;
      };
      const current = document.pictureInPictureElement;
      const video = current || Array.from(document.querySelectorAll("video"))
        .map((item) => ({ item, area: visibleArea(item) }))
        .sort((left, right) => right.area - left.area)[0]?.item;
      if (!video) return;
      const operation = current
        ? document.exitPictureInPicture?.()
        : document.pictureInPictureEnabled
          && !video.disablePictureInPicture
          && typeof video.requestPictureInPicture === "function"
          ? video.requestPictureInPicture()
          : null;
      if (!operation) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      Promise.resolve(operation).catch(() => undefined);
    }, true);
    return { installed: true, reused: false };
  })()`;
}

/** @param {{ windowObject?: any, documentObject?: any, locationObject?: any }} [options] */
function installBilibiliMediaBridge(options = {}) {
  const { windowObject, documentObject, locationObject } = options;
  if (!windowObject || !documentObject || !isOfficialBilibiliHost(locationObject?.hostname)) {
    return false;
  }
  windowObject.addEventListener("click", (event) => {
    if (!event.isTrusted || !bilibiliPictureInPictureControl(event.target)) return;
    const current = documentObject.pictureInPictureElement;
    const video = current || largestVisibleVideo(documentObject, windowObject);
    if (!video) return;
    const operation = current
      ? documentObject.exitPictureInPicture?.()
      : documentObject.pictureInPictureEnabled
        && !video.disablePictureInPicture
        && typeof video.requestPictureInPicture === "function"
        ? video.requestPictureInPicture()
        : null;
    if (!operation) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    Promise.resolve(operation).catch(() => undefined);
  }, true);
  return true;
}

module.exports = {
  BILIBILI_PICTURE_IN_PICTURE_SELECTOR,
  bilibiliMediaBridgeScript,
  bilibiliPictureInPictureControl,
  installBilibiliMediaBridge,
  isOfficialBilibiliHost,
};
