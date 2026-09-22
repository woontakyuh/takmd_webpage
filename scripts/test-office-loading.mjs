import { chromium } from 'playwright-core';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const base = process.env.RELEASE_BASE_URL ?? 'http://127.0.0.1:4322';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/release-readiness/loading';
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const results = {};
try {
  if (process.env.LOADING_CHECK !== 'recovery') {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    performance.setResourceTimingBufferSize(2000);
    window.releaseReadyAt = null;
    new MutationObserver(() => {
      if (window.releaseReadyAt === null && document.querySelector('.office-poster[data-ready="true"]')) {
        window.releaseReadyAt = performance.now();
      }
    }).observe(document, { subtree: true, attributes: true, childList: true });
  });
  await page.goto(base);
  await page.locator('.studio[data-entry="complete"]').waitFor({ timeout: 60000 });
  await page.waitForFunction(() => performance.getEntriesByType('resource').filter(r => r.name.includes('/models/whisky/')).length >= 7);
  results.staging = await page.evaluate(() => ({
    ready: window.releaseReadyAt,
    labels: performance.getEntriesByType('resource').filter(r => r.name.includes('/models/whisky/')).map(r => ({ name: r.name, start: r.startTime })),
  }));
  assert.ok(results.staging.ready > 0);
  assert.ok(results.staging.labels.every(r => r.start >= results.staging.ready), 'Closed-cabinet labels must start after room readiness');
  await page.close();
  }

  const recovery = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await recovery.route('**/models/soft-pad/chair.glb', route => route.abort());
  await recovery.goto(`${base}/?exhibit=research&stage=approach`);
  await recovery.locator('.office-poster[data-failed="true"]').waitFor({ timeout: 60000 });
  await recovery.getByRole('button', { name: 'Try again', exact: true }).waitFor({ timeout: 5000 });
  await recovery.screenshot({ path: `${evidence}/loading-failure.png` });
  await recovery.unroute('**/models/soft-pad/chair.glb');
  await recovery.getByRole('button', { name: 'Try again', exact: true }).click();
  await recovery.locator('.office-poster[data-ready="true"]').waitFor({ state: 'attached', timeout: 60000 });
  assert.equal(new URL(recovery.url()).searchParams.get('exhibit'), 'research');
  results.recovery = { passed: true, url: recovery.url() };
  await recovery.close();
} finally {
  await writeFile(`${evidence}/loading-result.json`, JSON.stringify(results, null, 2));
  await browser.close();
}
console.log('Loading staging and recovery checks passed');
