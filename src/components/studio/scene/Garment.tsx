import { useGLTF, useTexture } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Box3, Euler, Mesh, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three';
import type { BufferGeometry, Texture } from 'three';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { RACK_RAIL_HALF_HEIGHT } from './GarmentRack';

const COAT_URL = '/models/garments/physician-coat.glb' as const;
const GI_URL = '/models/garments/control-gi.glb?v=20260907-usa-direct' as const;
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
};

function coatSleeveEmblem(garment: Mesh, texture: Texture) {
  // +X is the garment's front, so its wearer's left sleeve is on -Z.
  const surface = new Mesh(garment.geometry, garment.material);
  const geometry = new DecalGeometry(surface, new Vector3(-0.043, 0.15, -0.246),
    new Euler(0.17, Math.PI, 0), new Vector3(0.128, 0.111, 0.12));
  const material = new MeshStandardMaterial({
    map: texture, roughness: 0.96, metalness: 0, transparent: true, alphaTest: 0.05,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
  });
  const emblem = new Mesh(geometry, material);
  emblem.name = 'Davos Hospital emblem · wearer left sleeve';
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

function HangingGarment({ url, emblem }: HangingGarmentProps) {
  const { scene } = useGLTF(url);
  const fitted = useMemo(() => {
    const model = scene.clone(true);
    const ownedGeometries: BufferGeometry[] = [];
    const ownedMaterials: MeshStandardMaterial[] = [];
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
        const patch = coatSleeveEmblem(mesh, emblem);
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
  const source = useTexture('/images/brands/davos-hospital-emblem.png');
  const emblem = useMemo(() => {
    const texture = source.clone();
    texture.colorSpace = SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }, [source]);
  useEffect(() => () => emblem.dispose(), [emblem]);
  return <HangingGarment url={COAT_URL} emblem={emblem} />;
}

export function JiuJitsuGi() {
  return <HangingGarment url={GI_URL} />;
}

useGLTF.preload(COAT_URL);
useGLTF.preload(GI_URL);
