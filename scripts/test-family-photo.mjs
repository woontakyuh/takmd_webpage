import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/family-photo');
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const base = process.env.OFFICE_TEST_URL ?? preview.origin;
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];

async function settle(page) {
  await page.evaluate(() => { window.photoPreviousCamera = null; window.photoStableFrames = 0; });
  await page.waitForFunction(() => {
    const s = window.photoTestScene(), position = s?.camera.position.toArray();
    if (!position) return false;
    const before = window.photoPreviousCamera; window.photoPreviousCamera = position;
    if (!before || Math.hypot(...position.map((value, i) => value - before[i])) > .0001) {
      window.photoStableFrames = 0; return false;
    }
    return ++window.photoStableFrames >= 12;
  }, null, { timeout: 30000 });
}

async function clickPhoto(page) {
  const point = await page.evaluate(() => {
    const s = window.photoTestScene(), frame = s.scene.getObjectByName('Exhibit family');
    const screen = frame.getObjectByName('digital-photo-screen');
    s.scene.updateMatrixWorld(true);
    const p = screen.getWorldPosition(screen.position.clone()).project(s.camera);
    const x = (p.x + 1) * innerWidth / 2, y = (1 - p.y) * innerHeight / 2;
    s.raycaster.setFromCamera(s.pointer.clone().set(p.x, p.y), s.camera);
    const hit = s.raycaster.intersectObjects(s.scene.children, true).find(item => {
      for (let object = item.object; object; object = object.parent) if (!object.visible) return false;
      return true;
    });
    let exact = false;
    for (let object = hit?.object; object; object = object.parent) if (object === frame) exact = true;
    return { x, y, exact, canvas: document.elementFromPoint(x, y) === s.gl.domElement };
  });
  assert.ok(point.exact && point.canvas, `physical photo must be clickable: ${JSON.stringify(point)}`);
  if (page.viewportSize().width < 760) await page.touchscreen.tap(point.x, point.y);
  else await page.mouse.click(point.x, point.y);
  await page.locator('.studio[data-reading="family"]').waitFor({ state: 'attached' });
  await page.locator('.office-frame-info--family[open]').waitFor();
  await settle(page);
  return point;
}

async function inspect(page, scenario, label) {
  const state = await page.evaluate(() => {
    const s = window.photoTestScene(), frame = s.scene.getObjectByName('Exhibit family');
    const screen = frame.getObjectByName('digital-photo-screen'), vertices = screen.geometry.attributes.position;
    s.scene.updateMatrixWorld(true);
    const corners = Array.from({ length: vertices.count }, (_, index) =>
      screen.localToWorld(screen.position.clone().fromBufferAttribute(vertices, index)).project(s.camera));
    const xs = corners.map(p => (p.x + 1) * innerWidth / 2), ys = corners.map(p => (1 - p.y) * innerHeight / 2);
    const photo = { left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) };
    const center = screen.getWorldPosition(screen.position.clone());
    const front = screen.position.clone().set(0, 0, 1).transformDirection(screen.matrixWorld);
    const caption = document.querySelector('.office-frame-info--family[open]').getBoundingClientRect();
    return { photo, caption: { left: caption.left, right: caption.right, top: caption.top, bottom: caption.bottom },
      front: s.camera.position.clone().sub(center).normalize().dot(front), center: center.toArray(), camera: s.camera.position.toArray(),
      inView: photo.left >= 0 && photo.right <= innerWidth && photo.top >= 0 && photo.bottom <= innerHeight
        && corners.every(point => point.z > -1 && point.z < 1), width: innerWidth, height: innerHeight,
      reading: document.querySelector('.studio').dataset.reading };
  });
  results.push({ scenario, ...state });
  await page.screenshot({ path: join(evidence, `${label}-${scenario}.png`) });
  assert.equal(state.reading, 'family');
  assert.equal(state.inView, true, `${label}: entire photograph remains in view`);
  assert.ok(state.front > .97, `${label}: camera faces the photograph`);
  const p = state.photo, c = state.caption;
  assert.ok(c.left >= 0 && c.right <= state.width && c.top >= 0 && c.bottom <= state.height, `${label}: caption fits viewport`);
  assert.ok(c.left >= p.right || c.right <= p.left || c.top >= p.bottom || c.bottom <= p.top, `${label}: caption does not cover photograph`);
}

try {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 390, height: 844 }]) {
    const label = viewport.width < 760 ? 'mobile' : 'desktop';
    const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile: label === 'mobile', hasTouch: label === 'mobile' });
    await context.addInitScript(() => {
      const roots = new Set(), renderers = new Map(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers, supportsFiber: true,
        inject(value) { renderers.set(++renderer, value); return renderer; },
        onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.photoTestScene = () => {
        let result; const seen = new Set();
        function visit(fiber) {
          if (!fiber || seen.has(fiber) || result) return;
          seen.add(fiber); const value = fiber.memoizedProps?.value;
          const state = typeof value?.getState === 'function' ? value.getState() : null;
          if (state?.gl && state.scene && state.camera) { result = state; return; }
          visit(fiber.child); visit(fiber.sibling);
        }
        for (const root of roots) visit(root.current);
        return result;
      };
    });
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error(`${label}: ${error.message}`); });
    await page.goto(base, { waitUntil: 'domcontentloaded' });
    console.log(`${label}: page loaded`);
    await page.waitForFunction(() => window.photoTestScene()?.gl
      || performance.getEntriesByType('resource').some(entry => entry.name.includes('/@react-three_fiber.js?')), null, { timeout: 90000 });
    await page.evaluate(async () => {
      if (window.photoTestScene()?.gl) return;
      const url = performance.getEntriesByType('resource').map(entry => entry.name).find(name => name.includes('/@react-three_fiber.js?'));
      if (url) {
        const fiber = await import(url);
        window.photoTestScene = () => [...fiber._roots.values()][0]?.store.getState();
      }
    });
    await page.waitForFunction(() => window.photoTestScene()?.scene.getObjectByName('Exhibit family'), null, { timeout: 90000 });
    console.log(`${label}: scene ready`);
    await page.waitForFunction(() => ['complete', 'reading'].includes(document.querySelector('.studio')?.dataset.entry), null, { timeout: 30000 });
    const close = page.getByRole('button', { name: 'Close and return to office', exact: true });
    if (await close.isVisible()) {
      await close.press('Enter');
      await close.waitFor({ state: 'detached' });
    }
    await settle(page);
    await page.screenshot({ path: join(evidence, `${label}-overview.png`) });
    results.push({ scenario: `${label} physical click`, point: await clickPhoto(page) });
    await inspect(page, 'focused', label);
    await page.getByRole('button', { name: 'Close photo frame', exact: true }).click();
    await page.locator('.office-frame-info--family[open]').waitFor({ state: 'detached' });
    await settle(page);
    results.push({ scenario: `${label} physical reopen`, point: await clickPhoto(page) });
    await inspect(page, 'reopened', label);
    if (label === 'desktop') {
      await page.getByRole('button', { name: 'Close photo frame', exact: true }).click();
      await settle(page);
      await page.getByRole('button', { name: 'Arrange furniture', exact: true }).click();
      await page.getByRole('button', { name: 'Move left', exact: true }).click();
      await page.getByRole('button', { name: 'Rotate furniture', exact: true }).click();
      await page.getByRole('button', { name: 'Done', exact: true }).click();
      await settle(page);
      results.push({ scenario: 'arranged desk physical click', point: await clickPhoto(page) });
      await inspect(page, 'arranged', label);
    }
    assert.deepEqual(errors, [], `${label}: no browser exceptions`);
    results.push({ scenario: `${label} browser errors`, errors });
    await context.close();
  }
  console.log('PASS desktop/mobile physical family photo click, front-facing camera, caption fit, close/reopen, and arranged desk');
} catch (error) {
  results.push({ failure: error.stack });
  throw error;
} finally {
  await writeFile(join(evidence, 'results.json'), JSON.stringify(results, null, 2));
  await browser.close(); await preview?.close();
}
