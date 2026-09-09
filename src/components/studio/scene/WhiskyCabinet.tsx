import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import type { Texture } from 'three';
import { useArrangement } from '../arrangement';
import { PALETTE } from './config';
import { IsidoroBarware } from './IsidoroBarware';
import { IsidoroFixedHalf } from './IsidoroCabinetGeometry';
import { IsidoroWorktop, WhiskyCabinetDoor, useCabinetAction } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';

type WhiskyCabinetProps = {
  readonly wood: Texture;
  readonly reducedMotion: boolean;
  readonly children: ReactNode;
};

export function WhiskyCabinet({ wood, reducedMotion, children }: WhiskyCabinetProps) {
  const { editing } = useArrangement();
  const narrow = useThree(state => state.size.width < 760);
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const toggle = useCallback(() => { if (!editing) setOpen(value => !value); }, [editing]);
  const { hovered, handlers } = useCabinetAction({ disabled: editing, onActivate: toggle });
  useEffect(() => { if (editing) setOpen(false); }, [editing]);
  const controlsVisible = !editing && (hovered || focused || open);
  return <group name="Poltrona Frau Isidoro drinks cabinet"
    userData={{
      product: 'Poltrona Frau Isidoro',
      width: WHISKY_CABINET.width,
      depth: WHISKY_CABINET.depth,
      height: WHISKY_CABINET.height,
      openWidth: WHISKY_CABINET.openWidth,
      open: open && !editing,
    }} {...handlers}>
    <IsidoroFixedHalf wood={wood}>
      <group name="complete seven-bottle whisky and Armagnac collection">{children}</group>
      <IsidoroBarware />
    </IsidoroFixedHalf>
    <WhiskyCabinetDoor open={open} reducedMotion={reducedMotion} wood={wood}
      disabled={editing} onActivate={toggle} />
    <IsidoroWorktop open={open} reducedMotion={reducedMotion} wood={wood} disabled={editing} />
    <Html center position={[0, narrow ? -0.12 : 0.76, -0.31]} zIndexRange={[17, 11]}>
      <div role="group" aria-label="Poltrona Frau Isidoro drinks cabinet"
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onPointerEnter={() => setFocused(true)} onPointerLeave={() => setFocused(false)}
        onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
        style={{
          padding: 4,
          borderRadius: 4,
          background: PALETTE.paperLight,
          opacity: controlsVisible ? 1 : 0,
          pointerEvents: controlsVisible ? 'auto' : 'none',
          transition: reducedMotion ? 'none' : 'opacity 180ms',
          boxShadow: '0 2px 12px #202d2a1a',
        }}>
        <button type="button" disabled={editing} aria-label={`${open ? 'Close' : 'Open'} Isidoro drinks cabinet`}
          aria-expanded={open} onClick={toggle} style={CONTROL_STYLE}>{open ? 'Close bar' : 'Open bar'}</button>
      </div>
    </Html>
  </group>;
}

const CONTROL_STYLE = {
  minWidth: 76,
  minHeight: 44,
  padding: 4,
  border: `1px solid ${PALETTE.line}`,
  borderRadius: 4,
  color: PALETTE.ink,
  background: 'transparent',
  font: '500 11px Manrope, sans-serif',
  cursor: 'pointer',
} satisfies CSSProperties;
