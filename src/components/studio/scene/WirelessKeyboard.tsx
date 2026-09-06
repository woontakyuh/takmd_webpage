import { useEffect, useMemo } from 'react';
import { CanvasTexture, SRGBColorSpace } from 'three';
import { Block } from './Primitives';
import type { Point } from './config';
import { PALETTE } from './config';

type Key = { readonly label: string; readonly units: number; readonly accent: boolean };
type KeyRow = { readonly z: number; readonly keys: readonly Key[] };

const PITCH = 0.0205;
const KEY_GAP = 0.0026;
const KEY_ROWS: readonly KeyRow[] = [
  { z: -0.056, keys: [key('esc', 1, true), ...['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'].map(label => key(label)), key('del'), key('home')] },
  { z: -0.030, keys: [...keys('`1234567890-='), key('delete', 2), key('pgup')] },
  { z: -0.0095, keys: [key('tab', 1.5), ...keys('qwertyuiop[]'), key('\\', 1.5), key('pgdn')] },
  { z: 0.011, keys: [key('caps', 1.75), ...keys('asdfghjkl;\''), key('return', 2.25, true), key('end')] },
  { z: 0.0315, keys: [key('shift', 2.25), ...keys('zxcvbnm,./'), key('shift', 1.75), key('↑', 1, true), key('fn')] },
  { z: 0.052, keys: [key('ctrl', 1.25), key('opt', 1.25), key('cmd', 1.25), key('space', 6.25, true), key('cmd'), key('opt'), key('fn'), key('←', 1, true), key('↓', 1, true), key('→', 1, true)] },
];

type WirelessKeyboardProps = {
  readonly position: Point;
};

export function WirelessKeyboard({ position }: WirelessKeyboardProps) {
  const legends = useKeyboardLegends();
  return (
    <group position={[...position]} rotation={[0, -0.055, 0]}>
      {[-0.14, 0.14].flatMap(x => [-0.048, 0.048].map(z => <Block key={`${x}-${z}`}
        size={[0.026, z < 0 ? 0.008 : 0.003, 0.012]} position={[x, z < 0 ? 0.004 : 0.0015, z]}
        color={PALETTE.rubber} radius={0.0013} roughness={0.9} />))}
      <group position={[0, 0.017, 0]} rotation={[0.055, 0, 0]}>
        <Block size={[0.353, 0.025, 0.153]} color={PALETTE.graphite}
          radius={0.006} roughness={0.38} metalness={0.35} />
        <Block size={[0.347, 0.003, 0.147]} position={[0, 0.0108, 0]} color={PALETTE.aluminiumEdge}
          radius={0.0014} roughness={0.36} metalness={0.65} />
        <Block size={[0.338, 0.003, 0.138]} position={[0, 0.0125, 0]} color={PALETTE.rubber}
          radius={0.0014} roughness={0.83} />
        <mesh position={[0.154, 0.022, -0.055]} castShadow>
          <cylinderGeometry args={[0.007, 0.007, 0.016, 28]} />
          <meshStandardMaterial color={PALETTE.aluminium} roughness={0.32} metalness={0.65} />
        </mesh>
        {KEY_ROWS.flatMap(row => layoutRow(row).map(({ key: currentKey, x, width }) => <group key={`${row.z}-${x}`} position={[x, 0, row.z]}>
          <Block size={[width, 0.012, row.z === -0.056 ? 0.014 : 0.0179]} position={[0, 0.021, 0]}
            color={currentKey.accent ? PALETTE.tealLight : PALETTE.stone} radius={0.0022} roughness={0.63} />
          <Block size={[width - 0.002, 0.004, row.z === -0.056 ? 0.012 : 0.0159]} position={[0, 0.0268, 0]}
            color={currentKey.accent ? PALETTE.keySage : PALETTE.keyIvory} radius={0.0018} roughness={0.48} />
        </group>))}
        <mesh position={[0, 0.02895, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.34, 0.14]} />
          <meshStandardMaterial map={legends} transparent alphaTest={0.08} depthWrite={false} roughness={0.7} />
        </mesh>
        <Block size={[0.016, 0.004, 0.001]} position={[0.133, -0.003, -0.077]} color={PALETTE.rubber} radius={0.0004} />
        <Block size={[0.006, 0.002, 0.0015]} position={[0.135, -0.003, -0.0777]} color={PALETTE.aluminium} radius={0.0004} metalness={0.6} />
      </group>
    </group>
  );
}

function key(label: string, units = 1, accent = false): Key {
  return { label, units, accent };
}

function keys(labels: string): readonly Key[] {
  return [...labels].map(label => key(label));
}

function layoutRow(row: KeyRow): readonly { readonly key: Key; readonly x: number; readonly width: number }[] {
  let cursor = -0.164;
  return row.keys.map((currentKey) => {
    const pitch = currentKey.units * PITCH;
    const x = cursor + pitch / 2;
    cursor += pitch;
    return { key: currentKey, x, width: pitch - KEY_GAP };
  });
}

function useKeyboardLegends() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = PALETTE.ink;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      KEY_ROWS.forEach((row) => layoutRow(row).forEach(({ key: currentKey, x }) => {
        const canvasX = (x / 0.34 + 0.5) * canvas.width;
        const canvasY = (0.5 + row.z / 0.14) * canvas.height;
        context.font = `${currentKey.label.length > 1 ? 18 : 29}px Arial`;
        if (currentKey.label !== 'space') context.fillText(currentKey.label.toUpperCase(), canvasX, canvasY);
      }));
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}
