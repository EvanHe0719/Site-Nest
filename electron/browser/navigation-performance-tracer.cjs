const { randomUUID } = require("node:crypto");

const TRACE_MARKS = Object.freeze([
  "clickAt",
  "sessionResolvedAt",
  "viewCreatedAt",
  "viewAttachedAt",
  "loadUrlCalledAt",
  "didStartNavigationAt",
  "domReadyAt",
  "didFinishLoadAt",
  "didStopLoadingAt",
  "overlayHiddenAt",
]);

function finite(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function duration(end, start) {
  const left = finite(end);
  const right = finite(start);
  return left === null || right === null ? null : Math.max(0, left - right);
}

function median(values) {
  const items = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (!items.length) return null;
  const middle = Math.floor(items.length / 2);
  return items.length % 2 ? items[middle] : (items[middle - 1] + items[middle]) / 2;
}

function publicTrace(trace) {
  if (!trace) return null;
  const result = {
    traceId: trace.traceId,
    startedAt: trace.startedAt,
    workspaceId: trace.workspaceId || null,
    tabId: trace.tabId || null,
    webContentsId: trace.webContentsId || null,
    partition: trace.partition || null,
    viewReused: trace.viewReused === true,
    restoredFromSuspended: trace.restoredFromSuspended === true,
    redirectCount: Math.max(0, Number(trace.redirectCount) || 0),
    activeCapabilityIds: Array.isArray(trace.activeCapabilityIds)
      ? trace.activeCapabilityIds.slice(0, 40)
      : [],
  };
  for (const mark of TRACE_MARKS) result[mark] = finite(trace[mark]);
  result.metrics = {
    clickToSessionResolvedMs: duration(trace.sessionResolvedAt, trace.clickAt),
    clickToLoadUrlMs: duration(trace.loadUrlCalledAt, trace.clickAt),
    viewCreationMs: duration(trace.viewCreatedAt, trace.sessionResolvedAt),
    loadUrlToDomReadyMs: duration(trace.domReadyAt, trace.loadUrlCalledAt),
    domReadyToVisibleMs: duration(trace.overlayHiddenAt, trace.domReadyAt),
    fullLoadMs: duration(trace.didStopLoadingAt || trace.didFinishLoadAt, trace.clickAt),
    overlayDelayMs: duration(trace.overlayHiddenAt, trace.domReadyAt),
  };
  return result;
}

class NavigationPerformanceTracer {
  constructor({ now = () => performance.now(), wallNow = () => new Date().toISOString(), maxEntries = 100 } = {}) {
    this.now = now;
    this.wallNow = wallNow;
    this.maxEntries = Math.max(10, Math.min(1000, Number(maxEntries) || 100));
    this.active = new Map();
    this.completed = [];
  }

  start(metadata = {}) {
    const traceId = randomUUID();
    const trace = {
      traceId,
      startedAt: this.wallNow(),
      workspaceId: String(metadata.workspaceId || "") || null,
      tabId: String(metadata.tabId || "") || null,
      webContentsId: finite(metadata.webContentsId),
      partition: String(metadata.partition || "") || null,
      viewReused: metadata.viewReused === true,
      restoredFromSuspended: metadata.restoredFromSuspended === true,
      redirectCount: 0,
      activeCapabilityIds: Array.isArray(metadata.activeCapabilityIds)
        ? metadata.activeCapabilityIds.slice(0, 40)
        : [],
      clickAt: finite(metadata.clickAt) ?? this.now(),
    };
    this.active.set(traceId, trace);
    return traceId;
  }

  update(traceId, metadata = {}) {
    const trace = this.active.get(traceId);
    if (!trace) return null;
    for (const key of ["workspaceId", "tabId", "partition"]) {
      if (metadata[key] !== undefined) trace[key] = String(metadata[key] || "") || null;
    }
    if (metadata.webContentsId !== undefined) trace.webContentsId = finite(metadata.webContentsId);
    if (metadata.viewReused !== undefined) trace.viewReused = metadata.viewReused === true;
    if (metadata.restoredFromSuspended !== undefined) trace.restoredFromSuspended = metadata.restoredFromSuspended === true;
    if (Array.isArray(metadata.activeCapabilityIds)) {
      trace.activeCapabilityIds = metadata.activeCapabilityIds.slice(0, 40);
    }
    return publicTrace(trace);
  }

  mark(traceId, mark, value = this.now()) {
    if (!TRACE_MARKS.includes(mark)) throw new Error(`Unknown navigation performance mark: ${mark}`);
    const trace = this.active.get(traceId);
    if (!trace) return null;
    if (trace[mark] === undefined || mark === "didStartNavigationAt") trace[mark] = finite(value);
    return publicTrace(trace);
  }

  redirect(traceId) {
    const trace = this.active.get(traceId);
    if (!trace) return null;
    trace.redirectCount += 1;
    return publicTrace(trace);
  }

  finish(traceId, finalMark = "didStopLoadingAt") {
    const trace = this.active.get(traceId);
    if (!trace) return null;
    if (finalMark && TRACE_MARKS.includes(finalMark) && trace[finalMark] === undefined) {
      trace[finalMark] = this.now();
    }
    this.active.delete(traceId);
    const result = publicTrace(trace);
    this.completed.push(result);
    if (this.completed.length > this.maxEntries) this.completed.splice(0, this.completed.length - this.maxEntries);
    return result;
  }

  snapshot() {
    return {
      active: Array.from(this.active.values()).map(publicTrace),
      completed: this.completed.map((trace) => structuredClone(trace)),
      summary: this.summary(),
    };
  }

  summary() {
    const metricNames = [
      "clickToSessionResolvedMs",
      "clickToLoadUrlMs",
      "viewCreationMs",
      "loadUrlToDomReadyMs",
      "domReadyToVisibleMs",
      "fullLoadMs",
      "overlayDelayMs",
    ];
    return Object.fromEntries(metricNames.map((name) => [
      name,
      median(this.completed.map((trace) => trace.metrics?.[name])),
    ]));
  }
}

module.exports = {
  NavigationPerformanceTracer,
  TRACE_MARKS,
  duration,
  median,
};
