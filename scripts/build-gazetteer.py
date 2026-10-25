#!/usr/bin/env python3
"""Build the offline place list (the gazetteer) for the place pickers, from GeoNames.

    python3 -I scripts/build-gazetteer.py <download-dir>            # write js/data/gazetteer.<cc>.js
    python3 -I scripts/build-gazetteer.py <download-dir> --report   # counts and sizes only, no writes

<download-dir> holds the eight GeoNames zips, downloaded into a new empty folder:
    https://download.geonames.org/export/dump/{TH,VN,KH,LA}.zip
    https://download.geonames.org/export/dump/alternatenames/{TH,VN,KH,LA}.zip
They are read straight from the zips as text and never executed. GeoNames is CC BY 4.0: the
app credits it on Settings' data sources, and each generated file names it in its header.

WHY THIS EXISTS. Every place picker listed only the curated weather anchors (WEATHER_SPOTS), so a
traveller on Koh Chang or Koh Mak could not pick where they were (traveller fix F1, 2026-10-24).
The owner ruled for an offline list from GeoNames, stored in the app, and then (the same session)
for "places with a population" only, as complete as possible without a long list: GeoNames holds
88,263 Thai villages, which would have been 965 KB compressed for Thailand alone.

WHAT IS KEPT, per country:
  * every island (feature class T: ISL, ISLS, ISLET), populated or not;
  * every administrative seat (PPLC, PPLA to PPLA4);
  * every other populated place (feature class P) that GeoNames gives a population;
  * every subdistrict or commune (ADM3) that GeoNames gives a population: Thailand's tambon and
    Cambodia's communes, which cover each country evenly where the villages carry no figure;
  * every populated place that GeoNames links to Wikipedia or Wikidata ("notable"), which is where
    traveller villages without a figure come from (Railay Beach, Nong Khiaw);
  * in Laos only (EVERY_VILLAGE), every other populated place too: GeoNames gives a population to
    108 of its 13,388 villages, so the rule above kept 294 places for the whole country. The village
    (ban) is the administrative unit there, and all of them come to 182 KB after gzip, under the cap
    (owner, 2026-10-25, open decision 21). Measured the same way, every village would be 213 KB in
    Cambodia (fits), 478 KB in Vietnam and 1,474 KB in Thailand (do not).
Left out: sections of towns (PPLX), historical, abandoned and destroyed places (PPLH, PPLQ, PPLW,
PPLCH), and, outside Laos, villages with no population and no article.

ORDER IS RANK. Rows are written best first (towns by population, islands, villages by
population, notable villages, Laos's other villages, then subdistricts and communes by population; within one of
those, a place with a Wikipedia or Wikidata entry, then one with a province), so the picker ranks
equal matches by file order and never needs the population itself. That is what puts Trat's
Ko Mak ahead of the two other islands of the name.

DUPLICATES. A subdistrict named like a kept place within 5 km of it is dropped (a tambon is
usually named after its seat village). The same name twice within 2 km keeps the better-ranked
row. Matches with the curated anchors are left in: the picker hides them at run time, so a new
anchor needs no rebuild.
"""
import collections
import gzip
import io
import json
import math
import os
import re
import sys
import unicodedata
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'js', 'data', 'gazetteer.{}.js')

COUNTRIES = [('TH', 'th', 'th'), ('VN', 'vi', 'vi'), ('KH', 'kh', 'km'), ('LA', 'la', 'lo')]
SCRIPT = {'th': r'[฀-๿]', 'km': r'[ក-៿]', 'lo': r'[຀-໿]', 'vi': r'[^\x00-\x7f]'}
SEATS = {'PPLC', 'PPLA', 'PPLA2', 'PPLA3', 'PPLA4'}
POPULATED = SEATS | {'PPL', 'PPLL', 'PPLS', 'PPLF', 'PPLR', 'PPLG'}
ISLANDS = {'ISL', 'ISLS', 'ISLET'}
# Kind codes the app reads (js/gazetteer.js KIND_LABEL): town, island, village, subdistrict, commune.
TIER = {'t': 0, 'i': 1, 'v': 2, 'n': 3, 'w': 3.5, 's': 4}   # 'n' notable and 'w' every-village rows ship as 'v'
EVERY_VILLAGE = {'LA'}
PROVINCE_PREFIX = re.compile(r'^(Changwat|Tỉnh|Thành phố|Khouèng)\s+')
PROVINCE_NOTE = re.compile(r'\s*\([^)]*\)$')   # "Ho Chi Minh City (HCMC)" -> "Ho Chi Minh City"
SIZE_CAP = 250 * 1024   # the plan's per-country cap, after gzip


def norm(s):
    s = unicodedata.normalize('NFD', s.replace('đ', 'd').replace('Đ', 'D'))
    s = ''.join(c for c in s if not unicodedata.combining(c)).lower()
    s = re.sub(r'\b(koh|kaoh|kaôh|kho)\b', 'ko', s)
    s = re.sub(r'^(ban|tambon|xa|phuong|thi tran|khum|sangkat|muang|amphoe)\s+', '', s)
    return re.sub(r'[^0-9a-z฀-໿ក-៿]+', ' ', s).strip()


def km(a, b):
    dlat = math.radians(b[0] - a[0])
    dlng = math.radians(b[1] - a[1]) * math.cos(math.radians((a[0] + b[0]) / 2))
    return 6371 * math.hypot(dlat, dlng)


def read_zip(path, member):
    with zipfile.ZipFile(path) as z:
        return z.read(member).decode('utf-8')


def build(src, cc_up, cc, lang):
    rows = [l.split('\t') for l in read_zip(os.path.join(src, cc_up + '.zip'), cc_up + '.txt').splitlines() if l]
    alt = collections.defaultdict(list)
    alt_text = read_zip(os.path.join(src, 'alternatenames', cc_up + '.zip'), cc_up + '.txt')
    for line in alt_text.splitlines():
        f = line.split('\t')
        if len(f) >= 8:
            alt[f[1]].append(f)

    provinces = {r[10]: PROVINCE_NOTE.sub('', PROVINCE_PREFIX.sub('', r[1])) for r in rows if r[6] == 'A' and r[7] == 'ADM1'}

    def local_name(r):
        c = [f for f in alt.get(r[0], []) if f[2] == lang and f[7] != '1' and re.search(SCRIPT[lang], f[3])]
        c.sort(key=lambda f: (f[4] != '1', f[5] == '1'))
        name = c[0][3] if c else ''
        return '' if name == r[1] else name

    def aka(r):
        # Up to two romanised alternates that add a word the name lacks ("Kaoh Rung Samloem" for
        # Koh Rong Sanloem), so a traveller's own spelling still finds the place.
        have = set(norm(r[1]).split())
        out = []
        for f in alt.get(r[0], []):
            if f[2] not in ('', 'en') or f[7] == '1' or not re.fullmatch(r"[A-Za-z0-9 '\-.()]+", f[3]):
                continue
            words = set(norm(f[3]).split())
            if words and not words <= have and f[3] not in out:
                out.append(f[3])
                have |= words
            if len(out) == 2:
                break
        return ';'.join(out)

    def notable(r):
        return any(f[2] in ('wkdt', 'link') for f in alt.get(r[0], []))

    kept, dropped = [], collections.Counter()
    for r in rows:
        cls, code, pop = r[6], r[7], int(r[14] or 0)
        if cls == 'T' and code in ISLANDS:
            kind = 'i'
        elif cls == 'P' and code in SEATS:
            kind = 't'
        elif cls == 'P' and code in POPULATED and pop > 0:
            kind = 't' if pop >= 5000 else 'v'
        elif cls == 'P' and code in POPULATED and notable(r):
            kind = 'n'
        elif cls == 'P' and code in POPULATED and cc_up in EVERY_VILLAGE:
            kind = 'w'
        elif cls == 'A' and code == 'ADM3' and pop > 0:
            kind = 's'
        else:
            if cls == 'P':
                dropped['P.' + code] += 1
            continue
        kept.append({'id': r[0], 'name': r[1], 'lat': float(r[4]), 'lng': float(r[5]), 'adm1': r[10],
                     'kind': kind, 'pop': pop, 'local': local_name(r), 'aka': aka(r),
                     'notable': kind == 'n' or notable(r), 'province': r[10] in provinces})

    kept.sort(key=lambda p: (TIER[p['kind']], -p['pop'], not p['notable'], not p['province'], p['name']))
    out, seen = [], collections.defaultdict(list)
    for p in kept:
        key = norm(p['name'])
        near = [q for q in seen[key] if km((p['lat'], p['lng']), (q['lat'], q['lng'])) < (5 if p['kind'] == 's' else 2)]
        if near:
            dropped['duplicate ' + ('subdistrict' if p['kind'] == 's' else 'name')] += 1
            continue
        seen[key].append(p)
        out.append(p)

    prov_codes = sorted({p['adm1'] for p in out if p['adm1'] in provinces}, key=lambda c: provinces[c])
    prov_index = {c: i for i, c in enumerate(prov_codes)}
    lines = []
    for p in out:
        kind = 'v' if p['kind'] in ('n', 'w') else p['kind']
        if kind == 's' and cc != 'th':
            kind = 'm'
        fields = [p['name'], p['local'], f"{p['lat']:.5f}".rstrip('0').rstrip('.'),
                  f"{p['lng']:.5f}".rstrip('0').rstrip('.'), str(prov_index.get(p['adm1'], '')), kind, p['aka']]
        assert not any('\t' in f or '\n' in f for f in fields), fields
        lines.append('\t'.join(fields).rstrip('\t'))
    return out, [provinces[c] for c in prov_codes], '\n'.join(lines), dropped


def module_text(cc, provinces, rows_text, count):
    return (
        f"// GENERATED by scripts/build-gazetteer.py from GeoNames (https://www.geonames.org/, CC BY 4.0).\n"
        f"// Do not edit by hand: rerun the script. {count} places, best-ranked first.\n"
        f"// Row: name, local-script name, lat, lng, province index, kind (t town, i island, v village,\n"
        f"// s subdistrict, m commune), romanised alternates joined by ';'. Tab-separated, one per line.\n"
        f"export const PROVINCES = {json.dumps(provinces, ensure_ascii=False)};\n"
        f"export const ROWS = {json.dumps(rows_text, ensure_ascii=False)};\n"
    )


def main(argv):
    if len(argv) < 2 or not os.path.isdir(argv[1]):
        print(__doc__)
        return 2
    report_only = '--report' in argv
    over = []
    for cc_up, cc, lang in COUNTRIES:
        out, provinces, rows_text, dropped = build(argv[1], cc_up, cc, lang)
        text = module_text(cc, provinces, rows_text, len(out))
        raw = text.encode('utf-8')
        gz = len(gzip.compress(raw, 9))
        kinds = collections.Counter(p['kind'] for p in out)
        print(f"{cc}: {len(out)} places {dict(sorted(kinds.items()))}, local names {sum(1 for p in out if p['local'])}, "
              f"aka {sum(1 for p in out if p['aka'])}; {len(raw) / 1024:.0f} KB raw, {gz / 1024:.0f} KB gzip")
        print(f"    dropped: {dict(dropped.most_common())}")
        if gz > SIZE_CAP:
            over.append(cc)
        if not report_only:
            with open(OUT.format(cc), 'w', encoding='utf-8') as fh:
                fh.write(text)
    if over:
        print('OVER the 250 KB gzip cap:', ', '.join(over))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv))
