#!/usr/bin/env python3
"""Write js/data/emergency-world.<region>.js from the reviewed decisions in decisions/<region>.txt (slice F7b).
usage: python3 -I tools/emergency-world/build_region.py <region> <repo-root>
Decisions live in decisions/<region>.txt, one country per line:  <id> <label>:<number>:<c|u|cu> ...   (# starts a comment)
  c = Canada's page states it, u = the UK's page states it. The builder REFUSES a decision whose number does not appear in the
  cited source's harvested text, composes the source URLs from the matched pages, and writes the file in the repo's format.
Label codes: G Emergency (all services), P Police, A Ambulance / medical, F Fire, T Traffic police, S Search and rescue, K Coast guard, U Tourist police.
"""
import json, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)   # python3 -I does not put the script's directory on the path
import review
rows, match, index, ca, uk = review.ne_rows(), review.match, review.index, review.index('ca'), review.index('uk')
cam, _ = match(rows, ca); ukm, _ = match(rows, uk)
# pages the name matcher cannot pair
cam.update({'cd': 'congo-kinshasa', 'il': 'israel-and-palestine', 'ps': 'israel-and-palestine', 'cyn': 'cyprus', 'mp': 'northern-marianas', 'vi': 'virgin-islands-u-s',
            'pm': 'saint-pierre-et-miquelon'})
ukm.update({'cd': 'democratic-republic-of-the-congo', 'lc': 'st-lucia', 'vc': 'st-vincent-and-the-grenadines', 'cyn': 'cyprus'})
LABEL = {'G': 'Emergency (all services)', 'P': 'Police', 'A': 'Ambulance / medical', 'F': 'Fire', 'T': 'Traffic police', 'S': 'Search and rescue',
         'K': 'Coast guard', 'U': 'Tourist police'}
ORDER = 'GPAFTSKU'


def uk_text(slug):
    out = {}
    for part, v in uk[slug]['data'].items():
        out[part] = ' || '.join(v.get('raw', []))
    return out


def has(num, text):
    return re.search(r'(?<![\d])' + re.escape(num) + r'(?![\d])', text) is not None


def build(region, root):
    path = os.path.join(HERE, 'decisions', region + '.txt')
    entries, problems = {}, []
    for ln in open(path, encoding='utf-8'):
        ln = ln.split('#', 1)[0].strip()
        if not ln:
            continue
        cid, *toks = ln.split()
        cs, us = cam.get(cid), ukm.get(cid)
        ctext = ca[cs]['data'].get('raw', '') if cs else ''
        utexts = uk_text(us) if us else {}
        items, used_c, used_u = [], False, {}
        for t in toks:
            code, num, flags = t.split(':')
            num = num.replace('_', ' ')
            if 'c' in flags:
                if not cs or not has(num, ctext):
                    problems.append('%s: %s not in Canada text (%s)' % (cid, num, cs))
                used_c = True
            if 'u' in flags:
                part = next((p for p, tx in utexts.items() if has(num, tx)), None)
                if not part:
                    problems.append('%s: %s not in UK text (%s)' % (cid, num, us))
                else:
                    used_u[part] = True
            items.append((code, num))
        items.sort(key=lambda x: ORDER.index(x[0]))
        srcs = []
        if used_c:
            srcs.append('https://travel.gc.ca/destinations/' + cs)
        for part in sorted(used_u, key=lambda p: 0 if p == 'getting-help' else 1):
            srcs.append('https://www.gov.uk/foreign-travel-advice/%s/%s' % (us, part))
        entries[cid] = (items, srcs[:2])
        if len(srcs) > 2:
            problems.append('%s: more than two source pages (%d)' % (cid, len(srcs)))
    if problems:
        print('\n'.join(problems)); print('REFUSED: %d problem(s)' % len(problems)); sys.exit(1)
    lines = ['// National emergency numbers, %s (slice F7b, owner decision 28). Lazy: js/emergency-world.js loads it with the other regions.' % region,
             '// Keyed by the world outline\'s lowercase ISO 3166-1 alpha-2 id (js/data/world-outline.js; `vi` is the US Virgin Islands,',
             '// Vietnam is `vn`). Every entry cites a real government page in `src`; a second page that states numbers of the entry goes in `src2`.',
             '// A number is here because a government page states it for that service (Government of Canada travel advice, the UK FCDO\'s travel',
             '// advice, or a page of the country itself). Where the two pages give different numbers for the same specific service, that service',
             '// is left out. A country with no checkable source has no entry: the screen then gives 112 and the coordinates, never a guess.',
             '// Generated from reviewed decisions; scripts/check-emergency-world.py reads this file.',
             'export const EMERGENCY_WORLD = {']
    for cid in sorted(entries):
        items, srcs = entries[cid]
        lines.append('  %s: { // %s' % (cid, rows[cid]['name']))
        lines.append('    numbers: [')
        for code, num in items:
            lines.append("      { label: '%s', number: '%s' }," % (LABEL[code], num))
        lines.append('    ],')
        lines.append("    src: '%s'%s" % (srcs[0], ',' if len(srcs) > 1 else ''))
        if len(srcs) > 1:
            lines.append("    src2: '%s'" % srcs[1])
        lines.append('  },')
    lines.append('};')
    out = os.path.join(root, 'js', 'data', 'emergency-world.%s.js' % region)
    open(out, 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
    print('wrote %s: %d entries' % (out, len(entries)))


if __name__ == '__main__':
    build(sys.argv[1], sys.argv[2])
