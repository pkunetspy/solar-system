import * as THREE from 'three';

export interface CelestialBodyData {
    name: string;
    radius: number;
    color: number;
    semiMajorAxis?: number;
    eccentricity: number;
    inclination?: number;
    meanLongitude?: number;
    longitudePerihelion?: number;
    longitudeNode?: number;
    orbitalPeriod: number;
    rotationPeriod: number;
    distance?: number;
    scaleFactor?: number;
}

export interface CelestialDataCollection {
    sun: CelestialBodyData;
    mercury: CelestialBodyData;
    venus: CelestialBodyData;
    earth: CelestialBodyData;
    mars: CelestialBodyData;
    jupiter: CelestialBodyData;
    saturn: CelestialBodyData;
    uranus: CelestialBodyData;
    neptune: CelestialBodyData;
    moon: CelestialBodyData;
}

export interface PlanetObject {
    mesh: THREE.Mesh;
    orbit: THREE.Line;
    label: HTMLElement;
    data: CelestialBodyData;
}

export interface AsteroidData {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    meanAnomaly: number;
    mesh: THREE.Mesh;
}

export type TimeMode = 'static' | 'animation';

export interface OrbitalElements {
    semiMajorAxis: number;
    eccentricity: number;
    inclination: number;
    meanLongitude: number;
    longitudePerihelion: number;
    longitudeNode: number;
}

export interface Vector3D {
    x: number;
    y: number;
    z: number;
}