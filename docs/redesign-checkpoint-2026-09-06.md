# Interactive office checkpoint — 6 September 2026

This is an intermediate design checkpoint. The office and content interactions are usable; materials, furniture detail and lighting remain open for further refinement.

## Included

- Editable, full-screen office with free drag/orbit and wheel/pinch zoom, guided views, object focus and return.
- Desk facing a reception area, with the default view behind the working chair. Bookcase and teaching board face the desk; exterior walls cut away during orbit.
- Large arm-mounted display, connected M4 Mac mini, wireless mechanical keyboard and sculpted mouse over an 83.5%-coverage leather mat.
- Mechanical HH:MM:SS clock with local date/time. Daylight follows an approximate sun position for the device timezone; manual daylight/evening previews do not change the actual clock.
- Research folio showing actual first pages for all 29 published papers. DOI/title mapping and source/license labels are in `src/data/studio-paper-media.json`; full private source PDFs are not included.
- Hardcover opens 180 degrees. Inside cover and paper reverse are blank white; the red ribbon is removed. Forward/backward turns and rapid reversal retain page identity.
- Updated 56-record teaching collection, sourced slide previews and interactive workstation project readers.
- Clock reduced to 32.2 × 18.2 cm; anatomy model reduced to 54 cm, retaining its proportions. Its 1.275 m top height is checked against the actual chair cushion and a schematic seated adult.
- Public routes use clinical aggregate totals only. The private dashboard and case-level data are excluded from the production bundle; a build guard enforces this boundary.

## Verification

Current production build and Astro checks pass (87 files, zero errors/warnings; 13 pre-existing informational hints). Browser verification covers 64 desktop/tablet/mobile and animated states, every one of the 29 DOI/image pairs, all four readers, page limits and rapid reversal, timezone changes, reduced motion, and no horizontal phone overflow or browser errors. Existing folio/time/collection tests and 19 public-boundary scenarios pass. These are desktop Chromium viewport-emulation checks, not physical-phone performance measurements.

Detailed captures and run receipts are retained locally under `docs/redesign/`; source/provenance records are embedded in the checked-in content metadata. No temporary screenshots or private reference photos are required to build the site.

## Next refinement priorities

1. Materials and human proportions, judged from the overview and close views together.
2. Larger soft rug, natural wood grain and more varied bookcase contents.
3. Warm recessed shelf and reception lighting, retaining usable evening contrast.
4. Purposeful personal objects and real book covers supplied by the owner.
5. Mobile ergonomics and performance on actual devices.

The supplied office photos inform the next round: images 6–7 for spatial balance, image 9 for warm shelves/materials, image 4 for monitor-arm and cable detail. This checkpoint does not claim to reproduce those interiors.
