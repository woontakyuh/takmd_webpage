import { useEffect, useMemo } from 'react';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import type { Point } from './config';
import { cornerSegments, usePhone } from './Device';

export type BlockPart = {
  readonly size: Point;
  readonly position: Point;
  readonly radius: number;
};

export function MergedBlocks({ parts, color, roughness }: {
  readonly parts: readonly BlockPart[];
  readonly color: string;
  readonly roughness: number;
}) {
  const segments = cornerSegments(usePhone());
  const geometry = useMemo(() => {
    const pieces = parts.map(({ size, position, radius }) => {
      const piece = new RoundedBoxGeometry(...size, segments, radius);
      piece.translate(...position);
      return piece;
    });
    const merged = mergeGeometries(pieces);
    pieces.forEach(piece => piece.dispose());
    return merged;
  }, [parts, segments]);
  useEffect(() => () => geometry?.dispose(), [geometry]);
  if (!geometry) return null;
  return <mesh geometry={geometry} castShadow receiveShadow>
    <meshStandardMaterial color={color} roughness={roughness} />
  </mesh>;
}
