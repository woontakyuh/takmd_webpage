import { useEffect, useMemo } from 'react';
import { CatmullRomCurve3, DoubleSide, LatheGeometry, Object3D, TubeGeometry, Vector2, Vector3 } from 'three';
import { Cable } from './Cable';
import { Rod } from './Primitives';

export function MantisFloor({ power, color }: { readonly power: number; readonly color: string }) {
  const { stem, shade, aim } = useMemo(() => {
    const stem = new TubeGeometry(new CatmullRomCurve3([
      new Vector3(0, 0.25, 0), new Vector3(0.40, 1.35, 0),
      new Vector3(0.46, 1.47, 0), new Vector3(0.66, 1.57, 0),
    ]), 48, 0.007, 10, false);
    const shade = new LatheGeometry([
      new Vector2(0.135, 0), new Vector2(0.131, 0.01), new Vector2(0.095, 0.045),
      new Vector2(0.06, 0.082), new Vector2(0.032, 0.13), new Vector2(0.018, 0.185),
      new Vector2(0.01, 0.20), new Vector2(0, 0.205),
    ], 64);
    const vertices = shade.attributes.position;
    for (let i = 0; i < vertices.count; i++) vertices.setX(i, vertices.getX(i) - vertices.getY(i) * 0.32);
    shade.computeVertexNormals();
    return { stem, shade, aim: new Object3D() };
  }, []);
  useEffect(() => () => { stem.dispose(); shade.dispose(); }, [stem, shade]);
  return <group name="DCW Mantis BS1 B satin black round base" position={[-1.75, 0.0185, 2.62]} rotation={[0, 0.55, 0]}>
    <mesh position={[0, 0.009, 0]} castShadow receiveShadow><cylinderGeometry args={[0.145, 0.145, 0.018, 64]} /><meshStandardMaterial color="#232521" roughness={0.46} metalness={0.35} /></mesh>
    <Rod from={[0, 0.02, 0]} to={[0, 0.30, 0]} radius={0.01} color="#232521" metalness={0.5} />
    <Rod from={[-0.19, 0.27, 0]} to={[0, 0.3, 0]} radius={0.004} color="#232521" />
    <Cable points={[[-0.19, 0.27, 0], [-0.12, 0.13, 0], [0, 0.10, 0], [0, 0.30, 0]]} radius={0.002} />
    <mesh position={[-0.19, 0.27, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.042, 0.042, 0.025, 32]} /><meshStandardMaterial color="#232521" roughness={0.46} /></mesh>
    <mesh geometry={stem} castShadow><meshStandardMaterial color="#232521" roughness={0.45} metalness={0.45} /></mesh>
    <group position={[0.70, 1.365, 0]} rotation={[0, 0, -0.12]}>
      <mesh geometry={shade} castShadow><meshStandardMaterial color="#232521" roughness={0.43} metalness={0.35} side={DoubleSide} /></mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}><circleGeometry args={[0.125, 48]} /><meshStandardMaterial color="#f0e6d7" emissive={color} emissiveIntensity={power * 0.7} side={DoubleSide} /></mesh>
    </group>
    <primitive object={aim} position={[1.10, 0.50, 0.10]} />
    <spotLight name="Mantis reading pool" position={[0.70, 1.36, 0]} target={aim} intensity={power * 2.3}
      color={color} angle={0.85} penumbra={0.85} distance={3} decay={2} castShadow shadow-mapSize={[512, 512]} shadow-bias={-0.0001} />
    <Cable points={[[0, 0.02, 0.06], [0.08, 0.008, 0.1], [0.10, 0.008, 0.35], [-0.20, 0.008, 0.58]]} radius={0.002} />
  </group>;
}
