import { useEffect, useMemo } from 'react';
import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';
import { MergedBlocks, type BlockPart } from './MergedBlocks';
import { PALETTE } from './config';
import { roundedRectangle } from './MacMiniGeometry';

export const DESK_MAT = {
  position: [0, 0.77525, 0],
  size: [1.68, 0.0035, 0.76],
} as const;

export const DESK_MAT_TOP = DESK_MAT.position[1] + DESK_MAT.size[1] / 2;
const STITCH_INSET = 0.018;
const HORIZONTAL_STITCHES: readonly number[] = Array.from({ length: 79 }, (_, index) => -0.8 + index * 0.0205);
const VERTICAL_STITCHES: readonly number[] = Array.from({ length: 35 }, (_, index) => -0.35 + index * 0.0205);
const HALF_WIDTH = DESK_MAT.size[0] / 2 - STITCH_INSET;
const HALF_DEPTH = DESK_MAT.size[2] / 2 - STITCH_INSET;
const STITCHES: readonly BlockPart[] = [
  ...HORIZONTAL_STITCHES.flatMap(x => [-HALF_DEPTH, HALF_DEPTH].map(z => ({
    size: [0.011, 0.0007, 0.0012] as const, position: [x, 0, z] as const, radius: 0.0004,
  }))),
  ...VERTICAL_STITCHES.flatMap(z => [-HALF_WIDTH, HALF_WIDTH].map(x => ({
    size: [0.0012, 0.0007, 0.011] as const, position: [x, 0, z] as const, radius: 0.0004,
  }))),
];

export function DeskMat() {
  const leather = useLeatherTexture();
  const outline = useMemo(() => roundedRectangle(DESK_MAT.size[0] - 0.0006, DESK_MAT.size[2] - 0.0006, 0.018), []);
  return (
    <group position={[...DESK_MAT.position]}>
      <mesh name="Leather desk mat" position={[0, -DESK_MAT.size[1] / 2 + 0.0003, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow receiveShadow>
        <extrudeGeometry args={[outline, { depth: DESK_MAT.size[1] - 0.0006, bevelEnabled: true, bevelSize: 0.0003, bevelThickness: 0.0003, bevelSegments: 2, curveSegments: 12 }]} />
        <meshPhysicalMaterial color={PALETTE.white} map={leather} roughness={0.68} metalness={0.02}
          clearcoat={0.05} clearcoatRoughness={0.78} />
      </mesh>
      <group position={[0, DESK_MAT_TOP - DESK_MAT.position[1] + 0.00035, 0]}>
        <MergedBlocks parts={STITCHES} color={PALETTE.linen} roughness={0.72} />
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
