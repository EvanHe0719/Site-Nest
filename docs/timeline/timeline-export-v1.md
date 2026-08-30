# 时间轴与 `timeline-export-v1`

时间轴位于“计划”页面内部，但与待办任务是两个独立模型。任务描述未来要做的事；时间轴只记录已经发生或仍在持续的重要经历。时间轴事件不会计入侧栏待办数量。

## 本地模型

- `timelineTracks`：内置 `work`（工作线）和 `personal`（个人线）。迁移会按稳定 ID 补齐，重复执行不会重复创建。
- `timelineEvents`：保存日、月或年精度的事件；删除使用 `deletedAt` 软删除。
- `timelineUiSettings`：保存年份、双轨/列表视图以及筛选条件。

渲染进程通过窄 IPC 按年份读取事件。未进入时间轴视图时不会渲染时间轴；全局搜索使用主进程的增量本地索引。

本轮不把时间轴加入 Google Drive 同步白名单。时间轴事件、筛选设置和轨道仍只保存在当前设备。

## 手动来源

- 已完成任务的“记录时间轴”只打开预填草稿，用户保存后才创建事件。
- 当前页面动作只读取页面标题、脱敏后的 HTTP(S) URL、域名和最多 1000 字选中文本。
- URL 会移除 `token`、`code`、`session`、`password`、`auth`、`access_token`、`refresh_token` 等认证参数。
- 不读取或保存完整网页正文。

## 导出格式

JSON 顶层固定为：

```json
{
  "exportVersion": "timeline-export-v1",
  "exportedAt": "ISO-8601",
  "appVersion": "0.5.5",
  "schemaVersion": 12,
  "year": 2026,
  "tracks": [],
  "events": []
}
```

每个事件的展示元数据只允许：

- `iconKey`
- `accentKey`
- `emphasis`

导出不包含可执行 JavaScript、HTML、系统命令、浏览会话、Cookie 或 OAuth 凭据。Markdown 与年度回顾都只整理用户已保存的字段，不调用 AI，也不补写推测内容。
