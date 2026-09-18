// Interpretive occupancy schedule, not live household data. Han River buildings use Seoul time.
export function residentialOccupancy(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  const elapsed = h >= 22 ? h - 22 : h < 8 ? h + 2 : 0;
  if (!elapsed) return 1;
  if (elapsed <= 4) {
    const t = elapsed / 4;
    return 1 - .92 * t * t * (3 - 2 * t);
  }
  if (h < 5) return .08;
  const t = Math.min(1, (h - 5) / 3);
  return .08 + .92 * t * t * (3 - 2 * t);
}
export const residentialLightUniform = { value: 1 };
let lastSample = -1;
export function updateResidentialLights(now = Date.now()): void {
  const sample = Math.floor(now / 30000);
  if (sample === lastSample) return;
  lastSample = sample;
  const seoulHour = ((now / 3600000 + 9) % 24 + 24) % 24;
  residentialLightUniform.value = residentialOccupancy(seoulHour);
}
export const RESIDENTIAL_LIGHT_GLSL = `
  uniform float uResidentialOccupancy;
  float residentialLight(float seed) {
    return 1.0 - smoothstep(uResidentialOccupancy - 0.02, uResidentialOccupancy + 0.02, 0.02 + seed * 0.96);
  }
`;
