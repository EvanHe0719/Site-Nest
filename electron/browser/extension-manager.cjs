const { createHash, randomUUID } = require("node:crypto");
const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const STORE_VERSION = 1;
const MAX_EXTENSION_FILES = 20_000;
const MAX_EXTENSION_BYTES = 250 * 1024 * 1024;

function cleanProfileId(value) {
  return String(value || "").trim();
}

function safeManifestText(value, fallback = "") {
  const text = String(value || "").trim();
  return text && !/^__MSG_.+__$/.test(text) ? text : fallback;
}

function manifestPermissions(manifest = {}) {
  const values = [
    ...(Array.isArray(manifest.permissions) ? manifest.permissions : []),
    ...(Array.isArray(manifest.optional_permissions) ? manifest.optional_permissions : []),
    ...(Array.isArray(manifest.host_permissions) ? manifest.host_permissions : []),
    ...(Array.isArray(manifest.optional_host_permissions) ? manifest.optional_host_permissions : []),
    ...(Array.isArray(manifest.content_scripts)
      ? manifest.content_scripts.flatMap((script) => Array.isArray(script?.matches) ? script.matches : [])
      : []),
  ];
  return Array.from(new Set(values.map(String).map((item) => item.trim()).filter(Boolean))).sort();
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new Error("manifest.json 不是有效对象");
  }
  if (![2, 3].includes(Number(manifest.manifest_version))) {
    throw new Error("仅支持 Manifest V2 或 Manifest V3 扩展");
  }
  if (!String(manifest.name || "").trim()) throw new Error("扩展清单缺少 name");
  if (!String(manifest.version || "").trim()) throw new Error("扩展清单缺少 version");
  return manifest;
}

async function inspectExtensionDirectory(sourcePath) {
  const requestedPath = path.resolve(String(sourcePath || ""));
  const sourceRealPath = await fsp.realpath(requestedPath).catch(() => "");
  if (!sourceRealPath) throw new Error("找不到所选扩展目录");
  const sourceStat = await fsp.lstat(sourceRealPath);
  if (!sourceStat.isDirectory() || sourceStat.isSymbolicLink()) {
    throw new Error("请选择包含 manifest.json 的真实目录");
  }
  const manifestPath = path.join(sourceRealPath, "manifest.json");
  const raw = await fsp.readFile(manifestPath, "utf8").catch(() => "");
  if (!raw) throw new Error("所选目录中没有 manifest.json");
  let manifest;
  try {
    manifest = validateManifest(JSON.parse(raw));
  } catch (error) {
    if (error instanceof SyntaxError) throw new Error("manifest.json 格式无效");
    throw error;
  }
  const identitySeed = String(manifest.key || sourceRealPath.toLowerCase());
  return {
    sourceRealPath,
    manifest,
    name: safeManifestText(manifest.name, path.basename(sourceRealPath)),
    description: safeManifestText(manifest.description),
    version: String(manifest.version),
    manifestVersion: Number(manifest.manifest_version),
    permissions: manifestPermissions(manifest),
    storageKey: createHash("sha256").update(identitySeed).digest("hex").slice(0, 24),
  };
}

async function copyExtensionTree(sourceRoot, targetRoot) {
  let fileCount = 0;
  let totalBytes = 0;
  async function copyDirectory(sourceDir, targetDir) {
    await fsp.mkdir(targetDir, { recursive: true });
    const entries = await fsp.readdir(sourceDir, { withFileTypes: true });
    for (const entry of entries) {
      const source = path.join(sourceDir, entry.name);
      const target = path.join(targetDir, entry.name);
      const stat = await fsp.lstat(source);
      if (stat.isSymbolicLink()) throw new Error("扩展目录包含符号链接，出于安全原因未导入");
      if (stat.isDirectory()) {
        await copyDirectory(source, target);
        continue;
      }
      if (!stat.isFile()) throw new Error("扩展目录包含不支持的文件类型");
      fileCount += 1;
      totalBytes += stat.size;
      if (fileCount > MAX_EXTENSION_FILES || totalBytes > MAX_EXTENSION_BYTES) {
        throw new Error("扩展目录超过 20000 个文件或 250 MB 的安全上限");
      }
      await fsp.copyFile(source, target);
    }
  }
  await copyDirectory(sourceRoot, targetRoot);
  return { fileCount, totalBytes };
}

function emptyStore() {
  return { version: STORE_VERSION, profiles: {} };
}

class BrowserExtensionManager {
  constructor({ rootDirectory, allowedProfileIds = [] }) {
    this.rootDirectory = path.resolve(rootDirectory);
    this.storePath = path.join(this.rootDirectory, "extensions.json");
    this.allowedProfileIds = new Set(allowedProfileIds.map(cleanProfileId).filter(Boolean));
    this.sessions = new Map();
    this.layers = new Map();
    this.restorePromises = new Map();
    this.storePromise = null;
  }

  assertProfile(profileId) {
    const id = cleanProfileId(profileId);
    if (!this.allowedProfileIds.has(id)) throw new Error("当前浏览身份不支持扩展");
    return id;
  }

  async readStore() {
    if (!this.storePromise) {
      this.storePromise = fsp.readFile(this.storePath, "utf8")
        .then((raw) => JSON.parse(raw))
        .then((value) => value && typeof value === "object" ? value : emptyStore())
        .catch(() => emptyStore())
        .then((value) => ({
          version: STORE_VERSION,
          profiles: value.profiles && typeof value.profiles === "object" ? value.profiles : {},
        }));
    }
    return this.storePromise;
  }

  async writeStore(store) {
    await fsp.mkdir(this.rootDirectory, { recursive: true });
    const temporaryPath = `${this.storePath}.${process.pid}.${randomUUID()}.tmp`;
    await fsp.writeFile(temporaryPath, `${JSON.stringify(store, null, 2)}\n`, "utf8");
    await fsp.rename(temporaryPath, this.storePath);
  }

  profileEntries(store, profileId) {
    const id = this.assertProfile(profileId);
    if (!Array.isArray(store.profiles[id])) store.profiles[id] = [];
    return store.profiles[id];
  }

  attachSession(profileId, targetSession, compatibilityLayer) {
    const id = this.assertProfile(profileId);
    if (!this.sessions.has(id)) {
      this.sessions.set(id, targetSession);
      this.layers.set(id, compatibilityLayer);
      this.restorePromises.set(id, this.restoreProfile(id));
    }
    return this.restorePromises.get(id);
  }

  async restoreProfile(profileId) {
    const store = await this.readStore();
    const entries = this.profileEntries(store, profileId);
    let changed = false;
    for (const entry of entries) {
      if (!entry.enabled) continue;
      try {
        const extension = await this.sessions.get(profileId).extensions.loadExtension(entry.installedPath, {
          allowFileAccess: false,
        });
        entry.id = extension.id;
        entry.status = "loaded";
        entry.error = "";
        entry.loadedAt = new Date().toISOString();
      } catch (error) {
        entry.status = "error";
        entry.error = error instanceof Error ? error.message : "扩展加载失败";
      }
      changed = true;
    }
    if (changed) await this.writeStore(store);
    return this.snapshot(profileId);
  }

  async ready(profileId) {
    const id = this.assertProfile(profileId);
    if (this.restorePromises.has(id)) await this.restorePromises.get(id);
  }

  addTab(profileId, webContents, ownerWindow) {
    const layer = this.layers.get(this.assertProfile(profileId));
    if (layer && webContents && ownerWindow) layer.addTab(webContents, ownerWindow);
  }

  removeTab(profileId, webContents) {
    const layer = this.layers.get(this.assertProfile(profileId));
    if (!layer || !webContents || webContents.isDestroyed?.()) return;
    layer.removeTab(webContents);
  }

  selectTab(profileId, webContents) {
    const layer = this.layers.get(this.assertProfile(profileId));
    if (layer && webContents && !webContents.isDestroyed?.()) layer.selectTab(webContents);
  }

  async inspect(sourcePath) {
    return inspectExtensionDirectory(sourcePath);
  }

  async importDirectory(profileId, sourcePath) {
    const id = this.assertProfile(profileId);
    const targetSession = this.sessions.get(id);
    if (!targetSession) throw new Error("浏览身份尚未初始化，请先打开一个网页再导入");
    await this.ready(id);
    const review = await inspectExtensionDirectory(sourcePath);
    const profileRoot = path.join(this.rootDirectory, id);
    const targetPath = path.join(profileRoot, review.storageKey);
    const stagingPath = path.join(profileRoot, `.staging-${randomUUID()}`);
    const backupPath = path.join(profileRoot, `.backup-${randomUUID()}`);
    await fsp.mkdir(profileRoot, { recursive: true });
    let hasBackup = false;
    let previousEntry = null;
    try {
      const copyStats = await copyExtensionTree(review.sourceRealPath, stagingPath);
      const store = await this.readStore();
      const entries = this.profileEntries(store, id);
      const previous = entries.find((entry) => entry.storageKey === review.storageKey);
      previousEntry = previous || null;
      if (previous?.id) targetSession.extensions.removeExtension(previous.id);
      if (fs.existsSync(targetPath)) {
        await fsp.rename(targetPath, backupPath);
        hasBackup = true;
      }
      await fsp.rename(stagingPath, targetPath);
      const extension = await targetSession.extensions.loadExtension(targetPath, { allowFileAccess: false });
      const duplicate = entries.find((entry) => entry !== previous && entry.id === extension.id);
      if (duplicate?.id) targetSession.extensions.removeExtension(duplicate.id);
      if (duplicate?.installedPath && duplicate.installedPath !== targetPath) {
        await this.removeInstalledDirectory(duplicate.installedPath);
      }
      const now = new Date().toISOString();
      const next = {
        id: extension.id,
        storageKey: review.storageKey,
        name: safeManifestText(extension.name, review.name),
        description: review.description,
        version: review.version,
        manifestVersion: review.manifestVersion,
        permissions: review.permissions,
        installedPath: targetPath,
        enabled: true,
        status: "loaded",
        error: "",
        importedAt: previous?.importedAt || now,
        updatedAt: now,
        loadedAt: now,
        fileCount: copyStats.fileCount,
        totalBytes: copyStats.totalBytes,
      };
      store.profiles[id] = entries.filter((entry) => entry !== previous && entry !== duplicate);
      store.profiles[id].push(next);
      await this.writeStore(store);
      if (hasBackup) await fsp.rm(backupPath, { recursive: true, force: true });
      return this.snapshot(id);
    } catch (error) {
      await fsp.rm(stagingPath, { recursive: true, force: true }).catch(() => undefined);
      if (hasBackup) {
        await fsp.rm(targetPath, { recursive: true, force: true }).catch(() => undefined);
        await fsp.rename(backupPath, targetPath).catch(() => undefined);
        if (previousEntry?.enabled) {
          await targetSession.extensions.loadExtension(targetPath, { allowFileAccess: false }).catch(() => undefined);
        }
      } else {
        await fsp.rm(targetPath, { recursive: true, force: true }).catch(() => undefined);
      }
      throw error;
    }
  }

  async setEnabled(profileId, extensionId, enabled) {
    const id = this.assertProfile(profileId);
    await this.ready(id);
    const store = await this.readStore();
    const entry = this.profileEntries(store, id).find((item) => item.id === String(extensionId || ""));
    if (!entry) throw new Error("找不到这个扩展");
    const targetSession = this.sessions.get(id);
    if (!targetSession) throw new Error("浏览身份尚未初始化");
    if (enabled) {
      try {
        const extension = await targetSession.extensions.loadExtension(entry.installedPath, { allowFileAccess: false });
        entry.id = extension.id;
        entry.enabled = true;
        entry.status = "loaded";
        entry.error = "";
        entry.loadedAt = new Date().toISOString();
      } catch (error) {
        entry.enabled = false;
        entry.status = "error";
        entry.error = error instanceof Error ? error.message : "扩展加载失败";
      }
    } else {
      targetSession.extensions.removeExtension(entry.id);
      entry.enabled = false;
      entry.status = "disabled";
      entry.error = "";
    }
    entry.updatedAt = new Date().toISOString();
    await this.writeStore(store);
    return this.snapshot(id);
  }

  async remove(profileId, extensionId) {
    const id = this.assertProfile(profileId);
    await this.ready(id);
    const store = await this.readStore();
    const entries = this.profileEntries(store, id);
    const entry = entries.find((item) => item.id === String(extensionId || ""));
    if (!entry) throw new Error("找不到这个扩展");
    this.sessions.get(id)?.extensions.removeExtension(entry.id);
    await this.removeInstalledDirectory(entry.installedPath);
    store.profiles[id] = entries.filter((item) => item !== entry);
    await this.writeStore(store);
    return this.snapshot(id);
  }

  async removeInstalledDirectory(directoryPath) {
    const resolved = path.resolve(String(directoryPath || ""));
    const relative = path.relative(this.rootDirectory, resolved);
    if (!relative || relative.startsWith("..") || path.isAbsolute(relative)) {
      throw new Error("拒绝删除扩展目录之外的路径");
    }
    await fsp.rm(resolved, { recursive: true, force: true });
  }

  async snapshot(profileId) {
    const id = this.assertProfile(profileId);
    const store = await this.readStore();
    const targetSession = this.sessions.get(id);
    const entries = this.profileEntries(store, id).map((entry) => {
      const loaded = Boolean(entry.id && targetSession?.extensions.getExtension(entry.id));
      return {
        id: entry.id,
        name: entry.name,
        description: entry.description || "",
        version: entry.version,
        manifestVersion: entry.manifestVersion,
        permissions: Array.isArray(entry.permissions) ? entry.permissions : [],
        enabled: Boolean(entry.enabled),
        status: entry.enabled ? (loaded ? "loaded" : entry.status || "error") : "disabled",
        error: entry.error || "",
        importedAt: entry.importedAt,
        updatedAt: entry.updatedAt,
      };
    });
    return { profileId: id, extensions: entries };
  }
}

module.exports = {
  BrowserExtensionManager,
  MAX_EXTENSION_BYTES,
  MAX_EXTENSION_FILES,
  inspectExtensionDirectory,
  manifestPermissions,
  validateManifest,
};
