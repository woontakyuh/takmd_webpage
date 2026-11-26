import { BufferGeometry, CircleGeometry, LatheGeometry, Vector2 } from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type PalmPlanterGeometries = Readonly<{
  pot: BufferGeometry;
  soil: BufferGeometry;
  stand: BufferGeometry;
}>;

class PalmGeometryMergeError extends Error {
  override readonly name = 'PalmGeometryMergeError';
}

function mergeParts(parts: readonly BufferGeometry[]): BufferGeometry {
  const result = mergeGeometries([...parts], false);
  parts.forEach(part => part.dispose());
  if (!result) throw new PalmGeometryMergeError('Palm planter parts must share compatible attributes.');
  return result;
}

function createStandGeometry(): BufferGeometry {
  const legs = [-1, 1].flatMap(x => [-1, 1].map(z =>
    new RoundedBoxGeometry(0.030, 0.62, 0.030, 2, 0.005).translate(x * 0.205, 0.31, z * 0.205)));
  const rails = [
    new RoundedBoxGeometry(0.61, 0.026, 0.030, 2, 0.005).rotateY(Math.PI / 4).translate(0, 0.167, 0),
    new RoundedBoxGeometry(0.61, 0.026, 0.030, 2, 0.005).rotateY(-Math.PI / 4).translate(0, 0.167, 0),
  ];
  return mergeParts([...legs, ...rails]);
}

export function createPalmPlanterGeometries(): PalmPlanterGeometries {
  const profile = [
    new Vector2(0.180, 0.18),
    new Vector2(0.200, 0.20),
    new Vector2(0.200, 0.59),
    new Vector2(0.195, 0.64),
    new Vector2(0.180, 0.65),
  ];
  return {
    pot: mergeParts([
      new LatheGeometry(profile, 40),
      new CircleGeometry(0.180, 40).rotateX(Math.PI / 2).translate(0, 0.18, 0),
    ]),
    soil: new CircleGeometry(0.179, 40).rotateX(-Math.PI / 2).translate(0, 0.646, 0),
    stand: createStandGeometry(),
  };
}
