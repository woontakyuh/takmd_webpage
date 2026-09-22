import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/office-visibility');
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(resolve('dist'));
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
let releaseModel = () => {};
try {
  for (const profile of [
    { name: 'desktop', width: 1440, height: 1000, idle: 'busy', held: '**/models/fender/stratocaster-sunburst.glb*' },
    { name: 'tablet', width: 768, height: 1024, idle: 'normal', held: '**/models/personal-awards/cgbio-2026/certificate.webp*' },
    { name: 'phone', width: 375, height: 812, idle: 'unavailable', held: '**/models/spine.glb*' },
  ].filter(profile => !process.env.VISIBILITY_PROFILE || profile.name === process.env.VISIBILITY_PROFILE)) {
    const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, hasTouch: profile.name !== 'desktop', isMobile: profile.name === 'phone' });
    await context.addInitScript(idle => {
      if (idle === 'busy') {
        window.requestIdleCallback = (callback, options) => setTimeout(() => callback({ didTimeout: true, timeRemaining: () => 0 }), options?.timeout ?? 300000);
        window.cancelIdleCallback = clearTimeout;
      } else if (idle === 'unavailable') {
        window.requestIdleCallback = undefined;
        window.cancelIdleCallback = undefined;
      }
      const roots = new Set(); let renderer = 0;
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer, onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
      window.officeTestScene = () => {
        let result; const seen = new Set();
        function visit(fiber) {
          if (!fiber || seen.has(fiber) || result) return;
          seen.add(fiber);
          const value = fiber.memoizedProps?.value, state = typeof value?.getState === 'function' ? value.getState() : null;
          if (state?.gl && state.scene && state.camera) { result = state; return; }
          visit(fiber.child); visit(fiber.sibling);
        }
        for (const root of roots) visit(root.current);
        return result;
      };
      const initialObjects = [
        'Fender Stratocaster sunburst licensed mesh', 'Fender 65 Deluxe Reverb amplifier',
        'Hanging physician coat', 'Hanging Control gi', 'Bing 9ft6 surfboard',
        'Reference pale-pink plush pig', 'Personal painting above the garment rack',
        'CGBIO standing bifold certificate', 'Framed academic credentials',
        'Additional photographed honors', 'Magnetic whisky lecture card',
        'Anatomical spine specimen', 'Award photo interaction',
      ];
      const observeArrival = () => {
        if (window.officeTestArrival || !document.querySelector('.office-poster[data-ready="true"]')) return;
        const scene = window.officeTestScene()?.scene;
        const objects = initialObjects.map(name => {
          let meshes = 0;
          scene?.getObjectByName(name)?.traverse(object => {
            if (!object.isMesh) return;
            for (let node = object; node; node = node.parent) if (!node.visible) return;
            meshes += 1;
          });
          return { name, meshes };
        });
        let albumCases = 0, bookSpines = 0;
        scene?.traverse(object => {
          if (object.name.startsWith('Album case ')) albumCases += 1;
          if (object.name.startsWith('book-spine-')) bookSpines += 1;
        });
        window.officeTestArrival = { objects, albumCases, bookSpines, at: performance.now() };
      };
      new MutationObserver(observeArrival).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-ready'] });
    }, profile.idle);
    const page = await context.newPage(), errors = [], failures = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.status() >= 400) failures.push(`${response.status()} ${response.url()}`); });
    {
      const heldModel = new Promise(resolve => { releaseModel = resolve; });
      await page.route(profile.held, async route => {
        await heldModel;
        await route.continue();
      });
    }
    await page.goto(process.env.OFFICE_TEST_URL ?? preview.origin, { waitUntil: 'domcontentloaded' });
    {
      await page.waitForTimeout(6000);
      const held = await page.locator('.office-poster').getAttribute('data-ready');
      await page.screenshot({ path: join(evidence, `${profile.name}-held-loading.png`) });
      assert.equal(held, 'false', 'the loading poster must remain while an initially visible model is still downloading');
      releaseModel();
    }
    await page.waitForFunction(() => window.officeTestArrival, null, { timeout: 120000 });
    const arrival = await page.evaluate(() => window.officeTestArrival);
    assert.deepEqual(arrival.objects.filter(object => object.meshes === 0), [], 'every initially visible object is present at the first ready signal');
    assert.equal(arrival.albumCases, 10, 'all ten physical CD cases are present at arrival');
    assert.equal(arrival.bookSpines, 8, 'all eight book spines are present at arrival');
    results.push({ profile: profile.name, state: 'first-ready', ...arrival });
    await page.screenshot({ path: join(evidence, `${profile.name}-first-ready.png`) });
    await page.waitForFunction(() => window.officeTestScene()?.controls && document.querySelector('#office-music-control button'), null, { timeout: 120000 });
    const close = page.getByRole('button', { name: 'Close and return to office', exact: true });
    if (await close.isVisible()) await close.click();
    await page.waitForTimeout(4000);
    const unsafeGuitarTextures = await page.evaluate(() => {
      const s = window.officeTestScene(), unsafe = [];
      s.scene.getObjectByName('Fender Stratocaster sunburst licensed mesh').traverse(object => {
        if (!object.isMesh) return;
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          for (const key of ['map', 'normalMap', 'roughnessMap', 'metalnessMap']) {
            const image = material[key]?.image;
            if (image instanceof ImageBitmap && Math.max(image.width, image.height) > s.gl.capabilities.maxTextureSize) unsafe.push(`${material.name}.${key}`);
          }
        }
      });
      return unsafe;
    });
    assert.deepEqual(unsafeGuitarTextures, [], 'guitar atlases must be sized before upload; resizing ImageBitmap in Three can inherit a flipped upload state');
    async function capture(state) {
      const rendered = await page.evaluate(() => {
        const s = window.officeTestScene();
        function visible(object) { for (let node = object; node; node = node.parent) if (!node.visible) return false; return true; }
        const walls = [], music = {};
        s.scene.traverse(object => { if (object.name === 'Warm continuous plaster wall') walls.push({ visible: visible(object), parentVisible: object.parent.visible }); });
        for (const name of ['Fender Stratocaster sunburst licensed mesh', 'Fender 65 Deluxe Reverb amplifier']) {
          const object = s.scene.getObjectByName(name); let meshes = 0;
          object?.traverse(child => { if (child.isMesh && visible(child)) meshes += 1; });
          music[name] = meshes;
        }
        return { camera: s.camera.position.toArray(), walls, music, mergeSweeps: s.scene.userData.staticMerge?.sweeps, drawCalls: s.gl.info.render.calls };
      });
      assert.equal(rendered.walls.length, 5, 'all five physical wall segments are present');
      assert.ok(Object.values(rendered.music).every(count => count > 0), 'guitar and amplifier contain visible rendered meshes');
      assert.ok(rendered.mergeSweeps > 0, 'visibility is checked after static batching has run');
      assert.ok(rendered.walls.every(wall => wall.visible === wall.parentVisible), 'wall surfaces follow their cutaway parent instead of being hoisted into the scene');
      await page.screenshot({ path: join(evidence, `${profile.name}-${state}.png`) });
      results.push({ profile: profile.name, state, ...rendered });
      return rendered;
    }
    await capture('overview');
    await page.getByRole('button', { name: 'Liquor & Music', exact: true }).click();
    await page.waitForTimeout(3000);
    await capture('music');
    const guitar = page.getByRole('button', { name: 'Approach Fender Stratocaster', exact: true });
    await guitar.focus(); await guitar.press('Enter');
    await page.getByRole('button', { name: 'Close music corner', exact: true }).waitFor();
    await page.waitForTimeout(2500);
    await capture('guitar-inspection');
    await page.getByRole('button', { name: 'Close music corner', exact: true }).click();
    await page.getByRole('button', { name: 'Return to the overview', exact: true }).click();
    await page.waitForTimeout(2500);
    await page.mouse.move(profile.width * .5, profile.height * .45);
    await page.mouse.down(); await page.mouse.move(profile.width * .8, profile.height * .45, { steps: 30 }); await page.mouse.up();
    await page.waitForTimeout(2000);
    await capture('drag-orbit');
    for (const [name, position, visibleWalls] of [
      ['outside-back', [5, 5, 9], 4], ['outside-left', [-9, 5, -6], 1], ['inside', [1, 2, -2], 5],
    ]) {
      await page.evaluate(position => {
        const s = window.officeTestScene();
        s.controls.enableDamping = false;
        s.camera.position.set(...position); s.controls.target.set(0, 1.4, 0); s.controls.update();
      }, position);
      await page.waitForTimeout(2500);
      const frame = await capture(name);
      assert.equal(frame.walls.filter(wall => wall.visible).length, visibleWalls, `${name}: only room-facing walls remain visible`);
    }
    assert.deepEqual(errors, [], 'no browser exceptions');
    assert.deepEqual(failures, [], 'no failed asset responses');
    console.log(`PASS ${profile.name}: ${profile.idle} idle scheduling; complete first arrival, guitar, amp, guide, inspection, drag and both cutaway walls.`);
    await context.close();
  }
} finally {
  releaseModel();
  await writeFile(join(evidence, 'visibility-results.json'), JSON.stringify(results, null, 2));
  await browser.close();
  await preview?.close();
}
