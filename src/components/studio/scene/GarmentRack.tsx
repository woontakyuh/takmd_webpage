import { useEffect, useMemo } from 'react';
import { Matrix4 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Block } from './Primitives';
import { PALETTE, ROOM } from './config';

export const RACK_RAIL_HALF_HEIGHT = 0.015;
const SECTION = RACK_RAIL_HALF_HEIGHT * 2;
const EDGE_RADIUS = 0.0006;
const FELT_HEIGHT = 0.003;
const POWDER_COAT_ROUGHNESS = 0.58;

type LegProps = {
  readonly x: number;
  readonly footZ: number;
  readonly top: number;
};

function SquareLeg({ x, footZ, top }: LegProps) {
  const rise = top - FELT_HEIGHT;
  const slope = -footZ / rise;
  const cutDepth = SECTION * Math.hypot(1, slope);
  const geometry = useMemo(() => {
    const leg = new RoundedBoxGeometry(SECTION, rise, cutDepth, 3, EDGE_RADIUS);
    // Horizontal mitres keep the felt contact flat and the tilted section 3 cm square.
    leg.applyMatrix4(new Matrix4().set(
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, slope, 1, 0,
      0, 0, 0, 1,
    ));
    return leg;
  }, [cutDepth, rise, slope]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group>
      <mesh geometry={geometry} position={[x, (top + FELT_HEIGHT) / 2, footZ / 2]} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.white} roughness={POWDER_COAT_ROUGHNESS} metalness={0.08} />
      </mesh>
      <Block size={[SECTION, FELT_HEIGHT, cutDepth]} position={[x, FELT_HEIGHT / 2, footZ]}
        color={PALETTE.ink} radius={0.0004} roughness={0.94} />
    </group>
  );
}

export function GarmentRack() {
  const { width, height, depth } = ROOM.wardrobe;
  const postX = width / 2 - RACK_RAIL_HALF_HEIGHT;
  const railY = height - RACK_RAIL_HALF_HEIGHT;
  const approximateSlope = (depth / 2 - RACK_RAIL_HALF_HEIGHT) / (railY - FELT_HEIGHT);
  const footZ = depth / 2 - RACK_RAIL_HALF_HEIGHT * Math.hypot(1, approximateSlope);

  return (
    <group name="White HAY Loop Stand Hall · 45 × 150 × 39 cm">
      <Block size={[width, SECTION, SECTION]} position={[0, railY, 0]} color={PALETTE.white}
        radius={EDGE_RADIUS} roughness={POWDER_COAT_ROUGHNESS} metalness={0.08} />
      <SquareLeg x={-postX} footZ={footZ} top={railY} />
      <SquareLeg x={postX} footZ={footZ} top={railY} />
      <SquareLeg x={0} footZ={-footZ} top={railY} />
    </group>
  );
}
