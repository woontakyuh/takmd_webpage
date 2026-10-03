import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright-core';

const base = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58798/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/workshop-restore-20261003/after';
await mkdir(evidence, { recursive: true });
const results = [];
for (const engine of process.env.WORKSHOP_ENGINE ? [process.env.WORKSHOP_ENGINE] : ['chromium', 'webkit']) {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'webkit'
    ? { executablePath: '/Users/TakMD/Library/Caches/ms-playwright/webkit-2336/pw_run.sh' }
    : { channel: 'chrome', args: ['--use-angle=metal'] }) });
  try {
    for (const [slug, count] of [['dummy', 14], ['cadaver', 11], ['animal-pig', 3]]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: engine === 'chromium' });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      try {
        await page.goto(`${base}?exhibit=spine&stage=approach&detail=/workshops/${slug}`);
        const dialog = page.locator('.studio-dialog[open]');
        await dialog.waitFor({ timeout: 120000 });
        await page.locator('.studio[data-room-ready=true][data-entry=complete]').waitFor({ timeout: 120000 });
        await dialog.evaluate(e => Promise.all(e.getAnimations().map(a => a.finished)));
        const body = dialog.locator('.studio-reader-body');
        const initial = await body.boundingBox();
        assert(Math.abs(initial.y - 422) < 3, 'Reader starts at half height');
        assert.equal(await dialog.locator('.room-photo-open').count(), count);
        assert.equal(await page.evaluate(() => Boolean(document.elementFromPoint(195, 180)?.closest('.studio-dialog'))), false, 'The exposed room remains interactive');
        await page.mouse.move(200, 650);
        await page.mouse.wheel(0, 120);
        await page.waitForFunction(() => document.querySelector('.studio-dialog').scrollTop >= 119);
        const partial = await dialog.evaluate(e => ({ scroll: e.scrollTop, y: e.querySelector('.studio-reader-body').getBoundingClientRect().y }));
        assert(Math.abs(initial.y - partial.y - partial.scroll) < 2, 'The sheet follows native scrolling one-to-one');
        await page.screenshot({ path: `${evidence}/${engine}-${slug}-partial.png` });
        if (engine === 'chromium') {
          const client = await context.newCDPSession(page);
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 200, y: 710 }] });
          for (let step = 1; step <= 16; step++) {
            await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 200, y: 710 - step * 22 }] });
            await page.evaluate(() => new Promise(requestAnimationFrame));
          }
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await client.detach();
        } else await page.mouse.wheel(0, 480);
        await page.waitForFunction(() => document.querySelector('.studio-dialog').scrollTop >= 414);
        await page.waitForFunction(() => Boolean(document.elementFromPoint(195, 180)?.closest('.studio-dialog')), undefined, { timeout: 3000 });
        await dialog.evaluate(e => new Promise(resolve => {
          let previous = e.scrollTop, stable = 0;
          const frame = () => {
            stable = e.scrollTop === previous ? stable + 1 : 0;
            previous = e.scrollTop;
            if (stable >= 8) resolve();
            else requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        }));
        await page.mouse.move(200, 650);
        await page.mouse.wheel(0, -10000);
        await page.waitForFunction(() => document.querySelector('.studio-dialog').style.getPropertyValue('--reader-scroll') === '0px');
        assert(Math.abs((await body.boundingBox()).y - initial.y) < 2, 'Returning to the beginning reveals the room again');
        const images = dialog.locator('.room-photo-open img');
        for (const img of await images.all()) {
          await img.scrollIntoViewIfNeeded();
          await img.evaluate(e => e.decode());
          assert(await img.evaluate(e => e.naturalWidth > 0));
        }
        const photo = dialog.locator('.room-photo-open').first();
        await photo.click();
        const viewer = page.locator('.room-photo-viewer[open]');
        await viewer.waitFor();
        await viewer.locator('img').evaluate(e => e.decode());
        const first = await viewer.locator('img').getAttribute('src');
        await viewer.getByRole('button', { name: 'Next photograph', exact: true }).click();
        await viewer.locator('img').evaluate(e => e.decode());
        assert.notEqual(await viewer.locator('img').getAttribute('src'), first);
        await viewer.getByRole('button', { name: 'Close photograph', exact: true }).click();
        await dialog.evaluate(e => e.scrollTo({ top: 414, behavior: 'instant' }));
        await page.screenshot({ path: `${evidence}/${engine}-${slug}-full.png` });
        await page.getByRole('button', { name: 'Expand reading view', exact: true }).click();
        assert(await dialog.evaluate(e => e.matches(':modal')));
        await page.getByRole('button', { name: 'Return to side reader', exact: true }).click();
        await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
        await dialog.waitFor({ state: 'hidden' });
        assert.deepEqual(errors, []);
        results.push({ engine, slug, photos: count, passed: true });
      } catch (error) {
        await page.screenshot({ path: `${evidence}/${engine}-${slug}-failure.png` });
        console.error(await page.locator('.studio-dialog').evaluate(e => ({ scroll: e.scrollTop, clip: getComputedStyle(e).clipPath, offset: e.style.getPropertyValue('--reader-scroll'), hit: document.elementFromPoint(195, 180)?.outerHTML.slice(0, 200) })));
        throw error;
      } finally { await context.close(); }
    }
  } finally { await browser.close(); await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2)); }
}
console.log(JSON.stringify(results));
