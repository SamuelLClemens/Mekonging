#!/usr/bin/env python3
"""Keep every month ARRAY in the app honest against its own prose — region tier and city tier.

    python3 scripts/check-month-arrays.py           # PASS/FAIL table, both files
    python3 scripts/check-month-arrays.py --table   # also print each source's month grid

WHY THIS EXISTS. Two files carry "when to go" as two descriptions of the same fact: a sentence
a human reads (`js/data/zones.js`'s `bestMonths`/`avoidMonths`, `js/data/history.js`'s
`bestTime`) and an array the app sorts and filters by (`bestM: [3, 4, 5, 9, 10]`). Two copies of
one fact drift, and this drifts silently: nothing crashes when a month is added to the sentence
and not the array, the region or city simply stops appearing in the month it is best in.

Formerly `check-zone-months.py`, checking only js/data/zones.js. Renamed and extended to also
check js/data/history.js's 62 city `bestM`/`avoidM` pairs (added alongside the existing
`bestTime` prose — see the header note in that file) under the identical rule, rather than
maintaining two near-duplicate scripts for what is structurally the same check.

The check is deliberately asymmetric, because the two are not equivalent by design:

  - EVERY month in `bestM` / `avoidM` MUST be named by the matching prose. This is the
    direction that matters — an array may never assert a month the sentence does not support.
  - The reverse is NOT required. The editorial rule at the head of zones.js (and history.js's
    own note) keeps hedged months OUT of `bestM` ("Jul-Oct is green and wet but quiet" is not a
    recommendation), so a prose month with no array entry is expected and is not an error.

It also enforces the structural rules the UI depends on: every record has both arrays, and
every month is a plain integer 1-12 with no duplicates. A month appearing in BOTH arrays is
allowed on purpose — see the "mixed" case documented in both source files' headers.

Month ranges tolerate a leading qualifier on the second month ("Late May to early July",
"mid-October to mid-May") — the region tier has not needed one, the city tier does.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZONES_SRC = os.path.join(ROOT, 'js', 'data', 'zones.js')
HISTORY_SRC = os.path.join(ROOT, 'js', 'data', 'history.js')

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
MONTH_NO = {m: i + 1 for i, m in enumerate(MONTHS)}
NAME = {i + 1: m.capitalize() for i, m in enumerate(MONTHS)}
# En dash, em dash, hyphen and "to" all appear in hand-written ranges. A qualifier word may sit
# between the separator and the second month ("to early July", "to mid-May") — optional, so a
# direct "November to February" still matches with nothing in between.
QUAL = r'(?:early|late|mid|around|roughly)?[\s-]*'
RANGE_RE = re.compile(r'\b(%s)[a-z]*\s*(?:[-–—]|to)\s*%s(%s)[a-z]*'
                       % ('|'.join(MONTHS), QUAL, '|'.join(MONTHS)), re.I)
SINGLE_RE = re.compile(r'\b(%s)[a-z]*\b' % '|'.join(MONTHS), re.I)
YEAR_ROUND_RE = re.compile(r'year[-\s]?round|all year|every month', re.I)


def months_in_prose(text):
    """Every month the sentence names, ranges expanded with wraparound."""
    got = set()
    if YEAR_ROUND_RE.search(text):
        return set(range(1, 13))
    for a, b in RANGE_RE.findall(text):
        i, j = MONTH_NO[a.lower()[:3]], MONTH_NO[b.lower()[:3]]
        while True:
            got.add(i)
            if i == j:
                break
            i = i % 12 + 1
    for m in SINGLE_RE.findall(text):
        got.add(MONTH_NO[m.lower()[:3]])
    return got


def parse_zones(src):
    """[{tag, name, bestM, avoidM, checks:[(field, arr, prose_label, prose)]}] in file order."""
    out = []
    cc = None
    cur = {}
    for line in src.split('\n'):
        m = re.match(r'  ([a-z]{2}): \[', line)
        if m:
            cc = m.group(1)
        m = re.match(r"      id: '([^']+)', name: '((?:[^'\\]|\\.)*)'", line)
        if m:
            if cur:
                out.append(cur)
            cur = {'tag': '%s/%s' % (cc, m.group(1)), 'name': m.group(2)}
        for key, field in (('bestMonths', 'bestProse'), ('avoidMonths', 'avoidProse')):
            m = re.match(r"      %s: '((?:[^'\\]|\\.)*)'," % key, line)
            if m and cur:
                cur[field] = m.group(1)
        m = re.match(r'      bestM: \[([^\]]*)\], avoidM: \[([^\]]*)\],', line)
        if m and cur:
            cur['bestM'] = [int(x) for x in m.group(1).split(',') if x.strip()]
            cur['avoidM'] = [int(x) for x in m.group(2).split(',') if x.strip()]
    if cur:
        out.append(cur)
    for z in out:
        z['checks'] = [
            ('bestM', z.get('bestM'), 'bestMonths', z.get('bestProse')),
            ('avoidM', z.get('avoidM'), 'avoidMonths', z.get('avoidProse')),
        ]
    return out


def parse_cities(src):
    """[{tag, name, bestM, avoidM, checks:[...]}] — both arrays justified by ONE bestTime
    sentence (cities carry a single prose field, unlike zones' separate best/avoid prose)."""
    out = []
    cur = {}
    for line in src.split('\n'):
        m = re.match(r'    "([a-z]{2}-[a-z0-9-]+)": \{', line)
        if m:
            if cur:
                out.append(cur)
            cur = {'tag': m.group(1)}
        m = re.match(r'      "name": "((?:[^"\\]|\\.)*)"', line)
        if m and cur:
            cur['name'] = m.group(1)
        m = re.match(r'      "bestTime": "((?:[^"\\]|\\.)*)"', line)
        if m and cur:
            cur['bestTime'] = m.group(1)
        m = re.match(r'      "bestM": \[([^\]]*)\], "avoidM": \[([^\]]*)\]', line)
        if m and cur:
            cur['bestM'] = [int(x) for x in m.group(1).split(',') if x.strip()]
            cur['avoidM'] = [int(x) for x in m.group(2).split(',') if x.strip()]
    if cur:
        out.append(cur)
    # Every city that carries `bestTime` is REQUIRED to carry bestM/avoidM too, the same
    # structural rule zones.js is held to — not just the ones that happen to have it today.
    # Filtering on "has bestM" instead would silently stop checking any city where a future
    # edit added bestTime prose but forgot the arrays, which is precisely the failure mode
    # this script exists to catch (proven by the negative test that added this comment).
    out = [c for c in out if 'bestTime' in c]
    for c in out:
        c['checks'] = [
            ('bestM', c.get('bestM'), 'bestTime', c.get('bestTime')),
            ('avoidM', c.get('avoidM'), 'bestTime', c.get('bestTime')),
        ]
    return out


def check_records(records, problems):
    for r in records:
        for field, arr, prose_label, prose in r['checks']:
            if arr is None:
                if field == 'bestM' or field == 'avoidM':
                    # Only an error for records that declared the array tier at all — a record
                    # with neither array present was already filtered out by the caller (cities)
                    # or never had one to begin with (should not happen for zones).
                    problems.append('%s: %s is missing' % (r['tag'], field))
                continue
            if len(set(arr)) != len(arr):
                problems.append('%s: %s repeats a month' % (r['tag'], field))
            bad = [m for m in arr if not 1 <= m <= 12]
            if bad:
                problems.append('%s: %s has out-of-range %s' % (r['tag'], field, bad))
            if prose is None:
                problems.append('%s: %s is missing' % (r['tag'], prose_label))
                continue
            named = months_in_prose(prose)
            unsupported = [NAME[m] for m in arr if m not in named]
            if unsupported:
                problems.append('%s: %s claims %s, but %s does not name %s\n        prose: %s'
                                % (r['tag'], field, ', '.join(unsupported), prose_label,
                                   'them' if len(unsupported) > 1 else 'it', prose))


def print_table(label, records):
    head = '  '.join('%-3s' % NAME[m][:3] for m in range(1, 13))
    print('%-30s %s' % (label, head))
    for r in records:
        cells = []
        for m in range(1, 13):
            b, a = m in (r.get('bestM') or []), m in (r.get('avoidM') or [])
            cells.append('%-3s' % ('MIX' if b and a else 'YES' if b else 'no' if a else '.'))
        print('%-30s %s' % (r['tag'], '  '.join(cells)))
    print()


def main():
    zones = parse_zones(open(ZONES_SRC, encoding='utf-8').read())
    cities = parse_cities(open(HISTORY_SRC, encoding='utf-8').read())
    if not zones:
        print('FAIL — parsed no zones out of js/data/zones.js')
        return 1
    if not cities:
        print('FAIL — parsed no month-array cities out of js/data/history.js')
        return 1

    problems = []
    check_records(zones, problems)
    check_records(cities, problems)

    if '--table' in sys.argv:
        print_table('region (js/data/zones.js)', zones)
        print_table('city (js/data/history.js)', cities)

    if problems:
        print('FAIL — %d problem%s' % (len(problems), '' if len(problems) == 1 else 's'))
        for p in problems:
            print('  ' + p)
        return 1

    def summarize(label, records):
        mixed = sum(1 for r in records for m in range(1, 13)
                    if m in (r.get('bestM') or []) and m in (r.get('avoidM') or []))
        print('%-8s %3d records, %3d best-months, %3d avoid-months, %d deliberately mixed'
              % (label, len(records), sum(len(r.get('bestM') or []) for r in records),
                 sum(len(r.get('avoidM') or []) for r in records), mixed))

    summarize('region', zones)
    summarize('city', cities)
    print('\nPASS — every month claimed by an array is named by that record\'s own prose.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
