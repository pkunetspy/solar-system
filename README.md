# 太阳系 3D 可视化 - TypeScript 版本

使用 Three.js 和 TypeScript 构建的交互式 3D 太阳系可视化项目，具有真实的日冕光晕效果。

## 🚀 快速开始

### 🎮 一键启动（推荐）

#### macOS / Linux
```bash
# 一键启动（自动检测依赖、编译、启动服务器、打开浏览器）
./play.sh
```

#### Windows
```bash
# 一键启动（双击运行或命令行）
play.bat
```

#### 跨平台 npm 命令
```bash
# 使用 npm 一键启动
npm run play
# 或者使用 start 命令
npm start
```

### 🛠️ 开发者模式

#### macOS / Linux
```bash
# 启动开发模式（自动编译 + 本地服务器）
./dev.sh
```

#### Windows
```bash
# 启动开发模式（自动编译 + 本地服务器）
./dev.bat
```

### 📦 手动构建（跨平台）

```bash
# 编译 TypeScript
npm run build

# 启动本地服务器
npm run serve
```

### 👀 监听模式

```bash
# 监听文件变化并自动编译
npm run dev
```

## 📁 项目结构

```
SolarSystem/
├── src/
│   ├── solar-system.ts    # 主要的太阳系类（TypeScript）
│   └── types/
│       └── index.ts       # TypeScript 类型定义
├── dist/                  # 编译后的 JavaScript 文件
├── scripts/               # 跨平台启动脚本
│   └── play.js           # Node.js 启动脚本
├── index.html             # 主页面
├── tsconfig.json          # TypeScript 配置
├── package.json           # 项目依赖和脚本
├── play.sh               # Unix/Linux 一键启动脚本
├── play.bat              # Windows 一键启动脚本
├── dev.sh                 # Unix/Linux 开发启动脚本
└── dev.bat                # Windows 开发启动脚本
```

## 🛠️ 技术栈

- **TypeScript** - 类型安全的 JavaScript
- **Three.js** - 3D 图形库 (v0.152.2)
- **ES Modules** - 现代模块系统
- **Import Maps** - 浏览器原生模块解析
- **自定义着色器** - 真实日冕光晕效果

## ✨ 功能特性

- 🌟 **双时间模式**：实时观察和加速动画之间切换
- 🔭 **精确轨道**：基于真实天文数据的椭圆轨道
- ☀️ **真实日冕光晕**：使用自定义着色器的动态光晕效果
- 🎯 **智能缩放**：可调节的天体尺寸比例
- 🏷️ **动态标签**：跟随天体移动的名称标签
- 💫 **小行星带**：1200个独立小行星的真实分布
- ⌨️ **键盘控制**：空格键暂停/继续动画
- 📱 **响应式设计**：支持不同屏幕尺寸
- 🎬 **Billboard 技术**：光晕从任何角度都显示正面效果

## 🎮 控制说明

- **鼠标左键拖拽**：旋转视角
- **鼠标滚轮**：缩放
- **鼠标右键拖拽**：平移
- **空格键**：在运动模式下暂停/继续
- **切换按钮**：在静态模式和运动模式之间切换

## 🌞 太阳日冕效果

本项目实现了真实的太阳日冕光晕效果：

- **Billboard 渲染**：使用平面几何体始终面向摄像机
- **动态边界**：噪声函数模拟日冕抛射的不规则形状
- **径向渐变**：从内层橙黄色到外层淡黄色的自然过渡
- **透明度衰减**：从太阳表面向外逐渐透明
- **实时动画**：边界形状随时间动态变化

## 🔧 开发说明

### 跨平台支持

#### Windows 环境
- 使用 `dev.bat` 启动开发环境
- 自动编译 TypeScript 并启动 Python 服务器
- 兼容 Windows 命令行和 PowerShell

#### macOS / Linux 环境
- 使用 `dev.sh` 启动开发环境
- Bash 脚本支持，与原有开发流程一致

### TypeScript 配置

项目使用严格的 TypeScript 配置，包括：
- 严格类型检查
- 未使用变量检查
- 准确的可选属性类型
- 源码映射支持
- 统一的编译输出路径

### 类型定义

主要类型定义在 `src/types/index.ts` 中：
- `CelestialBodyData` - 天体数据接口
- `CelestialDataCollection` - 天体集合接口
- `TimeMode` - 时间模式类型
- `Vector3D` - 3D 向量接口

### 构建系统

- TypeScript 编译到 `dist/` 目录
- ES2020 模块目标
- 支持 Three.js 类型定义
- 自动生成声明文件
- 跨平台路径兼容性

## 📊 天体数据

所有天体数据基于真实的天文参数：
- 轨道要素（半长轴、偏心率、倾斜角等）
- 物理属性（半径、颜色）
- 旋转周期
- J2000.0 历元参考

## 🌌 坐标系统

使用黄道坐标系进行天体位置计算，并转换到 Three.js 的右手坐标系用于渲染。

## 🚀 用户使用说明

### 💡 普通用户（推荐）
1. **下载项目**
2. **双击运行对应平台的启动文件**：
   - macOS/Linux: 双击 `play.sh` 或在终端运行 `./play.sh`
   - Windows: 双击 `play.bat`
3. **等待自动完成**：脚本会自动检测环境、安装依赖、编译代码、启动服务器并打开浏览器
4. **开始探索太阳系**！

### 🔧 开发者使用
使用 `dev.sh` / `dev.bat` 进行开发，或使用 `npm run dev` 进行文件监听模式开发。

## 📋 系统要求

- 现代浏览器（支持 ES Modules、Import Maps 和 WebGL）
- Node.js 和 npm（用于依赖管理）
- TypeScript 编译器（通过 npm 安装）
- Python 3（用于本地开发服务器）

### 浏览器支持
- Chrome 89+
- Firefox 87+
- Safari 15+
- Edge 89+

## 🤝 开发贡献

1. 修改 TypeScript 源码在 `src/` 目录
2. 运行对应平台的开发脚本或 `npm run build` 编译
3. 测试功能
4. 提交更改

## 🆕 更新日志

### 最新版本
- ✅ 实现真实太阳日冕光晕效果
- ✅ 添加 Windows 平台开发支持
- ✅ 重构项目结构，统一类型定义位置
- ✅ 修复跨平台编译路径兼容性问题
- ✅ 使用 Billboard 技术实现横截面视觉效果