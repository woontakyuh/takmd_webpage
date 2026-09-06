import { useFrame } from '@react-three/fiber';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { CanvasTexture, PlaneGeometry, SRGBColorSpace, type Group } from 'three';
import { Block } from './Primitives';
import { PALETTE, type Point } from './config';

const FLIP_SECONDS = 0.48;
type Props = {
  readonly value: string;
  readonly size: readonly [number, number];
  readonly position: Point;
  readonly reducedMotion: boolean;
};

function useCardTexture(value: string) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = PALETTE.ink; ctx.fillRect(0, 0, 512, 400);
      ctx.fillStyle = PALETTE.paperLight;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.font = '600 310px Arial, sans-serif'; ctx.fillText(value, 256, 221, 465);
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace; result.anisotropy = 4;
    return result;
  }, [value]);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

export function FlipCard({ value, size, position, reducedMotion }: Props) {
  const [face, setFace] = useState({ value, previous: value, flipping: false });
  const leaf = useRef<Group>(null);
  const elapsed = useRef(0);
  const [width, height] = size;
  const current = useCardTexture(face.value);
  const previous = useCardTexture(face.previous);
  const halves = useMemo(() => [0.5, 0].map(offset => {
    const geometry = new PlaneGeometry(width, height / 2);
    const uv = geometry.getAttribute('uv');
    for (let i = 0; i < uv.count; i += 1) uv.setY(i, uv.getY(i) * 0.5 + offset);
    return geometry;
  }), [width, height]);
  useEffect(() => () => halves.forEach(geometry => geometry.dispose()), [halves]);

  useLayoutEffect(() => {
    setFace(state => {
      if (state.value === value && (!reducedMotion || !state.flipping)) return state;
      return { value, previous: state.value, flipping: !reducedMotion && value !== state.value && !state.flipping };
    });
  }, [value, reducedMotion]);
  useLayoutEffect(() => { elapsed.current = 0; if (leaf.current) leaf.current.rotation.x = 0; }, [face.value]);
  useFrame((_, delta) => {
    if (!face.flipping || !leaf.current) return;
    elapsed.current += delta;
    const t = Math.min(elapsed.current / FLIP_SECONDS, 1);
    leaf.current.rotation.x = Math.PI * t * t * (3 - 2 * t);
    if (t === 1) setFace(state => ({ ...state, flipping: false }));
  });

  return <group position={[...position]}>
    <Block size={[width + 0.008, height + 0.008, 0.008]} position={[0, 0, -0.006]}
      color={PALETTE.walnutDark} radius={0.006} roughness={0.9} />
    <mesh geometry={halves[0]} position={[0, height / 4, 0]}>
      <meshStandardMaterial map={current} roughness={0.9} />
    </mesh>
    <mesh geometry={halves[1]} position={[0, -height / 4, 0]}>
      <meshStandardMaterial map={face.flipping ? previous : current} roughness={0.9} />
    </mesh>
    {face.flipping && <group ref={leaf} position={[0, 0, 0.002]}>
      <mesh geometry={halves[0]} position={[0, height / 4, 0.0005]} castShadow>
        <meshStandardMaterial map={previous} roughness={0.9} />
      </mesh>
      <mesh geometry={halves[1]} position={[0, height / 4, -0.0005]} rotation={[Math.PI, 0, 0]} castShadow>
        <meshStandardMaterial map={current} roughness={0.9} />
      </mesh>
    </group>}
    <Block size={[width + 0.002, 0.0017, 0.003]} position={[0, 0, 0.003]}
      color={PALETTE.ink} radius={0.0004} roughness={0.8} />
    {[-1, 1].map(side => <mesh key={side} position={[side * width / 2, 0, 0.003]} rotation={[0, 0, Math.PI / 2]}>
      <cylinderGeometry args={[0.0023, 0.0023, 0.006, 10]} />
      <meshStandardMaterial color={PALETTE.steel} metalness={0.8} roughness={0.38} />
    </mesh>)}
  </group>;
}
