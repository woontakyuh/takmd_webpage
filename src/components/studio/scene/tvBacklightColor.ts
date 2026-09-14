export type TvEdgeLight = { readonly color: string; readonly intensity: number };
export type TvEdgeLights = Readonly<Record<'left' | 'top' | 'right' | 'bottom', TvEdgeLight>>;
export type TvImageRegion = { readonly x: number; readonly y: number; readonly width: number; readonly height: number };

export const TV_WARM_WHITE = '#FFF5E6';
const unlit: TvEdgeLight = { color: TV_WARM_WHITE, intensity: 0 };
export const TV_DARK_EDGES: TvEdgeLights = { left: unlit, top: unlit, right: unlit, bottom: unlit };
const linear = (value: number) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
const hex = (value: number) => Math.round(Math.min(255, Math.max(0, value))).toString(16).padStart(2, '0');

function sampleRegion(pixels: Uint8ClampedArray, rowWidth: number, region: TvImageRegion): TvEdgeLight {
  let red = 0, green = 0, blue = 0, energy = 0, total = 0, colorWeight = 0;
  for (let y = region.y; y < region.y + region.height; y += 1) for (let x = region.x; x < region.x + region.width; x += 1) {
    const offset = (y * rowWidth + x) * 4;
    const alpha = (pixels[offset + 3] ?? 0) / 255;
    const r = (pixels[offset] ?? 0) / 255, g = (pixels[offset + 1] ?? 0) / 255, b = (pixels[offset + 2] ?? 0) / 255;
    const maximum = Math.max(r, g, b), minimum = Math.min(r, g, b);
    const weight = alpha * (0.25 + 0.75 * (maximum ? (maximum - minimum) / maximum : 0));
    red += r * weight; green += g * weight; blue += b * weight; colorWeight += weight;
    energy += (0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b)) * alpha;
    total += alpha;
  }
  if (!total || !colorWeight) return unlit;
  const maximum = Math.max(red, green, blue), minimum = Math.min(red, green, blue);
  const saturation = maximum ? (maximum - minimum) / maximum : 0;
  return {
    color: saturation < 0.1 ? TV_WARM_WHITE : `#${hex(red / maximum * 255)}${hex(green / maximum * 255)}${hex(blue / maximum * 255)}`,
    intensity: Math.min(0.85, Math.sqrt(energy / total) * (0.16 + 0.7 * saturation)),
  };
}

export function sampleTvEdgePixels(pixels: Uint8ClampedArray, width: number, height: number): TvEdgeLights {
  const bandX = Math.ceil(width * 0.2), bandY = Math.ceil(height * 0.2);
  return {
    left: sampleRegion(pixels, width, { x: 0, y: bandY, width: bandX, height: height - bandY * 2 }),
    top: sampleRegion(pixels, width, { x: bandX, y: 0, width: width - bandX * 2, height: bandY }),
    right: sampleRegion(pixels, width, { x: width - bandX, y: bandY, width: bandX, height: height - bandY * 2 }),
    bottom: sampleRegion(pixels, width, { x: bandX, y: height - bandY, width: width - bandX * 2, height: bandY }),
  };
}

let sampler: CanvasRenderingContext2D | null = null;
const imageSamples = new Map<string, TvEdgeLights>();

export function sampleTvImageEdges(source: HTMLImageElement | HTMLCanvasElement, key: string, region?: TvImageRegion): TvEdgeLights {
  const cached = imageSamples.get(key);
  if (cached) return cached;
  if (!sampler) {
    const canvas = document.createElement('canvas');
    canvas.width = 48; canvas.height = 32;
    sampler = canvas.getContext('2d', { willReadFrequently: true });
  }
  if (!sampler) return TV_DARK_EDGES;
  sampler.clearRect(0, 0, 48, 32);
  if (region) sampler.drawImage(source, region.x, region.y, region.width, region.height, 0, 0, 48, 32);
  else sampler.drawImage(source, 0, 0, 48, 32);
  const sample = sampleTvEdgePixels(sampler.getImageData(0, 0, 48, 32).data, 48, 32);
  imageSamples.set(key, sample);
  const oldest = imageSamples.keys().next().value;
  if (imageSamples.size > 32 && oldest !== undefined) imageSamples.delete(oldest);
  return sample;
}

export function tvBacklightMix(delta: number, reducedMotion: boolean): number {
  return reducedMotion ? 1 : 1 - Math.exp(-10 * Math.max(0, delta));
}
