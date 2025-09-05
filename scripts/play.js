#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const isWindows = process.platform === 'win32';
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

console.log('🌟 太阳系3D可视化启动中...');
console.log('🌟 Starting Solar System 3D Visualization...');
console.log('');

// 检查依赖
function checkCommand(command, errorMessage) {
    return new Promise((resolve, reject) => {
        exec(`${command} --version`, (error) => {
            if (error) {
                console.log(`❌ ${errorMessage}`);
                reject(new Error(errorMessage));
            } else {
                resolve();
            }
        });
    });
}

// 检查端口是否被占用
function checkPort(port) {
    return new Promise((resolve) => {
        const cmd = isWindows 
            ? `netstat -an | findstr :${port} | findstr LISTENING`
            : `lsof -i :${port}`;
            
        exec(cmd, (error, stdout) => {
            resolve(!error && stdout.trim().length > 0);
        });
    });
}

// 杀死占用端口的进程
function killPortProcess(port) {
    return new Promise((resolve) => {
        if (isWindows) {
            exec(`for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /PID %a /F`, 
                (error) => {
                    setTimeout(resolve, 2000);
                }
            );
        } else {
            exec(`pkill -f "python.*http.server.*${port}"`, (error) => {
                setTimeout(resolve, 2000);
            });
        }
    });
}

// 安装依赖
function installDependencies() {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync('node_modules')) {
            console.log('📦 安装项目依赖...');
            console.log('📦 Installing project dependencies...');
            
            const npmProcess = spawn('npm', ['install'], { stdio: 'inherit' });
            npmProcess.on('close', (code) => {
                if (code === 0) {
                    console.log('');
                    resolve();
                } else {
                    reject(new Error('Dependencies installation failed'));
                }
            });
        } else {
            resolve();
        }
    });
}

// 构建项目
function buildProject() {
    return new Promise((resolve, reject) => {
        console.log('🔨 编译 TypeScript 代码...');
        console.log('🔨 Compiling TypeScript code...');
        
        const tscProcess = spawn('npm', ['run', 'build'], { stdio: 'inherit' });
        tscProcess.on('close', (code) => {
            if (code === 0) {
                console.log('✅ 编译完成');
                console.log('✅ Compilation completed');
                console.log('');
                resolve();
            } else {
                reject(new Error('TypeScript compilation failed'));
            }
        });
    });
}

// 启动服务器
function startServer() {
    return new Promise((resolve, reject) => {
        console.log('🚀 启动本地服务器...');
        console.log('🚀 Starting local server...');
        
        const pythonCmd = isWindows ? 'python' : 'python3';
        const serverProcess = spawn(pythonCmd, ['-m', 'http.server', '8000'], {
            stdio: 'pipe'
        });
        
        serverProcess.on('error', (error) => {
            // 尝试使用 python3 命令
            if (isWindows && pythonCmd === 'python') {
                const fallbackProcess = spawn('python3', ['-m', 'http.server', '8000'], {
                    stdio: 'pipe'
                });
                fallbackProcess.on('error', () => {
                    reject(new Error('Python server failed to start'));
                });
                fallbackProcess.on('spawn', () => {
                    resolve(fallbackProcess);
                });
            } else {
                reject(new Error('Python server failed to start'));
            }
        });
        
        serverProcess.on('spawn', () => {
            resolve(serverProcess);
        });
    });
}

// 打开浏览器
function openBrowser(url) {
    const command = isMacOS ? 'open' : isLinux ? 'xdg-open' : 'start';
    const args = isWindows ? ['', url] : [url];
    
    console.log('🌐 正在打开浏览器...');
    console.log('🌐 Opening browser...');
    
    exec(`${command} ${isWindows ? '""' : ''} "${url}"`, (error) => {
        if (error) {
            console.log(`⚠️  无法自动打开浏览器，请手动访问: ${url}`);
            console.log(`⚠️  Cannot open browser automatically, please visit manually: ${url}`);
        }
    });
}

// 主函数
async function main() {
    try {
        // 检查依赖
        await checkCommand('node', 'Node.js 未安装。请先安装 Node.js: https://nodejs.org/');
        await checkCommand('npm', 'npm 未安装。请先安装 npm。');
        
        // 检查 Python
        const pythonCmd = isWindows ? 'python' : 'python3';
        try {
            await checkCommand(pythonCmd, `Python 3 未安装。请先安装 Python 3: https://www.python.org/`);
        } catch (error) {
            if (isWindows) {
                await checkCommand('python3', 'Python 3 未安装。请先安装 Python 3: https://www.python.org/');
            } else {
                throw error;
            }
        }
        
        // 检查端口
        const portInUse = await checkPort(8000);
        if (portInUse) {
            console.log('⚠️  端口 8000 已被占用，正在尝试关闭...');
            console.log('⚠️  Port 8000 is in use, attempting to free it...');
            await killPortProcess(8000);
            
            const stillInUse = await checkPort(8000);
            if (stillInUse) {
                throw new Error('无法释放端口 8000，请手动关闭占用该端口的程序');
            }
        }
        
        // 安装依赖和构建
        await installDependencies();
        await buildProject();
        
        // 启动服务器
        const serverProcess = await startServer();
        
        // 等待服务器启动
        console.log('⏳ 等待服务器启动（3秒）...');
        console.log('⏳ Waiting for server to start (3 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // 打开浏览器
        const url = 'http://localhost:8000';
        openBrowser(url);
        
        console.log('');
        console.log('✨ 太阳系3D可视化已启动！');
        console.log('✨ Solar System 3D Visualization is now running!');
        console.log('');
        console.log(`📍 访问地址: ${url}`);
        console.log(`📍 URL: ${url}`);
        console.log('');
        console.log('💡 控制说明：');
        console.log('💡 Controls:');
        console.log('   • 鼠标左键拖拽: 旋转视角 / Left click + drag: Rotate view');
        console.log('   • 鼠标滚轮: 缩放 / Mouse wheel: Zoom');
        console.log('   • 鼠标右键拖拽: 平移 / Right click + drag: Pan');
        console.log('   • 空格键: 暂停/继续动画 / Space: Pause/Resume animation');
        console.log('   • 切换按钮: 静态/运动模式 / Toggle button: Static/Motion mode');
        console.log('');
        console.log('🛑 按 Ctrl+C 停止服务器');
        console.log('🛑 Press Ctrl+C to stop the server');
        console.log('');
        
        // 处理退出信号
        process.on('SIGINT', () => {
            console.log('');
            console.log('🛑 正在停止服务器...');
            console.log('🛑 Stopping server...');
            serverProcess.kill();
            console.log('✅ 服务器已停止');
            console.log('✅ Server stopped');
            process.exit(0);
        });
        
        // 监听服务器进程
        serverProcess.on('close', (code) => {
            if (code !== 0) {
                console.log(`服务器异常退出，代码: ${code}`);
            }
        });
        
    } catch (error) {
        console.log(`❌ ${error.message}`);
        process.exit(1);
    }
}

main();