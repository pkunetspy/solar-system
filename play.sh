#!/bin/bash

# 太阳系3D可视化 - 一键启动脚本
# Solar System 3D Visualization - One-click launch script

set -e

echo "🌟 太阳系3D可视化启动中..."
echo "🌟 Starting Solar System 3D Visualization..."
echo ""

# 检查 Node.js 和 npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装。请先安装 Node.js: https://nodejs.org/"
    echo "❌ Node.js not found. Please install Node.js: https://nodejs.org/"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装。请先安装 npm。"
    echo "❌ npm not found. Please install npm."
    exit 1
fi

# 检查 Python3
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 未安装。请先安装 Python 3: https://www.python.org/"
    echo "❌ Python 3 not found. Please install Python 3: https://www.python.org/"
    exit 1
fi

# 检查端口8000是否被占用
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  端口 8000 已被占用，正在尝试关闭..."
    echo "⚠️  Port 8000 is in use, attempting to free it..."
    
    # 尝试杀死占用端口的进程
    pkill -f "python.*http.server.*8000" 2>/dev/null || true
    sleep 2
    
    # 再次检查
    if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo "❌ 无法释放端口 8000，请手动关闭占用该端口的程序"
        echo "❌ Cannot free port 8000, please manually close the program using this port"
        exit 1
    fi
fi

# 检查是否存在 node_modules，如果不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装项目依赖..."
    echo "📦 Installing project dependencies..."
    npm install
    echo ""
fi

# 编译 TypeScript
echo "🔨 编译 TypeScript 代码..."
echo "🔨 Compiling TypeScript code..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ TypeScript 编译失败"
    echo "❌ TypeScript compilation failed"
    exit 1
fi

echo "✅ 编译完成"
echo "✅ Compilation completed"
echo ""

# 启动服务器（后台运行）
echo "🚀 启动本地服务器..."
echo "🚀 Starting local server..."
npm run serve &
SERVER_PID=$!

# 等待服务器启动
echo "⏳ 等待服务器启动（3秒）..."
echo "⏳ Waiting for server to start (3 seconds)..."
sleep 3

# 检查服务器是否正常运行
if ! kill -0 $SERVER_PID 2>/dev/null; then
    echo "❌ 服务器启动失败"
    echo "❌ Server failed to start"
    exit 1
fi

# 打开浏览器
URL="http://localhost:8000"
echo "🌐 正在打开浏览器..."
echo "🌐 Opening browser..."

# 根据操作系统选择打开命令
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "$URL"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open "$URL"
    elif command -v firefox &> /dev/null; then
        firefox "$URL" &
    elif command -v google-chrome &> /dev/null; then
        google-chrome "$URL" &
    elif command -v chromium &> /dev/null; then
        chromium "$URL" &
    else
        echo "⚠️  无法自动打开浏览器，请手动访问: $URL"
        echo "⚠️  Cannot open browser automatically, please visit manually: $URL"
    fi
else
    echo "⚠️  无法自动打开浏览器，请手动访问: $URL"
    echo "⚠️  Cannot open browser automatically, please visit manually: $URL"
fi

echo ""
echo "✨ 太阳系3D可视化已启动！"
echo "✨ Solar System 3D Visualization is now running!"
echo ""
echo "📍 访问地址: $URL"
echo "📍 URL: $URL"
echo ""
echo "💡 控制说明："
echo "💡 Controls:"
echo "   • 鼠标左键拖拽: 旋转视角 / Left click + drag: Rotate view"
echo "   • 鼠标滚轮: 缩放 / Mouse wheel: Zoom"
echo "   • 鼠标右键拖拽: 平移 / Right click + drag: Pan"
echo "   • 空格键: 暂停/继续动画 / Space: Pause/Resume animation"
echo "   • 切换按钮: 静态/运动模式 / Toggle button: Static/Motion mode"
echo ""
echo "⚠️  关闭此窗口将停止服务器"
echo "⚠️  Closing this window will stop the server"
echo ""
echo "🛑 按 Ctrl+C 停止服务器"
echo "🛑 Press Ctrl+C to stop the server"

# 保持脚本运行，监听 Ctrl+C
trap 'echo ""; echo "🛑 正在停止服务器..."; echo "🛑 Stopping server..."; kill $SERVER_PID 2>/dev/null; echo "✅ 服务器已停止"; echo "✅ Server stopped"; exit 0' INT

# 等待服务器进程
wait $SERVER_PID