import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
const base = process.env.OFFICE_TEST_URL ?? process.env.RELEASE_BASE_URL ?? 'http://127.0.0.1:4322/';
const dir = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/release-readiness/content';
await mkdir(dir, { recursive: true });
const talk = '3c5908af25b981e5b940f4e8ce3d83d1';
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] });
const results = [], errors = [];
try {
  for (const viewport of [{ width: 375, height: 812 }, { width: 768, height: 1024 }, { width: 1280, height: 900 }]) {
    const page = await browser.newPage({ viewport, reducedMotion: 'reduce' });
    await page.clock.setFixedTime(new Date('2026-09-22T03:00:00Z'));
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      window.__qaRoots = new Set(); let id = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers: new Map(), inject: () => ++id, onCommitFiberRoot: (_, r) => window.__qaRoots.add(r), onCommitFiberUnmount: () => {}, checkDCE: () => {} };
      window.__qaScene = () => { let out; const seen = new Set(); const visit = f => { if (!f || seen.has(f) || out) return; seen.add(f); const v = f.memoizedProps?.value; if (typeof v?.getState === 'function') { const s = v.getState(); if (s?.gl && s?.scene && s?.camera) { out = s; return; } } visit(f.child); visit(f.sibling); }; for (const r of window.__qaRoots) visit(r.current); return out; };
    });
    await page.goto(`${base}?exhibit=education&talk=${talk}`, { waitUntil: 'domcontentloaded' });
    await page.locator('.tv-screen-reader[data-active="true"] .tv-screen-record').waitFor({ timeout: 120000 });
    await page.waitForFunction(() => document.fonts.status === 'loaded');
    await page.screenshot({ path: `${dir}/event-${viewport.width}.png` });
    const record = await page.locator('.tv-screen-record').evaluate(el => {
      const bounds = selector => { const b = el.querySelector(selector).getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, width: b.width, height: b.height }; };
      return { status: el.dataset.status, text: el.innerText, title: bounds('h2'), date: bounds('.tv-screen-record-date'), venue: bounds('.tv-screen-record-venue'), materials: bounds('.tv-screen-record-materials'), outer: el.getBoundingClientRect().toJSON() };
    });
    assert.equal(record.status, 'upcoming');
    assert(record.title.bottom <= record.date.top);
    assert(record.venue.bottom <= record.materials.top);
    assert(record.materials.bottom <= record.outer.bottom + 1);
    const texture = await page.evaluate(() => window.__qaScene()?.scene.getObjectByName('Wall TV screen')?.material?.map?.image?.toDataURL('image/png'));
    if (texture) await writeFile(`${dir}/event-texture-${viewport.width}.png`, Buffer.from(texture.split(',')[1], 'base64'));
    await page.getByRole('button', { name: 'Show lecture information' }).click();
    await page.locator('.tv-screen-details').waitFor({ state: 'visible' });
    await page.getByRole('button', { name: 'Close and return to office' }).click();
    await page.locator('.tv-screen-reader[data-active="true"]').waitFor({ state: 'hidden' });
    const contact = page.locator('.studio-header nav a[href="/contact"]');
    await contact.waitFor({ state: 'visible' });
    const contactBox = await contact.boundingBox();
    assert(contactBox && contactBox.x >= 0 && contactBox.x + contactBox.width <= viewport.width);
    assert(contactBox.width >= 44 && contactBox.height >= 44);
    await page.screenshot({ path: `${dir}/contact-${viewport.width}.png` });
    await contact.click();
    await page.locator('.office-details').waitFor({ timeout: 10000 });
    results.push({ viewport, record, contactBox, texture: Boolean(texture), contactOpened: true });
    await page.close();
  }
  const page = await browser.newPage({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`${base}?exhibit=education&talk=22d908af25b980db8fcbfc369cfd8fdb`);
  await page.locator('.tv-screen-reader[data-active="true"] img').first().waitFor({ timeout: 120000 });
  await page.locator('.tv-screen-image > img').evaluate(image => image.decode());
  assert.equal(await page.locator('.tv-screen-record').count(), 0);
  const previous = await page.locator('.tv-screen-image > img').getAttribute('src');
  await page.getByRole('button', { name: 'Next presentation slide', exact: true }).click();
  await page.waitForFunction(src => document.querySelector('.tv-screen-image > img')?.getAttribute('src') !== src, previous);
  await page.locator('.tv-screen-image > img').evaluate(image => image.decode());
  await page.screenshot({ path: `${dir}/existing-slide-375.png` });
  results.push({ existingDeck: true, nextSlide: true });
  assert.deepEqual(errors, []);
} finally {
  await writeFile(`${dir}/content-qa.json`, JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
