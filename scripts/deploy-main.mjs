import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const html = await readFile(new URL('../dist/index.html', import.meta.url), 'utf8');
if (!html.includes('rel="canonical" href="https://takmd.com/"') || !html.includes('data-office-style="simple"')) {
  throw new Error('Main deployment requires the lightweight office build with the takmd.com canonical URL.');
}
const commit = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' });
if (commit.status !== 0) throw new Error('Cannot identify the release commit.');
const result = spawnSync('npm', ['exec', '--yes', '--package=wrangler@4.129.0', '--', 'wrangler',
  'pages', 'deploy', 'dist', '--project-name', 'takmdwebpage', '--branch', 'main',
  '--commit-hash', commit.stdout.trim(), '--commit-message', 'Faithful lightweight office and mobile entry'],
  { cwd: root, stdio: 'inherit' });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
