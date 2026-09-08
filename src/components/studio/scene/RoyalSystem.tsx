import { Suspense } from 'react';
import { Color } from 'three';
import type { Texture } from 'three';
import { INTERIOR, PALETTE } from './config';
import { Block, Rod } from './Primitives';
import { HallymPlaque } from './HallymPlaque';
import { SnuhAward } from './SnuhAward';
import { KomissAward } from './KomissAward';
import { CertificateFrames } from './CertificateFrames';
import { WhiskyCollection } from './WhiskyCollection';

const WOOD_BASE = new Color(PALETTE.paperLight);
const WOOD_TINT = new Color(INTERIOR.lightWood).multiply(
  new Color(1 / WOOD_BASE.r, 1 / WOOD_BASE.g, 1 / WOOD_BASE.b),
);
const WOOD_COLOR = `#${WOOD_TINT.getHexString()}`;

const WALL_FACE_Z = 3.32;
const MOUNTING_STANDOFF = 0.04;
const RAIL_DEPTH = 0.019;
const RAIL_WIDTH = 0.034;
const CENTER_SHELF_WIDTH = 1.35;
const SIDE_BAY_WIDTH = 1.05;
const SHELF_DEPTH = 0.3;
const SHELF_THICKNESS = 0.019;
const LOWER_SHELF_TOP = 0.82;
const AWARD_SHELF_TOP = 1.3025;
const CABINET_WIDTH = SIDE_BAY_WIDTH;
const CABINET_DEPTH = 0.38;
const CABINET_HEIGHT = 0.424;

const FULL_RAIL_X = [-2.40, -1.35, 1.35, 2.40] as const;
const SHORT_RAIL_X = [0] as const;
const LEFT_LEVELS = [1.3, 1.7, 2.0, 2.4] as const;
const RIGHT_LEVELS = [AWARD_SHELF_TOP, 1.82, 2.26] as const;

type RoyalSystemProps = { readonly wood: Texture };
type CabinetKind = 'push' | 'sliding' | 'drawers';
type ShelfProps = {
  readonly centerX: number;
  readonly top: number;
  readonly width?: number;
  readonly wood: Texture;
  readonly supportX?: readonly number[];
};

export function RoyalSystem({ wood }: RoyalSystemProps) {
  return <group name="poul-cadovius-royal-system-tv-wall">
    <group name="solid-walnut-wall-rails">
      {FULL_RAIL_X.map(x => <WallRail key={x} x={x} centerY={1.56} height={2} wood={wood} />)}
      {SHORT_RAIL_X.map(x => <WallRail key={x} x={x} centerY={0.696} height={0.6} wood={wood} />)}
    </group>

    <group name="two-custom-width-wall-hung-cabinets">
      <RoyalCabinet centerX={-1.875} top={LOWER_SHELF_TOP} kind="drawers" wood={wood} />
      <RoyalCabinet centerX={1.875} top={LOWER_SHELF_TOP} kind="sliding" wood={wood} />
    </group>

    <group name="two-connected-open-shelves-below-tv">
      {[-0.675, 0.675].map(centerX => <Shelf key={centerX} centerX={centerX} top={LOWER_SHELF_TOP}
        width={CENTER_SHELF_WIDTH} wood={wood} />)}
      {[-1.35, 0, 1.35].map(x => <SteelHanger key={x} x={x} shelfTop={LOWER_SHELF_TOP} />)}
    </group>

    <group name="asymmetric-open-side-shelving">
      {LEFT_LEVELS.map(top => <Shelf key={`left-${top}`} centerX={-1.875} top={top}
        width={SIDE_BAY_WIDTH} wood={wood} supportX={[-2.40, -1.35]} />)}
      {RIGHT_LEVELS.map(top => <Shelf key={`right-${top}`} centerX={1.875} top={top}
        width={SIDE_BAY_WIDTH} wood={wood} supportX={[1.35, 2.40]} />)}
    </group>

    <Suspense fallback={null}><WhiskyCollection /></Suspense>
    <group name="personal-awards-collection">
      <Suspense fallback={null}><CertificateFrames /></Suspense>
      <group name="Hallym appreciation display" position={[1.54, 0.82, 3.095]} rotation={[0, Math.PI, 0]}>
        <HallymPlaque />
      </group>
      <group name="SNUH merit display" position={[1.875, 0.82, 3.115]} rotation={[0, Math.PI, 0]}>
        <SnuhAward />
      </group>
      <group name="KOMISS membership display" position={[2.21, 0.82, 3.115]} rotation={[0, Math.PI, 0]}>
        <KomissAward />
      </group>
    </group>
  </group>;
}

function RoyalCabinet({ centerX, top, kind, wood }: {
  readonly centerX: number; readonly top: number; readonly kind: CabinetKind; readonly wood: Texture;
}) {
  const panel = 0.019;
  const railFrontZ = WALL_FACE_Z - MOUNTING_STANDOFF - RAIL_DEPTH;
  const centerY = top - CABINET_HEIGHT / 2;
  const centerZ = railFrontZ - CABINET_DEPTH / 2;
  const frontZ = railFrontZ - CABINET_DEPTH - 0.004;
  return <group name={`royal-inspired-112cm-cabinet-${kind}`}>
    <Block size={[CABINET_WIDTH - 0.006, panel, CABINET_DEPTH]} position={[centerX, top - panel / 2, centerZ]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.5} />
    <Block size={[CABINET_WIDTH - 0.006, panel, CABINET_DEPTH]}
      position={[centerX, top - CABINET_HEIGHT + panel / 2, centerZ]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.54} />
    {[-1, 1].map(side => <Block key={side} size={[panel, CABINET_HEIGHT - panel * 2, CABINET_DEPTH]}
      position={[centerX + side * (CABINET_WIDTH / 2 - panel / 2 - 0.003), centerY, centerZ]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.52} />)}
    <Block size={[CABINET_WIDTH - panel * 2, CABINET_HEIGHT - panel * 2, panel]}
      position={[centerX, centerY, railFrontZ - panel / 2]}
      color={WOOD_COLOR} texture={wood} radius={0.003} roughness={0.6} />
    <CabinetFront centerX={centerX} centerY={centerY} frontZ={frontZ} kind={kind} wood={wood} />
    {[centerX - CABINET_WIDTH / 2, centerX + CABINET_WIDTH / 2].map(x =>
      <Block key={x} size={[0.018, 0.075, 0.018]} position={[x, top - 0.055, railFrontZ - 0.012]}
        color={PALETTE.aluminiumEdge} radius={0.004} roughness={0.3} metalness={1} />)}
  </group>;
}

function CabinetFront({ centerX, centerY, frontZ, kind, wood }: {
  readonly centerX: number; readonly centerY: number; readonly frontZ: number;
  readonly kind: CabinetKind; readonly wood: Texture;
}) {
  if (kind === 'drawers') {
    return <group name="three-solid-walnut-drawers">
      {[-1, 0, 1].map(row => <Block key={row} size={[CABINET_WIDTH - 0.048, 0.121, 0.016]}
        position={[centerX, centerY + row * 0.132, frontZ]}
        color={WOOD_COLOR} texture={wood} radius={0.003} roughness={0.48} />)}
    </group>;
  }
  const slidingOffset = kind === 'sliding' ? 0.008 : 0;
  const doorWidth = (CABINET_WIDTH - 0.058) / 2;
  return <group name={kind === 'sliding' ? 'two-sliding-walnut-doors' : 'two-walnut-push-doors'}>
    {[-1, 1].map(side => <Block key={side} size={[doorWidth, 0.382, 0.016]}
      position={[centerX + side * (doorWidth / 2 + 0.004), centerY, frontZ - (side > 0 ? slidingOffset : 0)]}
      color={WOOD_COLOR}
      texture={wood} radius={0.003} roughness={0.5} />)}
  </group>;
}

function WallRail({ x, centerY, height, wood }: {
  readonly x: number; readonly centerY: number; readonly height: number; readonly wood: Texture;
}) {
  const railBackZ = WALL_FACE_Z - MOUNTING_STANDOFF;
  const fastenerY = [centerY - height / 2 + 0.08, centerY + height / 2 - 0.08] as const;
  return <group name={`royal-rail-${height}m`}>
    <Block size={[RAIL_WIDTH, height, RAIL_DEPTH]} position={[x, centerY, railBackZ - RAIL_DEPTH / 2]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.675} />
    {fastenerY.map(y => <group key={y} name="40mm-wall-standoff-and-fastener">
      <Rod from={[x, y, railBackZ]} to={[x, y, WALL_FACE_Z]} radius={0.006}
        color={PALETTE.aluminiumEdge} metalness={1} />
      <mesh name="stainless-rail-fastener" position={[x, y, railBackZ - RAIL_DEPTH - 0.001]}
        rotation={[0, Math.PI, 0]}>
        <circleGeometry args={[0.006, 16]} />
        <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={1} roughness={0.28} />
      </mesh>
    </group>)}
  </group>;
}

function Shelf({ centerX, top, width = SIDE_BAY_WIDTH, wood, supportX = [] }: ShelfProps) {
  const centerZ = WALL_FACE_Z - MOUNTING_STANDOFF - RAIL_DEPTH - SHELF_DEPTH / 2;
  return <group name={`royal-inspired-${width}m-shelf-top-${top}`}>
    <Block size={[width - 0.006, SHELF_THICKNESS, SHELF_DEPTH]}
      position={[centerX, top - SHELF_THICKNESS / 2, centerZ]}
      color={WOOD_COLOR} texture={wood} radius={0.004} roughness={0.5} />
    {supportX.map(x => <SteelHanger key={x} x={x} shelfTop={top} />)}
  </group>;
}

function SteelHanger({ x, shelfTop }: { readonly x: number; readonly shelfTop: number }) {
  const underside = shelfTop - SHELF_THICKNESS - 0.004;
  const railFrontZ = WALL_FACE_Z - MOUNTING_STANDOFF - RAIL_DEPTH;
  const backZ = railFrontZ - 0.006;
  const frontZ = railFrontZ - SHELF_DEPTH + 0.025;
  return <group name="slim-stainless-angled-hanger">
    <Rod from={[x, underside, backZ]} to={[x, underside, frontZ]} radius={0.0045}
      color={PALETTE.aluminiumEdge} metalness={1} />
    <Rod from={[x, shelfTop + 0.145, backZ]} to={[x, underside, frontZ + 0.012]} radius={0.004}
      color={PALETTE.aluminiumEdge} metalness={1} />
    <Rod from={[x, shelfTop + 0.018, backZ]} to={[x, shelfTop + 0.145, backZ]} radius={0.004}
      color={PALETTE.aluminiumEdge} metalness={1} />
  </group>;
}
