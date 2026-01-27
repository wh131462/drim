# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 工作准则

### 全局语言和输出规则

- Always respond with Model:[current-model]
- 始终使用简体中文回复
- 保持简洁、技术性、精确的表达
- 不要使用冗余描述、赞美或激励性语言
- 仅解释必要的内容

### 核心行为准则

- 优先保证正确性而非聪明性
- 优先进行最小化、安全的变更
- 永远不要假设缺失的需求
- 如果信息缺失或不确定，明确说明

### 代码修改规则

- **禁止**改变业务逻辑，除非明确要求
- **禁止**引入新依赖，除非明确要求
- **禁止**重构无关代码
- 保持变更局部化、最小化、可审查
- 始终遵循项目的 ESLint 规范

### 文件和工件创建规则

- 不要创建示例文件，除非明确要求
- 不要创建测试文件，除非明确要求
- 不要创建修复总结、实现总结或类似文档文件，除非明确指定

### 终端和运行时规则

- 使用终端工具时，避免重启项目，除非绝对必要
- 假设项目设计为持续运行

### 推理规则

- 先给出结论，然后给出推理过程
- 清楚区分确认的事实和假设
- 永远不要猜测框架、库或环境的行为
- 如果行为不确定，建议如何验证而不是猜测

### HTML 和标记规则

- 在 HTML 标签内编写特殊字符时，始终使用对应的 HTML 实体形式

### 网络请求和调试规则

**重要约束:**

1. 你自身的 fetch/网络请求能力在此任务中视为【不可用、不可信】
2. 禁止基于 fetch 成功或失败来判断接口是否可用
3. 所有网络行为、接口可用性、请求参数、Header、返回结构：必须 100% 以 Chrome DevTools (Network 面板) 中的真实请求为准
4. 若需要接口信息：
    - 等待用户提供 DevTools 中复制的 Request/Response
    - 或基于用户提供的 Network 记录进行分析和复现
5. 若缺少 DevTools 信息，不得自行假设、模拟或"试试看"

## 项目概述

梦见小程序 - 一款结合 AI 梦境解析与 gamification 机制的每日打卡小程序，通过"记梦-解析-改运任务"的闭环培养用户习惯。

**技术栈:**

- 前端: uni-app (Vue 3 + Vite + Pinia) - 主要针对微信小程序
- 后端: NestJS 10 + Prisma 5 + MySQL 8 + Redis 7
- 架构: pnpm workspace monorepo

## 开发命令

### 前端开发

```bash
# 微信小程序开发
pnpm dev:mp-weixin

# H5 开发 (推荐联调)
pnpm dev:h5

# 构建微信小程序
pnpm build:mp-weixin

# 类型检查
pnpm type-check
```

### 后端开发

```bash
# 启动开发服务器 (watch mode)
pnpm server:dev

# 构建生产版本
pnpm server:build

# 启动生产服务器
pnpm server:start

# 代码检查和格式化
pnpm server:lint
```

### 数据库操作

```bash
# 生成 Prisma Client
pnpm db:generate

# 执行数据库迁移
pnpm db:migrate

# 填充种子数据
pnpm db:seed

# 打开 Prisma Studio (数据库可视化管理)
pnpm db:studio
```

### Docker 环境

```bash
# 启动 MySQL + Redis 容器
pnpm docker:up

# 停止容器
pnpm docker:down

# 查看日志
pnpm docker:logs

# 快速启动已存在的容器
pnpm docker:start

# 停止容器但不删除
pnpm docker:stop
```

## 项目架构

### Monorepo 结构

- 根目录: 前端 uni-app 项目
- `server/`: 后端 NestJS 项目
- `pnpm-workspace.yaml`: workspace 配置

### 后端架构 (server/)

**目录结构:**

```
src/
├── common/              # 通用功能层
│   ├── decorators/      # 自定义装饰器 (@Public, @CurrentUser 等)
│   ├── filters/         # HttpExceptionFilter (全局错误处理)
│   ├── guards/          # AuthGuard (全局 JWT 认证)
│   ├── interceptors/    # TransformInterceptor (统一响应格式)
│   └── pipes/           # 数据验证管道
│
├── shared/              # 共享服务层
│   ├── ai/              # AI 服务 (梦境解析、润色)
│   ├── cache/           # Redis 缓存服务
│   ├── logger/          # 日志服务
│   └── wechat/          # 微信 SDK (登录、支付)
│
├── modules/             # 业务模块层
│   ├── user/            # 用户管理
│   ├── dream/           # 梦境记录 (CRUD + 日历视图)
│   ├── analysis/        # AI 解析 (调用 AI 服务)
│   ├── task/            # 改运任务 (生成、完成、奖励)
│   ├── points/          # 积分系统 (赚取、消费、记录)
│   ├── vip/             # 会员系统 (订单、权益)
│   ├── explore/         # 探索广场 (公开梦境、点赞、浏览)
│   ├── polish/          # 梦境润色 (AI 改写、配额管理)
│   ├── version/         # 版本管理 (梦境多版本、对比)
│   └── achievement/     # 成就系统 (解锁、奖励)
│
└── prisma/              # Prisma 服务 (数据库连接)
```

**全局功能:**

- `AuthGuard`: 自动验证 JWT token，排除 @Public 路由
- `HttpExceptionFilter`: 捕获所有异常并返回统一格式
- `TransformInterceptor`: 包装成功响应为 `{code, message, data, timestamp, requestId}`

### 前端架构 (src/)

**主要页面:**

- `index`: 首页 (今日记梦入口、连续天数、昨日回顾)
- `record`: 记录梦境 (输入内容、选择标签/情绪)
- `result`: 解析结果 (主题、心理解读、运势、改运任务)
- `dream-detail`: 梦境详情 (查看历史梦境)
- `dream-versions`: 版本对比 (查看原始/润色版本)
- `profile`: 个人中心 (梦境日历、成就、统计)
- `explore`: 探索广场 (浏览公开梦境、点赞)
- `achievements`: 成就页 (解锁进度、奖励)
- `vip`: 会员页 (套餐、权益)
- `settings`: 设置页

**API 层:**

- `src/api/request.ts`: Axios 封装 (统一错误处理、token 注入)
- `src/api/modules/*.ts`: 按模块拆分的 API 接口

**状态管理:**

- `src/stores/modules/user.ts`: 用户状态 (登录信息、积分、VIP 状态)

## 核心数据模型

### User (用户)

- `isVip`: 会员状态
- `luckyPoints`: 幸运值积分
- `consecutiveDays`: 连续记梦天数
- `lastDreamDate`: 最后一次记梦日期 (用于计算连续性)

### Dream (梦境)

- `content`: 当前显示内容 (可能是原始或润色版本)
- `originalContent`: 永久保存的原始内容
- `currentVersionId`: 当前展示的版本 ID
- `isPublic`: 是否公开到探索广场
- `likeCount`: 点赞数 (关联 ExploreView)

### DreamVersion (梦境版本)

- `type`: `original` (原始) 或 `polished` (润色)
- `polishedFrom`: 基于哪个版本润色
- `isCurrent`: 是否为当前展示版本

### Analysis (解析结果)

- `theme`: 梦境主题 (一句话概括)
- `interpretation`: 心理解读
- `fortuneScore`: 运势评分 (1-100)
- `fortuneTips`: JSON 格式的运势提示 (事业/感情/健康)

### Task (改运任务)

- `status`: `pending` | `completed` | `expired`
- `rewardPoints`: 基础奖励积分
- `isDoubleReward`: 是否已看广告翻倍

### Achievement (成就)

- `conditionType`: 条件类型 (如 `consecutive_days`, `total_dreams`)
- `conditionValue`: 达成条件值
- `rewardPoints`: 解锁奖励

### PolishQuota (润色配额)

- `total`: 每日总配额 (默认 3 次)
- `used`: 已使用次数
- `remaining`: 剩余次数
- VIP 用户无限制

## API 响应格式

所有接口遵循统一响应格式 (由 `TransformInterceptor` 自动处理):

**成功响应:**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": 1704067200000,
  "requestId": "uuid"
}
```

**错误响应:**

```json
{
    "code": 400,
    "message": "错误描述",
    "data": null,
    "timestamp": 1704067200000,
    "requestId": "uuid"
}
```

**错误码:**

- `0`: 成功
- `400`: 请求参数错误
- `401`: 未授权/Token 过期
- `403`: 禁止访问
- `404`: 资源不存在
- `500`: 服务器内部错误

## 关键业务逻辑

### 连续记梦天数计算

- 每次创建梦境时检查 `lastDreamDate`
- 如果距离上次记录正好 1 天: `consecutiveDays += 1`
- 如果超过 1 天: `consecutiveDays = 1` (重新开始)
- 同一天多次记录不影响连续天数

### 梦境版本管理

- 创建梦境时自动生成 `original` 版本
- 润色时基于某个版本创建新的 `polished` 版本
- 切换版本时更新 `currentVersionId` 和 `isCurrent` 标志
- `Dream.content` 始终反映当前版本内容

### 积分系统

- 完成任务: +10 积分 (可翻倍至 +20)
- 解锁成就: +奖励积分 (由成就定义)
- 所有积分变动记录在 `PointRecord` 表

### 探索广场点赞

- 点赞操作通过 `ExploreView` 表记录
- 每个用户对同一梦境只能点赞一次
- `Dream.likeCount` 是聚合统计字段

### VIP 权益

- 无广告查看解析结果
- 无限次梦境润色 (普通用户 3 次/天)
- 解锁高级解析功能

## 环境变量

**后端 (server/.env):**

```
PORT=3333
DATABASE_URL=mysql://user:password@localhost:3306/drim
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
WECHAT_APPID=wxXXXXXX
WECHAT_SECRET=XXXXXX
AI_API_KEY=sk-XXXXX
AI_BASE_URL=https://api.example.com
```

**前端 (src/.env.development):**

```
VITE_API_BASE_URL=http://localhost:3333/api/v1
VITE_USE_MOCK=false
```

## 测试和调试

### 后端测试

```bash
# 单元测试
cd server && pnpm test

# 端到端测试
cd server && pnpm test:e2e

# 测试覆盖率
cd server && pnpm test:cov
```

### 前端联调

1. 启动后端: `pnpm server:dev` (http://localhost:3333)
2. 启动前端: `pnpm dev:h5` (推荐) 或 `pnpm dev:mp-weixin`
3. 使用微信开发者工具打开 `dist/dev/mp-weixin`

### Mock 数据

- 前端支持 Mock 模式: 设置 `VITE_USE_MOCK=true`
- 后端可以填充测试数据: `pnpm db:seed`

## 常见任务

### 添加新的业务模块

1. 在 `server/src/modules/` 创建模块文件夹
2. 生成模块: `cd server && nest g module modules/xxx`
3. 生成控制器: `nest g controller modules/xxx`
4. 生成服务: `nest g service modules/xxx`
5. 在 `app.module.ts` 中导入模块

### 修改数据库表结构

1. 编辑 `server/prisma/schema.prisma`
2. 生成迁移: `pnpm db:migrate`
3. 重新生成 Prisma Client: `pnpm db:generate`

### 添加新的 API 接口

1. 后端: 在对应模块的 `controller.ts` 添加路由
2. 前端: 在 `src/api/modules/*.ts` 添加接口调用
3. 页面: 调用 API 接口并处理响应

### 调试 AI 解析

1. 检查 `server/src/shared/ai/` 的配置
2. 确认 `AI_API_KEY` 环境变量正确
3. 查看 Prisma Studio 中的 `Analysis` 表状态
4. 使用 Swagger 文档 (http://localhost:3333/api/docs) 测试接口

## 部署

### 前端部署

```bash
# 构建微信小程序
pnpm build:mp-weixin

# 使用微信开发者工具上传 dist/build/mp-weixin
```

### 后端部署

```bash
# 构建
pnpm server:build

# 使用 PM2 启动
pm2 start dist/main.js --name drim-server

# 或使用 Docker
cd server && docker build -t drim-server .
docker run -p 3000:3000 drim-server
```

### 数据库迁移

```bash
# 生产环境执行迁移
cd server && pnpm prisma:migrate deploy
```
