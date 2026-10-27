#!/usr/bin/env python3
"""Keep the icon sprite, js/nav-groups.js and every iconNode()/iconSVG() call in step (S1, docs/PROGRAM.md 5.3 item 5).

    python3 scripts/check-icons.py

An icon that names a symbol the sprite does not hold draws nothing, silently: an empty 20 px square where a control's
icon should be. Three things can drift, and this checks each:
  1. the sprite, icons/ui.svg, holds exactly the glyphs scripts/build-icon-sprite.py lists (no hand edits), each id once,
     and the licence text sits beside it (Lucide is ISC; the glyphs it took from Feather are MIT, and both require it);
  2. every `ic:` emoji in js/nav-groups.js has an `icon:` id beside it, and each id is in the sprite;
  3. every literal id passed to iconNode() or iconSVG() in js/ is in the sprite.
"""
import importlib.util
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as fh:
        return fh.read()


def main():
    bad = []
    spec = importlib.util.spec_from_file_location('sprite_builder', os.path.join(ROOT, 'scripts', 'build-icon-sprite.py'))
    builder = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(builder)

    sprite = read('icons/ui.svg')
    ids = re.findall(r'<symbol id="([a-z0-9-]+)"', sprite)
    if len(ids) != len(set(ids)):
        bad.append('icons/ui.svg: a symbol id appears twice')
    if sorted(ids) != sorted(builder.GLYPHS):
        extra, missing = sorted(set(ids) - set(builder.GLYPHS)), sorted(set(builder.GLYPHS) - set(ids))
        bad.append(f'icons/ui.svg does not match scripts/build-icon-sprite.py GLYPHS (extra: {extra}, missing: {missing}); rebuild it')
    if not os.path.exists(os.path.join(ROOT, 'icons', 'LICENSE-lucide.txt')):
        bad.append('icons/LICENSE-lucide.txt is missing (the ISC and MIT texts must ship with the glyphs)')
    known = set(ids)

    nav = read('js/nav-groups.js')
    nav_code = re.sub(r'//[^\n]*', '', nav)
    ic = len(re.findall(r"\bic:\s*'", nav_code))
    paired = re.findall(r"\bic:\s*'[^']+',\s*icon:\s*'([a-z0-9-]+)'", nav_code)
    if ic != len(paired):
        bad.append(f'js/nav-groups.js: {ic} `ic:` values but {len(paired)} followed by an `icon:` id')
    for i in sorted(set(paired) - known):
        bad.append(f'js/nav-groups.js: icon id "{i}" is not in icons/ui.svg')

    calls = 0
    for base, _, names in os.walk(os.path.join(ROOT, 'js')):
        for n in names:
            if not n.endswith('.js') or n == 'icons.js':
                continue
            rel = os.path.relpath(os.path.join(base, n), ROOT)
            for m in re.finditer(r"\bicon(?:Node|SVG)\(\s*'([^']+)'", read(rel)):
                calls += 1
                if m.group(1) not in known:
                    bad.append(f'{rel}: icon id "{m.group(1)}" is not in icons/ui.svg')
    if bad:
        print('FAIL')
        for b in bad:
            print('  ' + b)
        return 1
    print(f'PASS: {len(ids)} glyphs, {len(paired)} nav-groups icons and {calls} iconNode/iconSVG calls all resolve; licence present.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
