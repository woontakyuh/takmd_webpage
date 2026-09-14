import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { test } from 'node:test';
import geography from '../public/models/han-river/geography.json';
import prepared from '../public/models/han-river/local-streets.json';
import { clipStreetSegment, generateLocalStreets, parseStreetSource, STREET_EXTENT } from './prepare-banpo-streets';
import { createBanpoLocalStreetGeometry, LOCAL_STREET_SURFACE_OFFSET } from '../src/components/studio/scene/BanpoLocalStreets';
import { canopyElevation, insideRing } from '../src/components/studio/scene/BanpoCanopyPlacement';

const source = parseStreetSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-streets-osm-2026-09-12.json.gz', import.meta.url))).toString());
const streets = generateLocalStreets(source);

test('preserves the complete eligible mapped local network deterministically with width provenance', () => {
  assert.deepEqual(streets, prepared.features);
  assert.deepEqual(generateLocalStreets(source), streets);
  assert.ok(streets.length > 2500);
  const sourceWays = new Map(source.elements.map(element => [element.id, element]));
  assert.equal(new Set(streets.map(street => street.id)).size, streets.length);
  assert.ok(streets.some(street => street.widthProvenance === 'osm-width'));
  assert.ok(streets.some(street => street.widthProvenance === 'visual-class-estimate'));
  for (const street of streets) {
    const tags = sourceWays.get(street.wayId)?.tags;
    assert.ok(tags);
    assert.equal(street.highway, tags.highway);
    assert.ok(!tags.bridge || tags.bridge === 'no');
    assert.ok(!tags.tunnel || tags.tunnel === 'no');
    assert.ok(Number(tags.layer ?? 0) >= 0);
    assert.ok(street.widthM >= 1 && street.widthM <= 40);
    for (const point of street.p) {
      assert.ok(point[0] >= STREET_EXTENT.west && point[0] <= STREET_EXTENT.east);
      assert.ok(point[1] >= STREET_EXTENT.south && point[1] <= STREET_EXTENT.north);
    }
    for (let i = 0; i < street.p.length - 1; i++) {
      const a = street.p[i]; const b = street.p[i + 1];
      assert.equal(insideRing([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], geography.banks.flat()), false, street.id);
    }
  }
});

test('clips the source path at actual viewport and river boundaries without inland connectors', () => {
  assert.deepEqual(clipStreetSegment([-2600, 3000], [-2400, 3000]), [[[-2500, 3000], [-2400, 3000]]]);
  const pieces = clipStreetSegment([0, 650], [0, 2500]);
  assert.ok(pieces.length > 0);
  for (const [a, b] of pieces) {
    assert.equal(a[0], 0); assert.equal(b[0], 0);
    assert.equal(insideRing([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], geography.banks.flat()), false);
  }
});

test('uses one continuous terrain-conforming surface with upward winding under the geometry budget', () => {
  const geometry = createBanpoLocalStreetGeometry();
  const points = geometry.getAttribute('position'); const normals = geometry.getAttribute('normal');
  const index = geometry.index;
  assert.ok(index); assert.equal(index.count / 3, 3960); assert.ok(index.count / 3 < 12000);
  for (let i = 0; i < points.count; i++) {
    const x = points.getX(i); const y = -points.getZ(i);
    const height = canopyElevation([x, y]);
    if (height !== undefined) assert.ok(Math.abs(points.getY(i) - height - LOCAL_STREET_SURFACE_OFFSET) < .00002);
    assert.ok(normals.getY(i) > 0);
  }
  const uv = geometry.getAttribute('uv');
  assert.ok(uv.getY(0) < 0, 'the 100m source grid stays aligned even when its first row precedes the clipped mask');
  assert.equal(uv.getY(uv.count - 1), 1);
  geometry.dispose();
});
