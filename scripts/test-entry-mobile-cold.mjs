import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright-core';
import { mkdir, writeFile } from 'node:fs/promises';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58820/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/main-mobile-20261003/entry-new';
await mkdir(evidence, { recursive: true });
const results = [];
// Capture the actual pre-hydration paint even when WebKit keeps font readiness pending behind gated scripts.
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY = '1';
for (const engine of process.env.ENTRY_TEST_ENGINE ? [process.env.ENTRY_TEST_ENGINE] : ['chromium', 'webkit']) {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'webkit' ? { executablePath: process.env.WEBKIT_EXECUTABLE ?? '/Users/TakMD/Library/Caches/ms-playwright/webkit-2336/pw_run.sh' } : { channel: 'chrome', args: ['--use-angle=metal', '--ignore-gpu-blocklist'] }) });
  try {
    for (const engaged of [true, false]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
      await context.addInitScript(() => {
        const roots = new Set(); let id = 0;
        window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++id,
          onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
        window.entryScene = () => {
          const seen = new Set();
          function visit(fiber) {
            if (!fiber || seen.has(fiber)) return null; seen.add(fiber);
            const value = fiber.memoizedProps?.value, state = typeof value?.getState === 'function' ? value.getState() : null;
            return state?.gl && state.scene && state.camera ? state : visit(fiber.child) ?? visit(fiber.sibling);
          }
          for (const root of roots) { const state = visit(root.current); if (state) return state; }
        };
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.addInitScript(() => {
        window.entryQa = { states: [], tasks: [], gaps: [] };
        try { new PerformanceObserver(list => window.entryQa.tasks.push(...list.getEntries().map(e => ({ start: e.startTime, duration: e.duration })))).observe({ type: 'longtask', buffered: true }); } catch {}
        let previous = performance.now();
        function frame(time) { if (time - previous > 100) window.entryQa.gaps.push({ time, gap: time - previous }); previous = time; requestAnimationFrame(frame); } requestAnimationFrame(frame);
        setInterval(() => window.entryQa.states.push({ time: performance.now(), state: { ...document.querySelector('.studio')?.dataset }, scroll: document.querySelector('.loading-monitor-reader .monitor-screen-content')?.scrollTop }), 100);
      });
      let releaseScripts;
      const gate = new Promise(resolve => { releaseScripts = resolve; });
      await page.route(/\.(?:m?js)(?:\?|$)/, async route => { await gate; await route.continue(); });
      await page.goto(url, { waitUntil: 'commit' });
      const reader = page.locator('.loading-monitor-reader[data-entry-reader=true]');
      const content = reader.locator('.monitor-screen-content');
      await content.waitFor();
      await page.waitForFunction(() => document.querySelector('.office-poster img')?.naturalWidth > 0);
      await page.screenshot({ path: `${evidence}/${engine}-${engaged}-pre-check.png` });
      const metrics = await content.evaluate(e => ({ width: e.getBoundingClientRect().width, height: e.getBoundingClientRect().height, clientWidth: e.clientWidth, scrollWidth: e.scrollWidth, font: parseFloat(getComputedStyle(e.querySelector('.monitor-cv-activity p')).fontSize), top: e.getBoundingClientRect().top }));
      assert(metrics.width >= 390 * .86 && metrics.width <= 390 && metrics.font >= 16, JSON.stringify(metrics));
      assert(metrics.scrollWidth <= metrics.clientWidth + 1);
      const bezel = await reader.locator('.loading-monitor-bezel').boundingBox();
      assert(bezel.width / bezel.height > 1.65 && bezel.width / bezel.height < 1.85, 'Entry must stay within a physical landscape monitor');
      assert(metrics.top >= bezel.y && metrics.top + metrics.height <= bezel.y + bezel.height, 'CV content must stay inside the monitor bezel');
      assert.equal(await reader.locator('.monitor-screen-header').count(), 0, 'Entry must not add a floating reader toolbar');
      assert.equal(await reader.getByRole('button', { name: 'Explore the office', exact: true }).count(), 0, 'Do not offer entry controls before the room is ready');
      assert.equal(await page.locator('canvas').count(), 0, 'Scenario must actually run before hydration');
      const name = `${engine}-${engaged ? 'engaged' : 'passive'}`;
      await page.screenshot({ path: `${evidence}/${name}-ssr.png` });
      let scroll = 0;
      if (engaged) {
        if (engine === 'chromium') {
          const client = await context.newCDPSession(page), box = await content.boundingBox();
          const x = box.x + box.width / 2, start = box.y + box.height * .8, end = box.y + box.height * .25;
          await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
          for (let i = 1; i <= 12; i++) { await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * i / 12 }] }); await page.waitForTimeout(20); }
          await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
          await client.detach();
        } else { await content.focus(); await page.keyboard.press('PageDown'); }
        await page.waitForTimeout(500);
        scroll = await content.evaluate(e => e.scrollTop);
        assert(scroll > 50, 'Pre-hydration native scroll must work');
        await page.screenshot({ path: `${evidence}/${name}-ssr-scrolled.png` });
      }
      releaseScripts();
      await page.locator('.studio[data-room-ready=true]').waitFor({ timeout: 120000 });
      await page.locator('.studio[data-entry=reading]').waitFor({ timeout: 15000 });
      const alignment = await page.evaluate(() => {
        const state = window.entryScene(), screen = state.scene.getObjectByName('Desk monitor screen');
        state.scene.updateMatrixWorld(true);
        const vertices = screen.geometry.attributes.position, points = [];
        for (let i = 0; i < vertices.count; i++) {
          const point = screen.position.clone().fromBufferAttribute(vertices, i);
          screen.localToWorld(point).project(state.camera);
          points.push({ x: (point.x + 1) * innerWidth / 2, y: (1 - point.y) * innerHeight / 2 });
        }
        const actual = document.querySelector('.loading-monitor-reader .monitor-screen-content').getBoundingClientRect();
        return { difference: Math.max(Math.abs(actual.left - Math.min(...points.map(p => p.x))), Math.abs(actual.right - Math.max(...points.map(p => p.x))), Math.abs(actual.top - Math.min(...points.map(p => p.y))), Math.abs(actual.bottom - Math.max(...points.map(p => p.y)))) };
      });
      assert(alignment.difference < 4, `Readable CV must align with the actual 3D monitor screen: ${JSON.stringify(alignment)}`);
      if (engaged) {
        await page.locator('.studio[data-entry=reading]').waitFor({ timeout: 15000 });
        await page.waitForTimeout(7500);
        assert(await reader.isVisible(), 'Engaged CV must survive the automatic overview timeout');
        assert(Math.abs(await content.evaluate(e => e.scrollTop) - scroll) < 2, 'Hydration and room readiness must preserve native pre-hydration scroll');
        await page.screenshot({ path: `${evidence}/${name}-retained.png` });
        await reader.getByRole('button', { name: 'Explore the office', exact: true }).click();
      }
      await page.locator('.studio[data-entry=complete]').waitFor({ timeout: 20000 });
      assert.equal(await reader.count(), 0);
      await page.screenshot({ path: `${evidence}/${name}-overview.png` });
      assert.deepEqual(errors, []);
      results.push({ name, passed: true, metrics, alignment, preHydrationScroll: scroll, errors, ...(await page.evaluate(() => ({ qa: window.entryQa, resources: performance.getEntriesByType('resource').map(e => ({ name: e.name, duration: e.duration, bytes: e.transferSize })) }))) });
      await context.close();
    }
  } finally { await browser.close(); await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2)); }
}
console.log('Mobile SSR readability, pre-hydration scroll, engaged retention, and passive overview passed.');
