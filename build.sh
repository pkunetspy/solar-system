#!/bin/bash

# TypeScript 编译脚本
echo "正在编译 TypeScript..."

# 检查是否安装了 TypeScript
if ! command -v tsc &> /dev/null; then
    echo "TypeScript 编译器未找到，正在安装..."
    npm install -g typescript
fi

# 编译 TypeScript
tsc

if [ $? -eq 0 ]; then
    echo "✅ TypeScript 编译成功！"
    echo "📁 编译后的文件在 dist/ 目录中"
    echo "🌐 现在可以在浏览器中打开 index.html"
else
    echo "❌ TypeScript 编译失败"
    exit 1
fi