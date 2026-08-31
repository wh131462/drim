# 梦见小程序 - 后端服务

基于 NestJS + Prisma + MySQL 构建的后端 API 服务。

## 技术栈

- **框架**: NestJS 10.x
- **ORM**: Prisma 5.x
- **数据库**: MySQL 8.x
- **缓存**: Redis 7.x
- **语言**: TypeScript 5.x

## 项目结构

```
server/
├── src/
│   ├── common/              # 公共模块
│   │   ├── decorators/      # 自定义装饰器
│   │   ├── filters/         # 异常过滤器
│   │   ├── guards/          # 守卫
│   │   └── interceptors/    # 拦截器
│   │
│   ├── modules/             # 业务模块
│   │   ├── user/            # 用户模块
│   │   ├── dream/           # 梦境模块
│   │   ├── analysis/        # 解析模块
│   │   ├── task/            # 任务模块
│   │   ├── points/          # 积分模块
│   │   └── vip/             # 会员模块
│   │
│   ├── shared/              # 共享服务
│   │   ├── ai/              # AI服务
│   │   ├── cache/           # Redis缓存
│   │   └── wechat/          # 微信SDK
│   │
│   ├── prisma/              # Prisma服务
│   ├── app.module.ts
│   └── main.ts
│
├── prisma/
│   └── schema.prisma        # 数据库模型
│
├── .env.example             # 环境变量示例
├── package.json
└── tsconfig.json
```

## 快速开始

### 1. 安装依赖

```bash
cd server
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 文件，填入实际配置
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
npm run prisma:generate

# 执行数据库迁移
npm run prisma:migrate
```

### 4. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

服务启动后：

- API 地址: http://localhost:3333/api/v1
- Swagger 文档: http://localhost:3333/api/docs

## API 模块

| 模块 | 路由前缀    | 说明                   |
| ---- | ----------- | ---------------------- |
| 用户 | `/user`     | 登录、用户信息、统计   |
| 梦境 | `/dream`    | 创建、列表、详情、日历 |
| 解析 | `/analysis` | 请求解析、获取结果     |
| 任务 | `/task`     | 今日任务、完成、历史   |
| 积分 | `/points`   | 积分记录               |
| 会员 | `/vip`      | 会员信息、订单         |

## 环境变量说明

| 变量          | 说明       | 示例                                  |
| ------------- | ---------- | ------------------------------------- |
| PORT          | 服务端口   | 3333                                  |
| DATABASE_URL  | MySQL连接  | mysql://user:pass@localhost:3306/drim |
| REDIS_HOST    | Redis地址  | localhost                             |
| JWT_SECRET    | JWT密钥    | your-secret-key                       |
| WECHAT_APPID  | 微信AppID  | wxXXXXXX                              |
| WECHAT_SECRET | 微信Secret | XXXXXX                                |
| AI_API_KEY    | AI模型Key  | sk-XXXXX                              |

## 开发命令

```bash
# 开发模式
npm run start:dev

# 构建
npm run build

# 代码检查
npm run lint

# 单元测试
npm run test

# Prisma Studio (数据库管理)
npm run prisma:studio
```

## 只读管理后台

服务内置 AdminJS 管理后台，用于查看全库梦境统计、梦境列表、解析结果和用户信息。后台关闭新增、编辑和删除操作，并隐藏用户 OpenID、UnionID 和手机号。

本地开发时，在 `.env` 中配置以下三项后启用：

```bash
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=请设置独立强密码
ADMIN_COOKIE_SECRET=请设置至少32位的随机字符串
```

可通过 `openssl rand -base64 48` 生成 Cookie 密钥。启动后访问 `http://localhost:3333/admin`，生产环境访问 `${BASE_URL}/admin`。

管理后台包含梦境正文等敏感数据，建议额外使用防火墙、IP 白名单或 Cloudflare Access 限制访问。

## 部署

生产部署由 GitHub Actions 自动完成，服务器不再手工维护 `.env`。配置方法、完整 Secrets 清单、服务器前置条件和运维命令见 [DEPLOY.md](../DEPLOY.md)。

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Redis >= 7.0

## 前端联调指南

### API 响应格式

**成功响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": { ... },
  "timestamp": 1704067200000,
  "requestId": "uuid"
}
```

**错误响应：**

```json
{
    "code": 400,
    "message": "错误描述",
    "data": null,
    "timestamp": 1704067200000,
    "requestId": "uuid"
}
```

### 错误码说明

| 错误码 | 说明             |
| ------ | ---------------- |
| 0      | 成功             |
| 400    | 请求参数错误     |
| 401    | 未授权/Token过期 |
| 403    | 禁止访问         |
| 404    | 资源不存在       |
| 500    | 服务器内部错误   |

### 联调步骤

#### 1. 启动后端服务

```bash
cd server
pnpm install
pnpm start:dev
```

确认服务运行在 http://localhost:3333

#### 2. 配置前端 API 地址

在前端项目 `src/.env.development` 中：

```env
VITE_API_BASE_URL=http://localhost:3333/api/v1
VITE_USE_MOCK=false
```

#### 3. 启动前端项目

```bash
# 微信小程序开发
pnpm dev:mp-weixin

# H5 开发 (推荐用于联调)
pnpm dev:h5
```

#### 4. 使用 Mock 数据（离线开发）

如果暂时不启动后端，可在前端启用 Mock 模式：

```env
# src/.env.development
VITE_USE_MOCK=true
```

### 接口完整列表

#### 用户模块 `/user`

| 方法 | 路径          | 说明         | 认证 |
| ---- | ------------- | ------------ | ---- |
| POST | /login/wechat | 微信登录     | ❌   |
| GET  | /info         | 获取用户信息 | ✅   |
| PUT  | /info         | 更新用户信息 | ✅   |
| GET  | /stats        | 获取用户统计 | ✅   |

#### 梦境模块 `/dream`

| 方法   | 路径                   | 说明         | 认证 |
| ------ | ---------------------- | ------------ | ---- |
| POST   | /                      | 创建梦境     | ✅   |
| GET    | /                      | 获取梦境列表 | ✅   |
| GET    | /:id                   | 获取梦境详情 | ✅   |
| DELETE | /:id                   | 删除梦境     | ✅   |
| GET    | /calendar/:year/:month | 获取日历数据 | ✅   |

#### 解析模块 `/analysis`

| 方法 | 路径            | 说明         | 认证 |
| ---- | --------------- | ------------ | ---- |
| GET  | /:dreamId       | 获取解析结果 | ✅   |
| POST | /:dreamId/retry | 重新解析     | ✅   |

#### 任务模块 `/task`

| 方法 | 路径          | 说明         | 认证 |
| ---- | ------------- | ------------ | ---- |
| GET  | /today        | 获取今日任务 | ✅   |
| POST | /:id/complete | 完成任务     | ✅   |
| POST | /:id/double   | 看广告翻倍   | ✅   |

#### 积分模块 `/points`

| 方法 | 路径     | 说明         | 认证 |
| ---- | -------- | ------------ | ---- |
| GET  | /        | 获取积分信息 | ✅   |
| GET  | /records | 获取积分记录 | ✅   |

#### 会员模块 `/vip`

| 方法 | 路径       | 说明         | 认证 |
| ---- | ---------- | ------------ | ---- |
| GET  | /info      | 获取会员信息 | ✅   |
| POST | /order     | 创建会员订单 | ✅   |
| GET  | /order/:id | 查询订单状态 | ✅   |

### 请求头说明

```
Content-Type: application/json
Authorization: Bearer <token>
X-Platform: mp-weixin | h5 | app
X-Version: 1.0.0
```
