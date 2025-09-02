import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
    CelestialBodyData,
    CelestialDataCollection,
    PlanetObject,
    AsteroidData,
    TimeMode,
    OrbitalElements,
    Vector3D
} from '../types/index';

interface LabelData {
    element: HTMLElement;
    object: THREE.Mesh;
}

interface ScaleFactors {
    distance: number;
    planetSize: number;
    sunSize: number;
}

export class SolarSystem {
    private scene: THREE.Scene | null = null;
    private camera: THREE.PerspectiveCamera | null = null;
    private renderer: THREE.WebGLRenderer | null = null;
    private controls: OrbitControls | null = null;
    private planets: THREE.Mesh[] = [];
    private orbits: THREE.Line[] = [];
    private labels: LabelData[] = [];
    private asteroids: THREE.Mesh[] = [];
    private sun: THREE.Mesh | null = null;
    private moon: THREE.Mesh | null = null;

    // 时间模式控制
    private timeMode: TimeMode = 'static';
    private simulationStartTime: number = Date.now();
    private readonly animationTimeScale: number = 7 * 24 * 60 * 60 * 1000; // 一秒真实时间 = 一周模拟时间
    private isPaused: boolean = false;
    private pausedTime: number = 0;

    // J2000.0 历元: 2000年1月1日 12:00:00 TT
    private readonly J2000_EPOCH: number = new Date('2000-01-01T12:00:00Z').getTime();

    // 真实的天体数据（相对比例，以地球为1）
    private readonly celestialData: CelestialDataCollection = {
      sun: {
        name: '太阳',
        radius: 109,
        color: 0xFDB813,
        distance: 0,
        orbitalPeriod: 0,
        rotationPeriod: 25.4,
        eccentricity: 0
      },
      mercury: {
        name: '水星',
        radius: 0.383,
        color: 0x8C7853,
        semiMajorAxis: 0.38709927,
        eccentricity: 0.20563593,
        inclination: 7.00497902,
        meanLongitude: 252.25032350,
        longitudePerihelion: 77.45779628,
        longitudeNode: 48.33076593,
        orbitalPeriod: 87.9691,
        rotationPeriod: 58.6462
      },
      venus: {
        name: '金星',
        radius: 0.949,
        color: 0xFFC649,
        semiMajorAxis: 0.72333566,
        eccentricity: 0.00677672,
        inclination: 3.39467605,
        meanLongitude: 181.97909950,
        longitudePerihelion: 131.60246718,
        longitudeNode: 76.67984255,
        orbitalPeriod: 224.7008,
        rotationPeriod: -243.0226
      },
      earth: {
        name: '地球',
        radius: 1,
        color: 0x6B93D6,
        semiMajorAxis: 1.00000261,
        eccentricity: 0.01671123,
        inclination: -0.00001531,
        meanLongitude: 100.46457166,
        longitudePerihelion: 102.93768193,
        longitudeNode: 0.0,
        orbitalPeriod: 365.25636,
        rotationPeriod: 1.0
      },
      moon: {
        name: '月球',
        radius: 0.273,
        color: 0xC0C0C0,
        semiMajorAxis: 0.00257,
        eccentricity: 0.0549,
        inclination: 5.145,
        meanLongitude: 218.3164477,
        longitudePerihelion: 83.3532465,
        longitudeNode: 125.1228870,
        orbitalPeriod: 27.321661,
        rotationPeriod: 27.321661
      },
      mars: {
        name: '火星',
        radius: 0.532,
        color: 0xCD5C5C,
        semiMajorAxis: 1.52371034,
        eccentricity: 0.09339410,
        inclination: 1.84969142,
        meanLongitude: -4.55343205,
        longitudePerihelion: -23.94362959,
        longitudeNode: 49.55953891,
        orbitalPeriod: 686.971,
        rotationPeriod: 1.025957
      },
      jupiter: {
        name: '木星',
        radius: 11.21,
        color: 0xD8CA9D,
        semiMajorAxis: 5.20288700,
        eccentricity: 0.04838624,
        inclination: 1.30439695,
        meanLongitude: 34.39644051,
        longitudePerihelion: 14.72847983,
        longitudeNode: 100.47390909,
        orbitalPeriod: 4332.59,
        rotationPeriod: 0.41354,
        scaleFactor: 0.3
      },
      saturn: {
        name: '土星',
        radius: 9.45,
        color: 0xFAD5A5,
        semiMajorAxis: 9.53667594,
        eccentricity: 0.05386179,
        inclination: 2.48599187,
        meanLongitude: 49.95424423,
        longitudePerihelion: 92.59887831,
        longitudeNode: 113.66242448,
        orbitalPeriod: 10759.22,
        rotationPeriod: 0.44401,
        scaleFactor: 0.35
      },
      uranus: {
        name: '天王星',
        radius: 4.01,
        color: 0x4FD0E3,
        semiMajorAxis: 19.18916464,
        eccentricity: 0.04725744,
        inclination: 0.77263783,
        meanLongitude: 313.23810451,
        longitudePerihelion: 170.95427630,
        longitudeNode: 74.01692503,
        orbitalPeriod: 30688.5,
        rotationPeriod: -0.71833,
        scaleFactor: 0.5
      },
      neptune: {
        name: '海王星',
        radius: 3.88,
        color: 0x4B70DD,
        semiMajorAxis: 30.06992276,
        eccentricity: 0.00859048,
        inclination: 1.77004347,
        meanLongitude: -55.12002969,
        longitudePerihelion: 44.96476227,
        longitudeNode: 131.78422574,
        orbitalPeriod: 60182,
        rotationPeriod: 0.6713,
        scaleFactor: 0.5
      }
    };

    // 缩放因子
    private readonly scaleFactors: ScaleFactors = {
      distance: 10,
      planetSize: 0.5,
      sunSize: 0.015
    };

    private tempVector: THREE.Vector3 = new THREE.Vector3();

    constructor() {
      this.init();
    }

    private init(): void {
      this.createScene();
      this.createLights();
      this.createSun();
      this.createPlanets();
      this.createMoon();
      this.createOrbits();
      this.createAsteroidBelt();
      this.setupControls();
      this.setupClock();
      this.setupTimeControls();
      this.setupKeyboardControls();
      this.animate();

      // 延迟创建标签，确保所有3D对象都已创建
      setTimeout(() => this.createLabels(), 100);
    }

    private createScene(): void {
      // 创建场景
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x000011);

      // 创建相机
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      this.camera.position.set(0, 20, 30);

      // 创建渲染器
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      const container = document.getElementById('canvas-container');
      if (container) {
        container.appendChild(this.renderer.domElement);
      }

      // 添加星空背景
      this.createStars();

      // 窗口大小调整
      window.addEventListener('resize', () => {
        if (this.camera && this.renderer) {
          this.camera.aspect = window.innerWidth / window.innerHeight;
          this.camera.updateProjectionMatrix();
          this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
      });
    }

    private createStars(): void {
      const starsGeometry = new THREE.BufferGeometry();
      const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });

      const starsVertices: number[] = [];
      for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starsVertices.push(x, y, z);
      }

      starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
      const stars = new THREE.Points(starsGeometry, starsMaterial);
      if (this.scene) {
        this.scene.add(stars);
      }
    }

    private createLights(): void {
      if (!this.scene) return;

      // 太阳光（点光源）
      const sunLight = new THREE.PointLight(0xffffff, 2, 0, 2);
      sunLight.position.set(0, 0, 0);
      this.scene.add(sunLight);

      // 环境光（微弱）
      const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
      this.scene.add(ambientLight);
    }

    private createSun(): void {
      if (!this.scene) return;

      const sunRadius = this.celestialData.sun.radius * this.scaleFactors.sunSize;
      const geometry = new THREE.SphereGeometry(sunRadius, 32, 32);

      // 创建太阳材质（发光效果）
      const material = new THREE.MeshBasicMaterial({
        color: this.celestialData.sun.color,
        transparent: true,
        opacity: 0.9
      });

      this.sun = new THREE.Mesh(geometry, material);
      this.sun.userData = this.celestialData.sun;
      this.scene.add(this.sun);
    }

    private createPlanets(): void {
      if (!this.scene) return;

      const planetNames: (keyof CelestialDataCollection)[] = 
        ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

      planetNames.forEach((planetName) => {
        const data = this.celestialData[planetName];

        // 应用尺寸调整因子
        const sizeAdjustment = data.scaleFactor || 1;
        const radius = data.radius * this.scaleFactors.planetSize * sizeAdjustment;

        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshLambertMaterial({ color: data.color });

        const planet = new THREE.Mesh(geometry, material);
        planet.userData = data;

        // 设置初始位置
        const distance = (data.semiMajorAxis || 0) * this.scaleFactors.distance;
        planet.position.set(distance, 0, 0);

        this.planets.push(planet);
        if (this.scene) {
          this.scene.add(planet);
        }
      });
    }

    private createMoon(): void {
      if (!this.scene) return;

      const moonData = this.celestialData.moon;

      // 月球的半径
      const radius = moonData.radius * this.scaleFactors.planetSize;

      const geometry = new THREE.SphereGeometry(radius, 16, 16);
      const material = new THREE.MeshLambertMaterial({ color: moonData.color });

      this.moon = new THREE.Mesh(geometry, material);
      this.moon.userData = moonData;

      // 初始位置设置在地球附近
      const earthDistance = (this.celestialData.earth.semiMajorAxis || 0) * this.scaleFactors.distance;
      const moonDistance = (moonData.semiMajorAxis || 0) * this.scaleFactors.distance * 30; // 放大月球轨道以便观察
      this.moon.position.set(earthDistance + moonDistance, 0, 0);

      this.scene.add(this.moon);
    }

    private createOrbits(): void {
      const planetNames: (keyof CelestialDataCollection)[] = 
        ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

      planetNames.forEach((planetName) => {
        const data = this.celestialData[planetName];
        this.createRealisticOrbit(data);
      });
    }

    private createRealisticOrbit(data: CelestialBodyData): void {
      if (!this.scene) return;

      const points: THREE.Vector3[] = [];
      const segments = 256;

      // 轨道要素
      const semiMajorAxis = (data.semiMajorAxis || 0) * this.scaleFactors.distance;
      const eccentricity = data.eccentricity || 0;
      const inclination = (data.inclination || 0) * Math.PI / 180;
      const longitudePerihelion = (data.longitudePerihelion || 0) * Math.PI / 180;
      const longitudeNode = (data.longitudeNode || 0) * Math.PI / 180;

      // 计算轨道平面参数
      const argumentPerihelion = longitudePerihelion - longitudeNode;

      // 沿着椭圆轨道计算点
      for (let i = 0; i <= segments; i++) {
        // 真近点角从0到2π
        const trueAnomaly = (i / segments) * 2 * Math.PI;

        // 计算距离
        const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));

        // 计算轨道平面坐标
        const u = trueAnomaly + argumentPerihelion;

        // 转换为黄道坐标系
        const cosU = Math.cos(u);
        const sinU = Math.sin(u);
        const cosI = Math.cos(inclination);
        const sinI = Math.sin(inclination);
        const cosO = Math.cos(longitudeNode);
        const sinO = Math.sin(longitudeNode);

        const x = radius * (cosO * cosU - sinO * sinU * cosI);
        const y = radius * (sinO * cosU + cosO * sinU * cosI);
        const z = radius * (sinU * sinI);

        points.push(new THREE.Vector3(x, z, y)); // 使用与天体位置相同的坐标系转换
      }

      // 创建轨道线条
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: 0x888888,
        transparent: true,
        opacity: 0.7
      });

      const orbit = new THREE.Line(geometry, material);
      this.orbits.push(orbit);
      this.scene.add(orbit);
    }

    private createAsteroidBelt(): void {
      if (!this.scene) return;

      // 小行星带位于火星和木星之间，大约2.2-3.2 AU
      const innerRadius = 2.2 * this.scaleFactors.distance;
      const outerRadius = 3.2 * this.scaleFactors.distance;
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
        this.scene.add(asteroid);
      }
    }

    private setupControls(): void {
      if (!this.camera || !this.renderer) return;

      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.25;
      this.controls.enableZoom = true;
      this.controls.enablePan = true;
      this.controls.autoRotate = false;
    }

    private setupClock(): void {
      this.updateClock();
      setInterval(() => this.updateClock(), 1000);
    }

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

    private setupTimeControls(): void {
      const button = document.getElementById('time-mode-button');
      if (!button) return;

      button.addEventListener('click', () => {
        this.toggleTimeMode();
      });

      this.updateTimeControlsUI();
    }

    private toggleTimeMode(): void {
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

    private getSimulationTime(): number {
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

    private togglePause(): void {
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

    private createLabels(): void {
      // 创建太阳标签
      if (this.sun) {
        const sunLabel = document.createElement('div');
        sunLabel.className = 'planet-label';
        sunLabel.textContent = this.celestialData.sun.name;
        sunLabel.style.color = `#${this.celestialData.sun.color.toString(16)}`;
        document.body.appendChild(sunLabel);

        this.labels.push({
          element: sunLabel,
          object: this.sun
        });
      }

      // 创建行星标签
      this.planets.forEach((planet) => {
        const planetData = planet.userData as CelestialBodyData;
        const label = document.createElement('div');
        label.className = 'planet-label';
        label.textContent = planetData.name;
        label.style.color = `#${planetData.color.toString(16)}`;
        document.body.appendChild(label);

        this.labels.push({
          element: label,
          object: planet
        });
      });

      // 创建月球标签
      if (this.moon) {
        const moonLabel = document.createElement('div');
        moonLabel.className = 'planet-label';
        moonLabel.textContent = this.celestialData.moon.name;
        moonLabel.style.color = `#${this.celestialData.moon.color.toString(16)}`;
        document.body.appendChild(moonLabel);

        this.labels.push({
          element: moonLabel,
          object: this.moon
        });
      }
    }

    private calculatePlanetPosition(planet: THREE.Mesh, time: number): void {
      const data = planet.userData as CelestialBodyData;

      // 计算从J2000.0历元到现在的天数
      const daysSinceJ2000 = (time - this.J2000_EPOCH) / (1000 * 60 * 60 * 24);

      // 轨道要素
      const semiMajorAxis = (data.semiMajorAxis || 0) * this.scaleFactors.distance;
      const eccentricity = data.eccentricity || 0;
      const inclination = (data.inclination || 0) * Math.PI / 180;
      const meanLongitudeAtEpoch = (data.meanLongitude || 0) * Math.PI / 180;
      const longitudePerihelion = (data.longitudePerihelion || 0) * Math.PI / 180;
      const longitudeNode = (data.longitudeNode || 0) * Math.PI / 180;

      // 计算平均运动（弧度每天）
      const meanMotion = (2 * Math.PI) / data.orbitalPeriod;

      // 计算当前时刻的平均黄经
      const meanLongitude = meanLongitudeAtEpoch + meanMotion * daysSinceJ2000;

      // 计算平均近点角
      const meanAnomaly = meanLongitude - longitudePerihelion;

      // 用迭代法求解偏心近点角（开普勒方程）
      let eccentricAnomaly = meanAnomaly;
      for (let i = 0; i < 10; i++) {
        const deltaE = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
          (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly -= deltaE;
        if (Math.abs(deltaE) < 1e-8) break;
      }

      // 计算真近点角
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
      );

      // 计算距离（天文单位）
      const radius = semiMajorAxis * (1 - eccentricity * Math.cos(eccentricAnomaly));

      // 计算轨道平面坐标
      const argumentPerihelion = longitudePerihelion - longitudeNode;
      const u = trueAnomaly + argumentPerihelion;

      // 转换为黄道坐标系
      const cosU = Math.cos(u);
      const sinU = Math.sin(u);
      const cosI = Math.cos(inclination);
      const sinI = Math.sin(inclination);
      const cosO = Math.cos(longitudeNode);
      const sinO = Math.sin(longitudeNode);

      const x = radius * (cosO * cosU - sinO * sinU * cosI);
      const y = radius * (sinO * cosU + cosO * sinU * cosI);
      const z = radius * (sinU * sinI);

      planet.position.set(x, z, y); // 注意坐标系转换

      // 行星自转
      const rotationAngle = (daysSinceJ2000 / Math.abs(data.rotationPeriod)) * 2 * Math.PI;
      planet.rotation.y = data.rotationPeriod > 0 ? rotationAngle : -rotationAngle;
    }

    private calculateMoonPosition(moon: THREE.Mesh, time: number): void {
      const moonData = moon.userData as CelestialBodyData;

      // 首先获取地球的当前位置
      const earthPlanet = this.planets.find(p => (p.userData as CelestialBodyData).name === '地球');
      if (!earthPlanet) return;

      const earthX = earthPlanet.position.x;
      const earthY = earthPlanet.position.y;
      const earthZ = earthPlanet.position.z;

      // 计算从J2000.0历元到现在的天数
      const daysSinceJ2000 = (time - this.J2000_EPOCH) / (1000 * 60 * 60 * 24);

      // 月球相对于地球的轨道计算
      const moonDistance = (moonData.semiMajorAxis || 0) * this.scaleFactors.distance * 30;
      const eccentricity = moonData.eccentricity || 0;
      const inclination = (moonData.inclination || 0) * Math.PI / 180;
      const meanLongitudeAtEpoch = (moonData.meanLongitude || 0) * Math.PI / 180;
      const longitudePerihelion = (moonData.longitudePerihelion || 0) * Math.PI / 180;

      // 计算平均运动
      const meanMotion = (2 * Math.PI) / moonData.orbitalPeriod;

      // 计算当前时刻的平均黄经
      const meanLongitude = meanLongitudeAtEpoch + meanMotion * daysSinceJ2000;

      // 计算平均近点角
      const meanAnomaly = meanLongitude - longitudePerihelion;

      // 求解偏心近点角
      let eccentricAnomaly = meanAnomaly;
      for (let i = 0; i < 10; i++) {
        const deltaE = (eccentricAnomaly - eccentricity * Math.sin(eccentricAnomaly) - meanAnomaly) /
          (1 - eccentricity * Math.cos(eccentricAnomaly));
        eccentricAnomaly -= deltaE;
        if (Math.abs(deltaE) < 1e-8) break;
      }

      // 计算真近点角
      const trueAnomaly = 2 * Math.atan2(
        Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
        Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
      );

      // 计算距离
      const radius = moonDistance * (1 - eccentricity * Math.cos(eccentricAnomaly));

      // 月球在轨道平面上的相对位置
      const moonRelativeX = radius * Math.cos(trueAnomaly);
      const moonRelativeZ = radius * Math.sin(trueAnomaly) * Math.cos(inclination);
      const moonRelativeY = radius * Math.sin(trueAnomaly) * Math.sin(inclination);

      // 月球的绝对位置 = 地球位置 + 月球相对位置
      const moonX = earthX + moonRelativeX;
      const moonY = earthY + moonRelativeY;
      const moonZ = earthZ + moonRelativeZ;

      moon.position.set(moonX, moonY, moonZ);

      // 月球自转（同步自转）
      const moonRotationAngle = (daysSinceJ2000 / moonData.rotationPeriod) * 2 * Math.PI;
      moon.rotation.y = moonRotationAngle;
    }

    private updateLabels(): void {
      if (!this.labels || !this.camera) return;

      this.labels.forEach(labelData => {
        const { element, object } = labelData;
        if (!element || !object || !this.camera) return;

        // 获取天体的世界坐标
        this.tempVector.setFromMatrixPosition(object.matrixWorld);

        // 将3D坐标转换为屏幕坐标
        this.tempVector.project(this.camera!);

        // 转换为CSS坐标
        const x = (this.tempVector.x * 0.5 + 0.5) * window.innerWidth;
        const y = (this.tempVector.y * -0.5 + 0.5) * window.innerHeight;

        // 检查天体是否在相机前方
        if (this.tempVector.z > 1) {
          element.style.display = 'none';
        } else {
          element.style.display = 'block';
          element.style.left = `${x}px`;
          element.style.top = `${y - 20}px`; // 标签显示在天体上方
        }
      });
    }

    private animate(): void {
      requestAnimationFrame(() => this.animate());

      // 使用模拟时间而不是真实时间
      const currentTime = this.getSimulationTime();

      // 更新行星位置
      this.planets.forEach(planet => {
        this.calculatePlanetPosition(planet, currentTime);
      });

      // 更新月球位置
      if (this.moon) {
        this.calculateMoonPosition(this.moon, currentTime);
      }

      // 更新小行星带位置
      this.updateAsteroids(currentTime);

      // 太阳自转
      if (this.sun) {
        const daysSinceEpoch = currentTime / (1000 * 60 * 60 * 24);
        this.sun.rotation.y = (daysSinceEpoch / this.celestialData.sun.rotationPeriod) * 2 * Math.PI;
      }

      if (this.controls) {
        this.controls.update();
      }

      // 只有在标签数组存在时才更新标签
      if (this.labels && this.labels.length > 0) {
        this.updateLabels();
      }

      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    }

    private updateAsteroids(currentTime: number): void {
      this.asteroids.forEach(asteroid => {
        const data = asteroid.userData as any;

        if (this.timeMode === 'animation') {
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
}

// 页面加载完成后初始化太阳系
document.addEventListener('DOMContentLoaded', () => {
    new SolarSystem();
});