import * as THREE from 'three';

/**
 * 纹理系统管理类
 * 负责天体表面纹理的加载、缓存和切换
 */
export class TextureSystem {
    private textureLoader: THREE.TextureLoader = new THREE.TextureLoader();
    private textureCache: Map<string, THREE.Texture> = new Map();
    private loadingPromises: Map<string, Promise<THREE.Texture>> = new Map();
    private lastLoggedSecond: number = -1; // 用于控制调试信息输出频率
    
    // 纹理URL配置 - 仅使用本地纹理文件
    private textureUrls: Record<string, string> = {
        // 地球 - 使用NASA Blue Marble数据
        'earth': 'textures/earth_2k.jpg',
        
        // 月球 - 2K分辨率  
        'moon': 'textures/moon_2k.jpg',
        
        // 火星 - 2K分辨率
        'mars': 'textures/mars_2k.jpg',
        
        // 金星 - 2K分辨率
        'venus': 'textures/venus_2k.jpg',
        
        // 水星 - 2K分辨率
        'mercury': 'textures/mercury_2k.jpg',
        
        // 太阳 - 2K分辨率
        'sun': 'textures/sun_2k.jpg'
    };

    /**
     * 异步加载纹理
     */
    async loadTexture(celestialBodyName: string): Promise<THREE.Texture> {
        const name = celestialBodyName.toLowerCase();
        
        // 检查缓存
        if (this.textureCache.has(name)) {
            return this.textureCache.get(name)!;
        }
        
        // 检查是否正在加载
        if (this.loadingPromises.has(name)) {
            return this.loadingPromises.get(name)!;
        }
        
        // 检查是否有对应的纹理URL
        const textureUrl = this.getTextureUrl(name);
        if (!textureUrl) {
            throw new Error(`No texture available for ${celestialBodyName}`);
        }
        
        // 开始加载
        const loadingPromise = new Promise<THREE.Texture>((resolve, reject) => {
            this.textureLoader.load(
                textureUrl,
                (texture) => {
                    // 配置纹理参数
                    texture.wrapS = THREE.RepeatWrapping;
                    texture.wrapT = THREE.RepeatWrapping;
                    texture.generateMipmaps = true;
                    texture.minFilter = THREE.LinearMipmapLinearFilter;
                    texture.magFilter = THREE.LinearFilter;
                    
                    // 存入缓存
                    this.textureCache.set(name, texture);
                    this.loadingPromises.delete(name);
                    
                    console.log(`Texture loaded for ${celestialBodyName}: ${textureUrl}`);
                    resolve(texture);
                },
                (progress) => {
                    if (progress.total > 0) {
                        console.log(`Loading ${celestialBodyName} texture: ${Math.round(progress.loaded / progress.total * 100)}%`);
                    }
                },
                (error) => {
                    this.loadingPromises.delete(name);
                    console.error(`Failed to load texture for ${celestialBodyName}:`, error);
                    reject(error);
                }
            );
        });
        
        this.loadingPromises.set(name, loadingPromise);
        return loadingPromise;
    }
    
    /**
     * 获取纹理URL，支持名称映射
     */
    private getTextureUrl(name: string): string | undefined {
        // 中文名称映射
        const nameMapping: Record<string, string> = {
            '地球': 'earth',
            '月球': 'moon', 
            '火星': 'mars',
            '金星': 'venus',
            '水星': 'mercury',
            '太阳': 'sun'
        };
        
        const mappedName = nameMapping[name] || name;
        return this.textureUrls[mappedName];
    }
    
    /**
     * 检查是否有对应天体的纹理
     */
    hasTexture(celestialBodyName: string): boolean {
        const name = celestialBodyName.toLowerCase();
        const textureUrl = this.getTextureUrl(name);
        return !!textureUrl;
    }
    
    /**
     * 清理纹理缓存（释放内存）
     */
    dispose(): void {
        this.textureCache.forEach((texture) => {
            texture.dispose();
        });
        this.textureCache.clear();
        this.loadingPromises.clear();
    }
    
    /**
     * 创建带纹理的材质（改进光照效果）
     */
    createTexturedMaterial(texture: THREE.Texture, originalMaterial: THREE.Material, celestialName?: string): THREE.MeshLambertMaterial {
        const material = new THREE.MeshLambertMaterial({
            map: texture
        });
        
        // 月球特殊处理：降低光照强度，避免过曝
        if (celestialName === '月球') {
            // 使用更柔和的光照响应
            material.color.setHex(0x888888); // 设置为灰色调，降低整体亮度
            material.emissive.setHex(0x111111); // 添加少量自发光，增强暗部细节
        } else {
            // 其他天体：增加轻微自发光以增强背光面可见性
            material.emissive.setHex(0x0a0a0a); // 轻微自发光，增强纹理在暗面的可见性
        }
        
        // 如果原材质有特殊属性，保留它们
        if (originalMaterial instanceof THREE.MeshLambertMaterial || originalMaterial instanceof THREE.MeshBasicMaterial) {
            material.transparent = originalMaterial.transparent;
            material.opacity = originalMaterial.opacity;
        }
        
        return material;
    }
    
    /**
     * 应用天体真实自转（包括轴倾角，用于近景模式）
     */
    applyRealisticRotation(celestialMesh: THREE.Mesh, isEarthMoonSystem: boolean = false, simulationTime?: number): void {
        const celestialData = celestialMesh.userData;
        const celestialName = celestialData?.['name'];
        
        if (!celestialData || !celestialName) return;
        
        // 确定使用的时间：如果提供了模拟时间则使用，否则使用实时时间
        const baseTime = simulationTime || Date.now();
        const now = new Date(baseTime);
        const hoursFromEpoch = baseTime / (1000 * 60 * 60);
        
        // 根据天体类型使用不同的自转计算
        let rotationAngle: number;
        
        if (celestialName === '地球') {
            // 地球自转计算 - 基于恒星日（23小时56分4秒）
            // 使用传入的时间（可能是模拟时间或实时时间）
            
            // 使用UTC时间进行计算，避免时区混淆
            const utcHours = now.getUTCHours();
            const utcMinutes = now.getUTCMinutes();
            const utcSeconds = now.getUTCSeconds();
            
            // 计算UTC时间的小数形式
            const utcDecimal = utcHours + utcMinutes / 60.0 + utcSeconds / 3600.0;
            
            // 地球自转基于恒星日：23小时56分4秒 = 23.93447小时
            const siderealDayHours = 23.93447;
            const degreesPerHour = 360.0 / siderealDayHours; // 约15.04度/小时
            
            // 关键理解：纹理映射与坐标系统
            // 1. 标准地球纹理：u=0.5对应0°经线（格林威治），u=0对应-180°经线
            // 2. Three.js球体：rotation.y=0时，纹理u=0.5面向+Z方向
            // 3. 太阳在原点，相机在+Z方向，所以+Z方向背离太阳（午夜）
            // 4. 要让格林威治面向太阳（正午），需要rotation.y=π
            
            // 计算旋转角度：以UTC午夜为基准
            // UTC 0:00 -> 格林威治午夜 -> rotation.y = 0 (面向+Z，背离太阳)
            // UTC 12:00 -> 格林威治正午 -> rotation.y = π (面向-Z，朝向太阳)
            const hoursFromUTCMidnight = utcDecimal;
            const rotationDegrees = hoursFromUTCMidnight * degreesPerHour;
            
            // 地球从西向东自转，东经地区先看到日出
            // 使用正角度让纹理向正确方向移动，东部先亮
            rotationAngle = rotationDegrees * Math.PI / 180;
            
            // 运动模式下的调试信息
            if (simulationTime) {
                console.log(`🌍 运动模式地球自转: 模拟时间=${new Date(simulationTime).toISOString().substr(11,8)}, 旋转角度=${(rotationAngle * 180 / Math.PI).toFixed(1)}°`);
            }
            
        } else if (celestialName === '月球') {
            // 月球特殊自转处理：潮汐锁定（同步自转）
            // 月球自转周期 = 公转周期 = 27.321661天
            // 这意味着月球总是同一面朝向地球
            
            const rotationPeriod = Math.abs(celestialData['rotationPeriod']); // 27.321661天
            const daysSinceEpoch = hoursFromEpoch / 24;
            
            // 基础自转角度
            let baseRotationAngle = (daysSinceEpoch / rotationPeriod) * 2 * Math.PI;
            
            // 月球的天平动（libration）- 简化处理
            // 由于轨道偏心率，月球会有轻微摆动，让地球能看到约59%的月面
            const eccentricity = 0.0549; // 月球轨道偏心率
            const librationAmplitude = eccentricity * 0.1; // 简化的天平动幅度
            const libration = librationAmplitude * Math.sin(baseRotationAngle);
            
            rotationAngle = baseRotationAngle + libration;
        } else if (celestialName === '太阳') {
            // 太阳差分自转（赤道约25.4天，这里使用赤道自转周期）
            const rotationPeriod = Math.abs(celestialData['rotationPeriod']);
            const daysSinceEpoch = hoursFromEpoch / 24;
            rotationAngle = (daysSinceEpoch / rotationPeriod) * 2 * Math.PI;
        } else {
            // 其他天体使用标准自转周期
            const rotationPeriod = Math.abs(celestialData['rotationPeriod']);
            const daysSinceEpoch = hoursFromEpoch / 24;
            rotationAngle = (daysSinceEpoch / rotationPeriod) * 2 * Math.PI;
            
            // 处理逆向自转（金星、天王星、冥王星）
            if (celestialData['rotationPeriod'] < 0) {
                rotationAngle = -rotationAngle;
            }
        }
        
        // 获取自转轴倾斜角
        const axialTilt = celestialData['axialTilt'] || 0;
        const tiltRadians = axialTilt * Math.PI / 180;
        
        // 重置所有旋转
        celestialMesh.rotation.set(0, 0, 0);
        
        console.log(`🔄 应用旋转到 ${celestialName}:`);
        console.log(`   轴倾角: ${axialTilt.toFixed(2)}° (${tiltRadians.toFixed(4)} 弧度)`);
        console.log(`   自转角度: ${(rotationAngle * 180 / Math.PI).toFixed(1)}° (${rotationAngle.toFixed(4)} 弧度)`);
        
        // 应用复合旋转：先轴倾角，再自转
        if (Math.abs(axialTilt) > 0.1) {
            console.log(`   应用轴倾角: rotateX(${tiltRadians.toFixed(4)})`);
            celestialMesh.rotateX(tiltRadians);
            
            console.log(`   应用自转: rotateY(${rotationAngle.toFixed(4)})`);
            celestialMesh.rotateY(rotationAngle);
            
            console.log(`   复合旋转后的实际rotation: x=${celestialMesh.rotation.x.toFixed(4)}, y=${celestialMesh.rotation.y.toFixed(4)}, z=${celestialMesh.rotation.z.toFixed(4)}`);
        } else {
            // 轴倾角很小或没有倾角的天体（水星、太阳）
            console.log(`   直接应用自转: rotateY(${rotationAngle.toFixed(4)})`);
            celestialMesh.rotateY(rotationAngle);
            
            console.log(`   自转后的实际rotation: y=${celestialMesh.rotation.y.toFixed(4)}`);
        }
        
        // 特殊处理：地月系统真实尺度模式
        if (isEarthMoonSystem) {
            this.adjustEarthMoonSystemScale(celestialMesh, celestialName);
        }
        
        // 调试信息（仅在近景模式下显示）
        const rotation = rotationAngle * 180 / Math.PI;
        const displayRotation = ((rotation % 360) + 360) % 360;
        
        if (celestialName === '地球') {
            // 简化的时区验证逻辑 - 基于传入的时间
            const beijingTime = new Date(baseTime + (8 * 60 * 60 * 1000));  // UTC+8
            const beijingHour = beijingTime.getHours();
            const beijingMinute = beijingTime.getMinutes();
            const localTimeStr = `${beijingHour.toString().padStart(2, '0')}:${beijingMinute.toString().padStart(2, '0')}`;
            
            // 简化时区验证：基于深圳的实际太阳时
            // 深圳：东经114度，标准时区UTC+8，但太阳时需要考虑经度差
            const shenzhenLongitude = 114;
            
            // 计算深圳的太阳时（考虑经度差异）
            // 东经120度是UTC+8的标准经线，深圳114度比标准经线早6度
            // 6度 = 24分钟，所以深圳的太阳时比北京标准时间晚24分钟
            const shenzhenSolarTimeOffset = (120 - shenzhenLongitude) / 15; // 小时差
            const shenzhenSolarHour = beijingTime.getHours() + beijingTime.getMinutes()/60 + shenzhenSolarTimeOffset;
            
            // 规范化到24小时制
            let normalizedSolarHour = shenzhenSolarHour;
            while (normalizedSolarHour >= 24) normalizedSolarHour -= 24;
            while (normalizedSolarHour < 0) normalizedSolarHour += 24;
            
            // 基于太阳时判断白天黑夜（6-18点为白天）
            const calculatedStatus = (normalizedSolarHour >= 6 && normalizedSolarHour < 18) ? '白天' : '夜晚';
            
            // 基于北京标准时间的预期（简单判断）
            const expectedStatus = (beijingHour >= 6 && beijingHour < 18) ? '白天' : '夜晚';
            
            // 显示时间信息（只在静态模式或每10秒）
            const isAnimationMode = !!simulationTime;
            const currentSecond = Math.floor(baseTime / 10000);
            if (!isAnimationMode && currentSecond !== this.lastLoggedSecond) {
                this.lastLoggedSecond = currentSecond;
                console.log(`🌍 地球状态 [北京时间 ${localTimeStr}]: 轴倾角${axialTilt.toFixed(1)}° | 自转${(rotationAngle * 180 / Math.PI).toFixed(1)}° | 深圳太阳时${normalizedSolarHour.toFixed(1)}h -> ${calculatedStatus} (北京时间预期:${expectedStatus}) ${calculatedStatus === expectedStatus ? '✅' : '📍'}`);
            }
        } else {
            console.log(`${celestialName} 真实自转: ${displayRotation.toFixed(1)}°, 自转轴倾角: ${axialTilt.toFixed(2)}°`);
        }
    }
    
    /**
     * 验证太阳经度计算的合理性
     */
    private validateSunLongitudeCalculation(sunFacingLongitude: number, utcDecimal: number): void {
        // 简单验证：基于常识的时区检查
        const utcHour = Math.floor(utcDecimal);
        
        // 预期的太阳位置（简化版本）
        const expectedLongitudes: Record<number, number> = {
            0: 180,   // UTC 00:00 -> 太阳在180°（国际日期变更线）
            6: 90,    // UTC 06:00 -> 太阳在东经90°
            12: 0,    // UTC 12:00 -> 太阳在0°（格林威治）
            18: -90   // UTC 18:00 -> 太阳在西经90°
        };
        
        const expectedLon = expectedLongitudes[utcHour];
        if (expectedLon !== undefined) {
            const diff = Math.abs(sunFacingLongitude - expectedLon);
            const isReasonable = diff < 20; // 允许20度误差
            
            console.log(`🔍 太阳经度验证 UTC ${utcHour}:00`);
            console.log(`   预期经度: ${expectedLon}°`);
            console.log(`   计算经度: ${sunFacingLongitude.toFixed(1)}°`);
            console.log(`   误差: ${diff.toFixed(1)}° ${isReasonable ? '✅' : '❌'}`);
        }
    }
    
    /**
     * 调整地月系统为真实尺度（移除人工缩放）
     */
    private adjustEarthMoonSystemScale(celestialMesh: THREE.Mesh, celestialName: string): void {
        // 在地月系统近景模式下，需要考虑真实的尺度关系
        
        // 真实数据常量
        const EARTH_RADIUS_KM = 6371; // 地球半径（公里）
        const MOON_RADIUS_KM = 1737;  // 月球半径（公里）
        const EARTH_MOON_DISTANCE_KM = 384400; // 地月平均距离（公里）
        const SUN_RADIUS_KM = 696000; // 太阳半径（公里）
        const SUN_EARTH_DISTANCE_KM = 149597870; // 日地距离（公里）
        
        // 在Three.js场景中的单位转换因子（1个Three.js单位代表多少公里）
        // 基于当前地球的显示半径来计算
        const currentEarthRadius = celestialMesh.geometry.boundingSphere?.radius || 0.5;
        const kmPerThreeJSUnit = EARTH_RADIUS_KM / currentEarthRadius;
        
        // 根据天体类型进行相应的尺度调整
        if (celestialName === '地球') {
            // 地球在地月系统模式下保持当前尺寸作为参考基准
            console.log(`地球在地月系统模式: 半径 ${currentEarthRadius.toFixed(3)} Three.js单位 (${EARTH_RADIUS_KM}公里)`);
            
            // 地球特有的视觉效果调整可以在这里添加
            // 例如：增强大气层效果、云层等
            
        } else if (celestialName === '月球') {
            // 月球在近景模式下不进行真实尺度调整，保持与其他天体一致的显示尺寸
            // 这样确保所有天体在近景模式下有相似的视觉大小体验
            console.log('月球近景模式：保持显示尺寸，不调整为真实比例');
            
            // 注意：月球轨道距离也不调整，保持当前的模拟比例
        }
        
        // 通用的材质调整：在真实尺度模式下增强表面细节
        const currentMaterial = celestialMesh.material;
        if (currentMaterial instanceof THREE.MeshLambertMaterial && currentMaterial.map) {
            // 调整纹理重复以适应真实尺度
            const texture = currentMaterial.map;
            
            // 根据真实尺度调整纹理的细节级别
            if (celestialName === '地球') {
                // 地球纹理保持1:1映射
                texture.repeat.set(1, 1);
            } else if (celestialName === '月球') {
                // 月球纹理也保持1:1映射，但可能需要调整mipmapping
                texture.repeat.set(1, 1);
                texture.generateMipmaps = true;
                texture.minFilter = THREE.LinearMipmapLinearFilter;
            }
            
            texture.needsUpdate = true;
        }
        
        console.log(`${celestialName} 地月系统真实尺度模式已应用 (1 Three.js单位 = ${kmPerThreeJSUnit.toFixed(0)}公里)`);
    }
    
    /**
     * 调整月球轨道距离为真实比例
     */
    private adjustMoonOrbitalDistance(moonMesh: THREE.Mesh, earthRadius: number, kmPerThreeJSUnit: number): void {
        // 标记月球处于真实尺度模式
        moonMesh.userData['realScaleMode'] = true;
        moonMesh.userData['originalOrbitalDistance'] = moonMesh.userData['semiMajorAxis'];
        
        // 计算真实的地月距离（在Three.js单位中）
        const EARTH_MOON_DISTANCE_KM = 384400;
        const realMoonDistance = EARTH_MOON_DISTANCE_KM / kmPerThreeJSUnit;
        
        // 更新月球的轨道参数
        moonMesh.userData['semiMajorAxis'] = realMoonDistance;
        
        console.log(`月球轨道距离调整: 从模拟尺度调整到真实尺度 ${realMoonDistance.toFixed(3)} Three.js单位 (${EARTH_MOON_DISTANCE_KM}公里)`);
        
        // 注意：月球的实际位置会在主渲染循环中根据新的轨道参数更新
    }
    
    /**
     * 恢复月球轨道距离为模拟尺度
     */
    restoreMoonOrbitalDistance(moonMesh: THREE.Mesh): void {
        if (moonMesh.userData['realScaleMode']) {
            // 恢复原始轨道距离
            if (moonMesh.userData['originalOrbitalDistance']) {
                moonMesh.userData['semiMajorAxis'] = moonMesh.userData['originalOrbitalDistance'];
                delete moonMesh.userData['originalOrbitalDistance'];
            }
            
            // 清除真实尺度模式标记
            delete moonMesh.userData['realScaleMode'];
            
            console.log('月球轨道距离已恢复到模拟尺度');
        }
    }
    
    /**
     * 应用地球自转（基于当前真实时间） - 保留向后兼容
     * @deprecated 使用 applyRealisticRotation 替代
     */
    applyEarthRotation(earthMesh: THREE.Mesh): void {
        this.applyRealisticRotation(earthMesh, false);
    }
}