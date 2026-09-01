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
  bilibiliPictureInPictureControl,
  installBilibiliMediaBridge,
  isOfficialBilibiliHost,
};
