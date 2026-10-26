import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? process.env.RELEASE_BASE_URL ?? 'http://127.0.0.1:4331/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/release-readiness-2026-09-22/reader';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
async function scenario(name, viewport, run, query = '?exhibit=research') {
  const context = await browser.newContext({ viewport, hasTouch: viewport.width < 760, isMobile: viewport.width < 760 });
  const page = await context.newPage();
  await page.addInitScript(() => {
    const roots = new Set();
    let renderer = 0;
    window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = { supportsFiber: true, inject: () => ++renderer,
      onCommitFiberRoot: (_, root) => roots.add(root), onCommitFiberUnmount() {}, checkDCE() {} };
    window.readerScene = () => {
      let result;
      const seen = new Set();
      const visit = fiber => {
        if (!fiber || seen.has(fiber) || result) return;
        seen.add(fiber);
        const value = fiber.memoizedProps?.value;
        const state = typeof value?.getState === 'function' ? value.getState() : null;
        if (state?.gl && state.scene && state.camera) { result = state; return; }
        visit(fiber.child); visit(fiber.sibling);
      };
      for (const root of roots) visit(root.current);
      return result;
    };
  });
  try {
    await page.goto(`${url}${query}`);
    await page.locator('.studio-dialog[open]').waitFor({ timeout: 120000 });
    await page.locator('.studio-dialog[open]').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    await run(page);
    results.push({ name, passed: true });
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    results.push({ name, passed: false, error: error.message });
    await page.screenshot({ path: `${evidence}/${name}-failure.png` });
  } finally {
    await context.close();
  }
}
try {
  await scenario('research-native-scroll', { width: 390, height: 844 }, async page => {
    // Given the mobile research reader, its initial paper surface leaves the object visible.
    const dialog = page.locator('.studio-dialog[open]');
    const paper = dialog.locator('.studio-panel-top');
    const initial = await paper.boundingBox();
    assert(initial);
    await page.screenshot({ path: `${evidence}/research-initial-390.png` });
    // When the native reader scrolls by 120px, the paper rises by exactly that amount.
    await dialog.evaluate(element => element.scrollTo({ top: 120, behavior: 'instant' }));
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const moved = await paper.boundingBox();
    assert(moved);
    assert(Math.abs(initial.y - moved.y - 120) < 2, `Paper must rise 120px; moved ${initial.y - moved.y}px`);
    assert.equal(await dialog.locator('.folio-content').evaluate(element => getComputedStyle(element).overflowY), 'visible');
    await page.screenshot({ path: `${evidence}/research-scroll-390.png` });
    await dialog.evaluate(element => element.scrollTo({ top: 0, behavior: 'instant' }));
    const restored = await paper.boundingBox();
    assert(restored);
    assert(Math.abs(initial.y - restored.y) < 2);
  });
  await scenario('reader-tab-scope', { width: 1280, height: 900 }, async page => {
    // Given the last focusable reader action, no background object belongs to its tab order.
    const lastAction = page.locator('.studio-dialog[open] a[aria-label="Open paper preview image"]');
    await lastAction.focus();
    // When Tab is pressed at the end, focus wraps to the reader's first control.
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Expand reading view');
    assert.equal(await page.locator('.studio').getAttribute('data-reading'), 'research');
  });
  await scenario('reader-reverse-tab', { width: 768, height: 1024 }, async page => {
    // Given the first control, Shift+Tab must wrap inside this reader.
    await page.getByRole('button', { name: 'Expand reading view', exact: true }).focus();
    // When reverse tabbing, the last paper action receives focus.
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Open paper preview image');
  });
  await scenario('reader-opener-restored', { width: 1280, height: 900 }, async page => {
    // Given a reader opened through its keyboard accessibility trigger.
    await page.keyboard.press('Escape');
    await page.locator('.studio-dialog[open]').waitFor({ state: 'hidden' });
    await page.locator('#studio-exhibit-research').focus();
    await page.keyboard.press('Enter');
    await page.locator('.studio-dialog[open]').waitFor();
    // When closed, focus returns to exactly the trigger used to enter.
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => document.activeElement?.id === 'studio-exhibit-research');
    assert.equal(await page.locator('.studio-dialog[open]').count(), 0);
  });
  await scenario('research-expand-return', { width: 375, height: 812 }, async page => {
    // Given a mobile side reader, manual expansion still opens a modal full reader.
    await page.getByRole('button', { name: 'Expand reading view', exact: true }).click();
    const dialog = page.locator('.studio-dialog[open]');
    assert.equal(await dialog.evaluate(element => element.matches(':modal')), true);
    const expanded = await dialog.boundingBox();
    assert(expanded && expanded.height > 750 && expanded.x >= 0 && expanded.x + expanded.width <= 375);
    // When returning to the side reader, the reveal position and non-modal behavior return.
    await page.getByRole('button', { name: 'Return to side reader', exact: true }).click();
    assert.equal(await dialog.evaluate(element => element.matches(':modal')), false);
    const top = await dialog.locator('.studio-reader-body').boundingBox();
    assert(top && Math.abs(top.y - 406) < 2);
  });
  await scenario('research-short-landscape', { width: 667, height: 375 }, async page => {
    // Given a short landscape viewport, the existing compact side reader fits next to the folio.
    const dialog = page.locator('.studio-dialog[open]');
    // When its final layout settles, neither edge nor controls overflow the viewport.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    const box = await dialog.boundingBox();
    assert(box && box.x >= 0 && box.x + box.width <= 667, `Reader must fit: ${JSON.stringify(box)}`);
  });
  await scenario('reader-room-pointer', { width: 390, height: 844 }, async page => {
    // Given a non-modal reader with a visible room toolbar, outside pointer input remains active.
    const control = page.getByRole('button', { name: 'Return to the overview', exact: true });
    // When the room overview is clicked, the reader closes through the ordinary navigation action.
    await control.click();
    await page.locator('.studio-dialog[open]').waitFor({ state: 'hidden' });
  });
  await scenario('ube-native-scroll', { width: 390, height: 844 }, async page => {
    // Given the existing UBE reader, the shared sheet retains its native scroll behavior.
    const dialog = page.locator('.studio-dialog[open]');
    const before = await dialog.locator('.studio-panel-top').boundingBox();
    // When scrolling by 120px, the same surface rises by 120px.
    await dialog.evaluate(element => element.scrollTo({ top: 120, behavior: 'instant' }));
    const after = await dialog.locator('.studio-panel-top').boundingBox();
    assert(before && after && Math.abs(before.y - after.y - 120) < 2);
  }, '?exhibit=spine&detail=/ube');
  for (const expanded of [false, true]) {
    await scenario(`reader-nested-photo-${expanded}`, { width: 390, height: 844 }, async page => {
      // Given a nested workshop photo viewer over a side or expanded reader.
      if (expanded) await page.getByRole('button', { name: 'Expand reading view', exact: true }).click();
      const photograph = page.locator('.room-photo-open').first();
      await photograph.click();
      const viewer = page.locator('.room-photo-viewer');
      await viewer.waitFor();
      await viewer.getByRole('button', { name: 'Close photograph', exact: true }).focus();
      // When tabbing and dismissing the nested viewer, it retains ownership and restores its trigger.
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Previous photograph');
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), 'Next photograph');
      await page.keyboard.press('Escape');
      await viewer.waitFor({ state: 'hidden' });
      assert.equal(await page.locator('.studio-dialog[open]').count(), 1);
      assert.equal(await photograph.evaluate(element => element === document.activeElement), true);
    }, '?detail=/workshops/dummy');
  }
  for (const width of [375, 768, 1280]) {
    await scenario(`reader-ready-${width}`, { width, height: 900 }, async page => {
      // Given the fully loaded room, capture the reader at each responsive breakpoint.
      await page.locator('.office-poster[data-ready="true"]').waitFor({ state: 'attached', timeout: 120000 });
      await page.locator('.office-poster').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      // Wait for the actual Three.js hinge to settle, independent of rendering speed.
      await page.waitForFunction(() => {
        const cover = window.readerScene()?.scene.getObjectByName('Folio front cover');
        return cover && Math.abs(cover.rotation.z - Math.PI) < .0001;
      });
      const dialog = page.locator('.studio-dialog[open]');
      // When the actual reader is displayed, its surface and controls fit the viewport.
      const box = await dialog.boundingBox();
      assert(box && box.x >= 0 && box.x + box.width <= width && box.y >= 0);
      await page.screenshot({ path: `${evidence}/research-ready-${width}.png` });
      if (width === 375) {
        const client = await page.context().newCDPSession(page);
        await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 190, y: 780 }] });
        for (let step = 1; step <= 12; step++) {
          await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 190, y: 780 - step * 25 }] });
          await page.evaluate(() => new Promise(resolve => requestAnimationFrame(resolve)));
        }
        await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        await client.detach();
        await page.waitForFunction(() => document.querySelector('.studio-dialog')?.scrollTop > 100);
        assert.equal(await dialog.locator('.folio-content').evaluate(element => element.scrollTop), 0);
        await page.screenshot({ path: `${evidence}/research-touch-375.png` });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await dialog.evaluate(element => element.scrollTo({ top: 0, behavior: 'instant' }));
        const before = await dialog.locator('.studio-panel-top').boundingBox();
        await dialog.evaluate(element => element.scrollTo({ top: 120, behavior: 'instant' }));
        const after = await dialog.locator('.studio-panel-top').boundingBox();
        assert(before && after && Math.abs(before.y - after.y - 120) < 2);
        await page.screenshot({ path: `${evidence}/research-reduced-motion-375.png` });
      }
    });
  }
} finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
assert(results.every(result => result.passed), 'Reader scenarios must all pass');
