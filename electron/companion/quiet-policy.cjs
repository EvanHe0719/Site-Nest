function minutesOfDay(value) {
  const [hour, minute] = String(value || "").split(":").map(Number);
  if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

function withinQuietHours(date, start, end) {
  const startMinutes = minutesOfDay(start);
  const endMinutes = minutesOfDay(end);
  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) return false;
  const current = date.getHours() * 60 + date.getMinutes();
  return startMinutes < endMinutes
    ? current >= startMinutes && current < endMinutes
    : current >= startMinutes || current < endMinutes;
}

function quietReason(settings = {}, context = {}, now = new Date()) {
  if (context.fullscreen === true) return "fullscreen";
  if (context.screenSharing === true) return "screen-sharing";
  if (context.locked === true || context.sleeping === true) return "system-away";
  if (context.foreground !== true || context.minimized === true) return "background";
  if (Date.parse(settings.pausedUntil || 0) > now.valueOf()) return "paused";
  if (Date.parse(settings.dismissedUntil || 0) > now.valueOf()) return "dismissed";
  if (settings.quietHours?.enabled === true && withinQuietHours(now, settings.quietHours.start, settings.quietHours.end)) return "quiet-hours";
  const hostname = String(context.hostname || "").toLowerCase();
  if (hostname && (settings.silentSites || []).some((item) => String(item).toLowerCase() === hostname)) return "silent-site";
  return null;
}

module.exports = { minutesOfDay, quietReason, withinQuietHours };
