import { useEffect, useMemo } from 'react';
import { DoubleSide, PlaneGeometry } from 'three';
import { INTERIOR, PALETTE, ROOM } from './config';
import { Block, Rod } from './Primitives';
import { useInteriorMaterial } from './InteriorMaterials';
import { WindowSky } from './WindowSky';

export function WindowBay({ night, sky }: { readonly night: boolean; readonly sky: readonly [string, string] }) {
  const { leftX, window: opening } = ROOM.architecture;
  const centerY = (opening.bottom + opening.top) / 2;
  const openingHeight = opening.top - opening.bottom;
  const linen = useInteriorMaterial('linen', [1, 4]);
  const curtain = useMemo(() => {
    const geometry = new PlaneGeometry(0.46, 2.63, 48, 16);
    const vertices = geometry.getAttribute('position');
    for (let index = 0; index < vertices.count; index += 1) {
      const x = vertices.getX(index);
      const y = vertices.getY(index);
      vertices.setZ(index, Math.sin(x / 0.46 * Math.PI * 10) * 0.03 + Math.cos(y * 2.5) * 0.006);
    }
    geometry.computeVertexNormals();
    return geometry;
  }, []);
  useEffect(() => () => curtain.dispose(), [curtain]);
  return <group>
    <WindowSky colors={sky} />
    <mesh position={[leftX - 0.025, centerY, opening.centerZ]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[opening.width, openingHeight]} />
      <meshPhysicalMaterial color={night ? PALETTE.teal : PALETTE.paperLight} transparent
        opacity={night ? 0.18 : 0.1} roughness={0.14} metalness={0.05} depthWrite={false} />
    </mesh>
    {[-0.5, -1 / 6, 1 / 6, 0.5].map(fraction => <Block key={fraction}
      size={[0.09, openingHeight + 0.06, 0.045]} position={[leftX + 0.015, centerY, opening.centerZ + opening.width * fraction]}
      color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    {[opening.bottom, opening.top].map(y => <Block key={y} size={[0.09, 0.055, opening.width + 0.06]}
      position={[leftX + 0.015, y, opening.centerZ]} color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    <Rod from={[leftX + 0.27, 2.745, opening.centerZ - 1.93]}
      to={[leftX + 0.27, 2.745, opening.centerZ + 1.93]} radius={0.014} color={INTERIOR.bronze} metalness={0.65} />
    {[-1.68, 1.68].map(offset => <mesh key={offset} geometry={curtain}
      position={[leftX + 0.25, 1.375, opening.centerZ + offset]} rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
      <meshStandardMaterial {...linen} color={INTERIOR.ivory} roughness={1} side={DoubleSide} />
    </mesh>)}
  </group>;
}
