# Presentation PDFs and photos

## TV presentation filenames

Files beginning with `TVPDF_` identify the owner's curated PDFs for the office TV. `TVPDF_KASS.pdf` is valid as supplied; a date in the filename is optional. Keep the original in its existing dated meeting folder, for example `2026-07-09 KASS 2026/TVPDF_KASS.pdf`.

Use the literal, case-sensitive prefix filter when importing from meeting folders that also contain programs, registrations, and other PDFs:

```sh
python3 scripts/import-talk-pdfs.py --source '/absolute/path/to/2. 학회/2026' --filename-prefix TVPDF_ --dry-run
python3 scripts/import-talk-pdfs.py --source '/absolute/path/to/2. 학회/2026' --filename-prefix TVPDF_
```

The meeting folder supplies the date; dates embedded in a future filename also work. The selected meeting must match the current presentation snapshot exactly. For shared dates, use the existing `presentation.json` ID mapping. The prefix selects candidate files; check every slide for patient identifiers and confirm the meeting/title before importing. A complete curated PDF is imported in page order as `kind: "full"`, preserving its content, with 1920px WebP pages and separate 320px thumbnails. Only slide images enter the public assets. This is an explicit import command, not an automatic Dropbox watcher.

On 2026-09-09, all 14 pages of `TVPDF_KASS.pdf` were matched to KASS 2026, meeting date 2026-07-09, presentation ID `22d908af25b980db8fcbfc369cfd8fdb`. The title is “Right-Sided Approach Mastery and Level-Adaptive Decision-Making Strategies.”

## TV photo folders

When a meeting has photos instead of presentation slides, put the owner-selected photos in `TVIMG/` inside its existing dated meeting folder. For example:

`Dropbox/Tak/2. 학회/2026/2026-02-26 Spine Summit/TVIMG/`

`TVPDF_` designates a curated presentation PDF; `TVIMG/` designates a curated meeting photo collection. Both require an explicit import after review. Creating the folder does not start an automatic Dropbox watcher, publish content, or deploy the site.

For each photo import, match the meeting folder to exactly one current presentation ID, confirm its date and place, and inspect every selected image. Use only verified captions and remove any patient identifiers before public output. Confirm the owner's participation role for that event separately: a photo collection alone does not imply that the owner was a speaker or faculty member.

Preserve the full photo framing and apply its EXIF orientation before exporting. Public files are sRGB WebP photos with a maximum dimension of 1920px and separate thumbnails with a maximum dimension of 320px; remove EXIF and other source metadata. Keep the originals in Dropbox. Store ordered photo entries in `studio-talk-media.json` using `kind: "photos"` and the existing `slides` array fields (`src`, `thumbnail`, `caption`, `width`, `height`). An explicitly confirmed role can be stored as `role`, for example `"Faculty"`. Merge only the matched event's media record.

On 2026-09-09, all eight selected Spine Summit photos were matched to presentation ID `2c7908af25b980edbfc6df234f22a8f1`, dated 2026-02-26 in Phoenix, AZ, USA. The owner confirmed Faculty participation for this event. The collection contains seven landscape photos and one portrait photo, kept in their original framing, beginning with faculty teaching and ending with the Special Course 4 sign photo.

## Completed 2026 import

The 2026 meeting-folder inventory on 2026-09-09 contains seven curated PDFs (107 pages) and the eight-photo Spine Summit collection:

| Meeting | Curated source | Pages |
| --- | --- | --- |
| KOMISS Executive Workshop, March 28 | TVPDF_TSMISS.pdf | 17 |
| WUBES, April 4 | TVPDF_WUBES.pdf | 9 |
| WCMISST, May 8 | TVPDF_WCMISST.pdf | 17 |
| KOMISS Spring Symposium & Cadaver Workshop, May 29–30 | TVPDF_KOMISS.pdf | 14 |
| KNS Basic & Digital Convergence Joint Meeting, June 6 | TVPDF_digital.pdf | 24 |
| Busan-Ulsan-Gyeongnam Spine Symposium, June 27 | TVPDF_부울경.pdf | 12 |
| KASS, July 9–11 | TVPDF_KASS.pdf | 14 |

KOMISS Spring retains its existing meeting-start date, May 29. The new PDF cover and program identify the symposium talk on May 30; its exact topic and speaker match ID `33a908af25b980849210fec32e7391fd`. Import it with explicit ID metadata rather than guessing from the May 30 folder date. Page 12 contains a private remote-control session address in a software screenshot. The public pages were rendered from a temporary copy with only that address masked; the Dropbox PDF stays unchanged. Future imports of this source must repeat that narrow preparation. All other page content is preserved.

## Completed 2025 import

On 2026-09-09, the owner completed the 2025 curated lecture PDFs. All 11 `TVPDF_` files (201 pages) were reviewed and matched to these 10 existing events. The 2026 media was retained; 2024 and earlier imports remain deferred.

| Meeting date | Meeting | Curated source | Pages |
| --- | --- | --- | --- |
| January 18 | NeuroTrauma focus | TVPDF_NT symposium.pdf | 30 |
| February 22 | KOSESS Executive Workshop | TVPDF_whisky.pdf | 26 |
| March 15 | Geriatric Neurosurgery Annual Meeting | TVPDF_geriatriceERAS.pdf | 18 |
| May 3 | Neurospine Symposium | TVPDF_Neurospinesymp.pdf | 27 |
| May 24 | KOMISS Advanced Spinal Course Symposium | TVPDF_KOMISS2025춘계.pdf | 9 |
| August 23 | KOSESS Annual Meeting | TVPDF_KOSESS2025_freepaper.pdf, TVPDF_KOSESS2025_Lecture.pdf | 13 + 7 |
| September 4 | ASIA Spine 2025 | TVPDF_NSC2025.pdf | 16 |
| September 14 | Nanoori 22nd Anniversary Symposium | TVPDF_nanoori.pdf | 16 |
| October 16 | KNS 2025 | TVPDF_KNS.pdf | 13 |
| November 28 | KOMISS Annual Meeting | TVPDF_KOMISS2025.pdf | 26 |

The whisky folder says February 23, but its internal program and slide dates identify the exact talk on February 22. Use explicit ID `18c908af25b980b6b436e189b233b958` and retain the existing February 22 meeting date. KNS retains the meeting-start date of October 16; its talk program identifies October 18 within the October 16–18 event.

Both August KOSESS titles already belong to ID `1d1908af25b9805d9696fb9ba4ccc593`. A temporary combined PDF preserves every original page, with free-paper pages 1–13 followed by lecture pages 14–20, matching the existing topic order. Captions identify each deck and its own slide number. For future imports with multiple PDFs for one event, prepare one reviewed combined publication copy in the intended order before running the importer. Keep both Dropbox originals and record their hashes and page boundaries; do not let one deck overwrite another. The importer continues to reject multiple candidate PDFs for the same meeting.

Geriatric ERAS page 14, Nanoori page 11, and November KOMISS page 21 repeat an internal project screenshot. Only employee-number, email/extension, and mobile-contact cells were masked in temporary publication copies. Names, roles, headings, and clinical content remain visible. Future imports of these exact sources must repeat those narrow masks. Only the resulting page images and thumbnails enter public assets; original PDFs remain unchanged in Dropbox. The import receipt records source and derivative hashes, exact rectangles, page order, and checks that unrelated meeting records remain unchanged.

## Completed incoming additions, September 10, 2026

The next inventory found four new curated PDFs (51 pages), no updated earlier PDFs, and no added or updated photos. All 18 previously imported PDF sources and all eight Spine Summit photo sources were byte-identical to their earlier receipts. The dedicated incoming folder contained no PDFs. No supplied `TVPDF_` or `TVIMG` source remains unmatched or pending.

| Existing meeting date | Meeting | New curated source | Pages | Presentation ID |
| --- | --- | --- | --- | --- |
| 2025-07-10 | KASS 2025 | TVPDF_KASS2025.pdf | 7 | `1d4908af25b9800ebf57cd2ce51d47d5` |
| 2025-11-06 | ThaiSMISST 2025 | TVPDF_ThaiSMISST.pdf | 10 | `256908af25b98023b8beeb0cc3d039cc` |
| 2026-06-04 | Wills Memorial Hospital AI Workflow Lecture | TVPDF_wiltse.pdf | 23 | `375908af25b9809bace8c400da57f817` |
| 2026-07-02 | GeneCker AI Lecture | TVPDF_genecker.pdf | 11 | `37b908af25b980e2bcaaf32b9487ba87` |

ThaiSMISST's folder is dated November 7; the deck's cover identifies the November 5–8 meeting and its slide date is November 8. Its speaker and exact title match the existing November 6 presentation record. Explicit ID metadata retains that existing event date. GeneCker's cover confirms its July 2, 2026 lecture and the title “AI, Data, Context, Memory, and AX.”

Every new page was visually reviewed. Wills page 14 masks only manuscript-title cells in an internal editor/reviewer table, and page 22 masks only the private remote-control session address. GeneCker page 5 masks only a third-party recipient address, and page 11 masks only the personal mobile-contact line; the public website and speaker email remain visible. Private publication copies preserve all other content and page order. For GeneCker page 11, a temporary vector cover avoids image-decoder changes outside the mask; only flattened WebP images are public. None of the publication PDFs or source PDFs enters `public/`.

These four audited pages retain 1920px images and 320px thumbnails with no HD copy. The importer's source-hash contracts retain those approved pages on repeat imports and reject changed protected sources. Earlier approved masks, combined-deck order, and photo framing remain unchanged. Evidence, exact source/publication hashes, mask rectangles, source comparison, and asset checks are recorded in `.omo/evidence/office-performance-river-2026-09-10/lectures/`.

Register each protected public page in `src/components/studio/publicSlideSource.ts` as well as the importer. The TV, teaching reader, enlarged viewer, and whisky lecture card share this HD-source boundary. Run `bun test scripts/publicSlideSource.test.ts` after imports: it checks every manifest slide/photo against files on disk, verifies protected pages use standard images with no HD derivative, and confirms unprotected complete-deck pages retain HD images.

The integrated 2025/2026 collection now contains 22 curated PDFs, presented as 21 complete event decks with 359 pages, plus the existing eight-photo Spine Summit collection. The original 2024-and-earlier deferral remains in place. Events without a supplied curated deck remain metadata-only; this import does not infer public content from other files in their meeting folders.

## Dedicated incoming folder

Place one publication-ready deck per meeting under:

`Dropbox/tak/1. 연구/1. published/PDF/홈페이지 발표자료/YYYY-MM-DD_Meeting/발표자료.pdf`

The incoming folder includes `발표목록.csv` with current meeting dates and IDs. A unique date matches the Notion presentation snapshot. If more than one meeting shares that date, add `presentation.json` beside the PDF:

```json
{"id":"the exact meeting ID from 발표목록.csv"}
```

Check matches, then import:

```sh
python3 scripts/import-talk-pdfs.py --source '/absolute/path/to/홈페이지 발표자료' --dry-run
python3 scripts/import-talk-pdfs.py --source '/absolute/path/to/홈페이지 발표자료'
bun run build
```

Requires Python with Pillow and Poppler (`pdfinfo`, `pdftoppm`). The bundled Codex Python runtime has Pillow. The importer renders from the PDF at up to 3840px, writes an on-demand `.hd.webp` reader image, a 1920px room image and separate 320px thumbnails, merges the public slide manifest, and skips unchanged decks. Eight audited pages retain their approved 1920px images with no HD copy. Explicit source-hash contracts preserve their existing public pages on repeat imports and reject a changed protected source until its redactions are reviewed. Unknown or ambiguous meetings are rejected before manifest changes. Original PDFs remain in Dropbox and are not copied into the public build.

The reader displays one page and preloads its next page. Thumbnail navigation uses the separate small images. Focused TV and larger slide readers choose the HD image for large or high-density displays; room textures retain the smaller image. The HD image is requested only for the selected reading page, not for every page at entry. Meeting navigation on the wall TV and in the detail reader shares the same selected meeting; changing meetings resets to slide 1.

Only place decks intended for public viewing in this folder. Importing does not automatically deploy, and Dropbox is not continuously watched. Existing selected preview slides remain until a full PDF is imported for that meeting.
