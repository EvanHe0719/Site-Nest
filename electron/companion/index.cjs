const stateMachine = require("./state-machine.cjs");
const rightPanel = require("./right-panel-coordinator.cjs");

module.exports = { ...stateMachine, ...rightPanel };
