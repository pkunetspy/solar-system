import * as THREE from 'three';
import { CelestialBodyData } from './types/index.js';
import { celestialData, scaleFactors, J2000_EPOCH } from './data/celestialData.js';
import { OrbitalMath } from './utils/orbitalMath.js';
import { TimeSystem } from './systems/timeSystem.js';
import { RenderSystem } from './systems/renderSystem.js';
import { CelestialObjects } from './objects/celestialObjects.js';
import { SunEffects } from './effects/sunEffects.js';
import { CloseViewSystem } from './systems/closeViewSystem.js';

/**
 * 太阳系3D可视化主类
 * 协调各个模块的工作，管理整个太阳系仿真
 */
export class SolarSystem {
    private renderSystem!: RenderSystem;
    private timeSystem!: TimeSystem;
    private celestialObjects!: CelestialObjects;
    private sunEffects!: SunEffects;
    private closeViewSystem!: CloseViewSystem;

    constructor() {
        this.init();
    }

    /**
     * 初始化太阳系仿真
     */
    private init(): void {
        // 初始化各个系统
        this.renderSystem = new RenderSystem();
        this.timeSystem = new TimeSystem();
        this.celestialObjects = new CelestialObjects(this.renderSystem);
        this.sunEffects = new SunEffects(this.renderSystem);
        this.closeViewSystem = new CloseViewSystem(this.renderSystem, this.celestialObjects, this.timeSystem);

        // 添加太阳光晕效果
        if (this.celestialObjects.sun) {
            const sunRadius = celestialData.sun.radius * scaleFactors.sunSize;
            this.sunEffects.createSunGlow(sunRadius);
        }

        // 设置标签系统
        this.renderSystem.setupLabels(
            this.celestialObjects.getAllObjects(), 
            celestialData
        );

        // 开始动画循环
        this.animate();
    }

    /**
     * 更新行星位置和自转
     */
    private updatePlanets(currentTime: number): void {
        this.celestialObjects.planets.forEach(planet => {
            const planetData = planet.userData as CelestialBodyData;
            
            // 计算新位置
            const newPosition = OrbitalMath.calculatePlanetPosition(planetData, currentTime);
            planet.position.copy(newPosition);

            // 更新自转 - 但在近景模式下不覆盖纹理系统的旋转设置
            if (!this.closeViewSystem.isInCloseViewMode()) {
                planet.rotation.y = OrbitalMath.calculateRotationAngle(planetData, currentTime);
            }
            // 注意：近景模式下，旋转由 textureSystem.applyRealisticRotation() 控制
        });
    }

    /**
     * 更新月球位置和自转
     */
    private updateMoon(currentTime: number): void {
        if (!this.celestialObjects.moon) return;

        const earthPlanet = this.celestialObjects.getEarthPlanet();
        if (!earthPlanet) return;

        const moonData = this.celestialObjects.moon.userData as CelestialBodyData;
        
        // 计算月球新位置
        const newPosition = OrbitalMath.calculateMoonPosition(
            moonData, 
            earthPlanet.position, 
            currentTime
        );
        this.celestialObjects.moon.position.copy(newPosition);

        // 月球自转（同步自转）- 但在近景模式下不覆盖纹理系统的设置
        if (!this.closeViewSystem.isInCloseViewMode()) {
            this.celestialObjects.moon.rotation.y = OrbitalMath.calculateRotationAngle(moonData, currentTime);
        }
    }

    /**
     * 更新太阳自转
     */
    private updateSun(currentTime: number): void {
        if (!this.celestialObjects.sun) return;

        // 太阳自转 - 但在近景模式下不覆盖纹理系统的设置
        if (!this.closeViewSystem.isInCloseViewMode()) {
            const daysSinceEpoch = currentTime / (1000 * 60 * 60 * 24);
            this.celestialObjects.sun.rotation.y = 
                (daysSinceEpoch / celestialData.sun.rotationPeriod) * 2 * Math.PI;
        }
    }

    /**
     * 主动画循环
     */
    private animate(): void {
        requestAnimationFrame(() => this.animate());

        // 获取当前模拟时间
        const currentTime = this.timeSystem.getSimulationTime();

        // 更新所有天体
        this.updatePlanets(currentTime);
        this.updateMoon(currentTime);
        this.updateSun(currentTime);

        // 更新小行星带
        this.celestialObjects.updateAsteroids(
            currentTime, 
            this.timeSystem.getTimeMode()
        );

        // 更新行星距离显示
        this.renderSystem.updatePlanetDistances(this.celestialObjects.planets);

        // 更新近景浏览系统
        this.closeViewSystem.update();

        // 渲染场景
        this.renderSystem.render();
    }
}

// 页面加载完成后初始化太阳系
document.addEventListener('DOMContentLoaded', () => {
    new SolarSystem();
});