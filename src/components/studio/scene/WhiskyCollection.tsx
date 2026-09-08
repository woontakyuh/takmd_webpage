import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Float32BufferAttribute, LatheGeometry, SRGBColorSpace, Vector2 } from 'three';
import type { MeshStandardMaterial, Texture } from 'three';
import { WHISKY_PHOTO_BOUNDS } from './WhiskyPhotoBounds';
import { WHISKY_SILHOUETTES } from './WhiskySilhouettes';

type BottleShape = 'round' | 'rectangular' | 'faceted';
type BottleSpec = {
  readonly name: string;
  readonly image: keyof typeof WHISKY_SILHOUETTES;
  readonly position: readonly [number, number, number];
  readonly height: number;
  readonly radius: number;
  readonly shape: BottleShape;
  readonly glass: string;
  readonly darkGlass: boolean;
  readonly liquid: string;
  readonly cap: string;
  readonly capsuleHeight: number;
};

const BOTTLES = [
  { name: "Ballantine's 30 Year Old 750 ml", image: '/models/whisky/ballantines-30.png', position: [-2.25, 2.401, 3.08], height: .35, radius: 0.05163, shape: 'round', glass: '#201812', darkGlass: true, liquid: '#8d4d13', cap: '#6a3d27', capsuleHeight: .066 },
  { name: "Ballantine's Limited 700 ml", image: '/models/whisky/ballantines-limited.jpg', position: [-2.06, 2.401, 3.075], height: .35, radius: 0.05023, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#a8550d', cap: '#132339', capsuleHeight: .063 },
  { name: "Hibiki Japanese Harmony Master's Select 700 ml", image: '/models/whisky/hibiki-masters-select.jpg', position: [-1.87, 2.401, 3.072], height: .255, radius: 0.06112, shape: 'faceted', glass: '#f8f6f0', darkGlass: false, liquid: '#9f4308', cap: '#f5f2e9', capsuleHeight: 0 },
  { name: "Yamazaki Distiller's Reserve 700 ml", image: '/models/whisky/yamazaki-distillers-reserve.png', position: [-1.68, 2.401, 3.078], height: .33, radius: 0.05429, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#9d5015', cap: '#5d3025', capsuleHeight: .056 },
  { name: 'LARK Classic Cask Strength 500 ml', image: '/models/whisky/lark-classic-cask-strength.png', position: [-1.49, 2.401, 3.075], height: .24, radius: 0.05780, shape: 'rectangular', glass: '#f8f5ee', darkGlass: false, liquid: '#ae540c', cap: '#70472b', capsuleHeight: .026 },
  { name: 'Bowmore 12 Year Old 700 ml', image: '/models/whisky/bowmore-12.png', position: [-2.25, 2.001, 3.075], height: .34, radius: 0.04205, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#b55b10', cap: '#161715', capsuleHeight: .058 },
  { name: 'Lagavulin 16 Year Old 700 ml', image: '/models/whisky/lagavulin-16.webp', position: [-2.06, 2.001, 3.078], height: .35, radius: 0.04534, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#963408', cap: '#14352a', capsuleHeight: .063 },
  { name: 'Redbreast 12 Year Old 700 ml', image: '/models/whisky/redbreast-12.png', position: [-1.87, 2.001, 3.075], height: .31, radius: 0.05758, shape: 'round', glass: '#113322', darkGlass: true, liquid: '#5f2c12', cap: '#681c19', capsuleHeight: .056 },
  { name: 'The Balvenie The Creation of a Classic 700 ml', image: '/models/whisky/balvenie-creation-of-a-classic.png', position: [-1.68, 2.001, 3.075], height: .34, radius: 0.05640, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#9d430a', cap: '#2c201d', capsuleHeight: .065 },
  { name: "Booker's Kentucky Straight Bourbon 750 ml", image: '/models/whisky/bookers.png', position: [-1.49, 2.001, 3.075], height: .35, radius: .0459, shape: 'round', glass: '#f8f5ee', darkGlass: false, liquid: '#9e3508', cap: '#181817', capsuleHeight: .084 },
] as const satisfies readonly BottleSpec[];

function useBottleTextures() {
  const sources = useTexture(BOTTLES.map(bottle => bottle.image));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return textures;
}

function BottleGlass({ bottle }: { readonly bottle: BottleSpec }) {
  return <meshPhysicalMaterial color={bottle.darkGlass ? bottle.glass : bottle.liquid}
    roughness={.12} clearcoat={1} clearcoatRoughness={.08} transmission={.16}
    attenuationColor={bottle.liquid} attenuationDistance={.1} thickness={.06} ior={1.5} />;
}

function WhiskyLiquid({ bottle }: { readonly bottle: BottleSpec }) {
  return bottle.darkGlass
    ? <meshStandardMaterial color={bottle.liquid} roughness={.22} />
    : <meshPhysicalMaterial color="#d69b3c" attenuationColor={bottle.liquid} attenuationDistance={.22}
      transmission={.9} thickness={.09} roughness={.035} ior={1.36} />;
}

function profileSlice(profile: readonly (readonly [number, number])[], low: number, high: number) {
  const at = (height: number): readonly [number, number] => {
    for (let i = 1; i < profile.length; i += 1) {
      const a = profile[i - 1], b = profile[i];
      if (a && b && height <= b[1]) return [a[0] + (b[0] - a[0]) * (height - a[1]) / (b[1] - a[1]), height];
    }
    return [profile[profile.length - 1]?.[0] ?? 0, height];
  };
  return [at(low), ...profile.filter(([, y]) => y > low && y < high), at(high)];
}

function bottleGeometry(bottle: BottleSpec, profile: readonly (readonly [number, number])[], front = false) {
  const geometry = new LatheGeometry(profile.map(([radius, y]) => new Vector2(radius * bottle.radius * (front ? 1.003 : 1), y * bottle.height)),
    bottle.shape === 'faceted' ? 24 : 48);
  if (bottle.shape === 'rectangular') {
    const position = geometry.getAttribute('position');
    for (let i = 0; i < position.count; i += 1) {
      const x = position.getX(i), z = position.getZ(i), r = Math.hypot(x, z);
      if (!r) continue;
      const shoulder = Math.min(1, Math.max(0, (position.getY(i) / bottle.height - .68) / .18));
      const power = .24 + shoulder * .76;
      position.setXYZ(i, Math.sign(x) * Math.pow(Math.abs(x / r), power) * r, position.getY(i),
        Math.sign(z) * Math.pow(Math.abs(z / r), power) * r * (.675 + shoulder * .325));
    }
    geometry.computeVertexNormals();
  }
  return geometry;
}

function BottleBody({ bottle }: { readonly bottle: BottleSpec }) {
  const geometries = useMemo(() => {
    const profile = WHISKY_SILHOUETTES[bottle.image];
    const capStart = 1 - (bottle.shape === 'faceted' ? .12 : bottle.capsuleHeight / bottle.height);
    const body = bottleGeometry(bottle, profileSlice(profile, 0, capStart));
    const capProfile = profileSlice(profile, capStart, 1);
    const cap = bottleGeometry(bottle, [[0, capStart], ...capProfile, [0, 1]]);
    const fill = profileSlice(profile, .025, .66).map(([r, y]) => [r * .86, y] as const);
    const liquid = bottleGeometry(bottle, [[0, .025], ...fill, [0, .66]]);
    return { body, cap, liquid };
  }, [bottle]);
  useEffect(() => () => Object.values(geometries).forEach(geometry => geometry.dispose()), [geometries]);
  return <>
    <mesh geometry={geometries.body} castShadow receiveShadow><BottleGlass bottle={bottle} /></mesh>
    <mesh geometry={geometries.liquid} castShadow><WhiskyLiquid bottle={bottle} /></mesh>
    <mesh geometry={geometries.cap} castShadow receiveShadow>
      {bottle.shape === 'faceted'
        ? <meshPhysicalMaterial color={bottle.cap} roughness={.08} transmission={.42} thickness={.018} />
        : <meshStandardMaterial color={bottle.cap} roughness={.38} metalness={.08} />}
    </mesh>
  </>;
}

function maskUnverifiedBookersEdition(shader: Parameters<MeshStandardMaterial['onBeforeCompile']>[0]) {
  shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `#include <map_fragment>
    float batchStamp = smoothstep(0.379, 0.39, vMapUv.x) * (1.0 - smoothstep(0.503, 0.515, vMapUv.x)) * smoothstep(0.416, 0.43, vMapUv.y) * (1.0 - smoothstep(0.535, 0.548, vMapUv.y));
    float strengthLine = step(0.445, vMapUv.x) * step(vMapUv.x, 0.55) * step(0.215, vMapUv.y) * step(vMapUv.y, 0.232);
    vec3 glassBelow = texture2D(map, vec2(max(vMapUv.x, 0.393), 0.411)).rgb;
    vec3 glassAbove = texture2D(map, vec2(max(vMapUv.x, 0.407), 0.55)).rgb;
    vec3 unmarkedGlass = mix(glassBelow, glassAbove, smoothstep(0.411, 0.55, vMapUv.y));
    vec3 unmarkedPaper = texture2D(map, vec2(vMapUv.x, 0.21)).rgb;
    diffuseColor.rgb = mix(diffuseColor.rgb, unmarkedGlass, batchStamp);
    diffuseColor.rgb = mix(diffuseColor.rgb, unmarkedPaper, strengthLine);
  `);
}

function BottleFinish({ bottle, texture }: { readonly bottle: BottleSpec; readonly texture: Texture }) {
  const geometries = useMemo(() => {
    const photo = WHISKY_PHOTO_BOUNDS[bottle.image];
    const result = [bottleGeometry(bottle, WHISKY_SILHOUETTES[bottle.image], true)];
    for (const geometry of result) {
      const pos = geometry.getAttribute('position');
      const uv = geometry.getAttribute('uv');
      const colors = new Float32Array(pos.count * 4);
      for (let i = 0; i < pos.count; i += 1) {
        uv.setXY(i, photo.centerU + pos.getX(i) / (bottle.radius * 2) * photo.widthU,
          photo.bottomV + pos.getY(i) / bottle.height * photo.heightV);
        const facing = Math.cos(Math.atan2(pos.getX(i), pos.getZ(i)));
        const edge = Math.min(1, Math.max(0, (facing - .05) / .22));
        colors.set([1, 1, 1, edge * edge * (3 - 2 * edge)], i * 4);
      }
      geometry.setAttribute('color', new Float32BufferAttribute(colors, 4));
    }
    return result;
  }, [bottle]);
  useEffect(() => () => geometries.forEach(geometry => geometry.dispose()), [geometries]);
  return <group name={bottle.name + ' curved product finish'}>
    {geometries.map((geometry, index) => <mesh key={index} geometry={geometry} receiveShadow>
      <meshStandardMaterial map={texture} color="#ffffff" roughness={.24} metalness={.02}
        vertexColors transparent alphaTest={.015} depthWrite={false} polygonOffset polygonOffsetFactor={-2}
        onBeforeCompile={bottle.image.endsWith('/bookers.png') ? maskUnverifiedBookersEdition : undefined} />
    </mesh>)}
  </group>;
}

function Bottle({ bottle, texture }: { readonly bottle: BottleSpec; readonly texture: Texture }) {
  return <group name={bottle.name} position={bottle.position} rotation={[0, Math.PI, 0]}>
    <BottleBody bottle={bottle} />
    <BottleFinish bottle={bottle} texture={texture} />
  </group>;
}

export function WhiskyCollection() {
  const textures = useBottleTextures();
  return <group name="owned-whisky-collection">
    {BOTTLES.map((bottle, index) => {
      const texture = textures[index];
      return texture ? <Bottle key={bottle.name} bottle={bottle} texture={texture} /> : null;
    })}
  </group>;
}

useTexture.preload(BOTTLES.map(bottle => bottle.image));
