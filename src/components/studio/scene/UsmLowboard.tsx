import { useEffect, useMemo } from 'react';
import { BoxGeometry, CylinderGeometry, SphereGeometry } from 'three';
import type { BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, ROOM } from './config';
import type { Point } from './config';

// USM module dimensions are joint-centre distances; the 23 mm balls define the envelope.
const USM = {
  bays: 4, moduleHeight: 0.35, ballRadius: 0.0115, tubeRadius: 0.0095,
  panelClearance: 0.021, sheet: 0.0012, returnDepth: 0.008,
  panelOutset: 0.0075, footRadius: 0.01, footHeight: 0.0065,
  lockRadius: 0.016, lockDrop: 0.047,
} as const;

class UsmGeometryMergeError extends Error {
  override readonly name = 'UsmGeometryMergeError';
}

function mergeParts(parts: readonly BufferGeometry[]): BufferGeometry {
  const compatible = parts.map(part => {
    if (!part.index) return part;
    const vertices = part.toNonIndexed();
    part.dispose();
    return vertices;
  });
  const result = mergeGeometries(compatible);
  compatible.forEach(part => part.dispose());
  if (!result) throw new UsmGeometryMergeError('USM parts must share position, normal and UV attributes.');
  return result;
}

function box(size: Point, position: Point): BufferGeometry {
  return new BoxGeometry(...size).translate(...position);
}

function tube(length: number, position: Point, rotation: Point = [0, 0, 0], radius: number = USM.tubeRadius) {
  return new CylinderGeometry(radius, radius, length, 20)
    .rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2]).translate(...position);
}

function foldedPanel(width: number, height: number, position: Point, rotation: Point): BufferGeometry {
  const { sheet, returnDepth } = USM;
  const panel = mergeParts([
    new RoundedBoxGeometry(width, height, sheet, 2, sheet / 2),
    ...[-1, 1].flatMap(side => [
      box([sheet, height - sheet * 2, returnDepth], [side * (width - sheet) / 2, 0, -returnDepth / 2]),
      box([width, sheet, returnDepth], [0, side * (height - sheet) / 2, -returnDepth / 2]),
    ]),
  ]);
  return panel.rotateX(rotation[0]).rotateY(rotation[1]).rotateZ(rotation[2]).translate(...position);
}

function createLowboardGeometry() {
  const { width, height, depth } = ROOM.credenza;
  const halfWidth = width / 2 - USM.ballRadius;
  const halfDepth = depth / 2 - USM.ballRadius;
  const bayWidth = halfWidth * 2 / USM.bays;
  const top = height - USM.ballRadius;
  const bottom = top - USM.moduleHeight;
  const middle = (top + bottom) / 2;
  const levels = [bottom, top] as const;
  const sides = [-halfDepth, halfDepth] as const;
  const stations = Array.from({ length: USM.bays + 1 }, (_, index) => -halfWidth + bayWidth * index);
  const chrome: BufferGeometry[] = [];
  const panels: BufferGeometry[] = [];
  const dark: BufferGeometry[] = [];

  for (const z of stations) {
    for (const x of sides) {
      for (const y of levels) {
        chrome.push(new SphereGeometry(USM.ballRadius, 20, 12).translate(x, y, z));
      }
      chrome.push(tube(USM.moduleHeight - USM.ballRadius, [x, middle, z]));
      chrome.push(tube(bottom - USM.footHeight, [x, (bottom + USM.footHeight) / 2, z], [0, 0, 0], 0.0035));
      dark.push(tube(USM.footHeight, [x, USM.footHeight / 2, z], [0, 0, 0], USM.footRadius));
      dark.push(tube(0.004, [x, USM.footHeight + 0.002, z], [0, 0, 0], 0.006));
    }
    for (const y of levels) {
      chrome.push(tube(halfDepth * 2 - USM.ballRadius, [0, y, z], [0, 0, Math.PI / 2]));
    }
  }

  const panelWidth = bayWidth - USM.panelClearance;
  const panelHeight = USM.moduleHeight - USM.panelClearance;
  const panelDepth = halfDepth * 2 - USM.panelClearance;
  const doorFace = halfDepth + USM.panelOutset;

  for (let index = 0; index < USM.bays; index += 1) {
    const z = -halfWidth + bayWidth * (index + 0.5);
    for (const x of sides) for (const y of levels) {
      chrome.push(tube(bayWidth - USM.ballRadius, [x, y, z], [Math.PI / 2, 0, 0]));
    }
    panels.push(foldedPanel(panelDepth, panelWidth, [0, height - USM.sheet / 2, z], [-Math.PI / 2, 0, 0]));
    panels.push(foldedPanel(panelDepth, panelWidth, [0, bottom + USM.tubeRadius, z], [-Math.PI / 2, 0, 0]));
    panels.push(foldedPanel(panelWidth, panelHeight, [doorFace - USM.sheet / 2, middle, z], [0, Math.PI / 2, 0]));
    panels.push(foldedPanel(panelWidth, panelHeight, [-doorFace + USM.sheet / 2, middle, z], [0, -Math.PI / 2, 0]));

    const lockY = top - USM.lockDrop;
    dark.push(tube(0.0005, [doorFace + 0.0003, lockY, z], [0, 0, Math.PI / 2], USM.lockRadius + 0.0007));
    chrome.push(tube(0.002, [doorFace + 0.0015, lockY, z], [0, 0, Math.PI / 2], USM.lockRadius));
    chrome.push(tube(0.0007, [doorFace + 0.0027, lockY, z], [0, 0, Math.PI / 2], USM.lockRadius - 0.002));
    dark.push(box([0.0003, 0.010, 0.0014], [doorFace + 0.0032, lockY, z]));
    for (const hingeZ of [-panelWidth / 2 + 0.037, panelWidth / 2 - 0.037]) {
      chrome.push(tube(0.023, [halfDepth + 0.0015, bottom + 0.012, z + hingeZ], [Math.PI / 2, 0, 0], 0.003));
    }
  }

  for (const side of [-1, 1]) {
    panels.push(foldedPanel(panelDepth, panelHeight,
      [0, middle, side * (halfWidth + USM.panelOutset - USM.sheet / 2)], [0, side < 0 ? Math.PI : 0, 0]));
  }
  return { chrome: mergeParts(chrome), panels: mergeParts(panels), dark: mergeParts(dark) };
}

export function UsmLowboard() {
  const geometry = useMemo(createLowboardGeometry, []);
  useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);

  return <group name="usm-haller-lowboard" position={[...ROOM.credenza.position]}>
    <mesh name="usm-chrome-tubes-ball-joints-locks" geometry={geometry.chrome} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={1} roughness={0.2} envMapIntensity={0.75} />
    </mesh>
    <mesh name="usm-pure-white-folded-panels" geometry={geometry.panels} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.white} metalness={0.08} roughness={0.38} envMapIntensity={0.45} />
    </mesh>
    <mesh name="usm-leveling-feet-lock-details" geometry={geometry.dark} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.rubber} metalness={0.05} roughness={0.72} />
    </mesh>
  </group>;
}
