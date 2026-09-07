import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';

const COAT_URL = '/models/garments/physician-coat.glb' as const;
const GI_URL = '/models/garments/control-gi.glb' as const;
const HANGER_TOP = 0.079;
const ASSEMBLY_HEIGHT = 0.9;
const FRONT_FACING_YAW = -Math.PI / 2;

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
    const center = bounds.getCenter(new Vector3());
    const scale = ASSEMBLY_HEIGHT / Math.max(size.y, 0.000_001);

    model.position.set(
      -center.x,
      HANGER_TOP / scale - bounds.max.y,
      -center.z,
    );

    return { model, scale };
  }, [scene]);

  return (
    <group rotation={[0, FRONT_FACING_YAW, 0]} scale={fitted.scale}>
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
