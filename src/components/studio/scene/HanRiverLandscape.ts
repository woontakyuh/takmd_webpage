import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
export interface HanRiverLandscape { readonly scene: THREE.Scene; readonly setNightMix: (value: number) => void; readonly setTime: (seconds: number) => void; readonly dispose: () => void; }
const WATER_SHADER = {
  name: 'HanRiverWater',
  uniforms: {
    color: { value: new THREE.Color(0x315d72) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    uTime: { value: 0 },
    uNightMix: { value: 0 },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vReflectUv;
    varying vec3 vWorldPosition;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorldPosition = world.xyz;
      vReflectUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uNightMix;
    varying vec4 vReflectUv;
    varying vec3 vWorldPosition;
    void main() {
      vec2 flow = vWorldPosition.xz;
      float waveA = sin(dot(flow, vec2(0.041, 0.017)) + uTime * 0.19);
      float waveB = sin(dot(flow, vec2(-0.026, 0.053)) - uTime * 0.14);
      float waveC = sin(dot(flow, vec2(0.087, -0.069)) + uTime * 0.09);
      vec2 distortion = vec2(waveA + waveC * 0.38, waveB - waveC * 0.31) * 0.00075;
      vec4 reflected = texture2DProj(tDiffuse, vReflectUv + vec4(distortion * vReflectUv.w, 0.0, 0.0));
      vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
      float fresnel = pow(1.0 - max(dot(viewDirection, vec3(0.0, 1.0, 0.0)), 0.0), 2.6);
      vec3 base = mix(color * 0.72, color, fresnel);
      float reflectionStrength = mix(0.16, 0.3, uNightMix) + fresnel * 0.08;
      vec3 result = mix(base, reflected.rgb, reflectionStrength);
      result += vec3(0.001, 0.00135, 0.0017) * (waveA * 0.45 + waveB * 0.35 + waveC * 0.2);
      gl_FragColor = vec4(result, 1.0);
    }
  `,
} as const;
const SKY_SHADER = {
  uniforms: {
    uTop: { value: new THREE.Color(0x8fb4cc) },
    uHorizon: { value: new THREE.Color(0xdbe1df) },
  },
  vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
  fragmentShader: 'uniform vec3 uTop;uniform vec3 uHorizon;varying vec2 vUv;void main(){float h=smoothstep(0.0,0.82,vUv.y);gl_FragColor=vec4(mix(uHorizon,uTop,h),1.0);}',
} as const;
function seeded(index: number, salt: number): number {
  return Math.abs(Math.sin(index * 91.173 + salt * 47.719) * 43758.5453) % 1;
}
function placeBridge(scene: THREE.Scene, start: THREE.Vector3, end: THREE.Vector3, subtle: boolean): THREE.MeshBasicMaterial {
  const delta = end.clone().sub(start);
  const length = delta.length();
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const yaw = Math.atan2(delta.x, delta.z);
  const concrete = new THREE.MeshStandardMaterial({ color: subtle ? 0x879198 : 0xaeb7bb, roughness: 0.82 });
  const rail = new THREE.MeshStandardMaterial({ color: 0xc2c7c5, roughness: 0.58 });
  const warm = new THREE.MeshBasicMaterial({ color: 0xffc878, toneMapped: true });
  const deckWidth = subtle ? 16 : 22;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, subtle ? 3.2 : 4, length), concrete);
  deck.position.copy(midpoint);
  deck.rotation.y = yaw;
  scene.add(deck);
  for (const side of [-1, 1]) {
    const lateral = deckWidth / 2 - 0.35;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.1, length), rail);
    beam.position.copy(midpoint).add(new THREE.Vector3(Math.cos(yaw) * side * lateral, 2.7, -Math.sin(yaw) * side * lateral));
    beam.rotation.y = yaw;
    scene.add(beam);
  }
  const count = Math.max(3, Math.floor(length / (subtle ? 180 : 125)));
  const pierGeometry = new THREE.BoxGeometry(subtle ? 6 : 8, 1, subtle ? 4 : 5);
  const poleGeometry = new THREE.CylinderGeometry(subtle ? 0.16 : 0.24, subtle ? 0.16 : 0.24, subtle ? 4 : 6, 5);
  const lampGeometry = new THREE.SphereGeometry(subtle ? 0.28 : 0.42, 6, 4);
  const piers = new THREE.InstancedMesh(pierGeometry, concrete, count);
  const poles = new THREE.InstancedMesh(poleGeometry, rail, count * 2);
  const lamps = new THREE.InstancedMesh(lampGeometry, warm, count * 2);
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  for (let index = 0; index < count; index += 1) {
    const fraction = (index + 0.5) / count;
    const point = start.clone().lerp(end, fraction);
    const pierHeight = point.y - (subtle ? 1.6 : 2);
    matrix.compose(new THREE.Vector3(point.x, pierHeight / 2, point.z), rotation, new THREE.Vector3(1, pierHeight, 1));
    piers.setMatrixAt(index, matrix);
    for (const side of [-1, 1]) {
      const lateral = deckWidth / 2 - 0.6;
      const lampIndex = index * 2 + (side + 1) / 2;
      const lampX = point.x + Math.cos(yaw) * side * lateral;
      const lampZ = point.z - Math.sin(yaw) * side * lateral;
      matrix.makeTranslation(lampX, point.y + (subtle ? 2 : 3), lampZ);
      poles.setMatrixAt(lampIndex, matrix);
      matrix.makeTranslation(lampX, point.y + (subtle ? 4 : 6), lampZ);
      lamps.setMatrixAt(lampIndex, matrix);
    }
  }
  scene.add(piers, poles, lamps);
  return warm;
}

export function createHanRiverLandscape(): HanRiverLandscape {
  const scene = new THREE.Scene();
  const fog = new THREE.Fog(0xc9d6da, 2600, 8200);
  const background = new THREE.Color(0x9dbbca);
  scene.fog = fog;
  scene.background = background;

  const sky = new THREE.ShaderMaterial({ ...SKY_SHADER, side: THREE.DoubleSide, depthWrite: false, fog: false });
  const skyPlane = new THREE.Mesh(new THREE.PlaneGeometry(15000, 4200), sky);
  skyPlane.position.set(-7000, 1250, 0);
  skyPlane.rotation.y = Math.PI / 2;
  scene.add(skyPlane);

  const waterGeometry = new THREE.PlaneGeometry(1700, 13000, 1, 1);
  const water = new Reflector(waterGeometry, { textureWidth: 1024, textureHeight: 1024, clipBias: 0.002, multisample: 0, shader: WATER_SHADER });
  if (!(water.material instanceof THREE.ShaderMaterial)) throw new TypeError('Reflector must create one shader material');
  const waterMaterial = water.material;
  water.position.set(-760, 0, 0);
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const bankMaterial = new THREE.MeshStandardMaterial({ color: 0x75847e, roughness: 1, emissive: 0x10242c, emissiveIntensity: 0 });
  const bank = new THREE.Mesh(new THREE.BoxGeometry(6400, 18, 13000), bankMaterial);
  bank.position.set(-4700, 5, 0);
  scene.add(bank);

  const facadeNightMix = { value: 0 };
  const buildingMaterial = new THREE.MeshStandardMaterial({ color: 0xa9b0b1, roughness: 0.7, metalness: 0.04 });
  buildingMaterial.onBeforeCompile = (shader) => {
    shader.uniforms.uFacadeNightMix = facadeNightMix;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vFacadeWorld;\nvarying vec3 vFacadeNormal;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n#ifdef USE_INSTANCING\nvFacadeWorld=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz;\nvFacadeNormal=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);\n#else\nvFacadeWorld=(modelMatrix*vec4(position,1.0)).xyz;\nvFacadeNormal=normalize(mat3(modelMatrix)*normal);\n#endif');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uFacadeNightMix;\nvarying vec3 vFacadeWorld;\nvarying vec3 vFacadeNormal;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 facadePosition=abs(vFacadeNormal.x)>abs(vFacadeNormal.z)?vFacadeWorld.yz:vFacadeWorld.yx;
        vec2 facadeCell=fract(facadePosition/vec2(3.6,4.2));
        vec2 facadeAA=fwidth(facadePosition/vec2(3.6,4.2))*1.25;
        vec2 windowShape=1.0-smoothstep(vec2(0.31,0.3)-facadeAA,vec2(0.31,0.3)+facadeAA,abs(facadeCell-0.5));
        float facadeSide=1.0-step(0.5,abs(vFacadeNormal.y));
        float detail=1.0-smoothstep(0.25,0.85,max(facadeAA.x,facadeAA.y));
        float windowMask=facadeSide*mix(0.37,windowShape.x*windowShape.y,detail);
        vec3 glass=mix(vec3(0.045,0.07,0.085),vec3(0.035,0.07,0.11),uFacadeNightMix);
        diffuseColor.rgb=mix(diffuseColor.rgb,glass,windowMask*0.78);
        float facadeHash=fract(sin(dot(floor(facadePosition/vec2(3.6,4.2)),vec2(12.9898,78.233)))*43758.5453);
        float litWindow=windowMask*mix(0.32,step(0.68,facadeHash),detail)*uFacadeNightMix;`)
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\ntotalEmissiveRadiance+=vec3(0.85,0.53,0.25)*litWindow;');
  };
  buildingMaterial.customProgramCacheKey = () => 'han-river-facades-v1';
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

  const bridgeLights = [
    placeBridge(scene, new THREE.Vector3(-90, 28, -500), new THREE.Vector3(-1500, 28, 1650), false),
    placeBridge(scene, new THREE.Vector3(-250, 23, 3150), new THREE.Vector3(-1510, 23, 4300), true),
  ];
  const ambient = new THREE.HemisphereLight(0xc9e5f2, 0x52605f, 2.1);
  const sun = new THREE.DirectionalLight(0xfff1d4, 2.3);
  sun.position.set(900, 1400, -1100);
  scene.add(ambient, sun);

  const setNightMix = (value: number): void => {
    const mix = THREE.MathUtils.clamp(value, 0, 1);
    background.setRGB(THREE.MathUtils.lerp(0.34, 0.025, mix), THREE.MathUtils.lerp(0.53, 0.055, mix), THREE.MathUtils.lerp(0.64, 0.11, mix));
    fog.color.setRGB(THREE.MathUtils.lerp(0.79, 0.035, mix), THREE.MathUtils.lerp(0.84, 0.06, mix), THREE.MathUtils.lerp(0.85, 0.10, mix));
    sky.uniforms.uTop.value.lerpColors(new THREE.Color(0x8fb4cc), new THREE.Color(0x07162c), mix);
    sky.uniforms.uHorizon.value.lerpColors(new THREE.Color(0xdbe1df), new THREE.Color(0x28324a), mix);
    waterMaterial.uniforms.color.value.lerpColors(new THREE.Color(0x315d72), new THREE.Color(0x102c3d), mix);
    waterMaterial.uniforms.uNightMix.value = mix;
    buildingMaterial.color.lerpColors(new THREE.Color(0xa9b0b1), new THREE.Color(0x26313a), mix);
    buildingMaterial.emissive.set(0x10202b);
    buildingMaterial.emissiveIntensity = mix * 0.38;
    hillMaterial.color.lerpColors(new THREE.Color(0x667974), new THREE.Color(0x111b25), mix);
    hillMaterial.emissiveIntensity = mix * 0.48;
    bankMaterial.emissiveIntensity = mix * 0.35;
    facadeNightMix.value = mix;
    towerMaterial.emissiveIntensity = mix * 0.6;
    bridgeLights[0].color.setRGB(THREE.MathUtils.lerp(0.22, 5.5, mix), THREE.MathUtils.lerp(0.13, 2.8, mix), THREE.MathUtils.lerp(0.06, 0.8, mix));
    bridgeLights[1].color.setRGB(THREE.MathUtils.lerp(0.18, 3.2, mix), THREE.MathUtils.lerp(0.11, 1.7, mix), THREE.MathUtils.lerp(0.05, 0.55, mix));
    ambient.intensity = THREE.MathUtils.lerp(2.1, 0.38, mix);
    sun.intensity = THREE.MathUtils.lerp(2.3, 0.08, mix);
  };

  return {
    scene,
    setNightMix,
    setTime: (seconds: number): void => { waterMaterial.uniforms.uTime.value = seconds; },
    dispose: (): void => {
      water.dispose();
      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse(object => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (material !== waterMaterial) materials.add(material);
        }
      });
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      scene.clear();
    },
  };
}
