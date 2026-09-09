import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { ExtrudeGeometry, SRGBColorSpace, Shape } from 'three';
import type { Texture } from 'three';

const FRAME = {
  face: 0.008,
  depth: 0.018,
  paperInset: 0.004,
  leanRadians: 0.15,
  rearFootDepth: 0.076,
} as const;

const A4 = { short: .210, long: .297 } as const;
const FRAME_MARGIN = (FRAME.face + FRAME.paperInset) * 2;
const CREDENTIAL_SHELF_TOP = 1.82;

const CREDENTIALS = [
  {
    id: 'ksns-permanent-membership-2022',
    name: 'KSNS permanent member certificate',
    texture: '/models/personal-certificates/ksns-permanent-membership-2022.webp',
    width: A4.short + FRAME_MARGIN,
    height: A4.long + FRAME_MARGIN,
    position: [2.225, CREDENTIAL_SHELF_TOP, 3.12],
    paperSize: [A4.short, A4.long],
  },
  {
    id: 'snu-master-of-science-in-medicine-2018',
    name: 'SNU medicine diploma',
    texture: '/models/personal-certificates/snu-master-of-science-in-medicine-2018.webp',
    width: A4.short + FRAME_MARGIN,
    height: A4.long + FRAME_MARGIN,
    position: [1.935, CREDENTIAL_SHELF_TOP, 3.12],
    paperSize: [A4.short, A4.long],
  },
  {
    id: 'komiss-life-membership-2023',
    name: 'KOMISS lifetime certificate',
    texture: '/models/personal-certificates/komiss-life-membership-2023.webp',
    width: A4.long + FRAME_MARGIN,
    height: A4.short + FRAME_MARGIN,
    position: [1.5925, CREDENTIAL_SHELF_TOP, 3.12],
    paperSize: [A4.long, A4.short],
  },
] as const;

const AWARD_PHOTO = {
  id: 'kosess-award-ceremony', name: 'KOSESS award ceremony photograph',
  texture: '/models/award-photo/kosess-ceremony.webp',
  width: .27 + FRAME_MARGIN, height: .27 * 2633 / 3395 + FRAME_MARGIN,
  position: [2.185, 1.3025, 3.12], paperSize: [.27, .27 * 2633 / 3395],
} as const;

type CredentialSpec = (typeof CREDENTIALS)[number] | typeof AWARD_PHOTO;

type FramedCredentialProps = {
  readonly credential: CredentialSpec;
  readonly texture: Texture;
};

function frameGeometry(width: number, height: number) {
  const outer = new Shape();
  outer.moveTo(-width / 2, -height / 2);
  outer.lineTo(width / 2, -height / 2);
  outer.lineTo(width / 2, height / 2);
  outer.lineTo(-width / 2, height / 2);
  outer.closePath();
  const openingWidth = width - FRAME.face * 2;
  const openingHeight = height - FRAME.face * 2;
  const opening = new Shape();
  opening.moveTo(-openingWidth / 2, -openingHeight / 2);
  opening.lineTo(openingWidth / 2, -openingHeight / 2);
  opening.lineTo(openingWidth / 2, openingHeight / 2);
  opening.lineTo(-openingWidth / 2, openingHeight / 2);
  opening.closePath();
  outer.holes.push(opening);
  const geometry = new ExtrudeGeometry(outer, {
    depth: FRAME.depth,
    bevelEnabled: true,
    bevelThickness: 0.0018,
    bevelSize: 0.0018,
    bevelSegments: 2,
  });
  geometry.translate(0, 0, -FRAME.depth / 2);
  return geometry;
}

function preparedTexture(source: Texture) {
  const texture = source.clone();
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 8;
  texture.needsUpdate = true;
  return texture;
}

export function FramedCredential({ credential, texture }: FramedCredentialProps) {
  const geometry = useMemo(() => frameGeometry(credential.width, credential.height), [credential.height, credential.width]);
  const [paperWidth, paperHeight] = credential.paperSize;
  const groundOffset = 0.0018 * Math.cos(FRAME.leanRadians)
    + (FRAME.depth / 2 + 0.0018) * Math.sin(FRAME.leanRadians);
  const hingeHeight = credential.height * 0.62;
  const hingeY = groundOffset + hingeHeight * Math.cos(FRAME.leanRadians) - 0.01 * Math.sin(FRAME.leanRadians);
  const hingeZ = -hingeHeight * Math.sin(FRAME.leanRadians) - 0.01 * Math.cos(FRAME.leanRadians);
  const propY = hingeY - 0.004;
  const propZ = hingeZ + FRAME.rearFootDepth;
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group name={credential.name} position={[...credential.position]} rotation={[0, Math.PI, 0]}>
    <group position={[0, groundOffset, 0]} rotation={[-FRAME.leanRadians, 0, 0]}>
    <mesh name={`${credential.id}-fiberboard-backing`} position={[0, credential.height / 2, -0.006]} castShadow receiveShadow>
      <boxGeometry args={[credential.width - 0.014, credential.height - 0.014, 0.008]} />
      <meshStandardMaterial color="#292922" roughness={0.96} />
    </mesh>
    <mesh name={`${credential.id}-rear-prop-hinge`} position={[0, hingeHeight, -0.011]} castShadow>
      <boxGeometry args={[credential.width * 0.25, 0.014, 0.004]} />
      <meshStandardMaterial color="#32332f" metalness={0.45} roughness={0.5} />
    </mesh>
    <mesh name={`${credential.id}-satin-aluminium-frame`} geometry={geometry} position={[0, credential.height / 2, 0]} castShadow receiveShadow>
      <meshPhysicalMaterial color="#B9B8B0" metalness={0.82} roughness={0.48} clearcoat={0}
        envMapIntensity={0.45} />
    </mesh>
    <mesh name={`${credential.id}-warm-white-mat`} position={[0, credential.height / 2, FRAME.depth / 2 + 0.0002]} receiveShadow>
      <planeGeometry args={[credential.width - FRAME.face * 2, credential.height - FRAME.face * 2]} />
      <meshStandardMaterial color="#e5dfd1" roughness={0.88} />
    </mesh>
    <mesh name={`${credential.id}-document-paper`} position={[0, credential.height / 2, FRAME.depth / 2 + 0.00045]} receiveShadow>
      <planeGeometry args={[paperWidth, paperHeight]} />
      <meshStandardMaterial map={texture} color="#ffffff" roughness={0.76} />
    </mesh>
    <mesh name={`${credential.id}-physical-glazing`} position={[0, credential.height / 2, FRAME.depth / 2 + 0.00082]}>
      <planeGeometry args={[credential.width - FRAME.face * 2 - 0.0008, credential.height - FRAME.face * 2 - 0.0008]} />
      <meshPhysicalMaterial color="#edf3ef" transparent opacity={0.055} roughness={0.14} metalness={0}
        transmission={0.06} thickness={0.0015} ior={1.5} depthWrite={false} />
    </mesh>
    </group>
    <mesh name={`${credential.id}-folding-fiberboard-prop`}
      position={[0, (hingeY + 0.004) / 2, (hingeZ - FRAME.rearFootDepth) / 2]}
      rotation={[Math.atan2(propZ, propY), 0, 0]} castShadow receiveShadow>
      <boxGeometry args={[credential.width * 0.22, Math.hypot(propY, propZ), 0.004]} />
      <meshStandardMaterial color="#292922" roughness={0.96} />
    </mesh>
    <mesh name={`${credential.id}-rear-felt-contact`} position={[0, 0.002, -FRAME.rearFootDepth]} castShadow receiveShadow>
      <boxGeometry args={[credential.width * 0.68, 0.004, 0.012]} />
      <meshStandardMaterial color="#181916" roughness={0.96} />
    </mesh>
  </group>;
}

export function CertificateFrames() {
  const sources = useTexture(CREDENTIALS.map(credential => credential.texture));
  const textures = useMemo(() => sources.map(preparedTexture), [sources]);
  useEffect(() => () => textures.forEach(texture => texture.dispose()), [textures]);
  return <group name="Framed academic credentials" position={[0, 0, 0]}>
    {CREDENTIALS.map((credential, index) => {
      const texture = textures[index];
      return texture ? <FramedCredential key={credential.id} credential={credential} texture={texture} /> : null;
    })}
  </group>;
}

export function AwardCeremonyPhoto() {
  const source = useTexture(AWARD_PHOTO.texture);
  const texture = useMemo(() => preparedTexture(source), [source]);
  useEffect(() => () => texture.dispose(), [texture]);
  return <FramedCredential credential={AWARD_PHOTO} texture={texture} />;
}
