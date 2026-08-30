# 网页导航首屏性能对比（2026-08-30）

## 测量方法

- Windows 本机 Electron 44 开发运行。
- 使用隔离的临时 userData 和固定 `persist:qiye-sites` Partition。
- 本地 HTTP 测试页在响应前固定等待 650ms，用来区分“页面网络耗时”和“栖页额外等待”。
- 冷启动创建 5 个独立 WebContentsView，取中位数。
- 修改前后使用同一条 `navigation-performance-probe` 集成路径。
- `selectReturnMs` 表示选择页签到主进程返回的时间；它直接反映 UI 是否被 `loadURL` 完整加载阻塞。

## 结果

| 指标（5 次中位数） | 修改前 | 修改后 | 变化 |
| --- | ---: | ---: | ---: |
| 选择页签返回 | 728.02 ms | 1.72 ms | -99.76% |
| 点击到 View 挂载 | 725.65 ms | 0.94 ms | -99.87% |
| 点击到调用 `loadURL` | 1.21 ms | 1.73 ms | 基本持平 |
| `loadURL` 到 DOM Ready | 667.19 ms | 676.57 ms | 测试页网络波动 |
| DOM Ready 到页面可见 | 50.55 ms | 0 ms | 不再等待完整加载 |
| 栖页遮罩额外延迟 | 50.55 ms | 0 ms | 已消除 |
| 完整加载 | 728.49 ms | 725.73 ms | 基本持平 |

## 结论

优化没有伪造或缩短测试页的网络加载时间。主要变化是：WebContentsView 在 `loadURL` 前已经挂载并设置 Bounds，`loadURL` Promise 只处理错误，不再控制可见性。因此网页可以渐进绘制，地址栏进度线和停止按钮继续反映后台加载状态。

## 审计结果

- 普通页面固定使用 `persist:qiye-sites`。
- SAP 页面与登录链固定使用 `persist:qiye-sap-support`。
- Session 显式启用 HTTP Cache，没有随机 Partition。
- 普通导航不调用 `clearCache` 或 `clearStorageData`；清理只存在于用户主动触发的站点/SAP 修复流程。
- 默认生命周期为 1 个 active、最多 1 个 warm，其他页面按 15 分钟策略休眠。
- 活动页、登录页、加载中、音频播放、下载、待上传、beforeunload、Zoho 草稿、独立窗口和“保持运行”页受保护。
- 页面动作、资源扫描、整页翻译和连接器上下文不进入首屏阻塞路径。
