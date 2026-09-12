import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import type { RefObject } from 'react';
import { BackSide, FrontSide, MathUtils, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { lectureSheetPoint } from './WhiskyLectureMotion';

export function shapeLectureSheet(geometry: PlaneGeometry, progress: number, width: number = WHISKY_LECTURE.width, height: number = WHISKY_LECTURE.height) {
  const positions = geometry.getAttribute('position');
  const uv = geometry.getAttribute('uv');
  for (let vertex = 0; vertex < positions.count; vertex++) {
    const point = lectureSheetPoint((uv.getX(vertex) - .5) * width,
      (uv.getY(vertex) - .5) * height, progress);
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

export function WhiskyLectureSheet({ page, count, cursor, texture, photoAspect }: {
  readonly page: number;
  readonly count: number;
  readonly cursor: RefObject<number>;
  readonly texture: Texture | undefined;
  readonly photoAspect?: number;
}) {
  const geometry = useMemo(() => createLectureSheet(MathUtils.clamp(cursor.current - page, 0, 1)), [cursor, page]);
  const photo = useMemo(() => {
    if (!photoAspect) return null;
    const height = Math.min(WHISKY_LECTURE.height - .036, (WHISKY_LECTURE.width - .036) / photoAspect);
    return { geometry: new PlaneGeometry(height * photoAspect, height, 64, 24), width: height * photoAspect, height };
  }, [photoAspect]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => photo?.geometry.dispose(), [photo]);
  useFrame(() => {
    const progress = MathUtils.clamp(cursor.current - page, 0, 1);
    if (geometry.userData.progress === progress) return;
    geometry.userData.progress = progress;
    shapeLectureSheet(geometry, progress);
    const depth = ((count - page - 1) * (1 - progress) + page * progress) * WHISKY_LECTURE.sheetThickness;
    geometry.translate(0, 0, depth);
    if (photo) {
      shapeLectureSheet(photo.geometry, progress, photo.width, photo.height);
      photo.geometry.translate(0, 0, depth + .00006);
    }
  });
  return <group name={`Whisky lecture sheet ${page + 1}`}>
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial map={photo ? null : texture ?? null} color={PALETTE.paperLight} side={FrontSide}
        roughness={.96} metalness={0} emissive={PALETTE.white} emissiveMap={photo ? null : texture ?? null}
        emissiveIntensity={texture && !photo ? .28 : 0} toneMapped={false}
        onUpdate={material => { material.needsUpdate = true; }} />
    </mesh>
    {photo && <mesh geometry={photo.geometry} receiveShadow>
      <meshStandardMaterial map={texture ?? null} color={PALETTE.paperLight} side={FrontSide}
        roughness={.96} emissive={PALETTE.white} emissiveMap={texture ?? null} emissiveIntensity={texture ? .28 : 0} toneMapped={false}
        onUpdate={material => { material.needsUpdate = true; }} />
    </mesh>}
    <mesh geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial color={PALETTE.paperLight} side={BackSide} roughness={.96} />
    </mesh>
  </group>;
}
