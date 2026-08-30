const { localDateFromInstant, normalizeLocalDate } = require("../habits/date-utils.cjs");

function isoOrNull(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? null : date.toISOString();
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
}

function normalizeUsageDayAggregate(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const localDate = normalizeLocalDate(input.localDate);
  if (!localDate) return null;
  const firstActiveAt = isoOrNull(input.firstActiveAt);
  const lastActiveAt = isoOrNull(input.lastActiveAt);
  return {
    localDate,
    foregroundActiveSeconds: nonNegativeInteger(input.foregroundActiveSeconds),
    meaningfulActionCount: nonNegativeInteger(input.meaningfulActionCount),
    activeSessionCount: nonNegativeInteger(input.activeSessionCount),
    firstActiveAt,
    lastActiveAt,
    updatedAt: isoOrNull(input.updatedAt) || lastActiveAt || firstActiveAt || new Date(0).toISOString(),
  };
}

function normalizeUsageDayAggregates(value) {
  const byDate = new Map();
  for (const candidate of Array.isArray(value) ? value : []) {
    const aggregate = normalizeUsageDayAggregate(candidate);
    if (!aggregate) continue;
    const previous = byDate.get(aggregate.localDate);
    if (!previous || Date.parse(aggregate.updatedAt) >= Date.parse(previous.updatedAt)) {
      byDate.set(aggregate.localDate, aggregate);
    }
  }
  return Array.from(byDate.values())
    .sort((left, right) => left.localDate.localeCompare(right.localDate))
    .slice(-10_000);
}

class UsageTracker {
  constructor(options = {}) {
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.onFlush = typeof options.onFlush === "function" ? options.onFlush : null;
    this.enabled = options.enabled !== false;
    this.foreground = options.foreground === true;
    this.idle = options.idle === true;
    this.backgroundAutomation = options.backgroundAutomation === true;
    this.maxAccrualGapMs = Math.max(1_000, Number(options.maxAccrualGapMs) || 60_000);
    this.flushIntervalMs = Math.max(1_000, Number(options.flushIntervalMs) || 60_000);
    this.aggregates = new Map();
    this.sessionActive = false;
    this.sessionDates = new Set();
    this.dirtyRevision = 0;
    this.flushedRevision = 0;
    this.clearPending = false;
    this.flushPromise = null;
    const startedAt = this._timestamp(options.startedAt);
    this.lastTickAt = startedAt;
    this.lastFlushedAt = startedAt;
    this.load(options.aggregates);
  }

  _timestamp(value) {
    if (value === undefined || value === null) value = this.now();
    const timestamp = value instanceof Date ? value.valueOf() : Number.isFinite(Number(value)) ? Number(value) : Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : Date.now();
  }

  _eligible() {
    return this.enabled && this.foreground && !this.idle && !this.backgroundAutomation;
  }

  isEligible() {
    return this._eligible();
  }

  _markDirty() {
    this.dirtyRevision += 1;
  }

  _recordFor(localDate) {
    let record = this.aggregates.get(localDate);
    if (!record) {
      record = {
        localDate,
        foregroundActiveSeconds: 0,
        meaningfulActionCount: 0,
        activeSessionCount: 0,
        firstActiveAt: null,
        lastActiveAt: null,
        updatedAt: new Date(0).toISOString(),
        _foregroundActiveMs: 0,
      };
      this.aggregates.set(localDate, record);
    }
    return record;
  }

  _activateSessionForDate(localDate, timestamp) {
    if (!this.sessionActive) {
      this.sessionActive = true;
      this.sessionDates.clear();
    }
    if (this.sessionDates.has(localDate)) return;
    const record = this._recordFor(localDate);
    record.activeSessionCount += 1;
    this.sessionDates.add(localDate);
    this._touchTimestamps(record, timestamp);
    this._markDirty();
  }

  _touchTimestamps(record, timestamp) {
    const iso = new Date(timestamp).toISOString();
    if (!record.firstActiveAt || Date.parse(iso) < Date.parse(record.firstActiveAt)) record.firstActiveAt = iso;
    if (!record.lastActiveAt || Date.parse(iso) >= Date.parse(record.lastActiveAt)) record.lastActiveAt = iso;
    record.updatedAt = iso;
  }

  _addActiveDuration(start, end) {
    if (end <= start) return;
    let cursor = Math.max(start, end - this.maxAccrualGapMs);
    while (cursor < end) {
      const date = new Date(cursor);
      const nextMidnight = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate() + 1,
      ).valueOf();
      const segmentEnd = Math.min(end, nextMidnight);
      const localDate = localDateFromInstant(cursor);
      if (!localDate) break;
      this._activateSessionForDate(localDate, cursor);
      const record = this._recordFor(localDate);
      record._foregroundActiveMs += segmentEnd - cursor;
      record.foregroundActiveSeconds = Math.round(record._foregroundActiveMs / 1_000);
      this._touchTimestamps(record, segmentEnd);
      this._markDirty();
      cursor = segmentEnd;
    }
  }

  _closeSession() {
    this.sessionActive = false;
    this.sessionDates.clear();
  }

  _transition(patch, value, at) {
    const timestamp = this._timestamp(at);
    const wasEligible = this._eligible();
    this.tick(timestamp);
    this[patch] = value;
    const isEligible = this._eligible();
    if (wasEligible && !isEligible) this._closeSession();
    this.lastTickAt = timestamp;
    return isEligible;
  }

  setForeground(value, at) {
    return this._transition("foreground", value === true, at);
  }

  setIdle(value, at) {
    return this._transition("idle", value === true, at);
  }

  setBackgroundAutomation(value, at) {
    return this._transition("backgroundAutomation", value === true, at);
  }

  setEnabled(value, at) {
    return this._transition("enabled", value === true, at);
  }

  tick(at) {
    const timestamp = this._timestamp(at);
    if (timestamp < this.lastTickAt) {
      this.lastTickAt = timestamp;
      return this.snapshot();
    }
    if (this._eligible()) this._addActiveDuration(this.lastTickAt, timestamp);
    this.lastTickAt = timestamp;
    return this.snapshot();
  }

  recordMeaningfulAction(at, count = 1) {
    const timestamp = this._timestamp(at);
    this.tick(timestamp);
    if (!this._eligible()) return false;
    const localDate = localDateFromInstant(timestamp);
    if (!localDate) return false;
    this._activateSessionForDate(localDate, timestamp);
    const record = this._recordFor(localDate);
    record.meaningfulActionCount += Math.max(1, nonNegativeInteger(count));
    this._touchTimestamps(record, timestamp);
    this._markDirty();
    return true;
  }

  load(value) {
    for (const aggregate of normalizeUsageDayAggregates(value)) {
      this.aggregates.set(aggregate.localDate, {
        ...aggregate,
        _foregroundActiveMs: aggregate.foregroundActiveSeconds * 1_000,
      });
    }
    return this.snapshot();
  }

  snapshot() {
    return Array.from(this.aggregates.values())
      .map((record) => ({
        localDate: record.localDate,
        foregroundActiveSeconds: Math.max(0, Math.round(record._foregroundActiveMs / 1_000)),
        meaningfulActionCount: nonNegativeInteger(record.meaningfulActionCount),
        activeSessionCount: nonNegativeInteger(record.activeSessionCount),
        firstActiveAt: record.firstActiveAt,
        lastActiveAt: record.lastActiveAt,
        updatedAt: record.updatedAt,
      }))
      .sort((left, right) => left.localDate.localeCompare(right.localDate));
  }

  clear(at) {
    const timestamp = this._timestamp(at);
    this.tick(timestamp);
    const previous = this.snapshot();
    this.aggregates.clear();
    this._closeSession();
    this.clearPending = true;
    this._markDirty();
    this.lastTickAt = timestamp;
    return previous;
  }

  hasPendingChanges() {
    return this.dirtyRevision !== this.flushedRevision;
  }

  async flush(at) {
    if (!this.onFlush || !this.hasPendingChanges()) return { flushed: false, aggregates: this.snapshot() };
    if (this.flushPromise) return this.flushPromise;
    const timestamp = this._timestamp(at);
    const revision = this.dirtyRevision;
    const aggregates = this.snapshot();
    const cleared = this.clearPending;
    this.flushPromise = Promise.resolve(this.onFlush(aggregates, {
      replace: true,
      cleared,
      flushedAt: new Date(timestamp).toISOString(),
    })).then(() => {
      this.lastFlushedAt = timestamp;
      this.flushedRevision = revision;
      if (this.dirtyRevision === revision) this.clearPending = false;
      return { flushed: true, aggregates, cleared };
    }).finally(() => {
      this.flushPromise = null;
    });
    return this.flushPromise;
  }

  async flushIfDue(at) {
    const timestamp = this._timestamp(at);
    this.tick(timestamp);
    if (!this.hasPendingChanges() || timestamp - this.lastFlushedAt < this.flushIntervalMs) {
      return { flushed: false, aggregates: this.snapshot() };
    }
    return this.flush(timestamp);
  }
}

module.exports = {
  UsageTracker,
  normalizeUsageDayAggregate,
  normalizeUsageDayAggregates,
};
