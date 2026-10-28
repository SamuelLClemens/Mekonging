#!/usr/bin/env python3
"""Back-translation sample for the machine-made entries (F5). LC_WORK names the folder for the working files.

    backtranslate.py sample LANG [N] [SEED]   write WORKDIR/bt-LANG.txt: N numbered target-language strings, the English withheld
    backtranslate.py pairs  LANG              print the English next to the back-translation written in WORKDIR/bt-LANG.back.txt
    backtranslate.py record LANG              store the verdicts in WORKDIR/bt-LANG.verdict.txt into scripts/ui-strings-review.json

The sample is N random keys of the register for LANG, at most 160 characters long, with at least 60% from the safety groups
(emergency, firstaid, medical, safety). The English is withheld from the person translating back, so the back-translation is
blind; `pairs` then shows both so the meaning can be compared. Verdict lines: `n<TAB>close|differs[<TAB>note]` for the exceptions; every other sampled string is `same`.
"""
import json
import os
import random
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.path.expanduser(os.environ.get('LC_WORK', '~/Library/Caches/mk-lang-check/harvest'))
REG = os.path.join(ROOT, 'scripts', 'ui-strings-review.json')
SAFE = {'emergency', 'firstaid', 'medical', 'safety'}
PAIR = re.compile(r"'((?:[^'\\]|\\.)*)':\s*(?:'((?:[^'\\]|\\.)*)'|(null)\b)")


def unesc(s):
    return re.sub(r'\\(.)', r'\1', s)


def values(lang):
    src = open(os.path.join(ROOT, 'js', 'data', 'ui-strings.%s.js' % lang), encoding='utf-8').read()
    return {unesc(k): unesc(v) for k, v, n in PAIR.findall(src) if not n}


def load():
    return json.load(open(REG, encoding='utf-8'))


def main():
    cmd, lang = sys.argv[1], sys.argv[2]
    reg = load()
    if cmd == 'sample':
        n = int(sys.argv[3]) if len(sys.argv) > 3 else 50
        seed = int(sys.argv[4]) if len(sys.argv) > 4 else 7
        vals = values(lang)
        pool = [e for e in reg['entries'] if e['lang'] == lang and len(e['key']) <= 160 and e['key'] in vals]
        safe = [e for e in pool if e.get('group') in SAFE]
        rest = [e for e in pool if e.get('group') not in SAFE]
        rnd = random.Random(seed)
        pick = rnd.sample(safe, min(len(safe), int(n * 0.6))) + rnd.sample(rest, min(len(rest), n - int(n * 0.6)))
        rnd.shuffle(pick)
        json.dump([{'key': e['key'], 'group': e.get('group')} for e in pick], open(os.path.join(WORK, 'bt-%s.keys.json' % lang), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        with open(os.path.join(WORK, 'bt-%s.txt' % lang), 'w', encoding='utf-8') as fh:
            for i, e in enumerate(pick):
                fh.write('%d\t%s\n' % (i, vals[e['key']]))
        print('%s: %d strings (%d safety) -> bt-%s.txt' % (lang, len(pick), sum(1 for e in pick if e.get('group') in SAFE), lang))
    elif cmd == 'pairs':
        keys = json.load(open(os.path.join(WORK, 'bt-%s.keys.json' % lang), encoding='utf-8'))
        for ln in open(os.path.join(WORK, 'bt-%s.back.txt' % lang), encoding='utf-8').read().split('\n'):
            if ln.strip():
                i, back = ln.split('\t', 1)
                print('%s | EN: %s\n   | BACK: %s' % (i, keys[int(i)]['key'], back))
    elif cmd == 'record':
        keys = json.load(open(os.path.join(WORK, 'bt-%s.keys.json' % lang), encoding='utf-8'))
        backs = {}
        for ln in open(os.path.join(WORK, 'bt-%s.back.txt' % lang), encoding='utf-8').read().split('\n'):
            if ln.strip():
                i, back = ln.split('\t', 1)
                backs[int(i)] = back
        date = os.environ.get('BT_DATE', '2026-10-28')
        verdicts = {}
        for ln in open(os.path.join(WORK, 'bt-%s.verdict.txt' % lang), encoding='utf-8').read().split('\n'):
            if ln.strip():
                cells = ln.split('\t')
                verdicts[int(cells[0])] = (cells[1], cells[2] if len(cells) > 2 else '')
        new = []
        for i in sorted(backs):
            v, note = verdicts.get(i, ('same', ''))
            new.append({'lang': lang, 'key': keys[i]['key'], 'back': backs[i], 'verdict': v, 'note': note, 'date': date})
        reg['backTranslation'] = [e for e in reg.get('backTranslation', []) if e['lang'] != lang] + new
        with open(REG, 'w', encoding='utf-8') as fh:
            fh.write('{\n "note": %s,\n "entries": [\n' % json.dumps(reg['note'], ensure_ascii=False))
            fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['entries']))
            fh.write('\n ],\n "backTranslation": [\n')
            fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['backTranslation']))
            fh.write('\n ]\n}\n')
        from collections import Counter
        print(lang, dict(Counter(e['verdict'] for e in new)))


if __name__ == '__main__':
    main()
