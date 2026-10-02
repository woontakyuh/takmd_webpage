# Speaker direction and music controls

Recommendation: a pair of JBL L82 Classic MkII speakers below the central TV shelf. Their walnut cabinets, recognizable round drivers and restrained black Quadrex grilles connect naturally with the timber shelving and Sienna guitar. One removable grille could reveal the physical speaker on inspection. This is a design recommendation; no speaker has been replaced.

The existing central shelf top is 0.82m, with a 19mm shelf thickness. A 47.27cm L82 cabinet on an approximately 15cm low base leaves about 17cm above it. The official JS-80 stand is 40.4cm high and does **not** fit beneath this shelf; the proposed base would be a custom low base, not a scaled imitation of JS-80. The three steel shelf supports and the central wall rail must be respected when placing the pair near x±0.675m. Acoustic performance at this low height is a separate real-world consideration; this proposal concerns the virtual office composition.

| Candidate | Cabinet size H × W × D | Fit and visual direction |
|---|---|---|
| JBL L82 Classic MkII | 47.27 × 28.02 × 31.5cm | First choice; walnut, familiar hi-fi shape, smaller than L100. A short base fits below the shelf. |
| JBL 4309 | About 42 × 26 × 22.86cm | Compact studio monitor; blue baffle and horn are unmistakably a speaker. The blue is a stronger room accent. |
| Klipsch Heresy IV | 63.01 × 39.37 × 33.66cm | Fits directly on its low angled plinth; most substantial floor presence, and a less familiar brand for the owner. |

B&O Beolab 18 is 132.4cm tall on its floor base, so it cannot occupy the space below the existing 82cm shelf. It would require a different placement outside that opening.

Official references, checked 11 September 2026:

- [JBL L82 Classic MkII](https://www.jbl.com/JBLL82MK2ORG.html)
- [JBL 4309 owner manual](https://www.jbl.com/on/demandware.static/-/Sites-masterCatalog_Harman/default/dw12231b21/pdfs/JBL4309_OM%20YOMSP4309_Owner%27s%20Manual_Multilingual.pdf)
- [Klipsch Heresy IV specifications](https://assets.klipsch.com/product-specsheets/Heresy-IV-Spec-Sheet-v04.pdf)
- [B&O Beolab 18 specifications](https://assets.ctfassets.net/8cd2csgvqd3m/3qjc7bKafdbuC83rsYdobq/258f20433accc417c15f666da9f2166f/Beolab_18_Product_Sheet_EN_Sep2024.pdf)

## BGM control feasibility

The current Beosound Theatre has local volume, play/pause and previous/next controls according to its [official control guide](https://support.bang-olufsen.com/hc/en-us/articles/9445294357265-How-do-I-use-the-local-controls-on-Beosound-Beovision-Theatre). In the website, speaker inspection can expose the same simple actions against the site's music playback, with optional bass/mid/treble EQ. They would control the visitor's browser playback, not communicate with physical B&O hardware.

Implementation direction: one shared HTML audio player; an explicit play interaction starts the audio context; a GainNode controls volume and BiquadFilterNodes supply optional three-band EQ. Track selection and volume remain unchanged while navigating between room objects. The user has not supplied a BGM playlist yet, so no dummy tracks or nonfunctional controls are installed. Audio should load after intentional playback rather than increase the initial office download. See [MDN Web Audio guide](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Using_Web_Audio_API) and [autoplay policy](https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay).

The first decision is speaker identity/placement; playlist and actual audio controls follow after that choice. This request was explicitly limited to feasibility and alternatives.
