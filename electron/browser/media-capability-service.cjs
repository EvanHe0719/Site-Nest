const SAFE_MEDIA_PERMISSIONS = new Set([
  "fullscreen",
  "pictureinpicture",
]);

function normalizedPermission(value) {
  return String(value || "").toLowerCase().replace(/[^a-z]/g, "");
}

function isSafeHttpUrl(rawUrl) {
  try {
    return ["http:", "https:"].includes(new URL(String(rawUrl || "")).protocol);
  } catch {
    return false;
  }
}

function isSafeEmbeddedMediaPermission(permission, rawUrl) {
  return SAFE_MEDIA_PERMISSIONS.has(normalizedPermission(permission)) && isSafeHttpUrl(rawUrl);
}

function readWebContentsAudioState(webContents) {
  if (!webContents || webContents.isDestroyed?.()) {
    return { audible: false, muted: false };
  }
  try {
    return {
      audible: Boolean(webContents.isCurrentlyAudible?.()),
      muted: Boolean(webContents.isAudioMuted?.()),
    };
  } catch {
    // Media events can arrive after WebContentsView has begun closing. Treat
    // that short teardown window as silent instead of crashing the main process.
    return { audible: false, muted: false };
  }
}

function safePoint(value) {
  const number = Math.round(Number(value));
  return Number.isFinite(number) ? Math.max(0, Math.min(100_000, number)) : 0;
}

function selectedVideoActionScript(action, point = {}) {
  const operation = action === "fullscreen" ? "fullscreen" : "picture-in-picture";
  const x = safePoint(point.x);
  const y = safePoint(point.y);
  return `(() => {
    const operation = ${JSON.stringify(operation)};
    const pointX = ${x};
    const pointY = ${y};
    const visibleArea = (video) => {
      const rect = video?.getBoundingClientRect?.();
      if (!rect || rect.width < 2 || rect.height < 2) return 0;
      const style = getComputedStyle(video);
      if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return 0;
      const width = Math.max(0, Math.min(innerWidth, rect.right) - Math.max(0, rect.left));
      const height = Math.max(0, Math.min(innerHeight, rect.bottom) - Math.max(0, rect.top));
      return width * height;
    };
    const pointed = document.elementsFromPoint?.(pointX, pointY)
      ?.map((element) => element?.tagName === "VIDEO" ? element : element?.closest?.("video"))
      ?.find(Boolean);
    const video = pointed || Array.from(document.querySelectorAll("video"))
      .map((item) => ({ item, area: visibleArea(item) }))
      .sort((left, right) => right.area - left.area)[0]?.item;
    if (!video) return Promise.resolve({ ok: false, code: "VIDEO_NOT_FOUND" });
    return (async () => {
      try {
        if (operation === "picture-in-picture") {
          if (document.pictureInPictureElement) {
            await document.exitPictureInPicture();
            return { ok: true, active: false };
          }
          if (!document.pictureInPictureEnabled || typeof video.requestPictureInPicture !== "function") {
            return { ok: false, code: "PICTURE_IN_PICTURE_UNAVAILABLE" };
          }
          if (video.disablePictureInPicture) {
            return { ok: false, code: "PICTURE_IN_PICTURE_DISABLED_BY_PAGE" };
          }
          await video.requestPictureInPicture();
          return { ok: true, active: true };
        }
        if (document.fullscreenElement) {
          await document.exitFullscreen();
          return { ok: true, active: false };
        }
        const requestFullscreen = video.requestFullscreen || video.webkitRequestFullscreen;
        if (typeof requestFullscreen !== "function") {
          return { ok: false, code: "FULLSCREEN_UNAVAILABLE" };
        }
        await requestFullscreen.call(video, { navigationUI: "hide" });
        return { ok: true, active: true };
      } catch (error) {
        return {
          ok: false,
          code: operation === "fullscreen" ? "FULLSCREEN_FAILED" : "PICTURE_IN_PICTURE_FAILED",
          errorName: String(error?.name || "Error").slice(0, 80),
        };
      }
    })();
  })()`;
}

class BrowserMediaCapabilityService {
  /** @param {{ onNotice?: (message: string, tone?: string) => void }} [options] */
  constructor(options = {}) {
    const { onNotice } = options;
    this.onNotice = typeof onNotice === "function" ? onNotice : () => undefined;
  }

  async run(webContents, action, point = {}) {
    if (!webContents || webContents.isDestroyed?.()) {
      return { ok: false, code: "WEB_CONTENTS_UNAVAILABLE" };
    }
    const result = await webContents.executeJavaScript(
      selectedVideoActionScript(action, point),
      true,
    );
    if (!result?.ok) {
      const messages = {
        VIDEO_NOT_FOUND: "当前页面没有找到可操作的视频",
        PICTURE_IN_PICTURE_UNAVAILABLE: "当前视频不支持画中画",
        PICTURE_IN_PICTURE_DISABLED_BY_PAGE: "当前网站已禁用这个视频的画中画",
        PICTURE_IN_PICTURE_FAILED: "画中画开启失败",
        FULLSCREEN_UNAVAILABLE: "当前视频不支持全屏",
        FULLSCREEN_FAILED: "视频全屏开启失败",
      };
      this.onNotice(messages[result?.code] || "视频操作失败", "error");
    }
    return result;
  }

  togglePictureInPicture(webContents, point) {
    return this.run(webContents, "picture-in-picture", point);
  }

  toggleVideoFullscreen(webContents, point) {
    return this.run(webContents, "fullscreen", point);
  }
}

module.exports = {
  BrowserMediaCapabilityService,
  isSafeEmbeddedMediaPermission,
  readWebContentsAudioState,
  selectedVideoActionScript,
};
