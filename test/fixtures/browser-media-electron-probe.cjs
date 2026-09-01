const { app, BrowserWindow, WebContentsView, session } = require("electron");
const http = require("node:http");
const {
  BrowserMediaCapabilityService,
  isSafeEmbeddedMediaPermission,
  readWebContentsAudioState,
} = require("../../electron/browser/media-capability-service.cjs");

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      server.removeListener("error", reject);
      resolve(server.address());
    });
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

app.whenReady().then(async () => {
  const server = http.createServer((_request, response) => {
    response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    response.end(`<!doctype html>
      <meta charset="utf-8">
      <style>html,body{margin:0;background:#111}video{width:560px;height:315px;background:#222}</style>
      <video id="probeVideo" muted playsinline></video>
      <script>
        const canvas = document.createElement('canvas');
        canvas.width = 560;
        canvas.height = 315;
        const context = canvas.getContext('2d');
        let frame = 0;
        const paint = () => {
          context.fillStyle = frame++ % 2 ? '#246' : '#284';
          context.fillRect(0, 0, canvas.width, canvas.height);
          requestAnimationFrame(paint);
        };
        paint();
        const video = document.getElementById('probeVideo');
        video.srcObject = canvas.captureStream(12);
        video.play();
      </script>`);
  });
  const address = await listen(server);
  const partition = `persist:media-probe-${Date.now()}`;
  const targetSession = session.fromPartition(partition);
  const permissionLog = [];
  targetSession.setPermissionRequestHandler((contents, permission, callback, details = {}) => {
    const allowed = isSafeEmbeddedMediaPermission(permission, details.requestingUrl || contents.getURL());
    permissionLog.push({ phase: "request", permission, allowed });
    callback(allowed);
  });
  targetSession.setPermissionCheckHandler((contents, permission, origin, details = {}) => {
    const allowed = isSafeEmbeddedMediaPermission(
      permission,
      origin || details.requestingUrl || contents.getURL(),
    );
    permissionLog.push({ phase: "check", permission, allowed });
    return allowed;
  });

  const win = new BrowserWindow({
    width: 640,
    height: 430,
    show: true,
    skipTaskbar: true,
    autoHideMenuBar: true,
    backgroundColor: "#111111",
  });
  const view = new WebContentsView({
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });
  win.contentView.addChildView(view);
  view.setBounds({ x: 0, y: 0, width: 640, height: 430 });

  const mediaContents = view.webContents;
  let audioStateEvents = 0;
  const readLateAudioState = () => {
    readWebContentsAudioState(mediaContents);
    audioStateEvents += 1;
  };
  mediaContents.on("media-started-playing", readLateAudioState);
  mediaContents.on("media-paused", readLateAudioState);
  mediaContents.on("audio-state-changed", readLateAudioState);

  let enteredFullscreen = 0;
  let leftFullscreen = 0;
  view.webContents.on("enter-html-full-screen", () => {
    enteredFullscreen += 1;
    win.setFullScreen(true);
    const bounds = win.getContentBounds();
    view.setBounds({ x: 0, y: 0, width: bounds.width, height: bounds.height });
  });
  view.webContents.on("leave-html-full-screen", () => {
    leftFullscreen += 1;
    win.setFullScreen(false);
  });

  await view.webContents.loadURL(`http://127.0.0.1:${address.port}/video`);
  await wait(300);
  const media = new BrowserMediaCapabilityService();
  const capability = await view.webContents.executeJavaScript(`({
    pictureInPictureEnabled: document.pictureInPictureEnabled,
    hasPictureInPictureMethod: typeof document.querySelector('video').requestPictureInPicture === 'function',
    hasFullscreenMethod: typeof document.querySelector('video').requestFullscreen === 'function',
    readyState: document.querySelector('video').readyState
  })`);
  const pictureInPicture = await media.togglePictureInPicture(view.webContents, { x: 280, y: 150 });
  await wait(150);
  const pictureInPictureActive = await view.webContents.executeJavaScript("Boolean(document.pictureInPictureElement)");
  if (pictureInPictureActive) await media.togglePictureInPicture(view.webContents, { x: 280, y: 150 });
  const fullscreen = await media.toggleVideoFullscreen(view.webContents, { x: 280, y: 150 });
  await wait(250);
  const fullscreenActive = await view.webContents.executeJavaScript("Boolean(document.fullscreenElement)");
  if (fullscreenActive) await media.toggleVideoFullscreen(view.webContents, { x: 280, y: 150 });
  await wait(150);

  win.contentView.removeChildView(view);
  mediaContents.close();
  await wait(200);
  const mediaCloseSurvived = mediaContents.isDestroyed();

  process.stdout.write(`${JSON.stringify({ browserMediaElectronProbe: {
    capability,
    pictureInPicture,
    pictureInPictureActive,
    fullscreen,
    fullscreenActive,
    enteredFullscreen,
    leftFullscreen,
    audioStateEvents,
    mediaCloseSurvived,
    permissionLog,
  } })}\n`);
  if (!win.isDestroyed()) win.destroy();
  await new Promise((resolve) => server.close(resolve));
  app.quit();
}).catch((error) => {
  process.stderr.write(`${error?.stack || error}\n`);
  app.exit(1);
});
