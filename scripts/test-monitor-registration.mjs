import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:4322/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/monitor-plane-2026-09-10';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const [width, height] of [[1280, 900], [390, 844], [812, 375]]) {
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.addInitScript(() => {
      const roots = new Set();
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => 1, onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.registrationScene = () => {
        const seen = new Set();
        const visit = fiber => {
          if (!fiber || seen.has(fiber)) return;
          seen.add(fiber);
          const store = fiber.memoizedProps?.value;
          if (typeof store?.getState === 'function') {
            const state = store.getState();
            if (state?.gl && state?.camera && state?.scene) return state;
          }
          return visit(fiber.child) ?? visit(fiber.sibling);
        };
        for (const root of roots) { const state = visit(root.current); if (state) return state; }
      };
    });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(new URL('?exhibit=research', url).href);
    await page.locator('.office-poster[data-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
    await page.waitForFunction(() => window.registrationScene()?.controls?.enabled);
    const measure = async (viewOffset = true) => page.evaluate(async useOffset => {
      const state = window.registrationScene(), camera = state.camera;
      const mesh = state.scene.getObjectByName('Desk monitor screen');
      // Probe an oblique view after the real research flow has applied its viewport offset.
      const center = mesh.localToWorld(mesh.position.clone().set(0, 0, 0));
      camera.position.copy(center).add(mesh.position.clone().set(.7, .55, -1.1));
      state.controls.target.copy(center); camera.lookAt(center); camera.updateMatrixWorld();
      const view = camera.view ? { ...camera.view } : null;
      if (!useOffset) { camera.clearViewOffset(); camera.updateProjectionMatrix(); }
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const surface = document.querySelector('.monitor-screen-reader');
      const canvas = state.gl.domElement.getBoundingClientRect();
      const corners = [[0, 0], [1, 0], [1, 1], [0, 1]].map(([right, bottom]) => {
        const marker = document.createElement('i');
        Object.assign(marker.style, { position: 'absolute', left: `${right * surface.clientWidth}px`, top: `${bottom * surface.clientHeight}px`, width: '0', height: '0', pointerEvents: 'none' });
        surface.appendChild(marker);
        const actual = marker.getBoundingClientRect();
        marker.remove();
        const point = mesh.position.clone().set((right - .5) * mesh.geometry.parameters.width, (.5 - bottom) * mesh.geometry.parameters.height, 0);
        mesh.localToWorld(point).project(camera);
        const expected = { x: canvas.left + (point.x + 1) * canvas.width / 2, y: canvas.top + (1 - point.y) * canvas.height / 2 };
        return { dx: actual.x - expected.x, dy: actual.y - expected.y, error: Math.hypot(actual.x - expected.x, actual.y - expected.y) };
      });
      if (!useOffset && view?.enabled) camera.setViewOffset(view.fullWidth, view.fullHeight, view.offsetX, view.offsetY, view.width, view.height);
      return { view, corners, readerCount: document.querySelectorAll('.monitor-screen-reader').length, loadingReaders: document.querySelectorAll('.loading-monitor-reader').length };
    }, viewOffset);
    const shifted = await measure();
    const centered = await measure(false);
    const restored = await measure();
    const result = { width, height, shifted, centered, restored, errors };
    results.push(result);
    await page.screenshot({ path: `${evidence}/registration-${width}.png` });
    assert.equal(shifted.readerCount, 1, 'Only one live CV surface should exist');
    assert.equal(shifted.loadingReaders, 0);
    assert(Math.max(...centered.corners.map(point => point.error)) < 1, 'Centered projection must match the monitor');
    assert(Math.max(...shifted.corners.map(point => point.error)) < 1, `CV must stay attached under an offset camera: ${JSON.stringify(shifted)}`);
    assert(Math.max(...restored.corners.map(point => point.error)) < 1, 'Restoring the exhibit offset must preserve registration');
    assert.deepEqual(errors, []);
    await context.close();
  }
} finally {
  await writeFile(`${evidence}/registration.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log('Monitor registration passed at desktop, portrait and landscape sizes.');
