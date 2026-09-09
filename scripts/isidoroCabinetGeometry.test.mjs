import { describe, expect, test } from 'bun:test';
import { FENDER_MUSIC_CORNER_BOUNDS } from '../src/components/studio/scene/FenderMusicCorner';
import { ROOM } from '../src/components/studio/scene/config';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import {
  ISIDORO_DIMENSIONS,
  ISIDORO_BOTTLE_DECK_TOP,
  ISIDORO_FIXED_HALF_OFFSET_Z,
  ISIDORO_WORKTOP_HEIGHT,
  WHISKY_CABINET,
  isidoroFootprint,
  rotateFootprint,
} from '../src/components/studio/scene/WhiskyCabinetLayout';

const gap = (a, b) => Math.hypot(
  Math.max(0, a.minX - b.maxX, b.minX - a.maxX),
  Math.max(0, a.minZ - b.maxZ, b.minZ - a.maxZ),
);

describe('Isidoro cabinet measured layout', () => {
  test('matches the official closed and open envelopes', () => {
    const closed = isidoroFootprint(0);
    const open = isidoroFootprint(Math.PI);

    expect(closed.maxX - closed.minX).toBeCloseTo(ISIDORO_DIMENSIONS.width, 6);
    expect(closed.maxZ - closed.minZ).toBeCloseTo(ISIDORO_DIMENSIONS.depth, 6);
    expect(open.maxX - open.minX).toBeCloseTo(ISIDORO_DIMENSIONS.openWidth, 6);
  });

  test('keeps the articulated leaf and worktop clear of the room, guitar, and desk', () => {
    const music = rotateFootprint({
      minX: FENDER_MUSIC_CORNER_BOUNDS.min[0], maxX: FENDER_MUSIC_CORNER_BOUNDS.max[0],
      minZ: FENDER_MUSIC_CORNER_BOUNDS.min[2], maxZ: FENDER_MUSIC_CORNER_BOUNDS.max[2],
    }, ROOM.music.position, ROOM.music.rotation);
    const desk = rotateFootprint({
      minX: -ROOM.desk.width / 2, maxX: ROOM.desk.width / 2,
      minZ: -ROOM.desk.depth / 2, maxZ: ROOM.desk.depth / 2,
    }, ROOM.desk.position, ROOM.desk.rotation);

    for (let step = 0; step <= 12; step += 1) {
      const angle = Math.PI * step / 12;
      const cabinet = rotateFootprint(isidoroFootprint(angle), WHISKY_CABINET.center, WHISKY_CABINET.rotation);
      expect(cabinet.minX).toBeGreaterThanOrEqual(-2.7);
      expect(cabinet.maxX).toBeLessThanOrEqual(2.78);
      expect(cabinet.minZ).toBeGreaterThanOrEqual(-3.32);
      expect(cabinet.maxZ).toBeLessThanOrEqual(3.27);
      expect(gap(cabinet, music)).toBeGreaterThanOrEqual(0.03);
      expect(gap(cabinet, desk)).toBeGreaterThanOrEqual(0.03);
    }
  });

  test('fits all seven real bottles below the worktop without overlap', () => {
    expect(WHISKY_BOTTLES).toHaveLength(7);
    expect(WHISKY_BOTTLES.some(({ name }) => name.includes('Armagnac'))).toBe(true);
    for (const bottle of WHISKY_BOTTLES) {
      const [x, y, z] = bottle.position;
      const cabinetZ = ISIDORO_FIXED_HALF_OFFSET_Z + z;
      expect(Math.abs(x) + bottle.radius).toBeLessThan(WHISKY_CABINET.width / 2 - 0.025);
      expect(cabinetZ - bottle.radius).toBeGreaterThanOrEqual(0.005);
      expect(cabinetZ + bottle.radius).toBeLessThanOrEqual(WHISKY_CABINET.depth / 2 - 0.025);
      expect(y).toBe(ISIDORO_BOTTLE_DECK_TOP);
      expect(y + bottle.height).toBeLessThan(ISIDORO_WORKTOP_HEIGHT - 0.02);
    }
    for (const [index, bottle] of WHISKY_BOTTLES.entries()) {
      for (const other of WHISKY_BOTTLES.slice(index + 1)) {
        const distance = Math.hypot(bottle.position[0] - other.position[0], bottle.position[2] - other.position[2]);
        expect(distance).toBeGreaterThanOrEqual(bottle.radius + other.radius + 0.01);
      }
    }
  });
});
