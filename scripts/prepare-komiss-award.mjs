import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

const source = process.argv[2] ?? '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down/IMG_0777.HEIC';
const output = 'public/models/personal-awards/komiss';
const evidence = '.omo/evidence/awards-2026-09-08/komiss';
const width = 1200, height = 2760;
// Virtual rectangular plane around the tapered face, in the upright 1125 × 1500 diagnostic.
// The artwork is rectified as one plane; its original glyph shapes are never redrawn.
const diagnosticCorners = [[365, 305], [777, 311], [769, 1294], [334, 1288]];
const corners = diagnosticCorners.map(point => point.map(value => value * 3024 / 1125));

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
const temporary = await mkdtemp(join(tmpdir(), 'komiss-artwork-'));
let decoded;
try {
  const converted = join(temporary, 'source.tiff');
  execFileSync('sips', ['-s', 'format', 'tiff', source, '--out', converted], { stdio: 'pipe' });
  decoded = await sharp(converted).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
} finally {
  await rm(temporary, { recursive: true, force: true });
}
const { data, info } = decoded;
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

const ink = Buffer.alloc(width * height * 4);
const logo = Buffer.alloc(width * height * 4);
const clamp = value => Math.max(0, Math.min(1, value));
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const pixel = y * width + x, rgb = pixel * 3, rgba = pixel * 4;
    const r = rectified[rgb], g = rectified[rgb + 1], b = rectified[rgb + 2];
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const inLogo = ((x - 608) / 295) ** 2 + ((y - 444) / 300) ** 2 < 1;
    const inText = x > 112 && x < 1111 && y > 1290 && y < 2568;
    const isSeal = x > 842 && x < 1031 && y > 2400 && y < 2568;
    const white = clamp((Math.min(r, g, b) - 73) / 141);
    const red = clamp((r - Math.max(g, b) - 15) / 90);
    if (inText) {
      const alpha = isSeal ? Math.max(white, red) : white;
      ink[rgba + 3] = Math.round(alpha * 255);
      if (alpha > 0) {
        ink[rgba] = isSeal ? r : 235; ink[rgba + 1] = isSeal ? g : 235; ink[rgba + 2] = isSeal ? b : 229;
      }
    }
    if (inLogo) {
      const blue = clamp((b - r - 6) / 65);
      const alpha = Math.max(clamp((luminance - 59) / 157), red, blue);
      logo[rgba + 3] = Math.round(alpha * 255);
      if (alpha > 0) {
        logo[rgba] = r; logo[rgba + 1] = g; logo[rgba + 2] = b;
      }
    }
  }
}
const inkCrop = { left: 110, top: 1290, width: 1005, height: 1278 };
const logoCrop = { left: 310, top: 140, width: 600, height: 610 };
await sharp(ink, { raw: { width, height, channels: 4 } }).extract(inkCrop)
  .webp({ lossless: true }).toFile(`${output}/membership-engraving.webp`);
await sharp(logo, { raw: { width, height, channels: 4 } }).extract(logoCrop)
  .webp({ lossless: true }).toFile(`${output}/komiss-logo.webp`);
for (const name of ['membership-engraving', 'komiss-logo']) {
  await sharp(`${output}/${name}.webp`).flatten({ background: '#20282b' })
    .png().toFile(`${evidence}/${name}-preview.png`);
}
const manifest = {
  source, sha256: createHash('sha256').update(sourceBytes).digest('hex'), orientedResolution: [info.width, info.height],
  diagnosticCorners, fullResolutionCorners: corners, rectifiedResolution: [width, height], inkCrop, logoCrop,
  process: 'sips TIFF decode in disposable temporary directory; EXIF orientation; bilinear homography; artwork-region and luminance/chroma alpha masks. Original logo and glyph contours, no generative edits or replacement typography. Public WebP assets contain no EXIF or ICC metadata.',
  physicalEvidence: {
    IMG_0775: 'front left, bevels and lower corner clips', IMG_0776: 'high left front, glass thickness',
    IMG_0777: 'near frontal, all source artwork and arch profile', IMG_0778: 'right profile, plate depth and base projection',
    IMG_0779: 'plain polished black back, reverse diagonal band, rear gold arch',
    IMG_0780: 'side, cast support opening and retaining screws', IMG_0781: 'hand-held, paired open arch feet',
    IMG_0782: 'relative proportions beside SNUH and Hallym plaques',
  },
  dimensionsMeters: { overallHeight: 0.29, plateWidth: 0.12, plateDepth: 0.015, baseWidth: 0.132, baseDepth: 0.058 },
  note: 'Dimensions estimated from multi-angle photos, not physically measured. Full photographs and office reflections remain local; only isolated award artwork is published.',
};
await writeFile(`${evidence}/provenance.json`, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(JSON.stringify({ assets: output, evidence, sourceSha256: manifest.sha256 }, null, 2));
