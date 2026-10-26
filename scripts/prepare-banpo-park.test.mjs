import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { clipParkLine, parseParkSource, preparePark } from './prepare-banpo-park';

describe('mapped park source', () => {
  const source = parseParkSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-park-osm-2026-09-12.json.gz', import.meta.url))).toString());
  test('retains a closed cycle loop as a route, not a paved polygon', () => {
    const park = source.elements.find(e => e.id === 418249072);
    expect(park).toBeDefined();
    if (!park) return;
    const geometry = [{ lat: 37.5102, lon: 126.9960 }, { lat: 37.51025, lon: 126.9961 },
      { lat: 37.5103, lon: 126.9960 }, { lat: 37.5102, lon: 126.9960 }];
    const result = preparePark({ ...source, elements: [park, { type: 'way', id: 1, tags: { highway: 'cycleway' }, geometry }] });
    const loop = result.features.filter(f => f.id.startsWith('way/1'));
    expect(loop.length).toBeGreaterThan(0);
    expect(loop.every(f => f.area === false)).toBe(true);
  });
  test('clips a crossing route into disconnected pieces without paving the water between them', () => {
    const result = clipParkLine([[-1, 1], [7, 1]], [[[0, 0], [2, 0], [2, 2], [0, 2]], [[4, 0], [6, 0], [6, 2], [4, 2]]]);
    expect(result).toEqual([[[0, 1], [2, 1]], [[4, 1], [6, 1]]]);
  });
  test('retains the island, all three connecting bridges, both courts and both stage locations', () => {
    const result = preparePark(source);
    const ids = new Set(result.features.map(f => f.id));
    for (const id of [25979109, 320797964, 320797973, 320797974, 1497710478, 1497710479, 305692221, 1354859718]) {
      expect(ids.has(`way/${id}`)).toBe(true);
    }
    expect(result.stagePoint[0]).toBeGreaterThan(570);
    expect(result.stagePoint[0]).toBeLessThan(580);
    expect(result.stagePoint[1]).toBeGreaterThan(275);
    expect(result.stagePoint[1]).toBeLessThan(285);
  });
});
