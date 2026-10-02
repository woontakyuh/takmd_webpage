import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { BoxGeometry, DataTexture, SRGBColorSpace } from 'three';
import { pageArchAt } from './bookGeometry';

export function BookPaperPacket({ width, height, depth, direction, bend, name }: {
  readonly width: number;
  readonly height: number;
  readonly depth: number;
  readonly direction: 1 | -1;
  readonly bend: RefObject<number>;
  readonly name: string;
}) {
  const lastBend = useRef(-1);
  const { geometry, flat } = useMemo(() => {
    const geometry = new BoxGeometry(width, height, depth, 36, 1, 8);
    geometry.translate(width / 2, 0, -direction * depth / 2);
    const vertices = geometry.getAttribute('position');
    const uv = geometry.getAttribute('uv');
    for (let index = 0; index < uv.count; index += 1) {
      uv.setXY(index, vertices.getX(index) / width, 1 + direction * vertices.getZ(index) / depth);
    }
    return { geometry, flat: vertices.clone() };
  }, [width, height, depth, direction]);
  const edgeTexture = useMemo(() => {
    const data = new Uint8Array(128 * 4);
    for (let row = 0; row < 128; row += 1) {
      const shade = row % 4 === 0 ? 222 : 248;
      data.set([shade, shade, shade, 255], row * 4);
    }
    const texture = new DataTexture(data, 1, 128);
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => {
    lastBend.current = -1;
    return () => { geometry.dispose(); };
  }, [geometry]);
  useEffect(() => () => { edgeTexture.dispose(); }, [edgeTexture]);
  useFrame(() => {
    const amount = bend.current;
    if (Math.abs(lastBend.current - amount) < .00001) return;
    lastBend.current = amount;
    const vertices = geometry.getAttribute('position');
    for (let index = 0; index < vertices.count; index += 1) {
      const x = flat.getX(index);
      const z = flat.getZ(index);
      const layer = 1 + direction * z / depth;
      vertices.setZ(index, z + direction * amount * pageArchAt(x, width) * layer);
    }
    vertices.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();
  });
  return <mesh name={name} geometry={geometry} castShadow receiveShadow>
    {[0, 1, 2, 3, 4, 5].map(face => <meshStandardMaterial key={face} attach={`material-${face}`}
      color="#e6dfcf" roughness={.94} map={face < 4 ? edgeTexture : null} />)}
  </mesh>;
}
