import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { ShaderMaterial } from 'three';
import { AdditiveBlending } from 'three';

const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const fragmentShader = `
  uniform float strength;
  uniform float phase;
  uniform float moving;
  varying vec2 vUv;
  void main() {
    vec2 p = (vUv - 0.5) * vec2(0.122, 0.107);
    vec2 q = abs(p) - vec2(0.043, 0.035) + 0.012;
    float edge = length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - 0.012;
    float halo = exp(-max(edge, 0.0) * 240.0) * smoothstep(-0.002, 0.002, edge);
    float sweep = p.x + p.y * 0.45 - (phase * 0.19 - 0.095);
    float gleam = exp(-pow(sweep / 0.008, 2.0)) * (1.0 - smoothstep(-0.001, 0.001, edge));
    float alpha = strength * (halo * 0.32 + gleam * moving * 0.48);
    gl_FragColor = vec4(vec3(1.0, 0.64, 0.17), alpha);
  }
`;

export function GoldAwardGlow({ hovered, reducedMotion }: {
  readonly hovered: boolean; readonly reducedMotion: boolean;
}) {
  const material = useRef<ShaderMaterial>(null);
  const uniforms = useMemo(() => ({ strength: { value: 0 }, phase: { value: 0 }, moving: { value: 1 } }), []);
  useFrame((_, delta) => {
    if (!material.current) return;
    const active = material.current.uniforms;
    active.strength.value = hovered ? 1 : 0;
    active.moving.value = reducedMotion ? 0 : 1;
    active.phase.value = hovered && !reducedMotion ? (active.phase.value + delta / 1.8) % 1 : 0;
  });
  return <mesh name="Gold award hover glow" visible={hovered} position={[-0.001, 0.076, 0.008]} raycast={() => {}}>
    <planeGeometry args={[0.122, 0.107]} />
    <shaderMaterial ref={material} uniforms={uniforms} vertexShader={vertexShader} fragmentShader={fragmentShader}
      transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
  </mesh>;
}
