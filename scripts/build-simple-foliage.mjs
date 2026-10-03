import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const bytes = await readFile('public/models/plant-dypsis/scene-packed.glb');
const jsonLength = bytes.readUInt32LE(12);
const original = JSON.parse(bytes.subarray(20, 20 + jsonLength));
const json = structuredClone(original);
const material = json.materials.find(m => m.name === 'DYPSIS_LUTESCENS_Mat');
const texture = json.textures[material.pbrMetallicRoughness.baseColorTexture.index];
const source = json.images[texture.source].uri;
await mkdir('public/models/simple', { recursive: true });
await sharp(`public/models/plant-dypsis/${source}`).resize(1024, 1024, {fit:'inside',withoutEnlargement:true})
  .webp({quality:85,alphaQuality:100}).toFile('public/models/simple/foliage.webp');
for (const m of json.materials) {
  delete m.normalTexture; delete m.occlusionTexture; delete m.extensions;
  delete m.pbrMetallicRoughness.metallicRoughnessTexture;
  m.pbrMetallicRoughness.roughnessFactor = .85;
  if (m !== material) delete m.pbrMetallicRoughness.baseColorTexture;
}
material.pbrMetallicRoughness.baseColorTexture.index = 0;
json.images = [{uri:'foliage.webp',mimeType:'image/webp'}];
json.textures = [{sampler:texture.sampler,extensions:{EXT_texture_webp:{source:0}}}];
for (const key of ['extensionsUsed','extensionsRequired']) if (json[key]) json[key] = json[key].filter(e => !e.startsWith('KHR_materials_'));
json.extensionsUsed = [...new Set([...(json.extensionsUsed ?? []),'EXT_texture_webp'])];
json.extensionsRequired = [...new Set([...(json.extensionsRequired ?? []),'EXT_texture_webp'])];
const bin = bytes.subarray(20 + jsonLength);
const encoded = Buffer.from(JSON.stringify(json));
const padded = Buffer.alloc(Math.ceil(encoded.length / 4) * 4, 0x20); encoded.copy(padded);
const result = Buffer.alloc(20 + padded.length + bin.length);
for (const [offset,value] of [[0,0x46546c67],[4,2],[8,result.length],[12,padded.length],[16,0x4e4f534a]]) result.writeUInt32LE(value,offset);
padded.copy(result,20); bin.copy(result,20+padded.length);
for (const key of ['meshes','nodes','accessors','bufferViews','scenes']) assert.deepEqual(json[key],original[key]);
assert.deepEqual(result.subarray(20+padded.length),bytes.subarray(20+jsonLength));
await writeFile('public/models/simple/plant.glb',result);
console.log('Original palm geometry retained; only its leaf color/alpha texture remains at 1024px.');
