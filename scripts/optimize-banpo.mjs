import { createRequire } from 'node:module';
import path from 'node:path';
const [runtime, input, output] = process.argv.slice(2);
if (!runtime || !input || !output) throw new Error('Usage: node scripts/optimize-banpo.mjs <tool-node_modules> <source.glb> <output.glb>');
const require = createRequire(path.resolve(runtime, '../package.json'));
const { NodeIO } = await import(require.resolve('@gltf-transform/core'));
const { ALL_EXTENSIONS } = await import(require.resolve('@gltf-transform/extensions'));
const { weld, simplifyPrimitive, meshopt, prune } = await import(require.resolve('@gltf-transform/functions'));
const { MeshoptEncoder, MeshoptDecoder, MeshoptSimplifier } = await import(require.resolve('meshoptimizer'));
await Promise.all([MeshoptEncoder.ready, MeshoptDecoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder });
const doc = await io.read(input);
await doc.transform(weld());
const count = mesh => mesh.listPrimitives().reduce((n, p) => n + p.getIndices().getCount() / 3, 0);
const changed = [];
for (const mesh of doc.getRoot().listMeshes()) {
  if (!mesh.getName().startsWith('Riverbank tree canopies')) continue;
  const before = count(mesh);
  for (const primitive of mesh.listPrimitives()) simplifyPrimitive(primitive, { simplifier: MeshoptSimplifier, ratio: 0.5, error: 0.0001 });
  changed.push({ name: mesh.getName(), before, after: count(mesh) });
}
await doc.transform(prune(), meshopt({ encoder: MeshoptEncoder, quantizePosition: 16, quantizeTexcoord: 16 }));
await io.write(output, doc);
console.log(JSON.stringify({ changed, triangles: doc.getRoot().listMeshes().reduce((n, m) => n + count(m), 0) }, null, 2));
