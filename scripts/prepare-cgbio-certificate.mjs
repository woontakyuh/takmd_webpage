// Run with Bun: source-only planar rectification, never regenerated lettering or faces.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { projector } from '../src/components/studio/scene/AwardPrintCalibration.ts';

const sourceDir = process.argv[2];
if (!sourceDir) throw new Error('Supply the Dropbox Down directory');
const output = 'public/models/personal-awards/cgbio-2026';
const sources = [
  { name: 'group-photo', file: 'IMG_1388.HEIC', corners: [[45, 78], [946, 79], [935, 720], [45, 708]] },
  { name: 'certificate', file: 'IMG_1389.HEIC', corners: [[76, 101], [944, 110], [950, 731], [61, 726]] },
  { name: 'cover', file: 'IMG_1392.HEIC', corners: [[438, 280], [889, 259], [854, 538], [441, 579]] },
];
await mkdir(output, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'cgbio-certificate-'));
const records = [];
try {
  for (const source of sources) {
    const path = join(sourceDir, source.file);
    const converted = join(temporary, `${source.name}.tiff`);
    execFileSync('sips', ['-s', 'format', 'tiff', path, '--out', converted], { stdio: 'pipe' });
    const { data, info } = await sharp(converted).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
    const project = projector({ view: [1000, 750], corners: source.corners, samples: [] });
    const width = source.name === 'cover' ? 1200 : 2048;
    const height = Math.round(width * 210 / 297);
    const pixels = Buffer.alloc(width * height * info.channels);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const [u, v] = project((x + .5) / width, (y + .5) / height);
      const sx = Math.max(0, Math.min(info.width - 2, u * info.width));
      const sy = Math.max(0, Math.min(info.height - 2, v * info.height));
      const ix = Math.floor(sx), iy = Math.floor(sy), dx = sx - ix, dy = sy - iy;
      for (let c = 0; c < info.channels; c++) {
        const i = (iy * info.width + ix) * info.channels + c;
        pixels[(y * width + x) * info.channels + c] = Math.round(
          (data[i] * (1 - dx) + data[i + info.channels] * dx) * (1 - dy)
          + (data[i + info.width * info.channels] * (1 - dx) + data[i + (info.width + 1) * info.channels] * dx) * dy);
      }
    }
    const target = `${output}/${source.name}.webp`;
    await sharp(pixels, { raw: { width, height, channels: info.channels } }).webp({ quality: 95 }).toFile(target);
    records.push({ ...source, width, height, sha256: createHash('sha256').update(await readFile(path)).digest('hex') });
  }
  await writeFile(`${output}/provenance.json`, JSON.stringify({
    process: 'Owner photographs; HEIC decode, measured projective rectification, bilinear resampling, WebP encoding. No invented faces, lettering, signatures, dates, or logos. Surroundings excluded. IMG_1390 and IMG_1391 are shape references only and are not published.',
    dimensions: 'A4 landscape leaves and 321 × 234 mm covers estimated from photographs, not measured.',
    sources: records,
  }, null, 2));
} finally { await rm(temporary, { recursive: true, force: true }); }
