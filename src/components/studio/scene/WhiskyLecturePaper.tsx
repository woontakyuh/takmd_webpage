import { useEffect, useMemo } from 'react';
import { DoubleSide, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';

function paperLift(x: number, y: number) {
  const down = Math.max(0, .5 - y / WHISKY_LECTURE.height);
  const right = Math.max(0, .5 + x / WHISKY_LECTURE.width);
  return .0045 * down ** 5 * right ** 3
    + .00065 * down * Math.sin(12 * x + 7 * y) ** 2
    + .0005 * Math.exp(-(((y + .24 * x + .04) / .012) ** 2)) * down;
}

export function WhiskyLecturePaper({ texture, flat, hovered }: {
  readonly texture: Texture; readonly flat: boolean; readonly hovered: boolean;
}) {
  const geometries = useMemo(() => [0.004, 0].map(border => {
    const geometry = new PlaneGeometry(WHISKY_LECTURE.width + border, WHISKY_LECTURE.height + border, 36, 28);
    const positions = geometry.getAttribute('position');
    if (!flat) for (let index = 0; index < positions.count; index++) {
      positions.setZ(index, paperLift(positions.getX(index), positions.getY(index)));
    }
    geometry.computeVertexNormals();
    return geometry;
  }), [flat]);
  useEffect(() => () => geometries.forEach(geometry => geometry.dispose()), [geometries]);
  return <>
    <mesh name="Matte curled lecture paper" geometry={geometries[0]} castShadow receiveShadow>
      <meshStandardMaterial color={hovered ? PALETTE.paperLight : PALETTE.paper} roughness={.96} side={DoubleSide} />
    </mesh>
    <mesh name="Printed whisky lecture cover" geometry={geometries[1]} position={[0, 0, .0004]} receiveShadow>
      <meshStandardMaterial map={texture} color={PALETTE.paperLight} roughness={.96} />
    </mesh>
    {[[-.176, .135], [.155, .130]].map(([x, y]) => <mesh key={x} name="Brushed steel paper magnet"
      position={[x, y, .0016 + (flat ? 0 : paperLift(x, y))]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.0036, .0036, .0024, 20]} />
      <meshStandardMaterial color={PALETTE.aluminium} metalness={.86} roughness={.32} />
    </mesh>)}
  </>;
}
