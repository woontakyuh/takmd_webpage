import type { ExhibitId } from '../types';
import { HoverAccent } from './HoverAccent';
import { useGuidedView } from './GuidedView';
import { requestOfficePath } from '../officeNavigation';
import type { ReactNode } from 'react';
import { workshops } from '../../../data/workshops';
import { Block } from './Primitives';
import { BiportalEndoscope } from './BiportalEndoscope';
import { EndoscopicLumbarBox } from './EndoscopicLumbarBox';
import { PigPlush } from './PigPlush';
import { PALETTE, ROOM } from './config';
import type { Point } from './config';
import { useSceneAction } from './useSceneAction';

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
  const direct = useGuidedView() === 2;
  const { hovered, handlers } = useSceneAction({
    disabled: false,
    onActivate: () => focused === 'spine' || direct ? requestOfficePath(route) : onApproach(),
  });
  return <group name={`Workshop ${route}`} position={[...position]} {...handlers}>
    <HoverAccent active={hovered}>{children}</HoverAccent>
  </group>;
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
