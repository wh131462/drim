#!/bin/bash
# 清理指定端口的占用进程（自动识别 Docker 容器）

PORT=${1:-3333}

echo "Checking port $PORT..."

PIDS=$(lsof -ti :"$PORT" 2>/dev/null)

if [ -z "$PIDS" ]; then
  echo "Port $PORT is free."
  exit 0
fi

# Docker 可用时，优先通过 docker stop 处理容器占用
if command -v docker &>/dev/null && docker info &>/dev/null 2>&1; then
  CONTAINER_ID=$(docker ps --filter "publish=$PORT" --format '{{.ID}}' 2>/dev/null)
  if [ -n "$CONTAINER_ID" ]; then
    CONTAINER_NAME=$(docker ps --filter "publish=$PORT" --format '{{.Names}}' 2>/dev/null)
    echo "Port $PORT is occupied by container: $CONTAINER_NAME"
    docker stop "$CONTAINER_ID" >/dev/null 2>&1
    docker rm "$CONTAINER_ID" >/dev/null 2>&1
    echo "Container $CONTAINER_NAME stopped."
    exit 0
  fi
fi

# 非 Docker 进程：先 SIGTERM，再 SIGKILL
echo "Found processes on port $PORT: $PIDS"

for PID in $PIDS; do
  kill "$PID" 2>/dev/null
done
sleep 1

REMAINING=$(lsof -ti :"$PORT" 2>/dev/null)
if [ -n "$REMAINING" ]; then
  for PID in $REMAINING; do
    kill -9 "$PID" 2>/dev/null
  done
  sleep 1
fi

if lsof -ti :"$PORT" >/dev/null 2>&1; then
  echo "Warning: Port $PORT is still occupied!"
  exit 1
fi

echo "Port $PORT is now free."
