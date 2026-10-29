#!/usr/bin/env python3
"""Draft decision lines for a region (slice F7b). Auto-drafts only the unambiguous cases; prints the raw evidence for the rest.
usage: python3 -I tools/emergency-world/draft.py <region>   -> writes decisions/<region>.draft.txt (auto lines) and prints the manual cases with evidence.
"""
import os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import build_region as br
rows, cam, ukm, ca, uk, has, uk_text = br.rows, br.cam, br.ukm, br.ca, br.uk, br.has, br.uk_text
FOUR = {'th', 'vn', 'kh', 'la'}


def region_of(r):
    c, s = r['cont'], r['sub']
    if c == 'Asia' or (c.startswith('Seven seas') and s == 'Southern Asia'): return 'asia'
    if c == 'Europe': return 'europe'
    if c == 'Africa' or (c.startswith('Seven seas') and 'Africa' in s): return 'africa'
    if c in ('North America', 'South America'): return 'americas'
    if c == 'Oceania': return 'oceania'
    return None


SVC = {'police': 'P', 'medical assistance': 'A', 'ambulance': 'A', 'firefighters': 'F', 'fire': 'F', 'fire services': 'F', 'fire department': 'F'}
PAIR = re.compile(r'(police|medical assistance|ambulance|firefighters|fire services|fire department|fire)\s*:\s*(\d{2,5})(?![\d/ ]*\d)', re.I)


def uk_services(utexts):
    out = {}
    blob = ' '.join(utexts.values())
    for m in re.finditer(r'(Ambulance|Fire|Police)[a-z /&and]*?\s*:\s*([0-9][0-9 /or]*)', blob):
        nums = set(re.findall(r'\d{2,5}', m.group(2)))
        out.setdefault({'Ambulance': 'A', 'Fire': 'F', 'Police': 'P'}[m.group(1)], set()).update(nums)
    return out


def draft(region):
    auto, manual = [], []
    for cid, r in sorted(rows.items()):
        if region_of(r) != region or cid in FOUR:
            continue
        cs, us = cam.get(cid), ukm.get(cid)
        cv = ca[cs]['data'] if cs else {}
        utexts = uk_text(us) if us else {}
        raw = cv.get('raw', '') if cv.get('status') == 'ok' else ''
        ublob = ' '.join(utexts.values())
        line = None
        # structured: every pair is a known service and nothing else is in the block but those
        pairs = [(k.lower(), n) for k, n in PAIR.findall(raw)]
        stripped = PAIR.sub('', raw)
        if pairs and len(re.findall(r'\d', stripped)) == 0 and len({SVC[k] for k, _ in pairs}) == len(pairs):
            us_svc = uk_services(utexts)
            conflict = any(SVC[k] in us_svc and n not in us_svc[SVC[k]] for k, n in pairs)
            if not conflict:
                toks = []
                for k, n in pairs:
                    fl = 'c' + ('u' if has(n, ublob) else '')
                    toks.append('%s:%s:%s' % (SVC[k], n, fl))
                line = '%s %s' % (cid, ' '.join(toks))
        else:
            gen = re.match(r'^(?:In case of emergency, )?(?:dial|call|Dial|Call)\s+(\d{2,5})(?: for emergency assistance)?\.?\s*$', raw.strip()) or \
                  re.match(r'^Dial (\d{2,5}) for emergency assistance\.?\s*$', raw.strip())
            if gen:
                n = gen.group(1)
                ukn = set(re.findall(r'(?:Telephone|Dial|Call)\s*:?\s*(\d{2,5})', ublob))
                if not ukn or n in ukn:
                    line = '%s G:%s:%s' % (cid, n, 'cu' if has(n, ublob) else 'c')
        (auto if line else manual).append(line or cid)
    open(os.path.join(HERE, 'decisions', region + '.draft.txt'), 'w').write('\n'.join(a for a in auto) + '\n')
    print('AUTO-DRAFTED %d, MANUAL %d' % (len(auto), len(manual)))
    for cid in manual:
        r = rows[cid]; cs, us = cam.get(cid), ukm.get(cid)
        print('=== %s %s' % (cid, r['name']))
        print('  CA[%s]: %s' % (cs, (ca[cs]['data'].get('raw') or ca[cs]['data'].get('status'))[:300] if cs else 'no page'))
        if us:
            for part, t in uk_text(us).items():
                if t: print('  UK[%s/%s]: %s' % (us, part, t[:230]))
        else:
            print('  UK: no page')


if __name__ == '__main__':
    draft(sys.argv[1])
