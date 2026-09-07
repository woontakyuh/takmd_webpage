import { useEffect, useMemo } from 'react';
import { BackSide, BufferGeometry, CatmullRomCurve3, ExtrudeGeometry, Float32BufferAttribute, Shape, TubeGeometry, Vector3 } from 'three';
import type { Point } from './config';
import { LIGHTING } from './config';
import { Rod } from './Primitives';

export type AjLampVariant = 'floor' | 'table';

type AjLampMeasurement = {
  readonly overallHeight: number;
  readonly baseWidth: number;
  readonly baseDepth: number;
  readonly baseHeight: number;
  readonly shadeLength: number;
  readonly shadeDiameter: number;
  readonly shadeCenterY: number;
  readonly shadeTilt: number;
  readonly stemBase: Point;
  readonly stemTop: Point;
  readonly aperture: Point;
  readonly lightTarget: Point;
};

export const AJ_LAMP = {
  floor: {
    overallHeight: 1.3,
    baseWidth: 0.275,
    baseDepth: 0.18,
    baseHeight: 0.012,
    shadeLength: 0.325,
    shadeDiameter: 0.145,
    shadeCenterY: 1.195,
    shadeTilt: 0.52,
    stemBase: [0, 0.014, -0.052],
    stemTop: [0, 1.238, -0.119],
    aperture: [0, 1.101, 0.134],
    lightTarget: [0, 0.55, 0.65],
  },
  table: {
    overallHeight: 0.56,
    baseWidth: 0.215,
    baseDepth: 0.135,
    baseHeight: 0.011,
    shadeLength: 0.325,
    shadeDiameter: 0.145,
    shadeCenterY: 0.455,
    shadeTilt: 0.52,
    stemBase: [0, 0.013, -0.04],
    stemTop: [0, 0.498, -0.119],
    aperture: [0, 0.361, 0.134],
    lightTarget: [0, 0.13, 0.55],
  },
} as const satisfies Readonly<Record<AjLampVariant, AjLampMeasurement>>;

type AjLampProps = {
  readonly powered: number;
  readonly variant?: AjLampVariant;
};

type ShadeGeometry = {
  readonly exterior: BufferGeometry;
  readonly reflector: BufferGeometry;
  readonly rim: BufferGeometry;
};

const SHADE_SEGMENTS = 36;

export function AjLamp({ powered, variant = 'floor' }: AjLampProps) {
  const dimensions = AJ_LAMP[variant];
  const power = Math.min(1, Math.max(0, powered));
  const base = useMemo(() => createPiercedBase(dimensions), [dimensions]);
  const shade = useMemo(() => createShade(dimensions), [dimensions]);
  const cable = useMemo(() => createCable(dimensions), [dimensions]);

  useEffect(() => () => {
    base.dispose();
    shade.exterior.dispose();
    shade.reflector.dispose();
    shade.rim.dispose();
    cable.dispose();
  }, [base, cable, shade]);

  return (
    <group name={`AJ ${variant} lamp`}>
      <mesh name="AJ pierced oval base" geometry={base} castShadow receiveShadow>
        <meshPhysicalMaterial color={LIGHTING.finish} roughness={0.48} metalness={0.52}
          clearcoat={0.08} clearcoatRoughness={0.58} />
      </mesh>
      <BaseNeck dimensions={dimensions} variant={variant} />
      <Rod from={dimensions.stemBase} to={dimensions.stemTop} radius={variant === 'floor' ? 0.008 : 0.0065}
        color={LIGHTING.finish} metalness={0.56} />
      <ShadeCollar position={dimensions.stemTop} />
      <group position={[0, dimensions.shadeCenterY, 0]} rotation={[dimensions.shadeTilt, 0, 0]}>
        <mesh name="AJ dark spun-steel shade" geometry={shade.exterior} castShadow receiveShadow>
          <meshPhysicalMaterial color={LIGHTING.finish} roughness={0.5} metalness={0.44}
            clearcoat={0.05} clearcoatRoughness={0.7} />
        </mesh>
        <mesh name="AJ ivory shade reflector" geometry={shade.reflector}>
          <meshStandardMaterial color={LIGHTING.reflector} emissive={LIGHTING.warmWhite}
            emissiveIntensity={0.035 + power * 0.34} roughness={0.72} side={BackSide} />
        </mesh>
        <mesh name="AJ slanted shade rim" geometry={shade.rim} castShadow receiveShadow>
          <meshStandardMaterial color={LIGHTING.finish} roughness={0.45} metalness={0.5} />
        </mesh>
        <mesh name="AJ capped rear shade" position={[0, 0, -dimensions.shadeLength / 2 - 0.0002]} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
          <circleGeometry args={[dimensions.shadeDiameter * 0.43 / 2, SHADE_SEGMENTS]} />
          <meshStandardMaterial color={LIGHTING.finish} roughness={0.5} metalness={0.44} />
        </mesh>
      </group>
      <mesh name="AJ restrained power cord" geometry={cable} castShadow receiveShadow>
        <meshStandardMaterial color={LIGHTING.cable} roughness={0.76} metalness={0.04} />
      </mesh>
    </group>
  );
}

function BaseNeck({ dimensions, variant }: { readonly dimensions: AjLampMeasurement; readonly variant: AjLampVariant }) {
  const radius = variant === 'floor' ? 0.019 : 0.016;
  return <mesh position={[dimensions.stemBase[0], dimensions.baseHeight + 0.005, dimensions.stemBase[2]]} castShadow receiveShadow>
    <cylinderGeometry args={[radius, radius * 1.16, 0.01, 32]} />
    <meshStandardMaterial color={LIGHTING.finish} roughness={0.42} metalness={0.58} />
  </mesh>;
}

function ShadeCollar({ position }: { readonly position: Point }) {
  return <mesh position={[position[0], position[1], position[2] + 0.01]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
    <cylinderGeometry args={[0.023, 0.019, 0.036, 28]} />
    <meshStandardMaterial color={LIGHTING.finish} roughness={0.4} metalness={0.58} />
  </mesh>;
}

function createPiercedBase(dimensions: AjLampMeasurement): ExtrudeGeometry {
  const base = new Shape();
  const outerX = dimensions.baseWidth / 2;
  const outerZ = dimensions.baseDepth / 2;
  base.absellipse(0, 0, outerX, outerZ, 0, Math.PI * 2, false, 0);
  const opening = new Shape();
  opening.absellipse(0, -outerZ * 0.1, outerX * 0.47, outerZ * 0.28, 0, Math.PI * 2, true, 0);
  base.holes.push(opening);
  const geometry = new ExtrudeGeometry(base, {
    depth: dimensions.baseHeight,
    bevelEnabled: true,
    bevelThickness: 0.0014,
    bevelSize: 0.0014,
    bevelSegments: 2,
    curveSegments: 32,
  });
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0.0015, 0);
  return geometry;
}

function createShade(dimensions: AjLampMeasurement): ShadeGeometry {
  const frontRadius = dimensions.shadeDiameter / 2;
  const backRadius = frontRadius * 0.43;
  const exterior = createSlantedFrustum(dimensions.shadeLength, backRadius, frontRadius, 0);
  const reflector = createSlantedFrustum(dimensions.shadeLength - 0.008, backRadius - 0.0035, frontRadius - 0.004, -0.001);
  const rim = createSlantedRim(dimensions.shadeLength, frontRadius);
  return { exterior, reflector, rim };
}

function createSlantedFrustum(length: number, rearRadius: number, frontRadius: number, yInset: number): BufferGeometry {
  const positions: number[] = [];
  const indices: number[] = [];
  const rearZ = -length / 2;
  for (let index = 0; index < SHADE_SEGMENTS; index += 1) {
    const angle = index / SHADE_SEGMENTS * Math.PI * 2;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    positions.push(cosine * rearRadius, sine * rearRadius * 0.88 + yInset, rearZ);
    positions.push(cosine * frontRadius, sine * frontRadius * 0.86 + yInset - 0.015, length / 2 + sine * frontRadius * 0.14);
  }
  for (let index = 0; index < SHADE_SEGMENTS; index += 1) {
    const next = (index + 1) % SHADE_SEGMENTS;
    const rear = index * 2;
    const front = rear + 1;
    const nextRear = next * 2;
    const nextFront = nextRear + 1;
    indices.push(rear, nextRear, front, nextRear, nextFront, front);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function createSlantedRim(length: number, radius: number): TubeGeometry {
  const points = Array.from({ length: SHADE_SEGMENTS }, (_, index) => {
    const angle = index / SHADE_SEGMENTS * Math.PI * 2;
    const y = Math.sin(angle) * radius * 0.86 - 0.015;
    return new Vector3(Math.cos(angle) * radius, y, length / 2 + Math.sin(angle) * radius * 0.14);
  });
  return new TubeGeometry(new CatmullRomCurve3(points, true), SHADE_SEGMENTS, 0.0024, 8, true);
}

function createCable(dimensions: AjLampMeasurement): TubeGeometry {
  const width = dimensions.baseWidth / 2;
  const curve = new CatmullRomCurve3([
    new Vector3(0.012, dimensions.baseHeight * 0.72, -0.058),
    new Vector3(width * 0.72, dimensions.baseHeight * 0.56, -0.074),
    new Vector3(width * 1.06, 0.003, -0.11),
    new Vector3(width * 1.34, 0.003, -0.22),
  ]);
  return new TubeGeometry(curve, 32, variantCableRadius(dimensions), 8, false);
}

function variantCableRadius(dimensions: AjLampMeasurement): number {
  return dimensions.overallHeight > 1 ? 0.0027 : 0.0022;
}
