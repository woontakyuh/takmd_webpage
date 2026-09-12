import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { ThreeElements } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { DataTexture, MathUtils, RepeatWrapping, SRGBColorSpace } from 'three';
import type { BookSurface } from '../personalBookSurfaces';
import { PALETTE } from './config';
import { createMagazineLeafGeometry, shapeMagazineLeaf } from './MagazineLeafGeometry';
import type { MagazineLeafShape } from './MagazineLeafGeometry';

function PrintedMaterial({ surface, attach, cover, reading }: {
  readonly surface: BookSurface;
  readonly attach: string;
  readonly cover: boolean;
  readonly reading: boolean;
}) {
  const texture = useTexture(surface.src, loaded => {
    if (Array.isArray(loaded)) return;
    loaded.colorSpace = SRGBColorSpace;
    loaded.anisotropy = 8;
  });
  return <meshStandardMaterial attach={attach} map={texture} color={surface.albedo ?? PALETTE.white}
    roughness={cover ? .72 : .92} metalness={0} emissive={PALETTE.white} emissiveMap={texture}
    emissiveIntensity={reading ? .48 : 0} toneMapped={false} />;
}

export function MagazineLeaf({ shape, front, back, cursor, leafIndex, cover = false, reading = false, handlers, name }: {
  readonly shape: MagazineLeafShape;
  readonly front?: BookSurface;
  readonly back?: BookSurface;
  readonly cursor: RefObject<number>;
  readonly leafIndex: number;
  readonly cover?: boolean;
  readonly reading?: boolean;
  readonly handlers?: ThreeElements['group'];
  readonly name: string;
}) {
  const lastProgress = useRef(-1);
  const { geometry, flat } = useMemo(() => {
    const created = createMagazineLeafGeometry(shape, { front, back });
    shapeMagazineLeaf(created.geometry, created.flat, {
      ...shape, progress: MathUtils.clamp(cursor.current - leafIndex, 0, 1),
    });
    return created;
  }, [shape, front, back, cursor, leafIndex]);
  const edgeTexture = useMemo(() => {
    const texture = new DataTexture(new Uint8Array([223, 223, 223, 255,
      255, 255, 255, 255, 255, 255, 255, 255, 250, 250, 250, 255]), 1, 4);
    texture.colorSpace = SRGBColorSpace;
    texture.wrapT = RepeatWrapping;
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => {
    lastProgress.current = -1;
    return () => geometry.dispose();
  }, [geometry]);
  useEffect(() => () => edgeTexture.dispose(), [edgeTexture]);
  useFrame(() => {
    const progress = MathUtils.clamp(cursor.current - leafIndex, 0, 1);
    if (Math.abs(progress - lastProgress.current) < .00001) return;
    lastProgress.current = progress;
    shapeMagazineLeaf(geometry, flat, { ...shape, progress });
  });
  return <group {...handlers} name={name}>
    <mesh geometry={geometry} castShadow receiveShadow>
      {[0, 1, 2, 3].map(face => <meshStandardMaterial key={face} attach={`material-${face}`}
        map={edgeTexture} color={PALETTE.paperLight} roughness={.94} />)}
      {front ? <PrintedMaterial surface={front} attach="material-4" cover={cover} reading={reading} />
        : <meshStandardMaterial attach="material-4" color={PALETTE.paperLight} roughness={.94}
          emissive={PALETTE.paperLight} emissiveIntensity={reading ? .48 : 0} toneMapped={false} />}
      {back ? <PrintedMaterial surface={back} attach="material-5" cover={false} reading={reading} />
        : <meshStandardMaterial attach="material-5" color={PALETTE.paperLight} roughness={.94}
          emissive={PALETTE.paperLight} emissiveIntensity={reading ? .48 : 0} toneMapped={false} />}
    </mesh>
  </group>;
}
