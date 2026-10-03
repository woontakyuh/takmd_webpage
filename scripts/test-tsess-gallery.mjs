import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58798/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/tsess-20261003/browser';
const photos = JSON.parse(await readFile('src/data/tsess-workshop-photos.json', 'utf8'));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal'] });
const results = [];
try {
  for (const width of [390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 1000 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${base}workshops/cadaver`);
    const section = page.locator('[id="2026-06-08-tsess-hualien"]');
    const first = section.locator('.room-photo-open').first();
    await first.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => [...document.querySelectorAll('astro-island')].every(e => !e.hasAttribute('ssr')));
    assert.equal(await section.locator('.room-photo-open').count(), photos.length);
    assert.equal(await section.locator('.workshop-room-gallery').evaluate(e => getComputedStyle(e).display), 'grid');
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.screenshot({ path: `${evidence}/gallery-${width}.png` });
    await first.click();
    const viewer = page.locator('.room-photo-viewer[open]');
    await viewer.waitFor();
    for (const photo of photos) {
      assert.equal(await viewer.locator('img').getAttribute('src'), photo.src);
      await viewer.locator('img').evaluate(e => e.decode());
      assert(await viewer.locator('img').evaluate(e => e.naturalWidth > 0));
      await viewer.getByRole('button', { name: 'Next photograph', exact: true }).click();
    }
    assert.equal(await viewer.locator('img').getAttribute('src'), photos[0].src);
    await viewer.getByRole('button', { name: 'Zoom photograph', exact: true }).click();
    assert.equal(await viewer.locator('.room-photo-viewport').getAttribute('data-zoomed'), 'true');
    await viewer.getByRole('button', { name: 'Fit photograph', exact: true }).click();
    await page.screenshot({ path: `${evidence}/expanded-${width}.png` });
    await viewer.getByRole('button', { name: 'Close photograph', exact: true }).click();
    await viewer.waitFor({ state: 'hidden' });
    assert.deepEqual(errors, []);
    results.push({ width, photos: photos.length, passed: true });
    await context.close();
  }
} finally {
  await browser.close();
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
}
console.log(JSON.stringify(results));
