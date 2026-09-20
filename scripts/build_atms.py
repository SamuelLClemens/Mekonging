#!/usr/bin/env python3
"""Build js/data/atms.js — the "lowest-fee ATM" layer: real, OpenStreetMap-sourced ATM
locations for the ONE bank per country that genuinely charges travellers the least.

WHY THIS EXISTS. Foreign-card ATM withdrawal fees are bank policy, not a place, so they can
never be shown as a blanket "no fee here" pin — the fee is set by which bank owns the machine,
not where it stands. Researched 2026-09-19 (see WORK_ORDER.md / memory for the citations):

  - Vietnam:  VPBank is the only bank confirmed to charge NO fee on a foreign card (limit
              10,000,000 VND/withdrawal). This is a real "free" claim, not "lowest".
  - Thailand: no bank is fee-free. Every major bank charges 250-350 THB; AEON is the lowest
              identified flat fee at 150 THB. Labelled "lowest fee", never "free".
  - Cambodia: no bank is fee-free. ACLEDA is consistently cited as one of the cheapest,
              roughly $1-5/withdrawal vs $6-10 at the priciest banks. Labelled "lowest fee".
  - Laos:     no bank is fee-free. BCEL charges ~1.5% (e.g. 30,000 LAK on 2,000,000 LAK) and
              is the most widely available network in the country. Labelled "lowest fee".

COVERAGE CAVEAT (real, not hidden): OpenStreetMap's mapping completeness varies hugely by
brand. AEON Thailand has ~146 real ATMs; only 8 are mapped (~5%), almost all in Bangkok. The
other three are much better mapped (VPBank 101, BCEL 106, ACLEDA 23 vs a much larger real
network). This is surfaced in-app (js/map.js atm popup / layer copy) rather than papered over.

Source: OpenStreetMap contributors, ODbL, queried via the public Overpass API
(https://overpass-api.de/api/interpreter), one query per bank:

    [out:json][timeout:60];
    node["amenity"="atm"]["operator"~"<BANK NAME REGEX>",i](<south>,<west>,<north>,<east>);
    out body;

  vi VPBank  operator~"VPBank|VP Bank"  bbox 8.0,102.0,23.5,110.0
  th AEON    operator~"AEON"            bbox 5.5,97.3,20.5,105.7
  kh ACLEDA  operator~"ACLEDA"          bbox 10.4,102.3,14.7,107.6
  la BCEL    operator~"BCEL"            bbox 13.9,100.0,22.5,107.7

The public Overpass instance intermittently 406/504s automated clients from this project's
dev environment as of 2026-09-19 (cause unconfirmed — plausibly a fingerprint- or load-based
block, since the SAME query succeeds on retry or via a different client) — large bounding
boxes may need splitting into smaller sub-boxes and retrying, same as this file's own input
data was gathered. A [out:csv(::id,::lat,::lon,name,operator,brand;false)] query is far more
compact and easier to sanity-check by row count than [out:json] for bulk pulls.

Input:  tab-separated files (id, lat, lon, name[, operator, brand]) — one per country, in the
        directory given on the command line. Expected filenames: vi.tsv, th.tsv, kh.tsv, la.tsv
Usage:  python3 scripts/build_atms.py <tsv-dir>
"""
import csv
import json
import sys

# cc -> (bank display name, fee tier, short fee note shown in the map popup)
BANKS = {
    'vi': ('VPBank', 'free', 'No fee for foreign cards (up to 10,000,000 VND/withdrawal)'),
    'th': ('AEON', 'low', 'Lowest flat fee in Thailand — 150 THB (others charge 250-350 THB)'),
    'kh': ('ACLEDA', 'low', 'Among the cheapest in Cambodia — roughly $1-5/withdrawal'),
    'la': ('BCEL', 'low', "Laos's widest ATM network — roughly 1.5% fee (e.g. 30,000 LAK on 2,000,000 LAK)"),
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
    """Same OSM id twice (a query re-run or an overlapping bbox split) keeps the first."""
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

    packed = []  # [cc, lat, lng, name]
    counts = {}
    for cc in BANKS:
        try:
            rows = dedupe(load_tsv(f'{tsv_dir}/{cc}.tsv'))
        except FileNotFoundError:
            print(f'  skip {cc}: no {tsv_dir}/{cc}.tsv found')
            continue
        counts[cc] = len(rows)
        for _id, lat, lon, name in rows:
            packed.append([cc, round(lat, 6), round(lon, 6), name])

    out = []
    out.append('// Real, OpenStreetMap-sourced ATM locations for the one bank per country that')
    out.append('// genuinely charges travellers the least — see scripts/build_atms.py for the full')
    out.append('// sourcing methodology, exact fee research and the Overpass queries used to build')
    out.append('// this file. Vietnam (VPBank) is a genuine FEE-FREE claim; Thailand/Cambodia/Laos')
    out.append('// are the LOWEST fee identified, never free — no bank in those three countries')
    out.append('// waives the foreign-card fee. Regenerate via:')
    out.append('//   python3 scripts/build_atms.py <dir-of-vi.tsv,th.tsv,kh.tsv,la.tsv>')
    out.append('')
    out.append('// cc -> [bank display name, fee tier (\'free\'|\'low\'), popup fee note]')
    out.append('export const ATM_BANK = ' + json.dumps(BANKS, ensure_ascii=False, indent=2) + ';')
    out.append('')
    out.append('// Packed row -> [cc, lat, lng, name]. `name` is the OSM name tag, kept as mapped')
    out.append('// (casing/spacing varies) since it is what a traveller sees on the machine itself.')
    out.append('export const ATM_ROWS = ' + json.dumps(packed, ensure_ascii=False) + ';')
    out.append('')

    with open('js/data/atms.js', 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')

    print(f'wrote js/data/atms.js: {len(packed)} rows total')
    for cc, n in counts.items():
        bank = BANKS[cc][0]
        print(f'  {cc} ({bank}): {n}')


if __name__ == '__main__':
    main()
