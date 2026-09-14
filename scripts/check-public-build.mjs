import { lstat, readdir, readFile } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const root = fileURLToPath(new URL('../', import.meta.url));
const outputDir = resolve(root, process.argv[2] ?? 'dist');
const sourceDir = resolve(root, process.argv[3] ?? 'src');
const authSource = await readFile(join(root, 'src/components/DashboardWithAuth.tsx'), 'utf8');
const authTree = ts.createSourceFile('DashboardWithAuth.tsx', authSource, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
/** @type {string[]} */
const authMarkers = [];

/** @param {ts.Node} node */
function collectAuthMarkers(node) {
  if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)
    && ['PASSWORD', 'SESSION_KEY'].includes(node.name.text)
    && node.initializer && ts.isStringLiteral(node.initializer)) {
    authMarkers.push(node.initializer.text);
  }
  ts.forEachChild(node, collectAuthMarkers);
}
collectAuthMarkers(authTree);

if (authMarkers.length !== 2 || authMarkers.some((value) => !value)) {
  console.error('Public build check cannot identify the private auth markers. Update the check before publishing.');
  process.exit(1);
}

const surgeryData = JSON.parse(await readFile(join(root, 'src/data/surgery-data.json'), 'utf8'));
const lastCaseDate = surgeryData.cases?.at(-1)?.opDate;
if (typeof lastCaseDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(lastCaseDate)) {
  console.error('Public build check cannot identify the latest clinical date marker. Update the check before publishing.');
  process.exit(1);
}

/** @type {{ label: string, test: (bytes: Buffer, text: string) => boolean }[]} */
const checks = [
  { label: 'private dashboard module', test: (_bytes, text) => /DashboardWithAuth|surgery-data/.test(text) },
  { label: 'clinical dataset fields', test: (_bytes, text) => /\b(?:opDate|opCategory|preVAS|oneMonthVAS|threeMonthODI|overallStats|categoryStats|latestCase)\b/.test(text) },
  { label: 'latest clinical case date', test: (bytes) => bytes.includes(lastCaseDate) },
  { label: 'private auth value', test: (bytes) => authMarkers.some((marker) => bytes.includes(marker)) },
  { label: 'development React tooling', test: (_bytes, text) => /react-grab|react-scan|react-doctor/.test(text) },
];
const sourceExtensions = new Set(['.astro', '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts']);
const internalSources = new Set(['components/Dashboard.tsx', 'components/DashboardWithAuth.tsx']);
let scanned = 0;
let violations = 0;

/** @param {string} directory */
async function inspectSources(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    const sourcePath = relative(sourceDir, path);
    if (entry.isSymbolicLink()) {
      violations += 1;
      console.error(`Blocked source symlink in ${sourcePath}`);
    } else if (entry.isDirectory()) {
      await inspectSources(path);
    } else if (entry.isFile() && sourceExtensions.has(extname(entry.name).toLowerCase()) && !internalSources.has(sourcePath)) {
      const text = await readFile(path, 'utf8');
      const imports = ts.preProcessFile(text, true, true).importedFiles;
      if (imports.some(({ fileName }) => /(?:^|\/)(?:surgery-data\.json|Dashboard(?:WithAuth)?(?:\.[cm]?[jt]sx?)?)$/.test(fileName))) {
        violations += 1;
        console.error(`Blocked private clinical module import in ${sourcePath}`);
      }
    }
  }
}

/** @param {string} directory */
async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      violations += 1;
      console.error(`Blocked output symlink in ${relative(outputDir, path)}`);
    } else if (entry.isDirectory()) {
      await inspect(path);
    } else if (entry.isFile()) {
      scanned += 1;
      const bytes = await readFile(path);
      const text = bytes.toString('utf8');
      for (const check of checks) {
        if (check.test(bytes, text)) {
          violations += 1;
          console.error(`Blocked ${check.label} in ${relative(outputDir, path)}`);
        }
      }
    } else {
      violations += 1;
      console.error(`Blocked non-regular output in ${relative(outputDir, path)}`);
    }
  }
}

const outputInfo = await lstat(outputDir);
if (!outputInfo.isDirectory() || outputInfo.isSymbolicLink()) {
  console.error('Public build output must be a regular directory, not a symlink.');
  process.exit(1);
}
await inspectSources(sourceDir);
await inspect(outputDir);
if (!scanned) {
  console.error('Public build check found no assets. Run the build first.');
  process.exit(1);
}
if (violations) {
  console.error(`Public build check failed: ${violations} marker groups detected. Matched values are never logged.`);
  process.exit(1);
}
console.log(`Public build check passed: ${scanned} assets contain no private dashboard, clinical dataset, auth, or dev-tool markers.`);
