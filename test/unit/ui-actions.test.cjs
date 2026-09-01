const test = require("node:test");
const assert = require("node:assert/strict");

const {
  ACTION_STATUSES,
  UIActionAuditService,
  UIActionDefinitionError,
  UIActionExecutionService,
  UIActionRegistry,
  UI_ACTION_IDS,
  createUIActionRegistry,
} = require("../../electron/ui-actions/index.cjs");

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

test("正式动作目录覆盖所有已标记关键控件且拒绝脱离界面的伪执行", async () => {
  const registry = createUIActionRegistry();
  assert.equal(registry.size, 89);
  assert.equal(new Set(UI_ACTION_IDS).size, 89);
  const snapshot = await registry.snapshot({});
  assert.equal(snapshot.every((action) => action.hasHandler), true);
  const service = new UIActionExecutionService({ registry });
  const detached = await service.execute("site.save");
  assert.equal(detached.ok, false);
  assert.equal(detached.errorCode, "UI_ACTION_RENDERER_DISPATCH_REQUIRED");
  const dispatched = await service.execute("site.save", {
    dispatch: async (actionId) => ({ ok: true, actionId, persisted: true }),
  });
  assert.equal(dispatched.ok, true);
  assert.equal(dispatched.result.persisted, true);
});

test("UIActionRegistry validates definitions, ids, handlers, and duplicates", () => {
  assert.deepEqual(ACTION_STATUSES, [
    "ready",
    "loading",
    "requiresConfiguration",
    "unavailable",
    "preview",
  ]);
  assert.throws(
    () => new UIActionRegistry([{ id: "site.save", label: "Save", status: "ready" }]),
    (error) =>
      error instanceof UIActionDefinitionError &&
      error.code === "UI_ACTION_HANDLER_REQUIRED",
  );
  assert.throws(
    () =>
      new UIActionRegistry([
        { id: "site.save", label: "Save", execute: async () => ({ ok: true }) },
        { id: "site.save", label: "Save again", execute: async () => ({ ok: true }) },
      ]),
    (error) => error.code === "UI_ACTION_ID_DUPLICATE",
  );
  assert.throws(
    () =>
      new UIActionRegistry([
        { id: "Site Save", label: "Invalid", execute: async () => ({ ok: true }) },
      ]),
    (error) => error.code === "UI_ACTION_ID_INVALID",
  );
  assert.throws(
    () =>
      new UIActionRegistry([
        {
          id: "dynamic.action",
          label: "Dynamic action",
          status: "requiresConfiguration",
          unavailableReason: "Configure it",
          getStatus: () => "ready",
        },
      ]),
    (error) => error.code === "UI_ACTION_HANDLER_REQUIRED",
  );
  assert.throws(
    () =>
      new UIActionRegistry([
        {
          id: "critical.delete",
          label: "Delete",
          verificationRequired: true,
          execute: async () => ({ ok: true }),
        },
      ]),
    (error) => error.code === "UI_ACTION_VERIFY_SUCCESS_REQUIRED",
  );
});

test("UIActionRegistry resolves all lifecycle states through real canExecute checks", async () => {
  const registry = new UIActionRegistry({
    actions: [
      {
        id: "site.save",
        label: "Save site",
        execute: async () => ({ ok: true }),
        canExecute: ({ writable }) =>
          writable
            ? true
            : { allowed: false, reason: "Workspace is read-only" },
      },
      {
        id: "zoho.connect",
        label: "Connect Zoho",
        requiresConfiguration: true,
        unavailableReason: "Add Zoho credentials first",
      },
      {
        id: "timeline.preview",
        label: "Timeline preview",
        status: "preview",
        unavailableReason: "Preview only",
      },
      {
        id: "download.wait",
        label: "Download",
        status: "loading",
      },
    ],
  });

  assert.equal((await registry.resolve("site.save", { writable: true })).status, "ready");
  const blocked = await registry.resolve("site.save", { writable: false });
  assert.equal(blocked.status, "unavailable");
  assert.equal(blocked.unavailableReason, "Workspace is read-only");
  assert.equal((await registry.resolve("zoho.connect")).status, "requiresConfiguration");
  assert.equal((await registry.resolve("timeline.preview")).status, "preview");
  assert.equal((await registry.resolve("download.wait")).status, "loading");
  assert.equal(await registry.resolve("missing.action"), null);
});

test("UIActionRegistry isolates availability failures in snapshots", async () => {
  const registry = new UIActionRegistry([
    {
      id: "broken.availability",
      label: "Broken availability",
      getStatus: async () => {
        throw new Error("provider failed");
      },
      execute: async () => ({ ok: true }),
    },
    {
      id: "healthy.action",
      label: "Healthy action",
      execute: async () => ({ ok: true }),
    },
  ]);
  const snapshot = await registry.snapshot();

  assert.equal(snapshot.length, 2);
  assert.equal(snapshot[0].status, "unavailable");
  assert.equal(
    snapshot[0].availabilityErrorCode,
    "UI_ACTION_AVAILABILITY_CHECK_FAILED",
  );
  assert.equal(snapshot[1].status, "ready");
});

test("UIActionExecutionService verifies persisted success through read-back", async () => {
  const transitions = [];
  const persisted = new Map();
  const registry = new UIActionRegistry([
    {
      id: "site.save",
      label: "Save site",
      execute: async ({ input }) => {
        persisted.set(input.id, { ...input });
        return {
          ok: true,
          message: "Site persisted",
          persistedId: input.id,
          accessToken: "must-not-leak",
          tokenCount: 12,
          cookieConsent: true,
          secretaryName: "Alice",
        };
      },
      verificationRequired: true,
      verifySuccess: async (_result, { input }) => ({
        ok: persisted.get(input.id)?.name === input.name,
        reloaded: true,
      }),
      successResult: (result, { verificationResult }) => ({
        ...result,
        reloaded: verificationResult.reloaded,
      }),
      resultFields: [
        "persistedId",
        "accessToken",
        "tokenCount",
        "cookieConsent",
        "secretaryName",
        "reloaded",
      ],
    },
    {
      id: "site.fake-save",
      label: "Fake save",
      execute: async () => undefined,
    },
    {
      id: "site.unverified-save",
      label: "Unverified save",
      execute: async () => ({ ok: true }),
      verifySuccess: async () => ({
        ok: false,
        errorCode: "READ_BACK_MISMATCH",
        message: "Saved value could not be read back",
      }),
    },
  ]);
  const service = new UIActionExecutionService({
    registry,
    createId: () => "request-1",
    onTransition: (event) => transitions.push(event.status),
  });

  const success = await service.execute({
    actionId: "site.save",
    input: { id: "site-7", name: "Example" },
  });
  assert.equal(success.ok, true);
  assert.equal(success.status, "success");
  assert.equal(success.verified, true);
  assert.equal(success.message, "Site persisted");
  assert.deepEqual(success.result, {
    persistedId: "site-7",
    accessToken: "[REDACTED]",
    tokenCount: 12,
    cookieConsent: true,
    secretaryName: "Alice",
    reloaded: true,
  });
  assert.deepEqual(transitions, ["loading", "ready"]);

  const fake = await service.execute("site.fake-save");
  assert.equal(fake.ok, false);
  assert.equal(fake.status, "failure");
  assert.equal(fake.errorCode, "UI_ACTION_INVALID_RESULT");
  const unverified = await service.execute("site.unverified-save");
  assert.equal(unverified.ok, false);
  assert.equal(unverified.errorCode, "READ_BACK_MISMATCH");
});

test("UIActionExecutionService respects non-ready actions without invoking execute", async () => {
  let calls = 0;
  const registry = new UIActionRegistry([
    {
      id: "settings.connect",
      label: "Connect",
      status: "requiresConfiguration",
      unavailableReason: "API key required",
      execute: async () => {
        calls += 1;
        return { ok: true };
      },
    },
    {
      id: "feature.preview",
      label: "Preview",
      status: "preview",
      unavailableReason: "Not released",
    },
    {
      id: "settings.protected",
      label: "Protected setting",
      canExecute: async () => ({
        allowed: false,
        reason: "Workspace is read-only",
      }),
      execute: async () => {
        calls += 1;
        return { ok: true };
      },
    },
    {
      id: "settings.trusted-context",
      label: "Trusted context",
      canExecute: ({ writable }) =>
        writable ? true : { allowed: false, reason: "Host context is read-only" },
      execute: async () => {
        calls += 1;
        return { ok: true };
      },
    },
  ]);
  const service = new UIActionExecutionService({ registry });

  const configuration = await service.execute("settings.connect");
  const preview = await service.execute("feature.preview");
  const protectedResult = await service.execute("settings.protected");
  const forgedContext = await service.execute(
    {
      actionId: "settings.trusted-context",
      context: { writable: true },
    },
    { writable: false },
  );
  assert.equal(configuration.status, "requiresConfiguration");
  assert.equal(configuration.message, "API key required");
  assert.equal(preview.status, "preview");
  assert.equal(protectedResult.status, "unavailable");
  assert.equal(protectedResult.message, "Workspace is read-only");
  assert.equal(forgedContext.status, "unavailable");
  assert.equal(forgedContext.message, "Host context is read-only");
  assert.equal(calls, 0);
});

test("UIActionExecutionService reserves action ids and prevents concurrent execution", async () => {
  const entered = deferred();
  const release = deferred();
  let calls = 0;
  const registry = new UIActionRegistry([
    {
      id: "download.start",
      label: "Download",
      tested: true,
      execute: async () => {
        calls += 1;
        entered.resolve();
        await release.promise;
        return { ok: true, downloadId: "download-1" };
      },
    },
  ]);
  let nextId = 0;
  const service = new UIActionExecutionService({
    registry,
    createId: () => `request-${++nextId}`,
  });

  const firstPromise = service.execute("download.start");
  await entered.promise;
  const state = await service.getActionState("download.start");
  assert.equal(state.status, "loading");
  assert.equal(state.canExecute, false);

  const duplicate = await service.execute("download.start");
  assert.equal(duplicate.ok, false);
  assert.equal(duplicate.status, "loading");
  assert.equal(duplicate.errorCode, "UI_ACTION_ALREADY_RUNNING");
  assert.equal(duplicate.activeRequestId, "request-1");
  assert.equal(calls, 1);

  release.resolve();
  const first = await firstPromise;
  assert.equal(first.ok, true);
  assert.equal(service.pendingCount, 0);
  assert.equal((await service.getActionState("download.start")).status, "ready");
});

test("UIActionExecutionService scopes concurrency to the trusted window or workspace", async () => {
  const enteredA = deferred();
  const enteredB = deferred();
  const releaseA = deferred();
  const releaseB = deferred();
  const registry = new UIActionRegistry([
    {
      id: "workspace.refresh",
      label: "Refresh workspace",
      execute: async ({ context }) => {
        if (context.workspaceId === "a") {
          enteredA.resolve();
          await releaseA.promise;
        } else {
          enteredB.resolve();
          await releaseB.promise;
        }
        return { ok: true };
      },
    },
  ]);
  const service = new UIActionExecutionService({ registry });

  const firstA = service.execute("workspace.refresh", { workspaceId: "a" });
  const firstB = service.execute("workspace.refresh", { workspaceId: "b" });
  await Promise.all([enteredA.promise, enteredB.promise]);
  assert.equal(service.pendingCount, 2);
  assert.equal(
    (await service.execute("workspace.refresh", { workspaceId: "a" })).status,
    "loading",
  );

  releaseA.resolve();
  releaseB.resolve();
  assert.equal((await firstA).ok, true);
  assert.equal((await firstB).ok, true);
});

test("UIActionExecutionService state lookup accepts input for custom concurrency keys", async () => {
  const entered = deferred();
  const release = deferred();
  const registry = new UIActionRegistry([
    {
      id: "target.refresh",
      label: "Refresh target",
      concurrencyKey: ({ input }) => input?.targetId,
      execute: async () => {
        entered.resolve();
        await release.promise;
        return { ok: true };
      },
    },
  ]);
  const service = new UIActionExecutionService({ registry });
  const running = service.execute({
    actionId: "target.refresh",
    input: { targetId: "target-a" },
  });
  await entered.promise;

  assert.equal(
    service.isExecuting("target.refresh", {}, { targetId: "target-a" }),
    true,
  );
  assert.equal(
    (await service.getActionState("target.refresh", {}, { targetId: "target-a" }))
      .status,
    "loading",
  );
  assert.equal(
    (await service.getActionState("target.refresh", {}, { targetId: "target-b" }))
      .status,
    "ready",
  );

  release.resolve();
  assert.equal((await running).ok, true);
});

test("UIActionExecutionService maps real failures to transport-safe results", async () => {
  const registry = new UIActionRegistry([
    {
      id: "zoho.sync",
      label: "Sync Zoho",
      execute: async () => {
        const error = new Error("Authorization: Bearer raw-token-value");
        error.code = "ZOHO_TOKEN_EXPIRED";
        error.stack = "secret stack";
        error.details = {
          accessToken: "raw-token-value",
          nested: { cookie: "session=raw" },
        };
        throw error;
      },
      errorMapping: {
        ZOHO_TOKEN_EXPIRED: {
          errorCode: "CONNECTOR_REAUTH_REQUIRED",
          message: "Reconnect Zoho and retry",
          retryable: true,
          actionStatus: "requiresConfiguration",
          details: {
            accessToken: "raw-token-value",
            nested: { cookie: "session=raw" },
          },
        },
      },
    },
  ]);
  const service = new UIActionExecutionService({ registry });
  const result = await service.execute("zoho.sync");

  assert.equal(result.ok, false);
  assert.equal(result.status, "failure");
  assert.equal(result.errorCode, "CONNECTOR_REAUTH_REQUIRED");
  assert.equal(result.message, "Reconnect Zoho and retry");
  assert.equal(result.retryable, true);
  assert.equal(result.actionStatus, "requiresConfiguration");
  assert.deepEqual(result.details, {
    accessToken: "[REDACTED]",
    nested: { cookie: "[REDACTED]" },
  });
  assert.equal(JSON.stringify(result).includes("secret stack"), false);
});

test("UIActionAuditService scopes critical controls without flagging native close/form buttons", async () => {
  const report = await UIActionAuditService.auditSources({
    htmlSources: {
      "renderer/index.html": `
        <button id="closeDialog" data-close-modal aria-label="关闭">×</button>
        <button id="nativeSubmit" type="submit">Submit</button>
        <button id="saveImportant">Save</button>
      `,
    },
    jsSources: {
      "renderer/app.js": `
        document.getElementById("saveImportant").addEventListener("click", () => {
          persistSettings();
        });
      `,
    },
    criticalControlScope: {
      includeAll: true,
      ids: ["saveImportant"],
      includeMarked: true,
      ignoreNativeCloseControls: true,
      ignoreNativeFormControls: true,
    },
  });

  assert.equal(report.summary.controlsScanned, 3);
  assert.equal(report.summary.criticalControlsAudited, 1);
  assert.deepEqual(
    report.findings.filter((finding) => finding.ruleId === "missing-action-id").map(
      (finding) => finding.controlId,
    ),
    ["saveImportant"],
  );
  assert.equal(
    report.findings.some((finding) => finding.controlId === "closeDialog"),
    false,
  );
  assert.equal(
    report.findings.some((finding) => finding.controlId === "nativeSubmit"),
    false,
  );
});

test("UIActionAuditService finds fake handlers, placeholder URLs, duplicate ids, and disabled reasons", async () => {
  const report = await UIActionAuditService.auditSources({
    htmlSources: {
      "renderer/index.html": `
        <button id="empty" data-action-id="settings.save" onclick="" disabled>Save</button>
        <a id="logging" data-action-id="site.open" href="#">Open</a>
        <a id="voidLink" data-action-id="site.danger" href="javascript:void(0)">Danger</a>
        <button id="duplicate" data-action-id="settings.save" onclick="doSave()">Save again</button>
      `,
    },
    jsSources: {
      "renderer/app.js": `
        document.getElementById("logging").addEventListener("click", () => {
          console.log("placeholder");
        });
        document.getElementById("voidLink").onclick = () => {};
      `,
    },
  });
  const rules = new Set(report.findings.map((finding) => finding.ruleId));

  assert.equal(rules.has("empty-handler"), true);
  assert.equal(rules.has("console-only-handler"), true);
  assert.equal(rules.has("href-placeholder"), true);
  assert.equal(rules.has("javascript-url"), true);
  assert.equal(rules.has("duplicate-action-id"), true);
  assert.equal(rules.has("disabled-without-reason"), true);
});

test("UIActionAuditService checks preview presentation, tests, keyboard access, and scan boundary", async () => {
  const registry = new UIActionRegistry([
    {
      id: "timeline.preview",
      label: "Timeline preview",
      status: "preview",
      unavailableReason: "Preview only",
    },
    {
      id: "settings.save",
      label: "Save settings",
      execute: async () => ({ ok: true }),
      tested: true,
    },
  ]);
  const report = await new UIActionAuditService({
    registry,
    testedActionIds: ["settings.save"],
  }).auditSources({
    htmlSources: {
      "renderer/index.html": `
        <div id="previewAction" role="button" tabindex="0" data-action-id="timeline.preview" onclick="showPreview()">Preview</div>
        <button id="saveAction" data-action-id="settings.save" onclick="saveSettings()">Save</button>
      `,
    },
  });
  const previewRules = report.findings
    .filter((finding) => finding.actionId === "timeline.preview")
    .map((finding) => finding.ruleId);

  assert.equal(previewRules.includes("preview-marker-missing"), true);
  assert.equal(previewRules.includes("keyboard-inaccessible"), true);
  assert.equal(previewRules.includes("missing-test"), true);
  assert.equal(report.summary.previewActions, 1);
  assert.equal(report.summary.missingTests, 1);
  assert.equal(report.scope.rendererOwnedUiOnly, true);
  assert.equal(report.scope.externalWebContentsScanned, false);
  assert.match(report.scope.note, /WebContentsView/);
});

test("UIActionAuditService compares renderer/preload IPC uses with main handlers", async () => {
  const report = await UIActionAuditService.auditSources({
    preloadSources: {
      "electron/preload.cjs": `
        ipcRenderer.invoke("sites:save", payload);
        ipcRenderer.send("events:emit", payload);
        ipcRenderer.invoke("missing:handler", payload);
      `,
    },
    mainSources: {
      "electron/main.cjs": `
        ipcMain.handle("sites:save", async () => ({ ok: true }));
        ipcMain.on("events:emit", () => undefined);
      `,
    },
  });
  const invalid = report.findings.filter(
    (finding) => finding.ruleId === "invalid-ipc-channel",
  );

  assert.equal(invalid.length, 1);
  assert.match(invalid[0].message, /missing:handler/);
  assert.equal(report.summary.invalidIpcChannels, 1);
});

test("UIActionAuditService accepts explicit repeated-action and bound-action exceptions", async () => {
  const report = await UIActionAuditService.auditSources({
    htmlSources: {
      "renderer/index.html": `
        <button id="toolbarSave" data-action-id="settings.save">Save</button>
        <button id="menuSave" data-action-id="settings.save">Save</button>
      `,
    },
    boundActionIds: ["settings.save"],
    criticalControlScope: {
      includeMarked: true,
      allowRepeatedActionIds: ["settings.save"],
    },
  });

  assert.equal(
    report.findings.some((finding) => finding.ruleId === "duplicate-action-id"),
    false,
  );
  assert.equal(
    report.findings.some((finding) => finding.ruleId === "missing-handler"),
    false,
  );
});

test("UIActionAuditService does not treat an unrelated delegated listener as a binding", async () => {
  const report = await UIActionAuditService.auditSources({
    htmlSources: {
      "renderer/index.html": `
        <button id="unbound" data-action-id="site.unbound">Run</button>
      `,
    },
    jsSources: {
      "renderer/app.js": `
        document.addEventListener("click", (event) => {
          event.target.closest("[data-action-id]");
        });
        function unrelatedAction() {
          executeAction(actionId);
        }
      `,
    },
  });

  assert.equal(
    report.findings.some(
      (finding) =>
        finding.controlId === "unbound" && finding.ruleId === "missing-handler",
    ),
    true,
  );
});

test("UIActionAuditService inspects registered execute handlers without invoking them", async () => {
  let invoked = false;
  const console = {
    log: () => {
      invoked = true;
    },
  };
  const registry = new UIActionRegistry([
    {
      id: "feature.placeholder",
      label: "Placeholder",
      tested: true,
      execute: () => {
        console.log("placeholder");
      },
    },
  ]);
  const report = await new UIActionAuditService({ registry }).auditSources();

  assert.equal(invoked, false);
  assert.equal(
    report.findings.some(
      (finding) =>
        finding.actionId === "feature.placeholder" &&
        finding.ruleId === "console-only-handler",
    ),
    true,
  );
  assert.equal(
    report.findings.some(
      (finding) =>
        finding.actionId === "feature.placeholder" &&
        finding.ruleId === "missing-test",
    ),
    true,
  );
});
