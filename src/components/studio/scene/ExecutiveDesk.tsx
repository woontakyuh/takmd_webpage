import { useEffect, useMemo } from 'react';
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping, Vector2 } from 'three';
import { createBodilDeskGeometry } from './BodilDeskGeometry';
import { useInteriorMaterial } from './InteriorMaterials';
import { PALETTE } from './config';

function createBrushedSteelTexture(): DataTexture {
  const width = 128;
  const height = 128;
  const pixels = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const line = Math.sin(y * 18.73) * 14 + Math.sin(y * 3.17) * 8;
    for (let x = 0; x < width; x += 1) {
      const value = Math.round(219 + line + Math.sin(x * 23.3 + y) * 3);
      const offset = (y * width + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
  }
  const texture = new DataTexture(pixels, width, height);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(1, 8);
  texture.minFilter = LinearMipmapLinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

export function ExecutiveDesk() {
  const veneer = useInteriorMaterial('oak');
  const geometry = useMemo(createBodilDeskGeometry, []);
  const brush = useMemo(createBrushedSteelTexture, []);
  const normalScale = useMemo(() => new Vector2(0.045, 0.045), []);

  useEffect(() => () => {
    Object.values(geometry).forEach(part => part.dispose());
    brush.dispose();
  }, [geometry, brush]);

  return <group name="bodil-kjaer-office-desk">
    <mesh name="walnut-carcass-and-four-flush-drawers" geometry={geometry.veneer} castShadow receiveShadow>
      <meshPhysicalMaterial {...veneer} color={PALETTE.walnut} normalScale={normalScale}
        roughness={0.48} clearcoat={0.18} clearcoatRoughness={0.4} />
    </mesh>
    <mesh name="brushed-stainless-sled-frame" geometry={geometry.steel} castShadow receiveShadow>
      <meshPhysicalMaterial color={PALETTE.aluminiumEdge} metalness={1} roughness={0.4}
        roughnessMap={brush} bumpMap={brush} bumpScale={0.000_015}
        anisotropy={0.5} anisotropyRotation={Math.PI / 2} envMapIntensity={1.15} />
    </mesh>
    <mesh name="recessed-drawer-pulls" geometry={geometry.recess} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.walnutDark} roughness={0.7} />
    </mesh>
    <mesh name="desk-protective-glides" geometry={geometry.glides} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.95} />
    </mesh>
  </group>;
}
