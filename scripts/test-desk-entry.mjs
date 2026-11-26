import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { resolve } from 'node:path';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/mobile-entry-20260930/entry';
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const url = process.env.OFFICE_TEST_URL ?? preview.origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const width of [390, 1280]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 }, isMobile: width === 390, hasTouch: width === 390 });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    let releaseRoom;
    const gate = new Promise(resolve => { releaseRoom = resolve; });
    await page.route(/RoomContents[^/]*\.(?:js|tsx)/, async route => { await gate; await route.continue(); });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await page.locator('.studio[data-desk-ready=true]').waitFor({ state: 'attached', timeout: 30000 });
    assert.equal(await page.locator('.studio').getAttribute('data-room-ready'), 'false');
    const initial = await page.evaluate(() => ({ deskAt: performance.now(), models: performance.getEntriesByType('resource').filter(entry => /\.(glb|gltf)/.test(entry.name)).map(entry => entry.name) }));
    assert(!initial.models.some(model => /surfboard|garment|plant|spine|eames|stratocaster/.test(model)), 'Room models must not block or compete with the desk');
    await page.screenshot({ path: `${evidence}/desk-${width}.png` });
    await page.getByRole('button', { name: 'Publications', exact: true }).click();
    const paper = page.getByRole('dialog', { name: 'Research folio', exact: true });
    await paper.waitFor();
    assert.equal(await page.locator('.studio').getAttribute('data-room-ready'), 'false');
    await page.screenshot({ path: `${evidence}/paper-before-room-${width}.png` });
    await page.keyboard.press('Escape');
    await paper.waitFor({ state: 'hidden' });
    await page.getByRole('button', { name: 'Read CV', exact: true }).click();
    const content = page.locator('.loading-monitor-reader .monitor-screen-content');
    await content.waitFor();
    await content.evaluate(element => { element.scrollTop = 400; element.dispatchEvent(new Event('scroll')); });
    const scroll = await content.evaluate(element => element.scrollTop);
    releaseRoom();
    await page.locator('.studio[data-room-ready=true][data-entry=reading]').waitFor({ state: 'attached', timeout: 120000 });
    assert(await content.isVisible(), 'Room reveal must keep the active CV open');
    assert.equal(await content.evaluate(element => element.scrollTop), scroll, 'Room reveal must retain reading position');
    await page.screenshot({ path: `${evidence}/reader-reveal-${width}.png` });
    await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
    await page.locator('.studio[data-entry=complete]').waitFor({ state: 'attached', timeout: 15000 });
    await page.screenshot({ path: `${evidence}/overview-${width}.png` });
    assert.deepEqual(errors, []);
    results.push({ width, ...initial, preservedScroll: scroll, roomReady: true });
    await context.close();
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    window.entryMetrics = { desk: null, room: null, tasks: [] };
    performance.setResourceTimingBufferSize(2000);
    new PerformanceObserver(list => window.entryMetrics.tasks.push(...list.getEntries().map(entry => ({ start: entry.startTime, duration: entry.duration })))).observe({ type: 'longtask', buffered: true });
    new MutationObserver(() => {
      const studio = document.querySelector('.studio');
      for (const key of ['desk', 'room']) if (!window.entryMetrics[key] && studio?.getAttribute(`data-${key}-ready`) === 'true') window.entryMetrics[key] = performance.now();
    }).observe(document, { subtree: true, attributes: true, childList: true });
  });
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('.studio[data-room-ready=true][data-entry=complete]').waitFor({ state: 'attached', timeout: 120000 });
  const performanceResult = await page.evaluate(() => ({ ...window.entryMetrics, resources: performance.getEntriesByType('resource').map(entry => ({ url: entry.name, bytes: entry.encodedBodySize, start: entry.startTime })) }));
  results.push({ coldMobile: performanceResult });
  console.log('Cold mobile:', JSON.stringify({ deskMs: performanceResult.desk, roomMs: performanceResult.room, bytesBeforeDesk: performanceResult.resources.filter(entry => entry.start < performanceResult.desk).reduce((sum, entry) => sum + entry.bytes, 0) }));
  await context.close();
} finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
  await browser.close(); await preview?.close();
}
console.log('Desk first, publications before room, CV-preserving reveal and overview passed.');
