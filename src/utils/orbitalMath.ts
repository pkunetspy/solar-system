import * as THREE from 'three';
import { CelestialBodyData } from '../types/index.js';
import { J2000_EPOCH, scaleFactors } from '../data/celestialData.js';

/**
 * 轨道计算工具类
 * 负责处理天体的椭圆轨道位置计算
 */
export class OrbitalMath {
    /**
     * 计算行星在指定时间的3D位置
     * @param data 天体数据
     * @param time 时间戳
     * @returns 3D坐标向量
     */
    static calculatePlanetPosition(data: CelestialBodyData, time: number): THREE.Vector3 {
        // 计算从J2000.0历元到现在的天数
        const daysSinceJ2000 = (time - J2000_EPOCH) / (1000 * 60 * 60 * 24);

        // 轨道要素
        const semiMajorAxis = (data.semiMajorAxis || 0) * scaleFactors.distance;
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

        return new THREE.Vector3(x, z, y); // 注意坐标系转换
    }

    /**
     * 计算行星的自转角度
     * @param data 天体数据
     * @param time 时间戳
     * @returns 自转角度（弧度）
     */
    static calculateRotationAngle(data: CelestialBodyData, time: number): number {
        const daysSinceJ2000 = (time - J2000_EPOCH) / (1000 * 60 * 60 * 24);
        const rotationAngle = (daysSinceJ2000 / Math.abs(data.rotationPeriod)) * 2 * Math.PI;
        return data.rotationPeriod > 0 ? rotationAngle : -rotationAngle;
    }

    /**
     * 计算月球相对于地球的位置
     * @param moonData 月球数据
     * @param earthPosition 地球当前位置
     * @param time 时间戳
     * @returns 月球的3D坐标向量
     */
    static calculateMoonPosition(
        moonData: CelestialBodyData, 
        earthPosition: THREE.Vector3, 
        time: number
    ): THREE.Vector3 {
        // 计算从J2000.0历元到现在的天数
        const daysSinceJ2000 = (time - J2000_EPOCH) / (1000 * 60 * 60 * 24);

        // 月球相对于地球的轨道计算
        const moonDistance = (moonData.semiMajorAxis || 0) * scaleFactors.distance * 45; // 与celestialObjects.ts中保持一致
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
        return new THREE.Vector3(
            earthPosition.x + moonRelativeX,
            earthPosition.y + moonRelativeY,
            earthPosition.z + moonRelativeZ
        );
    }

    /**
     * 生成椭圆轨道路径点
     * @param data 天体数据
     * @param segments 轨道分段数
     * @returns 轨道路径点数组
     */
    static generateOrbitPath(data: CelestialBodyData, segments: number = 256): THREE.Vector3[] {
        const points: THREE.Vector3[] = [];

        // 轨道要素
        const semiMajorAxis = (data.semiMajorAxis || 0) * scaleFactors.distance;
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
            const radius = semiMajorAxis * (1 - eccentricity * eccentricity) / 
                (1 + eccentricity * Math.cos(trueAnomaly));

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

        return points;
    }
}