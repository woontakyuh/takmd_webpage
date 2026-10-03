import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import sharp from 'sharp';

const evidence = '.omo/evidence/faithful-models-20261003';
await mkdir(evidence, { recursive: true });
await mkdir('public/models/simple', { recursive: true });
const jobs = [
  ['eames/lounge.glb', 'lounge.glb'],
  ['eames/ottoman.glb', 'ottoman.glb'],
  ['florence-knoll/relaxed-two-seater-ivory-packed.glb', 'sofa.glb'],
  ['soft-pad/chair-packed.glb', 'chair.glb'],
  ['noguchi/table-packed.glb', 'table.glb'],
];
const align = n => Math.ceil(n / 4) * 4;
const unpack = bytes => {
  const length = bytes.readUInt32LE(12);
  return { json: JSON.parse(bytes.subarray(20, 20 + length)), bin: bytes.subarray(28 + length) };
};
const triangles = json => json.meshes.reduce((sum, mesh) => sum + mesh.primitives.reduce((n, p) => n + json.accessors[p.indices ?? p.attributes.POSITION].count / 3, 0), 0);
const report = [];
for (const [input, output] of jobs) {
  const bytes = await readFile(`public/models/${input}`);
  const { json: original, bin } = unpack(bytes);
  const json = structuredClone(original);
  const imageViews = new Set((json.images ?? []).map(image => image.bufferView));
  const mapping = new Map();
  const chunks = [];
  let length = 0;
  json.bufferViews = json.bufferViews.flatMap((view, index) => {
    if (imageViews.has(index)) return [];
    mapping.set(index, mapping.size);
    const stored = view.extensions?.EXT_meshopt_compression ?? view;
    const data = bin.subarray(stored.byteOffset ?? 0, (stored.byteOffset ?? 0) + stored.byteLength);
    const padded = Buffer.alloc(align(data.length)); data.copy(padded);
    stored.byteOffset = length;
    length += padded.length;
    chunks.push(padded);
    return [view];
  });
  for (const accessor of json.accessors) {
    assert(!accessor.sparse, 'Sparse accessors require explicit remapping');
    if (accessor.bufferView !== undefined) accessor.bufferView = mapping.get(accessor.bufferView);
  }
  for (const material of json.materials) {
    const pbr = material.pbrMetallicRoughness ??= {};
    if (pbr.baseColorTexture) {
      const texture = original.textures[pbr.baseColorTexture.index];
      const image = original.images[texture.extensions?.EXT_texture_webp?.source ?? texture.source];
      const view = original.bufferViews[image.bufferView];
      const average = await sharp(bin.subarray(view.byteOffset ?? 0, (view.byteOffset ?? 0) + view.byteLength)).resize(1, 1).removeAlpha().raw().toBuffer();
      const factor = pbr.baseColorFactor ?? [1, 1, 1, 1];
      pbr.baseColorFactor = [...Array.from(average.subarray(0, 3), (value, channel) => {
        const srgb = value / 255;
        return factor[channel] * (srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4);
      }), factor[3]];
    }
    delete pbr.baseColorTexture;
    delete pbr.metallicRoughnessTexture;
    delete material.normalTexture;
    delete material.occlusionTexture;
    delete material.emissiveTexture;
    delete material.extensions;
    pbr.roughnessFactor = material.alphaMode === 'BLEND' ? 0.28 : 0.85;
    pbr.metallicFactor = Math.min(pbr.metallicFactor ?? 1, 0.25);
  }
  delete json.images; delete json.textures; delete json.samplers;
  for (const key of ['extensionsUsed', 'extensionsRequired']) {
    if (json[key]) json[key] = json[key].filter(name => !name.startsWith('KHR_materials_') && name !== 'KHR_texture_transform' && name !== 'EXT_texture_webp');
  }
  json.buffers[0].byteLength = length;
  const encoded = Buffer.from(JSON.stringify(json));
  const padded = Buffer.alloc(align(encoded.length), 0x20); encoded.copy(padded);
  const result = Buffer.alloc(28 + padded.length + length);
  for (const [offset, value] of [[0,0x46546c67],[4,2],[8,result.length],[12,padded.length],[16,0x4e4f534a],[20+padded.length,length],[24+padded.length,0x004e4942]]) result.writeUInt32LE(value,offset);
  padded.copy(result,20); Buffer.concat(chunks).copy(result,28+padded.length);
  const rebuilt = unpack(result);
  for (const [oldIndex, newIndex] of mapping) {
    const from = original.bufferViews[oldIndex].extensions?.EXT_meshopt_compression ?? original.bufferViews[oldIndex];
    const to = rebuilt.json.bufferViews[newIndex].extensions?.EXT_meshopt_compression ?? rebuilt.json.bufferViews[newIndex];
    assert.deepEqual(bin.subarray(from.byteOffset ?? 0,(from.byteOffset ?? 0)+from.byteLength),rebuilt.bin.subarray(to.byteOffset ?? 0,(to.byteOffset ?? 0)+to.byteLength));
  }
  for (const key of ['meshes','nodes','scenes','scene']) assert.deepEqual(json[key], original[key]);
  assert.equal(triangles(json), triangles(original));
  await writeFile(`public/models/simple/${output}`, result);
  report.push({input, output, originalBytes:bytes.length, simpleBytes:result.length, originalTriangles:triangles(original), simpleTriangles:triangles(json), geometryBytesIdentical:true, sceneHierarchyIdentical:true});
}
const guitar = execFileSync(process.execPath, ['scripts/build-simple-garment.mjs', 'public/models/fender/stratocaster-sunburst.glb', 'public/models/simple/guitar.glb'], {encoding:'utf8'});
await writeFile(`${evidence}/guitar-texture-only.json`,guitar);
const guitarReceipt = JSON.parse(guitar);
const guitarTriangles = triangles(unpack(await readFile(guitarReceipt.output)).json);
report.push({...guitarReceipt,originalTriangles:guitarTriangles,simpleTriangles:guitarTriangles});
await writeFile(`${evidence}/model-budget.json`, JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
