import { describe, expect, test } from 'bun:test';
import { WHISKY_LECTURE } from '../src/components/studio/scene/WhiskyLectureLayout';
import { lectureSheetPoint } from '../src/components/studio/scene/WhiskyLectureMotion';

describe('magnetic paper attachment', () => {
  test('keeps both full magnet contact discs stationary throughout the turn', () => {
    // Given two 15.84mm magnets on the top binding edge.
    const centers = [[-.15, .42 * 1357 / 1920 / 2 - .010], [.15, .42 * 1357 / 1920 / 2 - .010]];
    // When each contact disc is sampled over a full forward turn.
    for (const [cx, cy] of centers) for (const t of [0, .25, .5, .75, 1]) for (let i = 0; i < 16; i++) {
      const x = cx + .00792 * Math.cos(i * Math.PI / 8);
      const y = cy + .00792 * Math.sin(i * Math.PI / 8);
      const point = lectureSheetPoint(x, y, t);
      // Then the attached paper remains at its original location.
      expect(point.x).toBeCloseTo(x, 8);
      expect(point.y).toBeCloseTo(y, 8);
      expect(point.z).toBeCloseTo(0, 8);
    }
  });

  test('clears the magnet caps as free paper curls over the top binding', () => {
    // Given a 28-sheet stack and the two stationary caps.
    const top = 27 * .00012 + .009 * .72 + .00005;
    // When paper moves through the cap footprint from a quarter turn to fully parked.
    for (const x of [-.15, .15]) for (let step = 1; step <= 100; step++) for (let i = 0; i <= 600; i++) {
      const point = lectureSheetPoint(x, .42 * 1357 / 1920 / 2 - .022 - i * (.42 * 1357 / 1920 - .022) / 600, step / 100);
      // Then no free paper enters the metal volume.
      if (Math.abs(point.y - (.42 * 1357 / 1920 / 2 - .010)) <= .00792) expect(point.z).toBeGreaterThan(top + .0001);
    }
  });

  test('retains a round fold and sheet length when the turned page settles', () => {
    // Given a paper cross-section at the binding.
    const samples = Array.from({ length: 1001 }, (_, i) => lectureSheetPoint(0, .42 * 1357 / 1920 / 2 - .022 - i * (.42 * 1357 / 1920 - .022) / 1000, 1));
    // When its actual deformed length and curved hinge are measured.
    const length = samples.slice(1).reduce((sum, p, i) => sum + Math.hypot(p.x - samples[i].x, p.y - samples[i].y, p.z - samples[i].z), 0);
    const fold = samples.filter(p => p.z > .001 && p.z < .012);
    // Then the sheet preserves length and visibly retains its curved hinge.
    expect(length).toBeCloseTo(.42 * 1357 / 1920 - .022, 4);
    expect(fold.length).toBeGreaterThan(25);
    expect(samples.at(-1).z).toBeGreaterThan(.012);
  });

  test('mounts the backing paper outside the cabinet seam envelope', () => {
    // Given the actual seam front at -0.25765.
    // When the paper mounting plane is chosen.
    // Then the first sheet has a physical clearance instead of a depth-test override.
    expect(WHISKY_LECTURE.cabinetFront).toBeLessThan(-.258);
  });
});

test('fits the complete current page and a useful curved return strip at narrow and wide viewports', async () => {
  // Given the actual cabinet paper roll and responsive camera.
  const { Group, PerspectiveCamera, Vector3 } = await import('three');
  const { whiskyLecturePose } = await import('../src/components/studio/scene/WhiskyLectureLayout');
  const { focusFov } = await import('../src/components/studio/scene/config');
  for (const [width, height] of [[375, 667], [390, 844], [768, 1024], [1280, 900], [1280, 720], [844, 390]]) {
    const card = new Group(); card.rotation.set(0, Math.PI, -Math.PI / 45);
    const pose = whiskyLecturePose(card, { width, height });
    const camera = new PerspectiveCamera(focusFov(null, width < 760, width, height), width / height, .015, 60);
    camera.position.set(...pose.position); camera.lookAt(...pose.target); camera.updateMatrixWorld(true);
    // When the complete incoming page is projected below the turning leaf.
    for (const x of [-.21, .21]) for (let row = 0; row <= 96; row++) {
      const point = lectureSheetPoint(x, (.5 - row / 96) * WHISKY_LECTURE.height, 0);
      const projected = card.localToWorld(new Vector3(point.x, point.y, point.z)).project(camera);
      // Then actual printed content fits; the blank upper flap may extend beyond the view.
      expect(Math.abs(projected.x), `${width}x${height} row ${row}`).toBeLessThan(1);
      expect(Math.abs(projected.y), `${width}x${height} row ${row}`).toBeLessThan(1);
    }
    for (const x of [-.06, .06]) {
      const point = lectureSheetPoint(x, WHISKY_LECTURE.foldY - .06, 1);
      const projected = card.localToWorld(new Vector3(point.x, point.y, point.z)).project(camera);
      expect(Math.abs(projected.x)).toBeLessThan(.85);
      expect(Math.abs(projected.y)).toBeLessThan(.85);
    }
  }
});
