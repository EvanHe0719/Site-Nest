function minutesOfDay(date) {
  return date.getHours() * 60 + date.getMinutes();
}

function parseClock(value) {
  const match = /^(\d{2}):(\d{2})$/.exec(String(value || ""));
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;
  return hours * 60 + minutes;
}

function isWithinDoNotDisturb(settings, now = new Date()) {
  const dnd = settings?.doNotDisturb;
  if (!dnd?.enabled) return false;
  const start = parseClock(dnd.start);
  const end = parseClock(dnd.end);
  if (start === null || end === null || start === end) return false;
  const current = minutesOfDay(now);
  return start < end ? current >= start && current < end : current >= start || current < end;
}

function nextDoNotDisturbEnd(settings, now = new Date()) {
  if (!isWithinDoNotDisturb(settings, now)) return null;
  const end = parseClock(settings.doNotDisturb.end);
  const next = new Date(now);
  next.setHours(Math.floor(end / 60), end % 60, 0, 0);
  if (next.valueOf() <= now.valueOf()) next.setDate(next.getDate() + 1);
  return next.toISOString();
}

class AppBackgroundService {
  constructor({ app }) {
    this.app = app;
  }

  applyLoginSettings(settings) {
    // Development and screenshot/test runs must not rewrite the user's real
    // Windows login registration. Packaged builds own this setting.
    if (!this.app.isPackaged || process.platform !== "win32" || typeof this.app.setLoginItemSettings !== "function") return;
    this.app.setLoginItemSettings({
      openAtLogin: settings.autoLaunch === true,
      args: settings.startMinimized === true ? ["--hidden"] : [],
    });
  }

  shouldHideOnClose(settings, isQuitting) {
    return !isQuitting && settings?.trayOnClose === true;
  }
}

module.exports = {
  AppBackgroundService,
  isWithinDoNotDisturb,
  nextDoNotDisturbEnd,
  parseClock,
};
