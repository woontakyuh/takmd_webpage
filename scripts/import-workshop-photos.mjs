import { readdir, readFile, writeFile, mkdir, rm, stat } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(root, 'content/workshops');
const output = resolve(root, 'public/images/workshops');
const manifestPath = resolve(root, 'src/data/workshop-photos.json');
const sessionsSource = await readFile(resolve(root, 'src/data/workshop-sessions.ts'), 'utf8');
const knownSessions = new Set([...sessionsSource.matchAll(/id: '(\d{4}-\d{2}-\d{2}-[a-z-]+)'/g)].map((m) => m[1]));
const roles = ['group', 'lecture', 'practice', 'venue'];
const namePattern = /^(group|lecture|practice|venue)-(\d{2})\.(jpe?g|png|webp)$/i;

const folders = (await readdir(source, { withFileTypes: true }))
  .filter((d) => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'))
  .map((d) => d.name)
  .sort();
const unknown = folders.filter((f) => !knownSessions.has(f));
if (unknown.length) {
  console.error(`Unknown session folder(s): ${unknown.join(', ')} — names must match ids in src/data/workshop-sessions.ts`);
  process.exit(1);
}

const entries = [];
for (const sessionId of folders) {
  const files = (await readdir(join(source, sessionId))).filter((n) => namePattern.test(n)).sort();
  if (!files.length) continue;
  await mkdir(join(output, sessionId), { recursive: true });
  for (const name of files) {
    const [, role, order] = name.match(namePattern);
    const bytes = await readFile(join(source, sessionId, name));
    const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
    const base = sharp(bytes).rotate();
    const full = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer({ resolveWithObject: true });
    const thumb = await base.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    await writeFile(join(output, sessionId, `${hash}.webp`), full.data);
    await writeFile(join(output, sessionId, `${hash}-thumb.webp`), thumb);
    entries.push({
      sessionId,
      role: role.toLowerCase(),
      order: Number(order),
      src: `/images/workshops/${sessionId}/${hash}.webp`,
      thumb: `/images/workshops/${sessionId}/${hash}-thumb.webp`,
      width: full.info.width,
      height: full.info.height,
    });
  }
}

if (!entries.length && !process.argv.includes('--clear')) {
  console.log('No workshop photos in content/workshops; existing manifest unchanged.');
  process.exit(0);
}

entries.sort((a, b) => a.sessionId.localeCompare(b.sessionId) || roles.indexOf(a.role) - roles.indexOf(b.role) || a.order - b.order);
await writeFile(manifestPath, JSON.stringify(entries, null, 2) + '\n');

const active = new Set(entries.flatMap((e) => [e.src, e.thumb]).map((p) => resolve(root, 'public' + p)));
await mkdir(output, { recursive: true });
for (const sessionId of await readdir(output)) {
  const dir = join(output, sessionId);
  if (!(await stat(dir)).isDirectory()) continue;
  for (const name of await readdir(dir)) {
    if (extname(name) === '.webp' && !active.has(join(dir, name))) await rm(join(dir, name));
  }
  if (!(await readdir(dir)).length) await rm(dir, { recursive: true });
}
console.log(`Imported ${entries.length} workshop photos across ${new Set(entries.map((e) => e.sessionId)).size} sessions. Originals retained; metadata removed.`);
