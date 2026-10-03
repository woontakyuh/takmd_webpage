import { spawn } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { startPublicPreview } from './preview-public-build.mjs';

// Exercise built assets with the same response policies as the public host.
const evidence = resolve(process.env.RELEASE_EVIDENCE_DIR ?? '.omo/evidence/release-readiness');
await mkdir(evidence, { recursive: true });
const preview = await startPublicPreview(resolve('dist'));
const officeStyle = (await readFile('dist/index.html', 'utf8')).includes('data-office-style="simple"') ? 'simple' : 'detailed';
const results = [];
try {
  for (const [name, file] of [
    ['loading', 'test-office-loading.mjs'],
    ['desk-entry', 'test-desk-entry.mjs'],
    ['mobile-entry-cold', 'test-entry-mobile-cold.mjs'],
    ['mobile-cv', 'test-mobile-cv.mjs'],
    ['arrangement', 'test-arrangement-camera.mjs'],
    ['whisky', 'test-whisky-switching.mjs'],
    ['reader', 'test-reading-panel.mjs'],
    ['content', 'test-office-content.mjs'],
    ['artwork', 'test-artwork-navigation.mjs'],
    ['headers', 'test-public-headers-browser.mjs'],
    ['media', 'test-office-media.mjs'],
    ['visibility', 'test-office-visibility.mjs'],
    ['touch', 'test-office-touch.mjs'],
    ['family-photo', 'test-family-photo.mjs'],
    ['cadence', 'test-office-cadence.mjs'],
  ]) {
    console.log(`Release browser check: ${name}`);
    const started = Date.now();
    const exitCode = await new Promise((accept, reject) => {
      const child = spawn(process.execPath, [join('scripts', file)], {
        stdio: 'inherit',
        env: { ...process.env, PUBLIC_OFFICE_STYLE: officeStyle, RELEASE_BASE_URL: preview.origin, OFFICE_TEST_URL: preview.origin + '/', OFFICE_TEST_EVIDENCE: join(evidence, name) },
      });
      child.once('error', reject);
      child.once('exit', code => accept(code ?? 1));
    });
    results.push({ name, exitCode, durationMs: Date.now() - started });
    if (exitCode !== 0) throw new Error(`Release browser check failed: ${name}`);
  }
} finally {
  await preview.close();
  await writeFile(join(evidence, 'browser-results.json'), JSON.stringify(results, null, 2));
}
console.log('All release browser checks passed.');
