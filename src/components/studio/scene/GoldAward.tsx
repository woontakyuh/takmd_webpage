import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, LatheGeometry, Path, Quaternion, RepeatWrapping, Shape, ShapeGeometry, SRGBColorSpace, Vector2, Vector3 } from 'three';
import type { Texture } from 'three';
import { GOLD_AWARD, PALETTE } from './config';
import type { Point } from './config';
import { Block, Rod } from './Primitives';
import { AWARD_INSET_NAME, useAwardInteraction } from './useAwardInteraction';
import { GoldAwardGlow } from './GoldAwardGlow';

const AWARD = {
  width: 0.21, height: 0.297, depth: 0.015, lean: -0.23,
} as const;
const ARTWORK = { width: 0.2, height: 0.3 } as const;
const FACE_SCALE = [AWARD.width / ARTWORK.width, AWARD.height / ARTWORK.height, 1] as const;

type GoldAwardProps = {
  readonly channelUrl: string;
  readonly focused: boolean;
  readonly reducedMotion: boolean;
  readonly onSelect: () => void;
  readonly position?: Point;
  readonly rotation?: number;
};

function insetPath() {
  const path = new Path();
  path.moveTo(-0.034, 0.107);
  path.bezierCurveTo(-0.043, 0.103, -0.044, 0.097, -0.044, 0.077);
  path.bezierCurveTo(-0.044, 0.048, -0.043, 0.043, -0.032, 0.042);
  path.bezierCurveTo(-0.01, 0.04, 0.022, 0.04, 0.033, 0.043);
  path.bezierCurveTo(0.042, 0.046, 0.042, 0.052, 0.042, 0.078);
  path.bezierCurveTo(0.042, 0.102, 0.04, 0.106, 0.031, 0.108);
  path.bezierCurveTo(0.01, 0.112, -0.019, 0.112, -0.034, 0.107);
  return path;
}

function roundedOutline(halfWidth: number, halfHeight: number) {
  const face = new Shape(), radius = 0.0005;
  face.moveTo(-halfWidth + radius, -halfHeight);
  face.lineTo(halfWidth - radius, -halfHeight);
  face.absarc(halfWidth - radius, -halfHeight + radius, radius, -Math.PI / 2, 0, false);
  face.lineTo(halfWidth, halfHeight - radius);
  face.absarc(halfWidth - radius, halfHeight - radius, radius, 0, Math.PI / 2, false);
  face.lineTo(-halfWidth + radius, halfHeight);
  face.absarc(-halfWidth + radius, halfHeight - radius, radius, Math.PI / 2, Math.PI, false);
  face.lineTo(-halfWidth, -halfHeight + radius);
  face.absarc(-halfWidth + radius, -halfHeight + radius, radius, Math.PI, Math.PI * 1.5, false);
  face.closePath();
  return face;
}

function awardGeometry() {
  const face = roundedOutline(0.0994, 0.1494);
  face.holes.push(insetPath());
  const body = new ExtrudeGeometry(face, {
    depth: AWARD.depth - 0.0012, bevelEnabled: true, bevelThickness: 0.0006,
    bevelSize: 0.0006, bevelSegments: 2, steps: 1, curveSegments: 18,
  });
  body.translate(0, 0, -AWARD.depth / 2 + 0.0006);
  const well = new ShapeGeometry(new Shape(insetPath().getPoints(24)));
  const badgeShape = new Shape();
  badgeShape.moveTo(-0.0185, 0.0221);
  badgeShape.lineTo(-0.0185, -0.0219);
  badgeShape.lineTo(0.0178, 0.0005);
  badgeShape.closePath();
  const badge = new ExtrudeGeometry(badgeShape, {
    depth: 0.0012, bevelEnabled: true, bevelThickness: 0.0003,
    bevelSize: 0.0003, bevelSegments: 2, steps: 1,
  });
  return { body, well, badge };
}

export function GoldAward({ channelUrl, focused, reducedMotion, onSelect, position = [0, 0, 0], rotation = 0 }: GoldAwardProps) {
  const { material, handlers, insetHovered } = useAwardInteraction({ channelUrl, focused, reducedMotion, onSelect });
  const [inkSource, logoSource, grainSource] = useTexture([
    '/models/gold-award/face-ink.webp', '/models/gold-award/triangle-logo.webp', '/models/gold-award/satin-grain.webp',
  ]);
  const textures = useMemo(() => {
    const ink = inkSource.clone(), logo = logoSource.clone(), grain = grainSource.clone();
    for (const texture of [ink, logo]) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
    grain.wrapS = grain.wrapT = RepeatWrapping;
    grain.repeat.set(12, 12);
    grain.anisotropy = 8;
    grain.needsUpdate = true;
    return { ink, logo, grain };
  }, [inkSource, logoSource, grainSource]);
  const { grain } = textures;
  const geometry = useMemo(awardGeometry, []);
  const originY = useMemo(() => {
    const vertices = geometry.body.getAttribute('position');
    let lowest = Infinity;
    for (let index = 0; index < vertices.count; index++) {
      const y = vertices.getY(index) * FACE_SCALE[1] * Math.cos(AWARD.lean)
        - vertices.getZ(index) * Math.sin(AWARD.lean);
      lowest = Math.min(lowest, y);
    }
    return -lowest;
  }, [geometry]);
  useEffect(() => () => { Object.values(textures).forEach(texture => texture.dispose()); }, [textures]);
  useEffect(() => () => { Object.values(geometry).forEach((part) => part.dispose()); }, [geometry]);

  return <group name="KOSESS Best Shorts Award" position={[...position]} rotation={[0, rotation, 0]} {...handlers}>
    <group position={[0, originY, 0]} rotation={[AWARD.lean, 0, 0]}>
      <group scale={[...FACE_SCALE]}>
        <mesh name="Gold award satin body" geometry={geometry.body} castShadow receiveShadow>
          <meshStandardMaterial attach="material-0" color={GOLD_AWARD.satin} metalness={0.42} roughness={0.64} envMapIntensity={1.1}
            bumpMap={grain} bumpScale={0.00022} customProgramCacheKey={() => 'gold-award-satin-grain-v1'}
            onBeforeCompile={shader => {
              shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `
                #include <color_fragment>
                float awardGrain = texture2D(bumpMap, vBumpMapUv).r;
                float awardGrainMean = texture2D(bumpMap, vBumpMapUv, 4.0).r;
                diffuseColor.rgb *= 1.0 + (awardGrain - awardGrainMean) * 0.6;
              `);
            }} />
          <meshStandardMaterial attach="material-1" color={GOLD_AWARD.edge} metalness={0.58} roughness={0.32} />
        </mesh>
        <mesh name={AWARD_INSET_NAME} geometry={geometry.well} position={[0, 0, 0.003]} receiveShadow>
          <meshPhysicalMaterial ref={material} color={GOLD_AWARD.mirror} metalness={0.7} roughness={0.22} envMapIntensity={1.7}
            emissive={GOLD_AWARD.mirror} emissiveIntensity={0}
            clearcoat={0.5} clearcoatRoughness={0.12} />
        </mesh>
        <mesh name={AWARD_INSET_NAME} geometry={geometry.badge} position={[-0.00065, 0.07565, 0.0034]} castShadow receiveShadow>
          <meshStandardMaterial color={GOLD_AWARD.satin} metalness={0.76} roughness={0.43} />
        </mesh>
        <PhotoDecal texture={textures.logo} position={[-0.00065, 0.07565, 0.005]}
          size={[296 / 1536 * ARTWORK.width, 356 / 2304 * ARTWORK.height]} />
        <PhotoDecal texture={textures.ink} position={[0, 0, 0.00765]} size={[ARTWORK.width, ARTWORK.height]} ink />
        <GoldAwardGlow hovered={insetHovered} reducedMotion={reducedMotion} />
        <BackPlate grain={grain} />
      </group>
    </group>
    <FlutedSupport originY={originY} />
  </group>;
}

function PhotoDecal({ texture, position, size, ink = false }: {
  readonly texture: Texture; readonly position: Point; readonly size: readonly [number, number]; readonly ink?: boolean;
}) {
  return <mesh position={[...position]} raycast={() => {}}>
    <planeGeometry args={[...size]} />
    <meshStandardMaterial map={texture} transparent depthWrite={false} alphaTest={0.02}
      color={ink ? PALETTE.ink : PALETTE.white} metalness={ink ? 0 : 0.12}
      roughness={ink ? 1 : 0.7} envMapIntensity={ink ? 0 : 1} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

function BackPlate({ grain }: { readonly grain: Texture }) {
  const geometry = useMemo(() => {
    const shape = roundedOutline(0.0988, 0.1488);
    const hole = new Path();
    hole.absellipse(0, 0.114, 0.0021, 0.0026, 0, Math.PI * 2, true, 0);
    shape.holes.push(hole);
    return new ShapeGeometry(shape);
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <>
    <mesh geometry={geometry} rotation={[0, Math.PI, 0]} position={[0, 0, -0.0076]}>
      <meshPhysicalMaterial color={GOLD_AWARD.back} metalness={0.48} roughness={0.38}
        bumpMap={grain} bumpScale={0.000015} clearcoat={0.25} />
    </mesh>
    <Block size={[0.0014, 0.0045, 0.0001]} position={[0, 0.118, -0.0078]}
      color={PALETTE.rubber} radius={0.0004} roughness={0.85} />
    <mesh position={[0, 0.114, -0.0079]} rotation={[0, Math.PI, 0]}>
      <circleGeometry args={[0.0021, 20]} />
      <meshStandardMaterial color={PALETTE.rubber} roughness={0.9} />
    </mesh>
  </>;
}

function FlutedSupport({ originY }: { readonly originY: number }) {
  const support = useMemo(() => {
    const start = new Vector3(0, -0.113 * FACE_SCALE[1], -AWARD.depth / 2 + 0.001)
      .applyAxisAngle(new Vector3(1, 0, 0), AWARD.lean);
    start.y += originY;
    const end = new Vector3(0, 0.0035, -0.077);
    const radius = 0.0035;
    const createShaft = () => {
      const direction = end.clone().sub(start), halfLength = direction.length() / 2;
      const profile = [[0, -halfLength], [radius - 0.0005, -halfLength],
        [radius, -halfLength + 0.0005], [radius, halfLength - 0.001],
        [radius - 0.00008, halfLength - 0.00062], [radius - 0.00028, halfLength - 0.00025],
        [radius - 0.00065, halfLength], [0, halfLength]];
      const geometry = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 192);
      const positions = geometry.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index), z = positions.getZ(index), radial = Math.hypot(x, z);
        if (radial === 0) continue;
        const tipFade = Math.min(1, (halfLength - positions.getY(index)) / 0.0007);
        const groove = Math.max(0, Math.cos(Math.atan2(z, x) * 32)) ** 10 * 0.00016 * tipFade;
        positions.setXYZ(index, x * (1 - groove / radial), positions.getY(index), z * (1 - groove / radial));
      }
      geometry.computeVertexNormals();
      return { geometry, position: start.clone().add(end).multiplyScalar(0.5),
        quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) };
    };
    let shaft = createShaft();
    const vertex = new Vector3();
    for (let step = 0; step < 4; step++) {
      const positions = shaft.geometry.getAttribute('position');
      let lowest = Infinity;
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index).applyQuaternion(shaft.quaternion).add(shaft.position);
        lowest = Math.min(lowest, vertex.y);
      }
      end.y -= lowest;
      shaft.geometry.dispose();
      shaft = createShaft();
    }
    const collarCenter = start.clone().lerp(end, 0.34), axis = end.clone().sub(start).normalize();
    return { ...shaft, collarFrom: collarCenter.clone().addScaledVector(axis, -0.0009).toArray(),
      collarTo: collarCenter.clone().addScaledVector(axis, 0.0009).toArray() };
  }, [originY]);
  useEffect(() => () => support.geometry.dispose(), [support]);
  return <><mesh name="Gold award grooved silver rear support" geometry={support.geometry}
    position={support.position} quaternion={support.quaternion} castShadow receiveShadow>
    <meshPhysicalMaterial color={PALETTE.aluminiumEdge} metalness={0.72} roughness={0.3}
      anisotropy={0.65} anisotropyRotation={Math.PI / 2} envMapIntensity={1.5} />
  </mesh>
    <Rod from={support.collarFrom} to={support.collarTo} radius={0.00415}
      color={PALETTE.graphite} metalness={0.25} />
  </>;
}
