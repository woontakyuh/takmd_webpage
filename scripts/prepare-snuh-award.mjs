import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down/IMG_0768.HEIC';
const output = 'public/models/personal-awards/snuh';
const evidence = '.omo/evidence/awards-2026-09-08/snuh';
const width = 1024, height = 2304;
// Coordinates measured on the upright 1125 × 1500 review, including virtual unclipped lower corners.
const corners = [[365, 322], [757, 322], [707, 1070], [401, 1070]];
const whiteRegions = [[467, 523, 650, 565], [546, 674, 679, 723], [444, 757, 670, 907],
  [497, 936, 617, 953], [465, 982, 648, 1001]];
const goldRegions = [[469, 405, 651, 489], [439, 570, 680, 636]];

function projectiveTransform(points) {
  const [a, b, c, d] = points;
  const dx1 = b[0] - c[0], dx2 = d[0] - c[0], dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1], dy2 = d[1] - c[1], dy3 = a[1] - b[1] + c[1] - d[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  return [b[0] - a[0] + g * b[0], d[0] - a[0] + h * d[0], a[0],
    b[1] - a[1] + g * b[1], d[1] - a[1] + h * d[1], a[1], g, h];
}

await mkdir(output, { recursive: true });
await mkdir(evidence, { recursive: true });
execFileSync('sips', ['-s', 'format', 'png', source, '--out', `${evidence}/source-oriented.png`], { stdio: 'ignore' });
const sourceBytes = await readFile(source);
const { data, info } = await sharp(`${evidence}/source-oriented.png`).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
const sourceScale = info.height / 1500;
const transform = projectiveTransform(corners);
const rectified = Buffer.alloc(width * height * 3);
const coordinates = new Float32Array(width * height * 2);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1);
    const denominator = transform[6] * u + transform[7] * v + 1;
    const px = (transform[0] * u + transform[1] * v + transform[2]) / denominator;
    const py = (transform[3] * u + transform[4] * v + transform[5]) / denominator;
    const sx = px * sourceScale, sy = py * sourceScale;
    const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    const index = y * width + x;
    coordinates[index * 2] = px; coordinates[index * 2 + 1] = py;
    for (let channel = 0; channel < 3; channel++) {
      const sample = (a, b) => data[(b * info.width + a) * 3 + channel];
      rectified[index * 3 + channel] = Math.round(
        sample(ix, iy) * (1 - fx) * (1 - fy) + sample(ix + 1, iy) * fx * (1 - fy)
        + sample(ix, iy + 1) * (1 - fx) * fy + sample(ix + 1, iy + 1) * fx * fy);
    }
  }
}
await sharp(rectified, { raw: { width, height, channels: 3 } }).png().toFile(`${evidence}/rectified-face.png`);
const background = await sharp(rectified, { raw: { width, height, channels: 3 } }).greyscale().blur(20).raw().toBuffer();
for (const [kind, regions] of [['white', whiteRegions], ['gold', goldRegions]]) {
  const ink = Buffer.alloc(width * height * 4);
  for (let index = 0; index < width * height; index++) {
    const px = coordinates[index * 2], py = coordinates[index * 2 + 1];
    if (!regions.some(([left, top, right, bottom]) => px >= left && px <= right && py >= top && py <= bottom)) continue;
    const rgb = index * 3, rgba = index * 4;
    const r = rectified[rgb], g = rectified[rgb + 1], b = rectified[rgb + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const contrast = Math.max(0, Math.min(1, (luminance - background[index] - 24) / 55));
    const tint = kind === 'gold' ? Math.max(0, Math.min(1, (r - b - 23) / 35)) : 1;
    const bright = Math.max(0, Math.min(1, (luminance - 105) / 55));
    ink[rgba + 3] = Math.round(255 * (kind === 'gold' ? bright : Math.min(contrast, bright)) * tint);
    if (ink[rgba + 3] > 0) {
      ink[rgba] = r; ink[rgba + 1] = g; ink[rgba + 2] = b;
    }
  }
  await sharp(ink, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toFile(`${output}/${kind}-ink.webp`);
  await sharp(ink, { raw: { width, height, channels: 4 } }).flatten({ background: '#111311' }).png().toFile(`${evidence}/${kind}-ink-review.png`);
}
const provenance = {
  source, sha256: createHash('sha256').update(sourceBytes).digest('hex'), orientedSource: [info.width, info.height],
  referenceReviewSize: [1125, 1500], rectificationCorners: corners, rectifiedResolution: [width, height], whiteRegions, goldRegions,
  process: 'sips HEIC decode; EXIF orientation; bilinear projective rectification; locally contrasted original RGB lettering and ornament pixels on transparent alpha. Metadata stripped. No recreated text, logo, or photographic object background is published.',
  geometrySources: ['IMG_0768: front outline, artwork and stepped pedestal', 'IMG_0769–0770: separate forward black plate and thick rear clear slab', 'IMG_0771–0773: clear slab concave top and circular dark joining area', 'IMG_0774: beveled wave profile', 'IMG_0782: relative award proportions'],
  artworkPlaneMeters: { width: 0.108, height: 0.234, centerY: 0.153, frontZ: 0.01405 },
  note: 'Source photographs remain local and unchanged. Dimensions are estimates from photos, not measured dimensions.',
};
await writeFile(`${evidence}/provenance.json`, `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify({ textures: ['white-ink.webp', 'gold-ink.webp'], orientedSource: provenance.orientedSource, sha256: provenance.sha256 }));
