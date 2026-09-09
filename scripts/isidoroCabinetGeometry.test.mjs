import { describe, expect, test } from 'bun:test';
import { FENDER_MUSIC_CORNER_BOUNDS } from '../src/components/studio/scene/FenderMusicCorner';
import { ROOM } from '../src/components/studio/scene/config';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';
import {
  ISIDORO_DIMENSIONS,
  ISIDORO_OPEN_ANGLE,
  ISIDORO_BOTTLE_DECK_TOP,
  ISIDORO_BOTTLE_SHELF_TOP,
  ISIDORO_BOTTLE_SHELF_HEIGHT,
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
    const musicCenter = (FENDER_MUSIC_CORNER_BOUNDS.min[0] + FENDER_MUSIC_CORNER_BOUNDS.max[0]) / 2;
    const music = rotateFootprint({
      minX: FENDER_MUSIC_CORNER_BOUNDS.min[0] - musicCenter, maxX: FENDER_MUSIC_CORNER_BOUNDS.max[0] - musicCenter,
      minZ: FENDER_MUSIC_CORNER_BOUNDS.min[2], maxZ: FENDER_MUSIC_CORNER_BOUNDS.max[2],
    }, ROOM.music.position, ROOM.music.rotation);
    const desk = rotateFootprint({
      minX: -ROOM.desk.width / 2, maxX: ROOM.desk.width / 2,
      minZ: -ROOM.desk.depth / 2, maxZ: ROOM.desk.depth / 2,
    }, ROOM.desk.position, ROOM.desk.rotation);

    for (let step = 0; step <= 12; step += 1) {
      const angle = ISIDORO_OPEN_ANGLE * step / 12;
      const cabinet = rotateFootprint(isidoroFootprint(angle), WHISKY_CABINET.center, WHISKY_CABINET.rotation);
      expect(cabinet.minX).toBeGreaterThanOrEqual(-2.7);
      expect(cabinet.maxX).toBeLessThanOrEqual(2.78);
      expect(cabinet.minZ).toBeGreaterThanOrEqual(-3.32);
      expect(cabinet.maxZ).toBeLessThanOrEqual(3.27);
      expect(gap(cabinet, music)).toBeGreaterThanOrEqual(0.03);
      expect(gap(cabinet, desk)).toBeGreaterThanOrEqual(0.03);
    }
  });

  test('faces into the room toward the desk', () => {
    const forwardX = -Math.sin(WHISKY_CABINET.rotation);
    const forwardZ = -Math.cos(WHISKY_CABINET.rotation);
    const toDeskX = ROOM.desk.position[0] - WHISKY_CABINET.center[0];
    const toDeskZ = ROOM.desk.position[2] - WHISKY_CABINET.center[2];
    expect(forwardX * toDeskX + forwardZ * toDeskZ).toBeGreaterThan(0);
  });


  test('sits against the side wall and opens only 90 degrees along the back wall', () => {
    const closed = rotateFootprint(isidoroFootprint(0), WHISKY_CABINET.center, WHISKY_CABINET.rotation);
    const open = rotateFootprint(isidoroFootprint(ISIDORO_OPEN_ANGLE), WHISKY_CABINET.center, WHISKY_CABINET.rotation);
    expect(ISIDORO_OPEN_ANGLE).toBe(Math.PI / 2);
    expect(2.78 - closed.maxX).toBeGreaterThanOrEqual(0.02);
    expect(2.78 - closed.maxX).toBeLessThanOrEqual(0.06);
    expect(open.minZ + 3.32).toBeGreaterThanOrEqual(0.04);
    expect(open.minZ + 3.32).toBeLessThanOrEqual(0.09);
    expect(open.minX).toBeLessThan(closed.minX);
  });

  test('fits all seven real bottles on the two moving-half shelves without overlap', () => {
    expect(WHISKY_BOTTLES).toHaveLength(7);
    expect(WHISKY_BOTTLES.some(({ name }) => name.includes('Armagnac'))).toBe(true);
    expect(WHISKY_BOTTLES.filter(({ position }) => position[1] === ISIDORO_BOTTLE_SHELF_TOP)).toHaveLength(3);
    expect(WHISKY_BOTTLES.filter(({ position }) => position[1] === ISIDORO_BOTTLE_DECK_TOP)).toHaveLength(4);
    for (const bottle of WHISKY_BOTTLES) {
      const [x, y, z] = bottle.position;
      expect(Math.abs(x) + bottle.radius).toBeLessThan(WHISKY_CABINET.width / 2 - 0.025);
      expect(z - bottle.radius).toBeGreaterThanOrEqual(-0.085);
      expect(z + bottle.radius).toBeLessThanOrEqual(0.11);
      expect([ISIDORO_BOTTLE_DECK_TOP, ISIDORO_BOTTLE_SHELF_TOP]).toContain(y);
      const ceiling = y === ISIDORO_BOTTLE_DECK_TOP ? ISIDORO_BOTTLE_SHELF_HEIGHT - 0.009 : 1.145;
      expect(y + bottle.height).toBeLessThan(ceiling - 0.02);
    }
    for (const [index, bottle] of WHISKY_BOTTLES.entries()) {
      for (const other of WHISKY_BOTTLES.slice(index + 1)) {
        if (bottle.position[1] + bottle.height < other.position[1]
          || other.position[1] + other.height < bottle.position[1]) continue;
        const distance = Math.hypot(bottle.position[0] - other.position[0], bottle.position[2] - other.position[2]);
        expect(distance).toBeGreaterThanOrEqual(bottle.radius + other.radius + 0.01);
      }
    }
  });
});
