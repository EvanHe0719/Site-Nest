const fsp = require("node:fs/promises");
const path = require("node:path");
const { atomicWriteJson } = require("../state-store.cjs");

class ConnectorCache {
  constructor(options = {}) {
    if (!options.filePath) throw new TypeError("Connector cache filePath is required");
    this.filePath = path.resolve(options.filePath);
    this.defaultTtlMs = Number(options.defaultTtlMs) || 5 * 60 * 1000;
    this.entries = null;
  }

  async load() {
    if (this.entries) return this.entries;
    try {
      const value = JSON.parse(await fsp.readFile(this.filePath, "utf8"));
      this.entries = value?.version === 1 && value.entries && typeof value.entries === "object"
        ? value.entries
        : {};
    } catch (error) {
      if (error?.code !== "ENOENT") this.entries = {};
      else this.entries = {};
    }
    return this.entries;
  }

  async get(key, options = {}) {
    const entries = await this.load();
    const entry = entries[String(key)] || null;
    if (!entry) return null;
    const ageMs = Math.max(0, Date.now() - Date.parse(entry.updatedAt || 0));
    const ttlMs = Number(options.ttlMs) || Number(entry.ttlMs) || this.defaultTtlMs;
    return {
      data: structuredClone(entry.data),
      updatedAt: entry.updatedAt,
      ageMs,
      stale: !Number.isFinite(ageMs) || ageMs > ttlMs,
    };
  }

  async set(key, data, options = {}) {
    const entries = await this.load();
    const updatedAt = options.updatedAt || new Date().toISOString();
    entries[String(key)] = {
      data: structuredClone(data),
      updatedAt,
      ttlMs: Number(options.ttlMs) || this.defaultTtlMs,
    };
    await atomicWriteJson(this.filePath, { version: 1, entries });
    return this.get(key);
  }

  async delete(key) {
    const entries = await this.load();
    delete entries[String(key)];
    await atomicWriteJson(this.filePath, { version: 1, entries });
  }
}

module.exports = { ConnectorCache };
