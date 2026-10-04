import { mkdtemp, readFile, writeFile, cp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = resolve(root, 'dist');
const html = await readFile(join(output, 'index.html'), 'utf8');
if (!html.includes('data-office-render="illustrated"') || !html.includes('https://simple.takmd.com/')) throw new Error('Build the simple profile before publishing.');
const deployment = await mkdtemp(join(tmpdir(), 'takmd-simple-deploy-'));
try {
  // Pages only accepts wrangler.toml in its working directory. Isolate it from the original site's config.
  const config = (await readFile(join(root, 'wrangler.simple.toml'), 'utf8'))
    .replace('pages_build_output_dir = "./dist"', `pages_build_output_dir = ${JSON.stringify(output)}`);
  await writeFile(join(deployment, 'wrangler.toml'), config);
  await cp(join(root, 'functions'), join(deployment, 'functions'), { recursive: true });
  const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
  if (commit.status !== 0) throw new Error('Cannot identify the release commit.');
  const result = spawnSync('npm', ['exec', '--yes', '--package=wrangler@4.129.0', '--', 'wrangler',
    'pages', 'deploy', output, '--project-name', 'takmd-simple', '--branch', 'main',
    '--commit-hash', commit.stdout.trim(), '--commit-message', 'Independent miniature office'],
    { cwd: deployment, stdio: 'inherit' });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
} finally {
  await rm(deployment, { recursive: true, force: true });
}
