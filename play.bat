@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

REM 太阳系3D可视化 - 一键启动脚本
REM Solar System 3D Visualization - One-click launch script

echo 🌟 太阳系3D可视化启动中...
echo 🌟 Starting Solar System 3D Visualization...
echo.

REM 检查 Node.js 和 npm
where node >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js 未安装。请先安装 Node.js: https://nodejs.org/
    echo ❌ Node.js not found. Please install Node.js: https://nodejs.org/
    pause
    exit /b 1
)

where npm >nul 2>&1
if errorlevel 1 (
    echo ❌ npm 未安装。请先安装 npm。
    echo ❌ npm not found. Please install npm.
    pause
    exit /b 1
)

REM 检查 Python 3
where python >nul 2>&1
if errorlevel 1 (
    where python3 >nul 2>&1
    if errorlevel 1 (
        echo ❌ Python 3 未安装。请先安装 Python 3: https://www.python.org/
        echo ❌ Python 3 not found. Please install Python 3: https://www.python.org/
        pause
        exit /b 1
    ) else (
        set PYTHON_CMD=python3
    )
) else (
    set PYTHON_CMD=python
)

REM 检查端口8000是否被占用
netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
if not errorlevel 1 (
    echo ⚠️  端口 8000 已被占用，正在尝试关闭...
    echo ⚠️  Port 8000 is in use, attempting to free it...
    
    REM 尝试杀死占用端口的进程
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
        taskkill /PID %%a /F >nul 2>&1
    )
    
    timeout /t 2 /nobreak >nul
    
    REM 再次检查
    netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
    if not errorlevel 1 (
        echo ❌ 无法释放端口 8000，请手动关闭占用该端口的程序
        echo ❌ Cannot free port 8000, please manually close the program using this port
        pause
        exit /b 1
    )
)

REM 检查是否存在 node_modules，如果不存在则安装依赖
if not exist "node_modules" (
    echo 📦 安装项目依赖...
    echo 📦 Installing project dependencies...
    call npm install
    if errorlevel 1 (
        echo ❌ 依赖安装失败
        echo ❌ Dependencies installation failed
        pause
        exit /b 1
    )
    echo.
)

REM 编译 TypeScript
echo 🔨 编译 TypeScript 代码...
echo 🔨 Compiling TypeScript code...
call npm run build

if errorlevel 1 (
    echo ❌ TypeScript 编译失败
    echo ❌ TypeScript compilation failed
    pause
    exit /b 1
)

echo ✅ 编译完成
echo ✅ Compilation completed
echo.

REM 启动服务器（后台运行）
echo 🚀 启动本地服务器...
echo 🚀 Starting local server...

REM 创建临时的VBS脚本来后台运行服务器
echo Set WshShell = CreateObject("WScript.Shell") > temp_server.vbs
echo WshShell.Run "%PYTHON_CMD% -m http.server 8000", 0, False >> temp_server.vbs

REM 运行VBS脚本启动服务器
cscript //nologo temp_server.vbs

REM 删除临时文件
del temp_server.vbs

REM 等待服务器启动
echo ⏳ 等待服务器启动（3秒）...
echo ⏳ Waiting for server to start (3 seconds)...
timeout /t 3 /nobreak >nul

REM 打开浏览器
set URL=http://localhost:8000
echo 🌐 正在打开浏览器...
echo 🌐 Opening browser...

start "" "%URL%"

echo.
echo ✨ 太阳系3D可视化已启动！
echo ✨ Solar System 3D Visualization is now running!
echo.
echo 📍 访问地址: %URL%
echo 📍 URL: %URL%
echo.
echo 💡 控制说明：
echo 💡 Controls:
echo    • 鼠标左键拖拽: 旋转视角 / Left click + drag: Rotate view
echo    • 鼠标滚轮: 缩放 / Mouse wheel: Zoom
echo    • 鼠标右键拖拽: 平移 / Right click + drag: Pan
echo    • 空格键: 暂停/继续动画 / Space: Pause/Resume animation
echo    • 切换按钮: 静态/运动模式 / Toggle button: Static/Motion mode
echo.
echo ⚠️  关闭此窗口将停止服务器
echo ⚠️  Closing this window will stop the server
echo.
echo 🛑 按任意键停止服务器并退出
echo 🛑 Press any key to stop the server and exit
pause >nul

REM 停止服务器
echo.
echo 🛑 正在停止服务器...
echo 🛑 Stopping server...

REM 杀死 Python HTTP 服务器进程
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8000 ^| findstr LISTENING') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo ✅ 服务器已停止
echo ✅ Server stopped