import { MathUtils } from 'three';
import { PAPER_LEAF_THICKNESS } from './bookGeometry';

export type MagazineDimensions = {
  readonly width: number;
  readonly height: number;
  readonly thickness: number;
};

export function magazinePacketLayout(dimensions: MagazineDimensions,
  spreads: readonly { readonly leftLeaves?: number }[]) {
  const coverThickness = Math.min(.00035, dimensions.thickness * .12);
  const paperDepth = dimensions.thickness - coverThickness * 2;
  const baseZ = -dimensions.thickness / 2 + coverThickness;
  let previousDepth = 0;
  const leaves = spreads.length ? spreads : [{ leftLeaves: 0 }];
  const minimumLeaf = Math.min(PAPER_LEAF_THICKNESS, paperDepth * .94 / (leaves.length + 1));
  const packets = leaves.map((spread, index) => {
    const requested = spread.leftLeaves === undefined
      ? paperDepth * (index + 1) / (spreads.length + 1)
      : spread.leftLeaves * PAPER_LEAF_THICKNESS;
    const lowerDepth = previousDepth + (index === 0 ? 0 : minimumLeaf);
    const upperDepth = paperDepth * .94 - (leaves.length - index - 1) * minimumLeaf;
    const leftDepth = MathUtils.clamp(requested, lowerDepth, upperDepth);
    const transferredDepth = leftDepth - previousDepth;
    const depth = transferredDepth + (index === 0 ? coverThickness : 0);
    const startZ = baseZ + paperDepth - leftDepth + depth / 2;
    const endZ = baseZ + previousDepth + depth / 2 - (index === 0 ? coverThickness : 0);
    previousDepth = leftDepth;
    return { depth, startZ, endZ };
  });
  return { coverThickness, paperDepth, baseZ, packets, remainingDepth: paperDepth - previousDepth };
}

export function magazineSheetPoint({ distance, width, progress, opening = 0, spreadAngle = Math.PI * .92 }: {
  readonly distance: number;
  readonly width: number;
  readonly progress: number;
  readonly opening?: number;
  readonly spreadAngle?: number;
}) {
  const turn = MathUtils.clamp(progress, 0, 1);
  const bend = 1.32 * Math.sin(Math.PI * turn);
  const cradleAngle = .04 * Math.PI * MathUtils.clamp(opening, 0, 1);
  const travel = opening > 0 ? spreadAngle : Math.PI;
  const rootAngle = -cradleAngle - travel * turn - bend / 2;
  const angle = rootAngle + bend * distance / width;
  if (Math.abs(bend) < .00001) {
    return { x: distance * Math.cos(rootAngle), z: -distance * Math.sin(rootAngle), angle };
  }
  return {
    x: width * (Math.sin(angle) - Math.sin(rootAngle)) / bend,
    z: width * (Math.cos(angle) - Math.cos(rootAngle)) / bend,
    angle,
  };
}
