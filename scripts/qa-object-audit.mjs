// Every clickable object in the room, pressed once from the overview and from each guided view, then closed with
// Escape. Reports what each press did and flags: a press that did nothing, a view that did not come back clean after
// closing (hidden trigger shown or focused, reading state left behind, title or tabs changed, address not restored),
// any page error, and any document navigation. Usage: node scripts/qa-object-audit.mjs <url> [chromium|webkit] [desktop|phone]
import { chromium, webkit, devices } from '../node_modules/playwright-core/index.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';

const [,, base = 'https://takmd.com/', engineName = 'chromium', form = 'desktop'] = process.argv;
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? `.omo/evidence/object-audit/${engineName}-${form}`;
mkdirSync(evidence, { recursive: true });
const harness = () => { window.__qaRoots = new Set(); let id = 0; window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject: () => ++id, onCommitFiberRoot: (_, r) => window.__qaRoots.add(r), onCommitFiberUnmount: () => {}, checkDCE: () => {} }; window.__qaScene = () => { let out; const seen = new Set(); const visit = f => { if (!f || seen.has(f) || out) return; seen.add(f); const v = f.memoizedProps?.value; if (typeof v?.getState === 'function') { const s = v.getState(); if (s?.gl && s?.scene && s?.camera) { out = s; return; } } visit(f.child); visit(f.sibling); }; for (const r of window.__qaRoots) visit(r.current); return out; }; };

const browser = engineName === 'webkit'
  ? await webkit.launch({ executablePath: process.env.WK, headless: true })
  : await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] });
const context = await browser.newContext(form === 'phone' ? { ...devices['iPhone 14'], viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Seoul' } : { viewport: { width: 1440, height: 900 }, timezoneId: 'Asia/Seoul' });
const page = await context.newPage();
await page.addInitScript(harness);
const errors = []; const navigations = [];
page.on('pageerror', e => errors.push(String(e.message).slice(0, 160)));
page.on('load', () => navigations.push(page.url()));
const popups = []; context.on('page', p => { popups.push(p.url() || 'about:blank'); p.close().catch(() => {}); });

const load = async () => {
  await page.goto(base + '?hour=14', { waitUntil: 'load' });
  await page.locator('.studio[data-entry="complete"]').waitFor({ timeout: 150000 });
  await page.waitForTimeout(4000);
};
const press = async (x, y) => { if (form === 'phone') await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
const snapshot = () => page.evaluate(() => {
  const studio = document.querySelector('.studio'); const c = window.__qaScene().camera;
  const tabs = document.querySelector('.office-guided'); const ts = tabs ? getComputedStyle(tabs) : null;
  const shown = [...document.querySelectorAll('.office-secret-trigger')].filter(e => e.getBoundingClientRect().height > 2).map(e => e.textContent.trim());
  const a = document.activeElement;
  return { d: { ...studio.dataset }, title: document.querySelector('.office-title h1')?.textContent ?? null,
    tabs: ts ? ts.visibility === 'visible' && ts.pointerEvents !== 'none' : null,
    url: location.search.replace(/[?&]hour=14/, '').replace(/^&/, '?'),
    cam: c.position.toArray().map(n => +n.toFixed(2)), fov: +c.fov.toFixed(1),
    hidden: shown, activeHidden: a?.classList?.contains('office-secret-trigger') ? a.textContent.trim() : null,
    dialogs: document.querySelectorAll('dialog[open]').length,
    panel: [...document.querySelectorAll('[class^="office-device-"]')].some(e => !e.className.includes('office-device-shortcuts')),
    signature: (() => { const s = window.__qaScene(); let sig = 0; s.scene.traverse(o => { if (o.isLight) sig += o.intensity * (o.visible ? 1 : 0); if (/blind/i.test(o.name || '')) sig += o.position.y * 1000 + o.scale.y * 100; }); return +sig.toFixed(2); })(), reader: !!document.querySelector('.office-reading, .tv-screen-reader[data-active="true"], .monitor-screen-reader[data-active="true"], .office-frame-info[open], .book-reader, .surfboard-story') };
});
const same = (a, b) => Math.hypot(...a.map((v, i) => v - b[i])) < 0.05;

// Every object with a click handler, named by itself or by its nearest named ancestor. Nested handlers are folded
// into the outermost one so each press targets a distinct object.
const listObjects = () => page.evaluate(() => {
  const s = window.__qaScene(); const out = [];
  s.scene.traverse(o => {
    const h = o.__r3f?.handlers; if (!h || !h.onClick) return;
    for (let n = o.parent; n; n = n.parent) if (n.__r3f?.handlers?.onClick) return;
    let name = o.name; for (let n = o; !name && n; n = n.parent) name = n.name;
    out.push({ uuid: o.uuid, name: name || 'unnamed', type: o.type });
  });
  return out;
});
// Where to press: sample points across the object's box, keep the first whose first hit belongs to the object.
const aim = uuid => page.evaluate(uuid => {
  const s = window.__qaScene(); const THREE_Box3 = s.scene.constructor.prototype.constructor; void THREE_Box3;
  const target = s.scene.getObjectByProperty('uuid', uuid); if (!target) return { error: 'gone' };
  let visible = true; for (let n = target; n; n = n.parent) if (!n.visible) visible = false;
  if (!visible) return { error: 'hidden' };
  const meshes = []; target.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
  if (!meshes.length) return { error: 'no meshes' };
  // world-space bounds from the meshes
  const pts = [];
  for (const m of meshes) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; m.updateWorldMatrix(true, false);
    for (const x of [b.min.x, (b.min.x + b.max.x) / 2, b.max.x]) for (const y of [b.min.y, (b.min.y + b.max.y) / 2, b.max.y]) for (const z of [b.min.z, (b.min.z + b.max.z) / 2, b.max.z]) { const v = m.localToWorld(new m.position.constructor(x, y, z)); pts.push(v); } }
  const centre = pts.reduce((a, v) => a.add(v), new meshes[0].position.constructor()).multiplyScalar(1 / pts.length);
  const candidates = [centre, ...pts.filter((_, i) => i % 3 === 0)];
  const overlay = (x, y) => { const el = document.elementFromPoint(x, y); return el && el.tagName !== 'CANVAS' ? (el.getAttribute('aria-label') || el.textContent?.trim().slice(0, 30) || el.className || el.tagName) : null; };
  let covered = null;
  const ray = s.raycaster; const belongs = o => { for (let n = o; n; n = n.parent) if (n === target) return true; return false; };
  let offscreen = 0, occludedBy = null;
  for (const v of candidates) {
    const p = v.clone().project(s.camera);
    if (p.z > 1 || Math.abs(p.x) > 0.98 || Math.abs(p.y) > 0.98) { offscreen++; continue; }
    ray.setFromCamera({ x: p.x, y: p.y }, s.camera);
    const hits = ray.intersectObjects(s.scene.children, true).filter(h => { let vis = true; for (let n = h.object; n; n = n.parent) if (!n.visible) vis = false; return vis; });
    if (!hits.length) continue;
    if (belongs(hits[0].object)) { const x = (p.x + 1) * innerWidth / 2, y = (1 - p.y) * innerHeight / 2; const over = overlay(x, y); if (over) { covered = covered ?? over; continue; } return { x, y }; }
    occludedBy = occludedBy ?? (hits[0].object.name || hits[0].object.parent?.name || hits[0].object.type);
  }
  return { error: offscreen === candidates.length ? 'off-screen' : covered ? `covered by UI "${covered}"` : `occluded by ${occludedBy ?? 'something'}` };
}, uuid);

const contexts = [['overview', null], ['Research', 'Research'], ['Talks & Recognition', 'Talks & Recognition'], ['UBE & Teaching', 'UBE & Teaching'], ['Liquor & Music', 'Liquor & Music'], ['Work & Life Balance', 'Work & Life Balance']];
const enter = async tab => {
  if (!tab) { const ok = await page.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /^Overview$/.test(x.textContent.trim()) || x.getAttribute('aria-label') === 'Overview'); if (b) { b.click(); return true; } return false; }); if (!ok) await page.keyboard.press('Escape'); }
  else await page.evaluate(n => { const b = [...document.querySelectorAll('.office-guided button')].find(x => x.textContent.trim() === n); if (!b) throw new Error('tab missing ' + n); b.click(); }, tab);
  await page.waitForTimeout(3500);
};
const settle = async (baseline, tab) => {
  for (let i = 0; i < 3; i++) {
    const s = await snapshot();
    if (s.title === baseline.title && s.tabs === baseline.tabs && s.url === baseline.url && same(s.cam, baseline.cam) && !s.hidden.length && !s.activeHidden && !s.d.reading && !s.dialogs) return { clean: true, s };
    if (i === 0) { await page.keyboard.press('Escape'); await page.waitForTimeout(2000); }
    else await enter(tab);
  }
  return { clean: false, s: await snapshot() };
};

const rows = []; const issues = [];
let objects = [];
for (const [label, tab] of contexts) {
  await load(); await enter(tab);
  // Objects are listed after every load: their ids change with the page, their names do not.
  objects = await listObjects();
  if (label === 'overview') console.log(`${engineName}/${form}: ${objects.length} clickable objects`);
  const baseline = await snapshot();
  for (const o of objects) {
    const where = await aim(o.uuid);
    if (where.error) { rows.push({ context: label, object: o.name, result: `unreachable: ${where.error}` }); continue; }
    const errBefore = errors.length, navBefore = navigations.length, popBefore = popups.length;
    await press(where.x, where.y); await page.waitForTimeout(3500);
    const a = await snapshot();
    let outcome;
    const popped = popups.length > popBefore;
    const toggled = a.signature !== baseline.signature || a.panel;
    const changed = !same(a.cam, baseline.cam) || a.url !== baseline.url || (a.d.reading && a.d.reading !== baseline.d.reading) || (a.d.approached && a.d.approached !== baseline.d.approached) || a.reader || a.dialogs || popped || toggled;
    if (!changed) outcome = 'nothing happened';
    else if (popped) outcome = `opens a new tab (${popups[popups.length - 1].replace(/^https?:\/\//, '').slice(0, 40)})`;
    else if (a.d.reading && a.d.reading !== baseline.d.reading || a.reader || a.dialogs || /detail=/.test(a.url)) outcome = `opens (${a.d.reading ?? (a.dialogs ? 'dialog' : decodeURIComponent(/detail=([^&]+)/.exec(a.url)?.[1] ?? 'reader'))})`;
    else if (a.d.approached && a.d.approached !== baseline.d.approached) outcome = `approach only (${a.d.approached})`;
    else if (toggled) outcome = a.panel ? 'opens a panel' : 'toggles the room';
    else outcome = 'camera moved';
    // close and check the room is clean again
    await page.keyboard.press('Escape'); await page.waitForTimeout(2000);
    const back = await settle(baseline, tab);
    const problems = [];
    if (outcome === 'nothing happened') problems.push('press did nothing');
    if (errors.length > errBefore) problems.push(`page error: ${errors.slice(errBefore).join(' | ')}`);
    if (navigations.length > navBefore) problems.push(`document reloaded: ${navigations.slice(navBefore).join(' ')}`);
    const c = back.s;
    if (c.hidden.length || c.activeHidden) problems.push(`hidden trigger after close: ${c.hidden.join(', ') || c.activeHidden}`);
    if (!back.clean) problems.push(`did not return to "${label}" after close (title "${c.title}", tabs ${c.tabs}, url "${c.url}", reading ${c.d.reading ?? '-'})`);
    const row = { context: label, object: o.name, result: outcome, after: back.clean ? 'clean' : 'dirty', problems };
    rows.push(row);
    if (problems.length) { issues.push(row); await page.screenshot({ path: `${evidence}/${label.replace(/[^a-z]/gi, '')}-${o.name.replace(/[^a-z0-9]/gi, '_').slice(0, 40)}.png` }); if (!back.clean) { await load(); await enter(tab); const fresh = await listObjects(); for (const f of fresh) { const same = objects.find(x => x.name === f.name); if (same) same.uuid = f.uuid; } } }
  }
}
writeFileSync(`${evidence}/audit.json`, JSON.stringify({ base, engine: engineName, form, objects: objects.map(o => o.name), rows, issues, errors, navigations }, null, 1));
const md = ['| context | object | one press | after Esc | problems |', '|---|---|---|---|---|', ...rows.map(r => `| ${r.context} | ${r.object} | ${r.result} | ${r.after ?? ''} | ${(r.problems ?? []).join('; ')} |`)].join('\n');
writeFileSync(`${evidence}/audit.md`, md + '\n');
console.log(md);
console.log(`\n${issues.length} problem rows of ${rows.length}; page errors ${errors.length}; popups ${popups.length}`);
await browser.close();
process.exit(issues.length ? 1 : 0);
