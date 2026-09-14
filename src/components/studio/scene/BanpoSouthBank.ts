import * as THREE from 'three';
import { BANPO_APPEARANCE } from './BanpoAppearance';
import { applyBanpoFacadeMaterial } from './BanpoFacadeMaterial';
import { createBanpoUrbanFabric } from './BanpoUrbanFabric';
import type { SouthBankGeometry } from './BanpoSouthBankData';

export function createBanpoSouthBank(data: SouthBankGeometry, gravel?: THREE.Texture) {
  const group = new THREE.Group();
  group.name = 'Sourced south-bank Banpo and Jamwon skyline';
  const completed = createBanpoUrbanFabric(data.buildings);
  completed.group.name = 'Mapped south-bank apartment and neighborhood footprints';
  completed.wallMaterial.name = 'South bank mapped mineral facades';
  const facade = applyBanpoFacadeMaterial(completed.wallMaterial);
  const construction = createBanpoUrbanFabric(data.construction);
  construction.group.name = 'Clast construction envelopes from municipal site plan';
  construction.wallMaterial.name = 'Unfinished Clast concrete floor plates';
  construction.wallMaterial.color.setHex(BANPO_APPEARANCE.urbanFabric.roof.color);
  construction.wallMaterial.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vConstructionUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvConstructionUv=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vConstructionUv;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        vec2 grid=vConstructionUv*4.0;
        vec2 cell=fract(grid);
        vec2 aa=max(fwidth(grid),vec2(.006));
        float slab=1.0-smoothstep(.10-aa.y,.10+aa.y,cell.y);
        float column=1.0-smoothstep(.15-aa.x,.15+aa.x,cell.x);
        diffuseColor.rgb*=mix(.34,1.0,max(slab,column));`);
  };
  construction.wallMaterial.customProgramCacheKey = () => 'banpo-construction-floor-plates-v1';
  group.add(completed.group, construction.group);

  const { terrain } = data; const positions: number[] = []; const colors: number[] = []; const uvs: number[] = [];
  const mineral = new THREE.Color(BANPO_APPEARANCE.streets.color).multiplyScalar(1.65);
  const foliage = new THREE.Color(BANPO_APPEARANCE.park.foliage);
  for (let row = 0; row < terrain.rows.length - 1; row++) {
    for (let column = 0; column < terrain.rows[row].length - 1; column++) {
      const corners = [[column, row], [column + 1, row], [column + 1, row + 1], [column, row + 1]];
      if (corners.every(([x, y]) => terrain.rows[y][x] < 0)) continue;
      for (const index of [0, 1, 2, 0, 2, 3]) {
        const [x, y] = corners[index];
        positions.push(terrain.west + x * terrain.step, terrain.rows[y][x], -terrain.south - y * terrain.step);
        uvs.push((terrain.west + x * terrain.step) / 12, (terrain.south + y * terrain.step) / 12);
        const color = terrain.cover[y][x] ? foliage : mineral;
        colors.push(color.r, color.g, color.b);
      }
    }
  }
  const groundGeometry = new THREE.BufferGeometry();
  groundGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  groundGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  groundGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  groundGeometry.computeVertexNormals();
  const groundMaterial = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 });
  if (gravel) {
    groundMaterial.onBeforeCompile = shader => {
      shader.uniforms.uSouthGravel = { value: gravel };
      shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vSouthGroundUv;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvSouthGroundUv=uv;');
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uSouthGravel;varying vec2 vSouthGroundUv;')
        .replace('#include <color_fragment>', '#include <color_fragment>\ndiffuseColor.rgb*=.83+.24*texture2D(uSouthGravel,vSouthGroundUv).r;');
    };
    groundMaterial.customProgramCacheKey = () => 'banpo-south-sourced-ground-v1';
  }
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.name = 'South bank sourced SRTM terrain extension';
  group.add(ground);

  const treeGeometry = new THREE.IcosahedronGeometry(1, 1);
  const treeMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.park.foliage, roughness: 1 });
  const trees = new THREE.InstancedMesh(treeGeometry, treeMaterial, data.trees.length);
  trees.name = 'South-bank park and Clast frontage tree belt';
  const trunkGeometry = new THREE.CylinderGeometry(.4, .55, 4, 5);
  const trunkMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.park.rail, roughness: 1 });
  const trunks = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, data.trees.length);
  trunks.name = 'South-bank tree-belt trunks';
  const transform = new THREE.Object3D();
  data.trees.forEach(([east, north, elevation, radius], index) => {
    transform.position.set(east, elevation + radius * .8 + 2.2, -north);
    transform.scale.set(radius, radius * .8, radius * .9);
    transform.rotation.set(0, index * 2.4, 0);
    transform.updateMatrix(); trees.setMatrixAt(index, transform.matrix);
    transform.position.set(east, elevation + 2, -north); transform.scale.set(1, 1, 1);
    transform.updateMatrix(); trunks.setMatrixAt(index, transform.matrix);
  });
  trees.computeBoundingSphere(); trunks.computeBoundingSphere(); group.add(trees, trunks);

  const craneBuildings = data.construction.filter(building => building.h > 60);
  const craneGeometry = new THREE.BoxGeometry(1, 1, 1);
  const craneMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.park.rail, roughness: .8 });
  const cranes = new THREE.InstancedMesh(craneGeometry, craneMaterial, craneBuildings.length * 5);
  cranes.name = 'Clast static tower cranes on traced building envelopes';
  let craneIndex = 0;
  for (const building of craneBuildings) {
    const east = building.p.reduce((sum, p) => sum + p[0], 0) / building.p.length;
    const north = building.p.reduce((sum, p) => sum + p[1], 0) / building.p.length;
    const top = building.z + building.h + 21;
    for (const [dx, y, dz, width, height, depth] of [
      [0, building.z + (building.h + 21) / 2, 0, 1.6, building.h + 21, 1.6],
      [16, top, 0, 56, 1.1, 1.2], [-11, top - 1, 0, 6, 3, 3],
      [0, top + 4, 0, 1.1, 8, 1.1], [38, top - 10, 0, .18, 20, .18],
    ]) {
      transform.position.set(east + dx, y, -north + dz);
      transform.rotation.set(0, 0, 0); transform.scale.set(width, height, depth);
      transform.updateMatrix(); cranes.setMatrixAt(craneIndex++, transform.matrix);
    }
  }
  cranes.computeBoundingSphere(); group.add(cranes);
  group.userData.sourceDate = '2026-09-13';
  group.userData.completedFootprints = data.buildings.length;
  group.userData.constructionEnvelopes = data.construction.length;
  return {
    group,
    setNightMix: facade.setNightMix,
    dispose: (): void => {
      completed.dispose(); construction.dispose();
      groundGeometry.dispose(); groundMaterial.dispose();
      trees.dispose(); treeGeometry.dispose(); treeMaterial.dispose();
      trunks.dispose(); trunkGeometry.dispose(); trunkMaterial.dispose();
      cranes.dispose(); craneGeometry.dispose(); craneMaterial.dispose();
      group.removeFromParent(); group.clear();
    },
  };
}
