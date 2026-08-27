#!/usr/bin/env python3
"""Keep each region's month ARRAYS honest against its month PROSE.

    python3 scripts/check-zone-months.py           # PASS/FAIL table
    python3 scripts/check-zone-months.py --table   # also print the month grid

WHY THIS EXISTS. `js/data/zones.js` carries two descriptions of the same fact: a sentence a
human reads on the region page ("Sep-Oct (terraces golden) and Mar-May. Dec-Feb is genuinely
cold.") and an array the app sorts and filters by (`bestM: [3, 4, 5, 9, 10]`). Two copies of
one fact drift, and this one drifts silently: nothing crashes when a month is added to the
sentence and not the array, the region simply stops appearing in the month it is best in.

The check is deliberately asymmetric, because the two are not equivalent by design:

  - EVERY month in `bestM` / `avoidM` MUST be named by the matching prose. This is the
    direction that matters — an array may never assert a month the sentence does not support.
  - The reverse is NOT required. The editorial rule at the head of zones.js keeps hedged
    months OUT of `bestM` ("Jul-Oct is green and wet but quiet" is not a recommendation), so
    a prose month with no array entry is expected and is not an error.

It also enforces the two structural rules the UI depends on: every zone has both arrays, and
every month is a plain integer 1-12 with no duplicates. A month appearing in BOTH arrays is
allowed on purpose — see the "mixed" case in the zones.js header.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'js', 'data', 'zones.js')

MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
MONTH_NO = {m: i + 1 for i, m in enumerate(MONTHS)}
NAME = {i + 1: m.capitalize() for i, m in enumerate(MONTHS)}
# En dash, em dash, hyphen and "to" all appear in hand-written ranges.
RANGE_RE = re.compile(r'\b(%s)[a-z]*\s*(?:[-–—]|to)\s*(%s)[a-z]*' % ('|'.join(MONTHS), '|'.join(MONTHS)), re.I)
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
    """[(cc, id, name, bestProse, avoidProse, bestM, avoidM)] in file order."""
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
            cur = {'cc': cc, 'id': m.group(1), 'name': m.group(2)}
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
    return out


def main():
    src = open(SRC, encoding='utf-8').read()
    zones = parse_zones(src)
    if not zones:
        print('FAIL — parsed no zones out of js/data/zones.js')
        return 1

    problems = []
    for z in zones:
        tag = '%s/%s' % (z['cc'], z['id'])
        for field, prose_field, label in (('bestM', 'bestProse', 'bestMonths'),
                                          ('avoidM', 'avoidProse', 'avoidMonths')):
            if field not in z:
                problems.append('%s: %s is missing' % (tag, field))
                continue
            arr = z[field]
            if len(set(arr)) != len(arr):
                problems.append('%s: %s repeats a month' % (tag, field))
            bad = [m for m in arr if not 1 <= m <= 12]
            if bad:
                problems.append('%s: %s has out-of-range %s' % (tag, field, bad))
            prose = z.get(prose_field)
            if prose is None:
                problems.append('%s: %s is missing' % (tag, label))
                continue
            named = months_in_prose(prose)
            unsupported = [NAME[m] for m in arr if m not in named]
            if unsupported:
                problems.append('%s: %s claims %s, but %s does not name %s\n        prose: %s'
                                % (tag, field, ', '.join(unsupported), label,
                                   'them' if len(unsupported) > 1 else 'it', prose))

    if '--table' in sys.argv:
        head = '  '.join('%-3s' % NAME[m][:3] for m in range(1, 13))
        print('%-22s %s' % ('region', head))
        for z in zones:
            cells = []
            for m in range(1, 13):
                b, a = m in z.get('bestM', []), m in z.get('avoidM', [])
                cells.append('%-3s' % ('MIX' if b and a else 'YES' if b else 'no' if a else '.'))
            print('%-22s %s' % ('%s/%s' % (z['cc'], z['id']), '  '.join(cells)))
        print()

    if problems:
        print('FAIL — %d problem%s' % (len(problems), '' if len(problems) == 1 else 's'))
        for p in problems:
            print('  ' + p)
        return 1

    mixed = sum(1 for z in zones for m in range(1, 13) if m in z['bestM'] and m in z['avoidM'])
    print('%d regions, %d best-months, %d avoid-months, %d deliberately mixed'
          % (len(zones), sum(len(z['bestM']) for z in zones),
             sum(len(z['avoidM']) for z in zones), mixed))
    print('\nPASS — every month claimed by an array is named by its own prose.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
