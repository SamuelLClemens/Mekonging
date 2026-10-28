#!/usr/bin/env python3
"""Validate the interface-translation dictionaries against the language registry.

    python3 scripts/check-ui-strings.py

Exits non-zero on any problem, so it can gate a commit or a deploy.

WHY THIS EXISTS. js/i18n.js translates the finished DOM by exact-matching English strings
against js/data/ui-strings.<code>.js. That design has one failure mode worth guarding: a language can
drift out of parity — a key added to English and to fifteen dictionaries but not the
sixteenth — and NOTHING breaks. The missing key just falls back to English, so a Korean
traveller silently gets one English word in the middle of a Korean screen and no error is
raised anywhere. A count is the only thing that makes that visible, so this counts.

Checks performed:
  1. Every language marked `ui: true` in the registry actually has a dictionary, and every
     dictionary belongs to a language marked `ui: true`. A language claiming a dictionary it
     lacks would offer the user a choice that does nothing.
  2. Key parity against the canonical set (English's own keys, taken from the largest block).
  3. No duplicate keys inside a block — a JS object literal silently keeps only the last, so a
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
# does not list — or a listed language with no file — is itself a failure worth reporting.
STRINGS_GLOB = 'js/data/ui-strings.*.js'

# A block whose language genuinely shares a word with English is not an error. Filipino uses
# the English "Home", "Online", "Offline", "Emergency" and "Accessibility" as ordinary loans,
# and several Latin-script languages spell country names exactly as English does.
ALLOWED_IDENTICAL = {
    'tl': {'Home', 'Online', 'Offline', 'Emergency', 'Accessibility', 'Thailand', 'Vietnam',
           'Cambodia', 'Laos', 'Tourist Police', 'Budget'},
}


def blocks(src):
    """Yield (code, body) for each top-level language block."""
    for m in re.finditer(r"^  '?([A-Za-z-]+)'?: \{(.*?)^  \},$", src, re.S | re.M):
        yield m.group(1), m.group(2)


def pairs(body):
    """(key, value) for every entry; a `null` value comes back as None."""
    out = []
    for k, v, n in re.findall(r"'((?:[^'\\]|\\.)*)':\s*(?:'((?:[^'\\]|\\.)*)'|(null)\b)", body):
        out.append((k, None if n else v))
    return out


REGISTER = 'scripts/ui-strings-review.json'


def main():
    complete = []
    if '--assert-complete' in sys.argv:
        complete = [c for c in sys.argv[sys.argv.index('--assert-complete') + 1].split(',') if c]
    problems = []
    i18n = open(I18N, encoding='utf-8').read()
    manifest = open(MANIFEST, encoding='utf-8').read()

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
        problems.append(f'{code}: js/data/ui-strings.{code}.js exists but is not in UI_STRING_LANGS — it will never load')

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
        problems.append(f'{code}: marked ui:true but has no dictionary — the picker would offer a dead choice')
    for code in sorted(set(dicts) - ui_true):
        problems.append(f'{code}: has a dictionary but is not marked ui:true — it will never be offered')

    if not dicts:
        problems.append('no dictionaries parsed at all — has the file format changed?')
        print('\n'.join(problems))
        return 1

    # 2. key parity against the largest block, which is the de-facto canonical set
    canon_code = max(dicts, key=lambda c: len(dicts[c]))
    canon = set(dicts[canon_code])
    print(f'canonical set: {canon_code} with {len(canon)} keys\n')
    for code in sorted(dicts):
        missing = canon - set(dicts[code])
        extra = set(dicts[code]) - canon
        status = 'OK  ' if not missing and not extra else 'FAIL'
        nulls = sum(1 for v in dicts[code].values() if v is None)
        print(f'{status} {code:6s} {len(dicts[code]):4d} keys' + (f', {nulls} null (shown in English)' if nulls else ''))
        if nulls and code in complete:
            problems.append(f'{code}: {nulls} key(s) still null, and --assert-complete names this language')
        if missing:
            problems.append(f'{code}: missing {len(missing)} key(s): {sorted(missing)[:8]}'
                            + (' …' if len(missing) > 8 else ''))
        if extra:
            problems.append(f'{code}: has {len(extra)} key(s) no other language has: {sorted(extra)[:8]}')

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
                    problems.append(f'{code}: {k!r} is identical to the English — untranslated?')

    # 6. the machine-translation register
    m = re.search(r'UI_STRING_MACHINE = \[(.*?)\];', manifest, re.S)
    machine = set(re.findall(r"'([A-Za-z-]+)'", m.group(1))) if m else set()
    if os.path.exists(REGISTER):
        reg = json.load(open(REGISTER, encoding='utf-8'))
        seen = {}
        for e in reg.get('entries', []):
            lang, key = e.get('lang'), e.get('key')
            if lang not in dicts:
                problems.append(f'review register: unknown language {lang!r}')
            elif key not in dicts[lang]:
                problems.append(f'review register: {lang} names a key the dictionary does not hold: {key!r}')
            elif dicts[lang][key] is None:
                problems.append(f'review register: {lang} {key!r} is null in the dictionary but registered as machine-made')
            if not e.get('machine') or not e.get('date'):
                problems.append(f'review register: {lang} {key!r} lacks machine/date')
            if (lang, key) in seen:
                problems.append(f'review register: duplicate entry {lang} {key!r}')
            seen[(lang, key)] = 1
        reg_langs = {e.get('lang') for e in reg.get('entries', [])}
        for code in sorted(reg_langs - machine):
            problems.append(f'{code}: has machine-made entries in the register but is not in UI_STRING_MACHINE')
        for code in sorted(machine - reg_langs):
            problems.append(f'{code}: listed in UI_STRING_MACHINE but has no entry in the register')
        print(f'review register: {len(reg.get("entries", []))} machine-made entries in {len(reg_langs)} language(s)')
    elif machine:
        problems.append('UI_STRING_MACHINE is not empty but scripts/ui-strings-review.json is missing')

    print()
    if problems:
        print(f'{len(problems)} problem(s):')
        for p in problems:
            print('  - ' + p)
        return 1
    print(f'PASS — {len(dicts)} languages, {len(canon)} keys each, registry agrees.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
