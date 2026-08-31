const { randomUUID } = require("node:crypto");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const {
  applyEntityOperationToState,
  buildSyncEntities,
  conflictPolicyFor,
  payloadHash,
} = require("./entity-adapters.cjs");

const DATABASE_SCHEMA_VERSION = 1;
const DEFAULT_PROVIDER_ID = "google-drive";

function json(value) {
  return JSON.stringify(value == null ? null : value);
}

function parseJson(value, fallback = null) {
  try {
    return JSON.parse(String(value));
  } catch {
    return fallback;
  }
}

function nowIso(now) {
  return new Date(now()).toISOString();
}

class RecordSyncStore {
  constructor(filePath, options = {}) {
    this.filePath = path.resolve(filePath);
    this.now = typeof options.now === "function" ? options.now : () => Date.now();
    this.deviceName = String(options.deviceName || "This device").slice(0, 160);
    this.platform = String(options.platform || process.platform).slice(0, 40);
    this.appVersion = String(options.appVersion || "unknown").slice(0, 40);
    this.schemaVersion = Number(options.schemaVersion) || 0;
    this.db = null;
    this.deviceId = null;
  }

  open() {
    if (this.db) return this.db;
    this.db = new DatabaseSync(this.filePath);
    this.db.exec("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;");
    this._migrate();
    this._ensureDevice();
    return this.db;
  }

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
  }

  _migrate() {
    const db = this.db;
    const current = Number(db.prepare("PRAGMA user_version").get().user_version) || 0;
    if (current > DATABASE_SCHEMA_VERSION) {
      throw new Error(`同步数据库版本 ${current} 高于当前支持的版本 ${DATABASE_SCHEMA_VERSION}`);
    }
    db.exec(`
      CREATE TABLE IF NOT EXISTS app_state (
        id TEXT PRIMARY KEY,
        state_json TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS sync_devices (
        device_id TEXT PRIMARY KEY,
        device_name TEXT NOT NULL,
        platform TEXT NOT NULL,
        app_version TEXT NOT NULL,
        schema_version INTEGER NOT NULL,
        first_seen_at TEXT NOT NULL,
        last_seen_at TEXT NOT NULL,
        is_local INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS sync_state (
        provider_id TEXT PRIMARY KEY,
        account_id TEXT,
        local_revision INTEGER NOT NULL DEFAULT 0,
        last_uploaded_revision INTEGER NOT NULL DEFAULT 0,
        last_downloaded_revision INTEGER NOT NULL DEFAULT 0,
        drive_page_token TEXT,
        last_sync_at TEXT,
        last_successful_sync_at TEXT,
        last_error_code TEXT,
        status TEXT NOT NULL DEFAULT 'notConfigured'
      );
      CREATE TABLE IF NOT EXISTS sync_entities (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        payload_hash TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        device_id TEXT NOT NULL,
        PRIMARY KEY(entity_type, entity_id)
      );
      CREATE TABLE IF NOT EXISTS sync_outbox (
        operation_id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        operation TEXT NOT NULL CHECK(operation IN ('create','update','delete')),
        base_revision INTEGER NOT NULL,
        entity_revision INTEGER NOT NULL,
        local_revision INTEGER NOT NULL,
        payload_json TEXT,
        device_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'pending',
        retry_count INTEGER NOT NULL DEFAULT 0,
        last_error_code TEXT,
        uploaded_batch_id TEXT
      );
      CREATE INDEX IF NOT EXISTS sync_outbox_pending_idx ON sync_outbox(state, local_revision);
      CREATE TABLE IF NOT EXISTS sync_applied_operations (
        operation_id TEXT PRIMARY KEY,
        device_id TEXT NOT NULL,
        applied_at TEXT NOT NULL,
        batch_id TEXT
      );
      CREATE TABLE IF NOT EXISTS sync_tombstones (
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        deleted_at TEXT NOT NULL,
        deleted_by_device_id TEXT NOT NULL,
        revision INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        PRIMARY KEY(entity_type, entity_id)
      );
      CREATE TABLE IF NOT EXISTS sync_conflicts (
        id TEXT PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        local_version TEXT,
        remote_version TEXT,
        base_version TEXT,
        conflict_type TEXT NOT NULL,
        detected_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution TEXT
      );
      CREATE INDEX IF NOT EXISTS sync_conflicts_open_idx ON sync_conflicts(resolved_at, detected_at);
      CREATE TABLE IF NOT EXISTS sync_snapshots (
        id TEXT PRIMARY KEY,
        revision INTEGER NOT NULL,
        checksum TEXT NOT NULL,
        created_at TEXT NOT NULL,
        state TEXT NOT NULL DEFAULT 'local'
      );
      CREATE TABLE IF NOT EXISTS shortcut_profiles (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        name TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS shortcut_bindings (
        id TEXT PRIMARY KEY,
        profile_id TEXT NOT NULL REFERENCES shortcut_profiles(id) ON DELETE CASCADE,
        action_id TEXT NOT NULL,
        platform TEXT NOT NULL,
        scope TEXT NOT NULL,
        accelerator TEXT,
        enabled INTEGER NOT NULL DEFAULT 1,
        is_default INTEGER NOT NULL DEFAULT 1,
        updated_at TEXT NOT NULL,
        UNIQUE(profile_id, action_id)
      );
    `);
    if (current < DATABASE_SCHEMA_VERSION) db.exec(`PRAGMA user_version=${DATABASE_SCHEMA_VERSION}`);
  }

  _ensureDevice() {
    const db = this.db;
    const existing = db.prepare("SELECT device_id FROM sync_devices WHERE is_local=1 LIMIT 1").get();
    const timestamp = nowIso(this.now);
    this.deviceId = existing?.device_id || randomUUID();
    db.prepare(`INSERT INTO sync_devices
      (device_id, device_name, platform, app_version, schema_version, first_seen_at, last_seen_at, is_local)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      ON CONFLICT(device_id) DO UPDATE SET
        device_name=excluded.device_name, platform=excluded.platform,
        app_version=excluded.app_version, schema_version=excluded.schema_version,
        last_seen_at=excluded.last_seen_at, is_local=1`).run(
      this.deviceId, this.deviceName, this.platform, this.appVersion,
      this.schemaVersion, timestamp, timestamp,
    );
    db.prepare(`INSERT INTO sync_state(provider_id, status) VALUES (?, 'notConfigured')
      ON CONFLICT(provider_id) DO NOTHING`).run(DEFAULT_PROVIDER_ID);
  }

  initialize(fallbackState) {
    this.open();
    const row = this.db.prepare("SELECT state_json FROM app_state WHERE id='primary'").get();
    if (row) {
      const state = parseJson(row.state_json);
      if (!state || typeof state !== "object") throw new Error("本地同步数据库中的应用状态已损坏");
      return { state, migrated: false, deviceId: this.deviceId };
    }
    this._seed(fallbackState);
    return { state: fallbackState, migrated: true, deviceId: this.deviceId };
  }

  _seed(state) {
    const timestamp = nowIso(this.now);
    const entities = buildSyncEntities(state);
    this.db.exec("BEGIN IMMEDIATE");
    try {
      this.db.prepare("INSERT INTO app_state(id,state_json,schema_version,updated_at) VALUES('primary',?,?,?)")
        .run(json(state), Number(state?.version) || this.schemaVersion, timestamp);
      const insert = this.db.prepare(`INSERT INTO sync_entities
        (entity_type,entity_id,revision,payload_json,payload_hash,updated_at,device_id)
        VALUES(?,?,?,?,?,?,?)`);
      for (const entity of entities.values()) {
        insert.run(entity.entityType, entity.entityId, 1, json(entity.payload), entity.payloadHash, entity.updatedAt, this.deviceId);
      }
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  commitState(state, options = {}) {
    this.open();
    const emitOutbox = options.emitOutbox !== false;
    const timestamp = nowIso(this.now);
    const nextEntities = buildSyncEntities(state);
    const currentRows = this.db.prepare("SELECT * FROM sync_entities").all();
    const current = new Map(currentRows.map((row) => [`${row.entity_type}:${row.entity_id}`, row]));
    const syncState = this.db.prepare("SELECT local_revision FROM sync_state WHERE provider_id=?").get(DEFAULT_PROVIDER_ID);
    let localRevision = Number(syncState?.local_revision) || 0;
    let changeCount = 0;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const upsertEntity = this.db.prepare(`INSERT INTO sync_entities
        (entity_type,entity_id,revision,payload_json,payload_hash,updated_at,device_id)
        VALUES(?,?,?,?,?,?,?)
        ON CONFLICT(entity_type,entity_id) DO UPDATE SET
          revision=excluded.revision,payload_json=excluded.payload_json,payload_hash=excluded.payload_hash,
          updated_at=excluded.updated_at,device_id=excluded.device_id`);
      const insertOutbox = this.db.prepare(`INSERT INTO sync_outbox
        (operation_id,entity_type,entity_id,operation,base_revision,entity_revision,local_revision,payload_json,device_id,created_at,state)
        VALUES(?,?,?,?,?,?,?,?,?,?,'pending')`);
      for (const [key, entity] of nextEntities) {
        const previous = current.get(key);
        if (previous?.payload_hash === entity.payloadHash) continue;
        const baseRevision = Number(previous?.revision) || 0;
        const entityRevision = baseRevision + 1;
        localRevision += 1;
        changeCount += 1;
        upsertEntity.run(
          entity.entityType, entity.entityId, entityRevision, json(entity.payload),
          entity.payloadHash, entity.updatedAt, this.deviceId,
        );
        this.db.prepare("DELETE FROM sync_tombstones WHERE entity_type=? AND entity_id=?")
          .run(entity.entityType, entity.entityId);
        if (emitOutbox) insertOutbox.run(
          randomUUID(), entity.entityType, entity.entityId,
          previous ? "update" : "create", baseRevision, entityRevision, localRevision,
          json(entity.payload), this.deviceId, timestamp,
        );
      }
      for (const [key, previous] of current) {
        if (nextEntities.has(key)) continue;
        const entityRevision = Number(previous.revision) + 1;
        localRevision += 1;
        changeCount += 1;
        this.db.prepare("DELETE FROM sync_entities WHERE entity_type=? AND entity_id=?")
          .run(previous.entity_type, previous.entity_id);
        this.db.prepare(`INSERT INTO sync_tombstones
          (entity_type,entity_id,deleted_at,deleted_by_device_id,revision,expires_at)
          VALUES(?,?,?,?,?,?)
          ON CONFLICT(entity_type,entity_id) DO UPDATE SET
            deleted_at=excluded.deleted_at,deleted_by_device_id=excluded.deleted_by_device_id,
            revision=excluded.revision,expires_at=excluded.expires_at`).run(
          previous.entity_type, previous.entity_id, timestamp, this.deviceId, entityRevision,
          new Date(this.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
        );
        if (emitOutbox) insertOutbox.run(
          randomUUID(), previous.entity_type, previous.entity_id, "delete",
          Number(previous.revision), entityRevision, localRevision, null, this.deviceId, timestamp,
        );
      }
      this.db.prepare(`INSERT INTO app_state(id,state_json,schema_version,updated_at)
        VALUES('primary',?,?,?) ON CONFLICT(id) DO UPDATE SET
        state_json=excluded.state_json,schema_version=excluded.schema_version,updated_at=excluded.updated_at`)
        .run(json(state), Number(state?.version) || this.schemaVersion, timestamp);
      this.db.prepare("UPDATE sync_state SET local_revision=? WHERE provider_id=?")
        .run(localRevision, DEFAULT_PROVIDER_ID);
      this.db.exec("COMMIT");
      return { state, changeCount, localRevision, deviceId: this.deviceId };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  pendingOperations(limit = 100) {
    this.open();
    return this.db.prepare(`SELECT * FROM sync_outbox WHERE state='pending'
      ORDER BY local_revision ASC LIMIT ?`).all(Math.max(1, Math.min(500, Number(limit) || 100))).map((row) => ({
      operationId: row.operation_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      operation: row.operation,
      baseRevision: Number(row.base_revision),
      entityRevision: Number(row.entity_revision),
      localRevision: Number(row.local_revision),
      payload: row.payload_json ? parseJson(row.payload_json) : null,
      deviceId: row.device_id,
      createdAt: row.created_at,
    }));
  }

  markUploaded(operationIds, batchId) {
    this.open();
    const ids = Array.from(new Set((operationIds || []).map(String).filter(Boolean)));
    if (!ids.length) return;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      const update = this.db.prepare("UPDATE sync_outbox SET state='uploaded',uploaded_batch_id=?,last_error_code=NULL WHERE operation_id=?");
      for (const id of ids) update.run(String(batchId || ""), id);
      const last = this.db.prepare("SELECT MAX(local_revision) value FROM sync_outbox WHERE state='uploaded'").get();
      this.db.prepare("UPDATE sync_state SET last_uploaded_revision=? WHERE provider_id=?")
        .run(Number(last?.value) || 0, DEFAULT_PROVIDER_ID);
      this.db.exec("COMMIT");
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  markUploadFailure(operationIds, errorCode) {
    this.open();
    const update = this.db.prepare("UPDATE sync_outbox SET retry_count=retry_count+1,last_error_code=? WHERE operation_id=?");
    for (const id of operationIds || []) update.run(String(errorCode || "SYNC_UPLOAD_FAILED").slice(0, 120), String(id));
  }

  hasAppliedOperation(operationId) {
    this.open();
    return Boolean(this.db.prepare("SELECT 1 found FROM sync_applied_operations WHERE operation_id=?").get(String(operationId || "")));
  }

  applyRemoteOperations(operations, options = {}) {
    this.open();
    let state = parseJson(this.db.prepare("SELECT state_json FROM app_state WHERE id='primary'").get()?.state_json, {});
    const batchId = String(options.batchId || "");
    const timestamp = nowIso(this.now);
    let appliedCount = 0;
    let conflictCount = 0;
    this.db.exec("BEGIN IMMEDIATE");
    try {
      for (const raw of Array.isArray(operations) ? operations : []) {
        const operation = {
          operationId: String(raw.operationId || ""),
          deviceId: String(raw.deviceId || "unknown"),
          entityType: String(raw.entityType || ""),
          entityId: String(raw.entityId || ""),
          operation: ["create", "update", "delete"].includes(raw.operation) ? raw.operation : "update",
          baseRevision: Number(raw.baseRevision) || 0,
          entityRevision: Number(raw.entityRevision) || 1,
          payload: raw.payload == null ? null : raw.payload,
          createdAt: raw.createdAt || timestamp,
        };
        if (!operation.operationId || !operation.entityType || !operation.entityId) continue;
        if (this.db.prepare("SELECT 1 found FROM sync_applied_operations WHERE operation_id=?").get(operation.operationId)) continue;
        const local = this.db.prepare("SELECT * FROM sync_entities WHERE entity_type=? AND entity_id=?")
          .get(operation.entityType, operation.entityId);
        const localRevision = Number(local?.revision) || 0;
        const remoteHash = operation.payload == null ? "" : payloadHash(operation.payload);
        const diverged = Boolean(
          local && operation.operation !== "delete" && localRevision !== operation.baseRevision && local.payload_hash !== remoteHash,
        );
        let shouldApply = true;
        if (diverged) {
          const policy = conflictPolicyFor(operation.entityType);
          if (policy === "manual") {
            const conflictId = randomUUID();
            this.db.prepare(`INSERT INTO sync_conflicts
              (id,entity_type,entity_id,local_version,remote_version,base_version,conflict_type,detected_at)
              VALUES(?,?,?,?,?,?,?,?)`).run(
              conflictId, operation.entityType, operation.entityId,
              local.payload_json, json(operation.payload), json({ revision: operation.baseRevision }),
              `${operation.entityType}-concurrent-update`, timestamp,
            );
            conflictCount += 1;
            shouldApply = false;
          } else {
            const localUpdated = Date.parse(local.updated_at || "") || 0;
            const remoteUpdated = Date.parse(operation.payload?.updatedAt || operation.createdAt || "") || 0;
            shouldApply = remoteUpdated > localUpdated;
          }
        }
        if (shouldApply) {
          if (operation.operation === "delete") {
            this.db.prepare("DELETE FROM sync_entities WHERE entity_type=? AND entity_id=?")
              .run(operation.entityType, operation.entityId);
            this.db.prepare(`INSERT INTO sync_tombstones
              (entity_type,entity_id,deleted_at,deleted_by_device_id,revision,expires_at)
              VALUES(?,?,?,?,?,?) ON CONFLICT(entity_type,entity_id) DO UPDATE SET
              deleted_at=excluded.deleted_at,deleted_by_device_id=excluded.deleted_by_device_id,
              revision=MAX(sync_tombstones.revision,excluded.revision),expires_at=excluded.expires_at`).run(
              operation.entityType, operation.entityId, operation.createdAt, operation.deviceId,
              operation.entityRevision, new Date(this.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
            );
          } else {
            const tombstone = this.db.prepare("SELECT revision FROM sync_tombstones WHERE entity_type=? AND entity_id=?")
              .get(operation.entityType, operation.entityId);
            if (!tombstone || Number(tombstone.revision) < operation.entityRevision) {
              this.db.prepare(`INSERT INTO sync_entities
                (entity_type,entity_id,revision,payload_json,payload_hash,updated_at,device_id)
                VALUES(?,?,?,?,?,?,?) ON CONFLICT(entity_type,entity_id) DO UPDATE SET
                revision=excluded.revision,payload_json=excluded.payload_json,payload_hash=excluded.payload_hash,
                updated_at=excluded.updated_at,device_id=excluded.device_id`).run(
                operation.entityType, operation.entityId,
                Math.max(localRevision, operation.entityRevision), json(operation.payload), remoteHash,
                operation.payload?.updatedAt || operation.createdAt, operation.deviceId,
              );
              this.db.prepare("DELETE FROM sync_tombstones WHERE entity_type=? AND entity_id=?")
                .run(operation.entityType, operation.entityId);
            } else {
              shouldApply = false;
            }
          }
          if (shouldApply) {
            state = applyEntityOperationToState(state, operation);
            appliedCount += 1;
          }
        }
        this.db.prepare(`INSERT INTO sync_applied_operations(operation_id,device_id,applied_at,batch_id)
          VALUES(?,?,?,?)`).run(operation.operationId, operation.deviceId, timestamp, batchId);
      }
      this.db.prepare("UPDATE app_state SET state_json=?,schema_version=?,updated_at=? WHERE id='primary'")
        .run(json(state), Number(state.version) || this.schemaVersion, timestamp);
      this.db.prepare("UPDATE sync_state SET last_downloaded_revision=last_downloaded_revision+?,status=? WHERE provider_id=?")
        .run(appliedCount, conflictCount ? "conflict" : "idle", DEFAULT_PROVIDER_ID);
      this.db.exec("COMMIT");
      return { state, appliedCount, conflictCount };
    } catch (error) {
      this.db.exec("ROLLBACK");
      throw error;
    }
  }

  createSnapshot() {
    this.open();
    const entities = this.db.prepare("SELECT entity_type,entity_id,revision,payload_json,payload_hash,updated_at,device_id FROM sync_entities ORDER BY entity_type,entity_id").all()
      .map((row) => ({
        entityType: row.entity_type, entityId: row.entity_id, revision: Number(row.revision),
        payload: parseJson(row.payload_json), payloadHash: row.payload_hash,
        updatedAt: row.updated_at, deviceId: row.device_id,
      }));
    const revision = Number(this.db.prepare("SELECT local_revision FROM sync_state WHERE provider_id=?").get(DEFAULT_PROVIDER_ID)?.local_revision) || 0;
    const tombstones = this.db.prepare(`SELECT entity_type,entity_id,deleted_at,deleted_by_device_id,revision,expires_at
      FROM sync_tombstones WHERE expires_at>? ORDER BY entity_type,entity_id`).all(nowIso(this.now)).map((row) => ({
      entityType: row.entity_type,
      entityId: row.entity_id,
      deletedAt: row.deleted_at,
      deletedByDeviceId: row.deleted_by_device_id,
      revision: Number(row.revision),
      expiresAt: row.expires_at,
    }));
    return { revision, entities, tombstones };
  }

  recordSnapshot(snapshot) {
    this.open();
    this.db.prepare(`INSERT INTO sync_snapshots(id,revision,checksum,created_at,state)
      VALUES(?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      revision=excluded.revision,checksum=excluded.checksum,created_at=excluded.created_at,state=excluded.state`).run(
      String(snapshot?.id || randomUUID()),
      Number(snapshot?.revision) || 0,
      String(snapshot?.checksum || ""),
      String(snapshot?.createdAt || nowIso(this.now)),
      "uploaded",
    );
  }

  applySnapshot(snapshot) {
    this.open();
    const operations = (snapshot?.entities || []).map((entity) => ({
      operationId: `snapshot:${snapshot.id || snapshot.checksum}:${entity.entityType}:${entity.entityId}`,
      deviceId: entity.deviceId || "snapshot",
      entityType: entity.entityType,
      entityId: entity.entityId,
      operation: "create",
      baseRevision: 0,
      entityRevision: Number(entity.revision) || 1,
      payload: entity.payload,
      createdAt: entity.updatedAt,
    }));
    for (const tombstone of snapshot?.tombstones || []) {
      operations.push({
        operationId: `snapshot:${snapshot.id || snapshot.checksum}:delete:${tombstone.entityType}:${tombstone.entityId}`,
        deviceId: tombstone.deletedByDeviceId || snapshot.deviceId || "snapshot",
        entityType: tombstone.entityType,
        entityId: tombstone.entityId,
        operation: "delete",
        baseRevision: Math.max(0, Number(tombstone.revision) - 1),
        entityRevision: Number(tombstone.revision) || 1,
        payload: null,
        createdAt: tombstone.deletedAt || snapshot.createdAt,
      });
    }
    return this.applyRemoteOperations(operations, { batchId: snapshot.id || "snapshot" });
  }

  setRuntimeState(patch = {}) {
    this.open();
    const allowed = {
      account_id: patch.accountId,
      drive_page_token: patch.drivePageToken,
      last_sync_at: patch.lastSyncAt,
      last_successful_sync_at: patch.lastSuccessfulSyncAt,
      last_error_code: patch.lastErrorCode,
      status: patch.status,
    };
    const entries = Object.entries(allowed).filter(([, value]) => value !== undefined);
    if (!entries.length) return this.runtimeSummary();
    const sql = `UPDATE sync_state SET ${entries.map(([key]) => `${key}=?`).join(",")} WHERE provider_id=?`;
    this.db.prepare(sql).run(...entries.map(([, value]) => value), DEFAULT_PROVIDER_ID);
    return this.runtimeSummary();
  }

  runtimeSummary() {
    this.open();
    const state = this.db.prepare("SELECT * FROM sync_state WHERE provider_id=?").get(DEFAULT_PROVIDER_ID) || {};
    const pendingUploadCount = Number(this.db.prepare("SELECT COUNT(*) value FROM sync_outbox WHERE state='pending'").get().value) || 0;
    const conflictCount = Number(this.db.prepare("SELECT COUNT(*) value FROM sync_conflicts WHERE resolved_at IS NULL").get().value) || 0;
    return {
      deviceId: this.deviceId,
      deviceName: this.deviceName,
      databasePath: this.filePath,
      databaseHealthy: true,
      status: state.status || "notConfigured",
      accountId: state.account_id || null,
      localRevision: Number(state.local_revision) || 0,
      lastUploadedRevision: Number(state.last_uploaded_revision) || 0,
      lastDownloadedRevision: Number(state.last_downloaded_revision) || 0,
      drivePageToken: state.drive_page_token || null,
      lastSyncAt: state.last_sync_at || null,
      lastSuccessfulSyncAt: state.last_successful_sync_at || null,
      lastErrorCode: state.last_error_code || null,
      pendingUploadCount,
      pendingApplyCount: 0,
      conflictCount,
    };
  }

  listConflicts() {
    this.open();
    return this.db.prepare("SELECT * FROM sync_conflicts WHERE resolved_at IS NULL ORDER BY detected_at DESC").all().map((row) => ({
      id: row.id,
      entityType: row.entity_type,
      entityId: row.entity_id,
      localVersion: parseJson(row.local_version),
      remoteVersion: parseJson(row.remote_version),
      baseVersion: parseJson(row.base_version),
      conflictType: row.conflict_type,
      detectedAt: row.detected_at,
    }));
  }
}

module.exports = {
  DATABASE_SCHEMA_VERSION,
  DEFAULT_PROVIDER_ID,
  RecordSyncStore,
};
