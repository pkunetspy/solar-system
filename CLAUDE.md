# CLAUDE.md

该文件为 Claude Code (claude.ai/code) 在此代码库中工作时提供指导，每次进行代码修改之后应该主动同步本文件以及 README.md 文件中的相关内容。

## 项目概述

这是一个使用 TypeScript、Three.js 构建的交互式 3D 太阳系可视化项目，该项目使用准确的天文数据来尽可能模拟真实的太阳系。项目已完全重构为模块化的 TypeScript 架构，提供完整的类型安全和现代化开发体验。

## 技术栈

- **TypeScript** - 完整类型安全的开发体验
- **Three.js** - 3D 图形渲染库 (v0.152.2)
- **ES2020 模块** - 现代化模块系统
- **Import Maps** - 浏览器原生模块解析

## 运行方法

### 用户模式（推荐）
```bash
# 一键启动（自动处理所有步骤并打开浏览器）
./play.sh          # macOS/Linux
play.bat            # Windows
npm run play        # 跨平台
```

### 开发模式
```bash
# 启动开发模式（自动编译 + 本地服务器）
./dev.sh            # macOS/Linux
./dev.bat           # Windows

# 或者手动步骤
npm run build       # 编译 TypeScript
npm run serve       # 启动本地服务器
```

### 便捷开发命令
```bash
npm run kill-port   # 杀掉占用8000端口的进程
npm run restart     # 重启服务器（杀掉旧进程并启动新的）
```

## 项目结构

### 重构后的模块化架构
```
SolarSystem/
├── src/
│   ├── solar-system.ts       # 主协调类 (127行)
│   ├── data/
│   │   └── celestialData.ts  # 天体数据和配置
│   ├── utils/
│   │   └── orbitalMath.ts    # 轨道计算工具
│   ├── systems/
│   │   ├── timeSystem.ts     # 时间系统管理
│   │   ├── renderSystem.ts   # 渲染系统管理
│   │   └── closeViewSystem.ts # 近景浏览系统管理
│   ├── objects/
│   │   └── celestialObjects.ts # 天体对象创建
│   ├── effects/
│   │   └── sunEffects.ts     # 太阳光晕效果
│   └── types/
│       └── index.ts          # TypeScript 类型定义
├── dist/                     # 编译输出目录
├── scripts/
│   └── play.js              # 跨平台启动脚本
├── index.html               # 主页面（使用 ES 模块）
├── tsconfig.json            # TypeScript 配置
├── package.json             # 项目依赖和脚本
├── kill-port-8000.sh        # 端口管理脚本
├── play.sh/play.bat         # 一键启动脚本
├── dev.sh/dev.bat           # 开发启动脚本
└── README.md               # 项目文档
```

### 模块职责划分

**主协调类** (`src/solar-system.ts`)：轻量级协调器，管理各模块协作
- 初始化各个系统模块
- 协调动画循环
- 管理天体位置更新

**数据层** (`src/data/celestialData.ts`)：集中管理配置数据
- 天体物理数据（半径、颜色、轨道参数等）
- 缩放因子配置
- J2000历元常量

**工具层** (`src/utils/orbitalMath.ts`)：纯函数计算工具
- 椭圆轨道位置计算
- 天体自转角度计算
- 轨道路径生成

**系统层** (`src/systems/`)：核心功能模块
- `timeSystem.ts`: 双时间模式、暂停控制、UI管理
- `renderSystem.ts`: Three.js场景管理、相机控制、标签系统
- `closeViewSystem.ts`: 近景浏览、自定义相机控制、动态几何体分辨率

**对象层** (`src/objects/celestialObjects.ts`)：3D对象创建与管理
- 太阳、行星、月球创建
- 小行星带生成
- 轨道线条创建

**效果层** (`src/effects/sunEffects.ts`)：视觉效果
- 太阳日冕光晕效果
- 着色器程序管理

## 核心架构

### 模块化设计原则
1. **单一责任原则**：每个模块只负责一个特定功能
2. **依赖注入**：通过构造函数传递依赖，便于测试
3. **接口隔离**：清晰的公共API，隐藏内部实现
4. **开闭原则**：易于扩展新功能，无需修改现有代码

### 数据结构
**celestialData 对象**：包含所有天体的真实天文数据
- 物理属性（半径、颜色）
- 轨道参数（距离、周期、偏心率、倾斜角）
- 旋转数据（自转周期）
- 显示调整（气态巨行星的尺寸调整）

### 时间系统架构
两种不同的时间模式：
- **静态模式**：基于 `Date.now()` 的实时时间，行星运动最小
- **动画模式**：加速时间（1秒 = 1周），戏剧性的运动可视化

时间计算通过 `TimeSystem.getSimulationTime()` 方法处理，所有天体对象更新都引用该方法。

### 轨道数学
使用真实的椭圆轨道计算：
1. 基于轨道周期的平均近点角计算
2. 通过牛顿迭代求解偏心近点角
3. 计算真近点角以获得实际位置
4. 使用轨道倾斜变换进行 3D 定位

### 渲染优化
- 禁用阴影系统以防止太空环境中的视觉伪影
- 使用屏幕空间投影的动态标签定位
- 小行星带使用实例化几何体方法以提高性能
- TypeScript 类型检查确保运行时稳定性

## 关键特性

**双时间模式**：在实时观察和加速动画之间切换
**精确轨道**：具有真实偏心率值的真椭圆路径
**智能缩放**：具有可见性调整的比例天体尺寸
**动态标签**：行星名称跟随天体并处理遮挡
**小行星带**：1200个独立小行星，具有真实分布和运动
**空格键控制**：在动画模式下按空格键可暂停/继续时间演进
**近景浏览系统**：点击天体进入沉浸式近距离观察模式
**自定义相机控制**：球坐标控制系统，解决OrbitControls在近景模式下的鼠标控制问题
**动态几何体分辨率**：近景模式自动提升分辨率(太阳128×128, 行星64×64)，退出时恢复默认分辨率
**Toast通知系统**：实时操作反馈和提示信息
**智能内存管理**：动态几何体切换，自动释放高分辨率几何体内存
**类型安全**：完整的 TypeScript 类型检查和智能提示

## 开发说明

### TypeScript 开发流程
1. 修改相应模块的源码文件
2. 运行 `npm run build` 编译或 `npm run dev` 监听模式
3. 在浏览器中测试功能
4. 类型错误会在编译时被捕获

### 代码规范
- **文件大小限制**：单个文件代码行数不超过 1000 行
- **缩进规范**：使用 4 个空格缩进
- **严格 TypeScript 配置**：包括未使用变量检查
- **接口优先的类型设计**
- **私有方法使用 `private` 修饰符**
- **ES模块导入必须包含 `.js` 扩展名**

### 添加新功能的最佳实践
1. **确定功能归属**：根据单一责任原则选择合适的模块
2. **类型优先**：先在 `types/index.ts` 中定义相关接口
3. **测试驱动**：编写功能前先考虑如何测试
4. **文档同步**：更新相关的代码注释和README

### 天体数据修改
修改天体数据时，请保持 `celestialData` 对象中建立的结构。距离值以 AU 为单位，周期以地球日为单位。类型定义确保数据结构的一致性。

### 性能考虑
- 出于性能考虑，小行星计数和细节级别在保持视觉冲击的同时平衡了流畅的动画效果
- 时间系统需要在所有动画计算中一致使用 `TimeSystem.getSimulationTime()` 以保持模式之间的同步
- UI 元素使用固定定位和 z-index 管理，以便在 3D 画布上正确分层

## 构建系统

### TypeScript 配置
- 目标：ES2020
- 模块：ES2020
- 严格模式启用
- 生成声明文件和源码映射
- Three.js 类型支持
- ES模块导入支持.js扩展名

### 依赖管理
```json
{
  "devDependencies": {
    "typescript": "^5.9.2",
    "@types/three": "^0.152.1"
  }
}
```

### 部署说明
编译后的文件位于 `dist/` 目录，`index.html` 已配置为使用编译后的 ES 模块。可直接部署到静态文件服务器。

## 常用命令

```bash
# 编译项目
npm run build

# 开发监听模式
npm run dev

# 启动本地服务器
npm run serve

# 清理构建产物
npm run clean

# 一键启动（用户模式）
npm run play
npm start

# 端口管理
npm run kill-port
npm run restart

# 快速开发启动
./dev.sh          # macOS/Linux
./dev.bat         # Windows
```