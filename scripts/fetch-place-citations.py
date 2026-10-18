#!/usr/bin/env python3
"""Give homepage-only place citations a page about the place (plan slice D5).

check-sources.py counts a place as "homepage-only" when every one of its `sources[].url` values
is a bare homepage (https://www.tripadvisor.com, https://vietnam.travel). Such a record cites
nothing a traveller can check. This tool lists those records, suggests a page that is about the
place, and installs the pages a person accepted in scripts/place-citations.json.

THE STEPS, one country per session:

    python3 scripts/fetch-place-citations.py --country th --report
        Homepage-only records and their lane, no network.

    python3 scripts/fetch-place-citations.py --country th --suggest OUT.json
        For each homepage-only record with no decision yet: the English Wikipedia article a
        person already reviewed for it (scripts/place-photo-articles.json), or the top search
        hits for places never reviewed, each with its distance from the card's coordinates; and
        the Wikivoyage page for the card's city. Review OUT.json by hand: open each page and keep
        it only if it is about the place. Exits 1 if any lookup failed.

    python3 scripts/fetch-place-citations.py --install
        Writes each accepted decision into its record's `sources` array, in the record's own
        format (one-line JS keys or multi-line quoted keys). Then bump the version and run
        scripts/build-pack-sizes.py --write and scripts/build-sw-manifest.py --write.

THE ORDER OF PREFERENCE (owner, 2026-10-18): the cited organisation's own page about the place
(a "swap": its homepage URL is replaced); else the place's own Wikipedia article; else, for a
stay or food cluster, the tourism board's page or the Wikivoyage page for its town. Bare
homepages left over stay in the list (a Tripadvisor homepage already renders as a search for the
place, see sourceHref in js/render-utils.js). A record with no acceptable page is filed under
`open` with the reason, so the next run does not look at it again.

THE DECISIONS FILE, scripts/place-citations.json:

    {"th": {"<place id>": {"add": [{"org": "...", "url": "..."}],
                           "swap": {"<old url>": {"org": "...", "url": "..."}},
                           "basis": "what the page supports"}},
     "open": {"<place id>": "why no page was accepted"}}
"""
import argparse
import importlib.util
import json
import os
import re
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CITES = os.path.join(ROOT, 'scripts', 'place-citations.json')
COUNTRIES = ('th', 'vi', 'kh', 'la')


def _load(name, file):
    spec = importlib.util.spec_from_file_location(name, os.path.join(ROOT, 'scripts', file))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


# The photo tool's transport and record parser, the local-name tool's article search, and the
# guard's own homepage test, so this tool and check-sources.py can never disagree on a record.
fpp = _load('fetch_place_photos', 'fetch-place-photos.py')
fln = _load('fetch_local_names', 'fetch-local-names.py')
cks = _load('check_sources', 'check-sources.py')
fpp.UA = 'Mekonging/1.0 (+https://github.com/SamuelLClemens/Mekonging; offline travel guide, citation check)'


def wiki_url(title, host='en.wikipedia.org'):
    return 'https://%s/wiki/%s' % (host, urllib.parse.quote(title.replace(' ', '_'), safe='()_,-.:'))


def load_cites():
    if not os.path.exists(CITES):
        return {}
    with open(CITES, encoding='utf-8') as fh:
        return json.load(fh)


def offenders(cc):
    """{id: [urls]} for the country's homepage-only records, exactly as check-sources.py sees them."""
    os.chdir(ROOT)
    _, rows = cks.homepage_only_places()
    return {pid: urls for pid, path, urls in rows if pid.startswith(cc + '-')}


def lanes(cc, ids):
    """id -> ('reviewed', title) | ('no_article', None) | ('unreviewed', None), from the D3 file."""
    arts = fpp.load_articles()
    reviewed = dict(arts.get(cc, {}))
    for pid, v in list(arts['rejected'].items()) + list(arts['replaced'].items()):
        if pid.startswith(cc + '-'):
            reviewed[pid] = v['article']
    none = set(arts.get('no_article', {}).get(cc, []))
    out = {}
    for pid in ids:
        out[pid] = ('reviewed', reviewed[pid]) if pid in reviewed else ('no_article', None) if pid in none else ('unreviewed', None)
    return out


# ---- report -------------------------------------------------------------------------------

def report(cc):
    off = offenders(cc)
    cites = load_cites()
    done = set(cites.get(cc, {}))
    opened = {k for k in cites.get('open', {}) if k.startswith(cc + '-')}
    by = {}
    for pid, (lane, _) in lanes(cc, off).items():
        by[lane] = by.get(lane, 0) + 1
    print('%s: %d homepage-only records (%s); %d decided and not yet installed, %d filed open'
          % (cc, len(off), ', '.join('%s %d' % kv for kv in sorted(by.items())), len(done & set(off)), len(opened & set(off))))
    if '--list' in sys.argv:
        places = {p['id']: p for p in fpp.load_places(cc)}
        for pid, (lane, title) in sorted(lanes(cc, off).items()):
            mark = 'decided' if pid in done else 'open' if pid in opened else ''
            print('  %-46s %-10s %-8s %s | %s' % (pid, lane, mark, places[pid]['name'][:40], title or ''))


# ---- suggest ------------------------------------------------------------------------------

FAILURES = []


def wikivoyage(cities):
    """{city: url or None}: the English Wikivoyage page for each card city, redirects followed."""
    out = {}
    names = sorted(set(c for c in cities if c))
    for i in range(0, len(names), 40):
        batch = names[i:i + 40]
        try:
            d = fpp.get('https://en.wikivoyage.org/w/api.php?' + urllib.parse.urlencode({
                'action': 'query', 'format': 'json', 'formatversion': '2', 'redirects': '1',
                'titles': '|'.join(batch)}))
        except Exception as e:                                  # noqa: BLE001
            FAILURES.append('wikivoyage: %s' % e)
            continue
        q = d.get('query', {})
        norm = {n['from']: n['to'] for n in q.get('normalized', [])}
        redir = {r['from']: r['to'] for r in q.get('redirects', [])}
        have = {p['title'] for p in q.get('pages', []) if p.get('missing') is None and 'title' in p}
        for c in batch:
            t = redir.get(norm.get(c, c), norm.get(c, c))
            out[c] = wiki_url(t, 'en.wikivoyage.org') if t in have else None
    return out


def suggest(cc, out_path):
    off = offenders(cc)
    cites = load_cites()
    skip = set(cites.get(cc, {})) | set(cites.get('open', {}))
    todo = {pid: urls for pid, urls in off.items() if pid not in skip}
    places = {p['id']: p for p in fpp.load_places(cc)}
    ln = lanes(cc, todo)
    titles = sorted({t for lane, t in ln.values() if t})
    info = {}
    for i in range(0, len(titles), 40):
        try:
            info.update(fpp.article_info(titles[i:i + 40]))
        except Exception as e:                                  # noqa: BLE001
            FAILURES.append('article info: %s' % e)
    voy = wikivoyage(places[pid]['city'] for pid in todo)
    rows = []
    for n, pid in enumerate(sorted(todo), 1):
        p = places[pid]
        lane, title = ln[pid]
        row = {'id': pid, 'card': p['name'], 'city': p['city'], 'lane': lane, 'now': todo[pid],
               'wikivoyage': voy.get(p['city'])}
        if title:
            # article_info follows redirects, so the reviewed title may come back as its target.
            v = info.get(title) or next((x for t, x in info.items() if t.lower() == title.lower()), {})
            row['article'] = {'title': title, 'url': wiki_url(title), 'desc': v.get('desc', ''),
                              'km': fpp.km(p['lat'], p['lng'], v.get('lat'), v.get('lng'))}
        else:
            try:
                row['cands'] = [dict(c, url=wiki_url(c['title'])) for c in fln.candidates(p)]
            except Exception as e:                              # noqa: BLE001
                FAILURES.append('search %s: %s' % (pid, e))
        rows.append(row)
        best = row.get('article') or (row.get('cands') or [{}])[0]
        print('[%d/%d] %-44s %-10s %-40s %s km' % (n, len(todo), pid[:44], lane, (best.get('title') or '-')[:40], best.get('km')))
    with open(out_path, 'w', encoding='utf-8') as fh:
        json.dump(rows, fh, ensure_ascii=False, indent=1)
    print('wrote %s: %d records' % (out_path, len(rows)))
    if FAILURES:
        print('FAILED LOOKUPS (%d): the result is incomplete, rerun before reviewing' % len(FAILURES), file=sys.stderr)
        for f in FAILURES[:5]:
            print('  ' + f, file=sys.stderr)
        sys.exit(1)


# ---- install ------------------------------------------------------------------------------

ENTRY_RE = re.compile(r'\{[^{}]*\}')


VALUE_RE = r'(["\'])((?:\\.|(?!\1)[^\\])*)\1'


def field(entry, key):
    """The string value of `key` in one entry, single- or double-quoted; None if absent."""
    m = re.search(fpp._q(key) + VALUE_RE, entry)
    if not m:
        return None
    return json.loads('"%s"' % m.group(2).replace("\\'", "'").replace('"', '\\"')) if m.group(1) == "'" else json.loads('"%s"' % m.group(2))


def literal(value, quote):
    return json.dumps(value, ensure_ascii=False) if quote == '"' else "'%s'" % value.replace('\\', '\\\\').replace("'", "\\'")


def with_values(entry, org, url):
    """The entry's own text with its org and url values replaced, so its layout is kept."""
    for key, val in (('org', org), ('url', url)):
        m = re.search(fpp._q(key) + VALUE_RE, entry)
        entry = entry[:m.start(2) - 1] + literal(val, m.group(1)) + entry[m.end(2) + 1:]
    return entry


def array_span(src, start, end):
    """(open, close) offsets of the record's `sources` array, bracket-matched."""
    m = cks.SOURCES_KEY_RE.search(src, start, end)
    if not m:
        return None
    depth = 0
    for i in range(m.end() - 1, end):
        if src[i] == '[':
            depth += 1
        elif src[i] == ']':
            depth -= 1
            if depth == 0:
                return m.end() - 1, i + 1
    return None


def rewrite(old, dec):
    """The array with the decision applied as small edits: each swapped entry keeps its text with
    new values, and each added entry is a copy of the first entry's text, placed before it. The
    place files write arrays at least five ways (one line; one entry per line; one key per line;
    trailing commas or not; single or double quotes), and this keeps whichever one is there."""
    ents = list(ENTRY_RE.finditer(old))
    if not ents or any(field(e.group(0), 'org') is None or field(e.group(0), 'url') is None for e in ents):
        return None
    out = old
    for e in reversed(ents):
        new = dec.get('swap', {}).get(field(e.group(0), 'url'))
        if new:
            out = out[:e.start()] + with_values(e.group(0), new['org'], new['url']) + out[e.end():]
    have = {field(e, 'url') for e in ENTRY_RE.findall(out)}
    adds = [a for a in dec.get('add', []) if a['url'] not in have]
    if adds:
        first = ENTRY_RE.search(out)
        if len(ents) > 1:
            sep = out[first.end():ENTRY_RE.search(out, first.end()).start()]
        else:
            sep = ',' + out[out.rfind('\n', 0, first.start()):first.start()] if '\n' in out[:first.start()] else ', '
        block = ''.join(with_values(first.group(0), a['org'], a['url']) + sep for a in adds)
        out = out[:first.start()] + block + out[first.start():]
    return out


def install():
    cites = load_cites()
    total = 0
    for cc in COUNTRIES:
        decided = cites.get(cc, {})
        if not decided:
            continue
        sc = fln.scan(cc)
        by_file = {}
        for pid, dec in decided.items():
            if pid not in sc:
                sys.exit('%s: no place record has the id %s' % (cc, pid))
            by_file.setdefault(sc[pid]['file'], []).append((sc[pid]['start'], sc[pid]['end'], pid, dec))
        for rel, items in by_file.items():
            path = os.path.join(ROOT, rel)
            src = open(path, encoding='utf-8').read()
            for start, end, pid, dec in sorted(items, key=lambda r: r[0], reverse=True):
                span = array_span(src, start, end)
                if not span:
                    sys.exit('%s: record %s has no sources array' % (rel, pid))
                old = src[span[0]:span[1]]
                new = rewrite(old, dec)
                if new is None:
                    sys.exit('%s: record %s has a source entry this tool cannot read' % (rel, pid))
                if new == old:
                    continue
                src = src[:span[0]] + new + src[span[1]:]
                total += 1
            open(path, 'w', encoding='utf-8').write(src)
    os.chdir(ROOT)
    _, rows = cks.homepage_only_places()
    still = {pid for pid, _, _ in rows} & {pid for cc in COUNTRIES for pid in cites.get(cc, {})}
    if still:
        sys.exit('installed decisions left these homepage-only: %s' % sorted(still)[:5])
    print('rewrote %d sources arrays' % total)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--country', choices=COUNTRIES, default=None)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument('--report', action='store_true')
    g.add_argument('--suggest', metavar='OUT.json')
    g.add_argument('--install', action='store_true')
    ap.add_argument('--list', action='store_true', help='with --report: one line per record')
    a = ap.parse_args()
    if a.report:
        for cc in ([a.country] if a.country else COUNTRIES):
            report(cc)
    elif a.suggest:
        if not a.country:
            sys.exit('--suggest needs --country')
        suggest(a.country, a.suggest)
    else:
        install()


if __name__ == '__main__':
    main()
