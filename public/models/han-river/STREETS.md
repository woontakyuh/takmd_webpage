# Mapped local streets

The local street layer uses a fresh OpenStreetMap snapshot returned by the public Overpass API at **2026-09-12T04:52:49Z**. It supplements the scene's original primary/trunk-road selection with secondary, tertiary, residential, unclassified, service and living-street centerlines.

- Origin: latitude 37.5101, longitude 126.9918. Coordinates are east/north metres using the existing scene conversion.
- Extent: east −2,500 to +3,000 m, north +650 to +4,200 m.
- Source ways: 2,661; retained eligible ways: **2,611**, in **2,618** clipped parts / **16,508** points.
- Bridges, tunnels, underground locations and negative layers are excluded. Paths are clipped at the actual river polygon and extent; no invented connectors are inserted. The extent includes mapped land on both sides of the diagonal river edge, not only the northern shoreline.
- `wayId` identifies the source OpenStreetMap way; `id` also records clipping parts. `p` remains source-aligned with 0.1 m storage rounding.
- Only **one** retained way has a usable explicit metric `width` tag. All other widths are **visual class estimates**, not surveyed widths: secondary 12 m, tertiary 9 m, residential 5.5 m, unclassified 6 m, service 3 m, living street 4 m. Each feature preserves `widthProvenance`.

## Rendering and limits

All streets share one **2,048 × 2,048 single-channel R8 coverage texture** and one continuous **3,960-triangle** mesh. The mesh follows the existing 100 m terrain grid and its original diagonals, with the existing riverbank height adjustment and a 0.05 m surface offset. It does not place every road at a uniform 18 m elevation.

GPU texture storage is **4,194,304 bytes** at the base level, or **5,592,405 bytes** including the complete mip chain (5.33 MiB). The one-time browser canvas is released after extracting the red channel. No per-road meshes, lights, traffic, shadows or emissive roads are added. Existing mapped roads inside parks remain roads; surrounding park ground is unaffected. The whole river polygon is explicitly blacked out in coverage so painted road widths cannot spill onto water.

The mask resolves approximately 2.69 m east/west and 1.73 m north/south per texel. It is intended for the distant window view. Road widths and roughness are visual approximations, and the source 100 m terrain is not a surveyed street-level surface.

## Reproduction

`bun scripts/prepare-banpo-streets.ts` regenerates `local-streets.json` deterministically from `scripts/fixtures/banpo-streets-osm-2026-09-12.json.gz` without network access. `bun test scripts/banpoLocalStreets.test.ts` checks source provenance, clipping, deterministic output, terrain heights, winding and geometry budget.

Uncompressed source SHA-256: `cafcf42a664ad68a0cee07d94ebb1a7d55df91c8f861b9d9e43cce1eb3073ca6`.

Query used:

```overpass
[out:json][timeout:120];
way[highway~"^(secondary|tertiary|residential|unclassified|service|living_street)$"](37.51593902263744,126.96348875871313,37.547829069349625,127.02577348954425);
out tags geom;
```

Data © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), licensed under the Open Database License. Source service: [Overpass API](https://overpass-api.de/). Derived geographic data is supplied in `local-streets.json` with the source way identifiers; this documentation does not assert survey accuracy.
