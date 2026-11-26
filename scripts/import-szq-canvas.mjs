import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

// Input is the upright, full-resolution PNG decoded from the owner's IMG_1453.HEIC.
// Registration retains the original paint, exposed canvas, and handwritten date.
const input = process.argv[2];
if (!input) throw new Error('Pass the upright IMG_1453 PNG as the first argument.');
const output = resolve('public/models/personal-art');
await mkdir(output, { recursive: true });
const { data, info } = await sharp(input).rotate().removeAlpha().toColourspace('srgb').raw().toBuffer({ resolveWithObject: true });
if (info.width !== 3024 || info.height !== 4032 || info.channels !== 3) {
  throw new Error('Expected the upright 3024 × 4032 RGB original of IMG_1453; do not pass a crop or thumbnail.');
}
// Corners were registered on the 1200 × 1600 inspection copy of this same photo.
const referenceWidth = 1200, referenceHeight = 1600;
const corners = [[239, 321], [981, 326], [940, 1238], [261, 1235]]
  .map(([x, y]) => [x / referenceWidth * info.width, y / referenceHeight * info.height]);
const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = corners;
const dx1 = x1 - x2, dx2 = x3 - x2, dx3 = x0 - x1 + x2 - x3;
const dy1 = y1 - y2, dy2 = y3 - y2, dy3 = y0 - y1 + y2 - y3;
const determinant = dx1 * dy2 - dx2 * dy1;
const g = (dx3 * dy2 - dx2 * dy3) / determinant;
const h = (dx1 * dy3 - dx3 * dy1) / determinant;
const a = x1 - x0 + g * x1, b = x3 - x0 + h * x3;
const d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
const width = 1536, height = 2048;
const pixels = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1), divisor = g * u + h * v + 1;
    const sx = (a * u + b * v + x0) / divisor, sy = (d * u + e * v + y0) / divisor;
    const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    for (let c = 0; c < 3; c++) {
      const sample = (px, py) => data[(Math.min(info.height - 1, py) * info.width + Math.min(info.width - 1, px)) * info.channels + c];
      pixels[(y * width + x) * 3 + c] = Math.round(
        sample(ix, iy) * (1 - fx) * (1 - fy) + sample(ix + 1, iy) * fx * (1 - fy)
        + sample(ix, iy + 1) * (1 - fx) * fy + sample(ix + 1, iy + 1) * fx * fy);
    }
  }
}
const face = sharp(pixels, { raw: { width, height, channels: 3 } });
await face.clone().webp({ quality: 92 }).toFile(resolve(output, 'szq-canvas-2020.webp'));
// High-pass relief is a restrained lighting cue, not a measured reconstruction.
// Remove broad pigment/lighting variation; leave the white border and ink flat.
const bw = 768, bh = 1024;
const gray = await face.clone().resize(bw, bh).greyscale().raw().toBuffer();
const smooth = await sharp(gray, { raw: { width: bw, height: bh, channels: 1 } }).blur(5).raw().toBuffer();
const relief = Buffer.alloc(bw * bh);
for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
  const i = y * bw + x;
  const edge = Math.min(x / bw - .036, .956 - x / bw, y / bh - .037, .966 - y / bh);
  const fade = Math.max(0, Math.min(1, edge / .012));
  relief[i] = Math.round(128 + Math.max(-80, Math.min(80, (gray[i] - smooth[i]) * 2)) * fade);
}
await sharp(relief, { raw: { width: bw, height: bh, channels: 1 } })
  .webp({ quality: 85 }).toFile(resolve(output, 'szq-canvas-2020-relief.webp'));
console.log('Registered original face and subtle relief map written.');
