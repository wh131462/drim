#!/bin/bash

# 生产环境部署脚本（依赖服务器上已有的 Traefik 共享反向代理）
# 用法: ./scripts/deploy.sh [命令]
# 命令:
#   setup    - 首次部署设置
#   update   - 更新镜像并重启
#   logs     - 查看日志
#   status   - 查看状态
#   down     - 停止服务
#   migrate  - 执行数据库迁移

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
DOMAIN="api.131462.cloud"

cd "$PROJECT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查 .env 文件
check_env() {
    if [ ! -f "$PROJECT_DIR/.env" ]; then
        log_error ".env 文件不存在"
        log_info "请复制 .env.example 为 .env 并填入配置"
        exit 1
    fi
}

# 登录 GitHub Container Registry
login_ghcr() {
    log_info "请输入 GitHub Personal Access Token (需要 read:packages 权限):"
    read -s GITHUB_TOKEN
    echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$GITHUB_ACTOR" --password-stdin
    log_info "登录成功"
}

case "${1:-update}" in
    setup)
        log_info "首次部署设置..."

        # 检查 .env
        if [ ! -f "$PROJECT_DIR/.env" ]; then
            log_info "创建 .env 文件..."
            cp "$PROJECT_DIR/.env.example" "$PROJECT_DIR/.env"
            log_warn "请编辑 .env 文件填入实际配置后重新运行 ./scripts/deploy.sh setup"
            exit 0
        fi

        # 登录 GHCR
        log_info "登录 GitHub Container Registry..."
        echo "请输入 GitHub 用户名:"
        read GITHUB_ACTOR
        login_ghcr

        # 拉取并启动所有服务
        log_info "拉取镜像..."
        docker compose -f "$COMPOSE_FILE" pull

        log_info "启动所有服务..."
        docker compose -f "$COMPOSE_FILE" up -d

        log_info "等待 MySQL 启动..."
        sleep 30

        log_info "执行数据库迁移..."
        docker exec -it drim-api npx prisma migrate deploy

        log_info "部署完成! TLS 由 Traefik 自动签发，访问地址: https://$DOMAIN"
        docker compose -f "$COMPOSE_FILE" ps
        ;;

    update)
        check_env
        log_info "更新镜像..."
        docker compose -f "$COMPOSE_FILE" pull api

        log_info "重启 API 服务..."
        docker compose -f "$COMPOSE_FILE" up -d api

        log_info "更新完成!"
        docker compose -f "$COMPOSE_FILE" ps
        ;;

    logs)
        docker compose -f "$COMPOSE_FILE" logs -f "${2:-}"
        ;;

    status)
        docker compose -f "$COMPOSE_FILE" ps
        docker stats --no-stream
        ;;

    down)
        log_info "停止服务..."
        docker compose -f "$COMPOSE_FILE" down
        ;;

    migrate)
        log_info "执行数据库迁移..."
        docker exec -it drim-api npx prisma migrate deploy
        ;;

    *)
        echo "用法: $0 {setup|update|logs|status|down|migrate}"
        exit 1
        ;;
esac
