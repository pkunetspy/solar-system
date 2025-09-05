import { TimeMode } from '../types/index.js';

/**
 * 时间系统管理类
 * 负责处理双时间模式切换、暂停控制和时间计算
 */
export class TimeSystem {
    private timeMode: TimeMode = 'static';
    private simulationStartTime: number = Date.now();
    private readonly animationTimeScale: number = 7 * 24 * 60 * 60 * 1000; // 一秒真实时间 = 一周模拟时间
    private isPaused: boolean = false;
    private pausedTime: number = 0;

    constructor() {
        this.setupTimeControls();
        this.setupClock();
        this.setupKeyboardControls();
    }

    /**
     * 获取当前模拟时间
     */
    getSimulationTime(): number {
        if (this.timeMode === 'static') {
            return Date.now();
        } else {
            if (this.isPaused) {
                // 如果暂停，返回暂停时的时间
                return this.simulationStartTime + this.pausedTime * this.animationTimeScale / 1000;
            } else {
                const realTimeElapsed = Date.now() - this.simulationStartTime;
                const simulationTimeElapsed = realTimeElapsed * this.animationTimeScale / 1000;
                return this.simulationStartTime + simulationTimeElapsed;
            }
        }
    }

    /**
     * 切换时间模式
     */
    toggleTimeMode(): void {
        if (this.timeMode === 'static') {
            this.timeMode = 'animation';
            this.simulationStartTime = Date.now();
            this.isPaused = false;
            this.pausedTime = 0;
        } else {
            this.timeMode = 'static';
            // 切换到静态模式时重置暂停状态
            this.isPaused = false;
            this.pausedTime = 0;
        }
        this.updateTimeControlsUI();
    }

    /**
     * 切换暂停状态（仅在动画模式下有效）
     */
    togglePause(): void {
        if (this.timeMode !== 'animation') return;

        if (this.isPaused) {
            // 继续：重置开始时间，考虑暂停期间的时间
            this.simulationStartTime = Date.now() - this.pausedTime;
            this.isPaused = false;
        } else {
            // 暂停：记录当前经过的时间
            this.pausedTime = Date.now() - this.simulationStartTime;
            this.isPaused = true;
        }

        this.updateTimeControlsUI();
    }

    /**
     * 获取当前时间模式
     */
    getTimeMode(): TimeMode {
        return this.timeMode;
    }

    /**
     * 检查是否处于暂停状态
     */
    isPausedState(): boolean {
        return this.isPaused;
    }

    /**
     * 设置时钟显示更新
     */
    private setupClock(): void {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }

    /**
     * 更新时钟显示
     */
    private updateClock(): void {
        let displayTime: Date;
        const clockElement = document.getElementById('clock');
        if (!clockElement) return;

        if (this.timeMode === 'static') {
            // 静态模式：显示当前真实时间
            displayTime = new Date();
            const timeString = displayTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
            });
            clockElement.textContent = timeString;
        } else {
            // 动画模式：只显示日期，不显示秒
            displayTime = new Date(this.getSimulationTime());
            const timeString = displayTime.toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour12: false
            });
            clockElement.textContent = timeString;
        }
    }

    /**
     * 设置时间控制UI
     */
    private setupTimeControls(): void {
        const button = document.getElementById('time-mode-button');
        if (!button) return;

        button.addEventListener('click', () => {
            this.toggleTimeMode();
        });

        this.updateTimeControlsUI();
    }

    /**
     * 更新时间控制UI显示
     */
    private updateTimeControlsUI(): void {
        const button = document.getElementById('time-mode-button');
        const info = document.getElementById('time-info');
        if (!button || !info) return;

        if (this.timeMode === 'static') {
            button.textContent = '切换到运动模式';
            button.className = '';
            info.textContent = '当前：静态模式（实时时间）';
        } else {
            button.textContent = '切换到静态模式';
            button.className = 'animation-mode';
            info.textContent = '当前：运动模式（1秒 = 1周）';
        }
    }

    /**
     * 设置键盘控制
     */
    private setupKeyboardControls(): void {
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                // 只在运动模式下响应空格键暂停功能
                if (this.timeMode === 'animation') {
                    event.preventDefault(); // 防止页面滚动
                    this.togglePause();
                } else {
                    // 静态模式下也阻止空格键的默认行为（防止页面滚动）
                    event.preventDefault();
                }
            }
        });
    }
}