import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { chromium } from 'playwright-core';
import { startPublicPreview } from './preview-public-build.mjs';

const fixture = await mkdtemp(join(tmpdir(), 'takmd-header-policy-'));
let browser;
let fixturePreview;
let productionPreview;
let attackerPreview;
try {
  const policy = await readFile(new URL('../public/_headers', import.meta.url), 'utf8');
  await writeFile(join(fixture, '_headers'), policy);
  await writeFile(join(fixture, 'index.html'), `<!doctype html><html><title>Policy probe</title><body><script>
    window.inlineAllowed = true;
    window.workerReady = new Promise((resolve, reject) => {
      const url = URL.createObjectURL(new Blob(['postMessage(42)'], {type:'text/javascript'}));
      const worker = new Worker(url);
      worker.onmessage = event => { worker.terminate(); URL.revokeObjectURL(url); resolve(event.data); };
      worker.onerror = reject;
    });
    window.wasmReady = WebAssembly.instantiate(new Uint8Array([0,97,115,109,1,0,0,0])).then(() => true);
  </script><iframe src="/child.html" title="Internal frame"></iframe></body></html>`);
  await writeFile(join(fixture, 'child.html'), '<!doctype html><html><title>Allowed child</title><body>Same-origin content</body></html>');
  await symlink(new URL('../package.json', import.meta.url), join(fixture, 'outside.json'));
  fixturePreview = await startPublicPreview(fixture);
  productionPreview = await startPublicPreview(resolve(process.env.PUBLIC_BUILD_DIR ?? 'dist'));
  for (const [path, status] of [['/%2e%2e%2fpackage.json', 403], ['/%E0%A4%A', 400], ['/_headers', 404], ['/outside.json', 403]]) {
    assert.equal((await fetch(fixturePreview.origin + path)).status, status, path);
  }
  const head = await fetch(fixturePreview.origin, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(fixturePreview.origin, { headers: { Range: 'bytes=invalid' } })).status, 416);
  console.log('PASS: loopback preview blocks decoded traversal, malformed URLs, private config and invalid ranges; HEAD has no body');
  browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--use-angle=metal', '--ignore-gpu-blocklist'] });
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const canPlayType = HTMLMediaElement.prototype.canPlayType;
    HTMLMediaElement.prototype.canPlayType = function(type) { return type.includes('mpegurl') ? '' : canPlayType.call(this, type); };
    window.policyViolations = [];
    document.addEventListener('securitypolicyviolation', event => window.policyViolations.push({ directive: event.effectiveDirective, blocked: event.blockedURI }));
  });
  const page = await context.newPage();
  await page.goto(fixturePreview.origin);
  assert.equal(await page.evaluate(() => window.inlineAllowed), true);
  assert.equal(await page.evaluate(() => window.workerReady), 42);
  assert.equal(await page.evaluate(() => window.wasmReady), true);
  assert.equal(await page.frameLocator('iframe').locator('body').textContent(), 'Same-origin content');
  assert.deepEqual(await page.evaluate(() => window.policyViolations), []);
  assert.equal(await page.evaluate(() => document.featurePolicy.allowsFeature('camera')), false);
  assert.equal(await page.evaluate(() => document.featurePolicy.allowsFeature('microphone')), false);
  await page.evaluate(() => {
    const script = document.createElement('script');
    script.src = 'https://example.invalid/policy-probe.js';
    document.body.append(script);
  });
  await page.waitForFunction(() => window.policyViolations.some(event => event.directive === 'script-src-elem'));
  console.log('PASS: browser allows inline boot, WebAssembly, blob worker, same-origin frame; rejects external script and device access');

  await writeFile(join(fixture, 'external-parent.html'), `<!doctype html><iframe src="${productionPreview.origin}/build.json" title="Cross-origin frame"></iframe>`);
  await page.goto(`${fixturePreview.origin}/external-parent.html`);
  await page.waitForFunction(() => window.policyViolations.some(event => event.directive === 'frame-src'));
  console.log('PASS: outgoing cross-origin frame blocked');

  const attacker = join(fixture, 'attacker');
  await mkdir(attacker);
  await writeFile(join(attacker, '_headers'), '');
  await writeFile(join(attacker, 'index.html'), `<!doctype html><iframe src="${fixturePreview.origin}/child.html"></iframe>`);
  attackerPreview = await startPublicPreview(attacker);
  const ancestorBlocked = page.waitForEvent('console', { predicate: message => message.text().includes('frame-ancestors') });
  await page.goto(attackerPreview.origin);
  await ancestorBlocked;
  console.log('PASS: incoming cross-origin framing rejected by frame-ancestors');

  const externalRequests = [];
  const decoderResponses = new Set();
  page.on('response', response => {
    const url = new URL(response.url());
    if (url.origin === productionPreview.origin && url.pathname.startsWith('/vendor/draco/') && response.ok()) decoderResponses.add(url.pathname);
  });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (['http:', 'https:'].includes(url.protocol) && url.origin !== productionPreview.origin) {
      externalRequests.push(url.href);
      return route.abort('blockedbyclient');
    }
    return route.continue();
  });
  for (const path of ['/', '/cv']) {
    const errors = [];
    const listener = error => errors.push(error.message);
    page.on('pageerror', listener);
    const response = await page.goto(`${productionPreview.origin}${path}`);
    assert.equal(response.status(), 200);
    assert.equal(response.headers()['content-security-policy'], (await fetch(fixturePreview.origin)).headers.get('content-security-policy'));
    await page.locator('.office-poster[data-ready=true]').waitFor({ state: 'attached', timeout: 120000 });
    if (path === '/') {
      assert.ok(decoderResponses.has('/vendor/draco/draco_wasm_wrapper.js'), 'Draco wrapper must load from the site');
      assert.ok(decoderResponses.has('/vendor/draco/draco_decoder.wasm'), 'Draco WebAssembly must load from the site');
      await page.getByRole('button', { name: 'Play music', exact: true }).click();
      await page.waitForFunction(() => document.querySelector('audio[data-active=true]')?.currentTime > .1);
      await page.getByRole('button', { name: 'Pause music', exact: true }).click();
      await page.getByRole('button', { name: 'Play proposal recording', exact: true }).focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(() => {
        const video = document.querySelector('video[data-office-memory=proposal]');
        return video?.currentSrc.startsWith('blob:') && video.currentTime > .1;
      }, null, { timeout: 30000 });
      console.log('PASS: music and HLS recording actually play through the local playlist and blob MediaSource');
    }
    assert.deepEqual(await page.evaluate(() => window.policyViolations), [], `CSP violations on ${path}`);
    assert.deepEqual(errors, [], `Runtime errors on ${path}`);
    assert.deepEqual(externalRequests, [], 'The production room must make no third-party requests');
    console.log(`PASS: production ${path} initializes its 3D office under the response policy`);
    page.off('pageerror', listener);
  }
  for (const [path, contentType] of [['/models/proposal-memory/hls/master.m3u8', 'application/vnd.apple.mpegurl'], ['/audio/two-ton-shoe-paper-bag.m4a', 'audio/mp4']]) {
    const response = await fetch(`${productionPreview.origin}${path}`, { headers: { Range: 'bytes=0-31' } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-type'), contentType);
    assert.equal((await response.arrayBuffer()).byteLength, 32);
  }
  console.log('PASS: HLS and music keep correct MIME types and byte-range access');
  await context.close();
} finally {
  await browser?.close();
  await productionPreview?.close();
  await attackerPreview?.close();
  await fixturePreview?.close();
  await rm(fixture, { recursive: true, force: true });
}
