import { useTexture } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import type { Group } from 'three';
import { ALBUM_IDS, BEOSOUND_ALBUMS } from './BeosoundAlbums';
import type { AlbumId } from './BeosoundAlbums';
import { Block } from './Primitives';
import { useCabinetAction } from './WhiskyCabinetDoor';

export function rackPosition(album: AlbumId): [number, number, number] { return [.495 + ALBUM_IDS.indexOf(album) * .020, .089, -.015]; }
export function BeosoundCase({ album, selected, browsing, disabled, reducedMotion, onOpen }: {
  readonly album: AlbumId; readonly selected: boolean; readonly browsing: boolean; readonly disabled: boolean;
  readonly reducedMotion: boolean; readonly onOpen: (album: AlbumId) => void;
}) {
  const record = BEOSOUND_ALBUMS[album], map = useTexture(record.cover), body = useRef<Group>(null);
  const invalidate = useThree(state => state.invalidate);
  map.colorSpace = SRGBColorSpace;
  const spine = useMemo(() => {
    const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 48;
    const context = canvas.getContext('2d');
    if (context) {
      if (map.image instanceof HTMLImageElement) context.drawImage(map.image, 0, 0, 512, 48);
      context.fillStyle = '#f8f6f0dd'; context.fillRect(8, 5, 496, 38);
      context.fillStyle = '#202d2a'; context.font = '20px sans-serif';
      context.fillText(`${record.artist} · ${record.album}`, 14, 31, 482);
    }
    const texture = new CanvasTexture(canvas); texture.colorSpace = SRGBColorSpace; return texture;
  }, [map, record]);
  useEffect(() => () => spine.dispose(), [spine]);
  const { hovered, handlers } = useCabinetAction({ visualAccent: true, disabled, onActivate: () => onOpen(album) });
  useEffect(() => invalidate(), [browsing, selected, reducedMotion, invalidate]);
  useFrame((_, delta) => {
    const group = body.current; if (!group) return;
    const factor = reducedMotion ? 1 : 1 - Math.exp(-10 * Math.min(delta, .1));
    const position = rackPosition(album), lifted = browsing && selected;
    group.position.x += (position[0] - group.position.x) * factor;
    group.position.y += (position[1] + (lifted ? .008 : 0) - group.position.y) * factor;
    group.position.z += (position[2] + (lifted ? .026 : 0) - group.position.z) * factor;
    if (Math.abs(group.position.y - position[1] - (lifted ? .008 : 0)) > .0001
      || Math.abs(group.position.z - position[2] - (lifted ? .026 : 0)) > .0001) invalidate();
  });
  return <group ref={body} name={`Album case ${album}: ${record.artist}`} position={rackPosition(album)} rotation={[0, Math.PI / 2, -.13]} {...handlers}>
    <Block size={[.142, .125, .01]} radius={.001} color="#bfc6c1" metalness={.12} roughness={.24} />
    <Block size={[.013, .122, .0108]} position={[-.063, 0, 0]} radius={.0008} color="#242a26" roughness={.4} />
    <mesh position={[.004, 0, .0056]}><planeGeometry args={[.124, .121]} /><meshStandardMaterial map={map} roughness={.55} /></mesh>
    <mesh position={[-.0712, 0, 0]} rotation={[0, -Math.PI / 2, Math.PI / 2]}><planeGeometry args={[.122, .009]} /><meshStandardMaterial map={spine} roughness={.6} /></mesh>
    <Block size={[.003, .125, .012]} position={[.07, 0, 0]} radius={.001} color={hovered ? '#F8F6F0' : '#c8cfca'} metalness={.16} roughness={.35} />
  </group>;
}
