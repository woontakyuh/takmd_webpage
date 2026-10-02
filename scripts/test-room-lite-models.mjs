import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import sharp from 'sharp';

const models = [
  ['garments/control-gi.glb', 'garments/control-gi-lite.glb', 1024],
  ['garments/control-gi-phone-packed.glb', 'garments/control-gi-phone-lite.glb', 1024],
  ['garments/physician-coat-2k.glb', 'garments/physician-coat-lite.glb', 1024],
  ['fender/stratocaster-sunburst.glb', 'fender/stratocaster-lite.glb', 1024],
  ['surfboard-packed.glb', 'surfboard-lite.glb', 1024],
  ['workshop/plush-pig-packed.glb', 'workshop/plush-pig-lite.glb', 512],
];
async function load(file) {
  const bytes = await readFile(new URL(`../public/models/${file}`, import.meta.url));
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const length = bytes.readUInt32LE(12);
  return { bytes, json: JSON.parse(bytes.subarray(20, 20 + length)), bin: bytes.subarray(28 + length) };
}
function viewBytes(model, index) {
  const view = model.json.bufferViews[index];
  const stored = view.extensions?.EXT_meshopt_compression ?? view;
  const offset = stored.byteOffset ?? 0;
  return model.bin.subarray(offset, offset + stored.byteLength);
}
const reports = [];
for (const [input, output, limit] of models) {
  const [original, lite] = await Promise.all([load(input), load(output)]);
  assert(lite.bytes.length < original.bytes.length, output);
  for (const key of ['meshes', 'accessors', 'nodes', 'scenes', 'scene', 'materials', 'samplers', 'skins', 'animations']) {
    assert.deepEqual(lite.json[key], original.json[key], `${output}: ${key}`);
  }
  assert.equal(lite.json.images.length, original.json.images.length);
  assert.equal(lite.json.textures.length, original.json.textures.length);
  assert(lite.json.extensionsRequired.includes('EXT_texture_webp'));
  assert(lite.json.extensionsUsed.includes('EXT_texture_webp'));
  for (const [index, texture] of original.json.textures.entries()) {
    const source = texture.extensions?.EXT_texture_webp?.source ?? texture.source;
    assert.equal(lite.json.textures[index].extensions.EXT_texture_webp.source, source);
    assert.equal(lite.json.textures[index].sampler, texture.sampler);
  }
  const imageViews = new Set(original.json.images.map(image => image.bufferView));
  assert.equal(lite.json.bufferViews.length, original.json.bufferViews.length);
  let geometryBytes = 0;
  for (const [index] of original.json.bufferViews.entries()) {
    if (imageViews.has(index)) continue;
    assert.deepEqual(viewBytes(lite, index), viewBytes(original, index), `${output}: geometry ${index}`);
    geometryBytes += viewBytes(lite, index).length;
  }
  const images = [];
  for (const [index, image] of lite.json.images.entries()) {
    assert.equal(image.mimeType, 'image/webp');
    const [before, after] = await Promise.all([
      sharp(viewBytes(original, original.json.images[index].bufferView)).metadata(),
      sharp(viewBytes(lite, image.bufferView)).metadata(),
    ]);
    assert(Math.max(after.width, after.height) <= limit, output);
    assert(after.width <= before.width && after.height <= before.height);
    assert(Math.abs(after.width / after.height - before.width / before.height) <= 1 / after.height);
    if (before.hasAlpha) assert(after.hasAlpha, `${output}: lost alpha channel`);
    images.push({ width: after.width, height: after.height, hasAlpha: after.hasAlpha });
  }
  reports.push({ input, output, passed: true, geometryBytesUnchanged: geometryBytes,
    originalBytes: original.bytes.length, liteBytes: lite.bytes.length, images });
}
console.log(JSON.stringify({ passed: true, models: reports }, null, 2));
