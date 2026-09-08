# Beosound Theatre prepared model

- Product: Bang & Olufsen Beosound Theatre, silver aluminium frame with oak speaker cover and table feet.
- Geometry source: Bang & Olufsen official support download, `Beovision Theatre.zip`, linked as “3D Drawings” from the Beosound / Beovision Theatre support page.
- Source URL: https://bangolufsenrmaskillgohel.blob.core.windows.net/zendesk-guide/Manuals_3D/Beovision%20Theatre.zip
- Product sheet: https://bangolufsenrmaskillgohel.blob.core.windows.net/zendesk-guide/User%20Guide%20Files/Soundbars/Beosound%20Theatre/Beosound%20Theatre%20Product%20Sheet%20EN%20Sep2024.pdf
- Retrieved: 2026-09-08.
- Source archive license: no explicit reuse license was included in the manufacturer download. The locally prepared GLB is an adaptation for this product visualization; Bang & Olufsen retains ownership of its product design and source drawings.
- Published standalone table envelope: 1.222 m wide, 0.197 m high and 0.157 m deep (September 2024 product sheet).
- Preparation: `scripts/prepare-beosound-theatre.mjs` selects the visible basic housing, connector and touch-interface covers, the manufacturer's continuous fabric-cover shell as an opaque dark acoustic backing behind the separate oak slats, and table feet. It converts millimetres to metres, fits the current published width and depth, moves the tabletop contact pads to local Y=0, merges by PBR material, and exports one binary GLB. Using the cover shell hides planning-model mounts and drivers except through intentional cover openings while preserving the finished dark top seen on the official oak variant.
- Coordinate convention: local +Z is front, +Y is up, and local Y=0 is the shelf-contact plane.
- Material treatment: existing TakMD scene tokens for silver aluminium (`#B8BDBF`), graphite (`#34393B`), rubber (`#222626`) and natural/light oak (`#B6A184`), all non-emissive.
