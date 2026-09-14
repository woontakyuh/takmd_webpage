import type { ExhibitId } from '../types';
import { requestOfficePath } from '../officeNavigation';
import { Html, useCursor } from '@react-three/drei';
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
  readonly label: string;
  readonly position: Point;
  readonly route: `/workshops/${string}`;
  readonly children: ReactNode;
};

function WorkshopLink({ focused, onApproach, label, position, route, children }: WorkshopLinkProps) {
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
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(event) => {
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
      {children}
      {hovered && (
        <Html center position={[0.32, 0.28, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <span style={{
            display: 'block',
            width: 'max-content',
            maxWidth: '168px',
            padding: '7px 10px',
            border: `1px solid ${PALETTE.line}`,
            borderRadius: '4px',
            background: 'rgba(248, 246, 240, 0.96)',
            boxShadow: '0 8px 24px rgba(32, 45, 42, 0.14)',
            color: PALETTE.ink,
            font: '600 11px Manrope, Arial, sans-serif',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}>{label}</span>
        </Html>
      )}
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
  const cadaver = workshops[1];
  const animal = workshops[2];

  return (
    <group rotation={[0, 0, 0]}>
      <WorkshopLink focused={focused} onApproach={onApproach} label={dummy.title} route={`/workshops/${dummy.slug}`} position={[COLLECTION_X, CABINET_TOP + 0.014, 0.70]}>
        <EndoscopicLumbarBox />
      </WorkshopLink>
      <WorkshopLink focused={focused} onApproach={onApproach} label={animal.title} route={`/workshops/${animal.slug}`} position={[COLLECTION_X, CABINET_TOP, 0.19]}>
        <PigPlush />
      </WorkshopLink>
      <WorkshopLink focused={focused} onApproach={onApproach} label={cadaver.title} route={`/workshops/${cadaver.slug}`} position={[COLLECTION_X, CABINET_TOP, -0.31]}>
        <EndoscopeTray />
      </WorkshopLink>
    </group>
  );
}
