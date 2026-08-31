const DATA_HEALTH_STATES = Object.freeze(["healthy", "failed"]);
const SYNC_RUNTIME_STATES = Object.freeze([
  "disabled",
  "notConfigured",
  "idle",
  "syncing",
  "offline",
  "authRequired",
  "conflict",
  "failed",
]);

const AUTH_ERROR_CODES = new Set([
  "DRIVE_SCOPE_MISSING",
  "GOOGLE_AUTH_EXPIRED",
  "GOOGLE_NOT_SIGNED_IN",
  "GOOGLE_PERMISSION_DENIED",
  "GOOGLE_TEST_USER_REQUIRED",
  "GOOGLE_TOKEN_REFRESH_FAILED",
]);

function deriveDataHealthStatus(input = {}) {
  const incremental = input.incremental && typeof input.incremental === "object"
    ? input.incremental
    : {};
  const configured = input.configured === true;
  const signedIn = input.signedIn === true;
  const driveStatus = String(input.driveStatus || "notConfigured");
  const errorCode = String(input.errorCode || incremental.lastErrorCode || "");
  const dataHealth = incremental.databaseHealthy === false ? "failed" : "healthy";

  let syncRuntime = "idle";
  if (!configured || (!signedIn && !errorCode)) syncRuntime = "notConfigured";
  else if (incremental.conflictCount > 0 || driveStatus === "conflict") syncRuntime = "conflict";
  else if (AUTH_ERROR_CODES.has(errorCode) || ["authorizationRequired", "tokenExpired", "permissionDenied", "testUserRequired"].includes(driveStatus)) syncRuntime = "authRequired";
  else if (incremental.status === "syncing" || driveStatus === "syncing") syncRuntime = "syncing";
  else if (input.online === false && signedIn) syncRuntime = "offline";
  else if (incremental.status === "failed" || ["apiDisabled", "networkError", "error"].includes(driveStatus)) syncRuntime = "failed";

  return {
    dataHealth: DATA_HEALTH_STATES.includes(dataHealth) ? dataHealth : "failed",
    syncRuntime: SYNC_RUNTIME_STATES.includes(syncRuntime) ? syncRuntime : "failed",
    topTone: dataHealth === "failed" || ["authRequired", "conflict", "failed"].includes(syncRuntime)
      ? "error"
      : syncRuntime === "notConfigured" ? "neutral" : "healthy",
    animated: syncRuntime === "syncing",
  };
}

module.exports = {
  AUTH_ERROR_CODES,
  DATA_HEALTH_STATES,
  SYNC_RUNTIME_STATES,
  deriveDataHealthStatus,
};
