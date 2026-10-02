import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const source = 'docs/reference-assets/2026-09-07/gold-button/IMG_0747.jpeg';
const output = 'public/models/gold-award';
const evidence = '.omo/evidence/gold-award-2026-09-07';
const width = 1536;
const height = 2304;
// Coordinates are inside the face edge, in EXIF-oriented source pixels, clockwise from top left.
const corners = [[472, 476], [2624, 508], [2603, 3553], [432, 3550]];

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
const sourceBytes = await readFile(source);
const { data, info } = await sharp(sourceBytes).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
const transform = projectiveTransform(corners);
const rectified = Buffer.alloc(width * height * 3);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const u = x / (width - 1), v = y / (height - 1);
    const denominator = transform[6] * u + transform[7] * v + 1;
    const sx = (transform[0] * u + transform[1] * v + transform[2]) / denominator;
    const sy = (transform[3] * u + transform[4] * v + transform[5]) / denominator;
    const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
    for (let channel = 0; channel < 3; channel++) {
      const sample = (px, py) => data[(py * info.width + px) * 3 + channel];
      rectified[(y * width + x) * 3 + channel] = Math.round(
        sample(ix, iy) * (1 - fx) * (1 - fy) + sample(ix + 1, iy) * fx * (1 - fy)
        + sample(ix, iy + 1) * (1 - fx) * fy + sample(ix + 1, iy + 1) * fx * fy);
    }
  }
}
await sharp(rectified, { raw: { width, height, channels: 3 } }).png().toFile(`${evidence}/rectified-face.png`);

// Keep photographed ink pixels. Alpha removes the photographic gold lighting; no glyphs are redrawn.
const ink = Buffer.alloc(width * height * 4);
const background = await sharp(rectified, { raw: { width, height, channels: 3 } }).greyscale().blur(48).raw().toBuffer();
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const index = y * width + x, rgb = index * 3, rgba = index * 4;
    const luminance = 0.2126 * rectified[rgb] + 0.7152 * rectified[rgb + 1] + 0.0722 * rectified[rgb + 2];
    const allowed = y > height * 0.397 && y < height * 0.943 && x > width * 0.065 && x < width * 0.938;
    const alpha = allowed ? Math.max(0, Math.min(1, (0.72 - luminance / background[index]) / 0.25)) : 0;
    ink[rgba + 3] = Math.round(alpha * 255);
    if (ink[rgba + 3] > 0) {
      ink[rgba] = rectified[rgb]; ink[rgba + 1] = rectified[rgb + 1]; ink[rgba + 2] = rectified[rgb + 2];
    }
  }
}
await sharp(ink, { raw: { width, height, channels: 4 } }).webp({ lossless: true }).toFile(`${output}/face-ink.webp`);

// The three vertices follow the photographed triangular badge, excluding the mirror and reflected room.
const triangle = { left: 615, top: 393, width: 296, height: 356 };
const badge = await sharp(rectified, { raw: { width, height, channels: 3 } }).extract(triangle).ensureAlpha().raw().toBuffer();
for (let y = 0; y < triangle.height; y++) {
  for (let x = 0; x < triangle.width; x++) {
    const inside = x >= 13 && y >= 8 + (x - 13) * 166 / 279 && y <= 346 - (x - 13) * 172 / 279;
    badge[(y * triangle.width + x) * 4 + 3] = inside ? 255 : 0;
    if (!inside) badge.fill(0, (y * triangle.width + x) * 4, (y * triangle.width + x) * 4 + 4);
  }
}
await sharp(badge, { raw: { width: triangle.width, height: triangle.height, channels: 4 } })
  .webp({ lossless: true }).toFile(`${output}/triangle-logo.webp`);
await sharp(rectified, { raw: { width, height, channels: 3 } })
  .extract({ left: 600, top: 90, width: 128, height: 128 }).greyscale().normalise()
  .webp({ lossless: true }).toFile(`${output}/satin-grain.webp`);
const manifest = {
  source, sha256: createHash('sha256').update(sourceBytes).digest('hex'), orientedSource: [info.width, info.height],
  faceCorners: corners, rectifiedResolution: [width, height], triangleCrop: triangle,
  dimensionsMeters: { width: 0.2, height: 0.3, depth: 0.015, leanRadians: -0.23 },
  process: 'EXIF orientation; bilinear projective rectification; original RGB ink plus luminance alpha; triangle UV crop. No generative edits or replacement lettering. Metadata stripped.',
  physicalEvidence: ['IMG_0747.jpeg: front artwork and inset', 'IMG_0750.jpeg: plain metal back, keyhole and silver rod', 'IMG_0751.jpeg: thickness and lean'],
  note: 'Dimensions are reference-based estimates, not measured. Only cropped ink, badge and satin grain textures are published. Originals and rectified face remain local.',
};
await writeFile(`${evidence}/provenance.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify(manifest, null, 2));
