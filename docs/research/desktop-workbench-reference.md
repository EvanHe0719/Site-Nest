# 栖页 0.5.0 桌面工作台参考项目审计

审计日期：2026-08-30

本轮只借鉴产品边界和公开架构思路，不复制这些项目的源代码，也不把浏览器扩展直接安装进栖页。许可证信息来自各仓库当前默认分支及 GitHub API；上游许可证或默认分支变化时需要重新核验。

| 项目 | 可借鉴能力 | 明确不采用 | 当前许可证 | 是否引用代码 |
| --- | --- | --- | --- | --- |
| [lencx/Noi](https://github.com/lencx/Noi) | 本地优先、会话隔离、紧凑浏览工具栏、快速切换 | 终端、CLI、多窗口分屏、AI 网站大全、Prompt 管理 | GitHub 当前未识别许可证（NOASSERTION），按“不得复制代码”处理 | 否 |
| [ferdium/ferdium-app](https://github.com/ferdium/ferdium-app) | Workspaces、多网页服务组织、Todo 与网页服务共存、登录弹窗、托盘后台 | Ferdium 账号/同步、消息服务配方体系 | Apache-2.0 | 否 |
| [super-productivity/super-productivity](https://github.com/super-productivity/super-productivity) | 本地任务模型、周计划、时间安排、提醒和快速录入 | 时间追踪、工时、Jira、番茄钟、健康提醒 | MIT | 否 |
| [violentmonkey/violentmonkey](https://github.com/violentmonkey/violentmonkey) | Userscript metadata、匹配规则、运行时机、权限和 GM 存储边界 | 完整 Chrome 扩展、`unsafeWindow`、静默远程依赖 | MIT | 否 |
| [immersive-translate/old-immersive-translate](https://github.com/immersive-translate/old-immersive-translate) | 内容区域识别、双语显示、恢复原文、站点规则 | 归档扩展本体、非官方免费翻译接口、上游实现拷贝 | MPL-2.0，仓库已归档 | 否 |
| [FilipePS/Traduzir-paginas-web](https://github.com/FilipePS/Traduzir-paginas-web) | 文本节点提取、动态页面翻译、同源 frame、恢复原文 | Manifest V2 扩展结构、远程免费翻译接口、全权限扩展 | MPL-2.0 | 否 |

## 本轮独立实现原则

1. 浏览器能力继续建立在 Electron `WebContentsView`、现有会话模型和 `persist:qiye-sites` 上。
2. 右键菜单、弹窗、翻译、任务、用户脚本和内存治理均使用栖页自己的白名单 IPC 与数据模型。
3. 翻译文本提取和用户脚本匹配仅参考公开标准概念，代码独立实现。
4. 未确认许可证或强 copyleft 兼容性时不复制文件、函数或样式。
5. 本文件没有引入第三方代码，因此当前发行物不新增第三方源代码声明。

