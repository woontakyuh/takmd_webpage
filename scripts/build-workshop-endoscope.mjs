import { mkdir, writeFile } from 'node:fs/promises';
import {
  Box3, CylinderGeometry, Group, LatheGeometry, Matrix4, Mesh,
  MeshStandardMaterial, Quaternion, SphereGeometry, TorusGeometry, Vector2, Vector3,
} from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';

// Measured visual ratios from the supplied FUXUN photo; dimensions are scene metres.
const destination = new URL('../public/models/workshop/', import.meta.url);
const evidence = new URL('../docs/redesign/workshop-reference-2026-09-07/', import.meta.url);
const materials = {
  polished: new MeshStandardMaterial({ color: '#D8DCDD', metalness: 1, roughness: 0.16 }),
  satin: new MeshStandardMaterial({ color: '#AEB4B6', metalness: 0.95, roughness: 0.3 }),
  darkSteel: new MeshStandardMaterial({ color: '#717B7E', metalness: 0.9, roughness: 0.27 }),
  eyecup: new MeshStandardMaterial({ color: '#141C20', metalness: 0.12, roughness: 0.34 }),
  optical: new MeshStandardMaterial({ color: '#193B48', metalness: 0.72, roughness: 0.06 }),
};
const batches = new Map(Object.keys(materials).map(key => [key, []]));
const parts = [];

function add(name, geometry, position, material, quaternion = new Quaternion()) {
  const transform = new Matrix4().compose(new Vector3(...position), quaternion, new Vector3(1, 1, 1));
  const transformed = geometry.toNonIndexed().applyMatrix4(transform);
  batches.get(material).push(transformed);
  parts.push({ name, material, triangles: transformed.getAttribute('position').count / 3 });
  geometry.dispose();
}

function axial(name, profile, position, material = 'satin', segments = 48) {
  const geometry = new LatheGeometry(profile.map(([radius, z]) => new Vector2(radius, z)), segments);
  geometry.rotateX(Math.PI / 2);
  if (segments === 8) {
    const faceted = geometry.toNonIndexed();
    faceted.computeVertexNormals();
    add(name, faceted, position, material);
    geometry.dispose();
  } else add(name, geometry, position, material);
}

function rod(name, start, end, radius, material = 'polished', segments = 24) {
  const from = new Vector3(...start);
  const to = new Vector3(...end);
  const delta = to.clone().sub(from);
  const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), delta.clone().normalize());
  add(name, new CylinderGeometry(radius, radius, delta.length(), segments), from.add(to).multiplyScalar(0.5).toArray(), material, rotation);
}

function ring(name, position, radius, thickness, material = 'darkSteel') {
  add(name, new TorusGeometry(radius, thickness, 6, 48), position, material);
}

function ball(name, position, radii, material = 'satin') {
  const geometry = new SphereGeometry(1, 24, 12);
  geometry.scale(...radii);
  add(name, geometry, position, material);
}

function instrumentScope() {
  const x = 0.052;
  const y = 0.026;
  rod('Scope · 4.4 mm rigid optical shaft', [x, y, -0.083], [x, y, 0.182], 0.0022, 'polished', 40);
  axial('Scope · objective bevel', [[0.0022, 0.176], [0.0022, 0.183], [0.0015, 0.184], [0, 0.184]], [x, y, 0], 'polished');
  axial('Scope · distal optical window', [[0, 0.1841], [0.00155, 0.1841]], [x, y, 0], 'optical');
  axial('Scope · shaft socket', [[0.0022, -0.085], [0.0048, -0.085], [0.0056, -0.079], [0.0056, -0.074], [0.003, -0.071], [0.0022, -0.071]], [x, y, 0], 'polished');
  axial('Scope · faceted coupling housing', [[0.009, -0.115], [0.012, -0.11], [0.012, -0.091], [0.007, -0.085]], [x, y, 0], 'satin', 8);
  axial('Scope · camera barrel', [[0.0087, -0.143], [0.0094, -0.141], [0.0094, -0.117], [0.009, -0.113]], [x, y, 0], 'polished');
  ring('Scope · rear barrel seam', [x, y, -0.136], 0.0094, 0.00038);
  ring('Scope · shaft retaining ring', [x, y, -0.078], 0.0056, 0.0006);
  axial('Scope · recessed soft black eyepiece cup', [
    [0.009, -0.139], [0.010, -0.145], [0.012, -0.15], [0.017, -0.157],
    [0.0188, -0.163], [0.0191, -0.167], [0.0184, -0.169], [0.0155, -0.169],
    [0.012, -0.164], [0.007, -0.154], [0.005, -0.153],
  ], [x, y, 0], 'eyecup');
  axial('Scope · recessed eyepiece lens', [[0, -0.154], [0.0075, -0.154]], [x, y, 0], 'optical');
  const lightStart = [x - 0.008, y + 0.003, -0.105];
  const lightEnd = [x - 0.041, y + 0.007, -0.116];
  rod('Scope · angled illumination connector', lightStart, lightEnd, 0.0049, 'satin');
  for (let index = 0; index < 3; index += 1) {
    const fraction = 0.73 + index * 0.09;
    const center = lightStart.map((value, axis) => value + (lightEnd[axis] - value) * fraction);
    const direction = new Vector3(...lightEnd).sub(new Vector3(...lightStart)).normalize();
    const rotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), direction);
    add(`Scope · light connector machining ring ${index + 1}`, new TorusGeometry(0.005, 0.0006, 6, 32), center, 'polished', rotation);
  }
}

function instrumentSheath() {
  const x = -0.052;
  const y = 0.027;
  axial('Sheath · hollow rigid working tube', [[0.0034, -0.075], [0.0034, 0.166], [0.00255, 0.173], [0.0019, 0.173], [0.0025, 0.166], [0.0025, -0.075]], [x, y, 0], 'satin');
  axial('Sheath · distal beveled mouth', [[0.0034, 0.16], [0.0034, 0.166], [0.00255, 0.173], [0.0019, 0.173]], [x, y, 0], 'polished');
  axial('Sheath · valve block and proximal coupling', [
    [0.0034, -0.057], [0.0075, -0.062], [0.0102, -0.072], [0.0102, -0.09],
    [0.0096, -0.091], [0.0096, -0.11], [0.0085, -0.113], [0.0085, -0.129],
    [0.0065, -0.134], [0.0057, -0.142], [0.0058, -0.15], [0.009, -0.16],
    [0.0084, -0.166], [0.0066, -0.169], [0.0048, -0.169], [0.0037, -0.159],
  ], [x, y, 0], 'satin');
  for (const z of [-0.113, -0.131]) ring('Sheath · gasket', [x, y, z], z === -0.113 ? 0.0088 : 0.0074, 0.0005, 'eyecup');
  for (let index = 0; index < 72; index += 1) {
    const angle = (index / 72) * Math.PI * 2;
    const dx = Math.cos(angle) * 0.0102;
    const dy = Math.sin(angle) * 0.0102;
    rod(`Sheath · knurled locking collar flute ${index + 1}`, [x + dx, y + dy, -0.074], [x + dx, y + dy, -0.082], 0.00024, 'polished', 5);
  }
  ring('Sheath · locking collar edge', [x, y, -0.0736], 0.0101, 0.00045, 'polished');
  ring('Sheath · locking collar edge', [x, y, -0.0824], 0.0101, 0.00045, 'polished');
  for (const side of [-1, 1]) {
    const stopX = x + side * 0.022;
    rod('Sheath · fluid branch', [x, y, -0.095], [stopX, y, -0.095], 0.004, 'satin');
    rod('Sheath · stopcock body', [stopX, y - 0.006, -0.095], [stopX, y + 0.008, -0.095], 0.0064, 'satin');
    rod('Sheath · valve spindle', [stopX, y + 0.007, -0.095], [stopX, y + 0.011, -0.095], 0.0026, 'darkSteel');
    rod('Sheath · narrow stopcock lever', [stopX, y + 0.011, -0.095], [stopX + side * 0.003, y + 0.025, -0.105], 0.0011, 'polished', 16);
    ball('Sheath · flattened lever tip', [stopX + side * 0.003, y + 0.025, -0.105], [0.002, 0.0041, 0.0012], 'darkSteel');
    const branchEnd = stopX + side * 0.017;
    rod('Sheath · irrigation luer taper', [stopX, y, -0.095], [branchEnd, y, -0.095], 0.0039, 'satin');
    const axisRotation = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), new Vector3(side, 0, 0));
    for (const offset of [0.012, 0.016]) {
      add('Sheath · luer flange', new TorusGeometry(0.0039, 0.0005, 6, 24), [stopX + side * offset, y, -0.095], 'polished', axisRotation);
    }
    const bore = new CylinderGeometry(0.0025, 0.0025, 0.0002, 24);
    add('Sheath · open luer bore', bore, [branchEnd + side * 0.0002, y, -0.095], 'darkSteel', new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), new Vector3(side, 0, 0)));
  }
}

instrumentScope();
instrumentSheath();
const model = new Group();
model.name = 'Reference biportal scope and working sheath';
for (const [key, geometries] of batches) {
  if (!geometries.length) continue;
  materials[key].name = `Instrument ${key}`;
  const mesh = new Mesh(mergeVertices(mergeGeometries(geometries), 1e-7), materials[key]);
  mesh.name = `Biportal instruments · ${key}`;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  model.add(mesh);
}
model.userData = { reference: 'docs/reference-assets/2026-09-07/biportal-endoscope.png', units: 'metres', construction: 'Precision lathed mesh; five material batches; freely orbitable' };
globalThis.FileReader = class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(buffer => { this.result = buffer; this.onloadend?.(); }); }
};
const glb = await new GLTFExporter().parseAsync(model, { binary: true });
await mkdir(destination, { recursive: true });
await mkdir(evidence, { recursive: true });
await writeFile(new URL('biportal-endoscope.glb', destination), Buffer.from(glb));
const stats = {
  byteLength: glb.byteLength, triangles: parts.reduce((sum, part) => sum + part.triangles, 0),
  drawCalls: model.children.length, sizeMetres: new Box3().setFromObject(model).getSize(new Vector3()).toArray(), parts,
};
await writeFile(new URL('endoscope-geometry.json', evidence), JSON.stringify(stats, null, 2));
console.log(JSON.stringify({ ...stats, parts: parts.length }));
