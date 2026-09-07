import { Html, useCursor, useGLTF } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Box3, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import type { Material } from 'three';
import { workshops } from '../../../data/workshops';
import { Block } from './Primitives';
import { BiportalEndoscope } from './BiportalEndoscope';
import { PigPlush } from './PigPlush';
import { INTERIOR, PALETTE, ROOM } from './config';
import type { Point } from './config';

const CLICK_DRAG_THRESHOLD = 5;
const CABINET_TOP = ROOM.credenza.position[1] + ROOM.credenza.height;

type WorkshopLinkProps = {
  readonly label: string;
  readonly position: Point;
  readonly route: `/workshops/${string}`;
  readonly children: ReactNode;
};

function WorkshopLink({ label, position, route, children }: WorkshopLinkProps) {
  const pointerStart = useRef<{ readonly x: number; readonly y: number } | null>(null);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered);

  return (
    <group
      name={`Workshop ${route}`}
      position={[...position]}
      onPointerOver={(event) => {
        event.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
      onPointerDown={(event) => {
        pointerStart.current = { x: event.clientX, y: event.clientY };
      }}
      onPointerCancel={() => {
        pointerStart.current = null;
      }}
      onClick={(event) => {
        event.stopPropagation();
        const start = pointerStart.current;
        pointerStart.current = null;
        if (!start || event.delta >= CLICK_DRAG_THRESHOLD
          || Math.hypot(event.clientX - start.x, event.clientY - start.y) >= CLICK_DRAG_THRESHOLD) return;
        window.location.assign(route);
      }}
    >
      {children}
      {hovered && (
        <Html center position={[0.32, 0.28, 0]} style={{ pointerEvents: 'none' }} zIndexRange={[20, 10]}>
          <span style={{
            display: 'block',
            width: 'max-content',
            maxWidth: '168px',
            padding: '7px 10px',
            border: `1px solid ${PALETTE.line}`,
            borderRadius: '4px',
            background: 'rgba(248, 246, 240, 0.96)',
            boxShadow: '0 8px 24px rgba(32, 45, 42, 0.14)',
            color: PALETTE.ink,
            font: '600 11px Manrope, Arial, sans-serif',
            letterSpacing: '0.02em',
            textAlign: 'center',
          }}>{label}</span>
        </Html>
      )}
    </group>
  );
}

function LyingSpineModel() {
  const { scene } = useGLTF('/models/spine.glb');
  const model = useMemo(() => {
    const clone = scene.clone(true);
    const cloneMaterial = (original: Material) => {
      const material = original.clone();
      if (material instanceof MeshStandardMaterial) material.roughness = 0.78;
      return material;
    };
    clone.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.castShadow = true;
      node.receiveShadow = true;
      node.geometry = node.geometry.clone();
      node.geometry.computeBoundingBox();
      const bounds = node.geometry.boundingBox;
      if (bounds) {
        const floor = bounds.min.y + (bounds.max.y - bounds.min.y) * 0.09;
        const position = node.geometry.getAttribute('position');
        const sourceIndex = node.geometry.getIndex();
        const count = sourceIndex?.count ?? position.count;
        const indices: number[] = [];
        for (let index = 0; index < count; index += 3) {
          const a = sourceIndex?.getX(index) ?? index;
          const b = sourceIndex?.getX(index + 1) ?? index + 1;
          const c = sourceIndex?.getX(index + 2) ?? index + 2;
          if (Math.min(position.getY(a), position.getY(b), position.getY(c)) >= floor) indices.push(a, b, c);
        }
        node.geometry.setIndex(indices);
        bounds.min.y = floor;
      }
      node.material = Array.isArray(node.material)
        ? node.material.map(cloneMaterial)
        : cloneMaterial(node.material);
    });
    const bounds = new Box3().setFromObject(clone);
    const center = bounds.getCenter(new Vector3());
    const scale = 0.24 / Math.max(bounds.max.y - bounds.min.y, 0.001);
    clone.scale.setScalar(scale);
    clone.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
    return clone;
  }, [scene]);

  useEffect(() => () => {
    model.traverse((node) => {
      if (!(node instanceof Mesh)) return;
      node.geometry.dispose();
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach((material) => material.dispose());
    });
  }, [model]);

  return <primitive object={model} />;
}

function TrainingDummy() {
  return (
    <group>
      <Block size={[0.25, 0.045, 0.36]} position={[0, 0.023, 0]}
        color="#C9977E" radius={0.025} roughness={0.88} />
      <Block size={[0.12, 0.018, 0.29]} position={[0.015, 0.053, 0]}
        color="#7E4F43" radius={0.018} roughness={0.92} />
      <group position={[0.01, 0.098, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <LyingSpineModel />
      </group>
      <Block size={[0.28, 0.016, 0.39]} position={[0, -0.006, 0]}
        color={INTERIOR.bronze} radius={0.01} roughness={0.7} />
    </group>
  );
}

function EndoscopeTray() {
  return (
    <group>
      <Block size={[0.29, 0.018, 0.44]} position={[0, 0.009, 0]}
        color={PALETTE.aluminiumEdge} radius={0.016} roughness={0.32} metalness={0.72} />
      <Block size={[0.255, 0.012, 0.405]} position={[0, 0.021, 0]}
        color={PALETTE.paperLight} radius={0.012} roughness={0.88} />
      <BiportalEndoscope />
    </group>
  );
}

export function WorkshopObjects() {
  const dummy = workshops[0];
  const cadaver = workshops[1];
  const animal = workshops[2];

  return (
    <group rotation={[0, 0, 0]}>
      <WorkshopLink label={dummy.title} route={`/workshops/${dummy.slug}`} position={[-2.38, CABINET_TOP + 0.014, 0.27]}>
        <TrainingDummy />
      </WorkshopLink>
      <WorkshopLink label={cadaver.title} route={`/workshops/${cadaver.slug}`} position={[-2.38, CABINET_TOP, -0.22]}>
        <EndoscopeTray />
      </WorkshopLink>
      <WorkshopLink label={animal.title} route={`/workshops/${animal.slug}`} position={[-2.37, CABINET_TOP, -0.78]}>
        <PigPlush />
      </WorkshopLink>
    </group>
  );
}
