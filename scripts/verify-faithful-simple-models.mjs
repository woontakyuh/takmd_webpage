import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import sharp from 'sharp';

assert(process.argv[2], 'Supply the gltf-transform node_modules directory');
const require = createRequire(resolve(process.argv[2], '../package.json'));
const { NodeIO } = await import(require.resolve('@gltf-transform/core'));
const { ALL_EXTENSIONS } = await import(require.resolve('@gltf-transform/extensions'));
const { MeshoptDecoder } = await import(require.resolve('meshoptimizer'));
await MeshoptDecoder.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.decoder': MeshoptDecoder });
const jobs = [
  ['eames/lounge.glb','lounge.glb'], ['eames/ottoman.glb','ottoman.glb'],
  ['florence-knoll/relaxed-two-seater-ivory-packed.glb','sofa.glb'],
  ['soft-pad/chair-packed.glb','chair.glb'], ['noguchi/table-packed.glb','table.glb'],
  ['fender/stratocaster-sunburst.glb','guitar.glb'],
  ['garments/physician-coat-phone.glb','coat.glb'], ['garments/control-gi-phone-packed.glb','gi.glb'],
  ['plant-dypsis/scene-packed.glb','plant.glb'], ['workshop/plush-pig-packed.glb','pig.glb'],
];
const textureStats = async root => Promise.all(root.listTextures().map(async texture => {
  const meta = await sharp(texture.getImage()).metadata();
  return { bytes: texture.getImage().length, width: meta.width, height: meta.height, mime: texture.getMimeType() };
}));
const receipts = [];
for (const [input, output] of jobs) {
  const source = await io.read(`public/models/${input}`);
  const target = await io.read(`public/models/simple/${output}`);
  const before = source.getRoot(), after = target.getRoot();
  assert.equal(after.listMeshes().length, before.listMeshes().length);
  assert.deepEqual(after.listNodes().map(n => [n.getName(),n.getMatrix()]), before.listNodes().map(n => [n.getName(),n.getMatrix()]));
  let triangleCount = 0;
  for (const [i, mesh] of before.listMeshes().entries()) {
    assert.equal(after.listMeshes()[i].listPrimitives().length, mesh.listPrimitives().length);
    for (const [j, primitive] of mesh.listPrimitives().entries()) {
      const rebuilt = after.listMeshes()[i].listPrimitives()[j];
      assert.deepEqual(rebuilt.getIndices()?.getArray(),primitive.getIndices()?.getArray());
      assert.deepEqual(rebuilt.listSemantics(),primitive.listSemantics());
      for (const semantic of primitive.listSemantics()) assert.deepEqual(rebuilt.getAttribute(semantic).getArray(),primitive.getAttribute(semantic).getArray(),`${output} ${semantic}`);
      triangleCount += (primitive.getIndices()?.getCount() ?? primitive.getAttribute('POSITION').getCount()) / 3;
    }
  }
  receipts.push({ input, output, passed:true, decodedIndicesPositionsNormalsUVsIdentical:true, nodeTransformsIdentical:true, originalTriangles:triangleCount, simpleTriangles:triangleCount, originalBytes:(await readFile(`public/models/${input}`)).length, simpleBytes:(await readFile(`public/models/simple/${output}`)).length, originalTextures:await textureStats(before), simpleTextures:await textureStats(after) });
}
const artifact = '.omo/evidence/faithful-models-20261003/decoded-model-validation.json';
await writeFile(artifact,JSON.stringify({invocation:process.argv.join(' '),passed:true,models:receipts},null,2)+'\n');
console.log(`PASS: ${receipts.length} models; exact decoded geometry, transforms, and image dimensions recorded in ${artifact}`);
