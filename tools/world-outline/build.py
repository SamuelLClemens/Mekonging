#!/usr/bin/env python3
"""Build the world outline and the country names for slice F7b (the country a fix is in, outside the four countries).

usage: python3 -I tools/world-outline/build.py <ne_50m_admin_0_countries.geojson> [repo-root]
Writes js/data/world-outline.js (WORLD_OUTLINE) and js/data/world-names.js (WORLD_NAMES), both lazy data modules.
The source is Natural Earth's 50m admin-0 countries (public domain), github.com/nvkelso/natural-earth-vector, folder
geojson. Never commit the source file: download it into its own new directory under ~/Library/Caches/.

The simplification is decision 26's, measured 2026-10-27 and ruled by the owner: Douglas-Peucker at 0.05 degrees
(about 5.5 km), two decimals, 469.9 KB. Each shared border is simplified once, so neighbours keep one border with no
gap. `id` is the lowercase ISO 3166-1 alpha-2 code (ISO_A2_EH; ISO_A2 is -99 for France, Norway and Kosovo). Three
features have no code and keep Natural Earth's own: sol (Somaliland), cyn (Northern Cyprus), kas (Siachen Glacier).
Traps: `vi` here is the US Virgin Islands, and Vietnam is `vn`, while this app's own id for Vietnam is `vi`
(js/emergency-world.js maps it); Ashmore and Cartier and the Indian Ocean Territories share Australia's `au`.
"""
import gzip, json, math, os, sys

def code_of(props):
    c = props.get('ISO_A2_EH')
    if c in (None, '-99'):
        c = props.get('ADM0_A3')
    return str(c).lower()


def feature_polys(f):
    g = f['geometry']
    return [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']


def dp(pts, tol):
    """Douglas-Peucker on an open polyline; ends fixed. Iterative, planar degrees."""
    n = len(pts)
    if n < 3 or tol <= 0:
        return list(pts)
    keep = [False] * n
    keep[0] = keep[-1] = True
    stack = [(0, n - 1)]
    while stack:
        a, b = stack.pop()
        ax, ay = pts[a]
        bx, by = pts[b]
        dx, dy = bx - ax, by - ay
        den = dx * dx + dy * dy
        best, bi = -1.0, -1
        for i in range(a + 1, b):
            px, py = pts[i]
            if den == 0:
                d = math.hypot(px - ax, py - ay)
            else:
                t = ((px - ax) * dx + (py - ay) * dy) / den
                t = 0 if t < 0 else 1 if t > 1 else t
                d = math.hypot(px - (ax + t * dx), py - (ay + t * dy))
            if d > best:
                best, bi = d, i
        if best > tol:
            keep[bi] = True
            stack.append((a, bi))
            stack.append((bi, b))
    return [p for p, k in zip(pts, keep) if k]


def simplify(fc, tol):
    feats = fc['features']
    owners = {}  # vertex -> set of feature indexes
    for fi, f in enumerate(feats):
        for poly in feature_polys(f):
            for ring in poly:
                for p in ring:
                    owners.setdefault((p[0], p[1]), set()).add(fi)
    cache = {}
    out_feats = []

    def diag_of(ring):
        xs = [p[0] for p in ring]
        ys = [p[1] for p in ring]
        return math.hypot(max(xs) - min(xs), max(ys) - min(ys))

    for fi, f in enumerate(feats):
        raw = feature_polys(f)
        big = max(range(len(raw)), key=lambda i: diag_of(raw[i][0]))
        polys_out = []
        for pi, poly in enumerate(raw):
            rings_out = []
            for ri, ring in enumerate(poly):
                r = simplify_ring([(p[0], p[1]) for p in ring], owners, tol, cache)
                if r is not None:
                    rings_out.append(r)
                elif ri == 0:
                    rings_out = []
                    break  # outer ring collapsed: drop the polygon and its holes
            if pi != big and rings_out and diag_of(rings_out[0]) < 2 * tol:
                rings_out = []  # an island smaller than twice the tolerance
            if not rings_out and pi == big:
                rings_out = [[(p[0], p[1]) for p in poly[0]]]  # every feature keeps its largest polygon, unsimplified
            if rings_out:
                polys_out.append(rings_out)
        out_feats.append((code_of(f['properties']), f['properties'].get('NAME'), polys_out))
    return out_feats


def edge_owner(a, b, owners):
    return frozenset(owners[a] & owners[b])


def simplify_ring(ring, owners, tol, cache):
    pts = ring[:-1] if ring[0] == ring[-1] else ring[:]
    n = len(pts)
    if n < 3:
        return None
    eo = [edge_owner(pts[i], pts[(i + 1) % n], owners) for i in range(n)]
    # junctions: vertex i where edge i-1 and edge i have a different owner set
    junc = [i for i in range(n) if eo[i - 1] != eo[i]]
    arcs = []
    if not junc:
        # a closed ring with one owner set all the way round: cut it at two far-apart vertices
        a = min(range(n), key=lambda i: pts[i])  # same cut in a neighbour's reversed copy of this ring
        b = max(range(n), key=lambda i: ((pts[i][0] - pts[a][0]) ** 2 + (pts[i][1] - pts[a][1]) ** 2, pts[i]))
        if b == a:
            return None
        if a > b:
            a, b = b, a
        arcs = [(pts[a:b + 1], eo[a]), (pts[b:] + pts[:a + 1], eo[b])]
    else:
        for k, s in enumerate(junc):
            e = junc[(k + 1) % len(junc)]
            seg = pts[s:e + 1] if e > s else pts[s:] + pts[:e + 1]
            arcs.append((seg, eo[s]))
    res = []
    for seg, own in arcs:
        s = simp_arc(seg, own, tol, cache)
        res.extend(s if not res else s[1:])
    # drop consecutive duplicates (never remove the closing identity)
    clean = [res[0]]
    for p in res[1:]:
        if p != clean[-1]:
            clean.append(p)
    if clean[0] != clean[-1]:
        clean.append(clean[0])
    if len(clean) < 4:
        return None
    return clean


def simp_arc(seg, own, tol, cache):
    if len(own) > 1:  # shared border: one canonical direction so both neighbours get the same arc
        a, b = seg[0], seg[-1]
        fwd = a < b or (a == b and len(seg) > 2 and seg[1] <= seg[-2])
        base = seg if fwd else seg[::-1]
        key = (base[0], base[-1], len(base), base[1], base[-2])
        if key not in cache:
            cache[key] = dp(base, tol)
        r = cache[key]
        return r if fwd else r[::-1]
    return dp(seg, tol)


def round_feats(feats, decimals):
    out = []
    for code, name, polys in feats:
        np_ = []
        for poly in polys:
            rings = []
            for ring in poly:
                rr = []
                for x, y in ring:
                    q = (round(x, decimals), round(y, decimals))
                    if not rr or q != rr[-1]:
                        rr.append(q)
                if len(rr) >= 4 and rr[0] == rr[-1]:
                    rings.append(rr)
                elif ring is poly[0]:
                    rings = []
                    break
            if rings:
                np_.append(rings)
        out.append((code, name, np_))
    return out


def to_geojson(feats):
    fs = []
    for code, name, polys in feats:
        if not polys:
            continue
        if len(polys) == 1:
            g = {'type': 'Polygon', 'coordinates': [[list(p) for p in r] for r in polys[0]]}
        else:
            g = {'type': 'MultiPolygon', 'coordinates': [[[list(p) for p in r] for r in poly] for poly in polys]}
        fs.append({'type': 'Feature', 'properties': {'id': code}, 'geometry': g})
    return {'type': 'FeatureCollection', 'features': fs}


def stats(fc):
    nf = len(fc['features'])
    nr = nv = 0
    for f in fc['features']:
        g = f['geometry']
        polys = [g['coordinates']] if g['type'] == 'Polygon' else g['coordinates']
        for poly in polys:
            for r in poly:
                nr += 1
                nv += len(r)
    return nf, nr, nv


def pick_names(raw_features):
    """{id: display name}. NAME_LONG; where several features share an id the sovereign state's own feature names it."""
    best = {}
    for f in raw_features:
        p = f['properties']
        code = code_of(p)
        name = p.get('NAME_LONG') or p.get('NAME')
        rank = 0 if p.get('NAME') == p.get('SOVEREIGNT') or p.get('TYPE') in ('Sovereign country', 'Country') else 1
        if code not in best or rank < best[code][0]:
            best[code] = (rank, name)
    return {c: n for c, (r, n) in sorted(best.items())}


def write_js(path, header, const, value):
    txt = header + 'export const ' + const + ' = ' + json.dumps(value, separators=(',', ':'), ensure_ascii=False) + ';\n'
    with open(path, 'w', encoding='utf-8') as fh:
        fh.write(txt)
    return len(txt.encode()), len(gzip.compress(txt.encode(), 9))


def main():
    src = sys.argv[1]
    root = sys.argv[2] if len(sys.argv) > 2 else os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    tol, dec = 0.05, 2
    fc = json.load(open(src, encoding='utf-8'))
    feats = round_feats(simplify(fc, tol), dec)
    out = to_geojson(feats)
    note = ('Natural Earth ne_50m_admin_0_countries (public domain, github.com/nvkelso/natural-earth-vector), '
            'Douglas-Peucker %s deg, %d decimals.' % (tol, dec))
    data = os.path.join(root, 'js', 'data')
    raw, gz = write_js(os.path.join(data, 'world-outline.js'),
        '// Generated by tools/world-outline/build.py (slice F7b). ' + note + '\n'
        '// Lazy: only js/emergency-world.js imports it, never the eager graph. A GeoJSON FeatureCollection shaped like\n'
        '// js/data/basemap.js; property `id` is the lowercase ISO 3166-1 alpha-2 code (`vi` is the US Virgin Islands, Vietnam is `vn`).\n',
        'WORLD_OUTLINE', out)
    nf, nr, nv = stats(out)
    names = pick_names(fc['features'])
    nraw, ngz = write_js(os.path.join(data, 'world-names.js'),
        '// Generated by tools/world-outline/build.py (slice F7b). Natural Earth NAME_LONG per outline id; lazy, like world-outline.js.\n',
        'WORLD_NAMES', names)
    print(json.dumps({'outline': {'features': nf, 'rings': nr, 'vertices': nv, 'raw_bytes': raw, 'gzip_bytes': gz},
                      'names': {'count': len(names), 'raw_bytes': nraw, 'gzip_bytes': ngz}}))


if __name__ == '__main__':
    main()
