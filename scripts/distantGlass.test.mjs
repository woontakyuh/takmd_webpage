import { expect, test } from 'bun:test';
import { MeshPhysicalMaterial } from 'three';
import { DistantGlass } from '../src/components/studio/scene/DistantGlass';

test('mobile glass stays transparent at a distance and restores exact optics on approach', () => {
  const glass = new DistantGlass();
  const material = new MeshPhysicalMaterial({ transmission: 0.95, opacity: 1, depthWrite: true });
  glass.observe(material, 24);
  glass.update(true);
  expect(material.transmission).toBe(0);
  expect(material.transparent).toBe(true);
  expect(material.opacity).toBe(0.2);
  expect(material.depthWrite).toBe(false);
  glass.beginFrame();
  glass.observe(material, 180);
  glass.update(true);
  expect(material.transmission).toBe(0.95);
  expect(material.opacity).toBe(1);
  expect(material.transparent).toBe(false);
  expect(material.depthWrite).toBe(true);
  material.dispose();
});

test('shared glass uses its largest visible instance and does not flicker at the boundary', () => {
  const glass = new DistantGlass();
  const material = new MeshPhysicalMaterial({ transmission: 0.06, opacity: 0.055, transparent: true, depthWrite: false });
  glass.observe(material, 180);
  glass.observe(material, 20);
  glass.update(true);
  expect(material.transmission).toBe(0.06);
  for (const [pixels, expected] of [[80, 0], [100, 0], [121, 0.06], [100, 0.06], [89, 0]]) {
    glass.beginFrame();
    glass.observe(material, pixels);
    glass.update(true);
    expect(material.transmission).toBe(expected);
    expect(material.opacity).toBe(0.055);
  }
  glass.restore();
  expect(material.transmission).toBe(0.06);
  expect(material.transparent).toBe(true);
  expect(material.depthWrite).toBe(false);
  material.dispose();
});
