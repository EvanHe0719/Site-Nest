# 栖页界面动作审计 v1

## 边界

- `UIActionRegistry` 保存栖页自身关键动作的稳定 `actionId`、名称、状态和执行入口。
- `UIActionExecutionService` 统一 loading、并发去重、错误映射和真实结果校验。
- `UIActionAuditService` 静态检查栖页 renderer、preload 与 main 的动作和 IPC 绑定。
- 审计不会读取、扫描、点击或注入任何外部 `WebContentsView` 页面。

## 开发入口

设置与数据 → 开发与诊断 → 界面动作审计。

命令行可运行：

```powershell
npm.cmd run audit:ui-actions
```

严格审计覆盖已标记的关键按钮、表单和菜单入口，检查缺失处理器、无效 IPC、缺少测试、键盘不可达、占位链接、假成功、无原因禁用和重复动作 ID。

## 执行约束

动作目录中的 `execute` 只接受可信界面上下文提供的 `dispatch`。脱离已绑定栖页控件的直接调用会返回 `UI_ACTION_RENDERER_DISPATCH_REQUIRED`，不会伪造成功。异步动作由执行服务按动作和可信窗口/空间键防止重复运行。

当前 57 个关键动作覆盖站点、会话、页签、页签组、搜索、任务、习惯、时间线、内容标签、Google、Zoho、下载、打印、通知、翻译、自动化、网页脚本和设置。后续新增关键控件时必须同时更新动作目录、`data-action-id` 和测试；未完成能力必须标记为 preview，或禁用并填写原因。
