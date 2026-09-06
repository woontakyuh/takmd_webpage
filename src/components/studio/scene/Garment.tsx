import { useEffect, useMemo } from 'react';
import { CanvasTexture, CatmullRomCurve3, RepeatWrapping, Shape, SRGBColorSpace, Vector3 } from 'three';
import type { Texture } from 'three';
import type { Point } from './config';
import { Block, Rod } from './Primitives';
import { usePrintedTexture } from './Textures';
import { PALETTE } from './config';

const GI_BLUE = '#285A96';
const GI_BLACK = '#171C1F';

type PanelProps = {
  readonly points: readonly (readonly [number, number])[];
  readonly color: string;
  readonly texture: Texture;
  readonly depth?: number;
  readonly z?: number;
};

function ClothPanel({ points, color, texture, depth = 0.018, z = 0 }: PanelProps) {
  const shape = useMemo(() => {
    const [first, ...rest] = points;
    if (!first) return new Shape();
    const result = new Shape();
    result.moveTo(first[0], first[1]);
    rest.forEach(([x, y]) => result.lineTo(x, y));
    result.closePath();
    return result;
  }, [points]);
  return (
    <mesh position={[0, 0, z]} castShadow receiveShadow>
      <extrudeGeometry args={[shape, { depth, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.004, bevelSegments: 2 }]} />
      <meshStandardMaterial color={color} map={texture} roughness={0.92} metalness={0} />
    </mesh>
  );
}

function ClothFold({ points, color, radius = 0.004 }: {
  readonly points: readonly Point[];
  readonly color: string;
  readonly radius?: number;
}) {
  const curve = useMemo(() => new CatmullRomCurve3(points.map((point) => new Vector3(...point))), [points]);
  return (
    <mesh castShadow>
      <tubeGeometry args={[curve, 18, radius, 6, false]} />
      <meshStandardMaterial color={color} roughness={0.96} />
    </mesh>
  );
}

function useGarmentTexture(repeatX: number, repeatY: number) {
  const texture = usePrintedTexture('linen');
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.needsUpdate = true;
  return texture;
}

type PatchKind = 'usa' | 'flag' | 'control' | 'tag';

function GiPatch({ kind, position, size }: {
  readonly kind: PatchKind;
  readonly position: Point;
  readonly size: readonly [number, number];
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (context) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (kind === 'flag') {
        context.fillStyle = PALETTE.white;
        context.fillRect(0, 0, 256, 128);
        context.fillStyle = PALETTE.clay;
        for (let y = 0; y < 128; y += 20) context.fillRect(0, y, 256, 10);
        context.fillStyle = GI_BLUE;
        context.fillRect(0, 0, 112, 68);
      } else if (kind === 'tag') {
        context.fillStyle = PALETTE.clay;
        context.fillRect(0, 0, 256, 128);
        context.fillStyle = PALETTE.white;
        context.font = '700 64px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText('CTRL', 128, 64);
      } else {
        context.fillStyle = GI_BLUE;
        context.font = kind === 'control' ? 'italic 700 62px Georgia' : '700 68px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(kind === 'control' ? 'Control' : 'USA', 128, 64);
      }
    }
    const result = new CanvasTexture(canvas);
    result.colorSpace = SRGBColorSpace;
    result.anisotropy = 4;
    return result;
  }, [kind]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={[...position]} castShadow>
      <planeGeometry args={[size[0], size[1]]} />
      <meshStandardMaterial map={texture} transparent roughness={0.88} polygonOffset polygonOffsetFactor={-2} />
    </mesh>
  );
}

function WoodenHanger() {
  return (
    <group>
      <mesh position={[0.003, 0.043, 0]} rotation={[0, 0, 0.2]} castShadow>
        <torusGeometry args={[0.036, 0.0045, 8, 18, Math.PI * 1.55]} />
        <meshStandardMaterial color={PALETTE.steel} roughness={0.34} metalness={0.72} />
      </mesh>
      <Rod from={[0, -0.005, 0]} to={[-0.205, -0.105, 0]} radius={0.014} endRadius={0.011} color={PALETTE.walnut} />
      <Rod from={[0, -0.005, 0]} to={[0.205, -0.105, 0]} radius={0.014} endRadius={0.011} color={PALETTE.walnut} />
      <Rod from={[-0.205, -0.105, 0]} to={[0.205, -0.105, 0]} radius={0.008} color={PALETTE.walnutDark} />
    </group>
  );
}

const COAT_LEFT = [[-0.045, -0.1], [-0.17, -0.12], [-0.235, -0.24], [-0.215, -0.76], [-0.018, -0.78], [-0.012, -0.29]] as const;
const COAT_RIGHT = [[0.045, -0.1], [0.17, -0.12], [0.235, -0.24], [0.215, -0.76], [0.018, -0.78], [0.012, -0.29]] as const;
const LEFT_SLEEVE = [[-0.165, -0.14], [-0.245, -0.21], [-0.31, -0.59], [-0.255, -0.62], [-0.19, -0.31]] as const;
const RIGHT_SLEEVE = [[0.165, -0.14], [0.245, -0.21], [0.3, -0.58], [0.245, -0.62], [0.19, -0.31]] as const;
const LEFT_LAPEL = [[-0.045, -0.11], [-0.145, -0.14], [-0.038, -0.38], [-0.004, -0.27]] as const;
const RIGHT_LAPEL = [[0.045, -0.11], [0.145, -0.14], [0.038, -0.38], [0.004, -0.27]] as const;

export function DoctorCoat() {
  const cloth = useGarmentTexture(7, 12);
  return (
    <group>
      <WoodenHanger />
      <ClothPanel points={LEFT_SLEEVE} color={PALETTE.paperLight} texture={cloth} z={-0.009} />
      <ClothPanel points={RIGHT_SLEEVE} color={PALETTE.paperLight} texture={cloth} z={-0.009} />
      <ClothPanel points={COAT_LEFT} color={PALETTE.white} texture={cloth} z={-0.009} />
      <ClothPanel points={COAT_RIGHT} color={PALETTE.white} texture={cloth} z={-0.009} />
      <ClothPanel points={LEFT_LAPEL} color={PALETTE.paper} texture={cloth} depth={0.012} z={0.012} />
      <ClothPanel points={RIGHT_LAPEL} color={PALETTE.paper} texture={cloth} depth={0.012} z={0.012} />
      <Block size={[0.105, 0.12, 0.012]} position={[-0.13, -0.57, 0.03]} radius={0.006} color={PALETTE.paperLight} texture={cloth} roughness={0.94} />
      <Block size={[0.105, 0.12, 0.012]} position={[0.13, -0.57, 0.03]} radius={0.006} color={PALETTE.paperLight} texture={cloth} roughness={0.94} />
      <Rod from={[-0.18, -0.51, 0.04]} to={[-0.075, -0.51, 0.04]} radius={0.0022} color={PALETTE.line} />
      <Rod from={[0.075, -0.51, 0.04]} to={[0.18, -0.51, 0.04]} radius={0.0022} color={PALETTE.line} />
      <Rod from={[-0.208, -0.72, 0.02]} to={[-0.02, -0.74, 0.02]} radius={0.0018} color={PALETTE.line} />
      <Rod from={[0.02, -0.74, 0.02]} to={[0.208, -0.72, 0.02]} radius={0.0018} color={PALETTE.line} />
      <ClothFold points={[[-0.145, -0.3, 0.024], [-0.13, -0.46, 0.032], [-0.15, -0.7, 0.023]]} color={PALETTE.paperLight} />
      <ClothFold points={[[0.14, -0.3, 0.024], [0.12, -0.45, 0.033], [0.145, -0.7, 0.023]]} color={PALETTE.paperLight} />
    </group>
  );
}

const GI_BODY = [[-0.17, -0.12], [-0.26, -0.22], [-0.235, -0.82], [0, -0.85], [0.235, -0.82], [0.26, -0.22], [0.17, -0.12], [0.06, -0.1], [0, -0.18], [-0.06, -0.1]] as const;
const GI_LEFT_SLEEVE = [[-0.16, -0.13], [-0.25, -0.2], [-0.355, -0.55], [-0.29, -0.59], [-0.2, -0.31]] as const;
const GI_RIGHT_SLEEVE = [[0.16, -0.13], [0.25, -0.2], [0.35, -0.54], [0.285, -0.59], [0.2, -0.31]] as const;
const GI_LEFT_LAPEL = [[-0.07, -0.1], [-0.18, -0.14], [0.105, -0.63], [0.17, -0.6]] as const;
const GI_RIGHT_LAPEL = [[0.07, -0.1], [0.18, -0.14], [-0.105, -0.63], [-0.17, -0.6]] as const;

export function JiuJitsuGi() {
  const cloth = useGarmentTexture(10, 16);
  return (
    <group>
      <WoodenHanger />
      <ClothPanel points={GI_LEFT_SLEEVE} color={PALETTE.white} texture={cloth} />
      <ClothPanel points={GI_RIGHT_SLEEVE} color={PALETTE.white} texture={cloth} />
      <ClothPanel points={GI_BODY} color={PALETTE.white} texture={cloth} z={-0.009} />
      <ClothPanel points={GI_LEFT_LAPEL} color={PALETTE.paperLight} texture={cloth} depth={0.022} z={0.012} />
      <ClothPanel points={GI_RIGHT_LAPEL} color={PALETTE.paperLight} texture={cloth} depth={0.022} z={0.03} />
      <Rod from={[-0.225, -0.73, 0.025]} to={[0.225, -0.76, 0.025]} radius={0.0025} color={PALETTE.line} />
      <Rod from={[-0.31, -0.535, 0.012]} to={[-0.285, -0.57, 0.012]} radius={0.0025} color={PALETTE.line} />
      <Rod from={[0.305, -0.53, 0.012]} to={[0.28, -0.57, 0.012]} radius={0.0025} color={PALETTE.line} />
      <Rod from={[-0.355, -0.55, 0.014]} to={[-0.29, -0.59, 0.014]} radius={0.005} color={GI_BLUE} />
      <Rod from={[0.35, -0.54, 0.014]} to={[0.285, -0.59, 0.014]} radius={0.005} color={GI_BLUE} />
      <ClothFold points={[[-0.14, -0.29, 0.034], [-0.17, -0.47, 0.042], [-0.13, -0.7, 0.032]]} color={PALETTE.paperLight} radius={0.005} />
      <ClothFold points={[[0.15, -0.3, 0.034], [0.17, -0.48, 0.043], [0.12, -0.71, 0.032]]} color={PALETTE.paperLight} radius={0.005} />
      <GiPatch kind="flag" position={[-0.205, -0.23, 0.037]} size={[0.045, 0.03]} />
      <GiPatch kind="usa" position={[0.205, -0.23, 0.037]} size={[0.055, 0.028]} />
      <GiPatch kind="control" position={[0.125, -0.69, 0.04]} size={[0.11, 0.048]} />
      <GiPatch kind="tag" position={[-0.16, -0.7, 0.04]} size={[0.035, 0.065]} />
      <DrapedBelt />
    </group>
  );
}

function DrapedBelt() {
  return (
    <group position={[0, -0.12, 0.07]}>
      <Block size={[0.16, 0.045, 0.022]} position={[0, 0, 0]} rotation={[0, 0, 0.04]} radius={0.006} color={GI_BLUE} roughness={0.96} />
      <Block size={[0.052, 0.38, 0.02]} position={[-0.105, -0.2, -0.004]} rotation={[0, 0, -0.16]} radius={0.005} color={GI_BLUE} roughness={0.97} />
      <Block size={[0.052, 0.5, 0.02]} position={[0.105, -0.26, 0.006]} rotation={[0, 0, 0.13]} radius={0.005} color={GI_BLUE} roughness={0.97} />
      <Block size={[0.057, 0.115, 0.023]} position={[0.137, -0.455, 0.009]} rotation={[0, 0, 0.13]} radius={0.004} color={GI_BLACK} roughness={0.94} />
      {[-0.49, -0.46, -0.43].map((y) => (
        <Block key={y} size={[0.061, 0.014, 0.026]} position={[0.145 + (y + 0.46) * -0.13, y, 0.014]}
          rotation={[0, 0, 0.13]} radius={0.002} color={PALETTE.white} roughness={0.9} />
      ))}
    </group>
  );
}
