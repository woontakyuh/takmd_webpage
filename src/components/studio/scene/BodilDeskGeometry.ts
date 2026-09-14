import { CylinderGeometry, ExtrudeGeometry, Path, Shape, TorusGeometry } from 'three';
import type { BufferGeometry } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { ROOM } from './config';
import type { Point } from './config';

const DESK = {
  floor: 0.0185,
  band: 0.115,
  skin: 0.016,
  drawerGap: 0.002,
  drawerInset: 0.006,
  pullRadius: 0.009,
  steelThickness: 0.018,
  steelFace: 0.05,
  frameHeight: 0.545,
  frameHalfSpan: 0.435,
  supportZ: 0.28,
  glideHeight: 0.002,
} as const;

type DeskGeometry = {
  readonly veneer: BufferGeometry;
  readonly steel: BufferGeometry;
  readonly recess: BufferGeometry;
  readonly glides: BufferGeometry;
};

function box(size: Point, position: Point, radius = 0.001): BufferGeometry {
  const geometry = new RoundedBoxGeometry(...size, 2, radius);
  geometry.translate(...position);
  return geometry;
}

function combine(parts: readonly BufferGeometry[]): BufferGeometry {
  const geometry = mergeGeometries([...parts]);
  parts.forEach(part => part.dispose());
  if (!geometry) throw new TypeError('Bodil desk parts must have matching geometry attributes.');
  return geometry;
}

function projectVeneer(geometry: BufferGeometry): void {
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const uv = geometry.getAttribute('uv');
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index);
    const y = positions.getY(index);
    const z = positions.getZ(index);
    const u = Math.abs(normals.getX(index)) > 0.5 ? (z + ROOM.desk.depth / 2) / 1.8 : (x + ROOM.desk.width / 2) / 1.8;
    const v = Math.abs(normals.getY(index)) > 0.5 ? (z + ROOM.desk.depth / 2) / 1.8 : y / 1.8;
    uv.setXY(index, u, v);
  }
  uv.needsUpdate = true;
}

function drawerFace(width: number, height: number, center: Point): BufferGeometry {
  const outline = new Shape();
  outline.moveTo(-width / 2, -height / 2);
  outline.lineTo(width / 2, -height / 2);
  outline.lineTo(width / 2, height / 2);
  outline.lineTo(-width / 2, height / 2);
  outline.closePath();
  const pull = new Path();
  pull.absarc(0, 0, DESK.pullRadius, 0, Math.PI * 2, true);
  outline.holes.push(pull);
  const geometry = new ExtrudeGeometry(outline, {
    depth: DESK.skin - 0.001,
    bevelEnabled: true,
    bevelSegments: 1,
    steps: 1,
    bevelSize: 0.0005,
    bevelThickness: 0.0005,
    curveSegments: 16,
  });
  geometry.translate(center[0], center[1], center[2] - DESK.skin);
  return geometry;
}

export function createBodilDeskGeometry(): DeskGeometry {
  const { width, height, depth } = ROOM.desk;
  const top = DESK.floor + height;
  const underside = top - DESK.band;
  const middle = top - DESK.band / 2;
  const openingHeight = DESK.band - 2 * DESK.skin;
  const openingWidth = width - 2 * DESK.skin;
  const drawerWidth = (openingWidth - 5 * DESK.drawerGap) / 4;
  const drawerZ = depth / 2 - DESK.drawerInset;
  const frameTop = DESK.floor + DESK.frameHeight;
  const railY = frameTop - DESK.steelFace / 2;
  const steel: BufferGeometry[] = [];
  const glides: BufferGeometry[] = [];
  const recess: BufferGeometry[] = [box([openingWidth, openingHeight, depth - 0.058], [0, middle, -0.014])];
  const veneer: BufferGeometry[] = [
    box([width, DESK.skin, depth], [0, top - DESK.skin / 2, 0], 0.0012),
    box([width, DESK.skin, depth], [0, underside + DESK.skin / 2, 0], 0.0012),
    box([DESK.skin, openingHeight, depth], [-(width - DESK.skin) / 2, middle, 0]),
    box([DESK.skin, openingHeight, depth], [(width - DESK.skin) / 2, middle, 0]),
    box([openingWidth, openingHeight, DESK.skin], [0, middle, -(depth - DESK.skin) / 2]),
  ];

  for (let index = 0; index < 4; index += 1) {
    const x = -openingWidth / 2 + DESK.drawerGap + drawerWidth / 2 + index * (drawerWidth + DESK.drawerGap);
    veneer.push(drawerFace(drawerWidth, openingHeight - 2 * DESK.drawerGap, [x, middle, drawerZ]));
    const well = new CylinderGeometry(DESK.pullRadius - 0.0005, DESK.pullRadius - 0.0005, 0.004, 24);
    well.rotateX(Math.PI / 2);
    well.translate(x, middle, drawerZ - 0.007);
    recess.push(well.toNonIndexed());
    well.dispose();
    const rim = new TorusGeometry(DESK.pullRadius - 0.0005, 0.0007, 6, 24);
    rim.translate(x, middle, drawerZ - 0.0007);
    steel.push(rim.toNonIndexed());
    rim.dispose();
    steel.push(box([0.01, 0.002, 0.004], [x, middle - 0.002, drawerZ - 0.003], 0.0004));
  }

  for (const x of [-DESK.frameHalfSpan, DESK.frameHalfSpan]) {
    steel.push(
      box([DESK.steelThickness, DESK.steelFace, depth], [x, railY, 0], 0.0007),
      box([DESK.steelThickness, DESK.steelFace, depth], [x, DESK.floor + DESK.glideHeight + DESK.steelFace / 2, 0], 0.0007),
    );
    for (const side of [-1, 1]) {
      const z = side * (depth - DESK.steelFace) / 2;
      const legHeight = DESK.frameHeight - 2 * DESK.steelFace - DESK.glideHeight;
      steel.push(box([DESK.steelThickness, legHeight, DESK.steelFace],
        [x, DESK.floor + DESK.glideHeight + DESK.steelFace + legHeight / 2, z], 0.0007));
      steel.push(box([DESK.steelThickness, underside - frameTop, 0.034],
        [x, (underside + frameTop) / 2, side * DESK.supportZ], 0.0005));
      glides.push(box([0.014, DESK.glideHeight, 0.04], [x, DESK.floor + DESK.glideHeight / 2, z], 0.0003));
    }
  }
  steel.push(
    box([2 * DESK.frameHalfSpan - DESK.steelThickness, DESK.steelFace, DESK.steelThickness], [0, railY, 0], 0.0007),
    box([0.044, underside - frameTop, DESK.steelThickness], [0, (underside + frameTop) / 2, 0], 0.0005),
  );

  const timber = combine(veneer);
  projectVeneer(timber);
  return { veneer: timber, steel: combine(steel), recess: combine(recess), glides: combine(glides) };
}
