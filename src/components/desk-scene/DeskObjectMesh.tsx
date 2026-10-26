import { animated, useSpring } from '@react-spring/three';
import { Select } from '@react-three/postprocessing';
import { FittedGlb } from './FittedGlb';
import { Primitive } from './Primitive';
import type { DeskObject } from './types';

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
            <FittedGlb url={object.glb} fit={object.glbFit ?? 0.3} fallback={fallback} />
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
