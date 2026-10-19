#!/usr/bin/env python3
"""Build the Market's city list: the only places a listing can name (docs/EXCHANGE.md §3).

    python3 scripts/build-market-cities.py           # print the list's counts and say what is stale
    python3 scripts/build-market-cities.py --write   # rewrite both outputs
    python3 scripts/build-market-cities.py --check   # exit 1 if either output is stale

ONE SOURCE, TWO OUTPUTS. The server table `public.cities` and the client file
`js/data/market-cities.js` must hold the same ids, or a listing posted from the phone names a
city the database refuses. Both are generated here, from the same records:

  * every distinct `city` of the place records (`js/data/places.<cc>*.js`), under that file's
    country;
  * every endpoint of the intercity routes (`js/data/routes.<cc>.js`) that is not already a
    place city. A route file holds outbound cross-border routes too, so an endpoint's country
    cannot be read from the file it sits in. Those endpoints are listed by hand in ENDPOINTS
    below, and one outside the four countries in OUTSIDE. A new endpoint in neither table stops
    the script, so a route added later forces a decision instead of landing in the wrong country.

Outputs:
  * `js/data/market-cities.js`, a new lazy data file (CLAUDE.md, lazy-data rule);
  * the block between the GENERATED markers in `supabase/migrations/001_accounts.sql`, the seed;
  * the expected count in `supabase/tests/001_rls.sql`.

A migration runs once. After 001 has been applied, a city added to the place records reaches the
database only through a new migration: run --write, then copy the new rows into it.

Ids are `<cc>-<slug>`, the slug taken from the name before any bracket, ASCII-folded
("Oudomxai (Muang Xai)" is `la-oudomxai`). Two names that fold to one id in one country stop the
script.
"""
import glob
import os
import re
import sys
import unicodedata

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COUNTRIES = ('th', 'vi', 'kh', 'la')
JS_OUT = os.path.join(ROOT, 'js', 'data', 'market-cities.js')
SQL_OUT = os.path.join(ROOT, 'supabase', 'migrations', '001_accounts.sql')
TEST_OUT = os.path.join(ROOT, 'supabase', 'tests', '001_rls.sql')
BEGIN = '-- BEGIN GENERATED: cities (scripts/build-market-cities.py --write; do not edit by hand)'
END = '-- END GENERATED: cities'

# Route endpoints that are not the city of any place record, with the country each is in.
ENDPOINTS = {
    'Ban Phe (Koh Samet)': 'th', 'Chiang Khong': 'th', 'Chumphon': 'th', 'Hat Yai': 'th',
    'Koh Kham': 'th', 'Koh Kood': 'th', 'Koh Mak': 'th', 'Koh Wai': 'th',
    'Ha Tien': 'vi', 'Mui Ne': 'vi',
}
# Route endpoints outside Thailand, Vietnam, Cambodia and Laos: never a Market city.
OUTSIDE = {'Kuala Lumpur', 'Penang', 'Kunming'}


def _q(key):
    return r'["\']?%s["\']?\s*:\s*' % key


ID_RE = re.compile(r'(?<![A-Za-z_])' + _q('id') + r'([\'"])([a-z0-9-]+)\1')
CITY_RE = re.compile(_q('city') + r'([\'"])((?:\\.|(?!\1).)*)\1')
ENDPOINT_RE = re.compile(r'["\']?(?:from|to)["\']?\s*:\s*["\']([^"\']+)["\']')


def slug(name):
    base = name.split(' (', 1)[0].replace('đ', 'd').replace('Đ', 'D')
    base = unicodedata.normalize('NFKD', base).encode('ascii', 'ignore').decode('ascii')
    return re.sub(r'[^a-z0-9]+', '-', base.lower()).strip('-')


def place_cities():
    """{cc: {name: record count}} from every place file of each country."""
    out = {cc: {} for cc in COUNTRIES}
    for cc in COUNTRIES:
        files = sorted(glob.glob(os.path.join(ROOT, 'js', 'data', 'places.%s.js' % cc))
                       + glob.glob(os.path.join(ROOT, 'js', 'data', 'places.%s.*.js' % cc)))
        for path in files:
            src = open(path, encoding='utf-8').read()
            ms = list(ID_RE.finditer(src))
            for i, m in enumerate(ms):
                body = src[m.end():ms[i + 1].start() if i + 1 < len(ms) else len(src)]
                c = CITY_RE.search(body)
                if c and c.group(2).strip():
                    name = c.group(2).strip()
                    out[cc][name] = out[cc].get(name, 0) + 1
    return out


def build():
    by_cc = place_cities()
    known = {name for cc in COUNTRIES for name in by_cc[cc]}
    rows = {}
    problems = []

    def add(cc, name, why):
        cid = '%s-%s' % (cc, slug(name))
        if not slug(name):
            problems.append('%s: "%s" has no usable slug' % (why, name))
        elif cid in rows and rows[cid][1] != name:
            problems.append('%s: "%s" and "%s" both fold to %s' % (why, rows[cid][1], name, cid))
        else:
            rows[cid] = (cc, name)

    for cc in COUNTRIES:
        for name in by_cc[cc]:
            add(cc, name, 'place city')
    for cc in COUNTRIES:
        src = open(os.path.join(ROOT, 'js', 'data', 'routes.%s.js' % cc), encoding='utf-8').read()
        for name in sorted(set(ENDPOINT_RE.findall(src))):
            if name in known or name in OUTSIDE:
                continue
            if name not in ENDPOINTS:
                problems.append('routes.%s.js endpoint "%s" is in neither ENDPOINTS nor OUTSIDE' % (cc, name))
                continue
            add(ENDPOINTS[name], name, 'route endpoint')
    return sorted(rows.items()), problems


def js_text(rows):
    lines = [
        '// GENERATED by scripts/build-market-cities.py. Do not edit by hand: run it with --write.',
        '//',
        '// The cities a Market listing can name (docs/EXCHANGE.md §3). The same rows seed',
        '// public.cities in supabase/migrations/001_accounts.sql, so the phone and the server agree.',
        '// Ids are <cc>-<slug>; a listing stores the id, and the screen shows the name.',
        'export const MARKET_CITIES = [',
    ]
    for cid, (cc, name) in rows:
        lines.append("  { id: '%s', country: '%s', name: '%s' }," % (cid, cc, name.replace('\\', '\\\\').replace("'", "\\'")))
    lines.append('];')
    return '\n'.join(lines) + '\n'


def sql_block(rows):
    vals = ',\n'.join("  ('%s', '%s', '%s')" % (cid, cc, name.replace("'", "''")) for cid, (cc, name) in rows)
    return '%s\ninsert into public.cities (id, country, name) values\n%s;\n%s' % (BEGIN, vals, END)


def stale_outputs(rows):
    """[(path, new text)] for each output whose content differs from what --write would write."""
    out = []
    js = js_text(rows)
    cur = open(JS_OUT, encoding='utf-8').read() if os.path.exists(JS_OUT) else None
    if cur != js:
        out.append((JS_OUT, js))
    sql = open(SQL_OUT, encoding='utf-8').read()
    pat = re.compile(re.escape(BEGIN) + r'.*?' + re.escape(END), re.S)
    if not pat.search(sql):
        sys.exit('%s has no GENERATED cities block' % os.path.relpath(SQL_OUT, ROOT))
    new_sql = pat.sub(lambda _m: sql_block(rows), sql)
    if new_sql != sql:
        out.append((SQL_OUT, new_sql))
    test = open(TEST_OUT, encoding='utf-8').read()
    count_re = re.compile(r'(expected_cities int := )\d+(;)')
    if not count_re.search(test):
        sys.exit('%s has no expected_cities line' % os.path.relpath(TEST_OUT, ROOT))
    new_test = count_re.sub(lambda m: '%s%d%s' % (m.group(1), len(rows), m.group(2)), test)
    if new_test != test:
        out.append((TEST_OUT, new_test))
    return out


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else ''
    if mode not in ('', '--write', '--check'):
        sys.exit(__doc__)
    rows, problems = build()
    if problems:
        print('build-market-cities: FAIL')
        for p in problems:
            print('  ' + p)
        sys.exit(1)
    per = {cc: sum(1 for _, (c, _n) in rows if c == cc) for cc in COUNTRIES}
    print('cities: %d (%s)' % (len(rows), ', '.join('%s %d' % (cc, per[cc]) for cc in COUNTRIES)))
    stale = stale_outputs(rows)
    if mode == '--write':
        for path, text in stale:
            with open(path, 'w', encoding='utf-8') as f:
                f.write(text)
            print('wrote ' + os.path.relpath(path, ROOT))
        if not stale:
            print('nothing to write')
        return
    for path, _ in stale:
        print('stale: ' + os.path.relpath(path, ROOT))
    if mode == '--check':
        print('build-market-cities: %s' % ('FAIL' if stale else 'PASS'))
        sys.exit(1 if stale else 0)


if __name__ == '__main__':
    main()
