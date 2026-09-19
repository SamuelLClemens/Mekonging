#!/usr/bin/env python3
"""Build js/data/bus.<cc>.js for Vietnam, Cambodia and Laos — bus stop LOCATIONS from
OpenStreetMap, with no route-number join (unlike Thailand's GTFS-derived layer).

WHY NO ROUTE NUMBERS HERE. Thailand's layer (see build_bus_th.py) can say "routes 8, 25, 159
stop here" because the source GTFS feed links every stop to specific route IDs directly. OSM
has no equivalent clean link at this scale for these three countries: getting "which routes
serve this stop" from OSM would mean parsing thousands of route relations' member lists
(1,102 in Vietnam, 421 in Cambodia, 600 in Laos, nationwide) and matching them to stop nodes —
a much bigger, less reliable undertaking than a GTFS join, for uncertain payoff given how
inconsistently route relations are tagged/maintained here. Shipping stop locations only is
still real and useful (a traveller sees "there is a bus stop here" while navigating); the
route-number list is a clearly-labelled gap, not something silently missing.

WHY DOWNTOWN-CORE ONLY, NOT NATIONWIDE. A plain nationwide `highway=bus_stop` count timed out
even just to COUNT (Vietnam has tens of thousands). Extracting that many individual points
reliably (see WORK_ORDER / memory on the WebFetch verification discipline this project uses)
is not practical in one pass, so this ships the historic/downtown core of each country's
biggest traveller hub instead of attempting exhaustive coverage: Hanoi Old Quarter + French
Quarter (Vietnam), central Phnom Penh including its intercity bus-company stops (Cambodia),
central Vientiane (Laos). Real, accurate, useful for where most travellers actually spend
time — not a substitute for full-country coverage, which would need a different data-access
approach (e.g. a full country .osm.pbf extract processed with real GIS tooling) to attempt.

Source: OpenStreetMap contributors, ODbL, `highway=bus_stop` nodes, queried 2026-09-19.

Input:  a directory containing <cc>.tsv files (id, lat, lon, name — name may be blank).
Usage:  python3 scripts/build_bus_osm.py <tsv-dir>
"""
import csv
import json
import sys

# cc -> (display source note, coverage note shown when a traveller asks "is this everywhere?")
COUNTRIES = {
    'vi': ('Hanoi Old Quarter & French Quarter only (OpenStreetMap)', 'Hanoi'),
    'kh': ('Central Phnom Penh only, including intercity bus company stops (OpenStreetMap)', 'Phnom Penh'),
    'la': ('Central Vientiane only (OpenStreetMap)', 'Vientiane'),
}


def load_tsv(path):
    rows = []
    with open(path, newline='', encoding='utf-8') as f:
        for line in csv.reader(f, delimiter='\t'):
            if not line or not line[0].strip():
                continue
            osm_id, lat, lon = line[0].strip(), line[1].strip(), line[2].strip()
            name = line[3].strip() if len(line) > 3 else ''
            try:
                lat_f, lon_f = float(lat), float(lon)
            except ValueError:
                continue
            rows.append((osm_id, lat_f, lon_f, name))
    return rows


def dedupe(rows):
    seen = set()
    out = []
    for r in rows:
        if r[0] in seen:
            continue
        seen.add(r[0])
        out.append(r)
    return out


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    tsv_dir = sys.argv[1]

    for cc, (source_note, city) in COUNTRIES.items():
        try:
            rows = dedupe(load_tsv(f'{tsv_dir}/{cc}.tsv'))
        except FileNotFoundError:
            print(f'  skip {cc}: no {tsv_dir}/{cc}.tsv found')
            continue

        packed = [[round(lat, 6), round(lng, 6), name or '(unnamed stop)'] for _id, lat, lng, name in rows]

        out = []
        out.append(f'// {city} bus stop locations — see scripts/build_bus_osm.py for why this is')
        out.append('// downtown-core-only coverage and why route numbers are not included here.')
        out.append(f'export const BUS_SOURCE_{cc.upper()} = {json.dumps(source_note, ensure_ascii=False)};')
        out.append('')
        out.append('// Packed row -> [lat, lng, name]. No route-number field (unlike bus.th.js) —')
        out.append('// see the module comment for why that join is not available for this country.')
        out.append(f'export const BUS_STOPS_{cc.upper()} = ' + json.dumps(packed, ensure_ascii=False) + ';')
        out.append('')

        with open(f'js/data/bus.{cc}.js', 'w', encoding='utf-8') as f:
            f.write('\n'.join(out) + '\n')

        print(f'wrote js/data/bus.{cc}.js: {len(packed)} stops ({city})')


if __name__ == '__main__':
    main()
