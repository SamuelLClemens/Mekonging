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
That derived map must be a subset of the ROUTE_DATA declared in main.js. code_only() blanks
comments and the text of string, regex and template literals first, so a word inside a message
never counts as a read.

Indirect calls it cannot see (a function stored in an object and invoked as `spec.get(id)`)
are declared in EXTRA_EDGES below, each with the reason.
"""
import functools
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

# Files that load their own lazy data and AWAIT it before reading, so ROUTE_DATA has nothing to
# say about them. This is a narrow exemption and it is not for screens: the bug this script
# exists to catch is a screen rendering synchronously against a module that has not landed, and
# a file here has no route to gate because it is not reached from the router at all.
#
# js/offline-pack.js builds the offline media manifest from js/data/sounds.js. It runs on idle
# from the app's boot sequence, not from any route, and its one read is
# `(await loadData('sounds')).SOUNDS`. Without this entry the derived map attributes 'sounds' to
# every route in the app — because main.js imports the module at top level — and the only way
# to satisfy that would be to declare a data dependency that ten routes do not have.
SELF_GATED = {'js/offline-pack.js'}

DECL = re.compile(r'^(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(')
ARROW = re.compile(r'^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s*)?\(')


# After one of these words a `/` opens a regex rather than dividing: `return /x/.test(s)`.
REGEX_AFTER = {'return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw',
               'case', 'do', 'else', 'yield', 'await'}
CODE_STOP = re.compile(r'[/\'"`{}]')
TEMPLATE_STOP = re.compile(r'[`\\]|\$\{')
TAIL_WORD = re.compile(r'[\w$]+$')
NOT_NEWLINE = re.compile(r'[^\n]')
# A quoted string's body. Only an escaped newline (a line continuation) carries it onto the next
# line; unterminated, it ends at the newline, as it does for the browser.
STRING_BODY = {q: re.compile(r'(?:[^%s\\\n]|\\[\s\S])*' % q) for q in '\'"'}


def code_only(src):
    """src with every comment, and the text of every string, regex and template literal,
    blanked to spaces, so that what is left is the code. It keeps the length and the newlines,
    so line numbers still line up, and it keeps a template's ${ } holes, because they are code.

    A tokenizer, because the regexes it replaces misread the source twice. They stripped block
    comments before strings, so `accept: 'image/*'` opened a comment that ran on to the next
    `*/`. The brace count then ended journalFormScreen, scrapAlbumSection and renderVault early,
    and nothing checked the rest of each, 238 lines in all. And nothing stripped literals from
    function bodies at all, so /TWO DISTINCT LANGUAGES/ in translate.js, a pattern that matches
    a service's error message, read as the phrasebook export LANGUAGES. Since mount() reaches
    translate() on every screen, all 76 routes appeared to read the phrasebooks.

    Returns (code, ok). ok is False when the scan ends inside a literal or with unbalanced
    brackets, which means it misread the file. The caller must fail on that rather than trust
    it. A misread that blanks real code hides real reads, and hiding reads is the failure this
    script exists to prevent."""
    out, last, n = [], 0, len(src)

    def blank(a, b):
        nonlocal last
        s = src[a:b]
        out.append(src[last:a])
        out.append(NOT_NEWLINE.sub(' ', s) if '\n' in s else ' ' * len(s))
        last = a + len(s)

    stack = []    # 'tpl' while inside template text, [depth] while inside a ${ } hole
    prev = ''     # the last code token before a `/`, which decides regex or division
    i = 0
    while i < n:
        if stack and stack[-1] == 'tpl':
            m = TEMPLATE_STOP.search(src, i)
            j = m.start() if m else n
            blank(i, j)
            i = j
            if i >= n:
                break
            if src[i] == '\\':
                blank(i, i + 2)
                i += 2
            elif src[i] == '`':
                stack.pop()
                prev = '`'
                i += 1
            else:
                stack.append([0])
                prev = '{'
                i += 2
            continue
        m = CODE_STOP.search(src, i)
        j = m.start() if m else n
        seg = src[i:j].rstrip()
        if seg:
            w = TAIL_WORD.search(seg)
            prev = w.group(0) if w else seg[-1]
        i = j
        if i >= n:
            break
        c = src[i]
        if src.startswith('//', i):
            j = src.find('\n', i)
            j = n if j < 0 else j
            blank(i, j)
            i = j
        elif src.startswith('/*', i):
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            blank(i, j)
            i = j
        elif c == '/':
            regex = prev == '' or prev in REGEX_AFTER or not (
                TAIL_WORD.fullmatch(prev) or prev in ')]\'"`/')
            j, cls = i + 1, False
            while regex and j < n and src[j] != '\n':
                if src[j] == '\\':
                    j += 2
                    continue
                if src[j] == '[':
                    cls = True
                elif src[j] == ']':
                    cls = False
                elif src[j] == '/' and not cls:
                    break
                j += 1
            if regex and j < n and src[j] == '/':
                blank(i + 1, j)
                i = j + 1
            else:
                i += 1           # a division, or no closing slash on the line so it was one
            prev = '/'           # either way, a `/` straight after this one divides
        elif c in '\'"':
            j = STRING_BODY[c].match(src, i + 1).end()
            blank(i + 1, j)
            prev = c
            i = j + 1
        elif c == '`':
            stack.append('tpl')
            i += 1
        elif c == '{':
            if stack:
                stack[-1][0] += 1
            prev = '{'
            i += 1
        else:                    # '}'
            if stack and stack[-1][0] == 0:
                stack.pop()      # the end of a ${ } hole: back into template text
            else:
                if stack:
                    stack[-1][0] -= 1
                prev = '}'
            i += 1
    out.append(src[last:])
    code = ''.join(out)
    ok = not stack and all(code.count(o) == code.count(c) for o, c in ('{}', '()', '[]'))
    return code, ok


@functools.lru_cache(maxsize=None)
def functions(path):
    """Top-level function ranges, name -> (first_line, last_line), 1-indexed inclusive; the
    file's code_only() lines; and whether it tokenized cleanly."""
    code, ok = code_only(open(path, encoding='utf-8').read())
    clean = code.split('\n')
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
    return out, clean, ok


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
    # [\w.-]: a screen filename may be hyphenated (share-journey.js, country-info.js) even
    # though its SCREEN_LOADERS/ROUTE_SCREENS key never is (sharejourney, countryinfo) — see
    # main.js's own SCREEN_LOADERS table. Plain \w. missed this silently: it dropped the file
    # from screen_files, which only ever surfaced as a problem once a hyphenated-filename
    # screen ALSO needed lazy-data gating (country-info.js's access/visa/scams routes, in the
    # module split that added it) — share-journey.js needs no lazy-data bucket, so the same gap
    # sat there latent and harmless before this.
    for m in re.finditer(r"(\w+):\s*\(b\)\s*=>\s*import\('\./(screens/[\w.-]+\.js)'", main_src):
        screen_files[m.group(1)] = 'js/' + m.group(2)

    # The lazy modules' own source is not a consumer — exclude it, or every export reads as a
    # top-level reference to itself.
    lazy_src = {'js/data/%s.js' % n for n in set(owner.values())} | {LAZY_DATA} | SELF_GATED
    files = [f for f in eager_files() if f not in lazy_src] + sorted(set(screen_files.values()))
    fns, refs, owner_file = {}, {}, {}
    overrun = []
    misread = [f for f in files if not functions(f)[2]]
    if misread:
        print('FAIL  could not tokenize %s: the scan ended inside a literal or with unbalanced '
              'brackets. Fix code_only() before trusting anything this script derives.'
              % ', '.join(misread))
        return 1
    for f in files:
        got, code, _ = functions(f)
        prev_end = 0
        for name, (a, b) in sorted(got.items(), key=lambda kv: kv[1][0]):
            if a <= prev_end:
                overrun.append('%s:%s' % (f, name))
            prev_end = b
            if name in fns:
                continue                      # first definition wins; duplicates flagged below
            fns[name] = (f, a, b)
            refs[name] = '\n'.join(code[a - 1:b])
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
        got, code, _ = functions(f)
        inside = set()
        for a, b in got.values():
            inside |= set(range(a, b + 1))
        # An import statement may span many lines; its continuation lines name the very
        # identifiers being looked for, so skip the whole statement, not just its first line.
        in_import = False
        for i, line in enumerate(code, 1):
            if re.match(r'\s*(?:import|export)\s', line):
                in_import = ';' not in line
                continue
            if in_import:
                in_import = ';' not in line
                continue
            if i in inside:
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
