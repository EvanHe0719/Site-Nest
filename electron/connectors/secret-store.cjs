const fsp = require("node:fs/promises");
const path = require("node:path");
const { atomicWriteJson } = require("../state-store.cjs");
const { ConnectorError } = require("./errors.cjs");

class ConnectorSecretStore {
  constructor(options = {}) {
    if (!options.filePath) throw new TypeError("Connector secret store filePath is required");
    if (!options.safeStorage) throw new TypeError("Electron safeStorage is required");
    this.filePath = path.resolve(options.filePath);
    this.safeStorage = options.safeStorage;
    this.cache = null;
  }

  assertAvailable() {
    if (!this.safeStorage.isEncryptionAvailable()) {
      throw new ConnectorError(
        "DATA_UNAVAILABLE",
        "当前系统安全存储不可用，无法保存连接器凭据",
      );
    }
  }

  async load() {
    if (this.cache) return { ...this.cache };
    this.assertAvailable();
    let envelope;
    try {
      envelope = JSON.parse(await fsp.readFile(this.filePath, "utf8"));
    } catch (error) {
      if (error?.code === "ENOENT") {
        this.cache = {};
        return {};
      }
      throw new ConnectorError("DATA_UNAVAILABLE", "无法读取连接器安全凭据", { cause: error });
    }
    if (envelope?.version !== 1 || typeof envelope?.encrypted !== "string") {
      throw new ConnectorError("INVALID_RESPONSE", "连接器安全凭据文件格式无效");
    }
    try {
      const clear = this.safeStorage.decryptString(Buffer.from(envelope.encrypted, "base64"));
      const parsed = JSON.parse(clear);
      this.cache = parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
      return { ...this.cache };
    } catch (error) {
      throw new ConnectorError("AUTH_REQUIRED", "连接器安全凭据无法解密，请重新连接", { cause: error });
    }
  }

  async saveAll(secrets) {
    this.assertAvailable();
    const clear = JSON.stringify(secrets || {});
    const encrypted = this.safeStorage.encryptString(clear).toString("base64");
    await atomicWriteJson(this.filePath, { version: 1, encrypted });
    this.cache = { ...(secrets || {}) };
  }

  async get(reference) {
    const all = await this.load();
    return Object.hasOwn(all, reference) ? structuredClone(all[reference]) : null;
  }

  async set(reference, value) {
    const all = await this.load();
    all[String(reference)] = structuredClone(value);
    await this.saveAll(all);
  }

  async delete(reference) {
    const all = await this.load();
    delete all[String(reference)];
    await this.saveAll(all);
  }
}

module.exports = { ConnectorSecretStore };
