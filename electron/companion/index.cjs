const stateMachine = require("./state-machine.cjs");
const rightPanel = require("./right-panel-coordinator.cjs");
const quietPolicy = require("./quiet-policy.cjs");
const wellness = require("./wellness-engine.cjs");
const runtime = require("./runtime-service.cjs");
const weatherProvider = require("./open-meteo-provider.cjs");
const weather = require("./weather-service.cjs");
const contentGuard = require("./content-guard.cjs");
const pageSummary = require("./page-summary-extractor.cjs");
const ai = require("./ai-service.cjs");
const settings = require("./settings.cjs");
const pageWidget = require("./page-widget.cjs");

module.exports = { ...stateMachine, ...rightPanel, ...quietPolicy, ...wellness, ...runtime, ...weatherProvider, ...weather, ...contentGuard, ...pageSummary, ...ai, ...settings, ...pageWidget };
