import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import {
  AWARD_PRINTS,
  printGeometry,
  restoredMetalMap,
} from '../src/components/studio/scene/AwardPrintCalibration';
const root = 'public/models/personal-awards/additions/';
const spec = AWARD_PRINTS['snu-masters-plaque-2018'];
const source = root + 'snu-masters-plaque-2018.webp';
const calibration = await sharp(source)
  .resize(
    spec.calibrationWidth!,
    Math.round((spec.calibrationWidth! * spec.view[1]) / spec.view[0]),
  )
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const original = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const geometry = printGeometry(
  0.181,
  0.257,
  { data: calibration.data, ...calibration.info },
  spec,
);
const map = restoredMetalMap(
  { data: original.data, ...original.info },
  spec,
  geometry,
  0.257 / 0.181,
);
const { data, width, height } = map.image;
const pixels = Buffer.from(data as Uint8Array);
const color = root + 'snu-masters-metal-surface.webp';
const ink = root + 'snu-masters-metal-ink.png';
await sharp(pixels, { raw: { width, height, channels: 4 } })
  .flip()
  .removeAlpha()
  .webp({ quality: 96, effort: 6 })
  .toFile(color);
await sharp(pixels, { raw: { width, height, channels: 4 } })
  .flip()
  .extractChannel(3)
  .png({ compressionLevel: 9 })
  .toFile(ink);
map.dispose();
geometry.dispose();
const receipt = {
  source,
  sourceSha256: createHash('sha256')
    .update(await readFile(source))
    .digest('hex'),
  width,
  height,
  outputs: await Promise.all(
    [color, ink].map(async (path) => ({
      path,
      bytes: (await readFile(path)).length,
      sha256: createHash('sha256')
        .update(await readFile(path))
        .digest('hex'),
    })),
  ),
};
await writeFile(
  '.omo/evidence/awards-surface-repair-2026-09-13/metal-bake.json',
  JSON.stringify(receipt, null, 2),
);
console.log(JSON.stringify(receipt));
