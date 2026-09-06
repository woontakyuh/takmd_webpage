import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
const island = html.match(/<astro-island\b[^>]*component-export="StudioExperience"[^>]*>/)?.[0];
assert.ok(island, 'The built homepage must hydrate the office collection.');
const encoded = island.match(/ props="([^"]+)"/)?.[1];
assert.ok(encoded, 'The office collection must receive content.');
const decoded = encoded.replaceAll('&quot;', '"').replaceAll('&#39;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&');
const props = JSON.parse(decoded);
for (const name of ['publications', 'presentations']) {
  const records = props[name][1].map(([, record]) => record);
  const ids = records.map(record => record.id[1]);
  const original = JSON.parse(readFileSync(new URL(`../src/data/${name}.json`, import.meta.url), 'utf8'))[name];
  assert.equal(records.length, original.length, `${name}: the office must retain every source record.`);
  assert.equal(new Set(ids).size, records.length, `${name}: every record needs a unique selection identity; duplicate IDs cause Next and detail selection to reopen the wrong record.`);
  assert.ok(ids.every(id => typeof id === 'string' && id.length > 0));
  console.log(`${name}: ${records.length} unique, selectable records retained.`);
}
