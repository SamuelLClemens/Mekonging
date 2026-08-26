#!/usr/bin/env python3
"""Count the traveller-fit fields actually recorded across every place record.

    python3 scripts/check-place-fields.py            # print the table
    python3 scripts/check-place-fields.py --assert   # also fail if main.js quotes stale figures

WHY THIS EXISTS. profileFit() in js/main.js opens with a paragraph of measured figures ("set on
426 of 808") that justify the whole design: an unrecorded field must say "not recorded" rather
than "no". Those figures were written once against 586 records and were never recomputed, so by
August 2026 every number in them was wrong — the record count had grown by 38% and each claimed
coverage figure understated reality. A stale justification is worse than none, because it reads
as measured fact. This recomputes them from the data on demand.

It also enforces the `afterDark` contract documented in js/data/places.th.js: that field is a
CHECKABLE OPERATIONAL FACT, never a safety verdict, so `lit` may only appear alongside an
explicit `openAfterDark`, and `openAfterDark` must be a real boolean.

Note on parsing: these files carry two formatting conventions side by side — hand-authored
records with bare keys (`id: "x"`) and pretty-printed ones with quoted keys (`"id": "x"`).
Both are matched. A bare-key-only pass silently misses about 8% of records.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FILES = [f'js/data/places.{cc}{ext}.js' for cc in ('th', 'vi', 'kh', 'la') for ext in ('', '.ext')]

ID_RE = re.compile(r'^\s*"?id"?:\s*["\']([^"\']+)["\']')
FIELDS = ['hours', 'priceRange', 'kidFriendly', 'afterDark', 'scamWarnings', 'access',
          'coords', 'recognition', 'localName', 'verified']


def key_re(name):
    # Keys appear BOTH on their own line and inline after another key on the same line
    # (`mapQuery: "...", coords: { ... },`). Anchoring to line start undercounts badly —
    # it reported kidFriendly on 290 records where the real figure is 426.
    return re.compile(r'(?:^|[\s{,])"?' + re.escape(name) + r'"?:', re.M)


KEY_RES = {f: key_re(f) for f in FIELDS}


def records(path):
    """Yield (id, [lines]) per place. `id` is the first key of every record, which makes it a
    far more reliable boundary than brace counting on files this heavily nested."""
    lines = open(path, encoding='utf-8').read().split('\n')
    starts = [i for i, ln in enumerate(lines) if ID_RE.match(ln)]
    for n, s in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(lines)
        yield ID_RE.match(lines[s]).group(1), lines[s:end]


def main():
    os.chdir(ROOT)
    counts = {f: 0 for f in FIELDS}
    counts.update(stepFree=0, scam_nonempty=0, lit=0, babyChange=0)
    total = 0
    problems = []
    per_file = []

    for path in FILES:
        n = 0
        for pid, block in records(path):
            n += 1
            body = '\n'.join(block)
            for f in FIELDS:
                if KEY_RES[f].search(body):
                    counts[f] += 1
            if re.search(r'"?stepFree"?:', body):
                counts['stepFree'] += 1
            if re.search(r'"?babyChange"?:', body):
                counts['babyChange'] += 1
            if re.search(r'"?scamWarnings"?:\s*\[\s*["\'{]', body):
                counts['scam_nonempty'] += 1
            # afterDark contract
            if re.search(r'"?lit"?:', body):
                counts['lit'] += 1
                if not re.search(r'"?openAfterDark"?:', body):
                    problems.append(f'{pid}: afterDark.lit set without openAfterDark')
            for m in re.finditer(r'"?openAfterDark"?:\s*([A-Za-z0-9_"\']+)', body):
                if m.group(1) not in ('true', 'false'):
                    problems.append(f'{pid}: openAfterDark is {m.group(1)!r}, not a boolean')
        per_file.append((os.path.basename(path), n))
        total += n

    for name, n in per_file:
        print(f'  {name:24s} {n:4d}')
    print(f'  {"TOTAL":24s} {total:4d}\n')
    for f in FIELDS + ['stepFree', 'babyChange', 'scam_nonempty', 'lit']:
        c = counts[f]
        print(f'  {f:16s} {c:4d} / {total}   ({100 * c // total if total else 0:3d}%)')

    if '--assert' in sys.argv:
        main_js = open('js/main.js', encoding='utf-8').read()
        # The figures this file expects js/main.js to be quoting. Bump BOTH together when a
        # data pass moves one — that pairing is the whole point of the check.
        #
        # A LIST, not a dict, and it has to stay one: afterDark and stepFree both read 187
        # as of August 2026, and as dict keys the second silently replaced the first, which
        # quietly dropped afterDark from the check while still printing PASS.
        expect = [('808', total, 'total'), ('436', counts['kidFriendly'], 'kidFriendly'),
                  ('187', counts['afterDark'], 'afterDark'), ('187', counts['stepFree'], 'stepFree'),
                  ('691', counts['scamWarnings'], 'scamWarnings'),
                  ('350', counts['scam_nonempty'], 'scam_nonempty')]
        for quoted, actual, _label in expect:
            if int(quoted) != actual:
                problems.append(f'js/main.js quotes {quoted} where the data now says {actual} '
                                f'— update the profileFit() comment')
            elif quoted not in main_js:
                problems.append(f'js/main.js no longer quotes {quoted}; recheck the '
                                f'profileFit() comment against this table')

    print()
    if problems:
        print(f'{len(problems)} problem(s):')
        for p in problems:
            print('  - ' + p)
        return 1
    print('PASS — figures consistent, afterDark contract holds.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
