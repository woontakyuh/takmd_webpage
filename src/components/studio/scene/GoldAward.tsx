import { useCursor, useTexture } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { CylinderGeometry, ExtrudeGeometry, Path, Quaternion, RepeatWrapping, Shape, ShapeGeometry, SRGBColorSpace, Vector3 } from 'three';
import type { Texture } from 'three';
import { GOLD_AWARD, PALETTE } from './config';
import type { Point } from './config';
import { Block, Rod } from './Primitives';

const AWARD = {
  width: 0.2, height: 0.3, depth: 0.015, lean: -0.23,
  clickThreshold: 5,
} as const;

type GoldAwardProps = {
  readonly channelUrl: string;
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

function awardGeometry() {
  const face = new Shape();
  face.moveTo(-0.0994, -0.1494);
  face.lineTo(0.0994, -0.1494);
  face.lineTo(0.0994, 0.1494);
  face.lineTo(-0.0994, 0.1494);
  face.closePath();
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

export function GoldAward({ channelUrl, position = [0, 0, 0], rotation = 0 }: GoldAwardProps) {
  const [hovered, setHovered] = useState(false);
  const pointerStart = useRef<{ readonly x: number; readonly y: number; readonly button: number } | null>(null);
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
    grain.repeat.set(64, 64);
    grain.needsUpdate = true;
    return { ink, logo, grain };
  }, [inkSource, logoSource, grainSource]);
  const { grain } = textures;
  const geometry = useMemo(awardGeometry, []);
  useCursor(hovered);
  useEffect(() => () => { Object.values(textures).forEach(texture => texture.dispose()); }, [textures]);
  useEffect(() => () => { Object.values(geometry).forEach((part) => part.dispose()); }, [geometry]);

  return <group name="KOSESS Best Shorts Award" position={[...position]} rotation={[0, rotation, 0]}
    onPointerOver={(event) => { event.stopPropagation(); setHovered(true); }}
    onPointerOut={() => setHovered(false)}
    onPointerDown={(event) => { pointerStart.current = { x: event.clientX, y: event.clientY, button: event.button }; }}
    onPointerCancel={() => { pointerStart.current = null; }}
    onClick={(event) => {
      event.stopPropagation();
      const start = pointerStart.current;
      pointerStart.current = null;
      if (!start || start.button !== 0 || event.delta >= AWARD.clickThreshold
        || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= AWARD.clickThreshold) return;
      window.open(channelUrl, '_blank', 'noopener,noreferrer');
    }}>
    <group position={[0, AWARD.height / 2 * Math.cos(AWARD.lean) + AWARD.depth / 2 * Math.abs(Math.sin(AWARD.lean)), 0]}
      rotation={[AWARD.lean, 0, 0]}>
      <mesh geometry={geometry.body} castShadow receiveShadow>
        <meshStandardMaterial attach="material-0" color={GOLD_AWARD.satin} metalness={0.42} roughness={0.52} envMapIntensity={1.1}
          bumpMap={grain} bumpScale={0.000035} />
        <meshStandardMaterial attach="material-1" color={GOLD_AWARD.edge} metalness={0.58} roughness={0.32} />
      </mesh>
      <mesh geometry={geometry.well} position={[0, 0, 0.003]} receiveShadow>
        <meshPhysicalMaterial color={GOLD_AWARD.mirror} metalness={0.7} roughness={0.22} envMapIntensity={1.7}
          clearcoat={0.5} clearcoatRoughness={0.12} />
      </mesh>
      <mesh geometry={geometry.badge} position={[-0.00065, 0.07565, 0.0034]} castShadow receiveShadow>
        <meshStandardMaterial color={GOLD_AWARD.satin} metalness={0.76} roughness={0.43} />
      </mesh>
      <PhotoDecal texture={textures.logo} position={[-0.00065, 0.07565, 0.005]}
        size={[296 / 1536 * AWARD.width, 356 / 2304 * AWARD.height]} />
      <PhotoDecal texture={textures.ink} position={[0, 0, 0.00765]} size={[AWARD.width, AWARD.height]} ink />
      <BackPlate grain={grain} />
    </group>
    <FlutedSupport />
    <Rod from={[0, 0.0251, -0.0128]} to={[0, 0.0239, -0.0162]} radius={0.0027}
      color={PALETTE.graphite} metalness={0.25} />
  </group>;
}

function PhotoDecal({ texture, position, size, ink = false }: {
  readonly texture: Texture; readonly position: Point; readonly size: readonly [number, number]; readonly ink?: boolean;
}) {
  return <mesh position={[...position]}>
    <planeGeometry args={[...size]} />
    <meshStandardMaterial map={texture} transparent depthWrite={false} alphaTest={0.02}
      color={ink ? PALETTE.ink : PALETTE.white} metalness={ink ? 0 : 0.12}
      roughness={ink ? 1 : 0.7} envMapIntensity={ink ? 0 : 1} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

function BackPlate({ grain }: { readonly grain: Texture }) {
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(-0.0988, -0.1488); shape.lineTo(0.0988, -0.1488);
    shape.lineTo(0.0988, 0.1488); shape.lineTo(-0.0988, 0.1488); shape.closePath();
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

function FlutedSupport() {
  const support = useMemo(() => {
    const start = new Vector3(0, 0.036, 0.018);
    const end = new Vector3(0, 0.0025, -0.077);
    const direction = end.clone().sub(start);
    const geometry = new CylinderGeometry(0.0022, 0.0022, direction.length(), 96);
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      const x = positions.getX(index), z = positions.getZ(index);
      const radius = Math.hypot(x, z);
      if (radius === 0) continue;
      const flute = 1 + Math.cos(Math.atan2(z, x) * 24) * 0.045;
      positions.setXYZ(index, x * flute, positions.getY(index), z * flute);
    }
    geometry.computeVertexNormals();
    return { geometry, position: start.clone().add(end).multiplyScalar(0.5),
      quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) };
  }, []);
  useEffect(() => () => support.geometry.dispose(), [support]);
  return <mesh {...support} castShadow receiveShadow>
    <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={0.85} roughness={0.28} />
  </mesh>;
}
