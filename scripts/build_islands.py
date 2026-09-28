#!/usr/bin/env python3
"""Build js/data/islands.geo.js — the outline of every inhabited or visited island in Thailand,
Vietnam, Cambodia and Laos, so the app knows when there is water between a traveller and a
hospital.

WHY THIS EXISTS. The emergency screen measured every hospital by straight-line distance and
turned it into a road or walking time. On Koh Mak that produced "Koh Kood Hospital, 30 min-1h by
road" — a hospital on another island, with no road to it — and a 19-minute walk to the island's
health centre framed as "not for an emergency", on an island where that centre is the first stop
for one. Nothing in the app knew what an island was: the basemap is simplified far below the
size of Koh Mak.

WHAT IT PRODUCES. One outline per island, simplified to a tolerance scaled to the island's size,
plus a road-group id. Islands joined to each other by a road bridge share a group (Koh Lanta Yai
and Noi, Don Det and Don Khon); an island joined to the MAINLAND by a road bridge or causeway is
left out altogether, because for this purpose it is mainland (Phuket).

WHICH ISLANDS. OpenStreetMap maps about 8,000 place=island|islet features in the four countries,
nearly all of them uninhabited rock. An island is kept when at least one of these lies inside
its outline: a place the app lists, a hospital, clinic or surgery, a ferry pier, an OSM
settlement (city, town, village, hamlet...), or an OSM place to stay (hotel, guest house,
resort, hostel...). That is the set a traveller can actually be standing on.

ROAD LINKS. For each island, the bridges, embankments and causeways within 25 m of its coast
are fetched and tested against the full-resolution outline: a way with one end on the island and
the other end off it is a crossing. Its far end decides the link — inside another kept island
joins the two into one group; anywhere else is the mainland. Piers mapped as bridges would fake
a mainland link, so the crossings are printed for review and MANUAL below overrides any that are
wrong, each with its reason.

Source: OpenStreetMap contributors, ODbL. Self-hosted so the emergency screen needs no network.

Usage:  python3 scripts/build_islands.py <cache-dir>
        (every Overpass response is cached in <cache-dir>; re-running resumes, never re-fetches)
"""
import glob
import json
import math
import os
import re
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'islands.geo.js')

UA = 'Mekonging/1.0 (offline travel app data build; https://github.com/SamuelLClemens)'
ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
]
# OSM area ids (3600000000 + relation id) — the same four scripts/build_outdoor_layers.py uses.
AREAS = {'th': 3602067731, 'vi': 3600049915, 'kh': 3600049898, 'la': 3600049903}
MOTOR = ('^(motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|'
         'living_street|road|track|motorway_link|trunk_link|primary_link|secondary_link|tertiary_link)$')

# Crossings the automatic test gets wrong, keyed by OSM island key. 'boat' forces an island to be
# kept as boat-only (a pier mapped as a bridge faked a mainland link); 'mainland' drops an island
# the test missed (a causeway mapped without bridge/embankment tags). Each entry says why.
MANUAL = {
    # Ferry-only, no road bridge exists — Bangkok Hospital's boat ambulance and the Laem Ngop
    # car ferries are the only way in or out (ExploreKohChang FAQ; Bangkok Hospital boat-ambulance
    # page). The flagged "bridge" is a 29 m concrete service-road span, almost certainly over a
    # drainage creek or the Salak Kok inlet, not a crossing to the mainland 4-6 km away.
    'relation/5660060': ('boat', 'Ko Chang: no mainland bridge (ferry/boat ambulance only)'),
    # Vietnam's third-largest island, reached only by ferry or flight from the mainland — the
    # absence of a bridge is precisely why it is promoted as an island destination. The flagged
    # way is tagged bridge=low_water_crossing (a ford, not a span over open water), 306 m long;
    # almost certainly a tidal-creek crossing near Rach Vem/Rach Tram on the island's own coast.
    'relation/12033833': ('boat', 'Phu Quoc: no mainland bridge; flagged way is a low-water ford, not a sea crossing'),
    # 15 nautical miles offshore from Sa Ky port, Quang Ngai; boat is the only way across (well
    # documented — its remoteness is the island's main tourism draw). The flagged way is a small,
    # generically-named 54 m "Cau ban BTCT" (reinforced-concrete slab bridge), the standard OSM
    # naming for a minor creek/harbour-channel bridge, not a named sea crossing.
    'way/860597998': ('boat', 'Ly Son: no mainland bridge, boat only from Sa Ky'),
    # Don Khong (grouped with Don San by an inter-island bridge) is reached from the mainland by
    # ferry, not a road bridge: travelfish.org's Don Khong guide describes "a ferry connection to
    # Don Khong" from the mainland port and "a ferry connection to Don Som", with no bridge to the
    # mainland mentioned anywhere. The flagged 731 m tertiary way most likely reaches an
    # uninhabited mid-river sandbar with no presence point of its own, not the true west bank.
    'way/23793235': ('boat', 'Don Khong: ferry to the mainland, no road bridge (travelfish.org)'),
}


# ---- Overpass ------------------------------------------------------------------------------

def overpass(query, rounds=4):
    """POST a query and return parsed JSON, rotating mirrors before backing off. Load-shedding
    is the normal failure (an HTML 'too busy' page instead of JSON), not a broken query."""
    last = None
    for attempt in range(rounds):
        for endpoint in ENDPOINTS:
            proc = subprocess.run(['curl', '-s', '--max-time', '600', '-A', UA,
                                   '--data-urlencode', 'data=' + query, endpoint],
                                  capture_output=True, text=True, check=False)
            try:
                return json.loads(proc.stdout)
            except json.JSONDecodeError:
                last = f'{endpoint}: {proc.stdout[:120]!r}'
                print(f'    {last}', file=sys.stderr, flush=True)
        if attempt < rounds - 1:
            time.sleep(30 * (attempt + 1))
    raise RuntimeError(f'overpass failed on every mirror: {last}')


def cached(path, fetch):
    if os.path.exists(path) and os.path.getsize(path) > 2:
        return json.load(open(path, encoding='utf-8'))
    data = fetch()
    json.dump(data, open(path, 'w', encoding='utf-8'), ensure_ascii=False)
    return data


# ---- geometry --------------------------------------------------------------------------------

def assemble_rings(members):
    """Join way geometries ([[lat, lon], ...]) end to end into closed rings."""
    segs = [list(m) for m in members if len(m) >= 2]
    rings = []
    while segs:
        cur = segs.pop(0)
        for _ in range(100000):
            if cur[0] == cur[-1]:
                break
            end = cur[-1]
            hit = None
            for i, s in enumerate(segs):
                if s[0] == end:
                    hit = (i, s)
                    break
                if s[-1] == end:
                    hit = (i, s[::-1])
                    break
            if hit is None:
                break
            segs.pop(hit[0])
            cur.extend(hit[1][1:])
        if len(cur) >= 4 and cur[0] == cur[-1]:
            rings.append(cur)
    return rings


def pip(lat, lng, ring):
    inside = False
    j = len(ring) - 1
    for i in range(len(ring)):
        yi, xi = ring[i]
        yj, xj = ring[j]
        if (yi > lat) != (yj > lat) and lng < (xj - xi) * (lat - yi) / ((yj - yi) or 1e-12) + xi:
            inside = not inside
        j = i
    return inside


def in_rings(lat, lng, rings):
    return any(pip(lat, lng, r) for r in rings)


def _xy(p, lat0):
    return (p[1] * 111320.0 * math.cos(math.radians(lat0)), p[0] * 110540.0)


def seg_dist_m(p, a, b, lat0):
    px, py = _xy(p, lat0)
    ax, ay = _xy(a, lat0)
    bx, by = _xy(b, lat0)
    dx, dy = bx - ax, by - ay
    if dx == 0 and dy == 0:
        return math.hypot(px - ax, py - ay)
    t = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def ring_area_m2(ring):
    lat0 = ring[0][0]
    pts = [_xy(p, lat0) for p in ring]
    s = 0.0
    for i in range(len(pts) - 1):
        s += pts[i][0] * pts[i + 1][1] - pts[i + 1][0] * pts[i][1]
    return abs(s) / 2


def simplify(ring, tol_m):
    """Douglas-Peucker on a closed ring, split at the point farthest from the start."""
    if len(ring) <= 5:
        return ring
    lat0 = ring[0][0]
    far = max(range(len(ring)), key=lambda i: (ring[i][0] - ring[0][0]) ** 2 + (ring[i][1] - ring[0][1]) ** 2)

    def dp(pts):
        keep = {0, len(pts) - 1}
        stack = [(0, len(pts) - 1)]
        while stack:
            s, e = stack.pop()
            best, bi = -1.0, None
            for i in range(s + 1, e):
                d = seg_dist_m(pts[i], pts[s], pts[e], lat0)
                if d > best:
                    best, bi = d, i
            if bi is not None and best > tol_m:
                keep.add(bi)
                stack.append((s, bi))
                stack.append((bi, e))
        return [pts[i] for i in sorted(keep)]

    out = dp(ring[:far + 1])[:-1] + dp(ring[far:])
    if out[0] != out[-1]:
        out.append(out[0])
    return out if len(out) >= 4 else ring


# ---- presence: where a traveller can be standing -------------------------------------------

NUM = r'(-?\d+(?:\.\d+)?)'


def app_points():
    pts = []
    for f in glob.glob(os.path.join(ROOT, 'js', 'data', 'places.*.js')):
        s = open(f, encoding='utf-8').read()
        for m in re.finditer(r'"?coords"?\s*:\s*\{\s*"?lat"?\s*:\s*' + NUM + r'\s*,\s*"?lng"?\s*:\s*' + NUM, s):
            pts.append((float(m.group(1)), float(m.group(2))))
    for cc in AREAS:
        s = open(os.path.join(ROOT, 'js', 'data', f'hospitals.{cc}.js'), encoding='utf-8').read()
        for m in re.finditer(r'\["(?:[^"\\]|\\.)*",\s*' + NUM + r',\s*' + NUM + r',\s*\d', s):
            pts.append((float(m.group(1)), float(m.group(2))))
    for f in ('hospitals.curated.js', 'ferries.js'):
        s = open(os.path.join(ROOT, 'js', 'data', f), encoding='utf-8').read()
        for m in re.finditer(r'lat:\s*' + NUM + r',\s*lng:\s*' + NUM, s):
            pts.append((float(m.group(1)), float(m.group(2))))
    return pts


def main(cache):
    os.makedirs(cache, exist_ok=True)

    # 1. Every island in each country, tags and bounding box only.
    index = {}
    for cc, aid in AREAS.items():
        q = (f'[out:json][timeout:180];area({aid})->.a;(way["place"~"^(island|islet)$"](area.a);'
             f'relation["place"~"^(island|islet)$"](area.a););out ids tags center bb;')
        index[cc] = cached(os.path.join(cache, f'index_{cc}.json'), lambda q=q: overpass(q)['elements'])
    print('islands in OSM:', {cc: len(v) for cc, v in index.items()})

    # 2. Settlements and places to stay, per country.
    pts = app_points()
    for cc, aid in AREAS.items():
        q = (f'[out:json][timeout:240];area({aid})->.a;('
             f'node["place"~"^(city|town|village|hamlet|suburb|neighbourhood|isolated_dwelling|locality)$"](area.a);'
             f'node["tourism"~"^(hotel|guest_house|resort|hostel|motel|chalet|apartment|camp_site)$"](area.a);'
             f'way["tourism"~"^(hotel|guest_house|resort|hostel|motel|chalet|apartment|camp_site)$"](area.a);'
             f');out center qt;')

        def fetch(q=q):
            out = []
            for e in overpass(q)['elements']:
                c = e.get('center') or e
                if c.get('lat') is not None:
                    out.append([round(c['lat'], 5), round(c['lon'], 5)])
            return out
        pts.extend(tuple(p) for p in cached(os.path.join(cache, f'presence_{cc}.json'), fetch))
    grid = {}
    for p in pts:
        grid.setdefault((int(p[0] * 20), int(p[1] * 20)), []).append(p)

    def points_in_bb(bb):
        for gi in range(int(bb['minlat'] * 20), int(bb['maxlat'] * 20) + 1):
            for gj in range(int(bb['minlon'] * 20), int(bb['maxlon'] * 20) + 1):
                for p in grid.get((gi, gj), ()):
                    if bb['minlat'] <= p[0] <= bb['maxlat'] and bb['minlon'] <= p[1] <= bb['maxlon']:
                        yield p

    cands = []
    for cc, els in index.items():
        for e in els:
            if e.get('bounds') and next(points_in_bb(e['bounds']), None):
                cands.append((cc, e))
    print('candidate islands (bounding box holds a presence point):', len(cands))

    # 3. Outlines for the candidates.
    geom_path = os.path.join(cache, 'geom.json')
    geom = json.load(open(geom_path)) if os.path.exists(geom_path) else {}
    ways = [str(e['id']) for cc, e in cands if e['type'] == 'way' and f"way/{e['id']}" not in geom]
    rels = [str(e['id']) for cc, e in cands if e['type'] == 'relation' and f"relation/{e['id']}" not in geom]
    for i in range(0, len(ways), 100):
        for e in overpass(f"[out:json][timeout:300];way(id:{','.join(ways[i:i + 100])});out geom;")['elements']:
            geom[f"way/{e['id']}"] = {'geometry': [[g['lat'], g['lon']] for g in e.get('geometry', [])]}
        json.dump(geom, open(geom_path, 'w'))
    for i in range(0, len(rels), 4):
        for e in overpass(f"[out:json][timeout:300];relation(id:{','.join(rels[i:i + 4])});out geom;")['elements']:
            geom[f"relation/{e['id']}"] = {'members': [
                {'role': m.get('role'), 'geometry': [[g['lat'], g['lon']] for g in m.get('geometry', [])]}
                for m in e.get('members', []) if m.get('type') == 'way']}
        json.dump(geom, open(geom_path, 'w'))

    islands = []
    for cc, e in cands:
        key = f"{e['type']}/{e['id']}"
        g = geom.get(key)
        if not g:
            continue
        if e['type'] == 'way':
            rings = assemble_rings([g['geometry']])
        else:
            rings = assemble_rings([m['geometry'] for m in g['members'] if m['role'] in ('outer', '')])
        rings = [r for r in rings if ring_area_m2(r) > 2000]
        if not rings:
            continue
        bb = e['bounds']
        if not any(in_rings(p[0], p[1], rings) for p in points_in_bb(bb)):
            continue
        t = e.get('tags', {})
        islands.append({'key': key, 'cc': cc, 'name': t.get('name:en') or t.get('name') or '',
                        'local': t.get('name') or '', 'bb': bb, 'rings': rings,
                        'area': sum(ring_area_m2(r) for r in rings)})
    print('islands with somebody on them:', len(islands))

    # 4. Road crossings: bridges, embankments and causeways at each coast.
    roads_path = os.path.join(cache, 'coast_roads_batch.json')
    roads = json.load(open(roads_path)) if os.path.exists(roads_path) else {'done': [], 'ways': {}}
    todo = [x['key'] for x in islands if x['key'] not in roads['done']]
    for i in range(0, len(todo), 12):
        batch = todo[i:i + 12]
        sel = []
        w = [k.split('/')[1] for k in batch if k.startswith('way/')]
        r = [k.split('/')[1] for k in batch if k.startswith('relation/')]
        if w:
            sel.append(f"way(id:{','.join(w)});")
        if r:
            sel.append(f"rel(id:{','.join(r)});way(r);")
        q = (f"[out:json][timeout:500];({''.join(sel)})->.coast;("
             f"way(around.coast:25)[highway~\"{MOTOR}\"][bridge];"
             f"way(around.coast:25)[highway~\"{MOTOR}\"][embankment];"
             f"way(around.coast:25)[highway~\"{MOTOR}\"][man_made=causeway];);out geom tags;")
        for el in overpass(q)['elements']:
            roads['ways'][str(el['id'])] = {'tags': el.get('tags', {}),
                                            'g': [[p['lat'], p['lon']] for p in el.get('geometry', [])]}
        roads['done'].extend(batch)
        json.dump(roads, open(roads_path, 'w'))
        print(f'  coast roads: {len(roads["done"])}/{len(islands)} islands, {len(roads["ways"])} ways', flush=True)

    def island_of(lat, lng, skip=None):
        for x in islands:
            if x is skip:
                continue
            bb = x['bb']
            if bb['minlat'] <= lat <= bb['maxlat'] and bb['minlon'] <= lng <= bb['maxlon'] and in_rings(lat, lng, x['rings']):
                return x
        return None

    parent = {x['key']: x['key'] for x in islands}

    def find(k):
        while parent[k] != k:
            parent[k] = parent[parent[k]]
            k = parent[k]
        return k

    mainland = set()
    for x in islands:
        bb = x['bb']
        for wid, w in roads['ways'].items():
            g = w['g']
            if len(g) < 2:
                continue
            if not any(bb['minlat'] - 0.01 <= p[0] <= bb['maxlat'] + 0.01 and bb['minlon'] - 0.01 <= p[1] <= bb['maxlon'] + 0.01 for p in g):
                continue
            a_in = in_rings(g[0][0], g[0][1], x['rings'])
            b_in = in_rings(g[-1][0], g[-1][1], x['rings'])
            if a_in == b_in:
                continue      # both ends on this island (a creek bridge) or neither (not this island's)
            far = g[-1] if a_in else g[0]
            other = island_of(far[0], far[1], skip=x)
            label = f"{x['cc']} {x['name']} ({x['key']}) — way {wid} {w['tags'].get('highway')} {w['tags'].get('name', '')!r}"
            if other:
                print(f'  ISLAND LINK  {label} -> {other["name"]} ({other["key"]})')
                parent[find(x['key'])] = find(other['key'])
            else:
                print(f'  MAINLAND LINK {label} far end {far}')
                mainland.add(x['key'])

    for key, (verdict, why) in MANUAL.items():
        if verdict == 'boat':
            mainland.discard(key)
        elif verdict == 'mainland':
            mainland.add(key)
        print(f'  manual: {key} -> {verdict} ({why})')
    # A whole road group is mainland if any member is.
    mainland_groups = {find(k) for k in mainland}
    kept = [x for x in islands if find(x['key']) not in mainland_groups]
    dropped = [x for x in islands if find(x['key']) in mainland_groups]
    print('dropped as road-connected to the mainland:', ', '.join(sorted(f"{x['name']} ({x['cc']})" for x in dropped)))

    # 5. Simplify and emit.
    groups = {}
    rows = []
    total = 0
    for x in sorted(kept, key=lambda x: (x['cc'], x['name'])):
        tol = min(150.0, max(15.0, math.sqrt(x['area']) / 110.0))
        enc = []
        bb = x['bb']
        for ring in x['rings']:
            s = simplify(ring, tol)
            total += len(s)
            flat = []
            plat = plng = 0
            for lat, lng in s:
                ilat, ilng = round(lat * 1e4), round(lng * 1e4)
                flat.extend([ilat - plat, ilng - plng])
                plat, plng = ilat, ilng
            enc.append(flat)
        root = find(x['key'])
        members = [y for y in kept if find(y['key']) == root]
        g = groups.setdefault(root, len(groups) + 1) if len(members) > 1 else 0
        rows.append([x['key'], x['name'], x['local'] if x['local'] != x['name'] else 0, x['cc'], g, round(tol),
                     [round(bb['minlat'], 4), round(bb['minlon'], 4), round(bb['maxlat'], 4), round(bb['maxlon'], 4)], enc])
    header = (
        '// AUTO-GENERATED by scripts/build_islands.py — do not edit by hand.\n'
        '// Every inhabited or visited island in the four countries, from OpenStreetMap\n'
        '// (© OpenStreetMap contributors, ODbL), so the emergency screen knows when a hospital is across\n'
        '// the water. Islands road-bridged to the mainland are omitted: for this purpose they are mainland.\n'
        '//\n'
        '// Row: [osmKey, name, localName|0, cc, roadGroup, simplifyToleranceM, [minLat, minLng, maxLat, maxLng], rings]\n'
        '// roadGroup: 0 = on its own; islands sharing a non-zero group are joined by a road bridge.\n'
        '// rings: one flat array per outer ring of delta-encoded 1e-4 degree integers —\n'
        '// [lat0, lng0, dLat1, dLng1, ...]; decode with a running sum and divide by 1e4.\n'
    )
    body = 'export const ISLAND_ROWS = [\n' + ',\n'.join(json.dumps(r, ensure_ascii=False, separators=(',', ':')) for r in rows) + '\n];\n'
    open(OUT, 'w', encoding='utf-8').write(header + body)
    print(f'wrote {OUT}: {len(rows)} islands, {total} points, {os.path.getsize(OUT):,} bytes')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
