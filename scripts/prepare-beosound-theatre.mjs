import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Box3, Group, Matrix4, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const SOURCE_ROOT = '.omo/evidence/theatre-2026-09-08/official-3d-drawings/Beovision Theatre/obj';
const OUTPUT_ROOT = 'public/models/beosound-theatre';
const EVIDENCE_ROOT = '.omo/evidence/theatre-2026-09-08';
const SOURCE_CONTACT_Y_MM = 283.99;
const SOURCE_WIDTH_MM = 1200.201416015625;
const SOURCE_DEPTH_MM = 164;
const PUBLISHED_WIDTH_M = 1.222;
const PUBLISHED_DEPTH_M = 0.157;

const MATERIALS = {
  aluminium: new MeshStandardMaterial({
    name: 'Silver aluminium lower blade', color: '#B8BDBF', metalness: 0.9, roughness: 0.26,
    envMapIntensity: 0.78,
  }),
  graphite: new MeshStandardMaterial({
    name: 'Graphite rear housing and controls', color: '#34393B', metalness: 0.3, roughness: 0.48,
    envMapIntensity: 0.38,
  }),
  acoustic: new MeshStandardMaterial({
    name: 'Dark acoustic backing', color: '#121514', metalness: 0, roughness: 0.88,
    envMapIntensity: 0.16,
  }),
  oak: new MeshStandardMaterial({
    name: 'Natural oak vertical cover', color: '#B6A184', metalness: 0, roughness: 0.5,
    envMapIntensity: 0.4,
  }),
  rubber: new MeshStandardMaterial({
    name: 'Table foot contact pads', color: '#222626', metalness: 0.02, roughness: 0.78,
    envMapIntensity: 0.16,
  }),
};

const BASIC_PARTS = {
  aluminium: new Set([30, 31, 33]),
  graphite: new Set([39, 41, 46, 47]),
};

class TheatreGeometryError extends Error {
  constructor(message) {
    super(message);
    this.name = 'TheatreGeometryError';
  }
}

function sourceTransform() {
  const xScale = PUBLISHED_WIDTH_M / SOURCE_WIDTH_MM;
  const zScale = PUBLISHED_DEPTH_M / SOURCE_DEPTH_MM;
  return new Matrix4()
    .makeTranslation(0, -SOURCE_CONTACT_Y_MM / 1000, 0)
    .multiply(new Matrix4().makeScale(xScale, 0.001, zScale));
}

async function loadObj(path) {
  const source = await readFile(resolve(SOURCE_ROOT, path), 'utf8');
  return new OBJLoader().parse(source);
}

function numberedMeshes(source) {
  return source.children.filter(child => child instanceof Mesh).map((mesh) => {
    const part = Number.parseInt(mesh.name, 10);
    if (!Number.isInteger(part)) throw new TheatreGeometryError(`Unexpected OBJ mesh name: ${mesh.name}`);
    return { part, mesh };
  });
}

function prepareGeometry(source, transform) {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  geometry.deleteAttribute('uv');
  geometry.applyMatrix4(transform);
  if (!geometry.getAttribute('normal')) geometry.computeVertexNormals();
  return geometry;
}

function addMergedMesh(assembly, geometries, material, name) {
  if (geometries.length === 0) throw new TheatreGeometryError(`${name} has no geometry.`);
  const merged = mergeGeometries(geometries);
  geometries.forEach(geometry => geometry.dispose());
  if (!merged) throw new TheatreGeometryError(`${name} geometry could not be merged.`);
  const indexed = mergeVertices(merged);
  merged.dispose();
  const mesh = new Mesh(indexed, material);
  mesh.name = name;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  assembly.add(mesh);
}

function collectSelected(source, parts, transform) {
  return numberedMeshes(source)
    .filter(({ part }) => parts.has(part))
    .map(({ mesh }) => prepareGeometry(mesh.geometry, transform));
}

function buildAssembly(basic, connector, interfaceCover, fabricFront, woodFront, feet) {
  const transform = sourceTransform();
  // Keep the closing shell just inside the official cover's depth so the
  // manufacturer's 1.222 x 0.197 x 0.157 m envelope remains authoritative.
  const topCover = new RoundedBoxGeometry(1.208, 0.008, 0.150, 4, 0.003).translate(0, 0.192, -0.0038);
  topCover.deleteAttribute('uv');
  const assembly = new Group();
  assembly.name = 'Bang and Olufsen Beosound Theatre silver aluminium natural oak table placement';

  for (const [materialKey, parts] of Object.entries(BASIC_PARTS)) {
    addMergedMesh(
      assembly,
      collectSelected(basic, parts, transform),
      MATERIALS[materialKey],
      `Beosound Theatre ${materialKey}`,
    );
  }
  addMergedMesh(
    assembly,
    numberedMeshes(connector).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
    MATERIALS.graphite,
    'Beosound Theatre connector cover',
  );
  addMergedMesh(
    assembly,
    numberedMeshes(interfaceCover).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
    MATERIALS.graphite,
    'Beosound Theatre top interface',
  );
  addMergedMesh(
    assembly,
    [
      ...numberedMeshes(fabricFront).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
      topCover,
    ],
    MATERIALS.acoustic,
    'Beosound Theatre continuous dark acoustic backing and top',
  );
  addMergedMesh(
    assembly,
    numberedMeshes(woodFront).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
    MATERIALS.oak,
    'Beosound Theatre natural oak vertical slats',
  );
  const footMeshes = numberedMeshes(feet);
  addMergedMesh(
    assembly,
    footMeshes.filter(({ part }) => part >= 5).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
    MATERIALS.aluminium,
    'Beosound Theatre tabletop stand',
  );
  addMergedMesh(
    assembly,
    footMeshes.filter(({ part }) => part < 5).map(({ mesh }) => prepareGeometry(mesh.geometry, transform)),
    MATERIALS.rubber,
    'Beosound Theatre tabletop contact pads',
  );
  return assembly;
}

async function exportBinary(scene) {
  if (!globalThis.FileReader) {
    globalThis.FileReader = class FileReader {
      readAsArrayBuffer(blob) {
        blob.arrayBuffer().then((buffer) => {
          this.result = buffer;
          this.onloadend?.();
        });
      }
    };
  }
  return new GLTFExporter().parseAsync(scene, { binary: true, onlyVisible: true, truncateDrawRange: true });
}

function modelReport(scene, bytes) {
  const bounds = new Box3().setFromObject(scene);
  const size = bounds.getSize(new Vector3());
  let triangles = 0;
  const meshes = [];
  scene.traverse((child) => {
    if (!(child instanceof Mesh)) return;
    const count = (child.geometry.index?.count ?? child.geometry.getAttribute('position').count) / 3;
    triangles += count;
    meshes.push({ name: child.name, material: child.material.name, triangles: count });
  });
  return {
    meshCount: meshes.length,
    triangleCount: triangles,
    meshes,
    boundsMetres: { min: bounds.min.toArray(), max: bounds.max.toArray(), size: size.toArray() },
    shelfContactYMetres: bounds.min.y,
    frontDirection: '+Z',
    bytes,
  };
}

async function main() {
  const [basic, connector, interfaceCover, fabricFront, woodFront, feet] = await Promise.all([
    loadObj('Beosound Theatre/beosound_theatre_basic.obj'),
    loadObj('Beosound Theatre/beosound_theatre_connector_cover.obj'),
    loadObj('Beosound Theatre/beosound_theatre_interface_cover.obj'),
    loadObj('Front/beosound_theatre_fabric_front.obj'),
    loadObj('Front/beosound_theatre_wood_front.obj'),
    loadObj('Stand : bracket/beosound_theatre_feets.obj'),
  ]);
  const assembly = buildAssembly(basic, connector, interfaceCover, fabricFront, woodFront, feet);
  const binary = await exportBinary(assembly);
  if (!(binary instanceof ArrayBuffer)) throw new TheatreGeometryError('Expected GLB ArrayBuffer export.');
  await mkdir(OUTPUT_ROOT, { recursive: true });
  await mkdir(EVIDENCE_ROOT, { recursive: true });
  const output = resolve(OUTPUT_ROOT, 'beosound-theatre-table.glb');
  await writeFile(output, new Uint8Array(binary));
  const saved = await readFile(output);
  const savedBuffer = saved.buffer.slice(saved.byteOffset, saved.byteOffset + saved.byteLength);
  const roundTrip = await new GLTFLoader().parseAsync(savedBuffer, '');
  const report = {
    source: 'Bang & Olufsen official Beovision Theatre 3D Drawings package',
    sourceCoordinates: 'millimetres, Y-up, +Z front',
    envelopeFit: {
      sourceWidthMetres: SOURCE_WIDTH_MM / 1000,
      publishedWidthMetres: PUBLISHED_WIDTH_M,
      sourceDepthMetres: SOURCE_DEPTH_MM / 1000,
      publishedDepthMetres: PUBLISHED_DEPTH_M,
    },
    authored: modelReport(assembly, binary.byteLength),
    roundTrip: modelReport(roundTrip.scene, saved.byteLength),
  };
  await writeFile(resolve(EVIDENCE_ROOT, 'export-report.json'), `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
