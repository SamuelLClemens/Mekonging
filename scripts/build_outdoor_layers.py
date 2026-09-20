#!/usr/bin/env python3
"""Build the outdoor map layers from OpenStreetMap: hiking trails, bike paths, and the
scenic points (viewpoints + waterfalls) a trail usually leads to.

Unlike scripts/build_bus_osm.py, which takes hand-exported TSVs because Overpass was
unreachable from this machine at the time, this script queries Overpass directly. The
earlier failures were 406s from sending no User-Agent; a real one is accepted.

WHAT IS AND IS NOT INCLUDED, AND WHY.

  Hiking trails = `route=hiking` relations (the named treks — Doi Inthanon's summit trail,
  the Kep circuit) PLUS `highway=path`/`highway=track` ways that carry a NAME. The name
  filter is the whole quality gate: SE Asia has hundreds of thousands of unnamed paths,
  most of them field edges and motorbike shortcuts that would bury the real trails in
  noise and blow the file size past anything a phone should download. A named path is one
  somebody cared enough to name, which is a decent proxy for "a traveller could follow it".
  Region-wide that is ~1,400 ways + ~30 relations, not ~300,000.

  Bike paths = `highway=cycleway` ways plus `route=bicycle` relations plus ways tagged
  `bicycle=designated`. No name filter here: a cycleway is already an explicit, deliberate
  tag (somebody built a bike path), so the tag itself is the quality gate that `name` has
  to do for paths.

  Scenic = `tourism=viewpoint` and waterfalls (`natural=waterfall`, `waterway=waterfall`).
  These are the reason most of the trails above exist, and they are the single most
  requested "what is worth walking to" answer. Toilets and drinking water were measured
  (~4,000 and sparse) and deliberately left out: useful, but not the same category, and
  every extra layer is another chip competing for the same 375px of screen.

  Train stations are NOT here — that is a transport layer alongside buses, not an outdoor
  one, and it wants the bus layer's fare/route treatment rather than this file's.

GEOMETRY IS SIMPLIFIED. Raw OSM way geometry is far denser than a phone map needs: the
lines are drawn at zoom 19 at most, where ~4 m of positional error is a third of a pixel.
Douglas-Peucker at 4 m typically removes 55-70% of the points with no visible change to
the drawn line. Coordinates are rounded to 5 decimal places (~1.1 m) for the same reason
every other generated file in js/data/ does.

Usage:
  python3 scripts/build_outdoor_layers.py            # all layers, all four countries
  python3 scripts/build_outdoor_layers.py --layer trails --cc la
"""
import argparse
import json
import math
import os
import re
import subprocess
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT_DIR = os.path.join(ROOT, 'js', 'data')

# Several mirrors, tried in turn. The main instance regularly answers a heavy `out geom`
# query with "Dispatcher_Client::request_read_and_idx::timeout. The server is probably too
# busy" — a load-shedding message, not a problem with the query, and a different mirror
# usually answers the identical query immediately.
ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
]
# Overpass returns 406 Not Acceptable to a request with no User-Agent. Anything descriptive
# is accepted; this one names the project so an Overpass admin can identify the traffic.
UA = 'Mekonging/1.0 (offline travel app data build; https://github.com/SamuelLClemens)'

# OSM area ids (3600000000 + relation id), resolved from ISO3166-1 on the admin_level=2
# relations. Re-derive with:
#   relation["ISO3166-1"~"^(TH|VN|KH|LA)$"][admin_level=2];out ids tags;
AREAS = {
    'th': 3602067731,
    'vi': 3600049915,
    'kh': 3600049898,
    'la': 3600049903,
}
COUNTRY_NAME = {'th': 'Thailand', 'vi': 'Vietnam', 'kh': 'Cambodia', 'la': 'Laos'}

# Rounded to ~1.1 m, matching every other generated coordinate file in js/data/.
PRECISION = 5
# Douglas-Peucker tolerance in metres. See the module docstring for why 4 m is safe here.
SIMPLIFY_M = 4.0
# A line shorter than this is a driveway stub or a mapping artefact, not a trail worth a
# traveller's attention, and thousands of them are what make an unfiltered extract useless.
MIN_LEN_M = 60.0


# ---- Overpass ---------------------------------------------------------------------------

def _short_error(body):
    """Overpass reports overload as an HTML page, not JSON. Pull the human sentence out of
    it so a build log says "server too busy" instead of 600 bytes of doctype."""
    match = re.search(r'Error</strong>:\s*(.*?)</p>', body, re.S)
    text = match.group(1) if match else body
    return ' '.join(text.split())[:160]


def overpass(query, rounds=3):
    """POST a query and return parsed JSON, rotating mirrors and then backing off.

    Load-shedding is the normal failure here, not a broken query, so every mirror is tried
    before any sleep: the second mirror usually answers the identical query at once."""
    last = None
    for attempt in range(rounds):
        for endpoint in ENDPOINTS:
            try:
                proc = subprocess.run(
                    ['curl', '-s', '--max-time', '900', '-A', UA,
                     '--data-urlencode', 'data=' + query, endpoint],
                    capture_output=True, text=True, check=False)
                if proc.returncode != 0:
                    last = f'{endpoint}: curl exit {proc.returncode}'
                    continue
                try:
                    return json.loads(proc.stdout)
                except json.JSONDecodeError:
                    last = f'{endpoint}: {_short_error(proc.stdout)}'
            except Exception as exc:  # noqa: BLE001 - surfaced below with the query
                last = f'{endpoint}: {exc!r}'
            print(f'    {last}', file=sys.stderr)
        if attempt < rounds - 1:
            wait = 45 * (attempt + 1)
            print(f'    all mirrors busy; waiting {wait}s', file=sys.stderr)
            time.sleep(wait)
    raise RuntimeError(f'overpass failed on every mirror: {last}')


# ---- geometry ----------------------------------------------------------------------------

def _perp_m(p, a, b):
    """Perpendicular distance from p to segment a-b, in metres, in a local flat projection.
    Fine at these latitudes over the length of a single way."""
    lat0 = math.radians(a[0])
    mx = 111320.0 * math.cos(lat0)
    my = 110540.0
    ax, ay = a[1] * mx, a[0] * my
    bx, by = b[1] * mx, b[0] * my
    px, py = p[1] * mx, p[0] * my
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def simplify(pts, tol):
    """Iterative Douglas-Peucker. Iterative rather than recursive because a long OSM way can
    be thousands of points deep and CPython's recursion limit is not worth fighting."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        lo, hi = stack.pop()
        if hi <= lo + 1:
            continue
        worst, wi = -1.0, -1
        for i in range(lo + 1, hi):
            d = _perp_m(pts[i], pts[lo], pts[hi])
            if d > worst:
                worst, wi = d, i
        if worst > tol:
            keep[wi] = True
            stack.append((lo, wi))
            stack.append((wi, hi))
    return [p for p, k in zip(pts, keep) if k]


def length_m(pts):
    total = 0.0
    for i in range(1, len(pts)):
        lat0 = math.radians(pts[i - 1][0])
        dx = (pts[i][1] - pts[i - 1][1]) * 111320.0 * math.cos(lat0)
        dy = (pts[i][0] - pts[i - 1][0]) * 110540.0
        total += math.hypot(dx, dy)
    return total


def round_pts(pts):
    return [[round(p[0], PRECISION), round(p[1], PRECISION)] for p in pts]


def dedupe_consecutive(pts):
    out = []
    for p in pts:
        if not out or p != out[-1]:
            out.append(p)
    return out


# ---- line layers (trails, bike) -----------------------------------------------------------

TRAIL_QUERY = """[out:json][timeout:900];
area({area})->.a;
(
  way[highway=path][name](area.a);
  way[highway=track][name](area.a);
  way[highway=footway][name][sac_scale](area.a);
  relation[route=hiking][name](area.a);
);
out geom;"""

BIKE_QUERY = """[out:json][timeout:900];
area({area})->.a;
(
  way[highway=cycleway](area.a);
  way[bicycle=designated][highway!=cycleway](area.a);
  relation[route=bicycle](area.a);
);
out geom;"""


def collect_lines(elements):
    """Flatten Overpass `out geom` output into named polylines.

    A relation arrives with its member ways' geometry inline, so a named trek contributes
    one entry per member way, all sharing the relation's name. That is deliberate: stitching
    members into a single ordered LineString needs correct role/direction handling that OSM
    route relations in this region frequently do not have, and a broken stitch draws a line
    leaping across the country. Separate segments draw correctly either way."""
    out = []
    for el in elements:
        name = (el.get('tags') or {}).get('name', '')
        if el['type'] == 'way':
            geom = el.get('geometry')
            if geom:
                out.append((name, [[g['lat'], g['lon']] for g in geom]))
        elif el['type'] == 'relation':
            for mem in el.get('members', []):
                geom = mem.get('geometry')
                if mem.get('type') == 'way' and geom:
                    out.append((name, [[g['lat'], g['lon']] for g in geom]))
    return out


def build_line_layer(cc, kind, query_tpl):
    print(f'  {cc} {kind}: querying overpass…')
    data = overpass(query_tpl.format(area=AREAS[cc]))
    raw = collect_lines(data.get('elements', []))
    print(f'  {cc} {kind}: {len(raw)} raw segments')

    rows, raw_pts, kept_pts, dropped_short = [], 0, 0, 0
    seen = set()
    for name, pts in raw:
        pts = dedupe_consecutive(round_pts(pts))
        if len(pts) < 2:
            continue
        raw_pts += len(pts)
        if length_m(pts) < MIN_LEN_M:
            dropped_short += 1
            continue
        pts = dedupe_consecutive(simplify(pts, SIMPLIFY_M))
        if len(pts) < 2:
            continue
        # Relations repeat member ways that are also matched as standalone ways; the
        # geometry key collapses those without needing OSM ids on both sides.
        key = (pts[0][0], pts[0][1], pts[-1][0], pts[-1][1], len(pts))
        if key in seen:
            continue
        seen.add(key)
        kept_pts += len(pts)
        rows.append([name, pts])

    print(f'  {cc} {kind}: {len(rows)} segments kept '
          f'({dropped_short} under {MIN_LEN_M:.0f} m dropped), '
          f'{raw_pts} -> {kept_pts} points '
          f'({100 - (100 * kept_pts // max(raw_pts, 1))}% removed)')
    return rows


# ---- point layer (scenic) -----------------------------------------------------------------

SCENIC_QUERY = """[out:json][timeout:900];
area({area})->.a;
(
  node[tourism=viewpoint](area.a);
  node[natural=waterfall](area.a);
  node[waterway=waterfall](area.a);
  way[natural=waterfall](area.a);
  way[waterway=waterfall](area.a);
);
out center tags;"""


def build_scenic(cc):
    print(f'  {cc} scenic: querying overpass…')
    data = overpass(SCENIC_QUERY.format(area=AREAS[cc]))
    rows, seen = [], set()
    for el in data.get('elements', []):
        tags = el.get('tags') or {}
        if el['type'] == 'node':
            lat, lon = el.get('lat'), el.get('lon')
        else:
            centre = el.get('center') or {}
            lat, lon = centre.get('lat'), centre.get('lon')
        if lat is None or lon is None:
            continue
        lat, lon = round(lat, PRECISION), round(lon, PRECISION)
        is_fall = 'waterfall' in (tags.get('natural', ''), tags.get('waterway', ''))
        kind = 'w' if is_fall else 'v'
        key = (lat, lon, kind)
        if key in seen:
            continue
        seen.add(key)
        name = tags.get('name:en') or tags.get('name') or ''
        rows.append([lat, lon, name, kind])
    rows.sort(key=lambda r: (r[0], r[1]))
    falls = sum(1 for r in rows if r[3] == 'w')
    print(f'  {cc} scenic: {len(rows)} points ({falls} waterfalls, {len(rows) - falls} viewpoints)')
    return rows


# ---- emit -----------------------------------------------------------------------------------

HEADER = """// {title} for {country}.
// Generated by scripts/build_outdoor_layers.py - do not edit by hand.
// OpenStreetMap contributors, ODbL 1.0. Fetched {date}.
//
// {note}
"""


def write_js(path, header, exports):
    with open(path, 'w', encoding='utf-8') as f:
        f.write(header)
        for name, value in exports:
            f.write(f'\nexport const {name} = ')
            json.dump(value, f, ensure_ascii=False, separators=(',', ':'))
            f.write(';\n')
    print(f'  wrote {os.path.relpath(path, ROOT)} '
          f'({os.path.getsize(path) / 1024:.0f} KB)')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--layer', choices=['trails', 'bike', 'scenic', 'all'], default='all')
    ap.add_argument('--cc', choices=list(AREAS) + ['all'], default='all')
    args = ap.parse_args()

    today = time.strftime('%Y-%m-%d')
    ccs = list(AREAS) if args.cc == 'all' else [args.cc]
    layers = ['trails', 'bike', 'scenic'] if args.layer == 'all' else [args.layer]

    for cc in ccs:
        country = COUNTRY_NAME[cc]
        if 'trails' in layers or 'bike' in layers:
            hike = build_line_layer(cc, 'trails', TRAIL_QUERY) if 'trails' in layers else None
            bike = build_line_layer(cc, 'bike', BIKE_QUERY) if 'bike' in layers else None
            path = os.path.join(OUT_DIR, f'trails.{cc}.js')
            # Both line layers share one file per country: a traveller who turns on one
            # usually turns on the other, and two files would double the request count for
            # no benefit on a connection where request count is what actually costs time.
            exports = []
            if hike is not None:
                exports.append((f'TRAILS_HIKE_{cc.upper()}', hike))
            if bike is not None:
                exports.append((f'TRAILS_BIKE_{cc.upper()}', bike))
            write_js(path, HEADER.format(
                title='Hiking trails and bike paths', country=country, date=today,
                note=('Rows are [name, [[lat, lng], ...]]. Named paths/tracks and hiking\n'
                      '// route relations for hiking; cycleways and bicycle=designated ways for bike.\n'
                      '// Geometry simplified to 4 m (Douglas-Peucker); segments under 60 m dropped.'),
            ), exports)

        if 'scenic' in layers:
            rows = build_scenic(cc)
            write_js(os.path.join(OUT_DIR, f'scenic.{cc}.js'), HEADER.format(
                title='Viewpoints and waterfalls', country=country, date=today,
                note="Rows are [lat, lng, name, kind] where kind is 'v' (viewpoint) or 'w' (waterfall).",
            ), [(f'SCENIC_{cc.upper()}', rows)])


if __name__ == '__main__':
    main()
