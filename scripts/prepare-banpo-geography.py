"""Prepare compact OSM/SRTM geometry inputs for the editable Banpo pilot.

Run with the evidence directory as argv[1]. OSM-derived geometry remains ODbL.
Missing building heights are visual estimates, never survey measurements.
"""
import json
import math
import sys
from pathlib import Path

from PIL import Image

root = Path(sys.argv[1])
origin = (37.5101, 126.9918)
longitude_scale = 111320 * math.cos(math.radians(origin[0]))
elements = json.loads((root / 'osm-raw.json').read_text())['elements']
water = next(e for e in json.loads((root / 'water-raw.json').read_text())['elements'] if e['id'] == 152336)
tiles = {x: Image.open(root / f'terrain-12-{x}-1586.png').convert('RGB') for x in (3492, 3493)}


def point(p):
    return [round((p['lon'] - origin[1]) * longitude_scale, 1), round((p['lat'] - origin[0]) * 111320, 1)]


def elevation(x, y):
    lat, lon = origin[0] + y / 111320, origin[1] + x / longitude_scale
    tx = (lon + 180) / 360 * 4096
    ty = (1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * 4096
    tile = tiles.get(int(tx))
    if tile is None or not 1586 <= ty < 1587:
        return 9.0
    px, py = (tx % 1) * 256, (ty % 1) * 256
    def sample(dx, dy):
        pixel = tile.getpixel((min(255, int(px) + dx), min(255, int(py) + dy)))
        assert isinstance(pixel, tuple) and len(pixel) == 3
        r, g, b = pixel
        return r * 256 + g + b / 256 - 32768 - 5
    a, b = px % 1, py % 1
    value = (sample(0, 0) * (1-a) + sample(1, 0) * a) * (1-b) + (sample(0, 1) * (1-a) + sample(1, 1) * a) * b
    return round(max(6, value), 1)


def simplified(points, distance: float = 3):
    result = []
    for p in points:
        if not result or math.dist(result[-1], p) > distance:
            result.append(p)
    if len(result) > 2 and math.dist(result[0], result[-1]) < distance:
        result.pop()
    return result


banks = []
for ref in (469332612, 967550720):
    coords = next(m['geometry'] for m in water['members'] if m['ref'] == ref)
    banks.append(simplified([point(p) for p in coords if 126.951 < p['lon'] < 127.037], 12))

def bank_height(x, bank):
    crossings = []
    for a, b in zip(bank, bank[1:]):
        if min(a[0], b[0]) <= x <= max(a[0], b[0]) and a[0] != b[0]:
            crossings.append(a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]))
    return sum(crossings) / len(crossings) if crossings else None

def in_river(x, y):
    edges = [bank_height(x, bank) for bank in banks]
    values = [value for value in edges if value is not None]
    return len(values) == 2 and min(values) < y < max(values)

buildings = []
for e in elements:
    tags = e.get('tags', {})
    if 'building' not in tags or len(e.get('geometry', [])) < 4:
        continue
    poly = simplified([point(p) for p in e['geometry']], 1.5)
    if len(poly) < 3:
        continue
    area = abs(sum(a[0]*b[1]-b[0]*a[1] for a, b in zip(poly, poly[1:]+poly[:1]))) / 2
    x, y = sum(p[0] for p in poly)/len(poly), sum(p[1] for p in poly)/len(poly)
    if in_river(x, y) or y < 800 or area < 180:
        continue
    raw = tags.get('height', '')
    measured = bool(raw or tags.get('building:levels'))
    try:
        height = float(raw.replace('m', '').strip()) if raw else float(tags.get('building:levels', 0)) * 3.05
    except ValueError:
        height = 0
    if height <= 0:
        height = 44 if tags['building'] == 'apartments' else 11 if area < 500 else 19
    buildings.append({'id': e['id'], 'p': poly, 'h': round(height, 1), 'z': elevation(x, y), 'measured': measured, 'area': round(area)})

buildings.sort(key=lambda b: b['area'], reverse=True)
buildings = buildings[:850]
terrain = []
for y in range(-200, 6801, 100):
    terrain.append([round(-4 if in_river(x, y) else elevation(x, y)) for x in range(-3500, 3501, 100)])
islands = [{'name': e['tags']['name'], 'p': simplified([point(p) for p in e['geometry']], 1)} for e in elements if e.get('tags', {}).get('name') in ('가빛섬', '채빛섬', '솔빛섬')]
roads = []
for e in elements:
    tags = e.get('tags', {})
    if tags.get('highway') not in ('motorway', 'trunk', 'primary') or tags.get('bridge') or tags.get('tunnel'):
        continue
    points = simplified([point(p) for p in e.get('geometry', [])], 8)
    if len(points) > 1:
        roads.append(points)
output = {'origin': origin, 'banks': banks, 'buildings': buildings, 'terrain': terrain, 'islands': islands, 'roads': roads, 'towerBase': elevation(-343, 4550)}
(root / 'geography.json').write_text(json.dumps(output, separators=(',', ':')))
print(json.dumps({'buildings': len(buildings), 'taggedHeights': sum(b['measured'] for b in buildings), 'islands': islands, 'bytes': (root / 'geography.json').stat().st_size}, ensure_ascii=False))
