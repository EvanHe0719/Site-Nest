# Customer Ops 只读连接器契约

## 审计结论

相邻 Customer Ops 项目存在面向其自身页面、受登录保护的内部接口，但没有发现可确认稳定、可供栖页跨应用调用的只读连接器 API。0.4.0 不读取其数据库、不依赖其表结构、不复用用户密码，也不把内部页面接口冒充正式集成。栖页已经注册 `customer-ops` 只读占位，右侧助手显示“Customer Ops 尚未配置接口”。

长期关联必须保存稳定 ID：

```text
Zoho Account ID <-> Customer Ops Customer ID
```

客户名称只可用于候选匹配，不能作为长期唯一键。

## 解析客户

`GET /customers/resolve?zohoAccountId=...&zohoContactId=...&customerName=...`

建议响应：

```json
{
  "matched": false,
  "multipleCandidates": true,
  "customerId": null,
  "candidates": [
    {
      "customerId": "stable-id",
      "displayName": "客户名称",
      "matchReason": "zohoAccountId"
    }
  ]
}
```

解析优先顺序为稳定 Account ID、稳定 Contact ID、最后才是人工确认的名称候选。多个候选不得自动绑定。

## 查询客户上下文

`GET /customers/{customerId}/context`

建议响应：

```json
{
  "customer": { "id": "stable-id", "name": "客户名称" },
  "systems": [{ "name": "SAP", "environment": "生产" }],
  "databases": [{ "type": "MSSQL", "connectionStatus": "unknown" }],
  "companies": [{ "name": "账套 A", "enabled": true }],
  "projects": [{ "id": "project-id", "name": "开发项目" }],
  "deployments": [{ "version": "1.2.3", "status": "deployed" }],
  "owners": [{ "role": "consultant", "displayName": "顾问" }]
}
```

上例只定义字段形状，不是实际客户数据。

## 语义约束

- `companies[].enabled` 仅表示账套启用状态。
- `databases[].connectionStatus` 才表示最近数据库连接检测结果。
- 两者必须分别展示；禁止把“启用”推断成“数据库连接正常”。
- `matched=false`、`multipleCandidates=true`、无接口、权限不足和无数据是不同状态。
- 人工绑定必须记录 Zoho Account ID、Customer Ops Customer ID、操作者和时间，支持解除绑定。

## 禁止返回或记录

- 数据库密码
- SAP 密码
- VPN 密码
- API Token
- 管理员密码
- 完整连接字符串中的凭据

连接器凭据只存 `ConnectorSecretStore`。主进程执行请求并向渲染进程返回最小字段；日志只记录连接器、操作、耗时、状态和脱敏错误。

## 正式接入前仍需确认

1. 由 Customer Ops 提供稳定、版本化、只读且可撤销授权的 API。
2. 明确服务认证方式、调用方身份、限流和审计要求。
3. 明确稳定客户 ID 与 Zoho Account ID 的绑定写入位置。
4. 明确系统、数据库、账套、项目、部署和负责人字段的真实语义。
