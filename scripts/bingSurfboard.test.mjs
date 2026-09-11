import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Box3, Euler, Matrix4, Vector3 } from 'three';
import { anniversaryFin } from './bing-anniversary-fin.mjs';
import { BING_BOARD, boardSurface, buildBingGeometry } from './bing-surfboard-geometry.mjs';

describe('photograph-derived Bing surfboard',()=>{
  test('keeps the confirmed 9ft6 length while giving both faces a continuous rounded rail',()=>{
    // Given: the physical surfaces used in the generated asset.
    const parts=buildBingGeometry(),bounds=new Box3();
    for(const p of parts){p.geometry.computeBoundingBox();bounds.union(p.geometry.boundingBox);}
    // When: deck and bottom positions are sampled at their shared rail.
    const gaps=[];
    for(let i=0;i<=100;i++)for(const edge of [-Math.PI/2,Math.PI/2])gaps.push(boardSurface(i/100,edge,1).distanceTo(boardSurface(i/100,edge,-1)));
    // Then: the length stays exact and no seam opens between the separately textured faces.
    expect(bounds.max.y-bounds.min.y).toBeCloseTo(2.8956,5);
    expect(Math.max(...gaps)).toBeLessThan(.000001);
    parts.forEach(p=>p.geometry.dispose());
  });
  test('gives the fin a rounded full foil that remains substantial halfway to the tip',()=>{
    const g=anniversaryFin(BING_BOARD.length),p=g.getAttribute('position');
    const sections=[0,.5].map(h=>{
      const points=[];
      for(let i=0;i<p.count;i++)if(Math.abs(p.getZ(i)-h*9.5*.0254)<.00001)points.push({x:p.getX(i),y:p.getY(i)});
      const width=Math.max(...points.map(v=>v.x))-Math.min(...points.map(v=>v.x));
      const maxX=Math.max(...points.map(v=>v.x));
      const thickest=points.find(v=>v.x===maxX);
      const front=Math.max(...points.map(v=>v.y)),back=Math.min(...points.map(v=>v.y));
      return {width,chordFraction:(front-thickest.y)/(front-back)};
    });
    expect(sections[0].width).toBeGreaterThan(.009);
    expect(sections[0].width).toBeLessThan(.010);
    expect(sections[1].width).toBeGreaterThan(.007);
    expect(sections[0].chordFraction).toBeGreaterThan(.2);
    expect(sections[0].chordFraction).toBeLessThan(.4);
    g.dispose();
  });
  test('seats the box on the curved bottom and fastens the fin at its actual base',()=>{
    const parts=buildBingGeometry();
    const box=parts.find(p=>p.material==='box').geometry.getAttribute('position');
    const surfaceOffsets=[];
    for(let i=0;i<box.count;i++)surfaceOffsets.push(box.getZ(i)-boardSurface(box.getY(i)/BING_BOARD.length+.5,0,1).z);
    expect(Math.max(...surfaceOffsets)).toBeCloseTo(.0006,5);
    expect(Math.min(...surfaceOffsets)).toBeLessThan(-.006);
    const screw=parts.find(p=>p.material==='screw').geometry;
    screw.computeBoundingBox();
    const center=screw.boundingBox.getCenter(new Vector3());
    const trailingRoot=.278842;
    expect(trailingRoot-(center.y+BING_BOARD.length/2)).toBeGreaterThan(.005);
    expect(trailingRoot-(center.y+BING_BOARD.length/2)).toBeLessThan(.012);
    parts.forEach(p=>p.geometry.dispose());
  });
  test('keeps the complete board and fin inside the existing wall corner and above the floor',()=>{
    // Given: existing placement, lean, centering and cradle ground rule.
    const parts=buildBingGeometry(),bounds=new Box3();
    for(const p of parts){p.geometry.computeBoundingBox();bounds.union(p.geometry.boundingBox);}
    const center=bounds.getCenter(new Vector3()),lean=new Euler(-.12,0,-.015),points=[];
    for(const p of parts){const a=p.geometry.getAttribute('position');for(let i=0;i<a.count;i++)points.push(new Vector3().fromBufferAttribute(a,i).sub(center).applyEuler(lean));}
    const lift=.0185+.065-Math.min(...points.map(p=>p.y));
    const room=new Matrix4().makeRotationY(Math.PI/2+.18).setPosition(-2.382,0,-3.01);
    // When: the actual asset vertices are transformed into the current room.
    const result=new Box3().setFromPoints(points.map(p=>p.add(new Vector3(0,lift,0)).applyMatrix4(room)));
    // Then: no board/fin vertex penetrates the wall/floor or exceeds the room ceiling.
    expect(result.min.x).toBeGreaterThan(-2.78);
    expect(result.min.z).toBeGreaterThan(-3.32);
    expect(result.max.y).toBeLessThan(3.2);
    expect(result.min.y).toBeCloseTo(.0835,5);
    parts.forEach(p=>p.geometry.dispose());
  });
  test('ships nonemissive resin and a single separate transmissive fin in a readable GLB',()=>{
    // Given: the generated production file, not an in-memory mock of its material setup.
    const bytes=readFileSync('public/models/surfboard.glb');
    // When: its binary container and material contract are inspected.
    const length=bytes.readUInt32LE(12),json=JSON.parse(bytes.subarray(20,20+length));
    // Then: the asset is complete and uses scene-lit resin with one physical pale fin.
    expect(bytes.readUInt32LE(0)).toBe(0x46546c67);
    expect(bytes.readUInt32LE(8)).toBe(bytes.length);
    expect(json.materials.every(m=>!m.emissiveTexture&&!m.emissiveFactor)).toBe(true);
    expect(json.materials.filter(m=>m.extensions?.KHR_materials_transmission)).toHaveLength(1);
    expect(json.images).toHaveLength(6);
    expect(json.extras.finHeightInches).toBe(9.5);
    expect(json.extras.lengthMetres).toBe(BING_BOARD.length);
    expect(json.bufferViews.every(v=>v.byteOffset+v.byteLength<=json.buffers[0].byteLength)).toBe(true);
  });
});
