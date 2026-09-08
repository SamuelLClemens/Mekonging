#!/usr/bin/env python3
"""Splice a batch of translations into all 29 interface dictionaries at once.

WHY THIS EXISTS. Adding one interface string means editing 29 files, and the parity guard
requires that all 29 land together — a key added to 28 dictionaries falls back to English in
the 29th, silently, on whichever screen the traveller happens to be reading. Doing that by
hand 200 times is where drift comes from, so the edit is mechanical and the mechanism checks
itself: every language must supply every numbered row, or nothing is written at all.

INPUT. `scratch/keys.json` is the ordered English key list — the numbering is stable and rows
are addressed by it, so a translation file may be written in any order and an omission is
reported as a number rather than silently shifting every later row (which is what a
positional, one-line-per-row format does when a line goes missing).

    scratch/tr/<code>.txt      lines of "<n>\t<translation>", n indexing keys.json from 1

OUTPUT. A marked block appended to each js/data/ui-strings.<code>.js before the closing brace.
Re-running replaces that block rather than adding a second copy, so the script is safe to run
again after a correction.

    python3 scripts/i18n-apply.py --scratch /path/to/scratch          # write
    python3 scripts/i18n-apply.py --scratch /path/to/scratch --check   # report only
"""
import argparse
import glob
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BEGIN = '    // ---- priority queue (i18n-report.py --priority) ----'
END = '    // ---- end priority queue ----'
WRAP = 96


def esc(s):
    """A JS single-quoted literal. Backslash first, or the quote escape gets re-escaped."""
    return s.replace('\\', '\\\\').replace("'", "\\'")


def read_tr(path, n_keys):
    """{index: translation} for one language, with the row numbers validated."""
    rows = {}
    for lineno, line in enumerate(open(path, encoding='utf-8'), 1):
        line = line.rstrip('\n')
        if not line.strip():
            continue
        if '\t' not in line:
            raise SystemExit('%s:%d has no tab separator: %r' % (path, lineno, line[:60]))
        num, val = line.split('\t', 1)
        try:
            i = int(num)
        except ValueError:
            raise SystemExit('%s:%d row number is not an integer: %r' % (path, lineno, num))
        if not 1 <= i <= n_keys:
            raise SystemExit('%s:%d row %d is outside 1..%d' % (path, lineno, i, n_keys))
        if i in rows:
            raise SystemExit('%s:%d row %d appears twice' % (path, lineno, i))
        if not val.strip():
            raise SystemExit('%s:%d row %d is empty' % (path, lineno, i))
        rows[i] = val.strip()
    return rows


def block(keys, rows):
    """The dictionary lines, packed to WRAP columns the way the hand-written blocks are."""
    out, cur = [], '   '
    for i, k in enumerate(keys, 1):
        pair = " '%s': '%s'," % (esc(k), esc(rows[i]))
        if cur != '   ' and len(cur) + len(pair) > WRAP:
            out.append(cur)
            cur = '   ' + pair
        else:
            cur += pair
    if cur.strip():
        out.append(cur)
    return '\n'.join(out)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--scratch', required=True, help='directory holding keys.json and tr/')
    ap.add_argument('--check', action='store_true', help='validate the inputs, write nothing')
    a = ap.parse_args()

    keys = json.load(open(os.path.join(a.scratch, 'keys.json'), encoding='utf-8'))
    langs = sorted(os.path.basename(p)[len('ui-strings.'):-len('.js')]
                   for p in glob.glob(os.path.join(ROOT, 'js', 'data', 'ui-strings.*.js'))
                   if not p.endswith('ui-strings.js'))

    # Validate EVERY language before touching a single file. A partial write is the one
    # outcome worse than no write: it puts the dictionaries out of parity, which is exactly
    # the failure this whole mechanism exists to prevent.
    trs, problems = {}, []
    for code in langs:
        p = os.path.join(a.scratch, 'tr', '%s.txt' % code)
        if not os.path.exists(p):
            problems.append('%s: no tr/%s.txt' % (code, code))
            continue
        rows = read_tr(p, len(keys))
        gaps = [i for i in range(1, len(keys) + 1) if i not in rows]
        if gaps:
            problems.append('%s: missing %d row(s): %s%s' % (
                code, len(gaps), gaps[:12], ' …' if len(gaps) > 12 else ''))
        trs[code] = rows
    if problems:
        print('%d language(s) not ready:' % len(problems))
        for p in problems:
            print('  - ' + p)
        return 1
    print('%d languages × %d keys — all rows present.' % (len(trs), len(keys)))

    # An identical value is a real error only where the script differs from English; the
    # parity guard draws that line and this mirrors it, so a problem surfaces here rather
    # than three commands later.
    NON_LATIN = {'th', 'vi', 'km', 'lo', 'zh-CN', 'zh-TW', 'ko', 'ja', 'hi', 'ru', 'he',
                 'ar', 'fa', 'ur', 'uk', 'bn'}
    for code in sorted(trs):
        if code not in NON_LATIN:
            continue
        same = [keys[i - 1] for i, v in trs[code].items() if v == keys[i - 1]]
        if same:
            print('  ! %s: %d value(s) identical to English: %r' % (code, len(same), same[:4]))
    if a.check:
        return 0

    for code in sorted(trs):
        path = os.path.join(ROOT, 'js', 'data', 'ui-strings.%s.js' % code)
        src = open(path, encoding='utf-8').read()
        body = BEGIN + '\n' + block(keys, trs[code]) + '\n' + END
        if BEGIN in src:
            src = re.sub(re.escape(BEGIN) + r'.*?' + re.escape(END), lambda _: body, src, flags=re.S)
        else:
            i = src.rstrip().rfind('};')
            if i < 0:
                raise SystemExit('%s: no closing brace found' % path)
            src = src[:i] + body + '\n' + src[i:]
        open(path, 'w', encoding='utf-8').write(src)
        print('  %-6s +%d' % (code, len(keys)))
    print('\nRun scripts/check-ui-strings.py next.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
