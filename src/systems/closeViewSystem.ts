import * as THREE from 'three';
import { RenderSystem } from './renderSystem.js';
import { CelestialObjects } from '../objects/celestialObjects.js';

/**
 * 天体近景浏览系统
 * 负责处理天体点击、近景相机控制和纹理切换
 */
export class CloseViewSystem {
    private isCloseViewMode: boolean = false;
    private raycaster: THREE.Raycaster = new THREE.Raycaster();
    private mouse: THREE.Vector2 = new THREE.Vector2();
    private savedCameraState: {
        position: THREE.Vector3;
        target: THREE.Vector3;
        up: THREE.Vector3;
    } | null = null;
    private currentTarget: THREE.Mesh | null = null;
    private animating: boolean = false;
    private closeViewUI: HTMLElement | null = null;
    private targetNameElement: HTMLElement | null = null;
    private clickHintElement: HTMLElement | null = null;
    private toastElement: HTMLElement | null = null;
    private toastTitleElement: HTMLElement | null = null;
    
    // 自定义相机控制变量
    private customCameraControl: boolean = false;
    private mouseDown: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;
    private spherical: THREE.Spherical = new THREE.Spherical();
    private customCameraDistance: number = 0;

    constructor(
        private renderSystem: RenderSystem,
        private celestialObjects: CelestialObjects
    ) {
        this.setupEventListeners();
        this.initializeUIElements();
    }

    /**
     * 初始化UI元素
     */
    private initializeUIElements(): void {
        this.closeViewUI = document.getElementById('close-view-ui');
        this.targetNameElement = document.getElementById('target-name');
        this.clickHintElement = document.getElementById('click-hint');
        this.toastElement = document.getElementById('toast-notification');
        this.toastTitleElement = document.getElementById('toast-title');
    }

    /**
     * 设置事件监听器
     */
    private setupEventListeners(): void {
        // 鼠标点击事件
        window.addEventListener('click', (event) => this.onMouseClick(event));
        
        // 鼠标移动事件（用于光标变化）
        window.addEventListener('mousemove', (event) => this.onMouseMove(event));
        
        // ESC键退出近景模式
        window.addEventListener('keydown', (event) => {
            if (event.code === 'Escape' && this.isCloseViewMode) {
                this.exitCloseView();
            }
        });
        
        // 自定义相机控制事件监听器
        this.setupCustomCameraControls();
    }

    /**
     * 处理鼠标移动事件（光标变化）
     */
    private onMouseMove(event: MouseEvent): void {
        if (this.isCloseViewMode || this.animating) return;

        // 计算鼠标位置（标准化设备坐标）
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 设置射线投射器
        this.raycaster.setFromCamera(this.mouse, this.renderSystem.camera);

        // 获取所有可点击的天体对象
        const clickableObjects = this.getClickableObjects();
        const intersects = this.raycaster.intersectObjects(clickableObjects, false);

        // 根据是否悬停在天体上改变光标
        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 处理鼠标点击事件
     */
    private onMouseClick(event: MouseEvent): void {
        if (this.isCloseViewMode || this.animating) return;

        // 计算鼠标位置（标准化设备坐标）
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        // 设置射线投射器
        this.raycaster.setFromCamera(this.mouse, this.renderSystem.camera);

        // 获取所有可点击的天体对象
        const clickableObjects = this.getClickableObjects();
        const intersects = this.raycaster.intersectObjects(clickableObjects, false);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object as THREE.Mesh;
            this.enterCloseView(clickedObject);
        }
    }

    /**
     * 获取所有可点击的天体对象
     */
    private getClickableObjects(): THREE.Mesh[] {
        const objects: THREE.Mesh[] = [];
        
        // 添加太阳
        if (this.celestialObjects.sun) {
            objects.push(this.celestialObjects.sun);
        }
        
        // 添加所有行星
        objects.push(...this.celestialObjects.planets);
        
        // 添加月球
        if (this.celestialObjects.moon) {
            objects.push(this.celestialObjects.moon);
        }
        
        return objects;
    }

    /**
     * 进入近景浏览模式
     */
    private enterCloseView(target: THREE.Mesh): void {
        if (this.animating) return;

        this.animating = true;
        this.currentTarget = target;
        
        // 保存当前相机状态
        this.saveCameraState();
        
        // 计算近景位置
        const closeViewPosition = this.calculateCloseViewPosition(target);
        
        // 执行相机动画
        this.animateCameraToCloseView(target, closeViewPosition);
        
        console.log(`Entering close view for: ${target.userData?.['name']}`);
    }

    /**
     * 保存当前相机状态
     */
    private saveCameraState(): void {
        const camera = this.renderSystem.camera;
        const controls = this.renderSystem.controls;
        
        this.savedCameraState = {
            position: camera.position.clone(),
            target: controls.target.clone(),
            up: camera.up.clone()
        };
    }

    /**
     * 计算近景位置
     */
    private calculateCloseViewPosition(target: THREE.Mesh): THREE.Vector3 {
        const targetData = target.userData;
        let actualRadius: number;
        
        // 特殊处理太阳
        if (targetData['name'] === '太阳') {
            actualRadius = targetData['radius'] * 0.015; // 使用sunSize缩放因子
        } else {
            const baseRadius = targetData['radius'] || 1;
            const scaleFactor = targetData['scaleFactor'] || 1;
            actualRadius = baseRadius * 0.5 * scaleFactor; // 使用planetSize缩放因子
        }
        
        // 计算相机距离，使天体直径占屏幕高度的240%（更接近，原来是120%）
        const fov = this.renderSystem.camera.fov * Math.PI / 180;
        const targetDistance = (actualRadius * 2) / (2.4 * Math.tan(fov / 2));
        
        // 改进的相机位置计算：避免极点问题
        // 使用当前相机位置与天体位置的向量，但规范化并应用正确的距离
        const currentCameraPos = this.renderSystem.camera.position.clone();
        const targetPos = target.position.clone();
        
        // 计算从天体中心指向当前相机的方向向量
        let direction = currentCameraPos.sub(targetPos).normalize();
        
        // 如果方向向量太小（可能在天体内部），使用默认方向
        if (direction.length() < 0.1) {
            direction = new THREE.Vector3(0, 0, 1);
        }
        
        // 确保方向不会太接近垂直向上或向下（避免极点问题）
        if (Math.abs(direction.y) > 0.95) {
            direction.set(0.3, direction.y, 0.7).normalize();
        }
        
        // 相机位置：天体位置 + 规范化方向 * 目标距离
        const cameraPosition = target.position.clone().add(
            direction.multiplyScalar(actualRadius + targetDistance)
        );
        
        console.log(`Close view for ${targetData['name']}: radius=${actualRadius}, distance=${targetDistance}, direction=${direction.x.toFixed(2)},${direction.y.toFixed(2)},${direction.z.toFixed(2)}`);
        
        return cameraPosition;
    }

    /**
     * 相机动画到近景位置
     */
    private animateCameraToCloseView(target: THREE.Mesh, targetPosition: THREE.Vector3): void {
        const camera = this.renderSystem.camera;
        const controls = this.renderSystem.controls;
        
        const startPosition = camera.position.clone();
        const startTarget = controls.target.clone();
        
        const duration = 2000; // 2秒动画
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easeInOutCubic缓动函数
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // 插值相机位置
            camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
            
            // 插值控制器目标
            controls.target.lerpVectors(startTarget, target.position, easeProgress);
            
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成
                this.isCloseViewMode = true;
                this.animating = false;
                
                // 切换到近景模式材质（无光照影响）
                this.switchToCloseViewMaterial(this.currentTarget!);
                
                // 提升几何体分辨率以获得平滑表面
                this.upgradeGeometryResolution(this.currentTarget!);
                
                // 显示Toast通知
                this.showToast(`正在观察 ${this.currentTarget!.userData?.['name']} 的表面`);
                
                // 设置控制器目标为当前天体中心，确保旋转围绕天体进行
                controls.target.copy(this.currentTarget!.position);
                
                // 计算理想的观察距离
                const currentDistance = this.currentTarget!.position.distanceTo(camera.position);
                
                // 启用自定义相机控制系统
                this.enableCustomCameraControl(this.currentTarget!, currentDistance);
                
                console.log(`Close view: Custom camera control enabled (distance: ${currentDistance.toFixed(3)})`);
                console.log('Close view animation completed');
            }
        };
        
        animate();
    }

    /**
     * 退出近景浏览模式
     */
    private exitCloseView(): void {
        if (!this.isCloseViewMode || !this.savedCameraState || this.animating) return;

        this.animating = true;
        
        const camera = this.renderSystem.camera;
        const controls = this.renderSystem.controls;
        
        const startPosition = camera.position.clone();
        const startTarget = controls.target.clone();
        
        const duration = 2000; // 2秒动画
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // 使用easeInOutCubic缓动函数
            const easeProgress = progress < 0.5 
                ? 4 * progress * progress * progress 
                : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
            // 插值回原位置
            camera.position.lerpVectors(startPosition, this.savedCameraState!.position, easeProgress);
            controls.target.lerpVectors(startTarget, this.savedCameraState!.target, easeProgress);
            
            controls.update();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成，恢复控制器功能
                controls.enablePan = true;
                controls.enableZoom = true;
                controls.enableRotate = true;
                
                // 禁用自定义相机控制
                this.disableCustomCameraControl();
                
                // 恢复原始材质
                if (this.currentTarget) {
                    this.restoreOriginalMaterial(this.currentTarget);
                    this.restoreOriginalGeometry(this.currentTarget);
                }
                
                // 重置状态
                this.isCloseViewMode = false;
                this.currentTarget = null;
                this.savedCameraState = null;
                this.animating = false;
                
                console.log('Exited close view mode');
            }
        };
        
        animate();
    }

    /**
     * 更新系统（在动画循环中调用）
     */
    update(): void {
        // 如果在近景模式且有目标
        if (this.isCloseViewMode && this.currentTarget && !this.animating) {
            if (this.customCameraControl) {
                // 自定义相机控制模式：让相机跟随天体运动但保持相对位置
                this.updateCustomCameraPosition();
            } else {
                // OrbitControls模式
                const controls = this.renderSystem.controls;
                // 确保控制器目标始终是天体中心
                controls.target.copy(this.currentTarget.position);
                // 更新控制器
                controls.update();
            }
        }
    }

    /**
     * 获取当前是否在近景模式
     */
    isInCloseViewMode(): boolean {
        return this.isCloseViewMode;
    }

    /**
     * 获取当前观察的天体名称
     */
    getCurrentTargetName(): string | null {
        return this.currentTarget?.userData?.['name'] || null;
    }

    /**
     * 显示近景模式UI
     */
    private showCloseViewUI(): void {
        if (this.closeViewUI && this.targetNameElement && this.currentTarget) {
            const targetName = this.currentTarget.userData?.['name'] || '未知天体';
            this.targetNameElement.textContent = targetName;
            this.closeViewUI.style.display = 'block';
            
            // 淡入效果
            this.closeViewUI.style.opacity = '0';
            setTimeout(() => {
                if (this.closeViewUI) {
                    this.closeViewUI.style.opacity = '1';
                    this.closeViewUI.style.transition = 'opacity 0.5s ease';
                }
            }, 100);
        }
        
        // 隐藏点击提示
        if (this.clickHintElement) {
            this.clickHintElement.style.display = 'none';
        }
    }

    /**
     * 隐藏近景模式UI
     */
    private hideCloseViewUI(): void {
        if (this.closeViewUI) {
            this.closeViewUI.style.opacity = '0';
            setTimeout(() => {
                if (this.closeViewUI) {
                    this.closeViewUI.style.display = 'none';
                }
            }, 500);
        }
        
        // 显示点击提示
        if (this.clickHintElement) {
            this.clickHintElement.style.display = 'block';
        }
    }

    /**
     * 切换到近景模式材质（无光照影响）
     */
    private switchToCloseViewMaterial(target: THREE.Mesh): void {
        const originalMaterial = target.material as THREE.Material;
        
        // 保存原始材质
        if (!target.userData['originalMaterial']) {
            target.userData['originalMaterial'] = originalMaterial;
        }
        
        // 创建无光照材质
        if (originalMaterial instanceof THREE.MeshLambertMaterial) {
            const closeViewMaterial = new THREE.MeshBasicMaterial({
                color: originalMaterial.color,
                transparent: originalMaterial.transparent,
                opacity: originalMaterial.opacity
            });
            target.material = closeViewMaterial;
        }
    }

    /**
     * 恢复原始材质
     */
    private restoreOriginalMaterial(target: THREE.Mesh): void {
        if (target.userData['originalMaterial']) {
            target.material = target.userData['originalMaterial'];
            delete target.userData['originalMaterial'];
        }
    }

    /**
     * 设置自定义相机控制事件监听器
     */
    private setupCustomCameraControls(): void {
        const canvas = this.renderSystem.renderer.domElement;
        
        // 鼠标按下事件
        canvas.addEventListener('mousedown', (event) => {
            if (this.customCameraControl && event.button === 0) { // 左键
                this.mouseDown = true;
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
        
        // 鼠标移动事件
        canvas.addEventListener('mousemove', (event) => {
            if (this.customCameraControl && this.mouseDown && this.currentTarget) {
                const deltaX = event.clientX - this.lastMouseX;
                const deltaY = event.clientY - this.lastMouseY;
                
                // 更新球坐标
                this.spherical.theta -= deltaX * 0.01;
                this.spherical.phi -= deltaY * 0.01; // 改变符号以匹配OrbitControls方向
                
                // 限制phi角度，避免翻转
                this.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.spherical.phi));
                
                this.updateCustomCameraPosition();
                
                this.lastMouseX = event.clientX;
                this.lastMouseY = event.clientY;
                
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
        
        // 鼠标抬起事件
        canvas.addEventListener('mouseup', (event) => {
            if (this.customCameraControl && event.button === 0) { // 左键
                this.mouseDown = false;
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
        
        // 禁用右键菜单
        canvas.addEventListener('contextmenu', (event) => {
            if (this.customCameraControl) {
                event.preventDefault();
                event.stopPropagation();
            }
        }, true);
    }

    /**
     * 启用自定义相机控制
     */
    private enableCustomCameraControl(target: THREE.Mesh, distance: number): void {
        this.customCameraControl = true;
        this.customCameraDistance = distance;
        
        // 禁用OrbitControls
        const controls = this.renderSystem.controls;
        controls.enabled = false;
        
        // 初始化球坐标
        const camera = this.renderSystem.camera;
        const targetPos = target.position;
        const cameraPos = camera.position.clone().sub(targetPos);
        
        this.spherical.setFromVector3(cameraPos);
        this.spherical.radius = distance;
        
        console.log(`Custom camera control enabled: theta=${this.spherical.theta.toFixed(3)}, phi=${this.spherical.phi.toFixed(3)}, radius=${this.spherical.radius.toFixed(3)}`);
    }

    /**
     * 禁用自定义相机控制
     */
    private disableCustomCameraControl(): void {
        this.customCameraControl = false;
        this.mouseDown = false;
        
        // 重新启用OrbitControls
        const controls = this.renderSystem.controls;
        controls.enabled = true;
        controls.enablePan = true;
        controls.enableZoom = true;
        controls.enableRotate = true;
        controls.enableDamping = true;
        controls.dampingFactor = 0.25;
        controls.minDistance = 0;
        controls.maxDistance = Infinity;
        
        console.log('Custom camera control disabled, OrbitControls restored');
    }

    /**
     * 更新自定义相机位置
     */
    private updateCustomCameraPosition(): void {
        if (!this.currentTarget || !this.customCameraControl) return;
        
        const camera = this.renderSystem.camera;
        const targetPos = this.currentTarget.position;
        
        // 从球坐标计算相机位置
        const newCameraPos = new THREE.Vector3();
        newCameraPos.setFromSpherical(this.spherical);
        newCameraPos.add(targetPos);
        
        // 更新相机位置和目标
        camera.position.copy(newCameraPos);
        camera.lookAt(targetPos);
    }

    /**
     * 提升几何体分辨率用于近景观察
     */
    private upgradeGeometryResolution(target: THREE.Mesh): void {
        const geometry = target.geometry;
        
        // 保存原始几何体
        if (!target.userData['originalGeometry']) {
            target.userData['originalGeometry'] = geometry;
        }
        
        // 计算高分辨率几何体参数
        let highResSegments: number;
        const targetName = target.userData?.['name'];
        
        if (targetName === '太阳') {
            highResSegments = 128; // 太阳使用超高分辨率
        } else {
            highResSegments = 64;  // 行星和月球使用高分辨率
        }
        
        // 获取原始半径
        const boundingSphere = geometry.boundingSphere;
        if (!boundingSphere) {
            geometry.computeBoundingSphere();
        }
        const radius = geometry.boundingSphere!.radius;
        
        // 创建高分辨率几何体
        const highResGeometry = new THREE.SphereGeometry(radius, highResSegments, highResSegments);
        
        // 替换几何体
        target.geometry = highResGeometry;
        
        console.log(`Upgraded ${targetName} geometry to ${highResSegments}x${highResSegments} resolution`);
    }

    /**
     * 恢复原始几何体分辨率
     */
    private restoreOriginalGeometry(target: THREE.Mesh): void {
        if (target.userData['originalGeometry']) {
            // 释放高分辨率几何体内存
            target.geometry.dispose();
            
            // 恢复原始几何体
            target.geometry = target.userData['originalGeometry'];
            delete target.userData['originalGeometry'];
            
            console.log(`Restored ${target.userData?.['name']} to original geometry resolution`);
        }
    }

    /**
     * 显示Toast通知
     */
    private showToast(message: string): void {
        if (!this.toastElement || !this.toastTitleElement) return;
        
        // 隐藏点击提示
        if (this.clickHintElement) {
            this.clickHintElement.style.display = 'none';
        }
        
        // 解析消息，将天体名称用醒目颜色包装
        const celestialName = this.currentTarget?.userData?.['name'] || '未知天体';
        const wrappedMessage = `正在观察 <span class="celestial-name">${celestialName}</span> 的表面`;
        
        // 设置消息内容（使用innerHTML以支持HTML标签）
        this.toastTitleElement.innerHTML = wrappedMessage;
        
        // 显示Toast（淡入效果）
        this.toastElement.classList.add('show');
        
        // 5秒后自动隐藏并显示点击提示
        setTimeout(() => {
            if (this.toastElement) {
                this.toastElement.classList.remove('show');
                // Toast隐藏后显示点击提示
                setTimeout(() => {
                    if (this.clickHintElement && !this.isCloseViewMode) {
                        this.clickHintElement.style.display = 'block';
                    }
                }, 500);
            }
        }, 5000);
    }
}