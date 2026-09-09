import * as THREE from 'three';
import geography from '../../../../public/models/han-river/geography.json';

const EXTENT = { west: -3500, south: -200, width: 7000, depth: 6700 };

function urbanCoverage() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1024;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#000'; context.fillRect(0, 0, 1024, 1024);
  context.fillStyle = context.strokeStyle = '#fff';
  const point = ([east, north]: readonly number[]) => [
    (east - EXTENT.west) / EXTENT.width * 1024,
    (1 - (north - EXTENT.south) / EXTENT.depth) * 1024,
  ] as const;
  for (const building of geography.buildings) {
    context.beginPath();
    building.p.forEach((p, i) => { const [x, y] = point(p); if (i) context.lineTo(x, y); else context.moveTo(x, y); });
    context.closePath(); context.lineWidth = 18 / EXTENT.width * 1024; context.fill(); context.stroke();
  }
  context.lineWidth = 14 / EXTENT.width * 1024;
  context.lineCap = context.lineJoin = 'round';
  for (const road of geography.roads) {
    context.beginPath();
    road.forEach((p, i) => { const [x, y] = point(p); if (i) context.lineTo(x, y); else context.moveTo(x, y); });
    context.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'OSM building forecourts and road coverage';
  return texture;
}

export function applyBanpoGroundMaterials(model: THREE.Group, gravel: THREE.Texture) {
  const cover = urbanCoverage();
  const loader = new THREE.TextureLoader();
  const grass = loader.load('/models/han-river/ground/leafy-grass.webp');
  grass.colorSpace = THREE.SRGBColorSpace;
  const normal = loader.load('/models/han-river/ground/leafy-grass-normal.webp');
  for (const texture of [grass, normal]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
  }
  model.updateWorldMatrix(true, true);
  const world = new THREE.Vector3();
  model.traverse(object => {
    if (!(object instanceof THREE.Mesh)) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    if (!materials.some(material => material.name.startsWith('Terrain '))) return;
    const positions = object.geometry.getAttribute('position');
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      world.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
      uv[i * 2] = world.x / 4; uv[i * 2 + 1] = world.z / 4;
    }
    object.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial) || !material.name.startsWith('Terrain ')) continue;
      material.color.setScalar(0.94); material.map = grass; material.normalMap = normal;
      material.normalScale.set(0.04, 0.04); material.roughness = 1; material.metalness = 0;
      if (cover) {
        material.onBeforeCompile = shader => {
          shader.uniforms.uUrbanCoverage = { value: cover };
          shader.uniforms.uGravel = { value: gravel };
          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vGroundGeo;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 groundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;vGroundGeo=vec2(-groundWorld.z,-groundWorld.x);');
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nuniform sampler2D uUrbanCoverage;uniform sampler2D uGravel;varying vec2 vGroundGeo;')
            .replace('#include <map_fragment>', `#include <map_fragment>
              vec2 coverageUv=(vGroundGeo-vec2(-3500.0,-200.0))/vec2(7000.0,6700.0);
              float inCoverage=step(0.0,coverageUv.x)*step(0.0,coverageUv.y)*step(coverageUv.x,1.0)*step(coverageUv.y,1.0);
              float urban=texture2D(uUrbanCoverage,clamp(coverageUv,0.0,1.0)).r*inCoverage;
              float grain=texture2D(uGravel,vGroundGeo/5.0).r;
              float grassLuminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
              float grassDetail=smoothstep(.055,.48,grassLuminance);
              vec3 naturalGreen=mix(vec3(.19,.285,.17),vec3(.43,.535,.38),grassDetail);
              diffuseColor.rgb=mix(naturalGreen,vec3(.29,.30,.275)*(.86+grain*.2),urban);`);
        };
        material.customProgramCacheKey = () => 'banpo-geographic-ground-v2';
      }
      material.needsUpdate = true;
    }
  });
  return { dispose: () => cover?.dispose() };
}
