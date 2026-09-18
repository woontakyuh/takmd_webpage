import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';

// Unretouched source crops stay private; the public textures are reflection-cleaned edits.
const output = '.omo/evidence/certificates-2026-09-08/unretouched';
const evidence = '.omo/evidence/certificates-2026-09-08';
const sourceDirectory = '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down';

const credentials = [
  {
    id: 'ksns-permanent-membership-2022',
    source: 'IMG_0783.HEIC',
    // Paper corners in the EXIF-upright 3024 × 4032 decoded source, clockwise from top-left.
    corners: [[744, 1202], [2408, 1199], [2413, 3580], [748, 3577]],
    output: [1600, 2289],
  },
  {
    id: 'snu-master-of-science-in-medicine-2018',
    source: 'IMG_0784.HEIC',
    // Paper corners in the EXIF-upright 3024 × 4032 decoded source, clockwise from top-left.
    corners: [[677, 1195], [2206, 1181], [2182, 3355], [686, 3360]],
    output: [1600, 2240],
  },
  {
    id: 'komiss-life-membership-2023',
    source: 'IMG_0785.HEIC',
    // Paper corners in the EXIF-upright 4032 × 3024 decoded source, clockwise from top-left.
    corners: [[428, 863], [3057, 863], [3050, 2600], [525, 2650]],
    output: [2048, 1400],
  },
];

function homography(points) {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  const dx1 = topRight[0] - bottomRight[0];
  const dx2 = bottomLeft[0] - bottomRight[0];
  const dx3 = topLeft[0] - topRight[0] + bottomRight[0] - bottomLeft[0];
  const dy1 = topRight[1] - bottomRight[1];
  const dy2 = bottomLeft[1] - bottomRight[1];
  const dy3 = topLeft[1] - topRight[1] + bottomRight[1] - bottomLeft[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy2) / determinant;
  return [
    topRight[0] - topLeft[0] + g * topRight[0], bottomLeft[0] - topLeft[0] + h * bottomLeft[0], topLeft[0],
    topRight[1] - topLeft[1] + g * topRight[1], bottomLeft[1] - topLeft[1] + h * bottomLeft[1], topLeft[1], g, h,
  ];
}

function interpolate(source, sourceWidth, sourceHeight, transform, width, height) {
  const result = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const denominator = transform[6] * u + transform[7] * v + 1;
      const sourceX = (transform[0] * u + transform[1] * v + transform[2]) / denominator;
      const sourceY = (transform[3] * u + transform[4] * v + transform[5]) / denominator;
      const left = Math.max(0, Math.min(sourceWidth - 2, Math.floor(sourceX)));
      const top = Math.max(0, Math.min(sourceHeight - 2, Math.floor(sourceY)));
      const horizontal = Math.max(0, Math.min(1, sourceX - left));
      const vertical = Math.max(0, Math.min(1, sourceY - top));
      const outputPixel = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const sample = (sampleX, sampleY) => source[(sampleY * sourceWidth + sampleX) * 3 + channel];
        result[outputPixel + channel] = Math.round(
          sample(left, top) * (1 - horizontal) * (1 - vertical)
          + sample(left + 1, top) * horizontal * (1 - vertical)
          + sample(left, top + 1) * (1 - horizontal) * vertical
          + sample(left + 1, top + 1) * horizontal * vertical,
        );
      }
    }
  }
  return result;
}

async function decodeUpright(source, temporary) {
  const converted = join(temporary, 'source.tiff');
  execFileSync('sips', ['-s', 'format', 'tiff', source, '--out', converted], { stdio: 'pipe' });
  return sharp(converted).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

await mkdir(output, { recursive: true });
await mkdir(evidence, { recursive: true });
const artifacts = [];

for (const credential of credentials) {
  const source = join(sourceDirectory, credential.source);
  const sourceBytes = await readFile(source);
  const temporary = await mkdtemp(join(tmpdir(), 'takmd-certificate-'));
  let decoded;
  try {
    decoded = await decodeUpright(source, temporary);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
  const { data, info } = decoded;
  const [width, height] = credential.output;
  const rectified = interpolate(data, info.width, info.height, homography(credential.corners), width, height);
  const texturePath = `${output}/${credential.id}.webp`;
  const previewPath = `${evidence}/${credential.id}-texture-preview.png`;
  await sharp(rectified, { raw: { width, height, channels: 3 } })
    .webp({ quality: 96, smartSubsample: false }).toFile(texturePath);
  await sharp(rectified, { raw: { width, height, channels: 3 } })
    .png().toFile(previewPath);
  artifacts.push({
    id: credential.id,
    source,
    sourceSha256: createHash('sha256').update(sourceBytes).digest('hex'),
    sourceUprightPixels: [info.width, info.height],
    rectificationCorners: credential.corners,
    texture: texturePath,
    texturePixels: [width, height],
    preview: previewPath,
  });
}

const provenance = {
  generatedAt: new Date().toISOString(),
  process: 'HEIC originals are decoded through macOS sips into a disposable TIFF, EXIF-auto-rotated with sharp, and bilinearly perspective-rectified from paper-only corners. Public WebP textures contain only the document sheet; source wall and source black frames are omitted.',
  fidelityLimits: 'The original photographs retain faint real glass reflection and uneven ambient illumination. No text, seal, signature, logo, glare, or paper texture was redrawn, corrected, or generated.',
  sceneDimensionsMeters: {
    totalWidth: 1.05,
    gaps: [0.045, 0.045],
    component: {
      rootName: 'Framed academic credentials',
      localAxes: 'X horizontal, Y upward with the rear lower contact at Y=0, +Z toward the frame front.',
      leanRadiansTowardWall: 0.15,
      rearFootDepth: 0.088,
    },
    credentials: [
      { id: 'ksns-permanent-membership-2022', groupName: 'KSNS permanent member certificate', outer: [0.28, 0.38], centerX: -0.385 },
      { id: 'snu-master-of-science-in-medicine-2018', groupName: 'SNU medicine diploma', outer: [0.30, 0.41], centerX: -0.05 },
      { id: 'komiss-life-membership-2023', groupName: 'KOMISS lifetime certificate', outer: [0.38, 0.285], centerX: 0.335 },
    ],
  },
  artifacts,
};
await writeFile(`${evidence}/provenance.json`, `${JSON.stringify(provenance, null, 2)}\n`);
console.log(JSON.stringify(provenance, null, 2));
