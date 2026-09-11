import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { Box3, Euler, Matrix4, Vector3 } from 'three';
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
    expect(json.images).toHaveLength(5);
    expect(json.extras.lengthMetres).toBe(BING_BOARD.length);
    expect(json.bufferViews.every(v=>v.byteOffset+v.byteLength<=json.buffers[0].byteLength)).toBe(true);
  });
});
