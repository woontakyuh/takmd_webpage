import { useGLTF } from '@react-three/drei';
import { Component, Suspense, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';

export class GlbBoundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Loads a GLB, normalizes it so its largest dimension equals `fit` (world units),
 * centers it on x/z and rests its bottom on y=0 — Higgsfield image_to_3d output
 * comes origin-centered at arbitrary scale, so every drop-in gets the same treatment.
 */
function Fitted({ url, fit }: { url: string; fit: number }) {
  const { scene } = useGLTF(url);
  const { scale, offset } = useMemo(() => {
    scene.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const s = fit / Math.max(size.x, size.y, size.z, 1e-6);
    return {
      scale: s,
      offset: [-center.x * s, -box.min.y * s, -center.z * s] as [number, number, number],
    };
  }, [scene, fit]);
  return (
    <group position={offset} scale={scale}>
      <primitive object={scene} />
    </group>
  );
}

export function FittedGlb({ url, fit, fallback }: { url: string; fit: number; fallback: ReactNode }) {
  return (
    <GlbBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <Fitted url={url} fit={fit} />
      </Suspense>
    </GlbBoundary>
  );
}
