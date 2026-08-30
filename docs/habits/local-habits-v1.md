# 本地习惯、坚持星与使用轨迹 v1

## 数据边界

- `habits` 保存长期目标定义，不创建任何正式示例数据。
- `habitCheckIns` 以 `habitId + localDate` 作为有效唯一键；`localDate` 始终是本地日历日期，不转换为 UTC 日期。
- `rewardLedger` 保存可追溯的坚持星记录。总星数由未撤销记录聚合，不直接维护可漂移的计数器。
- `usageDayAggregates` 只保存日期、前台有效秒数、有效操作次数、会话次数和首末活动时间。
- 不记录输入文字、按键内容、网页正文、密码、Token 或 Cookie。

## 坚持星

- `completed` 在计划日获得一颗星。
- `partial` 默认不获得；只有目标显式启用 `partialRewardEnabled` 时获得。
- `skipped` 不获得。
- 同一目标同一天最多一颗星。
- 删除或改动打卡会同步撤销或迁移 Ledger；暂停、完成、归档和软删除目标都不会清除历史星。

## 连续记录

- `daily`、`weekdays` 和 `customWeekdays` 以计划日计算连续天数，非计划日不打断。
- `weeklyTarget` 以周一为周起点，显示连续达标周数，不伪装成连续天数。

## 使用轨迹

- 仅窗口可见、位于前台、未最小化、系统未长时间空闲且不是后台自动化时累计。
- 每 15 秒检查运行资格，脏数据最多每 60 秒批量落盘；失焦或隐藏时主动刷新。
- 用户关闭统计后不再累计；清除统计不会影响习惯、任务或坚持星。

## 提醒

- 习惯提醒复用 `TaskReminderScheduler` 和 `DesktopNotificationService`。
- 系统只有一个任务/习惯提醒计时器。
- 通知支持打开习惯、今日完成、延后 10 分钟和今日跳过。
