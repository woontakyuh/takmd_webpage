import { useTexture } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import type { RefObject } from 'react';
import { MathUtils, SRGBColorSpace } from 'three';
import type { Group, Texture } from 'three';
import { WhiskyBottleBody } from './WhiskyBottleBody';
import { WhiskyBottleLabel } from './WhiskyBottleLabel';
import { WHISKY_BOTTLES } from './WhiskyBottleSpecs';
import type { BottleSpec } from './WhiskyBottleSpecs';
import { useCabinetAction } from './WhiskyCabinetDoor';
import { applyWhiskyPresentation, whiskyPresentationPath } from './WhiskyInspectionMotion';
import type { WhiskyBottleId, WhiskyInspectionState } from './WhiskyInspectionState';

type CollectionProps = {
  readonly cabinet: RefObject<Group | null>;
  readonly selection: WhiskyInspectionState;
  readonly enabled: boolean;
  readonly reducedMotion: boolean;
  readonly onSelect: (id: WhiskyBottleId) => void;
  readonly onReturned: () => void;
};

function InspectableBottle({ bottle, texture, cabinet, selection, enabled, reducedMotion, onSelect, onReturned }: CollectionProps & {
  readonly bottle: BottleSpec & { readonly image: WhiskyBottleId };
  readonly texture: Texture;
}) {
  const group = useRef<Group>(null);
  const path = useRef<ReturnType<typeof whiskyPresentationPath> | null>(null);
  const progress = useRef(0);
  const away = useRef(false);
  const selected = selection?.bottle === bottle.image;
  const presenting = selected && !selection.returning;
  const { handlers } = useCabinetAction({ disabled: !enabled, onActivate: () => onSelect(bottle.image) });
  useLayoutEffect(() => {
    if (presenting && group.current?.parent && cabinet.current) {
      path.current = whiskyPresentationPath(cabinet.current, group.current.parent, bottle.position);
      away.current = true;
    }
  }, [bottle.position, cabinet, presenting]);
  useFrame((state, delta) => {
    if (!group.current || !path.current) return;
    const target = presenting ? 1 : 0;
    if (progress.current !== target) {
      const next = reducedMotion ? target : MathUtils.damp(progress.current, target, 5, delta);
      progress.current = Math.abs(next - target) < 0.001 ? target : next;
      applyWhiskyPresentation(group.current, path.current, progress.current);
      group.current.userData.presentationProgress = progress.current;
      state.invalidate();
    }
    if (away.current && progress.current === 0) {
      away.current = false;
      onReturned();
    }
  });
  return <group ref={group} name={bottle.name} position={bottle.position}
    userData={{ whiskyBottle: bottle.image, selected, presentationProgress: progress.current }} {...handlers}>
    <WhiskyBottleBody bottle={bottle} />
    {bottle.labels.map((label, index) => <WhiskyBottleLabel key={index} bottle={bottle} label={label} texture={texture} />)}
  </group>;
}

export function WhiskyCollection(props: CollectionProps) {
  const sources = useTexture(WHISKY_BOTTLES.map(bottle => bottle.image));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return <group name="favorite-whisky-collection">
    {WHISKY_BOTTLES.map((bottle, index) => {
      const texture = textures[index];
      return texture ? <InspectableBottle key={bottle.name} bottle={bottle} texture={texture} {...props} /> : null;
    })}
  </group>;
}

useTexture.preload(WHISKY_BOTTLES.map(bottle => bottle.image));
