# TakMD.com

Public branding site and living CV for Woon Tak Yuh, MD.

The redesigned site uses an interactive deskterior homepage: Woon Tak Yuh's working desk becomes the navigation surface, while `/cv` remains the Notion-synced living record. Subpages expand the desk objects into UBE, education, clinical AI, research, media, knowledge, and contact surfaces.

## Commands

```sh
bun install
bun run dev
bun run build
bun run preview
```

## Data Refresh

The public CV data is generated at build time from Notion-backed scripts:

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

- `/`: interactive deskterior brand homepage
- `/cv`: living CV
- `/ube`: UBE surgery philosophy and registry signal
- `/education`: surgical education programs
- `/ai`: practical clinical AI work
- `/ai-workflow`: detailed workflow map
- `/research`: publication themes and recent papers
- `/media`: public media archive
- `/knowledge`: short professional notes
- `/contact`: verified contact paths
- `/dashboard`: separate surgery-data dashboard

## Design System

See `DESIGN.md` for the deskterior direction, tokens, component principles, and anti-slop guardrails.
