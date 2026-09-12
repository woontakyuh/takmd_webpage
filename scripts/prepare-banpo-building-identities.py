#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.13"
# dependencies = ["pydantic>=2.10,<3", "typer>=0.15,<1"]
# ///
# ─── How to run ───
# Install uv: curl -LsSf https://astral.sh/uv/install.sh | sh
# Run: uv run scripts/prepare-banpo-building-identities.py
# Check reproducibility: uv run scripts/prepare-banpo-building-identities.py --check
# ──────────────────
"""Join source footprints to named north-bank buildings without changing scene geometry."""

from __future__ import annotations

import gzip
import hashlib
import json
import math
from pathlib import Path
from typing import ClassVar, Final, Literal

import typer
from pydantic import BaseModel, ConfigDict, Field, TypeAdapter

ROOT: Final = Path(__file__).resolve().parents[1]
ASSETS: Final = ROOT / "public/models/han-river"
SOURCE: Final = ROOT / "scripts/fixtures/banpo-named-buildings-osm-2026-07-15.json.gz"
SOURCE_HASH: Final = "30e4c48866220d1170825f1812becdb2eeba9f7247f6065acb0091df13ef8687"
FIXTURE_HASH: Final = "547f24c2687e3c16694195db2b19eb6bec38825eb6f5f151e4f6b2a31d5f2a46"
COUNCIL_URL: Final = "https://ms.smc.seoul.kr/attach/record/SEOUL/appendix/a10/A0050703.pdf"
SHINDONGA_IDS: Final = tuple(range(416550341, 416550356))
SHINDONGA_NUMBERS: Final = (1, 2, 3, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16)
CAELITUS_HEIGHTS: Final = {522785017: 201.0, 610247142: 166.0, 610247143: 150.0}
SAMSUNG_URL: Final = "https://news.samsungcnt.com/en/features/engineering-construction/2017-05-bridging-the-sky-samsung-ct-pioneering-the-future-of-the-skybridge/"
RMJM_URL: Final = "https://rmjm.com/portfolio/raemian-caelitus-tower-a/"


class FrozenModel(BaseModel):
    model_config: ClassVar[ConfigDict] = ConfigDict(frozen=True)


class Coordinate(FrozenModel):
    lat: float
    lon: float


class OsmElement(FrozenModel):
    id: int
    type: str
    geometry: tuple[Coordinate, ...] = ()
    tags: dict[str, str] = Field(default_factory=dict)


class OsmMetadata(FrozenModel):
    timestamp_osm_base: str


class FixtureProvenance(FrozenModel):
    parentRawSha256: str


class OsmResponse(FrozenModel):
    osm3s: OsmMetadata
    provenance: FixtureProvenance
    elements: tuple[OsmElement, ...]


class Building(FrozenModel):
    id: int
    p: tuple[tuple[float, float], ...]
    h: float
    z: float
    area: float


class Geography(FrozenModel):
    origin: tuple[float, float]
    buildings: tuple[Building, ...]
    terrain: tuple[tuple[float, ...], ...]


class Identity(FrozenModel):
    id: int
    name: str
    nameKo: str
    complex: str
    blockNumber: int | None
    identitySource: Literal["osm-cluster-council-crosscheck", "osm-cluster-primary-crosscheck", "osm-name-tag"]
    floors: int | None
    floorsSource: Literal["osm-levels-council-confirmed", "osm-levels-primary-confirmed", "osm-levels", "unknown"]
    units: int | None
    completedYear: str | None
    heightM: float
    heightSource: Literal["osm-height-tag", "osm-levels-derived", "existing-estimate"]
    heightIsSurveyed: bool = False
    storeyHeightEstimateM: float | None
    rawHeightTag: str | None
    rawLevelsTag: str | None
    publishedHeightM: float | None = None
    publishedHeightSourceURL: str | None = None
    heightConflict: str | None = None
    p: tuple[tuple[float, float], ...]
    sourceFootprint: tuple[tuple[float, float], ...]
    sourceFootprintLatLon: tuple[tuple[float, float], ...]
    centroidLatLon: tuple[float, float]
    z: float
    zSource: Literal["existing-terrain-base", "current-terrain-interpolation"]
    baseIndex: int | None
    currentMembership: Literal["base", "urban-fabric", "missing"]
    missingReason: str | None
    sourceURLs: tuple[str, ...]


class Inventory(FrozenModel):
    schemaVersion: int = 1
    origin: tuple[float, float]
    osmTimestamp: str
    osmSourceSha256: str
    osmFixtureSha256: str
    baseGeographySha256: str
    urbanFabricSha256: str
    attribution: str = "© OpenStreetMap contributors; ODbL 1.0"
    buildings: tuple[Identity, ...]


class InventoryMismatchError(Exception):
    detail: str

    def __init__(self, detail: str) -> None:
        self.detail = detail
        super().__init__(detail)


def terrain_base(geography: Geography, point: tuple[float, float]) -> float:
    """Use the existing 100 m terrain for the one omitted foundation."""
    east = (point[0] + 3500) / 100
    north = (point[1] + 200) / 100
    x, y = math.floor(east), math.floor(north)
    a, b = east - x, north - y
    rows = geography.terrain
    value = ((rows[y][x] * (1-a) + rows[y][x+1] * a) * (1-b)
             + (rows[y+1][x] * (1-a) + rows[y+1][x+1] * a) * b)
    return round(max(6, value), 1)


def main(raw_path: Path = SOURCE, output_path: Path = ASSETS / "building-identities.json", check: bool = False) -> None:
    """Generate the inventory, or check that its checked-in bytes are reproducible."""
    source_bytes = raw_path.read_bytes()
    if hashlib.sha256(source_bytes).hexdigest() != FIXTURE_HASH:
        raise InventoryMismatchError("OSM fixture changed; revalidate identities before regenerating.")
    raw = OsmResponse.model_validate_json(gzip.decompress(source_bytes))
    if raw.provenance.parentRawSha256 != SOURCE_HASH:
        raise InventoryMismatchError("OSM fixture parent snapshot does not match the validated source.")
    geography_bytes = (ASSETS / "geography.json").read_bytes()
    geography = Geography.model_validate_json(geography_bytes)
    urban_bytes = (ASSETS / "urban-fabric.json").read_bytes()
    urban_adapter: TypeAdapter[tuple[Building, ...]] = TypeAdapter("tuple[Building, ...]")
    urban = urban_adapter.validate_json(urban_bytes)
    base = {item.id: (index, item) for index, item in enumerate(geography.buildings)}
    urban_ids = {item.id for item in urban}
    raw_by_id = {item.id: item for item in raw.elements}
    slabs = tuple(raw_by_id[osm_id] for osm_id in SHINDONGA_IDS)
    numbers = tuple(sorted(int(item.tags["name"].removesuffix("동")) for item in slabs))
    if (numbers != SHINDONGA_NUMBERS or sum(int(item.tags["building:flats"]) for item in slabs) != 1326
            or any(item.tags.get("building:levels") != "13" or item.tags.get("start_date") != "1984" for item in slabs)):
        raise InventoryMismatchError("Shindonga identity/count/floor/year evidence no longer matches.")
    towers = tuple(raw_by_id[osm_id] for osm_id in CAELITUS_HEIGHTS)
    if (tuple(int(item.tags["building:levels"]) for item in towers) != (56, 42, 36)
            or sum(int(item.tags["building:flats"]) for item in towers) != 460
            or any(item.tags.get("start_date") != "2015" for item in towers)):
        raise InventoryMismatchError("Caelitus floor/count/year evidence no longer matches.")
    identities: list[Identity] = []
    longitude_scale = 111320 * math.cos(math.radians(geography.origin[0]))
    for osm_id in (*SHINDONGA_IDS, 431589092, 431589099, *CAELITUS_HEIGHTS):
        item = raw_by_id[osm_id]
        tags = item.tags
        coords = item.geometry[:-1] if item.geometry[0] == item.geometry[-1] else item.geometry
        polygon = tuple((round((p.lon-geography.origin[1])*longitude_scale, 1),
                         round((p.lat-geography.origin[0])*111320, 1)) for p in coords)
        centroid = (sum(p[0] for p in polygon)/len(polygon), sum(p[1] for p in polygon)/len(polygon))
        is_shindonga = osm_id in SHINDONGA_IDS
        is_caelitus = osm_id in CAELITUS_HEIGHTS
        if is_shindonga and not all(37.516 < p.lat < 37.521 and 126.985 < p.lon < 126.992 for p in coords):
            raise InventoryMismatchError(f"Shindonga footprint {osm_id} left its validated spatial cluster.")
        current = base.get(osm_id)
        levels_tag, height_tag = tags.get("building:levels"), tags.get("height")
        levels = int(levels_tag) if levels_tag else None
        height = float(height_tag.removesuffix("m").strip()) if height_tag else round(levels*3.05, 2) if levels else current[1].h if current else 44.0
        name_ko = tags["name"]
        block_number = int(name_ko.removesuffix("동")) if is_shindonga or is_caelitus else None
        complex_name = "Seobinggo Shindonga" if is_shindonga else "Raemian Caelitus" if is_caelitus else "Daewon Seobinggo" if osm_id == 431589092 else "Seobinggo Green Park"
        identities.append(Identity(
            id=osm_id, name=f"{complex_name} · Block {block_number}" if is_shindonga or is_caelitus else complex_name,
            nameKo=f"서빙고 신동아아파트 {name_ko}" if is_shindonga else f"래미안 첼리투스 {name_ko}동" if is_caelitus else name_ko, complex=complex_name,
            blockNumber=block_number, identitySource="osm-cluster-council-crosscheck" if is_shindonga else "osm-cluster-primary-crosscheck" if is_caelitus else "osm-name-tag",
            floors=levels, floorsSource="osm-levels-council-confirmed" if is_shindonga else "osm-levels-primary-confirmed" if is_caelitus else "osm-levels" if levels else "unknown",
            units=int(tags["building:flats"]) if "building:flats" in tags else None, completedYear=tags.get("start_date"),
            heightM=height, heightSource="osm-height-tag" if height_tag else "osm-levels-derived" if levels else "existing-estimate",
            storeyHeightEstimateM=3.05 if levels and not height_tag else None, rawHeightTag=height_tag, rawLevelsTag=levels_tag,
            publishedHeightM=CAELITUS_HEIGHTS.get(osm_id), publishedHeightSourceURL=SAMSUNG_URL if is_caelitus else None,
            heightConflict="OSM and Samsung published heights differ; measurement datums are not established. OSM height retained." if is_caelitus else None,
            p=current[1].p if current else polygon, sourceFootprint=polygon,
            sourceFootprintLatLon=tuple((p.lat, p.lon) for p in coords),
            centroidLatLon=(round(sum(p.lat for p in coords)/len(coords), 7), round(sum(p.lon for p in coords)/len(coords), 7)),
            z=current[1].z if current else terrain_base(geography, centroid), zSource="existing-terrain-base" if current else "current-terrain-interpolation",
            baseIndex=current[0] if current else None, currentMembership="base" if current else "urban-fabric" if osm_id in urban_ids else "missing",
            missingReason="Original geography preparation excluded centroid north < 800 m; urban fabric starts at 950 m." if not current and centroid[1] < 800 else None,
            sourceURLs=(f"https://www.openstreetmap.org/way/{osm_id}", COUNCIL_URL) if is_shindonga else (f"https://www.openstreetmap.org/way/{osm_id}", SAMSUNG_URL, RMJM_URL) if is_caelitus else (f"https://www.openstreetmap.org/way/{osm_id}",),
        ))
    inventory = Inventory(origin=geography.origin, osmTimestamp=raw.osm3s.timestamp_osm_base,
                          osmSourceSha256=SOURCE_HASH, osmFixtureSha256=FIXTURE_HASH, baseGeographySha256=hashlib.sha256(geography_bytes).hexdigest(),
                          urbanFabricSha256=hashlib.sha256(urban_bytes).hexdigest(), buildings=tuple(identities))
    encoded = json.dumps(inventory.model_dump(), ensure_ascii=False, separators=(",", ":")) + "\n"
    if check:
        if output_path.read_text() != encoded:
            raise InventoryMismatchError("Checked-in inventory differs from its source-derived output.")
    else:
        _ = output_path.write_text(encoded)
    typer.echo(json.dumps({"checked": check, "buildings": len(identities), "shindonga": len(slabs),
                           "missing": [item.id for item in identities if item.currentMembership == "missing"]}))


if __name__ == "__main__":
    typer.run(main)
