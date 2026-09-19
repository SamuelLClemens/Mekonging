#!/usr/bin/env python3
"""Build js/data/bus.th.js — Bangkok bus stops, each carrying the route numbers that serve it.

WHY STOPS, NOT ROUTE LINES. The source feed has 1,264 distinct bus route_ids (many are the
same rider-facing number run by different operators/vehicle classes — e.g. route "1" has a
BMTA ordinary-bus variant AND a private minibus variant as separate GTFS rows). Drawing 1,264
overlapping polylines on a phone-sized map is unreadable, not just a large-file problem — so
this ships the far more useful shape instead: tap a stop, see which route NUMBERS stop there.
Route numbers/destinations are stable info; exact timetables are not (see WHY NO TIMES below).

WHY NO TIMES. The source feed includes frequencies.txt (headway by time-of-day), but this
snapshot is from 2023-04-21 - the source project's daily-update job silently stopped after
that date (confirmed: no newer commit touches data/gtfs, and no GTFS Realtime exists for
Bangkok buses this project could find). Showing a specific "every 12 minutes" number from a
3.5-year-old snapshot would look precise and be wrong. Route numbers and general destinations
change far less often than schedules, so those are what's shown; the popup says the schedule
is not shown and to check the number board on the bus, rather than staying silent about why.

Source: GTFS snapshot 2023-04-21, originally Thailand's OTP/Namtang GTFS, mirrored at
https://github.com/asiripanich/bangkok-gtfs (commit fa103ca24d78fe628469c4ead31f9dcd8e5f3319).
Only route_type=3 (bus) is used; rail (BTS/MRT/ARL, types 0/1/2) and other (4) are excluded -
travellers already have dedicated, well-signed rail maps everywhere in the city.

Input:  a directory containing routes.txt, trips.txt, stop_times.txt, stops.txt from the feed.
Usage:  python3 scripts/build_bus_th.py <gtfs-dir>
"""
import csv
import json
import sys


def read_csv(path):
    with open(path, newline='', encoding='utf-8') as f:
        return list(csv.DictReader(f))


def bilingual_en(s):
    """GTFS name fields in this feed are 'Thai;English' - keep the English half when present,
    the raw string otherwise (some rows have no ';', a handful have Thai only)."""
    if ';' in s:
        parts = s.split(';', 1)
        return parts[1].strip() or parts[0].strip()
    return s.strip()


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        sys.exit(1)
    gtfs_dir = sys.argv[1]

    routes = read_csv(f'{gtfs_dir}/routes.txt')
    bus_routes = {r['route_id'] for r in routes if r['route_type'] == '3'}
    # route_id -> display number. Several route_ids share one rider-facing short_name (different
    # operator/vehicle class); that's fine, this maps every one of them to the number a
    # traveller actually sees printed on the bus.
    route_number = {r['route_id']: r['route_short_name'] for r in routes if r['route_id'] in bus_routes}

    trips = read_csv(f'{gtfs_dir}/trips.txt')
    trip_route = {t['trip_id']: t['route_id'] for t in trips if t['route_id'] in bus_routes}

    # stop_id -> set of route numbers (deduped display strings, not route_ids)
    stop_routes = {}
    with open(f'{gtfs_dir}/stop_times.txt', newline='', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            route_id = trip_route.get(row['trip_id'])
            if not route_id:
                continue
            stop_routes.setdefault(row['stop_id'], set()).add(route_number[route_id])

    stops = read_csv(f'{gtfs_dir}/stops.txt')
    packed = []
    for s in stops:
        nums = stop_routes.get(s['stop_id'])
        if not nums:
            continue  # a rail-only or otherwise bus-less stop
        try:
            lat, lng = float(s['stop_lat']), float(s['stop_lon'])
        except ValueError:
            continue
        name = bilingual_en(s['stop_name'])
        # Sort numerically where possible (bus numbers are usually numeric, occasionally a
        # prefix like "ปอ.34" or "BRT") so a traveller reads "8, 25, 159" not "159, 25, 8".
        sorted_nums = sorted(nums, key=lambda n: (0, int(n)) if n.isdigit() else (1, n))
        packed.append([round(lat, 6), round(lng, 6), name, ', '.join(sorted_nums)])

    out = []
    out.append('// Bangkok bus stops with the route numbers serving each one. See')
    out.append('// scripts/build_bus_th.py for the full sourcing, the snapshot date, and why')
    out.append('// this ships stop+route-number data instead of route lines or timetables.')
    out.append(f'export const BUS_SOURCE_TH = {json.dumps("GTFS snapshot 2023-04-21 (BMTA + private operators, via bangkok-gtfs)")};')
    out.append('')
    out.append('// Packed row -> [lat, lng, name, routeNumbers]')
    out.append('export const BUS_STOPS_TH = ' + json.dumps(packed, ensure_ascii=False) + ';')
    out.append('')

    with open('js/data/bus.th.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')

    print(f'wrote js/data/bus.th.js: {len(packed)} stops (of {len(stops)} total in feed, {len(bus_routes)} bus route_ids -> {len(set(route_number.values()))} distinct route numbers)')


if __name__ == '__main__':
    main()
