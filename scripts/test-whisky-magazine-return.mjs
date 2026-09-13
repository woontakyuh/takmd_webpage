import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';

const base = process.env.QA_URL;
if (!base) throw new Error('Set QA_URL to a running office preview.');
const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    const roots = new Set();
    let renderer = 0;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer,
      onCommitFiberRoot: (_id, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
    window.magazineTestScene = () => {
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
  await page.getByRole('button', { name: 'View Isidoro drinks cabinet', exact: true }).waitFor({ timeout: 60000 });
  await page.getByRole('button', { name: 'View Isidoro drinks cabinet', exact: true }).press('Enter');
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: 'Open Isidoro drinks cabinet', exact: true }).press('Enter');
  await page.waitForFunction(() => window.magazineTestScene()?.scene.getObjectByName('Liquor Journal on the Isidoro shelf'));
  await page.waitForTimeout(2000);
  const restZ = await page.evaluate(() => window.magazineTestScene().scene.getObjectByName('Liquor Journal on the Isidoro shelf').position.z);
  const point = await page.evaluate(() => {
    const state = window.magazineTestScene();
    const magazine = state.scene.getObjectByName('Liquor Journal on the Isidoro shelf');
    const center = magazine.position.clone().set(0, 0, .008);
    magazine.localToWorld(center).project(state.camera);
    return { x: (center.x + 1) * innerWidth / 2, y: (1 - center.y) * innerHeight / 2 };
  });
  await page.mouse.click(point.x, point.y);
  await page.waitForFunction(() => document.querySelector('button[aria-label="Next page"]')?.disabled === false);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Close A chapter behind the bar', exact: true }).click();
  await page.waitForTimeout(5000);
  const result = await page.evaluate(() => {
    const scene = window.magazineTestScene().scene;
    const magazine = scene.getObjectByName('Liquor Journal on the Isidoro shelf');
    return { active: magazine.userData.active, z: magazine.position.z,
      cabinetOpen: scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet').userData.open,
      caption: Boolean(document.querySelector('.room-archive-caption')) };
  });
  assert.equal(result.active, false, 'returning must release magazine inspection');
  assert.equal(result.caption, false, 'the magazine caption must stay dismissed after return');
  assert.equal(result.cabinetOpen, true, 'returning the magazine must leave the cabinet open');
  assert.ok(Math.abs(result.z - restZ) < .0001, 'the magazine must finish returning to its shelf');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(2000);
  await page.getByRole('button', { name: 'Read Liquor Journal', exact: true }).press('Enter');
  await page.waitForFunction(() => document.querySelector('button[aria-label="Next page"]')?.disabled === false);
  await page.getByRole('button', { name: 'Next page', exact: true }).click();
  await page.waitForTimeout(1500);
  const bottlePoint = await page.evaluate(() => {
    const state = window.magazineTestScene();
    const bottle = state.scene.getObjectByName('GlenDronach 18 Year Old 700 ml');
    const center = bottle.position.clone().set(0, .15, .008);
    bottle.localToWorld(center).project(state.camera);
    return { x: (center.x + 1) * innerWidth / 2, y: (1 - center.y) * innerHeight / 2 };
  });
  await page.mouse.click(bottlePoint.x, bottlePoint.y);
  const transfer = [];
  for (let sample = 0; sample < 45; sample++) {
    await page.waitForTimeout(120);
    transfer.push(await page.evaluate(() => {
      const scene = window.magazineTestScene().scene;
      return { magazineZ: scene.getObjectByName('Liquor Journal on the Isidoro shelf').position.z,
        selected: scene.getObjectByName('Poltrona Frau Isidoro drinks cabinet').userData.selectedBottle,
        bottleProgress: scene.getObjectByName('GlenDronach 18 Year Old 700 ml').userData.presentationProgress ?? 0 };
    }));
  }
  assert.ok(transfer.some(sample => sample.selected), 'a visible bottle click must leave magazine inspection');
  assert.ok(transfer.every(sample => sample.bottleProgress === 0 || Math.abs(sample.magazineZ - restZ) < .0001),
    'the bottle must wait until the magazine has returned');
  assert.deepEqual(errors, [], 'archive interaction must not produce browser errors');
  console.log('PASS magazine return, keyboard reopen, and physical bottle selection after safe magazine return');
} finally { await browser.close(); }
