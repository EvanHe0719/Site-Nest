# 页签分组与重复页签整理

本文记录当前开发迭代 Phase 3 的本地页签组织模型。功能只整理元数据，不合并网页 DOM、表单、导航历史或 JavaScript 运行状态。

## 数据边界

`TabGroup` 保存于本机状态文件，schemaVersion 为 12：

- `id`
- `workspaceId`
- `name`
- `colorKey`
- `iconKey`
- `collapsed`
- `sortOrder`
- `lastActiveSessionId`
- `createdAt`
- `updatedAt`
- `deletedAt`

每个浏览 Session 增加 `tabGroupId` 与 `groupSortOrder`。分组操作不会修改 Session ID、BrowserProfile、Partition、Cookie 或 WebContents。`collapsed` 只控制顶部页签栏和左侧当前会话的渲染，不等于休眠。

应用升级不创建默认分组；旧页签保持原顺序并使用 `tabGroupId = null`。分组被用户删除后采用软删除。异常重启从现有会话快照恢复分组字段；最近关闭页签使用同一状态文件中的有界 `recentlyClosedTabs` 历史（最多 50 条），不会建立第二套 Session Store。通过页签菜单或 `Ctrl/Cmd + Shift + T` 恢复时，原组仍存在则放回原组，原组已删除则恢复为未分组。恢复会重建已关闭的 WebContents，但继续使用原 BrowserProfile 与持久 Partition，因此不会清除站点 Cookie。

页签组和时间轴本轮不进入 Google Drive 快照白名单，仍为本机数据。

## 交互

顶部和左侧会话共用同一份 `tabGroups` 与 Session 数据：

- 创建、重命名、修改颜色和图标；
- 展开或折叠；
- 页签拖入分组、拖出分组和重新排序；
- 分组重新排序；
- 将一个组拖到另一个组并在确认后合并；
- 合并后可以撤销一次；
- 将组内页签全部移出、关闭组内页签或删除空组；
- 恢复最近关闭的单个页签并保留仍有效的原分组；
- 通过 Ctrl/Cmd + K 搜索组名并激活最近使用页签。

同一工作空间的组可以直接合并。跨工作空间合并会被拒绝，不会静默改变 Session 的工作空间。

## 站点家族建议

`SiteFamilyRegistry` 只生成候选，不移动页签。当前规则包括：

- 完全相同 hostname；
- SAP：`support.sap.com`、`me.sap.com`、`accounts.sap.com`、`universalid.sap.com`；
- Zoho：不同数据中心的 `desk.zoho.*` 与 `accounts.zoho.*`。

用户确认创建分组后才更新 Session 元数据，不硬编码组织 ID。

## 重复页签判断

`DuplicateTabDetector` 区分两类结果：

1. 完全重复：规范化 URL 相同，可以由用户选择保留项；
2. 同站点相似：hostname 相同但 URL 不同，只提示，不提供批量关闭。

URL 规范化只处理协议/hostname 大小写、默认端口、无意义尾部斜杠和已知跟踪参数。业务查询参数与可能有意义的 hash 必须保留。

整理弹窗默认建议保留当前活动页签，否则保留最后使用时间最新的页签。只有用户提交弹窗后才逐个关闭完全重复项，不存在后台自动关闭。

## 关闭保护

关闭重复项或整组页签前，主进程逐个检查：

- 页面正在加载或登录；
- 活跃下载；
- 已选择的上传文件；
- 音频播放；
- 独立窗口；
- 用户标记“保持运行”；
- `beforeunload` 离开确认；
- 可见的 Zoho 回复草稿。

无法可靠确认安全时停止批量关闭，并把脱敏原因返回界面。检查和关闭都在主进程执行，渲染进程不能绕过 URL 精确匹配或保护结果。

## 验证重点

单元测试覆盖迁移、增删改、排序、站点家族、URL 规范化、精确/相似重复项、最近关闭恢复、软删除和一次撤销。渲染测试覆盖顶部与左侧一致、拖入/拖出、折叠、合并、全局搜索。真实 Electron 探针比较分组和合并前后的 Session、WebContents ID、BrowserProfile 与 Partition，关闭后验证原组、BrowserProfile 与 Partition 的恢复，并验证 `beforeunload` 会阻止重复页签关闭。
