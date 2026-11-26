import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';
import { chromium } from 'playwright-core';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
assert.ok(existsSync(join(repo, 'src/components/studio/VisitorCount.tsx')), 'VisitorCount component must exist');
const fixture = await mkdtemp(join(tmpdir(), 'takmd-counter-ui-'));
const evidenceDir = process.env.VISITOR_COUNTER_EVIDENCE;
const sessions = new Set();
let responseMode = 'ok';
let browser;
const server = createServer(async (request, response) => {
  if (request.url === '/api/visits') {
    if (responseMode === 'failure') { response.writeHead(503); response.end(); return; }
    if (responseMode === 'malformed') { response.setHeader('Content-Type', 'application/json'); response.end('{"count":-1}'); return; }
    if (responseMode === 'unavailable') { response.writeHead(204); response.end(); return; }
    if (request.method === 'POST') {
      let body = '';
      for await (const chunk of request) body += chunk;
      sessions.add(JSON.parse(body).sessionId);
    }
    response.setHeader('Content-Type', 'application/json');
    response.end(JSON.stringify({ count: sessions.size, since: '2026-09-09' }));
    return;
  }
  const path = request.url === '/bundle.js' ? 'bundle.js' : request.url === '/bundle.css' ? 'bundle.css' : 'index.html';
  response.setHeader('Content-Type', path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : 'text/html');
  response.end(await readFile(join(fixture, path)));
});

async function check(name, run) {
  await run();
  console.log(`PASS ${name}`);
}

try {
  await build({
    stdin: { contents: "import React from 'react'; import {createRoot} from 'react-dom/client'; import {VisitorCount} from './src/components/studio/VisitorCount'; createRoot(document.getElementById('root')).render(React.createElement(VisitorCount));", resolveDir: repo },
    bundle: true, format: 'esm', platform: 'browser', outfile: join(fixture, 'bundle.js'), define: { 'process.env.NODE_ENV': '"production"' },
  });
  await writeFile(join(fixture, 'index.html'), '<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Visitor counter test</title><link rel="stylesheet" href="/bundle.css"><style>body{margin:24px;background:#eae8e1;color:#202d2a;font-family:sans-serif;font-size:12px;--studio-muted:#5c655f}</style><footer id="root"></footer><script type="module" src="/bundle.js"></script></html>');
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const address = server.address();
  assert.ok(address && typeof address === 'object');
  const origin = `http://127.0.0.1:${address.port}`;
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await check('Given a new browser-tab session, the real component shows one visit', async () => {
    await page.goto(origin);
    await page.waitForFunction(() => document.querySelector('.studio-visitor-count')?.textContent === '1 visit');
    assert.equal(sessions.size, 1);
  });
  await check('Given the same tab reloaded, the count remains one', async () => {
    await page.reload();
    await page.waitForFunction(() => document.querySelector('.studio-visitor-count')?.textContent === '1 visit');
    assert.equal(sessions.size, 1);
  });
  await check('Given a fresh tab session, the count becomes two', async () => {
    const other = await context.newPage();
    await other.goto(origin);
    await other.waitForFunction(() => document.querySelector('.studio-visitor-count')?.textContent === '2 visits');
    await other.close();
  });
  await check('Given storage is blocked, only a read is made and the count is still available', async () => {
    const blocked = await browser.newContext();
    await blocked.addInitScript(() => Object.defineProperty(window, 'sessionStorage', { get() { throw new DOMException('Blocked', 'SecurityError'); } }));
    const blockedPage = await blocked.newPage();
    const request = blockedPage.waitForRequest('**/api/visits');
    await blockedPage.goto(origin);
    assert.equal((await request).method(), 'GET');
    await blockedPage.waitForFunction(() => document.querySelector('.studio-visitor-count')?.textContent === '2 visits');
    await blocked.close();
  });
  for (const mode of ['failure', 'malformed', 'unavailable']) {
    await check(`Given ${mode} API responses, the counter stays hidden`, async () => {
      responseMode = mode;
      await page.bringToFront();
      const responded = page.waitForResponse('**/api/visits');
      await page.reload();
      assert.equal((await responded).status(), mode === 'failure' ? 503 : mode === 'unavailable' ? 204 : 200);
      await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))));
      assert.equal(await page.locator('.studio-visitor-count').count(), 0);
    });
  }
  responseMode = 'ok';
  await page.reload();
  await page.waitForSelector('.studio-visitor-count');
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 240 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    if (evidenceDir) {
      await mkdir(evidenceDir, { recursive: true });
      await page.screenshot({ path: join(evidenceDir, `counter-fixture-${width}.png`) });
    }
  }
  assert.deepEqual(pageErrors, []);
  console.log('PASS Counter fits 375, 768, 1280 widths with no uncaught browser errors');
} finally {
  await browser?.close();
  server.closeAllConnections();
  await new Promise(resolveClose => server.close(resolveClose));
  await rm(fixture, { recursive: true, force: true });
}
