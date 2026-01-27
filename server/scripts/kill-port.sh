#!/bin/bash
# 清理指定端口的占用进程

PORT=${1:-3333}

echo "Checking port $PORT..."

# 获取占用端口的进程 PID
PIDS=$(lsof -ti :$PORT 2>/dev/null)

if [ -z "$PIDS" ]; then
  echo "Port $PORT is free."
  exit 0
fi

echo "Found processes on port $PORT: $PIDS"

# 终止进程
for PID in $PIDS; do
  echo "Killing process $PID..."
  kill -9 $PID 2>/dev/null
done

# 等待一下确保端口释放
sleep 1

# 验证端口是否已释放
if lsof -ti :$PORT >/dev/null 2>&1; then
  echo "Warning: Port $PORT is still occupied!"
  exit 1
else
  echo "Port $PORT is now free."
  exit 0
fi
