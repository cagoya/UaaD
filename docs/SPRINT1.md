# UAAD Sprint 1 工作划分方案

> **核心原则：组级分工、模块隔离、契约先行、文档驱动**
>
> 最后更新：2026-04-04

---

## 提交顺序提醒

> **⚠️ 各组先提交文档，再提交代码。**
> 1. 先在各自负责的文件中写清楚技术方案/接口定义/页面设计思路
> 2. 文档 OK 后再开始写代码
> 3. 避免"代码写了不知道干嘛"和"前后端接口对齐不上"的问题

---

## 一、三组职责

| 组 | 人数 | 职责定位 |
|---|---|---|
| **A 后端1** | 3 人 | 活动 + 报名 + 订单，产品核心链路 |
| **B 后端2** | 2 人 | 通知 + 行为埋点 + 推荐 + 基础设施 |
| **C 前端** | 2 人 | 全部页面 + 组件 + UI/UX + Mock |

---

## 二、数据库：MySQL

开发阶段直接用 MySQL，不再用 SQLite 过渡。

- Docker 启动：`docker run -d --name uaad-mysql -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=uaad -p 3306:3306 mysql:8.0`
- GORM 切换 MySQL driver，AutoMigrate 建表
- `docs/DDL.md` 作为字段对齐参考
- 连接池优化（已在 BE-02 完成过，需确认切换到 MySQL 后参数合理）

---

## 三、A 组后端1 — 活动 + 报名 + 订单

**负责文件：** `domain/`、`repository/`、`service/`、`handler/` 下与 activity、enrollment、order 相关的所有文件。

**需要实现的 API：**

| 模块 | 接口 | 角色 |
|---|---|---|
| 活动 | POST/PUT /activities, PUT /activities/:id/publish, GET /activities, GET /activities/:id, GET /activities/:id/stock, GET /activities/merchant | B 端 + C 端 |
| 报名 | POST /enrollments, GET /enrollments/:id/status, GET /enrollments | C 端 |
| 订单 | GET /orders, GET /orders/:id, POST /orders/:id/pay | C 端 |

**需要做的（不只是 CRUD）：**
- 完整 4 层架构（domain → repository → service → handler）
- 活动上架时的状态机校验（DRAFT → PUBLISHED，不可回退）
- 报名幂等校验（同一用户同一活动不能重复报）
- 库存扣减并发安全（MySQL 行级锁 / 乐观锁）
- 订单过期扫描逻辑（定时释放未支付订单库存）
- 订单号生成（格式：ORD{YYYYMMDD}{8 位序列}）
- 报名返回排队状态（开发阶段可直接返回 SUCCESS，预留 QUEUING 状态）
- 所有接口走 `pkg/response` 统一响应格式
- 需要鉴权的接口接入 JWT 中间件
- B 端接口校验角色权限（MERCHANT）
- 接口输入校验（时间逻辑、库存非负、参数完整）

**测试：**
- 报名并发场景必测（stock=1 时多 goroutine 并发只允许 1 个成功）
- 活动创建 + 上架流程测试
- 订单模拟支付测试
- 报名幂等测试（重复报名返回 409）
- 库存不足返回正确错误码
- 非 MERCHANT 角色创建/编辑活动返回 403
- 过期订单扫描后库存回补测试

---

## 四、B 组后端2 — 通知 + 行为 + 推荐 + 基础设施

**负责文件：** `domain/`、`repository/`、`service/`、`handler/` 下与 notification、behavior、recommendation 相关的所有文件 + `pkg/response` + `middleware/auth_middleware.go` + `config/config.go`

**需要实现的 API：**

| 模块 | 接口 | 角色 |
|---|---|---|
| 通知 | GET /notifications, PUT /notifications/:id/read, GET /notifications/unread-count | C 端 |
| 行为 | POST /behaviors, POST /behaviors/batch | C 端 |
| 推荐 | GET /recommendations, GET /recommendations/hot, GET /recommendations/nearby | 公开 |

**需要做的：**
- 完整 4 层架构（同上）
- 行为埋点不影响主流程（异步或低优先级写入）
- 推荐算法实现（热度评分 + 冷启动兜底）
- 通知触发机制（报名成功后自动发通知）
- `pkg/response` 统一响应包（SYSTEM_DESIGN.md §8.2 的完整实现）
- JWT 鉴权中间件（Bearer Token 校验 + 角色检查）
- 配置管理（环境变量加载，.env + 默认值）
- GORM AutoMigrate 补齐全实体（Activity、Enrollment、Order、Notification、Behavior、ActivityScore）
- MySQL 连接池优化（MaxIdleConns、MaxOpenConns、ConnMaxLifetime）
- 为 A 组提供 response 包和中间件

**测试：**
- JWT 中间件：有效 token 放行、过期 token 拒绝、无 token 拒绝
- 统一响应包：各种错误码返回格式正确
- 行为埋点写入成功 + 批量写入
- 推荐热度评分计算正确
- 通知标记已读 + 未读计数

---

## 五、C 组前端 — 页面 + 组件 + UI/UX + Mock

**负责完成的页面：**

| 页面 | 路由 | 端 |
|---|---|---|
| 活动广场 | `/activities` | C 端 |
| 活动详情 | `/activity/:id` | C 端 |
| 报名排队 | `/enroll-status/:id` | C 端 |
| 我的订单 | `/orders` | C 端 |
| 订单详情 | `/orders/:id` | C 端 |
| 通知中心 | `/notifications` | C 端 |
| 推荐首页 | `/app/overview` | C 端 |
| 个人资料 | `/profile` | C 端 |
| 商户控制台 | `/merchant/dashboard` | B 端 |
| 创建活动 | `/merchant/activities/new` | B 端 |
| 商户活动列表 | `/merchant/activities` | B 端 |
| 编辑活动 | `/merchant/activities/:id/edit` | B 端 |

**组件：** ActivityCard、ActivityCountdown、EnrollButton、MerchantForm、RankingTable

**TypeScript：** `api/endpoints/` 各模块 API 封装 + `types/index.ts` 全局类型 + `mocks/handlers.ts` MSW Mock

### UI / UX 设计要求

**整体风格：**
- 响应式设计：PC + 移动端适配（Tailwind 断点：sm/md/lg/xl）
- 统一的视觉语言：主色调、圆角、阴影、间距保持一致
- 清晰的视觉层级：标题 > 副标题 > 正文 > 辅助信息
- 暗色模式预留（当前可选，但结构上要留余地）

**页面级要求：**

| 页面 | UI/UX 要点 |
|---|---|
| 活动广场 | 卡片网格布局，封面图比例统一，分类 Tabs 可切换，搜索栏置顶，排序按钮清晰 |
| 活动详情 | Hero 区大图 + 关键信息一目了然，倒计时组件直观（天/时/分/秒），库存条用颜色区分充裕/紧张/售罄 |
| 报名排队 | 全屏排队动画（Loading 骨架屏或动），排队位置实时变化提示，成功/失败状态用颜色和图标区分（绿/红） |
| 我的订单 | 订单卡片状态用颜色标签（PENDING-橙、PAID-绿、CLOSED-灰），操作按钮状态跟随 |
| 商户控制台 | 数据卡片大数字 + 趋势箭头，活动列表带状态标签，操作按钮分组 |
| 创建/编辑表单 | 字段分组 + 步骤指示，实时校验 + 错误提示在字段下方，时间选择器用日期时间控件 |
| 通知中心 | 未读项视觉突出（加粗/背景色），已读/未读切换，滑动或按钮标记已读 |

**交互要求：**
- 所有按钮点击有反馈（Framer Motion 小动画或 Tailwind 状态色）
- 页面切换有过渡效果（Framer Motion AnimatePresence）
- 加载状态用 Skeleton 占位，不用空白
- 错误状态有明确提示（toast 或页面内错误卡片）
- 表单提交后按钮 disable + loading 状态，防止重复提交
- 401 自动跳登录，登录成功后跳回原页面

---

## 六、依赖关系

```
B 组基础设施 ──→ A 组可以开始写接口
C 组 ──→ 不等后端，用 MSW Mock 开发
A 组 与 B 组 ──→ 业务模块互不依赖，同步推进
```

---

## 七、Sprint 目标

### Sprint 1 — 基础补齐
- B 组：MySQL + response + JWT + 配置 + AutoMigrate 全实体
- C 组：TypeScript 类型 + API 封装 + MSW Mock
- **Done：** 注册登录全链路跑通 + MySQL 连通 + 前端页面骨架

### Sprint 2 — 核心模块
- A 组：活动 + 报名 + 订单全部接口
- B 组：通知 + 行为 + 推荐全部接口
- C 组：全部 12 个页面 + 组件 + UI/UX 打磨

### Sprint 3 — 联调
- 全组：前后端联调、修 bug、UI 打磨、并发验证

---

## 八、API 契约

**SYSTEM_DESIGN.md §4 是唯一的 API 真理源。**
- 前端按文档写类型和 Mock
- 后端按文档实现接口
- API 变更先改 SYSTEM_DESIGN.md，再通知

---

## 九、代码冲突预防

| 组 | 文件范围 | 别人碰吗 |
|---|---|---|
| A 组 | activity/enrollment/order 的 domain/repo/service/handler | ❌ |
| B 组 | notification/behavior/recommendation + response/jwt/config | ❌ |
| C 组 | pages/components/api/endpoints/types/hooks/mocks | ❌ |
| `main.go` | 路由合并 | 🔴 一人改 |
| `App.tsx` | 路由注册 | 🔴 一人改 |

---

## 十、文档维护规则

1. 非必要不新建文档
2. 方案完成后更新已有文档（SYSTEM_DESIGN.md 的 API 状态、COLLABORATION.md 的进度）以及本文档
3. 本文档是分工的单一入口

---

## 十一、后续升级到 Redis/Kafka

当前用 MySQL 方案，后续升级不需要重写业务逻辑，只需替换实现。建议设计时预留接口抽象（如 StockManager），开发阶段用 MySQL 实现，后续换 Redis 实现。
