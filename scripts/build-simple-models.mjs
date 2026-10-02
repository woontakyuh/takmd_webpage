import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { copyFile, mkdir, writeFile } from 'node:fs/promises';
const runtime = process.argv[2];
if (!runtime) throw new Error('Supply the gltf-transform tool node_modules directory.');
const require = createRequire(resolve(runtime, '../package.json'));
const { NodeIO } = await import(require.resolve('@gltf-transform/core'));
const { ALL_EXTENSIONS } = await import(require.resolve('@gltf-transform/extensions'));
const { weld, simplify, prune, meshopt } = await import(require.resolve('@gltf-transform/functions'));
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await import(require.resolve('meshoptimizer'));
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const draco = require('draco3dgltf');
const decoder = await draco.createDecoderModule();
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({'draco3d.decoder':decoder,'meshopt.encoder':MeshoptEncoder,'meshopt.decoder':MeshoptDecoder});
const jobs = [
 ['garments/physician-coat-phone.glb', 'coat.glb', 1],
 ['garments/control-gi-phone-packed.glb', 'gi.glb', 1],
 ['spine.glb', 'spine.glb', 0.22],
 ['workshop/biportal-endoscope.glb', 'endoscope.glb', 0.25],
];
const triangles = doc => doc.getRoot().listMeshes().reduce((n,m)=>n+m.listPrimitives().reduce((s,p)=>s+(p.getIndices()?.getCount()??p.getAttribute('POSITION').getCount())/3,0),0);
const report=[];
await mkdir('public/models/simple',{recursive:true});
for(const [input,output,ratio] of jobs) {
 const doc=await io.read(`public/models/${input}`), before=triangles(doc);
 // Garment hooks and sleeve decals depend on the original coordinate system.
 if (ratio === 1) {
  if (output === 'gi.glb') execFileSync(process.execPath, ['scripts/build-simple-garment.mjs', `public/models/${input}`, `public/models/simple/${output}`]);
  else await copyFile(`public/models/${input}`, `public/models/simple/${output}`);
  report.push({input,output,before,after:before});
  continue;
 }
 for(const m of doc.getRoot().listMaterials()) { m.setNormalTexture(null).setOcclusionTexture(null).setMetallicRoughnessTexture(null).setRoughnessFactor(0.85).setMetallicFactor(Math.min(0.25,m.getMetallicFactor())); }
 for (const ext of doc.getRoot().listExtensionsUsed()) if (ext.extensionName === 'KHR_draco_mesh_compression') ext.dispose();
 if (ratio < 1) await doc.transform(weld(),simplify({simplifier:MeshoptSimplifier,ratio,error:0.002,lockBorder:true}));
 await doc.transform(prune(),meshopt({encoder:MeshoptEncoder,quantizePosition:16,quantizeTexcoord:16}));
 await io.write(`public/models/simple/${output}`,doc);
 report.push({input,output,before,after:triangles(doc)});
}
await writeFile('docs/simple-office/model-budget.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
