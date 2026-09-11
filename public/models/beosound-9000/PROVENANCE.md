# Beosound 9000 reference model

An original procedural interpretation of the classic Bang & Olufsen Beosound 9000 in silver aluminium and black glass. This is not manufacturer CAD. The owner's three supplied product photographs guided the visible CD row, clamper, glass and silver/black finish; those photographs are not redistributed as textures. The six custom CD labels use embedded album covers selected by the owner.

## Sources

- [Bang & Olufsen support and manuals](https://support.bang-olufsen.com/hc/en-us/articles/360041835731-Beosound-9000).
- [Official reference book](https://bangolufsenassistentgohe.blob.core.windows.net/manuals/SOUND_SYSTEMS/BEOSOUND_9000/beosound9000_referencebook_english.pdf), printed pages 7–9 and 12: placement options, spring orientation and reversible operating panel. The near-upright table/shelf bracket arrangement on page 8, figure 6, guides this installation.
- [Official daily-use guide](https://bangolufsenassistentgohe.blob.core.windows.net/manuals/SOUND_SYSTEMS/BEOSOUND_9000/beosound9000_userguide_english.pdf), printed pages 4–7 and 10: direct disc selection, travelling carriage, glass loading cover, standby, transport and volume controls.
- [Manufacturer service manual, archive mirror](https://retronik.silicium.org/DOCUMENTS/Audiovideo/Bang-Olufsen/Bang-Olufsen-Beosound-9000-Service-Manual.pdf), printed page 1.4: flat envelope 86.9 × 7 × 30.1 cm, weight 11.5 kg, and typical CD 1-to-6 travel of four seconds. The document is authored by Bang & Olufsen; this copy is hosted by an independent archive.
- [Bang & Olufsen product history](https://www.bang-olufsen.com/en/ca/story/beosound-9000).

## Model and mounting

The horizontal near-upright face measures 869 × 301 mm with a 70 mm chassis depth. Six standard 120 mm discs sit at 135 mm centers, leaving a 675 mm carriage path. The case is tilted back 12° and rests on a 17 mm mounting offset with two bracket feet. Bracket details, panel typography, button layout and glass hinge travel are visual approximations; they are not installation specifications.

The model replaces the previous soundbar at the same shelf anchor. Its closed case remains inside the 300 mm shelf depth. It leaves more than 170 mm below the TV and 240 mm to the existing clock. The loading glass opens toward the room. The clock, shelf collections and their coordinates are preserved.

## Interaction and audio

Selecting a CD moves the clamper. Load opens or closes the glass; standby closes it and parks at CD 1. Volume and mute retain their chosen settings. Controls appear on the operating panel during inspection; touch screens enlarge the plate from the same panel edge.

No audio files, playlist or streaming service are currently connected. A play request shows an availability message in the device display. The interface does not claim playback, advance a track timer or rotate a CD. The model represents a source system; separate loudspeaker geometry is not included in this change.

## Implementation

Original geometry, textures and interaction code live in `src/components/studio/scene/Beosound9000*`. The chassis uses original geometry and procedural surfaces; the six assigned disc labels use the documented embedded album covers in `../audio/PROVENANCE.md`. Textures are disposed on replacement/unmount. Mechanical animation updates while the carriage/glass moves or the selected audio disc spins/settles; reduced motion applies final positions immediately.
