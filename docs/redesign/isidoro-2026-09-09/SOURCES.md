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

Three user-supplied product photographs were inspected for the open-book silhouette, leather piping and edge radii, fabric lining, walnut internal fronts, thin chrome guardrails, handle/locks, worktop and castor placement. The owner rejected the initial olive exterior. The current exterior uses warm taupe #A69583, with a fine seam and CC0 leather normal/roughness maps (see public/textures/isidoro/SOURCE.md), to coordinate with the room's beige wood and upholstery. This is a room-specific color interpretation, not a claimed manufacturer swatch. Walnut, lining and hardware retain the existing room palette. Other furniture is not recolored.

The owner-approved placement closes against the guitar-side wall facing the desk. A mirrored hinge opens only 90 degrees so the two halves follow the perpendicular room walls. The worktop lowers after the opening half stops and rises before closing. Lower bottle bays remain exposed. Hollow glassware, a three-piece steel shaker, double jigger and twisted bar spoon are modeled geometry, not photo planes. Current evidence is .omo/evidence/isidoro-corner-2026-09-09/.

## Local verification receipts

Retrieved source files, checksums, model inventory and current-run test/browser artifacts are stored outside the shipped public bundle at `.omo/evidence/office-entry-2026-09-09/isidoro/`.

## Whisky and cocktail glassware correction

The owner replaced the generic small tumblers/copitas with six Glencairn tasting glasses and two coupe glasses. All eight glasses now occupy one fixed upper compartment: six Glencairns in two close rows, with the two coupes adjacent. The opening half has a single shelf at 720mm instead of the two shallow glass shelves, providing proper headroom for three existing bottles above and four below. The seven-bottle collection is unchanged; the opposite lower bay remains available for future additions. The moving content cancels the hinge reflection so labels remain readable. All are hollow lathed glass geometry, with a thick tasting-glass foot or thin coupe stem; reference photographs are not applied as surface textures.

- Glencairn's official product specification: 115mm height, 66mm maximum diameter. https://whiskyglass.com/product/glencairn-glass/
- Riedel GRAPE coupe/cocktail 6424/09 reference: 170mm height, 111mm maximum diameter. https://www.riedel.com/en-nz/riedel-grapeatriedel-coupe-cocktail/642400009
- Cocktail Kingdom Usagi 800mL reference: 215mm height, 90mm diameter, 25mm cap height. https://magento.cocktailkingdom.com/media/wysiwyg/CK-Catalog_Version4.pdf

The previous modeled shaker was only 175mm tall at 90mm wide. Its bottom rested correctly on the tray, but its body was squat. The new tapered lower tin, shoulder/strainer and cylindrical cap follow the taller 800mL proportions; overall top remains 65mm below the upper shelf. Custom modeling is based on product silhouette and published envelope, not a manufacturer CAD clone.

Current actual browser/detail/night captures and geometric checks: .omo/evidence/isidoro-glencairn-2026-09-09/.
