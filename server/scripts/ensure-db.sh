#!/bin/bash
# 确保 MySQL 容器已启动并可连接

CONTAINER_NAME="drim-mysql"
MAX_WAIT=30

# 检查 Docker 是否可用
if ! command -v docker &>/dev/null; then
  echo "Error: docker not found"
  exit 1
fi

if ! docker info &>/dev/null 2>&1; then
  echo "Docker is not running, attempting to start..."
  open -a Docker
  # 等待 Docker 启动
  for i in $(seq 1 $MAX_WAIT); do
    if docker info &>/dev/null 2>&1; then
      echo "Docker is ready."
      break
    fi
    if [ "$i" -eq $MAX_WAIT ]; then
      echo "Error: Docker failed to start within ${MAX_WAIT}s"
      exit 1
    fi
    sleep 1
  done
fi

# 检查 MySQL 容器状态
STATUS=$(docker inspect -f '{{.State.Status}}' "$CONTAINER_NAME" 2>/dev/null)

if [ "$STATUS" = "running" ]; then
  echo "MySQL container is already running."
else
  echo "Starting MySQL container..."
  docker compose up mysql -d
fi

# 等待 MySQL 健康检查通过
echo "Waiting for MySQL to be ready..."
for i in $(seq 1 $MAX_WAIT); do
  HEALTH=$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER_NAME" 2>/dev/null)
  if [ "$HEALTH" = "healthy" ]; then
    echo "MySQL is ready."
    exit 0
  fi
  sleep 1
done

echo "Warning: MySQL health check did not pass within ${MAX_WAIT}s, proceeding anyway."
