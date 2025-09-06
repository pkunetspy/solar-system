import { CelestialDataCollection } from '../types/index.js';

export interface ScaleFactors {
    distance: number;
    planetSize: number;
    sunSize: number;
}

// 真实的天体数据（相对比例，以地球为1）
export const celestialData: CelestialDataCollection = {
    sun: {
        name: '太阳',
        radius: 109,
        color: 0xFDB813,
        distance: 0,
        orbitalPeriod: 0,
        rotationPeriod: 25.4,
        eccentricity: 0,
        axialTilt: 7.25 // 相对黄道面的倾斜角（度）
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
        rotationPeriod: 58.6462,
        axialTilt: 0.034 // 几乎没有倾斜
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
        rotationPeriod: -243.0226,
        axialTilt: 177.4 // 逆向自转，几乎倒立
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
        rotationPeriod: 1.0,
        axialTilt: 23.44 // 地球的黄赤交角
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
        rotationPeriod: 27.321661,
        axialTilt: 6.68, // 相对地球轨道平面
        scaleFactor: 1.8 // 轻微增大可见性，但保持相对地球的合理比例
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
        rotationPeriod: 1.025957,
        axialTilt: 25.19 // 与地球相似的季节变化
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
        scaleFactor: 0.3,
        axialTilt: 3.13 // 轻微倾斜
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
        scaleFactor: 0.35,
        axialTilt: 26.73 // 明显的季节变化
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
        scaleFactor: 0.5,
        axialTilt: 97.77 // 几乎“躺着”运行
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
        scaleFactor: 0.5,
        axialTilt: 28.32 // 强烈的季节变化
    },
    pluto: {
        name: '冥王星',
        radius: 0.186,
        color: 0xA0522D,
        semiMajorAxis: 39.48211675,
        eccentricity: 0.24880766,
        inclination: 17.14001206,
        meanLongitude: 238.92903833,
        longitudePerihelion: 224.06891629,
        longitudeNode: 110.30393684,
        orbitalPeriod: 90560,
        rotationPeriod: 6.387230,
        scaleFactor: 5.0,
        axialTilt: 122.53 // 逆向自转，强烈倾斜
    }
};

// 缩放因子
export const scaleFactors: ScaleFactors = {
    distance: 10,
    planetSize: 0.5,
    sunSize: 0.015
};

// J2000.0 历元: 2000年1月1日 12:00:00 TT
export const J2000_EPOCH: number = new Date('2000-01-01T12:00:00Z').getTime();