import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { webkit } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:4397/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/safari-cabinet-warmup';
await mkdir(evidence, { recursive: true });
const browser = await webkit.launch({ headless: true,
  ...(process.env.WEBKIT_EXECUTABLE_PATH ? { executablePath: process.env.WEBKIT_EXECUTABLE_PATH } : {}) });
const result = { errors: [], consoleErrors: [], contextLoss: [] };
try {
  const context = await browser.newContext({ viewport: { width: 420, height: 912 }, deviceScaleFactor: 3,
    isMobile: true, hasTouch: true, reducedMotion: 'no-preference' });
  const page = await context.newPage();
  if (process.env.SAFARI_WARMUP_BASELINE === '1') {
    await page.route(/\/src\/components\/studio\/scene\/WhiskyCabinet\.tsx(?:\?|$)/, async route => {
      const response = await route.fetch();
      const source = await response.text();
      const current = /try \{\s*gl\.compile\((?:root|materials), camera, scene\);\s*\} finally \{\s*groups\.forEach\(\(group, index\) => \{\s*if \(group\) group\.visible = shown\[index\];\s*\}\);\s*\}/;
      assert(current.test(source), 'Baseline fixture requires the local development module');
      result.baselineApplied = true;
      await route.fulfill({ response, body: source.replace(current,
        'void gl.compileAsync(scene, camera).finally(() => groups.forEach((group, index) => { if (group) group.visible = shown[index]; }));') });
    });
  }
  page.on('pageerror', error => result.errors.push(error.stack));
  page.on('console', message => { if (message.type() === 'error') result.consoleErrors.push(message.text()); });
  await page.addInitScript(() => {
    const roots = new Set();
    let renderer = 0;
    const renderers = new Map();
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { renderers, supportsFiber: true, inject: value => { renderers.set(++renderer, value); return renderer; },
      onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
    window.cabinetTestScene = () => {
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
    window.cabinetContextLoss = [];
    document.addEventListener('webglcontextlost', event => window.cabinetContextLoss.push(event.statusMessage), true);
    window.cabinetWarmupCallbacks = [];
    const observeWarmup = callback => (...args) => {
      const state = window.cabinetTestScene();
      if (!state) return callback(...args);
      const names = ['Enclosed Isidoro barware', 'complete seven-bottle whisky and Armagnac collection'];
      const visibility = () => names.map(name => state.scene.getObjectByName(name)?.visible);
      const before = visibility();
      const compile = state.gl.compile;
      const targets = [];
      state.gl.compile = function (root, ...args) { targets.push(root.name); return compile.call(this, root, ...args); };
      try { callback(...args); }
      finally {
        state.gl.compile = compile;
        if (targets.length) window.cabinetWarmupCallbacks.push({ targets, before, after: visibility() });
      }
    };
    if (window.requestIdleCallback) {
      const idle = window.requestIdleCallback.bind(window);
      window.requestIdleCallback = (callback, options) => idle(observeWarmup(callback), options);
    } else {
      const timeout = window.setTimeout.bind(window);
      window.setTimeout = (callback, delay, ...args) => timeout(
        typeof callback === 'function' && delay === 1500 ? observeWarmup(callback) : callback, delay, ...args);
    }
  });
  const started = Date.now();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.locator('.studio[data-room-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
  result.roomReadyMs = Date.now() - started;
  result.pixelRatio = await page.evaluate(() => window.cabinetTestScene().gl.getPixelRatio());
  assert.equal(result.pixelRatio, 1, 'WebKit must retain a stable whole-pixel drawing buffer');
  if (process.env.SAFARI_WARMUP_BASELINE === '1') assert(result.baselineApplied, 'Original warmup must be served by the baseline fixture');
  // Opening and closing the phone reader overlaps the cabinet's idle shader warmup.
  await page.getByRole('link', { name: 'Living CV', exact: true }).click();
  const reader = page.locator('.loading-monitor-reader .monitor-screen-content');
  await reader.waitFor();
  await reader.evaluate(element => element.scrollTo({ top: 400, behavior: 'instant' }));
  result.cvScroll = await reader.evaluate(element => element.scrollTop);
  assert.equal(result.cvScroll, 400);
  await page.screenshot({ path: `${evidence}/cv.png` });
  await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
  await reader.waitFor({ state: 'hidden' });
  // Let deferred idle work and asynchronous shader-readiness polling run to completion.
  await page.waitForTimeout(3000);
  result.warmupCallbacks = await page.evaluate(() => window.cabinetWarmupCallbacks);
  assert(result.warmupCallbacks.length > 0, 'The fixture must exercise the actual idle shader warmup');
  for (const callback of result.warmupCallbacks) {
    assert.deepEqual(callback.after, callback.before, 'Idle warmup must restore hidden interiors before yielding to rendering');
  }
  result.closedInterior = await page.evaluate(() => {
    const scene = window.cabinetTestScene().scene;
    return ['Enclosed Isidoro barware', 'complete seven-bottle whisky and Armagnac collection']
      .map(name => ({ name, visible: scene.getObjectByName(name)?.visible }));
  });
  assert(result.closedInterior.every(group => group.visible === false), 'Warmup must restore the closed interior');
  result.closedCabinetLights = await page.evaluate(() => {
    const cabinet = window.cabinetTestScene().scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet');
    const lights = [];
    cabinet.traverseVisible(object => { if (object.isRectAreaLight) lights.push(object.intensity); });
    return lights;
  });
  assert.equal(result.closedCabinetLights.length, 4, 'Closed cabinet lights must stay registered to avoid room-wide shader recompilation on first open');
  assert(result.closedCabinetLights.every(intensity => intensity === 0), 'Closed cabinet lights must be off');
  await page.getByRole('button', { name: 'View Isidoro drinks cabinet', exact: true }).press('Enter');
  await page.getByRole('button', { name: 'Open Isidoro drinks cabinet', exact: true }).waitFor();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Open Isidoro drinks cabinet', exact: true }).press('Enter');
  await page.waitForFunction(() => window.cabinetTestScene()?.scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet')?.userData.open === true);
  await page.waitForTimeout(2000);
  result.openInterior = await page.evaluate(() => {
    const scene = window.cabinetTestScene().scene;
    return ['Enclosed Isidoro barware', 'complete seven-bottle whisky and Armagnac collection']
      .map(name => ({ name, visible: scene.getObjectByName(name)?.visible }));
  });
  assert(result.openInterior.every(group => group.visible === true), 'Opening still reveals bottles and barware');
  await page.screenshot({ path: `${evidence}/cabinet-open.png` });
  result.contextLoss = await page.evaluate(() => window.cabinetContextLoss);
  assert.deepEqual(result.errors, [], 'Idle cabinet warmup and reader return must not produce browser errors');
  assert.deepEqual(result.consoleErrors, [], 'The cabinet must not produce renderer errors');
  assert.deepEqual(result.contextLoss, [], 'The context must survive reader return and cabinet opening');
  result.passed = true;
} catch (error) {
  result.failure = error.stack;
  throw error;
} finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify(result, null, 2));
  await browser.close();
}
console.log('PASS WebKit phone reader return, idle warmup, and cabinet opening');
