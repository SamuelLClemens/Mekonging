#!/usr/bin/env python3
"""The safety text for th, vi, km and lo (F5b): the Emergency scenario guides and the first-aid steps are data, not interface strings.

    python3 tools/lang-check/safety-text.py keys                    # write WORK/safety-keys.json: every string to translate, in review order
    python3 tools/lang-check/safety-text.py show 0:40               # numbered keys
    python3 tools/lang-check/safety-text.py apply BATCH.tsv [--date 2026-10-29] [--dry]
    python3 tools/lang-check/safety-text.py status                  # how many keys each language holds

The keys are every string `js/data/emergency.js` (the situation guides, the embassy lists, the hospital tags) and `js/data/firstaid.js`
(section titles and topics) put on a screen, as the screen renders them (a leading emoji is left off: `js/i18n.js` puts it back).
BATCH.tsv rows are `n<TAB>first characters of the key<TAB>th<TAB>vi<TAB>km<TAB>lo`; the prefix proves the number. An empty cell leaves that
language without the entry (English shows). `apply` merges the rows into `js/data/safety-text.<code>.js` (one lazy module per language,
`export const SAFETY_STRINGS`, keyed by the exact English text the way the dictionaries are; `js/i18n.js` `ensureSafetyText` loads it when
a safety screen opens) and writes one machine-made entry per value into `scripts/ui-strings-review.json` with `source: safety-text`,
the Emergency group first, then first aid.
"""
import json
import os
import re
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
WORK = os.path.expanduser(os.environ.get('LC_WORK', '~/Library/Caches/mk-f5b/safety'))
REGISTER = os.path.join(ROOT, 'scripts', 'ui-strings-review.json')
JSC = '/System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc'
HOST = ['th', 'vi', 'km', 'lo']
PRIORITY = ['emergency', 'firstaid', 'medical']
LEAD = re.compile(r'^[\U0001F000-\U0001FAFF←-⇿⌀-➿⬀-⯿️‍⃣]+\s+')
PAIR = re.compile(r"^\s*'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)',?\s*$", re.M)
HEAD = """// Safety text — %s (%s). The Emergency situation guides and the first-aid steps, which are data (js/data/emergency.js, firstaid.js).
//
// Lazy: js/i18n.js ensureSafetyText() imports this file only when #sos, #firstaid or #hospital opens in this language, and merges the entries
// into the active dictionary, so the DOM pass finds them by exact English text (the same keys as js/data/ui-strings.%s.js, a leading emoji
// left off). Never import it from an eager module. Machine-made, every entry listed in scripts/ui-strings-review.json (source: safety-text)
// for a native review; written by tools/lang-check/safety-text.py. A string with no entry shows English.

export const SAFETY_STRINGS = {
"""
NAMES = {'th': 'Thai', 'vi': 'Vietnamese', 'km': 'Khmer', 'lo': 'Lao'}


def esc(s):
    return s.replace('\\', '\\\\').replace("'", "\\'")


def unesc(s):
    return re.sub(r'\\(.)', r'\1', s)


def strip_lead(s):
    return LEAD.sub('', s)


def dump():
    with tempfile.TemporaryDirectory() as d:
        p = os.path.join(d, 'dump.mjs')
        open(p, 'w').write(
            "import { FIRSTAID_SECTIONS, FIRSTAID_TOPICS } from '%s/js/data/firstaid.js';\n"
            "import { EMERGENCIES, EMBASSY, HOSP_TAG } from '%s/js/data/emergency.js';\n"
            "print(JSON.stringify({FIRSTAID_SECTIONS, FIRSTAID_TOPICS, EMERGENCIES, EMBASSY, HOSP_TAG}));\n" % (ROOT, ROOT))
        out = subprocess.run([JSC, '-m', p], capture_output=True, text=True, check=True).stdout
    return json.loads(out)


def keys():
    d = dump()
    out, seen = [], set()

    def add(s, group):
        if not isinstance(s, str) or not s.strip():
            return
        k = re.sub(r'\s+', ' ', strip_lead(s)).strip()
        if k not in seen:
            seen.add(k)
            out.append({'key': k, 'group': group})

    for e in d['EMERGENCIES']:
        add(e['t'], 'emergency')
        add(e.get('lead'), 'emergency')
        for f in ('now', 'then', 'avoid'):
            for s in e.get(f) or []:
                add(s, 'emergency')
    for f in ('can', 'cannot'):
        for s in d['EMBASSY'][f]:
            add(s, 'emergency')
    add(d['EMBASSY']['note'], 'emergency')
    for s in d['HOSP_TAG'].values():
        add(s, 'emergency')
    for sec in d['FIRSTAID_SECTIONS']:
        add(sec['t'], 'firstaid')
    for t in d['FIRSTAID_TOPICS']:
        add(t['t'], 'firstaid')
        add(t.get('lead'), 'firstaid')
        for f in ('now', 'then', 'avoid'):
            for s in t.get(f) or []:
                add(s, 'firstaid')
        add(t.get('note'), 'firstaid')
    return out


def load_keys():
    p = os.path.join(WORK, 'safety-keys.json')
    if not os.path.exists(p):
        sys.exit('run `keys` first')
    return json.load(open(p, encoding='utf-8'))


def mod_path(code):
    return os.path.join(ROOT, 'js', 'data', 'safety-text.%s.js' % code)


def read_mod(code):
    p = mod_path(code)
    if not os.path.exists(p):
        return []
    src = open(p, encoding='utf-8').read()
    body = src[src.index('export const SAFETY_STRINGS = {'):]
    return [(unesc(k), unesc(v)) for k, v in PAIR.findall(body)]


def write_mod(code, pairs):
    with open(mod_path(code), 'w', encoding='utf-8') as fh:
        fh.write(HEAD % (NAMES[code], code, code))
        for k, v in pairs:
            fh.write("  '%s': '%s',\n" % (esc(k), esc(v)))
        fh.write('};\n')


def write_register(reg):
    rank = {g: i for i, g in enumerate(PRIORITY)}
    reg['entries'] = [e for _, e in sorted(enumerate(reg['entries']), key=lambda t: (rank.get(t[1].get('group'), len(PRIORITY)), t[0]))]
    with open(REGISTER, 'w', encoding='utf-8') as fh:
        fh.write('{\n "note": %s,\n "entries": [\n' % json.dumps(reg['note'], ensure_ascii=False))
        fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['entries']))
        fh.write('\n ],\n "backTranslation": [\n')
        fh.write(',\n'.join('  ' + json.dumps(e, ensure_ascii=False) for e in reg['backTranslation']))
        fh.write('\n ]\n}\n')


def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    os.makedirs(WORK, exist_ok=True)
    if cmd == 'keys':
        ks = keys()
        json.dump(ks, open(os.path.join(WORK, 'safety-keys.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
        from collections import Counter
        print('%d keys %s -> %s' % (len(ks), dict(Counter(k['group'] for k in ks)), os.path.join(WORK, 'safety-keys.json')))
    elif cmd == 'show':
        lo, hi = (int(x) if x else None for x in sys.argv[2].split(':'))
        for i, k in list(enumerate(load_keys()))[lo:hi]:
            print('%d\t%s' % (i, k['key']))
    elif cmd == 'status':
        ks = load_keys()
        for c in HOST:
            have = {k for k, _ in read_mod(c)}
            print('%s: %d of %d' % (c, sum(1 for k in ks if k['key'] in have), len(ks)))
    elif cmd == 'apply':
        batch = sys.argv[2]
        date = sys.argv[sys.argv.index('--date') + 1] if '--date' in sys.argv else time.strftime('%Y-%m-%d')
        dry = '--dry' in sys.argv
        ks = load_keys()
        rows = []
        for ln in open(batch, encoding='utf-8').read().split('\n'):
            if not ln.strip() or ln.startswith('#'):
                continue
            cells = ln.split('\t')
            n = int(cells[0])
            key = ks[n]['key']
            if not key.startswith(cells[1]):
                sys.exit('row %d: the key is %r, which does not start with %r' % (n, key[:40], cells[1]))
            vals = [(c.strip() or None) for c in cells[2:6]] + [None] * (4 - len(cells[2:6]))
            rows.append((key, ks[n]['group'], dict(zip(HOST, vals))))
        reg = json.load(open(REGISTER, encoding='utf-8'))
        have = {(e['lang'], e['key'], e.get('source')) for e in reg['entries']}
        added = {c: 0 for c in HOST}
        for c in HOST:
            pairs = read_mod(c)
            idx = {k: i for i, (k, _) in enumerate(pairs)}
            for key, group, vals in rows:
                v = vals.get(c)
                if not v:
                    continue
                if key in idx:
                    pairs[idx[key]] = (key, v)
                else:
                    pairs.append((key, v))
                    idx[key] = len(pairs) - 1
                added[c] += 1
                if (c, key, 'safety-text') not in have:
                    reg['entries'].append({'lang': c, 'key': key, 'machine': True, 'date': date, 'group': group, 'source': 'safety-text'})
                    have.add((c, key, 'safety-text'))
            if not dry:
                write_mod(c, pairs)
        if not dry:
            write_register(reg)
        print('batch %s: %d rows; values written %s%s' % (os.path.basename(batch), len(rows), ' '.join('%s:%d' % (c, added[c]) for c in HOST), ' [dry run]' if dry else ''))
    else:
        sys.exit(__doc__)


if __name__ == '__main__':
    main()
