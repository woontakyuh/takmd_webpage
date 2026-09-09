import { useEffect, useMemo } from 'react';
import { DoubleSide, MeshPhysicalMaterial } from 'three';
import { PALETTE } from './config';
import {
  createIsidoroBarwareGeometries,
  disposeIsidoroBarwareGeometries,
  ISIDORO_BARWARE,
  type IsidoroBarwareGeometries,
} from './IsidoroBarwareGeometry';
import { Block, Rod } from './Primitives';

type BarwareMaterials = ReturnType<typeof createBarwareMaterials>;

function createBarwareMaterials() {
  return {
    glass: createGlassMaterial(),
    cutGlass: new MeshPhysicalMaterial({
      color: '#f6faf7',
      transmission: 0.94,
      transparent: false,
      opacity: 1,
      thickness: 0.0012,
      ior: 1.5,
      roughness: 0.11,
      flatShading: true,
      clearcoat: 1,
      clearcoatRoughness: 0.06,
      envMapIntensity: 1.55,
    }),
    steel: new MeshPhysicalMaterial({
      color: '#aeb7b5',
      roughness: 0.13,
      metalness: 1,
      side: DoubleSide,
      clearcoat: 0.32,
      clearcoatRoughness: 0.07,
      anisotropy: 0.72,
      anisotropyRotation: Math.PI / 2,
      envMapIntensity: 2.35,
    }),
    steelHighlight: new MeshPhysicalMaterial({
      color: '#dce1df',
      roughness: 0.075,
      metalness: 1,
      clearcoat: 0.45,
      clearcoatRoughness: 0.04,
      envMapIntensity: 2.7,
    }),
  };
}

function createGlassMaterial() {
  return new MeshPhysicalMaterial({
    color: '#ffffff',
    transmission: 1,
    transparent: false,
    opacity: 1,
    thickness: 0.0018,
    ior: 1.5,
    attenuationColor: '#dbe7df',
    attenuationDistance: 1.2,
    depthWrite: true,
    side: DoubleSide,
    roughness: 0.035,
    metalness: 0,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    envMapIntensity: 1.35,
  });
}

function useBarwareResources() {
  const geometries = useMemo(createIsidoroBarwareGeometries, []);
  const materials = useMemo(createBarwareMaterials, []);
  useEffect(() => () => {
    disposeIsidoroBarwareGeometries(geometries);
    Object.values(materials).forEach(material => material.dispose());
  }, [geometries, materials]);
  return { geometries, materials };
}

function GlencairnGlass({ x, z = 0.055, geometries, materials }: {
  readonly x: number;
  readonly z?: number;
  readonly geometries: Pick<IsidoroBarwareGeometries, 'glencairn'>;
  readonly materials: Pick<BarwareMaterials, 'glass'>;
}) {
  const { shelfTop } = ISIDORO_BARWARE;
  return <mesh name="Glencairn whisky tasting glass" position={[x, shelfTop, z]}
    geometry={geometries.glencairn} material={materials.glass} castShadow />;
}

function MixingGlass({ geometries, materials }: {
  readonly geometries: IsidoroBarwareGeometries;
  readonly materials: BarwareMaterials;
}) {
  const { mixingGlass, counterTop, tray } = ISIDORO_BARWARE;
  const trayTop = counterTop + tray.thickness;
  return <group name="hollow faceted mixing glass at Yarai proportions"
    position={[mixingGlass.x, trayTop, mixingGlass.z]}>
    <mesh geometry={geometries.mixingGlass} material={materials.glass} castShadow />
    <mesh name="sixteen subtly faceted Yarai lower wall" position={[0, 0.058, 0]}
      geometry={geometries.mixingFacets} material={materials.cutGlass} />
    <mesh position={[0, 0.0065, 0]} rotation={[Math.PI / 2, 0, 0]}
      geometry={geometries.mixingBaseRing} material={materials.cutGlass} />
  </group>;
}

function Shaker({ geometries, materials }: {
  readonly geometries: IsidoroBarwareGeometries;
  readonly materials: BarwareMaterials;
}) {
  const { shaker, counterTop, tray } = ISIDORO_BARWARE;
  return <group name="Usagi 800mL stainless cobbler shaker"
    position={[shaker.x, counterTop + tray.thickness, shaker.z]}>
    <mesh name="weighted lower tin" geometry={geometries.shakerTin} material={materials.steel} castShadow />
    <mesh name="removable strainer dome" position={[0, shaker.strainerY, 0]}
      geometry={geometries.shakerStrainer} material={materials.steelHighlight} castShadow />
    <mesh name="removable measure cap" position={[0, shaker.capY, 0]}
      geometry={geometries.shakerCap} material={materials.steel} castShadow />
    {[{ y: shaker.strainerY, radius: 0.044 }, { y: shaker.capY, radius: 0.0235 }].map(join =>
      <mesh key={join.y} name="rolled shaker join" position={[0, join.y, 0]}
        rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[join.radius, 0.00145, 7, 40]} />
        <primitive object={materials.steelHighlight} attach="material" />
      </mesh>)}
  </group>;
}

function Jigger({ geometries, materials }: {
  readonly geometries: IsidoroBarwareGeometries;
  readonly materials: BarwareMaterials;
}) {
  const { jigger, counterTop, tray } = ISIDORO_BARWARE;
  const trayTop = counterTop + tray.thickness;
  return <group name="hollow double stainless steel jigger" position={[jigger.x, trayTop, jigger.z]}>
    <mesh position={[0, 0.029, 0]} geometry={geometries.jiggerLarge} material={materials.steel} castShadow />
    <mesh position={[0, 0.029, 0]} rotation={[0, 0, Math.PI]}
      geometry={geometries.jiggerSmall} material={materials.steel} castShadow />
  </group>;
}

function BarSpoon({ geometries, materials }: {
  readonly geometries: IsidoroBarwareGeometries;
  readonly materials: BarwareMaterials;
}) {
  const { spoon, counterTop, tray } = ISIDORO_BARWARE;
  return <group name="twisted 30 cm stainless bar spoon"
    position={[spoon.x, counterTop + tray.thickness + 0.002, spoon.z]} rotation={[0, -0.16, 0]}>
    <mesh geometry={geometries.spoonShaft} material={materials.steel} castShadow />
    <mesh geometry={geometries.spoonTwist} material={materials.steel} />
    <mesh name="hollow spoon bowl" position={[-0.154, 0, 0]} scale={[1.45, 1, 0.72]}
      geometry={geometries.spoonBowl} material={materials.steel} castShadow />
    <mesh name="weighted teardrop end" position={[0.153, 0, 0]} scale={[1.5, 0.34, 0.72]}
      geometry={geometries.spoonTip} material={materials.steel} castShadow />
  </group>;
}

function BarTray() {
  const { tray, counterTop } = ISIDORO_BARWARE;
  const y = counterTop + tray.thickness / 2;
  const chrome = PALETTE.aluminiumEdge;
  return <group name="walnut service tray with fine chrome rim">
    <Block size={[tray.width, tray.thickness, tray.depth]} position={[tray.centerX, y, tray.centerZ]}
      color={PALETTE.walnutDark} radius={0.006} roughness={0.42} />
    {[-1, 1].map(side => <Rod key={`x-${side}`}
      from={[side * tray.width / 2, y + tray.thickness / 2, -tray.depth / 2]}
      to={[side * tray.width / 2, y + tray.thickness / 2, tray.depth / 2]}
      radius={0.0016} color={chrome} metalness={0.96} />)}
    {[-1, 1].map(side => <Rod key={`z-${side}`}
      from={[-tray.width / 2, y + tray.thickness / 2, side * tray.depth / 2]}
      to={[tray.width / 2, y + tray.thickness / 2, side * tray.depth / 2]}
      radius={0.0016} color={chrome} metalness={0.96} />)}
  </group>;
}

export function IsidoroBarware() {
  const { geometries, materials } = useBarwareResources();
  return <group name="Isidoro bartender tools and glassware">
    <group name="compact eight-glass upper shelf storage">
      {[-0.041, 0.039].flatMap(z => [-0.228, -0.156, -0.084].map(x =>
        <GlencairnGlass key={`${x}-${z}`} x={x} z={z} geometries={geometries} materials={materials} />))}
      {[0.073, 0.192].map(x =>
        <mesh key={x} name="Riedel coupe cocktail glass" position={[x, ISIDORO_BARWARE.shelfTop, -0.01]}
          geometry={geometries.coupe} material={materials.glass} castShadow />)}
    </group>
    <BarTray />
    <Shaker geometries={geometries} materials={materials} />
    <MixingGlass geometries={geometries} materials={materials} />
    <Jigger geometries={geometries} materials={materials} />
    <BarSpoon geometries={geometries} materials={materials} />
  </group>;
}
