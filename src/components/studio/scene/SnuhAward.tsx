import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { DoubleSide, ExtrudeGeometry, Shape, SRGBColorSpace } from 'three';

const SNUH = {
  black: '#11150f', glass: '#f5fff8', gold: '#d8b446',
  faceWidth: 0.108, faceHeight: 0.234, faceCenterY: 0.153, faceZ: 0.01405,
} as const;

function plaqueGeometry() {
  const shape = new Shape();
  shape.moveTo(-0.031, 0.036);
  shape.lineTo(0.031, 0.036);
  shape.lineTo(0.0535, 0.059);
  shape.lineTo(0.0535, 0.278);
  shape.bezierCurveTo(0.007, 0.265, -0.023, 0.31, -0.0535, 0.29);
  shape.lineTo(-0.0535, 0.059);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.008, bevelEnabled: true, bevelSize: 0.003, bevelThickness: 0.003,
    bevelSegments: 1, curveSegments: 32, steps: 1,
  });
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (bounds) {
    const bottom = bounds.min.y;
    const height = bounds.max.y - bottom;
    geometry.translate(0, -bottom, 0);
    geometry.scale(1, 0.267 / height, 1);
    geometry.translate(0, 0.033, 0.003);
  }
  return geometry;
}

function clearSlabGeometry() {
  const shape = new Shape();
  shape.moveTo(-0.043, 0.0275);
  shape.lineTo(0.043, 0.0275);
  shape.lineTo(0.066, 0.051);
  shape.lineTo(0.066, 0.247);
  shape.quadraticCurveTo(0.003, 0.236, -0.066, 0.277);
  shape.lineTo(-0.066, 0.051);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.008, bevelEnabled: true, bevelSize: 0.0015, bevelThickness: 0.0015,
    bevelSegments: 1, curveSegments: 32, steps: 1,
  });
  geometry.translate(0, 0, -0.0105);
  return geometry;
}

function pedestalGeometry(width: number, depth: number, height: number) {
  const halfWidth = width / 2 - 0.001, halfDepth = depth / 2 - 0.001;
  const radius = 0.004, shape = new Shape();
  shape.moveTo(-halfWidth + radius, -halfDepth);
  shape.lineTo(halfWidth - radius, -halfDepth);
  shape.quadraticCurveTo(halfWidth, -halfDepth, halfWidth, -halfDepth + radius);
  shape.lineTo(halfWidth, halfDepth - radius);
  shape.quadraticCurveTo(halfWidth, halfDepth, halfWidth - radius, halfDepth);
  shape.bezierCurveTo(0.018, halfDepth - 0.003, -0.018, halfDepth - 0.003, -halfWidth + radius, halfDepth);
  shape.quadraticCurveTo(-halfWidth, halfDepth, -halfWidth, halfDepth - radius);
  shape.lineTo(-halfWidth, -halfDepth + radius);
  shape.quadraticCurveTo(-halfWidth, -halfDepth, -halfWidth + radius, -halfDepth);
  const geometry = new ExtrudeGeometry(shape, {
    depth: height - 0.002, bevelEnabled: true, bevelSize: 0.001, bevelThickness: 0.001,
    bevelSegments: 2, curveSegments: 12, steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, height - 0.001, 0);
  return geometry;
}

function goldStepGeometry() {
  const shape = new Shape();
  shape.moveTo(-0.048, -0.018);
  shape.lineTo(0.048, -0.018);
  shape.lineTo(0.048, 0.018);
  shape.lineTo(-0.048, 0.018);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 0.004, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006,
    bevelSegments: 1, steps: 1,
  });
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, 0.026, 0);
  return geometry;
}

export function SnuhAward() {
  const [whiteSource, goldSource] = useTexture([
    '/models/personal-awards/snuh/white-ink.webp', '/models/personal-awards/snuh/gold-ink.webp',
  ]);
  const textures = useMemo(() => [whiteSource, goldSource].map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [whiteSource, goldSource]);
  const geometry = useMemo(() => ({
    plaque: plaqueGeometry(), clearSlab: clearSlabGeometry(),
    base: pedestalGeometry(0.128, 0.068, 0.018), goldStep: goldStepGeometry(),
  }), []);
  useEffect(() => () => { textures.forEach(texture => texture.dispose()); }, [textures]);
  useEffect(() => () => { Object.values(geometry).forEach(item => item.dispose()); }, [geometry]);

  return (
    <group name="snuh-neurosurgery-merit-award">
      <mesh geometry={geometry.base} castShadow receiveShadow>
        <meshPhysicalMaterial color="#080a08" roughness={0.13} metalness={0.08} clearcoat={1} clearcoatRoughness={0.12} />
      </mesh>
      <mesh geometry={geometry.goldStep} castShadow receiveShadow>
        <meshPhysicalMaterial color={SNUH.gold} metalness={0.84} roughness={0.16} clearcoat={1} />
      </mesh>
      <mesh position={[0, 0.0305, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.09, 0.005, 0.031]} />
        <meshPhysicalMaterial color="#f4dda1" metalness={0.45} roughness={0.08} transmission={0.25} thickness={0.005} ior={1.5} />
      </mesh>
      <mesh geometry={geometry.clearSlab} receiveShadow>
        <meshPhysicalMaterial color={SNUH.glass} metalness={0} roughness={0.065} transmission={0.95}
          thickness={0.011} ior={1.52} attenuationColor="#b8d1b3" attenuationDistance={0.45} envMapIntensity={1.05} />
      </mesh>
      <mesh geometry={geometry.plaque} castShadow receiveShadow>
        <meshPhysicalMaterial color={SNUH.black} roughness={0.13} metalness={0.12} clearcoat={1}
          clearcoatRoughness={0.06} ior={1.52} />
      </mesh>
      <mesh position={[0, 0.157, -0.0121]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.028, 0.028, 0.0006, 48]} />
        <meshStandardMaterial color="#14150d" metalness={0.2} roughness={0.32} />
      </mesh>
      <mesh position={[0, SNUH.faceCenterY, SNUH.faceZ]}>
        <planeGeometry args={[SNUH.faceWidth, SNUH.faceHeight]} />
        <meshStandardMaterial map={textures[0]} transparent alphaTest={0.04} depthWrite={false}
          roughness={0.48} metalness={0.05} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      <mesh position={[0, SNUH.faceCenterY, SNUH.faceZ + 0.00001]}>
        <planeGeometry args={[SNUH.faceWidth, SNUH.faceHeight]} />
        <meshStandardMaterial map={textures[1]} transparent alphaTest={0.04} depthWrite={false}
          roughness={0.29} metalness={0.48} polygonOffset polygonOffsetFactor={-1} />
      </mesh>
      {textures.map((texture, index) => (
        <mesh key={texture.uuid} position={[0, SNUH.faceCenterY, -0.00005 - index * 0.00001]}>
          <planeGeometry args={[SNUH.faceWidth, SNUH.faceHeight]} />
          <meshStandardMaterial map={texture} color="#10120b" side={DoubleSide}
            alphaTest={0.08} roughness={0.45} />
        </mesh>
      ))}
    </group>
  );
}
