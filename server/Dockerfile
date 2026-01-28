# 构建阶段
FROM node:18-alpine AS builder

WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN pnpm prisma:generate

# 构建
RUN pnpm build

# 生产阶段
FROM node:18-alpine AS production

WORKDIR /app

# 复制 package.json（运行时可能需要）
COPY package.json ./

# 从构建阶段复制 node_modules（包含 Prisma Client）
COPY --from=builder /app/node_modules ./node_modules

# 从构建阶段复制编译后的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3333

# 启动命令
CMD ["node", "dist/main"]
