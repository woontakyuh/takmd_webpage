import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { SRGBColorSpace } from 'three';
import type { Texture } from 'three';
import type { StudioSceneProps } from '../types';
import { PERSONAL_LINKS } from '../personal';
import { ADDITIONAL_DOCUMENTS, SNU_MASTERS_ITEM } from './AdditionalHonorsData';
import { AWARD_ITEMS, CREDENTIAL_ITEMS } from './CollectionInspectionData';
import { CollectionInspectionExit, CollectionInspectionItem } from './CollectionInspection';
import { AwardCeremonyPhoto, CREDENTIALS, FramedCredential } from './CertificateFrames';
import { CgbioCertificate } from './CgbioCertificate';
import { HallymPlaque } from './HallymPlaque';
import { SnuhAward } from './SnuhAward';
import { KomissAward } from './KomissAward';
import { SnuMastersPlaque } from './SnuMastersPlaque';
import { GoldAward } from './GoldAward';

type Props = { readonly wood: Texture; readonly onAwardPhoto: () => void } & Pick<StudioSceneProps, 'selected' | 'reducedMotion'>;
const PRINTS = [...ADDITIONAL_DOCUMENTS.map(document => document.frame), ...CREDENTIALS];

export function AcademicHonors({ wood, onAwardPhoto, selected, reducedMotion }: Props) {
  const sources = useTexture(PRINTS.map(frame => frame.texture));
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.needsUpdate = true;
    return texture;
  }), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  const trophies = [<HallymPlaque />, <SnuhAward />, <KomissAward />];
  return <group name="Academic honors and credentials on both shelves">
    {PRINTS.map((frame, index) => {
      const top = index < 4;
      const x = top ? 1.50 + index * .25 : 1.48 + (index - 4) * .25;
      const y = top ? 2.0 : 1.7;
      const item = top ? ADDITIONAL_DOCUMENTS[index].item : CREDENTIAL_ITEMS[index - 4];
      return <CollectionInspectionItem key={frame.id} item={item}>
        <group position={[x - 3.75, y, 3.12]} scale={top ? .68 : .76}>
          <FramedCredential credential={{ ...frame, position: [0, 0, 0] }} texture={textures[index]} />
        </group>
      </CollectionInspectionItem>;
    })}
    <CollectionInspectionItem item={SNU_MASTERS_ITEM}>
      <group position={[-1.5, 1.7, 3.12]} rotation={[0, Math.PI, 0]} scale={.65}><SnuMastersPlaque wood={wood} /></group>
    </CollectionInspectionItem>
    {trophies.map((trophy, index) => <CollectionInspectionItem key={AWARD_ITEMS[index].id} item={AWARD_ITEMS[index]}>
      <group position={[1.55 + index * .32, 1.7, 3.115]} rotation={[0, Math.PI, 0]} scale={.8}>{trophy}</group>
    </CollectionInspectionItem>)}
    <group position={[1.73 - 3.75 - 1.875 * .75, 0.82 - 1.7002 * .75, 3.18 * .25]} scale={.75}><CgbioCertificate /></group>
    <group position={[2.05 - 2.01 * .72, 1.3 - 1.3025 * .72, 3.12 * .28]} scale={.72}>
      <AwardCeremonyPhoto onOpen={onAwardPhoto} selected={selected} reducedMotion={reducedMotion} />
    </group>
    <group position={[1.65, 1.3, 3.09]} scale={.65}>
      <GoldAward channelUrl={PERSONAL_LINKS.awardShort} rotation={Math.PI} focused={selected === 'award-photo'} reducedMotion={reducedMotion} onSelect={onAwardPhoto} />
    </group>
    {(['awards', 'credentials', 'honors', 'certificates'] as const).map(collection => <CollectionInspectionExit key={collection} collection={collection} />)}
  </group>;
}
