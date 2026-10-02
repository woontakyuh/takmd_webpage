import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/office-cadence');
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    const roots = new Set(), renderers = new Map();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = {
      renderers, supportsFiber: true,
      inject(renderer) { const id = renderers.size + 1; renderers.set(id, renderer); return id; },
      onCommitFiberRoot(_id, root) { roots.add(root); }, onCommitFiberUnmount() {}, checkDCE() {},
    };
    window.officeScene = () => {
      const visited = new Set();
      const visit = fiber => {
        if (!fiber || visited.has(fiber)) return null;
        visited.add(fiber);
        const value = fiber.memoizedProps?.value;
        const state = typeof value?.getState === 'function' ? value.getState() : null;
        return state?.gl && state.scene && state.camera ? state : visit(fiber.child) ?? visit(fiber.sibling);
      };
      for (const root of roots) { const state = visit(root.current); if (state) return state; }
      return null;
    };
  });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin, { waitUntil: 'domcontentloaded' });
  await page.locator('.studio[data-room-ready="true"]').waitFor({ timeout: 120000 });
  // The initial reader closes itself during reveal; wait instead of racing its disappearing close button.
  await page.waitForFunction(() => document.querySelector('.studio')?.dataset.entry === 'complete', null, { timeout: 60000 });
  await page.waitForTimeout(7500);
  await page.evaluate(() => {
    const state = window.officeScene(), render = state.gl.render;
    window.roomFrames = 0;
    state.gl.render = function (scene, camera) {
      if (scene === state.scene) window.roomFrames++;
      return render.call(this, scene, camera);
    };
  });
  await page.waitForTimeout(2000);
  const idleFrames = await page.evaluate(() => window.roomFrames);
  assert(idleFrames >= 6 && idleFrames <= 16, `Idle desktop should keep a low live cadence, got ${idleFrames} frames/2s`);
  await page.keyboard.press('ArrowRight');
  await page.evaluate(() => { window.roomFrames = 0; });
  await page.waitForTimeout(2000);
  const activeFrames = await page.evaluate(() => window.roomFrames);
  assert(activeFrames > idleFrames * 2, `Input should promptly restore animation cadence: ${idleFrames} idle vs ${activeFrames} active`);
  assert.deepEqual(errors, []);
  await writeFile(join(evidence, 'result.json'), JSON.stringify({ idleFrames, activeFrames, seconds: 2, errors }, null, 2));
  console.log(`Desktop cadence passed: ${idleFrames} idle / ${activeFrames} active frames in two seconds.`);
} finally {
  await browser.close();
  await preview?.close();
}
