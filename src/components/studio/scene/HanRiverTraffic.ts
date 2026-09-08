import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface RiverTrafficOptions {
  readonly start: THREE.Vector3;
  readonly end: THREE.Vector3;
  readonly subtle: boolean;
}

function createRiverTraffic(scene: THREE.Scene, { start, end, subtle }: RiverTrafficOptions) {
  const length = start.distanceTo(end);
  const time = { value: 0 };
  const group = new THREE.Group();
  group.name = subtle ? 'Distant bridge traffic' : 'Main bridge traffic';
  group.position.copy(start).lerp(end, 0.5);
  group.rotation.y = Math.atan2(end.x - start.x, end.z - start.z);
  scene.add(group);
  const lanes = subtle ? [-1.9, 1.9] : [-5.2, -1.8, 1.8, 5.2];
  const carsPerLane = subtle ? 10 : 14;
  const count = lanes.length * carsPerLane;
  const flow = new Float32Array(count * 2);
  const transforms: THREE.Matrix4[] = [];
  const colors: THREE.Color[] = [];
  const palette = [0xeae8e1, 0xf8f6f0, 0x5c655f, 0x202d2a, 0x769b88, 0xac5737] as const;
  for (const [laneIndex, lateral] of lanes.entries()) {
    const direction = lateral < 0 ? 1 : -1;
    for (let slot = 0; slot < carsPerLane; slot += 1) {
      const index = laneIndex * carsPerLane + slot;
      const jitter = Math.sin(index * 91.173) * 0.18;
      flow[index * 2] = (slot + 0.5 + jitter) / carsPerLane;
      flow[index * 2 + 1] = (11.5 + laneIndex * 1.1) / length;
      transforms.push(new THREE.Matrix4().compose(
        new THREE.Vector3(lateral, subtle ? 1.63 : 2.03, 0),
        new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), direction < 0 ? Math.PI : 0),
        new THREE.Vector3(1, 1, 1),
      ));
      colors.push(new THREE.Color(palette[index % palette.length]));
    }
  }
  const flowAttribute = new THREE.InstancedBufferAttribute(flow, 2);
  const bindMotion = (material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial): void => {
    material.onBeforeCompile = shader => {
      shader.uniforms.uTrafficTime = time;
      shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
        uniform float uTrafficTime;
        attribute vec2 trafficFlow;
        varying float vTrafficPresence;`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          float progress = fract(trafficFlow.x + uTrafficTime * trafficFlow.y);
          float edgeDistance = min(progress, 1.0 - progress) * ${length.toFixed(4)};
          vTrafficPresence = smoothstep(8.0, 32.0, edgeDistance);
          transformed.z += (progress - 0.5) * ${length.toFixed(4)};`);
      shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vTrafficPresence;')
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          float coverage = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
          if (vTrafficPresence < coverage) discard;`);
    };
    material.customProgramCacheKey = () => `han-river-traffic-${subtle}`;
  };
  const body = new THREE.MeshStandardMaterial({ roughness: 0.48, metalness: 0.18 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x283c3d, roughness: 0.24, metalness: 0.16 });
  const tires = new THREE.MeshStandardMaterial({ color: 0x202d2a, roughness: 0.94 });
  const headlights = new THREE.MeshBasicMaterial({ color: 0x769b88, toneMapped: true });
  const taillights = new THREE.MeshBasicMaterial({ color: 0xac5737, toneMapped: true });
  const add = (geometry: THREE.BufferGeometry, material: THREE.MeshStandardMaterial | THREE.MeshBasicMaterial, colored = false): void => {
    geometry.setAttribute('trafficFlow', flowAttribute);
    bindMotion(material);
    const mesh = new THREE.InstancedMesh(geometry, material, count);
    mesh.name = `${group.name} ${colored ? 'bodies' : 'details'}`;
    mesh.frustumCulled = false; // The shader moves cars along the whole bridge, outside their base-instance bounds.
    transforms.forEach((matrix, index) => {
      mesh.setMatrixAt(index, matrix);
      if (colored) mesh.setColorAt(index, colors[index]);
    });
    group.add(mesh);
  };
  add(new THREE.BoxGeometry(1.88, 0.7, 4.5).translate(0, 0.64, 0), body, true);
  const cabin = new THREE.BoxGeometry(1.58, 0.56, 2.4);
  const vertices = cabin.getAttribute('position');
  for (let index = 0; index < vertices.count; index += 1) {
    if (vertices.getY(index) > 0) vertices.setXYZ(index, vertices.getX(index) * 0.88, vertices.getY(index), vertices.getZ(index) * 0.74);
  }
  cabin.computeVertexNormals();
  add(cabin.translate(0, 1.25, -0.2), glass);
  const wheels: THREE.BufferGeometry[] = [];
  for (const x of [-0.92, 0.92]) for (const z of [-1.4, 1.4]) {
    wheels.push(new THREE.CylinderGeometry(0.31, 0.31, 0.22, 7).rotateZ(Math.PI / 2).translate(x, 0.32, z));
  }
  add(mergeGeometries(wheels), tires);
  wheels.forEach(geometry => geometry.dispose());
  for (const [material, z] of [[headlights, 2.26], [taillights, -2.26]] as const) {
    const pair = [-0.65, 0.65].map(x => new THREE.SphereGeometry(0.28, 6, 4).scale(1, 0.58, 0.52).translate(x, 0.72, z));
    add(mergeGeometries(pair), material);
    pair.forEach(geometry => geometry.dispose());
  }
  return {
    setTime: (seconds: number): void => { time.value = seconds; },
    setNightMix: (mix: number): void => {
      headlights.color.setRGB(THREE.MathUtils.lerp(0.22, 12, mix), THREE.MathUtils.lerp(0.24, 10.8, mix), THREE.MathUtils.lerp(0.2, 8.4, mix));
      taillights.color.setRGB(THREE.MathUtils.lerp(0.25, 8, mix), 0.025, 0.008);
    },
  };
}

export function createRiverBridge(scene: THREE.Scene, { start, end, subtle }: RiverTrafficOptions) {
  const delta = end.clone().sub(start);
  const length = delta.length();
  const midpoint = start.clone().add(end).multiplyScalar(0.5);
  const yaw = Math.atan2(delta.x, delta.z);
  const concrete = new THREE.MeshStandardMaterial({ color: subtle ? 0x879198 : 0xaeb7bb, roughness: 0.82 });
  const rail = new THREE.MeshStandardMaterial({ color: 0xc2c7c5, roughness: 0.58 });
  const warm = new THREE.MeshBasicMaterial({ color: 0xffc878, toneMapped: true });
  const deckWidth = subtle ? 16 : 22;
  const deck = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, subtle ? 3.2 : 4, length), concrete);
  deck.position.copy(midpoint);
  deck.rotation.y = yaw;
  scene.add(deck);
  const asphalt = new THREE.MeshStandardMaterial({ color: 0x5d6262, roughness: 0.96 });
  asphalt.onBeforeCompile = shader => {
    shader.vertexShader = shader.vertexShader.replace('#include <common>', '#include <common>\nvarying vec2 vRoadUv;')
      .replace('#include <uv_vertex>', '#include <uv_vertex>\nvRoadUv = uv;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec2 vRoadUv;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        float across = vRoadUv.x * ${deckWidth - 2}.0;
        float lane = abs(fract(across / 3.5) - 0.5) * 3.5;
        float mark = 1.0 - smoothstep(0.06, 0.06 + fwidth(across), lane);
        mark *= 1.0 - smoothstep(0.2, 0.8, fwidth(across));
        float dash = step(0.55, fract(vRoadUv.y * ${Math.round(length / 12)}.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.64, 0.62, 0.53), mark * dash * 0.7);`);
  };
  asphalt.customProgramCacheKey = () => `han-river-road-${subtle}`;
  const roadway = new THREE.Mesh(new THREE.PlaneGeometry(deckWidth - 2, length), asphalt);
  roadway.position.copy(midpoint).add(new THREE.Vector3(0, subtle ? 1.62 : 2.02, 0));
  roadway.rotation.set(-Math.PI / 2, 0, 0);
  roadway.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), yaw);
  scene.add(roadway);
  const approachEnd = end.clone().addScaledVector(delta.clone().normalize(), 230);
  approachEnd.y = 14 - (subtle ? 1.6 : 2);
  const approachDelta = approachEnd.clone().sub(end);
  const approachRotation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), approachDelta.clone().normalize());
  const approach = new THREE.Group();
  approach.name = subtle ? 'Distant bridge bank approach' : 'Main bridge bank approach';
  approach.position.copy(end).lerp(approachEnd, 0.5);
  approach.quaternion.copy(approachRotation);
  const approachDeck = new THREE.Mesh(new THREE.BoxGeometry(deckWidth, subtle ? 3.2 : 4, approachDelta.length()), concrete);
  const approachRoad = new THREE.Mesh(new THREE.BoxGeometry(deckWidth - 2, 0.04, approachDelta.length()), new THREE.MeshStandardMaterial({ color: 0x5d6262, roughness: 0.96 }));
  approachRoad.position.y = subtle ? 1.62 : 2.02;
  approach.add(approachDeck, approachRoad);
  const abutment = new THREE.Mesh(new THREE.BoxGeometry(deckWidth + 1, end.y - 14, 25), concrete);
  abutment.name = 'Bank bridge abutment';
  abutment.position.copy(end).addScaledVector(delta.clone().normalize(), 6);
  abutment.position.y = (end.y + 14) / 2 - (subtle ? 1.6 : 2);
  abutment.rotation.y = yaw;
  scene.add(approach, abutment);
  for (const side of [-1, 1]) {
    const lateral = deckWidth / 2 - 0.35;
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.1, length), rail);
    beam.position.copy(midpoint).add(new THREE.Vector3(Math.cos(yaw) * side * lateral, 2.7, -Math.sin(yaw) * side * lateral));
    beam.rotation.y = yaw;
    scene.add(beam);
  }
  const count = Math.max(3, Math.floor(length / (subtle ? 180 : 125)));
  const pierGeometry = new THREE.CylinderGeometry(0.86, 1, 1, 16);
  const poleGeometry = new THREE.CylinderGeometry(subtle ? 0.16 : 0.24, subtle ? 0.16 : 0.24, subtle ? 4 : 6, 5);
  const lampGeometry = new THREE.SphereGeometry(subtle ? 0.28 : 0.42, 6, 4);
  const piers = new THREE.InstancedMesh(pierGeometry, concrete, count);
  const poles = new THREE.InstancedMesh(poleGeometry, rail, count * 2);
  const lamps = new THREE.InstancedMesh(lampGeometry, warm, count * 2);
  const matrix = new THREE.Matrix4();
  const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw);
  for (let index = 0; index < count; index += 1) {
    const fraction = (index + 0.5) / count;
    const point = start.clone().lerp(end, fraction);
    const pierHeight = point.y - (subtle ? 1.6 : 2);
    matrix.compose(new THREE.Vector3(point.x, pierHeight / 2, point.z), rotation, new THREE.Vector3(subtle ? 3 : 4, pierHeight, subtle ? 2 : 2.5));
    piers.setMatrixAt(index, matrix);
    for (const side of [-1, 1]) {
      const lateral = deckWidth / 2 - 0.6;
      const lampIndex = index * 2 + (side + 1) / 2;
      const lampX = point.x + Math.cos(yaw) * side * lateral;
      const lampZ = point.z - Math.sin(yaw) * side * lateral;
      matrix.makeTranslation(lampX, point.y + (subtle ? 2 : 3), lampZ);
      poles.setMatrixAt(lampIndex, matrix);
      matrix.makeTranslation(lampX, point.y + (subtle ? 4 : 6), lampZ);
      lamps.setMatrixAt(lampIndex, matrix);
    }
  }
  scene.add(piers, poles, lamps);
  return { lights: warm, ...createRiverTraffic(scene, { start, end, subtle }) };
}
