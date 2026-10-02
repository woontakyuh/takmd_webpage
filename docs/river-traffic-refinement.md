# River reflection and traffic refinement — 2026-09-08

Scope: preserve the current three-dimensional river/bridge composition from DESIGN.md §§55–57. A surveyed Seoul reconstruction and a multi-bridge skyline are deferred. No photographic panorama or new dependency.

## Diagnostic journal

The pre-edit `4322` production preview was inspected in a real browser. Candidate causes for the dark bridge edge are (1) the reflection camera's oblique near plane, (2) reflection texture clipping, and (3) finite water or bridge geometry. These require runtime coordinates and a toggle before a cause is claimed.

Temporary diagnostic artifacts belong under `.omo/evidence/river-traffic-refinement/`; production source will contain no debug globals. Parent owns the final integration build and browser QA.

## Traffic design

Small instanced vehicles follow each existing bridge in two directions with fixed per-lane speeds and deterministic, non-overlapping spacing. One time uniform drives all vehicle geometry, and time=0 freezes motion through the existing reduced-motion caller. Daytime uses restrained body colors; nighttime reveals paired warm-white headlights and red tail lights. No per-car light, animation loop, or per-frame matrix allocation is added.

## Observed geometry and reflection

The pre-edit default exterior camera was `(4.5, 343.4, -6.5)`, FOV 42°, far 12000. At the main bridge bank end `(-1500, 28, 1650)`, the actual reflection camera gave UV `(0.421731, 0.625551)`, NDC depth `-0.956544`, and a positive near-clip margin of `97.7653`. The endpoint is inside the 1700 × 13000 water plane. Turning the bank mesh off did not remove the dark bridge strip. The exterior caller disables shadow maps. Thus this inspected edge is the reflected underside of the deck; the evidence does not support changing Reflector's clipping or extending its render target.

The old flat bridge stopped above the bank (main deck centre 28 m, bank surface 14 m; secondary centre 23 m). Each bridge now has a concrete abutment and a 230 m graded approach descending to bank level. The existing over-water spans remain in place. Five nearby reflection samples, spread slightly more along the ripple direction, soften the unnaturally sharp underside silhouette. This is a material-quality adjustment, not a claim to have found a Three.js clipping defect.

## Implementation and provenance

- [Three.js Reflector r185](https://github.com/mrdoob/three.js/blob/2431a09f46f34c560bc8e44b33be0e567723d5b9/examples/jsm/objects/Reflector.js): inspected installed implementation and its oblique projection; retained unchanged.
- [Three.js InstancedMesh](https://threejs.org/docs/pages/InstancedMesh.html): shared geometry/material draw-call mechanism. Traffic uses five instanced meshes per bridge: body, cabin, wheels, headlights, tail lights, with 56 main-bridge cars and 20 secondary-bridge cars.
- `HanRiverTraffic.ts` is original project geometry/shader work. Vehicle lengths are 4.5 m, width 1.88 m; lane speeds are 11.5–14.8 m/s. Vehicles retain fixed lane spacing, use supplied absolute time, and gradually lose coverage over the final 8–32 m at either span end to avoid an instantaneous visible wrap. This is an ambient loop, not a traffic simulation or a continuous route through the city.
- 384 restrained low-poly tree crowns add one instanced draw on the existing narrow riverside strip; no building positions are moved. Procedural facade bay dimensions vary by host building while retaining antialiasing and the existing night lighting.
- Normal maps and bank texture retain the provenance in `docs/reference-assets/river-quality.md`. No new texture, external model, package, image panorama or network request is added.

## Verification

`bun run check`: 0 errors, 0 warnings, 21 existing hints. Before-state evidence and the real browser probe are in `.omo/evidence/river-traffic-refinement/`. Final integration build and post-build runtime evidence are recorded below when available.

A production-preview GPU run confirmed that changing traffic time from 0 to 10 seconds changes both daytime and nighttime canvas output with water and sky held at time 0. Two repeated time-0 renders produced the identical SHA-256 `48dd6f67d442988337fa78429ae7508d8105d3e55afb6f45ebc4a92650d78c5f`. Browser page/console errors: none. The final curved-lens visibility refinement and relocation of the bridge constructor to `HanRiverTraffic.ts` passed Astro check; the same GPU verification is ready to rerun after the parent integration build.
