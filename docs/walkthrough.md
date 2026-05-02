# Walkthrough

## 2026-04-13 · Sprint2 乙同学 API 联调迭代记录

### 变更概览
- 新增前端测试基建（Vitest + jsdom）并接入 `pnpm test` 脚本。
- 在全局 HTTP 层实现 401 登出事件派发，解决仅清理 localStorage 导致的同页鉴权态不同步问题。
- 在全局 HTTP 层实现 `HTTP 200 + code=1101` 的业务失败拦截并转为 reject，避免库存不足误判为成功。
- 新增报名 API 封装与类型：
  - `createEnrollment(activityId)` 对接 `POST /enrollments`，支持 `202 + code=1201` 排队受理。
  - `getEnrollmentStatus(enrollmentId)` 对接 `GET /enrollments/:id/status`。
  - `listMyEnrollments(page,pageSize)` 对接 `GET /enrollments` 分页数据。

### Diff 思路
- 先补测试框架，再做拦截器与 endpoint，保证每次变更都有可执行回归。
- 契约映射策略统一在 endpoint 层处理：后端 snake_case 字段映射为前端 camelCase，页面层不承担字段转换。
- 全局错误语义集中在 axios 拦截器，页面调用方只处理成功对象或 reject 对象，避免分散判断逻辑。

### 验证结果
- `pnpm test`：通过（新增 smoke、401、1101、enrollments endpoint 测试）。
- `pnpm build`：通过。
- `pnpm lint`：存在仓库既有错误（Merchant 页面中的 `react-hooks/set-state-in-effect`），与本次改动无直接关联。

## 2026-04-13 · 前端 lint 修复迭代

### 变更概览
- 修复 `MerchantActivities.tsx` 中 `react-hooks/set-state-in-effect`：
  - 去除 effect 内同步 `setBanner`，改为从路由 state 派生 banner。
  - 首次加载改为带取消标记的异步请求，避免 effect 中同步 setState。
  - 发布后刷新列表改为独立 `reloadList()`。
- 修复 `MerchantActivityEdit.tsx` 中 `react-hooks/set-state-in-effect`：
  - 去除 effect 内同步 `setLoading(false)` 分支。
  - 引入 `isActivityIdValid` 派生判定与 invalid-id 早返回视图。
  - 为异步详情加载增加取消标记，卸载时避免写状态。
- 在 `eslint.config.js` 中忽略 `public/mockServiceWorker.js`，消除生成文件的无效注释 warning。

### 验证结果
- `pnpm lint`：通过。
- `pnpm test`：通过。
- `pnpm build`：通过。

## 2026-04-13 · 商户控制台与通知联调记录

### 变更概览
- **商户端**：`MerchantDashboard` / `MerchantActivities` / `MerchantActivityNew` / `MerchantActivityEdit` 对接真实商户活动接口；列表、发布、创建、编辑、详情加载失败时使用页面横幅展示 `getRequestErrorMessage` 文案，不单依赖控制台；创建成功可通过回跳 `location.state.message` 提示；发布走 `publishMerchantActivity` 并刷新列表。
- **MerchantForm**：提交前校验报名开始早于报名结束、报名结束早于活动开始；表单字段与 `toBackendActivityInput` / 后端约定一致。
- **通知 API 客户端**（`api/endpoints/notifications.ts`）：`GET /notifications` 分页（`list`、`total`、`page`、`page_size`）；`GET /notifications/unread-count` 读取 `data.unread_count`；`PUT /notifications/:id/read` 标记已读；将 `created_at`、`is_read` 等蛇形字段映射为 `NotificationItem`。
- **通知页面**（`pages/Notifications.tsx`）：首屏加载 + 「加载更多」分页追加；空态与骨架占位；请求失败横幅；点击条目调用 `markNotificationRead` 并乐观更新已读样式。
- **通知铃铛**（`components/public/NotificationBell.tsx`）：已登录时拉取未读数；依赖路由 `pathname`、定时轮询与 `window` `focus` 刷新，保持角标与列表大致同步。
- **共用错误文案**（`utils/requestErrorMessage.ts`）：供商户与通知等页面统一解析 axios 业务错误与网络错误。


### 验证结果
- 代码层面：商户列表 → 新建/编辑 → 发布、通知列表 → 标记已读、铃铛未读数刷新路径已实现。
- 运行时：需在商户账号与普通用户账号下用 Chrome DevTools 确认核心请求无持续 401/404，并与后端通知写库行为一致（未读数、已读状态）。

## 2026-05-02 · Worker Prometheus 指标（Sprint3 异步链路可观测性）

### 变更概览
- `internal/middleware/metrics.go`：在保留 `http_requests_total` / `http_request_duration_seconds` 的前提下，新增 enrollment Kafka Worker 指标：
  - `worker_messages_processed_total{status}` — 处理成功/失败次数；
  - `worker_message_processing_duration_seconds{status}` — 单条消息处理耗时；
  - `worker_kafka_lag_approx{topic}` — 基于 `kafka-go` `Reader.Stats().Lag` 的滞后近似值。
- 导出 `RecordWorkerMessage(status, durationSec)`、`SetWorkerKafkaLag(topic, lag)` 供 worker 调用，避免在业务包中重复声明 Prometheus 向量。
- `internal/worker/enrollment_worker.go`：`handleMessage` 在 JSON 解析成功后计时，事务失败路径与成功路径分别记录 `failure` / `success`；`Run` 在每读完一条消息后刷新 lag gauge。

### Diff 思路
- 指标统一注册在既有 `MustRegister`，HTTP 与 Worker 共用同一 scrape 端点暴露。
- Lag 在消费循环内更新，成本低且与消息处理节奏一致。

### 验证结果
- `go build ./...`（backend）：通过。

## 2026-05-02 · Sprint3 压测基线固化（JMeter + 文档）

### 变更概览
- **`backend/tests/jmeter/enrollment-load.jmx`**
  - HTTP 断言改为 **`200|202|409|410`**，**`assume_success=false`**，使 **5xx** 正确记为样本失败（修复原先 5xx 仍可能记为通过的问题）。
  - 新增 **`JSONPostProcessor`** 提取 **`$.code` → `resp_code`**。
  - 新增 **`JSR223PostProcessor`（Groovy）**：按 Sprint3 口径写入 **`outcome`**：`QUEUED`（202+1201）、`SOLD_OUT`（200/410+1101）、`CONFLICT`（409）、`FAILURE`（5xx 或非预期组合）。
  - 新增默认 **禁用** 的 **「Sprint3 大规模压测 3000 并发」** 线程组（Ramp 60s）；与 1000 线程组二选一启用；TestPlan 注释说明 `gen_jmeter_data -count` 与线程数对齐。
- **`docs/STRESS_TEST.md`**：重写为 Sprint3 基线文档 — 前置条件、主接口与判定、执行步骤、`outcome` 说明、**基线结果模板（5 项）**、3000/5000 大规模说明、Go stress 测试引用、相关文件索引。
- **`backend/tests/jmeter/ACCEPTANCE_CHECKLIST.md`**：新增 **「七、Sprint 3 压测基线验收」**；§5.1 补充 `run-jmeter-report.sh` 与 P99 / `outcome` 对照。
- **`backend/tests/jmeter/run-jmeter-report.sh`**：新增与 `run-jmeter-report.ps1` 等价的 **bash** 一键报告脚本（时间戳目录、`-e -o` HTML）。

### Diff 思路
- 断言与脚本分层：**状态码** 由 `ResponseAssertion` 兜底；**业务口径** 由 JSON 提取 + Groovy 归类，便于报告外二次统计或人工对 JTL。
- 大规模线程组独立且默认关闭，避免误跑 3000 行 CSV 未生成时全线程失败。

### 验证结果
- 文档与 JMeter XML、shell 脚本为静态交付；**需在本地安装 JMeter 且拉起全栈后** 执行 `bash run-jmeter-report.sh` 做运行时验证。

## 2026-05-02 · Sprint3 Grafana 监控栈基础设施代码化

### 变更概览
- **`docker-compose.yaml`**（修改）：Prometheus 新增 `extra_hosts: host.docker.internal:host-gateway` 以拉取宿主机 `:8080/metrics`；Grafana 挂载 `./infra/grafana/provisioning` 目录实现零手工配置启动。
- **`infra/grafana/provisioning/datasources/prometheus.yaml`**（新增）：声明 uid `prometheus` 数据源，`url: http://prometheus:9090`（Docker 内网服务名），设为默认；`timeInterval: 15s` 与 Prometheus `scrape_interval` 对齐。
- **`infra/grafana/provisioning/dashboards/dashboard.yaml`**（新增）：配置 file provider，从 `/etc/grafana/provisioning/dashboards` 自动加载 JSON，`allowUiUpdates: true` 允许在 UI 二次调整后不被覆盖。
- **`infra/grafana/provisioning/dashboards/uaad-sprint3.json`**（新增）：预置 3 行 9 面板 Dashboard（uid `uaad-sprint3`，标签 `uaad/sprint3/enrollment`）：
  - **Row 1**：全站 HTTP 吞吐、报名接口吞吐、5xx 错误率、状态码 Stacked 分布；
  - **Row 2**：报名接口 P50/P95/P99 三联延迟、全站按 path 的 P95；
  - **Row 3**：Worker success/failure Stacked 吞吐（绿/红）、Worker 处理耗时 P95、Kafka 消费滞后近似 Gauge。
  - 所有查询使用 `$__rate_interval` 动态窗口；刷新间隔 10s；默认时间范围 `now-30m`。

### Diff 思路
- Grafana provisioning（数据源 + Dashboard）完全声明式，容器重建后自动恢复，无需手动点击 UI 建面板。
- Dashboard JSON 内 datasource 引用 `uid: prometheus` 与 datasource YAML 中 `uid` 字段一致，避免「数据源 not found」问题。
- Worker 面板 success 覆盖绿色、failure 覆盖红色，便于压测时一眼判断健康状态。

### 启动方式
```bash
cd infra
docker compose up -d
# Grafana: http://localhost:3000  (admin / admin)
# Prometheus: http://localhost:9090
# Dashboard 自动出现在 "UAAD / Sprint3" 文件夹
```