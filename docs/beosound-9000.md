# Beosound 9000 implementation

[Public provenance and primary references](../public/models/beosound-9000/PROVENANCE.md) record the measured envelope and the distinction between exact dimensions and visual approximations.

The model is mounted at `[0, 0.82, 3.111]`, facing the room, in place of the Theatre. `OfficeStorage` retains every other child. The new component uses the existing arbitrary-ID `SceneInspection` route (`beosound-9000`), so camera return uses the same lifecycle as other inspected objects. It does not add an ExhibitId or modify CameraRig.

## Boundaries

- `Beosound9000.tsx`: inspection pose, responsive framing, native entry marker, local reducer ownership.
- The chassis only owns its approach pointer handlers before inspection. During inspection, direct CD groups own the physical hits; the decorative moving clamper must not swallow a selection as it crosses another disc.
- `Beosound9000Geometry.tsx`: chassis, discs, bracket, glass, physical hit targets and mechanical movement. CD travel is 168.75 mm/s; frame steps are capped at 100 ms to avoid a jump when returning from an inactive tab.
- `Beosound9000State.ts`: six disc slots, bounded volume, mute/load/transport commands and display state. There is deliberately no `playing` or current-track state without an audio adapter.
- `Beosound9000Controls.tsx` / `beosound-9000.css`: HTML controls sit on the physical operation panel on desktop. Compact screens attach an enlarged touch plate to that panel's upper edge, with at least 44 px button targets and 12 px control/readout text. Non-transform Html must omit distanceFactor so CSS pixels retain their actual screen size. The passive panel texture is hidden while either active control surface is shown. Escape and the nearby × restore the preceding inspection pose.
- `Beosound9000Textures.ts`: original static disc sheen and event-driven panel texture; no per-frame canvas drawing.

## Future audio integration

The reducer's typed commands and `CdSlot` are the connection point for an explicitly supplied playlist. Add a real media adapter and map available media to the six slots before adding a playback state. Start real audio from the native play button gesture. Reflect actual media success, pause, end and error events; do not make the visual carriage imply playback success. Keep album/title data limited to supplied metadata. No audio plugin, third-party iframe or fabricated library is needed for the present object.

## Validation

`bun test src/components/studio/scene/Beosound9000State.test.mjs` covers selection, unavailable playback, standby parking, slot wrap, volume limits/mute, glass loading, movement reversal, arrival/overshoot, reduced motion, idle stability and the existing shelf/TV/clock clearances.

Coordinated browser QA remains with the root task: inspect from overview, select CD 6 then CD 2 during travel, press load/close, change volume and mute, press play to check the source message, use standby, Escape and ×, return to the prior view, resize and repeat on touch/reduced-motion. Inspect silver/black material, glass visibility, controls aligned to the black plate, and preservation of clock and shelf contents.

The mobile regression probe `probeBeosoundMobileControls(page)` in the shared QA evidence checks one active touch plate, a 1:1 CSS-to-screen width ratio, all 15 actual button bounds at least 44 px, and viewport containment. Run on the existing real mobile page; it does not create another browser.
