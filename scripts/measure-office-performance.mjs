import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/office-performance');
await mkdir(evidence, { recursive: true });
const preview = await startPublicPreview(resolve('dist'));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const phone of [true, false]) for (let run = 0; run < Number(process.env.PERFORMANCE_RUNS ?? 3); run++) {
    const profile = phone ? 'phone' : 'desktop';
    const context = await browser.newContext({ viewport: phone ? { width: 375, height: 812 } : { width: 1440, height: 1000 }, isMobile: phone, hasTouch: phone });
    await context.addInitScript(() => {
      const roots = new Set(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer, onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.officeTestScene = () => {
        let result; const seen = new Set();
        const visit = fiber => {
          if (!fiber || seen.has(fiber) || result) return;
          seen.add(fiber);
          const value = fiber.memoizedProps?.value, state = typeof value?.getState === 'function' ? value.getState() : null;
          if (state?.gl && state.scene && state.camera) { result = state; return; }
          visit(fiber.child); visit(fiber.sibling);
        };
        for (const root of roots) visit(root.current);
        return result;
      };
      window.officeArrival = null;
      new MutationObserver(() => {
        if (!window.officeArrival && document.querySelector('.office-poster[data-ready="true"]')) window.officeArrival = performance.now();
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ready'] });
    });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(preview.origin, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => window.officeArrival && window.officeTestScene()?.controls, null, { timeout: 120000 });
    const close = page.getByRole('button', { name: 'Close and return to office', exact: true });
    if (await close.isVisible()) await close.click();
    await page.waitForTimeout(6500);
    const cdp = await context.newCDPSession(page);
    const { result: listeners } = await cdp.send('Runtime.evaluate', { expression: 'Object.fromEntries(Object.entries(getEventListeners(window)).map(([key, value]) => [key,value.length]))', includeCommandLineAPI: true, returnByValue: true });
    await page.evaluate(() => {
      const state = window.officeTestScene(), original = state.gl.render;
      window.officeRender = { frames: 0, calls: 0, triangles: 0, cpuMs: 0, start: performance.now() };
      state.gl.render = function(scene, camera) {
        const start = performance.now(); original.call(this, scene, camera);
        if (scene !== state.scene) return;
        const m = window.officeRender;
        m.frames++; m.calls += this.info.render.calls; m.triangles += this.info.render.triangles; m.cpuMs += performance.now() - start;
      };
    });
    await page.waitForTimeout(6000);
    const measured = await page.evaluate(() => {
      const m = window.officeRender, resources = performance.getEntriesByType('resource');
      return { readyMs: window.officeArrival, durationMs: performance.now() - m.start, ...m,
        bytes: resources.reduce((sum, resource) => sum + resource.encodedBodySize, 0),
        resources: resources.map(r => ({ path: new URL(r.name).pathname, bytes: r.encodedBodySize })).sort((a,b) => b.bytes-a.bytes).slice(0,15) };
    });
    if (run === 0) {
      await page.screenshot({ path: join(evidence, `${profile}-overview.png`) });
      await page.getByRole('button', { name: 'Liquor & Music', exact: true }).click();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: join(evidence, `${profile}-music.png`) });
      const guitar = page.getByRole('button', { name: 'Approach Fender Stratocaster', exact: true });
      await guitar.focus(); await guitar.press('Enter');
      await page.getByRole('button', { name: 'Close music corner', exact: true }).waitFor();
      await page.waitForTimeout(2500);
      await page.screenshot({ path: join(evidence, `${profile}-guitar.png`) });
    }
    assert.deepEqual(errors, []);
    results.push({ profile, run, listeners: listeners.value, ...measured });
    console.log(JSON.stringify({ profile, run, readyMs: measured.readyMs, bytes: measured.bytes, frames: measured.frames, cpuMs: measured.cpuMs, pointermove: listeners.value.pointermove }));
    await context.close();
  }
} finally {
  await writeFile(join(evidence, 'performance.json'), JSON.stringify(results, null, 2));
  await browser.close(); await preview.close();
}
