import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { ANNIVERSARY_FIN } from './bing-anniversary-fin.mjs';
import { BING_BOARD, buildBingGeometry } from './bing-surfboard-geometry.mjs';
import { createBingTextures } from './bing-surfboard-textures.mjs';

const usage='bun scripts/prepare-bing-surfboard.mjs /absolute/path/to/private/Down [output.glb] [9.5-inch-fin-reference.png]';
const [sourceDirectory,output='public/models/surfboard.glb',finReference]=process.argv.slice(2);
if(sourceDirectory==='--help'){console.log(usage);process.exit(0);}
assert(sourceDirectory,usage);
const evidence='.omo/evidence/calendar-audio-refinement-2026-09-11/surfboard';
await mkdir(evidence,{recursive:true});
const textureOutput=await createBingTextures(resolve(sourceDirectory),finReference);
const parts=buildBingGeometry();
const json={asset:{version:'2.0',generator:'TakMD reference-derived Bing surfboard'},scene:0,
  scenes:[{nodes:[]}],nodes:[],meshes:[],materials:[],textures:[],images:[],samplers:[{magFilter:9729,minFilter:9987,wrapS:33071,wrapT:33071}],
  accessors:[],bufferViews:[],buffers:[],extensionsUsed:['EXT_texture_webp','KHR_materials_clearcoat','KHR_materials_transmission','KHR_materials_volume','KHR_materials_ior'],
  extensionsRequired:['EXT_texture_webp'],extras:{lengthMetres:BING_BOARD.length,
    widthAndThickness:'Bing Beacon official size chart: 9ft6 x23.25in x3in',
    finHeightInches:9.5,finDisplayScale:ANNIVERSARY_FIN.displayScale,finReference:finReference?'Owner-supplied Bing 60th anniversary fin photograph':null,
    referencePhotos:['IMG_0981.heic','IMG_0947.HEIC','IMG_0983.HEIC','IMG_0400.HEIC','IMG_5737.JPG']}};
const buffers=[];let bytes=0;
function view(data,target){const padded=Buffer.alloc(Math.ceil(data.byteLength/4)*4);Buffer.from(data.buffer??data,data.byteOffset??0,data.byteLength).copy(padded);
  const index=json.bufferViews.length;json.bufferViews.push({buffer:0,byteOffset:bytes,byteLength:data.byteLength,...(target?{target}:{})});buffers.push(padded);bytes+=padded.length;return index;}
function accessor(array,itemSize,index=false){const bufferView=view(array,index?34963:34962),type=itemSize===1?'SCALAR':`VEC${itemSize}`;
  const a={bufferView,componentType:index?5125:5126,count:array.length/itemSize,type};
  if(!index&&itemSize===3){a.min=[Infinity,Infinity,Infinity];a.max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<array.length;i++){
    assert(Number.isFinite(array[i]),'Geometry attributes must remain finite');a.min[i%3]=Math.min(a.min[i%3],array[i]);a.max[i%3]=Math.max(a.max[i%3],array[i]);}}
  const id=json.accessors.length;json.accessors.push(a);return id;}
for(const image of textureOutput.images){const source=json.images.length;json.images.push({name:image.name,mimeType:'image/webp',bufferView:view(image.bytes)});
  json.textures.push({sampler:0,extensions:{EXT_texture_webp:{source}}});await writeFile(`${evidence}/${image.name}.webp`,image.bytes);}
const textured=(name,color,surface,normal)=>({name,pbrMetallicRoughness:{baseColorTexture:{index:color},metallicRoughnessTexture:{index:surface},metallicFactor:0,roughnessFactor:1},
  ...(normal===undefined?{}:{normalTexture:{index:normal,scale:.42}}),extensions:{KHR_materials_clearcoat:{clearcoatFactor:1,clearcoatTexture:{index:surface},clearcoatRoughnessFactor:1,clearcoatRoughnessTexture:{index:surface}}}});
const materials={
  bottom:textured('Amber yellow pigmented resin bottom',0,1),deck:textured('Amber yellow waxed deck',2,3,4),
  rail:{name:'Amber tail rail resin',pbrMetallicRoughness:{baseColorFactor:[.70,.37,.008,1],metallicFactor:0,roughnessFactor:.19},extensions:{KHR_materials_clearcoat:{clearcoatFactor:1,clearcoatRoughnessFactor:.14}}},
  fin:{name:'Bing 60th anniversary 9.5 inch woven fiberglass fin',pbrMetallicRoughness:{...(finReference?{baseColorTexture:{index:5}}:{baseColorFactor:[.79,.87,.71,1]}),metallicFactor:0,roughnessFactor:.34},
    extensions:{KHR_materials_transmission:{transmissionFactor:.08},KHR_materials_volume:{thicknessFactor:ANNIVERSARY_FIN.rootThickness,attenuationColor:[.94,.98,.87],attenuationDistance:.05},KHR_materials_ior:{ior:1.49},KHR_materials_clearcoat:{clearcoatFactor:.35,clearcoatRoughnessFactor:.28}}},
  box:{name:'Dark fin-box surround',pbrMetallicRoughness:{baseColorFactor:[.025,.032,.028,1],metallicFactor:.04,roughnessFactor:.38}},
  slot:{name:'Recessed black fin slot',pbrMetallicRoughness:{baseColorFactor:[.006,.008,.007,1],metallicFactor:0,roughnessFactor:.58}},
  screw:{name:'Fin-box stainless fixing',pbrMetallicRoughness:{baseColorFactor:[.65,.69,.68,1],metallicFactor:1,roughnessFactor:.24}},
};
json.materials=Object.values(materials);
for(const part of parts){const g=part.geometry,index=accessor(g.index?new Uint32Array(g.index.array):Uint32Array.from({length:g.getAttribute('position').count},(_,i)=>i),1,true),attributes={};
  for(const [name,semantic] of [['position','POSITION'],['normal','NORMAL'],['uv','TEXCOORD_0']]){const a=g.getAttribute(name);if(a)attributes[semantic]=accessor(new Float32Array(a.array),a.itemSize);}
  const mesh=json.meshes.length;json.meshes.push({name:part.name,primitives:[{attributes,indices:index,material:Object.keys(materials).indexOf(part.material)}]});
  json.nodes.push({name:part.name,mesh,extras:{boardSurface:['bottom','deck','rail'].includes(part.material)}});json.scenes[0].nodes.push(json.nodes.length-1);g.dispose();}
json.buffers=[{byteLength:bytes}];const body=Buffer.concat(buffers),document=Buffer.from(JSON.stringify(json)),padded=Buffer.alloc(Math.ceil(document.length/4)*4,0x20);document.copy(padded);
const glb=Buffer.alloc(28+padded.length+body.length);glb.writeUInt32LE(0x46546c67,0);glb.writeUInt32LE(2,4);glb.writeUInt32LE(glb.length,8);glb.writeUInt32LE(padded.length,12);glb.writeUInt32LE(0x4e4f534a,16);padded.copy(glb,20);glb.writeUInt32LE(body.length,20+padded.length);glb.writeUInt32LE(0x004e4942,24+padded.length);body.copy(glb,28+padded.length);
await writeFile(output,glb);
await Promise.all([writeFile(`${evidence}/bing-artwork.png`,textureOutput.artwork.bing),writeFile(`${evidence}/60-artwork.png`,textureOutput.artwork.badge)]);
const receipt={output,bytes:glb.length,sha256:createHash('sha256').update(glb).digest('hex'),sourceSha256:createHash('sha256').update(textureOutput.source).digest('hex'),
  sourceArtworkPixels:{bing:[172,132],anniversary:[94,65]},physicalEnvelope:BING_BOARD,meshes:json.meshes.map(m=>m.name),materials:json.materials.map(m=>m.name),textures:textureOutput.images.map(i=>({name:i.name,bytes:i.bytes.length})),
  limitations:['Envelope follows the official Beacon size chart; intermediate rocker and rail profiles follow owner photographs, not factory CAD.','Fine anniversary ribbon lettering is limited by 94x65 source pixels; it is retained from the photograph, not retyped.','Deck wax follows the photographed diagonal and scattered wear pattern; it is a procedural reconstruction, not the exact individual wax flecks.']};
await writeFile(`${evidence}/asset-receipt.json`,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt,null,2));
