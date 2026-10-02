import { DataTexture, LinearFilter, LinearMipmapLinearFilter, SRGBColorSpace } from 'three';

function noise(x: number, y: number): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const sx = x - ix, sy = y - iy;
  const ux = sx * sx * (3 - 2 * sx), uy = sy * sy * (3 - 2 * sy);
  const corner = (a: number, b: number) => {
    const value = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
    return value - Math.floor(value);
  };
  const lower = corner(ix, iy) * (1 - ux) + corner(ix + 1, iy) * ux;
  const upper = corner(ix, iy + 1) * (1 - ux) + corner(ix + 1, iy + 1) * ux;
  return lower * (1 - uy) + upper * uy;
}

export function createMineralSurface(finish: 'microcement' | 'plaster') {
  const size = 512;
  const albedo = new Uint8Array(size * size * 4);
  const relief = new Uint8Array(size * size * 4);
  const contrast = finish === 'microcement' ? 1.8 : 0.9;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const broad = noise(x / 38, y / 43);
      const worked = noise(x / 12 + broad * 2.8, y / 18 + broad * 3.2);
      const grain = noise(x / 1.3, y / 1.3);
      const value = Math.min(255, Math.round(246 + contrast * ((broad - 0.5) * 14 + (worked - 0.5) * 8 + grain - 0.5)));
      const height = Math.round(128 + (worked - 0.5) * 84 + (grain - 0.5) * 46);
      const offset = (y * size + x) * 4;
      albedo.set([value, value, value, 255], offset);
      relief.set([height, height, height, 255], offset);
    }
  }
  const map = new DataTexture(albedo, size, size);
  const bumpMap = new DataTexture(relief, size, size);
  map.colorSpace = SRGBColorSpace;
  for (const texture of [map, bumpMap]) {
    texture.magFilter = LinearFilter;
    texture.minFilter = LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
  }
  return { map, bumpMap };
}
