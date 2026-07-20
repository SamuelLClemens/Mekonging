#!/usr/bin/env python3
"""Build js/data/regions.<cc>.js: simplified province/ADM1 outlines per country.

Source: geoBoundaries gbOpen ADM1 "_simplified" GeoJSON (OpenStreetMap-derived for
TH/KH/LA under ODbL; geoBoundaries/Wikipedia for VN). Fetched at BUILD time, simplified
with Ramer-Douglas-Peucker, coordinate-rounded, and written into the repo so the running
app needs no network (per the static-site self-hosting rule). Re-run with:

    python3 scripts/build_regions.py

Attribution to ship in-app: "Province outlines © OpenStreetMap contributors (ODbL) via
geoBoundaries (Runfola et al., 2020)."

Output per country: a per-country equirectangular projection (so provinces fill the view)
plus, per province, its code, cleaned English name, a label lng/lat, and its polygons as
lightly-simplified lng/lat rings. The app projects the rings to SVG at render time and uses
the same rings for point-in-polygon bucketing of places into their province.
"""
import json, math, os, urllib.request

COUNTRIES = [('th', 'THA'), ('vi', 'VNM'), ('kh', 'KHM'), ('la', 'LAO')]
SRC = 'https://github.com/wmgeolab/geoBoundaries/raw/main/releaseData/gbOpen/{iso}/ADM1/geoBoundaries-{iso}-ADM1_simplified.geojson'
RDP_EPS = 0.012      # degrees (~1.3 km) — province outline smoothness / size trade-off
COORD_DP = 3         # ~110 m precision — plenty to draw a small map and bucket a place
RING_MIN_PTS = 4     # drop degenerate rings after simplification
VIEW_W = 680
PAD = 14


def fetch(iso):
    p = f'/tmp/mk_regions/{iso}.geojson'
    if not os.path.exists(p):
        os.makedirs('/tmp/mk_regions', exist_ok=True)
        urllib.request.urlretrieve(SRC.format(iso=iso), p)
    return json.load(open(p))


def polys_of(geom):
    """Return a list of polygons; each polygon is [exterior_ring, *hole_rings]."""
    if geom['type'] == 'Polygon':
        return [geom['coordinates']]
    if geom['type'] == 'MultiPolygon':
        return geom['coordinates']
    return []


def ring_area(ring):
    a = 0.0
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]; x2, y2 = ring[i + 1]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2.0


def perp(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)
    t = max(0, min(1, t))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


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


def point_in_ring(pt, ring):
    x, y = pt; inside = False; n = len(ring); j = n - 1
    for i in range(n):
        xi, yi = ring[i]; xj, yj = ring[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside


def poly_label(poly_rings_ll):
    """Pole of inaccessibility of the largest polygon, in lng/lat — a label point
    guaranteed to sit inside a wide part of the province."""
    ext = poly_rings_ll[0]; holes = poly_rings_ll[1:]
    xs = [p[0] for p in ext]; ys = [p[1] for p in ext]
    minx, maxx, miny, maxy = min(xs), max(xs), min(ys), max(ys)
    edges = [(r[i], r[i + 1]) for r in poly_rings_ll for i in range(len(r) - 1)]

    def sdist(p):
        if not point_in_ring(p, ext):
            return -1
        for h in holes:
            if point_in_ring(p, h):
                return -1
        return min(perp(p, a, b) for a, b in edges) if edges else 0

    best = ((minx + maxx) / 2, (miny + maxy) / 2); bestd = -1
    N = 40
    for i in range(N + 1):
        for k in range(N + 1):
            p = (minx + (maxx - minx) * i / N, miny + (maxy - miny) * k / N)
            d = sdist(p)
            if d > bestd:
                bestd, best = d, p
    step = max(maxx - minx, maxy - miny) / N
    for _ in range(5):
        cx, cy = best
        for dx in (-step, -step / 2, 0, step / 2, step):
            for dy in (-step, -step / 2, 0, step / 2, step):
                p = (cx + dx, cy + dy); d = sdist(p)
                if d > bestd:
                    bestd, best = d, p
        step /= 2
    return [round(best[0], COORD_DP), round(best[1], COORD_DP)]


def clean_name(name):
    n = (name or '').strip()
    for suf in (' Province', ' province'):
        if n.endswith(suf):
            n = n[: -len(suf)]
    return n or 'Region'


def simplify_poly(poly):
    """Simplify each ring of one polygon; drop rings that collapse. Returns list of
    lng/lat rings (exterior first), rounded to COORD_DP."""
    out = []
    for ri, ring in enumerate(poly):
        simp = rdp(ring, RDP_EPS)
        if len(simp) < RING_MIN_PTS:
            # keep the exterior even if tiny; drop tiny holes
            if ri == 0 and len(simp) >= 3:
                pass
            else:
                continue
        out.append([[round(x, COORD_DP), round(y, COORD_DP)] for x, y in simp])
    return out


total_pts = 0
summary = []
for cc, iso in COUNTRIES:
    geo = fetch(iso)
    provinces = []
    all_xy = []
    seen_codes = {}
    for feat in geo['features']:
        props = feat['properties']
        name = clean_name(props.get('shapeName'))
        code = (props.get('shapeISO') or '').strip()
        if not code:
            code = cc.upper() + '-' + ''.join(ch for ch in name.upper() if ch.isalnum())[:4]
        # de-dupe repeated codes (a couple of geoBoundaries files reuse blanks)
        if code in seen_codes:
            seen_codes[code] += 1
            code = f'{code}-{seen_codes[code]}'
        else:
            seen_codes[code] = 0
        polys = []
        for poly in polys_of(feat['geometry']):
            sp = simplify_poly(poly)
            if sp and len(sp[0]) >= 3:
                polys.append(sp)
                for ring in sp:
                    all_xy.extend(ring)
        if not polys:
            continue
        # largest polygon (by exterior area) drives the label placement
        big = max(polys, key=lambda p: ring_area(p[0]))
        label = poly_label(big)
        provinces.append({'code': code, 'name': name, 'label': label, 'polys': polys})

    xs = [p[0] for p in all_xy]; ys = [p[1] for p in all_xy]
    minlng, maxlng, minlat, maxlat = min(xs), max(xs), min(ys), max(ys)
    midlat = math.radians((minlat + maxlat) / 2)
    kx = math.cos(midlat)
    raw_w = (maxlng - minlng) * kx
    raw_h = (maxlat - minlat)
    scale = (VIEW_W - 2 * PAD) / raw_w
    view_h = round(raw_h * scale + 2 * PAD)
    proj = {'minlng': round(minlng, 4), 'maxlat': round(maxlat, 4),
            'kx': round(kx, 6), 'scale': round(scale, 4), 'pad': PAD}

    pts = sum(len(r) for pr in provinces for poly in pr['polys'] for r in poly)
    total_pts += pts
    const = f'REGIONS_{cc.upper()}'
    body = json.dumps({'cc': cc, 'viewBox': f'0 0 {VIEW_W} {view_h}', 'proj': proj,
                       'provinces': provinces}, separators=(',', ':'), ensure_ascii=False)
    out = (
        f"// AUTO-GENERATED by scripts/build_regions.py — do not edit by hand.\n"
        f"// Province/ADM1 outlines © OpenStreetMap contributors (ODbL) via geoBoundaries\n"
        f"// (Runfola et al., 2020), simplified + self-hosted so the map needs no network.\n"
        f"export const {const} = {body};\n"
    )
    dest = os.path.join(os.path.dirname(__file__), '..', 'js', 'data', f'regions.{cc}.js')
    open(dest, 'w').write(out)
    size = len(out)
    summary.append(f'  {cc}: {len(provinces)} provinces, {pts} pts, {size // 1024} KB -> {dest}')

print(f'wrote 4 region files, ~{total_pts} points total')
for s in summary:
    print(s)
