import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { PlaneGeometry, SRGBColorSpace } from 'three';
import type { BookQuad, BookSurface } from '../personalBookSurfaces';

export function bookUvAt(quad: BookQuad, u: number, v: number): readonly [number, number] {
  const [a, b, c, d] = quad;
  const dx1 = b[0] - c[0], dx2 = d[0] - c[0];
  const dy1 = b[1] - c[1], dy2 = d[1] - c[1];
  const dx3 = a[0] - b[0] + c[0] - d[0];
  const dy3 = a[1] - b[1] + c[1] - d[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy1) / determinant;
  const scale = g * u + h * v + 1;
  return [((b[0] - a[0] + g * b[0]) * u + (d[0] - a[0] + h * d[0]) * v + a[0]) / scale,
    ((b[1] - a[1] + g * b[1]) * u + (d[1] - a[1] + h * d[1]) * v + a[1]) / scale];
}

export function BookSurfaceMesh({ surface, width, height, position, rotation = [0, 0, 0], name }: {
  readonly surface: BookSurface;
  readonly width: number;
  readonly height: number;
  readonly position: readonly [number, number, number];
  readonly rotation?: readonly [number, number, number];
  readonly name: string;
}) {
  const texture = useTexture(surface.src, loaded => {
    if (Array.isArray(loaded)) return;
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = 8;
  });
  const geometry = useMemo(() => {
    const result = new PlaneGeometry(width, height, 16, 16);
    const uv = result.getAttribute('uv');
    for (let index = 0; index < uv.count; index += 1) {
      const [x, y] = bookUvAt(surface.quad, uv.getX(index), 1 - uv.getY(index));
      uv.setXY(index, x, 1 - y);
    }
    return result;
  }, [width, height, surface]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name={name} geometry={geometry} position={[...position]} rotation={[...rotation]} receiveShadow>
    <meshStandardMaterial map={texture} color="#ffffff" roughness={.78} />
  </mesh>;
}
