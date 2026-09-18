import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const usage = 'bun scripts/optimize-oak-texture.mjs INPUT.jpg OUTPUT.webp';
const [input, output] = process.argv.slice(2);
if (input === '--help') {
  console.log(usage);
  process.exit(0);
}
assert(input && output, usage);
assert.notEqual(input, output, 'Preserve the original input');
const original = await readFile(input);
const before = await sharp(original).raw().toBuffer({ resolveWithObject: true });
assert.equal(before.info.width, 2048);
assert.equal(before.info.height, 2048);
assert.equal(before.info.channels, 3);
const encoded = await sharp(original).keepMetadata().webp({ quality: 98, smartSubsample: true, effort: 6 }).toBuffer();
const after = await sharp(encoded).raw().toBuffer({ resolveWithObject: true });
assert.deepEqual(after.info, before.info);
let maximumDelta = 0;
let squares = 0;
for (let index = 0; index < before.data.length; index++) {
  const delta = Math.abs(after.data[index] - before.data[index]);
  maximumDelta = Math.max(maximumDelta, delta);
  squares += delta * delta;
}
const rmse = Math.sqrt(squares / before.data.length);
const psnr = 20 * Math.log10(255 / rmse);
assert(maximumDelta <= 8 && psnr >= 45, 'Preserve oak grain and color fidelity');
assert(encoded.length < original.length * 0.6, 'Require a meaningful transfer reduction');
await writeFile(output, encoded);
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
console.log(JSON.stringify({ input, output, originalBytes: original.length, compressedBytes: encoded.length, savedBytes: original.length - encoded.length, originalSha256: hash(original), compressedSha256: hash(encoded), ...before.info, maximumDelta, rmse, psnr }, null, 2));
