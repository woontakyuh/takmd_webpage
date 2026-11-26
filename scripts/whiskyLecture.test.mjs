import { describe, expect, test } from 'bun:test';
import { Group, PerspectiveCamera, Vector3 } from 'three';
import { WHISKY_LECTURE, whiskyLectureLayout, whiskyLecturePose } from '../src/components/studio/scene/WhiskyLectureLayout';
import { advanceLecturePage, lectureLeafState, visibleLecturePages, lectureStackState, stepLectureTurn, lectureSheetPoint } from '../src/components/studio/scene/WhiskyLectureMotion';
import { focusFov } from '../src/components/studio/scene/config';
import { createLectureSheet } from '../src/components/studio/scene/WhiskyLectureSheet';

describe('cabinet lecture page turns', () => {
  test('Given a low frame rate, when a page turns, then it settles in the same wall-clock interval', () => {
    // Given
    const durations = [];
    // When
    for (const delta of [1 / 60, 1 / 15]) {
      let cursor = 2;
      let elapsed = 0;
      while (cursor !== 3 && elapsed < 3) {
        cursor = stepLectureTurn(cursor, 3, delta, false);
        elapsed += delta;
      }
      durations.push(elapsed);
    }
    // Then
    expect(Math.abs(durations[0] - durations[1])).toBeLessThan(.1);
    expect(durations[1]).toBeLessThan(1.2);
  });
  test('Given rapid navigation across the deck, when motion advances, then each adjacent sheet remains available in the bounded texture window', () => {
    // Given
    let cursor = 0;
    const visited = new Set([0]);
    // When
    for (let frame = 0; frame < 1200 && cursor !== 25; frame++) {
      const available = visibleLecturePages(Math.floor(cursor), 26);
      const next = stepLectureTurn(cursor, 25, 1 / 60, false);
      expect(available).toContain(Math.ceil(next));
      cursor = next;
      visited.add(Math.floor(cursor));
    }
    // Then
    expect(cursor).toBe(25);
    expect(visited.size).toBe(26);
  });

  test('Given the generated sheet geometry, when a turn completes, then its actual surface normal exposes the back face', () => {
    // Given
    const sheet = createLectureSheet(1);
    // When
    const normal = sheet.getAttribute('normal');
    const center = Math.floor(normal.count / 2);
    // Then
    expect(normal.getZ(center)).toBeLessThan(-.9);
    expect(Math.abs(normal.getY(center))).toBeGreaterThan(.05);
    sheet.dispose();
  });

  test('Given a turned stack, when sampling its free area, then its blank sheets stay above the readable slide', () => {
    // Given
    const topEdge = WHISKY_LECTURE.height / 2;
    // When / Then
    for (const y of [0, -WHISKY_LECTURE.height / 4, -WHISKY_LECTURE.height / 2]) {
      expect(lectureSheetPoint(0, y, 1).y).toBeGreaterThan(topEdge);
    }
  });
  test('Given any turn position, when the stacks are composed, then all 26 sheets are conserved', () => {
    // Given / When / Then
    for (const cursor of [0, .2, .8, 1, 12, 12.5, 24.9, 25]) {
      const stack = lectureStackState(cursor, 26);
      expect(stack.left + stack.right + stack.turning).toBe(26);
      expect(stack.left).toBe(Math.floor(cursor));
      expect(stack.right).toBe(25 - Math.floor(cursor));
    }
  });

  test('Given a half-turned sheet, when its surface is sampled, then it bends out of the cabinet while the magnet corner stays fixed', () => {
    // Given
    const { pinXs, pinY, height } = WHISKY_LECTURE;
    const pinX = pinXs[0];
    // When
    const pin = lectureSheetPoint(pinX, pinY, .5);
    const middle = lectureSheetPoint(0, 0, .5);
    const tip = lectureSheetPoint(0, -height / 2, .5);
    // Then
    expect(pin).toEqual({ x: pinX, y: pinY, z: 0 });
    expect(tip.z).toBeGreaterThan(.15);
    expect(Math.abs(middle.y - tip.y)).toBeGreaterThan(.015);
  });

  test('Given a completed turn, when the sheet is sampled, then its printed face is reversed above the pins with a shallow curl', () => {
    // Given
    const { pinY, height } = WHISKY_LECTURE;
    // When
    const point = lectureSheetPoint(0, -height / 2, 1);
    // Then
    expect(point.y).toBeGreaterThan(pinY + height / 2);
    expect(point.z).toBeGreaterThan(.05);
    expect(point.z).toBeLessThan(.1);
  });

  test('Given a turn in flight, when the target reverses, then the same continuous cursor returns without jumping', () => {
    // Given
    const cursor = 8.45;
    // When
    const reversed = stepLectureTurn(cursor, 8, 1 / 60, false);
    // Then
    expect(reversed).toBeLessThan(cursor);
    expect(reversed).toBeGreaterThan(cursor - .05);
  });

  test('Given rapid navigation to the last page, when one frame advances, then motion stays bounded and reduced motion reaches the exact target', () => {
    // Given
    const cursor = 0;
    // When
    const next = stepLectureTurn(cursor, 25, 1 / 60, false);
    const reduced = stepLectureTurn(cursor, 25, 1 / 60, true);
    // Then
    expect(next).toBeLessThanOrEqual(2.8 / 60);
    expect(reduced).toBe(25);
  });
  test('Given the first and last pages, when navigation continues past either bound, then the index stays within the 26-slide deck', () => {
    // Given
    const count = 26;

    // When
    const beforeFirst = advanceLecturePage(0, -1, count);
    const afterLast = advanceLecturePage(count - 1, 1, count);

    // Then
    expect(beforeFirst).toBe(0);
    expect(afterLast).toBe(25);
  });

  test('Given a forward turn in flight, when the visitor immediately reverses it, then the same leaf returns to the current position', () => {
    // Given
    const forward = advanceLecturePage(8, 1, 26);
    const turningLeaf = 8;

    // When
    const reversed = advanceLecturePage(forward, -1, 26);

    // Then
    expect(reversed).toBe(8);
    expect(lectureLeafState(turningLeaf, reversed)).toBe('current');
  });

  test('Given a middle page, when the physical stack is composed, then only the previous, current and next leaves carry slide faces', () => {
    // Given
    const index = 12;

    // When
    const visible = visibleLecturePages(index, 26);

    // Then
    expect(visible).toEqual([11, 12, 13]);
  });
});

describe('cabinet lecture reading composition', () => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 844, height: 390 }]) {
    test(`Given a rotated cabinet, when inspecting at ${viewport.width}x${viewport.height}, then the entire paper fits above its controls`, () => {
      const card = new Group();
      card.position.set(1.7, 0.92, -2.1);
      card.rotation.y = 0.42;
      const layout = whiskyLectureLayout(viewport);
      const pose = whiskyLecturePose(card, viewport);
      const camera = new PerspectiveCamera(focusFov(null, viewport.width < 760, viewport.width, viewport.height), viewport.width / viewport.height, 0.02, 80);
      camera.position.set(...pose.position);
      camera.lookAt(new Vector3(...pose.target));
      camera.updateMatrixWorld(true);
      for (const x of [-WHISKY_LECTURE.width / 2, WHISKY_LECTURE.width / 2]) {
        for (const y of [-WHISKY_LECTURE.height / 2, WHISKY_LECTURE.height / 2]) {
          const projected = card.localToWorld(new Vector3(x, y, 0)).project(camera);
          const screenX = (projected.x + 1) * viewport.width / 2;
          const screenY = (1 - projected.y) * viewport.height / 2;
          expect(screenX).toBeGreaterThanOrEqual(16);
          expect(screenX).toBeLessThanOrEqual(viewport.width - 16);
          expect(screenY).toBeGreaterThanOrEqual(60);
          expect(screenY).toBeLessThanOrEqual(layout.paperTop + layout.paperHeight + 1);
        }
      }
    });
  }
});
