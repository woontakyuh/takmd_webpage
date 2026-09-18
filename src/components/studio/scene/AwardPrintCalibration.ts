import {
  BufferAttribute,
  Color,
  DataTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  PlaneGeometry,
} from 'three';
export type PrintPixels = {
  data: Uint8Array | Uint8ClampedArray;
  width: number;
  height: number;
};

type Point = readonly [number, number];
type PrintSpec = {
  view: Point;
  corners: readonly [Point, Point, Point, Point];
  samples: readonly Point[];
  metal?: boolean;
  calibrationWidth?: number;
  sampleStep?: number;
};
const PAPER_SAMPLES: readonly Point[] = [
  [0.14, 0.18],
  [0.5, 0.15],
  [0.87, 0.18],
  [0.14, 0.34],
  [0.5, 0.34],
  [0.87, 0.34],
  [0.13, 0.58],
  [0.5, 0.56],
  [0.88, 0.58],
  [0.16, 0.72],
  [0.5, 0.72],
  [0.85, 0.72],
  [0.4, 0.91],
  [0.7, 0.91],
];
export const AWARD_PRINTS: Readonly<Record<string, PrintSpec>> = {
  'neurospine-reviewer-2025': {
    view: [1200, 900],
    corners: [
      [187, 134],
      [1119, 138],
      [1114, 793],
      [187, 786],
    ],
    samples: [
      [0.16, 0.15],
      [0.5, 0.17],
      [0.85, 0.15],
      [0.14, 0.32],
      [0.5, 0.36],
      [0.84, 0.32],
      [0.2, 0.47],
      [0.5, 0.47],
      [0.77, 0.47],
      [0.18, 0.64],
      [0.5, 0.69],
      [0.73, 0.64],
      [0.16, 0.91],
      [0.46, 0.91],
      [0.68, 0.91],
    ],
  },
  'kosess-academic-2025': {
    view: [900, 1200],
    corners: [
      [64, 73],
      [805, 71],
      [803, 1084],
      [96, 1100],
    ],
    samples: PAPER_SAMPLES,
  },
  'wcmisst-speaker-2026': {
    view: [900, 1200],
    corners: [
      [42, 340],
      [849, 348],
      [833, 953],
      [49, 945],
    ],
    samples: [
      [0.14, 0.4],
      [0.85, 0.4],
      [0.2, 0.56],
      [0.5, 0.6],
      [0.8, 0.56],
      [0.12, 0.67],
      [0.88, 0.67],
      [0.16, 0.77],
      [0.5, 0.77],
      [0.84, 0.77],
    ],
  },
  'tsess-instructor-2026': {
    view: [900, 1200],
    corners: [
      [32, 322],
      [859, 323],
      [860, 896],
      [41, 909],
    ],
    samples: [
      [0.33, 0.1],
      [0.55, 0.14],
      [0.72, 0.24],
      [0.35, 0.38],
      [0.7, 0.39],
      [0.23, 0.47],
      [0.8, 0.48],
      [0.26, 0.67],
      [0.5, 0.69],
      [0.74, 0.68],
      [0.32, 0.85],
      [0.68, 0.85],
    ],
  },
  'snu-masters-plaque-2018': {
    view: [525, 630],
    calibrationWidth: 448,
    sampleStep: 0.006,
    corners: [
      [19, 79],
      [418, 15],
      [497, 487],
      [147, 610],
    ],
    metal: true,
    samples: [
      [0.27, 0.05],
      [0.5, 0.05],
      [0.73, 0.05],
      [0.27, 0.15],
      [0.73, 0.15],
      [0.26, 0.28],
      [0.74, 0.28],
      [0.26, 0.4],
      [0.74, 0.4],
      [0.12, 0.47],
      [0.26, 0.47],
      [0.45, 0.48],
      [0.61, 0.48],
      [0.77, 0.48],
      [0.88, 0.48],
      [0.12, 0.54],
      [0.26, 0.58],
      [0.42, 0.59],
      [0.61, 0.58],
      [0.8, 0.58],
      [0.89, 0.59],
      [0.12, 0.69],
      [0.39, 0.69],
      [0.62, 0.69],
      [0.83, 0.69],
      [0.12, 0.8],
      [0.27, 0.8],
      [0.68, 0.8],
      [0.89, 0.8],
      [0.29, 0.92],
      [0.51, 0.94],
      [0.71, 0.94],
    ],
  },
};

function projector({ view, corners }: PrintSpec) {
  const [a, b, c, d] = corners,
    x1 = b[0] - c[0],
    x2 = d[0] - c[0],
    x3 = a[0] - b[0] + c[0] - d[0],
    y1 = b[1] - c[1],
    y2 = d[1] - c[1],
    y3 = a[1] - b[1] + c[1] - d[1];
  const det = x1 * y2 - x2 * y1,
    g = (x3 * y2 - x2 * y3) / det,
    h = (x1 * y3 - x3 * y1) / det;
  return (u: number, v: number): Point => [
    ((b[0] - a[0] + g * b[0]) * u + (d[0] - a[0] + h * d[0]) * v + a[0]) /
      (g * u + h * v + 1) /
      view[0],
    ((b[1] - a[1] + g * b[1]) * u + (d[1] - a[1] + h * d[1]) * v + a[1]) /
      (g * u + h * v + 1) /
      view[1],
  ];
}

export function printGeometry(
  width: number,
  height: number,
  picture: PrintPixels,
  spec: PrintSpec,
) {
  const project = projector(spec),
    canvas = picture,
    pixels = picture.data;
  const samples = spec.samples.map(([u, v]) => {
    const [x, y] = project(u, v),
      values: number[][] = [[], [], []];
    for (let dy = -5; dy <= 5; dy++)
      for (let dx = -5; dx <= 5; dx++) {
        const i =
          (Math.max(
            0,
            Math.min(canvas.height - 1, Math.round(y * canvas.height) + dy),
          ) *
            canvas.width +
            Math.max(
              0,
              Math.min(canvas.width - 1, Math.round(x * canvas.width) + dx),
            )) *
          4;
        for (let c = 0; c < 3; c++) values[c].push(pixels[i + c] / 255);
      }
    const white = values.map(
      (channel) =>
        channel.sort((a, b) => a - b)[Math.floor(channel.length * 0.85)],
    );
    return {
      u,
      v,
      light: new Color().setRGB(white[0], white[1], white[2], 'srgb'),
    };
  });
  const geometry = new PlaneGeometry(width, height, 32, 32),
    uv = geometry.getAttribute('uv'),
    gains = new Float32Array(uv.count * 3),
    target = new Color(spec.metal ? '#d6d4cb' : '#f5f3ed');
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i),
      v = 1 - uv.getY(i),
      source = project(u, v),
      light = new Color(0, 0, 0);
    let sum = 0;
    for (const sample of samples) {
      const weight =
        1 / Math.pow(0.003 + (u - sample.u) ** 2 + (v - sample.v) ** 2, 2);
      light.r += sample.light.r * weight;
      light.g += sample.light.g * weight;
      light.b += sample.light.b * weight;
      sum += weight;
    }
    gains.set(
      [
        target.r / Math.max(0.04, light.r / sum),
        target.g / Math.max(0.04, light.g / sum),
        target.b / Math.max(0.04, light.b / sum),
      ],
      i * 3,
    );
    uv.setXY(i, source[0], 1 - source[1]);
  }
  geometry.setAttribute('printGain', new BufferAttribute(gains, 3));
  return geometry;
}

// Restore before generating mipmaps: thresholding an already filtered source erodes small lettering.
export function restoredMetalMap(
  source: PrintPixels,
  spec: PrintSpec,
  geometry: PlaneGeometry,
  aspect: number,
) {
  const canvas = source,
    pixels = source.data;
  const width = 1024,
    height = Math.round(width * aspect);
  const output = new Uint8Array(width * height * 4);
  const gains = geometry.getAttribute('printGain').array;
  const project = projector(spec);
  const linear = Float32Array.from(
    { length: 256 },
    (_, i) => new Color().setRGB(i / 255, 0, 0, 'srgb').r,
  );
  const encoded = Uint8Array.from({ length: 8192 }, (_, i) =>
    Math.round(
      new Color(i / 8191, 0, 0).getRGB({ r: 0, g: 0, b: 0 }, 'srgb').r * 255,
    ),
  );
  const smooth = (a: number, b: number, value: number) => {
    const t = Math.max(0, Math.min(1, (value - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  const sample = (x: number, y: number, channel: number) => {
    const sx = Math.max(0, Math.min(canvas.width - 1.001, x));
    const sy = Math.max(0, Math.min(canvas.height - 1.001, y));
    const left = Math.floor(sx),
      top = Math.floor(sy),
      dx = sx - left,
      dy = sy - top;
    const i = (top * canvas.width + left) * 4 + channel;
    return (
      (linear[pixels[i]] * (1 - dx) + linear[pixels[i + 4]] * dx) * (1 - dy) +
      (linear[pixels[i + canvas.width * 4]] * (1 - dx) +
        linear[pixels[i + canvas.width * 4 + 4]] * dx) *
        dy
    );
  };
  const gain = (u: number, v: number, channel: number) => {
    const x = Math.min(31.9999, u * 32),
      y = Math.min(31.9999, v * 32);
    const left = Math.floor(x),
      top = Math.floor(y),
      dx = x - left,
      dy = y - top;
    const i = (top * 33 + left) * 3 + channel;
    return (
      (gains[i] * (1 - dx) + gains[i + 3] * dx) * (1 - dy) +
      (gains[i + 99] * (1 - dx) + gains[i + 102] * dx) * dy
    );
  };
  const silver = [0.672, 0.658, 0.597];
  const raw = [0, 0, 0],
    color = [0, 0, 0];
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const u = (x + 0.5) / width,
        v = (y + 0.5) / height;
      const [su, sv] = project(u, v),
        sx = su * canvas.width - 0.5,
        sy = sv * canvas.height - 0.5;
      for (let c = 0; c < 3; c++) {
        raw[c] = sample(sx, sy, c);
        color[c] = raw[c] * gain(u, v, c);
      }
      const peak = Math.max(...color),
        chroma = (peak - Math.min(...color)) / Math.max(peak, 0.001);
      const text =
        v >= 0.45 &&
        v <= 0.94 &&
        u >= 0.12 &&
        u <= 0.92 &&
        (v >= 0.56 || (u >= 0.29 && u <= 0.75));
      const black = text ? 1 - smooth(0.12, 0.4, peak) : 0;
      const crest = u >= 0.24 && u <= 0.71 && v >= 0.1 && v <= 0.44;
      const seal = u >= 0.65 && u <= 0.85 && v >= 0.78 && v <= 0.93;
      const ornament =
        ((v <= 0.54 && (u <= 0.27 || u >= 0.72)) ||
          v >= 0.9 ||
          (v >= 0.8 && (u <= 0.22 || u >= 0.88))) &&
        (v < 0.8 || (u >= 0.055 && u <= 0.95));
      let gold = 0;
      if (
        ornament &&
        color[0] >= color[1] * 1.07 &&
        color[1] >= color[2] * 1.2
      ) {
        let localWhite = Math.max(...raw),
          localDark = localWhite;
        for (let n = 0; n < 4; n++) {
          const nx =
            sx + (n - 1.5) * (spec.sampleStep ?? 0.0035) * canvas.width;
          const value = Math.max(
            sample(nx, sy, 0),
            sample(nx, sy, 1),
            sample(nx, sy, 2),
          );
          localWhite = Math.max(localWhite, value);
          localDark = Math.min(localDark, value);
        }
        gold = smooth(0.08, 0.2, localWhite - localDark);
      }
      const colored = smooth(0.18, 0.38, chroma) * (crest || seal ? 1 : gold);
      const i = ((height - 1 - y) * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const ink = silver[c] * (1 - black) + 0.018 * black;
        const restored = ink * (1 - colored) + color[c] * colored;
        output[i + c] =
          encoded[Math.round(Math.max(0, Math.min(1, restored)) * 8191)];
      }
      output[i + 3] = Math.round(Math.max(black, colored) * 255);
    }
  const map = new DataTexture(
    output,
    width,
    height,
    RGBAFormat,
    UnsignedByteType,
  );
  map.name = 'SNU source-derived metal and ink';
  map.colorSpace = SRGBColorSpace;
  map.generateMipmaps = true;
  map.minFilter = LinearMipmapLinearFilter;
  map.magFilter = LinearFilter;
  map.anisotropy = 8;
  map.needsUpdate = true;
  const uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++)
    uv.setXY(i, (i % 33) / 32, 1 - Math.floor(i / 33) / 32);
  return map;
}
