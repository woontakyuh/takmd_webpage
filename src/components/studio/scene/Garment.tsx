import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Mesh, Vector3 } from 'three';
import type { BufferGeometry } from 'three';
import { RACK_RAIL_HALF_HEIGHT } from './GarmentRack';

const COAT_URL = '/models/garments/physician-coat.glb' as const;
const GI_URL = '/models/garments/control-gi.glb' as const;
const ASSEMBLY_HEIGHT = 0.9;
// Measured inner hook crowns in the original GLBs; their shoulder planes are YZ.
const HOOK_CONTACT = {
  [COAT_URL]: [-0.0137, 0.4852, 0.001],
  [GI_URL]: [-0.0038, 0.486, -0.002],
} as const;
const HOOK_RAIL_LIFT = {
  [COAT_URL]: 0.003961,
  [GI_URL]: 0.006728,
} as const;
const COAT_HOOK_BASE = 0.414;
const COAT_HOOK_TRANSITION = 0.025;
const COAT_HOOK_EXTRA_WIDTH = 0.3;

type GarmentUrl = typeof COAT_URL | typeof GI_URL;

type HangingGarmentProps = {
  readonly url: GarmentUrl;
};

function widenCoatHook(source: BufferGeometry) {
  const geometry = source.clone();
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const normal = new Vector3();
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i);
    if (y <= COAT_HOOK_BASE) continue;
    const transition = Math.min(1, (y - COAT_HOOK_BASE) / COAT_HOOK_TRANSITION);
    const widening = 1 + COAT_HOOK_EXTRA_WIDTH * transition * transition * (3 - 2 * transition);
    const wideningDerivative = COAT_HOOK_EXTRA_WIDTH * 6 * transition * (1 - transition) / COAT_HOOK_TRANSITION;
    const z = positions.getZ(i) - HOOK_CONTACT[COAT_URL][2];
    positions.setZ(i, HOOK_CONTACT[COAT_URL][2] + z * widening);
    const correctedNormalZ = normals.getZ(i) / widening;
    normal.set(normals.getX(i), normals.getY(i) - z * wideningDerivative * correctedNormalZ, correctedNormalZ).normalize();
    normals.setXYZ(i, normal.x, normal.y, normal.z);
  }
  positions.needsUpdate = true;
  normals.needsUpdate = true;
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

function HangingGarment({ url }: HangingGarmentProps) {
  const { scene } = useGLTF(url);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    const ownedGeometries: BufferGeometry[] = [];
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (url === COAT_URL) {
        child.geometry = widenCoatHook(child.geometry);
        ownedGeometries.push(child.geometry);
      }
    });

    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const scale = ASSEMBLY_HEIGHT / Math.max(size.y, 0.000_001);
    const [hookX, hookY, hookZ] = HOOK_CONTACT[url];
    model.position.set(
      -hookX,
      (RACK_RAIL_HALF_HEIGHT + HOOK_RAIL_LIFT[url]) / scale - hookY,
      -hookZ,
    );

    return { model, scale, ownedGeometries };
  }, [scene, url]);
  useEffect(() => () => fitted.ownedGeometries.forEach(geometry => geometry.dispose()), [fitted]);

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
