#!/bin/bash

# 生产环境运维脚本（部署和密钥下发由 GitHub Actions 完成）
# 用法: ./scripts/deploy.sh [命令]
# 命令:
#   logs     - 查看日志
#   status   - 查看状态
#   migrate  - 执行数据库迁移

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

case "${1:-status}" in
    logs)
        docker logs -f "${2:-drim-api}"
        ;;

    status)
        docker ps --filter name=drim-api --filter name=drim-mysql
        docker stats --no-stream drim-api drim-mysql
        ;;

    migrate)
        log_info "执行数据库迁移..."
        docker exec -it drim-api npx prisma migrate deploy
        ;;

    *)
        log_error "部署和更新请在 GitHub Actions 中执行"
        echo "用法: $0 {logs|status|migrate}"
        exit 1
        ;;
esac
