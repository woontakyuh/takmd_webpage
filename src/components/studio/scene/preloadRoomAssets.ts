import { useGLTF, useTexture } from '@react-three/drei';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';

// These objects all appear before the room is ready. Start them together instead of waiting for each
// suspended sibling to resolve; call after the phone texture URL modifier has been installed.
export function preloadRoomAssets(phone: boolean): void {
  Object.values(BEOSOUND_ALBUMS).forEach(album => useTexture.preload(album.cover));
  const models = [
    '/models/florence-knoll/relaxed-two-seater-ivory-packed.glb',
    '/models/noguchi/table-packed.glb',
    '/models/surfboard-lite.glb',
    '/models/spine.glb',
    '/models/workshop/plush-pig-lite.glb',
    '/models/workshop/biportal-endoscope.glb',
    '/models/garments/physician-coat-lite.glb',
    phone ? '/models/garments/control-gi-phone-lite.glb' : '/models/garments/control-gi-lite.glb',
    '/models/fender/stratocaster-lite.glb',
  ];
  models.forEach(model => useGLTF.preload(model));
  useGLTF.preload(['/models/eames/lounge.glb', '/models/eames/ottoman.glb']);
}
