import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const source = process.argv[2];
if (!source) throw new Error('Provide the directory containing the original TSESS photographs.');
const output = 'public/images/workshops/2026-06-08-tsess';
const photos = [
  ['IMG_6359.JPG', 'Faculty and participants · TSESS 2026'],
  ['IMG_6292.HEIC', 'Endoscopic skills training'],
  ['IMG_6299.HEIC', 'Teaching at the endoscopy station'],
  ['IMG_6318.JPG', 'Hands-on training with endoscopic visualization'],
  ['IMG_6320.JPG', 'Faculty-guided practice'],
  ['IMG_6329.JPG', 'Discussion at the training station'],
  ['IMG_6270.HEIC', 'Workshop lecture session'],
  ['IMG_6429.JPG', 'Faculty at the Medical Simulation Center'],
  ['IMG_6360.JPG', 'International faculty exchange'],
  ['IMG_6438.JPG', 'Workshop faculty colleagues'],
  ['IMG_6439.JPG', 'Together after the workshop'],
  ['IMG_6355.HEIC', 'Connecting with fellow instructors'],
  ['IMG_6375.HEIC', 'Faculty exchange between sessions'],
  ['IMG_6442.JPG', 'Workshop colleagues'],
  ['IMG_6443.JPG', 'Conversations between sessions'],
  ['IMG_6260.HEIC', 'Tzu Chi University · Hualien, Taiwan'],
  ['IMG_6387.HEIC', 'Inside the workshop venue'],
  ['IMG_6405.HEIC', 'Tzu Chi Medical Simulation Center'],
];
const temporary = await mkdtemp(join(tmpdir(), 'takmd-tsess-'));
const entries = [];
await mkdir(output, { recursive: true });
try {
  for (const [index, [filename, caption]] of photos.entries()) {
    let input = join(source, filename);
    if (/\.heic$/i.test(filename)) {
      const converted = join(temporary, `${index}.tiff`);
      execFileSync('sips', ['-s', 'format', 'tiff', input, '--out', converted], { stdio: 'ignore' });
      input = converted;
    }
    const name = `photo-${String(index + 1).padStart(2, '0')}`;
    const base = sharp(input).rotate().toColourspace('srgb');
    const full = await base.clone().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).webp({ quality: 84 }).toFile(`${output}/${name}.webp`);
    await base.clone().resize({ width: 480, height: 480, fit: 'inside', withoutEnlargement: true }).webp({ quality: 78 }).toFile(`${output}/${name}-thumb.webp`);
    entries.push({ src: `/images/workshops/2026-06-08-tsess/${name}.webp`, thumbnail: `/images/workshops/2026-06-08-tsess/${name}-thumb.webp`, caption, width: full.width, height: full.height });
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
await writeFile('src/data/tsess-workshop-photos.json', `${JSON.stringify(entries, null, 2)}\n`);
console.log(`Imported ${entries.length} TSESS photographs with upright, metadata-free full images and thumbnails.`);
