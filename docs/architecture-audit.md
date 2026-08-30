# 栖页架构审计与增量改造记录

## 0.4.1 增量审计（2026-08-30）

- 侧栏、Chrome 书签、设置页、当前会话与顶部标签均由 `renderer/index.html`、`renderer/app.js` 和 `renderer/styles.css` 管理，没有组件框架或并行 Store。
- Chrome 书签读取、合并和导入元数据仍由主进程 `chrome:profiles` / `chrome:import` 与 schema v4 的 `bookmarks` / `importMeta` 提供；迁入设置不迁移或复制数据。
- 页签唯一运行时模型仍为主进程 `workspaceBrowserContexts[workspaceId].tabs` 与 `WebContentsView`。左侧和顶部均调用同一 `browser:duplicate-tab`，UI 不直接修改视图集合。
- 会话显式记录 `browserProfileId`；当前注册的唯一真实 Profile 仍映射 `persist:qiye-sites`。复制页签复用该身份并创建独立 WebContentsView，不清理 Cookie。
- 侧栏固定站点区域只是展示层；`sites.workspaceId`、`pinned`、`order` 及“我的站点”、首页、工作应用中的管理能力保留。
- 仓库仍无 ESLint 和 TypeScript 配置；实际质量命令是 `npm run check`、单元/集成测试和 Electron Builder 构建。

## 0.4.0 执行前审计（2026-08-30）

- 桌面端：Electron 44，Windows x64 便携版由 electron-builder 26.15.3 打包。
- 前端：原生 HTML/CSS/JavaScript，没有前端框架、路由库、独立状态管理库、TypeScript 或第二套图标库。
- 状态：主进程内存缓存配合 `site-nest-data.json`；写入使用同目录临时文件、同步并原子替换。
- 浏览：每个标签对应一个 `WebContentsView`。现有 `workspaceBrowserStates[workspaceId].tabs` 已经是浏览会话模型，本轮扩展而不是另建并行模型。
- Cookie/Session/Cache：内置网页继续共用 `persist:qiye-sites` 持久分区；浏览器登录状态由 Chromium 分区保存。本轮没有迁移、重命名或清理该分区。
- Google：系统浏览器 + loopback + PKCE 的 Desktop OAuth；令牌由 Electron `safeStorage` 加密。Google Drive appData 同步白名单不包含当前会话、Cookie、连接器凭据或工单缓存。
- IPC：`ipcMain.handle` 与 context-isolated preload 白名单。渲染进程只接收公开连接状态、工单摘要与上下文，不接收 Token、Client Secret、Cookie 或 Authorization Header。
- 安全存储：0.4.0 新增通用 `ConnectorSecretStore`，使用 Electron `safeStorage`；系统加密不可用时拒绝保存连接器凭据。
- 自动化/助手/页面动作：位于 `electron/assistants/`、主进程助手 IPC 和 `renderer` 页面动作抽屉。动作 ID 必须在本地 manifest 和目录中注册，不接受远程 JavaScript。
- 测试与构建：仓库提供 `check`、`test:unit`、`test:integration`、`test`、`dist:win` 和 `build`。仓库没有 ESLint 或 TypeScript，因此不能宣称执行不存在的 lint/typecheck。

### 0.4.0 最小改造方案

1. schema v4 只扩展现有标签为跨空间“当前会话”，不把固定站点迁移成会话。
2. 左侧跨空间显示当前会话，固定站点仍按当前空间过滤；普通打开复用规范化 URL，显式新建允许副本。
3. 工作首页只消费连接器返回的真实数据或真实空/错误状态，领域指标不写在 UI 中。
4. 连接器 Registry、Connection、Execution、SecretStore、Cache 与 IPC 位于主进程；Zoho 是本轮唯一真实查询实现。
5. Emma、Customer Ops、Gitee 和 B1 只注册只读契约/占位，避免错误耦合或重复现有 Zoho-to-Gitee 插件。
6. 继续复用 `persist:qiye-sites`，避免升级导致网站退出登录。

以下 0.2 内容保留为历史审计记录。

本文记录“多空间、本地优先的网页工作台”迭代开始前的仓库事实、风险和兼容策略。结论来自当前代码与本机数据的只读审计，不代表已经接入任何云端服务。

## 当前技术栈

- 桌面壳层：Electron 44，主窗口为 `BrowserWindow`。
- 网页承载：远程站点由单个 `WebContentsView` 显示，不使用 `iframe`。
- 前端：原生 HTML、CSS、JavaScript；没有框架、路由库、状态管理库或 TypeScript。
- 本地数据：Electron `userData` 目录中的 `site-nest-data.json`。迭代前 schema 为 `version: 2`。
- Chrome 书签：只读解析 Chrome 配置中的 `Bookmarks` 与 `AccountBookmarks`，合并后写入栖页自己的全局书签库。
- 登录会话：所有内置网页和奶昔签到窗口共用 `persist:qiye-sites` 持久分区。
- 自动签到：主进程中的隐藏 `BrowserWindow` 复用同一持久分区，验证页面状态后才提交奶昔签到请求。
- 构建：`electron-builder` 生成 Windows x64 便携 EXE。

## 迭代前数据事实

只读检查发现现有用户数据为 v2，包含 4 个站点、16 条 Chrome 书签、4 个固定站点和奶昔自动化状态；尚无 Workspace 字段。真实数据仅用于统计和之后的只读哈希比对，迁移验证必须在临时 `userData` 副本中完成。

## 主要风险

1. 旧版状态清洗函数会重建已知字段并丢弃未知字段。
2. 旧版读取逻辑把 JSON 损坏、迁移错误和文件不存在都回退为默认数据；随后保存可能覆盖原文件。
3. 旧版直接写目标 JSON，进程中断时存在半写文件风险。
4. 站点 URL 去重、排序和固定状态原本是全局语义，不能直接套用到多空间。
5. 当前只有一个真实浏览分区；把旧站点自动迁移到新分区会令所有现有网站退出登录。
6. `WebContentsView` 位于渲染页面上方，页面动作抽屉必须收窄原生 View，不能只用 HTML 覆盖。

## 最小改造方案

### 数据与迁移

- schema 升级到 v3，增加三个稳定 ID 的系统空间：`personal`、`work`、`research`。
- 旧站点默认迁移为 `workspaceId: personal`、`siteKind: normal`、`openMode: internal`、`browserProfileId: default`、`assistantIds: []`。
- Chrome 书签保持全局；书签被添加为站点时才选择目标空间。
- 迁移必须幂等。首次把 v2 持久化为 v3 前，保留独立 v2 备份。
- 写入采用同目录临时文件加替换；解析或迁移失败时抛错并禁止覆盖原文件。
- URL 去重、站点顺序、固定站点和最近访问都按空间计算。

### 会话兼容

- 所有既有站点继续使用 `browserProfileId: default`，其适配器仍映射到原分区 `persist:qiye-sites`。
- 本轮只建立 BrowserProfile 数据接口，不宣称个人/工作 Cookie 已真实隔离。
- 不主动迁移、清除或重命名旧分区；SAP/NodeSeek 的显式修复动作仍只在用户点击时执行。

### 自动化与助手

- 保留原 `automations` 路由和奶昔 IPC，把界面归入自动化中心的“签到任务”。
- 助手 manifest 随应用本地打包，渲染进程只提交固定的助手 ID 和动作 ID。
- 主进程重新获取当前页面上下文、检查启用状态与最小权限，再执行白名单动作。
- 不允许远程脚本，不读取页面正文，不记录完整 URL、Cookie、令牌、密码或请求头。
- 未配置的连接器明确标记为未配置，不产生成功日志。

## 验证策略

- 用 Node 内置 `node:test` 覆盖迁移幂等性、空间隔离、站点 CRUD、Zoho 严格匹配、工单号提取、权限检查和日志脱敏。
- Electron 集成回归一律使用临时 `QIYE_TEST_USER_DATA`；验证 v2 副本迁移、空间重启持久化、旧路由和关键页面。
- 分别做 1480×920 与 1060×700 截图检查，再运行 Windows 便携版构建。
- 仓库没有 ESLint 和 TypeScript，因此不能把语法检查冒充 lint/typecheck；最终报告分别列出实际存在和执行的命令。
