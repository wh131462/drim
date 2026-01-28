#!/bin/bash

# 生产环境部署脚本
# 用法: ./scripts/deploy.sh [命令]
# 命令:
#   setup    - 首次部署设置（包含 SSL 证书申请）
#   update   - 更新镜像并重启
#   logs     - 查看日志
#   status   - 查看状态
#   down     - 停止服务
#   migrate  - 执行数据库迁移
#   ssl-init - 单独申请 SSL 证书
#   ssl-renew - 手动续期证书

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

# 初始化 SSL 证书
init_ssl() {
    log_info "初始化 SSL 证书..."

    # 使用初始化配置启动 nginx（仅 HTTP）
    log_info "使用临时配置启动 Nginx..."
    cp "$PROJECT_DIR/nginx/nginx.init.conf" "$PROJECT_DIR/nginx/nginx.conf.bak"
    cp "$PROJECT_DIR/nginx/nginx.init.conf" "$PROJECT_DIR/nginx/nginx.conf"

    docker compose -f "$COMPOSE_FILE" up -d nginx
    sleep 5

    # 申请证书
    log_info "申请 Let's Encrypt 证书..."
    echo "请输入接收证书通知的邮箱:"
    read CERTBOT_EMAIL

    # 使用 --entrypoint "" 覆盖 docker-compose 中的 entrypoint
    docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" certbot \
        certbot certonly \
        --webroot \
        --webroot-path=/var/www/certbot \
        --email "$CERTBOT_EMAIL" \
        --agree-tos \
        --no-eff-email \
        -d "$DOMAIN"

    # 恢复正式配置
    log_info "切换到正式 Nginx 配置..."
    cp "$PROJECT_DIR/nginx/nginx.conf.bak" "$PROJECT_DIR/nginx/nginx.conf.init.backup"

    # 重新读取原始的 HTTPS 配置
    cat > "$PROJECT_DIR/nginx/nginx.conf" << 'NGINXCONF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    upstream api {
        server api:3333;
        keepalive 32;
    }

    server {
        listen 80;
        server_name api.131462.cloud;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location /health {
            access_log off;
            return 200 'OK';
            add_header Content-Type text/plain;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    server {
        listen 443 ssl http2;
        server_name api.131462.cloud;

        ssl_certificate /etc/letsencrypt/live/api.131462.cloud/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.131462.cloud/privkey.pem;

        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;

        add_header Strict-Transport-Security "max-age=63072000" always;

        location /health {
            access_log off;
            return 200 'OK';
            add_header Content-Type text/plain;
        }

        location / {
            proxy_pass http://api;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Connection "";

            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            proxy_buffering on;
            proxy_buffer_size 4k;
            proxy_buffers 8 4k;
        }
    }
}
NGINXCONF

    # 重启 nginx 加载新配置
    docker compose -f "$COMPOSE_FILE" restart nginx

    log_info "SSL 证书配置完成!"
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

        # 拉取镜像
        log_info "拉取镜像..."
        docker compose -f "$COMPOSE_FILE" pull

        # 初始化 SSL
        init_ssl

        # 启动所有服务
        log_info "启动所有服务..."
        docker compose -f "$COMPOSE_FILE" up -d

        log_info "等待 MySQL 启动..."
        sleep 30

        log_info "执行数据库迁移..."
        docker exec -it drim-api npx prisma migrate deploy

        log_info "部署完成!"
        log_info "访问地址: https://$DOMAIN"
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

    ssl-init)
        check_env
        init_ssl
        ;;

    ssl-renew)
        log_info "续期 SSL 证书..."
        docker compose -f "$COMPOSE_FILE" run --rm --entrypoint "" certbot certbot renew
        docker compose -f "$COMPOSE_FILE" restart nginx
        log_info "证书续期完成!"
        ;;

    *)
        echo "用法: $0 {setup|update|logs|status|down|migrate|ssl-init|ssl-renew}"
        exit 1
        ;;
esac
