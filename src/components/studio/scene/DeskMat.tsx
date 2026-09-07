import { useEffect, useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { Block } from './Primitives';
import { PALETTE } from './config';
import { roundedRectangle } from './MacMiniGeometry';

export const DESK_MAT = {
  position: [0, 0.77925, 0],
  size: [2.08, 0.0035, 0.76],
} as const;

export const DESK_MAT_TOP = DESK_MAT.position[1] + DESK_MAT.size[1] / 2;
const STITCH_INSET = 0.018;
const HORIZONTAL_STITCHES: readonly number[] = Array.from({ length: 99 }, (_, index) => -1 + index * 0.0205);
const VERTICAL_STITCHES: readonly number[] = Array.from({ length: 35 }, (_, index) => -0.35 + index * 0.0205);

export function DeskMat() {
  const leather = useLeatherTexture();
  const outline = useMemo(() => roundedRectangle(DESK_MAT.size[0] - 0.0006, DESK_MAT.size[2] - 0.0006, 0.018), []);
  const halfWidth = DESK_MAT.size[0] / 2 - STITCH_INSET;
  const halfDepth = DESK_MAT.size[2] / 2 - STITCH_INSET;
  return (
    <group position={[...DESK_MAT.position]}>
      <mesh name="Leather desk mat" position={[0, -DESK_MAT.size[1] / 2 + 0.0003, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[outline, { depth: DESK_MAT.size[1] - 0.0006, bevelEnabled: true, bevelSize: 0.0003, bevelThickness: 0.0003, bevelSegments: 2, curveSegments: 12 }]} />
        <meshPhysicalMaterial color={PALETTE.white} map={leather} roughness={0.68} metalness={0.02}
          clearcoat={0.05} clearcoatRoughness={0.78} />
      </mesh>
      <group position={[0, DESK_MAT_TOP - DESK_MAT.position[1] + 0.00035, 0]}>
        {HORIZONTAL_STITCHES.flatMap((x) => [
          <Block key={`top-${x}`} size={[0.011, 0.0007, 0.0012]} position={[x, 0, -halfDepth]}
            color={PALETTE.linen} radius={0.0004} roughness={0.72} />,
          <Block key={`bottom-${x}`} size={[0.011, 0.0007, 0.0012]} position={[x, 0, halfDepth]}
            color={PALETTE.linen} radius={0.0004} roughness={0.72} />,
        ])}
        {VERTICAL_STITCHES.flatMap((z) => [
          <Block key={`left-${z}`} size={[0.0012, 0.0007, 0.011]} position={[-halfWidth, 0, z]}
            color={PALETTE.linen} radius={0.0004} roughness={0.72} />,
          <Block key={`right-${z}`} size={[0.0012, 0.0007, 0.011]} position={[halfWidth, 0, z]}
            color={PALETTE.linen} radius={0.0004} roughness={0.72} />,
        ])}
      </group>
    </group>
  );
}

function useLeatherTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = PALETTE.ink;
      context.fillRect(0, 0, canvas.width, canvas.height);
      let seed = 271;
      for (let index = 0; index < 1400; index += 1) {
        seed = (seed * 48271) % 2147483647;
        const x = seed % canvas.width;
        seed = (seed * 48271) % 2147483647;
        const y = seed % canvas.height;
        context.fillStyle = PALETTE.teal;
        context.globalAlpha = 0.018 + (seed % 4) * 0.006;
        context.fillRect(x, y, 1, 1);
      }
      context.globalAlpha = 0.045;
      context.strokeStyle = PALETTE.linen;
      for (let index = 0; index < 95; index += 1) {
        const y = (index * 29) % canvas.height;
        context.beginPath();
        context.moveTo(0, y);
        context.bezierCurveTo(72, y - 2, 184, y + 2, canvas.width, y);
        context.stroke();
      }
      context.globalAlpha = 1;
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.wrapS = RepeatWrapping;
    result.wrapT = RepeatWrapping;
    result.repeat.set(4, 2);
    result.anisotropy = 4;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
