import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, Shape, SRGBColorSpace } from 'three';
import type { Texture } from 'three';

const KOMISS = {
  depth: 0.015, bevel: 0.0012,
  glass: '#111517', edge: '#20282b', gold: '#b99852', cutGlass: '#e1edea',
} as const;

type Outline = readonly (readonly [number, number])[];

function glassPart(outline: Outline) {
  const shape = new Shape();
  outline.forEach(([x, y], index) => index === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: KOMISS.depth - KOMISS.bevel * 2, bevelEnabled: true,
    bevelSize: KOMISS.bevel, bevelThickness: KOMISS.bevel, bevelSegments: 2, steps: 1,
  });
  geometry.translate(0, 0, -KOMISS.depth / 2 + KOMISS.bevel);
  return geometry;
}

function sculptedFoot() {
  const arch = new Shape();
  arch.moveTo(-0.0653, 0.0036);
  arch.bezierCurveTo(-0.050, 0.0086, -0.032, 0.0096, -0.016, 0.0103);
  arch.bezierCurveTo(-0.004, 0.016, 0.012, 0.023, 0.029, 0.0185);
  arch.bezierCurveTo(0.046, 0.015, 0.057, 0.0058, 0.0653, 0.0007);
  arch.lineTo(0.053, 0.0007);
  arch.bezierCurveTo(0.031, 0.0149, 0.012, 0.0176, -0.013, 0.006);
  arch.bezierCurveTo(-0.029, 0.0054, -0.046, 0.0041, -0.059, 0.0007);
  arch.lineTo(-0.0653, 0.0007);
  arch.closePath();
  const geometry = new ExtrudeGeometry(arch, {
    depth: 0.0196, bevelEnabled: true, bevelSize: 0.0007,
    bevelThickness: 0.0007, bevelSegments: 3, steps: 1, curveSegments: 20,
  });
  const positions = geometry.getAttribute('position');
  for (let index = 0; index < positions.count; index++) {
    const z = positions.getZ(index);
    const lift = Math.max(0, 1 - (z + 0.0007) / 0.021) * 0.003;
    positions.setY(index, positions.getY(index) + lift);
  }
  geometry.computeVertexNormals();
  geometry.translate(0, 0, 0.0087);
  return geometry;
}

function crossingRib() {
  const rib = new Shape();
  rib.moveTo(-0.027, 0.0005);
  rib.bezierCurveTo(-0.019, 0.0038, -0.012, 0.0071, -0.005, 0.008);
  rib.bezierCurveTo(0.007, 0.0058, 0.018, 0.0027, 0.029, 0.0005);
  rib.lineTo(0.021, 0.0005);
  rib.bezierCurveTo(0.010, 0.0035, -0.001, 0.0055, -0.007, 0.0055);
  rib.lineTo(-0.023, 0.0005);
  rib.closePath();
  const geometry = new ExtrudeGeometry(rib, {
    depth: 0.005, bevelEnabled: true, bevelSize: 0.0005,
    bevelThickness: 0.0005, bevelSegments: 2, curveSegments: 16,
  });
  geometry.translate(0, 0, 0.009);
  return geometry;
}

export function KomissAward() {
  const [inkSource, logoSource] = useTexture([
    '/models/personal-awards/komiss/membership-engraving.webp',
    '/models/personal-awards/komiss/komiss-logo.webp',
  ]);
  const textures = useMemo(() => [inkSource, logoSource].map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [inkSource, logoSource]);
  const geometry = useMemo(() => ({
    crown: glassPart([[-0.052, 0.2888], [0.0508, 0.2888], [0.0547, 0.188], [-0.0547, 0.2174]]),
    body: glassPart([[-0.0555, 0.1908], [0.0555, 0.1614], [0.0588, 0.043],
      [0.0475, 0.014], [-0.0475, 0.014], [-0.0588, 0.043]]),
    band: glassPart([[-0.0547, 0.215], [0.0547, 0.1856], [0.0555, 0.1638], [-0.0555, 0.1932]]),
    foot: sculptedFoot(), rib: crossingRib(),
  }), []);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);

  return <group name="KOMISS lifetime membership No. 180">
    {[geometry.crown, geometry.body].map((part, index) => <mesh key={index}
      name={index === 0 ? 'KOMISS polished glass crown' : 'KOMISS tapered black glass plaque'}
      geometry={part} castShadow receiveShadow>
      <meshPhysicalMaterial attach="material-0" color={KOMISS.glass} metalness={0.08} roughness={0.12}
        clearcoat={1} clearcoatRoughness={0.055} envMapIntensity={0.95} />
      <meshPhysicalMaterial attach="material-1" color={KOMISS.edge} metalness={0.12} roughness={0.075}
        clearcoat={1} clearcoatRoughness={0.04} envMapIntensity={1.1} />
    </mesh>)}
    <mesh name="KOMISS diagonal clear glass band" geometry={geometry.band} receiveShadow>
      <meshPhysicalMaterial color={KOMISS.cutGlass} metalness={0} roughness={0.065}
        transmission={0.94} thickness={KOMISS.depth} ior={1.5} attenuationColor="#dbe8e3"
        attenuationDistance={0.7} clearcoat={1} clearcoatRoughness={0.05} envMapIntensity={1.05} />
    </mesh>
    <Artwork texture={textures[0]} center={[0.00125, 0.0971]} size={[0.1005, 0.1278]} />
    <Artwork texture={textures[1]} center={[0.001, 0.2455]} size={[0.06, 0.061]} />
    {[0, Math.PI].map(rotation => <group key={rotation} rotation={[0, rotation, 0]}>
      <mesh name="KOMISS sculpted gold arch foot" geometry={geometry.foot} castShadow receiveShadow>
        <meshPhysicalMaterial color={KOMISS.gold} metalness={0.88} roughness={0.25}
          clearcoat={0.35} clearcoatRoughness={0.15} envMapIntensity={1.15} />
      </mesh>
      <mesh name="KOMISS gold crossing undercut" geometry={geometry.rib} castShadow receiveShadow>
        <meshStandardMaterial color={KOMISS.gold} metalness={0.85} roughness={0.3} envMapIntensity={1.05} />
      </mesh>
      {[-0.019, 0.022].map(x => <mesh key={x} name="KOMISS foot retaining pin" position={[x, 0.016, 0.0082]}>
        <sphereGeometry args={[0.00115, 8, 6]} />
        <meshStandardMaterial color="#d1c19b" metalness={0.85} roughness={0.23} />
      </mesh>)}
    </group>)}
  </group>;
}

function Artwork({ texture, center, size }: {
  readonly texture: Texture;
  readonly center: readonly [number, number];
  readonly size: readonly [number, number];
}) {
  return <mesh position={[...center, KOMISS.depth / 2 + 0.00006]} raycast={() => {}}>
    <planeGeometry args={[...size]} />
    <meshStandardMaterial map={texture} transparent alphaTest={0.04} depthWrite={false}
      roughness={0.64} metalness={0.04} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}
