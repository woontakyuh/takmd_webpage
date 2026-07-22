import { animated, useSpring } from '@react-spring/three';
import { Select } from '@react-three/postprocessing';
import { useGLTF } from '@react-three/drei';
import { Component, Suspense, type ReactNode } from 'react';
import { Primitive } from './Primitive';
import type { DeskObject } from './types';

class GlbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

function Glb({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

type Props = {
  object: DeskObject;
  hovered: boolean;
  reducedMotion: boolean;
  onHover: (id: string | null) => void;
  onActivate: (id: string) => void;
};

export function DeskObjectMesh({ object, hovered, reducedMotion, onHover, onActivate }: Props) {
  const { lift, spin } = useSpring({
    lift: hovered && !reducedMotion ? 0.004 : 0,
    spin: hovered && !reducedMotion ? 0.07 : 0, // ~4°
    config: { mass: 1, tension: 220, friction: 18 },
  });

  const fallback = <Primitive spec={object.fallback} />;

  return (
    <group position={object.position} rotation={object.rotation} scale={object.scale ?? 1}>
      <Select enabled={hovered}>
        <animated.group position-y={lift} rotation-y={spin}>
          {object.glb ? (
            <GlbBoundary fallback={fallback}>
              <Suspense fallback={fallback}>
                <Glb url={object.glb} />
              </Suspense>
            </GlbBoundary>
          ) : (
            fallback
          )}
        </animated.group>
      </Select>
      {/* invisible collider, slightly larger than the mesh, for stable hover */}
      <mesh
        position={object.hitOffset}
        visible={false}
        onPointerOver={(e) => {
          e.stopPropagation();
          onHover(object.id);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          onHover(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onActivate(object.id);
        }}
      >
        <boxGeometry args={object.hitSize} />
      </mesh>
    </group>
  );
}
