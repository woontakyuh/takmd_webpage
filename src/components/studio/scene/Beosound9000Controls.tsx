import { Html } from '@react-three/drei';
import { useEffect, useState } from 'react';
import type { Dispatch } from 'react';
import type { BeosoundAction } from './Beosound9000State';
import { BEOSOUND_PANEL_KEYS, panelKeyPosition, panelKeyHitArea } from './BeosoundPanel';
import { useCabinetAction } from './WhiskyCabinetDoor';
import './beosound-9000.css';
import { usePhone } from './Device';

type PanelKey = typeof BEOSOUND_PANEL_KEYS[number];
function NativeKey({ item, disabled, focused, onActivate }: {
  readonly item: PanelKey; readonly disabled: boolean; readonly focused: boolean; readonly onActivate: () => void;
}) {
  const { hovered, handlers } = useCabinetAction({ disabled, onActivate });
  const phone = usePhone();
  const touch = panelKeyHitArea(item);
  return <group {...handlers}>
    {phone && <mesh name={`Beosound touch ${item.name}`} position={touch.position}>
      <planeGeometry args={touch.size} />
      <meshBasicMaterial transparent opacity={0} colorWrite={false} depthWrite={false} />
    </mesh>}
    <mesh name={`Beosound native ${item.name}`} position={panelKeyPosition(item.x, item.y)}>
    <planeGeometry args={[.039, .035]} />
    <meshBasicMaterial color="#c7cec5" transparent opacity={hovered || focused ? .12 : 0} depthWrite={false} toneMapped={false} />
  </mesh></group>;
}

export function Beosound9000Controls({ active, disabled, dispatch, onApproach, onClose }: {
  readonly active: boolean; readonly disabled: boolean; readonly dispatch: Dispatch<BeosoundAction>;
  readonly onApproach: () => void; readonly onClose: () => void;
}) {
  const [focused, setFocused] = useState<string | null>(null);
  const activate = (item: PanelKey) => { if (active) dispatch(item.action); else onApproach(); };
  useEffect(() => {
    if (!active) return;
    const close = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || document.querySelector('dialog:modal')) return;
      event.preventDefault(); onClose();
    };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [active, onClose]);
  return <>
    {BEOSOUND_PANEL_KEYS.map(item => <NativeKey key={item.name} item={item} disabled={disabled}
      focused={focused === item.name} onActivate={() => activate(item)} />)}
    {active && <Html position={[.4, .301, .085]} center zIndexRange={[43, 39]}>
      <button className="beosound-close" type="button" aria-label="Return from Beosound 9000"
        onPointerDown={event => event.stopPropagation()} onPointerUp={event => event.stopPropagation()}
        onClick={event => { event.stopPropagation(); onClose(); }}>×</button>
      <div className="beosound-accessibility" role="group" aria-label="Beosound physical buttons">
        {BEOSOUND_PANEL_KEYS.map(item => <button key={item.name} type="button" disabled={disabled}
          onFocus={() => setFocused(item.name)} onBlur={() => setFocused(null)}
          onClick={event => { event.stopPropagation(); activate(item); }}>{item.name}</button>)}
      </div>
    </Html>}
  </>;
}
