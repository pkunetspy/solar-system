import * as THREE from 'three';
import { CelestialDataCollection, CelestialBodyData } from '../types/index.js';
import { celestialData, scaleFactors } from '../data/celestialData.js';
import { OrbitalMath } from '../utils/orbitalMath.js';
import { RenderSystem } from '../systems/renderSystem.js';

/**
 * 天体对象创建和管理类
 * 负责创建太阳、行星、月球、小行星带和轨道线
 */
export class CelestialObjects {
    public sun: THREE.Mesh | null = null;
    public planets: THREE.Mesh[] = [];
    public moon: THREE.Mesh | null = null;
    public asteroids: THREE.Mesh[] = [];
    public orbits: THREE.Line[] = [];

    constructor(private renderSystem: RenderSystem) {
        this.createSun();
        this.createPlanets();
        this.createMoon();
        this.createOrbits();
        this.createAsteroidBelt();
    }

    /**
     * 创建太阳
     */
    private createSun(): void {
        const sunRadius = celestialData.sun.radius * scaleFactors.sunSize;
        const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);

        // 创建太阳材质（发光效果）
        const material = new THREE.MeshBasicMaterial({
            color: celestialData.sun.color,
            transparent: true,
            opacity: 0.9
        });

        this.sun = new THREE.Mesh(geometry, material);
        this.sun.userData = celestialData.sun;
        this.renderSystem.addToScene(this.sun);
    }

    /**
     * 创建行星
     */
    private createPlanets(): void {
        const planetNames: (keyof CelestialDataCollection)[] = 
            ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

        planetNames.forEach((planetName) => {
            const data = celestialData[planetName];

            // 应用尺寸调整因子
            const sizeAdjustment = data.scaleFactor || 1;
            const radius = data.radius * scaleFactors.planetSize * sizeAdjustment;

            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color: data.color });

            const planet = new THREE.Mesh(geometry, material);
            planet.userData = data;

            // 设置初始位置
            const distance = (data.semiMajorAxis || 0) * scaleFactors.distance;
            planet.position.set(distance, 0, 0);

            this.planets.push(planet);
            this.renderSystem.addToScene(planet);
        });
    }

    /**
     * 创建月球
     */
    private createMoon(): void {
        const moonData = celestialData.moon;

        // 月球的半径
        const radius = moonData.radius * scaleFactors.planetSize;

        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: moonData.color });

        this.moon = new THREE.Mesh(geometry, material);
        this.moon.userData = moonData;

        // 初始位置设置在地球附近
        const earthDistance = (celestialData.earth.semiMajorAxis || 0) * scaleFactors.distance;
        const moonDistance = (moonData.semiMajorAxis || 0) * scaleFactors.distance * 30; // 放大月球轨道以便观察
        this.moon.position.set(earthDistance + moonDistance, 0, 0);

        this.renderSystem.addToScene(this.moon);
    }

    /**
     * 创建椭圆轨道线条
     */
    private createOrbits(): void {
        const planetNames: (keyof CelestialDataCollection)[] = 
            ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'];

        planetNames.forEach((planetName) => {
            const data = celestialData[planetName];
            this.createRealisticOrbit(data);
        });
    }

    /**
     * 创建单个椭圆轨道
     */
    private createRealisticOrbit(data: CelestialBodyData): void {
        const points = OrbitalMath.generateOrbitPath(data, 256);

        // 创建轨道线条
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: 0x888888,
            transparent: true,
            opacity: 0.7
        });

        const orbit = new THREE.Line(geometry, material);
        this.orbits.push(orbit);
        this.renderSystem.addToScene(orbit);
    }

    /**
     * 创建小行星带
     */
    private createAsteroidBelt(): void {
        // 小行星带位于火星和木星之间，大约2.2-3.2 AU
        const innerRadius = 2.2 * scaleFactors.distance;
        const outerRadius = 3.2 * scaleFactors.distance;
        const asteroidCount = 1200;

        for (let i = 0; i < asteroidCount; i++) {
            // 随机分布在小行星带环形区域内
            const angle = Math.random() * 2 * Math.PI;
            const distance = innerRadius + Math.random() * (outerRadius - innerRadius);

            // 添加一些随机偏移，使小行星带看起来更自然
            const heightVariation = (Math.random() - 0.5) * 0.5;
            const radiusVariation = (Math.random() - 0.5) * 0.3;

            const x = (distance + radiusVariation) * Math.cos(angle);
            const z = (distance + radiusVariation) * Math.sin(angle);
            const y = heightVariation;

            // 创建小行星
            const asteroidSize = 0.04 + Math.random() * 0.06;
            const geometry = new THREE.SphereGeometry(asteroidSize, 8, 8);

            const material = new THREE.MeshLambertMaterial({
                color: 0xA0825A,
                transparent: true,
                opacity: 0.9
            });

            const asteroid = new THREE.Mesh(geometry, material);
            asteroid.position.set(x, y, z);

            // 存储小行星的轨道信息
            asteroid.userData = {
                angle: angle,
                initialAngle: angle,
                distance: distance,
                heightVariation: heightVariation,
                radiusVariation: radiusVariation,
                rotationSpeed: 0.0002 + Math.random() * 0.0003
            };

            this.asteroids.push(asteroid);
            this.renderSystem.addToScene(asteroid);
        }
    }

    /**
     * 更新小行星带位置
     */
    updateAsteroids(currentTime: number, timeMode: string): void {
        this.asteroids.forEach(asteroid => {
            const data = asteroid.userData as any;

            if (timeMode === 'animation') {
                // 运动模式：基于时间计算角度位置
                const daysSinceEpoch = currentTime / (1000 * 60 * 60 * 24);
                const orbitalPeriod = 4 * 365; // 小行星带大约4年公转周期
                data.angle = (daysSinceEpoch / orbitalPeriod) * 2 * Math.PI + data.initialAngle;
            } else {
                // 静态模式：缓慢增量旋转
                data.angle += data.rotationSpeed;
            }

            // 重新计算位置
            const x = (data.distance + data.radiusVariation) * Math.cos(data.angle);
            const z = (data.distance + data.radiusVariation) * Math.sin(data.angle);
            const y = data.heightVariation;

            asteroid.position.set(x, y, z);

            // 小行星自转（减慢速度）
            asteroid.rotation.x += 0.002;
            asteroid.rotation.y += 0.001;
        });
    }

    /**
     * 获取地球行星对象
     */
    getEarthPlanet(): THREE.Mesh | undefined {
        return this.planets.find(p => (p.userData as CelestialBodyData).name === '地球');
    }

    /**
     * 获取所有天体对象用于标签创建
     */
    getAllObjects(): { sun: THREE.Mesh | null, planets: THREE.Mesh[], moon: THREE.Mesh | null } {
        return {
            sun: this.sun,
            planets: this.planets,
            moon: this.moon
        };
    }
}