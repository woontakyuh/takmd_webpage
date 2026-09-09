# Isidoro drinks cabinet source receipt

## Product source

- Product: Poltrona Frau Isidoro drinks cabinet, designed by Jean-Marie Massaud.
- Official product page: <https://www.poltronafrau.com/ww/en/products/isidoro-drinks-cabinet.html>
- Official dimensions drawing: <https://www.poltronafrau.com/content/dam/ld/poltronafrau/products/i/s/i/isidoro-drinks-cabinet/08_dimensioni/01_isidoro-drinks-cabinet-5381881.jpg/jcr%3Acontent/renditions/cq5dam.thumbnail.1500.1500.jpg>
- Official 3DS package: <https://www.poltronafrau.com/content/dam/ld/poltronafrau/products/i/s/i/isidoro-drinks-cabinet/20_area_professionals/planning-tools/isidoro-drinks-cabinet_3ds.zip>
- Retrieved 2026-09-09 from the manufacturer's public downloads section.

The official drawing establishes a 71 cm width, 51 cm depth and 117 cm height when closed, and a 142 cm width when fully open. The product page specifies a poplar-plywood structure, Pelle Frau leather exterior, printed-fabric inner walls, Canaletto-walnut veneered shelves and drawers, fixed feet on the stationary half, swivel castors on the opening half, combination snap locks, metal bottle/glass rails and a foldable worktop.

## Geometry inspection

The manufacturer ZIP contains closed and open standard/high-detail 3DS files. The high-detail files each contain 17 named meshes, 6,016 vertices and 11,752 triangles. Their named groups identify the trunk, hinges, internal woodwork, drawer, folding top, feet, opening door, glass base, internal stops and lining. The public source geometry was used as a measured construction reference. The site implementation remains lightweight, procedural and articulated so the opening half and worktop can move independently and retain scene gesture handling.

## Finish and reference interpretation

Three user-supplied product photographs were inspected for the open-book silhouette, leather piping and edge radii, muted dark olive-grey exterior, warm neutral fabric lining, walnut internal fronts, thin chrome guardrails, handle/locks, worktop and castor placement. Scene colors reuse the existing `linen`, `stone`, `walnut`, `walnutDark`, `steel`, `aluminiumEdge` and `rubber` tokens from `src/components/studio/scene/config.ts`; no other room furniture is recolored.

## Local verification receipts

Retrieved source files, checksums, model inventory and current-run test/browser artifacts are stored outside the shipped public bundle at `.omo/evidence/office-entry-2026-09-09/isidoro/`.
