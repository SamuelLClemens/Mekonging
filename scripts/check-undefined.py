#!/usr/bin/env python3
"""Find identifiers a module USES but never declares, imports, or receives as a parameter.

    python3 scripts/check-undefined.py

WHY THIS EXISTS. check-imports.py catches a named import that does not match an export — a
failure at MODULE EVALUATION, loud and immediate. This catches the quieter sibling: a bare
identifier left behind by a refactor. It is still valid JavaScript, every other guard passes,
the module evaluates, the app boots, and the ReferenceError fires only when a traveller opens
the one screen that runs that line.

That is not hypothetical. mk-v0.508.1 shipped `wxMetric` referenced in js/main.js after the
declaration had moved to js/screens/weather.js. Ten guards passed. It reached production and
broke the weather screen for every user until someone hit it in the field and reported it.

The analysis is deliberately GENEROUS about what counts as declared: any binding-shaped
occurrence anywhere in the file, block scope ignored. So it cannot see a use-before-declare or
a leaked block-scoped name — it is not a linter and does not try to be. It answers exactly one
question, the one that has actually cost this project a production incident: is this name
reachable from this file at all? Everything it reports is a genuine ReferenceError waiting for
the right tap.
"""
import os
import re
import sys

ROOTS = ['js', 'sw.js']

# Reserved words and contextual keywords. Treating the contextual ones (get/set/as/of/from/
# static/async) as keywords can only ever LOSE a finding, never invent one.
KEYWORDS = set("""
break case catch class const continue debugger default delete do else export extends finally
for function if import in instanceof let new return static super switch this throw try typeof
var void while with yield async await get set as from of true false null undefined arguments
""".split())

# Runtime globals. A name here is assumed to exist at runtime; anything NOT here and not
# declared in the file is reported. Keep it tight — a too-generous list is how this guard
# would quietly stop catching the bug it exists for.
GLOBALS = set("""
globalThis window document navigator location history screen self top parent console
setTimeout clearTimeout setInterval clearInterval queueMicrotask
requestAnimationFrame cancelAnimationFrame requestIdleCallback cancelIdleCallback
fetch Request Response Headers FormData Blob File FileReader URL URLSearchParams AbortController
AbortSignal ReadableStream TextEncoder TextDecoder BroadcastChannel MessageChannel Worker
localStorage sessionStorage indexedDB caches crypto performance
Math JSON Date Array Object String Number Boolean Symbol BigInt Function RegExp Proxy Reflect
Promise Map Set WeakMap WeakSet WeakRef Error TypeError RangeError SyntaxError ReferenceError
EvalError URIError AggregateError Intl Atomics ArrayBuffer SharedArrayBuffer DataView
Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array
Float32Array Float64Array BigInt64Array BigUint64Array
isNaN isFinite parseInt parseFloat encodeURIComponent decodeURIComponent encodeURI decodeURI
escape unescape structuredClone btoa atob NaN Infinity eval
Event CustomEvent EventTarget MutationObserver IntersectionObserver ResizeObserver
PerformanceObserver Image Audio Option Notification Element HTMLElement Node NodeList
DOMParser XMLSerializer XMLHttpRequest WebSocket EventSource Range Selection
SpeechSynthesisUtterance SpeechRecognition speechSynthesis
MediaRecorder MediaSource MediaStream AudioContext
NodeFilter TreeWalker createImageBitmap OffscreenCanvas
CSS matchMedia getComputedStyle scrollTo scrollBy alert confirm prompt open close print
clients registration skipWaiting importScripts ServiceWorkerGlobalScope
process require module exports __dirname
""".split())

IDENT = re.compile(r'[A-Za-z_$][A-Za-z0-9_$]*')

# After any of these, a '/' opens a regex literal. Without this, `return /a|b/i.test(x)`
# reads as division and the pattern's own alternatives leak out as bare identifiers.
REGEX_OK_AFTER = set('return typeof case in of do else yield await delete void '
                     'instanceof new throw'.split())


def strip_literals(src):
    """Blank out comments and string bodies, PRESERVING code inside template `${...}`.

    Returns a same-length string, so every reported line number is the real one. Template
    substitutions must survive: `${wxMetric}` is a real reference and is precisely the shape
    the original bug took.
    """
    out = list(src)
    i, n = 0, len(src)
    # Stack of open template literals; each entry counts brace depth inside a ${...}.
    tpl = []
    prev_sig = ''   # last significant character, for the regex-vs-division call
    prev_word = ''  # ...and the last word, since `return /re/` is a regex too

    def blank(a, b):
        for k in range(a, b):
            if out[k] != '\n':
                out[k] = ' '

    while i < n:
        c = src[i]
        nxt = src[i + 1] if i + 1 < n else ''
        if c == '/' and nxt == '/':
            j = src.find('\n', i)
            j = n if j < 0 else j
            blank(i, j); i = j; continue
        if c == '/' and nxt == '*':
            j = src.find('*/', i + 2)
            j = n if j < 0 else j + 2
            blank(i, j); i = j; continue
        if c in '"\'':
            j = i + 1
            while j < n and src[j] != c:
                if src[j] == '\\':
                    j += 1
                elif src[j] == '\n':
                    break
                j += 1
            blank(i, min(j + 1, n)); i = min(j + 1, n); prev_sig = 'x'; continue
        if c == '`':
            tpl.append(0); out[i] = ' '; i += 1
            # Consume the literal text up to `${` or the closing backtick.
            while i < n and tpl:
                d = src[i]
                if d == '\\':
                    if out[i] != '\n': out[i] = ' '
                    if i + 1 < n and out[i + 1] != '\n': out[i + 1] = ' '
                    i += 2; continue
                if d == '`':
                    tpl.pop(); out[i] = ' '; i += 1; break
                if d == '$' and i + 1 < n and src[i + 1] == '{':
                    out[i] = ' '; out[i + 1] = ' '
                    i += 2
                    break            # fall back to normal scanning; the `}` is handled below
                if out[i] != '\n':
                    out[i] = ' '
                i += 1
            prev_sig = 'x'; continue
        if c == '}' and tpl:
            # Closing a ${...}: resume literal-text scanning inside the same template.
            out[i] = ' '; i += 1
            while i < n and tpl:
                d = src[i]
                if d == '\\':
                    if out[i] != '\n': out[i] = ' '
                    if i + 1 < n and out[i + 1] != '\n': out[i + 1] = ' '
                    i += 2; continue
                if d == '`':
                    tpl.pop(); out[i] = ' '; i += 1; break
                if d == '$' and i + 1 < n and src[i + 1] == '{':
                    out[i] = ' '; out[i + 1] = ' '; i += 2; break
                if out[i] != '\n':
                    out[i] = ' '
                i += 1
            prev_sig = 'x'; continue
        if c == '/' and (prev_sig in '(,=:[!&|?{};+-*%~^<>' or prev_word in REGEX_OK_AFTER):
            # Regex literal, not division. Its body is not code.
            j = i + 1
            in_class = False
            closed = False
            while j < n:
                d = src[j]
                if d == '\\':
                    j += 2; continue
                if d == '[':
                    in_class = True
                elif d == ']':
                    in_class = False
                elif d == '/' and not in_class:
                    closed = True
                    break
                elif d == '\n':
                    break          # unterminated: it was division after all
                j += 1
            if closed:
                j += 1             # step PAST the closing slash before taking the flags —
                while j < n and src[j].isalpha():   # without this, /&/g left a bare `g`
                    j += 1                          # behind and reported it as a variable
                blank(i, min(j, n)); i = min(j, n); prev_sig = 'x'; prev_word = ''; continue
        if c.isalpha() or c in '_$':
            # Consume the whole identifier at once. Advancing a character at a time left
            # prev_word as the TAIL of the last word ('n' for 'return'), so the keyword test
            # above never matched and `return /a|b/i` was read as division.
            m = IDENT.match(src, i)
            prev_word = m.group(0)
            prev_sig = prev_word[-1]
            i = m.end()
            continue
        if not c.isspace():
            prev_sig = c
            prev_word = ''
        i += 1
    return ''.join(out)


DECL_PATTERNS = [
    re.compile(r'\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)'),
    re.compile(r'\bclass\s+([A-Za-z_$][\w$]*)'),
    re.compile(r'\bcatch\s*\(\s*([A-Za-z_$][\w$]*)'),
    re.compile(r'\bimport\s+([A-Za-z_$][\w$]*)\s*(?:,|from)'),
    re.compile(r'\bimport\s*\*\s*as\s+([A-Za-z_$][\w$]*)'),
]
VAR_KW = re.compile(r'\b(?:const|let|var)\s')
IMPORT_NAMED = re.compile(r'\bimport\s*(?:[A-Za-z_$][\w$]*\s*,\s*)?\{([^}]*)\}\s*from')
# Any parenthesised group introducing a body: function params, method params, arrow params,
# and — harmlessly — `if (...) {`. Over-collecting here loses findings; it never invents one.
# A parameter list, found by balancing rather than by regex. `[^()]*` was the first attempt
# and it silently skips any list containing a call — so
# `function countryChips(onPick, selected = getActiveCountry())` declared NEITHER parameter.
# That went unnoticed for as long as it did because an unrelated `const selected` elsewhere in
# main.js happened to cover the name; the moment that line moved to another file, `selected`
# was reported as a ReferenceError in a function that had always been correct.
#
# A CONTROL clause is not a parameter list. `if (store.profile) {` used to be read as one,
# declaring `store` — and that cost real findings: a file split left js/screens/trip.js
# without its `store` import and js/screens/schedules.js without `getCountry`, both genuine
# ReferenceErrors, and both invisible to this script until these keywords were excluded. The
# screens simply failed to open. `catch (e)` is NOT in this list because it really does bind.
CONTROL_HEAD = re.compile(r'\b(?:if|while|for|switch|with|return|typeof|void|delete|await|yield)\s*$')


def param_blobs(code):
    out = []
    i = 0
    while True:
        i = code.find('(', i)
        if i < 0:
            return out
        depth = 0
        j = i
        while j < len(code):
            if code[j] == '(':
                depth += 1
            elif code[j] == ')':
                depth -= 1
                if depth == 0:
                    break
            j += 1
        if j >= len(code):
            # An unclosed '(' — main.js has four, and returning here silently abandoned the
            # rest of the file, so every parameter after that point read as undeclared. Skip
            # the one bad opener and keep scanning.
            i += 1
            continue
        k = j + 1
        while k < len(code) and code[k] in ' \t\r\n':
            k += 1
        if (code[k:k + 2] == '=>' or code[k:k + 1] == '{') \
                and not CONTROL_HEAD.search(code[max(0, i - 12):i]):
            out.append(code[i + 1:j])
        i += 1
BARE_ARROW = re.compile(r'\b([A-Za-z_$][\w$]*)\s*=>')
# Object/class method shorthand — `{ acceptNode(node) { ... } }` defines a property, it does
# not reference a variable named acceptNode.
METHOD_SHORTHAND = re.compile(r'[{,;]\s*(?:async\s+|get\s+|set\s+|\*\s*)?([A-Za-z_$][\w$]*)\s*\([^()]*\)\s*\{')

OPEN, CLOSE = '([{', ')]}'


def _split_top(text, sep=','):
    """Split on `sep` occurrences that sit outside every bracket pair."""
    parts, depth, cur = [], 0, []
    for ch in text:
        if ch in OPEN:
            depth += 1
        elif ch in CLOSE:
            depth -= 1
        if ch == sep and depth == 0:
            parts.append(''.join(cur)); cur = []
        else:
            cur.append(ch)
    parts.append(''.join(cur))
    return parts


def _declaration_body(code, start):
    """Text of a const/let/var statement, from `start` to its depth-0 `;` (or line end)."""
    depth, i, n = 0, start, len(code)
    while i < n:
        ch = code[i]
        if ch in OPEN:
            depth += 1
        elif ch in CLOSE:
            depth -= 1
        elif depth == 0 and (ch == ';' or ch == '\n'):
            break
        i += 1
    return code[start:i]


def declared_names(code):
    names = set()
    for pat in DECL_PATTERNS:
        names.update(pat.findall(code))
    for m in VAR_KW.finditer(code):
        for declarator in _split_top(_declaration_body(code, m.end())):
            # Only the binding side. `const x = wxMetric;` must not declare wxMetric.
            lhs = _split_top(declarator, '=')[0]
            names.update(IDENT.findall(lhs))
    for blob in IMPORT_NAMED.findall(code):
        names.update(IDENT.findall(blob))
    for blob in param_blobs(code):
        # Only the binding side of a default: `(a, b = someCall())` binds a and b, and must
        # not also declare someCall.
        for one in _split_top(blob):
            names.update(IDENT.findall(_split_top(one, '=')[0]))
    names.update(BARE_ARROW.findall(code))
    names.update(METHOD_SHORTHAND.findall(code))
    # Nested destructuring in params spans more than one paren level; sweep any `{...}`
    # sitting directly inside a param list too.
    for blob in re.findall(r'\(\s*\{([^{}]*)\}\s*\)\s*(?:=>|\{)', code):
        names.update(IDENT.findall(blob))
    return names


def references(code):
    """Yield (name, offset) for every identifier used as a VALUE.

    Skipped: `.foo` (property access), `foo:` (object key, label, or the losing arm of a
    ternary — a false negative we accept), and `{ foo }` shorthand keys are NOT skipped
    because in an object literal the shorthand is itself a reference to a variable.
    """
    for m in IDENT.finditer(code):
        name = m.group(0)
        s, e = m.span()
        if s and (code[s - 1].isdigit() or code[s - 1] == '.'):
            continue          # tail of a numeric literal: 0xFF, 1e9, 1_000
        before = code[:s].rstrip()
        if before.endswith('.') and not before.endswith('..'):
            continue
        if before.endswith('?.'):
            continue
        after = code[e:].lstrip()
        if after.startswith(':'):
            continue
        yield name, s


def check(path, rel):
    with open(path, 'r', encoding='utf-8') as f:
        src = f.read()
    code = strip_literals(src)
    declared = declared_names(code)
    hits = {}
    for name, off in references(code):
        if name in declared or name in KEYWORDS or name in GLOBALS:
            continue
        if name not in hits:
            hits[name] = code.count('\n', 0, off) + 1
    return [(rel, line, name) for name, line in sorted(hits.items(), key=lambda kv: kv[1])]


def main():
    files = []
    for root in ROOTS:
        if os.path.isfile(root):
            files.append((root, root))
            continue
        for dirpath, _dirs, names in os.walk(root):
            for nm in sorted(names):
                if nm.endswith('.js'):
                    p = os.path.join(dirpath, nm)
                    files.append((p, p))
    findings = []
    for path, rel in sorted(files):
        findings.extend(check(path, rel))
    if findings:
        print(f'FAIL — {len(findings)} identifier(s) used but never declared, imported or passed in:\n')
        for rel, line, name in findings:
            print(f'  {rel}:{line}  {name}')
        print('\nEach of these throws a ReferenceError the moment that line runs. Either import')
        print('the name, declare it, or — if it is a real runtime global — add it to GLOBALS in')
        print('this script with a note saying where it comes from.')
        return 1
    print(f'ok — {len(files)} files, every identifier resolves')
    return 0


if __name__ == '__main__':
    sys.exit(main())
