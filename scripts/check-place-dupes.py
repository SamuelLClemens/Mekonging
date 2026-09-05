#!/usr/bin/env python3
"""Stop the same place being added twice.

    python3 scripts/check-place-dupes.py            # fail on duplicate ids or a NEW name collision
    python3 scripts/check-place-dupes.py --report   # list every pair currently seen
    python3 scripts/check-place-dupes.py --update   # re-record the accepted collisions

WHY THIS EXISTS. It was written immediately after adding twenty-two place records of which
SEVENTEEN duplicated a subject the app already covered — the Grand Palace, Wat Pho, Wat Arun,
the Dragon Bridge, Tra Que, Thanh Ha, Bai Dinh and more. Three of them collided on the record
id itself, which is straightforward data corruption.

The cause is worth stating because it will happen again. These files carry TWO formatting
conventions side by side: hand-authored records with bare keys (`id: "x"`) and pretty-printed
ones with quoted keys (`"id": "x"`). A quick audit regex written against the bare-key form,
matching id/name/city/country in that order on one line, silently missed every pretty-printed
record — so Bangkok looked like it had seventeen records and no temples, when it had
forty-five records including all three. check-place-fields.py's own docstring warns that a
bare-key-only pass misses about 8% of records; here it hid 60% of one city.

So this parses BOTH conventions, the same way check-place-fields.py does, and answers the one
question an audit regex got wrong: does this place already exist?

TWO SEVERITIES.
  * A duplicate `id` is a hard failure. Nothing legitimate needs two records under one id, and
    whichever loads last silently wins.
  * A near-duplicate NAME inside one city is a warning, because plenty are genuinely distinct —
    Banteay Kdei and Banteay Srei are different temples, Mae Klang and Mae Ya are different
    waterfalls, and Chiang Mai really does have a Saturday AND a Sunday walking street. So the
    pairs standing when this was written are recorded below and only NEW ones fail. Some of
    those recorded pairs are real duplicates that predate this guard (Chatuchak appears twice,
    as do the Central and Russian markets in Phnom Penh); they are listed as accepted rather
    than silently merged, because merging two records is an editorial decision, not a script's.
"""
import difflib
import glob
import io
import os
import re
import sys
from collections import defaultdict

ID = re.compile(r'^\s*"?id"?:\s*["\']([^"\']+)["\']')
NAME = re.compile(r'"?name"?:\s*["\']([^"\']+)["\']')
CITY = re.compile(r'"?city"?:\s*["\']([^"\']+)["\']')
RATIO = 0.78

# Name pairs inside one city that were already present when this guard was written. Most are
# genuinely different places; a few are real duplicates awaiting an editorial decision.
ACCEPTED = {
    ('kh-ext-banteay-kdei', 'kh-ext-banteay-srei'),
    ('kh-ext-central-market-pp', 'kh-ext-phnom-penh-central-market-food'),
    ('kh-ext-cha-ong', 'kh-ext-ka-tieng'),
    ('kh-ext-cha-ong', 'kh-ext-kachang-waterfall'),
    ('kh-ext-ka-tieng', 'kh-ext-kachang-waterfall'),
    ('kh-ext-koh-trong', 'kh-ext-koh-trong-homestays'),
    ('kh-ext-otres-beach', 'kh-ext-sihanoukville-otres-stays'),
    ('kh-ext-phnom-penh-russian-market-food', 'kh-ext-russian-market'),
    ('la-ext-coffee-bolaven-tad-champee', 'la-ext-tad-fane'),
    ('la-ext-luang-prabang-night-market-food', 'la-lpb-night-market'),
    ('la-ext-plain-of-jars-2', 'la-ext-plain-of-jars-site-3'),
    ('la-ext-tad-faek', 'la-ext-tad-hua-khon'),
    ('la-ext-tad-fane', 'la-ext-tad-yuang'),
    ('th-ext-chiangmai-saturday-walking-street', 'th-ext-chiangmai-sunday-walking-street'),
    ('th-ext-doi-inthanon', 'th-ext-doiinthanon-camping'),
    ('th-ext-mae-klang-waterfall', 'th-ext-mae-ya-waterfall'),
    ('th-ext-mae-klang-waterfall', 'th-ext-wachirathan-waterfall'),
    ('th-ext-mae-ya-waterfall', 'th-ext-wachirathan-waterfall'),
    ('th-ext-mhs-car-rental', 'th-ext-mhs-motorbike-rental'),
    ('th-ext-rental-sukhothai', 'th-ext-sukhothai-historical-park'),
    ('th-ext-sukhothai-historical-park', 'th-sukhothai-old-city-guesthouses'),
    ('th-koh-lanta-longbeach-hostels', 'th-kohlanta-longbeach-resorts'),
    ('vi-ext-cai-rang', 'vi-ext-cantho-cairang-floating-breakfast'),
    ('vi-ext-tavan-best-view', 'vi-ext-tavan-madame-view'),
}


def records():
    """Every record, parsed from BOTH key conventions. This is the whole point of the file."""
    for path in sorted(glob.glob('js/data/places.*.js')):
        lines = io.open(path, encoding='utf-8').read().split('\n')
        starts = [i for i, ln in enumerate(lines) if ID.match(ln)]
        for n, s in enumerate(starts):
            end = starts[n + 1] if n + 1 < len(starts) else len(lines)
            block = '\n'.join(lines[s:end])
            name, city = NAME.search(block), CITY.search(block)
            yield (ID.match(lines[s]).group(1), name.group(1) if name else '',
                   city.group(1) if city else '', path)


def collisions(recs):
    by_city = defaultdict(list)
    for rid, name, city, _p in recs:
        if name and city:
            by_city[city].append((rid, name.lower()))
    out = set()
    for entries in by_city.values():
        for i in range(len(entries)):
            for j in range(i + 1, len(entries)):
                a, b = entries[i][1], entries[j][1]
                close = difflib.SequenceMatcher(None, a, b).ratio() > RATIO
                contained = len(a) > 10 and len(b) > 10 and (a in b or b in a)
                if close or contained:
                    out.add(tuple(sorted((entries[i][0], entries[j][0]))))
    return out


def main():
    recs = list(records())
    seen = defaultdict(list)
    for rid, _n, _c, path in recs:
        seen[rid].append(path)
    dup_ids = {k: v for k, v in seen.items() if len(v) > 1}
    pairs = collisions(recs)
    new_pairs = sorted(pairs - ACCEPTED)

    if '--update' in sys.argv:
        src = io.open(__file__, encoding='utf-8').read()
        block = '\n'.join(f"    ('{a}', '{b}')," for a, b in sorted(pairs))
        src = re.sub(r'ACCEPTED = \{.*?\n\}', 'ACCEPTED = {\n' + block + '\n}', src, flags=re.S)
        io.open(__file__, 'w', encoding='utf-8').write(src)
        print(f'Accepted collisions re-recorded: {len(pairs)}.')
        return 0

    print(f'{len(recs)} place records; {len(pairs)} name collisions '
          f'({len(ACCEPTED)} previously accepted).')
    if '--report' in sys.argv:
        names = {r[0]: (r[1], r[2]) for r in recs}
        for a, b in sorted(pairs):
            mark = '' if (a, b) in ACCEPTED else '  <-- NEW'
            print(f'  {a:44s} {names.get(a, ("?",))[0][:40]}')
            print(f'  {b:44s} {names.get(b, ("?",))[0][:40]}{mark}\n')

    problems = []
    for rid, paths in sorted(dup_ids.items()):
        problems.append(f'duplicate record id "{rid}" appears {len(paths)} times '
                        f'({", ".join(sorted(set(paths)))}). Whichever loads last wins, '
                        f'silently.')
    names = {r[0]: r[1] for r in recs}
    for a, b in new_pairs:
        problems.append(f'"{names.get(a, a)}" ({a}) and "{names.get(b, b)}" ({b}) are the same '
                        f'city and nearly the same name — is one of them already the other?')

    if problems:
        print('\nFAIL:\n')
        for p in problems:
            print('  - ' + p)
        print('\nSearch the data by NAME before adding a place, and parse both key conventions'
              '\nwhen you do — a bare-key-only regex hides most of some cities. If the pair is'
              '\ngenuinely two different places, re-run with --update to accept it.')
        return 1
    print('\nPASS — no duplicate ids, no new name collisions.')
    return 0


if __name__ == '__main__':
    os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    sys.exit(main())
