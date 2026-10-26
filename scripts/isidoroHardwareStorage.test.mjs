import { describe, expect, test } from 'bun:test';
import { Box3, DoubleSide, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { createIsidoroStrapGeometry, ISIDORO_HARDWARE } from '../src/components/studio/scene/IsidoroHardware';
import { createIsidoroWindowDoorGeometry, createIsidoroWindowRevealGeometry, createIsidoroWindowGlassGeometry, ISIDORO_TRAY_RECESS } from '../src/components/studio/scene/IsidoroStorage';
import { WHISKY_BOTTLES } from '../src/components/studio/scene/WhiskyBottleSpecs';

describe('Isidoro hardware and visible storage depth', () => {
  test('makes the bowed grip a broad leather face with a real layered edge', () => {
    const geometry = createIsidoroStrapGeometry();
    const material = new MeshBasicMaterial();
    const strap = new Mesh(geometry, [material, material]);
    strap.updateMatrixWorld();
    const cast = (x, y, z, direction) => new Raycaster(new Vector3(x, y, z), new Vector3(...direction)).intersectObject(strap)[0];
    for (const x of [-0.011, 0, 0.011]) {
      const front = cast(x, 0, 1, [0, 0, -1]);
      const back = cast(x, 0, -1, [0, 0, 1]);
      expect(front.face.materialIndex).toBe(0);
      expect(front.face.normal.z).toBeGreaterThan(0.98);
      expect(front.point.z - back.point.z).toBeGreaterThan(0.005);
      expect(front.point.z - back.point.z).toBeLessThan(0.007);
    }
    const middleEdge = cast(1, 0, 0.041, [-1, 0, 0]);
    const endEdge = cast(1, 0.12, 0.0075, [-1, 0, 0]);
    expect(middleEdge.face.materialIndex).toBe(1);
    expect(middleEdge.point.x).toBeCloseTo(0.015, 4);
    expect(endEdge.point.x).toBeLessThan(middleEdge.point.x);
    const length = ISIDORO_HARDWARE.padCenters[1] - ISIDORO_HARDWARE.padCenters[0] + ISIDORO_HARDWARE.padHeight;
    expect(length).toBeGreaterThan(0.299);
    expect(length).toBeLessThan(0.304);
    geometry.dispose(); material.dispose();
  });

  test('locates the shared catch and hasp centers at the reference heights', () => {
    expect(ISIDORO_HARDWARE.catchCenters).toEqual([0.29, 0.88]);
    expect(ISIDORO_HARDWARE.catchHeight).toBeCloseTo(0.06, 5);
  });

  test('exposes all nested trays above a low retaining lip', () => {
    const { lipHeight, lipCenterY, deckTop, trayBaseY, trayStep } = ISIDORO_TRAY_RECESS;
    expect(lipHeight).toBeGreaterThanOrEqual(0.034);
    expect(lipHeight).toBeLessThanOrEqual(0.045);
    expect(lipCenterY + lipHeight / 2).toBeLessThanOrEqual(deckTop);
    for (let index = 0; index < 3; index += 1) {
      expect(trayBaseY + index * trayStep - 0.004).toBeGreaterThan(lipCenterY + lipHeight / 2);
    }
  });

  test('places glass behind the real rounded opening with a visible 10–18 mm reveal', () => {
    const door = createIsidoroWindowDoorGeometry();
    const reveal = createIsidoroWindowRevealGeometry();
    const glass = createIsidoroWindowGlassGeometry();
    for (const geometry of [door, reveal, glass]) geometry.computeBoundingBox();
    const depth = door.boundingBox.max.z - glass.boundingBox.max.z;
    expect(depth).toBeGreaterThanOrEqual(0.01);
    expect(depth).toBeLessThanOrEqual(0.018);
    expect(reveal.boundingBox.max.z - reveal.boundingBox.min.z).toBeGreaterThan(0.01);
    const material = new MeshBasicMaterial({ side: DoubleSide });
    const group = new Group();
    group.add(new Mesh(door, material), new Mesh(reveal, material));
    group.updateMatrixWorld();
    const through = new Raycaster(new Vector3(0.1575, 0.18, 1), new Vector3(0, 0, -1));
    expect(through.intersectObject(group, true)).toHaveLength(0);
    group.add(new Mesh(glass, material)); group.updateMatrixWorld();
    expect(through.intersectObject(group, true)[0].point.z).toBeCloseTo(glass.boundingBox.max.z, 6);
    for (const geometry of [door, reveal, glass]) geometry.dispose();
    material.dispose();
  });

  test('keeps the recessed glazing clear of the resting bottle row when automatically opened', () => {
    const geometry = createIsidoroWindowRevealGeometry();
    const material = new MeshBasicMaterial();
    for (const side of [-1, 1]) {
      const pivot = new Group(); pivot.position.set(side * 0.319, 0.07, 0.112);
      pivot.rotation.y = side * Math.PI / 2;
      const pane = new Mesh(geometry, material); pane.scale.x = -side; pivot.add(pane);
      pivot.updateMatrixWorld(true);
      const window = new Box3().setFromObject(pane);
      for (const bottle of WHISKY_BOTTLES.filter(bottle => bottle.position[1] < 0.1)) {
        const x = -bottle.position[0];
        const gap = Math.max(window.min.x - x - bottle.radius, x - bottle.radius - window.max.x);
        expect(gap).toBeGreaterThan(0.004);
      }
    }
    geometry.dispose(); material.dispose();
  });
});
