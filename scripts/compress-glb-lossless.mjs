import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { MeshoptDecoder } from 'three-stdlib';
import sharp from 'sharp';

const EXTENSION = 'EXT_meshopt_compression';
const COMPONENT_BYTES = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
const ELEMENT_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT2: 4, MAT3: 9, MAT4: 16 };
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
const alignedLength = (length) => Math.ceil(length / 4) * 4;

function readGlb(bytes) {
  assert.equal(bytes.readUInt32LE(0), 0x46546c67, 'Expected a GLB file');
  assert.equal(bytes.readUInt32LE(4), 2, 'Expected glTF 2.0');
  assert.equal(bytes.readUInt32LE(8), bytes.length, 'Invalid GLB byte length');
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a, 'Expected the JSON chunk first');
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString());
  assert.equal(bytes.readUInt32LE(24 + jsonLength), 0x004e4942, 'Expected a BIN chunk');
  return { json, bin: bytes.subarray(28 + jsonLength) };
}

function writeGlb({ json, bin }) {
  const text = Buffer.from(JSON.stringify(json));
  const paddedJson = Buffer.alloc(alignedLength(text.length), 0x20);
  text.copy(paddedJson);
  const result = Buffer.alloc(28 + paddedJson.length + alignedLength(bin.length));
  result.writeUInt32LE(0x46546c67, 0);
  result.writeUInt32LE(2, 4);
  result.writeUInt32LE(result.length, 8);
  result.writeUInt32LE(paddedJson.length, 12);
  result.writeUInt32LE(0x4e4f534a, 16);
  paddedJson.copy(result, 20);
  result.writeUInt32LE(alignedLength(bin.length), 20 + paddedJson.length);
  result.writeUInt32LE(0x004e4942, 24 + paddedJson.length);
  bin.copy(result, 28 + paddedJson.length);
  return result;
}

function semanticJson(json) {
  const semantic = structuredClone(json);
  delete semantic.buffers;
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    semantic[key] = (semantic[key] ?? []).filter((value) => value !== EXTENSION);
    if (!semantic[key].length) delete semantic[key];
  }
  for (const view of semantic.bufferViews) {
    delete view.buffer;
    delete view.byteOffset;
    if (view.extensions?.[EXTENSION]) {
      delete view.extensions[EXTENSION];
      if (!Object.keys(view.extensions).length) delete view.extensions;
    }
  }
  return semantic;
}

const [input, output, encoderModule, imageMode] = process.argv.slice(2);
const usage = 'Usage: node scripts/compress-glb-lossless.mjs INPUT.glb OUTPUT.glb /absolute/path/to/meshopt_encoder.js [--lossless-webp]';
if (input === '--help') {
  console.log(usage);
  process.exit(0);
}
assert(input && output && encoderModule, usage);
assert(imageMode === undefined || imageMode === '--lossless-webp', 'Unknown image mode');
assert.notEqual(input, output, 'Keep the source file as a private backup');
const { MeshoptEncoder } = await import(pathToFileURL(encoderModule).href);
const decoder = typeof MeshoptDecoder === 'function' ? MeshoptDecoder() : MeshoptDecoder;
await Promise.all([MeshoptEncoder.ready, decoder.ready]);
assert(decoder.supported, 'The installed Drei/three-stdlib decoder must support Meshopt');
const originalBytes = await readFile(input);
const original = readGlb(originalBytes);
assert.equal(original.json.buffers.length, 1, 'Only standalone GLB input is supported');
assert.equal(original.json.buffers[0].uri, undefined, 'External buffers are unsupported');
assert(!original.json.extensionsUsed?.includes(EXTENSION), 'Start from the uncompressed original');
const json = structuredClone(original.json);
const expected = structuredClone(original.json);
const imageViews = new Set((json.images ?? []).map((image) => image.bufferView));
const convertedImages = new Map();
const indexAccessors = new Set(json.meshes.flatMap((mesh) => mesh.primitives.map((primitive) => primitive.indices)));
const pieces = [];
const views = [];
let storedLength = 0;
let fallbackLength = 0;

for (const [index, view] of json.bufferViews.entries()) {
  assert.equal(view.buffer, 0, 'Every source view must use the embedded buffer');
  const source = original.bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength);
  const accessors = json.accessors.flatMap((accessor, accessorIndex) => accessor.bufferView === index ? [{ accessor, accessorIndex }] : []);
  let stored = source;
  let mode;
  const imageIndex = (json.images ?? []).findIndex((image) => image.bufferView === index);
  if (imageMode && imageIndex >= 0 && json.images[imageIndex].mimeType === 'image/png') {
    const metadata = await sharp(source).metadata();
    assert.equal(metadata.depth, 'uchar', 'Lossless WebP conversion only supports 8-bit source channels');
    const rawSource = await sharp(source).raw().toBuffer({ resolveWithObject: true });
    const webp = await sharp(source).keepMetadata().webp({ lossless: true, effort: 6 }).toBuffer();
    const rawWebp = await sharp(webp).raw().toBuffer({ resolveWithObject: true });
    assert.deepEqual(rawWebp, rawSource, `Lossless WebP changed pixels or dimensions in image ${imageIndex}`);
    if (webp.length < source.length) {
      stored = webp;
      convertedImages.set(index, { imageIndex, pixelSha256: hash(rawSource.data), ...rawSource.info });
      for (const document of [json, expected]) {
        document.images[imageIndex].mimeType = 'image/webp';
        document.bufferViews[index].byteLength = webp.length;
        for (const texture of document.textures.filter((texture) => texture.source === imageIndex)) {
          texture.extensions = { ...texture.extensions, EXT_texture_webp: { source: imageIndex } };
          delete texture.source;
        }
        for (const key of ['extensionsUsed', 'extensionsRequired']) {
          document[key] = [...new Set([...(document[key] ?? []), 'EXT_texture_webp'])];
        }
      }
    }
  }
  if (accessors.length && !imageViews.has(index)) {
    const isIndex = accessors.every(({ accessorIndex }) => indexAccessors.has(accessorIndex));
    const strides = accessors.map(({ accessor }) => COMPONENT_BYTES[accessor.componentType] * ELEMENT_COMPONENTS[accessor.type]);
    const stride = view.byteStride ?? strides[0];
    assert(view.byteStride || strides.every((value) => value === stride), 'Mixed tightly packed accessor types are unsupported');
    assert.equal(view.byteLength % stride, 0, 'Each compressed view must contain complete elements');
    mode = isIndex ? 'INDICES' : 'ATTRIBUTES';
    // Version 0 and unfiltered bytes remain compatible with the app's bundled decoder.
    const encoded = MeshoptEncoder.encodeGltfBuffer(source, view.byteLength / stride, stride, mode, 0);
    if (encoded.length < source.length) {
      stored = Buffer.from(encoded);
      view.buffer = 1;
      view.byteOffset = fallbackLength;
      fallbackLength += alignedLength(view.byteLength);
      view.extensions = { ...view.extensions, [EXTENSION]: {
        buffer: 0, byteOffset: storedLength, byteLength: encoded.length,
        byteStride: stride, count: view.byteLength / stride, mode, filter: 'NONE',
      } };
    }
  }
  if (!view.extensions?.[EXTENSION]) view.byteOffset = storedLength;
  const padded = Buffer.alloc(alignedLength(stored.length));
  stored.copy(padded);
  pieces.push(padded);
  storedLength += padded.length;
  views.push({ index, kind: imageViews.has(index) ? 'image' : 'geometry', originalBytes: source.length, storedBytes: stored.length, sha256: hash(source), compressed: stored !== source, mode, decodedImage: convertedImages.get(index) });
}

assert(fallbackLength > 0, 'Input did not contain compressible geometry');
json.buffers = [{ ...json.buffers[0], byteLength: storedLength }, { byteLength: fallbackLength, extensions: { [EXTENSION]: { fallback: true } } }];
json.extensionsUsed = [...(json.extensionsUsed ?? []), EXTENSION];
json.extensionsRequired = [...(json.extensionsRequired ?? []), EXTENSION];
const result = writeGlb({ json, bin: Buffer.concat(pieces) });
const packed = readGlb(result);
assert.deepEqual(semanticJson(packed.json), semanticJson(expected), 'Scene, accessor, material or texture semantics changed');

for (const [index, view] of packed.json.bufferViews.entries()) {
  const extension = view.extensions?.[EXTENSION];
  let decoded;
  if (extension) {
    const compressed = packed.bin.subarray(extension.byteOffset, extension.byteOffset + extension.byteLength);
    decoded = Buffer.alloc(view.byteLength);
    decoder.decodeGltfBuffer(decoded, extension.count, extension.byteStride, compressed, extension.mode, extension.filter);
  } else {
    decoded = packed.bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);
  }
  const source = original.json.bufferViews[index];
  const expected = original.bin.subarray(source.byteOffset ?? 0, (source.byteOffset ?? 0) + source.byteLength);
  if (convertedImages.has(index)) {
    const [actualPixels, expectedPixels] = await Promise.all([sharp(decoded).raw().toBuffer({ resolveWithObject: true }), sharp(expected).raw().toBuffer({ resolveWithObject: true })]);
    assert.deepEqual(actualPixels, expectedPixels, `Image ${index} changed pixels after repacking`);
  } else {
    assert.deepEqual(decoded, expected, `Buffer view ${index} changed after runtime decoding`);
  }
}

assert(result.length < originalBytes.length, 'Compression must reduce the file size');
await writeFile(output, result);
console.log(JSON.stringify({ input, output, originalBytes: originalBytes.length, compressedBytes: result.length, savedBytes: originalBytes.length - result.length, originalSha256: hash(originalBytes), compressedSha256: hash(result), semanticSha256: hash(JSON.stringify(semanticJson(json))), exactRuntimeDecodedBufferViews: views.length - convertedImages.size, exactDecodedImageCount: convertedImages.size, views }, null, 2));
