import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { RepeatWrapping, SRGBColorSpace, Vector2 } from 'three';
import type { Texture } from 'three';
import { CollectionInspectionExit, CollectionInspectionItem } from './CollectionInspection';
import type { CollectionItem } from './CollectionInspectionData';

const ROOT = '/models/personal-awards/cgbio-2026/';
const COVER = { width: .321, height: .234, depth: .005, fold: .21, black: '#101113' } as const;
const ITEMS = [
  {
    id: 'workshop-certificate-cgbio-photo', collection: 'workshop-certificates',
    label: 'Faculty & participants', title: 'CGBIO Spine Cadaver Workshop',
    date: 'September 12, 2026',
    description: '',
    center: [2.034, 1.819, 3.14], copy: 'bottom',
  },
  {
    id: 'workshop-certificate-cgbio-faculty', collection: 'workshop-certificates',
    label: 'Faculty appreciation · Woon Tak Yuh', title: 'CGBIO Spine Cadaver Workshop',
    date: 'September 12, 2026',
    description: '',
    center: [1.716, 1.819, 3.14], copy: 'bottom',
  },
] as const satisfies readonly CollectionItem[];

export function CgbioCertificate() {
  const sources = useTexture([`${ROOT}group-photo.webp`, `${ROOT}certificate.webp`, `${ROOT}cover.webp`, '/textures/isidoro/leather-normal.webp']);
  const [photo, certificate, back, grain] = useMemo(() => sources.map((source, index) => {
    const texture = source.clone();
    if (index < 3) texture.colorSpace = SRGBColorSpace;
    else {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.repeat.set(2, 1.4);
    }
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => { photo.dispose(); certificate.dispose(); back.dispose(); grain.dispose(); }, [photo, certificate, back, grain]);
  return <>
    <group name="CGBIO standing bifold certificate" position={[1.875, 1.7002, 3.18]} rotation={[0, Math.PI, 0]}>
      <mesh name="CGBIO flexible leather spine" position={[0, COVER.height / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[.012, COVER.height, COVER.depth]} />
        <meshPhysicalMaterial color={COVER.black} roughness={.3} clearcoat={.38} clearcoatRoughness={.24} />
      </mesh>
    </group>
      {ITEMS.map((item, index) => <CollectionInspectionItem item={item} key={item.id}>
        <group position={[1.875, 1.7002, 3.18]} rotation={[0, Math.PI, 0]}>
        <group rotation={[0, index === 0 ? COVER.fold : -COVER.fold, 0]}>
          <Leaf texture={index === 0 ? photo : certificate} back={index === 0 ? back : undefined}
            grain={grain} side={index === 0 ? -1 : 1} name={index === 0 ? 'group photograph' : 'faculty certificate'} />
        </group>
        </group>
      </CollectionInspectionItem>)}
    <CollectionInspectionExit collection="workshop-certificates" />
  </>;
}

function Leaf({ texture, back, grain, side, name }: {
  readonly texture: Texture; readonly back?: Texture; readonly grain: Texture;
  readonly side: -1 | 1; readonly name: string;
}) {
  const normalScale = useMemo(() => new Vector2(.12, .12), []);
  return <group position={[side * (COVER.width / 2 + .003), COVER.height / 2, 0]}>
    <mesh name={`CGBIO ${name} leather cover`} castShadow receiveShadow>
      <boxGeometry args={[COVER.width, COVER.height, COVER.depth]} />
      <meshPhysicalMaterial color={COVER.black} normalMap={grain} normalScale={normalScale}
        roughness={.3} metalness={0} clearcoat={.38} clearcoatRoughness={.24} />
    </mesh>
    <mesh name={`CGBIO ${name} original print`} position={[0, 0, COVER.depth / 2 + .0002]} receiveShadow>
      <planeGeometry args={[COVER.width - .007, (COVER.width - .007) * 210 / 297]} />
      <meshStandardMaterial map={texture} roughness={.78} />
    </mesh>
    {back && <mesh name="CGBIO original gold cover logo" position={[0, 0, -COVER.depth / 2 - .0001]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[COVER.width - .002, COVER.height - .002]} />
      <meshPhysicalMaterial map={back} roughness={.3} clearcoat={.38} clearcoatRoughness={.24} />
    </mesh>}
  </group>;
}
