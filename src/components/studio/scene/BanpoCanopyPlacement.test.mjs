import { describe, expect, it, spyOn } from 'bun:test';
import { readFileSync } from 'node:fs';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { createBanpoVegetation } from './BanpoVegetation.ts';
import geography from '../../../../public/models/han-river/geography.json';
import landcover from '../../../../public/models/han-river/landcover.json';
import paths from '../../../../public/models/han-river/vegetation/canopy-paths.json';
import baked from '../../../../public/models/han-river/vegetation/canopy-placements.json';
import {
  CANOPY_CLEARANCE, CANOPY_INSTANCE_BUDGET, canopyElevation, generateCanopyPlacements,
  insideFeature, insideRing, lineDistance,
} from './BanpoCanopyPlacement.ts';

const placements = generateCanopyPlacements();
globalThis.ProgressEvent ??= class extends Event {
  constructor(type, properties) {
    super(type);
    Object.assign(this, properties);
  }
};

function geometryOnlyGlb(name) {
  const original = readFileSync(new URL(`../../../../public/models/han-river/${name}`, import.meta.url));
  const length = original.readUInt32LE(12);
  const json = JSON.parse(original.toString('utf8', 20, 20 + length));
  json.materials = json.materials.map(material => ({ name: material.name, doubleSided: true }));
  delete json.images; delete json.textures; delete json.samplers;
  const text = JSON.stringify(json);
  const bytes = Buffer.from(text + ' '.repeat((4 - Buffer.byteLength(text) % 4) % 4));
  const binary = original.subarray(20 + length);
  const header = Buffer.alloc(20);
  header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4);
  header.writeUInt32LE(20 + bytes.length + binary.length, 8);
  header.writeUInt32LE(bytes.length, 12); header.writeUInt32LE(0x4e4f534a, 16);
  return Buffer.concat([header, bytes, binary]);
}

const modelBytes = geometryOnlyGlb('banpo-pilot.glb');
const model = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).parseAsync(
  modelBytes.buffer.slice(modelBytes.byteOffset, modelBytes.byteOffset + modelBytes.byteLength), '',
);

describe('mapped Banpo canopy placement', () => {
  it('fills the fixed instance budget when mapped riverbank planting areas are available', () => {
    // Given the mapped near-bank woodland and park corridor.
    const budget = CANOPY_INSTANCE_BUDGET;
    // When a deterministic planting pass runs.
    const placements = generateCanopyPlacements();
    // Then every planned cluster is populated without exceeding the draw budget.
    expect(placements.length).toBe(budget);
  });

  it('reproduces the shipped coordinates when the fixed seed and source data are unchanged', () => {
    // Given the checked-in coordinates consumed by the renderer.
    const expected = baked;
    // When the source placement process runs.
    const generated = generateCanopyPlacements();
    // Then no runtime random sampling or source drift changes the scenery.
    expect(generated).toEqual(expected);
  });

  it('keeps whole crowns inside a mapped park or woodland when placing clusters', () => {
    // Given the original OSM features, including their inner rings.
    const features = [...landcover.woodland, ...landcover.park];
    // When each emitted tree is matched to its source feature.
    const invalid = placements.filter(tree => {
      const feature = features.find(feature => feature.id === tree.sourceId);
      const point = [tree.east, tree.north];
      return !feature || !insideFeature(point, feature)
        || feature.rings.some(ring => lineDistance(point, ring, true) < CANOPY_CLEARANCE);
    });
    // Then no crown crosses a feature edge or polygon hole.
    expect(invalid).toEqual([]);
  });

  it('excludes a polygon hole when the point lies inside the outer park ring', () => {
    // Given a park with a central unplanted courtyard.
    const park = { id: 'courtyard', rings: [
      [[0, 0], [30, 0], [30, 30], [0, 30]], [[10, 10], [20, 10], [20, 20], [10, 20]],
    ] };
    // When containment checks a point inside that courtyard.
    const allowed = insideFeature([15, 15], park);
    // Then the enclosing park cannot erase the hole.
    expect(allowed).toBe(false);
  });

  it('preserves water and the modeled promenade when placing inland trees', () => {
    // Given the river polygon and the eight-metre promenade at each bank.
    const river = geography.banks.flat();
    // When tree positions are checked against the complete river corridor.
    const invalid = placements.filter(tree => insideRing([tree.east, tree.north], river)
      || geography.banks.some(bank => lineDistance([tree.east, tree.north], bank) < 12.5));
    // Then every crown has clearance from the waterfront walking surface.
    expect(invalid).toEqual([]);
  });

  it('preserves mapped streets, cycleways, footpaths and building footprints', () => {
    // Given the current supplementary path map and the scene's major roads and buildings.
    const boundaries = paths.paths;
    // When clearances are checked for the finished clusters.
    const invalid = placements.filter(tree => {
      const point = [tree.east, tree.north];
      return boundaries.some(path => lineDistance(point, path.points) < path.halfWidth + CANOPY_CLEARANCE)
        || geography.roads.some(road => lineDistance(point, road) < 7 + CANOPY_CLEARANCE)
        || geography.buildings.some(building => insideRing(point, building.p)
          || lineDistance(point, building.p, true) < 10 + CANOPY_CLEARANCE);
    });
    // Then no tree is planted on a circulation or occupied surface.
    expect(invalid).toEqual([]);
  });

  it('uses nonuniform groups with separated trunks when populating the fixed budget', () => {
    // Given deterministic clusters around eight inland planting anchors.
    const groups = Map.groupBy(placements, tree => tree.cluster);
    // When nearest-trunk distances are measured within each group.
    const distances = placements.map(tree => Math.min(...placements.filter(other => other !== tree)
      .map(other => Math.hypot(tree.east - other.east, tree.north - other.north))));
    // Then all groups are present, trunks stay apart, and spacing is not an evenly dotted row.
    expect([...groups.values()].map(group => group.length)).toEqual(Array(8).fill(9));
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(8.5);
    expect(Math.max(...distances) - Math.min(...distances)).toBeGreaterThan(5);
  });

  it('bakes a terrain height above water for every mapped planting position', () => {
    // Given the same source terrain triangles and shore ribbons used by the exported scene.
    const tolerance = 0.00051;
    // When each baked elevation is compared with its source surface.
    const invalid = placements.filter(tree => {
      const height = canopyElevation([tree.east, tree.north]);
      return height === undefined || height <= 4 || Math.abs(height - tree.elevation) > tolerance;
    });
    // Then no constant-height or below-water placement enters the instance data.
    expect(invalid).toEqual([]);
  });

  it('seats trunks on the actual exported terrain when compressed mesh geometry is loaded', () => {
    // Given the production GLB geometry, without loading its unrelated texture images.
    const surfaces = [];
    model.scene.updateWorldMatrix(true, true);
    model.scene.traverse(object => {
      if (object instanceof THREE.Mesh && (Array.isArray(object.material) ? object.material : [object.material])
        .some(material => material.name.startsWith('Terrain '))) surfaces.push(object);
    });
    const ray = new THREE.Raycaster();
    // When every baked trunk is projected down onto those actual surfaces.
    const offsets = placements.map(tree => {
      ray.set(new THREE.Vector3(tree.east, 1000, -tree.north), new THREE.Vector3(0, -1, 0));
      const ground = ray.intersectObjects(surfaces, false)[0];
      return ground ? Math.abs(tree.elevation - ground.point.y) : Infinity;
    });
    // Then grounding differs by less than the GLB's geographic quantization tolerance.
    expect(Math.max(...offsets)).toBeLessThan(0.25);
  });

  it('uses three shared instance draws and restores old canopy indices when disposed', async () => {
    // Given the real landscape and geometry of the three-material CC0 tree.
    const indices = [];
    model.scene.traverse(object => {
      if (object instanceof THREE.Mesh && object.name.startsWith('Riverbank_tree_canopies')) {
        indices.push({ geometry: object.geometry, original: object.geometry.index });
      }
    });
    const treeUrl = `data:model/gltf-binary;base64,${geometryOnlyGlb('vegetation/tree-small-02-riverbank.glb').toString('base64')}`;
    // When the real installer loads and then releases the tree instance group.
    const vegetation = createBanpoVegetation(model.scene, treeUrl);
    const ready = await vegetation.ready;
    const children = [...vegetation.group.children];
    const removedTriangles = indices.reduce((sum, item) => sum + (item.original.count - item.geometry.index.count) / 3, 0);
    vegetation.dispose();
    // Then material sharing and the budget hold, and fallback geometry is fully restored.
    expect(ready).toBe(true);
    expect(children.every(child => child instanceof THREE.InstancedMesh && child.count === 72)).toBe(true);
    expect(children.length).toBe(3);
    expect(removedTriangles).toBeGreaterThan(0);
    expect(indices.every(item => item.geometry.index === item.original)).toBe(true);
    expect(vegetation.group.parent).toBeNull();
  });

  it('retains the source canopy when the optional detailed tree asset cannot load', async () => {
    // Given a source landscape and an unreadable optional asset.
    const scene = new THREE.Group();
    const source = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    source.name = 'Riverbank_tree_canopies';
    scene.add(source);
    const index = source.geometry.index;
    const warning = spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
      // When the real loader rejects invalid glTF data.
      const vegetation = createBanpoVegetation(scene, 'data:model/gltf-binary;base64,bm90LWdMV EY=');
      const loaded = await vegetation.ready;
      vegetation.dispose();
      // Then coarse coverage survives and the installer reports its fallback.
      expect(loaded).toBe(false);
      expect(source.geometry.index).toBe(index);
      expect(scene.children).toEqual([source]);
      expect(warning).toHaveBeenCalledTimes(1);
    } finally {
      warning.mockRestore();
      source.geometry.dispose(); source.material.dispose();
    }
  });

  it('does not attach late instances when the landscape is disposed during loading', async () => {
    // Given an optional asset load still in flight.
    const scene = new THREE.Group();
    const treeUrl = `data:model/gltf-binary;base64,${geometryOnlyGlb('vegetation/tree-small-02-riverbank.glb').toString('base64')}`;
    const vegetation = createBanpoVegetation(scene, treeUrl);
    // When the owner disposes the landscape before its asset callback finishes.
    vegetation.dispose();
    const loaded = await vegetation.ready;
    // Then completion cannot resurrect a detached tree group.
    expect(loaded).toBe(false);
    expect(scene.children).toEqual([]);
    expect(vegetation.group.children).toEqual([]);
  });
});
