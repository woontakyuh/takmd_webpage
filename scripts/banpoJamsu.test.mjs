import { describe, expect, it } from 'bun:test';
import * as THREE from 'three';
import { createBanpoJamsu, jamsuHeight, JAMSU } from '../src/components/studio/scene/BanpoJamsu';

describe('Jamsu lower crossing', () => {
  it('stays above normal water and below the retained upper bridge, with a continuous crest', () => {
    for (let s = 0; s <= JAMSU.length; s++) {
      expect(jamsuHeight(s) - JAMSU.deckThickness).toBeGreaterThan(0);
      expect(jamsuHeight(s) + 1.12).toBeLessThan(17);
      if (s > 0) expect(Math.abs(jamsuHeight(s) - jamsuHeight(s - 1))).toBeLessThan(.26);
    }
    expect(jamsuHeight(150)).toBe(2.7);
    expect(jamsuHeight(JAMSU.crestStation)).toBeGreaterThan(9);
    expect(jamsuHeight(0)).toBeGreaterThan(8);
    expect(jamsuHeight(JAMSU.length)).toBeGreaterThan(8);
  });
  it('replaces both old meshes, retains the upper bridge and releases its resources once', () => {
    const model = new THREE.Group();
    const lower = new THREE.Object3D(); lower.name = 'Jamsu_lower_crossing';
    const parapet = new THREE.Object3D(); parapet.name = 'Jamsu_parapets'; parapet.visible = false;
    const upper = new THREE.Object3D(); upper.name = 'Banpo_upper_roadway';
    model.add(lower, parapet, upper);
    const jamsu = createBanpoJamsu(model); model.add(jamsu.group);
    expect(lower.visible).toBe(false); expect(upper.visible).toBe(true);
    expect(jamsu.group.children.length).toBeLessThanOrEqual(4);
    expect(jamsu.group.userData.triangles).toBeLessThan(20000);
    const box = new THREE.Box3().setFromObject(jamsu.group);
    expect(box.max.y).toBeLessThan(17); expect(box.min.y).toBeGreaterThan(0);
    let disposed = 0;
    jamsu.group.traverse(object => {
      if (!(object instanceof THREE.Mesh)) return;
      object.geometry.addEventListener('dispose', () => { disposed++; });
    });
    jamsu.dispose();
    expect(disposed).toBe(4); expect(lower.visible).toBe(true); expect(parapet.visible).toBe(false);
    expect(jamsu.group.parent).toBeNull();
  });
});
