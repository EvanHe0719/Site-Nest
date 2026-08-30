# Zoho Desk 只读连接器

本文记录栖页 0.4.0 的真实实现边界。连接器只调用读取接口，不包含回复、备注、状态修改、关闭、删除、负责人修改或创建工单，也不创建 Gitee Issue。

## 配置与授权

设置页保存的普通配置只有：连接名称、Desk 组织 ID、区域 Desk API Base URL、网页入口、首次同步范围（15/30/90 天）和 SLA 提醒阈值（1–48 小时）。这些字段进入 `site-nest-data.json`，不包含凭据。

OAuth 客户端导入文件位于 Electron `userData/zoho-oauth-client.json`，也可由 `QIYE_ZOHO_OAUTH_CONFIG` 指向。文件应是 Zoho Desktop 客户端 JSON，至少包含：

```json
{
  "installed": {
    "client_id": "...",
    "client_secret": "...",
    "redirect_uris": ["http://127.0.0.1:53682/oauth/zoho/callback"],
    "accounts_base": "https://accounts.zoho.com"
  }
}
```

首次读取成功后，栖页先把完整客户端凭据写入 Electron `safeStorage` 加密的 `connector-secrets.json`，再原子重写导入文件，删除明文 `client_secret`，只保留公开客户端元数据和安全引用。系统安全存储不可用时拒绝导入。访问令牌和刷新令牌只存在于同一加密存储中，不进入渲染进程、普通状态 JSON、缓存或日志。断开连接会删除用户令牌并清除工单缓存；加密的 Desktop 客户端凭据保留，便于再次授权。

授权使用系统浏览器、精确的本机 HTTP 回调、随机 state 和 PKCE S256。申请范围固定为：

- `Desk.tickets.READ`
- `Desk.basic.READ`

`accounts_base` 只允许 Zoho 官方数据中心。Desk API Base URL 独立配置并校验为受支持的 Zoho HTTPS 地址；不会把 OAuth 返回的通用 `api_domain` 直接当作 Desk REST 根地址。

## 只读查询

当前实现调用：

- `GET /api/v1/myinfo`
- `GET /api/v1/tickets`
- `GET /api/v1/tickets/{ticketId}`
- `GET /api/v1/tickets/{ticketId}/threads`

列表按当前 Agent、有限时间范围和每页最多 50 条查询；首次最多处理 50 条候选工单。需要判断公开消息方向时，以最多 4 路并发读取每张候选工单最近 10 条线程。所有请求支持超时、AbortSignal、一次令牌刷新重试、限流和标准错误映射。

## 缓存与最小化

分诊结果写入单独的 `connector-cache.json`，默认 TTL 为 5 分钟。缓存只保留工单 ID/编号、标题、状态、优先级、显示名称、必要的时间、最新公开消息方向、SLA、网页地址和可解释的优先原因。它不保存完整正文、完整回复、附件、Cookie 或请求头。手动刷新会保留旧数据显示直至新请求完成；过期数据带 `stale` 标记。

## 指标

- 待我回复：分配给当前 Agent、未关闭、最新有效公开人工消息来自客户。私有备注和自动系统消息不算公开人工回复。
- 今日新增：工单创建时间属于当前设备本地日期当天，且列表已按当前 Agent 查询。
- 客户等待超过 24 小时：最新有效公开客户消息距现在超过 24 小时，之后没有公开人工支持回复，且工单未关闭。
- SLA 即将到期：仅基于 API 返回的官方响应/到期时间或逾期标志，剩余时间小于设置阈值。
- SLA 已超时：官方 SLA 截止时间已过或官方逾期标志成立，且工单未关闭。

缺少官方 SLA 字段时返回“当前连接未返回 SLA 数据”，不使用创建时间模拟。

## 现场启用条件

代码和测试不等于真实账号已联通。现场验证仍需要：Zoho Desktop OAuth 客户端、与回调完全一致的授权配置、正确的数据中心 Desk API Base URL、组织 ID，以及授权账号具备上述两个只读范围。未满足时正式界面只显示未配置或具体错误，不显示模拟工单与模拟数量。
