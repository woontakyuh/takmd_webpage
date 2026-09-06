# TakMD.com

Public branding site and living CV for Woon Tak Yuh, MD.

The homepage is an editable 3D office. Drag to orbit, scroll or pinch to zoom, use guided views, and open four exhibits. The research folio displays the actual first page of all 29 published papers; the teaching board and workstation connect to their reading panels. A mechanical calendar clock follows the visitor’s local time, with daylight and evening previews. `/cv` remains the living record. Existing content pages and the previous `/v2` scene remain available.

## Commands

```sh
bun install
bun run dev
bun run build
bun run preview
bun run check
```

`bun run deploy` builds and publishes to the Cloudflare Pages production project `takmdwebpage`, which serves `takmd.com`. Commit and push the intended checkpoint before running it.

## Data Refresh

The site builds from checked-in Notion snapshots. Refresh them explicitly with:

```sh
bun run fetch:publications
bun run fetch:presentations
bun run fetch:surgery
bun run fetch:data
```

These commands require `NOTION_TOKEN`, either in the environment or in `~/.journal_alert_env`.

Generated files:

- `src/data/publications.json`
- `src/data/presentations.json`
- `src/data/surgery-data.json`

## Public Routes

- `/`: interactive office
- `/cv`: living CV
- `/ube`: UBE surgery philosophy and registry signal
- `/education`: surgical education programs
- `/ai`: practical clinical AI work
- `/ai-workflow`: detailed workflow map
- `/research`: publication themes and recent papers
- `/media`: public media archive
- `/knowledge`: short professional notes
- `/contact`: verified contact paths
- `/dashboard`: private workspace notice; no clinical dashboard is shipped publicly
- `/v2`: previous room experiment

## Design System

See `DESIGN.md` for the studio tokens, interactions, and responsive contract. Edit object positions in `src/components/studio/scene/config.ts`; desktop and mobile camera tours have separate settings. Geometry and materials are component-owned, so changing the room does not require replacing a monolithic model.

Development inspection tools are opt-in at `/?inspect`. Production builds run `check:public` to validate the public asset boundary. New home content uses publication and presentation snapshots, with their update dates shown in the reading panels. This redesign does not implement private server authentication.
