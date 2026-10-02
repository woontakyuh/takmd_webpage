import { useEffect, useMemo } from 'react';
import { DataTexture, LatheGeometry, RGBAFormat, RepeatWrapping, Vector2 } from 'three';

// MAUL 6170896: a short nickel pot with a wider, bevelled gripping cap.
// The rear contact is z=0; the cap projects 9 mm from the paper.
export function WhiskyLectureMagnet() {
  const geometry = useMemo(() => new LatheGeometry([
    [0, 0], [.0087, 0], [.0091, .00035], [.0091, .0056],
    [.0094, .0061], [.01065, .0065], [.011, .00705],
    [.011, .008], [.0108, .00855], [.01035, .0089], [.0095, .009], [0, .009],
  ].map(([radius = 0, height = 0]) => new Vector2(radius, height)), 64), []);
  const finish = useMemo(() => {
    const pixels = new Uint8Array(128 * 128 * 4);
    for (let y = 0; y < 128; y++) for (let x = 0; x < 128; x++) {
      const offset = (y * 128 + x) * 4;
      const value = 210 + Math.round(9 * Math.sin(y * 2.37) + 4 * Math.sin(x * .43 + y * 1.7));
      pixels.set([value, value, value, 255], offset);
    }
    const map = new DataTexture(pixels, 128, 128, RGBAFormat);
    map.wrapS = map.wrapT = RepeatWrapping;
    map.needsUpdate = true;
    return map;
  }, []);
  useEffect(() => () => { geometry.dispose(); finish.dispose(); }, [geometry, finish]);
  return <mesh name="Nickel pot magnet with bevelled gripping cap" geometry={geometry}
    rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
    <meshPhysicalMaterial color="#bfc2c0" metalness={.93} roughness={.36}
      roughnessMap={finish} envMapIntensity={1.15} clearcoat={.25} clearcoatRoughness={.24} />
  </mesh>;
}
