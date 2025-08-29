class SolarSystem {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.planets = [];
        this.orbits = [];
        this.labels = [];
        this.asteroids = [];
        this.sun = null;
        
        // 真实的天体数据（相对比例，以地球为1）
        this.celestialData = {
            sun: {
                name: '太阳',
                radius: 109, // 相对于地球的倍数
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
                distance: 0.39, // AU (半长轴)
                orbitalPeriod: 88, // 地球日
                rotationPeriod: 58.6,
                inclination: 7.0,
                eccentricity: 0.206 // 偏心率
            },
            venus: {
                name: '金星',
                radius: 0.949,
                color: 0xFFC649,
                distance: 0.72,
                orbitalPeriod: 225,
                rotationPeriod: 243,
                inclination: 3.4,
                eccentricity: 0.007
            },
            earth: {
                name: '地球',
                radius: 1,
                color: 0x6B93D6,
                distance: 1,
                orbitalPeriod: 365.25,
                rotationPeriod: 1,
                inclination: 0,
                eccentricity: 0.017
            },
            mars: {
                name: '火星',
                radius: 0.532,
                color: 0xCD5C5C,
                distance: 1.52,
                orbitalPeriod: 687,
                rotationPeriod: 1.03,
                inclination: 1.85,
                eccentricity: 0.093
            },
            jupiter: {
                name: '木星',
                radius: 11.21,
                color: 0xD8CA9D,
                distance: 5.20,
                orbitalPeriod: 4333,
                rotationPeriod: 0.41,
                inclination: 1.3,
                eccentricity: 0.049,
                sizeAdjustment: 0.3 // 缩小气态巨行星以便观察
            },
            saturn: {
                name: '土星',
                radius: 9.45,
                color: 0xFAD5A5,
                distance: 9.58,
                orbitalPeriod: 10759,
                rotationPeriod: 0.45,
                inclination: 2.5,
                eccentricity: 0.057,
                sizeAdjustment: 0.35
            },
            uranus: {
                name: '天王星',
                radius: 4.01,
                color: 0x4FD0E3,
                distance: 19.20,
                orbitalPeriod: 30687,
                rotationPeriod: 0.72,
                inclination: 0.8,
                eccentricity: 0.046,
                sizeAdjustment: 0.5
            },
            neptune: {
                name: '海王星',
                radius: 3.88,
                color: 0x4B70DD,
                distance: 30.05,
                orbitalPeriod: 60190,
                rotationPeriod: 0.67,
                inclination: 1.8,
                eccentricity: 0.009,
                sizeAdjustment: 0.5
            }
        };
        
        // 缩放因子（用于显示，因为真实比例太大无法在屏幕上显示）
        this.scaleFactors = {
            distance: 10, // 距离缩放
            planetSize: 0.5, // 行星大小缩放
            sunSize: 0.01 // 太阳大小调整为0.01
        };
        
        this.init();
        
        // 用于标签更新的向量
        this.tempVector = new THREE.Vector3();
    }
    
    init() {
        this.createScene();
        this.createLights();
        this.createSun();
        this.createPlanets();
        this.createOrbits();
        this.createAsteroidBelt();
        this.setupControls();
        this.setupClock();
        this.animate();
        
        // 延迟创建标签，确保所有3D对象都已创建
        setTimeout(() => this.createLabels(), 100);
    }
    
    createScene() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000011);
        
        // 创建相机
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.camera.position.set(0, 20, 30);
        
        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('canvas-container').appendChild(this.renderer.domElement);
        
        // 添加星空背景
        this.createStars();
        
        // 窗口大小调整
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
        
        const starsVertices = [];
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
    
    createLights() {
        // 太阳光（点光源）
        const sunLight = new THREE.PointLight(0xffffff, 2, 0, 2);
        sunLight.position.set(0, 0, 0);
        sunLight.castShadow = true;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        this.scene.add(sunLight);
        
        // 环境光（微弱）
        const ambientLight = new THREE.AmbientLight(0x404040, 0.1);
        this.scene.add(ambientLight);
    }
    
    createSun() {
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
    
    createPlanets() {
        const planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        
        planetNames.forEach((planetName) => {
            const data = this.celestialData[planetName];
            
            // 应用尺寸调整因子
            const sizeAdjustment = data.sizeAdjustment || 1;
            const radius = data.radius * this.scaleFactors.planetSize * sizeAdjustment;
            
            const geometry = new THREE.SphereGeometry(radius, 16, 16);
            const material = new THREE.MeshLambertMaterial({ color: data.color });
            
            const planet = new THREE.Mesh(geometry, material);
            planet.castShadow = true;
            planet.receiveShadow = true;
            planet.userData = data;
            
            // 设置初始位置
            const distance = data.distance * this.scaleFactors.distance;
            planet.position.set(distance, 0, 0);
            
            this.planets.push(planet);
            this.scene.add(planet);
        });
    }
    
    createOrbits() {
        const planetNames = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];
        
        planetNames.forEach((planetName) => {
            const data = this.celestialData[planetName];
            const semiMajorAxis = data.distance * this.scaleFactors.distance;
            const eccentricity = data.eccentricity || 0;
            const inclination = (data.inclination || 0) * Math.PI / 180;
            
            // 创建椭圆轨道路径
            this.createEllipticalOrbit(semiMajorAxis, eccentricity, inclination);
        });
    }
    
    createEllipticalOrbit(semiMajorAxis, eccentricity, inclination) {
        const points = [];
        const segments = 128;
        
        // 计算椭圆上的点
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * 2 * Math.PI;
            
            // 椭圆参数方程
            const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(angle));
            const x = radius * Math.cos(angle);
            const z = radius * Math.sin(angle);
            const y = z * Math.sin(inclination);
            const zFinal = z * Math.cos(inclination);
            
            points.push(new THREE.Vector3(x, y, zFinal));
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
    
    createAsteroidBelt() {
        // 小行星带位于火星和木星之间，大约2.2-3.2 AU
        const innerRadius = 2.2 * this.scaleFactors.distance;
        const outerRadius = 3.2 * this.scaleFactors.distance;
        const asteroidCount = 1200; // 增加小行星数量
        
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
            
            // 创建小行星（增大尺寸使其更明显）
            const asteroidSize = 0.04 + Math.random() * 0.06; // 增大随机尺寸
            const geometry = new THREE.SphereGeometry(asteroidSize, 8, 8); // 增加细分度
            
            // 使用更明显的材质和颜色
            const material = new THREE.MeshLambertMaterial({ 
                color: 0xA0825A, // 更亮的棕灰色
                transparent: true,
                opacity: 0.9
            });
            
            const asteroid = new THREE.Mesh(geometry, material);
            asteroid.position.set(x, y, z);
            asteroid.castShadow = true;
            asteroid.receiveShadow = true;
            
            // 存储小行星的轨道信息
            asteroid.userData = {
                angle: angle,
                distance: distance,
                heightVariation: heightVariation,
                radiusVariation: radiusVariation,
                rotationSpeed: 0.0002 + Math.random() * 0.0003 // 减慢随机轨道速度
            };
            
            this.asteroids.push(asteroid);
            this.scene.add(asteroid);
        }
    }
    
    setupControls() {
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.25;
        this.controls.enableZoom = true;
        this.controls.enablePan = true;
        this.controls.autoRotate = false;
    }
    
    setupClock() {
        this.updateClock();
        setInterval(() => this.updateClock(), 1000);
    }
    
    updateClock() {
        const now = new Date();
        const timeString = now.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
        document.getElementById('clock').textContent = timeString;
    }
    
    createLabels() {
        // 创建太阳标签
        const sunLabel = document.createElement('div');
        sunLabel.className = 'planet-label';
        sunLabel.textContent = this.celestialData.sun.name;
        sunLabel.style.color = `#${this.celestialData.sun.color.toString(16)}`;
        document.body.appendChild(sunLabel);
        
        this.labels.push({
            element: sunLabel,
            object: this.sun
        });
        
        // 创建行星标签
        this.planets.forEach((planet, index) => {
            const label = document.createElement('div');
            label.className = 'planet-label';
            label.textContent = planet.userData.name;
            label.style.color = `#${planet.userData.color.toString(16)}`;
            document.body.appendChild(label);
            
            this.labels.push({
                element: label,
                object: planet
            });
        });
    }
    
    calculatePlanetPosition(planet, time) {
        const data = planet.userData;
        const semiMajorAxis = data.distance * this.scaleFactors.distance; // 半长轴
        const eccentricity = data.eccentricity || 0; // 偏心率
        const inclination = (data.inclination || 0) * Math.PI / 180; // 倾斜角
        
        // 计算平均近点角（基于当前时间）
        const daysSinceEpoch = time / (1000 * 60 * 60 * 24);
        const meanAnomaly = (daysSinceEpoch / data.orbitalPeriod) * 2 * Math.PI;
        
        // 用迭代法求解偏心近点角（简化的牛顿迭代）
        let eccentricAnomaly = meanAnomaly;
        for (let i = 0; i < 5; i++) {
            eccentricAnomaly = meanAnomaly + eccentricity * Math.sin(eccentricAnomaly);
        }
        
        // 计算真近点角
        const trueAnomaly = 2 * Math.atan2(
            Math.sqrt(1 + eccentricity) * Math.sin(eccentricAnomaly / 2),
            Math.sqrt(1 - eccentricity) * Math.cos(eccentricAnomaly / 2)
        );
        
        // 计算距离（椭圆径向距离）
        const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / (1 + eccentricity * Math.cos(trueAnomaly));
        
        // 在轨道平面上的位置
        const xOrbit = radius * Math.cos(trueAnomaly);
        const zOrbit = radius * Math.sin(trueAnomaly);
        
        // 考虑轨道倾斜角的3D位置计算
        const x = xOrbit;
        const y = zOrbit * Math.sin(inclination);
        const z = zOrbit * Math.cos(inclination);
        
        planet.position.set(x, y, z);
        
        // 行星自转
        const rotationAngle = (daysSinceEpoch / data.rotationPeriod) * 2 * Math.PI;
        planet.rotation.y = rotationAngle;
    }
    
    updateLabels() {
        if (!this.labels || !this.camera) return;
        
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
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = Date.now();
        
        // 更新行星位置
        this.planets.forEach(planet => {
            this.calculatePlanetPosition(planet, currentTime);
        });
        
        // 更新小行星带位置
        this.updateAsteroids(currentTime);
        
        // 太阳自转
        if (this.sun) {
            const daysSinceEpoch = currentTime / (1000 * 60 * 60 * 24);
            this.sun.rotation.y = (daysSinceEpoch / this.celestialData.sun.rotationPeriod) * 2 * Math.PI;
        }
        
        this.controls.update();
        
        // 只有在标签数组存在时才更新标签
        if (this.labels && this.labels.length > 0) {
            this.updateLabels();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateAsteroids(currentTime) {
        this.asteroids.forEach(asteroid => {
            const data = asteroid.userData;
            
            // 计算新的角度位置（缓慢旋转）
            data.angle += data.rotationSpeed;
            
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