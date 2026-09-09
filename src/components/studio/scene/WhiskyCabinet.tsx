import { Html } from '@react-three/drei';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Color } from 'three';
import type { Texture } from 'three';
import { useArrangement } from '../arrangement';
import { INTERIOR, LIGHTING, PALETTE } from './config';
import { Block, Rod } from './Primitives';
import { WhiskyCabinetDoor, WhiskyCabinetLightSwitch } from './WhiskyCabinetDoor';
import { WHISKY_CABINET } from './WhiskyCabinetLayout';

const WOOD_BASE = new Color(PALETTE.paperLight);
const WOOD_COLOR = `#${new Color(INTERIOR.lightWood).multiply(new Color(1 / WOOD_BASE.r, 1 / WOOD_BASE.g, 1 / WOOD_BASE.b)).getHexString()}`;
const CABINET = { panel: .03, back: .02, plinth: .1, shelf: .015, innerDepth: .4 } as const;
const SIDES = [-1, 1] as const;
type WhiskyCabinetProps = {
  readonly wood: Texture;
  readonly lamp: number;
  readonly reducedMotion: boolean;
  readonly children: ReactNode;
};

export function WhiskyCabinet({ wood, lamp, reducedMotion, children }: WhiskyCabinetProps) {
  const { editing } = useArrangement();
  const [doors, setDoors] = useState<readonly [boolean, boolean]>([false, false]);
  const [lit, setLit] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const verticalWood = useMemo(() => {
    const texture = wood.clone();
    texture.center.set(.5, .5);
    texture.rotation = Math.PI / 2;
    return texture;
  }, [wood]);
  useEffect(() => () => verticalWood.dispose(), [verticalWood]);
  useEffect(() => { if (editing) { setDoors([false, false]); setHovered(false); } }, [editing]);
  const toggleLeft = useCallback(() => { if (!editing) setDoors(([left, right]) => [!left, right]); }, [editing]);
  const toggleRight = useCallback(() => { if (!editing) setDoors(([left, right]) => [left, !right]); }, [editing]);
  const toggleLight = useCallback(() => { if (!editing) setLit(value => !value); }, [editing]);
  const power = lit ? Math.max(.06, Math.min(1, lamp)) : 0;
  const controlsVisible = !editing && (hovered || focused);
  return <group name="whisky-display-cabinet" userData={{ width: WHISKY_CABINET.width, depth: WHISKY_CABINET.depth,
    height: WHISKY_CABINET.height, shelfTops: WHISKY_CABINET.shelfTops, openLeft: !editing && doors[0], openRight: !editing && doors[1], lightOn: lit }}
    onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
    <CabinetCarcass wood={wood} verticalWood={verticalWood} />
    <CabinetStrips power={power} />
    <group name="whisky-cabinet-bottle-collection">{children}</group>
    <WhiskyCabinetLightSwitch active={lit} disabled={editing} onActivate={toggleLight} onHoverChange={setHovered} />
    <WhiskyCabinetDoor side={1} open={doors[0]} reducedMotion={reducedMotion} disabled={editing} onActivate={toggleLeft} onHoverChange={setHovered} />
    <WhiskyCabinetDoor side={-1} open={doors[1]} reducedMotion={reducedMotion} disabled={editing} onActivate={toggleRight} onHoverChange={setHovered} />
    <Html center occlude position={[0, .31, -.267]} zIndexRange={[17, 11]}>
      <div role="group" aria-label="Whisky cabinet" onFocusCapture={() => setFocused(true)}
        onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
        onPointerEnter={() => setHovered(true)} onPointerLeave={() => setHovered(false)}
        onPointerDown={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
        style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 4, background: PALETTE.paperLight,
          opacity: controlsVisible ? 1 : 0, pointerEvents: controlsVisible ? 'auto' : 'none',
          transition: reducedMotion ? 'none' : 'opacity 180ms', boxShadow: '0 2px 12px #202d2a1a' }}>
        <button type="button" disabled={editing} aria-label={`${doors[0] ? 'Close' : 'Open'} left whisky cabinet door`} aria-pressed={doors[0]}
          onClick={toggleLeft} style={CONTROL_STYLE}>Left</button>
        <button type="button" disabled={editing} aria-label={`${doors[1] ? 'Close' : 'Open'} right whisky cabinet door`} aria-pressed={doors[1]}
          onClick={toggleRight} style={CONTROL_STYLE}>Right</button>
        <button type="button" disabled={editing} aria-label="Whisky cabinet light" aria-pressed={lit}
          onClick={toggleLight} style={CONTROL_STYLE}>Light</button>
      </div>
    </Html>
  </group>;
}

const CONTROL_STYLE = { minWidth: 44, minHeight: 44, padding: 4, border: `1px solid ${PALETTE.line}`,
  borderRadius: 4, color: PALETTE.ink, background: 'transparent', font: '500 11px Manrope, sans-serif', cursor: 'pointer' } satisfies CSSProperties;

function CabinetCarcass({ wood, verticalWood }: { readonly wood: Texture; readonly verticalWood: Texture }) {
  const { width, depth, height, shelfTops } = WHISKY_CABINET;
  const insideWidth = width - CABINET.panel * 2;
  return <group name="beige-oak-cabinet-joinery">
    <Block size={[width - .13, CABINET.plinth, depth - .12]} position={[0, CABINET.plinth / 2, .025]}
      color={WHISKY_CABINET.frame} radius={.003} roughness={.78} />
    <Block size={[width, .028, depth]} position={[0, .114, 0]} color={WOOD_COLOR} texture={wood} radius={.0025} roughness={.56} />
    <Block size={[width, CABINET.panel, depth]} position={[0, height - CABINET.panel / 2, 0]}
      color={WOOD_COLOR} texture={wood} radius={.0025} roughness={.51} />
    {SIDES.map(side => <Block key={side} size={[CABINET.panel, height - .158, depth - .02]}
      position={[side * (width - CABINET.panel) / 2, (height + .098) / 2, .01]}
      color={WOOD_COLOR} texture={verticalWood} radius={.0025} roughness={.55} />)}
    <Block size={[insideWidth, height - .158, CABINET.back]}
      position={[0, (height + .098) / 2, (depth - CABINET.back) / 2]}
      color={WOOD_COLOR} texture={verticalWood} radius={.0015} roughness={.69} />
    <group name="two-flush-lower-storage-fronts">
      {SIDES.map(side => <Block key={side} size={[(insideWidth - .008) / 2, .374, .018]}
        position={[side * (insideWidth + .008) / 4, .317, -.22]}
        color={WOOD_COLOR} texture={verticalWood} radius={.002} roughness={.55} />)}
      <Block size={[insideWidth, .012, .016]} position={[0, .51, -.2]} color={WHISKY_CABINET.frame} radius={.001} roughness={.7} />
    </group>
    {shelfTops.map(top => <group key={top} name={`whisky-cabinet-shelf-top-${top}`}>
      <Block size={[insideWidth, CABINET.shelf, CABINET.innerDepth]} position={[0, top - CABINET.shelf / 2, 0]}
        color={WOOD_COLOR} texture={wood} radius={.0018} roughness={.51} />
      {SIDES.flatMap(side => [-.15, .15].map(z => <Rod key={`${side}-${z}`}
        from={[side * insideWidth / 2, top - .021, z]} to={[side * (insideWidth / 2 - .016), top - .021, z]}
        radius={.0045} color={WHISKY_CABINET.frame} metalness={.7} />))}
    </group>)}
  </group>;
}

function CabinetStrips({ power }: { readonly power: number }) {
  return <group name="cabinet-concealed-2700k-vertical-lightstrips">
    {SIDES.map(side => <group key={side} position={[side * (WHISKY_CABINET.width / 2 - .031), 1.31, -.174]}>
      <Block size={[.007, 1.48, .023]} position={[side * .0035, 0, 0]}
        color={WHISKY_CABINET.frame} radius={.001} roughness={.6} metalness={.6} />
      <mesh name="recessed opal strip diffuser" rotation={[0, -side * Math.PI / 2, 0]}>
        <planeGeometry args={[.011, 1.45]} />
        <meshStandardMaterial color={LIGHTING.reflector} emissive={LIGHTING.warm} emissiveIntensity={power * 1.7} roughness={.68} />
      </mesh>
      <rectAreaLight name={`${side < 0 ? 'left' : 'right'} warm cabinet strip`}
        position={[-side * .001, 0, 0]} rotation={[0, side * Math.PI / 2, 0]}
        width={.011} height={1.45} intensity={power * 12} color={LIGHTING.warm} />
    </group>)}
  </group>;
}
