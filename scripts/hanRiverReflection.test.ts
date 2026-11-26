import assert from 'node:assert/strict';
import { test } from 'node:test';
import * as THREE from 'three';
import { updateRiverReflectionCamera } from '../src/components/studio/scene/HanRiverAtmosphere';

test('reflection retains the full projection without mutating the cropped exterior camera', () => {
  const source = new THREE.PerspectiveCamera(42, 1280 / 900, 0.1, 12000);
  source.position.set(278.55, 301.7, -1400.3);
  source.lookAt(270, 301.7, -1404.3);
  source.updateMatrixWorld();
  const fullProjection = source.projectionMatrix.clone();
  source.setViewOffset(1280, 900, 0, 0, 832, 900);
  const croppedProjection = source.projectionMatrix.clone();
  const croppedView = { ...source.view };
  const target = new THREE.PerspectiveCamera();
  updateRiverReflectionCamera(source, target);
  assert.deepEqual(target.projectionMatrix.elements, fullProjection.elements);
  assert.deepEqual(target.matrixWorld.elements, source.matrixWorld.elements);
  assert.equal(target.view?.enabled, false);
  assert.deepEqual(source.projectionMatrix.elements, croppedProjection.elements);
  assert.deepEqual(source.view, croppedView);
  source.clearViewOffset(); source.position.x += 4; source.updateMatrixWorld();
  updateRiverReflectionCamera(source, target);
  assert.deepEqual(target.position.toArray(), source.position.toArray());
  assert.deepEqual(target.projectionMatrix.elements, source.projectionMatrix.elements);
});
