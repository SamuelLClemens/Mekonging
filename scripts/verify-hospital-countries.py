#!/usr/bin/env python3
"""Verify the country assignment of border-region facilities against OpenStreetMap's own
authoritative boundaries, and write the exclusions the builder should apply.

WHY. build_hospitals.py assigns a country by point-in-polygon against the app's ADM1
geometry, which is simplified to about 2 km (scripts/build_basemap.py's EPS). That is right
for a basemap and wrong for a border: measured over the built data, eight of 7,398 facilities
sit INSIDE the simplified Thai or Vietnamese outline while actually being in Myanmar or China
— Myawaddy People's Hospital across the river from Mae Sot, Hekou County People's Hospital
across from Lao Cai. Their names and distances are correct, but the country label is not, and
on an emergency screen a wrong country means a wrong emergency number.

Rather than fetch unsimplified national boundaries (tens of megabytes for the Thai coastline
alone), this asks Overpass the direct question for the small set of points that could
plausibly be wrong: `is_in(lat,lng)` returns every area containing the point, including the
admin_level=2 country. One tiny query per candidate.

CANDIDATE SELECTION. A facility whose name is written ONLY in a script that is not native to
its assigned country. That is precisely the signal that flagged the problem, and it is
deliberately not used as the fix on its own: several Chinese-named clinics are legitimately
in Phnom Penh and Vientiane, so the script only decides who gets ASKED. Overpass decides.

Usage: python3 scripts/verify-hospital-countries.py [--write]
Writes scripts/hospitals-corrections.json, which build_hospitals.py then honours.
"""
import io, json, os, re, sys, time, urllib.parse, urllib.request

CCS = ['th', 'vi', 'kh', 'la']
ISO = {'th': 'TH', 'vi': 'VN', 'kh': 'KH', 'la': 'LA'}
MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.private.coffee/api/interpreter',
    'https://overpass.osm.jp/api/interpreter',
]
# Scripts a name might be written in, and which of the four countries each is native to.
SCRIPTS = [
    ('burmese', r'[က-႟ꩠ-ꩿ]', set()),
    ('cjk', r'[一-鿿぀-ヿ]', set()),
    ('devanagari', r'[ऀ-ॿ]', set()),
    ('thai', r'[฀-฿เ-๛]', {'th'}),
    ('lao', r'[຀-໿]', {'la'}),
    ('khmer', r'[ក-៿]', {'kh'}),
]
# NOT [A-Za-zÀ-ỹ]. That looks like "Latin plus accents" but as a single contiguous range it
# spans U+00C0-U+1EF9, which swallows the Burmese, Thai, Lao and Khmer blocks whole — so every
# Burmese-script clinic tested as "has Latin characters" and was skipped. Kept only as a note:
# the candidate rule below needs no Latin test at all, because a purely Latin name matches none
# of the SCRIPTS patterns and is skipped naturally.


def rows_of(cc):
    src = io.open(f'js/data/hospitals.{cc}.js', encoding='utf-8').read()
    return json.loads(re.search(r'= (\[.*\]);', src, re.S).group(1))


def candidates():
    out = []
    for cc in CCS:
        for r in rows_of(cc):
            name, lat, lng = r[0], r[1], r[2]
            # Only the MAPPED name is evidence about where a facility is. The English field is
            # not: the tier pass in build_hospitals.py fills it with a generated gloss ("Health
            # centre") for downgraded entries, and an earlier version of this filter skipped
            # anything with a non-empty `en` — which silently excluded every Burmese-script
            # clinic near Mae Sot, i.e. most of the cases this script exists to find. A name
            # that mixes a local script with Latin ("သန့်ဇင်ဆေးခန်း Thant Zin Clinic") still
            # counts, so there is no Latin test here either.
            for label, pat, native in SCRIPTS:
                if re.search(pat, name) and cc not in native:
                    out.append({'cc': cc, 'name': name, 'lat': lat, 'lng': lng, 'script': label})
                    break
    return out


def is_in(lat, lng):
    q = f'[out:json][timeout:60];is_in({lat},{lng});out tags;'
    data = urllib.parse.urlencode({'data': q}).encode()
    for attempt in range(5):
        mirror = MIRRORS[attempt % len(MIRRORS)]
        try:
            req = urllib.request.Request(mirror, data=data, headers={
                'User-Agent': 'Mekonging/0.459 (offline travel app; border verification)'})
            with urllib.request.urlopen(req, timeout=120) as r:
                res = json.loads(r.read().decode('utf-8', 'replace'))
            for el in res.get('elements', []):
                t = el.get('tags') or {}
                if t.get('admin_level') == '2' and t.get('ISO3166-1'):
                    return t['ISO3166-1']
            return None
        except Exception as err:
            print(f'    {type(err).__name__}, retrying', flush=True)
            time.sleep(4 + attempt * 5)
    return 'ERROR'


def main():
    write = '--write' in sys.argv
    cands = candidates()
    print(f'{len(cands)} candidates (name in a script not native to the assigned country)')
    # A wrong answer splits two ways, and the distinction matters. If the facility is really in
    # one of the four countries, REASSIGN it — Si Chiang Mai Hospital sits across the Mekong
    # from Vientiane and is a genuinely useful destination; dropping it would throw away real
    # nearby care to fix a label. Only a facility outside all four is EXCLUDED.
    reassign, excluded, ok, unknown = [], [], 0, 0
    back = {v: k for k, v in ISO.items()}
    for c in cands:
        got = is_in(c['lat'], c['lng'])
        mark = 'OK' if got == ISO[c['cc']] else ('?' if got in (None, 'ERROR') else 'WRONG')
        print(f"  [{mark:5s}] {c['name'][:34]:34s} assigned {ISO[c['cc']]}, Overpass says {got}", flush=True)
        if mark == 'WRONG':
            rec = {'name': c['name'], 'lat': c['lat'], 'lng': c['lng'],
                   'assigned': ISO[c['cc']], 'actual': got}
            (reassign if got in back else excluded).append(rec)
        elif mark == 'OK':
            ok += 1
        else:
            unknown += 1
        time.sleep(1.5)
    print(f'\n{ok} confirmed correct, {len(reassign)} to reassign, {len(excluded)} to exclude, {unknown} unresolved')
    if write:
        json.dump({'note': 'Country assignments OpenStreetMap contradicts, verified with is_in(). '
                           'Generated by scripts/verify-hospital-countries.py and honoured by '
                           'scripts/build_hospitals.py, so a rebuild cannot reintroduce them. '
                           '"reassign" moves a facility to the country it is really in; '
                           '"excluded" drops one that is outside all four.',
                   'reassign': reassign, 'excluded': excluded},
                  io.open('scripts/hospitals-corrections.json', 'w', encoding='utf-8'),
                  ensure_ascii=False, indent=1)
        print(f'wrote scripts/hospitals-corrections.json ({len(reassign)} reassign, {len(excluded)} exclude)')
    return 0


if __name__ == '__main__':
    sys.exit(main())
