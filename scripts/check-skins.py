#!/usr/bin/env python3
"""Verify the theme ids agree everywhere they are written down.

    python3 scripts/check-skins.py

js/theme.js is the table (DEFAULT_SKIN, SKIN_MODE). Four other places repeat its ids, and each can
drift on its own without any page failing to render, because an unknown skin silently falls back to
the default:

  1. css/style.css  — a `:root[data-skin="<id>"]` block per skin. A fixed-mode skin needs a base
                      block; an 'auto' skin needs a base block or BOTH a light and a dark block.
  2. js/screens/settings.js — the Theme picker's options. Every selectable id must be in SKIN_MODE,
                      and every id with a palette must be selectable.
  3. js/theme-boot.js — the first-paint script (Phase 3). Once it exists, every skin id it names
                      must be in SKIN_MODE and it must name DEFAULT_SKIN.
  4. js/state.js    — the default profile's `skin:` must equal DEFAULT_SKIN, and js/main.js must
                      take its table from theme.js rather than carrying a copy.

PENDING lists ids that theme.js defines before their palette lands (Phase 3 of the retro redesign).
They are allowed to have no CSS block and no Settings option, and nothing else. Phase 3 empties it,
and scripts/check-contrast.py has the same set. Exits 1 on any disagreement.
"""
import os
import re
import sys

PENDING = set()
MODES = {'light', 'dark', 'auto'}


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def strip_comments(text):
    text = re.sub(r'/\*.*?\*/', ' ', text, flags=re.S)
    return re.sub(r'(?m)^\s*//.*$', ' ', text)


def main():
    errors = []
    theme = strip_comments(read('js/theme.js'))
    m = re.search(r"export const DEFAULT_SKIN = '(\w+)'", theme)
    if not m:
        print('FAIL — js/theme.js has no DEFAULT_SKIN.')
        return 1
    default = m.group(1)
    m = re.search(r'export const SKIN_MODE = \{([^}]*)\}', theme)
    if not m:
        print('FAIL — js/theme.js has no SKIN_MODE.')
        return 1
    table = dict(re.findall(r"(\w+):\s*'(\w+)'", m.group(1)))
    for sid, mode in table.items():
        if mode not in MODES:
            errors.append(f'theme.js: {sid} has mode {mode!r}, expected one of {sorted(MODES)}')
    if default not in table:
        errors.append(f'theme.js: DEFAULT_SKIN {default!r} is not in SKIN_MODE')
    for sid in PENDING:
        if sid not in table:
            errors.append(f'PENDING names {sid!r}, which theme.js does not define (remove it from both guards)')

    # 1. CSS blocks
    css = strip_comments(read('css/style.css'))
    base, light, dark, anyskin = set(), set(), set(), set()
    for sel in re.findall(r'([^{}]+)\{', css):
        for part in sel.split(','):
            part = part.strip()
            for sid in re.findall(r'data-skin="(\w+)"', part):
                anyskin.add(sid)
            sm = re.match(r'^:root\[data-skin="(\w+)"\](\[data-theme="(light|dark)"\])?$', part)
            if sm:
                if not sm.group(2):
                    base.add(sm.group(1))
                elif sm.group(3) == 'light':
                    light.add(sm.group(1))
                else:
                    dark.add(sm.group(1))
    for sid in sorted(anyskin - set(table)):
        errors.append(f'css: data-skin="{sid}" is styled but theme.js does not define it')
    for sid, mode in table.items():
        if sid in PENDING:
            if sid in base | light | dark:
                errors.append(f'css: {sid} has a block but is still in PENDING (remove it from both guards)')
            continue
        if mode == 'auto':
            if sid not in base and not (sid in light and sid in dark):
                errors.append(f'css: {sid} is an auto skin with neither a base block nor both a light and a dark block')
        elif sid not in base:
            errors.append(f'css: {sid} has no :root[data-skin="{sid}"] block')

    # 2. Settings
    settings = read('js/screens/settings.js')
    offered = set(re.findall(r"opt\('(\w+)'", settings))
    for sid in sorted(offered - set(table)):
        errors.append(f'settings: the Theme picker offers {sid!r}, which theme.js does not define')
    for sid in table:
        if sid not in PENDING and sid not in offered:
            errors.append(f'settings: {sid!r} has a palette but is not in the Theme picker')
    for sid in PENDING & offered:
        errors.append(f'settings: {sid!r} is offered before its palette lands')

    # 3. First-paint script
    boot = 'js/theme-boot.js'
    if os.path.exists(boot):
        text = strip_comments(read(boot))
        named = set(re.findall(r"'(\w+)'", text)) & (set(table) | anyskin)
        for sid in sorted(named - set(table)):
            errors.append(f'theme-boot: names {sid!r}, which theme.js does not define')
        if default not in text:
            errors.append(f'theme-boot: does not name DEFAULT_SKIN {default!r}')
        boot_note = boot
    else:
        boot_note = 'no js/theme-boot.js yet'

    # 4. State and main
    state = re.search(r"skin:\s*'(\w+)'", read('js/state.js'))
    if not state:
        errors.append('state.js: could not find the default profile skin')
    elif state.group(1) != default:
        errors.append(f"state.js: default skin {state.group(1)!r} != DEFAULT_SKIN {default!r}")
    main_js = read('js/main.js')
    if "from './theme.js'" not in main_js:
        errors.append('main.js: does not import js/theme.js')
    if re.search(r'(const|let|var)\s+SKIN_MODE\b', main_js):
        errors.append('main.js: carries its own SKIN_MODE; it must come from js/theme.js')

    if errors:
        print(f'FAIL — {len(errors)} disagreement(s):\n')
        for e in errors:
            print('  ' + e)
        return 1
    live = [s for s in table if s not in PENDING]
    print(f'PASS — {len(table)} ids in js/theme.js ({len(live)} with palettes, {len(table) - len(live)} pending), '
          f'default {default!r}; CSS, Settings, state and main agree ({boot_note}).')
    return 0


if __name__ == '__main__':
    sys.exit(main())
