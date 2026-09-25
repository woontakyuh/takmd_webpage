import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import sharp from 'sharp';

// Match the existing 1024px phone upload, without re-indexing or re-encoding any geometry.
const input = 'public/models/fender/stratocaster-sunburst.glb';
const output = 'public/models/fender/stratocaster-phone.glb';
const bytes = await readFile(input);
const jsonLength = bytes.readUInt32LE(12);
const original = JSON.parse(bytes.subarray(20, 20 + jsonLength));
const json = structuredClone(original);
const bin = bytes.subarray(28 + jsonLength);
const align = length => Math.ceil(length / 4) * 4;
const hash = data => createHash('sha256').update(data).digest('hex');
const images = new Map();
const receipt = [];
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage();
  for (const [index, image] of json.images.entries()) {
    const view = original.bufferViews[image.bufferView];
    const source = bin.subarray(view.byteOffset, view.byteOffset + view.byteLength);
    const png = await page.evaluate(async ({ base64, mime }) => {
      const blob = await (await fetch(`data:${mime};base64,${base64}`)).blob();
      const bitmap = await createImageBitmap(blob, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
      const canvas = document.createElement('canvas');
      const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height));
      canvas.width = Math.floor(bitmap.width * scale); canvas.height = Math.floor(bitmap.height * scale);
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      return canvas.toDataURL('image/png').split(',')[1];
    }, { base64: source.toString('base64'), mime: image.mimeType });
    const resized = Buffer.from(png, 'base64');
    const encoded = await sharp(resized).webp({ lossless: true, effort: 6 }).toBuffer();
    const [before, after] = await Promise.all([sharp(resized).ensureAlpha().raw().toBuffer(), sharp(encoded).ensureAlpha().raw().toBuffer()]);
    assert.deepEqual(after, before, 'The browser-resized texture must retain every pixel');
    images.set(image.bufferView, encoded);
    image.mimeType = 'image/webp';
    receipt.push({ index, originalBytes: source.length, phoneBytes: encoded.length, pixelSha256: hash(after), exactResizedPixels: true });
  }
} finally { await browser.close(); }
for (const texture of json.textures) {
  const source = texture.extensions?.EXT_texture_webp?.source ?? texture.source;
  texture.extensions = { ...texture.extensions, EXT_texture_webp: { source } };
  delete texture.source;
}
const pieces = []; let length = 0;
for (const [index, view] of json.bufferViews.entries()) {
  const originalView = original.bufferViews[index];
  const extension = view.extensions?.EXT_meshopt_compression;
  const stored = extension ?? originalView;
  const data = images.get(index) ?? bin.subarray(stored.byteOffset, stored.byteOffset + stored.byteLength);
  if (extension) { extension.byteOffset = length; } else { view.byteOffset = length; view.byteLength = data.length; }
  const padded = Buffer.alloc(align(data.length)); data.copy(padded); pieces.push(padded); length += padded.length;
}
json.buffers[0].byteLength = length;
const jsonBytes = Buffer.from(JSON.stringify(json));
const paddedJson = Buffer.alloc(align(jsonBytes.length), 0x20); jsonBytes.copy(paddedJson);
const result = Buffer.alloc(28 + paddedJson.length + length);
for (const [offset, value] of [[0,0x46546c67],[4,2],[8,result.length],[12,paddedJson.length],[16,0x4e4f534a],[20+paddedJson.length,length],[24+paddedJson.length,0x004e4942]]) result.writeUInt32LE(value,offset);
paddedJson.copy(result,20); Buffer.concat(pieces).copy(result,28+paddedJson.length);
const resultBin = result.subarray(28 + paddedJson.length);
for (const key of ['meshes','accessors','nodes','scenes','scene','materials','asset']) assert.deepEqual(json[key],original[key], `${key} changed`);
for (const [index, view] of original.bufferViews.entries()) {
  if (images.has(index)) continue;
  const from = view.extensions?.EXT_meshopt_compression ?? view;
  const to = json.bufferViews[index].extensions?.EXT_meshopt_compression ?? json.bufferViews[index];
  assert.deepEqual(resultBin.subarray(to.byteOffset,to.byteOffset+to.byteLength), bin.subarray(from.byteOffset,from.byteOffset+from.byteLength), `Geometry buffer ${index} changed`);
}
assert(result.length < bytes.length);
await writeFile(output,result);
console.log(JSON.stringify({ input,output,originalBytes:bytes.length,phoneBytes:result.length,savedBytes:bytes.length-result.length,originalSha256:hash(bytes),phoneSha256:hash(result),geometryBytesUnchanged:true,images:receipt },null,2));
