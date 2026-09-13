import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { SRGBColorSpace } from 'three';
import { ADDITIONAL_DOCUMENTS, SNU_MASTERS_ITEM } from './AdditionalHonorsData';
import { FramedCredential } from './CertificateFrames';
import { CollectionInspectionExit, CollectionInspectionItem } from './CollectionInspection';
import { SnuMastersPlaque } from './SnuMastersPlaque';

export function AdditionalHonors() {
  const sources = useTexture(ADDITIONAL_DOCUMENTS.map(document => document.frame.texture));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return <group name="Additional photographed honors">
    {ADDITIONAL_DOCUMENTS.map(({ frame, item }, index) => {
      const texture = textures[index];
      return texture ? <CollectionInspectionItem key={item.id} item={item}>
        <FramedCredential credential={frame} texture={texture} />
      </CollectionInspectionItem> : null;
    })}
    <CollectionInspectionItem item={SNU_MASTERS_ITEM}>
      <group position={[-1.515, 2.4, 3.12]} rotation={[0, Math.PI, 0]}><SnuMastersPlaque /></group>
    </CollectionInspectionItem>
    <CollectionInspectionExit collection="honors" />
    <CollectionInspectionExit collection="certificates" />
  </group>;
}
