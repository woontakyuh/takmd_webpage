import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Shape } from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export const ANNIVERSARY_FIN = { height: 9.5 * .0254, rootThickness: .0092, imageWidth: 1080, imageHeight: 1440 };
const BASE = [.8659, -.5003], ORIGIN = [439, 1282];

function photoOutline() {
  const s=new Shape();
  s.moveTo(439,-1282);
  s.bezierCurveTo(385,-1270,401,-1215,427,-1110);
  s.bezierCurveTo(477,-903,587,-486,709,-243);
  s.bezierCurveTo(787,-117,949,-57,1010,-74);
  s.bezierCurveTo(1052,-85,1042,-118,1016,-155);
  s.bezierCurveTo(938,-285,871,-442,845,-582);
  s.bezierCurveTo(831,-708,895,-865,984,-934);
  s.lineTo(1034,-938);s.lineTo(439,-1282);
  return s.getPoints(80).map(p=>{
    const dx=p.x-ORIGIN[0],dy=-p.y-ORIGIN[1];
    return {x:dx*BASE[0]+dy*BASE[1],y:dx*BASE[1]-dy*BASE[0]};
  });
}

function flexOutline() {
  const s=new Shape();s.moveTo(296,-1344);
  s.bezierCurveTo(420,-1190,543,-881,785,-708);
  s.bezierCurveTo(920,-595,1083,-535,1146,-562);
  s.bezierCurveTo(1189,-578,1149,-631,1086,-673);
  s.bezierCurveTo(883,-817,799,-971,806,-1139);
  s.bezierCurveTo(807,-1222,844,-1306,888,-1344);
  s.lineTo(296,-1344);
  return s.getPoints(80).map(p=>({x:p.x-296,y:p.y+1344}));
}

function section(points,height) {
  const hits=[];
  for(let i=0;i<points.length-1;i++) {
    const a=points[i],b=points[i+1];
    if((a.y<=height&&b.y>height)||(b.y<=height&&a.y>height)) hits.push(a.x+(b.x-a.x)*(height-a.y)/(b.y-a.y));
  }
  return [Math.min(...hits),Math.max(...hits)];
}

export function anniversaryFin(boardLength) {
  const outline=flexOutline(),photo=photoOutline();
  const maxHeight=Math.max(...outline.map(p=>p.y)),photoHeight=Math.max(...photo.map(p=>p.y));
  const positions=[],uv=[],indices=[],rows=72,columns=20,sideCount=(rows+1)*(columns+1);
  for(const side of [-1,1]) for(let row=0;row<=rows;row++) {
    const h=row/rows,scan=Math.max(.0001,Math.min(.99999,h));
    const bounds=section(outline,scan*maxHeight),photoH=Math.min(.91,Math.max(.018,h))*photoHeight;
    const pb=section(photo,photoH);
    for(let col=0;col<=columns;col++) {
      const u=col/columns,along=bounds[0]+u*(bounds[1]-bounds[0]);
      const sectionShape=5*(.2969*Math.sqrt(u)-.126*u-.3516*u*u+.2843*u**3-.1036*u**4);
      const foil=ANNIVERSARY_FIN.rootThickness*(1-.32*h)*(1-h**4)**.45*sectionShape;
      positions.push(side*foil,.46-along/maxHeight*ANNIVERSARY_FIN.height-boardLength/2,h*ANNIVERSARY_FIN.height);
      const sourceAlong=pb[0]+(.065+.87*u)*(pb[1]-pb[0]);
      const px=ORIGIN[0]+BASE[0]*sourceAlong+BASE[1]*photoH;
      const py=ORIGIN[1]+BASE[1]*sourceAlong-BASE[0]*photoH;
      uv.push(px/ANNIVERSARY_FIN.imageWidth,py/ANNIVERSARY_FIN.imageHeight);
    }
  }
  for(let side=0;side<2;side++)for(let row=0;row<rows;row++)for(let col=0;col<columns;col++) {
    const a=side*sideCount+row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1;
    indices.push(...(side===0?[a,b,c,b,d,c]:[a,c,b,b,c,d]));
  }
  for(let col=0;col<columns;col++) indices.push(col,col+1,col+sideCount,col+1,col+sideCount+1,col+sideCount);
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new Float32BufferAttribute(uv,2));g.setIndex(indices);
  const welded=mergeVertices(g,.0000001);g.dispose();welded.computeVertexNormals();welded.computeBoundingBox();
  const tab=new BoxGeometry(.011,.027,.003);tab.translate(0,.273-boardLength/2,.001);
  const tabUv=tab.getAttribute('uv');
  for(let i=0;i<tabUv.count;i++)tabUv.setXY(i,.63,.52);
  const joined=mergeGeometries([welded,tab]);welded.dispose();tab.dispose();joined.computeBoundingBox();
  return joined;
}
