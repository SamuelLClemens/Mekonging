#!/usr/bin/env python3
"""Validate the interface-translation dictionaries against the language registry.

    python3 scripts/check-ui-strings.py

Exits non-zero on any problem, so it can gate a commit or a deploy.

WHY THIS EXISTS. js/i18n.js translates the finished DOM by exact-matching English strings
against js/data/ui-strings.<code>.js. That design has one failure mode worth guarding: a language can
drift out of parity, a key added to English and to fifteen dictionaries but not the
sixteenth, and NOTHING breaks. The missing key just falls back to English, so a Korean
traveller silently gets one English word in the middle of a Korean screen and no error is
raised anywhere. A count is the only thing that makes that visible, so this counts.

Checks performed:
  1. Every language marked `ui: true` in the registry actually has a dictionary, and every
     dictionary belongs to a language marked `ui: true`. A language claiming a dictionary it
     lacks would offer the user a choice that does nothing.
  2. Key parity. The canonical set is the union of the keys of the languages in UI_STRING_MACHINE (the host languages th, vi, km
     and lo, which F5 and F5b fill): every one of them must hold every key. A language outside that list may omit a key
     (owner ruling 2026-10-29, open decision 30: the 25 null-only languages keep the 405 keys they carry and gain none until
     L2 fills them); an omitted key counts as a null (shown in English), and a key no host language holds is an error.
  3. No duplicate keys inside a block, a JS object literal silently keeps only the last, so a
     duplicate is a translation that looks present and is not.
  4. No empty values, and no value left identical to its English key in a non-Latin script
     (a strong sign of a copy-paste that was never translated).
  5. A value may be `null`: "not translated yet, show English" (F5, owner ruling 2026-10-24). A null still
     counts as a key for parity, and the nulls are counted per language so a gap is a number, not a surprise.
     `--assert-complete th,vi,km,lo` fails if any of those languages still has one.
  6. The machine-translation register (scripts/ui-strings-review.json) agrees with the dictionaries: every
     entry names a key the language holds with a real value, and a language with entries is listed in
     UI_STRING_MACHINE (js/data/ui-strings.js), which is what the language picker reads to say
     "machine-translated, under review".
  7. The safety text (js/data/safety-text.<code>.js, F5b: the Emergency guides and first-aid steps, which are data): the four host
     files hold the same keys, no empty value, no value identical to its key, every key still occurs in js/data/emergency.js
     or js/data/firstaid.js (a key edited in the data would otherwise show English with no signal), and the register's
     `source: safety-text` entries and the files agree both ways.
  8. Composed strings (F5c): a key with numbered slots (`Sources ({0})`, `{0} nights · {1} stops`) is a pattern that js/i18n.js
     matches after an exact key fails. The value must hold the same slots as the key; no slot twice; a pattern that begins and ends with
     a slot needs 20 characters and three words of fixed text (it is found by them); each word of the key must still occur in the code;
     and no string in js/data/ may be one a text-wide pattern would rewrite (a pattern whose opening is a symbol or two fixed words
     applies to any text, every other one to aria-label only; the rule is in js/i18n.js and `pattern_of` here).
"""
import glob
import json
import os
import re
import sys

I18N = 'js/i18n.js'
MANIFEST = 'js/data/ui-strings.js'
# One file per language since the dictionaries were split out of the manifest (all 29 in one
# eagerly-imported module cost every traveller 162 KB before first paint). The manifest is
# still the source of truth for WHICH languages exist, so a file on disk that the manifest
# does not list, or a listed language with no file, is itself a failure worth reporting.
STRINGS_GLOB = 'js/data/ui-strings.*.js'

# A block whose language genuinely shares a word with English is not an error. Filipino uses
# the English "Home", "Online", "Offline", "Emergency" and "Accessibility" as ordinary loans,
# and several Latin-script languages spell country names exactly as English does.
ALLOWED_IDENTICAL = {
    'tl': {'Home', 'Online', 'Offline', 'Emergency', 'Accessibility', 'Thailand', 'Vietnam',
           'Cambodia', 'Laos', 'Tourist Police', 'Budget'},
    'vi': {'Khmer'},   # the language's own name for the Khmer language and people (F5c)
}


def blocks(src):
    """Yield (code, body) for each top-level language block."""
    for m in re.finditer(r"^  '?([A-Za-z-]+)'?: \{(.*?)^  \},$", src, re.S | re.M):
        yield m.group(1), m.group(2)


def pairs(body):
    """(key, value) for every entry; a `null` value comes back as None."""
    out = []
    for k, v, n in re.findall(r"'((?:[^'\\]|\\.)*)':\s*(?:'((?:[^'\\]|\\.)*)'|(null)\b)", body):
        out.append((re.sub(r"\\([\\'])", r'\1', k), None if n else v))   # a key reads as the string the DOM holds: \' is '
    return out


REGISTER = 'scripts/ui-strings-review.json'
SAFETY_GLOB = 'js/data/safety-text.*.js'
SAFETY_SOURCES = ('js/data/emergency.js', 'js/data/firstaid.js')


def _plain(s):
    """Source text as a string literal's value reads: escaped quotes unescaped, whitespace collapsed."""
    return re.sub(r'\s+', ' ', re.sub(r"\\(['\"])", r'\1', s))


def safety_text(problems):
    """{lang: {key: value}} for js/data/safety-text.<code>.js (item 7 in the docstring); appends what is wrong to `problems`."""
    out = {}
    for path in sorted(glob.glob(SAFETY_GLOB)):
        code = os.path.basename(path)[len('safety-text.'):-len('.js')]
        body = open(path, encoding='utf-8').read()
        if 'export const SAFETY_STRINGS = {' not in body:
            problems.append(f'{path}: no SAFETY_STRINGS export')
            continue
        kv = pairs(body[body.index('export const SAFETY_STRINGS = {'):])
        keys = [k for k, _ in kv]
        for k in sorted({k for k in keys if keys.count(k) > 1}):
            problems.append(f'safety text {code}: duplicate key {k[:60]!r}')
        out[code] = dict(kv)
    if not out:
        return out
    source = ' '.join(_plain(open(p, encoding='utf-8').read()) for p in SAFETY_SOURCES if os.path.exists(p))
    canon = set().union(*(set(v) for v in out.values()))
    for code, kv in sorted(out.items()):
        gap = canon - set(kv)
        if gap:
            problems.append(f'safety text {code}: missing {len(gap)} key(s) another host language holds, e.g. {sorted(gap)[0][:60]!r}')
        for k, v in kv.items():
            if v is None or not v.strip():
                problems.append(f'safety text {code}: empty value for {k[:60]!r}')
            elif v == k:
                problems.append(f'safety text {code}: {k[:60]!r} is identical to the English')
    for k in sorted(canon):
        if _plain(k) not in source:
            problems.append(f'safety text: {k[:60]!r} no longer occurs in js/data/emergency.js or firstaid.js (the data changed: update the key)')
    print(f'safety text: {len(out)} language(s), {len(canon)} keys each')
    return out


# ---- composed strings (item 8): pattern keys -----------------------------------------------------------------------------
# A key with numbered slots (`Sources ({0})`) is a pattern (js/i18n.js matchPattern). The rules below mirror that file: a change to
# one is a change to the other.
SLOT = re.compile(r'\{(\d)\}')
DATA_LIT = re.compile(r"""//[^\n]*|/\*.*?\*/|'((?:[^'\\\n]|\\.)*)'|"((?:[^"\\\n]|\\.)*)"|`((?:[^`\\$]|\\.|\$(?!\{))*)`""", re.S)   # a comment is skipped, not read as a string


def _words(s):
    return len(re.findall(r'[^\W\d_]{2,}', s))


def pattern_of(key):
    """None for a plain key, else {slots, lits, rx, reach, head, tail, needle}. reach: 'anywhere' (any text and attribute), 'aria' (aria-label
    only) or 'refused' (nothing anchors it, so i18n.js would never apply it)."""
    bits = re.split(r'\{(\d)\}', key)
    if len(bits) < 3:
        return None
    lits, slots = bits[0::2], [int(x) for x in bits[1::2]]
    first, last = lits[0], lits[-1]
    opening, fixed = first.strip(), ''.join(lits)
    anywhere = bool(opening and (re.search(r'[^\w\s]', opening) or (_words(opening) >= 1 and _words(fixed) >= 2))) or (len(fixed.strip()) >= 20 and _words(fixed) >= 3)
    if opening or len(last.strip()) >= 2:
        reach = 'anywhere' if anywhere else 'aria'
    else:
        reach = 'anywhere' if anywhere else 'refused'
    return {'slots': slots, 'lits': lits, 'reach': reach, 'rx': re.compile('^' + '(.*?)'.join(re.escape(x) for x in lits) + '$', re.S),
            'head': first[:1] if opening else None, 'tail': last[-1:] if not opening and len(last.strip()) >= 2 else None,
            'needle': max(lits, key=len) if not opening and len(last.strip()) < 2 else None}


def _code_words():
    words = set()
    for dp, _, files in os.walk('js'):
        if os.sep + 'data' in dp or dp.endswith(os.sep + 'data'):
            continue
        for f in files:
            if f.endswith('.js'):
                words.update(w.lower() for w in re.findall(r'[^\W\d_]{4,}', open(os.path.join(dp, f), encoding='utf-8', errors='replace').read()))
    return words


def _data_strings():
    out = []
    for path in sorted(glob.glob('js/data/**/*.js', recursive=True)):
        base = os.path.basename(path)
        if base.startswith(('ui-strings.', 'safety-text.', 'world-outline')):
            continue
        for m in DATA_LIT.finditer(open(path, encoding='utf-8', errors='replace').read()):
            g = next((x for x in m.groups() if x is not None), None)
            if g is not None and len(g) >= 6 and '${' not in g:
                out.append((path, re.sub(r'\s+', ' ', re.sub(r'\\(.)', r'\1', g)).strip()))
    return out


def _code_literals():
    out = []
    for dp, _, files in os.walk('js'):
        if dp == os.path.join('js', 'data') or dp.startswith(os.path.join('js', 'data') + os.sep):
            continue
        for f in sorted(files):
            if f.endswith('.js') and 'fixture' not in f:
                path = os.path.join(dp, f)
                for m in DATA_LIT.finditer(open(path, encoding='utf-8', errors='replace').read()):
                    g = m.group(1) if m.group(1) is not None else m.group(2)
                    if g is not None and len(g) >= 6:
                        out.append((path, re.sub(r'\s+', ' ', re.sub(r'\\(.)', r'\1', g)).strip()))
    return out


def composed_strings(dicts, harvest, problems):
    """Item 8: pattern keys. Slots agree between key and value, the key can be found, its words still occur in the code, and no string in js/data/
    is one that a pattern for any text would rewrite."""
    keys = sorted({k for c in harvest for k in dicts[c] if SLOT.search(k)})
    if not keys:
        return
    pats = {}
    for k in keys:
        p = pattern_of(k)
        if p is None:
            continue
        pats[k] = p
        if k != k.strip():
            problems.append(f'pattern {k[:50]!r}: begins or ends with a space')
        if len(set(p['slots'])) != len(p['slots']):
            problems.append(f'pattern {k[:50]!r}: a slot is used twice')
        if p['reach'] == 'refused':
            problems.append(f'pattern {k[:50]!r}: begins and ends with a slot and has too little fixed text to be found (js/i18n.js ignores it)')
        for c in harvest:
            v = dicts[c].get(k)
            if v is not None and sorted(SLOT.findall(v)) != sorted(SLOT.findall(k)):
                problems.append(f'pattern {k[:50]!r} in {c}: the value has slots {sorted(SLOT.findall(v))}, the key {sorted(SLOT.findall(k))}')
    code = _code_words()
    for k in pats:
        words = [w.lower() for w in re.findall(r'[^\W\d_]{4,}', ' '.join(pats[k]['lits']))]
        gone = [w for w in words if w not in code]
        if words and len(gone) / len(words) > 0.2:
            problems.append(f'pattern {k[:50]!r}: {gone[:3]} no longer occur in the code (the screen changed: update the key)')
    wide = {k: p for k, p in pats.items() if p['reach'] == 'anywhere'}
    heads, tails, mids = {}, {}, []
    for k, p in wide.items():
        if p['head']:
            heads.setdefault(p['head'], []).append((k, p))
        elif p['tail']:
            tails.setdefault(p['tail'], []).append((k, p))
        else:
            mids.append((k, p))
    hits = {}
    for path, s in _data_strings():
        for k, p in heads.get(s[:1], []) + tails.get(s[-1:], []) + [(k, p) for k, p in mids if p['needle'] in s]:
            if p['rx'].match(s):
                hits.setdefault(k, []).append((path, s))
    for k, found in sorted(hits.items()):
        problems.append(f'pattern {k[:50]!r} would rewrite {len(found)} string(s) in js/data/, e.g. {found[0][1][:60]!r} in {found[0][0]}: make it aria-only (fewer fixed words) or split the screen\'s text nodes')
    # A fixed string in the code that is not a key of its own but fits a text-wide pattern would be half translated ("📞 Call the national
    # emergency number" under "📞 Call {0}"): it needs a key of its own, which an exact key beats.
    have = set().union(*(set(dicts[c]) for c in harvest))
    strip = lambda s: re.sub(r'^[^\w\s]+\s+', '', s)
    stray = {}
    for path, s in _code_literals():
        if s in have or strip(s) in have:
            continue
        for k, p in wide.items():
            if (p['rx'].match(s) or p['rx'].match(strip(s))) and not (p['head'] is None and p['tail'] is None and p['needle'] not in s):
                stray.setdefault(k, []).append((path, s))
    for k, found in sorted(stray.items()):
        problems.append(f'pattern {k[:50]!r} would half translate {len(found)} fixed string(s) in the code that have no key, e.g. {found[0][1][:60]!r} in {found[0][0]}: give each its own key')
    print(f'composed strings: {len(pats)} pattern keys ({len(wide)} apply to any text, {len(pats) - len(wide)} to aria-label only); {len(hits)} collide with js/data/')


def main():
    complete = []
    if '--assert-complete' in sys.argv:
        complete = [c for c in sys.argv[sys.argv.index('--assert-complete') + 1].split(',') if c]
    problems = []
    i18n = open(I18N, encoding='utf-8').read()
    manifest = open(MANIFEST, encoding='utf-8').read()

    m = re.search(r'UI_STRING_MACHINE = \[(.*?)\];', manifest, re.S)
    machine = set(re.findall(r"'([A-Za-z-]+)'", m.group(1))) if m else set()

    registry = dict(re.findall(r"code: '([^']+)'[^}]*?ui: (true|false)", i18n))
    ui_true = {c for c, v in registry.items() if v == 'true'} - {'en'}

    lm = re.search(r'UI_STRING_LANGS = \[(.*?)\];', manifest, re.S)
    listed = re.findall(r"'([A-Za-z-]+)'", lm.group(1)) if lm else []
    on_disk = {}
    for path in sorted(glob.glob(STRINGS_GLOB)):
        code = os.path.basename(path)[len('ui-strings.'):-len('.js')]
        on_disk[code] = path

    # The manifest, the files on disk, and the registry must agree. Any disagreement offers the
    # traveller a language that resolves to a 404 (dead picker row) or ships a dictionary that
    # can never load, and both fail silently as "everything is in English".
    for code in sorted(set(listed) - set(on_disk)):
        problems.append(f'{code}: listed in UI_STRING_LANGS but js/data/ui-strings.{code}.js is missing')
    for code in sorted(set(on_disk) - set(listed)):
        problems.append(f'{code}: js/data/ui-strings.{code}.js exists but is not in UI_STRING_LANGS, it will never load')

    dicts = {}
    for code, path in on_disk.items():
        body = open(path, encoding='utf-8').read()
        kv = pairs(body[body.index('export const STRINGS = {'):])
        keys = [k for k, _ in kv]
        dupes = {k for k in keys if keys.count(k) > 1}
        if dupes:
            problems.append(f'{code}: duplicate keys (JS keeps only the last): {sorted(dupes)}')
        dicts[code] = dict(kv)

    # 1. registry / dictionary agreement
    for code in sorted(ui_true - set(dicts)):
        problems.append(f'{code}: marked ui:true but has no dictionary, the picker would offer a dead choice')
    for code in sorted(set(dicts) - ui_true):
        problems.append(f'{code}: has a dictionary but is not marked ui:true, it will never be offered')

    if not dicts:
        problems.append('no dictionaries parsed at all, has the file format changed?')
        print('\n'.join(problems))
        return 1

    # 2. key parity. The canonical set is what the host languages (UI_STRING_MACHINE) hold between them; they must agree exactly.
    #    Any other language may omit a key (decision 30): an omitted key counts as a null.
    harvest = sorted(c for c in dicts if c in machine) or sorted(dicts)
    canon = set().union(*(set(dicts[c]) for c in harvest))
    print(f'canonical set: {len(canon)} keys, the union of {", ".join(harvest)}\n')
    for code in sorted(dicts):
        missing = canon - set(dicts[code])
        extra = set(dicts[code]) - canon
        tolerated = code not in harvest
        status = 'OK  ' if (not missing or tolerated) and not extra else 'FAIL'
        nulls = sum(1 for v in dicts[code].values() if v is None)
        line = f'{status} {code:6s} {len(dicts[code]):4d} keys'
        if nulls:
            line += f', {nulls} null (shown in English)'
        if missing and tolerated:
            line += f', {len(missing)} absent (shown in English)'
        print(line)
        if (nulls or (missing and tolerated)) and code in complete:
            problems.append(f'{code}: {nulls + (len(missing) if tolerated else 0)} key(s) still null or absent, and --assert-complete names this language')
        if missing and not tolerated:
            problems.append(f'{code}: missing {len(missing)} key(s): {sorted(missing)[:8]}'
                            + (' …' if len(missing) > 8 else ''))
        if extra:
            problems.append(f'{code}: has {len(extra)} key(s) no host language has: {sorted(extra)[:8]}')

    # 3/4. empty or untranslated-looking values
    for code in sorted(dicts):
        allowed = ALLOWED_IDENTICAL.get(code, set())
        for k, v in dicts[code].items():
            if v is None:
                continue
            if not v.strip():
                problems.append(f'{code}: empty value for {k!r}')
            elif v == k and k not in allowed and code not in ('en',):
                # Identical is only suspicious for a language that does not share the Latin
                # alphabet with English; for German or Dutch it is often simply correct.
                if code in ('th', 'vi', 'km', 'lo', 'zh-CN', 'zh-TW', 'ko', 'ja', 'hi', 'ru',
                            'he', 'ar', 'fa', 'ur', 'uk', 'bn'):
                    problems.append(f'{code}: {k!r} is identical to the English, untranslated?')

    # 8. composed strings: keys with {0}, {1} slots (F5c)
    composed_strings(dicts, harvest, problems)

    # 6. the machine-translation register
    safety = safety_text(problems)
    if os.path.exists(REGISTER):
        reg = json.load(open(REGISTER, encoding='utf-8'))
        seen = {}
        n_safety = 0
        for e in reg.get('entries', []):
            lang, key = e.get('lang'), e.get('key')
            src = e.get('source') or 'ui-strings'
            if lang not in dicts:
                problems.append(f'review register: unknown language {lang!r}')
            elif src == 'safety-text':
                n_safety += 1
                if key not in safety.get(lang, {}):
                    problems.append(f'review register: {lang} names a safety-text key the file does not hold: {key[:60]!r}')
            elif key not in dicts[lang]:
                problems.append(f'review register: {lang} names a key the dictionary does not hold: {key!r}')
            elif dicts[lang][key] is None:
                problems.append(f'review register: {lang} {key!r} is null in the dictionary but registered as machine-made')
            if not e.get('machine') or not e.get('date'):
                problems.append(f'review register: {lang} {key!r} lacks machine/date')
            if (lang, key, src) in seen:
                problems.append(f'review register: duplicate entry {lang} {key!r}')
            seen[(lang, key, src)] = 1
        for lang, kv in safety.items():
            for key in kv:
                if (lang, key, 'safety-text') not in seen:
                    problems.append(f'review register: {lang} safety text {key[:60]!r} has no register entry')
        reg_langs = {e.get('lang') for e in reg.get('entries', [])}
        for code in sorted(reg_langs - machine):
            problems.append(f'{code}: has machine-made entries in the register but is not in UI_STRING_MACHINE')
        for code in sorted(machine - reg_langs):
            problems.append(f'{code}: listed in UI_STRING_MACHINE but has no entry in the register')
        print(f'review register: {len(reg.get("entries", []))} machine-made entries in {len(reg_langs)} language(s), {n_safety} of them safety text')
    elif machine:
        problems.append('UI_STRING_MACHINE is not empty but scripts/ui-strings-review.json is missing')

    print()
    if problems:
        print(f'{len(problems)} problem(s):')
        for p in problems:
            print('  - ' + p)
        return 1
    print(f'PASS: {len(dicts)} languages, {len(canon)} keys in the host languages, registry agrees.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
