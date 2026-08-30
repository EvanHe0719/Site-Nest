# 独立波形时间轴与 `timeline-export-v1`

时间轴位于“计划”页面内部，但与待办任务是两个独立模型。任务描述未来要做的事；时间轴只记录已经发生或仍在持续的重要经历。时间轴事件不会计入侧栏待办数量。

## 本地模型

- `timelineTracks`：内置 `work`（工作）和 `personal`（个人），迁移会按稳定 ID 幂等补齐。
- `timelineEvents`：保存日、月或年精度的事件；删除使用 `deletedAt` 软删除。schema v13 新增 `impactDirection`、`impactLevel` 和 `tagIds`，旧事件分别迁移为 `neutral`、`1` 和空数组。
- `timelineUiSettings`：保存当前轨道，以及每条轨道各自的年份、月份、年度/月度范围和缩放级别。

工作与个人永远独立查询和绘制，不提供混合曲线。正向、平稳、负向及 1–5 级幅度完全来自用户输入，不根据标题推断，也不调用 AI。单次事件形成回归基准线的脉冲；有结束日期或持续至今的事件形成确定的平台区间。

渲染进程通过窄 IPC 按轨道和年份读取事件。未进入时间轴视图时不会渲染 SVG；全局搜索使用主进程的增量本地索引，并在打开结果时切换到正确轨道和年份。

时间轴仍不加入 Google Drive 同步白名单，数据只保存在当前设备。

## 手动来源

- 已完成任务的“记录时间轴”只打开预填草稿，用户保存后才创建事件。
- 当前页面动作只读取页面标题、脱敏后的 HTTP(S) URL、域名和最多 1000 字选中文本。
- URL 会移除 `token`、`code`、`session`、`password`、`auth`、`access_token`、`refresh_token` 等认证参数。
- 不读取或保存完整网页正文。

## 导出

支持 JSON、Markdown 和惰性生成的纯 SVG。JSON 顶层固定包含：

```json
{
  "exportVersion": "timeline-export-v1",
  "exportedAt": "ISO-8601",
  "appVersion": "0.5.5",
  "schemaVersion": 13,
  "track": { "id": "work", "name": "工作线" },
  "year": 2026,
  "events": []
}
```

事件包含 `eventType`、`impactDirection`、`impactLevel` 和用户保存的事实字段。展示元数据只允许 `iconKey`、`accentKey`、`emphasis`。导出不包含可执行 JavaScript、HTML、系统命令、浏览会话、Cookie 或 OAuth 凭据。
