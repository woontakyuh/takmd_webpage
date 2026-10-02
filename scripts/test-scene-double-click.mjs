import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const base = process.env.QA_URL;
if (!base) throw new Error('Set QA_URL to a running office preview.');
const output = process.env.QA_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: process.env.QA_HEADED !== 'true',
  args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const development = (await (await page.request.get(base)).text()).includes('/@vite/client');
  if (!development) await page.addInitScript(() => {
    const roots = new Set();
    let renderer = 0;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer,
      onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
    window.doubleClickTestScene = () => {
      let result;
      const seen = new Set();
      function visit(fiber) {
        if (!fiber || seen.has(fiber) || result) return;
        seen.add(fiber);
        const value = fiber.memoizedProps?.value;
        const state = typeof value?.getState === 'function' ? value.getState() : null;
        if (state?.gl && state.scene && state.camera) { result = state; return; }
        visit(fiber.child); visit(fiber.sibling);
      }
      for (const root of roots) visit(root.current);
      return result;
    };
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(base);
  await page.locator('.office-poster[data-ready=true]').waitFor({ state: 'attached', timeout: 90000 });
  await page.evaluate(async () => {
    if (!window.doubleClickTestScene?.()) {
      const url = performance.getEntriesByType('resource').map(entry => entry.name)
        .find(name => name.includes('/@react-three_fiber.js?'));
      if (!url) throw new Error('Cannot find the loaded office scene.');
      const fiber = await import(url);
      window.doubleClickTestScene = () => [...fiber._roots.values()][0]?.store.getState();
    }
    window.doubleClickTestEvents = [];
    window.addEventListener('office:zoomed', event => window.doubleClickTestEvents.push(event.detail));
  });
  await page.waitForFunction(() => window.doubleClickTestScene()?.controls?.enabled);
  for (const example of [
    { name: 'window', x: 850, y: 330, hasSurface: false },
    { name: 'empty-background', x: 640, y: 100, hasSurface: false },
    { name: 'exhibit-surface', x: 340, y: 340, hasSurface: true },
  ]) {
    // Given an unobstructed canvas point and a settled overview camera.
    const before = await page.evaluate(({ x, y }) => {
      const s = window.doubleClickTestScene();
      const bounds = s.gl.domElement.getBoundingClientRect();
      const pointer = s.pointer.clone().set((x - bounds.left) / bounds.width * 2 - 1,
        -(y - bounds.top) / bounds.height * 2 + 1);
      s.raycaster.setFromCamera(pointer, s.camera);
      const surface = s.raycaster.intersectObjects(s.scene.children, true).find(hit => {
        let object = hit.object;
        while (object) { if (!object.visible) return false; object = object.parent; }
        return hit.object.isMesh && (Array.isArray(hit.object.material) ? hit.object.material : [hit.object.material])
          .some(material => material.visible && material.colorWrite && (!material.transparent || material.opacity > .1));
      });
      window.doubleClickTestEvents.length = 0;
      return { position: s.camera.position.toArray(), target: s.controls.target.toArray(),
        ray: s.raycaster.ray.direction.toArray(), surface: surface?.point.toArray() ?? null,
        canvas: document.elementFromPoint(x, y) === s.gl.domElement };
    }, example);
    assert.equal(before.canvas, true, `${example.name}: fixture must reach the canvas`);
    assert.equal(Boolean(before.surface), example.hasSurface, `${example.name}: fixture has expected geometry`);
    if (output) await page.screenshot({ path: `${output}/${example.name}-before.png` });

    // When the user double-clicks once at that point.
    await page.mouse.dblclick(example.x, example.y, { delay: 80 });
    let zoomed = true;
    try {
      await page.waitForFunction(() => window.doubleClickTestEvents.includes(true)
        && window.doubleClickTestScene().controls.enabled, null, { timeout: 6000 });
    } catch (error) {
      if (!(error instanceof Error) || error.name !== 'TimeoutError') throw error;
      zoomed = false;
    }
    const after = await page.evaluate(() => {
      const s = window.doubleClickTestScene();
      return { position: s.camera.position.toArray(), target: s.controls.target.toArray(),
        events: window.doubleClickTestEvents, selected: document.querySelector('.studio')?.getAttribute('data-selected') };
    });
    results.push({ example, before, after, zoomed });
    if (output) {
      await page.screenshot({ path: `${output}/${example.name}-after.png` });
      await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
    }

    // Then the camera approaches the clicked ray and surface clicks keep their exact hit target.
    assert.equal(zoomed, true, `${example.name}: one double-click must enter zoom`);
    assert.ok(Math.hypot(...after.position.map((value, index) => value - before.position[index])) > .5,
      `${example.name}: camera must visibly approach`);
    const toward = after.target.map((value, index) => value - before.position[index]);
    const length = Math.hypot(...toward);
    assert.ok(Math.hypot(...toward.map((value, index) => value / length - before.ray[index])) < .001,
      `${example.name}: target must follow the clicked ray`);
    if (before.surface) assert.ok(Math.hypot(...after.target.map((value, index) => value - before.surface[index])) < .001,
      'physical surfaces must retain their real hit target');
    assert.equal(after.selected, null, 'double-clicking an exhibit must not also open its reader');

    // Given a zoomed camera, when Escape is pressed, then the exact overview pose returns.
    await page.keyboard.press('Escape');
    await page.waitForFunction(saved => {
      const s = window.doubleClickTestScene();
      return s.controls.enabled && s.camera.position.distanceTo(s.camera.position.clone().fromArray(saved.position)) < .001
        && s.controls.target.distanceTo(s.controls.target.clone().fromArray(saved.target)) < .001;
    }, before, { timeout: 6000 });
  }
  assert.deepEqual(errors, [], 'zoom must not raise browser errors');
  console.log('PASS window, empty background, and physical exhibit double-click zoom; clicked-ray aim, single-click arbitration, and Escape return');
} finally { await browser.close(); }
