import * as THREE from 'three';
import { Reflector } from 'three/examples/jsm/objects/Reflector.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';

// Normal sampling and Fresnel response adapted from Three Water (MIT).
// Source, texture credits and the full license: docs/reference-assets/river-quality.md.
const WATER_SHADER = {
  name: 'HanRiverWater',
  uniforms: {
    color: { value: new THREE.Color(0x386173) },
    tDiffuse: { value: null },
    textureMatrix: { value: new THREE.Matrix4() },
    normalSampler: { value: null },
    uTime: { value: 0 },
    uNightMix: { value: 0 },
    uFogColor: { value: new THREE.Color() },
  },
  vertexShader: `
    uniform mat4 textureMatrix;
    varying vec4 vReflectUv;
    varying vec3 vWorldPosition;
    void main() {
      vec4 world = modelMatrix * vec4(position, 1.0);
      vWorldPosition = world.xyz;
      vReflectUv = textureMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * viewMatrix * world;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform sampler2D tDiffuse;
    uniform sampler2D normalSampler;
    uniform float uTime;
    uniform float uNightMix;
    uniform vec3 uFogColor;
    varying vec4 vReflectUv;
    varying vec3 vWorldPosition;
    vec3 riverNormal(vec2 uv) {
      float time = uTime * 0.035;
      vec4 noise = texture2D(normalSampler, uv / 103.0 + vec2(time / 17.0, time / 29.0))
        + texture2D(normalSampler, uv / 107.0 - vec2(time / -19.0, time / 31.0))
        + texture2D(normalSampler, uv / vec2(8907.0, 9803.0) + vec2(time / 101.0, time / 97.0))
        + texture2D(normalSampler, uv / vec2(1091.0, 1027.0) - vec2(time / 109.0, time / -113.0));
      return normalize((noise * 0.5 - 1.0).xzy * vec3(0.42, 1.0, 0.42));
    }
    void main() {
      vec3 normal = riverNormal(vWorldPosition.xz * 4.0);
      vec3 worldToEye = cameraPosition - vWorldPosition;
      vec3 eyeDirection = normalize(worldToEye);
      float distanceToEye = length(worldToEye);
      vec2 distortion = normal.xz * (0.0007 + 0.8 / distanceToEye) * 1.2;
      vec2 reflectedUv = vReflectUv.xy / vReflectUv.w + distortion;
      vec2 rippleSpread = vec2(0.00065, 0.0024) * (0.65 + length(normal.xz));
      vec3 reflection = texture2D(tDiffuse, reflectedUv).rgb * 0.4;
      reflection += texture2D(tDiffuse, reflectedUv + rippleSpread).rgb * 0.15;
      reflection += texture2D(tDiffuse, reflectedUv - rippleSpread).rgb * 0.15;
      reflection += texture2D(tDiffuse, reflectedUv + rippleSpread * vec2(-1.0, 2.0)).rgb * 0.15;
      reflection += texture2D(tDiffuse, reflectedUv + rippleSpread * vec2(1.0, -2.0)).rgb * 0.15;
      float theta = max(dot(eyeDirection, normal), 0.0);
      float reflectance = 0.02 + 0.98 * pow(1.0 - theta, 5.0);
      vec3 sunDirection = normalize(vec3(900.0, 1400.0, -1100.0));
      float sunGlint = pow(max(dot(eyeDirection, reflect(-sunDirection, normal)), 0.0), 110.0);
      vec3 scatter = color * (0.66 + max(dot(normal, sunDirection), 0.0) * 0.34);
      vec3 result = mix(scatter, reflection, clamp(reflectance * 0.64 + 0.025, 0.0, 0.67));
      result += vec3(1.0, 0.9, 0.72) * sunGlint * 0.5 * (1.0 - uNightMix);
      result = mix(result, uFogColor, smoothstep(2000.0, 4800.0, distanceToEye));
      gl_FragColor = vec4(result, 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }
  `,
} as const;

export function updateRiverReflectionCamera(source: THREE.PerspectiveCamera, target: THREE.PerspectiveCamera): void {
  target.copy(source);
  target.clearViewOffset();
  target.updateProjectionMatrix();
  target.updateMatrixWorld();
}

export function createRiverAtmosphere(scene: THREE.Scene, fog: THREE.Fog) {
  const time = { value: 0 };
  const nightMix = { value: 0 };
  const waterColor = { value: new THREE.Color(0x386173) };
  const sunPosition = { value: new THREE.Vector3(900, 1400, -1100) };
  const sky = new Sky();
  sky.name = 'Three atmospheric sky';
  sky.scale.setScalar(18000);
  Object.assign(sky.material.uniforms, {
    turbidity: { value: 5.2 }, rayleigh: { value: 1.7 },
    mieCoefficient: { value: 0.004 }, mieDirectionalG: { value: 0.78 },
    cloudCoverage: { value: 0.24 }, cloudDensity: { value: 0.3 },
    cloudScale: { value: 0.00024 }, cloudElevation: { value: 0.25 },
    showSunDisc: { value: 0 }, sunPosition, time, uNightMix: nightMix,
  });
  sky.material.fragmentShader = `uniform float uNightMix;\n${sky.material.fragmentShader}`
    .replace('gl_FragColor = vec4( texColor, 1.0 );', `
      float horizon = 1.0 - smoothstep(0.0, 0.5, max(direction.y, 0.0));
      vec3 nightSky = mix(vec3(0.002, 0.006, 0.018), vec3(0.025, 0.036, 0.062), horizon);
      gl_FragColor = vec4(mix(texColor * 0.82, nightSky, uNightMix), 1.0);`);
  scene.add(sky);

  const normals = new THREE.TextureLoader().load('/textures/river-water-normals.jpg');
  normals.wrapS = normals.wrapT = THREE.RepeatWrapping;
  normals.anisotropy = 4;
  const water = new Reflector(new THREE.PlaneGeometry(1700, 13000), {
    textureWidth: 1024, textureHeight: 1024, clipBias: 0.002, multisample: 0, shader: WATER_SHADER,
  });
  if (!(water.material instanceof THREE.ShaderMaterial)) throw new TypeError('Reflector requires a shader material');
  const reflectionSource = new THREE.PerspectiveCamera();
  const renderReflection = water.onBeforeRender;
  water.onBeforeRender = (renderer, renderScene, camera, geometry, material, group) => {
    if (camera instanceof THREE.PerspectiveCamera) {
      // The window crop must not truncate the reflected scene at oblique room views.
      updateRiverReflectionCamera(camera, reflectionSource);
      renderReflection.call(water, renderer, renderScene, reflectionSource, geometry, material, group);
    } else renderReflection.call(water, renderer, renderScene, camera, geometry, material, group);
  };
  Object.assign(water.material.uniforms, {
    color: waterColor, normalSampler: { value: normals },
    uTime: time, uNightMix: nightMix, uFogColor: { value: fog.color },
  });
  water.name = 'Normal-mapped Han River water';
  water.position.set(-760, 0, 0);
  water.rotation.x = -Math.PI / 2;
  scene.add(water);

  const bankTexture = new THREE.TextureLoader().load('/textures/river-bank-diffuse.jpg');
  bankTexture.colorSpace = THREE.SRGBColorSpace;
  bankTexture.wrapS = bankTexture.wrapT = THREE.RepeatWrapping;
  bankTexture.repeat.set(2.5, 325);
  bankTexture.anisotropy = 4;

  return {
    bankTexture,
    waterMaterial: water.material,
    setTime: (seconds: number): void => { time.value = seconds; },
    setNightMix: (mix: number): void => {
      nightMix.value = mix;
      waterColor.value.lerpColors(new THREE.Color(0x386173), new THREE.Color(0x112c3c), mix);
    },
    dispose: (): void => { water.dispose(); normals.dispose(); bankTexture.dispose(); },
  };
}
