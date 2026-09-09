import { useEffect, useMemo } from 'react';
import { Color, DoubleSide, ShaderChunk, Shape, ShapeGeometry } from 'three';
import type { MeshPhysicalMaterial } from 'three';
import { bottleClosureStart, bottleRadiusAt, createBottleGeometry } from './WhiskyBottleGeometry';
import type { BottleSpec } from './WhiskyBottleSpecs';

function absorptionShader(bottle: BottleSpec): MeshPhysicalMaterial['onBeforeCompile'] {
  return shader => {
    shader.uniforms.bottleHeight = { value: bottle.height };
    shader.uniforms.bottleFill = { value: bottle.fillHeight };
    shader.uniforms.whiskyColor = { value: new Color(bottle.liquid) };
    shader.uniforms.glassColor = { value: new Color(bottle.glass) };
    shader.vertexShader = shader.vertexShader.replace('#include <common>',
      '#include <common>\nvarying vec3 vBottlePosition;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvBottlePosition = position;');
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vBottlePosition;
      uniform float bottleHeight;
      uniform float bottleFill;
      uniform vec3 whiskyColor;
      uniform vec3 glassColor;`)
      .replace('#include <transmission_fragment>', ShaderChunk.transmission_fragment
        .replace('vec4 transmitted = getIBLVolumeRefraction(', `
          vec3 insideRay = normalize(transpose(mat3(modelMatrix)) * refract(-v, n, 1.0 / 1.36));
          float chord = max(.003, -2.0 * dot(vBottlePosition.xz, insideRay.xz)
            / max(dot(insideRay.xz, insideRay.xz), .0001));
          chord = min(chord, .3);
          float liquidPath = vBottlePosition.y < bottleFill * bottleHeight ? chord : 0.0;
          if (abs(insideRay.y) > .0001) {
            float bottom = -vBottlePosition.y / insideRay.y;
            float surface = (bottleFill * bottleHeight - vBottlePosition.y) / insideRay.y;
            float entry = max(0.0, min(bottom, surface));
            float exitPoint = min(chord, max(bottom, surface));
            liquidPath = max(0.0, exitPoint - entry);
          }
          material.thickness = chord;
          material.attenuationColor = glassColor * pow(max(whiskyColor, vec3(.001)), vec3(liquidPath / chord));
          material.attenuationDistance = .075;
          material.transmission = .995;
          vec4 transmitted = getIBLVolumeRefraction(`));
  };
}

function Closure({ bottle }: { readonly bottle: BottleSpec }) {
  const start = bottleClosureStart(bottle);
  const geometry = useMemo(() => {
    const cap = createBottleGeometry(bottle, { low: start, high: 1, closed: true });
    if (bottle.capRidges) {
      const vertices = cap.getAttribute('position');
      for (let index = 0; index < vertices.count; index += 1) {
        const x = vertices.getX(index), z = vertices.getZ(index);
        const ridge = 1 + .025 * Math.cos(Math.atan2(x, z) * bottle.capRidges);
        vertices.setXYZ(index, x * ridge, vertices.getY(index), z * ridge);
      }
      cap.computeVertexNormals();
    }
    return cap;
  }, [bottle, start]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  const neckRadius = bottleRadiusAt(bottle, start);
  switch (bottle.closure) {
    case 'crystal':
      return <group name="24 facet crystal stopper">
        <mesh geometry={geometry} castShadow>
          <meshPhysicalMaterial color="#ffffff" roughness={.035} transmission={.96} thickness={.025}
            ior={1.52} attenuationColor="#f5f1e7" attenuationDistance={.5} envMapIntensity={1.3} />
        </mesh>
        <mesh position={[0, start * bottle.height, 0]}>
          <cylinderGeometry args={[neckRadius * 1.005, neckRadius * 1.005, .003, 24]} />
          <meshStandardMaterial color="#3d241a" roughness={.48} />
        </mesh>
      </group>;
    case 'capsule':
      return <group name="bottle closure">
        {bottle.cork ? <mesh position={[0, (start - .044) * bottle.height, 0]}>
          <cylinderGeometry args={[neckRadius * .80, neckRadius * .80, .026, 32]} />
          <meshStandardMaterial color="#b3986d" roughness={.86} />
        </mesh> : null}
        {bottle.capTop ? <mesh position={[0, bottle.height - .003, 0]}>
          <cylinderGeometry args={[bottleRadiusAt(bottle, .98) * 1.003, bottleRadiusAt(bottle, .98), .006, 48]} />
          <meshStandardMaterial color={bottle.capTop} roughness={.62} />
        </mesh> : null}
        <mesh geometry={geometry} castShadow receiveShadow>
          <meshStandardMaterial color={bottle.cap} roughness={.31} metalness={.18} />
        </mesh>
        {bottle.capBand ? <mesh position={[0, bottle.capBand.height * bottle.height, 0]}>
          <cylinderGeometry args={[bottleRadiusAt(bottle, bottle.capBand.height) + .00025, bottleRadiusAt(bottle, bottle.capBand.height) + .00025, .0025, 48]} />
          <meshStandardMaterial color={bottle.capBand.color} roughness={.28} metalness={.7} />
        </mesh> : null}
        {[start + (1 - start) * .03, start + (1 - start) * .68, start + (1 - start) * .90].map(height => <mesh key={height}
          position={[0, height * bottle.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[bottleRadiusAt(bottle, height) + .00015, .00045, 5, 48]} />
          <meshStandardMaterial color={bottle.cap} roughness={.24} metalness={.32} />
        </mesh>)}
      </group>;
    default: {
      const closure: never = bottle.closure;
      throw new TypeError(`Unsupported bottle closure: ${String(closure)}`);
    }
  }
}

function WaxSeal({ bottle }: { readonly bottle: BottleSpec }) {
  const ribbons = useMemo(() => [-1, 1].map(side => {
    const top = bottle.height * .73;
    const bottom = bottle.height * .637;
    const x = side * .005;
    const tail = side * .010;
    const shape = new Shape();
    shape.moveTo(x - .0035, top);
    shape.lineTo(x + .0035, top);
    shape.lineTo(tail + .0035, bottom);
    shape.lineTo(tail, bottom + .003);
    shape.lineTo(tail - .0035, bottom);
    shape.closePath();
    const geometry = new ShapeGeometry(shape);
    const vertices = geometry.getAttribute('position');
    for (let i = 0; i < vertices.count; i += 1) {
      const radius = bottleRadiusAt(bottle, vertices.getY(i) / bottle.height);
      vertices.setZ(i, Math.sqrt(Math.max(.00001, radius * radius - vertices.getX(i) ** 2)) + .0008);
    }
    geometry.computeVertexNormals();
    return geometry;
  }), [bottle]);
  useEffect(() => () => ribbons.forEach(geometry => geometry.dispose()), [ribbons]);
  return <group name="Booker's wax seal and ribbon tails">
    {ribbons.map((geometry, index) => <mesh key={index} geometry={geometry} receiveShadow>
      <meshStandardMaterial color="#cfc5a1" roughness={.92} side={DoubleSide} />
    </mesh>)}
    <mesh position={[0, bottle.height * .762, bottleRadiusAt(bottle, .762) + .0005]}
      rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[.009, .009, .002, 32]} />
      <meshStandardMaterial color="#101311" roughness={.22} />
    </mesh>
  </group>;
}

export function WhiskyBottleBody({ bottle }: { readonly bottle: BottleSpec }) {
  const geometry = useMemo(() => createBottleGeometry(bottle, {
    low: 0, high: bottleClosureStart(bottle), closed: true,
  }), [bottle]);
  const onBeforeCompile = useMemo(() => absorptionShader(bottle), [bottle]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <group name="physical glass and whisky">
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshPhysicalMaterial color={bottle.darkGlass ? bottle.glass : "#ffffff"} roughness={.045} transmission={.94} thickness={bottle.radius * 1.8}
        attenuationColor={bottle.liquid} attenuationDistance={.075} ior={1.5} envMapIntensity={1.3}
        clearcoat={.18} clearcoatRoughness={.055} onBeforeCompile={onBeforeCompile}
        customProgramCacheKey={() => 'whisky-volume-absorption-v4'} />
    </mesh>
    <Closure bottle={bottle} />
    {bottle.image.endsWith('/bookers.png') ? <WaxSeal bottle={bottle} /> : null}
  </group>;
}
