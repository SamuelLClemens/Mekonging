#!/usr/bin/env python3
"""Build js/data/geo.js: real, simplified country outlines for the front-page map.

Source: mledoze/countries (Natural Earth-derived public-domain outlines). The data is
fetched at BUILD time, projected to a shared equirectangular view, simplified with
Ramer-Douglas-Peucker, and written into the repo so the running app needs no network
(per the static-site self-hosting rule). Re-run after changing the country set:

    python3 scripts/build_geo.py

Requires the four /tmp/mk_<cca3>.geo.json files (the script fetches them if missing).
"""
import json, math, os, urllib.request

COUNTRIES = [('th', 'tha'), ('vi', 'vnm'), ('kh', 'khm'), ('la', 'lao')]
SRC = 'https://raw.githubusercontent.com/mledoze/countries/master/data/{}.geo.json'
# Frame window: drop distant offshore island claims so the map frames the mainland.
WIN = dict(lng_min=97.0, lng_max=110.2, lat_min=5.4, lat_max=23.6)
AREA_MIN = 0.02      # deg^2 — drops specks, keeps real islands (Phuket, Phu Quoc)
RDP_EPS = 0.022      # degrees (~2.4 km) — outline smoothness
VIEW_W = 700
PAD = 22


def fetch(cca3):
    p = f'/tmp/mk_{cca3}.geo.json'
    if not os.path.exists(p):
        urllib.request.urlretrieve(SRC.format(cca3), p)
    return json.load(open(p))


def polys_of(geo):
    feats = geo['features'] if geo.get('type') == 'FeatureCollection' else [geo]
    g = feats[0]['geometry']
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']


def ring_area(ring):
    a = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]; x2, y2 = ring[i + 1]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def centroid(ring):
    xs = [p[0] for p in ring]; ys = [p[1] for p in ring]
    return sum(xs) / len(xs), sum(ys) / len(ys)


def rdp(points, eps):
    if len(points) < 3:
        return points
    dmax, idx = 0.0, 0
    a, b = points[0], points[-1]
    for i in range(1, len(points) - 1):
        d = perp(points[i], a, b)
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        left = rdp(points[:idx + 1], eps)
        right = rdp(points[idx:], eps)
        return left[:-1] + right
    return [a, b]


def perp(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def point_in_ring(pt, ring):
    x, y = pt; inside = False; n = len(ring); j = n - 1
    for i in range(n):
        xi, yi = ring[i]; xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def poly_label(rings):
    """Pole of inaccessibility (the interior point farthest from any edge) of a
    projected polygon — a label position guaranteed to sit on a wide part of the
    shape. Coarse grid search then local refinement."""
    ext = rings[0]; holes = rings[1:]
    xs = [p[0] for p in ext]; ys = [p[1] for p in ext]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    edges = [(r[i], r[i + 1]) for r in rings for i in range(len(r) - 1)]

    def sdist(p):
        if not point_in_ring(p, ext):
            return -1
        for h in holes:
            if point_in_ring(p, h):
                return -1
        return min(perp(p, a, b) for a, b in edges)

    best = ((minx + maxx) / 2, (miny + maxy) / 2); bestd = -1
    N = 56
    for i in range(N + 1):
        for k in range(N + 1):
            p = (minx + (maxx - minx) * i / N, miny + (maxy - miny) * k / N)
            d = sdist(p)
            if d > bestd:
                bestd, best = d, p
    step = max(maxx - minx, maxy - miny) / N
    for _ in range(6):
        cx, cy = best
        for dx in (-step, -step / 2, 0, step / 2, step):
            for dy in (-step, -step / 2, 0, step / 2, step):
                p = (cx + dx, cy + dy); d = sdist(p)
                if d > bestd:
                    bestd, best = d, p
        step /= 2
    return [round(best[0], 1), round(best[1], 1)]


# 1) Load + filter polygons to the framing window.
kept = {}   # code -> list of rings-lists (each polygon = [exterior, *holes])
for code, cca3 in COUNTRIES:
    keep = []
    for poly in polys_of(fetch(cca3)):
        ext = poly[0]
        cx, cy = centroid(ext)
        in_win = (WIN['lng_min'] <= cx <= WIN['lng_max'] and WIN['lat_min'] <= cy <= WIN['lat_max'])
        if in_win and ring_area(ext) >= AREA_MIN:
            keep.append(poly)
    kept[code] = keep

# 2) Shared bounding box from kept points.
xs, ys = [], []
for code in kept:
    for poly in kept[code]:
        for ring in poly:
            for x, y in ring:
                xs.append(x); ys.append(y)
minlng, maxlng, minlat, maxlat = min(xs), max(xs), min(ys), max(ys)
midlat = math.radians((minlat + maxlat) / 2)
kx = math.cos(midlat)
raw_w = (maxlng - minlng) * kx
raw_h = (maxlat - minlat)
scale = (VIEW_W - 2 * PAD) / raw_w
view_h = round(raw_h * scale + 2 * PAD)


def project(x, y):
    px = PAD + (x - minlng) * kx * scale
    py = PAD + (maxlat - y) * scale
    return round(px, 1), round(py, 1)


# 3) Simplify + build path data; label = pole of inaccessibility (visual centre).
paths, labels = {}, {}
for code in kept:
    segs = []
    big_proj, big_area = None, 0
    for poly in kept[code]:
        proj_rings = []
        for ring in poly:
            simp = rdp(ring, RDP_EPS)
            if len(simp) < 3:
                continue
            pts = [project(x, y) for x, y in simp]
            proj_rings.append(pts)
            segs.append('M' + ' L'.join(f'{x},{y}' for x, y in pts) + ' Z')
        a = ring_area(poly[0])
        if a > big_area and proj_rings:
            big_area, big_proj = a, proj_rings
    paths[code] = ' '.join(segs)
    labels[code] = poly_label(big_proj)

out = (
    "// AUTO-GENERATED by scripts/build_geo.py — do not edit by hand.\n"
    "// Real country outlines (mledoze/countries, Natural Earth-derived, public domain),\n"
    "// projected + simplified at build time and self-hosted so the map needs no network.\n"
    f"export const REGION_VIEWBOX = '0 0 {VIEW_W} {view_h}';\n"
    "export const REGION_PATHS = {\n"
    + ''.join(f"  {c}: '{paths[c]}',\n" for c in paths)
    + "};\n"
    "export const REGION_LABELS = {\n"
    + ''.join(f"  {c}: [{labels[c][0]}, {labels[c][1]}],\n" for c in labels)
    + "};\n"
)
dest = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', 'geo.js')
open(dest, 'w').write(out)
total = sum(p.count('L') + p.count('M') for p in paths.values())
print(f"wrote {dest}  viewBox=0 0 {VIEW_W} {view_h}  ~{total} points")
for c in paths:
    print(f"  {c}: {len(paths[c])} chars, label {labels[c]}")
