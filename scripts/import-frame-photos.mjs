import {readdir,readFile,writeFile,mkdir,rm} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=resolve(root,'content/photo-frame');
const output=resolve(root,'public/images/photo-frame');
const manifest=resolve(root,'src/data/photo-frame.json');
const files=(await readdir(source)).filter(name=>/\.(jpe?g|png|webp)$/i.test(name)).sort();
if(!files.length&&!process.argv.includes('--clear')){console.log('No new frame photos; existing collection unchanged.');process.exit(0);}
await mkdir(output,{recursive:true});
const photos=[];
const seen=new Set();
for(const name of files){
 const bytes=await readFile(resolve(source,name));
 const filename=createHash('sha256').update(bytes).digest('hex').slice(0,16)+'.webp';
 if(seen.has(filename))continue;
 seen.add(filename);
 const image=await sharp(bytes).rotate().resize({width:1400,height:1400,fit:'inside',withoutEnlargement:true}).webp({quality:88}).toBuffer({resolveWithObject:true});
 await writeFile(resolve(output,filename),image.data);
 photos.push({src:'/images/photo-frame/'+filename,width:image.info.width,height:image.info.height});
}
await writeFile(manifest,JSON.stringify(photos,null,2)+'\n');
const active=new Set(photos.map(photo=>photo.src.split('/').at(-1)));
for(const name of await readdir(output))if(extname(name)==='.webp'&&!active.has(name))await rm(resolve(output,name));
console.log(`Imported ${photos.length} frame photos. Originals retained; image metadata removed.`);
