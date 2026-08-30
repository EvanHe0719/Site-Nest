const { ConnectorError, publicConnectorError } = require("./errors.cjs");

class ConnectorConnectionService {
  constructor(options = {}) {
    this.registry = options.registry;
    this.handlers = new Map();
  }

  register(connectorType, handler) {
    if (!this.registry?.get(connectorType)) {
      throw new Error(`Unknown connector type: ${connectorType}`);
    }
    this.handlers.set(connectorType, handler);
    return this;
  }

  handler(connectorType) {
    const definition = this.registry?.get(connectorType);
    if (!definition) throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "未知连接器");
    const handler = this.handlers.get(connectorType);
    if (!handler) {
      throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", `${definition.name} 尚未配置接口`);
    }
    return handler;
  }

  async getStatus(connectorType) {
    const definition = this.registry?.get(connectorType);
    if (!definition) throw new ConnectorError("CONNECTOR_NOT_CONFIGURED", "未知连接器");
    const handler = this.handlers.get(connectorType);
    if (!handler) {
      return {
        connectorType,
        status: "not-configured",
        configured: false,
        implemented: false,
        message: `${definition.name} 尚未配置接口`,
      };
    }
    return handler.getStatus();
  }

  async connect(connectorType) {
    return this.handler(connectorType).connect();
  }

  async disconnect(connectorType) {
    return this.handler(connectorType).disconnect();
  }

  async configure(connectorType, publicConfig) {
    return this.handler(connectorType).configure(publicConfig);
  }

  async refreshAuthentication(connectorType) {
    return this.handler(connectorType).refreshAuthentication();
  }

  async safeCall(callback) {
    try {
      return { ok: true, value: await callback() };
    } catch (error) {
      return { ok: false, error: publicConnectorError(error) };
    }
  }
}

module.exports = { ConnectorConnectionService };
