#!/usr/bin/env python3
"""Build icons/ui.svg, the app's one line-icon sprite, from Lucide (S1, docs/PROGRAM.md 5.3 item 5).

    python3 scripts/build-icon-sprite.py --lucide <dir>   # write icons/ui.svg and icons/LICENSE-lucide.txt
    python3 scripts/build-icon-sprite.py --list           # print the glyph ids and the emoji each replaces

<dir> is an unpacked `lucide-static` npm package (it holds icons/<name>.svg, package.json and LICENSE). Lucide is ISC licensed; the
icons it took from Feather are MIT, and the licence file carries both texts, so the repository records them.
S1 used lucide-static 1.62.0.

The sprite holds only the glyphs in GLYPHS, as <symbol id="<glyph>"> elements with no colour, stroke or size of
their own: a symbol inherits those from the <svg class="icon"> that references it (css/refined.css sets
`--icon-size` 20 px, `--icon-stroke` 1.75 and `currentColor`), so an icon follows the text colour of every skin.
Use one with js/icons.js:  iconNode('compass')  or  iconSVG('compass').

NAV_ICONS is the emoji -> glyph map that js/nav-groups.js `icon:` ids were written from. Emoji stay inside
content; this map is for chrome only. scripts/check-icons.py keeps the sprite, nav-groups.js and every
iconNode()/iconSVG() call in step.
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'icons', 'ui.svg')
LICENSE_OUT = os.path.join(ROOT, 'icons', 'LICENSE-lucide.txt')

# the emoji js/nav-groups.js used as `ic:` -> the glyph that replaces it in chrome
NAV_ICONS = {
    '💰': 'wallet', '💱': 'arrow-left-right', '🏷️': 'tag', '🤝': 'handshake', '🔎': 'search', '🔍': 'search',
    '🍜': 'utensils', '🍢': 'utensils', '🍈': 'apple', '🧂': 'package', '🌿': 'leaf', '⚠️': 'triangle-alert',
    '🧭': 'compass', '🧳': 'luggage', '👣': 'footprints', '✅': 'circle-check', '🎯': 'target', '🌤': 'cloud-sun',
    '📅': 'calendar', '🎉': 'party-popper', '🚌': 'bus', '📋': 'clipboard-list', '🛂': 'stamp', '🗺️': 'map',
    '🗺': 'map', '📊': 'clipboard-list', '📍': 'map-pin', '📌': 'map-pin', '🕒': 'clock', '🏆': 'trophy', '🏅': 'trophy', '🏊': 'waves',
    '🙏': 'landmark', '🛬': 'plane-landing', '📜': 'scroll-text', '♿': 'accessibility', '🍼': 'baby',
    '👪': 'users', '👥': 'users', '📔': 'notebook', '📸': 'camera', '📤': 'share-2', '⭐': 'star',
    '💬': 'message-circle', '🔒': 'lock', '📥': 'inbox', '❤️': 'heart', '⚙️': 'settings', '✉️': 'mail', '❓': 'circle-question-mark',
}
# the five tabs, and the controls every screen draws
CHROME = ['house', 'languages', 'user', 'map-pin', 'compass', 'chevron-down', 'x', 'info', 'arrow-left', 'plus']
GLYPHS = sorted(set(NAV_ICONS.values()) | set(CHROME))


def read(path):
    with open(path, encoding='utf-8') as fh:
        return fh.read()


def main():
    if '--list' in sys.argv:
        for g in GLYPHS:
            print(f'{g:18s}', ' '.join(e for e, v in NAV_ICONS.items() if v == g))
        print(f'{len(GLYPHS)} glyphs')
        return 0
    if '--lucide' not in sys.argv:
        print(__doc__)
        return 2
    pkg = sys.argv[sys.argv.index('--lucide') + 1]
    version = re.search(r'"version":\s*"([\d.]+)"', read(os.path.join(pkg, 'package.json')))
    symbols, missing = {}, []
    for g in GLYPHS:
        path = os.path.join(pkg, 'icons', g + '.svg')
        if not os.path.exists(path):
            missing.append(g)
            continue
        svg = read(path)
        inner = re.search(r'<svg[^>]*viewBox="0 0 24 24"[^>]*>(.*)</svg>', svg, flags=re.S)
        if not inner:
            missing.append(g)
            continue
        symbols[g] = inner.group(1)
    if missing:
        print('FAIL: not in this Lucide version:', ', '.join(missing))
        return 1
    out = ['<?xml version="1.0" encoding="UTF-8"?>',
           f'<!-- Lucide icons (ISC licence; Feather-derived glyphs MIT), lucide-static {version.group(1) if version else "?"}. '
           'Built by scripts/build-icon-sprite.py; licence text in icons/LICENSE-lucide.txt. Do not edit by hand. -->',
           '<svg xmlns="http://www.w3.org/2000/svg">']
    for g in GLYPHS:
        body = ' '.join(re.sub(r'\s+', ' ', symbols[g]).strip().split())
        out.append(f'<symbol id="{g}" viewBox="0 0 24 24">{body}</symbol>')
    out.append('</svg>')
    text = '\n'.join(out) + '\n'
    with open(OUT, 'w', encoding='utf-8') as fh:
        fh.write(text)
    with open(LICENSE_OUT, 'w', encoding='utf-8') as fh:
        fh.write(read(os.path.join(pkg, 'LICENSE')))
    print(f'wrote {OUT}: {len(GLYPHS)} glyphs, {len(text.encode())} bytes')
    return 0


if __name__ == '__main__':
    sys.exit(main())
