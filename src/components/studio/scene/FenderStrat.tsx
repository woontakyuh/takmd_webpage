import { useGLTF } from '@react-three/drei';
import { useEffect, useMemo } from 'react';
import { Float32BufferAttribute, Mesh, MeshStandardMaterial } from 'three';
import type { BufferGeometry, Material } from 'three';
import { Block, Rod } from './Primitives';

const MODEL_URL = '/models/fender/stratocaster-sunburst.glb' as const;
const DARK = '#20201d';

const SIENNA_FRAGMENT = `
  #include <map_fragment>
  float bodyLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  vec2 bodyPosition = (vBodyPosition.xy - vec2(-0.6763, 0.9686)) / vec2(0.6780, 0.9686);
  float bodyEdge = smoothstep(0.36, 0.96, length(bodyPosition));
  float darkFinish = 1.0 - smoothstep(0.08, 0.22, bodyLuma);
  float backFactor = 1.0 - smoothstep(1.08, 1.17, vBodyPosition.z);
  vec3 frontCherry = vec3(0.42, 0.015, 0.008);
  vec3 rearSunburst = mix(vec3(0.72, 0.24, 0.045), vec3(0.27, 0.018, 0.008), bodyEdge);
  vec3 siennaSurface = mix(frontCherry, rearSunburst, backFactor);
  diffuseColor.rgb = mix(diffuseColor.rgb, siennaSurface, vBodySurface * darkFinish * 0.92);
`;

const MAPLE_FRAGMENT = `
  #include <map_fragment>
  float neckLuma = dot(diffuseColor.rgb, vec3(0.2126, 0.7152, 0.0722));
  float boardU = smoothstep(0.187, 0.195, vMapUv.x) * (1.0 - smoothstep(0.315, 0.323, vMapUv.x));
  float darkBoard = 1.0 - smoothstep(0.38, 0.58, neckLuma);
  vec3 mapleWood = vec3(0.54, 0.30, 0.12) + neckLuma * vec3(0.78, 0.65, 0.46);
  diffuseColor.rgb = mix(diffuseColor.rgb, mapleWood, boardU * darkBoard * 0.94);
  float blackDot = 0.0;
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.1870))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.3154))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.4292))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.5317))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2314, 0.6641))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2788, 0.6641))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.7754))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.8394))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.8965))));
  blackDot = max(blackDot, 1.0 - smoothstep(0.0055, 0.0080, distance(vMapUv, vec2(0.2549, 0.9478))));
  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.025, 0.018, 0.012), blackDot * boardU);
`;

function adaptMaterial(source: Material): Material {
  const material = source.clone();
  if (!(material instanceof MeshStandardMaterial)) return material;
  const fragment = material.name === 'Neck' ? MAPLE_FRAGMENT : material.name === 'Guitar' ? SIENNA_FRAGMENT : null;
  if (!fragment) return material;
  material.onBeforeCompile = shader => {
    if (material.name === 'Guitar') {
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', '#include <common>\nattribute float bodySurface;\nvarying float vBodySurface;\nvarying vec3 vBodyPosition;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBodySurface = bodySurface;\nvBodyPosition = position;');
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <common>',
        '#include <common>\nvarying float vBodySurface;\nvarying vec3 vBodyPosition;',
      );
    }
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', fragment);
  };
  material.customProgramCacheKey = () => `fender-${material.name}-sienna-maple-v2`;
  return material;
}

function prepareGeometry(source: BufferGeometry): BufferGeometry {
  const geometry = source.clone();
  const position = geometry.getAttribute('position');
  const bodySurface = new Float32Array(position.count);
  const index = geometry.getIndex();
  if (!index || position.count < 9_000) {
    geometry.setAttribute('bodySurface', new Float32BufferAttribute(bodySurface, 1));
    return geometry;
  }

  const parent = Array.from({ length: position.count }, (_, vertex) => vertex);
  const find = (vertex: number): number => {
    let root = vertex;
    while (parent[root] !== root) root = parent[root];
    while (parent[vertex] !== vertex) {
      const next = parent[vertex];
      parent[vertex] = root;
      vertex = next;
    }
    return root;
  };
  const unite = (first: number, second: number) => {
    const firstRoot = find(first), secondRoot = find(second);
    if (firstRoot !== secondRoot) parent[secondRoot] = firstRoot;
  };
  const welded = new Map<string, number>();
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const key = `${Math.round(position.getX(vertex) * 100_000)}:${Math.round(position.getY(vertex) * 100_000)}:${Math.round(position.getZ(vertex) * 100_000)}`;
    const match = welded.get(key);
    if (match === undefined) welded.set(key, vertex);
    else unite(vertex, match);
  }
  for (let offset = 0; offset < index.count; offset += 3) {
    const first = index.getX(offset), second = index.getX(offset + 1), third = index.getX(offset + 2);
    unite(first, second);
    unite(second, third);
  }

  const bounds = new Map<number, { min: number[]; max: number[] }>();
  for (let vertex = 0; vertex < position.count; vertex += 1) {
    const root = find(vertex);
    const component = bounds.get(root) ?? {
      min: [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      max: [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
    };
    const values = [position.getX(vertex), position.getY(vertex), position.getZ(vertex)];
    for (let axis = 0; axis < 3; axis += 1) {
      component.min[axis] = Math.min(component.min[axis], values[axis]);
      component.max[axis] = Math.max(component.max[axis], values[axis]);
    }
    bounds.set(root, component);
  }
  const bodyRoot = [...bounds].find(([, component]) =>
    component.max[0] - component.min[0] > 1.3
    && component.max[1] - component.min[1] > 1.8
    && component.max[2] - component.min[2] > 0.15,
  )?.[0];
  if (bodyRoot !== undefined) {
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      if (find(vertex) === bodyRoot) bodySurface[vertex] = 1;
    }
  }
  geometry.setAttribute('bodySurface', new Float32BufferAttribute(bodySurface, 1));
  return geometry;
}

export function FenderStrat() {
  const { scene } = useGLTF(MODEL_URL);
  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const materials: Material[] = [];
    const geometries: BufferGeometry[] = [];
    clone.name = 'Fender Stratocaster sunburst licensed mesh';
    clone.traverse((child) => {
      if (!(child instanceof Mesh)) return;
      child.castShadow = true;
      child.receiveShadow = true;
      child.geometry = prepareGeometry(child.geometry);
      geometries.push(child.geometry);
      const source = Array.isArray(child.material) ? child.material : [child.material];
      const adapted = source.map(material => {
        const result = adaptMaterial(material);
        materials.push(result);
        return result;
      });
      child.material = Array.isArray(child.material) ? adapted : adapted[0];
    });
    return { model: clone, materials, geometries };
  }, [scene]);
  useEffect(() => () => {
    prepared.materials.forEach(material => material.dispose());
    prepared.geometries.forEach(geometry => geometry.dispose());
  }, [prepared]);

  return <group name="Fender USA Stratocaster Sienna Sunburst on floor stand">
    <group scale={0.24}>
      <primitive
        object={prepared.model}
        position={[0.676, 0.54, -1.138]}
        rotation={[Math.PI / 2, 0, 0]}
        dispose={null}
      />
    </group>
    <group name="padded A-frame guitar stand">
      <Rod from={[-0.112, 0.018, -0.09]} to={[-0.052, 0.505, -0.015]} radius={0.008} color={DARK} metalness={0.28} />
      <Rod from={[0.112, 0.018, -0.09]} to={[0.052, 0.505, -0.015]} radius={0.008} color={DARK} metalness={0.28} />
      <Rod from={[-0.112, 0.018, -0.09]} to={[-0.18, 0.018, 0.11]} radius={0.009} color={DARK} metalness={0.28} />
      <Rod from={[0.112, 0.018, -0.09]} to={[0.18, 0.018, 0.11]} radius={0.009} color={DARK} metalness={0.28} />
      <Rod from={[-0.073, 0.191, -0.047]} to={[-0.09, 0.185, 0.045]} radius={0.008} color={DARK} metalness={0.28} />
      <Rod from={[0.073, 0.191, -0.047]} to={[0.09, 0.185, 0.045]} radius={0.008} color={DARK} metalness={0.28} />
      <Block size={[0.09, 0.018, 0.035]} position={[-0.09, 0.185, 0.045]} rotation={[0, 0, -0.18]} color="#393833" radius={0.007} roughness={0.95} />
      <Block size={[0.09, 0.018, 0.035]} position={[0.09, 0.185, 0.045]} rotation={[0, 0, 0.18]} color="#393833" radius={0.007} roughness={0.95} />
    </group>
  </group>;
}

useGLTF.preload(MODEL_URL);
