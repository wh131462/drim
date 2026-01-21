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
- API 地址: http://localhost:3000/api/v1
- Swagger 文档: http://localhost:3000/api/docs

## API 模块

| 模块 | 路由前缀 | 说明 |
|------|----------|------|
| 用户 | `/user` | 登录、用户信息、统计 |
| 梦境 | `/dream` | 创建、列表、详情、日历 |
| 解析 | `/analysis` | 请求解析、获取结果 |
| 任务 | `/task` | 今日任务、完成、历史 |
| 积分 | `/points` | 积分记录 |
| 会员 | `/vip` | 会员信息、订单 |

## 环境变量说明

| 变量 | 说明 | 示例 |
|------|------|------|
| PORT | 服务端口 | 3000 |
| DATABASE_URL | MySQL连接 | mysql://user:pass@localhost:3306/drim |
| REDIS_HOST | Redis地址 | localhost |
| JWT_SECRET | JWT密钥 | your-secret-key |
| WECHAT_APPID | 微信AppID | wxXXXXXX |
| WECHAT_SECRET | 微信Secret | XXXXXX |
| AI_API_KEY | AI模型Key | sk-XXXXX |

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

## 部署

### Docker 部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

### 环境要求

- Node.js >= 18
- MySQL >= 8.0
- Redis >= 7.0
