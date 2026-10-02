import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:4322/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/monitor-cv';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const [width, height, touch] of [[1280, 900, false], [390, 844, true], [812, 375, true]]) {
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: touch, isMobile: touch });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const roots = new Set();
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.monitorTestScene = () => {
        let scene;
        const seen = new Set();
        const visit = fiber => {
          if (!fiber || seen.has(fiber) || scene) return;
          seen.add(fiber);
          const store = fiber.memoizedProps?.value;
          if (typeof store?.getState === 'function') {
            const state = store.getState();
            if (state?.gl && state?.camera && state?.scene) { scene = state; return; }
          }
          visit(fiber.child); visit(fiber.sibling);
        };
        for (const root of roots) visit(root.current);
        return scene;
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.locator('.office-poster[data-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
    const { x, y } = await page.evaluate(() => {
      const state = window.monitorTestScene();
      const monitor = state.scene.getObjectByName('Desk monitor screen');
      const center = monitor.position.clone().set(0, 0, 0);
      monitor.localToWorld(center); center.project(state.camera);
      const canvas = state.gl.domElement.getBoundingClientRect();
      return { x: canvas.x + (center.x + 1) * canvas.width / 2, y: canvas.y + (1 - center.y) * canvas.height / 2 };
    });
    if (touch) await page.touchscreen.tap(x, y);
    else await page.mouse.click(x, y);
    await page.locator('.studio[data-reading=ai]').waitFor({ state: 'attached' });
    await page.waitForFunction(() => {
      const screen = document.querySelector('.monitor-screen-content');
      return screen && screen.getBoundingClientRect().width > innerWidth * .6;
    });
    await page.waitForTimeout(1500);
    const content = page.locator('.monitor-screen-reader[data-active=true] .monitor-screen-content');
    const active = await content.boundingBox();
    assert(active);
    const scrollBefore = await content.evaluate(element => element.scrollTop);
    if (touch) {
      const client = await context.newCDPSession(page);
      const x = active.x + active.width * .55;
      const start = active.y + active.height * .8, end = active.y + active.height * .2;
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
      for (let step = 1; step <= 12; step++) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * step / 12 }] });
        await page.waitForTimeout(20);
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await client.detach();
    } else {
      await page.mouse.move(active.x + active.width * .55, active.y + active.height * .5);
      await page.mouse.wheel(0, 600);
    }
    await page.waitForFunction(previous => document.querySelector('.monitor-screen-reader[data-active=true] .monitor-screen-content').scrollTop > previous + 50, scrollBefore);
    const scrollAfter = await content.evaluate(element => element.scrollTop);
    assert.equal(await content.locator('.monitor-cv-record').count(), 0);
    assert.equal(await content.getByRole('heading', { name: 'Publications', exact: true }).count(), 0);
    assert.equal(await content.getByRole('heading', { name: 'Presentations', exact: true }).count(), 0);
    await content.getByText('Best Shorts Award, KOSESS', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidence}/award-${width}.png` });
    const documentId = await page.evaluate(() => { window.monitorTestDocument = crypto.randomUUID(); return window.monitorTestDocument; });
    for (const [path, selected] of [['/research', 'research'], ['/education', 'education']]) {
      await content.locator(`a[href="${path}"]`).click();
      await page.locator(`.studio[data-reading=${selected}]`).waitFor({ state: 'attached' });
      assert.equal(await page.evaluate(() => window.monitorTestDocument), documentId);
      await page.getByRole('button', { name: 'Return to the overview', exact: true }).click();
      await page.locator('.studio:not([data-selected])').waitFor({ state: 'attached' });
      await page.locator('#studio-exhibit-ai').click();
      await page.locator('.monitor-screen-reader[data-active=true]').waitFor();
      await page.waitForTimeout(1500);
    }
    // Given a reader positioned below its cover, closing must show the cover in the office.
    const scrollBeforeClose = await content.evaluate(element => element.scrollTop);
    assert(scrollBeforeClose > 50);
    await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
    await page.locator('.studio:not([data-selected])').waitFor({ state: 'attached' });
    const inactiveContent = page.locator('.monitor-screen-reader[data-active=false] .monitor-screen-content');
    await inactiveContent.waitFor({ state: 'attached' });
    await page.getByRole('button', { name: 'The desk', exact: true }).click();
    await page.waitForFunction(() => window.monitorTestScene()?.controls?.enabled === true);
    // Move inside the invisible shadow enclosure that occludes HTML in the guided view.
    for (let step = 0; step < 4; step++) await page.locator('.studio-scene').press('+');
    await page.waitForFunction(() => document.querySelector('.monitor-screen-reader[data-active=false] .monitor-screen-content')?.clientHeight > 0);
    const scrollAfterClose = await inactiveContent.evaluate(async element => {
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      return element.scrollTop;
    });
    await page.screenshot({ path: `${evidence}/closed-cover-${width}.png` });
    assert.equal(scrollAfterClose, 0, 'The inactive office monitor must display the CV cover');

    // Given the office cover, reopening must resume the last reading position.
    await page.locator('#studio-exhibit-ai').click();
    await page.waitForFunction(() => document.activeElement?.getAttribute('aria-label') === 'Close and return to office');
    const scrollAfterReopen = await content.evaluate(element => element.scrollTop);
    assert(Math.abs(scrollAfterReopen - scrollBeforeClose) <= 1, `Reopening must restore ${scrollBeforeClose}, received ${scrollAfterReopen}`);
    await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
    await page.locator('.studio:not([data-selected])').waitFor({ state: 'attached' });
    assert.deepEqual(errors, []);
    results.push({ width, height, touch, scrollBefore, scrollAfter, scrollBeforeClose, scrollAfterClose, scrollAfterReopen, award: true, internalRoutes: true, close: true });
    await context.close();
  }
} finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
