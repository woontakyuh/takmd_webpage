import { useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { BackSide, ExtrudeGeometry, Path, Shape, SRGBColorSpace } from 'three';
import { Block, Rod } from './Primitives';

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

export function SnuMastersPlaque() {
  const sources = useTexture(['/models/personal-awards/additions/snu-masters-plaque-2018.webp', '/models/personal-awards/additions/snu-plaque-wood.webp']);
  const textures = useMemo(() => sources.map(source => {
    const texture = source.clone(); texture.colorSpace = SRGBColorSpace; texture.anisotropy = 8; texture.needsUpdate = true; return texture;
  }), [sources]);
  const rear = useMemo(routedBack, []);
  useEffect(() => () => { rear.dispose(); textures.forEach(texture => texture.dispose()); }, [rear, textures]);
  return <group name="SNU master's commemorative wood plaque">
    <group position={[0, .0025, 0]} rotation={[PLAQUE.lean, 0, 0]}>
      <Block size={[PLAQUE.width, PLAQUE.height, .019]} position={[0, PLAQUE.height / 2, .003]} radius={.0015} color="#40271c" texture={textures[1]} roughness={.48} />
      <mesh name="SNU plaque routed wooden reverse" geometry={rear} position={[0, 0, -.0125]} castShadow receiveShadow>
        <meshStandardMaterial map={textures[1]} color="#ffffff" roughness={.53} />
      </mesh>
      <mesh position={[-.034, .1435, -.008]}>
        <planeGeometry args={[.013, .14]} /><meshStandardMaterial color="#8e502a" roughness={.85} side={BackSide} />
      </mesh>
      <Block size={[.203, .281, .010]} position={[0, .147, .011]} radius={.0045} color="#38241c" roughness={.42} />
      <Block size={[.187, .265, .004]} position={[0, .147, .017]} radius={.001} color="#87472b" roughness={.42} />
      <mesh name="SNU plaque original brushed metal artwork" position={[0, .147, .0192]}>
        <planeGeometry args={[.181, .257]} />
        <meshStandardMaterial map={textures[0]} color="#ffffff" roughness={.44} metalness={.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
    </group>
    <Rod from={[0, .056, -.018]} to={[0, .004, -.115]} radius={.0035} color="#b4b3aa" metalness={.86} />
    <Rod from={[0, .033, -.061]} to={[0, .0315, -.064]} radius={.0039} color="#24251f" />
    <mesh name="SNU silver prop longitudinal flutes" position={[0, .03, -.0665]} rotation={[1.078, 0, 0]}>
      <cylinderGeometry args={[.0037, .0037, .108, 32, 1]} />
      <meshStandardMaterial color="#c4c3b9" roughness={.38} metalness={.8} flatShading />
    </mesh>
  </group>;
}
