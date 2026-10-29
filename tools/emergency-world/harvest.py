#!/usr/bin/env python3
"""Harvest the emergency-number blocks of two government advisories (slice F7b), into the cache directory.
Canada travel.gc.ca/destinations/<slug>: "Emergency services / In case of emergency, dial: police: N ...".
UK gov.uk/foreign-travel-advice/<slug>/{getting-help,health}: "Emergency services in X ..." and "Emergency medical number".
Caches every page under research/ca and research/uk, writes ca.json and uk.json (raw segments + parsed pairs).
usage: python3 -I tools/emergency-world/harvest.py ca|uk      (about 12 minutes for Canada, 25 for the UK; resumes from the cache)
"""
import html, json, os, re, subprocess, sys, time
HERE = os.environ.get('EMERGENCY_WORLD_CACHE', os.path.expanduser('~/Library/Caches/mk-emergency-world'))   # the pages and the two json files go here, never in the repo
UA = 'Mozilla/5.0 (compatible; MekongResearch/1.0; +https://www.mekonging.com)'


def fetch(url, path):
    if os.path.exists(path) and os.path.getsize(path) > 500:
        return open(path, encoding='utf-8', errors='replace').read()
    for attempt in range(3):
        r = subprocess.run(['curl', '-sS', '-L', '-m', '45', '-A', UA, '-w', '\n__HTTP__%{http_code}', url], capture_output=True)
        out = r.stdout.decode('utf-8', 'replace')
        body, _, code = out.rpartition('\n__HTTP__')
        if code == '200' and len(body) > 500:
            os.makedirs(os.path.dirname(path), exist_ok=True)
            open(path, 'w', encoding='utf-8').write(body)
            time.sleep(0.35)
            return body
        time.sleep(2 + attempt * 3)
    return None


def text(s):
    t = re.sub(r'<script.*?</script>|<style.*?</style>', '', s, flags=re.S)
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', t))).strip()


NUM = r'[0-9][0-9 \-–+*#()/]*[0-9#*]|[0-9]'
PAIR = re.compile(r'([A-Za-z][A-Za-z /&\-\']{2,40}?):\s*(' + NUM + r')')


def canada(slug):
    s = fetch('https://travel.gc.ca/destinations/' + slug, os.path.join(HERE, 'ca', slug + '.html'))
    if s is None:
        return {'status': 'fetch-failed'}
    t = text(s)
    m = re.search(r'Emergency services(.{0,600}?)(Consular assistance|Service provided by|Embassy|$)', t)
    if not m:
        return {'status': 'no-block'}
    seg = m.group(1).strip()
    return {'status': 'ok', 'raw': seg, 'pairs': [(a.strip().lower(), b.strip()) for a, b in PAIR.findall(seg)]}


def uk(slug):
    base = 'https://www.gov.uk/foreign-travel-advice/' + slug
    got = {}
    for part in ('getting-help', 'health'):
        s = fetch(base + '/' + part, os.path.join(HERE, 'uk', slug + '--' + part + '.html'))
        if s is None:
            got[part] = {'status': 'fetch-failed'}
            continue
        t = text(s)
        segs = []
        for m in re.finditer(r'(Emergency services in .{0,260}?)(?= Contact your| Contact the| Before you| Find |$)', t):
            segs.append(m.group(1).strip())
        for m in re.finditer(r'(Emergency medical number.{0,120}?)(?= Contact your| Vaccine| Health |$)', t):
            segs.append(m.group(1).strip())
        got[part] = {'status': 'ok' if segs else 'no-block', 'raw': sorted(set(segs))}
    return got


def main():
    which = sys.argv[1]
    if which == 'ca':
        idx = fetch('https://travel.gc.ca/destinations', os.path.join(HERE, 'ca-index.html'))
        slugs = {}
        for _, slug, name in re.findall(r'href="(/destinations/([a-z0-9\-]+))"[^>]*>\s*([^<]+?)\s*<', idx):
            slugs.setdefault(slug, html.unescape(name).strip())
        fn = canada
    else:
        idx = fetch('https://www.gov.uk/foreign-travel-advice', os.path.join(HERE, 'uk-index.html'))
        slugs = {}
        for slug, name in re.findall(r'href="/foreign-travel-advice/([a-z0-9\-]+)"[^>]*>\s*([^<]+?)\s*<', idx):
            slugs.setdefault(slug, html.unescape(name).strip())
        fn = uk
    out = {}
    for i, (slug, name) in enumerate(sorted(slugs.items()), 1):
        out[slug] = dict(name=name, **{'data': fn(slug)})
        if i % 20 == 0:
            print(which, i, '/', len(slugs), flush=True)
            json.dump(out, open(os.path.join(HERE, which + '.json'), 'w'), indent=1, ensure_ascii=False)
    json.dump(out, open(os.path.join(HERE, which + '.json'), 'w'), indent=1, ensure_ascii=False)
    print(which, 'done', len(out), flush=True)


main()
