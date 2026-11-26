import { describe, expect, test } from 'bun:test';
import { Box3, CylinderGeometry, Group, Mesh, MeshBasicMaterial, Raycaster, Vector3 } from 'three';
import { BEOLAB_8000 as B, BEOLAB_8000_PAIR } from '../src/components/studio/scene/Beolab8000Layout';
import { MOBILE_TOUR, ROOM, TOUR, WALL_TV } from '../src/components/studio/scene/config';

const speakers = BEOLAB_8000_PAIR.map(pose => {
  const group = new Group();
  group.position.set(...pose.position); group.rotation.y = pose.rotation;
  const mesh = new Mesh(new CylinderGeometry(B.grilleRadius, B.grilleRadius, B.height - B.coneTop, 64), new MeshBasicMaterial());
  mesh.position.y = (B.height + B.coneTop) / 2;
  group.add(mesh); group.updateMatrixWorld(true);
  return group;
});

function occludedSamples(camera, min, max, steps = 20) {
  const origin = new Vector3(...camera), ray = new Raycaster();
  const blocked = [];
  for (let row = 0; row <= steps; row++) for (let column = 0; column <= steps; column++) {
    const point = new Vector3(min[0] + (max[0] - min[0]) * column / steps,
      min[1] + (max[1] - min[1]) * row / steps, min[2]);
    const direction = point.clone().sub(origin);
    ray.set(origin, direction.normalize()); ray.far = origin.distanceTo(point);
    if (ray.intersectObjects(speakers, true).length) blocked.push(point.toArray());
  }
  return blocked;
}

describe('Beolab 8000 floor pair fits the existing TV wall', () => {
  test('full-size columns clear shelf, cabinets, TV and floor', () => {
    const shelf = new Box3(new Vector3(-1.35, .801, 2.961), new Vector3(1.35, .82, 3.261));
    const tv = new Box3(new Vector3(-WALL_TV.width / 2, ROOM.gallery.position[1] - WALL_TV.height / 2, 3.229),
      new Vector3(WALL_TV.width / 2, ROOM.gallery.position[1] + WALL_TV.height / 2, 3.261));
    for (const [index, pose] of BEOLAB_8000_PAIR.entries()) {
      const column = new Box3().setFromObject(speakers[index]);
      expect(column.intersectsBox(shelf)).toBe(false);
      expect(column.intersectsBox(tv)).toBe(false);
      expect(Math.abs(pose.position[0]) - B.baseWidth / 2).toBeGreaterThan(2.40);
      expect(Math.abs(pose.position[0]) + B.baseWidth / 2).toBeLessThan(Math.abs(ROOM.architecture.leftX));
      expect(pose.position[2] + B.grilleRadius).toBeLessThan(2.961);
      expect(pose.position[1]).toBe(.0185);
      expect(pose.position[1] + B.height).toBeCloseTo(1.3385, 6);
    }
    expect(BEOLAB_8000_PAIR[0].position[2] - B.baseWidth / 2 - 2.676100574558421).toBeGreaterThan(.09);
  });

  test('clock numerals and 9000 remain visible from desktop and mobile tours', () => {
    for (const { position } of [...TOUR, ...MOBILE_TOUR]) {
      expect(occludedSamples(position, [.699, .846, 3.075], [1.121, 1.078, 3.075])).toEqual([]);
      expect(occludedSamples(position, [-.4345, .837, 3.01], [.4345, 1.138, 3.01])).toEqual([]);
    }
  });

  test('TV screen and nearby award faces stay unobstructed from overview', () => {
    const faces = [
      [[-WALL_TV.screenWidth / 2, ROOM.gallery.position[1] - WALL_TV.screenHeight / 2, 3.228],
        [WALL_TV.screenWidth / 2, ROOM.gallery.position[1] + WALL_TV.screenHeight / 2, 3.228]],
      [[-1.632, 1.32, 3.08], [-1.448, 1.535, 3.08]],
      [[1.442, 1.835, 3.105], [1.741, 2.047, 3.105]],
    ];
    for (const { position } of [TOUR[0], MOBILE_TOUR[0]]) for (const [min, max] of faces) {
      expect(occludedSamples(position, min, max)).toEqual([]);
    }
  });
});
