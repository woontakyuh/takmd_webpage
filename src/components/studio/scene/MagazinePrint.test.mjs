import { describe, expect, test } from 'bun:test';
import { EDBM_MAGAZINE } from '../edbmArchive';
import { magazinePrintUv } from './MagazinePrint';

describe('continuous whole-page magazine projection', () => {
  test('retains every edge of the supplied contributor photograph', () => {
    // Given a photograph whose outer column was already cropped by the camera.
    const surface = EDBM_MAGAZINE.spreads[0].right;
    // When the complete image boundary is projected onto the printed page.
    const edges = Array.from({ length: 101 }, (_, i) => i / 100).flatMap(value => [
      [magazinePrintUv(surface, 0, value), 0, 0], [magazinePrintUv(surface, 1, value), 0, 1],
      [magazinePrintUv(surface, value, 0), 1, 0], [magazinePrintUv(surface, value, 1), 1, 1],
    ]);
    // Then its complete perimeter survives; no outer column is masked or trimmed.
    for (const [point, axis, value] of edges) expect(point[axis]).toBeCloseTo(value, 8);
  });

  test('straightens the original group portrait without relocating it', () => {
    // Given the four measured corners of the large photograph in IMG_5246.JPG.
    const surface = EDBM_MAGAZINE.spreads[0].right;
    const guides = [[.17, .075, .173, .067], [.77, .075, .769, .083],
      [.17, .375, .169, .359], [.77, .375, .757, .376]];
    // When each rectified print corner is mapped to the original image.
    const points = guides.map(([u, v]) => magazinePrintUv(surface, u, v));
    // Then it lands on the source corner, retaining the original page position.
    points.forEach((point, i) => point.forEach((value, axis) => expect(value).toBeCloseTo(guides[i][axis + 2], 6)));
  });

  test('shares the original gutter continuously across both article pages', () => {
    // Given both halves of one photographed spread, including the running header.
    const spread = EDBM_MAGAZINE.spreads[1];
    // When corresponding points are sampled along the complete binding edge.
    const seam = Array.from({ length: 101 }, (_, i) => i / 100).map(v => [
      magazinePrintUv(spread.left, 1, v), magazinePrintUv(spread.right, 0, v),
    ]);
    // Then no source strip disappears or repeats between the two physical sheets.
    for (const [left, right] of seam) left.forEach((value, axis) => expect(value).toBeCloseTo(right[axis], 8));
  });

  for (const surface of [EDBM_MAGAZINE.cover, EDBM_MAGAZINE.spreads[0].right,
    EDBM_MAGAZINE.spreads[1].left, EDBM_MAGAZINE.spreads[1].right]) {
    test(`${surface.restoration} maps the whole print continuously without folding`, () => {
      // Given one continuous coordinate lattice for this complete page.
      const signs = [];
      // When small neighboring squares are mapped throughout the page.
      for (let row = 0; row < 30; row++) for (let column = 0; column < 30; column++) {
        const u = column / 30, v = row / 30;
        const point = magazinePrintUv(surface, u, v);
        const right = magazinePrintUv(surface, u + .00001, v);
        const down = magazinePrintUv(surface, u, v + .00001);
        const area = (right[0] - point[0]) * (down[1] - point[1]) - (right[1] - point[1]) * (down[0] - point[0]);
        // Then every region remains inside the photograph and has one orientation.
        point.forEach(value => { expect(value).toBeGreaterThanOrEqual(-1e-8); expect(value).toBeLessThanOrEqual(1 + 1e-8); });
        expect(Math.abs(area)).toBeGreaterThan(1e-13);
        signs.push(Math.sign(area));
      }
      expect(new Set(signs).size).toBe(1);
    });
  }
});
