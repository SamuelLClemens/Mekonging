#!/usr/bin/env python3
"""Keep index.html's modulepreload list in step with the real eager import graph.

    python3 scripts/check-preloads.py          # report drift, non-zero exit if any
    python3 scripts/check-preloads.py --fix    # rewrite the block in place

WHY THIS EXISTS. The app ships as native ES modules with no bundler, so the browser cannot
discover a dependency until it has downloaded and parsed the module that imports it. main.js is
the entry point and is large, which used to make first paint a two-round-trip chain: HTML, then
main.js in full, and only then the ~66 modules it imports. index.html therefore carries a
modulepreload hint for every eagerly-imported module so they all fly in parallel.

That list is a duplicate of a fact already expressed by the import statements, and duplicates
drift. Both directions of drift are silent:

  • a module added to the eager graph but not preloaded loses the parallelism for itself AND
    for everything only it imports;
  • a module preloaded but no longer eagerly imported is a wasted download on every cold
    start, and a preload of a DELETED file is a console warning plus a 404.

So this recomputes the graph from the import statements — the source of truth — and compares.
"""
import json
import os
import re
import sys
from collections import deque

ENTRY = 'js/main.js'
INDEX = 'index.html'

STATIC = re.compile(
    r"""^\s*(?:import\s+(?:[\w*{},\s$]+\s+from\s+)?|export\s+(?:\*|\{[^}]*\})\s+from\s+)['"]([^'"]+)['"]""",
    re.M)
BEGIN = '  <!-- Module preload graph.'
LINK = re.compile(r'^\s*<link rel="modulepreload" href="([^"]+)">\s*$', re.M)


def eager_graph():
    seen, sizes, q = set(), {}, deque([ENTRY])
    while q:
        f = q.popleft()
        if f in seen:
            continue
        seen.add(f)
        src = open(f, encoding='utf-8', errors='replace').read()
        sizes[f] = len(src.encode())
        for spec in STATIC.findall(src):
            if not spec.startswith('.'):
                continue
            t = os.path.normpath(os.path.join(os.path.dirname(f), spec))
            if os.path.isfile(t) and t not in seen:
                q.append(t)
    return sizes


def desired(sizes):
    rest = sorted((f for f in sizes if f != ENTRY), key=lambda f: -sizes[f])
    return [ENTRY] + rest


def main():
    fix = '--fix' in sys.argv
    sizes = eager_graph()
    want = desired(sizes)
    html = open(INDEX, encoding='utf-8').read()
    have = LINK.findall(html)

    missing = [f for f in want if f not in have]
    extra = [f for f in have if f not in sizes]
    dead = [f for f in have if not os.path.isfile(f)]

    print(f'eager modules : {len(want)} ({sum(sizes.values())/1024:.1f} KB)')
    print(f'preloaded     : {len(have)}')
    for label, items in (('not preloaded', missing), ('preloaded but no longer eager', extra),
                         ('preloaded but MISSING ON DISK', dead)):
        if items:
            print(f'\n{label}: {len(items)}')
            for f in items[:15]:
                print('   ' + f)

    if not missing and not extra and not dead and have == want:
        print('\nPASS — preload list matches the eager import graph exactly.')
        return 0
    if not missing and not extra and not dead:
        print('\nPASS — same set as the eager graph (order differs only).')
        return 0
    if fix:
        start = html.index(BEGIN)
        end = html.index('\n', html.rindex('<link rel="modulepreload"')) + 1
        tags = '\n'.join(f'  <link rel="modulepreload" href="{f}">' for f in want)
        comment = (
            '  <!-- Module preload graph. The app is native ES modules with no bundler, so without these the\n'
            '       browser cannot discover a single dependency until it has downloaded AND parsed main.js —\n'
            '       making first paint a two-round-trip chain: html, then main.js in full, then everything\n'
            '       else. These hints let all eager modules download in parallel with main.js instead of\n'
            '       after it. Every entry is a module the app statically imports, so nothing here is\n'
            '       speculative; lazily-imported country data and screens are deliberately absent.\n'
            '       Regenerate with: python3 scripts/check-preloads.py --fix -->\n')
        open(INDEX, 'w', encoding='utf-8').write(html[:start] + comment + tags + '\n' + html[end:])
        print(f'\nFIXED — rewrote {len(want)} modulepreload tags.')
        return 0
    print('\nFAIL — run with --fix to regenerate the block.')
    return 1


if __name__ == '__main__':
    sys.exit(main())
