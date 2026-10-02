import {
  CatmullRomCurve3,
  LatheGeometry,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
} from 'three';
import { ISIDORO_WORKTOP_TOP, ISIDORO_UPPER_SHELF_HEIGHT, ISIDORO_SHELF_THICKNESS } from './WhiskyCabinetLayout';

export const ISIDORO_BARWARE = {
  shelfTop: ISIDORO_UPPER_SHELF_HEIGHT + ISIDORO_SHELF_THICKNESS / 2,
  counterTop: ISIDORO_WORKTOP_TOP,
  tray: { centerX: 0, centerZ: 0, width: 0.52, depth: 0.18, thickness: 0.012 },
  glencairn: { height: 0.115, radius: 0.033 },
  coupe: { height: 0.17, radius: 0.0555 },
  mixingGlass: { x: -0.065, z: 0.025, height: 0.13, radius: 0.045, wall: 0.0025, base: 0.009 },
  shaker: { x: -0.185, z: 0.025, height: 0.215, radius: 0.045, strainerY: 0.15, capY: 0.19 },
  jigger: { x: -0.09, z: -0.055, height: 0.076, radius: 0.023 },
  spoon: { x: 0.09, z: -0.045, length: 0.29, radius: 0.016 },
} as const;

function hollowProfile(bottomRadius: number, topRadius: number, height: number, wall: number, base: number) {
  return [
    new Vector2(0, 0),
    new Vector2(bottomRadius, 0),
    new Vector2(bottomRadius, base * 0.55),
    new Vector2(topRadius, height - wall),
    new Vector2(topRadius, height),
    new Vector2(topRadius - wall, height),
    new Vector2(topRadius - wall, height - wall * 1.2),
    new Vector2(bottomRadius - wall, base),
    new Vector2(0, base),
  ];
}

function helix(length: number, radius: number, turns: number) {
  const points = Array.from({ length: 49 }, (_, index) => {
    const t = index / 48;
    const angle = t * turns * Math.PI * 2;
    return new Vector3(t * length - length / 2, Math.cos(angle) * radius, Math.sin(angle) * radius);
  });
  return new CatmullRomCurve3(points);
}

export type IsidoroBarwareGeometries = ReturnType<typeof createIsidoroBarwareGeometries>;

function curvedProfile(points: readonly (readonly [number, number])[], segments: number) {
  return new CatmullRomCurve3(points.map(([radius, height]) => new Vector3(radius, height, 0)))
    .getPoints(segments).map(point => new Vector2(point.x, point.y));
}

export function createIsidoroGlencairnGeometry() {
  return new LatheGeometry([
    new Vector2(0, 0), new Vector2(0.021, 0), new Vector2(0.022, 0.0015),
    new Vector2(0.022, 0.004), new Vector2(0.0205, 0.006),
    ...curvedProfile([
      [0.0195, 0.007], [0.0165, 0.015], [0.0145, 0.022],
      [0.021, 0.027], [0.029, 0.036], [0.033, 0.05],
      [0.0325, 0.062], [0.029, 0.079], [0.025, 0.097], [0.023, 0.114],
    ], 32),
    new Vector2(0.0227, 0.115), new Vector2(0.0215, 0.115),
    ...curvedProfile([
      [0.0215, 0.114], [0.0235, 0.097], [0.0275, 0.079],
      [0.031, 0.062], [0.0315, 0.05], [0.0275, 0.037],
      [0.019, 0.029], [0.009, 0.0275], [0, 0.0275],
    ], 28),
  ], 48);
}

export function createIsidoroCoupeGeometry() {
  return new LatheGeometry([
    new Vector2(0, 0), new Vector2(0.036, 0), new Vector2(0.038, 0.0015),
    new Vector2(0.037, 0.0035), new Vector2(0.029, 0.005),
    new Vector2(0.005, 0.008), new Vector2(0.0024, 0.014),
    new Vector2(0.0021, 0.106),
    ...curvedProfile([
      [0.003, 0.114], [0.014, 0.119], [0.031, 0.125],
      [0.044, 0.136], [0.052, 0.15], [0.0555, 0.169],
    ], 24),
    new Vector2(0.0552, 0.17), new Vector2(0.0539, 0.17),
    ...curvedProfile([
      [0.0539, 0.169], [0.0505, 0.151], [0.0425, 0.138],
      [0.03, 0.128], [0.014, 0.122], [0, 0.121],
    ], 24),
  ], 48);
}

export function createIsidoroBarwareGeometries() {
  const { mixingGlass } = ISIDORO_BARWARE;
  return {
    glencairn: createIsidoroGlencairnGeometry(),
    coupe: createIsidoroCoupeGeometry(),
    mixingGlass: new LatheGeometry(hollowProfile(0.041, mixingGlass.radius, mixingGlass.height,
      mixingGlass.wall, mixingGlass.base), 16),
    mixingBaseRing: new TorusGeometry(0.035, 0.0022, 8, 40),
    shakerTin: new LatheGeometry([
      new Vector2(0, 0), new Vector2(0.032, 0), new Vector2(0.034, 0.0015),
      new Vector2(0.0355, 0.006), new Vector2(0.037, 0.025),
      new Vector2(0.041, 0.095), new Vector2(0.0445, 0.146),
      new Vector2(0.045, 0.15), new Vector2(0, 0.15),
    ], 64),
    shakerStrainer: new LatheGeometry([
      new Vector2(0, 0), new Vector2(0.045, 0), new Vector2(0.045, 0.004),
      ...curvedProfile([
        [0.0445, 0.007], [0.0415, 0.012], [0.033, 0.024],
        [0.026, 0.034], [0.0235, 0.04],
      ], 16),
      new Vector2(0, 0.04),
    ], 64),
    shakerCap: new LatheGeometry([
      new Vector2(0, 0), new Vector2(0.0235, 0), new Vector2(0.0235, 0.003),
      new Vector2(0.023, 0.021), new Vector2(0.022, 0.024),
      new Vector2(0.020, 0.025), new Vector2(0, 0.025),
    ], 64),
    jiggerLarge: new LatheGeometry(hollowProfile(0.008, 0.023, 0.047, 0.0012, 0.0025), 36),
    jiggerSmall: new LatheGeometry(hollowProfile(0.007, 0.016, 0.029, 0.0012, 0.0022), 36),
    spoonShaft: new TubeGeometry(new CatmullRomCurve3([
      new Vector3(-0.145, 0, 0), new Vector3(0, 0, 0), new Vector3(0.145, 0, 0),
    ]), 48, 0.00115, 7, false),
    spoonTwist: new TubeGeometry(helix(0.265, 0.00165, 7), 96, 0.00048, 5, false),
    spoonBowl: new LatheGeometry(hollowProfile(0.008, 0.011, 0.005, 0.0007, 0.001), 32),
    spoonTip: new SphereGeometry(0.008, 20, 12),
  };
}

export function disposeIsidoroBarwareGeometries(geometries: IsidoroBarwareGeometries) {
  Object.values(geometries).forEach(geometry => geometry.dispose());
}
