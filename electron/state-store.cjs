const { randomUUID } = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const {
  CURRENT_SCHEMA_VERSION,
  createInitialState,
  migrateState,
} = require("./state-model.cjs");

class StateStoreError extends Error {
  constructor(code, message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined);
    this.name = "StateStoreError";
    this.code = code;
    if (options.filePath) this.filePath = options.filePath;
    if (options.phase) this.phase = options.phase;
  }
}

function errorLogPathFor(filePath) {
  return `${path.resolve(filePath)}.errors.log`;
}

function backupPathForVersion(filePath, version) {
  const parsed = path.parse(path.resolve(filePath));
  const extension = parsed.ext || ".json";
  return path.join(
    parsed.dir,
    `${parsed.name}.v${version}.backup${extension}`,
  );
}

function safeErrorMessage(error) {
  return String(error?.message || "未知错误")
    .replace(/[\r\n]+/g, " ")
    .replace(
      /\b(cookie|authorization|password|passwd|token|secret)\b\s*[:=]\s*[^\s,;]+/gi,
      "$1=[REDACTED]",
    )
    .slice(0, 500);
}

async function appendStateError(filePath, phase, error, options = {}) {
  const logPath = errorLogPathFor(filePath);
  const timestamp = typeof options.now === "function"
    ? options.now()
    : options.now || new Date();
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const record = {
    timestamp: Number.isNaN(date.valueOf())
      ? new Date().toISOString()
      : date.toISOString(),
    phase,
    code: String(error?.code || "UNKNOWN"),
    message: safeErrorMessage(error),
  };
  try {
    await fsp.mkdir(path.dirname(logPath), { recursive: true });
    await fsp.appendFile(logPath, `${JSON.stringify(record)}\n`, "utf8");
  } catch {
    // Error reporting must never replace the original state-store failure.
  }
  return logPath;
}

async function atomicWriteText(filePath, contents) {
  const resolvedPath = path.resolve(filePath);
  const directory = path.dirname(resolvedPath);
  const temporaryPath = path.join(
    directory,
    `.${path.basename(resolvedPath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  await fsp.mkdir(directory, { recursive: true });
  let handle;
  try {
    handle = await fsp.open(temporaryPath, "wx", 0o600);
    await handle.writeFile(contents, "utf8");
    await handle.sync();
    await handle.close();
    handle = undefined;
    await fsp.rename(temporaryPath, resolvedPath);
  } catch (error) {
    if (handle) await handle.close().catch(() => undefined);
    await fsp.unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}

async function atomicWriteJson(filePath, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`;
  await atomicWriteText(filePath, serialized);
}

async function backupSourceFile(filePath, version) {
  const resolvedPath = path.resolve(filePath);
  const backupPath = backupPathForVersion(resolvedPath, version);
  try {
    await fsp.copyFile(resolvedPath, backupPath, fs.constants.COPYFILE_EXCL);
    return { backupPath, created: true };
  } catch (error) {
    if (error?.code === "EEXIST") return { backupPath, created: false };
    throw error;
  }
}

async function loadStateFile(filePath, options = {}) {
  const resolvedPath = path.resolve(filePath);
  let raw;
  try {
    raw = await fsp.readFile(resolvedPath, "utf8");
  } catch (error) {
    if (error?.code === "ENOENT") {
      const state = createInitialState(options);
      if (options.persistMissing) await atomicWriteJson(resolvedPath, state);
      return {
        state,
        source: "missing",
        migrated: false,
        changed: true,
        persisted: Boolean(options.persistMissing),
        backupPath: null,
        backupCreated: false,
      };
    }
    await appendStateError(resolvedPath, "read", error, options);
    throw new StateStoreError("STATE_READ_FAILED", "无法读取应用数据", {
      cause: error,
      filePath: resolvedPath,
      phase: "read",
    });
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    await appendStateError(resolvedPath, "parse", error, options);
    throw new StateStoreError(
      "STATE_CORRUPT",
      "应用数据不是有效 JSON；原文件已保留，未写入默认数据",
      {
        cause: error,
        filePath: resolvedPath,
        phase: "parse",
      },
    );
  }

  const parsedVersion = Number(parsed?.version);
  const sourceVersion = Number.isInteger(parsedVersion) && parsedVersion > 0
    ? parsedVersion
    : 1;
  let backup = { backupPath: null, created: false };
  if (sourceVersion >= 2 && sourceVersion < CURRENT_SCHEMA_VERSION) {
    try {
      backup = await backupSourceFile(resolvedPath, sourceVersion);
    } catch (error) {
      await appendStateError(resolvedPath, "backup", error, options);
      throw new StateStoreError(
        "STATE_BACKUP_FAILED",
        "无法在迁移前备份旧数据；原文件未修改",
        {
          cause: error,
          filePath: resolvedPath,
          phase: "backup",
        },
      );
    }
  }

  let migration;
  try {
    migration = migrateState(parsed, options);
  } catch (error) {
    await appendStateError(resolvedPath, "migrate", error, options);
    throw new StateStoreError(
      "STATE_MIGRATION_FAILED",
      "应用数据迁移失败；原文件已保留",
      {
        cause: error,
        filePath: resolvedPath,
        phase: "migrate",
      },
    );
  }

  let persisted = false;
  if (migration.changed) {
    try {
      await atomicWriteJson(resolvedPath, migration.state);
      persisted = true;
    } catch (error) {
      await appendStateError(resolvedPath, "write-migration", error, options);
      throw new StateStoreError(
        "STATE_WRITE_FAILED",
        "迁移后的应用数据无法安全写入；原文件未主动清空",
        {
          cause: error,
          filePath: resolvedPath,
          phase: "write-migration",
        },
      );
    }
  }

  return {
    state: migration.state,
    source: "file",
    migrated: migration.migrated,
    changed: migration.changed,
    persisted,
    fromVersion: migration.fromVersion,
    toVersion: migration.toVersion,
    backupPath: backup.backupPath,
    backupCreated: backup.created,
  };
}

async function saveStateFile(filePath, state, options = {}) {
  const resolvedPath = path.resolve(filePath);
  let normalized;
  try {
    normalized = migrateState(state, options).state;
    await atomicWriteJson(resolvedPath, normalized);
  } catch (error) {
    await appendStateError(resolvedPath, "save", error, options);
    if (error instanceof StateStoreError) throw error;
    throw new StateStoreError("STATE_WRITE_FAILED", "无法安全保存应用数据", {
      cause: error,
      filePath: resolvedPath,
      phase: "save",
    });
  }
  return normalized;
}

class JsonStateStore {
  constructor(filePath, options = {}) {
    if (!filePath) throw new TypeError("State store filePath is required");
    this.filePath = path.resolve(filePath);
    this.options = { ...options };
    this.writeQueue = Promise.resolve();
  }

  load(options = {}) {
    return loadStateFile(this.filePath, { ...this.options, ...options });
  }

  save(state, options = {}) {
    const task = () =>
      saveStateFile(this.filePath, state, { ...this.options, ...options });
    this.writeQueue = this.writeQueue.catch(() => undefined).then(task);
    return this.writeQueue;
  }

  update(updater, options = {}) {
    if (typeof updater !== "function") {
      return Promise.reject(new TypeError("State store updater must be a function"));
    }
    const task = async () => {
      const loaded = await loadStateFile(this.filePath, {
        ...this.options,
        ...options,
      });
      const candidate = await updater(cloneForUpdater(loaded.state));
      const state = candidate === undefined ? loaded.state : candidate;
      return saveStateFile(this.filePath, state, {
        ...this.options,
        ...options,
      });
    };
    this.writeQueue = this.writeQueue.catch(() => undefined).then(task);
    return this.writeQueue;
  }
}

function cloneForUpdater(value) {
  if (typeof structuredClone === "function") return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function createStateStore(filePath, options = {}) {
  return new JsonStateStore(filePath, options);
}

module.exports = {
  CURRENT_SCHEMA_VERSION,
  JsonStateStore,
  StateStoreError,
  appendStateError,
  atomicWriteJson,
  backupPathForVersion,
  createStateStore,
  errorLogPathFor,
  loadStateFile,
  saveStateFile,
};
