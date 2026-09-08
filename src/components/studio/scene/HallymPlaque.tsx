import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BackSide, ExtrudeGeometry, LatheGeometry, Path, Quaternion, RepeatWrapping, Shape, ShapeGeometry, SRGBColorSpace, Vector2, Vector3 } from 'three';
import type { Texture } from 'three';
import { GOLD_AWARD, INTERIOR, PALETTE } from './config';
import type { Point } from './config';
import { Block, Rod } from './Primitives';

const PLAQUE = { width: 0.245, height: 0.255, depth: 0.018, faceWidth: 0.183, lean: -0.2 } as const;
const ART = { width: 1472, height: 2048, photoX: 173, photoY: 1437, photoWidth: 1123, photoHeight: 526 } as const;
const ORIGIN_Y = PLAQUE.height / 2 * Math.cos(PLAQUE.lean) + PLAQUE.depth / 2 * Math.abs(Math.sin(PLAQUE.lean));

function capsule(x: number, y: number, width: number, height: number) {
  const path = new Path(), radius = width / 2;
  path.moveTo(x - radius, y - height / 2 + radius);
  path.absarc(x, y - height / 2 + radius, radius, Math.PI, Math.PI * 2, false);
  path.lineTo(x + radius, y + height / 2 - radius);
  path.absarc(x, y + height / 2 - radius, radius, 0, Math.PI, false);
  path.closePath();
  return path;
}

function rearGeometry() {
  const face = new Shape();
  face.moveTo(-PLAQUE.width / 2, -PLAQUE.height / 2);
  face.lineTo(PLAQUE.width / 2, -PLAQUE.height / 2);
  face.lineTo(PLAQUE.width / 2, PLAQUE.height / 2);
  face.lineTo(-PLAQUE.width / 2, PLAQUE.height / 2);
  face.closePath();
  const slot = capsule(0.0655, 0.001, 0.0145, 0.15);
  const keyhole = new Path();
  keyhole.moveTo(-0.0028, 0.085);
  keyhole.absarc(0, 0.085, 0.0028, Math.PI, 0, true);
  keyhole.lineTo(0.0028, 0.0718);
  keyhole.absarc(0, 0.067, 0.0056, Math.PI / 3, Math.PI * 2 / 3, true);
  keyhole.lineTo(-0.0028, 0.085);
  keyhole.closePath();
  face.holes.push(slot, keyhole);
  const surface = new ExtrudeGeometry(face, { depth: 0.0035, bevelEnabled: false, curveSegments: 20 });
  surface.translate(0, 0, -PLAQUE.depth / 2);
  const position = surface.getAttribute('position'), uv = surface.getAttribute('uv');
  for (let index = 0; index < uv.count; index++) {
    uv.setXY(index, 0.5 - position.getX(index) / PLAQUE.width, 0.5 + position.getY(index) / PLAQUE.height);
  }
  const floor = new ShapeGeometry([new Shape(slot.getPoints(24)), new Shape(keyhole.getPoints(24))]);
  return { surface, floor };
}

export function HallymPlaque() {
  const [inkSource, portraitSource, leftSource, rightSource, backSource] = useTexture([
    '/models/personal-awards/hallym/engraving.webp', '/models/personal-awards/hallym/group-portrait.webp',
    '/models/personal-awards/hallym/wood-left.webp', '/models/personal-awards/hallym/wood-right.webp',
    '/models/personal-awards/hallym/wood-back.webp',
  ]);
  const textures = useMemo(() => {
    const ink = inkSource.clone(), portrait = portraitSource.clone();
    const left = leftSource.clone(), right = rightSource.clone(), back = backSource.clone();
    for (const texture of [ink, portrait, left, right, back]) {
      texture.colorSpace = SRGBColorSpace;
      texture.anisotropy = 8;
      texture.needsUpdate = true;
    }
    back.wrapS = RepeatWrapping;
    back.repeat.x = 3.5;
    return { ink, portrait, left, right, back };
  }, [inkSource, portraitSource, leftSource, rightSource, backSource]);
  const geometry = useMemo(rearGeometry, []);
  useEffect(() => () => Object.values(textures).forEach(texture => texture.dispose()), [textures]);
  useEffect(() => () => Object.values(geometry).forEach(part => part.dispose()), [geometry]);
  return <group name="Hallym Dongtan Sacred Heart Hospital appreciation plaque">
    <group position={[0, ORIGIN_Y, 0]} rotation={[PLAQUE.lean, 0, 0]}>
      <Block size={[PLAQUE.width, PLAQUE.height, 0.0145]} position={[0, 0, 0.00175]}
        color={PALETTE.walnutDark} radius={0.00035} roughness={0.43} />
      <mesh name="Hallym figured wood rear with routed recesses" geometry={geometry.surface} castShadow receiveShadow>
        <meshPhysicalMaterial attach="material-0" color={PALETTE.white} map={textures.back}
          roughness={0.48} clearcoat={0.22} clearcoatRoughness={0.38} />
        <meshStandardMaterial attach="material-1" color={PALETTE.walnut} roughness={0.74} />
      </mesh>
      <mesh name="Hallym raw wood recess floors" geometry={geometry.floor} position={[0, 0, -0.0056]} receiveShadow>
        <meshStandardMaterial color={INTERIOR.oak} side={BackSide} roughness={0.86} />
      </mesh>
      {([-1, 1] as const).map(side => <Block key={side} size={[0.031, PLAQUE.height, 0.0014]}
        position={[side * 0.107, 0, 0.0096]} color={PALETTE.white} radius={0.00015}
        texture={side === -1 ? textures.left : textures.right} roughness={0.43}
        material={{ metalness: 0 }} />)}
      <Block size={[PLAQUE.faceWidth, PLAQUE.height - 0.0006, 0.001]} position={[0, 0, 0.0093]}
        color={GOLD_AWARD.satin} radius={0.00015} metalness={0.64} roughness={0.32} />
      <mesh name="Hallym polished black engraved face" position={[0, 0, 0.00987]} castShadow receiveShadow>
        <planeGeometry args={[PLAQUE.faceWidth - 0.003, PLAQUE.height - 0.004]} />
        <meshPhysicalMaterial color={PALETTE.rubber} metalness={0.18} roughness={0.34}
          clearcoat={0.48} clearcoatRoughness={0.23} envMapIntensity={0.9} />
      </mesh>
      <Artwork texture={textures.ink} size={[PLAQUE.faceWidth, PLAQUE.height]} position={[0, 0, 0.00998]} />
      <Artwork texture={textures.portrait} size={[ART.photoWidth / ART.width * PLAQUE.faceWidth, ART.photoHeight / ART.height * PLAQUE.height]}
        position={[(ART.photoX + ART.photoWidth / 2) / ART.width * PLAQUE.faceWidth - PLAQUE.faceWidth / 2,
          PLAQUE.height / 2 - (ART.photoY + ART.photoHeight / 2) / ART.height * PLAQUE.height, 0.01]} portrait />
    </group>
    <RearSupport />
  </group>;
}

function Artwork({ texture, position, size, portrait = false }: {
  readonly texture: Texture; readonly position: Point; readonly size: readonly [number, number]; readonly portrait?: boolean;
}) {
  return <mesh position={[...position]} raycast={() => {}}>
    <planeGeometry args={[...size]} />
    <meshStandardMaterial map={texture} transparent depthWrite={false} alphaTest={0.025} color={PALETTE.white}
      metalness={portrait ? 0.08 : 0.38} roughness={portrait ? 0.52 : 0.45} polygonOffset polygonOffsetFactor={-1} />
  </mesh>;
}

function RearSupport() {
  const support = useMemo(() => {
    const start = new Vector3(0, -0.083, -PLAQUE.depth / 2 + 0.001)
      .applyAxisAngle(new Vector3(1, 0, 0), PLAQUE.lean);
    start.y += ORIGIN_Y;
    const end = new Vector3(0, 0.0045, -0.105), radius = 0.0045;
    const createShaft = () => {
      const direction = end.clone().sub(start), half = direction.length() / 2;
      const profile = [[0, -half], [radius - 0.0004, -half], [radius, -half + 0.0004],
        [radius, half - 0.0012], [radius - 0.00012, half - 0.0007], [radius - 0.0006, half - 0.00015], [0, half]];
      const shaft = new LatheGeometry(profile.map(([x, y]) => new Vector2(x, y)), 160);
      const positions = shaft.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        const x = positions.getX(index), z = positions.getZ(index), radial = Math.hypot(x, z);
        if (radial === 0) continue;
        const flute = Math.max(0, Math.cos(Math.atan2(z, x) * 28)) ** 8 * 0.00023;
        positions.setXYZ(index, x * (1 - flute / radial), positions.getY(index), z * (1 - flute / radial));
      }
      shaft.computeVertexNormals();
      return { shaft, position: start.clone().add(end).multiplyScalar(0.5),
        quaternion: new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize()) };
    };
    let result = createShaft();
    const vertex = new Vector3();
    for (let iteration = 0; iteration < 4; iteration++) {
      let lowest = Infinity;
      const positions = result.shaft.getAttribute('position');
      for (let index = 0; index < positions.count; index++) {
        vertex.fromBufferAttribute(positions, index).applyQuaternion(result.quaternion).add(result.position);
        lowest = Math.min(lowest, vertex.y);
      }
      end.y -= lowest;
      result.shaft.dispose();
      result = createShaft();
    }
    const axis = end.clone().sub(start).normalize(), collar = start.clone().lerp(end, 0.32);
    return { ...result, collarFrom: collar.clone().addScaledVector(axis, -0.0011).toArray(),
      collarTo: collar.clone().addScaledVector(axis, 0.0011).toArray() };
  }, []);
  useEffect(() => () => support.shaft.dispose(), [support]);
  return <>
    <mesh name="Hallym fluted silver rear prop" geometry={support.shaft} position={support.position}
      quaternion={support.quaternion} castShadow receiveShadow>
      <meshPhysicalMaterial color={PALETTE.aluminiumEdge} metalness={0.8} roughness={0.28}
        anisotropy={0.65} anisotropyRotation={Math.PI / 2} envMapIntensity={1.2} />
    </mesh>
    <Rod from={support.collarFrom} to={support.collarTo} radius={0.0051} color={PALETTE.rubber} metalness={0.1} />
  </>;
}
