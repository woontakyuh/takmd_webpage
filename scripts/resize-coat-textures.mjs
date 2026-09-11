import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, realpath, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const usage = 'node scripts/resize-coat-textures.mjs INPUT.glb OUTPUT.glb [--keep-base-color]';
const [input, output, option] = process.argv.slice(2);
if (input === '--help') { console.log(usage); process.exit(0); }
assert(input && output && (!option || option === '--keep-base-color'), usage);
assert.notEqual(await realpath(input), resolve(output), 'Preserve the original GLB');
const aligned = length => Math.ceil(length / 4) * 4;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function readGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const length = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(24 + length), 0x004e4942);
  return { json: JSON.parse(bytes.subarray(20, 20 + length)), bin: bytes.subarray(28 + length) };
}

function storedView(glb, index) {
  const view = glb.json.bufferViews[index];
  const stored = view.extensions?.EXT_meshopt_compression ?? view;
  assert.equal(stored.buffer, 0);
  return glb.bin.subarray(stored.byteOffset ?? 0, (stored.byteOffset ?? 0) + stored.byteLength);
}

const sourceBytes = await readFile(input);
const source = readGlb(sourceBytes), json = structuredClone(source.json);
assert.equal(json.images.length, 3, 'Expected the three existing coat maps');
const imageViews = new Map(json.images.map((image, index) => [image.bufferView, index]));
const images = [], chunks = [];
let offset = 0;
for (const [index, view] of json.bufferViews.entries()) {
  const original = storedView(source, index);
  let bytes = original;
  const imageIndex = imageViews.get(index);
  if (imageIndex !== undefined) {
    const image = json.images[imageIndex];
    assert.equal(image.mimeType, 'image/jpeg');
    const before = await sharp(original).metadata();
    assert.equal(before.width, 4096); assert.equal(before.height, 4096);
    const retained = option === '--keep-base-color' && imageIndex === 0;
    if (!retained) bytes = await sharp(original).resize(2048, 2048, { kernel: 'lanczos3' })
      .jpeg({ quality: 95, chromaSubsampling: '4:4:4' }).toBuffer();
    const after = await sharp(bytes).metadata();
    assert.equal(after.width, retained ? 4096 : 2048); assert.equal(after.height, after.width);
    images.push({ name: image.name, originalSize: [before.width, before.height], derivedSize: [after.width, after.height],
      originalBytes: original.length, derivedBytes: bytes.length, retained, originalSha256: hash(original), derivedSha256: hash(bytes) });
  }
  const stored = view.extensions?.EXT_meshopt_compression ?? view;
  stored.byteOffset = offset; stored.byteLength = bytes.length;
  const chunk = Buffer.alloc(aligned(bytes.length)); bytes.copy(chunk); chunks.push(chunk); offset += chunk.length;
}
json.buffers[0].byteLength = offset;
const jsonBytes = Buffer.from(JSON.stringify(json)), paddedJson = Buffer.alloc(aligned(jsonBytes.length), 0x20);
jsonBytes.copy(paddedJson);
const result = Buffer.alloc(28 + paddedJson.length + offset);
for (const [at, value] of [[0, 0x46546c67], [4, 2], [8, result.length], [12, paddedJson.length], [16, 0x4e4f534a],
  [20 + paddedJson.length, offset], [24 + paddedJson.length, 0x004e4942]]) result.writeUInt32LE(value, at);
paddedJson.copy(result, 20); Buffer.concat(chunks).copy(result, 28 + paddedJson.length);
const derived = readGlb(result);
for (const key of Object.keys(source.json).filter(key => !['buffers', 'bufferViews'].includes(key))) {
  assert.deepEqual(derived.json[key], source.json[key], `${key} semantics must remain identical`);
}
const geometry = [];
for (const [index, view] of source.json.bufferViews.entries()) {
  if (imageViews.has(index)) continue;
  const original = storedView(source, index), next = storedView(derived, index);
  assert.deepEqual(next, original, `Geometry buffer ${index} changed`);
  const oldView = structuredClone(view), newView = structuredClone(derived.json.bufferViews[index]);
  for (const candidate of [oldView, newView]) {
    const stored = candidate.extensions?.EXT_meshopt_compression ?? candidate;
    delete stored.byteOffset;
  }
  assert.deepEqual(newView, oldView, `Geometry decoder parameters ${index} changed`);
  geometry.push({ bufferView: index, bytes: original.length, sha256: hash(original), identical: true });
}
assert.deepEqual(await readFile(input), sourceBytes, 'Source changed while preparing derivative');
assert(result.length < sourceBytes.length, 'Retain a smaller derivative');
await writeFile(output, result);
console.log(JSON.stringify({ input, output, originalBytes: sourceBytes.length, derivedBytes: result.length,
  savedBytes: sourceBytes.length - result.length, originalSha256: hash(sourceBytes), derivedSha256: hash(result),
  images, geometry, unchangedSceneAndMaterialSemantics: true }, null, 2));
