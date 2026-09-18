import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const guard = join(root, 'scripts/check-public-build.mjs');
const privateData = JSON.parse(await readFile(join(root, 'src/data/surgery-data.json'), 'utf8'));
const lastCaseDate = privateData.cases.at(-1).opDate;
assert.equal(typeof lastCaseDate, 'string');
const authSource = await readFile(join(root, 'src/components/DashboardWithAuth.tsx'), 'utf8');
const authTree = ts.createSourceFile('auth.tsx', authSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
/** @type {Map<string, string>} */
const authMarkers = new Map();
for (const statement of authTree.statements) {
  if (!ts.isVariableStatement(statement)) continue;
  for (const declaration of statement.declarationList.declarations) {
    if (ts.isIdentifier(declaration.name) && ['PASSWORD', 'SESSION_KEY'].includes(declaration.name.text)
      && declaration.initializer && ts.isStringLiteral(declaration.initializer)) {
      authMarkers.set(declaration.name.text, declaration.initializer.text);
    }
  }
}
const passwordMarker = authMarkers.get('PASSWORD');
const sessionMarker = authMarkers.get('SESSION_KEY');
assert.ok(passwordMarker && sessionMarker, 'Private auth test markers must remain identifiable.');

/** @type {{ name: string, expected: number, file?: string, content?: string | Buffer, source?: string, sourceFile?: string, link?: 'file' | 'directory' | 'root' }[]} */
const scenarios = [
  { name: 'public totals allowed', expected: 0, file: 'summary.JSON', content: JSON.stringify({ totalCases: 1, categoryCounts: { UBE: 1 } }) },
  { name: 'ordinary binary allowed', expected: 0, file: 'asset.bin', content: Buffer.from([0, 255, 128, 16]) },
  ...['js', 'html', 'txt', 'csv', 'svg', 'JSON', 'bin', ''].map((extension) => ({
    name: `clinical marker blocked in ${extension || 'extensionless'} asset`,
    expected: 1,
    file: extension ? `payload.${extension}` : 'payload',
    content: 'opCategory',
  })),
  { name: 'password marker blocked and redacted', expected: 1, file: 'auth.txt', content: passwordMarker },
  { name: 'session marker blocked and redacted', expected: 1, file: 'session.txt', content: sessionMarker },
  { name: 'last clinical date blocked and redacted', expected: 1, file: 'date.txt', content: lastCaseDate },
  { name: 'development tool blocked', expected: 1, file: 'tool.js', content: 'import("react-scan")' },
  { name: 'private Astro import blocked', expected: 1, sourceFile: 'route.astro', source: '---\nimport data from "../data/surgery-data.json";\n---\n<main />' },
  { name: 'private dynamic import blocked', expected: 1, sourceFile: 'route.ts', source: 'void import("../components/DashboardWithAuth")' },
  { name: 'file symlink blocked', expected: 1, link: 'file' },
  { name: 'directory symlink blocked', expected: 1, link: 'directory' },
  { name: 'output root symlink blocked', expected: 1, link: 'root' },
];

for (const scenario of scenarios) {
  const fixture = await mkdtemp(join(tmpdir(), 'takmd-public-build-'));
  try {
    // Given: an isolated public output and source tree, with one candidate regression.
    const output = join(fixture, 'dist');
    const sources = join(fixture, 'src');
    await mkdir(output);
    await mkdir(sources);
    await writeFile(join(output, 'index.html'), '<main>Public site</main>');
    if (scenario.file && scenario.content !== undefined) await writeFile(join(output, scenario.file), scenario.content);
    if (scenario.sourceFile && scenario.source) await writeFile(join(sources, scenario.sourceFile), scenario.source);
    if (scenario.link === 'file') await symlink(join(output, 'index.html'), join(output, 'linked.txt'));
    if (scenario.link === 'directory') await symlink(sources, join(output, 'linked-dir'));
    const outputArgument = scenario.link === 'root' ? join(fixture, 'linked-root') : output;
    if (scenario.link === 'root') await symlink(output, outputArgument);

    // When: the actual public-build CLI checks the fixture.
    const result = spawnSync(process.execPath, [guard, outputArgument, sources], { encoding: 'utf8' });

    // Then: the boundary verdict is correct and matched private values stay out of logs.
    assert.equal(result.status, scenario.expected, scenario.name);
    const logs = `${result.stdout}${result.stderr}`;
    assert.ok(!logs.includes(lastCaseDate), `${scenario.name}: clinical date leaked in logs`);
    for (const marker of authMarkers.values()) assert.ok(!logs.includes(marker), `${scenario.name}: auth marker leaked in logs`);
    console.log(`PASS: ${scenario.name}`);
  } finally {
    await rm(fixture, { recursive: true, force: true });
  }
}

console.log(`Public-build boundary: ${scenarios.length} CLI scenarios passed.`);
