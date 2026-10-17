#!/usr/bin/env python3
"""Fill place local-script names from Wikipedia and Wikidata (plan slice D4).

The sibling of scripts/fetch-place-photos.py. A place's `localName` is its name in the local
script, so a traveller can show it to a driver. The hard part is the same as for photos: the
right article. So this tool never guesses a name. It starts from the English article a person
already reviewed for the place (scripts/place-photo-articles.json, or an en.wikipedia page the
record itself cites), asks Wikipedia for that article's title in the country's own language
(Thai, Vietnamese, Khmer, Lao) and Wikidata for its label in the same language, and a person
records the right ones in scripts/local-names.json with the source.

THE STEPS, one run each:

    python3 scripts/fetch-local-names.py --country la --report
        Coverage only, no network.

    python3 scripts/fetch-local-names.py --suggest OUT.json
        For every place with no localName and a reviewed English article: the article's title in
        the local Wikipedia and its Wikidata label. Review OUT.json by hand. Exits 1 if any
        lookup failed, because a failed lookup looks exactly like "no local name".

    python3 scripts/fetch-local-names.py --install
        Writes each accepted name into its place record, as a `localName` line before the
        `categories` line, in the record's own key style (the place files mix JS keys and
        JSON-style quoted keys). Then run scripts/build-pack-sizes.py --write and
        scripts/build-sw-manifest.py --write, and bump the version.

A SOURCE FOR EVERY NAME. local-names.json keeps the URL each name came from: the local Wikipedia
page, or the Wikidata item where the language has no page. Names are the source's own spelling
(Unicode NFC, trailing zero-width spaces removed) and carry no romanisation: the plan says native
script, and a romanisation this tool made up would not be sourced.
"""
import argparse
import importlib.util
import json
import os
import re
import sys
import unicodedata
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
NAMES = os.path.join(ROOT, 'scripts', 'local-names.json')
LANG = {'th': 'th', 'vi': 'vi', 'kh': 'km', 'la': 'lo'}

# Reuse the photo tool's record parser, curl transport and reviewed-article map.
_spec = importlib.util.spec_from_file_location('fetch_place_photos', os.path.join(ROOT, 'scripts', 'fetch-place-photos.py'))
fpp = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(fpp)
fpp.UA = 'Mekonging/1.0 (+https://github.com/SamuelLClemens/Mekonging; offline travel guide, local-name fetch)'


def clean(name):
    """The source's own spelling, normalised: NFC, no edge whitespace or zero-width spaces."""
    return unicodedata.normalize('NFC', name).strip().strip('​').strip()


def has_local(body):
    return bool(re.search(fpp._q('localName') + r'[\'"]', body))


def scan(cc):
    """{id: {file, start, end, has_local}} for every record: start/end bound the record's body."""
    out = {}
    for rel in fpp.PLACE_FILES[cc]:
        src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
        ms = list(fpp.ID_RE.finditer(src))
        for i, m in enumerate(ms):
            end = ms[i + 1].start() if i + 1 < len(ms) else len(src)
            out[m.group(2)] = {'file': rel, 'start': m.end(), 'end': end, 'has_local': has_local(src[m.end():end])}
    return out


def load_names():
    if not os.path.exists(NAMES):
        return {}
    with open(NAMES, encoding='utf-8') as fh:
        return json.load(fh)


def vetted_articles(cc, gap_ids, places):
    """gap id -> the English article already reviewed for that place (D3 file, or its own source)."""
    arts = fpp.load_articles()
    m = dict(arts.get(cc, {}))
    for pid, v in list(arts['rejected'].items()) + list(arts['replaced'].items()):
        if pid.startswith(cc + '-'):
            m[pid] = v['article']
    for p in places:
        if p['id'] not in m and p['wiki']:
            m[p['id']] = p['wiki'][0]
    return {pid: t for pid, t in m.items() if pid in gap_ids}


# ---- report -------------------------------------------------------------------------------

def report(cc):
    sc = scan(cc)
    gaps = {pid for pid, r in sc.items() if not r['has_local']}
    names = load_names()
    accepted = names.get(cc, {})
    rejected = {k for k in names.get('rejected', {}) if k.startswith(cc + '-')}
    pending = [pid for pid in accepted if pid in gaps]
    print('%s: %d places, %d with a localName, %d without' % (cc, len(sc), len(sc) - len(gaps), len(gaps)))
    print('  of the %d without: %d accepted and not yet installed, %d rejected' % (len(gaps), len(pending), len(rejected & gaps)))


# ---- suggest ------------------------------------------------------------------------------

FAILURES = []
GENERIC = {'the', 'and', 'wat', 'tad', 'tham', 'ban', 'national', 'park', 'beach', 'market', 'island', 'falls',
           'waterfall', 'cave', 'caves', 'temple', 'lake', 'bay', 'old', 'town', 'phu', 'phnom', 'koh', 'mount'}


def words(s):
    return {w for w in re.findall(r'[a-z]{3,}', unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode())
            if w not in GENERIC}


def local_for(cc, titles):
    """{english title: {wp, qid, wd}}: the title in the local Wikipedia and the Wikidata label."""
    titles = sorted(set(titles))
    info = {}
    for i in range(0, len(titles), 40):
        batch = titles[i:i + 40]
        try:
            # lllang keeps it to one language link per page, so nothing is cut off by lllimit.
            d = fpp.wp({'titles': '|'.join(batch), 'redirects': 1, 'prop': 'langlinks|pageprops',
                        'lllang': LANG[cc], 'lllimit': 'max', 'ppprop': 'wikibase_item'})
        except Exception as e:                                  # noqa: BLE001
            FAILURES.append('%s langlinks: %s' % (cc, e))
            continue
        q = d['query']
        norm = {n['from']: n['to'] for n in q.get('normalized', [])}
        redir = {r['from']: r['to'] for r in q.get('redirects', [])}
        by_title = {}
        for pg in q['pages']:
            ll = pg.get('langlinks') or []
            by_title[pg['title']] = {'wp': ll[0]['title'] if ll else None,
                                     'qid': (pg.get('pageprops') or {}).get('wikibase_item')}
        for t in batch:
            info[t] = dict(by_title.get(redir.get(norm.get(t, t), norm.get(t, t)), {'wp': None, 'qid': None}))
    qids = sorted({v['qid'] for v in info.values() if v['qid']})
    labels = {}
    for i in range(0, len(qids), 40):
        try:
            d = fpp.get('https://www.wikidata.org/w/api.php?' + urllib.parse.urlencode({
                'action': 'wbgetentities', 'format': 'json', 'ids': '|'.join(qids[i:i + 40]),
                'props': 'labels', 'languages': LANG[cc]}))
        except Exception as e:                                  # noqa: BLE001
            FAILURES.append('%s wikidata: %s' % (cc, e))
            continue
        for k, v in d.get('entities', {}).items():
            lab = v.get('labels', {}).get(LANG[cc])
            if lab:
                labels[k] = lab['value']
    for v in info.values():
        v['wd'] = labels.get(v['qid'])
    return info


def candidates(p):
    """Articles that could be this place: the en.wikipedia pages its own sources cite, plus the top
    search hits for its name, each with its distance. Only the plausible ones are kept: cited by
    the record, within 5 km of it, or sharing a word with its name."""
    cands = {}
    for t, v in fpp.article_info(p['wiki']).items():
        v['via'] = 'source'
        cands[t] = v
    for q in fpp.search_variants(p['name']):
        d = fpp.wp({'generator': 'search', 'gsrsearch': q, 'gsrlimit': '4',
                    'prop': 'coordinates|pageimages|description', 'piprop': 'name', 'pilicense': 'free'})
        for t, v in fpp._pages(d).items():
            v['via'] = 'search'
            cands.setdefault(t, v)
    out = []
    for t, v in cands.items():
        d = fpp.km(p['lat'], p['lng'], v['lat'], v['lng'])
        if v['via'] == 'source' or (d is not None and d <= 5) or (d is None and words(t) & words(p['name'])):
            out.append({'title': t, 'km': d, 'desc': v['desc'], 'via': v['via']})
    out.sort(key=lambda r: (r['via'] != 'source', r['km'] is None, r['km'] or 0))
    return out[:4]


def suggest(out_path):
    arts = fpp.load_articles()
    names = load_names()
    decided = set(names.get('rejected', {}))
    rows = {}
    for cc in ('th', 'vi', 'kh', 'la'):
        sc = scan(cc)
        decided_cc = decided | set(names.get(cc, {}))
        gaps = {pid for pid, r in sc.items() if not r['has_local'] and pid not in decided_cc}
        places = fpp.load_places(cc)
        by_id = {p['id']: p for p in places}
        vetted = vetted_articles(cc, gaps, places)
        never = sorted(gaps - set(vetted) - set(arts.get('no_article', {}).get(cc, [])))
        found = {}
        for i, pid in enumerate(never, 1):
            try:
                found[pid] = candidates(by_id[pid])
            except Exception as e:                              # noqa: BLE001
                FAILURES.append('%s search %s: %s' % (cc, pid, e))
            print('[%s %d/%d] %-46s %s' % (cc, i, len(never), pid[:46], (found.get(pid) or [{'title': '-'}])[0]['title']))
        titles = set(vetted.values()) | {c['title'] for cs in found.values() for c in cs}
        info = local_for(cc, titles)
        rows[cc] = []
        for pid, t in sorted(vetted.items()):
            v = info.get(t, {})
            rows[cc].append({'id': pid, 'card': by_id[pid]['name'], 'group': 'reviewed', 'en': t,
                             'wp': v.get('wp'), 'qid': v.get('qid'), 'wd': v.get('wd')})
        for pid in never:
            cs = [dict(c, **{k: info.get(c['title'], {}).get(k) for k in ('wp', 'qid', 'wd')}) for c in found.get(pid, [])]
            rows[cc].append({'id': pid, 'card': by_id[pid]['name'], 'group': 'unreviewed', 'cands': cs})
        n = sum(1 for r in rows[cc] if (r.get('wp') or r.get('wd')) or any(c['wp'] or c['wd'] for c in r.get('cands', [])))
        print('%s: %d gaps = %d reviewed article + %d never reviewed + the rest with no article; %d have a local name to review'
              % (cc, len(gaps), len(vetted), len(never), n))
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
    print('wrote', out_path)
    if FAILURES:
        print('FAILED LOOKUPS (%d): the result is incomplete, rerun before reviewing' % len(FAILURES), file=sys.stderr)
        for f in FAILURES[:5]:
            print('  ' + f, file=sys.stderr)
        sys.exit(1)


# ---- install ------------------------------------------------------------------------------

def install():
    names = load_names()
    total = 0
    for cc in ('th', 'vi', 'kh', 'la'):
        sc = scan(cc)
        todo = {}
        for pid, v in names.get(cc, {}).items():
            if pid not in sc:
                sys.exit('%s: no place record has the id %s' % (cc, pid))
            if sc[pid]['has_local']:
                continue
            todo.setdefault(sc[pid]['file'], []).append((sc[pid]['start'], sc[pid]['end'], pid, clean(v['name'])))
        for rel, items in todo.items():
            path = os.path.join(ROOT, rel)
            src = open(path, encoding='utf-8').read()
            for start, end, pid, name in sorted(items, reverse=True):
                body = src[start:end]
                m = re.search(r'^([ \t]*)(["\']?)categories\2[ \t]*:', body, re.M)
                if not m:
                    sys.exit('%s: record %s has no categories line to insert before' % (rel, pid))
                q = m.group(2)
                line = '%s%slocalName%s: %s,\n' % (m.group(1), q, q, json.dumps(name, ensure_ascii=False))
                at = start + m.start()
                src = src[:at] + line + src[at:]
                total += 1
            open(path, 'w', encoding='utf-8').write(src)
        left = [pid for pid in names.get(cc, {}) if not scan(cc)[pid]['has_local']]
        if left:
            sys.exit('%s: installed names did not take for %s' % (cc, left[:3]))
    print('installed %d localName lines' % total)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--country', choices=sorted(LANG), default=None)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--report', action='store_true')
    g.add_argument('--suggest', metavar='OUT.json')
    g.add_argument('--install', action='store_true')
    a = ap.parse_args()
    if a.report:
        for cc in ([a.country] if a.country else sorted(LANG)):
            report(cc)
    elif a.suggest:
        suggest(a.suggest)
    else:
        install()


if __name__ == '__main__':
    main()
