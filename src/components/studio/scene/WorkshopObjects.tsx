import type { ExhibitId } from '../types';
import { HoverAccent } from './HoverAccent';
import { requestOfficePath } from '../officeNavigation';
import { useCursor } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useRef, useState, type ReactNode } from 'react';
import { workshops } from '../../../data/workshops';
import { Block } from './Primitives';
import { BiportalEndoscope } from './BiportalEndoscope';
import { EndoscopicLumbarBox } from './EndoscopicLumbarBox';
import { PigPlush } from './PigPlush';
import { PALETTE, ROOM } from './config';
import type { Point } from './config';
import { scheduleSceneSingleAction } from './sceneGesture';

const CLICK_DRAG_THRESHOLD = 5;
const CABINET_TOP = ROOM.credenza.position[1] + ROOM.credenza.height;
const COLLECTION_X = ROOM.credenza.position[0];

type WorkshopLinkProps = {
  readonly focused: ExhibitId | null;
  readonly onApproach: () => void;
  readonly position: Point;
  readonly route: `/workshops/${string}` | '/ube';
  readonly children: ReactNode;
};

function WorkshopLink({ focused, onApproach, position, route, children }: WorkshopLinkProps) {
  const canvas = useThree(state => state.gl.domElement);
  const pointerStart = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <group
      name={`Workshop ${route}`}
      position={[...position]}
      onPointerOver={(event) => {
        event.stopPropagation();
        if (event.pointerType !== 'touch' && !event.buttons) setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(event) => {
        setHovered(false);
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClick={(event) => {
        event.stopPropagation();
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start || event.delta >= CLICK_DRAG_THRESHOLD
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD) return;
        scheduleSceneSingleAction(canvas, () => focused === 'spine' ? requestOfficePath(route) : onApproach());
      }}
    >
      <HoverAccent active={hovered}>{children}</HoverAccent>
    </group>
  );
}

function EndoscopeTray() {
  return (
    <group name="Shared endoscopic training instrument tray">
      <Block size={[0.29, 0.018, 0.44]} position={[0, 0.009, 0]}
        color={PALETTE.aluminiumEdge} radius={0.016} roughness={0.32} metalness={0.72} />
      <Block size={[0.255, 0.012, 0.405]} position={[0, 0.021, 0]}
        color={PALETTE.paperLight} radius={0.012} roughness={0.88} />
      <BiportalEndoscope />
    </group>
  );
}

export function WorkshopObjects({ focused, onApproach }: { readonly focused: ExhibitId | null; readonly onApproach: () => void }) {
  const dummy = workshops[0];
  const animal = workshops[2];

  return (
    <group rotation={[0, 0, 0]}>
      <WorkshopLink focused={focused} onApproach={onApproach} route={`/workshops/${dummy.slug}`} position={[COLLECTION_X, CABINET_TOP + 0.014, 0.81]}>
        <EndoscopicLumbarBox />
      </WorkshopLink>
      <WorkshopLink focused={focused} onApproach={onApproach} route={`/workshops/${animal.slug}`} position={[COLLECTION_X, CABINET_TOP, 0.32]}>
        <PigPlush />
      </WorkshopLink>
      <WorkshopLink focused={focused} onApproach={onApproach} route="/ube" position={[COLLECTION_X, CABINET_TOP, 1.30]}>
        <group rotation={[0, -Math.PI / 2, 0]}><EndoscopeTray /></group>
      </WorkshopLink>
    </group>
  );
}
