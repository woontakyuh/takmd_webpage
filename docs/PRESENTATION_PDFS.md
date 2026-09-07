# Presentation PDFs

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

Requires Python with Pillow and Poppler (`pdfinfo`, `pdftoppm`). The bundled Codex Python runtime has Pillow. The importer writes 1920px WebP pages and separate 320px thumbnails, merges the public slide manifest, and skips unchanged decks. Unknown or ambiguous meetings are rejected before manifest changes. Original PDFs remain in Dropbox and are not copied into the public build.

The reader displays one page and preloads its next page. Thumbnail navigation uses the separate small images. Enlarging a slide reuses the current image. Meeting navigation on the wall TV and in the detail reader shares the same selected meeting; changing meetings resets to slide 1.

Only place decks intended for public viewing in this folder. Importing does not automatically deploy, and Dropbox is not continuously watched. Existing selected preview slides remain until a full PDF is imported for that meeting.
