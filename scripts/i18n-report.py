#!/usr/bin/env python3
"""What the interface renders that it cannot translate, and a per-language review sheet.

WHY THIS EXISTS. The app has 29 interface dictionaries at full parity — 168 keys each,
4,872 entries, and check-ui-strings.py keeps them in step. That guard answers "are the
dictionaries consistent with each other". It cannot answer the question that actually
matters, which is "does the screen come out in the traveller's language", and the answer
today is partly no: loading Home in Hebrew shows QUICK ACCESS and WEATHER translated while
BACK TO, YOUR TRIP, WHAT DO YOU NEED? and GIVE BACK render in English, because those four
headings have never had a key in any language. The parity guard passes either way.

So this reports the gap the guard cannot see:

  * `--missing` lists user-visible strings the code renders that have no dictionary key.
    That is the work queue: every line is a string a non-English traveller reads in English.

  * `--export <lang>` writes a tab-separated review sheet — English, the current
    translation, and a blank column — so a native speaker can check a whole language in one
    pass and hand back a file, instead of reading 168 keys out of a JavaScript object.

WHAT THIS DELIBERATELY DOES NOT DO. It does not judge whether a translation is CORRECT. No
automated check can, and neither can the person who wrote the code: verifying that the
Hebrew for "Offline" reads naturally to a Hebrew speaker requires a Hebrew speaker. The
export exists precisely so that review can happen; the report exists so it is aimed at the
right strings.

A NOTE ON SCALE, because it frames everything above. The 168 keys cover the interface
chrome: tabs, buttons, headings, labels. They do not cover the app's CONTENT — 25,917 prose
strings and roughly 2.55 million characters of place descriptions, species field marks,
hospital notes and country guides live in js/data/*.js, and none of it is bundled in any
language. A traveller reading the app in Hebrew gets Hebrew navigation around English
content, or machine translation at runtime if they have turned that on. Translating the
content is a commissioning decision, not a coding one; run --content for the current figure.

Usage:
    python3 scripts/i18n-report.py --missing            # strings with no key, by file
    python3 scripts/i18n-report.py --missing --limit 40
    python3 scripts/i18n-report.py --export he          # review sheet to stdout
    python3 scripts/i18n-report.py --export he -o he.tsv
    python3 scripts/i18n-report.py --content            # size of the untranslated corpus
"""
import argparse
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAIR = re.compile(r"'((?:[^'\\]|\\.)*)'\s*:\s*'((?:[^'\\]|\\.)*)'")

# A rendered string worth translating: passed to h() as text, or as one of the attributes the
# i18n walker swaps. Deliberately narrow — the point is a list someone can act on, not every
# literal in the codebase.
RENDERED = [
    re.compile(r"h\('(?:h1|h2|h3|h4|p|span|strong|em|summary|label|button|dt|dd|li|option)'[^)]*?,\s*'((?:[^'\\]|\\.){3,})'"),
    re.compile(r"\}\s*,\s*'((?:[^'\\]|\\.){3,})'\s*\)"),          # h(tag, attrs, 'text')
    re.compile(r"'aria-label':\s*'((?:[^'\\]|\\.){3,})'"),
    re.compile(r"placeholder:\s*'((?:[^'\\]|\\.){3,})'"),
    re.compile(r"topbar\(\s*'((?:[^'\\]|\\.){3,})'"),
]
# Not interface text: hashes, paths, urls, css, ids, and anything with a template hole (those
# are composed at runtime and cannot be a fixed key).
SKIP = re.compile(r"^(#|\.|/|https?:|img/|js/|data-|[a-z-]+:)|\$\{|^[a-z-]+$|^[A-Z_]+$")
# The h(tag, attrs, 'text') pattern can straddle lines and capture code, which produced
# entries like ")}`));" in the first run of this report. A real interface string carries no
# code punctuation, so that is the filter — cheap, and it keeps the queue actionable.
CODEISH = re.compile(r"[(){}`;]|=>|\n")


def key_set():
    """The canonical key set: the keys of any dictionary (they are held at parity)."""
    f = os.path.join(ROOT, 'js', 'data', 'ui-strings.he.js')
    s = open(f, encoding='utf-8').read()
    body = s[s.index('export const STRINGS'):]
    return {k for k, _ in PAIR.findall(body)}


def dictionary(code):
    f = os.path.join(ROOT, 'js', 'data', 'ui-strings.%s.js' % code)
    if not os.path.exists(f):
        return None
    s = open(f, encoding='utf-8').read()
    body = s[s.index('export const STRINGS'):]
    return dict(PAIR.findall(body))


def rendered_strings():
    """{string: [files]} for every candidate interface string the code renders."""
    out = {}
    files = sorted(glob.glob(os.path.join(ROOT, 'js', '*.js'))
                   + glob.glob(os.path.join(ROOT, 'js', 'screens', '*.js')))
    for f in files:
        s = open(f, encoding='utf-8').read()
        for rx in RENDERED:
            for m in rx.finditer(s):
                t = m.group(1).strip()
                if not t or SKIP.search(t) or len(t) > 90 or CODEISH.search(t):
                    continue
                if not re.search(r'[A-Za-z]', t):
                    continue
                out.setdefault(t, set()).add(os.path.relpath(f, ROOT))
    return out


def cmd_missing(limit):
    keys = key_set()
    rendered = rendered_strings()
    missing = {t: sorted(fs) for t, fs in rendered.items() if t not in keys}
    by_file = {}
    for t, fs in missing.items():
        by_file.setdefault(fs[0], []).append(t)
    print('%d candidate interface strings rendered; %d have a dictionary key, %d do not.\n'
          % (len(rendered), len(rendered) - len(missing), len(missing)))
    shown = 0
    for f in sorted(by_file, key=lambda k: -len(by_file[k])):
        print('%s  (%d)' % (f, len(by_file[f])))
        for t in sorted(by_file[f])[:limit]:
            print('    %s' % t)
            shown += 1
            if limit and shown >= limit:
                print('\n… stopping at --limit %d' % limit)
                return 0
        print()
    return 0


def cmd_export(code, out_path):
    d = dictionary(code)
    if d is None:
        print('No dictionary for "%s". Available: %s' % (
            code, ', '.join(sorted(os.path.basename(f).split('.')[1]
                                   for f in glob.glob(os.path.join(ROOT, 'js', 'data', 'ui-strings.*.js'))
                                   if not f.endswith('ui-strings.js')))), file=sys.stderr)
        return 1
    lines = ['english\tcurrent_%s\tcorrected_%s\tnote' % (code, code)]
    for k in sorted(d):
        # A value identical to the key is either a real cognate ("Vietnam", "Budget") or an
        # untranslated string; the reviewer is the one who can tell, so it is flagged, not
        # guessed at.
        note = 'same as English — cognate, or not yet translated?' if k.strip() == d[k].strip() else ''
        lines.append('%s\t%s\t\t%s' % (k, d[k], note))
    text = '\n'.join(lines) + '\n'
    if out_path:
        open(out_path, 'w', encoding='utf-8').write(text)
        print('%d rows written to %s' % (len(d), out_path))
        print('Reviewer fills column 3 only where column 2 is wrong, and returns the file.')
    else:
        sys.stdout.write(text)
    return 0


def cmd_content():
    prose = re.compile(r'"([^"\\]{25,}?)"|\'([^\'\\]{25,}?)\'')
    total = chars = 0
    rows = []
    for f in sorted(glob.glob(os.path.join(ROOT, 'js', 'data', '*.js'))):
        if 'ui-strings' in f:
            continue
        s = open(f, encoding='utf-8').read()
        hits = [a or b for a, b in prose.findall(s)]
        hits = [x for x in hits if ' ' in x and not x.startswith(('http', 'img/'))]
        if not hits:
            continue
        total += len(hits)
        c = sum(len(x) for x in hits)
        chars += c
        rows.append((os.path.basename(f), len(hits), c))
    rows.sort(key=lambda r: -r[2])
    print('Untranslated content corpus (js/data, excluding the interface dictionaries):\n')
    for n, k, c in rows[:15]:
        print('  %-28s %6d strings  %9s chars' % (n, k, format(c, ',')))
    print('\n  %-28s %6d strings  %9s chars' % ('TOTAL', total, format(chars, ',')))
    print('\nInterface dictionary: 168 strings in each of 29 languages.')
    print('Share of the app\'s prose with a bundled translation: %.2f%%' % (100.0 * 168 / total))
    print('\nEverything else falls back to English, or to runtime machine translation where')
    print('the traveller has enabled it. Translating it is a commissioning decision.')
    return 0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--missing', action='store_true')
    ap.add_argument('--export', metavar='LANG')
    ap.add_argument('--content', action='store_true')
    ap.add_argument('--limit', type=int, default=0)
    ap.add_argument('-o', '--out')
    a = ap.parse_args()
    if a.export:
        return cmd_export(a.export, a.out)
    if a.content:
        return cmd_content()
    if a.missing:
        return cmd_missing(a.limit)
    ap.print_help()
    return 0


if __name__ == '__main__':
    sys.exit(main())
