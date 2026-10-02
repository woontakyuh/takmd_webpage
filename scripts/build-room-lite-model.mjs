import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const [input, output, limitArgument = '1024', mode] = process.argv.slice(2);
const limit = Number(limitArgument);
const usage = 'Usage: node scripts/build-room-lite-model.mjs SOURCE.glb LITE.glb [512|1024] [--check]';
if (input === '--help') { console.log(usage); process.exit(0); }
assert(input && output && resolve(input) !== resolve(output), usage);
assert([512, 1024].includes(limit), 'Room textures must be capped at 512 or 1024 pixels');
assert(mode === undefined || mode === '--check', 'Unknown verification mode');
const align = length => Math.ceil(length / 4) * 4;
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

function readGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67);
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(24 + jsonLength), 0x004e4942);
  const bin = bytes.subarray(28 + jsonLength);
  assert.equal(bytes.readUInt32LE(20 + jsonLength), bin.length);
  return { json: JSON.parse(bytes.subarray(20, 20 + jsonLength)), bin };
}

function viewBytes(bin, view) {
  const stored = view.extensions?.EXT_meshopt_compression ?? view;
  assert.equal(stored.buffer, 0, 'Only embedded image and geometry bytes are supported');
  const offset = stored.byteOffset ?? 0;
  assert(offset + stored.byteLength <= bin.length, 'Buffer view is outside the BIN chunk');
  return bin.subarray(offset, offset + stored.byteLength);
}

const bytes = await readFile(input);
const original = readGlb(bytes);
const json = structuredClone(original.json);
assert(json.images?.length, 'Expected embedded room textures');
const images = new Map();
const receipt = [];
// Use the same browser decode and canvas filtering as the existing phone textures.
const browser = await chromium.launch({ channel: 'chrome', headless: true, args: ['--disable-gpu'] });
try {
  const page = await browser.newPage();
  for (const [index, image] of json.images.entries()) {
    assert(Number.isInteger(image.bufferView) && !image.uri, 'External textures are unsupported');
    const source = viewBytes(original.bin, original.json.bufferViews[image.bufferView]);
    const resized = await page.evaluate(async ({ base64, mime, limit }) => {
      const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob();
      const bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const scale = Math.min(1, limit / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const result = {
        sourceWidth: bitmap.width, sourceHeight: bitmap.height,
        width: canvas.width, height: canvas.height,
        png: canvas.toDataURL('image/png').split(',')[1],
      };
      bitmap.close();
      return result;
    }, { base64: source.toString('base64'), mime: image.mimeType, limit });
    assert(Math.max(resized.width, resized.height) <= limit);
    assert(Math.abs(resized.width / resized.height - resized.sourceWidth / resized.sourceHeight) <= 1 / resized.height);
    const png = Buffer.from(resized.png, 'base64');
    const encoded = await sharp(png).webp({ quality: 85, alphaQuality: 100, effort: 6 }).toBuffer();
    const [expected, actual] = await Promise.all([
      sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
      sharp(encoded).ensureAlpha().raw().toBuffer({ resolveWithObject: true }),
    ]);
    assert.deepEqual(actual.info, expected.info, `Texture ${index} changed dimensions or channel count`);
    let rgbError = 0;
    for (let offset = 0; offset < actual.data.length; offset += 4) {
      assert.equal(actual.data[offset + 3], expected.data[offset + 3], `Texture ${index} changed alpha`);
      for (let channel = 0; channel < 3; channel++) {
        rgbError += Math.abs(actual.data[offset + channel] - expected.data[offset + channel]);
      }
    }
    images.set(image.bufferView, encoded);
    image.mimeType = 'image/webp';
    const { png: _, ...dimensions } = resized;
    receipt.push({ index, ...dimensions, originalBytes: source.length, liteBytes: encoded.length,
      resizedRgbaSha256: hash(actual.data), webpQuality: 85, exactResizedAlpha: true,
      meanRgbError: rgbError / (actual.data.length / 4 * 3) });
  }
} finally { await browser.close(); }

for (const texture of json.textures ?? []) {
  const source = texture.extensions?.EXT_texture_webp?.source ?? texture.source;
  assert(Number.isInteger(source), 'Expected a supported image source');
  texture.extensions = { ...texture.extensions, EXT_texture_webp: { source } };
  delete texture.source;
}
for (const key of ['extensionsUsed', 'extensionsRequired']) {
  json[key] = [...new Set([...(json[key] ?? []), 'EXT_texture_webp'])];
}
const pieces = [];
let length = 0;
for (const [index, view] of json.bufferViews.entries()) {
  const data = images.get(index) ?? viewBytes(original.bin, original.json.bufferViews[index]);
  const extension = view.extensions?.EXT_meshopt_compression;
  if (extension) extension.byteOffset = length;
  else { view.byteOffset = length; view.byteLength = data.length; }
  const padded = Buffer.alloc(align(data.length));
  data.copy(padded); pieces.push(padded); length += padded.length;
}
json.buffers[0].byteLength = length;
const jsonBytes = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(align(jsonBytes.length), 0x20);
jsonBytes.copy(paddedJson);
const result = Buffer.alloc(28 + paddedJson.length + length);
for (const [offset, value] of [[0, 0x46546c67], [4, 2], [8, result.length],
  [12, paddedJson.length], [16, 0x4e4f534a], [20 + paddedJson.length, length],
  [24 + paddedJson.length, 0x004e4942]]) result.writeUInt32LE(value, offset);
paddedJson.copy(result, 20);
Buffer.concat(pieces).copy(result, 28 + paddedJson.length);
const rebuilt = readGlb(result);
for (const key of ['meshes', 'accessors', 'nodes', 'scenes', 'scene', 'materials', 'samplers',
  'skins', 'animations', 'cameras', 'asset', 'extensions', 'extras']) {
  assert.deepEqual(rebuilt.json[key], original.json[key], `${key} changed`);
}
const geometry = [];
for (const [index, view] of original.json.bufferViews.entries()) {
  if (images.has(index)) continue;
  const before = viewBytes(original.bin, view);
  const after = viewBytes(rebuilt.bin, rebuilt.json.bufferViews[index]);
  assert.deepEqual(after, before, `Geometry buffer ${index} changed`);
  geometry.push({ bufferView: index, byteLength: before.length, sha256: hash(before) });
}
assert(result.length < bytes.length, `A lite derivative must be smaller (${result.length} >= ${bytes.length} bytes)`);
if (mode === '--check') assert.deepEqual(await readFile(output), result, 'Saved derivative is not reproducible');
else await writeFile(output, result);
console.log(JSON.stringify({ input, output, limit, mode: mode ?? 'write',
  originalBytes: bytes.length, liteBytes: result.length, savedBytes: bytes.length - result.length,
  originalSha256: hash(bytes), liteSha256: hash(result), geometryBytesUnchanged: true,
  originalRgbaBytes: receipt.reduce((sum, image) => sum + image.sourceWidth * image.sourceHeight * 4, 0),
  liteRgbaBytes: receipt.reduce((sum, image) => sum + image.width * image.height * 4, 0),
  images: receipt, geometry }, null, 2));
