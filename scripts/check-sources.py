#!/usr/bin/env python3
"""Ratchet the two sourcing gaps the 2026-10-02 content-truth audit measured.

    python3 scripts/check-sources.py            # print both counts, PASS/FAIL
    python3 scripts/check-sources.py --report    # also list every offending id

WHY THIS EXISTS. The audit spot-checked 10 places with deep-link sources and found 5 of 10
contradicted or unsupported by their OWN cited source, plus 2 more whose only source was dead
(404/403) — slice S2 fixed those eight records. But the audit also surfaced two structural gaps
that no amount of spot-fixing closes on its own, because nothing stopped them from getting worse
one record at a time:

  * A place record can cite a source, pass every other guard, and still be useless as a citation
    if every one of its `sources[].url` values is a bare homepage (`https://www.tripadvisor.com`,
    `https://vietnam.travel`) rather than a page that is actually about the place. A homepage
    tells a traveller nothing checkable; it is a citation in form only.
  * A route record can ship with no `sources` field at all. Fares and schedules drift constantly
    — Pattaya's own baht-bus fare entry two records above the one S2 touched exists because an
    April 2026 fare change needed a dated source — so an unsourced route is a claim nobody can
    re-verify.

Neither gap is zero and neither should be: plenty of records cite a homepage alongside a real
page (that is fine, only EVERY source being a homepage fails), and S10 is working through the
route backlog in parallel on its own branch. This is a RATCHET, not a target: it fails only if a
future change makes either count worse than the baseline measured right after S2 landed. S2's
own fixes never move the route number (routes are out of scope here, that is S10's slice) and
were checked by hand not to change any place's homepage-only verdict (every record S2 touched
already carried at least one non-homepage source).

HOMEPAGE HEURISTIC. A url is "homepage-only" if its path has no segments (a bare domain like
`https://www.tripadvisor.com`) or exactly one very short/generic segment (a locale root like
`https://badenmountain.sunworld.vn/en/`, or literally `/home`, `/index`). Anything with a real
slug or a multi-segment path counts as a specific page. This is a heuristic, not a scrape of each
page's content — it will call a few genuinely-specific-but-short URLs homepage-only and miss a
few long URLs that are themselves disguised redirects to a homepage. The audit's own spot check
measured 224 of 783 by a different, manual methodology; this script's own figure is the one that
matters for the ratchet, because it is the number this script will recompute every time.

Parsing note, same as check-place-fields.py and check-place-dupes.py: these files mix bare keys
(`id: "x"`) and quoted keys (`"id": "x"`) side by side, so both must be matched or whole cities
go missing from the count.
"""
import glob
import re
import sys
from urllib.parse import urlparse

PLACE_FILES = [f'js/data/places.{cc}{ext}.js' for cc in ('th', 'vi', 'kh', 'la') for ext in ('', '.ext')]
ROUTE_FILES = sorted(glob.glob('js/data/routes.*.js'))

# Baseline measured on this script's own methodology against the tree immediately before S2's
# content fixes (2026-10, mk-v0.600.0 plus S2's 8 corrections — none of which changed a place's
# homepage-only verdict, and none of which touch routes.*.js at all). Bump these ONLY when you
# have actually reduced the count below it; lowering the number without doing the work defeats
# the ratchet.
BASELINE_HOMEPAGE_ONLY_PLACES = 247
BASELINE_UNSOURCED_ROUTES = 87

ID_RE = re.compile(r'^\s*"?id"?:\s*["\']([^"\']+)["\']')
# Anchored like check-place-fields.py's key_re: "sources" also appears as a SUBSTRING of
# "reviewSources", so an unanchored search would occasionally latch onto the wrong field.
SOURCES_KEY_RE = re.compile(r'(?:^|[\s{,])"?sources"?:\s*\[', re.M)
URL_RE = re.compile(r'\burl\s*:\s*["\']([^"\']+)["\']')


def records(path):
    """Yield (id, block) per record. Same id-line-as-boundary approach as the other guards —
    more reliable than brace counting on files this heavily nested."""
    lines = open(path, encoding='utf-8').read().split('\n')
    starts = [i for i, ln in enumerate(lines) if ID_RE.match(ln)]
    for n, s in enumerate(starts):
        end = starts[n + 1] if n + 1 < len(starts) else len(lines)
        block = '\n'.join(lines[s:end])
        yield ID_RE.match(lines[s]).group(1), block


def sources_array(block):
    """Return the exact `sources: [...]` substring for one record, bracket-matched rather than
    regex-bounded, since each entry is itself an object (`{ org: ..., url: ... }`) and a lazy
    regex would stop at the first `}` instead of the array's real close."""
    m = SOURCES_KEY_RE.search(block)
    if not m:
        return None
    start = m.end() - 1  # the '[' itself
    depth = 0
    for i in range(start, len(block)):
        if block[i] == '[':
            depth += 1
        elif block[i] == ']':
            depth -= 1
            if depth == 0:
                return block[start:i + 1]
    return block[start:]  # unterminated — hand back what there is rather than crash


def is_homepage_url(url):
    path = urlparse(url).path.strip('/')
    segments = [s for s in path.split('/') if s]
    if not segments:
        return True  # bare domain: https://www.tripadvisor.com
    if len(segments) == 1 and (len(segments[0]) <= 3 or segments[0].lower() in ('home', 'index', 'homepage')):
        return True  # locale root or landing page: https://badenmountain.sunworld.vn/en/
    return False


def homepage_only_places():
    offenders = []
    total = 0
    for path in PLACE_FILES:
        for pid, block in records(path):
            total += 1
            arr = sources_array(block)
            urls = URL_RE.findall(arr) if arr else []
            if urls and all(is_homepage_url(u) for u in urls):
                offenders.append((pid, path, urls))
    return total, offenders


def unsourced_routes():
    offenders = []
    total = 0
    for path in ROUTE_FILES:
        for rid, block in records(path):
            total += 1
            if not SOURCES_KEY_RE.search(block):
                offenders.append((rid, path))
    return total, offenders


def main():
    place_total, place_offenders = homepage_only_places()
    route_total, route_offenders = unsourced_routes()
    homepage_n = len(place_offenders)
    unsourced_n = len(route_offenders)

    print(f'place records                 {place_total:4d}')
    print(f'  homepage-only citations      {homepage_n:4d}  ({100 * homepage_n / place_total:4.1f}%)'
          f'   baseline {BASELINE_HOMEPAGE_ONLY_PLACES} ({100 * BASELINE_HOMEPAGE_ONLY_PLACES / place_total:4.1f}%)')
    print(f'route records                  {route_total:4d}')
    print(f'  unsourced (no sources field)  {unsourced_n:4d}  ({100 * unsourced_n / route_total:4.1f}%)'
          f'   baseline {BASELINE_UNSOURCED_ROUTES} ({100 * BASELINE_UNSOURCED_ROUTES / route_total:4.1f}%)')

    if '--report' in sys.argv:
        print('\nhomepage-only place records:')
        for pid, path, urls in place_offenders:
            print(f'  {pid:44s} {path:28s} {urls}')
        print('\nunsourced route records:')
        for rid, path in route_offenders:
            print(f'  {rid:34s} {path}')

    problems = []
    if homepage_n > BASELINE_HOMEPAGE_ONLY_PLACES:
        problems.append(f'{homepage_n} place records now cite only homepage URLs, up from a '
                         f'baseline of {BASELINE_HOMEPAGE_ONLY_PLACES} — a new or edited record '
                         'added a citation with no specific page about the place. Re-run with '
                         '--report to see which.')
    if unsourced_n > BASELINE_UNSOURCED_ROUTES:
        problems.append(f'{unsourced_n} route records now have no sources field at all, up from '
                         f'a baseline of {BASELINE_UNSOURCED_ROUTES} — a new or edited route '
                         'shipped without a source. Re-run with --report to see which.')

    print()
    if problems:
        print(f'FAIL — {len(problems)} ratchet regression(s):')
        for p in problems:
            print('  - ' + p)
        return 1
    print('PASS — neither sourcing gap has grown past its baseline.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
