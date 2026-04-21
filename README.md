# 📚 UAAD 项目文档索引

> 面向新加入的开发者、AI Agent 和技术负责人。
> 🔒 = 必读 | 📖 = 按需阅读 | 🔧 = 开发参考

**最后更新：2026-04-18**

---

## 🏃 新人快速上手（按顺序读）

1. 🔒 [SRS.md](docs/SRS.md) → 了解项目是什么
2. 🔒 [SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) → 看懂架构和 API
3. 🔒 [COLLABORATION.md](docs/COLLABORATION.md) → 知道怎么和人配合
4. 🔧 [DOCS_PROMPTS_GOVERNANCE.md](docs/DOCS_PROMPTS_GOVERNANCE.md) → 知道文档和提示词该改哪里
5. 🔧 [CONTRIBUTING.md](CONTRIBUTING.md) → 知道怎么提交代码
6. 🔧 [FRONTEND_SPEC.md](frontend/FRONTEND_SPEC.md) → 前端开发规范

---

## 文档导航

### 0. 项目根目录

| 文件 | 说明 |
|------|------|
| `CONTRIBUTING.md` | 贡献指南 — 分支/commit 格式、AI 协作原则、技术栈速览 |

---

### 1. 需求与设计 📐

> 📍 `docs/`

| 文件 | 大小 | 必读？ | 内容 | 适合谁 |
|------|------|--------|------|--------|
| **SRS.md** | 11KB | 🔒 | 软件需求规格说明：项目背景、用户类型、功能需求、非功能指标、迭代规划 | 全员、新人 |
| **SYSTEM_DESIGN.md** | 65KB | 🔒 | 系统架构设计：分层架构、数据库 DDL、完整 API 契约、时序图、抢票引擎、推荐算法、部署架构、前端路由 | 全员（最常查阅） |
| **DDL.md** | 10KB | 🔒 | 数据库 DDL 汇总：7 张表的完整建表语句 + Redis 键位约定 + GORM 对齐清单 | 后端、数据 |
| **TICKET_ENGINE_DESIGN.md** | 17KB | 📖 | 抢票引擎深度设计：并发控制、排队算法、Lua 库存扣减细节 | 后端抢票开发 |
| **RECOMMENDATION_DESIGN.md** | 16KB | 📖 | 推荐引擎设计：热度评分算法、协同过滤、数据流、API 设计 | 后端推荐开发 |
| **COLLABORATION.md** | 17KB | 🔒 | 团队协作开发方案：冲突热力图、模块隔离、Sprint 分工表、分支策略、通信节奏 | 全员、负责人 |
| **wbs.puml** | 6KB | 📖 | 工作分解结构 PlantUML：7 大工作流、150+ 工作包（含 Mock 工程） | 负责人、PM |

---

### 2. 团队协作流程与 AI 资产 🤝

> 📍 根目录 & `.github/` & `.agents/`

| 文件 | 说明 | 适合谁 |
|------|------|--------|
| **CONTRIBUTING.md** | 贡献指南 — 分支命名、commit 格式、AI 协作原则、质量要求 | 全员 |
| **docs/DOCS_PROMPTS_GOVERNANCE.md** | 文档与提示词治理说明 — 真理源、适配层、更新顺序、引用规范 | 全员、AI Agent |
| **.github/PULL_REQUEST_TEMPLATE.md** | PR 模板 — 关联工单、变更描述、执行证据、自查清单 | 全员（提 PR 时必填） |
| **.github/copilot-instructions.md** | GitHub Copilot 入口指令 — 指向项目真理源，避免在工具入口重复维护规则 | AI Agent、开发者 |
| **.agents/workflows/sdd-standard.md** | SDD 全局规范真理源 — 阅读 SRS / SYSTEM_DESIGN / DDL，按证据交付 | AI Agent |
| **.agents/workflows/skill-sdd-arch.md** | 架构工作流 — ER 图→DDL→ORM 模型转换规范 | 架构、后端 |
| **.agents/workflows/skill-aitdd-backend.md** | 后端 TDD 工作流 — 并发测试→性能优化→自动迭代循环 | 后端、测试 |
| **.agents/workflows/skill-prompt-frontend.md** | 前端 Prompt 工作流 — NLP→组件生成→浏览器自校验 | 前端、AI Agent |

> 约定：`.agents/` 为团队自维护 AI 规范真理源；`.github/prompts/`、`.github/skills/` 及其他工具目录默认视为兼容层或分发副本，详细规则见 [DOCS_PROMPTS_GOVERNANCE.md](docs/DOCS_PROMPTS_GOVERNANCE.md)。

---

### 3. 后端开发 🟢

> 📍 `backend/`

#### 代码目录

```text
backend/
├── cmd/server/main.go              # 入口：DI、路由装配、后台任务启动
├── internal/
│   ├── config/                     # 环境变量、连接池、推荐参数
│   ├── domain/                     # User / Activity / Enrollment / Order / Notification / Behavior / Score
│   ├── handler/                    # Auth / Activity / Enrollment / Order / Notification / Behavior / Recommendation
│   ├── infra/                      # Redis / Kafka 基础设施封装
│   ├── middleware/                 # JWT / Optional JWT / RBAC / 限流 / Metrics
│   ├── repository/                 # 各模块数据访问层
│   ├── service/                    # 核心业务逻辑与库存 Lua 引擎
│   └── worker/                     # Enrollment Kafka consumer
├── migrations/                     # 001~007 SQL 迁移脚本
├── pkg/                            # jwtutil / response 等公共库
├── scripts/                        # seed 与压测数据生成脚本
├── tests/                          # 集成、契约、JMeter 压测脚本
├── go.mod / go.sum                 # Go 模块依赖
├── task.md                         # 后端任务清单
└── uaad.db                         # 本地遗留 SQLite 样例库（非当前主链路）
```

#### 相关文档

| 文件 | 说明 | 必读时机 |
|------|------|----------|
| `docs/walkthrough.md` | 最近一轮联调与修复记录：商户端、通知、API 客户端等变更摘要 | 了解近期进展 |
| `backend/task.md` | 后端任务清单：基础能力、推荐模块、测试扩展完成情况 | 跟踪进度 |
| `docs/SYSTEM_DESIGN.md` 第 4 章 | API 契约（请求/响应/错误码） | 写接口前 |
| `docs/SYSTEM_DESIGN.md` 第 8 章 | Go Handler 错误处理模板 + response 包规范 | 写 handler 时 |

---

### 4. 前端开发 🔵

> 📍 `frontend/`

#### 代码目录

```text
frontend/
├── src/
│   ├── api/                        # axios 实例 + activities/auth/enrollments/orders/notifications/recommendations 端点封装
│   ├── components/                 # 公共组件、商户组件、ActivityCountdown、MerchantForm、ProtectedRoute
│   ├── constants/                  # 认证与公共常量
│   ├── context/AuthContext.tsx     # 认证全局状态
│   ├── data/                       # 首页与地理数据
│   ├── hooks/                      # 偏好城市、通知数量、用户偏好等 hooks
│   ├── i18n/                       # 中英文词典与配置
│   ├── layouts/PublicLayout.tsx    # 公共站点布局
│   ├── mocks/                      # MSW handlers
│   ├── pages/                      # Home / PublicActivities / ActivityDetail / Orders / Notifications / Merchant* 等页面
│   ├── types/                      # activity / auth / enrollment / notification / order / recommendation 等类型
│   ├── utils/                      # auth / api / formatter / countdown / notification state
│   ├── App.tsx                     # 路由入口
│   └── main.tsx                    # 应用启动与 Mock 开关
├── public/                         # favicon、icons、GeoJSON、MSW worker
├── FRONTEND_SPEC.md                # 前端开发规范
├── task.md                         # 前端任务清单
└── package.json                    # Vite/React/Tailwind 脚本与依赖
```

#### 相关文档

| 文件 | 说明 | 必读时机 |
|------|------|----------|
| **FRONTEND_SPEC.md** | 前端规范 — 技术栈、AuthContext 数据流、Axios 拦截器、TypeScript 类型、i18n、文件命名 | 前端开发前 |
| `frontend/task.md` | 前端任务清单：基础认证、公开页、订单/通知/商户端当前状态 | 跟踪进度 |
| `docs/SYSTEM_DESIGN.md` 第 11 章 | 前端路由表 + 数据流总览 + 核心页面说明 | 加新页面时 |
| `docs/SYSTEM_DESIGN.md` 第 4 章 | API 契约 | 对接后端时 |

---

### 5. 迁移与数据 🗃️

> 📍 `backend/migrations/`

| 文件 | 说明 |
|------|------|
| `001_users.up.sql` / `001_users.down.sql` | 用户表 |
| `002_activities.up.sql` / `002_activities.down.sql` | 活动表 |
| `003_enrollments.up.sql` / `003_enrollments.down.sql` | 报名表 |
| `004_orders.up.sql` / `004_orders.down.sql` | 订单表 |
| `005_user_behaviors.up.sql` / `005_user_behaviors.down.sql` | 用户行为表 |
| `006_activity_scores.up.sql` / `006_activity_scores.down.sql` | 活动热度评分表 |
| `007_notifications.up.sql` / `007_notifications.down.sql` | 通知表 |

> ⚠️ 当前主开发链路使用 MySQL + GORM AutoMigrate；SQL 文件同时作为结构说明和迁移参考。

---

### 6. Sprint 全景图 🗺️

| Sprint | 目标 | 周期 | 并行开发 |
|--------|------|------|----------|
| **Sprint 1** | 基础准备（JWT/响应包/配置/路由对齐） | 2-3 天 | Infra Team |
| **Sprint 2** | 活动模块（CRUD + 上架预热 + B 端商户） | 5-7 天 | 4 人并行 |
| **Sprint 3** | 报名/订单/抢票引擎 | 5-7 天 | 3 人并行 |
| **Sprint 4** | 推荐系统（行为埋点 + 热度 + CF） | 5 天 | 2 人并行 |
| **Sprint 5** | 压测 + E2E + Docker Compose + 文档 | 5 天 | 全员 |

详细说明见 [COLLABORATION.md §5](docs/COLLABORATION.md) 和 [wbs.puml](docs/wbs.puml)。
