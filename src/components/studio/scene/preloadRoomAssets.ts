import { useGLTF, useTexture } from '@react-three/drei';
import { BEOSOUND_ALBUMS } from './BeosoundAlbums';

// These objects all appear before the room is ready. Start them together instead of waiting for each
// suspended sibling to resolve; call after the phone texture URL modifier has been installed.
export function preloadRoomAssets(phone: boolean): void {
  Object.values(BEOSOUND_ALBUMS).forEach(album => useTexture.preload(album.cover));
  const models = [
    '/models/florence-knoll/relaxed-two-seater-ivory-packed.glb',
    '/models/noguchi/table-packed.glb',
    '/models/surfboard-packed.glb?v=20260925',
    '/models/spine.glb',
    '/models/workshop/plush-pig-packed.glb?v=20260925',
    '/models/workshop/biportal-endoscope.glb',
    phone ? '/models/garments/control-gi-phone-packed.glb?v=20260925' : '/models/garments/control-gi.glb?v=20260918-meshopt',
    phone ? '/models/fender/stratocaster-phone.glb?v=20260922-1' : '/models/fender/stratocaster-sunburst.glb?v=20260918-original',
  ];
  models.forEach(model => useGLTF.preload(model));
  useGLTF.preload(['/models/eames/lounge.glb', '/models/eames/ottoman.glb']);
}
