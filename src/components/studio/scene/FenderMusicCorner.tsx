import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import { Vector3 } from 'three';
import type { Group } from 'three';
import { OfficeIcon } from '../OfficeIcon';
import { useArrangement } from '../arrangement';
import { focusFov } from './config';
import { DeluxeReverb } from './DeluxeReverb';
import { FenderStrat } from './FenderStrat';
import { proposalMemory } from '../proposalMemory';
import { ProposalMemoryFrame } from './ProposalMemoryFrame';
import { useSceneInspection } from './SceneInspection';
import { useCabinetAction } from './WhiskyCabinetDoor';

export const FENDER_MUSIC_CORNER_BOUNDS = {
  min: [-0.19, 0, -0.13],
  max: [0.962, 1.112, 0.16],
} as const;

export function FenderMusicCorner({ reducedMotion = false }: { readonly reducedMotion?: boolean }) {
  const corner = useRef<Group>(null);
  const close = useRef<HTMLButtonElement>(null);
  const { size } = useThree();
  const { editing } = useArrangement();
  const { inspection, setInspection } = useSceneInspection();
  const selected = inspection?.id === 'music-corner';
  const approach = useCallback(() => {
    if (!corner.current || editing) return;
    const tangent = Math.tan(focusFov(null, size.width < 760, size.width, size.height) * Math.PI / 360);
    const distance = Math.max(1.24 * size.height / Math.max(100, size.width - 64),
      1.28 * size.height / Math.max(100, size.height - 128)) / (2 * tangent);
    const target = new Vector3(0.386, 0.57, 0.02);
    const position = target.clone().add(new Vector3(distance * 0.62, distance * 0.18, distance));
    corner.current.updateWorldMatrix(true, false);
    setInspection({ id: 'music-corner', position: corner.current.localToWorld(position).toArray(), target: corner.current.localToWorld(target).toArray() });
  }, [editing, setInspection, size]);
  const guitar = useCabinetAction({ disabled: editing, onActivate: approach });
  const amplifier = useCabinetAction({ disabled: editing, onActivate: approach });
  useEffect(() => { if (selected) approach(); }, [approach, selected]);
  useEffect(() => {
    if (!selected) return;
    close.current?.focus({ preventScroll: true });
    const key = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.fullscreenElement) return;
      event.preventDefault();
      setInspection(null);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [selected, setInspection]);
  return <group ref={corner} name="Fender music corner" userData={{ front: '+Z', floorY: 0 }}>
    <group name="Approach Fender Stratocaster" position={[0, -0.006582, 0]} {...guitar.handlers}>
      <FenderStrat />
      {!editing && <Html center position={[0, 0.65, 0.14]} style={{ pointerEvents: 'none' }}>
        <button type="button" className="whisky-lecture-trigger" aria-label="Approach Fender Stratocaster"
          onClick={event => { event.stopPropagation(); if (event.detail === 0) approach(); }} />
      </Html>}
    </group>
    <group name="Approach Fender amplifier" position={[0.65, 0, 0.005]} rotation={[0, -0.035, 0]} {...amplifier.handlers}>
      <DeluxeReverb />
      <ProposalMemoryFrame {...proposalMemory} reducedMotion={reducedMotion} />
      {!editing && <Html center position={[0, 0.23, 0.14]} style={{ pointerEvents: 'none' }}>
        <button type="button" className="whisky-lecture-trigger" aria-label="Approach Fender amplifier"
          onClick={event => { event.stopPropagation(); if (event.detail === 0) approach(); }} />
      </Html>}
    </group>
    {selected && <Html fullscreen zIndexRange={[35, 30]} style={{ pointerEvents: 'none' }}
      calculatePosition={(_object, _camera, viewport) => [viewport.width / 2, viewport.height / 2]}>
      <button ref={close} className="whisky-lecture-close" type="button" aria-label="Close music corner"
        onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); setInspection(null); }}><OfficeIcon name="close" /></button>
    </Html>}
  </group>;
}
