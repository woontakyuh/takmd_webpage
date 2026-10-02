import { DefaultLoadingManager } from 'three';
import manifest from '../phone-images.manifest.json';

// On phones, the room's largest textures are fetched as their 1024-pixel WebP copies (scripts/build-phone-images.mjs).
// Every loader in the room — drei's useTexture and useGLTF, three's TextureLoader and GLTFLoader — resolves its
// addresses through the default loading manager, so one modifier covers them all; the GPU cap resizes anything
// larger than 1024 on a phone anyway, so the picture on screen is the same.
const variants: Record<string, string> = manifest;
let installed = false;

export function servePhoneImages(): void {
  if (installed) return;
  installed = true;
  DefaultLoadingManager.setURLModifier(url => {
    const query = url.indexOf('?');
    const path = query === -1 ? url : url.slice(0, query);
    const variant = variants[path];
    return variant ? variant + (query === -1 ? '' : url.slice(query)) : url;
  });
}
