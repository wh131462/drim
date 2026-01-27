# 梦见 - AI 梦境解析小程序

一款结合 AI 梦境解析与 gamification 机制的每日打卡小程序，通过"记梦-解析-改运任务"的闭环培养用户习惯。

## 技术栈

| 层级   | 技术选型                                    |
| ------ | ------------------------------------------- |
| 前端   | uni-app + Vue 3 + Vite + Pinia + TypeScript |
| 后端   | NestJS 10 + Prisma 5 + TypeScript           |
| 数据库 | MySQL 8 + Redis 7                           |
| 架构   | pnpm workspace monorepo                     |

## 项目结构

```
drim/
├── src/                    # 前端 uni-app 项目
│   ├── api/                # API 接口封装
│   ├── components/         # 公共组件
│   ├── pages/              # 页面
│   ├── stores/             # Pinia 状态管理
│   ├── styles/             # 全局样式
│   ├── static/             # 静态资源
│   └── types/              # 类型定义
├── server/                 # 后端 NestJS 项目
│   ├── src/
│   │   ├── common/         # 通用功能 (装饰器、过滤器、守卫)
│   │   ├── shared/         # 共享服务 (AI、缓存、微信)
│   │   ├── modules/        # 业务模块
│   │   └── prisma/         # Prisma 服务
│   └── prisma/             # 数据库 schema 和迁移
├── design/                 # 设计稿 (HTML 原型)
└── docs/                   # 项目文档
```

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 8
- Docker (用于本地数据库)
- 微信开发者工具 (用于小程序调试)

### 安装依赖

```bash
pnpm install
```

### 启动数据库

```bash
# 启动 MySQL + Redis 容器
pnpm docker:up

# 执行数据库迁移
pnpm db:migrate

# 填充种子数据 (可选)
pnpm db:seed
```

### 配置环境变量

```bash
# 复制后端环境变量模板
cp server/.env.example server/.env

# 编辑 server/.env 填入必要配置
# - DATABASE_URL
# - REDIS_HOST / REDIS_PORT
# - JWT_SECRET
# - WECHAT_APPID / WECHAT_SECRET
# - AI_API_KEY / AI_BASE_URL
```

### 启动开发服务器

```bash
# 终端 1: 启动后端
pnpm server:dev

# 终端 2: 启动前端 (H5 模式，推荐联调)
pnpm dev:h5

# 或启动微信小程序模式
pnpm dev:mp-weixin
```

## 开发命令

### 前端

| 命令                   | 说明                |
| ---------------------- | ------------------- |
| `pnpm dev:h5`          | H5 开发模式         |
| `pnpm dev:mp-weixin`   | 微信小程序开发模式  |
| `pnpm build:mp-weixin` | 构建微信小程序      |
| `pnpm type-check`      | TypeScript 类型检查 |

### 后端

| 命令                | 说明             |
| ------------------- | ---------------- |
| `pnpm server:dev`   | 开发模式 (watch) |
| `pnpm server:build` | 构建生产版本     |
| `pnpm server:start` | 启动生产服务器   |
| `pnpm server:lint`  | 代码检查和格式化 |

### 数据库

| 命令               | 说明               |
| ------------------ | ------------------ |
| `pnpm db:generate` | 生成 Prisma Client |
| `pnpm db:migrate`  | 执行数据库迁移     |
| `pnpm db:seed`     | 填充种子数据       |
| `pnpm db:studio`   | 打开 Prisma Studio |

### Docker

| 命令                | 说明                    |
| ------------------- | ----------------------- |
| `pnpm docker:up`    | 启动 MySQL + Redis 容器 |
| `pnpm docker:down`  | 停止并删除容器          |
| `pnpm docker:start` | 启动已存在的容器        |
| `pnpm docker:stop`  | 停止容器                |
| `pnpm docker:logs`  | 查看容器日志            |

## 核心功能模块

### 后端模块

| 模块          | 说明                      |
| ------------- | ------------------------- |
| `user`        | 用户管理、微信登录        |
| `dream`       | 梦境记录 CRUD、日历视图   |
| `analysis`    | AI 梦境解析               |
| `task`        | 改运任务生成与完成        |
| `points`      | 积分系统                  |
| `vip`         | 会员订阅与权益            |
| `explore`     | 探索广场 (公开梦境、点赞) |
| `polish`      | 梦境润色 (AI 改写)        |
| `version`     | 梦境版本管理              |
| `achievement` | 成就系统                  |

### 前端页面

| 页面     | 路径                  | 说明                     |
| -------- | --------------------- | ------------------------ |
| 首页     | `/pages/index`        | 今日记梦入口、连续天数   |
| 记录     | `/pages/record`       | 输入梦境内容、标签、情绪 |
| 结果     | `/pages/result`       | AI 解析结果、改运任务    |
| 详情     | `/pages/dream-detail` | 查看历史梦境             |
| 个人中心 | `/pages/profile`      | 梦境日历、成就、统计     |
| 探索     | `/pages/explore`      | 浏览公开梦境             |
| 会员     | `/pages/vip`          | 会员套餐与权益           |

## API 文档

后端启动后访问 Swagger 文档：

```
http://localhost:3333/api/docs
```

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

# PM2 启动
pm2 start server/dist/main.js --name drim-server

# 或 Docker 部署
cd server && docker build -t drim-server .
docker run -p 3000:3000 drim-server
```

## 文档

- [产品架构设计](docs/01-产品架构设计.md)
- [技术架构设计](docs/02-技术架构设计.md)
- [API 接口设计](docs/03-API接口设计.md)
- [数据库设计](docs/04-数据库设计.md)
- [前端开发指南](docs/05-前端开发指南.md)

## License

Private - All Rights Reserved
