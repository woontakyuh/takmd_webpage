import { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { Color, DoubleSide, InstancedMesh, Matrix4, PlaneGeometry } from 'three';
import type { Texture } from 'three';
import { PALETTE } from './config';
import { WHISKY_LECTURE } from './WhiskyLectureLayout';
import { WhiskyLectureMagnet } from './WhiskyLectureMagnet';

export function WhiskyLecturePaper({ texture, focused, hovered, count }: {
  readonly texture: Texture;
  readonly focused: boolean;
  readonly hovered: boolean;
  readonly count: number;
}) {
  const geometry = useMemo(() => new PlaneGeometry(WHISKY_LECTURE.width, WHISKY_LECTURE.height), []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const layers = useRef<InstancedMesh>(null);
  useLayoutEffect(() => {
    if (!layers.current) return;
    const transform = new Matrix4();
    const color = new Color();
    for (let layer = 0; layer < count; layer += 1) {
      layers.current.setMatrixAt(layer, transform.makeTranslation(0, 0, layer * WHISKY_LECTURE.sheetThickness));
      layers.current.setColorAt(layer, color.set(layer % 2 ? PALETTE.paper : PALETTE.paperLight));
    }
    layers.current.instanceMatrix.needsUpdate = true;
    if (layers.current.instanceColor) layers.current.instanceColor.needsUpdate = true;
    layers.current.computeBoundingSphere();
  }, [count, focused]);
  const depth = (count - 1) * WHISKY_LECTURE.sheetThickness;
  return <>
    {!focused && <>
      <instancedMesh ref={layers} name="Layered lecture paper edges" args={[geometry, undefined, count]} castShadow receiveShadow>
        <meshStandardMaterial roughness={.97} side={DoubleSide} />
      </instancedMesh>
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
