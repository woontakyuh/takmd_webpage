# Interactive office checkpoint · 2026-09-07

The office now separates the seated monitor CV from the Mac mini's AI collection, supports focused orbit/zoom, and uses the user's photo in a zoom-only electronic frame. The first CV screen contains the supplied portrait, three academic interests and ten society/editorial activities; career, education and awards remain available in the right reader and complete CV.

## Shipped behavior

- Reference-led oak office, textured dimensional garments/desk, credible M4 mini ports and cable routing, 32-inch-class 16:9 monitor, 3.5 mm mat, wall-mounted HH:MM:SS calendar, correctly oriented spine and original Bing surfboard, and requested subtle chair hover motion.
- Synchronized wall-TV and reader meeting navigation, independent slide paging, full-screen slide dialog, small thumbnails and next-page preloading.
- AI project/talk/paper collection with working deep links and reader drill-down.
- Three connected workshop starter pages: dummy, cadaver and animal/pig. Further materials are intentionally pending.
- Public jiu-jitsu character and filtered Notion training snapshot: 67 physical sessions, Gi 57 and No-Gi 10, January 5 through September 4, 2026. Every session can be selected without leaking private notes or source identifiers.
- Electronic frame with the supplied IMG_1174.jpeg. Raw originals stay local; generated WebP has image metadata removed. Additional images can rotate between visits.

## Verification

Build: 20 static pages. Astro check: 121 files, zero errors, zero warnings, 19 hints. Public build guard: 159 assets passed. Existing public-boundary tests: 19 passed.

Final rendered-source digest: `9b1e3ea2f4852fe593e365c7a2200208159c00543d560bb366b95c26ceffbb1b` (254 source/configuration/public files; per-file SHA-256 manifest retained locally).

Fresh browser evidence: 204 validated PNG captures, 801 checks, zero browser errors across 1440, 1280, 768 and 375 pixel layouts. This includes all 56 presentation records, all nine currently supplied slides, photo zoom/close, date/year rollover, CV/AI reader navigation, selected-object orbit/zoom, 18 BJJ month/mode states at three widths, every training session, complete CV pages and three workshop routes. In-app browser also personally exercised CV and actual photo-frame focus.

Chair region pixel change on hover: 6.79%; settled vs original: 0%; reduced-motion hover: 0%. Mat geometry bounds measure 0.00349999993 m in height. Slide importer CLI was exercised with a real two-page PDF in an isolated temporary repository: both pages and thumbnails rendered, repeat import skipped unchanged files, and unmatched input failed without changing the manifest. Photo importer checks covered duplicate images, EXIF/XMP/IPTC removal, empty-source preservation and explicit clearing.

Fixed during actual browser QA: a narrow-laptop footer intercepting photo clicks, TV controls shifted by perspective HTML/view-offset interaction, Escape on the last slide closing its parent reader, and duplicate-date BJJ records selecting the wrong row. Complete capture manifests and review reports are kept locally under `docs/redesign/office-object-refinement-2026-09-07/`; large screenshots and raw source references are excluded from this Git checkpoint.

Independent final gates on this source digest: design-system/functional integrity PASS and visual/CJK/responsive PASS, both with no blockers. The reviewers checked all 17 contact sheets and the full 204-capture manifest; the integrity reviewer also verified all 254 source-file hashes. Reports are retained in `.omo/evidence/final-office-integrity-gate-review.md` and `.omo/evidence/final-office-visual-gate-review.md`.

## Content workflow and limits

- Full meeting PDFs: see [PRESENTATION_PDFS.md](PRESENTATION_PDFS.md). The prepared Dropbox `홈페이지 발표자료` folder contains matching instructions and the presentation list. No new complete meeting decks have been supplied yet; the live collection honestly labels its existing nine images as selected slides.
- Frame photos: put files in `content/photo-frame/`, then run `bun run photos:import`, build and deploy. See that folder's README. iCloud automatic synchronization is not implemented; the user-authorized folder workflow is in place.
- BJJ: see [BJJ_DATA.md](BJJ_DATA.md). This is a dated build-time Notion snapshot, not a live client-side credential-bearing connection.
- The logo redesign remains deferred. The cancelled friend-request/private-family-album feature is absent.

Deployment uses the existing Cloudflare Pages project `takmdwebpage`. Its pinned Wrangler command now runs through npm exec because the local bunx Wrangler installation lacked esbuild. No access policy or hosting project changed.
