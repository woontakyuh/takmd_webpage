// Release gate for the wall TV on a phone. Runs the Safari engine (WebKit) and Chromium at the iPhone 14 viewport.
//   WK=~/Library/Caches/ms-playwright/webkit-2336/pw_run.sh node scripts/qa-tv-mobile.mjs <url> [engines=webkit,chromium]
// Asserts: the first tap opens the TV; every visible control in the reader is a finger target (44px); the archive,
// thumbnails and About all respond to taps; and nothing inside the office links out to a legacy document page.
import { chromium, webkit, devices } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';

const [,, base = 'https://takmd.com/', enginesArg = 'webkit,chromium'] = process.argv;
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/qa-tv-mobile';
await mkdir(evidence, { recursive: true });
const MIN_TARGET = 40; // 44px design size, 4px slack for sub-pixel scaling of the board
const harness = () => {
  window.__qaRoots = new Set(); let id = 0;
  window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject: () => ++id, onCommitFiberRoot: (_, r) => window.__qaRoots.add(r), onCommitFiberUnmount: () => {}, checkDCE: () => {} };
  window.__qaScene = () => { let out; const seen = new Set(); const visit = f => { if (!f || seen.has(f) || out) return; seen.add(f); const v = f.memoizedProps?.value; if (typeof v?.getState === 'function') { const s = v.getState(); if (s?.gl && s?.scene && s?.camera) { out = s; return; } } visit(f.child); visit(f.sibling); }; for (const r of window.__qaRoots) visit(r.current); return out; };
};
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); return condition; };
for (const engine of enginesArg.split(',')) {
  const browser = engine === 'webkit' ? await webkit.launch({ headless: true, executablePath: process.env.WK || undefined }) : await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] });
  const ctx = await browser.newContext({ ...devices['iPhone 14'], viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  const errors = []; page.on('pageerror', e => errors.push(e.message));
  const docs = []; page.on('request', r => { if (r.isNavigationRequest() && r.frame() === page.mainFrame()) docs.push(r.url()); });
  await page.addInitScript(harness);
  await page.goto(base, { waitUntil: 'load' });
  await page.locator('.studio[data-entry="complete"]').waitFor({ timeout: 150000 });
  await page.waitForTimeout(2500);
  const tag = `${engine}: `;
  // Every link rendered inside the office must be handled by the office or leave to another site in a new tab.
  const links = await page.evaluate(() => [...document.querySelectorAll('.studio a[href]')].map(a => ({ href: a.getAttribute('href'), target: a.getAttribute('target') })));
  const officeRoutes = /^\/(cv|research|education|ube|ai|jiu-jitsu|surfing|contact|credits|ai-workflow|dashboard|media|knowledge|workshops)(\/|$|#|\?)|^\/$|^\/\?/;
  for (const link of links) check(officeRoutes.test(link.href) || (/^(https?:|mailto:)/.test(link.href) && (link.target === '_blank' || link.href.startsWith('mailto:'))), `${tag}link leaves the room without a new tab: ${link.href}`);
  // The page carries its build id and the server publishes the same id, so a stale home-screen copy can tell it must reload.
  const build = await page.evaluate(async () => { const r = await fetch('/build.json', { cache: 'no-store' }).catch(() => null); const server = r?.ok ? (await r.json()).id : null; return { page: document.documentElement.dataset.build ?? null, server }; });
  if (!/^https?:\/\/(127\.0\.0\.1|localhost)/.test(base)) check(build.page && build.server && build.page === build.server, `${tag}build id mismatch: page ${build.page}, server ${build.server}`);
  // Every guided view presents the same way: kicker, italic title, close control, and all five names.
  for (const name of ['Research', 'Talks & Recognition', 'UBE & Teaching', 'Whisky & Music', 'Jiu-jitsu & Surfing']) {
    await page.getByRole('button', { name, exact: true }).evaluate(el => el.click());
    await page.waitForTimeout(3000);
    const view = await page.evaluate(() => {
      const title = document.querySelector('.office-title h1');
      const box = title?.getBoundingClientRect();
      const overlaps = [...document.querySelectorAll('.office-overview-return, .office-approach-actions, .studio-tools > *, .office-help')]
        .filter(el => getComputedStyle(el).visibility !== 'hidden' && getComputedStyle(el).display !== 'none')
        .filter(el => { const r = el.getBoundingClientRect(); return box && r.width > 0 && r.left < box.right && r.right > box.left && r.top < box.bottom && r.bottom > box.top; })
        .map(el => el.className.toString().split(' ')[0] || el.tagName);
      const row = document.querySelector('.office-guided');
      const rowStyle = row ? getComputedStyle(row) : null;
      const tabStyle = row?.querySelector('button') ? getComputedStyle(row.querySelector('button')) : null;
      return { title: title?.textContent ?? null, visible: !!box && box.width > 0 && getComputedStyle(title).visibility === 'visible',
        tabsClickable: rowStyle?.visibility === 'visible' && rowStyle.pointerEvents !== 'none' && tabStyle?.pointerEvents !== 'none',
        overlaps, tabs: document.querySelectorAll('.office-guided button').length,
        close: document.querySelectorAll('.office-guided-close').length };
    });
    check(view.title?.startsWith(name.split(' ')[0]), `${tag}${name}: title reads "${view.title}"`);
    check(view.visible, `${tag}${name}: the title is not visible`);
    check(view.overlaps.length === 0, `${tag}${name}: controls sit over the title: ${view.overlaps.join(', ')}`);
    check(view.tabs === 5, `${tag}${name}: ${view.tabs} guided tabs visible, expected 5`);
    check(view.tabsClickable, `${tag}${name}: the guided tabs are visible but do not take taps`);
    check(view.close === 1, `${tag}${name}: no close control beside the title`);
  }
  await page.getByRole('button', { name: 'Talks & Recognition', exact: true }).evaluate(el => el.click());
  await page.waitForTimeout(3000);

  // First tap opens the TV.
  const tv = await page.evaluate(() => { const s = window.__qaScene(); const m = s.scene.getObjectByName('Wall TV screen'); const v = m.getWorldPosition(s.camera.position.clone()); v.project(s.camera); return { x: (v.x + 1) * innerWidth / 2, y: (1 - v.y) * innerHeight / 2 }; });
  await page.touchscreen.tap(tv.x, tv.y);
  const opened = await page.locator('.tv-screen-reader[data-active="true"]').waitFor({ timeout: 20000 }).then(() => true).catch(() => false);
  check(opened, `${tag}first tap did not open the TV reader`);
  await page.waitForTimeout(2000);
  const tap = async (selector) => {
    const target = page.locator(selector).first();
    await target.evaluate(el => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
    await page.waitForTimeout(300);
    const box = await target.boundingBox(); assert.ok(box, `${tag}missing ${selector}`);
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(900);
  };
  const targets = async () => page.evaluate(min => [...document.querySelectorAll('.tv-screen-reader button, .tv-screen-reader a')].filter(e => !e.disabled && getComputedStyle(e).pointerEvents !== 'none' && e.getBoundingClientRect().width > 0).map(e => { const r = e.getBoundingClientRect(); return { label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), w: Math.round(r.width), h: Math.round(r.height), ok: r.width >= min && r.height >= min }; }), MIN_TARGET);
  const audit = (label, list) => { for (const t of list) check(t.ok, `${tag}${label}: "${t.label}" is ${t.w}x${t.h}, under ${MIN_TARGET}px`); };
  audit('reader', await targets());
  // Archive from the title, choose a lecture.
  const before = await page.evaluate(() => document.querySelector('.tv-screen-title')?.textContent);
  await tap('button.tv-screen-title');
  check(await page.evaluate(() => document.querySelector('.tv-screen-reader')?.dataset.tree === 'true'), `${tag}title did not open the archive`);
  audit('archive', await targets());
  await tap('.tv-lecture-entry:not([aria-current])');
  await page.waitForTimeout(2000);
  check(await page.evaluate(() => document.querySelector('.tv-screen-title')?.textContent) !== before, `${tag}choosing an archive row did not change the lecture`);
  check(await page.evaluate(() => document.querySelector('.tv-screen-reader')?.dataset.tree !== 'true'), `${tag}archive stayed open after choosing`);
  // Thumbnails from the header, choose a page.
  if (await page.locator('.tv-screen-header button[aria-label="Toggle slide thumbnails"]').count()) {
    await tap('.tv-screen-header button[aria-label="Toggle slide thumbnails"]');
    audit('thumbnails', await targets());
    const status = await page.evaluate(() => document.querySelector('.tv-screen-context [role=status]')?.textContent);
    await tap('.tv-screen-thumbnails button:nth-child(2)');
    check(await page.evaluate(() => document.querySelector('.tv-screen-context [role=status]')?.textContent) !== status, `${tag}thumbnail did not change the page`);
  }
  await tap('.tv-screen-header button[aria-label="Show lecture information"]');
  check(await page.locator('.tv-screen-details').count() === 1, `${tag}About did not open`);
  // Nothing above navigated the document or reached the legacy education page.
  check(docs.length === 1, `${tag}document navigated: ${docs.join(' ')}`);
  check(!(await page.evaluate(() => document.body.innerText.includes('Surgeons trained'))), `${tag}legacy education content is on screen`);
  check(errors.length === 0, `${tag}page errors: ${errors.join(' | ')}`);
  // A stored address from before the education page was retired — a history entry, a bookmark — must land on the TV.
  await page.goto(`${new URL('?exhibit=education&detail=%2Feducation%23overview', base).href}`, { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  const stored = await page.evaluate(() => ({ legacy: document.body.innerText.includes('Surgeons trained') || document.body.innerText.includes('Education and training.'), selected: document.querySelector('.studio')?.dataset.selected ?? null }));
  check(!stored.legacy, `${tag}a stored education address still shows the retired page`);
  check(stored.selected === 'education', `${tag}a stored education address selected "${stored.selected}" instead of the television`);
  // Closing a view must not hand focus to a hidden accessibility trigger: :focus-visible would show it at the top of
  // the room ("Research: Papers & ideas") and keep it there. Checked after the television and after the folio.
  // A guided tab may be hidden while something is open or inspected; leave that state first, then press the tab.
  const openTab = async (name) => {
    for (let i = 0; i < 3; i++) {
      const visible = await page.evaluate(() => { const row = document.querySelector('.office-guided'); return !!row && getComputedStyle(row).visibility === 'visible'; });
      if (visible) break;
      await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
    }
    await page.evaluate(n => { const b = [...document.querySelectorAll('.office-guided button')].find(x => x.textContent.trim() === n); if (!b) throw new Error('tab missing: ' + n); b.click(); }, name);
    await page.waitForTimeout(3500);
  };
  const zombie = async (label) => {
    await page.keyboard.press('Escape'); await page.waitForTimeout(1500);
    const shown = await page.evaluate(() => [...document.querySelectorAll('.office-secret-trigger')].filter(e => e.getBoundingClientRect().height > 2).map(e => e.textContent.trim()));
    const active = await page.evaluate(() => document.activeElement?.classList.contains('office-secret-trigger') ? document.activeElement.textContent.trim() : null);
    check(shown.length === 0 && !active, `${tag}${label}: closing revealed a hidden trigger (${shown.join(', ') || active})`);
  };
  await zombie('television');
  await openTab('Research');
  // Where a finger can land on the named object: sample points across its meshes and keep the first whose first
  // hit belongs to the object and is not covered by a control. An object's origin alone may sit on something else.
  const locate = (pattern) => page.evaluate(pattern => {
    const s = window.__qaScene(); let target = null; s.scene.traverse(o => { if (!target && new RegExp(pattern).test(o.name || '')) target = o; });
    if (!target) return null;
    const meshes = []; target.traverse(o => { if (o.isMesh && o.visible) meshes.push(o); });
    const V = s.camera.position.constructor; const pts = [];
    for (const m of meshes) { m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; m.updateWorldMatrix(true, false); for (const x of [b.min.x, (b.min.x + b.max.x) / 2, b.max.x]) for (const y of [b.min.y, (b.min.y + b.max.y) / 2, b.max.y]) for (const z of [b.min.z, (b.min.z + b.max.z) / 2, b.max.z]) pts.push(m.localToWorld(new V(x, y, z))); }
    if (!pts.length) return null;
    const centre = pts.reduce((a, v) => a.add(v), new V()).multiplyScalar(1 / pts.length);
    const belongs = o => { for (let n = o; n; n = n.parent) if (n === target) return true; return false; };
    for (const v of [centre, ...pts]) {
      const q = v.clone().project(s.camera); if (q.z > 1 || Math.abs(q.x) > 0.95 || Math.abs(q.y) > 0.95) continue;
      s.raycaster.setFromCamera({ x: q.x, y: q.y }, s.camera);
      const hit = s.raycaster.intersectObjects(s.scene.children, true).find(h => { let vis = true; for (let n = h.object; n; n = n.parent) if (!n.visible) vis = false; return vis; });
      if (!hit || !belongs(hit.object)) continue;
      const x = (q.x + 1) * innerWidth / 2, y = (1 - q.y) * innerHeight / 2;
      if (document.elementFromPoint(x, y)?.tagName !== 'CANVAS') continue;
      return { x, y };
    }
    return null;
  }, pattern);
  const folio = await locate('^Folio front cover$');
  check(!!folio, `${tag}the research folio is not in the scene`);
  if (folio) { await page.touchscreen.tap(folio.x, folio.y); await page.waitForTimeout(3500); }
  check(await page.evaluate(() => document.querySelector('.studio')?.dataset.reading === 'research'), `${tag}touching the folio in the Research view did not open it`);
  await zombie('folio');
  // In the UBE & Teaching view the visitor already stands at the workshop objects: one touch on the endoscope opens it.
  await openTab('UBE & Teaching');
  const scope = await locate('^Workshop /ube$');
  check(!!scope, `${tag}the endoscope tray is not in the scene`);
  if (scope) { await page.touchscreen.tap(scope.x, scope.y); await page.waitForTimeout(3500); }
  check(await page.evaluate(() => document.querySelector('.studio')?.dataset.reading === 'spine'), `${tag}one touch on the endoscope in the UBE view did not open it (${await page.evaluate(() => JSON.stringify({ ...document.querySelector('.studio')?.dataset }))})`);
  await zombie('endoscope');
  // The spine model in the same view opens with one touch as well.
  await openTab('UBE & Teaching');
  const spine = await locate('^Exhibit spine$');
  check(!!spine, `${tag}the spine model is not in the scene`);
  if (spine) { await page.touchscreen.tap(spine.x, spine.y); await page.waitForTimeout(3500); }
  check(await page.evaluate(() => document.querySelector('.studio')?.dataset.reading === 'spine'), `${tag}one touch on the spine model in the UBE view did not open it`);
  await zombie('spine');
  // Whisky & Music: one touch on the cabinet body opens the door; one touch on the lecture card opens the lecture.
  await openTab('Whisky & Music');
  const body = await locate('^fixed leather trunk half$');
  check(!!body, `${tag}the cabinet body is not in the scene`);
  if (body) { await page.touchscreen.tap(body.x, body.y); await page.waitForTimeout(4500); }
  check(await page.evaluate(() => { const leaf = window.__qaScene().scene.getObjectByName('Isidoro book-opening mobile half'); return !!leaf && Math.abs(Math.abs(leaf.rotation.y) - Math.PI / 2) < 0.02; }), `${tag}one touch on the cabinet in the Whisky view did not open the door`);
  await zombie('cabinet');
  await openTab('Whisky & Music');
  const card = await locate('^Printed whisky lecture cover$');
  check(!!card, `${tag}the whisky lecture card is not in the scene`);
  if (card) { await page.touchscreen.tap(card.x, card.y); await page.waitForTimeout(4500); }
  check(await page.locator('.whisky-lecture-close').count() === 1, `${tag}one touch on the lecture card in the Whisky view did not open the lecture`);
  await zombie('lecture card');
  // Jiu-jitsu & Surfing: the gi opens on one touch like the surfboard beside it.
  await openTab('Jiu-jitsu & Surfing');
  const gi = await locate('^Exhibit bjj$');
  check(!!gi, `${tag}the gi is not in the scene`);
  if (gi) { await page.touchscreen.tap(gi.x, gi.y); await page.waitForTimeout(3500); }
  check(await page.evaluate(() => document.querySelector('.studio')?.dataset.reading === 'bjj'), `${tag}one touch on the gi in the Jiu-jitsu view did not open it`);
  await zombie('gi');
  await page.screenshot({ path: `${evidence}/${engine}-tv.png` });
  await ctx.close(); await browser.close();
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`PASS qa-tv-mobile (${enginesArg}) against ${base}`);
