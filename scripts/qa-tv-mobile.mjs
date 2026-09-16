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
  await page.screenshot({ path: `${evidence}/${engine}-tv.png` });
  await ctx.close(); await browser.close();
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`PASS qa-tv-mobile (${enginesArg}) against ${base}`);
