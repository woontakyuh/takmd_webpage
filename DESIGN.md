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
