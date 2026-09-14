import { useEffect, useMemo } from 'react';
import { DataTexture, LinearFilter, LinearMipmapLinearFilter, RepeatWrapping } from 'three';
import type { Texture } from 'three';
import { BEOLAB_8000 as B, BEOLAB_8000_PAIR } from './Beolab8000Layout';
import { PALETTE } from './config';
import { Block, Rod } from './Primitives';

function useGrilleWeave() {
  const texture = useMemo(() => {
    const size = 16, pixels = new Uint8Array(size * size * 4);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const horizontal = Math.floor(x / 4) % 2 === Math.floor(y / 4) % 2;
      const thread = Math.sin((horizontal ? y : x) % 4 / 4 * Math.PI);
      const value = Math.round(104 + thread * 92), offset = (y * size + x) * 4;
      pixels.set([value, value, value, 255], offset);
    }
    const result = new DataTexture(pixels, size, size);
    result.wrapS = RepeatWrapping; result.wrapT = RepeatWrapping;
    result.repeat.set(20, 108);
    result.magFilter = LinearFilter; result.minFilter = LinearMipmapLinearFilter;
    result.generateMipmaps = true; result.anisotropy = 4; result.needsUpdate = true;
    return result;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

function Beolab8000({ weave }: { readonly weave: Texture }) {
  const bodyHeight = B.height - B.coneTop;
  const clothHeight = B.grilleTop - B.coneTop;
  return <group name="Beolab 8000 aluminium and black cloth, 132 cm">
    <group name="170 mm square cast-iron floor base">
      {[-.061, .061].flatMap(x => [-.061, .061].map(z => <mesh key={`${x}:${z}`} position={[x, .002, z]}>
        <cylinderGeometry args={[.007, .007, .004, 16]} />
        <meshStandardMaterial color={PALETTE.rubber} roughness={.98} />
      </mesh>))}
      <Block size={[B.baseWidth, B.baseTop - B.baseBottom, B.baseWidth]}
        position={[0, (B.baseTop + B.baseBottom) / 2, 0]} radius={.0015}
        color="#151817" roughness={.54} metalness={.38} />
      <mesh name="column fixing collar" position={[0, .048, 0]} castShadow>
        <cylinderGeometry args={[.007, .009, .016, 32]} />
        <meshStandardMaterial color="#222725" metalness={.75} roughness={.29} />
      </mesh>
    </group>
    <mesh name="polished aluminium taper" position={[0, (B.coneTop + B.coneBottom) / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[B.columnRadius, .0055, B.coneTop - B.coneBottom, 64]} />
      <meshPhysicalMaterial color={PALETTE.aluminiumEdge} metalness={1} roughness={.17}
        clearcoat={.12} clearcoatRoughness={.2} />
    </mesh>
    <mesh name="cylindrical aluminium enclosure" position={[0, B.coneTop + bodyHeight / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[B.columnRadius, B.columnRadius, bodyHeight, 64]} />
      <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={1} roughness={.21} />
    </mesh>
    <mesh name="curved black woven grille" position={[0, B.coneTop + clothHeight / 2, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[B.grilleRadius, B.grilleRadius, clothHeight, 48, 1, true, -Math.PI / 2, Math.PI]} />
      <meshStandardMaterial color="#121615" roughness={.96} bumpMap={weave} bumpScale={.00013} />
    </mesh>
    {[-1, 1].map(side => <mesh key={side} name="grille folded edge" position={[side * B.columnRadius, B.coneTop + clothHeight / 2, 0]}>
      <cylinderGeometry args={[.00075, .00075, clothHeight, 8]} />
      <meshStandardMaterial color="#141816" roughness={.89} />
    </mesh>)}
    <mesh name="red standby light behind grille" position={[0, B.coneTop + .013, B.grilleRadius + .0002]}>
      <circleGeometry args={[.00085, 12]} />
      <meshBasicMaterial color="#842c21" toneMapped={false} />
    </mesh>
    <Block size={[.023, .074, .002]} position={[0, .345, -.0603]} radius={.001}
      color="#181c1a" roughness={.79} />
    <group name="single sleeved Power Link and mains cable">
      <Rod from={[0, .314, -.061]} to={[0, .018, -.076]} radius={.0022} color={PALETTE.rubber} />
      <Rod from={[0, .018, -.076]} to={[0, .0025, -.1]} radius={.0022} color={PALETTE.rubber} />
      <Rod from={[0, .0025, -.1]} to={[0, .0025, -.452]} radius={.0022} color={PALETTE.rubber} />
    </group>
  </group>;
}

export function Beolab8000Pair() {
  const weave = useGrilleWeave();
  return <group name="Beosound 9000 paired Beolab 8000 floor speakers">
    {BEOLAB_8000_PAIR.map(speaker => <group key={speaker.channel} name={`Beolab 8000 ${speaker.channel}`}
      position={[...speaker.position]} rotation={[0, speaker.rotation, 0]}>
      <Beolab8000 weave={weave} />
    </group>)}
  </group>;
}
