#!/usr/bin/env python3
"""List the composed interface strings (class `tpl`) a lang-check run rendered, with the pattern key each one would need.

    python3 -I tpl-list.py ROOT RUN_DIR LANG [LANG...]   ->  RUN_DIR/tpl-<lang>.json and a summary

A composed string is one that matches a template literal in the app's code (`${...}` slots) and no fixed literal. The pattern key is that
template with each slot written `{0}`, `{1}`. A template whose slot holds a quoted word (`${n === 1 ? 'night' : 'nights'}`) is flagged `words`:
its slot carries English that a pattern would leave untouched, so it needs the code split or one key per word.
"""
import importlib.util
import json
import os
import re
import sys

ROOT, RUN = sys.argv[1], sys.argv[2]
LANGS = sys.argv[3:] or ['en']
spec = importlib.util.spec_from_file_location('lc', os.path.join(ROOT, 'tools/lang-check/lang-check.py'))
lc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(lc)

SLOT = re.compile(r'\$\{((?:[^{}]|\{[^{}]*\})*)\}')


def templates():
    out = []
    for dp, _, files in os.walk(os.path.join(ROOT, 'js')):
        if os.sep + 'data' in dp[len(ROOT):] or 'fixture' in dp:
            continue
        for f in sorted(files):
            if not f.endswith('.js') or 'fixture' in f:
                continue
            src = open(os.path.join(dp, f), encoding='utf-8', errors='replace').read()
            for m in lc.LIT.finditer(src):
                g = next((x for x in m.groups() if x is not None), '')
                if m.group(3) is None or '${' not in g:
                    continue
                flat = re.sub(r'\s+', ' ', g).strip()
                if len(re.sub(r'\$\{.*?\}', '', flat).strip()) < 4:
                    continue
                exprs = SLOT.findall(flat)
                parts = SLOT.split(flat)[0::2]
                rx = re.compile('^' + '(.+?)'.join(re.escape(p) for p in parts) + '$', re.S)
                n = [0]

                def num(_):
                    n[0] += 1
                    return '{%d}' % (n[0] - 1)
                key = SLOT.sub(num, flat)
                out.append({'rx': rx, 'key': key, 'exprs': exprs, 'file': os.path.relpath(os.path.join(dp, f), ROOT), 'lits': sum(len(p) for p in parts)})
    return out


TPLS = templates()


def main():
    data = lc.data_strings()
    base = {}
    for rec in lc.load_run(RUN).get('en', []):
        base[rec['route']] = {t['s'] for t in rec['texts']}
    for lang in LANGS:
        recs = lc.load_run(RUN).get(lang, [])
        dv = lc.dict_values(lang) if lang != 'en' else set()
        found = {}
        for r in recs:
            for t in r['texts']:
                s = t['s']
                if t['b'] or s not in base.get(r['route'], set()) or not lc.LATIN.search(s):
                    continue
                if {s, lc.app_key(s)} & (dv | lc.KEEP):
                    continue
                if lc.classify(s, data) != 'tpl':
                    continue
                k = lc.app_key(s)
                hits = [tp for tp in TPLS if tp['rx'].match(s) or tp['rx'].match(k)]
                hits.sort(key=lambda tp: -tp['lits'])
                best = hits[0] if hits else None
                e = found.setdefault(best['key'] if best else '?' + k, {'key': best['key'] if best else None, 'file': best['file'] if best else None,
                                                                         'words': bool(best and any(re.search(r"['\"]", x) for x in best['exprs'])),
                                                                         'examples': [], 'routes': set(), 'n': 0, 'templates': len(hits)})
                e['n'] += 1
                e['routes'].add(r['route'])
                if len(e['examples']) < 4 and s not in e['examples']:
                    e['examples'].append(s)
        rows = sorted(found.values(), key=lambda e: (-e['n'], e['key'] or ''))
        for e in rows:
            e['routes'] = sorted(e['routes'])
        p = os.path.join(RUN, 'tpl-%s.json' % lang)
        json.dump(rows, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        occ = sum(e['n'] for e in rows)
        print('%s: %d occurrences, %d distinct templates (%d with quoted words in a slot, %d matched no template) -> %s' %
              (lang, occ, len(rows), sum(1 for e in rows if e['words']), sum(1 for e in rows if e['key'] is None), p))


main()
