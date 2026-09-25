import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

// Projection and lighting correction belong to AwardPrintSurface; do not bake a second projection here.
const sourceDirectory =
  process.argv[2] ?? '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down';
const output = 'public/models/personal-awards/additions';
const evidence = '.omo/evidence/awards-surface-repair-2026-09-13';
const documents = [
  ['neurospine-reviewer-2025', 'IMG_0975.HEIC'],
  ['snu-masters-plaque-2018', 'IMG_0983 (1).HEIC'],
  ['wcmisst-speaker-2026', 'IMG_0984.HEIC'],
  ['kosess-academic-2025', 'IMG_0985.HEIC'],
  ['tsess-instructor-2026', 'IMG_0987.HEIC'],
];

await mkdir(output, { recursive: true });
await mkdir(evidence, { recursive: true });
const temporary = await mkdtemp(join(tmpdir(), 'takmd-award-sources-'));
const artifacts = [];
try {
  for (const [id, file] of documents) {
    const source = join(sourceDirectory, file);
    const converted = join(temporary, `${id}.tiff`);
    execFileSync('sips', ['-s', 'format', 'tiff', source, '--out', converted], {
      stdio: 'pipe',
    });
    const path = `${output}/${id}.webp`;
    const upright = await sharp(converted)
      .rotate()
      .toColourspace('srgb')
      .resize({
        width: id === 'snu-masters-plaque-2018' ? 3200 : 1600,
        height: id === 'snu-masters-plaque-2018' ? 3200 : 1600,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .raw()
      .toBuffer({ resolveWithObject: true });
    const image = sharp(upright.data, { raw: upright.info });
    const sourceWindow =
      id === 'snu-masters-plaque-2018'
        ? {
            left: Math.round(upright.info.width / 12),
            top: Math.round(upright.info.height * 0.3),
            width: Math.round((upright.info.width * 7) / 12),
            height: Math.round(upright.info.height * 0.525),
          }
        : null;
    // Keep the entire metal plate and a safety margin at source resolution; only discard its unused surroundings.
    if (sourceWindow) image.extract(sourceWindow);
    const info = await image.webp({ quality: 92 }).toFile(path);
    artifacts.push({
      id,
      source: file,
      path,
      width: info.width,
      height: info.height,
      bytes: info.size,
      sourceWindow,
      sourceSha256: createHash('sha256')
        .update(await readFile(source))
        .digest('hex'),
      outputSha256: createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    });
  }
} finally {
  await rm(temporary, { recursive: true, force: true });
}
await writeFile(
  `${evidence}/provenance.json`,
  JSON.stringify(
    {
      process:
        'Original photographs, upright size-capped conversion with metadata stripped. No generated ink, logos, seals or signatures. Measured projective UVs and calibrated print materials perform surface restoration in the scene. Thank-you card excluded.',
      artifacts,
    },
    null,
    2,
  ),
);
console.log(JSON.stringify(artifacts.map(({ id, bytes }) => ({ id, bytes }))));

execFileSync('bun', ['run', 'scripts/bake-award-metal.ts'], {
  stdio: 'inherit',
});
