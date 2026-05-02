# 压力测试与 Sprint 3 压测基线

## 背景与架构

抢票链路已改为 **Redis Lua 原子扣减** → **Kafka 缓冲** → **Worker 异步落库 MySQL**：

1. MySQL 默认隔离级别为可重复读（RR）；高并发场景可考虑读已提交（RC），不可重复读在业务层通常可接受。
2. Redis 单线程执行；Lua 脚本将「幂等检查 + 扣库存 + 入已报名集合 + 全局排队号」视为一条原子命令。
3. Kafka 用于削峰，保护 MySQL；Worker 消费后事务写入报名与订单。

---

## 前置条件（压测前必须全部就绪）


| 项               | 说明                                                                                                                                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **基础设施**        | `docker-compose up -d`：MySQL、Redis、Kafka **healthy**；若需观测，同时启动 Prometheus / Grafana（见 [Prometheus_And_Grafna.md](./Prometheus_And_Grafna.md)）。                                                                                                       |
| **后端**          | `cd backend && go run ./cmd/server`（或 `go run ./cmd/server/main.go`），默认 `:8080`。                                                                                                                                                                     |
| **种子数据**        | `cd backend && go run ./scripts/seed`：商户 / 用户 / **已发布**活动。                                                                                                                                                                                           |
| **鉴权与 CSV**     | API 已启动后：`go run ./scripts/gen_jmeter_data -count <线程数>`，生成 `backend/tests/jmeter/out/jmeter_users.csv`（`token,activity_id`，**行数须与 JMeter 线程数一致**）。本地回环地址（`127.0.0.1` / `::1`）已免除限流，无需额外配置。 |
| **压测活动基线**      | **主口径**：对 **单个** `PUBLISHED` 活动压 `POST /api/v1/enrollments`；`gen_jmeter_data` 会取列表中首个 `PUBLISHED` 的 `activity_id` 写入 CSV 第二列。                                                                                                                        |
| **库存 Redis 预热** | 发布活动时后端会 `WarmUp`：`activity:<id>:stock` = `MaxCapacity`，并清空 `activity:<id>:enrolled_set`（见 `activity_service.Publish`）。**Seed 中已发布活动**一般已具备；若 Redis 被 flush 或 key 缺失，需对该活动重新 **Publish** 或手工对齐 Redis 与 DB 容量后再压。                                     |


---

## 压测主口径与业务判定（Sprint 3 统一标准）

- **被压接口**：`POST /api/v1/enrollments`（JSON：`{"activity_id":<uint>}`，`Authorization: Bearer <token>`）。
- **热点场景**：针对 **单个** 已发布且 **Redis 库存已预热** 的活动（CSV 中同一 `activity_id`）。

### 业务成功 / 非失败（计入「可接受响应」，非 5xx）


| 条件                                     | 含义                  |
| -------------------------------------- | ------------------- |
| **HTTP 202** 且响应体 `**code = 1201`**    | 成功进入排队（异步落库）。       |
| **HTTP 200 或 410** 且 `**code = 1101`** | 业务性售罄拒绝（库存不足等业务结果）。 |


### 失败（计入压测失败 / 需排查）

- **任意 5xx**、请求 **超时**、连接失败。
- **非预期组合**：例如 202 但非 1201、200/410 但非 1101、非 409 的 4xx（若出现）等（JMeter 脚本中 `outcome=FAILURE` 便于人工对照 JTL/HTML）。

### JMeter 脚本内 `outcome` 变量（`enrollment-load.jmx`）


| `outcome`  | 说明                                  |
| ---------- | ----------------------------------- |
| `QUEUED`   | `202` + `code=1201`                 |
| `SOLD_OUT` | `200` 或 `410` + `code=1101`         |
| `CONFLICT` | `409`（重复报名等，与 Sprint 3 主口径并存档时单独统计） |
| `FAILURE`  | 5xx 或其它非预期                          |


HTTP 断言允许 `200|202|409|410`，`**assume_success=false`**：出现 **5xx** 时样本记为 **失败**。

---

## 执行步骤

### 1. 生成 JMeter 用户 CSV

```bash
cd backend
go run ./scripts/gen_jmeter_data -count 1000
# 大规模：-count 3000（与启用的线程组一致）
```

输出默认：`tests/jmeter/out/jmeter_users.csv`（已在 `.gitignore`，勿提交）。

### 2. 运行 JMeter 并生成 HTML 报告

在 `**backend/tests/jmeter**` 目录下：

- **macOS / Linux**：

```bash
./run-jmeter-report.sh
```

- **Windows**：

```powershell
.\run-jmeter-report.ps1
```

产物：`out/results-<时间戳>.jtl`、`out/jmeter-<时间戳>.log`、`out/report-<时间戳>/index.html`。

### 3. Sprint 3 大规模（≥3000 并发）

1. 在 JMeter GUI 或编辑 `enrollment-load.jmx`：**禁用**「峰值 1000 并发」线程组，**启用**「**Sprint3 大规模压测 3000 并发**」线程组（Ramp 60s，单请求/线程）。
2. `gen_jmeter_data -count 3000` 生成 3000 行 CSV。
3. 同样执行 `run-jmeter-report.sh` / `run-jmeter-report.ps1`。

**5000 并发**：可复制 3000 线程组改为 5000 / 调整 Ramp，并 `-count 5000`；若硬件或本机限制达不到，在基线表中记录**实际线程数**与**瓶颈原因**（与 [SPRINT3.md](./SPRINT3.md) 大规模项对齐）。

---

## 基线结果模板（须固化存档）

将下列表格复制到压测报告或 Wiki（每次跑完填一版）：


| 结果项                   | 填写说明                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **测试日期 / 环境**         | 日期；机器配置；`docker-compose` / 后端版本或 commit。                                                                                    |
| **线程数 / Ramp / 持续时间** | 与 `.jmx` 一致（如 1000 / 30s / 单取样；或 3000 / 60s）。                                                                               |
| **成功率**               | JMeter HTML **Overall** 或聚合报告：**样本错误率**的补集；建议同时备注 `QUEUED` / `SOLD_OUT` / `CONFLICT` 占比（可从 JTL 自定义列或二次统计 `outcome`）。        |
| **P95 / P99**         | HTML Dashboard **Statistics** 中 `POST 报名`（或 `/api/v1/enrollments`）的 **95th / 99th percentile**。                             |
| **5xx 是否出现**          | 错误页 / 聚合报告中 **5xx 计数**；目标为 **0**（若 >0 须附日志与原因）。                                                                             |
| **最终库存是否严格不为负**       | Redis：`GET activity:<activity_id>:stock` 结果 **≥ 0**；并与 DB `MaxCapacity`、`EnrollCount` 逻辑对照。                                 |
| **是否存在重复成功报名**        | MySQL：同一 `user_id` + `activity_id` 是否存在多条 `**SUCCESS`** 报名；成功数是否 **≤ MaxCapacity**（可与 `activity:<id>:enrolled_set` 规模交叉核对）。 |


**可选**：Prometheus / Grafana 截图（HTTP 5xx、P99、Worker success/failure）见 [Prometheus_And_Grafna.md](./Prometheus_And_Grafna.md)。

---

## 内置 Go 并发测试（零超卖回归）

前置：同上（`docker-compose`、后端、seed）。

```bash
# 零超卖验证：500 并发抢 10 张票 → 恰好 10 人成功
cd backend && go test -v -tags=stress -run TestConcurrentEnrollment_Stock10 -count=1 ./tests/

# 吞吐量基准
cd backend && go test -v -tags=stress -bench=BenchmarkEnrollmentThroughput -benchtime=10s -count=1 ./tests/
```

**判断标准**（与仓库既有说明一致）：

```
success=10, stock=10 → 零超卖 PASS
success>10           → 超卖 BUG
```

---

## 相关文件


| 路径                                                                                              | 说明                                     |
| ----------------------------------------------------------------------------------------------- | -------------------------------------- |
| [backend/tests/jmeter/enrollment-load.jmx](../backend/tests/jmeter/enrollment-load.jmx)         | JMeter 计划：断言、`outcome`、1000 / 3000 线程组 |
| [backend/tests/jmeter/run-jmeter-report.sh](../backend/tests/jmeter/run-jmeter-report.sh)       | macOS/Linux 一键报告                       |
| [backend/tests/jmeter/run-jmeter-report.ps1](../backend/tests/jmeter/run-jmeter-report.ps1)     | Windows 一键报告                           |
| [backend/scripts/gen_jmeter_data/main.go](../backend/scripts/gen_jmeter_data/main.go)           | CSV 生成                                 |
| [backend/tests/jmeter/ACCEPTANCE_CHECKLIST.md](../backend/tests/jmeter/ACCEPTANCE_CHECKLIST.md) | 验收清单（含 Sprint 3 压测基线节）                 |


