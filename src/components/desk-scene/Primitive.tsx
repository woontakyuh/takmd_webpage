import type { JSX } from 'react';
import type { PrimitivePart, PrimitiveSpec } from './types';

function geometryFor(part: PrimitivePart): JSX.Element {
  const [a, b, c] = part.size;
  switch (part.kind) {
    case 'box':
      return <boxGeometry args={[a, b, c]} />;
    case 'cylinder':
      return <cylinderGeometry args={[a, b, c, 24]} />;
    case 'sphere':
      return <sphereGeometry args={[a, 24, 24]} />;
    case 'torus':
      return <torusGeometry args={[a, b, 16, 48]} />;
  }
}

export function Primitive({ spec }: { spec: PrimitiveSpec }) {
  return (
    <group>
      {spec.parts.map((part, i) => (
        <mesh key={i} position={part.position} rotation={part.rotation} castShadow receiveShadow>
          {geometryFor(part)}
          <meshStandardMaterial
            color={part.color}
            roughness={part.roughness ?? 0.9}
            metalness={part.metalness ?? 0}
          />
        </mesh>
      ))}
    </group>
  );
}
