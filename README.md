# 栖页

栖页是一个多空间、本地优先的 Windows 网页工作台。它把个人网站、工作系统、研究资源、Chrome 书签和受控网页动作放进同一个桌面窗口。数据默认只保存在本机；用户主动连接 Google 后，可以把经过白名单过滤的栖页数据同步到 Google Drive 应用专属空间。

## 当前已实现

- 个人、工作、研究三个系统空间；当前空间会在重启后恢复。
- 顶部、三个聚合主页和空浏览页均可直接输入网址或关键词；临时页面只进入当前会话，不会自动添加站点、固定或写回 Chrome 书签。`Ctrl/Cmd + K` 可搜索当前会话、我的站点、Chrome 书签和本地任务，并始终保留互联网搜索入口。
- 默认搜索引擎可在 Google、Bing、百度和 DuckDuckGo 间切换；搜索面板允许只对本次搜索临时换引擎。搜索历史最多保留 100 条且仅存本机，敏感认证参数会被移除或拒绝记录。
- 个人空间保留原聚合主页，工作空间提供真实 Zoho 数据驱动的工单分诊台，研究空间提供真实空状态和资源入口。
- 每个空间分别管理站点、固定项、排序和本地最近访问；Chrome 书签仍是全局书签库。
- 当前标签以“当前会话”跨空间展示并标明来源空间；左侧不再重复展示固定站点，固定数据和管理能力仍保留在“我的站点”、首页快捷访问与工作应用中。普通点击同一站点或规范化 URL 时定位已有会话，用户可显式新建第二个会话。
- 当前会话占据侧栏剩余高度并独立滚动，Google 与“设置与数据”始终位于底部。Chrome 书签管理已归入“设置与数据”，旧书签入口会定位到该模块。
- 顶部页签和左侧当前会话共用“复制页签、复制链接、外部打开、关闭”操作；右键未激活页签不会预先切换目标，副本插在源页签右侧并自动激活。
- 标签可点击“独立窗口”或向下拖出，也可合回原空间。拆出与合回移动同一个 `WebContentsView`，本次运行期间不会丢失页面 DOM、滚动、未提交表单和登录现场。
- 本次运行期间切换空间会恢复对应标签组、页面、历史和 DOM 状态；从未打开网页的空间显示空态，不会沿用上一个空间的网页。
- 站点支持普通站点/工作应用、栖页内打开/系统浏览器打开、所属空间、固定状态和助手绑定。
- 使用 Electron `WebContentsView` 直接显示网站，保留前进、后退、刷新、地址栏、缩放、登录入口和外部打开；安全 GET 新窗口自动进入当前空间标签组。
- 网页右键菜单由 Electron 主进程按选择、编辑区、链接和媒体上下文动态生成；地址栏支持搜索与“粘贴并转到”，脚本协议不会执行。
- 页面动作可扫描当前页显式下载、常见直链、图片、视频和音频；高级网络检测必须手动开启且最长 60 秒，只保留 URL、MIME 和大小，不读取请求头、Cookie 或响应正文，也不处理 DRM/加密播放列表。
- 划词翻译支持右键和可关闭的选区旁“译”按钮；整页翻译支持双语、仅译文、恢复原文、动态 DOM 与同源 iframe。未配置正式 Provider 时明确不可用，不使用免费非官方接口或假译文。
- 翻译 Provider 当前支持 OpenAI-compatible API；API Key 与连接器凭据共用 Electron `safeStorage` 加密文件，正文和译文只在本次运行内存与当前网页 DOM 中短暂存在。
- 本地“计划”支持周视图、月视图、全部任务与已完成任务；任务可归属个人/工作/研究空间，并设置状态、优先级、截止时间、标签及本地提醒。提醒、托盘驻留和随系统启动均为用户显式开启，默认不改变原关闭行为。
- OAuth、SSO 和 POST 登录窗口使用受控窗口，继承原浏览身份、Cookie 与 opener；站点级策略可在“设置与数据 → 新窗口与登录弹窗”中调整。
- SAP Support、SAP for Me 与 SAP ID 使用独立的持久浏览身份，避免共享 Cookie 污染登录跳转；若仍检测到认证状态损坏，会显示“修复 SAP 登录”，用户确认后只清理该 SAP 身份并重新打开原搜索或 Note 目标，不影响外部 Chrome 与非 SAP 网站。
- 左侧导航可收纳为 72px 图标栏并记住偏好；浏览器不再显示“已连接/正在加载”信息条，切换空间提示约 1.4 秒后消失。
- 自动化中心包含签到任务、站点助手、工作流和执行记录；旧签到入口兼容到“签到任务”。
- 奶昔论坛自动签到保留原实现：复用栖页登录会话，验证页面和接口结果后才记录成功。
- 浏览器顶部星星打开当前页面动作；主进程只执行随应用注册的白名单动作，不下载或执行远程 JavaScript。
- 自动化中心支持受控用户脚本：安装与更新前显示域名、权限、Hash 和差异，脚本在隔离世界运行，只开放第一批白名单 GM API；普通登录页默认阻止第三方脚本，按脚本/域名完成高级风险确认后才可放行，OAuth/SAML 回调、支付和密码页仍禁止。内置“恢复复制与选择”默认停用并按网站授权。
- 网页视图支持省内存、标准和高性能三档生命周期管理；后台页签可以休眠并在选择时恢复，播放、下载、上传、登录弹窗、未发送 Zoho 草稿和“保持运行”页签不会自动休眠。
- 内置 Zoho Desk 只读连接器：安全 Desktop OAuth、当前 Agent、有限分页工单、最近公开线程、五项分诊指标、缓存、手动刷新和当前工单右侧上下文助手。
- 未配置的 Emma、B1 运维台、Gitee、Customer Ops 和回复草稿连接器明确显示“未配置/未关联”，不会模拟成功，也不会执行写入。
- Chrome 导入只读扫描本机 `Bookmarks` 与 `AccountBookmarks`，不会读取密码、历史、Cookie 或标签页。
- 左下角 Google 入口将账号身份与 Drive 授权分开显示；Desktop OAuth 使用同一账号申请最小 `drive.appdata` Scope，可同步站点、计划、设置、栖页搜索/浏览历史和用户脚本元数据；这不是 Chrome 书签或 Chrome 历史同步。
- “设置与数据”改为分类导航和当前分类独立滚动；只挂载当前分类，Zoho 详细表单在用户点击配置后才创建。设置搜索来自已实现的设置注册表，旧书签、Zoho、翻译、任务、内存和弹窗入口继续定位到新分类。

## 本地数据与迁移

应用状态保存在 Electron 的 Windows `userData` 目录中的 `site-nest-data.json`。

0.5.6 使用 schema v10；新增搜索偏好和本机搜索历史，不删除书签、站点、固定数据，也不清理浏览分区中的 Cookie。v2/v3/v4/v5/v6/v7/v8/v9 升级时：

- 旧站点和固定项进入个人空间；原 ID、URL、书签、最近访问和奶昔状态保留。
- 旧站点补齐 `workspaceId: personal`、`siteKind: normal`、`openMode: internal`、`browserProfileId: default` 和空助手绑定。
- 第一次迁移前创建 `site-nest-data.v2.backup.json`；重复启动不会重复创建空间或复制站点。
- 写入使用同目录临时文件、同步和替换。JSON 损坏或迁移失败时保留原文件并写安全错误记录，不会回退后覆盖为默认数据。
- v4 扩展现有标签为会话字段，并增加界面设置、连接器连接、脱敏执行记录和外部对象关联；不会把固定站点批量转换成已打开会话。
- v5 增加 `uiSettings.sitePopupPolicies`；缺失字段自动补齐且迁移可重复执行，不会更改原浏览分区。
- v6 增加 `uiSettings.translation`；只保存 Provider 公共地址、模型、语言与站点规则，API Key 仍只保存在系统安全存储。
- v7 增加 `localTasks`、`taskReminders`、`taskSettings` 与设备时区；固定站点和浏览会话不会被迁移成任务，旧版缺失字段可重复补齐。
- v8 增加用户脚本、批准权限、隔离存储与脱敏执行记录；只创建一个默认停用的内置“恢复复制与选择”脚本，不自动执行远程代码。
- v8 缺失的 `uiSettings.browserMemory` 会补齐为标准模式/15 分钟，页签 `keepRunning` 默认关闭；不创建新分区或清理浏览存储。
- v9 增加系统浏览身份 `sap-support`；现有 SAP Support、SAP for Me、SAP ID 和认证链页签会迁移到 `persist:qiye-sap-support`，非 SAP 页签继续使用原 `persist:qiye-sites`。原分区数据不会被删除。
- v10 增加 `uiSettings.search` 与 `searchHistory`；默认 Google、保存历史、100 条上限和最后设置分类。旧数据缺少字段时只补默认值，不重置 Google/Zoho OAuth、站点、书签、会话、BrowserProfile 或 Partition。
- v3 首次升级也创建版本备份；连接器与界面默认项可重复归一化，不重复创建默认连接。

## 登录会话边界

所有非 SAP 网页和奶昔签到继续使用原持久分区 `persist:qiye-sites`。SAP Support 登录链使用专用持久分区 `persist:qiye-sap-support`，因此首次升级后需要在栖页中重新登录一次 SAP；原共享分区的 Cookie 不会被迁移或清空。“修复 SAP 登录”会先暂停所有共享该 SAP 身份的网页和弹窗，再清空这个专用分区并只恢复当前目标；非 SAP 分区不受影响。0.5.4 还会为内嵌网页生成标准 ASCII Chrome User-Agent，避免 Electron 打包后的中文产品令牌触发 SAP HANA 请求校验。

浏览身份在创建页签时根据目标网址确定。通过站点入口、搜索结果或新建会话打开 SAP 会自动使用 SAP 专用身份；如果在一个已存在页签的地址栏里手动跨 SAP/非 SAP 域名导航，该页签会保留原浏览身份，不会在导航途中自动迁移 Cookie。

个人、工作、研究空间各自维护独立标签组，每个已加载标签使用自己的 `WebContentsView`。非 SAP 页面仍共享默认持久身份；SAP 页面跨空间共享 SAP 专用身份。页面 URL、历史和页面状态继续按空间及标签分开。

显式复制会创建新的 `WebContentsView` 并从源标签的当前网址重新加载，因此共享登录 Cookie，但不会克隆源页面尚未提交的表单、滚动位置或后退历史。普通打开仍执行自动去重。

应用重启后会恢复各空间的标签、站点和当前网址，但 Chromium 历史栈、未提交表单和滚动位置只在本次运行期间保留。独立窗口状态不跨重启，标签会合回原空间。当前网址会写入本机 JSON；含临时认证参数的网址也属于本地数据，请不要把数据文件分享给他人。

## Google 数据同步边界

Google 同步是可选功能。OAuth 客户端文件位于 Electron `userData` 目录的 `google-oauth-client.json`，不会打包进 EXE。访问与刷新令牌保存在 `google-oauth-token.json`，内容由 Windows 可用的 Electron `safeStorage` 加密；导入后的 Client Secret 也会加密并从默认导入 JSON 中清除。系统安全存储不可用时会拒绝保存凭据。

授权使用系统默认浏览器、`127.0.0.1` 随机回调端口、PKCE S256 和 state 校验，只申请 `openid`、`email`、`profile` 与 `drive.appdata`。已有基础登录 Token 不会被假定拥有 Drive 权限；缺少 Scope 时继续保留账号身份，并提示使用同一个账号重新授权。Drive 中的固定文件名为 `qiye-sync-v1.json`，位于应用专属隐藏空间，不会出现在普通“我的云端硬盘”列表中。

同步白名单包含空间、站点、收藏书签、计划、公开设置、栖页搜索/浏览历史、浏览身份描述、助手开关、自动化时间和用户脚本元数据。同步前会再次移除 URL 中的 OAuth、Token、Session 等参数；不会上传 Cookie、网站登录会话、浏览身份分区、当前标签页、执行日志、页面正文、表单输入、用户脚本授权/值或 OAuth 凭据。删除记录使用 30 天 Tombstone。双方都变更时不会静默覆盖，而是让用户选择智能合并、本地、云端或查看差异；覆盖或恢复前写入 `site-nest-data.before-google-sync.json` 本机快照。

完整 Google Cloud 配置、错误码和开发边界见 [Google Drive 同步配置](docs/integrations/google-drive-sync-setup.md)。

Google Drive API 不能访问 Chrome Sync 的书签树。栖页中的收藏书签是导入副本；要真正回写 Chrome 账号书签，仍需要 Manifest V3 扩展通过 `chrome.bookmarks` 修改当前 Chrome 配置，再由 Chrome 按账号设置同步。

本轮只对 SAP 登录链启用系统管理的独立身份；个人/工作空间仍不按空间隔离 Cookie，避免让既有站点集体退出登录。NodeSeek 会话重置和 SAP 身份清理仍只有用户点击并确认后才执行。

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
npm.cmd run dev
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build:code
```

`dev`、`lint`、`typecheck`、`test`、`check` 和 `build:code` 均不打包。`build` 是 `build:code` 的兼容别名。只有用户明确要求时才运行 `package:portable`（便携版）或 `package:win`（安装包）；`release` 属于正式发布流程。

`npm run lint` 会检查全部 JavaScript/CJS 语法及生产代码安全禁用项；`npm run typecheck` 使用 TypeScript `checkJs` 检查浏览器与翻译核心服务。这两项均为真实执行命令，不替代 Electron 集成测试。

## 仍然存在的限制

- Google 未向普通桌面应用提供 Chrome Sync 书签的公开读写接口；当前仍是 `Chrome → 栖页` 单向导入。双向写回需要后续 Manifest V3 扩展使用 `chrome.bookmarks`。
- 直接关闭独立窗口会关闭对应标签；若要保留页面，请使用窗口内的“合回空间”。休眠恢复不会保留已销毁页面的内存 DOM、滚动、历史栈或未提交普通表单，这类页面应使用“保持运行”。
- 带 POST 正文的登录、支付或 SSO 弹窗不会被转换成普通 GET 标签，以免丢失认证参数；它们仍可能按网站原逻辑打开临时窗口。
- 奶昔自动签到只在栖页运行期间调度，程序完全退出后不会唤醒 Windows。
- NodeSeek、SAP、Zoho 等网站自身的防护、验证码、账号权限或页面改版仍可能阻止登录或动作；栖页不会绕过站点安全机制。
- Zoho 真实联机必须另行提供 Zoho Desktop OAuth 客户端、完全匹配的 loopback 回调、组织 ID 和正确区域 Desk API Base URL；缺少任一项时只显示未配置或错误，不使用测试 Fixture 填充正式界面。
- Emma 与 Customer Ops 尚无已确认的稳定接口，本轮只完成连接器注册、真实未配置状态和契约文档。
- Gitee 只读取已存在的 `ExternalObjectLink`；创建 Issue 仍由现有 Zoho Desk 插件负责。
