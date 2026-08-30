# Emma 知识库只读连接器契约

## 审计结论

当前仓库及相邻项目中没有找到能够确认属于“Emma”的稳定 HTTP API、IPC 或本地搜索服务。相邻 Zoho 插件中存在腾讯 IMA OpenAPI 调用，但“Emma”是否就是 IMA 尚未确认，且该插件的凭据和实现边界不属于栖页。因此 0.4.0 不复用其密钥、不直连其本地数据库，也不在正式界面生成模拟结果。

栖页已经在 `ConnectorRegistry` 注册只读 `emma` 定义，右侧工单助手显示“Emma 知识库连接器尚未配置”。后续实现应满足下述 `KnowledgeSearchConnector` 契约。

## 建议能力

- `healthCheck()`：检查服务版本、可用性和授权状态。
- `search(request, signal)`：关键词检索，支持取消、超时、topK 和来源过滤。
- `openResult(resultId)`：返回可信 URL 或由本机服务执行定位；栖页不拼接任意命令。

## HTTP 契约草案

`POST /search`

```json
{
  "query": "采购退货单位",
  "topK": 10,
  "filters": {
    "sourceTypes": ["sap_note", "sap_ticket", "internal"]
  }
}
```

```json
{
  "items": [
    {
      "id": "document-id",
      "title": "文档标题",
      "type": "sap_note",
      "snippet": "命中摘要",
      "score": 0.91,
      "source": "Emma",
      "url": "https://example.invalid/document-id",
      "updatedAt": "2026-08-30T00:00:00.000Z"
    }
  ]
}
```

上例只定义字段形状，不是正式界面数据，也不表示该地址或结果存在。

## 校验与隐私要求

- `query` 去除首尾空白后必须非空并限制长度。
- `topK` 建议限制为 1–20。
- `type` 采用允许列表；未知值保留为 `unknown`，不能猜测。
- `score` 只显示服务真实返回值；没有则为 `null`。
- `url` 必须是受信任 HTTPS 地址，或明确的本机定位对象；不得执行任意协议和脚本。
- 默认不把 Zoho 完整工单正文发送给 Emma。搜索标题、工单号或选中文字必须由用户主动触发，并在发送前显示范围。
- API Key/Token 只进入 `ConnectorSecretStore`；渲染进程只能调用查询 IPC。

## 正式接入前仍需确认

1. Emma 的产品身份及是否等同于现有 IMA 服务。
2. 官方/内部接口地址、认证方式、版本和健康检查。
3. 文档打开定位方式和允许域名。
4. 数据保留、客户信息上传和审计规则。
5. 错误码、限流、分页和结果字段的真实定义。
