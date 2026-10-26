import * as THREE from 'three';
import { BANPO_APPEARANCE } from './BanpoAppearance';
import geography from '../../../../public/models/han-river/geography.json';
import { canopyElevation } from './BanpoCanopyPlacement';

export interface BanpoLocalStreet {
  readonly id: string;
  readonly wayId: number;
  readonly highway: string;
  readonly name: string | null;
  readonly widthM: number;
  readonly widthProvenance: string;
  readonly p: readonly (readonly number[])[];
}

export const LOCAL_STREET_EXTENT = { west: -2500, east: 3000, south: 650, north: 4200 } as const;
export const LOCAL_STREET_MASK_SIZE = 2048;
export const LOCAL_STREET_SURFACE_OFFSET = .05;

/** Shares the source terrain's cell diagonal, rather than interpolating an unrelated flat road plane. */
export function createBanpoLocalStreetGeometry(): THREE.BufferGeometry {
  const positions: number[] = []; const uvs: number[] = []; const indices: number[] = [];
  const { west, east, south, north } = LOCAL_STREET_EXTENT;
  const startRow = Math.floor((south + 200) / 100); const endRow = Math.ceil((north + 200) / 100);
  const startColumn = (west + 3500) / 100; const endColumn = (east + 3500) / 100;
  const columns = endColumn - startColumn + 1;
  for (let row = startRow; row <= endRow; row++) {
    for (let column = startColumn; column <= endColumn; column++) {
      const x = -3500 + column * 100; const y = -200 + row * 100;
      const elevation = canopyElevation([x, y]) ?? geography.terrain[row][column];
      positions.push(x, elevation + LOCAL_STREET_SURFACE_OFFSET, -y);
      uvs.push((x - west) / (east - west), (y - south) / (north - south));
      if (row === endRow || column === endColumn) continue;
      const a = (row - startRow) * columns + column - startColumn;
      indices.push(a, a + 1, a + columns + 1, a, a + columns + 1, a + columns);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

function createCoverage(streets: readonly BanpoLocalStreet[]): THREE.DataTexture | null {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = LOCAL_STREET_MASK_SIZE;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) return null;
  const { west, east, south, north } = LOCAL_STREET_EXTENT;
  context.fillStyle = '#000'; context.fillRect(0, 0, canvas.width, canvas.height);
  context.setTransform(canvas.width / (east - west), 0, 0, -canvas.height / (north - south),
    -west * canvas.width / (east - west), north * canvas.height / (north - south));
  context.strokeStyle = '#fff'; context.lineCap = context.lineJoin = 'round';
  for (const street of streets) {
    context.beginPath(); context.lineWidth = street.widthM;
    street.p.forEach(([x, y], index) => { if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
    context.stroke();
  }
  // A mapped road may touch a bank; its painted width must not spill onto the water.
  context.fillStyle = '#000'; context.beginPath();
  geography.banks.flat().forEach(([x, y], index) => { if (index === 0) context.moveTo(x, y); else context.lineTo(x, y); });
  context.closePath(); context.fill();
  const rgba = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const pixels = new Uint8Array(canvas.width * canvas.height);
  // DataTexture's first row is the southern UV edge. Keep one channel on the GPU.
  for (let row = 0; row < canvas.height; row++) {
    for (let column = 0; column < canvas.width; column++) {
      pixels[row * canvas.width + column] = rgba[((canvas.height - row - 1) * canvas.width + column) * 4];
    }
  }
  const texture = new THREE.DataTexture(pixels, canvas.width, canvas.height, THREE.RedFormat, THREE.UnsignedByteType);
  texture.name = 'Mapped local streets, single-channel R8 coverage';
  texture.minFilter = THREE.LinearMipmapLinearFilter; texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true; texture.anisotropy = 2; texture.needsUpdate = true;
  canvas.width = canvas.height = 1;
  return texture;
}

export function createBanpoLocalStreets(streets: readonly BanpoLocalStreet[]) {
  const group = new THREE.Group(); group.name = 'Mapped north-bank local street network';
  const coverage = createCoverage(streets);
  if (!coverage) return { group, dispose: (): void => { group.removeFromParent(); group.clear(); } };
  const geometry = createBanpoLocalStreetGeometry();
  const material = new THREE.MeshStandardMaterial({ name: 'Local street asphalt', ...BANPO_APPEARANCE.streets, alphaTest: .035, depthWrite: false, polygonOffset: true,
    polygonOffsetFactor: -1, polygonOffsetUnits: -1 });
  material.onBeforeCompile = shader => {
    shader.uniforms.uLocalStreetCoverage = { value: coverage };
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vStreetUv;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvStreetUv=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform sampler2D uLocalStreetCoverage;\nvarying vec2 vStreetUv;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float inBounds=step(0.,vStreetUv.x)*step(0.,vStreetUv.y)*step(vStreetUv.x,1.)*step(vStreetUv.y,1.);
        float coverage=texture2D(uLocalStreetCoverage,clamp(vStreetUv,0.,1.)).r*inBounds;
        diffuseColor.a*=coverage;`);
  };
  material.customProgramCacheKey = () => 'banpo-local-street-r8-v1';
  const mesh = new THREE.Mesh(geometry, material); mesh.name = 'Terrain-draped sourced local roads';
  mesh.renderOrder = 1;
  group.add(mesh);
  group.userData.localStreets = { ways: new Set(streets.map(street => street.wayId)).size, parts: streets.length,
    triangles: (geometry.index?.count ?? 0) / 3, textureWidth: coverage.image.width, textureHeight: coverage.image.height,
    textureFormat: 'R8', textureBaseBytes: coverage.image.data?.byteLength ?? 0,
    textureMipBytes: Array.from({ length: Math.log2(LOCAL_STREET_MASK_SIZE) + 1 }, (_, level) => (LOCAL_STREET_MASK_SIZE / 2 ** level) ** 2).reduce((sum, bytes) => sum + bytes, 0) };
  return { group, dispose: (): void => {
    group.removeFromParent(); geometry.dispose(); material.dispose(); coverage.dispose(); group.clear();
  } };
}
