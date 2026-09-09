import { LatheGeometry, MathUtils, Vector2 } from 'three';
import type { BufferGeometry } from 'three';
import type { BottleSpec } from './WhiskyBottleSpecs';
import { WHISKY_SILHOUETTES } from './WhiskySilhouettes';

type BottleSurface = {
  readonly low?: number;
  readonly high?: number;
  readonly halfAngle?: number;
  readonly offset?: number;
  readonly closed?: boolean;
};

function unreachable(value: never): never {
  throw new TypeError(`Unsupported bottle shape: ${String(value)}`);
}

export function bottleClosureStart(bottle: BottleSpec): number {
  switch (bottle.closure) {
    case 'crystal': return .855;
    case 'capsule': return 1 - bottle.capsuleHeight / bottle.height;
    default: return unreachable(bottle.closure);
  }
}

export function bottleRadiusAt(bottle: BottleSpec, height: number): number {
  const profile = WHISKY_SILHOUETTES[bottle.image];
  const sample = (index: number): number => {
    const i = MathUtils.clamp(index, 1, profile.length - 2);
    const previous = profile[Math.max(1, i - 1)][0];
    const current = profile[i][0];
    const next = profile[Math.min(profile.length - 2, i + 1)][0];
    return (previous + current * 4 + next) / 6;
  };
  const y = MathUtils.clamp(height, 0, 1);
  const step = y * (profile.length - 1);
  const index = Math.floor(step);
  const t = step - index;
  const a = sample(index - 1), b = sample(index);
  const c = sample(index + 1), d = sample(index + 2);
  const radius = MathUtils.clamp(.5 * ((2 * b) + (-a + c) * t
    + (2 * a - 5 * b + 4 * c - d) * t * t
    + (-a + 3 * b - 3 * c + d) * t * t * t), .1, 1.005);
  if (y < .025) return sample(1) * (.92 + .08 * Math.sin(y / .025 * Math.PI / 2)) * bottle.radius;
  // Product photos include a perspective ellipse at the crown; a real cap ends in a flat disk.
  if (y > .96) return sample(profile.length - 2) * (1 - .045 * MathUtils.smoothstep(y, .984, 1)) * bottle.radius;
  return radius * bottle.radius;
}

export function createBottleGeometry(bottle: BottleSpec, options: BottleSurface = {}): BufferGeometry {
  const { low = 0, high = 1, halfAngle = Math.PI, offset = 0, closed = false } = options;
  const rows = Math.max(2, Math.ceil((high - low) * 96));
  const points = Array.from({ length: rows + 1 }, (_, index) => {
    const y = MathUtils.lerp(low, high, index / rows);
    return new Vector2(Math.max(0, bottleRadiusAt(bottle, y) + offset), y * bottle.height);
  });
  if (closed) {
    points.unshift(new Vector2(0, low * bottle.height));
    points.push(new Vector2(0, high * bottle.height));
  }
  const radialSegments = bottle.shape === 'faceted' ? 24 : 64;
  const segments = Math.max(4, Math.ceil(radialSegments * halfAngle / Math.PI));
  const geometry = new LatheGeometry(points, segments, -halfAngle, halfAngle * 2);
  switch (bottle.shape) {
    case 'round': return geometry;
    case 'faceted': {
      const angleStep = Math.PI / 12;
      const angles = [-halfAngle, ...Array.from({ length: 23 }, (_, index) => (index + 1) * angleStep - Math.PI)
        .filter(angle => angle > -halfAngle + .000001 && angle < halfAngle - .000001), halfAngle];
      const aligned = new LatheGeometry(points, angles.length - 1, -halfAngle, halfAngle * 2);
      const position = aligned.getAttribute('position');
      for (let column = 0; column < angles.length; column += 1) {
        const angle = angles[column];
        const facetCenter = (Math.floor((angle + Math.PI) / angleStep) + .5) * angleStep - Math.PI;
        const facetRadius = Math.cos(angleStep / 2) / Math.cos(angle - facetCenter);
        for (let row = 0; row < points.length; row += 1) {
          const index = column * points.length + row;
          const radius = points[row].x * facetRadius;
          position.setXYZ(index, Math.sin(angle) * radius, points[row].y, Math.cos(angle) * radius);
        }
      }
      const faceted = aligned.toNonIndexed();
      aligned.dispose();
      geometry.dispose();
      faceted.computeVertexNormals();
      return faceted;
    }
    default: return unreachable(bottle.shape);
  }
}
