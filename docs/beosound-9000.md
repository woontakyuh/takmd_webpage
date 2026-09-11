# Beosound 9000 implementation

[Product provenance](../public/models/beosound-9000/PROVENANCE.md) records the measured envelope. The horizontal player stays at `[0, 0.82, 3.111]` on a near-upright shelf bracket. Placement A puts Beolab 8000 outside the bookcase ends at x = ±2.57m, z = 2.87m. Both wall-switch centers are 1.46m; blinds stay left of the window.

The speakers retain about 39cm of clearance from their rear bodies to the rear wall. Hue Signe moves to `[-2.63, .0185, 3.18]`, leaving about 17cm between its base and the adjacent speaker base. This separates the objects while keeping the speaker away from the rear wall. It is a plausible visual placement, not a room-acoustics simulation or measured optimum; the window-side wall remains closer than on the opposite side.

## Playback

- CD 1: Asoto Union — Think About’ Chu, Sound Renovates A Structure.
- CD 2: Brown Eyes — 비오는 압구정, Reason 4 Breathing?
- CD 3: GIRIBOY — 하루종일 (Band Ver.), 땡큐 / Thank You.
- CD 4: Two Ton Shoe — Paper Bag, Resoled.
- CD 5: Radiohead — High and Dry, The Bends.
- CD 6: John Splithoff — Raye, Make It Happen (Deluxe Edition).

The owner supplied all six MP3 originals. Delivery copies are AAC at 160kbps with fast-start metadata. Originals remain unchanged. [Artwork provenance](../public/models/audio/PROVENANCE.md) records the embedded album covers used as custom circular labels, as requested. CD 3 retains its approved image.

`Beosound9000Audio.ts` owns one native audio element and a Web Audio gain node. Neither audio element nor audio network request exists before a playback action. The native play and AudioContext resume calls run inside that action, silently buffering during the mechanical change. When the old disc has settled and the carriage reaches the selected slot, the track seeks to its intended start/resume time, the gain opens, and the selected disc starts rotating. Media success, pause, end and errors drive the display. Repeated requests invalidate old promises and re-arm arrival, including a repeated click on the same buffering CD.

Music continues while the visitor explores other objects. Pause returns the CD label to its resting orientation. Standby stops and parks at CD 1. Load pauses and raises the glass; Play closes it before sound resumes. Volume and mute affect the actual gain. Reduced motion applies carriage/cover positions immediately and suppresses rotation while retaining playback.

## Room-native controls

A distant click approaches the player. During inspection, the actual CD groups and operation plate own input; the decorative clamper does not intercept clicks. Desktop controls coincide with the black operation plate. On a compact screen, an enlarged plate is attached beside the player with 44px targets. A small artist/track caption sits nearby. There is no separate album card or persistent global player. X/Escape returns to the preceding inspection pose without interrupting music.

## Validation and limits

The reducer/geometry tests cover slot selection, loading request identity, unavailable playback, volume, cover, mechanical travel, reduced motion and shelf clearances. Browser evidence in `.omo/evidence/calendar-audio-refinement-2026-09-11/` covers real audio amplitude, slot switching, label rest, pause/resume, volume/mute, continued room playback, all six supplied tracks, failures/retry, reduced motion and narrow touch controls. Physical iPhone/Safari listening has not been verified by desktop viewport emulation.

One supplied track belongs to each assigned slot. A separate CD rack and replacement flow, full album track lists, seek UI and EQ are not implemented. The transport arrows change discs.
