// Phone copies of the room's largest raster textures: longest edge 1024 px, WebP. A phone's GPU cap already resizes
// anything larger to 1024 before upload, so the extra pixels were only download. Writes <name>-phone.webp next to
// each source and the manifest src/components/studio/phone-images.manifest.json (source path → phone path).
// Run after adding or replacing any file listed in src/components/studio/phone-images.json.
import sharp from 'sharp';
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const list = JSON.parse(readFileSync(join(root, 'src/components/studio/phone-images.json'), 'utf8'));
const manifest = {};
let before = 0, after = 0;
for (const path of list) {
  const source = join(root, 'public', path);
  const target = path.replace(/\.(webp|png|jpe?g)$/i, '-phone.webp');
  const image = sharp(source);
  const meta = await image.metadata();
  const longest = Math.max(meta.width ?? 0, meta.height ?? 0);
  const alpha = meta.hasAlpha === true;
  const pipeline = longest > 1024 ? image.resize({ width: meta.width >= meta.height ? 1024 : undefined, height: meta.height > meta.width ? 1024 : undefined, withoutEnlargement: true }) : image;
  await pipeline.webp({ quality: 82, alphaQuality: 90, effort: 5, ...(alpha ? {} : {}) }).toFile(join(root, 'public', target));
  const a = statSync(source).size, b = statSync(join(root, 'public', target)).size;
  before += a; after += b;
  // Only a copy that is actually smaller is served; the few that are not (some roughness maps) keep their original.
  if (b < a) manifest[path] = target;
  console.log(`${String(Math.round(a / 1024)).padStart(5)} → ${String(Math.round(b / 1024)).padStart(5)} KB  ${meta.width}x${meta.height}${longest > 1024 ? ' → 1024' : ''}  ${path}`);
}
writeFileSync(join(root, 'src/components/studio/phone-images.manifest.json'), JSON.stringify(manifest, null, 1) + '\n');
console.log(`total ${(before / 1048576).toFixed(1)} MB → ${(after / 1048576).toFixed(1)} MB for ${list.length} files`);
