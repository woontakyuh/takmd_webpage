import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { generateSouthBank, parseSouthSource } from './prepare-banpo-south-bank';
import { insideRing } from '../src/components/studio/scene/BanpoCanopyPlacement';
import geography from '../public/models/han-river/geography.json';

test('includes every labeled block from the two official plans on the mapped parcels', async () => {
  const source = parseSouthSource(gunzipSync(readFileSync(new URL('./fixtures/banpo-south-osm-2026-09-13.json.gz', import.meta.url))).toString());
  const data = await generateSouthBank(source);
  for (const [name, count, ids] of [['메이플자이', 29, [998065952, 998065953]], ['래미안 트리니원', 17, [403019805]]] as const) {
    const blocks = data.buildings.filter(b => b.complex === name);
    assert.equal(blocks.length, count, name);
    const parcels = source.elements.filter(e => ids.some(id => id === e.id)).map(e => e.geometry ?? []);
    for (const block of blocks) {
      const x = block.p.reduce((s, p) => s + p[0], 0) / block.p.length;
      const y = block.p.reduce((s, p) => s + p[1], 0) / block.p.length;
      const lon = geography.origin[1] + x / (111320 * Math.cos(geography.origin[0] * Math.PI / 180));
      const lat = geography.origin[0] + y / 111320;
      assert.ok(parcels.some(p => insideRing([lon, lat], p.map(p => [p.lon, p.lat]))), `${name} ${block.name} outside parcel: ${lon},${lat}`);
    }
  }
});
