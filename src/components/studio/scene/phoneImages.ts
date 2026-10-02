import { DefaultLoadingManager } from 'three';
import manifest from '../phone-images.manifest.json';

// Room objects use the existing smaller image variants on all devices. HTML readers
// load their original documents directly and are unaffected by the Three loader.
const variants: Record<string, string> = manifest;
let installed = false;

export function serveRoomImages(): void {
  if (installed) return;
  installed = true;
  DefaultLoadingManager.setURLModifier(url => {
    const query = url.indexOf('?');
    const path = query === -1 ? url : url.slice(0, query);
    const variant = variants[path];
    return variant ? variant + (query === -1 ? '' : url.slice(query)) : url;
  });
}
