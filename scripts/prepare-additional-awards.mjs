import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
const sourceDirectory = '/Users/TakMD/Library/CloudStorage/Dropbox/Tak/Down';
const output = 'public/models/personal-awards/additions';
const evidence = '.omo/evidence/new-awards-2026-09-13';
const documents = [
 {id:'neurospine-reviewer-2025',source:'IMG_0975.HEIC',view:[1200,900],corners:[[188,134],[1118,137],[1114,793],[187,786]],output:[1600,1131]},
 {id:'snu-masters-plaque-2018',source:'IMG_0983 (1).HEIC',view:[900,1200],corners:[[91,440],[492,374],[549,851],[217,968]],output:[1200,1700]},
 {id:'snu-plaque-wood',source:'IMG_0979.HEIC',view:[900,1200],corners:[[80,240],[655,282],[574,729],[233,673]],output:[768,1024]},
 {id:'wcmisst-speaker-2026',source:'IMG_0984.HEIC',view:[900,1200],corners:[[41,339],[850,348],[833,953],[48,945]],output:[1600,1131]},
 {id:'kosess-academic-2025',source:'IMG_0985.HEIC',view:[900,1200],corners:[[70,75],[801,80],[800,1079],[102,1092]],output:[1131,1600]},
 {id:'tsess-instructor-2026',source:'IMG_0987.HEIC',view:[900,1200],corners:[[33,322],[859,322],[860,896],[41,909]],output:[1600,1131]},
];
function homography(points) {
  const [topLeft, topRight, bottomRight, bottomLeft] = points;
  const dx1 = topRight[0] - bottomRight[0];
  const dx2 = bottomLeft[0] - bottomRight[0];
  const dx3 = topLeft[0] - topRight[0] + bottomRight[0] - bottomLeft[0];
  const dy1 = topRight[1] - bottomRight[1];
  const dy2 = bottomLeft[1] - bottomRight[1];
  const dy3 = topLeft[1] - topRight[1] + bottomRight[1] - bottomLeft[1];
  const determinant = dx1 * dy2 - dx2 * dy1;
  const g = (dx3 * dy2 - dx2 * dy3) / determinant;
  const h = (dx1 * dy3 - dx3 * dy2) / determinant;
  return [
    topRight[0] - topLeft[0] + g * topRight[0], bottomLeft[0] - topLeft[0] + h * bottomLeft[0], topLeft[0],
    topRight[1] - topLeft[1] + g * topRight[1], bottomLeft[1] - topLeft[1] + h * bottomLeft[1], topLeft[1], g, h,
  ];
}

function interpolate(source, sourceWidth, sourceHeight, transform, width, height) {
  const result = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1);
      const v = y / (height - 1);
      const denominator = transform[6] * u + transform[7] * v + 1;
      const sourceX = (transform[0] * u + transform[1] * v + transform[2]) / denominator;
      const sourceY = (transform[3] * u + transform[4] * v + transform[5]) / denominator;
      const left = Math.max(0, Math.min(sourceWidth - 2, Math.floor(sourceX)));
      const top = Math.max(0, Math.min(sourceHeight - 2, Math.floor(sourceY)));
      const horizontal = Math.max(0, Math.min(1, sourceX - left));
      const vertical = Math.max(0, Math.min(1, sourceY - top));
      const outputPixel = (y * width + x) * 3;
      for (let channel = 0; channel < 3; channel += 1) {
        const sample = (sampleX, sampleY) => source[(sampleY * sourceWidth + sampleX) * 3 + channel];
        result[outputPixel + channel] = Math.round(
          sample(left, top) * (1 - horizontal) * (1 - vertical)
          + sample(left + 1, top) * horizontal * (1 - vertical)
          + sample(left, top + 1) * (1 - horizontal) * vertical
          + sample(left + 1, top + 1) * horizontal * vertical,
        );
      }
    }
  }
  return result;
}

async function decodeUpright(source, temporary) {
  const converted = join(temporary, 'source.tiff');
  execFileSync('sips', ['-s', 'format', 'tiff', source, '--out', converted], { stdio: 'pipe' });
  return sharp(converted).rotate().toColourspace('srgb').removeAlpha().raw().toBuffer({ resolveWithObject: true });
}

await mkdir(output,{recursive:true});
const artifacts=[];
for(const doc of documents){
 const source=join(sourceDirectory,doc.source),temp=await mkdtemp(join(tmpdir(),'takmd-new-awards-'));
 let decoded;
 try{decoded=await decodeUpright(source,temp);}finally{await rm(temp,{recursive:true,force:true});}
 const {data,info}=decoded;
 const corners=doc.corners.map(([x,y])=>[x*info.width/doc.view[0],y*info.height/doc.view[1]]);
 const [width,height]=doc.output;
 const pixels=interpolate(data,info.width,info.height,homography(corners),width,height);
 const path=`${output}/${doc.id}.webp`;
 await sharp(pixels,{raw:{width,height,channels:3}}).webp({quality:94,smartSubsample:false}).toFile(path);
 artifacts.push({...doc,path,sourceSha256:createHash('sha256').update(await readFile(source)).digest('hex'),sourcePixels:[info.width,info.height]});
}
await writeFile(`${evidence}/provenance.json`,JSON.stringify({process:'Source-only perspective rectification; photographed lettering, seals and signatures retained. No generated content. Original images remain private.',artifacts},null,2));
console.log(JSON.stringify(artifacts.map(a=>a.path)));
