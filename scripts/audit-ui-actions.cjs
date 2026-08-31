#!/usr/bin/env node

const path = require("node:path");
const {
  UIActionAuditService,
  UI_ACTION_IDS,
  createUIActionRegistry,
} = require("../electron/ui-actions/index.cjs");

const DEFAULT_CRITICAL_CONTROL_IDS = Object.freeze([
  "backButton",
  "forwardButton",
  "reloadButton",
  "addressForm",
  "reattachButton",
  "siteFormSubmitButton",
  "confirmImportButton",
  "settingsImportButton",
  "pageImportButton",
  "clearImportedBookmarks",
  "saveZohoConfig",
  "connectZohoButton",
  "disconnectZohoButton",
  "saveTaskSettingsButton",
  "saveBrowserMemorySettings",
  "testTranslationButton",
  "clearTranslationKeyButton",
  "runNaixiAutomation",
  "importUserScriptFile",
  "openRemoteUserScript",
  "openPastedUserScript",
  "confirmUserScriptInstall",
  "scanPageResources",
  "detectNetworkResources",
  "deleteTaskButton",
  "deleteTimelineEventButton",
  "deleteHabitButton",
  "deleteHabitCheckInButton",
]);

function parseCommaList(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseArguments(argv) {
  const options = {
    json: false,
    strict: false,
    includeAll: false,
    criticalIds: [...DEFAULT_CRITICAL_CONTROL_IDS],
    allowRepeatedActionIds: [],
  };
  for (const argument of argv) {
    if (argument === "--json") options.json = true;
    else if (argument === "--strict") options.strict = true;
    else if (argument === "--all-controls") options.includeAll = true;
    else if (argument === "--help" || argument === "-h") options.help = true;
    else if (argument.startsWith("--critical=")) {
      options.criticalIds = parseCommaList(argument.slice("--critical=".length));
    } else if (argument.startsWith("--allow-repeat=")) {
      options.allowRepeatedActionIds = parseCommaList(
        argument.slice("--allow-repeat=".length),
      );
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }
  return options;
}

function printHelp() {
  process.stdout.write(
    [
      "Usage: node scripts/audit-ui-actions.cjs [options]",
      "",
      "Options:",
      "  --json                 Print the complete JSON report",
      "  --strict               Exit non-zero when error findings exist",
      "  --all-controls         Treat every renderer control as critical",
      "  --critical=id1,id2     Replace the curated critical-control id list",
      "  --allow-repeat=a,b     Allow selected action ids on multiple controls",
      "",
      "The command audits renderer-owned source only. It never scans WebContentsView pages.",
      "",
    ].join("\n"),
  );
}

function printTextReport(report) {
  const summary = report.summary;
  const rows = [
    ["Total actions", summary.totalActions],
    ["Registered actions", summary.registeredActions],
    ["Executable actions", summary.executableActions],
    ["Requires configuration", summary.requiresConfiguration],
    ["Unavailable", summary.unavailableActions],
    ["Preview", summary.previewActions],
    ["Missing handlers", summary.missingHandlers],
    ["Invalid IPC", summary.invalidIpcChannels],
    ["Missing tests", summary.missingTests],
    ["Keyboard inaccessible", summary.keyboardInaccessible],
    ["Critical controls audited", summary.criticalControlsAudited],
    ["Errors", summary.errorCount],
    ["Warnings", summary.warningCount],
  ];
  process.stdout.write("UI action audit (renderer-owned UI only)\n");
  process.stdout.write("External WebContentsView scanned: no\n\n");
  process.stdout.write(
    `Registry coverage: ${report.scope.registryProvided ? "provided" : "not provided (static controls/IPC only)"}\n\n`,
  );
  for (const [label, value] of rows) {
    process.stdout.write(`${label.padEnd(28)} ${value}\n`);
  }
  if (!report.findings.length) {
    process.stdout.write("\nNo findings.\n");
    return;
  }
  process.stdout.write("\nFindings:\n");
  for (const finding of report.findings) {
    const location = finding.file
      ? `${finding.file}${finding.line ? `:${finding.line}` : ""}`
      : "<registry>";
    const identity = finding.actionId || finding.controlId;
    process.stdout.write(
      `- [${finding.severity}] ${finding.ruleId} ${location}${
        identity ? ` (${identity})` : ""
      }: ${finding.message}\n`,
    );
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  if (options.help) {
    printHelp();
    return;
  }
  const projectRoot = path.resolve(__dirname, "..");
  const audit = new UIActionAuditService({
    registry: createUIActionRegistry(),
    testedActionIds: UI_ACTION_IDS,
    criticalControlScope: {
      includeAll: options.includeAll,
      includeMarked: true,
      ids: options.criticalIds,
      allowRepeatedActionIds: options.allowRepeatedActionIds,
      ignoreNativeCloseControls: true,
      ignoreNativeFormControls: true,
    },
  });
  const report = await audit.auditProject({
    projectRoot,
    htmlFiles: ["renderer/index.html", "renderer/detached.html"],
    jsFiles: ["renderer/app.js", "renderer/detached.js"],
    preloadFiles: [
      "electron/preload.cjs",
      "electron/detached-preload.cjs",
      "electron/user-script-preload.cjs",
    ],
    mainFiles: ["electron/main.cjs"],
    boundActionIds: UI_ACTION_IDS,
  });
  if (options.json) process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  else printTextReport(report);
  if (options.strict && report.summary.errorCount > 0) process.exitCode = 1;
}

main().catch((error) => {
  process.stderr.write(`UI action audit failed: ${error?.message || error}\n`);
  process.exitCode = 1;
});
