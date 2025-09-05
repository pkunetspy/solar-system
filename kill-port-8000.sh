#!/bin/bash

# 杀掉端口8000进程的便捷脚本

echo "🔍 查找占用端口8000的进程..."

# 查找占用端口8000的进程
PIDS=$(lsof -ti :8000)

if [ -z "$PIDS" ]; then
    echo "✅ 端口8000没有被占用"
    exit 0
fi

echo "🎯 找到以下进程占用端口8000:"
lsof -i :8000

echo ""
echo "🛑 正在杀掉这些进程..."

# 杀掉所有占用端口8000的进程
for PID in $PIDS; do
    echo "杀掉进程 PID: $PID"
    kill -9 $PID 2>/dev/null
done

# 等待一秒让进程完全关闭
sleep 1

# 再次检查
REMAINING=$(lsof -ti :8000)
if [ -z "$REMAINING" ]; then
    echo "✅ 端口8000已成功释放"
else
    echo "⚠️  仍有进程占用端口8000，可能需要手动处理"
    lsof -i :8000
fi