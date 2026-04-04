# UAAD 贡献指南 (CONTRIBUTING)

欢迎参与 UAAD 项目！我们采用 **AI 协作开发** 模式，请遵循以下核心规范。

---

## 1. 核心开发原则

- **文档驱动**：所有技术方案、接口定义、页面设计**先写文档，再写代码**。避免"代码写了不知道干嘛"和"前后端接口对不上"的问题。
- **架构对齐**：重大变更前必须更新 `docs/SYSTEM_DESIGN.md`，确保代码与设计一致。
- **文档维护**：非必要不新建文档。方案完成后更新已有文档（SYSTEM_DESIGN.md 的 API 状态、COLLABORATION.md 的进度、SPRINT1.md 的分工状态）。
- **AI 协作**：利用 AI 生成代码时，需严格按照项目现有的技术栈和命名规范。所有 AI 以 SYSTEM_DESIGN.md 为共同上下文，不超 SRS 范围开发。
- **质量保障**：后端核心逻辑需包含测试；前端需适配中英文国际化并处理加载/异常状态。

---

## 2. 团队结构与分工

项目分为三个开发组，各组模块隔离，文件互不冲突：

| 组 | 人数 | 职责 |
|---|---|---|
| **A 后端1** | 3 人 | 活动 + 报名 + 订单（产品核心链路）|
| **B 后端2** | 2 人 | 通知 + 行为埋点 + 推荐 + 基础设施 |
| **C 前端** | 2 人 | 全部页面 + 组件 + UI/UX + Mock |

详细分工见 [`docs/SPRINT1.md`](docs/SPRINT1.md)。

### 文件级冲突预防

| 规则 | 说明 |
|---|---|
| **同组模块同文件** | 每人有自己的 domain/repository/service/handler 文件，不碰别人的 |
| **`main.go` 只有一人改** | 由 Tech Lead 统一合并路由注册（各模块通过 `*_setup.go` 注册函数）|
| **`App.tsx` 只有一人改** | 由前端负责人统一合并路由（各人提交页面/组件文件）|

---

## 3. API 契约与前后端协作

**SYSTEM_DESIGN.md §4 是唯一的 API 真理源。**

- 前端按文档定义的格式写 TypeScript 类型和 MSW Mock
- 后端按文档定义的格式实现接口
- **API 变更必须先更新 SYSTEM_DESIGN.md，再通知对应组**
- C 组不等后端，全程用 MSW Mock 开发，后端完成后切真实 URL 联调

### 对齐检查清单（PR Review 必查）

- [ ] 响应体格式 `{ code, message, data }` 与 `pkg/response` 一致
- [ ] HTTP 状态码正确（200/201/202/400/401/403/404/409/429/500）
- [ ] 分页响应包含 `list, total, page, page_size`
- [ ] 时间字段格式：ISO 8601 UTC
- [ ] 前端 TypeScript 类型与后端 Go struct 字段/类型对齐

---

## 4. 数据库方案

- **开发阶段即用 MySQL**，不再用 SQLite 过渡
- GORM MySQL driver + AutoMigrate 建表
- `docs/DDL.md` 作为字段对齐参考
- 连接池参数（MaxIdleConns、MaxOpenConns、ConnMaxLifetime）需合理配置

快速启动：
```bash
docker run -d --name uaad-mysql \
  -e MYSQL_ROOT_PASSWORD=root \
  -e MYSQL_DATABASE=uaad \
  -p 3306:3306 mysql:8.0
```

---

## 5. 提交规范

- **分支命名**：`feature/功能名` 或 `fix/问题名`
- **Commit 格式**：`feat(模块): 描述` 或 `fix(模块): 描述`
- **提交记录**：完成后更新 walkthrough 记录变更点和验证证据

### 分支策略

```
main (稳定可发布)
  └── dev (集成开发分支，每日合并 feature)
        ├── feature/activity-backend      (A 组)
        ├── feature/enrollment-backend    (A 组)
        ├── feature/order-backend         (A 组)
        ├── feature/notification-backend  (B 组)
        ├── feature/recommend-backend     (B 组)
        ├── feature/frontend-activity     (C 组)
        └── feature/frontend-user         (C 组)
```

**规则：**
- 不直接向 `main` 提交
- 合并到 `dev` 需要 PR + 至少 1 人 Review
- 每日同步：`git pull origin dev`，避免大合并
- feature 分支不超过 3 天，频繁合并减少冲突
- 冲突由 PR 发起方解决

---

## 6. 测试要求

| 模块 | 测试要求 |
|---|---|
| **报名** | 并发必测：stock=1 时多 goroutine 并发，只允许 1 个成功 |
| **活动** | 创建流程 + 上架状态机（PUBLISHED 后不可改 capacity）|
| **订单** | 模拟支付后状态变更 |
| **通知/行为** | 写入成功 + 标记已读 |
| **推荐** | 热度评分计算正确 |
| **JWT 中间件** | 有效 token 放行、过期/无 token 拒绝 |
| **前端** | 页面渲染正常、路由跳转正确、401 自动跳登录 |

> 不追求覆盖率数字，**关键路径有测就行**。

---

## 7. 前端 UI/UX 要求

- **响应式**：PC + 移动端适配（Tailwind 断点：sm/md/lg/xl）
- **视觉一致**：主色调、圆角、阴影、间距统一
- **反馈动画**：按钮点击反馈（Framer Motion）、页面切换过渡效果
- **加载状态**：Skeleton 占位，不用空白
- **状态区分**：排队/成功/失败用颜色区分（绿/红）
- **订单状态标签**：PENDING-橙、PAID-绿、CLOSED-灰
- **表单防重**：提交后按钮 disable + loading
- **401 处理**：自动跳登录，登录后跳回原页面

---

## 8. Sprint 规划

| Sprint | 目标 | A 组 | B 组 | C 组 |
|---|---|---|---|---|
| **1** | 基础补齐 | 实体定义 | MySQL + response + JWT + 配置 + AutoMigrate | TS 类型 + API 封装 + MSW Mock |
| **2** | 核心模块 | 活动 + 报名 + 订单全部接口 | 通知 + 行为 + 推荐全部接口 | 12 个页面 + 5 组件 + UI/UX |
| **3** | 联调打磨 | 核心链路联调 + 并发验证 | 推荐调优 + 埋点优化 | 前后端联调 + UI 打磨 |

> 当前阶段不接入 Redis/Kafka，用 MySQL 事务方案。后续升级只需替换实现层，不重写业务逻辑。

---

## 9. 后续升级到 Redis/Kafka 的迁移路径

当前用 MySQL 方案，后续升级预留接口抽象：

```go
type StockManager interface {
    Deduct(ctx, activityID, userID int64) (int, error)
    GetStock(ctx, activityID int64) (int, error)
}
```

- MySQL 行锁 → Redis Lua 扣减
- 同步建订单 → Kafka 异步 Worker
- 内存限流 → Redis 计数器

---

## 10. 沟通与协作节奏

| 频率 | 内容 | 形式 |
|---|---|---|
| 每天 | 昨天做了什么、今天做什么、遇到阻塞 | 站立会 |
| 每 2 天 | API 对齐检查 + PR Review | 代码审查 |
| Sprint 结束 | 集成测试（各模块合并到 dev，全链路跑通） | 联调 |
| 随时 | API 变更讨论 | 先改 SYSTEM_DESIGN.md，再通知 |

---

## 11. 技术栈速览

| 层 | 技术选型 |
|---|---|
| **Frontend** | Vite + React + TypeScript + Tailwind v4 + Framer Motion + MSW + i18next |
| **Backend** | Go (Gin) + GORM + MySQL |
| **中间件**（后续） | Redis + Kafka |
| **部署** | Docker + Kubernetes |

---

## 12. 文档导航

| 文档 | 内容 |
|---|---|
| [`docs/SPRINT1.md`](docs/SPRINT1.md) | **当前分工方案**（三组职责、接口分配、Sprint 目标）|
| [`docs/SRS.md`](docs/SRS.md) | 软件需求规格说明 |
| [`docs/SYSTEM_DESIGN.md`](docs/SYSTEM_DESIGN.md) | 系统架构设计 + 全量 API 契约 |
| [`docs/DDL.md`](docs/DDL.md) | 数据库 DDL |
| [`docs/COLLABORATION.md`](docs/COLLABORATION.md) | 团队协作开发方案（冲突预防、分支策略）|
| [`frontend/FRONTEND_SPEC.md`](frontend/FRONTEND_SPEC.md) | 前端开发规范 |
