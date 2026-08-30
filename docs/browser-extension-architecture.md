# 栖页浏览器扩展架构边界

## 目标与本轮范围

后续 Chrome 扩展计划使用 Manifest V3，让用户从浏览器把当前页面保存到栖页、加入指定空间、搜索或打开栖页，并在用户主动操作时展示通用页面动作和 Zoho Desk 工单入口。

本轮只建立桌面端的声明式站点助手协议和设计边界，不创建不可构建的空扩展项目，不注册 Native Messaging Host，不开放本地端口，也不改变现有网页会话。

扩展不是远程脚本载体。桌面端和扩展端都只能执行各自构建产物中注册的动作类型；不得下载 manifest 后直接执行 JavaScript，也不得接受用户粘贴任意脚本执行。

## Manifest V3 最小权限

初始扩展建议只声明：

- `activeTab`：用户点击扩展或菜单后，临时读取当前标签页必要上下文。
- `storage`：保存扩展自身设置、最近空间选择和授权状态。
- `sidePanel`：显示栖页页面动作面板。
- `contextMenus`：提供“保存到栖页”等明确的用户触发入口。

不得默认申请 `<all_urls>`。`activeTab` 只在用户手势后提供临时权限，不能用于后台持续观察所有网页。

如果未来需要在用户选择的 Zoho Desk 或内部系统上自动显示上下文，应使用 `optional_host_permissions`，解释用途并在运行时单独请求。用户拒绝后仍应保留不读取页面内容的基础能力。

如果未来采用 Native Messaging，还需要增加 `nativeMessaging` 权限。该权限应在通信功能真正可用时才加入，而不是提前申请。

## 计划功能

- 保存当前网页到栖页。
- 选择个人、工作、研究或后续自定义空间。
- 搜索栖页中的本地站点和书签。
- 打开栖页桌面端。
- 展示当前页面的通用快捷动作。
- 在明确匹配或用户显式绑定的 Zoho Desk 页面上展示工单上下文入口。

本阶段不包含 Zoho Desk API、Gitee API、AI API、自动回复、自动关闭工单或跨站点工作流。

## 桌面端通信方案评估

### Native Messaging（后续首选）

适合扩展与本地桌面能力之间的双向、受控消息传递。Chrome 只会启动操作系统中已注册且允许当前扩展 ID 的 Native Messaging Host，不需要监听网络端口。

未来实现时必须：

- 在 Windows 注册 Native Messaging Host manifest，并限制 `allowed_origins` 为正式扩展 ID。
- 使用独立、最小权限的本地桥接程序；桥接程序只接受版本化 JSON 协议和动作白名单。
- 桥接程序与 Electron 主进程之间使用受保护的本地 IPC，并验证调用方、消息大小和 schema。
- 不传输 Cookie、Authorization Header、密码、页面正文或完整客户工单内容。
- 安装、升级和卸载时正确维护 Host 注册。

当前栖页主要交付为便携 EXE，文件路径可能变化，而 Windows Native Messaging 注册需要稳定的 Host manifest 和可执行路径。因此本轮不进行表面接入；应在确定安装版或可靠注册流程后实施。

### 受保护的本地 IPC

Electron 桌面端可以使用命名管道等本地 IPC，但 Chrome 扩展不能直接连接该 IPC。它必须通过 Native Messaging Host 或等价的受信桥接层访问。

IPC 层应使用每次安装生成的本地凭据、限制当前 Windows 用户、校验消息 schema，并拒绝未注册 action。不能把 Renderer 传入的 URL、工单编号或权限声明当作可信数据。

### 自定义协议

自定义协议适合 `qiye://open` 一类单向启动和导航提示，不适合作为通用读写通道。

协议参数属于不可信输入，必须限制长度、验证 action、拒绝凭据和页面正文，并在敏感操作前要求桌面端用户确认。URL 会出现在系统和应用边界中，因此不得通过自定义协议传递 Token、Cookie 或客户数据。

### 本地 HTTP 服务

本地 HTTP 不是默认方案。若未来确有需要，只能绑定 `127.0.0.1`，使用随机高位端口和短期随机令牌，并校验 Origin、CSRF、消息 schema、请求大小和速率。令牌不得写入可被网页读取的位置。

禁止开放无认证固定端口，也不能把“只监听 localhost”当作身份认证；恶意网页同样可能向本机端口发起请求。

## 共享站点助手协议

桌面端和扩展未来共享的是协议与测试样例，不是同一个运行时：

- `AssistantManifest` 的 JSON 子集：`id/name/version/source/matchPatterns/permissions/actions`。
- `PageContext`：`url/title/hostname/pathname/selectedText/timestamp`。
- `ActionRequest`：只包含 `assistantId/actionId`；当前页面上下文由各自受信宿主重新获取。
- `ActionResult`：`status/message/errorCode`，不得包含原始错误堆栈或敏感 handler 结果。
- 脱敏后的 `ExecutionLog` schema 和正反 URL 匹配 fixtures。
- 协议必须带版本号；未知字段、权限、动作类型和版本应拒绝，而不是猜测兼容。

声明式 URL 匹配必须基于解析后的协议、hostname 和 pathname。主机后缀只允许 `host === suffix` 或 `host.endsWith("." + suffix)`，不能使用 `url.includes("zoho")`。

Zoho 自定义映射域无法仅凭 hostname 可靠识别，只有用户在站点数据中显式绑定 `zoho-desk-ticket` 后才启用专用助手。工单编号只从明确的 `/tickets/details/<18位数字>` 或严格旧式 `#Cases/dv/<18位数字>` 提取；其他数字、查询参数和不透明 hash 均视为未识别。

## 必须分别实现的部分

### Electron 桌面端

- 通过 `WebContentsView.webContents` 取得实时 URL 和标题。
- 通过主进程 IPC 执行剪贴板、系统浏览器和本地数据写入。
- 使用栖页本地 JSON 数据、空间模型和执行日志。
- 继续使用 `persist:qiye-sites` 保存现有网页会话；扩展不能直接复用该 Cookie 容器。

### Chrome 扩展

- Service worker 处理菜单、Native Messaging 生命周期和扩展设置。
- Side Panel 渲染扩展 UI。
- Content script 只在已有权限且动作明确需要时读取最小页面上下文。
- 扩展不能访问 Electron 的 `WebContentsView`、preload API 或持久 partition。

内置 WebContentsView 脚本、MV3 service worker 和网页 content script 是三个不同执行环境，权限、生命周期和 CSP 都不同。共享 JSON schema 不代表可以共享带 DOM 或 Electron 依赖的执行代码。

## 数据与安全边界

- 本地优先；未经用户明确许可，不向云端上传站点、空间、日志或页面上下文。
- 默认不读取或保存完整页面正文。
- 不记录 Cookie、登录令牌、Authorization Header、密码、页面正文或用户凭据。
- 执行日志只保存助手、动作、hostname、状态和固定摘要，URL 查询参数与 fragment 不入日志。
- 未配置的连接器应隐藏或显示“未配置连接器”，不能模拟成功。
- 任何从扩展、网页、自定义协议或本地通信层收到的消息都按不可信输入处理，并由桌面主进程重新检查当前页面、助手启用状态和权限。

## 后续实施顺序

1. 固化并版本化助手 JSON schema 与正反 fixtures。
2. 确定安装版和 Native Messaging Host 的签名、注册、升级方案。
3. 建立最小 Native Messaging 桥接，只实现“打开栖页”和“保存当前页面”。
4. 增加 Side Panel 和用户主动授权的可选 host permissions。
5. 在不共享 Cookie、正文和凭据的前提下接入 Zoho Desk 上下文入口。

在以上基础设施完成前，不应创建只能展示静态界面、无法安全通信的扩展壳。
