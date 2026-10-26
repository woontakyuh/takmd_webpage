# Fender music corner reference provenance

The amplifier is original procedural geometry in `DeluxeReverb.tsx`. The guitar uses the attributed third-party mesh documented below.

## Guitar

- Visual contract: user-supplied close-up and personal performance video, inspected locally on 2026-09-08. The public build does not copy either source file.
- Product identity: Fender USA Stratocaster, Sienna Sunburst. The exact production year/series is intentionally not asserted.
- Current Fender specification reference used for stable Stratocaster details: [American Professional II Stratocaster, Sienna Sunburst](https://www.fender.com/products/american-professional-ii-stratocaster?variant=45940642414814). This supports the 25.5-inch scale family, SSS layout, 22 frets, dot inlays, aged-white plastics and nickel/chrome hardware; the personal reference controls the requested identity.
- Runtime asset: `stratocaster-sunburst.glb`, “Fender Stratocaster” by [Anderson Fogaça](https://sketchfab.com/andersonfogaca), from the [original Sketchfab model](https://sketchfab.com/3d-models/fender-stratocaster-d5dac6b9f2964601b07109c78ed9e7cd), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The GLB preserves this author, source and license in `asset.extras`; it was retrieved from the author's model as redistributed in the public [FiberSTRAT repository](https://github.com/IshmamDC217/FiberSTRAT) on 2026-09-08.
- The downloaded model has a sunburst body, SSS pickups, six-in-line tuners, strings, frets, bridge, jack plate and controls. Its separate neck material contains a maple neck and headstock. Runtime treatment in `FenderStrat.tsx` welds coincident vertices to identify the exact connected body component, adds a body-only vertex mask, and converts its front, edge, side and back surfaces to a coherent Sienna amber/cherry burst while retaining the photographed front grain. Hardware is excluded from the body mask. A separate UV mask changes the dark fingerboard wood to maple and places black markers over the source marker UVs without altering the frets. It is 15,465 triangles / 14,345 uploaded vertices with two PBR materials and six embedded 2048-pixel textures. Runtime SHA-256: `9cbafc12c6117a64cf22b3de80a9443339eb084aaae194f409e69a2d415696ee`.
- A second CC BY Stratocaster mesh by Evan McNaught was evaluated: [Sketchfab source](https://sketchfab.com/3d-models/fender-stratocaster-19dc452b4ca94afda2742009ec943304). Its archive endpoint requires an authenticated Sketchfab token and no inaccessible archive content is bundled.

## Amplifier

- Product reference: [Fender '65 Deluxe Reverb](https://www.fender.com/products/65-deluxe-reverb).
- Dimensions: 24.5 × 17.5 × 9.5 inches / 62.2 × 44.5 × 24.13 cm (width × height × depth).
- Visible materials/features represented: black textured vinyl, silver grille cloth, black control panel, vintage-style black knobs, red jewel and molded strap handle with nickel-plated caps.

Fender and Stratocaster are trademarks of Fender Musical Instruments Corporation. The scene representation is used to identify the user's personal instrument and the referenced amplifier.

Fender script badge geometry uses the original vector wordmark from https://commons.wikimedia.org/wiki/File:Fender_(Musikinstrumente)_logo.svg (Fender 2008 Frontline source; PD-textlogo, trademark retained). Retrieved 2026-09-08, SVG path converted to lit shape geometry; no fabricated font substitute.
