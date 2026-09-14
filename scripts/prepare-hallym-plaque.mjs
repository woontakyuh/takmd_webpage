import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const originals = process.env.HALLYM_SOURCE_DIR ?? '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down';
const output = 'public/models/personal-awards/hallym';
const evidence = '.omo/evidence/awards-2026-09-08/hallym';
const width = 1472, height = 2048;
// Points are measured on the 1125 x 1500 upright diagnostic, then scaled to the original.
const faceCorners = [[257, 305], [917, 319], [866, 1131], [286, 1142]];
const leftCorners = [[138, 301], [252, 304], [282, 1140], [183, 1142]];
const rightCorners = [[921, 321], [1027, 322], [963, 1125], [872, 1129]];
const backCorners = [[161, 498], [987, 520], [816, 983], [265, 983]];

function projectiveTransform([a, b, c, d]) {
  const dx1 = b[0] - c[0], dx2 = d[0] - c[0], dx3 = a[0] - b[0] + c[0] - d[0];
  const dy1 = b[1] - c[1], dy2 = d[1] - c[1], dy3 = a[1] - b[1] + c[1] - d[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  return [b[0] - a[0] + g * b[0], d[0] - a[0] + h * d[0], a[0],
    b[1] - a[1] + g * b[1], d[1] - a[1] + h * d[1], a[1], g, h];
}

function rectify(source, corners, targetWidth, targetHeight) {
  const scale = source.info.width / 1125;
  const transform = projectiveTransform(corners.map(([x, y]) => [x * scale, y * scale]));
  const result = Buffer.alloc(targetWidth * targetHeight * 3);
  for (let y = 0; y < targetHeight; y++) for (let x = 0; x < targetWidth; x++) {
    const u = x / (targetWidth - 1), v = y / (targetHeight - 1);
    const denominator = transform[6] * u + transform[7] * v + 1;
    const sx = (transform[0] * u + transform[1] * v + transform[2]) / denominator;
    const sy = (transform[3] * u + transform[4] * v + transform[5]) / denominator;
    const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    for (let channel = 0; channel < 3; channel++) {
      const sample = (px, py) => source.data[(py * source.info.width + px) * 3 + channel];
      result[(y * targetWidth + x) * 3 + channel] = Math.round(
        sample(ix, iy) * (1 - fx) * (1 - fy) + sample(ix + 1, iy) * fx * (1 - fy)
        + sample(ix, iy + 1) * (1 - fx) * fy + sample(ix + 1, iy + 1) * fx * fy);
    }
  }
  return sharp(result, { raw: { width: targetWidth, height: targetHeight, channels: 3 } });
}

await mkdir(output, { recursive: true });
await mkdir(evidence, { recursive: true });
const sources = {};
const provenance = [];
for (const [side, filename] of [['front', 'IMG_0764.HEIC'], ['back', 'IMG_0767.HEIC']]) {
  const input = join(originals, filename), converted = join(evidence, `source-${side}.jpg`);
  execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '100', input, '--out', converted]);
  sources[side] = await sharp(converted).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bytes = await readFile(input);
  provenance.push({ filename, sha256: createHash('sha256').update(bytes).digest('hex'),
    upright: [sources[side].info.width, sources[side].info.height] });
}
const face = await rectify(sources.front, faceCorners, width, height).raw().toBuffer();
await sharp(face, { raw: { width, height, channels: 3 } }).png().toFile(`${evidence}/rectified-face.png`);
await rectify(sources.front, leftCorners, 256, 2048).webp({ quality: 94 }).toFile(`${output}/wood-left.webp`);
await rectify(sources.front, rightCorners, 256, 2048).webp({ quality: 94 }).toFile(`${output}/wood-right.webp`);
await rectify(sources.back, backCorners, 1960, 2040)
  .extract({ left: 1310, top: 100, width: 480, height: 1780 }).resize(320, 1024)
  .webp({ quality: 92 }).toFile(`${output}/wood-back.webp`);
await rectify(sources.back, backCorners, 980, 1020).png().toFile(`${evidence}/rectified-back.png`);

// Select the photographed warm engraving pixels; reflections and plate substrate become transparent.
const ink = Buffer.alloc(width * height * 4);
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const index = y * width + x, rgb = index * 3, rgba = index * 4;
  const r = face[rgb], g = face[rgb + 1], b = face[rgb + 2];
  const allowed = x > width * 0.065 && x < width * 0.94 && y > height * 0.055 && y < height * 0.690;
  const gold = Math.min(1, Math.max(0, (Math.min(r, g) - 85) / 70))
    * Math.min(1, Math.max(0, ((r + g) / 2 - b - 12) / 25));
  ink[rgba + 3] = allowed ? Math.round(gold * 255) : 0;
  if (ink[rgba + 3] > 0) { ink[rgba] = r; ink[rgba + 1] = g; ink[rgba + 2] = b; }
}
await sharp(ink, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toFile(`${output}/engraving.webp`);

const portrait = { left: 173, top: 1437, width: 1123, height: 526, radius: 106 };
const photo = await sharp(face, { raw: { width, height, channels: 3 } }).extract({
  left: portrait.left, top: portrait.top, width: portrait.width, height: portrait.height,
}).ensureAlpha().raw().toBuffer();
for (let y = 0; y < portrait.height; y++) for (let x = 0; x < portrait.width; x++) {
  const dx = Math.max(portrait.radius - x, x - (portrait.width - 1 - portrait.radius), 0);
  const dy = Math.max(portrait.radius - y, y - (portrait.height - 1 - portrait.radius), 0);
  photo[(y * portrait.width + x) * 4 + 3] = Math.round(Math.min(1, Math.max(0, portrait.radius - Math.hypot(dx, dy))) * 255);
}
await sharp(photo, { raw: { width: portrait.width, height: portrait.height, channels: 4 } })
  .webp({ quality: 96 }).toFile(`${output}/group-portrait.webp`);
await writeFile(`${evidence}/provenance.json`, `${JSON.stringify({
  sources: provenance, faceCorners, leftCorners, rightCorners, backCorners, diagnosticResolution: [1125, 1500],
  rectifiedResolution: [width, height], portrait, dimensionsMeters: { width: 0.245, height: 0.255, depth: 0.018, leanRadians: -0.2 },
  process: 'sips full-resolution HEIC to JPEG; sharp EXIF auto-orient; bilinear projective rectification; original RGB engraving pixels with chroma/luminance alpha; source portrait rounded crop; tight wood-only crops; metadata stripped from published WebP.',
  physicalEvidence: ['IMG_0764: front artwork and figured side stiles', 'IMG_0765 and IMG_0766: dark sides, plate depth, rearward lean and support', 'IMG_0767: routed vertical slot, keyhole and ribbed silver prop with black collar', 'IMG_0782: comparison with SNUH/KOMISS awards'],
  uncertainty: 'Photo-derived dimensions, lean and recess depth are estimates. Original files remain untouched. Full photos and rectified diagnostic remain local evidence only.',
}, null, 2)}\n`);
console.log(`Prepared Hallym artwork in ${output}`);
