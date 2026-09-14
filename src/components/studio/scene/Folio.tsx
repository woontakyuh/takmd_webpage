import { useFrame, useThree } from '@react-three/fiber';
import type { ThreeEvent } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { MathUtils } from 'three';
import type { Group } from 'three';
import type { OfficeCollection, StudioSceneProps } from '../types';
import { useDocumentTexture } from './CollectionTextures';
import { beginFolioTurn, settleFolioTurn } from './folioTurn';
import type { FolioTurnState } from './folioTurn';
import { FOLIO, folioBindingPose, folioStackLayers } from './folioGeometry';
import { FolioStack } from './FolioStack';
import { Interactive } from './Interactive';
import { Block } from './Primitives';
import { usePrintedTexture } from './Textures';
import { MOTION, PALETTE, ROOM } from './config';
import { scheduleSceneSingleAction } from './sceneGesture';

type FolioProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'onPaperStep' | 'reducedMotion' | 'progress' | 'collection'>;

type FolioPaper = {
  readonly id: string;
  readonly index: number;
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
    index: collection.paperIndex,
    image: media?.pageImage ?? null,
    title: publication?.title ?? 'Research folio',
    eyebrow: `${publication?.journal ?? 'TAKMD'} / ${publication?.year ?? ''}`,
    detail: media ? 'Published first page' : 'Publication record · Open the original paper in the reader',
  };
}

const CLICK_DRAG_THRESHOLD = 5;

export function Folio({ selected, onSelect, onPaperStep, reducedMotion, progress, collection }: FolioProps) {
  const canvas = useThree(state => state.gl.domElement);
  const cover = useRef<Group>(null);
  const spine = useRef<Group>(null);
  const leaf = useRef<Group>(null);
  const leafSequence = useRef<number | null>(null);
  const pointerStart = useRef<{ readonly pointerId: number; readonly x: number; readonly y: number; readonly direction: 1 | -1 } | null>(null);
  const linen = usePrintedTexture('linen');
  const coverPrint = usePrintedTexture('folio');
  const incoming = useMemo(() => paperFromCollection(collection), [collection.paperMedia, collection.publication, collection.paperIndex]);
  const [folio, setFolio] = useState<FolioTurnState<FolioPaper>>(() => ({ kind: 'rest', displayed: incoming }));
  const [coverHovered, setCoverHovered] = useState(false);
  const observedTurn = useRef(collection.paperTurn);
  const activeTurn = folio.kind === 'turn' ? folio : null;
  const basePaper = activeTurn?.base ?? folio.displayed;
  const leafPaper = activeTurn?.leaf ?? folio.displayed;
  const baseTexture = useDocumentTexture(basePaper);
  const leafTexture = useDocumentTexture(leafPaper);
  const stacks = folioStackLayers(folio, collection.paperCount);
  const sheetThickness = FOLIO.pageThickness / Math.max(1, collection.paperCount);
  const leftThickness = stacks.left * sheetThickness;
  const rightThickness = stacks.right * sheetThickness;
  const turningThickness = stacks.turning * sheetThickness;

  const beginPaperStep = (direction: 1 | -1) => (event: ThreeEvent<PointerEvent>) => {
    if (selected !== 'research') return;
    event.stopPropagation();
    pointerStart.current = event.button !== 0 || !event.isPrimary || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
      ? null
      : { pointerId: event.pointerId, x: event.clientX, y: event.clientY, direction };
  };
  const cancelPaperStep = () => { pointerStart.current = null; };
  const stepPaper = (direction: 1 | -1) => (event: ThreeEvent<PointerEvent>) => {
    if (selected !== 'research') return;
    event.stopPropagation();
    const start = pointerStart.current;
    pointerStart.current = null;
    if (event.button !== 0 || !event.isPrimary || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
      || !start || event.pointerId !== start.pointerId || direction !== start.direction
      || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD) return;
    scheduleSceneSingleAction(canvas, () => onPaperStep(direction));
  };

  useEffect(() => {
    if (selected !== 'research') return;
    const cancel = () => { pointerStart.current = null; };
    const trackPointer = (event: PointerEvent) => {
      const start = pointerStart.current;
      if (start && (event.pointerId !== start.pointerId || event.shiftKey || event.ctrlKey || event.metaKey || event.altKey
        || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD)) cancel();
    };
    window.addEventListener('pointerdown', trackPointer, true);
    window.addEventListener('pointermove', trackPointer, true);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('blur', cancel);
    return () => {
      cancel();
      window.removeEventListener('pointerdown', trackPointer, true);
      window.removeEventListener('pointermove', trackPointer, true);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('blur', cancel);
    };
  }, [selected]);

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
    if (!cover.current || !spine.current || !leaf.current) return;
    const value = progress.current ?? 0;
    const approach = reducedMotion ? Number(value >= 0.7) : MathUtils.smoothstep(value, 0.5, 0.95);
    const tourAngle = approach * Math.PI;
    const hoverAngle = coverHovered ? Math.PI / 9 : 0;
    const coverAngle = selected === 'research' ? Math.PI : Math.max(tourAngle, hoverAngle);
    cover.current.rotation.z = reducedMotion ? coverAngle : MathUtils.damp(cover.current.rotation.z, coverAngle, MOTION.object, delta);
    const binding = folioBindingPose(cover.current.rotation.z);
    cover.current.position.set(binding.coverX, binding.coverY, 0);
    spine.current.rotation.z = binding.spineAngle;
    if (!activeTurn || reducedMotion) return;
    const nextAngle = MathUtils.damp(leaf.current.rotation.z, activeTurn.target, MOTION.object, delta);
    leaf.current.rotation.z = nextAngle;
    const transfer = nextAngle / Math.PI;
    leaf.current.position.set(
      MathUtils.lerp(FOLIO.rightPageX, binding.coverX - 0.03, transfer),
      MathUtils.lerp(FOLIO.paperBaseY + rightThickness, FOLIO.coverLiningY + leftThickness, transfer) + turningThickness / 2 + 0.001,
      0,
    );
    if (Math.abs(nextAngle - activeTurn.target) < 0.008) {
      leaf.current.rotation.z = activeTurn.target;
      setFolio(current => current.kind === 'turn' && current.sequence === activeTurn.sequence ? settleFolioTurn(current) : current);
    }
  });
  return <Interactive id="research" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.folio.position} rotation={ROOM.folio.rotation} onHoverChange={setCoverHovered}>
    <group scale={0.3}>
    <Block size={[1.03, 0.024, 1.36]} color={PALETTE.linen} texture={linen} radius={0.006} roughness={0.96} />
    <group name="Folio connected spine" ref={spine} position={[FOLIO.hingeX, 0, 0]}>
      <Block size={[0.022, FOLIO.spineHeight, 1.36]} position={[0, FOLIO.spineHeight / 2, 0]} color={PALETTE.linen} texture={linen} radius={0.006} roughness={0.96} />
    </group>
    <FolioStack thickness={rightThickness} centerX={0} baseY={FOLIO.paperBaseY} />
    <mesh name="Folio next page" position={[0, FOLIO.paperBaseY + rightThickness + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow
      onPointerDown={beginPaperStep(1)} onPointerCancel={cancelPaperStep} onPointerUp={stepPaper(1)}>
      <planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial map={baseTexture} roughness={0.95} />
    </mesh>
    <group name="Folio turning leaf" ref={leaf} position={[FOLIO.rightPageX, FOLIO.paperBaseY + rightThickness, 0]}>
      <Block size={[0.97, Math.max(0.001, turningThickness), 1.29]} position={[0.485, 0, 0]} color={PALETTE.paperLight} radius={0.0004} />
      <mesh name="Folio turning next page" position={[0.485, turningThickness / 2 + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow
        onPointerDown={beginPaperStep(1)} onPointerCancel={cancelPaperStep} onPointerUp={stepPaper(1)}>
        <planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial map={leafTexture} roughness={0.95} />
      </mesh>
      <mesh name="Folio turning previous page" position={[0.485, -turningThickness / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow
        onPointerDown={beginPaperStep(-1)} onPointerCancel={cancelPaperStep} onPointerUp={stepPaper(-1)}>
        <planeGeometry args={[0.93, 1.25]} /><meshStandardMaterial color={PALETTE.paperLight} roughness={0.95} />
      </mesh>
    </group>
    <group name="Folio front cover" ref={cover} position={[FOLIO.hingeX, FOLIO.spineHeight, 0]}>
      <Block size={[1.03, 0.018, 1.36]} position={[0.515, 0, 0]} color={PALETTE.linen} texture={linen} radius={0.004} roughness={0.95} />
      <mesh name="Folio cover print" position={[0.52, 0.0095, -0.12]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[0.7, 0.72]} /><meshStandardMaterial map={coverPrint} roughness={0.95} /></mesh>
      <FolioStack thickness={leftThickness} centerX={0.515} baseY={-FOLIO.coverLiningY} underside />
      <mesh name="Folio previous page" position={[0.515, -FOLIO.coverLiningY - leftThickness - 0.001, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow
        onPointerDown={beginPaperStep(-1)} onPointerCancel={cancelPaperStep} onPointerUp={stepPaper(-1)}>
        <planeGeometry args={[0.97, 1.29]} /><meshStandardMaterial color={PALETTE.paperLight} roughness={0.95} />
      </mesh>
    </group>
    </group>
  </Interactive>;
}
