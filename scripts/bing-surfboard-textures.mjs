import { execFileSync } from 'node:child_process';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { BING_BOARD } from './bing-surfboard-geometry.mjs';

const WIDTH=512, HEIGHT=2048;
const clamp=(x)=>Math.max(0,Math.min(1,x));
const noise=(x,y)=>{const n=Math.sin(x*127.1+y*311.7)*43758.5453;return n-Math.floor(n);};

async function artwork(source,crop) {
  const {data,info}=await sharp(source).extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  for(let i=0;i<data.length;i+=4) {
    const warm=Math.max(data[i]-data[i+2]-12,data[i+1]-data[i+2]-8);
    data[i+3]=Math.round(255*clamp(1-warm/22));
    if(data[i+3]===0) data.fill(0,i,i+3);
  }
  return sharp(data,{raw:info}).png().toBuffer();
}

function waxAt(x,y) {
  const u=(x-WIDTH/2)/(WIDTH/2), t=1-y/(HEIGHT-1);
  const edge=clamp((.88-Math.abs(u))/0.14)*clamp((t-.065)/.065)*clamp((.984-t)/.045);
  const jitter=(noise(Math.floor(x/5),Math.floor(y/7))-.5)*1.15;
  const a=(y+x*1.8+jitter)/27,b=(y-x*1.55-jitter)/31;
  const line=Math.max(Math.exp(-(((a-Math.round(a))*17)**2)),Math.exp(-(((b-Math.round(b))*20)**2)));
  const wear=clamp((noise(Math.floor(x/3),Math.floor(y/3))-.17)*1.8);
  const fleck=clamp((noise(x,y)-.865)*5.7);
  return edge*clamp(line*wear*.78+fleck*.55);
}

function surfaceMaps(deck) {
  const color=Buffer.alloc(WIDTH*HEIGHT*3), orm=Buffer.alloc(color.length), normal=Buffer.alloc(color.length);
  for(let y=0;y<HEIGHT;y++) for(let x=0;x<WIDTH;x++) {
    const i=(y*WIDTH+x)*3, u=(x-WIDTH/2)/(WIDTH/2);
    const wax=deck?waxAt(x,y):0;
    const grain=(noise(x,y)-.5)*1.5;
    const rail=clamp((Math.abs(u)-.78)/.22);
    const tint=[219-rail*13+grain,159-rail*19+grain,22-rail*8+grain];
    const stringer=Math.abs((x+.5)-WIDTH/2)<WIDTH*.008/BING_BOARD.width/2;
    for(let c=0;c<3;c++) {
      const substrate=stringer?[91,59,30][c]+(noise(x,y)-.5)*13:tint[c];
      color[i+c]=Math.round(substrate*(1-wax)+[241,235,214][c]*wax);
    }
    orm[i]=Math.round(255*(1-wax*.93)); orm[i+1]=Math.round(255*(.19+wax*.67)); orm[i+2]=0;
    const dx=deck?(waxAt(x+1,y)-waxAt(x-1,y))*.23:0;
    const dy=deck?(waxAt(x,y+1)-waxAt(x,y-1))*.23:0;
    const d=Math.sqrt(dx*dx+dy*dy+1);
    normal[i]=Math.round(127.5*(1-dx/d)); normal[i+1]=Math.round(127.5*(1+dy/d)); normal[i+2]=Math.round(127.5*(1+1/d));
  }
  return {color,orm,normal};
}

export async function createBingTextures(sourceDirectory) {
  const directory=await mkdtemp(join(tmpdir(),'bing-artwork-'));
  try {
    const converted=join(directory,'source.png');
    execFileSync('sips',['-s','format','png',join(sourceDirectory,'IMG_0981.heic'),'--out',converted],{stdio:'ignore'});
    const [bing,badge]=await Promise.all([
      artwork(converted,{left:2047,top:2599,width:172,height:132}),
      artwork(converted,{left:1968,top:2939,width:94,height:65}),
    ]);
    const images=[];
    for(const side of ['bottom','deck']) {
      const maps=surfaceMaps(side==='deck');
      const logoWidth=Math.round(.12/BING_BOARD.width*WIDTH);
      const logo=await sharp(bing).resize({width:logoWidth}).png().toBuffer();
      const overlays=[{input:logo,left:Math.round(WIDTH/2+.051/BING_BOARD.width*WIDTH),top:Math.round((side==='deck'?.705:.633)*HEIGHT)}];
      if(side==='bottom') overlays.push({input:await sharp(badge).resize({width:Math.round(.060/BING_BOARD.width*WIDTH)}).png().toBuffer(),
        left:Math.round(WIDTH/2-.030/BING_BOARD.width*WIDTH),top:Math.round(.775*HEIGHT)});
      const color=await sharp(maps.color,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).composite(overlays).webp({quality:94,effort:5}).toBuffer();
      const orm=await sharp(maps.orm,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).webp({lossless:true,effort:5}).toBuffer();
      images.push({name:`bing-${side}-color`,bytes:color},{name:`bing-${side}-surface`,bytes:orm});
      if(side==='deck') images.push({name:'bing-deck-wax-normal',bytes:await sharp(maps.normal,{raw:{width:WIDTH,height:HEIGHT,channels:3}}).webp({lossless:true,effort:5}).toBuffer()});
    }
    return {images,artwork:{bing,badge},source:await readFile(join(sourceDirectory,'IMG_0981.heic'))};
  } finally { await rm(directory,{recursive:true,force:true}); }
}
