import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const root = new URL('../', import.meta.url);
const source = new URL('docs/redesign/workshop-reference-2026-09-07/source/plush-pig-meshy-original.glb', root);
const original = await readFile(source);
const jsonLength = original.readUInt32LE(12);
const document = JSON.parse(original.subarray(20, 20 + jsonLength).toString());
const binary = original.subarray(28 + jsonLength);
const primitive = document.meshes[0].primitives[0];
const positionAccessor = document.accessors[primitive.attributes.POSITION];
const normalAccessor = document.accessors[primitive.attributes.NORMAL];
const indexAccessor = document.accessors[primitive.indices];
const attributeBytes = accessor => {
  const view = document.bufferViews[accessor.bufferView];
  return binary.subarray(view.byteOffset + (accessor.byteOffset || 0), view.byteOffset + view.byteLength);
};
const positionBytes = attributeBytes(positionAccessor);
const indexBytes = attributeBytes(indexAccessor);
const smoothNormals = new Map();
const keys = [];
const positions = [];
for (let index = 0; index < positionAccessor.count; index += 1) {
  const position = [0, 1, 2].map(axis => positionBytes.readFloatLE(index * 12 + axis * 4));
  const key = position.map(value => Math.round(value * 1e5)).join(',');
  keys.push(key);
  positions.push(position);
  if (!smoothNormals.has(key)) smoothNormals.set(key, [0, 0, 0]);
}
const readIndex = index => indexAccessor.componentType === 5125 ? indexBytes.readUInt32LE(index * 4) : indexBytes.readUInt16LE(index * 2);
for (let index = 0; index < indexAccessor.count; index += 3) {
  const triangle = [readIndex(index), readIndex(index + 1), readIndex(index + 2)];
  const [a, b, c] = triangle.map(vertex => positions[vertex]);
  const u = b.map((value, axis) => value - a[axis]);
  const v = c.map((value, axis) => value - a[axis]);
  const normal = [u[1]*v[2]-u[2]*v[1], u[2]*v[0]-u[0]*v[2], u[0]*v[1]-u[1]*v[0]];
  for (const vertex of triangle) {
    const sum = smoothNormals.get(keys[vertex]);
    normal.forEach((value, axis) => { sum[axis] += value; });
  }
}
const normalBytes = Buffer.alloc(normalAccessor.count * 12);
keys.forEach((key, index) => {
  const normal = smoothNormals.get(key);
  const length = Math.hypot(...normal);
  normal.forEach((value, axis) => normalBytes.writeFloatLE(value / length, index * 12 + axis * 4));
});
const imageIndices = [0, 2];
const images = document.images;
document.images = imageIndices.map(index => images[index]);
document.textures = imageIndices.map((index, sourceIndex) => ({ ...document.textures[index], source: sourceIndex }));
const material = document.materials[0];
material.name = 'Pale pink velour · brown embroidery · peach fabric';
material.doubleSided = false;
material.pbrMetallicRoughness.metallicFactor = 0;
material.pbrMetallicRoughness.roughnessFactor = 0.98;
delete material.pbrMetallicRoughness.metallicRoughnessTexture;
delete material.emissiveTexture;
material.emissiveFactor = [0, 0, 0];
material.normalTexture = { ...material.normalTexture, index: 1, scale: 0.8 };
material.extensions = { KHR_materials_sheen: { sheenColorFactor: [0.35, 0.25, 0.26], sheenRoughnessFactor: 0.95 } };
document.extensionsUsed = [...new Set([...(document.extensionsUsed || []), 'KHR_materials_sheen'])];
document.meshes[0].name = 'Reference sculpt · folded fabric ears and sewn feet';
document.extras = {
  source: 'User-supplied plush-pig.png; Meshy through Higgsfield',
  generationJob: '5ab0417b-0072-4ae5-9abf-4ddfd97fb082',
  finish: 'Non-metallic matte textile; generated emissive and metal maps removed',
};
const usedViews = new Set([
  ...document.accessors.map(accessor => accessor.bufferView),
  ...document.images.map(image => image.bufferView),
]);
const viewMapping = new Map();
const pieces = [];
const views = [];
let offset = 0;
for (let index = 0; index < document.bufferViews.length; index += 1) {
  if (!usedViews.has(index)) continue;
  const view = document.bufferViews[index];
  let bytes = binary.subarray(view.byteOffset, view.byteOffset + view.byteLength);
  if (index === normalAccessor.bufferView) bytes = normalBytes;
  const imageIndex = document.images.findIndex(image => image.bufferView === index);
  if (imageIndex === 1) {
    const { data, info } = await sharp(bytes).resize(1024,1024).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    // Technical tangent-space normal data: submillimetre irregular velour pile, not a photo overlay.
    let seed = 1709;
    for (let pixel = 0; pixel < data.length; pixel += info.channels) {
      seed = Math.imul(1664525, seed) + 1013904223 | 0;
      const fiberX = ((seed >>> 16) / 65535 - 0.5) * 0.32;
      seed = Math.imul(1664525, seed) + 1013904223 | 0;
      const fiberY = ((seed >>> 16) / 65535 - 0.5) * 0.32;
      const nx = (data[pixel] / 127.5 - 1) * 0.22 + fiberX;
      const ny = (data[pixel + 1] / 127.5 - 1) * 0.22 + fiberY;
      data[pixel] = Math.round((nx + 1) * 127.5);
      data[pixel + 1] = Math.round((ny + 1) * 127.5);
      data[pixel + 2] = Math.round((Math.sqrt(Math.max(0, 1-nx*nx-ny*ny)) + 1) * 127.5);
    }
    bytes = await sharp(data, { raw:info }).jpeg({ quality:82, chromaSubsampling:'4:4:4' }).toBuffer();
  } else if (imageIndex === 0) bytes = await sharp(bytes).jpeg({ quality:92, chromaSubsampling:'4:4:4' }).toBuffer();
  viewMapping.set(index, views.length);
  views.push({ ...view, byteOffset: offset, byteLength: bytes.length });
  pieces.push(bytes);
  const padding = (4 - (bytes.length % 4)) % 4;
  pieces.push(Buffer.alloc(padding));
  offset += bytes.length + padding;
}
for (const accessor of document.accessors) accessor.bufferView = viewMapping.get(accessor.bufferView);
for (const image of document.images) image.bufferView = viewMapping.get(image.bufferView);
document.bufferViews = views;
document.buffers[0].byteLength = offset;
const json = Buffer.from(JSON.stringify(document));
const jsonPadding = Buffer.alloc((4 - (json.length % 4)) % 4, 32);
const header = Buffer.alloc(20);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
header.writeUInt32LE(28 + json.length + jsonPadding.length + offset, 8);
header.writeUInt32LE(json.length + jsonPadding.length, 12);
header.writeUInt32LE(0x4e4f534a, 16);
const binaryHeader = Buffer.alloc(8);
binaryHeader.writeUInt32LE(offset, 0);
binaryHeader.writeUInt32LE(0x004e4942, 4);
const result = Buffer.concat([header, json, jsonPadding, binaryHeader, ...pieces]);
await writeFile(new URL('public/models/workshop/plush-pig.glb', root), result);
const stats = { sourceBytes: original.length, webBytes: result.length, triangles: document.accessors[3].count / 3, drawCalls:1, retainedMaps:['base color 2048 px', 'normal 1024 px with procedural fine textile normal'], finish:['position-welded smooth vertex normals', 'KHR_materials_sheen matte velour'], discardedMaps:['metallic/roughness: incorrect shiny finish', 'emissive: fabric must not glow'] };
await writeFile(new URL('docs/redesign/workshop-reference-2026-09-07/pig-geometry.json', root), JSON.stringify(stats, null, 2));
console.log(JSON.stringify(stats));
