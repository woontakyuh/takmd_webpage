import { Color } from 'three';
import type { Texture } from 'three';
import { Block, Rod } from './Primitives';
import { usePrintedTexture } from './Textures';
import { INTERIOR, PALETTE, ROOM } from './config';

export const RACK_RAIL_HALF_HEIGHT = 0.015;
const WOOD_BASE = new Color(PALETTE.paperLight);
const WOOD_TINT = new Color(INTERIOR.lightWood).multiply(
  new Color(1 / WOOD_BASE.r, 1 / WOOD_BASE.g, 1 / WOOD_BASE.b),
);
const WOOD_COLOR = `#${WOOD_TINT.getHexString()}`;
const UPRIGHT_WIDTH = 0.034;
const UPRIGHT_DEPTH = 0.019;
const UPRIGHT_HEIGHT = 2;
const UPRIGHT_CENTER_Y = 1.38;
const MOUNTING_STANDOFF = 0.04;
const SHELF_THICKNESS = 0.019;
const SHELVES = [{ top: 1.8, depth: 0.36 }, { top: 2.15, depth: 0.3 }] as const;

type UprightProps = {
  readonly x: number;
  readonly wallFaceZ: number;
  readonly wood: Texture;
};

function WallUpright({ x, wallFaceZ, wood }: UprightProps) {
  const backZ = wallFaceZ - MOUNTING_STANDOFF;
  const frontZ = backZ - UPRIGHT_DEPTH;
  return <group name="royal-inspired-solid-wood-wall-upright">
    <Block size={[UPRIGHT_WIDTH, UPRIGHT_HEIGHT, UPRIGHT_DEPTH]}
      position={[x, UPRIGHT_CENTER_Y, backZ - UPRIGHT_DEPTH / 2]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.58} />
    {[0.46, 1.38, 2.3].map(y => <group key={y} name="wall-contact-standoff-and-fastener">
      <Rod from={[x, y, backZ]} to={[x, y, wallFaceZ]} radius={0.006}
        color={PALETTE.aluminiumEdge} metalness={1} />
      <mesh position={[x, y, frontZ - 0.001]} rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.006, 16]} />
        <meshStandardMaterial color={PALETTE.aluminiumEdge} roughness={0.28} metalness={1} />
      </mesh>
    </group>)}
  </group>;
}

function ShelfHanger({ x, top, depth, railFrontZ }: {
  readonly x: number; readonly top: number; readonly depth: number; readonly railFrontZ: number;
}) {
  const underside = top - SHELF_THICKNESS - 0.0045;
  const backZ = railFrontZ - 0.002;
  const frontZ = railFrontZ - depth + 0.025;
  return <group name="stainless-shelf-tension-hanger">
    <Rod from={[x, underside, backZ]} to={[x, underside, frontZ]} radius={0.0045}
      color={PALETTE.aluminiumEdge} metalness={1} />
    <Rod from={[x, top + 0.145, backZ]} to={[x, underside, frontZ + 0.012]} radius={0.004}
      color={PALETTE.aluminiumEdge} metalness={1} />
    <Rod from={[x, top + 0.018, backZ]} to={[x, top + 0.145, backZ]} radius={0.004}
      color={PALETTE.aluminiumEdge} metalness={1} />
  </group>;
}

export function GarmentRack() {
  const wood = usePrintedTexture('wood');
  const { width, height, position } = ROOM.wardrobe;
  const supportX = [-width / 2 + UPRIGHT_WIDTH / 2, width / 2 - UPRIGHT_WIDTH / 2];
  const wallFaceZ = position[0] - (ROOM.architecture.leftX + 0.04);
  const railFrontZ = wallFaceZ - MOUNTING_STANDOFF - UPRIGHT_DEPTH;
  const railY = height - RACK_RAIL_HALF_HEIGHT;

  return (
    <group name="Royal-inspired light-wood wall wardrobe with two shelves">
      {supportX.map(x => <WallUpright key={x} x={x} wallFaceZ={wallFaceZ} wood={wood} />)}
      {SHELVES.map(({ top, depth }) => <group key={top} name={`wardrobe-shelf-top-${top}`}>
        <Block size={[width - UPRIGHT_WIDTH - 0.006, SHELF_THICKNESS, depth]}
          position={[0, top - SHELF_THICKNESS / 2, railFrontZ - depth / 2]}
          color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.5} />
        {supportX.map(x => <ShelfHanger key={x} x={x} top={top} depth={depth} railFrontZ={railFrontZ} />)}
      </group>)}
      <Block size={[width, RACK_RAIL_HALF_HEIGHT * 2, RACK_RAIL_HALF_HEIGHT * 2]}
        position={[0, railY, 0]} color={PALETTE.aluminiumEdge} radius={0.0006} roughness={0.3} metalness={1} />
      {supportX.map(x => <group key={x} name="wall-supported-clothes-rail-bracket">
        <Block size={[0.018, 0.17, 0.004]} position={[x, railY + 0.07, railFrontZ - 0.002]}
          color={PALETTE.aluminiumEdge} radius={0.002} roughness={0.3} metalness={1} />
        <Rod from={[x, railY, railFrontZ]} to={[x, railY, 0]} radius={0.006}
          color={PALETTE.aluminiumEdge} metalness={1} />
        <Rod from={[x, railY + 0.14, railFrontZ]} to={[x, railY, 0.025]} radius={0.0045}
          color={PALETTE.aluminiumEdge} metalness={1} />
      </group>)}
    </group>
  );
}
