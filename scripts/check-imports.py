#!/usr/bin/env python3
"""Verify every named import in js/ resolves to a real export.

    python3 scripts/check-imports.py

WHY THIS EXISTS. The app ships as native ES modules with no build step, so nothing checks the
module graph before a browser does. A named import that does not match an export fails at
MODULE EVALUATION — which in an ES-module app means main.js never runs and the traveller gets
the splash screen forever, with one line in a console they cannot open. That is the worst
failure this codebase can ship, and it is exactly what a refactor that moves a function
between modules risks. So: resolve every import specifier and check every named binding.

Also reports import cycles, which are legal here but only safe while every participant reads
the other's bindings inside a function body rather than at module-evaluation time.
"""
import os
import re
import sys
from collections import defaultdict

ROOT = 'js'

IMPORT_RE = re.compile(
    r"""^\s*import\s+(?:(?P<ns>\*\s+as\s+\w+)|(?P<named>\{[^}]*\})|(?P<default>\w+))?"""
    r"""(?:\s*,\s*(?P<named2>\{[^}]*\}))?\s*from\s*['"](?P<spec>[^'"]+)['"]""",
    re.M)
BARE_IMPORT_RE = re.compile(r"""^\s*import\s*['"](?P<spec>[^'"]+)['"]""", re.M)
REEXPORT_RE = re.compile(r"""^\s*export\s+(?P<what>\*|\{[^}]*\})\s+from\s*['"](?P<spec>[^'"]+)['"]""", re.M)

EXPORT_DECL_RE = re.compile(
    r"""^\s*export\s+(?:async\s+)?(?:function(?:\s*\*)?|class|const|let|var)\s+(\w+)""", re.M)
EXPORT_LIST_RE = re.compile(r"""^\s*export\s*\{([^}]*)\}\s*;""", re.M)
EXPORT_DEFAULT_RE = re.compile(r"""^\s*export\s+default\b""", re.M)


def files():
    for root, _, fs in os.walk(ROOT):
        for f in fs:
            if f.endswith('.js'):
                yield os.path.join(root, f)


def strip_comments(s):
    # ORDER MATTERS. Line comments go first: this codebase's prose comments mention paths like
    # `js/screens/*.js`, and that `/*` opens a phantom block comment that a naive block-first
    # pass then closes at the next `*/` far below — silently deleting every export in between
    # and reporting the importers as broken. Only whole-line `//` is stripped, so a `//` inside
    # a URL in the middle of a line of code is left alone.
    s = re.sub(r'(?m)^[ \t]*//.*$', '', s)
    return re.sub(r'/\*.*?\*/', '', s, flags=re.S)


def names(clause):
    """'{ a, b as c }' -> ['a', 'b']  (the ORIGINAL exported names)."""
    out = []
    for part in clause.strip('{} \n').split(','):
        part = part.strip()
        if not part:
            continue
        out.append(part.split(' as ')[0].strip())
    return out


def main():
    src = {p: strip_comments(open(p, encoding='utf-8').read()) for p in files()}

    exports, star_from = {}, defaultdict(list)
    for p, s in src.items():
        ex = set(EXPORT_DECL_RE.findall(s))
        for m in EXPORT_LIST_RE.finditer(s):
            # `export { a as b }` exports b, not a — take the alias when present.
            for part in m.group(1).split(','):
                part = part.strip()
                if part:
                    ex.add(part.split(' as ')[-1].strip())
        for m in REEXPORT_RE.finditer(s):
            if m.group('what') == '*':
                star_from[p].append(m.group('spec'))
            else:
                for part in m.group('what').strip('{}').split(','):
                    part = part.strip()
                    if part:
                        ex.add(part.split(' as ')[-1].strip())
        if EXPORT_DEFAULT_RE.search(s):
            ex.add('default')
        exports[p] = ex

    def resolve(frm, spec):
        if not spec.startswith('.'):
            return None
        cand = os.path.normpath(os.path.join(os.path.dirname(frm), spec))
        return cand if os.path.isfile(cand) else False

    problems, edges, checked = [], defaultdict(set), 0
    for p, s in src.items():
        specs = set()
        for m in IMPORT_RE.finditer(s):
            specs.add(m.group('spec'))
            tgt = resolve(p, m.group('spec'))
            if tgt is False:
                problems.append(f'{p}: imports {m.group("spec")!r} — no such file')
                continue
            if tgt is None:
                continue
            edges[p].add(tgt)
            avail = set(exports.get(tgt, ()))
            for sf in star_from.get(tgt, []):
                st = resolve(tgt, sf)
                if st:
                    avail |= set(exports.get(st, ()))
            for clause in (m.group('named'), m.group('named2')):
                if not clause:
                    continue
                for n in names(clause):
                    checked += 1
                    if n not in avail:
                        problems.append(f'{p}: imports {{{n}}} from {m.group("spec")} — not exported there')
            if m.group('default'):
                checked += 1
                if 'default' not in avail:
                    problems.append(f'{p}: default-imports {m.group("spec")} — it has no default export')
        for m in BARE_IMPORT_RE.finditer(s):
            if m.group('spec') in specs:
                continue
            if resolve(p, m.group('spec')) is False:
                problems.append(f'{p}: imports {m.group("spec")!r} — no such file')

    # cycles, reported but not fatal
    cycles, seen = [], set()
    def walk(n, stack):
        if n in stack:
            cyc = stack[stack.index(n):] + [n]
            key = tuple(sorted(set(cyc)))
            if key not in seen:
                seen.add(key)
                cycles.append(cyc)
            return
        for m in sorted(edges.get(n, ())):
            walk(m, stack + [n])
    # bounded: only start from the entry point, which is what the browser evaluates
    walk('js/main.js', [])

    print(f'{len(src)} modules, {checked} named imports checked')
    if cycles:
        print(f'\n{len(cycles)} import cycle(s) reachable from js/main.js (legal, but every')
        print('participant must read the others only inside function bodies):')
        for c in cycles[:10]:
            print('  ' + ' -> '.join(os.path.basename(x) for x in c))
    if problems:
        print(f'\n{len(problems)} problem(s):')
        for pr in problems:
            print('  - ' + pr)
        return 1
    print('\nPASS — every named import resolves to a real export.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
