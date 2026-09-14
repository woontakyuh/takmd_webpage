import { MeshPhysicalMaterial } from 'three';

type GlassState = {
  transmission: number;
  opacity: number;
  transparent: boolean;
  depthWrite: boolean;
  pixels: number;
  simplified: boolean;
};

export class DistantGlass {
  private readonly materials = new Map<MeshPhysicalMaterial, GlassState>();

  beginFrame() {
    this.materials.forEach(state => { state.pixels = 0; });
  }

  tracks(material: MeshPhysicalMaterial) {
    return material.transmission > 0 || this.materials.has(material);
  }

  get detailedPixels() {
    let pixels = 0;
    this.materials.forEach(state => {
      if (!state.simplified) pixels = Math.max(pixels, state.pixels);
    });
    return pixels;
  }

  observe(material: MeshPhysicalMaterial, pixels: number) {
    let state = this.materials.get(material);
    if (!state) {
      if (material.transmission === 0) return;
      state = {
        transmission: material.transmission, opacity: material.opacity,
        transparent: material.transparent, depthWrite: material.depthWrite,
        pixels: 0, simplified: false,
      };
      this.materials.set(material, state);
    }
    state.pixels = Math.max(state.pixels, pixels);
  }

  update(enabled: boolean) {
    this.materials.forEach((state, material) => {
      const simplified = enabled && state.pixels < (state.simplified ? 120 : 90);
      if (simplified === state.simplified) return;
      state.simplified = simplified;
      material.transmission = simplified ? 0 : state.transmission;
      const clearGlass = simplified && state.transmission > 0.5;
      material.opacity = clearGlass ? Math.min(state.opacity, 0.2) : state.opacity;
      material.transparent = clearGlass || state.transparent;
      material.depthWrite = clearGlass ? false : state.depthWrite;
      material.needsUpdate = true;
    });
  }

  restore() {
    this.update(false);
    this.materials.clear();
  }
}
