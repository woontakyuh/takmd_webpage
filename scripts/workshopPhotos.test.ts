import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import manifest from '../src/data/workshop-photos.json';
import { getSession } from '../src/data/workshop-sessions';

type Entry = { sessionId: string; role: string; order: number; src: string; thumb: string; width: number; height: number };
const roles = ['group', 'lecture', 'practice', 'venue'];
const entries = manifest as Entry[];
const root = resolve(import.meta.dir, '..');

const seen = new Set<string>();
entries.forEach((e, i) => {
  assert.ok(getSession(e.sessionId), `manifest[${i}] session ${e.sessionId} exists`);
  assert.ok(roles.includes(e.role), `manifest[${i}] role ${e.role}`);
  assert.ok(Number.isInteger(e.order) && e.order >= 1, `manifest[${i}] order`);
  const key = `${e.sessionId}/${e.role}/${e.order}`;
  assert.ok(!seen.has(key), `duplicate order ${key}`);
  seen.add(key);
  assert.ok(e.src.startsWith(`/images/workshops/${e.sessionId}/`) && e.src.endsWith('.webp'), `manifest[${i}] src path`);
  assert.equal(e.thumb, e.src.replace(/\.webp$/, '-thumb.webp'), `manifest[${i}] thumb naming`);
  assert.ok(existsSync(resolve(root, 'public' + e.src)), `file exists ${e.src}`);
  assert.ok(existsSync(resolve(root, 'public' + e.thumb)), `thumb exists ${e.thumb}`);
  assert.ok(Math.max(e.width, e.height) <= 1600 && e.width > 0 && e.height > 0, `manifest[${i}] dimensions`);
  if (i > 0) {
    const p = entries[i - 1];
    const cmp = p.sessionId.localeCompare(e.sessionId) || roles.indexOf(p.role) - roles.indexOf(e.role) || p.order - e.order;
    assert.ok(cmp < 0, `manifest sorted at [${i}]`);
  }
});
console.log(`workshopPhotos: ${entries.length} manifest entries valid`);
