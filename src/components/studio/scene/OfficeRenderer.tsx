import { useFrame, useThree } from '@react-three/fiber';
import { useLayoutEffect, useMemo, useRef } from 'react';
import { Frustum, Matrix4, Mesh, MeshPhysicalMaterial, Vector3 } from 'three';
import type { BufferGeometry } from 'three';
import type { StudioSceneProps } from '../types';
import { DistantGlass } from './DistantGlass';

type ShadowSnapshot = {
  readonly matrix: Matrix4;
  geometry: BufferGeometry;
  frame: number;
};

export function OfficeRenderer({ lighting, environmentIntensity, mobile }: Pick<StudioSceneProps, 'lighting'> & { readonly environmentIntensity: number; readonly mobile: boolean }) {
  const gl = useThree(state => state.gl);
  const scene = useThree(state => state.scene);
  useLayoutEffect(() => { scene.environmentIntensity = environmentIntensity; }, [scene, environmentIntensity]);
  const snapshots = useRef(new WeakMap<Mesh, ShadowSnapshot>());
  const previousCount = useRef(0);
  const frame = useRef(0);
  const glassCenter = useMemo(() => new Vector3(), []);
  const glass = useMemo(() => new DistantGlass(), []);
  const frustum = useMemo(() => new Frustum(), []);
  const projection = useMemo(() => new Matrix4(), []);
  useLayoutEffect(() => () => glass.restore(), [glass]);
  useLayoutEffect(() => {
    const autoUpdate = gl.shadowMap.autoUpdate;
    const transmissionScale = gl.transmissionResolutionScale;
    gl.shadowMap.autoUpdate = false;
    gl.shadowMap.needsUpdate = true;
    return () => {
      gl.shadowMap.autoUpdate = autoUpdate;
      gl.transmissionResolutionScale = transmissionScale;
    };
  }, [gl]);
  useLayoutEffect(() => { gl.shadowMap.needsUpdate = true; }, [gl, lighting]);

  // Run after controls and all object animation callbacks, then render once.
  useFrame(({ scene, camera, size }) => {
    frame.current += 1;
    const currentFrame = frame.current;
    let count = 0;
    scene.updateMatrixWorld();
    frustum.setFromProjectionMatrix(projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    glass.beginFrame();
    scene.traverseVisible(object => {
      if (!(object instanceof Mesh)) return;
      const materials = Array.isArray(object.material) ? object.material : [object.material];
      if (materials.some(material => material instanceof MeshPhysicalMaterial && glass.tracks(material))) {
        if (!object.geometry.boundingSphere) object.geometry.computeBoundingSphere();
        const sphere = object.geometry.boundingSphere;
        if (sphere) {
          glassCenter.copy(sphere.center).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
          const radius = sphere.radius * object.matrixWorld.getMaxScaleOnAxis();
          const pixels = glassCenter.z - radius < 0 && frustum.intersectsObject(object)
            ? radius * camera.projectionMatrix.elements[5] * size.height / Math.max(0.001, -glassCenter.z - radius) : 0;
          materials.forEach(material => {
            if (!(material instanceof MeshPhysicalMaterial)) return;
            glass.observe(material, pixels);
          });
        }
      }
      if (!object.castShadow) return;
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
    glass.update(mobile);
    const glassPixels = glass.detailedPixels * gl.getPixelRatio();
    gl.transmissionResolutionScale = glassPixels > (gl.transmissionResolutionScale === 1 ? 96 : 112) ? 1 : 0.5;
    const autoUpdate = scene.matrixWorldAutoUpdate;
    scene.matrixWorldAutoUpdate = false;
    gl.render(scene, camera);
    scene.matrixWorldAutoUpdate = autoUpdate;
  }, 1);
  return null;
}
