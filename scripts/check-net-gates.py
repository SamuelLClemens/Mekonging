#!/usr/bin/env python3
"""Verify no online()-gated feature can render nothing at all.

    python3 scripts/check-net-gates.py            # fail on any gate that can render nothing
    python3 scripts/check-net-gates.py --report   # list every net gate found, verdict included

WHY THIS EXISTS. `online()` (js/ui-widgets.js) is
`netMode() === 'online' && navigator.onLine !== false`, and `netMode` defaults to `'ask'`.
Onboarding's skip path settles an unanswered question on `'offline'`, and that default is
correct: roughly thirty user-facing strings promise the app never touches mobile data or Wi-Fi
without permission, and offline-first is the product.

So `online()` is FALSE for a large share of real travellers, all of the time. Which means every
`if (online())` wrapped around an append is a feature that, for those travellers, is not
disabled and not explained — it is absent. They reasonably conclude it is broken.

That has now shipped three times, in three different files, over eight releases:

  * Home had no weather section at all — homeWeatherCard() returned null with no cached
    forecast and home.js did `if (wxCard) wrap.append(wxCard)`.        (fixed mk-v0.477.0)
  * Exchange rates froze on the hardcoded fallback table, measured 8% out.
                                                                        (fixed mk-v0.477.0)
  * The whole live-translation card vanished from Talk — reported as
    "talk isn't working at all", which is exactly how it looked.        (fixed mk-v0.511.0)

Each was repaired where it was found. The class kept coming back, because nothing in the repo
knew the shape was a defect. This script does.

WHAT IT FLAGS. Three shapes, all of which put nothing on screen when the gate is shut:

  A  `if (online()) { ...builds DOM... }`      with no else branch
  B  `if (!online()) return;`                  inside a function that builds DOM
  C  `online() ? h(...) : null`                a node on one side, nothing on the other

WHAT IT DOES NOT FLAG, deliberately. A gate whose body only *refreshes* — `if (online())
maybeRefreshWeather(spot).then(...)` — touches no DOM inline and is the correct pattern: the
card is already on screen and repaints if the fetch lands. Ternaries between two strings
(`online() ? '' : ' · offline'`) are honest inline annotations, not gates.

THE FIX, when it fires. Render the same section with the same heading, one sentence naming the
gate, and one button that turns the connection on and re-renders into the working control.
'ask' and a deliberate 'offline' deserve different sentences — one has never been asked, the
other made a choice. Nothing is fetched before that tap, so the consent promise is untouched.
js/screens/home.js homeWeatherCard() and js/screens/phrasebook.js sayItCard() are both worked
examples to copy.

LIMITS, stated so nobody trusts this further than it goes. It matches the literal shape in one
function body. A gate that calls a helper which appends (`if (online()) renderLive(box)`) is
invisible to it, as is one assembled across two files. It is a ratchet against the shape that
actually shipped three times, not a proof.
"""
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

ROOTS = ['js']

# Reuse the comment/string stripper the undefined-identifier guard already proved out. It
# returns a same-length string, so every line number reported here is the real one.
_spec = importlib.util.spec_from_file_location(
    'check_undefined', os.path.join(ROOT, 'scripts', 'check-undefined.py'))
_chk = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_chk)
strip_literals = _chk.strip_literals

# A gate is any condition that consults the network preference.
GATE = re.compile(r'\bonline\(\)|\bnetMode\(\)')

# Building DOM inline. `h()` is this codebase's only element factory (js/dom.js).
BUILDS_DOM = re.compile(r'\.append\(|\breplaceChildren\(|\bh\(')

# Names that promise a node to their caller. Paired with a `return h(` test below, so a render
# function that happens to be named something else is still caught.
RENDER_NAME = re.compile(
    r'(?:Card|Block|Row|Box|Section|Fold|Panel|Screen|List|Grid|Sheet|View|Widget|Tile|Bar)$')

# The shut-gate branch, written any of the ways this codebase writes it. A gate tested this
# way round is the CORRECT pattern — its body IS the offline explanation — so what matters
# there is only whether it returns something to show.
#
# Matched against the ORIGINAL source, not the stripped copy: strip_literals blanks string
# BODIES, so `netMode() !== 'online'` arrives here as `netMode() !== '      '` and no rule
# keyed on the word can ever fire. The stripper is length-preserving, so the same offsets
# index both. (A comment inside an `if` head could in theory smuggle the word in; that would
# only ever clear a gate this script would otherwise report, never invent one.)
SHUT = re.compile(r"""!\s*(?:online|netMode)\(\)"""
                  r"""|netMode\(\)\s*!==?\s*['"]online['"]"""
                  r"""|netMode\(\)\s*===?\s*['"](?:ask|offline)['"]""")

# Nothing-at-all, as the other half of a ternary.
EMPTY = re.compile(r'^\s*(?:null|undefined|\'\'|""|``|\[\]|false)\s*$')

FUNC_DECL = re.compile(
    r'\bfunction\s+([A-Za-z_$][\w$]*)\s*\(|'
    r'\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s+)?(?:function\b|\()')

# Deliberate exceptions. Each needs a reason, because waving one through wrongly is precisely
# the defect this script exists to stop. Keyed "path:line" against the line the gate sits on.
ALLOW = {}


def match_brace(code, i):
    """Index just past the `}` closing the `{` at i, or -1."""
    depth = 0
    while i < len(code):
        c = code[i]
        if c == '{':
            depth += 1
        elif c == '}':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def match_paren(code, i):
    """Index just past the `)` closing the `(` at i, or -1."""
    depth = 0
    while i < len(code):
        c = code[i]
        if c == '(':
            depth += 1
        elif c == ')':
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def functions(code):
    """[(start, end, name)] for every function with a braced body, innermost last."""
    out = []
    for m in FUNC_DECL.finditer(code):
        name = m.group(1) or m.group(2)
        # Walk to the body's `{`, skipping the parameter list and any `=>`.
        i = m.end() - 1 if code[m.end() - 1] == '(' else code.find('(', m.end())
        if i < 0:
            continue
        after = match_paren(code, i)
        if after < 0:
            continue
        j = after
        while j < len(code) and code[j] in ' \t\r\n':
            j += 1
        if code[j:j + 2] == '=>':
            j += 2
            while j < len(code) and code[j] in ' \t\r\n':
                j += 1
        if j >= len(code) or code[j] != '{':
            continue        # expression-bodied arrow; nothing to scan for an early return
        end = match_brace(code, j)
        if end > 0:
            out.append((m.start(), end, name))
    return out


def statement_after(code, i):
    """(body_text, end_index) for the statement beginning at i — braced block or one line."""
    while i < len(code) and code[i] in ' \t\r\n':
        i += 1
    if i >= len(code):
        return '', i
    if code[i] == '{':
        end = match_brace(code, i)
        return (code[i:end], end) if end > 0 else (code[i:], len(code))
    end = i
    depth = 0
    while end < len(code):
        c = code[end]
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                break
            depth -= 1
        elif c == ';' and depth == 0:
            end += 1
            break
        end += 1
    return code[i:end], end


def line_of(code, i):
    return code.count('\n', 0, i) + 1


def split_ternary(rest):
    """('true side', 'false side') for the `? :` starting at rest[0] == '?', else None."""
    depth = 0
    q = -1
    i = 0
    while i < len(rest):
        c = rest[i]
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                break
            depth -= 1
        elif depth == 0 and c == '?':
            if rest[i:i + 2] in ('?.', '??'):
                i += 2
                continue
            q = i
            break
        i += 1
    if q < 0:
        return None
    depth = 0
    nested = 0
    j = q + 1
    while j < len(rest):
        c = rest[j]
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                return None
            depth -= 1
        elif depth == 0 and c == '?' and rest[j:j + 2] not in ('?.', '??'):
            nested += 1
        elif depth == 0 and c == ':':
            if nested:
                nested -= 1
            else:
                break
        j += 1
    if j >= len(rest):
        return None
    k = j + 1
    depth = 0
    while k < len(rest):
        c = rest[k]
        if c in '([{':
            depth += 1
        elif c in ')]}':
            if depth == 0:
                break
            depth -= 1
        elif depth == 0 and c in ',;':
            break
        k += 1
    return rest[q + 1:j], rest[j + 1:k]


def check(path, rel, report):
    src = open(path, encoding='utf-8').read()
    code = strip_literals(src)
    assert len(code) == len(src), 'strip_literals must preserve length for offsets to index both'
    funcs = functions(code)
    bad = []
    seen = []

    def owner(pos):
        inner = None
        for start, end, name in funcs:
            if start <= pos < end and (inner is None or start >= inner[0]):
                inner = (start, end, name)
        return inner

    # ---- A and B: `if (<gate>)` -------------------------------------------------------
    for m in re.finditer(r'\bif\s*\(', code):
        head_end = match_paren(code, m.end() - 1)
        if head_end < 0:
            continue
        test = code[m.end():head_end - 1]
        if not GATE.search(test):
            continue
        body, body_end = statement_after(code, head_end)
        ln = line_of(code, m.start())
        key = '%s:%d' % (rel, ln)
        rest = code[body_end:].lstrip()
        has_else = rest.startswith('else')

        negated = SHUT.search(src[m.end():head_end - 1]) is not None
        returns_nothing = re.match(r'^\s*return\s*(?:;|$)|^\s*return\s+null\s*;?', body)

        if negated and returns_nothing:
            fn = owner(m.start())
            name = fn[2] if fn else ''
            body_src = code[fn[0]:fn[1]] if fn else ''
            is_render = bool(RENDER_NAME.search(name)) or 'return h(' in body_src
            seen.append((ln, 'B', name or '(top level)', 'renders' if is_render else 'no DOM'))
            if is_render and key not in ALLOW:
                bad.append('  %s:%d  %s() bails on a shut gate and returns nothing to show'
                           % (rel, ln, name))
            continue

        if not negated and BUILDS_DOM.search(body) and not has_else:
            seen.append((ln, 'A', (owner(m.start()) or (0, 0, ''))[2], 'builds DOM, no else'))
            if key not in ALLOW:
                shown = ' '.join(src[m.end():head_end - 1].split())
                bad.append('  %s:%d  `if (%s)` builds DOM with no else — shut, it shows nothing'
                           % (rel, ln, shown if len(shown) <= 48 else shown[:45] + '...'))
            continue
        seen.append((ln, '-', (owner(m.start()) or (0, 0, ''))[2], 'refresh trigger'))

    # ---- C: `<gate> ? <node> : nothing` -----------------------------------------------
    for m in GATE.finditer(code):
        parts = split_ternary(code[m.end():])
        if not parts:
            continue
        yes, no = parts
        ln = line_of(code, m.start())
        key = '%s:%d' % (rel, ln)
        if BUILDS_DOM.search(yes) and EMPTY.match(no):
            seen.append((ln, 'C', (owner(m.start()) or (0, 0, ''))[2], 'node : nothing'))
            if key not in ALLOW:
                bad.append('  %s:%d  ternary puts a node on screen only when connected'
                           % (rel, ln))

    if report:
        for ln, shape, fn, note in sorted(seen):
            print('  %-4s %s:%-5d %-28s %s' % (shape, rel, ln, fn or '-', note))
    return bad, len(seen)


def main():
    report = '--report' in sys.argv
    files = []
    for r in ROOTS:
        for dirpath, _dirnames, filenames in os.walk(r):
            for fn in sorted(filenames):
                if fn.endswith('.js'):
                    files.append(os.path.join(dirpath, fn))
    files.sort()

    bad = []
    gates = 0
    for path in files:
        b, n = check(path, path, report)
        bad += b
        gates += n

    if bad:
        print('FAIL  %d network gate%s can render nothing:'
              % (len(bad), '' if len(bad) == 1 else 's'))
        print('\n'.join(bad))
        print('\n  Render the section either way: same heading, one sentence naming the gate,')
        print('  one button that turns data on and re-renders. See homeWeatherCard() in')
        print('  js/screens/home.js. If a gate is genuinely fine, add it to ALLOW with a reason.')
        return 1
    print('PASS  %d files, %d network gates, every one shows something either way'
          % (len(files), gates))
    return 0


if __name__ == '__main__':
    sys.exit(main())
