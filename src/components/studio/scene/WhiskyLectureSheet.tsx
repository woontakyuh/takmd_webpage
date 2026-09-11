import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { BackSide, FrontSide, MathUtils, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { lectureSheetPoint } from './WhiskyLectureMotion';

export function shapeLectureSheet(geometry: PlaneGeometry, progress: number) {
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const point = lectureSheetPoint((uv.getX(vertex) - .5) * WHISKY_LECTURE.width,
      (uv.getY(vertex) - .5) * WHISKY_LECTURE.height, progress);
    positions.setXYZ(vertex, point.x, point.y, point.z);
  }
  positions.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
}

export function createLectureSheet(progress: number) {
  const geometry = new PlaneGeometry(WHISKY_LECTURE.width, WHISKY_LECTURE.height, 64, 24);
  shapeLectureSheet(geometry, progress);
  return geometry;
}

export function WhiskyLectureSheet({ page, count, cursor, texture }: {
  readonly page: number;
  readonly count: number;
  readonly cursor: RefObject<number>;
  readonly texture: Texture | undefined;
}) {
  const geometry = useMemo(() => createLectureSheet(MathUtils.clamp(cursor.current - page, 0, 1)), [cursor, page]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const progress = MathUtils.clamp(cursor.current - page, 0, 1);
    if (geometry.userData.progress === progress) return;
    geometry.userData.progress = progress;
    shapeLectureSheet(geometry, progress);
    const depth = ((count - page - 1) * (1 - progress) + page * progress) * WHISKY_LECTURE.sheetThickness;
    geometry.translate(0, 0, depth);
  });
  return <group name={`Whisky lecture sheet ${page + 1}`}>
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial map={texture ?? null} color={PALETTE.paperLight} side={FrontSide}
        roughness={.96} metalness={0} emissive={PALETTE.white} emissiveMap={texture ?? null}
        emissiveIntensity={texture ? .28 : 0} toneMapped={false}
        onUpdate={material => { material.needsUpdate = true; }} />
    </mesh>
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color={PALETTE.paperLight} side={BackSide} roughness={.96} />
    </mesh>
  </group>;
}
