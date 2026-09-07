import { DoubleSide, Vector2 } from 'three';
import { INTERIOR, PALETTE, ROOM } from './config';
import { Block } from './Primitives';
import { useInteriorMaterial } from './InteriorMaterials';
import { WindowSky } from './WindowSky';

const BLIND_DROPS = [0.27, 0.39] as const;
const BLIND_NORMAL = new Vector2(0.04, 0.04);

export function WindowBay({ night, sky }: { readonly night: boolean; readonly sky: readonly [string, string] }) {
  const { leftX, window: opening } = ROOM.architecture;
  const centerY = (opening.bottom + opening.top) / 2;
  const openingHeight = opening.top - opening.bottom;
  const linen = useInteriorMaterial('linen', [1, 0.3]);
  const blindWidth = opening.width / 2 - 0.045;
  return <group name="two-panel-window-bay">
    <WindowSky colors={sky} />
    <mesh position={[leftX - 0.025, centerY, opening.centerZ]} rotation={[0, Math.PI / 2, 0]}>
      <planeGeometry args={[opening.width, openingHeight]} />
      <meshPhysicalMaterial color={night ? PALETTE.teal : PALETTE.paperLight} transparent
        opacity={night ? 0.18 : 0.1} roughness={0.14} metalness={0.05} depthWrite={false} />
    </mesh>
    {[-0.5, 0, 0.5].map(fraction => <Block key={fraction}
      size={[0.09, openingHeight + 0.06, 0.045]} position={[leftX + 0.015, centerY, opening.centerZ + opening.width * fraction]}
      color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    {[opening.bottom, opening.top].map(y => <Block key={y} size={[0.09, 0.055, opening.width + 0.06]}
      position={[leftX + 0.015, y, opening.centerZ]} color={INTERIOR.bronze} metalness={0.62} roughness={0.44} radius={0.004} />)}
    {BLIND_DROPS.map((drop, index) => {
      const z = opening.centerZ + (index - 0.5) * opening.width / 2;
      return <group key={index} name={`roller-blind-${index + 1}`}>
        <Block size={[0.095, 0.08, blindWidth + 0.03]} position={[leftX + 0.065, opening.top + 0.055, z]}
          color={INTERIOR.ivory} radius={0.018} roughness={0.7} metalness={0.12} />
        {[-1, 1].map(side => <Block key={side} size={[0.099, 0.081, 0.008]}
          position={[leftX + 0.065, opening.top + 0.055, z + side * (blindWidth + 0.022) / 2]}
          color={PALETTE.aluminiumEdge} radius={0.014} roughness={0.5} metalness={0.65} />)}
        <mesh name="flat-woven-roller-fabric" position={[leftX + 0.09, opening.top + 0.02 - drop / 2, z]}
          rotation={[0, Math.PI / 2, 0]} castShadow receiveShadow>
          <planeGeometry args={[blindWidth, drop]} />
          <meshStandardMaterial {...linen} normalScale={BLIND_NORMAL} color={INTERIOR.ivory}
            roughness={0.96} side={DoubleSide} />
        </mesh>
        <Block size={[0.016, 0.022, blindWidth]} position={[leftX + 0.09, opening.top + 0.02 - drop, z]}
          color={INTERIOR.ivory} radius={0.006} roughness={0.65} metalness={0.12} />
      </group>;
    })}
  </group>;
}
