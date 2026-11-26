import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { MeshoptEncoder } from 'meshoptimizer';
import { MeshoptDecoder } from 'three-stdlib';
import sharp from 'sharp';

const extensionName = 'EXT_meshopt_compression';
const alignedLength = (length) => Math.ceil(length / 4) * 4;
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const decoder = typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder;
const usage = 'bun scripts/optimize-office-glb.mjs INPUT.glb OUTPUT.glb garment|guitar';
const [input, output, mode] = process.argv.slice(2);
if (input === '--help') {
  console.log(usage);
  process.exit(0);
}
assert(input && output && ['garment', 'guitar'].includes(mode), usage);
assert.notEqual(input, output, 'Preserve the original input as a private backup');
await Promise.all([MeshoptEncoder.ready, decoder.ready]);

function readGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(24 + jsonLength), 0x004e4942);
  return { json: JSON.parse(bytes.subarray(20, 20 + jsonLength)), bin: bytes.subarray(28 + jsonLength) };
}

function decodeViews({ json, bin }) {
  return json.bufferViews.map((view) => {
    const extension = view.extensions?.[extensionName];
    if (!extension) return Buffer.from(bin.subarray(view.byteOffset, view.byteOffset + view.byteLength));
    const result = Buffer.alloc(view.byteLength);
    decoder.decodeGltfBuffer(result, extension.count, extension.byteStride, bin.subarray(extension.byteOffset, extension.byteOffset + extension.byteLength), extension.mode, extension.filter);
    return result;
  });
}

function triangleHash(indices) {
  const triangles = [];
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i], indices[i + 1], indices[i + 2]];
    triangles.push([`${a},${b},${c}`, `${b},${c},${a}`, `${c},${a},${b}`].sort()[0]);
  }
  return hash(triangles.sort().join(';'));
}

const originalBytes = await readFile(input);
const original = readGlb(originalBytes);
const json = structuredClone(original.json);
assert(json.extensionsRequired.includes(extensionName), 'Expected the existing Meshopt office assets');
const originalViews = decodeViews(original);
const views = originalViews.map((view) => Buffer.from(view));
const textureChanges = [];
let geometryProof;

if (mode === 'garment') {
  assert.equal(json.meshes.length, 1);
  assert.equal(json.meshes[0].primitives.length, 1);
  const primitive = json.meshes[0].primitives[0];
  assert.equal(primitive.mode ?? 4, 4);
  assert.equal(primitive.targets, undefined);
  assert.equal(json.skins, undefined);
  const indexAccessor = json.accessors[primitive.indices];
  assert.equal(indexAccessor.componentType, 5125);
  assert.equal(indexAccessor.byteOffset ?? 0, 0);
  const originalIndices = new Uint32Array(originalViews[indexAccessor.bufferView].buffer, originalViews[indexAccessor.bufferView].byteOffset, indexAccessor.count);
  const indices = new Uint32Array(originalIndices);
  const [remap, usedVertices] = MeshoptEncoder.reorderMesh(indices, true, true);
  const vertexCount = json.accessors[primitive.attributes.POSITION].count;
  assert.equal(remap.length, vertexCount);
  let nextUnused = usedVertices;
  for (let i = 0; i < remap.length; i++) if (remap[i] === 0xffffffff) remap[i] = nextUnused++;
  assert.equal(nextUnused, vertexCount, 'Retain every unreferenced vertex');
  const inverse = new Uint32Array(vertexCount);
  for (let i = 0; i < remap.length; i++) inverse[remap[i]] = i;
  for (const accessorIndex of Object.values(primitive.attributes)) {
    const accessor = json.accessors[accessorIndex];
    const view = json.bufferViews[accessor.bufferView];
    assert.equal(accessor.byteOffset ?? 0, 0);
    assert.equal(accessor.count, vertexCount);
    assert.equal(json.accessors.filter((candidate) => candidate.bufferView === accessor.bufferView).length, 1);
    const stride = view.extensions[extensionName].byteStride;
    const source = originalViews[accessor.bufferView];
    const target = views[accessor.bufferView];
    for (let i = 0; i < vertexCount; i++) source.copy(target, remap[i] * stride, i * stride, (i + 1) * stride);
    for (let i = 0; i < vertexCount; i++) assert.deepEqual(target.subarray(remap[i] * stride, (remap[i] + 1) * stride), source.subarray(i * stride, (i + 1) * stride));
  }
  views[indexAccessor.bufferView] = Buffer.from(indices.buffer);
  json.bufferViews[indexAccessor.bufferView].extensions[extensionName].mode = 'TRIANGLES';
  const topologyHash = triangleHash(originalIndices);
  assert.equal(triangleHash(indices.map((index) => inverse[index])), topologyHash);
  geometryProof = { vertices: vertexCount, triangles: indices.length / 3, retainedUnusedVertices: vertexCount - usedVertices, exactAttributeBytes: true, orientedTriangleSha256: topologyHash, indexView: indexAccessor.bufferView, inverse };
}

if (mode === 'guitar') {
  const materialImages = new Set(json.materials.map((material) => {
    const texture = json.textures[material.pbrMetallicRoughness.metallicRoughnessTexture.index];
    return texture.extensions.EXT_texture_webp.source;
  }));
  for (const imageIndex of materialImages) {
    const image = json.images[imageIndex];
    assert.equal(image.mimeType, 'image/webp');
    const source = originalViews[image.bufferView];
    const encoded = await sharp(source).keepMetadata().webp({ nearLossless: true, quality: 95, effort: 6 }).toBuffer();
    const [before, after] = await Promise.all([sharp(source).raw().toBuffer({ resolveWithObject: true }), sharp(encoded).raw().toBuffer({ resolveWithObject: true })]);
    assert.deepEqual(after.info, before.info);
    let maxDelta = 0;
    let squares = 0;
    for (let i = 0; i < before.data.length; i++) {
      const delta = Math.abs(before.data[i] - after.data[i]);
      maxDelta = Math.max(maxDelta, delta);
      squares += delta * delta;
    }
    assert(maxDelta <= 1, 'Packed material channels may move by at most one 8-bit level');
    assert(encoded.length < source.length * 0.9, 'Keep only meaningful compression wins');
    views[image.bufferView] = encoded;
    json.bufferViews[image.bufferView].byteLength = encoded.length;
    textureChanges.push({ imageIndex, originalBytes: source.length, compressedBytes: encoded.length, ...before.info, maxDelta, rmse: Math.sqrt(squares / before.data.length) });
  }
}

const pieces = [];
let storedLength = 0;
for (const [index, view] of json.bufferViews.entries()) {
  const extension = view.extensions?.[extensionName];
  const stored = extension ? Buffer.from(MeshoptEncoder.encodeGltfBuffer(views[index], extension.count, extension.byteStride, extension.mode, 0)) : views[index];
  if (extension) Object.assign(extension, { byteOffset: storedLength, byteLength: stored.length });
  else view.byteOffset = storedLength;
  const padded = Buffer.alloc(alignedLength(stored.length));
  stored.copy(padded);
  pieces.push(padded);
  storedLength += padded.length;
}
json.buffers[0].byteLength = storedLength;
const jsonBytes = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(alignedLength(jsonBytes.length), 0x20);
jsonBytes.copy(paddedJson);
const result = Buffer.alloc(28 + paddedJson.length + storedLength);
for (const [offset, value] of [[0, 0x46546c67], [4, 2], [8, result.length], [12, paddedJson.length], [16, 0x4e4f534a], [20 + paddedJson.length, storedLength], [24 + paddedJson.length, 0x004e4942]]) result.writeUInt32LE(value, offset);
paddedJson.copy(result, 20);
Buffer.concat(pieces).copy(result, 28 + paddedJson.length);
const packed = readGlb(result);
const decoded = decodeViews(packed);
for (const key of ['meshes', 'accessors', 'nodes', 'scenes', 'scene', 'materials', 'textures', 'images', 'extensionsUsed', 'extensionsRequired', 'asset']) assert.deepEqual(packed.json[key], original.json[key], `${key} semantics changed`);
for (let index = 0; index < views.length; index++) {
  if (geometryProof?.indexView === index) {
    const indices = new Uint32Array(decoded[index].buffer, decoded[index].byteOffset, decoded[index].length / 4);
    assert.equal(triangleHash(indices.map((value) => geometryProof.inverse[value])), geometryProof.orientedTriangleSha256);
  } else assert.deepEqual(decoded[index], views[index], `Runtime-decoded buffer ${index} changed`);
}
assert(result.length < originalBytes.length);
await writeFile(output, result);
const { inverse, ...geometry } = geometryProof ?? {};
console.log(JSON.stringify({ input, output, originalBytes: originalBytes.length, compressedBytes: result.length, savedBytes: originalBytes.length - result.length, originalSha256: hash(originalBytes), compressedSha256: hash(result), geometry, textureChanges, meshes: json.meshes.length, primitives: json.meshes.reduce((sum, mesh) => sum + mesh.primitives.length, 0), materials: json.materials.length, textures: json.textures.length, bounds: json.meshes.flatMap((mesh) => mesh.primitives.map((primitive) => { const accessor = json.accessors[primitive.attributes.POSITION]; return { min: accessor.min, max: accessor.max, vertices: accessor.count, triangles: json.accessors[primitive.indices].count / 3 }; })), runtimeDecodedViews: decoded.length }, null, 2));
