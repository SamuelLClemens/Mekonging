#!/usr/bin/env python3
"""Set access.stepFree and kidFriendly ONLY where a record's own prose already asserts it.

Same contract as the afterDark pass: no inference from category, city, price or vibe — the
record has to say it. That keeps the yield small (tens, not hundreds) and every entry
defensible by pointing at the sentence it came from. The rest genuinely needs per-venue
research and stays absent, which the UI already reports honestly.

Deliberately NOT used as a bulk source: OpenStreetMap's `wheelchair=*` tag. Matching a
curated place to an OSM node by proximity is a guess about identity, and a wrong
"step-free: yes" strands a wheelchair user at the bottom of a staircase.

Run: python3 derive_fit.py --dry-run | --apply
"""
import glob, io, re, sys

STEP_POS = re.compile(r'\b(wheelchair[- ]accessible|wheelchair access|step[- ]free|ramp access|ramps? (?:to|at|throughout)|lift access|elevator access|accessible (?:entrance|toilet|path|boardwalk))\b', re.I)
STEP_NEG = re.compile(r'\b(steep steps|many steps|\d{2,} steps|stairs only|not wheelchair|no wheelchair|no lift|no ramp|rough track|scramble|steep climb)\b', re.I)
KID_POS  = re.compile(r'\b(kid[- ]friendly|child[- ]friendly|family[- ]friendly|good (?:for|with) (?:kids|children|families)|great for families|playground|paddling pool)\b', re.I)
KID_NEG  = re.compile(r'\b(not (?:for|suitable for) (?:young )?(?:kids|children)|adults only|not suitable for children)\b', re.I)
# Rejected as too ambiguous to assert anything: "uneven" (a surface, not a barrier);
# "boardwalk" (some have steps at either end); "shallow water" (at Kong Lor it means the
# boat grounds in the dry season, not that children can paddle safely).

ID = re.compile(r'(?:^|[\s{,])"?id"?:\s*[\'"]([a-z0-9\-]+)[\'"]', re.M)


def key_re(name):
    return re.compile(r'(?:^|[\s{,])"?' + re.escape(name) + r'"?:', re.M)


def prose_of(body):
    return ' '.join(re.findall(r'"([^"]{25,})"', body)) + ' ' + ' '.join(re.findall(r"'([^']{25,})'", body))


def main():
    apply_changes = '--apply' in sys.argv
    if not apply_changes and '--dry-run' not in sys.argv:
        print('pass --dry-run or --apply'); return 2
    added = {'stepFree': 0, 'kidFriendly': 0}
    samples = []
    for path in sorted(glob.glob('js/data/places.*.js')):
        src = io.open(path, encoding='utf-8').read()
        starts = [(m.start(), m.group(1)) for m in ID.finditer(src)]
        out, cursor = [], 0
        for i, (pos, rid) in enumerate(starts):
            end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
            body = src[pos:end]
            prose = prose_of(body)
            quoted = '"id"' in body[:40]          # this record uses JSON-style quoted keys
            edits = []
            if not key_re('stepFree').search(body):
                hit = STEP_POS.search(prose)
                val = 'yes' if hit else ('no' if STEP_NEG.search(prose) else None)
                ev = hit.group(0) if hit else (STEP_NEG.search(prose).group(0) if val == 'no' else None)
                if val and not key_re('access').search(body):
                    edits.append(('access', '{ "stepFree": "%s" }' % val if quoted else "{ stepFree: '%s' }" % val))
                    added['stepFree'] += 1
                    samples.append((rid, 'stepFree', val, ev))
            if not key_re('kidFriendly').search(body):
                hit = KID_POS.search(prose)
                val = 'true' if hit else ('false' if KID_NEG.search(prose) else None)
                ev = hit.group(0) if hit else (KID_NEG.search(prose).group(0) if val == 'false' else None)
                if val:
                    edits.append(('kidFriendly', val))
                    added['kidFriendly'] += 1
                    samples.append((rid, 'kidFriendly', val, ev))
            if edits:
                # Insert right after the id line, matching the record's own quoting style and
                # indentation — never a text splice at a guessed offset.
                line_end = src.index('\n', pos) + 1
                indent = re.match(r'\s*', src[line_end:]).group(0)
                ins = ''.join(
                    '%s%s: %s,\n' % (indent, ('"%s"' % k) if quoted else k, v) for k, v in edits)
                out.append(src[cursor:line_end]); out.append(ins); cursor = line_end
        if cursor:
            out.append(src[cursor:])
            if apply_changes:
                io.open(path, 'w', encoding='utf-8').write(''.join(out))
    print('stepFree +%d, kidFriendly +%d' % (added['stepFree'], added['kidFriendly']))
    for s in samples[:14]:
        print('   %-42s %-12s %-6s <- "%s"' % s)
    print('APPLIED' if apply_changes else 'DRY RUN — nothing written')
    return 0


if __name__ == '__main__':
    sys.exit(main())
