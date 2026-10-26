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

`Beosound9000Audio.ts` stays stopped on entry. CD selection or an explicit transport play request creates two native audio elements and separate gains in one AudioContext; ordinary room clicks and key presses do not start music. Only the current and next track load, without decoding whole tracks into large JavaScript buffers. Manual selection retains the settle/travel/start sequence. After intentional playback, automatic continuation loops 1–6–1: the next source preloads and the carriage moves during the outgoing buffered tail, so audio never waits for that animation. Native scheduling, network availability and recorded silence still affect the boundary. Request generations cancel stale playback promises.

Music continues while the visitor explores other objects. Pause returns the CD label to its resting orientation. Standby stops and parks at CD 1. Load pauses and raises the glass; Play closes it before sound resumes. Volume and mute affect the actual gain. Reduced motion applies carriage/cover positions immediately and suppresses rotation while retaining playback.

## Room-native controls

A distant click approaches the player. During inspection, the actual CD groups and operation plate own input; the decorative clamper does not intercept clicks. Desktop controls coincide with the black operation plate. On a compact screen, an enlarged plate is attached beside the player with 44px targets. A small artist/track caption sits nearby. A case booklet opens beside the player. A compact title/pause control remains while playing elsewhere in the room. X/Escape returns to the preceding inspection pose without interrupting music.

## Validation and limits

The reducer/geometry tests cover slot selection, loading request identity, unavailable playback, volume, cover, mechanical travel, reduced motion and shelf clearances. Browser evidence in `.omo/evidence/calendar-audio-refinement-2026-09-11/` covers real audio amplitude, slot switching, label rest, pause/resume, volume/mute, continued room playback, all six supplied tracks, failures/retry, reduced motion and narrow touch controls. Physical iPhone/Safari listening has not been verified by desktop viewport emulation.

## Collection and exchange (14 September 2026)

Nine real album covers and ordered, complete track lists are separate from the six supplied audio files. `BeosoundAlbums.ts` owns catalog metadata; `BeosoundTracks.ts` connects album ID and printed track number to the available delivery file. Missing files remain readable but disabled, never substituted with previews. Default slots preserve the sequence above. Added catalog albums are NELL / Separation Anxiety (2008), Maroon 5 / Songs About Jane (2002), and John Mayer / Continuum (2006).

The small angled walnut rack contains every jewel case. Browse with arrows, horizontal drag/swipe, or case taps; the selected physical case moves forward and exposes its cover. The booklet includes cover, year, tracks, physical disc location, and a six-slot picker. Loaded albums leave an empty tray. Placement is unique, even when rapidly requesting more exchanges. Only the latest pending command runs after the current physical movement finishes.

Mount-only changes to another slot preserve the playing track. Selecting an unmounted playable track opens the slot picker and starts that track after placement. Exchange takes 1.4 seconds: outgoing disc returns, incoming disc arrives, glass settles, and the mapping commits. During a non-playing-slot exchange the glass stays closed to preserve the playing-CD presentation. Real playback success and carriage arrival gate rotation. Failure leaves a retryable stopped disc.

The versioned `takmd.cd-slots.v1` localStorage entry persists six unique album IDs or empty slots. Corrupt/unknown/duplicate entries restore the default six. Unavailable storage falls back to session-only operation. Restoring never starts audio. After deliberate listening, native end-of-track advances to the next available album track, then the next playable slot, skipping empty/unavailable slots and wrapping. Only two native audio elements are retained; there is no collection-wide audio preload.

Primary metadata references: [Two Ton Shoe](https://music.apple.com/us/album/resoled/30626614), [GIRIBOY](https://music.bugs.co.kr/album/20218878), [Radiohead](https://music.apple.com/us/album/the-bends/1097862703), [Asoto Union](https://music.apple.com/us/album/sound-renovates-a-structure/1593806196), [John Splithoff](https://music.apple.com/us/album/make-it-happen-deluxe-edition/1441035549), [Brown Eyes](https://music.apple.com/us/album/reason-4-breathing/1652859567), [NELL](https://music.apple.com/us/album/separation-anxiety/1648914913), [Maroon 5](https://music.apple.com/us/album/songs-about-jane/1440851650), and [John Mayer](https://music.apple.com/us/album/continuum/184335550). Edition-specific track order follows those catalog entries. New cover assets are 512px WebP delivery copies of their Apple catalog artwork; existing approved covers are preserved.

Evidence: `.omo/evidence/cd-collection-2026-09-14/` contains 36 reducer/catalog/storage tests, native browser playback and exchange checks, and responsive captures. Physical iPhone/Safari performance remains a separate device verification; viewport emulation does not certify it.
