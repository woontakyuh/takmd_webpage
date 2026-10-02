import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';

const url = process.env.OFFICE_TEST_URL ?? 'http://127.0.0.1:4322/';
const evidence = process.env.OFFICE_TEST_EVIDENCE ?? '.omo/evidence/tv-slide-fit';
const ids = ['1d4908af25b9800ebf57cd2ce51d47d5', '256908af25b98023b8beeb0cc3d039cc',
  '375908af25b9809bace8c400da57f817', '37b908af25b980e2bcaaf32b9487ba87'];
const { presentations } = JSON.parse(await readFile('src/data/presentations.json', 'utf8'));
await mkdir(evidence, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
const results = [], errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(new URL(`?exhibit=education&talk=${ids[0]}`, url).href);
  await page.locator('.office-poster[data-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
  for (const id of ids) {
    if (id !== ids[0]) {
      await page.getByRole('button', { name: 'Browse lectures', exact: true }).click();
      const talk = presentations.find(item => item.id === id);
      const year = page.locator('.tv-lecture-year-toggle').filter({ hasText: talk.date.slice(0, 4) });
      if (await year.getAttribute('aria-expanded') !== 'true') await year.click();
      await page.locator('.tv-lecture-entry').filter({ has: page.locator('strong').filter({ hasText: talk.name }) }).click();
    }
    await page.waitForFunction(id => document.querySelector('.tv-screen-reader')?.dataset.talk === id, id);
    await page.locator('.tv-screen-image img').evaluate(image => image.decode());
    await page.waitForTimeout(1000);
    const bounds = await page.locator('.tv-screen-reader').evaluate(reader => {
      const outer = reader.getBoundingClientRect();
      return ['.tv-screen-image', '.tv-screen-context', '.tv-page-arrow-next'].map(selector => {
        const box = reader.querySelector(selector).getBoundingClientRect();
        return { selector, left: box.left - outer.left, right: box.right - outer.right };
      });
    });
    results.push({ id, bounds });
    await page.screenshot({ path: `${evidence}/${id}.png` });
    for (const box of bounds) assert(box.left >= -1 && box.right <= 1, `Slide and controls must remain inside the TV: ${JSON.stringify({ id, ...box })}`);
    await page.getByRole('button', { name: 'Next presentation slide', exact: true }).click();
    await page.getByRole('button', { name: 'Previous presentation slide', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Close and return to office', exact: true }).click();
  assert.equal(new URL(page.url()).pathname, new URL(url).pathname);
  assert.deepEqual(errors, []);
} finally {
  await writeFile(`${evidence}/results.json`, JSON.stringify({ results, errors }, null, 2));
  await browser.close();
}
console.log('All four imported decks fit the mobile TV with accessible page controls.');
