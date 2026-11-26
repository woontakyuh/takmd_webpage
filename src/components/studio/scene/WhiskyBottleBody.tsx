import { useEffect, useMemo } from 'react';
import { DoubleSide, Shape, ShapeGeometry } from 'three';
import { createHollowGlassMaterial } from './GlassMaterial';
import { bottleClosureStart, bottleRadiusAt, createBottleGeometry } from './WhiskyBottleGeometry';
import { createWhiskyBottleMaterial, createWhiskyLiquidMaterial } from './WhiskyBottleMaterial';
import type { BottleSpec } from './WhiskyBottleSpecs';

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
  const crystalMaterial = useMemo(() => createHollowGlassMaterial({
    height: bottle.height, solidHeight: bottle.height,
  }), [bottle.height]);
  useEffect(() => () => crystalMaterial.dispose(), [crystalMaterial]);
  switch (bottle.closure) {
    case 'crystal':
      return <group name="24 facet crystal stopper">
        <mesh geometry={geometry} material={crystalMaterial} />
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
  const material = useMemo(() => createWhiskyBottleMaterial(bottle), [bottle]);
  const liquidGeometry = useMemo(() => createBottleGeometry(bottle, {
    low: .012 / bottle.height, high: bottle.fillHeight, offset: -.002, closed: true, meniscus: true,
  }), [bottle]);
  const liquidMaterial = useMemo(() => createWhiskyLiquidMaterial(bottle), [bottle]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => liquidGeometry.dispose(), [liquidGeometry]);
  useEffect(() => () => liquidMaterial.dispose(), [liquidMaterial]);
  return <group name="physical glass and whisky">
    <mesh name="closed whisky volume and concave meniscus" geometry={liquidGeometry} material={liquidMaterial} />
    <mesh geometry={geometry} material={material} receiveShadow />
    <Closure bottle={bottle} />
    {bottle.image.endsWith('/bookers.png') ? <WaxSeal bottle={bottle} /> : null}
  </group>;
}
