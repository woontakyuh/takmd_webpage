import { Html, useGLTF } from '@react-three/drei';
import { Component, Suspense, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { Material } from 'three';
import type { StudioSceneProps } from '../types';
import { Interactive } from './Interactive';
import { Block } from './Primitives';
import { PALETTE, ROOM } from './config';

class AnatomyBoundary extends Component<{ readonly children: ReactNode }, { readonly failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? <ModelStatus text="Model unavailable" /> : this.props.children; }
}

function ModelStatus({ text }: { readonly text: string }) {
  return (
    <Html center position={[0, 0.56, 0]} style={{ pointerEvents: 'none' }}>
      <span style={{ display: 'block', width: '112px', color: PALETTE.muted, textAlign: 'center', font: '11px Arial, sans-serif', letterSpacing: '0.06em' }}>{text}</span>
    </Html>
  );
}

function AnatomyModel() {
  const { scene } = useGLTF('/models/spine.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const cloneMaterial = (original: Material) => {
      const material = original.clone();
      if (material instanceof MeshStandardMaterial) material.roughness = 0.74;
      return material;
    };
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.material = Array.isArray(node.material)
        ? node.material.map(cloneMaterial) : cloneMaterial(node.material);
    });
    const bounds = new Box3().setFromObject(clone);
    const center = bounds.getCenter(new Vector3());
    const scale = ROOM.spine.height / Math.max(bounds.max.y - bounds.min.y, 0.001);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
    return clone;
  }, [scene]);
  useEffect(() => () => {
    model.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => material.dispose());
    });
  }, [model]);
  return <primitive object={model} />;
}

type SpineProps = Pick<StudioSceneProps, 'selected' | 'onSelect' | 'reducedMotion'>;

export function SpineExhibit({ selected, onSelect, reducedMotion }: SpineProps) {
  return (
    <Interactive id="spine" selected={selected} onSelect={onSelect} reducedMotion={reducedMotion} position={ROOM.spine.position}>
      <Block size={[0.26, 0.035, 0.22]} position={[0, 0.0175, 0]} radius={0.006} color={PALETTE.ink} roughness={0.78} />
      <group position={[0, 0.055, 0]} rotation={[0, ROOM.spine.rotation, 0]}>
        <AnatomyBoundary><Suspense fallback={<ModelStatus text="Loading specimen" />}><AnatomyModel /></Suspense></AnatomyBoundary>
      </group>
    </Interactive>
  );
}
