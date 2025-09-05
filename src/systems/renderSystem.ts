import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CelestialBodyData } from '../types/index.js';

export interface LabelData {
    element: HTMLElement;
    object: THREE.Mesh;
}

/**
 * 渲染系统管理类
 * 负责处理Three.js场景、相机、渲染器和标签系统
 */
export class RenderSystem {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public renderer: THREE.WebGLRenderer;
    public controls: OrbitControls;
    private labels: LabelData[] = [];
    private tempVector: THREE.Vector3 = new THREE.Vector3();

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        this.initializeScene();
        this.createLights();
        this.createStars();
        this.setupControls();
        this.setupResizeHandler();
        
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    }

    /**
     * 初始化场景
     */
    private initializeScene(): void {
        // 设置场景背景
        this.scene.background = new THREE.Color(0x000011);

        // 设置相机位置 - 调整到更远的位置以便观察冥王星
        this.camera.position.set(0, 50, 100);

        // 设置渲染器
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        const container = document.getElementById('canvas-container');
        if (container) {
            container.appendChild(this.renderer.domElement);
        }
    }

    /**
     * 创建星空背景
     */
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
        this.scene.add(stars);
    }

    /**
     * 创建光照系统
     */
    private createLights(): void {
        // 太阳光（点光源）
        const sunLight = new THREE.PointLight(0xffffff, 2, 0, 2);
        sunLight.position.set(0, 0, 0);
        this.scene.add(sunLight);

        // 环境光（微弱）
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
    }

    /**
     * 设置轨道控制器
     */
    private setupControls(): void {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.autoRotate = false;
    }

    /**
     * 设置窗口大小调整处理
     */
    private setupResizeHandler(): void {
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    /**
     * 为天体创建标签
     */
    createLabel(object: THREE.Mesh, data: CelestialBodyData): void {
        const label = document.createElement('div');
        label.className = 'planet-label';
        label.textContent = data.name;
        label.style.color = `#${data.color.toString(16)}`;
        document.body.appendChild(label);

        this.labels.push({
            element: label,
            object: object
        });
    }

    /**
     * 延迟创建所有标签
     */
    setupLabels(celestialObjects: { sun: THREE.Mesh | null, planets: THREE.Mesh[], moon: THREE.Mesh | null }, celestialData: any): void {
        setTimeout(() => {
            // 创建太阳标签
            if (celestialObjects.sun) {
                this.createLabel(celestialObjects.sun, celestialData.sun);
            }

            // 创建行星标签
            celestialObjects.planets.forEach((planet) => {
                const planetData = planet.userData as CelestialBodyData;
                this.createLabel(planet, planetData);
            });

            // 创建月球标签
            if (celestialObjects.moon) {
                this.createLabel(celestialObjects.moon, celestialData.moon);
            }
        }, 100);
    }

    /**
     * 更新标签位置
     */
    updateLabels(): void {
        if (!this.labels || this.labels.length === 0) return;

        this.labels.forEach(labelData => {
            const { element, object } = labelData;
            if (!element || !object) return;

            // 获取天体的世界坐标
            this.tempVector.setFromMatrixPosition(object.matrixWorld);

            // 将3D坐标转换为屏幕坐标
            this.tempVector.project(this.camera);

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

    /**
     * 渲染场景
     */
    render(): void {
        this.controls.update();
        this.updateLabels();
        this.renderer.render(this.scene, this.camera);
    }

    /**
     * 添加对象到场景
     */
    addToScene(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    /**
     * 获取相机实例
     */
    getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
}