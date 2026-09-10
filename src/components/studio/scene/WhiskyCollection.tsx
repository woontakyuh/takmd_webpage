import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { SRGBColorSpace } from 'three';
import type { Group, Texture } from 'three';
import { WhiskyBottleBody } from './WhiskyBottleBody';
import { WhiskyBottleLabel } from './WhiskyBottleLabel';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';
import type { BottleSpec } from './WhiskyBottleSpecs';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { advanceWhiskyProgress, applyWhiskyPresentation, resolveWhiskyBottleClearance, whiskyPresentationPath } from './WhiskyInspectionMotion';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';

type CollectionProps = {
  readonly cabinet: RefObject<Group | null>;
  readonly selection: WhiskyInspectionState;
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly onSelect: (id: WhiskyBottleId) => void;
  readonly onReturned: (id: WhiskyBottleId) => void;
};

// The render loop owns these mutable animation values independently of React selection.
type BottleMotion = {
  readonly bottle: BottleSpec & { readonly image: WhiskyBottleId };
  readonly group: Group;
  path: ReturnType<typeof whiskyPresentationPath> | null;
  progress: number;
  velocity: number;
  away: boolean;
};

type MotionRegistry = RefObject<Map<WhiskyBottleId, BottleMotion>>;

function InspectableBottle({ bottle, texture, selection, enabled, onSelect, motions }: Pick<CollectionProps, 'selection' | 'enabled' | 'onSelect'> & {
  readonly bottle: BottleSpec & { readonly image: WhiskyBottleId };
  readonly texture: Texture;
  readonly motions: MotionRegistry;
}) {
  const group = useRef<Group>(null);
  const selected = selection?.bottle === bottle.image && !selection.returning;
  const { handlers } = useCabinetAction({ disabled: !enabled, onActivate: () => onSelect(bottle.image) });
  useLayoutEffect(() => {
    if (!group.current) return;
    const registry = motions.current;
    registry.set(bottle.image, { bottle, group: group.current, path: null, progress: 0, velocity: 0, away: false });
    return () => { registry.delete(bottle.image); };
  }, [bottle, motions]);
  return <group ref={group} name={bottle.name} position={bottle.position}
    userData={{ whiskyBottle: bottle.image, selected }} {...handlers}>
    <WhiskyBottleBody bottle={bottle} />
    {bottle.labels.map((label, index) => <WhiskyBottleLabel key={index} bottle={bottle} label={label} texture={texture} />)}
  </group>;
}

export function WhiskyCollection({ cabinet, selection, enabled, reducedMotion, onSelect, onReturned }: CollectionProps) {
  const motions = useRef(new Map<WhiskyBottleId, BottleMotion>());
  const sources = useTexture(WHISKY_BOTTLES.map(bottle => bottle.image));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  useFrame((state, delta) => {
    if (!cabinet.current) return;
    const bottles = [...motions.current.values()];
    let moving = false;
    for (const motion of bottles) {
      const presenting = selection?.bottle === motion.bottle.image && !selection.returning;
      if (presenting && motion.progress === 0 && motion.group.parent) {
        motion.path = whiskyPresentationPath(cabinet.current, motion.group.parent, motion.bottle);
      }
      if (!motion.path || (!presenting && !motion.away)) continue;
      motion.away = true;
      const next = advanceWhiskyProgress(motion.progress, motion.velocity, presenting, delta, reducedMotion);
      motion.progress = next.progress;
      motion.velocity = next.velocity;
      applyWhiskyPresentation(motion.group, motion.path, motion.progress);
      motion.group.userData.presentationProgress = motion.progress;
      motion.group.userData.returning = !presenting;
      moving ||= motion.velocity !== 0;
    }
    resolveWhiskyBottleClearance(bottles.map(({ bottle, group, progress, path }) => ({
      position: group.position, radius: bottle.radius, height: bottle.height, moving: progress > 0 && progress < 1,
      obstacles: path?.obstacles,
    })));
    for (const motion of bottles) {
      if (motion.away && motion.progress === 0) {
        motion.away = false;
        onReturned(motion.bottle.image);
      }
    }
    if (moving) state.invalidate();
  });
  return <group name="favorite-whisky-collection">
    {WHISKY_BOTTLES.map((bottle, index) => {
      const texture = textures[index];
      return texture ? <InspectableBottle key={bottle.name} bottle={bottle} texture={texture} motions={motions}
        selection={selection} enabled={enabled} onSelect={onSelect} /> : null;
    })}
  </group>;
}

useTexture.preload(WHISKY_BOTTLES.map(bottle => bottle.image));
