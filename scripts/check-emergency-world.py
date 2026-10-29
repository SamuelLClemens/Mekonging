#!/usr/bin/env python3
"""The worldwide emergency-number table (slice F7b): js/data/emergency-world.<region>.js.

WHY THIS EXISTS. A wrong emergency number is worse than a missing one: the traveller dials it with no time to doubt it.
Owner decision 28 (2026-10-27) asks for the numbers wherever a fix is in the world, and CLAUDE.md's sourcing rule says to
leave a gap open rather than publish a number nobody can check. This guard holds the table to that rule.

WHAT IT CHECKS (it loads the data with Node, or with macOS's jsc where there is no Node, so it reads what the app reads):
  1. Every key is an id in js/data/world-outline.js and has a name in js/data/world-names.js.
  2. No id is in two regions, and none of the four countries' ids is here (their numbers are js/data/emergency-numbers.js;
     this table keys Vietnam as `vn`, and `vi` is the US Virgin Islands, so a mix-up would show Vietnam's numbers there).
  3. Every entry has at least one number, each with a label and a dialable number (digits, `+`, `*`, `#`, spaces).
  4. Every entry cites `src`, an https URL; `src2`, when present, is a different https URL. A source on an aggregator's
     site (Wikipedia, travel blogs, directories) fails: the number must trace to a government page.
  5. The service worker precaches the outline, the names and every region file (the table is for use abroad, offline).

It also prints how many of the outline's countries have an entry. Gaps are allowed, by design: the screen gives 112 and the
coordinates for them. The pass line is last.
"""
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
REGIONS = ['asia', 'europe', 'africa', 'americas', 'oceania']
FOUR_COUNTRIES = {'th', 'vn', 'kh', 'la'}
NUMBER = re.compile(r'^[+*#0-9][0-9*#+ ]{0,15}$')
# Hosts a number must never be cited to: they collect other people's claims.
AGGREGATORS = ('wikipedia.org', 'wikivoyage.org', 'wikitravel', 'tripadvisor', 'lonelyplanet', 'fodors', 'reddit.com',
               'quora.com', 'blogspot', 'medium.com', 'wordpress.com', 'yellowpages', 'numbeo', 'countrycode.org')


def runner():
    """The JavaScript engine to load the data with: Node where there is one (CI), else macOS's jsc (the owner's machine)."""
    node = shutil.which('node')
    if node:
        return [node], True
    if os.path.exists(JSC):
        return [JSC, '-m'], False
    print('FAIL: neither node nor jsc is available, so the table cannot be read')
    sys.exit(1)


def dump():
    cmd, is_node = runner()
    # Node wants file URLs for absolute paths; jsc takes the path as it is.
    spec = (lambda rel: pathlib.Path(ROOT, rel).as_uri()) if is_node else (lambda rel: '%s/%s' % (ROOT, rel))
    imports = "import { WORLD_OUTLINE } from '%s';\nimport { WORLD_NAMES } from '%s';\n" % (spec('js/data/world-outline.js'), spec('js/data/world-names.js'))
    for r in REGIONS:
        imports += "import { EMERGENCY_WORLD as T_%s } from '%s';\n" % (r, spec('js/data/emergency-world.%s.js' % r))
    body = ("const out = (s) => (typeof print === 'function' ? print(s) : console.log(s));\n"
            "out(JSON.stringify({ids: WORLD_OUTLINE.features.map((f) => f.properties.id), names: WORLD_NAMES, tables: {%s}}));\n"
            % ', '.join('%s: T_%s' % (r, r) for r in REGIONS))
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'dump.mjs')
        open(p, 'w').write(imports + body)
        out = subprocess.run(cmd + [p], capture_output=True, text=True)
    if out.returncode != 0:
        print(out.stdout + out.stderr)
        print('FAIL: %s could not load the table files' % os.path.basename(cmd[0]))
        sys.exit(1)
    return json.loads(out.stdout)


def host(url):
    m = re.match(r'^https://([^/]+)/', url + '/')
    return m.group(1).lower() if m else ''


def main():
    d = dump()
    ids, names = set(d['ids']), d['names']
    problems, seen, total = [], {}, 0
    for region, table in d['tables'].items():
        for cid, e in table.items():
            where = '%s/%s' % (region, cid)
            total += 1
            if cid in seen:
                problems.append('%s: also in %s' % (where, seen[cid]))
            seen[cid] = region
            if cid not in ids:
                problems.append('%s: not an id in world-outline.js' % where)
            if cid not in names:
                problems.append('%s: no name in world-names.js' % where)
            if cid in FOUR_COUNTRIES:
                problems.append('%s: one of the four countries, whose numbers are js/data/emergency-numbers.js' % where)
            nums = e.get('numbers')
            if not isinstance(nums, list) or not nums:
                problems.append('%s: no numbers' % where)
                nums = []
            for n in nums:
                label, number = n.get('label'), n.get('number')
                if not isinstance(label, str) or not label.strip():
                    problems.append('%s: a number with no label' % where)
                if not isinstance(number, str) or not NUMBER.match(number) or len(re.findall(r'\d', number)) < 2:
                    problems.append('%s: not a dialable number: %r' % (where, number))
            for key in ('src', 'src2'):
                url = e.get(key)
                if key == 'src' and not url:
                    problems.append('%s: no src' % where)
                if url is None:
                    continue
                if not isinstance(url, str) or not url.startswith('https://') or not host(url):
                    problems.append('%s: %s is not an https URL: %r' % (where, key, url))
                elif any(a in host(url) for a in AGGREGATORS):
                    problems.append('%s: %s is on an aggregator (%s); cite the government page' % (where, key, host(url)))
            if e.get('src2') and e.get('src2') == e.get('src'):
                problems.append('%s: src2 repeats src' % where)
    sw = open(os.path.join(ROOT, 'sw.js'), encoding='utf-8').read()
    for f in ['world-outline', 'world-names'] + ['emergency-world.%s' % r for r in REGIONS]:
        if "'js/data/%s.js'" % f not in sw:
            problems.append('sw.js PRECACHE does not list js/data/%s.js' % f)
    gaps = sorted(ids - set(seen))
    print('%d of the outline\'s %d countries and territories have an entry (%s); %d are gaps (112 and the coordinates).'
          % (len(set(seen)), len(ids), ', '.join('%s %d' % (r, sum(1 for v in seen.values() if v == r)) for r in REGIONS), len(gaps)))
    if problems:
        for p in problems:
            print('  ' + p)
        print('FAIL — %d problem(s) in the emergency-number table' % len(problems))
        sys.exit(1)
    print('PASS — %d entries, every one cited, none on an aggregator, none for the four countries' % total)


main()
