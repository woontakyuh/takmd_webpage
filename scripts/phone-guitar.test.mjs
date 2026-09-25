import { expect, it } from 'bun:test';
import { readFileSync } from 'node:fs';
function read(path) { const bytes=readFileSync(new URL(path, import.meta.url)), length=bytes.readUInt32LE(12); return { bytes, json:JSON.parse(bytes.subarray(20,20+length)), bin:bytes.subarray(28+length) }; }
it('retains the guitar geometry, shader inputs, materials and attribution in its phone copy', () => {
  const original=read('../public/models/fender/stratocaster-sunburst.glb'),phone=read('../public/models/fender/stratocaster-phone.glb');
  for(const key of ['meshes','accessors','nodes','scenes','scene','materials','asset']) expect(phone.json[key]).toEqual(original.json[key]);
  const images=new Set(original.json.images.map(image=>image.bufferView));
  for(const [index,view] of original.json.bufferViews.entries()) {
    if(images.has(index)) continue;
    const a=view.extensions?.EXT_meshopt_compression??view,b=phone.json.bufferViews[index].extensions?.EXT_meshopt_compression??phone.json.bufferViews[index];
    expect(phone.bin.subarray(b.byteOffset,b.byteOffset+b.byteLength)).toEqual(original.bin.subarray(a.byteOffset,a.byteOffset+a.byteLength));
  }
  expect(phone.bytes.length).toBeLessThan(original.bytes.length*.4);
  for(const [index,texture] of phone.json.textures.entries()) expect(texture.extensions.EXT_texture_webp.source).toBe(original.json.textures[index].extensions?.EXT_texture_webp?.source??original.json.textures[index].source);
});
