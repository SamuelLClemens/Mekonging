#!/usr/bin/env python3
"""Match the world outline's ids to the Canada and UK pages and print both sources' statements (slice F7b).
usage: review.py match            -> unmatched names for both sources
       review.py show <id,id,...> or <continent> -> evidence per country
"""
import json, os, re, sys
H = os.environ.get('EMERGENCY_WORLD_CACHE', os.path.expanduser('~/Library/Caches/mk-emergency-world'))   # holds ca.json and uk.json from harvest.py
NE = json.load(open(os.environ.get('NE_GEOJSON', os.path.expanduser('~/Library/Caches/mk-d26-ne-50m/ne_50m_admin_0_countries.geojson'))))


def code_of(p):
    c = p.get('ISO_A2_EH')
    return (str(p.get('ADM0_A3')) if c in (None, '-99') else c).lower()


def norm(s):
    s = s.lower().replace('&', 'and')
    s = re.sub(r'\(.*?\)', ' ', s)
    s = re.sub(r"[.'’,\-]", ' ', s)
    s = re.sub(r'\b(the|of|republic|dem|democratic|rep|and|is|islands|island|isl)\b', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


# outline id -> alternative names the two sites use
ALIAS = {
    'mm': ['burma myanmar', 'myanmar burma', 'burma'], 'cz': ['czech republic', 'czechia'], 'tl': ['east timor', 'timor leste'],
    'cd': ['congo democratic', 'congo kinshasa', 'democratic republic congo'], 'cg': ['congo brazzaville', 'congo republic'],
    'ci': ['ivory coast', 'cote d ivoire'], 'kr': ['south korea', 'korea south'], 'kp': ['north korea', 'korea north'],
    'sz': ['eswatini', 'swaziland'], 'mk': ['north macedonia', 'macedonia'], 'cv': ['cabo verde', 'cape verde'],
    'tr': ['turkey', 'turkiye', 'türkiye'], 'us': ['united states', 'usa', 'united states america'], 'gb': ['united kingdom', 'uk'],
    'ps': ['palestinian territories', 'west bank and gaza', 'israel west bank and gaza', 'occupied palestinian territories'],
    'bs': ['bahamas'], 'gm': ['gambia'], 'vc': ['saint vincent grenadines'], 'kn': ['saint kitts nevis'], 'lc': ['saint lucia'],
    'ba': ['bosnia herzegovina', 'bosnia and herzegovina'], 'hk': ['hong kong'], 'mo': ['macao', 'macau'], 'tw': ['taiwan'],
    'fm': ['micronesia federated states', 'micronesia'], 'vi': ['virgin islands us', 'us virgin'], 'vg': ['virgin islands british', 'british virgin'],
    'sx': ['sint maarten'], 'mf': ['saint martin', 'st martin'], 'bl': ['saint barthelemy', 'st barthelemy'], 'pm': ['saint pierre miquelon'],
    'sh': ['saint helena'], 'ax': ['aland'], 'xk': ['kosovo'], 'rs': ['serbia'], 'va': ['holy see', 'vatican city', 'vatican'],
    'ru': ['russia', 'russian federation'], 'sy': ['syria'], 'ir': ['iran'], 'la': ['laos'], 'vn': ['vietnam'], 'bo': ['bolivia'], 've': ['venezuela'],
    'tz': ['tanzania'], 'md': ['moldova'], 'bn': ['brunei'], 'fk': ['falkland islands malvinas', 'falkland'], 'cw': ['curacao'],
    'gg': ['guernsey'], 'je': ['jersey'], 'im': ['isle man'], 'fo': ['faroe', 'faeroe'], 'gl': ['greenland'], 'nc': ['new caledonia'],
    'pf': ['french polynesia'], 'tc': ['turks caicos'], 'ky': ['cayman'], 'mp': ['northern mariana'], 'ck': ['cook'], 'sb': ['solomon'],
    'mh': ['marshall'], 'ag': ['antigua barbuda'], 'tt': ['trinidad tobago'], 'st': ['sao tome principe'], 'gw': ['guinea bissau'],
    'cf': ['central african'], 'gq': ['equatorial guinea'], 'ss': ['south sudan'], 'do': ['dominican'], 'wf': ['wallis futuna'],
    'as': ['american samoa'], 'eh': ['western sahara'], 'nf': ['norfolk'], 'cx': ['christmas'], 'cc': ['cocos keeling'],
}


def ne_rows():
    rows = {}
    for f in NE['features']:
        p = f['properties']
        c = code_of(p)
        rows.setdefault(c, dict(id=c, name=p['NAME_LONG'] or p['NAME'], short=p['NAME'], sov=p['SOVEREIGNT'], cont=p['CONTINENT'], sub=p['SUBREGION']))
    return rows


def index(src):
    d = json.load(open(os.path.join(H, src + '.json')))
    return d


def match(rows, d):
    by = {}
    for slug, v in d.items():
        by.setdefault(norm(v['name']), slug)
    out, miss = {}, []
    for c, r in rows.items():
        cands = [norm(r['name']), norm(r['short'])] + [norm(a) for a in ALIAS.get(c, [])]
        hit = next((by[x] for x in cands if x in by), None)
        if hit:
            out[c] = hit
        else:
            miss.append(c)
    return out, miss


def main():
    rows = ne_rows()
    ca, uk = index('ca'), index('uk') if os.path.exists(os.path.join(H, 'uk.json')) else {}
    cam, camiss = match(rows, ca)
    ukm, ukmiss = match(rows, uk) if uk else ({}, [])
    if sys.argv[1] == 'match':
        print('canada pages', len(ca), 'matched', len(cam), 'unmatched ids:', [(c, rows[c]['short']) for c in camiss])
        used = set(cam.values()); print('canada slugs with no id:', [s for s in ca if s not in used])
        print('uk pages', len(uk), 'matched', len(ukm), 'unmatched ids:', [(c, rows[c]['short']) for c in ukmiss])
        used = set(ukm.values()); print('uk slugs with no id:', [s for s in uk if s not in used])
        return
    want = sys.argv[2]
    ids = [c for c, r in rows.items() if r['cont'] == want] if want in ('Asia', 'Europe', 'Africa', 'North America', 'South America', 'Oceania') else want.split(',')
    for c in sorted(ids):
        r = rows[c]
        print('=== %s %s (%s)' % (c, r['name'], r['sub']))
        s = cam.get(c)
        if s:
            v = ca[s]['data']
            print('  CA [%s]: %s | %s' % (s, v.get('status'), ('; '.join('%s=%s' % p for p in v.get('pairs', [])) or v.get('raw', ''))[:230]))
        else:
            print('  CA: no page')
        s = ukm.get(c)
        if s:
            for part, v in ca_uk(uk, s):
                print('  UK [%s/%s]: %s' % (s, part, ' || '.join(v)[:260]))
        else:
            print('  UK: no page')


def ca_uk(uk, s):
    for part, v in uk[s]['data'].items():
        if v.get('raw'):
            yield part, v['raw']


if __name__ == '__main__':
    main()
