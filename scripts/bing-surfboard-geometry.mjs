import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, Vector3 } from 'three';
import { anniversaryFin } from './bing-anniversary-fin.mjs';

export const BING_BOARD = { length: 2.8956, width: 23.25 * .0254, thickness: 3 * .0254 };
const OUTLINE = [[0, .095], [.008, .108], [.025, .127], [.06, .163], [.12, .207], [.23, .254],
  [.38, .283], [.52, .291], [.67, .287], [.79, .27], [.88, .239], [.94, .193], [.975, .138], [.993, .074], [1, 0]];
const THICKNESS = [[0, .025], [.035, .044], [.14, .065], [.35, .076], [.62, .073], [.82, .059], [.94, .041], [.99, .015], [1, .001]];

function smoothProfile(points, t) {
  const i = Math.max(0, points.findIndex(([x]) => x >= t) - 1);
  const start = points[i], end = points[i + 1] ?? start;
  const u = end[0] === start[0] ? 0 : (t - start[0]) / (end[0] - start[0]);
  const prev = points[Math.max(0, i - 1)], next = points[Math.min(points.length - 1, i + 2)];
  const m0 = (end[1] - prev[1]) / (end[0] - prev[0]);
  const m1 = (next[1] - start[1]) / (next[0] - start[0]);
  return (2*u**3 - 3*u*u + 1)*start[1] + (u**3 - 2*u*u + u)*(end[0]-start[0])*m0
    + (-2*u**3 + 3*u*u)*end[1] + (u**3 - u*u)*(end[0]-start[0])*m1;
}

export function boardSurface(t, angle, side) {
  const width = t>.993 ? .074*Math.sqrt(Math.max(0,(1-t)/.007)) : Math.max(0, smoothProfile(OUTLINE, t));
  const thickness = Math.max(.001, smoothProfile(THICKNESS, t));
  const rocker = -.055*t**7 - .028*(1-t)**5;
  return new Vector3(width * (BING_BOARD.width / .582) * Math.sin(angle), (t-.5)*BING_BOARD.length,
    rocker + side*thickness*(BING_BOARD.thickness/.076)/2*Math.max(0, Math.cos(angle))**.55);
}

function boardFace(side) {
  const positions = [], normals = [], uv = [], indices = [], rows = 180, columns = 48;
  for (let row = 0; row <= rows; row++) for (let col = 0; col <= columns; col++) {
    const t = row/rows, angle = (col/columns-.5)*Math.PI;
    const point = boardSurface(t, angle, side);
    const across = boardSurface(t, Math.min(Math.PI/2, angle+.0001), side)
      .sub(boardSurface(t, Math.max(-Math.PI/2, angle-.0001), side));
    const along = boardSurface(Math.min(1,t+.0001), angle, side)
      .sub(boardSurface(Math.max(0,t-.0001), angle, side));
    const normal = across.cross(along).multiplyScalar(side).normalize();
    if (col === 0 || col === columns) normal.set(Math.sign(point.x), 0, 0);
    if (row === rows) normal.set(0, 1, side*.01).normalize();
    positions.push(...point); normals.push(...normal);
    uv.push(.5 + side*point.x/BING_BOARD.width, 1-t);
  }
  for (let row=0; row<rows; row++) for(let col=0;col<columns;col++) {
    const a=row*(columns+1)+col,b=a+1,c=a+columns+1,d=c+1;
    indices.push(...(side>0 ? [a,b,c,b,d,c] : [a,c,b,b,c,d]));
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal', new Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uv,2));
  geometry.setIndex(indices); geometry.computeBoundingBox();
  return geometry;
}

function tailCap() {
  const positions = [], indices = [], steps=48;
  positions.push(0,-BING_BOARD.length/2,-.028);
  for(let i=0;i<=steps;i++) positions.push(...boardSurface(0,-Math.PI/2+i/steps*Math.PI,1));
  for(let i=0;i<=steps;i++) positions.push(...boardSurface(0,Math.PI/2-i/steps*Math.PI,-1));
  for(let i=1;i<positions.length/3-1;i++) indices.push(0,i+1,i);
  indices.push(0,1,positions.length/3-1);
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.setIndex(indices);g.computeVertexNormals();return g;
}

function seatOnBottom(geometry) {
  const vertices=geometry.getAttribute('position');
  for(let i=0;i<vertices.count;i++) {
    const t=vertices.getY(i)/BING_BOARD.length+.5;
    vertices.setZ(i,vertices.getZ(i)+boardSurface(t,0,1).z);
  }
  geometry.computeVertexNormals(); geometry.computeBoundingBox();
  return geometry;
}

export function buildBingGeometry() {
  const box=new BoxGeometry(.018,.32,.008,1,32,1);
  box.translate(0,-BING_BOARD.length/2+.31,-.0034); seatOnBottom(box);
  const slot=new BoxGeometry(.010,.294,.008,1,32,1);slot.translate(0,-BING_BOARD.length/2+.315,-.0031); seatOnBottom(slot);
  const screw=new CylinderGeometry(.0034,.0034,.002,16);screw.rotateX(Math.PI/2);screw.translate(0,-BING_BOARD.length/2+.2705,.0037); seatOnBottom(screw);
  return [
    {name:'Amber resin bottom with original Bing and 60 artwork',geometry:boardFace(1),material:'bottom'},
    {name:'Waxed deck with original Bing artwork',geometry:boardFace(-1),material:'deck'},
    {name:'Rounded amber tail edge',geometry:tailCap(),material:'rail'},
    {name:'Bing 60th anniversary 9.5 inch fiberglass fin',geometry:seatOnBottom(anniversaryFin(BING_BOARD.length)),material:'fin'},
    {name:'Recessed dark single fin box',geometry:box,material:'box'},
    {name:'Single fin box opening',geometry:slot,material:'slot'},
    {name:'Fin box mounting screw',geometry:screw,material:'screw'},
  ];
}
