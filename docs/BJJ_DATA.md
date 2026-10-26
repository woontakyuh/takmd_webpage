# Public jiu-jitsu data

`src/data/bjj-public.json` is a build-time snapshot from the private Spinoscopy Dashboard Notion sources. Refresh it with:

```sh
bun run scripts/fetch-bjj-public.ts
```

The fetcher reads `NOTION_TOKEN`, `NOTION_BJJ_DB_ID`, and `NOTION_LO_PROFILE_DB_ID`. For the current local setup it fills missing values from the sibling `spinoscopy-dashboard/.env.local` and its existing profile migration backup. Set `SPINOSCOPY_DASHBOARD_ROOT` when that repository is elsewhere. Credentials stay server-side and are never written to the snapshot.

## Public projection

The JSON contains only:

- snapshot generation time and covered date range;
- display name, belt, stripe count, training start date, and an optimized local WebP character image path;
- aggregate counts for logged physical sessions, Gi, No-Gi, class, and open mat;
- per-month Gi and No-Gi counts;
- physical-session date, Gi or No-Gi mode, class or open-mat type, and technique tags.

The fetcher excludes fitness and medical data, gym and instructor names, free-text notes, daily focus text, source page titles, Notion page/database IDs, Notion URLs, video titles, and video URLs. `study` and `promotion` rows are excluded from the public training log.

No-Gi classification follows the existing dashboard rule: a physical session is No-Gi when its source title, class tags, or sparring tags contain `NoGi`, `No-Gi`, or `노기`; other physical sessions are Gi. Source mode labels are removed from the technique list.

## Freshness

The page displays both the newest covered session date and the snapshot refresh date. A deploy never silently claims live synchronization: refresh the JSON before publishing when current Notion data is required.
