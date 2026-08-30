const actionCatalog = require("./action-catalog.cjs");
const registry = require("./registry.cjs");
const matcher = require("./matcher.cjs");
const permissionGuard = require("./permission-guard.cjs");
const pageContext = require("./page-context-adapter.cjs");
const logRedaction = require("./log-redaction.cjs");
const execution = require("./execution-service.cjs");
const genericPage = require("./builtins/generic-page.cjs");
const zohoDesk = require("./builtins/zoho-desk.cjs");

module.exports = {
  ...actionCatalog,
  ...registry,
  ...matcher,
  ...permissionGuard,
  ...pageContext,
  ...logRedaction,
  ...execution,
  ...genericPage,
  ...zohoDesk,
};
