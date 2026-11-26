import { HoverAccent } from './HoverAccent';
import type { ReactNode } from 'react';
import type { ExhibitId } from '../types';
import type { Point } from './config';
import { useSceneAction } from './useSceneAction';
import { useArrangement } from '../arrangement';

type InteractiveProps = {
  readonly id: ExhibitId;
  readonly selected: ExhibitId | null;
  readonly onSelect: (id: ExhibitId) => void;
  readonly reducedMotion: boolean;
  readonly position: Point;
  readonly rotation?: number;
  readonly fixed?: boolean;
  readonly name?: string;
  readonly onActivate?: () => void;
  readonly onHoverChange?: (hovered: boolean) => void;
  readonly children: ReactNode;
};

export function Interactive({ id, selected, onSelect, position, rotation = 0, name, onActivate, onHoverChange, children }: InteractiveProps) {
  const { editing } = useArrangement();
  const { hovered, handlers } = useSceneAction({
    disabled: editing,
    onActivate: () => { if (selected !== id || onActivate) (onActivate ?? (() => onSelect(id)))(); },
    onHoverChange,
  });
  return (
    <group name={name ?? `Exhibit ${id}`} position={[...position]} rotation={[0, rotation, 0]} {...handlers}>
      <HoverAccent active={hovered && selected !== id && !onHoverChange}>{children}</HoverAccent>
    </group>
  );
}
