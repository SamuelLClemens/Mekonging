#!/usr/bin/env python3
"""Hold the count of literal font sizes at its baseline, so the style roll-out can only lower it (S1, docs/PROGRAM.md 5.3 item 1).

    python3 scripts/check-font-sizes.py            # fail if a count is above the baseline
    python3 scripts/check-font-sizes.py --write    # lower the baseline to today's counts (refuses to raise it)
    python3 scripts/check-font-sizes.py --list     # print every literal value and how often it is used

WHY THIS EXISTS. css/style.css defines a type scale (--fs-label to --fs-display) and uses it 241 times, yet 138
`font-size` declarations beside it set a literal size (50 distinct values, most often 12 px x 12, 11 px x 11, 1.1rem x 8,
13 px x 8), and 74 more sit inline in the JavaScript, 47 of them in pixels (counts at S1, 2026-10-27). Every one is a size the scale cannot
move and a size below the 12 px floor of the refined scale can hide in. The roll-out (R1 to R3) replaces them with
tokens screen by screen; this guard makes sure nobody adds one meanwhile and that every slice's progress is kept.

WHAT COUNTS. A `font-size:` declaration whose value is not a --fs-* token, a keyword (inherit, initial, unset, revert)
or a function that reads a token (clamp(1rem, 4.4vw, var(--fs-h1))).
  css  every such declaration in css/*.css, and the distinct values among them
  js   every such declaration in the strings of js/**/*.js (inline styles and generated markup), and the pixel ones
`index.html` is not counted. scripts/font-size-baseline.json holds the baseline; it is lowered with --write in the
slice that lowers a count, and the diff shows it.
"""
import collections
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASELINE = os.path.join(ROOT, 'scripts', 'font-size-baseline.json')
DECL = re.compile(r'(?<![-\w])font-size\s*:\s*([^;"\'`}\n]+)')
KEYWORD = re.compile(r'(inherit|initial|unset|revert)\s*(!important)?$')
TOKEN = re.compile(r'var\(\s*--fs-')


def strip_css_comments(text):
    return re.sub(r'/\*.*?\*/', lambda m: ' ' * len(m.group(0)), text, flags=re.S)


def is_literal(value):
    v = value.strip()
    return not (TOKEN.search(v) or KEYWORD.match(v))


def files(sub, ext):
    for base, _, names in os.walk(os.path.join(ROOT, sub)):
        for n in sorted(names):
            if n.endswith(ext):
                yield os.path.join(base, n)


def measure():
    css = collections.Counter()
    js = collections.Counter()
    for path in files('css', '.css'):
        text = strip_css_comments(open(path, encoding='utf-8').read())
        for m in DECL.finditer(text):
            if is_literal(m.group(1)):
                css[m.group(1).strip().replace(' !important', '')] += 1
    for path in files('js', '.js'):
        for m in DECL.finditer(open(path, encoding='utf-8', errors='replace').read()):
            if is_literal(m.group(1)):
                js[m.group(1).strip().replace(' !important', '')] += 1
    px = sum(n for v, n in js.items() if re.fullmatch(r'\d+(\.\d+)?px', v))
    return {'css': {'declarations': sum(css.values()), 'distinct': len(css)},
            'js': {'declarations': sum(js.values()), 'px': px}}, css, js


def flat(d):
    return {f'{k}.{kk}': vv for k, v in d.items() for kk, vv in v.items()}


def main():
    now, css, js = measure()
    if '--list' in sys.argv:
        for name, c in (('css', css), ('js', js)):
            print(f'{name}: {sum(c.values())} declarations, {len(c)} distinct values')
            for v, n in c.most_common():
                print(f'  {n:4d}  {v}')
        return 0
    if not os.path.exists(BASELINE):
        if '--write' not in sys.argv:
            print('FAIL: scripts/font-size-baseline.json is missing; create it with --write.')
            return 1
        base = None
    else:
        base = json.load(open(BASELINE, encoding='utf-8'))
    if '--write' in sys.argv:
        if base is not None:
            up = [f'{k} {flat(base)[k]} -> {v}' for k, v in flat(now).items() if v > flat(base)[k]]
            if up:
                print('FAIL: refusing to raise the baseline: ' + '; '.join(up))
                return 1
        with open(BASELINE, 'w', encoding='utf-8') as fh:
            json.dump(now, fh, indent=1)
            fh.write('\n')
        print('wrote scripts/font-size-baseline.json:', json.dumps(now))
        return 0
    over = [f'{k}: {v} against a baseline of {flat(base)[k]}' for k, v in flat(now).items() if v > flat(base)[k]]
    under = [f'{k}: {v} (baseline {flat(base)[k]})' for k, v in flat(now).items() if v < flat(base)[k]]
    print('literal font sizes: ' + ', '.join(f'{k} {v}' for k, v in flat(now).items()))
    if over:
        print('FAIL: a literal font size was added. Use a token (var(--fs-label), --fs-xs, --fs-sm, --fs-base, --fs-h3, --fs-h2, --fs-h1):')
        for line in over:
            print('  ' + line)
        print('Run `python3 scripts/check-font-sizes.py --list` to see every literal value.')
        return 1
    if under:
        print('PASS, and lower than the baseline (' + '; '.join(under) + '): run `python3 scripts/check-font-sizes.py --write` to keep the gain.')
        return 0
    print('PASS: no literal font size beyond the baseline.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
