# CGBIO workshop certificate display · 2026-09-21

Local implementation only; no commit, push or deployment requested in this turn.

- New CgbioCertificate uses source-faithful landscape bifold: original group photograph left, Faculty Appreciation Certificate right, September 12, 2026. The shallow V stands centrally on the previously empty 1.7 m shelf in the credentials bay. Original CG Institute cover branding is on the exterior. Black leather grain and restrained clearcoat use existing texture/material conventions.
- Reuses CollectionInspectionItem/HoverAccent and responsive caption fitting. First click approaches the pair; second click focuses the chosen photo/certificate. Existing X, Escape and Overview exits remain. Captions use role/event/date only so they end above the lower neighboring awards on phones. Empty optional descriptions do not render or inherit the paragraph margin. CollectionInspectionItem must stay outside the world-position/rotation wrapper: its Html anchor takes world coordinates.
- Source-only homographic resampling: scripts/prepare-cgbio-certificate.mjs, run with Bun and source Down folder argument. Calls the existing projector exported from AwardPrintCalibration.ts. HEICs1388/1389/1392 supply prints/cover;1390/1391 are not published (1390 is a closed-cover reference;1391 open-folder reference). Correct filenames and source SHA256 hashes are in public/models/personal-awards/cgbio-2026/provenance.json. No generated faces, print, signatures or logos. No full room photographs published.
- Model dimensions estimated from A4 landscape inserts: .321 × .234 × .005 m covers;156-degree opening. Print map preserves297:210 aspect. Shelf contact clearance .2 mm. Existing shelf/exhibits unchanged.

## Verification

- bun run check:0errors,0warnings,24existing hints.
- bun x astro build:PASS; node scripts/check-public-build.mjs:PASS2316assets.
- CollectionInspectionState.test.mjs:5pass,0fail.
- CollectionInspectionLayout.test.mjs:29pass,1existing ultrawide credential-group failure; reproduced using unchanged HEAD CollectionInspectionData (baseline output /tmp/cgbio-baseline.log). That test uses old credential heights; not changed in this display task.
- Real Chrome1440×1000/768×1024 and WebKit375×812 against production preview: physical pointer/touch pair approach, certificate focus, Xclose, photo focus, Escclose PASS; zero pageerrors.1440hover material emissive response assertionPASS. Physical iPhone not tested.
- Captures and runnable capture.mjs: .omo/evidence/cgbio-certificate-2026-09-21/. checks.json is the final production run. Mid-transition, shelf, spread, each leaf and hover captures retained.
- Preview runs at http://127.0.0.1:4322/ from dist. Loading posters were not refreshed for this shelf-only addition; do normal poster/release procedure if a later deployment is requested.

Existing uncommitted docs/handoffs/2026-09-16-claude.md was left intact. Existing unrelated untracked files were preserved.

Independent final gate: APPROVE, no blockers after compact-caption fix. Report: .omo/evidence/cgbio-certificate-2026-09-21-gate-review.md. Source/code review: .omo/evidence/cgbio-certificate-2026-09-21-code-review.md.
