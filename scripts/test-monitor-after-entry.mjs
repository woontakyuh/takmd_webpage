import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium, webkit } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:58798/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/monitor-after-entry';
const width = Number(process.env.MONITOR_WIDTH ?? 390), height = Number(process.env.MONITOR_HEIGHT ?? 844);
const mobile = width < 760 || height < 500;
await mkdir(evidence, { recursive: true });
const results = [];
for (const engine of process.env.MONITOR_ENGINE ? [process.env.MONITOR_ENGINE] : ['chromium', 'webkit']) {
  const browser = await (engine === 'webkit' ? webkit : chromium).launch({ headless: true, ...(engine === 'webkit' ? { executablePath: '/Users/TakMD/Library/Caches/ms-playwright/webkit-2336/pw_run.sh' } : { channel: 'chrome', args: ['--use-angle=metal'] }) });
  try {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile });
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(error.stack); });
    await page.addInitScript(() => {
      const roots = new Set();
      window.monitorRoots = roots;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.monitorScene = () => {
        const seen = new Set();
        const visit = fiber => {
          if (!fiber || seen.has(fiber)) return null;
          seen.add(fiber);
          const store = fiber.memoizedProps?.value;
          const state = typeof store?.getState === 'function' ? store.getState() : null;
          return state?.gl && state.scene && state.camera ? state : visit(fiber.child) ?? visit(fiber.sibling);
        };
        for (const root of roots) { const state = visit(root.current); if (state) return state; }
      };
      window.monitorBounds = () => {
        const state = window.monitorScene();
        const mesh = state?.scene.getObjectByName('Desk monitor screen');
        if (!mesh) return null;
        state.scene.updateMatrixWorld(true);
        const points = [];
        const vertices = mesh.geometry.attributes.position;
        const canvas = state.gl.domElement.getBoundingClientRect();
        for (let i = 0; i < vertices.count; i++) {
          const point = mesh.position.clone().fromBufferAttribute(vertices, i);
          mesh.localToWorld(point).project(state.camera);
          points.push({ x: canvas.left + (point.x + 1) * canvas.width / 2, y: canvas.top + (1 - point.y) * canvas.height / 2 });
        }
        return { left: Math.min(...points.map(p => p.x)), right: Math.max(...points.map(p => p.x)), top: Math.min(...points.map(p => p.y)), bottom: Math.max(...points.map(p => p.y)) };
      };
    });
    await page.goto(url);
    await page.locator('.studio[data-room-ready=true]').waitFor({ timeout: 120000 });
    const explore = page.getByRole('button', { name: 'Explore the office', exact: true });
    if (await explore.isVisible()) await explore.click();
    await page.locator('.studio[data-entry=complete]').waitFor();
    const monitor = await page.evaluate(() => window.monitorBounds());
    const point = [(monitor.left + monitor.right) / 2, (monitor.top + monitor.bottom) / 2];
    if (mobile) await page.touchscreen.tap(...point);
    else await page.mouse.click(...point);
    await page.locator('.studio[data-reading=ai]').waitFor();
    await page.screenshot({ path: `${evidence}/${engine}-clicked.png` });
    assert.equal(await page.locator('.loading-monitor-reader').count(), 0, 'A loaded room must open the physical monitor, not the loading popup');
    const content = page.locator('.monitor-screen-portal .monitor-screen-content');
    await content.waitFor();
    await page.waitForFunction(() => {
      const bounds = window.monitorBounds();
      const content = document.querySelector('.monitor-screen-portal .monitor-screen-content');
      if (!content || !bounds) return false;
      const box = content.getBoundingClientRect();
      return Math.max(...['left', 'right', 'top', 'bottom'].map(key => Math.abs(box[key] - bounds[key]))) < 4;
    });
    const box = await content.boundingBox();
    assert(box.width > 330 && box.width / box.height > 1.7 && box.width / box.height < 1.85);
    assert.equal(await content.evaluate(e => e.scrollWidth > e.clientWidth + 1), false);
    await page.screenshot({ path: `${evidence}/${engine}-physical-monitor.png` });
    const texture = await page.evaluate(() => window.monitorScene().scene.getObjectByName('Desk monitor screen').material.map.image.toDataURL('image/png'));
    await writeFile(`${evidence}/${engine}-cover-texture.png`, Buffer.from(texture.split(',')[1], 'base64'));
    await content.screenshot({ path: `${evidence}/${engine}-cover-interactive.png` });
    if (mobile) {
      const typography = await content.evaluate(e => [...e.querySelectorAll('.monitor-cv-activity p')].map(p => ({
        text: p.textContent, lines: Math.round(p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)),
      })));
      assert(typography.filter(p => p.lines === 1).length >= typography.length - 1, JSON.stringify(typography));
      await content.locator('.monitor-cv-activity').first().evaluate(e => {
        const parent = e.closest('.monitor-screen-content');
        parent.scrollTop += e.getBoundingClientRect().top - parent.getBoundingClientRect().top - 10;
      });
      await page.screenshot({ path: `${evidence}/${engine}-activities.png` });
    }
    await content.focus();
    await page.keyboard.press('End');
    await page.waitForFunction(() => {
      const element = document.querySelector('.monitor-screen-portal .monitor-screen-content');
      return element && element.scrollTop > 50 && Math.abs(element.scrollTop - (element.scrollHeight - element.clientHeight)) < 1;
    });
    const scroll = await content.evaluate(e => e.scrollTop);
    assert(scroll > 50, `${engine}: scroll must advance, received ${scroll}`);
    await page.locator('.monitor-screen-portal').getByRole('button', { name: 'Close and return to office', exact: true }).click();
    await page.locator('.studio:not([data-reading])').waitFor();
    await page.getByRole('link', { name: 'Living CV', exact: true }).click();
    await content.waitFor();
    await page.waitForFunction(scroll => Math.abs(document.querySelector('.monitor-screen-portal .monitor-screen-content')?.scrollTop - scroll) < 2, scroll).catch(async error => {
      const diagnostic = await page.evaluate(() => {
        const values = [], seen = new Set();
        const visit = f => { if (!f || seen.has(f)) return; seen.add(f); if (f.memoizedProps?.scrollState) values.push({ component: f.type?.name, scroll: f.memoizedProps.scrollState.scrollTop }); visit(f.child); visit(f.sibling); };
        for (const root of window.monitorRoots) visit(root.current);
        const content = document.querySelector('.monitor-screen-portal .monitor-screen-content');
        return { values, scroll: content?.scrollTop, height: content?.clientHeight, active: document.activeElement?.outerHTML.slice(0, 250) };
      });
      console.error(JSON.stringify({ engine, expected: scroll, diagnostic }));
      throw error;
    });
    await page.keyboard.press('Escape');
    await page.locator('.studio:not([data-reading])').waitFor();
    assert.deepEqual(errors, []);
    results.push({ engine, box, scroll, errors, passed: true });
  } finally { await browser.close(); }
}
await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
console.log(JSON.stringify(results));
