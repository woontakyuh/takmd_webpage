import { useEffect, useMemo } from 'react';
import { CubicBezierCurve3, CurvePath, LineCurve3, TubeGeometry, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, ROOM } from './config';

export const RACK_TUBE_RADIUS = 0.011;
const BEND_RADIUS = 0.1;
const FOOT_TOP = 0.11;
const FOOT_BEND = 0.035;
const QUARTER_CIRCLE = 0.55228475;

function roundedArch(halfWidth: number, top: number, bottom: number, bend: number) {
  const path = new CurvePath<Vector3>();
  const inset = bend * (1 - QUARTER_CIRCLE);
  path.add(new LineCurve3(new Vector3(-halfWidth, bottom, 0), new Vector3(-halfWidth, top - bend, 0)));
  path.add(new CubicBezierCurve3(
    new Vector3(-halfWidth, top - bend, 0), new Vector3(-halfWidth, top - inset, 0),
    new Vector3(-halfWidth + inset, top, 0), new Vector3(-halfWidth + bend, top, 0),
  ));
  path.add(new LineCurve3(new Vector3(-halfWidth + bend, top, 0), new Vector3(halfWidth - bend, top, 0)));
  path.add(new CubicBezierCurve3(
    new Vector3(halfWidth - bend, top, 0), new Vector3(halfWidth - inset, top, 0),
    new Vector3(halfWidth, top - inset, 0), new Vector3(halfWidth, top - bend, 0),
  ));
  path.add(new LineCurve3(new Vector3(halfWidth, top - bend, 0), new Vector3(halfWidth, bottom, 0)));
  return path;
}

export function GarmentRack() {
  const { width, height, depth } = ROOM.wardrobe;
  const postX = width / 2 - RACK_TUBE_RADIUS;
  const top = height - RACK_TUBE_RADIUS;
  const geometry = useMemo(() => {
    const frame = new TubeGeometry(roundedArch(postX, top, FOOT_TOP - RACK_TUBE_RADIUS, BEND_RADIUS), 160, RACK_TUBE_RADIUS, 20, false);
    const feet = [-postX, postX].map(x => {
      const foot = new TubeGeometry(roundedArch(depth / 2 - RACK_TUBE_RADIUS, FOOT_TOP - RACK_TUBE_RADIUS,
        RACK_TUBE_RADIUS, FOOT_BEND), 64, RACK_TUBE_RADIUS, 20, false);
      return foot.rotateY(Math.PI / 2).translate(x, 0, 0);
    });
    const braceY = height - RACK_TUBE_RADIUS * 3 - 1.35;
    const brace = new TubeGeometry(new LineCurve3(new Vector3(-postX, braceY, 0), new Vector3(postX, braceY, 0)), 1, RACK_TUBE_RADIUS, 20, false);
    const parts = [frame, ...feet, brace];
    const merged = mergeGeometries(parts);
    for (const part of parts) part.dispose();
    return merged;
  }, [depth, height, postX, top]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <group name="White garment rack · 99 × 152 × 46 cm">
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color={PALETTE.white} roughness={0.36} metalness={0.12} />
      </mesh>
      {[-postX, postX].map(x => (
        <group key={x}>
          {[-1, 1].map(side => (
            <mesh key={side} position={[x, 0.006, side * (depth / 2 - RACK_TUBE_RADIUS)]} castShadow>
              <cylinderGeometry args={[RACK_TUBE_RADIUS * 1.015, RACK_TUBE_RADIUS * 1.015, 0.012, 20]} />
              <meshStandardMaterial color={PALETTE.paperLight} roughness={0.72} />
            </mesh>
          ))}
          {[0.166, height - 0.225].map(y => (
            <mesh key={y} position={[x, y, -RACK_TUBE_RADIUS]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.0024, 0.0024, 0.0018, 12]} />
              <meshStandardMaterial color={PALETTE.aluminium} roughness={0.38} metalness={0.7} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
