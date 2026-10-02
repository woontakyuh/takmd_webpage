import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { RingGeometry, SRGBColorSpace } from 'three';

export function BeosoundDiscArt({ src }: { readonly src: string }) {
  const map = useTexture(src);
  const geometry = useMemo(() => {
    const ring = new RingGeometry(.009, .06, 96);
    const vertices = ring.getAttribute('position'), uv = ring.getAttribute('uv');
    const { width, height } = map.image as HTMLImageElement;
    const diameter = Math.min(width, height);
    for (let i = 0; i < vertices.count; i++) {
      uv.setXY(i, .5 + vertices.getX(i) / .12 * diameter / width,
        .5 + vertices.getY(i) / .12 * diameter / height);
    }
    return ring;
  }, [map]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  map.colorSpace = SRGBColorSpace; map.anisotropy = 4;
  return <>
    <primitive object={geometry} attach="geometry" />
    <meshPhysicalMaterial map={map} color="#ffffff" metalness={.12} roughness={.36} clearcoat={.25} />
  </>;
}
