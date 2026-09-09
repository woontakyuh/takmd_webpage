import type { Point } from './config';

export type Footprint = {
  readonly minX: number;
  readonly maxX: number;
  readonly minZ: number;
  readonly maxZ: number;
};

export const ISIDORO_DIMENSIONS = {
  width: 0.71,
  depth: 0.51,
  height: 1.17,
  openWidth: 1.42,
} as const;

export const ISIDORO_WORKTOP_HEIGHT = 0.61;
export const ISIDORO_FIXED_HALF_OFFSET_Z = ISIDORO_DIMENSIONS.depth / 4;
export const ISIDORO_BOTTLE_DECK_TOP = 0.12;

export const WHISKY_CABINET = {
  ...ISIDORO_DIMENSIONS,
  center: [1.63, 0.0185, -2.9],
  rotation: Math.PI,
  shelfTops: [0.1, ISIDORO_WORKTOP_HEIGHT, 0.91],
} as const satisfies typeof ISIDORO_DIMENSIONS & {
  readonly center: Point;
  readonly rotation: number;
  readonly shelfTops: readonly number[];
};

export const WHISKY_CABINET_SLOTS = [
  [-0.245, ISIDORO_BOTTLE_DECK_TOP, -0.06],
  [-0.082, ISIDORO_BOTTLE_DECK_TOP, -0.06],
  [0.082, ISIDORO_BOTTLE_DECK_TOP, -0.06],
  [0.245, ISIDORO_BOTTLE_DECK_TOP, -0.06],
  [-0.16, ISIDORO_BOTTLE_DECK_TOP, 0.055],
  [0, ISIDORO_BOTTLE_DECK_TOP, 0.055],
  [0.16, ISIDORO_BOTTLE_DECK_TOP, 0.055],
] as const satisfies readonly Point[];

function bounds(points: readonly (readonly [number, number])[]): Footprint {
  return {
    minX: Math.min(...points.map(([x]) => x)),
    maxX: Math.max(...points.map(([x]) => x)),
    minZ: Math.min(...points.map(([, z]) => z)),
    maxZ: Math.max(...points.map(([, z]) => z)),
  };
}

export function isidoroFootprint(openAngle: number): Footprint {
  const halfWidth = ISIDORO_DIMENSIONS.width / 2;
  const halfDepth = ISIDORO_DIMENSIONS.depth / 2;
  const cosine = Math.cos(openAngle);
  const sine = Math.sin(openAngle);
  const movingClosed = [
    [-halfWidth, -halfDepth], [-halfWidth, 0], [halfWidth, -halfDepth], [halfWidth, 0],
  ] as const;
  const moving = movingClosed.map(([x, z]) => {
    const offsetX = x + halfWidth;
    return [-halfWidth + offsetX * cosine + z * sine, -offsetX * sine + z * cosine] as const;
  });
  const fixed = [
    [-halfWidth, 0], [-halfWidth, halfDepth], [halfWidth, 0], [halfWidth, halfDepth],
  ] as const;
  const worktopProjection = 0.32 * Math.sin(openAngle / 2);
  const worktop = openAngle > 0
    ? [[-0.31, -worktopProjection], [-0.31, 0], [0.31, -worktopProjection], [0.31, 0]] as const
    : [];
  return bounds([...moving, ...fixed, ...worktop]);
}

export function rotateFootprint(footprint: Footprint, center: Point, rotation: number): Footprint {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const corners = [
    [footprint.minX, footprint.minZ], [footprint.minX, footprint.maxZ],
    [footprint.maxX, footprint.minZ], [footprint.maxX, footprint.maxZ],
  ] as const;
  return bounds(corners.map(([x, z]) => [
    center[0] + x * cosine + z * sine,
    center[2] - x * sine + z * cosine,
  ] as const));
}
