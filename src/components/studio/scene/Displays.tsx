import { useTexture } from '@react-three/drei';
import { SRGBColorSpace } from 'three';
import { FOLIO_ASSETS } from '../collection';
import type { StudioSceneProps } from '../types';
import { Interactive } from './Interactive';
import { MonitorArm } from './MonitorArm';
import { Block } from './Primitives';
import { useDocumentTexture, useWorkstationTexture } from './CollectionTextures';
import { PALETTE, ROOM } from './config';

type DisplaysProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion' | 'night' | 'presentations' | 'collection'>;

export function Displays({ selected, onSelect, reducedMotion, night, presentations, collection }: DisplaysProps) {
  const monitor = useWorkstationTexture(collection.project);
  const today = new Date().toISOString().slice(0, 10);
  const talk = collection.presentation ?? presentations.filter(item => item.date <= today).toSorted((a, b) => b.date.localeCompare(a.date))[0];
  const board = useDocumentTexture({ image: collection.talkSlide?.src ?? null, title: talk?.topic || talk?.title || 'Talks & teaching', eyebrow: collection.presentation ? `${talk.date} / ${talk.date > today ? 'UPCOMING' : 'TALKS & TEACHING'}` : 'TALKS & TEACHING / FROM THE OFFICE', detail: talk ? `${talk.title} / ${talk.venue}` : 'Select a presentation to explore the work.', dark: true });
  const gallery = useTexture(FOLIO_ASSETS.figure);
  gallery.colorSpace = SRGBColorSpace;
  return (
    <group>
      <Interactive id="ai" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion}
        position={ROOM.monitor.position} rotation={ROOM.monitor.rotation}>
        <MonitorArm />
        <group position={[0, 0.37, 0]} rotation={[-0.04, 0, 0]}>
          <Block size={[1.2, 0.57, 0.035]} radius={0.014} color={PALETTE.ink} roughness={0.3} metalness={0.25} />
          <Block size={[0.3, 0.26, 0.035]} position={[0, 0, -0.025]} color={PALETTE.ink} radius={0.028} />
          <mesh position={[0, 0.004, 0.019]}><planeGeometry args={[1.15, 0.517]} /><meshStandardMaterial map={monitor} emissiveMap={monitor} emissive={PALETTE.white} emissiveIntensity={night ? 0.8 : 0.28} roughness={0.3} /></mesh>
          <mesh position={[0.55, -0.271, 0.02]}><sphereGeometry args={[0.002, 8, 6]} /><meshBasicMaterial color={PALETTE.tealLight} /></mesh>
        </group>
      </Interactive>
      <Interactive id="education" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.gallery.position} rotation={ROOM.gallery.rotation}>
        <Block size={[1.55, 0.96, 0.035]} color={PALETTE.walnutDark} radius={0.015} roughness={0.72} />
        <mesh position={[0, 0, 0.021]}><planeGeometry args={[1.49, 0.88]} /><meshStandardMaterial map={board} roughness={0.91} /></mesh>
        <group position={[-1.01, -0.26, 0.045]} rotation={[0, 0, -0.06]}>
          <Block size={[0.43, 0.58, 0.008]} color={PALETTE.paperLight} radius={0.002} />
          <mesh position={[0, 0, 0.006]}><planeGeometry args={[0.39, 0.54]} /><meshStandardMaterial map={gallery} roughness={0.95} /></mesh>
          <Block size={[0.12, 0.035, 0.018]} position={[0, 0.29, 0.016]} color={PALETTE.steel} radius={0.004} metalness={0.8} />
        </group>
      </Interactive>
    </group>
  );
}
