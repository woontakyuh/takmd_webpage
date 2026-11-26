import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BackSide, ExtrudeGeometry, Path, Shape, NoColorSpace, SRGBColorSpace } from 'three';
import type { Texture } from 'three';
import { Block, Rod } from './Primitives';
import { AwardPrintSurface } from './AwardPrintSurface';

const PLAQUE = { width: .216, height: .294, depth: .025, lean: -.17 } as const;

function routedBack() {
  const shape = new Shape();
  shape.moveTo(-.108, 0); shape.lineTo(.108, 0); shape.lineTo(.108, .294); shape.lineTo(-.108, .294); shape.closePath();
  const slot = new Path();
  slot.absarc(-.034, .08, .006, Math.PI, 0, true);
  slot.lineTo(-.028, .207); slot.absarc(-.034, .207, .006, 0, Math.PI, true); slot.closePath();
  shape.holes.push(slot);
  const geometry = new ExtrudeGeometry(shape, { depth: .003, bevelEnabled: false, curveSegments: 12 });
  const positions = geometry.getAttribute('position'), uv = geometry.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, .5 - positions.getX(i) / PLAQUE.width, positions.getY(i) / PLAQUE.height);
  return geometry;
}

export function SnuMastersPlaque({ wood }: { wood: Texture }) {
  const [source, inkSource] = useTexture(['/models/personal-awards/additions/snu-masters-metal-surface.webp?v=20260913', '/models/personal-awards/additions/snu-masters-metal-ink.png?v=20260913']);
  const texture = useMemo(() => {
    const copy = source.clone(); copy.colorSpace = SRGBColorSpace; copy.anisotropy = 8; copy.needsUpdate = true; return copy;
  }, [source]);
  const inkMap = useMemo(() => { const copy = inkSource.clone(); copy.colorSpace = NoColorSpace; copy.anisotropy = 8; copy.needsUpdate = true; return copy; }, [inkSource]);
  const grain = useMemo(() => { const copy = wood.clone(); copy.center.set(.5,.5); copy.rotation = Math.PI / 2; copy.needsUpdate = true; return copy; }, [wood]);
  const rear = useMemo(routedBack, []);
  useEffect(() => () => { rear.dispose(); texture.dispose(); inkMap.dispose(); grain.dispose(); }, [rear, texture, inkMap, grain]);
  return <group name="SNU master's commemorative wood plaque">
    <group position={[0, .0025, 0]} rotation={[PLAQUE.lean, 0, 0]}>
      <Block size={[PLAQUE.width, PLAQUE.height, .019]} position={[0, PLAQUE.height / 2, .003]} radius={.0015} color="#40271c" texture={grain} roughness={.48} />
      <mesh name="SNU plaque routed wooden reverse" geometry={rear} position={[0, 0, -.0125]} castShadow receiveShadow>
        <meshStandardMaterial map={grain} color="#87472b" roughness={.53} />
      </mesh>
      <mesh position={[-.034, .1435, -.008]}>
        <planeGeometry args={[.013, .14]} /><meshStandardMaterial color="#8e502a" roughness={.85} side={BackSide} />
      </mesh>
      <Block size={[.203, .281, .010]} position={[0, .147, .011]} radius={.0045} color="#38241c" roughness={.42} />
      <Block size={[.187, .265, .004]} position={[0, .147, .017]} radius={.001} color="#87472b" roughness={.42} />
      <AwardPrintSurface id="snu-masters-plaque-2018" texture={texture} inkMap={inkMap} width={.181} height={.257} position={[0, .147, .0192]} />
    </group>
    <Rod from={[0, .056, -.018]} to={[0, .004, -.115]} radius={.0035} color="#b4b3aa" metalness={.86} />
    <Rod from={[0, .033, -.061]} to={[0, .0315, -.064]} radius={.0039} color="#24251f" />
    <mesh name="SNU silver prop longitudinal flutes" position={[0, .03, -.0665]} rotation={[1.078, 0, 0]}>
      <cylinderGeometry args={[.0037, .0037, .108, 32, 1]} />
      <meshStandardMaterial color="#c4c3b9" roughness={.38} metalness={.8} flatShading />
    </mesh>
  </group>;
}
