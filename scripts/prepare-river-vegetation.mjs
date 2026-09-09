import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const root = process.cwd();
const evidenceDir = path.join(root, ".omo/evidence/river-quality-2026-09-09/vegetation");
const sourceDir = path.join(evidenceDir, "source");
const textureDir = path.join(sourceDir, "textures");
const outputDir = path.join(root, "public/models/han-river/vegetation");
const outputPath = path.join(outputDir, "tree-small-02-riverbank.glb");
const baseUrl = "https://dl.polyhaven.org/file/ph-assets/Models";

const sources = [
  ["tree_small_02_1k.gltf", `${baseUrl}/gltf/1k/tree_small_02/tree_small_02_1k.gltf`, "63f42b19687332f7b3a5c8b531734d8e"],
  ["tree_small_02.bin", `${baseUrl}/gltf/8k/tree_small_02/tree_small_02.bin`, "7a7019a87e6fe0d7475c0fa2e08d8962"],
  ["textures/tree_small_02_branch_nor_gl_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_branch_nor_gl_1k.jpg`, "00a3eed0d4d28e7e890d9ec6ac0619af"],
  ["textures/tree_small_02_branch_diff_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_branch_diff_1k.jpg`, "88b531469f5dba2fc44ca85df3776e7c"],
  ["textures/tree_small_02_branch_arm_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_branch_arm_1k.jpg`, "9ec3d8428295d87ae363bf0d1e0a8288"],
  ["textures/tree_small_02_leaves_nor_gl_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_leaves_nor_gl_1k.jpg`, "b06c87e73f54d9654f66d67e9de7aa85"],
  ["textures/tree_small_02_leaves_diff_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_leaves_diff_1k.jpg`, "315cbc2cebfb399e649ccd39112c109a"],
  ["textures/tree_small_02_leaves_arm_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_leaves_arm_1k.jpg`, "3dad5bafc732f7692db32a262530bbab"],
  ["textures/tree_small_02_nor_gl_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_nor_gl_1k.jpg`, "115a20da8621cd3e034e9b1bbe574746"],
  ["textures/tree_small_02_diff_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_diff_1k.jpg`, "a7287a3f4e7f0d4577cb949b245f5b14"],
  ["textures/tree_small_02_arm_1k.jpg", `${baseUrl}/jpg/1k/tree_small_02/tree_small_02_arm_1k.jpg`, "44b6ed4bf32d7cd67cb3e9d5faeacc38"],
  ["textures/tree_small_02_leaves_alpha_1k.png", `${baseUrl}/png/1k/tree_small_02/tree_small_02_leaves_alpha_1k.png`, "63199ba87a9e8928424bd8c3b8017bd0"],
];

await Promise.all([mkdir(textureDir, { recursive: true }), mkdir(outputDir, { recursive: true })]);
for (const [relativePath, url, md5] of sources) {
  const localPath = path.join(sourceDir, relativePath);
  let bytes;
  try {
    bytes = await readFile(localPath);
  } catch {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
    bytes = Buffer.from(await response.arrayBuffer());
    await mkdir(path.dirname(localPath), { recursive: true });
    await writeFile(localPath, bytes);
  }
  const actualMd5 = createHash("md5").update(bytes).digest("hex");
  if (actualMd5 !== md5) throw new Error(`MD5 mismatch for ${relativePath}: ${actualMd5}`);
}

const stage1Path = path.join(evidenceDir, "tree-stage1.glb");
const cli = ["--yes", "--package=@gltf-transform/cli@4.5.0", "--", "gltf-transform"];
execFileSync("npx", [...cli, "simplify", path.join(sourceDir, "tree_small_02_1k.gltf"), stage1Path, "--ratio", "0.003", "--error", "0.1", "--lock-border", "false"], { stdio: "inherit" });

const parsed = parseGlb(await readFile(stage1Path));
const primitiveRecords = parsed.json.meshes[0].primitives.map((primitive) => readPrimitive(parsed, primitive));
for (const record of primitiveRecords) {
  if (record.materialName.includes("branches")) record.attributes.TEXCOORD_0 = record.attributes.TEXCOORD_1;
  delete record.attributes.TEXCOORD_1;
}
const leaves = primitiveRecords.find((record) => record.materialName.includes("leaves"));
if (!leaves) throw new Error("Leaf primitive not found");
const leafSelection = selectLeafComponents(leaves, 2_500);
leaves.indices = leafSelection.indices;

const branchTexture = await sharp(path.join(textureDir, "tree_small_02_branch_diff_1k.jpg"))
  .resize(512, 512, { fit: "fill" }).webp({ quality: 76, smartSubsample: true }).toBuffer();
const trunkTexture = await sharp(path.join(textureDir, "tree_small_02_diff_1k.jpg"))
  .resize(512, 512, { fit: "fill" }).webp({ quality: 76, smartSubsample: true }).toBuffer();
const leafAlpha = await sharp(path.join(textureDir, "tree_small_02_leaves_alpha_1k.png"))
  .resize(512, 512, { fit: "fill", kernel: "lanczos3" }).greyscale().raw().toBuffer();
const leafRgb = await sharp(path.join(textureDir, "tree_small_02_leaves_diff_1k.jpg"))
  .resize(512, 512, { fit: "fill" }).removeAlpha().raw().toBuffer();
const leafRgba = Buffer.alloc(512 * 512 * 4);
for (let pixel = 0; pixel < 512 * 512; pixel += 1) {
  leafRgb.copy(leafRgba, pixel * 4, pixel * 3, pixel * 3 + 3); leafRgba[pixel * 4 + 3] = leafAlpha[pixel];
}
const leafTexture = await sharp(leafRgba, { raw: { width: 512, height: 512, channels: 4 } })
  .webp({ quality: 78, alphaQuality: 100, smartSubsample: true }).toBuffer();

const result = buildGlb(primitiveRecords, [branchTexture, leafTexture, trunkTexture]);
await writeFile(outputPath, result.glb);
const outputBytes = (await stat(outputPath)).size;
if (result.triangleCount > 8_000) throw new Error(`Triangle budget exceeded: ${result.triangleCount}`);
if (outputBytes > 1_500_000) throw new Error(`Asset budget exceeded: ${outputBytes} bytes`);

const report = {
  output: path.relative(root, outputPath),
  outputBytes,
  triangles: result.triangleCount,
  primitives: result.primitiveStats,
  canopy: {
    sourceComponents: leafSelection.sourceComponents,
    selectedComponents: leafSelection.selectedComponents,
    occupiedCells: leafSelection.occupiedCells,
    triangles: leafSelection.indices.length / 3,
  },
  textures: [
    { material: "branches", width: 512, height: 512, mimeType: "image/webp", bytes: branchTexture.length },
    { material: "leaves", width: 512, height: 512, mimeType: "image/webp", bytes: leafTexture.length, alpha: true },
    { material: "trunk", width: 512, height: 512, mimeType: "image/webp", bytes: trunkTexture.length },
  ],
  source: { asset: "tree_small_02", name: "Tree Small 02", author: "Rico Cilliers", license: "CC0" },
};
await writeFile(path.join(evidenceDir, "preparation-report.json"), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));

function parseGlb(bytes) {
  const jsonLength = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString("utf8"));
  const binaryOffset = 20 + jsonLength + 8;
  return { json, binary: bytes.subarray(binaryOffset) };
}

function readPrimitive(glb, primitive) {
  const materialName = glb.json.materials[primitive.material].name;
  const attributes = Object.fromEntries(Object.entries(primitive.attributes).map(([semantic, accessorIndex]) => [semantic, readAccessor(glb, accessorIndex)]));
  return { materialName, attributes, indices: readAccessor(glb, primitive.indices).array };
}

function readAccessor(glb, accessorIndex) {
  const accessor = glb.json.accessors[accessorIndex];
  const view = glb.json.bufferViews[accessor.bufferView];
  const components = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 }[accessor.type];
  const componentBytes = { 5123: 2, 5125: 4, 5126: 4 }[accessor.componentType];
  const ArrayType = { 5123: Uint16Array, 5125: Uint32Array, 5126: Float32Array }[accessor.componentType];
  const stride = view.byteStride ?? components * componentBytes;
  const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
  const array = new ArrayType(accessor.count * components);
  const source = new DataView(glb.binary.buffer, glb.binary.byteOffset, glb.binary.byteLength);
  for (let index = 0; index < accessor.count; index += 1) {
    for (let component = 0; component < components; component += 1) {
      const byteOffset = offset + index * stride + component * componentBytes;
      array[index * components + component] = accessor.componentType === 5126
        ? source.getFloat32(byteOffset, true)
        : accessor.componentType === 5125 ? source.getUint32(byteOffset, true) : source.getUint16(byteOffset, true);
    }
  }
  return { array, components };
}

function selectLeafComponents(record, triangleBudget) {
  const indices = record.indices;
  const vertexCount = record.attributes.POSITION.array.length / 3;
  const parent = Uint32Array.from({ length: vertexCount }, (_, index) => index);
  const find = (value) => {
    let rootValue = value;
    while (parent[rootValue] !== rootValue) rootValue = parent[rootValue];
    while (parent[value] !== value) {
      const next = parent[value]; parent[value] = rootValue; value = next;
    }
    return rootValue;
  };
  const unite = (left, right) => { const a = find(left); const b = find(right); if (a !== b) parent[b] = a; };
  for (let index = 0; index < indices.length; index += 3) {
    unite(indices[index], indices[index + 1]); unite(indices[index], indices[index + 2]);
  }
  const grouped = new Map();
  for (let index = 0; index < indices.length; index += 3) {
    const key = find(indices[index]);
    const triangles = grouped.get(key) ?? [];
    triangles.push(indices[index], indices[index + 1], indices[index + 2]);
    grouped.set(key, triangles);
  }
  const positions = record.attributes.POSITION.array;
  const components = [...grouped.values()].map((triangles) => {
    let x = 0; let y = 0; let z = 0;
    for (const vertex of triangles) { x += positions[vertex * 3]; y += positions[vertex * 3 + 1]; z += positions[vertex * 3 + 2]; }
    return { triangles, centroid: [x / triangles.length, y / triangles.length, z / triangles.length] };
  });
  const bounds = [0, 1, 2].map((axis) => [Math.min(...components.map((item) => item.centroid[axis])), Math.max(...components.map((item) => item.centroid[axis]))]);
  const cells = new Map();
  for (const component of components) {
    const key = component.centroid.map((value, axis) => Math.min(5, Math.floor(6 * (value - bounds[axis][0]) / Math.max(0.0001, bounds[axis][1] - bounds[axis][0])))).join(":");
    const list = cells.get(key) ?? [];
    list.push(component); cells.set(key, list);
  }
  for (const list of cells.values()) list.sort((a, b) => hashCentroid(a.centroid) - hashCentroid(b.centroid));
  const selected = [];
  const orderedCells = [...cells.keys()].sort();
  let triangleCount = 0; let depth = 0; let progressed = true;
  while (progressed) {
    progressed = false;
    for (const key of orderedCells) {
      const component = cells.get(key)[depth];
      if (!component) continue;
      progressed = true;
      const count = component.triangles.length / 3;
      if (triangleCount + count <= triangleBudget) { selected.push(component); triangleCount += count; }
    }
    depth += 1;
  }
  return { indices: Uint32Array.from(selected.flatMap((item) => item.triangles)), sourceComponents: components.length, selectedComponents: selected.length, occupiedCells: cells.size };
}

function hashCentroid(values) {
  return values.reduce((hash, value) => ((hash ^ Math.round(value * 100_000)) * 16_777_619) >>> 0, 2_166_136_261);
}

function buildGlb(records, images) {
  const chunks = []; const bufferViews = []; const accessors = []; const primitives = []; const primitiveStats = [];
  const append = (bytes, target) => {
    const padding = Buffer.alloc((4 - (bytes.length % 4)) % 4);
    const byteOffset = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
    chunks.push(bytes, padding);
    bufferViews.push({ buffer: 0, byteOffset, byteLength: bytes.length, ...(target ? { target } : {}) });
    return bufferViews.length - 1;
  };
  for (let materialIndex = 0; materialIndex < records.length; materialIndex += 1) {
    const record = records[materialIndex];
    const referenced = [...new Set(record.indices)].sort((a, b) => a - b);
    const remap = new Map(referenced.map((value, index) => [value, index]));
    const attributes = {};
    for (const [semantic, source] of Object.entries(record.attributes)) {
      const compact = new Float32Array(referenced.length * source.components);
      referenced.forEach((sourceIndex, targetIndex) => {
        for (let component = 0; component < source.components; component += 1) compact[targetIndex * source.components + component] = source.array[sourceIndex * source.components + component];
      });
      const bufferView = append(Buffer.from(compact.buffer), 34962);
      const accessor = { bufferView, componentType: 5126, count: referenced.length, type: `VEC${source.components}` };
      if (semantic === "POSITION") {
        accessor.min = [0, 1, 2].map((axis) => Math.min(...referenced.map((_, index) => compact[index * 3 + axis])));
        accessor.max = [0, 1, 2].map((axis) => Math.max(...referenced.map((_, index) => compact[index * 3 + axis])));
      }
      accessors.push(accessor); attributes[semantic] = accessors.length - 1;
    }
    const compactIndices = Uint16Array.from(record.indices, (value) => remap.get(value));
    const indexView = append(Buffer.from(compactIndices.buffer), 34963);
    accessors.push({ bufferView: indexView, componentType: 5123, count: compactIndices.length, type: "SCALAR" });
    primitives.push({ attributes, indices: accessors.length - 1, material: materialIndex, mode: 4 });
    primitiveStats.push({ material: record.materialName, triangles: compactIndices.length / 3, vertices: referenced.length });
  }
  const imageViews = images.map((bytes) => append(bytes));
  const binary = Buffer.concat(chunks);
  const json = {
    asset: { version: "2.0", generator: "takmd prepare-river-vegetation", extras: { sourceAsset: "Poly Haven tree_small_02", sourceLicense: "CC0" } },
    scene: 0, scenes: [{ nodes: [0] }], nodes: [{ name: "tree_small_02_riverbank", mesh: 0 }],
    meshes: [{ name: "tree_small_02_riverbank_mesh", primitives }],
    materials: [
      { name: "tree_small_02_branches", pbrMetallicRoughness: { baseColorTexture: { index: 0, extensions: { KHR_texture_transform: { offset: [0, 0.4000001], scale: [3, 0.5999999] } } }, metallicFactor: 0, roughnessFactor: 0.86 } },
      { name: "tree_small_02_leaves", alphaMode: "MASK", alphaCutoff: 0.45, doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 1 }, metallicFactor: 0, roughnessFactor: 0.82 } },
      { name: "tree_small_02_trunk", pbrMetallicRoughness: { baseColorTexture: { index: 2 }, metallicFactor: 0, roughnessFactor: 0.9 } },
    ],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 10497, wrapT: 10497 }],
    images: imageViews.map((bufferView, index) => ({ name: ["branch_basecolor_512", "leaves_basecolor_alpha_512", "trunk_basecolor_512"][index], bufferView, mimeType: "image/webp" })),
    textures: imageViews.map((_, index) => ({ sampler: 0, extensions: { EXT_texture_webp: { source: index } } })),
    accessors, bufferViews, buffers: [{ byteLength: binary.length }],
    extensionsUsed: ["KHR_texture_transform", "EXT_texture_webp"], extensionsRequired: ["EXT_texture_webp"],
  };
  const jsonBytes = Buffer.from(JSON.stringify(json));
  const jsonPadding = Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20);
  const totalLength = 12 + 8 + jsonBytes.length + jsonPadding.length + 8 + binary.length;
  const header = Buffer.alloc(12); header.writeUInt32LE(0x46546c67, 0); header.writeUInt32LE(2, 4); header.writeUInt32LE(totalLength, 8);
  const jsonHeader = Buffer.alloc(8); jsonHeader.writeUInt32LE(jsonBytes.length + jsonPadding.length, 0); jsonHeader.writeUInt32LE(0x4e4f534a, 4);
  const binHeader = Buffer.alloc(8); binHeader.writeUInt32LE(binary.length, 0); binHeader.writeUInt32LE(0x004e4942, 4);
  return { glb: Buffer.concat([header, jsonHeader, jsonBytes, jsonPadding, binHeader, binary]), triangleCount: primitiveStats.reduce((sum, item) => sum + item.triangles, 0), primitiveStats };
}
