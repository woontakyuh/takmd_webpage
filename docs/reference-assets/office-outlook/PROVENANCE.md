# Rendered Yeouido / Han River outlook

The active window background is an original Three.js exterior scene. The river, bridge, piers, lights, distant buildings and hills use geometry and procedural materials. The renderer draws this scene from a camera following the office camera, at the canvas drawing-buffer resolution, then clips the result to the real window opening. It does not magnify a photographic background.

## Composition references

- Masato Nawate's public night photograph from 63 Building in Yeouido: https://yakei.jp/en/spot.php?i=63build, specifically `https://yakei.jp/en/nightphoto/63build2.jpg`. Personally inspected before modeling. It establishes broad open water in front, a long low diagonal bridge, a thin illuminated far bank and distant Namsan. This historical photograph is a visual reference, not a current live view. The original photograph is not distributed by this site.
- Seoul Institute's elevated Han River photograph: https://data.si.re.kr/photo/03u88061ba3si0. Personally inspected as a supporting reference for river breadth and the elevated perspective over low bridges. It is not used as a public texture.

The modeled architecture is a visual interpretation of the references, not a surveyed arrangement of every building or bridge. No exact apartment, floor or resident viewpoint is claimed.

## Rendering and lifecycle

`HanRiverLandscape.ts` constructs the outside geometry, materials and lighting. A separate scene gives the landscape its own long camera range without changing the room camera's near/far limits or exposing outdoor objects in the cutaway room. It is excluded from room interaction picking. The existing solar sky colors drive day/night lighting. The full-resolution exterior render is tone mapped with the room, and its geometry is rendered afresh when approaching the window.

The water reflects the actual exterior scene through Three.js's installed `Reflector` implementation. Subtle shader ripples disturb those reflections; reduced motion freezes their animation. Instanced structures limit draw calls. The exterior pass restores renderer state, and its resources are disposed on unmount.

The acceptance surfaces include both the untouched desktop/mobile overview and a close view through the window: a broad river must dominate, with distant-bank and bridge context, sharp geometric outlines, natural perspective, shade coverage and no landscape escaping outside the window aperture.

## Retired photographic work

The older `seongsu-han-river-day.webp` and `seongsu-han-river-night.webp` files are not used by the active window. Their apartment-dominated composition was rejected. A subsequent generated Yeouido photo pair was also rejected for softness and a visual mismatch with the rendered room; those experiment assets remain only in local task evidence and are not part of the public build. The active background has no day/night panorama image dependency.
