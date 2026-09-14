import * as THREE from 'three';
import { BANPO_APPEARANCE, banpoCssColor } from './BanpoAppearance';

export interface BanpoApartmentBuilding {
  readonly id: number;
  readonly blockNumber: number;
  /** East/north metres, retaining the mapped outline rather than a bounding box. */
  readonly p: readonly (readonly number[])[];
  readonly z: number;
  readonly heightM: number;
  readonly floors: number;
}

export interface BanpoApartmentComplex {
  readonly group: THREE.Group;
  readonly setNightMix: (mix: number) => void;
  readonly dispose: () => void;
}

interface Face {
  readonly start: THREE.Vector3;
  readonly direction: THREE.Vector3;
  readonly outward: THREE.Vector3;
  readonly length: number;
}

interface SurfaceBuffer {
  readonly positions: number[];
  readonly normals: number[];
  readonly colors: number[];
  readonly light: number[];
  readonly uv: number[];
}

const IVORY = new THREE.Color(BANPO_APPEARANCE.shindonga.ivory);
const LEDGE = new THREE.Color(BANPO_APPEARANCE.shindonga.ledge);
const ROOF = new THREE.Color(BANPO_APPEARANCE.shindonga.roof);
const JOINT = new THREE.Color(BANPO_APPEARANCE.shindonga.joint);
const DARK = new THREE.Color(BANPO_APPEARANCE.shindonga.glass);
const BLACK = new THREE.Color(BANPO_APPEARANCE.neutral.unlit);
const LIGHT_COLORS = BANPO_APPEARANCE.shindonga.lamps.map(color => new THREE.Color(color));

function buffer(): SurfaceBuffer {
  return { positions: [], normals: [], colors: [], light: [], uv: [] };
}

function quad(
  target: SurfaceBuffer,
  points: readonly [THREE.Vector3, THREE.Vector3, THREE.Vector3, THREE.Vector3],
  normal: THREE.Vector3,
  color: THREE.Color,
  emission = BLACK,
  uv: readonly (readonly [number, number])[] = [[0, 0], [1, 0], [1, 1], [0, 1]],
): void {
  const reversed = points[1].clone().sub(points[0]).cross(points[2].clone().sub(points[0])).dot(normal) < 0;
  const indices = reversed ? [0, 2, 1, 0, 3, 2] : [0, 1, 2, 0, 2, 3];
  for (const index of indices) {
    target.positions.push(...points[index].toArray());
    target.normals.push(...normal.toArray());
    target.colors.push(color.r, color.g, color.b);
    target.light.push(emission.r, emission.g, emission.b);
    target.uv.push(uv[index][0], uv[index][1]);
  }
}

function plane(target: SurfaceBuffer, face: Face, along: number, y: number, width: number, height: number,
  offset: number, color: THREE.Color, emission = BLACK, uv?: readonly (readonly [number, number])[]): void {
  const center = face.start.clone().addScaledVector(face.direction, along).addScaledVector(face.outward, offset).setY(y);
  const corner = (x: number, vertical: number): THREE.Vector3 => center.clone().addScaledVector(face.direction, x).add(new THREE.Vector3(0, vertical, 0));
  quad(target, [corner(-width / 2, -height / 2), corner(width / 2, -height / 2),
    corner(width / 2, height / 2), corner(-width / 2, height / 2)], face.outward, color, emission, uv);
}

function box(target: SurfaceBuffer, face: Face, along: number, y: number, width: number, height: number,
  offset: number, depth: number, color: THREE.Color): void {
  const center = face.start.clone().addScaledVector(face.direction, along).addScaledVector(face.outward, offset).setY(y);
  const at = (x: number, dy: number, z: number): THREE.Vector3 => center.clone().addScaledVector(face.direction, x)
    .addScaledVector(face.outward, z).add(new THREE.Vector3(0, dy, 0));
  const x = width / 2; const h = height / 2; const z = depth / 2;
  quad(target, [at(-x, -h, z), at(x, -h, z), at(x, h, z), at(-x, h, z)], face.outward, color);
  quad(target, [at(x, -h, -z), at(-x, -h, -z), at(-x, h, -z), at(x, h, -z)], face.outward.clone().negate(), color);
  quad(target, [at(x, -h, z), at(x, -h, -z), at(x, h, -z), at(x, h, z)], face.direction, color);
  quad(target, [at(-x, -h, -z), at(-x, -h, z), at(-x, h, z), at(-x, h, -z)], face.direction.clone().negate(), color);
  quad(target, [at(-x, h, z), at(x, h, z), at(x, h, -z), at(-x, h, -z)], new THREE.Vector3(0, 1, 0), color);
  quad(target, [at(-x, -h, -z), at(x, -h, -z), at(x, -h, z), at(-x, -h, z)], new THREE.Vector3(0, -1, 0), color);
}

function faces(points: readonly (readonly number[])[]): Face[] {
  const signedArea = points.reduce((area, point, index) => {
    const next = points[(index + 1) % points.length];
    return area + point[0] * next[1] - next[0] * point[1];
  }, 0);
  return points.map((point, index) => {
    const next = points[(index + 1) % points.length];
    const start = new THREE.Vector3(point[0], 0, -point[1]);
    const direction = new THREE.Vector3(next[0] - point[0], 0, point[1] - next[1]);
    const length = direction.length();
    direction.normalize();
    const outward = new THREE.Vector3(-direction.z, 0, direction.x).multiplyScalar(signedArea >= 0 ? 1 : -1);
    return { start, direction, outward, length };
  });
}

/** Only joins redundant collinear facade segments; the solid still uses every source vertex. */
function facadeOutline(points: readonly (readonly number[])[]): readonly (readonly number[])[] {
  return points.filter((point, index) => {
    const previous = points[(index + points.length - 1) % points.length];
    const next = points[(index + 1) % points.length];
    const chordX = next[0] - previous[0]; const chordY = next[1] - previous[1];
    const distance = Math.abs(chordX * (point[1] - previous[1]) - chordY * (point[0] - previous[0])) / Math.hypot(chordX, chordY);
    return distance > 0.25;
  });
}

function occupancy(id: number, floor: number, bay: number, side: number): number {
  let seed = (id ^ Math.imul(floor + 1, 374761393) ^ Math.imul(bay + 1, 668265263) ^ Math.imul(side + 1, 1442695041)) >>> 0;
  seed = Math.imul(seed ^ (seed >>> 13), 1274126177) >>> 0;
  return (seed ^ (seed >>> 16)) >>> 0;
}

function geometry(data: SurfaceBuffer): THREE.BufferGeometry {
  const result = new THREE.BufferGeometry();
  result.setAttribute('position', new THREE.Float32BufferAttribute(data.positions, 3));
  result.setAttribute('normal', new THREE.Float32BufferAttribute(data.normals, 3));
  result.setAttribute('color', new THREE.Float32BufferAttribute(data.colors, 3));
  result.setAttribute('apartmentLight', new THREE.Float32BufferAttribute(data.light, 3));
  result.setAttribute('uv', new THREE.Float32BufferAttribute(data.uv, 2));
  result.computeBoundingBox();
  result.computeBoundingSphere();
  return result;
}

function numberAtlas(buildings: readonly BanpoApartmentBuilding[]): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const context = canvas.getContext('2d');
  if (!context) return null;
  context.fillStyle = banpoCssColor(BANPO_APPEARANCE.shindonga.ivory); context.fillRect(0, 0, 512, 512);
  context.textAlign = 'center'; context.fillStyle = banpoCssColor(BANPO_APPEARANCE.shindonga.lettering);
  buildings.forEach((building, index) => {
    const x = (index % 4) * 128 + 64; const y = Math.floor(index / 4) * 128;
    context.font = '600 24px sans-serif'; context.fillText('신동아', x, y + 51);
    context.font = '600 30px sans-serif'; context.fillText(String(building.blockNumber), x, y + 89);
  });
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 2;
  return texture;
}

export function createBanpoApartmentComplex(buildings: readonly BanpoApartmentBuilding[]): BanpoApartmentComplex {
  const group = new THREE.Group();
  group.name = 'Seobinggo Shindonga mapped 15-block apartment complex';
  const solid = buffer(); const glazing = buffer(); const labels = buffer();
  const distant = buffer(); const distantFaces: number[] = [];
  const markDistant = (kind: number, seed: number): void => {
    while (distantFaces.length / 2 < distant.positions.length / 3) distantFaces.push(kind, seed);
  };
  const night = { value: 0 };

  buildings.forEach((building, buildingIndex) => {
    const top = building.z + building.heightM;
    const sourceFaces = faces(building.p);
    const longestSourceFace = Math.max(...sourceFaces.map(face => face.length));
    for (const [side, face] of sourceFaces.entries()) {
      const kind = face.length < longestSourceFace * 0.25 ? 0 : face.outward.z > 0 ? 1 : 2;
      const bays = Math.max(3, Math.round((face.length - 1.2) / 6.4));
      plane(distant, face, face.length / 2, building.z + building.heightM / 2, face.length, building.heightM, 0, IVORY, BLACK,
        [[0, 0], [bays, 0], [bays, building.floors], [0, building.floors]]);
      markDistant(kind, building.id % 7919 + side * 19);
      plane(solid, face, face.length / 2, building.z + building.heightM / 2, face.length, building.heightM, 0, IVORY);
    }
    const outline = building.p.map(point => new THREE.Vector2(point[0], -point[1]));
    for (const triangle of THREE.ShapeUtils.triangulateShape(outline, [])) {
      const a = outline[triangle[0]]; const b = outline[triangle[1]]; const c = outline[triangle[2]];
      const positions = [new THREE.Vector3(a.x, top, a.y), new THREE.Vector3(b.x, top, b.y), new THREE.Vector3(c.x, top, c.y)];
      if (positions[1].clone().sub(positions[0]).cross(positions[2].clone().sub(positions[0])).y < 0) positions.reverse();
      for (const position of positions) {
        solid.positions.push(...position.toArray()); solid.normals.push(0, 1, 0);
        solid.colors.push(ROOF.r, ROOF.g, ROOF.b); solid.light.push(0, 0, 0); solid.uv.push(0, 0);
        distant.positions.push(...position.toArray()); distant.normals.push(0, 1, 0);
        distant.colors.push(ROOF.r, ROOF.g, ROOF.b); distant.light.push(0, 0, 0); distant.uv.push(0, 0);
        markDistant(-1, 0);
      }
    }

    const facadeFaces = faces(facadeOutline(building.p));
    const longest = Math.max(...facadeFaces.map(face => face.length));
    const storey = (building.heightM - 0.6) / building.floors;
    facadeFaces.forEach((face, side) => {
      box(solid, face, face.length / 2, top + 0.32, face.length, 0.64, -0.17, 0.34, LEDGE);
      if (face.length < longest * 0.45) {
        for (let floor = 1; floor < building.floors; floor++) {
          plane(solid, face, face.length / 2, building.z + floor * storey, face.length - 0.15, 0.045, 0.015, JOINT);
        }
        const tileX = buildingIndex % 4; const tileY = Math.floor(buildingIndex / 4);
        plane(labels, face, face.length / 2, top - 8, Math.min(6.8, face.length - 0.7), 6.8, 0.025, new THREE.Color(BANPO_APPEARANCE.neutral.white), BLACK,
          [[tileX / 4, 1 - (tileY + 1) / 4], [(tileX + 1) / 4, 1 - (tileY + 1) / 4],
            [(tileX + 1) / 4, 1 - tileY / 4], [tileX / 4, 1 - tileY / 4]]);
        return;
      }
      const south = face.outward.z > 0;
      const bayCount = Math.max(3, Math.round((face.length - 1.2) / 6.4));
      const width = face.length - 1.2; const bayWidth = width / bayCount;
      for (let floor = 0; floor < building.floors; floor++) {
        const y = building.z + (floor + 0.5) * storey + 0.3;
        if (south) {
          plane(glazing, face, face.length / 2, y, width, 2.23, 0.055, DARK);
          box(solid, face, face.length / 2, building.z + floor * storey + 0.38, width, 0.19, 0.3, 0.7, LEDGE);
        }
        for (let bay = 0; bay < bayCount; bay++) {
          const seed = occupancy(building.id, floor, bay, side);
          const color = DARK.clone().lerp(new THREE.Color(BANPO_APPEARANCE.shindonga.glassVariation), (seed % 11) / 42);
          const emission = seed % 100 < (south ? 27 : 21) ? LIGHT_COLORS[seed % LIGHT_COLORS.length] : BLACK;
          const along = 0.6 + (bay + 0.5) * bayWidth;
          plane(glazing, face, along, y + (south ? 0.12 : 0.08), bayWidth * (south ? 0.9 : 0.59), south ? 1.82 : 1.64,
            0.085, color, emission);
          if (south) plane(solid, face, along, y + 0.12, 0.047, 1.82, 0.095, LEDGE);
        }
      }
      const sections = Math.max(2, Math.round(face.length / 20));
      for (let section = 0; section <= sections; section++) {
        const along = 0.6 + width * section / sections;
        box(solid, face, along, building.z + building.heightM / 2, section === 0 || section === sections ? 0.35 : 0.64,
          building.heightM, 0.18, 0.5, IVORY);
      }
      // Repeated lift overruns are visible in the existing-complex photographs. Their dimensions are interpretive.
      if (south) for (let section = 0; section < sections; section++) {
        const along = 0.6 + width * (section + 0.48) / sections;
        box(solid, face, along, top + 1.28, 3.4, 2.55, -3.7, 4.0, IVORY);
        box(distant, face, along, top + 1.28, 3.4, 2.55, -3.7, 4.0, IVORY);
        markDistant(-1, 0);
        plane(glazing, face, along - 0.62, top + 1.22, 0.65, 0.62, -1.685, DARK);
        plane(glazing, face, along + 0.62, top + 1.22, 0.65, 0.62, -1.685, DARK);
      }
    });
  });

  const structureMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.neutral.white, vertexColors: true, roughness: BANPO_APPEARANCE.shindonga.structureRoughness });
  const glassMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.neutral.white, vertexColors: true, roughness: BANPO_APPEARANCE.shindonga.glassRoughness, metalness: BANPO_APPEARANCE.shindonga.glassMetalness });
  glassMaterial.onBeforeCompile = shader => {
    shader.uniforms.apartmentNightMix = night;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec3 apartmentLight;\nvarying vec3 vApartmentLight;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvApartmentLight = apartmentLight;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nuniform float apartmentNightMix;\nvarying vec3 vApartmentLight;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>\ntotalEmissiveRadiance += vApartmentLight * apartmentNightMix * ${BANPO_APPEARANCE.shindonga.lampIntensity};`);
  };
  glassMaterial.customProgramCacheKey = (): string => 'shindonga-window-occupancy-v1';
  const meshes = [new THREE.Mesh(geometry(solid), structureMaterial), new THREE.Mesh(geometry(glazing), glassMaterial)];
  meshes[0].name = 'Mapped Shindonga walls roofs balcony slabs and lift heads';
  meshes[1].name = 'Shindonga thirteen-storey glazing and occupied windows';
  group.add(...meshes);
  const atlas = numberAtlas(buildings);
  const labelMaterial = atlas ? new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.neutral.white, map: atlas, roughness: BANPO_APPEARANCE.shindonga.structureRoughness }) : null;
  if (labelMaterial) {
    const mesh = new THREE.Mesh(geometry(labels), labelMaterial);
    mesh.name = 'Shindonga photographed gable lettering and block numbers';
    meshes.push(mesh); group.add(mesh);
  }
  const distantMaterial = new THREE.MeshStandardMaterial({ color: BANPO_APPEARANCE.neutral.white, vertexColors: true,
    roughness: BANPO_APPEARANCE.shindonga.structureRoughness });
  distantMaterial.onBeforeCompile = shader => {
    shader.uniforms.apartmentNightMix = night;
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nattribute vec2 apartmentFace; varying vec2 vApartmentFace; varying vec2 vApartmentGrid;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvApartmentFace=apartmentFace;vApartmentGrid=uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      uniform float apartmentNightMix; varying vec2 vApartmentFace; varying vec2 vApartmentGrid;
      float apartmentHash(vec3 p) { return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); }
      float apartmentCoverage(float p, float halfWidth, float aa) {
        float resolved=1.0-smoothstep(halfWidth-aa,halfWidth+aa,abs(fract(p)-0.5));
        return mix(resolved,halfWidth*2.0,smoothstep(0.25,0.75,aa));
      }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if(vApartmentFace.x>0.5) {
          vec2 aa=max(fwidth(vApartmentGrid)*0.75,vec2(0.001));
          float south=1.0-step(1.5,vApartmentFace.x);
          float horizontal=apartmentCoverage(vApartmentGrid.x,mix(0.295,0.465,south),aa.x);
          float vertical=apartmentCoverage(vApartmentGrid.y,mix(0.27,0.365,south),aa.y);
          float pane=horizontal*vertical;
          vec2 cell=floor(vApartmentGrid);
          float room=apartmentHash(vec3(cell,vApartmentFace.y));
          vec3 glass=vec3(${DARK.r},${DARK.g},${DARK.b});
          diffuseColor.rgb=mix(diffuseColor.rgb,glass,pane);
          float occupied=step(room,mix(0.21,0.27,south));
          float resolvedLight=1.0-smoothstep(0.35,0.85,max(aa.x,aa.y));
          vec3 lamp=mix(vec3(${LIGHT_COLORS[0].r},${LIGHT_COLORS[0].g},${LIGHT_COLORS[0].b}),
            vec3(${LIGHT_COLORS[2].r},${LIGHT_COLORS[2].g},${LIGHT_COLORS[2].b}),step(0.17,room));
          totalEmissiveRadiance+=lamp*pane*occupied*resolvedLight*apartmentNightMix*${BANPO_APPEARANCE.shindonga.lampIntensity};
        }`);
  };
  distantMaterial.customProgramCacheKey = (): string => 'shindonga-filtered-distance-facade-v1';
  const distantGeometry = geometry(distant);
  distantGeometry.setAttribute('apartmentFace', new THREE.Float32BufferAttribute(distantFaces, 2));
  const distantMesh = new THREE.Mesh(distantGeometry, distantMaterial);
  distantMesh.name = 'Antialiased distant Shindonga thirteen-floor facades';
  const nearGroup = new THREE.Group(); nearGroup.name = 'Physical Shindonga balcony detail';
  nearGroup.add(...group.children.slice());
  const center = new THREE.Box3().setFromObject(nearGroup).getCenter(new THREE.Vector3());
  const lod = new THREE.LOD(); lod.name = 'Shindonga distance detail'; lod.position.copy(center);
  nearGroup.position.copy(center).negate(); distantMesh.position.copy(center).negate();
  lod.addLevel(nearGroup, 0); lod.addLevel(distantMesh, 650, 0.08);
  group.add(lod); meshes.push(distantMesh);
  group.userData.buildingIds = buildings.map(building => building.id);
  group.userData.heightProvenance = '13 above-ground floors verified; metric height estimated at 39.65m, rooftop details photograph-informed';
  return {
    group,
    setNightMix: (mix): void => { night.value = THREE.MathUtils.clamp(mix, 0, 1); },
    dispose: (): void => {
      group.removeFromParent();
      meshes.forEach(mesh => mesh.geometry.dispose());
      structureMaterial.dispose(); glassMaterial.dispose(); distantMaterial.dispose(); labelMaterial?.dispose(); atlas?.dispose(); group.clear();
    },
  };
}
