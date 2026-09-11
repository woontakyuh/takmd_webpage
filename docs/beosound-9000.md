# Beosound 9000 implementation

[Product provenance](../public/models/beosound-9000/PROVENANCE.md) records the measured envelope. The horizontal player stays at `[0, 0.82, 3.111]` on a near-upright shelf bracket. Placement A puts Beolab 8000 outside the bookcase ends at x = ±2.57m, z = 2.87m. Both wall-switch centers are 1.46m; blinds stay left of the window.

The speakers retain about 39cm of clearance from their rear bodies to the rear wall. Hue Signe moves to `[-2.63, .0185, 3.18]`, leaving about 17cm between its base and the adjacent speaker base. This separates the objects while keeping the speaker away from the rear wall. It is a plausible visual placement, not a room-acoustics simulation or measured optimum; the window-side wall remains closer than on the opposite side.

## Playback

- CD 1: Two Ton Shoe — Paper Bag, Resoled.
- CD 2: GIRIBOY — 하루종일 (Band Ver.), 땡큐 / Thank You.
- CD 3: Radiohead — High and Dry, The Bends.
- CD 4: Asoto Union — Think About’ Chu, Sound Renovates A Structure.
- CD 5: John Splithoff — Raye, Make It Happen (Deluxe Edition).
- CD 6: Brown Eyes — 비오는 압구정, Reason 4 Breathing?

The owner supplied all six MP3 originals. Delivery copies are AAC at 160kbps with fast-start metadata. Originals remain unchanged. [Artwork provenance](../public/models/audio/PROVENANCE.md) records the embedded album covers used as custom circular labels, as requested. GIRIBOY retains its approved image.

`Beosound9000Audio.ts` uses two native audio elements and separate gains in one AudioContext. Entry attempts CD 1; browser autoplay blocking falls back to the first pointer/keyboard gesture. Deliberate pause or standby cancels entry retry. Only the current and next track load, without decoding whole tracks into large JavaScript buffers. Manual selection retains the settle/travel/start sequence. Automatic playback loops 1–6–1: the next source preloads and the carriage moves during the outgoing buffered tail, so audio never waits for that animation. Native scheduling, network availability and recorded silence still affect the boundary. Request generations cancel stale playback promises.

Music continues while the visitor explores other objects. Pause returns the CD label to its resting orientation. Standby stops and parks at CD 1. Load pauses and raises the glass; Play closes it before sound resumes. Volume and mute affect the actual gain. Reduced motion applies carriage/cover positions immediately and suppresses rotation while retaining playback.

## Room-native controls

A distant click approaches the player. During inspection, the actual CD groups and operation plate own input; the decorative clamper does not intercept clicks. Desktop controls coincide with the black operation plate. On a compact screen, an enlarged plate is attached beside the player with 44px targets. A small artist/track caption sits nearby. There is no separate album card or persistent global player. X/Escape returns to the preceding inspection pose without interrupting music.

## Validation and limits

The reducer/geometry tests cover slot selection, loading request identity, unavailable playback, volume, cover, mechanical travel, reduced motion and shelf clearances. Browser evidence in `.omo/evidence/calendar-audio-refinement-2026-09-11/` covers real audio amplitude, slot switching, label rest, pause/resume, volume/mute, continued room playback, all six supplied tracks, failures/retry, reduced motion and narrow touch controls. Physical iPhone/Safari listening has not been verified by desktop viewport emulation.

One supplied track belongs to each assigned slot. A separate CD rack and replacement flow, full album track lists, seek UI and EQ are not implemented. The transport arrows change discs.

Current playback order (owner update, 11 September): Paper Bag → 하루종일 (Band Ver.) → High and Dry → Think About’ Chu → Raye → 비오는 압구정 → Paper Bag. Physical discs, their covers and the album readout share this ordering.
