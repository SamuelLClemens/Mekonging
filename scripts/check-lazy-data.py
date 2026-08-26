#!/usr/bin/env python3
"""Verify every lazily-loaded data module is gated on every route that reads it.

    python3 scripts/check-lazy-data.py            # check ROUTE_DATA against the call graph
    python3 scripts/check-lazy-data.py --report   # print the derived route -> modules map

WHY THIS EXISTS. js/lazy-data.js loads the single-screen data modules on demand. Every
consumer stays fully synchronous and reads a safe empty default until the module lands, so a
route that reads one WITHOUT being listed in ROUTE_DATA does not throw and does not log — it
just renders a screen with the data silently missing. That is the worst possible failure mode
for this app: a visa screen with no visa rules looks like a visa screen.

So this rebuilds the fact from the source of truth. It parses the router's switch to find each
route's entry function, walks the call graph across the eagerly-loaded modules and the
route-scoped screen modules, and unions the lazy-data identifiers reachable from each route.
That derived map must be a subset of the ROUTE_DATA declared in main.js.

Indirect calls it cannot see (a function stored in an object and invoked as `spec.get(id)`)
are declared in EXTRA_EDGES below, each with the reason.
"""
import os
import re
import sys
from collections import deque

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

MAIN = 'js/main.js'
LAZY_DATA = 'js/lazy-data.js'

# Indirect call edges the parser cannot resolve. Keep each one justified.
# Functions that re-enter the router rather than continuing the current render. render() holds
# the whole switch, so following it would make every route reach every screen; anything that
# calls it is simply asking for a fresh pass, which goes through the gate again.
BARRIERS = {'render', 'renderNow', 'route', 'go'}

# Call edges that exist in the source but cannot fire on the route in question. Each needs a
# reason, because suppressing one wrongly is exactly the silent-data bug this script exists to
# catch.
SUPPRESS_EDGES = {
    # whereNextSection's `rerender` default calls exploreScreen; #nextstop always passes its own
    # onChange, so the default only ever fires on explore/country — routes that reach
    # exploreScreen directly and already gate everything it reads.
    ('whereNextSection', 'exploreScreen'),
}

EXTRA_EDGES = {
    # ID_TYPES stores `get: getProduce` and myIdentifierScreen invokes it as `spec.get(id)`.
    'myIdentifierScreen': ['getProduce', 'getDish'],
}

DECL = re.compile(r'^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(')
ARROW = re.compile(r'^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(')


def strip(src):
    """Comment- and string-strip for brace counting. Line comments FIRST: a path like
    js/screens/*.js inside prose would otherwise open a phantom block comment."""
    src = re.sub(r'(?m)^[ \t]*//.*$', '', src)
    # Replace a block comment with the SAME number of newlines: collapsing it would shift every
    # line number after it, and the ranges below are what map a reference back to its function.
    src = re.sub(r'/\*.*?\*/', lambda m: '\n' * m.group(0).count('\n'), src, flags=re.S)
    # Quoted strings can hold unbalanced braces; template literals cannot (${ } is balanced).
    src = re.sub(r"'(?:[^'\\\n]|\\.)*'", "''", src)
    src = re.sub(r'"(?:[^"\\\n]|\\.)*"', '""', src)
    return src


def functions(path):
    """Top-level function ranges: name -> (first_line, last_line), 1-indexed inclusive."""
    raw = open(path, encoding='utf-8').read().split('\n')
    clean = strip('\n'.join(raw)).split('\n')
    out, i, n = {}, 0, len(clean)
    while i < n:
        m = DECL.match(clean[i]) or ARROW.match(clean[i])
        if m and '{' in clean[i]:
            depth, j = 0, i
            started = False
            while j < n:
                depth += clean[j].count('{') - clean[j].count('}')
                if '{' in clean[j]:
                    started = True
                if started and depth <= 0:
                    break
                j += 1
            out[m.group(1)] = (i + 1, min(j + 1, n))
            i = j + 1
            continue
        i += 1
    return out, raw


def eager_files():
    """Files reachable by static import from main.js — i.e. parsed on every launch."""
    seen, q = set(), deque([MAIN])
    spec = re.compile(r"""^\s*(?:import\s+(?:[\w*{},\s$]+\s+from\s+)?|export\s+(?:\*|\{[^}]*\})\s+from\s+)['"](\.[^'"]+)['"]""", re.M)
    while q:
        f = q.popleft()
        if f in seen or not os.path.isfile(f):
            continue
        seen.add(f)
        for s in spec.findall(open(f, encoding='utf-8').read()):
            q.append(os.path.normpath(os.path.join(os.path.dirname(f), s)))
    return sorted(seen)


def parse_map(src, name):
    """Parse a `const NAME = { key: [...], ... }` router map out of main.js."""
    m = re.search(r'const %s\s*=\s*\{(.*?)\n\};' % name, src, re.S)
    if not m:
        return None
    out = {}
    for line in m.group(1).split('\n'):
        km = re.match(r"\s*(?:'([^']+)'|(\w+))\s*:\s*\[([^\]]*)\]", line)
        if km:
            out[km.group(1) or km.group(2)] = re.findall(r"'([^']+)'", km.group(3))
    return out


def main():
    main_src = open(MAIN, encoding='utf-8').read()

    if not os.path.isfile(LAZY_DATA):
        print('FAIL  %s does not exist' % LAZY_DATA)
        return 1

    # Which identifiers does each lazy data module contribute?
    owner = {}
    for m in re.finditer(r"^// LAZY-MODULE:\s*(\w+)\s*=\s*(.+)$", open(LAZY_DATA, encoding='utf-8').read(), re.M):
        for ident in m.group(2).split():
            owner[ident] = m.group(1)
    if not owner:
        print('FAIL  no "// LAZY-MODULE: <name> = <idents>" annotations found in %s' % LAZY_DATA)
        return 1

    # Screen modules are route-scoped; roll their data needs up to the routes that load them.
    route_screens = parse_map(main_src, 'ROUTE_SCREENS') or {}
    screen_files = {}
    for m in re.finditer(r"(\w+):\s*\(b\)\s*=>\s*import\('\./(screens/[\w.]+\.js)'", main_src):
        screen_files[m.group(1)] = 'js/' + m.group(2)

    # The lazy modules' own source is not a consumer — exclude it, or every export reads as a
    # top-level reference to itself.
    lazy_src = {'js/data/%s.js' % n for n in set(owner.values())} | {LAZY_DATA}
    files = [f for f in eager_files() if f not in lazy_src] + sorted(set(screen_files.values()))
    fns, refs, owner_file = {}, {}, {}
    overrun = []
    for f in files:
        got, raw = functions(f)
        prev_end = 0
        for name, (a, b) in sorted(got.items(), key=lambda kv: kv[1][0]):
            if a <= prev_end:
                overrun.append('%s:%s' % (f, name))
            prev_end = b
            if name in fns:
                continue                      # first definition wins; duplicates flagged below
            fns[name] = (f, a, b)
            body = '\n'.join(raw[a - 1:b])
            body = re.sub(r'(?m)^[ \t]*//.*$', '', body)
            refs[name] = body
            owner_file[name] = f

    # Call edges + data references per function.
    calls, uses = {}, {}
    for name, body in refs.items():
        calls[name] = set(re.findall(r'\b(\w+)\s*\(', body)) & set(fns) - {name} - BARRIERS
        calls[name] |= set(EXTRA_EDGES.get(name, [])) & set(fns)
        calls[name] -= {b for a, b in SUPPRESS_EDGES if a == name}
        uses[name] = {owner[i] for i in set(re.findall(r'\b(\w+)\b', body)) & set(owner)}

    # Anything referencing a lazy VALUE at module top level cannot be gated at all.
    top_hits = []
    for f in files:
        got, raw = functions(f)
        inside = set()
        for a, b in got.values():
            inside |= set(range(a, b + 1))
        # An import statement may span many lines; its continuation lines name the very
        # identifiers being looked for, so skip the whole statement, not just its first line.
        in_import = False
        for i, line in enumerate(raw, 1):
            if re.match(r'\s*(?:import|export)\s', line):
                in_import = ';' not in line
                continue
            if in_import:
                in_import = ';' not in line
                continue
            if i in inside or re.match(r'\s*//', line):
                continue
            for ident in set(re.findall(r'\b(\w+)\b', line)) & set(owner):
                if ident.isupper() or ident[0].isupper():
                    top_hits.append('%s:%d  %s (%s)' % (f, i, ident, owner[ident]))

    # Router roots: `case 'route': ... someScreen(` inside the switch.
    roots = {}
    sw = main_src[main_src.index('switch (head)'):]
    sw = sw[:sw.index('\n    }')]
    cur = []
    for line in sw.split('\n'):
        for c in re.findall(r"case '([^']*)':", line):
            cur.append(c)
        if cur:
            hit = [f for f in re.findall(r'\b(\w+)\s*\(', line) if f in fns]
            if hit:
                for c in cur:
                    roots.setdefault(c, set()).update(hit)
                cur = []

    # BFS each route over the call graph.
    derived = {}
    for route, entries in roots.items():
        seen, q, need = set(), deque(entries), set()
        while q:
            fn = q.popleft()
            if fn in seen:
                continue
            seen.add(fn)
            need |= uses.get(fn, set())
            for nxt in calls.get(fn, ()):
                q.append(nxt)
        # A route that loads a screen module inherits whatever that module needs.
        for s in route_screens.get(route, []):
            for fn, f in owner_file.items():
                if f == screen_files.get(s):
                    q.append(fn)
        while q:
            fn = q.popleft()
            if fn in seen:
                continue
            seen.add(fn)
            need |= uses.get(fn, set())
            for nxt in calls.get(fn, ()):
                q.append(nxt)
        if need:
            derived[route] = need

    if '--why' in sys.argv:
        route, want = sys.argv[sys.argv.index('--why') + 1:sys.argv.index('--why') + 3]
        prev, q = {}, deque(roots.get(route, []))
        for r in roots.get(route, []):
            prev[r] = None
        seen = set()
        while q:
            fn = q.popleft()
            if fn in seen:
                continue
            seen.add(fn)
            if want in uses.get(fn, set()):
                path, cur = [], fn
                while cur is not None:
                    path.append('%s (%s)' % (cur, owner_file.get(cur, '?')))
                    cur = prev[cur]
                print('  ' + ' <- '.join(path))
            for nxt in calls.get(fn, ()):
                if nxt not in prev:
                    prev[nxt] = fn
                    q.append(nxt)
        return 0

    if '--report' in sys.argv:
        for r in sorted(derived):
            print("  %-14s ['%s']," % ("'%s':" % r, "', '".join(sorted(derived[r]))))
        print('\n-- top-level references (cannot be lazy):')
        for t in top_hits or ['  (none)']:
            print('  ' + t)
        if overrun:
            print('\n-- parser overruns: ' + ', '.join(overrun))
        return 0

    declared = parse_map(main_src, 'ROUTE_DATA')
    if declared is None:
        print('FAIL  ROUTE_DATA not found in %s' % MAIN)
        return 1

    bad = []
    for route, need in sorted(derived.items()):
        missing = need - set(declared.get(route, []))
        if missing:
            bad.append('  %-14s reads %s but ROUTE_DATA gates %s'
                       % (route, sorted(missing), sorted(declared.get(route, []))))
    for t in top_hits:
        bad.append('  top-level read of a lazy value: ' + t)
    for route in sorted(set(declared) - set(derived)):
        bad.append('  %-14s gated on %s but no reachable read (stale entry)'
                   % (route, sorted(declared[route])))

    if bad:
        print('FAIL  ROUTE_DATA does not cover the call graph:')
        print('\n'.join(bad))
        return 1
    print('PASS  %d routes, %d lazy data modules, every read gated'
          % (len(derived), len(set(owner.values()))))
    return 0


sys.exit(main())
