#!/usr/bin/env python3
"""Build js/data/hospitals.<cc>.js — every hospital, clinic and doctors' surgery in
Thailand, Vietnam, Cambodia and Laos, from OpenStreetMap.

WHY THIS EXISTS. js/data/medical.js is a hand-written list of ~136 facilities travellers
and embassies actually use, carrying capability tiers, notes and evacuation context that no
open dataset has. It is deliberately not exhaustive. This file is the other half: complete
coverage, so that "the nearest hospital" is a real answer from a village, a mountain pass or
a bus, not just from a city the curators happened to write about. The two are merged at
render time — a curated entry wins on name match and keeps its tier and note.

Source: OpenStreetMap contributors, ODbL. Self-hosted per the project's static-site rule:
an emergency screen must never depend on a live API.

Input:  the tile JSONs written by the scratchpad fetch_osm.py (Overpass, tiled + resumable).
Usage:  python3 scripts/build_hospitals.py <tile-dir>
"""
import json, math, os, re, sys

CCS = ['th', 'vi', 'kh', 'la']
KIND = {'hospital': 1, 'clinic': 2, 'doctors': 3}

# ---- NAME AND KIND CORRECTIONS ---------------------------------------------
# Two problems with taking OpenStreetMap's amenity=hospital at face value here.
#
# 1. TIER. Thailand tags its ~9,800 sub-district health-promoting hospitals (โรงพยาบาลส่งเสริม
#    สุขภาพตำบล, universally abbreviated รพ.สต.) as amenity=hospital. They are nurse-led posts
#    with no surgeon and usually no doctor. Vietnam does the same with commune health stations
#    (Trạm Y tế) and Laos with ສຸກສາລາ. Leaving them as kind=1 means the app's answer to
#    "closest hospital" is frequently a health post — which is fine for a fever and useless
#    for a fracture. They are kept, because they are real care and often the only care for
#    50 km, but reclassified as clinics so the hospital list means what it says.
#
# 2. READABILITY. Many are named only by the abbreviation, which tells a foreign traveller
#    nothing. The primary name is left EXACTLY as mapped — that string is what gets shown to a
#    driver — and the expansion goes in the English field, which is otherwise empty.
DOWNGRADE = [
    # (pattern, English gloss to use when name:en is missing)
    ('รพ.สต.', 'Sub-district health post'),
    ('โรงพยาบาลส่งเสริมสุขภาพตำบล', 'Sub-district health-promoting hospital'),
    ('สถานีอนามัย', 'Health station'),
    ('ศูนย์สุขภาพชุมชน', 'Community health centre'),
    ('ศูนย์บริการสาธารณสุข', 'Public health service centre'),
    ('สอน.', 'Health station'),
    ('ສຸກສາລາ', 'Health centre'),
    ('Trạm Y tế', 'Commune health station'),
    ('Tram Y te', 'Commune health station'),
    ('មណ្ឌលសុខភាព', 'Health centre'),
    ('health center', 'Health centre'),
    ('health centre', 'Health centre'),
    ('health post', 'Health post'),
    ('health station', 'Health station'),
    ('dispensary', 'Dispensary'),
]
# Read as a hospital even though the string matched a downgrade pattern above — a provincial
# or district hospital that happens to contain "health centre" in its name is still a hospital.
KEEP_HOSPITAL = ('provincial hospital', 'district hospital', 'general hospital', 'referral hospital',
                 'โรงพยาบาลศูนย์', 'โรงพยาบาลทั่วไป', 'bệnh viện', 'benh vien')


def classify(name, en, kind):
    """Returns (kind, english_gloss_or_empty). Never rewrites the primary name."""
    hay = f'{name} {en}'.lower()
    if any(k in hay for k in KEEP_HOSPITAL):
        return kind, ''
    for pat, gloss in DOWNGRADE:
        if pat.lower() in hay:
            return (max(kind, 2), gloss)
    return kind, ''


LETTERS = re.compile(r'[^\W\d_]', re.UNICODE)


def unreadable(name, en):
    """A name that is mostly digits and punctuation identifies nothing to anybody — a mapper's
    shorthand such as "อบ19". Dropped only when there is no English name to fall back on."""
    if en:
        return False
    return len(LETTERS.findall(name)) < 3


def load_provinces(cc):
    """Province polygons from the app's own self-hosted ADM1 data — the same geometry
    whereAmI() uses, so a hospital's country here agrees with the traveller's country there."""
    src = open(f'js/data/regions.{cc}.js', encoding='utf-8').read()
    m = re.search(r'=\s*(\{.*\});?\s*$', src, re.S)
    return json.loads(m.group(1))['provinces']


def point_in_ring(x, y, ring):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        xi, yi = ring[i][0], ring[i][1]
        xj, yj = ring[j][0], ring[j][1]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def in_province(prov, lng, lat):
    for poly in prov['polys']:
        if point_in_ring(lng, lat, poly[0]) and not any(point_in_ring(lng, lat, hole) for hole in poly[1:]):
            return True
    return False


# The province polygons are simplified to ~2 km (scripts/build_basemap.py's EPS), so a facility
# genuinely inside the country can fall a few hundred metres outside its own province outline —
# most often on a coast or a riverbank. Recovering those means allowing a small tolerance, and
# the tolerance has to be small: measured over the 1,449 points that fail a strict test, 49 sit
# within 1 km (Vietnamese and Cambodian names, all genuinely inside), while by 1-3 km the set is
# already dominated by Burmese-script clinics on the Myanmar side of the Thai border. 1 km buys
# back the artefacts without importing a neighbouring country.
EDGE_TOLERANCE_KM = 1.0


def seg_dist_km(px, py, ring):
    best = 1e9
    for i in range(len(ring) - 1):
        x1, y1 = ring[i]
        x2, y2 = ring[i + 1]
        dx, dy = x2 - x1, y2 - y1
        t = 0 if (dx == 0 and dy == 0) else max(0, min(1, ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)))
        cx, cy = x1 + t * dx, y1 + t * dy
        d = math.hypot((px - cx) * math.cos(math.radians(py)) * 111.32, (py - cy) * 110.57)
        if d < best:
            best = d
    return best


def near_province(prov, lng, lat, km):
    return any(seg_dist_km(lng, lat, poly[0]) <= km for poly in prov['polys'])


def bbox_of(prov):
    xs, ys = [], []
    for poly in prov['polys']:
        for x, y in poly[0]:
            xs.append(x); ys.append(y)
    return min(xs), min(ys), max(xs), max(ys)


def main(tile_dir):
    # IDEMPOTENCY: a complete set of outputs means there is nothing to do.
    if '--force' not in sys.argv and all(
            os.path.exists(f'js/data/hospitals.{cc}.js') and os.path.getsize(f'js/data/hospitals.{cc}.js') > 2000
            for cc in CCS):
        print('ok: already built (pass --force, or delete js/data/hospitals.*.js, to rebuild)')
        return 0

    provs = {}
    for cc in CCS:
        provs[cc] = [(p['name'], bbox_of(p), p) for p in load_provinces(cc)]
        print(f'  {cc}: {len(provs[cc])} provinces')

    seen = {}
    files = sorted(f for f in os.listdir(tile_dir) if f.endswith('.json'))
    for fn in files:
        try:
            data = json.load(open(os.path.join(tile_dir, fn)))
        except Exception:
            print(f'  skipping unreadable tile {fn}')
            continue
        for el in data.get('elements', []):
            t = el.get('tags') or {}
            kind = KIND.get(t.get('amenity')) or KIND.get(t.get('healthcare'))
            if not kind:
                continue
            c = el.get('center') or el
            lat, lng = c.get('lat'), c.get('lon')
            if lat is None or lng is None:
                continue
            key = f"{el.get('type', 'n')}{el.get('id')}"
            if key in seen:
                continue
            name = (t.get('name') or '').strip()
            name_en = (t.get('name:en') or '').strip()
            if not name and not name_en:
                continue          # an unnamed point cannot be asked for or searched
            primary = name or name_en
            english = name_en if (name_en and name_en != name) else ''
            if unreadable(primary, english):
                continue          # a mapper's shorthand identifies nothing to anybody
            kind, gloss = classify(primary, english, kind)
            seen[key] = {
                'lat': round(float(lat), 4), 'lng': round(float(lng), 4),
                'name': primary, 'en': english or gloss,
                'k': kind, 'er': 1 if t.get('emergency') == 'yes' else 0,
            }

    print(f'  {len(seen)} named health facilities in the region')

    # Assign a country by point-in-province, bbox-gated so this stays fast over ~6k points.
    buckets = {cc: [] for cc in CCS}
    outside = recovered = 0
    for rec in seen.values():
        hit = None
        for cc in CCS:
            for _, (x0, y0, x1, y1), prov in provs[cc]:
                if not (x0 <= rec['lng'] <= x1 and y0 <= rec['lat'] <= y1):
                    continue
                if in_province(prov, rec['lng'], rec['lat']):
                    hit = cc
                    break
            if hit:
                break
        # Second pass, only for what the strict test rejected: allow the simplification
        # tolerance. Restricted to a padded bbox so this never scans the whole world.
        if not hit:
            for cc in CCS:
                for _, (x0, y0, x1, y1), prov in provs[cc]:
                    if not (x0 - 0.05 <= rec['lng'] <= x1 + 0.05 and y0 - 0.05 <= rec['lat'] <= y1 + 0.05):
                        continue
                    if near_province(prov, rec['lng'], rec['lat'], EDGE_TOLERANCE_KM):
                        hit = cc
                        recovered += 1
                        break
                if hit:
                    break
        if hit:
            buckets[hit].append(rec)
        else:
            outside += 1
    print(f'  {recovered} recovered within {EDGE_TOLERANCE_KM} km of a simplified boundary')
    print(f'  {outside} outside the four countries (dropped)')

    for cc in CCS:
        rows = sorted(buckets[cc], key=lambda r: (r['k'], r['name']))
        # Packed rows, not objects: repeating five key names 6,000 times is most of the file.
        # [name, lat, lng, kind(1 hospital|2 clinic|3 doctors), englishName|0, hasER]
        body = ',\n'.join(
            json.dumps([r['name'], r['lat'], r['lng'], r['k'], r['en'] or 0, r['er']], ensure_ascii=False)
            for r in rows)
        out = f'''// AUTO-GENERATED by scripts/build_hospitals.py — do not edit by hand.
// Every named hospital, clinic and doctors' surgery in this country, from OpenStreetMap
// (© OpenStreetMap contributors, ODbL), self-hosted so the emergency screen never depends
// on a live API. Curated capability data — tiers, notes, evacuation chains — lives in
// js/data/medical.js and is merged over the top of this at render time.
//
// Packed rows rather than objects: [name, lat, lng, kind, englishName|0, hasEmergency].
// kind: 1 = hospital, 2 = clinic, 3 = doctors. `hasEmergency` reflects OSM's emergency=yes
// tag where a mapper has set it — its ABSENCE means unknown, never "no A&E".
export const HOSPITAL_ROWS_{cc.upper()} = [
{body}
];
'''
        open(f'js/data/hospitals.{cc}.js', 'w', encoding='utf-8').write(out)
        n_h = sum(1 for r in rows if r['k'] == 1)
        print(f'  js/data/hospitals.{cc}.js: {len(rows)} rows ({n_h} hospitals), {os.path.getsize(f"js/data/hospitals.{cc}.js") // 1024} KB')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/osm'))
