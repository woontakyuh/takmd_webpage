import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';
import { RACK_TUBE_RADIUS } from './GarmentRack';

const COAT_URL = '/models/garments/physician-coat.glb' as const;
const GI_URL = '/models/garments/control-gi.glb' as const;
const ASSEMBLY_HEIGHT = 0.9;
// Measured inner hook crowns in the original GLBs; their shoulder planes are YZ.
const HOOK_CONTACT = {
  [COAT_URL]: [-0.0137, 0.4852, 0.001],
  [GI_URL]: [-0.0038, 0.486, -0.002],
} as const;

type GarmentUrl = typeof COAT_URL | typeof GI_URL;

type HangingGarmentProps = {
  readonly url: GarmentUrl;
};

function HangingGarment({ url }: HangingGarmentProps) {
  const { scene } = useGLTF(url);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
    });

    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const scale = ASSEMBLY_HEIGHT / Math.max(size.y, 0.000_001);
    const [hookX, hookY, hookZ] = HOOK_CONTACT[url];
    model.position.set(
      -hookX,
      RACK_TUBE_RADIUS / scale - hookY,
      -hookZ,
    );

    return { model, scale };
  }, [scene, url]);

  return (
    <group name={url === COAT_URL ? 'Hanging physician coat' : 'Hanging Control gi'} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

export function DoctorCoat() {
  return <HangingGarment url={COAT_URL} />;
}

export function JiuJitsuGi() {
  return <HangingGarment url={GI_URL} />;
}

useGLTF.preload(COAT_URL);
useGLTF.preload(GI_URL);
