const { CONNECTOR_DEFINITIONS } = require("./definitions.cjs");

class ConnectorRegistry {
  constructor(definitions = CONNECTOR_DEFINITIONS) {
    this.definitions = new Map();
    for (const definition of definitions) this.register(definition);
  }

  register(definition) {
    if (!definition?.id || !definition?.type) {
      throw new TypeError("Connector definition requires id and type");
    }
    if (this.definitions.has(definition.id)) {
      throw new Error(`Connector already registered: ${definition.id}`);
    }
    this.definitions.set(definition.id, Object.freeze({ ...definition }));
    return this;
  }

  get(id) {
    return this.definitions.get(String(id || "")) || null;
  }

  list() {
    return Array.from(this.definitions.values()).map((item) => ({ ...item }));
  }
}

module.exports = { ConnectorRegistry };
