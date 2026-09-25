import * as THREE from 'three';
import { createRiverAtmosphere } from './HanRiverAtmosphere';
import { createRiverBridge } from './HanRiverTraffic';
export interface HanRiverLandscape { readonly scene: THREE.Scene; readonly setNightMix: (value: number) => void; readonly setTime: (seconds: number) => void; readonly dispose: () => void; }
function seeded(index: number, salt: number): number {
  return Math.abs(Math.sin(index * 91.173 + salt * 47.719) * 43758.5453) % 1;
}

export function createHanRiverLandscape(): HanRiverLandscape {
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xc9d6da, 2000, 4800);
  const background = new THREE.Color(0x9dbbca);
  scene.fog = fog;
  scene.background = background;

  const atmosphere = createRiverAtmosphere(scene, fog);

  const bankMaterial = new THREE.MeshStandardMaterial({ color: 0x75847e, roughness: 1, emissive: 0x10242c, emissiveIntensity: 0 });
  const bank = new THREE.Mesh(new THREE.BoxGeometry(6400, 18, 13000), bankMaterial);
  bank.position.set(-4700, 5, 0);
  scene.add(bank);
  const grass = new THREE.Mesh(new THREE.PlaneGeometry(100, 13000), new THREE.MeshStandardMaterial({ color: 0xadb2a3, map: atmosphere.bankTexture, roughness: 1 }));
  grass.rotation.x = -Math.PI / 2;
  grass.position.set(-1570, 14.02, 0);
  scene.add(grass);
  const embankmentGeometry = new THREE.BufferGeometry();
  embankmentGeometry.setAttribute('position', new THREE.Float32BufferAttribute([
    -1500, 14, -6500, -1450, -1, -6500, -1500, 14, 6500, -1450, -1, 6500,
  ], 3));
  embankmentGeometry.setIndex([0, 2, 1, 2, 3, 1]);
  embankmentGeometry.computeVertexNormals();
  const embankment = new THREE.Mesh(embankmentGeometry, new THREE.MeshStandardMaterial({ color: 0x92978c, roughness: 0.95 }));
  embankment.name = 'Sloping river embankment';
  const riversidePath = new THREE.Mesh(new THREE.PlaneGeometry(8, 13000), new THREE.MeshStandardMaterial({ color: 0xa4a69a, roughness: 0.93 }));
  riversidePath.rotation.x = -Math.PI / 2;
  riversidePath.position.set(-1520, 14.03, 0);
  scene.add(embankment, riversidePath);

  const facadeNightMix = { value: 0 };
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xa9b0b1, roughness: 0.7, metalness: 0.04 });
  buildingMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uFacadeNightMix = facadeNightMix;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFacadeWorld;\nvarying vec3 vFacadeNormal;\nvarying float vFacadeStyle;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvFacadeWorld=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;\nvFacadeNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);\nvFacadeStyle=fract(sin(instanceMatrix[3].x*0.017+instanceMatrix[3].z*0.013)*43758.5453);\n#else\nvFacadeWorld=(modelMatrix*vec4(position,1.0)).xyz;\nvFacadeNormal=normalize(mat3(modelMatrix)*normal);\nvFacadeStyle=0.5;\n#endif');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFacadeNightMix;\nvarying vec3 vFacadeWorld;\nvarying vec3 vFacadeNormal;\nvarying float vFacadeStyle;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 facadePosition=abs(vFacadeNormal.x)>abs(vFacadeNormal.z)?vFacadeWorld.yz:vFacadeWorld.yx;
        vec2 bay=vec2(mix(3.2,4.1,vFacadeStyle),mix(3.5,6.8,vFacadeStyle));
        vec2 facadeCell=fract(facadePosition/bay);
        vec2 facadeAA=fwidth(facadePosition/bay)*1.25;
        vec2 windowShape=1.0-smoothstep(vec2(0.31,0.3)-facadeAA,vec2(0.31,0.3)+facadeAA,abs(facadeCell-0.5));
        float facadeSide=1.0-step(0.5,abs(vFacadeNormal.y));
        float detail=1.0-smoothstep(0.25,0.85,max(facadeAA.x,facadeAA.y));
        float windowMask=facadeSide*mix(0.3,windowShape.x*windowShape.y,detail);
        vec3 glass=mix(vec3(0.045,0.07,0.085),vec3(0.035,0.07,0.11),uFacadeNightMix);
        diffuseColor.rgb=mix(diffuseColor.rgb,glass,windowMask*0.78);
        vec2 lightGrid=facadePosition/vec2(8.0,10.0);
        vec2 lightAA=fwidth(lightGrid);
        vec2 lightShape=1.0-smoothstep(vec2(0.22)-lightAA,vec2(0.22)+lightAA,abs(fract(lightGrid)-0.5));
        float lightResolved=1.0-smoothstep(0.3,0.85,max(lightAA.x,lightAA.y));
        float facadeHash=fract(sin(dot(floor(lightGrid),vec2(12.9898,78.233)))*43758.5453);
        float litWindow=facadeSide*lightShape.x*lightShape.y*step(0.76,facadeHash)*lightResolved*uFacadeNightMix;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(0.18,0.11,0.05)*litWindow;');
  };
  buildingMaterial.customProgramCacheKey = () => 'han-river-facades-v3';
  const buildings = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMaterial, 768);
  const buildingTransforms: { readonly x: number; readonly z: number; readonly width: number; readonly depth: number; readonly height: number }[] = [];
  const matrix = new THREE.Matrix4();
  for (let index = 0; index < 768; index += 1) {
    const row = index % 4;
    const column = Math.floor(index / 4);
    const z = -6450 + column * 67 + (seeded(index, 1) - 0.5) * 24;
    const depth = 24 + seeded(index, 2) * 42;
    const width = 15 + seeded(index, 3) * 30;
    const height = 25 + seeded(index, 4) * 85 + (seeded(index, 10) > 0.96 ? 48 : 0);
    const x = -1640 - row * 118 - seeded(index, 5) * 55;
    buildingTransforms.push({ x, z, width, depth, height });
    matrix.compose(new THREE.Vector3(x, height / 2 + 14, z), new THREE.Quaternion(), new THREE.Vector3(depth, height, width));
    buildings.setMatrixAt(index, matrix);
    buildings.setColorAt(index, new THREE.Color().setHSL(0.53 + seeded(index, 11) * 0.04, 0.05 + seeded(index, 12) * 0.09, 0.57 + seeded(index, 13) * 0.18));
  }
  const roofSteps = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), buildingMaterial, 96);
  for (let index = 0; index < 96; index += 1) {
    const host = buildingTransforms[index * 8];
    if (!host) continue;
    const stepHeight = 7 + seeded(index, 14) * 13;
    matrix.compose(new THREE.Vector3(host.x, host.height + 14 + stepHeight / 2, host.z), new THREE.Quaternion(), new THREE.Vector3(host.depth * 0.68, stepHeight, host.width * 0.72));
    roofSteps.setMatrixAt(index, matrix);
    roofSteps.setColorAt(index, new THREE.Color().setHSL(0.54, 0.06, 0.58 + seeded(index, 15) * 0.12));
  }
  scene.add(buildings, roofSteps);

  const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x769b88, roughness: 1 });
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), foliageMaterial, 384);
  crowns.name = 'Riverside tree clusters';
  for (let index = 0; index < crowns.count; index += 1) {
    const z = -6420 + index * 33.5 + (seeded(index, 17) - 0.5) * 18;
    const x = -1542 - seeded(index, 18) * 60;
    const radius = 3.2 + seeded(index, 19) * 4.8;
    matrix.compose(new THREE.Vector3(x, 16 + radius * 0.68, z),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), seeded(index, 20) * Math.PI),
      new THREE.Vector3(radius, radius * (0.65 + seeded(index, 21) * 0.4), radius * 0.8));
    crowns.setMatrixAt(index, matrix);
    crowns.setColorAt(index, new THREE.Color().setHSL(0.25 + seeded(index, 22) * 0.09, 0.13, 0.44 + seeded(index, 23) * 0.14));
  }
  scene.add(crowns);

  const hillMaterial = new THREE.MeshStandardMaterial({ color: 0x667974, roughness: 1, emissive: 0x10202c, emissiveIntensity: 0 });
  const hills = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 32, 12), hillMaterial, 15);
  for (let index = 0; index < 15; index += 1) {
    const z = -6900 + index * 980;
    const height = 70 + seeded(index, 9) * 85;
    matrix.compose(new THREE.Vector3(-4700, -28, z), new THREE.Quaternion(), new THREE.Vector3(920, height, 760));
    hills.setMatrixAt(index, matrix);
  }
  scene.add(hills);

  const towerMaterial = new THREE.MeshStandardMaterial({ color: 0xbfc5c3, emissive: 0xffb36b, emissiveIntensity: 0 });
  let towerBase = 14;
  for (let index = 0; index < 15; index += 1) {
    const z = -6900 + index * 980;
    const profile = 1 - (150 / 920) ** 2 - ((2600 - z) / 760) ** 2;
    if (profile > 0) towerBase = Math.max(towerBase, -28 + (70 + seeded(index, 9) * 85) * Math.sqrt(profile));
  }
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(3.5, 9, 170, 16), towerMaterial);
  tower.position.set(-4550, towerBase + 85, 2600);
  const observatory = new THREE.Mesh(new THREE.CylinderGeometry(18, 15, 13, 24), towerMaterial);
  observatory.position.set(-4550, towerBase + 150, 2600);
  const antenna = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.8, 35, 8), towerMaterial);
  antenna.position.set(-4550, towerBase + 187.5, 2600);
  scene.add(tower, observatory, antenna);

  const bridgeSpans = [
    { start: new THREE.Vector3(-90, 28, -500), end: new THREE.Vector3(-1500, 28, 1650), subtle: false },
    { start: new THREE.Vector3(-250, 23, 3150), end: new THREE.Vector3(-1510, 23, 4300), subtle: true },
  ];
  const bridges = bridgeSpans.map(span => createRiverBridge(scene, span));
  const ambient = new THREE.HemisphereLight(0xc9e5f2, 0x52605f, 2.1);
  const sun = new THREE.DirectionalLight(0xfff1d4, 2.3);
  sun.position.set(900, 1400, -1100);
  scene.add(ambient, sun);

  const setNightMix = (value: number): void => {
    const mix = THREE.MathUtils.clamp(value, 0, 1);
    background.setRGB(THREE.MathUtils.lerp(0.34, 0.025, mix), THREE.MathUtils.lerp(0.53, 0.055, mix), THREE.MathUtils.lerp(0.64, 0.11, mix));
    fog.color.setRGB(THREE.MathUtils.lerp(0.79, 0.035, mix), THREE.MathUtils.lerp(0.84, 0.06, mix), THREE.MathUtils.lerp(0.85, 0.10, mix));
    atmosphere.setNightMix(mix);
    bridges.forEach(bridge => bridge.setNightMix(mix));
    buildingMaterial.color.lerpColors(new THREE.Color(0xa9b0b1), new THREE.Color(0x26313a), mix);
    buildingMaterial.emissive.set(0x10202b);
    buildingMaterial.emissiveIntensity = mix * 0.38;
    hillMaterial.color.lerpColors(new THREE.Color(0x667974), new THREE.Color(0x111b25), mix);
    hillMaterial.emissiveIntensity = mix * 0.48;
    bankMaterial.emissiveIntensity = mix * 0.35;
    facadeNightMix.value = mix;
    towerMaterial.emissiveIntensity = mix * 0.6;
    bridges[0].lights.color.setRGB(THREE.MathUtils.lerp(0.22, 5.5, mix), THREE.MathUtils.lerp(0.13, 2.8, mix), THREE.MathUtils.lerp(0.06, 0.8, mix));
    bridges[1].lights.color.setRGB(THREE.MathUtils.lerp(0.18, 3.2, mix), THREE.MathUtils.lerp(0.11, 1.7, mix), THREE.MathUtils.lerp(0.05, 0.55, mix));
    ambient.intensity = THREE.MathUtils.lerp(2.1, 0.38, mix);
    sun.intensity = THREE.MathUtils.lerp(2.3, 0.08, mix);
  };

  return {
    scene,
    setNightMix,
    setTime: (seconds: number): void => {
      atmosphere.setTime(seconds);
      bridges.forEach(bridge => bridge.setTime(seconds));
    },
    dispose: (): void => {
      atmosphere.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        if (object instanceof THREE.InstancedMesh) object.dispose();
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (material !== atmosphere.waterMaterial) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      scene.clear();
    },
  };
}
