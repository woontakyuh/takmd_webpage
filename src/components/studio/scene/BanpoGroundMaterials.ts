import * as THREE from 'three';
import geography from '../../../../public/models/han-river/geography.json';
import landcover from '../../../../public/models/han-river/landcover.json';
import urbanFabric from '../../../../public/models/han-river/urban-fabric.json';

const EXTENT = landcover.extent;
const COVER_SIZE = 1024;

export function terrainSurfaceNormal(east: number, north: number, height: number): THREE.Vector3 | undefined {
  if (height <= 35) return;
  const column = Math.round((east + 3500) / 100);
  const row = Math.round((north + 200) / 100);
  const westHeight = geography.terrain[row]?.[column - 1];
  const eastHeight = geography.terrain[row]?.[column + 1];
  const southHeight = geography.terrain[row - 1]?.[column];
  const northHeight = geography.terrain[row + 1]?.[column];
  if (westHeight === undefined || eastHeight === undefined || southHeight === undefined || northHeight === undefined
    || Math.min(westHeight, eastHeight, southHeight, northHeight) <= 4) return;
  return new THREE.Vector3((northHeight - southHeight) / 200, 1, (eastHeight - westHeight) / 200).normalize();
}

function landCoverage() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = COVER_SIZE;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = '#000'; context.fillRect(0, 0, COVER_SIZE, COVER_SIZE);
  const point = ([east, north]: readonly number[]) => [
    (east - EXTENT.west) / EXTENT.width * COVER_SIZE,
    (1 - (north - EXTENT.south) / EXTENT.depth) * COVER_SIZE,
  ] as const;
  const path = (ring: readonly (readonly number[])[]) => {
    ring.forEach((p, i) => { const [x, y] = point(p); if (i) context.lineTo(x, y); else context.moveTo(x, y); });
    context.closePath();
  };
  for (const [features, color] of [[landcover.urban, '#f00']] as const) {
    context.fillStyle = color;
    for (const feature of features) {
      context.beginPath();
      feature.rings.forEach(path);
      context.fill('evenodd');
    }
  }
  context.fillStyle = context.strokeStyle = '#f00';
  for (const building of [...geography.buildings, ...urbanFabric]) {
    context.beginPath();
    path(building.p);
    context.lineWidth = 18 / EXTENT.width * COVER_SIZE; context.fill(); context.stroke();
  }
  context.lineWidth = 14 / EXTENT.width * COVER_SIZE;
  context.lineCap = context.lineJoin = 'round';
  for (const road of geography.roads) {
    context.beginPath();
    road.forEach((p, i) => { const [x, y] = point(p); if (i) context.lineTo(x, y); else context.moveTo(x, y); });
    context.stroke();
  }
  for (const [features, color] of [[landcover.park, '#00f'], [landcover.woodland, '#0f0']] as const) {
    context.fillStyle = color;
    for (const feature of features) {
      context.beginPath();
      feature.rings.forEach(path);
      context.fill('evenodd');
    }
  }
  context.fillStyle = '#000';
  context.beginPath();
  path(geography.banks.flat());
  context.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.name = 'OSM developed land, parks and woodland coverage';
  return texture;
}

export function applyBanpoGroundMaterials(model: THREE.Group, gravel: THREE.Texture) {
  const cover = landCoverage();
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
    const normals = object.geometry.getAttribute('normal');
    const worldNormalToLocal = new THREE.Matrix3().getNormalMatrix(object.matrixWorld).invert();
    const originalNormal = new THREE.Vector3();
    const uv = new Float32Array(positions.count * 2);
    for (let i = 0; i < positions.count; i++) {
      world.fromBufferAttribute(positions, i).applyMatrix4(object.matrixWorld);
      uv[i * 2] = world.x / 4; uv[i * 2 + 1] = world.z / 4;
      const surfaceNormal = terrainSurfaceNormal(-world.z, -world.x, world.y);
      if (normals && surfaceNormal) {
        surfaceNormal.applyMatrix3(worldNormalToLocal).normalize();
        originalNormal.fromBufferAttribute(normals, i)
          .lerp(surfaceNormal, THREE.MathUtils.smoothstep(world.y, 35, 65)).normalize();
        normals.setXYZ(i, originalNormal.x, originalNormal.y, originalNormal.z);
      }
    }
    if (normals) normals.needsUpdate = true;
    object.geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    for (const material of materials) {
      if (!(material instanceof THREE.MeshStandardMaterial) || !material.name.startsWith('Terrain ')) continue;
      material.color.setScalar(0.94); material.map = grass; material.normalMap = normal;
      material.normalScale.set(0.04, 0.04); material.roughness = 1; material.metalness = 0;
      if (cover) {
        material.onBeforeCompile = shader => {
          shader.uniforms.uLandCoverage = { value: cover };
          shader.uniforms.uLandExtent = { value: new THREE.Vector4(EXTENT.west, EXTENT.south, EXTENT.width, EXTENT.depth) };
          shader.uniforms.uGravel = { value: gravel };
          shader.vertexShader = shader.vertexShader
            .replace('#include <common>', '#include <common>\nvarying vec2 vGroundGeo;')
            .replace('#include <begin_vertex>', '#include <begin_vertex>\nvec3 groundWorld=(modelMatrix*vec4(transformed,1.0)).xyz;vGroundGeo=vec2(-groundWorld.z,-groundWorld.x);');
          shader.fragmentShader = shader.fragmentShader
            .replace('#include <common>', '#include <common>\nuniform sampler2D uLandCoverage;uniform sampler2D uGravel;uniform vec4 uLandExtent;varying vec2 vGroundGeo;')
            .replace('#include <map_fragment>', `#include <map_fragment>
              vec2 coverageUv=(vGroundGeo-uLandExtent.xy)/uLandExtent.zw;
              float inCoverage=step(0.0,coverageUv.x)*step(0.0,coverageUv.y)*step(coverageUv.x,1.0)*step(coverageUv.y,1.0);
              vec3 cover=texture2D(uLandCoverage,clamp(coverageUv,0.0,1.0)).rgb*inCoverage;
              float grain=texture2D(uGravel,vGroundGeo/5.0).r;
              float groundVariation=texture2D(uGravel,vGroundGeo/80.0).r;
              float grassLuminance=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));
              float grassDetail=smoothstep(.055,.48,grassLuminance);
              vec3 naturalGreen=mix(vec3(.19,.285,.17),vec3(.43,.535,.38),grassDetail);
              vec3 parkGreen=naturalGreen*(.88+groundVariation*.2);
              vec3 woodland=mix(vec3(.10,.185,.095),vec3(.235,.33,.17),groundVariation);
              vec3 mineral=vec3(.29,.30,.275)*(.78+grain*.16+groundVariation*.18);
              diffuseColor.rgb=mix(naturalGreen,parkGreen,cover.b);
              diffuseColor.rgb=mix(diffuseColor.rgb,woodland,cover.g);
              diffuseColor.rgb=mix(diffuseColor.rgb,mineral,cover.r);`);
        };
        material.customProgramCacheKey = () => 'banpo-geographic-ground-v4';
      }
      material.needsUpdate = true;
    }
  });
  return { dispose: () => cover?.dispose() };
}
