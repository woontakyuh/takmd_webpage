import { useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { usePhone } from './Device';
import { Box3, Mesh, MeshStandardMaterial, PlaneGeometry, Raycaster, SRGBColorSpace, Vector3 } from 'three';
import type { BufferGeometry, Material, Texture } from 'three';
import { RACK_RAIL_HALF_HEIGHT } from './GarmentRack';

// The phone derivative changes only texture images, with geometry bytes checked by its build script.
const COAT_URL = '/models/garments/physician-coat-2k.glb?v=20260918-original' as const;
const COAT_URL_PHONE = '/models/garments/physician-coat-phone.glb' as const;
// The gi at about a third of its triangles (gltf-transform simplify, ratio 0.3), for phones.
const GI_URL_PHONE = '/models/garments/control-gi-phone-packed.glb?v=20260925' as const;
const GI_URL = '/models/garments/control-gi.glb?v=20260918-meshopt' as const;
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
  readonly emblem?: Texture;
  // The file to load when it differs from the canonical url (the phone's lighter garment).
  readonly file?: string;
};

function coatPocketEmbroidery(garment: Mesh, texture: Texture) {
  const geometry = new PlaneGeometry(0.105, 0.12, 8, 12);
  const positions = geometry.getAttribute('position');
  const ray = new Raycaster();
  for (let i = 0; i < positions.count; i++) {
    const y = 0.035 + positions.getY(i);
    const z = -0.105 - positions.getX(i);
    ray.set(new Vector3(0.2, y, z), new Vector3(-1, 0, 0));
    const hit = ray.intersectObject(garment)[0];
    positions.setXYZ(i, (hit?.point.x ?? 0.065) + 0.001, y, z);
  }
  geometry.computeVertexNormals();
  const material = new MeshStandardMaterial({
    map: texture, transparent: true, alphaTest: 0.05,
    roughness: 1, metalness: 0, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -2,
  });
  const emblem = new Mesh(geometry, material);
  emblem.name = 'Chamjoeun Hospital pocket embroidery';
  emblem.receiveShadow = true;
  return emblem;
}

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

function HangingGarment({ url, file = url, emblem }: HangingGarmentProps) {
  const { scene } = useGLTF(file);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    const ownedGeometries: BufferGeometry[] = [];
    const ownedMaterials: Material[] = [];
    const coatMeshes: Mesh[] = [];
    model.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      if (url === COAT_URL) {
        child.geometry = widenCoatHook(child.geometry);
        ownedGeometries.push(child.geometry);
        coatMeshes.push(child);
      }
    });

    const bounds = new Box3().setFromObject(model);
    const size = bounds.getSize(new Vector3());
    const scale = ASSEMBLY_HEIGHT / Math.max(size.y, 0.000_001);
    if (emblem) {
      coatMeshes.forEach(mesh => {
        const patch = coatPocketEmbroidery(mesh, emblem);
        mesh.add(patch);
        ownedGeometries.push(patch.geometry);
        ownedMaterials.push(patch.material);
      });
    }
    const [hookX, hookY, hookZ] = HOOK_CONTACT[url];
    model.position.set(
      -hookX,
      (RACK_RAIL_HALF_HEIGHT + HOOK_RAIL_LIFT[url]) / scale - hookY,
      -hookZ,
    );

    return { model, scale, ownedGeometries, ownedMaterials };
  }, [scene, url, emblem]);
  useEffect(() => () => {
    fitted.ownedGeometries.forEach(geometry => geometry.dispose());
    fitted.ownedMaterials.forEach(material => material.dispose());
  }, [fitted]);

  return (
    <group name={url === COAT_URL ? 'Hanging physician coat' : 'Hanging Control gi'} scale={fitted.scale}>
      <primitive object={fitted.model} dispose={null} />
    </group>
  );
}

export function DoctorCoat() {
  const phone = usePhone();
  const source = useTexture('/models/garments/chamjoeun-pocket-embroidery.webp');
  const emblem = useMemo(() => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [source]);
  useEffect(() => () => emblem.dispose(), [emblem]);
  return <HangingGarment url={COAT_URL} file={phone ? COAT_URL_PHONE : COAT_URL} emblem={emblem} />;
}

export function JiuJitsuGi() {
  return <HangingGarment url={GI_URL} file={usePhone() ? GI_URL_PHONE : GI_URL} />;
}
