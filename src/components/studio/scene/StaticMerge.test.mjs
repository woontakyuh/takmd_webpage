import { describe, expect, test } from 'bun:test';
import { Group, Mesh, Scene } from 'three';
import { anchorOf } from './StaticMerge.tsx';

function rendered(object) {
  for (let node = object; node; node = node.parent) {
    if (!node.visible) return false;
  }
  return true;
}

describe('static batches retain their visibility and movement scope', () => {
  test('a wall hidden from outside cannot leave its merged surface visible', () => {
    const scene = new Scene(), cutaway = new Group(), wall = new Mesh();
    scene.add(cutaway); cutaway.add(wall);
    const batch = new Mesh();
    anchorOf(wall, scene).add(batch);
    expect(rendered(batch)).toBe(true);
    cutaway.visible = false;
    expect(rendered(batch)).toBe(false);
    cutaway.visible = true;
    expect(rendered(batch)).toBe(true);
  });

  test('separate walls keep independent cutaway scopes', () => {
    const scene = new Scene(), far = new Group(), left = new Group();
    const farWall = new Mesh(), leftWall = new Mesh();
    scene.add(far, left); far.add(farWall); left.add(leftWall);
    expect(anchorOf(farWall, scene).uuid).not.toBe(anchorOf(leftWall, scene).uuid);
  });

  test('nested furniture parts follow their own parent before the next merge sweep', () => {
    const scene = new Scene(), furniture = new Group(), part = new Group(), mesh = new Mesh();
    furniture.name = 'Furniture layout example';
    scene.add(furniture); furniture.add(part); part.add(mesh);
    const batch = new Mesh();
    anchorOf(mesh, scene).add(batch);
    part.position.x = 2;
    scene.updateMatrixWorld(true);
    expect(batch.matrixWorld.elements[12]).toBe(2);
    part.visible = false;
    expect(rendered(batch)).toBe(false);
  });

  test('siblings still share a batch scope', () => {
    const scene = new Scene(), frame = new Group(), first = new Mesh(), second = new Mesh();
    scene.add(frame); frame.add(first, second);
    expect(anchorOf(first, scene)).toBe(anchorOf(second, scene));
  });
});
