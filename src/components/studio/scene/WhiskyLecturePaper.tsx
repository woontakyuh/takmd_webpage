import { useEffect, useMemo } from 'react';
import { DoubleSide } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { WhiskyLectureMagnet } from './WhiskyLectureMagnet';
import { createLectureSheet } from './WhiskyLectureSheet';

export function WhiskyLecturePaper({ texture, focused, hovered, count }: {
  readonly texture: Texture;
  readonly focused: boolean;
  readonly hovered: boolean;
  readonly count: number;
}) {
  const geometry = useMemo(() => createLectureSheet(0), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const depth = (count - 1) * WHISKY_LECTURE.sheetThickness;
  return <>
    {!focused && <>
      {Array.from({ length: count }, (_, layer) => <mesh key={layer} name="Layered lecture paper edge"
        geometry={geometry} position={[0, 0, layer * WHISKY_LECTURE.sheetThickness]} castShadow receiveShadow>
        <meshStandardMaterial color={layer % 2 ? PALETTE.paper : PALETTE.paperLight} roughness={.97} side={DoubleSide} />
      </mesh>)}
      <mesh name="Printed whisky lecture cover" geometry={geometry} position={[0, 0, depth + .00002]} receiveShadow>
        <meshStandardMaterial map={texture} color={hovered ? PALETTE.white : PALETTE.paperLight}
          roughness={.96} side={DoubleSide} />
      </mesh>
    </>}
    {WHISKY_LECTURE.pinXs.map(x => <group key={x} name="Fixed top-edge nickel paper magnet"
      position={[x, WHISKY_LECTURE.pinY, depth + .00005]} scale={WHISKY_LECTURE.magnetScale}>
      <WhiskyLectureMagnet />
    </group>)}
  </>;
}
