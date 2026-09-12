import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createBanpoFacadeDetails } from './BanpoFacadeDetails';
import { createBanpoBridges } from './BanpoBridges';
import { applyBanpoGroundMaterials } from './BanpoGroundMaterials';
import { createBanpoVegetation } from './BanpoVegetation';
import { createRiverAtmosphere } from './HanRiverAtmosphere';
import { createHanRiverLandscape } from './HanRiverLandscape';
import { createRiverTraffic } from './HanRiverTraffic';
import urbanBuildings from '../../../../public/models/han-river/urban-fabric.json';
import { createBanpoUrbanFabric } from './BanpoUrbanFabric';
import { applyBanpoFacadeMaterial } from './BanpoFacadeMaterial';
import buildingIdentities from '../../../../public/models/han-river/building-identities.json';
import { createBanpoApartmentComplex } from './BanpoApartmentComplex';
import { createBanpoCaelitus } from './BanpoCaelitus';
import { replaceBanpoBuildingIndices } from './BanpoBuildingReplacement';
import localStreetsData from '../../../../public/models/han-river/local-streets.json';
import { createBanpoLocalStreets } from './BanpoLocalStreets';

const IDENTIFIED_BUILDINGS = buildingIdentities.buildings.flatMap(building => {
  if (building.blockNumber === null || building.floors === null) return [];
  return [{ id: building.id, p: building.p, z: building.z, heightM: building.heightM,
    blockNumber: building.blockNumber, floors: building.floors, complex: building.complex }];
});
const SHINDONGA_BUILDINGS = IDENTIFIED_BUILDINGS.filter(building => building.complex === 'Seobinggo Shindonga');
const CAELITUS_BUILDINGS = IDENTIFIED_BUILDINGS.filter(building => building.complex === 'Raemian Caelitus');
const REPLACED_BUILDINGS = [...SHINDONGA_BUILDINGS, ...CAELITUS_BUILDINGS];
const REPLACED_IDS = new Set(REPLACED_BUILDINGS.map(building => building.id));

function disposeModel(root: THREE.Object3D) {
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  root.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    geometries.add(object.geometry);
    if (object instanceof THREE.InstancedMesh) object.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material);
      for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
  textures.forEach(texture => texture.dispose());
  root.clear();
}

export function createBanpoLandscape() {
  const fallback = createHanRiverLandscape();
  const scene = new THREE.Scene();
  scene.name = 'Banpo geographic pilot';
  const fog = new THREE.Fog(0xc9dce3, 2800, 7200);
  scene.fog = fog;
  const atmosphere = createRiverAtmosphere(scene, fog);
  const water = scene.getObjectByName('Normal-mapped Han River water');
  if (water) { water.scale.x = 5; water.position.x = -2600; }
  const sky = new THREE.HemisphereLight(0xcbe5f0, 0x43554b, 1.2);
  const sun = new THREE.DirectionalLight(0xffeed2, 2.6);
  sun.position.set(1200, 1800, -800);
  scene.add(sky, sun);
  const traffic = createRiverTraffic(scene, {
    start: new THREE.Vector3(65, 19.1, -611),
    end: new THREE.Vector3(-1445, 19.1, -166),
    subtle: false,
  });
  const emissive = new Map<THREE.MeshStandardMaterial, number>();
  const facadeMaterials: ReturnType<typeof applyBanpoFacadeMaterial>[] = [];
  let loaded = false;
  let disposed = false;
  let currentNight = 0;
  let model: THREE.Group | null = null;
  let facadeDetails: ReturnType<typeof createBanpoFacadeDetails> | null = null;
  let groundMaterials: ReturnType<typeof applyBanpoGroundMaterials> | null = null;
  let vegetation: ReturnType<typeof createBanpoVegetation> | null = null;
  let bridges: ReturnType<typeof createBanpoBridges> | null = null;
  let urbanFabric: ReturnType<typeof createBanpoUrbanFabric> | null = null;
  let apartments: ReturnType<typeof createBanpoApartmentComplex> | null = null;
  let caelitus: ReturnType<typeof createBanpoCaelitus> | null = null;
  let localStreets: ReturnType<typeof createBanpoLocalStreets> | null = null;
  let buildingReplacement: ReturnType<typeof replaceBanpoBuildingIndices> | null = null;
  const pilotCameraOffset = new THREE.Vector3(280, 300, -1400);
  const fallbackCameraOffset = new THREE.Vector3(0, 340, 0);

  const setNightMix = (value: number) => {
    currentNight = THREE.MathUtils.clamp(value, 0, 1);
    if (!loaded) fallback.setNightMix(currentNight);
    atmosphere.setNightMix(currentNight);
    traffic.setNightMix(currentNight);
    facadeDetails?.setNightMix(currentNight);
    facadeMaterials.forEach(material => material.setNightMix(currentNight));
    bridges?.setNightMix(currentNight);
    apartments?.setNightMix(currentNight);
    caelitus?.setNightMix(currentNight);
    fog.color.lerpColors(new THREE.Color(0xc9dce3), new THREE.Color(0x081727), currentNight);
    sky.intensity = THREE.MathUtils.lerp(1.2, 0.25, currentNight);
    sun.intensity = THREE.MathUtils.lerp(2.6, 0.035, currentNight);
    emissive.forEach((nightIntensity, material) => {
      material.emissiveIntensity = THREE.MathUtils.lerp(0.025, nightIntensity, currentNight);
    });
  };

  new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).load('/models/han-river/banpo-pilot.glb', gltf => {
    if (disposed) { disposeModel(gltf.scene); return; }
    model = gltf.scene;
    const removed: THREE.Object3D[] = [];
    model.traverse(object => {
      if (object instanceof THREE.Camera || object instanceof THREE.Light || object.name.startsWith('Preview_river_surface')) {
        removed.push(object);
      }
      if (!(object instanceof THREE.Mesh)) return;
      object.castShadow = false;
      object.receiveShadow = false;
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
        if (!(material instanceof THREE.MeshStandardMaterial)) continue;
        material.emissiveIntensity = 0;
        if (material.name.startsWith('North bank facade')) {
          facadeMaterials.push(applyBanpoFacadeMaterial(material));
        } else if (material.name === 'Bridge lights') {
          material.emissive.setRGB(0.99, 0.73, 0.41);
          emissive.set(material, 4);
        } else if (material.name === 'Window lights') {
          material.emissive.setRGB(0.98, 0.67, 0.33);
          emissive.set(material, 1.4);
        }
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) value.anisotropy = 4;
      }
    });
    removed.forEach(object => { object.removeFromParent(); disposeModel(object); });
    model.rotation.y = Math.PI / 2;
    model.name = 'OSM Banpo and Sebitseom model';
    scene.add(model);
    buildingReplacement = replaceBanpoBuildingIndices(model, REPLACED_BUILDINGS.map(building => ({
      p: building.p, z: building.z, h: building.heightM,
    })));
    apartments = createBanpoApartmentComplex(SHINDONGA_BUILDINGS);
    apartments.group.userData.replacedTriangles = buildingReplacement.removedTriangles;
    apartments.group.userData.replacedMeshes = buildingReplacement.modifiedMeshes;
    model.add(apartments.group);
    caelitus = createBanpoCaelitus(CAELITUS_BUILDINGS);
    model.add(caelitus.group);
    urbanFabric = createBanpoUrbanFabric(urbanBuildings.filter(building => !REPLACED_IDS.has(building.id)));
    model.add(urbanFabric.group);
    facadeMaterials.push(applyBanpoFacadeMaterial(urbanFabric.wallMaterial));
    groundMaterials = applyBanpoGroundMaterials(model, atmosphere.bankTexture);
    localStreets = createBanpoLocalStreets(localStreetsData.features);
    model.add(localStreets.group);
    facadeDetails = createBanpoFacadeDetails(REPLACED_IDS);
    model.add(facadeDetails.group);
    vegetation = createBanpoVegetation(model);
    bridges = createBanpoBridges();
    model.add(bridges.group);
    loaded = true;
    fallback.dispose();
    setNightMix(currentNight);
  }, undefined, error => {
    if (!disposed) console.warn('Banpo pilot could not load; retaining the existing river view.', error);
  });

  return {
    get scene() { return loaded ? scene : fallback.scene; },
    get cameraOffset() { return loaded ? pilotCameraOffset : fallbackCameraOffset; },
    setNightMix,
    setTime: (seconds: number) => {
      if (!loaded) fallback.setTime(seconds);
      atmosphere.setTime(seconds);
      traffic.setTime(seconds);
      bridges?.setTime(seconds);
    },
    dispose: () => {
      disposed = true;
      if (!loaded) fallback.dispose();
      vegetation?.dispose();
      bridges?.dispose();
      facadeDetails?.dispose();
      groundMaterials?.dispose();
      localStreets?.dispose();
      urbanFabric?.dispose();
      apartments?.dispose();
      caelitus?.dispose();
      buildingReplacement?.restore();
      if (model) { model.removeFromParent(); disposeModel(model); }
      atmosphere.dispose();
      const waterObject = scene.getObjectByName('Normal-mapped Han River water');
      waterObject?.removeFromParent();
      disposeModel(scene);
    },
  };
}
