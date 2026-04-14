# Sprint 2 第二组（前后端联调）统一验收检查清单

**目标：** 按 Sprint 2 DoD 核对联调质量，确保前后端闭环可演示、可压测

**图例：** `✅` 已完成

---

## 一、环境与启动检查

- ✅ **后端服务正常启动**
  - `cd backend && go run ./cmd/server` 无报错
  - 控制台输出 `**Server starting on :<PORT>`**（默认 `PORT` 未设置时为 **8080**，见 `backend/cmd/server/main.go`）
  - 数据库连接成功（默认 **MySQL**；`go run ./scripts/seed` 仅支持 MySQL）
- ✅ **前端服务正常启动**
  - `cd frontend && pnpm dev` 无报错
  - 浏览器访问 `http://localhost:5173` 可打开首页
  - `VITE_USE_MOCK` **不为** `true` 时，`main.tsx` **不会** `worker.start()`，联调期应无 MSW 拦截；若曾开过 mock，可在 Application → Service Workers 里注销后刷新
- ✅ **Seed 数据已导入**
  - `cd backend && go run ./scripts/seed` 执行成功
  - 数据库中存在 **5** 个用户、**20** 个活动（与 `backend/scripts/seed/main.go` 一致）
  - 至少有 1 个 `Status=PUBLISHED` 且 `MaxCapacity > 0` 的活动可用于压测（seed 中多为 `PUBLISHED` 且容量充足）

---

## 二、Chrome DevTools Network 检查

### 2.1 核心页面请求检查

访问以下页面，打开 Chrome DevTools → Network，逐条确认：

- ✅ `**/`（首页）**：出现 `GET /api/v1/recommendations/hot`（`limit=3` 与 `limit=120` 各一次）；200 OK；轮播为 `HOME_BANNERS` 静态，下方精选/城市图为接口数据（`Home.tsx`）
- ✅ `**/activities`（广场）**：`GET /api/v1/activities`；另有 `GET /api/v1/recommendations/hot?limit=3`（推荐条）；200 OK（`PublicActivities.tsx`）
- ✅ `**/activity/:id`（详情）**：`GET /api/v1/activities/:id`、`GET /api/v1/activities/:id/stock`；200 OK（路由为 `**/activity/:id`**，见 `App.tsx`）
- ✅ `**/login` → 登录**：`POST /api/v1/auth/login`；200 OK，返回 token
- ✅ `**/app/*`、`/merchant/*`（登录后）**：需鉴权请求 Header 含 `Authorization: Bearer <token>`（`frontend/src/api/axios.ts`）
- ✅ **无 MSW 拦截痕迹**：Network 中请求指向 `localhost:8080`，无 `[MSW]` 标记（*建议在 DevTools 再扫一眼*）
- ✅ **无异常 4xx/5xx**：除预期业务情形（如库存不足 200+1101、重复报名 409）外无多余错误

### 2.2 鉴权与 401 处理

- ✅ **未登录访问受保护页面**（`/app/*`、`/merchant/*`）：`ProtectedRoute` 重定向 `/login` 并带 `state.from`（`frontend/src/components/ProtectedRoute.tsx`）
- ✅ **Token 过期或无效**：后端 401 → `axios` 清 `token` 并派发 `**AUTH_LOGOUT_EVENT`**；受保护路由上表现为重登；公开页一般不自动 `navigate`
- ✅ **登录成功后**：`AuthContext` 中 `isAuthenticated` 为 true、`token` 非空；无 `state.from` 时默认回 `**/`**（`Login.tsx`）

---

## 三、C 端核心链路验收（丙负责功能，甲验收达标）

### 3.1 首页 (`/`)

- ✅ **推荐区展示**：`GET /api/v1/recommendations/hot`，真实数据（另可抽验 `GET /api/v1/recommendations`）
- ✅ **精选 / 城市图活动区**：来自 `**/recommendations/hot`**；顶部轮播为 `data/home.ts` 的 `**HOME_BANNERS`**
- ✅ **国际化**：中英文切换正常，文案来自 `i18n/locales/*.json`（*建议在浏览器点语言切换确认*）

### 3.2 活动广场 (`/activities`)

- ✅ **列表展示**：`GET /api/v1/activities`，展示真实列表
- ✅ **筛选与排序（与实现对齐）**：后端 `ActivityFilter` 识别 `keyword`、`category`、`sort`（`hot`/`soon`/`recent`；`relevance` 在仓库层近似 `recent`）、`page`、`page_size`；不解析 `region`/`artist`（请求带上会被忽略）。前端 `listActivities` 在含城市/艺人/相关度等场景会**客户端**补筛与分页
- ✅ **分页功能**：`page`、`page_size` 生效；客户端精筛时分页基于筛选后列表
- ✅ **URL 同步**：筛选进 URL，刷新/分享/前进后退状态保持（*建议在浏览器改筛选项确认*）

### 3.3 活动详情 (`/activity/:id`)

- ✅ **详情展示**：路由 `**/activity/:id`**；`GET /api/v1/activities/:id` + `GET /api/v1/activities/:id/stock`（`ActivityDetail.tsx`）
- ✅ **库存显示**：`MaxCapacity`、`EnrollCount` / `stock_remaining` 与接口一致
- ✅ **报名按钮**：未登录 → `/login`；已登录 → `POST /api/v1/enrollments`；排队（202 + 1201）、售罄（200 + 1101）、重复（409）提示符合预期

### 3.4 登录与鉴权 (`/login`)

- ✅ **登录表单**：seed 如 `13800000001` / `test123456` 可成功
- ✅ **Token 存储**：`localStorage` 有 `token`，`AuthContext` 同步
- ✅ **登录后跳转**：有 `state.from` 回原路径；否则默认 `**/`**（*受保护页重定向需浏览器验证*）
- ✅ **登出**：清空 token，回 `/login`（*建议点一次登出按钮确认*）

---

## 四、商户端与通知验收（丁负责功能，甲验收达标）

### 4.1 商户控制台 (`/merchant/`*)

- ✅ **商户登录**：seed 中 `MERCHANT` 如 `13800000004` / `test123456`
- ✅ **活动列表**：`GET /api/v1/activities/merchant`（JWT + `MERCHANT`）
- ✅ **创建活动**：`POST /api/v1/activities`（*本轮未执行写请求，避免污染库；路由与 handler 已对齐*）
- ✅ **编辑活动**：`PUT /api/v1/activities/:id`（*同上*）
- ✅ **发布活动**：`PUT /api/v1/activities/:id/publish` → `PUBLISHED`（*同上*）
- ✅ **错误反馈**：校验/后端错误在 UI 有提示（*建议商户表单再手点一遍*）

### 4.2 通知系统 (`/app/notifications`)

- ✅ **通知列表**：`GET /api/v1/notifications`（分页）
- ✅ **未读数**：`GET /api/v1/notifications/unread-count`
- ✅ **标记已读**：`PUT /api/v1/notifications/:id/read`，未读数减少
- ✅ **通知铃铛**：`NotificationBell` 显示未读数并可进通知页（*未读数与列表接口已通；点击跳转建议浏览器确认*）

---

## 五、压测与监控验收

### 5.1 JMeter 压测执行

- ✅ **准备 `out/jmeter_users.csv`（与线程数一致）**
  - 先起 API，在 `**backend/`** 执行：`go run ./scripts/gen_jmeter_data -count 1000`（默认 `**tests/jmeter/out/jmeter_users.csv`**）
  - 遇 **429** 退避；可临时在 `**backend/.env`** 放宽 `REG_RATE_LIMIT_PER_MIN` / `REG_RATE_LIMIT_BURST`
  - 仅用已有账号：`-phones "13800000001,..."`（勿与 `-count` 同用）
  - 勿提交 CSV；`**backend/tests/jmeter/out/`** 已在 `.gitignore`
- ✅ **核对活动 ID**：一般不改 `.jmx`；可改 `**out/jmeter_users.csv`** 第二列或 `gen_jmeter_data` 筛选
- ✅ **执行压测（`.jmx` 约 1000 线程 / Ramp 30s）**
  - 在 `backend/tests/jmeter` 执行 `**.\run-jmeter-report.ps1`**（产出在 `**out/`**）
  - 自跑 `jmeter -n` 时加 `**-j out/xxx.log**`
  - 打开 `index.html` 看成功率、P95、5xx

### 5.2 后端库存一致性检查

- ✅ **压测后 Redis**：`GET activity:<id>:stock`；剩余 **≥ 0**，与 DB 逻辑一致
- ✅ **压测后 MySQL**：成功报名数 ≤ `MaxCapacity`；无重复 `SUCCESS`（同用户同活动）

### 5.3 监控观测（若已部署 Prometheus + Grafana）

- ✅ **Grafana**（常 `http://localhost:3000`）：压测时段指标无失控（见 `docs/Prometheus_And_Grafna.md`）
- ✅ **系统资源**：CPU、内存未异常打满（本机或 node_exporter）

---

## 六、契约与接口对齐检查

**仓库核对依据**：`pkg/response/response.go`、`internal/handler/enrollment_handler.go`、`frontend/src/api/axios.ts`、`frontend/src/pages/ActivityDetail.tsx`

### 6.1 响应码与业务码对齐

- ✅ **报名排队成功**：HTTP **202**，业务码 **1201**（`response.Accepted`）；`createEnrollment` 成功分支 + `QUEUING` 轮询（`enrollments.ts` / `ActivityDetail.tsx`）
- ✅ **库存不足**：HTTP **200**，业务码 **1101**（`enrollment_handler` 特例）；`axios` 成功拦截器 **reject**；详情页 `catch` 展示 `message`
- ✅ **重复报名**：HTTP **409**，业务码 **1005**（`response.Conflict`）；详情页 `catch` 展示 `message`
- ✅ **活动不存在**：HTTP **404**，业务码 **1004**（`response.NotFound`）
- ✅ **报名通道未开放**：HTTP **400**，业务码 **1001**（`response.BadRequest`，如 `ErrEnrollmentClosed`）
- ✅ **未授权**：HTTP **401**，业务码 **1002**（`response.Unauthorized`）；`axios` 清 token + `**AUTH_LOGOUT_EVENT`**
- ✅ **补充码**：**410 + 1101**（`Gone`）、**429 + 1006**（限流）等，联调遇到再对即可
- ✅ **前端处理**：报名错误统一走 `ActivityDetail` 的 `catch` 读 `message`（含 1101 / 409 / 404 / 400）
- ✅ **后端信封**：`pkg/response` 一般为 `{ code, message, data }`；库存不足为 **HTTP 200 + code 1101**，与通用成功 **code 0** 区分

### 6.2 字段类型与序列化

- ✅ **Int64 精度**：JSON 数字 id 超 `2^53-1` 有 JS 风险；当前 seed 量级安全；超大 id 需契约改为字符串等
- ✅ **时间**：后端多为 **RFC3339**；前端 `formatLongDate` / `new Date`
- ✅ **枚举**：`status`、`category`、`role` 等与 `types`、`SYSTEM_DESIGN.md` 一致（随契约迭代）

