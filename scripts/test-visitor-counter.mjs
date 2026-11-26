import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const fixture = await mkdtemp(join(tmpdir(), 'takmd-visits-'));
const wrangler = ['exec', '--yes', '--package=wrangler@4.129.0', '--', 'wrangler'];
const state = join(fixture, 'state');
let server;
let serverLog = '';

function cli(args) {
  const result = spawnSync('npm', [...wrangler, ...args], { cwd: fixture, encoding: 'utf8', env: { ...process.env, CI: 'true' } });
  assert.equal(result.status, 0, result.stdout + result.stderr);
}

async function check(name, run) {
  await run();
  console.log(`PASS ${name}`);
}

try {
  await mkdir(join(fixture, 'public'));
  await writeFile(join(fixture, 'public/index.html'), '<!doctype html><title>Counter fixture</title><p>Static page</p>');
  await writeFile(join(fixture, 'public/static.txt'), 'static asset');
  await symlink(join(repo, 'node_modules'), join(fixture, 'node_modules'));
  try {
    await cp(join(repo, 'functions'), join(fixture, 'functions'), { recursive: true });
    await cp(join(repo, 'migrations'), join(fixture, 'migrations'), { recursive: true });
    await cp(join(repo, 'public/_routes.json'), join(fixture, 'public/_routes.json'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await writeFile(join(fixture, 'wrangler.toml'), `name = "counter-test"
compatibility_date = "2024-01-01"
pages_build_output_dir = "./public"
[vars]
VISITOR_COUNTER_ENABLED = "true"
[[d1_databases]]
binding = "VISITOR_DB"
database_name = "visitor-test"
database_id = "local-counter-test"
`);
  try {
    await readFile(join(fixture, 'migrations/0001_visitor_counter.sql'));
    cli(['d1', 'migrations', 'apply', 'VISITOR_DB', '--local', '--persist-to', state]);
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  server = spawn('npm', [...wrangler, 'pages', 'dev', 'public', '--ip', '127.0.0.1', '--port', '0', '--inspector-port', '0', '--persist-to', state, '--show-interactive-dev-session=false'], { cwd: fixture, detached: true, env: { ...process.env, CI: 'true' } });
  const origin = await new Promise((resolveReady, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Wrangler startup timeout: ${serverLog}`)), 30_000);
    const collect = chunk => {
      serverLog += chunk.toString();
      const ready = serverLog.match(/Ready on (http:\/\/127\.0\.0\.1:\d+)/);
      if (ready) { clearTimeout(timeout); resolveReady(ready[1]); }
    };
    server.stdout.on('data', collect);
    server.stderr.on('data', collect);
    server.once('exit', code => { clearTimeout(timeout); reject(new Error(`Wrangler exited ${code}: ${serverLog}`)); });
  });
  const endpoint = `${origin}/api/visits`;
  const post = (sessionId, options = {}) => fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin }, body: JSON.stringify({ sessionId }), ...options });
  const getCount = async () => {
    const response = await fetch(endpoint);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('Content-Type'), /application\/json/);
    return response.json();
  };

  await check('Given an empty database, GET returns zero without inventing history', async () => {
    const initial = await getCount();
    assert.equal(initial.count, 0);
    assert.match(initial.since, /^\d{4}-\d{2}-\d{2}$/);
  });
  const sessionId = crypto.randomUUID();
  await check('Given a new session, POST records one visit', async () => {
    const response = await post(sessionId);
    assert.equal(response.status, 200);
    assert.equal((await response.json()).count, 1);
  });
  await check('Given a recorded session, refresh and duplicate POST stay at one', async () => {
    const responses = await Promise.all(Array.from({ length: 12 }, () => post(sessionId)));
    assert.ok(responses.every(response => response.status === 200));
    assert.equal((await getCount()).count, 1);
  });
  await check('Given distinct sessions arriving together, all increments survive', async () => {
    const responses = await Promise.all(Array.from({ length: 20 }, () => post(crypto.randomUUID())));
    assert.ok(responses.every(response => response.status === 200));
    assert.equal((await getCount()).count, 21);
  });
  await check('Given a new session posted concurrently, the insert happens only once', async () => {
    const sameNewSession = crypto.randomUUID();
    const responses = await Promise.all(Array.from({ length: 12 }, () => post(sameNewSession)));
    assert.ok(responses.every(response => response.status === 200));
    assert.equal((await getCount()).count, 22);
  });
  await check('Given plain GET requests including crawler headers, reads never increment', async () => {
    await Promise.all(Array.from({ length: 6 }, () => fetch(endpoint, { headers: { 'User-Agent': 'test-crawler' } })));
    assert.equal((await getCount()).count, 22);
  });
  await check('Given malformed input, the API rejects it without incrementing', async () => {
    assert.equal((await post('bad-id')).status, 400);
    assert.equal((await post(sessionId, { body: '{' })).status, 400);
    assert.equal((await post(sessionId, { body: JSON.stringify({ sessionId, extra: true }) })).status, 400);
    assert.equal((await post(sessionId, { body: 'x'.repeat(300) })).status, 413);
    assert.equal((await getCount()).count, 22);
  });
  await check('Given an oversized chunked body without Content-Length, parsing is bounded', async () => {
    const body = new ReadableStream({ start(controller) { controller.enqueue(new TextEncoder().encode('x'.repeat(300))); controller.close(); } });
    assert.equal((await post(sessionId, { body, duplex: 'half' })).status, 413);
    assert.equal((await getCount()).count, 22);
  });
  await check('Given a different or missing origin, writes are rejected', async () => {
    assert.equal((await post(crypto.randomUUID(), { headers: { 'Content-Type': 'application/json', Origin: 'https://elsewhere.example' } })).status, 403);
    assert.equal((await post(crypto.randomUUID(), { headers: { 'Content-Type': 'application/json' } })).status, 403);
    assert.equal((await getCount()).count, 22);
  });
  await check('Given unsupported methods or content types, the API rejects them', async () => {
    assert.equal((await fetch(endpoint, { method: 'PUT' })).status, 405);
    assert.equal((await post(sessionId, { headers: { Origin: origin, 'Content-Type': 'text/plain' } })).status, 415);
    assert.equal((await post(sessionId, { headers: { Origin: origin, 'Content-Type': 'application/json-invalid' } })).status, 415);
  });
  await check('Given count responses, no shared cache or cookies are introduced', async () => {
    const response = await fetch(endpoint);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
    assert.equal(response.headers.get('Set-Cookie'), null);
  });
  await check('Given static assets, the worker invocation rules exclude them', async () => {
    const routes = JSON.parse(await readFile(join(repo, 'public/_routes.json'), 'utf8'));
    assert.deepEqual(routes.include, ['/api/visits', '/api/visits/']);
    assert.equal(await (await fetch(`${origin}/static.txt`)).text(), 'static asset');
  });
  await check('Given a disabled preview, the handler does not need or access a database', async () => {
    const compiled = join(fixture, 'handler.mjs');
    await build({ entryPoints: [join(repo, 'functions/api/visits.ts')], outfile: compiled, bundle: true, format: 'esm', platform: 'browser' });
    const { onRequest } = await import(compiled);
    for (const method of ['GET', 'POST']) {
      const response = await onRequest({ request: new Request(endpoint, { method }), env: { VISITOR_COUNTER_ENABLED: 'false' } });
      assert.equal(response.status, 204);
    }
  });
  await check('Given database failure, the API returns unavailable rather than a fake zero', async () => {
    cli(['d1', 'execute', 'VISITOR_DB', '--local', '--persist-to', state, '--command', 'DROP TABLE visitor_totals;']);
    assert.equal((await fetch(endpoint)).status, 503);
    assert.equal((await post(crypto.randomUUID())).status, 503);
  });
} finally {
  if (server?.pid) {
    try { process.kill(-server.pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  await rm(fixture, { recursive: true, force: true });
}
