#!/usr/bin/env python3
"""Validate the interface-translation dictionaries against the language registry.

    python3 scripts/check-ui-strings.py

Exits non-zero on any problem, so it can gate a commit or a deploy.

WHY THIS EXISTS. js/i18n.js translates the finished DOM by exact-matching English strings
against js/data/ui-strings.js. That design has one failure mode worth guarding: a language can
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
"""
import json
import re
import sys

I18N = 'js/i18n.js'
STRINGS = 'js/data/ui-strings.js'

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
    return re.findall(r"'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)'", body)


def main():
    problems = []
    i18n = open(I18N, encoding='utf-8').read()
    strings = open(STRINGS, encoding='utf-8').read()

    registry = dict(re.findall(r"code: '([^']+)'[^}]*?ui: (true|false)", i18n))
    ui_true = {c for c, v in registry.items() if v == 'true'} - {'en'}

    dicts = {}
    for code, body in blocks(strings):
        kv = pairs(body)
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
        print(f'{status} {code:6s} {len(dicts[code]):3d} keys')
        if missing:
            problems.append(f'{code}: missing {len(missing)} key(s): {sorted(missing)[:8]}'
                            + (' …' if len(missing) > 8 else ''))
        if extra:
            problems.append(f'{code}: has {len(extra)} key(s) no other language has: {sorted(extra)[:8]}')

    # 3/4. empty or untranslated-looking values
    for code in sorted(dicts):
        allowed = ALLOWED_IDENTICAL.get(code, set())
        for k, v in dicts[code].items():
            if not v.strip():
                problems.append(f'{code}: empty value for {k!r}')
            elif v == k and k not in allowed and code not in ('en',):
                # Identical is only suspicious for a language that does not share the Latin
                # alphabet with English; for German or Dutch it is often simply correct.
                if code in ('th', 'vi', 'km', 'lo', 'zh-CN', 'zh-TW', 'ko', 'ja', 'hi', 'ru',
                            'he', 'ar', 'fa', 'ur', 'uk', 'bn'):
                    problems.append(f'{code}: {k!r} is identical to the English — untranslated?')

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
