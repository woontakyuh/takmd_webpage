import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { OfficeCollection, StudioSceneProps } from '../types';
import { useDocumentTexture } from './CollectionTextures';
import { beginFolioTurn, settleFolioTurn } from './folioTurn';
import type { FolioTurnState } from './folioTurn';
import { Interactive } from './Interactive';
import { Block } from './Primitives';
import { usePrintedTexture } from './Textures';
import { MOTION, PALETTE, ROOM } from './config';

type FolioProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion' | 'progress' | 'collection'>;

type FolioPaper = {
  readonly id: string;
  readonly image: string | null;
  readonly title: string;
  readonly eyebrow: string;
  readonly detail: string;
};

function paperFromCollection(collection: OfficeCollection): FolioPaper {
  const publication = collection.publication;
  const media = collection.paperMedia;
  return {
    id: publication?.id ?? 'research-folio',
    image: media?.pageImage ?? null,
    title: publication?.title ?? 'Research folio',
    eyebrow: `${publication?.journal ?? 'TAKMD'} / ${publication?.year ?? ''}`,
    detail: media ? 'Published first page' : 'Publication record · Open the original paper in the reader',
  };
}

export function Folio({ selected, onSelect, reducedMotion, progress, collection }: FolioProps) {
  const cover = useRef<Group>(null);
  const leaf = useRef<Group>(null);
  const leafSequence = useRef<number | null>(null);
  const linen = usePrintedTexture('linen');
  const coverPrint = usePrintedTexture('folio');
  const incoming = useMemo(() => paperFromCollection(collection), [collection.paperMedia, collection.publication]);
  const [folio, setFolio] = useState<FolioTurnState<FolioPaper>>(() => ({ kind: 'rest', displayed: incoming }));
  const observedTurn = useRef(collection.paperTurn);
  const activeTurn = folio.kind === 'turn' ? folio : null;
  const basePaper = activeTurn?.base ?? folio.displayed;
  const leafPaper = activeTurn?.leaf ?? folio.displayed;
  const baseTexture = useDocumentTexture(basePaper);
  const leafTexture = useDocumentTexture(leafPaper);

  useEffect(() => {
    const turnChanged = observedTurn.current !== collection.paperTurn;
    observedTurn.current = collection.paperTurn;
    if (reducedMotion || selected !== 'research') {
      setFolio({ kind: 'rest', displayed: incoming });
      return;
    }
    if (!turnChanged) return;
    setFolio(current => beginFolioTurn(current, incoming, collection.paperDirection, collection.paperTurn));
  }, [collection.paperDirection, collection.paperTurn, incoming, reducedMotion, selected]);

  useLayoutEffect(() => {
    if (!leaf.current) return;
    if (!activeTurn) {
      leaf.current.visible = false;
      leaf.current.rotation.z = 0;
      leafSequence.current = null;
      return;
    }
    leaf.current.visible = true;
    if (!activeTurn.preserveAngle || leafSequence.current === null) leaf.current.rotation.z = activeTurn.initialAngle;
    leafSequence.current = activeTurn.sequence;
  }, [activeTurn]);

  useFrame((_, delta) => {
    if (!cover.current || !leaf.current) return;
    const value = progress.current ?? 0;
    const approach = reducedMotion ? Number(value >= 0.7) : MathUtils.smoothstep(value, 0.5, 0.95);
    const openness = selected === 'research' ? 1 : selected ? 0 : approach;
    cover.current.rotation.z = reducedMotion ? openness * Math.PI : MathUtils.damp(cover.current.rotation.z, openness * Math.PI, MOTION.object, delta);
    if (!activeTurn || reducedMotion) return;
    const nextAngle = MathUtils.damp(leaf.current.rotation.z, activeTurn.target, MOTION.object, delta);
    leaf.current.rotation.z = nextAngle;
    if (Math.abs(nextAngle - activeTurn.target) < 0.008) {
      leaf.current.rotation.z = activeTurn.target;
      setFolio(current => current.kind === 'turn' && current.sequence === activeTurn.sequence ? settleFolioTurn(current) : current);
    }
  });
  return <Interactive id="research" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.folio.position} rotation={ROOM.folio.rotation}>
    <group scale={0.3}>
    <Block size={[1.03, 0.024, 1.36]} color={PALETTE.linen} texture={linen} radius={0.006} roughness={0.96} />
    <Block size={[0.97, 0.047, 1.29]} position={[0.014, 0.036, 0]} color={PALETTE.paperLight} radius={0.003} />
    {[0.025, 0.033, 0.043, 0.053].map(y => <Block key={y} size={[0.971, 0.001, 1.29]} position={[0.014, y, 0]} color={PALETTE.line} radius={0.0004} />)}
    <mesh position={[0.03, 0.063, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial map={baseTexture} roughness={0.95} />
    </mesh>
    <group ref={leaf} position={[-0.49, 0.066, 0]}>
      <Block size={[0.97, 0.002, 1.29]} position={[0.49, 0, 0]} color={PALETTE.paperLight} radius={0.0004} />
      <mesh position={[0.49, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial map={leafTexture} roughness={0.92} /></mesh>
      <mesh position={[0.49, -0.002, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial color={PALETTE.paperLight} roughness={0.95} /></mesh>
    </group>
    <group ref={cover} position={[-0.515, 0.074, 0]}>
      <Block size={[1.03, 0.018, 1.36]} position={[0.515, 0, 0]} color={PALETTE.linen} texture={linen} radius={0.004} roughness={0.95} />
      <mesh position={[0.52, 0.0095, -0.12]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.7, 0.72]} /><meshStandardMaterial map={coverPrint} roughness={0.96} /></mesh>
      <mesh position={[0.515, -0.0095, 0]} rotation={[Math.PI / 2, 0, 0]}><planeGeometry args={[0.97, 1.29]} /><meshStandardMaterial color={PALETTE.paperLight} roughness={0.95} /></mesh>
    </group>
    </group>
  </Interactive>;
}
