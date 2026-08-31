const { createHash } = require("node:crypto");
const { stableSerialize } = require("./entity-adapters.cjs");

const PROTOCOL_VERSION = 1;
const MANIFEST_FILE_NAME = "qiye-sync-manifest-v1.json";

function checksum(value) {
  return createHash("sha256").update(stableSerialize(value)).digest("hex");
}

function validateEnvelope(value, kind) {
  if (!value || typeof value !== "object" || value.kind !== kind || value.protocolVersion !== PROTOCOL_VERSION) {
    const error = new Error(`Google Drive 中的${kind === "operations" ? "操作批次" : "同步快照"}格式无效`);
    error.code = "SYNC_INVALID_RESPONSE";
    throw error;
  }
  const expected = String(value.checksum || "");
  const candidate = { ...value };
  delete candidate.checksum;
  if (!expected || checksum(candidate) !== expected) {
    const error = new Error("Google Drive 增量同步文件校验失败");
    error.code = "SYNC_CHECKSUM_FAILED";
    throw error;
  }
  return value;
}

class IncrementalSyncEngine {
  constructor(options = {}) {
    if (!options.store) throw new TypeError("IncrementalSyncEngine requires a RecordSyncStore");
    this.store = options.store;
    this.appVersion = String(options.appVersion || "unknown").slice(0, 40);
    this.schemaVersion = Number(options.schemaVersion) || 0;
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.running = null;
  }

  sync(service, options = {}) {
    if (this.running) return this.running;
    this.running = this._sync(service, options).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  async _sync(service, options = {}) {
    const startedAt = new Date(this.now()).toISOString();
    this.store.setRuntimeState({ status: "syncing", lastErrorCode: null });
    try {
      const serviceStatus = await service.status();
      if (!serviceStatus.signedIn || serviceStatus.drive?.status !== "ready") {
        const error = new Error("Google Drive 尚未完成授权");
        error.code = serviceStatus.drive?.lastErrorCode || "GOOGLE_NOT_SIGNED_IN";
        throw error;
      }
      await service.healthCheck();
      const before = this.store.runtimeSummary();
      const pending = this.store.pendingOperations(100);
      let uploadedBatch = null;
      if (pending.length) {
        uploadedBatch = this._operationBatch(pending);
        const name = this._operationFileName(uploadedBatch);
        try {
          await service.writeAppDataJson(name, uploadedBatch, {
            appProperties: { qiyeProtocol: "1", qiyeKind: "operations", deviceId: this.store.deviceId },
          });
          this.store.markUploaded(pending.map((item) => item.operationId), uploadedBatch.batchId);
        } catch (error) {
          this.store.markUploadFailure(pending.map((item) => item.operationId), error?.code);
          throw error;
        }
      }

      const discovered = await this._discoverFiles(service, before.drivePageToken, options.fullScan === true);
      const manifestFile = discovered.files.find((file) => file.name === MANIFEST_FILE_NAME);
      let previousManifest = null;
      if (manifestFile) {
        try {
          previousManifest = validateEnvelope(await service.readAppDataJson(manifestFile.id), "manifest");
        } catch {
          previousManifest = null;
        }
      }
      let state = null;
      let appliedCount = 0;
      let conflictCount = 0;
      const snapshotFiles = discovered.files
        .filter((file) => /^qiye-snapshot-.*\.json$/i.test(file.name || ""))
        .sort((left, right) => String(right.name).localeCompare(String(left.name)));
      if (before.lastDownloadedRevision === 0 && before.pendingUploadCount === 0 && snapshotFiles.length) {
        const snapshot = validateEnvelope(await service.readAppDataJson(snapshotFiles[0].id), "snapshot");
        const applied = this.store.applySnapshot(snapshot);
        state = applied.state;
        appliedCount += applied.appliedCount;
        conflictCount += applied.conflictCount;
      }
      const operationFiles = discovered.files
        .filter((file) => /^qiye-operations-.*\.json$/i.test(file.name || ""))
        .sort((left, right) => String(left.name).localeCompare(String(right.name)));
      for (const file of operationFiles) {
        const batch = validateEnvelope(await service.readAppDataJson(file.id), "operations");
        if (batch.deviceId === this.store.deviceId) continue;
        const unapplied = (batch.operations || []).filter((operation) => !this.store.hasAppliedOperation(operation.operationId));
        if (!unapplied.length) continue;
        const applied = this.store.applyRemoteOperations(unapplied, { batchId: batch.batchId });
        state = applied.state;
        appliedCount += applied.appliedCount;
        conflictCount += applied.conflictCount;
      }

      let snapshotFile = snapshotFiles[0] || null;
      const afterApply = this.store.runtimeSummary();
      if (!snapshotFile || afterApply.localRevision - Number(options.latestSnapshotRevision || 0) >= 500) {
        const snapshot = this._snapshotEnvelope(this.store.createSnapshot());
        const name = `qiye-snapshot-${String(snapshot.revision).padStart(10, "0")}-${snapshot.checksum.slice(0, 10)}.json`;
        const written = await service.writeAppDataJson(name, snapshot, {
          appProperties: { qiyeProtocol: "1", qiyeKind: "snapshot", deviceId: this.store.deviceId },
        });
        this.store.recordSnapshot(snapshot);
        snapshotFile = { id: written.fileId, name, revision: snapshot.revision, checksum: snapshot.checksum };
      }

      const completedAt = new Date(this.now()).toISOString();
      const finalSummary = this.store.runtimeSummary();
      const deviceMap = new Map((previousManifest?.devices || []).map((device) => [device.deviceId, device]));
      deviceMap.set(this.store.deviceId, {
        deviceId: this.store.deviceId,
        deviceName: this.store.deviceName,
        appVersion: this.appVersion,
        schemaVersion: this.schemaVersion,
        lastSeenAt: completedAt,
      });
      const batchMap = new Map((previousManifest?.operationBatches || []).map((batch) => [batch.batchId, batch]));
      if (uploadedBatch) batchMap.set(uploadedBatch.batchId, {
        batchId: uploadedBatch.batchId,
        deviceId: uploadedBatch.deviceId,
        firstRevision: uploadedBatch.firstRevision,
        lastRevision: uploadedBatch.lastRevision,
        checksum: uploadedBatch.checksum,
      });
      const manifestBody = {
        kind: "manifest",
        protocolVersion: PROTOCOL_VERSION,
        formatVersion: 1,
        minimumAppVersion: this.appVersion,
        schemaVersion: this.schemaVersion,
        updatedAt: completedAt,
        latestSnapshotId: snapshotFile?.id || null,
        latestSnapshotName: snapshotFile?.name || null,
        latestSnapshotRevision: Number(snapshotFile?.revision) || finalSummary.localRevision,
        devices: Array.from(deviceMap.values()).slice(-100),
        operationBatches: Array.from(batchMap.values()).slice(-2_000),
      };
      const manifest = { ...manifestBody, checksum: checksum(manifestBody) };
      await service.writeAppDataJson(MANIFEST_FILE_NAME, manifest, {
        upsert: true,
        appProperties: { qiyeProtocol: "1", qiyeKind: "manifest" },
      });
      const runtime = this.store.setRuntimeState({
        status: conflictCount ? "conflict" : "idle",
        drivePageToken: discovered.nextPageToken,
        lastSyncAt: completedAt,
        lastSuccessfulSyncAt: conflictCount ? undefined : completedAt,
        lastErrorCode: null,
        accountId: serviceStatus.identity?.accountId || serviceStatus.email || null,
      });
      return {
        ok: true,
        state,
        startedAt,
        completedAt,
        uploadedCount: pending.length,
        appliedCount,
        conflictCount,
        runtime,
      };
    } catch (error) {
      this.store.setRuntimeState({ status: error?.code === "GOOGLE_NOT_SIGNED_IN" ? "authRequired" : "failed", lastErrorCode: String(error?.code || "SYNC_FAILED").slice(0, 120) });
      throw error;
    }
  }

  _operationBatch(operations) {
    const body = {
      kind: "operations",
      protocolVersion: PROTOCOL_VERSION,
      formatVersion: 1,
      batchId: checksum(operations.map((item) => item.operationId)),
      deviceId: this.store.deviceId,
      createdAt: new Date(this.now()).toISOString(),
      firstRevision: operations[0]?.localRevision || 0,
      lastRevision: operations.at(-1)?.localRevision || 0,
      operations,
    };
    return { ...body, checksum: checksum(body) };
  }

  _snapshotEnvelope(snapshot) {
    const body = {
      kind: "snapshot",
      protocolVersion: PROTOCOL_VERSION,
      formatVersion: 1,
      id: `snapshot-${snapshot.revision}-${this.store.deviceId}`,
      deviceId: this.store.deviceId,
      schemaVersion: this.schemaVersion,
      createdAt: new Date(this.now()).toISOString(),
      revision: snapshot.revision,
      entities: snapshot.entities,
      tombstones: snapshot.tombstones || [],
    };
    return { ...body, checksum: checksum(body) };
  }

  _operationFileName(batch) {
    return [
      "qiye-operations",
      batch.deviceId,
      String(batch.firstRevision).padStart(10, "0"),
      String(batch.lastRevision).padStart(10, "0"),
      batch.checksum.slice(0, 10),
    ].join("-") + ".json";
  }

  async _discoverFiles(service, pageToken, forceFullScan) {
    if (!pageToken || forceFullScan) {
      const files = await service.listAppDataFiles();
      return { files, nextPageToken: await service.getStartPageToken() };
    }
    try {
      const result = await service.listChanges(pageToken);
      const files = result.changes
        .filter((change) => !change.removed && change.file && !change.file.trashed && /^qiye-/.test(change.file.name || ""))
        .map((change) => change.file);
      return { files, nextPageToken: result.newStartPageToken };
    } catch (error) {
      if (!["GOOGLE_DRIVE_CHANGES_FAILED", "GOOGLE_INVALID_RESPONSE"].includes(error?.code)) throw error;
      const files = await service.listAppDataFiles();
      return { files, nextPageToken: await service.getStartPageToken() };
    }
  }
}

module.exports = {
  IncrementalSyncEngine,
  MANIFEST_FILE_NAME,
  PROTOCOL_VERSION,
  checksum,
  validateEnvelope,
};
