import { useEffect, useMemo } from 'react';
import { DataTexture, LinearFilter, SRGBColorSpace } from 'three';
import { INTERIOR, ROOM } from './config';
import { Block } from './Primitives';

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

function surfaceTexture(): DataTexture {
  const size = 256;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const broad = noise(x / 34, y / 39);
      const fine = noise(x / 3, y / 3);
      const value = Math.round(247 + broad * 5 + fine * 2);
      const offset = (y * size + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
  }
  const texture = new DataTexture(pixels, size, size);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function MicrocementFloor() {
  const texture = useMemo(surfaceTexture, []);
  useEffect(() => () => texture.dispose(), [texture]);
  const [width, , depth] = ROOM.platform.size;
  return <group name="Seamless warm greige microcement floor">
    <Block {...ROOM.platform} color={INTERIOR.microcement} roughness={0.9} />
    <Block size={[width - 0.04, 0.025, depth - 0.04]} position={[0, 0.006, 0]} radius={0.006}
      color={INTERIOR.microcement} roughness={0.86}
      material={{ map: texture, bumpMap: texture, bumpScale: 0.00065 }} />
  </group>;
}
