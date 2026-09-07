import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useRef } from 'react';
import { Matrix4, Mesh } from 'three';
import type { BufferGeometry } from 'three';
import type { StudioSceneProps } from '../types';

type ShadowSnapshot = {
  readonly matrix: Matrix4;
  geometry: BufferGeometry;
  frame: number;
};

export function OfficeRenderer({ lighting }: Pick<StudioSceneProps, 'lighting'>) {
  const gl = useThree(state => state.gl);
  const snapshots = useRef(new WeakMap<Mesh, ShadowSnapshot>());
  const previousCount = useRef(0);
  const frame = useRef(0);
  useLayoutEffect(() => {
    const autoUpdate = gl.shadowMap.autoUpdate;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => { gl.shadowMap.autoUpdate = autoUpdate; };
  }, [gl]);
  useLayoutEffect(() => { gl.shadowMap.needsUpdate = true; }, [gl, lighting]);

  // Run after controls and all object animation callbacks, then render once.
  useFrame(({ scene, camera }) => {
    frame.current += 1;
    const currentFrame = frame.current;
    let count = 0;
    scene.updateMatrixWorld();
    scene.traverseVisible(object => {
      if (!(object instanceof Mesh) || !object.castShadow) return;
      count += 1;
      const saved = snapshots.current.get(object);
      if (!saved) {
        snapshots.current.set(object, { matrix: object.matrixWorld.clone(), geometry: object.geometry, frame: currentFrame });
        gl.shadowMap.needsUpdate = true;
        return;
      }
      const moved = saved.matrix.elements.some((value, index) => Math.abs(value - object.matrixWorld.elements[index]) > 0.00001);
      if (saved.frame !== currentFrame - 1 || saved.geometry !== object.geometry || moved) {
        saved.matrix.copy(object.matrixWorld);
        saved.geometry = object.geometry;
        gl.shadowMap.needsUpdate = true;
      }
      saved.frame = currentFrame;
    });
    if (count !== previousCount.current) gl.shadowMap.needsUpdate = true;
    previousCount.current = count;
    const autoUpdate = scene.matrixWorldAutoUpdate;
    scene.matrixWorldAutoUpdate = false;
    gl.render(scene, camera);
    scene.matrixWorldAutoUpdate = autoUpdate;
  }, 1);
  return null;
}
