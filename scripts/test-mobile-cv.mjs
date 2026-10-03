import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:4326/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/mobile-entry-20260930/cv';
const baseline = process.env.CV_BASELINE === '1';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [];
try {
  for (const [width, height, ready] of baseline ? [[390, 844, false]] : [[390, 844, false], [390, 844, true], [375, 812, false], [812, 375, true], [768, 1024, false], [1280, 900, false]]) {
    if (process.env.CV_LOADING_ONLY === '1' && ready) continue;
    const mobile = width < 760 || height < 500;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: mobile, hasTouch: mobile, reducedMotion: width === 390 && !ready ? 'no-preference' : 'reduce' });
    const page = await context.newPage();
    // Given a phone or desktop, with either a pending scene or a fully ready office.
    let releaseScene;
    const sceneGate = new Promise(resolve => { releaseScene = resolve; });
    if (!ready) await page.route(width === 390 && !baseline ? /RoomContents[^/]*\.(?:js|tsx)/ : /StudioScene[^/]*\.(?:js|tsx)/, async route => { await sceneGate; await route.continue(); });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    if (width === 390 && !ready && !baseline) await page.locator('.studio[data-desk-ready=true][data-room-ready=false]').waitFor({ state: 'attached', timeout: 120000 });
    if (ready) await page.locator('.studio[data-room-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
    // When the visitor opens their CV from the visible navigation.
    const automaticReader = await page.locator('.loading-monitor-reader[data-entry-reader=true]').isVisible();
    if (!automaticReader) await page.getByRole('link', { name: 'Living CV', exact: true }).click();
    const reader = page.locator('.monitor-screen-reader[data-active=true]');
    const content = reader.locator('.monitor-screen-content');
    await content.waitFor();
    await page.locator('.loading-monitor-bezel').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
    if (mobile && !baseline) {
      assert(await reader.locator('.monitor-screen-header h2').evaluate(element => {
        const box = element.getBoundingClientRect();
        return element.contains(document.elementFromPoint(box.x + 4, box.y + box.height / 2));
      }), 'CV title must not be covered by office controls');
    }
    const metrics = await content.evaluate(element => {
      const activity = element.querySelector('.monitor-cv-activity p');
      const bounds = activity.getBoundingClientRect();
      return { effectiveFont: parseFloat(getComputedStyle(activity).fontSize) * bounds.width / activity.offsetWidth,
        clientWidth: element.clientWidth, scrollWidth: element.scrollWidth,
        displayedWidth: element.getBoundingClientRect().width,
        contentHeight: element.scrollHeight, visibleHeight: element.clientHeight,
        activities: element.querySelectorAll('.monitor-cv-activity').length,
        portraitVisible: element.querySelector('.monitor-cv-portrait').getBoundingClientRect().height > 0 };
    });
    results.push({ width, height, ready, metrics, entryOnOpen: await page.locator('.studio').getAttribute('data-entry') });
    await page.screenshot({ path: `${evidence}/${baseline ? 'red' : 'readable'}-${width}-${ready}.png` });
    // Then real rendered text is readable without zoom and no content is removed.
    if (mobile) assert(metrics.effectiveFont >= 16, `Effective body font ${metrics.effectiveFont}px is too small`);
    assert(metrics.scrollWidth <= metrics.clientWidth + 1, 'Reader must not overflow horizontally');
    assert(metrics.activities > 5 && metrics.portraitVisible);
    if (mobile) {
      const client = await context.newCDPSession(page);
      const box = await content.boundingBox();
      const center = { x: box.x + box.width / 2, y: box.y + Math.min(box.height / 2, 300) };
      // Given a readable CV, when the user pinches, native viewport zoom changes.
      const scaleBefore = await page.evaluate(() => visualViewport.scale);
      await client.send('Input.synthesizePinchGesture', { ...center, scaleFactor: 2, relativeSpeed: 400, gestureSourceType: 'touch' });
      await page.waitForFunction(before => visualViewport.scale > before * 1.5, scaleBefore);
      results.at(-1).pinchScale = await page.evaluate(() => visualViewport.scale);
      results.at(-1).entryAfterPinch = await page.locator('.studio').getAttribute('data-entry');
      await page.screenshot({ path: `${evidence}/pinch-${width}-${ready}.png` });
      await client.send('Input.synthesizePinchGesture', { x: center.x / 2, y: center.y / 2, scaleFactor: .5, relativeSpeed: 400, gestureSourceType: 'touch' });
      await page.waitForFunction(() => visualViewport.scale <= 1.01);
      // Given the cover, when the user swipes upward, the CV's native scroll surface moves.
      const x = box.x + box.width * .6;
      const start = box.y + box.height * .8, end = box.y + box.height * .2;
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: start }] });
      for (let step = 1; step <= 12; step++) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: start + (end - start) * step / 12 }] });
        await new Promise(resolve => setTimeout(resolve, 20));
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      await page.waitForFunction(() => document.querySelector('.monitor-screen-reader[data-active=true] .monitor-screen-content').scrollTop > 50);
      results.at(-1).touchScroll = await content.evaluate(e => e.scrollTop);
      results.at(-1).entryAfterSwipe = await page.locator('.studio').getAttribute('data-entry');
      await client.detach();
    }
    // Given all CV sections, when the visitor reads to the end, awards and links remain reachable.
    await content.getByText('Best Shorts Award, KOSESS', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidence}/awards-${width}-${ready}.png` });
    let scrollBefore = await content.evaluate(e => e.scrollTop);
    if (width === 390 && !ready && !baseline && process.env.CV_LOADING_ONLY !== '1') {
      // Given a CV already being read, when the room completes, reading position survives.
      releaseScene();
      await page.locator('.studio[data-room-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
      await page.waitForFunction(() => document.querySelector('.studio').dataset.entry === 'reading');
      await page.locator('.loading-monitor-reader').evaluate(element => Promise.all(element.getAnimations().map(animation => animation.finished)));
      assert.equal(await content.evaluate(e => e.scrollTop), scrollBefore);
      const bounds = await content.boundingBox();
      await page.screenshot({ path: `${evidence}/loading-to-ready-${width}.png` });
      assert(bounds.y + bounds.height <= height, 'Settled reader bottom must stay inside the viewport');
      results.at(-1).loadingToReady = true;
      const footer = content.locator('.monitor-cv-footer');
      await footer.scrollIntoViewIfNeeded();
      const footerBounds = await footer.boundingBox();
      assert(footerBounds.y + footerBounds.height <= height, 'Final footer remains reachable after room reveal');
      await page.screenshot({ path: `${evidence}/footer-after-reveal-${width}.png` });
      scrollBefore = await content.evaluate(e => e.scrollTop);
    }
    if (automaticReader && await page.locator('.loading-monitor-reader button[aria-label="Close and return to office"]').isDisabled()) {
      releaseScene();
      await page.locator('.studio[data-room-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
    }
    await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
    if (automaticReader) await page.locator('.studio[data-entry=complete]').waitFor({ timeout: 15000 });
    await page.getByRole('link', { name: 'Living CV', exact: true }).click();
    await page.waitForFunction(previous => {
      const element = document.querySelector('.monitor-screen-reader[data-active=true] .monitor-screen-content');
      return element && Math.abs(element.scrollTop - Math.min(previous, element.scrollHeight - element.clientHeight)) < 2;
    }, scrollBefore);
    results.at(-1).scrollBeforeClose = scrollBefore;
    results.at(-1).restoredScroll = await content.evaluate(element => element.scrollTop);
    releaseScene();
    await context.close();
  }
  if (!baseline) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    await page.goto(new URL('/cv', url).href);
    await page.getByRole('heading', { name: 'Woon Tak Yuh, MD.', exact: true }).waitFor();
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    await page.getByText('Best Shorts Award, KOSESS', { exact: true }).scrollIntoViewIfNeeded();
    await page.screenshot({ path: `${evidence}/public-cv-mobile.png` });
    results.push({ publicCv: true });
    await context.close();
  }
} finally {
  await writeFile(`${evidence}/${baseline ? 'red' : 'results'}.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log(JSON.stringify(results, null, 2));
