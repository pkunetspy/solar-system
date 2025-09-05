import * as THREE from 'three';
import { RenderSystem } from '../systems/renderSystem.js';

/**
 * 太阳光晕和日冕效果管理类
 * 负责创建真实的太阳光晕和日冕视觉效果
 */
export class SunEffects {
    constructor(private renderSystem: RenderSystem) {}

    /**
     * 为太阳创建光晕效果
     */
    createSunGlow(sunRadius: number): void {
        // 创建真实的太阳日冕效果
        this.createCoronaGlow(sunRadius);
        console.log('Realistic sun corona effect created');
    }

    /**
     * 创建日冕光晕效果
     */
    private createCoronaGlow(sunRadius: number): void {
        // 创建一个始终面向摄像机的圆形光晕
        const coronaSize = sunRadius * 4.0;
        const coronaGeometry = new THREE.PlaneGeometry(coronaSize, coronaSize, 64, 64);

        const coronaMaterial = new THREE.ShaderMaterial({
            uniforms: {
                sunRadius: { value: sunRadius },
                coronaRadius: { value: coronaSize / 2 },
                time: { value: 0.0 }
            },
            vertexShader: this.getCoronaVertexShader(),
            fragmentShader: this.getCoronaFragmentShader(),
            transparent: true,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide,
            depthWrite: false
        });

        const corona = new THREE.Mesh(coronaGeometry, coronaMaterial);
        corona.position.set(0, 0, 0);
        
        // 让光晕始终面向摄像机
        const camera = this.renderSystem.getCamera();
        if (camera) {
            corona.lookAt(camera.position);
        }
        
        this.renderSystem.addToScene(corona);

        // 动画更新
        const animate = () => {
            coronaMaterial.uniforms['time'].value = Date.now() * 0.001;
            // 始终面向摄像机
            const currentCamera = this.renderSystem.getCamera();
            if (currentCamera) {
                corona.lookAt(currentCamera.position);
            }
            requestAnimationFrame(animate);
        };
        animate();

        console.log('Billboard corona created');
    }

    /**
     * 获取日冕顶点着色器代码
     */
    private getCoronaVertexShader(): string {
        return `
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            void main() {
                vUv = uv;
                vec4 worldPos = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPos.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
    }

    /**
     * 获取日冕片段着色器代码
     */
    private getCoronaFragmentShader(): string {
        return `
            uniform float sunRadius;
            uniform float coronaRadius;
            uniform float time;
            varying vec2 vUv;
            varying vec3 vWorldPosition;
            
            void main() {
                // 计算从中心的距离
                vec2 center = vec2(0.5, 0.5);
                float distanceFromCenter = length(vUv - center) * 2.0; // 0到1范围
                
                // 如果在太阳本体内部，不显示
                float sunNormalized = sunRadius / coronaRadius;
                if (distanceFromCenter < sunNormalized) {
                    discard;
                }
                
                // 归一化距离：0 = 太阳表面, 1 = 光晕外层
                float normalizedDistance = (distanceFromCenter - sunNormalized) / (1.0 - sunNormalized);
                
                // 简单的圆形边界
                if (normalizedDistance > 1.0) {
                    discard;
                }
                
                // 颜色渐变：内层接近太阳本体色 -> 外层淡黄色
                vec3 innerColor = vec3(1.0, 0.8, 0.2); // 橙黄色，接近太阳本体
                vec3 outerColor = vec3(1.0, 1.0, 0.6); // 淡黄色
                vec3 color = mix(innerColor, outerColor, normalizedDistance);
                
                // 透明度渐变
                float alpha = 1.0 - smoothstep(0.0, 1.0, normalizedDistance);
                alpha *= 0.6; // 整体透明度
                
                gl_FragColor = vec4(color, alpha);
            }
        `;
    }
}