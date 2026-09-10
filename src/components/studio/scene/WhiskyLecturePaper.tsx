import { useEffect, useMemo } from 'react';
import { DataTexture, DoubleSide, PlaneGeometry, RedFormat, RepeatWrapping } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

const MAGNET = {
  x: -WHISKY_LECTURE.width / 2 + 0.031,
  y: WHISKY_LECTURE.height / 2 - 0.027,
  radius: 0.0105,
} as const;

function paperShape(x: number, y: number, focused: boolean) {
  const right = Math.max(0, Math.min(1, x / WHISKY_LECTURE.width + .5));
  const down = Math.max(0, Math.min(1, .5 - y / WHISKY_LECTURE.height));
  const strength = focused ? .42 : 1;
  return {
    y: y - strength * .0048 * right ** 2 * (.24 + .76 * down),
    z: strength * (.0038 * right ** 2 * down ** 3
      + .00055 * down * Math.sin(12 * x + 7 * y) ** 2),
  };
}

export function WhiskyLecturePaper({ texture, focused, hovered }: {
  readonly texture: Texture; readonly focused: boolean; readonly hovered: boolean;
}) {
  const geometries = useMemo(() => [0.004, 0].map(border => {
    const geometry = new PlaneGeometry(WHISKY_LECTURE.width + border, WHISKY_LECTURE.height + border, 36, 28);
    const positions = geometry.getAttribute('position');
    for (let index = 0; index < positions.count; index++) {
      const shaped = paperShape(positions.getX(index), positions.getY(index), focused);
      positions.setY(index, shaped.y);
      positions.setZ(index, shaped.z);
    }
    geometry.computeVertexNormals();
    return geometry;
  }), [focused]);
  const brushedMetal = useMemo(() => {
    const values = new Uint8Array(64 * 64);
    for (let y = 0; y < 64; y += 1) for (let x = 0; x < 64; x += 1) {
      values[y * 64 + x] = 112 + Math.round(34 * Math.sin(y * 1.7) + 10 * Math.sin(x * .39 + y * .11));
    }
    const map = new DataTexture(values, 64, 64, RedFormat);
    map.wrapS = RepeatWrapping;
    map.wrapT = RepeatWrapping;
    map.repeat.set(2, 7);
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => geometries.forEach(geometry => geometry.dispose()), [geometries]);
  useEffect(() => () => brushedMetal.dispose(), [brushedMetal]);
  return <>
    {[4, 3, 2, 1].map(layer => <mesh key={layer} name="Layered lecture paper edge"
      geometry={geometries[0]} position={[layer * -.00014, layer * .00009, layer * -.00032]} castShadow receiveShadow>
      <meshStandardMaterial color={PALETTE.paper} roughness={.97} side={DoubleSide} />
    </mesh>)}
    <mesh name="Matte sagging lecture paper" geometry={geometries[0]} castShadow receiveShadow>
      <meshStandardMaterial color={hovered ? PALETTE.paperLight : PALETTE.paper} roughness={.96} side={DoubleSide} />
    </mesh>
    <mesh name="Printed whisky lecture cover" geometry={geometries[1]} position={[0, 0, .0004]} receiveShadow>
      <meshStandardMaterial map={texture} color={PALETTE.paperLight} roughness={.96} side={DoubleSide} />
    </mesh>
    <group name="Single upper-left brushed steel paper magnet" position={[MAGNET.x, MAGNET.y, .0041]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[MAGNET.radius, MAGNET.radius * .94, .0064, 32, 3]} />
        <meshStandardMaterial color={PALETTE.aluminium} metalness={.9} roughness={.3} roughnessMap={brushedMetal} />
      </mesh>
      <mesh position={[0, 0, .0033]} castShadow>
        <torusGeometry args={[MAGNET.radius * .72, .00125, 8, 32]} />
        <meshStandardMaterial color={PALETTE.aluminiumEdge} metalness={.94} roughness={.2} roughnessMap={brushedMetal} />
      </mesh>
    </group>
  </>;
}
