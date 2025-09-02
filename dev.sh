#!/bin/bash

# 开发模式启动脚本
echo "🚀 启动 TypeScript 太阳系项目开发模式..."

# 检查是否安装了 TypeScript
if ! command -v tsc &> /dev/null; then
    echo "TypeScript 编译器未找到，正在安装..."
    npm install -g typescript
fi

echo "📦 编译 TypeScript..."
tsc

if [ $? -eq 0 ]; then
    echo "✅ TypeScript 编译成功！"
    
    # 启动本地服务器
    echo "🌐 启动本地开发服务器..."
    echo "📱 在浏览器中访问: http://localhost:8000"
    echo "⏹️  按 Ctrl+C 停止服务器"
    
    python3 -m http.server 8000
else
    echo "❌ TypeScript 编译失败"
    exit 1
fi