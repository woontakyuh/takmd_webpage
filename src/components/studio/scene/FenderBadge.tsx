import { useLoader } from '@react-three/fiber';
import { useEffect, useMemo } from 'react';
import { DoubleSide, ShapeGeometry } from 'three';
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js';

export function FenderBadge() {
  const artwork = useLoader(SVGLoader, '/models/fender/fender-logo.svg');
  const geometry = useMemo(() => {
    const result = new ShapeGeometry(artwork.paths.flatMap(path => path.toShapes()), 10);
    result.computeBoundingBox();
    const box = result.boundingBox;
    if (box) {
      const scale = 0.115 / (box.max.x - box.min.x);
      result.translate(-(box.min.x + box.max.x) / 2, -(box.min.y + box.max.y) / 2, 0);
      result.scale(scale, -scale, 1);
    }
    return result;
  }, [artwork]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <mesh name="Fender script badge" geometry={geometry}>
    <meshStandardMaterial color="#c9ccca" metalness={0.8} roughness={0.24} side={DoubleSide} />
  </mesh>;
}
