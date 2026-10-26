import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/artwork-navigation');
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const phone of [false, true]) {
    const name = phone ? 'phone' : 'desktop', width = phone ? 375 : 1280, height = phone ? 812 : 900;
    const context = await browser.newContext({ viewport: { width, height }, hasTouch: phone, isMobile: phone });
    await context.addInitScript(() => {
      const roots = new Set(), renderers = new Map(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, renderers,
        inject: value => { renderers.set(++renderer, value); return renderer; },
        onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.artworkScene = () => {
        let result; const seen = new Set();
        function visit(fiber) {
          if (!fiber || seen.has(fiber) || result) return;
          seen.add(fiber);
          const value = fiber.memoizedProps?.value, state = typeof value?.getState === 'function' ? value.getState() : null;
          if (state?.gl && state.camera && state.controls) { result = state; return; }
          visit(fiber.child); visit(fiber.sibling);
        }
        for (const root of roots) visit(root.current);
        return result;
      };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const state = () => page.evaluate(() => {
      const { camera, controls } = window.artworkScene();
      return { position: camera.position.toArray(), target: controls.target.toArray(), enabled: controls.enabled, distance: camera.position.distanceTo(controls.target) };
    });
    const moved = (a, b) => Math.hypot(...a.map((value, index) => value - b[index]));
    await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin, { waitUntil: 'domcontentloaded' });
    await page.locator('.office-poster[data-ready="true"]').waitFor({ state: 'attached', timeout: 120000 });
    await page.waitForTimeout(4000);
    await page.getByRole('button', { name: 'Work & Life Balance', exact: true }).click();
    await page.waitForTimeout(2200);
    for (const [trigger, title] of [['View textured painting from SZQ Gallery', 'On canvas.'], ['View original painting', 'On paper.']]) {
      // Given: the artwork is approached and its explanation remains open.
      const returnPose = await state();
      await page.getByRole('button', { name: trigger, exact: true }).focus();
      await page.keyboard.press('Enter');
      const caption = page.getByRole('region', { name: title, exact: true });
      await caption.waitFor(); await page.waitForTimeout(2500);
      const before = await state(), x = Math.round(width * .38), y = Math.round(height * .35);
      assert.equal(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.tagName, { x, y }), 'CANVAS');
      // When: a real wheel or two-finger pinch zooms into the artwork.
      if (phone) {
        const cdp = await context.newCDPSession(page);
        const points = gap => [{ x: x - gap, y, id: 1 }, { x: x + gap, y, id: 2 }];
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: points(25) });
        for (let gap = 28; gap <= 65; gap += 3) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: points(gap) });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else { await page.mouse.move(x, y); await page.mouse.wheel(0, -140); }
      await page.waitForTimeout(800);
      const zoom = await state();
      assert(moved(before.position, zoom.position) > .025, `${name} ${title}: zoom must move the camera while the explanation is open`);
      assert(zoom.distance < before.distance, 'zoom must approach the artwork');
      // When: one-finger/mouse dragging rotates the close view.
      if (phone) {
        const cdp = await context.newCDPSession(page);
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y, id: 1 }] });
        for (let step = 1; step <= 10; step++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + step * 2, y: y + step, id: 1 }] });
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await cdp.detach();
      } else { await page.mouse.move(x, y); await page.mouse.down(); await page.mouse.move(x + 55, y + 20, { steps: 12 }); await page.mouse.up(); }
      await page.waitForTimeout(800);
      const orbit = await state();
      assert(moved(zoom.position, orbit.position) > .025, `${name} ${title}: drag must rotate the close view`);
      assert(await caption.isVisible(), 'camera gestures must retain the explanation');
      await page.waitForTimeout(1200);
      const held = await state();
      assert(moved(before.position, held.position) > .025, 'inspection must not snap back to its initial pose');
      await page.screenshot({ path: join(evidence, `${name}-${title === 'On canvas.' ? 'canvas' : 'paper'}-moved.png`) });
      if (title === 'On canvas.') {
        await caption.getByRole('button', { name: /Enlarge photograph/ }).click();
        const photo = page.getByRole('dialog', { name: 'SZQ Gallery photograph', exact: true });
        await photo.waitFor(); await page.keyboard.press('Escape'); await photo.waitFor({ state: 'detached' });
        assert(await caption.isVisible());
      }
      await page.getByRole('button', { name: `Close ${title}`, exact: true }).click();
      await caption.waitFor({ state: 'detached' }); await page.waitForTimeout(2400);
      assert(moved(returnPose.position, (await state()).position) < .01, 'close restores the pre-inspection view');
      results.push({ profile: name, title, before, zoom, orbit, held, photoAndClose: true });
      console.log('PASS', name, title);
    }
    assert.deepEqual(errors, []);
    await context.close();
  }
  await writeFile(join(evidence, 'results.json'), JSON.stringify(results, null, 2));
} finally { await browser.close(); await preview?.close(); }
