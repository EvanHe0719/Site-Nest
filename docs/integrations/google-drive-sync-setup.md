# Google Drive appDataFolder 同步配置

栖页使用 Google Drive API v3 的隐藏 `appDataFolder` 保存栖页自己的数据。该空间与用户可见的 My Drive 分离，查询固定使用 `files.list?spaces=appDataFolder`，写入文件的父级固定为 `appDataFolder`。官方说明：<https://developers.google.com/workspace/drive/api/guides/appdata>。

## 当前实现边界

- 客户端类型：Google OAuth **Desktop app**。
- 授权方式：系统浏览器、Authorization Code、PKCE S256、本机 `127.0.0.1` 随机端口回调。
- Scope：`openid`、`email`、`profile`、`https://www.googleapis.com/auth/drive.appdata`。
- 不申请 `drive` 或 `drive.readonly`，不访问普通 My Drive 文件。
- Access Token、Refresh Token 和导入后的 Client Secret 由 Electron `safeStorage` 加密；renderer 只能看到账号、状态和 Scope 布尔摘要。
- Google Drive 同步不是 Chrome Sync，不会回写 Chrome 官方书签或 Chrome 官方浏览历史。

Google 对 Windows/macOS/Linux Desktop App 推荐系统浏览器与 loopback IP 回调，并支持 PKCE：<https://developers.google.com/identity/protocols/oauth2/native-app>。

## 1. 确认正确项目

1. 打开 Google Cloud Console。
2. 切换到 OAuth Client 所属项目；下载的 Desktop JSON 中 `project_id` 应与该项目一致。
3. 在 **Google Auth Platform → Clients** 找到相同 Client ID。
4. 不要只在另一个项目启用 API；Drive API 必须在该 Client 所属项目中启用。

当前本机审计到的项目 ID 为 `juhepingtai`。项目号可能变化，排错时仍以当前导入 JSON 为准。

## 2. 启用 Google Drive API

在正确项目的 **APIs & Services → Library** 中搜索并启用 **Google Drive API**。Google 官方启用说明：<https://developers.google.com/workspace/drive/api/guides/enable-sdk>。

## 3. 配置 Branding、Audience 和 Test users

1. **Google Auth Platform → Branding**：填写应用名称、支持邮箱和开发者联系邮箱。
2. **Audience**：个人 Gmail 测试通常选择 External + Testing。
3. 在 **Test users** 中加入实际授权邮箱，例如当前测试账号。
4. Testing 模式下，非基础身份 Scope 需要测试用户；Google 说明测试用户授权及 Refresh Token 通常会在 7 天后到期，届时栖页会显示“授权已过期”，需要重新授权：<https://support.google.com/cloud/answer/15549945>。

## 4. 配置 Data Access

在 **Google Auth Platform → Data Access** 检查以下 Scope：

```text
openid
email
profile
https://www.googleapis.com/auth/drive.appdata
```

`drive.appdata` 是 appDataFolder 的最小 Scope。它不授予普通 My Drive 读取权限。

## 5. 创建 Desktop OAuth Client

1. 打开 **Google Auth Platform → Clients**。
2. 创建 OAuth client。
3. Application type 选择 **Desktop app**，不要选择 Web application。
4. 下载 JSON。

有效文件必须以 `installed` 为根节点。栖页拒绝 `web` 客户端，避免错误使用 Web Client 的固定回调配置。

## 6. 在新电脑导入配置 JSON

打开 Google 同步卡片，点击“选择 OAuth 配置并登录”，选择从 Google Cloud 下载的原始 Desktop OAuth JSON。栖页会把 Client Secret 加密保存到当前 Windows 用户的 `safeStorage`，并只在本机留下脱敏配置；随后自动打开系统浏览器授权。

不要复制另一台电脑的 `google-oauth-client.secure.json` 或 `google-oauth-token.json`。这些密文绑定原 Windows 用户环境，复制后无法解密。也不要选择另一台电脑已经去掉 `client_secret` 的脱敏 JSON；跨电脑导入必须使用 Google Cloud 下载的原始文件。

默认位置：

```text
%APPDATA%\栖页\google-oauth-client.json
```

开发时也可使用环境变量：

```powershell
$env:QIYE_GOOGLE_OAUTH_CONFIG = 'C:\path\to\desktop-client.json'
npm.cmd run dev
```

首次成功导入后，栖页会把 Client Secret 写入 `safeStorage` 加密文件，并从应用保存的 JSON 中删除明文 Secret。用户选择的原始源文件不会被修改。不要将原始 JSON、加密凭据、Token 或 `userData` 文件复制进 Git 仓库。

仓库 `.gitignore` 已覆盖：

```text
client_secret_*.json
google-oauth-client*.json
google-oauth-token*.json
google-sync-meta.json
```

提交前执行：

```powershell
git status --short
git grep -n -I -E 'GOCSPX-|refresh_token|access_token' -- . ':!test/**'
```

## 7. 授权与测试

1. 打开“设置与数据 → 账号与同步 → Google 数据同步”。
2. 已登录但缺少 Drive Scope 时点击“重新授权 Drive”；不需要退出 Google，也不需要第二个账号。
3. 授权完成后，栖页检查 Google 实际返回的 Scope。
4. 自动健康检查只读取 `appDataFolder`。
5. 用户主动点击“测试连接”时，才会创建并立即删除一个临时测试文件。
6. 健康检查成功后，再选择“立即同步”或“从云端恢复”；授权本身不会覆盖任一端数据。

## 8. 常见错误

| 错误代码 | 含义 | 处理 |
| --- | --- | --- |
| `GOOGLE_CLIENT_CONFIG_MISSING` | 未找到 Desktop Client JSON | 检查默认位置或 `QIYE_GOOGLE_OAUTH_CONFIG` |
| `GOOGLE_CONFIG_CLIENT_TYPE` | 导入了 Web Client | 重新创建 Desktop app Client |
| `DRIVE_SCOPE_MISSING` | 旧 Token 只有账号 Scope | 使用同一账号点击“重新授权 Drive” |
| `DRIVE_API_DISABLED` | Client 所属项目未启用 Drive API | 在正确项目启用 Google Drive API |
| `GOOGLE_TEST_USER_REQUIRED` | Testing 项目未加入当前账号 | 在 Audience 中加入 Test user |
| `GOOGLE_AUTH_EXPIRED` / `GOOGLE_TOKEN_REFRESH_FAILED` | Token 失效或 Testing Token 到期 | 重新授权 |
| `GOOGLE_PERMISSION_DENIED` | 用户拒绝或组织策略阻止 | 检查账号/组织策略并重新授权 |
| `GOOGLE_NETWORK_ERROR` | 网络或代理无法连接 Google | 检查 Windows 代理后重试 |
| `GOOGLE_REQUEST_TIMEOUT` | Google 请求超时 | 检查网络后重试 |
| `GOOGLE_RATE_LIMITED` | API 限流 | 稍后重试 |
| `GOOGLE_SYNC_CONFLICT` | 本地和云端都改变 | 查看差异后选择智能合并、本地或云端 |

## 9. 开发与正式环境边界

- 开发 Sprint 仅运行 `dev`、`lint`、`typecheck`、`test`、`build:code`。
- `build:code` 只做代码语法/编译验证，不调用 electron-builder。
- 便携版只能通过 `package:portable` 显式生成；安装包只能通过 `package:win` 显式生成。
- 普通 push/PR 的 CI 只运行 `check` 与 `build:code`。
- 测试项目与正式项目应使用不同 OAuth Client；不要把测试 Client Secret 提交到仓库或发布产物。
- 正式发行要做到无需用户选择 JSON，发布方必须准备生产 Desktop OAuth Client，并在受控发布流程中注入；普通仓库构建仍保留显式导入流程，不会自动携带开发者本机配置。
- “设置”同步包含 DeepSeek Base URL、模型、语言、划词、拼音及小序公开偏好；DeepSeek API Key、Google Token 和 Client Secret 不进入 Drive，新电脑需分别授权或重新填写。
