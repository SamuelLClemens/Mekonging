#!/usr/bin/env python3
"""Derive access.stepFree and access.babyChange from OpenStreetMap's own wheelchair= and
changing_table= tags, but ONLY where the OSM object is confidently the same venue.

WHY THE MATCH IS STRICT. An earlier pass rejected OSM as a bulk source for accessibility on
the grounds that matching a curated place to an OSM node by proximity is a guess about
identity, and a wrong "step-free: yes" strands a wheelchair user at the bottom of a
staircase. That objection stands, so the match here is not proximity alone: the OSM object
has to be within 150 m AND share a distinctive name token with the place. "There is something
wheelchair-accessible 150 m from Wat Pho" is not evidence about Wat Pho; "Wat Pho, 40 m away,
tagged wheelchair=limited" is.

Conflicts are dropped rather than resolved: if two matched objects disagree, we do not know.

Usage: python3 scripts/match-osm-access.py <access-batch-dir> [--apply]
"""
import glob, io, json, math, os, re, sys

WHEELCHAIR = {'yes': 'yes', 'designated': 'yes', 'limited': 'partial', 'no': 'no'}

# MEASURED, then tightened. At 150 m with plain token overlap this produced 13 matches of
# which roughly nine were wrong — "Battambang Mart" matched the Battambang riverside stalls on
# the token "battambang", "Novotel Bangkok" matched the BTS/MRT entry on "bangkok", and
# "Mama Leurth Sunset Guesthouse" matched Don Det's sunset strip on "sunset". A ~70% error
# rate on an accessibility field is precisely the failure that strands a wheelchair user at
# the bottom of a staircase, so two things changed: the radius dropped to 40 m, and every
# city, island and province name in the region is treated as a stop word, because a place
# name is a location and not an identity.
MAX_M = 40
GEO_WORDS = (
    'bangkok|chiang|chiangmai|chiangrai|phuket|krabi|lanta|samui|phangan|phanghan|tao|pattaya|'
    'huahin|hua|ayutthaya|sukhothai|kanchanaburi|isan|udon|khon|kaen|korat|ratchathani|'
    'battambang|siem|reap|phnom|penh|sihanouk|kampot|kratie|mondulkiri|ratanakiri|'
    'hanoi|saigon|chi|minh|nang|hoian|hoi|hue|sapa|dalat|nhatrang|trang|quoc|phu|'
    'vientiane|luang|prabang|vang|vieng|pakse|thakhek|savannakhet|nong|khiaw|mekong|'
    'thailand|vietnam|cambodia|laos|lao|thai|viet|khaosan|rambuttri|patong|kata|karon|ubud'
)
STOP = re.compile(
    r'\b(the|of|and|at|in|wat|temple|market|night|street|beach|museum|park|national|old|new|'
    r'city|town|hospital|centre|center|cafe|coffee|restaurant|hotel|hostel|guesthouse|lodge|'
    r'resort|sunset|sunrise|walking|food|stalls|riverside|island|' + GEO_WORDS + r')\b', re.I)


# Some records describe a whole area rather than one venue — "Backpacker hostels (Khaosan /
# Rambuttri)", "Old Town cafes", "riverside stalls". No single OSM object's wheelchair tag can
# speak for a district, so these are excluded outright rather than left to the radius to catch.
AREA_ENTRY = re.compile(r'\b(hostels|hotels|resorts|guesthouses|cafes|bars|stalls|kitchens|'
                        r'restaurants|shops|markets|beaches|temples|street food|nightlife)\b', re.I)


def toks(name):
    s = STOP.sub(' ', (name or '').lower())
    s = re.sub(r'[^\w\s]', ' ', s, flags=re.UNICODE)
    return {w for w in s.split() if len(w) > 3}


def metres(a_lat, a_lng, b_lat, b_lng):
    return math.hypot((a_lng - b_lng) * math.cos(math.radians(a_lat)) * 111320,
                      (a_lat - b_lat) * 110570)


def main(batch_dir):
    apply_changes = '--apply' in sys.argv
    votes = {}          # place id -> {'step': set(), 'baby': set(), 'via': str}
    batches = sorted(glob.glob(os.path.join(batch_dir, 'batch_*.json')))
    if not batches:
        print(f'no batches in {batch_dir}')
        return 2
    for fn in batches:
        data = json.load(io.open(fn, encoding='utf-8'))
        places = data.get('_places') or []
        for el in data.get('elements', []):
            t = el.get('tags') or {}
            wc = WHEELCHAIR.get((t.get('wheelchair') or '').strip().lower())
            ct = (t.get('changing_table') or '').strip().lower()
            if not wc and ct not in ('yes', 'no'):
                continue
            c = el.get('center') or el
            if c.get('lat') is None or c.get('lon') is None:
                continue
            onames = toks(t.get('name')) | toks(t.get('name:en'))
            if not onames:
                continue
            for p in places:
                if AREA_ENTRY.search(p['name']):
                    continue      # see AREA_ENTRY: a district cannot be identified with one POI
                d = metres(p['lat'], p['lng'], c['lat'], c['lon'])
                if d > MAX_M:
                    continue
                if not (onames & toks(p['name'])):
                    continue      # near, but not demonstrably the same venue
                v = votes.setdefault(p['id'], {'step': set(), 'baby': set(), 'via': '', 'd': d})
                if wc and not p['hasStep']:
                    v['step'].add(wc)
                if ct in ('yes', 'no') and not p['hasBaby']:
                    v['baby'].add(ct == 'yes')
                v['via'] = t.get('name') or t.get('name:en') or ''
                v['d'] = min(v['d'], d)

    edits = {}
    conflicts = 0
    for pid, v in votes.items():
        e = {}
        if len(v['step']) == 1:
            e['stepFree'] = next(iter(v['step']))
        elif len(v['step']) > 1:
            conflicts += 1
        if len(v['baby']) == 1:
            e['babyChange'] = next(iter(v['baby']))
        elif len(v['baby']) > 1:
            conflicts += 1
        if e:
            edits[pid] = (e, v['via'], round(v['d']))

    print(f'{len(edits)} places matched confidently, {conflicts} dropped for conflicting tags')
    for pid, (e, via, d) in list(edits.items())[:16]:
        print(f'   {pid:44s} {json.dumps(e)}  <- "{via[:34]}" {d} m')
    if not apply_changes:
        print('DRY RUN — nothing written')
        return 0

    ID = re.compile(r'(?:^|[\s{,])"?id"?:\s*[\'"]([a-z0-9\-]+)[\'"]', re.M)
    written = 0
    for path in sorted(glob.glob('js/data/places.*.js')):
        src = io.open(path, encoding='utf-8').read()
        starts = [(m.start(), m.group(1)) for m in ID.finditer(src)]
        out, cursor, touched = [], 0, False
        for i, (pos, rid) in enumerate(starts):
            if rid not in edits:
                continue
            end = starts[i + 1][0] if i + 1 < len(starts) else len(src)
            body = src[pos:end]
            e, via, d = edits[rid]
            quoted = '"id"' in body[:40]
            has_access = re.search(r'(?:^|[\s{,])"?access"?:', body, re.M) is not None
            if has_access:
                continue          # never rewrite an existing hand-written access object
            inner = ', '.join(
                (f'"{k}": {json.dumps(val)}' if quoted else
                 (f"{k}: '{val}'" if isinstance(val, str) else f'{k}: {str(val).lower()}'))
                for k, val in e.items())
            line_end = src.index('\n', pos) + 1
            indent = re.match(r'\s*', src[line_end:]).group(0)
            key = '"access"' if quoted else 'access'
            note = f'Accessibility from OpenStreetMap ({via}), {d} m from this entry.'
            note_key = '"note"' if quoted else 'note'
            note_val = json.dumps(note, ensure_ascii=False)
            ins = f'{indent}{key}: {{ {inner}, {note_key}: {note_val} }},' + '\n'
            out.append(src[cursor:line_end]); out.append(ins); cursor = line_end
            touched = True
            written += 1
        if touched:
            out.append(src[cursor:])
            io.open(path, 'w', encoding='utf-8').write(''.join(out))
    print(f'APPLIED to {written} records')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else '/tmp/access'))
