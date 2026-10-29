#!/usr/bin/env python3
"""Give a batch of harvested interface strings a key in all 29 dictionaries (F5).

    python3 tools/lang-check/lang-check.py --lang th,vi,km,lo --strings       # writes <out>/strings.json, safety groups first
    python3 tools/lang-check/apply-strings.py --keys <out>/strings.json --show 0:60                     # numbered keys to translate
    python3 tools/lang-check/apply-strings.py BATCH.tsv --keys <out>/strings.json [--group emergency] [--date 2026-10-28] [--dry]

BATCH.tsv has one string per line: the English text exactly as the screen renders it (the key), then the four host
languages, tab separated and in this order: th, vi, km, lo. An empty cell means "not translated yet" (`null`). A line
that starts with `#` is a comment. With --keys, the first two cells are instead the key's number in that list and its
first characters (a check that the number is right). The four host languages are the only files written (owner ruling 2026-10-29, open decision 30: `check-ui-strings`
treats a key a non-host language omits as a null, so the 25 other files stay as they are until L2 fills them); `--all-files` restores the old
rule of a null in every file.

What it writes
  js/data/ui-strings.<code>.js  a marked block "F5 harvest" before the closing brace of each of the 29 files. A rerun
                                merges into that block (a key already in it takes the newer value if the old one is
                                null); a key that already lives elsewhere in the file is left alone and reported.
  scripts/ui-strings-review.json  one machine-made entry per host-language value, in review order: groups listed in
                                PRIORITY first (Emergency, first aid, medical), then the rest in the order added.
"""
import argparse
import json
import os
import re
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA = os.path.join(ROOT, 'js', 'data')
REGISTER = os.path.join(ROOT, 'scripts', 'ui-strings-review.json')
HOST = ['th', 'vi', 'km', 'lo']
PRIORITY = ['emergency', 'firstaid', 'medical']
BEGIN = '    // ---- F5 harvest (tools/lang-check/apply-strings.py; null = show English) ----'
END = '    // ---- end F5 harvest ----'
PAIR = re.compile(r"'((?:[^'\\]|\\.)*)':\s*(?:'((?:[^'\\]|\\.)*)'|(null)\b)")


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def unesc(s):
    return re.sub(r'\\(.)', r'\1', s)


def langs():
    out = []
    for f in sorted(os.listdir(DATA)):
        m = re.match(r'ui-strings\.(.+)\.js$', f)
        if m:
            out.append(m.group(1))
    return out


def fmt(pairs):
    lines, cur = [], '   '
    for k, v in pairs:
        item = " '%s': %s," % (esc(k), 'null' if v is None else "'%s'" % esc(v))
        if len(cur) + len(item) > 118 and cur.strip():
            lines.append(cur)
            cur = '   '
        cur += item
    if cur.strip():
        lines.append(cur)
    return '\n'.join(lines)


GROUPS = {}


def read_batch(path, keys=None, groups=GROUPS):
    """Rows of (key, {lang: text}). With `keys` (the harvest's ordered key list) a row is `n<TAB>first characters of the key<TAB>th<TAB>vi<TAB>km<TAB>lo`:
    the number picks the key and the prefix proves the number is the right one, so a slipped count stops the run instead of mis-filing a translation."""
    rows = []
    for ln in open(path, encoding='utf-8').read().split('\n'):
        if not ln.strip() or ln.startswith('#'):
            continue
        cells = ln.split('\t')
        if keys is not None:
            n = int(cells[0])
            key = keys[n]['key'] if isinstance(keys[n], dict) else keys[n]
            groups[key] = keys[n].get('group') if isinstance(keys[n], dict) else None
            if not key.startswith(cells[1]):
                sys.exit('row %d: the key is %r, which does not start with %r' % (n, key[:40], cells[1]))
            cells = [key] + cells[2:]
        key = re.sub(r'\s+', ' ', cells[0]).strip()
        vals = [(c.strip() or None) for c in cells[1:5]] + [None] * (4 - len(cells[1:5]))
        rows.append((key, dict(zip(HOST, vals))))
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('batch', nargs='?', default='')
    ap.add_argument('--show', default='', help='print numbered keys from --keys, e.g. --show 0:60, and stop')
    ap.add_argument('--group', default='auto', help="the review group of every string, or `auto` to take each key's group from --keys")
    ap.add_argument('--date', default=time.strftime('%Y-%m-%d'))
    ap.add_argument('--dry', action='store_true')
    ap.add_argument('--all-files', action='store_true', help='also write a null for every new key into the other 25 files (the owner\'s original rule; relaxed 2026-10-29, decision 30)')
    ap.add_argument('--keys', default='', help='the harvest key list (JSON); the batch then addresses keys by number')
    a = ap.parse_args()
    if a.show:
        lo, hi = (int(x or 0) if x else None for x in a.show.split(':'))
        ks = json.load(open(a.keys, encoding='utf-8'))
        for i, k in list(enumerate(ks))[lo:hi]:
            print('%d\t%s' % (i, k['key'] if isinstance(k, dict) else k))
        return
    if not a.batch:
        ap.error('a BATCH.tsv is required')
    rows = read_batch(a.batch, json.load(open(a.keys, encoding='utf-8')) if a.keys else None)
    seen = set()
    for k, _ in rows:
        if k in seen:
            sys.exit('duplicate key in the batch: ' + k)
        seen.add(k)
    reg = {'entries': []}
    if os.path.exists(REGISTER):
        reg = json.load(open(REGISTER, encoding='utf-8'))
    have = {(e['lang'], e['key']) for e in reg['entries']}
    targets = langs() if a.all_files else [c for c in langs() if c in HOST]   # F5b: a language outside the harvest gains no key until L2 fills it
    added = {c: 0 for c in targets}
    wrote = {c: set() for c in targets}   # keys this run put a value into, per language: only those are register entries
    skipped = 0
    new_entries = []
    for code in targets:
        path = os.path.join(DATA, 'ui-strings.%s.js' % code)
        src = open(path, encoding='utf-8').read()
        b0, b1 = src.find(BEGIN), src.find(END)
        if (b0 < 0) != (b1 < 0):
            sys.exit('%s: half a marked block' % path)
        if b0 >= 0:
            inner = src[b0 + len(BEGIN):b1]
            block = [(unesc(k), None if n else unesc(v)) for k, v, n in PAIR.findall(inner)]
            outside = src[:b0] + src[b1:]
        else:
            block, outside = [], src
        in_file = {unesc(k) for k, _, _ in PAIR.findall(outside)}
        idx = {k: i for i, (k, _) in enumerate(block)}
        for key, vals in rows:
            v = vals.get(code)
            if key in idx:
                if block[idx[key]][1] is None and v:
                    block[idx[key]] = (key, v)
                    added[code] += 1
                    wrote[code].add(key)
                continue
            if key in in_file:
                skipped += 1
                continue
            block.append((key, v))
            idx[key] = len(block) - 1
            if v:
                added[code] += 1
                wrote[code].add(key)
        text = BEGIN + '\n' + fmt(block) + '\n' + END + '\n'
        if b0 >= 0:
            out = src[:b0] + text + src[b1 + len(END):].lstrip('\n')
            out = out.replace(END + '\n\n', END + '\n')
        else:
            close = src.rstrip().rfind('};')
            if close < 0:
                sys.exit('%s: no closing brace' % path)
            out = src[:close] + text + src[close:]
        if not a.dry:
            open(path, 'w', encoding='utf-8').write(out)
        if code in HOST:
            for key, vals in rows:
                if vals.get(code) and key in wrote[code] and (code, key) not in have:
                    new_entries.append({'lang': code, 'key': key, 'machine': True, 'date': a.date, 'group': GROUPS.get(key) if a.group == 'auto' and GROUPS.get(key) else (a.group if a.group != 'auto' else 'screens')})
                    have.add((code, key))
    reg['entries'].extend(new_entries)
    rank = {g: i for i, g in enumerate(PRIORITY)}
    reg['entries'] = [e for _, e in sorted(enumerate(reg['entries']), key=lambda t: (rank.get(t[1].get('group'), len(PRIORITY)), t[0]))]
    reg['note'] = ('Machine-made interface translations awaiting a native review (js/data/ui-strings.js rule 2). Written by the '
                   'session that filled them: no service or key. Order is review order: Emergency, first aid and medical first. '
                   '`backTranslation` holds the samples translated back into English to check the meaning.')
    reg.setdefault('backTranslation', [])
    if not a.dry:
        with open(REGISTER, 'w', encoding='utf-8') as fh:
            fh.write('{\n "note": %s,\n "entries": [\n' % json.dumps(reg['note'], ensure_ascii=False))
            fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['entries']))
            fh.write('\n ],\n "backTranslation": [\n')
            fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['backTranslation']))
            fh.write('\n ]\n}\n')
    print('batch %s (%s): %d strings; new values per language: %s; %d already keyed elsewhere in a file (left alone); %d register entries added%s'
          % (os.path.basename(a.batch), a.group, len(rows), ' '.join('%s:%d' % (c, added[c]) for c in HOST), skipped, len(new_entries),
             '  [dry run: nothing written]' if a.dry else ''))


if __name__ == '__main__':
    main()
