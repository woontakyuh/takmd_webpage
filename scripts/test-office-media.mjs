import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const build = resolve(process.env.MEDIA_DIST_DIR ?? 'dist');
const evidence = resolve(process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/release-readiness-2026-09-22/media');
await mkdir(evidence, { recursive: true });
const preview = process.env.OFFICE_TEST_URL ? null : await startPublicPreview(build);
const base = process.env.OFFICE_TEST_URL ?? preview.origin;
const log = [];
const pressAccessible = async locator => { await locator.focus(); await locator.press('Enter'); };
async function clickProjectedGroup(page, name, local = [0, 0, .0056]) {
  const point = await page.evaluate(({ targetName, localPoint }) => {
    const state = window.officeTestScene(), target = state.scene.getObjectByName(targetName);
    const center = target.position.clone().set(...localPoint);
    target.localToWorld(center).project(state.camera);
    const x = (center.x + 1) * innerWidth / 2, y = (1 - center.y) * innerHeight / 2;
    state.raycaster.setFromCamera(state.pointer.clone().set(center.x, center.y), state.camera);
    const hit = state.raycaster.intersectObjects(state.scene.children, true).find(item => {
      for (let object = item.object; object; object = object.parent) if (!object.visible) return false;
      return true;
    });
    let targetHit = false;
    for (let object = hit?.object; object; object = object.parent) if (object === target) targetHit = true;
    return { x, y, targetHit, canvas: document.elementFromPoint(x, y) === state.gl.domElement };
  }, { targetName: name, localPoint: local });
  assert.ok(point.canvas && point.targetHit, `${name} is exposed to a real canvas pointer: ${JSON.stringify(point)}`);
  await page.mouse.click(point.x, point.y);
  return point;
}
async function clickVisibleAlbumCase(page) {
  const point = await page.evaluate(() => {
    const state = window.officeTestScene(), targets = [];
    state.scene.traverse(object => { if (/^Album case \d+:/.test(object.name)) targets.push(object); });
    for (const target of targets) {
      const center = target.position.clone().set(0, 0, .0056);
      target.localToWorld(center).project(state.camera);
      const x = (center.x + 1) * innerWidth / 2, y = (1 - center.y) * innerHeight / 2;
      if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight) continue;
      state.raycaster.setFromCamera(state.pointer.clone().set(center.x, center.y), state.camera);
      const hit = state.raycaster.intersectObjects(state.scene.children, true).find(item => {
        for (let object = item.object; object; object = object.parent) if (!object.visible) return false;
        return true;
      });
      let exact = false;
      for (let object = hit?.object; object; object = object.parent) if (object === target) exact = true;
      if (exact && document.elementFromPoint(x, y) === state.gl.domElement) return { x, y, name: target.name };
    }
    return null;
  });
  assert.ok(point, 'at least one displayed physical CD case can be reached by a canvas pointer');
  await page.mouse.click(point.x, point.y);
  return point;
}
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  await context.addInitScript(() => {
    const roots = new Set();
    let renderer = 0;
    window.__officeAudioGains = [];
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer,
      onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
    const createGain = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function(...args) {
      const gain = createGain.apply(this, args);
      window.__officeAudioGains.push(gain);
      return gain;
    };
    window.officeTestScene = () => {
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
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  const cancelledAudio = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => {
    const url = new URL(request.url());
    const reason = request.failure()?.errorText;
    // Switching tracks cancels the previous audio and its speculative preload.
    if (reason === 'net::ERR_ABORTED' && url.origin === new URL(base).origin && url.pathname.startsWith('/audio/')) {
      cancelledAudio.push(url.pathname);
    } else failed.push(`${request.url()} ${reason}`);
  });
  page.on('response', response => {
    if (response.status() >= 400) failed.push(`${response.url()} HTTP ${response.status()}`);
  });
  const response = await page.goto(base, { waitUntil: 'domcontentloaded' });
  assert.equal(response?.status(), 200, 'built office responds successfully');
  await page.getByRole('button', { name: 'Inspect Beosound 9000 CD system', exact: true }).waitFor({ timeout: 90000 });
  await page.waitForFunction(() => window.officeTestScene()?.gl.domElement && document.querySelector('#office-music-control button'));
  await page.screenshot({ path: join(evidence, 'office-entry-reader.png'), fullPage: true });
  log.push(`Surface: Chromium desktop ${await page.evaluate(() => `${innerWidth}x${innerHeight}`)} at ${base}`);
  // The first view opens the monitor's CV reader. Dismiss it through its visible close control to reach the office.
  const readerClose = page.getByRole('button', { name: 'Close and return to office', exact: true });
  if (await readerClose.isVisible()) await readerClose.click();
  await page.getByRole('button', { name: 'Play music', exact: true }).waitFor({ timeout: 30000 });
  await page.screenshot({ path: join(evidence, 'office-desktop.png'), fullPage: true });

  // Start the default CD from the real player control, then record actual media progress.
  await page.getByRole('button', { name: 'Inspect Beosound 9000 CD system', exact: true }).click();
  await page.getByRole('group', { name: 'Beosound physical buttons' }).waitFor();
  await page.screenshot({ path: join(evidence, 'cd-system-focused.png'), fullPage: true });
  const controls = page.getByRole('group', { name: 'Beosound physical buttons' });
  await pressAccessible(controls.getByRole('button', { name: 'Play selected CD', exact: true }));
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return audio && !audio.paused && audio.currentTime > .3;
  }, null, { timeout: 60000 });
  const firstAudio = await page.evaluate(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return { src: new URL(audio.currentSrc).pathname, time: audio.currentTime, paused: audio.paused };
  });
  assert.equal(firstAudio.src, '/audio/two-ton-shoe-paper-bag.m4a');
  await page.screenshot({ path: join(evidence, 'cd-playing-before-swap.png'), fullPage: true });
  log.push(`CD playback started: ${JSON.stringify(firstAudio)}`);

  const albumHit = await clickVisibleAlbumCase(page);
  await page.getByRole('region', { name: 'CD collection' }).waitFor();
  const catalogBefore = await page.locator('button[data-cd-album]').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-cd-album')));
  assert.equal(catalogBefore.length, 10, 'all ten albums remain in the cover flow');
  const coverFlowPosition = page.locator('.cd-cover-flow-position');
  let albumIndex = Number((await coverFlowPosition.textContent())?.split('/')[0]?.trim());
  while (albumIndex !== 8) {
    const previousPosition = (await coverFlowPosition.textContent())?.trim();
    const next = albumIndex < 8;
    await page.getByRole('button', { name: next ? 'Next album' : 'Previous album', exact: true }).click();
    await page.waitForFunction(previous => document.querySelector('.cd-cover-flow-position')?.textContent?.trim() !== previous, previousPosition);
    albumIndex = Number((await coverFlowPosition.textContent())?.split('/')[0]?.trim());
  }
  await page.getByRole('button', { name: 'Browse Maroon 5 — Songs About Jane [Special Repackage]', exact: true }).waitFor();
  assert.equal((await coverFlowPosition.textContent())?.trim(), '08 / 10', 'the actual cover-flow controls reach catalog position 8');
  await page.screenshot({ path: join(evidence, 'cd-coverflow-browsed.png'), fullPage: true });
  await page.getByRole('button', { name: 'Place in player', exact: true }).click();
  await page.locator('button.cd-physical-slot[data-slot="1"]').waitFor({ state: 'visible', timeout: 15000 });
  const inventoryBefore = await page.locator('button.cd-physical-slot').evaluateAll(buttons => buttons.map(button => ({
    slot: Number(button.dataset.slot), label: button.getAttribute('aria-label'),
    contents: document.getElementById(button.getAttribute('aria-describedby'))?.textContent?.trim(),
  })));
  assert.equal(inventoryBefore.length, 6, 'physical picker exposes all six slots');
  assert.ok(inventoryBefore.every(slot => slot.contents), 'all initial slot contents are described');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await page.getByRole('button', { name: 'Place in player', exact: true }).click();
  await page.getByRole('button', { name: 'Place Songs About Jane [Special Repackage] in CD 2', exact: true }).click();
  await page.getByText('Changing disc…', { exact: true }).waitFor({ timeout: 10000 });
  const duringExchange = await page.evaluate(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return { src: new URL(audio.currentSrc).pathname, time: audio.currentTime, paused: audio.paused };
  });
  assert.equal(duringExchange.src, firstAudio.src, 'the current physical CD keeps its audio source during an unrelated exchange');
  assert.equal(duringExchange.paused, false, 'the current CD keeps playing through the physical exchange');
  await page.getByText('Changing disc…', { exact: true }).waitFor({ state: 'detached', timeout: 60000 });
  await page.screenshot({ path: join(evidence, 'cd-exchange-settled.png'), fullPage: true });
  log.push(`Exchange while CD 1 was playing: ${JSON.stringify(duringExchange)}`);

  // Check that slot 2 changed, the displaced unmounted album was not silently added to another slot, and all others stay fixed.
  await page.getByRole('button', { name: 'Move disc', exact: true }).click();
  await page.locator('button.cd-physical-slot[data-slot="1"]').waitFor({ state: 'visible', timeout: 15000 });
  const inventoryAfter = await page.locator('button.cd-physical-slot').evaluateAll(buttons => buttons.map(button => ({
    slot: Number(button.dataset.slot), label: button.getAttribute('aria-label'),
    contents: document.getElementById(button.getAttribute('aria-describedby'))?.textContent?.trim(),
  })));
  const contentsBefore = inventoryBefore.map(slot => slot.contents);
  const contentsAfter = inventoryAfter.map(slot => slot.contents);
  assert.match(contentsAfter[1] ?? '', /CD 2Maroon 5 · Songs About Jane \[Special Repackage\]/, 'the selected album occupies CD 2');
  const sourceSlot = inventoryBefore.findIndex(slot => /Maroon 5 · Songs About Jane/.test(slot.contents ?? ''));
  for (const index of inventoryBefore.map((_slot, index) => index)) {
    if (index === 1) continue;
    if (index === sourceSlot) assert.match(contentsAfter[index] ?? '', new RegExp(`CD ${index + 1}Empty slot`), 'the prior album source becomes empty');
    else assert.equal(contentsAfter[index], contentsBefore[index], `unrelated CD ${index + 1} retains its exact album position`);
  }
  const catalogAfter = await page.locator('button[data-cd-album]').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-cd-album')));
  assert.deepEqual(catalogAfter, catalogBefore, 'physical placement does not reorder the cover-flow catalog');
  await page.screenshot({ path: join(evidence, 'cd-slot-order-after-swap.png'), fullPage: true });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Close CD collection', exact: true }).click();
  await page.getByRole('region', { name: 'CD collection' }).waitFor({ state: 'detached' });
  log.push(`Physical slot contents before: ${JSON.stringify(inventoryBefore.map(slot => slot.contents))}`);
  log.push(`Physical slot contents after: ${JSON.stringify(inventoryAfter.map(slot => slot.contents))}`);
  log.push(`Cover-flow album IDs before/after swap: ${JSON.stringify(catalogBefore)} / ${JSON.stringify(catalogAfter)}; physical CD case pointer ${JSON.stringify(albumHit)}`);

  // Real player controls select the moved CD, advance an available track, and pause/resume its media element.
  await pressAccessible(controls.getByRole('button', { name: 'Select CD 2', exact: true }));
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return audio && !audio.paused && audio.currentTime > .2 && new URL(audio.currentSrc).pathname === '/audio/collection/album-08-track-01.m4a';
  }, null, { timeout: 60000 });
  const movedTrack = await page.evaluate(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return { src: new URL(audio.currentSrc).pathname, time: audio.currentTime, paused: audio.paused };
  });
  await pressAccessible(controls.getByRole('button', { name: 'Next track', exact: true }));
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return audio && !audio.paused && audio.currentTime > .2 && new URL(audio.currentSrc).pathname === '/audio/collection/album-08-track-02.m4a';
  }, null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    const gains = window.__officeAudioGains.map(gain => gain.gain.value);
    return audio && !audio.paused && gains.some(gain => gain > .35);
  }, null, { timeout: 30000 });
  const nextTrack = await page.evaluate(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return { src: new URL(audio.currentSrc).pathname, time: audio.currentTime, paused: audio.paused };
  });
  const gainsBefore = await page.evaluate(() => window.__officeAudioGains.map(gain => gain.gain.value));
  const volumeBefore = Math.round(Math.max(...gainsBefore) * 90);
  let settledGain = Math.max(...gainsBefore);
  for (let step = 0; step < 2; step++) {
    const previousGain = settledGain;
    await pressAccessible(controls.getByRole('button', { name: 'Increase volume', exact: true }));
    await page.waitForFunction(previous => Math.max(...window.__officeAudioGains.map(gain => gain.gain.value)) > previous + .005, previousGain, { timeout: 5000 });
    settledGain = await page.evaluate(() => Math.max(...window.__officeAudioGains.map(gain => gain.gain.value)));
  }
  const gains = await page.evaluate(() => window.__officeAudioGains.map(gain => gain.gain.value));
  const volumeAfter = Math.round(Math.max(...gains) * 90);
  assert.equal(volumeAfter, volumeBefore + 2, 'the two physical volume-key presses raise Web Audio gain by two steps');
  assert.ok(gains.some(value => Math.abs(value - volumeAfter / 90) < .002), `an active Web Audio gain follows the physical control (${gains.join(', ')})`);
  await page.screenshot({ path: join(evidence, 'cd-volume-raised.png'), fullPage: true });
  await pressAccessible(controls.getByRole('button', { name: 'Pause CD', exact: true }));
  await page.waitForFunction(() => document.querySelector('audio[data-active="true"]')?.paused === true);
  const pausedAt = await page.evaluate(() => document.querySelector('audio[data-active="true"]')?.currentTime ?? -1);
  await page.waitForTimeout(750);
  const heldAt = await page.evaluate(() => document.querySelector('audio[data-active="true"]')?.currentTime ?? -1);
  assert.ok(Math.abs(heldAt - pausedAt) < .015, 'paused playback time remains stationary');
  await pressAccessible(controls.getByRole('button', { name: 'Play selected CD', exact: true }));
  await page.waitForFunction(previous => {
    const audio = document.querySelector('audio[data-active="true"]');
    return audio && !audio.paused && audio.currentTime > previous + .2;
  }, pausedAt, { timeout: 30000 });
  log.push(`Moved disc playback: ${JSON.stringify(movedTrack)}; next track: ${JSON.stringify(nextTrack)}`);
  log.push(`Volume ${volumeBefore} → ${volumeAfter}; Web Audio gains: ${JSON.stringify(gains)}`);
  log.push(`Pause held media at ${pausedAt.toFixed(3)}s → ${heldAt.toFixed(3)}s; resume advanced it.`);

  // Cabinet approach/open and bottle selection use the visible 3D objects and real canvas pointer clicks.
  await page.getByRole('button', { name: 'Return from Beosound 9000', exact: true }).click();
  await page.screenshot({ path: join(evidence, 'office-after-cd-return.png'), fullPage: true });
  await page.waitForFunction(() => window.officeTestScene()?.scene.getObjectByName('Bang & Olufsen Beosound 9000')?.userData.active === false, null, { timeout: 10000 });
  await page.getByRole('button', { name: 'Return to the overview', exact: true }).click();
  await page.evaluate(() => { window.officeLastCamera = null; window.officeStableCameraFrames = 0; });
  await page.waitForFunction(() => {
    const position = window.officeTestScene()?.camera.position.toArray();
    if (!position) return false;
    const previous = window.officeLastCamera;
    window.officeLastCamera = position;
    if (!previous || Math.hypot(position[0] - previous[0], position[1] - previous[1], position[2] - previous[2]) > .001) {
      window.officeStableCameraFrames = 0; return false;
    }
    return ++window.officeStableCameraFrames >= 5;
  }, null, { timeout: 15000 });
  await page.screenshot({ path: join(evidence, 'office-overview-before-cabinet.png'), fullPage: true });
  await page.getByRole('button', { name: 'Liquor & Music', exact: true }).click();
  await page.evaluate(() => { window.officeLastCamera = null; window.officeStableCameraFrames = 0; });
  await page.waitForFunction(() => {
    const position = window.officeTestScene()?.camera.position.toArray();
    if (!position) return false;
    const previous = window.officeLastCamera;
    window.officeLastCamera = position;
    if (!previous || Math.hypot(position[0] - previous[0], position[1] - previous[1], position[2] - previous[2]) > .001) {
      window.officeStableCameraFrames = 0; return false;
    }
    return ++window.officeStableCameraFrames >= 5;
  }, null, { timeout: 15000 });
  await page.screenshot({ path: join(evidence, 'office-overview-before-cabinet.png'), fullPage: true });
  const cabinetButton = page.locator('button.office-secret-trigger').filter({ hasText: 'Isidoro drinks cabinet' });
  await cabinetButton.waitFor({ state: 'attached', timeout: 10000 });
  const cabinetPoint = await clickProjectedGroup(page, 'Poltrona Frau Isidoro drinks cabinet');
  await page.waitForFunction(() => window.officeTestScene()?.scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet')?.userData.open === true, null, { timeout: 15000 });
  await page.waitForFunction(() => {
    const scene = window.officeTestScene()?.scene;
    const cabinet = scene?.getObjectByName('Poltrona Frau Isidoro drinks cabinet');
    const parent = scene?.getObjectByName('complete seven-bottle whisky and Armagnac collection');
    const group = scene?.getObjectByName('favorite-whisky-collection');
    return cabinet?.userData.open === true && parent?.visible && group?.visible && group.children.length === 7 && group.children.every(bottle => bottle.visible);
  }, null, { timeout: 60000 });
  await page.waitForFunction(() => {
    const scene = window.officeTestScene()?.scene;
    const leaf = scene?.getObjectByName('Isidoro book-opening mobile half');
    const worktop = scene?.getObjectByName('fold-down Canaletto walnut worktop');
    return leaf && worktop && Math.abs(leaf.rotation.y - leaf.userData.angle) < .001 &&
      Math.abs(worktop.rotation.x - worktop.userData.angle) < .001;
  }, null, { timeout: 15000 });
  await page.evaluate(() => { window.officeLastCamera = null; window.officeStableCameraFrames = 0; });
  await page.waitForFunction(() => {
    const position = window.officeTestScene()?.camera.position.toArray();
    if (!position) return false;
    const previous = window.officeLastCamera;
    window.officeLastCamera = position;
    if (!previous || Math.hypot(position[0] - previous[0], position[1] - previous[1], position[2] - previous[2]) > .001) {
      window.officeStableCameraFrames = 0; return false;
    }
    return ++window.officeStableCameraFrames >= 5;
  }, null, { timeout: 15000 });
  const bottles = await page.evaluate(() => {
    const scene = window.officeTestScene().scene;
    const group = scene.getObjectByName('favorite-whisky-collection');
    return group.children.map(bottle => bottle.name);
  });
  assert.equal(bottles.length, 7);
  await page.screenshot({ path: join(evidence, 'whisky-cabinet-open.png'), fullPage: true });
  const bottlePoint = await page.evaluate(() => {
    const state = window.officeTestScene(), group = state.scene.getObjectByName('favorite-whisky-collection');
    state.scene.updateMatrixWorld(true);
    const candidates = [];
    const diagnostics = [];
    let selectedPoint;
    for (const bottle of group.children) {
      let meshes = 0, onscreen = 0;
      bottle.traverse(mesh => {
        if (selectedPoint || !mesh.isMesh || !mesh.geometry) return;
        meshes++;
        if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox();
        const box = mesh.geometry.boundingBox;
        if (!box) return;
        for (const fx of [.2, .5, .8]) for (const fy of [.2, .5, .8]) for (const fz of [.2, .5, .8]) {
          const point = mesh.position.clone().set(box.min.x + (box.max.x - box.min.x) * fx,
            box.min.y + (box.max.y - box.min.y) * fy, box.min.z + (box.max.z - box.min.z) * fz);
          mesh.localToWorld(point);
          const projected = point.clone().project(state.camera);
          const x = (projected.x + 1) * innerWidth / 2, y = (1 - projected.y) * innerHeight / 2;
          if (x < 0 || y < 0 || x >= innerWidth || y >= innerHeight || projected.z > 1) continue;
          onscreen++;
          state.raycaster.setFromCamera(state.pointer.clone().set(projected.x, projected.y), state.camera);
          const hit = state.raycaster.intersectObjects(state.scene.children, true).find(item => {
            for (let object = item.object; object; object = object.parent) if (!object.visible) return false;
            return true;
          });
          for (let object = hit?.object; object; object = object.parent) if (object === bottle) {
            if (document.elementFromPoint(x, y) === state.gl.domElement) {
              selectedPoint = { x, y, hitBottle: true, canvas: true, mesh: mesh.name, bottle: bottle.name };
              return;
            }
            candidates.push({ x, y, hitBottle: false, mesh: mesh.name, overlay: document.elementFromPoint(x, y)?.tagName });
            break;
          }
        }
      });
      if (selectedPoint) return selectedPoint;
      diagnostics.push({ bottle: bottle.name, meshes, onscreen });
    }
    return { hitBottle: false, candidates: candidates.slice(0, 4), diagnostics };
  });
  assert.ok(bottlePoint.canvas && bottlePoint.hitBottle, `targeted bottle is exposed to the canvas ray: ${JSON.stringify(bottlePoint)}`);
  await page.mouse.click(bottlePoint.x, bottlePoint.y);
  await page.getByRole('button', { name: 'Return bottle to cabinet', exact: true }).waitFor({ timeout: 30000 });
  await page.waitForFunction(name => {
    const bottle = window.officeTestScene()?.scene.getObjectByName(name);
    return bottle?.userData.selected && (bottle.userData.presentationProgress ?? 0) > .95;
  }, bottlePoint.bottle, { timeout: 30000 });
  await page.screenshot({ path: join(evidence, 'whisky-bottle-presented.png'), fullPage: true });
  await page.getByRole('button', { name: 'Return bottle to cabinet', exact: true }).click();
  await page.waitForFunction(name => {
    const scene = window.officeTestScene()?.scene;
    const bottle = scene?.getObjectByName(name);
    const cabinet = scene?.getObjectByName('Poltrona Frau Isidoro drinks cabinet');
    return !bottle?.userData.selected && (bottle?.userData.presentationProgress ?? 0) === 0 && cabinet?.userData.open === true;
  }, bottlePoint.bottle, { timeout: 30000 });
  await page.screenshot({ path: join(evidence, 'whisky-bottle-returned.png'), fullPage: true });
  log.push(`Opened cabinet with ${bottles.length} loaded bottle objects: ${JSON.stringify(bottles)}`);
  log.push(`Canvas click opened cabinet at ${JSON.stringify(cabinetPoint)}; click projected onto ${bottlePoint.bottle}: ${JSON.stringify(bottlePoint)}; bottle presented and returned to its open cabinet.`);
  const activeAudio = await page.evaluate(() => {
    const audio = document.querySelector('audio[data-active="true"]');
    return audio && { time: audio.currentTime, paused: audio.paused, error: audio.error?.message ?? null };
  });
  assert.ok(activeAudio && !activeAudio.paused && activeAudio.time > 1 && activeAudio.error === null, 'audio keeps playing during the cabinet journey');
  log.push(`Track changes cancelled ${cancelledAudio.length} superseded audio requests; active audio remains healthy: ${JSON.stringify(activeAudio)}`);
  assert.deepEqual(errors, [], `uncaught browser exceptions: ${errors.join('; ')}`);
  assert.deepEqual(failed, [], `failed browser requests: ${failed.join('; ')}`);
  log.push('Browser errors: none. Failed resource requests: none. URL remained on the same page throughout.');
  await writeFile(join(evidence, 'run.log'), `${log.join('\n')}\n`, 'utf8');
  console.log(`PASS office media journey; evidence ${evidence}`);
  console.log(log.join('\n'));
  await context.close();
} catch (error) {
  await writeFile(join(evidence, 'run.log'), `${log.join('\n')}\nFAIL: ${error.stack ?? error}\n`, 'utf8');
  throw error;
} finally {
  await browser.close();
  await preview?.close();
}
