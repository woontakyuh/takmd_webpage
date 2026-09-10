# TakMD — The open studio

## 1. Direction and sources

Build an original, editable 3D studio for Woon Tak Yuh, MD. A sculptural spine exhibit anchors the space; a walnut research table, folio, gallery, and project display introduce clinical practice, research, teaching, and clinical AI. User approved implementation on 2026-09-05. My Room supplies spatial inspiration only: no original room/henry mesh or baked texture is a dependency of the new homepage. Scroll World supplies narrative camera continuity, implemented with live geometry here. Photo-stage rules are archived in docs/redesign/legacy-DESIGN.md.

Signature moment: a folio cover lifts as the camera approaches, then Notion-derived research opens in a crisp paper reading panel. Closing restores the tour camera. The stage is a designed architectural miniature, with bevels, layered materials, contact shadows, timber details, and warm directional light.

Sources: current repo data and inspected reference sites; frontend redesign/interaction rules. The beui drawer source was consulted for dismiss/scroll-lock/reduced-motion mechanics. Native dialog supplies modal focus/inert semantics; CSS supplies the surface transition. Camera/object interpolation is a project-specific 3D mechanism.

## 2. People and content

Visitors: medical peers seeking papers; learners seeking education; collaborators exploring clinical AI; mobile/keyboard visitors needing direct routes. Name and role remain immediately visible. Normal links to CV, research, education and contact always exist. No fabricated professional metrics. Data describes the archived Notion snapshot and is dated. Clinical case-level data never enters the public client build.

## 3. Tokens

| Token | Value | Purpose |
| --- | --- | --- |
| paper | #EAE8E1 | Page and fog |
| paper-light | #F8F6F0 | Reading panel / folio |
| plaster | #DCD8CC | Architecture |
| ink | #202D2A | Text and dark metal |
| muted | #5C655F | Secondary type |
| teal | #355A50 | Interaction, monitor, exhibit accent |
| teal-light | #769B88 | Glass / foliage |
| clay | #AC5737 | Warm editorial accent |
| walnut | #77503A | Table |
| walnut-dark | #463729 | Joinery / timber grain |
| bone | #E7DDC6 | Model accents |
| line | #CBCDC3 | Hairline borders |
| white | #FFFFFF | Highlights |
| night-bg | #182824 | Night atmosphere |
| night-surface | #34463D | Night architecture |
| sun | #FFE0AC | Warm light |

New homepage UI uses --studio-* CSS tokens. Scene materials share this palette through scene config. Material opacity and lighting intensity are physical parameters. Three-dimensional dimensions are world units, centralized by component and scene config.

Typography: self-hosted Manrope Variable for sans; Georgia italic for editorial display accents; system monospace for metadata. Sizes: 11, 12, 14, 16, 18, 24, 32, 48, 64, 80, 96px; display uses fluid clamp. Display tracking -0.065em, text -0.015em, metadata +0.12em. Body line-height 1.65, display 1.02. Spacing: 4/8/12/16/20/24/32/40/48/64/80px. Radii: 4px labels, 12px tools, 24px panel, 999px pills. Borders 1px. Focus 2px teal with 4px offset.

## 4. Layout

Desktop: quiet top navigation, editorial left third, large architectural scene right two thirds, bottom chapter rail. Stage is sticky during a three-chapter natural scroll (studio → clinical practice → research). Direct chapter and exhibit buttons remain available. Scene has a dedicated mobile camera.

Mobile below 760px: identity/header at top, short display copy, scene centered under introduction, wrapping chapter/exhibit controls below. Reading dialog fills most viewport width and scrolls internally. Controls at least 44px high. No horizontal page overflow or offscreen actions.

## 5. Primitives and states

- StudioLink: normal/hover/focus/active; understated underline and directional arrow.
- ChapterButton: number + title; active rule, hover background, keyboard focus; aria-current on current chapter.
- ExhibitButton: label + index, opens real content; DOM and scene selection have equivalent actions.
- ReadingDialog: native dialog; title/close, scrollable content, Escape/backdrop dismissal, restored focus; paper surface and subtle shadow.
- PublicationRow: title, journal/year, author role, DOI link; keyboard/hover states; real JSON data.
- SceneStatus: loading/ready/failed; useful text and normal routes outside canvas at all times.
- SceneObject: resting/hover/selected; mesh picking plus DOM control parity. Spine rotation also has a labelled keyboard-operable range input.

Primitives are checked in the running page's equivalent state harness: nav/rail/controls before connecting the scene; dialog states before final assembly. Required widths 390, 768, 1440.

## 6. Motion

Tokens: micro 180ms, panel 360ms, reading appearance 240ms, camera damping 4.5/second, object damping 8/second. Ease cubic-bezier(.22,1,.36,1). DOM transform/opacity; 3D camera/object interpolation is frame-rate-independent. Scroll progress is a mutable ref; chapter state changes only at boundaries.

Reduced motion: no ambient sway/parallax; camera jumps to chapter composition; folio state sets immediately; dialog has no travel; anchor scroll is instant. Night/day is user-controlled and affects scene only; reading contrast remains stable. No mandatory intro or audio.

## 7. Architecture and performance

Astro preserves metadata/static content. React shell renders on server; 3D loads asynchronously after the shell. Root and spine-model error boundaries preserve usable content. Local geometry is split into architecture/exhibit components. Only the existing spine GLB is reused. No external environment map or 3D runtime font download.

Aim below previous 1.08 MB scene chunk; capped DPR/shadows; avoid postprocessing. Pause continuous rendering when stage is offscreen. Keep old experiments separate. Dev tools must be DEV-gated and absent in production.

## 8. Verification and scope

Deliver this iteration: editable studio, scroll tour, spine controls, research folio with publications, education/project entry points, mobile layout, loading/failure content, and containment of the existing private dashboard payload. Secondary page redesign and Notion live refresh are future scope. No production deployment in this local preview task.

Verify desktop/mobile/keyboard, scene and DOM controls, paper search/read/close and DOI links, scroll camera, spine rotation, theme, reduced motion and failed-scene fallback. Build and Astro check must pass. Record measured performance honestly; never invent Lighthouse scores. Final review uses artifact-backed findings. No critical accessibility debt is accepted.

## 9. September 6 refinement: the working study

The user found the original stage too similar to a generic AI-generated room and approved refinement of the first composition/materials/proportions and research-folio interaction. Keep the room editable and interactive. Replace toy-like rounded furniture, decorative slats and anonymous art with thin architectural planes, steel joinery, a dark research pinboard and printed public work. The spine remains the largest vertical object; the angled, cloth-bound folio becomes the foreground counterweight. Reduce the plant and chair's visual weight. This is a refinement of the existing system, not a clone or greenfield brief.

New material tokens: board #283C3D, steel #65716D, linen #454C40, warm stone #CAC5B8. Keep the existing ink/paper/clay palette and self-hosted typography. Architecture bevels 0.008–0.025 world units; furniture 0.012–0.025; paper edges 0.001–0.006. A seeded fine grain supplies plaster/linen variation; wood grain remains procedural. The daylight key becomes less yellow, with lower ambient fill to distinguish materials. UI reading-sheet radius 4px. Original display scale and responsive rail remain; copy becomes specific to endoscopic spine surgery and published work.

Research experience: selecting the folio opens a two-page reading spread. The first view presents one existing Notion publication record with the actual published first page; the second presents the same study's Figure 2, its source and a short description. The native previous/next buttons work by pointer and keyboard and update the live 3D leaf. A separate 'All publications' control exposes the existing search/year archive, preserving full discovery and DOI navigation. Figure/media credits link to the paper and CC BY 4.0. Asset provenance is in docs/redesign/refinement-2026-09-06/assets.md. Never invent personal notes or clinical evidence.

Motion: folio cover opens to 2.65 radians during the research approach; the inner leaf turns to 2.95 radians on figure selection, with existing frame-independent object damping. DOM leaf enters with opacity and a small perspective rotation over 520ms; reduced motion sets both states immediately. Switching views resets the reading container's scroll and preserves visible native focus. No new motion library. beui.dev tabs source consulted for controlled selection and scoped active-state motion; native buttons and existing CSS implement this simpler two-view book.

Responsive spread: desktop up to 960px wide, two unequal columns; below 760px one column with the document first and paging controls reachable above it. The dialog owns vertical scrolling and stays within the viewport. At short phone heights, spine uses its existing compact panel. Normal archive and site routes remain accessible if scene loading fails. Test 375, 768, 1280/1440 widths, default/figure/archive/empty states, model, night, keyboard close and reduced motion. Screenshots and review evidence belong to the new dated directory; previous approvals do not cover this refinement.

## 10. September 6: the personal office

Approved direction: the office itself occupies the first viewport and is the primary experience. Replace the left-hand editorial hero and scroll-driven camera with a compact identity header, an object navigation dock, and direct spatial exploration. This supersedes sections 4 and 6 for the homepage. Preserve the paper/ink/walnut palette, native content routes and actual research folio.

One scene unit represents one metre. Room footprint 4.8 × 4 m; walls approximately 2.7 m. Desk 1.8 × 0.85 m, top 0.75 m; ergonomic wheeled task chair seat approximately 0.46 m, back approximately 1.1 m. The 0.72 m anatomy teaching model sits on a 0.68 m cabinet with a small stand. Add a real-sized window, full-height shelving, credenza, printer, reference volumes, task light, keyboard/mouse and restrained working papers. No floating display plinth or oversized toy anatomy. Visible papers and screens use published work and verified presentation titles; do not fabricate personal awards, notes or clinical evidence.

Use a perspective camera at a moderate front-corner angle; office occupies roughly 80–90% of desktop stage, with a dedicated portrait composition. Walls/window and floor establish enclosure and human scale while front and right remain open for sight lines. Materials are plaster, wood, powder-coated metal and upholstery, with neutral daylight and warm task lighting. Reuse configurable Three geometry rather than a raster room or fixed imported room model.

Camera ownership has three states: free exploration, selected-object focus, and return. In free exploration, drag orbits, wheel/pinch changes distance, and bounded angles prevent underside/back-wall views. Existing damped click-to-focus survives. Closing returns to the exact saved free pose; Overview returns to the opening pose. Optional guided views are explicit buttons and never driven by wheel/page scroll. Keyboard arrows and +/- provide exploration alternatives. During focused spine inspection, drag rotates the model instead of the office; visible rotation buttons supplement pointer/keyboard access. Never let OrbitControls and a separate every-frame camera lerp compete.

Desktop content is a right-hand reader about 420px wide with an optional expanded reading mode; mobile uses a bottom sheet. The 3D scene remains visible and interactive outside a non-modal reader. Escape closes, focus returns to the source control, and the expanded document can be closed without losing office position. Native dialog show()/close(), labelled controls and ordinary links provide semantics. Reader scrolling must not zoom the office. The published paper spread can expand for long-form reading. Reduced motion bypasses camera travel, inertial damping and panel/leaf entry transforms while preserving manual manipulation.

The beui.dev drawer mechanism informs the reader's scoped overlay, Escape/focus lifecycle and reduced-motion path. Orbit/focus/return is a novel 3D state transition, implemented with the installed Three/Drei controls, frame-independent damping 4.5/s, target tolerance 0.002m and pointer click/drag threshold 5px. No new motion dependency. Panel opacity/transform 360ms; native hover feedback 180ms. Office geometry/model limits and paused offscreen rendering remain.

Presentation workflow: inspect Dropbox Tak/2. 학회, compare title slides/programs with live Notion Schedule records, separate confirmed talks from attendance/operations and future plans, deduplicate event/date/topic, update only supported metadata, then regenerate the public snapshot. Keep private source paths/evidence outside public assets. Do not publish clinical slide contents. The office shows verified presentation metadata; dates determine delivered/upcoming labels and retain scheduled status where known.

Gate: build/types/public guard, real desktop/mobile/tablet drag/zoom/focus/return/reader tests, direct spine rotation, night and reduced motion, live Notion readback and refreshed site data. Fresh screenshots and review reports go in docs/redesign/office-2026-09-06. No production deployment or broad deletion is included.

## 11. September 6: crafted objects and connected collections

User approved the next iteration: upgrade objects at close range; enlarge the monitor to roughly 1.15 m across the 1.8 m desk; reuse suitable personal Higgsfield GLBs from public/models after visual inspection; preserve editable room geometry. A refined keyboard has individually shaped keys, books have covers/page blocks/spines, foliage uses curved thin leaves instead of ellipsoid clumps, and wood/metal/fabric respond consistently to the same light. No fixed imported room. Keep the existing paper/ink/walnut/linen tokens; physically based surface details are object-local. Large display uses a thin frame and articulated stand, with desk accessories repositioned to avoid overlap.

The spine remains a close-focus entry to clinical practice but no longer has independent rotation, arrows, degree readouts or drag instructions. Whole-office orbit and zoom remain. Readers gain explicit list/detail navigation. Primary content should remain inside the office; external papers and full routes remain optional links, not the only way to learn more.

Research collection: previous/next selects different publications, using actual first-page previews when available. DOI keys bind public metadata and assets. Missing preview is a clearly labelled bibliographic surface, never a fabricated journal page. First page, article details and any sourced figure stay associated with the selected paper. The live 3D folio and reader use the same selected publication; page changes have a short physical turn and reduced-motion instant swap. Native search/year archive and all existing publication records remain available.

Teaching board: a year-filtered reader list selects a real presentation. Selection changes the board to its verified title slide when one exists or a typeset event/topic/date board when it does not. Detail and slide browsing remain in the native reader, and the board mirrors the current slide. Display only inspected title/introduction material suitable for the public site; no patient images, private paths or invented decks. Future events remain scheduled. Shared selected talk and slide state must update both surfaces; closing/reopening keeps context without changing the user's free camera return pose.

Workstation: selecting a project shows its supported description, methods or workflow steps in the reader and a matching display on the large monitor. Project records derive from the existing public AI and workflow pages, with no fabricated live status or patient data. Back-to-list and close-to-office are separate actions. Existing native reader sizes, scroll ownership, focus/escape and reduced-motion behavior remain.

Acceptance: inspect upgraded props from overview and close focus; verify monitor clearance, whole-office navigation, zero spine-rotation UI, multiple distinct real paper covers and synchronized 3D pages, presentation filtering/detail/slide board synchronization, project list/detail/return, native reader modes and responsive layouts. Build/types/public boundary and fresh independent visual review bind to this revision. No production deployment or new Notion metadata writes are needed.

## 12. September 6: local time, daylight and directional pages

The user requested correct forward/backward physical page turns and a live calendar clock on the desk, with window light and shadows following the visitor's local time. Preserve the existing room, objects and collection layouts.

Folio: Next moves the outgoing right-hand leaf up and over its left binding (0 to positive pi); Previous returns the incoming leaf from left to right (positive pi to0). Keep the correct outgoing/incoming paper textures during the turn; no visible reverse reset. Direction is based on publication order, shared by the physical leaf and reader entry. Rapid direction changes settle on the latest selected publication. Reduced motion swaps immediately.

Calendar clock: a38cm wide,22cm tall, shallow dark metal/paper-faced desk clock to the left of the monitor, behind the folio. A large day, weekday/month/year,24-hour time with seconds, and IANA timezone label use existing paper/ink/clay/steel tokens. Local clock ticks each second and catches up immediately when the tab resumes. An equivalent unobtrusive HTML time readout provides readable and accessible information without announcing every second. Clock updates must not rerender the whole office or its collection.

Local light is the default. Reuse installed SunCalc2 sun-color/sky ramps; use browser IANA timezone and representative timezone coordinates, not IP geolocation or permission prompts. This approximates regional sunlight, not the visitor's exact building orientation or weather. In the virtual office the window faces the equator; sun altitude and azimuth drive direction, intensity, warmth and window sky. Real shadow-casting window frames and cutaway architectural shadow occluders shape the floor illumination. At night sunlight disappears and a warm desk lamp lights the room. Existing daylight/evening controls become optional explicit previews, with a return to Local light; the clock always remains actual local time.

Sun palette, inherited from the previous desk-scene solar utility: sky navy#0a1020/#141c30, twilight#54648e, daylight#87b0dc/#d4e4f2, horizon#e0925e/#e87f40, sunlight ramp#ff9d62/#ff8442 to#fffaf2. Light updates are gradual astronomical changes, sampled every30seconds; no decorative flicker or rotating clock digits. No exact-location claim. Unknown timezone coordinates fall back to a clearly documented UTC-offset approximation.

Acceptance: captured forward/back page motion and rapid reversals; clock seconds/date rollover/timezone/DST checks; desktop/mobile clock readability and desk clearance; morning/noon/dusk/night window and real shadow differences; local mode on first visit and explicit preview reset; reduced motion, build/types and existing collection/public-data boundaries. Scope remains local preview without deployment.

## 13. September 6: mechanical flip clock and working desk

The calendar clock becomes a tactile split-flap object in the same position: warm ivory housing, dark matte cards with large cream tabular digits, a physical central seam and small metal hinge pins. Two large hour/minute cards and a discreet seconds card retain actual local time; a printed calendar strip retains weekday/date/year. Numbers only flip when their values change. The outgoing top half folds forward and downward around its horizontal hinge to reveal the next lower half. Duration 480 ms, gravity-like acceleration followed by settling; reduced motion swaps immediately, and interrupted updates settle on the latest value. No sound or gratuitous ticking animation. Reuse the existing R3F frame loop and texture lifecycle; no new motion dependency. The beui.dev number source informs value-driven updates, cancellation and immediate reduced-motion values; the actual two-sided mechanical flap is a novel 3D primitive.

Move the keyboard approximately 13 cm farther into the desk and center it with the monitor. The Mac mini sits on the monitor centerline directly beneath/in front of its screen, clear of its support. Add a thin dark leather desk mat under keyboard and mouse with a restrained rounded edge, fine grain and stitching; retain room and other object positions. Coordinate placement accounts for the desk group's 5 cm X / -12 cm Z offset. Keep the mat clear of the open folio and the Mac mini clear of its rear edge.

Acceptance: inspect daylight and evening close-ups, flap rest/mid/settled seconds and minute transitions, reduced motion, mobile layout, keyboard wrist clearance, monitor/Mac-mini alignment and mat contact. Show the user the completed office in the existing Evening preview; its clock still shows real local time. Books remain unchanged in this scope; personal cover/spine references can support a later faithful library.

## 14. September 6: outward-facing office and reception

The user's actual office informs the new plan: the working chair has the rear wall behind it and the desk faces into the room. Rotate the desk, its accessories, folio, clock and monitor together by 180 degrees; move the working group rearward 45 cm in the old world frame. Preserve ergonomic local offsets. Reframe object-focus cameras from inside the rear wall, so the monitor and paper remain readable on selection. Initial overview remains an entrance-side view of the complete office.

A two-seat linen sofa sits along the room's right side facing the interior, with a low rounded coffee table; the existing rear bookcase remains part of this reception setting. Keep the window, clinical credenza, spine and plant positions unless real intersections require correction. Cushions, subtle seams, feet and material grain use the existing geometry/material system. Maintain clear separation among desk, low table and sofa; the open room remains orbitable and zoomable.

Publication previews: continue obtaining authentic, correctly matched PDF first pages with clear source/license attribution. A typeset metadata fallback must never be described as the actual first page. Preserve the source-backed record when an original is unavailable; report unresolved records and use any author-provided PDF location within the user's scope.

## 15. September 6: suspended monitor and M4 workstation

User clarification: the large monitor hangs from a real desk-clamped articulated monitor arm, leaving open space immediately under the display for an M4 Mac mini. Replace the visibly damaged/generated computer asset with clean editable physical geometry based on Apple's 2024 Mac mini reference (12.7 × 12.7 × 5 cm, rounded aluminium enclosure, front two USB-C ports/headphone jack, rear power/Ethernet/HDMI/three Thunderbolt ports). The front faces the chair; no 90-degree asset rotation. Model ports and subtle base ventilation, physically anchored power/display cables following the arm and desk edge. Do not reuse a photo as a fake 3D box. Keyboard is wireless with no cable; remove any cable embedded in its imported asset by replacing that asset if necessary. Use the existing palette and high-roughness aluminium response.

The leather mat now covers over 80 percent of desktop area: centered 1.68 × 0.76 m on the 1.8 × 0.85 m top, approximately 83.5 percent coverage. Its thin edge, grain and stitching remain restrained; resting objects sit on its actual top. This supersedes the small-mat placement in section 13. Preserve the newly outward-facing desk and camera positions while coordinating monitor/mini clearance in local desk coordinates.

The new rear-side desk guide also requires unbounded horizontal office orbit. Cut away back/left visual walls when viewed from outside those walls, while their separate shadow geometry still encloses the lighting. Keep bounded elevation and zoom; focused content retains its stable camera and return pose.

Clock clarification: seconds are a third full-size flip card alongside hours and minutes. The ivory housing is now 46 × 26 cm, the calendar strip 40.8 × 5.1 cm with heavier, larger high-contrast text. This supersedes the discreet seconds card in section 13. Shift the clock inward to keep the larger housing wholly on the desk.

## 16. September 6: looking from the desk into the office

User clarified the viewing direction: default overview now looks from behind the desk/chair into the reception area. The rear visual wall is removed. Move the solid display wall to the far/reception edge (+Z), put the bookcase on its left and the teaching board above the sofa to its right. The sofa turns to face the working desk, with its table in front, maintaining separate work and meeting zones. Left window and spine cabinet remain. The board faces the desk (rotation pi); every teaching focus camera must face the new board plane. Far wall cuts away only when orbiting outside it; the omitted rear wall remains a shadow-only enclosure for consistent light. Horizontal orbit stays free.

Desk references researched: Maker Stations' Lee Seung Heon walnut workspace (https://www.makerstations.io/lee-art-teacher-setup/) for walnut/black-mat/compact-device palette and cable discipline; Herman Miller Lima monitor arms (https://www.hermanmiller.com/products/accessories/technology-support/lima-monitor-arms/) for clamp, jointed support, VESA attachment and clear desk area. These inform material and functional layout, not a pixel-copy target. Avoid decorative gadget clutter or unsupported personal book covers.

Folio correction: the hard cover must open a full 180 degrees (pi), so the turning paper never travels beyond a partly raised cover. Keep existing directional leaf motion and reduced-motion behavior, and verify Next/Previous against the fully open cover.

Portrait verification adjustment: widen vertical field of view to 60 degrees for portrait viewports (42 degrees in landscape); move the mobile overview back and permit its 13 m maximum orbit distance. This keeps the spine, desk and reception together on screen at 390 px instead of cropping the outer exhibits. Desk and focus views retain their dedicated positions. Leather texture supplies its own ink tint; the material uses a neutral multiplier so the grain and charcoal color survive rendering.

Folio inner surfaces: the fully opened hard cover has a cream-white endpaper lining. A turning leaf has its actual first-page texture only on its front; its reverse is unprinted white paper. Remove the clay-red ribbon bookmark. Keep all paper identity, direction and cover-angle behavior.

## 17. September 6: desk-object quality and human scale

User rejected the flattened keyboard, featureless mini and pebble-shaped mouse. Restore tactile workstation quality: a compact wireless mechanical keyboard with a substantial charcoal case, aluminium edge, individually beveled ivory keycaps and restrained sage modifiers; a sculpted ergonomic mouse with separate button seam, transverse textured metal wheel and thumb rest; an accurately sized M4 mini with softly rounded plan corners, small top-edge bevel and proportional recessed I/O. No device cables on the wireless keyboard or mouse. Hardware material tokens: aluminium #B8BDBF, aluminiumEdge #D8DCDE, graphite #34393B, rubber #222626, keyIvory #E4E2DB, keySage #9CB7A3. Keep all existing workstation positions and physical power/display connections.

Clock scale becomes 0.70 of the 46 × 26 cm housing (32.2 × 18.2 cm), with all three flaps and date retained. Keep feet on the mat. The anatomy model is judged relative to the chair's actual seat surface (approximately 53 cm), 75 cm desktop and a schematic seated adult: pelvis near the seat, shoulder approximately 1.08 m and head top approximately 1.37 m. These are design proportions, not a measurement of the user. Use a 54 cm overall teaching model (including its imported pedestal), starting at 73.5 cm so its top is 1.275 m, below the seated head. Preserve original anatomy proportions and asset; do not enlarge the pelvis separately. Verify overview and focused views at the same camera before/after. The earlier 72 cm model and 46 cm clock are superseded.

## 18. September 6: a deeper office and a readable collection

The next local iteration expands the room to approximately 4.8 × 6.4 m. Keep the view from behind the working chair and the desk facing the reception zone. Use the supplied office photographs as material/spatial references, not exact clones: photo 6 for generous front-to-back circulation and a reception rug; photo 9 for warm walnut storage and integrated shelf lighting; photo 4 for a real two-link monitor arm, flush rear VESA plate, mechanical pivots, desk-edge clamp and managed cable loops. Preserve editable architecture and the established paper/ink/walnut material system. Keep furniture human scale instead of stretching it with the room. The working group moves rearward together; the far wall, board, bookcase and sofa move forward together. Leave a useful gap between the working desk and the coffee table. Replace the isolated spine table with a low, elongated wall-side credenza integrated with storage. Preserve the 54 cm model.

Move the valued HH:MM:SS flip/calendar design onto the reception wall, with a restrained wall bracket and no desk feet. Keep the same date hierarchy and actual local clock; size it for room viewing. The desk gains clear working surface. The task chair must use a high-quality supplied or licensed model resembling a Herman Miller chair or the beige leather reference, rather than another procedural approximation. Record source and license; do not call an unidentified model the user's exact chair.

Research reader: first-page preview, actual title, ordered authors, journal/citation/date, DOI, PMID when verified, and the source abstract are visible within the side/expanded reader. Keep actual abstracts separate from summaries and render structured sections where supplied. Every article retains DOI navigation. Verified open-access papers expose a PDF link/view; restricted or unverified full-text access exposes a request-by-email action addressed to woontak.yuh@gmail.com with that paper's title and DOI prefilled. Label this as opening the visitor's email app, never a submitted request. Never publish private full PDFs merely because their first pages are supplied. DOI identity binds metadata, access and media; missing identifiers or abstracts are honestly absent, never invented. Use existing panel/link/filter primitives and scoped scroll ownership.

Teaching board: favor verified title/key slides on first load as well as selection. Keep board and native reader synchronized; label metadata-only entries honestly. Inspect available decks before publishing additional title slides and exclude patient or confidential content. Remove the unrelated clipped camera-system figure beside the board.

Personal corner: a slender freestanding metal clothes rail with wooden hangers, a white short doctor's coat, a textured jiu-jitsu gi and a draped belt. Coat opens clinical content; gi/belt opens a public jiu-jitsu page. A standing surfboard reuses the user's existing Higgsfield asset and opens public surfing content. Do not invent belt rank, awards, training statistics or surf trips. Extend keyboard/touch alternatives to every new selectable object; all navigation must remain usable without WebGL. Restrained garment folds/seams and matte metal/wood materials should make this feel like a lived-in office rather than a costume display. Reuse current motion, focus/return and reduced-motion rules.

Acceptance: verify every publication's metadata/abstract/access routing, selected teaching slides and default board, deeper overview/close/side views, physical monitor connections, wall clock transitions, chair asset quality, clothing/board navigation, responsive dock and readers, keyboard return, build/types/public-data guard and current browser evidence. Physical chair model identity and any unavailable presentation source remain explicitly documented. This iteration is a local review before another deployment.

Current user-supplied garment reference: `BJJ sheet1.png` and `BJJ sheet2.png` define the white Control gi, blue cuff trim and patches. The user explicitly specifies a blue belt with three white rank stripes, draped over the hanger at the gi neck, not tied around its waist. This supersedes the earlier unspecified belt. Leave the current logo untouched; a durable takmd.com identity is a separate future collaboration.

Rendering correction discovered during room inspection: thin rounded blocks must preserve their declared physical thickness. Use Three's dimension-clamped RoundedBoxGeometry and normalized face UVs so rug, shelves and desktop edges do not inflate and fabric/wood textures do not stretch into large stripes. Inspect all room surfaces after this shared primitive change.

## 19. September 6: real hanging garments

The wardrobe’s doctor coat and Control jiu-jitsu gi must be genuine textured GLB garments, generated from source images based on the user-supplied garment references at `docs/redesign/garment-realism-2026-09-06/source/physician-coat-reference.png` and `docs/redesign/garment-realism-2026-09-06/source/control-gi-reference.png`. They are dimensional cloth assets, never flat panels, polygonal garment silhouettes, tube-fold substitutes, box belts, or scene billboards. Preserve authored PBR base-color, normal, roughness, and metal maps so cuffs, collar, seams, lapels, hanger wood, silver hook, and real cloth folds respond to the studio lights and independent orbit.

Each delivered GLB already contains its walnut hanger and silver hook; the gi also contains the required neck-draped blue belt with three white rank stripes. Do not duplicate, recolor, reconstruct, or add procedural hanger, belt, patch, seam, or fold geometry around those assets. Keep the current rail, wardrobe positions, `spine`/`bjj` interaction IDs, focus/return camera behavior, keyboard/touch alternatives, and non-WebGL navigation unchanged.

Fit each imported source only after inspecting its actual bounds and axes. Align its hanger-hook contact with the existing local hanger convention (caller origin at hanger center, caller y = 1.655 m, rail global y = 1.700 m, hook top approximately local y = 0.079 m). Target adult garment proportions are approximately 74 cm shoulder-to-hem for the coat, 78 cm for the gi, and approximately 90 cm for the full hanger-and-garment assembly; source observations take priority over these target dimensions. Use an isolated mounted clone with an explicit cleanup policy that preserves cached loader resources and the GLB’s material/texture ownership.

Coat material refinement: preserve the source 4096-pixel maps, strengthen the authored micro-normal response, reduce dielectric shine and use restrained rough cloth sheen. Keep the gi at 2048 pixels. Apply these physical material settings within the coat GLB, so raw asset inspection and the office use the same material without runtime patches or new geometry.

## 20. September 7: a coherent oak office

The user rejects the scattered interior, exposed central clothes rail and generic thin-legged desk. The primary reference is the supplied `deskterior15.jpg`; all fifteen supplied deskterior images were inspected together in `docs/redesign/office-interior-2026-09-07/references.png`. Image 15 governs pale oak joinery, a substantial twin-pedestal desk, ivory walls, a broad woven rug, tall integrated bookcases and a long window-side cabinet. Image 7 informs the generous lounge zone. These are physical interior references, not a flat page/screenshot clone: preserve an independently orbitable office, its existing content and the view from behind the working chair into reception.

The room becomes 5.6 × 6.8 m with 2.85 m walls. A 2.2 × 0.85 m sculptural oak desk stays at [-0.05, 0, -1.1]; tabletop top remains 0.7775 m to retain real equipment contacts. Its broad chamfered edge and two substantial oak supports replace the four thin rods. A generated/sourced detailed desk must be a real textured mesh, not a photo plane. Keep the large suspended monitor, existing detailed keyboard/mouse/Mac mini, human-scale chair and paper folio. Enlarge the leather mat horizontally to retain more than 80 percent desktop coverage.

Place the clothes rail against the entry-side left wall at [-2.35, 0, -2.15], facing +X into the room (yaw pi/2). Preserve both finished garment models, hook height, material quality, stripe count and interactions. It must no longer screen the lounge or sit on the main desk-to-reception path. Update BJJ focus cameras to this actual location. A substantial cream two-seat sofa sits along the right side, faces inward, and groups with a lower oval stone coffee table and one lounge chair; target sofa center [2.0, 0, 1.1], footprint 0.9 × 2.05 m. A continuous low-contrast 4.25 × 5.5 m woven rug ties the workstation and lounge together. Keep circulation between the working desk and reception table and along the shelves.

Replace the isolated narrow shelf with two tall oak bookcase bays flanking the real teaching display on the far wall. Add closed lower cabinets, recessed plinths, varied book arrangements and small ceramic forms, with warm recessed shelf light. Window-side storage is a continuous matching 3.3 m credenza at [-2.46, 0, 0.65]; the spine remains 54 cm high on its surface. The long, dark-bronze-framed window, full-height cream curtain folds, plaster recesses, skirting and restrained cornice give the room architectural depth. Walls cut away outside the room; retain physical shadow occluders.

Interior material tokens: oak #A78A67, oak-light #C3AA85, oak-shadow #6A513B, ivory #F1EDE4, warm-plaster #E3DCD0, woven-sand #D5C7B1, upholstery #D5C8B6, bronze #51493E, stone-light #DED8CB. Use locally served licensed/authorized PBR maps at believable physical scale, with restrained roughness and normal response. Avoid stretched procedural streaks, speckled white floors, identical books, flat green upholstery and unnecessary decorative objects. The room remains readable at night with warm shelf/task illumination and a soft neutral fill; current local time and preview controls retain their behavior.

Acceptance: compare the whole furnished office with reference 15 at overview and human-eye guided view; individually inspect desk supports/material, shelf joinery, sofa upholstery, window/curtain and rail placement. Verify all six object focus/return flows, real paper paging and teaching previews, free orbit/zoom, day/evening, desktop/tablet/mobile and reduced motion. Record exact build/type/public-boundary results and fresh independent visual/integrity reviews. This iteration is local only; identity, biography, Notion records and production remain outside this visual scope.

Follow-up requirements: rebuild the Mac mini against official M4 product references, retaining its compact 12.7 cm square footprint, correct rounded enclosure and front/rear port identity, and existing cable contacts. Controlled window/ceiling reflections must make its aluminum finish readable. With a detail panel open, enable drag/orbit and wheel/pinch zoom around the selected object's focus target, including keyboard equivalents. Preserve focus animation, panel scrolling, responsive framing and exact return to the prior free-office camera; dragging must not trigger accidental selection.

## 21. September 7: wall calendar and closer arrival

The wall clock now needs wall-scale proportions: approximately 90 cm wide by 56 cm high, centered above the teaching display with clear cornice/display separation. Preserve mechanical flipping hours, minutes and seconds. Give the calendar a separate generous lower row: large day number, weekday, month and year with dark text on warm ivory; the date must no longer be a miniature caption. Preserve the visitor's local time zone and daily rollover.

Bring the initial/overview camera approximately 15–18 percent closer on desktop and mobile, retaining the view from behind the working chair toward reception. Favor legibility of the desktop and large monitor; the room may extend toward viewport edges. Preserve the existing guided and selected-object cameras and free-view return behavior.

Keep a restrained first-use interaction hint at 70 percent opacity in the existing footer slot. Fade it out using the existing panel-duration token after the first canvas pointer/wheel/navigation-key action or exhibit selection. Keep its accessible description available; no new popup or persistent selected-view badge. Returning to overview during the same visit does not reintroduce the hint. Reduced motion removes the fade duration.

The monitor opens the user's Living CV. Reuse the existing public CV's roles, career, education programs and awards from a shared data module; retain publication/presentation links and the complete CV route. The physical screen also displays a CV document with the same source content. Replace user-facing AI/workstation-project labels in this office entry with Living CV. Focus from the monitor's front normal at seated eye height, preserving a little desktop context. Fit the monitor within the visible canvas beside/beyond the reader at each viewport; the user can still orbit/zoom and close to the saved room view.

## 22. September 7: a working office and richer personal collection

This section supersedes earlier interim dimensions and local-only scope. The user authorized completing this checkpoint, committing, pushing, and deploying it. Keep the 5.6 × 6.8 m oak office and the reference-led furniture composition. Use a conventional 32-inch-class 16:9 display, 60 × 35 cm wall-mounted calendar clock with six mechanical HH/MM/SS cards, and a true 3.5 mm leather mat. Power follows the monitor arm into an under-desk outlet; one short display cable connects the mini's actual rear HDMI port to the monitor. Wireless input devices have no cables. Rotate the spine 90 degrees counterclockwise from its former orientation, remove the credenza lamp, and restore the source Bing surfboard orientation without flattening its fin.

The first monitor screen shows the user's portrait, three academic interests and all ten society/editorial activities supplied on September 7. The shared CV data drives this screen, the detailed right-hand reader and the full CV page. The mini is a separate AI entry collecting projects, matching talks and matching publications, with actual reader drill-down. Selected exhibits retain orbit/zoom and return to the saved office view. A short, subtle chair swivel on hover is explicitly requested; it settles and is disabled for reduced motion.

The wall display and its right-hand reader share previous/next presentation state. Slide paging is separate from meeting paging. A full-screen dialog loads the current slide and preloads only its next neighbor; the thumbnail strip uses separate small images. Closing that dialog with Escape must retain the meeting reader. Full-deck import accepts explicitly matched PDFs and preserves the manifest on invalid input; until new decks arrive, the existing nine verified slides remain labeled as selected slides.

The spine credenza gains a small teaching dummy, a biportal instrument tray and a plush pig. They open three honest workshop starter routes; no unprovided dates or curriculum claims are invented. The jiu-jitsu route reuses the user's dashboard character and a filtered Notion snapshot of actual mat sessions, with independent Gi/No-Gi month and session selection. Private notes and dashboard identifiers do not ship.

The electronic desk frame uses the supplied IMG_1174.jpeg. Clicking it only focuses the object, with no detail panel or album login. Local photo-folder imports optimize and strip metadata, and additional photos rotate between visits. Raw originals remain outside the published build. iCloud synchronization and the cancelled friend-approval album are not implemented. The current logo remains unchanged for the later branding discussion.

## 23. September 7: responsive rendering and closer inspection

Preserve every current model, material and physical proportion while reducing rendering cost on low-spec computers. Batch the mat's 268 stitches and keyboard's two-layer keycaps by material, retaining their exact rounded geometry. Start at the existing desktop pixel-density cap of 1.75 (compact 1.35), then adjust resolution from sustained measured frame speed; recover quality slowly when performance permits. Hidden-tab pauses and initial scene loading must not force a permanent quality reduction.

Allow closer inspection: free-view minimum orbit distance 0.35 m, focused-object minimum 0.25 m. In the free office, zoom toward the pointer and allow right-drag/two-finger panning so models on the side cabinet are reachable. Keep selected-object orbit centered and preserve the saved free-view return. The surfboard and its collection shortcut open the supplied Instagram address `https://www.instagram.com/tak_md/` in a new tab.

Reuse shadow maps while only the camera moves. Invalidate for moving, appearing or disappearing shadow-casting meshes and lighting changes, after the current frame's object animations have run. Preserve full shadow resolution, real-time flipping cards, chair swivel and paper turn shadows.

Reference originals and provenance are saved in `docs/reference-assets/2026-09-07/`, outside the published asset directory. The supplied white rail is 99 × 152 × 46 cm with rounded top corners, an approximately 22 mm tube, a low horizontal brace and bent feet 11 cm high. Its coat and gi hang from their actual hanger hooks perpendicular to the bar; no hover lift may detach a hanger. Keep original garment meshes and materials. The supplied pig governs a round pale-pink plush with folded ears, embroidered dark eyes and peach feet/snout. The supplied rigid endoscope reference governs the thin stainless shaft, black eyepiece, faceted coupler and companion working sheath with paired stopcocks.

The KOSESS Best Shorts Award uses the seven supplied Dropbox photographs, with an estimated 20 × 30 cm satin gold face, approximately 15 mm depth and 13-degree backward lean. Preserve the actual printed title, August 29, 2026 date, signature and triangular emblem as source-derived decals. The inset is polished gold; the reverse has a keyhole and a thin silver threaded support rod with a dark collar. Use shared GOLD_AWARD tokens: satin/back #D6B77A, edge #C7A15A, mirror #D9AD4A. Display it on the oak storage without obstructing the anatomy/workshop collection; clicking opens the owner's award-winning Short at `https://www.youtube.com/shorts/UyUNSzS4AXs`. The footer YouTube link opens the channel's `/@tak_md/shorts` tab.

The replacement dummy still awaits a user-provided reference photograph. `workshop.takmd.com` is a proposed separate dummy-workshop site; keep the existing working route until that site is built.

The opening office camera and Overview reset sit about 20% closer to the desk, with the target shifted slightly toward the desktop. Desktop and compact poses use their own matching framing; individual exhibit focus poses stay unchanged.


## 28. September 7: document clarity and office navigation

The opening Overview now starts about 20% closer to the desk while retaining the room's existing composition. Overview resets to that pose. OrbitControls supports Shift + left-drag, right-drag and Shift + arrow keys for camera translation, including when an object reader is open. Touch uses one finger to orbit and two fingers for pan/pinch zoom. Closing a reader restores the prior free-room pose. The wall carries a matte, token-colored controls placard with device-appropriate instructions, backed by faint DOM help and keyboard descriptions.

The research cover reads “Woon Tak Yuh, MD”, “Research & practice”, “Spine surgery · Endoscopy · AI”, and “Selected peer-reviewed publications”. When open, the printed right page advances and the white left reverse returns to the previous publication. First and last entries are bounded, consistent with the reader arrows. Dragging, modifiers and multiple pointers must not turn a page; rapid actions remain synchronized with the reader.

The KOSESS plaque is exactly A4 (210 × 297 mm; 15 mm body depth), with the photographic artwork scaled in its local plane. Place it on the inner lower compartment of the right bookcase, at [1.58, 1.3025, 2.985], facing the room. Both body and rear support meet the shelf. The plaque first focuses for inspection; its polished upper inset then opens the awarded Short at https://www.youtube.com/shorts/UyUNSzS4AXs. General YouTube links open the channel's Shorts tab.

Document clarity is selective: two paper textures at 1275 × 1800 preserve the 1600-pixel-tall source previews; the CV monitor draws natively at 2560 × 1440. Use renderer-capped anisotropy on those maps and unlit, untone-mapped printed page and monitor materials to preserve ink contrast, with a warm paper tint at night. The physical covers, page edges and room remain lit. Retain mipmaps and linear filtering, global adaptive DPR, shadow caching and low-spec protections. Distant small type remains limited by available screen pixels; the reader provides readable document detail.

Navigation labels are Profile, Practice, Research, Talks, Education, AI projects, Connect. These correspond to CV, clinical practice, research, presentations, education, AI side projects and social media. BJJ remains accessible through the gi. Education currently describes workshops and training. The owner confirmed workshop.takmd.com will be built later; retain the current education route and defer that external connection until launch. Social media opens a native dismissible popover containing YouTube, LinkedIn and Instagram, in that order. The seven entries remain readable on tablet, with a horizontally scrollable mobile rail and a visible swipe hint. Full-page footer ordering matches the collection.

ResearchProfile is a reusable, compact three-column accessible definition list. Its static all-time Google Scholar snapshot explicitly names the source and check date, with links to the verified Scholar and ResearchGate profiles. Values are not presented as live updates or mixed across indexing services. Styles use existing studio/page tokens, wrapping 44-pixel link targets, and no new motion.

## 29. Eames furniture composition (2026-09-07)

- Replace the guest chair with an authored Eames Lounge Chair and separate Ottoman, pale oak shells, ivory matte fabric and polished aluminium. Distinct headrest, lumbar and seat shells, sculpted cushions and five/four-star bases retain the reference silhouette. Chair envelope: 0.85 × 0.89 × 0.84 m; ottoman: 0.66 × 0.54 × 0.44 m.
- Desk chair: Laci Lacko's Eames Soft Pad Executive model with three high-back pads, ivory leather, slim aluminium rails and five casters. Uniformly fitted to 1.08 m height; existing subtle hover swivel and reduced-motion behavior remain.
- Sofa: Florence Knoll Relaxed two-seater, independently modeled from the supplied references at 1.6002 × 0.889 × 0.79375 m. Ivory tufted cushions and thin square chrome frame; 28,464 triangles and four material draws.
- Coffee table: Daniel Lee / Flareworks Studio's CC0 Noguchi model, pale ash and transparent glass, matching the supplied 1.26 × 0.90 × 0.37 m reference. Keep its sculpted interlocking legs and curved triangular top. Lightweight alpha glass avoids a transmission pass.
- The lounge faces diagonally into the conversation area. Move lounge and ottoman 32 cm toward the window to open the central floor; table long axis follows the sofa. The 4.9 m rug accommodates the sofa's rear legs; seated furniture is grounded at its 35 mm top surface.
- Raw user references and artist originals are archived locally outside public output. Public model provenance is recorded beside each asset and linked through the Scene credits page. No user reference photos are published as scene geometry.
- Mac mini: original user-provided Claude heart and Codex pet stickers, 28 mm and 18 mm wide, placed on the front-left corner of the top panel with a 0.2 mm surface offset. The centre Apple mark remains clear. Source artwork is preserved.
- A neutral wall reflection fills the static environment capture, so polished chair metal reflects the room rather than black empty space. Existing adaptive resolution and cached-shadow behavior are retained.
- Replace the generic mouse with the user's light-grey MX Master 4, independently modeled from the five supplied references at approximately 128.2 × 88.4 × 50.8 mm. Preserve the thumb shelf, two metal wheels, side buttons, haptic pad, LED and wireless placement. It is a visual reconstruction, not official CAD.

## 30. Joint design checkpoint

The latest upholstery choice matches the existing sofa's warm beige base color: sRGB #C7BBA5 (glTF linear RGB 0.5711248295, 0.4969329951, 0.3762621230). Apply it only to the Soft Pad leather and Eames lounge/ottoman fabric. Retain their distinct roughness, weave normals, sheen, wood and metal. This supersedes the ivory wording in section 29; no geometry or scale changes are involved.

The user requested a joint review before further interior replacements. Keep the current room dimensions and publish no unreviewed expanded-room design. The proposal in `docs/plans/2026-09-07-office-design-checkpoint.md` compares a 6.4 × 7.6 m room at unchanged furniture scale, clearer work/lounge/exhibition zones, and USM/Vitsœ storage and desk candidates. Those are next-phase proposals, not implemented replacements. Current content, interactions and close arrival framing remain the basis for review.

## 31. After the published checkpoint

The monitor's clicked reader is titled “Curriculum Vitae” and contains the text profile without a second portrait. Keep the portrait on the physical monitor and the separate full CV page. Replace the Codex pet decal with the user's transparent `codex pet.png`, without a rectangular backing. Its visible alpha silhouette is approximately 19.5 mm tall, matching the complete Claude heart sticker at the existing 28 mm plane width. Preserve both images' native proportions and original pixels.

The wall TV remains fixed during hover and selection. Only its screen gains a small, damped emissive contribution (0.08); reduced motion switches directly. Remove the physical wall controls placard. Show a small translucent gesture hint above the navigation on first arrival, hide it after seven seconds or the first scene interaction, and retain a keyboard-accessible Controls toggle. Use existing paper/ink/line and micro/panel motion tokens; mobile labels describe touch gestures. Retain screen-reader instructions. Allow free camera distance down to 0.10 m and selected distance to 0.08 m, with a 0.015 m near plane for small-object inspection; preserve initial framing, pan and saved-pose return.

## 32. First personal Easter egg

The Claude heart sticker alone opens a native modal photo card titled “뽐뿌방 ❤️”. Preserve the current camera and any underlying reader. Dragging, modified clicks, secondary buttons and multitouch must not open it or the parent Mac mini's AI reader. A focus-revealed “Claude sticker” button gives keyboard users the same discovery without adding a visible navigation item. Escape, the close button and the backdrop dismiss the card and restore focus.

Use the owner's supplied IMG_0430.jpg without cropping, filtering or retouching. Publish a 1800-pixel-wide WebP derivative with metadata removed, loaded only on discovery. The source EXIF records 2026-08-29 20:13:39. The caption displays “2026.08.29 · 20:13”, “서래본갈비”, “KOSESS 2026 뒷풀이” and, left to right as identified by the owner, “여운탁 · 고용산 · 박용진”. The card uses existing light/paper/ink/muted/line tokens, 12-pixel corner radius, 24-pixel desktop and 16-pixel mobile padding, 28-pixel title and 12-pixel metadata. Keep the complete photo visible with contain sizing, scroll only if needed on short screens, and use no new motion.

## 33. Inspecting the gold award

The award uses the standard selected-object camera and reader. Its first click, including a click on the upper inset, focuses the complete A4 trophy without opening a link. Preserve its 210 × 297 × 15 mm overall size, source-derived artwork, lean, support, position [1.58, 1.3025, 2.985] and rotation pi. Orbit and zoom stay available; Close and Escape restore the saved office camera and source focus. A focus-revealed discovery button provides keyboard entry without adding an eighth collection item. The existing reader supplies a named Short link and native close/expand controls only after selection.

Match the owner's original IMG_0746, IMG_0748 and IMG_0751 photos: the large face has fine sandblasted gold stippling, the upper inset is polished, and the outer outline has only a very small corner radius. Use the existing photograph-derived grain for light-reactive bump and restrained color variation; do not flatten the trophy into a photograph or redraw its lettering.

Only the focused polished upper inset and its play emblem open the existing award-winning YouTube Short. Decorative decals and the glow layer do not intercept picking. While hovered, a continuous 1.8-second gold gleam crosses the inset with a soft local halo. The inset maintains an emissive contribution of 0.65–1.15, environment intensity of 2.2–3.1 and roughness of 0.12; the full trophy remains stationary. The local glow uses one small additive shader plane, avoiding whole-scene bloom. Pointer exit, dragging and loss of focus reset the material to its resting appearance; touch has no phantom hover. Reduced motion retains static gold emphasis and halo without the moving gleam or pulse. Camera timing remains unchanged.

Activation requires the same primary, unmodified pointer down/up within the same actionable region and under 5 px travel. Any intervening drag, second pointer, modifier, cancellation or window blur cancels it. The first unfocused press can never become a link after focus changes. Verify body versus inset routing, sustained hover/reset, keyboard entry/link/close, saved-camera return, focused orbit/zoom, multitouch and reduced motion in the built desktop and mobile office.

## 34. Full-length Bing longboard

The owner's board is 9 ft 6 in (2.8956 m) nose to tail. Uniformly scale the existing Bing GLB, preserving its silhouette, fin and materials. Keep its facing yaw, lean it 0.28 radians sideways with the existing 0.035-radian fore/aft tilt, and move only the board within its corner from [2.44, 0, 2.67] to [2.35, 0, 2.30], clearing the bookcase shelves. Ground the actual transformed tail vertices at the 0.0185 m finished floor; the tapered outline must not float due to an oversized axis-aligned bounding box. The board stays within the existing 5.6 × 6.8 × 2.85 m room, including its 8 mm hover lift. Preserve the Instagram interaction and all other furniture placements.

## 35. Taller room and shared personal corner

The owner approved 3.20 m walls while retaining the 5.6 × 6.8 m floor plan. Move the full-size Bing longboard to the front end of the garment-rack wall so surfing and jiu-jitsu share a personal corner and the award bookcase is clear. This supersedes section 34's corner, facing and lean. Place it at [-2.10, 0, -3.01], facing into the room at PI / 2 + 0.18, with a restrained 0.12-radian fore/aft lean and -0.015-radian sideways lean. The roomward offset clears the projecting garment shelf without moving the wardrobe. Keep the true 2.8956 m length, original materials/fin and existing Instagram interaction. A small white padded floor cradle supports two points on the solid tail rails, calculated from actual transformed vertices; raise the fin 65 mm above the finished floor so it carries no weight. The cradle base contacts the floor at 0.0185 m. The board must clear the rack, garments, wall, shelf, room edge and ceiling in rest and hover states. Keep the existing desk, lounge, cabinet, wardrobe, window and artwork dimensions/positions. Wall crowns, shadow enclosure and ceiling light follow the shared room-height token. Retarget surfing's related camera poses to its new corner and pull back the desktop overview to [4.5, 3.4, -6.5], looking at [-0.15, 1.35, -0.4], so the taller room and board remain framed. Verify overview, practice, desk and close corner views at mobile, tablet and desktop widths; preserve object picking, keyboard alternatives and reduced motion.

The portrait overview uses [2.7, 4.2, -13.3], looking at [-0.35, 1.25, -0.7], to include the personal corner; close inspection remains available with the existing zoom and guided views.

## 36. Narrow white Loop Stand

The owner selected the narrow white HAY Loop Stand form. HAY calls the narrow 45 × 39 × 150 cm version Loop Stand Hall; the 130 cm Wardrobe is the wider version. Source: https://www.hay.com/hay/furniture/coatrack/loop-stand-hall and HAY's Loop Stand product sheet (3 × 3 cm powder-coated steel and three-legged construction). Replace the rounded tube rack with a real 3D top rail and three angled square steel legs, subtle softened edges and felt feet. Use the existing white token with restrained powder-coat roughness. Retain the current rack position/yaw, 90 cm coat/gi assets and clickable behaviors. Space their hooks along the narrower rail and rest the curved hook openings on the square rail's upper edges with the smallest needed height correction. Do not shrink clothing to make it fit. The coat metal hook alone may open 30% in its own plane to fit the square rail; retain all clothing vertices and original files. Support offsets are 3.961 mm for the coat and 6.728 mm for the gi. This supersedes section 35's preservation of the earlier rack dimensions. Inspect unloaded frame anatomy and loaded garment contacts at close range in addition to the room views.


## 37. Bodil Kjær desk and white USM window storage

The owner approved the recommended walnut Bodil Kjær Office Desk and pure-white USM Haller Lowboard combination. The desk follows Cassina/Karakter reference geometry: 180 × 90 × 75.5 cm, an 11.5 cm shallow band containing four flush drawers, recessed pulls on the seated side and a slender brushed stainless frame. Source: https://www.cassina.com/be/en/products/karakter-office-desk.html and the Karakter Office Desk product sheet. Keep the desk pose and existing workstation, monitor arm, clickable accessories and photo; set the floor contact at 0.0185 m and tabletop at 0.7735 m. Adjust accessory heights by 4 mm and narrow the leather desk mat to 168 cm to fit the real desk width. Adapt the monitor clamp opening and rear contact to the deeper drawer band rather than intersecting it.

The window lowboard uses four 750 mm modules, 350 mm depth and height center spacings, 23 mm chrome ball joints and 19 mm chrome tubes, thin white sheet-metal panels, four drop-down door fronts with near-flush round coin locks, and dark leveling feet. Its overall dimensions are 3023 × 373 × 390 mm at [-2.42, 0.0185, 0.55], with the finished top at 0.4085 m. Sources: https://jp.shop.usm.com/collections/lowboard and USM Home Work Beyond product catalog. Lower the anatomy model and workshop objects to the new top and retarget anatomy close-up; retain their scale and interactions. Existing bookcases remain pending the owner's separate Vitsœ 606 selection. This supersedes section 35's preservation of desk and cabinet dimensions. The free camera's maximum distance becomes 15 m to accommodate the full portrait overview; close zoom remains unchanged.

### Wider wardrobe and physician identity

The owner requested the wider HAY Loop Stand Wardrobe: 130 × 60 × 150 cm, retaining the white 3 cm square steel frame and three legs. Rotate the frame 180 degrees and space the garments 60 cm apart, with the gi toward the window and the physician coat toward the surfboard; keep garment fronts facing the room and their original 90 cm scale. Move the rack 20 cm toward the window to clear the surfboard. This supersedes the narrow Hall specification above. Fit the official Davos Hospital circular emblem to the coat's wearer-left upper sleeve as a matte, surface-following decal; provenance is recorded with the image. A single coat click opens https://www.davoshospital.co.kr/ in a new tab, with an equivalent keyboard-accessible link. The Royal System selection and final TV-wall arrangement are recorded below.


## 38. Workstation set back

The owner asked for the desk and chair to move back together so they occupy less of the room center. Translate their world Z positions by -0.40 m toward the chair-back/cutaway edge, leaving their relative spacing unchanged: desk [-0.05, 0, -1.50], chair [-0.20, 0.035, -2.59]. Move the world-placed monitor and folio, their focused cameras, the Mac mini/photo focus targets, and both guided desk cameras by the same amount. Preserve 9ft6 board and rack placements, verify chair clearance within the room edge and ensure all workstation contents remain usable.


## 39. Seamless warm greige microcement

The owner approved removing the rug and using a light warm grey with a little beige, almost matte. Keep the existing floor plane/finished height 0.0185 m and room footprint; no grout lines, large mottles or concrete cracks. Use INTERIOR.microcement (#D5D2CA), roughness 0.86 and a single subtle, non-repeating procedural surface map with very shallow bump. Walls stay lighter/warmer. Remove rug geometry/material loads and lower the sofa, lounge/ottoman, coffee table and office chair by 16.5 mm to the finished floor. Preserve their material colors, particularly the current light-wood Noguchi base; black was discussed only, not selected.


## 40. Connected Royal-inspired TV wall

Replace the closed bookcases with light-wood wall rails and shelves inspired by Poul Cadovius's Royal System. Each side is now one generous custom 1.12 m bay centered at X ±1.72 m, leaving 36 cm between the TV edge and inner rail. These side widths are a visual customization, not official dk3 80 cm modules. Use four left shelves, three right shelves, one drawer cabinet and one sliding-door cabinet, with two custom 1.16 m open shelves joining the inner cabinet edges beneath the TV with 6 mm construction seams. Keep the lower top at 0.82 m and the award shelf at 1.3025 m. The centered award pose [1.72, 1.3025, 3.09] leaves about 89 mm in front and 93 mm behind its full body and support footprint.

The TV and clock are raised 25 cm: centers 1.90 m and 2.68 m. Desktop/mobile Talks cameras follow. A single short central rail ends at 0.996 m, just above the shelf hangers, while the side inner rails are shared. The old TV mouldings and invented oak backing/upper shelf behind the garment rack are removed. Reference: https://dk3.dk/royal_system_kollektion.

## 41. Surface double-click navigation

A primary unmodified desktop double-click on a visible scene surface approaches that hit along the viewing ray. A second double-click restores the previous camera and target. Selecting an exhibit or guided view cancels temporary inspection. Briefly arbitrate single-click actions to prevent a double-click also opening a reader, photo, hospital or YouTube link. Preserve orbit, pan, wheel zoom, touch drag/pinch and keyboard alternatives. Explain the gesture in the discreet Controls help.

## 42. Bare desk and coordinated light wood

Remove the leather desk mat and ground the keyboard, MX Master 4 and Mac mini on the tabletop at 0.7735 m. The owner's final preference supersedes the earlier dark walnut trial: use a slightly deeper beige wood target (#B6A184), coordinated with the existing Noguchi and Eames wood. Desk and Royal shelf textures have different source colors, so compensate their material tints separately while preserving grain, roughness and normal maps. The planter stand follows the same light-wood target. Keep the Bodil geometry and brushed steel frame.

Restore the previous monitor and monitor arm after the stand display trial. Preserve the CV texture and reader, and return the Mac mini to its former position. Mobile guided-view buttons sit 36 CSS pixels higher to clear the collection swipe hint.

Seat the MX Master thumb wheel in a real aperture through its side shell and thumb shelf, with an integrated grey rim and an 18-degree axle. Only about 1.9 mm of the roller arc projects from the housing. Keep the original mouse silhouette, scale and interaction; this remains a reference-based reconstruction rather than official CAD.

## 43. Garments, window and raised USM

Replace the standalone HAY frame with a 130 cm wall-mounted wardrobe and shelving system coordinated with the Royal TV wall. Two 34 × 19 mm wood uprights have real 40 mm wall standoffs; thin shelves at local heights 1.80 and 2.15 m use stainless tension brackets. Keep the clothes rail at its existing 1.485 m center height so the garment hooks remain seated. The shelving ends 150 mm before the window and clears the board. This is a Royal-inspired custom configuration, not an official product module.

The gi is on the surfboard side and the physician coat on the window side; reverse both garments' facing directions so the real Davos Hospital left-sleeve emblem is exposed. The coat opens the hospital website, with an accessible link alternative. Preserve the original gi, including its belt and fabric details, except for directly correcting the final sleeve letter from N to A. Keep U and S unchanged. The owner rejected an added sleeve patch and belt repair: the correction must be part of the original model's surface, with no rectangular panel, floating decal or separate material.

The BJJ focus cameras approach from the room side of the turned garment, keeping its front belt and wearer-left sleeve visible.

Split the existing window opening into two broad panes using one central mullion. Preserve the opening dimensions and curtains. Raise the single-tier USM lowboard to 55 cm overall with 19 mm chrome legs, short leveling stems and dark glides. Move objects on its top upward by the same 16 cm. Keep the room dimensions unchanged.

## 44. Textured indoor palm

Use AllQuad's textured Dypsis lutescens foliage, licensed CC BY 4.0, replacing the initial procedural approximation. Remove the original pot and fit the foliage to the authored white cylinder and light-wood stand, about 2.05 m overall. The model uses photographic leaf color/normal/roughness maps with alpha-tested depth-writing foliage, four total draws and about 25k triangles including the planter. Local files, original attribution and pinned redistribution source are under public/models/plant-dypsis; credit the artist on /credits. World position [-1.90, 0.0185, 2.32] clears walls and furniture.

## 45. Physical supports and glass

Tilt the actual 9 ft 6 in longboard toward the left wall with X rotation -0.12 and origin X -2.382 m; retain floor cradle contact and about 25 mm hull clearance from the wall. The photo frame has a connected hinge, broad rear easel and grounded rubber foot; both the frame's lower edge and the rear foot meet the desk.

The KOSESS award's single silver rear prop follows the supplied rear photographs: approximately 7 mm diameter, dense longitudinal grooves, a black collar, rounded metal tip and socket attachment. Preserve the rough satin plaque and continuous mirror-badge hover glow. Ground the support from its actual vertices and center the complete footprint on the shelf.

The Noguchi tabletop uses a continuous reflective dielectric face with angle-dependent opacity, visible front thickness and front-sided edge geometry so the rear rim no longer reads as an equally dark outline. This is a lightweight glass approximation without a transmission framebuffer; retain existing real table geometry and pale wood.

## 46. Clear navigation and lower evening light

Place the office title, guided-view buttons and collection footer in one bottom flow layout. The title row stays above the collection as its height changes across viewport widths, with the mobile swipe hint taking its own space. Retain the original links, keyboard controls and selected-object behavior.

Keep the beige material palette and reduce the lights that washed out every surface. Sky fill now fades with sun altitude from -6 to 32 degrees; lower the constant environment, ambient, hemisphere and frontal-fill floors. The overhead light is a modest warm pool rather than an increasingly bright white flood at night. Preserve local time, solar position, daylight/evening previews, the window sky and cached shadows. Verify noon, dusk and night separately so evening retains legible objects with lower overall brightness.

## 47. Paper, screens and luminous clock numerals

The research folio's printed cover and every paper face use rough, non-emissive materials that receive the room's light and shadows. Preserve the actual publication textures and physical page-turn interaction. Do not use unlit materials or a fixed night tint to simulate paper.

The wall TV has a self-lit image at all times, with a modest brightness increase while hovered and no movement. Its frame remains physical. The calendar clock's white numerals and colon remain readable at night; only the glyph mask emits light, while the dark flip cards and case continue to respond to the room illumination. Keep the live clock, flip animation and reduced-motion behavior.

## 48. Light for reading and working

Place an AJ-inspired floor lamp beside the Eames lounge and a matching small task lamp on the free window-side corner of the desk. Use the official Louis Poulsen AJ proportions as a construction reference: the floor version is 1.30 m high with a 275 mm base and 325 mm shade. These are editable reconstructions, not official CAD. Keep their angled stems, asymmetric downward shades, white reflectors and slender dark bases. The fixture and its actual light source share one local placement.

LIGHTING tokens: matte finish #30332E, reflector #F4EBDD, reading/task warm light #FFD29A, strip amber #FFB96C, strip warm-white #FFE2B9, cable #262925. Hide two adjacent warm segments behind the central lower Royal shelf so their light blends on the wall; no purple or animated rainbow. Retain physical light response rather than pasted glow cards. A low overhead fill, localized shadowed reading/task pools and the shelf wall wash replace the old dominant ceiling flood. Existing sunset/local-time and daylight/evening controls power these fixtures, leaving daylight unlit and making them prominent after sunset. Preserve the dark night ambience, non-emissive paper, luminous TV and clock, and all furniture/content interactions. No bloom pass or new dependency.

Verify overview, reading and desk close views in daylight and night, the actual light-mode control, and mobile/tablet framing. Check fixture contacts/clearance and cached shadow behavior. Official construction reference: https://www.louispoulsen.com/api/downloadcenter/download?id=AJ+Floor+Lamp-90328+Cut+Sheet.pdf&overridelanguage=en-US&type=cutsheetpdf

## 49. Roller blinds, uncluttered desk and river outlook

Replace both full-height gathered curtains and their projecting rod with two slim off-white roller blinds, one per broad window pane. Keep the existing two-pane opening, bronze frames, room footprint and furniture positions. Use INTERIOR.ivory for the rounded 80 mm head cassettes and fine matte textile, PALETTE.aluminiumEdge for concealed fittings. Set modest fabric drops of 0.27 and 0.39 m so the horizontal hem bars and actual fabric surfaces are visible while most of the view stays open. Flat woven fabric and grounded cassette/end fittings replace the folded curtain geometry; no new decorative animation or UI control.

Remove the AJ desk lamp and its light source. Retain the lounge floor lamp and concealed warm shelf wash. A monitor-mounted light bar is pending the owner's explicit product confirmation; do not mount a substitute in the interim. The proposed BenQ ScreenBar Halo 2 follows the official 50 cm dark-grey bar, central clamp, front/back light and wireless dial, but remains a proposal until confirmed.

The owner requested GD's Han River view as the exterior reference. A verified publicly released image shows sunset; the exact intended night reference remains to be confirmed. Do not represent a generic or reconstructed panorama as a photograph from his home. Keep any exact residence address or inferred location out of the product and documentation. The finished backdrop must read as distant scenery through the window during camera orbit, not a close poster attached to the glass; preserve local-time lighting and daylight readability.

## 50. BenQ ScreenBar Halo 2

The owner approved the BenQ ScreenBar Halo 2 on 2026-09-07, superseding the pending proposal in section 49. Reconstruct the approved device as editable local geometry from the official Korean overview and specification pages: a 500 mm dark-grey aluminium cylindrical horizontal bar, a central rubber-lined top clamp with rear counterweight, an asymmetric front source, a separate rear diffuse source, and a 74 mm diameter wireless dial approximately 39.5 mm tall. Mount the bar on the monitor bezel without covering the screen or a potential central camera, preserve the articulated monitor arm and CV texture, and route a small rear cable through the monitor's existing cable-management side.

Follow the official Halo 2 front-light coverage image: a broad lateral ellipse covering the keyboard and mouse, with gradual falloff, not a small circular spotlight. Approximate the 500 mm linear source with two overlapping, shadow-casting emitters and a shared anisotropic beam map; this is a visual reconstruction, not a calibrated 500-lux simulation. Use the warm-white light token, with restrained highlights that extend along the bar. Keep occlusion behind desktop objects and avoid light leaking through the desktop. The rear fill remains local because the monitor is freestanding, not next to a wall. Both sources follow `sun.lamp`, including unlit front diffuser in daylight. Preserve the monitor's self-lit CV, floor AJ lamp, warm shelf wash, and cached shadow renderer; no desk AJ lamp, bloom or artificial glow cards.

The wireless controller has a 74 mm round footprint, a flat rubber base, and a 10-degree sloped circular digital face directed toward the seated user. Its 39.5 mm specification is the maximum rear height, not a full-height vertical can with a flat rectangular display. Use dark-grey metal, a distinct dial ring, recessed round glass and a subdued transparent readout.

Reference: https://www.benq.com/en-us/lighting/monitor-light/screenbar-halo-2.html (front-light-cover-v3 and effortless-precision images, inspected 2026-09-07).

## 51. Surface-aware exploration and quiet navigation

Wheel and desktop trackpad pinch approach the visible surface beneath the pointer rather than stopping at an empty orbit center. Normalize wheel pixel/line/page units, retain proportional pinch input, and preserve the view direction while updating the orbit depth from the surface. Keep physical near limits (0.10 m free, 0.08 m selected), bounded retreat, selected-reader view offsets, double-click inspection/return, and all single-click arbitration. A camera control must never change page zoom. Right-drag or Shift-drag pans; arrow keys pan, plus/minus zoom, plus/minus zoom, and Overview restores the room. Touch continues to orbit with one finger and pan/pinch with two.

Replace the broad opaque navigation slabs with restrained floating surfaces. Reuse the room's warm neutral/day-night tokens: approximately 70% surface opacity, 4–6 px backdrop blur, subtle 1 px borders, 12–16 px corners, and a compact 56–64 px collection dock bounded near 900 px on desktop. Keep all seven destinations, 44 px touch targets and horizontal collection overflow on narrow screens. Place the small controls hint at the upper-left below the identity instead of over the central desk or the office title. It closes when exploration begins or after seven seconds and remains manually accessible. Preserve the office title and a clear central view at desktop, tablet and phone widths; no full-screen tint or modal backdrop. Use existing 180 ms color/opacity motion and reduced-motion override. These are refinements of existing controls, without a new animation library.

## 52. Palladiom shades and room controls

The owner approved Lutron Palladiom on 2026-09-08. Reconstruct exposed satin-nickel roller hardware, rounded solid-metal end brackets, a roll of warm-greige woven cloth and a slim curved hembar. Retain the two-pane window and opening; both shades travel together from fully raised to closed. Initial lift is 82 percent. Animate actual roll, fabric length and hembar position with interruptible motion; reduced motion snaps to the requested position. Refresh cached shadows during travel. References: https://www.lutron.com/us/en/window-treatments/palladiom and https://residential.lutron.com/sites/residential/files/images/features-bracket-enclosures_950x770_1x.jpg (viewed 2026-09-08).

A small Room button next to Overview opens a nonmodal settings popover, max 280 px, using the translucent surface/border/radius tokens above. Provide labeled Raise/Lower buttons, a 0–100 percent shade slider, and an accessible room-light switch. Manual light on/off is independent of the daylight/evening preview and has a Use local light reset. Switch all artificial room lamps, shelf strips and Halo emitters/diffusers together; preserve ambient outdoor light and the luminous TV/monitor/clock. Do not add GPU lights. The proposed FLOS/GUBI floor-light replacement is still awaiting product selection; keep the AJ fixture in this release.

### Independent Halo and dimming refinement

The owner's subsequent request separates Halo controls from the room lamps: Room brightness (0–100 percent) controls ceiling fill, reading lamp and shelf wash; Halo power/brightness (0–100 percent) and color temperature (2700–6500 K) act independently. Both initially follow local lighting, with manual overrides after interaction. Move the wireless dial to desk-local [0.74, desktop height, -0.29], clear of the keyboard, keeping its complete footprint on the tabletop. Its live OLED reports effective output, setting and temperature/off state, and clicking it opens the accessible Room control panel focused on Halo brightness. Preserve orbit drag and double-click arbitration. Temperature color is a restrained visual approximation, not a calibrated photometric simulation.

## 53. Reference-based Galleria Foret outlook

Use the publicly documented Galleria Foret river/Seoul Forest outlook as composition reference. Verified sources: https://www.hwenc.com/majorprojects/galleria-foret.do, https://www.haeahn.com/ko/project/detail.do?prjctSeq=715 and the public view image https://galleriaforet.hnchouse.com/assets/view.jpg. The viewed image has near forest, a left glazed tower and city blocks, river and low bridge on the right, and a distant mountain ridge. Create original photographic-style reconstruction assets with a matching day/night composition. Do not identify it as GD's photograph, an exact apartment view, or a surveyed 360-degree scene. Record generation provenance and source limits with assets and on scene credits.

Place the image far outside the window, with wide angular coverage. Clip backdrop fragments to the real window aperture along the camera ray so no giant scenery rectangle is exposed around the cutaway room. Preserve the window frame and roller shades; do not use a close opaque poster at the glass or add lights. Backdrop geometry is excluded from picking. Retain day/night transitions and reduced motion.

The river backdrop uses angular panorama UVs over a distant portal mesh so oblique mobile views remain covered. Its render depth is pinned behind the room, beyond the near furniture but within camera clip space. The central window framing favors the river and bridges; the generated panorama is not a surveyed 360-degree capture. On small screens the first-use gesture hint sits below the time readout, and the bottom collection constrains its grid width before scrolling.

## 54. Open Han River composition correction

The owner rejected the Galleria Foret reconstruction because the default window read as an apartment view. Replace it with a Yeouido / 63 Sky Art inspired open-river outlook, using the personally inspected reference https://yakei.jp/en/spot.php?i=63build (63build2.jpg) and Seoul Institute's https://data.si.re.kr/photo/03u88061ba3si0. The success criterion is the actual default room window: uninterrupted water spans both panes and dominates the view, not a river hidden at one edge or only visible after approaching the window. The photographic composition must reserve its lower 55–65% for open water across the full width, a slim distant bank/skyline, and a low long bridge crossing part of the water diagonally. No foreground apartment towers, forest, roads, or roofs. Keep recognizable river breadth, restrained night reflections and a matching daylight view. Record images as reference-based reconstructions, not private apartment photography.

Preserve existing room geometry, lights, shades, camera gestures and all controls. Keep portal clipping, angular view response, back-of-room exclusion and background raycast exclusion. Validate default desktop 1280 and phone375 first, then768, front window, rotated window, day/night and lowered shades. The default view must pass water-dominance visual review; isolated panorama quality and shader success are insufficient.

Use the existing 760px compact-camera boundary for backdrop framing as well. Calibrated panorama reference origins place the far bank near the top of the default window and keep the diagonal bridge in view on both overview cameras: desktop `(0, -7.8, windowCenterZ + 18)`, compact `(0, -12, windowCenterZ + 46)`. This changes only the distant panorama framing; it does not move the room camera or window. Keep water dominant below a narrow distant bank, avoiding a featureless water-only crop.

## 55. Rendered outdoor scene, replacing photographic enlargement

The owner rejected the photographic panorama's softness and its mismatch with the rendered room. The accepted direction is now an actual rendered exterior: broad three-dimensional river surface, a slender concrete bridge with piers and warm lamps, and layered distant Seoul-inspired buildings and hills, composed from the inspected Yeouido references. Do not enlarge a bitmap skyline. Geometry must remain sharp when approaching the window, perspective must follow the room camera, and water must show light reflections with subtle surface movement. This is a reference-informed visual reconstruction rather than a surveyed replica.

Render the exterior in a separate Three.js scene with a long camera range, then composite its full-resolution render through the existing world-space window aperture. This keeps exterior geometry out of the cutaway room and out of object picking while preserving real perspective, depth and day/night light response. Match the room renderer's tone mapping; use restrained cool daylight and warm small night lights, no neon. Reuse the same camera projection and view offset. Restore all renderer state after the outdoor pass; dispose render targets, meshes and materials. Use instanced structures, a bounded reflection target and reduced-motion-aware demand frames. Validate default and close-up views equally, plus shade coverage, room controls, small screens and no geometry escaping the portal.

The exterior pass uses the drawing-buffer resolution with HDR storage and two-sample antialiasing, with tone mapping performed once at the window composite. Reflections use a bounded 1024 target. The outdoor camera has a 340m visual elevation offset; the compact overview blends toward 620m over a 4–12 room-unit viewing distance, then returns smoothly to the close-view elevation. This is deliberate diorama framing, not a literal apartment survey. Four rows of instanced facade buildings form a low, dense far-bank ribbon, with antialiased procedural windows. The photographic experiments in §53–54 are superseded by this section.

## 56. Local controls, reference lighting and arrangement

The 2026-09-08 nine-item brief supersedes the master Room controller and AJ fixture in section 52. Room lighting opens from the physical wall switch; blinds open from a window-side button; the Halo dial opens only its own panel. Keep these nonmodal panels small and preserve the visible room. Retain independent day/evening/local preview. Warm, Bright, Relax, Night colorful and Fairfax are custom visual palettes: amber/cream, neutral warm-white, low amber, coral/teal and muted honey/sage respectively. No purple. Room and Halo remain individually adjustable after applying a preset.

Use a reference-modelled Mantis BS1 B in satin black, with its 290 mm circular base behind the sofa and arm reaching toward the seating area. This replaces the shorter-reach AJ. Add one black Philips Hue Signe gradient floor light in the window/TV corner, plus a concealed strip below the USM lowboard. Keep the existing TV-shelf strip. Move the palm clear of the Signe. These are visual lighting approximations, not calibrated photometric simulations.

The wall TV has a 1.882 × 1.059 m image, approximately 85 inches diagonal; the previous image was about 71 inches. Spread side bays outward with a connected lower shelf and preserve the raised clock. Use one continuous outside-mounted Palladiom shade spanning the two window panes, extending 8 cm beyond each side and below the aperture, mounted above the frame. Keep interruptible lift, full close and reduced-motion behavior.

Replace the standalone rack with an original reconstruction of a 120 cm String System wardrobe: three white wire panels, two 58 cm bays, shelves and hanging rods, with restrained oak top shelves. Preserve the original garment geometry, orientation and hospital link. Center the monitor screen and keyboard on the desk; the arm clamp remains offset. Keep the monitor, accessories and folio together when the desk moves.

Arrange is an explicit, separate mode. Freeze camera navigation and exhibit activation during editing; show one draggable handle per movable group and provide keyboard-accessible 10 cm movement/15 degree rotation buttons. Support desk, desk chair, sofa, coffee table, Eames with ottoman, palm, Mantis and Signe. Done saves locally on this device; Cancel/Escape restores the pre-edit layout; Reset item/all restores the designed positions. Restrict placement at room edges; do not claim automatic furniture-to-furniture collision detection. Fixed wall/window/storage systems remain fixed. Focused desk content follows the saved desk transform.

For the exterior, preserve river/bridge composition while using established Three.js atmospheric scattering and normal-sampled Fresnel water, with a restrained textured shore and detailed bridge deck. Keep provenance and licenses with external assets. This is still a Seoul-inspired visual approximation, not an exact residence view or a downloaded complete Han River survey.

## 57. Stable rendering and physical controls

Keep drawing resolution stable during exploration: cap desktop DPR at 1.25 and compact DPR at 1, without an FPS feedback loop resizing the room and exterior render targets. Camera navigation remains independent of rendering resolution. Verify idle camera, projection, viewport and drawing-buffer stability, then orbit/zoom and restore.

Use a Samsung 98-inch wall TV with a 16:9 image (2.17 × 1.22 m) and a restrained dark thin bezel. Keep the 2.7 m opening between shelving uprights. Continue the concealed horizontal shelf strip across the full 4.8 m storage run, and add a separate four-edge lightstrip behind the TV which washes the wall; neither light faces the viewer. All strips follow the existing room power, brightness and palettes.

Place Mantis beside the recliner, with its shade and light target over the reading seat. Move the palm to the open side of the sofa, clear of the reading pool and window/TV sightline. Update arrangement origins with these designed positions.

Restore two outside-mounted Palladiom shades, one per window pane, with a narrow central seam on the mullion and outer overlap. Each shade has independent press-and-hold raise/lower arrows, with release/cancel/blur stopping travel, plus a separate Open fully and Close fully pair beneath each side. Each full-travel key changes only its own shade. No shade sliders. The hardware uses a shared center bracket rather than two overlapping fittings. Physical wall switches use lit, rough 3D materials, so garments occlude them and they darken with the room. Keep keyboard-accessible equivalents in the Controls guide.

The lower-right controls visually reproduce their own device: a warm ivory dimmer plate for room lighting, a slim Palladiom raise/lower control for shades and a charcoal circular Halo 2 wireless dial. Preserve power/dimming/temperature/lift, presets, keyboard access and a transparent nonmodal backdrop. Use existing warm neutral surface and motion tokens; do not replace the visible room with a large control card.

Arrangement now lasts only for the current visit. Do not read or write visitor layouts in storage; reopening/reloading restores the authored room, and Done applies the temporary arrangement without publishing it. Use the sofa's rectangular, rotated footprint for wall limits so its back can approach the wall without its corners crossing it. Other movement, reset and cancel behavior is preserved.


## 58. Award and shade interaction finish

Hovering any part of the award activates the existing polished-inset shimmer and glow. Preserve the focus-first click flow and restrict the focused YouTube link to the polished inset. Reduced motion keeps a steady glint. Each shade column includes its own 44px-high Open fully and Close fully keys below the hold arrows and position readout; retain the warm ivory keypad tokens and independent, interruptible travel. No new animation mechanism or timing token.


## 59. Screen hover contrast

TV, monitor and photo frame use the same light-reactive screen material: white MeshStandardMaterial, image as both diffuse and emissive map, roughness 0.4, normal scene tone mapping, idle emission 0.10 and hover emission 0.50. Room daylight, ambient light and actual lamps determine the visible day/night difference. Do not cap daylight with an independent low brightness multiplier or bypass lighting with MeshBasicMaterial. TV hover shares the rear lightstrip signal. Keep object damping 8/second, immediate reduced-motion feedback, and all existing textures, geometry and click behavior.

## 60. Subtle surrounding award warmth

Whole-award hover also adds gentle steady warmth to the satin face (emission 0.045) and edges (0.07), using their existing gold colors. Keep grain and roughness intact and preserve the brighter continuous polished-inset sparkle. Reset body/edge emission to zero on exit; reduced motion retains steady warmth. No geometry movement or new hit regions.

## 61. Beolab 8 stereo pair

Place two Bang & Olufsen Beolab 8 speakers in Natural Aluminium and natural/light oak on the window-side USM. Use the manufacturer's published OBJ planning geometry for the speaker, wooden cover and table stand, converted from millimetres and Z-up into metre-scale, Y-up geometry. Preserve the U-shaped aluminium shell, curved vertical oak slats, dark acoustic backing, top cap and thin oval tabletop foot. The upright tabletop assembly is approximately 0.165 m wide, 0.29 m high and 0.172 m deep. Share the prepared geometry and materials between the two instances; retain the real slat gaps and edge normals while removing concealed duplicate hardware when needed. Use existing aluminium/aluminiumEdge, graphite/rubber and lightWood/oak material tokens with scene lighting and non-emissive surfaces; no new lighting or motion.

Both feet rest on the USM top, inset from its ends, around z=-0.72 and z=1.82, facing into the room with a restrained 0.13-radian inward toe-in. Group the existing workshop objects and spine between them, keeping separate hit areas and the spine camera target aligned with its adjusted position. Leave blinds, window, cabinet dimensions, room lighting and all other furniture unchanged. Speakers are furnishing objects in this iteration: no simulated music player, autoplay, hover motion or new keyboard action. Existing double-click inspection continues to work on the geometry. Desktop, tablet and mobile views must keep cabinet and window readable. Verify daylight/night metal and oak response, foot contact, prop clearance and navigation before completion.

Reference: [B&O Beolab 8 support and 3D drawings](https://support.bang-olufsen.com/hc/en-us/articles/19746053132561-Beolab-8), [official 3D package](https://bangolufsenrmaskillgohel.blob.core.windows.net/zendesk-guide/Manuals_3D/Beolab%208.zip), and the October 2024 product sheet. This is an adaptation of manufacturer planning geometry with locally authored material treatment, not an acoustic simulation.

## 62. Personal awards on the Royal System

Use the owner's 19 multi-angle photographs IMG_0764–IMG_0782 supplied September 8, 2026. Three distinct objects: Hallym Dongtan Sacred Heart Hospital appreciation plaque (January 17, 2025), Seoul National University Hospital neurosurgery merit award (February 28, 2023), and KOMISS lifetime membership No. 180 (April 14, 2023). Preserve source lettering, logos, seal and the Hallym group portrait as artwork; never publish full source photos or their unrelated office/monitor background. Build solid geometry, bevels, side/back surfaces and reference-specific supports rather than billboard photos. The Hallym plaque has reddish figured wood side stiles, a black gold-engraved plate, keyhole/socket details and a ribbed silver rear prop. SNUH uses a wavy black inner face, beveled clear outer glass, and a stepped gold-on-black pedestal. KOMISS uses tapered black polished glass, a clear diagonal band and sculpted gold arch feet.

Photo-derived approximate heights: Hallym 0.255 m, SNUH 0.30 m, KOMISS 0.29 m. No measured-size claim. Local +Z is the front of each model, local Y=0 its bottom. Place Hallym on the left 1.30 m shelf, SNUH and KOMISS together on the left 1.70 m shelf with separate silhouettes and clear margins; retain books, existing KOSESS trophy and ceramics. All bases and rear props sit wholly inside the 0.30 m shelf depth and clear uprights/hangers. Use non-emissive lit ink/metal/wood materials responding to day/night and a restrained physical glass material; no new lights or hover motion. Existing double-click geometry inspection remains available.

## 63. Portrait-led monitor CV

Keep the 2560 × 1440 physical screen texture, existing paper/ink/teal palette and Georgia/Arial type. On its 1920 × 1080 layout grid, reserve the right third for a large portrait, approximately 560 × 747, preserving the source's 3:4 proportions and face. The left area holds name, current role, all three interests and all ten activities in two compact columns. Leave generous separation between text and portrait, and a shared quiet footer. Use “CURRICULUM VITAE / TAKMD” as the screen label. Preserve the full shared CV data, click-through reader without duplicate portrait, screen lighting and hover response; no physical monitor or camera changes.

## 64. A shelf calendar instead of a TV header

Remove the cramped calendar from above the TV. Retain the existing mechanical weekday/day/month and HH:MM cards, actual visitor-local time, reduced motion and subtly luminous numerals. Rehouse it as a compact ivory shelf clock, 0.468 m wide and 0.276 m high, on the right Royal System shelf at 1.82 m. Its center is x=2.08, z=3.104, clear of the books at x=1.58 and the next shelf. Two small rubber feet ground the case, and a rounded back provides tabletop depth. Case #E4E2DA and rim #B9BCB4 sit quietly with ivory furniture; dark cards stay unchanged. This is an adaptation of the existing flip-clock design, not a claim of an exact new product model. Clear the wall above the TV and do not move the TV, shelf, books or ceramics. Preserve the accessible HTML local-time readout and existing double-click inspection.

## 65. Audo Copenhagen Epoch Shelf with Rack 118

Replace the floor-standing wardrobe in the personal corner with the wall-mounted Audo Copenhagen Epoch Shelf with Rack Long in Natural Oak / Fog. The faithful product envelope is W 1.18 × H 0.08 × D 0.204 m: a steam-bent natural-oak-veneer shell around a Fog HPL recessed top ledge, with no legs, cabinet or exposed rail. Keep its eleven individual, concealed natural-oak wooden pegs visible inside the shell under the front edge. Their axes remain horizontal, following the official underside photograph and bottom-view drawing. Mount the rear face on the left wall at x=-2.76; its width runs along room Z from -2.54 to -1.36, clear of the surfboard and window/blinds.

The shelf centre is y=1.80 m (including the room surface offset). The physician coat uses the window-side peg and the gi the surfboard-side peg. Keep their existing garment GLBs, hanger hooks, USA lettering, belt and sleeve emblem; rotate the complete garments so their fronts face the room, and seat their hook crowns at the two authored peg tips. The coat and gi retain their existing click routes. Natural oak remains a lacquered, lit material using the scene oak maps; the recessed Fog HPL is #D4D5CF, matte and non-emissive. This is an accurate simple parametric shell because the official product page exposes the product drawings and 2D/3D download route but no directly usable local CAD asset was obtained.

Reference: [Audo Copenhagen Epoch Shelf with Rack](https://audocph.com/products/epoch-shelf-with-rack), Natural Oak SKU 71005-002287. Official dimensions and construction: 118 × 8 × 20.4 cm, plywood/oak veneer/HPL, recessed top ledge, 11 concealed wooden pegs, designed by Nina Bruun.

## 66. Framed academic credentials above the garments

Use the owner's IMG_0783–0785 photographs supplied September 8: the Korean Spinal Neurosurgery Society permanent-member certificate (March12,2022), Seoul National University Master of Science in Medicine diploma (February26,2018), and KOMISS life-membership certificate No180 (April14,2023). Preserve original document pixels, lettering, signatures, borders and seals; no invented text or credential changes. Extract only the paper inside the existing frame, correcting camera perspective and orientation. Do not publish the surrounding photographed wall. Original photographs remain unchanged.

Place three independent tabletop frames together on the Epoch's recessed upper ledge, with the diploma central and the two membership certificates beside it. Keep each document's portrait/landscape format: frame widths/heights approximately .28×.38m, .30×.41m and .38×.285m, .045m gaps, combined1.05m wide inside the1.18m shelf. Model restrained black bevelled frames following the photographed finish, a substantial backboard, original paper image, subdued clear glazing and unobtrusive rear supports. Ground every frame on the recessed ledge with actual depth within.16m; lean slightly toward the wall and clear the front rim and wall. +Z is each frame's front, Y0 the grounded bottom. No new lighting, emissive paper, bounce or decorative hover. Existing double-click inspection provides closer reading. Keep the garments and their click destinations usable, and preserve original USA/belt/emblem details. Verify day/night, front/angle, all three device layouts and close inspection.

## 67. Only owner-selected shelf contents

Remove all placeholder shelf books and decorative ceramic vases at the owner's request. Empty shelves are intentional space reserved for future owner-supplied books and objects. This supersedes earlier instructions to retain generic books and ceramics in sections62/64. Preserve the functional Research portfolio, living plant/pot, anatomy teaching models, personal photographs, actual awards/credentials, clock and approved furnishings. Do not replace removed fillers with new invented decor.

## 68. Physician coat sleeve emblem visibility
The Davos emblem remains on the wearer-left sleeve (-Z in the source garment), moved from rear-side X=-0.043m to front-side X=0.025m. Its projection faces 30 degrees toward the garment front, conforming to the original mesh. Coat/gi assets, belt, USA patch, and garment arrangement are preserved; the hospital profile destination remains dr_idx=139.

## 69. Certificate reflection cleanup and music corner
The owner rejected visible photographer hands/phone in the glass. Use the reflection-cleaned display textures, with original text, names, dates, seals and signature design checked against the source. The cleaned images are restorations, not archival scans; original source crops stay in private evidence. Physical glazing responds to scene light without baked-in camera reflections.
The owner has now authorized finishing audio and guitar: a natural-oak/silver B&O Beosound Theatre on the TV-under shelf replaces the Beolab8 pair. Fender USA Strat Sienna (maple neck, cream SSS pickguard) on a stand with a black/silver ’65 Deluxe Reverb forms a compact personal music corner. Use real-product reference proportions and materials, preserve existing furniture and content navigation.

## 70. Owner corrections: original emblem and document-only framing
Restore the Davos sleeve decal exactly to the pre-move position [-0.043,0.15,-0.246] and Euler[0.17,PI,0]; the attempted forward projection was rejected. Keep garment and hospital destination intact.
For the three credentials, retain only the document contents from the supplied photographs. Their photographed broad black frames are not the presentation design. Use new slim8mm satin-aluminium frames that match the room's silver hardware, with physically separate paper, mat, glass and backing. Reflection-cleaned document textures are used, never the photographed room, black frame, hand or phone. This supersedes the black frame direction in section66.

## 71. Academic documents on the bookshelves

The owner moved all three document frames off the Epoch shelf. Diploma and KSNS vertical certificate sit on the right upper Royal shelf at y=2.26m, centered x=1.67/2.12m. The horizontal KOMISS certificate sits on the left y=1.30m shelf at x=-2.12m, beside the Hallym plaque. Each frame faces into the room, with its physical easel fully supported within the 30cm shelf depth. The Epoch top stays empty. Slim satin-aluminium frames remain independent 3D objects; current document images are provisional until the owner provides new photographs of the bare paper.

The B&O Beosound Theatre replaces the Beolab8 pair. Its official-OBJ-derived tabletop envelope is 1.222×.197×.157m, positioned [0,.82,3.111], facing world -Z, with feet on the connected under-TV shelf.


## 72. A reference-based Fender music corner

The owner rejected the handmade Stratocaster. Use Anderson Fogaça's existing CC BY 4.0 Fender Stratocaster mesh (Sketchfab d5dac6b9f2964601b07109c78ed9e7cd), preserving the real asymmetric body, pickguard, three single-coil pickups, tuners, strings, frets and hardware. Adapt the source sunburst and dark fingerboard to the owner's Sienna finish and maple/black-dot fingerboard; the owner's series and model year remain unspecified. Retain the original artist attribution and transformation provenance in public/models/fender/SOURCE.md.

The guitar stands alongside a black/silver Fender ’65 Deluxe Reverb, using the actual Fender script wordmark as physical badge geometry. Place the combined music corner at [2.12,.0185,-2.10], facing into the room. Keep the complete instrument and amplifier movable as one item through the existing visitor-only Arrange controls; reload returns to the official layout. No performance video is published, and no new player or automatic sound is added.

## 73. Guitar support and the owner's whisky collection

Fit the guitar stand to the loaded Stratocaster mesh: rear uprights stay behind the body, a foam crossbar meets the back, and two padded cradles support the asymmetric lower body curves. Front stops sit outside the finish. Verify support geometry against actual transformed body triangles and inspect both side and rear views; front-only checks are insufficient.

Populate two available Royal shelves with the owner's ten whisky expressions confirmed in Notion on 2026-09-08. Exclude exhausted stock. Display Ballantine's 30, Ballantine's Limited, Hibiki Master's Select, Yamazaki Distiller's Reserve and LARK Classic Cask Strength on the left top shelf; Bowmore 12, Lagavulin 16, Redbreast 12, Balvenie The Creation of a Classic and Booker's on the right cabinet top. Preserve space around the existing awards, credentials and clock. Build physical bottle forms from product references, with non-emissive labels and materials responsive to room light. Public scene assets contain product identity and reference provenance only; private inventory notes, purchase information and Notion identifiers remain outside the build. No exact Booker's batch or bottle count is implied.

## 74. Calendar clock below the television

Move the existing cream calendar flip clock to the continuous under-TV shelf beside the Beosound Theatre at [0.91,0.9628,3.104], retaining its 0.6 scale and room-facing orientation. Its feet rest at shelf height 0.82m. Leave a clear gap to the soundbar. The upper row displays year, month, day and weekday; the lower row shows hours, minutes and seconds with two steady colons. Keep real device-time updates, restrained luminous numerals and reduced-motion support. This supersedes the previous side-shelf placement.

## 75. Keep shelf collections together

Group the owner's ten whiskies on the negative-X bookcase, five bottles each on the 0.82m cabinet top and 1.30m shelf. Keep their source-derived shapes, labels and lighting unchanged. On the positive-X bookcase, group the three academic documents on the two upper shelves: portrait documents at 2.26m and the horizontal KOMISS certificate at 1.82m. Group awards below them: keep the KOSESS gold trophy centered at 1.3025m, and place the Hallym, SNUH and KOMISS awards together on the 0.82m cabinet top. Preserve the clock/soundbar and the gold trophy's existing focus/hover/link. This supersedes the split contents in sections 62, 71 and 73.

## 76. Whisky on the two highest shelves

Move all ten bottles together to the two highest negative-X shelves, five at 2.401m and five at 2.001m. Lower the second-highest shelf from 2.10m to 2.00m so 35cm bottles clear the top shelf's underside by 3cm, retaining the real bottle proportions. Preserve the shelf footprint, other shelves, all credentials/awards on the opposite bookcase, and the clock below the TV. This placement supersedes section75's lower whisky rows. Bottle realism remains a future refinement; this change only relocates the collection.

## 77. Whisky collection: eight bottles, one shelf

Keep Yamazaki, Hibiki, Ballantine’s 30, Balvenie, Lagavulin, Bowmore, Redbreast and Booker’s together on the highest left shelving bay (Y 2.401). Remove Ballantine’s Limited and LARK from the display. Preserve relative bottle proportions and leave clearance at both ends.

Internet product references establish silhouette, closure and label details. Bottle glass and liquid use scene-lit physical materials; only paper labels are mapped from packshots. Do not project photographed reflections or backgrounds over the body. Hibiki has 24 glass facets and a crystal stopper. Redbreast uses an official 700 ml reference. The cabinet photograph identifies classic cream-label Bowmore 12 and Lagavulin 16; those public product versions replace the newer labels. Bottles alternate slightly front/back within the same shelf. Paper and ink colors are separated in the label shader to remove photographic lighting. Opened neck closures and Hibiki’s low fill reflect the supplied reference. Unverified Booker’s batch information is omitted.


## 78. An expandable favorite-whisky cabinet

This supersedes the owned-inventory / eight-on-one-shelf direction. The user approved a separate glazed cabinet and asked for future collection space and freedom to fit the room rather than copy their cabinet photo. Display six favorites only: Lagavulin 16, Booker's, Ballantine's 30, Hibiki Master's Select, Bowmore 17 White Sands, and current blue-label GlenDronach 18. Redbreast, Yamazaki and Balvenie are absent; Bowmore 12 is replaced.

The owner corrected this to an additional .50m × .46m × 2.12m beige-oak cabinet beside the guitar, not a replacement for the bookcase. Restore the full original Royal System (both bays, rails, cabinets and connected lower shelf), its continuous4.8m lightstrip and the prior Mantis position. Place the cabinet at [2.46,.0185,-3.02], rotation PI/2, facing into the room from the right wall beside the guitar. Preserve bottle scale and derive door/light/hardware offsets from the half-width carcass. The furniture movement clamp includes this initial rotation.

WHISKY_CABINET defines cabinet dimensions, world placement and shelf tops; 18 local slots (3 across × 2 deep × 3 levels) leave clearance for standard bottles up to about130mm wide and380mm high. The initial six occupy two staggered slots per level. Internal wood matches INTERIOR.lightWood; frame bronze#514b40 has a matte-metal finish. Two thin glass doors use restrained reflection (opacity.065), without adding a second refractive layer over bottle transmission. Concealed 2700K-like vertical strips respond to room light power and have a real interior on/off button.

Each door pivots90° independently with intentional damping14/s, settling in about.5sec; front-view Left is local+X. Physical pane/handle clicks and local occluded keyboard buttons share the same state. Suppress camera double-click on physical cabinet controls, reject drag gestures as clicks, and immediately close doors while arranging or when reduced motion is active. The cabinet moves/rotates as one item in the existing visit-only furniture layout; rotated closed bounds including pulls remain within the room. No automatic rotation/pulsing, photo panel bottle bodies, invented filler objects, inventory synchronization or new global controls.

## 79. A4 credentials and award ceremony photograph

The degree and both lifetime membership certificates use actual A4 paper:210×297mm portrait for KSNS/SNU and297×210mm landscape for KOMISS. Add an8mm frame face and4mm mat on each side, so the paper itself remains A4. Group all three on the positive-X bookcase shelf at1.82m, with centers X2.225,1.935,1.5925 and Z3.12; retain support feet, original orientations and document textures. Keep clearance between frames, side rails and the shelf above.

Use the user's IMG_0384.jpg as a full, proportional, non-emissive framed print alongside the KOSESS gold award. Paper width.27m, original3395:2633 aspect, same slim aluminium frame and rear support; center[2.185,1.3025,3.12]. Preserve the trophy's centered pose and hover/focus/link behavior.

## 80. Armagnac and tidy monitor-mount cabling

Add Castarède Bas Armagnac XO20 as the seventh bottle using the supplied IMG_0792 reference: tall tapered neck, clear glass, amber spirit, exposed cork and short ridged black cap. Use a reconstructed cream French label only; do not map the photographed hand, room or reflections onto the body. Visual envelope370mm high and84mm diameter, lower shelf rear-center slot4.

Move the existing Mac mini to desk-local[.005,.7735,-.345], beside the monitor-arm mount. Route display and power cables from actual rear ports through the arm's rear guides and behind the desk edge. Preserve stickers, the Claude photograph easter egg, projects routing and movement with the desk; translate its focus target to world[-.055,.815,-1.155].

## 81. Balanced award pair and ceremony photo viewer

Center the combined trophy and photograph silhouette on the1.05m shelf at X1.875. Translate both objects175mm toward the bay center, preserving their56mm clear gap: trophy X1.70, photo X2.01. Keep sizes, shelf contact, depth, materials and the surrounding certificates unchanged; retarget desktop/mobile trophy focus to its new X.

Clicking the physical photograph opens the existing ivory photo-memory dialog with the full uncropped ceremony image, “Best Shorts Award”, “KOSESS 정기학술대회”, and “2026.08.29 · 서울성모병원”. Date and venue are verified from the owner's Notion event record; the photograph confirms the award name. Reuse the existing dialog sizing, caption hierarchy, backdrop, close button, Escape dismissal, focus return and reduced-motion-safe immediate opening. Preserve the separate 뽐뿌방 afterparty content. Add a keyboard-accessible photo trigger; ignore orbit drags and Arrange-mode activation, and retain double-click inspection. No new motion or surface tokens.

The desk family frame opens the same viewer, using the exact photo selected for this visit; keyboard “Photo frame” uses that same selection. Show “가족과 함께”, with the owner-confirmed “AO Spine Fellowship”, “2025.08.05”, and “Keio University Mita Campus”. Caption metadata is keyed to this specific photo source; future photos must not inherit its date or location. Preserve its physical frame, lighting-aware hover and double-click inspection.

## 82. Personal plaques balance the opposite bookcase

Move the Hallym appreciation plaque, SNUH merit award and KOMISS membership plaque into the negative-X bay, which is the viewer's right when facing the TV. Their centers become X=-1.54,-1.875,-2.21 respectively. Following the owner's height correction, place their bases on the first open shelf at Y=1.3, one tier above the cabinet top, using LEFT_LEVELS[0] as the shared shelf height. Preserve existing depths, face directions, model scale and material details. Retain the asymmetric shelf levels; the next shelf at Y=1.7 leaves clearance above all three plaques. The gold trophy, ceremony photograph and A4 documents stay in the viewer-left bay; no filler objects are added.

## 83. Brighter daylight through the window

Daytime should read as a sunlit interior with soft warm light from the window, clear material colors and gentle shadow contrast. Preserve the existing astronomical sun direction, shadow enclosure, materials, exposure and evening lighting. Add two broad window area lights in warm daylight #FFF5E6, one per roller shade; their height and center follow the uncovered aperture and they turn off when the corresponding shade closes or the sun sets. Increase the daytime environment contribution with the average blind opening, while slightly reducing uniform ambient fill. This approximates indoor sky light and indirect bounce, rather than changing the furniture palette. Capture the fixed environment once; adjust only scene.environmentIntensity as blinds move so their animation does not recapture and filter a cubemap each frame. Validate open/closed and independently operated shades, day/evening, near and wide views, and desktop/mobile composition.

## Visitor count in the public footer

VisitorCount adds a small count beneath the existing footer identity. Use the existing 12px footer typography and muted text token, with tabular numerals and an 8px top gap. Its visible label is visits; the tooltip gives the actual collection start date and explains one count per browser-tab session. No animation or invented historical total. Loading, disabled preview and unavailable API states render no counter; navigation and the rest of the footer remain usable. Test a new tab, refresh, blocked session storage and API failure at 375/768/1280px. Persist only random anonymous tab-session identifiers and the aggregate count in D1; neither IP nor user-agent enters the application counter. Static assets stay outside the function routes.

## 84. Matching electronic photo frames and in-room inspection

The desk family frame and shelf KOSESS ceremony photograph share the desk's existing electronic-frame construction: graphite #30332F enclosure, #151815 inset bezel, slim 18mm depth, softly rounded 2.5mm edge, 0.16rad backward lean and hinged rear support. Preserve the desk's 246×190mm envelope and the shelf photograph's 294×233.4mm envelope and placements. Fit each original photograph proportionally within the screen; never crop, replace or change the source photo. Credentials remain printed documents.

Both screens use the existing scene-lit mapped material, roughness0.4 and white mapped emission0.1 at rest. Daylight remains brighter and evening darker in response to room illumination. Hover or selection smoothly raises mapped emission to0.5 at the existing damping8/s. A selected frame stays bright after the pointer leaves; after closing it returns to0.1 unless still hovered. Reduced motion applies the same values immediately. No enlargement, oscillation or room-level glow is added on hover. This shared primitive supersedes the shelf photograph's printed material in section79.

A single click approaches the physical frame, leaving its visible bezel and support in the office, with a nonmodal ivory information card alongside. This replaces the two frame-to-raw-photo dialogs in section81. The original photograph's title, occasion, date and venue stay source-bound: Keio's2025.08.05 fellowship at Mita Campus, and KOSESS's2026.08.29 award at 서울성모병원. Keep the separate Claude sticker / 뽐뿌방 native photo modal unchanged.

While either photo inspector is open, hide the standard global tools as for the other readers so the clock and tool buttons cannot cover the frame on narrow screens. The information card owns its close action; closing restores the tools and the original camera pose.

Use the existing paper, ink, muted, border and typography tokens; card width320px, right inset24px, padding24px, radius12px, title28px, body14px and metadata12px. A 352px camera reservation leaves room for the desktop card. Below760px the card sits16px from the bottom/sides with16px padding, fits its content, and has at most38svh height with its own scroll. Frame focus adapts its field of view to retain the whole physical object above or beside the card. The existing360ms panel entry and camera damping4.5/s apply; reduced motion suppresses entry transforms and camera travel. beui.dev drawer source informs Escape handling and effect cleanup, adapted to a nonmodal inspector without a dimming backdrop. The close button has a44px target; Escape closes the inspector and focus returns to the original trigger. Orbit drags and Arrange mode never activate either frame, and existing double-click inspection remains available. Verify both photographs, daylight/evening hover, physical click, keyboard opening and closing, return camera, and375/768/1280px layouts using fresh browser evidence.

## 85. Mineral surfaces and grounded USM underside light

Keep the floor light warm greige and nearly matte, with a restrained mineral finish rather than a uniform grey fill. Preserve the finished floor height and every furniture contact. Floor color remains the INTERIOR.microcement token; a separate sRGB albedo map supplies low-contrast hand-trowelled variation, while a linear height map adds shallow surface relief. Roughness is 0.92 and bump scale 0.0025 m. Walls remain lighter warm ivory, with a quieter plaster variation, roughness 0.96 and bump scale 0.0012 m. Use two static 512-pixel maps per surface family, generated once and disposed with their owner. Avoid seams, cracks, dark speckles, large stains, glossy cement or animated texture.

The USM light lives in a narrow aluminium channel beneath the raised lowboard, centered in its depth and inset 65 mm from each end. Its 14 mm diffusing face emits downward from the same place as the rectangular area light; the beam spreads along the floor directly beneath the cabinet and reaches the rear wall, rather than aiming toward an isolated patch in front. A single low-intensity upward area light models the first floor bounce onto the underside and legs. This is a bounded indirect-light approximation in a renderer without global illumination; it uses no glow cards, bloom, new shadows or point-light array. Both sources and the diffuser follow the existing room power, brightness and palette, including fully off. Preserve independent Halo controls, shelf/TV lighting and night presets.

References: Philips Hue under-cabinet installation guidance (https://www.philips-hue.com/en-us/explore-hue/blog/under-cabinet-lighting) and Three.js RectAreaLight documentation (https://threejs.org/docs/pages/RectAreaLight.html), inspected 2026-09-09. The physical reconstruction is not an official USM lighting product or a calibrated lighting calculation. Verify night at lowboard level, daylight wide/close mineral surfaces, and room lighting off independently of Halo before approval.

## 86. Office entry, sharing and presentation screen

Use photographs captured directly from the current 3D office as the first HTML-rendered loading view and1200×630 JPEG sharing card. Desktop/mobile and day/night posters preserve actual office framing and materials; no synthetic substitute room. Poster is inert, with a small translucent status and CV button below the room, and fades450ms only after a rendered frame. The CV button opens the existing monitor reader on this page while scene loading continues; Close returns without a document navigation. Failure retains the still and the same independently loaded profile reader; reduced motion removes the fade. Serve modest WebP posters at high fetch priority and a versioned share-image filename.

The TV uses a1200px left document region and400px right slide rail on its1600×900 texture. Preserve complete slide content/aspect ratio and align its left edge. Right rail shows up to3 actual available deck thumbnails; a deck with only one supplied slide shows other real talks under More talks. No fabricated slides. Keep the TV's scene-lit brightness, hover emission and content-colored backlight. Connect adds the existing public email address, including the footer.

## Personal library from the September 9 book photographs

Use the seven individually documented physical volumes in IMG_0800–0838; IMG_0839 establishes the original printed spines and relative heights/thicknesses. Preserve all text and cover illustration through source-photo UV mapping, never reconstructed lettering or generated cover art. Cropped derivatives contain original photographed pixels; projective UV coordinates select only the book/page quadrilateral. Public texture metadata excludes private Dropbox paths. Seven volumes stand on the empty negative-X Royal shelf at top2.0m; credentials and awards retain their positions. Approximate volumes range195–286mm high and19–38mm thick, inferred from the shared shelf reference rather than claimed measured dimensions. Book structures include covers, binding, paper blocks and a hinged front board; they are not flat image cutouts.

Book selection uses the existing Interactive single-click/drag distinction, shared selected exhibit, CameraRig focus/return, damping8/s and reduced-motion path. The selected volume first clears the shelf, rotates into a reading pose centered[-1.875,2.15,2.62], then opens when a supplied inner page exists. Closing reverses to its exact shelf slot. One reader provides labelled native book/page buttons, Escape dismissal and the existing photo-info surface tokens. Preserve typography and allow manual orbit/zoom. The beui.dev drawer source informs scoped Escape/focus behavior; the physical book extraction and cover hinge are scene-specific motion primitives.

Only two books have photographed interiors: Kim Dong-gyu's woodpecker volume contains the signed2026.9.8 yellow endpaper; CSRS2022 contains the highlighted program page11 and matching Paper23 podium abstract pages86–87. Other volumes remain closed at their real cover, with no invented interior. All seven printed spines share one56.6KB image on initial load. Cover/back/inner images mount only after that volume is selected, with no eager preload of the1.92MB detail collection. Binding colors(#d6c8ac,#173d63,#eee9df,#e5ded1,#e8e0cd,#e5e6d8), paper color(#e6dfcf) and yellow endpaper(#d5cd29) are approximate photographed material colors, lit by the existing scene; no new lights or glow.

## 87. TV slide and event-photo records

The physical wall TV uses a left main image and a right rail of up to three real thumbnails. The rail follows the current page, including the first and last pages, and its physical targets share the reader's page state. Camera fitting keeps the entire television beside the reader. A selected TV or monitor stays at the same illuminated level as hover until the inspector closes; the TV rear strip also retains its active boost.

`TVPDF_*.pdf` means a curated full slide deck; `TVIMG/` inside a dated event folder means an event photo record. Photos preserve framing and orientation, with event/date/role details beneath the main photo. Faculty participation is explicit metadata for Spine Summit, not an inferred role for every photo event. The full-size assets load when selected; compact thumbnails fill the rail. Originals remain in Dropbox, and imports do not run as a background watcher.

The actual rendered office supplies the immediate SSR loading still and versioned social image. A failed 3D chunk keeps the still and the independently loaded profile reader button. Scene geometry and source photographs are retained; six GLBs use lossless compression and the Banpo loader starts only after React commits.

## 88. Read inside the wall TV

Education selection now approaches the actual wall-mounted TV head-on. The existing physical bezel, rear light and surrounding room stay visible; no education reading dialog or second image viewer opens. Camera motion uses the existing 4.5/s damping and restores the saved room pose on close. Lock room orbit while reading; resize/orientation refits the whole TV with 16px side clearance and 64px vertical clearance. Reduced motion jumps directly. Other object readers retain their behavior.

The sharp screen is a DOM surface registered to the TV screen plane with perspective-correct transforms, using existing approved 3840px slide derivatives and the same four privacy exclusions. Load only the selected full image; keep adjacent thumbnails small. A 75/25 slide/thumbnail composition continues the idle TV layout. At screen widths below560px, the rail is a toggle so the image gets the available width. Preserve full image aspect ratio. Two44px native arrow targets sit at the left and right edges of the main slide, vertically centered; the bottom strip provides the page count; on narrow screens a44px right-hand strip preserves image height, with the page count doubling as the thumbnail toggle;44px event/return controls sit immediately above the physical bezel. In short landscape viewports below560px high, those controls move inside the top of the TV and the camera uses16px vertical clearance to maximize the television. Use existing paper, ink, night-bg and line tokens,12/14px type and4/8/12px spacing. Controls are native buttons/selects, with disabled ends, keyboard arrows, Home/End, Escape and focus restoration. Back dismissal removes the viewer state without leaving the office. The beui.dev drawer source informed Escape/scroll cleanup; perspective registration and camera interpolation are scene-specific.

## 89. CSRS paperback inspection

The shelf and open-book stages share one same-URL history entry. Browser Back dismisses this reading session; Close and Escape consume that entry once. Book/page changes do not add history entries, and dismissal restores the prior URL and room pose.

A distant personal-book click approaches the shelf before extracting anything. Inspect the seven spines from[-1.875,2.12,2.35], facing their center[-1.875,2.145,3.004]; a subsequent individual click within1.2m opens that volume. The existing reader also lists the seven books with native buttons, enabled once the camera is close. If the visitor moves away, another click approaches again. Close and Escape restore the saved room view from either stage. Reading retains the standing pose below.

On a selected book, click the front cover or right page to advance through its supplied views; click the left page or inside cover to return, including to the closed cover. Clamp at the cover and last supplied view. Cover-only books stay at their actual cover. Native page buttons remain available. Primary mouse/touch taps use the research folio's5px drag threshold and shared320ms single-action delay; modifier keys, secondary pointers, drags and double clicks do not turn a page. No extra gesture intercepts other scene objects.

The CSRS proceedings use a0.5mm paperback cover rather than a thick hard board. Two curved physical page packets meet at one continuous binding; the split corresponds to the program near the front or Paper23 on page86 farther into the book. Retain restrained gutter curvature, page-edge thickness and contact shading under the existing room lighting. Calibrate the four flat PDF surfaces to a matte warm-paper albedo (#b8b4ab), so the daytime tone mapping does not bleach the fine print; the pages still darken with the room and have no emission. The official CSRS2022 abstract PDF (https://www.csrs.org/UserFiles/am22-abs-bk-v5-HIRES.pdf) was matched to the supplied physical book: cover, printed11 and86–87. Render those flat original pages at2000px height before applying the model’s restrained curvature; preserve the user’s photographed yellow name highlight. This replaces the warped-photo texture and recovers the text hidden at the photographed gutter without inventing lettering. Other books retain their supplied photographic sources. Never paint a paper page onto the inside cover or fabricate missing page text. First pull clear of the shelf, then lower the book to1.25m with a35–40° backward lean, read from a1.64m eye height approximately0.28m in front (about0.48m eye-to-page distance). This is a standing175cm visitor pose, not a vertical display; preserve its original shelf return slot. Only while a personal book is selected, render at up to DPR2 so fine print is retained; restore the normal room pixel budget on close. Version the four replaced texture URLs to invalidate cached photographic pages. Root verifies the original PDF pages and the book open in the actual room.

## 90. Consistent screen and collection inspection

A single physical monitor click approaches its actual screen head-on and activates the native reader together, matching the loading CV’s scroll behavior. The active reader accepts wheel and touch scrolling through its scene ancestors and shows a thin scrollbar; there is no separate Read CV details control. Register sharp, scrollable CV DOM to that screen; retain its bezel, arm and room. Fit the monitor with 16px side / 64px vertical clearance, lock room orbit until the native X closes it, and restore the saved room pose. TV also uses the same X affordance. Both have 44px labelled controls, Escape and same-URL browser Back. The loading-poster CV is a separate early entry into the existing CV dialog while the room continues loading; it never leaves or reloads the office. Keep the existing 14px CV type and paper/ink tokens. Mobile landscape may place navigation within the bezel to retain readable screen area.

Double-click on any visible physical room surface, including physical controls and cabinet hardware, approaches that surface. Two stationary touch taps do the same. Cancel the shared delayed single action so a double gesture neither toggles a cabinet nor turns a page. Preserve deliberate reading locks on TV/monitor and object arrangement mode. Initial research folio approach is 22 percent closer along its established sightline, retaining side information clearance.

An open cabinet closes only through its free left outer edge/handle or Close bar; interior shelves, worktop, bottles and glassware are not close targets. Selecting a bottle lifts the original model onto the worktop with the established damped/reduced-motion transition; its information appears in a compact existing photo-info styled card (300px desktop, 16px mobile inset), with 44px return control and source link. Restore its exact shelf pose before closing. Camera inspection uses the same scene camera and returns to the saved view. Restrained warm concealed interior light follows the opening, with stable hollow glass silhouettes and restrained reflections; no glass blink animation or new global illumination. Add concise verified metadata to the personal book reader without increasing its existing reserved space. Original media are unchanged.

Inspection hides the existing room toolbar/title/dock so it cannot cover the bottle information. Bottle information and book metadata keep a sticky close control when their small cards scroll. The mobile folio centers the complete open binder while retaining the closer sightline. Glass is a thin transparent approximation with a restrained Fresnel edge; it intentionally avoids sampling other transparent vessels through a transmission buffer. No claim of full offline optical refraction is made.

The poster CV button becomes operable when the React shell has hydrated, before the 3D models finish loading. Its server-rendered state is disabled so an early click cannot silently disappear before the handler exists.

## 91. Geographic landcover beneath the Han River skyline

Use sourced OpenStreetMap landuse, park and woodland polygons to distinguish built neighborhoods, riverside parks and Namsan on the existing elevation mesh. The inspected Google satellite overview confirms dense mineral-toned neighborhoods, a continuous Namsan green mass and narrow riverbank parks; map imagery remains a private reference, never a scene texture. Retain the established muted mineral, natural green and woodland palette, adding restrained surface variation at physical scales. Preserve polygon holes and the river corridor. Keep existing mapped bridges, traffic, buildings, room camera and water unchanged. Record OSM feature identifiers and the source date alongside the compact geographic data. This pass corrects ground classification, not missing surveyed building geometry or a complete photorealistic skyline.

## 92. One continuous office experience

All owned information opens within the persistent office. The shell owns a single navigation history: approach an object, activate it, read related material, return to the prior object, then the saved room view. Native X and Escape dismiss one level; browser Back restores the same office state without reloading the document. Internal links in headers, footers, CV, publications, workshops, projects and interests route through that shell. External social, hospital and original-source links remain clearly marked new-tab links. Standalone public entry URLs may retain their indexable content, but office visitors are never sent into those pages.

Physical exhibit single-click/tap first approaches; a subsequent activation opens content. Double-click/tap zooms any visible room surface without triggering the delayed single action. Reading controls own their gestures. Desktop arrows pan in the same camera-relative plane as Shift+drag, preserve view direction and zoom distance, and do not move the room while reading/editing/typing. Drag rotates, wheel/pinch and +/- zoom. The initial hint omits lighting controls; physical controls remain available.

The monitor uses one persistent canonical1440x810 CV surface from overview through close reading, without mobile font enlargement or layout substitution. Photo, title and columns retain the same proportions as the camera moves. Early CV uses the same monitor bezel and surface over the office still while assets load; the same early reader remains open with its scroll position until explicitly dismissed, while background rendering pauses after the first ready frame. Overview is always available in focused views and returns directly to the complete room; X retains nested return behavior. Details remain in native paper/ink readers with the existing 44px control targets, X and nested Back. No iframe, document reload or separate site header appears inside the room. Mobile metadata panels remain bounded below the readable object.

Early monitor entry enlarges the existing reader from the monitor plane in the current desktop/mobile poster, accounting for centered object-fit cover cropping. The poster anchors are measured from the actual 1440x900 and390x844 captures. Transform uses the established ease over two panel intervals (720ms), with opacity settling in the first quarter; the backdrop uses one panel interval (360ms). This is one entrance on mount, with immediate cancellation on dismissal and an instant reduced-motion path; scene readiness never remounts or replays it. The beui.dev center-morph-modal source informed single-surface entrance and independently fading backdrop mechanics; the poster-to-monitor plane transform is specific to this office. No added dependency, duplicate document or content animation. The shared CV ends after career/education, teaching/training and awards, followed by two existing link primitives for the research and education collections. Publication and presentation lists belong to those dedicated office sections.

### Cabinet glass and physical selection

Glass must retain a transparent centre with legible reflective rims, thick bases and stems, including nighttime cabinet illumination. Stable dielectric reflection must not depend on a low alpha that erases highlights, nor cause frame-to-frame black transmission artifacts. Bottles retain their individual glass tint and liquid absorption.

Select bottles directly in the cabinet. The current bottle returns while the next bottle arrives along continuous eased paths; switching must not wait for a serial return queue. No Select bottle dropdown. Cabinet opening first approaches its corner, then activates. Reduced motion, rapid selection and closing must leave no floating or duplicate bottles.

### Award photograph and plaque

The award-photo approach and reader frame the complete photograph and adjacent YouTube Gold Button together. Share one responsive pair geometry between the camera FOV and the caption placement. Present the original award title, occasion, date and venue immediately below the pair in a small borderless caption with a 44px X; do not reserve a separate right-side card. Keep the family photograph treatment unchanged.

The open cabinet camera fits both halves and its worktop within the viewport, including mobile landscape and the bottom bottle information card. Activating the cabinet from any direction moves the camera to its interior-facing inspection pose. Prevent document scrolling while approaching or inspecting so moving physical controls cannot scroll the room canvas out of view.

### Ordered office refinements, September 2026

Keep the existing CV portrait and canonical layout; all three proposed portrait treatments were rejected. Outside the reader the monitor shows its cover. Reopening restores the last reading position.

Cabinet controls are physical: an 8px quiet handle marker inside a 44px target replaces Open/Close labels; the opened outer edge closes the cabinet and interior contents remain independently selectable. Fit the open cabinet and selected bottle tightly within the viewport, beside a nearby 300px information column on desktop and above it on narrow portrait screens. Keep the existing paper, ink and teal tokens, native X, Overview, Escape and reduced-motion behavior.

Whisky bodies use a separate closed liquid volume with a shallow meniscus and path-dependent absorption. Refracted rays sample the existing room environment probe, an approximation that avoids a second render of the room and prevents the unfiltered local background from showing through. Preserve the existing bottle shapes, labels, glass rims and cabinet lighting. Judge the liquid against actual product references in day and night views without introducing black flashes or an extra rendering pipeline.

A small matte print of the actual KOSESS whisky lecture cover is attached with two restrained metal magnets to the closed cabinet. Selecting it approaches that physical print and opens sharp slide navigation in the room. A TV action selects the exact existing lecture and stays within the persistent office.

In the enlarged television, a narrow left lecture browser groups real events by year and date. The right side contains the original slide, page arrows, thumbnails and concise event/slide context. On narrow screens the lecture list opens on demand to protect slide area. Closing retains the selected slide on the physical TV; slide controls operate only in the enlarged reader. Keep the actual television bezel and camera transition, avoiding a detached full-screen website.

The bookshelf approach contains only the physical books and a compact exit control, without the redundant choose-a-book information panel. Once a book is open its meaningful bibliographic information remains available. Interface and descriptive text use English; original Korean book titles/pages and presentation slides retain their language. The Ppomppu room Easter egg remains unchanged.
