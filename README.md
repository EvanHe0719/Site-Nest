# 栖页

栖页是一个多空间、本地优先的 Windows 网页工作台。它把个人网站、工作系统、研究资源、Chrome 书签和受控网页动作放进同一个桌面窗口。数据默认只保存在本机；用户主动连接 Google 后，可以把经过白名单过滤的栖页数据同步到 Google Drive 应用专属空间。

## 当前已实现

- 个人、工作、研究三个系统空间；当前空间会在重启后恢复。
- 个人空间保留原聚合主页，工作空间提供真实 Zoho 数据驱动的工单分诊台，研究空间提供真实空状态和资源入口。
- 每个空间分别管理站点、固定项、排序和本地最近访问；Chrome 书签仍是全局书签库。
- 当前标签以“当前会话”跨空间展示并标明来源空间；左侧不再重复展示固定站点，固定数据和管理能力仍保留在“我的站点”、首页快捷访问与工作应用中。普通点击同一站点或规范化 URL 时定位已有会话，用户可显式新建第二个会话。
- 当前会话占据侧栏剩余高度并独立滚动，Google 与“设置与数据”始终位于底部。Chrome 书签管理已归入“设置与数据”，旧书签入口会定位到该模块。
- 顶部页签和左侧当前会话共用“复制页签、复制链接、外部打开、关闭”操作；右键未激活页签不会预先切换目标，副本插在源页签右侧并自动激活。
- 标签可点击“独立窗口”或向下拖出，也可合回原空间。拆出与合回移动同一个 `WebContentsView`，本次运行期间不会丢失页面 DOM、滚动、未提交表单和登录现场。
- 本次运行期间切换空间会恢复对应标签组、页面、历史和 DOM 状态；从未打开网页的空间显示空态，不会沿用上一个空间的网页。
- 站点支持普通站点/工作应用、栖页内打开/系统浏览器打开、所属空间、固定状态和助手绑定。
- 使用 Electron `WebContentsView` 直接显示网站，保留前进、后退、刷新、地址栏、缩放、登录入口和外部打开；安全 GET 新窗口自动进入当前空间标签组。
- 左侧导航可收纳为 72px 图标栏并记住偏好；浏览器不再显示“已连接/正在加载”信息条，切换空间提示约 1.4 秒后消失。
- 自动化中心包含签到任务、站点助手、工作流和执行记录；旧签到入口兼容到“签到任务”。
- 奶昔论坛自动签到保留原实现：复用栖页登录会话，验证页面和接口结果后才记录成功。
- 浏览器顶部星星打开当前页面动作；主进程只执行随应用注册的白名单动作，不下载或执行远程 JavaScript。
- 内置 Zoho Desk 只读连接器：安全 Desktop OAuth、当前 Agent、有限分页工单、最近公开线程、五项分诊指标、缓存、手动刷新和当前工单右侧上下文助手。
- 未配置的 Emma、B1 运维台、Gitee、Customer Ops 和回复草稿连接器明确显示“未配置/未关联”，不会模拟成功，也不会执行写入。
- Chrome 导入只读扫描本机 `Bookmarks` 与 `AccountBookmarks`，不会读取密码、历史、Cookie 或标签页。
- 左下角 Google 入口使用 Desktop OAuth，可手动同步或从云端恢复空间、站点、收藏书签和可迁移设置；这不是 Chrome 书签写回。

## 本地数据与迁移

应用状态保存在 Electron 的 Windows `userData` 目录中的 `site-nest-data.json`。

0.4.1 继续使用 schema v4；本轮只扩展会话浏览身份元数据并调整界面和兼容路由，不删除书签、站点或固定数据。v2/v3 升级时：

- 旧站点和固定项进入个人空间；原 ID、URL、书签、最近访问和奶昔状态保留。
- 旧站点补齐 `workspaceId: personal`、`siteKind: normal`、`openMode: internal`、`browserProfileId: default` 和空助手绑定。
- 第一次迁移前创建 `site-nest-data.v2.backup.json`；重复启动不会重复创建空间或复制站点。
- 写入使用同目录临时文件、同步和替换。JSON 损坏或迁移失败时保留原文件并写安全错误记录，不会回退后覆盖为默认数据。
- v4 扩展现有标签为会话字段，并增加界面设置、连接器连接、脱敏执行记录和外部对象关联；不会把固定站点批量转换成已打开会话。
- v3 首次升级也创建版本备份；连接器与界面默认项可重复归一化，不重复创建默认连接。

## 登录会话边界

所有既有网页和奶昔签到继续使用原持久分区 `persist:qiye-sites`，因此本轮升级不会主动迁移或清空已有 Cookie。

个人、工作、研究空间各自维护独立标签组，每个已加载标签使用自己的 `WebContentsView`，但所有视图仍使用同一个持久分区。也就是说，页面 URL、历史和页面状态按空间及标签分开，网站登录 Cookie 继续共享。

显式复制会创建新的 `WebContentsView` 并从源标签的当前网址重新加载，因此共享登录 Cookie，但不会克隆源页面尚未提交的表单、滚动位置或后退历史。普通打开仍执行自动去重。

应用重启后会恢复各空间的标签、站点和当前网址，但 Chromium 历史栈、未提交表单和滚动位置只在本次运行期间保留。独立窗口状态不跨重启，标签会合回原空间。当前网址会写入本机 JSON；含临时认证参数的网址也属于本地数据，请不要把数据文件分享给他人。

## Google 数据同步边界

Google 同步是可选功能。OAuth 客户端文件位于 Electron `userData` 目录的 `google-oauth-client.json`，不会打包进 EXE。访问与刷新令牌保存在 `google-oauth-token.json`，内容由 Windows 可用的 Electron `safeStorage` 加密；系统安全存储不可用时会拒绝保存令牌。

授权使用系统默认浏览器、`127.0.0.1` 随机回调端口、PKCE S256 和 state 校验，只申请 `drive.appdata`、邮箱和 OpenID 权限。Drive 中的固定文件名为 `qiye-sync-v1.json`，位于应用专属隐藏空间，不会出现在普通“我的云端硬盘”列表中。

同步白名单只包含空间、站点、收藏书签、浏览身份描述、助手开关和自动化时间设置。同步前会移除 URL 中的 OAuth、Token、Session 等参数；不会上传 Cookie、网站登录会话、浏览身份分区、当前标签页、最近访问、执行日志、页面正文或 OAuth 凭据。从云端恢复前会写入 `site-nest-data.before-google-sync.json` 本机备份。

Google Drive API 不能访问 Chrome Sync 的书签树。栖页中的收藏书签是导入副本；要真正回写 Chrome 账号书签，仍需要 Manifest V3 扩展通过 `chrome.bookmarks` 修改当前 Chrome 配置，再由 Chrome 按账号设置同步。

本轮只建立了 `BrowserProfile` 数据接口和默认适配器，尚未实现个人/工作 Cookie 的真实隔离。强行切换分区会让旧站点全部退出登录，因此要等后续提供显式迁移和提示后再做。NodeSeek/SAP 的会话修复仍是用户点击并确认后才执行的站点专项操作。

## 助手安全边界

- 助手 manifest 与动作目录随应用本地打包，不下载或运行远程 JavaScript。
- 渲染进程只能提交固定的助手 ID 和动作 ID；主进程会重新读取当前页面 URL/标题并检查匹配和权限。
- Zoho MVP 不读取工单正文，不上传客户数据，也不自动发送回复。
- 执行日志只保存时间、助手、动作、站点 hostname、状态和脱敏摘要；不保存完整 URL、Cookie、Authorization、Token、密码或页面正文。

## Zoho Desk 只读连接器

Zoho 公共配置在“设置与数据 → 连接与集成”填写。Desktop OAuth 导入文件放在 Electron `userData/zoho-oauth-client.json`；首次成功导入后，Client Secret 和后续 Token 只保存在 Electron `safeStorage` 加密的 `connector-secrets.json`，导入 JSON 中的明文密钥会被原子清除。连接器只申请 `Desk.tickets.READ` 和 `Desk.basic.READ`，不发送回复、不写备注、不改状态、不关闭或创建工单。

完整配置、指标、缓存和现场启用条件见 [Zoho Desk 只读连接器](docs/integrations/zoho-desk-readonly.md)。Emma 与 Customer Ops 的正式接入边界分别见 [Emma 契约](docs/integrations/emma-connector-contract.md) 和 [Customer Ops 契约](docs/integrations/customer-ops-connector-contract.md)。浏览器扩展后续架构见 [docs/browser-extension-architecture.md](docs/browser-extension-architecture.md)，仓库审计见 [docs/architecture-audit.md](docs/architecture-audit.md)。

## 开发、测试与打包

```powershell
npm install
npm run check
npm run test:unit
npm run test:integration
npm run dist:win
```

也可以执行 `npm test` 依次运行单元与 Electron 集成回归，执行 `npm run build` 构建 Windows x64 便携版。输出位于 `release/`。

仓库目前没有 ESLint 或 TypeScript，因此没有伪造的 lint/typecheck 命令；`npm run check` 是实际的 JavaScript 语法检查。

## 仍然存在的限制

- Google 未向普通桌面应用提供 Chrome Sync 书签的公开读写接口；当前仍是 `Chrome → 栖页` 单向导入。双向写回需要后续 Manifest V3 扩展使用 `chrome.bookmarks`。
- 直接关闭独立窗口会关闭对应标签；若要保留页面，请使用窗口内的“合回空间”。多个常驻标签会占用更多 Chromium 内存。
- 带 POST 正文的登录、支付或 SSO 弹窗不会被转换成普通 GET 标签，以免丢失认证参数；它们仍可能按网站原逻辑打开临时窗口。
- 奶昔自动签到只在栖页运行期间调度，程序完全退出后不会唤醒 Windows。
- NodeSeek、SAP、Zoho 等网站自身的防护、验证码、账号权限或页面改版仍可能阻止登录或动作；栖页不会绕过站点安全机制。
- Zoho 真实联机必须另行提供 Zoho Desktop OAuth 客户端、完全匹配的 loopback 回调、组织 ID 和正确区域 Desk API Base URL；缺少任一项时只显示未配置或错误，不使用测试 Fixture 填充正式界面。
- Emma 与 Customer Ops 尚无已确认的稳定接口，本轮只完成连接器注册、真实未配置状态和契约文档。
- Gitee 只读取已存在的 `ExternalObjectLink`；创建 Issue 仍由现有 Zoho Desk 插件负责。
